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
  apiKey: 'AIzaSyAdh2WOfbPRh67DHKSBbznGVPRrGj0_ZfI',
  authDomain: 'hangel-new-v18-87297865-9bcc3.firebaseapp.com',
  projectId: 'hangel-new-v18-87297865-9bcc3',
  storageBucket: 'hangel-new-v18-87297865-9bcc3.firebasestorage.app',
  messagingSenderId: '1082171206975',
  appId: '1:1082171206975:web:8c2f26e0d4d262706a378a',
});

const messaging = firebase.messaging();

// Background message handler. For now we let the browser auto-display the
// `notification` field (default behaviour when this handler is registered but
// no `self.registration.showNotification()` is called). P-FCM-DELIVERY will
// expand this to handle `data`-only payloads + click navigation.
messaging.onBackgroundMessage(function (_payload) {
  // Intentionally empty — see P-FCM-DELIVERY for content/click handling.
});
