import admin from 'firebase-admin';
import { readFileSync } from 'node:fs';
admin.initializeApp({ credential: admin.credential.cert(JSON.parse(readFileSync('.firebase-service-account.json','utf8'))) });
const db = admin.firestore();
const out = [];
let last = null;
let scanned = 0;
const MAX_SCAN = 80000;
const WANT = 40;
while (out.length < WANT && scanned < MAX_SCAN) {
  let q = db.collection('registryDernekler').orderBy('kutukNo').limit(3000);
  if (last) q = q.startAfter(last);
  const snap = await q.get();
  if (snap.empty) break;
  for (const d of snap.docs) {
    const data = d.data();
    const w = (data.webSite || '').trim();
    if (w) out.push({ kutukNo: data.kutukNo, name: data.name, web: w });
    if (out.length >= WANT) break;
  }
  last = snap.docs[snap.docs.length-1].get('kutukNo');
  scanned += snap.size;
}
console.error('scanned:', scanned, 'with-web:', out.length);
console.log(JSON.stringify(out));
process.exit(0);
