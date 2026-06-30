// TÜM ürünlerin searchTokens'ını yeniden üretir (OVERWRITE) — Türkçe normalize tutarlılığı.
// (İlk backfill token'ı olanı atlıyordu; bazıları ham "koçtaş" token'lıydı → normalize arama eşleşmiyordu.)
const admin = require('firebase-admin');
const fs = require('fs');
const sa = JSON.parse(fs.readFileSync('/Users/apple/new-app/.firebase-service-account.json', 'utf8'));
admin.initializeApp({ credential: admin.credential.cert(sa), projectId: sa.project_id });
const db = admin.firestore();
const tok = (s) => Array.from(new Set((s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i').toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 2))).slice(0, 30);
const cr = async (bt) => { for (let i = 0; i < 5; i++) { try { await bt.commit(); return; } catch (e) { if (i === 4) throw e; await new Promise((r) => setTimeout(r, 2000 * (i + 1))); } } };
(async () => {
  let last = null, tot = 0;
  while (true) {
    let q = db.collection('products').orderBy('__name__').limit(2000);
    if (last) q = q.startAfter(last);
    const snap = await q.get();
    if (snap.empty) break;
    let b = db.batch(), n = 0;
    for (const d of snap.docs) {
      const f = d.data();
      b.set(d.ref, { searchTokens: tok(`${f.title || ''} ${f.brandName || ''}`) }, { merge: true });
      n++;
      if (n >= 400) { await cr(b); b = db.batch(); n = 0; }
    }
    if (n > 0) await cr(b);
    tot += snap.size;
    last = snap.docs[snap.docs.length - 1];
    if (tot % 40000 < 2000) console.log('yeniden token:', tot);
  }
  console.log('BİTTİ — yeniden token\'lanan:', tot);
  process.exit(0);
})().catch((e) => { console.error('FATAL', e.message); process.exit(1); });
