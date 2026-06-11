/**
 * Cloudflare for SaaS — Custom Hostnames API istemcisi.
 *
 * STK kendi alan adını (ör. socialbusinessglobal.org) hangel'e CNAME ile
 * yönlendirir; bu modül Cloudflare'e custom hostname kaydeder, SSL (DV) durumunu
 * sorgular ve siler. SSL doğrulama yöntemi 'http' — DNS bize yönlendiği anda
 * sertifika otomatik üretilir (STK'nın ek TXT eklemesine gerek kalmaz).
 *
 * Gerekli ortam değişkenleri (Secret Manager / apphosting.yaml):
 *  - CLOUDFLARE_API_TOKEN  : Zone:SSL and Certificates:Edit + Zone:Custom Hostnames yetkili token.
 *  - CLOUDFLARE_ZONE_ID    : hangel.org Cloudflare zone id (SaaS fallback origin'in bulunduğu zone).
 *  - CLOUDFLARE_SAAS_FALLBACK : STK'nın CNAME hedefi (ör. "sites.hangel.org") — SaaS fallback origin.
 *
 * Yapılandırılmamışsa isConfigured() false döner; route'lar nazik hata verir.
 */

const API_BASE = 'https://api.cloudflare.com/client/v4';

export function cfConfig() {
  return {
    token: process.env.CLOUDFLARE_API_TOKEN || '',
    zoneId: process.env.CLOUDFLARE_ZONE_ID || '',
    fallback: process.env.CLOUDFLARE_SAAS_FALLBACK || 'sites.hangel.org',
  };
}

export function isCloudflareConfigured(): boolean {
  const c = cfConfig();
  return !!(c.token && c.zoneId);
}

export interface CustomHostnameStatus {
  id: string;
  hostname: string;
  /** Cloudflare hostname status: pending | active | ... */
  status: string;
  /** SSL durumu: pending_validation | active | ... */
  sslStatus: string;
  /** STK'nın eklemesi gereken CNAME hedefi. */
  cnameTarget: string;
  /** Varsa ek doğrulama kayıtları (genelde http DV'de gerekmez). */
  verificationErrors?: string[];
}

type CfResult = {
  success?: boolean;
  errors?: Array<{ message?: string }>;
  result?: {
    id?: string;
    hostname?: string;
    status?: string;
    ssl?: { status?: string; validation_errors?: Array<{ message?: string }> };
  } | Array<{ id?: string; hostname?: string; status?: string; ssl?: { status?: string } }>;
};

async function cfFetch(path: string, init?: RequestInit): Promise<CfResult> {
  const c = cfConfig();
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${c.token}`,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });
  return (await res.json().catch(() => ({}))) as CfResult;
}

function normalizeHost(raw: string): string {
  return raw.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/^www\./, '');
}

/** Custom hostname kaydet (idempotent — varsa mevcut durumu döner). */
export async function addCustomHostname(rawHost: string): Promise<CustomHostnameStatus> {
  const hostname = normalizeHost(rawHost);
  const c = cfConfig();
  // Önce var mı diye bak.
  const existing = await getCustomHostname(hostname);
  if (existing) return existing;

  const body = await cfFetch(`/zones/${c.zoneId}/custom_hostnames`, {
    method: 'POST',
    body: JSON.stringify({
      hostname,
      ssl: { method: 'http', type: 'dv', settings: { min_tls_version: '1.2' } },
    }),
  });
  if (!body.success || !body.result || Array.isArray(body.result)) {
    const msg = body.errors?.[0]?.message || 'Cloudflare custom hostname eklenemedi.';
    throw new Error(msg);
  }
  const r = body.result;
  return {
    id: r.id || '',
    hostname: r.hostname || hostname,
    status: r.status || 'pending',
    sslStatus: r.ssl?.status || 'pending_validation',
    cnameTarget: c.fallback,
    verificationErrors: r.ssl?.validation_errors?.map((e) => e.message || '').filter(Boolean),
  };
}

/** Hostname durumunu sorgula (yoksa null). */
export async function getCustomHostname(rawHost: string): Promise<CustomHostnameStatus | null> {
  const hostname = normalizeHost(rawHost);
  const c = cfConfig();
  const body = await cfFetch(`/zones/${c.zoneId}/custom_hostnames?hostname=${encodeURIComponent(hostname)}`, { method: 'GET' });
  if (!body.success || !Array.isArray(body.result) || body.result.length === 0) return null;
  const r = body.result[0];
  return {
    id: r.id || '',
    hostname: r.hostname || hostname,
    status: r.status || 'pending',
    sslStatus: r.ssl?.status || 'pending_validation',
    cnameTarget: c.fallback,
  };
}

/** Hostname kaydını sil. */
export async function deleteCustomHostname(id: string): Promise<void> {
  const c = cfConfig();
  if (!id) return;
  await cfFetch(`/zones/${c.zoneId}/custom_hostnames/${id}`, { method: 'DELETE' });
}

export { normalizeHost as normalizeCustomHost };
