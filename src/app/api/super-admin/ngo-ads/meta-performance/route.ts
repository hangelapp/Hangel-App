/**
 * GET /api/super-admin/ngo-ads/meta-performance — STK Meta reklam performans özeti.
 *
 * Tüm bağlı STK Meta reklam hesaplarının son 30 gün insights'ını (impressions,
 * clicks, ctr, spend) toplar. hangel ekibi süper-admin panelinden izler.
 *
 * Auth: super-admin (isSuperAdmin helper'ı Google Ads performance route'undan
 * birebir kopya). Config yoksa { configured:false, metrics:[] } (kırılmaz).
 * accessToken asla dönmez/loglanmaz. Hata: { errorCode, message }.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { fetchInsights, getMetaConfig, isMetaConfigured } from '@/lib/ads/meta-ads';

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
  adAccountId?: string;
  impressions: number;
  clicks: number;
  ctr: number;
  spend: number;
}

export async function GET(req: NextRequest) {
  if (!(await isSuperAdmin(req))) {
    return NextResponse.json(
      { errorCode: 'FORBIDDEN', message: 'Super-admin yetkisi gerekli.' },
      { status: 403 }
    );
  }

  const config = getMetaConfig();
  if (!isMetaConfigured() || !config) {
    return NextResponse.json({ configured: false, metrics: [] });
  }

  const db = getAdminFirestore();
  const snap = await db.collection(COLLECTIONS.metaAccounts).limit(500).get().catch(() => null);

  const metrics: PerformanceMetric[] = [];
  if (snap) {
    for (const doc of snap.docs) {
      const data = doc.data() as { accessToken?: unknown; adAccountId?: unknown };
      const accessToken = typeof data.accessToken === 'string' ? data.accessToken : '';
      const adAccountId = typeof data.adAccountId === 'string' ? data.adAccountId : '';
      const base: PerformanceMetric = {
        ngoId: doc.id,
        adAccountId: adAccountId || undefined,
        impressions: 0,
        clicks: 0,
        ctr: 0,
        spend: 0,
      };
      if (accessToken && adAccountId) {
        const m = await fetchInsights(config, accessToken, adAccountId);
        if (m) {
          base.impressions = m.impressions;
          base.clicks = m.clicks;
          base.ctr = m.ctr;
          base.spend = m.spend;
        }
      }
      metrics.push(base);
    }
  }

  return NextResponse.json({ configured: true, metrics });
}
