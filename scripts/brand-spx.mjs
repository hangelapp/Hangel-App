/**
 * SPX (spx.com.tr) ürün scraper — hangel.org / Affocean offer_id 2294.
 *
 * Platform: Akinon commerce. Ürün sayfaları temiz schema.org/Product JSON-LD içeriyor
 * (name, sku, image[]=mutlak HTTPS a-cdn.akinoncdn.com, offers.price, availability, description).
 * Sitemap index → sitemap-products-*.xml.gz (S3, düz XML olarak decompress edilir) → flat slug URL'leri.
 * Fallback: OpenGraph/meta (og:title, og:image, og:price:amount).
 *
 * Çıktı şeması Affocean CanonicalProduct ile uyumlu; productUrl BAĞIŞ korumalı
 * Affocean deep-link'e sarılır (ad.afftrck.com).
 *
 * Usage:  node scripts/brand-spx.mjs [limit]        (default 1000)
 */
import { writeFileSync, mkdirSync } from 'node:fs';

const OFFER = '2294';
const AFF_ID = '7873';
const TRACK = 'ad.afftrck.com';
const BRAND_NAME = 'SPX';
const BASE = 'https://www.spx.com.tr';
const CDN = 'https://akn-spx.a-cdn.akinoncdn.com';
const DONATION_RATE = 5.5;
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36';

const clean = (s) =>
  (s || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

const deepLink = (dest) =>
  `https://${TRACK}/aff_c?offer_id=${OFFER}&aff_id=${AFF_ID}&url=${encodeURIComponent(dest)}`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// AWS WAF (awselb/2.0) yüksek eşzamanlılıkta "Human Verification" (405, ~2KB) challenge döner.
// Bunu miss saymak yerine backoff'la yeniden dene; hâlâ 405 ise ok:false döner.
async function get(url, tries = 3) {
  for (let attempt = 0; attempt < tries; attempt++) {
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
      await sleep(500 * (attempt + 1));
      continue;
    }
    const body = await r.text();
    // WAF challenge sayfası: 405 + awswaf marker → backoff + retry
    if (r.status === 405 && /awswaf|Human Verification/i.test(body)) {
      await sleep(800 * (attempt + 1));
      continue;
    }
    return { status: r.status, ok: r.ok, body, url: r.url };
  }
  return { status: 405, ok: false, body: '', url };
}

const locs = (xml) => [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map((m) => m[1].trim());

// sitemap.xml → sitemap-products-*.xml.gz (fetch decompresses gz automatically) → flat product URL'leri
// Widened: TÜM ürün sitemap URL'lerini topla (cap yok); worker'lar limit'e ulaşınca durur.
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
      // Ürün URL'leri: /list/, /erkek/ vb. kategori değil; flat slug + trailing slash
      if (/^https?:\/\/www\.spx\.com\.tr\/[^/]+\/$/.test(loc)) urls.add(loc);
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
        return {
          title: clean(n.name),
          price:
            typeof priceRaw === 'number'
              ? priceRaw
              : parseFloat(String(priceRaw ?? '').replace(/[^\d.,]/g, '').replace(/\.(?=\d{3}\b)/g, '').replace(',', '.')) || null,
          currency: (off?.priceCurrency || 'TRY').toUpperCase(),
          image: Array.isArray(n.image) ? n.image[0] : n.image,
          sku: n.sku || n.mpn || n.gtin13 || null,
          availability: /InStock/i.test(off?.availability || '') ? 'in stock' : 'out',
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
  let price = priceRaw ? parseFloat(priceRaw) : null;
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
    availability: /out|oos/i.test(avail) ? 'out' : 'in stock',
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
  console.log(`SPX scrape — hedef ${limit} ürün\n`);

  const productUrls = await discoverProductUrls();
  console.log(`▸ sitemap'ten ${productUrls.length} aday ürün URL'i toplandı`);

  const out = [];
  const seenExt = new Set();
  let miss = 0;
  let oos = 0;
  // WAF-dostu: düşük eşzamanlılık ani challenge tetiklemesini azaltır (env ile ayarlanabilir).
  const CONCURRENCY = Number(process.env.SPX_CONCURRENCY) || 6;
  let idx = 0;

  async function worker() {
    while (idx < productUrls.length && out.length < limit) {
      const url = productUrls[idx++];
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
      if (e.availability !== 'in stock') {
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

  writeFileSync(`scripts/out/ao-spx.json`, JSON.stringify(out, null, 2));
  console.log(
    `\n✅ ${out.length} ürün yazıldı → scripts/out/ao-spx.json (miss ${miss}, oos ${oos})`,
  );
  if (out[0]) {
    const p = out[0];
    console.log(`   örnek: ${p.title} — ₺${p.price} | ${p.imageLink}`);
    console.log(`   url: ${p.productUrl}`);
  }
}

main().catch((e) => {
  console.error('HATA:', e.message);
  process.exit(1);
});
