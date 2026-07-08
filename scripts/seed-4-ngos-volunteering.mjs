/**
 * 4 STK için 5'er gönüllülük ilanı (toplam 20) seed'ler.
 * status: 'Aktif' → /volunteering'de hemen görünür. Panel (/ngo-admin/volunteering)
 * üzerinden düzenlenebilir/pasife alınabilir.
 *
 * Idempotent: aynı (ngoId + title) varsa YENİDEN eklemez (tekrar çalıştırma güvenli).
 *
 * Çalıştır: node scripts/seed-4-ngos-volunteering.mjs
 */
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

const sa = JSON.parse(readFileSync(new URL('../.firebase-service-account.json', import.meta.url)));
initializeApp({ credential: cert(sa) });
const db = getFirestore();

const NGOS = {
  yesil: { id: 'yesil-turkiye-dernegi', name: 'Yeşil Türkiye Derneği', city: 'İstanbul', score: 90 },
  mersin: { id: 'mersin-gucbirligi-kalkinma-ve-gelecek-dernegi', name: 'Mersin Güçbirliği Kalkınma ve Gelecek Derneği', city: 'Mersin', score: 88 },
  oyunda: { id: 'hFobQV0eRYycgNlqC9Z7', name: 'OYUNDA KAL DERNEĞİ', city: 'Ankara', score: 87 },
  sosyalfayda: { id: 'ZqFO7jP2R3DvvyNlPRsp', name: 'ULUSLARARASI SOSYAL FAYDA DERNEĞİ', city: 'İstanbul', score: 91 },
};

// Ortak alan üreticisi.
const mk = (ngo, o) => ({
  title: o.title,
  description: o.description,
  organization: ngo.name,
  ngoId: ngo.id,
  socialArea: o.socialArea,
  interests: o.interests ?? [],
  skills: o.skills ?? [],
  location: { city: o.city ?? ngo.city, district: o.district ?? '', type: o.locType ?? 'Saha', ...(o.address ? { address: o.address } : {}) },
  dates: {
    applicationStart: '2026-07-08',
    applicationEnd: '2026-12-31',
    eventStart: o.eventStart ?? '2026-08-01',
    eventEnd: o.eventEnd ?? o.eventStart ?? '2026-08-01',
  },
  volunteerCount: { needed: o.needed ?? 25, applications: 0 },
  commitment: o.commitment ?? 'Tek Günlük',
  hours: { start: o.start ?? '09:00', end: o.end ?? '17:00', total: o.total ?? 8 },
  amenities: { transport: o.transport ?? true, food: o.food ?? true, accommodation: o.accommodation ?? false },
  requirements: o.requirements ?? '',
  participationCondition: o.participationCondition ?? '',
  hasPreTraining: o.hasPreTraining ?? false,
  points: o.points ?? 300,
  providesCertificate: true,
  ngoTransparencyScore: ngo.score,
  status: 'Aktif',
});

