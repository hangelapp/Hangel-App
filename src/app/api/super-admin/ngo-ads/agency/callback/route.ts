/**
 * GET /api/super-admin/ngo-ads/agency/callback?code=&state=
 *
 * hangel MCC ajans OAuth consent dönüşü. JSON DEĞİL, HTML sayfa döner; opener'a
 * postMessage ile sonucu bildirip pencereyi kapatır (ngo callback deseni).
 *
 * Güvenlik:
 *  - state: HMAC-SHA256 (constant-time) + exp + httpOnly OAUTH_STATE_COOKIE
 *    double-submit. (Ajans tek MCC olduğundan ngo cookie yok.)
 *  - refreshToken yalnız Admin SDK ile adAgency/{mcc}'ye yazılır; asla loglanmaz,
 *    asla client'a dönmez.
 *  - Her hata yolu generic Türkçe HTML döner — stack/secret/provider sızmaz.
 */
import { type NextRequest } from 'next/server';
import {
  publicOrigin,
  statesMatch,
  verifyState,
  OAUTH_STATE_COOKIE,
} from '@/lib/contacts/oauth';
import { exchangeCodeForTokens, getGoogleAdsConfig } from '@/lib/ads/google-ads';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/firebase/collections';

export const runtime = 'nodejs';

const MCC_DOC_ID = 'mcc';

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
  }
  return new Response(body, { status: init?.status ?? 200, headers });
}

function successPage(): string {
  return `<!doctype html>
<html lang="tr"><head><meta charset="utf-8"><title>Ajans hesabı bağlandı</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>body{font-family:system-ui,-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;color:#1f2937;background:#f9fafb}main{text-align:center;padding:24px;max-width:360px}</style>
</head><body><main>
<p style="font-size:15px;line-height:1.5">Ajans (MCC) hesabı bağlandı, bu pencereyi kapatabilirsiniz.</p>
</main>
<script>
(function(){
  try {
    if (window.opener) {
      window.opener.postMessage({ type: 'hangel-agency-connected' }, window.location.origin);
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
<p>Ajans hesabı bağlanamadı. Bu pencereyi kapatıp tekrar deneyebilirsiniz.</p>
</main>
<script>
(function(){
  try {
    if (window.opener) {
      window.opener.postMessage({ type: 'hangel-agency-error', message: ${msg} }, window.location.origin);
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

  // --- State: signature + exp + double-submit cookie. ---
  const decoded = verifyState(state);
  if (!decoded || !cookieState || !statesMatch(state, cookieState)) {
    return htmlResponse(errorPage('invalid_state'), { status: 400, clearCookies: true });
  }
  if (!code) {
    return htmlResponse(errorPage('missing_code'), { status: 400, clearCookies: true });
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
    const redirectUri = `${origin}/api/super-admin/ngo-ads/agency/callback`;

    const tokens = await exchangeCodeForTokens(config, code, redirectUri);
    if (!tokens?.refreshToken) {
      return htmlResponse(errorPage('token_exchange_failed'), { status: 502, clearCookies: true });
    }

    const db = getAdminFirestore();
    await db
      .collection(COLLECTIONS.adAgency)
      .doc(MCC_DOC_ID)
      .set(
        {
          refreshToken: tokens.refreshToken,
          scope: 'adwords',
          connectedBy: uid,
          connectedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

    return htmlResponse(successPage(), { clearCookies: true });
  } catch {
    return htmlResponse(errorPage('connect_failed'), { status: 500, clearCookies: true });
  }
}
