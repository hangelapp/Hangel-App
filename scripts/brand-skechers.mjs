#!/usr/bin/env node
// Brand scraper: Skechers (GelirOrtakları offer_id 6824)
// Site: https://www.skechers.com.tr  (Hebiar platform, server: Kestrel, x-powered-by: Hebiar)
// Network: GelirOrtakları — tracking tr.rdrtr.com, aff_id 37081, offer_id 6824, donationRate 3
//
// WHY THE GENERIC SCRAPER FAILED:
//   1) The Hebiar platform serves gzip/br only; requests must send Accept-Encoding
//      (Node fetch does this automatically) — plain curl without --compressed truncates.
//   2) HEAD requests return 405 (allow: GET) — a HEAD-based probe/reachability check fails.
//   3) The JSON-LD offer uses an UPPERCASE "Price" key (not "price"/"lowPrice"), so the
//      generic extractor (off.price ?? off.lowPrice) reads null and drops every product.
//
// STRATEGY (fastest working method): sitemap → per-product JSON-LD.
//   sitemap index /sitemap/sitemap.xml → /sitemap/product_sitemap.xml
//     → /sitemap/product_sitemap_1.xml  (2061 product /p-<slug> URLs)
//   Each product page carries <script type="application/ld+json"> with a Product node:
//     name, sku (unique, e.g. "13455 OLV"), mpn, image (absolute HTTPS skcfiles.mncdn.com),
//     description, offers { priceCurrency:"TRY", Price:"5924.25", availability:.../InStock }.
//   In-stock ONLY. productUrl wraps the GelirOrtakları donation deep-link (tr.rdrtr.com).
//
// Output: scripts/out/go-skechers.json
// Usage:  node scripts/brand-skechers.mjs [limit]   (default 1000)

import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, 'out');
const OUT_FILE = resolve(OUT_DIR, 'go-skechers.json');

// ── GelirOrtakları network config ─────────────────────────────────────────────
const OFFER_ID = '6824';
const AFF_ID = '37081';
const TRACK = 'tr.rdrtr.com';
const DONATION_RATE = 3;
const BRAND_NAME = 'Skechers';

const BASE = 'https://www.skechers.com.tr';
const SITEMAP_INDEX = `${BASE}/sitemap/sitemap.xml`;

const LIMIT = parseInt(process.argv[2] || '1000', 10);
const CONCURRENCY = 12;

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const HEADERS = {
  'User-Agent': UA,
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8',
  // Node fetch auto-negotiates + decodes gzip/br; header kept explicit for clarity.
  'Accept-Encoding': 'gzip, deflate, br',
};

async function fetchText(url, { retries = 2, timeout = 30000 } = {}) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: HEADERS,
        redirect: 'follow',
        signal: AbortSignal.timeout(timeout),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
    }
  }
}

