#!/usr/bin/env node
/**
 * Sporthink (hangel.org / ReklamAction offer_id 60536) ürün toplayıcı.
 *
 * Sporthink Next.js tabanlı, ~18k ürünlük büyük katalog. Ürün sayfalarında
 * veri JSON-LD "ProductGroup" objesinde bulunuyor (name/sku/image[]/hasVariant[]).
 * Fiyat + stok durumu her variant'ın offers alanında. Görseller zaten mutlak
 * (sporthink.sm.mncdn.com). Her ürün linki ReklamAction deep-link'e sarılır →
 * BAĞIŞ korunur.
 *
 * Ürün URL'leri: https://www.sporthink.com.tr/products.xml
 * Çıktı: scripts/out/ra-sporthink.json
 *
 * Kullanım:
 *   node scripts/brand-sporthink.mjs           # hedef 1000
 *   node scripts/brand-sporthink.mjs 500       # hedef 500
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, 'out', 'ra-sporthink.json');

const OFFER = '60536';
const AFF_ID = '35329';
const TRACK = 'ad.reklm.com';
const BRAND = 'Sporthink';
const BASE = 'https://www.sporthink.com.tr';
const SITEMAP = `${BASE}/products.xml`;
const DONATION_RATE = 6;
const TARGET = Number(process.argv[2] || 1000);
const CONC = 10;

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const HEADERS = {
  'User-Agent': UA,
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8',
};

const clean = (s) =>
  (s || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\\(['"])/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const deepLink = (dest) =>
  `https://${TRACK}/aff_c?offer_id=${OFFER}&aff_id=${AFF_ID}&url=${encodeURIComponent(dest)}`;

const absImage = (src) => {
  if (!src) return null;
  let u = String(src).trim();
  if (u.startsWith('//')) u = 'https:' + u;
  else if (u.startsWith('/')) u = BASE + u;
  else if (u.startsWith('http://')) u = u.replace('http://', 'https://');
  return u.startsWith('https://') ? u : null;
};

const toNumber = (v) => {
  if (v == null) return null;
  const n = parseFloat(String(v).replace(/[^\d.,-]/g, '').replace(/,(\d{2})$/, '.$1').replace(/,/g, ''));
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
};

async function get(url, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, { headers: HEADERS, redirect: 'follow' });
      if (r.ok) return { status: r.status, ok: true, body: await r.text() };
      if (r.status === 404) return { status: 404, ok: false, body: '' };
    } catch {
      /* retry */
    }
    await new Promise((res) => setTimeout(res, 300 * (i + 1)));
  }
  return { status: 0, ok: false, body: '' };
}

const locs = (xml) =>
  [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map((m) => m[1].trim());

// Bir ürün sayfasından JSON-LD ProductGroup / Product objesini bul
function findProductNode(html) {
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html))) {
    let j;
    try {
      j = JSON.parse(m[1].trim());
    } catch {
      continue;
    }
    const nodes = Array.isArray(j) ? j : j['@graph'] ? j['@graph'] : [j];
    for (const node of nodes) {
      if (!node || typeof node !== 'object') continue;
      const t = node['@type'];
      const isGroup = t === 'ProductGroup' || (Array.isArray(t) && t.includes('ProductGroup'));
      const isProduct = t === 'Product' || (Array.isArray(t) && t.includes('Product'));
      if (isGroup || isProduct) return node;
    }
  }
  return null;
}

// Kanonik ürün üret (yoksa null). In-stock değilse null.
function extract(url, html) {
  const pg = findProductNode(html);
  if (!pg) return null;

  const title = clean(pg.name);
  const externalId = clean(pg.sku || pg.mpn || pg['@id']) || url.split('/').pop();
  const img = absImage(Array.isArray(pg.image) ? pg.image[0] : pg.image);

  // Variant'lardan fiyat + stok topla
  const variants = Array.isArray(pg.hasVariant) ? pg.hasVariant : [];
  let price = null;
  let inStock = false;

  const collectOffer = (offers, availDefault) => {
    const off = Array.isArray(offers) ? offers[0] : offers;
    if (!off) return;
    const p = toNumber(off.price);
    const avail = String(off.availability || availDefault || '');
    const isIn = /InStock/i.test(avail) && !/OutOfStock/i.test(avail);
    if (isIn) {
      inStock = true;
      if (p != null && p > 0 && (price == null || p < price)) price = p;
    }
    // stokta olan yoksa yine de bir fiyat referansı tut
    if (price == null && p != null && p > 0) price = p;
  };

  if (variants.length) {
    for (const v of variants) collectOffer(v.offers);
  }
  // ProductGroup düzeyinde offers / tekil Product
  if (pg.offers) collectOffer(pg.offers);

  const description =
    clean(pg.description).slice(0, 500) ||
    `${title} — Sporthink'te özel fırsatlarla.`;

  if (!title || price == null || price <= 0 || !img || !inStock) return null;

  return {
    externalId: String(externalId),
    title,
    description,
    price,
    imageLink: img,
  };
}

async function main() {
  const t0 = Date.now();
  console.log(`[sporthink] hedef ${TARGET} ürün — sitemap ${SITEMAP}`);

  const sm = await get(SITEMAP);
  if (!sm.ok) throw new Error('products.xml alınamadı');
  const all = locs(sm.body).filter((u) => u.startsWith(BASE + '/'));
  console.log(`[sporthink] sitemap ürün URL: ${all.length}`);

  // Yeterince aday al (stokta olmayan / eksik olacaklar için pay bırak)
  const budget = Math.min(all.length, Math.ceil(TARGET * 1.8) + 100);
  const candidates = all.slice(0, budget);
  console.log(`[sporthink] fetch bütçesi: ${candidates.length}`);

  const out = [];
  const byExt = new Set();
  let i = 0;
  let processed = 0;

  async function worker() {
    while (i < candidates.length && out.length < TARGET) {
      const url = candidates[i++];
      processed++;
      const r = await get(url);
      if (!r.ok) continue;
      const e = extract(url, r.body);
      if (!e) continue;
      if (byExt.has(e.externalId)) continue;
      byExt.add(e.externalId);
      out.push({
        id: `reklamaction-${OFFER}-${e.externalId}`,
        source: 'reklamaction',
        feedId: OFFER,
        offerId: OFFER,
        brandId: null,
        brandName: BRAND,
        externalId: e.externalId,
        title: e.title,
        description: e.description,
        price: e.price,
        salePrice: null,
        currency: 'TRY',
        imageLink: e.imageLink,
        productUrl: deepLink(url),
        availability: 'in stock',
        donationRate: DONATION_RATE,
      });
      if (out.length % 50 === 0) {
        console.log(`[sporthink] ${out.length}/${TARGET} (işlenen ${processed})`);
      }
    }
  }

  await Promise.all(Array.from({ length: CONC }, worker));

  mkdirSync(path.dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(out.slice(0, TARGET), null, 2));
  const dur = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(
    `[sporthink] BİTTİ → ${out.length} ürün (${processed} sayfa, ${dur}s) → ${OUT}`,
  );
}

main().catch((e) => {
  console.error('[sporthink] HATA', e);
  process.exit(1);
});
