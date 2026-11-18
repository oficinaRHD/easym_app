//Configuración de Cropper.js (instancia, opciones)
// cropper-init.js
// Inicializa la instancia de Cropper.js con configuración optimizada para productos

let cropperInstance = null;

const defaultConfig = {
    viewMode: 1,           // Restringe el recorte al área de la imagen
    dragMode: 'crop',      // Modo por defecto: recortar
    autoCropArea: 0.8,     // Área inicial de recorte: 80% de la imagen
    restore: false,        // No restaurar estado anterior
    guides: true,          // Mostrar líneas guía
    center: true,          // Indicador de centro
    highlight: true,       // Resaltar área recortada
    cropBoxMovable: true,  // Permitir mover el área de recorte
    cropBoxResizable: true,// Permitir redimensionar
    toggleDragModeOnDblclick: true,
    ready: function() {
        console.log('Cropper.js listo');
    }
};

/**
 * Inicializa Cropper.js sobre un elemento <img>
 * @param {HTMLImageElement} imageElement - El elemento img target
 * @param {Object} options - Opciones adicionales (opcional)
 * @returns {Cropper} Instancia de Cropper.js
 */
export function iniciarCropper(imageElement, options = {}) {
    // Destruir instancia anterior si existe
    if (cropperInstance) {
        cropperInstance.destroy();
        cropperInstance = null;
    }

    const config = { ...defaultConfig, ...options };

    // Asegurar que la imagen esté completamente cargada
    if (!imageElement.complete || !imageElement.naturalWidth) {
        return new Promise((resolve) => {
            imageElement.onload = () => {
                cropperInstance = new Cropper(imageElement, config);
                resolve(cropperInstance);
            };
        });
    }

    cropperInstance = new Cropper(imageElement, config);
    return cropperInstance;
}

/**
 * Obtiene la instancia actual de Cropper.js
 * @returns {Cropper|null}
 */
export function obtenerCropper() {
    return cropperInstance;
}

/**
 * Destruye la instancia de Cropper.js y limpia memoria
 */
export function destruirCropper() {
    if (cropperInstance) {
        cropperInstance.destroy();
        cropperInstance = null;
    }
}

/**
 * Cambia el aspect ratio del recorte
 * @param {number|null} ratio - Ej: 1 (cuadrado), 4/3, 16/9, NaN (libre)
 */
export function setAspectRatio(ratio) {
    if (cropperInstance) {
        cropperInstance.setAspectRatio(ratio);
    }
}