const extractLocs = (xml) =>
  [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map((m) => m[1].trim());

// sitemap index → product_sitemap.xml → product_sitemap_N.xml → /p-<slug> URLs.
async function getProductUrls() {
  const indexXml = await fetchText(SITEMAP_INDEX);
  const productIndex = extractLocs(indexXml).find((u) => /product_sitemap\.xml$/i.test(u));
  if (!productIndex) throw new Error('product_sitemap.xml not found in index');

  const productIndexXml = await fetchText(productIndex);
  // The product sitemap either lists /p- URLs directly, or points to paged children.
  let childSitemaps = extractLocs(productIndexXml).filter((u) =>
    /product_sitemap_\d+\.xml$/i.test(u),
  );
  if (!childSitemaps.length) childSitemaps = [productIndex];

  const seen = new Set();
  const out = [];
  for (const sm of childSitemaps) {
    let xml;
    try {
      xml = sm === productIndex ? productIndexXml : await fetchText(sm);
    } catch {
      continue;
    }
    for (const loc of extractLocs(xml)) {
      if (!/^https:\/\/www\.skechers\.com\.tr\/p-/.test(loc)) continue;
      if (seen.has(loc)) continue;
      seen.add(loc);
      out.push(loc);
    }
  }
  return out;
}

function parseJsonLdProduct(html) {
  const blocks = [
    ...html.matchAll(
      /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
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
    'i',
  );
  const m = html.match(re);
  return m ? m[1] : null;
}

const clean = (s) =>
  (s || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();

function absImg(url) {
  if (!url) return null;
  let u = String(url).trim();
  if (u.startsWith('//')) u = 'https:' + u;
  else if (u.startsWith('/')) u = BASE + u;
  return u.replace(/^http:\/\//i, 'https://');
}

// Skechers JSON-LD price is a decimal string like "5924.25" or integer "5999".
function toNumber(v) {
  if (v == null) return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const s = String(v).trim().replace(/[^\d.,]/g, '');
  // Already dot-decimal ("5924.25", "5999"): keep as-is, drop thousands commas.
  let n;
  if (/^\d+(\.\d+)?$/.test(s)) n = parseFloat(s);
  else n = parseFloat(s.replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : null;
}

const buildDeepLink = (productPageUrl) =>
  `https://${TRACK}/aff_c?offer_id=${OFFER_ID}&aff_id=${AFF_ID}&url=${encodeURIComponent(
    productPageUrl,
  )}`;

const isInStock = (av) =>
  !!av && /InStock/i.test(String(av)) && !/OutOfStock/i.test(String(av));

async function scrapeProduct(url) {
  let html;
  try {
    html = await fetchText(url);
  } catch {
    return { __skip: true, reason: 'fetch-failed' };
  }
  const prod = parseJsonLdProduct(html);
  if (!prod) return { __skip: true, reason: 'no-jsonld' };

  const sku = String(prod.sku || prod.mpn || prod.gtin13 || '').trim();
  if (!sku) return { __skip: true, reason: 'no-sku' };

  const title = clean(prod.name || metaContent(html, 'og:title'));

  let imageRaw = prod.image;
  if (Array.isArray(imageRaw)) imageRaw = imageRaw[0];
  if (imageRaw && typeof imageRaw === 'object') imageRaw = imageRaw.url || imageRaw['@id'];
  if (!imageRaw) imageRaw = metaContent(html, 'og:image');
  const imageLink = absImg(imageRaw);

  const offer = Array.isArray(prod.offers) ? prod.offers[0] : prod.offers;
  if (!offer) return { __skip: true, reason: 'no-offer' };

  // CRITICAL: Hebiar uses uppercase "Price" (generic scraper reads only "price"/"lowPrice").
  const price = toNumber(offer.Price ?? offer.price ?? offer.lowPrice);
  let currency = (offer.priceCurrency || 'TRY').toUpperCase();
  if (currency === 'TL') currency = 'TRY';

  if (!isInStock(offer.availability)) return { __skip: true, reason: 'out-of-stock' };
  if (!title || price == null || !imageLink || !/^https:\/\//i.test(imageLink)) {
    return { __skip: true, reason: `title=${!!title} price=${price} img=${!!imageLink}` };
  }

  const description =
    (typeof prod.description === 'string' && clean(prod.description)) ||
    clean(metaContent(html, 'og:description')) ||
    '';

  return {
    id: `gelirortaklari-${OFFER_ID}-${sku}`,
    source: 'gelirortaklari',
    feedId: OFFER_ID,
    offerId: OFFER_ID,
    brandId: null,
    brandName: BRAND_NAME,
    externalId: sku,
    title,
    description,
    price,
    salePrice: null,
    currency,
    imageLink,
    productUrl: buildDeepLink(url),
    availability: 'in stock',
    donationRate: DONATION_RATE,
  };
}

// Concurrency pool that stops once `enough()` is satisfied.
async function runPoolUntil(items, worker, concurrency, enough, onResult) {
  let idx = 0;
  let stop = false;
  const runners = Array.from({ length: concurrency }, async () => {
    while (!stop && idx < items.length) {
      const i = idx++;
      let r;
      try {
        r = await worker(items[i]);
      } catch (err) {
        r = { __skip: true, reason: 'err:' + err.message };
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
  console.log(`  target ${LIMIT}, concurrency ${CONCURRENCY}...`);

  const products = [];
  const byId = new Set();
  let skipped = 0;
  let oos = 0;
  const onResult = (r) => {
    if (!r || r.__skip) {
      skipped++;
      if (r && r.reason === 'out-of-stock') oos++;
      return;
    }
    if (byId.has(r.id)) return;
    byId.add(r.id);
    if (products.length < LIMIT) products.push(r);
  };

  await runPoolUntil(
    allUrls,
    scrapeProduct,
    CONCURRENCY,
    () => products.length >= LIMIT,
    onResult,
  );

  writeFileSync(OUT_FILE, JSON.stringify(products, null, 2));
  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`\n── ÖZET ──`);
  console.log(`  ${BRAND_NAME}: ${products.length} ürün (skip ${skipped}, oos ${oos})`);
  console.log(`  DURATION: ${secs}s`);
  console.log(`  → ${OUT_FILE}`);
  if (products[0]) console.log(`  sample: ${JSON.stringify(products[0])}`);
}

main().catch((e) => {
  console.error('FATAL', e);
  process.exit(1);
});
