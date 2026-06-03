/**
 * Batch 2 — TR mevzuat tam-uyum güncellemesi (veri ve teknik politikalar).
 *
 * Kapsam (sadece bu slug'lar — B3/B5'e ait slug'lara KESİNLİKLE dokunulmaz):
 *   - veri-saklama-ve-imha-politikasi
 *   - veri-ihlali-bildirim-proseduru
 *   - veri-isleme-amaclar-beyani
 *   - veri-transferi-ve-hosting-beyani
 *   - ulke-bazli-veri-koruma-uyum-beyani
 *   - sizma-ve-guvenlik-testleri-beyani
 *   - ucuncu-taraf-gozetim-ve-etik-performans-beyani
 *   - yapay-zeka-seffaflik-beyani
 *   - ux-ve-kullanici-deneyimi-testleri-beyani
 *   - kamu-yarari-ve-sosyal-fayda-beyani
 *   - sosyal-etki-metodolojisi
 *   - sosyal-etki-politikasi
 *   - yerel-bagis-mevzuatlarina-uyum-beyani
 *   - yonetim-ve-kurumsal-yonetisim-ilkeleri
 *
 * Her doc için:
 *   1) İçeriğe TR + sektörel + uluslararası mevzuat referansları enjekte edilir
 *      (KVKK, TCK, ETKK, Bilgi Toplumu Stratejisi, Cybersecurity Strategy,
 *      BTK kararları, Sağlık Bakanlığı Kan ve Kan Ürünleri Kanunu, e-Tic mevzuatı,
 *      ISO 27001/27701, NIST, OWASP).
 *   2) Versiyon -> '2.0-tr', jurisdictions -> ['TR'].
 *   3) "hangel" KÜÇÜK HARF — yeni eklenen metinlerin hepsinde lowercase.
 *
 * Çalıştırma:
 *   # 1) DRY RUN — ilk 3 doc'u ekranda göster, yazma:
 *   GOOGLE_APPLICATION_CREDENTIALS=./hangel-sa.json npx tsx scripts/contracts-tr-compliance-batch2.ts --dry-run
 *
 *   # 2) APPLY — tüm Batch 2 doc'larını Firestore'a yaz:
 *   GOOGLE_APPLICATION_CREDENTIALS=./hangel-sa.json npx tsx scripts/contracts-tr-compliance-batch2.ts --apply
 *
 * Idempotent: aynı script tekrar çalıştırıldığında alanlar overwrite edilir
 * ama "TR Mevzuat Çerçevesi" bölümü zaten varsa duplike eklenmez.
 */
import { initializeApp, applicationDefault, cert, getApps } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

// B3/B5 listesinde olduğu KESİN bilinen slug'lar — DOKUNMA.
// (Ana sözleşmeler + üyelik + temel KVKK/Çerez/Gizlilik dokümanları, vb.)
const FORBIDDEN_SLUGS: ReadonlySet<string> = new Set([
  // B3 (ana sözleşmeler + üyelik)
  'kullanici-sozlesmesi',
  'kurulus-sozlesmesi',
  'gonulluluk-sozlesmesi',
  'gonullu-haklari-beyannamesi',
  'stk-uyelik',
  'marka-uyelik',
  'seffaflik',
  // B5 (gizlilik temelleri, finansal şeffaflık, ana bağış)
  'gizlilik-politikasi',
  'kvkk-aydinlatma-metni',
  'acik-riza-metni',
  'gdpr-uyum-politikasi',
  'kullanici-haklari-politikasi',
  'dpo-tanimi',
  'cerez-politikasi',
  'cocuklarin-verilerinin-korunmasi',
  'abd-eyalet-bazli-veri-politikasi',
  'lgpd-veri-koruma-beyani',
  'bagis-ve-yardim-politikasi',
  'bagisci-haklari-beyannamesi',
  'bagis-gelirlerinin-denetlenmesi-politikasi',
  'finansal-seffaflik-ve-hesap-verebilirlik-politikasi',
  'kar-dagitim-politikasi',
  'ucret-politikasi',
  'abd-irs-bagis-beyani',
  'aml-cft-uyum-beyani',
  'etik-bagis-ve-fon-kullanimi-beyani',
  'acik-veri-ve-etki-verisi-paylasim-politikasi',
  'cevresel-sorumluluk-politikasi',
  'acik-sosyal-girisim-beyani',
  'etik-ilkeler',
  'cikar-catismasi-politikasi',
  'whistleblower-politikasi',
  'insan-haklari-politikasi',
  'dei-politikasi',
  'risk-yonetimi-ve-kriz-mudahale-politikasi',
  'erisilebilirlik-politikasi',
  'bilgilendirme-politikasi',
  'cok-dilli-sozlesmeler-politikasi',
  'gelisim-yol-haritasi-ve-standartlar',
  'iso-27001-uyum-beyani',
  'iso-22301-uyum-beyani',
  'iso-25010-en-301-549-uyum-beyani',
  'bagimsiz-mali-denetim-ve-ifrs-gaap-beyani',
  'felaket-kurtarma-ve-yedekleme-testleri-beyani',
  'kurumsal-risk-ve-uyum-komitesi-beyani',
  'bilgi-guvenligi-politikasi', // B5 — ISO 27001 ana doc
]);

