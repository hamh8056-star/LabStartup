self.addEventListener("install", event => {
  event.waitUntil(self.skipWaiting())
})

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(cacheNames => Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)))),
  )
  event.waitUntil(self.clients.claim())
})

self.addEventListener("fetch", event => {
  event.respondWith(fetch(event.request))
})

self.addEventListener("message", event => {
  if (event.data === "CLEAR_CACHES") {
    caches.keys().then(cacheNames => Promise.all(cacheNames.map(cacheName => caches.delete(cacheName))))
  }
})

