/**
 * hangel hukuk merkezi — varsayılan mevzuat kütüphanesi (seed).
 *
 * super-admin/contracts → Mevzuatlar sekmesindeki "Varsayılan Mevzuatları İçe Aktar"
 * butonu bu listeyi `legislations` koleksiyonuna yazar (setDoc merge, id = sabit slug).
 *
 * ÇOK YARGILI (multi-jurisdiction): her kayıt `country` ile etiketlenir.
 * hangel TR'de faaliyette + AB ve diğer ülkelere açılım planlandığından TR + AB +
 * uluslararası mevzuat birlikte tutulur. Ülke bazlı detay (her AB üyesinin ulusal
 * uygulaması) avukatlar tarafından kendi ülke etiketiyle eklenecek.
 *
 * links alanı = satır satır resmî kaynaklar. Somut esas/karar no'ları uydurulmadı;
 * ilgili resmî karar arama portalı (KVKK Kurulu, Danıştay, AYM, Yargıtay, CJEU, EDPB)
 * linklendi — hukukçular doğrulayıp spesifik kararları ekleyecek.
 */

export type SeedRiskLevel = 'dusuk' | 'orta' | 'yuksek' | 'kritik';
export type SeedComplianceStatus = 'uyumlu' | 'inceleniyor' | 'eksik' | 'riskli' | 'aksiyon-gerekli';

export interface SeedLegislation {
  id: string;
  name: string;
  number?: string;
  country?: string;          // TR | EU | INT | DE | FR | ... (ISO benzeri)
  category?: string;
  riskLevel?: SeedRiskLevel;
  complianceStatus?: SeedComplianceStatus;
  hangelSubject?: string;
  affectedModules?: string[];
  articleText?: string;
  interpretation?: string;
  links?: string;
}

// Resmî portallar — somut kararlar/metinler buradan doğrulanır.
const KVKK_KARAR = 'https://www.kvkk.gov.tr/Icerik/5406/Kurul-Karar-Ozetleri';
const DANISTAY = 'https://karararama.danistay.gov.tr/';
const AYM = 'https://kararlarbilgibankasi.anayasa.gov.tr/';
const YARGITAY = 'https://karararama.yargitay.gov.tr/';
const RG = 'https://www.resmigazete.gov.tr/';
const SIVILTOPLUM = 'https://www.siviltoplum.gov.tr/';
const ETICARET = 'https://www.eticaret.gov.tr/';
const SPK = 'https://www.spk.gov.tr/';
const MASAK = 'https://masak.hmb.gov.tr/';
const BTK = 'https://www.btk.gov.tr/';
const kanun = (no: string) => `https://www.mevzuat.gov.tr/mevzuatmetin/1.5.${no}.pdf`;

// AB resmî kaynakları
const eurlexReg = (year: string, no: string) => `https://eur-lex.europa.eu/eli/reg/${year}/${no}/oj`;
const eurlexDir = (year: string, no: string) => `https://eur-lex.europa.eu/eli/dir/${year}/${no}/oj`;
const CJEU = 'https://curia.europa.eu/';
const EDPB = 'https://edpb.europa.eu/';
const OHCHR = 'https://www.ohchr.org/en/instruments-mechanisms/instruments/convention-rights-child';

