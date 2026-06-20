// hangel — santral numara havuzuna tek numara ekler (status=available).
// Çalıştır: cd ~/new-app && node seed-santral-number.mjs
import admin from 'firebase-admin';
import { readFileSync } from 'node:fs';
admin.initializeApp({ credential: admin.credential.cert(JSON.parse(readFileSync('.firebase-service-account.json','utf8'))) });
const db = admin.firestore();

await db.collection('santralNumberPool').doc('902167080216').set({
  number: '0216 708 0216',
  e164: '+902167080216',
  providerId: 'pasifik',
  status: 'available',          // wizard 3. adım yalnızca 'available' gösterir
  assignedToNgoId: null,
  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
}, { merge: true });

console.log('✅ Numara havuza eklendi (available): 0216 708 0216');
process.exit(0);
