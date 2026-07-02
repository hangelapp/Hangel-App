#!/usr/bin/env node
// Brand scraper: Koton (ReklamAction offer_id 5533)
// Site: https://www.koton.com  (Akinon commerce platform)
// Network: ReklamAction -> tracking domain ad.reklm.com, aff_id 35329, offer_id 5533
//
// Product discovery: sitemap.xml (sitemapindex) -> sitemap-products-*.xml.gz (S3-hosted,
//   gzip). fetch() may auto-decompress; only gunzip when gzip magic bytes present.
// Extraction: JSON-LD @graph -> Product node
//   (name / image (mncdn absolute HTTPS) / sku(=gtin13 barcode) / description /
//    offers.price / priceCurrency / availability). Fallback: og:* meta.
//   IN-STOCK ONLY (schema.org/InStock).
// Output: scripts/out/ra-koton.json
//
// Usage: node scripts/brand-koton.mjs [limit]   (default 1000)

import { writeFileSync, mkdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import https from 'node:https';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, 'out');
const OUT_FILE = resolve(OUT_DIR, 'ra-koton.json');

const OFFER_ID = '5533';
const AFF_ID = '35329';
const TRACK = 'ad.reklm.com';
const BRAND_NAME = 'Koton';
const DONATION_RATE = 4.5;
const SITEMAP_INDEX = 'https://www.koton.com/sitemap.xml';

const LIMIT = parseInt(process.argv[2] || '1000', 10);
// Koton (Akinon) rate-limits aggressive crawls: too many concurrent requests trigger
// a temporary IP-level HTTP 405 block. Keep concurrency modest + a small per-request
// delay so nearly every fetch succeeds (yield ~= in-stock rate, not fetch-failure rate).
const CONCURRENCY = parseInt(process.env.KOTON_CONCURRENCY || '6', 10);
const REQ_DELAY_MS = parseInt(process.env.KOTON_DELAY_MS || '120', 10);
// Over-fetch: some products are out-of-stock / lack JSON-LD, so crawl a larger pool.
// Almost all product pages are in-stock, so a ~2x pool comfortably yields LIMIT.
const POOL = Math.max(LIMIT * 3, 3000);

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const HEADERS = {
  'User-Agent': UA,
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
  'Sec-Ch-Ua': '"Not/A)Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"',
  'Sec-Ch-Ua-Mobile': '?0',
  'Sec-Ch-Ua-Platform': '"macOS"',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Upgrade-Insecure-Requests': '1',
  Referer: 'https://www.koton.com/',
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

// Parse a price that may be a number, a standard-decimal string ("1499.99"),
// or a Turkish-formatted string ("1.499,99"). Returns a Number or null.
function parsePrice(raw) {
  if (raw == null) return null;
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null;
  let s = String(raw).trim().replace(/[^\d.,]/g, '');
  if (!s) return null;
  const hasComma = s.includes(',');
  const hasDot = s.includes('.');
  if (hasComma && hasDot) {
    // Turkish grouping: dot=thousands, comma=decimal → strip dots, comma→dot
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (hasComma) {
    // comma is decimal separator
    s = s.replace(',', '.');
  }
  // else: dot is decimal separator (standard) — leave as is
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchText(url, { binary = false, retries = 4 } = {}) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { headers: HEADERS, redirect: 'follow' });
      if (!res.ok) {
        // 405/429/503 = rate-limit / temporary block → back off harder and retry.
        const rateLimited = res.status === 405 || res.status === 429 || res.status === 503;
        if (rateLimited && attempt < retries) {
          await sleep(1500 * (attempt + 1) + Math.floor(Math.random() * 500));
          continue;
        }
        throw new Error(`HTTP ${res.status}`);
      }
      if (binary) return Buffer.from(await res.arrayBuffer());
      return await res.text();
    } catch (err) {
      if (attempt === retries) throw err;
      await sleep(500 * (attempt + 1));
    }
  }
}

