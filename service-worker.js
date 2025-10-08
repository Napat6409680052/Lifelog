self.addEventListener("install", e => {
  console.log("Service Worker installed");
  e.waitUntil(
    caches.open("lifelogging-cache").then(cache => {
      return cache.addAll([
        "index.html",
        "scenario1.html",
        "confidence.html",
        "summary.html",
        "style.css",
        "script.js",
        "beep.mp3",
        "manifest.json"
      ]);
    })
  );
});

self.addEventListener("fetch", e => {
  e.respondWith(
    caches.match(e.request).then(response => {
      return response || fetch(e.request);
    })
  );
});
