// hangel — Firestore'daki film listesini okur (library/filmler). Token yazmaz.
// Çalıştır: cd ~/new-app && node read-films.mjs
import admin from 'firebase-admin';
import { readFileSync } from 'node:fs';
admin.initializeApp({ credential: admin.credential.cert(JSON.parse(readFileSync('.firebase-service-account.json', 'utf8'))) });
const db = admin.firestore();
const snap = await db.collection('library').doc('filmler').get();
if (!snap.exists) { console.log('library/filmler YOK — film verisi başka yerde olabilir.'); process.exit(0); }
const items = snap.data().items || [];
console.log('FILM SAYISI:', items.length);
console.log('ALANLAR:', Object.keys(items[0] || {}).join(', '));
console.log('---');
for (const it of items) {
  console.log(`${it.slug} | ${it.title} | yön: ${it.director || '-'} | tür: ${it.genre || '-'} | yıl: ${it.year || '-'} | imdb: ${it.imdbRating ?? it.rating ?? '-'} | dub: ${it.dub ?? '-'}`);
}
process.exit(0);
