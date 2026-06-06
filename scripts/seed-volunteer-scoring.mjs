/**
 * scripts/seed-volunteer-scoring.mjs
 *
 * Firestore /volunteerScoring koleksiyonunu sıfırdan seed eder
 * — mevcut iş kalemlerini siler, page.tsx SEED_DATA ile yeniden yazar.
 *
 * Usage:
 *   cd /Users/macbookair/new-app
 *   GOOGLE_APPLICATION_CREDENTIALS=./.firebase-service-account.json node scripts/seed-volunteer-scoring.mjs
 */
import admin from 'firebase-admin';

const PROJECT_ID = 'hangel-new-v18-87297865-9bcc3';

admin.initializeApp({
  projectId: PROJECT_ID,
  credential: admin.credential.applicationDefault(),
});

const db = admin.firestore();

// page.tsx SEED_DATA — birebir kopya (id yok, autoId atanacak).
const SEED_DATA = [
  // ── Eğitim & Mentorluk ─────────────────────────────────────────────────
  { taskType: 'Öğretmenlik / Eğitim Verme', pointsPerHour: 100, manHourCost: 200, isActive: true, order: 1, description: 'Çocuklara/yetişkinlere ders, atölye, kurs verme.' },
  { taskType: 'Akademik Ders Desteği (LGS/YKS/KPSS)', pointsPerHour: 110, manHourCost: 220, isActive: true, order: 2, description: 'Sınav hazırlık dersleri ve bireysel destek.' },
  { taskType: 'Yabancı Dil Eğitimi', pointsPerHour: 90, manHourCost: 180, isActive: true, order: 3, description: 'İngilizce/Almanca/Arapça vb. dil dersleri.' },
  { taskType: 'Okuma-Yazma Öğretimi', pointsPerHour: 90, manHourCost: 150, isActive: true, order: 4, description: 'Yetişkin okuryazarlık ve göçmen okuryazarlık desteği.' },
  { taskType: 'Mentorluk / Koçluk', pointsPerHour: 80, manHourCost: 200, isActive: true, order: 5, description: 'Genç/girişimci mentorluğu, kariyer koçluğu.' },
  { taskType: 'Atölye / Workshop Yürütücülüğü', pointsPerHour: 70, manHourCost: 150, isActive: true, order: 6, description: 'Sanat, kodlama, müzik, drama atölyeleri.' },
  { taskType: 'Sahne Sanatları Eğitimi', pointsPerHour: 60, manHourCost: 130, isActive: true, order: 7, description: 'Drama, müzik, dans eğitimi.' },

  // ── Sağlık & Psikososyal Destek ────────────────────────────────────────
  { taskType: 'Sağlık Desteği / Saha Hemşireliği', pointsPerHour: 90, manHourCost: 220, isActive: true, order: 10, description: 'Sağlık taramaları, ilk yardım, hemşirelik desteği.' },
  { taskType: 'Doktor Konsültasyonu (Pro-bono)', pointsPerHour: 130, manHourCost: 600, isActive: true, order: 11, description: 'Mülteci, evsiz, kırsal bölge için ücretsiz doktor desteği.' },
  { taskType: 'Diş Hekimi Tarama (Pro-bono)', pointsPerHour: 120, manHourCost: 500, isActive: true, order: 12, description: 'Pro-bono diş sağlığı tarama ve tedavi.' },
  { taskType: 'Psikolojik Destek / Görüşme', pointsPerHour: 100, manHourCost: 320, isActive: true, order: 13, description: 'Travma sonrası, kriz, aile danışmanlığı.' },
  { taskType: 'Psikososyal Destek (Çocuk/Genç)', pointsPerHour: 90, manHourCost: 200, isActive: true, order: 14, description: 'Yetiştirme yurdu, hastane, sığınma evi çocuk-genç programları.' },
  { taskType: 'Bağımlılıkla Mücadele Desteği', pointsPerHour: 80, manHourCost: 180, isActive: true, order: 15, description: 'Madde, alkol, kumar bağımlılığında rehberlik ve destek.' },
  { taskType: 'Beslenme Danışmanlığı', pointsPerHour: 70, manHourCost: 220, isActive: true, order: 16, description: 'Diyetisyen pro-bono danışmanlık.' },
  { taskType: 'Fizyoterapi / Rehabilitasyon Desteği', pointsPerHour: 90, manHourCost: 280, isActive: true, order: 17, description: 'Engelli, yaşlı, post-trauma rehabilitasyon.' },

  // ── Uzman Danışmanlık ─────────────────────────────────────────────────
  { taskType: 'Genel Mesleki Danışmanlık', pointsPerHour: 80, manHourCost: 250, isActive: true, order: 20, description: 'STK proje, iş geliştirme, strateji.' },
  { taskType: 'Hukuki Destek (Pro-bono)', pointsPerHour: 110, manHourCost: 400, isActive: true, order: 21, description: 'Pro-bono hukuki danışmanlık ve süreç yönetimi.' },
  { taskType: 'Mali Müşavirlik / Muhasebe', pointsPerHour: 90, manHourCost: 300, isActive: true, order: 22, description: 'STK muhasebe, vergi, denetim desteği.' },
  { taskType: 'İK / Personel Danışmanlığı', pointsPerHour: 70, manHourCost: 220, isActive: true, order: 23, description: 'İşe alım, performans, organizasyon yapısı.' },
  { taskType: 'Strateji ve Yönetim Danışmanlığı', pointsPerHour: 90, manHourCost: 350, isActive: true, order: 24, description: 'STK iş planı, kurumsal kapasite gelişimi.' },
  { taskType: 'Fon Geliştirme / Fundraising', pointsPerHour: 90, manHourCost: 280, isActive: true, order: 25, description: 'Hibe yazımı, bağışçı ilişkileri, kampanya.' },

  // ── Dijital & Yaratıcı ───────────────────────────────────────────────
  { taskType: 'Web / Yazılım Geliştirme', pointsPerHour: 100, manHourCost: 350, isActive: true, order: 30, description: 'STK web sitesi, dijital araç ve sistem geliştirme.' },
  { taskType: 'Mobil Uygulama Geliştirme', pointsPerHour: 110, manHourCost: 380, isActive: true, order: 31, description: 'iOS/Android STK uygulamaları.' },
  { taskType: 'UX / UI Tasarım', pointsPerHour: 90, manHourCost: 280, isActive: true, order: 32, description: 'Kullanıcı arayüzü ve deneyim tasarımı.' },
  { taskType: 'Grafik Tasarım / Görsel İletişim', pointsPerHour: 70, manHourCost: 180, isActive: true, order: 33, description: 'Logo, afiş, broşür, sosyal medya görselleri.' },
  { taskType: 'Video Prodüksiyon / Editing', pointsPerHour: 80, manHourCost: 220, isActive: true, order: 34, description: 'Tanıtım filmi, sosyal medya videosu, belgesel.' },
  { taskType: 'Fotoğrafçılık', pointsPerHour: 70, manHourCost: 180, isActive: true, order: 35, description: 'Etkinlik, portre, kampanya fotoğrafları.' },
  { taskType: 'Veri Bilimi / Analiz', pointsPerHour: 100, manHourCost: 350, isActive: true, order: 36, description: 'STK için veri görselleştirme, ML modeli, dashboard.' },
  { taskType: 'Siber Güvenlik Denetimi', pointsPerHour: 120, manHourCost: 450, isActive: true, order: 37, description: 'STK altyapı güvenlik analizi.' },
  { taskType: 'IT Destek / Sistem Yönetimi', pointsPerHour: 70, manHourCost: 200, isActive: true, order: 38, description: 'Bilgisayar bakım, ağ kurulumu, kullanıcı desteği.' },

  // ── İletişim & Medya ─────────────────────────────────────────────────
  { taskType: 'Sosyal Medya / Topluluk Yönetimi', pointsPerHour: 50, manHourCost: 120, isActive: true, order: 40, description: 'İçerik üretimi, hesap yönetimi, paylaşım planlama.' },
  { taskType: 'İçerik Üreticiliği / Yazı', pointsPerHour: 60, manHourCost: 150, isActive: true, order: 41, description: 'Blog, basın bülteni, e-bülten yazımı.' },
  { taskType: 'Halkla İlişkiler / Basın', pointsPerHour: 80, manHourCost: 220, isActive: true, order: 42, description: 'Basın bülteni, gazeteci ilişkileri, kampanya iletişimi.' },
  { taskType: 'Tercümanlık (Yazılı)', pointsPerHour: 70, manHourCost: 180, isActive: true, order: 43, description: 'Yazılı çeviri — rapor, sözleşme, web içeriği.' },
  { taskType: 'Tercümanlık (Sözlü / Eşzamanlı)', pointsPerHour: 90, manHourCost: 280, isActive: true, order: 44, description: 'Toplantı, konferans, mülteci hizmetlerinde sözlü çeviri.' },
  { taskType: 'Podcast / Radyo Prodüksiyon', pointsPerHour: 70, manHourCost: 200, isActive: true, order: 45, description: 'STK temalı podcast, radyo programı hazırlama.' },

  // ── Saha & Operasyon ────────────────────────────────────────────────
  { taskType: 'Etkinlik Organizasyonu', pointsPerHour: 50, manHourCost: 130, isActive: true, order: 50, description: 'Etkinlik koordinasyonu, lojistik, saha düzeni.' },
  { taskType: 'Fuar / Stant Görevi', pointsPerHour: 40, manHourCost: 100, isActive: true, order: 51, description: 'STK tanıtım stantında görevlilik.' },
  { taskType: 'Kayıt / Karşılama / Misafir Yönlendirme', pointsPerHour: 35, manHourCost: 80, isActive: true, order: 52, description: 'Etkinliklerde kayıt masası, karşılama, yönlendirme.' },
  { taskType: 'Saha Koordinasyonu', pointsPerHour: 60, manHourCost: 150, isActive: true, order: 53, description: 'Saha ekibi sevk-yönetim, lojistik koordinasyon.' },
  { taskType: 'Yardım Dağıtımı', pointsPerHour: 30, manHourCost: 80, isActive: true, order: 54, description: 'Gıda, giysi, kit dağıtımı saha çalışması.' },
  { taskType: 'Saha Görevlisi (Genel)', pointsPerHour: 30, manHourCost: 80, isActive: true, order: 55, description: 'Genel saha desteği, görev rotasyonu.' },
  { taskType: 'Ulaşım / Şoförlük', pointsPerHour: 40, manHourCost: 110, isActive: true, order: 56, description: 'Yardım malzemesi/gönüllü taşıma.' },

  // ── Afet & Acil Durum ───────────────────────────────────────────────
  { taskType: 'Anlık Müdahale (Afet)', pointsPerHour: 120, manHourCost: 280, isActive: true, order: 60, description: 'Afet bölgesinde acil müdahale, arama-kurtarma desteği.' },
  { taskType: 'Arama-Kurtarma (Eğitimli)', pointsPerHour: 130, manHourCost: 350, isActive: true, order: 61, description: 'AKUT, AFAD eğitimli arama-kurtarma.' },
  { taskType: 'Acil Sağlık Desteği', pointsPerHour: 110, manHourCost: 250, isActive: true, order: 62, description: 'Paramedik, ilk yardım eğitimli müdahale.' },
  { taskType: 'Lojistik Depo Yönetimi (Acil)', pointsPerHour: 60, manHourCost: 130, isActive: true, order: 63, description: 'Afet bölgesi depo ve lojistik koordinasyon.' },

  // ── Bakım & Refakat ─────────────────────────────────────────────────
  { taskType: 'Yaşlı Bakım & Refakat', pointsPerHour: 50, manHourCost: 110, isActive: true, order: 70, description: 'Refakat, sosyal aktivite, evde destek.' },
  { taskType: 'Çocuk Bakımı / Refakat', pointsPerHour: 55, manHourCost: 110, isActive: true, order: 71, description: 'Çocuk refakatı, hastane, etkinlik desteği.' },
  { taskType: 'Engelli Bakım & Refakat', pointsPerHour: 60, manHourCost: 130, isActive: true, order: 72, description: 'Engelli birey eşliği, sosyalleşme, gezi.' },
  { taskType: 'Hayvan Bakımı (Barınak)', pointsPerHour: 40, manHourCost: 90, isActive: true, order: 73, description: 'Sokak/barınak hayvanlarına bakım, mama dağıtımı.' },
  { taskType: 'Sokak Hayvanı Beslenme/Tedavi', pointsPerHour: 45, manHourCost: 100, isActive: true, order: 74, description: 'Mama dağıtımı, basit yara müdahalesi, kısırlaştırma takibi.' },

  // ── Çevre & Sürdürülebilirlik ───────────────────────────────────────
  { taskType: 'Doğa / Çevre Çalışması', pointsPerHour: 40, manHourCost: 80, isActive: true, order: 80, description: 'Ağaçlandırma, sahil temizliği, biyoçeşitlilik.' },
  { taskType: 'Ağaçlandırma & Fidan Dikimi', pointsPerHour: 50, manHourCost: 100, isActive: true, order: 81, description: 'Toplu fidan dikim etkinlikleri.' },
  { taskType: 'Geri Dönüşüm / Atık Toplama', pointsPerHour: 35, manHourCost: 70, isActive: true, order: 82, description: 'Şehir, sahil, doğa alanı temizlik kampanyaları.' },
  { taskType: 'Biyoçeşitlilik İzleme', pointsPerHour: 60, manHourCost: 140, isActive: true, order: 83, description: 'Sayım, gözlem, raporlama (kuşlar, denizler, vd.).' },

  // ── Fiziksel İş & Tadilat ──────────────────────────────────────────
  { taskType: 'Boyama / Tadilat', pointsPerHour: 50, manHourCost: 110, isActive: true, order: 90, description: 'Okul, barınak vb. mekan boyama, küçük tadilat.' },
  { taskType: 'Marangoz / Mobilya Onarımı', pointsPerHour: 60, manHourCost: 150, isActive: true, order: 91, description: 'Okul/yurt mobilya onarım, basit ahşap işleri.' },
  { taskType: 'Elektrik / Tesisat Onarımı', pointsPerHour: 70, manHourCost: 170, isActive: true, order: 92, description: 'Basit elektrik tesisat, su tesisat onarımı.' },
  { taskType: 'Bahçıvanlık / Peyzaj', pointsPerHour: 40, manHourCost: 90, isActive: true, order: 93, description: 'Okul, hastane, park bakım.' },
  { taskType: 'Temizlik', pointsPerHour: 30, manHourCost: 70, isActive: true, order: 94, description: 'Mekan temizliği veya çevre temizliği.' },
  { taskType: 'İnşaat Saha Yardımı', pointsPerHour: 45, manHourCost: 110, isActive: true, order: 95, description: 'Habitat for Humanity tipi ev yapım yardımı.' },

  // ── Spor & Sağlıklı Yaşam ──────────────────────────────────────────
  { taskType: 'Spor Eğitmenliği / Antrenörlük', pointsPerHour: 60, manHourCost: 150, isActive: true, order: 100, description: 'Çocuk-genç-engelli spor antrenmanları.' },
  { taskType: 'Yoga / Pilates / Hareket Eğitimi', pointsPerHour: 60, manHourCost: 160, isActive: true, order: 101, description: 'Yetiştirme yurdu, kadın sığınma evi gibi yerlerde.' },

  // ── Veri & Arşiv ──────────────────────────────────────────────────
  { taskType: 'Veri Girişi / Arşivleme', pointsPerHour: 25, manHourCost: 60, isActive: true, order: 110, description: 'Form girişi, veri tabanı düzenleme, arşivleme.' },
  { taskType: 'Anket Saha Görevlisi', pointsPerHour: 30, manHourCost: 80, isActive: true, order: 111, description: 'Saha anketi, veri toplama.' },
  { taskType: 'Araştırma / Literatür Tarama', pointsPerHour: 60, manHourCost: 150, isActive: true, order: 112, description: 'STK projesi için akademik araştırma desteği.' },
  { taskType: 'Çağrı Merkezi Desteği', pointsPerHour: 35, manHourCost: 80, isActive: true, order: 113, description: 'Yardım hattı, bilgilendirme hattı görevlisi.' },

  // ── Mutfak & İkram ──────────────────────────────────────────────
  { taskType: 'Aşçılık / Mutfak Yardımı', pointsPerHour: 45, manHourCost: 110, isActive: true, order: 120, description: 'Aşevi, hayır mutfağı yemek hazırlığı.' },
  { taskType: 'Gıda Bankası Sıralama', pointsPerHour: 30, manHourCost: 70, isActive: true, order: 121, description: 'Gıda bankasında toplama, sıralama, paketleme.' },
];

