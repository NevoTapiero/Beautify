// Beautify service worker — gives each beautician's installed app offline
// resilience + auto-update. Strategy: network-first for navigations (so a fresh
// HTML is fetched when online, cached shell when offline), cache-first for the
// hashed, immutable build assets.
const CACHE = "beautify-v2";

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("message", (e) => {
  if (e.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (e) => {
  const { request } = e;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // skip Supabase/CDN calls

  // App navigations: network-first, fall back to cached shell when offline.
  // Cached per-request (per studio URL), not under one shared "/" key --
  // that used to let one studio's cached page get served for another's.
  if (request.mode === "navigate") {
    e.respondWith(
      fetch(request)
        .then((res) => { caches.open(CACHE).then((c) => c.put(request, res.clone())); return res; })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Hashed build assets: cache-first (they never change for a given URL).
  if (url.pathname.startsWith("/assets/")) {
    e.respondWith(
      caches.match(request).then((cached) =>
        cached || fetch(request).then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy));
          return res;
        })
      )
    );
  }
});
