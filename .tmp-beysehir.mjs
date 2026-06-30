import admin from 'firebase-admin';
import { readFileSync } from 'node:fs';
admin.initializeApp({ credential: admin.credential.cert(JSON.parse(readFileSync('.firebase-service-account.json','utf8'))) });
const db = admin.firestore();
const out = [];
let last = null;
let scanned = 0;
while (scanned < 200000) {
  let q = db.collection('registryDernekler').orderBy('kutukNo').limit(3000);
  if (last) q = q.startAfter(last);
  const snap = await q.get();
  if (snap.empty) break;
  for (const d of snap.docs) {
    const data = d.data();
    const name = (data.name || '');
    const w = (data.webSite || '').trim();
    if (name.toUpperCase().includes('BEYŞEH') && w) {
      out.push({ kutukNo: data.kutukNo, name: data.name, web: w });
    }
  }
  last = snap.docs[snap.docs.length-1].get('kutukNo');
  scanned += snap.size;
}
console.log('scanned:', scanned, 'beysehir-with-web:', out.length);
console.log(JSON.stringify(out, null, 1));
process.exit(0);
