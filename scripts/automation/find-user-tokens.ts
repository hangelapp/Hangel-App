import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({ credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS!) });
const db = getFirestore();

(async () => {
  const usersSnap = await db.collection('users').where('email', '==', 'ismailhilmi@hangel.org').limit(5).get();
  console.log(`Users found: ${usersSnap.size}`);
  for (const userDoc of usersSnap.docs) {
    console.log(`\n  uid: ${userDoc.id}`);
    console.log(`  email: ${userDoc.data().email}`);
    console.log(`  displayName: ${userDoc.data().displayName ?? '?'}`);
    const tokensSnap = await db.collection(`users/${userDoc.id}/fcmTokens`).limit(10).get();
    console.log(`  FCM tokens: ${tokensSnap.size}`);
    for (const tok of tokensSnap.docs) {
      const t = tok.data();
      console.log(`    ${tok.id.slice(0,20)}... platform=${t.platform ?? '?'} type=${t.type ?? '?'} updated=${t.createdAt?.toDate?.()?.toISOString?.()?.slice(0,19) ?? '?'}`);
    }
  }
})();