const LISTINGS = [
  // ── Yeşil Türkiye Derneği — çevre / orman / iklim ──
  mk(NGOS.yesil, { title: 'Fidan Dikimi Seferberliği', socialArea: 'Çevre ve Doğa', locType: 'Saha', city: 'İstanbul', district: 'Çatalca', description: 'Erozyonla mücadele için hafta sonu fidan dikimi. Fidanlar ve eldivenler tarafımızdan sağlanır.', interests: ['Çevre', 'Doğa'], needed: 60, points: 400, eventStart: '2026-09-13' }),
  mk(NGOS.yesil, { title: 'Sahil ve Orman Temizliği', socialArea: 'Çevre ve Doğa', locType: 'Saha', city: 'İstanbul', district: 'Şile', description: 'Deniz kıyısı ve orman içi atık toplama etkinliği. Geri dönüşüm bilinci atölyesi dahil.', interests: ['Çevre', 'Geri Dönüşüm'], needed: 40, points: 300, eventStart: '2026-08-16' }),
  mk(NGOS.yesil, { title: 'Okullarda İklim Farkındalığı Eğitimi', socialArea: 'Eğitim', locType: 'Karma', description: 'İlkokullarda iklim değişikliği ve sürdürülebilirlik atölyeleri düzenleyecek gönüllü eğitmenler.', interests: ['Eğitim', 'İklim'], skills: ['Sunum', 'İletişim'], needed: 20, points: 500, commitment: 'Düzenli', hasPreTraining: true, eventStart: '2026-10-01', eventEnd: '2026-12-15' }),
  mk(NGOS.yesil, { title: 'Kent Bahçeleri Bakım Gönüllülüğü', socialArea: 'Çevre ve Doğa', locType: 'Saha', city: 'İstanbul', district: 'Kadıköy', description: 'Mahalle bostanlarında ekim-bakım desteği. Kentsel tarım deneyimi kazanın.', interests: ['Tarım', 'Çevre'], needed: 30, points: 300, commitment: 'Haftalık', eventStart: '2026-08-01', eventEnd: '2026-11-30' }),
  mk(NGOS.yesil, { title: 'Sıfır Atık Festivali Saha Ekibi', socialArea: 'Çevre ve Doğa', locType: 'Saha', city: 'İstanbul', district: 'Beşiktaş', description: 'Sıfır atık festivalinde stant, yönlendirme ve atık ayrıştırma desteği.', interests: ['Etkinlik', 'Çevre'], needed: 50, points: 350, eventStart: '2026-09-27' }),

  // ── Mersin Güçbirliği — kalkınma / dayanışma / yerel ──
  mk(NGOS.mersin, { title: 'Mahalle Dayanışma Mutfağı', socialArea: 'Dayanışma', locType: 'Saha', city: 'Mersin', district: 'Akdeniz', description: 'İhtiyaç sahibi ailelere sıcak yemek hazırlama ve dağıtım desteği.', interests: ['Dayanışma', 'Gıda'], needed: 35, points: 350, commitment: 'Haftalık', eventStart: '2026-08-01', eventEnd: '2026-12-31' }),
  mk(NGOS.mersin, { title: 'Kadın Kooperatifi El Emeği Pazarı', socialArea: 'Kadın', locType: 'Saha', city: 'Mersin', district: 'Yenişehir', description: 'Yerel kadın üreticilerin pazarında kurulum, satış ve tanıtım desteği.', interests: ['Kadın', 'Ekonomi'], skills: ['İletişim'], needed: 20, points: 300, eventStart: '2026-08-23' }),
  mk(NGOS.mersin, { title: 'Çocuklar İçin Yaz Okulu Eğitmenliği', socialArea: 'Eğitim', locType: 'Saha', city: 'Mersin', district: 'Toroslar', description: 'Dezavantajlı mahallelerde çocuklara yaz okulu; matematik, okuma ve sanat atölyeleri.', interests: ['Eğitim', 'Çocuk'], skills: ['Eğitim'], needed: 15, points: 500, commitment: 'Düzenli', hasPreTraining: true, eventStart: '2026-08-01', eventEnd: '2026-08-31' }),
  mk(NGOS.mersin, { title: 'Yerel Kalkınma Saha Araştırması', socialArea: 'Toplum', locType: 'Saha', city: 'Mersin', district: 'Mezitli', description: 'Mahalle ihtiyaç analizi için anket ve saha görüşmeleri yapacak gönüllüler.', interests: ['Araştırma', 'Toplum'], skills: ['Analiz', 'İletişim'], needed: 25, points: 350, eventStart: '2026-09-05' }),
  mk(NGOS.mersin, { title: 'Afet Hazırlık ve İlk Yardım Tatbikatı', socialArea: 'Afet', locType: 'Saha', city: 'Mersin', district: 'Akdeniz', description: 'Mahalle ölçekli afet hazırlık tatbikatı organizasyon desteği.', interests: ['Afet', 'Sağlık'], needed: 40, points: 400, hasPreTraining: true, eventStart: '2026-10-11' }),

  // ── Oyunda Kal Derneği — çocuk / oyun / gelişim ──
  mk(NGOS.oyunda, { title: 'Hastane Oyun Odası Gönüllülüğü', socialArea: 'Çocuk', locType: 'Saha', city: 'Ankara', district: 'Çankaya', description: 'Tedavi gören çocuklarla oyun ve etkinlik eşlikçiliği. Moral ve gelişim desteği.', interests: ['Çocuk', 'Sağlık'], skills: ['İletişim'], needed: 20, points: 450, commitment: 'Haftalık', hasPreTraining: true, eventStart: '2026-08-01', eventEnd: '2026-12-31' }),
  mk(NGOS.oyunda, { title: 'Oyunla Öğrenme Atölyeleri', socialArea: 'Eğitim', locType: 'Saha', city: 'Ankara', district: 'Mamak', description: 'İlkokul çağı çocuklara oyun temelli öğrenme atölyeleri düzenleme.', interests: ['Eğitim', 'Çocuk'], skills: ['Eğitim'], needed: 18, points: 400, hasPreTraining: true, eventStart: '2026-09-01', eventEnd: '2026-11-30' }),
  mk(NGOS.oyunda, { title: 'Oyuncak Toplama ve Onarım Kampanyası', socialArea: 'Dayanışma', locType: 'Uzaktan', description: 'Bağışlanan oyuncakların toplanması, onarımı ve ihtiyaç sahibi çocuklara ulaştırılması.', interests: ['Dayanışma', 'Çocuk'], needed: 30, points: 300, locType: 'Karma', eventStart: '2026-08-15' }),
  mk(NGOS.oyunda, { title: 'Sokak Oyunları Şenliği', socialArea: 'Çocuk', locType: 'Saha', city: 'Ankara', district: 'Keçiören', description: 'Geleneksel sokak oyunlarını çocuklarla yeniden canlandıran mahalle şenliği ekibi.', interests: ['Etkinlik', 'Çocuk'], needed: 45, points: 350, eventStart: '2026-09-20' }),
  mk(NGOS.oyunda, { title: 'Dijital Oyun Bağımlılığı Farkındalık Semineri', socialArea: 'Sağlık', locType: 'Karma', description: 'Ebeveyn ve öğretmenlere yönelik dengeli oyun ve ekran kullanımı seminerleri.', interests: ['Sağlık', 'Eğitim'], skills: ['Sunum'], needed: 12, points: 400, hasPreTraining: true, eventStart: '2026-10-04' }),

  // ── Uluslararası Sosyal Fayda Derneği — sosyal etki / kapasite / uluslararası ──
  mk(NGOS.sosyalfayda, { title: 'Sosyal Girişimcilik Mentorluğu', socialArea: 'Toplum', locType: 'Uzaktan', description: 'Genç sosyal girişimcilere iş modeli ve etki ölçümü konusunda uzaktan mentorluk.', interests: ['Girişimcilik', 'Toplum'], skills: ['Mentorluk', 'İş Geliştirme'], needed: 15, points: 500, commitment: 'Düzenli', hasPreTraining: true, eventStart: '2026-08-01', eventEnd: '2026-12-31' }),
  mk(NGOS.sosyalfayda, { title: 'Mülteci Uyum Dil Kursu Gönüllülüğü', socialArea: 'Eğitim', locType: 'Saha', city: 'İstanbul', district: 'Fatih', description: 'Mülteci ve göçmenlere Türkçe dil desteği verecek gönüllü eğitmenler.', interests: ['Eğitim', 'Göç'], skills: ['Eğitim', 'Dil'], needed: 20, points: 450, commitment: 'Haftalık', hasPreTraining: true, eventStart: '2026-09-01', eventEnd: '2026-12-31' }),
  mk(NGOS.sosyalfayda, { title: 'Uluslararası Gönüllülük Zirvesi Organizasyon', socialArea: 'Etkinlik', locType: 'Saha', city: 'İstanbul', district: 'Beyoğlu', description: 'Uluslararası katılımlı gönüllülük zirvesinde karşılama, çeviri ve koordinasyon.', interests: ['Etkinlik', 'Uluslararası'], skills: ['Organizasyon', 'İngilizce'], needed: 35, points: 400, eventStart: '2026-11-08', eventEnd: '2026-11-09' }),
  mk(NGOS.sosyalfayda, { title: 'Sosyal Etki Ölçümü Saha Ekibi', socialArea: 'Toplum', locType: 'Karma', description: 'Projelerin sosyal etkisini ölçmek için veri toplama ve raporlama desteği.', interests: ['Araştırma', 'Veri'], skills: ['Analiz'], needed: 18, points: 400, hasPreTraining: true, eventStart: '2026-09-15', eventEnd: '2026-10-15' }),
  mk(NGOS.sosyalfayda, { title: 'Kapasite Geliştirme Eğitmen Havuzu', socialArea: 'Eğitim', locType: 'Uzaktan', description: 'Küçük STK\'lara proje yazımı, fon bulma ve dijitalleşme eğitimi verecek uzman gönüllüler.', interests: ['Eğitim', 'Kapasite'], skills: ['Eğitim', 'Proje Yönetimi'], needed: 12, points: 500, commitment: 'Düzenli', hasPreTraining: true, eventStart: '2026-08-01', eventEnd: '2026-12-31' }),
];

let created = 0, skipped = 0;
for (const doc of LISTINGS) {
  // Idempotent: aynı ngoId + title varsa atla.
  const existing = await db.collection('volunteering')
    .where('ngoId', '==', doc.ngoId)
    .where('title', '==', doc.title)
    .limit(1).get();
  if (!existing.empty) { skipped++; console.log(`  ⏭️  zaten var: ${doc.organization} · ${doc.title}`); continue; }
  await db.collection('volunteering').add({ ...doc, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
  created++;
  console.log(`  ✅ eklendi: ${doc.organization} · ${doc.title}`);
}
console.log(`\n=== ${created} ilan eklendi, ${skipped} atlandı (toplam ${LISTINGS.length}) ===`);
process.exit(0);
