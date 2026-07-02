/**
 * H&M (key: hm) ürün scraper — GelirOrtakları ağı (tr.rdrtr.com).
 *
 * www2.hm.com Akamai ile HARD-blocked (403). Ancak H&M'in mobil/PLP backend'i
 * api.hm.com/search-services/v1 KORUMASIZ ve temiz JSON döner.
 * Zorunlu paramlar: touchPoint, page>0, categoryId, pageId.
 *
 * Ürün objesi: { id (sku), productName, productImage (mutlak https), prices[],
 *                availability.stockState, url ("/tr_tr/productpage.<sku>.html"), colorName }
 *
 * Sadece in-stock (stockState=Available) + numerik fiyat. Ürün linki GelirOrtakları
 * deep-link'ine sarılır (bağış korunur). Max 1000 ürün.
 *
 * Usage: node scripts/brand-hm.mjs [limit]
 * Çıktı: scripts/out/go-hm.json
 */
import { writeFileSync, mkdirSync } from 'node:fs';

const NET = { track: 'tr.rdrtr.com', aff: '37081' };
const OFFER = '6834';
const RATE = 3;
const BRAND = 'H&M';
const SITE = 'https://www2.hm.com';
const API = 'https://api.hm.com/search-services/v1/tr_tr/listing/resultpage';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const PAGE_SIZE = 72;

// Kadın + Erkek + Çocuk ana kategorileri — geniş kapsam, tekilleştirme dedupe ile.
const CATS = [
  { categoryId: 'ladies_all', pageId: '/ladies' },
  { categoryId: 'men_all', pageId: '/men' },
  { categoryId: 'kids_all', pageId: '/kids' },
  { categoryId: 'baby_all', pageId: '/baby' },
  { categoryId: 'sport_all', pageId: '/sport' },
];

const clean = (s) => (s || '')
  .replace(/<[^>]*>/g, ' ')
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
  .replace(/\s+/g, ' ').trim();

async function getJson(url, timeout = 25000) {
  const r = await fetch(url, {
    headers: {
      'User-Agent': UA,
      'Accept': 'application/json',
      'Accept-Language': 'tr,en;q=0.8',
      'Referer': SITE + '/tr_tr/index.html',
    },
    redirect: 'follow',
    signal: AbortSignal.timeout(timeout),
  });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return r.json();
}

function pickPrice(prices) {
  if (!Array.isArray(prices) || !prices.length) return { price: null, sale: null };
  const white = prices.find((p) => p.priceType === 'whitePrice');
  const red = prices.find((p) => p.priceType === 'redPrice');
  // Regular = whitePrice; indirimli varsa red = güncel satış.
  const regular = white?.price ?? prices[0]?.price;
  if (red && red.price != null && white && white.price != null && red.price < white.price) {
    return { price: Number(white.price), sale: Number(red.price) };
  }
  const p = red?.price ?? regular;
  return { price: p != null ? Number(p) : null, sale: null };
}

async function fetchCategory(cat, remainingBudget) {
  const out = [];
  let page = 1;
  let totalPages = Infinity;
  while (out.length < remainingBudget && page <= totalPages && page <= 60) {
    const url = `${API}?pageSource=PLP&page=${page}&categoryId=${encodeURIComponent(cat.categoryId)}&pageId=${encodeURIComponent(cat.pageId)}&sort=RELEVANCE&pageSize=${PAGE_SIZE}&touchPoint=DESKTOP`;
    let data;
    try {
      data = await getJson(url);
    } catch (e) {
      // Bir sayfa patlarsa bir kez daha dene, sonra bırak.
      try { await new Promise((r) => setTimeout(r, 800)); data = await getJson(url); }
      catch { break; }
    }
    totalPages = data?.pagination?.totalPages ?? totalPages;
    const list = data?.plpList?.productList || [];
    if (!list.length) break;
    for (const p of list) {
      if (p.removed) continue;
      const stock = String(p.availability?.stockState || '').toLowerCase();
      if (stock !== 'available') continue; // sadece in-stock
      const { price, sale } = pickPrice(p.prices);
      if (!price || price <= 0) continue;
      const img = p.productImage || p.productImageInfo?.url || p.modelImage;
      if (!img || !/^https:\/\//.test(img)) continue;
      const path = p.url; // "/tr_tr/productpage.0963662139.html"
      if (!path) continue;
      out.push({
        externalId: String(p.id),
        title: clean(p.productName),
        description: clean([p.productName, p.colorName].filter(Boolean).join(' - ')) || undefined,
        price,
        salePrice: sale,
        image: img,
        pageUrl: path.startsWith('http') ? path : SITE + path,
      });
      if (out.length >= remainingBudget) break;
    }
    page++;
  }
  return out;
}

async function main() {
  const limit = Number(process.argv[2]) || 1000;
  const deep = (u) => `https://${NET.track}/aff_c?offer_id=${OFFER}&aff_id=${NET.aff}&url=${encodeURIComponent(u)}`;

  const seen = new Set();
  const docs = [];
  for (const cat of CATS) {
    if (docs.length >= limit) break;
    let items;
    try { items = await fetchCategory(cat, limit - docs.length); }
    catch { items = []; }
    for (const it of items) {
      if (docs.length >= limit) break;
      if (!it.externalId || seen.has(it.externalId)) continue;
      seen.add(it.externalId);
      docs.push({
        id: `gelirortaklari-${OFFER}-${it.externalId}`,
        source: 'gelirortaklari',
        feedId: OFFER,
        offerId: OFFER,
        brandId: null,
        brandName: BRAND,
        externalId: it.externalId,
        title: it.title,
        description: it.description,
        price: it.price,
        salePrice: it.salePrice,
        currency: 'TRY',
        imageLink: it.image,
        productUrl: deep(it.pageUrl),
        availability: 'in stock',
        donationRate: RATE,
      });
    }
    console.error(`  ${cat.categoryId}: toplam ${docs.length} ürün`);
  }

  mkdirSync('scripts/out', { recursive: true });
  writeFileSync('scripts/out/go-hm.json', JSON.stringify(docs, null, 2));
  console.log(`${BRAND}: ${docs.length} ürün → scripts/out/go-hm.json`);
}
main().catch((e) => { console.error('HATA:', e.message); process.exit(1); });
