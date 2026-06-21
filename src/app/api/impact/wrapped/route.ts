/**
 * Etki Wrapped — kişisel etki özeti agregasyonu (Spotify Wrapped tarzı).
 *
 * Giriş yapmış kullanıcının BU AY veya BU YIL için etki istatistiklerini
 * hesaplar. /etki-hikayem sayfası bu veriyi alıp animasyonlu kart serisinde
 * gösterir ve son kartı paylaşılabilir görsel (html2canvas) olarak üretir.
 *
 * GET /api/impact/wrapped?period=month   → bu takvim ayı
 * GET /api/impact/wrapped?period=year    → bu takvim yılı
 *
 * Auth: Authorization: Bearer <idToken>
 *
 * Not: Mevcut /api/users/me/replay/[year] geçmiş yılları kapsar; bu route
 * "şu anki" dönem (ay/yıl) odaklıdır ve dönem seçici ile çalışır. Çakışma yok.
 */

import { NextRequest, NextResponse } from 'next/server';

import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { Timestamp } from 'firebase-admin/firestore';

type Period = 'month' | 'year';

interface WrappedData {
  period: Period;
  /** İnsan-okur dönem etiketi, ör. "Haziran 2026" veya "2026". */
  periodLabel: string;
  rangeStart: string;          // ISO
  rangeEnd: string;            // ISO (exclusive)
  totalVolunteerHours: number;
  donationCount: number;       // bağış/destek adedi (expense kayıtları)
  totalDonationTry: number;
  eventCount: number;          // katıldığı/tamamladığı etkinlik+gönüllülük sayısı
  impactScore: number;         // kullanıcı toplam etki puanı (anlık)
  totalImpactValueTry: number; // bu dönemde üretilen sosyal etki ₺ değeri
  estimatedLivesTouched: number;
  topArea: string | null;      // en çok katkı verdiği alan (etiket)
  badgesEarned: number;
  hasAnyData: boolean;
}

// Hangel ortalama tahmin — 1 gönüllülük saati ≈ kaç cana dokunur.
const LIVES_PER_HOUR = 1.5;
// Her onaylı bağış/destek ≈ kaç cana dokunur (ortalama tahmin).
const LIVES_PER_DONATION = 1;

const AY_ADLARI = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

function rangeFor(period: Period, now: Date): { start: Date; end: Date; label: string } {
  const y = now.getFullYear();
  if (period === 'month') {
    const m = now.getMonth();
    return {
      start: new Date(y, m, 1),
      end: new Date(y, m + 1, 1),
      label: `${AY_ADLARI[m]} ${y}`,
    };
  }
  return {
    start: new Date(y, 0, 1),
    end: new Date(y + 1, 0, 1),
    label: `${y}`,
  };
}

/** Firestore Timestamp veya `{seconds}` veya `'yyyy-MM-dd'` string'i Date'e çevir. */
function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Timestamp) return value.toDate();
  if (typeof value === 'object' && value !== null && 'seconds' in (value as Record<string, unknown>)) {
    const s = Number((value as { seconds?: unknown }).seconds);
    if (!Number.isNaN(s)) return new Date(s * 1000);
  }
  if (typeof value === 'string') {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return null;
}

