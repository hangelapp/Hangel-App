// Generic affiliate ürün importer — feed'i olmayan ama deeplink geçiren markalar.
// Site sitemap'inden ürün URL'leri → JSON-LD Product (isim/fiyat/görsel/sku) →
// affiliate deeplink'e sar → Firestore products. Bot-korumalı siteler atlanır.
// Kullanım: node _importer.js <grupNo>   (grup /tmp/groups.json + /tmp/offers.json)
const admin = require('firebase-admin');
const fs = require('fs');
const zlib = require('zlib');

const sa = JSON.parse(fs.readFileSync('/Users/apple/new-app/.firebase-service-account.json', 'utf8'));
admin.initializeApp({ credential: admin.credential.cert(sa), projectId: sa.project_id });
const db = admin.firestore();

const ARG = process.argv[2] || 'all';
const ONE_INDEX = ARG === 'one' ? parseInt(process.argv[3], 10) : -1;
const GROUP = (ARG === 'all' || ARG === 'one') ? 'all' : parseInt(ARG, 10);
const PER_BRAND_CAP = 5000;        // marka başı tavan (güvenlik; çoğu marka altında)
const PRODUCTS_TO_FETCH = 6000;    // taranacak sitemap ürün url sayısı
const CONCURRENCY = 6;             // sitemap ürün sayfası paralel çekme (hız)
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/537.36 Chrome/120 Safari/537.36';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const tokenize = (s) => Array.from(new Set((s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i').toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 2))).slice(0, 30);
const decodeEnt = (s) => (s || '').replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
  .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();

async function fetchText(url, timeoutMs = 15000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: '*/*' }, redirect: 'follow', signal: ctrl.signal });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (url.endsWith('.gz') || (buf[0] === 0x1f && buf[1] === 0x8b)) {
      try { return zlib.gunzipSync(buf).toString('utf8'); } catch { return buf.toString('utf8'); }
    }
    return buf.toString('utf8');
  } catch { return null; } finally { clearTimeout(t); }
}

