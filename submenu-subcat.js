import { supabase } from './supabase.js';

// ============================================
// CONFIGURACIÓN DE CACHÉ LOCAL
// ============================================
const CACHE_CONFIG = {
    version: '1.0.0',
    // TTL personalizados por categoría (en milisegundos)
    ttlPorCategoria: {
        // Categorías que cambian poco (TTL largo)
        'Ropa y Accesorios': 7 * 24 * 60 * 60 * 1000,      // 7 días
        'Hogar y Cocina': 7 * 24 * 60 * 60 * 1000,         // 7 días
        'Arte y Manualidades': 7 * 24 * 60 * 60 * 1000,    // 7 días

        // Categorías que cambian moderadamente
        'Electrónica': 3 * 24 * 60 * 60 * 1000,             // 3 días
        'Tecnología y Gadgets': 3 * 24 * 60 * 60 * 1000,   // 3 días
        'Juguetes y Juegos': 3 * 24 * 60 * 60 * 1000,      // 3 días

        // Categorías que cambian con frecuencia
        'Alimentos': 1 * 24 * 60 * 60 * 1000,               // 1 día
        'Belleza y Cuidado Personal': 1 * 24 * 60 * 60 * 1000, // 1 día

        // Valor por defecto (si no está en la lista)
        'default': 5 * 24 * 60 * 60 * 1000                  // 5 días
    },
    storageKey: 'easymarket_subcategorias_cache'
};

// ============================================
// 1. GESTIÓN DEL CACHÉ MEJORADA
// ============================================

/**
 * Obtener todo el caché desde localStorage
 */
function obtenerCache() {
    try {
        const cacheRaw = localStorage.getItem(CACHE_CONFIG.storageKey);
        if (!cacheRaw) return null;

        const cache = JSON.parse(cacheRaw);

        // Verificar versión
        if (cache.metadata?.version !== CACHE_CONFIG.version) {
            console.log('Versión desactualizada, limpiando caché');
            limpiarCache();
            return null;
        }

        return cache;
    } catch (error) {
        console.error('Error leyendo caché:', error);
        return null;
    }
}

/**
 * Guardar una categoría en el caché
 */
function guardarEnCache(categoriaNombre, subcategorias) {
    try {
        const cache = obtenerCache() || {};
        const now = Date.now();

        // Guardar datos con timestamp de última actualización
        cache[categoriaNombre] = {
            data: subcategorias,
            lastUpdated: now,
            ttl: CACHE_CONFIG.ttlPorCategoria[categoriaNombre] || CACHE_CONFIG.ttlPorCategoria.default
        };

        // Actualizar metadata
        cache.metadata = cache.metadata || {};
        cache.metadata.version = CACHE_CONFIG.version;
        cache.metadata.lastGlobalUpdate = now;

        localStorage.setItem(CACHE_CONFIG.storageKey, JSON.stringify(cache));

        console.log(`✅ Caché guardado para: ${categoriaNombre} (${subcategorias.length} items, TTL: ${Math.floor(cache[categoriaNombre].ttl / 86400000)} días)`);
    } catch (error) {
        console.error('Error guardando en caché:', error);
        if (error.name === 'QuotaExceededError') {
            limpiarCacheViejo();
        }
    }
}

/**
 * Obtener subcategorías del caché (con verificación de expiración)
 * Retorna: { data, isExpired, lastUpdated }
 */
function obtenerDelCache(categoriaNombre) {
    const cache = obtenerCache();
    if (!cache) return { data: null, isExpired: true, lastUpdated: null };

    const categoriaCache = cache[categoriaNombre];
    if (!categoriaCache || !categoriaCache.data) {
        return { data: null, isExpired: true, lastUpdated: null };
    }

    const ahora = Date.now();
    const edad = ahora - categoriaCache.lastUpdated;
    const ttl = categoriaCache.ttl || CACHE_CONFIG.ttlPorCategoria.default;
    const isExpired = edad > ttl;

    if (isExpired) {
        console.log(`⏰ Caché expirado para: ${categoriaNombre} (edad: ${Math.floor(edad / 3600000)}h, TTL: ${Math.floor(ttl / 3600000)}h)`);
    } else {
        console.log(`📦 Caché válido para: ${categoriaNombre} (expira en: ${Math.floor((ttl - edad) / 3600000)}h)`);
    }

    return {
        data: categoriaCache.data,
        isExpired: isExpired,
        lastUpdated: categoriaCache.lastUpdated
    };
}

/**
 * Verificar si una categoría necesita actualización (sin exponer detalles internos)
 */
function necesitaActualizacion(categoriaNombre) {
    const { isExpired, data } = obtenerDelCache(categoriaNombre);
    // Necesita actualización si: expiró O no hay datos
    return isExpired || !data || data.length === 0;
}

/**
 * Eliminar una categoría específica del caché
 */
function eliminarDelCache(categoriaNombre) {
    const cache = obtenerCache();
    if (cache && cache[categoriaNombre]) {
        delete cache[categoriaNombre];
        localStorage.setItem(CACHE_CONFIG.storageKey, JSON.stringify(cache));
    }
}

