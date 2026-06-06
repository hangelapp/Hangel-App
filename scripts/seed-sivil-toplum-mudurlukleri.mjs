/**
 * scripts/seed-sivil-toplum-mudurlukleri.mjs
 *
 * Türkiye'nin 81 ilindeki "İl Sivil Toplum Müdürlüğü"nü outreachContacts'a yaz.
 * Adres + telefon + email alanları boş — kullanıcı sayfa detayında doldurur.
 * Idempotent: aynı id (sivil-toplum-{il-slug}) ile mevcutsa atlar.
 *
 * Usage:
 *   cd /Users/macbookair/new-app
 *   GOOGLE_APPLICATION_CREDENTIALS=./.firebase-service-account.json \
 *     node scripts/seed-sivil-toplum-mudurlukleri.mjs
 */
import admin from 'firebase-admin';

admin.initializeApp({
  projectId: 'hangel-new-v18-87297865-9bcc3',
  credential: admin.credential.applicationDefault(),
});
const db = admin.firestore();

const ILLER = [
  'Adana', 'Adıyaman', 'Afyonkarahisar', 'Ağrı', 'Aksaray', 'Amasya', 'Ankara', 'Antalya',
  'Ardahan', 'Artvin', 'Aydın', 'Balıkesir', 'Bartın', 'Batman', 'Bayburt', 'Bilecik',
  'Bingöl', 'Bitlis', 'Bolu', 'Burdur', 'Bursa', 'Çanakkale', 'Çankırı', 'Çorum',
  'Denizli', 'Diyarbakır', 'Düzce', 'Edirne', 'Elazığ', 'Erzincan', 'Erzurum', 'Eskişehir',
  'Gaziantep', 'Giresun', 'Gümüşhane', 'Hakkari', 'Hatay', 'Iğdır', 'Isparta', 'İstanbul',
  'İzmir', 'Kahramanmaraş', 'Karabük', 'Karaman', 'Kars', 'Kastamonu', 'Kayseri', 'Kilis',
  'Kırıkkale', 'Kırklareli', 'Kırşehir', 'Kocaeli', 'Konya', 'Kütahya', 'Malatya', 'Manisa',
  'Mardin', 'Mersin', 'Muğla', 'Muş', 'Nevşehir', 'Niğde', 'Ordu', 'Osmaniye',
  'Rize', 'Sakarya', 'Samsun', 'Şanlıurfa', 'Siirt', 'Sinop', 'Sivas', 'Şırnak',
  'Tekirdağ', 'Tokat', 'Trabzon', 'Tunceli', 'Uşak', 'Van', 'Yalova', 'Yozgat',
  'Zonguldak',
];

function slugify(s) {
  return s.toLocaleLowerCase('tr')
    .replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i').replace(/ö/g, 'o')
    .replace(/ş/g, 's').replace(/ü/g, 'u')
    .replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

async function main() {
  console.log(`81 il sivil toplum müdürlüğü Firestore'a yazılıyor...\n`);

  let written = 0;
  let skipped = 0;
  const batch = db.batch();

  for (const il of ILLER) {
    const docId = `sivil-toplum-${slugify(il)}`;
    const ref = db.collection('outreachContacts').doc(docId);
    const existing = await ref.get();
    if (existing.exists) {
      skipped++;
      continue;
    }
    batch.set(ref, {
      name: `${il} Valiliği İl Sivil Toplum İl Müdürlüğü`,
      shortName: `${il} STK İl Müdürlüğü`,
      type: 'SivilToplumMüdürlüğü',
      city: il,
      district: null,
      neighborhood: null,
      phone: null,
      phone2: null,
      email: null,
      etebligat: null,
      website: 'https://www.siviltoplum.gov.tr',
      address: null,
      status: 'active',
      source: 'seed',
      faaliyetAlani: 'Dernekler ve Sivil Toplum Kuruluşları Mevzuatı',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    written++;
  }
  if (written > 0) await batch.commit();
  console.log(`✅ ${written} yeni kayıt, ⏭ ${skipped} mevcut atlandı`);

  const total = await db.collection('outreachContacts')
    .where('type', '==', 'SivilToplumMüdürlüğü').count().get();
  console.log(`\nFirestore'da toplam ${total.data().count} Sivil Toplum Müdürlüğü kaydı`);
}

main().catch((e) => { console.error(e); process.exit(1); });
