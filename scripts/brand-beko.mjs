/**
 * Beko (beko.com.tr) ürün scraper — Affocean offer_id 2546.
 *
 * beko.com.tr SAP Hybris + Akamai arkasında. Bulgular (2026-07-01):
 *  - Çıplak UA => 403. Tam tarayıcı header seti (Safari UA + Accept-Language +
 *    Sec-Fetch-*) + HTTP/2 ile HTML sayfaları ve sitemap NORMAL 200 döner.
 *  - Headless Chromium (Playwright) => 403 "Access Denied" (Akamai TLS/bot
 *    fingerprint). Bu yüzden tarayıcı DEĞİL, düz curl-benzeri fetch kullanıyoruz.
 *  - Ürün URL'leri: /sitemap.xml (index) -> PRODUCT-*.xml (context token'lı,
 *    ~4789 ürün). Sitemap ancak Referer + Sec-Fetch-Site: same-origin ile açılır.
 *  - Ürün verisi: sayfa içi GTM `ecommerce.detail.products[0]` bloğunda name / id
 *    (=SKU) / price / brand / category INLINE gelir. Fiyat = stok/satılabilirlik
 *    kıstası: fiyatı olmayan ürün (henüz satışta değil) ELENİR.
 *  - GÖRSEL: /media/resize/... ve /medias/*.webp yolları Akamai tarafından binary
 *    istekte 403 (flaky). ANCAK aynı görselin kaynağı, korumasız Azure blob'ta
 *    HTTP 200 servis edilir:
 *      https://gsim2hwnpbvwtwmb1dg11z6.blob.core.windows.net/media/documents/<basename>
 *    <basename> = sayfadaki ilk /media/resize/<basename>/<size>/image.ext dosyası.
 *
 * Her ürün Affocean deep-link'e sarılır (ad.afftrck.com) → tıklama izlenir, bağış
 * korunur. Çıktı: scripts/out/ao-beko.json  (CanonicalProduct şeması).
 *
 * Usage: node scripts/brand-beko.mjs [limit]   (default 1000)
 */
import { writeFileSync, mkdirSync } from 'node:fs';

const OUT_PATH = 'scripts/out/ao-beko.json';

const OFFER = '2546';
const AFF_ID = '7873';
const TRACK = 'ad.afftrck.com';
const BRAND_NAME = 'Beko';
const DONATION_RATE = 3;
const BASE = 'https://www.beko.com.tr';
const BLOB = 'https://gsim2hwnpbvwtwmb1dg11z6.blob.core.windows.net/media/documents';

const LIMIT = Number(process.argv[2]) || 1000;
const CONCURRENCY = 4; // Akamai yük altında rejim değiştiriyor; ölçülü tut

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15';

