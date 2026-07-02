/**
 * SuperStep (superstep.com.tr) ürün scraper — hangel.org / Affocean offer_id 2398.
 *
 * Platform: Akinon commerce (Converse/dsdamat ile aynı altyapı). Ürün sayfaları
 * schema.org/Product JSON-LD (@graph) içeriyor: name, sku (benzersiz), image
 * (mutlak HTTPS akinoncloudcdn), offers.price, availability, description.
 *
 * SITEMAP: /sitemap.xml → /sitemap/products-N (trailing-slash'e 308 redirect eder,
 * fetch redirect:follow ile hallolur). Ürün URL kalıbı: /urun/<slug>/<sku>/.
 *
 * STOK: Sitemap'te hem InStock hem OutOfStock ürün var; SADECE in-stock alınır.
 * Bu yüzden 1000 hedefe ulaşmak için aday havuzu geniş taranır (sitemap sırayla).
 *
 * Çıktı şeması Affocean CanonicalProduct ile uyumlu; productUrl BAĞIŞ korumalı
 * Affocean deep-link'e sarılır (ad.afftrck.com), donationRate: 6.
 *
 * Usage:  node scripts/brand-superstep.mjs [limit]        (default 1000)
 */
import { writeFileSync, mkdirSync } from 'node:fs';

const OFFER = '2398';
const AFF_ID = '7873';
const TRACK = 'ad.afftrck.com';
const BRAND_NAME = 'SuperStep';
const DONATION_RATE = 6;
const BASE = 'https://www.superstep.com.tr';
const CDN = 'https://8f08a8-ss.akinoncloudcdn.com';
const CONCURRENCY = 10;
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36';

const clean = (s) =>
  (s || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();

const deepLink = (dest) =>
  `https://${TRACK}/aff_c?offer_id=${OFFER}&aff_id=${AFF_ID}&url=${encodeURIComponent(dest)}`;

async function get(url) {
  const r = await fetch(url, {
    headers: { 'User-Agent': UA, 'Accept-Language': 'tr,en;q=0.8', Accept: '*/*' },
    redirect: 'follow',
  });
  return { status: r.status, ok: r.ok, body: await r.text(), url: r.url };
}

const locs = (xml) => [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map((m) => m[1].trim());

// sitemap.xml → sitemap/products-N (birden fazla sayfa) → /urun/ URL'leri.
// Stok filtresi nedeniyle limitin ~3 katı aday toplarız.
async function discoverProductUrls(limit) {
  const want = limit * 3;
  const urls = [];
  const seen = new Set();
  const idx = await get(`${BASE}/sitemap.xml`);
  if (!idx.ok) throw new Error(`sitemap index ${idx.status}`);
  const productSitemaps = locs(idx.body).filter((u) => /\/products-\d+/i.test(u));
  if (!productSitemaps.length) throw new Error('ürün sitemapi bulunamadı');
  for (const sm of productSitemaps) {
    if (urls.length >= want) break;
    let res;
    try {
      res = await get(sm);
    } catch {
      continue;
    }
    if (!res.ok) continue;
    for (const loc of locs(res.body)) {
      if (!/\/urun\//.test(loc)) continue;
      if (seen.has(loc)) continue;
      seen.add(loc);
      urls.push(loc);
      if (urls.length >= want) break;
    }
  }
  return urls;
}

function fromJsonLd(html) {
  for (const m of html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    let j;
    try {
      j = JSON.parse(m[1].trim());
    } catch {
      continue;
    }
    const nodes = Array.isArray(j) ? j : j['@graph'] || [j];
    for (const n of nodes) {
      const t = n['@type'];
      if (t === 'Product' || (Array.isArray(t) && t.includes('Product'))) {
        const off = Array.isArray(n.offers) ? n.offers[0] : n.offers;
        const priceRaw = off?.price ?? off?.lowPrice;
        const avail = String(off?.availability || '');
        return {
          title: clean(n.name),
          price:
            typeof priceRaw === 'number'
              ? priceRaw
              : parseFloat(String(priceRaw ?? '').replace(/\./g, '').replace(',', '.')) || null,
          currency: (off?.priceCurrency || 'TRY').toUpperCase(),
          image: Array.isArray(n.image) ? n.image[0] : n.image,
          sku: n.sku || n.mpn || n.gtin13 || null,
          inStock: /InStock/i.test(avail),
          desc: clean(n.description),
        };
      }
    }
  }
  return null;
}

function absImage(img) {
  if (!img) return undefined;
  if (/^https?:\/\//i.test(img)) return img;
  if (img.startsWith('//')) return 'https:' + img;
  return CDN + (img.startsWith('/') ? '' : '/') + img;
}

async function main() {
  const t0 = Date.now();
  const limit = Number(process.argv[2]) || 1000;
  mkdirSync('scripts/out', { recursive: true });
  console.log(`SuperStep scrape — hedef ${limit} in-stock ürün\n`);

  const productUrls = await discoverProductUrls(limit);
  console.log(`▸ sitemap'ten ${productUrls.length} aday ürün URL'i toplandı`);

  const out = [];
  const seenExt = new Set();
  let miss = 0;
  let oos = 0;
  let idx = 0;
  let done = false;

  async function worker() {
    while (!done && idx < productUrls.length) {
      const url = productUrls[idx++];
      if (out.length >= limit) {
        done = true;
        break;
      }
      let page;
      try {
        page = await get(url);
      } catch {
        miss++;
        continue;
      }
      if (!page.ok) {
        miss++;
        continue;
      }
      const e = fromJsonLd(page.body);
      if (!e || !e.title || !e.price) {
        miss++;
        continue;
      }
      if (!e.inStock) {
        oos++;
        continue;
      }
      const image = absImage(e.image);
      if (!image || !/^https:\/\//i.test(image)) {
        miss++;
        continue;
      }
      // externalId benzersiz olmalı: sku yoksa slug'tan türet
      let externalId = String(e.sku || '').trim();
      if (!externalId) {
        const parts = url.replace(/\/$/, '').split('/');
        externalId = parts.slice(-2).join('-') || parts.pop();
      }
      if (seenExt.has(externalId)) continue;
      seenExt.add(externalId);
      out.push({
        id: `affocean-${OFFER}-${externalId}`,
        source: 'affocean',
        feedId: OFFER,
        offerId: OFFER,
        brandId: null,
        brandName: BRAND_NAME,
        externalId,
        title: e.title,
        description: e.desc || '',
        price: e.price,
        salePrice: null,
        currency: e.currency || 'TRY',
        imageLink: image,
        productUrl: deepLink(url),
        availability: 'in stock',
        donationRate: DONATION_RATE,
      });
      if (out.length >= limit) done = true;
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  const final = out.slice(0, limit);
  writeFileSync(`scripts/out/ao-superstep.json`, JSON.stringify(final, null, 2));
  const dur = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(
    `\n✅ ${final.length} ürün yazıldı → scripts/out/ao-superstep.json (miss ${miss}, oos ${oos}, süre ${dur}s)`,
  );
  if (final[0]) {
    const p = final[0];
    console.log(`   örnek: ${p.title} — ₺${p.price} | ${p.imageLink}`);
  }
}

main().catch((e) => {
  console.error('HATA:', e.message);
  process.exit(1);
});
