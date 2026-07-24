/**
 * POST /api/ngo-admin/call-center/contacts/[id]/stage
 *
 * Kişinin bağış hunisi aşamasını ve (opsiyonel) söz verilen tutarı günceller.
 * Body: { stage: string, pledgeAmount?: number }
 *   - stage: DEFAULT_STAGES key'lerinden biri
 *   - pledgeAmount: 'söz verdi' aşamasında temsilcinin girdiği TL (opsiyonel)
 *
 * santralContacts/{id}: { stage, stageUpdatedAt, stageUpdatedBy, pledgeAmount? }
 * Ayrıca aşama değişimi bir activity kaydı olarak yazılır (zaman tüneli için):
 *   santralContacts/{id}/activities/{auto} { type:'stage', stage, at, by }
 *
 * KVKK: yalnız caller'ın kendi tenant'ı.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { isValidStageKey, getStage } from '@/lib/santral/pipeline';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Ctx { uid: string; ngoId: string; name: string | null; }

async function authorize(req: NextRequest): Promise<Ctx | null> {
  const authHeader = req.headers.get('authorization') || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!idToken) return null;
  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken);
    const snap = await getAdminFirestore().collection(COLLECTIONS.users).doc(decoded.uid).get();
    if (!snap.exists) return null;
    const d = snap.data() as { role?: string; managedNgoId?: string; managedBrandId?: string; managedClubId?: string; displayName?: string; name?: string };
    if (!d) return null;
    if (d.role !== 'ngo-admin' && d.role !== 'super-admin') return null;
    const isSuperAdmin = d.role === 'super-admin';
    // Aktif kurum: üst switcher x-org-id + x-org-kind header'ıyla gelir (çoklu kurum
    // yöneten kullanıcı için kritik). Caller o kuruma üyeyse (managedNgoId/BrandId/ClubId
    // == header) ya da super-admin ise header'daki kurum kullanılır; yoksa eski davranışa
    // (managedNgoId → managedBrandId → managedClubId ilk dolu olan) düşer.
    const hdrKindRaw = req.headers.get('x-org-kind');
    const hdrKind = (hdrKindRaw === 'ngo' || hdrKindRaw === 'brand' || hdrKindRaw === 'club') ? hdrKindRaw : undefined;
    const hdrOrgId = req.headers.get('x-org-id') || undefined;
    let __activeNgoId = '';
    if (hdrOrgId && hdrKind) {
      const isMember =
        (hdrKind === 'ngo' && d.managedNgoId === hdrOrgId) ||
        (hdrKind === 'brand' && d.managedBrandId === hdrOrgId) ||
        (hdrKind === 'club' && d.managedClubId === hdrOrgId);
      if (isSuperAdmin || isMember) __activeNgoId = hdrOrgId;
      else return null;
    } else {
      __activeNgoId = d.managedNgoId || d.managedBrandId || d.managedClubId || '';
    }
    if (!__activeNgoId) return null;
    return { uid: decoded.uid, ngoId: __activeNgoId, name: d.displayName || d.name || null };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await authorize(req);
  if (!ctx) return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Yetki gerekli.' }, { status: 403 });

  const { id } = await params;
  if (!id) return NextResponse.json({ errorCode: 'BAD_INPUT', message: 'Kişi kimliği eksik.' }, { status: 400 });

  let body: { stage?: unknown; pledgeAmount?: unknown };
  try { body = await req.json(); } catch { body = {}; }
  if (!isValidStageKey(body.stage)) {
    return NextResponse.json({ errorCode: 'BAD_STAGE', message: 'Geçersiz aşama.' }, { status: 400 });
  }
  const stage = body.stage;

  // Söz verilen tutar: 0-10.000.000 TL arası, opsiyonel.
  let pledgeAmount: number | null = null;
  if (body.pledgeAmount !== undefined && body.pledgeAmount !== null) {
    const n = Number(body.pledgeAmount);
    if (Number.isFinite(n) && n >= 0 && n <= 10_000_000) pledgeAmount = Math.round(n);
  }

  const db = getAdminFirestore();
  const ref = db.collection(COLLECTIONS.santralContacts).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return NextResponse.json({ errorCode: 'NOT_FOUND', message: 'Kişi bulunamadı.' }, { status: 404 });
  if ((snap.data() as { ngoId?: string }).ngoId !== ctx.ngoId) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Bu kişiye erişim yetkiniz yok.' }, { status: 403 });
  }

  const patch: Record<string, unknown> = {
    stage,
    stageUpdatedAt: FieldValue.serverTimestamp(),
    stageUpdatedBy: ctx.uid,
  };
  if (pledgeAmount !== null) patch.pledgeAmount = pledgeAmount;

  const batch = db.batch();
  batch.set(ref, patch, { merge: true });
  // Zaman tüneli için aşama değişim kaydı.
  const actRef = ref.collection('activities').doc();
  batch.set(actRef, {
    type: 'stage',
    stage,
    stageLabel: getStage(stage).label,
    pledgeAmount: pledgeAmount ?? null,
    at: FieldValue.serverTimestamp(),
    by: ctx.uid,
    byName: ctx.name,
  });
  await batch.commit();

  return NextResponse.json({ ok: true, stage, pledgeAmount });
}
