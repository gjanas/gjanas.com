// service-worker.js

const CACHE_NAME = 'trening-tracker-cache-v2'; // Increased version due to offline page addition
const URLS_TO_CACHE = [
  'index.html',
  'manifest.json',
  'offline.html', // Add the offline fallback page
  'icons/icon-192x192.png',
  'icons/icon-512x512.png',
];

// Instalacja Service Workera i cache'owanie zasobów
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache:', CACHE_NAME);
        // Use addAll safely - if one fails, the whole install might fail.
        // Consider adding resources individually if some are non-critical.
        return cache.addAll(URLS_TO_CACHE)
          .catch(error => {
             console.error('Failed to cache one or more resources during install:', error);
             // Decide if install should fail or continue without the failed resource
             // For critical resources like index.html, failure might be appropriate.
          });
      })
      .catch(err => {
        console.error('Failed to open cache:', err);
      })
  );
  self.skipWaiting();
});

// Aktywacja Service Workera i czyszczenie starych cache'ów
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Claim clients after cache cleanup
  );
});

// Przechwytywanie żądań sieciowych
self.addEventListener('fetch', (event) => {
  // Ignore non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Strategy: Cache falling back to network, then offline page
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Return cached response if found
        if (cachedResponse) {
          // console.log('Serving from cache:', event.request.url);
          return cachedResponse;
        }

        // Not in cache, fetch from network
        // console.log('Fetching from network:', event.request.url);
        return fetch(event.request).then(
          (networkResponse) => {
            // Check if we received a valid response
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
               // If the network response is bad, don't cache it, just return it
               // Or potentially try the offline page immediately? For now, return bad response.
              console.warn('Bad network response:', networkResponse);
              return networkResponse;
            }

            // Clone the response to cache it
            const responseToCache = networkResponse.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                // console.log('Caching new resource:', event.request.url);
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          }
        ).catch((error) => {
          // Network request failed, try to serve offline page
          console.log('Network fetch failed, serving offline page. Error:', error);
          return caches.match('offline.html');
        });
      })
  );
});
