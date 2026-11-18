// ========================
// CATEGORÍAS POPULARES (ícono llamita)
// ========================
const popularBtn = document.getElementById('popularCategoriesBtn');
const popularModal = document.getElementById('popularModal');
const popularOverlay = document.getElementById('popularOverlay');
const closePopularModal = document.getElementById('closePopularModal');

// Lista de categorías populares (misma que en categoryBar)
const popularCategories = [
    { name: 'Alimentos', icon: 'fas fa-utensils' },
    { name: 'Electrónica', icon: 'fas fa-microchip' },
    { name: 'Ropa y Accesorios', icon: 'fas fa-tshirt' },
    { name: 'Calzado', icon: 'fas fa-shoe-prints' },
    { name: 'Juguetes y Juegos', icon: 'fas fa-gamepad' },
    { name: 'Automotriz', icon: 'fas fa-car' },
    { name: 'Electrodomésticos', icon: 'fas fa-microphone' },
    { name: 'Mascotas', icon: 'fas fa-paw' },
    { name: 'Herramientas y Ferretería', icon: 'fas fa-tools' },
    { name: 'Tecnología y Gadgets', icon: 'fas fa-laptop-code' }
];

// Renderizar categorías en el modal
function renderPopularCategories() {
    const grid = document.getElementById('popularCategoriesGrid');
    if (!grid) return;
    
    grid.innerHTML = popularCategories.map(cat => `
        <a href="#" class="popular-category-item" data-category="${cat.name}">
            <i class="${cat.icon}"></i>
            <span>${cat.name}</span>
        </a>
    `).join('');
    
    // Agregar event listeners a cada categoría
    document.querySelectorAll('.popular-category-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const categoryName = item.getAttribute('data-category');
            
            // Disparar evento para filtrar productos
            window.dispatchEvent(new CustomEvent('ejecutarFiltrado', {
                detail: { tipo: 'Categoria', valor: categoryName }
            }));
            
            // Cerrar modal
            closePopularModalFunc();
            
            // Cerrar menú lateral si está abierto
            if (typeof window.toggleMenu === 'function' && sideMenu?.classList.contains('show')) {
                window.toggleMenu();
            }
        });
    });
}

function openPopularModal() {
    popularModal.classList.add('active');
    popularOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closePopularModalFunc() {
    popularModal.classList.remove('active');
    popularOverlay.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// Event listeners
if (popularBtn) {
    popularBtn.addEventListener('click', openPopularModal);
}

if (closePopularModal) {
    closePopularModal.addEventListener('click', closePopularModalFunc);
}

if (popularOverlay) {
    popularOverlay.addEventListener('click', closePopularModalFunc);
}

// Inicializar
renderPopularCategories();

// Ajustar posición en móvil para no molestar bottom nav
if (window.innerWidth <= 768) {
    const style = document.createElement('style');
    style.textContent = `
        .popular-floating-btn {
            bottom: 80px;
        }
    `;
    document.head.appendChild(style);
}
