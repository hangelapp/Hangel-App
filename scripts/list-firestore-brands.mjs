// Firestore brands collection → tüm marka kayıtlarını listele
// Sonra fetchAllAgencyOffers ile karşılaştır → hangileri panel'de yok
import admin from 'firebase-admin';

const PROJECT_ID = 'hangel-new-v18-87297865-9bcc3';
admin.initializeApp({ projectId: PROJECT_ID, credential: admin.credential.applicationDefault() });
const db = admin.firestore();

const snap = await db.collection('brands').get();
console.log(`Firestore /brands: ${snap.size} doc\n`);
const brands = snap.docs.map(d => ({ id: d.id, ...d.data() }));

// API/panel'den çekilenleri al
const { fetchAllAgencyOffers } = await import('../src/lib/api-clients.ts');
const apiBrands = await fetchAllAgencyOffers();
const apiNames = new Set(apiBrands.map(b => (b.name || '').toLowerCase().trim()));
const apiIds = new Set(apiBrands.map(b => b.id));

console.log(`Panel API'den: ${apiBrands.length} marka\n`);

const onlyInFirestore = brands.filter(b => {
  const n = (b.name || '').toLowerCase().trim();
  return !apiIds.has(b.id) && !apiNames.has(n);
});
const inBoth = brands.filter(b => apiIds.has(b.id) || apiNames.has((b.name || '').toLowerCase().trim()));

console.log('═══ FIRESTORE\'DA VAR, PANEL API\'DE YOK (manuel eklenmiş) ═══');
console.log(`${onlyInFirestore.length} marka:\n`);
onlyInFirestore.forEach(b => {
  console.log(`  ${(b.name || '?').padEnd(35)} | id=${b.id} | category=${b.category || '-'} | source=${b.source || b.agency || '-'}`);
});

console.log('\n═══ Firestore + Panel API ortak ═══');
console.log(`${inBoth.length} marka (gösterilmiyor — çok)\n`);