export const legislationsData: SeedLegislation[] = [
  // ============================ TÜRKİYE — Veri Koruma ============================
  {
    id: 'tr-kvkk-6698', name: 'Kişisel Verilerin Korunması Kanunu', number: '6698', country: 'TR',
    category: 'KVKK', riskLevel: 'yuksek', complianceStatus: 'aksiyon-gerekli',
    hangelSubject: 'hangel kimlik, telefon, e-posta, konum ve kan grubu işler. Kan grubu/sağlık verisi md.6 özel nitelikli — daha sıkı korunmalı.',
    affectedModules: ['Bağış', 'Gönüllülük', 'Etkinlik', 'AI Araçları', 'Mesajlaşma', 'Kan İlanı', 'Üyelik', 'Ödeme'],
    articleText: 'md.4 genel ilkeler; md.5 işleme şartları/açık rıza; md.6 özel nitelikli veriler; md.10 aydınlatma; md.12 veri güvenliği.',
    interpretation: 'Her veri toplama noktasında aydınlatma + açık rıza. Kan ilanı sağlık verisi → ek güvenlik. VERBİS kaydı. İhlalde idari para cezası + TCK 135-136.',
    links: `${kanun('6698')}\n${KVKK_KARAR}\n${AYM}`,
  },
  {
    id: 'tr-kvkk-yurtdisi-aktarim', name: 'KVKK Yurt Dışına Veri Aktarımı (md.9 — 7499 sayılı değişiklik)', number: '7499', country: 'TR',
    category: 'KVKK', riskLevel: 'yuksek', complianceStatus: 'aksiyon-gerekli',
    hangelSubject: 'AB/yurt dışı açılımında kullanıcı verisinin yurt dışına aktarımı. 2024 değişikliğiyle yeterlilik kararı / uygun güvenceler / istisna rejimi.',
    affectedModules: ['Üyelik', 'Bağış', 'AI Araçları', 'Mesajlaşma'],
    articleText: 'md.9 yurt dışına aktarım: yeterlilik kararı, standart sözleşme, bağlayıcı şirket kuralları, taahhütname; arızi istisnalar.',
    interpretation: 'Yurt dışı sunucu/işleyen (AI, bildirim, analitik) kullanılıyorsa aktarım mekanizması belirlenmeli. AB-TR çift yönlü açılımda GDPR ile uyum kritik.',
    links: `${kanun('6698')}\n${KVKK_KARAR}`,
  },
  {
    id: 'tr-aydinlatma-tebligi', name: 'Aydınlatma Yükümlülüğünün Yerine Getirilmesinde Uyulacak Usul ve Esaslar Hakkında Tebliğ', country: 'TR',
    category: 'KVKK', riskLevel: 'orta', complianceStatus: 'inceleniyor',
    hangelSubject: 'Aydınlatma metinlerinin içeriği ve sunum biçimi.',
    affectedModules: ['Üyelik', 'Bağış', 'Mesajlaşma'],
    articleText: 'Aydınlatmanın zamanı, içeriği (veri sorumlusu, amaç, aktarım, haklar) ve ispatı.',
    interpretation: 'Kayıt, bağış, kan ilanı formlarındaki aydınlatma metinleri bu tebliğe göre standartlaştırılmalı.',
    links: `${RG}\n${KVKK_KARAR}`,
  },
  {
    id: 'tr-veri-imha-yonetmelik', name: 'Kişisel Verilerin Silinmesi, Yok Edilmesi veya Anonim Hale Getirilmesi Hakkında Yönetmelik', country: 'TR',
    category: 'KVKK', riskLevel: 'orta', complianceStatus: 'inceleniyor',
    hangelSubject: 'Saklama süreleri ve süre sonunda imha. Hesap silme akışı.',
    affectedModules: ['Üyelik', 'Mesajlaşma', 'Bağış'],
    articleText: 'Saklama ve imha politikası, periyodik imha (6 ay), anonimleştirme yöntemleri.',
    interpretation: 'hangel saklama/imha politikası + periyodik imha takvimi belgelendirmeli; "hesabımı sil" işlevi bununla uyumlu olmalı.',
    links: `${RG}\n${KVKK_KARAR}`,
  },
  {
    id: 'tr-verbis-yonetmelik', name: 'Veri Sorumluları Sicili Hakkında Yönetmelik (VERBİS)', country: 'TR',
    category: 'KVKK', riskLevel: 'orta', complianceStatus: 'inceleniyor',
    hangelSubject: 'hangel veri sorumlusu; eşik aşılıyorsa VERBİS kaydı zorunlu.',
    affectedModules: ['Üyelik', 'Bağış', 'Mesajlaşma'],
    articleText: 'Sicile kayıt yükümlülüğü, istisnalar ve bildirim usulleri.',
    interpretation: 'Çalışan sayısı/ciro eşiği kontrol edilmeli; gerekirse işleme envanteri + kayıt yapılmalı.',
    links: `${RG}\n${KVKK_KARAR}`,
  },
  {
    id: 'tr-saglik-verileri-yonetmelik', name: 'Kişisel Sağlık Verileri Hakkında Yönetmelik', number: '30808', country: 'TR',
    category: 'KVKK', riskLevel: 'yuksek', complianceStatus: 'aksiyon-gerekli',
    hangelSubject: 'Kan grubu ve kan ihtiyacı bilgisi sağlık verisidir; acil kan ilanı doğrudan kapsamda.',
    affectedModules: ['Kan İlanı'],
    articleText: 'Sağlık verisinin işlenmesi, paylaşımı, anonimleştirme ve güvenlik tedbirleri.',
    interpretation: 'Kan ilanında sağlık verisi minimumda tutulmalı, açık rıza alınmalı, yalnızca eşleştirme amacıyla işlenmeli.',
    links: `${RG}\n${KVKK_KARAR}`,
  },

  // ============================ TÜRKİYE — STK / Dernek / Vakıf ============================
  {
    id: 'tr-dernekler-5253', name: 'Dernekler Kanunu', number: '5253', country: 'TR',
    category: 'Dernekler Kanunu', riskLevel: 'orta', complianceStatus: 'inceleniyor',
    hangelSubject: 'hangel dernek değil; STK\'ları listeler ve aracılık eder. STK\'ların beyan/kayıt yükümlülükleri platformu dolaylı bağlar.',
    affectedModules: ['Üyelik', 'Gönüllülük', 'Bağış'],
    articleText: 'Üye kayıtları, beyanname, denetim, yardım/işbirliği; DERBİS beyanları.',
    interpretation: 'Platformdaki derneklerin yasal statüsü (kütük no, tüzük) doğrulanmalı; aracılık DERBİS yükümlülükleriyle uyumlu olmalı.',
    links: `${kanun('5253')}\n${SIVILTOPLUM}\n${DANISTAY}`,
  },
  {
    id: 'tr-dernekler-yonetmelik', name: 'Dernekler Yönetmeliği', country: 'TR',
    category: 'Dernekler Kanunu', riskLevel: 'orta', complianceStatus: 'inceleniyor',
    hangelSubject: 'Derneklerin defter, beyanname ve elektronik sistem (DERBİS) yükümlülükleri.',
    affectedModules: ['Üyelik', 'Bağış'],
    articleText: 'Tutulacak defterler, beyanname formatları, yardım toplama bildirimleri.',
    interpretation: 'hangel STK\'lara raporlama kolaylığı sağlıyorsa formatlar yönetmelikle uyumlu olmalı.',
    links: `${SIVILTOPLUM}\n${RG}`,
  },
  {
    id: 'tr-medeni-kanun-4721', name: 'Türk Medeni Kanunu (Dernek ve Vakıf hükümleri)', number: '4721', country: 'TR',
    category: 'Dernekler Kanunu', riskLevel: 'dusuk', complianceStatus: 'uyumlu',
    hangelSubject: 'Dernek (md.56 vd.) ve vakıf (md.101 vd.) tüzel kişiliğinin hukuki temeli.',
    affectedModules: ['Üyelik', 'Gönüllülük'],
    articleText: 'md.56 vd. dernekler; md.101 vd. vakıflar; üyelik, organlar, sona erme.',
    interpretation: 'STK türü (dernek/vakıf) ayrımı platformda doğru modellenmeli; vakıflarda VGM denetimi ayrıdır.',
    links: `${kanun('4721')}\n${YARGITAY}`,
  },

  // ============================ TÜRKİYE — Bağış / Yardım / Fon ============================
  {
    id: 'tr-yardim-toplama-2860', name: 'Yardım Toplama Kanunu', number: '2860', country: 'TR',
    category: 'Yardım Toplama', riskLevel: 'kritik', complianceStatus: 'riskli',
    hangelSubject: 'EN KRİTİK ALAN. İzinsiz yardım toplama yasak. Bağış akışının "aracılık" mı "yardım toplama" mı sayıldığı doğrudan risk doğurur.',
    affectedModules: ['Bağış'],
    articleText: 'md.3 tanım; md.5-6 izin (mülki amir/İçişleri); izinsiz toplamaya yaptırım.',
    interpretation: 'hangel para havuzlarsa izin gerekir. Güvenli model: bağışı doğrudan yetkili STK hesabına yönlendiren teknik aracılık; para hangel\'de tutulmaz. Her kampanya için izin/istisna ayrı kontrol.',
    links: `${kanun('2860')}\n${SIVILTOPLUM}\n${DANISTAY}`,
  },
  {
    id: 'tr-yardim-toplama-yonetmelik', name: 'Yardım Toplama Esas ve Usulleri Hakkında Yönetmelik', country: 'TR',
    category: 'Yardım Toplama', riskLevel: 'yuksek', complianceStatus: 'riskli',
    hangelSubject: 'İzin başvurusu, makbuz/banka düzeni, hesap verme; online yardım toplamanın usulü.',
    affectedModules: ['Bağış'],
    articleText: 'İzin başvurusu, yardım toplama süresi, makbuz ve bankada toplama, denetim ve kesin hesap.',
    interpretation: 'Online bağışta makbuz/iz takibi ve kesin hesap düzeni bu yönetmelikle uyumlu kurgulanmalı.',
    links: `${SIVILTOPLUM}\n${RG}`,
  },
  {
    id: 'tr-kitle-fonlamasi-spk', name: 'Kitle Fonlaması Tebliği (SPK) — 6362 sayılı Sermaye Piyasası Kanunu', number: '6362', country: 'TR',
    category: 'Yardım Toplama', riskLevel: 'yuksek', complianceStatus: 'inceleniyor',
    hangelSubject: 'Platform üzerinden fon/kampanya toplanması "kitle fonlaması" sayılırsa SPK lisanslı platform şartı doğar.',
    affectedModules: ['Bağış', 'Ödeme'],
    articleText: 'Paya/borçlanmaya/bağışa & ödüle dayalı kitle fonlaması; yalnızca SPK listesindeki lisanslı platformlar aracılık edebilir.',
    interpretation: 'hangel\'in bağış modeli "bağış/yardım" olarak kalmalı; yatırım/ödül vaadi içermemeli. Aksi halde SPK lisansı gerekir.',
    links: `${SPK}\n${kanun('6362')}`,
  },
  {
    id: 'tr-masak-5549', name: 'Suç Gelirlerinin Aklanmasının Önlenmesi Hakkında Kanun (MASAK)', number: '5549', country: 'TR',
    category: 'Vergi', riskLevel: 'yuksek', complianceStatus: 'inceleniyor',
    hangelSubject: 'Bağış/ödeme akışlarında kara para aklama ve şüpheli işlem riski.',
    affectedModules: ['Bağış', 'Ödeme'],
    articleText: 'Kimlik tespiti, şüpheli işlem bildirimi, kayıt saklama yükümlülükleri.',
    interpretation: 'Yüksek tutarlı/anormal bağış akışları için kimlik tespiti + şüpheli işlem izleme. Lisanslı ödeme kuruluşu bu yükümlülüğün büyük kısmını üstlenir.',
    links: `${MASAK}\n${kanun('5549')}`,
  },
  {
    id: 'tr-terorun-finansmani-6415', name: 'Terörizmin Finansmanının Önlenmesi Hakkında Kanun', number: '6415', country: 'TR',
    category: 'Vergi', riskLevel: 'yuksek', complianceStatus: 'inceleniyor',
    hangelSubject: 'STK\'lar üzerinden fon akışında terörün finansmanı denetimi (FATF kriterleri).',
    affectedModules: ['Bağış'],
    articleText: 'Malvarlığının dondurulması, denetim ve bildirim; STK\'lara yönelik risk denetimi.',
    interpretation: 'Listelenen STK\'ların yasal denetim durumu izlenmeli; yaptırım listeleriyle çakışma kontrolü.',
    links: `${kanun('6415')}\n${MASAK}`,
  },
  {
    id: 'tr-vergi-dernek-iktisadi', name: 'Vergi Mevzuatı (KVK 5520 / KDV 3065 / VUK 213 — dernek iktisadi işletme)', country: 'TR',
    category: 'Vergi', riskLevel: 'orta', complianceStatus: 'inceleniyor',
    hangelSubject: 'Dernek/vakıfların ticari faaliyeti iktisadi işletme sayılır; platform gelir modeli vergisel sonuç doğurur.',
    affectedModules: ['Bağış', 'Ödeme'],
    articleText: 'Kurumlar vergisi muafiyeti/iktisadi işletme, KDV, belge düzeni (fatura/makbuz).',
    interpretation: 'hangel komisyon/hizmet geliri vergiye tabidir; STK\'ların bağış makbuzu ve iktisadi işletme ayrımı netleştirilmeli.',
    links: `${kanun('5520')}\n${kanun('3065')}\n${kanun('213')}`,
  },

  // ============================ TÜRKİYE — E-Ticaret / İletişim / İnternet ============================
  {
    id: 'tr-eticaret-6563', name: 'Elektronik Ticaretin Düzenlenmesi Hakkında Kanun', number: '6563', country: 'TR',
    category: 'Elektronik Ticaret', riskLevel: 'orta', complianceStatus: 'eksik',
    hangelSubject: 'Ticari elektronik ileti (bildirim/kampanya) ve market/aracılık hizmeti. İYS onayı gerekebilir.',
    affectedModules: ['Bağış', 'Ödeme', 'Mesajlaşma'],
    articleText: 'md.6 önceden onay (opt-in); md.7-8 onay/ret ve içerik; hizmet sağlayıcı bilgilendirme; İYS kaydı.',
    interpretation: 'Pazarlama iletileri İYS\'den onaylı olmalı; işlem/güvenlik bildirimleriyle ayrıştırılmalı.',
    links: `${kanun('6563')}\n${ETICARET}\n${DANISTAY}`,
  },
  {
    id: 'tr-eticaret-aracilik-yonetmelik', name: 'Elektronik Ticaret Aracı Hizmet Sağlayıcı ve Hizmet Sağlayıcılar Hakkında Yönetmelik (ETBİS)', country: 'TR',
    category: 'Elektronik Ticaret', riskLevel: 'orta', complianceStatus: 'inceleniyor',
    hangelSubject: 'hangel aracı hizmet sağlayıcı (pazar yeri) niteliğindeyse ETBİS kaydı + aracılık yükümlülükleri.',
    affectedModules: ['Ödeme', 'Bağış'],
    articleText: 'Aracı hizmet sağlayıcı tanımı, ETBİS kayıt, bilgi verme ve sorumluluk dağılımı.',
    interpretation: 'Market/aracılık modülü büyürse ETBİS kaydı ve satıcı-platform sorumluluk ayrımı gerekli.',
    links: `${ETICARET}\n${RG}`,
  },
  {
    id: 'tr-ticari-iletisim-yonetmelik', name: 'Ticari İletişim ve Ticari Elektronik İletiler Hakkında Yönetmelik', country: 'TR',
    category: 'Elektronik Ticaret', riskLevel: 'orta', complianceStatus: 'eksik',
    hangelSubject: 'WhatsApp/SMS/e-posta/push iletilerinin onay, içerik ve ret kuralları.',
    affectedModules: ['Mesajlaşma'],
    articleText: 'Onayın alınması/ispatı, ileti içeriği, kolay ret, İYS entegrasyonu.',
    interpretation: 'Her ticari iletide gönderen kimliği + ret imkânı; onay kayıtları ispat için saklanmalı.',
    links: `${ETICARET}\n${RG}`,
  },
  {
    id: 'tr-internet-5651', name: 'İnternet Ortamında Yapılan Yayınların Düzenlenmesi Hakkında Kanun', number: '5651', country: 'TR',
    category: 'Diğer', riskLevel: 'orta', complianceStatus: 'inceleniyor',
    hangelSubject: 'hangel yer/içerik sağlayıcı. Kullanıcı içerikleri için kaldırma + log yükümlülükleri.',
    affectedModules: ['Mesajlaşma', 'Etkinlik'],
    articleText: 'Yer/içerik/erişim sağlayıcı yükümlülükleri; içeriğin yayından çıkarılması; trafik bilgisi (log) saklama; sosyal ağ sağlayıcı (7253) ek yükümlülükler.',
    interpretation: 'İçerik moderasyon + bildirim/şikâyet (notice-and-takedown) + log saklama. Erişim eşiği aşılırsa temsilci/raporlama.',
    links: `${kanun('5651')}\n${BTK}\n${AYM}`,
  },

  // ============================ TÜRKİYE — Sağlık / Kan ============================
  {
    id: 'tr-kan-5624', name: 'Kan ve Kan Ürünleri Kanunu', number: '5624', country: 'TR',
    category: 'Diğer', riskLevel: 'yuksek', complianceStatus: 'aksiyon-gerekli',
    hangelSubject: 'Acil kan ilanı modülünü doğrudan ilgilendirir. Kan menfaat karşılığı alınıp satılamaz; temin yetkili kuruluşlarca (Kızılay).',
    affectedModules: ['Kan İlanı'],
    articleText: 'Kanın bağış esası, ticari amaçlı alım-satım yasağı, kan hizmet birimlerinin yetkilendirilmesi.',
    interpretation: 'hangel YALNIZCA ihtiyaç duyurusu + gönüllü eşleştirme yapmalı; kan teminine/ticaretine aracılık ETMEMELİ. "Para karşılığı kan" talepleri engellenmeli; kullanıcılar Kızılay\'a yönlendirilmeli.',
    links: `${kanun('5624')}\nhttps://www.kanver.org/\n${DANISTAY}`,
  },
  {
    id: 'tr-kan-yonetmelik', name: 'Kan ve Kan Ürünleri Yönetmeliği', country: 'TR',
    category: 'Diğer', riskLevel: 'orta', complianceStatus: 'inceleniyor',
    hangelSubject: 'Kan bağışı süreçleri, uygunluk ve izlenebilirlik.',
    affectedModules: ['Kan İlanı'],
    articleText: 'Bağışçı uygunluğu, kan alma/işleme, izlenebilirlik ve bildirim.',
    interpretation: 'hangel tıbbi süreçlere girmemeli; yalnızca bilgilendirme + yetkili merkeze yönlendirme.',
    links: `${RG}`,
  },

  // ============================ TÜRKİYE — Çocuk / Sözleşme / Tüketici / Ödeme / Erişilebilirlik / İş ============================
  {
    id: 'tr-cocuk-koruma-5395', name: 'Çocuk Koruma Kanunu', number: '5395', country: 'TR',
    category: 'Çocuk Koruma', riskLevel: 'yuksek', complianceStatus: 'inceleniyor',
    hangelSubject: '18 yaş altı kullanıcılar (öğrenci kulüpleri, genç gönüllüler) için ek koruma.',
    affectedModules: ['Üyelik', 'Gönüllülük', 'Mesajlaşma'],
    articleText: 'Çocuğun korunmasına ilişkin tedbirler ve üstün yararı ilkesi.',
    interpretation: 'Reşit olmayanda veli/vasi rızası, yaşa uygun içerik, çocuk güvenliği politikası; çocuk-yetişkin doğrudan mesajlaşması sınırlanmalı.',
    links: `${kanun('5395')}\n${YARGITAY}`,
  },
  {
    id: 'tr-tck-5237', name: 'Türk Ceza Kanunu (ilgili maddeler)', number: '5237', country: 'TR',
    category: 'Diğer', riskLevel: 'yuksek', complianceStatus: 'inceleniyor',
    hangelSubject: 'Sahte ilan/dolandırıcılık (kan/bağış istismarı) ve veri ihlalleri cezai sorumluluk doğurur.',
    affectedModules: ['Bağış', 'Kan İlanı', 'Mesajlaşma', 'Üyelik'],
    articleText: 'md.135-136 kişisel verileri kaydetme/verme; md.157-158 dolandırıcılık; md.226 müstehcenlik.',
    interpretation: 'Bağış/kan istismarına karşı doğrulama + şüpheli ilan tespiti; veri ihlaline karşı teknik tedbir + adli yönlendirme.',
    links: `${kanun('5237')}\n${YARGITAY}`,
  },
  {
    id: 'tr-tbk-6098', name: 'Türk Borçlar Kanunu (sözleşme ve bağışlama)', number: '6098', country: 'TR',
    category: 'Diğer', riskLevel: 'dusuk', complianceStatus: 'uyumlu',
    hangelSubject: 'Kullanıcı sözleşmesi, üyelik ve bağış işlemlerinin hukuki temeli; elektronik irade beyanı.',
    affectedModules: ['Bağış', 'Üyelik', 'Ödeme'],
    articleText: 'md.1 vd. sözleşmenin kurulması; md.285 vd. bağışlama; elektronik ortamda irade beyanı.',
    interpretation: 'Onaylar ispatlanabilir tutulmalı (zaman, sürüm, IP, hash). Sözleşme metinleri açık olmalı.',
    links: `${kanun('6098')}\n${YARGITAY}`,
  },
  {
    id: 'tr-tuketici-6502', name: 'Tüketicinin Korunması Hakkında Kanun', number: '6502', country: 'TR',
    category: 'Diğer', riskLevel: 'orta', complianceStatus: 'inceleniyor',
    hangelSubject: 'Market/aracılık modülünde mesafeli satış, ön bilgilendirme, cayma hakkı.',
    affectedModules: ['Ödeme'],
    articleText: 'Mesafeli sözleşmeler, ön bilgilendirme, cayma hakkı, ayıplı mal/hizmet.',
    interpretation: 'Market işlemlerinde ön bilgilendirme + cayma hakkı; aracı konumda sorumluluk satıcı sözleşmesinde netleştirilmeli.',
    links: `${kanun('6502')}\n${DANISTAY}`,
  },
  {
    id: 'tr-mesafeli-sozlesme-yonetmelik', name: 'Mesafeli Sözleşmeler Yönetmeliği', country: 'TR',
    category: 'Diğer', riskLevel: 'orta', complianceStatus: 'inceleniyor',
    hangelSubject: 'Online işlemlerde ön bilgilendirme formu ve cayma süreci.',
    affectedModules: ['Ödeme'],
    articleText: 'Ön bilgilendirme zorunlu unsurları, 14 günlük cayma hakkı, istisnalar.',
    interpretation: 'Market akışında ön bilgilendirme + cayma akışı uygulanmalı.',
    links: `${ETICARET}\n${RG}`,
  },
  {
    id: 'tr-odeme-6493', name: 'Ödeme ve Elektronik Para Kuruluşları Hakkında Kanun', number: '6493', country: 'TR',
    category: 'Diğer', riskLevel: 'yuksek', complianceStatus: 'aksiyon-gerekli',
    hangelSubject: 'Bağış/ödeme tahsilatı lisans gerektirir; hangel lisanslı kuruluş (ör. N-Kolay) üzerinden çalışmalı.',
    affectedModules: ['Ödeme', 'Bağış'],
    articleText: 'Ödeme hizmeti/e-para faaliyetlerinin lisansa tabi olması; yetkisiz faaliyet yasağı; TCMB denetimi.',
    interpretation: 'hangel kendi adına para tutmamalı; tahsilat lisanslı kuruluş üzerinden, fonlar doğrudan alıcı STK\'ya akmalı.',
    links: `${RG}\n${DANISTAY}`,
  },
  {
    id: 'tr-banka-kartlari-5464', name: 'Banka Kartları ve Kredi Kartları Kanunu', number: '5464', country: 'TR',
    category: 'Diğer', riskLevel: 'orta', complianceStatus: 'inceleniyor',
    hangelSubject: 'Kartla bağış/ödeme alınmasında kart işlemleri ve üye işyeri kuralları.',
    affectedModules: ['Ödeme'],
    articleText: 'Kart çıkarma, üye işyeri sözleşmeleri, harcama belgesi.',
    interpretation: 'Kart tahsilatı PSP/banka üye işyeri kuralları + PCI-DSS ile uyumlu olmalı.',
    links: `${kanun('5464')}`,
  },
  {
    id: 'tr-engelliler-5378', name: 'Engelliler Hakkında Kanun (erişilebilirlik)', number: '5378', country: 'TR',
    category: 'Diğer', riskLevel: 'dusuk', complianceStatus: 'inceleniyor',
    hangelSubject: 'Uygulama ve web sitesinin engelli erişilebilirliği (WCAG).',
    affectedModules: ['Üyelik', 'Etkinlik'],
    articleText: 'Bilgiye ve hizmete erişimde ayrımcılık yasağı ve erişilebilirlik yükümlülüğü.',
    interpretation: 'Arayüz WCAG 2.1 AA hedeflenmeli (kontrast, ekran okuyucu, klavye). AB Erişilebilirlik Yasası ile paralel.',
    links: `${kanun('5378')}`,
  },
  {
    id: 'tr-is-kanunu-4857', name: 'İş Kanunu (gönüllü ↔ çalışan ayrımı)', number: '4857', country: 'TR',
    category: 'İş Hukuku', riskLevel: 'orta', complianceStatus: 'inceleniyor',
    hangelSubject: 'Gönüllülük puantajı/ödül sistemi, gönüllüyü fiilen "işçi" konumuna sokmamalı.',
    affectedModules: ['Gönüllülük'],
    articleText: 'İş sözleşmesi unsurları (bağımlılık, ücret, süreklilik); gizli istihdam riski.',
    interpretation: 'Gönüllülük puanı/teşvik ücret/iş ilişkisi izlenimi vermemeli; gönüllülük çerçevesi sözleşmeyle netleştirilmeli.',
    links: `${kanun('4857')}\n${YARGITAY}`,
  },
  {
    id: 'tr-yapay-zeka', name: 'Yapay Zeka Uyumu (TR — özel kanun yok; KVKK + Ulusal YZ Stratejisi)', country: 'TR',
    category: 'Diğer', riskLevel: 'orta', complianceStatus: 'inceleniyor',
    hangelSubject: 'TR\'de yürürlükte özel YZ kanunu yok. AI özellikleri (Etki Hikayem, Market Asistanı) KVKK + genel hukuk ile değerlendirilir.',
    affectedModules: ['AI Araçları'],
    articleText: 'Ulusal Yapay Zeka Stratejisi (CBDDO); KVKK md.4 ölçülülük; otomatik kararlarda şeffaflık.',
    interpretation: 'AI çıktısında "yapay zeka üretimi" bildirimi + insan denetimi + veri minimizasyonu. AB AI Act yaklaşımı referans alınmalı.',
    links: `${KVKK_KARAR}\nhttps://cbddo.gov.tr/yapay-zeka`,
  },

  // ============================ AVRUPA BİRLİĞİ ============================
  {
    id: 'eu-gdpr-2016-679', name: 'GDPR — General Data Protection Regulation', number: '2016/679', country: 'EU',
    category: 'KVKK', riskLevel: 'kritik', complianceStatus: 'aksiyon-gerekli',
    hangelSubject: 'AB\'deki kullanıcılara hizmet/izleme yapıldığında uygulanır (md.3 ülke dışı etki). KVKK\'nın AB karşılığı, daha geniş.',
    affectedModules: ['Bağış', 'Gönüllülük', 'AI Araçları', 'Mesajlaşma', 'Kan İlanı', 'Üyelik', 'Ödeme'],
    articleText: 'Art.5 ilkeler; Art.6 hukuki dayanak; Art.9 özel kategori (sağlık); Art.7 rıza; Art.13-14 bilgilendirme; Art.17 silme hakkı; Art.33-34 ihlal bildirimi (72 saat); Art.44+ uluslararası aktarım.',
    interpretation: 'AB kullanıcısı varsa: AB temsilcisi (Art.27), DPO değerlendirmesi, 72 saatte ihlal bildirimi, veri taşınabilirliği/silme hakları. İdari ceza 20M€ veya cironun %4\'ü.',
    links: `${eurlexReg('2016', '679')}\n${EDPB}\n${CJEU}`,
  },
  {
    id: 'eu-ai-act-2024-1689', name: 'AI Act — Artificial Intelligence Act', number: '2024/1689', country: 'EU',
    category: 'Diğer', riskLevel: 'yuksek', complianceStatus: 'inceleniyor',
    hangelSubject: 'AB\'de AI sistemleri için risk-temelli rejim. hangel\'in AI özellikleri sınıflandırılmalı (çoğunlukla sınırlı/asgari risk + şeffaflık).',
    affectedModules: ['AI Araçları'],
    articleText: 'Risk sınıfları (yasak / yüksek / sınırlı / asgari); şeffaflık yükümlülükleri (Art.50): kullanıcıya AI ile etkileşimde olduğu ve içeriğin yapay üretildiği bildirilmeli.',
    interpretation: 'AI üretimi içerik (Etki Hikayem) "yapay zeka üretimidir" etiketiyle sunulmalı; insan denetimi + log. Yüksek riskli kullanım yoksa yük asgari.',
    links: `${eurlexReg('2024', '1689')}`,
  },
  {
    id: 'eu-dsa-2022-2065', name: 'DSA — Digital Services Act', number: '2022/2065', country: 'EU',
    category: 'Diğer', riskLevel: 'yuksek', complianceStatus: 'inceleniyor',
    hangelSubject: 'AB\'de aracı/platform hizmetleri için içerik moderasyon, bildirim-aksiyon ve şeffaflık yükümlülükleri.',
    affectedModules: ['Mesajlaşma', 'Etkinlik'],
    articleText: 'Bildirim ve eylem (notice-and-action), şikâyet mekanizması, şeffaflık raporları, yasa dışı içeriğe karşı tedbir; çok büyük platformlar için ek yük.',
    interpretation: 'Kullanıcı içeriği için DSA uyumlu bildirim/itiraz akışı + şeffaflık. AB pazarına girişte zorunlu.',
    links: `${eurlexReg('2022', '2065')}\n${CJEU}`,
  },
  {
    id: 'eu-dma-2022-1925', name: 'DMA — Digital Markets Act', number: '2022/1925', country: 'EU',
    category: 'Diğer', riskLevel: 'dusuk', complianceStatus: 'uyumlu',
    hangelSubject: 'Yalnızca "gatekeeper" büyük platformlara uygulanır. hangel bu eşikte değil; izleme amaçlı.',
    affectedModules: [],
    articleText: 'Gatekeeper yükümlülükleri (kendine kayırma yasağı, birlikte çalışabilirlik vb.).',
    interpretation: 'Şu an kapsam dışı; büyüme senaryosunda yeniden değerlendirilir.',
    links: `${eurlexReg('2022', '1925')}`,
  },
  {
    id: 'eu-eprivacy-2002-58', name: 'ePrivacy Directive (çerez ve elektronik iletişim gizliliği)', number: '2002/58', country: 'EU',
    category: 'KVKK', riskLevel: 'orta', complianceStatus: 'inceleniyor',
    hangelSubject: 'Çerez onayı ve elektronik iletişimde gizlilik. Web/app izleme teknolojileri.',
    affectedModules: ['Üyelik', 'Mesajlaşma'],
    articleText: 'Çerezler için önceden onay (zorunlu çerezler hariç); elektronik pazarlama onayı.',
    interpretation: 'AB ziyaretçilerine çerez onay bandı (reddet kadar kolay kabul) + kategori yönetimi gerekli.',
    links: `${eurlexDir('2002', '58')}\n${EDPB}`,
  },
  {
    id: 'eu-psd2-2015-2366', name: 'PSD2 — Payment Services Directive 2', number: '2015/2366', country: 'EU',
    category: 'Diğer', riskLevel: 'yuksek', complianceStatus: 'inceleniyor',
    hangelSubject: 'AB\'de ödeme/bağış tahsilatı; güçlü müşteri kimlik doğrulama (SCA) ve lisanslı PSP şartı.',
    affectedModules: ['Ödeme', 'Bağış'],
    articleText: 'Ödeme hizmeti lisansı, güçlü kimlik doğrulama (SCA), açık bankacılık.',
    interpretation: 'AB tahsilatında SCA destekli, lisanslı PSP (ör. Stripe/Adyen) kullanılmalı; hangel para tutmamalı.',
    links: `${eurlexDir('2015', '2366')}`,
  },
  {
    id: 'eu-consumer-rights-2011-83', name: 'Consumer Rights Directive', number: '2011/83', country: 'EU',
    category: 'Diğer', riskLevel: 'orta', complianceStatus: 'inceleniyor',
    hangelSubject: 'AB\'de mesafeli sözleşme, ön bilgilendirme ve 14 gün cayma hakkı.',
    affectedModules: ['Ödeme'],
    articleText: 'Ön bilgilendirme, 14 günlük cayma hakkı, dijital içerik kuralları.',
    interpretation: 'AB market/işlem akışında ön bilgilendirme + cayma; ulusal uygulamalar ülke bazlı kontrol edilmeli.',
    links: `${eurlexDir('2011', '83')}`,
  },
  {
    id: 'eu-ecommerce-2000-31', name: 'e-Commerce Directive', number: '2000/31', country: 'EU',
    category: 'Elektronik Ticaret', riskLevel: 'orta', complianceStatus: 'inceleniyor',
    hangelSubject: 'AB\'de bilgi toplumu hizmetleri; aracı sorumluluk sınırı (hosting) ve bilgilendirme.',
    affectedModules: ['Mesajlaşma', 'Ödeme'],
    articleText: 'Hizmet sağlayıcı bilgilendirme, ticari iletişim, aracı sorumluluğu (DSA ile güncellendi).',
    interpretation: 'Aracı sorumluluk sınırı için hızlı kaldırma; DSA ile birlikte uygulanır.',
    links: `${eurlexDir('2000', '31')}`,
  },
  {
    id: 'eu-nis2-2022-2555', name: 'NIS2 — Ağ ve Bilgi Güvenliği Direktifi', number: '2022/2555', country: 'EU',
    category: 'Diğer', riskLevel: 'orta', complianceStatus: 'inceleniyor',
    hangelSubject: 'Belirli dijital hizmetler için siber güvenlik risk yönetimi ve olay bildirimi.',
    affectedModules: ['Üyelik', 'Ödeme'],
    articleText: 'Risk yönetimi tedbirleri, olay bildirimi, yönetim sorumluluğu.',
    interpretation: 'Kapsam değerlendirilmeli; kapsamda ise güvenlik politikası + olay bildirim süreci kurulmalı.',
    links: `${eurlexDir('2022', '2555')}`,
  },
  {
    id: 'eu-accessibility-2019-882', name: 'European Accessibility Act', number: '2019/882', country: 'EU',
    category: 'Diğer', riskLevel: 'orta', complianceStatus: 'inceleniyor',
    hangelSubject: 'AB\'de dijital ürün/hizmetlerin erişilebilirliği (2025 itibarıyla uygulanır).',
    affectedModules: ['Üyelik', 'Etkinlik'],
    articleText: 'E-ticaret ve dijital hizmetlerde erişilebilirlik gereksinimleri (EN 301 549 / WCAG).',
    interpretation: 'AB pazarına girişte arayüz WCAG 2.1 AA uyumu zorunlu olur.',
    links: `${eurlexDir('2019', '882')}`,
  },

  // ============================ ULUSLARARASI ============================
  {
    id: 'int-uncrc', name: 'BM Çocuk Haklarına Dair Sözleşme (UNCRC)', country: 'INT',
    category: 'Çocuk Koruma', riskLevel: 'orta', complianceStatus: 'inceleniyor',
    hangelSubject: 'Çocuk kullanıcıların korunmasında uluslararası asgari standart (TR taraf).',
    affectedModules: ['Üyelik', 'Gönüllülük', 'Mesajlaşma'],
    articleText: 'Çocuğun üstün yararı (md.3), katılım, korunma; dijital ortamda Genel Yorum No.25.',
    interpretation: 'Çocuk güvenliği politikası ve yaşa uygun tasarım UNCRC Genel Yorum No.25 ile uyumlu olmalı.',
    links: `${OHCHR}`,
  },
];
