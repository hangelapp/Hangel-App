#!/usr/bin/env node
// Brand scraper: LG Türkiye (ReklamAction offer_id 62504)
// Site: https://www.lg.com/tr  (Next.js App Router / RSC — server-rendered HTML)
// Network: ReklamAction -> tracking domain ad.reklm.com, aff_id 35329, offer_id 62504
//
// FASTEST WORKING METHOD (site flagged "HARD Akamai" but direct HTML fetch with a
//   desktop Chrome UA is NOT blocked — 200s even at 15-way concurrency):
//   1. GET https://www.lg.com/tr/sitemap.xml  -> flat urlset with ~4600 <loc> URLs.
//   2. Keep only consumer product pages: the final path segment is a model code
//      (contains a digit + a letter, e.g. 25g523b-b, oled77g26la). Drop /business/
//      (B2B/no price), and non-product hubs (lg-hakkinda, test, video, config, ...).
//   3. Each product page embeds a JSON-LD Product object INSIDE the RSC flight payload,
//      HTML-entity-encoded (&quot;) and multiply backslash-escaped. We entity-decode,
//      collapse all backslashes to get flat "key":"value" text, then read:
//        "@type":"product"  (lowercase),  "name", "mpn"/"sku", "image",
//        "offers": { "price":"<n>", "priceCurrency":"TRY",
//                    "availability":"https://schema.org/InStock" }
//   4. IN-STOCK ONLY: keep only price > 0 AND availability === InStock.
//      (B2B/spec-only pages carry empty price + no availability -> dropped.)
//
// Output: scripts/out/ra-lg.json
// Usage:  node scripts/brand-lg.mjs [limit]   (default 1000)

import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileP = promisify(execFile);

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, 'out');
const OUT_FILE = resolve(OUT_DIR, 'ra-lg.json');

const OFFER_ID = '62504';
const AFF_ID = '35329';
const TRACK = 'ad.reklm.com';
const BRAND_NAME = 'LG';
const DONATION_RATE = 3;
const ORIGIN = 'https://www.lg.com';
const SITEMAP = `${ORIGIN}/tr/sitemap.xml`;

const LIMIT = parseInt(process.argv[2] || '1000', 10);
// Akamai IP-blocks bursts. Keep concurrency low and jitter between requests.
const CONCURRENCY = parseInt(process.env.LG_CONCURRENCY || '3', 10);
const DELAY_MS = parseInt(process.env.LG_DELAY_MS || '350', 10);
const jitter = () =>
  new Promise((r) => setTimeout(r, DELAY_MS + Math.random() * DELAY_MS));

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

// Non-product URL hubs to exclude even if the slug happens to contain a digit.
const EXCLUDE_RE =
  /\/tr\/(business|lg-hakkinda|test|video|ces\d|config|search|compare-results|best)\b/;

// Akamai fingerprints & 403s node's built-in fetch (TLS/HTTP2 signature), but lets
// system curl through. So we shell out to curl. Status is appended as a trailer
// "\n<<<HTTP:NNN>>>" so we can distinguish 200 from 404 without a second request.
async function fetchText(url, tries = 3) {
  const args = [
    '-sS',
    '--compressed',
    '--max-time',
    '30',
    '-A',
    UA,
    '-H',
    'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    '-H',
    'Accept-Language: tr-TR,tr;q=0.9,en;q=0.8',
    '-w',
    '\n<<<HTTP:%{http_code}>>>',
    url,
  ];
  for (let i = 0; i < tries; i++) {
    try {
      const { stdout } = await execFileP('curl', args, {
        maxBuffer: 32 * 1024 * 1024,
      });
      const m = stdout.match(/\n<<<HTTP:(\d{3})>>>$/);
      const code = m ? parseInt(m[1], 10) : 0;
      const body = m ? stdout.slice(0, m.index) : stdout;
      if (code >= 200 && code < 300) return body;
      if (code === 404 || code === 410) return null;
      await new Promise((res) => setTimeout(res, 500 * (i + 1)));
    } catch {
      await new Promise((res) => setTimeout(res, 500 * (i + 1)));
    }
  }
  return null;
}

