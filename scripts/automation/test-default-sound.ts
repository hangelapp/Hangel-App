import { initializeApp, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({ credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS!) });
const messaging = getMessaging();
const db = getFirestore();

(async () => {
  const tokensSnap = await db.collection('users/v7woPvqKAzSTSodVOJB702WJmJ93/fcmTokens').get();
  const tokens = tokensSnap.docs.map(d => d.id);
  console.log(`Token sayısı: ${tokens.length}`);
  const res = await messaging.sendEachForMulticast({
    tokens,
    notification: { title: '🔔 Test (default sound)', body: 'Bu Tri-tone ile gelmeli — sessizse iPhone Silent mod ON' },
    data: { type: 'test', link: '/' },
    apns: {
      headers: { 'apns-priority': '10' },
      payload: { aps: { sound: 'default', 'mutable-content': 1, badge: 2 } },
    },
  });
  console.log(`Success: ${res.successCount}/${res.responses.length}`);
})();
