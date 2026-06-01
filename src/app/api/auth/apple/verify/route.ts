/**
 * POST /api/auth/apple/verify
 *
 * Body: {
 *   identityToken: string,    // Apple identity JWT (from native plugin)
 *   nonce: string,            // raw nonce client passed (SHA256 in JWT)
 *   email?: string,           // only present on FIRST sign-in
 *   fullName?: { givenName?, familyName? }  // only on FIRST sign-in
 * }
 *
 * Davranış:
 * 1. Apple JWKS'inden public key çek + identity token doğrula
 * 2. iss + aud (bundle id) + exp + nonce kontrol et
 * 3. Apple sub (kullanıcı id) ile Firebase user bul/oluştur
 *    - Provider: 'apple.com', uid: 'apple:<sub>'
 *    - users/{uid} doc'una name + email (varsa) yaz
 * 4. Custom token üret → client signInWithCustomToken ile oturum açar
 * 5. { ok: true, customToken, isNewUser } dön
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { FieldValue } from 'firebase-admin/firestore';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import crypto from 'crypto';

export const runtime = 'nodejs';

const APPLE_BUNDLE_ID = 'com.hangel.ios.app';
const APPLE_ISSUER = 'https://appleid.apple.com';

const jwks = jwksClient({
  jwksUri: 'https://appleid.apple.com/auth/keys',
  cache: true,
  cacheMaxAge: 60 * 60 * 1000, // 1 saat
});

function getSigningKey(kid: string): Promise<string> {
  return new Promise((resolve, reject) => {
    jwks.getSigningKey(kid, (err, key) => {
      if (err || !key) return reject(err || new Error('no key'));
      resolve(key.getPublicKey());
    });
  });
}

interface AppleIdTokenPayload {
  iss: string;
  aud: string;
  exp: number;
  iat: number;
  sub: string; // unique apple user id (stable)
  email?: string;
  email_verified?: boolean | string;
  nonce?: string; // sha256 hex of raw nonce client sent
  is_private_email?: boolean | string;
}

async function verifyAppleIdentityToken(token: string, expectedNonce: string): Promise<AppleIdTokenPayload> {
  const decoded = jwt.decode(token, { complete: true });
  if (!decoded || typeof decoded === 'string' || !decoded.header.kid) {
    throw new Error('Invalid token format');
  }
  const publicKey = await getSigningKey(decoded.header.kid);

  const payload = jwt.verify(token, publicKey, {
    algorithms: ['RS256'],
    issuer: APPLE_ISSUER,
    audience: APPLE_BUNDLE_ID,
  }) as AppleIdTokenPayload;

  // Nonce check (client sent raw nonce; Apple stores SHA256)
  const expectedHash = crypto.createHash('sha256').update(expectedNonce).digest('hex');
  if (payload.nonce && payload.nonce !== expectedHash) {
    throw new Error('Nonce mismatch');
  }

  return payload;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const identityToken = typeof body?.identityToken === 'string' ? body.identityToken : '';
    const nonce = typeof body?.nonce === 'string' ? body.nonce : '';
    const email = typeof body?.email === 'string' ? body.email : null;
    const fullName = body?.fullName && typeof body.fullName === 'object' ? body.fullName : null;

    if (!identityToken || !nonce) {
      return NextResponse.json(
        { ok: false, errorCode: 'INVALID_INPUT', message: 'identityToken ve nonce gerekli.' },
        { status: 400 },
      );
    }

    let payload: AppleIdTokenPayload;
    try {
      payload = await verifyAppleIdentityToken(identityToken, nonce);
    } catch (e) {
      return NextResponse.json(
        { ok: false, errorCode: 'TOKEN_INVALID', message: 'Apple kimlik doğrulaması başarısız.' },
        { status: 401 },
      );
    }

    const auth = getAdminAuth();
    const db = getAdminFirestore();
    const appleSub = payload.sub;
    const uid = `apple_${appleSub.slice(0, 28)}`; // Firebase uid max 128 char, prefix Apple
    const finalEmail = email || payload.email || null;

    let isNewUser = false;
    try {
      await auth.getUser(uid);
    } catch (e) {
      // Create new user
      isNewUser = true;
      await auth.createUser({
        uid,
        email: finalEmail || undefined,
        emailVerified: payload.email_verified === true || payload.email_verified === 'true',
        displayName: fullName?.givenName ? `${fullName.givenName} ${fullName.familyName || ''}`.trim() : undefined,
      });
    }

    // Upsert users/{uid} Firestore doc
    const userRef = db.collection(COLLECTIONS.users).doc(uid);
    const now = FieldValue.serverTimestamp();
    const userData: Record<string, unknown> = {
      lastSignInAt: now,
      authProvider: 'apple.com',
      appleSub,
    };
    if (isNewUser) {
      userData.createdAt = now;
      if (finalEmail) userData.email = finalEmail;
      if (fullName?.givenName) {
        userData.name = `${fullName.givenName} ${fullName.familyName || ''}`.trim();
        userData.firstName = fullName.givenName;
        if (fullName.familyName) userData.lastName = fullName.familyName;
      }
    }
    await userRef.set(userData, { merge: true });

    const customToken = await auth.createCustomToken(uid, { provider: 'apple.com' });

    return NextResponse.json({ ok: true, customToken, isNewUser, uid });
  } catch (e) {
    console.error('[apple-verify] error:', e);
    return NextResponse.json(
      { ok: false, errorCode: 'INTERNAL', message: 'Sunucu hatası.' },
      { status: 500 },
    );
  }
}
