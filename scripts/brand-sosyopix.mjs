#!/usr/bin/env node
// Brand scraper: Sosyopix (sosyopix.com — personalized gifts / photo products) for hangel.org
// Network: ReklamAction — tracking domain ad.reklm.com, aff_id 35329, offer_id 62411, donationRate 10
//
// WHY THE GENERIC SCRAPER FAILED:
//   - The site is a custom .NET (aspx) storefront. There is NO Akinon/Ticimax JSON API,
//     NO __NEXT_DATA__, and the sitemap.xml contains ONLY category pages (…-c-<id>),
//     never individual product URLs.
//   - Product pages DO carry schema.org data, but the Product node is nested inside a
//     WebPage → mainEntity → offers.itemOffered[0] structure (not a top-level @type:Product),
//     and that ld+json block is INVALID (unescaped newlines inside customer reviewBody),
//     so JSON.parse throws. Generic extractors that look for a parseable top-level
//     Product node find nothing.
//
// WORKING METHOD (this file):
//   1) Discovery: read sitemap.xml → 64 category URLs (…-c-<id>). Fetch each category
//      page and scrape product links matching /<slug>-p-<numericId>. Union + dedupe by id.
//      (No working ?page= pagination — categories render a fixed grid; the union of all
//       categories yields >1000 unique products on this catalog.)
//   2) Extraction: fetch each product page and pull fields from the schema.org "offers"
//      block with targeted regex (robust against the invalid JSON):
//        price          → offers.price ("249.90") with priceCurrency:"TRY"
//        availability   → offers.availability (…/InStock)
//        sku/externalId → "sku":"419" (also equals the -p-<id> in the URL; unique)
//        title          → mainEntity.offers.name / itemOffered.name (fallback og:title)
//        description    → offers.description (fallback og:description)
//        image          → first itemOffered image contentUrl (absolute https images.sosyopix.com;
//                         fallback og:image / itemprop=image). Verified HTTP 200.
//   Only in-stock products with price > 0 and an absolute https image are kept.
//   Each productUrl is wrapped in the ReklamAction deep-link (donation preserved).
//
// Usage: node scripts/brand-sosyopix.mjs [limit]   (default 1000)

import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const OFFER_ID = '62411';
const AFF_ID = '35329';
const FEED_ID = '62411';
const BRAND_NAME = 'Sosyopix';
const DONATION_RATE = 10;
const TRACK = 'ad.reklm.com';
const SITE = 'https://www.sosyopix.com';
const TARGET = parseInt(process.argv[2] || '1000', 10);
const CONCURRENCY = Number(process.env.SOSYO_CONCURRENCY) || 12;
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'out', 'ra-sosyopix.json');

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const clean = (s) =>
  (s || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

const deepLink = (dest) =>
  `https://${TRACK}/aff_c?offer_id=${OFFER_ID}&aff_id=${AFF_ID}&url=${encodeURIComponent(dest)}`;

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
      if (res.status === 404) return null;
    } catch {
      /* retry */
    }
    await sleep(400 * (i + 1));
  }
  return null;
}

async function headStatus(url) {
  try {
    const res = await fetch(url, { method: 'HEAD', headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(15000) });
    return res.status;
  } catch {
    return 0;
  }
}

