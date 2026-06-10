/**
 * Server-only TikTok (TikTok for Business) Ads (Faz 1) helpers —
 * TikTok for Business OAuth + Marketing API REST wrapper.
 *
 * KRİTİK İLKE (Google Ads + Meta Ads modülleriyle BİREBİR PARALEL): tüm canlı
 * işlevler TikTok uygulama kimlik bilgilerine GATED. `getTiktokConfig()` env'lerden
 * herhangi biri (TIKTOK_APP_ID / TIKTOK_APP_SECRET) eksikse `null` döner; çağıranlar
 * bununla nazik `TIKTOK_NOT_CONFIGURED` (503) yanıtı verir — hiçbir şey kırılmaz,
 * env girilince otomatik aktif olur. build/typecheck temiz kalır.
 *
 * Bu modül contacts OAuth desenini izler: state/cookie imzalama
 * '@/lib/contacts/oauth' içinden reuse edilir (burada YENİ HMAC yok). Bu dosya
 * yalnız config çözümü + TikTok ağ I/O yapar; accessToken / secret asla loglanmaz
 * veya client'a dönmez.
 *
 * Önemli: TikTok Marketing API tüm çağrılarda 'Access-Token' header'ı bekler
 * (Bearer DEĞİL).
 *
 * Env (RUNTIME secret — yalnız okunur, eklenmez):
 *  - TIKTOK_APP_ID, TIKTOK_APP_SECRET       (TikTok for Business uygulaması)
 *  - TIKTOK_API_VERSION (opsiyonel, default 'v1.3')
 */

export interface TiktokConfig {
  appId: string;
  appSecret: string;
}

/** TikTok OAuth scope etiketi (tiktokAccounts.scope alanında saklanır). */
export const TIKTOK_OAUTH_SCOPE = 'ads_management';

/**
 * OAuth round-trip sırasında ngoId taşıyan ikinci imzalı cookie adı
 * (verifyState(signState(ngoId))). Next.js route dosyaları keyfi const export
 * EDEMEZ; bu yüzden tanım burada — start + callback route'ları buradan import eder.
 */
export const TIKTOK_OAUTH_NGO_COOKIE = 'tiktok_oauth_ngo';

/** TikTok Marketing API sürümü (env override edilebilir). */
export const TIKTOK_API_VER = process.env.TIKTOK_API_VERSION || 'v1.3';

const TIKTOK_PORTAL_BASE = 'https://business-api.tiktok.com/portal';
const TIKTOK_OPEN_API_BASE = 'https://business-api.tiktok.com/open_api';

/**
 * Resolve TikTok config from env. Returns null when EITHER credential is missing
 * so callers can answer with a friendly 503 (no config leakage).
 */
export function getTiktokConfig(): TiktokConfig | null {
  const appId = process.env.TIKTOK_APP_ID;
  const appSecret = process.env.TIKTOK_APP_SECRET;
  if (!appId || !appSecret) {
    return null;
  }
  return { appId, appSecret };
}

/** True when both TikTok credentials are present. */
export function isTiktokConfigured(): boolean {
  return getTiktokConfig() !== null;
}

/**
 * Build the TikTok for Business authorize URL. `state` and `redirectUri` are
 * server-derived, never client input.
 */
export function buildTiktokAuthorizeUrl(appId: string, redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    app_id: appId,
    redirect_uri: redirectUri,
    state,
  });
  return `${TIKTOK_PORTAL_BASE}/auth?${params.toString()}`;
}

/**
 * Exchange an authorization code for a long-lived access token. Returns the
 * access token, or null on any failure.
 */
export async function exchangeCodeForToken(
  config: TiktokConfig,
  authCode: string
): Promise<string | null> {
  try {
    const res = await fetch(
      `${TIKTOK_OPEN_API_BASE}/${TIKTOK_API_VER}/oauth2/access_token/`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          app_id: config.appId,
          secret: config.appSecret,
          auth_code: authCode,
          grant_type: 'authorization_code',
        }),
      }
    );
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: { access_token?: string } };
    const token = json.data?.access_token;
    return typeof token === 'string' && token.length > 0 ? token : null;
  } catch {
    return null;
  }
}

/**
 * List advertiser ids the authenticated app+token can access. Returns ids as
 * strings. Empty array on any error.
 */
