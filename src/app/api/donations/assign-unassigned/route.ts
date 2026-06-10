/**
 * POST /api/donations/assign-unassigned
 *
 * Kullanıcı 2 derneğini SONRADAN seçtiğinde, daha önce "atanmamış" kalan
 * (alışveriş yapıldı ama o an dernek seçilmemişti) bağışlarını geriye dönük
 * seçtiği 2 derneğe %50/%50 dağıtır: ngoIds/ngo/ngoSplit/split yazılır,
 * settlementStatus 'unassigned' → 'pending' olur (artık hak edişe sayılır).
 *
 * Çağıran kendi token'ıyla tetikler (settings/ngo-selection kaydından sonra).
 * Yalnız caller'a ait + atanmamış kayıtlar güncellenir.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { normalizeRates, computeDonationSplit, type DonationRates } from '@/lib/donation-split';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!idToken) return NextResponse.json({ errorCode: 'UNAUTHORIZED', message: 'Oturum doğrulanamadı.' }, { status: 401 });

  let uid: string;
  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken);
    uid = decoded.uid;
  } catch {
    return NextResponse.json({ errorCode: 'UNAUTHORIZED', message: 'Geçersiz oturum.' }, { status: 401 });
  }

  const db = getAdminFirestore();

  // Kullanıcının seçtiği 2 dernek.
  let supportedNgoIds: string[] = [];
  try {
    const uSnap = await db.collection(COLLECTIONS.users).doc(uid).get();
    const arr = (uSnap.data() as { supportedNgos?: string[] } | undefined)?.supportedNgos;
    if (Array.isArray(arr)) supportedNgoIds = arr.filter((x): x is string => typeof x === 'string').slice(0, 2);
  } catch { /* yoksay */ }

  if (supportedNgoIds.length !== 2) {
    // 2 dernek seçili değilse atama yapılmaz (atanmamış olarak kalmaya devam eder).
    return NextResponse.json({ ok: true, assigned: 0, reason: 'no-two-ngos' });
  }

  // Dernek adları.
  const ngoNames: string[] = [];
  for (const nid of supportedNgoIds) {
    try {
      const nSnap = await db.collection(COLLECTIONS.ngos).doc(nid).get();
      ngoNames.push((nSnap.data() as { name?: string } | undefined)?.name || nid);
    } catch { ngoNames.push(nid); }
  }

  // Oranlar.
  let rates: DonationRates;
  try {
    const rSnap = await db.collection(COLLECTIONS.siteSettings).doc('donationRates').get();
    rates = normalizeRates(rSnap.exists ? (rSnap.data() as Partial<DonationRates>) : null);
  } catch { rates = normalizeRates(null); }

  // Caller'ın bağışları — composite index gerektirmemek için tek where + client filtre.
  let assigned = 0;
  try {
    const snap = await db.collection(COLLECTIONS.donations).where('userId', '==', uid).get();
    const batch = db.batch();
    snap.docs.forEach((d) => {
      const data = d.data() as { settlementStatus?: string; ngoIds?: unknown[]; type?: string; donationAmount?: string };
      const isUnassigned = data.settlementStatus === 'unassigned' || (Array.isArray(data.ngoIds) && data.ngoIds.length === 0);
      if (data.type === 'income' || !isUnassigned) return;
      const gross = parseFloat(data.donationAmount || '0') || 0;
      const split = computeDonationSplit(gross, rates, 2);
      batch.update(d.ref, {
        ngoIds: supportedNgoIds,
        ngo: ngoNames,
        ngoSplit: supportedNgoIds.map((nid, i) => ({ ngoId: nid, ngoName: ngoNames[i] || nid, amount: split.perNgo })),
        split: {
          gross: split.gross, incomeTax: split.incomeTax, vat: split.vat,
          netAfterTax: split.netAfterTax, ngoShareTotal: split.ngoShareTotal,
          hangelShare: split.hangelShare, perNgo: split.perNgo, ngoCount: 2, rates,
        },
        settlementStatus: 'pending',
        assignedAt: FieldValue.serverTimestamp(),
      });
      assigned++;
    });
    if (assigned > 0) await batch.commit();
  } catch (err) {
    console.error('[donations/assign-unassigned] failed', err);
    return NextResponse.json({ errorCode: 'INTERNAL', message: 'Atama başarısız.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, assigned });
}
