/**
 * Server-only Meta (Facebook/Instagram) Ads (Faz 1) helpers —
 * Facebook Login OAuth + Marketing API REST wrapper.
 *
 * KRİTİK İLKE (Google Ads modülüyle BİREBİR PARALEL): tüm canlı işlevler Meta
 * uygulama kimlik bilgilerine GATED. `getMetaConfig()` env'lerden herhangi biri
 * (META_APP_ID / META_APP_SECRET) eksikse `null` döner; çağıranlar bununla nazik
 * `META_NOT_CONFIGURED` (503) yanıtı verir — hiçbir şey kırılmaz, env girilince
 * otomatik aktif olur. build/typecheck temiz kalır.
 *
 * Bu modül contacts OAuth desenini izler: state/cookie imzalama
 * '@/lib/contacts/oauth' içinden reuse edilir (burada YENİ HMAC yok). Bu dosya
 * yalnız config çözümü + Meta ağ I/O yapar; accessToken / secret asla loglanmaz
 * veya client'a dönmez.
 *
 * Env (RUNTIME secret — yalnız okunur, eklenmez):
 *  - META_APP_ID, META_APP_SECRET           (Facebook uygulaması)
 *  - META_API_VERSION (opsiyonel, default 'v19.0')
 */

export interface MetaConfig {
  appId: string;
  appSecret: string;
}

/** Meta OAuth scope (ads_management,business_management). */
export const META_OAUTH_SCOPE = 'ads_management,business_management';

/**
 * OAuth round-trip sırasında ngoId taşıyan ikinci imzalı cookie adı
 * (verifyState(signState(ngoId))). Next.js route dosyaları keyfi const export
 * EDEMEZ; bu yüzden tanım burada — start + callback route'ları buradan import eder.
 */
export const META_OAUTH_NGO_COOKIE = 'meta_oauth_ngo';

/** Graph API sürümü (env override edilebilir). */
export const META_API_VER = process.env.META_API_VERSION || 'v19.0';

const FACEBOOK_DIALOG_BASE = 'https://www.facebook.com';
const GRAPH_API_BASE = 'https://graph.facebook.com';

/**
 * Resolve Meta config from env. Returns null when EITHER credential is missing
 * so callers can answer with a friendly 503 (no config leakage).
 */
export function getMetaConfig(): MetaConfig | null {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  if (!appId || !appSecret) {
    return null;
  }
  return { appId, appSecret };
}

/** True when both Meta credentials are present. */
export function isMetaConfigured(): boolean {
  return getMetaConfig() !== null;
}

/**
 * Build the Facebook Login authorize URL for the Ads scope. `state` and
 * `redirectUri` are server-derived, never client input.
 */
export function buildMetaAuthorizeUrl(appId: string, redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    state,
    scope: META_OAUTH_SCOPE,
    response_type: 'code',
  });
  return `${FACEBOOK_DIALOG_BASE}/${META_API_VER}/dialog/oauth?${params.toString()}`;
}

/**
 * Exchange an authorization code for a SHORT-lived token, then exchange that for
 * a LONG-lived token (fb_exchange_token). Returns the long-lived access token,
 * or null on any failure.
 */
export async function exchangeCodeForToken(
  config: MetaConfig,
  code: string,
  redirectUri: string
): Promise<string | null> {
  try {
    // 1) code → short-lived token.
    const shortParams = new URLSearchParams({
      client_id: config.appId,
      client_secret: config.appSecret,
      redirect_uri: redirectUri,
      code,
    });
    const shortRes = await fetch(
      `${GRAPH_API_BASE}/${META_API_VER}/oauth/access_token?${shortParams.toString()}`,
      { method: 'GET' }
    );
    if (!shortRes.ok) return null;
    const shortData = (await shortRes.json()) as { access_token?: string };
    const shortToken =
      typeof shortData.access_token === 'string' && shortData.access_token.length > 0
        ? shortData.access_token
        : null;
    if (!shortToken) return null;

    // 2) short-lived → long-lived token.
    const longParams = new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: config.appId,
      client_secret: config.appSecret,
      fb_exchange_token: shortToken,
    });
    const longRes = await fetch(
      `${GRAPH_API_BASE}/${META_API_VER}/oauth/access_token?${longParams.toString()}`,
      { method: 'GET' }
    );
    if (!longRes.ok) return null;
    const longData = (await longRes.json()) as { access_token?: string };
    return typeof longData.access_token === 'string' && longData.access_token.length > 0
      ? longData.access_token
      : null;
  } catch {
    return null;
  }
}

