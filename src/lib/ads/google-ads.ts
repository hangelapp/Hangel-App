/**
 * Server-only Google Ads (Faz 1) helpers — OAuth + REST v17 wrapper.
 *
 * KRİTİK İLKE: tüm canlı işlevler Google Ads API kimlik bilgilerine (developer
 * token + OAuth client + MCC) GATED. `getGoogleAdsConfig()` env'lerden herhangi
 * biri eksikse `null` döner; çağıranlar bununla nazik `ADS_NOT_CONFIGURED`
 * (503) yanıtı verir — hiçbir şey kırılmaz, env girilince otomatik aktif olur.
 *
 * Bu modül contacts OAuth desenini izler: state/cookie imzalama
 * '@/lib/contacts/oauth' içinden reuse edilir (burada YENİ HMAC yok). Bu dosya
 * yalnız config çözümü + Google ağ I/O yapar; refreshToken / access token /
 * secret asla loglanmaz veya client'a dönmez.
 *
 * Env (RUNTIME secret — yalnız okunur, eklenmez):
 *  - GOOGLE_ADS_CLIENT_ID, GOOGLE_ADS_CLIENT_SECRET (OAuth client)
 *  - GOOGLE_ADS_DEVELOPER_TOKEN                      (Google Ads API dev token)
 *  - GOOGLE_ADS_LOGIN_CUSTOMER_ID                    (MCC hesap no, sadece rakam)
 */

export interface GoogleAdsConfig {
  clientId: string;
  clientSecret: string;
  developerToken: string;
  loginCustomerId: string;
}

/** Google Ads OAuth scope. */
export const ADS_OAUTH_SCOPE = 'https://www.googleapis.com/auth/adwords';

/**
 * OAuth round-trip sırasında ngoId taşıyan ikinci imzalı cookie adı
 * (verifyState(signState(ngoId))). Next.js route dosyaları keyfi const export
 * EDEMEZ; bu yüzden tanım burada — start + callback route'ları buradan import eder.
 */
export const ADS_OAUTH_NGO_COOKIE = 'ads_oauth_ngo';

/** Google Ads REST API base (v17). */
// Google Ads API sürümü. v17 2026'da sunset edildi (404) → desteklenen sürüme alındı.
// Desteklenen: v22/v23/v24 (en yeni v24). v22 = v17'ye en yakın, en düşük kırılma riski.
const ADS_API_BASE = 'https://googleads.googleapis.com/v22';
const GOOGLE_AUTHORIZE_BASE = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

/** Strip everything but digits (customer ids must be digit-only for REST paths). */
function digitsOnly(value: string): string {
  return value.replace(/[^0-9]/g, '');
}

/**
 * Resolve Google Ads config from env. Returns null when ANY credential is
 * missing so callers can answer with a friendly 503 (no config leakage).
 */
export function getGoogleAdsConfig(): GoogleAdsConfig | null {
  const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET;
  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  const loginCustomerId = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID;
  if (!clientId || !clientSecret || !developerToken || !loginCustomerId) {
    return null;
  }
  return {
    clientId,
    clientSecret,
    developerToken,
    loginCustomerId: digitsOnly(loginCustomerId),
  };
}

/** True when all Google Ads credentials are present. */
export function isAdsConfigured(): boolean {
  return getGoogleAdsConfig() !== null;
}

/**
 * Build the Google OAuth authorize URL for the Ads scope. `state` and
 * `redirectUri` are server-derived, never client input. Requests offline
 * access + consent so we receive a durable refresh token.
 */
export function buildAdsAuthorizeUrl(clientId: string, redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: ADS_OAUTH_SCOPE,
    state,
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
  });
  return `${GOOGLE_AUTHORIZE_BASE}?${params.toString()}`;
}

