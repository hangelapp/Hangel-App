#!/usr/bin/env node
// Brand scraper: Kayra (ReklamAction offer_id 62430) — modest fashion
// Site: https://www.kayra.com  (T-Soft e-commerce, ASP.NET Core; Cloudflare)
// Network: ReklamAction -> tracking domain ad.reklm.com, aff_id 35329, offer_id 62430
//
// WHY THIS METHOD (fastest working path found by probing):
//   • sitemap.xml (and every T-Soft/common variant) is intercepted by the SPA router
//     and returns the homepage HTML (0 <loc>) → UNUSABLE.
//   • No __NEXT_DATA__, no public product JSON API. GetFilter POST returns only the
//     filter UI, not products. ?pg=N / path pagination render 0 product cards
//     (server renders exactly 48 cards on page 1; the rest is JS/infinite-scroll).
//   • WORKING: category listing pages render 48 product cards server-side, each with a
//     product deep-link. Harvesting all ~36 top categories yields ~1068 UNIQUE product
//     URLs — enough for the 1000 target. Then each product page carries clean JSON-LD
//     (@type Product: name / sku / image (absolute HTTPS cdn.kayra.com) / offers.price
//     (real selling price, correct decimals) / priceCurrency / availability InStock).
//   • Description enriched from <div class="CardProductData"> (falls back to JSON-LD name).
//   • IN-STOCK ONLY (schema.org/InStock).
// Output: scripts/out/ra-kayra.json
//
// Usage: node scripts/brand-kayra.mjs [limit]   (default 1000)

import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, 'out');
const OUT_FILE = resolve(OUT_DIR, 'ra-kayra.json');

const OFFER_ID = '62430';
const AFF_ID = '35329';
const TRACK = 'ad.reklm.com';
const BRAND_NAME = 'Kayra';
const DONATION_RATE = 5;
const ORIGIN = 'https://www.kayra.com';

const LIMIT = parseInt(process.argv[2] || '1000', 10);
const CONCURRENCY = parseInt(process.env.KAYRA_CONCURRENCY || '8', 10);
const REQ_DELAY_MS = parseInt(process.env.KAYRA_DELAY_MS || '60', 10);

// Top-level categories (harvested from the homepage/mega-menu). Each renders 48
// product cards server-side. Union across all of them is the discovery pool.
const CATEGORIES = [
  'yeni-gelen-urunler', 'elbise', 'tunik', 'bluz-gomlek', 'pantolon', 'ceket',
  'trenckot-kap', 'yelek', 'takim', 'sweatshirt', 'pardesu', 'giy-cik', 'etek',
  'trikolar', 'kaz-tuyu-mont', 'kaban', 'spring-summer-2026', 'canta', 'sal',
  'esarp', 'sapka-bone', 'fular', 'takilar', 'kozmetik', 'kayra-aksesuar',
  'denim', 'buyuk-beden-koleksiyonu', 'davet-elbiseleri', 'office-look', 'basics',
  'kyr-koleksiyon', 'giyim-indirimi', 'aksesuar-indirimi', 'outlet-giyim-indirimi',
  'outlet-aksesuar-indirim', 'sezon-ortasi-indirimi',
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
  'Upgrade-Insecure-Requests': '1',
  Referer: `${ORIGIN}/tr`,
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const clean = (s) =>
  (s || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#xFC;/gi, 'ü')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();

const deepLink = (dest) =>
  `https://${TRACK}/aff_c?offer_id=${OFFER_ID}&aff_id=${AFF_ID}&url=${encodeURIComponent(dest)}`;

// Price may be a number (JSON-LD) or a Turkish-formatted string. Return Number|null.
function parsePrice(raw) {
  if (raw == null) return null;
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null;
  let s = String(raw).trim().replace(/[^\d.,]/g, '');
  if (!s) return null;
  const hasComma = s.includes(',');
  const hasDot = s.includes('.');
  if (hasComma && hasDot) {
    s = s.replace(/\./g, '').replace(',', '.'); // TR grouping: 1.499,99
  } else if (hasComma) {
    s = s.replace(',', '.');
  }
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

async function fetchText(url, { retries = 4 } = {}) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { headers: HEADERS, redirect: 'follow' });
      if (!res.ok) {
        const rateLimited = res.status === 429 || res.status === 503 || res.status === 403;
        if (rateLimited && attempt < retries) {
          await sleep(1500 * (attempt + 1) + Math.floor(Math.random() * 500));
          continue;
        }
        throw new Error(`HTTP ${res.status}`);
      }
      return await res.text();
    } catch (err) {
      if (attempt === retries) throw err;
      await sleep(500 * (attempt + 1));
    }
  }
}

