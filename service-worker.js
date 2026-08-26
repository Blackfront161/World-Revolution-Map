const CACHE_VERSION = 'atlas-local-v2.9.0-rc2-r6';
const STAGING_CACHE = `${CACHE_VERSION}-installing`;
const MANIFEST_URL = './__offline_manifest__';
const CORE_RESOURCES = [
  './', './index.html', './styles.css', './script.js', './service-worker.js', './manifest.webmanifest', './icons/atlas-icon.svg',
  './src/game-core.js', './src/biography-core.js', './src/local-library.js', './src/i18n.js', './src/progress-store.js', './src/atlas-api.js', './src/atlas-config.js',
  './data/event-catalog.json', './data/biography-catalog.json', './data/archive-contract.json', './data/event-metadata.json',
  './data/event-editorial-overrides.json', './data/routes.json', './data/map-taxonomy.json', './data/relations.json'
];

async function fetchRequired(url) {
  const response = await fetch(url, { cache: 'reload' });
  if (!response.ok || new URL(response.url).origin !== self.location.origin) {
    throw new Error(`Erforderliche Offline-Ressource fehlt: ${url}`);
  }
  return response;
}

function catalogFileUrls(payload, field = null) {
  const rows = field ? payload?.[field] : payload;
  if (!Array.isArray(rows) || !rows.length) throw new Error('Offline-Katalog ist leer oder ungültig.');
  const names = rows.map(item => typeof item === 'string' ? item : item?.file);
  if (names.some(name => typeof name !== 'string' || !/^[a-z0-9-]+\.json$/i.test(name))) {
    throw new Error('Offline-Katalog enthält einen ungültigen Dateinamen.');
  }
  return names.map(name => `./data/${name}`);
}

async function verifyGeneration(cache, urls) {
  for (const url of urls) {
    if (!await cache.match(url)) throw new Error(`Offline-Generation ist unvollständig: ${url}`);
  }
}

async function buildCompleteGeneration() {
  await caches.delete(STAGING_CACHE);
  const staging = await caches.open(STAGING_CACHE);
  try {
    const [eventCatalogResponse, biographyCatalogResponse] = await Promise.all([
      fetchRequired('./data/event-catalog.json'),
      fetchRequired('./data/biography-catalog.json')
    ]);
    const [eventCatalog, biographyCatalog] = await Promise.all([
      eventCatalogResponse.clone().json(),
      biographyCatalogResponse.clone().json()
    ]);
    const resources = [...new Set([
      ...CORE_RESOURCES,
      ...catalogFileUrls(eventCatalog),
      ...catalogFileUrls(biographyCatalog, 'files')
    ])];
    const prefetched = new Map([
      ['./data/event-catalog.json', eventCatalogResponse],
      ['./data/biography-catalog.json', biographyCatalogResponse]
    ]);
    await Promise.all(resources.map(async url => {
      const response = prefetched.get(url)?.clone() || await fetchRequired(url);
      await staging.put(url, response);
    }));
    await verifyGeneration(staging, resources);
    const manifest = { cacheVersion: CACHE_VERSION, resources };
    await staging.put(MANIFEST_URL, new Response(JSON.stringify(manifest), { headers: { 'Content-Type': 'application/json; charset=utf-8' } }));

    await caches.delete(CACHE_VERSION);
    const finalCache = await caches.open(CACHE_VERSION);
    for (const url of [...resources, MANIFEST_URL]) {
      const response = await staging.match(url);
      if (!response) throw new Error(`Staging-Generation ist unvollständig: ${url}`);
      await finalCache.put(url, response);
    }
    await verifyGeneration(finalCache, [...resources, MANIFEST_URL]);
    await caches.delete(STAGING_CACHE);
  } catch (error) {
    await Promise.all([caches.delete(STAGING_CACHE), caches.delete(CACHE_VERSION)]);
    throw error;
  }
}

self.addEventListener('install', event => {
  event.waitUntil(buildCompleteGeneration().then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_VERSION);
    const manifestResponse = await cache.match(MANIFEST_URL);
    if (!manifestResponse) throw new Error('Vollständiges Offline-Manifest fehlt.');
    const manifest = await manifestResponse.json();
    if (manifest.cacheVersion !== CACHE_VERSION || !Array.isArray(manifest.resources)) throw new Error('Offline-Manifest ist ungültig.');
    await verifyGeneration(cache, [...manifest.resources, MANIFEST_URL]);
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('atlas-local-') && key !== CACHE_VERSION).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

async function networkFirst(request, fallbackUrl = request) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 500);
  try {
    return await fetch(request, { cache: 'no-cache', signal: controller.signal });
  } catch {
    const cache = await caches.open(CACHE_VERSION);
    const cached = await cache.match(fallbackUrl);
    if (cached) return cached;
    return new Response('Offline-Ressource nicht verfügbar.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  } finally {
    clearTimeout(timeout);
  }
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(networkFirst(request, request.mode === 'navigate' ? './index.html' : request));
});
