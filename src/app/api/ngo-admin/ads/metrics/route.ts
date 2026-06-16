/**
 * GET /api/ngo-admin/ads/metrics — STK'nın bağlı Google Ads hesabındaki
 * kampanyaların son 30 günlük istatistiğini döndürür.
 *
 * Yetki: requireNgoAdmin scope 'ads'. Akış:
 *  - config yoksa 503 ADS_NOT_CONFIGURED
 *  - hesap bağlı değilse (refreshToken / customerId yok) 409 NOT_CONNECTED
 *  - fetchCampaignMetricsByCampaign çağrılır → { campaigns: [...] } döner
 *
 * refreshToken yalnız server tarafında okunur; asla loglanmaz / client'a dönmez.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireNgoAdmin } from '@/lib/messaging/server-auth';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import {
  fetchCampaignMetricsByCampaign,
  getGoogleAdsConfig,
} from '@/lib/ads/google-ads';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const auth = await requireNgoAdmin(req, { scope: 'ads' });
  if ('error' in auth) return auth.error;
  const { actor } = auth;

  const config = getGoogleAdsConfig();
  if (!config) {
    return NextResponse.json(
      { errorCode: 'ADS_NOT_CONFIGURED', message: 'Google Ads bağlantısı henüz yapılandırılmadı.' },
      { status: 503 }
    );
  }

  const db = getAdminFirestore();

  // --- Connected account (refresh token + customerId). ---
  const acctSnap = await db
    .collection(COLLECTIONS.adAccounts)
    .doc(actor.ngoId)
    .get()
    .catch(() => null);
  const acct = acctSnap?.exists
    ? (acctSnap.data() as { refreshToken?: unknown; customerId?: unknown; loginCustomerId?: unknown } | undefined)
    : undefined;
  const refreshToken = typeof acct?.refreshToken === 'string' ? acct.refreshToken : '';
  const customerId = typeof acct?.customerId === 'string' ? acct.customerId : '';
  const loginCustomerId = typeof acct?.loginCustomerId === 'string' ? acct.loginCustomerId : '';
  if (!refreshToken || !customerId) {
    return NextResponse.json(
      { errorCode: 'NOT_CONNECTED', message: 'Önce Google Ads hesabını bağlayın.' },
      { status: 409 }
    );
  }

  const campaigns = await fetchCampaignMetricsByCampaign(
    config,
    refreshToken,
    customerId,
    loginCustomerId || undefined
  );

  return NextResponse.json({ campaigns });
}
