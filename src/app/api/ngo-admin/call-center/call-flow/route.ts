/**
 * GET / POST /api/ngo-admin/call-center/call-flow
 *
 * STK yöneticisinin santral ÇAĞRI AKIŞI ayarlarını okur/yazar
 * (ngoCallCenter/{ngoId}.callFlow). IVR, sıra, cevapsız-aksiyonu, çalışma
 * saatleri — hepsi enabled bayrağıyla, varsayılan kapalı (normal telefon gibi).
 *
 * KVKK/güvenlik: sadece caller'ın managedNgoId'sine ait doc. Bu route yalnız
 * `callFlow` alanını yazar; status/sip/provisioning alanlarına dokunmaz.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { defaultCallFlow, normalizeCallFlow } from '@/lib/santral/call-flow';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NGO_CALL_CENTER = 'ngoCallCenter';

interface CallerContext { uid: string; ngoId: string; }

async function authorize(req: NextRequest): Promise<CallerContext | null> {
  const authHeader = req.headers.get('authorization') || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!idToken) return null;
  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken);
    const snap = await getAdminFirestore().collection(COLLECTIONS.users).doc(decoded.uid).get();
    if (!snap.exists) return null;
    const d = snap.data() as { role?: string; managedNgoId?: string; managedBrandId?: string; managedClubId?: string };
    if (d.role !== 'ngo-admin' && d.role !== 'super-admin') return null;

    const hdrKindRaw = req.headers.get('x-org-kind');
    const hdrKind = (hdrKindRaw === 'ngo' || hdrKindRaw === 'brand' || hdrKindRaw === 'club') ? hdrKindRaw : undefined;
    const hdrOrgId = req.headers.get('x-org-id') || undefined;
    const isSuperAdmin = d.role === 'super-admin';

    let ngoId: string | undefined;
    if (hdrOrgId && hdrKind) {
      const isMember =
        (hdrKind === 'ngo' && d.managedNgoId === hdrOrgId) ||
        (hdrKind === 'brand' && d.managedBrandId === hdrOrgId) ||
        (hdrKind === 'club' && d.managedClubId === hdrOrgId);
      if (!isMember && !isSuperAdmin) return null;
      ngoId = hdrOrgId;
    } else {
      ngoId = d.managedNgoId || d.managedBrandId || d.managedClubId;
    }
    if (!ngoId) return null;

    return { uid: decoded.uid, ngoId };
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const ctx = await authorize(req);
  if (!ctx) return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'NGO admin yetkisi gerekli.' }, { status: 403 });

  const db = getAdminFirestore();
  const snap = await db.collection(NGO_CALL_CENTER).doc(ctx.ngoId).get();
  const data = snap.data() as { callFlow?: unknown } | undefined;
  const callFlow = data?.callFlow ? normalizeCallFlow(data.callFlow) : defaultCallFlow();
  return NextResponse.json({ callFlow });
}

export async function POST(req: NextRequest) {
  const ctx = await authorize(req);
  if (!ctx) return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'NGO admin yetkisi gerekli.' }, { status: 403 });

  let body: { callFlow?: unknown };
  try { body = await req.json(); } catch { body = {}; }
  const callFlow = normalizeCallFlow(body.callFlow);

  const db = getAdminFirestore();
  // Yalnız callFlow alanını yaz; diğer provisioning alanlarına dokunma.
  await db.collection(NGO_CALL_CENTER).doc(ctx.ngoId).set(
    { callFlow, callFlowUpdatedAt: FieldValue.serverTimestamp() },
    { merge: true },
  );
  return NextResponse.json({ ok: true, callFlow });
}
