// STK gönüllülük ilanlarının DIŞA AÇIK (public) görünümü — embed/iframe, JSON API
// ve RSS tarafından paylaşılan tek veri katmanı. Admin SDK ile okur (public read).
// Yalnız yayında (Pasif/Tamamlandı olmayan) ilanlar döner.

import { getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';

const PUBLIC_ORIGIN = process.env.NEXT_PUBLIC_APP_URL ?? 'https://hangel.org.tr';

export interface PublicVolunteeringItem {
  id: string;
  title: string;
  organization: string;
  city: string;
  district: string;
  locationType: string;
  applicationEnd: string;
  eventStart: string;
  description: string;
  url: string;
  logoUrl: string;
}

export interface PublicVolunteeringResult {
  ngoId: string;
  organization: string;
  count: number;
  items: PublicVolunteeringItem[];
}

function asStr(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

/**
 * Bir STK'nın (ngoId) yayındaki gönüllülük ilanlarını getirir.
 * @param ngoId STK doc id
 * @param onlyId Tek bir ilanı döndürmek için (embed?listing=...)
 */
export async function fetchActiveVolunteering(ngoId: string, onlyId?: string): Promise<PublicVolunteeringResult> {
  const db = getAdminFirestore();
  const snap = await db.collection(COLLECTIONS.volunteering).where('ngoId', '==', ngoId).get();
  let organization = '';
  const items: PublicVolunteeringItem[] = [];
  for (const doc of snap.docs) {
    const d = doc.data() as Record<string, unknown>;
    const status = asStr(d.status);
    if (status === 'Pasif' || status === 'Tamamlandı') continue; // yalnız yayındakiler
    if (onlyId && doc.id !== onlyId) continue;
    const loc = (d.location as Record<string, unknown> | undefined) || {};
    const dates = (d.dates as Record<string, unknown> | undefined) || {};
    if (!organization) organization = asStr(d.organization);
    items.push({
      id: doc.id,
      title: asStr(d.title),
      organization: asStr(d.organization),
      city: asStr(loc.city),
      district: asStr(loc.district),
      locationType: asStr(loc.type),
      applicationEnd: asStr(dates.applicationEnd),
      eventStart: asStr(dates.eventStart),
      description: asStr(d.description).slice(0, 500),
      url: `${PUBLIC_ORIGIN}/volunteering/${doc.id}`,
      logoUrl: asStr(d.organizerLogoUrl),
    });
  }
  // En yeni başvuru bitişi önce (yaklaşan ilanlar üstte)
  items.sort((a, b) => (b.applicationEnd || '').localeCompare(a.applicationEnd || ''));
  return { ngoId, organization, count: items.length, items };
}

export function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c] as string));
}

export { PUBLIC_ORIGIN };
