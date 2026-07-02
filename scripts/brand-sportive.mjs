#!/usr/bin/env node
/**
 * Sportive (sportive.com.tr) ürün scraper — hangel.org / ReklamAction offer_id 1603.
 *
 * Platform: Akinon "Project Zero" (Next.js storefront + REST API on api.akinoncloud.com).
 *
 * NEDEN SITEMAP DEĞİL:
 *   Storefront /sitemap.xml Next.js middleware ile rewrite ediliyor ve düz XML yerine
 *   SPA/hata HTML'i dönüyor (200 ama içerik HTML). Bunun yerine Akinon PZ'nin ürün-liste
 *   JSON API'si kullanılıyor:
 *     https://sportive.api.akinoncloud.com/<kategori>/?limit=48&page=N
 *   "tum-urunler" kategorisi tüm katalogu kapsıyor (6445 ürün / 135 sayfa). Tek JSON çağrısı
 *   başına 48 ürün + fiyat + stok + mutlak CDN görsel + absolute_url veriyor; ürün başına
 *   ayrı HTML fetch GEREKMİYOR → çok hızlı.
 *
 * Ürün alanları: pk / sku / base_code, name, price (satış), retail_price (liste), in_stock,
 *   stock, currency_type, productimage_set[].image (mutlak HTTPS CDN), absolute_url.
 *
 * productUrl BAĞIŞ korumalı ReklamAction deep-link'e sarılır (ad.reklm.com).
 *
 * Usage:  node scripts/brand-sportive.mjs [limit]   (default 1000)
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, 'out');
const OUT_FILE = resolve(OUT_DIR, 'ra-sportive.json');

// ── ReklamAction / hangel.org ──
const SOURCE = 'reklamaction';
const OFFER_ID = '1603';
const FEED_ID = '1603';
const AFF_ID = '35329';
const TRACK = 'ad.reklm.com';
const DONATION_RATE = 6.5;
const BRAND_NAME = 'Sportive';

// ── Akinon ──
const SITE = 'https://www.sportive.com.tr';
const API = 'https://sportive.api.akinoncloud.com';
const CATEGORY = 'tum-urunler'; // tüm katalog
const PAGE_SIZE = 48;

const LIMIT = parseInt(process.argv[2] || '1000', 10);
const CONCURRENCY = 10;

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const HEADERS = {
  'User-Agent': UA,
  Accept: 'application/json',
  'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8',
  'pz-locale': 'tr',
  'pz-currency': 'TL',
};

async function fetchJson(url, { retries = 3 } = {}) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { headers: HEADERS, redirect: 'follow' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('json')) throw new Error(`non-json (${ct})`);
      return await res.json();
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
    }
  }
}

function toNumber(v) {
  if (v == null) return null;
  if (typeof v === 'number') return isFinite(v) ? v : null;
  const n = parseFloat(String(v).replace(/[^\d.,]/g, '').replace(',', '.'));
  return isFinite(n) ? n : null;
}

function clean(s) {
  return (s || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

// Sadece mutlak HTTPS görselleri kabul et (spec: absolute & HTTP200 yüklenir).
function firstActiveImage(imageSet) {
  if (!Array.isArray(imageSet)) return null;
  const active = imageSet
    .filter((i) => i && i.image && i.status !== 'passive')
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const chosen = (active[0] || imageSet.find((i) => i && i.image));
  let u = chosen && chosen.image;
  if (!u) return null;
  u = String(u).trim();
  if (u.startsWith('//')) u = 'https:' + u;
  u = u.replace(/^http:\/\//i, 'https://');
  return /^https:\/\//i.test(u) ? u : null;
}

function absUrl(path) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return SITE + (path.startsWith('/') ? path : '/' + path);
}

function deepLink(dest) {
  return `https://${TRACK}/aff_c?offer_id=${OFFER_ID}&aff_id=${AFF_ID}&url=${encodeURIComponent(dest)}`;
}

function mapProduct(p) {
  if (!p || !p.in_stock) return null; // in-stock only
  const externalId = p.sku ? String(p.sku) : p.pk ? String(p.pk) : p.base_code ? String(p.base_code) : null;
  if (!externalId) return null;

  const title = clean(p.name);
  const imageLink = firstActiveImage(p.productimage_set);
  const productPath = absUrl(p.absolute_url);
  // Fiyat: müşterinin ödediği güncel satış fiyatı (bağış hesabı için doğru olan).
  const price = toNumber(p.price) ?? toNumber(p.retail_price);

  if (!title || price == null || !imageLink || !productPath) return null;

  let currency = String(p.currency_type || 'TRY').toUpperCase();
  if (currency === 'TL') currency = 'TRY';

  const desc =
    (p.attributes && (p.attributes.description || p.attributes.aciklama)) ||
    (p.extra_attributes && p.extra_attributes.description) ||
    '';

  return {
    id: `${SOURCE}-${OFFER_ID}-${externalId}`,
    source: SOURCE,
    feedId: FEED_ID,
    offerId: OFFER_ID,
    brandId: null,
    brandName: BRAND_NAME,
    externalId,
    title,
    description: clean(desc),
    price,
    salePrice: null,
    currency,
    imageLink,
    productUrl: deepLink(productPath),
    availability: 'in stock',
    donationRate: DONATION_RATE,
  };
}

async function fetchPage(page) {
  const url = `${API}/${CATEGORY}/?limit=${PAGE_SIZE}&page=${page}`;
  const data = await fetchJson(url);
  return {
    products: Array.isArray(data.products) ? data.products : [],
    pagination: data.pagination || {},
  };
}

async function main() {
  const started = Date.now();
  mkdirSync(OUT_DIR, { recursive: true });
  console.log(`▸ ${BRAND_NAME} — Akinon PZ API üzerinden ürün toplanıyor (offer ${OFFER_ID})...`);

  // İlk sayfa: toplam sayfa sayısını öğren.
  const first = await fetchPage(1);
  const numPages = first.pagination.num_pages || 1;
  const totalCount = first.pagination.total_count || 0;
  console.log(`  katalog: ${totalCount} ürün, ${numPages} sayfa (${PAGE_SIZE}/sayfa)`);

  const products = [];
  const byId = new Set();
  let skipped = 0;
  let errored = 0;

  const ingest = (rawList) => {
    for (const raw of rawList) {
      if (products.length >= LIMIT) break;
      const m = mapProduct(raw);
      if (!m) { skipped++; continue; }
      if (byId.has(m.id)) continue;
      byId.add(m.id);
      products.push(m);
    }
  };

  // Sayfa 1'i işle.
  ingest(first.products);

  // Kalan sayfaları concurrency ile çek. Hedefe ulaşınca dur.
  const pages = [];
  for (let p = 2; p <= numPages; p++) pages.push(p);

  let idx = 0;
  let stop = products.length >= LIMIT;
  const worker = async () => {
    while (!stop && idx < pages.length) {
      const page = pages[idx++];
      try {
        const { products: list } = await fetchPage(page);
        ingest(list);
      } catch (err) {
        errored++;
      }
      if (products.length >= LIMIT) stop = true;
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  writeFileSync(OUT_FILE, JSON.stringify(products.slice(0, LIMIT), null, 2));

  const dur = ((Date.now() - started) / 1000).toFixed(1);
  console.log(`\n── ÖZET ──`);
  console.log(`  ${BRAND_NAME}: ${products.length} ürün (skip ${skipped}, page-err ${errored})`);
  console.log(`  süre: ${dur}s`);
  console.log(`  → ${OUT_FILE}`);
  if (products[0]) console.log(`  sample: ${JSON.stringify(products[0])}`);
}

main().catch((e) => {
  console.error('FATAL', e);
  process.exit(1);
});
