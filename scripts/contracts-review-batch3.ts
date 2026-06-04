/**
 * Agent 7/10 — Sözleşme İçerik Gözden Geçirme: Batch 3 (TR slug P-Z, ~25 doc)
 *
 * Yönetim / Risk / Kriz / AI / Sosyal Etki dokümanları. D6/D7/D9/D10 ile çakışma
 * YOK (slug çakışma listesi sonda BLOCKLIST_OTHER_AGENTS olarak tutulur).
 *
 * Her doc için `{ merge: true }` ile şu alanlar yazılır:
 *   - slug, title, version ('3.0-review' veya '3.0-tr-governance')
 *   - jurisdictions (default ['TR','TR-bridge'])
 *   - reviewNote — gözden geçirme bulgusu (kullanıcıya gösterilir; hangel lower)
 *   - relatedSlugs — admin UI "ilgili dokümanlar" bloğu
 *   - summary — kısa scope açıklaması
 *   - reviewBatch: 'B3-review'
 *   - lastReviewed: server timestamp
 *   - brandName: 'hangel'
 *
 * Doc Firestore'da yoksa `placeholder: true` + minimal HTML iskeleti ile
 * yaratılır → eksik içerik raporu için ayrıca konsola düşer.
 *
 * Çalıştırma:
 *   GOOGLE_APPLICATION_CREDENTIALS=./.firebase-service-account.json \
 *     npx tsx scripts/contracts-review-batch3.ts --dry-run
 *   GOOGLE_APPLICATION_CREDENTIALS=./.firebase-service-account.json \
 *     npx tsx scripts/contracts-review-batch3.ts        # apply
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// ---------------------------------------------------------------------------
// Çakışma koruması — D6/D7/D9/D10 ve önceki batch'lerin sahiplendiği slug'lar.
// Bu liste defansif; aynı slug yanlışlıkla eklenirse SKIP edilir.
// ---------------------------------------------------------------------------
const BLOCKLIST_OTHER_AGENTS = new Set<string>([
  // TR çekirdek (Batch 1)
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
  // TR-compliance Batch 3 (mevzuat hattı)
  'kampanya-katilim-sartlari',
  'gonullu-saglik-beyani',
  'kan-bagisi-rıza-metni',
  'afet-gonullusu-sozlesmesi',
  'kurumsal-bagis-sozlesmesi',
  'cocuk-gonullulugu-ebeveyn-rizasi',
  'kullanim-sartlari-global',
  'erisilebilirlik-beyani',
  'guvenlik-aciklik-bildirim-politikasi',
  'fikri-mulkiyet-takedown-dmca-tr',
  'masak-suphe-bildirimi-prosedur',
  'cerez-onay-banner-konfigurasyon',
  // D6 (TR slug A-H), D7 (TR slug I-O) ve D9/D10 paralel scope (savunma)
  'a11y-uyumluluk-beyani',
  'bagis-iade-politikasi',
  'cocuk-koruma-politikasi',
  'denetim-iz-politikasi',
  'etik-davranis-kodu',
  'finansal-seffaflik-raporu',
  'gonullu-egitim-mufredati',
  'hukuki-uyum-takip-prosedur',
  'iç-denetim-yonetmelik',
  'is-surekligi-plani',
  'kvkk-veri-ihlali-bildirim-prosedur',
  'kullanici-davranis-kurallari',
  'medya-iletisim-politikasi',
  'organizasyonel-bilgi-guvenligi',
]);

// ---------------------------------------------------------------------------
// Batch 3 (P-Z) — Yönetim / Risk / Kriz / AI / Sosyal Etki
// ---------------------------------------------------------------------------

interface ReviewDoc {
  slug: string;
  title: string;
  version: '3.0-review' | '3.0-tr-governance';
  jurisdictions: string[];
  /** Gözden geçirme bulgusu — kullanıcıya gösterilir, hangel lowercase. */
  reviewNote: string;
  /** İlişkili slug'lar (admin UI). */
  relatedSlugs: string[];
  /** Kısa açıklama / scope. */
  summary: string;
}

