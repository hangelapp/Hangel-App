#!/usr/bin/env node
// Brand scraper: Toyzz Shop (ReklamAction offer_id 57791)
// Site: https://www.toyzzshop.com  (Vite/React SPA — server HTML is an empty shell,
//   so the generic HTML/JSON-LD/__NEXT_DATA__ scraper finds NOTHING. That is why the
//   generic scraper failed.)
//
// METHOD (fastest working): hidden JSON API at https://core.toyzzshop.com/api.
//   Reverse-engineered from the app bundle (/assets/index-*.js). The API requires the
//   header  Positive-Client: toyzzshop  (otherwise it returns a Symfony debug dump).
//   Bulk listing endpoints return FULL product objects (no per-product fetch needed):
//     GET customlists/{slug}/products?page=N&limit=48
//   Working listing slugs (pre-filtered to in-stock): `indirimli-urunler` (deep, ~35
//   pages) and `en-yeniler`. Each product object already carries everything we need:
//     id / serial_id (sku), title, price.original (NUMBER), image_url (absolute https,
//     HTTP200), slug (-> product page URL), quantity / virtual_stock (stock).
//   (Category/brand slugs route differently — `list::`/`brand::` — and are NOT needed
//   to reach the target, so we stick to the two proven bulk lists.)
//
// Output: scripts/out/ra-toyzzshop.json
// Usage:  node scripts/brand-toyzzshop.mjs [limit]   (default 1000)

import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, 'out');
const OUT_FILE = resolve(OUT_DIR, 'ra-toyzzshop.json');

const OFFER_ID = '57791';
const AFF_ID = '35329';
const TRACK = 'ad.reklm.com';
const BRAND_NAME = 'Toyzz Shop';
const DONATION_RATE = 7.2;
const SITE = 'https://www.toyzzshop.com';
const API = 'https://core.toyzzshop.com/api';

// Bulk listing custom-lists that work on the API and are pre-filtered to in-stock.
const LISTS = ['indirimli-urunler', 'en-yeniler'];
const PAGE_LIMIT = 48; // matches the app's own page size
const MAX_PAGES = 60; // safety ceiling per list

const LIMIT = parseInt(process.argv[2] || '1000', 10);

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const HEADERS = {
  'User-Agent': UA,
  Accept: 'application/json, text/plain, */*',
  'Content-Type': 'application/json',
  'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
  // CRITICAL: without this header the API returns a Symfony debug dump, not JSON.
  'Positive-Client': 'toyzzshop',
  device: 'desktop',
  Origin: SITE,
  Referer: SITE + '/',
};

const clean = (s) =>
  (s || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&Ccedil;/g, 'C')
    .replace(/&ccedil;/g, 'c')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const deepLink = (dest) =>
  `https://${TRACK}/aff_c?offer_id=${OFFER_ID}&aff_id=${AFF_ID}&url=${encodeURIComponent(dest)}`;

// Guarantee an absolute, https, loadable image url.
const absImage = (src) => {
  if (!src) return null;
  let u = String(src).trim();
  if (u.startsWith('//')) u = 'https:' + u;
  else if (u.startsWith('/')) u = SITE + u;
  else if (u.startsWith('http://')) u = 'https://' + u.slice(7);
  return u.startsWith('https://') ? u : null;
};

// price.original is already a clean number in this API; guard anyway.
const parsePrice = (raw) => {
  if (raw == null) return null;
  if (typeof raw === 'number') return Number.isFinite(raw) && raw > 0 ? raw : null;
  const n = parseFloat(String(raw).replace(/[^\d.]/g, ''));
  return Number.isFinite(n) && n > 0 ? n : null;
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJson(url, tries = 4) {
  for (let attempt = 0; attempt < tries; attempt++) {
    try {
      const res = await fetch(url, { headers: HEADERS, redirect: 'follow' });
      if (res.status === 429 || res.status === 503) {
        await sleep(1200 * (attempt + 1) + Math.random() * 400);
        continue;
      }
      if (!res.ok) return null;
      const txt = await res.text();
      if (!txt.trim().startsWith('{')) return null; // Symfony/HTML error page
      return JSON.parse(txt);
    } catch {
      if (attempt === tries - 1) return null;
      await sleep(500 * (attempt + 1));
    }
  }
  return null;
}

function toCanonical(p) {
  // In-stock guard: the listing is pre-filtered, but be defensive.
  const qty = Number(p.quantity ?? 0);
  const vstock = Number(p.virtual_stock ?? 0);
  const inStock = qty > 0 || vstock >= 1;
  if (!inStock) return null;

  const price = parsePrice(p.price?.original ?? p.price?.whole);
  if (!price) return null;

  const image = absImage(p.image_url);
  if (!image) return null;

  const slug = p.slug;
  if (!slug) return null;

  // externalId: prefer the immutable numeric serial (sku); fall back to id/product_code.
  const externalId = String(
    p.serial_id || p.id || p.product_code || '',
  ).trim();
  if (!externalId) return null;

  const title = clean(p.product_name || p.title || p.product_name_new);
  if (!title) return null;

  const productPage = `${SITE}/${slug}`;
  const desc =
    clean(p.serial_title && p.serial_title !== '-' ? p.serial_title : '') ||
    `${title} — Toyzz Shop`;

  return {
    id: `reklamaction-${OFFER_ID}-${externalId}`,
    source: 'reklamaction',
    feedId: OFFER_ID,
    offerId: OFFER_ID,
    brandId: null,
    brandName: BRAND_NAME,
    externalId,
    title,
    description: desc,
    price,
    salePrice: null,
    currency: 'TRY',
    imageLink: image,
    productUrl: deepLink(productPage),
    availability: 'in stock',
    donationRate: DONATION_RATE,
  };
}

async function main() {
  const t0 = Date.now();
  mkdirSync(OUT_DIR, { recursive: true });
  console.log(`[toyzzshop] hedef ${LIMIT} ürün (in-stock only) — hidden JSON API\n`);

  const out = [];
  const seen = new Set();
  let scanned = 0;

  outer: for (const list of LISTS) {
    for (let page = 1; page <= MAX_PAGES; page++) {
      const url = `${API}/customlists/${list}/products?page=${page}&limit=${PAGE_LIMIT}`;
      const data = await getJson(url);
      const products = data?.payload?.products;
      if (!Array.isArray(products) || products.length === 0) {
        console.log(`  [${list}] page ${page}: boş → liste bitti`);
        break; // this list is exhausted
      }
      for (const p of products) {
        scanned++;
        const cp = toCanonical(p);
        if (!cp) continue;
        if (seen.has(cp.externalId)) continue;
        seen.add(cp.externalId);
        out.push(cp);
      }
      console.log(
        `  [${list}] page ${page}: +${products.length} tarandı → toplam ${out.length}/${LIMIT}`,
      );
      if (out.length >= LIMIT) break outer;
    }
  }

  const final = out.slice(0, LIMIT);
  writeFileSync(OUT_FILE, JSON.stringify(final, null, 2));

  const dur = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(
    `\n✅ ${final.length} ürün yazıldı → ${OUT_FILE}  (tarandı ${scanned}, ${dur}s)`,
  );
  if (final[0]) {
    const p = final[0];
    console.log(
      `   örnek: ${p.title} — ₺${p.price}\n   img: ${p.imageLink}\n   url: ${p.productUrl}`,
    );
  }
}

main().catch((e) => {
  console.error('[toyzzshop] HATA:', e.message);
  process.exit(1);
});
