#!/usr/bin/env node
// Brand scraper: Doremusic (do-re.com.tr) for hangel.org / Affocean offer_id 2794
//
// The site has NO sitemap.xml / sitemap_index.xml (both 404) and no sitemap in robots.txt.
// Category landing pages only show curated carousels. The real paginated product grid lives
// on the search endpoint: /ara?q=<query>&sayfa=<N> (24 product-cards per page).
// Each product page carries a full schema.org JSON-LD Product block with name, image[] (absolute
// CDN https URLs), sku, price, priceCurrency, availability, brand. We collect URLs from search,
// then fetch each product page and extract JSON-LD (fallback: OpenGraph + HTML price pattern).
//
// Output: scripts/out/affocean-doremusic.json
// Usage:  node scripts/brand-doremusic.mjs [target]

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, 'out', 'affocean-doremusic.json');

const OFFER_ID = '2794';
const AFF_ID = '7873';
const BRAND_NAME = 'Doremusic';
const BASE = 'https://www.do-re.com.tr';
const TARGET = parseInt(process.argv[2] || '200', 10);

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// Broad query set covering doremusic's catalogue so we gather a diverse, large URL pool.
const QUERIES = [
  'gitar', 'piyano', 'davul', 'klavye', 'mikrofon', 'amfi', 'kulaklik',
  'perkusyon', 'bas', 'keman', 'saksofon', 'flut', 'pedal', 'zil',
  'hoparlor', 'stand', 'kablo', 'synthesizer', 'ukulele', 'trompet',
];
const MAX_PAGES = 10;
const CONCURRENCY = 6;

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
      });
      if (res.status === 200) return await res.text();
      if (res.status === 404) return null;
    } catch (e) {
      // retry
    }
    await sleep(400 * (i + 1));
  }
  return null;
}

// ---- URL collection from search grid ----
async function collectUrls() {
  const urls = new Set();
  for (const q of QUERIES) {
    for (let page = 1; page <= MAX_PAGES; page++) {
      if (urls.size >= TARGET * 2) break; // enough pool (extra for failures)
      const html = await fetchText(`${BASE}/ara?q=${encodeURIComponent(q)}&sayfa=${page}`);
      if (!html) break;
      const matches = [...html.matchAll(/href="((?:https:\/\/www\.do-re\.com\.tr)?\/[^"?]+)"\s+class="product-card"/g)];
      if (matches.length === 0) break;
      let added = 0;
      for (const m of matches) {
        let u = m[1];
        if (u.startsWith('/')) u = BASE + u;
        // skip non-product editorial slugs
        if (/\/(gitar-videolari|magaza|ara|blog|kampanya)/.test(u)) continue;
        if (!urls.has(u)) {
          urls.add(u);
          added++;
        }
      }
      // if the page returned only already-seen products, likely past the end
      if (added === 0) break;
      await sleep(120);
    }
    if (urls.size >= TARGET * 2) break;
    process.stderr.write(`  collected ${urls.size} urls (after q=${q})\n`);
  }
  return [...urls];
}

// ---- Extraction ----
function extractFromJsonLd(html) {
  const blocks = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)];
  for (const b of blocks) {
    let data;
    try {
      data = JSON.parse(b[1].trim());
    } catch {
      continue;
    }
    const arr = Array.isArray(data) ? data : [data];
    for (const node of arr) {
      const type = node['@type'];
      const isProduct = type === 'Product' || (Array.isArray(type) && type.includes('Product'));
      if (!isProduct) continue;
      const offers = Array.isArray(node.offers) ? node.offers[0] : node.offers;
      let image = node.image;
      if (Array.isArray(image)) image = image[0];
      const priceRaw = offers?.price ?? node.price;
      const price = priceRaw != null ? parseFloat(String(priceRaw).replace(/[^\d.,]/g, '').replace(/\.(?=\d{3}\b)/g, '').replace(',', '.')) : null;
      const avail = offers?.availability || '';
      return {
        title: node.name || null,
        description: node.description || '',
        price: Number.isFinite(price) ? price : null,
        image: typeof image === 'string' ? image : null,
        sku: node.sku || node.productID || node.mpn || null,
        currency: offers?.priceCurrency || 'TRY',
        availability: /InStock/i.test(avail) ? 'in stock' : 'in stock',
      };
    }
  }
  return null;
}

