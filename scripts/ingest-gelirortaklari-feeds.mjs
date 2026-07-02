/**
 * GelirOrtakları Go Feed API'den seçili markaların ürünlerini çekip hangelorg
 * `products` koleksiyonuna yazar. Feed'deki `link` zaten affiliate-tracked →
 * bağış korunur (ekstra deep-link gerekmez). src/lib/feed/gelirortaklari.ts mantığı.
 *
 * Usage: node scripts/ingest-gelirortaklari-feeds.mjs [limitPerBrand]
 */
import admin from 'firebase-admin';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const sa = require('../.hangelorg-service-account.json');

const BASE = 'https://feed.gelirortaklari.com/api/v1';
const API_KEY = '891bae449589572cc756b5fe93e182c527ef910c2137c7e1ea53a0a366ab9cd3';
const AFF_ID = '37081';
const TARGETS = (process.env.ONLY || 'teknosa,mediamarkt,bella maison,huawei').split(',');
const RATE = 3; // feed markaları için varsayılan bağış oranı
const LIMIT = Number(process.argv[2]) || 1000;

function tokenize(text, max = 80) {
  if (!text) return [];
  const lower = String(text).toLocaleLowerCase('tr');
  return Array.from(new Set(lower.split(/[^a-z0-9ğüşıöç]+/i).filter((t) => t && t.length >= 2))).slice(0, max);
}
const stripUndef = (o) => JSON.parse(JSON.stringify(o));
function tag(block, name) {
  const re = new RegExp(`<${name}>\\s*(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?\\s*</${name}>`, 'i');
  const m = block.match(re);
  return m ? m[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim() || undefined : undefined;
}
function parsePrice(raw) {
  if (!raw) return 0;
  const m = raw.trim().match(/([\d.,]+)/);
  if (!m) return 0;
  return Number(m[1].replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.')) || Number(m[1]) || 0;
}

async function listFeeds() {
  const r = await fetch(`${BASE}/feed?affId=${AFF_ID}`, { headers: { 'x-api-key': API_KEY } });
  const j = await r.json();
  return Array.isArray(j.feeds) ? j.feeds : [];
}
async function fetchProducts(feed) {
  const url = `${BASE}/product?affId=${AFF_ID}&offerId=${feed.offer_id}&feedId=${feed.id}`;
  const r = await fetch(url, { headers: { 'x-api-key': API_KEY }, redirect: 'follow' });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const xml = await r.text();
  const out = [];
  const re = /<product>([\s\S]*?)<\/product>/gi;
  let m;
  while ((m = re.exec(xml)) && out.length < LIMIT) {
    const b = m[1];
    const id = tag(b, 'id') || tag(b, 'g:id');
    const link = tag(b, 'link') || tag(b, 'g:link');
    const title = tag(b, 'title') || tag(b, 'g:title');
    const price = parsePrice(tag(b, 'price') || tag(b, 'g:price'));
    const img = tag(b, 'image_link') || tag(b, 'g:image_link');
    if (!id || !link || !title || !price) continue;
    out.push({ id, link, title, price, img, brand: tag(b, 'brand'), desc: tag(b, 'description'), cat: tag(b, 'product_type') || tag(b, 'g:google_product_category') });
  }
  return out;
}

admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();
const now = Date.now();

(async () => {
  const feeds = await listFeeds();
  const picked = [];
  const seen = new Set();
  for (const t of TARGETS) {
    // Bir markanın TÜM feed varyantlarını al (ör. Huawei'nin cimri/avantajix/Akakçe/ana feed'i)
    const matches = feeds.filter((x) => String(x.name).toLocaleLowerCase('tr').includes(t.trim()));
    if (!matches.length) { console.log(`⚠️ feed bulunamadı: ${t}`); continue; }
    for (const f of matches) { if (!seen.has(f.id)) { seen.add(f.id); picked.push({ ...f, target: t }); } }
  }
  console.log(`Feed'ler: ${picked.map((f) => f.name).join(', ')}\n`);

  let grand = 0;
  for (const feed of picked) {
    process.stdout.write(`▸ ${feed.name} (feedId ${feed.id}) çekiliyor... `);
    let prods;
    try { prods = await fetchProducts(feed); } catch (e) { console.log(`HATA ${e.message}`); continue; }
    const docs = prods.map((p, i) => stripUndef({
      id: `gelirortaklari-${feed.id}-${p.id}`,
      source: 'gelirortaklari', feedId: String(feed.id), offerId: String(feed.offer_id), brandId: null,
      brandName: p.brand || feed.name.replace(/\s*\|.*$/, '').trim(),
      externalId: String(p.id), title: p.title, description: p.desc,
      price: p.price, salePrice: null, currency: 'TRY',
      imageLink: p.img, productUrl: p.link, availability: 'in stock', category: p.cat,
      donationRate: RATE, random: (i * 2654435761 % 1000000) / 1000000, updatedAt: now,
      searchTokens: tokenize(`${p.title} ${p.brand || feed.name} ${p.cat || ''} ${p.desc || ''}`),
    }));
    let w = 0;
    for (let i = 0; i < docs.length; i += 450) {
      const batch = db.batch();
      for (const d of docs.slice(i, i + 450)) batch.set(db.collection('products').doc(d.id), d, { merge: true });
      await batch.commit(); w += Math.min(450, docs.length - i);
    }
    console.log(`${w} ürün ✅`);
    grand += w;
  }
  const c = await db.collection('products').count().get();
  console.log(`\nToplam yeni: ${grand} | Firestore products TOPLAM: ${c.data().count}`);
  process.exit(0);
})().catch((e) => { console.error('HATA:', e.message); process.exit(1); });
