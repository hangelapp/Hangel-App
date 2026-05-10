#!/usr/bin/env node

/**
 * Gerçek STK verilerini Firestore 'ngos' collection'ına ekler.
 * Kullanım: node scripts/add-real-ngos.js
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const serviceAccountPath = path.join(__dirname, '../.firebase-service-account.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error('Hata: Firebase service account dosyası bulunamadı:', serviceAccountPath);
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const determineType = (name) => {
  if (name.toLowerCase().includes('vakf')) return 'Vakıf';
  return 'Dernek';
};

const ngos = [
  { name: 'Hatay Kadın Girişimciler Derneği', category: 'Kadın Hakları' },
  { name: 'Ökmen Vakfı', category: 'Sosyal Yardım' },
  { name: 'Manavgat Turizm Otelciler ve İşletmeciler Derneği', category: 'Turizm' },
  { name: 'Gökyüzü Sanatsal İyilik Vakfı', category: 'Kültür & Sanat' },
  { name: 'Çocuk Hakları Gönüllüleri Derneği', category: 'Çocuk Hakları' },
  { name: 'Mersin Güçbirliği Kalkınma ve Gelecek Derneği', category: 'Kalkınma' },
  { name: 'İzmir Karşıyaka Lisesi Eğitim Vakfı', category: 'Eğitim' },
  { name: 'Mektup Arkadaşlarım Derneği', category: 'Sosyal Dayanışma' },
  { name: 'Ortopedik Özürlüler Dayanışma Derneği', category: 'Engelli Hakları' },
  { name: 'Patent Hareketi Derneği', category: 'Hukuk & Savunuculuk' },
  { name: 'Dünyayı Güzellik Kurtaracak Derneği', category: 'Sosyal Sorumluluk' },
  { name: 'Uluslararası Anne Evi Derneği', category: 'Aile & Çocuk' },
  { name: 'Sosyal Akıl Derneği', category: 'Sosyal Girişim' },
  { name: 'Genç Düşünce Enstitüsü Derneği', category: 'Gençlik' },
  { name: 'Fatsalılar Kültür ve Yardımlaşma Derneği', category: 'Kültür & Dayanışma' },
  { name: 'Ankara Sağlık ve Eğitim Gönüllüleri Derneği', category: 'Sağlık & Eğitim' },
  { name: 'Tüvana Okuma İstekli Çocuk Eğitim Vakfı', category: 'Eğitim' },
  { name: 'Sağlık Hakkı Derneği', category: 'Sağlık' },
  { name: 'Gülmek İyileştirir Derneği', category: 'Sağlık & Terapi' },
  { name: 'TİDER - Temel İhtiyaç Derneği', category: 'Yoksullukla Mücadele' },
  { name: 'Tohumluk Sosyal Yardımlaşma, Eğitim, Kültür ve Sanat Vakfı', category: 'Kültür & Eğitim' },
  { name: 'Patipark Hayvanseverler Derneği', category: 'Hayvan Hakları' },
  { name: 'Social Business Global', category: 'Sosyal Girişim' },
  { name: 'Yeşil Türkiye', category: 'Çevre' },
  { name: 'Acil İhtiyaç Projesi Vakfı', category: 'İnsani Yardım' },
  { name: 'KAÇOD - Kanser Çocuğumdan Uzak Dur Derneği', category: 'Sağlık' },
  { name: 'Serebral Palsili Çocuklar Derneği', category: 'Engelli Hakları' },
];

const emptyStats = {
  followers: 0,
  donors: 0,
  volunteers: 0,
  volunteerHours: 0,
  projects: 0,
  totalDonation: 0,
  donationCount: 0,
  avgDonation: 0,
  highestSingleDonation: 0,
  peopleReached: 0,
};

async function addNgos() {
  console.log(`\n${ngos.length} STK ekleniyor...\n`);
  const batch = db.batch();

  for (const ngo of ngos) {
    const ref = db.collection('ngos').doc();
    const type = determineType(ngo.name);
    batch.set(ref, {
      name: ngo.name,
      shortName: '',
      category: ngo.category,
      type,
      avatarUrl: '',
      coverPhotoUrl: '',
      stats: emptyStats,
      transparencyScore: 0,
      about: '',
      joinDate: new Date().toLocaleDateString('tr-TR'),
      supportedSDGs: [],
      beneficiaryGroups: [],
      memberOf: [],
      contact: { email: '', website: '', social: {} },
      donationByCategory: [],
      status: 'Aktif',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`  ✓ ${ngo.name} (${type})`);
  }

  await batch.commit();
  console.log(`\nTamamlandı! ${ngos.length} STK başarıyla eklendi.`);
}

addNgos().catch(console.error);
