const CACHE_NAME = 'speak-practice-v1';

const PRECACHE_URLS = [
  '/',
  '/index.html',
];

// Install: precache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// Activate: clear old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network-first for static assets, skip API requests
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Don't cache API requests
  if (
    url.hostname.includes('api.anthropic.com') ||
    url.hostname.includes('api.openai.com') ||
    url.hostname.includes('generativelanguage.googleapis.com') ||
    url.hostname.includes('speech.microsoft.com') ||
    url.hostname.includes('tts.speech.microsoft.com') ||
    url.hostname.includes('api.unsplash.com') ||
    url.hostname.includes('picsum.photos') ||
    url.hostname.includes('images.unsplash.com')
  ) {
    return;
  }

  // Static assets: network first, fallback to cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
