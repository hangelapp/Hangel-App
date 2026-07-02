/**
 * Vitamin Box (vitaminbox.com.tr) ürün scraper — hangel.org / Affocean offer_id 2910.
 *
 * NEDEN AYRI SCRIPT:
 *   Platform Akinon DEĞİL, ikas (x-powered-by: ikas, Next.js). Sitemap indexi
 *   kökte: /sitemap.xml → çocuk /products.xml (düz XML, .gz YOK, ~5000 URL).
 *   Ürün URL kalıbı kök path: /<slug> (kategori/koleksiyon değil). Görsel
 *   sitemap içinde image:loc olarak da var (cdn.myikas.com, mutlak https).
 *
 * Ürün sayfaları JSON-LD @type Product içeriyor: name, sku (vbXXXX), mpn,
 * image=[mutlak https cdn.myikas.com], offers[0].price ("495.00" nokta ondalık),
 * priceCurrency=TRY, availability=schema.org/InStock|OutOfStock, description.
 * Fallback: OpenGraph meta + sitemap görseli.
 *
 * Çıktı şeması: Affocean CanonicalProduct; productUrl BAĞIŞ korumalı deep-link
 * (ad.afftrck.com). donationRate:6. Sadece in-stock.
 *
 * Usage:  node scripts/brand-vitaminbox.mjs [limit]        (default 1000)
 */
import { writeFileSync, mkdirSync } from 'node:fs';

const OFFER = '2910';
const AFF_ID = '7873';
const TRACK = 'ad.afftrck.com';
const BRAND_NAME = 'Vitamin Box';
const DONATION_RATE = 6;
const BASE = 'https://vitaminbox.com.tr';
const SITEMAP_INDEX = `${BASE}/sitemap.xml`;
const CDN = 'https://cdn.myikas.com';
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36';
const CONCURRENCY = 10;

const clean = (s) =>
  (s || '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, ' ')
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

// /sitemap.xml → /products.xml → { url, image(sitemap) } listesi
async function discoverProducts(limit) {
  const idx = await get(SITEMAP_INDEX);
  if (!idx.ok) throw new Error(`sitemap index ${idx.status}`);
  const productSitemaps = locs(idx.body).filter((u) => /products\.xml/i.test(u));
  if (!productSitemaps.length) throw new Error('products.xml bulunamadı');

  const items = [];
  const seen = new Set();
  for (const sm of productSitemaps) {
    if (items.length >= limit * 2) break;
    let res;
    try {
      res = await get(sm);
    } catch {
      continue;
    }
    if (!res.ok) continue;
    // her <url> bloğunu ayrı işle: loc + image:loc eşleştir
    for (const block of res.body.matchAll(/<url>([\s\S]*?)<\/url>/gi)) {
      const b = block[1];
      const url = b.match(/<loc>\s*([^<]+?)\s*<\/loc>/i)?.[1]?.trim();
      if (!url || seen.has(url)) continue;
      seen.add(url);
      const img = b.match(/<image:loc>\s*([^<]+?)\s*<\/image:loc>/i)?.[1]?.trim();
      items.push({ url, sitemapImage: img });
      if (items.length >= limit * 2) break;
    }
  }
  return items;
}

// ── Çıkarım: JSON-LD Product öncelikli, meta fallback ──────────────────────────
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
        const availRaw = off?.availability || '';
        return {
          title: clean(n.name),
          price:
            typeof priceRaw === 'number'
              ? priceRaw
              : parseFloat(String(priceRaw ?? '').replace(/,/g, '')) || null,
          currency: (off?.priceCurrency || 'TRY').toUpperCase(),
          image: Array.isArray(n.image) ? n.image[0] : n.image,
          sku: n.sku || n.mpn || n.productId || n.gtin13 || null,
          inStock: /InStock/i.test(availRaw) || availRaw === '',
          desc: clean(n.description),
        };
      }
    }
  }
  return null;
}

function fromMeta(html) {
  const meta = (n) => {
    const a = html.match(
      new RegExp(`<meta[^>]+(?:property|name)=["']${n}["'][^>]+content=["']([^"']*)`, 'i'),
    );
    if (a) return a[1];
    const b = html.match(
      new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${n}["']`, 'i'),
    );
    return b ? b[1] : null;
  };
  const title = meta('og:title') || html.match(/<title>([^<]+)/i)?.[1];
  if (!title) return null;
  const priceRaw = meta('product:price:amount') || meta('og:price:amount');
  let price = priceRaw ? parseFloat(String(priceRaw).replace(/,/g, '')) : null;
  if (!price) {
    const pm = html.match(/(\d[\d.]*[.,]\d{2})\s*(?:TL|₺|TRY)/i);
    if (pm) price = parseFloat(pm[1].replace(/\./g, '').replace(',', '.'));
  }
  const avail = meta('product:availability') || meta('og:availability') || '';
  return {
    title: clean(title),
    price,
    currency: (meta('og:price:currency') || 'TRY').toUpperCase(),
    image: meta('og:image'),
    sku: null,
    inStock: !/out\s*of\s*stock|outofstock/i.test(avail),
    desc: clean(meta('og:description')),
  };
}

function absImage(img) {
  if (!img) return undefined;
  if (/^https?:\/\//i.test(img)) return img.replace(/^http:\/\//i, 'https://');
  if (img.startsWith('//')) return 'https:' + img;
  return CDN + (img.startsWith('/') ? '' : '/') + img;
}

async function main() {
  const limit = Number(process.argv[2]) || 1000;
  mkdirSync('scripts/out', { recursive: true });
  console.log(`Vitamin Box scrape (ikas) — hedef ${limit} ürün\n`);

  const products = await discoverProducts(limit);
  console.log(`▸ sitemap'ten ${products.length} ürün URL'i toplandı (aşırı-çekim)`);

  const out = [];
  const seenExt = new Set();
  let miss = 0;
  let oos = 0;
  let idx = 0;

  async function worker() {
    while (idx < products.length && out.length < limit) {
      const { url, sitemapImage } = products[idx++];
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
      const e = fromJsonLd(page.body) || fromMeta(page.body);
      if (!e || !e.title || !e.price) {
        miss++;
        continue;
      }
      if (!e.inStock) {
        oos++;
        continue;
      }
      const image = absImage(e.image) || absImage(sitemapImage);
      if (!image || !/^https:\/\//i.test(image)) {
        miss++;
        continue;
      }
      // externalId benzersiz olmalı: sku yoksa slug'tan türet
      let externalId = String(e.sku || '').trim();
      if (!externalId) {
        const parts = url.replace(/\/$/, '').split('/');
        externalId = parts.pop() || parts.pop();
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
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  const final = out.slice(0, limit);
  writeFileSync(`scripts/out/ao-vitaminbox.json`, JSON.stringify(final, null, 2));
  console.log(
    `\n✅ ${final.length} ürün yazıldı → scripts/out/ao-vitaminbox.json (miss ${miss}, oos ${oos})`,
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
