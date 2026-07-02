/**
 * Mobeseavm (Affocean offer_id 2902) ürün toplayıcı — SPEED RACE.
 *
 * NEDEN AYRI SCRIPT (sitemap+JSON-LD FAIL):
 *   MobeseAVM bir Angular SPA'dır; www host'ta ürün HTML'i client-render edilir —
 *   raw HTML'de __NEXT_DATA__ yok, JSON-LD (ld+json) yok, www/api/v1/* ise 401.
 *   GERÇEK veri AUTH'SUZ ayrı API gateway host'unda: https://apigw.mobeseavm.com
 *     - Liste: /api/v1/products/list?page=N&size=500
 *              → {content:[{id,imageUrl,name,slug,price,salePrice,stockQuantity,
 *                            status,deleted,isApproved,barcode,brandName}], totalElements}
 *              (katalog ~49.9k; sku ve description YOK, bazı imageUrl null)
 *     - Detay: /api/v1/products/{id}
 *              → {sku, barcode, description, images[].imageUrl, price, salePrice,
 *                 stockQuantity, status, stockStatus, slug, ...}  (~0.14s/istek)
 *   Liste'den stokta adaylar süzülüp detay EŞZAMANLI çekilir (sku + description +
 *   garantili görsel). ad.afftrck.com host'u ne robots ne WAF ile korunuyor.
 *
 * Canlı ürün URL formatı: https://www.mobeseavm.com/{slug}-p  (HTTP 200;
 *   /urun/{slug} 404, bare /{slug} 301→-p). Deep-link bu -p URL'ini sarar → BAĞIŞ.
 *
 * Sadece in stock + price>0 + mutlak https görsel. externalId: sku → barcode → id.
 *
 * Kullanım: node scripts/brand-mobeseavm.mjs [limit]   (default 1000)
 * Çıktı:    scripts/out/ao-mobeseavm.json
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), 'out');
const OUT_FILE = join(OUT_DIR, 'ao-mobeseavm.json');

const OFFER = '2902';
const AFF_ID = '7873';
const TRACK = 'ad.afftrck.com';
const BRAND = 'Mobeseavm';
const SITE = 'https://www.mobeseavm.com';
const API = 'https://apigw.mobeseavm.com';
const DONATION_RATE = 7;
const PAGE_SIZE = 500;
const CONC = 16; // detay eşzamanlılığı

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const clean = (s) =>
  (s || '')
    .replace(/<[^>]*>/g, ' ') // tam HTML tag'leri
    .replace(/<[a-zA-Z/][^<]*$/g, ' ') // API'nin kestiği yarım tag (ör. "...<st...")
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\.{2,}\s*$/, '') // sondaki API ellipsis'i
    .replace(/\s+/g, ' ')
    .trim();

const deepLink = (dest) =>
  `https://${TRACK}/aff_c?offer_id=${OFFER}&aff_id=${AFF_ID}&url=${encodeURIComponent(dest)}`;

// Mutlak https görsel (Mobeseavm CDN mutlak https döner; yine de güvenceye al)
const absImage = (src) => {
  if (!src) return null;
  let u = String(src).trim();
  if (u.startsWith('//')) u = 'https:' + u;
  else if (u.startsWith('/')) u = SITE + u;
  if (u.startsWith('http://')) u = 'https://' + u.slice(7);
  return u.startsWith('https://') ? u : null;
};

async function getJson(url, { retries = 3 } = {}) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const r = await fetch(url, {
        headers: {
          'User-Agent': UA,
          Accept: 'application/json, text/plain, */*',
          'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8',
          Origin: SITE,
          Referer: SITE + '/',
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(30000),
      });
      if (r.status === 200) return await r.json();
      if (r.status === 404) return null; // kalıcı yok
    } catch {
      /* retry */
    }
    await new Promise((res) => setTimeout(res, 300 * (attempt + 1)));
  }
  return null;
}

// Liste öğesi stokta mı? (görsel şartı detayda garanti edilir)
const listInStock = (x) =>
  x &&
  x.status === true &&
  x.deleted === false &&
  x.isApproved === true &&
  Number(x.stockQuantity) > 0;

