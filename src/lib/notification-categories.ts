/**
 * notification-categories — bildirim `type` alanını bildirim merkezi
 * kategorilerine eşler. Hem ngo-admin hem super-admin bildirim merkezinde
 * "her başlıkta işlem sayısı" göstermek için ortak kullanılır. İstemci-güvenli
 * (Admin SDK yok).
 */

export type NotifCategoryKey =
  | 'registration'
  | 'events'
  | 'volunteer'
  | 'donations'
  | 'emergency'
  | 'messages'
  | 'other';

export interface NotifCategory {
  key: NotifCategoryKey;
  label: string;
}

/** Sekme/başlık sırası — soldan sağa. */
export const NOTIF_CATEGORIES: NotifCategory[] = [
  { key: 'registration', label: 'Kayıt & Onay' },
  { key: 'events', label: 'Etkinlikler' },
  { key: 'volunteer', label: 'Gönüllülük' },
  { key: 'donations', label: 'Bağışlar' },
  { key: 'emergency', label: 'Acil Durum' },
  { key: 'messages', label: 'Mesaj & Diğer' },
];

/** type → kategori. Bilinmeyen/eksik type 'messages' (diğer) altına düşer. */
export function categorizeNotif(type: string | undefined | null): NotifCategoryKey {
  const t = (type || '').toLowerCase();
  if (
    t.startsWith('org_registration') ||
    t.startsWith('application') ||
    t === 'welcome'
  ) {
    return 'registration';
  }
  if (t.startsWith('event')) return 'events';
  if (t.startsWith('volunteer') || t === 'opportunity') return 'volunteer';
  if (
    t.startsWith('donation') ||
    t === 'payment_received' ||
    t === 'certificate_ready' ||
    t === 'certificate_issued'
  ) {
    return 'donations';
  }
  if (t.startsWith('emergency') || t === 'blood_emergency' || t === 'disaster_alert') {
    return 'emergency';
  }
  return 'messages';
}
