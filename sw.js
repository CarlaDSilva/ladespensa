// LADESPENSA service worker — estrategia network-first
// Sube el número en cada versión para forzar limpieza de cachés antiguas.
const CACHE = 'ladespensa-v7';
const ASSETS = ['./', './index.html', './manifest.json', './styles.css'];

// Instalar: guardar una copia de respaldo de los assets básicos.
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activar: borrar cachés de versiones anteriores y tomar el control ya.
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Fetch: network-first para todo lo propio; la caché solo es paracaídas offline.
self.addEventListener('fetch', e => {
  const req = e.request;

  // El Gist nunca se cachea: siempre datos frescos de GitHub.
  if (req.url.includes('api.github.com')) return;
  if (req.method !== 'GET') return;

  e.respondWith(
    fetch(req)
      .then(resp => {
        // Guardar una copia fresca por si luego no hay red.
        if (resp && resp.status === 200) {
          const clone = resp.clone();
          caches.open(CACHE).then(c => c.put(req, clone));
        }
        return resp;
      })
      .catch(() => caches.match(req)) // sin conexión → última copia guardada
  );
});
