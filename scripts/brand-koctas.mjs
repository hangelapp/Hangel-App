/**
 * Koçtaş (koctas) ürün scraper — ReklamAction ağı, offer_id 8937, aff_id 35329.
 *
 * Site www.koctas.com.tr Akamai bot-duvarı arkasında (403). ANCAK duvar sadece
 * header-fingerprint kontrolü yapıyor; asıl ürün datası SAP Hybris storefront'un
 * kullandığı PUBLIC Algolia search index'inden gelir. Anasayfa HTML'inde açıkta
 * duran arama anahtarlarıyla (appId/apiKey/index) doğrudan Algolia'ya vuruyoruz —
 * site HTML'i hiç parse etmeye gerek yok.
 *
 *   Algolia appId : YFOCSUJDTK
 *   search apiKey : 231bf5ad06582a314a0ffddebea00d01  (public search-only key)
 *   index         : koctasProductIndex   (~950k kayıt, ~417k in-stock web-satılabilir)
 *
 * Fiyat: priceWithDiscountValue = müşterinin ödediği güncel fiyat (indirim varsa
 * indirimli). priceValue = liste fiyatı. price alanına güncel satış fiyatını yazıp
 * salePrice=null tutuyoruz (feed şeması gereği).
 *
 * Usage: node scripts/brand-koctas.mjs [limit]   (default 1000)
 * Output: scripts/out/ra-koctas.json
 */
import { writeFileSync, mkdirSync } from 'node:fs';

const NET = { track: 'ad.reklm.com', aff: '35329' };
const OFFER = '8937';
const RATE = 2.2;
const BRAND = 'Koçtaş';
const ORIGIN = 'https://www.koctas.com.tr';

const ALGOLIA_APP = 'YFOCSUJDTK';
const ALGOLIA_KEY = '231bf5ad06582a314a0ffddebea00d01';
const ALGOLIA_INDEX = 'koctasProductIndex';

const clean = (s) =>
  (s || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

const num = (v) => {
  if (v == null) return null;
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : null;
};

const deep = (u) =>
  `https://${NET.track}/aff_c?offer_id=${OFFER}&aff_id=${NET.aff}&url=${encodeURIComponent(u)}`;

async function algoliaPage(page, hitsPerPage) {
  const url = `https://${ALGOLIA_APP}-dsn.algolia.net/1/indexes/${ALGOLIA_INDEX}/query`;
  const r = await fetch(url, {
    method: 'POST',
    headers: {
      'X-Algolia-Application-Id': ALGOLIA_APP,
      'X-Algolia-API-Key': ALGOLIA_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: '',
      hitsPerPage,
      page,
      // Sadece stokta + webden satılabilir + sonuçlarda gizli olmayan
      filters: 'inStockFlag:true AND salableFromWeb:true AND hiddenFromResults:false',
      attributesToRetrieve: [
        'code', 'name', 'brandName', 'url', 'description',
        'priceValue', 'priceWithDiscountValue',
        'inStockFlag', 'stockLevelStatus', 'salableFromWeb', 'galleryImages',
      ],
      attributesToHighlight: [],
    }),
    signal: AbortSignal.timeout(20000),
  });
  if (!r.ok) throw new Error('Algolia HTTP ' + r.status);
  return r.json();
}

function toDoc(h) {
  const sku = String(h.code || '').trim();
  if (!sku) return null;
  // Güncel satış fiyatı (indirimliyse indirimli), yoksa liste fiyatı.
  const price = num(h.priceWithDiscountValue) ?? num(h.priceValue);
  if (!price) return null;
  const title = clean(h.name);
  if (!title) return null;

  let img = (h.galleryImages || []).find((x) => typeof x === 'string' && x.startsWith('http'));
  if (!img) return null; // görselsiz ürünü atla

  let url = h.url || '';
  if (!url) return null;
  if (url.startsWith('/')) url = ORIGIN + url;
  else if (!url.startsWith('http')) url = ORIGIN + '/' + url;

  return {
    id: `reklamaction-${OFFER}-${sku}`,
    source: 'reklamaction',
    feedId: OFFER,
    offerId: OFFER,
    brandId: null,
    brandName: BRAND,
    externalId: sku,
    title,
    description: clean(h.description) || title,
    price,
    salePrice: null,
    currency: 'TRY',
    imageLink: img,
    productUrl: deep(url),
    availability: 'in stock',
    donationRate: RATE,
  };
}

async function main() {
  const limit = Number(process.argv[2]) || 1000;
  const hitsPerPage = 100;
  const maxPage = Math.ceil(limit / hitsPerPage) - 1; // 0-indexed

  const out = [];
  const seen = new Set();
  let nbHits = 0;

  for (let page = 0; page <= maxPage && out.length < limit; page++) {
    let j;
    try {
      j = await algoliaPage(page, hitsPerPage);
    } catch (e) {
      console.error(`page ${page} hata:`, e.message);
      break;
    }
    if (page === 0) nbHits = j.nbHits;
    const hits = j.hits || [];
    if (!hits.length) break;
    for (const h of hits) {
      if (out.length >= limit) break;
      const d = toDoc(h);
      if (!d || seen.has(d.externalId)) continue;
      seen.add(d.externalId);
      out.push(d);
    }
  }

  mkdirSync('scripts/out', { recursive: true });
  writeFileSync('scripts/out/ra-koctas.json', JSON.stringify(out, null, 2));
  console.log(
    `${BRAND}: ${out.length} ürün (algolia:${ALGOLIA_INDEX}) → ra-koctas.json ` +
    `| in-stock katalog≈${nbHits.toLocaleString('tr-TR')}`
  );
}

main().catch((e) => { console.error('HATA:', e.message); process.exit(1); });