const clean = (s) =>
  (s || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&#0?34;/g, '"')
    .replace(/\\\//g, '/')
    .replace(/\s+/g, ' ')
    .trim();

const deepLink = (dest) =>
  `https://${TRACK}/aff_c?offer_id=${OFFER}&aff_id=${AFF_ID}&url=${encodeURIComponent(dest)}`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Tarayıcı-benzeri HTML/XML GET (Akamai'yı geçen header seti). */
async function getDoc(url, referer, site = 'none') {
  const headers = {
    'User-Agent': UA,
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': site,
    'Upgrade-Insecure-Requests': '1',
  };
  if (referer) headers.Referer = referer;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url.slice(0, 90)}`);
  return res.text();
}

/** Blob görselinin gerçekten HTTP 200 döndüğünü doğrula (HEAD). */
async function imageOk(url) {
  try {
    const res = await fetch(url, { method: 'HEAD', headers: { 'User-Agent': UA } });
    return res.ok && /^image\//.test(res.headers.get('content-type') || '');
  } catch {
    return false;
  }
}

/** Sitemap index -> PRODUCT-*.xml -> ürün URL listesi. */
async function collectProductUrls() {
  const index = await getDoc(`${BASE}/sitemap.xml`, `${BASE}/`, 'same-origin');
  const maps = [...index.matchAll(/<loc>\s*([^<]*PRODUCT[^<]*)<\/loc>/gi)].map((m) => m[1].trim());
  if (!maps.length) throw new Error('PRODUCT sitemap bulunamadı');
  const urls = [];
  for (const m of maps) {
    const xml = await getDoc(m, `${BASE}/sitemap.xml`, 'same-origin');
    for (const u of [...xml.matchAll(/<loc>\s*(https:\/\/www\.beko\.com\.tr\/[^<]+)<\/loc>/gi)]) {
      urls.push(u[1].trim());
    }
  }
  return [...new Set(urls)];
}

/** Ürün sayfasından kanonik ürün çıkar (null => elenir). */
async function parseProduct(url) {
  const html = await getDoc(url);

  // GTM ecommerce.detail.products[0]
  const di = html.indexOf('"detail"');
  if (di < 0) return null;
  const blk = html.slice(di, di + 900);
  const price = parseFloat((blk.match(/"price"\s*:\s*"([^"]+)"/) || [])[1] ?? '');
  if (!Number.isFinite(price) || price <= 0) return null; // fiyatsız = satışta değil => in-stock değil
  const sku = (blk.match(/"id"\s*:\s*"(\d+)"/) || [])[1];
  if (!sku) return null;
  const gtmName = clean((blk.match(/"name"\s*:\s*"([^"]*)"/) || [])[1]);

  // Başlık: h1 > gtm name
  const h1 = clean((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1]);
  const title = (h1 || gtmName || BRAND_NAME).slice(0, 200);

  // Açıklama: meta description
  const desc = clean(
    (html.match(/<meta[^>]+name="description"[^>]+content="([^"]*)"/i) || [])[1]
  ).slice(0, 500);

  // Görsel: ilk /media/resize/<basename> => korumasız Azure blob
  const basename = (html.match(/\/media\/resize\/([^\/"]+\.(?:png|jpg|jpeg|webp))\//i) || [])[1];
  if (!basename) return null;
  const imageLink = `${BLOB}/${basename}`;
  if (!(await imageOk(imageLink))) return null; // şema: imageLink HTTP 200 ŞART

  return {
    id: `affocean-${OFFER}-${sku}`,
    source: 'affocean',
    feedId: OFFER,
    offerId: OFFER,
    brandId: null,
    brandName: BRAND_NAME,
    externalId: sku,
    title,
    description: desc || title,
    price,
    salePrice: null,
    currency: 'TRY',
    imageLink,
    productUrl: deepLink(url),
    availability: 'in stock',
    donationRate: DONATION_RATE,
  };
}

async function main() {
  mkdirSync('scripts/out', { recursive: true });
  console.log('▸ Sitemap çekiliyor...');
  const urls = await collectProductUrls();
  console.log(`▸ ${urls.length} ürün URL'si bulundu. Hedef: ${LIMIT} in-stock.`);

  const out = [];
  const seen = new Set();
  let idx = 0;
  let processed = 0;

  async function worker() {
    while (idx < urls.length && out.length < LIMIT) {
      const url = urls[idx++];
      processed++;
      try {
        const p = await parseProduct(url);
        if (p && !seen.has(p.externalId)) {
          seen.add(p.externalId);
          out.push(p);
        }
      } catch (e) {
        // 403/timeout: kısa bekle (Akamai rate limitini soğut)
        if (/HTTP 403/.test(e.message)) await sleep(400);
      }
      if (processed % 50 === 0) {
        console.log(`  … ${processed} işlendi, ${out.length} in-stock`);
      }
      await sleep(60); // nazik hız
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  const trimmed = out.slice(0, LIMIT);
  writeFileSync(OUT_PATH, JSON.stringify(trimmed, null, 2));
  console.log(`✔ ${trimmed.length} ürün yazıldı → ${OUT_PATH} (işlenen: ${processed}/${urls.length})`);
}

main().catch((e) => {
  console.error('HATA:', e.message);
  process.exit(1);
});
