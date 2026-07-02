/**
 * POST /api/super-admin/transparency/save
 *
 * Super-admin, bir STK'nın şeffaflık endeksi kriterlerini (belgeler/linkler/
 * metinler/çoklu-seçim + tamamlanma durumu) TOPLU olarak kaydeder. Firestore
 * `transparency/{ownerUid}` doc'u yalnızca sahibinin (isOwner) yazmasına izinli
 * olduğundan client'tan yazılamaz; bu route Admin SDK ile yazar.
 *
 * Super-admin düzenlemeleri yetkilidir: tamamlanan maddeler 'approved' işaretlenir
 * (ayrıca onay beklemeye gerek yok). Ardından NGO'nun transparencyScore'u onaylı
 * maddelerin puan toplamı olarak ngos/{ngoId} doc'una yazılır.
 *
 * Body: { ngoId: string, ownerUid?: string, criteria: CriteriaItem[] }
 *   ownerUid verilmezse: ngo.adminUserId → users(managedNgoId==ngoId) sırasıyla çözülür.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { recomputeNgoTransparency } from '@/lib/transparency-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface CriteriaItem {
  id: number;
  name?: string;
  points?: number;
  isCompleted?: boolean;
  type?: string;
  fileName?: string;
  fileUrl?: string;
  storagePath?: string;
  linkUrl?: string;
  textValue?: string;
  selectedOptions?: string[];
  options?: string[];
  updatedAt?: string;
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

  let body: { ngoId?: string; ownerUid?: string; criteria?: CriteriaItem[] };
  try { body = await req.json(); } catch { return NextResponse.json({ errorCode: 'BAD_JSON', message: 'Geçersiz JSON' }, { status: 400 }); }

  const { ngoId } = body;
  let { ownerUid } = body;
  const criteria = Array.isArray(body.criteria) ? body.criteria : null;
  if (!ngoId || typeof ngoId !== 'string' || !criteria) {
    return NextResponse.json({ errorCode: 'BAD_INPUT', message: 'ngoId + criteria gerekli.' }, { status: 400 });
  }

  const db = getAdminFirestore();

  // ownerUid çözümle: body → ngo.adminUserId → users(managedNgoId == ngoId).
  if (!ownerUid) {
    try {
      const ngoSnap = await db.collection(COLLECTIONS.ngos).doc(ngoId).get();
      ownerUid = (ngoSnap.data() as { adminUserId?: string } | undefined)?.adminUserId || undefined;
    } catch { /* yoksay */ }
  }
  if (!ownerUid) {
    try {
      const uq = await db.collection(COLLECTIONS.users).where('managedNgoId', '==', ngoId).limit(1).get();
      if (!uq.empty) ownerUid = uq.docs[0].id;
    } catch { /* yoksay */ }
  }
  if (!ownerUid) {
    return NextResponse.json(
      { errorCode: 'NO_OWNER', message: 'Bu STK için yönetici hesabı bulunamadı; şeffaflık kaydı bu hesaba bağlanır.' },
      { status: 409 },
    );
  }

  // Super-admin düzenlemesi yetkilidir: tamamlanan her madde 'approved'.
  // ÖNEMLİ: Admin SDK .set() `undefined` değerleri reddeder; tamamlanmamış maddeler
  // fileUrl/status vb. için undefined taşır. Her maddeden undefined alanları temizle.
  const stripUndefined = <T extends Record<string, unknown>>(obj: T): T => {
    const out = {} as Record<string, unknown>;
    for (const [k, v] of Object.entries(obj)) if (v !== undefined) out[k] = v;
    return out as T;
  };
  const normalized: CriteriaItem[] = criteria.map((c) => stripUndefined({
    ...c,
    status: c.isCompleted ? ('approved' as const) : undefined,
    updatedAt: new Date().toISOString(),
  }));

  let score: number | null;
  try {
    await db.collection(COLLECTIONS.transparency).doc(ownerUid).set(
      { criteria: normalized, ngoId, updatedAt: new Date().toISOString() },
      { merge: true },
    );
    // Skor = yüklenen belge + PROFİLDEN otomatik karşılanan kriterler → YÜZDE, yayınlanır.
    score = await recomputeNgoTransparency(db, ngoId);
  } catch (err) {
    console.error('[transparency/save] write failed', err);
    return NextResponse.json({ errorCode: 'WRITE_FAILED', message: 'Kaydedilemedi.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, ownerUid, score });
}
