// js/plantilla-contacto.js
import { supabase } from './supabase.js';

const STORAGE_KEY = 'plantilla_contacto';

// Obtener usuario actual
async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

// Cargar plantilla (local > db)
export async function cargarPlantilla() {
    try {
        const user = await getCurrentUser();
        if (!user) return null;

        // Intentar desde localStorage
        const localData = localStorage.getItem(`${STORAGE_KEY}_${user.id}`);
        if (localData) {
            return JSON.parse(localData);
        }

        // Desde base de datos
        const { data, error } = await supabase
            .from('contact_templates')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

        if (error) throw error;
        
        if (data) {
            localStorage.setItem(`${STORAGE_KEY}_${user.id}`, JSON.stringify(data));
            return data;
        }
        
        return null;
    } catch (error) {
        console.error('Error cargando plantilla:', error);
        return null;
    }
}

// Guardar plantilla
export async function guardarPlantilla(datos) {
    try {
        const user = await getCurrentUser();
        if (!user) throw new Error('Usuario no autenticado');

        const ahora = new Date().toISOString();
        
        // Verificar si ya existe
        const existente = await cargarPlantilla();
        
        let result;
        if (existente?.id) {
            // Actualizar
            result = await supabase
                .from('contact_templates')
                .update({
                    ...datos,
                    updated_at: ahora
                })
                .eq('id', existente.id)
                .select()
                .single();
        } else {
            // Crear nueva
            result = await supabase
                .from('contact_templates')
                .insert({
                    ...datos,
                    user_id: user.id,
                    created_at: ahora,
                    updated_at: ahora
                })
                .select()
                .single();
        }

        if (result.error) throw result.error;
        
        // Guardar en localStorage
        localStorage.setItem(`${STORAGE_KEY}_${user.id}`, JSON.stringify(result.data));
        
        return result.data;
    } catch (error) {
        console.error('Error guardando plantilla:', error);
        throw error;
    }
}

// Eliminar plantilla
export async function eliminarPlantilla() {
    try {
        const user = await getCurrentUser();
        if (!user) throw new Error('Usuario no autenticado');

        const existente = await cargarPlantilla();
        if (!existente?.id) return;

        const { error } = await supabase
            .from('contact_templates')
            .delete()
            .eq('id', existente.id);

        if (error) throw error;
        
        // Limpiar localStorage
        localStorage.removeItem(`${STORAGE_KEY}_${user.id}`);
        
        return true;
    } catch (error) {
        console.error('Error eliminando plantilla:', error);
        throw error;
    }
}

// Aplicar plantilla al formulario
export function aplicarPlantilla(formulario, plantilla) {
    if (!plantilla) return false;
    
    const campos = ['Telefono', 'Telegram', 'Ugps', 'Entrega', 'Provincia'];
    campos.forEach(campo => {
        const input = formulario.querySelector(`#${campo}`);
        if (input && plantilla[campo.toLowerCase()]) {
            input.value = plantilla[campo.toLowerCase()];
        }
    });
    
    return true;
}

