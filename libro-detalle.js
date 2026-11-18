import { supabase } from './js/supabase.js';

const params = new URLSearchParams(window.location.search);
const libroId = params.get('id');

async function cargarPaginaLibro() {
    const { data: { user } } = await supabase.auth.getUser();
    
    // LLAMADA MAESTRA AL RPC
    const { data, error } = await supabase.rpc('obtener_detalle_libro', {
        p_libro_id: parseInt(libroId),
        p_usuario_id: user?.id || null
    });

    if (error || !data.libro) {
        window.location.href = 'libros.html';
        return;
    }

    renderizarLibro(data);
}

// Función para Seguir / Dejar de seguir
async function toggleBiblioteca(libroId, yaSigue) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("Inicia sesión para guardar en favoritos");

    if (yaSigue) {
        await supabase.from('biblioteca')
            .delete()
            .eq('UsuarioId', user.id)
            .eq('LibroId', libroId);
    } else {
        await supabase.from('biblioteca')
            .insert({ UsuarioId: user.id, LibroId: libroId });
    }
    location.reload(); // Recarga simple para actualizar estado
}

// Función para calificar con estrellas
async function enviarValoracion(libroId, estrellas) {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase.from('valoraciones').insert({
        LibroId: libroId,
        UsuarioId: user.id,
        Valoracion: estrellas
    });

    if (error) {
        alert("Ya has valorado este libro o hubo un error.");
    } else {
        alert("¡Gracias por tu valoración!");
        location.reload();
    }
}


function renderizarLibro(data) {
    const { libro, capitulos, stats, usuario_data, relacionados } = data;

    // 1. Hero y Portada
    document.title = `${libro.Titulo} | Reader+`;
    document.querySelector('.hero-blur').style.backgroundImage = `url(${libro.Portada})`;
    document.querySelector('.main-cover').src = libro.Portada;
    document.querySelector('.hero h1').textContent = libro.Titulo;
    document.querySelector('.author').textContent = `Por ${libro.Autor}`;

    // 2. Stats
    document.getElementById('stat-promedio').textContent = `⭐ ${stats.promedio || 0}`;
    document.getElementById('stat-votos').textContent = `${stats.total_votos} Reseñas`;
    document.getElementById('stat-capitulos').textContent = capitulos?.length || 0;

    // 3. Botón Seguir (Lógica de Toggle)
    const btnFollow = document.getElementById('btnFollow');
    if (usuario_data.siguiendo) {
        btnFollow.textContent = 'Siguiendo';
        btnFollow.classList.add('active');
    }

    // 4. Capítulos
    const containerCaps = document.querySelector('.chapter-grid');
    containerCaps.innerHTML = capitulos.map(c => `
        <a href="capitulo.html?id=${c.CapituloId}" class="chapter-card">
            <span>
                <span class="ch-num">${String(c.Numero).padStart(2, '0')}</span>
                <span class="ch-title">${c.Titulo}</span>
            </span>
            <span style="opacity: 0.4;">➜</span>
        </a>
    `).join('');
    
    // 5. Relacionados
    const containerRel = document.querySelector('.author-list');
    if (relacionados) {
        containerRel.innerHTML = relacionados.map(r => `
            <a href="libro.html?id=${r.LibroId}" class="author-item">
                <img src="${r.Portada}" alt="Portada">
                <div class="author-item-info">
                    <h3 class="author-item-title">${r.Titulo}</h3>
                    <p class="author-item-desc">${r.Sinopsis || ''}</p>
                </div>
            </a>
        `).join('');
    }
}

// Inicializar
cargarPaginaLibro();
