/**
 * Agent 5/10 — TR Mevzuat %100 Uyum: Batch 3 (~25 niş/uluslararası doc)
 *
 * Bu script Firestore `contracts` koleksiyonunda Batch 1/2 ve Batch 4'te
 * ele alınmayan KALAN tüm dokümanları günceller. Her doc için:
 *
 *   1. TR mevzuat hattıyla bağlantı (bridge note) — KVKK / GVK / Kan Hizmetleri /
 *      STK mevzuatına çapraz referans.
 *   2. Çapraz-referans linkleri (slug bazlı).
 *   3. version: '2.0-tr-bridge' veya '2.0-global'.
 *   4. jurisdictions: doc'a uygun (ör. ['US','TR-bridge'], ['LATAM','TR-bridge']).
 *   5. "hangel" KÜÇÜK HARF — kullanıcıya gösterilen metinlerde.
 *
 * Tüm yazma işlemleri `{ merge: true }` ile yapılır → eksik alan yaratır, mevcut
 * içerik (html / markdown body) korunur. Doc Firestore'da yoksa minimal
 * placeholder ile oluşturulur ve `placeholder: true` flag'i konur (yeni doc
 * önerileri için ayrı liste tutulur — sondaki MISSING_SUGGESTIONS).
 *
 * Çalıştırma:
 *   GOOGLE_APPLICATION_CREDENTIALS=./.firebase-service-account.json \
 *     npx tsx scripts/contracts-tr-compliance-batch3.ts [--dry-run]
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// ---------------------------------------------------------------------------
// Block-list — B3/B4 ve daha önce işlenen doc'lara DOKUNULMAZ.
// Bu liste defansif; B3/B4 ajanları kendi script'lerinde aynı slug'ları
// yazıyor olabilir → idempotent ve çakışmasız kalmak için skip ediyoruz.
// ---------------------------------------------------------------------------
const BLOCKLIST_B3_B4 = new Set<string>([
  // Batch 1 (TR çekirdek)
  'tr-kullanici-sozlesmesi',
  'tr-gizlilik-politikasi',
  'tr-kvkk-aydinlatma',
  'tr-cerez-politikasi',
  'tr-bagisci-sozlesmesi',
  'tr-gonullu-sozlesmesi',
  'tr-gonulluluk-sozlesmesi',
  'tr-acik-riza-saglik-verisi',
  'tr-acik-riza-pazarlama',
  'tr-stk-uyelik-sozlesmesi',
  // Batch 2 (EU çekirdek)
  'eu-terms-of-service',
  'eu-privacy-policy',
  'eu-cookie-policy',
  'eu-ai-act-statement',
  'eu-dsa-compliance',
  'eu-dpia-template',
  'eu-donor-agreement',
  'eu-volunteer-agreement',
  'eu-child-data-policy',
  // Batch 4 (UK + niş EU üye-devlet supplementleri)
  'uk-privacy-policy',
  'uk-terms-of-service',
  'uk-cookie-policy',
  'uk-donor-agreement',
  'uk-volunteer-agreement',
  'uk-child-data-policy',
  'de-bdsg-supplement',
  'es-lopdgdd-supplement',
  'fr-loi-informatique-libertes',
  'it-codice-privacy',
  // Eski legacy
  'kullanici-sozlesmesi',
  'gizlilik-politikasi',
]);

// ---------------------------------------------------------------------------
// Batch 3 hedef listesi — ABD eyalet, IRS, LATAM, APAC, MENA, vs. + bağış/
// gönüllü/kampanya işleyişine dair kalan niş doc'lar.
// ---------------------------------------------------------------------------

interface BridgeDoc {
  slug: string;
  title: string;
  version: '2.0-tr-bridge' | '2.0-global';
  jurisdictions: string[];
  /** TR ile arayüz notu (kullanıcıya gösterilir, hangel lowercase). */
  trBridgeNote: string;
  /** İlişkili TR slug'ları — admin UI'de "ilgili dokümanlar" bloğu için. */
  relatedSlugs: string[];
  /** Kısa açıklama / scope. */
  summary: string;
}

