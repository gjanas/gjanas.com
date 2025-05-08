// service-worker.js (WERSJA TYMCZASOWA DO TESTÓW)

const CACHE_NAME = 'trening-tracker-cache-v2-test'; // Zmień nazwę cache, aby wymusić aktualizację
const URLS_TO_CACHE = [
  // Lista może pozostać, ale fetch jej nie użyje
  'index.html', 
  'manifest.json', 
  'offline.html', 
  'icons/icon-192x192.png',
  'icons/icon-512x512.png',
];

// Install event (bez zmian)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW Test] Opened cache:', CACHE_NAME);
        return cache.addAll(URLS_TO_CACHE)
          .catch(error => {
             console.error('[SW Test] Failed to cache URLs during install:', error);
          });
      })
      .catch(err => {
        console.error('[SW Test] Failed to open cache during install:', err);
      })
  );
  self.skipWaiting();
});

// Activate event (bez zmian - czyści stare cache)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW Test] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
        console.log('[SW Test] Claiming clients');
        return self.clients.claim();
    })
  );
});

// Fetch event - UPROSZCZONY (Zawsze pobiera z sieci)
self.addEventListener('fetch', (event) => {
  // Ignoruj żądania inne niż GET
  if (event.request.method !== 'GET') {
    return;
  }
  console.log('[SW Test] Fetching from network (bypassing cache):', event.request.url);
  // Po prostu wykonaj żądanie sieciowe
  event.respondWith(fetch(event.request)); 
});
