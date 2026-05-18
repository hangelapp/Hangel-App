// Hangel - Firestore seed script
// Yükler: brands (30) + ngos (65) + demo veri temizliği
// Auth: ADC (gcloud auth application-default login) üzerinden

import admin from 'firebase-admin';
import { readFileSync } from 'node:fs';

const PROJECT_ID = 'hangel-new-v18-87297865-9bcc3';

admin.initializeApp({
  projectId: PROJECT_ID,
  credential: admin.credential.applicationDefault(),
});

const db = admin.firestore();

async function clearCollection(name) {
  const snap = await db.collection(name).get();
  console.log(`  ${name}: ${snap.size} doc bulundu`);
  if (snap.empty) return 0;
  let count = 0;
  const batches = [];
  let batch = db.batch();
  for (const doc of snap.docs) {
    batch.delete(doc.ref);
    count++;
    if (count % 450 === 0) {
      batches.push(batch.commit());
      batch = db.batch();
    }
  }
  batches.push(batch.commit());
  await Promise.all(batches);
  return count;
}

async function seedCollection(name, items, extraFields = {}) {
  let count = 0;
  let batch = db.batch();
  const batches = [];
  for (const item of items) {
    const id = item.id;
    const data = { ...item, ...extraFields };
    batch.set(db.collection(name).doc(id), data, { merge: true });
    count++;
    if (count % 450 === 0) {
      batches.push(batch.commit());
      batch = db.batch();
    }
  }
  batches.push(batch.commit());
  await Promise.all(batches);
  return count;
}

async function main() {
  console.log(`\n=== Firestore Seed Script ===`);
  console.log(`Project: ${PROJECT_ID}\n`);

  // 1) BRANDS
  console.log('▸ Mevcut brands koleksiyonu temizleniyor...');
  const brandsDeleted = await clearCollection('brands');
  console.log(`  ✓ ${brandsDeleted} marka silindi`);

  const brandSeed = JSON.parse(readFileSync('docs/database-exports/brands.json', 'utf-8'));
  console.log(`▸ ${brandSeed.length} marka Firestore'a yazılıyor...`);
  const brandsAdded = await seedCollection('brands', brandSeed, { status: 'Aktif' });
  console.log(`  ✓ ${brandsAdded} marka eklendi\n`);

  // 2) NGOs
  console.log('▸ Mevcut ngos koleksiyonu temizleniyor...');
  const ngosDeleted = await clearCollection('ngos');
  console.log(`  ✓ ${ngosDeleted} STK silindi`);

  const ngoSeed = JSON.parse(readFileSync('docs/database-exports/ngos.json', 'utf-8'));
  console.log(`▸ ${ngoSeed.length} STK Firestore'a yazılıyor...`);
  const ngosAdded = await seedCollection('ngos', ngoSeed);
  console.log(`  ✓ ${ngosAdded} STK eklendi\n`);

  // 3) Verification
  console.log('▸ Doğrulama...');
  const brandsCount = (await db.collection('brands').count().get()).data().count;
  const ngosCount = (await db.collection('ngos').count().get()).data().count;
  console.log(`  ✓ brands: ${brandsCount} doc`);
  console.log(`  ✓ ngos: ${ngosCount} doc`);

  console.log(`\n✅ Seed tamamlandı.\n`);
}

main().catch(err => {
  console.error('❌ Seed başarısız:', err);
  process.exit(1);
});
