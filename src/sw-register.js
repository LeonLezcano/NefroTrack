/**
 * sw-register.js - Registro asíncrono del Service Worker Offline-First
 */
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      // Registro degradado silencioso en entornos sin soporte SW (ej. file:// o tests)
    });
  });
}
