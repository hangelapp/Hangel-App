// Karşıyaka Sancar Maruflu STK Yerleşkesi — eventVenues seed/update (Admin SDK).
// Aynı isimde doc varsa GÜNCELLER. Salon fotoğrafları: Karşıyaka Belediyesi resmi
// CDN'inden (demoapi.karsiyaka.bel.tr) doğrulanmış tesis iç-mekan fotoğrafları —
// temsili (salon-özel foto herkese açık yok; ileride gerçek salon fotolarıyla
// değiştirilecek).
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { initializeApp, cert } = await import('firebase-admin/app');
const { getFirestore, FieldValue } = await import('firebase-admin/firestore');
const sa = JSON.parse(readFileSync(path.join(__dirname, '.firebase-service-account.json'), 'utf8'));
const app = initializeApp({ credential: cert(sa), projectId: sa.project_id });
const db = getFirestore(app);

const B = 'https://demoapi.karsiyaka.bel.tr/';
const P = {
  hallway: B + 'file-1650262563761-76.png',
  reception: B + 'file-1650262563761-93.png',
  waiting: B + 'file-1650262563762-71.png',
  corridor: B + 'file-1650262563758-78.png',
  corridor2: B + 'file-1650262563762-1.png',
  office: B + 'file-1650262563763-13.png',
};

const venue = {
  name: 'Karşıyaka Belediyesi Sancar Maruflu Sivil Toplum Yerleşkesi',
  type: 'Belediye · STK Yerleşkesi',
  city: 'İzmir',
  logo: 'https://www.google.com/s2/favicons?domain=karsiyaka.bel.tr&sz=128',
  address: 'Bahriye Üçok Mah. Doç. Dr. Bahriye Üçok Bul. No:5, 35580 Karşıyaka / İzmir (Bahçelievler Katlı Pazar Yeri, 1. kat)',
  hours: 'Haftanın 7 günü 10:00 – 22:00',
  iconName: 'landmark',
  reservationType: 'email',
  reservationEmail: 'karsiyaka.stk@karsiyaka.bel.tr',
  reservationLink: '',
  transport: {
    izban: 'İZBAN / Karşıyaka İskele istasyonu — ~7 dk yürüyüş (≈450 m)',
    busLines: ['121', '290', '330', '361', '532', '853'],
    note: 'Doç. Dr. Bahriye Üçok Bulvarı üzerindeki duraklar; Bahçelievler Katlı Pazar Yeri girişi.',
  },
  halls: [
    { id: 'konferans-1', name: '1 Nolu Konferans Salonu', type: 'Konferans Salonu', fee: 'Ücretsiz', capacity: 150, layout: 'Sinema (amfi) düzeni', description: 'Amfi/teatral oturma düzenine sahip 150 kişilik ana konferans salonu; kongre, panel, lansman ve büyük ölçekli sunumlar için idealdir. Sahne–kürsü alanı, anahtar teslim ses ve görüntü altyapısıyla profesyonel etkinlik deneyimi sunar.', features: ['Sinema (amfi) düzeni', 'Profesyonel ses sistemi', 'Projeksiyon altyapısı', 'Sahne & kürsü', 'Kablosuz mikrofon'], photos: [P.hallway, P.reception, P.waiting] },
    { id: 'konferans-2', name: '2 Nolu Konferans Salonu', type: 'Konferans Salonu', fee: 'Ücretsiz', capacity: 100, layout: 'Sinema (amfi) düzeni', description: '100 kişilik sinema düzenli konferans salonu; seminer, çalıştay ve orta ölçekli toplantılar için konforlu bir alan. Profesyonel ses sistemi ve projeksiyon altyapısı kurulu ve kullanıma hazırdır.', features: ['Sinema (amfi) düzeni', 'Profesyonel ses sistemi', 'Projeksiyon altyapısı', 'Kablosuz mikrofon'], photos: [P.reception, P.waiting, P.hallway] },
    { id: 'konferans-3', name: '3 Nolu Konferans Salonu', type: 'Konferans Salonu', fee: 'Ücretsiz', capacity: 60, layout: 'Düz zemin — esnek/modüler kurulum', description: '60 kişilik düz zeminli, modüler kuruluma uygun salon; eğitim, atölye ve sınıf veya U-masa düzeni gerektiren etkinlikler için esnek biçimde uyarlanabilir. Projeksiyon sistemi hazır durumdadır.', features: ['Düz zemin — esnek kurulum', 'Projeksiyon sistemi', 'Modüler masa & sandalye'], photos: [P.waiting, P.corridor2, P.reception] },
    { id: 'sergi-fuaye', name: 'Sergi ve Fuaye Alanı', type: 'Sergi / Fuaye', fee: 'Ücretsiz', capacity: 80, layout: 'Açık fuaye', description: 'Salonların girişinde konumlanan ferah sergi ve fuaye alanı; stant, poster sergisi, kayıt-karşılama (registration) ve kokteyl kurgusu için uygundur. Coffee-break ve networking molaları için doğal bir akış sağlar.', features: ['Stant / poster sergisi', 'Karşılama & kayıt alanı', 'Coffee-break / kokteyl düzeni'], photos: [P.reception, P.waiting, P.corridor] },
    { id: 'toplanti-a', name: 'Toplantı Salonu A', type: 'Toplantı Salonu', fee: 'Ücretsiz', capacity: 12, layout: 'Boardroom (U/oval masa)', description: '12 kişilik boardroom düzenli toplantı salonu; yönetim kurulu, jüri değerlendirmeleri ve küçük grup çalışmaları için. Sunum televizyonu (büyük ekran) bağlantıya hazırdır.', features: ['Boardroom düzeni', 'Sunum televizyonu (büyük ekran)', 'HDMI bağlantı'], photos: [P.office, P.reception, P.waiting] },
    { id: 'toplanti-b', name: 'Toplantı Salonu B', type: 'Toplantı Salonu', fee: 'Ücretsiz', capacity: 12, layout: 'Boardroom (U/oval masa)', description: '12 kişilik ikinci boardroom toplantı salonu; paralel oturumlar, mülakat ve çalışma grupları için uygundur. Sunum televizyonu (büyük ekran) kullanıma hazırdır.', features: ['Boardroom düzeni', 'Sunum televizyonu (büyük ekran)', 'HDMI bağlantı'], photos: [P.office, P.corridor, P.hallway] },
  ],
};

const snap = await db.collection('eventVenues').where('name', '==', venue.name).limit(1).get();
if (snap.empty) {
  const ref = await db.collection('eventVenues').add({ ...venue, createdBy: 'system-seed', createdAt: FieldValue.serverTimestamp() });
  console.log('ADDED →', ref.id);
} else {
  const id = snap.docs[0].id;
  await db.collection('eventVenues').doc(id).set({ ...venue, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  console.log('UPDATED →', id, '| halls:', venue.halls.length, '| photos/hall: 3');
}
process.exit(0);
