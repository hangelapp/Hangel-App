/**
 * Etkinlik-QR onboarding durum makinesi.
 *
 * Bir kullanıcı etkinlik QR'ından (/e/{id}/kayit) gelip kayıt olduğunda özel bir
 * akış işler:
 *   1. Başlangıç popup'ları (hoş geldin turu + çerez banner'ı) BASTIRILIR.
 *   2. Kayıttan sonra önce ETKİNLİK DETAY sayfası açılır.
 *   3. Kullanıcı etkinlik detaydan ÇIKINCA bağışçısı olacağı STK seçimi istenir.
 *   4. Etkinlik "gelir-modeli-konferansi" ise önce "STK yöneticisi misiniz?" sorulur;
 *      evet → kütük no → STK kaydı oluşturulur → o STK seçili biçimde bağışçı seçimine
 *      gidilir → 2. STK seçilip market'e geçilir.
 *
 * GÜVENLİK: Tüm bu davranış YALNIZCA `getQrOnboard()` non-null iken tetiklenir.
 * Marker yoksa mevcut akış birebir korunur (normal kullanıcılar etkilenmez).
 *
 * Marker'lar localStorage'da tutulur çünkü auth redirect'ini (sayfa yenilenmesi)
 * aşmaları gerekir. sessionStorage sekme kapanınca kaybolurdu.
 */

const KEY = 'hangel:qrOnboard';

export type QrOnboardStage = 'event' | 'ngo-question' | 'ngo-select';

export interface QrOnboardState {
  /** Kaydı tetikleyen etkinlik id'si. */
  eventId: string;
  /** Etkinlik "gelir-modeli-konferansi" mi? (STK yönetici sorusu için). */
  gelirModeli: boolean;
  /** Akışın hangi aşamasında olduğumuz. */
  stage: QrOnboardStage;
}

export function getQrOnboard(): QrOnboardState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as QrOnboardState;
    return s && typeof s.eventId === 'string' && s.eventId ? s : null;
  } catch {
    return null;
  }
}

export function setQrOnboard(state: QrOnboardState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* yut */
  }
}

export function updateQrOnboardStage(stage: QrOnboardStage): void {
  const cur = getQrOnboard();
  if (cur) setQrOnboard({ ...cur, stage });
}

export function clearQrOnboard(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* yut */
  }
}

/**
 * Başlangıç popup'larını bastır: hoş geldin turu + çerez banner'ı.
 * (Tur anahtarı: hangel_onboarding_v1_done; çerez: hangel.cookie-consent.)
 */
export function suppressStartupPopups(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('hangel_onboarding_v1_done', '1');
    if (!localStorage.getItem('hangel.cookie-consent')) {
      localStorage.setItem('hangel.cookie-consent', JSON.stringify({ consent: 'qr-flow', at: Date.now() }));
    }
  } catch {
    /* yut */
  }
}

/** ngo-selection kaydından SONRA gidilecek yol (QR akışında market'e). */
export const NGO_SELECTION_NEXT_KEY = 'hangel:ngoSelectionNext';
export function setNgoSelectionNext(path: string): void {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(NGO_SELECTION_NEXT_KEY, path); } catch { /* yut */ }
}
export function takeNgoSelectionNext(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const v = localStorage.getItem(NGO_SELECTION_NEXT_KEY);
    if (v) localStorage.removeItem(NGO_SELECTION_NEXT_KEY);
    return v;
  } catch {
    return null;
  }
}
