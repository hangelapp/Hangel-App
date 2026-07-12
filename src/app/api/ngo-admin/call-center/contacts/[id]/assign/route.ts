/**
 * POST /api/ngo-admin/call-center/contacts/[id]/assign
 *
 * Kişiyi bir temsilciye atar (veya atamayı kaldırır). Atama, "Bugünkü İşim" ve
 * kişi listesinde sorumluyu göstermek için kullanılır.
 * Body: { assignedToUid: string | null, assignedToName?: string }
 * santralContacts/{id}: { assignedToUid, assignedToName, assignedAt, assignedBy }
 *
 * KVKK: yalnız caller'ın kendi tenant'ı.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/firebase/collections';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Ctx { uid: string; ngoId: string; }

async function authorize(req: NextRequest): Promise<Ctx | null> {
  const authHeader = req.headers.get('authorization') || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!idToken) return null;
  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken);
    const snap = await getAdminFirestore().collection(COLLECTIONS.users).doc(decoded.uid).get();
    if (!snap.exists) return null;
    const d = snap.data() as { role?: string; managedNgoId?: string };
    if (!d?.managedNgoId) return null;
    if (d.role !== 'ngo-admin' && d.role !== 'super-admin') return null;
    return { uid: decoded.uid, ngoId: d.managedNgoId };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await authorize(req);
  if (!ctx) return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Yetki gerekli.' }, { status: 403 });

  const { id } = await params;
  if (!id) return NextResponse.json({ errorCode: 'BAD_INPUT', message: 'Kişi kimliği eksik.' }, { status: 400 });

  let body: { assignedToUid?: unknown; assignedToName?: unknown };
  try { body = await req.json(); } catch { body = {}; }
  const assignedToUid = typeof body.assignedToUid === 'string' && body.assignedToUid.trim() ? body.assignedToUid.trim() : null;
  const assignedToName = typeof body.assignedToName === 'string' ? body.assignedToName.slice(0, 120) : null;

  const db = getAdminFirestore();
  const ref = db.collection(COLLECTIONS.santralContacts).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return NextResponse.json({ errorCode: 'NOT_FOUND', message: 'Kişi bulunamadı.' }, { status: 404 });
  if ((snap.data() as { ngoId?: string }).ngoId !== ctx.ngoId) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Bu kişiye erişim yetkiniz yok.' }, { status: 403 });
  }

  await ref.set({
    assignedToUid,
    assignedToName: assignedToUid ? assignedToName : null,
    assignedAt: assignedToUid ? FieldValue.serverTimestamp() : null,
    assignedBy: ctx.uid,
  }, { merge: true });

  return NextResponse.json({ ok: true, assignedToUid, assignedToName });
}
