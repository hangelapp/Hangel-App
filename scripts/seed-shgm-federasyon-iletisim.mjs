/**
 * scripts/seed-shgm-federasyon-iletisim.mjs
 *
 * SHGM scrape v4 sonucundaki 63 federasyonun iletişim bilgilerini
 * outreachContacts'a yaz. Match key: federasyon adının normalize edilmiş
 * versiyonu, mevcut "federasyon-{slug}" id'leriyle eşleştirilir.
 *
 * Usage:
 *   cd /Users/macbookair/new-app
 *   GOOGLE_APPLICATION_CREDENTIALS=./.firebase-service-account.json \
 *     node scripts/seed-shgm-federasyon-iletisim.mjs
 */
import admin from 'firebase-admin';
import fs from 'node:fs';

admin.initializeApp({
  projectId: 'hangel-new-v18-87297865-9bcc3',
  credential: admin.credential.applicationDefault(),
});
const db = admin.firestore();

const SCRAPED = JSON.parse(fs.readFileSync('/tmp/shgm-federasyonlar-v4.json', 'utf8'));

function slugify(s) {
  return s.toLocaleLowerCase('tr')
    .replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i').replace(/ö/g, 'o')
    .replace(/ş/g, 's').replace(/ü/g, 'u').replace(/â/g, 'a')
    .replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

// SHGM ad normalize → mevcut federasyon Firestore doc id eşleştirme
// Bazı isimler farklı yazılmış (ör. "Wushu KungFu" vs "Wushu Kung Fu") — manuel alias map.
const NAME_ALIASES = {
  'Türkiye Wushu KungFu Federasyonu': 'Türkiye Wushu Kung Fu Federasyonu',
  'Türkiye Vücut Geliştirme Fitness Federasyonu': 'Türkiye Vücut Geliştirme Fitness ve Bilek Güreşi Federasyonu',
  'Türkiye ESpor Federasyonu': 'Türkiye E-Spor Federasyonu',
  'Türkiye Ragbi Federasyonu': 'Türkiye Beyzbol Softbol Korumalı Futbol ve Ragbi Federasyonu',
  'Türkiye Bocce Bowling Dart Federasyonu': 'Türkiye Bocce Bowling ve Dart Federasyonu',
  'Türkiye Atıcılık Federasyonu': 'Türkiye Atıcılık ve Avcılık Federasyonu',
};

function cleanPhone(s) {
  if (!s) return null;
  return s.replace(/[\s-()]/g, '').replace(/^0/, '+90');
}

function cleanWebsite(s) {
  if (!s) return null;
  let w = s.trim();
  if (!w.startsWith('http')) w = 'https://' + w;
  return w.replace(/\.+$/, '');
}

async function main() {
  console.log(`${SCRAPED.length} federasyon güncellenecek...\n`);

  let updated = 0;
  let notFound = 0;
  const notFoundList = [];
  let batch = db.batch();
  let batchCount = 0;

  for (const f of SCRAPED) {
    if (!f.phone && !f.email && !f.address && !f.website) continue;

    // Match: SHGM ad → mevcut Firestore ad (alias map veya direkt)
    const targetName = NAME_ALIASES[f.name] || f.name;
    const docId = `federasyon-${slugify(targetName)}`.slice(0, 80);
    const ref = db.collection('outreachContacts').doc(docId);
    const existing = await ref.get();

    if (!existing.exists) {
      // Daha esnek bir lookup dene — name içindeki ana kelime ile match
      const altSnap = await db.collection('outreachContacts')
        .where('type', '==', 'Federasyon')
        .where('name', '==', targetName).limit(1).get();
      if (altSnap.empty) {
        notFound++;
        notFoundList.push(`${f.id} | ${f.name} (id=${docId})`);
        continue;
      }
      const altRef = altSnap.docs[0].ref;
      batch.set(altRef, {
        phone: cleanPhone(f.phone),
        email: f.email || null,
        address: f.address || null,
        website: cleanWebsite(f.website),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        shgmId: f.id,
      }, { merge: true });
      updated++;
    } else {
      batch.set(ref, {
        phone: cleanPhone(f.phone),
        email: f.email || null,
        address: f.address || null,
        website: cleanWebsite(f.website),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        shgmId: f.id,
      }, { merge: true });
      updated++;
    }
    batchCount++;
    if (batchCount >= 450) {
      await batch.commit();
      batch = db.batch();
      batchCount = 0;
    }
  }
  if (batchCount > 0) await batch.commit();

  console.log(`\n✅ ${updated} federasyon güncellendi`);
  if (notFound > 0) {
    console.log(`⚠️  ${notFound} eşleşmedi (Firestore'da yok):`);
    notFoundList.forEach(l => console.log('   - ' + l));
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
