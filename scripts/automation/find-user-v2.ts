import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

initializeApp({ credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS!) });
const db = getFirestore();
const auth = getAuth();

(async () => {
  // 1. Auth'da bul
  console.log('=== Firebase Auth ===');
  try {
    const u = await auth.getUserByEmail('ismailhilmi@hangel.org');
    console.log(`Found in Auth: ${u.uid} email=${u.email} displayName=${u.displayName ?? '?'}`);
    // FCM tokens var mı bu UID için
    const tokensSnap = await db.collection(`users/${u.uid}/fcmTokens`).limit(10).get();
    console.log(`FCM tokens at users/${u.uid}/fcmTokens: ${tokensSnap.size}`);
    for (const t of tokensSnap.docs) {
      const d = t.data();
      console.log(`  ${t.id.slice(0,20)}... platform=${d.platform ?? '?'} type=${d.type ?? '?'}`);
    }
    // users doc içeriği
    const userDoc = await db.doc(`users/${u.uid}`).get();
    console.log(`users/${u.uid} exists: ${userDoc.exists}`);
    if (userDoc.exists) {
      const data = userDoc.data();
      console.log(`  Fields: ${Object.keys(data ?? {}).join(', ')}`);
    }
  } catch (e: unknown) {
    console.log(`Auth error: ${(e as Error).message}`);
  }
})();
