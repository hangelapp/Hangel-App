'use client';

/**
 * Haptics — Capacitor Haptics köprüsü (iOS/Android dokunsal geri bildirim).
 *
 * Web/non-native'de tamamen no-op'tur (Capacitor.isNativePlatform() guard).
 * @capacitor/haptics npm paketi build'e EKLENMEZ — bunun yerine native tarafta
 * kayıtlı `Haptics` eklentisi runtime'da `registerPlugin` ile köprülenir
 * (native-checkin.ts ile aynı desen). Böylece paket kurulu olmasa da build kırılmaz;
 * eklenti yoksa çağrılar sessizce yutulur.
 *
 * Fonksiyonlar:
 *   hapticSuccess()   — başarı bildirimi (rozet/sertifika/tamamlama).
 *   hapticLight()     — hafif dokunuş (seçim/onay/küçük etkileşim).
 *   hapticCelebrate() — kutlama: çoklu darbe + başarı bildirimi (konfeti eşlikçisi).
 *
 * Tasarım: hiçbir fonksiyon throw etmez — web'de ve eklenti yokken sessiz kalır.
 */

import { Capacitor, registerPlugin } from '@capacitor/core';

type ImpactStyle = 'HEAVY' | 'MEDIUM' | 'LIGHT';
type NotificationType = 'SUCCESS' | 'WARNING' | 'ERROR';

interface HapticsPlugin {
  impact(options: { style: ImpactStyle }): Promise<void>;
  notification(options: { type: NotificationType }): Promise<void>;
  selectionStart(): Promise<void>;
  selectionChanged(): Promise<void>;
  selectionEnd(): Promise<void>;
  vibrate(options: { duration: number }): Promise<void>;
}

// Native'de kayıtlı `Haptics` eklentisine bağlanır; web'de proxy no-op kalır.
const Haptics = registerPlugin<HapticsPlugin>('Haptics');

function isNative(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

/** Başarı dokunsalı — rozet/sertifika/tamamlama anları. Web'de no-op. */
export async function hapticSuccess(): Promise<void> {
  if (!isNative()) return;
  try {
    await Haptics.notification({ type: 'SUCCESS' });
  } catch {
    /* eklenti yok / desteklenmiyor → sessiz */
  }
}

/** Hafif dokunuş — seçim/onay/küçük etkileşim. Web'de no-op. */
export async function hapticLight(): Promise<void> {
  if (!isNative()) return;
  try {
    await Haptics.impact({ style: 'LIGHT' });
  } catch {
    /* sessiz */
  }
}

/**
 * Kutlama dokunsalı — konfeti eşlikçisi. Ardışık darbe + başarı bildirimi ile
 * "umudu büyütüyoruz" anına Apple hissi katar. Web'de no-op.
 */
export async function hapticCelebrate(): Promise<void> {
  if (!isNative()) return;
  try {
    await Haptics.impact({ style: 'MEDIUM' });
    // Kısa bir ritim: orta darbeyi başarı bildirimiyle taçlandır.
    setTimeout(() => {
      void Haptics.impact({ style: 'LIGHT' }).catch(() => undefined);
    }, 90);
    setTimeout(() => {
      void Haptics.notification({ type: 'SUCCESS' }).catch(() => undefined);
    }, 180);
  } catch {
    /* sessiz */
  }
}
