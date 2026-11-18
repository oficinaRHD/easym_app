// /js/ads-carousel.js
// Componente de pasarela de anuncios dinámica

import { ADS_CONFIG, getActiveAds } from './ads-config.js';

class AdsCarousel {
    constructor(containerSelector) {
        this.container = document.querySelector(containerSelector);
        if (!this.container) {
            console.warn('AdsCarousel: contenedor no encontrado');
            return;
        }
        
        this.config = ADS_CONFIG;
        this.ads = getActiveAds();
        this.currentIndex = -1; // -1 = logo
        this.timer = null;
        this.progressTimer = null;
        this.isPaused = false;
        this.isDestroyed = false;
        
        this.init();
    }
    
    init() {
        this.buildDOM();
        this.attachEvents();
        
        // Si no hay anuncios activos, mostrar logo estático
        if (this.ads.length === 0) {
            this.showLogoOnly();
            return;
        }
        
        // Iniciar ciclo: logo primero
        this.showLogo();
        
        // Después del tiempo configurado, comenzar carrusel
        this.timer = setTimeout(() => {
            this.startCarousel();
        }, this.config.logoDisplayTime);
    }
    
    buildDOM() {
        this.container.className = 'ads-carousel loading';
        this.container.innerHTML = '';
        
        // Contenedor de slides
        this.slidesContainer = document.createElement('div');
        this.slidesContainer.className = 'ads-slides';
        
        // Slide del logo
        this.logoSlide = document.createElement('div');
        this.logoSlide.className = 'ads-slide logo-slide';
        this.logoSlide.innerHTML = `
            <img src="/img/logo-easymarketsy.png" alt="EasyMarkets">
        `;
        this.slidesContainer.appendChild(this.logoSlide);
        
        // Slides de anuncios
        this.adSlides = this.ads.map((ad, index) => {
            const slide = document.createElement('div');
            slide.className = 'ads-slide ad-slide';
            slide.dataset.index = index;
            slide.dataset.adId = ad.id;
            
            const img = document.createElement('img');
            img.src = ad.image;
            img.alt = ad.alt;
            img.loading = 'eager'; // Precargar anuncios
            
            // Manejar error de carga de imagen
            img.onerror = () => {
                slide.style.display = 'none';
                console.warn(`AdsCarousel: imagen no cargó - ${ad.image}`);
            };
            
            slide.appendChild(img);
            
            // Badge "Anuncio"
            const badge = document.createElement('span');
            badge.className = 'ads-badge';
            badge.textContent = 'Anuncio';
            slide.appendChild(badge);
            
            // Click en anuncio
            slide.addEventListener('click', () => this.handleAdClick(ad));
            
            this.slidesContainer.appendChild(slide);
            return slide;
        });
        
        this.container.appendChild(this.slidesContainer);
        
        // Dots indicadores
        if (this.ads.length > 1) {
            this.dotsContainer = document.createElement('div');
            this.dotsContainer.className = 'ads-dots';
            
            // Logo dot
            this.logoDot = document.createElement('div');
            this.logoDot.className = 'ads-dot active';
            this.logoDot.addEventListener('click', () => this.goToLogo());
            this.dotsContainer.appendChild(this.logoDot);
            
            // Ad dots
            this.adDots = this.ads.map((_, index) => {
                const dot = document.createElement('div');
                dot.className = 'ads-dot';
                dot.addEventListener('click', () => this.goToAd(index));
                this.dotsContainer.appendChild(dot);
                return dot;
            });
            
            this.container.appendChild(this.dotsContainer);
        }
        
        // Barra de progreso
        this.progressBar = document.createElement('div');
        this.progressBar.className = 'ads-progress';
        this.progressBar.style.width = '0%';
        this.container.appendChild(this.progressBar);
        
        // Quitar estado de carga
        this.container.classList.remove('loading');
    }
    
    attachEvents() {
        // Pausar al hacer hover (desktop)
        if (this.config.pauseOnHover) {
            this.container.addEventListener('mouseenter', () => this.pause());
            this.container.addEventListener('mouseleave', () => this.resume());
        }
        
        // Pausar cuando la pestaña no está visible
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pause();
            } else {
                this.resume();
            }
        });
    }
    
    showLogo() {
        this.hideAllSlides();
        this.logoSlide.classList.add('active');
        this.currentIndex = -1;
        this.updateDots();
        this.animateProgress(this.config.logoDisplayTime);
    }
    
    showLogoOnly() {
        // Sin anuncios: logo con animación fallback
        this.hideAllSlides();
        this.logoSlide.classList.add('active');
        
        if (this.config.fallback.logoAnimation === 'pulse') {
            this.logoSlide.classList.add('pulse');
        }
        
        // Ocultar dots y progress
        if (this.dotsContainer) this.dotsContainer.style.display = 'none';
        if (this.progressBar) this.progressBar.style.display = 'none';
    }
    
    startCarousel() {
    if (this.isDestroyed) return;
    
    // Determinar orden
    const order = this.config.order === 'random' 
        ? this.shuffleArray([...Array(this.ads.length).keys()])
        : [...Array(this.ads.length).keys()];
    
    this.playOrder = order;
    this.playIndex = 0;
    
    // ← NUEVO: Mostrar primer anuncio inmediatamente (sin esperar timer)
    this.playNext(true);
}

