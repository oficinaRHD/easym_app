// cropper-utils.js
// Funciones utilitarias para manipular el cropper y exportar resultados

import { obtenerCropper } from './cropper-init.js';

/**
 * Rota la imagen 90° en sentido antihorario
 */
export function rotarIzquierda() {
    const cropper = obtenerCropper();
    if (cropper) cropper.rotate(-90);
}

/**
 * Rota la imagen 90° en sentido horario
 */
export function rotarDerecha() {
    const cropper = obtenerCropper();
    if (cropper) cropper.rotate(90);
}

/**
 * Zoom in (acercar)
 */
export function zoomIn() {
    const cropper = obtenerCropper();
    if (cropper) cropper.zoom(0.1);
}

/**
 * Zoom out (alejar)
 */
export function zoomOut() {
    const cropper = obtenerCropper();
    if (cropper) cropper.zoom(-0.1);
}

/**
 * Resetea el cropper a estado inicial
 */
export function resetear() {
    const cropper = obtenerCropper();
    if (cropper) cropper.reset();
}

/**
 * Cambia a recorte libre (sin aspect ratio fijo)
 */
export function setRecorteLibre() {
    const cropper = obtenerCropper();
    if (cropper) cropper.setAspectRatio(NaN);
}

/**
 * Cambia a recorte cuadrado 1:1
 */
export function setRecorteCuadrado() {
    const cropper = obtenerCropper();
    if (cropper) cropper.setAspectRatio(1);
}

/**
 * Cambia a recorte 4:3 (ideal para productos)
 */
export function setRecorteProducto() {
    const cropper = obtenerCropper();
    if (cropper) cropper.setAspectRatio(4 / 3);
}

/**
 * Obtiene la imagen recortada como Blob (para subir al servidor)
 * @param {string} type - Tipo MIME ('image/jpeg' o 'image/png')
 * @param {number} quality - Calidad 0-1 (solo para JPEG)
 * @returns {Promise<Blob>}
 */
export function obtenerImagenRecortada(type = 'image/jpeg', quality = 0.92) {
    return new Promise((resolve, reject) => {
        const cropper = obtenerCropper();
        if (!cropper) {
            reject(new Error('Cropper no inicializado'));
            return;
        }

        // Obtener canvas con el recorte
        const canvas = cropper.getCroppedCanvas({
            fillColor: '#fff',     // Fondo blanco para JPEG
            imageSmoothingEnabled: true,
            imageSmoothingQuality: 'high'
        });

        if (!canvas) {
            reject(new Error('No se pudo generar el canvas'));
            return;
        }

        canvas.toBlob(
            (blob) => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error('Error al generar blob'));
                }
            },
            type,
            quality
        );
    });
}

/**
 * Obtiene la imagen recortada como File (para reemplazar en input file)
 * @param {string} nombreOriginal - Nombre del archivo original
 * @param {string} type - Tipo MIME
 * @param {number} quality - Calidad
 * @returns {Promise<File>}
 */
export async function obtenerImagenComoFile(nombreOriginal = 'imagen-editada.jpg', type = 'image/jpeg', quality = 0.92) {
    const blob = await obtenerImagenRecortada(type, quality);
    // FIX: Forzar el type correcto. El blob puede venir sin type o con type vacío.
    const finalType = (blob.type && blob.type.startsWith('image/')) ? blob.type : type;
    return new File([blob], nombreOriginal, { type: finalType });
}

/**
 * Obtiene DataURL de la imagen recortada (para preview rápido)
 * @returns {string} DataURL
 */
export function obtenerDataURL() {
    const cropper = obtenerCropper();
    if (!cropper) return null;

    const canvas = cropper.getCroppedCanvas({
        maxWidth: 800,   // Limitar para preview
        maxHeight: 800
    });

    return canvas ? canvas.toDataURL('image/jpeg', 0.8) : null;
}
