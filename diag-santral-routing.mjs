import admin from 'firebase-admin';
import { readFileSync } from 'node:fs';
admin.initializeApp({ credential: admin.credential.cert(JSON.parse(readFileSync('.firebase-service-account.json','utf8'))) });
const db = admin.firestore();

// 1) ismailhilmi kullanıcısı: managedNgoId?
const us = await db.collection('users').where('email','==','ismailhilmi@hangel.org').limit(5).get();
console.log('--- ismailhilmi users ---');
us.docs.forEach(d => console.log('uid', d.id, '| role', d.data().role, '| managedNgoId', d.data().managedNgoId));

// 2) "sosyal fayda" ngos
const ngos = await db.collection('ngos').limit(3000).get();
const sf = ngos.docs.filter(d => (d.data().name||'').toLocaleLowerCase('tr').includes('sosyal fayda'));
console.log('--- sosyal fayda ngos ---');
sf.forEach(d => console.log('ngoId', d.id, '|', d.data().name, '| type', d.data().type, '| kutukNo', d.data().kutukNo));

// 3) ngoCallCenter docs (status)
const cc = await db.collection('ngoCallCenter').limit(20).get();
console.log('--- ngoCallCenter docs ---');
cc.docs.forEach(d => console.log('id', d.id, '| status', d.data().status, '| callerIdNumber', d.data().callerIdNumber));
process.exit(0);
