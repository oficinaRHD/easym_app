// action-btns.js

import { supabase } from './supabase.js';

export async function toggleFavorito(productoId) {
    // Obtenemos la sesión actual
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
        // --- CASO: USUARIO LOGUEADO ---
        // Verificamos si ya es favorito en la DB
        const { data: existente, error } = await supabase
            .from('favoritos')
            .select('id')
            .eq('user_id', user.id)
            .eq('producto_id', productoId)
            .maybeSingle();

        if (existente) {
            // Si existe, lo borramos (Toggle off)
            await supabase.from('favoritos').delete().eq('id', existente.id);
            return false; 
        } else {
            // Si no existe, lo insertamos (Toggle on)
            await supabase.from('favoritos').insert([
                { user_id: user.id, producto_id: productoId }
            ]);
            return true;
        }
    } else {
        // --- CASO: INVITADO (LocalStorage) ---
        let favs = JSON.parse(localStorage.getItem('easymarket_favs')) || [];
        const index = favs.indexOf(productoId);

        if (index > -1) {
            favs.splice(index, 1); // Quitar
            localStorage.setItem('easymarket_favs', JSON.stringify(favs));
            return false;
        } else {
            favs.push(productoId); // Agregar
            localStorage.setItem('easymarket_favs', JSON.stringify(favs));
            return true;
        }
    }
}


/**
 * Lógica para compartir un producto usando su código corto
 */
export function compartirProducto(shortCode, nombreProducto) {
    // Construimos la URL
    const urlParaCompartir = `${window.location.origin}/?p=${shortCode}`;
    
    // CORRECCIÓN: Añadimos \n\n al final del texto para separar la URL
    const textoCompartir = `Mira este producto en Easymarket: ${nombreProducto}\n\n`;

    // 1. Verificar si estamos en la aplicación Android (Bridge)
    if (window.AndroidBridge) {
        // Aquí pasamos el texto con el salto de línea ya incluido
        window.AndroidBridge.compartirAndroid(textoCompartir, urlParaCompartir);
    } 
    // 2. API nativa de compartir (Móviles/Chrome)
    else if (navigator.share) {
        navigator.share({
            title: nombreProducto,
            text: textoCompartir, // Ahora lleva el salto de línea
            url: urlParaCompartir
        })
        .then(() => console.log('Producto compartido con éxito'))
        .catch((error) => console.log('Error al compartir:', error));
    } 
    // 3. Fallback: Copiar al portapapeles
    else {
        // Para el portapapeles también es útil que vaya separado
        const mensajeCompleto = `${textoCompartir}${urlParaCompartir}`;
        navigator.clipboard.writeText(mensajeCompleto)
            .then(() => {
                alert('¡Enlace copiado al portapapeles!');
            })
            .catch(err => {
                console.error('Error al copiar:', err);
            });
    }
}
