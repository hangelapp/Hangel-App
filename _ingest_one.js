// Ajan yardımcısı: bir markanın ÖZEL çekilmiş ürünlerini Firestore'a yazar.
// Kullanım: node _ingest_one.js <brandIndex> <itemsJsonPath>
// itemsJson: [{title, price, currency?, image?, url, sku?, gtin?}, ...]
// Deeplink'i /tmp/offers.json'dan markanın offer'ına göre kurar, source=scrape-import.
const admin = require('firebase-admin');
const fs = require('fs');
const sa = JSON.parse(fs.readFileSync('/Users/apple/new-app/.firebase-service-account.json', 'utf8'));
admin.initializeApp({ credential: admin.credential.cert(sa), projectId: sa.project_id });
const db = admin.firestore();

(async () => {
  const idx = parseInt(process.argv[2], 10);
  const itemsPath = process.argv[3];
  const groups = JSON.parse(fs.readFileSync('/tmp/groups.json', 'utf8'));
  const offers = JSON.parse(fs.readFileSync('/tmp/offers.json', 'utf8'));
  const b = groups[idx];
  if (!b) { console.log('GEÇERSIZ index'); process.exit(1); }
  let items = [];
  try { items = JSON.parse(fs.readFileSync(itemsPath, 'utf8')); } catch (e) { console.log('items okunamadı:', e.message); process.exit(1); }
  if (!Array.isArray(items)) { console.log('items dizi değil'); process.exit(1); }

  const offerByDomain = {}; offers.forEach((o) => { if (!offerByDomain[o.domain]) offerByDomain[o.domain] = o; });
  const off = offerByDomain[b.domain] || offers.find((o) => o.short === b.short);
  if (!off) { console.log('offer bulunamadı'); process.exit(1); }
  const aff = `https://${off.track}/aff_c?offer_id=${off.id}&aff_id=${off.aff}&url=`;

  const valid = items.filter((p) => p && p.title && p.price && p.url);
  // Arama indeksi: başlık+marka kelimeleri (Türkçe İ/ı normalize), array-contains için.
  const tok = (s) => Array.from(new Set((s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i').toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 2))).slice(0, 30);
  let batch = db.batch(); let inBatch = 0; let n = 0;
  const commitRetry = async (bt) => { for (let i = 0; i < 5; i++) { try { await bt.commit(); return; } catch (e) { if (i === 4) throw e; await new Promise((r) => setTimeout(r, 2000 * (i + 1))); } } };
  for (const p of valid.slice(0, 60000)) {
    const id = `scrape-${b.short.toLowerCase()}-${String(p.sku || p.url).replace(/[^a-zA-Z0-9]/g, '').slice(-24)}`;
    batch.set(db.collection('products').doc(id), {
      id, title: String(p.title).slice(0, 200), brandName: b.name,
      price: Number(p.price) || 0, currency: p.currency || 'TRY',
      imageLink: p.image || '', additionalImages: [],
      productUrl: aff + encodeURIComponent(p.url),
      gtin: p.gtin || null, mpn: p.sku || null,
      category: '', source: 'scrape-import', sourceNetwork: off.short,
      importBatch: 'agent', affiliateOfferId: off.id,
      searchTokens: tok(String(p.title) + ' ' + b.name),
      random: Math.random(), importedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    inBatch++; n++;
    if (inBatch >= 400) { await commitRetry(batch); batch = db.batch(); inBatch = 0; }
  }
  if (inBatch > 0) await commitRetry(batch);
  try { fs.appendFileSync('/tmp/import-done.txt', b.name + '\n'); } catch {}
  console.log(`INGESTED ${n} ürün → ${b.name}`);
  process.exit(0);
})().catch((e) => { console.error('FATAL', e.message); process.exit(1); });
