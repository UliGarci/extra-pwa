const CACHE_NAME = "pwa-cache-v7";
const files = [
  "/",
  "/index.html",
  "/ver.html",
  "/app.js",
  "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css",
  "https://cdn.jsdelivr.net/npm/pouchdb@7.3.1/dist/pouchdb.min.js",
  "https://cdn.jsdelivr.net/npm/sweetalert2@11"
];

self.addEventListener("install", (event) => {
  console.log("Service Worker instalado");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Cacheando archivos");
      return cache.addAll(files);
    })
  );
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker activado");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log("Eliminando caché antiguo:", cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((networkResponse) => {
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      });
    }).catch(() => {
      if (event.request.mode === 'navigate') {
        return caches.match("/productos.html");
      }
    })
  );
});