playNext(inmediato = false) {
    if (this.isDestroyed || this.isPaused) return;
    
    // Si terminamos todos los anuncios, volver al logo
    if (this.playIndex >= this.playOrder.length) {
        this.resetTimer();
        this.showLogo();
        
        // Después del tiempo del logo, reiniciar ciclo completo
        this.timer = setTimeout(() => {
            this.playIndex = 0;           // ← Reiniciar índice
            this.playNext(true);           // ← Comenzar anuncios de nuevo
        }, this.config.logoDisplayTime);
        return;
    }
    
    const adIndex = this.playOrder[this.playIndex];
    this.showAd(adIndex);
    this.playIndex++;
    
    // Programar siguiente
    this.timer = setTimeout(() => this.playNext(), this.config.adDisplayTime);
}
    
    showAd(index) {
        this.hideAllSlides();
        const slide = this.adSlides[index];
        if (slide) {
            slide.classList.add('active');
            this.currentIndex = index;
            this.updateDots();
            this.animateProgress(this.config.adDisplayTime);
        }
    }
    
    goToLogo() {
        this.resetTimer();
        this.showLogo();
        // Reanudar ciclo después del logo
        this.timer = setTimeout(() => this.playNext(), this.config.logoDisplayTime);
    }
    
    goToAd(index) {
        this.resetTimer();
        this.showAd(index);
        // Reanudar ciclo desde este punto
        this.playIndex = (this.playOrder.indexOf(index) + 1) % this.playOrder.length;
        this.timer = setTimeout(() => this.playNext(), this.config.adDisplayTime);
    }
    
    hideAllSlides() {
        this.logoSlide?.classList.remove('active');
        this.adSlides?.forEach(slide => slide.classList.remove('active'));
    }
    
    updateDots() {
        if (!this.dotsContainer) return;
        
        this.logoDot?.classList.toggle('active', this.currentIndex === -1);
        this.adDots?.forEach((dot, i) => {
            dot.classList.toggle('active', i === this.currentIndex);
        });
    }
    
    animateProgress(duration) {
        if (!this.progressBar) return;
        
        this.progressBar.style.transition = 'none';
        this.progressBar.style.width = '0%';
        
        // Forzar reflow
        void this.progressBar.offsetWidth;
        
        this.progressBar.style.transition = `width ${duration}ms linear`;
        this.progressBar.style.width = '100%';
    }
    
    handleAdClick(ad) {
        // Pausar mientras el usuario decide
        this.pause();
        
        // Analytics (opcional)
        if (window.gtag) {
            window.gtag('event', 'ad_click', {
                ad_id: ad.id,
                ad_name: ad.alt,
            });
        }
        
        // Navegar
        if (ad.link) {
            if (ad.newTab) {
                window.open(ad.link, '_blank');
            } else {
                window.location.href = ad.link;
            }
        }
    }
    
    pause() {
        this.isPaused = true;
        clearTimeout(this.timer);
        if (this.progressBar) {
            const computed = getComputedStyle(this.progressBar);
            const width = computed.width;
            this.progressBar.style.transition = 'none';
            this.progressBar.style.width = width;
        }
    }
    
    resume() {
        if (!this.isPaused) return;
        this.isPaused = false;
        
        // Continuar desde donde estaba (simplificado: siguiente)
        if (this.currentIndex === -1) {
            this.timer = setTimeout(() => this.playNext(), this.config.logoDisplayTime / 2);
        } else {
            this.timer = setTimeout(() => this.playNext(), this.config.adDisplayTime / 2);
        }
    }
    
    resetTimer() {
        clearTimeout(this.timer);
        clearTimeout(this.progressTimer);
    }
    
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
    
    // API pública
    refresh() {
        this.destroy();
        this.ads = getActiveAds();
        this.init();
    }
    
    destroy() {
        this.isDestroyed = true;
        this.resetTimer();
        clearTimeout(this.progressTimer);
        this.container.innerHTML = '';
    }
}

// Inicializar cuando el DOM esté listo
export function initAdsCarousel(selector = '.ads-carousel') {
    return new AdsCarousel(selector);
}

export default AdsCarousel;
