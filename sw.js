// Tehty käännöksessä (offline.js). Tallentaa pelin puhelimen muistiin, jotta se toimii ilman verkkoa.
const CACHE = "kilpa-ajo-1-27444951c4ea";
const FILES = [
  "./",
  "./LICENSES.txt",
  "./assets/index-BM4SXoqV.js",
  "./icon-180.png",
  "./icon-192.png",
  "./icon-512.png",
  "./manifest.webmanifest"
];

// Asennus: kaikki pelin tiedostot muistiin
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)).then(() => self.skipWaiting()));
});

// Uusi versio käyttöön: vanhat tallennukset pois
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(key => key.startsWith("kilpa-ajo-1-") && key !== CACHE).map(key => caches.delete(key))))
    .then(() => self.clients.claim()));
});

// Pelin tiedostot tulevat muistista. Sivun avaus kokeilee ensin verkkoa (uusin versio),
// ja ilman verkkoa se näyttää muistissa olevan pelin.
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request)
      .then(response => {
        const copy = response.clone();
        if (response.ok) caches.open(CACHE).then(cache => cache.put('./', copy));
        return response;
      })
      .catch(() => caches.match('./', { cacheName: CACHE })));
    return;
  }
  event.respondWith(caches.match(request, { cacheName: CACHE }).then(hit => hit ?? fetch(request)));
});
