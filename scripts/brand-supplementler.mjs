/**
 * Supplementler (supplementler.com) ürün scraper — DEDICATED (shared scripts'e dokunmaz).
 *
 * Neden generic FAIL etti: site custom platform (SoftMedia / mncdn CDN, Cloudflare önünde).
 *   - Sitemap /sitemapseo'da ürün URL'leri var ama generic sadece /sitemap.xml denedi (404).
 *   - Anasayfa/ürün sayfasında JSON-LD var ama generic'in Akinon/Next.js yolları tutmadı.
 *
 * Çalışan yöntem (bu script):
 *   1) https://www.supplementler.com/sitemapseo  → tüm /urun/<slug>-<id> ürün URL'leri (~1719)
 *   2) Her ürün sayfası düz HTTP fetch (browser/WAF gerekmez, HTTP 200) → JSON-LD "@type":"Product"
 *   3) name / offers[0].sku (gerçek SKU) / offers[0].price / image[0] / description / availability
 *   4) Sadece InStock + price>0. URL GelirOrtakları deep-link'e sarılır (bağış korunur).
 *
 * Usage: node scripts/brand-supplementler.mjs [limit]   (default 1000)
 * Output: scripts/out/go-supplementler.json
 */
import { writeFileSync } from 'node:fs';

const NET = { track: 'tr.rdrtr.com', aff: '37081' };
const OFFER = '5528';
const BRAND = 'Supplementler';
const DONATION_RATE = 3;
const ORIGIN = 'https://www.supplementler.com';
const SITEMAP = ORIGIN + '/sitemapseo';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36';

const clean = (s) =>
  (s || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const num = (v) => {
  if (v == null) return null;
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace(/[^\d.]/g, ''));
  return Number.isFinite(n) && n > 0 ? n : null;
};

async function get(url, { timeout = 20000, tries = 3 } = {}) {
  let lastErr;
  for (let t = 0; t < tries; t++) {
    try {
      const r = await fetch(url, {
        headers: { 'User-Agent': UA, 'Accept-Language': 'tr,en;q=0.8', Accept: 'text/html,application/xml' },
        redirect: 'follow',
        signal: AbortSignal.timeout(timeout),
      });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.text();
    } catch (e) {
      lastErr = e;
      await new Promise((res) => setTimeout(res, 400 * (t + 1)));
    }
  }
  throw lastErr;
}

async function pMap(arr, fn, conc = 12) {
  const out = new Array(arr.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: conc }, async () => {
      while (i < arr.length) {
        const idx = i++;
        try {
          out[idx] = await fn(arr[idx], idx);
        } catch {
          out[idx] = null;
        }
      }
    }),
  );
  return out;
}

// JSON-LD "@type":"Product" bloğunu bul ve alanları çıkar.
function extractProduct(html) {
  const re = /<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html))) {
    let j;
    try {
      j = JSON.parse(m[1].trim());
    } catch {
      continue;
    }
    const nodes = Array.isArray(j) ? j : j['@graph'] || [j];
    for (const n of nodes) {
      const t = n['@type'];
      const isProd = t === 'Product' || (Array.isArray(t) && t.includes('Product'));
      if (!isProd) continue;

      let off = n.offers;
      if (Array.isArray(off)) off = off[0];
      if (!off) continue;

      const price = num(off.price ?? off.lowPrice);
      const avail = String(off.availability || '').toLowerCase();
      const inStock = avail.includes('instock');
      if (!price || !inStock) return null; // in-stock + price>0 zorunlu

      // externalId: gerçek SKU tercih; yoksa productID (URL sonundaki id)
      const externalId = String(off.sku || n.sku || n.mpn || n.productID || n.gtin13 || '').trim();
      if (!externalId) return null;

      let img = Array.isArray(n.image) ? n.image[0] : n.image?.url || n.image;
      if (!img && Array.isArray(off.image)) img = off.image[0];
      if (img && img.startsWith('//')) img = 'https:' + img;
      if (img && img.startsWith('/')) img = ORIGIN + img;
      if (img && img.startsWith('http://')) img = 'https://' + img.slice(7);
      if (!img || !/^https:\/\//.test(img)) return null; // absolute https image zorunlu

      const title = clean(n.name);
      if (!title) return null;

      return { externalId, title, price, image: img, desc: clean(n.description) };
    }
  }
  return null;
}

const deep = (u) => `https://${NET.track}/aff_c?offer_id=${OFFER}&aff_id=${NET.aff}&url=${encodeURIComponent(u)}`;

async function main() {
  const t0 = Date.now();
  const limit = Number(process.argv[2]) || 1000;

  console.error('[1/3] sitemap fetch:', SITEMAP);
  const xml = await get(SITEMAP, { timeout: 30000 });
  const urls = [
    ...new Set(
      [...xml.matchAll(/<loc>\s*(https:\/\/www\.supplementler\.com\/urun\/[^<\s]+?)\s*<\/loc>/gi)].map((m) => m[1].trim()),
    ),
  ];
  console.error(`      ${urls.length} ürün URL bulundu.`);
  if (!urls.length) throw new Error('sitemap ürün URL yok');

  // limit'ten biraz fazla çek (bazıları out-of-stock / parse-fail elenecek)
  const budget = Math.min(urls.length, Math.ceil(limit * 1.6) + 40);
  const target = urls.slice(0, budget);

  console.error(`[2/3] ${target.length} ürün sayfası çekiliyor (conc=12)...`);
  let done = 0;
  const raw = await pMap(
    target,
    async (u) => {
      const html = await get(u);
      const p = extractProduct(html);
      if (++done % 100 === 0) console.error(`      ${done}/${target.length} işlendi...`);
      if (!p) return null;
      p.url = u;
      return p;
    },
    12,
  );

  const seen = new Set();
  const docs = [];
  for (const p of raw) {
    if (!p || seen.has(p.externalId)) continue;
    seen.add(p.externalId);
    docs.push({
      id: `gelirortaklari-${OFFER}-${p.externalId}`,
      source: 'gelirortaklari',
      feedId: OFFER,
      offerId: OFFER,
      brandId: null,
      brandName: BRAND,
      externalId: p.externalId,
      title: p.title,
      description: p.desc || '',
      price: p.price,
      salePrice: null,
      currency: 'TRY',
      imageLink: p.image,
      productUrl: deep(p.url),
      availability: 'in stock',
      donationRate: DONATION_RATE,
    });
    if (docs.length >= limit) break;
  }

  writeFileSync('scripts/out/go-supplementler.json', JSON.stringify(docs, null, 2));
  const dur = ((Date.now() - t0) / 1000).toFixed(1);
  console.error(`[3/3] DONE: ${docs.length} ürün → scripts/out/go-supplementler.json  (${dur}s)`);
  console.log(JSON.stringify({ brand: BRAND, count: docs.length, durationSec: Number(dur) }));
}

main().catch((e) => {
  console.error('HATA:', e.message);
  process.exit(1);
});
