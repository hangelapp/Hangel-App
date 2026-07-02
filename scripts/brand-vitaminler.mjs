#!/usr/bin/env node
// Brand scraper: Vitaminler (ReklamAction offer_id 60816)
// Site: https://www.vitaminler.com  (nopCommerce / .NET storefront)
// Network: ReklamAction -> tracking domain ad.reklm.com, aff_id 35329, offer_id 60816
//
// Product discovery: /sitemapseo (single flat urlset, ~1856 /urun/ product URLs).
//   NOTE: HEAD returns empty/404-ish; GET returns the real XML. Robots points here
//   ("Sitemap: https://www.vitaminler.com/sitemapseo"). /sitemap.xml is a 404.
// Extraction: JSON-LD Product node on each product page.
//   name / description / image[] (absolute vitaminler.mncdn.com HTTPS) /
//   offers[].sku / offers[].price (numeric) / offers[].availability (schema.org/InStock).
//   IN-STOCK ONLY.
// Output: scripts/out/ra-vitaminler.json
//
// Usage: node scripts/brand-vitaminler.mjs [limit]   (default 1000)

import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, 'out');
const OUT_FILE = resolve(OUT_DIR, 'ra-vitaminler.json');

const OFFER_ID = '60816';
const AFF_ID = '35329';
const TRACK = 'ad.reklm.com';
const BRAND_NAME = 'Vitaminler';
const DONATION_RATE = 5;
const ORIGIN = 'https://www.vitaminler.com';
const SITEMAP = ORIGIN + '/sitemapseo';

const LIMIT = parseInt(process.argv[2] || '1000', 10);
const CONCURRENCY = parseInt(process.env.VIT_CONCURRENCY || '12', 10);
// Almost every /urun/ page is in-stock, so a modest over-fetch beyond LIMIT is enough.
const POOL = Math.min(Math.max(LIMIT + 300, 1200), 5000);

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const HEADERS = {
  'User-Agent': UA,
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Upgrade-Insecure-Requests': '1',
  Referer: ORIGIN + '/',
};

const clean = (s) =>
  (s || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();

const deepLink = (dest) =>
  `https://${TRACK}/aff_c?offer_id=${OFFER_ID}&aff_id=${AFF_ID}&url=${encodeURIComponent(dest)}`;

// Price may be number, "1499.99", or Turkish "1.499,99". Returns Number or null.
function parsePrice(raw) {
  if (raw == null) return null;
  if (typeof raw === 'number') return Number.isFinite(raw) && raw > 0 ? raw : null;
  let s = String(raw).trim().replace(/[^\d.,]/g, '');
  if (!s) return null;
  const hasComma = s.includes(',');
  const hasDot = s.includes('.');
  if (hasComma && hasDot) s = s.replace(/\./g, '').replace(',', '.');
  else if (hasComma) s = s.replace(',', '.');
  const n = parseFloat(s);
  return Number.isFinite(n) && n > 0 ? n : null;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchText(url, { retries = 4 } = {}) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: HEADERS,
        redirect: 'follow',
        signal: AbortSignal.timeout(30000),
      });
      if (!res.ok) {
        const rl = res.status === 405 || res.status === 429 || res.status === 503;
        if (rl && attempt < retries) {
          await sleep(1200 * (attempt + 1) + Math.floor(Math.random() * 400));
          continue;
        }
        throw new Error(`HTTP ${res.status}`);
      }
      return await res.text();
    } catch (err) {
      if (attempt === retries) throw err;
      await sleep(500 * (attempt + 1));
    }
  }
}

