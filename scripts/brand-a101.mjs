#!/usr/bin/env node
// Brand scraper: A101 (GelirOrtakları offer_id 6663)
// Site: https://www.a101.com.tr  (A101 Kapıda — Next.js App Router / RSC)
// Network: GelirOrtakları -> tracking domain tr.rdrtr.com, aff_id 37081, offer_id 6663
//
// FASTEST WORKING METHOD (generic scraper failed; no public sitemap — /sitemap.xml is
//   403 CloudFront-blocked; no __NEXT_DATA__ JSON; RSC App Router):
//   A101 "Kapıda" category pages embed the FULL product list inside the streamed RSC
//   flight payload (self.__next_f.push([1,"...json..."])). ONE category page yields
//   ~600–750 products with price/stock/images — no per-product fetch needed.
//   We fetch a handful of top-level /kapida/<category> pages, decode the flight strings
//   (JSON.parse of the quoted string handles \uXXXX / UTF-8 correctly), then extract
//   each balanced product object ({"id":"<numeric>","isEnabled":...}) that carries a
//   product seoUrl (…_p-<id>). IN-STOCK ONLY (stock > 0).
//
// Product object shape (relevant fields):
//   id                         -> numeric SKU (externalId, unique)
//   attributes.name            -> title
//   attributes.brand           -> manufacturer brand (NOT used as brandName; brandName='A101')
//   attributes.seoUrl          -> canonical product page URL (deep-link target)
//   attributes.barcodes[]      -> EAN barcodes (used in description)
//   images[] {imageType:'product', url} -> absolute HTTPS CDN image (HTTP 200)
//   price.normal / price.discounted     -> price in KURUŞ (÷100). selling = discounted||normal
//   stock                      -> integer; >0 = in stock
//
// Output: scripts/out/go-a101.json
// Usage:  node scripts/brand-a101.mjs [limit]   (default 1000)

import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, 'out');
const OUT_FILE = resolve(OUT_DIR, 'go-a101.json');

const OFFER_ID = '6663';
const AFF_ID = '37081';
const TRACK = 'tr.rdrtr.com';
const BRAND_NAME = 'A101';
const DONATION_RATE = 3;

const LIMIT = parseInt(process.argv[2] || '1000', 10);

// Top-level "Kapıda" (home-delivery) categories. Each embeds a large product list.
// Ordered widest-first; we stop once LIMIT unique in-stock products are collected.
const CATEGORIES = [
  'kisisel-bakim',
  'sut-urunleri-kahvaltilik',
  'temizlik-urunleri',
  'temel-gida',
  'atistirmalik',
  'et-tavuk-sarkuteri',
  'su-icecek',
  'kagit-urunleri',
  'meyve-sebze',
  'dondurma',
  'donuk-hazir-yemek-meze',
  'firindan',
];

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
  'Sec-Fetch-User': '?1',
  'Upgrade-Insecure-Requests': '1',
  Referer: 'https://www.a101.com.tr/',
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();

const deepLink = (dest) =>
  `https://${TRACK}/aff_c?offer_id=${OFFER_ID}&aff_id=${AFF_ID}&url=${encodeURIComponent(dest)}`;

async function fetchText(url, { retries = 4 } = {}) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { headers: HEADERS, redirect: 'follow' });
      if (!res.ok) {
        const rateLimited = res.status === 403 || res.status === 429 || res.status === 503;
        if (rateLimited && attempt < retries) {
          await sleep(1200 * (attempt + 1) + Math.floor(Math.random() * 400));
          continue;
        }
        throw new Error(`HTTP ${res.status}`);
      }
      return await res.text();
    } catch (err) {
      if (attempt === retries) throw err;
      await sleep(600 * (attempt + 1));
    }
  }
}

// Concatenate & decode every RSC flight string in the page. JSON.parse of the quoted
// chunk correctly resolves \uXXXX escapes -> real UTF-8 (Turkish chars intact).
function decodeFlight(html) {
  const re = /self\.__next_f\.push\(\[1,"((?:[^"\\]|\\.)*)"\]\)/gs;
  let m;
  let blob = '';
  while ((m = re.exec(html))) {
    try {
      blob += JSON.parse('"' + m[1] + '"');
    } catch {
      /* skip malformed chunk */
    }
  }
  return blob;
}

