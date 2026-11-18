// image-zoom.js - Versión corregida con iv-viewer
class ImageZoom {
    constructor() {
        this.viewer = null;
        this.initModal();
    }

    initModal() {
        if (!document.getElementById('image-zoom-modal')) {
            this.createModal();
        } else {
            this.modal = document.getElementById('image-zoom-modal');
            this.bindModalEvents();
        }
    }

    createModal() {
        const modalHTML = `
            <div id="image-zoom-modal" class="image-zoom-modal">
                <div class="image-zoom-overlay"></div>
                <div class="image-zoom-container">
                    <button class="image-zoom-close" aria-label="Cerrar">&times;</button>
                    <div class="image-viewer-container" style="width: 100%; height: calc(100% - 60px);"></div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = document.getElementById('image-zoom-modal');
        this.bindModalEvents();
    }

    bindModalEvents() {
        if (!this.modal) return;

        const overlay = this.modal.querySelector('.image-zoom-overlay');
        const closeBtn = this.modal.querySelector('.image-zoom-close');

        const closeModal = () => this.close();

        overlay.addEventListener('click', closeModal);
        closeBtn.addEventListener('click', closeModal);

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.classList.contains('active')) {
                this.close();
            }
        });
    }

    show(imageUrl, altText = 'Imagen ampliada') {
        if (!this.modal) return;

        // Optimizar URL
        let optimizedUrl = imageUrl;
        if (imageUrl && imageUrl.includes('/upload/')) {
            optimizedUrl = imageUrl.replace('/upload/', '/upload/w_1200,c_fill,q_auto,f_auto/');
        } else if (!imageUrl) {
            optimizedUrl = 'img/placeholder.png';
        }

        // Mostrar modal
        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';

        // Esperar a que el modal esté visible
        setTimeout(() => {
            const container = this.modal.querySelector('.image-viewer-container');
            
            // Destruir instancia anterior si existe
            if (this.viewer) {
                this.viewer.destroy();
            }

            // Crear nueva instancia de ImageViewer (no FullScreenViewer)
            if (typeof ImageViewer !== 'undefined') {
                this.viewer = new ImageViewer(container, {
                    zoomValue: 100,
                    maxZoom: 500,
                    zoomOnMouseWheel: true,
                    zoomStep: 50,
                    snapView: true,
                    refreshOnResize: true
                });
                
                // Cargar la imagen
                this.viewer.load(optimizedUrl);
            } else {
                console.error('iv-viewer no está cargado correctamente');
                this.showFallback(optimizedUrl);
            }
        }, 100);
    }

    // Fallback si la librería no carga
    showFallback(imageUrl) {
        const container = this.modal.querySelector('.image-viewer-container');
        if (container) {
            container.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; height: 100%;">
                    <img src="${imageUrl}" style="max-width: 90%; max-height: 90%; object-fit: contain;">
                </div>
            `;
        }
    }

    close() {
        if (!this.modal) return;
        
        this.modal.classList.remove('active');
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
        
        // Destruir instancia
        if (this.viewer) {
            this.viewer.destroy();
            this.viewer = null;
        }
        
        // Limpiar fallback si existe
        const container = this.modal.querySelector('.image-viewer-container');
        if (container && !container.querySelector('.iv-viewer')) {
            container.innerHTML = '';
        }
    }
}

let imageZoomInstance = null;

function setupImageZoomButtons() {
    if (!imageZoomInstance) {
        imageZoomInstance = new ImageZoom();
    }
    
    const zoomButtons = document.querySelectorAll('.img-zoom-btn');
    
    zoomButtons.forEach(btn => {
        if (btn.hasAttribute('data-zoom-initialized')) return;
        
        const container = btn.closest('.product-image-container');
        const img = container?.querySelector('.product-image-thumb');
        
        if (img) {
            const imageUrl = img.src;
            
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                imageZoomInstance.show(imageUrl, img.alt);
            });
            
            btn.setAttribute('data-zoom-initialized', 'true');
        }
    });
}

function initZoomObserver() {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.addedNodes.length) {
                const hasNewCards = Array.from(mutation.addedNodes).some(node => {
                    return node.nodeType === 1 && (
                        node.classList?.contains('product-result-card') ||
                        node.querySelector?.('.product-result-card')
                    );
                });
                
                if (hasNewCards) {
                    setupImageZoomButtons();
                }
            }
        });
    });
    
    const container = document.querySelector('.productos-container');
    if (container) {
        observer.observe(container, { childList: true, subtree: true });
    }
    
    return observer;
}

function initImageZoom() {
    // Verificar que la librería está cargada
    if (typeof ImageViewer === 'undefined') {
        console.warn('iv-viewer no encontrado, usando método fallback');
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setupImageZoomButtons();
            initZoomObserver();
        });
    } else {
        setupImageZoomButtons();
        initZoomObserver();
    }
}

// Inicializar
initImageZoom();
