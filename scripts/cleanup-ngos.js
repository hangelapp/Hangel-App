const admin = require('firebase-admin');
const path = require('path');

const serviceAccount = require(path.join(__dirname, '../.firebase-service-account.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const KEEP_NAMES = [
  'Hatay Kadın Girişimciler Derneği',
  'Ökmen Vakfı',
  'Manavgat Turizm Otelciler ve İşletmeciler Derneği',
  'Gökyüzü Sanatsal İyilik Vakfı',
  'Çocuk Hakları Gönüllüleri Derneği',
  'Mersin Güçbirliği Kalkınma ve Gelecek Derneği',
  'İzmir Karşıyaka Lisesi Eğitim Vakfı',
  'Mektup Arkadaşlarım Derneği',
  'Ortopedik Özürlüler Dayanışma Derneği',
  'Patent Hareketi Derneği',
  'Dünyayı Güzellik Kurtaracak Derneği',
  'Uluslararası Anne Evi Derneği',
  'Sosyal Akıl Derneği',
  'Genç Düşünce Enstitüsü Derneği',
  'Fatsalılar Kültür ve Yardımlaşma Derneği',
  'Ankara Sağlık ve Eğitim Gönüllüleri Derneği',
  'Tüvana Okuma İstekli Çocuk Eğitim Vakfı',
  'Sağlık Hakkı Derneği',
  'Gülmek İyileştirir Derneği',
  'TİDER - Temel İhtiyaç Derneği',
  'Tohumluk Sosyal Yardımlaşma, Eğitim, Kültür ve Sanat Vakfı',
  'Patipark Hayvanseverler Derneği',
  'Social Business Global',
  'Yeşil Türkiye',
  'Acil İhtiyaç Projesi Vakfı',
  'KAÇOD - Kanser Çocuğumdan Uzak Dur Derneği',
  'Serebral Palsili Çocuklar Derneği',
];

// Normalize for fuzzy matching: lowercase, trim, collapse spaces
function normalize(str) {
  return (str || '').toLowerCase().trim().replace(/\s+/g, ' ');
}

const normalizedKeepNames = KEEP_NAMES.map(normalize);

function shouldKeep(docName) {
  const normalizedDoc = normalize(docName);
  return normalizedKeepNames.some(keepName => {
    // Exact match after normalization
    if (normalizedDoc === keepName) return true;
    // Close match: one contains the other (handles minor prefix/suffix differences)
    if (normalizedDoc.includes(keepName) || keepName.includes(normalizedDoc)) return true;
    return false;
  });
}

async function main() {
  console.log('Fetching all docs from the ngos collection...');
  const snapshot = await db.collection('ngos').get();
  console.log(`Total NGOs found: ${snapshot.size}`);

  const toDelete = [];
  const toKeep = [];

  snapshot.forEach(doc => {
    const data = doc.data();
    const name = data.name || data.title || data.orgName || '';
    if (shouldKeep(name)) {
      toKeep.push({ id: doc.id, name });
    } else {
      toDelete.push({ id: doc.id, name });
    }
  });

  console.log(`\nNGOs to KEEP (${toKeep.length}):`);
  toKeep.forEach(n => console.log(`  [KEEP] ${n.name} (id: ${n.id})`));

  console.log(`\nNGOs to DELETE (${toDelete.length}):`);
  toDelete.forEach(n => console.log(`  [DELETE] ${n.name} (id: ${n.id})`));

  if (toDelete.length === 0) {
    console.log('\nNothing to delete. Done.');
    process.exit(0);
  }

  console.log(`\nDeleting ${toDelete.length} NGO(s)...`);

  // Firestore batch supports up to 500 ops
  const batchSize = 499;
  let deleted = 0;
  for (let i = 0; i < toDelete.length; i += batchSize) {
    const batch = db.batch();
    const chunk = toDelete.slice(i, i + batchSize);
    chunk.forEach(({ id }) => batch.delete(db.collection('ngos').doc(id)));
    await batch.commit();
    deleted += chunk.length;
    console.log(`  Deleted ${deleted}/${toDelete.length}`);
  }

  console.log('\nDone. Cleanup complete.');
  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
