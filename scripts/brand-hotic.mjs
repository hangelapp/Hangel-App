/**
 * Hotiç (ReklamAction offer_id 60315) ürün toplayıcı — "tabana kuvvet".
 *
 * ReklamAction SKU feed'i vermediği için hotic.com.tr'nin kendi sitemap'inden
 * ürün URL'leri toplanır, her ürün sayfası Chrome UA ile çekilir ve
 * __NEXT_DATA__ içindeki product objesinden (fallback: JSON-LD Product)
 * başlık/fiyat/görsel/barkod/stok çıkarılır. Her link ReklamAction deep-link
 * tracking'ine sarılır → BAĞIŞ korunur.
 *
 * Çıktı: scripts/out/ra-hotic.json  (CanonicalProduct şeması ile uyumlu)
 *
 * Kullanım:
 *   node scripts/brand-hotic.mjs           # hedef 1000
 *   node scripts/brand-hotic.mjs 300       # hedef 300
 *
 * NOTLAR (site kaziyla saptandi):
 *  - Ürün sayfasi: /...-p-<id>  → externalId = product.sku (uniq) fallback barcode/id
 *  - Stok: product.totalQuantity DAIMA 0 (güvenilmez). Gerçek stok =
 *    variants[].quantity toplami > 0  → sadece bunlar "in stock" sayilir.
 *  - Fiyat: product.price.newPrice (satis), oldPrice (liste). newPrice<oldPrice → salePrice.
 *  - Görsel: product.pictures[0].url ZATEN mutlak https, mncdn CDN (HTTP200).
 */
import { writeFileSync, mkdirSync } from 'node:fs';

const OFFER = '60315';
const AFF_ID = '35329';
const TRACK = 'ad.reklm.com';
const BRAND = 'Hotiç';
const BASE = 'https://www.hotic.com.tr';
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

  // 1) __NEXT_DATA__ (en zengin, stok + fiyat + görsel burada)
  const nd = html.match(
    /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/,
  );
  if (nd) {
    try {
      const j = JSON.parse(nd[1]);
      const p = j?.props?.pageProps?.product;
      if (p) {
        // Gerçek stok: variant quantity toplami (totalQuantity güvenilmez)
        const vSum = Array.isArray(p.variants)
          ? p.variants.reduce((s, v) => s + (Number(v?.quantity) || 0), 0)
          : 0;
        const inStock = vSum > 0 || Number(p.totalQuantity) > 0;

        const priceObj = p.price || {};
        const newPrice = Number(priceObj.newPrice ?? priceObj.salePrice);
        const oldPrice = Number(priceObj.oldPrice);
        const price = Number.isFinite(newPrice) && newPrice > 0 ? newPrice : null;

        const img = absImage(
          Array.isArray(p.pictures) && p.pictures[0] ? p.pictures[0].url : null,
        );

        const title = clean(p.productName || p.metaTitle);
        const externalId = clean(p.sku) || clean(p.barcode) || urlId || String(p.variantId || '');

        if (title && price != null && img && inStock && externalId) {
          const salePrice =
            Number.isFinite(oldPrice) && oldPrice > price ? price : null;
          const basePrice = salePrice != null ? oldPrice : price;
          const desc =
            clean(p.shortDescription || p.fullDescription || p.metaDescription).slice(
              0,
              500,
            ) || `${title} — hotiç'te.`;
          return {
            externalId: String(externalId),
            title,
            description: desc,
            price: basePrice,
            salePrice,
            imageLink: img,
          };
        }
        // NEXT_DATA product bulundu ama stokta değil / eksik → aday elenir
        return null;
      }
    } catch {
      /* fall through */
    }
  }

  // 2) JSON-LD Product fallback (stok bilgisi zayif; availability'e güven)
  const ldRe = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g;
  let m;
  while ((m = ldRe.exec(html))) {
    try {
      const j = JSON.parse(m[1]);
      const arr = Array.isArray(j) ? j : [j];
      for (const o of arr) {
        if (o && o['@type'] === 'Product') {
          const off = o.offers || {};
          const price = Number(off.price);
          const avail = String(off.availability || '');
          // image nested array olabilir: [[url,url]] veya [url] veya url
          let rawImg = o.image;
          while (Array.isArray(rawImg)) rawImg = rawImg[0];
          const img = absImage(rawImg);
          if (o.name && price > 0 && !avail.includes('OutOfStock') && img) {
            return {
              externalId: String(o.sku || urlId),
              title: clean(o.name),
              description:
                clean(o.description).slice(0, 500) || `${clean(o.name)} — hotiç.`,
              price,
              salePrice: null,
              imageLink: img,
            };
          }
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
  console.log(`[hotic] hedef ${TARGET} ürün (conc ${CONC})`);

  // sitemap.xml → sitemap_products.xml → sitemap_products_N.xml (nested index)
  const root = await get(`${BASE}/sitemap.xml`);
  const prodIdxUrl =
    locs(root.body).find((u) => /sitemap_products\.xml/.test(u)) ||
    `${BASE}/sitemap_products.xml`;
  const prodIdx = await get(prodIdxUrl);
  const chunks = locs(prodIdx.body).filter((u) => /sitemap_products_\d+\.xml/.test(u));
  console.log(`[hotic] ${chunks.length} product sitemap chunk bulundu`);

  // Aday ürün URL'lerini topla (fazladan: çoğu stokta olmayabilir)
  const candidates = [];
  const seen = new Set();
  for (const ch of chunks) {
    if (candidates.length > TARGET * 6) break;
    const r = await get(ch);
    for (const u of locs(r.body)) {
      if (/-p-\d+$/.test(u) && !seen.has(u)) {
        seen.add(u);
        candidates.push(u);
      }
    }
    console.log(`[hotic] ${ch.split('/').pop()} → aday toplam ${candidates.length}`);
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
        salePrice: e.salePrice,
        currency: 'TRY',
        imageLink: e.imageLink,
        productUrl: deepLink(url),
        availability: 'in stock',
        donationRate: DONATION_RATE,
      });
      if (out.length % 25 === 0) {
        console.log(`[hotic] ${out.length}/${TARGET} (işlenen ${processed})`);
      }
    }
  }

  await Promise.all(Array.from({ length: CONC }, worker));

  mkdirSync('scripts/out', { recursive: true });
  writeFileSync('scripts/out/ra-hotic.json', JSON.stringify(out, null, 2));
  const dur = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(
    `[hotic] BİTTİ → ${out.length} ürün yazıldı (${processed}/${candidates.length} sayfa tarandı, ${dur}s) → scripts/out/ra-hotic.json`,
  );
}

main().catch((e) => {
  console.error('[hotic] HATA', e);
  process.exit(1);
});