/** Strip the leading "act_" prefix if present; ad account ids are digit-only in paths. */
function bareAdAccountId(value: string): string {
  return value.replace(/^act_/, '').replace(/[^0-9]/g, '');
}

/**
 * List ad account ids the authenticated user can access. Returns ids WITHOUT the
 * "act_" prefix (e.g. '1234567890'). Empty array on any error.
 */
export async function listAdAccounts(accessToken: string): Promise<string[]> {
  try {
    const params = new URLSearchParams({
      fields: 'id,name,account_status',
      access_token: accessToken,
    });
    const res = await fetch(
      `${GRAPH_API_BASE}/${META_API_VER}/me/adaccounts?${params.toString()}`,
      { method: 'GET' }
    );
    if (!res.ok) return [];
    const data = (await res.json()) as { data?: Array<{ id?: string }> };
    const rows = Array.isArray(data.data) ? data.data : [];
    return rows
      .map((r) => bareAdAccountId(typeof r.id === 'string' ? r.id : ''))
      .filter((id) => id.length > 0);
  } catch {
    return [];
  }
}

export interface MetaInsights {
  impressions: number;
  clicks: number;
  ctr: number;
  spend: number;
}

function toNumber(value: string | number | undefined): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

/**
 * Fetch aggregated last-30-day insights for an ad account. Returns null on any
 * error (caller treats as "no data").
 */
export async function fetchInsights(
  _config: MetaConfig,
  accessToken: string,
  adAccountId: string
): Promise<MetaInsights | null> {
  const id = bareAdAccountId(adAccountId);
  if (!id) return null;
  try {
    const params = new URLSearchParams({
      fields: 'impressions,clicks,ctr,spend',
      date_preset: 'last_30d',
      access_token: accessToken,
    });
    const res = await fetch(
      `${GRAPH_API_BASE}/${META_API_VER}/act_${id}/insights?${params.toString()}`,
      { method: 'GET' }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      data?: Array<{
        impressions?: string | number;
        clicks?: string | number;
        ctr?: string | number;
        spend?: string | number;
      }>;
    };
    const rows = Array.isArray(data.data) ? data.data : [];

    let impressions = 0;
    let clicks = 0;
    let spend = 0;
    for (const row of rows) {
      impressions += toNumber(row.impressions);
      clicks += toNumber(row.clicks);
      spend += toNumber(row.spend);
    }
    const ctr = impressions > 0 ? clicks / impressions : 0;
    return { impressions, clicks, ctr, spend };
  } catch {
    return null;
  }
}

export interface AdPlanForCampaign {
  title?: string;
}

/**
 * Create a conservative PAUSED campaign for the given plan.
 *
 * FAZ1: canlı Meta hesabıyla test edilmeli — App Review + credential gelince doğrulanacak.
 *
 * Konservatif: POST /act_{id}/campaigns (name plan.title'dan,
 * objective:'OUTCOME_TRAFFIC', status:'PAUSED', special_ad_categories:[]).
 *
 * Bu fonksiyon SADECE config mevcut VE hesap bağlıyken çağrılır. Hata atarsa
 * çağıran 502 PUBLISH_FAILED döner (raw error sızdırmaz).
 */
export async function createMetaCampaign(
  config: MetaConfig,
  accessToken: string,
  adAccountId: string,
  plan: AdPlanForCampaign
): Promise<{ campaignId: string }> {
  void config; // config imzada (Google Ads ile paralellik); Graph çağrısı accessToken kullanır.
  const id = bareAdAccountId(adAccountId);
  if (!id) {
    throw new Error('meta_invalid_ad_account');
  }
  const stamp = Date.now();
  const name = `${(plan.title ?? 'hangel kampanya').slice(0, 120)}-${stamp}`;

  const body = new URLSearchParams({
    name,
    objective: 'OUTCOME_TRAFFIC',
    status: 'PAUSED',
    special_ad_categories: '[]',
    access_token: accessToken,
  });

  const res = await fetch(`${GRAPH_API_BASE}/${META_API_VER}/act_${id}/campaigns`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  if (!res.ok) {
    // Do not surface the raw provider error to callers/clients.
    throw new Error(`meta_campaign_create_failed:${res.status}`);
  }
  const data = (await res.json()) as { id?: string };
  if (typeof data.id !== 'string' || data.id.length === 0) {
    throw new Error('meta_missing_campaign_id');
  }
  return { campaignId: data.id };
}
