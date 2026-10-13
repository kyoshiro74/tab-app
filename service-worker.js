// Service worker TAB : fonctionnement hors connexion.
// - page principale : réseau d'abord (3 s max), sinon copie en cache
// - bibliothèques externes (jsPDF, Firebase, polices) : copie en cache après le premier chargement
// - tout le reste (Firestore, banque, Claude) : jamais touché
const VERSION = 'tab-v33';
const COEUR = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];
const HOTES_STATIQUES = ['cdnjs.cloudflare.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];
self.addEventListener('install', e=>{
  e.waitUntil(caches.open(VERSION).then(c=>Promise.all(COEUR.map(u=>c.add(u).catch(()=>{})))).then(()=>self.skipWaiting()));
});
self.addEventListener('activate', e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k !== VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
function statique(url){ return HOTES_STATIQUES.includes(url.hostname) || (url.hostname === 'www.gstatic.com' && url.pathname.startsWith('/firebasejs/')); }
self.addEventListener('fetch', e=>{
  const req = e.request; if(req.method !== 'GET') return;
  const url = new URL(req.url);
  if(url.origin === location.origin){
    const page = req.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('index.html');
    if(page){
      e.respondWith((async ()=>{
        const cache = await caches.open(VERSION);
        const reseau = fetch(req).then(r=>{ if(r && r.ok) cache.put(req, r.clone()); return r; });
        try{ return await Promise.race([reseau, new Promise((_,rej)=>setTimeout(()=>rej(new Error('lent')), 3000))]); }
        catch(err){ const c = (await cache.match(req)) || (await cache.match('./index.html')) || (await cache.match('./')); if(c) return c; return reseau; }
      })());
    } else {
      e.respondWith((async ()=>{
        const cache = await caches.open(VERSION), c = await cache.match(req);
        const reseau = fetch(req).then(r=>{ if(r && r.ok) cache.put(req, r.clone()); return r; }).catch(()=>c);
        return c || reseau;
      })());
    }
    return;
  }
  if(statique(url)){
    e.respondWith((async ()=>{
      const cache = await caches.open(VERSION), c = await cache.match(req);
      if(c) return c;
      try{ const r = await fetch(req); if(r && (r.ok || r.type === 'opaque')) cache.put(req, r.clone()); return r; }
      catch(err){ return c || Response.error(); }
    })());
  }
});
