#!/usr/bin/env node
// Brand scraper: Arçelik (Affocean offer_id 1688)
// Site: https://www.arcelik.com.tr  (SAP Hybris / SAP Commerce Cloud)
// Network: Affocean -> tracking domain ad.afftrck.com, aff_id 7873, offer_id 1688
//
// FLAG: HARD (Akamai). Plain curl / bare Chrome UA => 403 "Access Denied"
//   (errors.edgesuite.net). CRACK: Akamai passes requests that carry the FULL set of
//   modern-Chrome fetch metadata headers (Sec-Fetch-*, Sec-Ch-Ua*, Accept, Accept-Language,
//   Upgrade-Insecure-Requests). With those present => 200. No JS challenge / no cookie needed.
//
// FASTEST WORKING METHOD:
//   1) /sitemap.xml is a sitemapindex. The PRODUCT sub-sitemap lists ~5.5k product URLs.
//   2) Every LIVE, buyable product page embeds clean schema.org JSON-LD:
//        <script type="application/ld+json"> { "@type":"Product",
//            "sku":"457000009600", "image":"https://.../image.png",
//            "name":..., "description":...,
//            "offers": { "price":"45509.00", "priceCurrency":"TRY",
//                        "availability":"https://schema.org/InStock" } } </script>
//      -> sku (externalId), absolute HTTPS image (HTTP 200), numeric price, in-stock flag.
//   3) Discontinued / non-buyable products still appear in the sitemap but their page has
//      ONLY a BreadcrumbList JSON-LD (no Product / no offer) OR returns HTTP 500. Those are
//      treated as out-of-stock and SKIPPED. So "has Product JSON-LD + InStock" == in stock.
//
// Requires one fetch per product page (no bulk product JSON API on this Hybris config), so we
// run a bounded concurrency pool and stop once LIMIT in-stock records are collected. We shuffle
// the sitemap URL order lightly-ish by walking it front-to-back but skipping obvious
// spare-part/accessory slugs first (they are rarely in stock and dilute the catalog).
//
// Output: scripts/out/ao-arcelik.json
// Usage:  node scripts/brand-arcelik.mjs [limit]   (default 1000)

import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, 'out');
const OUT_FILE = resolve(OUT_DIR, 'ao-arcelik.json');

const OFFER_ID = '1688';
const FEED_ID = '1688';
const AFF_ID = '7873';
const TRACK = 'ad.afftrck.com';
const BRAND_NAME = 'Arçelik';
const DONATION_RATE = 3;

const LIMIT = parseInt(process.argv[2] || '1000', 10);
const CONCURRENCY = 10;
const SITEMAP_INDEX = 'https://www.arcelik.com.tr/sitemap.xml';

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// Full modern-Chrome header set — this is what defeats the Akamai edge block.
const HEADERS = {
  'User-Agent': UA,
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
  'Sec-Ch-Ua': '"Chromium";v="120", "Google Chrome";v="120", "Not?A_Brand";v="24"',
  'Sec-Ch-Ua-Mobile': '?0',
  'Sec-Ch-Ua-Platform': '"macOS"',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Upgrade-Insecure-Requests': '1',
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();

const deepLink = (dest) =>
  `https://${TRACK}/aff_c?offer_id=${OFFER_ID}&aff_id=${AFF_ID}&url=${encodeURIComponent(dest)}`;

async function fetchText(url, { retries = 3, allow500 = false } = {}) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { headers: HEADERS, redirect: 'follow' });
      if (!res.ok) {
        // 500 on this Hybris = dead/discontinued product; don't waste retries unless asked.
        if (res.status === 500 && !allow500) return null;
        const transient =
          res.status === 403 || res.status === 429 || res.status === 503 || res.status === 500;
        if (transient && attempt < retries) {
          await sleep(700 * (attempt + 1) + Math.floor(Math.random() * 300));
          continue;
        }
        return null;
      }
      return await res.text();
    } catch {
      if (attempt === retries) return null;
      await sleep(500 * (attempt + 1));
    }
  }
  return null;
}

function locs(xml) {
  const out = [];
  const re = /<loc>\s*([^<\s]+)\s*<\/loc>/g;
  let m;
  while ((m = re.exec(xml))) out.push(m[1].replace(/&amp;/g, '&').trim());
  return out;
}

