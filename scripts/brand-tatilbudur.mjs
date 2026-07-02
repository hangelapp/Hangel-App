// Tatilbudur travel-package scraper (Affocean offer_id 2777)
// Site is behind Akamai bot-wall (curl → HTTP 403). Uses a real Chromium
// browser (Playwright) to pass the JS/TLS challenge, then discovers
// hotel/tour package URLs via sitemap and extracts title/price/image from
// JSON-LD or OpenGraph meta.
//
// Output: scripts/out/affocean-tatilbudur.json
// Usage:  node scripts/brand-tatilbudur.mjs [limit]

import { chromium } from 'playwright';
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, 'out');
const OUT_FILE = path.join(OUT_DIR, 'affocean-tatilbudur.json');

const OFFER_ID = '2777';
const AFF_ID = '7873';
const BRAND = 'Tatilbudur';
const ORIGIN = 'https://www.tatilbudur.com';

const LIMIT = Number(process.argv[2] || 200);

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const deepLink = (dest) =>
  `https://ad.afftrck.com/aff_c?offer_id=${OFFER_ID}&aff_id=${AFF_ID}&url=${encodeURIComponent(dest)}`;

const abs = (u) => {
  if (!u) return null;
  if (u.startsWith('//')) return 'https:' + u;
  if (u.startsWith('http://')) return 'https://' + u.slice('http://'.length);
  if (u.startsWith('http')) return u;
  if (u.startsWith('/')) return ORIGIN + u;
  return ORIGIN + '/' + u;
};

const toNum = (v) => {
  if (v == null) return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  // strip currency symbols/spaces; handle "1.234,56" and "1,234.56"
  let s = String(v).replace(/[^0-9.,]/g, '').trim();
  if (!s) return null;
  if (s.includes('.') && s.includes(',')) {
    // last separator is the decimal
    if (s.lastIndexOf(',') > s.lastIndexOf('.')) s = s.replace(/\./g, '').replace(',', '.');
    else s = s.replace(/,/g, '');
  } else if (s.includes(',')) {
    // treat comma as decimal if it looks like decimals, else thousands
    const parts = s.split(',');
    if (parts[parts.length - 1].length === 2) s = s.replace(/,/g, '.');
    else s = s.replace(/,/g, '');
  }
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
};

const slugFromUrl = (u) => {
  try {
    const p = new URL(u).pathname.replace(/\/+$/, '');
    const seg = p.split('/').filter(Boolean);
    return (seg[seg.length - 1] || seg.join('-') || 'x').toLowerCase();
  } catch {
    return String(u).toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60);
  }
};

// Pull inside-browser fetch (uses passed Akamai cookies + real TLS).
async function ctxFetch(page, url, asText = true) {
  return page.evaluate(
    async ([u, txt]) => {
      try {
        const r = await fetch(u, {
          headers: { Accept: '*/*', 'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8' },
          credentials: 'include',
        });
        if (!r.ok) return { ok: false, status: r.status, body: '' };
        const body = txt ? await r.text() : '';
        return { ok: true, status: r.status, body };
      } catch (e) {
        return { ok: false, status: 0, body: '', err: String(e) };
      }
    },
    [url, asText]
  );
}

function extractLocs(xml) {
  const locs = [];
  const re = /<loc>\s*([^<\s]+)\s*<\/loc>/gi;
  let m;
  while ((m = re.exec(xml))) locs.push(m[1].trim());
  return locs;
}

