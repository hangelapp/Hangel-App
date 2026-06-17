/**
 * POST /api/super-admin/messaging/pasifik/test-send
 *
 * Body: { to: string, body: string }
 *
 * Süper-admin'in canlıya geçmeden Pasifik üzerinden tek SMS test edebilmesi için
 * yardımcı endpoint. KVKK: log'a numara maskelenir, içerik yazılmaz.
 *
 * Yanıt: SendResult (SmsProvider.send) — { ok, providerMessageId?, errorCode?, errorMessage?, raw? }
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { PasifikSmsProvider } from '@/lib/messaging/providers/sms/pasifik';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  if (!(await isSuperAdmin(req))) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Super-admin yetkisi gerekli.' }, { status: 403 });
  }

  let body: { to?: unknown; body?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ errorCode: 'BAD_JSON', message: 'Geçersiz JSON.' }, { status: 400 });
  }

  const to = typeof body.to === 'string' ? body.to.trim() : '';
  const text = typeof body.body === 'string' ? body.body : '';
  if (!to || !text) {
    return NextResponse.json(
      { errorCode: 'BAD_INPUT', message: 'to ve body alanları zorunludur.' },
      { status: 400 },
    );
  }

  const username = process.env.PASIFIK_USERNAME;
  const password = process.env.PASIFIK_PASSWORD;
  const from = process.env.PASIFIK_FROM;
  if (!username || !password || !from) {
    return NextResponse.json(
      { errorCode: 'CONFIG_MISSING', message: 'PASIFIK_USERNAME / PASIFIK_PASSWORD / PASIFIK_FROM tanımlı değil.' },
      { status: 500 },
    );
  }

  try {
    const provider = new PasifikSmsProvider({ username, password, from });
    const result = await provider.send({
      to,
      body: text,
      senderId: from,
      useCase: 'transactional',
    });
    return NextResponse.json(result);
  } catch (err) {
    console.error('[super-admin/messaging/pasifik/test-send] failed', err);
    return NextResponse.json({ errorCode: 'INTERNAL', message: 'Test SMS gönderilemedi.' }, { status: 500 });
  }
}