const BATCH3_DOCS: BridgeDoc[] = [
  // ---------- ABD ----------
  {
    slug: 'abd-eyalet-bazli-veri-politikasi',
    title: 'ABD Eyalet Bazlı Veri Koruma Bildirimi (CCPA dışı eyaletler)',
    version: '2.0-tr-bridge',
    jurisdictions: ['US-OTHER', 'TR-bridge'],
    trBridgeNote:
      'Bu metin ABD vatandaşları (CA dışı eyaletler — VA CDPA, CO CPA, CT CTDPA, UT UCPA, TX TDPSA vs.) içindir. ' +
      'Türkiye Cumhuriyeti vatandaşları için bkz. KVKK Aydınlatma Metni (tr-kvkk-aydinlatma) ve Gizlilik Politikası (tr-gizlilik-politikasi). ' +
      'Eyalet özelliği (right to opt-out / cure period / sensitive data) ABD-spesifik ek metinde işlenir.',
    relatedSlugs: ['tr-kvkk-aydinlatma', 'tr-gizlilik-politikasi', 'us-california-privacy-notice'],
    summary: 'ABD CA dışı eyalet privacy haklarına genel çerçeve; eyalet detayları Agent 7 (A7) ABD özel metni içinde.',
  },
  {
    slug: 'abd-irs-bagis-beyani',
    title: 'ABD IRS Bağış Beyanı (501(c)(3) Charitable Contribution Acknowledgement)',
    version: '2.0-tr-bridge',
    jurisdictions: ['US-OTHER', 'US-CA', 'TR-bridge'],
    trBridgeNote:
      'Bu belge ABD vergi mükellefi bağışçılar için IRS Publication 1771 uyarınca düzenlenir (≥$250 contemporaneous written acknowledgment). ' +
      'Türkiye Cumhuriyeti vatandaşı bağışçılar için GVK m.89/4 ve KVK m.10/c kapsamındaki vergi indirim beyanı: bkz. tr-bagisci-sozlesmesi. ' +
      'hangel ABD\'de 501(c)(3) statüsünde DEĞİL → yalnızca fiscal sponsor veya hangel Inc. (Delaware) varlığı üzerinden geçerlidir.',
    relatedSlugs: ['tr-bagisci-sozlesmesi', 'us-donor-agreement', 'eu-donor-agreement'],
    summary: 'IRS Publication 1771 + Form 8283 uyumlu bağış teşekkür ve değer beyanı şablonu.',
  },
  {
    slug: 'us-coppa-notice',
    title: 'COPPA Children\'s Online Privacy Notice',
    version: '2.0-tr-bridge',
    jurisdictions: ['US-OTHER', 'US-CA', 'TR-bridge'],
    trBridgeNote:
      'Bu bildirim 13 yaş altı ABD\'li çocuklar için COPPA (15 USC §6501 vd.) uyarınca düzenlenir. ' +
      'TR\'de 18 yaş altı kullanıcılar için KVKK m.6 (özel nitelikli veri — çocuğun sağlık/etnik bilgisi) ve ' +
      'Çocuk Koruma Kanunu (5395) hükümleri uygulanır: bkz. tr-acik-riza-saglik-verisi. ' +
      'hangel TR\'de 18+ yaş şartı koyar; 13–17 yaş ebeveyn açık rızası ile sınırlı modda.',
    relatedSlugs: ['tr-acik-riza-saglik-verisi', 'tr-kvkk-aydinlatma', 'eu-child-data-policy'],
    summary: '13- yaş ABD\'li kullanıcılar için ebeveyn rızası akışı, verifiable parental consent yöntemleri, sınırlı kullanım kapsamı.',
  },
  {
    slug: 'us-california-privacy-notice',
    title: 'California Consumer Privacy Notice (CCPA / CPRA)',
    version: '2.0-tr-bridge',
    jurisdictions: ['US-CA', 'TR-bridge'],
    trBridgeNote:
      'Bu bildirim California sakinleri içindir (CCPA Cal. Civ. Code §1798.100 vd., CPRA değişiklikleriyle). ' +
      'Türkiye Cumhuriyeti vatandaşı kullanıcılar bu metnin kapsamı DIŞINDADIR — KVKK haklarınız için bkz. tr-kvkk-aydinlatma. ' +
      'Right to know / delete / correct / opt-out of sale CA-only haklardır.',
    relatedSlugs: ['tr-kvkk-aydinlatma', 'abd-eyalet-bazli-veri-politikasi', 'us-coppa-notice'],
    summary: 'CCPA/CPRA Notice at Collection + Right to Know/Delete/Correct/Opt-out of Sale akışları.',
  },
  // ---------- LATAM ----------
  {
    slug: 'lgpd-veri-koruma-beyani',
    title: 'Brezilya LGPD Veri Koruma Beyanı (Lei 13.709/2018)',
    version: '2.0-tr-bridge',
    jurisdictions: ['LATAM', 'TR-bridge'],
    trBridgeNote:
      'Bu beyan Brezilya sakinleri için LGPD (Lei Geral de Proteção de Dados, 13.709/2018) uyarınca düzenlenir. ' +
      'Türkiye Cumhuriyeti vatandaşları için aynı amaca hizmet eden metin: tr-kvkk-aydinlatma (KVKK 6698). ' +
      'ANPD (Autoridade Nacional de Proteção de Dados) ile bizim Kişisel Verileri Koruma Kurulu (KVKK) muadildir; ' +
      'veri sahibi haklarının çerçevesi büyük ölçüde örtüşür ama ANPD-spesifik şikayet kanalı buradadır.',
    relatedSlugs: ['tr-kvkk-aydinlatma', 'eu-privacy-policy'],
    summary: 'LGPD bases legais (consent, contract, legitimate interest), DPO, ANPD bildirimi, veri sahibi 9 hakkı.',
  },
  {
    slug: 'mexico-lfpdppp-beyani',
    title: 'Meksika LFPDPPP Veri Koruma Beyanı',
    version: '2.0-tr-bridge',
    jurisdictions: ['LATAM', 'TR-bridge'],
    trBridgeNote:
      'Bu metin Meksika sakinleri için LFPDPPP (Ley Federal de Protección de Datos Personales en Posesión de los Particulares) uyarınca düzenlenir. ' +
      'TR vatandaşları için bkz. tr-kvkk-aydinlatma. INAI bizim KVK Kurulu muadilidir.',
    relatedSlugs: ['tr-kvkk-aydinlatma', 'lgpd-veri-koruma-beyani'],
    summary: 'Aviso de Privacidad, ARCO hakları (Acceso/Rectificación/Cancelación/Oposición), INAI şikayet.',
  },
  {
    slug: 'argentina-pdpa-beyani',
    title: 'Arjantin PDPA Veri Koruma Beyanı (Ley 25.326)',
    version: '2.0-tr-bridge',
    jurisdictions: ['LATAM', 'TR-bridge'],
    trBridgeNote:
      'Arjantin Ley 25.326 (PDPA) uyarınca düzenlenmiştir; AAIP yetkili otoritedir. ' +
      'TR vatandaşları için bkz. tr-kvkk-aydinlatma.',
    relatedSlugs: ['tr-kvkk-aydinlatma', 'lgpd-veri-koruma-beyani'],
    summary: 'AAIP bildirimi, registro de bases de datos, veri sahibi hakları.',
  },
  // ---------- APAC ----------
  {
    slug: 'japonya-appi-beyani',
    title: 'Japonya APPI Veri Koruma Beyanı',
    version: '2.0-tr-bridge',
    jurisdictions: ['APAC', 'TR-bridge'],
    trBridgeNote:
      'Bu metin Japonya sakinleri için Act on the Protection of Personal Information (APPI) uyarınca düzenlenir. ' +
      'TR vatandaşları için bkz. tr-kvkk-aydinlatma. PPC (Personal Information Protection Commission) bizim KVKK muadilidir.',
    relatedSlugs: ['tr-kvkk-aydinlatma', 'singapore-pdpa-beyani'],
    summary: 'APPI 2022 değişiklikleri (cross-border transfer, breach notification 5 gün), opt-out for third-party sharing.',
  },
  {
    slug: 'singapore-pdpa-beyani',
    title: 'Singapur PDPA Veri Koruma Beyanı',
    version: '2.0-tr-bridge',
    jurisdictions: ['APAC', 'TR-bridge'],
    trBridgeNote:
      'Bu metin Singapur sakinleri için Personal Data Protection Act 2012 uyarınca düzenlenir. ' +
      'TR vatandaşları için bkz. tr-kvkk-aydinlatma. PDPC yetkili otoritedir.',
    relatedSlugs: ['tr-kvkk-aydinlatma', 'japonya-appi-beyani'],
    summary: 'PDPA consent obligation, purpose limitation, notification obligation, DNC Registry.',
  },
  {
    slug: 'avustralya-privacy-act-beyani',
    title: 'Avustralya Privacy Act 1988 Veri Koruma Beyanı',
    version: '2.0-tr-bridge',
    jurisdictions: ['APAC', 'TR-bridge'],
    trBridgeNote:
      'Avustralya Privacy Act 1988 ve 13 Australian Privacy Principles (APPs) uyarınca düzenlenir. ' +
      'TR vatandaşları için bkz. tr-kvkk-aydinlatma. OAIC yetkili otoritedir.',
    relatedSlugs: ['tr-kvkk-aydinlatma'],
    summary: '13 APP, Notifiable Data Breaches scheme, sensitive information consent.',
  },
  // ---------- MENA / GCC ----------
  {
    slug: 'suudi-arabistan-pdpl-beyani',
    title: 'Suudi Arabistan PDPL Veri Koruma Beyanı',
    version: '2.0-tr-bridge',
    jurisdictions: ['MENA', 'TR-bridge'],
    trBridgeNote:
      'Bu metin KSA sakinleri için Personal Data Protection Law (Royal Decree M/19) uyarınca düzenlenir. ' +
      'TR vatandaşları için bkz. tr-kvkk-aydinlatma. SDAIA yetkili otoritedir.',
    relatedSlugs: ['tr-kvkk-aydinlatma', 'bae-pdpl-beyani'],
    summary: 'PDPL ihlal bildirimi (72 saat SDAIA + veri sahibi), cross-border transfer izni, dini/sağlık verisi özel rejim.',
  },
  {
    slug: 'bae-pdpl-beyani',
    title: 'BAE Federal PDPL Veri Koruma Beyanı (45/2021)',
    version: '2.0-tr-bridge',
    jurisdictions: ['MENA', 'TR-bridge'],
    trBridgeNote:
      'BAE Federal Decree-Law 45/2021 uyarınca düzenlenir; DIFC ve ADGM serbest bölge rejimleri ayrı tutulur. ' +
      'TR vatandaşları için bkz. tr-kvkk-aydinlatma.',
    relatedSlugs: ['tr-kvkk-aydinlatma', 'suudi-arabistan-pdpl-beyani'],
    summary: 'UAE DPO atama, cross-border, breach notification, DIFC/ADGM ayrımı.',
  },
  // ---------- Kanada ----------
  {
    slug: 'kanada-pipeda-beyani',
    title: 'Kanada PIPEDA Veri Koruma Beyanı',
    version: '2.0-tr-bridge',
    jurisdictions: ['CA', 'TR-bridge'],
    trBridgeNote:
      'Kanada Personal Information Protection and Electronic Documents Act (PIPEDA) uyarınca düzenlenir. ' +
      'Quebec için Law 25 (Bill 64) özel rejim uygulanır. TR vatandaşları için bkz. tr-kvkk-aydinlatma.',
    relatedSlugs: ['tr-kvkk-aydinlatma', 'us-california-privacy-notice'],
    summary: 'PIPEDA 10 fair information principles, OPC şikayet, Quebec Law 25 ek hükümler.',
  },
  // ---------- Bağış / kampanya / gönüllü ek doc'lar ----------
  {
    slug: 'kampanya-katilim-sartlari',
    title: 'Kampanya Katılım Şartları (hangel kampanyaları)',
    version: '2.0-tr-bridge',
    jurisdictions: ['TR', 'TR-bridge'],
    trBridgeNote:
      'Bu metin hangel üzerinde STK kampanyalarına katılan kullanıcılar için TR mevzuatına göre düzenlenir: ' +
      'Yardım Toplama Kanunu (2860), Dernekler Kanunu (5253), Tüketicinin Korunması Hakkında Kanun (6502 — mesafeli sözleşme), ' +
      'BSMV/KDV muafiyetleri. Kişisel veri için bkz. tr-kvkk-aydinlatma; bağış akışı için tr-bagisci-sozlesmesi.',
    relatedSlugs: ['tr-bagisci-sozlesmesi', 'tr-kvkk-aydinlatma', 'tr-stk-uyelik-sozlesmesi'],
    summary: 'Kampanya katılımı, çekiliş/ödül kuralları, iade, MASAK eşik bildirimi.',
  },
  {
    slug: 'gonullu-saglik-beyani',
    title: 'Gönüllü Sağlık Beyanı (saha görevleri için)',
    version: '2.0-tr-bridge',
    jurisdictions: ['TR', 'TR-bridge'],
    trBridgeNote:
      'Sahada fiziksel görev (afet, taşıma, sağlık desteği) yapan gönüllüler için KVKK m.6 özel nitelikli sağlık verisi kapsamında ' +
      'AÇIK RIZA gerektirir. Detaylı rıza metni: tr-acik-riza-saglik-verisi. Gönüllü genel sözleşmesi: tr-gonullu-sozlesmesi. ' +
      '6331 sayılı İş Sağlığı ve Güvenliği Kanunu kapsamında STK\'ya bildirilir.',
    relatedSlugs: ['tr-acik-riza-saglik-verisi', 'tr-gonullu-sozlesmesi', 'tr-kvkk-aydinlatma'],
    summary: 'Saha gönüllüsü sağlık beyanı, alerji, kronik hastalık, acil iletişim — saklama 5 yıl.',
  },
  {
    slug: 'kan-bagisi-rıza-metni',
    title: 'Kan Bağışı / Acil Kan Çağrısı Açık Rıza Metni',
    version: '2.0-tr-bridge',
    jurisdictions: ['TR', 'TR-bridge'],
    trBridgeNote:
      'Kan grubu KVKK m.6 kapsamında ÖZEL NİTELİKLİ kişisel veridir. Bu rıza Kızılay + Sağlık Bakanlığı ' +
      'Kan Hizmetleri Kanunu (5624) çerçevesindedir. Genel sağlık verisi rızası: tr-acik-riza-saglik-verisi. ' +
      'Pazarlama amaçlı kullanım YASAKTIR — sadece acil çağrı eşleştirmesi.',
    relatedSlugs: ['tr-acik-riza-saglik-verisi', 'tr-kvkk-aydinlatma'],
    summary: 'Kan grubu beyanı, acil çağrı opt-in, geolocation, eşleşme bildirim kanalı (push/SMS).',
  },
  {
    slug: 'afet-gonullusu-sozlesmesi',
    title: 'Afet Gönüllüsü Sözleşmesi (AFAD koordinasyonu)',
    version: '2.0-tr-bridge',
    jurisdictions: ['TR', 'TR-bridge'],
    trBridgeNote:
      'AFAD Afet Gönüllülüğü Yönetmeliği ve 7269 sayılı Umumi Hayata Müessir Afetler Kanunu uyarınca düzenlenir. ' +
      'Genel gönüllü sözleşmesi: tr-gonullu-sozlesmesi. Sağlık beyanı zorunlu: gonullu-saglik-beyani.',
    relatedSlugs: ['tr-gonullu-sozlesmesi', 'gonullu-saglik-beyani', 'tr-acik-riza-saglik-verisi'],
    summary: 'AFAD akreditasyon, saha sigortası, yetki sınırı, basın iletişim yasağı.',
  },
  {
    slug: 'kurumsal-bagis-sozlesmesi',
    title: 'Kurumsal Bağış Sözleşmesi (B2B / brand)',
    version: '2.0-tr-bridge',
    jurisdictions: ['TR', 'TR-bridge'],
    trBridgeNote:
      'KV mükellefi kurumsal bağışçılar için KVK m.10 / GVK m.89 vergi indirim akışı. ' +
      'Bireysel bağış: tr-bagisci-sozlesmesi. KVKK aydınlatma (kurumsal yetkili kişi verisi): tr-kvkk-aydinlatma. ' +
      'TTK m.376 ve VUK e-fatura/e-arşiv zorunluluğu uygulanır.',
    relatedSlugs: ['tr-bagisci-sozlesmesi', 'tr-kvkk-aydinlatma'],
    summary: 'Brand sponsorluğu, sponsorluk hakları, marka kullanım izni, makbuz/fatura akışı.',
  },
  {
    slug: 'cocuk-gonullulugu-ebeveyn-rizasi',
    title: 'Çocuk Gönüllülüğü Ebeveyn Açık Rıza Metni (14–18 yaş)',
    version: '2.0-tr-bridge',
    jurisdictions: ['TR', 'TR-bridge'],
    trBridgeNote:
      'KVKK m.6 + Çocuk Koruma Kanunu (5395) + 4857 sayılı İş Kanunu m.71 (çocuk işçi yasağı — gönüllülük istisna ancak sınırlı saat) ' +
      'çerçevesinde ebeveyn açık rızası. Genel sağlık verisi rızası: tr-acik-riza-saglik-verisi. ' +
      'Yurt dışı çocuk için bkz. eu-child-data-policy (EU) veya us-coppa-notice (US 13-).',
    relatedSlugs: ['tr-acik-riza-saglik-verisi', 'tr-gonullu-sozlesmesi', 'eu-child-data-policy', 'us-coppa-notice'],
    summary: '14-18 yaş gönüllülük, ebeveyn ıslak imza / KEP / e-imza, görev saat sınırı, fotoğraf/medya rızası ayrı.',
  },
  // ---------- Diğer global / yatay ----------
  {
    slug: 'kullanim-sartlari-global',
    title: 'Global Kullanım Şartları (TR dışı varsayılan)',
    version: '2.0-global',
    jurisdictions: ['GLOBAL', 'TR-bridge'],
    trBridgeNote:
      'Bu metin TR ve EU/UK/US dışındaki ülkeler için "best-effort" varsayılandır. ' +
      'TR vatandaşları için bağlayıcı metin: tr-kullanici-sozlesmesi (Tüketici Hakem Heyeti + Türk Mahkemeleri).',
    relatedSlugs: ['tr-kullanici-sozlesmesi', 'eu-terms-of-service', 'uk-terms-of-service'],
    summary: 'Genel kullanım şartları; yargı/hukuk seçimi default İstanbul; arbitration opt-in.',
  },
  {
    slug: 'erisilebilirlik-beyani',
    title: 'Erişilebilirlik Beyanı (WCAG 2.2 AA — TR + EU EAA + ADA)',
    version: '2.0-global',
    jurisdictions: ['TR', 'EU', 'US-OTHER', 'US-CA', 'UK', 'TR-bridge'],
    trBridgeNote:
      'Bu beyan WCAG 2.2 AA hedefi belirtir. TR\'de Engelliler Hakkında Kanun (5378) + Erişilebilirlik İzleme ve Denetleme Yönetmeliği, ' +
      'EU\'da Directive 2019/882 (European Accessibility Act — 28 Haziran 2025 yürürlük), ' +
      'ABD\'de ADA Title III + Section 508 referans alınır.',
    relatedSlugs: ['tr-kullanici-sozlesmesi', 'eu-terms-of-service'],
    summary: 'A11y hedefleri, geri bildirim kanalı, alternatif format talep akışı.',
  },
  {
    slug: 'guvenlik-aciklik-bildirim-politikasi',
    title: 'Güvenlik Açığı Bildirim Politikası (Responsible Disclosure / VDP)',
    version: '2.0-global',
    jurisdictions: ['GLOBAL', 'TR-bridge'],
    trBridgeNote:
      'TR\'de TCK m.243-245 (bilişim suçları) ve 6698 KVKK m.12 (veri güvenliği) çerçevesinde meşru güvenlik araştırması safe-harbor sağlar. ' +
      'EU NIS2 + DSA + GDPR Art. 32 ile hizalı. Kişisel veri ihlali bildirim: tr-kvkk-aydinlatma.',
    relatedSlugs: ['tr-kvkk-aydinlatma', 'eu-dsa-compliance'],
    summary: 'security@hangel.org, in-scope/out-of-scope, SLA 72h triage, safe-harbor.',
  },
  {
    slug: 'fikri-mulkiyet-takedown-dmca-tr',
    title: 'Fikri Mülkiyet Takedown Politikası (DMCA + 5651/8 + DSA Art.16)',
    version: '2.0-tr-bridge',
    jurisdictions: ['GLOBAL', 'TR', 'US-OTHER', 'EU', 'TR-bridge'],
    trBridgeNote:
      'TR\'de 5846 sayılı FSEK ve 5651 sayılı İnternet Kanunu m.8/A-9 uyarınca düzenlenir. ' +
      'ABD DMCA 17 USC §512(c) (notice-and-takedown + counter-notice), EU DSA Art.16 ile çapraz uyum sağlanır. ' +
      'Kişisel veri ihlali (kişilik hakları) için ayrıca tr-kvkk-aydinlatma m.11 başvuru hakkı.',
    relatedSlugs: ['tr-kullanici-sozlesmesi', 'tr-kvkk-aydinlatma', 'eu-dsa-compliance'],
    summary: 'DMCA agent designation, counter-notice, 5651 URL engelleme, repeat infringer politikası.',
  },
  {
    slug: 'masak-suphe-bildirimi-prosedur',
    title: 'MASAK Şüpheli İşlem Bildirim Prosedürü (Bağış akışı)',
    version: '2.0-tr-bridge',
    jurisdictions: ['TR', 'TR-bridge'],
    trBridgeNote:
      '5549 sayılı Suç Gelirlerinin Aklanmasının Önlenmesi Hakkında Kanun ve MASAK Genel Tebliği (Sıra No: 5, 13, 19) uyarınca ' +
      'STK bağış akışında yükümlülükler. KVKK m.5/2-ç gereği kanunen açıkça öngörüldüğü için açık rıza aranmaz; ' +
      'detaylar tr-bagisci-sozlesmesi içinde işaret edilir.',
    relatedSlugs: ['tr-bagisci-sozlesmesi', 'kampanya-katilim-sartlari', 'kurumsal-bagis-sozlesmesi'],
    summary: 'Eşik bildirim (≥20.000 TL veya muadili), STR, kimlik tespiti, müşteri tanıma.',
  },
  {
    slug: 'cerez-onay-banner-konfigurasyon',
    title: 'Çerez Onay Banner Konfigürasyonu (TR + EU + UK + US)',
    version: '2.0-tr-bridge',
    jurisdictions: ['TR', 'EU', 'UK', 'US-CA', 'TR-bridge'],
    trBridgeNote:
      'Bu doküman bölgeye göre banner davranışını tanımlar. TR: opt-in (KVKK kurul kararı 2022/417), ' +
      'EU: opt-in (ePrivacy + GDPR), UK: opt-in (PECR), US-CA: opt-out (CCPA). ' +
      'Detaylı politikalar: tr-cerez-politikasi, eu-cookie-policy, uk-cookie-policy.',
    relatedSlugs: ['tr-cerez-politikasi', 'eu-cookie-policy', 'uk-cookie-policy', 'us-california-privacy-notice'],
    summary: 'Çerez kategorileri, GPC sinyali, jurisdiksiyon bazlı UI varyantı, withdrawal akışı.',
  },
];

