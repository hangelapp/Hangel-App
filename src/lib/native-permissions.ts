'use client';

/**
 * App'ten girişte tüm native izinleri sırayla iste.
 *
 * iOS sistem prompt'ları tek tek gösterir; bu yüzden istekler arasına küçük
 * gecikme konur. Zaten 'granted' ise no-op. Reddedilmişse iOS tekrar prompt
 * GÖSTERMEZ — o durumda PermissionPrompter dialog'u kullanıcıyı Ayarlar'a yönlendirir.
 *
 * Push izni ayrıca PushNotificationsProvider → registerNativePushToken ile de
 * istenir (token kaydı için); burada checkPermissions ile tekrar prompt önlenir.
 * Web'de tamamen no-op.
 */
import { Capacitor } from '@capacitor/core';
import { FirebaseMessaging } from '@capacitor-firebase/messaging';
import { Geolocation } from '@capacitor/geolocation';
import { requestContactsPermission } from '@/lib/native-contacts-permission';

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export async function requestAllNativePermissions(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  // 1) Bildirimler — push + Live Activity (canlı etkinlik) güncelleme bildirimleri
  try {
    const p = await FirebaseMessaging.checkPermissions();
    if (p.receive === 'prompt' || p.receive === 'prompt-with-rationale') {
      await FirebaseMessaging.requestPermissions();
    }
  } catch { /* sessiz — izin akışı login'i bozmaz */ }
  await delay(500);

  // 2) Konum — yakın kan ilanı / etkinlik / gönüllülük eşleştirmesi
  try {
    const p = await Geolocation.checkPermissions();
    if (p.location === 'prompt' || p.location === 'prompt-with-rationale') {
      await Geolocation.requestPermissions({ permissions: ['location'] });
    }
  } catch { /* sessiz */ }
  await delay(500);

  // 3) Rehber — davet / "yakınındaki hangel kullanıcıları" eşleştirme
  try { await requestContactsPermission(); } catch { /* sessiz */ }
}
