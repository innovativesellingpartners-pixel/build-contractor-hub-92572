const CACHE_NAME = "ct1-static-v3";
const URLS_TO_CACHE = ["/", "/offline.html"];

// Don't cache these - they need fresh auth tokens
const EXCLUDED_URLS = [
  'supabase.co',
  '/auth/',
  '/rest/v1/',
  '/storage/v1/',
  '/functions/v1/',
  '/~oauth'
];

function shouldBypassCache(url) {
  return EXCLUDED_URLS.some(excluded => url.includes(excluded));
}

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(URLS_TO_CACHE);
    })
  );
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      );
    })
  );
  // Take control of all clients immediately
  self.clients.claim();
});

// Listen for skip waiting message
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", event => {
  const url = event.request.url;
  
  // Always bypass cache for auth-related requests
  if (shouldBypassCache(url)) {
    event.respondWith(fetch(event.request));
    return;
  }

  // For other requests, try network first, then cache
  event.respondWith(
    fetch(event.request)
      .catch(() => {
        return caches.match(event.request).then(response => {
          if (response) return response;
          return caches.match("/offline.html");
        });
      })
  );
});
