/**
 * JeansLab (ReklamAction offer_id 62074) ürün toplayıcı — SPEED RACE.
 *
 * JeansLab (Next.js tabanlı, mağaza motoru sitemap+JSON-LD sunuyor) kendi
 * ürün sitemap'inden (/sitemap.xml → sitemap_products.xml → chunk'lar) ürün
 * URL'leri toplanır, her ürün sayfası çekilir ve içindeki JSON-LD Product
 * bloğundan (fallback: __NEXT_DATA__ / regex) başlık/fiyat/görsel/sku çıkarılır.
 * Her link ReklamAction deep-link tracking'ine sarılır → BAĞIŞ korunur.
 *
 * Çıktı: scripts/out/ra-jeanslab.json  (CanonicalProduct şeması ile uyumlu)
 *
 * Kullanım:
 *   node scripts/brand-jeanslab.mjs           # hedef 1000
 *   node scripts/brand-jeanslab.mjs 500       # hedef 500
 */
import { writeFileSync, mkdirSync } from 'node:fs';

const OFFER = '62074';
const AFF_ID = '35329';
const TRACK = 'ad.reklm.com';
const BRAND = 'JeansLab';
const BASE = 'https://www.jeanslab.com';
const DONATION_RATE = 3.5;
const TARGET = Number(process.argv[2] || 1000);
const CONC = 10;

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const clean = (s) =>
  (s || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&#0?39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const deepLink = (dest) =>
  `https://${TRACK}/aff_c?offer_id=${OFFER}&aff_id=${AFF_ID}&url=${encodeURIComponent(dest)}`;

// Görseli mutlak https'e çevir
const absImage = (src) => {
  if (!src) return null;
  let u = String(src).trim();
  if (u.startsWith('//')) u = 'https:' + u;
  else if (u.startsWith('/')) u = BASE + u;
  if (u.startsWith('http://')) u = 'https://' + u.slice(7);
  return u.startsWith('https://') ? u : null;
};

// JSON-LD image alanı nested array olabilir: [[url,url]] veya [url] veya "url"
const firstImage = (img) => {
  const flat = [];
  const walk = (x) => {
    if (!x) return;
    if (typeof x === 'string') flat.push(x);
    else if (Array.isArray(x)) x.forEach(walk);
    else if (typeof x === 'object' && x.url) flat.push(x.url);
  };
  walk(img);
  return flat.length ? flat[0] : null;
};

const num = (v) => {
  if (v == null) return null;
  const n = Number(String(v).replace(/[^\d.,-]/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};

async function get(url, tries = 2) {
  for (let t = 0; t < tries; t++) {
    try {
      const r = await fetch(url, {
        headers: {
          'User-Agent': UA,
          'Accept-Language': 'tr,en;q=0.8',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        redirect: 'follow',
      });
      return { status: r.status, ok: r.ok, body: await r.text() };
    } catch {
      if (t === tries - 1) return { status: 0, ok: false, body: '' };
    }
  }
  return { status: 0, ok: false, body: '' };
}

const locs = (xml) =>
  [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map((m) => m[1].trim());

// Ürün sayfasından kanonik ürün üret (yoksa null)
function extract(url, html) {
  const idm = url.match(/-p-(\d+)/);
  const urlId = idm ? idm[1] : null;

  // 1) JSON-LD Product (en temiz)
  const ldRe =
    /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = ldRe.exec(html))) {
    let parsed;
    try {
      parsed = JSON.parse(m[1]);
    } catch {
      continue;
    }
    const arr = Array.isArray(parsed) ? parsed : [parsed];
    for (const o of arr) {
      if (!o || o['@type'] !== 'Product') continue;
      const off = Array.isArray(o.offers) ? o.offers[0] : o.offers || {};
      const price = num(off.price);
      const avail = String(off.availability || '').trim();
      const inStock = !/OutOfStock|SoldOut|Discontinued/i.test(avail);
      const img = absImage(firstImage(o.image));
      const title = clean(o.name);
      if (title && price != null && price > 0 && img && inStock) {
        const externalId = clean(o.sku) || urlId;
        const desc =
          clean(o.description).slice(0, 500) ||
          `${title} — JeansLab'de indirimli fiyata.`;
        return {
          externalId: String(externalId),
          title,
          description: desc,
          price,
          imageLink: img,
        };
      }
      // Product bulundu ama stok/fiyat yok → bu ürünü geç
      if (o['@type'] === 'Product') return null;
    }
  }

  // 2) __NEXT_DATA__ fallback
  const nd = html.match(
    /<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/,
  );
  if (nd) {
    try {
      const j = JSON.parse(nd[1]);
      let found = null;
      const walk = (x, d) => {
        if (found || d > 12 || !x || typeof x !== 'object') return;
        if (
          !Array.isArray(x) &&
          (x.name || x.title) &&
          (x.price != null || x.sellPrice != null) &&
          (x.image || x.images || x.pictures)
        ) {
          found = x;
          return;
        }
        for (const k in x) walk(x[k], d + 1);
      };
      walk(j, 0);
      if (found) {
        const price = num(found.price ?? found.sellPrice);
        const img = absImage(
          firstImage(found.image || found.images || found.pictures),
        );
        const title = clean(found.name || found.title);
        if (title && price != null && price > 0 && img) {
          return {
            externalId: String(found.sku || found.barcode || urlId),
            title,
            description:
              clean(found.description).slice(0, 500) ||
              `${title} — JeansLab.`,
            price,
            imageLink: img,
          };
        }
      }
    } catch {
      /* ignore */
    }
  }

  return null;
}

async function main() {
  const t0 = Date.now();
  console.log(`[jeanslab] hedef ${TARGET} ürün (concurrency ${CONC})`);

  // sitemap.xml → products index → chunk'lar
  const root = await get(`${BASE}/sitemap.xml`);
  let prodIndexUrl = locs(root.body).find((u) => /sitemap_products\.xml/.test(u));
  if (!prodIndexUrl) prodIndexUrl = `${BASE}/sitemap_products.xml`;

  const idx = await get(prodIndexUrl);
  let chunks = locs(idx.body).filter((u) => /sitemap_products_\d+\.xml/.test(u));
  // Sitemap_products index yoksa bu zaten düz URL listesidir
  if (chunks.length === 0 && /-p-\d+/.test(idx.body)) {
    chunks = [prodIndexUrl];
  }
  console.log(`[jeanslab] ${chunks.length} product sitemap chunk`);

  // Aday ürün URL'lerini topla
  const candidates = [];
  const seen = new Set();
  for (const ch of chunks) {
    if (candidates.length > TARGET * 3) break;
    const r = await get(ch);
    for (const u of locs(r.body)) {
      if (/-p-\d+$/.test(u) && !seen.has(u)) {
        seen.add(u);
        candidates.push(u);
      }
    }
    console.log(
      `[jeanslab] ${ch.split('/').pop()} → aday toplam ${candidates.length}`,
    );
  }

  // Ürün sayfalarını sınırlı eşzamanlılıkla çek
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
      if (out.length % 25 === 0) {
        console.log(`[jeanslab] ${out.length}/${TARGET} (işlenen ${processed})`);
      }
    }
  }

  await Promise.all(Array.from({ length: CONC }, worker));

  mkdirSync('scripts/out', { recursive: true });
  writeFileSync('scripts/out/ra-jeanslab.json', JSON.stringify(out, null, 2));
  const dur = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(
    `[jeanslab] BİTTİ → ${out.length} ürün (${processed} sayfa tarandı, ${dur}s) → scripts/out/ra-jeanslab.json`,
  );
}

main().catch((e) => {
  console.error('[jeanslab] HATA', e);
  process.exit(1);
});
