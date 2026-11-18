// download-app.js - Botón flotante inteligente de descarga

const STORAGE_KEY = 'easymarket_app_downloaded';
const HIDE_BTN_KEY = 'easymarket_float_btn_hidden';

class DownloadAppManager {
    constructor() {
        this.floatBtn = document.getElementById('floatDownloadBtn');
        this.modal = document.getElementById('downloadModal');
        this.hasDownloaded = this.checkIfDownloaded();
        this.isHidden = this.checkIfHidden();
        this.init();
    }

    // Verificar si ya descargó la app
    checkIfDownloaded() {
        return localStorage.getItem(STORAGE_KEY) === 'true' || 
               sessionStorage.getItem(STORAGE_KEY) === 'true';
    }

    // Verificar si el usuario ocultó el botón en esta sesión
    checkIfHidden() {
        return sessionStorage.getItem(HIDE_BTN_KEY) === 'true';
    }

    // Marcar como descargado
    markAsDownloaded() {
        localStorage.setItem(STORAGE_KEY, 'true');
        sessionStorage.setItem(STORAGE_KEY, 'true');
        this.hasDownloaded = true;
        this.hideFloatButton();
    }

    // Ocultar botón flotante (solo por sesión)
    hideFloatButton() {
        sessionStorage.setItem(HIDE_BTN_KEY, 'true');
        this.isHidden = true;
        if (this.floatBtn) {
            this.floatBtn.style.display = 'none';
        }
    }

    // Mostrar botón flotante
    showFloatButton() {
        if (!this.hasDownloaded && !this.isHidden && this.floatBtn) {
            this.floatBtn.style.display = 'block';
        }
    }

    // Abrir modal
    openModal() {
        if (this.modal) {
            this.modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    // Cerrar modal
    closeModal() {
        if (this.modal) {
            this.modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    // Registrar descarga
    registerDownload() {
        this.markAsDownloaded();
        this.closeModal();
        
        // Mostrar mensaje de éxito
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'success',
                title: '¡Descarga iniciada!',
                text: 'La descarga de EasyMarket App comenzará en breve.',
                confirmButtonColor: '#667eea',
                timer: 3000
            });
        } else {
            alert('¡Descarga iniciada! Gracias por instalar EasyMarket App.');
        }
    }

    // Configurar eventos
    setupEvents() {
        // Botón flotante para abrir modal
        const openModalBtn = document.getElementById('openDownloadModalBtn');
        if (openModalBtn) {
            openModalBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openModal();
            });
        }

        // Botón de cerrar flotante
        const closeFloatBtn = document.getElementById('closeFloatBtn');
        if (closeFloatBtn) {
            closeFloatBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.hideFloatButton();
            });
        }

        // Cerrar modal (botón X)
        const closeModalBtn = document.getElementById('closeDownloadModal');
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => this.closeModal());
        }

        // Cerrar modal al hacer clic en overlay
        const overlay = this.modal?.querySelector('.download-modal-overlay');
        if (overlay) {
            overlay.addEventListener('click', () => this.closeModal());
        }

        // Botón de descarga directa
        const downloadLink = document.getElementById('directDownloadLink');
        if (downloadLink) {
            downloadLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.registerDownload();
                // Simular descarga después de registrar
                setTimeout(() => {
                    window.location.href = downloadLink.getAttribute('href');
                }, 100);
            });
        }

        // Cerrar con tecla ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal?.classList.contains('active')) {
                this.closeModal();
            }
        });
    }

    // Inicializar
    init() {
        this.setupEvents();
        
        // Mostrar botón después de 2 segundos (para no ser intrusivo)
        if (!this.hasDownloaded && !this.isHidden) {
            setTimeout(() => {
                this.showFloatButton();
            }, 2000);
        }
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.downloadApp = new DownloadAppManager();
});
