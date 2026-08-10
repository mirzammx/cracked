// Minimal app-shell service worker. Cracked is auth-gated and per-user, so
// this deliberately does NOT cache-first any HTML/page response — that
// could serve one account's page to another on a shared device, or stale
// auth state. It only caches:
//   1. A static, non-personalized offline fallback page.
//   2. Hashed, immutable /_next/static/ build assets (safe to cache
//      forever — a new deploy ships new hashed filenames).
const CACHE_NAME = "cracked-shell-v1";
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll([OFFLINE_URL, "/manifest.webmanifest"]))
  );
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

  // Page navigations: always try the network first (real, current,
  // per-user data) — only fall back to the static offline notice if
  // there's genuinely no connection.
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
    return;
  }

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
