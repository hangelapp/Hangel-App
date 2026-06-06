/**
 * scripts/seed-federasyonlar.mjs
 *
 * Türkiye'deki ~98 federasyonu (spor + STK + mesleki) outreachContacts'a yaz.
 * Idempotent: aynı id ile mevcut varsa atlanır.
 *
 * Usage:
 *   cd /Users/macbookair/new-app
 *   GOOGLE_APPLICATION_CREDENTIALS=./.firebase-service-account.json \
 *     node scripts/seed-federasyonlar.mjs
 */
import admin from 'firebase-admin';

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

// Format: [name, shortName, category, city, address, phone, email, website]
const FEDERATIONS = [
  // ─────────── SPOR FEDERASYONLARI (63) ───────────
  ['Türkiye Futbol Federasyonu', 'TFF', 'Spor', 'İstanbul', 'İstinye Mh. Darüşşafaka Cd. No:45 Sarıyer', '+902123622222', 'info@tff.org', 'https://tff.org'],
  ['Türkiye Basketbol Federasyonu', 'TBF', 'Spor', 'İstanbul', 'Sinan Erdem Spor Salonu, Ataköy', '+902125033000', '', 'https://tbf.org.tr'],
  ['Türkiye Voleybol Federasyonu', 'TVF', 'Spor', 'Ankara', '', '', '', 'https://tvf.org.tr'],
  ['Türkiye Atletizm Federasyonu', 'TAF', 'Spor', 'Ankara', '', '', '', 'https://taf.org.tr'],
  ['Türkiye Yüzme Federasyonu', 'TYF', 'Spor', 'Ankara', '', '', '', 'https://tyf.gov.tr'],
  ['Türkiye Güreş Federasyonu', 'TGF', 'Spor', 'Ankara', '', '', '', 'https://tgf.gov.tr'],
  ['Türkiye Boks Federasyonu', 'TBoksF', 'Spor', 'Ankara', '', '', '', 'https://turkboks.gov.tr'],
  ['Türkiye Taekwondo Federasyonu', 'TTKDF', 'Spor', 'Ankara', '', '', '', 'https://turkiyetaekwondofed.gov.tr'],
  ['Türkiye Karate Federasyonu', 'TKarateF', 'Spor', 'Ankara', '', '', '', 'https://karate.gov.tr'],
  ['Türkiye Judo Federasyonu', 'TJF', 'Spor', 'Ankara', '', '', '', 'https://judo.org.tr'],
  ['Türkiye Tenis Federasyonu', 'TTenisF', 'Spor', 'Ankara', '', '', '', 'https://ttf.org.tr'],
  ['Türkiye Halter Federasyonu', 'THalterF', 'Spor', 'Ankara', '', '', '', 'https://halter.gov.tr'],
  ['Türkiye Cimnastik Federasyonu', 'TCimF', 'Spor', 'Ankara', '', '', '', 'https://cimnastik.gov.tr'],
  ['Türkiye Bisiklet Federasyonu', 'TBisF', 'Spor', 'Ankara', '', '', '', 'https://bisiklet.gov.tr'],
  ['Türkiye Yelken Federasyonu', 'TYelkenF', 'Spor', 'İstanbul', '', '+902324211957', '', 'https://tyf.org.tr'],
  ['Türkiye Okçuluk Federasyonu', 'TOF', 'Spor', 'Ankara', '', '', '', 'https://okculuk.org.tr'],
  ['Türkiye Binicilik Federasyonu', 'TBinF', 'Spor', 'Ankara', '', '', '', ''],
  ['Türkiye Satranç Federasyonu', 'TSF', 'Spor', 'Ankara', 'Mürsel Uluç Mh. 931. Cd. No:14 Çankaya', '', '', 'https://tsf.org.tr'],
  ['Türkiye Briç Federasyonu', 'TBriF', 'Spor', 'Ankara', '', '', '', 'https://tbricfed.org.tr'],
  ['Türkiye Dağcılık Federasyonu', 'TDF', 'Spor', 'Ankara', '', '', '', ''],
  ['Türkiye Sualtı Sporları Federasyonu', 'TSSF', 'Spor', 'Ankara', '', '+903123104136', 'info@tssf.gov.tr', 'https://tssf.gov.tr'],
  ['Türkiye Hentbol Federasyonu', 'THF', 'Spor', 'Ankara', '', '', '', 'https://thf.org.tr'],
  ['Türkiye Masa Tenisi Federasyonu', 'TMTF', 'Spor', 'Ankara', '', '', '', 'https://tmtf.org.tr'],
  ['Türkiye Badminton Federasyonu', 'TBadF', 'Spor', 'Ankara', '', '', '', ''],
  ['Türkiye Kürek Federasyonu', 'TKürekF', 'Spor', 'Ankara', '', '', '', ''],
  ['Türkiye Kano Federasyonu', 'TKanoF', 'Spor', 'Ankara', '', '', '', ''],
  ['Türkiye Eskrim Federasyonu', 'TEF', 'Spor', 'Ankara', '', '', '', ''],
  ['Türkiye Bocce Bowling ve Dart Federasyonu', 'TBBDF', 'Spor', 'Ankara', '', '', '', ''],
  ['Türkiye Bilardo Federasyonu', 'TBilF', 'Spor', 'Ankara', '', '', '', ''],
  ['Türkiye Atıcılık ve Avcılık Federasyonu', 'TAAF', 'Spor', 'Ankara', '', '', '', ''],
  ['Türkiye Modern Pentatlon Federasyonu', 'TMPF', 'Spor', 'Ankara', '', '', '', 'https://tmpf.org.tr'],
  ['Türkiye Triatlon Federasyonu', 'TTriF', 'Spor', 'Ankara', '', '', '', 'https://triatlon.org.tr'],
  ['Türkiye Golf Federasyonu', 'TGolfF', 'Spor', 'Ankara', '', '', '', ''],
  ['Türkiye Hokey Federasyonu', 'THokeyF', 'Spor', 'Ankara', '', '', '', ''],
  ['Türkiye Buz Pateni Federasyonu', 'TBPF', 'Spor', 'Ankara', '', '', '', 'https://buzpateni.org.tr'],
  ['Türkiye Buz Hokeyi Federasyonu', 'TBHF', 'Spor', 'Ankara', '', '', '', 'https://tbhf.org.tr'],
  ['Türkiye Kayak Federasyonu', 'TKayakF', 'Spor', 'Ankara', '', '', '', ''],
  ['Türkiye Curling Federasyonu', 'TCurlingF', 'Spor', 'Ankara', '', '', '', ''],
  ['Türkiye Kızak Federasyonu', 'TKızakF', 'Spor', 'Ankara', '', '', '', ''],
  ['Türkiye Dans Sporları Federasyonu', 'TDSF', 'Spor', 'Ankara', '', '', '', ''],
  ['Türkiye Kick Boks Federasyonu', 'TKBF', 'Spor', 'Ankara', '', '', '', 'https://kickboks.gov.tr'],
  ['Türkiye Wushu Kung Fu Federasyonu', 'TWKF', 'Spor', 'Ankara', '', '', '', 'https://twkf.gov.tr'],
  ['Türkiye Muay Thai Federasyonu', 'TMuayF', 'Spor', 'Ankara', '', '', '', ''],
  ['Türkiye Vücut Geliştirme Fitness ve Bilek Güreşi Federasyonu', 'TVGFBF', 'Spor', 'Ankara', '', '', '', 'https://tvgfbf.gov.tr'],
  ['Türkiye Halk Oyunları Federasyonu', 'THOF', 'Spor', 'Ankara', '', '', '', ''],
  ['Türkiye İzcilik Federasyonu', 'TİF', 'Spor', 'Ankara', '', '', '', ''],
  ['Türkiye Otomobil Sporları Federasyonu', 'TOSFED', 'Spor', 'İstanbul', '', '', '', 'https://tosfed.org.tr'],
  ['Türkiye Motosiklet Federasyonu', 'TMF', 'Spor', 'İstanbul', '', '', '', 'https://tmf.org.tr'],
  ['Türkiye Hava Sporları Federasyonu', 'THSF', 'Spor', 'Ankara', '', '', '', 'https://thsf.org.tr'],
  ['Türkiye Beyzbol Softbol Korumalı Futbol ve Ragbi Federasyonu', 'TBSF', 'Spor', 'Ankara', '', '', '', ''],
  ['Türkiye Geleneksel Spor Dalları Federasyonu', 'TGSDF', 'Spor', 'Ankara', '', '', '', 'https://gsdf.gov.tr'],
  ['Türkiye Geleneksel Türk Okçuluk Federasyonu', 'TGTOF', 'Spor', 'Ankara', '', '', '', ''],
  ['Türkiye Üniversite Sporları Federasyonu', 'TÜSF', 'Spor', 'Ankara', '', '', '', 'https://tusf.org.tr'],
  ['Türkiye Okul Sporları Federasyonu', 'TOSF', 'Spor', 'Ankara', '', '', '', ''],
  ['Türkiye Herkes İçin Spor Federasyonu', 'THİSF', 'Spor', 'Ankara', '', '', '', ''],
  ['Türkiye Gelişmekte Olan Spor Branşları Federasyonu', 'TGOSBF', 'Spor', 'Ankara', '', '', '', ''],
  ['Türkiye E-Spor Federasyonu', 'TESFED', 'Spor', 'Ankara', '', '', '', ''],
  ['Türkiye Kaykay Federasyonu', 'TKaykayF', 'Spor', 'Ankara', '', '', '', ''],
  ['Türkiye Çim Hokeyi Federasyonu', 'TÇHF', 'Spor', 'Ankara', '', '', '', ''],
  ['Türkiye Bedensel Engelliler Spor Federasyonu', 'TBESF', 'Spor', 'Ankara', '', '', '', 'https://tbesf.org.tr'],
  ['Türkiye Görme Engelliler Spor Federasyonu', 'TGESF', 'Spor', 'Ankara', '', '', '', 'https://gesf.org.tr'],
  ['Türkiye İşitme Engelliler Spor Federasyonu', 'TİESF', 'Spor', 'Ankara', '', '', '', 'https://tiesf.org.tr'],
  ['Türkiye Özel Sporcular Spor Federasyonu', 'TÖSSF', 'Spor', 'Ankara', '', '', '', 'https://tossfed.gov.tr'],

  // ─────────── STK / SİVİL TOPLUM FEDERASYONLARI (18) ───────────
  ['Türkiye Sakatlar Konfederasyonu', 'TSK', 'STK', 'Ankara', 'Kocatepe Mh. Bayındır 2 Sk. No:33 K/5 D/21 06420 Çankaya', '+903122325111', 'turkiyesakatlarkonfederasyonu@gmail.com', 'https://tsk.org.tr'],
  ['Türkiye Engelliler Konfederasyonu', 'TEK', 'STK', 'İstanbul', '', '', '', 'https://engellilerkonfederasyonu.org.tr'],
  ['Türkiye Engelliler Federasyonu', 'TEF', 'STK', 'İstanbul', '', '', '', 'https://engellilerfederasyonu.org.tr'],
  ['Türkiye Ortopedik Engelliler Federasyonu', 'TOEF', 'STK', 'İstanbul', 'Arpa Emini Mh. Dr. Ahmet Paşa Sk. No:1 Fatih', '+902126359482', '', 'https://toef.org.tr'],
  ['Türkiye Körler Federasyonu', 'TKörlerF', 'STK', 'Ankara', 'GMK Bulvarı 32/6 Demirtepe', '+903122318243', 'bilgi@korlerfederasyonu.org.tr', 'https://korlerfederasyonu.org.tr'],
  ['Türkiye Sağırlar Milli Federasyonu', 'TSMF', 'STK', 'Ankara', '', '', '', ''],
  ['Türkiye İşitme Engelliler Federasyonu', 'TİEF', 'STK', 'Ankara', '', '', '', ''],
  ['Türkiye Zihinsel Engelliler Federasyonu', 'ZEF', 'STK', 'Ankara', '', '', '', ''],
  ['Otizm Dernekleri Federasyonu', 'ODFED', 'STK', 'İstanbul', '', '', '', 'https://odfed.org'],
  ['Otizm ve Engelli Dernekleri Federasyonu', 'OTEF', 'STK', 'İstanbul', '', '', '', ''],
  ['Otizm Konfederasyonu', 'OKON', 'STK', 'İstanbul', '', '', '', ''],
  ['Akdeniz Engelliler Federasyonu', 'AEF', 'STK', 'Antalya', '', '', '', ''],
  ['Engelli Hakları Federasyonu', 'EHF', 'STK', 'İstanbul', '', '', '', ''],
  ['Engelsiz Dünya Federasyonu', 'EDF', 'STK', 'İstanbul', '', '', '', ''],
  ['Türkiye Talasemi Federasyonu', 'TTalF', 'STK', 'Antalya', '', '', '', 'https://talasemifederasyonu.org.tr'],
  ['Türkiye Kan Hastalıkları Federasyonu', 'TKHF', 'STK', 'Ankara', '', '', '', ''],
  ['Türkiye Spina Bifida Derneği', 'TSBD', 'STK', 'Ankara', '', '', '', ''],
  ['Türkiye Sakatlar Derneği', 'TSD', 'STK', 'İstanbul', '', '', '', 'https://tsd.org.tr'],

  // ─────────── MESLEKİ / ÜST BİRLİK FEDERASYONLARI (17) ───────────
  ['Türkiye Odalar ve Borsalar Birliği', 'TOBB', 'Mesleki', 'Ankara', 'Dumlupınar Bulvarı No:252 Eskişehir Yolu 9.Km 06530 Çankaya', '+903122182000', '', 'https://tobb.org.tr'],
  ['Türkiye Ziraat Odaları Birliği', 'TZOB', 'Mesleki', 'Ankara', 'GMK Bulvarı No:25 Demirtepe 06440', '+903122316300', 'ziraatodalari@tzob.org.tr', 'https://tzob.org.tr'],
  ['Türkiye Esnaf ve Sanatkârları Konfederasyonu', 'TESK', 'Mesleki', 'Ankara', 'Kavaklıdere Mah. Tunus Cad. No:4 06680 Çankaya', '', '', 'https://tesk.org.tr'],
  ['Türkiye İşçi Sendikaları Konfederasyonu', 'TÜRK-İŞ', 'Mesleki', 'Ankara', 'Bayındır Sok. No:10 Kızılay 06410', '+903124333125', 'turkis@turkis.org.tr', 'https://turkis.org.tr'],
  ['Hak İşçi Sendikaları Konfederasyonu', 'HAK-İŞ', 'Mesleki', 'Ankara', 'Tunus Caddesi No:37 Çankaya', '+903124177900', 'hakis@hakis.org.tr', 'https://hakis.org.tr'],
  ['Devrimci İşçi Sendikaları Konfederasyonu', 'DİSK', 'Mesleki', 'İstanbul', '', '+902122910005', 'disk@disk.org.tr', 'https://disk.org.tr'],
  ['Türkiye İşveren Sendikaları Konfederasyonu', 'TİSK', 'Mesleki', 'Ankara', 'Söğütözü Mah. Söğütözü Cad. No:2 A Blok K:28 Çankaya', '+903124397717', 'tisk@tisk.org.tr', 'https://tisk.org.tr'],
  ['Memur Sendikaları Konfederasyonu', 'MEMUR-SEN', 'Mesleki', 'Ankara', 'Zübeyde Hanım Mh. Sebze Bahçeleri Cd. No:86 06400 Altındağ', '+903122300972', '', 'https://memursen.org.tr'],
  ['Kamu Emekçileri Sendikaları Konfederasyonu', 'KESK', 'Mesleki', 'Ankara', 'Çehre Sk. No:6/1 Gaziosmanpaşa', '+903124367111', 'kesk@kesk.org.tr', 'https://kesk.org.tr'],
  ['Türkiye Kamu Çalışanları Sendikaları Konfederasyonu', 'TÜRKİYE KAMU-SEN', 'Mesleki', 'Ankara', '', '', '', 'https://kamusen.org.tr'],
  ['Türkiye Barolar Birliği', 'TBB', 'Mesleki', 'Ankara', 'Özdemir Özok Sk. No:8 06520 Balgat Çankaya', '', '', 'https://barobirlik.org.tr'],
  ['Türk Tabipleri Birliği', 'TTB', 'Mesleki', 'Ankara', '', '', '', 'https://ttb.org.tr'],
  ['Türk Mühendis ve Mimar Odaları Birliği', 'TMMOB', 'Mesleki', 'Ankara', '', '', '', 'https://tmmob.org.tr'],
  ['Türk Dişhekimleri Birliği', 'TDB', 'Mesleki', 'Ankara', '', '', '', 'https://tdb.org.tr'],
  ['Türk Eczacıları Birliği', 'TEB', 'Mesleki', 'Ankara', '', '', '', 'https://teb.org.tr'],
  ['Türk Veteriner Hekimleri Birliği', 'TVHB', 'Mesleki', 'Ankara', '', '', '', 'https://tvhb.org.tr'],
  ['Türkiye Noterler Birliği', 'TNB', 'Mesleki', 'Ankara', '', '', '', 'https://tnb.org.tr'],
];

