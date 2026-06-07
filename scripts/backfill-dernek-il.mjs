/**
 * scripts/backfill-dernek-il.mjs
 *
 * registryDernekler (100,967 doc) icinde `il` alani YOK — server-side il
 * filtresi calismiyor. Kutuk no formati XX-XXX-XXX, ilk 2 hane plaka kodu
 * (ornek: "59-001-023" -> "59" -> "Tekirdağ").
 *
 * Bu script tum koleksiyonu scan eder, doc id'nin plaka kodundan il'i
 * cikarip neighborhoodsData key formatinda (ornek "Tekirdağ", proper case)
 * yazar. Idempotent: zaten `il` varsa atlar.
 *
 * Composite index sonra eklenir (firestore.indexes.json: il + nameLower).
 *
 * Usage:
 *   cd /Users/macbookair/new-app
 *   GOOGLE_APPLICATION_CREDENTIALS=./.firebase-service-account.json \
 *     node scripts/backfill-dernek-il.mjs
 *
 *   --dry-run  : sayar ama yazmaz
 *   --resume X : X plaka kodundan baslar (00-81)
 */
import admin from 'firebase-admin';

admin.initializeApp({
  projectId: 'hangel-new-v18-87297865-9bcc3',
  credential: admin.credential.applicationDefault(),
});
const db = admin.firestore();

const TR_IL_PLATES = {
  '01': 'Adana', '02': 'Adıyaman', '03': 'Afyonkarahisar', '04': 'Ağrı', '05': 'Amasya',
  '06': 'Ankara', '07': 'Antalya', '08': 'Artvin', '09': 'Aydın', '10': 'Balıkesir',
  '11': 'Bilecik', '12': 'Bingöl', '13': 'Bitlis', '14': 'Bolu', '15': 'Burdur',
  '16': 'Bursa', '17': 'Çanakkale', '18': 'Çankırı', '19': 'Çorum', '20': 'Denizli',
  '21': 'Diyarbakır', '22': 'Edirne', '23': 'Elazığ', '24': 'Erzincan', '25': 'Erzurum',
  '26': 'Eskişehir', '27': 'Gaziantep', '28': 'Giresun', '29': 'Gümüşhane', '30': 'Hakkari',
  '31': 'Hatay', '32': 'Isparta', '33': 'Mersin', '34': 'İstanbul', '35': 'İzmir',
  '36': 'Kars', '37': 'Kastamonu', '38': 'Kayseri', '39': 'Kırklareli', '40': 'Kırşehir',
  '41': 'Kocaeli', '42': 'Konya', '43': 'Kütahya', '44': 'Malatya', '45': 'Manisa',
  '46': 'Kahramanmaraş', '47': 'Mardin', '48': 'Muğla', '49': 'Muş', '50': 'Nevşehir',
  '51': 'Niğde', '52': 'Ordu', '53': 'Rize', '54': 'Sakarya', '55': 'Samsun',
  '56': 'Siirt', '57': 'Sinop', '58': 'Sivas', '59': 'Tekirdağ', '60': 'Tokat',
  '61': 'Trabzon', '62': 'Tunceli', '63': 'Şanlıurfa', '64': 'Uşak', '65': 'Van',
  '66': 'Yozgat', '67': 'Zonguldak', '68': 'Aksaray', '69': 'Bayburt', '70': 'Karaman',
  '71': 'Kırıkkale', '72': 'Batman', '73': 'Şırnak', '74': 'Bartın', '75': 'Ardahan',
  '76': 'Iğdır', '77': 'Yalova', '78': 'Karabük', '79': 'Kilis', '80': 'Osmaniye',
  '81': 'Düzce',
};

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

async function main() {
  console.log(`registryDernekler 'il' backfill basliyor${dryRun ? ' (DRY-RUN)' : ''}...`);
  let total = 0;
  let updated = 0;
  let skipped = 0;
  let unknown = 0;
  const BATCH_SIZE = 500;
  let batch = db.batch();
  let pending = 0;
  let lastDoc = null;
  const PAGE = 1000;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    let q = db.collection('registryDernekler').orderBy('__name__').limit(PAGE);
    if (lastDoc) q = q.startAfter(lastDoc);
    const snap = await q.get();
    if (snap.empty) break;
    for (const doc of snap.docs) {
      total += 1;
      const data = doc.data();
      if (data.il && typeof data.il === 'string' && data.il.length > 0) {
        skipped += 1;
        continue;
      }
      const platePrefix = doc.id.split('-')[0]?.padStart(2, '0') || '';
      const il = TR_IL_PLATES[platePrefix];
      if (!il) { unknown += 1; continue; }
      if (!dryRun) {
        batch.update(doc.ref, { il, updatedAt: Date.now() });
        pending += 1;
        if (pending >= BATCH_SIZE) {
          await batch.commit();
          batch = db.batch();
          pending = 0;
        }
      }
      updated += 1;
    }
    lastDoc = snap.docs[snap.docs.length - 1];
    if (total % 5000 === 0 || snap.size < PAGE) {
      console.log(`  …scanned ${total}, updated ${updated}, skipped ${skipped}, unknown ${unknown}`);
    }
    if (snap.size < PAGE) break;
  }
  if (pending > 0 && !dryRun) await batch.commit();

  console.log('---');
  console.log(`Toplam: ${total}`);
  console.log(`Updated: ${updated}`);
  console.log(`Skipped (zaten il): ${skipped}`);
  console.log(`Unknown plaka: ${unknown}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
