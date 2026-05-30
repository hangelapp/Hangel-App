/**
 * Sosyal Etki Pasaportu agregasyon endpoint'i — Faz 3.
 *
 * Mevcut alt koleksiyonlardan kullanıcının impact istatistiklerini hesaplar:
 *  - users/{uid}/pastVolunteering/*  → toplam gönüllülük saati + etkinlik sayısı
 *  - users/{uid}/badges/*            → kazanılan rozetler
 *  - users/{uid}/certificates/*      → sertifikalar
 *  - donations (uid filtresi)        → toplam bağış (TL)
 *  - eventRsvps (uid filtresi)       → katılım sayısı
 *
 * Sonucu `users/{uid}.passport` alanına önbellekler (24 saatlik TTL); pasaport
 * sayfası açıldığında 24h içinde yenilenmediyse yeniden hesaplar.
 *
 * Impact Score formülü (basit, balanced):
 *   score = floor(hours*5 + events*3 + donations/100 + badges*10 + certs*15)
 */

import { NextRequest, NextResponse } from 'next/server';

import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

const PASSPORT_TTL_HOURS = 24;

interface Certificate { id: string; title: string; issuedBy?: string; issuedAt?: string | null; }
interface Badge { id: string; name: string; awardedAt?: string | null; iconUrl?: string | null; }

interface PassportData {
  totalVolunteerHours: number;
  totalEvents: number;
  totalCampaigns: number;
  totalDonationsTry: number;
  badges: Badge[];
  certificates: Certificate[];
  impactScore: number;
  lastUpdatedAt: string;          // ISO
}

async function computePassport(uid: string): Promise<PassportData> {
  const db = getAdminFirestore();
  const userRef = db.collection(COLLECTIONS.users).doc(uid);

  const [pastVol, badges, certs, donationsSnap, rsvpsAgg] = await Promise.all([
    userRef.collection(COLLECTIONS.pastVolunteering).get().catch(() => null),
    userRef.collection(COLLECTIONS.badges).get().catch(() => null),
    userRef.collection(COLLECTIONS.certificates).get().catch(() => null),
    db.collection(COLLECTIONS.donations).where('userId', '==', uid).get().catch(() => null),
    db.collectionGroup(COLLECTIONS.eventRsvps).where('userId', '==', uid).where('status', '==', 'going').get().catch(() => null),
  ]);

  let totalVolunteerHours = 0;
  let totalEvents = pastVol?.size ?? 0;
  pastVol?.docs.forEach(d => {
    const hours = Number(d.data().hours ?? 0);
    if (!Number.isNaN(hours)) totalVolunteerHours += hours;
  });

  let totalDonationsTry = 0;
  let totalCampaigns = 0;
  const campaignIds = new Set<string>();
  donationsSnap?.docs.forEach(d => {
    const data = d.data();
    const amount = Number(data.amount ?? data.amountTry ?? 0);
    if (!Number.isNaN(amount)) totalDonationsTry += amount;
    if (typeof data.campaignId === 'string' && data.campaignId) campaignIds.add(data.campaignId);
  });
  totalCampaigns = campaignIds.size;

  if (rsvpsAgg) {
    totalEvents = Math.max(totalEvents, rsvpsAgg.size);
  }

  const badgesArr: Badge[] = (badges?.docs ?? []).map(d => {
    const data = d.data();
    const awardedAt = (data.awardedAt as Timestamp | undefined)?.toDate?.().toISOString() ?? null;
    return {
      id: d.id,
      name: typeof data.name === 'string' ? data.name : d.id,
      awardedAt,
      iconUrl: typeof data.iconUrl === 'string' ? data.iconUrl : null,
    };
  });

  const certsArr: Certificate[] = (certs?.docs ?? []).map(d => {
    const data = d.data();
    const issuedAt = (data.issuedAt as Timestamp | undefined)?.toDate?.().toISOString() ?? null;
    return {
      id: d.id,
      title: typeof data.title === 'string' ? data.title : (typeof data.name === 'string' ? data.name : d.id),
      issuedBy: typeof data.issuedBy === 'string' ? data.issuedBy : undefined,
      issuedAt,
    };
  });

  const impactScore = Math.floor(
    totalVolunteerHours * 5
    + totalEvents * 3
    + totalDonationsTry / 100
    + badgesArr.length * 10
    + certsArr.length * 15,
  );

  return {
    totalVolunteerHours,
    totalEvents,
    totalCampaigns,
    totalDonationsTry,
    badges: badgesArr,
    certificates: certsArr,
    impactScore,
    lastUpdatedAt: new Date().toISOString(),
  };
}

export async function GET(req: NextRequest): Promise<NextResponse> {
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
  const userSnap = await userRef.get();
  const cached = userSnap.data()?.passport as PassportData | undefined;

  const force = new URL(req.url).searchParams.get('force') === '1';
  if (cached?.lastUpdatedAt && !force) {
    const lastUpdatedMs = new Date(cached.lastUpdatedAt).getTime();
    if (Date.now() - lastUpdatedMs < PASSPORT_TTL_HOURS * 60 * 60 * 1000) {
      return NextResponse.json({ ok: true, passport: cached, cached: true });
    }
  }

  try {
    const fresh = await computePassport(uid);
    await userRef.set({ passport: fresh, passportUpdatedAt: FieldValue.serverTimestamp() }, { merge: true });
    return NextResponse.json({ ok: true, passport: fresh, cached: false });
  } catch (e) {
    return NextResponse.json({
      errorCode: 'COMPUTE_FAILED',
      message: e instanceof Error ? e.message : 'Hesaplanamadı.',
    }, { status: 500 });
  }
}
