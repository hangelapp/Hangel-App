/**
 * Ebebek (e-bebek.com) ürün scraper — Affocean offer_id 2783.
 *
 * e-bebek.com AWS WAF JS-challenge (HTTP 202 + challenge.js) ardında. Düz fetch
 * ASLA ürün verisi görmez; sadece challenge sayfası döner. Bu yüzden Playwright
 * Chromium ile challenge çözülür (homepage bir kez ziyaret → token cookie), sonra
 * aynı context ile hem sitemap hem ürün sayfaları normal 200 döner.
 *
 * Her ürün sayfasındaki schema.org JSON-LD Product'tan title / offers.price /
 * image (mutlak https, cdn05.e-bebek.com) / sku / availability çıkarılır ve her
 * ürün linki Affocean deep-link'e sarılır → tıklama izlenir, BAĞIŞ korunur.
 *
 * Çıktı: scripts/out/affocean-ebebek.json  (CanonicalProduct şeması)
 *
 * Usage: node scripts/brand-ebebek.mjs [limit]   (default 200)
 */
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { chromium } from 'playwright';

const OUT_PATH = 'scripts/out/affocean-ebebek.json';

const OFFER = '2783';
const AFF_ID = '7873';
const TRACK = 'ad.afftrck.com';
const BRAND_NAME = 'Ebebek';
const BASE = 'https://www.e-bebek.com';
const SITEMAP = `${BASE}/sitemap/product-tr-try-1`;
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const LIMIT = Number(process.argv[2]) || 200;
const CONCURRENCY = 6;

const clean = (s) =>
  (s || '').replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
