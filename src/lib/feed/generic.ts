/**
 * Generic Google Merchant XML feed adaptörü.
 *
 * ikas / ideasoft / tsoft / Shopify / WooCommerce gibi platformlar Google
 * Merchant (RSS 2.0 + g: namespace) formatında ürün feed URL'si üretir. Bu
 * tek adaptör verilen feedUrl'i indirip canonical şemaya çevirir; her platform
 * için ayrı adaptör gerekmez.
 *
 * Desteklenen blok tipleri:
 *  - <item>     standart RSS Google Merchant
 *  - <product>  gelirortaklari tarzı düz product blokları
 * Hem `g:` prefix'li hem prefixsiz tag'ler okunur.
 *
 * Not: link feed'de zaten affiliate/tracking içerebilir; productUrl olarak
 * olduğu gibi korunur (değiştirilmez).
 */
import type { CanonicalProduct } from './types';

const DEFAULT_SOURCE = 'generic';
const DEFAULT_LIMIT = 500;
const MAX_LIMIT = 2000;

// "159990.00 TRY" → { amount: 159990, currency: 'TRY' }
function parsePrice(raw: string): { amount: number; currency: string } {
  const m = raw.trim().match(/([\d.,]+)\s*([A-Z]{3})?/);
  if (!m) return { amount: 0, currency: 'TRY' };
  const amount = Number(m[1].replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.')) || Number(m[1]) || 0;
  return { amount, currency: m[2] || 'TRY' };
}

// İlk eşleşen tag değeri (g: prefix'li veya prefixsiz). CDATA + entity decode.
function tag(block: string, name: string): string | undefined {
  const re = new RegExp(`<${name}>\\s*(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?\\s*</${name}>`, 'i');
  const m = block.match(re);
  if (!m) return undefined;
  return m[1]
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .trim() || undefined;
}

// g: prefix'li veya prefixsiz ilk değer.
function gTag(block: string, name: string): string | undefined {
  return tag(block, `g:${name}`) ?? tag(block, name);
}

function allTags(block: string, name: string): string[] {
  const re = new RegExp(`<${name}>\\s*(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?\\s*</${name}>`, 'gi');
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(block))) { const v = m[1].trim(); if (v) out.push(v); }
  return out;
}

// brandId yoksa feedUrl'den deterministik kısa hash üret (id namespace'i için).
function hashString(input: string): string {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (Math.imul(31, h) + input.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(36);
}

export interface GenericFeedOptions {
  feedUrl: string;
  brandId?: string | null;
  brandName: string;
  source?: string;
  donationRate?: number;
  limit?: number;
}

export async function fetchGenericGoogleMerchantProducts(
  opts: GenericFeedOptions,
): Promise<CanonicalProduct[]> {
  const feedUrl = opts.feedUrl.trim();
  if (!feedUrl) throw new Error('feedUrl zorunlu.');

  const source = opts.source?.trim() || DEFAULT_SOURCE;
  const limit = Math.max(1, Math.min(opts.limit ?? DEFAULT_LIMIT, MAX_LIMIT));
  const ns = opts.brandId?.trim() || hashString(feedUrl);

  const res = await fetch(feedUrl, { redirect: 'follow', cache: 'no-store' });
  if (!res.ok) throw new Error(`feed HTTP ${res.status}`);
  const xml = await res.text();

  const out: CanonicalProduct[] = [];
  const now = Date.now();

  // Hem <item> hem <product> bloklarını dolaş.
  const blockRe = /<(item|product)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let m: RegExpExecArray | null;
  while ((m = blockRe.exec(xml)) && out.length < limit) {
    const b = m[2];
    const externalId = gTag(b, 'id') || '';
    if (!externalId) continue;
    const link = gTag(b, 'link') || '';
    if (!link) continue;

    const title = gTag(b, 'title') || gTag(b, 'description') || 'Ürün';
    const priceRaw = gTag(b, 'price') || '0';
    const saleRaw = gTag(b, 'sale_price');
    const { amount, currency } = parsePrice(priceRaw);

    out.push({
      id: `${source}-${ns}-${externalId}`,
      source,
      feedId: ns,
      offerId: '',
      brandId: opts.brandId ?? null,
      brandName: gTag(b, 'brand') || opts.brandName,
      externalId,
      title,
      description: gTag(b, 'description'),
      price: amount,
      salePrice: saleRaw ? parsePrice(saleRaw).amount : null,
      currency,
      imageLink: gTag(b, 'image_link'),
      additionalImages: allTags(b, 'g:additional_image_link')
        .concat(allTags(b, 'additional_image_link'))
        .slice(0, 6),
      productUrl: link,
      category: gTag(b, 'product_type') || tag(b, 'g:google_product_category') || tag(b, 'google_product_category'),
      availability: gTag(b, 'availability'),
      gtin: gTag(b, 'gtin'),
      mpn: gTag(b, 'mpn'),
      donationRate: opts.donationRate,
      random: Math.random(),
      updatedAt: now,
    });
  }
  return out;
}
