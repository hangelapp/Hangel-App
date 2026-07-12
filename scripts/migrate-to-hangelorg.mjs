/**
 * ESKİ proje (hangel-new-v18) → CANLI proje (hangelorg) veri göçü + düzeltmeler.
 *
 * Yanlışlıkla eski projeye yazılan/eski projede kalan verileri CANLI hangelorg'a
 * taşır. Idempotent — tekrar çalıştırmak güvenli (aynı ID'ye set/merge).
 *
 * GEREKLİ: hangelorg service-account anahtarı → new-app/.hangelorg-service-account.json
 * (Firebase Console → hangelorg → Proje Ayarları → Servis hesapları → Yeni özel anahtar)
 *
 * Çalıştır: node scripts/migrate-to-hangelorg.mjs
 *
 * Yaptıkları (sırayla):
 *  1. registryVakiflar: 6.680 vakfı ID koruyarak hangelorg'a kopyalar (Afyon 3→41 kök çözümü).
 *  2. 20 gönüllülük ilanı: 4 STK'yı hangelorg'da İSİMLE bulur, ilanları oraya seed eder.
 *  3. brands logo temizliği: hangelorg'da ölü (hangel-new-v18/clearbit) logoUrl'leri boşaltır.
 *  4. checkin→rsvp backfill: hangelorg events'inde çalıştırır.
 */
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { readFileSync, existsSync } from 'fs';

const OLD_SA = new URL('../.firebase-service-account.json', import.meta.url);
const NEW_SA = new URL('../.hangelorg-service-account.json', import.meta.url);

if (!existsSync(NEW_SA)) {
  console.error('❌ .hangelorg-service-account.json bulunamadı.');
  console.error('   Firebase Console → hangelorg → Proje Ayarları → Servis hesapları →');
  console.error('   "Yeni özel anahtar oluştur" → dosyayı new-app/.hangelorg-service-account.json olarak kaydet.');
  process.exit(1);
}

const oldSa = JSON.parse(readFileSync(OLD_SA));
const newSa = JSON.parse(readFileSync(NEW_SA));
if (newSa.project_id !== 'hangelorg') {
  console.error(`❌ Yeni anahtar 'hangelorg' değil: ${newSa.project_id}. Yanlış projeden indirilmiş.`);
  process.exit(1);
}

const oldApp = initializeApp({ credential: cert(oldSa) }, 'old');
const newApp = initializeApp({ credential: cert(newSa) }, 'new');
const oldDb = getFirestore(oldApp);
const newDb = getFirestore(newApp);

console.log(`Kaynak: ${oldSa.project_id}  →  Hedef: ${newSa.project_id}\n`);

// ── 1) registryVakiflar göçü (ID korunur, batch 400) ─────────────────────────
async function migrateVakiflar() {
  console.log('── 1) registryVakiflar göçü');
  const before = await newDb.collection('registryVakiflar').count().get();
  console.log(`   hangelorg mevcut: ${before.data().count}`);
  let copied = 0, cursor = null;
  for (;;) {
    let q = oldDb.collection('registryVakiflar').orderBy('__name__').limit(400);
    if (cursor) q = q.startAfter(cursor);
    const snap = await q.get();
    if (snap.empty) break;
    const batch = newDb.batch();
    for (const d of snap.docs) {
      batch.set(newDb.collection('registryVakiflar').doc(d.id), d.data(), { merge: true });
    }
    await batch.commit();
    copied += snap.docs.length;
    cursor = snap.docs[snap.docs.length - 1];
    process.stdout.write(`\r   kopyalanan: ${copied}`);
    if (snap.docs.length < 400) break;
  }
  const after = await newDb.collection('registryVakiflar').count().get();
  console.log(`\n   ✅ bitti — hangelorg şimdi: ${after.data().count} vakıf`);
  const afyon = await newDb.collection('registryVakiflar').where('il', '==', 'Afyon').count().get();
  console.log(`   Afyon kontrolü: ${afyon.data().count} vakıf (3'ten 41+'a çıkmalı)\n`);
}

// ── 2) 20 gönüllülük ilanı — hangelorg STK'larını İSİMLE bul, seed et ────────
const NGO_NAMES = {
  yesil: { match: 'yeşil türkiye derneği', city: 'İstanbul', score: 90 },
  mersin: { match: 'mersin güçbirliği', city: 'Mersin', score: 88 },
  oyunda: { match: 'oyunda kal', city: 'Ankara', score: 87 },
  sosyalfayda: { match: 'uluslararası sosyal fayda', city: 'İstanbul', score: 91 },
};