// Heuristic: package/detail pages for a travel site.
function looksLikePackage(u) {
  const s = u.toLowerCase();
  if (!s.includes('tatilbudur.com')) return false;
  if (/\.(xml|jpg|jpeg|png|webp|gif|css|js|pdf)(\?|$)/.test(s)) return false;
  return (
    s.includes('/otel') ||
    s.includes('/otelleri/') ||
    s.includes('-oteli') ||
    s.includes('/tur/') ||
    s.includes('-turu') ||
    s.includes('/tatil') ||
    s.includes('/erken-rezervasyon') ||
    s.includes('/kultur-turlari') ||
    s.includes('/yurt-disi')
  );
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: UA,
    locale: 'tr-TR',
    viewport: { width: 1366, height: 900 },
    extraHTTPHeaders: {
      'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
    },
  });
  const page = await context.newPage();

  const diag = { homeStatus: null, sitemapUrls: 0, candidateUrls: 0, visited: 0, extracted: 0 };

  // 1) Warm up — pass the Akamai challenge and collect cookies.
  try {
    const resp = await page.goto(ORIGIN + '/', { waitUntil: 'domcontentloaded', timeout: 45000 });
    diag.homeStatus = resp ? resp.status() : null;
    // give any JS challenge a moment
    await page.waitForTimeout(4000);
  } catch (e) {
    diag.homeErr = String(e);
  }

  // If still blocked, one more reload attempt (Akamai often clears on 2nd hit)
  if (diag.homeStatus && diag.homeStatus >= 400) {
    try {
      await page.waitForTimeout(2500);
      const r2 = await page.goto(ORIGIN + '/', { waitUntil: 'domcontentloaded', timeout: 45000 });
      diag.homeStatus = r2 ? r2.status() : diag.homeStatus;
      await page.waitForTimeout(3000);
    } catch {}
  }

  // 2) Discover URLs via sitemaps (fetched from inside the browser context).
  const sitemapSeeds = [
    ORIGIN + '/sitemap.xml',
    ORIGIN + '/sitemap_index.xml',
    ORIGIN + '/sitemap-index.xml',
    ORIGIN + '/robots.txt',
  ];

  const candidates = new Set();
  const sitemapsToRead = [];

  for (const s of sitemapSeeds) {
    const r = await ctxFetch(page, s);
    if (!r.ok) {
      diag[`seed_${s.split('/').pop()}`] = r.status;
      continue;
    }
    diag[`seed_${s.split('/').pop()}`] = 200;
    if (s.endsWith('robots.txt')) {
      const sm = [...r.body.matchAll(/Sitemap:\s*(\S+)/gi)].map((m) => m[1].trim());
      sitemapsToRead.push(...sm);
    } else {
      // could be an index (list of sitemaps) or a urlset
      const locs = extractLocs(r.body);
      diag.sitemapUrls += locs.length;
      for (const l of locs) {
        if (l.toLowerCase().endsWith('.xml')) sitemapsToRead.push(l);
        else if (looksLikePackage(l)) candidates.add(l);
      }
    }
  }

  // Read child sitemaps (cap to avoid runaway)
  const seenSm = new Set();
  let smBudget = 40;
  while (sitemapsToRead.length && smBudget-- > 0 && candidates.size < LIMIT * 4) {
    const sm = sitemapsToRead.shift();
    if (seenSm.has(sm)) continue;
    seenSm.add(sm);
    const r = await ctxFetch(page, sm);
    if (!r.ok) continue;
    const locs = extractLocs(r.body);
    diag.sitemapUrls += locs.length;
    for (const l of locs) {
      if (l.toLowerCase().endsWith('.xml')) {
        // prioritize sitemaps that look hotel/tour related
        if (/otel|tur|tatil|hotel/i.test(l)) sitemapsToRead.unshift(l);
        else sitemapsToRead.push(l);
      } else if (looksLikePackage(l)) {
        candidates.add(l);
      }
    }
  }

  diag.candidateUrls = candidates.size;

  // 3) Extraction helper — parse a package page's HTML for JSON-LD / OG.
  async function extractFromHtml(html, url) {
    // JSON-LD blocks
    const ldBlocks = [
      ...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi),
    ].map((m) => m[1]);

    const flatten = (o, acc = []) => {
      if (!o) return acc;
      if (Array.isArray(o)) o.forEach((x) => flatten(x, acc));
      else if (typeof o === 'object') {
        acc.push(o);
        if (o['@graph']) flatten(o['@graph'], acc);
      }
      return acc;
    };

    let title = null,
      price = null,
      image = null,
      description = null;

    for (const raw of ldBlocks) {
      let data;
      try {
        data = JSON.parse(raw.trim());
      } catch {
        continue;
      }
      for (const node of flatten(data)) {
        const t = node['@type'];
        const types = Array.isArray(t) ? t.map(String) : [String(t)];
        const isRelevant = types.some((x) =>
          /Product|Hotel|LodgingBusiness|Offer|TouristTrip|Trip|Room|Resort/i.test(x)
        );
        if (!isRelevant) continue;
        if (!title && node.name) title = String(node.name).trim();
        if (!description && node.description) description = String(node.description).trim();
        if (!image) {
          let img = node.image;
          if (Array.isArray(img)) img = img[0];
          if (img && typeof img === 'object') img = img.url || img['@id'];
          if (img) image = abs(String(img));
        }
        if (price == null) {
          const offer = node.offers || node.priceSpecification;
          const off = Array.isArray(offer) ? offer[0] : offer;
          if (off) price = toNum(off.price ?? off.lowPrice ?? off.priceSpecification?.price);
          else if (node.price != null) price = toNum(node.price);
        }
      }
    }

    // OpenGraph / meta fallback
    const meta = (prop) => {
      const re = new RegExp(
        `<meta[^>]+(?:property|name)=["']${prop}["'][^>]*content=["']([^"']+)["']`,
        'i'
      );
      const m = html.match(re) || html.match(
        new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${prop}["']`, 'i')
      );
      return m ? m[1].trim() : null;
    };

    if (!title) title = meta('og:title') || (html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ?? null);
    if (!description) description = meta('og:description') || meta('description');
    if (!image) image = abs(meta('og:image'));
    if (price == null) {
      price = toNum(
        meta('product:price:amount') ||
          meta('og:price:amount') ||
          meta('twitter:data1')
      );
    }
    // last-resort price: look for a "₺ 1.234" style near a price attribute in DOM text
    if (price == null) {
      const pm = html.match(/["']?price["']?\s*[:=]\s*["']?([\d.,]+)/i);
      if (pm) price = toNum(pm[1]);
    }

    return { title, price, image, description };
  }

  // 4) Visit candidates and extract.
  const products = [];
  const list = [...candidates].slice(0, LIMIT * 3); // over-fetch; many may miss price
  const seenExt = new Set();

  for (const url of list) {
    if (products.length >= LIMIT) break;
    diag.visited++;
    const r = await ctxFetch(page, url);
    if (!r.ok || !r.body) continue;
    let fields;
    try {
      fields = await extractFromHtml(r.body, url);
    } catch {
      continue;
    }
    if (!fields.title || fields.price == null || !fields.image) continue;

    const externalId = slugFromUrl(url);
    if (seenExt.has(externalId)) continue;
    seenExt.add(externalId);

    products.push({
      id: `affocean-${OFFER_ID}-${externalId}`,
      source: 'affocean',
      feedId: OFFER_ID,
      offerId: OFFER_ID,
      brandId: null,
      brandName: BRAND,
      externalId,
      title: fields.title,
      description: fields.description || fields.title,
      price: fields.price,
      salePrice: null,
      currency: 'TRY',
      imageLink: fields.image,
      productUrl: deepLink(url),
      availability: 'in stock',
    });
    diag.extracted++;
  }

  await browser.close();

  await writeFile(OUT_FILE, JSON.stringify(products, null, 2));

  console.log('── Tatilbudur scrape diagnostics ──');
  console.log(JSON.stringify(diag, null, 2));
  console.log(`\nWROTE ${products.length} products → ${OUT_FILE}`);
  if (products[0]) console.log('\nSAMPLE:\n' + JSON.stringify(products[0], null, 2));
}

main().catch((e) => {
  console.error('FATAL', e);
  process.exit(1);
});
