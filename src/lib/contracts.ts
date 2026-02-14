
export interface Contract {
  slug: string;
  title: string;
  content: string;
}

export const contractsData: Contract[] = [
  // --- A. Ana Sözleşmeler ---
  {
    slug: 'kullanici-sozlesmesi',
    title: 'Kullanıcı Sözleşmesi',
    content: `
      <h3>Kullanıcı Sözleşmesi</h3>
      <h4>1. Amaç</h4>
      <p>işbu sözleşmenin amacı, hangel platformunun sunduğu dijital hizmetlerden yararlanan bireysel kullanıcıların hak ve yükümlülüklerini, platformun kullanım şartlarını ve taraflar arasındaki hukuki ilişkiyi düzenlemektir.</p>
      <h4>2. Kapsam</h4>
      <p>bu sözleşme, hangel platformuna üye olan veya platformu ziyaretçi olarak kullanan tüm gerçek kişileri kapsar.</p>
      <h4>3. Dayanak ve Uyum Çerçevesi</h4>
      <p>işbu metin, 6098 sayılı Türk Borçlar Kanunu, 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve ilgili elektronik ticaret mevzuatına uygun olarak hazırlanmıştır.</p>
      <h4>4. Haklar ve Yükümlülükler</h4>
      <p>kullanıcı, platformu dürüstlük kuralına uygun kullanmayı, hesap güvenliğini sağlamayı ve yasalara aykırı içerik üretmemeyi taahhüt eder. hangel, hizmet kalitesini koruma amacıyla kural ihlali yapan hesapları askıya alma hakkına sahiptir.</p>
      <h4>5. Uygulama ve Yürürlük</h4>
      <p>sözleşme, kullanıcının platforma erişimi veya üye olmasıyla birlikte yürürlüğe girer ve üyelik sonlanana kadar devam eder.</p>
    `
  },
  {
    slug: 'kurulus-sozlesmesi',
    title: 'Kuruluş Sözleşmesi',
    content: `
      <h3>Kuruluş Sözleşmesi</h3>
      <h4>1. Amaç</h4>
      <p>hangel ekosistemine dahil olan STK, marka ve kulüplerin kurumsal temsil yetkilerini, veri paylaşım esaslarını ve işbirliği standartlarını belirlemektir.</p>
      <h4>2. Kapsam</h4>
      <p>platformda profil oluşturan tüm tüzel kişilikleri ve toplulukları kapsar.</p>
      <h4>3. Dayanak ve Uyum Çerçevesi</h4>
      <p>Türk Ticaret Kanunu ve sivil toplum mevzuatı esas alınmıştır.</p>
      <h4>4. Haklar ve Yükümlülükler</h4>
      <p>kuruluşlar sağladıkları bilgilerin doğruluğundan sorumludur. hangel, kurumsal kimlik standartlarını denetleme yetkisine sahiptir.</p>
      <h4>5. Uygulama ve Yürürlük</h4>
      <p>kurumsal kayıt formunun onaylanmasıyla yürürlüğe girer.</p>
    `
  },
  {
    slug: 'gonulluluk-sozlesmesi',
    title: 'Gönüllülük Sözleşmesi',
    content: `
      <h3>Gönüllülük Sözleşmesi</h3>
      <h4>1. Amaç</h4>
      <p>gönüllülerin toplumsal fayda odaklı faaliyetlerdeki görev tanımlarını ve etik sınırlarını belirlemektir.</p>
      <h4>2. Kapsam</h4>
      <p>hangel imece üzerinden ilanlara başvuran ve kabul edilen tüm gönüllüleri kapsar.</p>
      <h4>3. Dayanak ve Uyum Çerçevesi</h4>
      <p>uluslararası gönüllülük standartları ve sosyal etki prensipleri temel alınmıştır.</p>
      <h4>4. Haklar ve Yükümlülükler</h4>
      <p>gönüllü, maddi kazanç gütmeksizin hizmet vermeyi; kuruluş ise gönüllüye güvenli bir çalışma ortamı sağlamayı kabul eder.</p>
      <h4>5. Uygulama ve Yürürlük</h4>
      <p>gönüllülük faaliyetinin başladığı an itibarıyla yürürlüktedir.</p>
    `
  },
  {
    slug: 'gonullu-haklari-beyannamesi',
    title: 'Gönüllü Hakları ve Sorumlulukları Beyannamesi',
    content: `
      <h3>Gönüllü Hakları ve Sorumlulukları Beyannamesi</h3>
      <h4>1. Amaç</h4>
      <p>gönüllülerin insan onuruna yakışır bir deneyim yaşamasını sağlamak için evrensel haklarını deklare etmektir.</p>
      <h4>2. Kapsam</h4>
      <p>hangel ekosistemindeki tüm aktif gönüllüler bu beyanname koruması altındadır.</p>
      <h4>3. Dayanak ve Uyum Çerçevesi</h4>
      <p>BM Gönüllülük Bildirgesi ve Avrupa Gönüllü Hizmeti ilkeleriyle uyumludur.</p>
      <h4>4. Haklar ve Yükümlülükler</h4>
      <p>her gönüllü; bilgilendirilme, eğitim alma, saygı görme ve güvenli ortamda bulunma hakkına sahiptir.</p>
      <h4>5. Uygulama ve Yürürlük</h4>
      <p>bu beyanname hangel platformunun temel değerlerinden biri olarak sürekli yürürlüktedir.</p>
    `
  },

  // --- B. Gizlilik, Veri Koruma ve Dijital Güvenlik Politikaları ---
  {
    slug: 'gizlilik-politikasi',
    title: 'Gizlilik Politikası',
    content: `
      <h3>Gizlilik Politikası</h3>
      <h4>1. Amaç</h4>
      <p>hangel kullanıcılarının dijital mahremiyetini korumak ve veri işleme süreçlerini şeffaflaştırmaktır.</p>
      <h4>2. Kapsam</h4>
      <p>platformdaki tüm veri toplama, saklama ve işleme faaliyetlerini kapsar.</p>
      <h4>3. Dayanak ve Uyum Çerçevesi</h4>
      <p>KVKK, GDPR ve CCPA standartlarına uyum taahhüt edilir.</p>
      <h4>4. Haklar ve Yükümlülükler</h4>
      <p>hangel, verileri sadece belirtilen amaçlarla işler. kullanıcı verilerine erişim hakkına sahiptir.</p>
      <h4>5. Uygulama ve Yürürlük</h4>
      <p>yayınlandığı tarihten itibaren tüm kullanıcılar için geçerlidir.</p>
    `
  },
  {
    slug: 'kvkk-aydinlatma-metni',
    title: 'KVKK Aydınlatma Metni',
    content: `
      <h3>KVKK Aydınlatma Metni</h3>
      <h4>1. Amaç</h4>
      <p>6698 sayılı kanun kapsamında veri öznelerini bilgilendirmektir.</p>
      <h4>2. Kapsam</h4>
      <p>türkiye merkezli veri işleme süreçlerini kapsar.</p>
      <h4>3. Dayanak ve Uyum Çerçevesi</h4>
      <p>6698 sayılı Kişisel Verilerin Korunması Kanunu.</p>
      <h4>4. Haklar ve Yükümlülükler</h4>
      <p>veri özneleri, verilerinin işlenip işlenmediğini öğrenme ve silinmesini talep etme hakkına sahiptir.</p>
      <h4>5. Uygulama ve Yürürlük</h4>
      <p>yasal zorunluluk gereği her zaman yürürlüktedir.</p>
    `
  },
  {
    slug: 'acik-riza-metni',
    title: 'Açık Rıza Metni',
    content: `
      <h3>Açık Rıza Metni</h3>
      <h4>1. Amaç</h4>
      <p>belirli veri işleme faaliyetleri için kullanıcının özgür iradesiyle onayını almaktır.</p>
      <h4>2. Kapsam</h4>
      <p>pazarlama, profil analizi ve üçüncü taraf entegrasyonlarını kapsar.</p>
      <h4>3. Dayanak ve Uyum Çerçevesi</h4>
      <p>KVKK madde 5/1 ve GDPR madde 6/1(a).</p>
      <h4>4. Haklar ve Yükümlülükler</h4>
      <p>kullanıcı verdiği rızayı dilediği zaman geri çekebilir.</p>
      <h4>5. Uygulama ve Yürürlük</h4>
      <p>onay kutucuğunun işaretlenmesiyle yürürlüğe girer.</p>
    `
  },
  {
    slug: 'veri-saklama-ve-imha-politikasi',
    title: 'Veri Saklama ve İmha Politikası',
    content: `
      <h3>Veri Saklama ve İmha Politikası</h3>
      <h4>1. Amaç</h4>
      <p>verilerin ne kadar süreyle saklanacağını ve nasıl silineceğini belirlemektir.</p>
      <h4>2. Kapsam</h4>
      <p>hangel sunucularındaki tüm dijital ve fiziksel verileri kapsar.</p>
      <h4>3. Dayanak ve Uyum Çerçevesi</h4>
      <p>kişisel verilerin silinmesi, yok edilmesi veya anonim hale getirilmesi hakkında yönetmelik.</p>
      <h4>4. Haklar ve Yükümlülükler</h4>
      <p>hangel, saklama süresi dolan verileri otomatik imha etmeyi taahhüt eder.</p>
      <h4>5. Uygulama ve Yürürlük</h4>
      <p>kurumsal bir prosedür olarak yürürlüktedir.</p>
    `
  },
  {
    slug: 'gdpr-uyum-politikasi',
    title: 'AB Genel Veri Koruma Tüzüğü (GDPR) Uyum Politikası',
    content: `
      <h3>GDPR Uyum Politikası</h3>
      <h4>1. Amaç</h4>
      <p>avrupa birliği vatandaşı kullanıcıların veri güvenliğini küresel standartlarda sağlamaktır.</p>
      <h4>2. Kapsam</h4>
      <p>AB sınırları içerisinden erişen veya AB vatandaşı olan tüm kullanıcıları kapsar.</p>
      <h4>3. Dayanak ve Uyum Çerçevesi</h4>
      <p>Regulation (EU) 2016/679 (GDPR).</p>
      <h4>4. Haklar ve Yükümlülükler</h4>
      <p>veri taşınabilirliği, unutulma hakkı ve otomatik işleme itiraz hakkı garanti altına alınır.</p>
      <h4>5. Uygulama ve Yürürlük</h4>
      <p>küresel erişim politikamızın bir parçasıdır.</p>
    `
  },
  {
    slug: 'veri-isleme-amaclar-beyani',
    title: 'Veri İşleme Amaçları ve Hukuki Dayanaklar Beyanı',
    content: `
      <h3>Veri İşleme Amaçları ve Hukuki Dayanaklar Beyanı</h3>
      <h4>1. Amaç</h4>
      <p>hangi verinin neden işlendiğini şeffaf bir listeyle beyan etmektir.</p>
      <h4>2. Kapsam</h4>
      <p>isim, iletişim, konum ve finansal verilerin tamamını kapsar.</p>
      <h4>3. Dayanak ve Uyum Çerçevesi</h4>
      <p>hukuki yükümlülük, sözleşmenin ifası ve meşru menfaat esasları.</p>
      <h4>4. Haklar ve Yükümlülükler</h4>
      <p>hangel, veri minimizasyonu ilkesine göre çalışır.</p>
      <h4>5. Uygulama ve Yürürlük</h4>
      <p>bilgilendirme standartlarımızın ayrılmaz parçasıdır.</p>
    `
  },
  {
    slug: 'kullanici-haklari-politikasi',
    title: 'Kullanıcı Hakları Politikası (erişim, silme, taşınabilirlik)',
    content: `
      <h3>Kullanıcı Hakları Politikası</h3>
      <h4>1. Amaç</h4>
      <p>kullanıcıların kendi verileri üzerindeki kontrolünü yasal haklar çerçevesinde detaylandırmaktır.</p>
      <h4>2. Kapsam</h4>
      <p>veri erişimi, düzeltme, silme ve taşıma taleplerini kapsar.</p>
      <h4>3. Dayanak ve Uyum Çerçevesi</h4>
      <p>evrensel veri koruma ilkeleri.</p>
      <h4>4. Haklar ve Yükümlülükler</h4>
      <p>talepler 30 iş günü içinde ücretsiz olarak sonuçlandırılır.</p>
      <h4>5. Uygulama ve Yürürlük</h4>
      <p>kullanıcı talepleriyle aktive olan bir prosedürdür.</p>
    `
  },
  {
    slug: 'dpo-tanimi',
    title: 'Veri Koruma Görevlisi (DPO) Tanımı',
    content: `
      <h3>Veri Koruma Görevlisi (DPO) Tanımı</h3>
      <h4>1. Amaç</h4>
      <p>veri güvenliği süreçlerini denetleyen bağımsız bir otorite tanımlamaktır.</p>
      <h4>2. Kapsam</h4>
      <p>tüm kurumsal veri koruma uyum süreçlerini kapsar.</p>
      <h4>3. Dayanak ve Uyum Çerçevesi</h4>
      <p>GDPR Article 37-39.</p>
      <h4>4. Haklar ve Yükümlülükler</h4>
      <p>DPO, doğrudan üst yönetime raporlama yapar ve veri öznelerinin iletişim noktasıdır.</p>
      <h4>5. Uygulama ve Yürürlük</h4>
      <p>kurumsal yönetişim yapımızda mevcuttur.</p>
    `
  },
  {
    slug: 'veri-ihlali-bildirim-proseduru',
    title: 'Veri İhlali Bildirim Prosedürü',
    content: `
      <h3>Veri İhlali Bildirim Prosedürü</h3>
      <h4>1. Amaç</h4>
      <p>olası bir veri sızıntısında izlenecek acil eylem planını belirlemektir.</p>
      <h4>2. Kapsam</h4>
      <p>veri güvenliğini tehdit eden her türlü siber olayı kapsar.</p>
      <h4>3. Dayanak ve Uyum Çerçevesi</h4>
      <p>yasal 72 saatlik bildirim yükümlülüğü.</p>
      <h4>4. Haklar ve Yükümlülükler</h4>
      <p>ihlalin tespiti halinde hangel, ilgili otoriteyi ve etkilenen kullanıcıları derhal bilgilendirir.</p>
      <h4>5. Uygulama ve Yürürlük</h4>
      <p>güvenlik protokollerimizin bir parçasıdır.</p>
    `
  },
  {
    slug: 'veri-transferi-ve-hosting-beyani',
    title: 'Veri Transferi ve AB Merkezli Hosting Beyanı',
    content: `
      <h3>Veri Transferi ve AB Merkezli Hosting Beyanı</h3>
      <h4>1. Amaç</h4>
      <p>verilerin nerede barındırıldığını ve nasıl transfer edildiğini açıklamaktır.</p>
      <h4>2. Kapsam</h4>
      <p>hangel altyapısındaki tüm veri trafiğini kapsar.</p>
      <h4>3. Dayanak ve Uyum Çerçevesi</h4>
      <p>güvenli sunucu standartları ve veri yerelleştirme prensipleri.</p>
      <h4>4. Haklar ve Yükümlülükler</h4>
      <p>veriler öncelikli olarak türkiye ve AB merkezli güvenli sunucularda (Google Cloud vb.) saklanır.</p>
      <h4>5. Uygulama ve Yürürlük</h4>
      <p>teknik altyapı beyanıdır.</p>
    `
  },
  {
    slug: 'cerez-politikasi',
    title: 'Çerez Politikası',
    content: `
      <h3>Çerez Politikası</h3>
      <h4>1. Amaç</h4>
      <p>platform deneyimini iyileştirmek için kullanılan çerezlerin detaylarını vermektir.</p>
      <h4>2. Kapsam</h4>
      <p>analitik, işlevsel ve reklam çerezlerini kapsar.</p>
      <h4>3. Dayanak ve Uyum Çerçevesi</h4>
      <p>e-Privacy Directive ve KVKK.</p>
      <h4>4. Haklar ve Yükümlülükler</h4>
      <p>kullanıcı çerez tercihlerini istediği zaman güncelleyebilir.</p>
      <h4>5. Uygulama ve Yürürlük</h4>
      <p>çerez bannerı onayıyla yürürlüğe girer.</p>
    `
  },
  {
    slug: 'bilgi-guvenligi-politikasi',
    title: 'Bilgi Güvenliği Politikası',
    content: `
      <h3>Bilgi Güvenliği Politikası</h3>
      <h4>1. Amaç</h4>
      <p>kurumsal verilerin gizliliğini, bütünlüğünü ve erişilebilirliğini sağlamaktır.</p>
      <h4>2. Kapsam</h4>
      <p>tüm teknik altyapı ve personel süreçlerini kapsar.</p>
      <h4>3. Dayanak ve Uyum Çerçevesi</h4>
      <p>ISO/IEC 27001 standartları referans alınmıştır.</p>
      <h4>4. Haklar ve Yükümlülükler</h4>
      <p>hangel, düzenli sızma testleri ve güvenlik denetimleri yapmayı taahhüt eder.</p>
      <h4>5. Uygulama ve Yürürlük</h4>
      <p>kurumsal bir standart olarak yürürlüktedir.</p>
    `
  },
  {
    slug: 'cocuklarin-verilerinin-korunmasi',
    title: 'Çocukların Kişisel Verilerinin Korunması (COPPA Uyumu)',
    content: `
      <h3>Çocukların Kişisel Verilerinin Korunması</h3>
      <h4>1. Amaç</h4>
      <p>küçük yaştaki kullanıcıların dijital güvenliğini en üst seviyede sağlamaktır.</p>
      <h4>2. Kapsam</h4>
      <p>13 (bazı bölgelerde 16) yaş altı kullanıcı verilerini kapsar.</p>
      <h4>3. Dayanak ve Uyum Çerçevesi</h4>
      <p>Children's Online Privacy Protection Act (COPPA) ve KVKK.</p>
      <h4>4. Haklar ve Yükümlülükler</h4>
      <p>ebeveyn onayı olmaksızın çocuk verisi toplanmaz ve işlenmez.</p>
      <h4>5. Uygulama ve Yürürlük</h4>
      <p>kayıt aşamasındaki yaş doğrulamasıyla aktive olur.</p>
    `
  },
  {
    slug: 'abd-eyalet-bazli-veri-politikasi',
    title: 'ABD Eyalet Bazlı Veri Koruma Politikası (CCPA/CPRA)',
    content: `
      <h3>ABD Eyalet Bazlı Veri Koruma Politikası</h3>
      <h4>1. Amaç</h4>
      <p>ABD menşeli kullanıcılar için bölgeye özel hakları tanımlamaktır.</p>
      <h4>2. Kapsam</h4>
      <p>kaliforniya ve diğer ilgili eyaletlerdeki kullanıcıları kapsar.</p>
      <h4>3. Dayanak ve Uyum Çerçevesi</h4>
      <p>CCPA / CPRA.</p>
      <h4>4. Haklar ve Yükümlülükler</h4>
      <p>"Do Not Sell My Personal Information" (bilgilerimi satma) hakkı tanınır.</p>
      <h4>5. Uygulama ve Yürürlük</h4>
      <p>bölgesel uyum beyanıdır.</p>
    `
  },
  {
    slug: 'ulke-bazli-veri-koruma-uyum-beyani',
    title: 'Ülke Bazlı Veri Koruma Uyum Beyanı',
    content: `
      <h3>Ülke Bazlı Veri Koruma Uyum Beyanı</h3>
      <h4>1. Amaç</h4>
      <p>global operasyonlarda yerel yasalara olan saygımızı teyit etmektir.</p>
      <h4>2. Kapsam</h4>
      <p>hangel'in aktif olduğu tüm ülkeleri kapsar.</p>
      <h4>3. Dayanak ve Uyum Çerçevesi</h4>
      <p>ilgili ülkelerin yerel veri koruma mevzuatları.</p>
      <h4>4. Haklar ve Yükümlülükler</h4>
      <p>hangel, her ülkede o ülkenin en sıkı veri koruma kurallarını uygulamaya çalışır.</p>
      <h4>5. Uygulama ve Yürürlük</h4>
      <p>uluslararası genişleme politikamızın parçasıdır.</p>
    `
  },

  // --- C. Sosyal Etki, Bağış ve Finansal Şeffaflık ---
  {
    slug: 'sosyal-etki-politikasi',
    title: 'Sosyal Etki Politikası',
    content: `
      <h3>Sosyal Etki Politikası</h3>
      <h4>1. Amaç</h4>
      <p>hangel'in oluşturmayı hedeflediği toplumsal ve çevresel değerin çerçevesini çizmektir.</p>
      <h4>2. Kapsam</h4>
      <p>platformun tüm operasyonel ve projeksiyonel süreçlerini kapsar.</p>
      <h4>3. Dayanak ve Uyum Çerçevesi</h4>
      <p>BM Sürdürülebilir Kalkınma Amaçları (SKA).</p>
      <h4>4. Haklar ve Yükümlülükler</h4>
      <p>hangel, her faaliyetinde pozitif etkiyi maksimize etmeyi taahhüt eder.</p>
      <h4>5. Uygulama ve Yürürlük</h4>
      <p>kurumsal anayasamızın bir parçasıdır.</p>
    `
  },
  {
    slug: 'sosyal-etki-metodolojisi',
    title: 'Sosyal Etki Ölçüm ve Raporlama Metodolojisi (SROI & Theory of Change)',
    content: `
      <h3>Sosyal Etki Ölçüm ve Raporlama Metodolojisi</h3>
      <h4>1. Amaç</h4>
      <p>oluşturulan etkinin bilimsel ve matematiksel olarak nasıl ölçüldüğünü açıklamaktır.</p>
      <h4>2. Kapsam</h4>
      <p>tüm bağış ve gönüllülük verilerinin analizini kapsar.</p>
      <h4>3. Dayanak ve Uyum Çerçevesi</h4>
      <p>Social Value International standartları.</p>
      <h4>4. Haklar ve Yükümlülükler</h4>
      <p>etki raporları yıllık olarak kamuoyuna şeffafça sunulur.</p>
      <h4>5. Uygulama ve Yürürlük</h4>
      <p>analiz süreçlerimizde esastır.</p>
    `
  },
  {
    slug: 'acik-sosyal-girisim-beyani',
    title: 'Açık Sosyal Girişim Beyanı',
    content: `
      <h3>Açık Sosyal Girişim Beyanı</h3>
      <h4>1. Amaç</h4>
      <p>hangel'in sosyal girişim kimliğini evrensel kriterlerle beyan etmektir.</p>
      <h4>2. Kapsam</h4>
      <p>kâr dağıtımı, yönetişim ve etki odaklılık prensiplerini kapsar.</p>
      <h4>3. Dayanak ve Uyum Çerçevesi</h4>
      <p>Açık Açık Sosyal Girişim kriterleri.</p>
      <h4>4. Haklar ve Yükümlülükler</h4>
      <p>hangel, kârının %51'inden fazlasını misyona yatırmayı taahhüt eder.</p>
      <h4>5. Uygulama ve Yürürlük</h4>
      <p>kuruluş felsefemiz olarak yürürlüktedir.</p>
    `
  },
  {
    slug: 'bagis-ve-yardim-politikasi',
    title: 'Bağış ve Yardım Politikası',
    content: `
      <h3>Bağış ve Yardım Politikası</h3>
      <h4>1. Amaç</h4>
      <p>bağışların toplanması, korunması ve aktarılması süreçlerini düzenlemektir.</p>
      <h4>2. Kapsam</h4>
      <p>platform üzerinden geçen tüm finansal yardımları kapsar.</p>
      <h4>3. Dayanak ve Uyum Çerçevesi</h4>
      <p>2860 sayılı Yardım Toplama Kanunu ve ilgili mevzuat.</p>
      <h4>4. Haklar ve Yükümlülükler</h4>
      <p>bağışçılar paralarının nereye gittiğini bilme hakkına sahiptir.</p>
      <h4>5. Uygulama ve Yürürlük</h4>
      <p>işlem bazlı olarak yürürlüktedir.</p>
    `
  },
  {
    slug: 'bagisci-haklari-beyannamesi',
    title: 'Bağışçı Hakları Beyannamesi',
    content: `
      <h3>Bağışçı Hakları Beyannamesi</h3>
      <h4>1. Amaç</h4>
      <p>bağışçıların kuruluşa olan güvenini garanti altına almaktır.</p>
      <h4>2. Kapsam</h4>
      <p>hangel aracılığıyla bağış yapan tüm birey ve kurumları kapsar.</p>
      <h4>3. Dayanak ve Uyum Çerçevesi</h4>
      <p>Association of Fundraising Professionals (AFP) standartları.</p>
      <h4>4. Haklar ve Yükümlülükler</h4>
      <p>bilgilenme, saygı görme ve verilerinin gizliliği temel haklardır.</p>
      <h4>5. Uygulama ve Yürürlük</h4>
      <p>her bağış işlemi için geçerlidir.</p>
    `
  },
  {
    slug: 'bagis-gelirlerinin-denetlenmesi-politikasi',
    title: 'Bağış Gelirlerinin Denetlenmesi ve Şeffaflık Raporu Politikası',
    content: `
      <h3>Bağış Gelirlerinin Denetlenmesi ve Şeffaflık Raporu Politikası</h3>
      <h4>1. Amaç</h4>
      <p>finansal akışın dış denetime açık ve şeffaf olmasını sağlamaktır.</p>
      <h4>2. Kapsam</h4>
      <p>yıllık finansal tabloları ve bağış dökümlerini kapsar.</p>
      <h4>3. Dayanak ve Uyum Çerçevesi</h4>
      <p>bağımsız denetim standartları.</p>
      <h4>4. Haklar ve Yükümlülükler</h4>
      <p>hangel, her yıl şeffaflık raporu yayınlamayı taahhüt eder.</p>
      <h4>5. Uygulama ve Yürürlük</h4>
      <p>yıllık periyotlarla uygulanır.</p>
    `
  },
  {
    slug: 'finansal-seffaflik-ve-hesap-verebilirlik-politikasi',
    title: 'Finansal Şeffaflık ve Hesap Verebilirlik Politikası',
    content: `
      <h3>Finansal Şeffaflık ve Hesap Verebilirlik Politikası</h3>
      <h4>1. Amaç</h4>
      <p>kurumsal harcamaların ve gelirlerin dürüstlükle paylaşılmasını sağlamaktır.</p>
      <h4>2. Kapsam</h4>
      <p>hangel AŞ'nin tüm mali yapısını kapsar.</p>
      <h4>3. Dayanak ve Uyum Çerçevesi</h4>
      <p>kurumsal yönetişim ilkeleri.</p>
      <h4>4. Haklar ve Yükümlülükler</h4>
      <p>gelirlerin kullanım alanları paydaşlara bildirilir.</p>
      <h4>5. Uygulama ve Yürürlük</h4>
      <p>sürekli geçerlidir.</p>
    `
  },
  {
    slug: 'kar-dagitim-politikasi',
    title: 'Kâr Dağıtım Politikası',
    content: `
      <h3>Kâr Dağıtım Politikası</h3>
      <h4>1. Amaç</h4>
      <p>elde edilen gelirin kâr dağıtımı yerine misyona aktarılacağını taahhüt etmektir.</p>
      <h4>2. Kapsam</h4>
      <p>finansal yıl sonu gelir fazlasını kapsar.</p>
      <h4>3. Dayanak ve Uyum Çerçevesi</h4>
      <p>kâr kilidi (asset lock) prensibi.</p>
      <h4>4. Haklar ve Yükümlülükler</h4>
      <p>hissedarlar kâr payı almaz, tüm kaynak etkiyi büyütmek için kullanılır.</p>
      <h4>5. Uygulama ve Yürürlük</h4>
      <p>şirket ana sözleşmesiyle bağlıdır.</p>
    `
  },
  {
    slug: 'ucret-politikasi',
    title: 'Ücret Politikası',
    content: `
      <h3>Ücret Politikası</h3>
      <h4>1. Amaç</h4>
      <p>çalışan ve işlem bazlı ücretlerin adaletli bir şekilde belirlenmesidir.</p>
      <h4>2. Kapsam</h4>
      <p>hizmet bedelleri ve maaş standartlarını kapsar.</p>
      <h4>3. Dayanak ve Uyum Çerçevesi</h4>
      <p>adil ücret ve sektör kıyaslamaları.</p>
      <h4>4. Haklar ve Yükümlülükler</h4>
      <p>hangel, şeffaf bir ücret baremi uygular.</p>
      <h4>5. Uygulama ve Yürürlük</h4>
      <p>kurumsal bir politika olarak yürürlüktedir.</p>
    `
  },
  {
    slug: 'abd-irs-bagis-beyani',
    title: 'ABD IRS Uyumlu Bağış Beyanı',
    content: `
      <h3>ABD IRS Uyumlu Bağış Beyanı</h3>
      <h4>1. Amaç</h4>
      <p>ABD'li bağışçıların vergi avantajlarından yararlanabilmesi için gerekli beyanı sunmaktır.</p>
      <h4>2. Kapsam</h4>
      <p>ABD vergi mükellefi bağışçıları kapsar.</p>
      <h4>3. Dayanak ve Uyum Çerçevesi</h4>
      <p>Internal Revenue Service (IRS) Section 501(c)(3) standartları.</p>
      <h4>4. Haklar ve Yükümlülükler</h4>
      <p>hangel, uygun projeleri bu standartlarda raporlamaya çalışır.</p>
      <h4>5. Uygulama ve Yürürlük</h4>
      <p>global finansal uyum beyanıdır.</p>
    `
  },

  // --- D. Kurumsal Yönetişim, Etik ve İç Denetim ---
  {
    slug: 'etik-ilkeler',
    title: 'Etik İlkeler',
    content: `
      <h3>Etik İlkeler</h3>
      <h4>1. Amaç</h4>
      <p>hangel topluluğunun davranış standartlarını belirlemektir.</p>
      <h4>2. Kapsam</h4>
      <p>tüm çalışanlar, kullanıcılar ve ortaklar için geçerlidir.</p>
      <h4>3. Dayanak ve Uyum Çerçevesi</h4>
      <p>evrensel insan hakları ve etik değerler.</p>
      <h4>4. Haklar ve Yükümlülükler</h4>
      <p>ayrımcılık, şiddet ve yolsuzluğa karşı sıfır tolerans politikası esastır.</p>
      <h4>5. Uygulama ve Yürürlük</h4>
      <p>hangel kültürünün temelidir.</p>
    `
  },
  {
    slug: 'cikar-catismasi-politikasi',
    title: 'Çıkar Çatışması Politikası',
    content: `
      <h3>Çıkar Çatışması Politikası</h3>
      <h4>1. Amaç</h4>
      <p>karar alma süreçlerinin kişisel çıkarlardan bağımsız olmasını sağlamaktır.</p>
      <h4>2. Kapsam</h4>
      <p>yönetim kurulu ve karar verici tüm personeli kapsar.</p>
      <h4>3. Dayanak ve Uyum Çerçevesi</h4>
      <p>kurumsal yönetişim ilkeleri.</p>
      <h4>4. Haklar ve Yükümlülükler</h4>
      <p>potansiyel çıkar çatışmaları derhal beyan edilmelidir.</p>
      <h4>5. Uygulama ve Yürürlük</h4>
      <p>iç denetim mekanizması olarak yürürlüktedir.</p>
    `
  },
  {
    slug: 'whistleblower-politikasi',
    title: 'Whistleblower (İhbarcı) Politikası',
    content: `
      <h3>Whistleblower (İhbarcı) Politikası</h3>
      <h4>1. Amaç</h4>
      <p>etik dışı durumların güvenli bir şekilde bildirilmesini sağlamaktır.</p>
      <h4>2. Kapsam</h4>
      <p>ihbar hattını kullanan herkesi kapsar.</p>
      <h4>3. Dayanak ve Uyum Çerçevesi</h4>
      <p>şeffaflık ve dürüstlük prensipleri.</p>
      <h4>4. Haklar ve Yükümlülükler</h4>
      <p>ihbarcının kimliği gizli tutulur ve misillemeye karşı korunur.</p>
      <h4>5. Uygulama ve Yürürlük</h4>
      <p>güven hattının açılmasıyla yürürlüktedir.</p>
    `
  },
  {
    slug: 'yonetim-ve-kurumsal-yonetisim-ilkeleri',
    title: 'Yönetim ve Kurumsal Yönetişim İlkeleri',
    content: `
      <h3>Yönetim ve Kurumsal Yönetişim İlkeleri</h3>
      <h4>1. Amaç</h4>
      <p>hangel AŞ'nin yönetim yapısını profesyonel ve şeffaf kılmaktır.</p>
      <h4>2. Kapsam</h4>
      <p>organizasyonel hiyerarşi ve karar süreçlerini kapsar.</p>
      <h4>3. Dayanak ve Uyum Çerçevesi</h4>
      <p>OECD kurumsal yönetişim ilkeleri.</p>
      <h4>4. Haklar ve Yükümlülükler</h4>
      <p>adil yönetim, şeffaf temsil ve hesap verebilirlik esastır.</p>
      <h4>5. Uygulama ve Yürürlük</h4>
      <p>yönetim kurulu kararıyla yürürlüktedir.</p>
    `
  },
  {
    slug: 'kamu-yarari-ve-sosyal-fayda-beyani',
    title: 'Kamu Yararı ve Sosyal Fayda Statüsü Beyanı',
    content: `
      <h3>Kamu Yararı ve Sosyal Fayda Statüsü Beyanı</h3>
      <h4>1. Amaç</h4>
      <p>hangel'in tüm faaliyetlerinin kamu yararına olduğunu beyan etmektir.</p>
      <h4>2. Kapsam</h4>
      <p>şirketin ana sözleşmesindeki amaç maddesini kapsar.</p>
      <h4>3. Dayanak ve Uyum Çerçevesi</h4>
      <p>sosyal girişimcilik hukuki zemini.</p>
      <h4>4. Haklar ve Yükümlülükler</h4>
      <p>tüm projeler toplumsal bir ihtiyaca cevap verir.</p>
      <h4>5. Uygulama ve Yürürlük</h4>
      <p>resmi beyan olarak yürürlüktedir.</p>
    `
  },

  // --- E. Erişilebilirlik, Bilgilendirme ve Diğer Politikalar ---
  {
    slug: 'erisilebilirlik-politikasi',
    title: 'Erişilebilirlik Politikası',
    content: `
      <h3>Erişilebilirlik Politikası</h3>
      <h4>1. Amaç</h4>
      <p>dijital ortamda herkesin eşit haklara sahip olmasını sağlamaktır.</p>
      <h4>2. Kapsam</h4>
      <p>tüm dijital platform ve içeriklerimizi kapsar.</p>
      <h4>3. Dayanak ve Uyum Çerçevesi</h4>
      <p>WCAG 2.2 AA/AAA standartları.</p>
      <h4>4. Haklar ve Yükümlülükler</h4>
      <p>hangel, sürekli iyileştirme ile engelleri kaldırmayı taahhüt eder.</p>
      <h4>5. Uygulama ve Yürürlük</h4>
      <p>teknik standartlarımızın bir parçasıdır.</p>
    `
  },
  {
    slug: 'bilgilendirme-politikasi',
    title: 'Bilgilendirme Politikası',
    content: `
      <h3>Bilgilendirme Politikası</h3>
      <h4>1. Amaç</h4>
      <p>paydaşların doğru bilgiye zamanında erişmesini sağlamaktır.</p>
      <h4>2. Kapsam</h4>
      <p>resmi duyuru kanallarının tamamını kapsar.</p>
      <h4>3. Dayanak ve Uyum Çerçevesi</h4>
      <p>şeffaflık ilkeleri.</p>
      <h4>4. Haklar ve Yükümlülükler</h4>
      <p>hangel, kritik gelişmeleri makul sürede ilan eder.</p>
      <h4>5. Uygulama ve Yürürlük</h4>
      <p>iletişim stratejimizin temelidir.</p>
    `
  },
  {
    slug: 'cok-dilli-sozlesmeler-politikasi',
    title: 'Çok Dilli Sözleşmeler ve Küresel Erişim Politikası',
    content: `
      <h3>Çok Dilli Sözleşmeler ve Küresel Erişim Politikası</h3>
      <h4>1. Amaç</h4>
      <p>farklı dillerdeki kullanıcıların sözleşmeleri anlamasını sağlamaktır.</p>
      <h4>2. Kapsam</h4>
      <p>platformdaki tüm dilleri kapsar.</p>
      <h4>3. Dayanak ve Uyum Çerçevesi</h4>
      <p>evrensel erişim ilkeleri.</p>
      <h4>4. Haklar ve Yükümlülükler</h4>
      <p>tercüme farklarında türkiye istanbul merkezli türkçe metin esastır.</p>
      <h4>5. Uygulama ve Yürürlük</h4>
      <p>global genişleme ile aktive olur.</p>
    `
  },
  {
    slug: 'yerel-bagis-mevzuatlarina-uyum-beyani',
    title: 'Yerel Bağış Mevzuatlarına Uyum Beyanı',
    content: `
      <h3>Yerel Bağış Mevzuatlarına Uyum Beyanı</h3>
      <h4>1. Amaç</h4>
      <p>farklı ülkelerdeki bağış toplama kurallarına uyumu teyit etmektir.</p>
      <h4>2. Kapsam</h4>
      <p>operasyon yapılan tüm yerel pazarları kapsar.</p>
      <h4>3. Dayanak ve Uyum Çerçevesi</h4>
      <p>ilgili ülkelerin bağış ve yardım kanunları.</p>
      <h4>4. Haklar ve Yükümlülükler</h4>
      <p>hangel, yerel otorite izinlerini almayı taahhüt eder.</p>
      <h4>5. Uygulama ve Yürürlük</h4>
      <p>hukuki uyum sürecinin parçasıdır.</p>
    `
  }
];
