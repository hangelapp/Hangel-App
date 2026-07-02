/**
 * POST /api/auth/passkey/authenticate/options
 * Passkey ile GİRİŞ seçenekleri üretir (discoverable — allowCredentials boş, tarayıcı
 * bu site için kayıtlı tüm passkey'leri gösterir). Auth GEREKMEZ. Yanıt: { options, challengeId }.
 */
import { NextResponse } from 'next/server';
import { generateAuthenticationOptions, saveChallenge, RP_ID } from '@/lib/webauthn';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const options = await generateAuthenticationOptions({
      rpID: RP_ID,
      userVerification: 'preferred',
      allowCredentials: [],
    });
    const challengeId = await saveChallenge(options.challenge);
    return NextResponse.json({ options, challengeId });
  } catch (err) {
    console.error('passkey/authenticate/options error', err);
    return NextResponse.json({ errorCode: 'INTERNAL_ERROR', message: 'Seçenekler üretilemedi.' }, { status: 500 });
  }
}
