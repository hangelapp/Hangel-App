/**
 * GET /api/super-admin/ngo-ads/performance — STK Google Ads performans özeti.
 *
 * Tüm bağlı STK Google Ads hesaplarının son 30 gün metriklerini (impressions,
 * clicks, ctr, costMicros) toplar. hangel ekibi süper-admin panelinden izler.
 *
 * Auth: super-admin (isSuperAdmin helper'ı ngo-ads/route.ts'ten birebir kopya).
 * Config yoksa { configured:false, metrics:[] } (kırılmaz). refreshToken asla
 * dönmez/loglanmaz. Hata: { errorCode, message }.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { fetchCampaignMetrics, getGoogleAdsConfig, isAdsConfigured } from '@/lib/ads/google-ads';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

interface PerformanceMetric {
  ngoId: string;
  customerId?: string;
  impressions: number;
  clicks: number;
  ctr: number;
  costMicros: number;
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
    return NextResponse.json({ configured: false, metrics: [] });
  }

  const db = getAdminFirestore();
  const snap = await db.collection(COLLECTIONS.adAccounts).limit(500).get().catch(() => null);

  const metrics: PerformanceMetric[] = [];
  if (snap) {
    for (const doc of snap.docs) {
      const data = doc.data() as { refreshToken?: unknown; customerId?: unknown; loginCustomerId?: unknown };
      const refreshToken = typeof data.refreshToken === 'string' ? data.refreshToken : '';
      const customerId = typeof data.customerId === 'string' ? data.customerId : '';
      const loginCustomerId = typeof data.loginCustomerId === 'string' ? data.loginCustomerId : undefined;
      const base: PerformanceMetric = {
        ngoId: doc.id,
        customerId: customerId || undefined,
        impressions: 0,
        clicks: 0,
        ctr: 0,
        costMicros: 0,
      };
      if (refreshToken && customerId) {
        const m = await fetchCampaignMetrics(config, refreshToken, customerId, loginCustomerId);
        if (m) {
          base.impressions = m.impressions;
          base.clicks = m.clicks;
          base.ctr = m.ctr;
          base.costMicros = m.costMicros;
        }
      }
      metrics.push(base);
    }
  }

  return NextResponse.json({ configured: true, metrics });
}
