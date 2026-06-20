// Sosyal Fayda callSessions teşhisi (PII'siz: numara/status/direction).
import admin from 'firebase-admin';
import { readFileSync } from 'node:fs';
admin.initializeApp({ credential: admin.credential.cert(JSON.parse(readFileSync('.firebase-service-account.json','utf8'))) });
const db = admin.firestore();
const NGO = 'ZqFO7jP2R3DvvyNlPRsp';

const snap = await db.collection('callSessions').where('ngoId','==',NGO).limit(30).get();
console.log('Sosyal Fayda callSessions adet:', snap.size);
snap.docs.slice(0,15).forEach(d => {
  const x = d.data();
  console.log(d.id.slice(0,8), '| dir:', x.direction ?? '—', '| status:', x.status ?? '—',
    '| called:', x.calledNumber ?? '—', '| caller:', x.callerNumber ?? '—',
    '| startedAt:', x.startedAt ? 'var' : 'YOK', '| dur:', x.duration ?? '—');
});
// startedAt'i olmayan var mı (orderBy startedAt bunları DÜŞÜRÜR)
const noStart = snap.docs.filter(d => !d.data().startedAt).length;
console.log('startedAt OLMAYAN doc:', noStart, '(orderBy startedAt bunları listelemez!)');
process.exit(0);
