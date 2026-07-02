#!/usr/bin/env node
// Brand scraper: Divarese (divarese.com.tr) — Affocean offer 623, aff 7873.
// Method: sitemap (product_1.xml, product_2.xml) -> product page JSON-LD (schema.org/Product).
// Site is Akamai-fronted but serves full JSON-LD to a normal Chrome UA; no challenge on 8-way concurrency.
// Output: scripts/out/ao-divarese.json  (in-stock only, capped at MAX_ITEMS).

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = `${__dirname}/out/ao-divarese.json`;

const BASE = 'https://www.divarese.com.tr';
const SITEMAPS = [`${BASE}/product_1.xml`, `${BASE}/product_2.xml`];
const OFFER_ID = '623';
const AFF_ID = '7873';
const BRAND_NAME = 'Divarese';
const DONATION_RATE = 5;
const MAX_ITEMS = 1000;
const CONCURRENCY = 8;

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const HEADERS = {
  'User-Agent': UA,
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8',
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchText(url, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: HEADERS });
      if (res.status === 200) return await res.text();
      if (res.status === 404) return null;
      // 403/429/5xx -> backoff
      await sleep(500 * (i + 1) + Math.random() * 400);
    } catch {
      await sleep(500 * (i + 1));
    }
  }
  return null;
}

function decodeEntities(s) {
  if (!s) return s;
  return s
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(parseInt(d, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Prefer a larger image variant when the CDN uses mnresize/<w>/-/...
function upscaleImage(url) {
  if (!url) return url;
  return url.replace(/\/mnresize\/\d+\/-\//, '/mnresize/1000/-/');
}

function externalIdFromUrl(url) {
  // .../slug-p-196154  -> 196154
  const m = url.match(/-p-(\d+)(?:[/?#]|$)/);
  return m ? m[1] : null;
}

function parseProduct(html, pageUrl) {
  const blocks = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const b of blocks) {
    let obj;
    try {
      obj = JSON.parse(b[1].trim());
    } catch {
      continue;
    }
    const nodes = Array.isArray(obj) ? obj : obj['@graph'] ? obj['@graph'] : [obj];
    for (const node of nodes) {
      if (!node || node['@type'] !== 'Product') continue;
      const offers = Array.isArray(node.offers) ? node.offers[0] : node.offers;
      if (!offers) continue;

      const availRaw = String(offers.availability || '').toLowerCase();
      const inStock = availRaw.includes('instock');
      if (!inStock) return { skip: 'oos' };

      const price = Number(offers.price);
      if (!Number.isFinite(price) || price <= 0) return { skip: 'noprice' };

      let img = Array.isArray(node.image) ? node.image[0] : node.image;
      img = upscaleImage(img);
      if (!img || !img.startsWith('http')) return { skip: 'noimg' };

      const externalId = node.sku || node.mpn || externalIdFromUrl(pageUrl);
      if (!externalId) return { skip: 'noid' };

      const canonUrl = offers.url || pageUrl;
      const title = decodeEntities(node.name);
      const description = decodeEntities(node.description) || title;

      return {
        id: `affocean-${OFFER_ID}-${externalId}`,
        source: 'affocean',
        feedId: OFFER_ID,
        offerId: OFFER_ID,
        brandId: null,
        brandName: BRAND_NAME,
        externalId: String(externalId),
        title,
        description,
        price,
        salePrice: null,
        currency: 'TRY',
        imageLink: img,
        productUrl: `https://ad.afftrck.com/aff_c?offer_id=${OFFER_ID}&aff_id=${AFF_ID}&url=${encodeURIComponent(canonUrl)}`,
        availability: 'in stock',
        donationRate: DONATION_RATE,
      };
    }
  }
  return { skip: 'nold' };
}

async function collectUrls() {
  const urls = new Set();
  for (const sm of SITEMAPS) {
    const xml = await fetchText(sm);
    if (!xml) continue;
    for (const m of xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)) {
      const u = m[1];
      if (/-p-\d+/.test(u)) urls.add(u);
    }
  }
  return [...urls];
}

async function runPool(items, worker) {
  let idx = 0;
  const results = [];
  const runners = Array.from({ length: CONCURRENCY }, async () => {
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
  console.error('[divarese] fetching sitemaps...');
  const urls = await collectUrls();
  console.error(`[divarese] ${urls.length} product URLs`);

  const products = [];
  const seen = new Set();
  const stats = { ok: 0, oos: 0, noprice: 0, noimg: 0, noid: 0, nold: 0, fail: 0 };
  let stop = false;

  await runPool(urls, async (url, i) => {
    if (stop) return;
    const html = await fetchText(url);
    if (!html) { stats.fail++; return; }
    const res = parseProduct(html, url);
    if (res && res.skip) { stats[res.skip] = (stats[res.skip] || 0) + 1; return; }
    if (res && res.id) {
      if (seen.has(res.id)) return;
      seen.add(res.id);
      products.push(res);
      stats.ok++;
      if (products.length >= MAX_ITEMS) stop = true;
    }
    if (i % 100 === 0) console.error(`[divarese] processed ${i}/${urls.length} kept=${products.length}`);
  });

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(products, null, 2));
  const dur = ((Date.now() - t0) / 1000).toFixed(1);
  console.error(`[divarese] DONE kept=${products.length} in ${dur}s`);
  console.error('[divarese] stats:', JSON.stringify(stats));
  console.error(`[divarese] -> ${OUT}`);
}

main().catch((e) => { console.error('FATAL', e); process.exit(1); });
