/* Dart Vader — offline cache.
   Bump VERSION on every publish: it names the cache, so a new value wipes the
   old one on activate and forces the new page in. */
const VERSION = 'dart-vader-2026-09-13b';
const CORE = ['./', './index.html'];
const FONT_CSS = 'https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@400;600;700;800&family=Archivo:wght@400;500;600;700&display=swap';

/* Pull the font sheet and every face it names on install, so the very first
   offline run already has the real type. Never let it fail the install. */
async function precacheFonts(cache){
  try{
    const res = await fetch(FONT_CSS);
    if(!res.ok) return;
    const css = await res.clone().text();
    await cache.put(FONT_CSS, res);
    const urls = [...css.matchAll(/url\((https:\/\/fonts\.gstatic\.com[^)]+)\)/g)].map(m => m[1]);
    await Promise.all(urls.map(u => fetch(u).then(r => r.ok && cache.put(u, r)).catch(()=>{})));
  }catch(e){}
}

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION)
    .then(c => c.addAll(CORE).then(() => precacheFonts(c)))
    .then(() => self.skipWaiting()));
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
      caches.match(req, {ignoreVary:fonts}).then(hit => hit || fetch(req).then(r => {
        if(r && (r.ok || r.type === 'opaque')){
          const copy = r.clone();
          caches.open(VERSION).then(c => c.put(req, copy));
        }
        return r;
      }).catch(() => hit || Response.error()))
    );
  }
});
