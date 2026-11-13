// Mebel 24: ilova fayllari keshda saqlanadi, internet sekin yoki yo'q bo'lsa ham tez ochiladi.
// Ma'lumotlar (Supabase) keshlanmaydi: ular har doim serverdan olinadi.
const CACHE = "mebel24-v3";
const FILES = ["./", "index.html", "styles.css", "config.js", "vendor/supabase.js", "backend.js", "seed.js", "app.js", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png", "icons/logo-mark.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return;
  // Avval tarmoqdan (yangi versiya darhol keladi), bo'lmasa keshdan
  if (u.pathname.endsWith("version.json")) return;
  e.respondWith(fetch(e.request, {cache:"no-cache"}).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); return r; }).catch(() => caches.match(e.request).then(r => r || caches.match("index.html"))));
});
