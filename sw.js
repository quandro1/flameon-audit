/* Flame On — Operations Audit · service worker
 *
 * Purpose: the app must open and run a full audit with no signal at all (branch basements,
 * the Warehouse cold store, Murree Road at 9pm). Everything the app needs is precached on
 * install; audit DATA never touches this cache — it lives in localStorage/IndexedDB and is
 * uploaded by the app itself.
 *
 * ── Bump CACHE whenever you change index.html ──
 * Devices keep serving the cached copy until the cache name changes. Change the version below
 * on every deploy, or auditors will keep running the old questionnaire.
 */
var CACHE = "flameon-audit-v8.1.0";

var SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-180.png"
];

self.addEventListener("install", function (e) {
  /* No skipWaiting: a new version must never swap itself in under an auditor who is mid-audit.
     The page shows a "Reload now" banner instead, and the update lands on their next launch. */
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      /* addAll is all-or-nothing; add individually so one 404 can't leave the app uninstalled. */
      return Promise.all(SHELL.map(function (u) {
        return c.add(new Request(u, { cache: "reload" })).catch(function () {});
      }));
    })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        return k === CACHE ? null : caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;                       /* audit uploads must never be cached */
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;        /* let the HQ endpoint through untouched */

  /* Navigations: network first, so an online auditor always gets the current questionnaire;
     cached shell when the network is missing or slow to fail. */
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put("./index.html", copy); }).catch(function () {});
        return res;
      }).catch(function () {
        return caches.match("./index.html").then(function (m) {
          return m || caches.match("./") || new Response(
            "<h1>Offline</h1><p>The audit app is not cached on this device yet. Open it once with a connection.</p>",
            { headers: { "Content-Type": "text/html;charset=utf-8" }, status: 503 }
          );
        });
      })
    );
    return;
  }

  /* Everything else (icons, manifest): cache first — they change only with a CACHE bump. */
  e.respondWith(
    caches.match(req).then(function (m) {
      return m || fetch(req).then(function (res) {
        if (res && res.ok && res.type === "basic") {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); }).catch(function () {});
        }
        return res;
      });
    })
  );
});
