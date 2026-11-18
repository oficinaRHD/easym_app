// Agregar al final de producto-form-logic.js
import { cargarPlantilla, guardarPlantilla, eliminarPlantilla, aplicarPlantilla, mostrarModalPlantilla } from './plantilla-contacto.js';

// Configurar botón de plantilla
const btnPlantilla = document.getElementById('btn-aplicar-plantilla');
if (btnPlantilla) {
    btnPlantilla.onclick = async () => {
        const plantilla = await cargarPlantilla();
        
        if (plantilla) {
            // Si existe, aplicar directamente
            if (aplicarPlantilla(document, plantilla)) {
                Swal.fire({
                    icon: 'success',
                    title: 'Plantilla aplicada',
                    timer: 1500,
                    showConfirmButton: false
                });
            }
        } else {
            // Si no existe, ofrecer crear
            const result = await Swal.fire({
                title: 'Sin plantilla',
                text: 'No tienes una plantilla guardada. ¿Deseas crear una con los datos actuales?',
                icon: 'info',
                showCancelButton: true,
                confirmButtonText: 'Sí, crear',
                cancelButtonText: 'Cancelar'
            });
            
            if (result.isConfirmed) {
                const datos = {
                    telefono: document.getElementById('Telefono').value,
                    telegram: document.getElementById('Telegram').value,
                    ugps: document.getElementById('Ugps').value,
                    entrega: document.getElementById('Entrega').value,
                    provincia: document.getElementById('Provincia').value
                };
                
                await guardarPlantilla(datos);
                Swal.fire('¡Creada!', 'Plantilla guardada', 'success');
            }
        }
    };
}

// Botón para gestionar plantilla (puedes agregarlo donde quieras)
// Por ejemplo, un botón en el header-tools de gestión
