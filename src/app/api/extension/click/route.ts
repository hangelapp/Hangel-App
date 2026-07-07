/**
 * POST /api/extension/click
 *
 * Chrome extension "Yapsın" tıklamasında çağrılır. Brand ID alır, mevcut
 * fetchAllAgencyOffers cache'inden affiliate tracking URL'ini bulur ve döner.
 *
 * Body: { brandId: string }
 * Yanıt: { affiliateUrl: string, brandName: string, donationRate: number }
 *
 * Attribution: HasOffers tracking link içinde aff_id zaten gömülü; conversion
 * gerçekleştiğinde /api/affiliate/webhook/[brandId] çağrılır ve impact++ edilir.
 * Bu sebeple click event'ini ayrıca Firestore'a yazmıyoruz (KVKK + maliyet).
 *
 * Auth: anonim (extension kullanıcısı login değil olabilir; login olsa bile
 * click event'i privacy-first çalışır — user identity tracking yok).
 * CORS: chrome-extension://* origin'lerinden gelir.
 */
import { NextRequest, NextResponse } from 'next/server';
import { fetchAllAgencyOffers } from '@/lib/api-clients';
import { unstable_cache } from 'next/cache';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ⚠️ unstable_cache JSON serileştirir: Map cache HIT'te düz `{}`'a döner ve
// `.get()` TypeError → 500 (affiliate/go ile aynı bug, 2026-07-07) → Record.
const getCachedBrandIndex = unstable_cache(
  async () => {
    const all = await fetchAllAgencyOffers();
    const map: Record<string, { id: string; name: string; donationRate: number; link?: string }> = {};
    for (const b of all) {
      if (b.link) map[b.id] = { id: b.id, name: b.name, donationRate: b.donationRate, link: b.link };
    }
    return map;
  },
  ['extension-brand-index-v3-record'],
  { revalidate: 3600 },
);

function corsHeaders(): HeadersInit {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

// Basit, örnek-içi (in-memory) hız sınırı: sahte/otomatik tıklama spam'ine karşı.
// IP başına kayan pencerede sınır. Best-effort (Cloud Run örneği başına); PII
// saklamaz, Firestore'a yazmaz — maliyet + KVKK dostu. Dağıtık değildir ama tek
// bir kötüye kullananı tek örnekte anlamlı biçimde yavaşlatır.
const RL_WINDOW_MS = 60_000;
const RL_MAX = 30;
const rlHits = new Map<string, number[]>();

function clientIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for') || '';
  return xff.split(',')[0].trim() || req.headers.get('x-real-ip') || 'unknown';
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const hits = (rlHits.get(ip) || []).filter((t) => now - t < RL_WINDOW_MS);
  hits.push(now);
  rlHits.set(ip, hits);
  // Ara sıra bayat anahtarları temizle (bellek şişmesin).
  if (rlHits.size > 5000) {
    for (const [k, v] of rlHits) {
      if (v.every((t) => now - t >= RL_WINDOW_MS)) rlHits.delete(k);
    }
  }
  return hits.length > RL_MAX;
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function POST(req: NextRequest) {
  if (isRateLimited(clientIp(req))) {
    return NextResponse.json(
      { errorCode: 'RATE_LIMITED', message: 'Çok fazla istek. Lütfen biraz sonra tekrar dene.' },
      { status: 429, headers: corsHeaders() },
    );
  }
  let body: { brandId?: string } | null = null;
  try { body = await req.json(); } catch { /* invalid JSON */ }
  const brandId = typeof body?.brandId === 'string' ? body.brandId.trim() : '';
  if (!brandId) {
    return NextResponse.json(
      { errorCode: 'INVALID_BODY', message: 'brandId zorunlu' },
      { status: 400, headers: corsHeaders() },
    );
  }
  try {
    const index = await getCachedBrandIndex();
    const brand = index[brandId];
    if (!brand || !brand.link) {
      return NextResponse.json(
        { errorCode: 'NOT_FOUND', message: 'Marka tracking link\'i bulunamadı' },
        { status: 404, headers: corsHeaders() },
      );
    }
    return NextResponse.json(
      {
        affiliateUrl: brand.link,
        brandName: brand.name,
        donationRate: brand.donationRate,
      },
      { headers: corsHeaders() },
    );
  } catch (err) {
    console.error('extension/click error', err);
    return NextResponse.json(
      { errorCode: 'INTERNAL_ERROR', message: 'Affiliate link alınamadı' },
      { status: 500, headers: corsHeaders() },
    );
  }
}
