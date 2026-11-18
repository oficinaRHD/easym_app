(function() {
            // Clave para localStorage
            const COOKIE_ACCEPTED_KEY = 'easyMarketCookiesAccepted';
            
            // Elementos del DOM
            const cookieBanner = document.getElementById('cookieBanner');
            const acceptBtn = document.getElementById('acceptCookiesBtn');
            
            // Función para verificar si ya se aceptaron las cookies
            function isCookiesAccepted() {
                return localStorage.getItem(COOKIE_ACCEPTED_KEY) === 'true';
            }
            
            // Función para mostrar el banner con animación
            function showBanner() {
                if (cookieBanner) {
                    // Pequeño retraso para asegurar que el DOM esté listo
                    setTimeout(() => {
                        cookieBanner.classList.add('show');
                    }, 100);
                }
            }
            
            // Función para ocultar el banner
            function hideBanner() {
                if (cookieBanner) {
                    cookieBanner.classList.remove('show');
                    // Opcional: eliminar del DOM después de la animación
                    setTimeout(() => {
                        if (cookieBanner && !cookieBanner.classList.contains('show')) {
                            cookieBanner.style.display = 'none';
                        }
                    }, 500);
                }
            }
            
            // Función para aceptar cookies
            function acceptCookies() {
                // Guardar en localStorage que el usuario aceptó
                localStorage.setItem(COOKIE_ACCEPTED_KEY, 'true');
                // Ocultar el banner
                hideBanner();
                
                // Opcional: Mostrar un pequeño mensaje de confirmación (sin interrumpir)
                console.log('Cookies aceptadas. No se volverá a mostrar el banner.');
            }
            
            // Función para inicializar el banner
            function initCookieBanner() {
                // Verificar si ya se aceptaron las cookies
                const accepted = isCookiesAccepted();
                
                if (!accepted) {
                    // Si no se han aceptado, mostrar el banner
                    showBanner();
                } else {
                    // Si ya se aceptaron, asegurarse de que el banner esté oculto
                    hideBanner();
                }
                
                // Agregar evento al botón de aceptar
                if (acceptBtn) {
                    acceptBtn.addEventListener('click', acceptCookies);
                }
            }
            
            // Esperar a que el DOM esté completamente cargado
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', initCookieBanner);
            } else {
                initCookieBanner();
            }
            
            // También asegurarse de que el banner se muestre correctamente si hay navegación con pjax/turbolinks
            // (por si acaso, aunque no se usa en este proyecto)
            window.addEventListener('pageshow', function(event) {
                if (!isCookiesAccepted() && cookieBanner && cookieBanner.style.display !== 'none') {
                    cookieBanner.style.display = '';
                    setTimeout(() => {
                        cookieBanner.classList.add('show');
                    }, 50);
                }
            });
        })();
