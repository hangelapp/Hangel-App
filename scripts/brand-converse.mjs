/**
 * Converse (converse.com.tr) ürün scraper — hangel.org / Affocean offer_id 2829.
 *
 * NEDEN AYRI SCRIPT:
 *   Genel scrape-affocean-products.mjs Converse'te 0 ürün buluyordu çünkü ürün-URL
 *   regex'i `/p/|-p-|/product` idi; Converse ürün URL'leri `/urun/<slug>/<sku>/`
 *   kalıbında. Ayrıca sitemap index çocukları `.gz` uzantılı (sunucu düz XML
 *   döndürüyor, curl/fetch otomatik decompress ediyor).
 *
 * Platform: Akinon commerce. Ürün sayfaları temiz schema.org/Product JSON-LD içeriyor
 * (name, sku, image=mutlak HTTPS CDN, offers.price, availability, description).
 * Fallback: OpenGraph/meta (og:title, og:image, og:price:amount).
 *
 * Çıktı şeması src/lib/feed CanonicalProduct ile uyumlu; productUrl BAĞIŞ korumalı
 * Affocean deep-link'e sarılır (ad.afftrck.com).
 *
 * Usage:  node scripts/brand-converse.mjs [limit]        (default 1000)
 */
import { writeFileSync, mkdirSync } from 'node:fs';

const OFFER = '2829';
const AFF_ID = '7873';
const TRACK = 'ad.afftrck.com';
const BRAND_NAME = 'Converse';
const DONATION_RATE = 7;
const BASE = 'https://www.converse.com.tr';
const CDN = 'https://akn-converse.a-cdn.akinoncloud.com';
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

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

// Retry/backoff: site 403/429 ile hız kısıtlar ve blok ~60-90 sn sürer.
// Bu yüzden uzun, artan bekleme (15/25/40/60 sn) ile ~140 sn'ye kadar dener.
const BACKOFF = [15000, 25000, 40000, 60000];
async function get(url, tries = 5) {
  for (let i = 0; i < tries; i++) {
    let r;
    try {
      r = await fetch(url, {
        headers: {
          'User-Agent': UA,
          'Accept-Language': 'tr,en;q=0.8',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        redirect: 'follow',
      });
    } catch {
      if (i === tries - 1) throw new Error('fetch failed');
      await sleep(2000 * (i + 1));
      continue;
    }
    if ((r.status === 403 || r.status === 429 || r.status >= 500) && i < tries - 1) {
      await sleep((BACKOFF[i] ?? 60000) + Math.floor(Math.random() * 2000));
      continue;
    }
    return { status: r.status, ok: r.ok, body: await r.text(), url: r.url };
  }
}

const locs = (xml) => [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map((m) => m[1].trim());

// sitemap.xml → sitemap-products-*.xml.gz (düz XML döner) → /urun/ URL'leri
// TÜM ürün URL'lerini toplar (limit filtresi çekim/stok sonrası uygulanır).
async function discoverProductUrls() {
  const urls = new Set();
  const idx = await get(`${BASE}/sitemap.xml`);
  if (!idx.ok) throw new Error(`sitemap index ${idx.status}`);
  const productSitemaps = locs(idx.body).filter((u) => /sitemap-products/i.test(u));
  if (!productSitemaps.length) throw new Error('ürün sitemapi bulunamadı');
  for (const sm of productSitemaps) {
    let res;
    try {
      res = await get(sm);
    } catch {
      continue;
    }
    if (!res.ok) continue;
    for (const loc of locs(res.body)) {
      if (/\/urun\//.test(loc)) urls.add(loc);
    }
  }
  return [...urls];
}

// ── Çıkarım: JSON-LD Product öncelikli, meta fallback ─────────────────────────
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
        // schema.org fiyatı nokta-ondalık kullanır (ör. "3499.00"). Virgül varsa
        // TR biçimidir (nokta=binlik). Noktayı ondalık kabul et, virgülü değil.
        let price = null;
        if (typeof priceRaw === 'number') price = priceRaw;
        else if (priceRaw != null) {
          const s = String(priceRaw).trim();
          price = /,/.test(s)
            ? parseFloat(s.replace(/\./g, '').replace(',', '.')) || null
            : parseFloat(s) || null;
        }
        return {
          title: clean(n.name),
          price,
          currency: (off?.priceCurrency || 'TRY').toUpperCase(),
          image: Array.isArray(n.image) ? n.image[0] : n.image,
          sku: n.sku || n.mpn || n.gtin13 || null,
          availability: /OutOfStock|SoldOut|Discontinued/i.test(off?.availability || '')
            ? 'out of stock'
            : 'in stock',
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
  // og:price:amount Akinon'da temiz nokta-ondalık gelir (ör. "3499.30") → doğrudan parse
  const priceRaw = meta('product:price:amount') || meta('og:price:amount');
  let price = priceRaw ? parseFloat(String(priceRaw).replace(/,/g, '')) : null;
  if (!price) {
    // TR biçimli metin fiyat (ör. "3.499,30 TL"): nokta=binlik, virgül=ondalık
    const pm = html.match(/(\d[\d.]*,\d{2})\s*(?:TL|₺|TRY)/i);
    if (pm) price = parseFloat(pm[1].replace(/\./g, '').replace(',', '.'));
  }
  // og:availability / product:availability → stok bilgisi
  const av = meta('product:availability') || meta('og:availability') || '';
  return {
    title: clean(title),
    price,
    availability: /out|discontinued|sold/i.test(av) ? 'out of stock' : 'in stock',
    currency: (meta('og:price:currency') || 'TRY').toUpperCase(),
    image: meta('og:image'),
    sku: null,
    desc: clean(meta('og:description')),
  };
}

function absImage(img) {
  if (!img) return undefined;
  if (/^https?:\/\//i.test(img)) return img;
  if (img.startsWith('//')) return 'https:' + img;
  return CDN + (img.startsWith('/') ? '' : '/') + img;
}

async function main() {
  const limit = Number(process.argv[2]) || 1000;
  mkdirSync('scripts/out', { recursive: true });
  console.log(`Converse scrape — hedef en fazla ${limit} STOKTA ürün\n`);

  const productUrls = await discoverProductUrls();
  console.log(`▸ sitemap'ten ${productUrls.length} ürün URL'i toplandı (tüm katalog)`);

  const out = [];
  const seenExt = new Set();
  let miss = 0;
  let oos = 0;
  const CONCURRENCY = 3;
  let idx = 0;

  async function worker() {
    while (idx < productUrls.length && out.length < limit) {
      const url = productUrls[idx++];
      // Nazik hız: burst limiter'ı tetiklememek için istekler arası küçük gecikme
      await sleep(150 + Math.floor(Math.random() * 250));
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
      // STOKTA olmayanı atla
      if (e.availability && e.availability !== 'in stock') {
        oos++;
        continue;
      }
      const image = absImage(e.image);
      // imageLink zorunlu: mutlak https görseli olmayanı atla
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
      if (out.length >= limit) return;
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

  writeFileSync(`scripts/out/affocean-converse.json`, JSON.stringify(out, null, 2));
  console.log(
    `\n✅ ${out.length} stokta ürün yazıldı → scripts/out/affocean-converse.json (miss ${miss}, stok-dışı ${oos})`,
  );
  if (out[0]) {
    const p = out[0];
    console.log(`   örnek: ${p.title} — ₺${p.price} | ${p.imageLink}`);
  }
}

main().catch((e) => {
  console.error('HATA:', e.message);
  process.exit(1);
});
