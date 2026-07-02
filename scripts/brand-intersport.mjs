#!/usr/bin/env node
// Brand scraper: Intersport (Affocean offer_id 2885)
// Site: https://www.intersport.com.tr  (Akinon commerce platform)
// Product URL pattern: https://www.intersport.com.tr/urun/<slug>/<sku>/
// Extraction: JSON-LD @graph -> Product node (name/image[]/sku/description/offers.price/priceCurrency/availability)
//   Fallback: og:title / og:image / og:price:amount meta tags.
// Output: scripts/out/ao-intersport.json
//
// Usage: node scripts/brand-intersport.mjs [limit]

import { writeFileSync, mkdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, 'out');
const OUT_FILE = resolve(OUT_DIR, 'ao-intersport.json');

const OFFER_ID = '2885';
const AFF_ID = '7873';
const BRAND_NAME = 'Intersport';
const DONATION_RATE = 6;
// Akinon media CDN base (images in JSON-LD are already absolute; used only as fallback for relative paths)
const CDN_BASE = 'https://aad216.a-cdn.akinoncloud.com';
const SITEMAP_INDEX = 'https://www.intersport.com.tr/sitemap.xml';

const LIMIT = parseInt(process.argv[2] || '1000', 10);
const CONCURRENCY = 10;
// Over-fetch: sitemap has thousands of URLs; some pages skip (no JSON-LD/no price/out of stock),
// so we crawl a larger pool and stop once we hit the target.
const POOL_MULT = 3;

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const HEADERS = {
  'User-Agent': UA,
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8',
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
      await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
    }
  }
}

