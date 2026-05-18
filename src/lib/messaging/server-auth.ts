/**
 * Server-only auth helpers for messaging API routes.
 *
 * - checkMessagingKey: env-secret tabanlı (Cloud Scheduler, internal worker trigger)
 * - requireSuperAdmin: UI çağrıları için Firebase ID token verify + super-admin role kontrolü
 */

import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';

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

  let decoded: { uid: string; email?: string; role?: string };
  try {
    decoded = (await getAdminAuth().verifyIdToken(token)) as typeof decoded;
  } catch {
    return { error: NextResponse.json({ error: 'Geçersiz token' }, { status: 401 }) };
  }

  const email = decoded.email ?? null;
  // Primary check: custom claim role == 'super-admin'
  if (decoded.role === 'super-admin') {
    return { actor: { uid: decoded.uid, email } };
  }

  // TODO(P0-4b): remove userData.role fallback once all super-admins have custom claims.
  const snap = await getAdminFirestore().collection(COLLECTIONS.users).doc(decoded.uid).get();
  if (!snap.exists) {
    return { error: NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 403 }) };
  }
  const data = snap.data() as { role?: string } | undefined;
  if (data?.role !== 'super-admin') {
    return { error: NextResponse.json({ error: 'Super-admin yetkisi gerekli' }, { status: 403 }) };
  }

  return { actor: { uid: decoded.uid, email } };
}

export interface NgoAdminContext {
  uid: string;
  email: string | null;
  ngoId: string;            // Server tarafında zorlanır — clientten gelenle override edilir
  isSuperAdmin: boolean;
}

/**
 * NGO admin kontrolü: user.managedNgoId == requested ngoId (varsa).
 * Süper admin geçtiyse her NGO için tam yetkili.
 * Dönen `ngoId` her zaman ya kullanıcının kendi managedNgoId'si ya da süper admin için
 * client'ın gönderdiği targetNgoId (gerekirse).
 */
export async function requireNgoAdmin(
  req: Request,
  options?: { allowSuperAdmin?: boolean; targetNgoId?: string }
): Promise<
  | { error: NextResponse; actor?: undefined }
  | { actor: NgoAdminContext; error?: undefined }
> {
  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) {
    return { error: NextResponse.json({ error: 'Token gerekli' }, { status: 401 }) };
  }

  let decoded: { uid: string; email?: string; role?: string };
  try {
    decoded = (await getAdminAuth().verifyIdToken(token)) as typeof decoded;
  } catch {
    return { error: NextResponse.json({ error: 'Geçersiz token' }, { status: 401 }) };
  }

  const email = decoded.email ?? null;
  const allowSuperAdmin = options?.allowSuperAdmin ?? true;

  const userSnap = await getAdminFirestore().collection(COLLECTIONS.users).doc(decoded.uid).get();
  const userData = userSnap.exists ? (userSnap.data() as { role?: string; managedNgoId?: string }) : null;

  // Primary check: custom claim. Fallback to users/{uid}.role for transition.
  // TODO(P0-4b): remove userData.role fallback once all super-admins have custom claims.
  const isSuperAdmin =
    decoded.role === 'super-admin' || userData?.role === 'super-admin';

  if (isSuperAdmin && allowSuperAdmin) {
    const ngoId = options?.targetNgoId ?? userData?.managedNgoId ?? '';
    if (!ngoId) {
      return {
        error: NextResponse.json({ error: 'targetNgoId gerekli (super-admin için)' }, { status: 400 }),
      };
    }
    return { actor: { uid: decoded.uid, email, ngoId, isSuperAdmin: true } };
  }

  if (userData?.role !== 'ngo-admin' || !userData.managedNgoId) {
    return { error: NextResponse.json({ error: 'NGO admin yetkisi yok' }, { status: 403 }) };
  }

  return { actor: { uid: decoded.uid, email, ngoId: userData.managedNgoId, isSuperAdmin: false } };
}
