/**
 * /tmp/scrape-gsb-ilce-mudurlukleri.json çıktısını Firestore'a yazar.
 *
 * Collection: outreachContacts
 * Doc ID: genc-spor-ilce-{il-slug}-{ilce-slug}
 *
 * Fields (her ilçe için):
 *   name, shortName, type='GencSporIlceMudurlugu',
 *   city (il adı), district (ilçe adı), website,
 *   phone, phone2, email, address, fax,
 *   mudur (müdür adı — varsa),
 *   parentDocId (genc-spor-{il-slug}),
 *   source, scrapedAt
 *
 * Idempotent: aynı doc varsa merge ile günceller.
 *
 * Usage:
 *   cd /Users/apple/new-app
 *   GOOGLE_APPLICATION_CREDENTIALS=./.firebase-service-account.json \
 *     node scripts/update-gsb-ilce-iletisim.mjs
 */
import admin from 'firebase-admin';
import { readFileSync } from 'node:fs';

admin.initializeApp({
  projectId: 'hangel-new-v18-87297865-9bcc3',
  credential: admin.credential.applicationDefault(),
});
const db = admin.firestore();

function slugify(s) {
  return String(s).toLocaleLowerCase('tr')
    .replace(/ç/g,'c').replace(/ğ/g,'g').replace(/ı/g,'i').replace(/ö/g,'o').replace(/ş/g,'s').replace(/ü/g,'u')
    .replace(/[^a-z0-9]+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'');
}

function splitPhones(raw) {
  if (!raw) return [null, null];
  const parts = String(raw).split(/[\/]/).map((s) => s.trim()).filter(Boolean);
  return [parts[0] || null, parts[1] || null];
}

async function main() {
  const json = JSON.parse(readFileSync('/tmp/scrape-gsb-ilce-mudurlukleri.json', 'utf8'));
  const provinces = json.provinces || [];
  console.log(`${provinces.length} il'de ${json.totalIlce} ilçe Firestore'a yazılıyor...\n`);

  let written = 0;
  let skipped = 0;
  let errors = 0;
  let batch = db.batch();
  let pending = 0;

  for (const prov of provinces) {
    if (!prov.items || prov.items.length === 0) {
      skipped++;
      continue;
    }
    const ilSlug = slugify(prov.il);

    for (const item of prov.items) {
      if (!item.ilce) { errors++; continue; }
      const ilceSlug = slugify(item.ilce);
      const docId = `genc-spor-ilce-${ilSlug}-${ilceSlug}`;
      const ref = db.collection('outreachContacts').doc(docId);

      const [phone1, phone2] = splitPhones(item.phone);
      const data = {
        name: `${item.ilce} Gençlik ve Spor İlçe Müdürlüğü`,
        shortName: `${item.ilce} GSİM`,
        type: 'GencSporIlceMudurlugu',
        city: prov.il,
        district: item.ilce,
        website: `https://${prov.slug}.gsb.gov.tr`,
        parentDocId: `genc-spor-${ilSlug}`,
        source: 'gsb-scrape',
        updatedAt: Date.now(),
      };
      if (item.mudur) data.contactPerson = item.mudur;
      if (phone1) data.phone = phone1;
      if (phone2) data.phone2 = phone2;
      if (item.email) data.email = item.email;
      else if (item.emailGuess) data.emailGuess = item.emailGuess; // separate field — guessed, not verified
      if (item.address) data.address = item.address;
      if (item.fax) data.fax = item.fax;

      batch.set(ref, data, { merge: true });
      pending++;
      written++;
      if (pending >= 400) {
        await batch.commit();
        batch = db.batch();
        pending = 0;
      }
    }
  }
  if (pending > 0) await batch.commit();

  console.log(`\n✓ ${written} ilçe yazıldı`);
  console.log(`  ${skipped} il atlandı (ilçe verisi yok)`);
  console.log(`  ${errors} ilçe hatalı (ad yok)`);
}

main().catch((e) => { console.error(e); process.exit(1); });
