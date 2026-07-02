/**
 * Columbia (ReklamAction offer_id 2487) ürün toplayıcı — SPEED RACE.
 *
 * Columbia Türkiye Next.js sitesi; ürün verisi __NEXT_DATA__ içindeki
 * props.pageProps.product objesinde (isim/fiyat/görsel/sku/stok). Ürün URL'leri
 * /sitemap.xml → /sitemap_products.xml → /sitemap_products_N.xml zincirinden
 * toplanır. Her link ReklamAction (ad.reklm.com) deep-link'ine sarılır → BAĞIŞ korunur.
 *
 * Çıktı: scripts/out/ra-columbia.json  (CanonicalProduct şeması ile uyumlu)
 *
 * Kullanım:
 *   node scripts/brand-columbia.mjs           # hedef 1000
 *   node scripts/brand-columbia.mjs 500       # hedef 500
 */
import { writeFileSync, mkdirSync } from 'node:fs';

const OFFER = '2487';
const AFF_ID = '35329';
const TRACK = 'ad.reklm.com';
const BRAND = 'Columbia';
const BASE = 'https://www.columbia.com.tr';
const DONATION_RATE = 6.5;
const TARGET = Number(process.argv[2] || 1000);
const CONC = 10;

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

// Görselleri mutlak https'e çevir (Columbia CDN URL'leri zaten mutlak)
const absImage = (src) => {
  if (!src) return null;
  let u = String(src).trim();
  if (u.startsWith('//')) u = 'https:' + u;
  else if (u.startsWith('/')) u = BASE + u;
  if (u.startsWith('http://')) u = 'https://' + u.slice(7);
  return u.startsWith('https://') ? u : null;
};

async function get(url) {
  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': UA, 'Accept-Language': 'tr,en;q=0.8', Accept: '*/*' },
      redirect: 'follow',
    });
    return { status: r.status, ok: r.ok, body: await r.text() };
  } catch {
    return { status: 0, ok: false, body: '' };
  }
}

const locs = (xml) =>
  [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map((m) => m[1].trim());

// Bir ürün sayfasından kanonik ürün üret (yoksa null)
function extract(url, html) {
  const idm = url.match(/-p-(\d+)/);
  const urlId = idm ? idm[1] : null;

  const nd = html.match(
    /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/,
  );
  if (!nd) return null;

  let p;
  try {
    p = JSON.parse(nd[1])?.props?.pageProps?.product;
  } catch {
    return null;
  }
  if (!p) return null;

  // Stok: totalQuantity > 0 (sadece stokta olanlar)
  const qty = Number(p.totalQuantity);
  if (!(qty > 0)) return null;

  const pr = p.price || {};
  const oldPrice = Number(pr.oldPrice) || 0;
  const newPrice = Number(pr.newPrice) || 0;
  if (!(newPrice > 0)) return null;

  // İndirim varsa: price = eski (liste) fiyat, salePrice = güncel (indirimli) fiyat
  const discounted = pr.markdown === true && oldPrice > newPrice;
  const price = discounted ? oldPrice : newPrice;
  const salePrice = discounted ? newPrice : null;

  // Görsel: ilk web'de gösterilen ürün detay resmi
  const pics = Array.isArray(p.pictures) ? p.pictures : [];
  const pic = pics.find((x) => x && x.showOnWeb !== false && x.url) || pics[0];
  const img = absImage(pic && pic.url);
  if (!img) return null;

  const title = clean(p.productName);
  if (!title) return null;

  // externalId: sku (varyant-benzersiz) → yoksa barcode → yoksa variantId → urlId
  const externalId = String(
    (p.sku && clean(p.sku)) ||
      (p.barcode && clean(p.barcode)) ||
      p.variantId ||
      urlId ||
      '',
  );
  if (!externalId) return null;

  const desc =
    clean(p.shortDescription || p.description || p.fullDescription).slice(0, 500) ||
    `${title} — Columbia`;

  return {
    externalId,
    title,
    description: desc,
    price,
    salePrice,
    imageLink: img,
  };
}

async function main() {
  const t0 = Date.now();
  console.log(`[columbia] hedef ${TARGET} ürün (conc ${CONC})`);

  // Sitemap zinciri: index → products index → chunk'lar
  const rootIdx = await get(`${BASE}/sitemap.xml`);
  const prodIdxUrl =
    locs(rootIdx.body).find((u) => /sitemap_products\.xml$/.test(u)) ||
    `${BASE}/sitemap_products.xml`;
  const prodIdx = await get(prodIdxUrl);
  let chunks = locs(prodIdx.body).filter((u) => /sitemap_products_\d+\.xml$/.test(u));
  if (chunks.length === 0) chunks = [prodIdxUrl];
  console.log(`[columbia] ${chunks.length} ürün sitemap chunk`);

  // Aday ürün URL'lerini topla
  const candidates = [];
  const seen = new Set();
  for (const ch of chunks) {
    const r = await get(ch);
    for (const u of locs(r.body)) {
      if (/-p-\d+$/.test(u) && !seen.has(u)) {
        seen.add(u);
        candidates.push(u);
      }
    }
  }
  console.log(`[columbia] ${candidates.length} aday ürün URL`);

  // Ürün sayfalarını sınırlı eşzamanlılıkla çek
  const out = [];
  const byExt = new Set();
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
        id: `reklamaction-${OFFER}-${e.externalId}`,
        source: 'reklamaction',
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
        donationRate: DONATION_RATE,
      });
      if (out.length % 50 === 0) {
        console.log(`[columbia] ${out.length}/${TARGET} (işlenen ${processed})`);
      }
    }
  }

  await Promise.all(Array.from({ length: CONC }, worker));

  mkdirSync('scripts/out', { recursive: true });
  writeFileSync('scripts/out/ra-columbia.json', JSON.stringify(out, null, 2));
  const dur = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(
    `[columbia] BİTTİ → ${out.length} ürün (${processed} sayfa, ${dur}s) → scripts/out/ra-columbia.json`,
  );
}

main().catch((e) => {
  console.error('[columbia] HATA', e);
  process.exit(1);
});
