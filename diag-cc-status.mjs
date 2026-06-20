// PII'siz teşhis: ngoCallCenter statüleri + "sosyal fayda" ngos id'leri.
import admin from 'firebase-admin';
import { readFileSync } from 'node:fs';
admin.initializeApp({ credential: admin.credential.cert(JSON.parse(readFileSync('.firebase-service-account.json','utf8'))) });
const db = admin.firestore();

console.log('--- ngoCallCenter docs (id + status + callerIdNumber) ---');
const cc = await db.collection('ngoCallCenter').limit(50).get();
cc.docs.forEach(d => console.log(d.id, '|', d.data().status, '|', d.data().callerIdNumber ?? '—'));

console.log('--- ngos: name "sosyal fayda" içerenler (id + name) ---');
const ngos = await db.collection('ngos').limit(3000).get();
ngos.docs
  .filter(d => (d.data().name||'').toLocaleLowerCase('tr').includes('sosyal fayda'))
  .forEach(d => console.log(d.id, '|', d.data().name));
process.exit(0);
