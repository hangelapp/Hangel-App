/**
 * brands koleksiyonunda ÖLÜ Storage bucket (hangel-new-v18 — silinmiş proje) veya
 * kapanmış clearbit URL'li logoUrl alanlarını BOŞALTIR. Böylece BrandLogo (ve her
 * yer) doğrudan markanın GERÇEK logo kaynağına (unavatar / google sz=256) düşer.
 *
 * Idempotent + güvenli: sadece ölü URL'leri temizler, gerçek logoUrl'lere DOKUNMAZ.
 * Çalıştır: node scripts/clean-dead-brand-logos.mjs
 */
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

const sa = JSON.parse(readFileSync(new URL('../.firebase-service-account.json', import.meta.url)));
initializeApp({ credential: cert(sa) });
const db = getFirestore();

const isDead = (u) => !!u && (u.includes('hangel-new-v18') || u.includes('logo.clearbit.com/'));

const snap = await db.collection('brands').get();
let cleaned = 0, kept = 0, empty = 0;
const batch = db.batch();
let batchCount = 0;

for (const doc of snap.docs) {
  const url = (doc.data().logoUrl || '').trim();
  if (!url) { empty++; continue; }
  if (isDead(url)) {
    batch.update(doc.ref, { logoUrl: '' });
    batchCount++;
    cleaned++;
    if (batchCount >= 400) { await batch.commit(); batchCount = 0; }
  } else {
    kept++;
  }
}
if (batchCount > 0) await batch.commit();

console.log(`\n=== SONUÇ ===`);
console.log(`Toplam marka: ${snap.size}`);
console.log(`✅ Ölü logoUrl temizlendi: ${cleaned} (→ gerçek logo kaynağına düşecek)`);
console.log(`Gerçek logo korundu: ${kept}`);
console.log(`Zaten boş: ${empty}`);
process.exit(0);
