/**
 * POST /api/super-admin/mail/connect — hangel platform Workspace SMTP hesabını bağla.
 *
 * Kimlik formu: {fromEmail, fromName, smtpHost, smtpPort, smtpPassword}. App Password
 * AES-256-GCM ile şifrelenip mailAccounts/__platform.smtpPasswordEnc'e yazılır —
 * plaintext ASLA. smtpUser = fromEmail.
 *
 * Yetki: yalnız super-admin. Anahtar yoksa 503 MAIL_NOT_CONFIGURED.
 * Hata: { errorCode, message }; secret loglanmaz.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireNgoAdmin } from '@/lib/messaging/server-auth';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { isMailConfigured, encryptMailSecret } from '@/lib/mail/credential-crypto';

export const runtime = 'nodejs';

const PLATFORM_MAIL_ID = '__platform';
const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

export async function POST(req: NextRequest) {
  const auth = await requireNgoAdmin(req, { targetNgoId: PLATFORM_MAIL_ID, allowSuperAdmin: true });
  if ('error' in auth) return auth.error;
  if (!auth.actor.isSuperAdmin) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Super-admin yetkisi gerekli.' }, { status: 403 });
  }

  if (!isMailConfigured()) {
    return NextResponse.json(
      { errorCode: 'MAIL_NOT_CONFIGURED', message: 'Toplu mail şifreleme anahtarı yapılandırılmamış.' },
      { status: 503 },
    );
  }

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) {
    return NextResponse.json({ errorCode: 'BAD_JSON', message: 'Geçersiz istek.' }, { status: 400 });
  }

  const fromEmail = str(body.fromEmail);
  const fromName = str(body.fromName);
  const smtpHost = str(body.smtpHost);
  const smtpPort = typeof body.smtpPort === 'number' ? body.smtpPort : Number(body.smtpPort);
  const smtpPassword = typeof body.smtpPassword === 'string' ? body.smtpPassword : '';

  if (!fromEmail || !fromName || !smtpHost || !smtpPassword || !Number.isFinite(smtpPort) || smtpPort <= 0) {
    return NextResponse.json({ errorCode: 'MISSING', message: 'SMTP bilgileri eksik.' }, { status: 400 });
  }

  const smtpPasswordEnc = encryptMailSecret(smtpPassword);
  if (!smtpPasswordEnc) {
    return NextResponse.json(
      { errorCode: 'ENCRYPT_FAILED', message: 'Kimlik bilgisi güvenli şekilde kaydedilemedi.' },
      { status: 500 },
    );
  }

  await getAdminFirestore()
    .collection(COLLECTIONS.mailAccounts)
    .doc(PLATFORM_MAIL_ID)
    .set(
      {
        ngoId: PLATFORM_MAIL_ID,
        fromEmail,
        fromName,
        smtpHost,
        smtpPort,
        smtpSecure: smtpPort === 465,
        smtpUser: fromEmail,
        smtpPasswordEnc,
        connectedBy: auth.actor.uid,
        connectedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

  return NextResponse.json({ ok: true, connected: true, fromEmail });
}
