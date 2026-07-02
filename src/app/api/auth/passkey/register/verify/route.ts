/**
 * POST /api/auth/passkey/register/verify
 * Passkey kayıt yanıtını doğrular ve credential'ı saklar.
 * Auth: Bearer <Firebase idToken>. Gövde: { response, challengeId }.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { verifyRegistrationResponse, takeChallenge, RP_ID, EXPECTED_ORIGINS } from '@/lib/webauthn';
import type { RegistrationResponseJSON } from '@simplewebauthn/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function uidFromReq(req: NextRequest): Promise<string | null> {
  const h = req.headers.get('authorization') || '';
  const t = h.startsWith('Bearer ') ? h.slice(7).trim() : '';
  if (!t) return null;
  try {
    return (await getAdminAuth().verifyIdToken(t)).uid;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const uid = await uidFromReq(req);
  if (!uid) return NextResponse.json({ errorCode: 'UNAUTHENTICATED', message: 'Giriş gerekli.' }, { status: 401 });
  try {
    const { response, challengeId } = (await req.json()) as { response: RegistrationResponseJSON; challengeId: string };
    const ch = await takeChallenge(challengeId);
    if (!ch || ch.uid !== uid) {
      return NextResponse.json({ errorCode: 'INVALID_CHALLENGE', message: 'Oturum süresi doldu, tekrar dene.' }, { status: 400 });
    }

    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: ch.challenge,
      expectedOrigin: EXPECTED_ORIGINS,
      expectedRPID: RP_ID,
    });
    if (!verification.verified || !verification.registrationInfo) {
      return NextResponse.json({ errorCode: 'NOT_VERIFIED', message: 'Passkey doğrulanamadı.' }, { status: 400 });
    }

    const { credential } = verification.registrationInfo;
    await getAdminFirestore().collection('passkeys').doc(credential.id).set({
      uid,
      publicKey: Buffer.from(credential.publicKey).toString('base64url'),
      counter: credential.counter,
      transports: credential.transports || response.response.transports || [],
      createdAt: Date.now(),
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('passkey/register/verify error', err);
    return NextResponse.json({ errorCode: 'INTERNAL_ERROR', message: 'Passkey kaydedilemedi.' }, { status: 500 });
  }
}