const extractLocs = (xml) =>
  [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map((m) => m[1].trim());

async function getSitemapXml(sm) {
  if (sm.endsWith('.gz')) {
    const buf = await fetchText(sm, { binary: true });
    if (buf.length > 1 && buf[0] === 0x1f && buf[1] === 0x8b) {
      return gunzipSync(buf).toString('utf8');
    }
    return buf.toString('utf8');
  }
  return fetchText(sm);
}

async function getProductUrls() {
  const indexXml = await fetchText(SITEMAP_INDEX);
  const children = extractLocs(indexXml);
  const productSitemaps = children.filter((u) => /sitemap-products/i.test(u));
  if (productSitemaps.length === 0) {
    throw new Error('No product sitemap found in index');
  }
  const urls = [];
  const seen = new Set();
  for (const sm of productSitemaps) {
    if (urls.length >= POOL) break;
    let xml;
    try {
      xml = await getSitemapXml(sm);
    } catch {
      continue;
    }
    for (const loc of extractLocs(xml)) {
      if (!seen.has(loc)) {
        seen.add(loc);
        urls.push(loc);
      }
      if (urls.length >= POOL) break;
    }
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
        const priceRaw = off?.price ?? off?.lowPrice;
        return {
          title: clean(n.name),
          price: parsePrice(priceRaw),
          currency: (off?.priceCurrency || 'TRY').toUpperCase(),
          image: Array.isArray(n.image) ? n.image[0] : n.image,
          sku: n.sku || n.gtin13 || n.mpn || null,
          inStock: /InStock/i.test(off?.availability || ''),
          desc: clean(n.description),
        };
      }
    }
  }
  return null;
}

function fromMeta(html) {
  const meta = (name) => {
    const a = html.match(
      new RegExp(
        `<meta[^>]+(?:property|name)=["']${name}["'][^>]+content=["']([^"']*)`,
        'i',
      ),
    );
    if (a) return a[1];
    const b = html.match(
      new RegExp(
        `<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${name}["']`,
        'i',
      ),
    );
    return b ? b[1] : null;
  };
  const title = meta('og:title') || html.match(/<title>([^<]+)/i)?.[1];
  if (!title) return null;
  const priceRaw = meta('product:price:amount') || meta('og:price:amount');
  let price = parsePrice(priceRaw);
  const availMeta = meta('product:availability') || meta('og:availability') || '';
  return {
    title: clean(title),
    price,
    currency: (meta('og:price:currency') || 'TRY').toUpperCase(),
    image: meta('og:image'),
    sku: null,
    inStock: /instock|in stock/i.test(availMeta), // conservative: only if meta says so
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
  mkdirSync(OUT_DIR, { recursive: true });
  console.log(`Koton scrape — hedef ${LIMIT} ürün (in-stock only)\n`);

  const productUrls = await getProductUrls();
  console.log(`▸ sitemap'ten ${productUrls.length} ürün URL'i toplandı (pool)`);

  const out = [];
  const seenExt = new Set();
  let miss = 0;
  let oos = 0;
  let idx = 0;
  let done = false;

  async function worker() {
    while (!done && idx < productUrls.length) {
      const url = productUrls[idx++];
      if (REQ_DELAY_MS > 0) await sleep(REQ_DELAY_MS);
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
      if (!e.inStock) {
        oos++;
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
        externalId = parts[parts.length - 1];
      }
      if (seenExt.has(externalId)) continue;
      seenExt.add(externalId);
      if (out.length % 50 === 0) {
        console.log(`  … ${out.length} in-stock | miss ${miss} | oos ${oos} | scanned ${idx}`);
      }
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
      if (out.length >= LIMIT) done = true;
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  const final = out.slice(0, LIMIT);
  writeFileSync(OUT_FILE, JSON.stringify(final, null, 2));
  console.log(
    `\n✅ ${final.length} ürün yazıldı → ${OUT_FILE}  (miss ${miss}, out-of-stock ${oos})`,
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
