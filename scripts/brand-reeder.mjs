/**
 * Reeder (reeder.com.tr) ürün scraper — hangel.org / ReklamAction offer_id 62508.
 *
 * NEDEN AYRI SCRIPT:
 *   Reeder bir Shopify mağazası (robots.txt "Shopify storefront"). Shopify her
 *   ürün sayfasında schema.org/Product JSON-LD render eder AMA aynı yapısal veriyi
 *   `/products.json` public API'sinde de sunar (name, images=mutlak cdn.shopify.com
 *   HTTPS, variants.price, variants.sku, variants.available, body_html=description).
 *   Bu API sayfa-sayfa 1000 fetch yerine ~2 istekte tüm kataloğu verir → HIZ.
 *   Ürün URL'leri handle'dan türetilir: https://reeder.com.tr/products/<handle>.
 *
 * Platform: Shopify (electronics). JSON-LD ile birebir aynı alanlar.
 *
 * Çıktı ReklamAction deep-link'e (ad.reklm.com) sarılır → BAĞIŞ korumalı.
 * Sadece stokta (variant.available === true) ürünler.
 *
 * Usage:  node scripts/brand-reeder.mjs [limit]        (default 1000)
 */
import { writeFileSync, mkdirSync } from 'node:fs';

const OFFER = '62508';
const AFF_ID = '35329';
const TRACK = 'ad.reklm.com';
const BRAND_NAME = 'Reeder';
const BASE = 'https://reeder.com.tr';
const DONATION_RATE = 1.5;
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36';

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

async function getJson(url) {
  const r = await fetch(url, {
    headers: { 'User-Agent': UA, 'Accept-Language': 'tr,en;q=0.8', Accept: 'application/json' },
    redirect: 'follow',
  });
  if (!r.ok) throw new Error(`${url} → ${r.status}`);
  return r.json();
}

function absImage(img) {
  if (!img) return undefined;
  if (/^https?:\/\//i.test(img)) return img;
  if (img.startsWith('//')) return 'https:' + img;
  return BASE + (img.startsWith('/') ? '' : '/') + img;
}

const priceNum = (p) => {
  if (p == null) return null;
  const n = typeof p === 'number' ? p : parseFloat(String(p).replace(/[^\d.]/g, ''));
  return Number.isFinite(n) && n > 0 ? n : null;
};

async function main() {
  const limit = Number(process.argv[2]) || 1000;
  mkdirSync('scripts/out', { recursive: true });
  console.log(`Reeder scrape (Shopify products.json) — hedef ${limit} ürün\n`);

  // 1) Kataloğu products.json ile sayfa sayfa çek (Shopify max 250/sayfa)
  const products = [];
  for (let page = 1; page <= 20 && products.length < limit; page++) {
    let batch;
    try {
      const j = await getJson(`${BASE}/products.json?limit=250&page=${page}`);
      batch = j.products || [];
    } catch (e) {
      console.warn(`  page ${page} atlandı: ${e.message}`);
      break;
    }
    if (!batch.length) break;
    products.push(...batch);
    console.log(`  ▸ page ${page}: +${batch.length} (toplam ${products.length})`);
  }
  console.log(`\n▸ katalogda ${products.length} ürün bulundu`);

  const out = [];
  const seenExt = new Set();
  let oos = 0;
  let skipped = 0;

  for (const p of products) {
    if (out.length >= limit) break;
    // Stokta olan ilk variantı seç (schema.org offers karşılığı)
    const variants = Array.isArray(p.variants) ? p.variants : [];
    const v = variants.find((x) => x.available) || null;
    if (!v) {
      oos++;
      continue; // stokta değil → atla (in-stock only)
    }
    const price = priceNum(v.price);
    const title = clean(p.title);
    if (!title || price == null) {
      skipped++;
      continue;
    }
    // externalId benzersiz: variant sku → yoksa product id
    let externalId = String(v.sku || '').trim();
    if (!externalId) externalId = `p${p.id}`;
    if (seenExt.has(externalId)) {
      // aynı sku iki üründe geçebilir; ürün id'siyle benzersizleştir
      externalId = `${externalId}-${p.id}`;
    }
    if (seenExt.has(externalId)) continue;
    seenExt.add(externalId);

    // Görsel: variant featured_image → ürünün ilk görseli
    const rawImg =
      v.featured_image?.src ||
      (Array.isArray(p.images) && p.images[0]?.src) ||
      null;
    const imageLink = absImage(rawImg);
    if (!imageLink) {
      skipped++;
      seenExt.delete(externalId);
      continue;
    }

    const productPage = `${BASE}/products/${p.handle}`;
    const compare = priceNum(v.compare_at_price);
    // salePrice: task null ister; price = güncel satış fiyatı

    out.push({
      id: `reklamaction-${OFFER}-${externalId}`,
      source: 'reklamaction',
      feedId: OFFER,
      offerId: OFFER,
      brandId: null,
      brandName: BRAND_NAME,
      externalId,
      title,
      description: clean(p.body_html) || '',
      price,
      salePrice: null,
      currency: 'TRY',
      imageLink,
      productUrl: deepLink(productPage),
      availability: 'in stock',
      donationRate: DONATION_RATE,
    });
  }

  writeFileSync(`scripts/out/ra-reeder.json`, JSON.stringify(out, null, 2));
  console.log(
    `\n✅ ${out.length} ürün yazıldı → scripts/out/ra-reeder.json (stok-dışı ${oos}, atlanan ${skipped})`,
  );
  if (out[0]) {
    const s = out[0];
    console.log(`   örnek: ${s.title} — ₺${s.price}`);
    console.log(`   img:   ${s.imageLink}`);
    console.log(`   url:   ${s.productUrl}`);
  }
}

main().catch((e) => {
  console.error('HATA:', e.message);
  process.exit(1);
});