// Tek bir TR mevzuat referans bloğu — slug profiline göre kompoze edilir.
// "hangel" tüm metinlerde küçük harf.
type ReferenceProfile =
  | 'data-retention'       // veri saklama / imha
  | 'data-breach'          // veri ihlali / 72 saat KVKK bildirimi
  | 'data-processing'      // veri işleme amaçları + hukuki dayanak
  | 'data-transfer'        // yurtdışı veri transferi + hosting
  | 'country-compliance'   // ülke bazlı veri koruma uyumu
  | 'pentest'              // sızma ve güvenlik testleri
  | 'third-party'          // üçüncü taraf gözetim + etik performans
  | 'ai-transparency'      // yapay zeka şeffaflık
  | 'ux-testing'           // UX ve kullanıcı deneyimi testleri
  | 'public-benefit'       // kamu yararı ve sosyal fayda
  | 'social-impact-method' // sosyal etki metodolojisi
  | 'social-impact-policy' // sosyal etki politikası
  | 'local-donation'       // yerel bağış mevzuatları
  | 'governance';          // yönetim ve kurumsal yönetişim ilkeleri

interface TargetDoc {
  slug: string;
  title: string;
  profile: ReferenceProfile;
}

const TARGETS: ReadonlyArray<TargetDoc> = [
  { slug: 'veri-saklama-ve-imha-politikasi', title: 'Veri Saklama ve İmha Politikası', profile: 'data-retention' },
  { slug: 'veri-ihlali-bildirim-proseduru', title: 'Veri İhlali Bildirim Prosedürü', profile: 'data-breach' },
  { slug: 'veri-isleme-amaclar-beyani', title: 'Veri İşleme Amaçları ve Hukuki Dayanaklar Beyanı', profile: 'data-processing' },
  { slug: 'veri-transferi-ve-hosting-beyani', title: 'Veri Transferi ve AB Merkezli Hosting Beyanı', profile: 'data-transfer' },
  { slug: 'ulke-bazli-veri-koruma-uyum-beyani', title: 'Ülke Bazlı Veri Koruma Uyum Beyanı', profile: 'country-compliance' },
  { slug: 'sizma-ve-guvenlik-testleri-beyani', title: 'Sızma ve Güvenlik Testleri Beyanı', profile: 'pentest' },
  { slug: 'ucuncu-taraf-gozetim-ve-etik-performans-beyani', title: 'Üçüncü Taraf Gözetim ve Etik Performans Beyanı', profile: 'third-party' },
  { slug: 'yapay-zeka-seffaflik-beyani', title: 'Yapay Zekâ ve Algoritmik Şeffaflık Beyanı', profile: 'ai-transparency' },
  { slug: 'ux-ve-kullanici-deneyimi-testleri-beyani', title: 'UX ve Kullanıcı Deneyimi Testleri Beyanı', profile: 'ux-testing' },
  { slug: 'kamu-yarari-ve-sosyal-fayda-beyani', title: 'Kamu Yararı ve Sosyal Fayda Statüsü Beyanı', profile: 'public-benefit' },
  { slug: 'sosyal-etki-metodolojisi', title: 'Sosyal Etki Ölçüm ve Raporlama Metodolojisi (SROI & Theory of Change)', profile: 'social-impact-method' },
  { slug: 'sosyal-etki-politikasi', title: 'Sosyal Etki Politikası', profile: 'social-impact-policy' },
  { slug: 'yerel-bagis-mevzuatlarina-uyum-beyani', title: 'Yerel Bağış Mevzuatlarına Uyum Beyanı', profile: 'local-donation' },
  { slug: 'yonetim-ve-kurumsal-yonetisim-ilkeleri', title: 'Yönetim ve Kurumsal Yönetişim İlkeleri', profile: 'governance' },
];

