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
import { normalizeDefs, computeScore, mergeWithProfile, type CriteriaItem, type NgoProfileLike } from '@/lib/transparency';

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

  // 2) transparency verisi: adminUid → yüklenen kriterler.
  const tByAdmin = new Map<string, CriteriaItem[]>();
  try {
    const tSnap = await db.collection(COLLECTIONS.transparency).get();
    tSnap.docs.forEach((d) => { tByAdmin.set(d.id, (d.data() as { criteria?: CriteriaItem[] }).criteria || []); });
  } catch (err) {
    console.error('[transparency/recalculate] transparency read failed', err);
    return NextResponse.json({ errorCode: 'READ_FAILED', message: 'Şeffaflık verisi okunamadı.' }, { status: 500 });
  }

  // 3) TÜM NGO'lar için: yüklenen belge + PROFİLDEN otomatik karşılanan kriterler
  //    → birleşik YÜZDE skoru. (Belgesi olmayan ama profili dolu STK'lar da puan alır.)
  let updated = 0;
  let scanned = 0;
  try {
    const ngosSnap = await db.collection(COLLECTIONS.ngos).get();
    const writes: Promise<unknown>[] = [];
    ngosSnap.docs.forEach((d) => {
      scanned++;
      const ngo = d.data() as NgoProfileLike & { adminUserId?: string };
      const saved = ngo.adminUserId ? tByAdmin.get(ngo.adminUserId) : null;
      const merged = mergeWithProfile(defs, saved as never, ngo);
      const { percent } = computeScore(defs, merged as never, { requireApproved: true });
      writes.push(
        d.ref.set(
          { transparencyScore: percent, transparencyUpdatedAt: new Date().toISOString() },
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
