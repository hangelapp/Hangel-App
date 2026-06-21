'use client';

/**
 * Web ↔ HangelHealth Capacitor plugin köprüsü (Apple HealthKit, salt-okuma).
 *
 * `readHealthData()` native iOS app'te HealthKit'ten kan grubu, cinsiyet,
 * doğum tarihi, boy ve kiloyu okur. Web ortamında veya plugin yoksa `null`
 * döner (no-op). Native'de izin reddedilir / veri yoksa `{ available: false }`.
 *
 * Dönen alanlar zaten app'in beklediği gösterim biçiminde gelir:
 *  - bloodType: "A Rh+" gibi (BLOOD_TYPES ile uyumlu)
 *  - gender:    "Erkek" | "Kadın"
 *  - birthDate: "YYYY-MM-DD"
 *  - height:    cm tam sayı (string)
 *  - weight:    kg tam sayı (string)
 *
 * Senkron akışı için bkz. src/lib/sync-health.ts.
 */

import { Capacitor, registerPlugin } from '@capacitor/core';

export interface HealthData {
  available: boolean;
  bloodType?: string;
  gender?: string;
  birthDate?: string;
  height?: string;
  weight?: string;
}

interface HangelHealthPlugin {
  read(): Promise<HealthData>;
}

const HangelHealth = registerPlugin<HangelHealthPlugin>('HangelHealth');

/**
 * Apple Health'ten kişisel sağlık alanlarını oku.
 * Web / non-native → null. Hata / desteklenmiyor → null veya { available: false }.
 */
export async function readHealthData(): Promise<HealthData | null> {
  if (!Capacitor.isNativePlatform()) return null;
  try {
    return await HangelHealth.read();
  } catch (e) {
    console.warn('[native-health] read failed', e);
    return null;
  }
}
