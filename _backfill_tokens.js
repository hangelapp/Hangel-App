// Mevcut TÜM ürünlere searchTokens ekler (arama indeksi). Tek seferlik backfill.
const admin = require('firebase-admin');
const fs = require('fs');
const sa = JSON.parse(fs.readFileSync('/Users/apple/new-app/.firebase-service-account.json', 'utf8'));
admin.initializeApp({ credential: admin.credential.cert(sa), projectId: sa.project_id });
const db = admin.firestore();

const tok = (s) => Array.from(new Set((s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i').toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 2))).slice(0, 30);
const commitRetry = async (bt) => { for (let i = 0; i < 5; i++) { try { await bt.commit(); return; } catch (e) { if (i === 4) throw e; await new Promise((r) => setTimeout(r, 2000 * (i + 1))); } } };

(async () => {
  let last = null; let total = 0; let updated = 0;
  while (true) {
    let q = db.collection('products').orderBy('__name__').limit(2000);
    if (last) q = q.startAfter(last);
    const snap = await q.get();
    if (snap.empty) break;
    let batch = db.batch(); let n = 0;
    for (const d of snap.docs) {
      const f = d.data();
      if (Array.isArray(f.searchTokens) && f.searchTokens.length) continue; // zaten var
      const st = tok(`${f.title || ''} ${f.brandName || ''}`);
      batch.set(d.ref, { searchTokens: st }, { merge: true });
      n++; updated++;
      if (n >= 400) { await commitRetry(batch); batch = db.batch(); n = 0; }
    }
    if (n > 0) await commitRetry(batch);
    total += snap.size;
    last = snap.docs[snap.docs.length - 1];
    if (total % 20000 < 2000) console.log(`taranan ${total}, güncellenen ${updated}`);
  }
  console.log(`BİTTİ — taranan ${total}, token eklenen ${updated}`);
  process.exit(0);
})().catch((e) => { console.error('FATAL', e.message); process.exit(1); });
