// STK/kulüp etkinliklerinin DIŞA AÇIK (public) görünümü — embed/iframe için veri
// katmanı. Admin SDK ile okur (public read). Yalnız yayında olan etkinlikler döner
// (Beklemede/Reddedildi/Pasif gizli; tamamlanan etkinlik 24 saat sonra düşer —
// events/page.tsx public listesiyle tutarlı).

import { getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';

const PUBLIC_ORIGIN = process.env.NEXT_PUBLIC_APP_URL ?? 'https://hangel.org';

// Public listeden gizli statüler + tamamlanma penceresi (events/page.tsx ile aynı).
const HIDDEN_STATUSES = new Set(['Beklemede', 'Reddedildi', 'Pasif']);
const COMPLETED_VISIBLE_WINDOW_MS = 24 * 60 * 60 * 1000;

export interface PublicEventItem {
  id: string;
  title: string;
  organizer: string;
  city: string;
  district: string;
  locationType: string;
  date: string;
  description: string;
  url: string;
  logoUrl: string;
}

export interface PublicEventsResult {
  organizerId: string;
  organization: string;
  count: number;
  items: PublicEventItem[];
}

function asStr(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

// completedAt (Firestore Timestamp | ISO string | ms) → ms; yoksa null.
function toMs(v: unknown): number | null {
  if (!v) return null;
  if (typeof v === 'number') return v;
  if (typeof v === 'string') { const t = Date.parse(v); return Number.isNaN(t) ? null : t; }
  const ts = v as { toMillis?: () => number; seconds?: number };
  if (typeof ts.toMillis === 'function') return ts.toMillis();
  if (typeof ts.seconds === 'number') return ts.seconds * 1000;
  return null;
}

/**
 * Bir kuruluşun (organizerId = STK/kulüp doc id) yayındaki etkinliklerini getirir.
 * @param onlyId Tek etkinlik döndürmek için (embed?event=...)
 */
export async function fetchActiveEvents(organizerId: string, onlyId?: string): Promise<PublicEventsResult> {
  const db = getAdminFirestore();
  const snap = await db.collection(COLLECTIONS.events).where('organizerId', '==', organizerId).get();
  const now = Date.now();
  let organization = '';
  const items: PublicEventItem[] = [];
  for (const doc of snap.docs) {
    const d = doc.data() as Record<string, unknown>;
    const status = asStr(d.status);
    if (HIDDEN_STATUSES.has(status)) continue; // yalnız yayındakiler
    // Tamamlanan etkinlik 24 saat boyunca kalır, sonra düşer.
    if (d.completed === true) {
      const completedMs = toMs(d.completedAt) ?? toMs(d.endDate) ?? toMs(d.startDate);
      if (completedMs != null && now - completedMs >= COMPLETED_VISIBLE_WINDOW_MS) continue;
    }
    if (onlyId && doc.id !== onlyId) continue;
    const loc = (d.location as Record<string, unknown> | undefined) || {};
    if (!organization) organization = asStr(d.organizer);
    items.push({
      id: doc.id,
      title: asStr(d.name),
      organizer: asStr(d.organizer),
      city: asStr(loc.city),
      district: asStr(loc.district),
      locationType: asStr(loc.type),
      date: asStr(d.date) || asStr(d.startDate),
      description: asStr(d.description).slice(0, 500),
      url: `${PUBLIC_ORIGIN}/events/${doc.id}`,
      logoUrl: asStr(d.organizerLogoUrl),
    });
  }
  // Yaklaşan/yeni etkinlikler üstte (tarih azalan).
  items.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  return { organizerId, organization, count: items.length, items };
}

export function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c] as string));
}

export { PUBLIC_ORIGIN };
