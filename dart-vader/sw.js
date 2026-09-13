/* Dart Vader — offline cache.
   Bump VERSION on every publish: it names the cache, so a new value wipes the
   old one on activate and forces the new page in. */
const VERSION = 'dart-vader-2026-09-13a';
const CORE = ['./', './index.html'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if(req.method !== 'GET') return;
  const url = new URL(req.url);
  const fonts = url.host === 'fonts.googleapis.com' || url.host === 'fonts.gstatic.com';

  // the page itself: network first, so a republish lands as soon as there is signal
  if(req.mode === 'navigate'){
    e.respondWith(
      fetch(req).then(r => {
        const copy = r.clone();
        caches.open(VERSION).then(c => c.put('./index.html', copy));
        return r;
      }).catch(() => caches.match('./index.html').then(r => r || caches.match('./')))
    );
    return;
  }

  // everything else we serve (own files, Google Fonts): cache first, fill on first hit
  if(fonts || url.origin === location.origin){
    e.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(r => {
        if(r && (r.ok || r.type === 'opaque')){
          const copy = r.clone();
          caches.open(VERSION).then(c => c.put(req, copy));
        }
        return r;
      }).catch(() => hit || Response.error()))
    );
  }
});
