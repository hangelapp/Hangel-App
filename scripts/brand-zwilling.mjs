#!/usr/bin/env node
// Brand scraper: Zwilling (Turkish store https://www.zwilling.com/tr)
// SFCC/Demandware site. No JSON-LD on PDP, but SSR microdata (itemprop) + og:image.
// URL pool: /tr product sitemap  +  every /tr category page paginated
//   (SFCC ?start=N&sz=32&format=page-element, 32 products/page, start steps by 32).
// Fetches each PDP with Chrome UA, extracts fields, keeps only in-stock TRY items.
// Output schema matches scripts/out/affocean-*.json (donation deep-link via ad.afftrck.com).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, 'out');
const OUT_FILE = path.join(OUT_DIR, 'affocean-zwilling.json');

const OFFER_ID = '2831';
const AFF_ID = '7873';
const BRAND_NAME = 'Zwilling';
const DONATION_RATE = 4.48;

const ORIGIN = 'https://www.zwilling.com';
const SITEMAP = `${ORIGIN}/tr/sitemap_0-product.xml`;
const CATEGORY_SITEMAP = `${ORIGIN}/tr/sitemap_2-category.xml`;

const TARGET = Number(process.argv[2] || 1000);
const CONCURRENCY = 10;
const PAGE_SIZE = 32; // SFCC hard-caps page-element grid at 32 regardless of sz

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const HEADERS = {
  'User-Agent': UA,
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8',
};

function decodeEntities(s) {
  if (!s) return s;
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&ccedil;/g, 'ç').replace(/&Ccedil;/g, 'Ç')
    .replace(/&ouml;/g, 'ö').replace(/&Ouml;/g, 'Ö')
    .replace(/&uuml;/g, 'ü').replace(/&Uuml;/g, 'Ü')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCodePoint(parseInt(n, 16)));
}

function stripTags(s) {
  return decodeEntities((s || '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

async function fetchText(url, tries = 4) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: HEADERS, redirect: 'follow' });
      if (res.ok) return await res.text();
      if (res.status === 404 || res.status === 410) return null;
    } catch (e) {
      // retry
    }
    await new Promise((r) => setTimeout(r, 400 * (i + 1)));
  }
  return null;
}

// Absolute-ise a /tr/... product href and keep only real PDP urls.
function normalizeProductUrl(href) {
  if (!href) return null;
  let u = decodeEntities(href.trim());
  if (u.startsWith('//')) u = 'https:' + u;
  else if (u.startsWith('/')) u = ORIGIN + u;
  if (!/^https?:\/\/(www\.)?zwilling\.com\//i.test(u)) return null;
  u = u.split('#')[0].split('?')[0];
  if (!/\/tr\//.test(u) || !/\.html$/.test(u)) return null;
  return u;
}

function extractProductLinks(html) {
  const out = [];
  if (!html) return out;
  const re = /href="([^"]*\/tr\/[^"]*\.html)"/gi;
  let m;
  while ((m = re.exec(html))) {
    const u = normalizeProductUrl(m[1]);
    if (u) out.push(u);
  }
  return out;
}

function extractProduct(html, url) {
  if (!html) return null;

  const m = (re) => {
    const x = html.match(re);
    return x ? x[1] : null;
  };

  // price (SFCC microdata: sales price)
  const priceRaw = m(/itemprop="price"\s+content="([\d.]+)"/);
  const price = priceRaw != null ? Number(priceRaw) : null;

  const currency = m(/itemprop="priceCurrency"\s+content="([^"]*)"/);

  // title: full brand + product name from h1
  let title =
    stripTags(m(/<h1[^>]*js-pdp-brand-product-name[^>]*>([\s\S]*?)<\/h1>/i)) || null;
  if (!title) {
    const brand = stripTags(m(/<meta[^>]*itemprop="name"[^>]*content="([^"]*)"/i));
    const pname = stripTags(m(/<span[^>]*js-pdp-product-name[^>]*>([\s\S]*?)<\/span>/i));
    title = [brand, pname].filter(Boolean).join(' ').trim() || null;
  }
  if (!title) title = stripTags(m(/<meta[^>]+property="og:title"[^>]+content="([^"]*)"/i));

  // image: og:image (absolute, static.demandware)
  let image =
    m(/<meta[^>]+property="og:image"[^>]+content="([^"]*)"/i) ||
    m(/<meta[^>]+content="([^"]*)"[^>]+property="og:image"/i);
  if (image) image = decodeEntities(image.trim());
  if (image && image.startsWith('//')) image = 'https:' + image;

  // description: meta description
  let desc = m(/<meta[^>]+name="description"[^>]+content="([^"]*)"/i);
  desc = desc ? decodeEntities(desc).trim() : '';

  // externalId: data-product-id (== sitemap id)
  const pid =
    m(/data-product-id="([^"]*)"/) ||
    (url.match(/\/([^/]+)\.html/) || [])[1] ||
    null;

  const availRaw = m(/itemprop="availability"\s+content="([^"]*)"/i) || '';
  const availability = /InStock/i.test(availRaw) ? 'in stock' : 'out of stock';

  if (!pid || !title || price == null || !image) return null;
  if (currency && currency.toUpperCase() !== 'TRY') return null;
  if (!/^https:\/\//i.test(image)) return null;
  if (availability !== 'in stock') return null;

  const deep =
    `https://ad.afftrck.com/aff_c?offer_id=${OFFER_ID}&aff_id=${AFF_ID}&url=` +
    encodeURIComponent(url);

  return {
    id: `affocean-${OFFER_ID}-${pid}`,
    source: 'affocean',
    feedId: OFFER_ID,
    offerId: OFFER_ID,
    brandId: null,
    brandName: BRAND_NAME,
    externalId: pid,
    title,
    description: desc,
    price,
    salePrice: null,
    currency: 'TRY',
    imageLink: image,
    productUrl: deep,
    availability: 'in stock',
    donationRate: DONATION_RATE,
  };
}

