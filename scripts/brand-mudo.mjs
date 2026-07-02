#!/usr/bin/env node
// Brand scraper: Mudo (GelirOrtakları offer_id 6812)
// Site: https://www.mudo.com.tr  (Akinon commerce platform)
// Network: GelirOrtakları — tracking domain tr.rdrtr.com, aff_id 37081, offer_id 6812, donationRate 3
//
// Product URL pattern: https://www.mudo.com.tr/<slug>/   (slug-only, no trailing barcode)
// Extraction: JSON-LD @graph -> Product node
//   name / sku / image (absolute HTTPS Akinon CDN) / description /
//   offers.price (string) / offers.priceCurrency ("try") / offers.availability (schema.org URL)
//   Fallback: og:title / og:image / og:price:amount meta tags.
// In-stock ONLY (OutOfStock skipped). productUrl wraps a tr.rdrtr.com donation deep-link.
// Output: scripts/out/go-mudo.json
//
// Usage: node scripts/brand-mudo.mjs [limit]   (default 1000)

import { writeFileSync, mkdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, 'out');
const OUT_FILE = resolve(OUT_DIR, 'go-mudo.json');

// ── GelirOrtakları network config ─────────────────────────────────────────────
const OFFER_ID = '6812';
const AFF_ID = '37081';
const TRACK = 'tr.rdrtr.com';
const DONATION_RATE = 3;
const BRAND_NAME = 'Mudo';

const CDN_BASE = 'https://ce1999-mudo.akinoncloudcdn.com';
const SITEMAP_INDEX = 'https://www.mudo.com.tr/sitemap.xml';

const LIMIT = parseInt(process.argv[2] || '1000', 10);
const CONCURRENCY = 10;

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

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
      await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
    }
  }
}

