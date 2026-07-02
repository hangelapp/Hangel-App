// Brand scraper: Network (network.com.tr)
// Affocean feed offer_id=621, aff_id=7873, donationRate=5
// Method: sitemap (product_1..6.xml) -> product page JSON-LD (schema.org/Product)
// Site is behind Imperva Incapsula but responds 200 to a normal Chrome UA.
// Output: scripts/out/ao-network.json
//
// Run: node scripts/brand-network.mjs
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const BASE = 'https://www.network.com.tr';
const OUT = new URL('./out/ao-network.json', import.meta.url).pathname;

const AFF_ID = '7873';
const OFFER_ID = '621';
const DONATION_RATE = 5;
const MAX_PRODUCTS = 1000;
const CONCURRENCY = 12;
const SITEMAPS = [1, 2, 3, 4, 5, 6].map((n) => `${BASE}/product_${n}.xml`);

const HEADERS = {
  'User-Agent': UA,
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8',
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchText(url, tries = 4) {
  for (let i = 0; i < tries; i++) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 30000);
      const res = await fetch(url, { headers: HEADERS, signal: ctrl.signal });
      clearTimeout(t);
      if (res.status === 200) return await res.text();
      if (res.status === 404) return null;
      // 403/429/503 -> backoff
    } catch (_) {
      /* network/abort -> retry */
    }
    await sleep(500 * (i + 1));
  }
  return null;
}

function decodeEntities(s) {
  if (!s) return s;
  return s
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function cleanText(s) {
  if (!s) return '';
  // strip HTML tags then decode entities and collapse whitespace
  return decodeEntities(String(s).replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

function extractLocs(xml) {
  const out = [];
  const re = /<loc>\s*([^<\s][^<]*?)\s*<\/loc>/g;
  let m;
  while ((m = re.exec(xml))) out.push(m[1].trim());
  return out;
}

function extExternalId(url) {
  // .../slug-p-219533  -> 219533
  const m = url.match(/-p-(\d+)(?:\?|#|$)/);
  return m ? m[1] : null;
}

function parseProductLd(html) {
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html))) {
    let raw = m[1].trim();
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      continue;
    }
    const nodes = Array.isArray(data) ? data : data['@graph'] ? data['@graph'] : [data];
    for (const node of nodes) {
      if (node && (node['@type'] === 'Product' || node['@type'] === 'product')) return node;
    }
  }
  return null;
}

function upgradeImage(u) {
  if (!u) return null;
  // network CDN resize path: /mnresize/450/-/  -> bump to 1200 for quality (verified 200)
  return u.replace(/\/mnresize\/\d+\/-\//, '/mnresize/1200/-/');
}

function toRecord(node, pageUrl) {
  const offers = Array.isArray(node.offers) ? node.offers[0] : node.offers;
  if (!offers) return null;

  const avail = String(offers.availability || '').toLowerCase();
  if (!avail.includes('instock')) return null; // in-stock only

  const price = Number(offers.price);
  if (!Number.isFinite(price) || price <= 0) return null;

  const sku = node.sku || node.mpn || extExternalId(pageUrl);
  if (!sku) return null;

  let img = Array.isArray(node.image) ? node.image[0] : node.image;
  img = upgradeImage(img);
  if (!img || !/^https:\/\//i.test(img)) return null;

  const title = cleanText(node.name);
  if (!title) return null;

  const canonicalUrl = (offers.url && String(offers.url)) || pageUrl;
  const productUrl = `https://ad.afftrck.com/aff_c?offer_id=${OFFER_ID}&aff_id=${AFF_ID}&url=${encodeURIComponent(
    canonicalUrl,
  )}`;

  return {
    id: `affocean-${OFFER_ID}-${sku}`,
    source: 'affocean',
    feedId: OFFER_ID,
    offerId: OFFER_ID,
    brandId: null,
    brandName: 'Network',
    externalId: String(sku),
    title,
    description: cleanText(node.description) || title,
    price,
    salePrice: null,
    currency: 'TRY',
    imageLink: img,
    productUrl,
    availability: 'in stock',
    donationRate: DONATION_RATE,
  };
}

async function mapPool(items, worker, concurrency) {
  const results = [];
  let idx = 0;
  const runners = Array.from({ length: concurrency }, async () => {
    while (idx < items.length) {
      const i = idx++;
      results[i] = await worker(items[i], i);
    }
  });
  await Promise.all(runners);
  return results;
}

async function main() {
  const start = Date.now();

  // 1) Gather product URLs from sitemaps
  const urlSet = new Map(); // externalId -> url (dedupe)
  for (const sm of SITEMAPS) {
    const xml = await fetchText(sm);
    if (!xml) {
      console.error(`sitemap fetch failed: ${sm}`);
      continue;
    }
    for (const loc of extractLocs(xml)) {
      const id = extExternalId(loc);
      if (id && !urlSet.has(id)) urlSet.set(id, loc);
      if (urlSet.size >= MAX_PRODUCTS * 3) break; // cap candidate pool
    }
    if (urlSet.size >= MAX_PRODUCTS * 3) break;
  }

  const candidates = [...urlSet.values()];
  console.error(`candidate product URLs: ${candidates.length}`);

  // 2) Fetch product pages, parse JSON-LD, collect in-stock records until MAX_PRODUCTS
  const records = [];
  const seen = new Set();
  let processed = 0;
  let stop = false;

  const batchSize = 60;
  for (let b = 0; b < candidates.length && !stop; b += batchSize) {
    const batch = candidates.slice(b, b + batchSize);
    const recs = await mapPool(
      batch,
      async (url) => {
        const html = await fetchText(url);
        processed++;
        if (!html) return null;
        const node = parseProductLd(html);
        if (!node) return null;
        return toRecord(node, url);
      },
      CONCURRENCY,
    );
    for (const r of recs) {
      if (r && !seen.has(r.id)) {
        seen.add(r.id);
        records.push(r);
        if (records.length >= MAX_PRODUCTS) {
          stop = true;
          break;
        }
      }
    }
    console.error(`processed=${processed} inStock=${records.length}`);
  }

  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, JSON.stringify(records, null, 2), 'utf-8');

  const dur = ((Date.now() - start) / 1000).toFixed(1);
  console.error(
    `DONE: wrote ${records.length} records to ${OUT} | processed ${processed} pages | ${dur}s`,
  );
}

main().catch((e) => {
  console.error('FATAL', e);
  process.exit(1);
});