/**
 * Limpiar todo el caché
 */
function limpiarCache() {
    localStorage.removeItem(CACHE_CONFIG.storageKey);
    console.log('🧹 Caché completamente limpiado');
}

/**
 * Limpiar cachés más viejos (cuando hay poco espacio)
 */
function limpiarCacheViejo() {
    const cache = obtenerCache();
    if (!cache) return;

    const ahora = Date.now();
    let eliminados = 0;

    Object.keys(cache).forEach(key => {
        if (key === 'metadata') return;

        const categoria = cache[key];
        if (categoria && categoria.lastUpdated) {
            const edad = ahora - categoria.lastUpdated;
            // Eliminar cachés de más de 30 días
            if (edad > 30 * 24 * 60 * 60 * 1000) {
                delete cache[key];
                eliminados++;
            }
        }
    });

    localStorage.setItem(CACHE_CONFIG.storageKey, JSON.stringify(cache));
}

// ============================================
// 2. CARGA INTELIGENTE CON TTL POR CATEGORÍA
// ============================================

/**
 * Cargar subcategorías con caché inteligente y TTL por categoría
 */
async function cargarSubcategoriasInteligente(categoriaNombre) {
    // 1. Intentar obtener del caché local
    const { data: cachedData, isExpired } = obtenerDelCache(categoriaNombre);

    // 2. Si hay datos en caché Y NO ha expirado, usarlos inmediatamente
    if (cachedData && !isExpired) {
        console.log(`⚡ Carga instantánea desde caché: ${categoriaNombre}`);
        return { data: cachedData, fromCache: true, needsBackgroundUpdate: false };
    }

    // 3. Si hay datos pero expiraron, mostrar los datos viejos MIENTRAS se actualizan
    if (cachedData && isExpired) {
        console.log(`🔄 Caché expirado para ${categoriaNombre}, mostrando datos antiguos mientras se actualiza...`);

        // Iniciar actualización en segundo plano (no bloquear)
        actualizarEnSegundoPlano(categoriaNombre);

        // Devolver datos antiguos inmediatamente (stale-while-revalidate)
        return { data: cachedData, fromCache: true, needsBackgroundUpdate: true };
    }


    try {
        const { data, error } = await supabase
            .rpc('get_subcategorias_por_nombre', { cat_nombre: categoriaNombre });

        if (error) throw error;

        if (data && data.length > 0) {
            // Guardar en caché
            guardarEnCache(categoriaNombre, data);
        }

        return { data: data || [], fromCache: false, needsBackgroundUpdate: false };

    } catch (error) {
        throw error;
    }
}

/**
 * Actualizar una categoría en segundo plano (sin bloquear la UI)
 */
async function actualizarEnSegundoPlano(categoriaNombre) {


    try {
        const { data, error } = await supabase
            .rpc('get_subcategorias_por_nombre', { cat_nombre: categoriaNombre });

        if (!error && data && data.length > 0) {
            guardarEnCache(categoriaNombre, data);
            console.log(`✅ Caché actualizado para: ${categoriaNombre}`);

            // Notificar a la UI que hay datos frescos (opcional)
            window.dispatchEvent(new CustomEvent('categoriaActualizada', {
                detail: { categoria: categoriaNombre, data: data }
            }));
        } else if (data && data.length === 0) {
            // Si no hay datos, actualizar el timestamp para evitar verificar constantemente
            const cache = obtenerCache();
            if (cache && cache[categoriaNombre]) {
                cache[categoriaNombre].lastUpdated = Date.now();
                localStorage.setItem(CACHE_CONFIG.storageKey, JSON.stringify(cache));
            }
        }
    } catch (error) {
        console.error(`Error actualizando ${categoriaNombre}:`, error);
    }
}

/**
 * Precargar categorías populares (mejora experiencia)
 */
async function precargarCategoriasPopulares() {
    const categoriasPopulares = [
        'Ropa y Accesorios',
        'Electrónica',
        'Hogar y Cocina',
        'Tecnología y Gadgets',
        'Mascotas'
    ];


    const promesas = categoriasPopulares.map(async (categoria) => {
        const { data } = obtenerDelCache(categoria);
        if (!data || data.length === 0) {
            try {
                const { data: freshData } = await supabase
                    .rpc('get_subcategorias_por_nombre', { cat_nombre: categoria });
                if (freshData && freshData.length > 0) {
                    guardarEnCache(categoria, freshData);
                }
            } catch (error) {
                console.warn(`Error precargando ${categoria}:`, error);
            }
        }
    });

    await Promise.all(promesas);
}