/**
 * Common headers for Google Ads REST calls.
 *
 * login-customer-id MODELİ:
 *  - STK self-servis (STK paneli): STK kendi hesabıyla bağlanır ve KENDİ hesabında
 *    işlem yapar → login-customer-id = STK'nın kendi customerId'si (hangel MCC'si DEĞİL).
 *    `loginCustomerId` parametresi olarak işlenen hesap geçilir.
 *  - hangel ajans (süper-admin): MCC'ye bağlı alt-hesapları yönetir → login-customer-id =
 *    hangel MCC (config.loginCustomerId). Parametre verilmezse varsayılan budur.
 */
function adsHeaders(
  config: GoogleAdsConfig,
  accessToken: string,
  loginCustomerId?: string
): Record<string, string> {
  const headers: Record<string, string> = {
    authorization: `Bearer ${accessToken}`,
    'developer-token': config.developerToken,
    'content-type': 'application/json',
  };
  const lcid = digitsOnly(loginCustomerId ?? config.loginCustomerId ?? '');
  if (lcid) headers['login-customer-id'] = lcid;
  return headers;
}

/**
 * Exchange an authorization code for tokens. Returns refresh + access tokens
 * (refresh may be absent if the user already granted before — caller handles).
 * Returns null on any failure.
 */
export async function exchangeCodeForTokens(
  config: GoogleAdsConfig,
  code: string,
  redirectUri: string
): Promise<{ refreshToken?: string; accessToken?: string } | null> {
  const form = new URLSearchParams({
    code,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });
  try {
    const res = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { refresh_token?: string; access_token?: string };
    const refreshToken =
      typeof data.refresh_token === 'string' && data.refresh_token.length > 0
        ? data.refresh_token
        : undefined;
    const accessToken =
      typeof data.access_token === 'string' && data.access_token.length > 0
        ? data.access_token
        : undefined;
    if (!refreshToken && !accessToken) return null;
    return { refreshToken, accessToken };
  } catch {
    return null;
  }
}

/**
 * Exchange a stored refresh token for a fresh access token. Returns null on
 * failure (token revoked, network, etc.).
 */
export async function refreshAccessToken(
  config: GoogleAdsConfig,
  refreshToken: string
): Promise<string | null> {
  const form = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });
  try {
    const res = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { access_token?: string };
    return typeof data.access_token === 'string' && data.access_token.length > 0
      ? data.access_token
      : null;
  } catch {
    return null;
  }
}

/**
 * List customer ids the authenticated user can access. Returns digit-only ids
 * (e.g. '1234567890'). Empty array on any error.
 */
