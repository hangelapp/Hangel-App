/**
 * Boyner (GelirOrtakları offer_id 6568) ürün toplayıcı — "tabana kuvvet".
 *
 * GelirOrtakları SKU feed'i vermediği için Boyner'in kendi sitemap'inden ürün
 * URL'leri toplanır, her ürün sayfası Chrome UA ile çekilir ve JSON-LD Product
 * objesinden (fallback: __NEXT_DATA__) başlık/fiyat/görsel/sku çıkarılır. Her
 * link GelirOrtakları (tr.rdrtr.com) deep-link tracking'ine sarılır → BAĞIŞ korunur.
 *
 * Çıktı: scripts/out/go-boyner.json  (CanonicalProduct şeması ile uyumlu)
 *
 * Kullanım:
 *   node scripts/brand-boyner.mjs           # hedef 1000
 *   node scripts/brand-boyner.mjs 500       # hedef 500
 */
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';

const OFFER = '6568';
const FEED = '6568';
const AFF_ID = '37081';
const TRACK = 'tr.rdrtr.com';
const BRAND = 'Boyner';
const BASE = 'https://www.boyner.com.tr';
const SITEMAP_INDEX = 'https://sitemap.boyner.com.tr/bynsitemap/product.xml';
const DONATION_RATE = 3;
const TARGET = Number(process.argv[2] || 1000);
const CONC = Number(process.env.BOYNER_CONC || 6); // rate-limit'e nazik
const MAX_MS = Number(process.env.BOYNER_MAX_MS || 300000); // ~5 dk zaman kalkanı

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
      // 429 / 503 → rate-limit; backoff + retry (429 gövdesini geçerli sayma)
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

// __NEXT_DATA__ içinde fiyat+isim taşıyan product objesini bul (fallback)
function findProduct(json) {
  let found = null;
  const walk = (o, d) => {
    if (found || d > 14 || !o || typeof o !== 'object') return;
    if (
      !Array.isArray(o) &&
      ('displayName' in o || 'name' in o) &&
      ('price' in o || 'salePrice' in o || 'listPrice' in o)
    ) {
      found = o;
      return;
    }
    for (const k in o) walk(o[k], d + 1);
  };
  walk(json, 0);
  return found;
}