const mk = (ngo, o) => ({
  title: o.title, description: o.description, organization: ngo.name, ngoId: ngo.id,
  socialArea: o.socialArea, interests: o.interests ?? [], skills: o.skills ?? [],
  location: { city: o.city ?? ngo.city, district: o.district ?? '', type: o.locType ?? 'Saha', ...(o.address ? { address: o.address } : {}) },
  dates: { applicationStart: '2026-07-09', applicationEnd: '2026-12-31', eventStart: o.eventStart ?? '2026-08-01', eventEnd: o.eventEnd ?? o.eventStart ?? '2026-08-01' },
  volunteerCount: { needed: o.needed ?? 25, applications: 0 },
  commitment: o.commitment ?? 'Tek Günlük',
  hours: { start: o.start ?? '09:00', end: o.end ?? '17:00', total: o.total ?? 8 },
  amenities: { transport: o.transport ?? true, food: o.food ?? true, accommodation: o.accommodation ?? false },
  requirements: o.requirements ?? '', participationCondition: o.participationCondition ?? '',
  hasPreTraining: o.hasPreTraining ?? false, points: o.points ?? 300,
  providesCertificate: true, ngoTransparencyScore: ngo.score, status: 'Aktif',
});

function buildListings(N) {
  return [
    mk(N.yesil, { title: 'Fidan Dikimi Seferberliği', socialArea: 'Çevre ve Doğa', city: 'İstanbul', district: 'Çatalca', description: 'Erozyonla mücadele için hafta sonu fidan dikimi. Fidanlar ve eldivenler tarafımızdan sağlanır.', interests: ['Çevre', 'Doğa'], needed: 60, points: 400, eventStart: '2026-09-13' }),
    mk(N.yesil, { title: 'Sahil ve Orman Temizliği', socialArea: 'Çevre ve Doğa', city: 'İstanbul', district: 'Şile', description: 'Deniz kıyısı ve orman içi atık toplama etkinliği. Geri dönüşüm bilinci atölyesi dahil.', interests: ['Çevre', 'Geri Dönüşüm'], needed: 40, points: 300, eventStart: '2026-08-16' }),
    mk(N.yesil, { title: 'Okullarda İklim Farkındalığı Eğitimi', socialArea: 'Eğitim', locType: 'Karma', description: 'İlkokullarda iklim değişikliği ve sürdürülebilirlik atölyeleri düzenleyecek gönüllü eğitmenler.', interests: ['Eğitim', 'İklim'], skills: ['Sunum', 'İletişim'], needed: 20, points: 500, commitment: 'Düzenli', hasPreTraining: true, eventStart: '2026-10-01', eventEnd: '2026-12-15' }),
    mk(N.yesil, { title: 'Kent Bahçeleri Bakım Gönüllülüğü', socialArea: 'Çevre ve Doğa', city: 'İstanbul', district: 'Kadıköy', description: 'Mahalle bostanlarında ekim-bakım desteği. Kentsel tarım deneyimi kazanın.', interests: ['Tarım', 'Çevre'], needed: 30, points: 300, commitment: 'Haftalık', eventStart: '2026-08-01', eventEnd: '2026-11-30' }),
    mk(N.yesil, { title: 'Sıfır Atık Festivali Saha Ekibi', socialArea: 'Çevre ve Doğa', city: 'İstanbul', district: 'Beşiktaş', description: 'Sıfır atık festivalinde stant, yönlendirme ve atık ayrıştırma desteği.', interests: ['Etkinlik', 'Çevre'], needed: 50, points: 350, eventStart: '2026-09-27' }),
    mk(N.mersin, { title: 'Mahalle Dayanışma Mutfağı', socialArea: 'Dayanışma', city: 'Mersin', district: 'Akdeniz', description: 'İhtiyaç sahibi ailelere sıcak yemek hazırlama ve dağıtım desteği.', interests: ['Dayanışma', 'Gıda'], needed: 35, points: 350, commitment: 'Haftalık', eventStart: '2026-08-01', eventEnd: '2026-12-31' }),
    mk(N.mersin, { title: 'Kadın Kooperatifi El Emeği Pazarı', socialArea: 'Kadın', city: 'Mersin', district: 'Yenişehir', description: 'Yerel kadın üreticilerin pazarında kurulum, satış ve tanıtım desteği.', interests: ['Kadın', 'Ekonomi'], skills: ['İletişim'], needed: 20, points: 300, eventStart: '2026-08-23' }),
    mk(N.mersin, { title: 'Çocuklar İçin Yaz Okulu Eğitmenliği', socialArea: 'Eğitim', city: 'Mersin', district: 'Toroslar', description: 'Dezavantajlı mahallelerde çocuklara yaz okulu; matematik, okuma ve sanat atölyeleri.', interests: ['Eğitim', 'Çocuk'], skills: ['Eğitim'], needed: 15, points: 500, commitment: 'Düzenli', hasPreTraining: true, eventStart: '2026-08-01', eventEnd: '2026-08-31' }),
    mk(N.mersin, { title: 'Yerel Kalkınma Saha Araştırması', socialArea: 'Toplum', city: 'Mersin', district: 'Mezitli', description: 'Mahalle ihtiyaç analizi için anket ve saha görüşmeleri yapacak gönüllüler.', interests: ['Araştırma', 'Toplum'], skills: ['Analiz', 'İletişim'], needed: 25, points: 350, eventStart: '2026-09-05' }),
    mk(N.mersin, { title: 'Afet Hazırlık ve İlk Yardım Tatbikatı', socialArea: 'Afet', city: 'Mersin', district: 'Akdeniz', description: 'Mahalle ölçekli afet hazırlık tatbikatı organizasyon desteği.', interests: ['Afet', 'Sağlık'], needed: 40, points: 400, hasPreTraining: true, eventStart: '2026-10-11' }),
    mk(N.oyunda, { title: 'Hastane Oyun Odası Gönüllülüğü', socialArea: 'Çocuk', city: 'Ankara', district: 'Çankaya', description: 'Tedavi gören çocuklarla oyun ve etkinlik eşlikçiliği. Moral ve gelişim desteği.', interests: ['Çocuk', 'Sağlık'], skills: ['İletişim'], needed: 20, points: 450, commitment: 'Haftalık', hasPreTraining: true, eventStart: '2026-08-01', eventEnd: '2026-12-31' }),
    mk(N.oyunda, { title: 'Oyunla Öğrenme Atölyeleri', socialArea: 'Eğitim', city: 'Ankara', district: 'Mamak', description: 'İlkokul çağı çocuklara oyun temelli öğrenme atölyeleri düzenleme.', interests: ['Eğitim', 'Çocuk'], skills: ['Eğitim'], needed: 18, points: 400, hasPreTraining: true, eventStart: '2026-09-01', eventEnd: '2026-11-30' }),
    mk(N.oyunda, { title: 'Oyuncak Toplama ve Onarım Kampanyası', socialArea: 'Dayanışma', locType: 'Karma', description: 'Bağışlanan oyuncakların toplanması, onarımı ve ihtiyaç sahibi çocuklara ulaştırılması.', interests: ['Dayanışma', 'Çocuk'], needed: 30, points: 300, eventStart: '2026-08-15' }),
    mk(N.oyunda, { title: 'Sokak Oyunları Şenliği', socialArea: 'Çocuk', city: 'Ankara', district: 'Keçiören', description: 'Geleneksel sokak oyunlarını çocuklarla yeniden canlandıran mahalle şenliği ekibi.', interests: ['Etkinlik', 'Çocuk'], needed: 45, points: 350, eventStart: '2026-09-20' }),
    mk(N.oyunda, { title: 'Dijital Oyun Bağımlılığı Farkındalık Semineri', socialArea: 'Sağlık', locType: 'Karma', description: 'Ebeveyn ve öğretmenlere yönelik dengeli oyun ve ekran kullanımı seminerleri.', interests: ['Sağlık', 'Eğitim'], skills: ['Sunum'], needed: 12, points: 400, hasPreTraining: true, eventStart: '2026-10-04' }),
    mk(N.sosyalfayda, { title: 'Sosyal Girişimcilik Mentorluğu', socialArea: 'Toplum', locType: 'Uzaktan', description: 'Genç sosyal girişimcilere iş modeli ve etki ölçümü konusunda uzaktan mentorluk.', interests: ['Girişimcilik', 'Toplum'], skills: ['Mentorluk', 'İş Geliştirme'], needed: 15, points: 500, commitment: 'Düzenli', hasPreTraining: true, eventStart: '2026-08-01', eventEnd: '2026-12-31' }),
    mk(N.sosyalfayda, { title: 'Mülteci Uyum Dil Kursu Gönüllülüğü', socialArea: 'Eğitim', city: 'İstanbul', district: 'Fatih', description: 'Mülteci ve göçmenlere Türkçe dil desteği verecek gönüllü eğitmenler.', interests: ['Eğitim', 'Göç'], skills: ['Eğitim', 'Dil'], needed: 20, points: 450, commitment: 'Haftalık', hasPreTraining: true, eventStart: '2026-09-01', eventEnd: '2026-12-31' }),
    mk(N.sosyalfayda, { title: 'Uluslararası Gönüllülük Zirvesi Organizasyon', socialArea: 'Etkinlik', city: 'İstanbul', district: 'Beyoğlu', description: 'Uluslararası katılımlı gönüllülük zirvesinde karşılama, çeviri ve koordinasyon.', interests: ['Etkinlik', 'Uluslararası'], skills: ['Organizasyon', 'İngilizce'], needed: 35, points: 400, eventStart: '2026-11-08', eventEnd: '2026-11-09' }),
    mk(N.sosyalfayda, { title: 'Sosyal Etki Ölçümü Saha Ekibi', socialArea: 'Toplum', locType: 'Karma', description: 'Projelerin sosyal etkisini ölçmek için veri toplama ve raporlama desteği.', interests: ['Araştırma', 'Veri'], skills: ['Analiz'], needed: 18, points: 400, hasPreTraining: true, eventStart: '2026-09-15', eventEnd: '2026-10-15' }),
    mk(N.sosyalfayda, { title: 'Kapasite Geliştirme Eğitmen Havuzu', socialArea: 'Eğitim', locType: 'Uzaktan', description: "Küçük STK'lara proje yazımı, fon bulma ve dijitalleşme eğitimi verecek uzman gönüllüler.", interests: ['Eğitim', 'Kapasite'], skills: ['Eğitim', 'Proje Yönetimi'], needed: 12, points: 500, commitment: 'Düzenli', hasPreTraining: true, eventStart: '2026-08-01', eventEnd: '2026-12-31' }),
  ];
}