export async function listAccessibleCustomers(
  accessToken: string,
  config: GoogleAdsConfig
): Promise<string[]> {
  try {
    const res = await fetch(`${ADS_API_BASE}/customers:listAccessibleCustomers`, {
      method: 'GET',
      headers: {
        authorization: `Bearer ${accessToken}`,
        'developer-token': config.developerToken,
      },
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { resourceNames?: string[] };
    const names = Array.isArray(data.resourceNames) ? data.resourceNames : [];
    // resourceName shape: "customers/1234567890"
    return names
      .map((n) => digitsOnly(n.split('/').pop() ?? ''))
      .filter((id) => id.length > 0);
  } catch {
    return [];
  }
}

/**
 * Verilen hesabın (manager olabilir) altındaki ENABLED müşteri hesaplarını döndürür
 * ({id, manager}). login-customer-id = sorgulanan hesabın kendisi. Bir serving
 * (non-manager) hesap için liste sadece kendisini içerir.
 */
async function listClientCustomers(
  accessToken: string,
  config: GoogleAdsConfig,
  underCustomerId: string
): Promise<Array<{ id: string; manager: boolean }>> {
  const mid = digitsOnly(underCustomerId);
  if (!mid) return [];
  const query =
    'SELECT customer_client.id, customer_client.manager, customer_client.status ' +
    "FROM customer_client WHERE customer_client.status = 'ENABLED'";
  try {
    const res = await fetch(`${ADS_API_BASE}/customers/${mid}/googleAds:searchStream`, {
      method: 'POST',
      headers: adsHeaders(config, accessToken, mid),
      body: JSON.stringify({ query }),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as Array<{
      results?: Array<{ customerClient?: { id?: string | number; manager?: boolean } }>;
    }>;
    const out: Array<{ id: string; manager: boolean }> = [];
    for (const chunk of Array.isArray(data) ? data : []) {
      for (const row of chunk.results ?? []) {
        const id = digitsOnly(String(row.customerClient?.id ?? ''));
        if (id) out.push({ id, manager: row.customerClient?.manager === true });
      }
    }
    return out;
  } catch {
    return [];
  }
}

/**
 * STK'nın eriştiği hesaplar arasından reklam SERVİS edebilen (non-manager, ENABLED)
 * bir hesabı + onu işlerken kullanılacak login-customer-id bağlamını çözer.
 *
 * Hem doğrudan sahip olunan serving hesabı (login-customer-id = hesabın kendisi) hem
 * de bir manager (MCC dahil) altındaki serving alt-hesabı (login-customer-id = o
 * manager) bulur. Böylece STK hesabına ister doğrudan ister bir yönetici hesap
 * üzerinden erişsin çalışır. Bulunamazsa null.
 */
export async function resolveServingCustomer(
  accessToken: string,
  config: GoogleAdsConfig
): Promise<{ customerId: string; loginCustomerId: string } | null> {
  const accessible = await listAccessibleCustomers(accessToken, config);
  for (const acc of accessible) {
    if (!acc) continue;
    const clients = await listClientCustomers(accessToken, config, acc);
    const serving = clients.find((c) => c.id && !c.manager);
    if (serving) return { customerId: serving.id, loginCustomerId: acc };
  }
  return null;
}

/**
 * Teşhis: bağlı hesabın API gözünden NEYE eriştiğini insan-okur metne çevirir
 * (erişilebilir hesaplar + her birinin altındaki servis/manager alt-hesap sayıları).
 * NO_SERVING_ACCOUNT durumunda kullanıcıya gösterilir; hesap no'ları kullanıcının
 * kendi Ads hesaplarıdır (sır değil). Sadece teşhis amaçlı, başarısızlıkta çağrılır.
 */
export async function diagnoseAccess(accessToken: string, config: GoogleAdsConfig): Promise<string> {
  const accessible = await listAccessibleCustomers(accessToken, config);
  if (accessible.length === 0) {
    return 'Bu Google hesabı hiçbir Google Ads hesabına erişemiyor (listAccessibleCustomers boş).';
  }
  const parts: string[] = [];
  for (const acc of accessible.slice(0, 6)) {
    const clients = await listClientCustomers(accessToken, config, acc);
    const serv = clients.filter((c) => !c.manager).map((c) => c.id);
    const mgr = clients.filter((c) => c.manager).length;
    parts.push(`${acc} → servis:[${serv.join(', ') || 'yok'}] manager:${mgr}`);
  }
  return `Erişilebilir hesaplar: ${accessible.join(', ')}. Alt-hesaplar: ${parts.join(' ; ')}`;
}

export interface CampaignMetrics {
  impressions: number;
  clicks: number;
  ctr: number;
  costMicros: number;
}

interface SearchStreamRow {
  metrics?: {
    impressions?: string | number;
    clicks?: string | number;
    ctr?: string | number;
    costMicros?: string | number;
  };
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
 * Fetch aggregated last-30-day campaign metrics for a customer via GAQL
 * searchStream. Returns null on any error (caller treats as "no data").
 */
export async function fetchCampaignMetrics(
  config: GoogleAdsConfig,
  refreshToken: string,
  customerId: string,
  loginCustomerId?: string
): Promise<CampaignMetrics | null> {
  const accessToken = await refreshAccessToken(config, refreshToken);
  if (!accessToken) return null;
  const id = digitsOnly(customerId);
  if (!id) return null;
  const lcid = digitsOnly(loginCustomerId || customerId) || id;

  const query =
    'SELECT metrics.impressions, metrics.clicks, metrics.ctr, metrics.cost_micros FROM campaign DURING LAST_30_DAYS';

  try {
    const res = await fetch(`${ADS_API_BASE}/customers/${id}/googleAds:searchStream`, {
      method: 'POST',
      // login-customer-id = hesabın erişim bağlamı (doğrudan ise kendisi, manager ise o).
      headers: adsHeaders(config, accessToken, lcid),
      body: JSON.stringify({ query }),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return null;
    // searchStream returns an array of result chunks: [{ results: [...] }, ...]
    const data = (await res.json()) as Array<{ results?: SearchStreamRow[] }>;
    const chunks = Array.isArray(data) ? data : [];

    let impressions = 0;
    let clicks = 0;
    let costMicros = 0;
    for (const chunk of chunks) {
      for (const row of chunk.results ?? []) {
        impressions += toNumber(row.metrics?.impressions);
        clicks += toNumber(row.metrics?.clicks);
        costMicros += toNumber(row.metrics?.costMicros);
      }
    }
    const ctr = impressions > 0 ? clicks / impressions : 0;
    return { impressions, clicks, ctr, costMicros };
  } catch {
    return null;
  }
}

export interface CampaignMetricsRow {
  campaignId: string;
  resourceName: string;
  name: string;
  status: string;
  impressions: number;
  clicks: number;
  ctr: number;
  costMicros: number;
}

interface CampaignSearchStreamRow {
  campaign?: {
    id?: string | number;
    resourceName?: string;
    name?: string;
    status?: string;
  };
  metrics?: {
    impressions?: string | number;
    clicks?: string | number;
    ctr?: string | number;
    costMicros?: string | number;
  };
}

/**
 * Fetch per-campaign last-30-day metrics for a customer via GAQL searchStream.
 * Mirrors fetchCampaignMetrics (same adsHeaders, AbortSignal.timeout, login-customer-id
 * resolution). Returns an empty array on any error (caller treats as "no data").
 */
export async function fetchCampaignMetricsByCampaign(
  config: GoogleAdsConfig,
  refreshToken: string,
  customerId: string,
  loginCustomerId?: string
): Promise<CampaignMetricsRow[]> {
  const accessToken = await refreshAccessToken(config, refreshToken);
  if (!accessToken) return [];
  const id = digitsOnly(customerId);
  if (!id) return [];
  const lcid = digitsOnly(loginCustomerId || customerId) || id;

  const query =
    'SELECT campaign.id, campaign.name, campaign.status, metrics.impressions, metrics.clicks, metrics.ctr, metrics.cost_micros FROM campaign DURING LAST_30_DAYS';

  try {
    const res = await fetch(`${ADS_API_BASE}/customers/${id}/googleAds:searchStream`, {
      method: 'POST',
      headers: adsHeaders(config, accessToken, lcid),
      body: JSON.stringify({ query }),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as Array<{ results?: CampaignSearchStreamRow[] }>;
    const chunks = Array.isArray(data) ? data : [];

    const out: CampaignMetricsRow[] = [];
    for (const chunk of chunks) {
      for (const row of chunk.results ?? []) {
        const campaignId = digitsOnly(String(row.campaign?.id ?? ''));
        if (!campaignId) continue;
        out.push({
          campaignId,
          resourceName: typeof row.campaign?.resourceName === 'string' ? row.campaign.resourceName : '',
          name: typeof row.campaign?.name === 'string' ? row.campaign.name : '',
          status: typeof row.campaign?.status === 'string' ? row.campaign.status : '',
          impressions: toNumber(row.metrics?.impressions),
          clicks: toNumber(row.metrics?.clicks),
          ctr: toNumber(row.metrics?.ctr),
          costMicros: toNumber(row.metrics?.costMicros),
        });
      }
    }
    return out;
  } catch {
    return [];
  }
}

export interface AdPlanForCampaign {
  title?: string;
  landing?: string;
  keywords?: string[];
  headlines?: string[];
  descriptions?: string[];
  dailyBudgetMicros?: string;
}

/** POST a single Google Ads REST mutate and return the parsed JSON, or throw. */
async function mutate(
  config: GoogleAdsConfig,
  accessToken: string,
  customerId: string,
  service: string,
  operations: unknown[],
  loginCustomerId?: string
): Promise<{ results?: Array<{ resourceName?: string }> }> {
  const res = await fetch(`${ADS_API_BASE}/customers/${customerId}/${service}:mutate`, {
    method: 'POST',
    // login-customer-id = işlenen hesabın erişim bağlamı (doğrudan ise hesabın kendisi,
    // bir manager üzerinden ise o manager). Verilmezse hesabın kendisi varsayılır.
    headers: adsHeaders(config, accessToken, loginCustomerId ?? customerId),
    body: JSON.stringify({ operations }),
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) {
    // Google Ads hata gövdesini (policy/billing/auth nedeni) teşhis için taşı.
    // Çağıran tarafta SADECE sunucu loguna yazılır + sadeleştirilmiş özet döner.
    const detail = await res.text().catch(() => '');
    throw new Error(`ads_mutate_failed:${service}:${res.status}:${detail.slice(0, 3000)}`);
  }
  return (await res.json()) as { results?: Array<{ resourceName?: string }> };
}

function firstResourceName(
  out: { results?: Array<{ resourceName?: string }> },
  label: string
): string {
  const name = out.results?.[0]?.resourceName;
  if (typeof name !== 'string' || name.length === 0) {
    throw new Error(`ads_missing_resource:${label}`);
  }
  return name;
}

/**
 * Create a conservative paused Search campaign for the given plan.
 *
 * FAZ1: canlı Google Ads hesabıyla test edilmeli — dev token gelince doğrulanacak.
 *
 * Chain (each step depends on the previous resourceName):
 *   campaignBudget → campaign(PAUSED, SEARCH) → adGroup
 *     → adGroupCriteria(keywords) → adGroupAd(responsiveSearchAd)
 *
 * Bu fonksiyon SADECE config mevcut VE hesap bağlıyken çağrılır. Hata atarsa
 * çağıran 502 PUBLISH_FAILED döner (raw error sızdırmaz).
 */
export async function createSearchCampaign(
  config: GoogleAdsConfig,
  refreshToken: string,
  customerId: string,
  loginCustomerId: string | undefined,
  plan: AdPlanForCampaign
): Promise<{ campaignResourceName: string }> {
  const accessToken = await refreshAccessToken(config, refreshToken);
  if (!accessToken) {
    throw new Error('ads_token_refresh_failed');
  }
  const id = digitsOnly(customerId);
  if (!id) {
    throw new Error('ads_invalid_customer');
  }
  // login-customer-id bağlamı: serving hesabın erişim yolu (manager ise o manager,
  // doğrudan ise hesabın kendisi).
  const lcid = digitsOnly(loginCustomerId || customerId) || id;

  const stamp = Date.now();
  const title = (plan.title ?? 'hangel kampanya').slice(0, 120);

  // 1) Campaign budget (1 birim/gün, micros: 1_000_000 = 1 currency unit).
  const budgetOut = await mutate(config, accessToken, id, 'campaignBudgets', [
    {
      create: {
        name: `hangel-budget-${stamp}`,
        amountMicros: plan.dailyBudgetMicros || '1000000',
        deliveryMethod: 'STANDARD',
        explicitlyShared: false,
      },
    },
  ], lcid);
  const budgetResourceName = firstResourceName(budgetOut, 'budget');

  // 2) Campaign — PAUSED start, SEARCH channel, conservative defaults.
  const campaignOut = await mutate(config, accessToken, id, 'campaigns', [
    {
      create: {
        name: `${title}-${stamp}`,
        status: 'PAUSED',
        advertisingChannelType: 'SEARCH',
        // AB siyasi reklam mevzuatı (yeni zorunlu alan): sosyal fayda reklamı → içermez.
        containsEuPoliticalAdvertising: 'DOES_NOT_CONTAIN_EU_POLITICAL_ADVERTISING',
        // Manual CPC, Arama kampanyaları + Ad Grants için artık geçersiz; Ad Grants
        // Maximize Conversions (dönüşüm odaklı akıllı teklif) zorunlu kılıyor.
        maximizeConversions: {},
        campaignBudget: budgetResourceName,
        networkSettings: {
          targetGoogleSearch: true,
          targetSearchNetwork: false,
          targetContentNetwork: false,
          targetPartnerSearchNetwork: false,
        },
      },
    },
  ], lcid);
  const campaignResourceName = firstResourceName(campaignOut, 'campaign');

  // 3) Ad group under the campaign.
  const adGroupOut = await mutate(config, accessToken, id, 'adGroups', [
    {
      create: {
        name: `hangel-adgroup-${stamp}`,
        status: 'ENABLED',
        campaign: campaignResourceName,
        type: 'SEARCH_STANDARD',
        cpcBidMicros: '1000000',
      },
    },
  ], lcid);
  const adGroupResourceName = firstResourceName(adGroupOut, 'adGroup');

  // 4) Keyword criteria (broad match). Cap at 20 to stay conservative.
  const keywords = (plan.keywords ?? [])
    .filter((k) => typeof k === 'string' && k.trim().length > 0)
    .slice(0, 20);
  if (keywords.length > 0) {
    await mutate(
      config,
      accessToken,
      id,
      'adGroupCriteria',
      keywords.map((kw) => ({
        create: {
          adGroup: adGroupResourceName,
          status: 'ENABLED',
          keyword: { text: kw.slice(0, 80), matchType: 'BROAD' },
        },
      })),
      lcid
    );
  }

  // 5) Responsive search ad. Google requires >=3 headlines and >=2 descriptions;
  //    pad conservatively from the plan title if the plan is short.
  const planHeadlines = (plan.headlines ?? []).filter(
    (h) => typeof h === 'string' && h.trim().length > 0
  );
  const planDescriptions = (plan.descriptions ?? []).filter(
    (d) => typeof d === 'string' && d.trim().length > 0
  );
  // Google RSA: başlıklar BENZERSİZ olmalı; kırpma SONRASI dedupe et (truncation
  // çakışmasını da yakalar). Fallback'ler min 3 başlık / 2 açıklama garanti eder.
  const dedupeCapped = (
    items: string[],
    maxLen: number,
    cap: number
  ): Array<{ text: string }> => {
    const seen = new Set<string>();
    const out: Array<{ text: string }> = [];
    for (const raw of items) {
      const t = (typeof raw === 'string' ? raw : '').trim().slice(0, maxLen);
      if (!t) continue;
      const key = t.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ text: t });
      if (out.length >= cap) break;
    }
    return out;
  };
  const headlines = dedupeCapped(
    [...planHeadlines, title, 'hangel', 'Destek Ol', 'Bağış Yap', 'Gönüllü Ol'],
    30,
    15
  );
  const descriptions = dedupeCapped(
    [...planDescriptions, 'hangel ile destek ol.', 'Şimdi katıl, fark yarat.', 'Bağışın hemen ulaşır.'],
    90,
    4
  );
  // RSA için geçerli bir mutlak URL ZORUNLU. plan.landing bir kod ('hangel-bagis')
  // gelirse ya da boşsa, güvenli varsayılana düş (yayın boş finalUrls ile patlamasın).
  const rawLanding = (plan.landing ?? '').trim();
  const finalUrl = /^https?:\/\//i.test(rawLanding) ? rawLanding : 'https://hangel.org.tr';

  await mutate(config, accessToken, id, 'adGroupAds', [
    {
      create: {
        adGroup: adGroupResourceName,
        status: 'PAUSED',
        ad: {
          finalUrls: [finalUrl],
          responsiveSearchAd: {
            headlines: headlines.slice(0, 15),
            descriptions: descriptions.slice(0, 4),
          },
        },
      },
    },
  ], lcid);

  return { campaignResourceName };
}
