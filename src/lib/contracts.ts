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

  // --- B. Gizlilik, Veri Koruma ve Güvenlik ---
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
    title: 'Kullanıcı Hakları Politikası',
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
      <p>veriler öncelikli olarak türkiye ve AB merkezli güvenli sunucularda saklanır.</p>
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
      <p>13 yaş altı kullanıcı verilerini kapsar.</p>
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
      <p>"Do Not Sell My Personal Information" hakkı tanınır.</p>
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
  {
    slug: 'lgpd-veri-koruma-beyani',
    title: 'LGPD (Latin Amerika) Veri Koruma Beyanı',
    content: `
      <h3>LGPD (Latin Amerika) Veri Koruma Beyanı</h3>
      <h4>1. Amaç</h4>
      <p>Latin Amerika, özellikle Brezilya regülasyonlarına tam uyum sağlamaktır.</p>
      <h4>2. Kapsam</h4>
      <p>Latin Amerika bölgesindeki kullanıcı verilerini kapsar.</p>
      <h4>3. Dayanak ve Uyum Çerçevesi</h4>
      <p>Lei Geral de Proteção de Dados (LGPD).</p>
      <h4>4. Haklar ve Yükümlülükler</h4>
      <p>Bölgesel veri sahiplerinin erişim, düzeltme ve silme hakları korunur.</p>
      <h4>5. Uygulama ve Yürürlük</h4>
      <p>Bölgesel erişimle birlikte yürürlüktedir.</p>
    `
  },
  {
    slug: 'yapay-zeka-seffaflik-beyani',
    title: 'Yapay Zekâ ve Algoritmik Şeffaflık Beyanı',
    content: `
      <h3>Yapay Zekâ ve Algoritmik Şeffaflık Beyanı</h3>
      <h4>1. Amaç</h4>
      <p>Platformdaki yapay zeka süreçlerinin etik ve şeffaf yönetimini sağlamaktır.</p>
      <h4>2. Kapsam</h4>
      <p>Öneri algoritmaları ve otomatik içerik üretim araçlarını kapsar.</p>
      <h4>3. Dayanak ve Uyum Çerçevesi</h4>
      <p>AB Yapay Zeka Yasası (AI Act) prensipleri.</p>
      <h4>4. Haklar ve Yükümlülükler</h4>
      <p>Kullanıcılar AI tarafından üretilen içerikler hakkında bilgilendirilir.</p>
      <h4>5. Uygulama ve Yürürlük</h4>
      <p>AI özelliklerinin kullanımıyla eş zamanlı yürürlüktedir.</p>
    `
  },

  // --- C. Sosyal Etki, Bağış ve Finansal Şeffaflık ---
  {
    slug: 'sosyal-etki-politikasi',
    title: 'Sosyal Etki Politikası',
    content: `
      <h3>Sosyal Etki Politikası</h3>
      <h4>1. Amaç</h4>
      <p>hangel'in oluşturmayı hedeflediği toplumsal değerin çerçevesini çizmektir.</p>
      <h4>2. Kapsam</h4>
      <p>tüm operasyonel süreçleri kapsar.</p>
      <h4>3. Dayanak ve Uyum Çerçevesi</h4>
      <p>BM Sürdürülebilir Kalkınma Amaçları (SKA).</p>
      <h4>4. Haklar ve Yükümlülükler</h4>
      <p>hangel, pozitif etkiyi maksimize etmeyi taahhüt eder.</p>
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
      <p>oluşturulan etkinin bilimsel olarak nasıl ölçüldüğünü açıklamaktır.</p>
      <h4>2. Kapsam</h4>
      <p>tüm bağış ve gönüllülük verilerini kapsar.</p>
      <h4>3. Dayanak ve Uyum Çerçevesi</h4>
      <p>Social Value International standartları (SROI).</p>
      <h4>4. Haklar ve Yükümlülükler</h4>
      <p>etki raporları yıllık olarak şeffafça sunulur.</p>
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
      <p>kâr dağıtımı ve yönetişimi kapsar.</p>
      <h4>3. Dayanak ve Uyum Çerçevesi</h4>
      <p>Açık Açık Sosyal Girişim kriterleri.</p>
      <h4>4. Haklar ve Yükümlülükler</h4>
      <p>hangel, kârının %51'inden fazlasını misyona yatırmayı taahhüt eder.</p>
      <h4>5. Uygulama ve Yürürlük</h4>
      <p>kuruluş felsefemizdir.</p>
    `
  },
  {
    slug: 'bagis-ve-yardim-politikasi',
    title: 'Bağış ve Yardım Politikası',
    content: `
      <h3>Bağış ve Yardım Politikası</h3>
      <h4>1. Amaç</h4>
      <p>yardımların toplanması ve aktarılması süreçlerini düzenlemektir.</p>
      <h4>2. Kapsam</h4>
      <p>platformdaki tüm finansal yardımları kapsar.</p>
      <h4>3. Dayanak ve Uyum Çerçevesi</h4>
      <p>2860 sayılı Yardım Toplama Kanunu.</p>
      <h4>4. Haklar ve Yükümlülükler</h4>
      <p>bağışçılar şeffaf bilgilendirme talep etme hakkına sahiptir.</p>
      <h4>5. Uygulama ve Yürürlük</h4>
      <p>işlem bazlı yürürlüktedir.</p>
    `
  },
  {
    slug: 'bagisci-haklari-beyannamesi',
    title: 'Bağışçı Hakları Beyannamesi',
    content: `
      <h3>Bağışçı Hakları Beyannamesi</h3>
      <h4>1. Amaç</h4>
      <p>bağışçı güvenini garanti altına almaktır.</p>
      <h4>2. Kapsam</h4>
      <p>tüm bağışçıları kapsar.</p>
      <h4>3. Dayanak ve Uyum Çerçevesi</h4>
      <p>AFP standartları.</p>
      <h4>4. Haklar ve Yükümlülükler</h4>
      <p>bilgilenme ve saygı görme temel haklardır.</p>
      <h4>5. Uygulama ve Yürürlük</h4>
      <p>her bağışta geçerlidir.</p>
    `
  },
  {
    slug: 'bagis-gelirlerinin-denetlenmesi-politikasi',
    title: 'Bağış Gelirlerinin Denetlenmesi ve Şeffaflık Raporu Politikası',
    content: `
      <h3>Bağış Gelirlerinin Denetlenmesi Politikası</h3>
      <h4>1. Amaç</h4>
      <p>finansal akışın dış denetime açık olmasını sağlamaktır.</p>
      <h4>2. Kapsam</h4>
      <p>yıllık finansal tabloları kapsar.</p>
      <h4>3. Dayanak ve Uyum Çerçevesi</h4>
      <p>bağımsız denetim standartları.</p>
      <h4>4. Haklar ve Yükümlülükler</h4>
      <p>yıllık şeffaflık raporu yayınlanır.</p>
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
      <p>kurumsal harcamaların dürüstlükle paylaşılmasını sağlamaktır.</p>
      <h4>2. Kapsam</h4>
      <p>hangel AŞ'nin tüm mali yapısını kapsar.</p>
      <h4>3. Dayanak ve Uyum Çerçevesi</h4>
      <p>kurumsal yönetişim ilkeleri.</p>
      <h4>4. Haklar ve Yükümlülükler</h4>
      <p>gelir kullanımı paydaşlara bildirilir.</p>
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
      <p>gelirin kâr dağıtımı yerine misyona aktarılacağını taahhüt etmektir.</p>
      <h4>2. Kapsam</h4>
      <p>yıl sonu gelir fazlasını kapsar.</p>
      <h4>3. Dayanak ve Uyum Çerçevesi</h4>
      <p>kâr kilidi prensibi.</p>
      <h4>4. Haklar ve Yükümlülükler</h4>
      <p>hissedarlar kâr payı almaz.</p>
      <h4>5. Uygulama ve Yürürlük</h4>
      <p>şirket ana sözleşmesine bağlıdır.</p>
    `
  },
  {
    slug: 'ucret-politikasi',
    title: 'Ücret Politikası',
    content: `
      <h3>Ücret Politikası</h3>
      <h4>1. Amaç</h4>
      <p>ücretlerin adaletli belirlenmesidir.</p>
      <h4>2. Kapsam</h4>
      <p>maaş standartlarını kapsar.</p>
      <h4>3. Dayanak ve Uyum Çerçevesi</h4>
      <p>adil ücret esasları.</p>
      <h4>4. Haklar ve Yükümlülükler</h4>
      <p>şeffaf bir ücret baremi uygulanır.</p>
      <h4>5. Uygulama ve Yürürlük</h4>
      <p>kurumsal politika olarak yürürlüktedir.</p>
    `
  },
  {
    slug: 'abd-irs-bagis-beyani',
    title: 'ABD IRS Uyumlu Bağış Beyanı',
    content: `
      <h3>ABD IRS Uyumlu Bağış Beyanı</h3>
      <h4>1. Amaç</h4>
      <p>ABD'li bağışçıların vergi avantajlarından yararlanmasını sağlamaktır.</p>
      <h4>2. Kapsam</h4>
      <p>ABD vergi mükellefi bağışçıları kapsar.</p>
      <h4>3. Dayanak ve Uyum Çerçevesi</h4>
      <p>IRS Section 501(c)(3) standartları.</p>
      <h4>4. Haklar ve Yükümlülükler</h4>
      <p>uygun projeler bu standartta raporlanır.</p>
      <h4>5. Uygulama ve Yürürlük</h4>
      <p>global uyum beyanıdır.</p>
    `
  },
  {
    slug: 'cevresel-sorumluluk-politikasi',
    title: 'Çevresel Sorumluluk ve Sürdürülebilirlik Politikası',
    content: `
      <h3>Çevresel Sorumluluk ve Sürdürülebilirlik Politikası</h3>
      <h4>1. Amaç</h4>
      <p>Platformun ekolojik ayak izini minimize etmek ve sürdürülebilirliği desteklemektir.</p>
      <h4>2. Kapsam</h4>
      <p>Ofis operasyonları ve dijital altyapıyı kapsar.</p>
      <h4>3. Dayanak ve Uyum Çerçevesi</h4>
      <p>Paris İklim Anlaşması ilkeleri.</p>
      <h4>4. Haklar ve Yükümlülükler</h4>
      <p>hangel, karbon nötr hedefleri doğrultusunda çalışmayı taahhüt eder.</p>
      <h4>5. Uygulama ve Yürürlük</h4>
      <p>Kurumsal sürdürülebilirlik stratejisinin bir parçasıdır.</p>
    `
  },
  {
    slug: 'aml-cft-uyum-beyani',
    title: 'AML / CFT Uyum Beyanı',
    content: `
      <h3>AML / CFT Uyum Beyanı</h3>
      <h4>1. Amaç</h4>
      <p>Kara para aklama ve terörizmin finansmanını önlemek için sıkı denetim uygulamaktır.</p>
      <h4>2. Kapsam</h4>
      <p>Tüm finansal transfer ve bağış süreçlerini kapsar.</p>
      <h4>3. Dayanak ve Uyum Çerçevesi</h4>
      <p>5549 sayılı Kanun ve FATF tavsiyeleri.</p>
      <h4>4. Haklar ve Yükümlülükler</h4>
      <p>Şüpheli işlemler ilgili otoritelere ivedilikle bildirilir.</p>
      <h4>5. Uygulama ve Yürürlük</h4>
      <p>Sürekli denetim prosedürü olarak yürürlüktedir.</p>
    `
  },
  {
    slug: 'etik-bagis-ve-fon-kullanimi-beyani',
    title: 'Etik Bağış ve Fon Kullanımı Beyanı',
    content: `
      <h3>Etik Bağış ve Fon Kullanımı Beyanı</h3>
      <h4>1. Amaç</h4>
      <p>Bağış kaynaklarının etik doğruluğunu ve amacına uygun kullanımını beyan etmektir.</p>
      <h4>2. Kapsam</h4>
      <p>Fon kabul ve dağıtım süreçlerinin tamamını kapsar.</p>
      <h4>3. Dayanak ve Uyum Çerçevesi</h4>
      <p>Uluslararası sivil toplum etik kuralları.</p>
      <h4>4. Haklar ve Yükümlülükler</h4>
      <p>Etik dışı kaynaklardan gelen bağışlar reddedilir.</p>
      <h4>5. Uygulama ve Yürürlük</h4>
      <p>Kurumsal etik kuralların ayrılmaz parçasıdır.</p>
    `
  },
  {
    slug: 'acik-veri-ve-etki-verisi-paylasim-politikasi',
    title: 'Açık Veri ve Etki Verisi Paylaşım Politikası',
    content: `
      <h3>Açık Veri ve Etki Verisi Paylaşım Politikası</h3>
      <h4>1. Amaç</h4>
      <p>Oluşturulan sosyal etkinin verilerini şeffaf bir şekilde kamuoyuyla paylaşmaktır.</p>
      <h4>2. Kapsam</h4>
      <p>Anonimleştirilmiş etki ve operasyon verilerini kapsar.</p>
      <h4>3. Dayanak ve Uyum Çerçevesi</h4>
      <p>Açık veri (Open Data) prensipleri.</p>
      <h4>4. Haklar ve Yükümlülükler</h4>
      <p>Veriler akademik ve toplumsal çalışmalar için erişilebilir kılınır.</p>
      <h4>5. Uygulama ve Yürürlük</h4>
      <p>Şeffaflık taahhüdümüzün temelidir.</p>
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
      <p>tüm paydaşlar için geçerlidir.</p>
      <h4>3. Dayanak ve Uyum Çerçevesi</h4>
      <p>evrensel insan hakları.</p>
      <h4>4. Haklar ve Yükümlülükler</h4>
      <p>ayrımcılığa karşı sıfır tolerans esastır.</p>
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
      <p>karar alma süreçlerinin bağımsızlığını sağlamaktır.</p>
      <h4>2. Kapsam</h4>
      <p>yönetim kurulunu kapsar.</p>
      <h4>3. Dayanak ve Uyum Çerçevesi</h4>
      <p>kurumsal yönetişim ilkeleri.</p>
      <h4>4. Haklar ve Yükümlülükler</h4>
      <p>potansiyel çatışmalar beyan edilmelidir.</p>
      <h4>5. Uygulama ve Yürürlük</h4>
      <p>iç denetim mekanizmasıdır.</p>
    `
  },
  {
    slug: 'whistleblower-politikasi',
    title: 'Whistleblower (İhbarcı) Politikası',
    content: `
      <h3>Whistleblower (İhbarcı) Politikası</h3>
      <h4>1. Amaç</h4>
      <p>etik dışı durumların güvenli bildirilmesini sağlamaktır.</p>
      <h4>2. Kapsam</h4>
      <p>tüm kullanıcıları kapsar.</p>
      <h4>3. Dayanak ve Uyum Çerçevesi</h4>
      <p>şeffaflık prensipleri.</p>
      <h4>4. Haklar ve Yükümlülükler</h4>
      <p>ihbarcı kimliği gizli tutulur.</p>
      <h4>5. Uygulama ve Yürürlük</h4>
      <p>güven hattıyla yürürlüktedir.</p>
    `
  },
  {
    slug: 'yonetim-ve-kurumsal-yonetisim-ilkeleri',
    title: 'Yönetim ve Kurumsal Yönetişim İlkeleri',
    content: `
      <h3>Yönetim ve Kurumsal Yönetişim İlkeleri</h3>
      <h4>1. Amaç</h4>
      <p>hangel yönetişim yapısını şeffaf kılmaktır.</p>
      <h4>2. Kapsam</h4>
      <p>karar süreçlerini kapsar.</p>
      <h4>3. Dayanak ve Uyum Çerçevesi</h4>
      <p>OECD ilkeleri.</p>
      <h4>4. Haklar ve Yükümlülükler</h4>
      <p>adil yönetim esastır.</p>
      <h4>5. Uygulama ve Yürürlük</h4>
      <p>sürekli yürürlüktedir.</p>
    `
  },
  {
    slug: 'kamu-yarari-ve-sosyal-fayda-beyani',
    title: 'Kamu Yararı ve Sosyal Fayda Statüsü Beyanı',
    content: `
      <h3>Kamu Yararı ve Sosyal Fayda Statüsü Beyanı</h3>
      <h4>1. Amaç</h4>
      <p>hangel faaliyetlerinin kamu yararına olduğunu beyan etmektir.</p>
      <h4>2. Kapsam</h4>
      <p>şirket ana sözleşmesini kapsar.</p>
      <h4>3. Dayanak ve Uyum Çerçevesi</h4>
      <p>sosyal girişimcilik hukuku.</p>
      <h4>4. Haklar ve Yükümlülükler</h4>
      <p>tüm projeler toplumsal bir ihtiyaca cevap verir.</p>
      <h4>5. Uygulama ve Yürürlük</h4>
      <p>resmi beyanımızdır.</p>
    `
  },
  {
    slug: 'insan-haklari-politikasi',
    title: 'İnsan Hakları Politikası',
    content: `
      <h3>İnsan Hakları Politikası</h3>
      <h4>1. Amaç</h4>
      <p>İnsan onuruna saygıyı tüm kurumsal faaliyetlerin odağında tutmaktır.</p>
      <h4>2. Kapsam</h4>
      <p>Çalışanlar, gönüllüler ve faydalanıcıları kapsar.</p>
      <h4>3. Dayanak ve Uyum Çerçevesi</h4>
      <p>BM İnsan Hakları Evrensel Beyannamesi.</p>
      <h4>4. Haklar ve Yükümlülükler</h4>
      <p>Ayrımcılık, sömürü ve çocuk işçiliğine karşı sıfır tolerans uygulanır.</p>
      <h4>5. Uygulama ve Yürürlük</h4>
      <p>Temel haklar çerçevesi olarak her zaman yürürlüktedir.</p>
    `
  },
  {
    slug: 'dei-politikasi',
    title: 'DEI Politikası',
    content: `
      <h3>DEI Politikası (Çeşitlilik, Hakkaniyet ve Kapsayıcılık)</h3>
      <h4>1. Amaç</h4>
      <p>Farklılıkların zenginlik olarak kabul edildiği kapsayıcı bir ekosistem oluşturmaktır.</p>
      <h4>2. Kapsam</h4>
      <p>İşe alım, terfi ve topluluk yönetimi süreçlerini kapsar.</p>
      <h4>3. Dayanak ve Uyum Çerçevesi</h4>
      <p>Evrensel eşitlik ve adalet ilkeleri.</p>
      <h4>4. Haklar ve Yükümlülükler</h4>
      <p>hangel, her bireye eşit fırsatlar sunmayı taahhüt eder.</p>
      <h4>5. Uygulama ve Yürürlük</h4>
      <p>Kültürel dönüşüm stratejimizin bir parçasıdır.</p>
    `
  },
  {
    slug: 'risk-yonetimi-ve-kriz-mudahale-politikasi',
    title: 'Risk Yönetimi ve Kriz Müdahale Politikası',
    content: `
      <h3>Risk Yönetimi ve Kriz Müdahale Politikası</h3>
      <h4>1. Amaç</h4>
      <p>Olası kriz anlarında kurumsal sürekliliği ve güvenliği sağlamaktır.</p>
      <h4>2. Kapsam</h4>
      <p>Finansal, itibari ve teknolojik riskleri kapsar.</p>
      <h4>3. Dayanak ve Uyum Çerçevesi</h4>
      <p>COSO kurumsal risk yönetimi standartları.</p>
      <h4>4. Haklar ve Yükümlülükler</h4>
      <p>Kriz anında öncelikli olarak paydaş güvenliği ve veri bütünlüğü korunur.</p>
      <h4>5. Uygulama ve Yürürlük</h4>
      <p>İç denetim ve operasyonel hazırlık planıdır.</p>
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
      <p>tüm dijital platformumuzu kapsar.</p>
      <h4>3. Dayanak ve Uyum Çerçevesi</h4>
      <p>WCAG 2.2 AA standartları.</p>
      <h4>4. Haklar ve Yükümlülükler</h4>
      <p>hangel, engelleri kaldırmayı taahhüt eder.</p>
      <h4>5. Uygulama ve Yürürlük</h4>
      <p>teknik standartlarımızdır.</p>
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
      <p>resmi duyuruları kapsar.</p>
      <h4>3. Dayanak ve Uyum Çerçevesi</h4>
      <p>şeffaflık ilkeleri.</p>
      <h4>4. Haklar ve Yükümlülükler</h4>
      <p>kritik gelişmeler makul sürede ilan edilir.</p>
      <h4>5. Uygulama ve Yürürlük</h4>
      <p>iletişim stratejimizdir.</p>
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
      <p>tercüme farklarında istanbul merkezli türkçe metin esastır.</p>
      <h4>5. Uygulama ve Yürürlük</h4>
      <p>global genişleme ile aktif olur.</p>
    `
  },
  {
    slug: 'yerel-bagis-mevzuatlarina-uyum-beyani',
    title: 'Yerel Bağış Mevzuatlarina Uyum Beyanı',
    content: `
      <h3>Yerel Bağış Mevzuatlarina Uyum Beyanı</h3>
      <h4>1. Amaç</h4>
      <p>global operasyonlarda yerel bağış kurallarına uyumu teyit etmektir.</p>
      <h4>2. Kapsam</h4>
      <p>operasyon yapılan tüm pazarları kapsar.</p>
      <h4>3. Dayanak ve Uyum Çerçevesi</h4>
      <p>ilgili ülkelerin bağış kanunları.</p>
      <h4>4. Haklar ve Yükümlülükler</h4>
      <p>hangel, yerel izinleri almayı taahhüt eder.</p>
      <h4>5. Uygulama ve Yürürlük</h4>
      <p>hukuki uyum beyanıdır.</p>
    `
  },

  // --- F. Gelişim Yol Haritası ve Standartlar ---
  {
    slug: 'gelisim-yol-haritasi-ve-standartlar',
    title: 'Gelişim Yol Haritası ve Henüz Sağlanmamış Standartlar Beyanı',
    content: `
      <h3>Gelişim Yol Haritası ve Henüz Sağlanmamış Standartlar Beyanı</h3>
      <h4>1. Amaç</h4>
      <p>hangel olarak şeffaflık ilkemiz gereği, platformumuzun mevcut durumunu ve henüz tam uyum sağlanmamış ancak gelişim yol haritamızda yer alan uluslararası standartları paydaşlarımıza beyan etmektir.</p>
      <h4>2. Kapsam</h4>
      <p>Bilgi güvenliği, finansal yönetim, dijital erişilebilirlik ve kurumsal yönetişim alanlarındaki gelişim hedeflerini kapsar.</p>
      <h4>3. Mevcut Durum ve Hedeflenen Standartlar Tablosu</h4>
      <div class="overflow-x-auto my-6">
        <table class="w-full border-collapse border border-gray-200">
          <thead>
            <tr class="bg-gray-50">
              <th class="border border-gray-200 p-3 text-left font-bold text-sm">Ana Blok</th>
              <th class="border border-gray-200 p-3 text-left font-bold text-sm">Eksik / Henüz Sağlanmamış Standart / Uygulama</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="border border-gray-200 p-3 font-bold text-sm">Bilgi Güvenliği</td>
              <td class="border border-gray-200 p-3 text-sm">
                <ul class="list-disc ml-4 space-y-1">
                  <li>ISO 27001 / NIST sertifikasyonu</li>
                  <li>Düzenli sızma testleri / güvenlik denetimleri</li>
                  <li>Çalışan güvenlik eğitimi</li>
                  <li>Olay müdahale planı (Incident Response Plan)</li>
                </ul>
              </td>
            </tr>
            <tr>
              <td class="border border-gray-200 p-3 font-bold text-sm">Dijital Platform Standartları</td>
              <td class="border border-gray-200 p-3 text-sm">
                <ul class="list-disc ml-4 space-y-1">
                  <li>ISO / IEC 25010 / EN 301 549</li>
                  <li>Mobil ve web performans ölçüm raporları</li>
                  <li>UX ve güvenlik testleri</li>
                  <li>Erişilebilirlik sertifikasyonu</li>
                </ul>
              </td>
            </tr>
            <tr>
              <td class="border border-gray-200 p-3 font-bold text-sm">Bağış ve Finansal Şeffaflık</td>
              <td class="border border-gray-200 p-3 text-sm">
                <ul class="list-disc ml-4 space-y-1">
                  <li>Dış denetim raporları / bağımsız mali denetim</li>
                  <li>Finansal standart sertifikaları (IFRS, GAAP)</li>
                  <li>Bağışçı şikayet / geri bildirim mekanizması</li>
                </ul>
              </td>
            </tr>
            <tr>
              <td class="border border-gray-200 p-3 font-bold text-sm">Yönetişim ve Etik</td>
              <td class="border border-gray-200 p-3 text-sm">
                <ul class="list-disc ml-4 space-y-1">
                  <li>Board / yönetim kurulunda bağımsız denetim</li>
                  <li>Etik performans raporlaması</li>
                  <li>Uyum / risk komitesi uygulaması</li>
                </ul>
              </td>
            </tr>
            <tr>
              <td class="border border-gray-200 p-3 font-bold text-sm">İş Sürekliliği ve Risk Yönetimi</td>
              <td class="border border-gray-200 p-3 text-sm">
                <ul class="list-disc ml-4 space-y-1">
                  <li>ISO 22301 / İş Sürekliliği Yönetim Sistemi</li>
                  <li>Felaket kurtarma ve yedekleme planlarının testi</li>
                  <li>Sistem ve operasyonel risklerin güncellenmesi</li>
                </ul>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <h4>4. Haklar ve Yükümlülükler</h4>
      <p>hangel, bu standartlara uyum için gerekli kaynakları ayırmayı ve ilerleme raporlarını periyodik olarak şeffaflık endeksinde yayınlamayı taahhüt eder.</p>
      <h4>5. Uygulama ve Yürürlük</h4>
      <p>Bu beyan, platformun stratejik yol haritasının bir parçası olarak yayınlandığı tarihte yürürlüğe girmiştir.</p>
    `
  },

  // --- G. ISO / Uluslararası Sertifikasyonlar ---
  {
    slug: 'iso-27001-uyum-beyani',
    title: 'ISO 27001 Uyum Beyanı (Bilgi Güvenliği)',
    content: `
      <h3>ISO 27001 Uyum Beyanı</h3>
      <h4>1. Amaç</h4>
      <p>hangel bilgi varlıklarının gizliliğini, bütünlüğünü ve erişilebilirliğini korumak için ISO/IEC 27001:2022 standartlarına uyum sürecini deklare etmektir.</p>
      <h4>2. Kapsam</h4>
      <p>Tüm dijital altyapı, yazılım geliştirme süreçleri ve personel operasyonlarını kapsar.</p>
      <h4>3. Dayanak ve Uyum Çerçevesi</h4>
      <p>Uluslararası Bilgi Güvenliği Yönetim Sistemi (ISMS) standartları.</p>
      <h4>4. Haklar ve Yükümlülükler</h4>
      <p>hangel, risk bazlı bir güvenlik yaklaşımı benimser ve düzenli iç denetimler gerçekleştirir.</p>
      <h4>5. Uygulama ve Yürürlük</h4>
      <p>Sürekli iyileştirme prensibiyle yürürlüktedir.</p>
    `
  },
  {
    slug: 'iso-22301-uyum-beyani',
    title: 'ISO 22301 Uyum Beyanı (İş Sürekliliği)',
    content: `
      <h3>ISO 22301 Uyum Beyanı</h3>
      <h4>1. Amaç</h4>
      <p>Olası kesintilerde sosyal etki süreçlerinin devamlılığını sağlamak için iş sürekliliği standartlarına uyumu taahhüt etmektir.</p>
      <h4>2. Kapsam</h4>
      <p>Kritik iş süreçleri, veri kurtarma ve kriz yönetimi operasyonlarını kapsar.</p>
      <h4>3. Dayanak ve Uyum Çerçevesi</h4>
      <p>ISO 22301 İş Sürekliliği Yönetim Sistemi standartları.</p>
      <h4>4. Haklar ve Yükümlülükler</h4>
      <p>hangel, afet ve kriz anlarında hizmet seviyesi taahhütlerini (SLA) korumak için gerekli yedekleme sistemlerini çalıştırır.</p>
      <h4>5. Uygulama ve Yürürlük</h4>
      <p>Yıllık test ve güncellemelerle yürürlüktedir.</p>
    `
  },
  {
    slug: 'iso-25010-en-301-549-uyum-beyani',
    title: 'ISO / IEC 25010 / EN 301 549 Uyum Beyanı (Dijital Platform Standartları)',
    content: `
      <h3>Dijital Platform Standartları Uyum Beyanı</h3>
      <h4>1. Amaç</h4>
      <p>Platformun yazılım kalitesini ve erişilebilirlik standartlarını uluslararası normlarda tutmaktır.</p>
      <h4>2. Kapsam</h4>
      <p>Web arayüzü, mobil uygulama ve API servislerini kapsar.</p>
      <h4>3. Dayanak ve Uyum Çerçevesi</h4>
      <p>ISO/IEC 25010 Yazılım Kalite Modeli ve EN 301 549 AB Erişilebilirlik Standartları.</p>
      <h4>4. Haklar ve Yükümlülükler</h4>
      <p>hangel, kullanıcı deneyimini (UX) ve teknik performansı bu standartlar ışığında periyodik olarak test eder.</p>
      <h4>5. Uygulama ve Yürürlük</h4>
      <p>Geliştirme yaşam döngüsünün (SDLC) bir parçasıdır.</p>
    `
  },

  // --- H. Dış Denetim / Mali ve Finansal Sertifikasyon ---
  {
    slug: 'bagimsiz-mali-denetim-ve-ifrs-gaap-beyani',
    title: 'Bağımsız Mali Denetim ve IFRS / GAAP Beyanı',
    content: `
      <h3>Bağımsız Mali Denetim Beyanı</h3>
      <h4>1. Amaç</h4>
      <p>Finansal tabloların doğruluğunu ve şeffaflığını uluslararası muhasebe standartlarında deklare etmektir.</p>
      <h4>2. Kapsam</h4>
      <p>hangel AŞ'nin yıllık tüm finansal operasyonlarını ve bağış aktarım kayıtlarını kapsar.</p>
      <h4>3. Dayanak ve Uyum Çerçevesi</h4>
      <p>IFRS (Uluslararası Finansal Raporlama Standartları) ve GAAP prensipleri.</p>
      <h4>4. Haklar ve Yükümlülükler</h4>
      <p>hangel, her yıl bağımsız bir denetim kuruluşu tarafından denetlenmeyi ve raporu kamuoyuyla paylaşmayı taahhüt eder.</p>
      <h4>5. Uygulama ve Yürürlük</h4>
      <p>Her mali yıl sonunda uygulanır.</p>
    `
  },

  // --- I. Sistematik Test ve Uygulama ---
  {
    slug: 'sizma-ve-guvenlik-testleri-beyani',
    title: 'Sızma Testleri ve Güvenlik Testleri Beyanı',
    content: `
      <h3>Sızma Testleri ve Güvenlik Testleri Beyanı</h3>
      <h4>1. Amaç</h4>
      <p>Sistem zafiyetlerini önceden tespit etmek ve siber saldırılara karşı dirençli kalmaktır.</p>
      <h4>2. Kapsam</h4>
      <p>Network, sunucu ve uygulama katmanındaki tüm güvenlik denetimlerini kapsar.</p>
      <h4>3. Dayanak ve Uyum Çerçevesi</h4>
      <p>OWASP standartları ve etik hackerlık protokolleri.</p>
      <h4>4. Haklar ve Yükümlülükler</h4>
      <p>hangel, yılda en az bir kez bağımsız üçüncü taraflara sızma testi yaptırır.</p>
      <h4>5. Uygulama ve Yürürlük</h4>
      <p>Güvenlik yol haritasının temel taşıdır.</p>
    `
  },
  {
    slug: 'ux-ve-kullanici-deneyimi-testleri-beyani',
    title: 'UX ve Kullanıcı Deneyimi Testleri Beyanı',
    content: `
      <h3>UX ve Kullanıcı Deneyimi Testleri Beyanı</h3>
      <h4>1. Amaç</h4>
      <p>Platformun kullanım kolaylığını ve erişilebilirliğini gerçek kullanıcı geri bildirimleriyle doğrulamaktır.</p>
      <h4>2. Kapsam</h4>
      <p>Tüm kullanıcı segmentleri ve engel grupları üzerindeki kullanılabilirlik testlerini kapsar.</p>
      <h4>3. Dayanak ve Uyum Çerçevesi</h4>
      <p>Nielsen Norman Group prensipleri ve ISO 9241-210.</p>
      <h4>4. Haklar ve Yükümlülükler</h4>
      <p>hangel, test sonuçlarına göre arayüz iyileştirmelerini önceliklendirir.</p>
      <h4>5. Uygulama ve Yürürlük</h4>
      <p>Tasarım süreçlerinin ayrılmaz parçasıdır.</p>
    `
  },
  {
    slug: 'felaket-kurtarma-ve-yedekleme-testleri-beyani',
    title: 'Felaket Kurtarma ve Yedekleme Testleri Beyanı',
    content: `
      <h3>Felaket Kurtarma ve Yedekleme Testleri Beyanı</h3>
      <h4>1. Amaç</h4>
      <p>Veri kaybını önlemek ve sistemin felaket anında geri yükleme kapasitesini test etmektir.</p>
      <h4>2. Kapsam</h4>
      <p>Veri tabanı yedekleri, sunucu imajları ve felaket kurtarma merkezi (DRC) senaryolarını kapsar.</p>
      <h4>3. Dayanak ve Uyum Çerçevesi</h4>
      <p>3-2-1 yedekleme kuralı ve kurumsal süreklilik planları.</p>
      <h4>4. Haklar ve Yükümlülükler</h4>
      <p>hangel, yedeklerin doğruluğunu ve geri dönülebilirliğini düzenli tatbikatlarla kontrol eder.</p>
      <h4>5. Uygulama ve Yürürlük</h4>
      <p>Teknik operasyonel standarttır.</p>
    `
  },

  // --- J. Kurumsal Uyum / Risk Komitesi ---
  {
    slug: 'ucuncu-taraf-gozetim-ve-etik-performans-beyani',
    title: 'Üçüncü Taraf Gözetim ve Etik Performans Beyanı',
    content: `
      <h3>Üçüncü Taraf Gözetim ve Etik Performans Beyanı</h3>
      <h4>1. Amaç</h4>
      <p>hangel'in etik değerlere uyumunu tarafsız kuruluşların denetimine açmaktır.</p>
      <h4>2. Kapsam</h4>
      <p>Tedarik zinciri etiği, çalışan hakları ve topluluk yönetimi süreçlerini kapsar.</p>
      <h4>3. Dayanak ve Uyum Çerçevesi</h4>
      <p>BM Küresel İlkeler Sözleşmesi (UN Global Compact).</p>
      <h4>4. Haklar ve Yükümlülükler</h4>
      <p>hangel, etik performans verilerini şeffafça paylaşmayı taahhüt eder.</p>
      <h4>5. Uygulama ve Yürürlük</h4>
      <p>Kurumsal etik denetim takvimine bağlıdır.</p>
    `
  },
  {
    slug: 'kurumsal-risk-ve-uyum-komitesi-beyani',
    title: 'Kurumsal Risk ve Uyum Komitesi Beyanı',
    content: `
      <h3>Kurumsal Risk ve Uyum Komitesi Beyanı</h3>
      <h4>1. Amaç</h4>
      <p>Yasal regülasyonlara uyumu ve operasyonel riskleri yönetecek üst düzey bir yapı tanımlamaktır.</p>
      <h4>2. Kapsam</h4>
      <p>Tüm departmanların risk analizlerini ve mevzuat uyum süreçlerini kapsar.</p>
      <h4>3. Dayanak ve Uyum Çerçevesi</h4>
      <p>Kurumsal yönetişim kodları.</p>
      <h4>4. Haklar ve Yükümlülükler</h4>
      <p>Komite, yönetim kuruluna doğrudan bağlıdır ve uyumsuzluk durumlarında veto yetkisine sahiptir.</p>
      <h4>5. Uygulama ve Yürürlük</h4>
      <p>Yönetim kurulu kararıyla yürürlüğe girmiştir.</p>
    `
  },

  // --- K. Kuruluş Tipine Özel Üyelik Sözleşmeleri ---
  {
    slug: 'stk-uyelik',
    title: 'STK Üyelik Sözleşmesi',
    content: `
      <h3>STK Üyelik Sözleşmesi</h3>
      <h4>1. Amaç</h4>
      <p>Bu sözleşme, hangel platformunda Sivil Toplum Kuruluşu (STK) olarak yer alan taraflar arasında imzalanmış kabul edilen genel hükümleri kapsar. STK üyelerinin platformdaki temsil, faaliyet ve iletişim süreçlerini düzenler.</p>
      <h4>2. Taraflar</h4>
      <p>İşbu sözleşme, bir tarafta hangel platformunu işleten hangel AŞ ile diğer tarafta platforma üye olan dernek, vakıf veya benzeri sivil toplum kuruluşu arasında akdedilmiştir.</p>
      <h4>3. Hizmet Kapsamı</h4>
      <p>hangel, STK üyelerine kurumsal profil oluşturma, kampanya yayınlama, gönüllü ilanları açma, bağış toplama ve etki raporlama araçları sunar. STK, sağladığı kurumsal bilgilerin doğruluğundan sorumludur.</p>
      <h4>4. STK Yükümlülükleri</h4>
      <p>STK; ilgili mevzuata (Dernekler Kanunu, Vakıflar Kanunu, 2860 sayılı Yardım Toplama Kanunu) uyumlu faaliyet gösterdiğini, topladığı bağışları beyan ettiği amaç doğrultusunda kullandığını ve hangel'in talep ettiği şeffaflık raporlarını süresinde sunduğunu taahhüt eder.</p>
      <h4>5. Fesih</h4>
      <p>Taraflar, 30 gün önceden yazılı bildirimde bulunmak kaydıyla sözleşmeyi feshedebilir. hangel, kural ihlali tespit ettiği STK üyeliklerini derhal askıya alma hakkını saklı tutar.</p>
      <h4>6. Yürürlük</h4>
      <p>Sözleşme, STK başvurusunun hangel tarafından onaylandığı tarihte yürürlüğe girer ve fesih edilene kadar geçerlidir. Sözleşmenin yorumunda Türkçe metin esastır.</p>
    `
  },
  {
    slug: 'seffaflik',
    title: 'Şeffaflık Endeksi Esasları',
    content: `
      <h3>Şeffaflık Endeksi Esasları</h3>
      <h4>1. Amaç</h4>
      <p>hangel platformunda yer alan STK, marka ve kulüplerin kamuoyuyla paylaşacağı şeffaflık verilerinin standartlarını belirlemek; bağışçı ve gönüllü güvenini ölçülebilir kriterlerle desteklemektir.</p>
      <h4>2. Kapsam</h4>
      <p>Bu esaslar, hangel ekosistemindeki tüm kuruluşların finansal şeffaflık, yönetişim, etki ölçümü ve veri paylaşımı süreçlerini kapsar.</p>
      <h4>3. Endeks Bileşenleri</h4>
      <p>Şeffaflık endeksi; (a) finansal raporlama düzeyi, (b) yönetim kurulu yapısı ve karar süreçleri, (c) bağış kullanımının izlenebilirliği, (d) etki ölçüm metodolojisi ve (e) bağımsız denetim uyumu kriterlerinden oluşur.</p>
      <h4>4. Kuruluş Yükümlülükleri</h4>
      <p>Endekse dahil olan kuruluşlar; yıllık faaliyet raporlarını, mali tablolarını ve etki verilerini hangel ile paylaşmayı ve bu verilerin anonimleştirilmiş hâlinin kamuoyuyla yayınlanmasına onay vermeyi kabul eder.</p>
      <h4>5. Skorlama ve İtiraz</h4>
      <p>hangel, sağlanan veriler ve bağımsız doğrulama sonuçlarına göre her kuruluşa periyodik skor verir. Kuruluşlar skorlarına 30 gün içinde itiraz edebilir; itirazlar bağımsız değerlendirme komitesince incelenir.</p>
      <h4>6. Yürürlük</h4>
      <p>Bu esaslar, kuruluşun platforma kabul edildiği tarihte yürürlüğe girer ve hangel'in resmi şeffaflık politikasının ayrılmaz parçasıdır.</p>
    `
  },
  {
    slug: 'marka-uyelik',
    title: 'Marka Üyelik Sözleşmesi',
    content: `
      <h3>Marka Üyelik Sözleşmesi</h3>
      <h4>1. Amaç</h4>
      <p>Bu sözleşme, hangel platformunda marka, kooperatif, sosyal işletme veya iktisadi işletme olarak yer alan taraflar arasında imzalanmış kabul edilen genel hükümleri kapsar.</p>
      <h4>2. Taraflar</h4>
      <p>İşbu sözleşme, hangel platformunu işleten hangel AŞ ile platforma marka olarak başvuran tüzel kişi arasında akdedilmiştir.</p>
      <h4>3. Hizmet Kapsamı</h4>
      <p>hangel, marka üyelerine ürün/hizmet vitrini, bağış kategorileri yönetimi, affiliate takip altyapısı, kampanya yayınlama ve fiziksel/dijital satış üzerinden bağış aktarımı araçları sunar.</p>
      <h4>4. Marka Yükümlülükleri</h4>
      <p>Marka; sağladığı kurumsal bilgilerin (ticaret sicil, vergi numarası, IBAN) doğruluğundan, sunduğu ürün ve hizmetlerin yasal mevzuata uygunluğundan ve bağış oranı taahhütlerine sadık kalmaktan sorumludur.</p>
      <h4>5. Komisyon ve Bağış Aktarımı</h4>
      <p>Tahsil edilen bağış payları, hangel'in tanımladığı periyotlarda ve şeffaf raporlama eşliğinde ilgili STK/projeye aktarılır. Komisyon oranları ve operasyonel ücretler ek protokolde belirlenir.</p>
      <h4>6. Fesih ve Yürürlük</h4>
      <p>Taraflar, 30 gün önceden yazılı bildirimde bulunmak suretiyle sözleşmeyi feshedebilir. Sözleşme, marka başvurusunun onaylandığı tarihte yürürlüğe girer.</p>
    `
  },
  {
    slug: 'affiliate-politikasi',
    title: 'Bağış ve Affiliate Politikası',
    content: `
      <h3>Bağış ve Affiliate Politikası</h3>
      <h4>1. Amaç</h4>
      <p>hangel platformunda yer alan markaların affiliate (iş ortaklığı) ve bağış aktarım süreçlerini şeffaf, denetlenebilir ve etik standartlara uygun biçimde yönetmektir.</p>
      <h4>2. Kapsam</h4>
      <p>Bu politika; affiliate ID tanımlama, tracking link/pixel kullanımı, bağış oranı taahhüdü, ödeme periyotları ve raporlama yükümlülüklerini kapsar.</p>
      <h4>3. Affiliate Standartları</h4>
      <p>Markaya tahsis edilen affiliate ID ve tracking link, yalnızca markanın kendi kanallarında veya hangel onaylı yayıncılarda kullanılabilir. Pixel/tracking script'lerinin KVKK ve GDPR çerez gerekliliklerine uyumu zorunludur.</p>
      <h4>4. Bağış Aktarımı</h4>
      <p>Marka, her satışta beyan ettiği oran üzerinden bağışı hangel'e aktarmayı taahhüt eder. Aktarımlar aylık periyotlarda mutabakat raporuyla birlikte gerçekleşir; bağışın hangi STK/projeye yönlendirileceği marka ve hangel arasında belirlenir.</p>
      <h4>5. Denetim ve Şeffaflık</h4>
      <p>hangel, affiliate verileri ve bağış akışını denetleme hakkına sahiptir. Tutarsızlık veya kötüye kullanım tespiti hâlinde marka hesabı askıya alınabilir; topladığı bağışlar bağış sahiplerine iade edilir.</p>
      <h4>6. Yürürlük</h4>
      <p>Bu politika, marka üyelik sözleşmesinin ayrılmaz ekidir ve markanın platforma kabul edildiği tarihte yürürlüğe girer.</p>
    `
  },
  {
    slug: 'ogrenci-kulup',
    title: 'Öğrenci Kulüp Sözleşmesi',
    content: `
      <h3>Öğrenci Kulüp Sözleşmesi</h3>
      <h4>1. Amaç</h4>
      <p>Bu sözleşme, hangel platformunda öğrenci kulübü (üniversite veya lise) olarak yer alan taraflar arasında imzalanmış kabul edilen genel hükümleri kapsar.</p>
      <h4>2. Taraflar</h4>
      <p>İşbu sözleşme, hangel platformunu işleten hangel AŞ ile platforma başvuran ve bağlı bulunduğu üniversite/il millî eğitim müdürlüğü tarafından tanınan öğrenci kulübü arasında akdedilmiştir.</p>
      <h4>3. Hizmet Kapsamı</h4>
      <p>hangel, kulüp üyelerine etkinlik yayınlama, gönüllü çağrısı açma, kampüs içi/dışı bağış kampanyaları düzenleme, kulüp profili ve duyuru paneli araçları sunar.</p>
      <h4>4. Kulüp Yükümlülükleri</h4>
      <p>Kulüp; bağlı olduğu kurumun (üniversite veya İl Millî Eğitim Müdürlüğü) onayına sahip olduğunu, gerçekleştirdiği etkinliklerin kurum yönetmeliklerine uygunluğunu ve toplanan bağışların beyan edilen amaç doğrultusunda kullanılmasını taahhüt eder.</p>
      <h4>5. Sorumluluk Sınırı</h4>
      <p>hangel, kulüp etkinliklerinde meydana gelebilecek üçüncü taraf zararlarından doğrudan sorumlu tutulamaz. Kulüp, etkinlik organizasyonu sürecinde gerekli izinleri ve sigorta yükümlülüklerini bizzat yerine getirir.</p>
      <h4>6. Fesih ve Yürürlük</h4>
      <p>Sözleşme, kulüp başvurusunun onaylandığı tarihte yürürlüğe girer. Taraflar 30 gün önceden yazılı bildirimle sözleşmeyi feshedebilir; kulübün bağlı olduğu kurumla bağlantısının kesilmesi hâlinde üyelik kendiliğinden sona erer.</p>
    `
  }
];