function sitemapLocs(xml) {
  return [...(xml || '').matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map((m) => m[1].trim());
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

const isCategoryUrl = (u) => /^https:\/\/www\.sosyopix\.com\/[a-z0-9-]+-c-\d+$/i.test(u);

function categoryLinksFrom(html) {
  const out = new Set();
  for (const m of (html || '').matchAll(/href="(\/[a-z0-9-]+-c-\d+)"/gi)) out.add(SITE + m[1]);
  return [...out];
}

// ── 1) discovery: sitemap + homepage + one-level subnav → all category URLs ──
async function discoverCategoryUrls() {
  const cats = new Set();
  // sitemap.xml (categories only)
  const idx = await fetchText(`${SITE}/sitemap.xml`);
  for (const loc of sitemapLocs(idx)) if (isCategoryUrl(loc)) cats.add(loc);
  // homepage nav
  const home = await fetchText(`${SITE}/`);
  for (const u of categoryLinksFrom(home)) cats.add(u);
  // one recursion pass: subcategory links found on the currently-known category pages
  const seed = [...cats];
  await pool(seed, CONCURRENCY, async (cat) => {
    const html = await fetchText(cat);
    for (const u of categoryLinksFrom(html)) cats.add(u);
  });
  return [...cats];
}

// product links on a category page: /<slug>-p-<numericId>
function productLinksFrom(html) {
  const out = new Set();
  for (const m of (html || '').matchAll(/href="(\/[a-z0-9-]+-p-\d+)"/gi)) {
    out.add(SITE + m[1]);
  }
  return [...out];
}

// ── 2) extraction from the schema.org offers block (regex-robust) ───────────
function firstMatch(re, s) {
  const m = re.exec(s);
  return m ? m[1] : null;
}

function metaContent(html, key) {
  // property/name/itemprop = key  → content
  let m = new RegExp(
    `<meta[^>]+(?:property|name|itemprop)=["']${key}["'][^>]*content=["']([^"']*)`,
    'i',
  ).exec(html);
  if (m) return m[1];
  m = new RegExp(
    `<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name|itemprop)=["']${key}["']`,
    'i',
  ).exec(html);
  return m ? m[1] : null;
}

function parsePrice(raw) {
  if (raw == null) return null;
  // Product JSON gives dot-decimal ("249.90"); price grid gives "249,90"
  let s = String(raw).trim();
  if (/^\d+\.\d{1,2}$/.test(s)) return parseFloat(s); // already dot-decimal
  s = s.replace(/[^\d.,]/g, '');
  // Turkish format 1.234,56 → 1234.56
  if (/,\d{1,2}$/.test(s)) s = s.replace(/\./g, '').replace(',', '.');
  const n = parseFloat(s);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function extractProduct(html, pageUrl) {
  // Locate the offers block via the anchor "areaServed":"TR" present on real products.
  const anchor = html.indexOf('"areaServed"');
  let price = null;
  let availability = '';
  let offersBlock = '';
  if (anchor >= 0) {
    offersBlock = html.slice(Math.max(0, anchor - 700), anchor + 300);
    price = parsePrice(firstMatch(/"price"\s*:\s*"?([\d.,]+)"?/i, offersBlock));
    availability = firstMatch(/"availability"\s*:\s*"([^"]+)"/i, offersBlock) || '';
  }

  // externalId: numeric id from the -p-<id> URL (guaranteed unique per product).
  const externalId = firstMatch(/-p-(\d+)(?:$|[/?#])/i, pageUrl);

  // title: schema name (mainEntity.offers.name or itemOffered.name) → og:title (strip suffix)
  let title = null;
  const nameNear = firstMatch(
    /"name"\s*:\s*"([^"]+)"\s*,\s*"description"\s*:\s*"[^"]*"\s*,\s*"sku"/i,
    html,
  );
  if (nameNear) title = clean(nameNear);
  if (!title) {
    const og = metaContent(html, 'og:title');
    if (og) title = clean(og.replace(/\s*\|\s*Sosyopix\s*$/i, ''));
  }

  // description: schema description near offers → og:description
  let description =
    clean(firstMatch(/"description"\s*:\s*"([^"]+)"\s*,\s*"sku"/i, html)) ||
    clean(metaContent(html, 'og:description')) ||
    '';

  // image: first Product itemOffered image contentUrl → og:image / itemprop=image
  let image =
    firstMatch(/"image"\s*:\s*\[\s*\{\s*"@type"\s*:\s*"ImageObject"\s*,\s*"contentUrl"\s*:\s*"([^"]+)"/i, html) ||
    metaContent(html, 'og:image') ||
    metaContent(html, 'image');

  return { externalId, title, description, price, availability, image };
}

function buildEntry(p, pageUrl) {
  if (!p.externalId || !p.title || !(p.price > 0)) return null;
  if (!/InStock/i.test(p.availability) || /OutOfStock/i.test(p.availability)) return null;
  let image = (p.image || '').trim();
  if (image.startsWith('//')) image = 'https:' + image;
  if (!/^https:\/\//i.test(image)) return null;

  return {
    id: `reklamaction-${OFFER_ID}-${p.externalId}`,
    source: 'reklamaction',
    feedId: FEED_ID,
    offerId: OFFER_ID,
    brandId: null,
    brandName: BRAND_NAME,
    externalId: p.externalId,
    title: p.title,
    description: p.description || '',
    price: p.price,
    salePrice: null,
    currency: 'TRY',
    imageLink: image,
    productUrl: deepLink(pageUrl),
    availability: 'in stock',
    donationRate: DONATION_RATE,
  };
}

async function main() {
  const t0 = Date.now();
  console.log(`▸ ${BRAND_NAME} — target ${TARGET} (offer ${OFFER_ID}, aff ${AFF_ID})`);
  await mkdir(path.dirname(OUT), { recursive: true });

  // 1) categories from sitemap
  const categories = await discoverCategoryUrls();
  console.log(`  sitemap → ${categories.length} category pages`);

  // 2) collect unique product URLs across all categories
  const productUrls = new Set();
  await pool(categories, CONCURRENCY, async (cat) => {
    const html = await fetchText(cat);
    if (!html) return;
    for (const u of productLinksFrom(html)) productUrls.add(u);
  });
  const urls = [...productUrls];
  console.log(`  discovered ${urls.length} unique product URLs`);

  // 3) fetch product pages, extract, keep in-stock until TARGET
  const seen = new Set();
  const entries = [];
  const CHUNK = 120;
  let miss = 0;
  let oos = 0;
  for (let i = 0; i < urls.length && entries.length < TARGET; i += CHUNK) {
    const batch = urls.slice(i, i + CHUNK);
    const parsed = await pool(batch, CONCURRENCY, async (url) => {
      const html = await fetchText(url);
      if (!html) return { miss: true };
      const p = extractProduct(html, url);
      const e = buildEntry(p, url);
      if (!e) return { oos: p.availability && !/InStock/i.test(p.availability), miss: !p.title || !p.price };
      return { entry: e };
    });
    for (const r of parsed) {
      if (!r) continue;
      if (r.entry) {
        if (seen.has(r.entry.id)) continue;
        seen.add(r.entry.id);
        entries.push(r.entry);
        if (entries.length >= TARGET) break;
      } else if (r.oos) {
        oos++;
      } else if (r.miss) {
        miss++;
      }
    }
    process.stdout.write(
      `\r  parsed ${Math.min(i + CHUNK, urls.length)}/${urls.length} → ${entries.length} good (miss ${miss}, oos ${oos})`,
    );
  }
  console.log('');

  await writeFile(OUT, JSON.stringify(entries, null, 2));
  const dur = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`  wrote ${entries.length} products → ${OUT}`);
  console.log(`  DURATION ${dur}s`);

  if (entries[0]) {
    const s = entries[0];
    console.log(`  sample: ${s.title} — ₺${s.price}`);
    console.log(`  image:  ${s.imageLink}`);
    console.log(`  url:    ${s.productUrl}`);
  }

  // image spot-check (first 3)
  const checks = await Promise.all(entries.slice(0, 3).map((e) => headStatus(e.imageLink)));
  console.log(`  image HTTP status (first 3): ${checks.join(' ')}`);
}

main().catch((e) => {
  console.error('ERROR:', e.message);
  process.exit(1);
});
