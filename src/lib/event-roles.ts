/**
 * Etkinlik rolleri — TEK KAYNAK.
 *
 * Bir kullanıcının bir etkinlikteki rolü `event.contributors` listesinden (userId
 * eşleşmesi) belirlenir. Eşleşme yoksa varsayılan "katılımcı".
 *
 * Rol; yaka kartında, Live Activity statusLabel'ında ve sertifikada AYNI etiketle
 * gösterilir. Saf TS (Firebase importu yok) — hem client hem API rotaları import edebilir.
 */
import type { EventContributor, EventContributorRole } from './types';

export type EventUserRole = EventContributorRole | 'participant';

/** Kullanıcının etkinlikteki rolü (contributors[].userId eşleşmesi). */
export function getUserEventRole(
  contributors: EventContributor[] | undefined | null,
  uid: string | undefined | null,
): EventUserRole {
  if (!uid || !Array.isArray(contributors)) return 'participant';
  const match = contributors.find((c) => c?.userId && c.userId === uid);
  return match?.role ?? 'participant';
}

/** Kullanıcının contributor kaydı (varsa) — ünvan/isim için. */
export function getUserContributor(
  contributors: EventContributor[] | undefined | null,
  uid: string | undefined | null,
): EventContributor | null {
  if (!uid || !Array.isArray(contributors)) return null;
  return contributors.find((c) => c?.userId && c.userId === uid) ?? null;
}

const ROLE_LABELS: Record<EventUserRole, string> = {
  speaker: 'KONUŞMACI',
  moderator: 'MODERATÖR',
  panelist: 'PANELİST',
  instructor: 'EĞİTMEN',
  host: 'SUNUCU',
  artist: 'SANATÇI',
  musician: 'MÜZİSYEN',
  dj: 'DJ',
  performer: 'PERFORMANS SANATÇISI',
  writer: 'YAZAR',
  academic: 'AKADEMİSYEN',
  jury: 'JÜRİ ÜYESİ',
  guest: 'ÖZEL KONUK',
  participant: 'KATILIMCI',
};

/** Yaka kartı / Live Activity / sertifika için BÜYÜK harf Türkçe rol etiketi. */
export function roleLabelTr(role: EventUserRole): string {
  return ROLE_LABELS[role] ?? 'KATILIMCI';
}

/** Sertifika cümlesi için rol-özel ifade. */
export function roleCertificatePhraseTr(role: EventUserRole): string {
  switch (role) {
    case 'speaker': return 'konuşmacı olarak katkıda bulunmuştur';
    case 'moderator': return 'moderatör olarak görev almıştır';
    case 'panelist': return 'panelist olarak katkıda bulunmuştur';
    case 'instructor': return 'eğitmen olarak görev almıştır';
    case 'host': return 'sunucu olarak görev almıştır';
    case 'artist': return 'sanatçı olarak yer almıştır';
    case 'musician': return 'müzisyen olarak yer almıştır';
    case 'dj': return 'DJ olarak yer almıştır';
    case 'performer': return 'performans sanatçısı olarak yer almıştır';
    case 'writer': return 'yazar olarak yer almıştır';
    case 'academic': return 'akademisyen olarak katkıda bulunmuştur';
    case 'jury': return 'jüri üyesi olarak görev almıştır';
    case 'guest': return 'özel konuk olarak yer almıştır';
    default: return 'katılımcı olarak yer almıştır';
  }
}
