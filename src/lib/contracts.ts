export interface Contract {
  slug: string;
  title: string;
  content: string;
}

export const contractsData: Contract[] = [
  {
    slug: 'kullanici-sozlesmesi',
    title: 'Kullanıcı Sözleşmesi',
    content: `
      <h4>1. Taraflar</h4>
      <p>İşbu Kullanıcı Sözleşmesi ("Sözleşme"), Hangel platformu ("Platform") ile platforma üye olan kullanıcı ("Kullanıcı") arasında akdedilmiştir.</p>
      <h4>2. Tanımlar</h4>
      <p><strong>Hangel:</strong> Sosyal etki odaklı bir teknoloji platformu.</p>
      <p><strong>Kullanıcı:</strong> Platforma üye olan ve hizmetlerden yararlanan gerçek kişi.</p>
      <h4>3. Sözleşmenin Konusu</h4>
      <p>İşbu Sözleşme, Kullanıcı'nın Platform üzerinden sunulan hizmetlerden yararlanma şartlarını ve tarafların hak ve yükümlülüklerini düzenlemektedir.</p>
      <h4>4. Hizmetler</h4>
      <p>Hangel, kullanıcıların gönüllülük faaliyetlerine katılmasına, STK'lara bağış yapmasına ve sosyal sorumluluk sahibi markalardan alışveriş yaparak dolaylı bağışta bulunmasına olanak tanır.</p>
    `,
  },
  {
    slug: 'kurulus-sozlesmesi',
    title: 'Kuruluş Sözleşmesi',
    content: `
      <h4>1. Taraflar</h4>
      <p>İşbu Kuruluş Sözleşmesi ("Sözleşme"), Hangel platformu ("Platform") ile platforma üye olan Sivil Toplum Kuruluşu, Marka veya Öğrenci Kulübü ("Kuruluş") arasında akdedilmiştir.</p>
      <h4>2. Hizmet Kapsamı</h4>
      <p>Hangel, Kuruluş'un platform üzerinde profil oluşturmasına, gönüllülük ilanı yayınlamasına, bağış kampanyaları düzenlemesine ve toplulukla etkileşim kurmasına olanak tanır.</p>
      <h4>3. Kuruluş Yükümlülükleri</h4>
      <p>Kuruluş, sağladığı tüm bilgilerin (belgeler, raporlar, iletişim bilgileri) doğru, eksiksiz ve güncel olduğunu taahhüt eder. Şeffaflık ilkelerine uymayı ve platformu amacı doğrultusunda kullanmayı kabul eder.</p>
    `,
  },
  {
    slug: 'gonulluluk-sozlesmesi',
    title: 'Gönüllülük Sözleşmesi',
    content: `
      <h4>1. Kapsam</h4>
      <p>İşbu Gönüllülük Sözleşmesi, Hangel platformu aracılığıyla bir gönüllülük faaliyetine başvuran Kullanıcı ile ilanı yayınlayan Kuruluş arasındaki ilişkiyi düzenler.</p>
      <h4>2. Gönüllünün Hak ve Sorumlulukları</h4>
      <p>Gönüllü, başvurduğu faaliyetin gerekliliklerini yerine getirmeyi, kuruluşun kurallarına uymayı ve faaliyet süresince üzerine düşen görevleri özenle yapmayı kabul eder. Gönüllülük esasına dayalı bu faaliyet karşılığında herhangi bir maddi beklenti içinde olmadığını beyan eder.</p>
      <h4>3. Kuruluşun Hak ve Sorumlulukları</h4>
      <p>Kuruluş, gönüllü için güvenli ve sağlıklı bir çalışma ortamı sağlamakla, faaliyetin tanımında belirtilen imkanları sunmakla ve gönüllünün haklarına saygı göstermekle yükümlüdür.</p>
    `,
  },
  {
    slug: 'gizlilik-politikasi',
    title: 'Gizlilik Politikası',
    content: `
      <h4>1. Veri Sorumlusu</h4>
      <p>Hangel, kişisel verilerinizin işlenmesinde veri sorumlusu olarak hareket etmektedir.</p>
      <h4>2. İşlenen Veriler</h4>
      <p>Platforma üye olurken ve platformu kullanırken sağladığınız kişisel bilgiler (ad, e-posta, gönüllülük bilgileri vb.) hizmetlerimizi sunmak amacıyla işlenmektedir.</p>
      <h4>3. Veri Paylaşımı</h4>
      <p>Kişisel verileriniz, yasal zorunluluklar veya açık rızanız olmaksızın üçüncü taraflarla paylaşılmaz. Gönüllülük başvurularında, ilgili bilgileriniz başvuru yapılan kuruluş ile paylaşılır.</p>
    `,
  },
    {
    slug: 'bilgilendirme-politikasi',
    title: 'Bilgilendirme Politikası',
    content: `
      <p>Bu platformdaki verilerin nasıl kullanıldığı ve paylaşıldığı hakkında detaylı bilgilendirme metnidir. Şeffaflık ilkemiz gereği, tüm paydaşlarımızı süreçlerimiz hakkında aydınlatmayı hedefleriz.</p>
    `,
  },
  {
    slug: 'bagis-ve-yardim-politikasi',
    title: 'Bağış ve Yardım Politikası',
    content: `
      <p>Bağışların toplanması, anlaşmalı kuruluşlara aktarılması ve bu süreçlerin raporlanması ile ilgili tüm adımları ve kuralları düzenleyen politikamızdır.</p>
    `,
  },
  {
    slug: 'kar-dagitim-politikasi',
    title: 'Kâr Dağıtım Politikası',
    content: `
      <p>Bir sosyal girişim olarak Hangel, elde ettiği gelirin yasal olarak belirlenmiş bir kısmını tekrar sosyal etki yaratmak amacıyla kullanmayı taahhüt eder. Bu politika, operasyonel giderler sonrası oluşan gelir fazlasının hangi kriterlere göre hangi sosyal fayda alanlarına ve projelere aktarılacağını şeffaf bir şekilde düzenler.</p>
    `,
  },
   {
    slug: 'ucret-politikasi',
    title: 'Ücret Politikamız',
    content: `
      <p>Platformun operasyonel sürdürülebilirliğini sağlamak amacıyla markalardan ve işlemlerden alınan komisyon ve ücretler hakkında şeffaf bilgilendirme metnidir.</p>
    `,
  },
  {
    slug: 'bilgi-guvenligi-politikasi',
    title: 'Bilgi Güvenliği Politikası',
    content: `
      <p>Kullanıcılarımızın ve paydaşlarımızın verilerinin güvenliğini sağlamak için aldığımız teknik ve idari önlemleri, veri saklama ve imha prosedürlerimizi açıklayan politikamızdır.</p>
    `,
  },
  {
    slug: 'etik-ilkeler',
    title: 'Etik İlkeler',
    content: `
      <p>Hangel platformunun tüm paydaşlarının (kullanıcılar, STK'lar, markalar, çalışanlar) uyması beklenen etik kuralları ve davranış standartlarını belirleyen temel ilkelerimizdir.</p>
    `,
  },
  {
    slug: 'kvkk-aydinlatma-metni',
    title: 'KVKK Aydınlatma Metni',
    content: `
      <p>6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca, Hangel olarak, veri sorumlusu sıfatıyla, işlediğimiz kişisel verilerinizle ilgili olarak sizi bilgilendirmek isteriz. Kişisel verileriniz, platform hizmetlerinin sağlanması, kullanıcı deneyiminin iyileştirilmesi ve yasal yükümlülüklerin yerine getirilmesi amacıyla işlenmektedir. KVKK'nın 11. maddesi kapsamındaki haklarınızı kullanmak için bizimle iletişime geçebilirsiniz.</p>
    `,
  },
  {
    slug: 'gdpr',
    title: 'AB Kişisel Veri Koruma Kanunu (GDPR)',
    content: `
      <p>Avrupa Birliği'nde ikamet eden kullanıcılarımız için Genel Veri Koruma Tüzüğü (GDPR) geçerlidir. Hangel, GDPR kapsamındaki veri işleme faaliyetlerini yasal ilkelere uygun olarak yürütür. Veri sahibi olarak silinme, düzeltme, işlemeyi kısıtlama ve veri taşınabilirliği gibi haklarınıza saygı duyuyoruz.</p>
    `,
  },
  {
    slug: 'cerez-politikasi',
    title: 'Çerez Politikası',
    content: `
      <p>Platformumuz, kullanıcı deneyimini iyileştirmek, site trafiğini analiz etmek ve hizmetlerimizi kişiselleştirmek amacıyla çerezler (cookies) kullanmaktadır. Zorunlu çerezler, performans çerezleri ve hedefleme çerezleri hakkında detaylı bilgi almak ve tercihlerinizi yönetmek için Çerez Ayarları'nı ziyaret edebilirsiniz.</p>
    `,
  },
  {
    slug: 'sosyal-etki-politikasi',
    title: 'Sosyal Etki Politikası',
    content: `
      <p>Hangel'in varlık amacı pozitif sosyal etki yaratmaktır. Bu politika, etkimizi nasıl ölçtüğümüzü, raporladığımızı ve sürekli olarak iyileştirmeyi hedeflediğimizi açıklamaktadır. Sosyal Etki Puanı, şeffaflık endeksi ve desteklenen Sürdürülebilir Kalkınma Amaçları, bu politikanın temel bileşenleridir.</p>
    `,
  },
  {
    slug: 'acik-acik-sosyal-girisim-beyani',
    title: 'Açık Açık Sosyal Girişim Beyanı',
    content: `
      <h4>Bugünün ve Geleceğin İş Modeli: Sosyal Girişimler</h4>
      <p>Sosyal girişimler, ana amacı toplumsal ve ekolojik sorunlar olan ve bu sorunları sürdürülebilir şekilde çözmek için ekonomik faaliyetlerde bulunan yapılardır. Biz sosyal girişimlerin bugünün ve geleceğin iş modeli olduğuna inanıyor, bu nedenle Açık Açık Sosyal Girişim Platformu’nda yer alarak amacımızla, değerlerimizle, finansal yapımız, işleyişimiz ve sosyal ve/veya ekolojik etki odağımızla bir sosyal girişim olduğumuzu beyan ediyoruz.</p>

      <h4>Sosyal Girişim Beyanı*</h4>
      
      <h5>● AMAÇ</h5>
      <p>Bu sosyal girişim, toplumsal ve/veya ekolojik bir soruna çözüm üretmek amacıyla kurulmuştur. Strateji, yatırım, finansman, operasyon, üretim, iletişim süreç ve kararlarında pozitif sosyal ve/veya ekolojik etkisini maksimize etmeyi amaçlar. Kuruluş belgelerinde ve/veya kamuya açık belgelerde bu amaç açıkça belirtilir.</p>
      
      <h5>● DEĞERLER</h5>
      <p>Bu sosyal girişim;</p>
      <ul>
          <li>Ürün ve/ya hizmetlerinin üretiminden dağıtımına ve tanıtımına kadarki bütün aşamalarda doğa ve insan haklarını tanır.</li>
          <li>Fiilen veya sözlü olarak hiçbir birey veya kuruma yönelik milliyet, ırk, cinsiyet, cinsel kimlik ve yönelim, din, yaş, sosyal statü, politik yönelim veya herhangi diğer performans dışı kriter temelli ayrımcılık yapmaz.</li>
          <li>Hiçbir şiddet eylemine katılmaz; söylemleri, eylemleri ve iletişim araçları ile şiddeti desteklemez veya övmez.</li>
          <li>Çalışmalarını sürdürürken şeffaflık ve hesap verebilirlik ilkeleri doğrultusunda hak edilmeyen herhangi bir gelir, ayrıcalık, avantaj ve benzeri unsurları elde etmeye kalkışmaz; paydaşlarından etik olmayan ve hukuka aykırı taleplerde bulunmaz.</li>
          <li>Sistematik dönüşüm ve alanın dönüşümüne yönelik çoğaltmaya, iş birliğine, model ve fikir paylaşımına açıktır.</li>
      </ul>
      
      <h5>● FİNANSAL</h5>
      <p>Bu sosyal girişim;</p>
      <ul>
          <li>Ürün, hizmet ve/ya hisse satışlarından elde edilen kârın %49’undan fazlası hissedarlara dağıtmaz, sosyal etkiyi maksimize etmek için tekrar kullanır.</li>
          <li>Kredi, hibe, yatırım vb. finansal araçları, sosyal etkisini artırmak için kullanır.</li>
      </ul>

      <h5>● SOSYAL ETKİ</h5>
      <p>Bu sosyal girişim;</p>
      <ul>
          <li>Etki planını paylaşır, etkisini ölçmek için gereken çabayı gösterir.</li>
          <li>Etkiyi gösteren çıktıları kamuoyu ve ilgili paydaşlarla paylaşır.</li>
      </ul>
      
      <h5>● İŞLEYİŞ</h5>
      <p>Bu sosyal girişim,</p>
      <ul>
          <li>Ürün ve/veya hizmetlerinin üretiminden dağıtımına ve tanıtımına kadar bütün aşamalarda doğa, toplum ve insan haklarını gözetir.</li>
          <li>Ürün ve/veya hizmetlerini birlikte ürettiği çalışanlarının esenliğini gözeterek sağlıklı ve güvenli bir çalışma ortamında, adil bir ücret politikası ile çalışmalarını sağlar.</li>
          <li>Bulunduğu ürün ve/veya hizmet sektörünün ücret skalası içinde hareket eder.</li>
          <li>Yukarıda benimsediği değerler doğrultusunda kamuoyunu yanıltıcı ve aşırı tüketime yöneltici tanıtım ve iletişim faaliyetlerinde bulunmaz.</li>
      </ul>
      
      <p>Bu sosyal girişim, yukarıdaki maddelerle ilgili bir değişiklik olduğu takdirde Açık Açık’a hemen bildireceğini beyan eder.</p>
      
      <p><small>*2019 yılında Açık Açık Derneği, Ashoka Türkiye ve Türetim Ekonomisi Derneği tarafından hazırlanmıştır.</small></p>
    `,
  },
  {
    slug: 'erisilebilirlik-politikasi',
    title: 'Erişilebilirlik Politikası',
    content: `
      <h4>1. Taahhüdümüz</h4>
      <p>Hangel olarak, platformumuzu engelli bireyler de dahil olmak üzere herkes için erişilebilir ve kullanılabilir kılmayı taahhüt ediyoruz. Web İçeriği Erişilebilirlik Yönergeleri (WCAG) 2.1 AA seviyesini hedefleyerek, teknolojinin birleştirici gücünü herkesin deneyimlemesini amaçlıyoruz.</p>
      
      <h4>2. Erişilebilirlik Özelliklerimiz</h4>
      <p>Platformumuz, aşağıdaki gibi çeşitli erişilebilirlik özelliklerini desteklemektedir:</p>
      <ul>
          <li><strong>Ekran Okuyucu Desteği:</strong> Görme engelli kullanıcılar için ARIA etiketleri ve anlamsal HTML yapısı.</li>
          <li><strong>Klavye Navigasyonu:</strong> Platformun tüm işlevlerine sadece klavye kullanarak erişim imkanı.</li>
          <li><strong>Yüksek Kontrast ve Metin Boyutlandırma:</strong> Az gören kullanıcılar için daha iyi okunabilirlik sağlayan tema ve metin boyutu seçenekleri.</li>
          <li><strong>Azaltılmış Hareket:</strong> Vestibüler rahatsızlıkları olan kullanıcılar için animasyonları azaltma seçeneği.</li>
      </ul>

      <h4>3. Geri Bildirim</h4>
      <p>Erişilebilirlik konusundaki çabalarımız süreklidir. Herhangi bir erişilebilirlik engeliyle karşılaşırsanız veya iyileştirme önerileriniz varsa, lütfen <a href="/support">destek merkezimiz</a> aracılığıyla bizimle iletişime geçin. Geri bildirimleriniz, platformumuzu herkes için daha iyi bir yer haline getirmemize yardımcı olacaktır.</p>
    `,
  },
];
