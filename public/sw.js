const CACHE_NAME = "ct1-static-v4";
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
  self.clients.claim();
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", event => {
  const url = event.request.url;

  // Always bypass cache for auth-related requests
  if (shouldBypassCache(url)) {
    return;
  }

  // Handle navigation requests (SPA routing) - serve cached index.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache the latest index.html
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put('/', clone));
          return response;
        })
        .catch(() => {
          return caches.match('/').then(cached => {
            if (cached) return cached;
            return caches.match('/offline.html');
          });
        })
    );
    return;
  }

  // For other requests (assets, etc.), try network first then cache
  // But DON'T intercept if we can't handle it gracefully
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache successful responses for static assets
        if (response.ok && url.startsWith(self.location.origin)) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then(cached => {
          if (cached) return cached;
          // Don't return offline.html for non-navigation requests
          return new Response('', { status: 503, statusText: 'Offline' });
        });
      })
  );
});
