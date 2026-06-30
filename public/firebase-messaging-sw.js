/* eslint-disable */
/**
 * Firebase Cloud Messaging service worker.
 *
 * Scaffolding for FEAT-FCM-PUSH-NOTIF. Actual notification CONTENT delivery
 * (foreground / background payload routing, click-through navigation, image
 * payloads, action buttons) is tracked under follow-up task P-FCM-DELIVERY.
 *
 * IMPORTANT: This file is served from the site origin at `/firebase-messaging-sw.js`
 * and MUST be loaded with `navigator.serviceWorker.register('/firebase-messaging-sw.js')`.
 *
 * Firebase config values are intentionally inlined here (no env interpolation
 * available inside `public/`). Keep in sync with `src/firebase/config.ts`.
 * messagingSenderId is the only field Firebase Messaging strictly requires
 * to receive pushes, but supplying the full config lets us use the compat SDK.
 */

// Use the Firebase compat SDK via CDN — compat is required inside service
// workers because the modular SDK does not yet expose a SW-friendly bundle.
importScripts('https://www.gstatic.com/firebasejs/11.9.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.9.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyAP689V_IUGV6qqd3g6BM3mLh9ix3jDN0g',
  authDomain: 'hangelorg.firebaseapp.com',
  projectId: 'hangelorg',
  storageBucket: 'hangelorg.firebasestorage.app',
  messagingSenderId: '1082876850664',
  appId: '1:1082876850664:web:c17a8c500ab668408cb45d',
});

const messaging = firebase.messaging();

// Background message handler. For now we let the browser auto-display the
// `notification` field (default behaviour when this handler is registered but
// no `self.registration.showNotification()` is called). P-FCM-DELIVERY will
// expand this to handle `data`-only payloads + click navigation.
messaging.onBackgroundMessage(function (_payload) {
  // Intentionally empty — see P-FCM-DELIVERY for content/click handling.
});

/**
 * FEAT-OFFLINE: Offline navigation fallback.
 *
 * Service worker yalnızca navigation request'leri (top-level HTML) için
 * minimal bir offline page ile cevap verir. CSS / API / asset request'leri
 * doğrudan network'e geçer — Firestore IndexedDB cache + offline-queue.ts
 * data katmanını handle ediyor.
 *
 * Install/activate adımlarında basit bir static HTML cache'ler.
 */
const OFFLINE_CACHE = 'hangel-offline-v1';
const OFFLINE_URL = '/offline.html';
const OFFLINE_FALLBACK_HTML = `
<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Çevrimdışı · hangel</title>
<style>
  html,body{margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;background:#0b0d12;color:#fff;height:100%}
  .wrap{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;text-align:center;padding:24px}
  .logo{font-weight:900;font-size:28px;letter-spacing:-0.02em;margin-bottom:24px}
  .title{font-size:22px;font-weight:700;margin:0 0 8px}
  .desc{opacity:0.7;max-width:320px;margin:0 0 32px;line-height:1.5}
  .btn{background:#fff;color:#0b0d12;padding:12px 24px;border-radius:9999px;border:0;font-weight:600;cursor:pointer}
</style>
</head>
<body>
<div class="wrap">
  <div class="logo">hangel</div>
  <h1 class="title">Çevrimdışısın</h1>
  <p class="desc">İnternet bağlantın yok. Bağlantı geri geldiğinde sayfa yeniden yüklenecek.</p>
  <button class="btn" onclick="location.reload()">Yeniden Dene</button>
</div>
<script>
  window.addEventListener('online', function(){ location.reload(); });
</script>
</body>
</html>
`;

self.addEventListener('install', function (event) {
  event.waitUntil((async function () {
    try {
      const cache = await caches.open(OFFLINE_CACHE);
      const response = new Response(OFFLINE_FALLBACK_HTML, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
      await cache.put(OFFLINE_URL, response);
    } catch (_e) {
      // Cache API kullanılamıyorsa sessizce geç
    }
    if (self.skipWaiting) self.skipWaiting();
  })());
});

self.addEventListener('activate', function (event) {
  event.waitUntil((async function () {
    // Eski cache versiyonlarını sil
    try {
      const keys = await caches.keys();
      await Promise.all(keys.filter(function (k) { return k !== OFFLINE_CACHE; }).map(function (k) { return caches.delete(k); }));
    } catch (_e) { /* noop */ }
    if (self.clients && self.clients.claim) await self.clients.claim();
  })());
});

self.addEventListener('fetch', function (event) {
  var req = event.request;
  // Yalnızca navigation (top-level HTML) için offline fallback.
  if (req.mode !== 'navigate') return;

  event.respondWith((async function () {
    try {
      // preload kullanılırsa hızlı path
      var preload = event.preloadResponse ? await event.preloadResponse : null;
      if (preload) return preload;
      return await fetch(req);
    } catch (_e) {
      try {
        var cache = await caches.open(OFFLINE_CACHE);
        var cached = await cache.match(OFFLINE_URL);
        if (cached) return cached;
      } catch (_e2) { /* noop */ }
      return new Response(OFFLINE_FALLBACK_HTML, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }
  })());
});
