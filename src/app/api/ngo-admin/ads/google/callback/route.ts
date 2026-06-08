/**
 * Google Ads bağlama — OAuth callback (Faz 1).
 *
 *   GET /api/ngo-admin/ads/google/callback?code=&state=
 *
 * Google consent sonrası vurulur. JSON DEĞİL, HTML sayfa döner; opener'a
 * postMessage ile sonucu bildirip pencereyi kapatır (contacts callback deseni).
 *
 * Güvenlik:
 *  - `state` üç şekilde doğrulanır: HMAC-SHA256 (constant-time), exp penceresi,
 *    httpOnly OAUTH_STATE_COOKIE'ye karşı double-submit.
 *  - ngoId, state'ten DEĞİL; start route'ta yazılan ikinci imzalı cookie
 *    (ADS_OAUTH_NGO_COOKIE) verifyState ile çözülür. (Burada Firebase header
 *    yok, requireNgoAdmin kullanılamaz.)
 *  - refreshToken yalnız Admin SDK ile adAccounts/{ngoId}'ye yazılır; asla
 *    loglanmaz, asla client'a dönmez.
 *  - Her hata yolu generic Türkçe HTML döner — stack/secret/provider sızmaz.
 */

import { type NextRequest } from 'next/server';
import {
  publicOrigin,
  statesMatch,
  verifyState,
  OAUTH_STATE_COOKIE,
} from '@/lib/contacts/oauth';
import {
  exchangeCodeForTokens,
  getGoogleAdsConfig,
  listAccessibleCustomers,
} from '@/lib/ads/google-ads';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { ADS_OAUTH_NGO_COOKIE } from '../start/route';

export const runtime = 'nodejs';

/**
 * Escape a value so it can be safely embedded inside an inline <script>.
 * Input is always JSON.stringify output; only script-context-significant chars
 * (and U+2028 / U+2029) are neutralised.
 */
function escapeForScript(json: string): string {
  const LS = String.fromCharCode(0x2028);
  const PS = String.fromCharCode(0x2029);
  const re = new RegExp('[<>&' + LS + PS + ']', 'g');
  const map: Record<string, string> = {
    '<': '\\u003c',
    '>': '\\u003e',
    '&': '\\u0026',
    [LS]: '\\u2028',
    [PS]: '\\u2029',
  };
  return json.replace(re, (ch) => map[ch] ?? ch);
}

function htmlResponse(body: string, init?: { status?: number; clearCookies?: boolean }): Response {
  const headers = new Headers({
    'content-type': 'text/html; charset=utf-8',
    'cache-control': 'no-store',
  });
  if (init?.clearCookies) {
    headers.append(
      'set-cookie',
      `${OAUTH_STATE_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`
    );
    headers.append(
      'set-cookie',
      `${ADS_OAUTH_NGO_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`
    );
  }
  return new Response(body, { status: init?.status ?? 200, headers });
}

function successPage(): string {
  return `<!doctype html>
<html lang="tr"><head><meta charset="utf-8"><title>Google Ads bağlandı</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>body{font-family:system-ui,-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;color:#1f2937;background:#f9fafb}main{text-align:center;padding:24px;max-width:360px}</style>
</head><body><main>
<p style="font-size:15px;line-height:1.5">Google Ads hesabı bağlandı, bu pencereyi kapatabilirsiniz.</p>
</main>
<script>
(function(){
  try {
    if (window.opener) {
      window.opener.postMessage({ type: 'hangel-ads-connected' }, window.location.origin);
      window.close();
    }
  } catch (e) {}
})();
</script>
</body></html>`;
}

function errorPage(message: string): string {
  const msg = escapeForScript(JSON.stringify(message));
  return `<!doctype html>
<html lang="tr"><head><meta charset="utf-8"><title>Bağlantı başarısız</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>body{font-family:system-ui,-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;color:#1f2937;background:#f9fafb}main{text-align:center;padding:24px;max-width:360px}h1{font-size:17px;margin:0 0 8px}p{font-size:14px;color:#6b7280;line-height:1.5;margin:0}</style>
</head><body><main>
<h1>Bağlantı başarısız</h1>
<p>Google Ads hesabı bağlanamadı. Bu pencereyi kapatıp tekrar deneyebilirsiniz.</p>
</main>
<script>
(function(){
  try {
    if (window.opener) {
      window.opener.postMessage({ type: 'hangel-ads-error', message: ${msg} }, window.location.origin);
    }
  } catch (e) {}
})();
</script>
</body></html>`;
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code') ?? '';
  const state = req.nextUrl.searchParams.get('state') ?? '';
  const cookieState = req.cookies.get(OAUTH_STATE_COOKIE)?.value ?? '';
  const ngoCookie = req.cookies.get(ADS_OAUTH_NGO_COOKIE)?.value ?? '';

  // --- State: signature + exp + double-submit cookie. ---
  const decoded = verifyState(state);
  if (!decoded || !cookieState || !statesMatch(state, cookieState)) {
    return htmlResponse(errorPage('invalid_state'), { status: 400, clearCookies: true });
  }
  if (!code) {
    return htmlResponse(errorPage('missing_code'), { status: 400, clearCookies: true });
  }

  // --- ngoId from the second signed cookie (verifyState reuses uid field). ---
  const ngoDecoded = verifyState(ngoCookie);
  const ngoId = ngoDecoded?.uid ?? '';
  if (!ngoId) {
    return htmlResponse(errorPage('invalid_state'), { status: 400, clearCookies: true });
  }
  const uid = decoded.uid;

  const config = getGoogleAdsConfig();
  if (!config) {
    return htmlResponse(errorPage('not_configured'), { status: 503, clearCookies: true });
  }

  try {
    const origin =
      publicOrigin(
        req.headers.get('x-forwarded-host'),
        req.headers.get('host'),
        req.headers.get('x-forwarded-proto')
      ) ?? req.nextUrl.origin;
    const redirectUri = `${origin}/api/ngo-admin/ads/google/callback`;

    const tokens = await exchangeCodeForTokens(config, code, redirectUri);
    if (!tokens?.refreshToken) {
      // Without a refresh token we cannot operate later — treat as failure.
      return htmlResponse(errorPage('token_exchange_failed'), { status: 502, clearCookies: true });
    }

    // Best-effort: resolve the first accessible customer id (non-fatal).
    let customerId: string | undefined;
    if (tokens.accessToken) {
      const customers = await listAccessibleCustomers(tokens.accessToken, config);
      customerId = customers[0];
    }

    const db = getAdminFirestore();
    const docData: Record<string, unknown> = {
      ngoId,
      refreshToken: tokens.refreshToken,
      scope: 'adwords',
      connectedBy: uid,
      connectedAt: FieldValue.serverTimestamp(),
    };
    if (customerId) docData.customerId = customerId;

    await db.collection(COLLECTIONS.adAccounts).doc(ngoId).set(docData, { merge: true });

    return htmlResponse(successPage(), { clearCookies: true });
  } catch {
    return htmlResponse(errorPage('connect_failed'), { status: 500, clearCookies: true });
  }
}
