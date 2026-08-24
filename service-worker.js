const CACHE_VERSION = 'atlas-local-v2.9.0-redacted-r1';
const SHELL = [
  './', './index.html', './styles.css', './script.js', './manifest.webmanifest', './icons/atlas-icon.svg',
  './src/game-core.js', './src/biography-core.js', './src/local-library.js', './src/i18n.js', './src/progress-store.js', './src/atlas-api.js', './src/atlas-config.js',
  './data/event-catalog.json', './data/biography-catalog.json', './data/event-metadata.json', './data/event-editorial-overrides.json', './data/routes.json', './data/map-taxonomy.json', './data/relations.json'
];

async function cacheIfAvailable(cache, url) {
  try {
    const response = await fetch(url, { cache: 'reload' });
    if (response.ok && new URL(response.url).origin === self.location.origin) await cache.put(url, response);
  } catch { /* Offline during installation: an older cache remains available. */ }
}

async function catalogFiles(url, field = null) {
  try {
    const response = await fetch(url, { cache: 'reload' });
    if (!response.ok) return [];
    const payload = await response.clone().json();
    const rows = field ? payload?.[field] : payload;
    if (!Array.isArray(rows)) return [];
    return rows.map(item => typeof item === 'string' ? item : item?.file).filter(name => /^[a-z0-9-]+\.json$/i.test(name)).map(name => `./data/${name}`);
  } catch { return []; }
}

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_VERSION);
    const dynamic = [...await catalogFiles('./data/event-catalog.json'), ...await catalogFiles('./data/biography-catalog.json', 'files')];
    await Promise.allSettled([...new Set([...SHELL, ...dynamic])].map(url => cacheIfAvailable(cache, url)));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('atlas-local-') && key !== CACHE_VERSION).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then(response => {
      const copy = response.clone();
      caches.open(CACHE_VERSION).then(cache => cache.put('./index.html', copy));
      return response;
    }).catch(() => caches.match('./index.html')));
    return;
  }
  event.respondWith(fetch(request, { cache: 'no-cache' }).then(response => {
    if (response.ok) caches.open(CACHE_VERSION).then(cache => cache.put(request, response.clone()));
    return response;
  }).catch(() => caches.match(request)));
});
