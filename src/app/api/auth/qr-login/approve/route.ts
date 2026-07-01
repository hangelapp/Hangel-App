/**
 * POST /api/auth/qr-login/approve — telefondaki giriş yapmış kullanıcı QR girişini onaylar.
 *
 * Header: Bearer <idToken> (telefonun oturumu). Body: { token }.
 * qr_logins/{token} pending + süresi geçmemişse uid ile 'approved' işaretlenir.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/firebase/collections';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!idToken) return NextResponse.json({ errorCode: 'UNAUTH', message: 'Giriş gerekli.' }, { status: 401 });

  let uid: string;
  try {
    uid = (await getAdminAuth().verifyIdToken(idToken)).uid;
  } catch {
    return NextResponse.json({ errorCode: 'UNAUTH', message: 'Oturum geçersiz.' }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as { token?: string; code?: string } | null;
  let token = typeof body?.token === 'string' ? body.token.trim() : '';
  const code = typeof body?.code === 'string' ? body.code.trim().toUpperCase().replace(/\s+/g, '') : '';
  const dbAdmin = getAdminFirestore();

  // Kamerasız cihaz kısa KOD girdiyse → doc token'ını bul (kod tek-kullanımlık, pending).
  if (!token && code) {
    // Tek-alan eşitlik (otomatik indeksli); status/expiry kontrolü aşağıda doc üzerinden.
    const q = await dbAdmin.collection(COLLECTIONS.qrLogins).where('code', '==', code).limit(1).get();
    if (!q.empty) token = q.docs[0].id;
  }
  if (!token) return NextResponse.json({ errorCode: 'BAD', message: 'Kod gerekli.' }, { status: 400 });

  const ref = dbAdmin.collection(COLLECTIONS.qrLogins).doc(token);
  const snap = await ref.get();
  if (!snap.exists) return NextResponse.json({ errorCode: 'NOT_FOUND', message: 'Kod bulunamadı.' }, { status: 404 });

  const data = snap.data() as { status?: string; expiresAtMs?: number };
  if (data.status !== 'pending') {
    return NextResponse.json({ errorCode: 'USED', message: 'Bu kod kullanılmış veya süresi dolmuş.' }, { status: 409 });
  }
  if (typeof data.expiresAtMs === 'number' && Date.now() > data.expiresAtMs) {
    return NextResponse.json({ errorCode: 'EXPIRED', message: 'Kodun süresi doldu, masaüstünde yenile.' }, { status: 410 });
  }

  await ref.update({ status: 'approved', uid, approvedAt: FieldValue.serverTimestamp() });
  return NextResponse.json({ ok: true });
}
