/**
 * Jacadi (jacadi.com.tr) ürün toplayıcı — ReklamAction offer_id 62075, aff_id 35329.
 *
 * Jacadi "COMER" (usecomer.com) e-ticaret platformunda. Site özellikleri (kazıyla saptandı):
 *
 *  - Ürün DETAY sayfaları fiyat/stok'u AJAX (clientApi) ile yükler → statik HTML'de
 *    `data-price="-"` görünür. Ayrıca sitemap'teki 32.718 URL çoğunlukla artık
 *    SATILMAYAN varyantlar; bunlar HTTP 302 ile ana sayfaya (`/tr`) yönlenir.
 *    Bu yüzden GENERIC scraper patlıyor: ya redirect'i takip edip homepage'i
 *    "ürün" sanıyor ya da AJAX fiyatı hiç göremiyor. In-stock oranı ~%12 →
 *    1000 ürün için ~8000 detay sayfası gerekir (yavaş).
 *
 *  - HIZLI + GÜVENİLİR YOL (bu script): KATEGORİ LİSTELEME sayfaları
 *    (`/tr/tum-koleksiyon?s=1&page=N`) SADECE sipariş edilebilir (in-stock) ürünleri
 *    listeler ve her sayfada:
 *      1) `window.comer.setViewProductItemList({...})` bloğu → her ürünün
 *         id / sku (varyant-uniq, ör "2045923_970_06A") / name / price / url / category.
 *      2) Her ürün kartı: `<li ... product-item ... product-in-stock" data-id="ID">`
 *         + `<a class="product-link" href="/tr/...">` + `<img data-w2i="{...400w...}">`
 *         → data-id ile setView id eşleşir, görsel bağlanır.
 *    Katalog ~34 sayfa (~1020 ürün). page>son'da SON sayfa tekrarlar (durma sinyali).
 *
 *  - Görsel: static.usecomer.com/jacadi/media/product_child/<cid>/thumb/400w/... ZATEN
 *    mutlak https (HTTP200). thumb→big/1000w rewrite ile yüksek çözünürlük (o da 200).
 *  - Fiyat: setView "price" = "5360.00" → ondalık NOKTA korunur → Number(5360.00).
 *  - Her ürün linki ReklamAction deep-link'e sarılır → tıklama izlenir, BAĞIŞ korunur.
 *
 * Çıktı: scripts/out/ra-jacadi.json  (CanonicalProduct şeması ile uyumlu)
 *
 * Kullanım:
 *   node scripts/brand-jacadi.mjs           # hedef 1000
 *   node scripts/brand-jacadi.mjs 300       # hedef 300
 */
import { writeFileSync, mkdirSync } from 'node:fs';

const OFFER = '62075';
const AFF_ID = '35329';
const TRACK = 'ad.reklm.com';
const BRAND = 'Jacadi';
const BASE = 'https://jacadi.com.tr';
const DONATION_RATE = 4;
const TARGET = Number(process.argv[2] || 1000);
const MAX_PAGES = 60; // güvenli üst sınır; katalog ~34 sayfa, tekrar başlayınca dururuz

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const clean = (s) =>
  (s || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/\s+/g, ' ')
    .trim();

const deepLink = (dest) =>
  `https://${TRACK}/aff_c?offer_id=${OFFER}&aff_id=${AFF_ID}&url=${encodeURIComponent(dest)}`;

