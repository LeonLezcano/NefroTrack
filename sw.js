/**
 * NefroTrack Service Worker — Offline-First PWA Cache
 * AiAppFactory Standard
 */

const CACHE_NAME = 'nefrotrack-cache-v1.0.00';
const STATIC_ASSETS = [
  './',
  './index.html',
  './version.json',
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
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).catch(() => {
        if (event.request.headers.get('accept')?.includes('text/html')) {
          return caches.match('./index.html');
        }
      });
    })
  );
});
