/**
 * Server-only OAuth helpers for the email contact-import flow (PDF-13b).
 *
 * Architecture: one-shot read. The `start` route mints a signed `state`, the
 * provider redirects to the `callback` route, the callback exchanges the code
 * for a short-lived access token, fetches the user's contacts, and discards the
 * token. NO provider token is ever persisted, logged, or returned to the
 * client.
 *
 * Security primitives in this module:
 *  - `signState` / `verifyState`: HMAC-SHA256 over a base64url JSON payload,
 *    constant-time compared (`crypto.timingSafeEqual`), with a 10-minute `exp`.
 *  - `getProviderConfig`: resolves provider client id/secret/endpoints from env
 *    (server-only — never `NEXT_PUBLIC`). Returns `null` when unconfigured so
 *    callers can answer with a friendly 503 instead of leaking config state.
 *  - `normalizeContacts`: maps People API / Graph payloads to a flat
 *    `{ name, email, phone }` shape, drops entries with neither, caps at 2000.
 *
 * This file does ZERO network I/O — it is pure crypto + mapping so it stays
 * trivially testable and side-effect-free.
 */

import crypto from 'crypto';

export type ContactProvider = 'google' | 'microsoft';

export const CONTACT_PROVIDERS: readonly ContactProvider[] = ['google', 'microsoft'] as const;

export function isContactProvider(value: string): value is ContactProvider {
  return (CONTACT_PROVIDERS as readonly string[]).includes(value);
}

/** Max contacts returned to the opener — bounds payload size / DoS surface. */
export const MAX_CONTACTS = 2000;

/** State validity window. */
const STATE_TTL_MS = 10 * 60 * 1000;

/** Cookie name used for double-submit CSRF verification. */
export const OAUTH_STATE_COOKIE = 'oauth_state';
export const OAUTH_STATE_COOKIE_MAX_AGE = 600; // seconds, mirrors STATE_TTL_MS

export interface NormalizedContact {
  name: string;
  email: string | null;
  phone: string | null;
}

interface StatePayload {
  uid: string;
  nonce: string;
  exp: number; // epoch ms
}

function base64UrlEncode(input: string): string {
  return Buffer.from(input, 'utf8').toString('base64url');
}

function base64UrlDecode(input: string): string {
  return Buffer.from(input, 'base64url').toString('utf8');
}

function getStateSecret(): string | null {
  const secret = process.env.OAUTH_STATE_SECRET;
  if (!secret || secret.length < 16) return null;
  return secret;
}

/**
 * Build a signed state token: `${payload}.${sig}` where payload is
 * base64url(JSON{uid,nonce,exp}) and sig is HMAC-SHA256(payload, secret) hex.
 * Returns null when the signing secret is not configured.
 */
export function signState(uid: string): string | null {
  const secret = getStateSecret();
  if (!secret) return null;
  const payloadObj: StatePayload = {
    uid,
    nonce: crypto.randomBytes(16).toString('hex'),
    exp: Date.now() + STATE_TTL_MS,
  };
  const payload = base64UrlEncode(JSON.stringify(payloadObj));
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return `${payload}.${sig}`;
}

/**
 * Verify a state token: recompute HMAC, constant-time compare, check `exp`.
 * Returns the decoded payload on success, or null on any failure (bad shape,
 * bad signature, expired, missing secret).
 */
export function verifyState(state: string): StatePayload | null {
  const secret = getStateSecret();
  if (!secret) return null;
  if (typeof state !== 'string') return null;

  const dot = state.indexOf('.');
  if (dot <= 0 || dot === state.length - 1) return null;
  const payload = state.slice(0, dot);
  const sig = state.slice(dot + 1);

  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  // timingSafeEqual throws on length mismatch — guard first.
  const sigBuf = Buffer.from(sig, 'utf8');
  const expBuf = Buffer.from(expected, 'utf8');
  if (sigBuf.length !== expBuf.length) return null;
  if (!crypto.timingSafeEqual(sigBuf, expBuf)) return null;

  let decoded: StatePayload;
  try {
    decoded = JSON.parse(base64UrlDecode(payload)) as StatePayload;
  } catch {
    return null;
  }
  if (
    typeof decoded?.uid !== 'string' ||
    typeof decoded?.nonce !== 'string' ||
    typeof decoded?.exp !== 'number'
  ) {
    return null;
  }
  if (Date.now() > decoded.exp) return null;
  return decoded;
}

