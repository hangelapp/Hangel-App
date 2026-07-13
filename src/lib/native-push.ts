'use client';

/**
 * Native (Capacitor) FCM push token registration.
 *
 * Mevcut `src/lib/fcm.ts` web push token akışını yürütüyor. Bu modül onun
 * native eşdeğeri — Capacitor üzerinde @capacitor-firebase/messaging plugin'i
 * ile iOS APNs / Android FCM token alır, aynı `users/{uid}/fcmTokens/{token}`
 * koleksiyonuna yazar. Server-side `sendPushToUser` (src/lib/push-notifications.ts)
 * web/native ayrımı yapmadan multicast yapacak şekilde tasarlandığından,
 * tek bir token şeması yeterli.
 *
 * Token doc'una `type: 'native'` ve `platform: 'ios'|'android'` alanları
 * eklenir; ileride invalid-token cleanup veya cihaz-bazlı targeting için
 * kullanılabilir.
 */

import { Capacitor } from '@capacitor/core';
import { FirebaseMessaging } from '@capacitor-firebase/messaging';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';

import { initializeFirebase } from '@/firebase';
import { COLLECTIONS } from '@/firebase/collections';
import { EVENTS, logHangelEvent } from '@/lib/analytics';

type Unsubscribe = () => void;

async function persistToken(uid: string, token: string): Promise<void> {
  const { firestore } = initializeFirebase();
  await setDoc(
    doc(firestore, COLLECTIONS.users, uid, COLLECTIONS.fcmTokens, token),
    {
      createdAt: serverTimestamp(),
      platform: Capacitor.getPlatform(),
      type: 'native',
    },
    { merge: true },
  );
}

export async function registerNativePushToken(uid: string): Promise<string | null> {
  if (!Capacitor.isNativePlatform() || !uid) return null;

  const initial = await FirebaseMessaging.checkPermissions();
  let perm = initial;
  if (perm.receive !== 'granted') {
    perm = await FirebaseMessaging.requestPermissions();
    // Sadece kullanıcıya ilk kez sorulduğunda (init === 'prompt') analytics gönder.
    if (initial.receive === 'prompt' || initial.receive === 'prompt-with-rationale') {
      if (perm.receive === 'granted') {
        logHangelEvent(EVENTS.enable_push, { platform: Capacitor.getPlatform() });
      } else {
        logHangelEvent(EVENTS.disable_push, { platform: Capacitor.getPlatform() });
      }
    }
    if (perm.receive !== 'granted') return null;
  }

  const { token } = await FirebaseMessaging.getToken();
  if (!token) return null;

  try {
    await persistToken(uid, token);
  } catch (err) {
    if (typeof console !== 'undefined') {
      console.warn('[native-push] failed to persist token', err);
    }
  }
  return token;
}

export function attachNativePushListeners(uid: string, navigate?: (path: string) => void): Unsubscribe {
  if (!Capacitor.isNativePlatform() || !uid) return () => {};

  const handles: Array<{ remove: () => Promise<void> }> = [];

  void FirebaseMessaging.addListener('tokenReceived', async (event) => {
    if (!event.token) return;
    try { await persistToken(uid, event.token); } catch { /* sessiz */ }
  }).then(h => handles.push(h));

  void FirebaseMessaging.addListener('notificationActionPerformed', (event) => {
    const data = event.notification?.data as Record<string, unknown> | undefined;
    // Backend bazen `clickAction` (Cloud Function onNotificationCreated),
    // bazen `link` (eski API'lar) yazıyor. İkisini de oku.
    const link =
      (typeof data?.link === 'string' ? data.link : undefined) ||
      (typeof data?.clickAction === 'string' ? data.clickAction : undefined);
    // Analytics: kullanıcı bildirimi açtı.
    const notifType = typeof data?.type === 'string' ? data.type : 'unknown';
    logHangelEvent(EVENTS.open_notification, { type: notifType });
    if (link && link.startsWith('/')) {
      // SPA navigasyonu (router.push) — window.location.assign TAM SAYFA RELOAD
      // yapıyordu → "bildirime tıklayınca sayfa kapanıp tekrar açılıyor" (garip
      // titreme). navigate verilmezse yalnızca güvenli fallback olarak location.
      if (navigate) navigate(link);
      else window.location.assign(link);
    }
  }).then(h => handles.push(h));

  return () => {
    handles.forEach(h => { void h.remove(); });
  };
}
