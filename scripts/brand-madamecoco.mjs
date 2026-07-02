#!/usr/bin/env node
// Brand scraper: Madame Coco (ReklamAction offer_id 61826)
// Site: https://www.madamecoco.com  (Akinon commerce platform)
// Network: ReklamAction -> tracking domain ad.reklm.com, aff_id 35329, offer_id 61826
//
// PLATFORM QUIRK (differs from converse/dsdamat):
//   Product pages expose JSON-LD @type "ProductGroup" (NOT "Product"). The real
//   priced Product node lives in `additionalVariants[]`. `hasVariant` is just an
//   array of color labels (strings) here, and there are NO top-level offers on the
//   group. So we read additionalVariants[0] for sku/price/availability/image.
//   externalId = productGroupID (clean, e.g. "YO0000000036") -> unique per page.
//   Fallback: og:title / og:image / og:price:amount meta.
//   Images are already absolute https CDN (akinoncloudcdn.com) -> pass through.
//
// Output: scripts/out/ra-madamecoco.json  (up to 1000 in-stock objects)
// Usage: node scripts/brand-madamecoco.mjs [limit]

import { writeFileSync, mkdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, 'out');
const OUT_FILE = resolve(OUT_DIR, 'ra-madamecoco.json');

const SOURCE = 'reklamaction';
const OFFER_ID = '61826';
const FEED_ID = '61826';
const AFF_ID = '35329';
const TRACK = 'ad.reklm.com';
const BRAND_NAME = 'Madame Coco';
const DONATION_RATE = 4;
const SITEMAP_INDEX = 'https://www.madamecoco.com/sitemap.xml';

const LIMIT = parseInt(process.argv[2] || '1000', 10);
const CONCURRENCY = 10;
// Over-fetch pool: some pages skip (no price / out of stock), crawl extra.
const POOL_MULT = 3;

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const HEADERS = {
  'User-Agent': UA,
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8',
};

const clean = (s) =>
  (s || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const deepLink = (dest) =>
  `https://${TRACK}/aff_c?offer_id=${OFFER_ID}&aff_id=${AFF_ID}&url=${encodeURIComponent(dest)}`;

const toNum = (raw) => {
  if (typeof raw === 'number') return raw;
  if (raw == null) return null;
  const n = parseFloat(String(raw).replace(/[^\d.,]/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};

async function fetchText(url, { binary = false, retries = 2 } = {}) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { headers: HEADERS, redirect: 'follow' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      if (binary) return Buffer.from(await res.arrayBuffer());
      return await res.text();
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
    }
  }
}

const extractLocs = (xml) =>
  [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map((m) => m[1].trim());

async function fetchSitemap(url) {
  if (url.endsWith('.gz')) {
    const buf = await fetchText(url, { binary: true });
    if (buf.length > 1 && buf[0] === 0x1f && buf[1] === 0x8b) return gunzipSync(buf).toString('utf8');
    return buf.toString('utf8');
  }
  return fetchText(url);
}

async function getProductUrls() {
  const indexXml = await fetchSitemap(SITEMAP_INDEX);
  const productSitemaps = extractLocs(indexXml).filter((u) => /sitemap-products/i.test(u));
  if (!productSitemaps.length) throw new Error('No product sitemap found in index');
  const urls = [];
  const seen = new Set();
  for (const sm of productSitemaps) {
    let xml;
    try {
      xml = await fetchSitemap(sm);
    } catch {
      continue;
    }
    for (const loc of extractLocs(xml)) {
      if (!seen.has(loc)) {
        seen.add(loc);
        urls.push(loc);
      }
    }
  }
  return urls;
}

// ── Extraction: ProductGroup (additionalVariants) preferred, meta fallback ──────
function fromJsonLd(html) {
  for (const m of html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    let j;
    try {
      j = JSON.parse(m[1].trim());
    } catch {
      continue;
    }
    const nodes = Array.isArray(j) ? j : j['@graph'] || [j];
    for (const n of nodes) {
      const t = n['@type'];
      const isGroup = t === 'ProductGroup' || (Array.isArray(t) && t.includes('ProductGroup'));
      const isProduct = t === 'Product' || (Array.isArray(t) && t.includes('Product'));
      if (!isGroup && !isProduct) continue;

      // The priced node: additionalVariants[0] on a group, else the node itself.
      const variant =
        (Array.isArray(n.additionalVariants) && n.additionalVariants.find((v) => v && v.offers)) ||
        (n.offers ? n : null);
      const src = variant || n;
      const off = Array.isArray(src.offers) ? src.offers[0] : src.offers;
      const price = toNum(off?.price ?? off?.lowPrice);
      if (!price) continue;

      const avail = String(off?.availability || '');
      if (avail && !/InStock/i.test(avail)) continue; // in-stock only when known

      const sku = String(n.productGroupID || src.sku || n.sku || '').trim();
      const image = Array.isArray(src.image) ? src.image[0] : src.image || (Array.isArray(n.image) ? n.image[0] : n.image);
      return {
        title: clean(n.name || src.name),
        price,
        currency: (off?.priceCurrency || 'TRY').toUpperCase(),
        image,
        sku,
        availability: 'in stock',
        desc: clean(n.description || src.description),
      };
    }
  }
  return null;
}

function fromMeta(html) {
  const meta = (name) => {
    const esc = name.replace(/[:]/g, '[:]');
    const a = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${esc}["'][^>]+content=["']([^"']*)`, 'i'));
    if (a) return a[1];
    const b = html.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${esc}["']`, 'i'));
    return b ? b[1] : null;
  };
  const title = meta('og:title') || html.match(/<title>([^<]+)/i)?.[1];
  if (!title) return null;
  const price = toNum(meta('product:price:amount') || meta('og:price:amount'));
  if (!price) return null;
  return {
    title: clean(title),
    price,
    currency: (meta('og:price:currency') || meta('product:price:currency') || 'TRY').toUpperCase(),
    image: meta('og:image'),
    sku: '',
    availability: 'in stock',
    desc: clean(meta('og:description')),
  };
}

