/**
 * POST /api/ngo-admin/mail/connect — STK Workspace SMTP hesabını bağla.
 *
 * Kimlik formu POST'u (Ads OAuth popup'ı DEĞİL): {fromEmail, fromName, smtpHost,
 * smtpPort, smtpUser, smtpPassword}. App Password (smtpPassword) AES-256-GCM ile
 * şifrelenip mailAccounts/{ngoId}.smtpPasswordEnc'e yazılır — plaintext ASLA.
 *
 * Yetki: requireNgoAdmin scope 'messaging'.
 * - Şifreleme anahtarı yoksa 503 MAIL_NOT_CONFIGURED.
 * - Süper-admin gate kapalıysa 403 MAIL_FEATURE_DISABLED.
 *
 * Hata: { errorCode, message }. secret loglanmaz.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireNgoAdmin } from '@/lib/messaging/server-auth';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { isMailConfigured, encryptMailSecret } from '@/lib/mail/credential-crypto';

export const runtime = 'nodejs';

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

export async function POST(req: NextRequest) {
  const auth = await requireNgoAdmin(req, { scope: 'messaging' });
  if ('error' in auth) return auth.error;
  const { actor } = auth;

  if (!isMailConfigured()) {
    return NextResponse.json(
      { errorCode: 'MAIL_NOT_CONFIGURED', message: 'Toplu mail şifreleme anahtarı yapılandırılmamış.' },
      { status: 503 },
    );
  }

  const db = getAdminFirestore();

  // Süper-admin gate.
  const ngoSnap = await db.collection(COLLECTIONS.ngos).doc(actor.ngoId).get().catch(() => null);
  const ngoData = ngoSnap?.exists ? (ngoSnap.data() as Record<string, unknown> | undefined) : undefined;
  const featureFlags = (ngoData?.featureFlags ?? undefined) as { bulkMailEnabled?: unknown } | undefined;
  if (featureFlags?.bulkMailEnabled !== true) {
    return NextResponse.json(
      { errorCode: 'MAIL_FEATURE_DISABLED', message: 'Toplu mail özelliği bu kurum için açık değil.' },
      { status: 403 },
    );
  }

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) {
    return NextResponse.json({ errorCode: 'BAD_JSON', message: 'Geçersiz istek.' }, { status: 400 });
  }

  const fromEmail = str(body.fromEmail);
  const fromName = str(body.fromName);
  const smtpHost = str(body.smtpHost);
  const smtpPortRaw = body.smtpPort;
  const smtpUser = str(body.smtpUser);
  const smtpPassword = typeof body.smtpPassword === 'string' ? body.smtpPassword : '';

  const smtpPort = typeof smtpPortRaw === 'number' ? smtpPortRaw : Number(smtpPortRaw);

  if (!fromEmail || !fromName || !smtpHost || !smtpUser || !smtpPassword || !Number.isFinite(smtpPort) || smtpPort <= 0) {
    return NextResponse.json({ errorCode: 'MISSING', message: 'SMTP bilgileri eksik.' }, { status: 400 });
  }

  const smtpSecure = smtpPort === 465;

  const smtpPasswordEnc = encryptMailSecret(smtpPassword);
  if (!smtpPasswordEnc) {
    return NextResponse.json(
      { errorCode: 'ENCRYPT_FAILED', message: 'Kimlik bilgisi güvenli şekilde kaydedilemedi.' },
      { status: 500 },
    );
  }

  await db
    .collection(COLLECTIONS.mailAccounts)
    .doc(actor.ngoId)
    .set(
      {
        ngoId: actor.ngoId,
        fromEmail,
        fromName,
        smtpHost,
        smtpPort,
        smtpSecure,
        smtpUser,
        smtpPasswordEnc,
        connectedBy: actor.uid,
        connectedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

  return NextResponse.json({ ok: true, connected: true, fromEmail });
}
