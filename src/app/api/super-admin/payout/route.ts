/**
 * POST /api/super-admin/payout
 *
 * Manuel ay-sonu hesap-kesim / ödeme (payout). Gerçek banka API'si yok; ödeme
 * fiziksel/manuel yapılır. Bu route bir STK'nın bekleyen (status 'İşleme Alındı')
 * bağışlarını "Yatırıldı" işaretler, net toplamı hesaplar, `payouts` koleksiyonuna
 * makbuz/denetim kaydı oluşturur ve STK yöneticisine bildirim gönderir.
 *
 * Yalnızca super-admin çağırabilir (transparency/save deseni). donations doc'una
 * doğrudan client batch yazmak yerine bu route kullanılır — daha güvenli + payout
 * kaydı oluşur.
 *
 * Aksiyonlar:
 *   { action: 'payPeriod', ngoId, period }  → o STK'nın o DÖNEM'deki bekleyenleri öde.
 *   { action: 'payAll', ngoId }             → o STK'nın TÜM bekleyenlerini öde (dönem ayırmadan).
 * Ortak opsiyonel: reference?, notes?.
 *
 * Net hak ediş: donation.ngoSplit içinden bu ngoId'nin amount'ı; ngoSplit yoksa
 * brüt donationAmount dernek sayısına bölünür (eski kayıt fallback'i).
 */
import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { awardBadgesForUser } from '@/lib/award-badges';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PENDING_STATUS = 'İşleme Alındı';
const PAID_STATUS = 'Yatırıldı';

interface NgoSplitEntry {
  ngoId?: string;
  ngoName?: string;
  amount?: number;
}

interface DonationData {
  status?: string;
  period?: string;
  date?: string;
  donationAmount?: string | number;
  ngo?: string[];
  ngoIds?: string[];
  ngoSplit?: NgoSplitEntry[];
  userId?: string;
}

async function getSuperAdminUid(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get('authorization') || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!idToken) return null;
  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken) as { uid: string; role?: string; superAdminPermissions?: unknown };
    if (decoded.role === 'super-admin' || !!decoded.superAdminPermissions) return decoded.uid;
    const snap = await getAdminFirestore().collection(COLLECTIONS.users).doc(decoded.uid).get();
    const d = snap.data();
    if (d?.role === 'super-admin' || (Array.isArray(d?.superAdminPermissions) && d.superAdminPermissions.length > 0)) {
      return decoded.uid;
    }
    return null;
  } catch {
    return null;
  }
}

/** Bir bağıştan bu ngoId'nin net payını + STK adını çıkarır. */
function netShareForNgo(d: DonationData, ngoId: string): { amount: number; ngoName: string } {
  const split = Array.isArray(d.ngoSplit)
    ? d.ngoSplit.find((s) => s.ngoId === ngoId)
    : undefined;
  if (split && typeof split.amount === 'number') {
    return { amount: split.amount, ngoName: split.ngoName || ngoId };
  }
  // Eski kayıt fallback'i: brüt bağışı dernek sayısına böl.
  const gross = typeof d.donationAmount === 'string'
    ? parseFloat(d.donationAmount) || 0
    : Number(d.donationAmount) || 0;
  const divisor = d.ngo?.length || 1;
  return { amount: gross / divisor, ngoName: ngoId };
}

