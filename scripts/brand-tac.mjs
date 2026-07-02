/**
 * Taç (ReklamAction offer_id 56601) ürün toplayıcı — "tabana kuvvet".
 *
 * Taç Next.js sitesi. Ürün URL'leri /sitemap.xml → sitemap_products*.xml'den
 * toplanır, her ürün sayfası Chrome UA ile çekilir ve JSON-LD Product
 * objesinden (name/description/price/image/sku/availability) çıkarılır.
 * Her link ReklamAction (ad.reklm.com) deep-link'ine sarılır → BAĞIŞ korunur.
 *
 * Çıktı: scripts/out/ra-tac.json  (CanonicalProduct şeması ile uyumlu)
 *
 * Kullanım:
 *   node scripts/brand-tac.mjs           # hedef 1000
 *   node scripts/brand-tac.mjs 500       # hedef 500
 */
import { writeFileSync, mkdirSync } from 'node:fs';

const OFFER = '56601';
const AFF_ID = '35329';
const TRACK = 'ad.reklm.com';
const BRAND = 'Taç';
const BASE = 'https://www.tac.com.tr';
const DONATION_RATE = 4;
const TARGET = Number(process.argv[2] || 1000);
const CONC = 10;

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const clean = (s) =>
  (s || '')
    .replace(/<[^>]*>/g, ' ')
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
  if (u.startsWith('/')) u = BASE + u;
  return u.startsWith('http') ? u : null;
};

async function get(url) {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const r = await fetch(url, {
        headers: { 'User-Agent': UA, 'Accept-Language': 'tr,en;q=0.8', Accept: '*/*' },
        redirect: 'follow',
      });
      return { status: r.status, ok: r.ok, body: await r.text() };
    } catch {
      if (attempt === 0) await new Promise((r) => setTimeout(r, 400));
    }
  }
  return { status: 0, ok: false, body: '' };
}

const locs = (xml) =>
  [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map((m) => m[1].trim());

// Ürün sayfasından kanonik ürün üret (JSON-LD Product; fallback yok gerekmez)
function extract(url, html) {
  const idm = url.match(/-p-(\d+)/);
  const urlId = idm ? idm[1] : null;

  const ldRe = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g;
  let m;
  while ((m = ldRe.exec(html))) {
    let j;
    try {
      j = JSON.parse(m[1]);
    } catch {
      continue;
    }
    const arr = Array.isArray(j) ? j : [j];
    for (const o of arr) {
      if (!o || o['@type'] !== 'Product') continue;
      const off = o.offers || {};
      const offer = Array.isArray(off) ? off[0] || {} : off;
      const price = Number(offer.price);
      const avail = String(offer.availability || '');
      if (!o.name || !(price > 0)) continue;
      if (avail && !avail.includes('InStock')) continue; // in-stock only
      const img = absImage(Array.isArray(o.image) ? o.image[0] : o.image);
      if (!img) continue;
      const externalId = String(o.sku || o.gtin13 || o.mpn || urlId).trim();
      if (!externalId) continue;
      const title = clean(o.name);
      const desc =
        clean(o.description).slice(0, 500) ||
        `${title} — Taç'ta indirimli fiyata.`;
      return {
        externalId,
        title,
        description: desc,
        price,
        imageLink: img,
      };
    }
  }
  return null;
}

async function main() {
  const t0 = Date.now();
  console.log(`[tac] hedef ${TARGET} ürün`);

  // Sitemap index → product sitemap chunk'ları
  const root = await get(`${BASE}/sitemap.xml`);
  const chunkIndexes = locs(root.body).filter((u) => /sitemap_products/i.test(u));

  // Nested: sitemap_products.xml içinde sitemap_products_N.xml olabilir
  const productSitemaps = [];
  for (const ci of chunkIndexes) {
    const r = await get(ci);
    const inner = locs(r.body).filter((u) => /sitemap_products_\d+\.xml/i.test(u));
    if (inner.length) productSitemaps.push(...inner);
    else productSitemaps.push(ci);
  }
  console.log(`[tac] ${productSitemaps.length} product sitemap chunk bulundu`);

  // Aday ürün URL'lerini topla
  const candidates = [];
  const seen = new Set();
  for (const sm of productSitemaps) {
    const r = await get(sm);
    for (const u of locs(r.body)) {
      if (/-p-\d+$/.test(u) && !seen.has(u)) {
        seen.add(u);
        candidates.push(u);
      }
    }
    console.log(`[tac] ${sm.split('/').pop()} → aday toplam ${candidates.length}`);
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
      if (out.length % 50 === 0) {
        console.log(`[tac] ${out.length}/${TARGET} (işlenen ${processed})`);
      }
    }
  }

  await Promise.all(Array.from({ length: CONC }, worker));

  mkdirSync('scripts/out', { recursive: true });
  writeFileSync('scripts/out/ra-tac.json', JSON.stringify(out, null, 2));
  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(
    `[tac] BİTTİ → ${out.length} ürün yazıldı (${processed} sayfa tarandı, ${secs}s) → scripts/out/ra-tac.json`,
  );
}

main().catch((e) => {
  console.error('[tac] HATA', e);
  process.exit(1);
});