function absImage(img) {
  if (!img) return undefined;
  if (/^https?:\/\//i.test(img)) return img;
  if (img.startsWith('//')) return 'https:' + img;
  return undefined;
}

async function main() {
  const t0 = Date.now();
  mkdirSync(OUT_DIR, { recursive: true });
  console.log(`Madame Coco scrape — hedef ${LIMIT} ürün\n`);

  const allUrls = await getProductUrls();
  console.log(`▸ sitemap'ten ${allUrls.length} ürün URL'i toplandı`);
  const pool = allUrls.slice(0, LIMIT * POOL_MULT);

  const out = [];
  const seenExt = new Set();
  let miss = 0;
  let idx = 0;

  async function worker() {
    while (idx < pool.length && out.length < LIMIT) {
      const url = pool[idx++];
      let html;
      try {
        html = await fetchText(url);
      } catch {
        miss++;
        continue;
      }
      const e = fromJsonLd(html) || fromMeta(html);
      if (!e || !e.title || !e.price) {
        miss++;
        continue;
      }
      const image = absImage(e.image);
      if (!image) {
        miss++;
        continue;
      }
      let externalId = String(e.sku || '').trim();
      if (!externalId) {
        const parts = url.replace(/\/$/, '').split('/');
        externalId = parts.pop() || parts.pop();
      }
      if (seenExt.has(externalId)) continue;
      seenExt.add(externalId);
      if (out.length >= LIMIT) break;
      out.push({
        id: `${SOURCE}-${OFFER_ID}-${externalId}`,
        source: SOURCE,
        feedId: FEED_ID,
        offerId: OFFER_ID,
        brandId: null,
        brandName: BRAND_NAME,
        externalId,
        title: e.title,
        description: e.desc || '',
        price: e.price,
        salePrice: null,
        currency: e.currency || 'TRY',
        imageLink: image,
        productUrl: deepLink(url),
        availability: e.availability || 'in stock',
        donationRate: DONATION_RATE,
      });
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  const final = out.slice(0, LIMIT);
  writeFileSync(OUT_FILE, JSON.stringify(final, null, 2));
  const dur = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`\n✅ ${final.length} ürün yazıldı → ${OUT_FILE} (miss ${miss}, ${dur}s)`);
  if (final[0]) {
    const p = final[0];
    console.log(`   örnek: ${p.title} — ₺${p.price} | ${p.imageLink}`);
    console.log(`   productUrl: ${p.productUrl}`);
  }
}

main().catch((e) => {
  console.error('HATA:', e.message);
  process.exit(1);
});
