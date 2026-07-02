/**
 * Özdilekteyim (Affocean offer_id 2889) ürün toplayıcı — "tabana kuvvet".
 *
 * Site SAP Hybris/Commerce (x-sap-pad header, /magaza/ + /market/ path'leri).
 * MNCDN arkasında ama Chrome UA ile düz curl/fetch 200 döner — Cloudflare/JS
 * challenge YOK. Generic scraper başarısız olduğu için markaya özel yazıldı.
 *
 * YÖNTEM (en hızlısı, doğrulandı ~11 sayfa/sn):
 *   1) sitemap index (/medias2/sitemap.xml) → 16 product chunk (product-tr-try-N.xml)
 *   2) her chunk'tan sınırlı dilim al, round-robin harmanla → katalog çeşitliliği
 *      (chunk'lar kategoriye göre gruplu; sadece chunk 0 alırsak hep lokum gelir)
 *   3) her ürün sayfasını Chrome UA ile çek, JSON-LD "Product" objesinden
 *      name/sku/image/price/availability çıkar (temiz + mutlak https görsel)
 *   4) sadece InStock + price>0 + görsel + sku olanları al
 *
 * Her link Affocean (ad.afftrck.com) deep-link tracking'ine sarılır → BAĞIŞ korunur.
 *
 * Çıktı: scripts/out/ao-ozdilek.json
 *
 * Kullanım:
 *   node scripts/brand-ozdilek.mjs           # hedef 1000
 *   node scripts/brand-ozdilek.mjs 500
 */
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';

const OFFER = '2889';
const FEED = '2889';
const AFF_ID = '7873';
const TRACK = 'ad.afftrck.com';
const BRAND = 'Özdilekteyim';
const BASE = 'https://www.ozdilekteyim.com';
const SITEMAP_INDEX = 'https://www.ozdilekteyim.com/medias2/sitemap.xml';
const DONATION_RATE = 3.5;
const TARGET = Number(process.argv[2] || 1000);
const CONC = Number(process.env.OZ_CONC || 8);
const MAX_MS = Number(process.env.OZ_MAX_MS || 300000); // ~5 dk zaman kalkanı
const OUT_PATH = 'scripts/out/ao-ozdilek.json';

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

async function get(url, tries = 5) {
  for (let attempt = 0; attempt < tries; attempt++) {
    try {
      const r = await fetch(url, {
        headers: { 'User-Agent': UA, 'Accept-Language': 'tr,en;q=0.8', Accept: '*/*' },
        redirect: 'follow',
      });
      if ((r.status === 429 || r.status === 503) && attempt < tries - 1) {
        await sleep(1500 * (attempt + 1) + Math.random() * 700);
        continue;
      }
      const body = await r.text();
      return { status: r.status, ok: r.ok, body };
    } catch {
      if (attempt === tries - 1) return { status: 0, ok: false, body: '' };
      await sleep(700 * (attempt + 1));
    }
  }
  return { status: 0, ok: false, body: '' };
}

const locs = (xml) =>
  [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map((m) => m[1].trim());

// Ürün sayfasından JSON-LD "Product" objesini çöz → kanonik ürün (yoksa null)
function extract(url, html) {
  const ldRe = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g;
  let m;
  while ((m = ldRe.exec(html))) {
    let j;
    try {
      j = JSON.parse(m[1].trim());
    } catch {
      continue;
    }
    const arr = Array.isArray(j) ? j : [j];
    for (const o of arr) {
      if (!o || o['@type'] !== 'Product') continue;
      const off = Array.isArray(o.offers) ? o.offers[0] : o.offers || {};
      const price = Number(off.price);
      const avail = String(off.availability || '');
      const inStock = avail ? avail.includes('InStock') : price > 0;
      if (!(o.name && price > 0 && inStock)) continue;
      const rawImg = Array.isArray(o.image) ? o.image[0] : o.image;
      const img = absImage(rawImg);
      if (!img) continue;
      const externalId = String(o.sku || o.mpn || '').trim();
      if (!externalId) continue;
      const title = clean(o.name);
      const desc =
        clean(o.description).slice(0, 500) ||
        `${title} — Özdilekteyim'de.`;
      const pageUrl =
        off.url && String(off.url).startsWith('http')
          ? String(off.url)
          : o.url && String(o.url).startsWith('http')
            ? String(o.url)
            : url;
      return {
        externalId,
        title,
        description: desc,
        price,
        imageLink: img,
        productUrl: pageUrl,
      };
    }
  }
  return null;
}

async function main() {
  const t0 = Date.now();
  console.log(`[ozdilek] hedef ${TARGET} ürün, concurrency ${CONC}`);

  // Sitemap index → product chunk'ları
  const idx = await get(SITEMAP_INDEX);
  const chunks = locs(idx.body).filter((u) => /product-tr-try-\d+\.xml/.test(u));
  console.log(`[ozdilek] ${chunks.length} product sitemap chunk bulundu`);

  // Her chunk'tan sınırlı dilim al → round-robin harmanla → çeşitlilik + plato kırıcı.
  const perChunk = [];
  const seen = new Set();
  const PER_CHUNK_TAKE = Math.max(
    200,
    Math.ceil((TARGET * 6) / Math.max(1, chunks.length)),
  );
  let poolTotal = 0;
  for (const ch of chunks) {
    const r = await get(ch);
    const list = [];
    for (const u of locs(r.body)) {
      if (list.length >= PER_CHUNK_TAKE) break;
      // Ürün URL'leri /magaza/ veya /market/ altında; kategori/marka sayfalarını ele
      if (/\/(magaza|market)\/[^/]+$/.test(u) && !seen.has(u)) {
        seen.add(u);
        list.push(u);
      }
    }
    if (list.length) {
      perChunk.push(list);
      poolTotal += list.length;
    }
  }
  console.log(
    `[ozdilek] ${chunks.length} chunk'tan ${poolTotal} aday toplandı (chunk başına ≤${PER_CHUNK_TAKE})`,
  );

  const candidates = [];
  for (let k = 0; candidates.length < poolTotal; k++) {
    let added = false;
    for (const list of perChunk) {
      if (k < list.length) {
        candidates.push(list[k]);
        added = true;
      }
    }
    if (!added) break;
  }
  console.log(`[ozdilek] ${candidates.length} aday URL, ürün sayfaları çekiliyor...`);

  // Birikim modu: mevcut çıktıyı önyükle → rate-limit kesse bile ilerleme kaybolmaz.
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
      console.log(`[ozdilek] mevcut ${out.length} ürün önyüklendi (birikim modu)`);
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
            id: `affocean-${OFFER}-${cp.externalId}`,
            source: 'affocean',
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
        console.log(
          `[ozdilek] işlenen ${processed}, toplanan ${out.length}/${TARGET}`,
        );
        flush();
      }
    }
  }

  await Promise.all(Array.from({ length: CONC }, worker));

  const trimmed = out.slice(0, TARGET);
  flush();

  const dur = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(
    `[ozdilek] BİTTİ → ${trimmed.length} ürün, ${processed} sayfa işlendi, ${dur}s`,
  );
  console.log(`[ozdilek] çıktı: ${OUT_PATH}`);
}

main().catch((e) => {
  console.error('[ozdilek] HATA:', e);
  process.exit(1);
});
