/**
 * Firebase Cloud Messaging (web) client helpers.
 *
 * Part of FEAT-FCM-PUSH-NOTIF scaffolding. Provides:
 *  - `requestPushPermission()` — prompts the browser for Notification permission.
 *  - `registerForPushToken(uid)` — registers the service worker, gets a token
 *    from Firebase Messaging, and persists it under `users/{uid}/fcmTokens/{token}`.
 *
 * Actual payload delivery + click handling is tracked under follow-up task
 * P-FCM-DELIVERY. iOS / Capacitor native push is a separate workstream
 * (`@capacitor/push-notifications` is NOT installed yet).
 *
 * Hard rules:
 *  - Read VAPID key from `process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY`.
 *  - Permission denied -> no error thrown, just returns null.
 *  - Firestore write failure (e.g. rules) -> swallowed with warn-only log.
 *  - All functions are no-ops on the server (SSR-safe).
 */

import { getMessaging, getToken, isSupported, type Messaging } from 'firebase/messaging';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';

import { initializeFirebase } from '@/firebase';
import { COLLECTIONS } from '@/firebase/collections';

const SW_PATH = '/firebase-messaging-sw.js';

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof navigator !== 'undefined';
}

/**
 * Prompt the browser for Notification permission. Safe to call multiple times —
 * the browser will short-circuit after the first decision. Returns the final
 * permission state, or `'denied'` on unsupported environments.
 */
export async function requestPushPermission(): Promise<NotificationPermission> {
  if (!isBrowser() || typeof Notification === 'undefined') return 'denied';
  if (Notification.permission === 'granted' || Notification.permission === 'denied') {
    return Notification.permission;
  }
  try {
    return await Notification.requestPermission();
  } catch {
    return 'denied';
  }
}

async function getMessagingInstance(): Promise<Messaging | null> {
  if (!isBrowser()) return null;
  try {
    const supported = await isSupported();
    if (!supported) return null;
    const { firebaseApp } = initializeFirebase();
    return getMessaging(firebaseApp);
  } catch {
    return null;
  }
}

async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isBrowser() || !('serviceWorker' in navigator)) return null;
  try {
    // Reuse an existing registration if one exists for the SW path.
    const existing = await navigator.serviceWorker.getRegistration(SW_PATH);
    if (existing) return existing;
    return await navigator.serviceWorker.register(SW_PATH);
  } catch (err) {
    if (typeof console !== 'undefined') {
      console.warn('[fcm] service worker registration failed', err);
    }
    return null;
  }
}

/**
 * Register the FCM service worker, request a push token, and persist it
 * to Firestore under `users/{uid}/fcmTokens/{token}`. Returns the token on
 * success, or null if permission is denied / FCM is unsupported / VAPID key
 * is missing / Firestore write was rejected.
 *
 * This function is intentionally idempotent: calling it again with the same
 * UID + browser will simply `setDoc(..., { merge: true })` on the same doc.
 */
export async function registerForPushToken(uid: string): Promise<string | null> {
  if (!uid || !isBrowser()) return null;

  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  if (!vapidKey) {
    if (typeof console !== 'undefined') {
      console.warn('[fcm] NEXT_PUBLIC_FIREBASE_VAPID_KEY not set — skipping push token registration.');
    }
    return null;
  }

  const permission = await requestPushPermission();
  if (permission !== 'granted') return null;

  const swRegistration = await registerServiceWorker();
  if (!swRegistration) return null;

  const messaging = await getMessagingInstance();
  if (!messaging) return null;

  let token: string | null;
  try {
    token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: swRegistration,
    });
  } catch (err) {
    if (typeof console !== 'undefined') {
      console.warn('[fcm] getToken failed', err);
    }
    return null;
  }

  if (!token) return null;

  try {
    const { firestore } = initializeFirebase();
    const tokenDoc = doc(firestore, COLLECTIONS.users, uid, COLLECTIONS.fcmTokens, token);
    await setDoc(
      tokenDoc,
      {
        createdAt: serverTimestamp(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      },
      { merge: true },
    );
  } catch (err) {
    // Graceful degradation: rules may not yet allow this write. We still
    // return the token so the caller knows registration succeeded client-side.
    if (typeof console !== 'undefined') {
      console.warn('[fcm] failed to persist token to Firestore (continuing)', err);
    }
  }

  return token;
}
