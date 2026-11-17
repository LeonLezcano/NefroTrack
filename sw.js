/**
 * NefroTrack Service Worker - Offline-First PWA Cache
 * AiAppFactory Standard
 */

const CACHE_NAME = 'nefrotrack-cache-v1.0.01';
const STATIC_ASSETS = [
  './',
  './index.html',
  './styles.css',
  './print.css',
  './manifest.json',
  './icon.svg',
  './version.json',
  './src/sw-register.js',
  './src/app.js',
  './src/utils/sanitizer.js',
  './src/utils/cryptoSeal.js',
  './src/utils/formatters.js',
  './src/core/dialyzerReuseSafetyEngine.js',
  './src/core/osmosisWaterQualityGateEngine.js',
  './src/core/ultrafiltrationSessionEngine.js',
  './src/core/serologyChairIsolationEngine.js',
  './src/services/pamiDialysisModuleService.js',
  './src/services/nefroTrackCache.service.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  const isHtmlOrVersion =
    event.request.mode === 'navigate' ||
    event.request.headers.get('accept')?.includes('text/html') ||
    url.pathname.endsWith('/version.json') ||
    url.pathname.endsWith('version.json');

  if (isHtmlOrVersion) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => caches.match(event.request).then((cached) => cached || caches.match('./index.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request).then((response) => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      }).catch(() => cached);

      return cached || networkFetch;
    })
  );
});