// Extract product page paths from a category listing (server-rendered CardProduct links).
function cardLinks(html) {
  return [
    ...new Set(
      [...html.matchAll(/href="(\/(?:tr)\/[a-z0-9\-]+)"\s+class="CardProduct-image"/gi)].map(
        (m) => m[1],
      ),
    ),
  ];
}

function absImage(img) {
  if (!img) return undefined;
  if (/^https?:\/\//i.test(img)) return img;
  if (img.startsWith('//')) return 'https:' + img;
  if (img.startsWith('/')) return ORIGIN + img;
  return undefined;
}

// Parse JSON-LD Product node.
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
        return {
          title: clean(n.name),
          price: parsePrice(off?.price ?? off?.lowPrice),
          currency: (off?.priceCurrency || 'TRY').toUpperCase(),
          image: absImage(Array.isArray(n.image) ? n.image[0] : n.image),
          sku: n.sku || n.gtin13 || n.mpn || null,
          inStock: /InStock/i.test(off?.availability || ''),
        };
      }
    }
  }
  return null;
}

// Richer description from <div class="CardProductData">…</div>; fallback null.
function detailDescription(html) {
  const m = html.match(/<div class="CardProductData">([\s\S]*?)<\/div>/i);
  if (!m) return null;
  const txt = clean(m[1]);
  return txt && txt.length > 3 ? txt : null;
}

async function discoverUrls() {
  const all = new Set();
  for (const cat of CATEGORIES) {
    if (all.size >= 5000) break;
    let html;
    try {
      html = await fetchText(`${ORIGIN}/tr/${cat}`);
    } catch {
      continue;
    }
    for (const p of cardLinks(html)) all.add(p);
    await sleep(REQ_DELAY_MS);
  }
  return [...all];
}

async function main() {
  const t0 = Date.now();
  mkdirSync(OUT_DIR, { recursive: true });
  console.log(`Kayra scrape — hedef ${LIMIT} ürün (in-stock only)\n`);

  const paths = await discoverUrls();
  console.log(`▸ ${CATEGORIES.length} kategoriden ${paths.length} benzersiz ürün URL'i toplandı`);

  const out = [];
  const seenExt = new Set();
  let miss = 0;
  let oos = 0;
  let idx = 0;
  let done = false;

  async function worker() {
    while (!done && idx < paths.length) {
      const path = paths[idx++];
      const url = ORIGIN + path;
      if (REQ_DELAY_MS > 0) await sleep(REQ_DELAY_MS);
      let html;
      try {
        html = await fetchText(url);
      } catch {
        miss++;
        continue;
      }
      const e = fromJsonLd(html);
      if (!e || !e.title || !e.price || !e.image) {
        miss++;
        continue;
      }
      if (!e.inStock) {
        oos++;
        continue;
      }
      let externalId = String(e.sku || '').trim();
      if (!externalId) {
        const parts = path.replace(/\/$/, '').split('/');
        externalId = parts[parts.length - 1];
      }
      if (seenExt.has(externalId)) continue;
      seenExt.add(externalId);

      const desc = detailDescription(html) || e.title;

      out.push({
        id: `reklamaction-${OFFER_ID}-${externalId}`,
        source: 'reklamaction',
        feedId: OFFER_ID,
        offerId: OFFER_ID,
        brandId: null,
        brandName: BRAND_NAME,
        externalId,
        title: e.title,
        description: desc,
        price: e.price,
        salePrice: null,
        currency: e.currency || 'TRY',
        imageLink: e.image,
        productUrl: deepLink(url),
        availability: 'in stock',
        donationRate: DONATION_RATE,
      });
      if (out.length % 50 === 0) {
        console.log(
          `  … ${out.length} in-stock | miss ${miss} | oos ${oos} | scanned ${idx}/${paths.length}`,
        );
      }
      if (out.length >= LIMIT) done = true;
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  const final = out.slice(0, LIMIT);
  writeFileSync(OUT_FILE, JSON.stringify(final, null, 2));
  const dur = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(
    `\n✅ ${final.length} ürün yazıldı → ${OUT_FILE}  (miss ${miss}, out-of-stock ${oos}, ${dur}s)`,
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