async function main() {
  console.log(`${FEDERATIONS.length} federasyon Firestore'a yazılıyor...\n`);

  let written = 0;
  let skipped = 0;
  let batch = db.batch();
  let batchCount = 0;

  for (const [name, shortName, category, city, address, phone, email, website] of FEDERATIONS) {
    const docId = `federasyon-${slugify(name)}`.slice(0, 80);
    const ref = db.collection('outreachContacts').doc(docId);
    const existing = await ref.get();
    if (existing.exists) {
      skipped++;
      continue;
    }
    batch.set(ref, {
      name,
      shortName,
      type: 'Federasyon',
      faaliyetAlani: category,                 // "Spor" / "STK" / "Mesleki"
      city: city || null,
      district: null,
      neighborhood: null,
      address: address || null,
      phone: phone || null,
      phone2: null,
      email: email || null,
      etebligat: null,
      website: website || null,
      status: 'active',
      source: 'seed',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    written++;
    batchCount++;
    if (batchCount >= 450) {
      await batch.commit();
      batch = db.batch();
      batchCount = 0;
    }
  }
  if (batchCount > 0) await batch.commit();

  console.log(`✅ ${written} yeni, ⏭ ${skipped} mevcut atlandı`);

  const total = await db.collection('outreachContacts')
    .where('type', '==', 'Federasyon').count().get();
  console.log(`\nFirestore'da toplam ${total.data().count} Federasyon kaydı`);
}

main().catch((e) => { console.error(e); process.exit(1); });
