// ============================================================
//  SERVICE WORKER — PWA
//  Cubre: caché offline + notificaciones push
// ============================================================

const CACHE_NAME = 'miapp-v1';

// Recursos que se cachean en la instalación (App Shell)
const APP_SHELL = [
  '/',
  '/index.html',
  '/css/index.css',
  '/js/index.js',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  // Añade aquí el resto de tus recursos estáticos
];

// ── INSTALL: precachear el App Shell ────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Precacheando App Shell');
      return cache.addAll(APP_SHELL);
    })
  );
  self.skipWaiting(); // activa el SW inmediatamente
});

// ── ACTIVATE: limpiar cachés antiguas ───────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => {
            console.log('[SW] Eliminando caché antigua:', key);
            return caches.delete(key);
          })
      )
    )
  );
  self.clients.claim(); // toma control de todas las pestañas
});

// ── FETCH: estrategia "Cache First, luego red" ──────────────
self.addEventListener('fetch', (event) => {
  // Solo interceptar GET; ignorar peticiones a otras origins
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      // No está en caché → pedir a la red y guardar copia
      return fetch(event.request)
        .then((response) => {
          // Solo cachear respuestas válidas de nuestra origin
          if (
            !response ||
            response.status !== 200 ||
            response.type !== 'basic'
          ) {
            return response;
          }
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Sin red y sin caché: página offline de fallback
          if (event.request.destination === 'document') {
            return caches.match('/index.html');
          }
        });
    })
  );
});

// ── PUSH: recibir notificaciones push ───────────────────────
self.addEventListener('push', (event) => {
  let data = {
    title: 'Nueva notificación',
    body: 'Tienes un mensaje nuevo.',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    url: '/',
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      data: { url: data.url },
      vibrate: [200, 100, 200],
    })
  );
});

// ── NOTIFICATION CLICK: abrir/enfocar la app ────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Si ya hay una pestaña abierta, enfocarla
        for (const client of clientList) {
          if (client.url === targetUrl && 'focus' in client) {
            return client.focus();
          }
        }
        // Si no, abrir una nueva
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});