function extractLocs(xml) {
  return [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map((m) => m[1].trim());
}

async function getProductUrls() {
  const indexXml = await fetchText(SITEMAP_INDEX);
  const children = extractLocs(indexXml);
  const productSitemaps = children.filter((u) => /product/i.test(u));
  if (productSitemaps.length === 0) {
    throw new Error('No product sitemap found in index: ' + children.join(', '));
  }
  const urls = [];
  for (const sm of productSitemaps) {
    let xml;
    if (sm.endsWith('.gz')) {
      const buf = await fetchText(sm, { binary: true });
      // fetch() may auto-decompress if server sent Content-Encoding: gzip.
      // Only gunzip when the gzip magic bytes (0x1f 0x8b) are present.
      if (buf.length > 1 && buf[0] === 0x1f && buf[1] === 0x8b) {
        xml = gunzipSync(buf).toString('utf8');
      } else {
        xml = buf.toString('utf8');
      }
    } else {
      xml = await fetchText(sm);
    }
    for (const loc of extractLocs(xml)) urls.push(loc);
  }
  // de-dupe, keep only product-looking URLs (/urun/<slug>/<sku>/)
  const seen = new Set();
  const out = [];
  for (const u of urls) {
    if (!/\/urun\/[^/]+\/[^/]+\/?$/.test(u)) continue;
    if (seen.has(u)) continue;
    seen.add(u);
    out.push(u);
  }
  return out;
}

function parseJsonLdProduct(html) {
  const blocks = [
    ...html.matchAll(
      /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
    ),
  ];
  for (const b of blocks) {
    let json;
    try {
      json = JSON.parse(b[1].trim());
    } catch {
      continue;
    }
    const nodes = json['@graph']
      ? json['@graph']
      : Array.isArray(json)
        ? json
        : [json];
    const prod = nodes.find((n) => {
      const t = n && n['@type'];
      return t === 'Product' || (Array.isArray(t) && t.includes('Product'));
    });
    if (prod) return prod;
  }
  return null;
}

function metaContent(html, prop) {
  const re = new RegExp(
    `<meta[^>]*(?:property|name)=["']${prop}["'][^>]*content=["']([^"']*)["']`,
    'i'
  );
  const m = html.match(re);
  if (m) return m[1];
  const re2 = new RegExp(
    `<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']${prop}["']`,
    'i'
  );
  const m2 = html.match(re2);
  return m2 ? m2[1] : null;
}

function absImg(url) {
  if (!url) return null;
  let u = url.trim();
  if (u.startsWith('//')) u = 'https:' + u;
  else if (u.startsWith('/')) u = CDN_BASE + u;
  else if (!/^https?:\/\//i.test(u)) u = CDN_BASE + '/' + u.replace(/^\/+/, '');
  return u.replace(/^http:\/\//i, 'https://');
}

function cleanTitle(t) {
  if (!t) return null;
  // remove " | Intersport" / " - Intersport" trailing suffixes
  return t
    .replace(/\s*[|–-]\s*Intersport.*$/i, '')
    .trim();
}

function toNumber(v) {
  if (v == null) return null;
  if (typeof v === 'number') return isFinite(v) ? v : null;
  const n = parseFloat(
    String(v)
      .replace(/[^\d.,]/g, '')
      .replace(/\.(?=\d{3}(\D|$))/g, '')
      .replace(',', '.')
  );
  return isFinite(n) ? n : null;
}

function skuFromUrl(u) {
  const m = u.match(/\/urun\/[^/]+\/([^/]+)\/?$/);
  return m ? m[1] : null;
}

function buildDeepLink(productPageUrl) {
  return `https://ad.afftrck.com/aff_c?offer_id=${OFFER_ID}&aff_id=${AFF_ID}&url=${encodeURIComponent(
    productPageUrl
  )}`;
}

function normalizeAvailability(av) {
  if (!av) return 'in stock';
  const s = String(av).toLowerCase();
  if (s.includes('outofstock') || s.includes('soldout')) return 'out of stock';
  return 'in stock';
}

async function scrapeProduct(url) {
  let html = await fetchText(url);
  let prod = parseJsonLdProduct(html);
  // Retry once if JSON-LD absent (transient throttle can serve a partial page).
  if (!prod && !metaContent(html, 'og:price:amount')) {
    await new Promise((r) => setTimeout(r, 400));
    html = await fetchText(url);
    prod = parseJsonLdProduct(html);
  }

  const sku =
    (prod && (prod.sku || prod.mpn || prod.productId)) || skuFromUrl(url);
  if (!sku) return null;

  let title = cleanTitle((prod && prod.name) || metaContent(html, 'og:title'));
  let description =
    (prod && (typeof prod.description === 'string' ? prod.description : null)) ||
    metaContent(html, 'og:description') ||
    metaContent(html, 'description') ||
    '';

  let imageRaw = null;
  if (prod && prod.image) {
    imageRaw = Array.isArray(prod.image) ? prod.image[0] : prod.image;
    if (imageRaw && typeof imageRaw === 'object')
      imageRaw = imageRaw.url || imageRaw['@id'];
  }
  if (!imageRaw) imageRaw = metaContent(html, 'og:image');
  const imageLink = absImg(imageRaw);

  let price = null;
  let currency = 'TRY';
  let availability = 'in stock';
  if (prod && prod.offers) {
    const offer = Array.isArray(prod.offers) ? prod.offers[0] : prod.offers;
    if (offer) {
      price = toNumber(offer.price ?? offer.lowPrice);
      if (offer.priceCurrency) currency = offer.priceCurrency;
      availability = normalizeAvailability(offer.availability);
    }
  }
  if (price == null) {
    price = toNumber(
      metaContent(html, 'og:price:amount') ||
        metaContent(html, 'product:price:amount')
    );
    const c =
      metaContent(html, 'og:price:currency') ||
      metaContent(html, 'product:price:currency');
    if (c) currency = c.toUpperCase();
  }
  currency = (currency || 'TRY').toUpperCase();
  if (currency === 'TRY' || currency === 'TL') currency = 'TRY';

  // in-stock only
  if (availability !== 'in stock') {
    return { __skip: true, url, reason: 'out of stock' };
  }

  if (!title || price == null || !imageLink) {
    return {
      __skip: true,
      url,
      reason: `title=${!!title} price=${price} img=${!!imageLink}`,
    };
  }

  return {
    id: `affocean-${OFFER_ID}-${sku}`,
    source: 'affocean',
    feedId: OFFER_ID,
    offerId: OFFER_ID,
    brandId: null,
    brandName: BRAND_NAME,
    externalId: String(sku),
    title,
    description,
    price,
    salePrice: null,
    currency,
    imageLink,
    productUrl: buildDeepLink(url),
    availability,
    donationRate: DONATION_RATE,
  };
}

// Pool that keeps pulling from `items` until `enough(collected)` is true or list exhausted.
async function runPoolUntil(items, worker, concurrency, enough, onResult) {
  let idx = 0;
  let stop = false;
  const runners = Array.from({ length: concurrency }, async () => {
    while (!stop && idx < items.length) {
      const i = idx++;
      let r;
      try {
        r = await worker(items[i], i);
      } catch (err) {
        r = { __error: true, url: items[i], reason: err.message };
      }
      onResult(r);
      if (enough()) stop = true;
    }
  });
  await Promise.all(runners);
}

async function main() {
  const t0 = Date.now();
  mkdirSync(OUT_DIR, { recursive: true });
  console.log(`▸ ${BRAND_NAME} — discovering product URLs...`);
  const allUrls = await getProductUrls();
  console.log(`  sitemap product URLs: ${allUrls.length}`);

  const pool = allUrls.slice(0, LIMIT * POOL_MULT);
  console.log(
    `  crawling up to ${pool.length} URLs to reach ${LIMIT}, concurrency ${CONCURRENCY}...`
  );

  const products = [];
  const byId = new Set();
  let skipped = 0;
  let errored = 0;
  const onResult = (r) => {
    if (!r) {
      skipped++;
      return;
    }
    if (r.__error) {
      errored++;
      return;
    }
    if (r.__skip) {
      skipped++;
      return;
    }
    if (byId.has(r.id)) return;
    byId.add(r.id);
    if (products.length < LIMIT) products.push(r);
  };
  await runPoolUntil(
    pool,
    scrapeProduct,
    CONCURRENCY,
    () => products.length >= LIMIT,
    onResult
  );

  writeFileSync(OUT_FILE, JSON.stringify(products, null, 2));
  const dur = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`\n── ÖZET ──`);
  console.log(
    `  ${BRAND_NAME}: ${products.length} ürün (skip ${skipped}, err ${errored})`
  );
  console.log(`  → ${OUT_FILE}`);
  console.log(`  DURATION: ${dur}s`);
  if (products[0]) console.log(`  sample: ${JSON.stringify(products[0])}`);
}

main().catch((e) => {
  console.error('FATAL', e);
  process.exit(1);
});
