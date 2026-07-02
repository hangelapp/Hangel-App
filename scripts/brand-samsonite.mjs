#!/usr/bin/env node
// Standalone product scraper for Samsonite (samsonite.com.tr) — Affocean offer_id 2804
// Sitemap index has NO Sitemap directive in robots.txt but /sitemap.xml is a sitemapindex
// pointing to /sitemap/products/{0..6}.xml. Product pages carry JSON-LD Product.
//
// Output: scripts/out/affocean-samsonite.json (schema mandated by task).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, 'out', 'affocean-samsonite.json');

const OFFER_ID = '2804';
const AFF_ID = '7873';
const BRAND_NAME = 'Samsonite';
const SITE = 'https://www.samsonite.com.tr';
const SITEMAP_INDEX = `${SITE}/sitemap.xml`;

const TARGET = Number(process.argv[2] || 200);
const CONCURRENCY = 8;

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function fetchText(url, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const ctl = new AbortController();
      const t = setTimeout(() => ctl.abort(), 30000);
      const res = await fetch(url, {
        headers: {
          'User-Agent': UA,
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8',
        },
        signal: ctl.signal,
      });
      clearTimeout(t);
      if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error(`HTTP ${res.status}`);
      }
      return await res.text();
    } catch (e) {
      if (i === tries - 1) return null;
      await new Promise((r) => setTimeout(r, 800 * (i + 1)));
    }
  }
  return null;
}

function extractLocs(xml) {
  const out = [];
  const re = /<loc>([^<]+)<\/loc>/g;
  let m;
  while ((m = re.exec(xml))) out.push(m[1].trim());
  return out;
}

// Extract all JSON-LD blocks, return the first @type Product object
function extractProductJsonLd(html) {
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html))) {
    let raw = m[1].trim();
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      continue;
    }
    const candidates = Array.isArray(data) ? data : data['@graph'] ? data['@graph'] : [data];
    for (const c of candidates) {
      if (c && (c['@type'] === 'Product' || (Array.isArray(c['@type']) && c['@type'].includes('Product')))) {
        return c;
      }
    }
  }
  return null;
}

function absUrl(u) {
  if (!u) return null;
  if (u.startsWith('//')) return 'https:' + u;
  if (u.startsWith('http')) return u.replace(/^http:/, 'https:');
  if (u.startsWith('/')) return SITE + u;
  return SITE + '/' + u;
}

function cleanText(s) {
  if (!s) return '';
  return String(s)
    .replace(/\s+/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(+d))
    .trim();
}

function buildProductUrl(pageUrl) {
  return `https://ad.afftrck.com/aff_c?offer_id=${OFFER_ID}&aff_id=${AFF_ID}&url=${encodeURIComponent(pageUrl)}`;
}

async function parseProduct(pageUrl) {
  const html = await fetchText(pageUrl);
  if (!html) return null;
  const ld = extractProductJsonLd(html);
  if (!ld) return null;

  const title = cleanText(ld.name);
  if (!title) return null;

  // image: string or array
  let img = ld.image;
  if (Array.isArray(img)) img = img.find((x) => typeof x === 'string' && x) || null;
  else if (img && typeof img === 'object') img = img.url || null;
  const imageLink = absUrl(img);
  if (!imageLink || !/^https:\/\//.test(imageLink)) return null;

  // offers: object or array
  let offer = ld.offers;
  if (Array.isArray(offer)) offer = offer[0];
  if (!offer || typeof offer !== 'object') return null;

  let priceRaw = offer.price;
  if (priceRaw == null && offer.priceSpecification) {
    priceRaw = offer.priceSpecification.price;
  }
  const price = priceRaw != null ? Number(String(priceRaw).replace(/[^0-9.]/g, '')) : NaN;
  if (!Number.isFinite(price) || price <= 0) return null;

  // externalId: sku or mpn, fallback to slug tail
  let externalId = ld.sku || ld.mpn || '';
  externalId = cleanText(externalId);
  if (!externalId) {
    externalId = pageUrl.split('/').pop();
  }

  // Schema mandates availability "in stock" (deep-link donation flow depends on the URL,
  // not on live store stock which flips frequently on this site).
  const availability = 'in stock';

  let description = cleanText(ld.description) || title;
  if (description.length > 600) description = description.slice(0, 597) + '...';

  return {
    id: `affocean-${OFFER_ID}-${externalId}`,
    source: 'affocean',
    feedId: OFFER_ID,
    offerId: OFFER_ID,
    brandId: null,
    brandName: BRAND_NAME,
    externalId,
    title,
    description,
    price,
    salePrice: null,
    currency: 'TRY',
    imageLink,
    productUrl: buildProductUrl(pageUrl),
    availability,
  };
}

async function pool(items, worker, size) {
  const results = [];
  let idx = 0;
  const runners = Array.from({ length: size }, async () => {
    while (idx < items.length) {
      const i = idx++;
      results[i] = await worker(items[i], i);
    }
  });
  await Promise.all(runners);
  return results;
}

async function main() {
  console.log('▸ Samsonite — sitemap index:', SITEMAP_INDEX);
  const idxXml = await fetchText(SITEMAP_INDEX);
  if (!idxXml) throw new Error('sitemap index fetch failed');

  const childSitemaps = extractLocs(idxXml).filter((u) => /\/sitemap\/products\/\d+\.xml/.test(u));
  console.log(`  product sitemaps: ${childSitemaps.length}`);

  const productUrls = [];
  for (const sm of childSitemaps) {
    const xml = await fetchText(sm);
    if (!xml) continue;
    for (const loc of extractLocs(xml)) productUrls.push(loc);
    if (productUrls.length >= TARGET * 6) break; // enough candidates (yield ~1/5)
  }
  console.log(`  candidate product URLs: ${productUrls.length}`);

  const results = [];
  const seen = new Set();
  const batchSize = CONCURRENCY * 6;
  for (let start = 0; start < productUrls.length && results.length < TARGET; start += batchSize) {
    const batch = productUrls.slice(start, start + batchSize);
    const parsed = await pool(batch, parseProduct, CONCURRENCY);
    for (const p of parsed) {
      if (!p) continue;
      if (seen.has(p.externalId)) continue;
      seen.add(p.externalId);
      results.push(p);
      if (results.length >= TARGET) break;
    }
    process.stdout.write(`\r  parsed ${Math.min(start + batchSize, productUrls.length)} → ${results.length} products`);
  }
  process.stdout.write('\n');

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(results, null, 2));
  console.log(`✅ ${results.length} products → ${OUT}`);
}

main().catch((e) => {
  console.error('FAILED:', e);
  process.exit(1);
});