async function main() {
  console.log(`Project: ${PROJECT_ID}`);
  console.log(`SEED_DATA: ${SEED_DATA.length} kalem`);

  // 1. Mevcut iş kalemlerini sayfanın gösterdiği format'taki dokümanlardan ayıkla.
  //    NOT: /volunteerScoring/professions ÖZEL doc'tur — silinmemeli (override map).
  console.log('\n1️⃣  Mevcut kalemler okunuyor...');
  const snap = await db.collection('volunteerScoring').get();
  const taskDocs = snap.docs.filter((d) => d.id !== 'professions' && d.data().taskType);
  console.log(`   → ${taskDocs.length} iş kalemi var (professions doc atlandı)`);

  // 2. Sil
  console.log('\n2️⃣  Eski kalemler siliniyor...');
  const batchDel = db.batch();
  taskDocs.forEach((d) => batchDel.delete(d.ref));
  if (taskDocs.length > 0) {
    await batchDel.commit();
    console.log(`   → ${taskDocs.length} doc silindi`);
  } else {
    console.log('   → silinecek kalem yok');
  }

  // 3. Yeni seed yaz
  console.log('\n3️⃣  Yeni 70 kalem yazılıyor...');
  const now = admin.firestore.FieldValue.serverTimestamp();
  let written = 0;
  // Firestore batch limiti 500, biz 70 doc için tek batch yeterli
  const batchAdd = db.batch();
  for (const item of SEED_DATA) {
    const ref = db.collection('volunteerScoring').doc();
    batchAdd.set(ref, {
      ...item,
      createdAt: now,
      updatedAt: now,
    });
    written++;
  }
  await batchAdd.commit();
  console.log(`   → ${written} kalem yazıldı`);

  // 4. Doğrulama
  console.log('\n4️⃣  Doğrulama...');
  const verify = await db.collection('volunteerScoring').get();
  const verifyTasks = verify.docs.filter((d) => d.id !== 'professions' && d.data().taskType);
  console.log(`   → Firestore'da şimdi ${verifyTasks.length} iş kalemi var`);

  console.log('\n✅ Bitti.');
}

main().catch((e) => { console.error(e); process.exit(1); });
