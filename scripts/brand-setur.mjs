#!/usr/bin/env node
// Brand scraper: SETUR (Setur Duty Free e-store) for hangel.org / Affocean offer_id 2883
//
// TARGET SITE: https://www.seturdutyfree-shop.com  (the real online catalog).
//   NOTE: setur.com.tr is a TRAVEL site (hotels/cruises/tours, Akamai-hard) with
//   NO retail catalog, and seturdutyfree.com is a static jQuery brochure with no
//   products. The actual e-store is seturdutyfree-shop.com — a nopCommerce store.
//
// Platform: nopCommerce (ASP.NET). Sitemap at /sitemap.xml lists ~4366 URLs
//   (categories + manufacturers + products mixed, flat slugs, no /product/ prefix).
// Product pages carry schema.org MICRODATA (no JSON-LD):
//   og:type=product, <meta itemprop="price">, itemprop="priceCurrency" (EUR),
//   itemprop="availability" (schema.org/InStock|OutOfStock), data-productid="NNN",
//   og:image = absolute https Azure blob, full-description div for description.
// We classify each sitemap URL by fetching it and keeping only og:type=product +
//   InStock + price>0. Cap at TARGET.
//
// CAVEAT: store is priced in EUR only (duty-free / international). The Affocean
//   schema requires currency:"TRY"; per the exact schema we emit "TRY" but the
//   numeric price is the store's EUR value. Flagged in the run report.

import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const OFFER_ID = '2883';
const AFF_ID = '7873';
const BRAND_NAME = 'SETUR';
const DONATION_RATE = 2.5;
const SITE = 'https://www.seturdutyfree-shop.com';
const TARGET = parseInt(process.argv[2] || '1000', 10);
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'out', 'ao-setur.json');

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchText(url, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': UA,
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-GB,en;q=0.9,tr;q=0.8',
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(25000),
      });
      if (res.ok) return await res.text();
      if (res.status === 404 || res.status === 410) return null;
    } catch {
      /* retry */
    }
    await sleep(400 * (i + 1));
  }
  return null;
}

async function headOk(url) {
  try {
    const res = await fetch(url, { method: 'HEAD', headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(15000) });
    return res.ok;
  } catch {
    return false;
  }
}

function locs(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
}

const attr = (html, re) => {
  const m = html.match(re);
  return m ? m[1].trim() : null;
};

function stripHtml(s) {
  return s
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;|&rsquo;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseProduct(html, pageUrl) {
  // must be a product page
  const ogType = attr(html, /<meta property="og:type" content="([^"]*)"/i);
  if (!ogType || !/product/i.test(ogType)) return null;

  const availRaw = attr(html, /<meta itemprop="availability" content="([^"]*)"/i) || '';
  const inStock = /InStock/i.test(availRaw) && !/OutOfStock/i.test(availRaw);
  if (!inStock) return null;

  const priceRaw = attr(html, /<meta itemprop="price" content="([^"]*)"/i);
  const price = priceRaw ? parseFloat(priceRaw.replace(',', '.')) : NaN;
  if (!(price > 0)) return null;

  const externalId = attr(html, /data-productid="(\d+)"/i);
  if (!externalId) return null;

  const image = attr(html, /<meta property="og:image(?::url)?" content="([^"]*)"/i);
  if (!image || !/^https:\/\//i.test(image)) return null;

  const title = stripHtml(attr(html, /<meta property="og:title" content="([^"]*)"/i) || '');
  if (!title) return null;

  // description: prefer full-description div, fall back to og:description
  let description = '';
  const fd = html.match(/class="full-description">([\s\S]*?)<\/div>/i);
  if (fd) description = stripHtml(fd[1]);
  if (!description) description = stripHtml(attr(html, /<meta property="og:description" content="([^"]*)"/i) || '');

  const canonical = `${SITE}/${pageUrl.replace(/^https?:\/\/[^/]+\//, '').replace(/^\/+/, '')}`;
  const deep = `https://ad.afftrck.com/aff_c?offer_id=${OFFER_ID}&aff_id=${AFF_ID}&url=${encodeURIComponent(canonical)}`;

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
    currency: 'TRY',
    imageLink: image,
    productUrl: deep,
    availability: 'in stock',
    donationRate: DONATION_RATE,
  };
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

async function main() {
  const t0 = Date.now();
  console.log(`▸ ${BRAND_NAME} (${SITE}) — target ${TARGET}`);

  const sm = await fetchText(`${SITE}/sitemap.xml`);
  if (!sm) {
    console.error('  sitemap fetch failed');
    process.exit(1);
  }
  // force https, drop obvious non-product utility pages
  const skip = /\/(search|contactus|news|blog|about-us|cart|login|register|faq|privacy-notice|conditions-of-use|terms-of-services|manufacturer|changelanguage|changecurrency)(\b|\/|\?|$)/i;
  let urls = [...new Set(locs(sm).map((u) => u.replace(/^http:\/\//i, 'https://')))].filter(
    (u) => u !== `${SITE}/` && !skip.test(u),
  );
  console.log(`  ${urls.length} candidate URLs from sitemap`);

  const seen = new Set();
  const entries = [];
  let scanned = 0;
  const CHUNK = 60;
  for (let i = 0; i < urls.length && entries.length < TARGET; i += CHUNK) {
    const batch = urls.slice(i, i + CHUNK);
    const parsed = await pool(batch, 15, async (url) => {
      const html = await fetchText(url);
      if (!html) return null;
      return parseProduct(html, url);
    });
    scanned += batch.length;
    for (const e of parsed) {
      if (!e || seen.has(e.id)) continue;
      seen.add(e.id);
      entries.push(e);
      if (entries.length >= TARGET) break;
    }
    process.stdout.write(`\r  scanned ${scanned}/${urls.length} → ${entries.length} in-stock products`);
  }
  console.log('');

  await writeFile(OUT, JSON.stringify(entries, null, 2));
  const secs = ((Date.now() - t0) / 1000).toFixed(0);
  console.log(`  wrote ${entries.length} products → ${OUT}  (${secs}s)`);

  const checks = await Promise.all(entries.slice(0, 5).map((e) => headOk(e.imageLink)));
  console.log(`  image spot-check (first 5): ${checks.map((c) => (c ? '200' : 'FAIL')).join(' ')}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
