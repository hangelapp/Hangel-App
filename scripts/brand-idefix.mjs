/**
 * İdefix (Affocean offer_id 2846) ürün toplayıcı — "tabana kuvvet".
 *
 * Affocean SKU feed'i vermediği için idefix'in kendi sitemap'inden ürün URL'leri
 * toplanır, her ürün sayfası Chrome UA ile çekilir ve __NEXT_DATA__ içindeki
 * product objesinden (fallback: JSON-LD / regex) başlık/fiyat/görsel/barkod
 * çıkarılır. Her link Affocean deep-link tracking'ine sarılır → BAĞIŞ korunur.
 *
 * Çıktı: scripts/out/affocean-idefix.json  (CanonicalProduct şeması ile uyumlu)
 *
 * Kullanım:
 *   node scripts/brand-idefix.mjs           # hedef 200
 *   node scripts/brand-idefix.mjs 300       # hedef 300
 */
import { writeFileSync, mkdirSync } from 'node:fs';

const OFFER = '2846';
const AFF_ID = '7873';
const TRACK = 'ad.afftrck.com';
const BRAND = 'İdefix';
const BASE = 'https://www.idefix.com';
const TARGET = Number(process.argv[2] || 200);

// Chrome masaüstü UA (idefix bunu daha rahat servisliyor)
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const clean = (s) =>
  (s || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const deepLink = (dest) =>
  `https://${TRACK}/aff_c?offer_id=${OFFER}&aff_id=${AFF_ID}&url=${encodeURIComponent(dest)}`;

// {size} placeholder'ını gerçek boyutla değiştir → mutlak, yüklenebilir görsel
const absImage = (src) => {
  if (!src) return null;
  let u = src.replace('/resize/{size}', '/resize/400/400/');
  if (u.startsWith('//')) u = 'https:' + u;
  if (u.startsWith('/')) u = BASE + u;
  return u.startsWith('http') ? u : null;
};

async function get(url) {
  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': UA, 'Accept-Language': 'tr,en;q=0.8', Accept: '*/*' },
      redirect: 'follow',
    });
    return { status: r.status, ok: r.ok, body: await r.text() };
  } catch (e) {
    return { status: 0, ok: false, body: '' };
  }
}

const locs = (xml) =>
  [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map((m) => m[1].trim());

// __NEXT_DATA__ içinde barcode+title+slug taşıyan product objesini bul
function findProduct(json) {
  let found = null;
  const walk = (o, d) => {
    if (found || d > 12 || !o || typeof o !== 'object') return;
    if (!Array.isArray(o) && 'barcode' in o && 'title' in o && 'currentPrice' in o) {
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
  // externalId: URL sonundaki -p-<id>
  const idm = url.match(/-p-(\d+)/);
  const urlId = idm ? idm[1] : null;

  // 1) __NEXT_DATA__ (en zengin)
  const nd = html.match(
    /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/,
  );
  if (nd) {
    try {
      const j = JSON.parse(nd[1]);
      const p = findProduct(j);
      if (p) {
        const cp = p.currentPrice || {};
        const price = cp.effectivePrice ?? cp.price ?? null;
        const listPrice = cp.price ?? null;
        const inv = cp.inventoryQuantity;
        const inStock = inv === undefined ? price != null : inv > 0;
        const img = absImage(p.images && p.images[0] && p.images[0].src);
        const title = clean(p.title);
        const externalId = clean(p.barcode) || urlId || p.id;
        if (title && price != null && Number(price) > 0 && img && inStock) {
          const salePrice =
            listPrice != null && Number(listPrice) > Number(price)
              ? Number(price)
              : null;
          const basePrice = salePrice != null ? Number(listPrice) : Number(price);
          const desc =
            clean(p.description || p.subDescription).slice(0, 500) ||
            `${title} — idefix'te indirimli fiyata.`;
          return {
            externalId: String(externalId),
            title,
            description: desc,
            price: basePrice,
            salePrice,
            imageLink: img,
          };
        }
      }
    } catch {
      /* fall through */
    }
  }

  // 2) JSON-LD Product / Book fallback
  const ldRe = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g;
  let m;
  while ((m = ldRe.exec(html))) {
    try {
      const j = JSON.parse(m[1]);
      const arr = Array.isArray(j) ? j : [j];
      for (const o of arr) {
        if (o && (o['@type'] === 'Product' || o['@type'] === 'Book')) {
          const off = o.offers || {};
          const price = Number(off.price);
          const avail = String(off.availability || '');
          if (
            o.name &&
            price > 0 &&
            !avail.includes('OutOfStock') &&
            o.image
          ) {
            const img = absImage(Array.isArray(o.image) ? o.image[0] : o.image);
            if (img) {
              return {
                externalId: String(o.sku || o.isbn || urlId),
                title: clean(o.name),
                description:
                  clean(o.description).slice(0, 500) ||
                  `${clean(o.name)} — idefix.`,
                price,
                salePrice: null,
                imageLink: img,
              };
            }
          }
        }
      }
    } catch {
      /* ignore */
    }
  }
  return null;
}

