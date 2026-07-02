/**
 * Linens (ReklamAction offer_id 5951) ürün toplayıcı.
 *
 * Linens Next.js sitesidir. Ürün URL'leri /sitemap.xml → sitemap_products.xml →
 * sitemap_products_N.xml zincirinden toplanır. Her ürün sayfası Chrome UA ile
 * çekilir, JSON-LD Product objesinden (fallback: __NEXT_DATA__) başlık / fiyat /
 * görsel / sku çıkarılır. Her link ReklamAction deep-link tracking'ine sarılır
 * (ad.reklm.com) → BAĞIŞ korunur. Sadece stokta ürünler alınır.
 *
 * Çıktı: scripts/out/ra-linens.json  (CanonicalProduct şeması ile uyumlu)
 *
 * Kullanım:
 *   node scripts/brand-linens.mjs           # hedef 1000
 *   node scripts/brand-linens.mjs 500       # hedef 500
 */
import { writeFileSync, mkdirSync } from 'node:fs';

const OFFER = '5951';
const AFF_ID = '35329';
const TRACK = 'ad.reklm.com';
const BRAND = 'Linens';
const BASE = 'https://www.linens.com.tr';
const DONATION_RATE = 5;
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

// ReklamAction deep-link: offer_id / aff_id / url-encoded hedef
const deepLink = (dest) =>
  `https://${TRACK}/aff_c?offer_id=${OFFER}&aff_id=${AFF_ID}&url=${encodeURIComponent(dest)}`;

const absImage = (src) => {
  if (!src) return null;
  let u = src.trim();
  if (u.startsWith('//')) u = 'https:' + u;
  else if (u.startsWith('/')) u = BASE + u;
  return u.startsWith('http') ? u : null;
};

async function get(url) {
  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': UA, 'Accept-Language': 'tr,en;q=0.8', Accept: '*/*' },
      redirect: 'follow',
    });
    return { status: r.status, ok: r.ok, body: await r.text() };
  } catch {
    return { status: 0, ok: false, body: '' };
  }
}

const locs = (xml) =>
  [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map((m) => m[1].trim());

// Bir ürün sayfasından kanonik ürün üret (yoksa null)
function extract(url, html) {
  const idm = url.match(/-p-(\d+)/);
  const urlId = idm ? idm[1] : null;

  // 1) JSON-LD Product (en temiz)
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
      if (avail.includes('OutOfStock') || avail.includes('SoldOut')) return null;
      if (!o.name || !(price > 0)) continue;
      const img = absImage(Array.isArray(o.image) ? o.image[0] : o.image);
      if (!img) continue;
      const externalId = clean(o.sku || o.gtin13 || o.mpn) || urlId;
      if (!externalId) continue;
      const desc =
        clean(o.description).slice(0, 500) ||
        `${clean(o.name)} — Linens'de indirimli fiyata.`;
      return {
        externalId: String(externalId),
        title: clean(o.name),
        description: desc,
        price,
        imageLink: img,
      };
    }
  }

  // 2) __NEXT_DATA__ fallback
  const nd = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (nd) {
    try {
      const j = JSON.parse(nd[1]);
      let found = null;
      const walk = (o, d) => {
        if (found || d > 14 || !o || typeof o !== 'object') return;
        if (
          !Array.isArray(o) &&
          'newPrice' in o &&
          ('salePrice' in o || 'oldPrice' in o)
        ) {
          found = o;
          return;
        }
        for (const k in o) walk(o[k], d + 1);
      };
      walk(j, 0);
      // başlık/görsel/sku için ayrı gez
      let meta = null;
      const walk2 = (o, d) => {
        if (meta || d > 14 || !o || typeof o !== 'object') return;
        if (!Array.isArray(o) && ('productName' in o || 'name' in o) && 'images' in o) {
          meta = o;
          return;
        }
        for (const k in o) walk2(o[k], d + 1);
      };
      walk2(j, 0);
      const price = found ? Number(found.newPrice ?? found.salePrice) : NaN;
      if (found && price > 0 && meta) {
        const title = clean(meta.productName || meta.name);
        const imgRaw =
          (Array.isArray(meta.images) &&
            (meta.images[0]?.url || meta.images[0]?.src || meta.images[0])) ||
          null;
        const img = absImage(imgRaw);
        const externalId =
          clean(meta.sku || meta.barcode || meta.productCode) || urlId;
        if (title && img && externalId) {
          return {
            externalId: String(externalId),
            title,
            description: `${title} — Linens'de indirimli fiyata.`,
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
  console.log(`[linens] hedef ${TARGET} ürün (conc ${CONC})`);

  // sitemap zinciri: /sitemap.xml → products → products_N
  const root = await get(`${BASE}/sitemap.xml`);
  let productSitemaps = locs(root.body).filter((u) => /sitemap_products/i.test(u));
  // sitemap_products.xml bir index olabilir → alt chunk'ları aç
  const chunks = [];
  for (const sm of productSitemaps) {
    const r = await get(sm);
    const inner = locs(r.body).filter((u) => /sitemap_products_\d+\.xml/i.test(u));
    if (inner.length) chunks.push(...inner);
    else chunks.push(sm); // düz ürün sitemap'i ise doğrudan kullan
  }
  console.log(`[linens] ${chunks.length} ürün sitemap chunk`);

  // Aday ürün URL'lerini topla
  const candidates = [];
  const seen = new Set();
  for (const ch of chunks) {
    const r = await get(ch);
    for (const u of locs(r.body)) {
      if (/-p-\d+$/.test(u) && !seen.has(u)) {
        seen.add(u);
        candidates.push(u);
      }
    }
  }
  console.log(`[linens] ${candidates.length} aday ürün URL`);

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
        console.log(`[linens] ${out.length}/${TARGET} (işlenen ${processed})`);
      }
    }
  }

  await Promise.all(Array.from({ length: CONC }, worker));

  mkdirSync('scripts/out', { recursive: true });
  writeFileSync('scripts/out/ra-linens.json', JSON.stringify(out, null, 2));
  const dur = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(
    `[linens] BİTTİ → ${out.length} ürün (${processed} sayfa, ${dur}s) → scripts/out/ra-linens.json`,
  );
}

main().catch((e) => {
  console.error('[linens] HATA', e);
  process.exit(1);
});
