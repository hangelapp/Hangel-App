/**
 * POST /api/auth/passkey/register/options
 * Girişli kullanıcı için passkey KAYIT seçenekleri üretir (challenge dahil).
 * Auth: Bearer <Firebase idToken>. Yanıt: { options, challengeId }.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { generateRegistrationOptions, saveChallenge, RP_ID, RP_NAME } from '@/lib/webauthn';

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
    const db = getAdminFirestore();
    const user = await getAdminAuth().getUser(uid).catch(() => null);
    // Aynı cihazın mükerrer kaydını engelle (bu kullanıcının mevcut passkey'leri).
    const existing = await db.collection('passkeys').where('uid', '==', uid).get();
    const excludeCredentials = existing.docs.map((d) => ({
      id: d.id,
      transports: (d.data() as { transports?: AuthenticatorTransport[] }).transports || undefined,
    }));

    const options = await generateRegistrationOptions({
      rpName: RP_NAME,
      rpID: RP_ID,
      userID: new TextEncoder().encode(uid),
      userName: user?.phoneNumber || user?.email || `hangel-${uid.slice(0, 6)}`,
      userDisplayName: user?.displayName || 'hangel Üyesi',
      attestationType: 'none',
      excludeCredentials,
      authenticatorSelection: { residentKey: 'preferred', userVerification: 'preferred' },
    });

    const challengeId = await saveChallenge(options.challenge, uid);
    return NextResponse.json({ options, challengeId });
  } catch (err) {
    console.error('passkey/register/options error', err);
    return NextResponse.json({ errorCode: 'INTERNAL_ERROR', message: 'Seçenekler üretilemedi.' }, { status: 500 });
  }
}