// listeleme thumb görselini yüksek çözünürlüklü ana görsele çevir (ikisi de HTTP200)
const bigImage = (thumbUrl) => {
  if (!thumbUrl) return null;
  let u = String(thumbUrl).trim();
  if (u.startsWith('//')) u = 'https:' + u;
  // .../product_child/<cid>/thumb/<w>w/origin/<id>.jpg → .../<cid>/big/1000w/origin/<id>.jpg
  u = u.replace(/\/(?:thumb|square|pattern|big)\/\d+w\/origin\//, '/big/1000w/origin/');
  return /^https:\/\//i.test(u) ? u : null;
};

async function get(url) {
  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': UA, 'Accept-Language': 'tr,en;q=0.8', Accept: 'text/html,*/*' },
      redirect: 'follow',
    });
    return { status: r.status, ok: r.ok, body: await r.text(), finalUrl: r.url };
  } catch {
    return { status: 0, ok: false, body: '', finalUrl: url };
  }
}

/**
 * Bir listeleme sayfasından ürünleri çıkar.
 * setViewProductItemList → id başına {sku,name,price,url,category}
 * kartlar → data-id başına görsel + in-stock doğrulaması
 */
function parseListing(html) {
  // 1) setView JSON'undan tüm product objelerini regex ile topla (id -> meta)
  const meta = new Map();
  const reProd =
    /"product":\{"id":"(\d+)","sku":"([^"]+)","name":"([^"]*)","price":"([^"]+)","brand":"[^"]*","category":"([^"]*)","url":"([^"]+)"\}/g;
  let m;
  while ((m = reProd.exec(html))) {
    const [, id, sku, name, price, category, url] = m;
    if (!meta.has(id)) {
      meta.set(id, {
        id,
        sku: clean(sku),
        name: clean(name),
        price: Number(price),
        category: clean(category),
        url,
      });
    }
  }

  // 2) Kartlardan data-id -> görsel + stok. Kart <li ... product-item ...> ile başlar.
  const out = [];
  const seenLocal = new Set();
  const reCard =
    /<li class="list-by-filter-list-item product-item[^"]*" data-id="(\d+)"[^>]*>([\s\S]*?)(?=<li class="list-by-filter-list-item product-item|<\/ul>)/g;
  let c;
  while ((c = reCard.exec(html))) {
    const id = c[1];
    const card = c[2];
    const inStock = /product-in-stock/.test(c[0]); // <li ...> içinde class
    if (!inStock) continue;
    const meta_ = meta.get(id);
    if (!meta_) continue;

    // görsel: data-w2i içindeki 400w (yoksa herhangi bir origin url)
    let img = null;
    const w2i = card.match(/data-w2i="([^"]*400&quot;:&quot;([^"&]+)[^"]*)"/);
    if (w2i && w2i[2]) img = bigImage(w2i[2]);
    if (!img) {
      const any = card.match(
        /https:\/\/static\.usecomer\.com\/jacadi\/media\/product_child\/\d+\/(?:thumb|square|big)\/\d+w\/origin\/\d+\.(?:jpg|jpeg|png|webp)/,
      );
      if (any) img = bigImage(any[0]);
    }
    if (!img) continue;

    if (!meta_.sku || !Number.isFinite(meta_.price) || meta_.price <= 0 || !meta_.name) continue;
    if (seenLocal.has(meta_.sku)) continue;
    seenLocal.add(meta_.sku);

    const dest = meta_.url.startsWith('http') ? meta_.url : BASE + meta_.url;
    const catTail = meta_.category ? meta_.category.split('/').slice(1).join(' · ') : '';
    const description =
      `${meta_.name} — Jacadi Paris${catTail ? ` (${catTail})` : ''}. Jacadi çocuk & bebek koleksiyonu.`;

    out.push({
      externalId: meta_.sku,
      title: meta_.name,
      description,
      price: meta_.price,
      imageLink: img,
      dest,
    });
  }
  return out;
}

async function main() {
  const t0 = Date.now();
  console.log(`[jacadi] hedef ${TARGET} ürün — kategori listeleme yöntemi (offer ${OFFER})`);

  const out = [];
  const byExt = new Set();
  let prevFirstSku = null;
  let pagesFetched = 0;

  for (let page = 1; page <= MAX_PAGES && out.length < TARGET; page++) {
    const url = `${BASE}/tr/tum-koleksiyon?s=1&page=${page}`;
    const r = await get(url);
    pagesFetched++;
    if (!r.ok) {
      console.log(`[jacadi] sayfa ${page}: HTTP ${r.status} — atlanıyor`);
      continue;
    }
    const items = parseListing(r.body);

    // Son sayfadan sonra site son sayfayı tekrar servis eder → ilk sku tekrarı = dur
    const firstSku = items[0]?.externalId || null;
    if (firstSku && firstSku === prevFirstSku) {
      console.log(`[jacadi] sayfa ${page}: son sayfa tekrarı algılandı (${firstSku}) → katalog bitti`);
      break;
    }
    prevFirstSku = firstSku;

    let added = 0;
    for (const it of items) {
      if (out.length >= TARGET) break;
      if (byExt.has(it.externalId)) continue;
      byExt.add(it.externalId);
      added++;
      out.push({
        id: `reklamaction-${OFFER}-${it.externalId}`,
        source: 'reklamaction',
        feedId: OFFER,
        offerId: OFFER,
        brandId: null,
        brandName: BRAND,
        externalId: it.externalId,
        title: it.title,
        description: it.description,
        price: it.price,
        salePrice: null,
        currency: 'TRY',
        imageLink: it.imageLink,
        productUrl: deepLink(it.dest),
        availability: 'in stock',
        donationRate: DONATION_RATE,
      });
    }
    console.log(`[jacadi] sayfa ${page}: +${added} yeni (toplam ${out.length})`);
    if (items.length === 0) {
      console.log(`[jacadi] sayfa ${page}: ürün yok → katalog sonu`);
      break;
    }
  }

  mkdirSync('scripts/out', { recursive: true });
  writeFileSync('scripts/out/ra-jacadi.json', JSON.stringify(out, null, 2));
  const dur = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(
    `[jacadi] BİTTİ → ${out.length} ürün (${pagesFetched} sayfa çekildi, ${dur}s) → scripts/out/ra-jacadi.json`,
  );
  if (out[0]) {
    const p = out[0];
    console.log(`[jacadi] örnek: ${p.title} — ₺${p.price} | sku=${p.externalId}`);
    console.log(`         img: ${p.imageLink}`);
    console.log(`         url: ${p.productUrl.slice(0, 100)}...`);
  }
}

main().catch((e) => {
  console.error('[jacadi] HATA', e);
  process.exit(1);
});
