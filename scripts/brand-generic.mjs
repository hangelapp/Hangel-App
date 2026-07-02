/**
 * Generic çok-platform ürün scraper — orta/kolay markaları AJAN'SIZ (kotasız) çeker.
 * Strateji sırası (ilk tutan kazanır):
 *   1) Akinon storefront JSON API  ({origin}/list/?format=json&page=N)  — en hızlı
 *   2) Sitemap → ürün URL → JSON-LD Product/ProductGroup  (Ticimax/ikas/genel)
 *   3) Sitemap → ürün URL → __NEXT_DATA__ derin arama  (Next.js)
 * Her ürün linki ağın deep-link'ine sarılır (bağış korunur). Sadece in-stock + price>0.
 *
 * Config: scripts/orta-brands.json  → [{key,name,net,offer,domain,rate}]
 * Usage: node scripts/brand-generic.mjs <key> [limit]
 */
import { readFileSync, writeFileSync } from 'node:fs';

const NETS = {
  reklamaction: { track: 'ad.reklm.com', aff: '35329' },
  affocean:     { track: 'ad.afftrck.com', aff: '7873' },
  gelirortaklari:{ track: 'tr.rdrtr.com', aff: '37081' },
};
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36';
const clean = (s) => (s || '').replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
const num = (v) => { if (v == null) return null; const n = typeof v === 'number' ? v : parseFloat(String(v).replace(/[^\d.,]/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.')); return Number.isFinite(n) && n > 0 ? n : null; };

async function get(url, { json = false, timeout = 15000 } = {}) {
  const r = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'tr,en;q=0.8', Accept: json ? 'application/json' : 'text/html' }, redirect: 'follow', signal: AbortSignal.timeout(timeout) });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return json ? r.json() : r.text();
}
async function pMap(arr, fn, conc = 10) { const out = []; let i = 0; await Promise.all(Array.from({ length: conc }, async () => { while (i < arr.length) { const idx = i++; try { out[idx] = await fn(arr[idx], idx); } catch { out[idx] = null; } } })); return out; }

