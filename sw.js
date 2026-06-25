/* Service Worker · Inventario GO
   Estrategia: cache-first para el "app shell" (la app funciona sin internet
   una vez abierta la primera vez con conexión). Sube la versión del CACHE
   cada vez que cambies algún archivo para forzar la actualización. */

const CACHE = 'inventario-go-v2';

const ASSETS = [
  './',
  './index.html',
  './xlsx.full.min.js',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './icon-512-maskable.png'
];

// Instala y precachea el shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// Limpia caches viejos al activar
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Cache-first con respaldo a red; guarda en cache lo nuevo que se pueda
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(res => {
        // solo cachear respuestas válidas del mismo origen
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then(cache => cache.put(req, copy));
        }
        return res;
      }).catch(() => cached);
    })
  );
});
