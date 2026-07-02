/**
 * Affocean onaylı markalarının ürünlerini "tabana kuvvet" çeker.
 * Affocean SKU feed'i vermediği için markanın kendi sitesinden sitemap + yapısal
 * veri (JSON-LD / __NEXT_DATA__ / __NUXT__ / OpenGraph) ile ürün toplar ve HER
 * ürün linkini Affocean deep-link tracking'ine sarar → tıklama izlenir, BAĞIŞ korunur.
 *
 * Kanonik şema src/lib/feed/types.ts CanonicalProduct ile uyumludur → aynı
 * `products` koleksiyonuna ingest edilebilir.
 *
 * Usage:
 *   node scripts/scrape-affocean-products.mjs                # tüm markalar, marka başı 40 ürün
 *   node scripts/scrape-affocean-products.mjs ipekyol 8      # tek marka, 8 ürün (test)
 *   LIMIT=100 node scripts/scrape-affocean-products.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs';

const AFF_ID = '7873';
const TRACK = 'ad.afftrck.com';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36';

// Onaylı 14 marka: key, görünen ad, Affocean offer_id, site kökü, ürün-URL kalıbı
const BRANDS = [
  { key: 'ebebek',     name: 'Ebebek',     offer: '2783', base: 'https://www.e-bebek.com',      productRe: /-p-\d+|\/p\// },
  { key: 'converse',   name: 'Converse',   offer: '2829', base: 'https://www.converse.com.tr',  productRe: /\/p\/|-p-|\/product/ },
  { key: 'samsonite',  name: 'Samsonite',  offer: '2804', base: 'https://www.samsonite.com.tr', productRe: /\/p\/|-p-|\.html/ },
  { key: 'ipekyol',    name: 'İpekyol',    offer: '2865', base: 'https://www.ipekyol.com.tr',   productRe: /\/urun\//, imageBase: 'https://ipekyol.sm.mncdn.com/mnresize/640/-' },
  { key: 'twist',      name: 'Twist',      offer: '2866', base: 'https://www.twist.com.tr',     productRe: /\/urun\//, imageBase: 'https://cdn.twist.com.tr/mnresize/640/-' },
  { key: 'machka',     name: 'Machka',     offer: '2867', base: 'https://www.machka.com.tr',    productRe: /\/urun\//, imageBase: 'https://cdn.machka.com.tr/mnresize/640/-' },
  { key: 'desa',       name: 'Desa',       offer: '2892', base: 'https://www.desa.com.tr',      productRe: /\/urun\/|-p-|\/p\// },
  { key: 'dsdamat',    name: 'DS Damat',   offer: '2861', base: 'https://www.dsdamat.com',      productRe: /-p-|\/p\/|\/urun\// },
  { key: 'hemington',  name: 'Hemington',  offer: '2845', base: 'https://www.hemington.com.tr', productRe: /-p-|\/p\/|\/urun\// },
  { key: 'markastok',  name: 'MarkaStok',  offer: '2745', base: 'https://www.markastok.com',    productRe: /-p-|\/p\/|\/urun\// },
  { key: 'idefix',     name: 'İdefix',     offer: '2846', base: 'https://www.idefix.com',       productRe: /\/(kitap|urun|product)\// },
  { key: 'doremusic',  name: 'Doremusic',  offer: '2794', base: 'https://www.do-re.com.tr',     productRe: /-p-|\/p\/|\/urun\// },
];

const clean = (s) => (s || '').replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
const deepLink = (offer, dest) => `https://${TRACK}/aff_c?offer_id=${offer}&aff_id=${AFF_ID}&url=${encodeURIComponent(dest)}`;

async function get(url, asText = true) {
  const r = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'tr,en;q=0.8' }, redirect: 'follow' });
  return { status: r.status, ok: r.ok, body: asText ? await r.text() : null, url: r.url };
}

const locs = (xml) => [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map((m) => m[1].trim());

async function discoverProductUrls(brand, limit) {
  const candidates = [`${brand.base}/sitemap.xml`, `${brand.base}/robots.txt`];
  const urls = new Set();
  // robots.txt → Sitemap:
  try {
    const rob = await get(`${brand.base}/robots.txt`);
    for (const m of rob.body.matchAll(/Sitemap:\s*(\S+)/gi)) candidates.push(m[1]);
  } catch {}
  const queue = [...new Set(candidates.filter((u) => u.endsWith('.xml')))];
  if (!queue.length) queue.push(`${brand.base}/sitemap.xml`);
  const seen = new Set();
  while (queue.length && urls.size < limit * 4) {
    const sm = queue.shift();
    if (seen.has(sm)) continue;
    seen.add(sm);
    let res;
    try { res = await get(sm); } catch { continue; }
    if (!res.ok) continue;
    for (const loc of locs(res.body)) {
      if (loc.endsWith('.xml')) {
        // ürün sitemapi öncelikli kuyruğa
        if (/product|urun|catalog/i.test(loc)) queue.unshift(loc); else queue.push(loc);
      } else if (brand.productRe.test(loc)) {
        urls.add(loc);
      }
    }
  }
  return [...urls].slice(0, limit);
}

// ── Çıkarım stratejileri ──────────────────────────────────────────────────────
function fromJsonLd(html) {
  for (const m of html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const j = JSON.parse(m[1].trim());
      const nodes = Array.isArray(j) ? j : (j['@graph'] || [j]);
      for (const n of nodes) {
        const t = n['@type'];
        if (t === 'Product' || (Array.isArray(t) && t.includes('Product'))) {
          const off = Array.isArray(n.offers) ? n.offers[0] : n.offers;
          return {
            title: clean(n.name),
            price: parseFloat(off?.price || off?.lowPrice) || null,
            currency: off?.priceCurrency || 'TRY',
            image: Array.isArray(n.image) ? n.image[0] : n.image,
            sku: n.sku || n.mpn || n.gtin13 || null,
            availability: /InStock/i.test(off?.availability || '') ? 'in stock' : undefined,
            desc: clean(n.description),
          };
        }
      }
    } catch {}
  }
  return null;
}

function deepFindProduct(obj, depth = 0) {
  if (!obj || typeof obj !== 'object' || depth > 9) return null;
  const name = obj.name || obj.title || obj.productName || obj.displayName;
  const price = obj.salesPrice ?? obj.discountPrice ?? obj.discountedPrice ?? obj.salePrice ?? obj.price ?? obj.finalPrice;
  if (name && price != null && (typeof price === 'number' || /^[\d.,]+$/.test(String(price)))) return obj;
  for (const k of Object.keys(obj)) {
    const r = deepFindProduct(obj[k], depth + 1);
    if (r) return r;
  }
  return null;
}

function fromNextData(html) {
  const m = html.match(/<script[^>]*id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i);
  if (!m) return null;
  let data; try { data = JSON.parse(m[1]); } catch { return null; }
  const p = deepFindProduct(data.props || data, 0);
  if (!p) return null;
  const price = p.salesPrice ?? p.discountPrice ?? p.discountedPrice ?? p.salePrice ?? p.price ?? p.finalPrice;
  let image;
  const docs = p.documents || p.images || p.imageList || p.media || p.pictures;
  if (Array.isArray(docs) && docs.length) {
    const d = docs[0];
    image = d.filePath || d.url || d.path || d.image || (typeof d === 'string' ? d : undefined);
  } else if (typeof p.image === 'string') image = p.image;
  return {
    title: clean([p.shortName, p.name || p.title].filter(Boolean).join(' ')) || clean(p.name),
    price: typeof price === 'number' ? price : parseFloat(String(price).replace(/\./g, '').replace(',', '.')) || null,
    currency: 'TRY',
    image,
    sku: p.sku || p.code || p.barcode || String(p.id || '') || null,
    desc: clean(p.routeDescription || p.description),
  };
}

function fromMeta(html) {
  const meta = (n) => {
    const m = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${n}["'][^>]+content=["']([^"']+)`, 'i'))
      || html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${n}["']`, 'i'));
    return m ? m[1] : null;
  };
  const title = meta('og:title') || (html.match(/<title>([^<]+)/i)?.[1]);
  const image = meta('og:image');
  const priceRaw = meta('product:price:amount') || meta('og:price:amount');
  let price = priceRaw ? parseFloat(priceRaw) : null;
  if (!price) {
    const pm = html.match(/(\d[\d.]*[.,]\d{2})\s*(?:TL|₺|TRY)/i);
    if (pm) price = parseFloat(pm[1].replace(/\./g, '').replace(',', '.'));
  }
  if (!title) return null;
  return { title: clean(title), price, currency: 'TRY', image, sku: null, desc: clean(meta('og:description')) };
}

function extract(html) {
  return fromJsonLd(html) || fromNextData(html) || fromMeta(html);
}

async function scrapeBrand(brand, limit) {
  const productUrls = await discoverProductUrls(brand, limit);
  const out = [];
  let miss = 0;
  for (const url of productUrls) {
    let page;
    try { page = await get(url); } catch { miss++; continue; }
    if (!page.ok) { miss++; continue; }
    const e = extract(page.body);
    if (!e || !e.title || !e.price) { miss++; continue; }
    // Göreli görsel yolunu marka CDN'iyle mutlak yap (İpekyol/Twist __NEXT_DATA__ filePath göreli döner)
    if (e.image && e.image.startsWith('/') && brand.imageBase) e.image = brand.imageBase + e.image;
    const externalId = String(e.sku || url.split('/').pop() || out.length);
    out.push({
      id: `affocean-${brand.offer}-${externalId}`,
      source: 'affocean',
      feedId: brand.offer,
      offerId: brand.offer,
      brandId: null,
      brandName: brand.name,
      externalId,
      title: e.title,
      description: e.desc || undefined,
      price: e.price,
      salePrice: null,
      currency: e.currency || 'TRY',
      imageLink: e.image || undefined,
      productUrl: deepLink(brand.offer, url),   // ← BAĞIŞ korumalı deep-link
      availability: e.availability || 'in stock',
      donationRate: undefined,                  // ingest sırasında offer payout'undan set edilir
      updatedAt: 0,
    });
  }
  return { brand: brand.name, key: brand.key, found: productUrls.length, scraped: out.length, miss, products: out };
}

async function main() {
  const argKey = process.argv[2];
  const limit = Number(process.argv[3]) || Number(process.env.LIMIT) || 40;
  const targets = argKey ? BRANDS.filter((b) => b.key === argKey) : BRANDS;
  mkdirSync('scripts/out', { recursive: true });

  console.log(`Affocean ürün scrape — marka başı ${limit} ürün, ${targets.length} marka\n`);
  const summary = [];
  for (const b of targets) {
    process.stdout.write(`▸ ${b.name.padEnd(12)} ... `);
    try {
      const r = await scrapeBrand(b, limit);
      writeFileSync(`scripts/out/affocean-${b.key}.json`, JSON.stringify(r.products, null, 2));
      console.log(`${r.scraped}/${r.found} ürün ✅ (miss ${r.miss})`);
      if (r.products[0]) {
        const p = r.products[0];
        console.log(`     örnek: ${p.title.slice(0, 45)} — ₺${p.price} | img:${p.imageLink ? 'var' : 'YOK'}`);
      }
      summary.push({ brand: r.brand, scraped: r.scraped, found: r.found });
    } catch (e) {
      console.log(`HATA: ${e.message}`);
      summary.push({ brand: b.name, scraped: 0, error: e.message });
    }
  }
  console.log('\n── ÖZET ──');
  let total = 0;
  for (const s of summary) { total += s.scraped || 0; console.log(`  ${s.brand.padEnd(12)} ${s.scraped || 0} ürün ${s.error ? '(' + s.error + ')' : ''}`); }
  console.log(`\n  TOPLAM: ${total} ürün → scripts/out/affocean-*.json`);
}

main().catch((e) => { console.error(e); process.exit(1); });