// Walk one category, paginating start=0,32,64,... until a page yields no NEW urls.
async function harvestCategory(catUrl, pool) {
  let start = 0;
  let empties = 0;
  const base = catUrl.endsWith('/') ? catUrl : catUrl + '/';
  while (empties < 2 && start < 4000) {
    const url = `${base}?start=${start}&sz=${PAGE_SIZE}&format=page-element`;
    const html = await fetchText(url, 3);
    const links = extractProductLinks(html);
    let added = 0;
    for (const l of links) {
      if (!pool.has(l)) {
        pool.add(l);
        added++;
      }
    }
    // Stop when the grid returns fewer than a page (end of category).
    const gridCount = html ? (html.match(/js-product-tile|product-tile/gi) || []).length : 0;
    if (added === 0) empties++;
    else empties = 0;
    if (gridCount === 0) break;
    start += PAGE_SIZE;
  }
}

async function buildUrlPool() {
  const pool = new Set();

  // 1) Product sitemap
  const xml = await fetchText(SITEMAP);
  if (xml) {
    for (const x of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
      const u = normalizeProductUrl(x[1]);
      if (u) pool.add(u);
    }
  }
  console.log('After sitemap, pool:', pool.size);

  // 2) Category pages (paginated) — widens beyond sitemap (variants etc.)
  const catXml = await fetchText(CATEGORY_SITEMAP);
  const cats = catXml
    ? [...catXml.matchAll(/<loc>([^<]+)<\/loc>/g)]
        .map((x) => decodeEntities(x[1].trim()))
        .filter((u) => /\/tr\//.test(u))
    : [];
  console.log('Category pages to crawl:', cats.length);

  let ci = 0;
  async function catWorker() {
    while (ci < cats.length) {
      const c = cats[ci++];
      await harvestCategory(c, pool);
      if (ci % 25 === 0) console.log(`  categories ${ci}/${cats.length}, pool=${pool.size}`);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, catWorker));

  console.log('After categories, pool:', pool.size);
  return [...pool];
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const t0 = Date.now();

  const urls = await buildUrlPool();
  console.log('Total candidate product URLs:', urls.length);

  const results = [];
  const seen = new Set();
  let idx = 0;

  async function worker() {
    while (idx < urls.length && results.length < TARGET) {
      const url = urls[idx++];
      const html = await fetchText(url);
      const p = extractProduct(html, url);
      if (p && !seen.has(p.externalId)) {
        seen.add(p.externalId);
        results.push(p);
        if (results.length % 50 === 0)
          console.log(`  ...${results.length}/${TARGET} (scanned ${idx}/${urls.length})`);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  results.sort((a, b) => a.externalId.localeCompare(b.externalId));
  fs.writeFileSync(OUT_FILE, JSON.stringify(results, null, 2));
  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`\nWrote ${results.length} in-stock products -> ${OUT_FILE}`);
  console.log(`Scanned ${idx}/${urls.length} candidate URLs in ${secs}s`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
