// ========================
// MODAL DE FILTRADO (reutilizando lógica del modal popular)
// ========================
//const filterBtn = document.getElementById('popularCategoriesBtn'); // El mismo botón o cámbialo si necesitas otro
const filterModal = document.getElementById('filterModal');
const closeFilterModal = document.getElementById('closefilterModal');

// Datos para los filtros
const filterOptions = {
    categorias: [
        { value: "", label: "Todas las categorías" },
        { value: "Alimentos", label: "Alimentos" },
        { value: "Electrónica", label: "Electrónica" },
        { value: "Ropa y Accesorios", label: "Ropa y Accesorios" },
        { value: "Calzado", label: "Calzado" },
        { value: "Hogar y Cocina", label: "Hogar y Cocina" },
        { value: "Belleza y Cuidado Personal", label: "Belleza y Cuidado Personal" },
        { value: "Juguetes y Juegos", label: "Juguetes y Juegos" },
        { value: "Deportes y Aire Libre", label: "Deportes y Aire Libre" },
        { value: "Automotriz", label: "Automotriz" },
        { value: "Electrodomésticos", label: "Electrodomésticos" },
        { value: "Mascotas", label: "Mascotas" },
        { value: "Herramientas y Ferretería", label: "Herramientas y Ferretería" },
        { value: "Arte y Manualidades", label: "Arte y Manualidades" },
        { value: "Tecnología y Gadgets", label: "Tecnología y Gadgets" }
    ],
    provincias: [
        { value: "", label: "Todas las provincias" },
        { value: "Pinar del Río", label: "Pinar del Río" },
        { value: "Artemisa", label: "Artemisa" },
        { value: "La Habana", label: "La Habana" },
        { value: "Mayabeque", label: "Mayabeque" },
        { value: "Matanzas", label: "Matanzas" },
        { value: "Cienfuegos", label: "Cienfuegos" },
        { value: "Villa Clara", label: "Villa Clara" },
        { value: "Sancti Spíritus", label: "Sancti Spíritus" },
        { value: "Ciego de Ávila", label: "Ciego de Ávila" },
        { value: "Camagüey", label: "Camagüey" },
        { value: "Las Tunas", label: "Las Tunas" },
        { value: "Holguín", label: "Holguín" },
        { value: "Granma", label: "Granma" },
        { value: "Santiago de Cuba", label: "Santiago de Cuba" },
        { value: "Guantánamo", label: "Guantánamo" },
        { value: "Isla de la Juventud", label: "Isla de la Juventud" }
    ]
};

// Renderizar el formulario de filtros dentro del modal
function renderFilterForm() {
    const grid = document.getElementById('filterProductGrid');
    if (!grid) return;

    // Crear el panel de filtros con los selects y botones
    grid.innerHTML = `
        <form id="filter-form" class="filter-form-modal" style="
    flex: 1;
    overflow-y: auto;
    padding: 16px 20px;
" >
            <div class="filter-group">
                <label for="categoria">
                    <i class="fas fa-tag"></i> Categoría
                </label>
                <select name="categoria" id="categoria">
                    ${filterOptions.categorias.map(cat =>
        `<option value="${cat.value}">${cat.label}</option>`
    ).join('')}
                </select>
            </div>
            
            <div class="filter-group">
                <label for="provincia">
                    <i class="fas fa-map-marker-alt"></i> Provincia
                </label>
                <select name="provincia" id="provincia">
                    ${filterOptions.provincias.map(prov =>
        `<option value="${prov.value}">${prov.label}</option>`
    ).join('')}
                </select>
            </div>
            
            <div class="filter-actions-modal">
                <button type="submit" class="btn-apply-modal">
                    Aplicar filtros
                </button>
                <button type="button" class="btn-clear-modal" id="clear-filters">
                    <i class="fas fa-eraser"></i> Limpiar
                </button>
            </div>
        </form>
    `;


}

function openFilterModal() {
    if (filterModal) {
        filterModal.classList.add('active');
       
    }
}

function closeFilterModalFunc() {
    if (filterModal) {
        filterModal.classList.remove('active');
       
    }
}

// Exponer la función globalmente
window.openFilterModal = openFilterModal;


if (closeFilterModal) {
    closeFilterModal.addEventListener('click', closeFilterModalFunc);
}

// Cerrar modal al hacer clic en el overlay (si tienes uno)
if (filterModal) {
    filterModal.addEventListener('click', (e) => {
        if (e.target === filterModal) {
            closeFilterModalFunc();
        }
    });
}

// Inicializar
renderFilterForm();

// Ajustar posición en móvil para no molestar bottom nav
if (window.innerWidth <= 768) {
    const style = document.createElement('style');
    style.textContent = `
        .filter-modal.active {
            bottom: 80px;
        }
    `;
    document.head.appendChild(style);
}