export async function listAdvertisers(
  config: TiktokConfig,
  accessToken: string
): Promise<string[]> {
  try {
    const params = new URLSearchParams({
      app_id: config.appId,
      secret: config.appSecret,
    });
    const res = await fetch(
      `${TIKTOK_OPEN_API_BASE}/${TIKTOK_API_VER}/oauth2/advertiser/get/?${params.toString()}`,
      {
        method: 'GET',
        headers: { 'Access-Token': accessToken },
      }
    );
    if (!res.ok) return [];
    const json = (await res.json()) as {
      data?: { list?: Array<{ advertiser_id?: string }> };
    };
    const rows = Array.isArray(json.data?.list) ? json.data!.list! : [];
    return rows
      .map((r) => (typeof r.advertiser_id === 'string' ? r.advertiser_id : ''))
      .filter((id) => id.length > 0);
  } catch {
    return [];
  }
}

export interface TiktokReport {
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
 * Fetch lifetime advertiser-level report (impressions, clicks, ctr, spend) for an
 * advertiser. query_lifetime:true means no date range is required. Returns null on
 * any error (caller treats as "no data").
 */
export async function fetchTiktokReport(
  config: TiktokConfig,
  accessToken: string,
  advertiserId: string
): Promise<TiktokReport | null> {
  void config; // config imzada (Meta/Google ile paralellik); çağrı accessToken kullanır.
  if (!advertiserId) return null;
  try {
    const params = new URLSearchParams({
      advertiser_id: advertiserId,
      report_type: 'BASIC',
      data_level: 'AUCTION_ADVERTISER',
      dimensions: JSON.stringify(['advertiser_id']),
      metrics: JSON.stringify(['impressions', 'clicks', 'ctr', 'spend']),
      query_lifetime: 'true',
    });
    const res = await fetch(
      `${TIKTOK_OPEN_API_BASE}/${TIKTOK_API_VER}/report/integrated/get/?${params.toString()}`,
      {
        method: 'GET',
        headers: { 'Access-Token': accessToken },
      }
    );
    if (!res.ok) return null;
    const json = (await res.json()) as {
      data?: {
        list?: Array<{
          metrics?: {
            impressions?: string | number;
            clicks?: string | number;
            ctr?: string | number;
            spend?: string | number;
          };
        }>;
      };
    };
    const row = Array.isArray(json.data?.list) ? json.data!.list![0] : undefined;
    const m = row?.metrics;
    if (!m) return null;
    return {
      impressions: toNumber(m.impressions),
      clicks: toNumber(m.clicks),
      ctr: toNumber(m.ctr),
      spend: toNumber(m.spend),
    };
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
 * FAZ1: canlı TikTok hesabıyla test edilmeli — App Review + credential gelince doğrulanacak.
 *
 * Konservatif: POST /campaign/create/ (campaign_name plan.title'dan,
 * objective_type:'TRAFFIC', budget_mode:'BUDGET_MODE_DAY', budget:20,
 * operation_status:'DISABLE' = paused).
 *
 * Bu fonksiyon SADECE config mevcut VE hesap bağlıyken çağrılır. Hata atarsa
 * çağıran 502 PUBLISH_FAILED döner (raw error sızdırmaz).
 */
export async function createTiktokCampaign(
  config: TiktokConfig,
  accessToken: string,
  advertiserId: string,
  plan: AdPlanForCampaign
): Promise<{ campaignId: string }> {
  void config; // config imzada (Meta/Google ile paralellik); çağrı accessToken kullanır.
  if (!advertiserId) {
    throw new Error('tiktok_invalid_advertiser');
  }
  const stamp = Date.now();
  const campaignName = `${(plan.title ?? 'hangel kampanya').slice(0, 120)}-${stamp}`;

  const res = await fetch(`${TIKTOK_OPEN_API_BASE}/${TIKTOK_API_VER}/campaign/create/`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'Access-Token': accessToken,
    },
    body: JSON.stringify({
      advertiser_id: advertiserId,
      campaign_name: campaignName,
      objective_type: 'TRAFFIC',
      budget_mode: 'BUDGET_MODE_DAY',
      budget: 20,
      operation_status: 'DISABLE',
    }),
  });
  if (!res.ok) {
    // Do not surface the raw provider error to callers/clients.
    throw new Error(`tiktok_campaign_create_failed:${res.status}`);
  }
  const json = (await res.json()) as { code?: number; data?: { campaign_id?: string } };
  // TikTok returns HTTP 200 with a non-zero `code` on logical failures.
  if (typeof json.code === 'number' && json.code !== 0) {
    throw new Error(`tiktok_campaign_create_failed:code_${json.code}`);
  }
  const campaignId = json.data?.campaign_id;
  if (typeof campaignId !== 'string' || campaignId.length === 0) {
    throw new Error('tiktok_missing_campaign_id');
  }
  return { campaignId };
}
