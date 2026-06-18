/**
 * GET /api/super-admin/mail/connection — hangel platform Workspace SMTP durumu.
 *
 * Per-STK mail özelliğinin platform (super-admin) sürümü: hangel kendi Workspace
 * adresinden outreach datasına toplu mail gönderir. Hesap mailAccounts/__platform
 * doc'unda tutulur. configured = MAIL_CRED_ENC_KEY var mı; connected = doc var mı.
 * Secret ASLA dönmez.
 *
 * Yetki: yalnız super-admin.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireNgoAdmin } from '@/lib/messaging/server-auth';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { isMailConfigured } from '@/lib/mail/credential-crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PLATFORM_MAIL_ID = '__platform';

export async function GET(req: NextRequest) {
  const auth = await requireNgoAdmin(req, { targetNgoId: PLATFORM_MAIL_ID, allowSuperAdmin: true });
  if ('error' in auth) return auth.error;
  if (!auth.actor.isSuperAdmin) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Super-admin yetkisi gerekli.' }, { status: 403 });
  }

  const configured = isMailConfigured();
  const db = getAdminFirestore();
  const snap = await db.collection(COLLECTIONS.mailAccounts).doc(PLATFORM_MAIL_ID).get().catch(() => null);
  const data = snap?.exists ? (snap.data() as { fromEmail?: unknown; signature?: unknown } | undefined) : undefined;
  const fromEmail = typeof data?.fromEmail === 'string' ? data.fromEmail : undefined;
  const connected = !!fromEmail;
  const signature = typeof data?.signature === 'string' ? data.signature : undefined;

  return NextResponse.json({ configured, connected, fromEmail, signature });
}

/** POST — hangel mail imzasını kaydet. */
export async function POST(req: NextRequest) {
  const auth = await requireNgoAdmin(req, { targetNgoId: PLATFORM_MAIL_ID, allowSuperAdmin: true });
  if ('error' in auth) return auth.error;
  if (!auth.actor.isSuperAdmin) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Super-admin yetkisi gerekli.' }, { status: 403 });
  }
  const body = (await req.json().catch(() => null)) as { signature?: unknown } | null;
  const signature = typeof body?.signature === 'string' ? body.signature.slice(0, 2000) : '';
  await getAdminFirestore().collection(COLLECTIONS.mailAccounts).doc(PLATFORM_MAIL_ID).set({ signature }, { merge: true });
  return NextResponse.json({ ok: true });
}
