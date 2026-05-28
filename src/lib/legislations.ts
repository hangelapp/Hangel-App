/**
 * Hangel hukuk merkezi — varsayılan mevzuat kütüphanesi (seed).
 *
 * super-admin/contracts → Mevzuatlar sekmesindeki "Varsayılan Mevzuatları İçe Aktar"
 * butonu bu listeyi `legislations` koleksiyonuna yazar (setDoc merge, id = slug).
 *
 * Kapsam: sosyal etki platformu (STK/bağış/gönüllülük/kan/e-ticaret/AI/çocuk).
 * Kanun künyeleri (Resmi Gazete tarih/sayı) resmî yayınlardan alınmıştır.
 *
 * links alanı = satır satır resmî kaynaklar:
 *   - Kanun metni: mevzuat.gov.tr (1.5.{kanun no} PDF kalıbı)
 *   - İlgili kararlar: KVKK Kurul kararları, Danıştay & AYM karar arama portalları
 *     (somut esas/karar no'ları hukukçu tarafından doğrulanmalı — portal linki verildi).
 */

export type SeedRiskLevel = 'dusuk' | 'orta' | 'yuksek' | 'kritik';
export type SeedComplianceStatus = 'uyumlu' | 'inceleniyor' | 'eksik' | 'riskli' | 'aksiyon-gerekli';

export interface SeedLegislation {
  id: string;
  name: string;
  number?: string;
  category?: string;
  riskLevel?: SeedRiskLevel;
  complianceStatus?: SeedComplianceStatus;
  hangelSubject?: string;
  affectedModules?: string[];
  articleText?: string;
  interpretation?: string;
  links?: string;
}

// Resmî portallar (karar arama) — somut kararlar buradan doğrulanır.
const KVKK_KARAR = 'https://www.kvkk.gov.tr/Icerik/5406/Kurul-Karar-Ozetleri';
const DANISTAY_KARAR = 'https://karararama.danistay.gov.tr/';
const AYM_KARAR = 'https://kararlarbilgibankasi.anayasa.gov.tr/';
const YARGITAY_KARAR = 'https://karararama.yargitay.gov.tr/';
const RG_ARSIV = 'https://www.resmigazete.gov.tr/';
const mevzuat = (no: string) => `https://www.mevzuat.gov.tr/mevzuatmetin/1.5.${no}.pdf`;

