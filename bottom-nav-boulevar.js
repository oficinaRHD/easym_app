// /js/bottom-nav-boulevar.js
// Componente específico para Boulevar con selector de tiendas en modal (2 secciones)

import { supabase } from './supabase.js';

class BottomNavBoulevar extends HTMLElement {
    constructor() {
        super();
        this.tiendasFavoritasList = [];
        this.todasLasTiendasList = [];
        this.tiendaSeleccionadaId = null;
    }

    connectedCallback() {
        this.render();
        this.attachEvents();
        this.updateCartBadge();
        this.cargarTiendas();

        window.addEventListener('cartUpdated', () => this.updateCartBadge());
    }

    render() {
        this.innerHTML = `
            <div class="bottom-nav" id="bottomNavBoulevar">
                <div class="bottom-nav-items">
                    <button class="nav-item" data-action="home">
                        <i class="fas fa-home gradient-icon"></i>
                        <span>Inicio</span>
                    </button>
                    <button class="nav-item" data-action="search">
                        <i class="fas fa-search"></i>
                        <span>Buscar</span>
                    </button>
                    <button class="nav-item" data-action="stores" id="storesBtn">
                        <i class="fas fa-store"></i>
                        <span>Tiendas</span>
                    </button>
                    <button class="nav-item" data-action="filters">
                        <i class="fas fa-sliders-h"></i>
                        <span>Filtros</span>
                    </button>
                    <button class="nav-item" data-action="user">
                        <i class="fas fa-user-circle"></i>
                        <span>Cuenta</span>
                    </button>
                    <button class="nav-item relative" data-action="cart">
                        <i class="fas fa-shopping-bag"></i>
                        <span class="badge-count" id="boulevarCartBadge">0</span>
                        <span>Pedidos</span>
                    </button>
                </div>
            </div>

            <!-- Modal de selección de tiendas (2 secciones) -->
            <div id="storesModal" class="stores-modal">
                <div class="stores-modal-content">
                    <div class="stores-modal-header">
                        <h3><i class="fas fa-store"></i> Explorar Tiendas</h3>
                        <button class="stores-modal-close" id="closeStoresModal">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="stores-modal-body">
                        <!-- Buscador global -->
                        <div class="stores-search">
                            <i class="fas fa-search"></i>
                            <input type="text" id="storesSearch" placeholder="Buscar tienda...">
                        </div>

                        <!-- Sección 1: Tiendas Favoritas -->
                        <div class="stores-section" id="sectionFavoritas">
                            <div class="stores-section-header">
                                <i class="fas fa-heart" style="color: #e74c3c;"></i>
                                <h4>Mis Tiendas Favoritas</h4>
                                <span class="stores-count" id="countFavoritas">0</span>
                            </div>
                            <div class="stores-list" id="storesListFavoritas">
                                <div class="stores-loading">Cargando favoritas...</div>
                            </div>
                        </div>

                        <!-- Separador -->
                        <div class="stores-divider"></div>

                        <!-- Sección 2: Todas las Tiendas -->
                        <div class="stores-section" id="sectionTodas">
                            <div class="stores-section-header">
                                <i class="fas fa-globe" style="color: #2563eb;"></i>
                                <h4>Todas las Tiendas</h4>
                                <span class="stores-count" id="countTodas">0</span>
                            </div>
                            <div class="stores-list" id="storesListTodas">
                                <div class="stores-loading">Cargando tiendas...</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Overlay del modal -->
            <div id="storesOverlay" class="stores-overlay"></div>
        `;
    }

