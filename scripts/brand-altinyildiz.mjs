#!/usr/bin/env node
// Brand scraper: Altınyıldız Classics (nopCommerce platform) for hangel.org / Affocean offer_id 2896
// Site: https://www.altinyildizclassics.com
// Discovery: /sitemap.xml -> /sitemap_products.xml (flat urlset, ~4444 product URLs, slug ends "-p").
// Extraction: each product page embeds one schema.org Product JSON-LD block. NOTE the ld+json
//   <script> tag has an UNQUOTED type attribute (type=application/ld+json) — the regex must allow
//   optional quotes or it matches zero blocks (this is why the generic scraper failed).
//   Fields: name / image[] (absolute https images.altinyildizclassics.com) / sku / description /
//   offers.price / offers.priceCurrency / offers.availability.
// In-stock only: keep (InStock && price>0 && https image). Sitemap already lists only live products.
// Output: scripts/out/ao-altinyildiz.json
//
// Usage: node scripts/brand-altinyildiz.mjs [limit]  (default 1000)

import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const OFFER_ID = '2896';
const AFF_ID = '7873';
const BRAND_NAME = 'Altınyıldız';
const SITE = 'https://www.altinyildizclassics.com';
const DONATION_RATE = 5.5;
const TARGET = parseInt(process.argv[2] || '1000', 10);
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'out', 'ao-altinyildiz.json');

const CONCURRENCY = 10;
const CHUNK = 60;

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchText(url, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': UA,
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8',
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(25000),
      });
      if (res.ok) return await res.text();
      if (res.status === 404 || res.status === 410) return null;
    } catch {
      /* retry */
    }
    await sleep(400 * (i + 1));
  }
  return null;
}

async function headOk(url) {
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      headers: { 'User-Agent': UA },
      signal: AbortSignal.timeout(15000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

function locs(xml) {
  return [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map((m) => m[1].trim());
}

// Robust JSON-LD Product extraction. The ld+json <script> here uses an UNQUOTED
// type attribute, so quotes around application/ld+json must be optional.
function extractProduct(html) {
  const blocks = [
    ...html.matchAll(
      /<script[^>]*type=["']?application\/ld\+json["']?[^>]*>([\s\S]*?)<\/script>/gi
    ),
  ].map((m) => m[1]);
  for (const raw of blocks) {
    let data;
    try {
      data = JSON.parse(raw.trim());
    } catch {
      continue;
    }
    const candidates = Array.isArray(data) ? data : data['@graph'] ? data['@graph'] : [data];
    for (const c of candidates) {
      const t = c && c['@type'];
      if (t === 'Product' || (Array.isArray(t) && t.includes('Product'))) return c;
    }
  }
  return null;
}

function firstImage(img) {
  if (!img) return null;
  if (Array.isArray(img)) return img.find((x) => typeof x === 'string' && x) || null;
  if (typeof img === 'string') return img;
  if (typeof img === 'object' && img.url) return img.url;
  return null;
}

function toNumber(v) {
  if (v == null) return null;
  if (typeof v === 'number') return isFinite(v) ? v : null;
  // JSON-LD price here is a plain "399.99" string; keep dot decimals intact.
  const n = parseFloat(String(v).replace(/[^\d.,]/g, '').replace(',', '.'));
  return isFinite(n) ? n : null;
}

function buildDeepLink(pageUrl) {
  return `https://ad.afftrck.com/aff_c?offer_id=${OFFER_ID}&aff_id=${AFF_ID}&url=${encodeURIComponent(
    pageUrl
  )}`;
}

function buildEntry(prod, pageUrl) {
  const offer = Array.isArray(prod.offers) ? prod.offers[0] : prod.offers;
  if (!offer) return null;
  const price = toNumber(offer.price ?? offer.lowPrice);
  const avail = String(offer.availability ?? '');
  const inStock = /InStock/i.test(avail) && !/OutOfStock/i.test(avail);
  const externalId = String(prod.sku || prod.mpn || prod.gtin13 || '').trim();
  const image = firstImage(prod.image);

  if (!externalId || !image || !/^https:\/\//i.test(image)) return null;
  if (!(price > 0) || !inStock) return null;

  const title = String(prod.name || '').trim();
  if (!title) return null;

  return {
    id: `affocean-${OFFER_ID}-${externalId}`,
    source: 'affocean',
    feedId: OFFER_ID,
    offerId: OFFER_ID,
    brandId: null,
    brandName: BRAND_NAME,
    externalId,
    title,
    description: String(prod.description || '').replace(/\s+/g, ' ').trim(),
    price,
    salePrice: null,
    currency: 'TRY',
    imageLink: image,
    productUrl: buildDeepLink(pageUrl),
    availability: 'in stock',
    donationRate: DONATION_RATE,
  };
}

async function pool(items, size, worker) {
  const results = [];
  let idx = 0;
  const runners = Array.from({ length: size }, async () => {
    while (idx < items.length) {
      const my = idx++;
      results[my] = await worker(items[my], my);
    }
  });
  await Promise.all(runners);
  return results;
}

async function main() {
  const t0 = Date.now();
  console.log(`▸ ${BRAND_NAME} — target ${TARGET}`);

  // 1) sitemap index -> product sitemap
  const indexXml = await fetchText(`${SITE}/sitemap.xml`);
  const productSitemaps = locs(indexXml || '').filter((u) => /sitemap_products\.xml/i.test(u));
  if (!productSitemaps.length) throw new Error('no product sitemap found in index');

  // 2) collect all product URLs (flat urlset)
  const productUrls = [];
  const seenUrl = new Set();
  for (const sm of productSitemaps) {
    const xml = await fetchText(sm);
    if (!xml) continue;
    for (const u of locs(xml)) {
      if (!/-p\/?$/.test(u)) continue; // nopCommerce product slug ends with "-p"
      if (seenUrl.has(u)) continue;
      seenUrl.add(u);
      productUrls.push(u);
    }
  }
  console.log(`  collected ${productUrls.length} candidate product URLs`);

  // 3) fetch pages concurrently, parse JSON-LD, keep good ones until TARGET
  const seen = new Set();
  const entries = [];
  let skipped = 0;
  for (let i = 0; i < productUrls.length && entries.length < TARGET; i += CHUNK) {
    const batch = productUrls.slice(i, i + CHUNK);
    const parsed = await pool(batch, CONCURRENCY, async (url) => {
      const html = await fetchText(url);
      if (!html) return null;
      const prod = extractProduct(html);
      if (!prod) return null;
      return buildEntry(prod, url);
    });
    for (const e of parsed) {
      if (!e) {
        skipped++;
        continue;
      }
      if (seen.has(e.id)) continue;
      seen.add(e.id);
      entries.push(e);
      if (entries.length >= TARGET) break;
    }
    process.stdout.write(
      `\r  parsed ${Math.min(i + CHUNK, productUrls.length)}/${productUrls.length} → ${entries.length} good`
    );
  }
  console.log('');

  await writeFile(OUT, JSON.stringify(entries, null, 2));
  const dur = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`  wrote ${entries.length} products (skipped ${skipped}) → ${OUT}`);
  console.log(`  DURATION ${dur}s`);

  // image spot-check (first 3)
  const checks = await Promise.all(entries.slice(0, 3).map((e) => headOk(e.imageLink)));
  console.log(`  image spot-check (first 3): ${checks.map((c) => (c ? '200' : 'FAIL')).join(' ')}`);
  if (entries[0]) console.log(`  sample: ${JSON.stringify(entries[0])}`);
}

main().catch((e) => {
  console.error('FATAL', e);
  process.exit(1);
});
