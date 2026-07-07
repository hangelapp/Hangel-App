/**
 * GET /api/market/stats
 *
 * Kamuya açık market sayaçları — gelir-modeli sayfasındaki hangel kartının
 * "canlı marka + ürün" perk'i buradan beslenir (2026-07-07).
 *  - products: products koleksiyonunun GERÇEK sayısı (Admin aggregate count —
 *    2M dokümanı okumadan sayar).
 *  - brandCount: appStats/marketStats.brandCount varsa döner (distinct marka
 *    sayısını ucuz canlı saymak mümkün değil; gece job'ı bu doc'u yazarsa
 *    kart otomatik canlıya geçer), yoksa null → istemci "4.000+" gösterir.
 * 10 dk revalidate'li cache (⚠️ Map değil, JSON-safe düz obje — affiliate/go
 * dersinden).
 */
import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';

import { getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const getStats = unstable_cache(
  async (): Promise<{ products: number; brandCount: number | null }> => {
    const db = getAdminFirestore();
    const products = (await db.collection(COLLECTIONS.products).count().get()).data().count;
    let brandCount: number | null = null;
    try {
      const snap = await db.collection('appStats').doc('marketStats').get();
      const bc = snap.data()?.brandCount;
      if (typeof bc === 'number' && bc > 0) brandCount = bc;
    } catch {
      // brandCount opsiyonel — yoksa istemci fallback gösterir.
    }
    return { products, brandCount };
  },
  ['market-stats-v1'],
  { revalidate: 600 },
);

export async function GET() {
  try {
    const stats = await getStats();
    return NextResponse.json({ ok: true, ...stats });
  } catch (err) {
    console.error('[market/stats] error', err);
    return NextResponse.json({ errorCode: 'INTERNAL_ERROR', message: 'İstatistik alınamadı' }, { status: 500 });
  }
}