const extractLocs = (xml) =>
  [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map((m) => m[1].trim());

async function getProductUrls() {
  const xml = await fetchText(SITEMAP);
  const seen = new Set();
  const urls = [];
  for (const loc of extractLocs(xml)) {
    if (!/\/urun\//i.test(loc)) continue;
    if (seen.has(loc)) continue;
    seen.add(loc);
    urls.push(loc);
    if (urls.length >= POOL) break;
  }
  return urls;
}

function fromJsonLd(html) {
  for (const m of html.matchAll(
    /<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi,
  )) {
    let j;
    try {
      j = JSON.parse(m[1].trim());
    } catch {
      continue;
    }
    const nodes = Array.isArray(j) ? j : j['@graph'] || [j];
    for (const n of nodes) {
      const t = n['@type'];
      if (t === 'Product' || (Array.isArray(t) && t.includes('Product'))) {
        const off = Array.isArray(n.offers) ? n.offers[0] : n.offers;
        const image = Array.isArray(n.image) ? n.image.find(Boolean) : n.image;
        return {
          title: clean(n.name),
          price: parsePrice(off?.price ?? off?.lowPrice),
          currency: (off?.priceCurrency || 'TRY').toUpperCase(),
          image,
          sku: (off?.sku || n.sku || n.productID || n.mpn || n.gtin13 || '').toString().trim(),
          inStock: /InStock/i.test(off?.availability || ''),
          desc: clean(n.description),
        };
      }
    }
  }
  return null;
}

function absImage(img) {
  if (!img) return undefined;
  if (/^https:\/\//i.test(img)) return img;
  if (/^http:\/\//i.test(img)) return 'https://' + img.slice(7);
  if (img.startsWith('//')) return 'https:' + img;
  if (img.startsWith('/')) return ORIGIN + img;
  return undefined;
}

async function main() {
  const t0 = Date.now();
  mkdirSync(OUT_DIR, { recursive: true });
  console.log(`Vitaminler scrape — hedef ${LIMIT} ürün (in-stock only)\n`);

  const productUrls = await getProductUrls();
  console.log(`▸ sitemapseo'dan ${productUrls.length} /urun/ URL toplandı (pool)`);
  if (!productUrls.length) throw new Error('sitemap product URL yok');

  const out = [];
  const seenExt = new Set();
  let miss = 0;
  let oos = 0;
  let idx = 0;
  let done = false;

  async function worker() {
    while (!done && idx < productUrls.length) {
      const url = productUrls[idx++];
      let html;
      try {
        html = await fetchText(url);
      } catch {
        miss++;
        continue;
      }
      const e = fromJsonLd(html);
      if (!e || !e.title || !e.price) {
        miss++;
        continue;
      }
      if (!e.inStock) {
        oos++;
        continue;
      }
      const image = absImage(e.image);
      if (!image) {
        miss++;
        continue;
      }
      let externalId = e.sku;
      if (!externalId) {
        // fall back to the trailing numeric productID in the slug
        externalId = url.replace(/\/$/, '').split('-').pop();
      }
      if (!externalId || seenExt.has(externalId)) continue;
      seenExt.add(externalId);
      if (done) break;
      out.push({
        id: `reklamaction-${OFFER_ID}-${externalId}`,
        source: 'reklamaction',
        feedId: OFFER_ID,
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
        availability: 'in stock',
        donationRate: DONATION_RATE,
      });
      if (out.length % 100 === 0) {
        console.log(`  … ${out.length} in-stock | miss ${miss} | oos ${oos} | scanned ${idx}`);
      }
      if (out.length >= LIMIT) done = true;
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  const final = out.slice(0, LIMIT);
  writeFileSync(OUT_FILE, JSON.stringify(final, null, 2));
  const dur = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(
    `\n✅ ${final.length} ürün yazıldı → ${OUT_FILE}  (miss ${miss}, out-of-stock ${oos}, ${dur}s)`,
  );
  if (final[0]) {
    const p = final[0];
    console.log(`   örnek: ${p.title} — ₺${p.price}\n   img: ${p.imageLink}\n   url: ${p.productUrl}`);
  }
}

main().catch((e) => {
  console.error('HATA:', e.message);
  process.exit(1);
});
