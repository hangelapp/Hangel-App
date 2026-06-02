import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp({ credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS!) });
const db = getFirestore();

const UID = 'v7woPvqKAzSTSodVOJB702WJmJ93';

(async () => {
  // Firestore notifications doc oluştur → onNotificationCreated Cloud Function tetiklenecek
  const ref = await db.collection('notifications').add({
    userId: UID,
    title: '🩸 Test: Acil Kan',
    body: 'Bu Cloud Function üzerinden test bildirimi',
    type: 'blood_emergency',
    link: '/emergency',
    read: false,
    createdAt: FieldValue.serverTimestamp(),
  });
  console.log(`✅ Firestore doc: ${ref.id}`);
  console.log(`   Cloud Function onNotificationCreated tetiklendi → APNs push gönderiyor.`);
  console.log(`   Bekle ~3 sn...`);
})();
