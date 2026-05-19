'use client';

/**
 * Mounts FCM push token registration once the user is signed in.
 *
 * Part of FEAT-FCM-PUSH-NOTIF scaffolding. The actual delivery / click
 * navigation pipeline is a separate task (P-FCM-DELIVERY). This provider
 * intentionally renders nothing — it only triggers a side effect that:
 *   1. Waits for an authenticated user.
 *   2. Skips silently if notification permission is denied or default.
 *   3. Registers the SW + persists the FCM token to Firestore.
 *
 * SSR-safe: the underlying helpers are no-ops on the server, and the effect
 * only runs in the browser.
 */

import { useEffect, useRef } from 'react';

import { useUser } from '@/firebase';
import { registerForPushToken } from '@/lib/fcm';

export function PushNotificationsProvider() {
  const { user, isUserLoading } = useUser();
  const attemptedRef = useRef<string | null>(null);

  useEffect(() => {
    if (isUserLoading || !user?.uid) return;
    if (typeof window === 'undefined') return;
    if (typeof Notification === 'undefined') return;
    // Only proceed if the user has already granted permission. We do NOT
    // prompt on mount — that would be hostile UX. A dedicated CTA elsewhere
    // (settings / first-run flow) will call `requestPushPermission()` directly.
    if (Notification.permission !== 'granted') return;
    // Guard against re-registering on the same uid within a single session.
    if (attemptedRef.current === user.uid) return;
    attemptedRef.current = user.uid;
    void registerForPushToken(user.uid);
  }, [user?.uid, isUserLoading]);

  return null;
}
