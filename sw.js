// Tehty käännöksessä (offline.js). Tallentaa pelin puhelimen muistiin, jotta se toimii ilman verkkoa.
const CACHE = "kilpa-ajo-1-0b3a5075003f";
const FILES = [
  "./",
  "./LICENSES.txt",
  "./assets/drift-DtG1XFoT.js",
  "./assets/main-C2Kpmg3J.js",
  "./assets/sound-B4ZmYWuy.js",
  "./drift/",
  "./drift/manifest.webmanifest",
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
// ja ilman verkkoa tai hitaalla verkolla (yli NETWORK_TIMEOUT ms) se näyttää muistissa olevan pelin.
const NETWORK_TIMEOUT = 3000;
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    // Sivu tallennetaan omalla osoitteellaan (F1 './', drift-peli './drift/'), etteivät pelit sekoitu
    const page = './' + new URL(request.url).pathname.slice(new URL(self.registration.scope).pathname.length);
    const fromNetwork = fetch(request).then(response => {
      const copy = response.clone();
      if (response.ok) caches.open(CACHE).then(cache => cache.put(page, copy));
      return response;
    });
    const fromCache = () => caches.match(page, { cacheName: CACHE });
    const slow = new Promise(resolve => setTimeout(() => resolve(null), NETWORK_TIMEOUT));
    event.respondWith(Promise.race([fromNetwork.catch(() => null), slow])
      .then(response => response ?? fromCache().then(hit => hit ?? fromNetwork)));
    return;
  }
  event.respondWith(caches.match(request, { cacheName: CACHE }).then(hit => hit ?? fetch(request)));
});
