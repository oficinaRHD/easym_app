// /js/bottom-nav.js
// Componente web para la barra de navegación inferior

class BottomNav extends HTMLElement {
    constructor() {
        super();
        this.currentPage = this.getCurrentPage();
    }

    getCurrentPage() {
        const path = window.location.pathname;
        
        // Detectar página actual para el estado active
        if (path.includes('index.html') || path === '/' || path === '/index.html') {
            return 'home';
        }
        if (path.includes('pd.html') || path.includes('pedidos.html')) {
            return 'cart';
        }
        if (path.includes('t-c.html') || path.includes('mi-cuenta.html')) {
            return 'user';
        }
        if (path.includes('boulevar.html')) {
            return 'boulevar';
        }
        if (path.includes('wlst.html')) {
            return 'wishlist';
        }
        return 'home';
    }

    connectedCallback() {
        this.render();
        this.attachEvents();
        this.updateCartBadge();
        
        // Escuchar cambios en el carrito para actualizar badge
        window.addEventListener('cartUpdated', () => this.updateCartBadge());
    }

    render() {
        const active = this.currentPage;
        
        this.innerHTML = `
            <div class="bottom-nav" id="bottomNavGlobal">
                <div class="bottom-nav-items">
                    <button class="nav-item ${active === 'home' ? 'active' : ''}" data-action="home">
                        <i class="fas fa-home gradient-icon"></i>
                        <span>Inicio</span>
                    </button>
                    <button class="nav-item ${active === 'boulevar' ? 'active' : ''}" data-action="boulevar">
                        <i class="fas fa-store"></i>
                        <span>Boulevar</span>
                    </button>
                    <button class="nav-item ${active === 'user' ? 'active' : ''}" data-action="user">
                        <i class="fas fa-user-circle"></i>
                        <span>Cuenta</span>
                    </button>
                    <button class="nav-item relative ${active === 'cart' ? 'active' : ''}" data-action="cart">
                        <i class="fas fa-clipboard-list"></i>
                        <span class="badge-count" id="globalCartBadge">0</span>
                        <span>Pedidos</span>
                    </button>
                </div>
            </div>
        `;
    }

    attachEvents() {
        this.querySelectorAll('.nav-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = btn.getAttribute('data-action');
                
                // Guardar estado actual antes de navegar
                this.guardarEstadoActual();
                
                switch(action) {
                    case 'home':
                        window.location.href = 'index.html';
                        break;
                    case 'menu':
                        this.abrirMenu();
                        break;
                    case 'location':
                        this.abrirModalUbicacion();
                        break;
                    case 'boulevar':
                        window.location.href = 'boulevar.html';
                        break;
                    case 'user':
                        window.location.href = 't-c.html';
                        break;
                    case 'cart':
                        window.location.href = 'pd.html';
                        break;
                }
            });
        });
    }

    guardarEstadoActual() {
        const estado = {
            url: window.location.href,
            scrollY: window.scrollY,
            timestamp: Date.now()
        };
        
        // Guardar estado específico por página
        if (window.location.pathname.includes('boulevar.html')) {
            const tiendaSeleccionada = localStorage.getItem('boulevar_tienda_actual');
            if (tiendaSeleccionada) estado.tiendaId = tiendaSeleccionada;
        }
        
        if (window.location.pathname.includes('t-c.html') || window.location.pathname.includes('mi-cuenta.html')) {
            const ultimaSeccion = sessionStorage.getItem('miCuenta_ultimaSeccion');
            if (ultimaSeccion) estado.seccion = ultimaSeccion;
        }
        
        sessionStorage.setItem(`estado_${window.location.pathname}`, JSON.stringify(estado));
    }

    abrirMenu() {
        // Intentar usar el menú lateral existente
        const sideMenu = document.getElementById('sideMenu');
        const menuOverlay = document.getElementById('menuOverlay');
        
        if (sideMenu && typeof window.toggleMenu === 'function') {
            window.toggleMenu();
        } else if (sideMenu) {
            // Si toggleMenu no existe, abrir manualmente
            sideMenu.classList.add('show');
            if (menuOverlay) menuOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        } else {
            // Si no hay menú en esta página, ir a index
            window.location.href = 'index.html';
        }
    }

    abrirModalUbicacion() {
        const modal = document.getElementById('locationModal');
        if (modal) {
            modal.classList.add('active');
        } else {
            // Si no hay modal en esta página, ir a index
            window.location.href = 'index.html';
        }
    }

    updateCartBadge() {
        const badge = document.getElementById('globalCartBadge');
        if (badge) {
            // Obtener cantidad del carrito desde localStorage o variable global
            const cartCount = localStorage.getItem('cartCount') || '0';
            badge.textContent = cartCount;
            
            if (cartCount === '0' || !cartCount) {
                badge.style.display = 'none';
            } else {
                badge.style.display = 'flex';
            }
        }
    }
}

// Registrar el componente
if (!customElements.get('bottom-nav')) {
    customElements.define('bottom-nav', BottomNav);
}

// Función global para actualizar badge desde cualquier parte
window.actualizarBadgeGlobal = (cantidad) => {
    const badge = document.getElementById('globalCartBadge');
    if (badge) {
        badge.textContent = cantidad || '0';
        if (cantidad > 0) {
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }
    localStorage.setItem('cartCount', cantidad || '0');
};

// Escuchar evento personalizado para actualizar badge
window.addEventListener('cartUpdated', (e) => {
    const cantidad = e.detail?.cantidad || localStorage.getItem('cartCount') || '0';
    window.actualizarBadgeGlobal(cantidad);
});
