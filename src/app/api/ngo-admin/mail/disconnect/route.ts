/**
 * POST /api/ngo-admin/mail/disconnect — STK Workspace SMTP hesabını kaldır.
 *
 * mailAccounts/{ngoId} doc'unu siler. Yetki: requireNgoAdmin scope 'messaging'.
 *
 * Hata: { errorCode, message }.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireNgoAdmin } from '@/lib/messaging/server-auth';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const auth = await requireNgoAdmin(req, { scope: 'messaging' });
  if ('error' in auth) return auth.error;
  const { actor } = auth;

  const db = getAdminFirestore();
  await db.collection(COLLECTIONS.mailAccounts).doc(actor.ngoId).delete();

  return NextResponse.json({ ok: true, connected: false });
}
