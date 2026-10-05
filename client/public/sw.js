// Bump this on any deploy that must invalidate the static cache. The activate
// handler deletes prior app caches, so a version bump alone evicts stale
// ThriveUp assets without touching caches owned by another library.
const CACHE_VERSION = "v4";
const CACHE_NAME = `thriveup-benefits-${CACHE_VERSION}`;
const CACHE_PREFIX = "thriveup-benefits-";

const STATIC_ASSETS = [
  "/",
  "/benefits-screener",
  "/manifest.json",
  "/platform-overview.pdf",
  "/platform-overview.html",
];

// Hard cap on how many entries the static cache may hold, so it can't grow
// unbounded across a long-lived install.
const MAX_STATIC_ENTRIES = 60;

function cacheKey(request) {
  const url = new URL(request.url);
  url.search = "";
  url.hash = "";
  return new Request(url.toString(), { method: "GET" });
}

async function trimCache(cacheName, maxEntries) {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    if (keys.length <= maxEntries) return;
    // Keep the shell and standalone briefing assets pinned. Query-string
    // variants are normalized by cacheKey(), so they cannot consume slots.
    const pinned = new Set(STATIC_ASSETS);
    const removable = keys.filter((key) => !pinned.has(new URL(key.url).pathname));
    const overflow = Math.max(0, keys.length - maxEntries);
    for (let i = 0; i < Math.min(overflow, removable.length); i++) {
      await cache.delete(removable[i]);
    }
  } catch (error) {
    console.warn("[ServiceWorker] Cache trim skipped:", error);
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .catch((error) => {
        console.error("[ServiceWorker] Static asset install failed:", error);
        throw error;
      })
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

  // All HTML navigation is network-first, including the public root, so a
  // cached old entry page cannot hide a new focused experience. If offline and the root shell is
  // cached, return it so the SPA can hydrate rather than showing a browser
  // network-error page. API routes are excluded above; this only reaches
  // navigations to app routes like /hub, /grants, etc.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).then(async response => {
        if (response.ok && url.pathname === "/") {
          try {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(cacheKey(request), response.clone());
          } catch (error) {
            console.warn("[ServiceWorker] Public shell cache update failed:", error);
          }
        }
        return response;
      }).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        const shell = await cache.match("/");
        return shell || Response.error();
      })
    );
    return;
  }

  if (!isStaticAsset) return;

  // Static assets: cache-first with background refresh, bounded.
    const key = cacheKey(request);
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => cache.match(key).then((cached) => {
      if (cached) {
        fetch(request).then((res) => {
          if (res && res.ok) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(key, res.clone());
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
            cache.put(key, clone);
            trimCache(CACHE_NAME, MAX_STATIC_ENTRIES);
          });
        }
        return res;
      });
    }))
  );
});
