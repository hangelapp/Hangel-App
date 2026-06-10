/**
 * POST /api/super-admin/transparency/recalculate
 *
 * Endeks maddeleri (transparencyCriteria) değiştiğinde — ad/puan/tür/ekle/çıkar —
 * TÜM STK'ların şeffaflık puanını güncel kriter tanımları üzerinden yeniden hesaplar
 * ve ngos/{id}.transparencyScore'a yazar (yayınlar). Böylece kart/liste/profillerde
 * gösterilen puanlar anında güncel kriterlerle tutarlı olur.
 *
 * Yalnız onaylı (status !== 'pending') maddeler puana sayılır.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { normalizeDefs, computeScore, type CriteriaItem } from '@/lib/transparency';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function isSuperAdmin(req: NextRequest): Promise<boolean> {
  const authHeader = req.headers.get('authorization') || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!idToken) return false;
  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken) as { uid: string; role?: string; superAdminPermissions?: unknown };
    if (decoded.role === 'super-admin' || !!decoded.superAdminPermissions) return true;
    const snap = await getAdminFirestore().collection(COLLECTIONS.users).doc(decoded.uid).get();
    const d = snap.data();
    return d?.role === 'super-admin' || (Array.isArray(d?.superAdminPermissions) && d.superAdminPermissions.length > 0);
  } catch { return false; }
}

export async function POST(req: NextRequest) {
  if (!(await isSuperAdmin(req))) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Super-admin yetkisi gerekli.' }, { status: 403 });
  }

  const db = getAdminFirestore();

  // 1) Güncel kriter tanımları.
  let defs;
  try {
    const critSnap = await db.collection(COLLECTIONS.transparencyCriteria).get();
    const raw = critSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) }));
    defs = normalizeDefs(raw as never);
  } catch (err) {
    console.error('[transparency/recalculate] criteria read failed', err);
    return NextResponse.json({ errorCode: 'READ_FAILED', message: 'Kriterler okunamadı.' }, { status: 500 });
  }

  // 2) adminUid → ngoId haritası.
  const adminToNgo = new Map<string, string>();
  try {
    const ngosSnap = await db.collection(COLLECTIONS.ngos).get();
    ngosSnap.docs.forEach((d) => {
      const a = (d.data() as { adminUserId?: string }).adminUserId;
      if (a) adminToNgo.set(a, d.id);
    });
  } catch (err) {
    console.error('[transparency/recalculate] ngos read failed', err);
    return NextResponse.json({ errorCode: 'READ_FAILED', message: 'STK listesi okunamadı.' }, { status: 500 });
  }

  // 3) Her transparency doc'u için skoru hesapla, eşleşen NGO'ya yaz.
  let updated = 0;
  let scanned = 0;
  try {
    const tSnap = await db.collection(COLLECTIONS.transparency).get();
    const writes: Promise<unknown>[] = [];
    tSnap.docs.forEach((d) => {
      scanned++;
      const ngoId = adminToNgo.get(d.id);
      if (!ngoId) return;
      const saved = (d.data() as { criteria?: CriteriaItem[] }).criteria;
      const { met } = computeScore(defs, saved as never, { requireApproved: true });
      writes.push(
        db.collection(COLLECTIONS.ngos).doc(ngoId).set(
          { transparencyScore: met, transparencyUpdatedAt: new Date().toISOString() },
          { merge: true },
        ),
      );
      updated++;
    });
    await Promise.all(writes);
  } catch (err) {
    console.error('[transparency/recalculate] recompute failed', err);
    return NextResponse.json({ errorCode: 'WRITE_FAILED', message: 'Yeniden hesaplama başarısız.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, criteriaCount: defs.length, scanned, updated });
}