async function discoverProductUrls(domain) {
  const roots = [`https://www.${domain}/robots.txt`];
  let sitemaps = [];
  const robots = await fetchText(roots[0]);
  if (robots) sitemaps = [...robots.matchAll(/Sitemap:\s*(\S+)/gi)].map((m) => m[1]);
  if (!sitemaps.length) sitemaps = [`https://www.${domain}/sitemap.xml`, `https://www.${domain}/sitemap_index.xml`];

  const locsOf = (xml) => [...(xml || '').matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map((m) => m[1].trim());
  let candidates = [];
  for (const sm of sitemaps.slice(0, 4)) {
    const xml = await fetchText(sm);
    if (!xml) continue;
    let locs = locsOf(xml);
    // index ise → alt sitemap'lere bir seviye in (ürün/product/urun olanları tercih)
    const subs = locs.filter((l) => /\.xml/i.test(l));
    if (subs.length && !/-p-\d|\/p\/|\/urun\/|\/product\//i.test(locs.join(' '))) {
      const pref = subs.filter((s) => /product|urun|catalog/i.test(s));
      for (const s of (pref.length ? pref : subs).slice(0, 5)) {
        const x2 = await fetchText(s);
        candidates.push(...locsOf(x2));
      }
    } else {
      candidates.push(...locs);
    }
    if (candidates.length > 500) break;
  }
  const prods = candidates.filter((u) => /-p-\d|-p\d|\/p\/|\/p-\d|\/urun|\/product|\/dp\/|\/pd\/|\/item|-pr-\d|prd|\/p-|\.html?$/i.test(u));
  return (prods.length ? prods : candidates).filter((u) => /^https?:\/\//.test(u) && !/\/(category|kategori|c-\d|liste|blog|kampanya|sitemap)/i.test(u));
}

// Shopify mağazaları: /products.json tüm ürünleri temiz JSON verir (sitemap'e gerek yok).
async function tryShopify(domain) {
  for (const host of [`https://www.${domain}`, `https://${domain}`]) {
    const products = [];
    let page = 1;
    while (page <= 200 && products.length < PER_BRAND_CAP) {
      const txt = await fetchText(`${host}/products.json?limit=250&page=${page}`, 12000);
      if (!txt) break;
      let j; try { j = JSON.parse(txt); } catch { break; }
      if (!j || !Array.isArray(j.products) || !j.products.length) break;
      products.push(...j.products);
      if (j.products.length < 250) break;   // son sayfa
      page++;
      await sleep(150);
    }
    if (!products.length) continue;
    return products.map((p) => {
      const v = (p.variants && p.variants[0]) || {};
      const img = (p.images && p.images[0] && p.images[0].src) || (p.image && p.image.src) || '';
      return {
        title: decodeEnt(p.title || ''),
        price: v.price ? Number(String(v.price).replace(/[^\d.]/g, '')) : 0,
        currency: 'TRY',
        image: img,
        url: `${host}/products/${p.handle}`,
        sku: String(v.sku || p.id || '').trim(),
        gtin: String(v.barcode || '').trim(),
      };
    }).filter((x) => x.title && x.price);
  }
  return null;
}

function extractProduct(html) {
  for (const m of html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    let data; try { data = JSON.parse(m[1].trim()); } catch { continue; }
    const items = Array.isArray(data) ? data : (data['@graph'] || [data]);
    for (const it of items) {
      if (!it || !String(it['@type'] || '').includes('Product')) continue;
      let of = it.offers; if (Array.isArray(of)) of = of[0];
      const price = of && (of.price || of.lowPrice);
      const img = Array.isArray(it.image) ? it.image[0] : it.image;
      if (!it.name) continue;
      return {
        title: decodeEnt(String(it.name)),
        price: price ? Number(String(price).replace(/[^\d.]/g, '')) : 0,
        currency: (of && of.priceCurrency) || 'TRY',
        image: typeof img === 'string' ? img : (img && img.url) || '',
        sku: String(it.sku || it.mpn || '').trim(),
        gtin: String(it.gtin13 || it.gtin || '').trim(),
      };
    }
  }
  // Fallback: Open Graph / ürün meta etiketleri (JSON-LD yoksa)
  const meta = (p) => {
    const m = html.match(new RegExp('<meta[^>]+(?:property|name)=["\']' + p + '["\'][^>]*content=["\']([^"\']+)', 'i'))
      || html.match(new RegExp('<meta[^>]+content=["\']([^"\']+)["\'][^>]*(?:property|name)=["\']' + p + '["\']', 'i'));
    return m ? m[1] : '';
  };
  const ogName = meta('og:title');
  const ogPrice = meta('product:price:amount') || meta('og:price:amount') || meta('product:price');
  if (ogName && ogPrice) {
    return {
      title: decodeEnt(ogName),
      price: Number(String(ogPrice).replace(/[^\d.,]/g, '').replace(/\.(?=\d{3})/g, '').replace(',', '.')) || 0,
      currency: meta('product:price:currency') || 'TRY',
      image: meta('og:image'),
      sku: '', gtin: '',
    };
  }
  return null;
}

async function run() {
  const groups = JSON.parse(fs.readFileSync('/tmp/groups.json', 'utf8'));
  const offers = JSON.parse(fs.readFileSync('/tmp/offers.json', 'utf8'));
  const PER = Math.ceil(groups.length / 4);
  const groupBrands = ARG === 'one' ? [groups[ONE_INDEX]].filter(Boolean)
    : GROUP === 'all' ? groups : groups.slice((GROUP - 1) * PER, GROUP * PER);
  const offerByDomain = {}; offers.forEach((o) => { if (!offerByDomain[o.domain]) offerByDomain[o.domain] = o; });

  console.log(`=== GRUP ${GROUP}: ${groupBrands.length} marka ===`);
  let totalIngested = 0;
  const summary = [];
  const DONE_FILE = '/tmp/import-done.txt';
  const doneSet = new Set(fs.existsSync(DONE_FILE) ? fs.readFileSync(DONE_FILE, 'utf8').split('\n').filter(Boolean) : []);
  const markDone = (name) => { try { fs.appendFileSync(DONE_FILE, name + '\n'); } catch {} };
  // Commit retry: gRPC deadline-exceeded gibi geçici hatalarda backoff'la tekrar dene.
  const commitRetry = async (batch) => {
    for (let i = 0; i < 5; i++) {
      try { await batch.commit(); return; }
      catch (e) { if (i === 4) throw e; await sleep(2000 * (i + 1)); }
    }
  };

  for (const b of groupBrands) {
    if (doneSet.has(b.name)) { console.log(`  ⏩ ${b.name}: atlandı (zaten yapıldı)`); continue; }
    try {
      const off = offerByDomain[b.domain] || offers.find((o) => o.short === b.short && o.name.toLowerCase().includes(b.k.slice(0, 5)));
      if (!off) { summary.push(`${b.name}: offer eşleşmedi`); console.log(`  · ${b.name}: offer yok`); markDone(b.name); continue; }
      const aff = `https://${off.track}/aff_c?offer_id=${off.id}&aff_id=${off.aff}&url=`;

      // 1) Shopify dene (tek istek, temiz veri) → 2) değilse sitemap + JSON-LD/OG.
      let items = []; let method = '';
      try {
        const shop = await tryShopify(b.domain);
        if (shop && shop.length) { items = shop.slice(0, PER_BRAND_CAP); method = 'shopify'; }
      } catch { /* shopify yok */ }

      if (!items.length) {
        let urls = [];
        try { urls = await discoverProductUrls(b.domain); } catch { urls = []; }
        const slice = urls.slice(0, PRODUCTS_TO_FETCH);
        for (let i = 0; i < slice.length && items.length < PER_BRAND_CAP; i += CONCURRENCY) {
          const chunk = slice.slice(i, i + CONCURRENCY);
          const got = await Promise.all(chunk.map(async (u) => {
            const html = await fetchText(u, 12000);
            if (!html) return null;
            const p = extractProduct(html);
            if (!p || !p.price) return null;
            return { ...p, url: u };
          }));
          for (const r of got) if (r) items.push(r);
          await sleep(150); // batch arası nefes (ban riskine karşı)
        }
        method = 'sitemap';
      }

      if (!items.length) { summary.push(`${b.name} [${b.short}]: 0 (engelli/uyumsuz)`); console.log(`  · ${b.name}: 0`); markDone(b.name); await sleep(500); continue; }

      let batch = db.batch(); let inBatch = 0;
      for (const p of items) {
        const id = `scrape-${b.short.toLowerCase()}-${String(p.sku || p.url).replace(/[^a-zA-Z0-9]/g, '').slice(-24)}`;
        batch.set(db.collection('products').doc(id), {
          id, title: p.title, brandName: b.name,
          price: p.price, currency: p.currency || 'TRY',
          imageLink: p.image || '', additionalImages: [],
          productUrl: aff + encodeURIComponent(p.url),   // affiliate deeplink (komisyon)
          gtin: p.gtin || null, mpn: p.sku || null,
          category: '', source: 'scrape-import', sourceNetwork: off.short,
          importBatch: `group-${GROUP}`, affiliateOfferId: off.id,
          searchTokens: tokenize(String(p.title) + ' ' + b.name),
          random: Math.random(), importedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        inBatch++;
        if (inBatch >= 400) { await commitRetry(batch); batch = db.batch(); inBatch = 0; }
      }
      if (inBatch > 0) await commitRetry(batch);
      totalIngested += items.length;
      summary.push(`${b.name} [${b.short}]: ${items.length} ürün (${method})`);
      console.log(`  ✓ ${b.name}: ${items.length} (${method}) | koşan toplam: ${totalIngested}`);
      markDone(b.name);
      await sleep(800);
    } catch (e) {
      // Bir markada beklenmedik hata tüm run'ı öldürmesin — logla, sonrakine geç.
      console.log(`  ⚠️ ${b.name}: HATA ${String((e && e.message) || e).slice(0, 70)} — sonraki markaya geçiliyor`);
      await sleep(3000);
    }
  }
  console.log(`\n=== GRUP ${GROUP} BİTTİ — toplam ${totalIngested} ürün ===`);
  summary.forEach((s) => console.log('  ' + s));
}
run().catch((e) => { console.error('FATAL', e); process.exit(1); });
