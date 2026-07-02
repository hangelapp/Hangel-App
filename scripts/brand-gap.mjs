/**
 * GAP (gap.com.tr) ürün scraper — hangel.org / ReklamAction offer_id 55899.
 *
 * NEDEN AYRI SCRIPT:
 *   Akinon (Omnishop) mağazası ama sitemap YOK: robots.txt "sitemap.xml" ilan
 *   etse de her sitemap yolu SPA shell (soft-404, text/html) döndürüyor. Bu yüzden
 *   ürün keşfi KATEGORİ sayfalarından yapılır: her kategori sayfası inline HTML'de
 *   `/product/<pk>/` bağlantıları taşır (?page=N ile sayfalanır).
 *
 *   `/product/<pk>/` bir BEDEN/RENK varyantıdır ve 302 ile kanonik ürün slug'ına
 *   yönlenir: /<slug>-<sku>-<renk>-N/?integration_color_id=..&integration_size=..
 *   Aynı ürünün farklı bedenleri AYNI kanonik URL'e (query'siz) gider → ürünleri
 *   kanonik URL ile TEKİLLEŞTİRİRİZ (1000 satır aynı tişörtün bedeni olmasın).
 *
 * Platform: Akinon. Kanonik sayfa JSON-LD Product içerir:
 *   sku, gtin (⚠️ sonda zero-width ​ — temizlenir), image (mutlak HTTPS a-cdn),
 *   name, description, brand, offers.availability (In/OutOfStock),
 *   offers.priceSpecification.price (⚠️ fiyat offers.price DEĞİL, nested).
 *   Fallback: OpenGraph meta (og:title, og:image, og:price:amount, og:availability).
 *
 * Çıktı: ReklamAction Canonical; productUrl BAĞIŞ korumalı deep-link (ad.reklm.com).
 * donationRate:2. Sadece in-stock.
 *
 * Usage:  node scripts/brand-gap.mjs [limit]        (default 1000)
 */
import { writeFileSync, readFileSync, existsSync, mkdirSync, renameSync } from 'node:fs';

const OFFER = '55899';
const AFF_ID = '35329';
const TRACK = 'ad.reklm.com';
const BRAND_NAME = 'GAP';
const DONATION_RATE = 2;
const BASE = 'https://gap.com.tr';
const CDN = 'https://8f7eaa.a-cdn.akinoncloud.com';
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36';

// zero-width + tag + HTML entity temizliği
const clean = (s) =>
  (s || '')
    .replace(/[​-‏﻿]/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const stripZw = (s) => (s || '').replace(/[​-‏﻿]/g, '').trim();

const deepLink = (dest) =>
  `https://${TRACK}/aff_c?offer_id=${OFFER}&aff_id=${AFF_ID}&url=${encodeURIComponent(dest)}`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 405/429/5xx = hız-tabanlı bot koruması → üstel backoff ile yeniden dene
async function get(url, tries = 4) {
  let last = { status: 0, ok: false, body: '', url };
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, {
        headers: {
          'User-Agent': UA,
          'Accept-Language': 'tr,en;q=0.8',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        redirect: 'follow',
      });
      const body = await r.text();
      last = { status: r.status, ok: r.ok, body, url: r.url };
      if (r.status === 405 || r.status === 429 || r.status >= 500) {
        await sleep(1500 * (i + 1) + Math.random() * 800);
        continue;
      }
      return last;
    } catch {
      await sleep(1000 * (i + 1));
    }
  }
  return last;
}

// ── Keşif: homepage → kategori linkleri → her kategoride /product/<pk>/ ─────────
async function discoverCategories() {
  const home = await get(`${BASE}/`);
  if (!home.ok) throw new Error(`homepage ${home.status}`);
  const cats = new Set();
  for (const m of home.body.matchAll(/href="(\/[a-z0-9-]+\/)"/gi)) {
    const p = m[1];
    if (
      /^\/(address|anonymous_order|account|login|baskets?|orders|users|list|gift-card|gonderim|gap-sweats-guide)\b/i.test(
        p,
      )
    )
      continue;
    // tekil-slug kategori kalıbı (ör. /kadin-t-shirt/, /erkek-jean/)
    if (/-/.test(p)) cats.add(BASE + p);
  }
  return [...cats];
}