    attachEvents() {
        this.querySelectorAll('.nav-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = btn.getAttribute('data-action');

                // Guardar estado actual antes de navegar
                this.guardarEstadoActual();

                switch (action) {
                    case 'home':
                        window.location.href = 'index.html';
                        break;
                    case 'search':
                        this.toggleSearch();
                        break;
                    case 'stores':
                        this.abrirModalTiendas();
                        break;
                    case 'filters':
                        this.abrirFiltros();
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

        const closeBtn = this.querySelector('#closeStoresModal');
        const overlay = this.querySelector('#storesOverlay');

        closeBtn?.addEventListener('click', () => this.cerrarModalTiendas());
        overlay?.addEventListener('click', () => this.cerrarModalTiendas());
    }

    guardarEstadoActual() {
        const estado = {
            url: window.location.href,
            scrollY: window.scrollY,
            timestamp: Date.now()
        };

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

    toggleSearch() {
        const searchContainer = document.getElementById('search-container');
        const searchInput = document.getElementById('local-search');

        if (searchContainer) {
            if (searchContainer.style.display === 'none' || !searchContainer.style.display) {
                searchContainer.style.display = 'block';
                setTimeout(() => searchInput?.focus(), 100);
            } else {
                searchContainer.style.display = 'none';
            }
        }
    }

    abrirFiltros() {
        if (typeof window.openFilterModal === 'function') {
            window.openFilterModal();
        } else {
            console.warn('Modal de filtros no disponible');
        }
    }

    // ===== CARGA DE TIENDAS (AMBAS SECCIONES) =====
    async cargarTiendas() {
        // Cargar favoritas y todas en paralelo
        await Promise.all([
            this.cargarTiendasFavoritas(),
            this.cargarTodasLasTiendas()
        ]);
        
        this.actualizarModalTiendas();
        this.actualizarSelectorOriginal();
    }

    async cargarTiendasFavoritas() {
        try {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                this.tiendasFavoritasList = [];
                return;
            }

            const { data, error } = await supabase.rpc('obtener_tiendas_favoritas', {
                p_user_id: session.user.id
            });

            if (error) throw error;
            this.tiendasFavoritasList = data || [];
        } catch (error) {
            console.error('Error cargando tiendas favoritas:', error);
            this.tiendasFavoritasList = [];
        }
    }

    async cargarTodasLasTiendas() {
        try {
            const { data, error } = await supabase.rpc('obtener_todas_las_tiendas');

            if (error) throw error;
            this.todasLasTiendasList = data || [];
        } catch (error) {
            console.error('Error cargando todas las tiendas:', error);
            this.todasLasTiendasList = [];
        }
    }

    // ===== RENDERIZADO DEL MODAL =====
    actualizarModalTiendas() {
        this.renderizarSeccionFavoritas();
        this.renderizarSeccionTodas();
        this.configurarBusqueda();
    }

    renderizarSeccionFavoritas() {
        const storesList = this.querySelector('#storesListFavoritas');
        const countBadge = this.querySelector('#countFavoritas');
        const section = this.querySelector('#sectionFavoritas');

        if (!storesList) return;

        // Actualizar contador
        if (countBadge) countBadge.textContent = this.tiendasFavoritasList.length;

        // Verificar autenticación
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
                storesList.innerHTML = `
                    <div class="stores-empty">
                        <i class="fas fa-lock"></i>
                        <p>Inicia sesión para ver tus tiendas favoritas</p>
                        <small><a href="/login.html" style="color: #ff6b4a;">Iniciar sesión</a></small>
                    </div>
                `;
                return;
            }

            if (!this.tiendasFavoritasList || this.tiendasFavoritasList.length === 0) {
                storesList.innerHTML = `
                    <div class="stores-empty">
                        <i class="fas fa-heart-broken"></i>
                        <p>No tienes tiendas favoritas</p>
                        <small>Explora y agrega tiendas desde el boulevar</small>
                    </div>
                `;
                return;
            }

            storesList.innerHTML = this.tiendasFavoritasList.map(tienda => this.crearHTMLTienda(tienda, true)).join('');
            this.attachStoreItemEvents(storesList);
        });
    }

    renderizarSeccionTodas() {
        const storesList = this.querySelector('#storesListTodas');
        const countBadge = this.querySelector('#countTodas');

        if (!storesList) return;

        // Actualizar contador
        if (countBadge) countBadge.textContent = this.todasLasTiendasList.length;

        if (!this.todasLasTiendasList || this.todasLasTiendasList.length === 0) {
            storesList.innerHTML = `
                <div class="stores-empty">
                    <i class="fas fa-store-slash"></i>
                    <p>No hay tiendas disponibles</p>
                </div>
            `;
            return;
        }

        storesList.innerHTML = this.todasLasTiendasList.map(tienda => this.crearHTMLTienda(tienda, false)).join('');
        this.attachStoreItemEvents(storesList);
    }

    crearHTMLTienda(tienda, esFavorita) {
        const isClosed = tienda.local_status === 'closed';
        const closedBadge = isClosed ? `<span class="store-status-badge closed"><i class="fas fa-store-slash"></i> Cerrada</span>` : '';
        const favoritaBadge = esFavorita ? `<span class="store-status-badge favorita"><i class="fas fa-heart"></i></span>` : '';
        
        return `
            <div class="store-item ${isClosed ? 'store-closed' : ''}" data-id="${tienda.tienda_id}" data-nombre="${(tienda.nombre_tienda || '').toLowerCase()}">
                <div class="store-logo">
                    <img src="${tienda.logo_url || '/img/placeholder.png'}" 
                         alt="${tienda.nombre_tienda || 'Tienda'}"
                         onerror="this.src='/img/placeholder.png'">
                    ${favoritaBadge}
                </div>
                <div class="store-info">
                    <h4>${tienda.nombre_tienda || `Tienda #${tienda.tienda_id}`}</h4>
                    <p>${tienda.total_productos || 0} productos ${tienda.visitas_tienda ? `• ${tienda.visitas_tienda} visitas` : ''}</p>
                    ${closedBadge}
                </div>
                <i class="fas fa-chevron-right"></i>
            </div>
        `;
    }

    attachStoreItemEvents(container) {
        container.querySelectorAll('.store-item').forEach(item => {
            item.addEventListener('click', () => {
                const tiendaId = item.dataset.id;
                this.seleccionarTienda(tiendaId);
            });
        });
    }

    configurarBusqueda() {
        const searchInput = this.querySelector('#storesSearch');
        if (!searchInput) return;

        // Remover evento anterior para evitar duplicados
        const newSearchInput = searchInput.cloneNode(true);
        searchInput.parentNode.replaceChild(newSearchInput, searchInput);

        newSearchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase().trim();
            
            // Filtrar ambas secciones
            ['storesListFavoritas', 'storesListTodas'].forEach(listId => {
                const list = this.querySelector(`#${listId}`);
                if (!list) return;
                
                const items = list.querySelectorAll('.store-item');
                let visibleCount = 0;
                
                items.forEach(item => {
                    const nombre = item.dataset.nombre || '';
                    const isVisible = !term || nombre.includes(term);
                    item.style.display = isVisible ? 'flex' : 'none';
                    if (isVisible) visibleCount++;
                });

                // Mostrar mensaje si no hay resultados en esta sección
                const emptyMsg = list.querySelector('.stores-empty-search');
                if (visibleCount === 0 && items.length > 0) {
                    if (!emptyMsg) {
                        const msg = document.createElement('div');
                        msg.className = 'stores-empty-search';
                        msg.innerHTML = `<p style="padding: 12px; color: #999; text-align: center;">Sin coincidencias</p>`;
                        list.appendChild(msg);
                    }
                } else if (emptyMsg) {
                    emptyMsg.remove();
                }
            });
        });
    }

    // ===== ACTUALIZAR SELECTOR ORIGINAL (desktop) =====
    actualizarSelectorOriginal() {
        const selectOriginal = document.getElementById('tiendas-favoritas-select');
        if (!selectOriginal) return;

        // Combinar ambas listas para el selector, favoritas primero
        const tiendasCombinadas = [
            ...this.tiendasFavoritasList.map(t => ({ ...t, es_favorita: true })),
            ...this.todasLasTiendasList.filter(t => 
                !this.tiendasFavoritasList.some(f => f.tienda_id === t.tienda_id)
            ).map(t => ({ ...t, es_favorita: false }))
        ];

        selectOriginal.innerHTML = '<option value="" disabled selected>Selecciona una tienda</option>';

        if (tiendasCombinadas.length > 0) {
            // Grupo favoritas
            if (this.tiendasFavoritasList.length > 0) {
                const optGroupFav = document.createElement('optgroup');
                optGroupFav.label = '⭐ Mis Favoritas';
                this.tiendasFavoritasList.forEach(tienda => {
                    const opt = document.createElement('option');
                    opt.value = tienda.tienda_id;
                    opt.textContent = this.formatearNombreTienda(tienda);
                    optGroupFav.appendChild(opt);
                });
                selectOriginal.appendChild(optGroupFav);
            }

            // Grupo todas
            const optGroupTodas = document.createElement('optgroup');
            optGroupTodas.label = '🌐 Todas las Tiendas';
            const tiendasNoFav = tiendasCombinadas.filter(t => !t.es_favorita);
            tiendasNoFav.forEach(tienda => {
                const opt = document.createElement('option');
                opt.value = tienda.tienda_id;
                opt.textContent = this.formatearNombreTienda(tienda);
                optGroupTodas.appendChild(opt);
            });
            if (tiendasNoFav.length > 0) {
                selectOriginal.appendChild(optGroupTodas);
            }
        } else {
            const opt = document.createElement('option');
            opt.value = '';
            opt.disabled = true;
            opt.textContent = 'No hay tiendas disponibles';
            selectOriginal.appendChild(opt);
        }
    }

    formatearNombreTienda(tienda) {
        let texto = tienda.nombre_tienda || `Tienda #${tienda.tienda_id}`;
        if (tienda.total_productos > 0) {
            texto += ` (${tienda.total_productos} productos)`;
        }
        if (tienda.local_status === 'closed') {
            texto += ' [Cerrada]';
        }
        return texto;
    }

    abrirModalTiendas() {
        const modal = this.querySelector('#storesModal');
        const overlay = this.querySelector('#storesOverlay');

        if (modal && overlay) {
            this.actualizarModalTiendas();
            modal.classList.add('active');
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';

            const searchInput = this.querySelector('#storesSearch');
            if (searchInput) searchInput.value = '';
        }
    }

    cerrarModalTiendas() {
        const modal = this.querySelector('#storesModal');
        const overlay = this.querySelector('#storesOverlay');

        if (modal && overlay) {
            modal.classList.remove('active');
            overlay.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    }

    seleccionarTienda(tiendaId) {
        // Guardar en localStorage
        localStorage.setItem('boulevar_tienda_actual', tiendaId);

        // Llamar a la función global de boulevar.js
        if (typeof window.cargarTiendaPorId === 'function') {
            window.cargarTiendaPorId(parseInt(tiendaId));
        }

        // Actualizar selectores
        const selectDesktop = document.getElementById('tiendas-favoritas-select');
        if (selectDesktop) selectDesktop.value = tiendaId;

        this.cerrarModalTiendas();
    }

    updateCartBadge() {
        const badge = this.querySelector('#boulevarCartBadge');
        if (badge) {
            const cartCount = localStorage.getItem('cartCount') || '0';
            badge.textContent = cartCount;
            badge.style.display = cartCount === '0' || !cartCount ? 'none' : 'flex';
        }
    }
}

if (!customElements.get('bottom-nav-boulevar')) {
    customElements.define('bottom-nav-boulevar', BottomNavBoulevar);
}
