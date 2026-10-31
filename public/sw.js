/**
 * Kanganheri Darpan — Offline Service Worker
 * Guarantees offline availability of emergency lifelines, land converter, and core styles.
 */

const CACHE_NAME = "kanganheri-cache-v1";

const PRECACHE_URLS = [
  "/",
  "/hi",
  "/en",
  "/hi/emergency",
  "/en/emergency",
  "/hi/tools/land-converter",
  "/en/tools/land-converter",
  "/manifest.webmanifest",
  "/icon",
  "/apple-icon",
];

// Install: precache critical civic lifelines
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

// Activate: cleanup stale caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              return caches.delete(key);
            }
          }),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// Fetch: Network-first for dynamic content, cache fallback for emergency resilience
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Never cache non-GET requests or internal API mutations
  if (event.request.method !== "GET" || url.pathname.startsWith("/api/")) {
    return;
  }

  // Static assets (images, fonts, scripts) -> Stale-while-revalidate
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.endsWith(".woff2") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".svg")
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(event.request).then((cached) => {
          const fetched = fetch(event.request).then((response) => {
            if (response.ok) {
              cache.put(event.request, response.clone());
            }
            return response;
          });
          return cached || fetched;
        }),
      ),
    );
    return;
  }

  // HTML navigation requests -> Network first, fallback to cached emergency / offline shell
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(event.request);
          if (cached) return cached;

          // If offline and requesting another page, serve the cached emergency page
          const emergencyFallback =
            (await caches.match("/hi/emergency")) || (await caches.match("/en/emergency"));
          if (emergencyFallback) return emergencyFallback;

          return new Response(
            `<!DOCTYPE html>
            <html lang="hi">
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <title>कांगनहेड़ी दर्पण — ऑफ़लाइन मोड</title>
              <style>
                body { font-family: system-ui, sans-serif; background: #fffbeb; color: #1c1917; padding: 2rem; text-align: center; }
                .card { max-width: 480px; margin: 3rem auto; background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); border-top: 6px solid #dc2626; }
                h1 { color: #dc2626; font-size: 1.5rem; margin-bottom: 0.5rem; }
                p { font-size: 0.95rem; line-height: 1.5; color: #444; }
                .contacts { margin: 1.5rem 0; text-align: left; }
                .item { padding: 0.6rem 0; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; }
                .btn { display: inline-block; background: #ea580c; color: white; padding: 0.75rem 1.5rem; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 1rem; }
              </style>
            </head>
            <body>
              <div class="card">
                <h1>⚠️ ऑफ़लाइन मोड (Offline Mode)</h1>
                <p>इंटरनेट कनेक्शन उपलब्ध नहीं है। आप नीचे दिए गए नंबरों पर सीधे कॉल कर सकते हैं:</p>
                <div class="contacts">
                  <div class="item"><span>छावला पुलिस (Police):</span> <a href="tel:100"><b>100 / 011-25303100</b></a></div>
                  <div class="item"><span>एम्बुलेंस (Ambulance):</span> <a href="tel:102"><b>102</b></a></div>
                  <div class="item"><span>RTRM अस्पताल जाफरपुर:</span> <a href="tel:01125303000"><b>011-25303000</b></a></div>
                  <div class="item"><span>BSES बिजली फॉल्ट:</span> <a href="tel:19123"><b>19123</b></a></div>
                  <div class="item"><span>DJB पानी टैंकर:</span> <a href="tel:1916"><b>1916</b></a></div>
                </div>
                <a href="tel:100" class="btn">आपातकालीन कॉल (100)</a>
              </div>
            </body>
            </html>`,
            { headers: { "Content-Type": "text/html; charset=utf-8" } },
          );
        }),
    );
  }
});
