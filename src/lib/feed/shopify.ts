/**
 * Shopify ürün adaptörü.
 *
 * Shopify mağazaları HERKESE AÇIK `/products.json` endpoint'i sunar (sayfalı,
 * 250 ürün/sayfa). Google Merchant XML'i olmayan Shopify mağazaları için bu
 * adaptör kullanılır (ör. DAGİ, Reeder, Fresh Scarfs).
 *
 * Affiliate: `productUrl` mağazanın kendi ürün sayfasıdır; "Ürüne Git" bunu
 * brandId'nin affiliate şablonuyla sarar (bağış zinciri korunur).
 */
import type { CanonicalProduct } from './types';

const DEFAULT_LIMIT = 500;
const MAX_LIMIT = 20000;
const PAGE_SIZE = 250; // Shopify products.json sayfa başına tavan

type ShopifyVariant = { price?: string; compare_at_price?: string | null; available?: boolean; sku?: string };
type ShopifyImage = { src?: string };
type ShopifyProduct = {
  id?: number | string; title?: string; handle?: string; vendor?: string;
  product_type?: string; body_html?: string; images?: ShopifyImage[]; variants?: ShopifyVariant[];
};

function num(v: string | null | undefined): number {
  const n = Number(String(v ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

export interface ShopifyFeedOptions {
  /** Mağaza kök URL'i (ör. https://dagi.com.tr) veya products.json tam yolu. */
  feedUrl: string;
  brandId?: string | null;
  brandName: string;
  source?: string;
  donationRate?: number;
  limit?: number;
}

export async function fetchShopifyProducts(opts: ShopifyFeedOptions): Promise<CanonicalProduct[]> {
  const raw = opts.feedUrl.trim().replace(/\/+$/, '');
  if (!raw) throw new Error('feedUrl zorunlu.');
  // Kök URL verildiyse products.json'a çevir; zaten products.json ise koru.
  const base = /\/products\.json/i.test(raw) ? raw.replace(/\?.*$/, '') : `${raw}/products.json`;
  const origin = new URL(base).origin;

  const source = opts.source?.trim() || 'generic';
  const limit = Math.max(1, Math.min(opts.limit ?? DEFAULT_LIMIT, MAX_LIMIT));
  const ns = opts.brandId?.trim() || new URL(origin).hostname.replace(/^www\./, '');
  const now = Date.now();

  const out: CanonicalProduct[] = [];
  for (let page = 1; out.length < limit && page <= 200; page++) {
    const url = `${base}?limit=${PAGE_SIZE}&page=${page}`;
    const res = await fetch(url, { redirect: 'follow', cache: 'no-store', headers: { 'User-Agent': 'Mozilla/5.0 (compatible; hangel-feed)' } });
    if (!res.ok) break;
    const json = (await res.json().catch(() => null)) as { products?: ShopifyProduct[] } | null;
    const products = json?.products;
    if (!Array.isArray(products) || products.length === 0) break;

    for (const p of products) {
      if (out.length >= limit) break;
      const v = (p.variants && p.variants[0]) || {};
      const cur = num(v.price);
      const cmp = num(v.compare_at_price);
      // Shopify: price = güncel, compare_at_price = eski (indirim öncesi).
      // Şemamız: price = liste (eski), salePrice = indirimli (varsa).
      const price = cmp > cur ? cmp : cur;
      const salePrice = cmp > cur ? cur : null;
      const handle = p.handle || '';
      const productUrl = handle ? `${origin}/products/${handle}` : origin;
      const inStock = Array.isArray(p.variants) && p.variants.some((x) => x.available);

      out.push({
        id: `${source}-${ns}-${p.id ?? handle}`,
        source,
        feedId: ns,
        offerId: '',
        brandId: opts.brandId ?? null,
        brandName: p.vendor || opts.brandName,
        externalId: String(p.id ?? handle),
        title: p.title || 'Ürün',
        description: p.body_html ? p.body_html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 500) : undefined,
        price,
        salePrice,
        currency: 'TRY',
        imageLink: p.images && p.images[0] ? p.images[0].src : undefined,
        additionalImages: (p.images || []).slice(1, 7).map((i) => i.src).filter(Boolean) as string[],
        productUrl,
        category: p.product_type || undefined,
        availability: inStock ? 'in stock' : 'out of stock',
        gtin: v.sku || undefined,
        mpn: undefined,
        donationRate: opts.donationRate,
        random: Math.random(),
        updatedAt: now,
      });
    }
    if (products.length < PAGE_SIZE) break; // son sayfa
  }
  return out;
}
