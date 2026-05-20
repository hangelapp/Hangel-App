/**
 * Email contact-import — OAuth start (PDF-13b).
 *
 *   POST /api/contacts/[provider]/start   (provider ∈ 'google' | 'microsoft')
 *
 * Authenticated kickoff for the contact-import popup flow. Verifies the caller's
 * Firebase ID token, mints a signed, time-boxed `state` (CSRF), sets a matching
 * httpOnly double-submit cookie, and returns the provider authorize URL. The
 * popup navigates there; the provider redirects back to the sibling `callback`
 * route.
 *
 * Error response shape: `{ errorCode, message }`. No raw error / secret leakage.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { getAdminAuth } from '@/lib/firebase-admin';
import {
  buildAuthorizeUrl,
  getProviderConfig,
  isContactProvider,
  signState,
  OAUTH_STATE_COOKIE,
  OAUTH_STATE_COOKIE_MAX_AGE,
} from '@/lib/contacts/oauth';

export const runtime = 'nodejs';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;

  if (!isContactProvider(provider)) {
    return NextResponse.json(
      { errorCode: 'UNSUPPORTED_PROVIDER', message: 'Desteklenmeyen sağlayıcı.' },
      { status: 400 }
    );
  }

  // --- Auth: require a valid Firebase ID token ---
  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) {
    return NextResponse.json(
      { errorCode: 'UNAUTHENTICATED', message: 'Oturum açmanız gerekiyor.' },
      { status: 401 }
    );
  }

  let uid: string;
  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    uid = decoded.uid;
  } catch {
    return NextResponse.json(
      { errorCode: 'UNAUTHENTICATED', message: 'Oturum doğrulanamadı.' },
      { status: 401 }
    );
  }

  // --- Provider config (env). Missing → friendly 503, no config leakage. ---
  const config = getProviderConfig(provider);
  if (!config) {
    return NextResponse.json(
      {
        errorCode: 'OAUTH_NOT_CONFIGURED',
        message: 'E-posta sağlayıcı bağlantısı henüz yapılandırılmadı.',
      },
      { status: 503 }
    );
  }

  // --- Signed, time-boxed state (also needs OAUTH_STATE_SECRET). ---
  const state = signState(uid);
  if (!state) {
    return NextResponse.json(
      {
        errorCode: 'OAUTH_NOT_CONFIGURED',
        message: 'E-posta sağlayıcı bağlantısı henüz yapılandırılmadı.',
      },
      { status: 503 }
    );
  }

  const redirectUri = `${req.nextUrl.origin}/api/contacts/${provider}/callback`;
  const authorizeUrl = buildAuthorizeUrl(provider, config, redirectUri, state);

  const res = NextResponse.json({ authorizeUrl });
  // Double-submit cookie: callback verifies the state matches this cookie.
  res.cookies.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: OAUTH_STATE_COOKIE_MAX_AGE,
  });
  return res;
}