function inRange(d: Date | null, start: Date, end: Date): boolean {
  if (!d) return false;
  return d.getTime() >= start.getTime() && d.getTime() < end.getTime();
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const periodParam = req.nextUrl.searchParams.get('period');
  const period: Period = periodParam === 'year' ? 'year' : 'month';

  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ errorCode: 'NO_AUTH', message: 'Oturum bulunamadı.' }, { status: 401 });
  }
  let uid: string;
  try {
    const decoded = await getAdminAuth().verifyIdToken(authHeader.slice('Bearer '.length).trim());
    uid = decoded.uid;
  } catch {
    return NextResponse.json({ errorCode: 'INVALID_TOKEN', message: 'Oturum doğrulanamadı.' }, { status: 401 });
  }

  try {
    const db = getAdminFirestore();
    const { start, end, label } = rangeFor(period, new Date());

    const userRef = db.collection(COLLECTIONS.users).doc(uid);

    // Bağışlar (expense) ve gönüllülük tamamlamaları kullanıcı bazlı; tarih
    // alanları eski kayıtlarda farklı olabildiği için dönem filtresini bellekte
    // (toDate ile) uyguluyoruz — index gerektirmeden ve eksik createdAt'e dayanıklı.
    const [userSnap, donationsSnap, completionsSnap, badgesSnap] = await Promise.all([
      userRef.get().catch(() => null),
      db.collection(COLLECTIONS.donations).where('userId', '==', uid).get().catch(() => null),
      db.collection(COLLECTIONS.volunteerCompletions).where('userId', '==', uid).get().catch(() => null),
      userRef.collection(COLLECTIONS.badges).get().catch(() => null),
    ]);

    const userData = (userSnap?.data() ?? {}) as {
      impactScore?: number;
      stats?: { totalImpactValue?: number; mostActiveVolunteerArea?: string };
    };

    // --- Bağış / destek ---
    let donationCount = 0;
    let totalDonationTry = 0;
    donationsSnap?.docs.forEach((d) => {
      const data = d.data() as { type?: string; donationAmount?: string | number; createdAt?: unknown; date?: unknown };
      if (data.type !== 'expense') return;
      const when = toDate(data.createdAt) ?? toDate(data.date);
      if (!inRange(when, start, end)) return;
      donationCount += 1;
      totalDonationTry += Number(data.donationAmount) || 0;
    });

    // --- Gönüllülük / etkinlik tamamlamaları ---
    let totalVolunteerHours = 0;
    let totalImpactValueTry = 0;
    let eventCount = 0;
    const areaCounts = new Map<string, number>();
    completionsSnap?.docs.forEach((d) => {
      const data = d.data() as {
        ngoApproved?: boolean;
        hoursLogged?: number;
        adjustedHours?: number;
        impactValueTRY?: number;
        completedAt?: unknown;
        approvedAt?: unknown;
        professionLabel?: string;
        socialArea?: string;
        category?: string;
      };
      if (data.ngoApproved !== true) return;
      const when = toDate(data.completedAt) ?? toDate(data.approvedAt);
      if (!inRange(when, start, end)) return;
      eventCount += 1;
      const hours = Number(data.adjustedHours ?? data.hoursLogged) || 0;
      totalVolunteerHours += hours;
      totalImpactValueTry += Number(data.impactValueTRY) || 0;
      const area = data.socialArea || data.category || data.professionLabel;
      if (area && typeof area === 'string') {
        areaCounts.set(area, (areaCounts.get(area) ?? 0) + 1);
      }
    });

    // --- Rozetler (dönem içinde kazanılan) ---
    let badgesEarned = 0;
    badgesSnap?.docs.forEach((d) => {
      const when = toDate((d.data() as { awardedAt?: unknown }).awardedAt);
      if (inRange(when, start, end)) badgesEarned += 1;
    });

    const topAreaEntry = [...areaCounts.entries()].sort((a, b) => b[1] - a[1])[0];
    const topArea = topAreaEntry
      ? topAreaEntry[0]
      : (typeof userData.stats?.mostActiveVolunteerArea === 'string' && userData.stats.mostActiveVolunteerArea
          ? userData.stats.mostActiveVolunteerArea
          : null);

    const estimatedLivesTouched = Math.round(
      totalVolunteerHours * LIVES_PER_HOUR + donationCount * LIVES_PER_DONATION,
    );

    const hasAnyData = donationCount > 0 || eventCount > 0 || totalVolunteerHours > 0;

    const data: WrappedData = {
      period,
      periodLabel: label,
      rangeStart: start.toISOString(),
      rangeEnd: end.toISOString(),
      totalVolunteerHours: Math.round(totalVolunteerHours * 10) / 10,
      donationCount,
      totalDonationTry: Math.round(totalDonationTry),
      eventCount,
      impactScore: Number(userData.impactScore) || 0,
      totalImpactValueTry: Math.round(totalImpactValueTry),
      estimatedLivesTouched,
      topArea,
      badgesEarned,
      hasAnyData,
    };

    return NextResponse.json({ ok: true, wrapped: data });
  } catch {
    return NextResponse.json(
      { errorCode: 'WRAPPED_AGGREGATION_FAILED', message: 'Etki özeti hesaplanamadı.' },
      { status: 500 },
    );
  }
}