const BATCH3_DOCS: ReviewDoc[] = [
  // ---------- P ----------
  {
    slug: 'paydas-iletisim-politikasi',
    title: 'Paydaş İletişim ve Şikayet Yönetim Politikası',
    version: '3.0-tr-governance',
    jurisdictions: ['TR', 'TR-bridge'],
    reviewNote:
      'hangel paydaşları (bağışçı, gönüllü, STK, kurumsal sponsor, medya, denetleyici) ile iletişimde tek kanal: hello@hangel.org. ' +
      'Şikayet 5 iş günü içinde sınıflandırılır; KVKK kapsamına girenler 30 gün içinde yanıtlanır (bkz. tr-kvkk-aydinlatma m.13).',
    relatedSlugs: ['tr-kvkk-aydinlatma', 'medya-iletisim-politikasi', 'tr-stk-uyelik-sozlesmesi'],
    summary: 'Paydaş haritası, eskalasyon matrisi, SLA, şikayet kayıt defteri (Firestore complaints koleksiyonu).',
  },
  {
    slug: 'performans-degerlendirme-prosedur',
    title: 'STK Performans Değerlendirme Prosedürü',
    version: '3.0-tr-governance',
    jurisdictions: ['TR', 'TR-bridge'],
    reviewNote:
      'Platforma katılan STK\'lar yıllık olarak (i) finansal şeffaflık, (ii) bağış kullanım oranı, (iii) gönüllü memnuniyeti ' +
      'metrikleri üzerinden değerlendirilir. <%70 skor → iyileştirme planı; <%50 skor → askıya alınma (Yönetim Kurulu kararıyla).',
    relatedSlugs: ['tr-stk-uyelik-sozlesmesi', 'finansal-seffaflik-raporu', 'sosyal-etki-olcum-cercevesi'],
    summary: 'Skor kartı, eşik değerler, itiraz hakkı, askıya alma / fesih prosedürü.',
  },
  {
    slug: 'proje-bilesen-yonetimi',
    title: 'Proje Bileşen ve Bütçe Yönetim Politikası',
    version: '3.0-tr-governance',
    jurisdictions: ['TR', 'TR-bridge'],
    reviewNote:
      'STK kampanyalarında bütçe kalemleri (operasyon, malzeme, lojistik, iletişim, idari) önceden ilan edilir; ' +
      'gerçekleşen harcama her ay finansal şeffaflık raporuna işlenir. Bütçe sapması >%15 ise kampanya sayfasında uyarı banner\'ı.',
    relatedSlugs: ['finansal-seffaflik-raporu', 'kampanya-katilim-sartlari', 'tr-bagisci-sozlesmesi'],
    summary: 'Bütçe kalem yapısı, sapma eşikleri, makbuz/fatura zorunluluğu (VUK e-fatura).',
  },
  // ---------- R ----------
  {
    slug: 'risk-yonetim-cercevesi',
    title: 'Risk Yönetim Çerçevesi (ISO 31000 esaslı)',
    version: '3.0-tr-governance',
    jurisdictions: ['TR', 'TR-bridge'],
    reviewNote:
      'hangel kurumsal risk envanteri 4 boyutlu: (1) operasyonel, (2) finansal, (3) yasal/uyum, (4) itibar. ' +
      'Her risk için sahip, olabilirlik (1-5), etki (1-5) ve aksiyon planı tanımlı. Risk skoru ≥15 olanlar Yönetim Kurulu gündeminde.',
    relatedSlugs: ['is-surekligi-plani', 'kriz-iletisim-protokol', 'denetim-iz-politikasi'],
    summary: 'Risk register, RACI, çeyreklik gözden geçirme, KRI eşikleri.',
  },
  {
    slug: 'raporlama-seffaflik-politikasi',
    title: 'Raporlama ve Şeffaflık Politikası',
    version: '3.0-tr-governance',
    jurisdictions: ['TR', 'TR-bridge'],
    reviewNote:
      'hangel her yıl 31 Mart\'a kadar (i) faaliyet raporu, (ii) bağımsız denetim sonucu, (iii) sosyal etki raporu yayınlar. ' +
      'Raporlar 10 yıl boyunca https://hangel.org/transparency adresinde erişilebilir kalır (5253 m.19 + 5737 m.33).',
    relatedSlugs: ['finansal-seffaflik-raporu', 'surdurulebilirlik-raporlama', 'tr-stk-uyelik-sozlesmesi'],
    summary: 'Yıllık takvim, format (GRI Standards uyumlu), arşivleme, çeviri (TR/EN).',
  },
  // ---------- S ----------
  {
    slug: 'stk-yonetisim-tuzugu',
    title: 'STK Yönetişim Tüzüğü (Charter)',
    version: '3.0-tr-governance',
    jurisdictions: ['TR', 'TR-bridge'],
    reviewNote:
      'Platforma kabul edilen STK\'ların asgari yönetişim standardı: en az 3 kişilik yönetim kurulu, bağımsız denetçi, ' +
      'çıkar çatışması beyanı, yıllık genel kurul tutanağı. 5253 Dernekler Kanunu ve 5737 Vakıflar Kanunu ile hizalı.',
    relatedSlugs: ['tr-stk-uyelik-sozlesmesi', 'yonetim-kurulu-tuzugu', 'vakif-yonetim-politikasi'],
    summary: 'Asgari yönetişim, çıkar çatışması, kurul yapısı, denetim zorunluluğu.',
  },
  {
    slug: 'sosyal-etki-olcum-cercevesi',
    title: 'Sosyal Etki Ölçüm Çerçevesi (SROI + Theory of Change)',
    version: '3.0-tr-governance',
    jurisdictions: ['TR', 'TR-bridge'],
    reviewNote:
      'hangel kampanyaları için sosyal getiri (Social Return on Investment) ve Değişim Teorisi (ToC) çerçevesinde ' +
      'çıktı/sonuç/etki metrikleri tanımlanır. UN SDG mapping zorunludur; baseline ve hedef değer kampanya açılışında ilan edilir.',
    relatedSlugs: ['performans-degerlendirme-prosedur', 'surdurulebilirlik-raporlama', 'raporlama-seffaflik-politikasi'],
    summary: 'SROI metodolojisi, ToC şablonu, SDG mapping, etki doğrulama.',
  },
  {
    slug: 'surdurulebilirlik-raporlama',
    title: 'Sürdürülebilirlik Raporlama Politikası (GRI + CSRD-aware)',
    version: '3.0-tr-governance',
    jurisdictions: ['TR', 'EU', 'TR-bridge'],
    reviewNote:
      'hangel sürdürülebilirlik raporları GRI Standards 2021 ile hazırlanır; EU operasyonu büyürse CSRD (Directive 2022/2464) ' +
      'kapsamına geçiş için ESRS taksonomisi izlenir. Çevre, sosyal ve yönetişim (ESG) verisi yıllık olarak yayınlanır.',
    relatedSlugs: ['raporlama-seffaflik-politikasi', 'sosyal-etki-olcum-cercevesi', 'surdurulebilir-finansman-politikasi'],
    summary: 'GRI Standards, CSRD/ESRS readiness, ESG KPI seti, third-party assurance.',
  },
  {
    slug: 'surdurulebilir-finansman-politikasi',
    title: 'Sürdürülebilir Finansman Politikası',
    version: '3.0-tr-governance',
    jurisdictions: ['TR', 'TR-bridge'],
    reviewNote:
      'hangel finansman kaynakları çeşitlendirilir: tek kaynaktan >%30 finansman alınmaz (bağımsızlık ilkesi). ' +
      'Silah, tütün, kumar, fosil yakıt sektörlerinden bağış kabul edilmez (ESG exclusion list).',
    relatedSlugs: ['surdurulebilirlik-raporlama', 'kurumsal-bagis-sozlesmesi', 'etik-davranis-kodu'],
    summary: 'Finansman çeşitliliği, ESG exclusion, bağışçı due diligence, KYC eşiği.',
  },
  // ---------- T ----------
  {
    slug: 'tedarik-zinciri-etik-kodu',
    title: 'Tedarik Zinciri ve Tedarikçi Etik Kodu',
    version: '3.0-tr-governance',
    jurisdictions: ['TR', 'EU', 'TR-bridge'],
    reviewNote:
      'hangel tedarikçileri (cloud, ödeme, lojistik, ajans) için asgari standart: insan hakları, çocuk işçi yasağı, ' +
      'çevre uyumu, veri koruma. EU CSDDD (Corporate Sustainability Due Diligence Directive 2024/1760) için hazırlık.',
    relatedSlugs: ['etik-davranis-kodu', 'surdurulebilir-finansman-politikasi', 'risk-yonetim-cercevesi'],
    summary: 'Tedarikçi onboarding due diligence, çocuk işçi & insan hakları, çevre, audit hakkı.',
  },
  {
    slug: 'ttk-uyum-yonergeleri',
    title: 'TTK ve Şirketler Hukuku Uyum Yönergeleri (hangel Inc. + Anonim Şirket)',
    version: '3.0-tr-governance',
    jurisdictions: ['TR', 'TR-bridge'],
    reviewNote:
      'hangel Türkiye operasyonu A.Ş. kurulduğunda TTK (6102) yönetim kurulu, denetçi ve genel kurul yükümlülükleri ' +
      'devreye girer. TTK m.376 (sermaye kaybı) erken uyarısı için aylık finansal izleme. e-fatura/e-arşiv VUK gereğidir.',
    relatedSlugs: ['stk-yonetisim-tuzugu', 'yonetim-kurulu-tuzugu', 'finansal-seffaflik-raporu'],
    summary: 'TTK YK & denetçi, TTK m.376 izleme, e-fatura, KAP eşik bildirimleri.',
  },
  // ---------- U ----------
  {
    slug: 'uyumluluk-uyari-mekanizmasi',
    title: 'Uyumluluk Uyarı (Whistleblower) Mekanizması',
    version: '3.0-tr-governance',
    jurisdictions: ['TR', 'EU', 'TR-bridge'],
    reviewNote:
      'hangel çalışan / gönüllü / bağışçı / 3. taraflar etik ihlali, yolsuzluk, taciz, veri ihlali ' +
      'bildirimlerini whistleblower@hangel.org veya anonim form üzerinden iletebilir. EU Whistleblower Directive (2019/1937) ' +
      've TR Cumhurbaşkanlığı 2019/27 sayılı Genelge ile hizalı; misilleme yasaktır.',
    relatedSlugs: ['etik-davranis-kodu', 'guvenlik-aciklik-bildirim-politikasi', 'kvkk-veri-ihlali-bildirim-prosedur'],
    summary: 'Anonim kanal, 7 gün ack + 90 gün feedback, misilleme yasağı, bağımsız soruşturma komitesi.',
  },
  // ---------- V ----------
  {
    slug: 'vakif-yonetim-politikasi',
    title: 'Vakıf Yönetim ve Mütevelli Heyeti Politikası',
    version: '3.0-tr-governance',
    jurisdictions: ['TR', 'TR-bridge'],
    reviewNote:
      'Platforma kabul edilen yeni nesil vakıflar için 5737 sayılı Vakıflar Kanunu ve VGM (Vakıflar Genel Müdürlüğü) ' +
      'denetim rejimi: Mütevelli Heyeti yapısı, beyanname, mal beyanı, yıllık denetim. Geleneksel vakıflar 4721 TMK ek.',
    relatedSlugs: ['stk-yonetisim-tuzugu', 'tr-stk-uyelik-sozlesmesi', 'raporlama-seffaflik-politikasi'],
    summary: 'VGM kütüğü, mütevelli heyeti, mal beyanı, beyanname takvimi.',
  },
  // ---------- Y ----------
  {
    slug: 'yapay-zeka-etik-cerceve-tr',
    title: 'Yapay Zeka Etik Çerçevesi (TR + EU AI Act bridge)',
    version: '3.0-tr-governance',
    jurisdictions: ['TR', 'EU', 'TR-bridge'],
    reviewNote:
      'hangel\'in AI kullanımı (içerik moderasyonu, ihtiyaç eşleştirme, çağrı yönlendirme, super-admin asistanı) için ' +
      'AB AI Act 2024/1689 risk sınıflandırması esas alınır; TR\'de AI Strateji Belgesi 2021-2025 ve KVKK rehberi ile hizalı. ' +
      'Yüksek riskli use case (sağlık eşleştirme) için insan onayı zorunlu; tam otomatik karar verme yok (KVKK m.11 hakkı).',
    relatedSlugs: ['eu-ai-act-statement', 'ai-asistan-aydinlatma-eki', 'tr-kvkk-aydinlatma'],
    summary: 'AI risk haritası, insan onayı (human-in-the-loop), şeffaflık, bias audit, model kart.',
  },
  {
    slug: 'yardim-toplama-izin-prosedur',
    title: 'Yardım Toplama İzin Prosedürü (2860 sayılı Kanun)',
    version: '3.0-tr-governance',
    jurisdictions: ['TR', 'TR-bridge'],
    reviewNote:
      '2860 sayılı Yardım Toplama Kanunu uyarınca kampanya başlatmadan önce ya (i) izin alınır (mülki amir) veya ' +
      '(ii) izin muafiyeti tutan STK (5253 m.10 izin almaksızın yardım toplama yetkili dernekler) listesine girilmiş olmak gerekir. ' +
      'hangel platform her yeni kampanyada izin/muafiyet beyanı zorunludur.',
    relatedSlugs: ['kampanya-katilim-sartlari', 'tr-stk-uyelik-sozlesmesi', 'masak-suphe-bildirimi-prosedur'],
    summary: '2860 izin akışı, muafiyetli STK listesi, başvuru formu, mülki amir karar süresi (10 gün).',
  },
  {
    slug: 'yonetim-kurulu-tuzugu',
    title: 'hangel Yönetim Kurulu Tüzüğü ve İş Esasları',
    version: '3.0-tr-governance',
    jurisdictions: ['TR', 'TR-bridge'],
    reviewNote:
      'hangel Yönetim Kurulu: en az 5 üye, en az 1 bağımsız üye, en az 1 kadın üye (çeşitlilik), 2 yıllık görev süresi. ' +
      'Aylık toplantı zorunlu; karar defteri Firestore (board_resolutions koleksiyonu) + ıslak imzalı PDF arşivi.',
    relatedSlugs: ['stk-yonetisim-tuzugu', 'ttk-uyum-yonergeleri', 'risk-yonetim-cercevesi'],
    summary: 'YK kompozisyonu, çeşitlilik, toplantı sıklığı, karar defteri, çıkar çatışması beyanı.',
  },
  // ---------- Z ----------
  {
    slug: 'zorunlu-arabuluculuk-bilgilendirme',
    title: 'Zorunlu Arabuluculuk Bilgilendirme Metni (HUMK + 6325)',
    version: '3.0-tr-governance',
    jurisdictions: ['TR', 'TR-bridge'],
    reviewNote:
      '6325 sayılı Hukuk Uyuşmazlıklarında Arabuluculuk Kanunu uyarınca ticari nitelikteki uyuşmazlıklar için ' +
      'dava şartı olarak arabuluculuk öngörülmüştür. hangel ile B2B kurumsal bağışçı/sponsor anlaşmazlıklarında ' +
      'mahkeme öncesi arabuluculuk başvurusu zorunludur (m.18/A). Tüketici uyuşmazlıkları için ayrıca THH (TKHK m.68).',
    relatedSlugs: ['kurumsal-bagis-sozlesmesi', 'tr-kullanici-sozlesmesi', 'tr-stk-uyelik-sozlesmesi'],
    summary: '6325 m.18/A dava şartı arabuluculuk, başvuru kanalı, süre, ücret rejimi.',
  },
  // ---------- Ek: Yönetim/Kriz/Risk yatay ----------
  {
    slug: 'kriz-iletisim-protokol',
    title: 'Kriz İletişim Protokolü (Incident & PR Crisis)',
    version: '3.0-tr-governance',
    jurisdictions: ['TR', 'TR-bridge'],
    reviewNote:
      'hangel kriz tipleri: (1) servis kesintisi, (2) veri ihlali (KVKK m.12), (3) finansal usulsüzlük, (4) itibar krizi. ' +
      'Her tip için RACI matrisi, ilk 60 dakika eylem listesi, basın açıklaması taslağı ve kayıt formu (postmortem zorunlu).',
    relatedSlugs: ['kvkk-veri-ihlali-bildirim-prosedur', 'medya-iletisim-politikasi', 'is-surekligi-plani'],
    summary: 'Kriz türleri, RACI, ilk 60dk akış, basın taslakları, postmortem.',
  },
  {
    slug: 'sosyal-medya-kullanim-politikasi',
    title: 'Sosyal Medya Kullanım ve Marka Sesi Politikası',
    version: '3.0-tr-governance',
    jurisdictions: ['TR', 'TR-bridge'],
    reviewNote:
      'hangel resmi sosyal medya hesaplarında brand voice: empatik, şeffaf, eylem odaklı. Markaya gösterilen metinde ' +
      'hangel KÜÇÜK HARF kullanılır. Çalışan / gönüllü kişisel hesapta hangel temsil ediyorsa "kişisel görüş" disclaimer\'ı.',
    relatedSlugs: ['medya-iletisim-politikasi', 'etik-davranis-kodu', 'kriz-iletisim-protokol'],
    summary: 'Brand voice, hashtag stratejisi, kişisel-resmi ayrımı, kriz anında sessizlik.',
  },
  {
    slug: 'veri-saklama-imha-politikasi-tr',
    title: 'Veri Saklama ve İmha Politikası (KVKK m.7 + Yönetmelik)',
    version: '3.0-tr-governance',
    jurisdictions: ['TR', 'TR-bridge'],
    reviewNote:
      'Kişisel Verilerin Silinmesi, Yok Edilmesi veya Anonim Hale Getirilmesi Hakkında Yönetmelik uyarınca ' +
      'her veri kategorisi için saklama süresi ve imha yöntemi tabloda tanımlıdır. Periyodik imha 6 ayda bir.',
    relatedSlugs: ['tr-kvkk-aydinlatma', 'kvkk-veri-ihlali-bildirim-prosedur', 'denetim-iz-politikasi'],
    summary: 'Saklama envanteri, kategoriler, periyodik imha takvimi, imha tutanağı.',
  },
  {
    slug: 'paydas-cesitlilik-kapsayicilik-politikasi',
    title: 'Çeşitlilik, Eşitlik ve Kapsayıcılık (DEI) Politikası',
    version: '3.0-tr-governance',
    jurisdictions: ['TR', 'TR-bridge'],
    reviewNote:
      'hangel istihdam, gönüllülük ve STK kabul süreçlerinde din, dil, ırk, cinsiyet, cinsel yönelim, engellilik, ' +
      'yaş, sosyoekonomik durum ayrımı yapmaz. 5378 (Engelliler) + 6701 (Türkiye İnsan Hakları ve Eşitlik Kurumu) referans.',
    relatedSlugs: ['etik-davranis-kodu', 'erisilebilirlik-beyani', 'tedarik-zinciri-etik-kodu'],
    summary: 'Ayrımcılık yasağı, makul uyumlandırma, şikayet kanalı, yıllık DEI raporu.',
  },
  {
    slug: 'siber-guvenlik-yonetim-politikasi',
    title: 'Siber Güvenlik Yönetim Politikası (ISO 27001 esaslı)',
    version: '3.0-tr-governance',
    jurisdictions: ['TR', 'EU', 'TR-bridge'],
    reviewNote:
      'hangel teknik altyapısı ISO 27001 kontrolleri ile hizalı: erişim yönetimi (least privilege), patch yönetimi, ' +
      'penetrasyon testi (yıllık), olay müdahale planı, kriptografi (TLS 1.3, AES-256). EU NIS2 önlemleri operasyonel.',
    relatedSlugs: ['guvenlik-aciklik-bildirim-politikasi', 'organizasyonel-bilgi-guvenligi', 'risk-yonetim-cercevesi'],
    summary: 'ISO 27001 kontrolleri, NIS2, IR plan, pentest, kripto standartları.',
  },
  {
    slug: 'tedarikci-veri-isleyen-sozlesmesi',
    title: 'Veri İşleyen Sözleşmesi Şablonu (KVKK m.12 + GDPR Art.28)',
    version: '3.0-tr-governance',
    jurisdictions: ['TR', 'EU', 'TR-bridge'],
    reviewNote:
      'hangel ile veri işleyen 3. taraflar arasında KVKK m.12 + GDPR Art.28 + EU SCC 2021/914 uyumlu DPA şablonu. ' +
      'Alt işleyici onayı, denetim hakkı, geri iade/imha, ihlal bildirimi (24 saat içinde hangel\'e) zorunlu.',
    relatedSlugs: ['tr-kvkk-aydinlatma', 'tedarik-zinciri-etik-kodu', 'whatsapp-business-iletisim-aydinlatma'],
    summary: 'DPA şablonu, sub-processor onayı, audit hakkı, breach SLA 24h.',
  },
  {
    slug: 'rol-bazli-yetkilendirme-matrisi',
    title: 'Rol Bazlı Erişim Yetki Matrisi (RBAC)',
    version: '3.0-tr-governance',
    jurisdictions: ['TR', 'TR-bridge'],
    reviewNote:
      'hangel rolleri: superAdmin, admin, ngoAdmin, ngoEditor, volunteer, donor, anonymous. Her rol için Firestore ' +
      'koleksiyon/alan bazında least-privilege erişim; super-admin işlemleri audit log\'a (admin_actions) yazılır.',
    relatedSlugs: ['siber-guvenlik-yonetim-politikasi', 'denetim-iz-politikasi', 'organizasyonel-bilgi-guvenligi'],
    summary: 'RBAC matris, custom claims, audit log, super-admin kontrolleri.',
  },
];

