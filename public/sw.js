// Minimal app-shell service worker. Cracked is auth-gated, per-user, and
// its middleware redirects almost every route — page navigations are
// never intercepted (see the fetch handler below for why). The only
// thing this actually caches is hashed, immutable /_next/static/ build
// assets, safe to cache forever since a new deploy ships new filenames.
const CACHE_NAME = "cracked-shell-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(["/manifest.webmanifest"])));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Never intercept page navigations. This app's auth middleware can
  // redirect almost any route (unauthenticated -> /login, the magic-link
  // callback's own redirect after exchanging the code, authenticated
  // hitting /login -> /today), and a service worker's "manual" redirect
  // handling for navigate requests is fragile across multi-hop redirect
  // chains — in production this actually misfired into the offline
  // fallback during real sign-ins. Let the browser handle every
  // navigation natively; only static build assets get offline treatment.
  if (request.mode === "navigate") return;

  // Hashed build assets: cache-first, so a revisit while offline can still
  // load the app shell's JS/CSS instead of failing outright.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
  }
});
