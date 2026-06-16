/**
 * POST /api/super-admin/ngo-ads/agency/start — ajans (MCC) OAuth kickoff.
 *
 * hangel ekibi süper-admin panelinden hangel MCC hesabını bağlamak için OAuth
 * akışını başlatır. Tek MCC olduğundan ngoId cookie'sine gerek yok; yalnız
 * imzalı state (uid) yazılır → callback double-submit + connectedBy çözümü.
 *
 * Auth: super-admin. Token bir kez decode edilir (hem yetki hem uid lazım).
 * Config eksikse 503 ADS_NOT_CONFIGURED. Hata: { errorCode, message }.
 * refreshToken bu route'ta yok; secret sızdırılmaz.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import {
  publicOrigin,
  signState,
  OAUTH_STATE_COOKIE,
  OAUTH_STATE_COOKIE_MAX_AGE,
} from '@/lib/contacts/oauth';
import { buildAdsAuthorizeUrl, getGoogleAdsConfig, isAdsConfigured } from '@/lib/ads/google-ads';

export const runtime = 'nodejs';

/**
 * Süper-admin yetkisini doğrula VE uid'yi döndür. performance/route.ts'teki
 * isSuperAdmin deseniyle aynı; tek farkı uid de gerektiğinden uid döner.
 */
async function authorizeSuperAdmin(req: NextRequest): Promise<{ uid: string } | null> {
  const authHeader = req.headers.get('authorization') || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!idToken) return null;
  try {
    const decoded = (await getAdminAuth().verifyIdToken(idToken)) as {
      uid: string;
      role?: string;
      superAdminPermissions?: unknown;
    };
    if (decoded.role === 'super-admin' || !!decoded.superAdminPermissions) {
      return { uid: decoded.uid };
    }
    const snap = await getAdminFirestore().collection(COLLECTIONS.users).doc(decoded.uid).get();
    const d = snap.data();
    if (
      d?.role === 'super-admin' ||
      (Array.isArray(d?.superAdminPermissions) && d.superAdminPermissions.length > 0)
    ) {
      return { uid: decoded.uid };
    }
    return null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const actor = await authorizeSuperAdmin(req);
  if (!actor) {
    return NextResponse.json(
      { errorCode: 'FORBIDDEN', message: 'Super-admin yetkisi gerekli.' },
      { status: 403 }
    );
  }

  const config = getGoogleAdsConfig();
  if (!isAdsConfigured() || !config) {
    return NextResponse.json(
      { errorCode: 'ADS_NOT_CONFIGURED', message: 'Google Ads bağlantısı henüz yapılandırılmadı.' },
      { status: 503 }
    );
  }

  // Signed, time-boxed state taşır actor uid (needs OAUTH_STATE_SECRET).
  const state = signState(actor.uid);
  if (!state) {
    return NextResponse.json(
      { errorCode: 'ADS_NOT_CONFIGURED', message: 'Google Ads bağlantısı henüz yapılandırılmadı.' },
      { status: 503 }
    );
  }

  const origin =
    publicOrigin(
      req.headers.get('x-forwarded-host'),
      req.headers.get('host'),
      req.headers.get('x-forwarded-proto')
    ) ?? req.nextUrl.origin;
  const redirectUri = `${origin}/api/super-admin/ngo-ads/agency/callback`;
  const authorizeUrl = buildAdsAuthorizeUrl(config.clientId, redirectUri, state);

  const res = NextResponse.json({ authorizeUrl });
  res.cookies.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: OAUTH_STATE_COOKIE_MAX_AGE,
  });
  return res;
}
