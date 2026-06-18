/**
 * POST /api/super-admin/mail/disconnect — hangel platform Workspace SMTP bağlantısını kaldır.
 * mailAccounts/__platform doc'unu siler. Yetki: yalnız super-admin.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireNgoAdmin } from '@/lib/messaging/server-auth';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';

export const runtime = 'nodejs';

const PLATFORM_MAIL_ID = '__platform';

export async function POST(req: NextRequest) {
  const auth = await requireNgoAdmin(req, { targetNgoId: PLATFORM_MAIL_ID, allowSuperAdmin: true });
  if ('error' in auth) return auth.error;
  if (!auth.actor.isSuperAdmin) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Super-admin yetkisi gerekli.' }, { status: 403 });
  }

  await getAdminFirestore().collection(COLLECTIONS.mailAccounts).doc(PLATFORM_MAIL_ID).delete().catch(() => null);
  return NextResponse.json({ ok: true, connected: false });
}