const deepLink = (dest) => `https://${TRACK}/aff_c?offer_id=${OFFER}&aff_id=${AFF_ID}&url=${encodeURIComponent(dest)}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** JSON-LD Product düğümünü sayfa içeriğinden çıkar. */
function parseProductLd(ldStrings) {
  for (const s of ldStrings) {
    let j;
    try {
      j = JSON.parse(s);
    } catch {
      continue;
    }
    const nodes = Array.isArray(j) ? j : j['@graph'] || [j];
    for (const n of nodes) {
      const t = n && n['@type'];
      if (t === 'Product' || (Array.isArray(t) && t.includes('Product'))) {
        const off = Array.isArray(n.offers) ? n.offers[0] : n.offers;
        const price = parseFloat(off?.price ?? off?.lowPrice);
        const img = Array.isArray(n.image) ? n.image[0] : n.image;
        return {
          title: clean(n.name),
          price: Number.isFinite(price) ? price : null,
          currency: off?.priceCurrency || 'TRY',
          image: typeof img === 'string' ? img : null,
          sku: n.sku || n.mpn || n.gtin13 || null,
          desc: clean(n.description),
          availability: /InStock/i.test(off?.availability || '') ? 'in stock' : 'out of stock',
        };
      }
    }
  }
  return null;
}

async function main() {
  mkdirSync('scripts/out', { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ userAgent: UA, locale: 'tr-TR', viewport: { width: 1366, height: 900 } });

  // 1) AWS WAF challenge'ı homepage'de çöz + sitemap'i parse et. CloudFront rate-limit
  //    ("The request could not be satisfied") olursa bekleyip tekrar dene.
  console.log('▸ WAF challenge çözülüyor + sitemap çekiliyor...');
  const warm = await ctx.newPage();
  let allUrls = [];
  for (let attempt = 1; attempt <= 6 && allUrls.length === 0; attempt++) {
    await warm.goto(`${BASE}/`, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
    await warm.waitForTimeout(8000); // challenge.js reload + token set
    const homeTitle = await warm.title();
    const rateLimited = /could not be satisfied|Request blocked|Access Denied/i.test(homeTitle);
    if (rateLimited) {
      console.log(`  deneme ${attempt}: CloudFront rate-limit ("${homeTitle}"), 30sn bekleniyor...`);
      await warm.waitForTimeout(30000);
      continue;
    }
    await warm.goto(SITEMAP, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
    await warm.waitForTimeout(2000);
    const xml = await warm.content();
    allUrls = [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)]
      .map((m) => m[1].trim())
      .filter((u) => /-p-[\w-]+$/i.test(u));
    console.log(`  deneme ${attempt}: homepage "${homeTitle.slice(0, 40)}" → sitemap ürün: ${allUrls.length}`);
    if (allUrls.length === 0) await warm.waitForTimeout(15000);
  }
  await warm.close();
  if (allUrls.length === 0) {
    await browser.close();
    console.error('HATA: sitemap alınamadı (WAF/rate-limit kalıcı). Daha sonra tekrar deneyin.');
    process.exit(1);
  }
  console.log(`  sitemap'te ${allUrls.length} ürün URL bulundu, ${LIMIT} tanesi hedefleniyor`);
  // Elenenler (202 / stok / eksik veri) için bol pay al; havuz LIMIT'e ulaşınca durur.
  const rawTargets = allUrls.slice(0, Math.min(LIMIT * 12, allUrls.length));

  // 3) Ürün sayfaları — havuzlu eşzamanlılık, aynı WAF'lı context
  //    Önceki çalıştırmanın çıktısını yükle (resume) → 200'e ekleyerek yaklaş.
  const out = [];
  const seen = new Set();
  if (existsSync(OUT_PATH)) {
    try {
      const prev = JSON.parse(readFileSync(OUT_PATH, 'utf8'));
      for (const p of prev) {
        if (p && p.externalId && !seen.has(p.externalId)) {
          seen.add(p.externalId);
          out.push(p);
        }
      }
      if (out.length) console.log(`  resume: önceki çıktıdan ${out.length} ürün yüklendi`);
    } catch {}
  }
  // Zaten toplanan sku'lara denk gelen sitemap URL'lerini atla (URL sonundaki -p-<id> = sku)
  const targets = rawTargets.filter((u) => {
    const id = u.match(/-p-([\w-]+)$/i)?.[1];
    return !(id && seen.has(id));
  });
  let processed = 0;
  let idx = 0;

  async function worker(wid) {
    const page = await ctx.newPage();
    // görsel/font/analytics engelle → hız
    await page.route('**/*', (route) => {
      const type = route.request().resourceType();
      if (['image', 'media', 'font', 'stylesheet'].includes(type)) return route.abort();
      return route.continue();
    });
    while (out.length < LIMIT && idx < targets.length) {
      const url = targets[idx++];
      processed++;
      try {
        let resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
        // WAF geri gelirse (202 challenge) token tazele + tekrar dene (2 defaya kadar)
        for (let tries = 0; tries < 2 && (!resp || resp.status() === 202); tries++) {
          await page.waitForTimeout(5000);
          resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 }).catch(() => null);
        }
        const ld = await page.$$eval('script[type="application/ld+json"]', (els) => els.map((e) => e.textContent));
        const e = parseProductLd(ld);
        if (!e || !e.title || !e.price || !e.image) continue;
        if (!/^https:\/\//i.test(e.image)) continue;
        if (e.availability !== 'in stock') continue; // bağış için satın alınabilir olmalı
        const externalId = String(e.sku || url.match(/-p-([\w-]+)$/i)?.[1] || url.split('/').pop());
        if (seen.has(externalId)) continue;
        seen.add(externalId);
        out.push({
          id: `affocean-${OFFER}-${externalId}`,
          source: 'affocean',
          feedId: OFFER,
          offerId: OFFER,
          brandId: null,
          brandName: BRAND_NAME,
          externalId,
          title: e.title,
          description: e.desc || undefined,
          price: e.price,
          salePrice: null,
          currency: e.currency || 'TRY',
          imageLink: e.image,
          productUrl: deepLink(url),
          availability: e.availability || 'in stock',
        });
        if (out.length % 20 === 0) console.log(`  ...${out.length} ürün toplandı (${processed} işlendi)`);
      } catch {
        /* skip */
      }
    }
    await page.close();
  }

  console.log(`▸ ${CONCURRENCY} paralel worker ile ürünler çekiliyor...`);
  await Promise.all(Array.from({ length: CONCURRENCY }, (_, i) => worker(i)));
  await browser.close();

  // salePrice: fiyat parse tutarlılığı — currency büyük TRY yaz
  const final = out.slice(0, LIMIT).map((p) => ({ ...p, currency: (p.currency || 'TRY').toUpperCase() }));
  writeFileSync('scripts/out/affocean-ebebek.json', JSON.stringify(final, null, 2));

  const withImg = final.filter((p) => /^https:\/\//.test(p.imageLink || '')).length;
  console.log('\n── ÖZET ──');
  console.log(`  ${BRAND_NAME}: ${final.length} ürün (işlenen sayfa: ${processed}, mutlak https görsel: ${withImg})`);
  if (final[0]) {
    const p = final[0];
    console.log(`  örnek: ${p.title} — ₺${p.price} | ${p.availability}`);
    console.log(`         img: ${p.imageLink}`);
    console.log(`         url: ${p.productUrl.slice(0, 90)}...`);
  }
  console.log(`  → scripts/out/affocean-ebebek.json`);
}

main().catch((e) => {
  console.error('HATA:', e);
  process.exit(1);
});
