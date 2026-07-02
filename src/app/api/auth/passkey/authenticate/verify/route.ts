/**
 * POST /api/auth/passkey/authenticate/verify
 * Passkey giriş yanıtını doğrular, credential'ı bulur, sahibine Firebase custom
 * token üretir (client signInWithCustomToken ile giriş yapar). Gövde: { response, challengeId }.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { verifyAuthenticationResponse, takeChallenge, RP_ID, EXPECTED_ORIGINS } from '@/lib/webauthn';
import type { AuthenticationResponseJSON } from '@simplewebauthn/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { response, challengeId } = (await req.json()) as { response: AuthenticationResponseJSON; challengeId: string };
    const ch = await takeChallenge(challengeId);
    if (!ch) {
      return NextResponse.json({ errorCode: 'INVALID_CHALLENGE', message: 'Oturum süresi doldu, tekrar dene.' }, { status: 400 });
    }

    const db = getAdminFirestore();
    const credId = response.id; // base64url credential id
    const snap = await db.collection('passkeys').doc(credId).get();
    if (!snap.exists) {
      return NextResponse.json({ errorCode: 'UNKNOWN_CREDENTIAL', message: 'Bu passkey tanınmıyor.' }, { status: 400 });
    }
    const cred = snap.data() as { uid: string; publicKey: string; counter: number; transports?: AuthenticatorTransport[] };

    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: ch.challenge,
      expectedOrigin: EXPECTED_ORIGINS,
      expectedRPID: RP_ID,
      credential: {
        id: credId,
        publicKey: new Uint8Array(Buffer.from(cred.publicKey, 'base64url')),
        counter: cred.counter || 0,
        transports: cred.transports,
      },
    });
    if (!verification.verified) {
      return NextResponse.json({ errorCode: 'NOT_VERIFIED', message: 'Passkey doğrulanamadı.' }, { status: 400 });
    }

    // Sayaç güncelle (replay koruması) — best-effort.
    await snap.ref.update({ counter: verification.authenticationInfo.newCounter, lastUsedAt: Date.now() }).catch(() => undefined);

    // Kullanıcı rolünü custom token'a koy (mevcut akışlarla tutarlı).
    const userDoc = await db.collection('users').doc(cred.uid).get().catch(() => null);
    const role = (userDoc?.data() as { role?: string } | undefined)?.role;
    const customToken = await getAdminAuth().createCustomToken(cred.uid, role ? { role } : undefined);
    return NextResponse.json({ customToken });
  } catch (err) {
    console.error('passkey/authenticate/verify error', err);
    return NextResponse.json({ errorCode: 'INTERNAL_ERROR', message: 'Passkey ile giriş başarısız.' }, { status: 500 });
  }
}
