'use client';

/**
 * Web ↔ HangelCheckin Capacitor plugin köprüsü (geofence izleyici).
 *
 * Bir etkinliğe check-in yapan kullanıcının cihazında o etkinlik konumu için
 * geofence kurar; kullanıcı 150m bölgeden çıkınca otomatik checkout HTTP DELETE
 * tetiklenir. Background location entitlement gerektirir (Xcode capability).
 */

import { Capacitor, registerPlugin } from '@capacitor/core';

import { initializeFirebase } from '@/firebase';

type AuthStatus = 'notDetermined' | 'restricted' | 'denied' | 'always' | 'whenInUse' | 'unknown';

interface HangelCheckinPlugin {
  requestAlwaysPermission(): Promise<{ status: AuthStatus }>;
  startMonitoring(opts: { eventId: string; latitude: number; longitude: number; radius?: number }): Promise<{ ok: boolean; eventId: string }>;
  stopMonitoring(opts: { eventId: string }): Promise<{ ok: boolean }>;
  stopAll(): Promise<{ ok: boolean }>;
  listMonitored(): Promise<{ eventIds: string[] }>;
  addListener(eventName: 'regionExit', cb: (data: { eventId: string; exitedAt: number }) => void): Promise<{ remove: () => Promise<void> }>;
  addListener(eventName: 'monitoringError', cb: (data: { eventId: string; error: string }) => void): Promise<{ remove: () => Promise<void> }>;
}

const HangelCheckin = registerPlugin<HangelCheckinPlugin>('HangelCheckin');

export async function requestCheckinAlwaysPermission(): Promise<AuthStatus> {
  if (!Capacitor.isNativePlatform()) return 'unknown';
  try {
    const { status } = await HangelCheckin.requestAlwaysPermission();
    return status;
  } catch {
    return 'unknown';
  }
}

export async function startCheckinGeofence(opts: {
  eventId: string;
  latitude: number;
  longitude: number;
  radius?: number;
}): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    const result = await HangelCheckin.startMonitoring(opts);
    return result.ok;
  } catch (e) {
    console.warn('[checkin] startMonitoring failed', e);
    return false;
  }
}

export async function stopCheckinGeofence(eventId: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await HangelCheckin.stopMonitoring({ eventId });
  } catch {
    /* sessiz */
  }
}

/**
 * Auto-checkout listener — uygulama ilk açılırken bir kez kurulur.
 * regionExit olayı geldiğinde `/api/events/[id]/checkin`'e DELETE atılır.
 */
export async function attachAutoCheckoutListener(): Promise<{ remove: () => Promise<void> } | null> {
  if (!Capacitor.isNativePlatform()) return null;
  try {
    return await HangelCheckin.addListener('regionExit', async ({ eventId }) => {
      try {
        const { auth } = initializeFirebase();
        const user = auth.currentUser;
        if (!user) return;
        const idToken = await user.getIdToken();
        await fetch(`/api/events/${encodeURIComponent(eventId)}/checkin`, {
          method: 'DELETE',
          headers: { authorization: `Bearer ${idToken}` },
        });
        // Geofence artık gereksiz — temizle
        void HangelCheckin.stopMonitoring({ eventId });
      } catch (e) {
        console.warn('[checkin] auto-checkout failed', e);
      }
    });
  } catch {
    return null;
  }
}