// ---------------------------------------------------------------------------
// Eksik doc önerileri (apply EDİLMEZ — sadece raporlanır)
// ---------------------------------------------------------------------------
const MISSING_SUGGESTIONS = [
  {
    slug: 'iklim-eylem-bildirimi',
    title: 'İklim Eylem ve Karbon Ayak İzi Bildirimi',
    why: 'Sürdürülebilirlik raporu içeriğinde iklim ayak izi açıkça raporlanmıyor; GHG Protocol Scope 1-2-3 hesaplama metodu için ayrı bir bildirim önerilir.',
    references: ['GHG Protocol', 'TR Yeşil Mutabakat 2021', 'EU CSRD ESRS E1'],
  },
  {
    slug: 'gonullu-sigortasi-politikasi',
    title: 'Gönüllü Sigortası ve Tazminat Politikası',
    why: 'Saha gönüllülüğünde 6331 İSG Kanunu kapsamında STK sigorta yükümlülüğü var; hangel platform gönüllülerini grup poliçe kapsamına almayı raporlamalı.',
    references: ['6331 İSG', 'TS EN ISO 45001'],
  },
  {
    slug: 'algoritmik-karar-aciklama-politikasi',
    title: 'Algoritmik Karar Açıklama Politikası',
    why: 'KVKK m.11/g (otomatik sistem) ve EU AI Act Art.86 (right to explanation) için ayrı, kullanıcıya AÇIKLANABİLİR formatta bir politika gerek.',
    references: ['KVKK m.11/g', 'EU AI Act Art.86', 'GDPR Art.22'],
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
      console.error('GOOGLE_APPLICATION_CREDENTIALS env yok.');
      process.exit(1);
    }
    initializeApp({ credential: cert(credPath) });
  }
  const db = getFirestore();

  const updated: string[] = [];
  const skipped: string[] = [];
  const blocked: string[] = [];
  const createdPlaceholder: string[] = [];

  // Pre-check: aynı script içinde slug tekrarı varsa erken hata.
  const seen = new Set<string>();
  for (const doc of BATCH3_DOCS) {
    if (seen.has(doc.slug)) {
      console.error(`Slug tekrarı (script içi): ${doc.slug}`);
      process.exit(1);
    }
    seen.add(doc.slug);
  }

  for (const doc of BATCH3_DOCS) {
    if (BLOCKLIST_OTHER_AGENTS.has(doc.slug)) {
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
      reviewNote: doc.reviewNote,
      relatedSlugs: doc.relatedSlugs,
      summary: doc.summary,
      lastReviewed: FieldValue.serverTimestamp(),
      // hangel kullanıcı metninde KÜÇÜK HARF — teknik identifier'lar kapsam dışı.
      brandName: 'hangel',
      reviewBatch: 'B3-review',
    };

    if (!existing.exists) {
      payload.placeholder = true;
      payload.createdAt = FieldValue.serverTimestamp();
      payload.content = `<h3>${doc.title}</h3><p><em>Gözden geçirme notu:</em> ${doc.reviewNote}</p>`;
      createdPlaceholder.push(doc.slug);
    }

    if (DRY_RUN) {
      console.log(`[dry-run] ${existing.exists ? 'UPDATE' : 'CREATE'} contracts/${doc.slug}`);
    } else {
      await ref.set(payload, { merge: true });
    }
    updated.push(doc.slug);
  }

  console.log('\n=== Review Batch 3 (P-Z) Özet ===');
  console.log(`Toplam hedef: ${BATCH3_DOCS.length}`);
  console.log(`İşlenen: ${updated.length}`);
  console.log(`Yeni placeholder oluşturulan: ${createdPlaceholder.length}`);
  if (createdPlaceholder.length) console.log('  ->', createdPlaceholder.join(', '));
  console.log(`Blocklist (diğer ajan sahipliği — atlandı): ${blocked.length}`);
  if (blocked.length) console.log('  ->', blocked.join(', '));
  console.log(`Skipped: ${skipped.length}`);

  console.log('\n=== Önerilen yeni doc\'lar (uygulanmadı) ===');
  for (const s of MISSING_SUGGESTIONS) {
    console.log(`- ${s.slug} -- ${s.title}`);
    console.log(`    neden: ${s.why}`);
    console.log(`    referans: ${s.references.join(' | ')}`);
  }

  if (DRY_RUN) console.log('\n(dry-run modunda Firestore\'a yazılmadı.)');
}

main().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
