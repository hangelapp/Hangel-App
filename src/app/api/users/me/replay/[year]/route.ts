/**
 * Yıl sonu Impact Replay agregasyon — Faz 3.
 *
 * Belirli bir yıl için kullanıcının impact istatistiklerini hesaplar
 * (Spotify Wrapped tarzı). UI bu veriyi alıp animasyonlu kart serisinde
 * gösterir, son ekranı Instagram story image olarak generate eder.
 *
 * GET /api/users/me/replay/2026
 */

import { NextRequest, NextResponse } from 'next/server';

import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { Timestamp } from 'firebase-admin/firestore';

interface ReplayData {
  year: number;
  totalVolunteerHours: number;
  totalEvents: number;
  totalDonationsTry: number;
  totalMicroTasks: number;
  estimatedPeopleHelped: number;
  topCategory: string | null;
  topNgoName: string | null;
  topMonth: { month: number; eventCount: number } | null;
  badgesEarned: number;
  percentileVsAllVolunteers: number | null;  // 0..100 (örn. "Türkiye gönüllülerinin %80'inden daha aktif")
}

const PEOPLE_HELPED_PER_HOUR = 1.5;          // Hangel ortalama tahmin

function startOfYearTs(year: number): Timestamp { return Timestamp.fromDate(new Date(year, 0, 1)); }
function endOfYearTs(year: number): Timestamp { return Timestamp.fromDate(new Date(year + 1, 0, 1)); }

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ year: string }> },
): Promise<NextResponse> {
  const { year: yearStr } = await ctx.params;
  const year = parseInt(yearStr, 10);
  if (Number.isNaN(year) || year < 2020 || year > 2100) {
    return NextResponse.json({ errorCode: 'INVALID_YEAR' }, { status: 400 });
  }

  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ errorCode: 'NO_AUTH' }, { status: 401 });
  }
  let uid: string;
  try {
    const decoded = await getAdminAuth().verifyIdToken(authHeader.slice('Bearer '.length).trim());
    uid = decoded.uid;
  } catch {
    return NextResponse.json({ errorCode: 'INVALID_TOKEN' }, { status: 401 });
  }

  const db = getAdminFirestore();
  const userRef = db.collection(COLLECTIONS.users).doc(uid);
  const yearStart = startOfYearTs(year);
  const yearEnd = endOfYearTs(year);

  const [pastVol, donations, microTasks, badges] = await Promise.all([
    userRef.collection(COLLECTIONS.pastVolunteering)
      .where('completedAt', '>=', yearStart)
      .where('completedAt', '<', yearEnd)
      .get().catch(() => null),
    db.collection(COLLECTIONS.donations)
      .where('userId', '==', uid)
      .where('createdAt', '>=', yearStart)
      .where('createdAt', '<', yearEnd)
      .get().catch(() => null),
    db.collection(COLLECTIONS.microTaskCompletions)
      .where('uid', '==', uid)
      .where('completedAt', '>=', yearStart)
      .where('completedAt', '<', yearEnd)
      .get().catch(() => null),
    userRef.collection(COLLECTIONS.badges)
      .where('awardedAt', '>=', yearStart)
      .where('awardedAt', '<', yearEnd)
      .get().catch(() => null),
  ]);

  let totalVolunteerHours = 0;
  const monthCounts = new Array(12).fill(0);
  const ngoCounts = new Map<string, number>();
  const categoryCounts = new Map<string, number>();
  pastVol?.docs.forEach(d => {
    const data = d.data();
    const hours = Number(data.hours ?? 0);
    if (!Number.isNaN(hours)) totalVolunteerHours += hours;
    const completedAt = (data.completedAt as Timestamp | undefined)?.toDate?.();
    if (completedAt) monthCounts[completedAt.getMonth()]++;
    if (typeof data.ngoName === 'string') ngoCounts.set(data.ngoName, (ngoCounts.get(data.ngoName) ?? 0) + 1);
    if (typeof data.category === 'string') categoryCounts.set(data.category, (categoryCounts.get(data.category) ?? 0) + 1);
  });

  let totalDonationsTry = 0;
  donations?.docs.forEach(d => {
    const amount = Number(d.data().amount ?? d.data().amountTry ?? 0);
    if (!Number.isNaN(amount)) totalDonationsTry += amount;
  });

  const totalMicroTasks = microTasks?.size ?? 0;
  const totalEvents = pastVol?.size ?? 0;
  const badgesEarned = badges?.size ?? 0;

  const topNgo = [...ngoCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  const topCategory = [...categoryCounts.entries()].sort((a, b) => b[1] - a[1])[0];

  let topMonth: { month: number; eventCount: number } | null = null;
  let maxMonth = 0;
  for (let i = 0; i < 12; i++) {
    if (monthCounts[i] > maxMonth) {
      maxMonth = monthCounts[i];
      topMonth = { month: i, eventCount: monthCounts[i] };
    }
  }

  // Percentile basit hesap: kullanıcının saat sayısı tüm aktif gönüllülere göre nerede?
  // TODO: bu Cloud Function aggregator ile pre-compute edilebilir; şu an basit yaklaşım.
  let percentileVsAllVolunteers: number | null = null;
  try {
    const sampleSnap = await db.collection(COLLECTIONS.users)
      .where('passport.totalVolunteerHours', '>', 0)
      .orderBy('passport.totalVolunteerHours', 'desc')
      .limit(500)
      .get();
    const hoursList = sampleSnap.docs
      .map(d => Number((d.data().passport as { totalVolunteerHours?: number } | undefined)?.totalVolunteerHours ?? 0))
      .filter(n => !Number.isNaN(n) && n >= 0);
    if (hoursList.length > 5) {
      const below = hoursList.filter(h => h < totalVolunteerHours).length;
      percentileVsAllVolunteers = Math.round((below / hoursList.length) * 100);
    }
  } catch { /* sessiz */ }

  const data: ReplayData = {
    year,
    totalVolunteerHours,
    totalEvents,
    totalDonationsTry,
    totalMicroTasks,
    estimatedPeopleHelped: Math.floor(totalVolunteerHours * PEOPLE_HELPED_PER_HOUR + totalMicroTasks * 0.5),
    topCategory: topCategory ? topCategory[0] : null,
    topNgoName: topNgo ? topNgo[0] : null,
    topMonth,
    badgesEarned,
    percentileVsAllVolunteers,
  };

  return NextResponse.json({ ok: true, replay: data });
}
