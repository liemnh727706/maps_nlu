/* Service worker – app-shell cache cho PWA demo NLU Wayfinder */
const CACHE = 'nlu-wayfinder-v5';
const SHELL = [
  './',
  './index.html',
  './data.js',
  './app.js',
  './manifest.webmanifest',
  './icon.svg'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  // App shell cùng origin: network-first (luôn lấy bản mới khi online), fallback cache khi offline.
  if (url.origin === self.location.origin) {
    e.respondWith(
      fetch(e.request).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      }).catch(() => caches.match(e.request))
    );
  }
  // Tile bản đồ & CDN -> đi thẳng mạng (không can thiệp).
});
