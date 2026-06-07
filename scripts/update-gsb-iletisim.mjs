/**
 * scripts/update-gsb-iletisim.mjs
 *
 * /tmp/scrape-gsb-il-mudurlukleri.json'dan Gençlik ve Spor İl Müdürlüğü
 * iletişim bilgilerini outreachContacts/genc-spor-{slug} doc'larına yazar.
 *
 * Phone field: GSB sayfalarında genelde "/" ile ayrılmış birden fazla
 * numara var. Phone1 ilk numara, phone2 ikinci numara.
 *
 * Idempotent: telefon/email/adres alanları varsa override eder
 * (kullanıcı manuel değiştirmiş olabilir — son scrape kazanır).
 *
 * Usage:
 *   cd /Users/macbookair/new-app
 *   GOOGLE_APPLICATION_CREDENTIALS=./.firebase-service-account.json \
 *     node scripts/update-gsb-iletisim.mjs
 */
import admin from 'firebase-admin';
import { readFileSync } from 'node:fs';

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

// Phone string'i "/" veya "-" ile bölüp ilk 2 numarayı al.
function splitPhones(raw) {
  if (!raw) return [null, null];
  const parts = raw.split(/[\/]/).map((s) => s.trim()).filter(Boolean);
  return [parts[0] || null, parts[1] || null];
}

async function main() {
  const json = JSON.parse(readFileSync('/tmp/scrape-gsb-il-mudurlukleri.json', 'utf8'));
  const items = json.items || [];
  console.log(`Loaded ${items.length} GSB iletisim records`);

  let updated = 0;
  let missing = 0;
  let noData = 0;
  const batch = db.batch();
  let pending = 0;

  for (const it of items) {
    if (!it.city) { noData += 1; continue; }
    const docId = `genc-spor-${slugify(it.city)}`;
    const ref = db.collection('outreachContacts').doc(docId);
    const snap = await ref.get();
    if (!snap.exists) {
      console.warn(`  ! missing seed doc: ${docId} (city=${it.city})`);
      missing += 1;
      continue;
    }
    const [phone1, phone2] = splitPhones(it.phone);
    const patch = {
      updatedAt: Date.now(),
    };
    if (phone1) patch.phone = phone1;
    if (phone2) patch.phone2 = phone2;
    if (it.email) patch.email = it.email;
    if (it.address) patch.address = it.address;
    if (it.website) patch.website = it.website;
    if (it.kep) patch.etebligat = it.kep;
    // Sadece anlamlı bir field varsa write
    if (Object.keys(patch).length <= 1) { noData += 1; continue; }
    batch.set(ref, patch, { merge: true });
    pending += 1;
    updated += 1;
    if (pending >= 400) {
      await batch.commit();
      pending = 0;
    }
  }
  if (pending > 0) await batch.commit();

  console.log('---');
  console.log(`Updated: ${updated}`);
  console.log(`Missing seed: ${missing}`);
  console.log(`No iletisim data: ${noData}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
