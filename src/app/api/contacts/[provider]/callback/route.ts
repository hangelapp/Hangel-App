/**
 * Email contact-import — OAuth callback (PDF-13b).
 *
 *   GET /api/contacts/[provider]/callback?code=&state=
 *
 * Hit by the OAuth provider after consent. Returns an HTML page (NOT JSON) that
 * postMessages the imported contacts back to the opener window, then closes.
 *
 * Security:
 *  - `state` is verified three ways: HMAC-SHA256 (constant-time), `exp` window,
 *    and a double-submit match against the httpOnly `oauth_state` cookie.
 *  - The access token lives only inside this request: it is exchanged, used to
 *    fetch contacts, and discarded. It is never persisted, logged, or returned.
 *  - The contacts JSON is escaped before being embedded into the inline script
 *    (`<`/`>`/`&`/U+2028/U+2029 break) to prevent breakout/XSS.
 *  - postMessage targetOrigin is the page's own origin (not `*`).
 *  - Every error path renders a generic Turkish HTML page that postMessages an
 *    error — no stack/secret/provider detail leaks to the client.
 */

import { type NextRequest } from 'next/server';
import {
  getProviderConfig,
  isContactProvider,
  mapGooglePerson,
  mapGraphContact,
  normalizeContacts,
  publicOrigin,
  statesMatch,
  verifyState,
  OAUTH_STATE_COOKIE,
  type ContactProvider,
  type GoogleConnectionsPage,
  type GraphContactsPage,
  type NormalizedContact,
  type ProviderConfig,
} from '@/lib/contacts/oauth';

export const runtime = 'nodejs';

const GOOGLE_MAX_PAGES = 3;

/**
 * Escape a value so it can be safely embedded inside an inline <script>.
 * Handles `<`, `>`, `&` (HTML/script-context breakout) and the JS line/paragraph
 * separators U+2028 / U+2029 (valid in JSON strings but illegal in JS source).
 * The input is always `JSON.stringify(...)` output, so backslashes are already
 * escaped by JSON — we only neutralise the script-context-significant chars.
 */
