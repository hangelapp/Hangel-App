#!/usr/bin/env node
// Brand scraper: Flaw Wear (Ticimax platform) for hangel.org
// Network: ReklamAction — tracking domain ad.reklm.com, aff_id 35329, offer_id 62550, donationRate 3
// Sitemap is a nested index:
//   /sitemap.xml -> /sitemap/products/{0..5}.xml (each up to 1000 slug URLs)
// Product URL pattern: https://www.flawwears.com/<slug>-<numericId> (slug-only).
// Each product page embeds schema.org Product JSON-LD with absolute
// static.ticimax.cloud images. We keep only InStock products with price > 0.

import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const OFFER_ID = '62550';
const AFF_ID = '35329';
const FEED_ID = '62550';
const BRAND_NAME = 'Flaw Wear';
const DONATION_RATE = 3;
const SITE = 'https://www.flawwears.com';
const TARGET = parseInt(process.argv[2] || '1000', 10);
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'out', 'ra-flawwear.json');

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
        signal: AbortSignal.timeout(25000),
      });
      if (res.ok) return await res.text();
      if (res.status === 404) return null;
    } catch {
      /* retry */
    }
    await sleep(400 * (i + 1));
  }
  return null;
}

async function headOk(url) {
  try {
    const res = await fetch(url, { method: 'HEAD', headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(15000) });
    return res.ok;
  } catch {
    return false;
  }
}

function locs(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
}

// Robust JSON-LD Product extraction (handles multiple ld+json blocks / arrays / @graph)
function extractProduct(html) {
  const blocks = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map(
    (m) => m[1],
  );
  for (const raw of blocks) {
    let data;
    try {
      data = JSON.parse(raw.trim());
    } catch {
      continue;
    }
    const candidates = Array.isArray(data) ? data : data['@graph'] ? data['@graph'] : [data];
    for (const c of candidates) {
      if (c && (c['@type'] === 'Product' || (Array.isArray(c['@type']) && c['@type'].includes('Product')))) return c;
    }
  }
  return null;
}

function firstImage(img) {
  if (!img) return null;
  if (Array.isArray(img)) return img.find((x) => typeof x === 'string') || null;
  if (typeof img === 'string') return img;
  if (typeof img === 'object' && img.url) return img.url;
  return null;
}

function buildEntry(prod, pageUrl) {
  const offer = Array.isArray(prod?.offers) ? prod.offers[0] : prod?.offers;
  const price = parseFloat(String(offer?.price ?? '').replace(',', '.'));
  const avail = String(offer?.availability ?? '');
  const inStock = /InStock/i.test(avail) && !/OutOfStock/i.test(avail);
  const externalId = String(prod?.sku || prod?.mpn || '').trim();
  const image = firstImage(prod?.image);
  if (!externalId || !image || !(price > 0) || !inStock) return null;
  if (!/^https:\/\//i.test(image)) return null;

  const deep = `https://ad.reklm.com/aff_c?offer_id=${OFFER_ID}&aff_id=${AFF_ID}&url=${encodeURIComponent(pageUrl)}`;
  return {
    id: `reklamaction-${OFFER_ID}-${externalId}`,
    source: 'reklamaction',
    feedId: FEED_ID,
    offerId: OFFER_ID,
    brandId: null,
    brandName: BRAND_NAME,
    externalId,
    title: String(prod.name || '').trim(),
    description: String(prod.description || '').replace(/\s+/g, ' ').trim(),
    price,
    salePrice: null,
    currency: 'TRY',
    imageLink: image,
    productUrl: deep,
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
  // 1) sitemap index -> product sitemap children
  const indexXml = await fetchText(`${SITE}/sitemap.xml`);
  const childSitemaps = locs(indexXml || '').filter((u) => /\/sitemap\/products\/\d+\.xml/.test(u));
  console.log(`  found ${childSitemaps.length} product sitemap children`);

  // 2) collect product URLs (enough to cover misses; ~all children up to TARGET*6)
  const productUrls = [];
  for (const sm of childSitemaps) {
    if (productUrls.length >= TARGET * 6) break;
    const xml = await fetchText(sm);
    if (xml) productUrls.push(...locs(xml));
  }
  console.log(`  collected ${productUrls.length} candidate product URLs`);

  // 3) fetch product pages concurrently, parse JSON-LD, keep good ones until TARGET
  const seen = new Set();
  const entries = [];
  const CHUNK = 60;
  const CONCURRENCY = 10;
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
      if (!e) continue;
      if (seen.has(e.id)) continue;
      seen.add(e.id);
      entries.push(e);
      if (entries.length >= TARGET) break;
    }
    process.stdout.write(
      `\r  parsed ${Math.min(i + CHUNK, productUrls.length)}/${productUrls.length} → ${entries.length} good`,
    );
  }
  console.log('');

  const sample = entries.slice(0, Math.min(entries.length, TARGET));
  await writeFile(OUT, JSON.stringify(sample, null, 2));
  const dur = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`  wrote ${sample.length} products → ${OUT}`);
  console.log(`  DURATION ${dur}s`);

  // quick image spot-check
  const checks = await Promise.all(sample.slice(0, 5).map((e) => headOk(e.imageLink)));
  console.log(`  image spot-check (first 5): ${checks.map((c) => (c ? '200' : 'FAIL')).join(' ')}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
