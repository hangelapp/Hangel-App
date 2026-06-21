/**
 * GET /api/ngo-admin/impact-certificate?orgId=&kind=ngo|brand|club
 *
 * Kurumun KENDİ faaliyetinden OTOMATİK ürettiği "Etki Sertifikası" metriklerini
 * döner. Süper-admin elle vermez; her kurum kendi verisinden iki dönem kazanır:
 *   - cumulative: tüm zamanların birikimli etkisi ("Toplam Etki")
 *   - months: ay bazında (YYYY-MM) ayrı ayrı, yeniden eskiye sıralı
 *
 * Metrikler (her dönem için):
 *   volunteerHours      → volunteerCompletions.adjustedHours ?? hoursLogged toplamı
 *   eventHours          → tamamlanmış events (endDate-startDate) toplamı
 *   volunteerCount      → o dönemde tamamlama yapan distinct userId sayısı
 *   participantCount    → tamamlanmış events.certPersonSeq toplamı
 *   donationTRY         → onaylı bağışların (Yatırıldı/Tamamlandı) bu kuruma düşen net payı
 *   impactValueTRY      → volunteerCompletions.impactValueTRY toplamı (sosyal etki)
 *   totalSocialValueTRY → impactValueTRY + donationTRY
 *
 * Best-effort: bir koleksiyon yoksa/boşsa ilgili metrik 0 kalır, hata fırlatmaz.
 *
 * Yetki: super-admin VEYA users/{uid}.managed{Ngo|Brand|Club}Id === orgId. Aksi 403.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function errJson(errorCode: string, message: string, status: number) {
  return NextResponse.json({ errorCode, message }, { status });
}

const MANAGED_FIELD: Record<'ngo' | 'brand' | 'club', string> = {
  ngo: 'managedNgoId',
  brand: 'managedBrandId',
  club: 'managedClubId',
};

const ENTITY_COLLECTION: Record<'ngo' | 'brand' | 'club', string> = {
  ngo: COLLECTIONS.ngos,
  brand: COLLECTIONS.brands,
  club: COLLECTIONS.clubs,
};

const PAID_STATUSES = new Set(['Yatırıldı', 'Tamamlandı']);

const TR_MONTHS = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

interface Metrics {
  volunteerHours: number;
  eventHours: number;
  volunteerCount: number;
  participantCount: number;
  donationTRY: number;
  impactValueTRY: number;
  totalSocialValueTRY: number;
}

interface MonthBucket {
  ym: string;
  volunteerHours: number;
  eventHours: number;
  donationTRY: number;
  impactValueTRY: number;
  participantCount: number;
  volunteers: Set<string>;
}

function emptyMetrics(): Metrics {
  return {
    volunteerHours: 0,
    eventHours: 0,
    volunteerCount: 0,
    participantCount: 0,
    donationTRY: 0,
    impactValueTRY: 0,
    totalSocialValueTRY: 0,
  };
}

function getBucket(map: Map<string, MonthBucket>, ym: string): MonthBucket {
  let b = map.get(ym);
  if (!b) {
    b = { ym, volunteerHours: 0, eventHours: 0, donationTRY: 0, impactValueTRY: 0, participantCount: 0, volunteers: new Set<string>() };
    map.set(ym, b);
  }
  return b;
}

function toNum(v: unknown): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = Number(v.replace(',', '.'));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

/** Firestore Timestamp | Date | ISO string → "YYYY-MM" (UTC değil yerel ay; bağış zaten YYYY-MM tutar). */
function ymFromTimestamp(v: unknown): string | null {
  if (v && typeof v === 'object' && typeof (v as { toDate?: unknown }).toDate === 'function') {
    const d = (v as { toDate: () => Date }).toDate();
    if (!Number.isNaN(d.getTime())) return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }
  if (typeof v === 'string' && /^\d{4}-\d{2}/.test(v)) return v.slice(0, 7);
  return null;
}

/** "YYYY-MM-DD HH:mm" iki tarih arasındaki saat farkı (negatif/anlamsız → 0). */
function hoursBetween(start?: string, end?: string): number {
  if (!start || !end) return 0;
  const norm = (s: string) => s.replace(' ', 'T');
  const a = new Date(norm(start)).getTime();
  const b = new Date(norm(end)).getTime();
  if (Number.isNaN(a) || Number.isNaN(b) || b <= a) return 0;
  const h = (b - a) / 3_600_000;
  return h > 0 && h < 24 * 14 ? h : 0; // 2 haftadan uzun = veri hatası, atla
}

function ymFromDateStr(s?: string): string | null {
  if (typeof s === 'string' && /^\d{4}-\d{2}/.test(s)) return s.slice(0, 7);
  return null;
}