// Detaydan kanonik ürün üret (yoksa null)
function build(det, listItem) {
  if (!det) return null;

  // Stok teyidi (detay güncel)
  const qty = Number(det.stockQuantity);
  const stockOk =
    det.status !== false &&
    det.deleted !== true &&
    (qty > 0 || det.stockStatus === 'IN_STOCK');
  if (!stockOk) return null;

  // Fiyat: price = liste/normal, salePrice = indirimli (varsa ve düşükse)
  const price = Number(det.price);
  if (!(price > 0)) return null;
  let salePrice = null;
  const sp = Number(det.salePrice);
  if (det.salePrice != null && sp > 0 && sp < price) salePrice = sp;

  // Görsel: detay images[] → yoksa liste imageUrl
  const imgs = Array.isArray(det.images) ? det.images : [];
  const firstImg =
    (imgs.find((im) => im && im.imageUrl) || {}).imageUrl ||
    (listItem && listItem.imageUrl) ||
    null;
  const imageLink = absImage(firstImg);
  if (!imageLink) return null; // görselsiz ürün atlanır (şema mutlak https görsel ister)

  const title = clean(det.name || (listItem && listItem.name));
  if (!title) return null;

  const slug = det.slug || (listItem && listItem.slug);
  if (!slug) return null;

  // externalId: sku → barcode → id (benzersiz)
  const externalId = String(
    (det.sku && clean(det.sku)) ||
      (det.barcode && clean(det.barcode)) ||
      (listItem && listItem.barcode) ||
      det.id ||
      '',
  );
  if (!externalId) return null;

  // shortDescription bazen boş/junk (ör. <p><strong></strong></p>… ya da yarım
  // "<st…") → temizleyip anlamlı olanı seç, ikisi de boşsa başlığa düş.
  const desc =
    clean(det.shortDescription).slice(0, 500) ||
    clean(det.description).slice(0, 500) ||
    `${title} — ${BRAND}`;

  const pageUrl = `${SITE}/${slug}-p`;

  return {
    id: `affocean-${OFFER}-${externalId}`,
    source: 'affocean',
    feedId: OFFER,
    offerId: OFFER,
    brandId: null,
    brandName: BRAND,
    externalId,
    title,
    description: desc,
    price,
    salePrice,
    currency: 'TRY',
    imageLink,
    productUrl: deepLink(pageUrl),
    availability: 'in stock',
    donationRate: DONATION_RATE,
  };
}

async function main() {
  const TARGET = Number(process.argv[2]) || 1000;
  mkdirSync(OUT_DIR, { recursive: true });
  const t0 = Date.now();
  console.log(
    `Mobeseavm scrape (apigw list+detail) — hedef ${TARGET} in-stock ürün (conc ${CONC})\n`,
  );

  // 1) Stokta olan adayları liste API'sinden topla.
  //    Detayda stok/görsel elemesi olabilir → hedefin ~1.8x fazlasını al.
  const wantCandidates = Math.ceil(TARGET * 1.8) + 50;
  const candidates = [];
  const seenId = new Set();
  let page = 0;
  let total = Infinity;

  while (candidates.length < wantCandidates && page * PAGE_SIZE < total) {
    const data = await getJson(
      `${API}/api/v1/products/list?page=${page}&size=${PAGE_SIZE}`,
    );
    if (!data || !Array.isArray(data.content) || data.content.length === 0) break;
    total = Number(data.totalElements) || total;
    for (const it of data.content) {
      if (listInStock(it) && !seenId.has(it.id)) {
        seenId.add(it.id);
        candidates.push(it);
      }
    }
    if (data.last === true) break;
    page++;
  }
  console.log(
    `▸ ${candidates.length} stokta aday (${page + 1} liste sayfası, katalog ${total})\n`,
  );

  // 2) Detayları eşzamanlı çek → kanonik ürün
  const out = [];
  const byExt = new Set();
  let i = 0;
  let processed = 0;

  async function worker() {
    while (i < candidates.length && out.length < TARGET) {
      const li = candidates[i++];
      processed++;
      const det = await getJson(`${API}/api/v1/products/${li.id}`);
      const prod = build(det, li);
      if (!prod) continue;
      if (byExt.has(prod.externalId)) continue;
      byExt.add(prod.externalId);
      out.push(prod);
      if (out.length % 100 === 0) {
        const line = `  ▸ toplandı ${out.length}/${TARGET} (işlenen detay ${processed})`;
        process.stdout.write('\r' + line + '   ');
        try {
          writeFileSync(OUT_FILE + '.progress', `${line}\n${new Date().toISOString()}\n`);
        } catch {}
      }
    }
  }

  await Promise.all(Array.from({ length: CONC }, worker));

  writeFileSync(OUT_FILE, JSON.stringify(out, null, 2));
  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(
    `\n\n✅ ${out.length} in-stock ürün yazıldı → scripts/out/ao-mobeseavm.json`,
  );
  console.log(`   süre: ${secs}s | işlenen detay ${processed}`);
  if (out[0]) {
    const s = out[0];
    console.log(`   örnek: ${s.title} — ₺${s.price}${s.salePrice ? ` (sale ₺${s.salePrice})` : ''}`);
    console.log(`   img:   ${s.imageLink}`);
    console.log(`   url:   ${s.productUrl}`);
  }
}

main().catch((e) => {
  console.error('HATA:', e.message);
  process.exit(1);
});
