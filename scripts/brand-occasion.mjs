#!/usr/bin/env node
// Brand scraper: Occasion (occasion.com.tr) — hangel.org / Affocean offer_id 2040.
// Site: https://www.occasion.com.tr  (Akinon commerce, Next.js "occasionnext95" storefront)
// donationRate: 6
//
// WHY THIS SHAPE (differs from converse/dsdamat sitemap crawlers):
//   The public /sitemap.xml on this storefront is rewritten to a legacy HTML shell
//   (no <loc> URLs), and per-product JSON-LD crawling would need thousands of page
//   fetches. Instead the Akinon Next.js storefront exposes the SAME data the listing
//   page consumes via `/list/?format=json`:
//     { pagination:{current_page,num_pages,page_size,total_count}, products:[...] }
//   Each product object carries everything we need in ONE request per 120 items:
//     pk (unique), sku, base_code, name, absolute_url (relative, e.g. /slug-pk/),
//     price (number), retail_price (list price), currency_type ("try"),
//     in_stock (bool), stock (int), productimage_set[].image (absolute HTTPS CDN URL).
//   So we page the JSON API concurrently — no per-product HTML fetch — which is fast.
//
//   Product page URL = BASE + absolute_url; wrapped in the Affocean donation deep-link
//   (ad.afftrck.com). Images come straight from akinoncloudcdn (absolute HTTPS).
//   In-stock only (in_stock === true && price > 0).
//
// Output: scripts/out/ao-occasion.json  (up to LIMIT objects)
// Usage: node scripts/brand-occasion.mjs [limit]   (default 1000)

import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, 'out');
const OUT_FILE = resolve(OUT_DIR, 'ao-occasion.json');

const OFFER_ID = '2040';
const AFF_ID = '7873';
const TRACK = 'ad.afftrck.com';
const BRAND_NAME = 'Occasion';
const DONATION_RATE = 6;
const BASE = 'https://www.occasion.com.tr';
const LIST_JSON = `${BASE}/list/?format=json`;
const PAGE_SIZE = 120; // API-fixed
const CONCURRENCY = 10;

const LIMIT = parseInt(process.argv[2] || '1000', 10);

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const HEADERS = {
  'User-Agent': UA,
  Accept: 'application/json, text/plain, */*',
  'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8',
};

const clean = (s) =>
  (s == null ? '' : String(s))
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    // strip zero-width chars sometimes appended to Akinon fields
    .replace(/[​-‏﻿]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const deepLink = (dest) =>
  `https://${TRACK}/aff_c?offer_id=${OFFER_ID}&aff_id=${AFF_ID}&url=${encodeURIComponent(dest)}`;

async function fetchJson(url, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { headers: HEADERS, redirect: 'follow' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
    }
  }
}

function toNumber(v) {
  if (v == null) return null;
  if (typeof v === 'number') return isFinite(v) ? v : null;
  const n = parseFloat(String(v).replace(/[^\d.,-]/g, '').replace(',', '.'));
  return isFinite(n) ? n : null;
}

function firstImage(p) {
  const set = Array.isArray(p.productimage_set) ? p.productimage_set : [];
  const active = set
    .filter((i) => i && i.image && (i.status ? i.status === 'active' : true))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const pick = (active[0] || set[0] || {}).image;
  if (!pick) return null;
  let u = String(pick).trim();
  if (u.startsWith('//')) u = 'https:' + u;
  return u.replace(/^http:\/\//i, 'https://');
}

function toCanonical(p) {
  const inStock = p.in_stock === true && (p.stock == null || Number(p.stock) > 0);
  if (!inStock) return { __skip: 'oos' };

  const price = toNumber(p.price);
  if (price == null || price <= 0) return { __skip: 'noprice' };

  const externalId = String(p.sku || p.base_code || p.pk || '').trim();
  if (!externalId) return { __skip: 'noid' };

  const title = clean(p.name);
  if (!title) return { __skip: 'notitle' };

  const imageLink = firstImage(p);
  if (!imageLink) return { __skip: 'noimg' };

  const rel = String(p.absolute_url || '').trim();
  if (!rel) return { __skip: 'nourl' };
  const productPage = BASE + (rel.startsWith('/') ? rel : '/' + rel);

  let currency = (p.currency_type || 'TRY').toUpperCase();
  if (currency === 'TL') currency = 'TRY';

  const description = clean(
    p.attributes?.integration_erp_icerik ||
      p.attributes?.integration_urun_detay ||
      p.extra_data?.description ||
      title,
  );

  return {
    id: `affocean-${OFFER_ID}-${externalId}`,
    source: 'affocean',
    feedId: OFFER_ID,
    offerId: OFFER_ID,
    brandId: null,
    brandName: BRAND_NAME,
    externalId,
    title,
    description,
    price,
    salePrice: null,
    currency,
    imageLink,
    productUrl: deepLink(productPage),
    availability: 'in stock',
    donationRate: DONATION_RATE,
  };
}

async function main() {
  const t0 = Date.now();
  mkdirSync(OUT_DIR, { recursive: true });
  console.log(`▸ ${BRAND_NAME} — hedef ${LIMIT} ürün (Akinon list JSON API)`);

  // Page 1 gives us pagination totals.
  const first = await fetchJson(`${LIST_JSON}&page=1`);
  const numPages = first?.pagination?.num_pages || 1;
  const total = first?.pagination?.total_count ?? '?';
  console.log(`  toplam ${total} ürün, ${numPages} sayfa (page_size ${PAGE_SIZE})`);

  const out = [];
  const seen = new Set();
  const skip = { oos: 0, noprice: 0, noid: 0, notitle: 0, noimg: 0, nourl: 0 };
  let errored = 0;

  const ingest = (products) => {
    for (const p of products || []) {
      if (out.length >= LIMIT) return;
      const c = toCanonical(p);
      if (c.__skip) {
        skip[c.__skip] = (skip[c.__skip] || 0) + 1;
        continue;
      }
      if (seen.has(c.id)) continue;
      seen.add(c.id);
      out.push(c);
    }
  };

  ingest(first.products);

  // Remaining pages, fetched with a bounded worker pool; stop early once we hit LIMIT.
  let nextPage = 2;
  let stop = out.length >= LIMIT;
  async function worker() {
    while (!stop) {
      const page = nextPage++;
      if (page > numPages) return;
      let j;
      try {
        j = await fetchJson(`${LIST_JSON}&page=${page}`);
      } catch {
        errored++;
        continue;
      }
      ingest(j.products);
      if (out.length >= LIMIT) stop = true;
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  writeFileSync(OUT_FILE, JSON.stringify(out, null, 2));
  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`\n── ÖZET ──`);
  console.log(`  ${BRAND_NAME}: ${out.length} ürün  (${secs}s)`);
  console.log(
    `  skip: oos=${skip.oos} noprice=${skip.noprice} noimg=${skip.noimg} nourl=${skip.nourl} notitle=${skip.notitle} noid=${skip.noid}, page-err=${errored}`,
  );
  console.log(`  → ${OUT_FILE}`);
  if (out[0]) {
    const p = out[0];
    console.log(`  sample: ${p.title} — ₺${p.price} | ${p.imageLink}`);
    console.log(`          ${p.productUrl}`);
  }
}

main().catch((e) => {
  console.error('FATAL', e);
  process.exit(1);
});
