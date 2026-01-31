
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
      <p>İşbu Kullanıcı Sözleşmesi ("Sözleşme"), Hangel platformu ("Platform") ile platforma üye olan gerçek veya tüzel kişi ("Kullanıcı") arasında, Kullanıcı'nın Platform'a elektronik ortamda üye olması anında düzenlenmiştir.</p>
      
      <h4>2. Tanımlar</h4>
      <p><strong>Platform:</strong> Hangel adı altında işletilen web sitesi ve mobil uygulamaları.</p>
      <p><strong>Kullanıcı:</strong> Platform'a üye olan ve sunulan hizmetlerden yararlanan her gerçek veya tüzel kişi.</p>
      <p><strong>STK:</strong> Platform'da yer alan Sivil Toplum Kuruluşları (Dernekler, Vakıflar vb.).</p>
      <p><strong>Marka:</strong> Platform üzerinden ürün veya hizmetlerini sunan ve sosyal etki sağlamayı taahhüt eden ticari işletmeler.</p>
      <p><strong>Sosyal Etki Puanı:</strong> Kullanıcıların platform üzerindeki gönüllülük, bağış ve diğer pozitif eylemleri sonucunda kazandıkları puan.</p>

      <h4>3. Sözleşmenin Konusu</h4>
      <p>İşbu Sözleşme, Kullanıcı'nın Platform üzerinden sunulan hizmetlerden yararlanma şartlarını ve tarafların hak ve yükümlülüklerini düzenlemektedir.</p>
      
      <h4>4. Hizmetler</h4>
      <p>Hangel, kullanıcıların gönüllülük faaliyetlerine katılmasına, STK'lara doğrudan veya dolaylı bağış yapmasına, sosyal etki odaklı Markalardan alışveriş yapmasına ve sosyal etkisini takip etmesine olanak tanıyan bir dijital altyapı sunar.</p>

      <h4>5. Üyelik ve Kullanım</h4>
      <p>Kullanıcı, üyelik formunu doğru ve güncel bilgilerle doldurduğunu taahhüt eder. Hesap güvenliğinin sağlanması tamamen Kullanıcı'nın sorumluluğundadır. Kullanıcı, hesabını üçüncü kişilerle paylaşamaz.</p>
      
      <h4>6. Tarafların Hak ve Yükümlülükleri</h4>
      <p><strong>6.1.</strong> Kullanıcı, Platform'u yasalara ve etik kurallara uygun olarak kullanacağını kabul eder.</p>
      <p><strong>6.2.</strong> Hangel, Platform'un kesintisiz ve hatasız çalışması için azami gayreti gösterecektir ancak teknik aksaklıklardan sorumlu tutulamaz.</p>
      <p><strong>6.3.</strong> Hangel, uygun görmediği içerikleri veya kullanıcıları Platform'dan kaldırma hakkını saklı tutar.</p>
      <p><strong>6.4.</strong> Gönüllülük faaliyetleri ve bağış süreçlerinde Kullanıcı ile ilgili STK veya Marka arasındaki ilişkiden Hangel sorumlu değildir. Hangel yalnızca bir aracı platformdur.</p>

      <h4>7. Fikri Mülkiyet</h4>
      <p>Platform'un tüm tasarımı, yazılımı, içeriği ve markası Hangel'e aittir ve izinsiz kullanılamaz.</p>

      <h4>8. Fesih</h4>
      <p>Kullanıcı, dilediği zaman hesabını silerek sözleşmeyi feshedebilir. Hangel, Kullanıcı'nın sözleşmeye aykırı davranması halinde üyeliği tek taraflı olarak sonlandırabilir.</p>

      <h4>9. Uygulanacak Hukuk ve Yetki</h4>
      <p>İşbu Sözleşme'nin yorumlanmasında ve uygulanmasında Türkiye Cumhuriyeti yasaları geçerlidir. Taraflar arasında doğabilecek her türlü uyuşmazlıkta İstanbul (Çağlayan) Mahkemeleri ve İcra Daireleri yetkilidir.</p>
    `,
  },
  {
    slug: 'kurulus-sozlesmesi',
    title: 'Kuruluş Sözleşmesi',
    content: `
      <h4>1. Taraflar</h4>
      <p>İşbu Kuruluş Sözleşmesi ("Sözleşme"), Hangel platformu ("Platform") ile platforma üye olan Sivil Toplum Kuruluşu, Marka veya Öğrenci Kulübü ("Kuruluş") arasında, Kuruluş'un Platform'a elektronik ortamda üye olması anında düzenlenmiştir.</p>
      
      <h4>2. Hizmet Kapsamı</h4>
      <p>Hangel, Kuruluş'un platform üzerinde profil oluşturmasına, gönüllülük ilanı yayınlamasına, bağış kampanyaları düzenlemesine, ürün/hizmetlerini tanıtmasına ve toplulukla etkileşim kurmasına olanak tanır.</p>
      
      <h4>3. Kuruluş'un Yükümlülükleri</h4>
      <p><strong>3.1.</strong> Kuruluş, üyelik sırasında ve sonrasında sağladığı tüm bilgilerin (yasal belgeler, raporlar, iletişim bilgileri, faaliyet alanları vb.) doğru, eksiksiz ve güncel olduğunu taahhüt eder.</p>
      <p><strong>3.2.</strong> Kuruluş, Hangel'in şeffaflık, hesap verebilirlik ve etik ilkelerine uymayı ve platformu amacı doğrultusunda kullanmayı kabul eder.</p>
      <p><strong>3.3.</strong> Kuruluş, yayınladığı içeriklerden, düzenlediği etkinliklerden ve gönüllülerle olan ilişkisinden bizzat sorumludur.</p>
      <p><strong>3.4.</strong> Markalar, taahhüt ettikleri bağış oranlarını ve koşullarını şeffaf bir şekilde belirtmek ve bu taahhütlerini yerine getirmekle yükümlüdür.</p>

      <h4>4. Şeffaflık ve Raporlama</h4>
      <p>Kuruluş, Hangel tarafından belirlenen şeffaflık kriterlerini karşılamak için gerekli bilgi ve belgeleri sağlamayı kabul eder. Hangel, bu kriterlere göre Kuruluş'a bir "Şeffaflık Puanı" atayabilir ve bunu platformda yayınlayabilir.</p>
      
      <h4>5. Bağışların Aktarımı</h4>
      <p>Platform üzerinden Kuruluş adına toplanan bağışlar, Hangel'in Ücret Politikası'nda belirtilen hizmet bedeli ve yasal kesintiler düşüldükten sonra, belirlenen periyotlarla Kuruluş'un bildirdiği banka hesabına aktarılır.</p>
      
      <h4>6. Fesih</h4>
      <p>Kuruluş, dilediği zaman hesabını kapatma talebinde bulunabilir. Hangel, Kuruluş'un sözleşmeye, yasalara veya etik ilkelere aykırı hareket etmesi durumunda üyeliği tek taraflı olarak ve derhal feshetme hakkını saklı tutar.</p>
    `,
  },
  {
    slug: 'gonulluluk-sozlesmesi',
    title: 'Gönüllülük Sözleşmesi',
    content: `
      <h4>1. Kapsam</h4>
      <p>İşbu Gönüllülük Sözleşmesi, Hangel platformu aracılığıyla bir gönüllülük faaliyetine başvuran Kullanıcı ("Gönüllü") ile ilanı yayınlayan Kuruluş ("Ev Sahibi Kuruluş") arasındaki ilişkiyi ve her iki tarafın beklenti, hak ve sorumluluklarını düzenler. Hangel, bu ilişkide sadece aracı bir platform olup, sözleşmenin tarafı değildir.</p>
      
      <h4>2. Gönüllülük Esası</h4>
      <p>Gönüllülük faaliyeti, taraflar arasında herhangi bir ücret, maaş, kâr veya benzeri bir maddi menfaat beklentisi olmaksızın, tamamen toplumsal fayda ve kişisel gelişim amacıyla gerçekleştirilir. Bu faaliyet, bir iş sözleşmesi niteliği taşımaz ve İş Kanunu kapsamında değerlendirilmez.</p>
      
      <h4>3. Gönüllü'nün Hak ve Sorumlulukları</h4>
      <p><strong>3.1.</strong> Gönüllü, başvurduğu faaliyetin tanımında belirtilen görevleri, Ev Sahibi Kuruluş'un yönlendirmeleri ve etik kuralları çerçevesinde, kendi beceri ve imkanları dahilinde özenle yerine getirmeyi kabul eder.</p>
      <p><strong>3.2.</strong> Gönüllü, faaliyet süresince Ev Sahibi Kuruluş'un çalışma ortamına, kurallarına ve güvenlik prosedürlerine uymakla yükümlüdür.</p>
      <p><strong>3.3.</strong> Gönüllü, faaliyet sırasında edindiği ve gizli olarak nitelendirilen bilgileri (kişisel veriler, kurumsal sırlar vb.) üçüncü kişilerle paylaşamaz.</p>
      <p><strong>3.4.</strong> Gönüllü, faaliyete katılımını engelleyecek bir durum ortaya çıktığında bunu makul bir süre öncesinde Ev Sahibi Kuruluş'a bildirmelidir.</p>
      
      <h4>4. Ev Sahibi Kuruluş'un Hak ve Sorumlulukları</h4>
      <p><strong>4.1.</strong> Ev Sahibi Kuruluş, gönüllü için güvenli, sağlıklı ve ayrımcılıktan uzak bir faaliyet ortamı sağlamakla yükümlüdür.</p>
      <p><strong>4.2.</strong> Kuruluş, faaliyetin tanımında belirtilen görev, sorumluluk ve (varsa) sağlanacak imkanlar (yol, yemek, konaklama vb.) konusunda şeffaf ve doğru bilgi vermekle mükelleftir.</p>
      <p><strong>4.3.</strong> Kuruluş, Gönüllü'ye faaliyetin gerektirdiği oryantasyon, eğitim ve yönlendirmeyi sağlamalıdır.</p>
      <p><strong>4.4.</strong> Kuruluş, gönüllünün emeğine, zamanına ve kişisel haklarına saygı göstermelidir.</p>
      
      <h4>5. Gönüllülük Faaliyetinin Sona Ermesi</h4>
      <p>Taraflardan herhangi biri, karşı tarafa makul bir bildirim süresi tanıyarak gönüllülük ilişkisini sonlandırabilir. Gönüllünün, kuruluşun temel kurallarına veya yasalara aykırı hareket etmesi durumunda, Ev Sahibi Kuruluş gönüllülük faaliyetini derhal sonlandırabilir.</p>
    `,
  },
  {
    slug: 'gizlilik-politikasi',
    title: 'Gizlilik Politikası',
    content: `
      <h4>1. Veri Sorumlusu</h4>
      <p>Hangel, kullanıcılarımızın kişisel verilerinin 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") ve ilgili diğer mevzuatlara uygun olarak işlenmesinde veri sorumlusu sıfatıyla hareket etmektedir.</p>
      
      <h4>2. İşlenen Kişisel Veriler ve İşleme Amaçları</h4>
      <p>Platformumuza üye olurken ve platformu kullanırken sağladığınız kimlik (ad, soyad), iletişim (e-posta, telefon), profesyonel ve gönüllülük deneyimi gibi verileriniz aşağıdaki amaçlarla işlenmektedir:</p>
      <ul>
        <li>Üyelik işlemlerinin gerçekleştirilmesi ve hesap yönetimi.</li>
        <li>Platform hizmetlerinin (gönüllülük, bağış, alışveriş vb.) sunulması.</li>
        <li>Size uygun gönüllülük ve içerik önerileri sunarak kullanıcı deneyiminin kişiselleştirilmesi.</li>
        <li>İşlem güvenliğinin sağlanması ve sahtekarlığın önlenmesi.</li>
        <li>Yasal yükümlülüklerin yerine getirilmesi ve yetkili kurumlarla bilgi paylaşımı.</li>
        <li>Hizmet kalitesini artırmak için anonim istatistiksel çalışmalar yapılması.</li>
      </ul>
      
      <h4>3. Veri Paylaşımı</h4>
      <p>Kişisel verileriniz, yasal zorunluluklar veya açık rızanız olmaksızın üçüncü taraflarla paylaşılmaz. Ancak, aşağıdaki durumlarda veri paylaşımı yapılabilir:</p>
      <ul>
        <li><strong>Gönüllülük Başvuruları:</strong> Gönüllülük faaliyetine başvurduğunuzda, profilinizde yer alan ilgili bilgileriniz (iletişim bilgileri hariç olmak üzere, yetkinlikleriniz, deneyimleriniz vb.) başvuruyu değerlendirmesi için ilgili STK veya Kuruluş ile paylaşılır.</li>
        <li><strong>Bağış İşlemleri:</strong> Bağış yaptığınızda, işlemin teyidi için gerekli bilgiler ilgili STK ve ödeme hizmeti sağlayıcısı ile paylaşılır.</li>
        <li><strong>Yasal Yükümlülükler:</strong> Mahkeme kararları veya yasal talepler doğrultusunda yetkili kamu kurum ve kuruluşları ile.</li>
      </ul>
      
      <h4>4. Veri Saklama Süreleri</h4>
      <p>Kişisel verileriniz, üyeliğiniz devam ettiği sürece ve üyeliğiniz sona erdikten sonra yasal saklama süreleri boyunca saklanır. Bu sürelerin sonunda verileriniz güvenli bir şekilde silinir, yok edilir veya anonim hale getirilir.</p>
      
      <h4>5. Kullanıcı Hakları</h4>
      <p>KVKK'nın 11. maddesi uyarınca, kişisel verilerinizle ilgili olarak; veri işlenip işlenmediğini öğrenme, işlenmişse bilgi talep etme, işlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme, yurt içinde veya yurt dışında verilerin aktarıldığı üçüncü kişileri bilme, verilerin eksik veya yanlış işlenmişse düzeltilmesini isteme, silinmesini veya yok edilmesini isteme gibi haklara sahipsiniz. Bu haklarınızı kullanmak için destek@hangel.com adresi üzerinden bizimle iletişime geçebilirsiniz.</p>
      
      <h4>6. Veri Güvenliği</h4>
      <p>Verilerinin güvenliğini sağlamak için gerekli teknik ve idari tedbirleri (şifreleme, erişim kontrolleri, güvenlik duvarları vb.) almaktayız.</p>
    `,
  },
    {
    slug: 'bilgilendirme-politikasi',
    title: 'Bilgilendirme Politikası',
    content: `
      <h4>1. Amaç</h4>
      <p>Bu politika, Hangel'in tüm paydaşlarını (kullanıcılar, STK'lar, markalar, kamuoyu) platformun işleyişi, sosyal etki faaliyetleri, finansal yapısı ve önemli gelişmeler hakkında düzenli, doğru ve şeffaf bir şekilde nasıl bilgilendirdiğini açıklar.</p>

      <h4>2. Bilgilendirme Kanalları</h4>
      <p>Hangel, bilgilendirmeleri aşağıdaki kanallar aracılığıyla yapar:</p>
      <ul>
          <li>Platform içi duyurular ve bildirimler.</li>
          <li>Kullanıcıların kayıtlı e-posta adreslerine gönderilen bültenler ve raporlar.</li>
          <li>Hangel'in resmi web sitesi ve blogu.</li>
          <li>Sosyal medya hesapları (Twitter, LinkedIn, Instagram vb.).</li>
          <li>Yıllık olarak yayınlanan Sosyal Etki Raporları.</li>
      </ul>
      
      <h4>3. Paydaşlara Yönelik Bilgilendirme</h4>
      <p><strong>Kullanıcılar:</strong> Kullanıcı sözleşmesi, gizlilik politikası gibi temel belgelerdeki değişiklikler, yeni özellikler, önemli kampanyalar ve kişisel verilerini etkileyen durumlar hakkında bilgilendirilir.</p>
      <p><strong>STK'lar ve Markalar:</strong> İşbirliği koşullarındaki değişiklikler, yeni araçlar, raporlama süreçleri ve platform genelindeki önemli güncellemeler hakkında bilgilendirilir.</p>
      <p><strong>Kamuoyu:</strong> Hangel'in genel ilerlemesi, ulaştığı sosyal etki ve finansal şeffaflığı ile ilgili bilgiler düzenli olarak kamuoyu ile paylaşılır.</p>
      
      <h4>4. Güncellemeler</h4>
      <p>Bu politika dahil olmak üzere tüm politikalarımız, yasal düzenlemeler ve operasyonel ihtiyaçlar doğrultusunda güncellenebilir. Önemli değişiklikler, yürürlüğe gmeden önce ilgili paydaşlara makul bir süre öncesinde duyurulur.</p>
    `,
  },
  {
    slug: 'bagis-ve-yardim-politikasi',
    title: 'Bağış ve Yardım Politikası',
    content: `
      <h4>1. Bağış Yöntemleri</h4>
      <p>Kullanıcılar, Hangel platformu üzerinden aşağıdaki yöntemlerle bağış yapabilirler:</p>
      <ul>
          <li><strong>Dolaylı Bağış:</strong> Anlaşmalı markalardan alışveriş yaparak, alışveriş tutarının marka tarafından taahhüt edilen bir kısmının kullanıcının seçtiği bir STK'ya aktarılması.</li>
          <li><strong>Doğrudan Bağış:</strong> (Yakında) Platform üzerinden doğrudan bir STK'ya veya bir kampanyaya kredi kartı veya diğer ödeme yöntemleriyle bağış yapılması.</li>
          <li><strong>QR Kod ile Bağış:</strong> (Yakında) Fiziksel mekanlarda veya dijital ortamlarda bulunan STK'ya özel QR kodları okutarak bağış yapılması.</li>
      </ul>

      <h4>2. Bağışların Aktarımı ve Kesintiler</h4>
      <p><strong>2.1.</strong> Dolaylı bağışlarda, markalar tarafından Hangel'e aktarılan bağış tutarları, yasal vergiler ve Hangel'in Ücret Politikası'nda belirtilen hizmet bedeli düşüldükten sonra, aylık periyotlarla ilgili STK'ların banka hesaplarına aktarılır.</p>
      <p><strong>2.2.</strong> Hangel hizmet bedeli, platformun teknolojik altyapısının sürdürülmesi, geliştirilmesi, güvenliğinin sağlanması ve operasyonel giderlerin karşılanması amacıyla alınmaktadır. Bu oran, STK'ya aktarılan net bağış tutarı üzerinden %10 olarak hesaplanır.</p>
      <p><strong>2.3.</strong> Tüm kesintiler (vergi, hizmet bedeli) kullanıcının işlem detaylarında şeffaf bir şekilde gösterilir.</p>

      <h4>3. Şeffaflık ve Raporlama</h4>
      <p>Kullanıcılar, "Bağışlarım" sayfasından yaptıkları tüm alışverişlerin ve bu alışverişlerden doğan bağış tutarlarının detaylarını, hangi STK'ya ne kadar bağış yapıldığını ve kesinti dökümlerini takip edebilirler. STK'lar da kendi panellerinden kendilerine yapılan bağışları ve kaynaklarını detaylı olarak raporlayabilirler.</p>

      <h4>4. İade Politikası</h4>
      <p>Kullanıcının anlaşmalı markadan yaptığı alışverişi iade etmesi durumunda, o alışverişten doğacak olan bağış tutarı iptal edilir. Süreç, markanın iade politikası ve Hangel ile olan mutabakatına göre işler.</p>
    `,
  },
  {
    slug: 'kar-dagitim-politikasi',
    title: 'Kâr Dağıtım Politikası',
    content: `
      <h4>1. Sosyal Girişim Modeli</h4>
      <p>Hangel, kâr amacı güden bir şirket değil, finansal sürdürülebilirliğini sağlayarak toplumsal faydayı maksimize etmeyi hedefleyen bir sosyal girişimdir. Bu doğrultuda, ana motivasyonumuz finansal kâr elde etmek değil, sağladığımız sosyal ve çevresel etkiyi artırmaktır.</p>

      <h4>2. Gelirlerin Kullanımı</h4>
      <p>Platformun operasyonel faaliyetlerinden (marka işbirlikleri, işlem ücretleri vb.) elde edilen gelirler, öncelikli olarak aşağıdaki kalemler için kullanılır:</p>
      <ul>
          <li>Platformun teknolojik altyapısının bakımı, geliştirilmesi ve güvenliğinin sağlanması.</li>
          <li>Çalışan maaşları ve operasyonel giderler.</li>
          <li>Pazarlama ve topluluk büyütme faaliyetleri.</li>
          <li>Yasal ve finansal yükümlülükler (vergiler vb.).</li>
      </ul>

      <h4>3. Kârın Yeniden Yatırımı (Kâr Kilidi)</h4>
      <p>Hangel, "kâr kilidi" (asset lock) prensibini benimser. Bu, tüm operasyonel giderler ve yasal yükümlülükler karşılandıktan sonra ortaya çıkabilecek herhangi bir gelir fazlasının (kârın), hissedarlara dağıtılmayacağı anlamına gelir. Bunun yerine, elde edilen kârın tamamı, misyonumuz doğrultusunda sosyal etkiyi artırmak amacıyla tekrar platforma ve yeni sosyal fayda projelerine yatırılır. Bu, Açık Açık Sosyal Girişim Beyanı'nda taahhüt ettiğimiz "kârın %51'inden fazlasının misyona yeniden yatırılması" ilkesinin daha da ilerisinde bir uygulamadır.</p>

      <h4>4. Şeffaflık</h4>
      <p>Hangel'in gelir ve gider yapısı, yıllık olarak yayınlanacak olan Sosyal Etki ve Şeffaflık Raporları'nda kamuoyu ile şeffaf bir şekilde paylaşılacaktır.</p>
    `,
  },
   {
    slug: 'ucret-politikasi',
    title: 'Ücret Politikamız',
    content: `
      <h4>1. Gelir Modelimiz</h4>
      <p>Hangel, bir sosyal girişim olarak, platformun sürdürülebilirliğini sağlamak ve sosyal etkisini artırmak amacıyla şeffaf bir gelir modeline sahiptir. Gelirlerimiz, kullanıcılarımızdan herhangi bir ek ücret talep etmeden, işbirlikleri ve sağlanan hizmetler üzerinden elde edilir.</p>
      
      <h4>2. Marka İşbirliği Ücretleri</h4>
      <p>Platformda yer alan markalar, kullanıcıların yaptığı alışverişler üzerinden oluşan bağış tutarları üzerinden bir hizmet bedeli öderler. Bu model, markaların sosyal sorumluluk bütçelerini etkili bir şekilde kullanmalarını sağlar.</p>
      
      <h4>3. "hangel Katkı Payı" (İşlem Ücreti)</h4>
      <p>Kullanıcıların alışverişleri yoluyla STK'lara aktarılan bağışların operasyonel ve teknik süreçlerini yönetmek için bir hizmet bedeli uygulanır. Bu bedel, "hangel Katkı Payı" olarak adlandırılır ve şu şekilde işler:</p>
      <ul>
          <li>Markanın taahhüt ettiği bağış tutarından öncelikle ilgili yasal vergiler (%20 Gelir Vergisi Stopajı gibi) düşülür.</li>
          <li>Vergi sonrası kalan net tutar üzerinden, STK payı ve hangel Katkı Payı ayrılır.</li>
          <li><strong>hangel Katkı Payı, STK'ya aktarılacak olan net payın %10'u olarak hesaplanır.</strong></li>
          <li>Örneğin, 10 TL'lik bir bağış tutarı için; vergiler düşüldükten sonra kalan tutar üzerinden STK'ya 8.18 TL aktarılırken, bu tutarın %10'u olan 0.82 TL, hangel Katkı Payı olarak platformun sürdürülebilirliği için kullanılır. (Rakamlar örnek teşkil etmektedir.)</li>
      </ul>
      
      <h4>4. Şeffaflık</h4>
      <p>Kullanıcılar, yaptıkları her bağış işleminin detayında tüm vergi ve hizmet bedeli kesintilerini şeffaf bir şekilde görebilirler. Amacımız, bağış yolculuğunun her adımında tam bir şeffaflık sağlamaktır.</p>
    `,
  },
  {
    slug: 'sosyal-etki-politikasi',
    title: 'Sosyal Etki Politikası',
    content: `
      <h4>1. Amaç</h4>
      <p>Hangel'in varlık amacı, teknoloji aracılığıyla ölçülebilir ve sürdürülebilir pozitif sosyal etki oluşturmaktır. Bu politika, etkimizi nasıl tanımladığımızı, ölçtüğümüzü, raporladığımızı ve sürekli olarak iyileştirmeyi hedeflediğimizi açıklamaktadır.</p>

      <h4>2. Etki Alanlarımız</h4>
      <p>Sağladığımız etkiyi temel olarak üç alanda yoğunlaştırıyoruz:</p>
      <ul>
        <li><strong>Bireysel Etki:</strong> Kullanıcıların gönüllülük ve bilinçli tüketim yoluyla topluma katkıda bulunmalarını ve kişisel tatmin elde etmelerini sağlamak.</li>
        <li><strong>Kurumsal Etki:</strong> STK'ların dijitalleşmesine, kaynak geliştirmesine ve kapasitelerini artırmasına; markaların ise sosyal sorumluluk faaliyetlerini etkili bir şekilde yürütmesine yardımcı olmak.</li>
        <li><strong>Toplumsal Etki:</strong> Gönüllülük ve sosyal sorumluluk kültürünü yaygınlaştırmak, sivil toplumun güçlenmesine katkıda bulunmak ve BM Sürdürülebilir Kalkınma Amaçları'na destek olmak.</li>
      </ul>
      
      <h4>3. Etki Ölçümü ve Raporlama</h4>
      <p>Etkimizi somutlaştırmak için çeşitli metrikler kullanırız:</p>
      <ul>
        <li><strong>Sosyal Etki Puanı:</strong> Kullanıcıların platformdaki her olumlu eylemini (gönüllülük saati, yapılan bağış miktarı vb.) puanlandıran ve oyunlaştıran bir sistemdir.</li>
        <li><strong>STK Şeffaflık Endeksi:</strong> STK'ları şeffaflık ve hesap verebilirlik kriterlerine göre değerlendiren bir puanlama sistemidir.</li>
        <li><strong>Kantitatif Metrikler:</strong> Aktarılan toplam bağış tutarı, tamamlanan gönüllülük saati, ulaşılan insan sayısı, desteklenen proje sayısı gibi veriler düzenli olarak takip edilir.</li>
        <li><strong>Kalitatif Metrikler:</strong> Paydaşlarla yapılan anketler ve görüşmeler yoluyla elde edilen geri bildirimler ve başarı hikayeleri.</li>
      </ul>
      <p>Bu veriler, yıllık olarak yayınlanan "Hangel Sosyal Etki Raporu" ile kamuoyuyla şeffaf bir şekilde paylaşılır.</p>
      
      <h4>4. Sürekli İyileştirme</h4>
      <p>Topladığımız verileri ve geri bildirimleri, stratejilerimizi gözden geçirmek, hizmetlerimizi iyileştirmek ve oluşturduğumuz sosyal etkiyi sürekli olarak artırmak için kullanırız.</p>
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
      <p>Daha fazla bilgi için <a href="https://www.acikacik.org/" target="_blank" rel="noopener noreferrer">Açık Açık web sitesini</a> ziyaret edebilirsiniz.</p>
    `,
  },
  {
    slug: 'gonullu-haklari-beyannamesi',
    title: 'Gönüllü Hakları ve Sorumlulukları Beyannamesi',
    content: `
      <h4>Giriş</h4>
      <p>Gönüllülük, bireyin kendi özgür iradesiyle, maddi bir karşılık beklemeden, toplumsal fayda amacıyla bir sivil toplum kuruluşunun (STK) faaliyetlerine katılmasıdır. Bu süreç, hem gönüllüye hem de STK'ya karşılıklı fayda sağlayan bir ortaklıktır. Bu beyanname, bu ortaklığın sağlıklı ve verimli bir şekilde yürütülmesi için gönüllülerin sahip olduğu hakları ve üstlendiği sorumlulukları tanımlar.</p>
      
      <h4>Gönüllünün Hakları</h4>
      <ol>
        <li><strong>Bilgilendirilme Hakkı:</strong> Gönüllü, çalıştığı STK'nın misyonunu, vizyonunu, faaliyetlerini ve gönüllüden beklentilerini açıkça bilme hakkına sahiptir.</li>
        <li><strong>Görev Tanımı Hakkı:</strong> Gönüllüye, yapacağı işin tanımı, süresi, sorumlulukları ve kiminle çalışacağı hakkında net bilgi verilmelidir.</li>
        <li><strong>Oryantasyon ve Eğitim Hakkı:</strong> Görevini daha iyi yapabilmesi için gerekli oryantasyon ve eğitim desteğini alma hakkına sahiptir.</li>
        <li><strong>Saygı Görme Hakkı:</strong> Gönüllü, fikirlerine, inançlarına ve kişiliğine saygı duyulan, ayrımcılıktan uzak, adil bir ortamda faaliyet gösterme hakkına sahiptir.</li>
        <li><strong>Güvenli Ortam Hakkı:</strong> Faaliyetlerini sağlıklı ve güvenli bir ortamda yürütme ve olası risklere karşı bilgilendirilme hakkına sahiptir.</li>
        <li><strong>Yönlendirilme ve Destek Alma Hakkı:</strong> Faaliyet süresince bir sorumlu tarafından yönlendirilme, denetlenme ve ihtiyaç duyduğunda destek alma hakkına sahiptir.</li>
        <li><strong>Takdir Edilme Hakkı:</strong> Yaptığı katkılardan dolayı manevi olarak takdir edilme ve çabalarının değerli olduğunun hissettirilmesi hakkına sahiptir.</li>
        <li><strong>Geri Bildirim Hakkı:</strong> Hem performansı hakkında yapıcı geri bildirim alma hem de gönüllülük süreciyle ilgili görüş ve önerilerini sunma hakkına sahiptir.</li>
        <li><strong>Ayrılma Hakkı:</strong> Makul bir bildirim süresine uyarak gönüllülük faaliyetini sonlandırma hakkına sahiptir.</li>
      </ol>

      <h4>Gönüllünün Sorumlulukları</h4>
      <ol>
        <li><strong>Taahhütlere Bağlılık:</strong> Üstlendiği görevi, belirlenen süre ve standartlarda, zamanında ve eksiksiz bir şekilde yerine getirmekle sorumludur.</li>
        <li><strong>Kurum Kurallarına Uyum:</strong> Faaliyet gösterdiği STK'nın politika, prosedür ve etik ilkelerine uymakla sorumludur.</li>
        <li><strong>Gizliliğe Saygı:</strong> Faaliyet sırasında edindiği, STK'ya veya faydalanıcılara ait özel ve gizli bilgileri korumak ve üçüncü kişilerle paylaşmamakla sorumludur.</li>
        <li><strong>Profesyonellik ve Temsiliyet:</strong> STK'yı temsil ettiğinin bilinciyle, faaliyetler sırasında ve dışında kurumun itibarına zarar verecek davranışlardan kaçınmakla sorumludur.</li>
        <li><strong>Ekip Çalışması:</strong> Diğer gönüllüler, çalışanlar ve faydalanıcılarla saygı ve işbirliği içinde çalışmakla sorumludur.</li>
        <li><strong>Güvenilirlik:</strong> Devamlılığını veya katılımını etkileyecek durumları (hastalık, özel işler vb.) ilgili sorumluya zamanında bildirmekle sorumludur.</li>
        <li><strong>Kaynakları Özenli Kullanma:</strong> STK tarafından kendisine emanet edilen kaynakları (malzeme, ekipman, para vb.) özenle ve sadece faaliyetin amacı doğrultusunda kullanmakle sorumludur.</li>
      </ol>
    `
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
          <li><strong>Renk Körlüğü Filtreleri:</strong> Protanopia, Deuteranopia, Tritanopia gibi farklı renk körlüğü türlerine yönelik filtreleme seçenekleri.</li>
          <li><strong>Disleksi Dostu Yazı Tipi:</strong> Okuma güçlüğü çeken kullanıcılar için özel olarak tasarlanmış bir yazı tipi seçeneği.</li>
          <li><strong>Azaltılmış Hareket:</strong> Vestibüler rahatsızlıkları olan kullanıcılar için animasyonları ve geçiş efektlerini azaltma seçeneği.</li>
      </ul>

      <h4>3. Sürekli Gelişim</h4>
      <p>Erişilebilirlik, tek seferlik bir proje değil, sürekli bir süreçtir. Platformumuza yeni özellikler ekledikçe ve teknolojiyi güncelledikçe erişilebilirlik standartlarını gözetmeye devam edeceğiz.</p>

      <h4>4. Geri Bildirim</h4>
      <p>Erişilebilirlik konusundaki çabalarımız süreklidir. Herhangi bir erişilebilirlik engeliyle karşılaşırsanız veya iyileştirme önerileriniz varsa, lütfen <a href="/support">destek merkezimiz</a> aracılığıyla bizimle iletişime geçin. Geri bildirimleriniz, platformumuzu herkes için daha iyi bir yer haline getirmemize yardımcı olacaktır.</p>
    `,
  },
  {
    slug: 'bagisci-haklari-beyannamesi',
    title: 'Bağışçı Hakları Beyannamesi',
    content: `
      <p>Filantropi (karşılıksız yardımseverlik), toplumun gelişimi için gönüllü eyleme dayanır. Bağışçılık, bu gönüllü eylemin en temel biçimlerinden biridir. Bağışçıların ve potansiyel bağışçıların, destekledikleri sivil toplum kuruluşlarına (STK) tam güven duymalarını sağlamak amacıyla, tüm bağışçıların aşağıdaki haklara sahip olduğunu beyan ederiz:</p>
      <ol>
        <li>Kuruluşun misyonunu, bu misyonu gerçekleştirmek için kaynaklarını nasıl kullanmayı planladığını ve misyonunu yerine getirme kapasitesini bilme hakkı.</li>
        <li>Kuruluşun yönetim kurulunda kimlerin görev yaptığını bilme ve yöneticilerin kendi sorumluluklarını basiretli bir şekilde yerine getirmesini bekleme hakkı.</li>
        <li>Kuruluşun en güncel finansal tablolarına erişim hakkı.</li>
        <li>Yaptığı bağışın, belirtilen amaçlar doğrultusunda kullanılacağından emin olma hakkı.</li>
        <li>Uygun bir şekilde tanınma ve takdir edilme hakkı.</li>
        <li>Bağışıyla ilgili bilgilerin, yasaların gerektirdiği durumlar dışında, saygı ve gizlilik çerçevesinde ele alınacağından emin olma hakkı.</li>
        <li>Kuruluşu temsil eden tüm bireylerle olan ilişkilerinin profesyonel bir doğa taşımasını bekleme hakkı.</li>
        <li>Bağış talebinde bulunanların gönüllü mü, çalışan mı yoksa ücretli bir danışman mı olduğunu bilme hakkı.</li>
        <li>Kuruluşun posta veya e-posta listelerinden isminin çıkarılmasını isteme fırsatına sahip olma hakkı.</li>
        <li>Bağış yaparken soru sormakta özgür hissetme ve anında, doğru ve açık cevaplar alma hakkı.</li>
      </ol>
      <p><small><i>Bu beyanname, uluslararası kabul görmüş "A Donor Bill of Rights" metninden uyarlanmıştır. Orijinal metin, Association of Fundraising Professionals (AFP), Association for Healthcare Philanthropy (AHP), Council for Advancement and Support of Education (CASE) ve Giving Institute tarafından oluşturulmuş ve geliştirilmiştir.</i></small></p>
    `
  }
];
