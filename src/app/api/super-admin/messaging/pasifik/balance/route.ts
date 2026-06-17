/**
 * GET /api/super-admin/messaging/pasifik/balance
 *
 * Pasifik Telekom hesap bakiyesi (kontör). Sadece super-admin.
 * Yanıt: { credits, raw } veya { errorCode, message }
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

export async function GET(req: NextRequest) {
  if (!(await isSuperAdmin(req))) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Super-admin yetkisi gerekli.' }, { status: 403 });
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
    const result = await provider.getBalance();
    if (!result) {
      return NextResponse.json(
        { errorCode: 'PROVIDER_ERROR', message: 'Pasifik bakiye sorgusu başarısız oldu.' },
        { status: 502 },
      );
    }
    return NextResponse.json({ credits: result.credits, raw: result.raw });
  } catch (err) {
    console.error('[super-admin/messaging/pasifik/balance] failed', err);
    return NextResponse.json({ errorCode: 'INTERNAL', message: 'Bakiye sorgulanamadı.' }, { status: 500 });
  }
}
