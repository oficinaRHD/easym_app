// quick-tags.js - Lógica para filtros rápidos

document.addEventListener('DOMContentLoaded', () => {
    // 1. Capturamos los enlaces por su texto (o puedes añadir IDs en el HTML)
    const quickLinks = document.querySelectorAll('.quick-tags a');

    quickLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const tag = e.target.textContent.trim().toLowerCase();

            let filtroEspecial = { tipo: 'especial', valor: '' };

            if (tag === 'ofertas') {
                filtroEspecial.valor = 'ofertas';
            } 
            else if (tag === 'novedades') {
                filtroEspecial.valor = 'novedades';
            }

            // Si es un tag que manejamos, lanzamos el grito
            if (filtroEspecial.valor) {
                window.dispatchEvent(new CustomEvent('ejecutarFiltrado', {
                    detail: filtroEspecial
                }));

                // Opcional: Cerrar menú lateral en móviles
                const sideMenu = document.getElementById('sideMenu');
                if (sideMenu && sideMenu.classList.contains('open')) {
                    // Aquí llamarías a tu función de cerrar menú
                }
            }
        });
    });
});
