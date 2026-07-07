/**
 * GET /api/extension/brands
 *
 * Chrome extension brand match endpoint. fetchAllAgencyOffers (3 HasOffers
 * network) çıktısından minimum payload üretir — extension client'ı her saatte
 * bir bunu çeker, chrome.storage.local'e cache'ler ve current tab URL'ini
 * brand.targetDomain ile karşılaştırır.
 *
 * Yanıt (kompakt — kullanıcı bant genişliği önemli):
 *   {
 *     version: number (cache-busting),
 *     ttlSeconds: 3600,
 *     brands: [{ id, name, slug, logoUrl, donationRate, domain }],
 *   }
 *
 * Auth: kamuya açık (anonim kullanıcı extension yüklemiş olabilir; KVKK
 * gereği marka listesi public, kullanıcı browsing history server'a gitmez).
 * CORS: chrome-extension://* origin'lerinden gelir → Access-Control-Allow-Origin: *
 */
import { NextResponse } from 'next/server';
import { fetchAllAgencyOffers } from '@/lib/api-clients';
import { unstable_cache } from 'next/cache';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CACHE_TTL_SECONDS = 3600;

// HasOffers ajanslarında olmayıp, uzantıya manuel eklenen markalar. Extension
// domain match sadece bu listeden gelene çalışır — build-extension-brand-domains
// script'indeki EXTRA_DOMAINS ile senkron tutulmalı.
const MANUAL_BRANDS = [
  {
    id: 'manual-gratis',
    name: 'Gratis',
    slug: 'gratis',
    logoUrl: '',
    donationRate: 0,
    domain: 'gratis.com',
  },
  {
    id: 'manual-gratis-tr',
    name: 'Gratis',
    slug: 'gratis',
    logoUrl: '',
    donationRate: 0,
    domain: 'gratis.com.tr',
  },
];

const getCached = unstable_cache(
  async () => {
    const all = await fetchAllAgencyOffers();
    const agency = all
      .filter((b) => !!b.targetDomain && b.targetDomain !== '')
      .map((b) => ({
        id: b.id,
        name: b.name,
        slug: b.slug,
        logoUrl: b.logoUrl,
        donationRate: b.donationRate,
        domain: b.targetDomain,
      }));
    // Ajanslarda zaten aynı domain varsa manuel eklemeyi es geç
    const existingDomains = new Set(agency.map((b) => (b.domain ?? '').toLowerCase()));
    const manual = MANUAL_BRANDS.filter((m) => !existingDomains.has(m.domain.toLowerCase()));
    return [...agency, ...manual];
  },
  ['extension-brands-v2'],
  { revalidate: CACHE_TTL_SECONDS },
);

function corsHeaders(): HeadersInit {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': `public, max-age=${CACHE_TTL_SECONDS}, s-maxage=${CACHE_TTL_SECONDS}`,
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function GET() {
  try {
    const brands = await getCached();
    return NextResponse.json(
      { version: 1, ttlSeconds: CACHE_TTL_SECONDS, brands },
      { headers: corsHeaders() },
    );
  } catch (err) {
    console.error('extension/brands error', err);
    return NextResponse.json(
      { errorCode: 'INTERNAL_ERROR', message: 'Marka listesi alınamadı' },
      { status: 500, headers: corsHeaders() },
    );
  }
}
