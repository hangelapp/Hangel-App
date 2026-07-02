#!/usr/bin/env node
// Brand scraper: Xiaomi (ReklamAction offer_id 62394)
// Site: https://www.mi.com/tr  (Xiaomi Turkey storefront — React SPA behind Akamai)
// Network: ReklamAction -> tracking domain ad.reklm.com, aff_id 35329, offer_id 62394
//
// FASTEST WORKING METHOD (site pages are Akamai-flagged HARD — headless Chrome gets
//   "Access Denied"; plain curl of HTML pages works but the product grid loads
//   client-side and is not in the server HTML). The BREAKTHROUGH: the storefront's
//   own JSON commerce gateway
//     https://go.buy.mi.com/tr/v2/cms/category/navigation/products?cate_id=<id>
//   is a PUBLIC JSON API and is NOT behind Akamai — it answers plain fetch/curl with a
//   real Chrome UA + Referer https://www.mi.com/tr/product-list/ cleanly (errno:0).
//   The API returns up to ~5 products per category id. Xiaomi TR is a curated
//   storefront (~170 unique SKUs, NOT the 16.7k global catalog), so scanning the full
//   valid cate_id band (empirically 3615..5740) and deduping by spuID yields the ENTIRE
//   in-stock TR catalog with price/image/stock/product-url — no per-product fetch, no
//   headless browser, no Akamai challenge.
//
// Product object shape (fields used):
//   spuID                 -> "SPU..." unique product key (externalId)
//   name                  -> title
//   imgUrl                -> "//i02.appmifile.com/..." (protocol-relative -> https)
//   salePrice             -> numeric selling price in TRY (integer, e.g. 5499)
//   originPrice           -> numeric list price in TRY
//   isOutOfStock          -> boolean; false = in stock
//   buttons[0].gotoUrl    -> canonical https product page URL (deep-link target)
//   product_ksp[]         -> short bullet specs (used to build description)
//
// Output: scripts/out/ra-xiaomi.json
// Usage:  node scripts/brand-xiaomi.mjs [limit]   (default 1000)

import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, 'out');
const OUT_FILE = resolve(OUT_DIR, 'ra-xiaomi.json');

const OFFER_ID = '62394';
const AFF_ID = '35329';
const TRACK = 'ad.reklm.com';
const BRAND_NAME = 'Xiaomi';
const DONATION_RATE = 2;

const LIMIT = parseInt(process.argv[2] || '1000', 10);

// Empirically observed valid cate_id band for mi.com/tr (a 1..6000 sweep found all
// 76 populated categories within 3615..5740). We scan a slightly padded band and dedupe
// by spuID; padding costs only extra 404s and future-proofs against catalog growth.
const CATE_LO = 3600;
const CATE_HI = 5800;
const CONCURRENCY = 30;

const API = (cateId) =>
  `https://go.buy.mi.com/tr/v2/cms/category/navigation/products?cate_id=${cateId}&page=1&page_size=100`;

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const HEADERS = {
  'User-Agent': UA,
  Accept: 'application/json, text/plain, */*',
  'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
  Referer: 'https://www.mi.com/tr/product-list/',
  Origin: 'https://www.mi.com',
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();

const deepLink = (dest) =>
  `https://${TRACK}/aff_c?offer_id=${OFFER_ID}&aff_id=${AFF_ID}&url=${encodeURIComponent(dest)}`;

async function fetchCategory(cateId, { retries = 3 } = {}) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(API(cateId), { headers: HEADERS, redirect: 'follow' });
      if (!res.ok) {
        if ((res.status === 429 || res.status >= 500) && attempt < retries) {
          await sleep(800 * (attempt + 1));
          continue;
        }
        return null;
      }
      const j = await res.json();
      if (j && j.errno === 0 && j.data && Array.isArray(j.data.products)) {
        return j.data.products;
      }
      return null; // errno != 0 (e.g. "cate_id is required" / empty category)
    } catch {
      if (attempt === retries) return null;
      await sleep(500 * (attempt + 1));
    }
  }
  return null;
}

// Absolute https image from a protocol-relative / http url.
function absImage(u) {
  const s = clean(u);
  if (!s) return undefined;
  if (s.startsWith('//')) return `https:${s}`;
  if (s.startsWith('http://')) return `https://${s.slice(7)}`;
  if (s.startsWith('https://')) return s;
  return undefined;
}

function toRecord(p) {
  const externalId = clean(p.spuID);
  if (!externalId) return null;

  // in-stock only
  if (p.isOutOfStock === true) return null;

  const title = clean(p.name);
  if (!title) return null;

  const image = absImage(p.imgUrl);
  if (!image || !/^https:\/\//.test(image)) return null;

  // salePrice is numeric TRY (integer). Fall back to originPrice if needed.
  let price = Number(p.salePrice);
  if (!Number.isFinite(price) || price <= 0) price = Number(p.originPrice);
  if (!Number.isFinite(price) || price <= 0) return null;

  // Canonical product page URL (deep-link destination).
  let dest = clean(p.buttons?.[0]?.gotoUrl);
  if (dest && dest.startsWith('//')) dest = `https:${dest}`;
  if (!dest || !/^https:\/\/www\.mi\.com\/tr\/product\//.test(dest)) {
    // fallback: derive from spu is not reliable; require a real product url
    return null;
  }

  const ksp = Array.isArray(p.product_ksp) ? p.product_ksp.filter(Boolean).map(clean) : [];
  const description = clean([title, ...ksp].join(' — ')) || title;

  return {
    id: `reklamaction-${OFFER_ID}-${externalId}`,
    source: 'reklamaction',
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
    imageLink: image,
    productUrl: deepLink(dest),
    availability: 'in stock',
    donationRate: DONATION_RATE,
  };
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  console.log(
    `Xiaomi scrape — hedef ${LIMIT} ürün (in-stock only) via go.buy.mi.com navigation/products API\n`,
  );

  const ids = [];
  for (let i = CATE_LO; i <= CATE_HI; i++) ids.push(i);

  const out = [];
  const seen = new Set();
  let validCats = 0;
  let rawSeen = 0;

  let idx = 0;
  async function worker() {
    while (idx < ids.length) {
      if (out.length >= LIMIT) return;
      const cateId = ids[idx++];
      const products = await fetchCategory(cateId);
      if (!products || !products.length) continue;
      validCats++;
      for (const p of products) {
        rawSeen++;
        const rec = toRecord(p);
        if (!rec) continue;
        if (seen.has(rec.externalId)) continue;
        seen.add(rec.externalId);
        out.push(rec);
        if (out.length >= LIMIT) return;
      }
    }
  }

  const t0 = Date.now();
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  const secs = ((Date.now() - t0) / 1000).toFixed(1);

  const final = out.slice(0, LIMIT);
  writeFileSync(OUT_FILE, JSON.stringify(final, null, 2));
  console.log(
    `✅ ${final.length} ürün yazıldı → ${OUT_FILE}\n` +
      `   ${validCats} dolu kategori | ${rawSeen} ham kayıt tarandı | ${secs}s`,
  );
  if (final[0]) {
    const p = final[0];
    console.log(
      `\n   örnek: ${p.title} — ₺${p.price}\n   sku: ${p.externalId}\n   img: ${p.imageLink}\n   url: ${p.productUrl}`,
    );
  }
}

main().catch((e) => {
  console.error('HATA:', e.message);
  process.exit(1);
});
