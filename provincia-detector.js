// Mapeo de provincias cubanas
const provinciasCuba = [
     "Toda Cuba", // ← NUEVA OPCIÓN
    "Pinar del Río", "Artemisa", "La Habana", "Mayabeque", "Matanzas",
    "Cienfuegos", "Villa Clara", "Sancti Spíritus", "Ciego de Ávila",
    "Camagüey", "Las Tunas", "Granma", "Holguín", "Santiago de Cuba",
    "Guantánamo", "Isla de la Juventud"
];

// Función para normalizar y encontrar la provincia cubana
function encontrarProvinciaCubana(texto) {
    if (!texto) return null;
    
    texto = texto.toLowerCase().trim();
    
    const variaciones = {
        "pinar del rio": "Pinar del Río",
        "pinardelrio": "Pinar del Río",
        "artemisa": "Artemisa",
        "la habana": "La Habana",
        "habana": "La Habana",
        "ciudad de la habana": "La Habana",
        "mayabeque": "Mayabeque",
        "matanzas": "Matanzas",
        "cienfuegos": "Cienfuegos",
        "villa clara": "Villa Clara",
        "villaclara": "Villa Clara",
        "sancti spiritus": "Sancti Spíritus",
        "sancti spíritus": "Sancti Spíritus",
        "sanctispiritus": "Sancti Spíritus",
        "ciego de avila": "Ciego de Ávila",
        "ciego de ávila": "Ciego de Ávila",
        "camaguey": "Camagüey",
        "camagüey": "Camagüey",
        "las tunas": "Las Tunas",
        "lastunas": "Las Tunas",
        "granma": "Granma",
        "holguin": "Holguín",
        "holguín": "Holguín",
        "santiago de cuba": "Santiago de Cuba",
        "santiago": "Santiago de Cuba",
        "guantanamo": "Guantánamo",
        "guantánamo": "Guantánamo",
        "isla de la juventud": "Isla de la Juventud"
    };
    
    for (const [key, value] of Object.entries(variaciones)) {
        if (texto.includes(key)) {
            return value;
        }
    }
    
    for (const provincia of provinciasCuba) {
        if (texto.includes(provincia.toLowerCase())) {
            return provincia;
        }
    }
    
    return null;
}

// Detección por IP
async function detectarPorIP() {
    try {
        const response = await fetch('https://api.bigdatacloud.net/data/reverse-geocode-client?localityLanguage=es');
        const data = await response.json();
        
        const ciudad = data.city || data.locality || data.principalSubdivision;
        let provincia = data.principalSubdivision || data.region;
        
        let provinciaEncontrada = encontrarProvinciaCubana(provincia);
        if (!provinciaEncontrada && ciudad) {
            provinciaEncontrada = encontrarProvinciaCubana(ciudad);
        }
        
        if (provinciaEncontrada && data.countryCode === 'CU') {
            return {
                provincia: provinciaEncontrada,
                ciudad: ciudad,
                metodo: 'ip',
                lat: data.latitude,
                lon: data.longitude
            };
        }
        
        return null;
    } catch (error) {
        console.error('Error en detección por IP:', error);
        return null;
    }
}

