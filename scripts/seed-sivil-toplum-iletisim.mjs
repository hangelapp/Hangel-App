/**
 * scripts/seed-sivil-toplum-iletisim.mjs
 *
 * 81 İl Sivil Toplum Müdürlüğü outreachContacts doc'larını adres + telefon
 * + email + website + district bilgisiyle UPDATE eder (merge:true).
 *
 * Veri kaynağı: workflow research (siviltoplum.gov.tr alt sayfaları + valilik siteleri).
 * Coverage: 79 full, 2 partial, 0 missing.
 *
 * Usage:
 *   cd /Users/macbookair/new-app
 *   GOOGLE_APPLICATION_CREDENTIALS=./.firebase-service-account.json \
 *     node scripts/seed-sivil-toplum-iletisim.mjs
 */
import admin from 'firebase-admin';
import fs from 'node:fs';

admin.initializeApp({
  projectId: 'hangel-new-v18-87297865-9bcc3',
  credential: admin.credential.applicationDefault(),
});
const db = admin.firestore();

function slugify(s) {
  return s.toLocaleLowerCase('tr')
    .replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i').replace(/ö/g, 'o')
    .replace(/ş/g, 's').replace(/ü/g, 'u')
    .replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

const CONTACTS = JSON.parse(fs.readFileSync('/tmp/sivil-toplum-iletisim.json', 'utf8'));

async function main() {
  console.log(`${CONTACTS.length} il müdürlüğü iletişim bilgisi update ediliyor...\n`);

  let updated = 0;
  let missing = 0;
  let batch = db.batch();
  let batchCount = 0;

  for (const c of CONTACTS) {
    const docId = `sivil-toplum-${slugify(c.il)}`;
    const ref = db.collection('outreachContacts').doc(docId);
    const existing = await ref.get();
    if (!existing.exists) {
      console.log(`  ⚠️  ${c.il} doc yok (önce seed çalıştırılmalı)`);
      missing++;
      continue;
    }
    batch.set(ref, {
      district: c.district || null,
      address: c.address || null,
      phone: c.phone ? c.phone.replace(/\s+/g, '') : null,
      email: c.email || null,
      website: c.website || null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    updated++;
    batchCount++;
    if (batchCount >= 450) {
      await batch.commit();
      batch = db.batch();
      batchCount = 0;
    }
  }
  if (batchCount > 0) await batch.commit();

  console.log(`\n✅ ${updated} il güncellendi · ⚠️ ${missing} doc yok`);
}

main().catch((e) => { console.error(e); process.exit(1); });