// Walk the decoded blob and pull out each balanced product object. Product objects
// begin with `{"id":"<digits>","isEnabled":` and must reference a product page (_p-).
function extractProducts(blob) {
  const out = [];
  const startRe = /\{"id":"\d+","isEnabled":/g;
  let m;
  while ((m = startRe.exec(blob))) {
    const start = m.index;
    let depth = 0;
    let inStr = false;
    let esc = false;
    let end = -1;
    for (let k = start; k < blob.length; k++) {
      const ch = blob[k];
      if (esc) {
        esc = false;
        continue;
      }
      if (ch === '\\') {
        esc = true;
        continue;
      }
      if (ch === '"') {
        inStr = !inStr;
        continue;
      }
      if (inStr) continue;
      if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) {
          end = k + 1;
          break;
        }
      }
    }
    if (end < 0) continue;
    const raw = blob.slice(start, end);
    if (!raw.includes('_p-')) continue; // must be a real product with a product page
    try {
      out.push(JSON.parse(raw));
    } catch {
      /* skip */
    }
  }
  return out;
}

function productImage(p) {
  const imgs = Array.isArray(p.images) ? p.images : [];
  const prod = imgs.find((i) => i && i.imageType === 'product' && /^https:\/\//.test(i.url || ''));
  if (prod) return prod.url;
  // fallback: first https image that is not a badge
  const any = imgs.find(
    (i) => i && i.imageType !== 'badge' && /^https:\/\//.test(i.url || ''),
  );
  return any ? any.url : undefined;
}

function toRecord(p) {
  const a = p.attributes || {};
  const seoUrl = a.seoUrl;
  if (!seoUrl || !/^https:\/\/www\.a101\.com\.tr\//.test(seoUrl)) return null;
  if (!(Number(p.stock) > 0)) return null; // in-stock only

  const externalId = String(p.id || '').trim();
  if (!externalId) return null;

  const title = clean(a.name || p.name);
  if (!title) return null;

  const image = productImage(p);
  if (!image) return null;

  // price.* is in kuruş; selling price = discounted (if a real discount) else normal.
  const normal = Number(p.price?.normal);
  const discounted = Number(p.price?.discounted);
  let priceKurus = Number.isFinite(discounted) && discounted > 0 ? discounted : normal;
  if (!Number.isFinite(priceKurus) || priceKurus <= 0) return null;
  const price = Math.round(priceKurus) / 100; // e.g. 14900 -> 149

  const barcodes = Array.isArray(a.barcodes) ? a.barcodes.filter(Boolean) : [];
  const brand = clean(a.brand);
  const descParts = [];
  if (brand) descParts.push(brand);
  descParts.push(title);
  if (barcodes[0]) descParts.push(`Barkod: ${barcodes[0]}`);
  const description = clean(descParts.join(' — '));

  return {
    id: `gelirortaklari-${OFFER_ID}-${externalId}`,
    source: 'gelirortaklari',
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
    productUrl: deepLink(seoUrl),
    availability: 'in stock',
    donationRate: DONATION_RATE,
  };
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  console.log(`A101 scrape — hedef ${LIMIT} ürün (in-stock only) via Kapıda kategori RSC\n`);

  const out = [];
  const seen = new Set();
  let catsUsed = 0;

  for (const cat of CATEGORIES) {
    if (out.length >= LIMIT) break;
    const url = `https://www.a101.com.tr/kapida/${cat}`;
    let html;
    try {
      html = await fetchText(url);
    } catch (e) {
      console.log(`  ! ${cat}: fetch fail (${e.message})`);
      continue;
    }
    catsUsed++;
    const blob = decodeFlight(html);
    const prods = extractProducts(blob);
    let added = 0;
    let oos = 0;
    for (const p of prods) {
      const rec = toRecord(p);
      if (!rec) {
        if (p.attributes?.seoUrl && !(Number(p.stock) > 0)) oos++;
        continue;
      }
      if (seen.has(rec.externalId)) continue;
      seen.add(rec.externalId);
      out.push(rec);
      added++;
      if (out.length >= LIMIT) break;
    }
    console.log(
      `  ▸ ${cat}: parsed ${prods.length} | +${added} yeni | oos ${oos} | toplam ${out.length}`,
    );
    await sleep(250);
  }

  const final = out.slice(0, LIMIT);
  writeFileSync(OUT_FILE, JSON.stringify(final, null, 2));
  console.log(
    `\n✅ ${final.length} ürün yazıldı → ${OUT_FILE}  (${catsUsed} kategori tarandı)`,
  );
  if (final[0]) {
    const p = final[0];
    console.log(
      `   örnek: ${p.title} — ₺${p.price}\n   img: ${p.imageLink}\n   url: ${p.productUrl}`,
    );
  }
}

main().catch((e) => {
  console.error('HATA:', e.message);
  process.exit(1);
});
