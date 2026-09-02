// Service worker minimal : ne modifie pas le comportement réseau,
// il sert uniquement à satisfaire les critères techniques d'une PWA installable.
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
