'use client';

/**
 * Mounts FCM push token registration once the user is signed in.
 *
 * Native (Capacitor) iOS/Android: @capacitor-firebase/messaging plugin'i ile
 * sistem push permission dialog'unu açar, token alır, Firestore'a yazar.
 * Listener'lar da kurulur (tokenReceived refresh, notification tap → deep link).
 *
 * Web: mevcut FCM web push akışı korunur — Notification.permission === 'granted'
 * ise re-register, değilse no-op (kullanıcı izin verene kadar prompt edilmez).
 *
 * Crashlytics user identifier de native'de set edilir — auth değiştikçe
 * crash report'larında uid görünür.
 *
 * SSR-safe.
 */

import { useEffect, useRef } from 'react';

import { Capacitor } from '@capacitor/core';

import { useUser } from '@/firebase';
import { registerForPushToken } from '@/lib/fcm';
import { attachNativePushListeners, registerNativePushToken } from '@/lib/native-push';
import { requestAllNativePermissions } from '@/lib/native-permissions';
import { setCrashlyticsUser } from '@/lib/native-crashlytics';

export function PushNotificationsProvider() {
  const { user, isUserLoading } = useUser();
  const attemptedRef = useRef<string | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (isUserLoading) return;
    if (typeof window === 'undefined') return;

    if (!user?.uid) {
      // Logout: Crashlytics user'ı temizle, native listener'ı kaldır.
      void setCrashlyticsUser(null);
      if (cleanupRef.current) { cleanupRef.current(); cleanupRef.current = null; }
      attemptedRef.current = null;
      return;
    }

    // Aynı uid için tekrar denenmesin
    if (attemptedRef.current === user.uid) return;
    attemptedRef.current = user.uid;

    void setCrashlyticsUser(user.uid);

    if (Capacitor.isNativePlatform()) {
      void registerNativePushToken(user.uid);
      cleanupRef.current = attachNativePushListeners(user.uid);
      // Girişte tüm native izinleri iste (konum + rehber; push yukarıda).
      void requestAllNativePermissions();
      return;
    }

    if (typeof Notification === 'undefined') return;
    // Web: only proceed if permission was previously granted. A dedicated CTA
    // (settings / first-run flow) is responsible for the initial prompt.
    if (Notification.permission !== 'granted') return;
    void registerForPushToken(user.uid);
  }, [user?.uid, isUserLoading]);

  return null;
}
