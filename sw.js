/* Service worker Ruang Sambung — cangkang aplikasi tersedia offline; panggilan ke server tidak pernah di-cache. */
const V = 'rs-v1.0.0';
const SHELL = ['./', 'index.html', 'css/app.css', 'js/config.js', 'js/api.js', 'js/app.js', 'manifest.webmanifest', 'icons/icon-192.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).catch(() => { }).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin) return; // GAS & Google Fonts: biarkan langsung
  const jaringanDulu = r.mode === 'navigate' || /config\.js$/.test(u.pathname); // config & halaman: selalu terbaru
  e.respondWith(jaringanDulu
    ? fetch(r).then(x => { const cp = x.clone(); caches.open(V).then(c => c.put(r, cp)); return x; }).catch(() => caches.match(r).then(m => m || caches.match('index.html')))
    : caches.match(r).then(m => { // sisanya: tampil dari cache, perbarui di belakang
        const net = fetch(r).then(x => { if (x.ok) { const cp = x.clone(); caches.open(V).then(c => c.put(r, cp)); } return x; }).catch(() => m);
        return m || net;
      }));
});
