/**
 * Colins (ReklamAction offer_id 3678) ürün toplayıcı — SPEED RACE.
 *
 * NOT: Site "SFCC" ipucu verilmişti ama gerçekte T-Soft tabanlı bir platform
 * (Themes/Branch, img-colinstr.mncdn.com CDN). SFCC grid API'si YOK.
 *
 * En hızlı çalışan yöntem:
 *   1) Sitemap index: /Sitemap → /SitemapProducts (robots.txt bunu işaret eder;
 *      /sitemap.xml HTML döner = tuzak). ~5292 ürün URL'si (/p/<slug>-<id>).
 *   2) Her ürün sayfasında TEK ve TEMİZ bir JSON-LD "Product" bloğu var:
 *      name / sku (varyant-benzersiz) / image[] (mutlak https CDN) / description /
 *      offers.price (ondalıklı, TRY) / offers.availability (InStock|OutOfStock).
 *   3) gzip (--compressed eşdeğeri) ile sayfa 412KB→~93KB → sınırlı eşzamanlılıkla hızlı.
 *   4) Sadece availability === InStock olanlar alınır.
 *   5) Her link ReklamAction (ad.reklm.com) deep-link'ine sarılır → BAĞIŞ korunur.
 *
 * Çıktı: scripts/out/ra-colins.json  (CanonicalProduct şeması ile uyumlu)
 *
 * Kullanım:
 *   node scripts/brand-colins.mjs           # hedef 1000
 *   node scripts/brand-colins.mjs 500       # hedef 500
 */
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';

const OFFER = '3678';
const FEED = '3678';
const AFF_ID = '35329';
const TRACK = 'ad.reklm.com';
const BRAND = 'Colins';
const BASE = 'https://www.colins.com.tr';
const SITEMAP_INDEX = 'https://www.colins.com.tr/Sitemap';
const DONATION_RATE = 9;
const TARGET = Number(process.argv[2] || 1000);
const CONC = Number(process.env.COLINS_CONC || 12);
const MAX_MS = Number(process.env.COLINS_MAX_MS || 300000); // ~5 dk zaman kalkanı
const OUT_PATH = 'scripts/out/ra-colins.json';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const clean = (s) =>
  (s || '')
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

// Mutlak, https, yüklenebilir görsel garanti et
const absImage = (src) => {
  if (!src) return null;
  let u = String(src).trim();
  if (u.startsWith('//')) u = 'https:' + u;
  else if (u.startsWith('/')) u = BASE + u;
  else if (u.startsWith('http://')) u = 'https://' + u.slice(7);
  return u.startsWith('https://') ? u : null;
};

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

// gzip destekli fetch — büyük HTML sayfaları için transferi ~4x düşürür.
async function get(url, tries = 4) {
  for (let attempt = 0; attempt < tries; attempt++) {
    try {
      const r = await fetch(url, {
        headers: {
          'User-Agent': UA,
          'Accept-Language': 'tr,en;q=0.8',
          Accept: '*/*',
          'Accept-Encoding': 'gzip',
        },
        redirect: 'follow',
      });
      if ((r.status === 429 || r.status === 503) && attempt < tries - 1) {
        await sleep(1200 * (attempt + 1) + Math.random() * 600);
        continue;
      }
      // node fetch gzip'i OTOMATİK açar (Accept-Encoding: gzip göndersek de
      // .text() zaten decode edilmiş gövdeyi verir) → transfer küçük, kod basit.
      const body = await r.text();
      return { status: r.status, ok: r.ok, body };
    } catch {
      if (attempt === tries - 1) return { status: 0, ok: false, body: '' };
      await sleep(600 * (attempt + 1));
    }
  }
  return { status: 0, ok: false, body: '' };
}

