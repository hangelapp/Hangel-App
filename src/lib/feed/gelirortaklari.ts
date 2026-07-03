/**
 * GelirOrtakları "Go Feed API" adaptörü — ürün feed'i ingest kaynağı.
 *
 * Keşif (2026-06-11, panel + canlı test):
 *  - Base: https://feed.gelirortaklari.com/api/v1
 *  - GET /feed?affId=37081   (header x-api-key)  → onaylı markaların feed listesi
 *  - GET /product?affId=&offerId=&feedId=        → marka başına XML ürün feed'i
 *    (Google Merchant formatı; `link` zaten affiliate-tracked → komisyon dahil)
 *
 * Not: /product büyük (Mudo ~44MB / 16k ürün) ve bir CDN'e 30x redirect eder;
 * fetch redirect'i otomatik takip eder. limit param feed'de işlemediği için
 * indirip ilk N ürünü parse ediyoruz (POC). Üretimde scheduled job + stream.
 */
import type { CanonicalProduct, ProductFeed } from './types';

const SOURCE = 'gelirortaklari';
const BASE = 'https://feed.gelirortaklari.com/api/v1';
// api-clients.ts NETWORKS ile aynı kimlik (yeni secret değil).
const API_KEY = '891bae449589572cc756b5fe93e182c527ef910c2137c7e1ea53a0a366ab9cd3';
const AFF_ID = '37081';

export async function listGelirOrtaklariFeeds(): Promise<ProductFeed[]> {
  const res = await fetch(`${BASE}/feed?affId=${AFF_ID}`, {
    headers: { 'x-api-key': API_KEY },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`feed list HTTP ${res.status}`);
  const json = (await res.json()) as { feeds?: Array<Record<string, unknown>> };
  const feeds = Array.isArray(json.feeds) ? json.feeds : [];
  return feeds.map((f) => ({
    source: SOURCE,
    feedId: String(f.id ?? ''),
    offerId: String(f.offer_id ?? ''),
    name: String(f.name ?? 'Marka'),
    type: String(f.type ?? 'google'),
  })).filter((f) => f.feedId && f.offerId);
}

// "159990.00 TRY" → { amount: 159990, currency: 'TRY' }
function parsePrice(raw: string): { amount: number; currency: string } {
  const m = raw.trim().match(/([\d.,]+)\s*([A-Z]{3})?/);
  if (!m) return { amount: 0, currency: 'TRY' };
  const amount = Number(m[1].replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.')) || Number(m[1]) || 0;
  return { amount, currency: m[2] || 'TRY' };
}

function tag(block: string, name: string): string | undefined {
  // <name>…</name> veya <name><![CDATA[…]]></name>
  const re = new RegExp(`<${name}>\\s*(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?\\s*</${name}>`, 'i');
  const m = block.match(re);
  if (!m) return undefined;
  return m[1]
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .trim() || undefined;
}

function allTags(block: string, name: string): string[] {
  const re = new RegExp(`<${name}>\\s*(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?\\s*</${name}>`, 'gi');
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(block))) { const v = m[1].trim(); if (v) out.push(v); }
  return out;
}

/**
 * Bir feed'in ilk `limit` ürününü canonical şemaya çevirir.
 */
export async function fetchGelirOrtaklariProducts(
  feed: ProductFeed,
  opts: { limit?: number; brandId?: string | null; donationRate?: number } = {},
): Promise<CanonicalProduct[]> {
  const limit = Math.max(1, Math.min(opts.limit ?? 300, 20000));
  const url = `${BASE}/product?affId=${AFF_ID}&offerId=${encodeURIComponent(feed.offerId)}&feedId=${encodeURIComponent(feed.feedId)}`;
  const res = await fetch(url, { headers: { 'x-api-key': API_KEY }, redirect: 'follow', cache: 'no-store' });
  if (!res.ok) throw new Error(`product feed HTTP ${res.status}`);
  const xml = await res.text();

  const out: CanonicalProduct[] = [];
  const now = Date.now();
  const re = /<product>([\s\S]*?)<\/product>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) && out.length < limit) {
    const b = m[1];
    const externalId = tag(b, 'id') || tag(b, 'g:id') || '';
    if (!externalId) continue;
    const title = tag(b, 'title') || tag(b, 'g:title') || tag(b, 'description') || 'Ürün';
    const link = tag(b, 'link') || tag(b, 'g:link') || '';
    if (!link) continue;
    const priceRaw = tag(b, 'price') || tag(b, 'g:price') || '0';
    const saleRaw = tag(b, 'sale_price') || tag(b, 'g:sale_price');
    const { amount, currency } = parsePrice(priceRaw);
    out.push({
      id: `${SOURCE}-${feed.feedId}-${externalId}`,
      source: SOURCE,
      feedId: feed.feedId,
      offerId: feed.offerId,
      brandId: opts.brandId ?? null,
      // MAĞAZA (satıcı) = advertiser/feed adı (MediaMarkt, Trendyol...). Ürünün <brand>
      // etiketi MAĞAZA DEĞİL ürün MARKASIDIR → productBrand'e gider (Marka≠Mağaza).
      brandName: feed.name,
      productBrand: tag(b, 'brand') || null,
      externalId,
      title,
      description: tag(b, 'description'),
      price: amount,
      salePrice: saleRaw ? parsePrice(saleRaw).amount : null,
      currency,
      imageLink: tag(b, 'image_link') || tag(b, 'g:image_link'),
      additionalImages: allTags(b, 'additional_image_link').slice(0, 6),
      productUrl: link,
      category: tag(b, 'product_type') || tag(b, 'g:product_type') || tag(b, 'google_product_category'),
      availability: tag(b, 'availability') || tag(b, 'g:availability'),
      gtin: tag(b, 'gtin') || tag(b, 'g:gtin'),
      mpn: tag(b, 'mpn') || tag(b, 'g:mpn'),
      donationRate: opts.donationRate,
      random: Math.random(),
      updatedAt: now,
    });
  }
  return out;
}
