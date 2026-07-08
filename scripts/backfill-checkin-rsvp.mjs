/**
 * GERİYE DÖNÜK: Etkinliklerde QR/NFC ile check-in yapmış ama katılımcı
 * listesinde (rsvps.status='going') görünmeyen kullanıcıları düzeltir.
 *
 * Katılımcı listesi endpoint'i yalnız 'going' RSVP'yi gösteriyor; eski check-in
 * akışı rsvps'e yazmıyordu → QR ile gelenler listede yoktu. Bu script her
 * etkinlikte checkins/{uid} olup rsvps/{uid}.going olmayanları going yapar.
 *
 * Idempotent + güvenli: sadece EKSİK olanı yazar, mevcut RSVP'leri EZMEZ.
 * Anonim (dev_ hash) check-in'ler atlanır (kullanıcı kimliği yok).
 *
 * Çalıştır: node scripts/backfill-checkin-rsvp.mjs
 */
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

const sa = JSON.parse(readFileSync(new URL('../.firebase-service-account.json', import.meta.url)));
initializeApp({ credential: cert(sa) });
const db = getFirestore();

const eventsSnap = await db.collection('events').get();
console.log(`Toplam etkinlik: ${eventsSnap.size}`);

let scannedEvents = 0, added = 0, alreadyGoing = 0, anonSkipped = 0;

for (const ev of eventsSnap.docs) {
  const checkinsSnap = await ev.ref.collection('checkins').get();
  if (checkinsSnap.empty) continue;
  scannedEvents++;

  for (const ci of checkinsSnap.docs) {
    const data = ci.data();
    const uid = data.uid || (ci.id.startsWith('dev_') ? null : ci.id);
    if (!uid) { anonSkipped++; continue; } // anonim device check-in — kullanıcı yok

    const rsvpRef = ev.ref.collection('rsvps').doc(uid);
    const rsvpSnap = await rsvpRef.get();
    if (rsvpSnap.exists && rsvpSnap.data()?.status === 'going') { alreadyGoing++; continue; }

    await rsvpRef.set({
      userId: uid,
      status: 'going',
      source: 'checkin-backfill',
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    added++;
  }
}

console.log(`\n=== SONUÇ ===`);
console.log(`Check-in'li etkinlik: ${scannedEvents}`);
console.log(`✅ Katılımcı listesine EKLENEN: ${added}`);
console.log(`Zaten going olan: ${alreadyGoing}`);
console.log(`Anonim (atlandı): ${anonSkipped}`);
process.exit(0);
