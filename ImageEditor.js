// ImageEditor.js
// Clase principal: abre el editor, coordina UI + Cropper, y devuelve resultado
// Uso: const editor = new ImageEditor(); editor.open(file, callback);

import {
    crearModalEditor,
    obtenerElementosUI,
    mostrarModal,
    ocultarModal,
    destruirModal
} from './image-editor-ui.js';

import { iniciarCropper, destruirCropper } from './cropper-init.js';

import {
    rotarIzquierda,
    rotarDerecha,
    zoomIn,
    zoomOut,
    resetear,
    setRecorteLibre,
    setRecorteCuadrado,
    setRecorteProducto,
    obtenerImagenComoFile,
    obtenerDataURL
} from './cropper-utils.js';

export class ImageEditor {
    constructor() {
        this.callback = null;
        this.archivoOriginal = null;
        this.nombreOriginal = '';
        this.listeners = [];
        this.inicializado = false;
        this.procesando = false;
    }

    /**
     * Abre el editor con una imagen
     * @param {File} file - Archivo de imagen seleccionado
     * @param {Function} onComplete - Callback(File|null): recibe imagen editada o null si cancelo
     */
    open(file, onComplete) {
        if (!file || !file.type.startsWith('image/')) {
            console.error('ImageEditor: Se requiere un archivo de imagen valido');
            onComplete(null);
            return;
        }

        // Si hay una operacion en curso, no abrir otro
        if (this.procesando) {
            console.warn('ImageEditor: Ya hay una operacion en curso');
            return;
        }

        this.archivoOriginal = file;
        this.nombreOriginal = file.name;
        this.callback = onComplete;
        this.procesando = false;

        // Crear modal si no existe
        crearModalEditor();
        this._bindEvents();

        // Resetear estado del boton al abrir (por si se quedo deshabilitado)
        this._resetearBotonAplicar();

        // Cargar imagen en el modal
        const ui = obtenerElementosUI();
        const url = URL.createObjectURL(file);
        ui.imagenTarget.src = url;

        // Limpiar display anterior para evitar conflictos visuales
        ui.imagenTarget.style.display = 'none';
        ui.imagenTarget.onload = () => {
            ui.imagenTarget.style.display = 'block';
        };

        // Mostrar modal
        mostrarModal();

        // Inicializar cropper cuando el modal este visible
        $('#imageEditorModal').off('shown.bs.modal').one('shown.bs.modal', () => {
            iniciarCropper(ui.imagenTarget, {
                aspectRatio: NaN // Libre por defecto
            });
        });

        // Limpiar URL cuando se cierre
        $('#imageEditorModal').off('hidden.bs.modal').one('hidden.bs.modal', () => {
            URL.revokeObjectURL(url);
        });
    }

    /**
     * Resetea el boton "Aplicar Cambios" a su estado inicial
     */
    _resetearBotonAplicar() {
        const ui = obtenerElementosUI();
        if (ui.btnAplicar) {
            ui.btnAplicar.disabled = false;
            ui.btnAplicar.innerHTML = '<i class="fas fa-check"></i> Aplicar Cambios';
        }
    }

    /**
     * Vincula los eventos de los botones del toolbar
     */
    _bindEvents() {
        if (this.inicializado) return;

        const ui = obtenerElementosUI();

        // Toolbar: zoom
        this._addListener(ui.btnZoomIn, 'click', zoomIn);
        this._addListener(ui.btnZoomOut, 'click', zoomOut);

        // Toolbar: rotacion
        this._addListener(ui.btnRotateLeft, 'click', rotarIzquierda);
        this._addListener(ui.btnRotateRight, 'click', rotarDerecha);

        // Toolbar: reset
        this._addListener(ui.btnReset, 'click', resetear);

        // Toolbar: aspect ratios
        this._addListener(ui.btnAspectFree, 'click', setRecorteLibre);
        this._addListener(ui.btnAspectSquare, 'click', setRecorteCuadrado);
        this._addListener(ui.btnAspectProduct, 'click', setRecorteProducto);

        // Acciones finales
        this._addListener(ui.btnAplicar, 'click', () => this._aplicarCambios());
        this._addListener(ui.btnCancelar, 'click', () => this._cancelar());

        // Tambien cerrar con la X
        const btnCerrar = document.getElementById('btnCerrarModal');
        if (btnCerrar) {
            this._addListener(btnCerrar, 'click', () => this._cancelar());
        }

        this.inicializado = true;
    }

    /**
     * Aplica los cambios: exporta imagen y cierra
     */
    async _aplicarCambios() {
        if (this.procesando) return;
        this.procesando = true;

        try {
            const ui = obtenerElementosUI();

            // Deshabilitar boton mientras procesa
            ui.btnAplicar.disabled = true;
            ui.btnAplicar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';

            // Obtener imagen editada como File
            const fileEditado = await obtenerImagenComoFile(this.nombreOriginal, 'image/jpeg', 0.92);

            // Cerrar modal y limpiar
            ocultarModal();
            this._limpiar();

            // Devolver al callback
            if (this.callback) {
                this.callback(fileEditado);
            }

        } catch (error) {
            console.error('Error aplicando cambios:', error);
            alert('Error al procesar la imagen. Intenta de nuevo.');

            // Restaurar boton para que pueda reintentar
            this._resetearBotonAplicar();
            this.procesando = false;
        }
    }

    /**
     * Cancela la edicion: devuelve null
     */
    _cancelar() {
        ocultarModal();
        this._limpiar();

        if (this.callback) {
            this.callback(null);
        }
    }

    /**
     * Limpia recursos y eventos
     */
    _limpiar() {
        destruirCropper();

        // Remover listeners
        this.listeners.forEach(({ el, event, fn }) => {
            if (el) el.removeEventListener(event, fn);
        });
        this.listeners = [];

        this.inicializado = false;
        this.callback = null;
        this.archivoOriginal = null;
        this.procesando = false;
    }

    /**
     * Helper para agregar listeners trackeables
     */
    _addListener(element, event, fn) {
        if (!element) return;
        element.addEventListener(event, fn);
        this.listeners.push({ el: element, event, fn });
    }

    /**
     * Destruye completamente el editor y remueve el modal del DOM
     */
    destroy() {
        this._limpiar();
        destruirModal();
    }
}