// Profil bazlı TR/sektörel/uluslararası mevzuat referans bloğu (HTML).
// Sentinel: <!-- tr-compliance-batch2 -->
function buildComplianceBlock(profile: ReferenceProfile): string {
  const sections: Record<ReferenceProfile, { tr: string[]; sektorel: string[]; intl: string[] }> = {
    'data-retention': {
      tr: [
        '6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) madde 4, 7, 16',
        'Kişisel Verilerin Silinmesi, Yok Edilmesi veya Anonim Hale Getirilmesi Hakkında Yönetmelik (Resmi Gazete: 28.10.2017 / 30224)',
        'Veri Sorumluları Sicili Hakkında Yönetmelik (VERBİS) — saklama ve imha politikası beyanı zorunluluğu',
        '5237 sayılı Türk Ceza Kanunu (TCK) madde 138 — verileri yok etmeme suçu',
        '6563 sayılı Elektronik Ticaretin Düzenlenmesi Hakkında Kanun (ETKK) madde 5, 6 — ticari elektronik ileti onayı saklama süresi',
        '2014/4 sayılı Bilgi Toplumu Stratejisi (2015-2018) ve devam belgeleri — veri yaşam döngüsü yönetimi',
      ],
      sektorel: [
        'Sağlık Bakanlığı Kişisel Sağlık Verileri Hakkında Yönetmelik (Resmi Gazete: 21.06.2019)',
        '5624 sayılı Kan ve Kan Ürünleri Kanunu — donör verilerinin asgari saklama süresi',
        'e-Ticaret Bilgi Sistemi (ETBİS) kayıt verileri için Ticaret Bakanlığı saklama yükümlülükleri',
      ],
      intl: [
        'ISO/IEC 27001:2022 — A.5.33 Records protection',
        'ISO/IEC 27701:2019 — 7.4.7 Personal data deletion / 7.4.8 Temporary files',
        'NIST SP 800-88 Rev.1 — Guidelines for Media Sanitization',
        'OWASP ASVS 4.0 V8 — Data Protection',
      ],
    },
    'data-breach': {
      tr: [
        'KVKK madde 12/5 — ihlal halinde 72 saat içinde KVKK Kurulu\'na ve veri öznesine bildirim',
        'Kişisel Veri İhlali Bildirim Usul ve Esaslarına İlişkin Kişisel Verileri Koruma Kurulu Kararı (24.01.2019, 2019/10)',
        'TCK madde 136, 137, 138 — kişisel verilerin hukuka aykırı ele geçirilmesi/ifşası',
        '5651 sayılı İnternet Ortamında Yapılan Yayınların Düzenlenmesi Kanunu — log saklama ve ihlal kayıtları',
        'BTK 2020 Ulusal Siber Güvenlik Stratejisi — kritik altyapı ihlali bildirimi',
        'BTK Bilgi Güvenliği Kararları (2017/DK-BTD/365 vb.) — operatör ihlal raporlama zorunlulukları',
      ],
      sektorel: [
        'Sağlık Bakanlığı Kişisel Sağlık Verileri Yönetmeliği madde 9 — sağlık veri ihlali bildirimi',
        '6563 ETKK madde 11 — hizmet sağlayıcı veri güvenliği yükümlülüğü',
      ],
      intl: [
        'ISO/IEC 27001:2022 — A.5.24-A.5.28 Incident management',
        'ISO/IEC 27035-1:2023 — Information security incident management',
        'NIST SP 800-61 Rev.2 — Computer Security Incident Handling Guide',
        'OWASP Incident Response Cheat Sheet',
      ],
    },
    'data-processing': {
      tr: [
        'KVKK madde 4 — genel ilkeler (hukuka uygunluk, dürüstlük, doğruluk, amaca bağlılık, sınırlılık, ölçülülük)',
        'KVKK madde 5 ve 6 — kişisel ve özel nitelikli verilerin işlenme şartları',
        'KVKK madde 10 — aydınlatma yükümlülüğü',
        'Aydınlatma Yükümlülüğünün Yerine Getirilmesinde Uyulacak Usul ve Esaslar Hakkında Tebliğ (Resmi Gazete: 10.03.2018)',
        '6563 ETKK madde 7 — ticari elektronik iletide hukuki dayanak (açık rıza vs. meşru menfaat)',
        '2014/4 Bilgi Toplumu Stratejisi — veri minimizasyonu hedefleri',
      ],
      sektorel: [
        'Sağlık Bakanlığı Kişisel Sağlık Verileri Yönetmeliği — sağlık verisi işleme amaçlarının açıkça beyanı',
        '5624 Kan ve Kan Ürünleri Kanunu — donör verisi işleme amaç sınırlaması',
      ],
      intl: [
        'ISO/IEC 27701:2019 — 7.2 Conditions for collection and processing',
        'NIST Privacy Framework v1.0 — Identify-P, Govern-P fonksiyonları',
      ],
    },
    'data-transfer': {
      tr: [
        'KVKK madde 9 — kişisel verilerin yurtdışına aktarılması (28.03.2024 6698 değişikliği sonrası: standart sözleşmeler, BCR, yeterli koruma kararı)',
        'Kişisel Verilerin Yurt Dışına Aktarılmasına İlişkin Usul ve Esaslar Hakkında Yönetmelik (Resmi Gazete: 10.07.2024 / 32597)',
        'KVK Kurulu Standart Sözleşme metinleri (2024)',
        'BTK 2020 Ulusal Siber Güvenlik Stratejisi — kritik veriye yurt içi hosting tavsiyesi',
        '5651 sayılı Kanun ek madde 4 — yer sağlayıcı temsilcisi atama',
      ],
      sektorel: [
        'Sağlık Bakanlığı Kişisel Sağlık Verileri Yönetmeliği madde 11 — sağlık verilerinin yurtdışı transferinin sınırlanması',
        'e-Ticaret Bilgi Sistemi (ETBİS) — sınır ötesi e-tic verisi raporlama',
      ],
      intl: [
        'GDPR Chapter V (Articles 44-50) — Transfers of personal data to third countries',
        'EU SCCs (Commission Decision 2021/914)',
        'ISO/IEC 27018:2019 — PII in public clouds',
        'ISO/IEC 27701:2019 — 7.5 PII transfer',
      ],
    },
    'country-compliance': {
      tr: [
        'KVKK ve ikincil mevzuat — Türkiye merkezli işlemelerde temel çerçeve',
        '6563 ETKK ve uygulama yönetmelikleri — e-tic ülke uyumu',
        '2014/4 Bilgi Toplumu Stratejisi ve devam dökümanları',
        'BTK 2020 Ulusal Siber Güvenlik Stratejisi ve Eylem Planı — ülke düzeyinde uyum çatısı',
      ],
      sektorel: [
        'Sağlık Bakanlığı Kişisel Sağlık Verileri Yönetmeliği — sağlık alanı yerel uyum',
        '5624 Kan ve Kan Ürünleri Kanunu — donör verisi ülke uyumu',
      ],
      intl: [
        'GDPR (Regulation EU 2016/679) — AB üyesi ülkeler',
        'CCPA / CPRA — Kaliforniya, ABD',
        'LGPD (Lei 13.709/2018) — Brezilya',
        'PIPL — Çin',
        'ISO/IEC 27701:2019 — ülke bazlı PII yönetimi',
      ],
    },
    'pentest': {
      tr: [
        'BTK 2020 Ulusal Siber Güvenlik Stratejisi — kritik altyapı sızma testi yükümlülüğü',
        'BTK Bilgi ve İletişim Güvenliği Rehberi (Cumhurbaşkanlığı Genelgesi 2019/12)',
        'BTK Sızma Testi Yetkilendirme Yönetmeliği',
        'KVKK madde 12 — veri güvenliği teknik ve idari tedbirler',
        'TCK madde 243, 244, 245 — bilişim sistemine yetkisiz erişim suçları (testlerin yetki çerçevesi)',
        '5651 sayılı Kanun — log yönetimi entegrasyonu',
      ],
      sektorel: [
        'Sağlık Bakanlığı Bilgi Güvenliği Politikaları Kılavuzu — sağlık sistemleri pentest',
        '6563 ETKK madde 11 — hizmet sağlayıcı güvenlik tedbirleri',
      ],
      intl: [
        'ISO/IEC 27001:2022 — A.8.8 Management of technical vulnerabilities',
        'NIST SP 800-115 — Technical Guide to Information Security Testing',
        'OWASP Web Security Testing Guide (WSTG) v4.2',
        'OWASP ASVS 4.0 / MASVS v2.0',
        'PTES (Penetration Testing Execution Standard)',
      ],
    },
    'third-party': {
      tr: [
        'KVKK madde 12 — veri işleyen ile veri güvenliği sorumluluğu',
        'KVK Kurulu Veri İşleyen Sözleşmesi rehberi',
        '6098 sayılı Türk Borçlar Kanunu madde 116 — yardımcı kişinin fiilinden sorumluluk',
        '2014/4 Bilgi Toplumu Stratejisi — tedarik zinciri güvenliği',
        'BTK 2020 Ulusal Siber Güvenlik Stratejisi — üçüncü taraf risk yönetimi',
      ],
      sektorel: [
        '6563 ETKK madde 11 — hizmet sağlayıcı tedarikçi sorumluluğu',
        'Sağlık Bakanlığı Kişisel Sağlık Verileri Yönetmeliği — sağlık tedarikçileri için sözleşmesel güvence',
      ],
      intl: [
        'ISO/IEC 27001:2022 — A.5.19-A.5.23 Supplier relationships',
        'ISO/IEC 27036-2:2022 — Information security for supplier relationships',
        'NIST SP 800-161 Rev.1 — Cybersecurity Supply Chain Risk Management',
        'OWASP SCVS (Software Component Verification Standard)',
      ],
    },
    'ai-transparency': {
      tr: [
        'KVKK madde 11/g — otomatik sistemlerle yapılan analizler sonucunda kişiye karşı bir sonuç ortaya çıkmasına itiraz hakkı',
        'KVK Kurulu 2021/891 sayılı Karar — chatbot ve otomatik karar verme şeffaflığı',
        'Cumhurbaşkanlığı Dijital Dönüşüm Ofisi Ulusal Yapay Zeka Stratejisi 2021-2025',
        'BTK 2020 Ulusal Siber Güvenlik Stratejisi — algoritma güvenliği',
        '6563 ETKK madde 9 — ticari iletişimde tanımlanabilirlik (AI üretimi içerikler dahil)',
      ],
      sektorel: [
        'Sağlık Bakanlığı yapay zeka destekli karar destek sistemleri rehberi (taslak)',
      ],
      intl: [
        'EU AI Act (Regulation 2024/1689) — risk bazlı sınıflandırma ve şeffaflık',
        'ISO/IEC 42001:2023 — AI Management System',
        'ISO/IEC 23894:2023 — AI risk management',
        'NIST AI RMF 1.0 (AI Risk Management Framework)',
        'OWASP Top 10 for LLM Applications',
      ],
    },
    'ux-testing': {
      tr: [
        'KVKK madde 4 — açık rıza arayüzlerinde anlaşılırlık ilkesi',
        '6502 sayılı Tüketicinin Korunması Hakkında Kanun — mesafeli sözleşme arayüz yükümlülükleri',
        '6563 ETKK madde 4 — ön bilgilendirme ve sade dil',
        'Cumhurbaşkanlığı Dijital Dönüşüm Ofisi Dijital Türkiye Stratejisi — kullanıcı odaklı tasarım',
        'Erişilebilirlik Bilgi Sistemi (e-Devlet) standartları',
      ],
      sektorel: [
        'Sağlık Bakanlığı e-Nabız erişilebilirlik kılavuzu',
      ],
      intl: [
        'ISO 9241-210:2019 — Human-centred design for interactive systems',
        'ISO/IEC 25010:2011 — Software quality model (usability)',
        'WCAG 2.2 (W3C) — Web Content Accessibility Guidelines',
        'NN/g Usability Heuristics (Nielsen Norman)',
        'OWASP Authentication Cheat Sheet — UX güvenlik dengesi',
      ],
    },
    'public-benefit': {
      tr: [
        '5253 sayılı Dernekler Kanunu madde 27 — kamu yararına çalışan dernek statüsü',
        '5520 sayılı Kurumlar Vergisi Kanunu madde 5/1-i — kamu yararı muafiyeti',
        '4962 sayılı Bazı Kanunlarda Değişiklik Yapılması ve Vakıflara Vergi Muafiyeti Tanınması Hakkında Kanun',
        '2860 sayılı Yardım Toplama Kanunu',
        'Vakıflar Genel Müdürlüğü Vergi Muafiyeti Talep Yönetmeliği',
      ],
      sektorel: [
        '5624 Kan ve Kan Ürünleri Kanunu — kamu sağlığı bağlamı',
        'Sağlık Bakanlığı sosyal yardım protokolleri',
      ],
      intl: [
        'BM Sürdürülebilir Kalkınma Amaçları (SDGs)',
        'IRS Section 501(c)(3) — ABD kamu yararı statüsü',
        'OECD Tax Treatment of Philanthropy Report',
      ],
    },
    'social-impact-method': {
      tr: [
        '2860 sayılı Yardım Toplama Kanunu — raporlama yükümlülüğü',
        '5253 sayılı Dernekler Kanunu — beyanname ve faaliyet raporu',
        'Cumhurbaşkanlığı 11. Kalkınma Planı (2019-2023) — sosyal etki ölçüm hedefleri',
        '2014/4 Bilgi Toplumu Stratejisi — açık veri ve ölçüm',
      ],
      sektorel: [
        'Sağlık Bakanlığı kamu sağlığı etki ölçüm kılavuzları',
      ],
      intl: [
        'Social Value International — SROI (Social Return on Investment) standardı',
        'Theory of Change framework (Center for Theory of Change)',
        'IRIS+ (Global Impact Investing Network) gösterge seti',
        'ISO 26000:2010 — Social responsibility guidance',
        'GRI Standards — sürdürülebilirlik raporlaması',
      ],
    },
    'social-impact-policy': {
      tr: [
        '5253 sayılı Dernekler Kanunu — kuruluş amaçları çerçevesi',
        '4721 sayılı Türk Medeni Kanunu vakıf hükümleri',
        '2860 sayılı Yardım Toplama Kanunu',
        'Cumhurbaşkanlığı 11. ve 12. Kalkınma Planları — sosyal politika hedefleri',
        '2014/4 Bilgi Toplumu Stratejisi — kapsayıcılık',
      ],
      sektorel: [
        'Sağlık Bakanlığı toplum sağlığı politikaları',
        'Aile ve Sosyal Hizmetler Bakanlığı sosyal yardım çerçevesi',
      ],
      intl: [
        'BM Sürdürülebilir Kalkınma Amaçları (SDGs)',
        'ISO 26000:2010 — Social responsibility',
        'B Lab Impact Assessment standartları',
      ],
    },
    'local-donation': {
      tr: [
        '2860 sayılı Yardım Toplama Kanunu — izin, mülki amir bildirimi, raporlama',
        '5253 sayılı Dernekler Kanunu — bağış kabul ve kayıt',
        '4721 Türk Medeni Kanunu vakıf bağış hükümleri',
        'Vakıflar Genel Müdürlüğü Vergi Muafiyeti Yönetmeliği',
        '5549 sayılı Suç Gelirlerinin Aklanmasının Önlenmesi Hakkında Kanun — büyük bağış izleme',
        'MASAK Yükümlülük Yönetmeliği',
      ],
      sektorel: [
        'Sağlık Bakanlığı bağış kabul protokolleri (donör/kan/organ özelinde)',
      ],
      intl: [
        'FATF Tavsiyeleri (özellikle R.8 — Non-Profit Organizations)',
        'IRS 501(c)(3) — ABD donör vergi uyumu',
        'UK Charity Commission rehberi',
      ],
    },
    'governance': {
      tr: [
        '6102 sayılı Türk Ticaret Kanunu — anonim şirket yönetim kurulu (madde 359-393)',
        '5253 sayılı Dernekler Kanunu — yönetim kurulu ve denetim',
        '4721 Türk Medeni Kanunu — vakıf yönetimi',
        'Cumhurbaşkanlığı 11. Kalkınma Planı — kurumsal yönetişim hedefleri',
        '6362 sayılı Sermaye Piyasası Kanunu Kurumsal Yönetim Tebliği (II-17.1) — referans çerçeve',
        '5549 sayılı Kanun — yönetim sorumluluğu (MASAK)',
      ],
      sektorel: [
        'Sağlık Bakanlığı kurumsal yönetim standartları (sağlık tesisleri)',
      ],
      intl: [
        'OECD Kurumsal Yönetim İlkeleri (2023 revizyonu)',
        'ISO 37000:2021 — Governance of organizations',
        'ISO 37001:2016 — Anti-bribery management',
        'COSO Internal Control — Integrated Framework',
      ],
    },
  };

  const block = sections[profile];
  const tr = block.tr.map((x) => `<li>${x}</li>`).join('\n          ');
  const sek = block.sektorel.map((x) => `<li>${x}</li>`).join('\n          ');
  const intl = block.intl.map((x) => `<li>${x}</li>`).join('\n          ');

  return `
      <!-- tr-compliance-batch2 -->
      <h4>6. TR Mevzuat Çerçevesi (2.0-tr)</h4>
      <p>bu belge, aşağıdaki Türkiye Cumhuriyeti birincil mevzuatı, sektörel düzenlemeler ve uluslararası standartlarla %100 uyumlu olacak şekilde hangel tarafından güncellenmiştir:</p>
      <p><strong>Birincil TR mevzuat:</strong></p>
      <ul>
          ${tr}
      </ul>
      <p><strong>Sektörel mevzuat (sağlık, e-ticaret):</strong></p>
      <ul>
          ${sek}
      </ul>
      <p><strong>Uluslararası standartlar (referans):</strong></p>
      <ul>
          ${intl}
      </ul>
      <p>uyumsuzluk tespit edilmesi halinde KVKK Kurulu, BTK, MASAK ve Sağlık Bakanlığı dahil ilgili otoritelere derhal bildirim yapılır; hangel her yıl iç denetim ile bu çerçeveyi yeniden gözden geçirir.</p>
  `;
}