// ============================================
// 3. RENDERIZADO OPTIMIZADO
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    const track = document.getElementById('categoryTrack');
    const subContainer = document.getElementById('subContainer');
    const backBtn = document.getElementById('backStep');

    // Precargar categorías populares en segundo plano
    setTimeout(() => {
        precargarCategoriasPopulares();
    }, 2000);

    const categoryLinks = document.querySelectorAll('#col-categories a[data-category]');

    categoryLinks.forEach(link => {
        link.addEventListener('click', async (e) => {
            e.preventDefault();
            const categoriaNombre = link.getAttribute('data-category') ||
                link.querySelector('span')?.textContent?.trim() ||
                link.textContent.trim();

            await cargarYRenderizarSubcategorias(categoriaNombre);
            track.classList.add('track-step-2');
        });
    });

    /**
     * Renderizado con caché inteligente y TTL por categoría
     */
    async function cargarYRenderizarSubcategorias(nombreCat) {
        // Mostrar loader solo si no hay datos en caché
        const { data: cachedCheck } = obtenerDelCache(nombreCat);
        if (!cachedCheck) {
            subContainer.innerHTML = '<li style="padding:20px; color:#666; text-align:center;">⏳ Cargando...</li>';
        } else {
            // Si hay caché, mostrar "Actualizando..." sutilmente
            subContainer.innerHTML = '<li style="padding:20px; color:#666; text-align:center;">🔄 Actualizando...</li>';
        }

        try {
            const startTime = performance.now();
            const { data, fromCache, needsBackgroundUpdate } = await cargarSubcategoriasInteligente(nombreCat);
            const endTime = performance.now();


            if (!data || data.length === 0) {
                subContainer.innerHTML = '<li style="padding:15px; color:#888;">📭 No hay subcategorías disponibles</li>';
                return;
            }

            // Renderizar
            subContainer.innerHTML = '';

            data.forEach(sub => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <a href="#" class="sub-item">
                        <span class="cat-name">${escapeHtml(sub.nombre)}</span>
                        ${sub.ejemplo ? `<small class="sub-example">${escapeHtml(sub.ejemplo)}</small>` : ''}
                    </a>
                `;

                li.querySelector('a').addEventListener('click', (e) => {
                    e.preventDefault();

                    window.dispatchEvent(new CustomEvent('ejecutarFiltrado', {
                        detail: { tipo: 'SubcategoriaId', valor: sub.id }
                    }));

                    if (typeof window.toggleMenu === 'function') {
                        window.toggleMenu();
                    }

                    limpiarYResetearSubcategorias();
                });

                subContainer.appendChild(li);
            });

            // Mostrar badge informativo según el estado
            const badge = document.createElement('li');
            badge.style.cssText = 'font-size: 11px; text-align: center; padding: 8px; border-top: 1px solid #eee; margin-top: 5px;';

            if (needsBackgroundUpdate) {
                badge.innerHTML = '🔄 Actualizando en segundo plano...';
                badge.style.color = '#ff9800';

                // Escuchar cuando termine la actualización
                const onUpdateComplete = (e) => {
                    if (e.detail.categoria === nombreCat) {
                        badge.innerHTML = '✅ Datos actualizados';
                        badge.style.color = '#4caf50';
                        setTimeout(() => {
                            if (badge.parentNode) badge.remove();
                        }, 3000);
                        window.removeEventListener('categoriaActualizada', onUpdateComplete);
                    }
                };
                window.addEventListener('categoriaActualizada', onUpdateComplete);
            } else if (fromCache) {
                // Obtener info del TTL restante
                const cache = obtenerCache();
                const catCache = cache?.[nombreCat];
                if (catCache && catCache.lastUpdated) {
                    const edad = Date.now() - catCache.lastUpdated;
                    const ttl = catCache.ttl || CACHE_CONFIG.ttlPorCategoria.default;
                    const horasRestantes = Math.floor((ttl - edad) / 3600000);
                    if (horasRestantes > 0) {
                        badge.innerHTML = `⚡ Preparada para ti (actualiza en ${horasRestantes}h)`;
                    } else {
                        badge.innerHTML = `⚡ Preparando tu experiencia (actualizando pronto)`;
                    }
                } else {
                    badge.innerHTML = '⚡ Preparada para ti';
                }
                badge.style.color = '#4caf50';
            } else {
                badge.innerHTML = '🌐 Preparando tu experiencia';
                badge.style.color = '#2196f3';
            }

            subContainer.appendChild(badge);

        } catch (err) {
            subContainer.innerHTML = '<li style="padding:15px; color:red;">❌ Intenta de nuevo.</li>';
        }
    }

    /**
     * Limpiar y resetear
     */
    function limpiarYResetearSubcategorias() {
        if (subContainer) {
            subContainer.innerHTML = '';
        }
        if (track) {
            track.classList.remove('track-step-2');
        }
    }

    // Botón volver
    if (backBtn) {
        backBtn.addEventListener('click', (e) => {
            e.preventDefault();
            limpiarYResetearSubcategorias();
        });
    }

    // Cerrar menú
    const sideMenu = document.getElementById('sideMenu');
    if (sideMenu) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class') {
                    if (!sideMenu.classList.contains('show')) {
                        limpiarYResetearSubcategorias();
                    }
                }
            });
        });
        observer.observe(sideMenu, { attributes: true });
    }

    window.limpiarYResetearSubcategorias = limpiarYResetearSubcategorias;
    window.limpiarCache = limpiarCache;

});

/**
 * Utilidad: Escapar HTML para prevenir XSS
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