async function seedListings() {
  console.log('── 2) 20 gönüllülük ilanı (hangelorg STK id\'leriyle)');
  const ngosSnap = await newDb.collection('ngos').get();
  const found = {};
  ngosSnap.forEach((d) => {
    const nl = (d.data().name || '').toLocaleLowerCase('tr');
    for (const [k, v] of Object.entries(NGO_NAMES)) {
      if (nl.includes(v.match) && !found[k]) found[k] = { id: d.id, name: d.data().name, city: v.city, score: v.score };
    }
  });
  const missing = Object.keys(NGO_NAMES).filter((k) => !found[k]);
  if (missing.length) console.log(`   ⚠️ hangelorg'da bulunamayan STK: ${missing.join(', ')} — onların ilanları atlanır`);
  Object.entries(found).forEach(([k, v]) => console.log(`   ✓ ${k}: ${v.name} (${v.id})`));

  const N = { ...found };
  const listings = buildListings({
    yesil: N.yesil ?? { id: null }, mersin: N.mersin ?? { id: null },
    oyunda: N.oyunda ?? { id: null }, sosyalfayda: N.sosyalfayda ?? { id: null },
  }).filter((l) => l.ngoId);

  let created = 0, skipped = 0;
  for (const doc of listings) {
    const existing = await newDb.collection('volunteering')
      .where('ngoId', '==', doc.ngoId).where('title', '==', doc.title).limit(1).get();
    if (!existing.empty) { skipped++; continue; }
    await newDb.collection('volunteering').add({ ...doc, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
    created++;
  }
  console.log(`   ✅ ${created} ilan eklendi, ${skipped} zaten vardı\n`);
}

// ── 3) brands ölü logo temizliği (hangelorg) ─────────────────────────────────
async function cleanLogos() {
  console.log('── 3) brands ölü logoUrl temizliği');
  const snap = await newDb.collection('brands').get();
  let cleaned = 0;
  const batch = newDb.batch();
  for (const d of snap.docs) {
    const u = (d.data().logoUrl || '').trim();
    if (u && (u.includes('hangel-new-v18') || u.includes('logo.clearbit.com/'))) {
      batch.update(d.ref, { logoUrl: '' });
      cleaned++;
    }
  }
  if (cleaned) await batch.commit();
  console.log(`   ✅ ${cleaned} ölü logoUrl temizlendi (${snap.size} marka)\n`);
}

// ── 4) checkin→rsvp backfill (hangelorg) ─────────────────────────────────────
async function backfillRsvp() {
  console.log('── 4) checkin→rsvp backfill');
  const eventsSnap = await newDb.collection('events').get();
  let added = 0, already = 0;
  for (const ev of eventsSnap.docs) {
    const cs = await ev.ref.collection('checkins').get();
    for (const ci of cs.docs) {
      const uid = ci.data().uid || (ci.id.startsWith('dev_') ? null : ci.id);
      if (!uid) continue;
      const rr = ev.ref.collection('rsvps').doc(uid);
      const rs = await rr.get();
      if (rs.exists && rs.data()?.status === 'going') { already++; continue; }
      await rr.set({ userId: uid, status: 'going', source: 'checkin-backfill', updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      added++;
    }
  }
  console.log(`   ✅ ${added} eklendi, ${already} zaten going (${eventsSnap.size} etkinlik)\n`);
}

await migrateVakiflar();
await seedListings();
await cleanLogos();
await backfillRsvp();
console.log('=== GÖÇ TAMAMLANDI — canlıda doğrulamayı unutma ===');
process.exit(0);
