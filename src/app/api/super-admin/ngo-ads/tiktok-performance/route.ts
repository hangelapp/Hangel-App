/**
 * GET /api/super-admin/ngo-ads/tiktok-performance — STK TikTok reklam performans özeti.
 *
 * Tüm bağlı STK TikTok reklam hesaplarının lifetime raporunu (impressions, clicks,
 * ctr, spend) toplar. hangel ekibi süper-admin panelinden izler.
 *
 * Auth: super-admin (isSuperAdmin helper'ı Meta performance route'undan birebir
 * kopya). Config yoksa { configured:false, metrics:[] } (kırılmaz).
 * accessToken asla dönmez/loglanmaz. Hata: { errorCode, message }.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { fetchTiktokReport, getTiktokConfig, isTiktokConfigured } from '@/lib/ads/tiktok-ads';

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
  advertiserId?: string;
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

  const config = getTiktokConfig();
  if (!isTiktokConfigured() || !config) {
    return NextResponse.json({ configured: false, metrics: [] });
  }

  const db = getAdminFirestore();
  const snap = await db.collection(COLLECTIONS.tiktokAccounts).limit(500).get().catch(() => null);

  const metrics: PerformanceMetric[] = [];
  if (snap) {
    for (const doc of snap.docs) {
      const data = doc.data() as { accessToken?: unknown; advertiserId?: unknown };
      const accessToken = typeof data.accessToken === 'string' ? data.accessToken : '';
      const advertiserId = typeof data.advertiserId === 'string' ? data.advertiserId : '';
      const base: PerformanceMetric = {
        ngoId: doc.id,
        advertiserId: advertiserId || undefined,
        impressions: 0,
        clicks: 0,
        ctr: 0,
        spend: 0,
      };
      if (accessToken && advertiserId) {
        const m = await fetchTiktokReport(config, accessToken, advertiserId);
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
