// js/image-editor.js

/**
 * Abre el editor de imágenes y devuelve un Promise con la imagen recortada.
 * @param {File} file - El archivo de imagen original seleccionado por el usuario.
 * @returns {Promise<File>} - El archivo final recortado.
 */
export function initImageEditor(file) {
    return new Promise((resolve, reject) => {
        const editorContainer = document.getElementById('custom-image-editor');
        const imageElement = document.getElementById('cropper-image');
        const btnSave = document.getElementById('btn-save-crop');
        const btnCancel = document.getElementById('btn-cancel-crop');

        // Generar una URL temporal para la imagen original
        const url = URL.createObjectURL(file);
        imageElement.src = url;

        // Mostrar la interfaz del editor
        editorContainer.style.display = 'block';

        // Inicializar Cropper.js
        let cropper = new Cropper(imageElement, {
            aspectRatio: NaN, // Permite recorte libre
            viewMode: 2,      // Restringe el recorte dentro de los límites del lienzo
            background: true,
            autoCropArea: 0.9
        });

        // Función para limpiar la memoria y ocultar la interfaz
        const cleanup = () => {
            if (cropper) {
                cropper.destroy();
            }
            editorContainer.style.display = 'none';
            URL.revokeObjectURL(url);
            
            // Remover listeners para evitar duplicidad si el usuario sube otra foto
            btnSave.removeEventListener('click', onSave);
            btnCancel.removeEventListener('click', onCancel);
        };

        // Evento: Al guardar el recorte
        const onSave = () => {
            if (!cropper) return;
            
            // Extraer el canvas recortado
            cropper.getCroppedCanvas().toBlob((blob) => {
                if (!blob) {
                    cleanup();
                    return reject(new Error('Fallo al crear la imagen recortada.'));
                }

                // Convertir el Blob resultante de vuelta a un objeto File (para mantener el nombre y tipo)
                const editedFile = new File([blob], file.name, { type: file.type || 'image/jpeg' });
                
                cleanup();
                resolve(editedFile);
            }, file.type || 'image/jpeg', 0.9); // Calidad del 90%
        };

        // Evento: Al cancelar
        const onCancel = () => {
            cleanup();
            reject('cancelado'); // Enviamos un texto de rechazo específico para ignorarlo en silencio
        };

        // Asignar eventos
        btnSave.addEventListener('click', onSave);
        btnCancel.addEventListener('click', onCancel);
    });
}