// bir kategoriyi sayfalayarak /product/<pk>/ pk'larını topla.
// Sayfalar tamamen ayrık (page1∩page2=∅), boş sayfa = kategori sonu → orada dur.
// need dolduğunda bile o kategoriyi bitirmeye zorlamayız; çağıran karar verir.
async function collectPks(catUrl, seenPk, maxPages = 60) {
  const found = [];
  let emptyStreak = 0;
  for (let page = 1; page <= maxPages; page++) {
    const u = page === 1 ? catUrl : `${catUrl}?page=${page}`;
    let res;
    try {
      res = await get(u);
    } catch {
      break;
    }
    if (!res.ok) break;
    const pks = [...res.body.matchAll(/\/product\/(\d+)\//g)].map((m) => m[1]);
    if (!pks.length) {
      // boş sayfa → kategori bitti
      if (++emptyStreak >= 1) break;
      continue;
    }
    emptyStreak = 0;
    const uniqNew = [...new Set(pks)].filter((pk) => !seenPk.has(pk));
    for (const pk of uniqNew) {
      seenPk.add(pk);
      found.push(pk);
    }
  }
  return found;
}

// ── Çıkarım: JSON-LD Product (price nested), meta fallback ─────────────────────
function fromJsonLd(html) {
  for (const m of html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    let j;
    try {
      j = JSON.parse(m[1].trim());
    } catch {
      continue;
    }
    const nodes = Array.isArray(j) ? j : j['@graph'] || [j];
    for (const n of nodes) {
      const t = n['@type'];
      if (t === 'Product' || (Array.isArray(t) && t.includes('Product'))) {
        const off = Array.isArray(n.offers) ? n.offers[0] : n.offers;
        const priceRaw = off?.priceSpecification?.price ?? off?.price ?? off?.lowPrice;
        const availRaw = off?.availability || '';
        return {
          title: clean(n.name),
          price:
            typeof priceRaw === 'number'
              ? priceRaw
              : parseFloat(String(priceRaw ?? '').replace(/\./g, '').replace(',', '.')) || null,
          currency: (off?.priceSpecification?.priceCurrency || off?.priceCurrency || 'TRY').toUpperCase(),
          image: Array.isArray(n.image) ? n.image[0] : n.image,
          sku: stripZw(n.sku || n.gtin || n.mpn || ''),
          canonical: off?.url || null,
          inStock: /InStock/i.test(availRaw),
          desc: clean(n.description),
        };
      }
    }
  }
  return null;
}

function fromMeta(html) {
  const meta = (n) => {
    const a = html.match(
      new RegExp(`<meta[^>]+(?:property|name)=["']${n}["'][^>]+content=["']([^"']*)`, 'i'),
    );
    if (a) return a[1];
    const b = html.match(
      new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${n}["']`, 'i'),
    );
    return b ? b[1] : null;
  };
  const title = meta('og:title') || html.match(/<title>([^<]+)/i)?.[1];
  if (!title) return null;
  const priceRaw = meta('product:price:amount') || meta('og:price:amount');
  let price = priceRaw ? parseFloat(priceRaw) : null;
  if (!price) {
    const pm = html.match(/(\d[\d.]*[.,]\d{2})\s*(?:TL|₺|TRY)/i);
    if (pm) price = parseFloat(pm[1].replace(/\./g, '').replace(',', '.'));
  }
  const avail = meta('product:availability') || meta('og:availability') || '';
  const canonical = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)/i)?.[1] || null;
  return {
    title: clean(title),
    price,
    currency: (meta('og:price:currency') || 'TRY').toUpperCase(),
    image: meta('og:image'),
    sku: null,
    canonical,
    inStock: !/out\s*of\s*stock|outofstock/i.test(avail),
    desc: clean(meta('og:description')),
  };
}

function absImage(img) {
  if (!img) return undefined;
  if (/^https?:\/\//i.test(img)) return img;
  if (img.startsWith('//')) return 'https:' + img;
  return CDN + (img.startsWith('/') ? '' : '/') + img;
}

const cleanCanonical = (u) => {
  try {
    const x = new URL(u, BASE);
    return `${x.origin}${x.pathname}`; // query'yi at (beden/renk)
  } catch {
    return u.split('?')[0];
  }
};

async function main() {
  const limit = Number(process.argv[2]) || 1000;
  const started = Date.now();
  mkdirSync('scripts/out', { recursive: true });
  // ── PID-liveness lock: harness komutu eşzamanlı yeniden çalıştırırsa ikinci kopya,
  //    ilk kopyanın PID'i HÂLÂ CANLI ise sessizce çıkar (age-based değil, gerçek liveness).
  const LOCK = 'scripts/out/.gap.pidlock';
  if (existsSync(LOCK)) {
    const owner = Number(readFileSync(LOCK, 'utf8').trim());
    let alive = false;
    try {
      process.kill(owner, 0); // signal 0 = sadece varlık kontrolü
      alive = owner !== process.pid;
    } catch {
      alive = false;
    }
    if (alive) {
      console.log(`⏭  başka kopya (pid ${owner}) çalışıyor → çıkılıyor`);
      return;
    }
  }
  writeFileSync(LOCK, String(process.pid));
  console.log(`GAP scrape — hedef ${limit} ürün (ReklamAction offer ${OFFER})\n`);

  // ── pk havuzu: diske önbellek (bot-koruma 405 mid-run olursa yeniden tarama yok) ──
  // gap.com.tr velocity-tabanlı 405 uygular; havuzu bir kez kurup .cache'e yazarız,
  // ürün-çekme fazı bloklanırsa kategori taramasını TEKRARLAMAYIZ.
  const PK_CACHE = 'scripts/out/.gap-pks.json';
  let allPks;
  if (existsSync(PK_CACHE)) {
    allPks = JSON.parse(readFileSync(PK_CACHE, 'utf8'));
    console.log(`▸ ${allPks.length} pk önbellekten yüklendi (${PK_CACHE})`);
  } else {
    const cats = await discoverCategories();
    console.log(`▸ ${cats.length} kategori bulundu`);
    const seenPk = new Set();
    allPks = [];
    const pkTarget = limit * 10;
    const catQueue = [...cats];
    const CAT_CONCURRENCY = 4;
    async function catWorker() {
      while (catQueue.length && allPks.length < pkTarget) {
        const cat = catQueue.shift();
        if (!cat) break;
        try {
          allPks.push(...(await collectPks(cat, seenPk)));
        } catch {
          continue;
        }
      }
    }
    await Promise.all(Array.from({ length: CAT_CONCURRENCY }, catWorker));
    writeFileSync(PK_CACHE, JSON.stringify(allPks));
    console.log(`▸ ${allPks.length} ürün-varyant (pk) toplandı, önbelleğe yazıldı`);
  }

  // ── ürün çekme fazı: resumable önbellek (mid-run 405 → kaldığı yerden devam) ──
  // out.length yerine seenCanon (kanonik) ile tekilleştiririz; cache pk→kayıt|null.
  const PROD_CACHE = 'scripts/out/.gap-products.json';
  const cache = existsSync(PROD_CACHE) ? JSON.parse(readFileSync(PROD_CACHE, 'utf8')) : {};
  const out = [];
  const seenCanon = new Set();
  const seenExt = new Set();
  let miss = 0;
  let oos = 0;

  // önce önbellekteki başarılı kayıtları topla (varyant dedup ile)
  const addRecord = (rec) => {
    if (!rec) return;
    if (seenCanon.has(rec.__canon)) return;
    seenCanon.add(rec.__canon);
    let externalId = rec.externalId;
    if (seenExt.has(externalId)) externalId = `${externalId}-${rec.__pk}`;
    seenExt.add(externalId);
    out.push({
      id: `reklamaction-${OFFER}-${externalId}`,
      source: 'reklamaction',
      feedId: OFFER,
      offerId: OFFER,
      brandId: null,
      brandName: BRAND_NAME,
      externalId,
      title: rec.title,
      description: rec.description || '',
      price: rec.price,
      salePrice: null,
      currency: rec.currency || 'TRY',
      imageLink: rec.imageLink,
      productUrl: deepLink(rec.__canon),
      availability: 'in stock',
      donationRate: DONATION_RATE,
    });
  };
  for (const pk of allPks) {
    if (out.length >= limit) break;
    if (Object.prototype.hasOwnProperty.call(cache, pk)) addRecord(cache[pk]);
  }
  console.log(`▸ önbellekten ${out.length} in-stock ürün (${Object.keys(cache).length} pk denenmiş)`);

  const CONCURRENCY = 8;
  let idx = 0;
  let dirty = 0;
  // MERGE-flush: eşzamanlı ikinci kopya cache'i küçültmesin — diskteki mevcut
  // kayıtları belleğe birleştir, sonra yaz (union, asla kayıp yok).
  const atomicWrite = (path, data) => {
    const tmp = `${path}.tmp.${process.pid}`;
    writeFileSync(tmp, data);
    renameSync(tmp, path); // atomik: yarım-yazılmış dosya okunmaz
  };
  const flush = () => {
    // MONOTONIC merge-flush: diskteki kayıtları belleğe birleştir, SONRA yaz.
    // Disk okunamazsa (yarış/parça) YAZMA — küçük veriyle büyüğü ezmeyi önler.
    let onDisk;
    try {
      onDisk = JSON.parse(readFileSync(PROD_CACHE, 'utf8'));
    } catch {
      if (existsSync(PROD_CACHE)) return; // dosya var ama okunamadı → bu flush'ı atla
      onDisk = {};
    }
    // diskteki TÜM kayıtları belleğe birleştir (union) — disk kazanan varyantları da al
    for (const k in onDisk) {
      if (!Object.prototype.hasOwnProperty.call(cache, k) || (cache[k] == null && onDisk[k])) {
        cache[k] = onDisk[k];
        if (cache[k]) addRecord(cache[k]);
      }
    }
    // MONOTONIC guard: in-stock kayıt sayısı diskten AZ ise yazma (asla küçülme)
    const inStock = (o) => {
      let n = 0;
      for (const k in o) if (o[k]) n++;
      return n;
    };
    if (inStock(cache) < inStock(onDisk)) return;
    atomicWrite(PROD_CACHE, JSON.stringify(cache));
  };

  async function worker() {
    while (idx < allPks.length && out.length < limit) {
      const pk = allPks[idx++];
      if (Object.prototype.hasOwnProperty.call(cache, pk)) {
        // zaten denenmiş → in-stock ise dedup ile ekle (yeni pool sırasında yeni canonical olabilir)
        addRecord(cache[pk]);
        continue;
      }
      await sleep(Math.random() * 250); // hafif jitter → velocity blok azalt
      let page;
      try {
        page = await get(`${BASE}/product/${pk}/`);
      } catch {
        miss++;
        continue;
      }
      if (!page.ok) {
        miss++;
        continue; // 405 retry get() içinde tükendi → cache'e YAZMA (sonra tekrar denenir)
      }
      const e = fromJsonLd(page.body) || fromMeta(page.body);
      if (!e || !e.title || !e.price) {
        cache[pk] = null;
        miss++;
        continue;
      }
      if (!e.inStock) {
        cache[pk] = null;
        oos++;
        continue;
      }
      const canon = cleanCanonical(e.canonical || page.url);
      const image = absImage(e.image);
      if (!image || !/^https:\/\//i.test(image)) {
        cache[pk] = null;
        miss++;
        continue;
      }
      let externalId = stripZw(e.sku || '');
      if (!externalId) externalId = canon.replace(/\/$/, '').split('/').pop() || pk;
      const rec = {
        __pk: pk,
        __canon: canon,
        externalId,
        title: e.title,
        description: e.desc || '',
        price: e.price,
        currency: e.currency || 'TRY',
        imageLink: image,
      };
      cache[pk] = rec;
      addRecord(rec);
      if (++dirty % 5 === 0) flush(); // çok sık checkpoint → highwater her an diske yansır
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  flush();

  const final = out.slice(0, limit);
  // HIGH-WATER-MARK: harness komutu ardışık/eşzamanlı yeniden çalıştırıp partial
  // sonuçla iyi çıktıyı EZMESİN diye, yalnızca mevcut dosyadan >= sayıda ürün varsa yaz.
  const OUT = 'scripts/out/ra-gap.json';
  let existingCount = 0;
  try {
    existingCount = JSON.parse(readFileSync(OUT, 'utf8')).length;
  } catch {}
  const dur = ((Date.now() - started) / 1000).toFixed(1);
  if (final.length >= existingCount) {
    const tmp = `${OUT}.tmp.${process.pid}`;
    writeFileSync(tmp, JSON.stringify(final, null, 2));
    renameSync(tmp, OUT);
    console.log(
      `\n✅ ${final.length} ürün yazıldı → ${OUT} (önceki ${existingCount}, miss ${miss}, oos ${oos}, ${dur}s)`,
    );
  } else {
    console.log(
      `\n⏭  ${final.length} < mevcut ${existingCount} → ${OUT} KORUNDU (partial re-run ezilmedi)`,
    );
  }
  if (final[0]) {
    const p = final[0];
    console.log(`   örnek: ${p.title} — ₺${p.price}`);
    console.log(`   img:   ${p.imageLink}`);
    console.log(`   url:   ${p.productUrl}`);
  }
}

main().catch((e) => {
  console.error('HATA:', e.message);
  process.exit(1);
});
