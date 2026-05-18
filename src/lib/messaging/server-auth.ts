/**
 * Server-only auth helpers for messaging API routes.
 *
 * - checkMessagingKey: env-secret tabanlı (Cloud Scheduler, internal worker trigger)
 * - requireSuperAdmin: UI çağrıları için Firebase ID token verify + super-admin role kontrolü
 */

import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';

const SUPER_ADMIN_EMAIL = 'ismailhilmi@hangel.org';

export function checkMessagingKey(req: Request): NextResponse | null {
  const expected = process.env.MESSAGING_WORKER_KEY;
  if (!expected) {
    return NextResponse.json(
      { error: 'MESSAGING_WORKER_KEY env yapılandırılmamış' },
      { status: 500 }
    );
  }
  const provided = req.headers.get('x-messaging-key');
  if (provided !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

export interface SuperAdminContext {
  uid: string;
  email: string | null;
}

export async function requireSuperAdmin(
  req: Request
): Promise<{ error: NextResponse; actor?: undefined } | { actor: SuperAdminContext; error?: undefined }> {
  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) {
    return { error: NextResponse.json({ error: 'Token gerekli' }, { status: 401 }) };
  }

  let decoded: { uid: string; email?: string };
  try {
    decoded = await getAdminAuth().verifyIdToken(token);
  } catch {
    return { error: NextResponse.json({ error: 'Geçersiz token' }, { status: 401 }) };
  }

  const email = decoded.email ?? null;
  if (email === SUPER_ADMIN_EMAIL) {
    return { actor: { uid: decoded.uid, email } };
  }

  const snap = await getAdminFirestore().collection('users').doc(decoded.uid).get();
  if (!snap.exists) {
    return { error: NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 403 }) };
  }
  const data = snap.data() as { role?: string } | undefined;
  if (data?.role !== 'super-admin') {
    return { error: NextResponse.json({ error: 'Super-admin yetkisi gerekli' }, { status: 403 }) };
  }

  return { actor: { uid: decoded.uid, email } };
}
