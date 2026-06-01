'use client';

/**
 * Native silent push (aps.content-available=1) köprüsü.
 *
 * iOS native tarafı (HangelSilentPushPlugin) APNs silent push'u
 * NotificationCenter üzerinden yakalar ve bu plugin web'e `silentPush`
 * event'i emit eder. Payload her zaman APNs'in `aps` dışındaki anahtarlarını
 * içerir; convention:
 *   {
 *     type: 'blood-feed-refresh' | 'geofence-sync' | 'live-activity-update'
 *           | 'feed-refresh' | 'manual' | string,
 *     [key: string]: unknown
 *   }
 *
 * Web tarafı `type`'a göre ilgili refetch / cache invalidation tetikler.
 * Plugin web ortamında veya iOS olmayan platformlarda no-op.
 *
 * Backend tarafı: silent push gönderimi `src/lib/push-notifications.ts`
 * üzerinden APNs payload'ında `aps: { 'content-available': 1 }` set ederek
 * yapılır (alert YOK, badge YOK, sound YOK — yoksa silent değildir).
 */

import { Capacitor, registerPlugin } from '@capacitor/core';

type Unsubscribe = () => void;

export type SilentPushType =
  | 'blood-feed-refresh'
  | 'geofence-sync'
  | 'live-activity-update'
  | 'feed-refresh'
  | 'manual'
  | string;

export interface SilentPushPayload {
  type: SilentPushType;
  [key: string]: unknown;
}

interface HangelSilentPushPlugin {
  isEnabled(): Promise<{ enabled: boolean; status: string }>;
  syncNow(opts?: { type?: string }): Promise<{ dispatched: boolean }>;
  addListener(
    eventName: 'silentPush',
    listener: (payload: SilentPushPayload) => void,
  ): Promise<{ remove: () => Promise<void> }>;
}

const HangelSilentPush = registerPlugin<HangelSilentPushPlugin>('HangelSilentPush');

export async function isSilentPushEnabled(): Promise<{ enabled: boolean; status: string }> {
  if (!Capacitor.isNativePlatform()) return { enabled: false, status: 'web' };
  try {
    return await HangelSilentPush.isEnabled();
  } catch {
    return { enabled: false, status: 'unsupported' };
  }
}

/**
 * Manual trigger — debug / test path. Production'da APNs gönderir.
 */
export async function triggerSilentPushSync(type: SilentPushType = 'manual'): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    const { dispatched } = await HangelSilentPush.syncNow({ type });
    return dispatched;
  } catch {
    return false;
  }
}

/**
 * Silent push event listener. Cleanup için dönen Unsubscribe çağrılmalı.
 *
 * Tipik kullanım (React component'inde):
 *   useEffect(() => {
 *     const off = onSilentPush((payload) => {
 *       if (payload.type === 'blood-feed-refresh') void refetchBloodFeed();
 *       else if (payload.type === 'live-activity-update') void refreshActivities();
 *     });
 *     return off;
 *   }, []);
 */
export function onSilentPush(handler: (payload: SilentPushPayload) => void): Unsubscribe {
  if (!Capacitor.isNativePlatform()) return () => {};

  let handle: { remove: () => Promise<void> } | null = null;
  void HangelSilentPush.addListener('silentPush', (payload) => {
    try {
      handler(payload);
    } catch (err) {
      if (typeof console !== 'undefined') {
        console.warn('[silent-push] handler threw', err);
      }
    }
  }).then((h) => {
    handle = h;
  });

  return () => {
    if (handle) void handle.remove();
  };
}
