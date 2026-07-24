/**
 * GET /api/ngo-admin/call-center/status?ngoId=<id>
 *
 * STK çağrı merkezi durumunu (ngoCallCenter doc) SERVER tarafında (Admin SDK) döner.
 * Client useDoc(ngoCallCenter) Firestore read rule'una takıldığı için panel sekme
 * gating'i buradan beslenir — rules deploy gerekmeden çalışır.
 *
 * Yetki: super-admin / sahip (ismailhilmi) HER STK'yı okur; ngo-admin yalnız kendi
 * managedNgoId'sini okur. Yazma YOK (durum yalnız onboard/settings/activate ile değişir).
 *
 * Yanıt: { ok, callCenter: {...} | null }
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NGO_CALL_CENTER = 'ngoCallCenter';
const OWNER_EMAIL = 'ismailhilmi@hangel.org';

interface CallerContext {
  uid: string;
  managedNgoId?: string;
  managedBrandId?: string;
  managedClubId?: string;
  role?: string;
  email?: string;
}

async function authorize(req: NextRequest): Promise<CallerContext | null> {
  const authHeader = req.headers.get('authorization') || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!idToken) return null;
  try {
    const decoded = (await getAdminAuth().verifyIdToken(idToken)) as { uid: string; email?: string };
    const snap = await getAdminFirestore().collection(COLLECTIONS.users).doc(decoded.uid).get();
    if (!snap.exists) return null;
    const d = snap.data() as { role?: string; managedNgoId?: string; managedBrandId?: string; managedClubId?: string };
    return {
      uid: decoded.uid,
      managedNgoId: d?.managedNgoId,
      managedBrandId: d?.managedBrandId,
      managedClubId: d?.managedClubId,
      role: d?.role,
      email: decoded.email,
    };
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const ctx = await authorize(req);
  if (!ctx) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Oturum gerekli.' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const ngoId = (searchParams.get('ngoId') || '').trim();
  if (!ngoId) {
    return NextResponse.json({ errorCode: 'BAD_INPUT', message: 'ngoId zorunlu.' }, { status: 400 });
  }

  const isOwner = ctx.role === 'super-admin' || ctx.email === OWNER_EMAIL;
  // Aktif kurum ngoId query'den; caller ngo/brand/club üyeliğinden biriyle eşleşmeli.
  const managesThis = ctx.managedNgoId === ngoId || ctx.managedBrandId === ngoId || ctx.managedClubId === ngoId;
  if (!isOwner && !managesThis) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Bu STK için yetkiniz yok.' }, { status: 403 });
  }

  try {
    const doc = await getAdminFirestore().collection(NGO_CALL_CENTER).doc(ngoId).get();
    if (!doc.exists) {
      return NextResponse.json({ ok: true, callCenter: null });
    }
    const data = doc.data() as Record<string, unknown>;
    // Yalnız panelin ihtiyacı olan alanlar (Timestamp'leri sızdırma).
    return NextResponse.json({
      ok: true,
      callCenter: {
        status: data.status ?? null,
        callerIdNumber: data.callerIdNumber ?? null,
        packageId: data.packageId ?? null,
        providerId: data.providerId ?? null,
        monthlyMinutesQuota: data.monthlyMinutesQuota ?? null,
        currentMonthUsage: data.currentMonthUsage ?? null,
        extensions: Array.isArray(data.extensions) ? data.extensions : null,
        settings: data.settings && typeof data.settings === 'object' ? data.settings : null,
      },
    });
  } catch {
    return NextResponse.json({ errorCode: 'INTERNAL_ERROR', message: 'Durum okunamadı.' }, { status: 500 });
  }
}