function extractLocs(xml) {
  return [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map((m) => m[1].trim());
}

async function getProductUrls() {
  const indexXml = await fetchText(SITEMAP_INDEX);
  const children = extractLocs(indexXml);
  const productSitemaps = children.filter((u) => /sitemap-products/i.test(u));
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
  // de-dupe, keep only product-looking URLs on the mudo domain
  const seen = new Set();
  const out = [];
  for (const u of urls) {
    if (!/^https:\/\/www\.mudo\.com\.tr\/[^/]+\/?$/.test(u)) continue;
    if (seen.has(u)) continue;
    seen.add(u);
    out.push(u);
  }
  return out;
}

// Deterministic shuffle so we spread across the catalog (the sitemap head is a
// furniture cluster that is heavily out-of-stock). Seeded LCG for reproducibility.
function shuffle(arr) {
  let s = 0x9e3779b9;
  const rnd = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
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
  let u = String(url).trim();
  if (u.startsWith('//')) u = 'https:' + u;
  else if (u.startsWith('/')) u = CDN_BASE + u;
  else if (!/^https?:\/\//i.test(u)) u = CDN_BASE + '/' + u.replace(/^\/+/, '');
  return u.replace(/^http:\/\//i, 'https://');
}

const clean = (s) =>
  (s || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();

function cleanTitle(t) {
  if (!t) return null;
  return clean(String(t).replace(/\s*\|\s*Mudo.*$/i, ''));
}

function toNumber(v) {
  if (v == null) return null;
  if (typeof v === 'number') return isFinite(v) ? v : null;
  // Mudo JSON-LD price is a plain integer string like "129990" -> 129990
  const n = parseFloat(
    String(v)
      .replace(/[^\d.,]/g, '')
      .replace(/\.(?=\d{3}(\D|$))/g, '')
      .replace(',', '.')
  );
  return isFinite(n) ? n : null;
}

function slugFromUrl(u) {
  const m = u.replace(/\/$/, '').match(/\/([^/]+)$/);
  return m ? m[1] : u;
}

function buildDeepLink(productPageUrl) {
  return `https://${TRACK}/aff_c?offer_id=${OFFER_ID}&aff_id=${AFF_ID}&url=${encodeURIComponent(
    productPageUrl
  )}`;
}

function isInStock(av) {
  if (!av) return false; // require explicit InStock — in-stock only
  return /InStock/i.test(String(av)) && !/OutOfStock/i.test(String(av));
}

async function scrapeProduct(url) {
  let html;
  try {
    html = await fetchText(url);
  } catch {
    return { __skip: true, url, reason: 'fetch-failed' };
  }
  let prod = parseJsonLdProduct(html);

  const sku = (prod && (prod.sku || prod.mpn || prod.gtin13)) || slugFromUrl(url);
  if (!sku) return { __skip: true, url, reason: 'no-sku' };

  const title = cleanTitle((prod && prod.name) || metaContent(html, 'og:title'));

  let description =
    (prod && (typeof prod.description === 'string' ? clean(prod.description) : null)) ||
    clean(metaContent(html, 'og:description')) ||
    clean(metaContent(html, 'description')) ||
    '';

  let imageRaw = null;
  if (prod && prod.image) {
    imageRaw = Array.isArray(prod.image) ? prod.image[0] : prod.image;
    if (imageRaw && typeof imageRaw === 'object') imageRaw = imageRaw.url || imageRaw['@id'];
  }
  if (!imageRaw) imageRaw = metaContent(html, 'og:image');
  const imageLink = absImg(imageRaw);

  let price = null;
  let currency = 'TRY';
  let availRaw = null;
  if (prod && prod.offers) {
    const offer = Array.isArray(prod.offers) ? prod.offers[0] : prod.offers;
    if (offer) {
      price = toNumber(offer.price ?? offer.lowPrice);
      if (offer.priceCurrency) currency = offer.priceCurrency;
      availRaw = offer.availability;
    }
  }
  if (price == null) {
    price = toNumber(
      metaContent(html, 'og:price:amount') || metaContent(html, 'product:price:amount')
    );
    const c = metaContent(html, 'og:price:currency') || metaContent(html, 'product:price:currency');
    if (c) currency = c;
  }
  currency = (currency || 'TRY').toUpperCase();
  if (currency === 'TL') currency = 'TRY';

  // in-stock only
  if (!isInStock(availRaw)) {
    return { __skip: true, url, reason: 'out-of-stock' };
  }

  if (!title || price == null || !imageLink || !/^https:\/\//i.test(imageLink)) {
    return {
      __skip: true,
      url,
      reason: `title=${!!title} price=${price} img=${!!imageLink}`,
    };
  }

  return {
    id: `gelirortaklari-${OFFER_ID}-${sku}`,
    source: 'gelirortaklari',
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
    availability: 'in stock',
    donationRate: DONATION_RATE,
  };
}

// Pool that keeps pulling from `items` until `enough()` is true or list exhausted.
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
  const allUrls = shuffle(await getProductUrls());
  console.log(`  sitemap product URLs: ${allUrls.length} (shuffled)`);
  console.log(`  target ${LIMIT}, concurrency ${CONCURRENCY}...`);

  const products = [];
  const byId = new Set();
  let skipped = 0;
  let errored = 0;
  let oos = 0;
  const onResult = (r) => {
    if (!r) { skipped++; return; }
    if (r.__error) { errored++; return; }
    if (r.__skip) {
      skipped++;
      if (r.reason === 'out-of-stock') oos++;
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
    onResult
  );

  writeFileSync(OUT_FILE, JSON.stringify(products, null, 2));
  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`\n── ÖZET ──`);
  console.log(
    `  ${BRAND_NAME}: ${products.length} ürün (skip ${skipped}, oos ${oos}, err ${errored})`
  );
  console.log(`  DURATION: ${secs}s`);
  console.log(`  → ${OUT_FILE}`);
  if (products[0]) console.log(`  sample: ${JSON.stringify(products[0])}`);
}

main().catch((e) => {
  console.error('FATAL', e);
  process.exit(1);
});