// Pull the schema.org Product JSON-LD out of a product page, if present & in stock.
function parseProduct(html, pageUrl) {
  const blocks = [];
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html))) blocks.push(m[1]);

  for (const raw of blocks) {
    let data;
    try {
      data = JSON.parse(raw.trim());
    } catch {
      continue;
    }
    const nodes = Array.isArray(data) ? data : data['@graph'] ? data['@graph'] : [data];
    for (const node of nodes) {
      if (!node || node['@type'] !== 'Product') continue;
      const offer = Array.isArray(node.offers) ? node.offers[0] : node.offers;
      if (!offer) return null; // Product with no offer => not buyable
      const availability = String(offer.availability || '');
      if (!/InStock/i.test(availability)) return null; // in-stock ONLY

      const externalId = clean(String(node.sku || node.gtin13 || '')).replace(/\s+/g, '');
      if (!externalId) return null;

      const priceNum = Number(String(offer.price).replace(/[^\d.]/g, ''));
      if (!Number.isFinite(priceNum) || priceNum <= 0) return null;

      const image = clean(node.image);
      if (!/^https:\/\//.test(image)) return null; // absolute HTTPS only

      const title = clean(node.name);
      if (!title) return null;

      const description = clean(node.description) || title;
      const dest = clean(node.url) || pageUrl;

      return {
        id: `affocean-${OFFER_ID}-${externalId}`,
        source: 'affocean',
        feedId: FEED_ID,
        offerId: OFFER_ID,
        brandId: null,
        brandName: BRAND_NAME,
        externalId,
        title,
        description,
        price: priceNum,
        salePrice: null,
        currency: 'TRY',
        imageLink: image,
        productUrl: deepLink(dest),
        availability: 'in stock',
        donationRate: DONATION_RATE,
      };
    }
  }
  return null;
}

// Slugs that are almost always spare parts / accessories (low in-stock yield) — defer them.
const NOISE = /(aksesuar|yedek-parca|filtre|torba|hortum|somine|kapsul|deterjan|temizlik-ve-bakim)/i;

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  console.log(`Arçelik scrape — hedef ${LIMIT} ürün (in-stock only) via sitemap + JSON-LD\n`);
  const t0 = Date.now();

  // 1) sitemap index -> PRODUCT sub-sitemap
  const idxXml = await fetchText(SITEMAP_INDEX, { retries: 4 });
  if (!idxXml) throw new Error('sitemap index fetch failed (Akamai block?)');
  const subSitemaps = locs(idxXml);
  const productSitemap = subSitemaps.find((u) => /\/PRODUCT-/.test(u));
  if (!productSitemap) throw new Error('PRODUCT sub-sitemap not found in index');
  console.log(`  sitemap index: ${subSitemaps.length} alt-harita, PRODUCT bulundu`);

  const prodXml = await fetchText(productSitemap, { retries: 4 });
  if (!prodXml) throw new Error('PRODUCT sitemap fetch failed');
  let urls = locs(prodXml).filter((u) => /^https:\/\/www\.arcelik\.com\.tr\//.test(u));
  console.log(`  PRODUCT sitemap: ${urls.length} ürün URL'i`);

  // Prioritize likely-buyable products (non-accessory) first, accessories after.
  const primary = urls.filter((u) => !NOISE.test(u));
  const secondary = urls.filter((u) => NOISE.test(u));
  urls = [...primary, ...secondary];

  // 2) bounded-concurrency crawl until LIMIT in-stock records
  const out = [];
  const seen = new Set();
  let idx = 0;
  let fetched = 0;
  let http500 = 0;
  let skipped = 0;
  let stop = false;

  async function worker() {
    while (!stop) {
      const i = idx++;
      if (i >= urls.length) return;
      const url = urls[i];
      const html = await fetchText(url);
      fetched++;
      if (!html) {
        http500++;
        continue;
      }
      const rec = parseProduct(html, url);
      if (!rec) {
        skipped++;
        continue;
      }
      if (seen.has(rec.externalId)) continue;
      seen.add(rec.externalId);
      out.push(rec);
      if (out.length >= LIMIT) {
        stop = true;
        return;
      }
      if (out.length % 50 === 0) {
        console.log(
          `  … ${out.length} in-stock | ${fetched} sayfa çekildi | ${skipped} atlandı | ${http500} dead`,
        );
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  const final = out.slice(0, LIMIT);
  writeFileSync(OUT_FILE, JSON.stringify(final, null, 2));

  const dur = ((Date.now() - t0) / 1000).toFixed(0);
  console.log(
    `\n✅ ${final.length} ürün yazıldı → ${OUT_FILE}\n   ${fetched} sayfa çekildi, ${skipped} in-stock-değil/atlandı, ${http500} dead(500), süre ${dur}s`,
  );
  if (final[0]) {
    const p = final[0];
    console.log(
      `   örnek: ${p.title} — ₺${p.price}\n   sku: ${p.externalId}\n   img: ${p.imageLink}\n   url: ${p.productUrl}`,
    );
  }
}

main().catch((e) => {
  console.error('HATA:', e.message);
  process.exit(1);
});