// Mostrar modal de edición
export function mostrarModalPlantilla(plantillaActual, onSave, onDelete) {
    // Crear modal si no existe
    let modal = document.getElementById('modal-plantilla');
    if (!modal) {
        const modalHTML = `
            <div id="modal-plantilla" class="modal" tabindex="-1" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:9999;">
                <div style="background:white; max-width:500px; margin:50px auto; border-radius:10px; padding:20px;">
                    <h3><i class="fas fa-address-card"></i> Mi Plantilla de Contacto</h3>
                    <div class="form-group">
                        <label>Teléfono</label>
                        <input type="text" id="edit-telefono" class="form-control">
                    </div>
                    <div class="form-group">
                        <label>Telegram</label>
                        <input type="text" id="edit-telegram" class="form-control">
                    </div>
                    <div class="form-group">
                        <label>Ubicación GPS</label>
                        <input type="text" id="edit-ugps" class="form-control">
                    </div>
                    <div class="form-group">
                        <label>Tipo de Entrega</label>
                        <select id="edit-entrega" class="form-control">
                            <option value="Personal">Recogida Personal</option>
                            <option value="Domicilio">Envío a Domicilio</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Provincia</label>
                        <select id="edit-provincia" class="form-control">
                            <option value="">Selecciona...</option>
                            <option value="Pinar del Río">Pinar del Río</option>
                            <option value="Artemisa">Artemisa</option>
                            <option value="La Habana">La Habana</option>
                            <option value="Mayabeque">Mayabeque</option>
                            <option value="Matanzas">Matanzas</option>
                            <option value="Cienfuegos">Cienfuegos</option>
                            <option value="Villa Clara">Villa Clara</option>
                            <option value="Sancti Spíritus">Sancti Spíritus</option>
                            <option value="Ciego de Ávila">Ciego de Ávila</option>
                            <option value="Camagüey">Camagüey</option>
                            <option value="Las Tunas">Las Tunas</option>
                            <option value="Holguín">Holguín</option>
                            <option value="Granma">Granma</option>
                            <option value="Santiago de Cuba">Santiago de Cuba</option>
                            <option value="Guantánamo">Guantánamo</option>
                        </select>
                    </div>
                    <div style="display:flex; justify-content:space-between; margin-top:20px;">
                        <button id="btn-eliminar-plantilla" class="btn btn-danger">Eliminar</button>
                        <div>
                            <button id="btn-cerrar-modal" class="btn btn-secondary">Cerrar</button>
                            <button id="btn-guardar-plantilla" class="btn btn-primary">Guardar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        modal = document.getElementById('modal-plantilla');
    }
    
    // Llenar datos actuales
    document.getElementById('edit-telefono').value = plantillaActual?.telefono || '';
    document.getElementById('edit-telegram').value = plantillaActual?.telegram || '';
    document.getElementById('edit-ugps').value = plantillaActual?.ugps || '';
    document.getElementById('edit-entrega').value = plantillaActual?.entrega || 'Personal';
    document.getElementById('edit-provincia').value = plantillaActual?.provincia || '';
    
    // Mostrar modal
    modal.style.display = 'block';
    
    // Configurar eventos
    const guardarBtn = document.getElementById('btn-guardar-plantilla');
    const eliminarBtn = document.getElementById('btn-eliminar-plantilla');
    const cerrarBtn = document.getElementById('btn-cerrar-modal');
    
    const newGuardarBtn = guardarBtn.cloneNode(true);
    const newEliminarBtn = eliminarBtn.cloneNode(true);
    const newCerrarBtn = cerrarBtn.cloneNode(true);
    
    guardarBtn.parentNode.replaceChild(newGuardarBtn, guardarBtn);
    eliminarBtn.parentNode.replaceChild(newEliminarBtn, eliminarBtn);
    cerrarBtn.parentNode.replaceChild(newCerrarBtn, cerrarBtn);
    
    newCerrarBtn.onclick = () => {
        modal.style.display = 'none';
    };
    
    newGuardarBtn.onclick = async () => {
        const datos = {
            nombre: 'Mi Plantilla',
            telefono: document.getElementById('edit-telefono').value,
            telegram: document.getElementById('edit-telegram').value,
            ugps: document.getElementById('edit-ugps').value,
            entrega: document.getElementById('edit-entrega').value,
            provincia: document.getElementById('edit-provincia').value
        };
        await onSave(datos);
        modal.style.display = 'none';
    };
    
    if (plantillaActual?.id) {
        newEliminarBtn.onclick = async () => {
            if (confirm('¿Eliminar plantilla?')) {
                await onDelete();
                modal.style.display = 'none';
            }
        };
        newEliminarBtn.style.display = 'inline-block';
    } else {
        newEliminarBtn.style.display = 'none';
    }
}
