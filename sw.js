// Offline-Cache für RD Pocket. Version erhöhen, wenn Dateien geändert werden.
const CACHE = "rdpocket-v13";
const FILES = ["./", "index.html", "styles.css", "app.js", "data.js", "algos-k.js", "algos-m.js", "algos-v.js", "algo.js", "signals.js", "sosi.js",
  "manifest.webmanifest", "icon-180.png", "icon-512.png"];
// Originalseiten (orig/*.jpg) werden beim ersten Ansehen bzw. über „offline speichern“ in den Cache gelegt.

self.addEventListener("install", (e) => {
  // cache: "reload" umgeht den HTTP-Cache (GitHub Pages: max-age=600), sonst landen alte Dateien im neuen Cache
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES.map((f) => new Request(f, { cache: "reload" })))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
// Netzwerk zuerst (immer beim Server nachfragen, ob es Neues gibt), bei Funkloch aus dem Cache
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request, { cache: "no-cache" }).then((r) => { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); return r; })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
