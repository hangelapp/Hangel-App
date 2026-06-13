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
  artist: 'SANATÇI',
  moderator: 'MODERATÖR',
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
    case 'artist': return 'sanatçı olarak yer almıştır';
    case 'moderator': return 'moderatör olarak görev almıştır';
    default: return 'katılımcı olarak yer almıştır';
  }
}
