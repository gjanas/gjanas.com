// service-worker.js

const CACHE_NAME = 'trening-tracker-cache-v1'; // Wersjonuj nazwę cache'u
const URLS_TO_CACHE = [
  'index.html', // Główny plik aplikacji
  'manifest.json', // Manifest PWA
  // Dodaj ścieżki do kluczowych ikon zdefiniowanych w manifeście
  'icons/icon-192x192.png',
  'icons/icon-512x512.png',
  // Możesz dodać tu inne statyczne zasoby, jeśli będziesz je miał w przyszłości
  // np. 'css/style.css', 'js/main.js' (ale u nas są inline)
];

// Instalacja Service Workera i cache'owanie zasobów
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache:', CACHE_NAME);
        return cache.addAll(URLS_TO_CACHE);
      })
      .catch(err => {
        console.error('Failed to open cache or add URLs:', err);
      })
  );
  self.skipWaiting(); // Aktywuj nowego SW natychmiast
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
    })
  );
  return self.clients.claim(); // Przejmij kontrolę nad otwartymi klientami
});

// Przechwytywanie żądań sieciowych
self.addEventListener('fetch', (event) => {
  // Obsługuj tylko żądania GET
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Jeśli zasób jest w cache, zwróć go
        if (response) {
          // console.log('Serving from cache:', event.request.url);
          return response;
        }

        // Jeśli nie ma w cache, spróbuj pobrać z sieci
        // console.log('Fetching from network:', event.request.url);
        return fetch(event.request).then(
          (networkResponse) => {
            // Sprawdź, czy otrzymaliśmy prawidłową odpowiedź
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }

            // Sklonuj odpowiedź, ponieważ strumień można odczytać tylko raz
            const responseToCache = networkResponse.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                // console.log('Caching new resource:', event.request.url);
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          }
        ).catch(error => {
          console.error('Fetch failed; returning offline page instead.', error);
          // Opcjonalnie: Można tu zwrócić stronę offline, jeśli taka istnieje
          // return caches.match('offline.html'); 
        });
      })
  );
});
