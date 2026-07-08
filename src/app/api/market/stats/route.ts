/**
 * GET /api/market/stats
 *
 * Kamuya açık market sayacı — gelir-modeli sayfasındaki hangel kartının
 * "canlı marka" perk'i buradan beslenir (2026-07-07; kullanıcı kararı:
 * ürün sayısı GÖSTERİLMEZ, yalnız marka sayısı).
 *  - brands: canlı affiliate marka sayısı (fetchAllAgencyOffers — 3 ajans
 *    HasOffers API'sinden isim-tekilleştirilmiş liste; market/extension ile
 *    aynı kaynak, yeni marka onaylanınca otomatik artar).
 * 10 dk revalidate'li cache (⚠️ Map değil, JSON-safe düz obje — affiliate/go
 * dersinden).
 */
import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';

import { fetchAllAgencyOffers } from '@/lib/api-clients';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const getStats = unstable_cache(
  async (): Promise<{ brands: number }> => {
    const all = await fetchAllAgencyOffers();
    return { brands: all.length };
  },
  ['market-stats-v2-brands'],
  { revalidate: 600 },
);

export async function GET() {
  try {
    const stats = await getStats();
    return NextResponse.json({ ok: true, ...stats }, {
      headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600' },
    });
  } catch (err) {
    console.error('[market/stats] error', err);
    return NextResponse.json({ errorCode: 'INTERNAL_ERROR', message: 'İstatistik alınamadı' }, { status: 500 });
  }
}