function decodeEntities(s) {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

// Extract the embedded JSON-LD Product from a product page's HTML.
// Returns { name, mpn, image, description, price, currency, avail } or null.
function extractProduct(html) {
  // Flatten: entity-decode then remove ALL backslashes so escaped JSON reads plainly.
  const flat = decodeEntities(html).replace(/\\+/g, '');
  const pi = flat.indexOf('"@type":"product"');
  if (pi < 0) return null;
  const region = flat.slice(pi, pi + 3500);
  const g = (n) => {
    const m = region.match(new RegExp('"' + n + '":"([^"]*)"'));
    return m ? m[1] : null;
  };
  const name = g('name');
  const mpn = g('mpn') || g('sku');
  let image = g('image');
  const description = g('description');

  const oi = region.indexOf('"offers"');
  const off = oi >= 0 ? region.slice(oi, oi + 900) : region;
  const priceM = off.match(/"price":"?([0-9]+(?:\.[0-9]+)?)"?/);
  const price = priceM ? parseFloat(priceM[1]) : null;
  const curM = off.match(/"priceCurrency":"([A-Z]{3})"/);
  const currency = curM ? curM[1] : 'TRY';
  const avM = off.match(/"availability":"https:\/\/schema\.org\/([A-Za-z]+)"/);
  const avail = avM ? avM[1] : null;

  // Absolute HTTPS image
  if (image) {
    if (image.startsWith('//')) image = 'https:' + image;
    else if (image.startsWith('/')) image = ORIGIN + image;
    else if (!/^https?:\/\//.test(image)) image = ORIGIN + '/' + image;
    image = image.replace(/^http:\/\//, 'https://');
  }
  return { name, mpn, image, description, price, currency, avail };
}

function deepLink(pageUrl) {
  return `https://${TRACK}/aff_c?offer_id=${OFFER_ID}&aff_id=${AFF_ID}&url=${encodeURIComponent(
    pageUrl
  )}`;
}

async function main() {
  const t0 = Date.now();
  mkdirSync(OUT_DIR, { recursive: true });

  console.error('[lg] fetching sitemap…');
  const xml = await fetchText(SITEMAP);
  if (!xml) {
    console.error('[lg] FATAL: sitemap unreachable');
    process.exit(1);
  }
  const allLocs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) =>
    m[1].replace(/\/$/, '')
  );

  // Keep consumer product-model pages only.
  const productUrls = allLocs.filter((u) => {
    if (!u.startsWith(`${ORIGIN}/tr/`)) return false;
    if (EXCLUDE_RE.test(u)) return false;
    const last = u.split('/').pop();
    // model code: has a digit, only [a-z0-9-], and a digit-letter adjacency
    return (
      /[0-9]/.test(last) &&
      /^[a-z0-9-]+$/.test(last) &&
      /([0-9][a-z]|[a-z][0-9])/.test(last)
    );
  });
  // De-dup, keep order
  const seenUrl = new Set();
  const queue = productUrls.filter((u) => (seenUrl.has(u) ? false : seenUrl.add(u)));
  console.error(
    `[lg] sitemap URLs=${allLocs.length}  candidate product pages=${queue.length}`
  );

  const out = [];
  const seenSku = new Set();
  let processed = 0;
  let idx = 0;
  let stop = false;

  async function worker() {
    while (!stop) {
      const myIdx = idx++;
      if (myIdx >= queue.length) return;
      const pageUrl = queue[myIdx];
      await jitter();
      const html = await fetchText(pageUrl);
      processed++;
      if (html) {
        const p = extractProduct(html);
        if (
          p &&
          p.mpn &&
          p.price != null &&
          p.price > 0 &&
          p.avail === 'InStock' &&
          !seenSku.has(p.mpn)
        ) {
          seenSku.add(p.mpn);
          out.push({
            id: `reklamaction-${OFFER_ID}-${p.mpn}`,
            source: 'reklamaction',
            feedId: OFFER_ID,
            offerId: OFFER_ID,
            brandId: null,
            brandName: BRAND_NAME,
            externalId: p.mpn,
            title: p.name || `${BRAND_NAME} ${p.mpn}`,
            description: p.description || p.name || `${BRAND_NAME} ${p.mpn}`,
            price: p.price,
            salePrice: null,
            currency: p.currency || 'TRY',
            imageLink: p.image,
            productUrl: deepLink(pageUrl),
            availability: 'in stock',
            donationRate: DONATION_RATE,
          });
          if (out.length >= LIMIT) stop = true;
        }
      }
      if (processed % 50 === 0)
        console.error(
          `[lg] processed=${processed}/${queue.length}  kept=${out.length}`
        );
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  // Only keep entries with a resolvable-looking absolute https image; drop missing.
  const final = out.filter((p) => p.imageLink && /^https:\/\//.test(p.imageLink));

  writeFileSync(OUT_FILE, JSON.stringify(final, null, 2));
  const dur = ((Date.now() - t0) / 1000).toFixed(1);
  console.error(
    `[lg] DONE  processed=${processed}  in-stock kept=${final.length}  ` +
      `(dropped no-image=${out.length - final.length})  ${dur}s  -> ${OUT_FILE}`
  );
}

main().catch((e) => {
  console.error('[lg] ERROR', e);
  process.exit(1);
});
