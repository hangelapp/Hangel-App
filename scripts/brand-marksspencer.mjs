/**
 * Marks & Spencer (marksandspencer.com.tr) ürün scraper — hangel.org / ReklamAction offer_id 56329.
 *
 * NEDEN AYRI SCRIPT:
 *   Akinon platformu ama sitemap YOK: /sitemap.xml, /sitemaps/sitemap.xml ve tüm
 *   .gz varyantları HTML soft-404 döndürüyor; robots.txt boş. Kategori sayfaları
 *   client-render (ilk HTML'de ürün linki yok). Ürünler Akinon liste API'sinden
 *   gelir: /list/?category_ids=<id>&page=<n>  (Accept: application/json ZORUNLU,
 *   yoksa HTML döner). Yanıt: {pagination:{num_pages,total_count}, products:[...]}.
 *   Tek çağrıda 40 ürün; her ürün name/sku/price/in_stock/absolute_url/
 *   productimage_set (mutlak HTTPS a-cdn) içerir → ürün sayfası fetch'ine gerek yok.
 *   category_ids=2 ("Tüm Kadın") 1845 ürün barındırıyor → 1000 hedefi için yeter.
 *
 * Çıktı şeması: ReklamAction feed 56329; productUrl BAĞIŞ korumalı deep-link
 * (ad.reklm.com/aff_c). donationRate:2.
 *
 * Usage:  node scripts/brand-marksspencer.mjs [limit]        (default 1000)
 */
import { writeFileSync, mkdirSync } from 'node:fs';

const OFFER = '56329';
const AFF_ID = '35329';
const TRACK = 'ad.reklm.com';
const BRAND_NAME = 'Marks & Spencer';
const DONATION_RATE = 2;
const BASE = 'https://www.marksandspencer.com.tr';
// Ürün havuzu geniş kategoriler (kadın/erkek/çocuk/kozmetik/ev) — 1000+ benzersiz sku
const CATEGORY_IDS = [2, 101, 213, 84, 21];
const CONCURRENCY = 10;
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36';

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
    .replace(/;;;/g, '. ')
    .replace(/\s+/g, ' ')
    .trim();

const deepLink = (dest) =>
  `https://${TRACK}/aff_c?offer_id=${OFFER}&aff_id=${AFF_ID}&url=${encodeURIComponent(dest)}`;

async function getJson(url) {
  const r = await fetch(url, {
    headers: {
      'User-Agent': UA,
      'Accept-Language': 'tr,en;q=0.8',
      Accept: 'application/json', // ← ZORUNLU: yoksa Akinon HTML sayfa döner
      'X-Requested-With': 'XMLHttpRequest',
    },
    redirect: 'follow',
  });
  if (!r.ok) return null;
  const ct = r.headers.get('content-type') || '';
  if (!/json/i.test(ct)) return null;
  try {
    return await r.json();
  } catch {
    return null;
  }
}

function priceNum(raw) {
  if (typeof raw === 'number') return raw;
  const n = parseFloat(String(raw ?? '').replace(/[^\d.,]/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

function firstImage(p) {
  const set = Array.isArray(p.productimage_set) ? p.productimage_set : [];
  const active = set.find((i) => i && i.status === 'active' && i.image) || set.find((i) => i && i.image);
  const img = active?.image;
  if (!img) return null;
  if (/^https:\/\//i.test(img)) return img;
  if (img.startsWith('//')) return 'https:' + img;
  return null; // yalnızca mutlak HTTPS kabul et
}

function toRecord(p) {
  if (!p || !p.in_stock) return null;
  const externalId = String(p.sku || p.pk || '').trim();
  if (!externalId) return null;
  const title = clean(p.name);
  const price = priceNum(p.price ?? p.retail_price);
  const image = firstImage(p);
  if (!title || !price || !image) return null;
  const rel = p.absolute_url || '';
  if (!rel) return null;
  const dest = /^https?:\/\//i.test(rel) ? rel : BASE + (rel.startsWith('/') ? '' : '/') + rel;
  const desc = clean(
    p.attributes?.integration_description1 ||
      p.attributes?.description ||
      p.extra_data?.description ||
      '',
  );
  return {
    id: `reklamaction-${OFFER}-${externalId}`,
    source: 'reklamaction',
    feedId: OFFER,
    offerId: OFFER,
    brandId: null,
    brandName: BRAND_NAME,
    externalId,
    title,
    description: desc || title,
    price,
    salePrice: null,
    currency: (p.currency_type || 'TRY').toUpperCase(),
    imageLink: image,
    productUrl: deepLink(dest),
    availability: 'in stock',
    donationRate: DONATION_RATE,
  };
}

async function main() {
  const limit = Number(process.argv[2]) || 1000;
  mkdirSync('scripts/out', { recursive: true });
  console.log(`Marks & Spencer scrape — hedef ${limit} ürün\n`);

  const out = [];
  const seen = new Set();
  let miss = 0;
  let oos = 0;

  // 1) Her kategori için sayfa listesini kur, tek düz kuyruğa doldur
  const tasks = []; // {url}
  for (const cid of CATEGORY_IDS) {
    const first = await getJson(`${BASE}/list/?category_ids=${cid}&page=1`);
    if (!first) {
      console.log(`  ⚠ kategori ${cid}: liste API yanıtı alınamadı, atlanıyor`);
      continue;
    }
    const numPages = first.pagination?.num_pages || 1;
    const total = first.pagination?.total_count ?? '?';
    console.log(`  ▸ kategori ${cid}: ${total} ürün / ${numPages} sayfa`);
    // sayfa 1 zaten elimizde → hemen işle
    for (const p of first.products || []) {
      const rec = toRecord(p);
      if (!rec) {
        p && !p.in_stock ? oos++ : miss++;
        continue;
      }
      if (seen.has(rec.externalId)) continue;
      seen.add(rec.externalId);
      out.push(rec);
      if (out.length >= limit) break;
    }
    if (out.length >= limit) break;
    for (let pg = 2; pg <= numPages; pg++) {
      tasks.push(`${BASE}/list/?category_ids=${cid}&page=${pg}`);
    }
  }

  console.log(`  ▸ sayfa 1'lerden ${out.length} ürün; ${tasks.length} ek sayfa kuyrukta\n`);

  // 2) Kalan sayfaları eşzamanlı çek
  let ti = 0;
  async function worker() {
    while (ti < tasks.length && out.length < limit) {
      const url = tasks[ti++];
      const data = await getJson(url);
      if (!data || !Array.isArray(data.products)) {
        miss++;
        continue;
      }
      for (const p of data.products) {
        if (out.length >= limit) break;
        const rec = toRecord(p);
        if (!rec) {
          p && !p.in_stock ? oos++ : miss++;
          continue;
        }
        if (seen.has(rec.externalId)) continue;
        seen.add(rec.externalId);
        out.push(rec);
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  const final = out.slice(0, limit);
  writeFileSync(`scripts/out/ra-marksspencer.json`, JSON.stringify(final, null, 2));
  console.log(
    `\n✅ ${final.length} ürün yazıldı → scripts/out/ra-marksspencer.json (miss ${miss}, oos ${oos})`,
  );
  if (final[0]) {
    const p = final[0];
    console.log(`   örnek: ${p.title} — ₺${p.price} ${p.currency}`);
    console.log(`   img:   ${p.imageLink}`);
    console.log(`   url:   ${p.productUrl}`);
  }
}

main().catch((e) => {
  console.error('HATA:', e.message);
  process.exit(1);
});
