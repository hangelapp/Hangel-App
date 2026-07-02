/**
 * scripts/out/affocean-*.json içindeki scrape'li ürünleri hangelorg `products`
 * koleksiyonuna yazar. searchTokens app'in tokenizer'ıyla (src/lib/feed/search.ts)
 * birebir üretilir; donationRate offer payout oranından set edilir; random +
 * updatedAt eklenir. productUrl zaten deep-link (bağış korumalı).
 *
 * Usage: node scripts/ingest-scraped-products.mjs
 */
import admin from 'firebase-admin';
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const sa = require('../.hangelorg-service-account.json');

// offer_id → bağış oranı (affocean-pull.mjs canlı payout'larından)
const RATE = {
  '2783': 2.5, '2829': 7, '2804': 2.5, '2865': 5, '2866': 5, '2867': 5,
  '2892': 4, '2861': 7.5, '2845': 5.6, '2831': 4.48, '2794': 2, '2777': 1.5,
  '2745': 4, '2846': 3.5,
};

// src/lib/feed/search.ts tokenize + searchTokensFor ile birebir
function tokenize(text, max = 40) {
  if (!text) return [];
  const lower = String(text).toLocaleLowerCase('tr');
  const parts = lower.split(/[^a-z0-9ğüşıöç]+/i).filter((t) => t && t.length >= 2);
  return Array.from(new Set(parts)).slice(0, max);
}
const searchTokensFor = (p) =>
  tokenize(`${p.title ?? ''} ${p.brandName ?? ''} ${p.category ?? ''} ${p.description ?? ''}`, 80);

const stripUndefined = (o) => JSON.parse(JSON.stringify(o));

admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();
const now = Date.now();

async function main() {
  const only = process.argv[2]; // opsiyonel: tek marka key (dosya adında geçen, ör. koton)
  const files = readdirSync('scripts/out').filter((f) =>
    f.endsWith('.json') && (!only || f.includes(only)));
  let all = [];
  const bad = [];
  for (const f of files) {
    try {
      const arr = JSON.parse(readFileSync(`scripts/out/${f}`, 'utf8'));
      if (Array.isArray(arr)) all.push(...arr); else bad.push(f + ' (dizi değil)');
    } catch (e) {
      bad.push(f + ' (' + e.message.slice(0, 30) + ')');
    }
  }
  console.log(`${files.length} dosya okundu, ${all.length} ürün.` + (bad.length ? ` ⚠️ bozuk/atlanan: ${bad.join(', ')}` : ''));

  // hazırla
  const docs = all
    .filter((p) => p.title && p.price)
    .map((p, i) => stripUndefined({
      ...p,
      id: String(p.id).replace(/[/#?\[\].]/g, '_'), // Firestore doc ID "/" vb. kabul etmez (ör. beden "M/L")
      donationRate: p.donationRate ?? RATE[p.offerId] ?? 2,
      searchTokens: searchTokensFor(p),
      random: (i * 2654435761 % 1000000) / 1000000, // deterministik 0..1 (Math.random yok)
      updatedAt: now,
    }));

  console.log(`Yazılacak: ${docs.length} ürün → products (hangelorg)\n`);
  let written = 0;
  for (let i = 0; i < docs.length; i += 450) {
    const slice = docs.slice(i, i + 450);
    const batch = db.batch();
    for (const d of slice) batch.set(db.collection('products').doc(d.id), d, { merge: true });
    await batch.commit();
    written += slice.length;
    process.stdout.write(`  yazıldı ${written}/${docs.length}\r`);
  }
  console.log(`\n✅ ${written} ürün yazıldı.`);

  const c = await db.collection('products').count().get();
  console.log('Firestore products TOPLAM:', c.data().count);
  // marka bazında özet
  const byBrand = {};
  docs.forEach((d) => { byBrand[d.brandName] = (byBrand[d.brandName] || 0) + 1; });
  console.log('Marka bazında:', JSON.stringify(byBrand));
  process.exit(0);
}
main().catch((e) => { console.error('HATA:', e.message); process.exit(1); });
