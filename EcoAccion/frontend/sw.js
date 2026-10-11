/* Service Worker de EcoAccion (PWA).
   Cachea el "app shell" para que la app abra como instalada y funcione
   aunque la red esté lenta. Las APIs siempre van a la red (datos frescos). */
const CACHE = "ecoaccion-v2";
const ASSETS = [
  "./", "index.html", "login.html", "registro.html", "registrar.html", "historial.html",
  "retos.html", "ranking.html", "impacto.html", "gestionar.html",
  "css/estilos.css", "manifest.json", "icon-192.png", "icon-512.png",
  "js/api-local.js", "js/auth.js", "js/login.js", "js/registro.js",
  "js/registrar.js", "js/historial.js", "js/retos.js", "js/ranking.js",
  "js/impacto.js", "js/gestionar.js", "js/pwa.js"
];

self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches.keys().then((claves) =>
      Promise.all(claves.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (evento) => {
  const req = evento.request;
  // Las APIs nunca se cachean: siempre a la red.
  if (req.url.includes("/api/")) {
    evento.respondWith(
      fetch(req).catch(() =>
        new Response(JSON.stringify({ ok: false, mensaje: "Sin conexión." }), {
          headers: { "Content-Type": "application/json" },
          status: 503,
        })
      )
    );
    return;
  }
  // App shell: primero cache, si no está va a la red.
  evento.respondWith(caches.match(req).then((r) => r || fetch(req)));
});
