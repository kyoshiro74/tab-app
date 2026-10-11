// Réseau d'abord pour la page, cache en secours hors-ligne. Ne touche pas aux appels externes (Firebase, banque, Claude).
const CACHE = 'tab-v2';
self.addEventListener('install', e => { self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(n => n !== CACHE).map(n => caches.delete(n)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(fetch(r).then(rep => { const c = rep.clone(); caches.open(CACHE).then(ca => ca.put(r, c)); return rep; }).catch(() => caches.match(r).then(m => m || caches.match('index.html'))));
});