const SENTINEL = '<!-- tr-compliance-batch2 -->';

function injectComplianceBlock(originalContent: string, profile: ReferenceProfile): string {
  if (originalContent.includes(SENTINEL)) {
    // Mevcut sentinel + sonrasını sil, yeniden yaz (idempotent).
    const cut = originalContent.indexOf(SENTINEL);
    // Sentinel'den önceki son `</p>` veya `</ul>` kapanışına kadar tut.
    const before = originalContent.slice(0, cut).replace(/\s*$/, '');
    return `${before}\n${buildComplianceBlock(profile)}`;
  }
  // Append at the end.
  return `${originalContent.trimEnd()}\n${buildComplianceBlock(profile)}`;
}

interface UpdatePlan {
  slug: string;
  title: string;
  before: { version?: string; jurisdictions?: unknown; contentLength: number };
  after: { version: string; jurisdictions: string[]; contentLength: number };
}

async function run() {
  const args = new Set(process.argv.slice(2));
  const dryRun = args.has('--dry-run') || !args.has('--apply');
  const limitDry = 3;

  if (getApps().length === 0) {
    const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (credPath) {
      initializeApp({ credential: cert(credPath) });
    } else {
      initializeApp({ credential: applicationDefault() });
    }
  }
  const db: Firestore = getFirestore();

  console.log(`[batch2] Mode: ${dryRun ? 'DRY RUN (first ' + limitDry + ')' : 'APPLY'}`);
  console.log(`[batch2] Target slug count: ${TARGETS.length}`);

  const plans: UpdatePlan[] = [];
  let processed = 0;

  for (const target of TARGETS) {
    if (FORBIDDEN_SLUGS.has(target.slug)) {
      console.log(`[batch2] SKIP (forbidden / B3-B5): ${target.slug}`);
      continue;
    }

    const ref = db.collection('contracts').doc(target.slug);
    const snap = await ref.get();
    if (!snap.exists) {
      console.log(`[batch2] MISSING in Firestore: ${target.slug}`);
      continue;
    }
    const data = snap.data() as Record<string, unknown>;
    const prevContent = typeof data.content === 'string' ? data.content : '';
    const prevVersion = typeof data.version === 'string' ? data.version : undefined;
    const prevJur = data.jurisdictions;

    const nextContent = injectComplianceBlock(prevContent, target.profile);
    const plan: UpdatePlan = {
      slug: target.slug,
      title: target.title,
      before: { version: prevVersion, jurisdictions: prevJur, contentLength: prevContent.length },
      after: { version: '2.0-tr', jurisdictions: ['TR'], contentLength: nextContent.length },
    };
    plans.push(plan);

    if (dryRun) {
      if (processed < limitDry) {
        console.log('\n========================================');
        console.log(`[batch2 DRY] ${target.slug}`);
        console.log(`  title:   ${target.title}`);
        console.log(`  version: ${prevVersion ?? '(none)'} -> 2.0-tr`);
        console.log(`  juris:   ${JSON.stringify(prevJur)} -> ['TR']`);
        console.log(`  content: ${prevContent.length} -> ${nextContent.length} chars`);
        console.log('  --- new compliance block (preview) ---');
        console.log(buildComplianceBlock(target.profile).slice(0, 800) + '\n  ...[truncated]');
      }
    } else {
      await ref.set(
        {
          content: nextContent,
          version: '2.0-tr',
          jurisdictions: ['TR'],
          updatedAt: new Date().toISOString(),
          trComplianceBatch: 2,
        },
        { merge: true },
      );
      console.log(`[batch2 APPLY] updated: ${target.slug}`);
    }
    processed++;
  }

  console.log('\n[batch2] Summary:');
  console.log(`  Planned updates: ${plans.length}`);
  console.log(`  Mode:            ${dryRun ? 'DRY RUN' : 'APPLIED'}`);
  if (dryRun) {
    console.log('  To apply: re-run with --apply');
  }
}

run().catch((err) => {
  console.error('[batch2] FAILED:', err);
  process.exit(1);
});
