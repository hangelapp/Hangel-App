/**
 * scripts/seed-kamu-yarari-dernekler.mjs
 *
 * Kamu Yararına Çalışan Dernekler PDF'inden (siviltoplum.gov.tr) parse edilen
 * listeyi registryDernekler doc'larına işler:
 *   - isKamuYarari: true
 *   - kamuYariNo: "10000000000" gibi giriş sayısı
 *   - kamuYariTarihi: "1.01.1900" gibi tarih
 *
 * Match key: kütük no (PDF "44-001-013" formatı, Firestore doc id ile aynı).
 *
 * Usage:
 *   cd /Users/macbookair/new-app
 *   GOOGLE_APPLICATION_CREDENTIALS=./.firebase-service-account.json \
 *     node scripts/seed-kamu-yarari-dernekler.mjs
 */
import admin from 'firebase-admin';
import fs from 'node:fs';

admin.initializeApp({
  projectId: 'hangel-new-v18-87297865-9bcc3',
  credential: admin.credential.applicationDefault(),
});
const db = admin.firestore();

// PDF text (pypdf ile çıkarıldı, /tmp/kamu-yarari.txt'de)
const RAW = fs.readFileSync('/tmp/kamu-yarari.txt', 'utf8');

// Her satır: "1 44-001-013 MALATYA VEREM SAVAŞ DERNEĞİ 10000000000 1.01.1900"
// S.No (1-N) + kütük (NN-NNN-NNN) + ad + giriş sayısı + tarih (gg.aa.yyyy veya g.aa.yyyy)
function parseEntries() {
  const lines = RAW.split('\n').map((l) => l.trim()).filter(Boolean);
  const entries = [];
  // Pattern: ^(\d+)\s+(\d{2}-\d{3}-\d{3})\s+(.+?)\s+([\d/.]+)\s+(\d{1,2}\.\d{2}\.\d{4})$
  const RE = /^(\d+)\s+(\d{2}-\d{3}-\d{3})\s+(.+?)\s+(\S+)\s+(\d{1,2}\.\d{2}\.\d{4})$/;
  for (const line of lines) {
    const m = line.match(RE);
    if (!m) continue;
    entries.push({
      sira: parseInt(m[1], 10),
      kutukNo: m[2],
      name: m[3].trim(),
      kamuYariNo: m[4],
      kamuYariTarihi: m[5],
    });
  }
  return entries;
}

async function main() {
  const entries = parseEntries();
  console.log(`PDF'ten ${entries.length} dernek parse edildi`);
  console.log('İlk 3:', JSON.stringify(entries.slice(0, 3), null, 2));

  let updated = 0;
  let notFound = 0;
  const notFoundList = [];
  let batch = db.batch();
  let batchCount = 0;

  for (const e of entries) {
    const ref = db.collection('registryDernekler').doc(e.kutukNo);
    const existing = await ref.get();
    if (!existing.exists) {
      notFound++;
      notFoundList.push(`${e.kutukNo} | ${e.name}`);
      continue;
    }
    batch.update(ref, {
      isKamuYarari: true,
      kamuYariNo: e.kamuYariNo,
      kamuYariTarihi: e.kamuYariTarihi,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    updated++;
    batchCount++;
    if (batchCount >= 450) {
      await batch.commit();
      batch = db.batch();
      batchCount = 0;
    }
  }
  if (batchCount > 0) await batch.commit();

  console.log(`\n✅ ${updated} dernek isKamuYarari=true olarak güncellendi`);
  if (notFound > 0) {
    console.log(`⚠️  ${notFound} dernek Firestore'da bulunamadı (kütük no mismatch?)`);
    console.log('İlk 10 missing:');
    notFoundList.slice(0, 10).forEach((l) => console.log('  - ' + l));
  }

  // Doğrulama: kaç dernek isKamuYarari=true?
  const verify = await db.collection('registryDernekler')
    .where('isKamuYarari', '==', true).count().get();
  console.log(`\nFirestore'da şimdi ${verify.data().count} kamu yararına dernek var`);
}

main().catch((e) => { console.error(e); process.exit(1); });
