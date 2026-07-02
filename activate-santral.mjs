// hangel — bir STK'nın santralını aktive eder + Caller ID numarasını atar.
// Çalıştır: cd ~/new-app && node activate-santral.mjs "sosyal fayda"
// İsteğe bağlı 2. arg ile numara override: node activate-santral.mjs "sosyal fayda" "+902167080216"
import admin from 'firebase-admin';
import { readFileSync } from 'node:fs';
admin.initializeApp({ credential: admin.credential.cert(JSON.parse(readFileSync('.firebase-service-account.json','utf8'))) });
const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

const term = (process.argv[2] || 'sosyal fayda').toLocaleLowerCase('tr');
const RAW_NUMBER = process.argv[3] || '+902167080216';            // Sosyal Fayda DID
const NUMBER_DISPLAY = '0216 708 0216';
const NUMBER_ID = RAW_NUMBER.replace(/[^\d]/g, '');               // pool doc id: 902167080216
const PROVIDER_ID = 'pasifik';
const PACKAGE_ID = 'pro';

const snap = await db.collection('ngos').limit(2000).get();
const matches = snap.docs.filter(d => ((d.data().name||'')).toLocaleLowerCase('tr').includes(term));
if (!matches.length) { console.log('Eşleşen STK yok:', term); process.exit(0); }

for (const d of matches) {
  // 1) Numara havuzuna ekle + bu STK'ya 'assigned' işaretle (süper-admin görünümü + tutarlılık).
  await db.collection('santralNumberPool').doc(NUMBER_ID).set({
    number: NUMBER_DISPLAY,
    e164: RAW_NUMBER,
    providerId: PROVIDER_ID,
    status: 'assigned',
    assignedToNgoId: d.id,
    assignedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  // 2) ngoCallCenter → active + Caller ID atanmış (numara seçimi yapılmış görünür, sistem devam eder).
  await db.collection('ngoCallCenter').doc(d.id).set({
    ngoId: d.id,
    status: 'active',
    providerId: PROVIDER_ID,
    packageId: PACKAGE_ID,
    callerIdNumber: NUMBER_DISPLAY,
    reservedNumberId: NUMBER_ID,
    sipServer: 'santral.hangel.org',
    sipDomain: 'santral.hangel.org',
    monthlyMinutesQuota: 2000,
    currentMonthUsage: 0,
    activatedAt: FieldValue.serverTimestamp(),
    activatedBy: 'santral-setup',
  }, { merge: true });

  console.log('✅ AKTİF:', d.data().name, '| ngoId:', d.id, '| numara:', NUMBER_DISPLAY);
}
console.log('Toplam aktive:', matches.length, '— /ngo-admin/call-center açılınca panel + atanmış numara görünür.');
process.exit(0);
