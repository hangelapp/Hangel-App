/**
 * Faz 4 nufusu.com çıktısını Firestore'a yaz (idempotent merge).
 * 44 boş il için boş GSB iletişim şablonu — sadece ilçe adı + il bağlantısı.
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

async function main() {
  const json = JSON.parse(readFileSync('/tmp/scrape-nufusu-ilceler.json', 'utf8'));
  console.log(`${json.provinces.length} il'de ${json.total} ilçe Firestore'a yazılıyor (nufusu source)...\n`);

  let written = 0;
  let batch = db.batch();
  let pending = 0;

  for (const prov of json.provinces) {
    if (!prov.ilceler || prov.ilceler.length === 0) continue;
    const ilSlug = slugify(prov.il);

    for (const ilce of prov.ilceler) {
      const ilceSlug = slugify(ilce.name);
      const docId = `genc-spor-ilce-${ilSlug}-${ilceSlug}`;
      const ref = db.collection('outreachContacts').doc(docId);

      const data = {
        name: `${ilce.name} Gençlik ve Spor İlçe Müdürlüğü`,
        shortName: `${ilce.name} GSİM`,
        type: 'GencSporIlceMudurlugu',
        city: prov.il,
        district: ilce.name,
        website: `https://${prov.slug}.gsb.gov.tr`,
        parentDocId: `genc-spor-${ilSlug}`,
        source: 'nufusu-com-faz4',
        emailGuess: `${ilceSlug}.im@gsb.gov.tr`,
        updatedAt: Date.now(),
      };

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

  console.log(`\n✓ ${written} ilçe yazıldı (Faz 4 — nufusu kaynaklı)`);
  console.log(`  Iletişim bilgisi yok — kullanıcı tek tek doldurabilir veya GSB sayfaları yayına alınınca Faz 5 ile çekilebilir.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