const locs = (xml) =>
  [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map((m) => m[1].trim());

// Bir ürün sayfasından kanonik ürün üret (yoksa null)
function extract(url, html) {
  const idm = url.match(/-(\d+)(?:[/?#].*)?$/);
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
      const off = Array.isArray(o.offers) ? o.offers[0] : o.offers || {};
      // Fiyat: ondalık nokta korunur (Number parse zaten korur).
      const price = Number(off.price);
      const avail = String(off.availability || '');
      // Sadece stokta olanlar
      if (!avail.includes('InStock')) continue;
      if (!(price > 0)) continue;

      const rawImg = Array.isArray(o.image) ? o.image[0] : o.image;
      const img = absImage(rawImg);
      if (!img) continue;

      // externalId: sku varyant-benzersiz → yoksa gtin/mpn → yoksa urlId
      const externalId = String(
        (o.sku && clean(o.sku)) ||
          (o.mpn && clean(o.mpn)) ||
          urlId ||
          '',
      ).trim();
      if (!externalId) continue;

      const title = clean(o.name);
      if (!title) continue;

      const desc =
        clean(o.description).slice(0, 500) ||
        `${title} — Colin's'te.`;

      // Deep-link için kanonik ürün sayfası (https).
      const dest = url;
      return {
        externalId,
        title,
        description: desc,
        price,
        salePrice: null,
        imageLink: img,
        productUrl: dest,
      };
    }
  }
  return null;
}

async function main() {
  const t0 = Date.now();
  console.log(`[colins] hedef ${TARGET} ürün, concurrency ${CONC}`);

  // Sitemap index → SitemapProducts
  const idx = await get(SITEMAP_INDEX);
  let prodMapUrl =
    locs(idx.body).find((u) => /SitemapProducts/i.test(u)) ||
    `${BASE}/SitemapProducts`;
  prodMapUrl = prodMapUrl.replace(/^http:/, 'https:');
  const prodMap = await get(prodMapUrl);
  // Ürün URL'leri: /p/<slug>-<id>
  const seen = new Set();
  const candidates = [];
  for (const u of locs(prodMap.body)) {
    // /p/<slug>-<id> — query/hash'i düşürüp sonun -<rakam> olmasını kontrol et
    const bare = u.replace(/[?#].*$/, '');
    if (/\/p\//.test(bare) && /-\d+$/.test(bare) && !seen.has(u)) {
      seen.add(u);
      candidates.push(u.replace(/^http:/, 'https:'));
    }
  }
  console.log(`[colins] ${candidates.length} aday ürün URL (SitemapProducts)`);

  // Mevcut çıktıyı önyükle → birikim modu (rate-limit / kesinti sonrası).
  const out = [];
  const byExt = new Set();
  try {
    const prev = JSON.parse(readFileSync(OUT_PATH, 'utf8'));
    if (Array.isArray(prev)) {
      for (const o of prev) {
        if (o && o.externalId && !byExt.has(o.externalId)) {
          byExt.add(o.externalId);
          out.push(o);
        }
      }
      if (out.length) console.log(`[colins] mevcut ${out.length} ürün önyüklendi`);
    }
  } catch {
    /* ilk çalıştırma */
  }

  mkdirSync('scripts/out', { recursive: true });
  const flush = () =>
    writeFileSync(OUT_PATH, JSON.stringify(out.slice(0, TARGET), null, 2));

  let i = 0;
  let processed = 0;

  async function worker() {
    while (i < candidates.length && out.length < TARGET) {
      if (Date.now() - t0 > MAX_MS) break;
      const url = candidates[i++];
      const r = await get(url);
      processed++;
      if (r.status === 200) {
        const cp = extract(url, r.body);
        if (cp && !byExt.has(cp.externalId)) {
          byExt.add(cp.externalId);
          out.push({
            id: `reklamaction-${OFFER}-${cp.externalId}`,
            source: 'reklamaction',
            feedId: FEED,
            offerId: OFFER,
            brandId: null,
            brandName: BRAND,
            externalId: cp.externalId,
            title: cp.title,
            description: cp.description,
            price: cp.price,
            salePrice: null,
            currency: 'TRY',
            imageLink: cp.imageLink,
            productUrl: deepLink(cp.productUrl),
            availability: 'in stock',
            donationRate: DONATION_RATE,
          });
        }
      }
      if (processed % 50 === 0) {
        console.log(`[colins] işlenen ${processed}, toplanan ${out.length}/${TARGET}`);
        flush();
      }
    }
  }

  await Promise.all(Array.from({ length: CONC }, worker));

  flush();
  const dur = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(
    `[colins] BİTTİ → ${out.slice(0, TARGET).length} ürün, ${processed} sayfa işlendi, ${dur}s`,
  );
  console.log(`[colins] çıktı: ${OUT_PATH}`);
}

main().catch((e) => {
  console.error('[colins] HATA:', e);
  process.exit(1);
});
