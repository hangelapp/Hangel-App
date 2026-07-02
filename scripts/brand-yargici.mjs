/**
 * Yargıcı (Affocean offer_id 2136) ürün toplayıcı — "SPEED RACE".
 *
 * Yargıcı Next.js. Ürün verisi her sayfanın __NEXT_DATA__ →
 * props.pageProps.product objesinde (price.newPrice/oldPrice, pictures[].url,
 * totalStock, addToBasketDisabled). Ürün URL'leri sitemap'ten toplanır.
 * Her link Affocean deep-link tracking'ine sarılır → BAĞIŞ korunur.
 *
 * Çıktı: scripts/out/ao-yargici.json
 *
 * Kullanım:
 *   node scripts/brand-yargici.mjs           # hedef 1000
 *   node scripts/brand-yargici.mjs 500       # hedef 500
 */
import { writeFileSync, mkdirSync } from 'node:fs';

const OFFER = '2136';
const AFF_ID = '7873';
const TRACK = 'ad.afftrck.com';
const BRAND = 'Yargıcı';
const BASE = 'https://www.yargici.com';
const DONATION = 5.6;
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
  let u = String(src);
  if (u.startsWith('//')) u = 'https:' + u;
  if (u.startsWith('/')) u = BASE + u;
  return u.startsWith('http') ? u.replace(/^http:/, 'https:') : null;
};

async function get(url, tries = 2) {
  for (let t = 0; t < tries; t++) {
    try {
      const r = await fetch(url, {
        headers: { 'User-Agent': UA, 'Accept-Language': 'tr,en;q=0.8', Accept: '*/*' },
        redirect: 'follow',
      });
      const body = await r.text();
      if (r.ok || r.status === 404) return { status: r.status, ok: r.ok, body };
    } catch {
      /* retry */
    }
  }
  return { status: 0, ok: false, body: '' };
}

const locs = (xml) =>
  [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map((m) => m[1].trim());

// Bir ürün sayfasından kanonik ürün üret (yoksa null)
function extract(url, html) {
  const idm = url.match(/-p-(\d+)/);
  const urlId = idm ? idm[1] : null;

  const nd = html.match(
    /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/,
  );
  if (!nd) return null;

  let p;
  try {
    const j = JSON.parse(nd[1]);
    p = j?.props?.pageProps?.product;
  } catch {
    return null;
  }
  if (!p) return null;

  // Stok: totalStock>0 ve sepete eklenebilir olmalı
  const stock = Number(p.totalStock ?? p.totalQuantity ?? 0);
  const inStock = stock > 0 && p.addToBasketDisabled !== true;
  if (!inStock) return null;

  const pr = p.price || {};
  const newPrice = Number(pr.newPrice ?? pr.salePrice);
  const oldPrice = Number(pr.oldPrice);
  if (!(newPrice > 0)) return null;

  // price=liste, salePrice=indirimli (varsa)
  let price;
  let salePrice = null;
  if (oldPrice > newPrice) {
    price = oldPrice;
    salePrice = newPrice;
  } else {
    price = newPrice;
  }

  const img = absImage(p.pictures && p.pictures[0] && p.pictures[0].url);
  if (!img) return null;

  const title = clean(p.productName || p.metaTitle);
  if (!title) return null;

  // externalId: SKU (varyant bazında benzersiz) → yoksa barcode → urlId
  const externalId = clean(p.sku) || clean(p.barcode) || urlId || String(p.variantId);
  if (!externalId) return null;

  const desc =
    clean(p.fullDescription).slice(0, 500) ||
    clean(p.description).slice(0, 500) ||
    clean(p.metaDescription).slice(0, 500) ||
    `${BRAND} ${title}`;

  return {
    externalId: String(externalId),
    title,
    description: desc,
    price,
    salePrice,
    imageLink: img,
  };
}

async function main() {
  const t0 = Date.now();
  console.log(`[yargici] hedef ${TARGET} ürün, concurrency ${CONC}`);

  // Sitemap index → product sitemap chunk'ları
  const idx = await get(`${BASE}/sitemap_products.xml`);
  const chunks = locs(idx.body).filter((u) => /sitemap_products_\d+\.xml/.test(u));
  console.log(`[yargici] ${chunks.length} product sitemap chunk bulundu`);

  // Aday ürün URL'lerini topla (fazladan; bir kısmı stokta olmayacak)
  const candidates = [];
  const seen = new Set();
  await Promise.all(
    chunks.map(async (ch) => {
      const r = await get(ch);
      for (const u of locs(r.body)) {
        if (/-p-\d+$/.test(u) && !seen.has(u)) {
          seen.add(u);
          candidates.push(u);
        }
      }
    }),
  );
  console.log(`[yargici] ${candidates.length} aday ürün URL toplandı`);

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
        id: `affocean-${OFFER}-${e.externalId}`,
        source: 'affocean',
        feedId: OFFER,
        offerId: OFFER,
        brandId: null,
        brandName: BRAND,
        externalId: e.externalId,
        title: e.title,
        description: e.description,
        price: e.price,
        salePrice: e.salePrice,
        currency: 'TRY',
        imageLink: e.imageLink,
        productUrl: deepLink(url),
        availability: 'in stock',
        donationRate: DONATION,
      });
      if (out.length % 50 === 0) {
        console.log(`[yargici] ${out.length}/${TARGET} (işlenen ${processed})`);
      }
    }
  }

  await Promise.all(Array.from({ length: CONC }, worker));

  mkdirSync('scripts/out', { recursive: true });
  writeFileSync('scripts/out/ao-yargici.json', JSON.stringify(out, null, 2));
  const dur = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(
    `[yargici] BİTTİ → ${out.length} ürün (${processed} sayfa tarandı) → scripts/out/ao-yargici.json | ${dur}s`,
  );
}

main().catch((e) => {
  console.error('[yargici] HATA', e);
  process.exit(1);
});
