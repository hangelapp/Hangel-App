/**
 * POST /api/super-admin/transparency/delete-item
 *
 * Super-admin, bir STK'nın şeffaflık kriterine girdiği belgeyi/bilgiyi SİLER
 * (kriter listede kalır ama içeriği temizlenir → "boş"a döner). transparency/
 * {ownerUid}.criteria[itemId] içerik alanları (fileUrl/linkUrl/textValue/…) kaldırılır
 * ve isCompleted=false yapılır; ardından ilgili NGO'nun transparencyScore'u yeniden
 * hesaplanır. transparency/{ownerUid} owner-only yazılabildiğinden Admin SDK kullanılır.
 *
 * Body: { ownerUid: string, itemId: number | string }
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { normalizeDefs, computeScore } from '@/lib/transparency';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface CriteriaItem {
  id: number | string;
  name?: string;
  type?: string;
  order?: number;
  points?: number;
  isCompleted?: boolean;
  status?: 'pending' | 'approved';
  fileUrl?: string;
  fileName?: string;
  storagePath?: string;
  linkUrl?: string;
  textValue?: string;
  selectedOptions?: string[];
  updatedAt?: string;
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
  let body: { ownerUid?: string; itemId?: number | string };
  try { body = await req.json(); } catch { return NextResponse.json({ errorCode: 'BAD_JSON', message: 'Geçersiz JSON' }, { status: 400 }); }
  const { ownerUid, itemId } = body;
  if (!ownerUid || typeof ownerUid !== 'string' || (typeof itemId !== 'number' && typeof itemId !== 'string')) {
    return NextResponse.json({ errorCode: 'BAD_INPUT', message: 'ownerUid + itemId gerekli' }, { status: 400 });
  }

  const db = getAdminFirestore();
  const tRef = db.collection(COLLECTIONS.transparency).doc(ownerUid);
  const tSnap = await tRef.get();
  if (!tSnap.exists) return NextResponse.json({ errorCode: 'NOT_FOUND', message: 'Şeffaflık kaydı yok' }, { status: 404 });

  const data = tSnap.data() as { criteria?: CriteriaItem[] } | undefined;
  const criteria = Array.isArray(data?.criteria) ? data!.criteria : [];

  // İlgili kriterin İÇERİĞİNİ temizle (kriter listede kalır — sabit endeks maddesi).
  const next: CriteriaItem[] = criteria.map((c) => {
    if (String(c.id) !== String(itemId)) return c;
    const cleared: CriteriaItem = { ...c };
    delete cleared.fileUrl;
    delete cleared.fileName;
    delete cleared.storagePath;
    delete cleared.linkUrl;
    delete cleared.textValue;
    delete cleared.selectedOptions;
    delete cleared.status;
    cleared.isCompleted = false;
    cleared.updatedAt = new Date().toISOString();
    return cleared;
  });
  await tRef.set({ criteria: next, updatedAt: new Date().toISOString() }, { merge: true });

  // Best-effort: Storage dosyasını da sil (varsa).
  const target = criteria.find((c) => String(c.id) === String(itemId));
  if (target?.storagePath) {
    try {
      const { getStorage } = await import('firebase-admin/storage');
      await getStorage().bucket().file(target.storagePath).delete();
    } catch {
      // Storage silme başarısızsa Firestore temizliği yine de geçerli.
    }
  }

  // Skoru yeniden hesapla (temizlenen madde artık sayılmaz).
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
    // NGO eşleşmesi/yazımı başarısızsa silme yine de kaydedildi.
  }

  return NextResponse.json({ ok: true, approvedScore, ngoUpdated });
}
