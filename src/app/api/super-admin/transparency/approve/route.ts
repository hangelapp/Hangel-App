/**
 * POST /api/super-admin/transparency/approve
 *
 * Super-admin, bir STK'nın şeffaflık belgesini/bilgisini onaylar (veya onayı geri
 * alır). transparency/{ownerUid}.criteria[itemId].status = 'approved' | 'pending'
 * yazılır; ardından ilgili NGO'nun (adminUserId == ownerUid) transparencyScore'u
 * onaylı maddelerin puan toplamı olarak yeniden hesaplanıp ngo doc'una yazılır.
 * Bu skor /ngos kartlarında ve STK profilinde yayınlanır.
 *
 * Body: { ownerUid: string, itemId: number, approved: boolean }
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { normalizeDefs, computeScore } from '@/lib/transparency';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface CriteriaItem {
  id: number | string;
  points: number;
  isCompleted?: boolean;
  status?: 'pending' | 'approved';
}

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
  let body: { ownerUid?: string; itemId?: number | string; approved?: boolean };
  try { body = await req.json(); } catch { return NextResponse.json({ errorCode: 'BAD_JSON', message: 'Geçersiz JSON' }, { status: 400 }); }
  const { ownerUid, itemId, approved } = body;
  if (!ownerUid || typeof ownerUid !== 'string' || (typeof itemId !== 'number' && typeof itemId !== 'string')) {
    return NextResponse.json({ errorCode: 'BAD_INPUT', message: 'ownerUid + itemId gerekli' }, { status: 400 });
  }

  const db = getAdminFirestore();
  const tRef = db.collection(COLLECTIONS.transparency).doc(ownerUid);
  const tSnap = await tRef.get();
  if (!tSnap.exists) return NextResponse.json({ errorCode: 'NOT_FOUND', message: 'Şeffaflık kaydı yok' }, { status: 404 });

  const data = tSnap.data() as { criteria?: CriteriaItem[] } | undefined;
  const criteria = Array.isArray(data?.criteria) ? data!.criteria : [];
  const next = criteria.map((c) => (String(c.id) === String(itemId) ? { ...c, status: (approved ? 'approved' : 'pending') as 'approved' | 'pending' } : c));
  await tRef.set({ criteria: next, updatedAt: new Date().toISOString() }, { merge: true });

  // İlgili NGO'nun puanını GÜNCEL kriter tanımlarından hesapla (madde puanı değişse
  // bile doğru). Yalnız onaylı maddeler sayılır.
  let approvedScore: number;
  try {
    const critSnap = await db.collection(COLLECTIONS.transparencyCriteria).get();
    const raw = critSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) }));
    const defs = normalizeDefs(raw as never);
    approvedScore = computeScore(defs, next as never, { requireApproved: true }).met;
  } catch {
    approvedScore = next
      .filter((c) => c.isCompleted && c.status !== 'pending')
      .reduce((sum, c) => sum + (Number(c.points) || 0), 0);
  }

  let ngoUpdated: string | null = null;
  try {
    const ngoQ = await db.collection(COLLECTIONS.ngos).where('adminUserId', '==', ownerUid).limit(1).get();
    if (!ngoQ.empty) {
      const ngoDoc = ngoQ.docs[0];
      await ngoDoc.ref.set({ transparencyScore: approvedScore, transparencyUpdatedAt: new Date().toISOString() }, { merge: true });
      ngoUpdated = ngoDoc.id;
    }
  } catch {
    // NGO eşleşmesi/yazımı başarısızsa onay yine de kaydedildi.
  }

  return NextResponse.json({ ok: true, approvedScore, ngoUpdated });
}
