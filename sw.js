// sw.js
// Service Worker para caching offline y sincronización en segundo plano
// Ubicación: raíz del proyecto /sw.js

const CACHE_NAME = 'suit-v1.0.0';
const OFFLINE_URL = '/offline.html';  // Página de respaldo cuando no hay conexión

// Recursos a cachear durante la instalación (core assets)
const STATIC_CACHE_URLS = [
    '/',
    '/offline.html'
];

// ========== EVENTOS DEL SERVICE WORKER ==========

// INSTALACIÓN: cachear assets estáticos
self.addEventListener('install', (event) => {
    console.log('[SW] Instalando...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                // 🔥 Cache individual con manejo de errores
                const promises = STATIC_CACHE_URLS.map(url => {
                    return cache.add(url).catch(err => {
                        console.warn(`[SW] No se pudo cachear: ${url}`, err);
                    });
                });
                return Promise.all(promises);
            })
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});


// FETCH: estrategia Stale-While-Revalidate para HTML y API
// Estrategia: primero cache, luego red, actualizar cache en segundo plano
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // API: responder con error offline
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() => new Response(
        JSON.stringify({ error: 'offline', message: 'Sin conexión' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      ))
    );
    return;
  }

  // Navegación: cache -> red -> offline.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) {
          // Actualizar en segundo plano
          fetch(event.request).then(res => {
            if (res.ok) caches.open(CACHE_NAME).then(c => c.put(event.request, res));
          }).catch(() => {});
          return cached;
        }
        return fetch(event.request).catch(() => caches.match(OFFLINE_URL));
      })
    );
    return;
  }

  // Recursos estáticos: cache first, pero sin precarga forzada
  if (url.pathname.match(/\.(css|js|png|jpg|jpeg|svg|webp|ico|json)$/)) {
    event.respondWith(
      caches.match(event.request).then(cached => cached || fetch(event.request).then(res => {
        if (res.ok) caches.open(CACHE_NAME).then(c => c.put(event.request, res.clone()));
        return res;
      }).catch(() => {
        // Placeholder para imágenes
        if (url.pathname.match(/\.(png|jpg|jpeg|svg|webp)$/)) {
          return caches.match('/img/placeholder.png');
        }
        return new Response('', { status: 404 });
      }))
    );
    return;
  }

  // Otros recursos: network first
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

// ========== BACKGROUND SYNC ==========
// Para sincronizar datos en segundo plano cuando vuelva la conexión
self.addEventListener('sync', (event) => {
    console.log('[SW] Evento sync recibido:', event.tag);

    if (event.tag === 'sync-vouchers') {
        event.waitUntil(syncVouchers());
    }
});

// Función para sincronizar vales pendientes
async function syncVouchers() {
    console.log('[SW] Sincronizando vales pendientes...');

    // Obtener los clientes (ventanas) abiertos
    const clients = await self.clients.matchAll({ type: 'window' });

    if (clients.length > 0) {
        // Enviar mensaje a la app para que ejecute la sincronización
        clients.forEach(client => {
            client.postMessage({
                type: 'SYNC_TRIGGER',
                payload: { timestamp: Date.now() }
            });
        });
    }

    // También podemos intentar sincronizar directamente vía API
    try {
        // Aquí iría la lógica de sincronización con el backend
        // Por ahora, solo registramos
        console.log('[SW] Sync completado');
    } catch (error) {
        console.error('[SW] Error en sync:', error);
        // Si falla, programar reintento
        await self.registration.sync.register('sync-vouchers');
    }
}

// ========== MANEJO DE NOTIFICACIONES PUSH (para cuando tenga plan premium) ==========
self.addEventListener('push', (event) => {
    console.log('[SW] Notificación push recibida:', event);

    let data = { title: 'Suit', body: 'Tienes novedades', icon: '/icons/icon-192.png' };

    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            data.body = event.data.text();
        }
    }

    const options = {
        body: data.body,
        icon: data.icon || '/icons/icon-192.png',
        badge: '/icons/icon-96.png',
        vibrate: [200, 100, 200],
        data: {
            url: data.url || '/',
            dateOfArrival: Date.now()
        },
        actions: [
            { action: 'open', title: 'Abrir' },
            { action: 'dismiss', title: 'Ignorar' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// Manejar clic en notificaciones
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Click en notificación:', event);

    event.notification.close();

    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // Si ya hay una ventana abierta, la enfocamos
            for (const client of clientList) {
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            // Si no, abrimos una nueva
            if (self.clients.openWindow) {
                return self.clients.openWindow(urlToOpen);
            }
        })
    );
});
