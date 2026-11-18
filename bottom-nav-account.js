// /js/bottom-nav-account.js
// Componente web para la barra de navegación inferior - VERSIÓN MI CUENTA

class BottomNavAccount extends HTMLElement {
    constructor() {
        super();
        this.currentPage = this.getCurrentPage();
    }

    getCurrentPage() {
        const path = window.location.pathname;
        
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
        return 'home';
    }

    connectedCallback() {
        this.render();
        this.attachEvents();
        this.updateCartBadge();
        
        window.addEventListener('cartUpdated', () => this.updateCartBadge());
    }

    render() {
        const active = this.currentPage;
        
        this.innerHTML = `
            <div class="bottom-nav" id="bottomNavAccount">
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
                        <span class="badge-count" id="accountCartBadge">0</span>
                        <span>Pedidos</span>
                    </button>
                    <button class="nav-item" data-action="logout" id="logoutNavBtn">
                        <i class="fas fa-sign-out-alt"></i>
                        <span>Salir</span>
                    </button>
                </div>
            </div>
        `;
    }

    attachEvents() {
        this.querySelectorAll('.nav-item').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const action = btn.getAttribute('data-action');
                
                this.guardarEstadoActual();
                
                switch(action) {
                    case 'home':
                        window.location.href = 'index.html';
                        break;
                    case 'boulevar':
                        window.location.href = 'boulevar.html';
                        break;
                    case 'user':
                        // Ya estamos en mi cuenta
                        break;
                    case 'cart':
                        window.location.href = 'pd.html';
                        break;
                    case 'logout':
                        await this.cerrarSesion();
                        break;
                }
            });
        });
    }

    async cerrarSesion() {
        try {
            // Mostrar confirmación
            const confirmar = await Swal.fire({
                title: '¿Cerrar sesión?',
                text: '¿Estás seguro de que deseas salir de tu cuenta?',
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#ff6b4a',
                cancelButtonColor: '#64748b',
                confirmButtonText: 'Sí, salir',
                cancelButtonText: 'Cancelar'
            });
            
            if (confirmar.isConfirmed) {
                // Mostrar loading
                Swal.fire({
                    title: 'Cerrando sesión...',
                    text: 'Por favor espera',
                    allowOutsideClick: false,
                    didOpen: () => {
                        Swal.showLoading();
                    }
                });
                
                // Importar supabase dinámicamente o usar el global
                const { supabase } = await import('./supabase.js');
                await supabase.auth.signOut();
                
                // Redirigir al index
                window.location.href = 'index.html';
            }
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
            Swal.fire({
                title: 'Error',
                text: 'No se pudo cerrar la sesión. Intenta de nuevo.',
                icon: 'error',
                confirmButtonColor: '#ff6b4a'
            });
        }
    }

    guardarEstadoActual() {
        const estado = {
            url: window.location.href,
            scrollY: window.scrollY,
            timestamp: Date.now()
        };
        
        sessionStorage.setItem(`estado_${window.location.pathname}`, JSON.stringify(estado));
    }

    updateCartBadge() {
        const badge = this.querySelector('#accountCartBadge');
        if (badge) {
            const cartCount = localStorage.getItem('cartCount') || '0';
            badge.textContent = cartCount;
            badge.style.display = cartCount === '0' || !cartCount ? 'none' : 'flex';
        }
    }
}

// Registrar el componente
if (!customElements.get('bottom-nav-account')) {
    customElements.define('bottom-nav-account', BottomNavAccount);
}

// Función global para actualizar badge
window.actualizarBadgeGlobal = (cantidad) => {
    const badge = document.getElementById('accountCartBadge');
    if (badge) {
        badge.textContent = cantidad || '0';
        badge.style.display = cantidad > 0 ? 'flex' : 'none';
    }
    localStorage.setItem('cartCount', cantidad || '0');
};

window.addEventListener('cartUpdated', (e) => {
    const cantidad = e.detail?.cantidad || localStorage.getItem('cartCount') || '0';
    window.actualizarBadgeGlobal(cantidad);
});