const locs = (xml) => [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map((m) => m[1].trim());

// ── Strateji 1: Akinon storefront JSON API (oto-keşifli) ─────────────────────
async function tryAkinonApi(origin, limit) {
  // Anasayfadan api.akinoncloud.com tabanını + kategori slug'larını keşfet
  let apiBases = [];
  let catSlugs = ['tum-urunler', 'tum-urunler-1', 'products', 'urunler', 'kadin', 'erkek'];
  try {
    const html = await get(origin + '/');
    for (const m of html.matchAll(/https?:\/\/[\w.-]+\.api\.akinoncloud\.com/gi)) apiBases.push(m[0]);
    for (const m of html.matchAll(/href="\/([a-z0-9-]{3,45})\/?"/gi)) {
      const s = m[1];
      if (!/^(hakkinda|iletisim|blog|sepet|hesap|giris|uye|kayit|kampanya|kurumsal|yardim|sss|gizlilik|kvkk|magaza|favori|siparis|indirim|yeni|tum)/.test(s)) catSlugs.push(s);
    }
    apiBases = [...new Set(apiBases)];
    catSlugs = [...new Set(catSlugs)].slice(0, 14);
  } catch {}
  const endpoints = [];
  for (const b of apiBases) for (const c of catSlugs) endpoints.push(`${b}/${c}/?limit=50`);
  for (const p of ['/list/?format=json', '/tum-urunler/?format=json', '/products/?format=json']) endpoints.push(origin + p);

  for (const ep of endpoints) {
    try {
      const sep = ep.includes('?') ? '&' : '?';
      const first = await get(`${ep}${sep}page=1`, { json: true, timeout: 12000 });
      const arr = first?.results || first?.products || first?.product_list || (Array.isArray(first) ? first : null);
      if (!arr || !arr.length) continue;
      const total = first?.total_count || first?.count;
      const pages = first?.num_pages || first?.total_pages || (total ? Math.ceil(total / arr.length) : 1);
      const out = [];
      const pushAll = (list) => { for (const p of list) {
        const img = p.productimage_set?.[0]?.image || p.image?.url || p.image || p.images?.[0]?.url || p.images?.[0] || (Array.isArray(p.productimages) ? p.productimages[0]?.image : null);
        const price = num(p.price ?? p.retail_price ?? p.sale_price ?? p.formatted_price);
        const inStock = (p.in_stock ?? (p.stock > 0) ?? p.is_active ?? true);
        const au = p.absolute_url || p.url || p.slug;
        if (!p.name || !price || !inStock || !au) continue;
        out.push({ externalId: String(p.sku || p.base_code || p.pk || p.id), title: clean(p.name), price, image: img, url: au.startsWith('http') ? au : origin + (au.startsWith('/') ? au : '/' + au), desc: clean(p.description) });
      } };
      pushAll(arr);
      for (let pg = 2; pg <= Math.min(pages, Math.ceil(limit / arr.length) + 2) && out.length < limit; pg++) {
        try { const j = await get(`${ep}${sep}page=${pg}`, { json: true, timeout: 12000 }); pushAll(j?.results || j?.products || j || []); } catch { break; }
      }
      if (out.length >= 10) return { method: 'akinon-api', products: out.slice(0, limit) };
    } catch {}
  }
  return null;
}

// ── JSON-LD Product / ProductGroup çıkarımı ──────────────────────────────────
function extractJsonLd(html, origin) {
  for (const m of html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    let j; try { j = JSON.parse(m[1].trim()); } catch { continue; }
    const nodes = Array.isArray(j) ? j : (j['@graph'] || [j]);
    for (const n of nodes) {
      const t = n['@type'];
      const isProd = t === 'Product' || t === 'ProductGroup' || (Array.isArray(t) && (t.includes('Product') || t.includes('ProductGroup')));
      if (!isProd) continue;
      let off = n.offers; if (Array.isArray(off)) off = off[0];
      if (!off && Array.isArray(n.hasVariant)) off = n.hasVariant[0]?.offers;
      const price = num(off?.price ?? off?.lowPrice);
      const avail = String(off?.availability || '').toLowerCase();
      const inStock = !avail || avail.includes('instock');
      let img = Array.isArray(n.image) ? n.image[0] : (n.image?.url || n.image);
      if (img && img.startsWith('//')) img = 'https:' + img;
      if (img && img.startsWith('/')) img = origin + img;
      if (n.name && price && inStock) return { externalId: String(n.sku || n.mpn || n.gtin13 || ''), title: clean(n.name), price, image: img, desc: clean(n.description) };
    }
  }
  return null;
}
function deepProduct(o, d = 0) {
  if (!o || typeof o !== 'object' || d > 9) return null;
  const name = o.name || o.title || o.productName || o.displayName;
  const price = o.salesPrice ?? o.discountPrice ?? o.discountedPrice ?? o.salePrice ?? o.price ?? o.finalPrice ?? o.newPrice;
  if (name && (typeof price === 'number' || (price && /^[\d.,]+$/.test(String(price))))) return o;
  for (const k of Object.keys(o)) { const r = deepProduct(o[k], d + 1); if (r) return r; }
  return null;
}
function extractNext(html, origin) {
  const m = html.match(/<script[^>]*id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i);
  if (!m) return null;
  let data; try { data = JSON.parse(m[1]); } catch { return null; }
  const p = deepProduct(data.props || data);
  if (!p) return null;
  const price = num(p.salesPrice ?? p.discountPrice ?? p.discountedPrice ?? p.salePrice ?? p.price ?? p.newPrice ?? p.finalPrice);
  let img; const docs = p.documents || p.images || p.imageList || p.media || p.pictures || p.productimage_set;
  if (Array.isArray(docs) && docs.length) img = docs[0].filePath || docs[0].url || docs[0].image || docs[0].src || (typeof docs[0] === 'string' ? docs[0] : null);
  else if (typeof p.image === 'string') img = p.image;
  if (img && img.startsWith('/')) img = origin + img;
  if (!price) return null;
  return { externalId: String(p.sku || p.id || p.code || p.barcode || ''), title: clean([p.shortName, p.name || p.title].filter(Boolean).join(' ')) || clean(p.name), price, image: img, desc: clean(p.description) };
}

// ── Strateji 2/3: Sitemap → ürün sayfaları ───────────────────────────────────
async function discover(origin, limit) {
  const queue = []; const seen = new Set(); const urls = new Set();
  try { const rob = await get(origin + '/robots.txt'); for (const mm of rob.matchAll(/Sitemap:\s*(\S+)/gi)) queue.push(mm[1]); } catch {}
  ['/sitemap.xml', '/sitemap_index.xml', '/sitemaps/sitemap.xml'].forEach((p) => queue.push(origin + p));
  while (queue.length && urls.size < limit * 5) {
    const sm = queue.shift(); if (!sm || seen.has(sm)) continue; seen.add(sm);
    let xml; try { xml = await get(sm); } catch { continue; }
    for (const loc of locs(xml)) {
      if (/\.xml(\.gz)?($|\?)/i.test(loc)) { if (/product|urun|catalog/i.test(loc)) queue.unshift(loc); else queue.push(loc); }
      else if (!/(blog|kategori|category|hakkinda|iletisim|sayfa|page|magaza|kampanya|\.(jpg|png|pdf))/i.test(loc)) urls.add(loc);
    }
  }
  return [...urls];
}
async function scrapeSitemap(origin, limit) {
  const cand = await discover(origin, limit);
  if (!cand.length) return null;
  const out = [];
  await pMap(cand.slice(0, limit * 4), async (u) => {
    if (out.length >= limit) return;
    let html; try { html = await get(u); } catch { return; }
    const e = extractJsonLd(html, origin) || extractNext(html, origin);
    if (e && e.title && e.price && e.image) { e.url = u; if (out.length < limit) out.push(e); }
  }, 10);
  return out.length ? { method: 'sitemap+extract', products: out.slice(0, limit) } : null;
}

async function main() {
  const key = process.argv[2];
  const limit = Number(process.argv[3]) || 1000;
  const cfg = JSON.parse(readFileSync('scripts/orta-brands.json', 'utf8')).find((b) => b.key === key);
  if (!cfg) { console.error('config yok:', key); process.exit(1); }
  const net = NETS[cfg.net];
  const origin = cfg.domain.startsWith('http') ? cfg.domain.replace(/\/$/, '') : 'https://' + cfg.domain;
  const deep = (u) => `https://${net.track}/aff_c?offer_id=${cfg.offer}&aff_id=${net.aff}&url=${encodeURIComponent(u)}`;

  let res = await tryAkinonApi(origin, limit).catch(() => null);
  if (!res || res.products.length < 10) res = (await scrapeSitemap(origin, limit).catch(() => null)) || res;
  if (!res || !res.products.length) { console.log(`${cfg.name}: 0 ürün (çıkarılamadı)`); writeFileSync(`scripts/out/gen-${key}.json`, '[]'); return; }

  const seen = new Set();
  const docs = res.products.filter((p) => p.externalId && !seen.has(p.externalId) && seen.add(p.externalId)).map((p) => ({
    id: `${cfg.net}-${cfg.offer}-${String(p.externalId).replace(/[/#?\[\].]/g, '_')}`,
    source: cfg.net, feedId: String(cfg.offer), offerId: String(cfg.offer), brandId: null, brandName: cfg.name,
    externalId: String(p.externalId), title: p.title, description: p.desc || undefined,
    price: p.price, salePrice: null, currency: 'TRY', imageLink: p.image, productUrl: deep(p.url),
    availability: 'in stock', donationRate: cfg.rate,
  }));
  writeFileSync(`scripts/out/gen-${key}.json`, JSON.stringify(docs, null, 2));
  console.log(`${cfg.name}: ${docs.length} ürün (${res.method}) → gen-${key}.json`);
}
main().catch((e) => { console.error('HATA:', e.message); process.exit(1); });
