// Bump this on any deploy that must invalidate the static cache. The activate
// handler deletes prior app caches, so a version bump alone evicts stale
// ThriveUp assets without touching caches owned by another library.
const CACHE_VERSION = "v2";
const CACHE_NAME = `thriveup-benefits-${CACHE_VERSION}`;
const CACHE_PREFIX = "thriveup-benefits-";

const STATIC_ASSETS = [
  "/",
  "/benefits-screener",
  "/manifest.json",
];

// Hard cap on how many entries the static cache may hold, so it can't grow
// unbounded across a long-lived install.
const MAX_STATIC_ENTRIES = 60;

async function trimCache(cacheName, maxEntries) {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    if (keys.length <= maxEntries) return;
    // Delete oldest-first (Cache API preserves insertion order).
    const overflow = keys.length - maxEntries;
    for (let i = 0; i < overflow; i++) {
      await cache.delete(keys[i]);
    }
  } catch {
    /* best-effort */
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k.startsWith(CACHE_PREFIX) && k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  // NEVER cache API responses. Stale/auth-scoped API data surviving a deploy
  // was causing users to see outdated lesson content. API is network-only —
  // no cache read, no cache write, no offline fallback from cache.
  if (request.url.includes("/api/")) {
    return; // let the network handle it directly; do not respondWith a cache
  }

  // Only handle same-origin GETs (skip cross-origin, chrome-extension, etc.).
  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }
  if (url.origin !== self.location.origin) return;

  // Cache the explicit shell plus production-generated static bundles. Never
  // cache arbitrary HTML routes or API/authenticated pages, which could
  // otherwise be replayed to another user. Bundles are safe to cache because
  // they contain no user-specific response data.
  const isStaticAsset = STATIC_ASSETS.includes(url.pathname) || url.pathname.startsWith("/assets/");

  // Navigation fallback: for same-origin HTML navigations that aren't a cached
  // static asset, try the network first. If offline and the root shell is
  // cached, return it so the SPA can hydrate rather than showing a browser
  // network-error page. API routes are excluded above; this only reaches
  // navigations to app routes like /hub, /grants, etc.
  if (!isStaticAsset && request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        const shell = await cache.match("/");
        return shell || Response.error();
      })
    );
    return;
  }

  if (!isStaticAsset) return;

  // Static assets: cache-first with background refresh, bounded.
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => cache.match(request).then((cached) => {
      if (cached) {
        fetch(request).then((res) => {
          if (res && res.ok) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, res.clone());
              trimCache(CACHE_NAME, MAX_STATIC_ENTRIES);
            });
          }
        }).catch(() => {});
        return cached;
      }
      return fetch(request).then((res) => {
        if (res && res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, clone);
            trimCache(CACHE_NAME, MAX_STATIC_ENTRIES);
          });
        }
        return res;
      });
    }))
  );
});
