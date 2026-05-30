'use client';

/**
 * App Tracking Transparency (ATT) — HangelAttPlugin köprüsü.
 *
 * Firebase Analytics iOS'ta IDFA okuyor; Apple yeni IPA'larda ATT prompt'unu
 * zorunlu denetliyor. Hangel doğrudan reklam tracking yapmıyor olsa da, SDK
 * tarafından dokunulduğu için prompt göstermek güvenli yol.
 *
 * Çağrı zamanlaması:
 *  - Yeni kullanıcı kayıt akışı tamamlandıktan SONRA (login ekranındayken
 *    göstermek "engelleyici" UX — Apple uyarıyor).
 *  - Tek seferlik: status === 'notDetermined' ise prompt; sonra durum
 *    localStorage'a saklanır.
 */

import { Capacitor, registerPlugin } from '@capacitor/core';

type AttStatus = 'authorized' | 'denied' | 'restricted' | 'notDetermined' | 'notAvailable' | 'unknown';

interface HangelAttPlugin {
  getStatus(): Promise<{ status: AttStatus }>;
  requestPermission(): Promise<{ status: AttStatus }>;
}

const HangelAtt = registerPlugin<HangelAttPlugin>('HangelAtt');
const ATT_STATUS_KEY = 'hangel-att-status';

export async function getAttStatus(): Promise<AttStatus> {
  if (!Capacitor.isNativePlatform()) return 'notAvailable';
  try {
    const { status } = await HangelAtt.getStatus();
    return status;
  } catch {
    return 'unknown';
  }
}

export async function maybeRequestAttPermission(): Promise<AttStatus> {
  if (!Capacitor.isNativePlatform()) return 'notAvailable';
  if (typeof window === 'undefined') return 'notAvailable';

  const cached = window.localStorage.getItem(ATT_STATUS_KEY);
  if (cached && cached !== 'notDetermined' && cached !== 'unknown') return cached as AttStatus;

  const current = await getAttStatus();
  if (current !== 'notDetermined') {
    window.localStorage.setItem(ATT_STATUS_KEY, current);
    return current;
  }

  try {
    const { status } = await HangelAtt.requestPermission();
    window.localStorage.setItem(ATT_STATUS_KEY, status);
    return status;
  } catch {
    return 'unknown';
  }
}
