/* Service worker – NLU Wayfinder (PWA)
   Chiến lược: entry (index.html, sw.js) network-first (luôn mới) ;
   tài nguyên tĩnh cùng origin cache-first + revalidate nền (nhanh, cập nhật qua ?v=) ;
   tile bản đồ / nguồn ngoài: không can thiệp (trình duyệt tự cache). */
const CACHE = 'nlu-wayfinder-v8';
const SHELL = [
  './',
  './index.html',
  './data.js',
  './app.js',
  './manifest.webmanifest',
  './icon.svg',
  './vendor/maplibre-gl.js',
  './vendor/maplibre-gl.css'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()).catch(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // nguồn ngoài (tile bản đồ…) đi thẳng

  const p = url.pathname;
  const isEntry = p.endsWith('/') || p.endsWith('/index.html') || p.endsWith('/sw.js');

  if (isEntry) {
    // network-first: luôn lấy điểm vào mới nhất; offline -> cache
    e.respondWith(
      fetch(req).then((res) => { const c = res.clone(); caches.open(CACHE).then((x) => x.put(req, c)); return res; })
        .catch(() => caches.match(req))
    );
  } else {
    // cache-first + revalidate nền (stale-while-revalidate)
    e.respondWith(
      caches.match(req).then((hit) => {
        const net = fetch(req).then((res) => { const c = res.clone(); caches.open(CACHE).then((x) => x.put(req, c)); return res; }).catch(() => hit);
        return hit || net;
      })
    );
  }
});