// Bir ürün sayfasından kanonik ürün üret (yoksa null)
function extract(url, html) {
  const idm = url.match(/-p-(\d+)/);
  const urlId = idm ? idm[1] : null;

  // 1) JSON-LD Product (en temiz — mutlak görsel + sku + fiyat + stok)
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
      const price = Number(off.price);
      const avail = String(off.availability || '');
      const inStock = avail ? avail.includes('InStock') : price > 0;
      if (!(o.name && price > 0 && inStock)) continue;
      const rawImg = Array.isArray(o.image) ? o.image[0] : o.image;
      const img = absImage(rawImg);
      if (!img) continue;
      const externalId = String(o.sku || o.mpn || urlId || '').trim();
      if (!externalId) continue;
      const title = clean(o.name);
      const desc =
        clean(o.description).slice(0, 500) ||
        `${title} — Boyner'de indirimli fiyata.`;
      return {
        externalId,
        title,
        description: desc,
        price,
        salePrice: null,
        imageLink: img,
        productUrl: (off.url && String(off.url).startsWith('http')) ? off.url : url,
      };
    }
  }

  // 2) __NEXT_DATA__ fallback
  const nd = html.match(
    /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/,
  );
  if (nd) {
    try {
      const j = JSON.parse(nd[1]);
      const p = findProduct(j);
      if (p) {
        const price = Number(p.salePrice ?? p.price ?? p.listPrice);
        const title = clean(p.displayName || p.name);
        let img = null;
        const imgSrc =
          (p.images && (p.images[0]?.url || p.images[0]?.src || p.images[0])) ||
          p.image ||
          p.imageUrl;
        img = absImage(imgSrc);
        const externalId = String(p.sku || p.id || p.productId || urlId || '').trim();
        if (title && price > 0 && img && externalId) {
          return {
            externalId,
            title,
            description:
              clean(p.description).slice(0, 500) ||
              `${title} — Boyner'de indirimli fiyata.`,
            price,
            salePrice: null,
            imageLink: img,
            productUrl: url,
          };
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
  console.log(`[boyner] hedef ${TARGET} ürün, concurrency ${CONC}`);

  // Sitemap index → product chunk'ları
  const idx = await get(SITEMAP_INDEX);
  const chunks = locs(idx.body).filter((u) => /product\d+\.xml/.test(u));
  console.log(`[boyner] ${chunks.length} product sitemap chunk bulundu`);

  // Aday ürün URL'leri topla. ÖNEMLİ: tek chunk içinde ürünler markaya/renk
  // varyasyonuna göre gruplandığı için ardışık URL'ler aynı SKU'yu paylaşabilir
  // veya blok halinde stok-dışı olabilir (bu "plato" 488'de takıldığımız yerdi).
  // Çözüm: TÜM chunk'lardan sınırlı dilim al → havuz tüm kataloğa yayılsın.
  const perChunk = [];
  const seen = new Set();
  // Her chunk'tan bu kadar aday çek (38 chunk × ~450 ≈ 17k aday → 1000 için bol).
  const PER_CHUNK_TAKE = Math.max(300, Math.ceil((TARGET * 12) / chunks.length));
  let poolTotal = 0;
  for (const ch of chunks) {
    const r = await get(ch);
    const list = [];
    for (const u of locs(r.body)) {
      if (list.length >= PER_CHUNK_TAKE) break;
      if (/-p-\d+$/.test(u) && !seen.has(u)) {
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
    `[boyner] ${chunks.length} chunk'tan ${poolTotal} aday toplandı (chunk başına ≤${PER_CHUNK_TAKE})`,
  );
  // Round-robin harmanla → farklı chunk'lardan sırayla → çeşitlilik + plato kırıcı
  const candidates = [];
  for (let idx2 = 0; candidates.length < poolTotal; idx2++) {
    let added = false;
    for (const list of perChunk) {
      if (idx2 < list.length) {
        candidates.push(list[idx2]);
        added = true;
      }
    }
    if (!added) break;
  }
  console.log(`[boyner] ${candidates.length} aday URL, ürün sayfaları çekiliyor...`);

  // Mevcut çıktıyı önyükle → asla gerileme, ilerleme birikir (rate-limit'e karşı).
  const out = [];
  const byExt = new Set();
  try {
    const prev = JSON.parse(readFileSync('scripts/out/go-boyner.json', 'utf8'));
    if (Array.isArray(prev)) {
      for (const o of prev) {
        if (o && o.externalId && !byExt.has(o.externalId)) {
          byExt.add(o.externalId);
          out.push(o);
        }
      }
      console.log(`[boyner] mevcut ${out.length} ürün önyüklendi (birikim modu)`);
    }
  } catch {
    /* ilk çalıştırma */
  }
  const OUT_PATH = 'scripts/out/go-boyner.json';
  mkdirSync('scripts/out', { recursive: true });
  const flush = () =>
    writeFileSync(OUT_PATH, JSON.stringify(out.slice(0, TARGET), null, 2));
  let i = 0;
  let processed = 0;

  async function worker() {
    while (i < candidates.length && out.length < TARGET) {
      if (Date.now() - t0 > MAX_MS) break; // zaman kalkanı
      const url = candidates[i++];
      const r = await get(url);
      processed++;
      if (r.status === 200) {
        const cp = extract(url, r.body);
        if (cp && !byExt.has(cp.externalId)) {
          byExt.add(cp.externalId);
          out.push({
            id: `gelirortaklari-${OFFER}-${cp.externalId}`,
            source: 'gelirortaklari',
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
        console.log(`[boyner] işlenen ${processed}, toplanan ${out.length}/${TARGET}`);
        flush(); // checkpoint → rate-limit kesse bile ilerleme kaybolmaz
      }
    }
  }

  await Promise.all(Array.from({ length: CONC }, worker));

  const trimmed = out.slice(0, TARGET);
  flush();

  const dur = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(
    `[boyner] BİTTİ → ${trimmed.length} ürün, ${processed} sayfa işlendi, ${dur}s`,
  );
  console.log(`[boyner] çıktı: scripts/out/go-boyner.json`);
}

main().catch((e) => {
  console.error('[boyner] HATA:', e);
  process.exit(1);
});