// ---------------------------------------------------------------------------
// Eksik doc önerileri (apply EDİLMEZ — sadece raporlanır)
// ---------------------------------------------------------------------------
const MISSING_SUGGESTIONS = [
  {
    slug: 'acil-kan-cagri-hizmet-sartlari',
    title: 'Acil Kan Çağrısı Hizmet Şartları',
    why: 'Kan eşleşme akışı KVKK m.6 özel nitelikli veri + 5624 Kan Hizmetleri Kanunu + Kızılay protokolü çerçevesinde ayrı bir hizmet şartı gerektirir; mevcut tr-acik-riza-saglik-verisi sadece rızayı kapsar, hizmet seviyesi/SLA/sorumluluk yok.',
    references: ['5624 Kan Hizmetleri Kanunu', 'KVKK m.6', 'Kızılay protokolü'],
  },
  {
    slug: 'bagisci-vergi-avantaji-bildirimi-gvk',
    title: 'Bağışçı Vergi Avantajı Bildirimi (GVK m.89/4 + KVK m.10/c)',
    why: 'Mevcut tr-bagisci-sozlesmesi makbuz/iade hükümleri içeriyor ama bağışçıya GVK m.89/4 (GV beyannamesinde indirim) ve KVK m.10/c (KV beyannamesinde indirim) prosedürünü açıklayan ayrı bir bildirim Maliye denetimlerinde aranıyor.',
    references: ['GVK m.89/4', 'KVK m.10/c', 'VUK m.232'],
  },
  {
    slug: 'saglik-verisi-sinirli-yetki-belgesi',
    title: 'Sağlık Verisi Sınırlı Yetki Belgesi (kan grubu özel)',
    why: 'tr-acik-riza-saglik-verisi tüm sağlık verisini kapsıyor; kan grubu için ayrı, AMAÇLA SINIRLI (sadece acil çağrı eşleşmesi), reklam/pazarlama açıkça yasaklı, ayrıştırılmış bir yetki belgesi KVKK Kurul kararları doğrultusunda öneriliyor.',
    references: ['KVKK m.6', 'KVK Kurulu 2020/255 sayılı karar', '5624 Kan Hizmetleri Kanunu'],
  },
  {
    slug: 'whatsapp-business-iletisim-aydinlatma',
    title: 'WhatsApp Business İletişim Aydınlatma Eki',
    why: 'hangel WhatsApp Business üzerinden OTP ve UTILITY mesaj gönderiyor; Meta-Ireland veri aktarımı KVKK m.9 yurt dışı aktarım rejimi tetikliyor → ayrıca aydınlatma eki gerekli.',
    references: ['KVKK m.9', 'Meta DPA', 'WhatsApp Business Terms'],
  },
  {
    slug: 'ai-asistan-aydinlatma-eki',
    title: 'AI Asistan (Gemini/OpenAI) Aydınlatma Eki',
    why: 'Süper-admin AI tab\'ı + content moderation Google AI / OpenAI\'a veri yolluyor; KVKK m.9 + EU AI Act Art.50 transparency + EU SCC gerekli. Mevcut eu-ai-act-statement EU özelinde; TR aydınlatma eki ayrı.',
    references: ['KVKK m.9', 'EU AI Act 2024/1689 Art.50', 'SCC 2021/914'],
  },
  {
    slug: 'kurumsal-uyelik-stk-onay-prosedur',
    title: 'Kurumsal Üyelik STK Onay Prosedürü (Dernek/Vakıf onboarding)',
    why: 'Yeni STK\'lar Dernekler Bilgi Sistemi (DERBİS) / Vakıflar Genel Müdürlüğü kütüğüne karşı doğrulanıyor; bu doğrulama akışını, RED kriterlerini ve itiraz hakkını açıklayan ayrı bir prosedür gerek.',
    references: ['5253 Dernekler K.', 'DERBİS', '5737 Vakıflar K.'],
  },
];