async function main() {
  console.log(`[idefix] hedef ${TARGET} ürün`);

  // Sitemap index → en yeni chunk'lar (yüksek stok oranı)
  const idx = await get(`${BASE}/sitemaps/products.xml`);
  const chunks = locs(idx.body).filter((u) => /product_\d+\.xml/.test(u));
  chunks.sort((a, b) => {
    const na = Number((a.match(/product_(\d+)/) || [])[1] || 0);
    const nb = Number((b.match(/product_(\d+)/) || [])[1] || 0);
    return nb - na; // en yeni önce
  });
  console.log(`[idefix] ${chunks.length} product sitemap chunk bulundu, en yenilerden taranıyor`);

  // Aday ürün URL'lerini topla (fazladan, çünkü bir kısmı stokta olmayacak)
  const candidates = [];
  const seen = new Set();
  for (const ch of chunks) {
    if (candidates.length > TARGET * 6) break;
    const r = await get(ch);
    for (const u of locs(r.body)) {
      if (/-p-\d+$/.test(u) && !seen.has(u)) {
        seen.add(u);
        candidates.push(u);
      }
    }
    console.log(`[idefix] ${ch.split('/').pop()} → aday toplam ${candidates.length}`);
  }

  // Ürün sayfalarını sınırlı eşzamanlılıkla çek
  const out = [];
  const byExt = new Set();
  const CONC = 8;
  let i = 0;
  let processed = 0;

  async function worker() {
    while (i < candidates.length && out.length < TARGET) {
      const url = candidates[i++];
      processed++;
      const r = await get(url);
      if (!r.ok) continue;
      const e = extract(url, r.body);
      if (!e) continue;
      if (byExt.has(e.externalId)) continue;
      byExt.add(e.externalId);
      out.push({
        id: `affocean-${OFFER}-${e.externalId}`,
        source: 'affocean',
        feedId: OFFER,
        offerId: OFFER,
        brandId: null,
        brandName: BRAND,
        externalId: e.externalId,
        title: e.title,
        description: e.description,
        price: e.price,
        salePrice: e.salePrice,
        currency: 'TRY',
        imageLink: e.imageLink,
        productUrl: deepLink(url),
        availability: 'in stock',
        updatedAt: 0,
      });
      if (out.length % 20 === 0) {
        console.log(`[idefix] ${out.length}/${TARGET} (işlenen ${processed})`);
      }
    }
  }

  await Promise.all(Array.from({ length: CONC }, worker));

  mkdirSync('scripts/out', { recursive: true });
  writeFileSync('scripts/out/affocean-idefix.json', JSON.stringify(out, null, 2));
  console.log(
    `[idefix] BİTTİ → ${out.length} ürün yazıldı (${processed} sayfa tarandı) → scripts/out/affocean-idefix.json`,
  );
}

main().catch((e) => {
  console.error('[idefix] HATA', e);
  process.exit(1);
});
