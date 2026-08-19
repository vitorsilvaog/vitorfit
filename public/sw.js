const CACHE_NAME = "vitorfit-v3";
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              return caches.delete(key);
            }
          })
        )
      ),
    ])
  );
});

self.addEventListener("fetch", (event) => {
  // Para las páginas de VitorFit siempre buscamos la versión nueva.
  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request));
    return;
  }

  // Para el resto: red primero y caché solo como respaldo.
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});