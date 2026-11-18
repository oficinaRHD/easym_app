// /js/ads-config.js
// Configuración de la pasarela de anuncios
// Edita este archivo para añadir/quitar/modificar anuncios

export const ADS_CONFIG = {
    // Duraciones en milisegundos
    logoDisplayTime: 2000,      // Tiempo que se muestra el logo al inicio
    adDisplayTime: 5000,        // Tiempo que se muestra cada anuncio
    transitionDuration: 600,    // Duración de la transición entre slides
    
    // Orden de visualización: 'sequential' | 'random'
    order: 'sequential',
    
    // Si true, el logo aparece entre cada anuncio
    logoBetweenAds: false,
    
    // Si true, pausa al hacer hover (desktop)
    pauseOnHover: true,
    
    // Anuncios (puedes añadir tantos como quieras)
    ads: [
        {
            id: 'ad-1',
            image: '/ads/ads-tebusco.png',
            alt: 'llega a tiempo, llega seguro, llega con ¡TE BUSCO!',
            link: 'https://cod-ram.click/portfolio',
            newTab: true,
            // Opcional: fecha de inicio/fin para anuncios programados
            startDate: null,
            endDate: null,
        },
    ],
    
    // Fallback si no hay anuncios o fallan las imágenes
    fallback: {
        showLogoOnly: true,
        logoAnimation: 'pulse', // 'pulse' | 'none' | 'bounce'
    },
};

// Helper: filtrar anuncios activos por fecha
export function getActiveAds() {
    const now = new Date();
    return ADS_CONFIG.ads.filter(ad => {
        if (ad.startDate && new Date(ad.startDate) > now) return false;
        if (ad.endDate && new Date(ad.endDate) < now) return false;
        return true;
    });
          }
