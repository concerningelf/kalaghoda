const CACHE_NAME = 'kala-ghoda-no-cache-v1';

// 1. Install Phase
self.addEventListener('install', (event) => {
    // Force this service worker to become active immediately, skipping the 'waiting' state.
    // This ensures that the new "no-cache" logic takes over right away.
    self.skipWaiting();
});

// 2. Activate Phase
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            // DELETE ALL CACHES. We want a clean slate.
            return Promise.all(
                cacheNames.map((cacheName) => {
                    console.log('Clearing old cache:', cacheName);
                    return caches.delete(cacheName);
                })
            );
        }).then(() => {
            // Take control of all open pages immediately.
            return self.clients.claim();
        })
    );
});

// 3. Fetch Phase
self.addEventListener('fetch', (event) => {
    // NETWORK ONLY STRATEGY
    // We intentionally do NOT use event.respondWith(caches.match(...))
    // By doing nothing here, the browser acts as if there is no service worker 
    // for fetching instructions, and thus goes straight to the network.
    return;
});
