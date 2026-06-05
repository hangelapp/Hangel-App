// 1) 14 hayalet brand'i sil
// 2) "İki kitap"ı publish et (active=true, draft=false, published=true)
// 3) 17 denied brand'in panel'deki durumunu (silinme öncesi) son kontrol et
import admin from 'firebase-admin';

const PROJECT_ID = 'hangel-new-v18-87297865-9bcc3';
admin.initializeApp({ projectId: PROJECT_ID, credential: admin.credential.applicationDefault() });
const db = admin.firestore();

const TO_DELETE = [
  'brand-hepsiburada',
  'brand-trendyol',
  'brand-26',           // Amazon TR
  'brand-lcwaikiki',
  'brand-zara',
  'brand-vakko',
  'brand-damat',
  'brand-defacto',
  'brand-ciceksepeti',
  'brand-gittigidiyor',
  'brand-atasun',
  'brand-vatanbilgisayar',
  'brand-watsons',
  'brand-3',            // Karaca (API'de Karaca Core + Influencer mevcut)
];

const PUBLISH_ID = 'wg7c3gMfN7ZzZpG6aPT3'; // İki kitap

console.log('═══ 1) "İki kitap" doc inceleme ═══');
const ikidoc = await db.collection('brands').doc(PUBLISH_ID).get();
if (ikidoc.exists) {
  console.log('Mevcut data:', JSON.stringify(ikidoc.data(), null, 2));
} else {
  console.log('Doc yok!');
}

console.log('\n═══ 2) Silinecek 14 brand önizleme ═══');
for (const id of TO_DELETE) {
  const d = await db.collection('brands').doc(id).get();
  if (!d.exists) { console.log(`  ❌ ${id} → YOK (atlanacak)`); continue; }
  const data = d.data() || {};
  console.log(`  ✓ ${id.padEnd(25)} → ${data.name || '?'} (followers=${data.followers || 0})`);
}

console.log('\n═══ 3) SİLME işlemi başlıyor ═══');
let deleted = 0;
for (const id of TO_DELETE) {
  try {
    await db.collection('brands').doc(id).delete();
    deleted++;
    console.log(`  🗑️  ${id}`);
  } catch (e) {
    console.log(`  ❌ ${id} → ${e.message}`);
  }
}
console.log(`\nToplam silinen: ${deleted}/${TO_DELETE.length}`);

console.log('\n═══ 4) "İki kitap" yayınlama ═══');
await db.collection('brands').doc(PUBLISH_ID).set({
  active: true,
  published: true,
  draft: false,
  visibility: 'public',
  publishedAt: admin.firestore.FieldValue.serverTimestamp(),
}, { merge: true });
console.log('  ✓ İki kitap → published=true, active=true');

console.log('\n═══ 5) Kalan brands sayısı ═══');
const all = await db.collection('brands').get();
console.log(`Firestore /brands: ${all.size} doc kaldı`);
