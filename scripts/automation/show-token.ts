import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
initializeApp({ credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS!) });
const db = getFirestore();
(async () => {
  const snap = await db.collection('users/v7woPvqKAzSTSodVOJB702WJmJ93/fcmTokens').get();
  for (const t of snap.docs) {
    console.log(`FCM Token (kopyala):`);
    console.log(`${t.id}`);
    console.log(`\nLast updated: ${t.data().createdAt?.toDate?.()?.toISOString?.() || '?'}`);
  }
})();
