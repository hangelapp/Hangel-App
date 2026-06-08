/**
 * POST /api/super-admin/ngo-ads/status — STK reklam planı durum güncelleme.
 *
 * hangel ekibi bir reklam planının durumunu pipeline boyunca ilerletir
 * (submitted → approved → linked → active) veya reddeder (rejected).
 *
 * Body: { planId, status, note? }. Auth: super-admin. Hata: { errorCode, message }.
 */
import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_STATUS = ['submitted', 'approved', 'linked', 'active', 'rejected'] as const;
type AdPlanStatus = (typeof ALLOWED_STATUS)[number];

async function getSuperAdmin(req: NextRequest): Promise<{ uid: string } | null> {
  const authHeader = req.headers.get('authorization') || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!idToken) return null;
  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken) as { uid: string; role?: string; superAdminPermissions?: unknown };
    if (decoded.role === 'super-admin' || !!decoded.superAdminPermissions) return { uid: decoded.uid };
    const snap = await getAdminFirestore().collection(COLLECTIONS.users).doc(decoded.uid).get();
    const d = snap.data();
    if (d?.role === 'super-admin' || (Array.isArray(d?.superAdminPermissions) && d.superAdminPermissions.length > 0)) {
      return { uid: decoded.uid };
    }
    return null;
  } catch { return null; }
}

export async function POST(req: NextRequest) {
  const admin = await getSuperAdmin(req);
  if (!admin) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Super-admin yetkisi gerekli.' }, { status: 403 });
  }

  const body = await req.json().catch(() => null) as { planId?: unknown; status?: unknown; note?: unknown } | null;
  const planId = typeof body?.planId === 'string' ? body.planId.trim() : '';
  const status = body?.status;
  const note = typeof body?.note === 'string' ? body.note : '';

  if (!planId || typeof status !== 'string' || !ALLOWED_STATUS.includes(status as AdPlanStatus)) {
    return NextResponse.json({ errorCode: 'BAD_INPUT', message: 'planId ve geçerli bir status gerekli.' }, { status: 400 });
  }

  const db = getAdminFirestore();
  const ref = db.collection(COLLECTIONS.adPlans).doc(planId);
  const snap = await ref.get();
  if (!snap.exists) {
    return NextResponse.json({ errorCode: 'NOT_FOUND', message: 'Reklam planı bulunamadı.' }, { status: 404 });
  }

  await ref.set(
    {
      status: status as AdPlanStatus,
      statusNote: note,
      statusUpdatedAt: FieldValue.serverTimestamp(),
      statusBy: admin.uid,
    },
    { merge: true },
  );

  return NextResponse.json({ ok: true });
}
