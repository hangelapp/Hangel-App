/**
 * Kurum Etki Sertifikası — TEK KAYNAK (single source of truth).
 *
 * STK / marka / öğrenci kulübü kurumlarının KENDİ faaliyetlerinden OTOMATİK
 * ürettiği "Etki Sertifikası" metriklerini hesaplar ve `certificates`
 * koleksiyonuna doğrulanabilir (kod + /c) sertifika dokümanları upsert eder.
 *
 * Bu modülü HEM `api/ngo-admin/impact-certificate` (GET — kurumun kendi paneli)
 * HEM de `api/super-admin/backfill-cert-codes` (toplu geriye dönük üretim)
 * kullanır → mantık tek yerde, asla çatallanmaz.
 *
 * İki dönem üretilir:
 *   - cumulative ("Toplam Etki"):  certId  org-impact-{kind}-{orgId}-total
 *   - aylık (YYYY-MM):             certId  org-impact-{kind}-{orgId}-{ym}
 *
 * Kod: orgImpactCertCode(kind, orgName, ym?) — deterministik; aynı kurum + dönem
 * her zaman aynı kodu verir → idempotent, yeni kodlarla çakışmaz.
 *
 * Saf Admin-SDK (firebase-admin) — yalnız sunucu route'larından çağrılır.
 */
import { FieldValue } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { orgImpactCertCode, type CertKind } from '@/lib/certificate-code';

export type OrgKind = 'ngo' | 'brand' | 'club';

const PAID_STATUSES = new Set(['Yatırıldı', 'Tamamlandı']);

const TR_MONTHS = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

export const ORG_ENTITY_COLLECTION: Record<OrgKind, string> = {
  ngo: COLLECTIONS.ngos,
  brand: COLLECTIONS.brands,
  club: COLLECTIONS.clubs,
};

export interface OrgMetrics {
  volunteerHours: number;
  eventHours: number;
  volunteerCount: number;
  participantCount: number;
  donationTRY: number;
  impactValueTRY: number;
  totalSocialValueTRY: number;
}

export interface OrgMonthMetrics extends OrgMetrics {
  ym: string;
  label: string;
}

export interface OrgImpact {
  cumulative: OrgMetrics;
  months: OrgMonthMetrics[];
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

function emptyMetrics(): OrgMetrics {
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

/** Firestore Timestamp | Date | ISO string → "YYYY-MM" (yerel ay). */
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

/**
 * Kurumun tüm-zamanlar (cumulative) + ay-bazlı (months) etki metriklerini hesaplar.
 * Best-effort: bir koleksiyon yoksa/boşsa ilgili metrik 0 kalır, hata fırlatmaz.
 */
export async function computeOrgImpact(
  db: FirebaseFirestore.Firestore,
  orgId: string,
): Promise<OrgImpact> {
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

  const monthsOut: OrgMonthMetrics[] = [...months.values()]
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

  return { cumulative, months: monthsOut };
}

/** Kurum adı (+ logo) — best-effort entity lookup. */
export async function fetchOrgName(
  db: FirebaseFirestore.Firestore,
  kind: OrgKind,
  orgId: string,
): Promise<{ orgName: string; logoUrl?: string }> {
  let orgName = '';
  let logoUrl: string | undefined;
  try {
    const orgSnap = await db.collection(ORG_ENTITY_COLLECTION[kind]).doc(orgId).get();
    const d = orgSnap.data() as Record<string, unknown> | undefined;
    if (d) {
      if (typeof d.name === 'string') orgName = d.name;
      if (typeof d.logoUrl === 'string') logoUrl = d.logoUrl;
      else if (typeof d.logo === 'string') logoUrl = d.logo;
    }
  } catch {
    /* best-effort */
  }
  return { orgName, logoUrl };
}

/** Tek bir döneme ait sertifika upsert payload'u + idempotent doc id. */
export interface OrgImpactPeriod {
  certId: string;
  code: string;
  ym?: string;
  label: string;
  metrics: OrgMetrics;
}

/** computeOrgImpact sonucundan upsert edilecek dönem listesini (toplam + aylık) üretir. */
export function orgImpactPeriods(
  kind: OrgKind,
  orgId: string,
  orgName: string,
  impact: OrgImpact,
): OrgImpactPeriod[] {
  const ck = kind as CertKind;
  return [
    {
      certId: `org-impact-${kind}-${orgId}-total`,
      code: orgImpactCertCode(ck, orgName, undefined),
      label: 'Toplam Etki',
      metrics: impact.cumulative,
    },
    ...impact.months.map((mo) => ({
      certId: `org-impact-${kind}-${orgId}-${mo.ym}`,
      code: orgImpactCertCode(ck, orgName, mo.ym),
      ym: mo.ym,
      label: mo.label,
      metrics: mo,
    })),
  ];
}

/**
 * Kurumun etki sertifikalarını (toplam + her ay) `certificates`'a upsert eder
 * → kod biçim + Luhn + DB eşleşmesi → /c YEŞİL. Deterministik kod → QR ile birebir.
 * İdempotent: certId deterministik, merge:true. Yazılan sertifika sayısını döner.
 */
export async function upsertOrgImpactCerts(
  db: FirebaseFirestore.Firestore,
  kind: OrgKind,
  orgId: string,
  orgName: string,
  impact: OrgImpact,
): Promise<number> {
  const periods = orgImpactPeriods(kind, orgId, orgName, impact);
  const year = new Date().getFullYear();
  const batch = db.batch();
  for (const p of periods) {
    batch.set(
      db.collection(COLLECTIONS.certificates).doc(p.certId),
      {
        id: p.certId, recipientType: 'org', orgId, orgKind: kind, orgName,
        type: kind, title: `Kurum Etki Sertifikası — ${p.label}`, ngoName: orgName, role: 'organization',
        code: p.code, certCountry: '90', certYear: p.ym ? Number(p.ym.slice(0, 4)) || year : year,
        period: p.ym ?? 'total',
        metrics: {
          volunteerHours: p.metrics.volunteerHours, eventHours: p.metrics.eventHours,
          volunteerCount: p.metrics.volunteerCount, participantCount: p.metrics.participantCount,
          donationTRY: p.metrics.donationTRY, impactValueTRY: p.metrics.impactValueTRY, totalSocialValueTRY: p.metrics.totalSocialValueTRY,
        },
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  }
  await batch.commit();
  return periods.length;
}