export const legislationsData: SeedLegislation[] = [
  {
    id: 'kvkk-6698',
    name: 'Kişisel Verilerin Korunması Kanunu',
    number: '6698',
    category: 'KVKK',
    riskLevel: 'yuksek',
    complianceStatus: 'aksiyon-gerekli',
    hangelSubject: 'Hangel kimlik, telefon, e-posta, konum ve kan grubu gibi verileri işler. Kan grubu/sağlık verisi md.6 "özel nitelikli veri" — daha sıkı korunmalı.',
    affectedModules: ['Bağış', 'Gönüllülük', 'Etkinlik', 'AI Araçları', 'Mesajlaşma', 'Kan İlanı', 'Üyelik', 'Ödeme'],
    articleText: 'md.4 genel ilkeler (hukuka uygunluk, amaçla bağlılık, ölçülülük); md.5 işleme şartları ve açık rıza; md.6 özel nitelikli kişisel veriler (sağlık verisi); md.10 aydınlatma yükümlülüğü; md.12 veri güvenliği tedbirleri.',
    interpretation: 'Aydınlatma metni + açık rıza akışı her veri toplama noktasında bulunmalı. Kan ilanı sağlık verisi içerdiğinden açık rıza ve ek güvenlik şart. VERBİS kaydı (eşik aşılıyorsa) zorunlu. İhlalde idari para cezası + TCK md.135-136 cezai sorumluluk.',
    links: `${mevzuat('6698')}\n${KVKK_KARAR}\n${AYM_KARAR}`,
  },
  {
    id: 'veri-sorumlulari-sicili-verbis',
    name: 'Veri Sorumluları Sicili Hakkında Yönetmelik (VERBİS)',
    number: '30286',
    category: 'KVKK',
    riskLevel: 'orta',
    complianceStatus: 'inceleniyor',
    hangelSubject: 'Hangel bir "veri sorumlusu". Çalışan sayısı/yıllık mali bilanço eşiği aşılıyorsa VERBİS\'e kayıt zorunlu.',
    affectedModules: ['Üyelik', 'Bağış', 'Mesajlaşma'],
    articleText: 'Veri Sorumluları Sicili\'ne kayıt yükümlülüğü, istisnaları ve bildirim usulleri.',
    interpretation: 'Eşik durumu kontrol edilmeli; kayıt gerekiyorsa işleme envanteri + saklama/imha politikası hazırlanmalı. KVKK ile birlikte değerlendirilir.',
    links: `${RG_ARSIV}\n${KVKK_KARAR}`,
  },
  {
    id: 'kisisel-saglik-verileri-yonetmelik',
    name: 'Kişisel Sağlık Verileri Hakkında Yönetmelik',
    number: '30808',
    category: 'KVKK',
    riskLevel: 'yuksek',
    complianceStatus: 'aksiyon-gerekli',
    hangelSubject: 'Kan grubu ve kan ihtiyacı bilgisi sağlık verisidir. Acil kan ilanı modülü doğrudan bu yönetmelik kapsamına girer.',
    affectedModules: ['Kan İlanı'],
    articleText: 'Sağlık verilerinin işlenmesi, paylaşımı, anonimleştirme ve güvenlik tedbirleri.',
    interpretation: 'Kan ilanında hasta/bağışçı sağlık verisi minimumda tutulmalı, açık rıza alınmalı ve yalnızca eşleştirme amacıyla işlenmeli. Üçüncü kişilere ifşa sınırlı olmalı.',
    links: `${RG_ARSIV}\n${KVKK_KARAR}`,
  },
  {
    id: 'dernekler-kanunu-5253',
    name: 'Dernekler Kanunu',
    number: '5253',
    category: 'Dernekler Kanunu',
    riskLevel: 'orta',
    complianceStatus: 'inceleniyor',
    hangelSubject: 'Hangel dernek değil; ancak STK\'ları (dernek/vakıf) listeler ve onlara aracılık eder. STK\'ların beyan ve kayıt yükümlülükleri platformu dolaylı bağlar.',
    affectedModules: ['Üyelik', 'Gönüllülük', 'Bağış'],
    articleText: 'Dernek kuruluşu, üye kayıtları, beyanname, denetim ve yardım/işbirliği hükümleri (DERBİS sistemi ile beyan).',
    interpretation: 'Platformda yer alan derneklerin yasal statüsü (kütük no, tüzük) doğrulanmalı. Hangel\'in derneklere "üye toplama/bağış aracılığı" sağlaması, derneğin DERBİS yükümlülükleriyle uyumlu olmalı.',
    links: `${mevzuat('5253')}\n${DANISTAY_KARAR}`,
  },
  {
    id: 'yardim-toplama-kanunu-2860',
    name: 'Yardım Toplama Kanunu',
    number: '2860',
    category: 'Yardım Toplama',
    riskLevel: 'kritik',
    complianceStatus: 'riskli',
    hangelSubject: 'EN KRİTİK ALAN. İzinsiz yardım toplama yasaktır. Hangel\'in bağış akışı "aracılık" mı yoksa "yardım toplama" mı sayıldığı doğrudan hukuki risk doğurur.',
    affectedModules: ['Bağış'],
    articleText: 'md.3 yardım toplama tanımı; md.5-6 izin alma zorunluluğu (mülki amir / İçişleri Bakanlığı); izinsiz toplamaya yaptırım. İzin almadan yardım toplayanlara idari/cezai sonuçlar.',
    interpretation: 'Hangel doğrudan bağış toplayıp havuzda tutarsa İZİN gerekir (yüksek risk). Güvenli model: bağışı doğrudan yetkili STK\'nın yasal hesabına yönlendiren teknik aracılık + STK\'nın kendi izni/istisnası. Para Hangel\'de tutulmamalı. Kampanya bazlı izin durumu her STK için ayrı kontrol edilmeli.',
    links: `${mevzuat('2860')}\n${DANISTAY_KARAR}\n${RG_ARSIV}`,
  },
  {
    id: 'e-ticaret-kanunu-6563',
    name: 'Elektronik Ticaretin Düzenlenmesi Hakkında Kanun',
    number: '6563',
    category: 'Elektronik Ticaret',
    riskLevel: 'orta',
    complianceStatus: 'eksik',
    hangelSubject: 'Hangel ticari elektronik ileti (bildirim, kampanya, hatırlatma) gönderiyor ve market/aracılık hizmeti sunuyor. İYS (İleti Yönetim Sistemi) onayı gerekebilir.',
    affectedModules: ['Bağış', 'Ödeme', 'Mesajlaşma'],
    articleText: 'md.6 ticari elektronik ileti için önceden onay (opt-in); md.7-8 onay/ret ve içerik kuralları; hizmet sağlayıcının bilgilendirme yükümlülüğü. İYS\'ye kayıt.',
    interpretation: 'Pazarlama/kampanya mesajları için İYS üzerinden onay yönetimi şart. İşlem/güvenlik bildirimleri (onay gerektirmeyen) ile pazarlama iletileri ayrıştırılmalı. Aksi halde idari para cezası.',
    links: `${mevzuat('6563')}\n${DANISTAY_KARAR}`,
  },
  {
    id: 'ticari-iletisim-yonetmelik',
    name: 'Ticari İletişim ve Ticari Elektronik İletiler Hakkında Yönetmelik',
    number: '29417',
    category: 'Elektronik Ticaret',
    riskLevel: 'orta',
    complianceStatus: 'eksik',
    hangelSubject: 'WhatsApp/SMS/e-posta/push ile gönderilen iletilerin onay, içerik ve ret hakkı kuralları.',
    affectedModules: ['Mesajlaşma'],
    articleText: 'Onayın alınması ve ispatı, iletinin içeriği, kolay ret imkânı, İYS entegrasyonu.',
    interpretation: 'Her ticari iletide gönderen kimliği + ret (çıkış) imkânı bulunmalı; onay kayıtları ispat için saklanmalı. Hangel\'in bildirim altyapısı bu kurallara göre etiketlenmeli.',
    links: `${RG_ARSIV}\n${DANISTAY_KARAR}`,
  },
  {
    id: 'internet-kanunu-5651',
    name: 'İnternet Ortamında Yapılan Yayınların Düzenlenmesi ve Bu Yayınlar Yoluyla İşlenen Suçlarla Mücadele Hakkında Kanun',
    number: '5651',
    category: 'Diğer',
    riskLevel: 'orta',
    complianceStatus: 'inceleniyor',
    hangelSubject: 'Hangel "yer sağlayıcı" ve "içerik sağlayıcı" konumunda. Kullanıcı içerikleri (gönderi, mesaj, ilan) için kaldırma ve log yükümlülükleri.',
    affectedModules: ['Mesajlaşma', 'Etkinlik'],
    articleText: 'Yer/içerik/erişim sağlayıcı tanımları ve yükümlülükleri; içeriğin yayından çıkarılması; trafik bilgisi (log) saklama. Sosyal ağ sağlayıcılar için ek yükümlülükler (7253 sayılı değişiklik).',
    interpretation: 'İçerik moderasyon politikası + bildirim/şikâyet (notice-and-takedown) mekanizması kurulmalı; erişim logları yasal süre saklanmalı. Erişim eşiği aşılırsa temsilci/raporlama yükümlülükleri gündeme gelir.',
    links: `${mevzuat('5651')}\n${DANISTAY_KARAR}\n${AYM_KARAR}`,
  },
  {
    id: 'kan-kanunu-5624',
    name: 'Kan ve Kan Ürünleri Kanunu',
    number: '5624',
    category: 'Diğer',
    riskLevel: 'yuksek',
    complianceStatus: 'aksiyon-gerekli',
    hangelSubject: 'Acil kan ilanı modülünü doğrudan ilgilendirir. Kan, karşılığında menfaat sağlanarak alınıp satılamaz; temin yetkili kuruluşlar (Kızılay vb.) eliyle yürür.',
    affectedModules: ['Kan İlanı'],
    articleText: 'Kanın bağış esasına dayanması, ticari amaçla alım-satımının yasak olması; kan hizmet birimlerinin yetkilendirilmesi.',
    interpretation: 'Hangel YALNIZCA ihtiyaç duyurusu ve gönüllü bağışçı eşleştirmesi yapmalı; kan teminine/ticaretine aracılık ETMEMELİ. İlanlarda "para karşılığı kan" talebi engellenmeli. Kullanıcılar yetkili merkezlere (Kızılay) yönlendirilmeli.',
    links: `${mevzuat('5624')}\n${DANISTAY_KARAR}`,
  },
  {
    id: 'cocuk-koruma-kanunu-5395',
    name: 'Çocuk Koruma Kanunu',
    number: '5395',
    category: 'Çocuk Koruma',
    riskLevel: 'yuksek',
    complianceStatus: 'inceleniyor',
    hangelSubject: '18 yaş altı kullanıcılar (öğrenci kulüpleri, genç gönüllüler). Çocuğun verisi ve gönüllülüğü için ek koruma gerekir.',
    affectedModules: ['Üyelik', 'Gönüllülük', 'Mesajlaşma'],
    articleText: 'Çocuğun korunmasına ilişkin tedbirler ve üstün yararı ilkesi (BM Çocuk Hakları Sözleşmesi ile birlikte).',
    interpretation: 'Reşit olmayan kullanıcıda veli/vasi rızası akışı, yaşa uygun içerik ve çocuk güvenliği politikası gerekli. KVKK md.6 ve çocuk verisi için ek güvenlik. Çocukların yetişkinlerle doğrudan mesajlaşması sınırlanmalı.',
    links: `${mevzuat('5395')}\n${YARGITAY_KARAR}`,
  },
  {
    id: 'tck-5237',
    name: 'Türk Ceza Kanunu (ilgili maddeler)',
    number: '5237',
    category: 'Diğer',
    riskLevel: 'yuksek',
    complianceStatus: 'inceleniyor',
    hangelSubject: 'Sahte ilan/dolandırıcılık (kan veya bağış istismarı) ve veri ihlalleri cezai sorumluluk doğurur.',
    affectedModules: ['Bağış', 'Kan İlanı', 'Mesajlaşma', 'Üyelik'],
    articleText: 'md.135 kişisel verilerin hukuka aykırı kaydedilmesi; md.136 verileri hukuka aykırı verme/ele geçirme; md.157-158 dolandırıcılık (nitelikli haller); md.226 müstehcenlik.',
    interpretation: 'Bağış/kan istismarına karşı doğrulama + şüpheli ilan tespiti; veri ihlaline karşı teknik tedbir. Suç teşkil eden içerik için bildirim ve adli mercilere yönlendirme prosedürü bulunmalı.',
    links: `${mevzuat('5237')}\n${YARGITAY_KARAR}`,
  },
  {
    id: 'tbk-6098',
    name: 'Türk Borçlar Kanunu (sözleşme ve bağışlama)',
    number: '6098',
    category: 'Diğer',
    riskLevel: 'dusuk',
    complianceStatus: 'uyumlu',
    hangelSubject: 'Kullanıcı sözleşmesi, üyelik ve bağış işlemlerinin hukuki temeli. Elektronik ortamda irade beyanı / onay.',
    affectedModules: ['Bağış', 'Üyelik', 'Ödeme'],
    articleText: 'md.1 vd. sözleşmenin kurulması; md.285 vd. bağışlama sözleşmesi; mesafeli/elektronik ortamda irade beyanı.',
    interpretation: 'Kullanıcı sözleşmesi ve bağış akışındaki onaylar geçerli elektronik irade beyanı olarak ispatlanabilir tutulmalı (onay zamanı, sürüm, IP, hash). Sözleşme metinleri açık ve anlaşılır olmalı.',
    links: `${mevzuat('6098')}\n${YARGITAY_KARAR}`,
  },
  {
    id: 'tuketici-kanunu-6502',
    name: 'Tüketicinin Korunması Hakkında Kanun',
    number: '6502',
    category: 'Diğer',
    riskLevel: 'orta',
    complianceStatus: 'inceleniyor',
    hangelSubject: 'Market/aracılık modülünde mesafeli satış, ön bilgilendirme ve cayma hakkı kuralları.',
    affectedModules: ['Ödeme'],
    articleText: 'Mesafeli sözleşmeler, ön bilgilendirme formu, cayma hakkı, ayıplı mal/hizmet hükümleri.',
    interpretation: 'Market işlemlerinde ön bilgilendirme + cayma hakkı akışı sağlanmalı. Hangel aracı konumdaysa sorumluluk paylaşımı satıcı sözleşmesinde netleştirilmeli.',
    links: `${mevzuat('6502')}\n${DANISTAY_KARAR}`,
  },
  {
    id: 'odeme-hizmetleri-6493',
    name: 'Ödeme ve Menkul Kıymet Mutabakat Sistemleri, Ödeme Hizmetleri ve Elektronik Para Kuruluşları Hakkında Kanun',
    number: '6493',
    category: 'Diğer',
    riskLevel: 'yuksek',
    complianceStatus: 'aksiyon-gerekli',
    hangelSubject: 'Bağış/ödeme tahsilatı. Ödeme hizmeti sunmak veya para tutmak lisans gerektirir; Hangel lisanslı kuruluş (ör. N-Kolay) üzerinden çalışmalı.',
    affectedModules: ['Ödeme', 'Bağış'],
    articleText: 'Ödeme hizmeti ve elektronik para faaliyetlerinin lisansa tabi olması; yetkisiz faaliyet yasağı; TCMB/BDDK denetimi.',
    interpretation: 'Hangel kendi adına para tutmamalı/havuzlamamalı. Tüm tahsilat lisanslı ödeme kuruluşu üzerinden, fonlar doğrudan alıcı STK\'ya akacak şekilde kurgulanmalı. Aksi halde yetkisiz ödeme hizmeti riski.',
    links: `${RG_ARSIV}\n${DANISTAY_KARAR}`,
  },
  {
    id: 'yapay-zeka-uyum',
    name: 'Yapay Zeka Uyumu (AB AI Act referans + KVKK + Ulusal YZ Stratejisi)',
    category: 'Diğer',
    riskLevel: 'orta',
    complianceStatus: 'inceleniyor',
    hangelSubject: 'Türkiye\'de yürürlükte özel bir yapay zeka kanunu henüz yok. AI özellikleri (Etki Hikayem, Market Asistanı) KVKK + genel hukuk + AB AI Act ilkeleriyle değerlendirilir.',
    affectedModules: ['AI Araçları'],
    articleText: 'AB Yapay Zeka Tüzüğü (AI Act) risk-temelli yaklaşım; şeffaflık, insan denetimi, veri yönetişimi ilkeleri. KVKK md.4 ölçülülük + otomatik karar (md. ilgili) ile birlikte.',
    interpretation: 'AI çıktılarında şeffaflık (kullanıcıya "yapay zeka üretimi" bildirimi), insan denetimi ve veri minimizasyonu uygulanmalı. Hassas karar tamamen otomatikleştirilmemeli. Mevzuat geliştikçe yeniden değerlendirilecek.',
    links: `${KVKK_KARAR}\nhttps://cbddo.gov.tr/yapay-zeka`,
  },
];