export async function POST(req: NextRequest) {
  const adminUid = await getSuperAdminUid(req);
  if (!adminUid) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Super-admin yetkisi gerekli.' }, { status: 403 });
  }

  let body: { action?: string; ngoId?: string; period?: string; reference?: string; notes?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ errorCode: 'BAD_JSON', message: 'Geçersiz JSON' }, { status: 400 });
  }

  const action = body.action;
  const ngoId = body.ngoId;
  const period = body.period;
  const reference = typeof body.reference === 'string' && body.reference.trim() ? body.reference.trim() : undefined;
  const notes = typeof body.notes === 'string' && body.notes.trim() ? body.notes.trim() : undefined;

  if (action !== 'payPeriod' && action !== 'payAll') {
    return NextResponse.json({ errorCode: 'BAD_ACTION', message: 'action payPeriod veya payAll olmalı.' }, { status: 400 });
  }
  if (!ngoId || typeof ngoId !== 'string') {
    return NextResponse.json({ errorCode: 'BAD_INPUT', message: 'ngoId gerekli.' }, { status: 400 });
  }
  if (action === 'payPeriod' && (!period || typeof period !== 'string')) {
    return NextResponse.json({ errorCode: 'BAD_INPUT', message: 'payPeriod için period (YYYY-MM) gerekli.' }, { status: 400 });
  }

  const db = getAdminFirestore();

  // Bu STK'nın dahil olduğu bekleyen bağışları bul.
  let donationDocs;
  try {
    const snap = await db
      .collection(COLLECTIONS.donations)
      .where('ngoIds', 'array-contains', ngoId)
      .where('status', '==', PENDING_STATUS)
      .get();
    donationDocs = snap.docs;
  } catch (err) {
    console.error('[payout] donations query failed', err);
    return NextResponse.json({ errorCode: 'QUERY_FAILED', message: 'Bağışlar okunamadı.' }, { status: 500 });
  }

  // Dönem filtresi (payPeriod) — period alanı yoksa date'in ilk 7 hanesine düş.
  const matched = donationDocs.filter((docSnap) => {
    if (action === 'payAll') return true;
    const d = docSnap.data() as DonationData;
    const docPeriod = d.period || (d.date ? d.date.slice(0, 7) : '');
    return docPeriod === period;
  });

  if (matched.length === 0) {
    return NextResponse.json(
      { errorCode: 'NOTHING_TO_PAY', message: 'Bu STK için ödenecek bekleyen bağış bulunamadı.' },
      { status: 409 },
    );
  }

  // Net toplam + STK adı.
  let netTotal = 0;
  let ngoName = ngoId;
  const donationIds: string[] = [];
  const donorUids = new Set<string>(); // ödenen bağışların sahipleri → otomatik rozet
  for (const docSnap of matched) {
    const d = docSnap.data() as DonationData;
    const { amount, ngoName: resolvedName } = netShareForNgo(d, ngoId);
    netTotal += amount;
    if (resolvedName && resolvedName !== ngoId) ngoName = resolvedName;
    donationIds.push(docSnap.id);
    if (d.userId) donorUids.add(d.userId);
  }
  // Yuvarlama gürültüsünü kırp.
  netTotal = Math.round(netTotal * 100) / 100;

  // STK yöneticisini çöz (bildirim için): ngos/{ngoId}.adminUserId → users(managedNgoId).
  let adminUserId: string | undefined;
  try {
    const ngoSnap = await db.collection(COLLECTIONS.ngos).doc(ngoId).get();
    const ngoData = ngoSnap.data() as { adminUserId?: string; name?: string } | undefined;
    adminUserId = ngoData?.adminUserId || undefined;
    if (ngoData?.name && ngoName === ngoId) ngoName = ngoData.name;
  } catch { /* yoksay */ }
  if (!adminUserId) {
    try {
      const uq = await db.collection(COLLECTIONS.users).where('managedNgoId', '==', ngoId).limit(1).get();
      if (!uq.empty) adminUserId = uq.docs[0].id;
    } catch { /* yoksay */ }
  }

  const periodLabel = action === 'payPeriod' ? (period as string) : 'Tümü';
  const payoutRef = db.collection(COLLECTIONS.payouts).doc();

  try {
    const batch = db.batch();
    for (const docSnap of matched) {
      batch.update(docSnap.ref, {
        status: PAID_STATUS,
        payoutDate: FieldValue.serverTimestamp(),
        payoutId: payoutRef.id,
      });
    }

    const payoutDoc: Record<string, unknown> = {
      ngoId,
      ngoName,
      period: periodLabel,
      amount: netTotal,
      donationIds,
      donationCount: donationIds.length,
      status: 'paid',
      paidAt: FieldValue.serverTimestamp(),
      paidBy: adminUid,
      createdAt: FieldValue.serverTimestamp(),
    };
    if (reference) payoutDoc.reference = reference;
    if (notes) payoutDoc.notes = notes;
    batch.set(payoutRef, payoutDoc);

    if (adminUserId) {
      const notifRef = db.collection(COLLECTIONS.notifications).doc();
      batch.set(notifRef, {
        userId: adminUserId,
        type: 'donation',
        title: 'Hak edişiniz ödendi',
        body: `${periodLabel} dönemi hak edişiniz ${netTotal.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })} ödendi.`,
        data: { period: periodLabel, payoutId: payoutRef.id, link: '/ngo-admin/donations' },
        read: false,
        createdAt: FieldValue.serverTimestamp(),
        createdBy: 'payout-system',
      });
    }

    await batch.commit();
  } catch (err) {
    console.error('[payout] batch commit failed', err);
    return NextResponse.json({ errorCode: 'WRITE_FAILED', message: 'Ödeme kaydedilemedi.' }, { status: 500 });
  }

  // Bağış "Yatırıldı" olduğu an, sahibi kullanıcıların rozetlerini yeniden
  // hesapla → bağıştan doğan yeni rozetler artık gönüllülük beklemeden düşer.
  // Best-effort: payout yanıtını asla bloklamaz/başarısız kılmaz.
  try {
    await Promise.allSettled(
      Array.from(donorUids).map((uid) => awardBadgesForUser(db, uid, { notify: true })),
    );
  } catch (e) {
    console.warn('[payout] badge award pass failed', e instanceof Error ? e.message : String(e));
  }

  return NextResponse.json({
    ok: true,
    payoutId: payoutRef.id,
    ngoId,
    ngoName,
    period: periodLabel,
    amount: netTotal,
    donationCount: donationIds.length,
    notified: !!adminUserId,
  });
}