/**
 * Constant-time compare of two cookie/state strings (double-submit check).
 */
export function statesMatch(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const ab = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

export interface ProviderConfig {
  clientId: string;
  clientSecret: string;
  authorizeBase: string;
  tokenUrl: string;
  scope: string;
}

/**
 * Resolve provider OAuth config from env. Returns null when client id/secret
 * are missing so the caller can answer with a friendly 503.
 */
export function getProviderConfig(provider: ContactProvider): ProviderConfig | null {
  if (provider === 'google') {
    const clientId = process.env.GOOGLE_CONTACTS_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CONTACTS_CLIENT_SECRET;
    if (!clientId || !clientSecret) return null;
    return {
      clientId,
      clientSecret,
      authorizeBase: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      scope: 'https://www.googleapis.com/auth/contacts.readonly',
    };
  }
  // microsoft
  const clientId = process.env.MICROSOFT_CONTACTS_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CONTACTS_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  const tenant = process.env.MICROSOFT_TENANT || 'common';
  return {
    clientId,
    clientSecret,
    authorizeBase: `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize`,
    tokenUrl: `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`,
    // online-only: we never use the refresh token, so offline_access is dropped.
    scope: 'https://graph.microsoft.com/Contacts.Read',
  };
}

/**
 * Build the provider authorize URL. `state` and `redirectUri` come from the
 * caller (server-derived origin), never from client input.
 */
export function buildAuthorizeUrl(
  provider: ContactProvider,
  config: ProviderConfig,
  redirectUri: string,
  state: string
): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: redirectUri,
    scope: config.scope,
    state,
  });
  if (provider === 'google') {
    params.set('access_type', 'online');
    params.set('prompt', 'consent');
  }
  return `${config.authorizeBase}?${params.toString()}`;
}

// ---- Provider response shapes (only the fields we read) ----

interface GooglePerson {
  names?: Array<{ displayName?: string }>;
  emailAddresses?: Array<{ value?: string }>;
  phoneNumbers?: Array<{ value?: string }>;
}

interface GoogleConnectionsPage {
  connections?: GooglePerson[];
  nextPageToken?: string;
}

interface GraphContact {
  displayName?: string;
  emailAddresses?: Array<{ address?: string }>;
  mobilePhone?: string | null;
  homePhones?: string[];
}

interface GraphContactsPage {
  value?: GraphContact[];
}

function firstString(...candidates: Array<string | null | undefined>): string | null {
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim().length > 0) return c.trim();
  }
  return null;
}

/**
 * Map a Google People `connections` page into normalized contacts.
 */
export function mapGooglePerson(p: GooglePerson): NormalizedContact {
  return {
    name: firstString(p.names?.[0]?.displayName) ?? 'İsimsiz',
    email: firstString(p.emailAddresses?.[0]?.value),
    phone: firstString(p.phoneNumbers?.[0]?.value),
  };
}

/**
 * Map a Microsoft Graph contact into a normalized contact.
 */
export function mapGraphContact(c: GraphContact): NormalizedContact {
  return {
    name: firstString(c.displayName) ?? 'İsimsiz',
    email: firstString(c.emailAddresses?.[0]?.address),
    phone: firstString(c.mobilePhone, c.homePhones?.[0]),
  };
}

/**
 * Drop entries with neither email nor phone, and cap the list. Shared final
 * step for both providers.
 */
export function normalizeContacts(contacts: NormalizedContact[]): NormalizedContact[] {
  return contacts.filter((c) => c.email !== null || c.phone !== null).slice(0, MAX_CONTACTS);
}

export type { GoogleConnectionsPage, GraphContactsPage };