function monthLabel(ym: string): string {
  const [y, m] = ym.split('-');
  const mi = Number(m) - 1;
  if (mi >= 0 && mi < 12) return `${TR_MONTHS[mi]} ${y}`;
  return ym;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const authHeader = req.headers.get('authorization') ?? '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length).trim() : '';
  if (!idToken) return errJson('unauthenticated', 'Token gerekli', 401);

  let uid: string;
  let role: unknown;
  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken);
    uid = decoded.uid;
    role = (decoded as { role?: unknown }).role;
  } catch {
    return errJson('unauthenticated', 'Geçersiz token', 401);
  }

  const orgId = req.nextUrl.searchParams.get('orgId');
  const kindParam = req.nextUrl.searchParams.get('kind');
  if (!orgId) return errJson('invalid_input', 'orgId gerekli', 400);
  if (kindParam !== 'ngo' && kindParam !== 'brand' && kindParam !== 'club') {
    return errJson('invalid_input', 'kind ngo|brand|club olmalı', 400);
  }
  const kind = kindParam;

  const db = getAdminFirestore();

  // Yetki — super-admin ya da bu kurumu yöneten kullanıcı.
  let authorized = role === 'super-admin';
  if (!authorized) {
    const snap = await db.collection(COLLECTIONS.users).doc(uid).get();
    const u = snap.data() as Record<string, unknown> | undefined;
    if (u?.role === 'super-admin' || u?.[MANAGED_FIELD[kind]] === orgId) authorized = true;
  }
  if (!authorized) return errJson('forbidden', 'Bu kurumun etki sertifikasını görme yetkin yok.', 403);

  // Kurum adı (+ logo) — best-effort.
  let orgName = '';
  let logoUrl: string | undefined;
  try {
    const orgSnap = await db.collection(ENTITY_COLLECTION[kind]).doc(orgId).get();
    const d = orgSnap.data() as Record<string, unknown> | undefined;
    if (d) {
      if (typeof d.name === 'string') orgName = d.name;
      if (typeof d.logoUrl === 'string') logoUrl = d.logoUrl;
      else if (typeof d.logo === 'string') logoUrl = d.logo;
    }
  } catch {
    /* best-effort */
  }

  const cumulative = emptyMetrics();
  const months = new Map<string, MonthBucket>();
  const cumulativeVolunteers = new Set<string>();

  // --- volunteerCompletions: gönüllülük saati + sosyal etki değeri + gönüllü sayısı ---
  try {
    const snap = await db.collection(COLLECTIONS.volunteerCompletions).where('ngoId', '==', orgId).get();
    for (const doc of snap.docs) {
      const d = doc.data() as Record<string, unknown>;
      const hours = d.adjustedHours !== undefined ? toNum(d.adjustedHours) : toNum(d.hoursLogged);
      const impact = toNum(d.impactValueTRY);
      const userId = typeof d.userId === 'string' ? d.userId : '';
      const ym = ymFromTimestamp(d.completedAt) ?? ymFromTimestamp(d.createdAt);

      cumulative.volunteerHours += hours;
      cumulative.impactValueTRY += impact;
      if (userId) cumulativeVolunteers.add(userId);

      if (ym) {
        const b = getBucket(months, ym);
        b.volunteerHours += hours;
        b.impactValueTRY += impact;
        if (userId) b.volunteers.add(userId);
      }
    }
  } catch {
    /* koleksiyon yoksa metrik 0 */
  }
  cumulative.volunteerCount = cumulativeVolunteers.size;

  // --- events: etkinlik saati + katılımcı sayısı (tamamlanmış etkinlikler) ---
  try {
    const snap = await db.collection(COLLECTIONS.events).where('organizerId', '==', orgId).get();
    for (const doc of snap.docs) {
      const d = doc.data() as Record<string, unknown>;
      if (d.completed !== true) continue;
      const hrs = hoursBetween(typeof d.startDate === 'string' ? d.startDate : undefined, typeof d.endDate === 'string' ? d.endDate : undefined);
      const participants = toNum(d.certPersonSeq);
      const ym = ymFromTimestamp(d.completedAt) ?? ymFromDateStr(typeof d.startDate === 'string' ? d.startDate : undefined);

      cumulative.eventHours += hrs;
      cumulative.participantCount += participants;

      if (ym) {
        const b = getBucket(months, ym);
        b.eventHours += hrs;
        b.participantCount += participants;
      }
    }
  } catch {
    /* best-effort */
  }

  // --- donations: onaylı bağışların bu kuruma düşen net payı ---
  try {
    const snap = await db.collection(COLLECTIONS.donations).where('ngoIds', 'array-contains', orgId).get();
    for (const doc of snap.docs) {
      const d = doc.data() as Record<string, unknown>;
      const status = typeof d.status === 'string' ? d.status : '';
      if (!PAID_STATUSES.has(status)) continue;

      // Bu kurumun net payı: ngoSplit[].amount eşleşmesi, yoksa donationAmount / bölüşen kurum sayısı.
      let share = 0;
      const split = Array.isArray(d.ngoSplit) ? (d.ngoSplit as Array<Record<string, unknown>>) : null;
      const entry = split?.find((s) => s.ngoId === orgId);
      if (entry && entry.amount !== undefined) {
        share = toNum(entry.amount);
      } else {
        const total = toNum(d.donationAmount);
        const divisor = Array.isArray(d.ngo) && d.ngo.length > 0 ? d.ngo.length : (Array.isArray(d.ngoIds) ? d.ngoIds.length : 1) || 1;
        share = total / divisor;
      }
      if (share <= 0) continue;

      const ym = ymFromDateStr(typeof d.period === 'string' ? d.period : undefined)
        ?? ymFromDateStr(typeof d.date === 'string' ? d.date : undefined)
        ?? ymFromTimestamp(d.createdAt);

      cumulative.donationTRY += share;
      if (ym) getBucket(months, ym).donationTRY += share;
    }
  } catch {
    /* best-effort */
  }

  cumulative.totalSocialValueTRY = cumulative.impactValueTRY + cumulative.donationTRY;

  // Aylık listesi — yeniden eskiye.
  const monthsOut = [...months.values()]
    .sort((a, b) => b.ym.localeCompare(a.ym))
    .map((b) => ({
      ym: b.ym,
      label: monthLabel(b.ym),
      volunteerHours: b.volunteerHours,
      eventHours: b.eventHours,
      volunteerCount: b.volunteers.size,
      participantCount: b.participantCount,
      donationTRY: b.donationTRY,
      impactValueTRY: b.impactValueTRY,
      totalSocialValueTRY: b.impactValueTRY + b.donationTRY,
    }));

  return NextResponse.json({ ok: true, orgName, cumulative, months: monthsOut, logoUrl });
}