function escapeForScript(json: string): string {
  // U+2028 / U+2029 are valid in JSON strings but break JS source if emitted
  // raw inside a <script>. Build the matcher from char codes to keep this file
  // free of literal line/paragraph-separator characters.
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

function htmlResponse(body: string, init?: { status?: number; clearCookie?: boolean }): Response {
  const headers = new Headers({
    'content-type': 'text/html; charset=utf-8',
    'cache-control': 'no-store',
  });
  if (init?.clearCookie) {
    // Expire the double-submit cookie.
    headers.append(
      'set-cookie',
      `${OAUTH_STATE_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`
    );
  }
  return new Response(body, { status: init?.status ?? 200, headers });
}

function successPage(provider: ContactProvider, contacts: NormalizedContact[]): string {
  const payload = escapeForScript(JSON.stringify(contacts));
  const providerJson = escapeForScript(JSON.stringify(provider));
  return `<!doctype html>
<html lang="tr"><head><meta charset="utf-8"><title>Kişiler içe aktarıldı</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>body{font-family:system-ui,-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;color:#1f2937;background:#f9fafb}main{text-align:center;padding:24px;max-width:360px}</style>
</head><body><main>
<p style="font-size:15px;line-height:1.5">Kişiler içe aktarıldı, bu pencereyi kapatabilirsiniz.</p>
</main>
<script>
(function(){
  var contacts = ${payload};
  var provider = ${providerJson};
  try {
    if (window.opener) {
      window.opener.postMessage({ type: 'hangel-contacts', provider: provider, contacts: contacts }, window.location.origin);
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
<html lang="tr"><head><meta charset="utf-8"><title>Doğrulama başarısız</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>body{font-family:system-ui,-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;color:#1f2937;background:#f9fafb}main{text-align:center;padding:24px;max-width:360px}h1{font-size:17px;margin:0 0 8px}p{font-size:14px;color:#6b7280;line-height:1.5;margin:0}</style>
</head><body><main>
<h1>Doğrulama başarısız</h1>
<p>Kişiler içe aktarılamadı. Bu pencereyi kapatıp tekrar deneyebilirsiniz.</p>
</main>
<script>
(function(){
  try {
    if (window.opener) {
      window.opener.postMessage({ type: 'hangel-contacts-error', message: ${msg} }, window.location.origin);
    }
  } catch (e) {}
})();
</script>
</body></html>`;
}

async function exchangeCodeForToken(
  config: ProviderConfig,
  code: string,
  redirectUri: string
): Promise<string | null> {
  const form = new URLSearchParams({
    code,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
    // Microsoft requires the scope on the token request; harmless for Google.
    scope: config.scope,
  });
  const res = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { access_token?: string };
  return typeof data.access_token === 'string' && data.access_token.length > 0
    ? data.access_token
    : null;
}

async function fetchGoogleContacts(accessToken: string): Promise<NormalizedContact[]> {
  const out: NormalizedContact[] = [];
  let pageToken: string | undefined;
  for (let page = 0; page < GOOGLE_MAX_PAGES; page++) {
    const url = new URL('https://people.googleapis.com/v1/people/me/connections');
    url.searchParams.set('personFields', 'names,emailAddresses,phoneNumbers');
    url.searchParams.set('pageSize', '1000');
    if (pageToken) url.searchParams.set('pageToken', pageToken);
    const res = await fetch(url.toString(), {
      headers: { authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) break;
    const data = (await res.json()) as GoogleConnectionsPage;
    for (const person of data.connections ?? []) out.push(mapGooglePerson(person));
    pageToken = data.nextPageToken;
    if (!pageToken) break;
  }
  return out;
}

async function fetchGraphContacts(accessToken: string): Promise<NormalizedContact[]> {
  const url = new URL('https://graph.microsoft.com/v1.0/me/contacts');
  url.searchParams.set('$select', 'displayName,emailAddresses,mobilePhone,homePhones');
  url.searchParams.set('$top', '999');
  const res = await fetch(url.toString(), {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return [];
  const data = (await res.json()) as GraphContactsPage;
  return (data.value ?? []).map(mapGraphContact);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;

  if (!isContactProvider(provider)) {
    return htmlResponse(errorPage('unsupported_provider'), { status: 400, clearCookie: true });
  }

  const code = req.nextUrl.searchParams.get('code') ?? '';
  const state = req.nextUrl.searchParams.get('state') ?? '';
  const cookieState = req.cookies.get(OAUTH_STATE_COOKIE)?.value ?? '';

  // --- State verification: signature + exp + double-submit cookie. ---
  const decoded = verifyState(state);
  if (!decoded || !cookieState || !statesMatch(state, cookieState)) {
    return htmlResponse(errorPage('invalid_state'), { status: 400, clearCookie: true });
  }
  if (!code) {
    return htmlResponse(errorPage('missing_code'), { status: 400, clearCookie: true });
  }

  const config = getProviderConfig(provider);
  if (!config) {
    return htmlResponse(errorPage('not_configured'), { status: 503, clearCookie: true });
  }

  try {
    const origin = publicOrigin(
      req.headers.get('x-forwarded-host'),
      req.headers.get('host'),
      req.headers.get('x-forwarded-proto'),
    ) ?? req.nextUrl.origin;
    const redirectUri = `${origin}/api/contacts/${provider}/callback`;
    const accessToken = await exchangeCodeForToken(config, code, redirectUri);
    if (!accessToken) {
      return htmlResponse(errorPage('token_exchange_failed'), { status: 502, clearCookie: true });
    }

    const raw =
      provider === 'google'
        ? await fetchGoogleContacts(accessToken)
        : await fetchGraphContacts(accessToken);

    const contacts = normalizeContacts(raw);
    // Token goes out of scope here — never persisted, never logged.
    return htmlResponse(successPage(provider, contacts), { clearCookie: true });
  } catch {
    return htmlResponse(errorPage('import_failed'), { status: 500, clearCookie: true });
  }
}
