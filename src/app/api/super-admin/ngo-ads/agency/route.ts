/**
 * GET /api/super-admin/ngo-ads/agency — ajans (MCC) genel görünüm.
 *
 * hangel MCC altındaki SERVİS (non-manager) alt-hesaplarını listeler; her hesap
 * için son 30 gün kampanya metriklerini + toplamlarını döndürür. Mümkünse her
 * hesabı bağlı STK'ya (adAccounts) eşler.
 *
 * Auth: super-admin (isSuperAdmin helper'ı performance/route.ts'ten birebir
 * kopya). refreshToken asla dönmez/loglanmaz. Hata: { errorCode, message }.
 *
 * NOT: her serving account için fetchCampaignMetricsByCampaign ayrı bir token
 * refresh yapar (MVP için kabul). Çok hesapta yavaşlarsa ileride tek access
 * token paylaşımı ile optimize edilebilir.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import {
  fetchCampaignMetricsByCampaign,
  getGoogleAdsConfig,
  isAdsConfigured,
  listManagedAccounts,
  refreshAccessToken,
  type CampaignMetricsRow,
} from '@/lib/ads/google-ads';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MCC_DOC_ID = 'mcc';

async function isSuperAdmin(req: NextRequest): Promise<boolean> {
  const authHeader = req.headers.get('authorization') || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!idToken) return false;
  try {
    const decoded = (await getAdminAuth().verifyIdToken(idToken)) as {
      uid: string;
      role?: string;
      superAdminPermissions?: unknown;
    };
    if (decoded.role === 'super-admin' || !!decoded.superAdminPermissions) return true;
    const snap = await getAdminFirestore().collection(COLLECTIONS.users).doc(decoded.uid).get();
    const d = snap.data();
    return (
      d?.role === 'super-admin' ||
      (Array.isArray(d?.superAdminPermissions) && d.superAdminPermissions.length > 0)
    );
  } catch {
    return false;
  }
}

interface AgencyAccount {
  customerId: string;
  name: string;
  ngoId: string | null;
  campaigns: CampaignMetricsRow[];
  totals: { impressions: number; clicks: number; ctr: number; costMicros: number };
}

export async function GET(req: NextRequest) {
  if (!(await isSuperAdmin(req))) {
    return NextResponse.json(
      { errorCode: 'FORBIDDEN', message: 'Super-admin yetkisi gerekli.' },
      { status: 403 }
    );
  }

  const config = getGoogleAdsConfig();
  if (!isAdsConfigured() || !config) {
    return NextResponse.json({ configured: false, connected: false, accounts: [] });
  }

  const db = getAdminFirestore();
  const agencySnap = await db
    .collection(COLLECTIONS.adAgency)
    .doc(MCC_DOC_ID)
    .get()
    .catch(() => null);
  const mccRefreshToken =
    typeof agencySnap?.data()?.refreshToken === 'string'
      ? (agencySnap!.data()!.refreshToken as string)
      : '';

  if (!mccRefreshToken) {
    return NextResponse.json({
      configured: true,
      connected: false,
      mccCustomerId: config.loginCustomerId,
      accounts: [],
    });
  }

  const accessToken = await refreshAccessToken(config, mccRefreshToken);
  if (!accessToken) {
    // Token revoke / yenilenemiyor → bağlı değil say.
    return NextResponse.json({
      configured: true,
      connected: false,
      mccCustomerId: config.loginCustomerId,
      accounts: [],
    });
  }

  // customerId → ngoId eşlemesi (best-effort): adAccounts'ı oku, customerId'si
  // olanları doc.id (=ngoId)'ye map'le. Eşleşme yoksa ngoId null kalır.
  const customerToNgo = new Map<string, string>();
  const accSnap = await db.collection(COLLECTIONS.adAccounts).limit(500).get().catch(() => null);
  if (accSnap) {
    for (const doc of accSnap.docs) {
      const cid = doc.data()?.customerId;
      if (typeof cid === 'string' && cid.length > 0) {
        customerToNgo.set(cid.replace(/[^0-9]/g, ''), doc.id);
      }
    }
  }

  const managed = await listManagedAccounts(accessToken, config);
  const serving = managed.filter((m) => m.manager === false);

  const accounts: AgencyAccount[] = [];
  for (const acc of serving) {
    // login-customer-id = MCC bağlamı.
    const campaigns = await fetchCampaignMetricsByCampaign(
      config,
      mccRefreshToken,
      acc.customerId,
      config.loginCustomerId
    );
    let impressions = 0;
    let clicks = 0;
    let costMicros = 0;
    for (const c of campaigns) {
      impressions += c.impressions;
      clicks += c.clicks;
      costMicros += c.costMicros;
    }
    const ctr = impressions > 0 ? clicks / impressions : 0;
    accounts.push({
      customerId: acc.customerId,
      name: acc.descriptiveName || acc.customerId,
      ngoId: customerToNgo.get(acc.customerId) ?? null,
      campaigns,
      totals: { impressions, clicks, ctr, costMicros },
    });
  }

  return NextResponse.json({
    configured: true,
    connected: true,
    mccCustomerId: config.loginCustomerId,
    accounts,
  });
}