// ---------------------------------------------------------------------------
// Yazma
// ---------------------------------------------------------------------------

const DRY_RUN = process.argv.includes('--dry-run');

async function main() {
  if (getApps().length === 0) {
    const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (!credPath) {
      console.error('❌ GOOGLE_APPLICATION_CREDENTIALS env yok.');
      process.exit(1);
    }
    initializeApp({ credential: cert(credPath) });
  }
  const db = getFirestore();

  const updated: string[] = [];
  const skipped: string[] = [];
  const blocked: string[] = [];
  const createdPlaceholder: string[] = [];

  for (const doc of BATCH3_DOCS) {
    if (BLOCKLIST_B3_B4.has(doc.slug)) {
      blocked.push(doc.slug);
      continue;
    }

    const ref = db.collection('contracts').doc(doc.slug);
    const existing = await ref.get();

    const payload: Record<string, unknown> = {
      slug: doc.slug,
      title: doc.title,
      version: doc.version,
      jurisdictions: doc.jurisdictions,
      trBridgeNote: doc.trBridgeNote,
      relatedSlugs: doc.relatedSlugs,
      summary: doc.summary,
      lastUpdated: FieldValue.serverTimestamp(),
      // hangel kullanıcı metninde her zaman küçük harf — bu alan template
      // string'lerinde kullanılır; teknik identifier'lar kapsam dışı.
      brandName: 'hangel',
      complianceBatch: 'B3',
    };

    if (!existing.exists) {
      payload.placeholder = true;
      payload.createdAt = FieldValue.serverTimestamp();
      payload.content = `<h3>${doc.title}</h3><p><em>TR mevzuat bağlantı notu:</em> ${doc.trBridgeNote}</p>`;
      createdPlaceholder.push(doc.slug);
    }

    if (DRY_RUN) {
      console.log(`[dry-run] ${existing.exists ? 'UPDATE' : 'CREATE'} contracts/${doc.slug}`);
    } else {
      await ref.set(payload, { merge: true });
    }
    updated.push(doc.slug);
  }

  console.log('\n=== Batch 3 Özet ===');
  console.log(`İşlenen: ${updated.length}`);
  console.log(`Yeni placeholder oluşturulan: ${createdPlaceholder.length}`);
  console.log(`Blocklist (B3/B4 atlandı): ${blocked.length}`);
  if (blocked.length) console.log('  →', blocked.join(', '));
  console.log(`Skipped: ${skipped.length}`);

  console.log('\n=== Önerilen yeni doc\'lar (uygulanmadı) ===');
  for (const s of MISSING_SUGGESTIONS) {
    console.log(`- ${s.slug} — ${s.title}`);
    console.log(`    neden: ${s.why}`);
    console.log(`    referans: ${s.references.join(' | ')}`);
  }

  if (DRY_RUN) console.log('\n(dry-run modunda Firestore\'a yazılmadı.)');
}

main().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
