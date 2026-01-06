const CACHE_NAME = 'walking-journey-v1';
const urlsToCache = ['.', 'index.html', 'style.css', 'app.js', 'manifest.json'];

// Install service worker
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache)));
});

// Fetch from cache
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then(
      (response) =>
        // Return cached version or fetch new
        response || fetch(event.request)
    )
  );
});

// Update service worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      )
    )
  );
});