function metaContent(html, prop) {
  const re = new RegExp(`<meta[^>]*(?:property|name)="${prop}"[^>]*content="([^"]*)"`, 'i');
  const m = html.match(re);
  return m ? m[1] : null;
}

function extractFallback(html, url) {
  const title = metaContent(html, 'og:title') || metaContent(html, 'title');
  let image = metaContent(html, 'og:image');
  const description = metaContent(html, 'og:description') || metaContent(html, 'description') || '';
  let price = null;
  const pMeta = metaContent(html, 'product:price:amount');
  if (pMeta) price = parseFloat(pMeta.replace(/[^\d.,]/g, '').replace(',', '.'));
  if (!Number.isFinite(price)) {
    const m = html.match(/([\d]{1,3}(?:[.\s]\d{3})*(?:,\d{2})?)\s*(?:TL|₺)/);
    if (m) {
      price = parseFloat(m[1].replace(/[.\s]/g, '').replace(',', '.'));
    }
  }
  if (image && image.startsWith('//')) image = 'https:' + image;
  if (image && image.startsWith('/')) image = BASE + image;
  if (!title || !image) return null;
  return {
    title: title.replace(/\s*\|\s*doremusic.*$/i, '').trim(),
    description,
    price: Number.isFinite(price) ? price : null,
    image,
    sku: null,
    currency: 'TRY',
    availability: 'in stock',
  };
}

function externalIdFromUrl(url) {
  return url.replace(BASE + '/', '').replace(/\/$/, '');
}

function buildProduct(url, ext) {
  const externalId = ext.sku || externalIdFromUrl(url);
  const deep = `https://ad.afftrck.com/aff_c?offer_id=${OFFER_ID}&aff_id=${AFF_ID}&url=${encodeURIComponent(url)}`;
  return {
    id: `affocean-${OFFER_ID}-${externalId}`,
    source: 'affocean',
    feedId: OFFER_ID,
    offerId: OFFER_ID,
    brandId: null,
    brandName: BRAND_NAME,
    externalId: String(externalId),
    title: ext.title,
    description: ext.description || '',
    price: ext.price,
    salePrice: null,
    currency: ext.currency || 'TRY',
    imageLink: ext.image,
    productUrl: deep,
    availability: ext.availability || 'in stock',
  };
}

async function scrapeProduct(url) {
  const html = await fetchText(url);
  if (!html) return null;
  let ext = extractFromJsonLd(html);
  if (!ext || !ext.title || !ext.image) ext = extractFallback(html, url);
  if (!ext || !ext.title || !ext.image) return null;
  // must have absolute https image and a numeric price
  if (!/^https:\/\//.test(ext.image)) return null;
  if (!Number.isFinite(ext.price) || ext.price <= 0) return null;
  return buildProduct(url, ext);
}

async function runPool(items, worker, concurrency) {
  const results = [];
  let idx = 0;
  const runners = Array.from({ length: concurrency }, async () => {
    while (idx < items.length) {
      const i = idx++;
      const r = await worker(items[i], i);
      if (r) results.push(r);
    }
  });
  await Promise.all(runners);
  return results;
}

async function main() {
  process.stderr.write('Doremusic scrape starting...\n');
  const urls = await collectUrls();
  process.stderr.write(`Total unique product URLs collected: ${urls.length}\n`);

  const seen = new Set();
  const products = await runPool(
    urls,
    async (url) => {
      const p = await scrapeProduct(url);
      if (!p) return null;
      if (seen.has(p.id)) return null;
      seen.add(p.id);
      return p;
    },
    CONCURRENCY
  );

  // trim to target but keep all if fewer
  const final = products.slice(0, TARGET);
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(final, null, 2));
  process.stderr.write(`\nWrote ${final.length} products -> ${OUT}\n`);
  if (final[0]) process.stderr.write(`Sample: ${final[0].title} | ${final[0].price} ${final[0].currency}\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
