/**
 * Live Activity end-to-end simulasyonu.
 *
 * Cloud Function APNs deploy edilmiş + APNs Auth Key set edilmiş varsayar.
 * Bu script Firestore'da emergencyBloodCalls doc oluşturup update eder,
 * Cloud Function trigger olur ve user'ın Live Activity'sine push gelir.
 *
 * Kullanım:
 *   GOOGLE_APPLICATION_CREDENTIALS=./.firebase-service-account.json \
 *     npx tsx scripts/automation/live-activity-simulate.ts
 *
 * Adımlar:
 *   1. Test emergencyBloodCalls doc yarat
 *   2. 10 sn sonra status update (matchedDonors arttı)
 *   3. 20 sn sonra status update (Hastanede)
 *   4. 30 sn sonra status=resolved → Live Activity end
 *
 * Watch'tan veya iPhone'dan Live Activity başlamış olmalı (kullanıcı önce
 * /notifications'da "Yardım Edebilirim" basmalı, sonra bu script çalıştır).
 */
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp({ credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS!) });
const db = getFirestore();

const REQUEST_ID = `test-${Date.now()}`;

function wait(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

async function main() {
  const ref = db.collection('emergencyBloodCalls').doc(REQUEST_ID);

  console.log(`[live-activity-sim] Creating test emergency: ${REQUEST_ID}`);
  await ref.set({
    bloodType: 'A+',
    city: 'İstanbul',
    hospitalName: 'Hisar Hastanesi',
    matchedDonors: 0,
    minutesLeft: 60,
    status: 'pending',
    distance: '5.2 km',
    createdAt: FieldValue.serverTimestamp(),
  });
  console.log(`  ✅ Created. Wait for Cloud Function trigger (5 sn)...`);
  await wait(5000);

  console.log(`\n[T+5s] Update: matchedDonors=3, minutesLeft=50`);
  await ref.update({
    matchedDonors: 3,
    minutesLeft: 50,
    status: 'matched',
  });
  await wait(10000);

  console.log(`\n[T+15s] Update: status=in-progress, matched=5, minutesLeft=30`);
  await ref.update({
    matchedDonors: 5,
    minutesLeft: 30,
    status: 'in-progress',
  });
  await wait(10000);

  console.log(`\n[T+25s] Update: status=resolved (Live Activity END)`);
  await ref.update({
    matchedDonors: 5,
    minutesLeft: 0,
    status: 'resolved',
  });
  console.log('  ✅ Resolved. Cloud Function should send Live Activity END push.');

  await wait(5000);
  console.log(`\n[T+30s] Cleanup test doc...`);
  await ref.delete();
  console.log('  ✅ Cleaned up.');
  console.log('\nKontrol:');
  console.log('  - iPhone Live Activity Dynamic Island güncellemesi gördü mü');
  console.log('  - Watch ContentView listede yeni emergency aldı mı');
  console.log('  - Cloud Function logs: gcloud functions logs read onEmergencyBloodUpdate');
}

main().then(() => process.exit(0)).catch((e) => {
  console.error('HATA:', e);
  process.exit(1);
});
