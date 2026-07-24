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
    const d = snap.data() as { role?: string; managedNgoId?: string; managedBrandId?: string; managedClubId?: string };
    if (!d) return null;
    if (d.role !== 'ngo-admin' && d.role !== 'super-admin') return null;
    // Aktif kurum: üst switcher x-org-id + x-org-kind header'ıyla gelir (çoklu
    // kurum yöneten kullanıcı için kritik). Caller o kuruma üyeyse (managed*Id
    // eşleşmesi) ya da super-admin ise header'daki kurum kullanılır; yoksa eski
    // davranış: managedNgoId → managedBrandId → managedClubId ilk dolu olan.
    const hdrKindRaw = req.headers.get('x-org-kind');
    const hdrKind = (hdrKindRaw === 'ngo' || hdrKindRaw === 'brand' || hdrKindRaw === 'club') ? hdrKindRaw : undefined;
    const hdrOrgId = (req.headers.get('x-org-id') || '').trim() || undefined;
    const isSuper = d.role === 'super-admin';
    let __activeNgoId = '';
    if (hdrOrgId && hdrKind) {
      const member =
        (hdrKind === 'ngo' && d.managedNgoId === hdrOrgId) ||
        (hdrKind === 'brand' && d.managedBrandId === hdrOrgId) ||
        (hdrKind === 'club' && d.managedClubId === hdrOrgId);
      if (!member && !isSuper) return null;
      __activeNgoId = hdrOrgId;
    } else {
      __activeNgoId = d.managedNgoId || d.managedBrandId || d.managedClubId || '';
    }
    if (!__activeNgoId) return null;
    return { uid: decoded.uid, ngoId: __activeNgoId };
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
