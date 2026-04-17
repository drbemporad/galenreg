// ── MT Forensic Law — Service Worker ─────────────────────────────────────────
// Strategy: cache-first for app shell, network-first for version.json
// To update the app: bump APP_VERSION here AND in version.json
// The old cache is deleted automatically on activation.

const APP_VERSION = '1.3';
const CACHE_NAME  = 'mt-forensic-law-v' + APP_VERSION;

const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  './version.json',
  './icon-192.png',
  './icon-512.png',
  // Google Fonts are fetched at runtime and cached on first load
];

// ── Message handler (allows page to trigger skipWaiting) ─────────────────────
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ── Install: pre-cache app shell ─────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: delete stale caches ────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key.startsWith('mt-forensic-law-') && key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: cache-first with network fallback ──────────────────────────────────
// version.json is always fetched from network (for update detection),
// falling back to cache if offline. Everything else is cache-first.
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Only handle same-origin + Google Fonts (for offline font caching)
  const isGoogleFont = url.hostname === 'fonts.googleapis.com' ||
                       url.hostname === 'fonts.gstatic.com';
  const isSameOrigin = url.origin === self.location.origin;

  if (!isSameOrigin && !isGoogleFont) return;

  // index.html and root: network-first so content updates reach the user automatically
  if (url.pathname.endsWith('index.html') || url.pathname.endsWith('/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // version.json: network-first so update banner works when online
  if (url.pathname.endsWith('version.json')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Clone into cache so it's available offline
          const clone = response.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Everything else: cache-first
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Cache successful GET responses
        if (response && response.status === 200 && event.request.method === 'GET') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
