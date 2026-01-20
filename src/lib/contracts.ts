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
    slug: 'gelir-fazlasi-dagitim-politikasi',
    title: 'Gelir Fazlası Dağıtım Politikası',
    content: `
      <p>Bir sosyal girişim olarak Hangel, elde ettiği gelirin yasal olarak belirlenmiş bir kısmını tekrar sosyal etki yaratmak amacıyla kullanmayı taahhüt eder. Bu politika, operasyonel giderler sonrası oluşan gelir fazlasının hangi kriterlere göre hangi sosyal fayda alanlarına ve projelere aktarılacağını şeffaf bir şekilde düzenler.</p>
    `,
  },
  {
    slug: 'acik-acik-sosyal-girisim-beyani',
    title: 'Açık Açık Sosyal Girişim Beyanı',
    content: `
      <p>Biz, Hangel olarak, toplumsal veya çevresel bir soruna yenilikçi ve sürdürülebilir çözümler üretmek amacıyla kurulmuş bir sosyal girişim olduğumuzu beyan ederiz.</p>
      <p>Temel amacımız, kârı maksimize etmek değil, yarattığımız pozitif sosyal etkiyi en üst düzeye çıkarmaktır. Bu doğrultuda, ticari faaliyetlerimizden elde ettiğimiz geliri, misyonumuzu gerçekleştirmek ve etki alanımızı genişletmek için tekrar kullanırız.</p>
      <p>Faaliyetlerimizde şeffaflık, hesap verebilirlik ve paydaş katılımını temel ilkeler olarak benimseriz. Etkimizi düzenli olarak ölçer, raporlar ve kamuoyu ile paylaşırız.</p>
      <p>Açık Açık Platformu'nun bir parçası olarak, sosyal girişimcilik ekosisteminin güçlenmesine ve sosyal fayda odaklı bir ekonominin gelişmesine katkıda bulunmayı hedefleriz.</p>
    `,
  },
];