// Detección por GPS
function detectarPorGPS() {
    return new Promise((resolve) => {
        if (!navigator.geolocation) {
            resolve(null);
            return;
        }
        
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude, accuracy } = position.coords;
                    
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=es`
                    );
                    const data = await response.json();
                    
                    const address = data.address;
                    let provincia = address.state || address.region || address.province;
                    const ciudad = address.city || address.town || address.village || address.municipality;
                    
                    let provinciaEncontrada = encontrarProvinciaCubana(provincia);
                    if (!provinciaEncontrada && ciudad) {
                        provinciaEncontrada = encontrarProvinciaCubana(ciudad);
                    }
                    
                    if (provinciaEncontrada) {
                        resolve({
                            provincia: provinciaEncontrada,
                            ciudad: ciudad || provinciaEncontrada,
                            metodo: 'gps',
                            lat: latitude,
                            lon: longitude,
                            precision: `${Math.round(accuracy)} metros`
                        });
                    } else {
                        resolve(null);
                    }
                } catch (error) {
                    console.error('Error en reverse geocoding:', error);
                    resolve(null);
                }
            },
            (error) => {
                console.log('Error de GPS:', error.message);
                resolve(null);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    });
}

// Función principal para detectar y guardar provincia (MODIFICADA)
export async function detectarYGuardarProvincia() {
    // 🔥 CRÍTICO: Solo detectar si NO hay provincia guardada
    const provinciaGuardada = localStorage.getItem('usuarioProvincia');
    
    // Si ya hay una provincia guardada (aunque sea "Toda Cuba"), NO volver a detectar
    if (provinciaGuardada !== null) {
        console.log('Usuario ya tiene ubicación seleccionada:', provinciaGuardada);
        
        // Solo mostrar el indicador en el menú, sin banners molestos
        actualizarIndicadorProvinciaEnMenu();
        
        // Disparar evento para que index.js sepa que ya hay ubicación
        window.dispatchEvent(new CustomEvent('provinciaYaDefinida', { 
            detail: { provincia: provinciaGuardada } 
        }));
        
        return provinciaGuardada;
    }
    
    // Si llegamos aquí, es la PRIMERA vez que el usuario entra
    console.log('Primera visita - detectando ubicación automática...');
    
    // Mostrar banner de detección (solo en primera visita)
    mostrarBannerDeteccion();
    
    // Intentar GPS primero
    let resultado = await detectarPorGPS();
    
    // Si falla, usar IP
    if (!resultado) {
        resultado = await detectarPorIP();
    }
    
    ocultarBannerDeteccion();
    
    if (resultado && resultado.provincia) {
        // Guardar provincia detectada
        guardarProvincia(resultado.provincia);
        
        // Mostrar banner de éxito con opción de cambiar
        mostrarBannerExitoConOpciones(resultado);
        
        return resultado.provincia;
    }
    
    // No se pudo detectar - ofrecer selección manual
    mostrarBannerSeleccionManual();
    return null;
}


// NUEVA FUNCIÓN: Guardar provincia (reutilizable)
export function guardarProvincia(provincia) {
    localStorage.setItem('usuarioProvincia', provincia);
    localStorage.setItem('usuarioProvinciaTimestamp', Date.now().toString());
    
    // Disparar evento para que index.js recargue productos
    window.dispatchEvent(new CustomEvent('provinciaCambiada', { 
        detail: { provincia: provincia } 
    }));
    
    // Actualizar indicador en menú
    actualizarIndicadorProvinciaEnMenu();
}

// NUEVA FUNCIÓN: Banner de éxito con opciones
function mostrarBannerExitoConOpciones(resultado) {
    const banner = document.createElement('div');
    banner.className = 'provincia-banner-success';
    banner.innerHTML = `
        <div class="provincia-banner-content">
            <span>📍 Mostrando productos para <strong>${resultado.provincia}</strong></span>
            <div style="display: flex; gap: 10px;">
                <button class="cambiar-provincia-btn" style="background: rgba(255,255,255,0.2);">Cambiar ubicación</button>
                <button class="cerrar-banner-btn" style="background: rgba(0,0,0,0.3);">✖</button>
            </div>
        </div>
    `;
    document.body.insertBefore(banner, document.body.firstChild);
    
    // Evento para cambiar ubicación
    banner.querySelector('.cambiar-provincia-btn')?.addEventListener('click', () => {
        banner.remove();
        mostrarSelectorProvincia();
    });
    
    // Evento para cerrar
    banner.querySelector('.cerrar-banner-btn')?.addEventListener('click', () => {
        banner.remove();
    });
    
    setTimeout(() => {
        if (banner.parentElement) banner.remove();
    }, 8000);
}

// NUEVA FUNCIÓN: Selector manual de provincia
export function mostrarSelectorProvincia() {
    // Crear modal de selección
    const modal = document.createElement('div');
    modal.className = 'provincia-modal-overlay';
    modal.innerHTML = `
        <div class="provincia-modal">
            <h3>📍 Selecciona tu ubicación</h3>
            <p>Elige la provincia donde quieres ver productos disponibles</p>
            <select id="provinciaSelect" class="provincia-select">
                <option value="Toda Cuba">🌐 Toda Cuba (Ver todos los productos)</option>
                ${provinciasCuba.filter(p => p !== "Toda Cuba").map(prov => 
                    `<option value="${prov}">📍 ${prov}</option>`
                ).join('')}
            </select>
            <div class="provincia-modal-buttons">
                <button id="confirmarProvinciaBtn" class="btn-confirmar">Confirmar</button>
                <button id="cancelarProvinciaBtn" class="btn-cancelar">Cancelar</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    // Evento confirmar
    document.getElementById('confirmarProvinciaBtn')?.addEventListener('click', () => {
        const select = document.getElementById('provinciaSelect');
        const provinciaSeleccionada = select.value;
        
        guardarProvincia(provinciaSeleccionada);
        modal.remove();
        
        // Mostrar banner de confirmación
        mostrarBannerConfirmacion(provinciaSeleccionada);
        
        // Recargar página para aplicar filtros
        window.location.reload();
    });
    
    // Evento cancelar
    document.getElementById('cancelarProvinciaBtn')?.addEventListener('click', () => {
        modal.remove();
    });
    
    // Cerrar al hacer clic fuera
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

// NUEVA FUNCIÓN: Banner de selección manual (cuando falla la detección)
function mostrarBannerSeleccionManual() {
    const banner = document.createElement('div');
    banner.className = 'provincia-banner-warning';
    banner.innerHTML = `
        <div class="provincia-banner-content">
            <span>⚠️ No pudimos detectar tu ubicación automáticamente</span>
            <button id="seleccionarManualBtn" style="background: #ffd700; color: #333;">Seleccionar manualmente</button>
        </div>
    `;
    document.body.insertBefore(banner, document.body.firstChild);
    
    document.getElementById('seleccionarManualBtn')?.addEventListener('click', () => {
        banner.remove();
        mostrarSelectorProvincia();
    });
}

// NUEVA FUNCIÓN: Banner de confirmación
function mostrarBannerConfirmacion(provincia) {
    const banner = document.createElement('div');
    banner.className = 'provincia-banner-success';
    banner.innerHTML = `
        <div class="provincia-banner-content">
            <span>✅ Ubicación cambiada a <strong>${provincia}</strong></span>
            <button onclick="this.parentElement.parentElement.remove()">✖</button>
        </div>
    `;
    document.body.insertBefore(banner, document.body.firstChild);
    
    setTimeout(() => {
        if (banner.parentElement) banner.remove();
    }, 4000);
}

// MODIFICADA: Indicador en menú CON SELECTOR MANUAL
export function actualizarIndicadorProvinciaEnMenu() {
    const provincia = getProvinciaGuardada();
    const menuSection = document.querySelector('.menu-section:last-of-type');
    
    if (!menuSection) return;
    
    // Eliminar indicador existente
    const existingIndicator = document.getElementById('provinciaIndicator');
    if (existingIndicator) existingIndicator.remove();
    
    if (provincia) {
        const indicator = document.createElement('div');
        indicator.id = 'provinciaIndicator';
        indicator.className = 'provincia-indicator';
        
        const mostrarTodaCuba = provincia === "Toda Cuba";
        
        indicator.innerHTML = `
            <hr style="margin: 10px 0; border-color: rgba(255,255,255,0.1);">
            <div style="padding: 10px; background: rgba(255,215,0,0.1); border-radius: 8px;">
                <small style="color: #ffd700; display: block; margin-bottom: 5px;">
                    ${mostrarTodaCuba ? '🌐' : '📍'} Tu ubicación
                </small>
                <strong style="color: white; display: block; margin-bottom: 8px;">${provincia}</strong>
                
                <select id="cambiarProvinciaSelect" style="width: 100%; padding: 6px; border-radius: 5px; background: rgba(255,255,255,0.9); border: none; margin-bottom: 8px; font-size: 0.8rem;">
                    <option value="Toda Cuba" ${provincia === "Toda Cuba" ? 'selected' : ''}>🌐 Toda Cuba</option>
                    ${provinciasCuba.filter(p => p !== "Toda Cuba").map(p => 
                        `<option value="${p}" ${provincia === p ? 'selected' : ''}>📍 ${p}</option>`
                    ).join('')}
                </select>
                
                <button id="aplicarProvinciaBtn" style="width: 100%; padding: 6px; background: #ffd700; color: #333; border: none; border-radius: 5px; cursor: pointer; font-size: 0.75rem; font-weight: bold;">
                    Aplicar cambio
                </button>
            </div>
        `;
        
        menuSection.appendChild(indicator);
        
        // Evento para aplicar cambio de provincia
        document.getElementById('aplicarProvinciaBtn')?.addEventListener('click', () => {
            const select = document.getElementById('cambiarProvinciaSelect');
            const nuevaProvincia = select.value;
            
            if (nuevaProvincia !== provincia) {
                guardarProvincia(nuevaProvincia);
                mostrarBannerConfirmacion(nuevaProvincia);
                window.location.reload();
            }
        });
    } else {
        // Si no hay provincia seleccionada, mostrar botón para seleccionar
        const indicator = document.createElement('div');
        indicator.id = 'provinciaIndicator';
        indicator.className = 'provincia-indicator';
        indicator.innerHTML = `
            <hr style="margin: 10px 0; border-color: rgba(255,255,255,0.1);">
            <div style="padding: 10px; background: rgba(255,215,0,0.1); border-radius: 8px;">
                <small style="color: #ffd700; display: block; margin-bottom: 5px;">📍 Ubicación</small>
                <button id="seleccionarUbicacionBtn" style="width: 100%; padding: 8px; background: #ffd700; color: #333; border: none; border-radius: 5px; cursor: pointer;">
                    Seleccionar ubicación
                </button>
            </div>
        `;
        menuSection.appendChild(indicator);
        
        document.getElementById('seleccionarUbicacionBtn')?.addEventListener('click', () => {
            mostrarSelectorProvincia();
        });
    }
}






// Mostrar banner de detección
function mostrarBannerDeteccion() {
    let banner = document.getElementById('provinciaDetectionBanner');
    if (!banner) {
        banner = document.createElement('div');
        banner.id = 'provinciaDetectionBanner';
        banner.className = 'provincia-banner-detecting';
        banner.innerHTML = `
            <div class="provincia-banner-content">
                <div class="loading-spinner-small"></div>
                <span>🔍 Detectando tu ubicación para mostrarte productos cercanos...</span>
            </div>
        `;
        document.body.insertBefore(banner, document.body.firstChild);
    }
    banner.style.display = 'block';
}

function ocultarBannerDeteccion() {
    const banner = document.getElementById('provinciaDetectionBanner');
    if (banner) {
        banner.style.display = 'none';
    }
}

function mostrarBannerExito(resultado) {
    const banner = document.createElement('div');
    banner.className = 'provincia-banner-success';
    banner.innerHTML = `
        <div class="provincia-banner-content">
            <span>📍 Mostrando productos para <strong>${resultado.provincia}</strong></span>
            <button onclick="this.parentElement.parentElement.remove()">✖</button>
        </div>
    `;
    document.body.insertBefore(banner, document.body.firstChild);
    
    setTimeout(() => {
        if (banner.parentElement) banner.remove();
    }, 5000);
}

function mostrarBannerError() {
    const banner = document.createElement('div');
    banner.className = 'provincia-banner-error';
    banner.innerHTML = `
        <div class="provincia-banner-content">
            <span>⚠️ No se pudo detectar tu ubicación. Mostrando productos generales.</span>
            <button onclick="this.parentElement.parentElement.remove()">✖</button>
        </div>
    `;
    document.body.insertBefore(banner, document.body.firstChild);
    
    setTimeout(() => {
        if (banner.parentElement) banner.remove();
    }, 5000);
}

// Obtener provincia guardada
export function getProvinciaGuardada() {
    return localStorage.getItem('usuarioProvincia');
}
