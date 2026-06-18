/**
 * GET /api/auth/qr-login/status?token=... — masaüstü QR giriş durumunu sorgular.
 *
 * onaylandıysa bir defaya mahsus custom token döner (sonra 'consumed' işaretlenir).
 * Token gizli olduğundan kimlik gerektirmez.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/firebase/collections';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get('token')?.trim() ?? '';
  if (!token) return NextResponse.json({ errorCode: 'BAD', message: 'Kod gerekli.' }, { status: 400 });

  const ref = getAdminFirestore().collection(COLLECTIONS.qrLogins).doc(token);
  const snap = await ref.get();
  if (!snap.exists) return NextResponse.json({ status: 'expired' });

  const data = snap.data() as { status?: string; uid?: string; expiresAtMs?: number };
  if (typeof data.expiresAtMs === 'number' && Date.now() > data.expiresAtMs && data.status === 'pending') {
    return NextResponse.json({ status: 'expired' });
  }

  if (data.status === 'approved' && data.uid) {
    const customToken = await getAdminAuth().createCustomToken(data.uid);
    await ref.update({ status: 'consumed', consumedAt: FieldValue.serverTimestamp() });
    return NextResponse.json({ status: 'approved', customToken });
  }

  return NextResponse.json({ status: data.status ?? 'pending' });
}
