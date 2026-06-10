/**
 * TikTok (TikTok for Business) Ads bağlama — OAuth start (Faz 1).
 *
 *   POST /api/ngo-admin/ads/tiktok/start
 *
 * STK admin panelinden TikTok reklam hesabı bağlama akışının kickoff'u. Yetki
 * `requireNgoAdmin` scope 'ads' ile zorlanır. Config eksikse nazik 503
 * `TIKTOK_NOT_CONFIGURED` döner (Meta Ads start route deseninin aynısı).
 *
 * İki imzalı, time-boxed cookie yazılır:
 *  - OAUTH_STATE_COOKIE (uid taşır)      → callback double-submit + uid çözümü
 *  - TIKTOK_OAUTH_NGO_COOKIE (ngoId)     → callback'te ngoId'yi güvenle çözmek için
 *    (callback'te Firebase header yok, requireNgoAdmin kullanılamaz).
 *
 * Hata: { errorCode, message }. Raw error / secret sızdırmaz.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { requireNgoAdmin } from '@/lib/messaging/server-auth';
import {
  publicOrigin,
  signState,
  OAUTH_STATE_COOKIE,
  OAUTH_STATE_COOKIE_MAX_AGE,
} from '@/lib/contacts/oauth';
import {
  buildTiktokAuthorizeUrl,
  getTiktokConfig,
  isTiktokConfigured,
  TIKTOK_OAUTH_NGO_COOKIE,
} from '@/lib/ads/tiktok-ads';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const auth = await requireNgoAdmin(req, { scope: 'ads' });
  if ('error' in auth) return auth.error;
  const { actor } = auth;

  if (!isTiktokConfigured()) {
    return NextResponse.json(
      {
        errorCode: 'TIKTOK_NOT_CONFIGURED',
        message: 'TikTok reklam bağlantısı henüz yapılandırılmadı.',
      },
      { status: 503 }
    );
  }
  const config = getTiktokConfig();
  if (!config) {
    return NextResponse.json(
      {
        errorCode: 'TIKTOK_NOT_CONFIGURED',
        message: 'TikTok reklam bağlantısı henüz yapılandırılmadı.',
      },
      { status: 503 }
    );
  }

  // Signed, time-boxed state (uid) + ngo cookie (ngoId). Both need OAUTH_STATE_SECRET.
  const state = signState(actor.uid);
  const ngoCookie = signState(actor.ngoId);
  if (!state || !ngoCookie) {
    return NextResponse.json(
      {
        errorCode: 'TIKTOK_NOT_CONFIGURED',
        message: 'TikTok reklam bağlantısı henüz yapılandırılmadı.',
      },
      { status: 503 }
    );
  }

  const origin =
    publicOrigin(
      req.headers.get('x-forwarded-host'),
      req.headers.get('host'),
      req.headers.get('x-forwarded-proto')
    ) ?? req.nextUrl.origin;
  const redirectUri = `${origin}/api/ngo-admin/ads/tiktok/callback`;
  const authorizeUrl = buildTiktokAuthorizeUrl(config.appId, redirectUri, state);

  const res = NextResponse.json({ authorizeUrl });
  res.cookies.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: OAUTH_STATE_COOKIE_MAX_AGE,
  });
  res.cookies.set(TIKTOK_OAUTH_NGO_COOKIE, ngoCookie, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: OAUTH_STATE_COOKIE_MAX_AGE,
  });
  return res;
}
