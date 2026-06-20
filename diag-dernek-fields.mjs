// hangel — registryDernekler alan kapsama teşhisi. 3000 doc örnekler, hangi
// alanların ne kadar dolu olduğunu raporlar. Token/PII yazmaz (sadece sayım).
// Çalıştır: cd ~/new-app && node diag-dernek-fields.mjs
import admin from 'firebase-admin';
import { readFileSync } from 'node:fs';
admin.initializeApp({ credential: admin.credential.cert(JSON.parse(readFileSync('.firebase-service-account.json', 'utf8'))) });
const db = admin.firestore();

const SAMPLE = 3000;
const snap = await db.collection('registryDernekler').limit(SAMPLE).get();
const n = snap.size;
console.log('Örneklem:', n, 'dernek');

const filled = {};
const seenKeys = new Set();
const nonEmpty = (v) => v !== undefined && v !== null && String(v).trim() !== '';
for (const d of snap.docs) {
  const data = d.data();
  for (const k of Object.keys(data)) seenKeys.add(k);
  for (const k of Object.keys(data)) {
    if (nonEmpty(data[k])) filled[k] = (filled[k] || 0) + 1;
  }
}
console.log('Görülen tüm alanlar:', [...seenKeys].sort().join(', '));
console.log('--- alan dolu oranı (örneklemde) ---');
for (const [k, c] of Object.entries(filled).sort((a, b) => b[1] - a[1])) {
  console.log(`${k}: ${c}/${n} (%${Math.round(c / n * 100)})`);
}
// İletişim alanlarına özel bak (farklı adlandırma ihtimali)
const contactKeys = ['ePosta', 'email', 'eposta', 'e_posta', 'mail', 'telefon1', 'telefon2', 'telefon', 'phone', 'tel', 'gsm', 'cep', 'webSite', 'website', 'web'];
console.log('--- iletişim alanları ---');
for (const k of contactKeys) console.log(`${k}: ${filled[k] || 0}`);
process.exit(0);
