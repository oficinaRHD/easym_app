import { supabase } from './supabase.js';

export async function actualizarContadores() {
    // 1. Usamos getUser para mayor seguridad en la validación de sesión
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
        limpiarBadges();
        return;
    }

    try {
        /**
         * LLAMADA AL SÚPER CONTADOR (RPC)
         * Una sola petición al servidor que ejecuta la lógica de conteo
         * incluyendo la comparación de libros no vistos.
         */
        const { data, error } = await supabase.rpc('obtener_conteos_usuario', { 
            u_id: user.id 
        });

        if (error) throw error;

        // Renderizamos con el objeto JSON retornado: {notificaciones, mensajes, libros}
        renderBadges(data);

    } catch (err) {
        console.error("Error en contadores RPC:", err);
    }
}

function renderBadges(data) {
    let hayPendientes = false;

    const actualizar = (id, valor) => {
        const el = document.getElementById(id);
        if (el) {
            if (valor > 0) {
                el.innerText = valor > 9 ? '9+' : valor;
                el.style.display = 'flex';
                hayPendientes = true;
            } else {
                el.style.display = 'none';
            }
        }
    };

    actualizar('badge-notificaciones', data.notificaciones);
    actualizar('badge-mensajes', data.mensajes);
    actualizar('badge-libros', data.libros);

    // ===== ACTUALIZAR BADGE DEL MENÚ =====
    // Desktop header
    const mBadgeDesktop = document.getElementById('menuBadge');
    if (mBadgeDesktop) mBadgeDesktop.style.display = hayPendientes ? 'flex' : 'none';

    // Mobile bottom-nav (dentro del componente web)
    const bottomNav = document.querySelector('bottom-nav');
    if (bottomNav) {
        bottomNav.updateMenuBadge?.(hayPendientes);
    }

    // Evento global para que cualquier componente escuche
    window.dispatchEvent(new CustomEvent('menuBadgeChanged', { 
        detail: { visible: hayPendientes, counts: data } 
    }));
}

function limpiarBadges() {
    ['badge-notificaciones', 'badge-mensajes', 'badge-libros'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    // Limpiar badge desktop
    const mBadgeDesktop = document.getElementById('menuBadge');
    if (mBadgeDesktop) mBadgeDesktop.style.display = 'none';

    // Limpiar badge bottom-nav
    const bottomNav = document.querySelector('bottom-nav');
    if (bottomNav) {
        bottomNav.updateMenuBadge?.(false);
    }

    window.dispatchEvent(new CustomEvent('menuBadgeChanged', { 
        detail: { visible: false, counts: null } 
    }));
}

