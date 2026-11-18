//Genera el HTML del modal Bootstrap, botones, eventos UI
// image-editor-ui.js
// Genera el modal Bootstrap 4 para el editor de imágenes
// No depende de Cropper.js, solo crea la estructura DOM

export function crearModalEditor() {
    // Evitar duplicados
    if (document.getElementById('imageEditorModal')) return;

    const modalHTML = `
    <div class="modal fade" id="imageEditorModal" tabindex="-1" role="dialog" aria-labelledby="imageEditorTitle" aria-hidden="true" data-backdrop="static">
        <div class="modal-dialog modal-lg modal-dialog-centered" role="document">
            <div class="modal-content">
                <div class="modal-header bg-primary text-white">
                    <h5 class="modal-title" id="imageEditorTitle">
                        <i class="fas fa-crop-alt"></i> Editar Imagen
                    </h5>
                    <button type="button" class="close text-white" data-dismiss="modal" aria-label="Cerrar" id="btnCerrarModal">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body p-0">
                    <div class="editor-container" style="background:#f8f9fa; padding:20px;">
                        <div class="img-editor-wrapper" style="max-height:500px;">
                            <img id="imageEditorTarget" src="" alt="Imagen a editar" style="max-width:100%; display:block;">
                        </div>
                    </div>
                    <div class="toolbar bg-light border-top p-3 d-flex flex-wrap justify-content-center gap-2">
                        <div class="btn-group mr-2" role="group">
                            <button type="button" class="btn btn-outline-secondary" id="btnZoomIn" title="Acercar">
                                <i class="fas fa-search-plus"></i>
                            </button>
                            <button type="button" class="btn btn-outline-secondary" id="btnZoomOut" title="Alejar">
                                <i class="fas fa-search-minus"></i>
                            </button>
                        </div>
                        <div class="btn-group mr-2" role="group">
                            <button type="button" class="btn btn-outline-secondary" id="btnRotateLeft" title="Rotar izquierda">
                                <i class="fas fa-undo"></i>
                            </button>
                            <button type="button" class="btn btn-outline-secondary" id="btnRotateRight" title="Rotar derecha">
                                <i class="fas fa-redo"></i>
                            </button>
                        </div>
                        <div class="btn-group mr-2" role="group">
                            <button type="button" class="btn btn-outline-secondary" id="btnReset" title="Restaurar">
                                <i class="fas fa-sync-alt"></i> Restaurar
                            </button>
                        </div>
                        <div class="btn-group" role="group">
                            <button type="button" class="btn btn-outline-info" id="btnAspectFree" title="Recorte libre">
                                <i class="fas fa-expand"></i> Libre
                            </button>
                            <button type="button" class="btn btn-outline-info" id="btnAspectSquare" title="Recorte cuadrado">
                                <i class="fas fa-square"></i> 1:1
                            </button>
                            <button type="button" class="btn btn-outline-info" id="btnAspectProduct" title="Recorte 4:3">
                                <i class="fas fa-image"></i> 4:3
                            </button>
                        </div>
                    </div>
                </div>
                <div class="modal-footer bg-light">
                    <button type="button" class="btn btn-outline-secondary" data-dismiss="modal" id="btnCancelarEdicion">
                        <i class="fas fa-times"></i> Cancelar
                    </button>
                    <button type="button" class="btn btn-success" id="btnAplicarCambios">
                        <i class="fas fa-check"></i> Aplicar Cambios
                    </button>
                </div>
            </div>
        </div>
    </div>`;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = modalHTML;
    document.body.appendChild(wrapper.firstElementChild);
}

export function obtenerElementosUI() {
    return {
        modal: document.getElementById('imageEditorModal'),
        imagenTarget: document.getElementById('imageEditorTarget'),
        btnZoomIn: document.getElementById('btnZoomIn'),
        btnZoomOut: document.getElementById('btnZoomOut'),
        btnRotateLeft: document.getElementById('btnRotateLeft'),
        btnRotateRight: document.getElementById('btnRotateRight'),
        btnReset: document.getElementById('btnReset'),
        btnAspectFree: document.getElementById('btnAspectFree'),
        btnAspectSquare: document.getElementById('btnAspectSquare'),
        btnAspectProduct: document.getElementById('btnAspectProduct'),
        btnAplicar: document.getElementById('btnAplicarCambios'),
        btnCancelar: document.getElementById('btnCancelarEdicion')
    };
}

export function mostrarModal() {
    $('#imageEditorModal').modal('show');
}

export function ocultarModal() {
    $('#imageEditorModal').modal('hide');
}

export function destruirModal() {
    const modal = document.getElementById('imageEditorModal');
    if (modal) {
        $('#imageEditorModal').modal('dispose');
        modal.remove();
    }
}