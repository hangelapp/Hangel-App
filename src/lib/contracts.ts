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

<p>İşbu Kullanıcı Sözleşmesi (bundan sonra "Sözleşme" olarak anılacaktır), hangel platformuna üye olan ya da platformu herhangi bir şekilde kullanan gerçek kişi kullanıcılar ile platformu işleten <strong>hangel AŞ</strong> arasındaki hukuki ilişkinin esaslarını düzenler. Platforma üye olmakla veya platformu kullanmakla, kullanıcı işbu Sözleşme'nin tüm hükümlerini okuduğunu, anladığını ve kabul ettiğini beyan eder.</p>

<h4>1. Taraflar ve Tanımlar</h4>
<p>İşbu Sözleşme, bir tarafta merkezi Türkiye'de bulunan ve hangel platformunu işleten <strong>hangel AŞ</strong> ("hangel", "platform" veya "İşletmeci") ile diğer tarafta platforma kayıt olan veya platformu kullanan gerçek kişi ("Kullanıcı") arasında akdedilmiştir. Aşağıdaki tanımlar Sözleşme genelinde geçerlidir:</p>
<table class="w-full border-collapse border border-gray-200 my-4">
<thead>
<tr>
<th class="border border-gray-200 p-2 text-left text-sm">Terim</th>
<th class="border border-gray-200 p-2 text-left text-sm">Tanım</th>
</tr>
</thead>
<tbody>
<tr>
<td class="border border-gray-200 p-2 text-sm">Platform</td>
<td class="border border-gray-200 p-2 text-sm">hangel'in web ve mobil uygulamaları aracılığıyla sunduğu toplumsal etki hizmetlerinin bütünü.</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Hizmet</td>
<td class="border border-gray-200 p-2 text-sm">Acil kan talebi/eşleştirme, bağış aktarımı, gönüllülük ilanları, STK/dernek/vakıf profilleri ve etki raporlaması dahil platform fonksiyonları.</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Kullanıcı</td>
<td class="border border-gray-200 p-2 text-sm">Platforma üye olan veya platformu kullanan, on sekiz yaşını doldurmuş gerçek kişi.</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">İçerik</td>
<td class="border border-gray-200 p-2 text-sm">Kullanıcı tarafından platforma yüklenen veya platformda yer alan her türlü metin, görsel, ilan ve veri.</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">KVKK</td>
<td class="border border-gray-200 p-2 text-sm">6698 sayılı Kişisel Verilerin Korunması Kanunu.</td>
</tr>
</tbody>
</table>

<h4>2. Sözleşmenin Konusu ve Kapsamı</h4>
<p>İşbu Sözleşme'nin konusu, hangel platformu üzerinden sunulan hizmetlerin kullanım koşullarının, tarafların karşılıklı hak ve yükümlülüklerinin ve platformun işleyiş esaslarının belirlenmesidir. Sözleşme, 6098 sayılı Türk Borçlar Kanunu, 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve ilgili Mesafeli Sözleşmeler Yönetmeliği, 6563 sayılı Elektronik Ticaretin Düzenlenmesi Hakkında Kanun, 5651 sayılı İnternet Ortamında Yapılan Yayınların Düzenlenmesi Hakkında Kanun ve 6698 sayılı KVKK hükümlerine uygun olarak hazırlanmıştır.</p>
<p>hangel tarafından önceden hazırlanan ve çok sayıda kullanıcıya aynı şekilde sunulan işbu Sözleşme hükümleri, 6098 sayılı Türk Borçlar Kanunu'nun 20 ila 25. maddeleri anlamında <strong>genel işlem koşulu</strong> niteliği taşır. Bu çerçevede dürüstlük kurallarına aykırı olarak kullanıcı aleyhine veya onun durumunu ağırlaştırıcı nitelikte hükümler konulamaz (TBK m.25); aksi yöndeki kayıtlar ilgili mevzuat ve TBK m.20-25 uyarınca yazılmamış sayılır veya içerik denetimine tabi tutulur. Kullanıcının menfaatine aykırı koşullar, ancak kullanıcının bunların varlığı ve içeriği hakkında bilgilendirilmesi ve kabul etmesi halinde Sözleşme kapsamına girer.</p>

<h4>3. Hizmet Tanımı ve Üyelik Koşulları</h4>
<p>hangel, bir <strong>aracılık ve eşleştirme platformu</strong> olarak faaliyet gösterir. Sunulan başlıca hizmetler şunlardır:</p>
<ul>
<li><strong>Acil kan talebi ve eşleştirme:</strong> Kan ihtiyacı bulunan kişi/kurumlar ile uygun kan grubuna sahip gönüllü bağışçı adaylarının iletişiminin kolaylaştırılması. hangel bu süreçte yalnızca <em>bilgi aracılığı</em> yapar; kan bağışı, toplanması, test edilmesi ve transfüzyonu yetkili sağlık kuruluşları tarafından yürütülür.</li>
<li><strong>Bağış aktarımı:</strong> Bireysel ve kurumsal bağışların doğrulanmış STK, dernek ve vakıf profillerine yönlendirilmesi.</li>
<li><strong>Gönüllülük ilanları:</strong> Gönüllü arayan kuruluşlar ile gönüllüler arasında eşleştirme.</li>
<li><strong>Etki ve şeffaflık raporlaması.</strong></li>
</ul>
<p>Üyelik için kullanıcının on sekiz yaşını doldurmuş, fiil ehliyetine sahip olması ve kayıt sırasında doğru, güncel ve eksiksiz bilgi vermesi gerekir. Kullanıcı, hesap güvenliğinden ve hesabı üzerinden yapılan işlemlerden bizzat sorumludur.</p>

<h4>4. Tarafların Hak ve Yükümlülükleri</h4>
<p><strong>Kullanıcının yükümlülükleri:</strong></p>
<ul>
<li>Platformu yürürlükteki mevzuata, genel ahlaka ve işbu Sözleşme'ye uygun kullanmak.</li>
<li>Doğru ve güncel bilgi sağlamak; özellikle acil kan talebi ve sağlık verisi paylaşımında yanıltıcı bilgi vermemek.</li>
<li>Üçüncü kişilerin haklarını, kişisel verilerini ve fikri mülkiyet haklarını ihlal etmemek.</li>
<li>5651 sayılı Kanun kapsamında hukuka aykırı içerik üretmemek, yaymamak.</li>
<li>Ticari elektronik ileti gönderimi, taciz veya istenmeyen iletişim amacıyla platformu kullanmamak.</li>
</ul>
<p><strong>hangel'in hak ve yükümlülükleri:</strong></p>
<ul>
<li>Hizmeti makul özen ve teknik imkânlar çerçevesinde sunmak.</li>
<li>Kullanıcı verilerini KVKK'ya uygun olarak işlemek ve korumak.</li>
<li>5651 sayılı Kanun uyarınca yer sağlayıcı sorumlulukları kapsamında hukuka aykırı içeriği bildirim üzerine kaldırmak.</li>
<li>İşbu Sözleşme'ye veya mevzuata aykırı kullanımı tespit ettiğinde hesabı askıya alma veya sonlandırma.</li>
</ul>

<h4>5. Ücretlendirme ve Bağış Aktarımı</h4>
<p>hangel, bireysel kullanıcılara temel hizmetlerini kural olarak ücretsiz sunmayı amaçlar. Platform üzerinden gerçekleştirilen bağış aktarımlarında, bağış tutarları ilgili STK, dernek veya vakfa yönlendirilir; varsa ödeme altyapısı işlem ücretleri ve kesintiler bağış sürecinde açıkça gösterilir. Ücretli bir hizmet sunulması halinde, 6502 sayılı Kanun ve Mesafeli Sözleşmeler Yönetmeliği uyarınca ön bilgilendirme yapılır ve kullanıcının açık onayı alınır. Bağış işlemleri, niteliği gereği bir mal veya hizmet alımı olmayıp karşılıksız bir aktarım olduğundan, gerçekleşmiş ve ilgili kuruluşa ulaşmış bağışların geri alınması ancak ilgili kuruluşun politikaları ve yürürlükteki mevzuat çerçevesinde mümkündür.</p>

<h4>6. Fikri Mülkiyet Hakları</h4>
<p>Platformun tasarımı, yazılımı, "hangel" markası, logosu, arayüzü ve hangel tarafından üretilen tüm içerikler, 5846 sayılı Fikir ve Sanat Eserleri Kanunu ile 6769 sayılı Sınai Mülkiyet Kanunu kapsamında hangel AŞ'ye veya lisans verenlerine aittir. Kullanıcı, platforma yüklediği içerik üzerindeki haklarını saklı tutmakla birlikte, hangel'e bu içeriği hizmetin sunulması amacıyla kullanma, çoğaltma ve görüntüleme hususunda münhasır olmayan bir kullanım hakkı tanır. Kullanıcı, hangel'in yazılı izni olmaksızın platform içeriğini kopyalayamaz, çoğaltamaz veya ticari amaçla kullanamaz.</p>

<h4>7. Sorumluluğun Sınırlandırılması ve Sorumsuzluk</h4>
<p><strong>Kan/sağlık aracılığına ilişkin önemli sorumsuzluk kaydı:</strong> hangel'in acil kan talebi ve eşleştirme hizmeti, münhasıran bir <strong>bilgi aracılığı ve iletişim kolaylaştırma hizmetidir</strong>. hangel hiçbir şekilde bir sağlık kuruluşu, kan bankası veya tıbbi hizmet sağlayıcısı değildir. hangel; kan bağışına uygunluğun değerlendirilmesi, kanın toplanması, test edilmesi, saklanması, nakledilmesi veya transfüzyonu süreçlerinde <strong>hiçbir tıbbi sorumluluk veya transfüzyon sorumluluğu üstlenmez</strong>. Bu işlemler yalnızca yetkili sağlık kuruluşları, kan merkezleri ve hekimler tarafından, ilgili sağlık mevzuatı çerçevesinde yürütülür. Kan grubu ve bağışçı uygunluğu bilgilerinin doğruluğu kullanıcıların beyanına dayanır; nihai tıbbi değerlendirme her zaman yetkili sağlık personeline aittir.</p>
<p>hangel, platformda yer alan kullanıcı veya üçüncü taraf içeriklerinin doğruluğu, güncelliği veya hukuka uygunluğu konusunda garanti vermez. hangel; mücbir sebepler, teknik arızalar, üçüncü taraf hizmet sağlayıcı kaynaklı kesintiler veya kullanıcıların kusurundan doğan zararlardan sorumlu tutulamaz. hangel'in sorumluluğu, ancak kendi ağır kusuru ve yürürlükteki emredici hükümlerin sınırları çerçevesinde söz konusu olur. Genel işlem koşulu niteliğindeki bu sınırlama hükümleri, TBK m.25 anlamında dürüstlük kuralına aykırı şekilde yorumlanamaz.</p>

<h4>8. Kişisel Verilerin Korunması</h4>
<p>Kullanıcıya ait kişisel veriler, 6698 sayılı KVKK ve ilgili ikincil mevzuat uyarınca işlenir. Kan grubu gibi veriler, KVKK m.6 anlamında <strong>özel nitelikli (sağlık) kişisel veri</strong> olup, kural olarak ilgili kişinin <strong>açık rızası</strong> ile işlenir. Veri işleme faaliyetlerinin ayrıntıları, işleme amaçları, hukuki dayanaklar, saklama süreleri ve ilgili kişi hakları, platformda yayımlanan Gizlilik Politikası ve KVKK Aydınlatma Metni'nde düzenlenmiştir. Kullanıcı, KVKK m.11 kapsamındaki haklarını <a href="mailto:kvkk@hangel.org">kvkk@hangel.org</a> adresi üzerinden kullanabilir. hangel, 6563 sayılı Kanun ve Ticari İletişim Yönetmeliği uyarınca ticari elektronik ileti gönderiminde kullanıcı onayını İleti Yönetim Sistemi (İYS) üzerinden yönetir.</p>

<h4>9. Mücbir Sebep</h4>
<p>Doğal afetler, salgın hastalıklar, savaş, terör, siber saldırılar, kamu otoritesi kararları, elektrik ve internet altyapısı kesintileri ile tarafların kontrolü dışındaki benzeri olaylar mücbir sebep sayılır. Mücbir sebep süresince tarafların edimleri askıya alınır; bu süreçte hangel hizmet kesintilerinden sorumlu tutulamaz. Mücbir sebebin makul süreyi aşması halinde taraflar Sözleşme'yi feshetme hakkına sahiptir.</p>

<h4>10. Fesih ve Askıya Alma</h4>
<p>Kullanıcı, dilediği zaman hesabını kapatarak Sözleşme'yi feshedebilir. hangel; kullanıcının işbu Sözleşme'ye, mevzuata veya genel ahlaka aykırı davranması, yanıltıcı bilgi vermesi ya da platform güvenliğini tehlikeye atması halinde, hesabı önceden bildirimle veya gecikmesinde sakınca bulunan hallerde derhal askıya alabilir veya sonlandırabilir. Fesih, tarafların fesih tarihine kadar doğmuş hak ve yükümlülüklerini ortadan kaldırmaz. Kişisel veriler, fesih sonrasında ilgili saklama ve imha politikası çerçevesinde silinir, yok edilir veya anonim hale getirilir.</p>

<h4>11. Uygulanacak Hukuk ve Yetkili Mahkeme</h4>
<p>İşbu Sözleşme, Türkiye Cumhuriyeti hukukuna tabidir. Sözleşme'den doğan uyuşmazlıklarda İstanbul (Çağlayan) Mahkemeleri ve İcra Daireleri yetkilidir. Kullanıcının tüketici sıfatını haiz olduğu hallerde, 6502 sayılı Kanun uyarınca uyuşmazlıklar için <strong>Tüketici Hakem Heyetleri ve Tüketici Mahkemeleri</strong> görevli ve yetkili olup; tüketici, kendi yerleşim yerindeki hakem heyeti veya mahkemeye başvurma hakkını haizdir. Bu hüküm, tüketicinin kanundan doğan haklarını sınırlamaz.</p>

<h4>12. Tebligat, Değişiklik ve Yürürlük</h4>
<p>Kullanıcının kayıt sırasında bildirdiği e-posta adresi ve iletişim bilgileri, geçerli tebligat adresi olarak kabul edilir. hangel, mevzuat değişiklikleri veya hizmetin geliştirilmesi nedeniyle işbu Sözleşme'de değişiklik yapma hakkını saklı tutar; esaslı değişiklikler platform üzerinden veya e-posta yoluyla kullanıcıya bildirilir. Değişikliklerin yürürlüğe girmesinden sonra platformun kullanılmaya devam edilmesi, güncellenmiş Sözleşme'nin kabulü anlamına gelir. İşbu Sözleşme, kullanıcının elektronik ortamda onayladığı tarihte yürürlüğe girer.</p>

<p class="text-xs text-muted-foreground"><em>Bu metin bilgilendirme amaçlıdır ve bağlayıcı nihai hukuki görüş niteliği taşımaz; yürürlük öncesi yetkili hukuk danışmanlığı önerilir.</em></p>
    `
  },
  {
    slug: 'kurulus-sozlesmesi',
    title: 'Kuruluş Sözleşmesi',
    content: `
      <h3>Kuruluş Sözleşmesi</h3>

<p>İşbu Kuruluş Sözleşmesi ("Sözleşme"), hangel platformunda kurumsal profil açan tüzel kişiler ile topluluklar (dernekler, vakıflar, federasyonlar, şirketler, öğrenci kulüpleri, topluluklar ve benzeri yapılanmalar — birlikte "Kuruluş") ile platformu işleten <strong>hangel AŞ</strong> arasındaki kurumsal temsil, yetki ve veri paylaşım esaslarını düzenler. Kuruluş adına profil oluşturan kişi, işbu Sözleşme'yi okuduğunu, anladığını ve Kuruluş'u temsile yetkili olduğunu beyan ve taahhüt eder.</p>

<h4>1. Taraflar ve Tanımlar</h4>
<p>Sözleşme, bir tarafta <strong>hangel AŞ</strong> ("hangel" veya "platform") ile diğer tarafta platformda kurumsal profil açan tüzel kişilik veya topluluk ("Kuruluş") arasında akdedilmiştir.</p>
<table class="w-full border-collapse border border-gray-200 my-4">
<thead>
<tr>
<th class="border border-gray-200 p-2 text-left text-sm">Terim</th>
<th class="border border-gray-200 p-2 text-left text-sm">Tanım</th>
</tr>
</thead>
<tbody>
<tr>
<td class="border border-gray-200 p-2 text-sm">Kuruluş</td>
<td class="border border-gray-200 p-2 text-sm">Platformda profil açan dernek, vakıf, şirket, federasyon, öğrenci kulübü veya topluluk.</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Yetkili Temsilci</td>
<td class="border border-gray-200 p-2 text-sm">Kuruluş'u platformda temsile ve işlem yapmaya yetkili gerçek kişi.</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Kurumsal Profil</td>
<td class="border border-gray-200 p-2 text-sm">Kuruluş'a ait, platformda yer alan resmi sayfa ve hesap.</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Paylaşılan Veri</td>
<td class="border border-gray-200 p-2 text-sm">Kuruluş tarafından platforma sağlanan kurumsal, finansal ve faaliyet verileri.</td>
</tr>
</tbody>
</table>

<h4>2. Sözleşmenin Konusu ve Kapsamı</h4>
<p>İşbu Sözleşme'nin konusu, Kuruluş'un hangel platformunda kurumsal profil açması, bu profil üzerinden bağış toplama, gönüllülük ilanı yayımlama, etki raporlaması ve benzeri hizmetlerden yararlanması; ve bu kapsamda tarafların karşılıklı hak, yükümlülük ve veri paylaşım esaslarının belirlenmesidir. Sözleşme; 6102 sayılı Türk Ticaret Kanunu, 5253 sayılı Dernekler Kanunu, 5737 sayılı Vakıflar Kanunu ve 6098 sayılı Türk Borçlar Kanunu hükümlerine uygun olarak hazırlanmıştır. Kuruluş'un hukuki niteliğine göre tabi olduğu özel mevzuat hükümleri saklıdır.</p>

<h4>3. Hizmet Tanımı ve Üyelik Koşulları (Kurumsal Temsil ve Yetki)</h4>
<p>Kurumsal profil açma sürecinde Kuruluş'u temsil eden kişinin, Kuruluş'un karar ve temsil organları tarafından <strong>geçerli bir temsil yetkisiyle</strong> donatılmış olması esastır:</p>
<ul>
<li><strong>Dernekler bakımından:</strong> 5253 sayılı Dernekler Kanunu uyarınca derneği temsil yetkisi kural olarak <strong>yönetim kuruluna</strong> aittir; profil açma işlemi yönetim kurulu kararına veya yönetim kurulunun yetkilendirdiği kişiye dayanmalıdır. Dernek tüzüğünde organların görev ve yetkileri ile temsil esasları belirlenir.</li>
<li><strong>Vakıflar bakımından:</strong> 5737 sayılı Vakıflar Kanunu ve vakıf senedi çerçevesinde vakfı yönetim ve temsil yetkisini haiz organ/yönetici tarafından veya onun yetkilendirdiği kişi tarafından işlem yapılır. Vakıflar, Türk Medeni Kanunu hükümlerine göre kurulur ve özel hukuk tüzel kişiliğini haizdir.</li>
<li><strong>Şirketler bakımından:</strong> 6102 sayılı Türk Ticaret Kanunu uyarınca şirketi temsile yetkili kişiler (yönetim kurulu/müdürler veya bunların yetkilendirdiği temsilciler) tarafından işlem yapılır; temsil yetkisi imza sirküleri veya yetki belgesiyle ispatlanır.</li>
<li><strong>Öğrenci kulüpleri ve topluluklar bakımından:</strong> bağlı bulundukları üniversite/kurum mevzuatı ve danışman onayı çerçevesinde yetkilendirilmiş temsilci tarafından işlem yapılır.</li>
</ul>
<p>hangel, profil açılışında ve gerektiğinde, temsil yetkisini gösteren belgeleri (yönetim kurulu kararı, imza sirküleri, faaliyet belgesi, yetki belgesi vb.) talep edebilir ve doğrulama yapabilir.</p>

<h4>4. Tarafların Hak ve Yükümlülükleri</h4>
<p><strong>Kuruluş'un yükümlülükleri:</strong></p>
<ul>
<li>Temsil yetkisinin geçerli, güncel ve gerçeğe uygun olmasını sağlamak; yetkide değişiklik olması halinde hangel'i gecikmeksizin bilgilendirmek.</li>
<li>Platforma sağladığı kurumsal ve faaliyet bilgilerinin doğru, güncel ve mevzuata uygun olmasını temin etmek.</li>
<li>Bağış toplama faaliyetlerinde 2860 sayılı Yardım Toplama Kanunu ve ilgili mevzuat kapsamındaki yükümlülüklere uymak; gerekli izin ve bildirimleri sağlamak.</li>
<li>Kendi tâbi olduğu denetim, beyan ve şeffaflık yükümlülüklerini yerine getirmek.</li>
<li>Platform üzerinden eriştiği kişisel verileri yalnızca belirlenen amaçla ve KVKK'ya uygun şekilde işlemek.</li>
</ul>
<p><strong>hangel'in hak ve yükümlülükleri:</strong></p>
<ul>
<li>Kurumsal profili teknik imkânlar çerçevesinde erişilebilir kılmak ve hizmeti makul özenle sunmak.</li>
<li>Temsil yetkisinin doğrulanmadığı veya gerçeğe aykırı beyan tespit edilen hallerde profili askıya almak veya kaldırmak.</li>
<li>Paylaşılan verileri Sözleşme ve mevzuat çerçevesinde işlemek ve korumak.</li>
</ul>

<h4>5. Ücretlendirme ve Bağış Aktarımı</h4>
<p>Kuruluş'un platform üzerinden topladığı bağışlar, doğrulanmış banka/ödeme kanalları aracılığıyla Kuruluş'a aktarılır. Varsa ödeme altyapısı işlem ücretleri ve platform hizmet bedelleri, profil açılışında veya ayrı bir kurumsal hizmet sözleşmesiyle Kuruluş'a açıkça bildirilir. hangel, bağış akışlarının izlenebilirliğini ve şeffaflığını sağlamayı amaçlar; ancak toplanan fonların Kuruluş'un beyan ettiği amaçlar doğrultusunda kullanılmasından <strong>münhasıran Kuruluş sorumludur</strong>. Affiliate bağış aktarımı niteliğindeki işlemlerde aktarım zinciri ve kesintiler şeffaf biçimde gösterilir.</p>

<h4>6. Fikri Mülkiyet Hakları</h4>
<p>Kuruluş'un platforma yüklediği logo, marka, görsel ve içerikler üzerindeki haklar Kuruluş'a aittir. Kuruluş, bu içerikleri platformda yayımlama ve hizmet kapsamında kullanma hususunda hangel'e münhasır olmayan bir kullanım hakkı tanır ve bu içerikleri kullanma yetkisine sahip olduğunu taahhüt eder. Platformun yazılımı, tasarımı ve "hangel" markası ise hangel AŞ'ye aittir.</p>

<h4>7. Sorumluluğun Sınırlandırılması ve Sorumsuzluk</h4>
<p>hangel, Kuruluş ile bağışçılar, gönüllüler veya üçüncü kişiler arasındaki ilişkilerde <strong>taraf değildir</strong>; yalnızca aracılık ve eşleştirme hizmeti sunar. Kuruluş'un beyanlarının, faaliyetlerinin ve topladığı fonların kullanımının doğruluğu ve hukuka uygunluğundan Kuruluş sorumludur. <strong>Acil kan talebi ve sağlık aracılığı bakımından:</strong> hangel hiçbir tıbbi veya transfüzyon sorumluluğu üstlenmez; kan bağışı ve transfüzyon süreçleri yalnızca yetkili sağlık kuruluşlarınca yürütülür. hangel, mücbir sebep, teknik arıza veya üçüncü taraf hizmet sağlayıcı kaynaklı kesintilerden ve Kuruluş'un kusurundan doğan zararlardan sorumlu tutulamaz.</p>

<h4>8. Kişisel Verilerin Korunması ve Veri Paylaşımı</h4>
<p>Kurumsal profil kapsamında işlenen kişisel veriler, 6698 sayılı KVKK'ya uygun olarak işlenir. Kuruluş'un platform aracılığıyla bağışçı, gönüllü veya talep sahibi kişilere ait verilere erişmesi halinde, Kuruluş bu veriler bakımından <strong>kendi veri işleme faaliyetinden bağımsız olarak sorumludur</strong> ve KVKK kapsamındaki aydınlatma ve güvenlik yükümlülüklerini yerine getirmekle mükelleftir. Taraflar arasında veri işleyen/veri sorumlusu ilişkisinin doğduğu hallerde, KVKK ve ilgili rehberler çerçevesinde gerekli düzenlemeler yapılır. Kan grubu gibi özel nitelikli veriler (KVKK m.6) ancak ilgili kişinin açık rızasıyla ve sınırlı amaçla işlenebilir. Ayrıntılar Gizlilik Politikası ve KVKK Aydınlatma Metni'nde düzenlenmiştir; başvurular <a href="mailto:kvkk@hangel.org">kvkk@hangel.org</a> adresine yapılır.</p>

<h4>9. Mücbir Sebep</h4>
<p>Doğal afet, salgın, savaş, terör, siber saldırı, kamu otoritesi kararları, altyapı kesintileri ve tarafların kontrolü dışındaki benzeri olaylar mücbir sebep sayılır. Mücbir sebep süresince tarafların edimleri askıya alınır; hangel bu süreçteki kesintilerden sorumlu tutulamaz.</p>

<h4>10. Fesih ve Askıya Alma</h4>
<p>Kuruluş, dilediği zaman kurumsal profilini kapatarak Sözleşme'yi feshedebilir. hangel; temsil yetkisinin geçersizliği, gerçeğe aykırı beyan, mevzuata aykırı bağış toplama veya platform kurallarının ihlali hallerinde profili askıya alabilir veya sonlandırabilir. Fesih, doğmuş hak ve yükümlülükleri ortadan kaldırmaz. Fesih sonrasında veriler, saklama ve imha politikası çerçevesinde işlenir.</p>

<h4>11. Uygulanacak Hukuk ve Yetkili Mahkeme</h4>
<p>İşbu Sözleşme Türkiye Cumhuriyeti hukukuna tabidir. Sözleşme'den doğan uyuşmazlıklarda İstanbul (Çağlayan) Mahkemeleri ve İcra Daireleri yetkilidir. Kuruluş'un tabi olduğu özel mevzuattan doğan görevli/yetkili merci hükümleri saklıdır.</p>

<h4>12. Tebligat, Değişiklik ve Yürürlük</h4>
<p>Kuruluş'un kayıt sırasında bildirdiği e-posta ve iletişim bilgileri geçerli tebligat adresi sayılır. hangel, mevzuat değişiklikleri veya hizmet geliştirmeleri nedeniyle Sözleşme'de değişiklik yapma hakkını saklı tutar; esaslı değişiklikler Yetkili Temsilci'ye bildirilir. Profilin kullanılmaya devam edilmesi, güncellenmiş Sözleşme'nin kabulü anlamına gelir. Sözleşme, Kuruluş'un elektronik ortamda onayladığı tarihte yürürlüğe girer.</p>

<p class="text-xs text-muted-foreground"><em>Bu metin bilgilendirme amaçlıdır ve bağlayıcı nihai hukuki görüş niteliği taşımaz; yürürlük öncesi yetkili hukuk danışmanlığı önerilir.</em></p>
    `
  },
  {
    slug: 'gonulluluk-sozlesmesi',
    title: 'Gönüllülük Sözleşmesi',
    content: `
      <h3>Gönüllülük Sözleşmesi</h3>

<p>İşbu Gönüllülük Sözleşmesi ("Sözleşme"), hangel platformu aracılığıyla gönüllü faaliyet yürütmek isteyen gerçek kişi ("Gönüllü") ile platformu işleten <strong>hangel AŞ</strong> ve/veya gönüllü ilanı yayımlayan kuruluş arasındaki gönüllülük ilişkisinin esaslarını düzenler. Sözleşme, gönüllülüğün niteliğini, gönüllünün hak ve sorumluluklarını, güvenlik ve gizlilik esaslarını belirler. Gönüllü, işbu Sözleşme'yi okuduğunu ve gönüllü faaliyeti kendi özgür iradesiyle, karşılık beklemeksizin yürüteceğini kabul eder.</p>

<h4>1. Taraflar ve Tanımlar</h4>
<p>Sözleşme; gönüllü faaliyeti yürüten <strong>Gönüllü</strong>, platformu işleten <strong>hangel AŞ</strong> ("hangel" veya "platform") ve gönüllü ilanı yayımlayan <strong>Kuruluş</strong> (dernek, vakıf, topluluk vb.) arasında, somut faaliyetin niteliğine göre kurulan ilişkiyi tanımlar.</p>
<table class="w-full border-collapse border border-gray-200 my-4">
<thead>
<tr>
<th class="border border-gray-200 p-2 text-left text-sm">Terim</th>
<th class="border border-gray-200 p-2 text-left text-sm">Tanım</th>
</tr>
</thead>
<tbody>
<tr>
<td class="border border-gray-200 p-2 text-sm">Gönüllü</td>
<td class="border border-gray-200 p-2 text-sm">Kamu yararına yönelik bir faaliyeti, maddi karşılık beklemeksizin, kendi özgür iradesiyle yürüten gerçek kişi.</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Gönüllü Faaliyeti</td>
<td class="border border-gray-200 p-2 text-sm">Toplumsal fayda amacı taşıyan, ücret unsuru bulunmayan ve bağımlılık ilişkisi doğurmayan faaliyet.</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Görev Tanımı</td>
<td class="border border-gray-200 p-2 text-sm">Gönüllüden beklenen faaliyetin kapsamı, süresi ve koşullarını gösteren belge/açıklama.</td>
</tr>
</tbody>
</table>

<h4>2. Sözleşmenin Konusu ve Kapsamı (Gönüllülüğün Hukuki Niteliği)</h4>
<p><strong>Önemli nitelendirme:</strong> Gönüllülük, bir <strong>iş sözleşmesi veya hizmet akdi DEĞİLDİR</strong> ve <strong>işçi–işveren ilişkisi doğurmaz</strong>. 4857 sayılı İş Kanunu m.8 uyarınca iş sözleşmesi; bir tarafın <em>bağımlı olarak iş görmeyi</em>, diğer tarafın da <em>ücret ödemeyi</em> üstlenmesinden oluşur. Gönüllü faaliyette ise üç temel unsurdan ikisi (ücret ve bağımlılık) bulunmaz: gönüllü, maddi karşılık beklemeksizin ve işveren talimatına tabi bir bağımlılık ilişkisi içinde olmaksızın, kendi özgür iradesiyle hareket eder. Dolayısıyla gönüllü; işçi sayılmaz, ücret, kıdem/ihbar tazminatı, fazla mesai veya sosyal güvenlik primi gibi iş hukukundan doğan haklara işbu ilişki nedeniyle hak kazanmaz.</p>
<p>Bilgilendirme amacıyla belirtmek gerekir ki, Türk hukukunda gönüllülüğü doğrudan tanımlayan ve çerçeveleyen müstakil bir kanun bulunmamaktadır; ilişki niteliği, somut olayda <strong>bağımlılık unsurunun varlığına ve derecesine</strong> göre değerlendirilir. Yargı uygulamasında da bir ilişkinin iş sözleşmesi mi yoksa başka bir iş görme ilişkisi mi olduğu, ücret ve bağımlılık unsurlarının fiilen mevcut olup olmadığına bakılarak belirlenmektedir. Bu nedenle gönüllü faaliyetin, fiilen düzenli, sürekli ve işveren talimatına tabi bir bağımlı çalışma ilişkisine dönüşmemesi esastır; aksi halde, tarafların nitelendirmesinden bağımsız olarak ilişki bir iş ilişkisi olarak değerlendirilebilir. Taraflar, gönüllülüğün özünü koruyacak şekilde hareket etmeyi kabul eder.</p>
<p>Sözleşme; 5253 sayılı Dernekler Kanunu çerçevesinde sivil toplum gönüllülüğü ilkeleri, 6098 sayılı Türk Borçlar Kanunu'nun karşılıksız iş görme/vekâlet hükümleri ile uluslararası gönüllülük ilkeleri gözetilerek hazırlanmıştır. Bu kapsamda Birleşmiş Milletler Gönüllüleri (UN Volunteers) programının gönüllülüğü; özgür irade, karşılıksızlık ve toplum yararı temelinde tanımlayan ilkeleri ile Uluslararası Çalışma Örgütü'nün (ILO) gönüllü çalışmayı ücretli istihdamdan ayıran yaklaşımı esas alınmıştır. ILO, gönüllü çalışmayı, bir hane halkı dışındaki kişi veya kuruluşlar yararına, zorunlu olmaksızın ve ücret karşılığı olmaksızın yürütülen üretken faaliyet olarak ele alır; bu yaklaşım, gönüllülüğün iş ilişkisinden ayrılan temel niteliğini destekler.</p>

<h4>3. Hizmet Tanımı ve Gönüllülük Koşulları</h4>
<p>hangel, gönüllü arayan kuruluşlar ile gönüllüleri buluşturan bir <strong>aracılık ve eşleştirme platformudur</strong>. Gönüllü faaliyetin kapsamı, süresi, yeri ve koşulları, ilgili Kuruluş tarafından yayımlanan <strong>Görev Tanımı</strong> ile belirlenir. Gönüllü olabilmek için:</p>
<ul>
<li>On sekiz yaşını doldurmuş olmak (reşit olmayanların gönüllülüğü, yasal temsilcinin izni ve mevzuata uygunluk koşuluyla mümkündür);</li>
<li>Faaliyetin gerektirdiği asgari koşulları karşılamak;</li>
<li>Doğru ve güncel bilgi sağlamak gerekir.</li>
</ul>
<p>Gönüllü, görev tanımında belirtilen faaliyetleri kendi iradesiyle kabul eder ve dilediği zaman gönüllülükten ayrılma hakkına sahiptir.</p>

<h4>4. Tarafların Hak ve Yükümlülükleri</h4>
<p><strong>Gönüllünün hakları:</strong> güvenli bir ortamda faaliyet yürütme, görevine ilişkin bilgilendirilme ve gerekli yönlendirmeyi alma, saygı görme, ayrımcılığa uğramama ve emeğinin tanınması.</p>
<p><strong>Gönüllünün yükümlülükleri:</strong></p>
<ul>
<li>Görev tanımına ve Kuruluş'un meşru yönlendirmelerine iyi niyetle uymak;</li>
<li>Faaliyet sırasında öğrendiği kişisel veri ve gizli bilgileri korumak;</li>
<li>Üçüncü kişilerin haklarına ve mevzuata saygı göstermek;</li>
<li>hangel ve Kuruluş'un itibarını zedeleyecek davranışlardan kaçınmak.</li>
</ul>
<p><strong>hangel ve Kuruluş'un yükümlülükleri:</strong> gönüllüyü faaliyet öncesinde bilgilendirmek, güvenli koşullar sağlamaya özen göstermek, görev tanımını açık biçimde sunmak ve gönüllünün verilerini KVKK'ya uygun işlemek.</p>

<h4>5. Ücretlendirme ve Masraf Karşılığı</h4>
<p>Gönüllü faaliyeti karşılığında <strong>ücret ödenmez</strong>; gönüllülük doğası gereği karşılıksızdır. Bununla birlikte, faaliyetin gerektirdiği makul ve belgelendirilmiş masrafların (ulaşım, malzeme vb.) ilgili Kuruluş tarafından karşılanması, bu durumun bir ücret niteliği taşımaması ve gönüllülük ilişkisini bir iş ilişkisine dönüştürmemesi kaydıyla mümkündür. Masraf karşılığı, gönüllüye sağlanan bir gelir veya kazanç değildir.</p>

<h4>6. Fikri Mülkiyet Hakları</h4>
<p>Gönüllünün faaliyet kapsamında ürettiği içerik ve eserler bakımından fikri haklar, görev tanımında veya ayrı bir anlaşmada belirlenir. Aksi kararlaştırılmadıkça, faaliyetin amacına uygun olarak Kuruluş ve hangel tarafından kullanılabilir. Gönüllü, üçüncü kişilerin fikri mülkiyet haklarını ihlal etmemekle yükümlüdür.</p>

<h4>7. Sorumluluğun Sınırlandırılması ve Gönüllü Güvenliği</h4>
<p>hangel, gönüllü ile Kuruluş arasındaki faaliyet ilişkisinde <strong>taraf değildir</strong>; yalnızca eşleştirme hizmeti sunar. Gönüllü faaliyetin yürütülmesinden ve güvenli koşulların fiilen sağlanmasından öncelikli olarak ilgili Kuruluş sorumludur. Kuruluş; faaliyetin barındırdığı riskleri gönüllüye önceden bildirmek, faaliyet alanına uygun güvenlik tedbirlerini almak ve gerektiğinde gönüllüyü yönlendirmek/denetlemekle yükümlüdür.</p>
<p><strong>Acil kan talebi bağlamında:</strong> gönüllü bağışçı adaylarının yönlendirilmesi yalnızca bilgi aracılığıdır; hangel hiçbir tıbbi veya transfüzyon sorumluluğu üstlenmez ve kan bağışına uygunluk değerlendirmesi yalnızca yetkili sağlık kuruluşlarınca yapılır. Gönüllü, kan bağışı veya sağlık konusunda kişisel tıbbi tavsiye vermez; faydalanıcıları daima yetkili sağlık merciine yönlendirir. Gönüllü güvenliği bakımından Kuruluş, faaliyetin niteliğine uygun önlemleri almakla yükümlüdür. hangel, mücbir sebep, üçüncü taraf kusuru veya gönüllünün kendi kusurundan doğan zararlardan sorumlu tutulamaz. İşbu sınırlama hükümleri, gönüllünün kasıt veya ağır kusur hallerinde uygulanacak emredici hükümleri bertaraf etmez.</p>

<h4>8. Kişisel Verilerin Korunması ve Gizlilik</h4>
<p>Gönüllüye ait kişisel veriler 6698 sayılı KVKK'ya uygun olarak işlenir. Gönüllü, faaliyeti sırasında eriştiği üçüncü kişilere ait kişisel verileri — özellikle kan grubu gibi KVKK m.6 kapsamındaki özel nitelikli sağlık verilerini — yalnızca faaliyet amacıyla, gizlilik ilkesine uygun şekilde işlemek ve faaliyet sona erdiğinde paylaşmamak/ifşa etmemekle yükümlüdür. Ayrıntılar Gizlilik Politikası ve KVKK Aydınlatma Metni'nde düzenlenmiştir; başvurular <a href="mailto:kvkk@hangel.org">kvkk@hangel.org</a> adresine yapılır.</p>

<h4>9. Mücbir Sebep</h4>
<p>Doğal afet, salgın, savaş, terör, kamu otoritesi kararları ve tarafların kontrolü dışındaki benzeri olaylar mücbir sebep sayılır; bu süreçte faaliyetler askıya alınabilir ve taraflar sorumlu tutulamaz.</p>

<h4>10. Fesih ve Askıya Alma</h4>
<p>Gönüllülük, her iki tarafça serbestçe ve herhangi bir tazminat doğurmaksızın sona erdirilebilir; gönüllü dilediği zaman faaliyetten ayrılabilir. Kuruluş veya hangel, görev tanımına ya da etik ilkelere aykırılık halinde gönüllülüğü sonlandırabilir. Sona erme, gizlilik yükümlülüğünü ortadan kaldırmaz.</p>

<h4>11. Uygulanacak Hukuk ve Yetkili Mahkeme</h4>
<p>İşbu Sözleşme Türkiye Cumhuriyeti hukukuna tabidir. Uyuşmazlıklarda İstanbul (Çağlayan) Mahkemeleri ve İcra Daireleri yetkilidir. İşbu ilişkinin bir iş ilişkisi niteliği taşımadığı dikkate alınır; ancak somut olayda bağımlı çalışma unsurlarının varlığının iddia edildiği hallerde görevli/yetkili merci, ilgili mevzuata göre belirlenir.</p>

<h4>12. Tebligat, Değişiklik ve Yürürlük</h4>
<p>Gönüllünün bildirdiği e-posta ve iletişim bilgileri geçerli tebligat adresi sayılır. hangel, Sözleşme'de değişiklik yapma hakkını saklı tutar; esaslı değişiklikler gönüllüye bildirilir. Faaliyete devam edilmesi güncel Sözleşme'nin kabulü anlamına gelir. Sözleşme, gönüllünün elektronik ortamda onayladığı tarihte yürürlüğe girer.</p>

<p class="text-xs text-muted-foreground"><em>Bu metin bilgilendirme amaçlıdır ve bağlayıcı nihai hukuki görüş niteliği taşımaz; yürürlük öncesi yetkili hukuk danışmanlığı önerilir.</em></p>
    `
  },
  {
    slug: 'gonullu-haklari-beyannamesi',
    title: 'Gönüllü Hakları ve Sorumlulukları Beyannamesi',
    content: `
      <h3>Gönüllü Hakları ve Sorumlulukları Beyannamesi</h3>

<p>İşbu Beyanname, hangel platformu aracılığıyla gönüllü faaliyet yürüten kişilerin haklarını ve sorumluluklarını, uluslararası gönüllülük ilkeleri ve temel insan hakları çerçevesinde ortaya koyar. Beyanname; Uluslararası Gönüllü Çabası Birliği (IAVE) tarafından kabul edilen <strong>Evrensel Gönüllülük Bildirgesi (Universal Declaration on Volunteering)</strong> ile Birleşmiş Milletler <strong>İnsan Hakları Evrensel Beyannamesi</strong>'nin ilkelerinden ilham alır. hangel, gönüllülüğü; özgür irade, dayanışma ve karşılıksız topluma katkı temelinde değerli bir toplumsal etkinlik olarak tanır.</p>

<h4>1. Taraflar ve Tanımlar</h4>
<p>İşbu Beyanname, <strong>hangel AŞ</strong> ("hangel") tarafından, platform üzerinden gönüllü faaliyet yürüten tüm gönüllülere ("Gönüllü") yönelik olarak yayımlanmıştır. Gönüllü, kamu yararına yönelik bir faaliyeti maddi karşılık beklemeksizin, kendi özgür iradesiyle yürüten gerçek kişiyi ifade eder. Beyanname, bir gönüllülük ilişkisinin ahlaki ve ilkesel çerçevesini ortaya koyan tamamlayıcı bir belge olup, ayrıntılı hukuki çerçeve Gönüllülük Sözleşmesi'nde düzenlenmiştir.</p>

<h4>2. Beyannamenin Konusu ve Kapsamı</h4>
<p>Beyanname'nin konusu, gönüllülerin sahip olduğu temel hakların ve üstlendiği sorumlulukların açıkça tanımlanmasıdır. Kapsam, hangel platformu üzerinden yürütülen tüm gönüllü faaliyetleri içerir. Beyanname'nin dayandığı temel referanslar şunlardır:</p>
<ul>
<li><strong>Evrensel Gönüllülük Bildirgesi (IAVE)</strong> — IAVE Yönetim Kurulu'nca, Birleşmiş Milletler Uluslararası Gönüllüler Yılı kapsamında 2001 yılında Amsterdam'da düzenlenen 16. Dünya Gönüllülük Konferansı'nda kabul edilen ve her bireyin kültürel/etnik köken, din, yaş, cinsiyet ile fiziksel, sosyal ve ekonomik durumdan bağımsız olarak gönüllü olma hakkını tanıyan bildirge;</li>
<li><strong>İnsan Hakları Evrensel Beyannamesi (BM, 1948)</strong> — onur, eşitlik ve ayrımcılık yasağı (m.1–2), örgütlenme ve dernek kurma özgürlüğü (m.20), çalışma ve adil koşullar (m.23) ile dinlenme hakkı (m.24) ilkeleri.</li>
</ul>
<p>Evrensel Gönüllülük Bildirgesi, gönüllülüğü; bireysel ve kolektif eylem yoluyla, finansal karşılık beklenmeksizin zaman, yetenek ve enerjinin başkalarına ve topluma özgürce sunulması olarak tanımlar ve her bireyin gönüllü olma hakkını temel bir hak olarak kabul eder. Bildirge ayrıca devletleri, işletmeleri, medyayı, eğitim kurumlarını, inanç topluluklarını ve sivil toplum kuruluşlarını gönüllülüğü desteklemeye ve sürdürmeye çağırır. hangel, bu çağrıyı bir toplumsal etki platformu olarak benimser ve gönüllülüğü güçlendirmeyi misyonunun bir parçası sayar. Beyanname, bağlayıcı bir kanun metni olmayıp, hangel'in gönüllülere karşı benimsediği ilkesel taahhütleri ortaya koyar.</p>

<h4>3. Gönüllülük İlkeleri ve Statü</h4>
<p>Gönüllülük; özgür irade, karşılıksızlık ve dayanışma temelinde gerçekleşir. Gönüllülük bir <strong>iş ilişkisi değildir</strong>; gönüllüye ücret ödenmez ve gönüllü işçi statüsünde değildir. Bu Beyanname, gönüllüye iş hukukundan doğan haklar tanıma amacı taşımaz; gönüllülüğün ahlaki ve insani değerini tanır ve korur. Gönüllülük; bireyin topluma karşı duyduğu sorumluluğun ve dayanışma duygusunun bir ifadesi olarak, hem gönüllüye kişisel gelişim ve aidiyet imkânı sunar hem de toplumsal soruna doğrudan katkı sağlar. hangel, gönüllülüğün bu çift yönlü değerini gözeterek, gönüllülerin haklarının korunmasını ve sorumluluklarının açıkça bilinmesini güvence altına almayı hedefler. İşbu Beyanname'de yer alan haklar ve sorumluluklar, gönüllü ile kuruluş arasında karşılıklı güven ve saygıya dayalı bir ilişki kurulmasını amaçlar.</p>

<h4>4. Gönüllünün Hakları</h4>
<p>hangel, her gönüllünün aşağıdaki haklara sahip olduğunu tanır ve gözetmeyi taahhüt eder:</p>
<table class="w-full border-collapse border border-gray-200 my-4">
<thead>
<tr>
<th class="border border-gray-200 p-2 text-left text-sm">Hak</th>
<th class="border border-gray-200 p-2 text-left text-sm">Açıklama</th>
</tr>
</thead>
<tbody>
<tr>
<td class="border border-gray-200 p-2 text-sm">Bilgilendirilme</td>
<td class="border border-gray-200 p-2 text-sm">Görev tanımı, faaliyetin amacı, süresi, riskleri ve kuruluş hakkında açık ve doğru bilgi alma hakkı.</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Eğitim ve yönlendirme</td>
<td class="border border-gray-200 p-2 text-sm">Faaliyetin gerektirdiği oryantasyon, eğitim ve desteğe erişme hakkı.</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Saygı ve onur</td>
<td class="border border-gray-200 p-2 text-sm">Emeğinin tanınması, saygı görme ve insan onuruna yaraşır şekilde değerlendirilme hakkı.</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Güvenli ortam</td>
<td class="border border-gray-200 p-2 text-sm">Faaliyetin niteliğine uygun, güvenli ve sağlıklı koşullarda görev yapma hakkı.</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Ayrımcılık yasağı</td>
<td class="border border-gray-200 p-2 text-sm">Köken, din, yaş, cinsiyet, engellilik veya ekonomik durum temelinde ayrımcılığa uğramama hakkı.</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Erişilebilirlik</td>
<td class="border border-gray-200 p-2 text-sm">Engelli gönüllülerin makul düzenlemelerle faaliyetlere katılabilmesi.</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Sigorta/koruma (hedef)</td>
<td class="border border-gray-200 p-2 text-sm">Faaliyetin niteliği uygun olduğunda gönüllüyü koruyacak sigorta düzenlemelerinin teşvik edilmesi; hangel bunu bir taahhüt ve hedef olarak benimser.</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Geri çekilme</td>
<td class="border border-gray-200 p-2 text-sm">Dilediği zaman, tazminat doğmaksızın gönüllülükten ayrılma hakkı.</td>
</tr>
</tbody>
</table>

<h4>5. Gönüllünün Sorumlulukları</h4>
<p>Haklara karşılık olarak, gönüllüden aşağıdaki sorumlulukları üstlenmesi beklenir:</p>
<ul>
<li>Görev tanımına ve kuruluşun meşru yönlendirmelerine iyi niyetle uymak;</li>
<li>Faaliyeti özen, dürüstlük ve güvenilirlikle yürütmek; üstlendiği görevi makul ölçüde tamamlamaya çaba göstermek;</li>
<li>Faaliyet sırasında eriştiği kişisel veri ve gizli bilgileri korumak, üçüncü kişilerle paylaşmamak;</li>
<li>Diğer gönüllülere, faydalanıcılara ve kuruluş çalışanlarına saygı göstermek; ayrımcılık ve tacizden kaçınmak;</li>
<li>Yürürlükteki mevzuata ve hangel etik ilkelerine uymak;</li>
<li>Görevini yerine getiremeyeceği durumlarda kuruluşu makul süre içinde bilgilendirmek.</li>
</ul>

<h4>6. Sorumluluğun Sınırı ve Sağlık Aracılığı</h4>
<p>hangel, gönüllü ile faydalanıcılar arasındaki ilişkide aracı konumundadır. Acil kan talebi kapsamındaki gönüllü yönlendirmeleri yalnızca bilgi aracılığıdır; <strong>hangel hiçbir tıbbi veya transfüzyon sorumluluğu üstlenmez</strong> ve kan bağışına uygunluk yalnızca yetkili sağlık kuruluşlarınca değerlendirilir. Gönüllü, sağlıkla ilgili konularda kendi adına tıbbi karar vermez ve faydalanıcıları yetkili sağlık mercilerine yönlendirir.</p>

<h4>7. Kişisel Verilerin Korunması</h4>
<p>Gönüllüye ait kişisel veriler 6698 sayılı KVKK'ya uygun olarak işlenir. Gönüllü, faaliyeti sırasında eriştiği özel nitelikli sağlık verileri (kan grubu — KVKK m.6) dahil tüm kişisel verileri gizlilik ilkesine uygun işlemekle yükümlüdür. İlgili kişiler KVKK m.11 kapsamındaki haklarını <a href="mailto:kvkk@hangel.org">kvkk@hangel.org</a> adresi üzerinden kullanabilir.</p>

<h4>8. Eşitlik ve Ayrımcılık Yasağı</h4>
<p>hangel, Evrensel Gönüllülük Bildirgesi ve İnsan Hakları Evrensel Beyannamesi ilkeleri doğrultusunda, gönüllülükte fırsat eşitliğini ve ayrımcılık yasağını benimser. Hiçbir gönüllü; etnik köken, din, dil, yaş, cinsiyet, engellilik veya ekonomik durum temelinde dışlanamaz. hangel, gönüllülüğün herkes için erişilebilir olmasını hedefler.</p>

<h4>9. Başvuru, Geri Bildirim ve Şikâyet</h4>
<p>Gönüllüler; hak ihlali, güvenlik endişesi veya ayrımcılık iddialarını hangel'in ilgili iletişim kanalları ve ilgili kuruluş aracılığıyla iletebilir. hangel, bu bildirimleri iyi niyetle değerlendirmeyi ve makul süre içinde geri dönüş sağlamayı taahhüt eder.</p>

<h4>10. İzleme ve Gözden Geçirme</h4>
<p>hangel, işbu Beyanname'nin uygulanmasını izlemeyi, gönüllü geri bildirimlerini dikkate almayı ve Beyanname'yi düzenli olarak gözden geçirmeyi amaçlar. Bu süreç, gönüllülük deneyiminin iyileştirilmesine yönelik bir taahhüt çerçevesinde yürütülür. hangel, gönüllü memnuniyetini ve hak ihlali bildirimlerini izleyerek elde ettiği bulguları, gönüllülük programlarının ve görev tanımlarının iyileştirilmesinde kullanmayı hedefler. Beyanname'de yapılacak güncellemeler, uluslararası gönüllülük standartlarındaki gelişmeler ve gönüllü geri bildirimleri dikkate alınarak şekillendirilir.</p>

<h4>11. Uygulanacak İlkeler ve Hukuk</h4>
<p>Beyanname; uluslararası gönüllülük ilkeleri ve temel insan hakları çerçevesinde yorumlanır. Hukuki ihtilaflarda Türkiye Cumhuriyeti hukuku uygulanır ve ilgili Gönüllülük Sözleşmesi hükümleri esas alınır.</p>

<h4>12. Değişiklik ve Yürürlük</h4>
<p>hangel, Beyanname'de değişiklik yapma hakkını saklı tutar; esaslı değişiklikler platform üzerinden duyurulur. İşbu Beyanname, platformda yayımlandığı tarihte yürürlüğe girer ve gönüllülük ilişkisinin ahlaki çerçevesini oluşturur.</p>

<p class="text-xs text-muted-foreground"><em>Bu metin bilgilendirme amaçlıdır ve bağlayıcı nihai hukuki görüş niteliği taşımaz; yürürlük öncesi yetkili hukuk danışmanlığı önerilir.</em></p>
    `
  },

  // --- B. Gizlilik, Veri Koruma ve Güvenlik ---
  {
    slug: 'gizlilik-politikasi',
    title: 'Gizlilik Politikası',
    content: `
      <h3>Gizlilik Politikası</h3>

<p>Bu Gizlilik Politikası, Türkiye merkezli toplumsal etki platformu <strong>hangel</strong>'i işleten <strong>hangel AŞ</strong> ("hangel", "Şirket" veya "veri sorumlusu") tarafından sunulan acil kan talebi/eşleştirme, bireysel ve kurumsal bağış, gönüllülük ilanları, STK/dernek/vakıf profilleri, marka üyelikleri, öğrenci kulüpleri, affiliate bağış aktarımı ve etki/şeffaflık raporlama hizmetleri kapsamında işlenen kişisel verilerin nasıl toplandığını, kullanıldığını, aktarıldığını, saklandığını ve korunduğunu açıklamaktadır. hangel; 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK"), Avrupa Birliği Genel Veri Koruma Tüzüğü (General Data Protection Regulation — GDPR (EU) 2016/679) ve Kaliforniya Tüketici Gizliliği Yasası (California Consumer Privacy Act — CCPA/CPRA) başta olmak üzere uygulanabilir veri koruma mevzuatına uyumu esas alır.</p>

<h4>1. Veri Sorumlusu Kimliği ve İletişim</h4>
<p>KVKK m.3/1-(ı) anlamında veri sorumlusu, hangel platformunu işleten <strong>hangel AŞ</strong>'dir. Kişisel verilerinizin işlenmesine ilişkin her türlü talep, soru ve başvurunuzu aşağıdaki kanallar üzerinden iletebilirsiniz:</p>
<ul>
<li>Türkiye'deki kişisel veri işleme faaliyetleri (KVKK) için: <a href="mailto:kvkk@hangel.org">kvkk@hangel.org</a></li>
<li>Avrupa Birliği / uluslararası veri sahipleri (GDPR) için: <a href="mailto:privacy@hangel.org">privacy@hangel.org</a> veya <a href="mailto:dpo@hangel.org">dpo@hangel.org</a></li>
</ul>
<p>Veri Sorumluları Sicili (VERBİS) kayıt numarası: <em>[VERBİS-NO yer tutucu]</em>. GDPR Art.27 anlamında AB temsilcisi ataması, veri sahibi kapsamı gerektirdiğinde yol haritasında yer almaktadır.</p>

<h4>2. İşlenen Kişisel Veri Kategorileri</h4>
<p>hangel, hizmetin niteliğine ve kullanıcının tercihlerine bağlı olarak aşağıdaki kişisel veri kategorilerini işler:</p>
<table class="w-full border-collapse border border-gray-200 my-4">
<thead>
<tr>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Veri Kategorisi</th>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Örnek Veriler</th>
</tr>
</thead>
<tbody>
<tr><td class="border border-gray-200 p-2 text-sm">Kimlik</td><td class="border border-gray-200 p-2 text-sm">Ad, soyad, doğum tarihi, kullanıcı adı</td></tr>
<tr><td class="border border-gray-200 p-2 text-sm">İletişim</td><td class="border border-gray-200 p-2 text-sm">E-posta adresi, telefon numarası, adres</td></tr>
<tr><td class="border border-gray-200 p-2 text-sm">Konum</td><td class="border border-gray-200 p-2 text-sm">Acil kan eşleştirmesi için yaklaşık/anlık konum bilgisi</td></tr>
<tr><td class="border border-gray-200 p-2 text-sm">Özel nitelikli (sağlık)</td><td class="border border-gray-200 p-2 text-sm"><strong>Kan grubu</strong> — KVKK m.6 ve GDPR Art.9 anlamında sağlık verisidir</td></tr>
<tr><td class="border border-gray-200 p-2 text-sm">İşlem ve kullanım</td><td class="border border-gray-200 p-2 text-sm">Bağış geçmişi, ilan/başvuru kayıtları, gönüllülük etkinlikleri</td></tr>
<tr><td class="border border-gray-200 p-2 text-sm">Finansal</td><td class="border border-gray-200 p-2 text-sm">IBAN, ödeme/işlem bilgisi, bağış makbuzu verileri</td></tr>
<tr><td class="border border-gray-200 p-2 text-sm">Cihaz ve teknik</td><td class="border border-gray-200 p-2 text-sm">IP adresi, cihaz tanımlayıcıları, uygulama günlükleri, çerez verileri</td></tr>
<tr><td class="border border-gray-200 p-2 text-sm">Pazarlama</td><td class="border border-gray-200 p-2 text-sm">İletişim izinleri, kampanya etkileşimleri, tercihler</td></tr>
</tbody>
</table>

<h4>3. İşleme Amaçları ve Hukuki Dayanak</h4>
<p>KVKK m.4 uyarınca kişisel verileriniz hukuka ve dürüstlük kurallarına uygun, belirli, açık ve meşru amaçlarla, ölçülü ve güncel olarak işlenir. Her amaca karşılık gelen hukuki dayanak aşağıda gösterilmiştir:</p>
<table class="w-full border-collapse border border-gray-200 my-4">
<thead>
<tr>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">İşleme Amacı</th>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Hukuki Dayanak (KVKK / GDPR)</th>
</tr>
</thead>
<tbody>
<tr><td class="border border-gray-200 p-2 text-sm">Üyelik oluşturma ve hesap yönetimi</td><td class="border border-gray-200 p-2 text-sm">KVKK m.5/2-(c) sözleşmenin kurulması/ifası; GDPR Art.6(1)(b)</td></tr>
<tr><td class="border border-gray-200 p-2 text-sm">Acil kan talebi eşleştirmesi (kan grubu)</td><td class="border border-gray-200 p-2 text-sm">KVKK m.6/2 <strong>açık rıza</strong>; GDPR Art.9(2)(a)</td></tr>
<tr><td class="border border-gray-200 p-2 text-sm">Bağış işlemi ve makbuz düzenleme</td><td class="border border-gray-200 p-2 text-sm">KVKK m.5/2-(c) ve (ç) hukuki yükümlülük; GDPR Art.6(1)(b)(c)</td></tr>
<tr><td class="border border-gray-200 p-2 text-sm">Yasal yükümlülüklerin yerine getirilmesi (mali, MASAK)</td><td class="border border-gray-200 p-2 text-sm">KVKK m.5/2-(ç); GDPR Art.6(1)(c)</td></tr>
<tr><td class="border border-gray-200 p-2 text-sm">Platform güvenliği ve dolandırıcılığın önlenmesi</td><td class="border border-gray-200 p-2 text-sm">KVKK m.5/2-(f) meşru menfaat; GDPR Art.6(1)(f)</td></tr>
<tr><td class="border border-gray-200 p-2 text-sm">Pazarlama ve ticari elektronik ileti</td><td class="border border-gray-200 p-2 text-sm">KVKK m.5/1 açık rıza; GDPR Art.6(1)(a)</td></tr>
</tbody>
</table>

<h4>4. Özel Nitelikli Veri (Kan Grubu)</h4>
<p>Kan grubu bilgisi, KVKK m.6 ve GDPR Art.9 kapsamında <strong>özel nitelikli (sağlık) kişisel veri</strong>dir. hangel bu veriyi yalnızca acil kan talebi/eşleştirme hizmetinin yerine getirilmesi amacıyla ve KVKK m.6/2 ile GDPR Art.9(2)(a) uyarınca <strong>açık rızanıza</strong> dayanarak işler. Kan grubu verisi, KVKK m.6'da öngörülen ek güvenlik tedbirleri (erişim kısıtlaması, şifreleme, yetki matrisi) ile korunur ve rızanızı her zaman geri çekebilirsiniz.</p>

<h4>5. Toplama Yöntemi ve Otomatik Karar/Profilleme</h4>
<p>Kişisel veriler; hangel mobil uygulaması ve web sitesi üzerinden doğrudan sizden, çerez ve benzeri teknolojiler aracılığıyla otomatik yollarla ve hizmet sağlayıcılar üzerinden elde edilir. Acil kan eşleştirmesinde coğrafi yakınlık ve kan grubu uyumuna göre öncelik sıralaması yapılabilir; ancak bu işlem, GDPR Art.22 anlamında sizin üzerinizde hukuki sonuç doğuran veya benzer şekilde önemli etki yaratan tamamen otomatik bir karar niteliği taşımaz. Bu tür bir karar gerektiğinde açık rızanız alınır ve insan müdahalesi talep etme hakkınız saklıdır.</p>

<h4>6. Aktarım — Yurt İçi / Yurt Dışı</h4>
<p>Kişisel verileriniz; yasal yükümlülükler, hizmetin ifası ve açık rızanız çerçevesinde yetkili kamu kurumlarına, ödeme kuruluşlarına ve hizmet sağlayıcılara KVKK m.8 uyarınca yurt içinde aktarılabilir. hangel altyapısı Google Cloud / Firebase (Firestore, Authentication, Storage) ve Apple hizmetlerini içerdiğinden veriler yurt dışında işlenebilir. Yurt dışı aktarımlar, <strong>12 Mart 2024 tarihli 7499 sayılı Kanun (ilgili hükümler 1 Haziran 2024'te yürürlüğe girmiştir) ile yeniden düzenlenen KVKK m.9</strong> uyarınca yeterlilik kararı, bunun yokluğunda standart sözleşme veya bağlayıcı şirket kuralları gibi uygun güvenceler ya da m.9'daki arızi haller çerçevesinde gerçekleştirilir. AB veri sahipleri için aktarımlar GDPR Art.44-49 ve Standart Sözleşme Maddeleri (SCC) ile güvence altına alınır.</p>

<h4>7. Saklama Süreleri ve İmha</h4>
<p>Kişisel veriler, işlendikleri amaç için gerekli olan süre boyunca ve ilgili mevzuatta öngörülen zamanaşımı/saklama süreleri kadar saklanır. Süre dolduğunda veya işleme şartları ortadan kalktığında veriler KVKK m.7 ile Kişisel Verilerin Silinmesi, Yok Edilmesi veya Anonim Hale Getirilmesi Hakkında Yönetmelik ve GDPR Art.5(1)(e) uyarınca silinir, yok edilir veya anonim hale getirilir. Ayrıntı için Veri Saklama ve İmha Politikası'na bakınız.</p>

<h4>8. İlgili Kişi / Veri Sahibi Hakları</h4>
<p>KVKK m.11 uyarınca; verilerinizin işlenip işlenmediğini öğrenme, bilgi talep etme, amaca uygun kullanılıp kullanılmadığını öğrenme, yurt içinde/dışında aktarıldığı üçüncü kişileri bilme, eksik/yanlış işlenmişse düzeltilmesini, KVKK m.7 şartlarında silinmesini/yok edilmesini isteme, bu işlemlerin aktarıldığı üçüncü kişilere bildirilmesini isteme, münhasıran otomatik analize itiraz etme ve zarara uğramanız halinde tazminat talep etme haklarına sahipsiniz. AB veri sahipleri ayrıca GDPR Art.15-22 kapsamında erişim, düzeltme, silme (unutulma), işlemeyi kısıtlama, veri taşınabilirliği ve itiraz haklarını; Kaliforniya sakinleri CCPA §1798.100 ve devamı kapsamında bilme, silme, düzeltme ve satışı/paylaşımı reddetme (opt-out) haklarını kullanabilir.</p>

<h4>9. Başvuru ve Şikâyet Mercii</h4>
<p>Haklarınıza ilişkin başvurularınızı <a href="mailto:kvkk@hangel.org">kvkk@hangel.org</a> (TR) veya <a href="mailto:privacy@hangel.org">privacy@hangel.org</a> (AB/uluslararası) adresine iletebilirsiniz. Başvurularınız KVKK m.13 uyarınca en geç <strong>30 gün</strong> içinde sonuçlandırılır. Yanıttan tatmin olmamanız halinde Kişisel Verileri Koruma Kurulu'na (KVKK m.14) şikâyette bulunabilir; AB veri sahipleri yetkili denetim makamına (GDPR Art.77) başvurabilirsiniz.</p>

<h4>10. Veri Güvenliği Tedbirleri</h4>
<p>hangel, KVKK m.12 ve GDPR Art.32 uyarınca verilerin hukuka aykırı işlenmesini ve erişimi önlemek için uygun teknik ve idari tedbirleri uygular: aktarımda ve dinlenmede (in-transit/at-rest) şifreleme, erişim yetki matrisi ve en az yetki ilkesi, çok faktörlü kimlik doğrulama, günlük kaydı ve izleme, gizlilik sözleşmeleri ve düzenli farkındalık eğitimleridir. hangel, bilgi güvenliği yönetiminde uluslararası iyi uygulamaları (örneğin ISO/IEC 27001:2022 kontrol çerçevesi ve OWASP güvenlik prensipleri) referans almayı ve bağımsız sızma testlerini düzenli hale getirmeyi yol haritasında hedeflemektedir; bu husus bir mevcut sertifikasyon beyanı değildir. Kan grubu gibi özel nitelikli veriler için KVKK m.6 uyarınca ek güvenlik katmanları uygulanır. Veri ihlali halinde KVKK m.12/5 ve Kurul kararı 2019/10 (en geç 72 saat) ile GDPR Art.33-34 uyarınca yetkili makamlara ve gerektiğinde ilgili kişilere bildirim yapılır; ayrıntılar Veri İhlali Bildirim Prosedürü'nde düzenlenmiştir.</p>

<h4>11. Çerezler</h4>
<p>hangel; oturum yönetimi, güvenlik, performans ölçümü ve tercihlerin hatırlanması amacıyla çerez ve benzeri teknolojiler kullanır. Zorunlu olmayan çerezler için onayınız alınır (GDPR ve ePrivacy Direktifi 2002/58/EC). Ayrıntılar ayrı <a href="/cerez-politikasi" rel="noopener">Çerez Politikası</a>'nda düzenlenmiştir.</p>

<h4>12. Çocukların Verileri</h4>
<p>hangel hizmetleri esas olarak yetişkinlere yöneliktir. Reşit olmayan kullanıcıların kişisel verileri, ancak yürürlükteki mevzuatın izin verdiği ölçüde ve gerektiğinde veli/vasi onayıyla işlenir (GDPR Art.8 çocuk rızası ve ABD COPPA — 15 U.S.C. §6501 ve devamı çerçevesinde). hangel, bir çocuğa ait verinin uygun onay olmaksızın işlendiğini tespit ederse, bu veriyi gecikmeksizin imha eder.</p>

<h4>13. Değişiklik ve Yürürlük</h4>
<p>hangel bu Gizlilik Politikası'nı mevzuat değişiklikleri veya hizmet kapsamındaki güncellemeler doğrultusunda revize edebilir. Güncel metin platform üzerinden yayımlandığı tarihte yürürlüğe girer; esaslı değişikliklerde kullanıcılar uygun kanallarla (uygulama içi bildirim veya e-posta) bilgilendirilir. Bu Politika, hangel'in KVKK Aydınlatma Metni, Açık Rıza Metni, Veri Saklama ve İmha Politikası, Kullanıcı Hakları Politikası ve Çerez Politikası ile bütünlük içinde uygulanır.</p>

<p class="text-xs text-muted-foreground"><em>Bu metin bilgilendirme amaçlıdır ve bağlayıcı nihai hukuki görüş niteliği taşımaz; yürürlük öncesi yetkili hukuk danışmanlığı önerilir.</em></p>
    `
  },
  {
    slug: 'kvkk-aydinlatma-metni',
    title: 'KVKK Aydınlatma Metni',
    content: `
      <h3>KVKK Aydınlatma Metni</h3>

<p>İşbu Aydınlatma Metni, <strong>hangel AŞ</strong> ("hangel" veya "veri sorumlusu") tarafından, 6698 sayılı Kişisel Verilerin Korunması Kanunu'nun ("KVKK") <strong>10. maddesi</strong> ve Aydınlatma Yükümlülüğünün Yerine Getirilmesinde Uyulacak Usul ve Esaslar Hakkında Tebliğ uyarınca, kişisel verilerinizin işlenmesine ilişkin sizi bilgilendirmek amacıyla hazırlanmıştır. hangel, Türkiye merkezli bir toplumsal etki platformu olarak acil kan talebi/eşleştirme, bağış, gönüllülük, STK profilleri, marka üyelikleri, öğrenci kulüpleri ve etki raporlaması hizmetleri sunmaktadır.</p>

<h4>1. Veri Sorumlusu Kimliği ve İletişim</h4>
<p>Kişisel verileriniz, veri sorumlusu sıfatıyla <strong>hangel AŞ</strong> tarafından işlenmektedir. hangel, Veri Sorumluları Sicili (VERBİS) kapsamında Veri Sorumluları Sicili Hakkında Yönetmelik uyarınca kayıtlıdır; VERBİS kayıt numarası: <em>[VERBİS-NO yer tutucu]</em>. KVKK kapsamındaki taleplerinizi <a href="mailto:kvkk@hangel.org">kvkk@hangel.org</a> adresine iletebilirsiniz.</p>

<h4>2. İşlenen Kişisel Veri Kategorileri</h4>
<p>hangel, hizmetin gerektirdiği ölçüde aşağıdaki veri kategorilerini işlemektedir:</p>
<table class="w-full border-collapse border border-gray-200 my-4">
<thead>
<tr>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Veri Kategorisi</th>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">İçerik</th>
</tr>
</thead>
<tbody>
<tr><td class="border border-gray-200 p-2 text-sm">Kimlik Bilgisi</td><td class="border border-gray-200 p-2 text-sm">Ad, soyad, doğum tarihi, kullanıcı adı</td></tr>
<tr><td class="border border-gray-200 p-2 text-sm">İletişim Bilgisi</td><td class="border border-gray-200 p-2 text-sm">E-posta, telefon, adres</td></tr>
<tr><td class="border border-gray-200 p-2 text-sm">Konum Bilgisi</td><td class="border border-gray-200 p-2 text-sm">Acil kan eşleştirmesi için konum</td></tr>
<tr><td class="border border-gray-200 p-2 text-sm">Özel Nitelikli Veri</td><td class="border border-gray-200 p-2 text-sm"><strong>Kan grubu</strong> (sağlık verisi — KVKK m.6)</td></tr>
<tr><td class="border border-gray-200 p-2 text-sm">Finansal Bilgi</td><td class="border border-gray-200 p-2 text-sm">IBAN, ödeme/bağış işlem verisi</td></tr>
<tr><td class="border border-gray-200 p-2 text-sm">İşlem Güvenliği</td><td class="border border-gray-200 p-2 text-sm">IP, log kaydı, cihaz tanımlayıcı, çerez</td></tr>
<tr><td class="border border-gray-200 p-2 text-sm">Pazarlama</td><td class="border border-gray-200 p-2 text-sm">İletişim izinleri, kampanya tercihleri</td></tr>
</tbody>
</table>

<h4>3. İşleme Amaçları ve Hukuki Dayanak</h4>
<p>Kişisel verileriniz KVKK m.5 ve m.6'da öngörülen işleme şartlarına dayanılarak aşağıdaki amaçlarla işlenir:</p>
<table class="w-full border-collapse border border-gray-200 my-4">
<thead>
<tr>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Amaç</th>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Hukuki Dayanak (KVKK)</th>
</tr>
</thead>
<tbody>
<tr><td class="border border-gray-200 p-2 text-sm">Üyelik ve hesap yönetimi</td><td class="border border-gray-200 p-2 text-sm">m.5/2-(c) sözleşmenin ifası</td></tr>
<tr><td class="border border-gray-200 p-2 text-sm">Acil kan eşleştirmesi (kan grubu)</td><td class="border border-gray-200 p-2 text-sm">m.6/2 <strong>açık rıza</strong></td></tr>
<tr><td class="border border-gray-200 p-2 text-sm">Bağış ve makbuz işlemleri</td><td class="border border-gray-200 p-2 text-sm">m.5/2-(c) ve (ç)</td></tr>
<tr><td class="border border-gray-200 p-2 text-sm">Mali ve hukuki yükümlülükler</td><td class="border border-gray-200 p-2 text-sm">m.5/2-(ç) hukuki yükümlülük</td></tr>
<tr><td class="border border-gray-200 p-2 text-sm">Güvenlik ve dolandırıcılık önleme</td><td class="border border-gray-200 p-2 text-sm">m.5/2-(f) meşru menfaat</td></tr>
<tr><td class="border border-gray-200 p-2 text-sm">Pazarlama / ticari elektronik ileti</td><td class="border border-gray-200 p-2 text-sm">m.5/1 açık rıza</td></tr>
</tbody>
</table>

<h4>4. Özel Nitelikli Veri (Kan Grubu)</h4>
<p>Kan grubu bilgisi KVKK m.6 anlamında <strong>sağlık verisi</strong> niteliğinde özel nitelikli kişisel veridir. Bu veri, yalnızca acil kan talebi/eşleştirme hizmeti kapsamında ve KVKK m.6/2 uyarınca <strong>açık rızanıza</strong> dayanarak işlenir; başka bir amaçla işlenmez ve pazarlama/profilleme için kullanılmaz. Özel nitelikli verilerin işlenmesinde Kişisel Sağlık Verileri Hakkında Yönetmelik ile Kurul'un "Özel Nitelikli Kişisel Verilerin İşlenmesinde Veri Sorumlularınca Alınması Gereken Yeterli Önlemler" başlıklı kararında öngörülen tedbirler uygulanır: bu veriyi işleyen çalışanlara özel eğitim ve gizlilik taahhüdü, ayrı yetkilendirme ve erişim kayıtları, verinin şifreli ortamda saklanması ve aktarımda kriptografik yöntemler. Açık rızanızı dilediğiniz zaman geri çekebilir, bu durumda kan grubu verinizin silinmesini talep edebilirsiniz.</p>

<h4>5. Toplama Yöntemi ve Otomatik Karar/Profilleme</h4>
<p>Kişisel verileriniz; hangel mobil uygulaması ve web sitesi üzerinden, elektronik formlar, çerezler ve hizmet sağlayıcılar aracılığıyla tamamen veya kısmen otomatik yollarla toplanır. Acil eşleştirmede kan grubu uyumu ve konum yakınlığına göre öncelik gösterilmesi mümkün olmakla birlikte, hakkınızda hukuki sonuç doğuran münhasıran otomatik bir karar verilmez.</p>

<h4>6. Aktarım — Yurt İçi / Yurt Dışı</h4>
<p>Kişisel verileriniz KVKK m.8 uyarınca; yasal yükümlülükler ve hizmetin ifası çerçevesinde yetkili kamu kurum ve kuruluşlarına, ödeme/finans kuruluşlarına, denetim ve danışmanlık hizmeti sağlayanlara ve teknik altyapı/hizmet sağlayıcılarına yurt içinde aktarılabilir. hangel altyapısının Google Cloud / Firebase (Firestore, Authentication, Storage) ve Apple hizmetlerini içermesi nedeniyle veriler yurt dışında işlenebilir; bu aktarımlar <strong>12 Mart 2024 tarihli 7499 sayılı Kanun (ilgili hükümler 1 Haziran 2024'te yürürlüğe girmiştir) ile yeniden düzenlenen KVKK m.9</strong> uyarınca, öncelikle yeterlilik kararı bulunan ülkelere; bunun yokluğunda uygun güvenceler (Kurul'ca onaylı standart sözleşme veya bağlayıcı şirket kuralları) sağlanarak; bu da yoksa m.9'da sayılan arızi haller çerçevesinde gerçekleştirilir. Aktarımlarda gerekli teknik ve idari güvenlik tedbirleri uygulanır.</p>

<h4>7. Saklama Süreleri ve İmha</h4>
<p>Kişisel verileriniz, işleme amacının gerektirdiği ve ilgili mevzuatta öngörülen süreler boyunca saklanır; süre sonunda KVKK m.7 ve Kişisel Verilerin Silinmesi, Yok Edilmesi veya Anonim Hale Getirilmesi Hakkında Yönetmelik uyarınca, en fazla altı aylık periyodik imha süreçleriyle silinir, yok edilir veya anonim hale getirilir. Örneğin üyelik verileri üyelik ilişkisi boyunca ve sonrasında ilgili zamanaşımı süresince; bağış/mali kayıtlar ilgili mevzuat gereği on yıl; işlem güvenliği logları 5651 sayılı Kanun uyarınca tutulur. Ayrıntılı süreler hangel'in Veri Saklama ve İmha Politikası'nda yer alır.</p>

<h4>8. İlgili Kişi Hakları</h4>
<p>KVKK m.11 uyarınca; kişisel verilerinizin işlenip işlenmediğini öğrenme, işlenmişse buna ilişkin bilgi talep etme, işlenme amacını ve amaca uygun kullanılıp kullanılmadığını öğrenme, yurt içinde/dışında aktarıldığı üçüncü kişileri bilme, eksik/yanlış işlenmiş verilerin düzeltilmesini, KVKK m.7 şartlarında silinmesini/yok edilmesini ve bunların aktarıldığı üçüncü kişilere bildirilmesini isteme, işlenen verilerin münhasıran otomatik sistemlerle analizine itiraz etme ve zarara uğramanız halinde tazminat talep etme haklarına sahipsiniz.</p>

<h4>9. Başvuru ve Şikâyet Mercii</h4>
<p>Haklarınıza ilişkin başvurularınızı KVKK m.13 uyarınca <a href="mailto:kvkk@hangel.org">kvkk@hangel.org</a> adresi üzerinden veya yazılı olarak iletebilirsiniz. hangel, başvurunuzu talebin niteliğine göre en kısa sürede ve en geç <strong>30 gün</strong> içinde ücretsiz olarak sonuçlandırır; işlemin ayrıca bir maliyet gerektirmesi halinde Kurul'ca belirlenen tarifedeki ücret alınabilir. Başvurunuzun reddi veya yetersiz yanıtlanması halinde Kişisel Verileri Koruma Kurulu'na şikâyette bulunabilirsiniz.</p>

<h4>10. Veri Güvenliği Tedbirleri</h4>
<p>hangel, KVKK m.12 uyarınca kişisel verilerin hukuka aykırı işlenmesini ve verilere hukuka aykırı erişilmesini önlemek ile muhafazasını sağlamak amacıyla uygun teknik ve idari tedbirleri uygular. Bu tedbirler; aktarımda ve saklamada şifreleme, erişim yetki matrisi ve en az yetki ilkesi, çok faktörlü kimlik doğrulama, günlük (log) kaydı ve izleme, gizlilik taahhütnameleri, çalışan farkındalık eğitimleri ve düzenli güncellenen erişim kontrolleridir. hangel, veri işleyenlerle KVKK ve GDPR Art.28 çerçevesinde sözleşmeler akdeder. Veri ihlali halinde KVKK m.12/5 ve Kurul kararı 2019/10 uyarınca Kurul'a en kısa sürede (en geç 72 saat içinde) ve ilgili kişilere makul en kısa sürede bildirim yapılır.</p>

<h4>11. Çerezler</h4>
<p>Teknik gerekliliklerin yanı sıra tercih ve analiz amaçlı çerez kullanımı ve onay mekanizmasına ilişkin detaylar ayrı Çerez Politikası'nda yer almaktadır.</p>

<h4>12. Değişiklik ve Yürürlük</h4>
<p>Bu Aydınlatma Metni, mevzuat ve hizmet kapsamı değişikliklerine bağlı olarak güncellenebilir. Güncel metin platformda yayımlandığı anda yürürlüğe girer.</p>

<p class="text-xs text-muted-foreground"><em>Bu metin bilgilendirme amaçlıdır ve bağlayıcı nihai hukuki görüş niteliği taşımaz; yürürlük öncesi yetkili hukuk danışmanlığı önerilir.</em></p>
    `
  },
  {
    slug: 'acik-riza-metni',
    title: 'Açık Rıza Metni',
    content: `
      <h3>Açık Rıza Metni</h3>

<p>İşbu Açık Rıza Metni, <strong>hangel AŞ</strong> ("hangel") tarafından sunulan hizmetler kapsamında, 6698 sayılı Kişisel Verilerin Korunması Kanunu'nun ("KVKK") m.3/1-(a) maddesinde tanımlanan <strong>açık rıza</strong> (belirli bir konuya ilişkin, bilgilendirmeye dayanan ve özgür iradeyle açıklanan onay) esasına dayanarak hazırlanmıştır. Bu metin, ilgili Aydınlatma Metni'ni okuduğunuzu varsayar ve yalnızca açık rıza gerektiren işlemler bakımından onayınızı kapsar. Açık rıza vermeniz, hizmetin temel kullanımı için ön koşul değildir; rıza gerektirmeyen işlemler KVKK m.5/2 ve GDPR Art.6(1)(b)(c)(f) gibi diğer hukuki dayanaklara göre yürütülür.</p>

<h4>1. Açık Rızanın Hukuki Niteliği</h4>
<p>Açık rıza, KVKK m.3/1-(a)'da "belirli bir konuya ilişkin, bilgilendirilmeye dayanan ve özgür iradeyle açıklanan onay" olarak tanımlanır. KVKK m.5/1 uyarınca kişisel veriler kural olarak ilgili kişinin açık rızası ile işlenebilir; m.6/2 uyarınca özel nitelikli verilerden sağlık verisinin ilgili kişinin rızası dışındaki hâllerde işlenmesi sıkı şartlara bağlı olduğundan, hangel kan grubu verisini <strong>açık rıza</strong> temelinde işlemeyi tercih etmektedir. GDPR bakımından rıza, Art.4(11)'de "serbestçe verilen, belirli, bilgilendirilmiş ve açık irade beyanı" olarak tanımlanır; Art.7 rızanın koşullarını, Art.9(2)(a) ise özel nitelikli veri için "açık (explicit) rıza"yı düzenler. Bu metin, söz konusu hukuki çerçeveye uygun olarak yapılandırılmıştır.</p>

<h4>2. Açık Rızanın Kapsamı ve Konusu</h4>
<p>Aşağıdaki işlemler, ayrı ayrı verilecek açık rızanıza tabidir:</p>
<table class="w-full border-collapse border border-gray-200 my-4">
<thead>
<tr>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Rıza Konusu</th>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Hukuki Dayanak</th>
</tr>
</thead>
<tbody>
<tr><td class="border border-gray-200 p-2 text-sm"><strong>Kan grubu</strong> (sağlık verisi) işlenmesi ve acil kan eşleştirmesinde kullanılması</td><td class="border border-gray-200 p-2 text-sm">KVKK m.6/2; GDPR Art.9(2)(a)</td></tr>
<tr><td class="border border-gray-200 p-2 text-sm">Pazarlama ve ticari elektronik ileti gönderimi</td><td class="border border-gray-200 p-2 text-sm">KVKK m.5/1; GDPR Art.6(1)(a), Art.7</td></tr>
<tr><td class="border border-gray-200 p-2 text-sm">Kan grubu/iletişim verisinin eşleşen talep sahibiyle paylaşılması</td><td class="border border-gray-200 p-2 text-sm">KVKK m.6/2; GDPR Art.9(2)(a)</td></tr>
</tbody>
</table>

<h4>3. Özel Nitelikli (Sağlık) Verisine İlişkin Açık Rıza</h4>
<p><strong>Kan grubu</strong> bilgisi KVKK m.6 ve GDPR Art.9 anlamında özel nitelikli sağlık verisidir. hangel'in acil kan talebi/eşleştirme hizmetinden yararlanabilmeniz için kan grubu verinizin işlenmesi gereklidir ve bu işleme yalnızca KVKK m.6/2 ile GDPR Art.9(2)(a) uyarınca <strong>açık rızanıza</strong> dayanır. Açık rızanız;</p>
<ul>
<li>kan grubu bilgisinin kaydedilmesini ve güvenli şekilde (şifreli ve erişimi sınırlandırılmış biçimde) saklanmasını,</li>
<li>uyumlu acil kan talebi olduğunda eşleştirme amacıyla işlenmesini ve gerektiğinde talep sahibi/yetkili sağlık ekibiyle paylaşılmasını,</li>
<li>yalnızca bu amaçla, ölçülü ve gerekli olduğu süreyle sınırlı biçimde kullanılmasını kapsar.</li>
</ul>
<p>Bu veri, açıkça belirtilen amaçlar dışında işlenmez, profilleme veya pazarlama amacıyla kullanılmaz ve açık rızanız dışında üçüncü kişilere aktarılmaz. Kan grubu verisinin işlenmesine rıza vermemeniz halinde acil kan eşleştirme özelliğinden yararlanamazsınız; ancak bu durum bağış, gönüllülük gibi diğer hizmetlere erişiminizi etkilemez.</p>

<h4>4. Pazarlama İletişimine İlişkin Açık Rıza</h4>
<p>Kampanya, etkinlik, bağış çağrıları ve duyurulara ilişkin ticari elektronik iletilerin e-posta, SMS veya uygulama bildirimi yoluyla gönderilmesi açık rızanıza tabidir. Bu rıza, KVKK m.5/1 ve GDPR Art.6(1)(a)'nın yanı sıra 6563 sayılı Elektronik Ticaretin Düzenlenmesi Hakkında Kanun ve Ticari İletişim ve Ticari Elektronik İletiler Hakkında Yönetmelik kapsamındaki onay yükümlülüğüyle de uyumlu olup, gönderimler İleti Yönetim Sistemi (İYS) üzerinden kayıt altına alınır. Pazarlama rızası vermemeniz, kan eşleştirme veya bağış gibi temel hizmetlerden yararlanmanıza engel değildir; bu izni dilediğiniz zaman ileti içindeki ret bağlantısı veya İYS üzerinden geri alabilirsiniz.</p>

<h4>5. Özgür İrade, Ayrı Rıza ve Bilgilendirme İlkesi</h4>
<p>Açık rızanız KVKK m.3/1-(a) gereği özgür iradenizle, belirli bir konuya ilişkin ve bilgilendirmeye dayalı olarak alınır. hangel; her rıza konusunu (kan grubu işleme, pazarlama, üçüncü kişiyle paylaşım) <strong>ayrı ayrı</strong> ve birbirine bağlanmadan, ön işaretli (pre-ticked) kutu kullanılmaksızın aktif bir tercihle sunar; rıza, hizmetin sunulmasının ön koşulu haline getirilmez. Bu yaklaşım GDPR Art.7'deki "rızanın serbestçe verilmesi", "talebin diğer hususlardan ayrılabilir ve anlaşılır biçimde sunulması" ve "rızanın ispatı yükünün veri sorumlusunda olması" ilkeleriyle uyumludur. hangel, alınan rızaların kanıtını (tarih, kapsam, yöntem) kayıt altında tutar.</p>

<h4>6. Rızanın Geri Çekilmesi</h4>
<p>Verdiğiniz açık rızayı KVKK ve GDPR Art.7(3) uyarınca <strong>dilediğiniz zaman, hiçbir gerekçe göstermeksizin</strong> geri çekebilirsiniz. Geri çekme; uygulama ayarları üzerinden veya <a href="mailto:kvkk@hangel.org">kvkk@hangel.org</a> (TR) ya da <a href="mailto:privacy@hangel.org">privacy@hangel.org</a> (AB) adresine başvuru yoluyla yapılabilir. Rızanın geri çekilmesi, geri çekme tarihinden itibaren ileriye etkili sonuç doğurur; geri çekme öncesinde gerçekleştirilen işlemlerin hukukiliğini etkilemez. Rıza geri çekildiğinde ilgili veriler, başka bir işleme şartı yoksa KVKK m.7 uyarınca silinir, yok edilir veya anonim hale getirilir.</p>

<h4>7. Saklama ve Aktarım</h4>
<p>Açık rızaya dayalı verileriniz, rızanın geçerli olduğu süre boyunca ve geri çekilene ya da işleme amacı ortadan kalkana kadar saklanır; ayrıntılı süreler hangel'in Veri Saklama ve İmha Politikası'nda yer alır. Yurt dışı aktarım söz konusu olduğunda (örneğin Google Cloud / Firebase ve Apple altyapısı), aktarım 7499 sayılı Kanun ile değişik KVKK m.9 (yeterlilik kararı, uygun güvenceler — standart sözleşme/bağlayıcı şirket kuralları — veya arızi haller silsilesi) ve GDPR Art.44-49'daki güvence mekanizmalarına uygun olarak yapılır.</p>

<h4>8. Açık Rıza Gerektirmeyen İşlemler</h4>
<p>KVKK m.5/2 ve GDPR Art.6(1)(b)(c)(f) uyarınca; sözleşmenin kurulması/ifası, hukuki yükümlülüklerin yerine getirilmesi ve hangel'in meşru menfaatleri gibi işleme şartlarına dayanan faaliyetler (örneğin üyelik yönetimi, bağış makbuzu düzenleme, güvenlik) için ayrıca açık rıza aranmaz. Bu metindeki rızanın geri çekilmesi, anılan diğer hukuki dayanaklara göre yürütülen işlemleri sona erdirmez.</p>

<h4>9. Beyan ve Onay</h4>
<p>Yukarıdaki açıklamaları okuduğumu, ilgili Aydınlatma Metni ile bilgilendirildiğimi; özel nitelikli sağlık verim olan <strong>kan grubu</strong> bilgimin acil kan eşleştirme amacıyla işlenmesine ve seçtiğim ölçüde pazarlama iletişimine, özgür irademle ve her birini ayrı ayrı değerlendirerek açık rıza verdiğimi; bu rızayı dilediğim zaman geri çekebileceğimi bildiğimi kabul ve beyan ederim.</p>

<p class="text-xs text-muted-foreground"><em>Bu metin bilgilendirme amaçlıdır ve bağlayıcı nihai hukuki görüş niteliği taşımaz; yürürlük öncesi yetkili hukuk danışmanlığı önerilir.</em></p>
    `
  },
  {
    slug: 'veri-saklama-ve-imha-politikasi',
    title: 'Veri Saklama ve İmha Politikası',
    content: `
      <h3>Veri Saklama ve İmha Politikası</h3>

<p>İşbu Veri Saklama ve İmha Politikası, <strong>hangel AŞ</strong> ("hangel") tarafından, 6698 sayılı Kişisel Verilerin Korunması Kanunu'nun ("KVKK") <strong>7. maddesi</strong>, Kişisel Verilerin Silinmesi, Yok Edilmesi veya Anonim Hale Getirilmesi Hakkında Yönetmelik ve Avrupa Birliği Genel Veri Koruma Tüzüğü'nün (GDPR (EU) 2016/679) <strong>Art.5(1)(e) "saklama süresi sınırlaması" (storage limitation)</strong> ilkesi uyarınca, kişisel verilerin saklanmasına ve imhasına ilişkin usul ve esasları belirlemek amacıyla hazırlanmıştır.</p>

<h4>1. Amaç ve Kapsam</h4>
<p>Bu Politika; hangel'in acil kan eşleştirme, bağış, gönüllülük, üyelik ve etki raporlama hizmetleri kapsamında işlediği tüm kişisel verilerin azami saklama sürelerini, imha yöntemlerini ve periyodik imha sürecini düzenler. Veriler yalnızca işlendikleri amaç için gerekli olan süre boyunca ve ilgili mevzuatta öngörülen asgari saklama/zamanaşımı süreleri kadar muhafaza edilir. Politika, hem fiziksel hem de elektronik ortamlardaki kişisel verileri; hangel'in veri sorumlusu sıfatıyla tuttuğu tüm sistemleri, yedekleme ortamlarını ve veri işleyenler nezdinde bulunan kopyaları kapsar. Bu Politika, Kişisel Verilerin Silinmesi, Yok Edilmesi veya Anonim Hale Getirilmesi Hakkında Yönetmelik anlamında hangel'in "kişisel veri saklama ve imha politikası" işlevini görür.</p>

<h4>1.1. Genel İlkeler</h4>
<p>Saklama ve imha faaliyetleri, KVKK m.4'teki genel ilkelerle uyumlu yürütülür: hukuka ve dürüstlük kurallarına uygunluk, doğruluk ve güncellik, belirli/açık/meşru amaç, amaçla bağlantılı-sınırlı-ölçülü olma ve <strong>ilgili mevzuatta öngörülen veya işlendikleri amaç için gerekli olan süre kadar muhafaza</strong>. GDPR Art.5(1)(e) "storage limitation" ilkesi de aynı doğrultuda, verilerin gereğinden uzun süre kimliği belirlenebilir formatta tutulmamasını gerektirir.</p>

<h4>2. Saklamayı Gerektiren Hukuki Sebepler</h4>
<p>Kişisel veriler; KVKK m.5 ve m.6'daki işleme şartlarının devamı, sözleşmesel ilişkinin sürmesi, mali ve vergisel yükümlülükler (213 sayılı Vergi Usul Kanunu ve 6102 sayılı Türk Ticaret Kanunu uyarınca ilgili defter/belgeler için on yıllık saklama), Türk Borçlar Kanunu'ndaki genel zamanaşımı süreleri ve 5651 sayılı Kanun kapsamındaki trafik bilgisi yükümlülükleri gibi sebeplerle saklanır.</p>

<h4>3. Kategori Bazlı Saklama Süreleri</h4>
<table class="w-full border-collapse border border-gray-200 my-4">
<thead>
<tr>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Veri Kategorisi</th>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Saklama Süresi</th>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Gerekçe</th>
</tr>
</thead>
<tbody>
<tr><td class="border border-gray-200 p-2 text-sm">Üyelik / hesap verileri</td><td class="border border-gray-200 p-2 text-sm">Üyelik süresince + 10 yıl</td><td class="border border-gray-200 p-2 text-sm">TBK zamanaşımı</td></tr>
<tr><td class="border border-gray-200 p-2 text-sm"><strong>Kan grubu (sağlık verisi)</strong></td><td class="border border-gray-200 p-2 text-sm">Açık rıza geçerli olduğu sürece; geri çekilince derhal imha</td><td class="border border-gray-200 p-2 text-sm">KVKK m.6/2 açık rıza</td></tr>
<tr><td class="border border-gray-200 p-2 text-sm">Bağış / finansal işlem ve makbuz</td><td class="border border-gray-200 p-2 text-sm">İşlem tarihinden itibaren 10 yıl</td><td class="border border-gray-200 p-2 text-sm">VUK ve TTK saklama</td></tr>
<tr><td class="border border-gray-200 p-2 text-sm">İşlem güvenliği / log kayıtları</td><td class="border border-gray-200 p-2 text-sm">2 yıl</td><td class="border border-gray-200 p-2 text-sm">5651 sayılı Kanun</td></tr>
<tr><td class="border border-gray-200 p-2 text-sm">Pazarlama izinleri ve kayıtları</td><td class="border border-gray-200 p-2 text-sm">İzin geri alınana kadar + 3 yıl</td><td class="border border-gray-200 p-2 text-sm">İspat/uyum (İYS, 6563)</td></tr>
<tr><td class="border border-gray-200 p-2 text-sm">Çerez verileri</td><td class="border border-gray-200 p-2 text-sm">Çerez türüne göre oturum süresi – azami 12 ay</td><td class="border border-gray-200 p-2 text-sm">Çerez Politikası</td></tr>
<tr><td class="border border-gray-200 p-2 text-sm">İlgili kişi başvuru kayıtları</td><td class="border border-gray-200 p-2 text-sm">Başvuru tarihinden itibaren 3 yıl</td><td class="border border-gray-200 p-2 text-sm">KVKK m.13 uyum/ispat</td></tr>
</tbody>
</table>
<p>Süreler, ilgili mevzuatta değişiklik olması veya Kurul kararıyla farklı süre belirlenmesi halinde güncellenir.</p>

<h4>4. İmha Yöntemleri</h4>
<p>Saklama süresi sona eren veya işleme şartları ortadan kalkan kişisel veriler, Yönetmelik'te öngörülen aşağıdaki yöntemlerle imha edilir:</p>
<ul>
<li><strong>Silme:</strong> Verilerin ilgili kullanıcılar için hiçbir şekilde erişilemez ve tekrar kullanılamaz hale getirilmesi (örneğin veri tabanı kaydının ve yetkilerinin kaldırılması, dosyanın işletim sistemi düzeyinde geri getirilemeyecek biçimde silinmesi).</li>
<li><strong>Yok etme:</strong> Verilerin hiç kimse tarafından hiçbir şekilde erişilemez, geri getirilemez ve tekrar kullanılamaz hale getirilmesi (fiziksel ortamların kâğıt imha makineleriyle imhası, manyetik/optik medyanın üzerine yazma, manyetikten arındırma — degauss — veya fiziksel olarak parçalama yöntemleriyle güvenli silinmesi).</li>
<li><strong>Anonim hale getirme:</strong> Verilerin başka verilerle eşleştirilse dahi hiçbir surette kimliği belirli/belirlenebilir bir gerçek kişiyle ilişkilendirilemeyecek hale getirilmesi (maskeleme, değişken çıkarma, toplulaştırma, genelleştirme ve türetme teknikleri). Anonim hale getirilen veriler, kişisel veri niteliğini kaybettiğinden istatistik ve etki raporlaması gibi amaçlarla kullanılabilir.</li>
</ul>
<p>Bulut ve yedekleme ortamlarında yer alan veriler için, teknik olarak anında silmenin mümkün olmadığı hallerde, ilgili veriler erişime kapatılır ve ilk yedek döngüsünde kalıcı olarak imha edilir; bu süreçte de erişim kısıtlanır.</p>

<h4>5. Periyodik İmha</h4>
<p>Yönetmelik m.11 uyarınca, hangel periyodik imha süresini <strong>6 aylık (Haziran ve Aralık)</strong> aralıklarla uygular. İşleme şartları ortadan kalkan veriler, ilk periyodik imha döneminde silinir, yok edilir veya anonim hale getirilir; ilgili kişinin talebi halinde ise talebin alınmasından itibaren KVKK m.13'teki süre içinde işlem yapılır. Periyodik imha işlemleri kayıt altına alınır.</p>

<h4>6. Yurt Dışı Saklama ve Altyapı</h4>
<p>hangel altyapısı Google Cloud / Firebase (Firestore, Storage) ve Apple hizmetlerini içermesi nedeniyle veriler yurt dışındaki sunucularda saklanabilir. Bu durumda yurt dışı aktarım ve saklama, 7499 sayılı Kanun ile değişik KVKK m.9 ve GDPR Art.44-49 uyarınca uygun güvencelerle yürütülür; saklama süreleri sona erdiğinde aynı imha yöntemleri bu ortamlarda da uygulanır.</p>

<h4>7. İlgili Kişinin Silme Talebi Üzerine İmha</h4>
<p>İlgili kişi, KVKK m.11 ve m.13 uyarınca verilerinin silinmesini veya yok edilmesini talep ettiğinde; işleme şartlarının tamamı ortadan kalkmışsa veriler talebin alınmasını izleyen en geç <strong>30 gün</strong> içinde silinir, yok edilir veya anonim hale getirilir ve sonuç ilgili kişiye bildirilir. Verilerin aktarıldığı üçüncü kişiler nezdinde de aynı işlemin yapılması için gerekli teknik ve idari tedbirler alınır. İşleme şartlarının bir kısmı devam ediyorsa (örneğin yasal saklama süresi), talep gerekçesiyle reddedilebilir veya ilgili veri yalnızca saklanmaya devam edilip diğer amaçlarla işlenmesi durdurulur.</p>

<h4>8. Roller ve Sorumluluklar</h4>
<p>Saklama ve imha süreçlerinin yönetiminden hangel'in veri koruma sorumlusu/irtibat kişisi ve ilgili birim yöneticileri sorumludur. İmha kararları ve periyodik imha işlemleri tarih, kapsam ve yöntem bilgisiyle kayıt altına alınır ve denetlenebilir tutulur; bu kayıtlar en az üç yıl saklanır. İlgili kişi talepleri <a href="mailto:kvkk@hangel.org">kvkk@hangel.org</a> üzerinden yönetilir. hangel çalışanları, saklama sürelerine ve imha kurallarına uymakla yükümlü olup bu konuda düzenli olarak bilgilendirilir.</p>

<h4>9. Değişiklik ve Yürürlük</h4>
<p>Bu Politika, mevzuat değişiklikleri ve Kurul kararları doğrultusunda gözden geçirilir ve güncellenir. Saklama sürelerinde yapılan değişiklikler, halihazırda saklanan veriler bakımından da uygulanır. Güncel metin platformda yayımlandığı tarihte yürürlüğe girer ve önceki sürümlerin yerini alır.</p>

<p class="text-xs text-muted-foreground"><em>Bu metin bilgilendirme amaçlıdır ve bağlayıcı nihai hukuki görüş niteliği taşımaz; yürürlük öncesi yetkili hukuk danışmanlığı önerilir.</em></p>
    `
  },
  {
    slug: 'gdpr-uyum-politikasi',
    title: 'AB Genel Veri Koruma Tüzüğü (GDPR) Uyum Politikası',
    content: `
      <h3>AB Genel Veri Koruma Tüzüğü (GDPR) Uyum Politikası</h3>

<p>Bu politika, hangel platformunun Avrupa Birliği (AB) Genel Veri Koruma Tüzüğü <strong>(EU) 2016/679 (GDPR)</strong> kapsamına giren kişisel veri işleme faaliyetlerine ilişkin uyum çerçevesini ortaya koyar. hangel, Türkiye merkezli bir toplumsal etki platformu olmakla birlikte; AB'de yerleşik kullanıcılara doğrudan hizmet sunması veya AB'de bulunan veri sahiplerinin davranışlarını izlemesi hâlinde, GDPR md.3/2 uyarınca Tüzüğün ülke dışı (extraterritorial) etki alanına girebilir. Bu durumda işbu politikada belirtilen ilke ve yükümlülükler uygulanır.</p>

<h4>1. Veri Sorumlusu Kimliği ve AB Temsilcisi (Art. 27)</h4>
<p>İşleme faaliyetlerinin veri sorumlusu <strong>hangel AŞ</strong>'dir. GDPR Art. 4(7) anlamında veri sorumlusu, işleme amaç ve vasıtalarını belirleyen taraftır. hangel, GDPR Art. 27 uyarınca, Birlikte yerleşik olmayan veri sorumlusunun bir AB üye devletinde yazılı yetkiyle <strong>AB temsilcisi</strong> atama yükümlülüğünün doğabileceğini kabul eder. AB temsilcisi; denetim makamları ve veri sahipleri tarafından, işlemeye ilişkin tüm konularda muhatap alınmak üzere görevlendirilir ve bir irtibat noktası işlevi görür; sorumluluk veri sorumlusunda kalır. Art. 27(2) istisnası (büyük ölçekli özel nitelikli/ceza verisi içermeyen ve risk taşımayan arızi işleme) saklıdır. İletişim: <a href="mailto:privacy@hangel.org">privacy@hangel.org</a> ve <a href="mailto:dpo@hangel.org">dpo@hangel.org</a>.</p>

<h4>2. İşleme İlkeleri (Art. 5)</h4>
<p>hangel, tüm işleme faaliyetlerini GDPR Art. 5'te sayılan temel ilkelere uygun yürütmeyi taahhüt eder:</p>
<ul>
<li><strong>Hukukilik, adillik ve şeffaflık</strong> (Art. 5/1-a),</li>
<li><strong>Amaçla sınırlılık</strong> (Art. 5/1-b),</li>
<li><strong>Veri minimizasyonu</strong> (Art. 5/1-c),</li>
<li><strong>Doğruluk</strong> (Art. 5/1-d),</li>
<li><strong>Saklama sınırlılığı</strong> (Art. 5/1-e),</li>
<li><strong>Bütünlük ve gizlilik</strong> (Art. 5/1-f),</li>
<li><strong>Hesap verebilirlik</strong> (Art. 5/2) — uyumu gösterebilme yükümlülüğü.</li>
</ul>

<h4>3. İşlemenin Hukuki Dayanakları (Art. 6 ve Art. 9)</h4>
<p>Her işleme faaliyeti Art. 6/1'de sayılan en az bir hukuki dayanağa oturtulur. Kan grubu gibi <strong>özel nitelikli (sağlık) verileri</strong>, Art. 9/1 gereği kural olarak yasaktır ve yalnızca Art. 9/2'deki bir istisna (özellikle <em>açık rıza</em> — Art. 9/2-a) mevcutsa işlenir.</p>
<table class="w-full border-collapse border border-gray-200 my-4">
<thead>
<tr>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">İşleme Amacı</th>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Hukuki Dayanak</th>
</tr>
</thead>
<tbody>
<tr><td class="border border-gray-200 p-2 text-sm">Üyelik ve hesap yönetimi</td><td class="border border-gray-200 p-2 text-sm">Sözleşmenin ifası — Art. 6/1-b</td></tr>
<tr><td class="border border-gray-200 p-2 text-sm">Kan grubu / acil kan eşleştirme</td><td class="border border-gray-200 p-2 text-sm">Açık rıza — Art. 6/1-a + Art. 9/2-a</td></tr>
<tr><td class="border border-gray-200 p-2 text-sm">Yasal yükümlülüklerin yerine getirilmesi</td><td class="border border-gray-200 p-2 text-sm">Hukuki yükümlülük — Art. 6/1-c</td></tr>
<tr><td class="border border-gray-200 p-2 text-sm">Güvenlik, dolandırıcılık önleme, hizmet iyileştirme</td><td class="border border-gray-200 p-2 text-sm">Meşru menfaat — Art. 6/1-f</td></tr>
<tr><td class="border border-gray-200 p-2 text-sm">Pazarlama ve ticari elektronik ileti</td><td class="border border-gray-200 p-2 text-sm">Açık rıza — Art. 6/1-a</td></tr>
</tbody>
</table>

<h4>4. Veri Sahibi Hakları (Art. 12-22)</h4>
<p>hangel, AB'de bulunan veri sahiplerinin aşağıdaki haklarını kullanmasını kolaylaştırır ve talepleri kural olarak bir ay içinde yanıtlar (Art. 12/3):</p>
<ul>
<li><strong>Şeffaf bilgilendirme</strong> — Art. 12, Art. 13-14,</li>
<li><strong>Erişim hakkı</strong> — Art. 15,</li>
<li><strong>Düzeltme hakkı</strong> — Art. 16,</li>
<li><strong>Silme / "unutulma" hakkı</strong> — Art. 17,</li>
<li><strong>İşlemenin kısıtlanması</strong> — Art. 18,</li>
<li><strong>Düzeltme/silme/kısıtlamanın bildirimi</strong> — Art. 19,</li>
<li><strong>Veri taşınabilirliği</strong> — Art. 20,</li>
<li><strong>İtiraz hakkı</strong> (doğrudan pazarlama dâhil) — Art. 21,</li>
<li><strong>Otomatik bireysel karar ve profillemeye tabi olmama</strong> — Art. 22.</li>
</ul>

<h4>5. Veri Güvenliği (Art. 32)</h4>
<p>hangel, Art. 32 uyarınca riske uygun teknik ve idari tedbirleri (uygun olduğunda takma adlandırma ve şifreleme; gizlilik, bütünlük, erişilebilirlik ve dayanıklılığın sağlanması; düzenli test ve değerlendirme) almayı taahhüt eder. Altyapı, Google Cloud / Firebase ve Apple hizmetleri üzerinde işletilmektedir.</p>

<h4>6. Veri İhlali Bildirimi (Art. 33-34)</h4>
<p>Kişisel veri ihlali hâlinde hangel, ihlali öğrenmesinden itibaren mümkünse <strong>72 saat içinde</strong> yetkili denetim makamına bildirir (Art. 33). İhlalin gerçek kişilerin hak ve özgürlükleri açısından yüksek risk doğurması hâlinde, ilgili veri sahipleri gecikmeksizin bilgilendirilir (Art. 34).</p>

<h4>7. Veri Koruma Etki Değerlendirmesi (Art. 35)</h4>
<p>Yüksek risk taşıyan işleme türleri için (özellikle özel nitelikli sağlık verisinin büyük ölçekli işlenmesi), hangel işleme öncesinde <strong>Veri Koruma Etki Değerlendirmesi (DPIA)</strong> yürütmeyi Art. 35 kapsamında taahhüt eder.</p>

<h4>8. Veri Koruma Görevlisi (Art. 37-39)</h4>
<p>GDPR Art. 37'de sayılan koşulların oluşması hâlinde hangel bir <strong>Veri Koruma Görevlisi (DPO)</strong> atar. DPO'nun görevleri Art. 39 uyarınca bilgilendirme/danışmanlık, uyumun izlenmesi, DPIA'ya görüş verme ve denetim makamıyla işbirliğini kapsar. İrtibat: <a href="mailto:dpo@hangel.org">dpo@hangel.org</a>.</p>

<h4>9. Yurt Dışına Aktarım (Art. 44-49)</h4>
<p>AB/AEA dışına yapılacak aktarımlarda hangel, sırasıyla <strong>yeterlilik kararı</strong> (Art. 45), <strong>uygun güvenceler</strong> — özellikle Standart Sözleşme Hükümleri (SCC) ve Bağlayıcı Şirket Kuralları (Art. 46-47) — ve istisnai hâllerde Art. 49'daki özel durumlara dayanır.</p>

<h4>10. Rıza Yönetimi (Art. 7)</h4>
<p>Rızaya dayanan işlemelerde hangel, GDPR Art. 7 koşullarına uyar: rıza özgür, belirli, bilgilendirilmiş ve açık irade beyanıyla verilir; rızanın varlığı ispatlanabilir biçimde kayıt altına alınır; talep diğer hususlardan ayırt edilebilir ve anlaşılır biçimde sunulur; ve rıza <strong>her zaman, vermek kadar kolay biçimde geri alınabilir</strong>. Rızanın geri alınması, geri alma anına kadar gerçekleşen işlemenin hukukiliğini etkilemez.</p>

<h4>11. Hesap Verebilirlik ve Kayıt Tutma (Art. 5/2, Art. 30)</h4>
<p>hangel, hesap verebilirlik ilkesi gereği uyumu gösterebilmek için; işleme faaliyetleri kaydını (Art. 30), veri koruma politikalarını, rıza kayıtlarını ve gerektiğinde DPIA dokümantasyonunu tutmayı taahhüt eder. Tasarımdan ve varsayılandan veri koruma (data protection by design and by default — Art. 25) ilkesi, ürün ve süreç tasarımında esas alınır.</p>

<h4>12. Şikâyet Hakkı ve Yürürlük (Art. 77)</h4>
<p>Veri sahipleri, GDPR Art. 77 uyarınca, mutad meskenlerinin, çalışma yerlerinin veya iddia edilen ihlalin gerçekleştiği yerin bulunduğu üye devletin <strong>denetim makamına şikâyette bulunma</strong> hakkına sahiptir; bu, idari ve adli başvuru yollarına (Art. 78-79) halel getirmez. Bu politika, platformda yayımlandığı tarihte yürürlüğe girer ve mevzuat ile işleme faaliyetlerindeki gelişmelere göre güncellenir.</p>

<p class="text-xs text-muted-foreground"><em>Bu metin bilgilendirme amaçlıdır ve bağlayıcı nihai hukuki görüş niteliği taşımaz; yürürlük öncesi yetkili hukuk danışmanlığı önerilir.</em></p>
    `
  },
  {
    slug: 'veri-isleme-amaclar-beyani',
    title: 'Veri İşleme Amaçları ve Hukuki Dayanaklar Beyanı',
    content: `
      <h3>Veri İşleme Amaçları ve Hukuki Dayanaklar Beyanı</h3>

<p>Bu beyan, hangel platformunun kişisel verileri hangi amaçlarla ve hangi hukuki dayanaklara istinaden işlediğini şeffaf biçimde ortaya koyar. Beyan, Türkiye bakımından <strong>6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK)</strong>, AB'de bulunan veya AB'den erişen kullanıcılar bakımından ise <strong>Genel Veri Koruma Tüzüğü (EU) 2016/679 (GDPR)</strong> çerçevesinde hazırlanmıştır. Veri sorumlusu <strong>hangel AŞ</strong>'dir.</p>

<h4>1. Genel İlkeler ve Şeffaflık Yükümlülüğü</h4>
<p>hangel, kişisel verileri yalnızca KVKK m.4'te sayılan genel ilkelere (hukuka ve dürüstlük kurallarına uygunluk, doğru ve güncel olma, belirli/açık/meşru amaçlar için işleme, işlendikleri amaçla bağlantılı, sınırlı ve ölçülü olma, mevzuatta öngörülen veya işleme amacının gerektirdiği süreyle saklama) ve GDPR Art. 5'teki muadil ilkelere uygun olarak işler. Aydınlatma yükümlülüğü KVKK m.10/1-b uyarınca, işleme amaçları açıkça beyan edilerek yerine getirilir.</p>

<h4>2. İşleme Şartları (Hukuki Dayanaklar)</h4>
<p>Genel nitelikli kişisel veriler, KVKK m.5'te (açık rıza veya m.5/2'deki istisnalar) ve GDPR Art. 6/1'de sayılan şartlardan en az birine; <strong>özel nitelikli veriler</strong> (özellikle kan grubu / sağlık verisi) ise KVKK m.6 ve GDPR Art. 9'daki daha sıkı şartlara dayanılarak işlenir. Sağlık verisi kural olarak yalnızca <strong>açık rıza</strong> ile işlenir.</p>

<h4>3. Amaç ↔ Hukuki Dayanak Tablosu</h4>
<p>Aşağıdaki tablo, her temel işleme amacını ilgili hukuki dayanaklarla eşleştirir:</p>
<table class="w-full border-collapse border border-gray-200 my-4">
<thead>
<tr>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">İşleme Amacı</th>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">KVKK Dayanağı</th>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">GDPR Dayanağı</th>
</tr>
</thead>
<tbody>
<tr><td class="border border-gray-200 p-2 text-sm">Üyelik tesisi, hesap ve hizmet yönetimi</td><td class="border border-gray-200 p-2 text-sm">Sözleşmenin kurulması/ifası — m.5/2-c</td><td class="border border-gray-200 p-2 text-sm">Art. 6/1-b</td></tr>
<tr><td class="border border-gray-200 p-2 text-sm">Acil kan talebi ve kan grubu eşleştirme</td><td class="border border-gray-200 p-2 text-sm">Açık rıza — m.6/2</td><td class="border border-gray-200 p-2 text-sm">Art. 9/2-a (+ Art. 6/1-a)</td></tr>
<tr><td class="border border-gray-200 p-2 text-sm">Bağış ve affiliate aktarım işlemleri</td><td class="border border-gray-200 p-2 text-sm">Sözleşmenin ifası — m.5/2-c</td><td class="border border-gray-200 p-2 text-sm">Art. 6/1-b</td></tr>
<tr><td class="border border-gray-200 p-2 text-sm">Mali kayıt, fatura, vergi yükümlülükleri</td><td class="border border-gray-200 p-2 text-sm">Hukuki yükümlülük — m.5/2-ç</td><td class="border border-gray-200 p-2 text-sm">Art. 6/1-c</td></tr>
<tr><td class="border border-gray-200 p-2 text-sm">Güvenlik, dolandırıcılık önleme, log kaydı</td><td class="border border-gray-200 p-2 text-sm">Meşru menfaat — m.5/2-f</td><td class="border border-gray-200 p-2 text-sm">Art. 6/1-f</td></tr>
<tr><td class="border border-gray-200 p-2 text-sm">Hak tesisi ve yasal taleplere karşı savunma</td><td class="border border-gray-200 p-2 text-sm">Hakkın tesisi/korunması — m.5/2-e</td><td class="border border-gray-200 p-2 text-sm">Art. 6/1-f / Art. 9/2-f</td></tr>
<tr><td class="border border-gray-200 p-2 text-sm">Pazarlama, ticari elektronik ileti, bülten</td><td class="border border-gray-200 p-2 text-sm">Açık rıza — m.5/1</td><td class="border border-gray-200 p-2 text-sm">Art. 6/1-a</td></tr>
</tbody>
</table>

<h4>4. Özel Nitelikli Veri — Kan Grubu</h4>
<p>Kan grubu bilgisi, KVKK m.6/1 anlamında sağlığa ilişkin <strong>özel nitelikli kişisel veri</strong> ve GDPR Art. 9/1 anlamında özel kategori veridir. hangel bu veriyi yalnızca acil kan talebi/eşleştirme hizmetini sunmak için, KVKK m.6/2 ve GDPR Art. 9/2-a uyarınca <strong>kullanıcının açık rızasına</strong> dayanarak işler. Rıza her zaman geri alınabilir; geri alma, işlemenin amacının ortadan kalkması hâlinde verinin silinmesini gerektirir.</p>

<h4>5. Meşru Menfaat Dengesi</h4>
<p>Meşru menfaate (m.5/2-f / Art. 6/1-f) dayanan işlemelerde hangel, kendi meşru menfaati ile ilgili kişinin temel hak ve özgürlükleri arasında bir denge testi (LIA) yapar ve menfaatin ilgili kişinin hak ve özgürlüklerine üstün gelmemesi hâlinde bu dayanağa başvurmaz.</p>

<h4>6. Otomatik Karar ve Profilleme</h4>
<p>hangel, kullanıcı üzerinde hukuki sonuç doğuran veya benzer biçimde önemli etki yaratan <strong>tamamen otomatik bireysel kararları</strong> kural olarak uygulamaz. Böyle bir işleme öngörülürse, GDPR Art. 22 ve KVKK m.11/1-g güvenceleri (insan müdahalesi talep etme, görüş bildirme, karara itiraz) sağlanır.</p>

<h4>7. İlgili Kişinin Hakları ve Başvuru</h4>
<p>İlgili kişiler KVKK m.11 ve GDPR Art. 15-22'deki haklarını; Türkiye için <a href="mailto:kvkk@hangel.org">kvkk@hangel.org</a>, uluslararası talepler için <a href="mailto:privacy@hangel.org">privacy@hangel.org</a> üzerinden kullanabilir. Türkiye'de başvuru KVKK m.13'e tabidir; AB'de bulunan veri sahipleri ayrıca Art. 77 uyarınca denetim makamına şikâyet hakkına sahiptir.</p>

<h4>8. Amaçla Bağlılık ve İkincil İşleme</h4>
<p>hangel, kişisel verileri toplandıkları amaçla bağlantılı, sınırlı ve ölçülü biçimde işler (KVKK m.4/2-ç; GDPR Art. 5/1-b ve 5/1-c). Verilerin başlangıçta toplandığı amaçtan farklı bir amaçla (ikincil işleme) kullanılması gündeme geldiğinde, hangel; yeni amacın ilk amaçla bağdaşıp bağdaşmadığını GDPR Art. 6/4'teki uyumluluk kriterleri (amaçlar arası bağlantı, toplama bağlamı, verinin niteliği, olası sonuçlar, uygun güvenceler) çerçevesinde değerlendirir. Bağdaşmayan amaçlar için ayrı bir hukuki dayanak tesis edilir veya gerekli hâllerde yeniden aydınlatma yapılır ve rıza alınır.</p>

<h4>9. Veri Kategorileri ve Kaynaklar</h4>
<p>İşlenen başlıca veri kategorileri; kimlik ve iletişim bilgileri, konum verisi, özel nitelikli sağlık verisi (kan grubu), cihaz/teknik veriler, finansal veriler (IBAN/ödeme) ve pazarlama izinleridir. Veriler büyük ölçüde <strong>doğrudan ilgili kişiden</strong> (kayıt formları, profil, talep/bağış işlemleri) elde edilir; teknik veriler ise platformun kullanımı sırasında otomatik yollarla toplanır. Her kategori için hukuki dayanak, yukarıdaki amaç ↔ dayanak tablosunda gösterilen ilkelere göre belirlenir.</p>

<h4>10. Saklama, İmha ve Güvenlik</h4>
<p>Veriler, işleme amacının gerektirdiği ve mevzuatta öngörülen süreyle saklanır; amaç ortadan kalktığında KVKK m.7 ve GDPR Art. 17 uyarınca silinir, yok edilir veya anonim hâle getirilir. hangel, KVKK m.12 ve GDPR Art. 32 kapsamında riske uygun teknik ve idari güvenlik tedbirlerini uygulamayı taahhüt eder. Ayrıntılı saklama süreleri, hangel'in veri saklama ve imha politikasında düzenlenir.</p>

<h4>11. Değişiklik ve Yürürlük</h4>
<p>İşleme amaçlarındaki değişiklikler bu beyana yansıtılır ve güncel metin platformda yayımlandığı tarihte yürürlüğe girer.</p>

<p class="text-xs text-muted-foreground"><em>Bu metin bilgilendirme amaçlıdır ve bağlayıcı nihai hukuki görüş niteliği taşımaz; yürürlük öncesi yetkili hukuk danışmanlığı önerilir.</em></p>
    `
  },
  {
    slug: 'kullanici-haklari-politikasi',
    title: 'Kullanıcı Hakları Politikası',
    content: `
      <h3>Kullanıcı Hakları Politikası</h3>

<p>İşbu Kullanıcı Hakları Politikası, <strong>hangel AŞ</strong> ("hangel") tarafından, 6698 sayılı Kişisel Verilerin Korunması Kanunu'nun ("KVKK") <strong>m.11 (ilgili kişinin hakları)</strong> ve <strong>m.13 (veri sorumlusuna başvuru)</strong> hükümleri ile Avrupa Birliği Genel Veri Koruma Tüzüğü'nün (GDPR (EU) 2016/679) <strong>Art.15-22</strong> hükümleri uyarınca, ilgili kişilerin/veri sahiplerinin kişisel verileri üzerindeki haklarını ve bu hakları kullanma usulünü açıklamak amacıyla hazırlanmıştır. hangel, Türkiye merkezli bir toplumsal etki platformu olarak acil kan talebi/eşleştirme, bireysel ve kurumsal bağış, gönüllülük, STK/dernek/vakıf profilleri, marka üyelikleri ve etki raporlama hizmetleri sunmakta; bu kapsamda kimlik, iletişim, konum, finansal, teknik ve <strong>kan grubu (özel nitelikli sağlık verisi)</strong> gibi verileri işlemektedir. İşbu Politika, kullanıcıların bu veriler üzerindeki kontrol haklarını şeffaf biçimde kullanabilmesini güvence altına almayı amaçlar ve hangel'in <a href="/gizlilik-politikasi" rel="noopener">Gizlilik Politikası</a> ile birlikte değerlendirilir.</p>

<h4>1. Amaç, Kapsam ve Tanımlar</h4>
<p>Bu Politika; kişisel verisi hangel tarafından işlenen tüm gerçek kişileri (kullanıcılar, bağışçılar, gönüllüler, kuruluş temsilcileri) kapsar. KVKK m.3 anlamında "ilgili kişi", kişisel verisi işlenen gerçek kişiyi; "veri sorumlusu" ise işleme amaçlarını ve vasıtalarını belirleyen hangel AŞ'yi ifade eder. GDPR bakımından "veri sahibi" (data subject) ve "veri sorumlusu" (controller) kavramları esas alınır. Tüzel kişilere ilişkin veriler ile kamuya açık olmayan ticari sır niteliğindeki bilgiler bu Politika kapsamında değerlendirilmez.</p>

<h4>2. İlgili Kişinin KVKK m.11 Kapsamındaki Hakları</h4>
<p>KVKK m.11 uyarınca her ilgili kişi, hangel'e başvurarak aşağıdaki haklarını kullanabilir:</p>
<ul>
<li>Kişisel verilerinin işlenip işlenmediğini öğrenme,</li>
<li>İşlenmişse buna ilişkin bilgi talep etme,</li>
<li>İşlenme amacını ve amaca uygun kullanılıp kullanılmadığını öğrenme,</li>
<li>Yurt içinde veya yurt dışında verilerin aktarıldığı üçüncü kişileri bilme,</li>
<li>Eksik veya yanlış işlenmiş verilerin düzeltilmesini isteme,</li>
<li>KVKK m.7'deki şartlar çerçevesinde verilerin silinmesini veya yok edilmesini isteme,</li>
<li>Düzeltme/silme/yok etme işlemlerinin verilerin aktarıldığı üçüncü kişilere bildirilmesini isteme,</li>
<li>Verilerin münhasıran otomatik sistemlerle analizi sonucu aleyhine bir sonucun ortaya çıkmasına itiraz etme,</li>
<li>Verilerin kanuna aykırı işlenmesi sebebiyle zarara uğraması halinde zararın giderilmesini talep etme.</li>
</ul>

<h4>3. AB Veri Sahiplerinin GDPR Art.15-22 Hakları</h4>
<p>Avrupa Birliği'nde bulunan veri sahipleri, KVKK haklarına ek olarak GDPR kapsamında aşağıdaki haklara sahiptir:</p>
<table class="w-full border-collapse border border-gray-200 my-4">
<thead>
<tr>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Hak</th>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">GDPR Maddesi</th>
</tr>
</thead>
<tbody>
<tr><td class="border border-gray-200 p-2 text-sm">Erişim hakkı</td><td class="border border-gray-200 p-2 text-sm">Art.15</td></tr>
<tr><td class="border border-gray-200 p-2 text-sm">Düzeltme hakkı</td><td class="border border-gray-200 p-2 text-sm">Art.16</td></tr>
<tr><td class="border border-gray-200 p-2 text-sm">Silme / unutulma hakkı</td><td class="border border-gray-200 p-2 text-sm">Art.17</td></tr>
<tr><td class="border border-gray-200 p-2 text-sm">İşlemeyi kısıtlama hakkı</td><td class="border border-gray-200 p-2 text-sm">Art.18</td></tr>
<tr><td class="border border-gray-200 p-2 text-sm">Bildirim yükümlülüğü</td><td class="border border-gray-200 p-2 text-sm">Art.19</td></tr>
<tr><td class="border border-gray-200 p-2 text-sm">Veri taşınabilirliği hakkı</td><td class="border border-gray-200 p-2 text-sm">Art.20</td></tr>
<tr><td class="border border-gray-200 p-2 text-sm">İtiraz hakkı</td><td class="border border-gray-200 p-2 text-sm">Art.21</td></tr>
<tr><td class="border border-gray-200 p-2 text-sm">Otomatik karara tabi olmama</td><td class="border border-gray-200 p-2 text-sm">Art.22</td></tr>
</tbody>
</table>
<p>Bu hakların kapsamı kısaca şöyledir: <strong>Erişim hakkı (Art.15)</strong>, hangi verilerin hangi amaçla işlendiğine ilişkin bir kopya talep etme imkânı verir. <strong>Düzeltme (Art.16)</strong>, yanlış/eksik verilerin güncellenmesini sağlar. <strong>Silme/unutulma (Art.17)</strong>, işleme için gereklilik ortadan kalktığında veya rıza geri çekildiğinde verilerin silinmesini kapsar. <strong>İşlemeyi kısıtlama (Art.18)</strong>, verinin doğruluğu tartışmalı olduğunda işlemenin geçici olarak durdurulmasını; <strong>veri taşınabilirliği (Art.20)</strong>, otomatik yollarla işlenen verilerin yapılandırılmış, yaygın ve makinece okunabilir formatta alınmasını ve başka bir sorumluya aktarılmasını sağlar. <strong>İtiraz hakkı (Art.21)</strong>, meşru menfaate veya doğrudan pazarlamaya dayalı işlemeye itiraz etme imkânı tanır; doğrudan pazarlamaya itiraz halinde işleme derhal durdurulur.</p>

<h4>4. CCPA/CPRA Kapsamındaki Haklar (Kaliforniya)</h4>
<p>Kaliforniya sakini kullanıcılar, CCPA/CPRA (Cal. Civ. Code §1798.100 ve devamı) uyarınca; toplanan kişisel bilgileri bilme (§1798.110/115), silinmesini isteme (§1798.105), yanlış bilgilerin düzeltilmesini isteme (§1798.106), kişisel bilgilerinin satışına/paylaşımına itiraz etme (opt-out — §1798.120) ve hassas kişisel bilgilerin kullanımını sınırlandırma (§1798.121) haklarına sahiptir. hangel, bu hakları kullananlara karşı CCPA §1798.125 uyarınca ayrımcılık yapmaz. hangel, kişisel verileri klasik anlamda satmaz; herhangi bir paylaşım söz konusu olduğunda opt-out talepleri karşılanır.</p>

<h4>5. Özel Nitelikli Veri (Kan Grubu) ile İlgili Haklar</h4>
<p>Açık rızaya dayalı olarak işlenen <strong>kan grubu</strong> verisi bakımından, KVKK m.6/2 ve GDPR Art.9(2)(a) uyarınca verdiğiniz açık rızayı dilediğiniz zaman geri çekebilir; verinin silinmesini, işlenmesinin durdurulmasını veya işleme ayarlarınızın güncellenmesini talep edebilirsiniz. Sağlık verisi, hak taleplerinde önceliklendirilir ve yalnızca yüksek güvenlikli kanallar üzerinden işlem görür. Rızanın geri çekilmesi geri çekme öncesi işlemlerin hukukiliğini etkilemez; rıza geri çekildiğinde başka bir işleme şartı yoksa veri KVKK m.7 uyarınca derhal imha edilir.</p>

<h4>6. Başvuru Usulü</h4>
<p>Haklarınızı kullanmak için talebinizi KVKK m.13 ve ilgili Tebliğ uyarınca aşağıdaki kanallardan iletebilirsiniz:</p>
<ul>
<li>Türkiye/KVKK başvuruları: <a href="mailto:kvkk@hangel.org">kvkk@hangel.org</a> (sisteminizde kayıtlı e-posta üzerinden) veya yazılı/güvenli elektronik imza yöntemleriyle,</li>
<li>AB/uluslararası başvurular: <a href="mailto:privacy@hangel.org">privacy@hangel.org</a> ya da <a href="mailto:dpo@hangel.org">dpo@hangel.org</a>.</li>
</ul>
<p>Başvurunuzda kimliğinizi tevsik edici bilgiler ile talebinizin konusunu açıkça belirtmeniz gerekir. hangel, başvuru sahibinin kimliğinden makul şüphe duyması halinde, kimlik doğrulaması amacıyla ek bilgi talep edebilir; bu bilgiler yalnızca doğrulama için kullanılır ve sonrasında imha edilir. Başkası adına yapılan başvurularda usulüne uygun vekâlet/yetki belgesi aranır.</p>

<h4>7. Yanıt Süresi ve Ücret</h4>
<p>hangel, başvurunuzu talebin niteliğine göre en kısa sürede ve KVKK m.13/2 uyarınca en geç <strong>30 gün</strong> içinde sonuçlandırır. GDPR Art.12(3) kapsamındaki başvurular için süre kural olarak <strong>1 ay</strong> olup, talebin karmaşıklığına ve sayısına göre iki ay daha uzatılabilir; uzatma halinde gerekçesiyle birlikte bir ay içinde bilgilendirme yapılır. Başvurular kural olarak <strong>ücretsiz</strong> yanıtlanır; ancak işlemin ayrıca bir maliyet gerektirmesi halinde Kurul'ca belirlenen "Veri Sorumlusuna Başvuru Usul ve Esasları Hakkında Tebliğ"deki tarifedeki ücret alınabilir. GDPR kapsamında açıkça temelsiz veya aşırı (özellikle tekrar eden) taleplerde makul bir ücret talep edilebilir ya da talep gerekçeli olarak reddedilebilir.</p>

<h4>8. Talebin Reddi ve Karşılanma Esasları</h4>
<p>hangel, bir hak talebini ancak hukuki bir dayanakla (örneğin başka bir kişinin haklarının korunması, hukuki yükümlülüklerin varlığı, dava/ifade özgürlüğü veya kanunen saklanması zorunlu veriler) sınırlayabilir veya reddedebilir. Bu durumda ret gerekçesi açıkça bildirilir. Silme talepleri, yasal saklama süreleri devam eden veriler bakımından sürenin sonuna kadar erteleme veya kısıtlama biçiminde karşılanabilir.</p>

<h4>9. Şikâyet ve İtiraz Mercii</h4>
<p>Başvurunuzun reddedilmesi, verilen yanıtın yetersiz bulunması veya süresinde yanıt verilmemesi halinde; KVKK m.14 uyarınca, veri sorumlusunun cevabını öğrendiğiniz tarihten itibaren otuz ve her hâlde başvuru tarihinden itibaren altmış gün içinde <strong>Kişisel Verileri Koruma Kurulu'na</strong> şikâyette bulunabilirsiniz. AB veri sahipleri GDPR Art.77 uyarınca ikamet ettikleri ülkedeki yetkili denetim makamına başvurabilir; Kaliforniya sakinleri ise CCPA kapsamındaki idari yollara başvurabilir. Yargı yolu her hâlde saklıdır.</p>

<h4>10. Değişiklik ve Yürürlük</h4>
<p>Bu Politika, mevzuat değişiklikleri doğrultusunda güncellenebilir. Güncel metin platformda yayımlandığı tarihte yürürlüğe girer.</p>

<p class="text-xs text-muted-foreground"><em>Bu metin bilgilendirme amaçlıdır ve bağlayıcı nihai hukuki görüş niteliği taşımaz; yürürlük öncesi yetkili hukuk danışmanlığı önerilir.</em></p>
    `
  },
  {
    slug: 'dpo-tanimi',
    title: 'Veri Koruma Görevlisi (DPO) Tanımı',
    content: `
      <h3>Veri Koruma Görevlisi (DPO) Tanımı</h3>

<p>Bu belge, hangel platformunun veri koruma yönetişimi kapsamındaki iki ayrı rolü tanımlar: AB <strong>Genel Veri Koruma Tüzüğü (EU) 2016/679 (GDPR)</strong> kapsamındaki <strong>Veri Koruma Görevlisi (Data Protection Officer — DPO)</strong> ile Türkiye <strong>6698 sayılı KVKK</strong> mevzuatındaki <strong>irtibat kişisi</strong>. Bu iki rol birbirinden hukuken farklıdır ve karıştırılmamalıdır. Veri sorumlusu <strong>hangel AŞ</strong>'dir.</p>

<h4>1. DPO ile İrtibat Kişisi Aynı Şey Değildir</h4>
<p>GDPR kapsamındaki <strong>DPO</strong> bağımsız, uzmanlık temelli ve geniş kapsamlı bir denetim/danışma görevidir; KVKK kapsamındaki <strong>irtibat kişisi</strong> ise yalnızca Kurum ve ilgili kişilerle iletişimi sağlamak üzere VERBİS'e kaydedilen bir temas noktasıdır. İrtibat kişisi, veri sorumlusunu temsil etmez ve DPO'nun bağımsızlık ile karar denetimi yetkilerine sahip değildir. Aşağıdaki tablo iki rolü karşılaştırır:</p>
<table class="w-full border-collapse border border-gray-200 my-4">
<thead>
<tr>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Ölçüt</th>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">DPO (GDPR Art. 37-39)</th>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">İrtibat Kişisi (KVKK / VERBİS)</th>
</tr>
</thead>
<tbody>
<tr><td class="border border-gray-200 p-2 text-sm">Hukuki kaynak</td><td class="border border-gray-200 p-2 text-sm">GDPR Art. 37-39</td><td class="border border-gray-200 p-2 text-sm">KVKK m.16 ve VERBİS Yönetmeliği</td></tr>
<tr><td class="border border-gray-200 p-2 text-sm">Temel işlev</td><td class="border border-gray-200 p-2 text-sm">Uyum izleme, danışma, denetim makamıyla işbirliği</td><td class="border border-gray-200 p-2 text-sm">Kurum ve ilgili kişilerle iletişim (temas noktası)</td></tr>
<tr><td class="border border-gray-200 p-2 text-sm">Bağımsızlık</td><td class="border border-gray-200 p-2 text-sm">Yasal bağımsızlık ve görevden kaynaklı koruma</td><td class="border border-gray-200 p-2 text-sm">Bağımsızlık güvencesi öngörülmemiştir</td></tr>
<tr><td class="border border-gray-200 p-2 text-sm">Atama zorunluluğu</td><td class="border border-gray-200 p-2 text-sm">Art. 37/1 koşulları oluşursa zorunlu</td><td class="border border-gray-200 p-2 text-sm">VERBİS'e kayıt yükümlüsü için zorunlu</td></tr>
</tbody>
</table>

<h4>2. DPO Atama Koşulları (GDPR Art. 37)</h4>
<p>GDPR Art. 37/1 uyarınca DPO ataması, (a) işlemenin bir kamu kurumunca yapılması, (b) temel faaliyetlerin geniş ölçekli, düzenli ve sistematik izleme gerektirmesi veya (c) temel faaliyetlerin <strong>özel nitelikli verilerin (Art. 9)</strong> ya da ceza mahkûmiyetlerine ilişkin verilerin geniş ölçekli işlenmesini gerektirmesi hâllerinde zorunludur. hangel'in sağlık verisi (kan grubu) işleme hacmi ve niteliği bu koşulları zaman içinde karşılayabileceğinden, hangel <strong>DPO atamasının bu koşulların oluşmasına bağlı olduğunu</strong> ve gerekli hâle geldiğinde uzmanlık niteliklerini haiz bir DPO atayacağını beyan eder.</p>

<h4>3. DPO'nun Konumu (GDPR Art. 38)</h4>
<p>Atanacak DPO bakımından hangel, Art. 38 gereğince şunları sağlamayı taahhüt eder:</p>
<ul>
<li>DPO'nun veri koruma ile ilgili tüm konulara <strong>zamanında ve uygun biçimde dâhil edilmesi</strong>,</li>
<li>görevlerini yerine getirmesi için <strong>gerekli kaynak ve erişimin</strong> sağlanması,</li>
<li>görevlerine ilişkin <strong>talimat almaması</strong> ve görevini yerine getirmesi nedeniyle görevden alınmaması veya cezalandırılmaması (bağımsızlık),</li>
<li>doğrudan en üst yönetime <strong>raporlama</strong> imkânı,</li>
<li>menfaat çatışması doğurmayacak biçimde başka görevler üstlenebilmesi.</li>
</ul>

<h4>4. DPO'nun Görevleri (GDPR Art. 39)</h4>
<p>DPO, Art. 39 uyarınca asgari olarak şu görevleri yürütür:</p>
<ul>
<li>Veri sorumlusunu/işleyeni ve çalışanları yükümlülükleri hakkında <strong>bilgilendirmek ve danışmanlık vermek</strong>,</li>
<li>GDPR'a ve iç politikalara uyumu <strong>izlemek</strong>, farkındalık ve eğitim faaliyetlerini gözetmek,</li>
<li>talep edilmesi hâlinde <strong>Veri Koruma Etki Değerlendirmesi (DPIA — Art. 35)</strong> konusunda görüş vermek ve uygulamayı izlemek,</li>
<li><strong>denetim makamıyla işbirliği</strong> yapmak ve onunla irtibat noktası olarak hareket etmek,</li>
<li>işleme faaliyetlerinin risklerini, kapsamını ve bağlamını gözeterek görevlerini risk temelli yürütmek.</li>
</ul>

<h4>5. KVKK İrtibat Kişisi</h4>
<p>Türkiye'de hangel, VERBİS'e kayıt yükümlülüğü doğduğunda bir <strong>irtibat kişisi</strong> belirler. İrtibat kişisi, Kişisel Verileri Koruma Kurumu ve ilgili kişiler ile iletişimi sağlar; ancak bu rol hangel AŞ'nin KVKK uyumuna ilişkin nihai sorumluluğunu kaldırmaz ve DPO'nun bağımsız denetim işlevini taşımaz.</p>

<h4>6. İletişim Kanalları</h4>
<p>Veri koruma konularındaki başvurular için uluslararası/DPO kanalı <a href="mailto:dpo@hangel.org">dpo@hangel.org</a>, genel gizlilik talepleri için <a href="mailto:privacy@hangel.org">privacy@hangel.org</a>, Türkiye KVKK başvuruları için <a href="mailto:kvkk@hangel.org">kvkk@hangel.org</a> adresleridir. Bu belgede atanmış belirli bir gerçek kişinin adı yer almaz; atama gerçekleştiğinde ilgili bilgiler güncel gizlilik bildiriminde duyurulur.</p>

<h4>7. DPO'nun Nitelikleri ve Konumlandırması</h4>
<p>GDPR Art. 37/5 uyarınca DPO, veri koruma hukuku ve uygulamaları konusundaki mesleki nitelikleri ile uzmanlık bilgisi temelinde atanır. DPO; hangel AŞ bünyesinde bir çalışan olabileceği gibi, hizmet sözleşmesi temelinde dışarıdan (harici) da görevlendirilebilir (Art. 37/6). hangel, atayacağı DPO'nun işleme faaliyetlerinin niteliği, kapsamı ve riskleriyle orantılı bir uzmanlığa sahip olmasını esas alır. DPO'nun iletişim bilgileri, atama gerçekleştiğinde GDPR Art. 37/7 gereği yetkili denetim makamına bildirilir ve gizlilik bildiriminde kamuya açıklanır.</p>

<h4>8. Gizlilik Yükümlülüğü ve Erişilebilirlik</h4>
<p>DPO, görevlerini yerine getirirken gizlilik yükümlülüğüne tabidir (GDPR Art. 38/5). Veri sahipleri, kişisel verilerinin işlenmesine ve haklarının kullanımına ilişkin tüm konularda DPO ile iletişime geçebilir (Art. 38/4). hangel, DPO'ya yapılan başvuruların makul süre içinde ele alınmasını ve veri sahibinin gereksiz yere yönlendirilmeden muhatap bulmasını sağlamayı taahhüt eder.</p>

<h4>9. AB Temsilcisi ile İlişki</h4>
<p>DPO rolü, GDPR Art. 27 kapsamındaki <strong>AB temsilcisi</strong> rolünden de ayrıdır. AB temsilcisi, Birlikte yerleşik olmayan veri sorumlusu adına denetim makamları ve veri sahipleriyle muhatap olmak üzere bir AB üye devletinde konumlanan bir irtibat noktasıdır; DPO ise uyumun izlenmesi ve danışmanlık işlevini yürütür. Bu iki rol birbirinin yerine geçmez ve koşullar oluştuğunda ayrı ayrı tesis edilebilir.</p>

<h4>10. Değişiklik ve Yürürlük</h4>
<p>Bu tanım, mevzuattaki gelişmelere ve hangel'in işleme faaliyetlerindeki değişikliklere göre güncellenir ve güncel metin yayımlandığı tarihte yürürlüğe girer.</p>

<p class="text-xs text-muted-foreground"><em>Bu metin bilgilendirme amaçlıdır ve bağlayıcı nihai hukuki görüş niteliği taşımaz; yürürlük öncesi yetkili hukuk danışmanlığı önerilir.</em></p>
    `
  },
  {
    slug: 'veri-ihlali-bildirim-proseduru',
    title: 'Veri İhlali Bildirim Prosedürü',
    content: `
      <h3>Veri İhlali Bildirim Prosedürü</h3>

<p>İşbu Veri İhlali Bildirim Prosedürü, <strong>hangel AŞ</strong> ("hangel") tarafından, 6698 sayılı Kişisel Verilerin Korunması Kanunu'nun ("KVKK") <strong>m.12/5</strong> hükmü ile bu hükmün uygulanmasına ilişkin Kişisel Verileri Koruma Kurulu'nun <strong>24.01.2019 tarih ve 2019/10 sayılı kararı</strong> ve Avrupa Birliği Genel Veri Koruma Tüzüğü'nün (GDPR (EU) 2016/679) <strong>Art.33-34</strong> hükümleri uyarınca, kişisel veri ihlallerinin tespiti, değerlendirilmesi ve yetkili makamlar ile ilgili kişilere bildirilmesi sürecini düzenler.</p>

<h4>1. Amaç ve Kapsam</h4>
<p>Bu Prosedür; hangel'in işlediği kişisel verilerin (kimlik, iletişim, konum, <strong>kan grubu gibi özel nitelikli sağlık verisi</strong>, finansal ve teknik veriler dahil) hukuka aykırı olarak işlenmesi, bunlara erişilmesi, kaybolması veya değiştirilmesi sonucunu doğuran ihlal olaylarında izlenecek adımları, sorumlulukları ve bildirim sürelerini belirler. Prosedür; hangel çalışanlarını, yöneticilerini ve hangel adına veri işleyen tüm tedarikçileri bağlar. Amaç, ihlalin etkilerini en aza indirmek, ilgili kişilerin hak ve özgürlüklerini korumak ve yasal bildirim yükümlülüklerini eksiksiz yerine getirmektir.</p>

<h4>1.1. Sorumlu Ekip ve Roller</h4>
<p>İhlal yönetiminden hangel'in veri koruma sorumlusu/irtibat kişisi koordinasyonunda; bilgi teknolojileri/güvenlik, hukuk ve iletişim birimlerinden oluşan bir müdahale ekibi sorumludur. Ekip; tespit, değerlendirme, sınırlama, bildirim ve kayıt süreçlerini yürütür. GDPR kapsamında bir veri koruma görevlisi (DPO) atandığında, bu görevli süreçte danışman ve irtibat noktası rolünü üstlenir (<a href="mailto:dpo@hangel.org">dpo@hangel.org</a>).</p>

<h4>2. Veri İhlalinin Tanımı</h4>
<p>Veri ihlali; iletilen, saklanan veya işlenen kişisel verilerin kaza sonucu veya hukuka aykırı olarak imhasına, kaybına, değiştirilmesine, yetkisiz şekilde ifşa edilmesine veya bunlara erişilmesine yol açan güvenlik ihlalidir (GDPR Art.4(12) ile uyumlu). Kan grubu gibi özel nitelikli verileri etkileyen ihlaller, ilgili kişiler bakımından yüksek risk taşıdığından özel önceliklidir.</p>

<h4>3. Tespit ve İç Bildirim</h4>
<p>İhlal şüphesi; otomatik izleme/uyarı sistemleri, güvenlik açığı taramaları, çalışan ihbarı, hizmet sağlayıcı (ör. Google Cloud / Firebase, Apple) bildirimi veya ilgili kişi başvurusu yoluyla tespit edilebilir. İhlalden haberdar olan her çalışan, durumu gecikmeksizin hangel veri koruma sorumlusuna/irtibat kişisine iletmekle yükümlüdür; iç bildirim için belirlenmiş bir iletişim kanalı ve aciliyet protokolü uygulanır. İhlalin tespit edildiği (öğrenildiği) an, tarih ve saat bilgisiyle kayıt altına alınır; bu an, bildirim sürelerinin başlangıç noktasıdır. İhlal şüphesinin doğrulanması ile gerçek ihlal arasındaki ayrım ve kapsam, müdahale ekibince ivedilikle değerlendirilir.</p>

<h4>4. Değerlendirme ve Risk Analizi</h4>
<p>hangel, ihlalin kapsamını (etkilenen veri kategorileri ve kişi sayısı), olası sonuçlarını ve ilgili kişiler için doğurabileceği riskleri değerlendirir. Değerlendirmede; verinin niteliği (özel nitelikli sağlık verisi olup olmadığı), ihlalin türü (gizlilik, bütünlük veya erişilebilirlik ihlali), maddi/manevi zarar (kimlik hırsızlığı, dolandırıcılık, ayrımcılık, itibar kaybı) olasılığı ve alınabilecek önleyici/azaltıcı tedbirler dikkate alınır. Kan grubu gibi sağlık verilerini ve finansal verileri etkileyen ihlaller kural olarak "yüksek riskli" kabul edilir. Risk değerlendirmesi, GDPR Art.33-34'te öngörülen "hak ve özgürlükler için risk" ile "yüksek risk" eşiklerine göre yapılır ve sonucu kayıt altına alınır.</p>

<h4>5. Kurul'a / Denetim Makamına Bildirim</h4>
<table class="w-full border-collapse border border-gray-200 my-4">
<thead>
<tr>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Makam</th>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Süre</th>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Dayanak</th>
</tr>
</thead>
<tbody>
<tr><td class="border border-gray-200 p-2 text-sm">Kişisel Verileri Koruma Kurulu</td><td class="border border-gray-200 p-2 text-sm">En kısa sürede — en geç <strong>72 saat</strong> içinde</td><td class="border border-gray-200 p-2 text-sm">KVKK m.12/5; Kurul kararı 2019/10</td></tr>
<tr><td class="border border-gray-200 p-2 text-sm">AB Yetkili Denetim Makamı</td><td class="border border-gray-200 p-2 text-sm">Farkındalıktan itibaren <strong>72 saat</strong> içinde</td><td class="border border-gray-200 p-2 text-sm">GDPR Art.33</td></tr>
</tbody>
</table>
<p>Kurul'a bildirim, Kurul'un belirlediği "Kişisel Veri İhlal Bildirim Formu" üzerinden yapılır. 72 saat içinde bildirimin mümkün olmaması halinde, gecikmenin gerekçeleri bildirimle birlikte açıklanır. Bilgilerin tamamı aynı anda sağlanamıyorsa, gecikmeye mahal vermeksizin aşamalı olarak iletilebilir (Kurul kararı 2019/10 ve GDPR Art.33(4) ile uyumlu).</p>

<h4>6. İlgili Kişiye Bildirim</h4>
<p>İhlalin ilgili kişilerin hak ve özgürlükleri açısından yüksek risk doğurması halinde, etkilenen ilgili kişilere de makul en kısa sürede bildirim yapılır (KVKK m.12/5 ve Kurul kararı 2019/10; GDPR Art.34). Bildirim, ilgili kişinin tespit edilebildiği hallerde doğrudan (e-posta, uygulama bildirimi); tespit edilemediği veya orantısız çaba gerektirdiği hallerde uygun kamuoyu duyurusu/benzer etkili yöntemle yapılır. Bildirim açık ve sade bir dille; ihlalin niteliğini, etkilenen veri kategorilerini, muhtemel sonuçlarını, hangel tarafından alınan/önerilen tedbirleri ve irtibat noktasını (DPO/irtibat kişisi) içerir. Kan grubu gibi özel nitelikli verileri etkileyen ihlallerde bildirim önceliklendirilir. GDPR Art.34(3) uyarınca, ilgili veriler şifreleme gibi tedbirlerle anlaşılmaz kılınmışsa veya yüksek riski ortadan kaldıran sonradan tedbirler alınmışsa, bireysel bildirim gerekmeyebilir.</p>

<h4>7. Müdahale, Sınırlama ve Azaltma Tedbirleri</h4>
<p>İhlalin tespitiyle eş zamanlı olarak; etkilenen sistemlerin izole edilmesi, açığın kapatılması, şifre/erişim anahtarlarının yenilenmesi ve adli/teknik inceleme başlatılması dahil sınırlama ve zarar azaltma tedbirleri uygulanır. Gerekli hallerde kolluk ve diğer yetkili makamlarla iş birliği yapılır.</p>

<h4>8. Aşamalı Bildirim ve Süreç Akışı</h4>
<p>İhlal yönetimi özet olarak şu akışla yürür: <strong>(1) Tespit/öğrenme</strong> ve anın kayda geçirilmesi → <strong>(2) Sınırlama</strong> ve acil müdahale → <strong>(3) Değerlendirme/risk analizi</strong> → <strong>(4) Kurul'a bildirim</strong> (en geç 72 saat) → <strong>(5) Yüksek risk varsa ilgili kişiye bildirim</strong> → <strong>(6) Kayıt ve kapanış/iyileştirme</strong>. Bütün bilgilerin aynı anda temin edilemediği hallerde, bildirim gecikmeye mahal vermeksizin aşamalı (kademeli) olarak tamamlanır; ilk bildirimde mevcut bilgiler verilir, eksik bilgiler hazır oldukça iletilir (Kurul kararı 2019/10 ve GDPR Art.33(4) ile uyumlu).</p>

<h4>9. Kayıt Tutma ve İç Dokümantasyon</h4>
<p>hangel, yaşanan tüm veri ihlallerini; ihlalin niteliğini, etkilenen veri kategorilerini ve kişi sayısını, olası sonuçlarını, alınan düzeltici/önleyici tedbirleri ve bildirim kararlarının gerekçesini içeren bir <strong>iç ihlal kaydı</strong> tutar (GDPR Art.33(5) ile uyumlu). Bu kayıt, Kurul ve denetim makamlarının uyumu denetleyebilmesine olanak tanır ve ihlalin niteliğinden (bildirim yükümlülüğü doğmamış olsa dahi) bağımsız olarak tutulur.</p>

<h4>10. Hizmet Sağlayıcı ve Veri İşleyenlerle İlişki</h4>
<p>hangel adına veri işleyen taraflar (Google Cloud / Firebase, Apple ve diğer tedarikçiler), öğrendikleri ihlalleri gecikmeksizin hangel'e bildirmekle yükümlüdür. Bu yükümlülük, ilgili veri işleme/aktarım sözleşmelerinde (KVKK m.12 ve GDPR Art.28 çerçevesinde) düzenlenir.</p>

<h4>11. Gözden Geçirme ve Yürürlük</h4>
<p>Bu Prosedür, her ihlal sonrası elde edilen derslerle ve mevzuat değişiklikleriyle güncellenir; periyodik olarak gözden geçirilir. Güncel metin platformda yayımlandığı tarihte yürürlüğe girer.</p>

<p class="text-xs text-muted-foreground"><em>Bu metin bilgilendirme amaçlıdır ve bağlayıcı nihai hukuki görüş niteliği taşımaz; yürürlük öncesi yetkili hukuk danışmanlığı önerilir.</em></p>
    `
  },
  {
    slug: 'veri-transferi-ve-hosting-beyani',
    title: 'Veri Transferi ve AB Merkezli Hosting Beyanı',
    content: `
      <h3>Veri Transferi ve AB Merkezli Hosting Beyanı</h3>

<p>Bu beyan, hangel platformunun kişisel verileri hangi altyapılarda barındırdığını (hosting) ve yurt dışına aktarımı hangi hukuki çerçeve içinde gerçekleştirmeyi hedeflediğini açıklar. Beyan, Türkiye bakımından <strong>6698 sayılı KVKK m.9</strong> ve <strong>Kişisel Verilerin Yurt Dışına Aktarılması Rehberi</strong> ile 2024 mevzuat değişikliği; AB'de bulunan kullanıcılar bakımından ise <strong>GDPR Art. 44-49</strong> çerçevesinde hazırlanmıştır. Veri sorumlusu <strong>hangel AŞ</strong>'dir. Bu belge, mevcut durumu ve <strong>yol haritasını</strong> birlikte ortaya koyan bir taahhüt metnidir; henüz tamamlanmamış hedefler "amaçlanmaktadır / hedeflenmektedir" biçiminde çerçevelenmiştir.</p>

<h4>1. Kullanılan Altyapı ve Hizmet Sağlayıcılar</h4>
<p>hangel'in teknik altyapısı temel olarak <strong>Google Cloud / Firebase</strong> (Firestore veritabanı, Authentication, Cloud Storage) ve <strong>Apple</strong> hizmetleri üzerinde işletilmektedir. Bu sağlayıcılar, küresel çapta birden çok bölgede (region) veri merkezleri işletmektedir; verinin hangi bölgede barındırılacağı yapılandırmaya bağlıdır.</p>

<h4>2. "AB Merkezli Hosting" İddiasının Kapsamı (Gerçekçi Çerçeve)</h4>
<p>hangel, AB'de bulunan kullanıcılara ait kişisel verilerin mümkün olduğu ölçüde <strong>AB/AEA içindeki veya yeterlilik kararı bulunan ya da uygun güvencelerle korunan bölgelerde</strong> barındırılmasını <strong>hedeflemektedir</strong>. Bu beyan, tüm verilerin istisnasız tek bir AB bölgesinde tutulduğu yönünde kesin bir taahhüt içermez; veri yerleşimi (data residency), kullanılan bulut bölgelerinin yapılandırmasına ve sağlayıcıların teknik imkânlarına bağlıdır. hangel, veri yerleşimi yapılandırmasını bu hedefe yaklaştıracak adımları yol haritasına almıştır.</p>
<table class="w-full border-collapse border border-gray-200 my-4">
<thead>
<tr>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Alan</th>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Mevcut Durum</th>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Hedef</th>
</tr>
</thead>
<tbody>
<tr><td class="border border-gray-200 p-2 text-sm">Veri yerleşimi (region)</td><td class="border border-gray-200 p-2 text-sm">Bulut sağlayıcı çoklu bölge altyapısı</td><td class="border border-gray-200 p-2 text-sm">AB/AEA veya uygun güvenceli bölgelere önceliklendirme</td></tr>
<tr><td class="border border-gray-200 p-2 text-sm">Aktarım güvencesi</td><td class="border border-gray-200 p-2 text-sm">Sağlayıcı sözleşmesel taahhütleri</td><td class="border border-gray-200 p-2 text-sm">SCC / KVKK standart sözleşme imzası ve dosyalama</td></tr>
<tr><td class="border border-gray-200 p-2 text-sm">Şeffaflık</td><td class="border border-gray-200 p-2 text-sm">Bu beyan ve gizlilik bildirimi</td><td class="border border-gray-200 p-2 text-sm">Alt-işleyen listesinin yayımlanması</td></tr>
</tbody>
</table>

<h4>3. KVKK m.9 — Yurt Dışına Aktarım (2024 Sistematiği)</h4>
<p>12 Mart 2024 tarihli ve <strong>7499 sayılı Kanun</strong> ile değiştirilen ve 1/6/2024'te yürürlüğe giren KVKK m.9, açık rıza merkezli yaklaşımdan kademeli bir sistematiğe geçmiştir. hangel, yurt dışı aktarımları bu sıralamaya göre dayandırmayı taahhüt eder:</p>
<ul>
<li><strong>Yeterlilik kararı</strong> — Kurulca yeterli korumaya sahip olduğu kararlaştırılan ülke/sektör/uluslararası kuruluşa aktarım (m.9/1);</li>
<li><strong>Uygun güvenceler</strong> — yeterlilik kararı yoksa; Kurul onaylı <strong>bağlayıcı şirket kuralları</strong>, Kurulca ilan edilen <strong>standart sözleşme</strong>, taahhütname veya uluslararası sözleşme gibi güvencelerin sağlanması (m.9/2-3);</li>
<li><strong>Arızi hâller</strong> — yukarıdakiler yoksa, m.9/6'da sayılan istisnai durumlar (açık rıza, sözleşmenin ifası, üstün kamu yararı, hakkın korunması vb.).</li>
</ul>
<p>Kurulca ilan edilen <strong>standart sözleşme</strong>, imza tarihinden itibaren beş iş günü içinde Kuruma bildirilir. Uygulama, 10.07.2024 tarihli ve 32598 sayılı Resmî Gazete'de yayımlanan <strong>Kişisel Verilerin Yurt Dışına Aktarılmasına İlişkin Usul ve Esaslar Hakkında Yönetmelik</strong> ile detaylandırılmıştır.</p>

<h4>4. GDPR Art. 44-49 — AB/AEA Dışına Aktarım</h4>
<p>AB'de bulunan veri sahiplerinin verilerinin Birlik dışına aktarılması hâlinde hangel, GDPR'ın aktarım sıralamasına uyar:</p>
<ul>
<li><strong>Yeterlilik kararı</strong> — Art. 45 (Komisyon kararı bulunan ülke/çerçeveler);</li>
<li><strong>Uygun güvenceler</strong> — Art. 46, özellikle <strong>Standart Sözleşme Hükümleri (SCC)</strong> ve Art. 47 <strong>Bağlayıcı Şirket Kuralları (BCR)</strong>;</li>
<li><strong>Özel durum istisnaları</strong> — Art. 49 (açık rıza, sözleşmenin ifası vb.).</li>
</ul>
<p>hangel, Google ve Apple gibi sağlayıcılarla yapılan veri işleme sözleşmelerinde uygun olduğunda <strong>SCC</strong> hükümlerinin yer almasını sağlamayı ve gerektiğinde aktarım etki değerlendirmesi (TIA) yürütmeyi hedefler.</p>

<h4>5. Şeffaflık ve Güncelleme Taahhüdü</h4>
<p>hangel, kullanılan başlıca alt-işleyenleri ve aktarım güvencelerini gizlilik bildiriminde şeffaf biçimde duyurmayı; altyapı veya aktarım mekanizmaları değiştiğinde bu beyanı güncellemeyi taahhüt eder.</p>

<h4>6. İletişim</h4>
<p>Yurt dışı aktarıma ilişkin sorular için: Türkiye <a href="mailto:kvkk@hangel.org">kvkk@hangel.org</a>, uluslararası <a href="mailto:privacy@hangel.org">privacy@hangel.org</a> ve <a href="mailto:dpo@hangel.org">dpo@hangel.org</a>.</p>

<h4>7. Aktarımda Veri Güvenliği</h4>
<p>hangel, gerek yurt içi gerek yurt dışı aktarımlarda verinin aktarım hâlinde (in transit) ve depolama hâlinde (at rest) korunması için uygun güvenlik tedbirlerini almayı hedefler. Bu kapsamda; aktarım kanallarında şifreleme, erişim yetkilendirmesi, alt-işleyenlerle yapılan sözleşmelerde gizlilik ve güvenlik taahhütleri ile veri minimizasyonu esas alınır (KVKK m.12; GDPR Art. 32). Aktarım yapılan ülkedeki kamu makamlarının veriye erişim riskinin değerlendirilmesi gereken hâllerde, hangel uygun olduğunda ek teknik ve sözleşmesel önlemler almayı taahhüt eder.</p>

<h4>8. Alt-İşleyenler ve Sorumluluk</h4>
<p>Google / Firebase ve Apple gibi sağlayıcılar, hangel adına veri işleyen (data processor) sıfatıyla hareket eder. hangel, bu sağlayıcılarla GDPR Art. 28 ve KVKK çerçevesine uygun veri işleme sözleşmeleri akdetmeyi ve alt-işleyenlerin yalnızca hangel'in talimatları doğrultusunda işleme yapmasını sağlamayı esas alır. Aktarımın hukukiliği ve uygun güvencelerin tesisi bakımından nihai sorumluluk veri sorumlusu sıfatıyla hangel AŞ'de kalır.</p>

<h4>9. Açık Rıza ve Bilgilendirme</h4>
<p>Yurt dışı aktarımın <strong>arızi hâllere</strong> (KVKK m.9/6) veya <strong>Art. 49 istisnalarına</strong> dayandığı durumlarda, gerektiğinde ilgili kişiden açık rıza alınır ve aktarımın olası riskleri (yeterlilik kararı veya uygun güvence bulunmaması ihtimali dâhil) hakkında bilgilendirme yapılır. Açık rızaya dayalı aktarımlarda rıza her zaman geri alınabilir.</p>

<h4>10. Yürürlük</h4>
<p>Bu beyan, platformda yayımlandığı tarihte yürürlüğe girer ve mevzuat ile altyapıdaki gelişmelere göre güncellenir.</p>

<p class="text-xs text-muted-foreground"><em>Bu metin bilgilendirme amaçlıdır ve bağlayıcı nihai hukuki görüş niteliği taşımaz; yürürlük öncesi yetkili hukuk danışmanlığı önerilir.</em></p>
    `
  },
  {
    slug: 'cerez-politikasi',
    title: 'Çerez Politikası',
    content: `
      <h3>Çerez Politikası</h3>

<p>Bu Çerez Politikası, hangel platformunun web ve mobil hizmetlerinde çerezler (cookies) ve benzeri izleme teknolojilerini (yerel depolama, piksel, SDK tanımlayıcıları) nasıl kullandığını, hangi amaçlarla işlediğini ve kullanıcıların tercihlerini nasıl yönetebileceğini açıklar. Politika; Türkiye'de <strong>6698 sayılı KVKK</strong> ve <strong>5651 sayılı Kanun</strong>, AB'de <strong>ePrivacy Direktifi 2002/58/EC</strong> ile <strong>GDPR (EU) 2016/679</strong>, Birleşik Krallık'ta ise <strong>PECR 2003 (Privacy and Electronic Communications Regulations)</strong> çerçevesinde hazırlanmıştır. Veri sorumlusu <strong>hangel AŞ</strong>'dir.</p>

<h4>1. Çerez Nedir?</h4>
<p>Çerez, bir internet sitesi veya uygulama tarafından kullanıcının cihazına yerleştirilen küçük bir metin dosyasıdır. Çerezler; oturumun sürdürülmesi, tercihlerin hatırlanması, güvenliğin sağlanması ile kullanım ve performans ölçümü gibi işlevler için kullanılır. Bu politika kapsamına çerezlerin yanı sıra benzer işlev gören diğer izleme teknolojileri de girer.</p>

<h4>2. Hukuki Dayanak ve Rıza</h4>
<p><strong>Zorunlu çerezler</strong>, hizmetin sunulması için teknik olarak gerekli olduğundan, ePrivacy Direktifi md.5/3'teki istisna kapsamında ve KVKK m.5/2-f (meşru menfaat) ile GDPR Art. 6/1-f temelinde, ayrı rıza aranmaksızın kullanılır. <strong>İşlevsel, analitik ve pazarlama</strong> çerezleri ise zorunlu olmadığından, yerleştirilmeden önce kullanıcının <strong>açık ve bilgilendirilmiş rızasına</strong> (GDPR Art. 6/1-a; PECR reg. 6) tabidir. Rıza alınmadan bu çerezler etkinleştirilmez.</p>

<h4>3. Kullanılan Çerez Kategorileri</h4>
<table class="w-full border-collapse border border-gray-200 my-4">
<thead>
<tr>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Kategori</th>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Amaç</th>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Rıza Gerekir mi?</th>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Tipik Süre</th>
</tr>
</thead>
<tbody>
<tr><td class="border border-gray-200 p-2 text-sm">Zorunlu</td><td class="border border-gray-200 p-2 text-sm">Oturum açma, güvenlik, yük dengeleme, temel işlevsellik</td><td class="border border-gray-200 p-2 text-sm">Hayır (teknik zorunluluk)</td><td class="border border-gray-200 p-2 text-sm">Oturum / kısa süreli</td></tr>
<tr><td class="border border-gray-200 p-2 text-sm">İşlevsel</td><td class="border border-gray-200 p-2 text-sm">Dil, bölge, tema gibi tercihlerin hatırlanması</td><td class="border border-gray-200 p-2 text-sm">Evet</td><td class="border border-gray-200 p-2 text-sm">Oturum – 12 ay</td></tr>
<tr><td class="border border-gray-200 p-2 text-sm">Analitik</td><td class="border border-gray-200 p-2 text-sm">Kullanım, performans ve hata ölçümü, hizmet iyileştirme</td><td class="border border-gray-200 p-2 text-sm">Evet</td><td class="border border-gray-200 p-2 text-sm">Genellikle ≤ 24 ay</td></tr>
<tr><td class="border border-gray-200 p-2 text-sm">Pazarlama</td><td class="border border-gray-200 p-2 text-sm">İlgi alanına dayalı tanıtım, kampanya ölçümü</td><td class="border border-gray-200 p-2 text-sm">Evet</td><td class="border border-gray-200 p-2 text-sm">Genellikle ≤ 12 ay</td></tr>
</tbody>
</table>

<h4>4. Üçüncü Taraf Çerezleri</h4>
<p>hangel'in altyapısı <strong>Google / Firebase</strong> ve <strong>Apple</strong> hizmetlerini içerdiğinden, bu sağlayıcılara ait analitik veya işlevsel çerezler/SDK tanımlayıcıları kullanılabilir. Üçüncü taraf çerezleri yoluyla yapılabilecek yurt dışı aktarımlar, hangel'in Veri Transferi ve Hosting Beyanı ile gizlilik bildiriminde açıklanan güvencelere (yeterlilik kararı / standart sözleşme / SCC) tabidir.</p>

<h4>5. Rıza Yönetimi ve Tercih Merkezi</h4>
<p>hangel, kullanıcılara ilk erişimde bir <strong>çerez bilgilendirme/onay arayüzü (banner)</strong> sunmayı ve zorunlu olmayan çerezleri kategori bazında <strong>kabul etme veya reddetme</strong> imkânı tanımayı hedefler. Kullanıcılar, bir <strong>Tercih Merkezi</strong> aracılığıyla rızalarını dilediği zaman güncelleyebilir veya geri alabilir. Rızanın geri alınması, geri alma anına kadar gerçekleştirilmiş işlemenin hukukiliğini etkilemez. Rızayı reddetmek, zorunlu çerezler dışındaki çerezlerin yüklenmemesiyle sonuçlanır ve temel hizmete erişimi engellemez.</p>

<h4>6. Tarayıcı ve Cihaz Üzerinden Kontrol</h4>
<p>Kullanıcılar, çerezleri tarayıcı ayarlarından silebilir veya engelleyebilir; mobil cihazlarda reklam tanımlayıcısını sıfırlayabilir ya da ilgi alanına dayalı reklamcılığı kısıtlayabilir. Zorunlu çerezlerin engellenmesi, platformun bazı işlevlerinin düzgün çalışmamasına yol açabilir.</p>

<h4>7. Çocuklar</h4>
<p>hangel, çocuklara yönelik profilleme amaçlı pazarlama çerezleri kullanmamayı esas alır. Çocukların verilerinin korunmasına ilişkin ilave güvenceler, "Çocukların Kişisel Verilerinin Korunması" politikasında düzenlenmiştir.</p>

<h4>8. Haklar ve Başvuru</h4>
<p>Kullanıcılar, çerezler yoluyla işlenen kişisel verilerine ilişkin olarak KVKK m.11 ve GDPR Art. 15-22'deki haklarını kullanabilir. Bu haklar arasında; çerezler yoluyla toplanan veriye erişim, düzeltme, silme, işlemeye itiraz ve doğrudan pazarlama amaçlı işlemeyi reddetme yer alır. Birleşik Krallık'ta bulunan kullanıcılar bakımından çerez kullanımı PECR 2003 ile UK GDPR'ın birlikte uygulanmasına tabidir. Başvuru kanalları: Türkiye <a href="mailto:kvkk@hangel.org">kvkk@hangel.org</a>, uluslararası <a href="mailto:privacy@hangel.org">privacy@hangel.org</a> ve <a href="mailto:dpo@hangel.org">dpo@hangel.org</a>. AB'de bulunan kullanıcılar ayrıca GDPR Art. 77 uyarınca yetkili denetim makamına şikâyette bulunabilir.</p>

<h4>9. Rıza Kayıtlarının Tutulması ve Hesap Verebilirlik</h4>
<p>hangel, hesap verebilirlik ilkesi (GDPR Art. 5/2) gereği, zorunlu olmayan çerezler için alınan rızaların; <strong>ne zaman</strong>, <strong>hangi kategoriler</strong> için ve <strong>hangi metin sürümüne</strong> istinaden verildiğini gösterir kayıtları tutmayı esas alır. Bu kayıtlar, rızanın varlığının ispatı ve denetim makamlarına karşı uyumun gösterilmesi amacıyla, ilgili mevzuatın gerektirdiği süreyle saklanır. Kullanıcı rızasını geri aldığında, bu işlem de tarihçeye işlenir ve ilgili çerezlerin yüklenmesi durdurulur.</p>

<h4>10. Çerez Listesinin Güncelliği</h4>
<p>Çerez teknolojileri ve kullanılan üçüncü taraf hizmetleri zamanla değişebileceğinden, hangel kullanılan çerezlere ilişkin ad, sağlayıcı, amaç ve süre bilgilerini içeren <strong>ayrıntılı bir çerez envanterini</strong> güncel tutmayı ve Tercih Merkezi ile ilişkili olarak yayımlamayı hedefler. Bu envanter, işbu politikanın ayrılmaz bir tamamlayıcısıdır ve bağlayıcı kategoriler bakımından bu metni esas alır.</p>

<h4>11. İlgili Politikalara Atıf</h4>
<p>Bu Çerez Politikası; hangel'in genel gizlilik bildirimi, "Veri İşleme Amaçları ve Hukuki Dayanaklar Beyanı", "Veri Transferi ve AB Merkezli Hosting Beyanı" ile "Çocukların Kişisel Verilerinin Korunması" politikalarıyla birlikte bütün olarak değerlendirilir. Çerezler yoluyla toplanan kişisel verilerin işleme amaçları, saklama süreleri ve yurt dışı aktarım güvenceleri bakımından söz konusu metinlerdeki düzenlemeler tamamlayıcı niteliktedir.</p>

<h4>12. Değişiklik ve Yürürlük</h4>
<p>Bu politika, kullanılan çerezlerdeki ve mevzuattaki değişikliklere göre güncellenir; güncel metin platformda yayımlandığı tarihte yürürlüğe girer. Esaslı değişiklikler, kullanıcılara uygun kanallarla bildirilir ve gerekli hâllerde yeniden rıza talep edilir.</p>

<p class="text-xs text-muted-foreground"><em>Bu metin bilgilendirme amaçlıdır ve bağlayıcı nihai hukuki görüş niteliği taşımaz; yürürlük öncesi yetkili hukuk danışmanlığı önerilir.</em></p>
    `
  },
  {
    slug: 'bilgi-guvenligi-politikasi',
    title: 'Bilgi Güvenliği Politikası',
    content: `
      <h3>Bilgi Güvenliği Politikası</h3>

<p>Bu politika, hangel platformunda işlenen bilgi varlıklarının <strong>gizliliğini, bütünlüğünü ve erişilebilirliğini</strong> korumaya yönelik ilkeleri, mevcut kontrolleri ve gelişim hedeflerini ortaya koyar. Platformu işleten tüzel kişi <strong>hangel AŞ</strong>'dir. Kullanıcıya görünen tüm düz metinde "hangel" küçük harfle yazılır. hangel; acil kan talebi/eşleştirme, bağış, gönüllülük, STK profilleri ve etki raporlama hizmetlerinde özel nitelikli sağlık verisi (kan grubu) dâhil hassas veriler işlediğinden, bilgi güvenliğini öncelikli bir sorumluluk olarak benimser.</p>

<p><strong>Dürüstlük beyanı:</strong> hangel, bu politikanın referans aldığı <strong>ISO/IEC 27001:2022</strong> standardı bakımından <em>henüz sertifikalı veya akredite değildir</em> ve bağımsız bir bilgi güvenliği yönetim sistemi (BGYS) denetiminden geçmemiştir. Aşağıda yalnızca gerçekten uygulanan kontroller "mevcut" olarak; geri kalan unsurlar ise açıkça <em>hedef ve yol haritası</em> olarak ifade edilmiştir.</p>

<h4>1. Amaç</h4>
<p>Bu politikanın amacı; hangel'in topladığı, işlediği ve sakladığı kişisel ve kurumsal verilerin yetkisiz erişime, ifşaya, değiştirilmeye, kaybolmaya veya kullanılamaz hâle gelmeye karşı korunmasını sağlamak, bilgi güvenliği risklerini tanımlanabilir ve yönetilebilir kılmaktır. Politika, gizlilik (confidentiality), bütünlük (integrity) ve erişilebilirlik (availability) ilkelerini bir bütün olarak gözetir.</p>

<h4>2. Kapsam</h4>
<p>Bu politika; hangel'in mobil/web uygulamaları, sunucu ve bulut altyapısı (Google Cloud / Firebase — Firestore, Authentication, Storage ve Apple ekosistemi), kaynak kodu, idari sistemleri, çalışanları, gönüllüleri ve yetkili üçüncü taraf hizmet sağlayıcılarını kapsar. Bilgi varlıkları; kullanıcı kimlik ve iletişim verileri, konum verileri, özel nitelikli sağlık verisi (kan grubu), cihaz/teknik veriler, finansal veriler (IBAN/ödeme) ve pazarlama izinlerini içerir.</p>

<h4>3. Referans Standart — Sertifikasyon Durumu</h4>
<p>Bu politika, uluslararası kabul görmüş aşağıdaki çerçeveleri <strong>referans</strong> alır; ancak bu durum bir uygunluk belgesi anlamına gelmez:</p>
<ul>
  <li><strong>ISO/IEC 27001:2022</strong> — Bilgi Güvenliği Yönetim Sistemleri (BGYS) gereklilikleri. <em>hangel henüz sertifikalı değildir; uyumu hedefler.</em></li>
  <li><strong>ISO/IEC 27002:2022</strong> — Bilgi güvenliği kontrolleri için uygulama rehberi (dört tema: kurumsal, kişiler, fiziksel, teknolojik kontroller).</li>
  <li><strong>6698 sayılı KVKK m.12</strong> — Veri güvenliğine ilişkin yükümlülükler (uygun teknik ve idari tedbirler; m.12/5 ihlal bildirimi).</li>
  <li><strong>GDPR Art.32</strong> — İşlemenin güvenliği (uygun teknik ve organizasyonel önlemler; takma adlaştırma ve şifreleme dâhil).</li>
  <li>İlave iyi uygulama referansları: <strong>OWASP ASVS / Top 10</strong> ve <strong>NIST SP 800-115</strong> (güvenlik testi rehberi).</li>
</ul>
<blockquote><p>Önemli: hangel'in ISO/IEC 27001 sertifikasına sahip olduğu, bağımsız bir BGYS denetiminden geçtiği veya akredite edildiği <strong>hiçbir biçimde beyan edilmemektedir</strong>. Bu standartlar, hangel'in gelişim yol haritasının hedefleridir.</p></blockquote>

<h4>4. Mevcut / Uygulanan Kontroller</h4>
<p>hangel, aşağıdaki kontrolleri hâlihazırda uygulamaya yönelik makul önlemler almaktadır:</p>
<ul>
  <li><strong>Aktarımda şifreleme:</strong> İstemci-sunucu iletişiminde TLS/HTTPS kullanımı.</li>
  <li><strong>Bekleyen veride şifreleme:</strong> Google Cloud / Firebase altyapısının sağladığı varsayılan depolama şifrelemesinden yararlanma.</li>
  <li><strong>Kimlik doğrulama ve erişim kontrolü:</strong> Firebase Authentication temelli kullanıcı doğrulaması ve yetki bazlı erişim ayrımı.</li>
  <li><strong>En az yetki ilkesi:</strong> İdari panel ve veritabanı erişiminin yalnızca görev gereği yetkili kişilere tanınması.</li>
  <li><strong>Yedekleme:</strong> Bulut sağlayıcının yedekleme ve dayanıklılık olanaklarından faydalanma.</li>
  <li><strong>Güvenlik kuralları:</strong> Firestore/Storage güvenlik kurallarıyla veri erişiminin sınırlandırılması.</li>
</ul>
<p>Bu kontroller dışında kalan tüm unsurlar aşağıdaki tabloda <strong>hedef</strong> olarak çerçevelenmiştir.</p>

<h4>5. Gelişim Yol Haritası ve Hedefler</h4>
<p>Aşağıdaki tablo, hangel'in mevcut durumunu hedeflenen olgunluk düzeyiyle dürüstçe karşılaştırır. "Mevcut" sütunu bugünkü gerçek durumu; "Hedef" sütunu henüz tamamlanmamış taahhütleri gösterir.</p>
<table class="w-full border-collapse border border-gray-200 my-4">
  <thead>
    <tr>
      <th class="border border-gray-200 p-2 text-left text-sm" scope="col">Alan</th>
      <th class="border border-gray-200 p-2 text-left text-sm" scope="col">Mevcut Durum</th>
      <th class="border border-gray-200 p-2 text-left text-sm" scope="col">Hedef</th>
    </tr>
  </thead>
  <tbody>
    <tr><td class="border border-gray-200 p-2 text-sm">BGYS sertifikasyonu</td><td class="border border-gray-200 p-2 text-sm">Sertifika yok; ISO/IEC 27001 referans alınıyor</td><td class="border border-gray-200 p-2 text-sm">Ölçek elverdiğinde resmî ISO/IEC 27001:2022 belgelendirmesi</td></tr>
    <tr><td class="border border-gray-200 p-2 text-sm">Risk değerlendirmesi</td><td class="border border-gray-200 p-2 text-sm">Temel, gayri resmî risk değerlendirmesi</td><td class="border border-gray-200 p-2 text-sm">Belgelenmiş, periyodik bilgi güvenliği risk metodolojisi</td></tr>
    <tr><td class="border border-gray-200 p-2 text-sm">Uygulanabilirlik Bildirimi (SoA)</td><td class="border border-gray-200 p-2 text-sm">Henüz oluşturulmadı</td><td class="border border-gray-200 p-2 text-sm">Annex A kontrolleri için SoA hazırlanması</td></tr>
    <tr><td class="border border-gray-200 p-2 text-sm">Şifreleme</td><td class="border border-gray-200 p-2 text-sm">TLS aktarımda; bulut varsayılan depolama şifrelemesi</td><td class="border border-gray-200 p-2 text-sm">Anahtar yönetimi politikası ve hassas alanlarda ek şifreleme</td></tr>
    <tr><td class="border border-gray-200 p-2 text-sm">Erişim yönetimi</td><td class="border border-gray-200 p-2 text-sm">Rol bazlı temel erişim ayrımı</td><td class="border border-gray-200 p-2 text-sm">Çok faktörlü kimlik doğrulama ve düzenli erişim gözden geçirmesi</td></tr>
    <tr><td class="border border-gray-200 p-2 text-sm">Günlükleme / izleme</td><td class="border border-gray-200 p-2 text-sm">Bulut sağlayıcı temelli temel günlükler</td><td class="border border-gray-200 p-2 text-sm">Merkezî güvenlik izleme ve uyarı (SIEM benzeri) yapısı</td></tr>
    <tr><td class="border border-gray-200 p-2 text-sm">Sızma testi</td><td class="border border-gray-200 p-2 text-sm">Henüz bağımsız sızma testi yaptırılmadı</td><td class="border border-gray-200 p-2 text-sm">Periyodik bağımsız sızma testi ve açık yönetimi (OWASP/NIST SP 800-115)</td></tr>
    <tr><td class="border border-gray-200 p-2 text-sm">Olay müdahale</td><td class="border border-gray-200 p-2 text-sm">Temel ihlal bildirim yaklaşımı</td><td class="border border-gray-200 p-2 text-sm">Belgelenmiş olay müdahale ve KVKK m.12/5 uyumlu 72 saat süreci</td></tr>
    <tr><td class="border border-gray-200 p-2 text-sm">Farkındalık eğitimi</td><td class="border border-gray-200 p-2 text-sm">Gayri resmî bilgilendirme</td><td class="border border-gray-200 p-2 text-sm">Düzenli, kayıtlı bilgi güvenliği farkındalık eğitimleri</td></tr>
  </tbody>
</table>

<h4>6. Gizlilik, Bütünlük ve Erişilebilirlik İlkeleri</h4>
<p>hangel, bilgi güvenliğini üç temel ilkenin dengesi olarak ele alır:</p>
<ul>
  <li><strong>Gizlilik (Confidentiality):</strong> Kişisel ve hassas verilere yalnızca yetkili kişilerin, görev gereği ve sınırlı ölçüde erişebilmesi. Özel nitelikli sağlık verisi (kan grubu) bu ilke bakımından en yüksek koruma düzeyini hedefler.</li>
  <li><strong>Bütünlük (Integrity):</strong> Verilerin yetkisiz biçimde değiştirilmemesi, doğru ve eksiksiz kalması. Kan eşleştirme gibi yaşamsal süreçlerde veri bütünlüğünün bozulması doğrudan can güvenliğini etkileyebileceğinden, bu ilke ayrıca önemlidir.</li>
  <li><strong>Erişilebilirlik (Availability):</strong> Yetkili kullanıcıların ihtiyaç duydukları anda hizmete ve verilere erişebilmesi; özellikle acil kan talebi akışının kesintisiz çalışmasının hedeflenmesi.</li>
</ul>
<p>Bu üç ilke, veri sınıflandırması yaklaşımıyla desteklenir: hangel, verileri hassasiyet düzeyine göre (kamuya açık, dâhilî, hassas, özel nitelikli) değerlendirmeyi ve koruma tedbirlerini bu sınıflandırmayla orantılı uygulamayı hedefler.</p>

<h4>7. Roller ve Sorumluluklar</h4>
<p>Bilgi güvenliğinin gözetiminden hangel AŞ üst yönetimi nihai olarak sorumludur. hangel, ölçeği elverdiğinde bir bilgi güvenliği sorumlusu/koordinatörü atamayı ve sorumluluk dağılımını belgelemeyi hedefler. Tüm çalışanlar, gönüllüler ve yetkili üçüncü taraflar, görevleri kapsamında bu politikaya uymakla yükümlüdür. Veri koruma boyutu için <a href="mailto:kvkk@hangel.org" rel="noopener" target="_blank">kvkk@hangel.org</a> (TR) ve <a href="mailto:dpo@hangel.org" rel="noopener" target="_blank">dpo@hangel.org</a> (uluslararası) ile irtibat kurulabilir.</p>

<h4>8. Tedarikçi ve Yurt Dışı Aktarım Güvenliği</h4>
<p>hangel, bulut altyapısı için Google Cloud / Firebase ve Apple hizmetlerinden yararlandığından, bu sağlayıcıların güvenlik taahhütlerine dayanır ve verilerin bir kısmı yurt dışında işlenebilir. Bu aktarımlar; Türkiye'deki kullanıcılar için KVKK m.9, AB'deki kullanıcılar için GDPR Art.44-49 çerçevesinde değerlendirilir ve hangel'in veri transferi/hosting belgeleriyle birlikte yorumlanır.</p>

<h4>9. Taahhüt ve Şeffaflık</h4>
<p>hangel, bu politikada yer alan hedeflere ulaşmak için iyi niyetli ve makul çaba göstermeyi taahhüt eder; mevcut durum ile hedef arasındaki farkı dürüstçe açıklamayı bir şeffaflık ilkesi olarak benimser. Standartlara tam uyum sağlandıkça ve bağımsız doğrulama elde edildikçe bu politika güncellenecek ve gerçek durumu yansıtacaktır. hangel, kanıtlanmamış bir güvenlik düzeyini "sağlanmış" gibi sunmaktan kaçınır.</p>

<h4>10. Değişiklik ve Yürürlük</h4>
<p>Bu politika; mevzuat, teknoloji ve hizmet gelişmeleri ile gelişim yol haritasındaki ilerlemeler doğrultusunda güncellenebilir. Güncel sürüm, platformda yayımlandığı tarihte yürürlüğe girer.</p>

<p class="text-xs text-muted-foreground"><em>Bu metin bilgilendirme amaçlıdır ve bağlayıcı nihai hukuki görüş niteliği taşımaz; yürürlük öncesi yetkili hukuk danışmanlığı önerilir.</em></p>
    `
  },
  {
    slug: 'cocuklarin-verilerinin-korunmasi',
    title: 'Çocukların Kişisel Verilerinin Korunması (COPPA Uyumu)',
    content: `
      <h3>Çocukların Kişisel Verilerinin Korunması (COPPA Uyumu)</h3>

<p>Bu politika, hangel platformunda çocukların kişisel verilerinin nasıl korunduğunu, geçerli yaş eşiklerini ve doğrulanabilir ebeveyn onayı mekanizmalarını açıklar. Politika; Amerika Birleşik Devletleri'nde <strong>COPPA — Children's Online Privacy Protection Act (15 U.S.C. §6501-6506)</strong> ve uygulama kuralı <strong>16 CFR Part 312</strong>, Türkiye'de <strong>6698 sayılı KVKK</strong>, AB'de ise <strong>GDPR (EU) 2016/679 Art. 8</strong> çerçevesinde hazırlanmıştır. Veri sorumlusu <strong>hangel AŞ</strong>'dir.</p>

<h4>1. Genel İlke ve Kapsam</h4>
<p>hangel, çocukların kişisel verilerinin korunmasına özel önem verir ve çocuklara ilişkin işlemede <strong>veri minimizasyonu</strong>, <strong>üstün yarar</strong> ve <strong>ebeveyn gözetimi</strong> ilkelerini esas alır. Çocuklara doğrudan hizmet sunulması hâlinde, aşağıda belirtilen yaş eşikleri ve onay koşulları uygulanır.</p>

<h4>2. Yaş Eşikleri (Ülkeye Göre Farklılık)</h4>
<p>Çocuk için geçerli yaş eşiği, kullanıcının bulunduğu ülkenin mevzuatına göre değişir:</p>
<table class="w-full border-collapse border border-gray-200 my-4">
<thead>
<tr>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Yetki Alanı</th>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Yaş Eşiği</th>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Onay Koşulu</th>
</tr>
</thead>
<tbody>
<tr><td class="border border-gray-200 p-2 text-sm">ABD (COPPA)</td><td class="border border-gray-200 p-2 text-sm">13 yaş altı</td><td class="border border-gray-200 p-2 text-sm">Doğrulanabilir ebeveyn onayı (16 CFR §312.5)</td></tr>
<tr><td class="border border-gray-200 p-2 text-sm">AB (GDPR Art. 8)</td><td class="border border-gray-200 p-2 text-sm">Varsayılan 16; üye devlet 13'e kadar indirebilir</td><td class="border border-gray-200 p-2 text-sm">Velayet sahibinin onayı/yetkilendirmesi</td></tr>
<tr><td class="border border-gray-200 p-2 text-sm">Türkiye (KVKK)</td><td class="border border-gray-200 p-2 text-sm">Reşit olmayan için veli/vasi onayı</td><td class="border border-gray-200 p-2 text-sm">Veli/vasi onayı + m.6 (özel nitelikli veri)</td></tr>
</tbody>
</table>

<h4>3. COPPA — Doğrulanabilir Ebeveyn Onayı (16 CFR Part 312)</h4>
<p>13 yaşından küçük bir çocuğun kişisel verisi toplanmadan önce hangel, COPPA <strong>16 CFR §312.5</strong> uyarınca <strong>doğrulanabilir ebeveyn onayı (verifiable parental consent)</strong> almayı taahhüt eder. Onay yöntemleri, mevcut teknolojiye uygun makul çabayı gerektirir ve özellikle şunları içerebilir: imzalı onay formu, kredi kartı/çevrimiçi ödeme ile küçük bir işlem, devlet tarafından verilmiş kimliğin doğrulanması, bilgi temelli kimlik doğrulama (yalnızca yetişkinin yanıtlayabileceği dinamik çoktan seçmeli sorular), insan incelemesi içeren yüz tanıma, ya da takip aramasıyla teyit edilen geri arama/SMS yöntemleri. FTC'nin <strong>2025 COPPA Kuralı değişiklikleri</strong> uyarınca hangel, çocuk verisinin <strong>üçüncü taraflara aktarımı</strong> için ayrı bir ebeveyn onayı almayı ve çocuk verilerine yönelik yazılı bir <strong>bilgi güvenliği programı</strong> oluşturmayı esas alır.</p>

<h4>4. COPPA Kapsamındaki Ebeveyn Hakları</h4>
<p>Ebeveynler, COPPA uyarınca; çocuklarına ait toplanan kişisel verileri inceleme, daha fazla toplamayı reddetme, mevcut verinin silinmesini talep etme ve önceden verdikleri onayı geri alma haklarına sahiptir. hangel, bu talepleri yerine getirmek için makul ve erişilebilir bir kanal sağlar.</p>

<h4>5. GDPR Art. 8 — Bilgi Toplumu Hizmetlerinde Çocuğun Rızası</h4>
<p>AB'de, bilgi toplumu hizmetlerinin doğrudan bir çocuğa sunulması hâlinde, çocuğun rızasına dayalı işleme varsayılan olarak <strong>16 yaşından itibaren</strong> geçerlidir; üye devletler bu yaşı <strong>13'ten aşağı olmamak</strong> kaydıyla kanunla düşürebilir. Çocuk bu yaşın altındaysa işleme, ancak <strong>velayet sahibinin onayı veya yetkilendirmesiyle</strong> hukuki olur. hangel, mevcut teknolojiyi dikkate alarak onayın velayet sahibince verildiğini doğrulamak için makul çabayı gösterir (Art. 8/2).</p>

<h4>6. KVKK — Türkiye'de Çocuk Verileri</h4>
<p>Türkiye'de, fiil ehliyeti bulunmayan veya sınırlı olan çocuklar bakımından kişisel veri işleme, kural olarak veli/vasinin onayına dayandırılır. Kan grubu gibi <strong>özel nitelikli sağlık verisi</strong> söz konusu olduğunda, KVKK m.6 uyarınca daha sıkı koşullar ve veli/vasi onayı birlikte aranır.</p>

<h4>7. Veri Minimizasyonu ve Yasaklı Uygulamalar</h4>
<p>hangel, çocuklardan yalnızca hizmet için gerekli asgari veriyi toplar; çocuklara yönelik <strong>davranışsal hedefli reklamcılık</strong> ve gereğinden fazla veri toplamayı uygulamamayı esas alır. Çocuk verileri yalnızca toplanma amacının gerektirdiği süreyle saklanır ve amaç ortadan kalktığında silinir veya anonim hâle getirilir.</p>

<h4>8. Haklar, Başvuru ve İletişim</h4>
<p>Ebeveyn/veli/vasiler ve ilgili kişiler, çocuğa ilişkin verilere dair talep ve başvurularını şu kanallar üzerinden iletebilir: Türkiye <a href="mailto:kvkk@hangel.org">kvkk@hangel.org</a>, uluslararası <a href="mailto:privacy@hangel.org">privacy@hangel.org</a> ve <a href="mailto:dpo@hangel.org">dpo@hangel.org</a>.</p>

<h4>9. COPPA Kapsamındaki Bildirim Yükümlülükleri</h4>
<p>hangel, COPPA <strong>16 CFR §312.4</strong> uyarınca, çocuklardan veri toplamadan önce ebeveynlere doğrudan bildirim yapmayı ve gizlilik bildiriminde; toplanan veri kategorilerini, toplama amaçlarını, ifşa uygulamalarını, ebeveyn haklarını ve iletişim bilgilerini açık biçimde sunmayı esas alır. "İç işlemlerin desteklenmesi" (support for internal operations) istisnasına dayanıldığı hâllerde, 2025 değişiklikleriyle getirilen ek bildirim gereklilikleri gözetilir. Çocuk verisi, toplanma amacının makul biçimde gerektirdiği süreden daha uzun saklanmaz (veri saklama sınırı).</p>

<h4>10. Yaş Doğrulama ve Erişimin Sınırlandırılması</h4>
<p>hangel, hizmetin niteliğine uygun, çocukları gereksiz biçimde veri vermeye teşvik etmeyen makul bir <strong>yaş tarama (age-gating)</strong> mekanizması uygulamayı hedefler. Geçerli eşiğin altındaki bir kullanıcının tespit edilmesi hâlinde, doğrulanabilir ebeveyn onayı (COPPA) veya velayet sahibi onayı (GDPR Art. 8) sağlanana kadar ilgili veri işleme faaliyeti başlatılmaz veya askıya alınır. Onay sağlanamazsa, toplanmış veri silinir.</p>

<h4>11. Üçüncü Taraflar ve Veri Paylaşımı</h4>
<p>Çocuklara ait kişisel verilerin üçüncü taraflarla paylaşımı, yalnızca hizmetin sunulması için gerekli ve hukuki dayanağı bulunan hâllerle sınırlıdır. 2025 COPPA Kuralı uyarınca, çocuk verilerinin üçüncü taraflara <strong>ifşası için ayrı ve özel bir ebeveyn onayı</strong> alınması esas alınır. hangel, çocuk verileriyle ilgili alt-işleyenlerin de eşdeğer koruma standartlarına uymasını sözleşmesel olarak güvence altına almayı taahhüt eder.</p>

<h4>12. Değişiklik ve Yürürlük</h4>
<p>Bu politika, çocukların korunmasına ilişkin mevzuat ve uygulamalardaki gelişmelere göre güncellenir ve güncel metin yayımlandığı tarihte yürürlüğe girer.</p>

<p class="text-xs text-muted-foreground"><em>Bu metin bilgilendirme amaçlıdır ve bağlayıcı nihai hukuki görüş niteliği taşımaz; yürürlük öncesi yetkili hukuk danışmanlığı önerilir.</em></p>
    `
  },
  {
    slug: 'abd-eyalet-bazli-veri-politikasi',
    title: 'ABD Eyalet Bazlı Veri Koruma Politikası (CCPA/CPRA)',
    content: `
      <h3>ABD Eyalet Bazlı Veri Koruma Politikası (CCPA/CPRA)</h3>

<p>Bu politika, hangel platformunu Amerika Birleşik Devletleri'nin California eyaletinden kullanan tüketicilere (consumers) yöneliktir ve <strong>California Consumer Privacy Act (CCPA)</strong> ile bu kanunu kapsamlı biçimde değiştiren ve genişleten <strong>California Privacy Rights Act (CPRA)</strong> çerçevesinde, California Medeni Kanunu (California Civil Code) Bölüm 1798.100 ve devamı hükümleri uyarınca California sakinlerinin haklarını ve hangel'in yükümlülüklerini açıklar. Platformu işleten tüzel kişi <strong>hangel AŞ</strong>'dir. Metinde kullanıcıya görünen yerlerde "hangel" küçük harfle yazılır.</p>

<p>hangel, Türkiye merkezli bir toplumsal etki platformu olmakla birlikte, hizmetlerine California'dan erişen kişilerin kişisel bilgileri (personal information) bakımından CCPA/CPRA'nın eyalet dışı işletmelere uygulanabilen hükümlerine uyumu hedefler ve bu politikayı bu doğrultuda yayımlar.</p>

<h4>1. Kapsam ve Uygulanabilirlik</h4>
<p>Bu politika, yalnızca California sakini olan ve hangel ile tüketici sıfatıyla etkileşime giren kişilere uygulanır. CCPA/CPRA kapsamındaki "kişisel bilgi" (personal information), Cal. Civ. Code §1798.140 anlamında, belirli bir tüketiciyi veya haneyi doğrudan ya da dolaylı olarak tanımlayan, tanımlamaya elverişli olan veya makul biçimde ilişkilendirilebilen bilgileri kapsar. İstihdam ilişkisi kapsamındaki veriler ile B2B iletişim verileri için CPRA istisnaları saklıdır.</p>

<h4>2. Topladığımız Kişisel Bilgi Kategorileri</h4>
<table class="w-full border-collapse border border-gray-200 my-4">
  <thead>
    <tr>
      <th class="border border-gray-200 p-2 text-left text-sm" scope="col">CCPA/CPRA Kategorisi</th>
      <th class="border border-gray-200 p-2 text-left text-sm" scope="col">Örnekler</th>
    </tr>
  </thead>
  <tbody>
    <tr><td class="border border-gray-200 p-2 text-sm">Tanımlayıcılar (identifiers)</td><td class="border border-gray-200 p-2 text-sm">Ad, soyad, e-posta, hesap kimliği, IP adresi, cihaz kimliği</td></tr>
    <tr><td class="border border-gray-200 p-2 text-sm">Cal. Civ. Code §1798.80(e) kategorileri</td><td class="border border-gray-200 p-2 text-sm">İletişim bilgileri, finansal bilgi (IBAN/ödeme aracı)</td></tr>
    <tr><td class="border border-gray-200 p-2 text-sm">Ticari bilgiler</td><td class="border border-gray-200 p-2 text-sm">Bağış geçmişi, gönüllülük katılım kayıtları</td></tr>
    <tr><td class="border border-gray-200 p-2 text-sm">İnternet/ağ etkinliği</td><td class="border border-gray-200 p-2 text-sm">Uygulama içi gezinme, etkileşim kayıtları</td></tr>
    <tr><td class="border border-gray-200 p-2 text-sm">Coğrafi konum verileri</td><td class="border border-gray-200 p-2 text-sm">Acil kan eşleştirmesi için yaklaşık/kesin konum</td></tr>
    <tr><td class="border border-gray-200 p-2 text-sm"><strong>Hassas kişisel bilgi (sensitive PI)</strong></td><td class="border border-gray-200 p-2 text-sm"><strong>Sağlık verisi olan kan grubu</strong>, kesin coğrafi konum, oturum kimlik bilgileri</td></tr>
  </tbody>
</table>

<h4>3. Hassas Kişisel Bilgi ve Kullanımın Sınırlandırılması (§1798.121)</h4>
<p>CPRA, "hassas kişisel bilgi" (sensitive personal information) için ayrı bir koruma rejimi getirmiştir. Cal. Civ. Code §1798.121 uyarınca tüketiciler, hassas kişisel bilgilerinin yalnızca makul olarak beklenen hizmetin sağlanması için gerekli kullanımlarla <em>sınırlandırılmasını</em> talep etme hakkına sahiptir. hangel için en kritik hassas kategori, kan eşleştirme hizmetinin temelini oluşturan <strong>kan grubu (sağlık verisi)</strong>dır. hangel bu veriyi yalnızca acil kan talebi/eşleştirme ve ilgili hizmetin sunulması amacıyla işler; tüketiciye profil çıkarmak veya pazarlama amaçlı çıkarımlar yapmak için kullanmaz. Platform, "Hassas Kişisel Bilgilerimin Kullanımını Sınırla" (Limit the Use of My Sensitive Personal Information) bağlantısını sunmayı taahhüt eder.</p>

<h4>4. Kişisel Bilgiyi Satmıyor ve Paylaşmıyoruz (§1798.120)</h4>
<p><strong>hangel kişisel bilgileri SATMAZ.</strong> CCPA/CPRA anlamında "satış" (sale) bir bedel veya değerli karşılık (valuable consideration) ödenerek kişisel bilginin üçüncü taraflara açılması, "paylaşım" (sharing) ise çapraz-bağlamlı davranışsal reklamcılık (cross-context behavioral advertising) amacıyla açılmasıdır. hangel, kişisel bilgileri bu anlamlarda ne satmakta ne de davranışsal reklam için paylaşmaktadır. Yine de Cal. Civ. Code §1798.120 uyarınca tüketicilerin satış/paylaşımdan vazgeçme (opt-out) hakkını yansıtmak üzere platformda <strong>"Kişisel Bilgilerimi Satmayın veya Paylaşmayın" (Do Not Sell or Share My Personal Information)</strong> bağlantısı sunulur.</p>

<h4>5. Global Privacy Control (GPC) Sinyali</h4>
<p>hangel, tarayıcı veya cihaz düzeyinde iletilen <strong>Global Privacy Control (GPC)</strong> tipi opt-out tercih sinyallerini, CCPA Yönetmeliği (Cal. Code Regs. tit. 11) çerçevesinde geçerli bir vazgeçme talebi olarak kabul etmeyi hedefler. hangel kişisel bilgi satmadığından/paylaşmadığından bu sinyalin pratik etkisi sınırlı olsa da, ilgili tercih kaydedilir ve saygı gösterilir.</p>

<h4>6. Bilme Hakkı (§1798.110 ve §1798.115)</h4>
<p>Cal. Civ. Code §1798.110 uyarınca tüketici, hangel'in kendisi hakkında topladığı kişisel bilgi <em>kategorilerini</em>, toplama kaynaklarını, işleme/ticari amaçlarını ve bilginin açıklandığı üçüncü taraf kategorilerini bilme hakkına sahiptir. §1798.115 uyarınca ise tüketici, kişisel bilgisinin satılıp satılmadığını veya paylaşılıp paylaşılmadığını ve hangi alıcı kategorilerine açıldığını bilme hakkına sahiptir. hangel, son 12 aylık döneme ilişkin bu bilgileri talep üzerine sağlar.</p>

<h4>7. Silme ve Düzeltme Hakkı (§1798.105 ve §1798.106)</h4>
<p>Cal. Civ. Code §1798.105 uyarınca tüketici, hangel'in topladığı kişisel bilginin <strong>silinmesini</strong> talep edebilir; bu hak, kanunda sayılan istisnalar (işlemin tamamlanması, hukuki yükümlülüğe uyum, güvenlik vb.) saklı kalmak kaydıyla uygulanır. Cal. Civ. Code §1798.106 uyarınca tüketici, yanlış (inaccurate) kişisel bilginin <strong>düzeltilmesini</strong> talep edebilir. hangel, kimlik doğrulaması yaptıktan sonra bu talepleri ilgili yönetmeliklerde öngörülen süreler içinde yanıtlar.</p>

<h4>8. Ayrımcılık Yasağı (§1798.125)</h4>
<p>Cal. Civ. Code §1798.125 uyarınca hangel, bir tüketiciye CCPA/CPRA kapsamındaki haklarını kullandığı için <strong>ayrımcılık veya misilleme uygulamaz</strong>: hizmeti reddetmez, farklı fiyat veya kalite uygulamaz, ceza niteliğinde uygulama yapmaz. hangel'in temel hizmetleri (kan eşleştirme, bağış, gönüllülük) bu haklardan herhangi birinin kullanılmasından olumsuz etkilenmez.</p>

<h4>9. Haklarınızı Nasıl Kullanırsınız</h4>
<p>California sakinleri yukarıdaki haklarını kullanmak için <a href="mailto:privacy@hangel.org" rel="noopener" target="_blank">privacy@hangel.org</a> adresine başvurabilir. hangel kimlik doğrulaması yapar; doğrulanabilir tüketici talebi (verifiable consumer request) gereklidir. Tüketici, yetkili bir vekil (authorized agent) aracılığıyla da talepte bulunabilir. hangel, hak kullanımı talebine ilişkin ücret talep etmez; mükerrer veya açıkça temelsiz talepler istisnadır.</p>

<h4>10. Veri Saklama Süreleri</h4>
<p>CPRA, kişisel bilginin makul olarak gerekli olandan daha uzun süre saklanmamasını gerektirir (Cal. Civ. Code §1798.100(a)). hangel, her kişisel bilgi kategorisini yalnızca toplama amacının gerektirdiği süre boyunca veya geçerli bir yasal yükümlülüğün gerektirdiği ölçüde saklamayı taahhüt eder. Saklama süresinin sonunda bilgi silinir veya geri döndürülemez biçimde anonimleştirilir.</p>

<h4>11. Reşit Olmayanlar</h4>
<p>Cal. Civ. Code §1798.120(c) uyarınca, 16 yaşından küçük tüketicilerin kişisel bilgilerinin satışı/paylaşımı için olumlu yetkilendirme (opt-in) gerekir; 13 yaşından küçükler için bu yetki ebeveyn/veli tarafından verilir. hangel kişisel bilgi satmadığından bu rejim pratikte uygulanmaz; bununla birlikte hangel, reşit olmayanların verilerini ayrıca federal COPPA (15 U.S.C. §6501-6506) ilkeleri ışığında özenle ele almayı hedefler.</p>

<h4>12. Diğer Eyalet Kanunlarına Atıf</h4>
<p>California dışındaki ABD eyaletlerinde de benzer kapsamlı veri koruma kanunları yürürlüktedir. Örneğin <strong>Virginia Consumer Data Protection Act (VCDPA)</strong> ve <strong>Colorado Privacy Act (CPA)</strong>, ilgili eyalet sakinlerine erişim, düzeltme, silme, taşınabilirlik ve hedefli reklam/satıştan vazgeçme hakları tanır. hangel, ilgili eyalet sakinlerine, o eyaletin kanunu kapsamındaki haklarını kullanma olanağını sağlamayı hedefler. Her yetki alanında o eyalete özgü kanun esas alınır.</p>

<h4>13. Altyapı ve Veri Aktarımı</h4>
<p>hangel hizmetleri Google Cloud / Firebase (Firestore, Authentication, Storage) ve Apple altyapısı üzerinde çalışır. Kişisel bilgiler, bu hizmet sağlayıcılarının ABD dahil çeşitli yargı bölgelerindeki sunucularında işlenebilir. Bu sağlayıcılar, hangel adına ve talimatları doğrultusunda hareket eden hizmet sağlayıcılar/işleyenler (service providers) olarak konumlanır; bu açıklamalar CCPA/CPRA anlamında satış teşkil etmez.</p>

<h4>14. Değişiklik ve Yürürlük</h4>
<p>Bu politika, CCPA/CPRA ve CPPA yönetmeliklerindeki değişiklikler, yeni eyalet kanunları veya hizmet kapsamındaki gelişmeler doğrultusunda güncellenebilir. Güncel sürüm platformda yayımlandığı tarihte yürürlüğe girer. Önemli değişikliklerde tüketiciler uygun kanallarla bilgilendirilir.</p>

<p class="text-xs text-muted-foreground"><em>Bu metin bilgilendirme amaçlıdır ve bağlayıcı nihai hukuki görüş niteliği taşımaz; yürürlük öncesi yetkili hukuk danışmanlığı önerilir.</em></p>
    `
  },
  {
    slug: 'ulke-bazli-veri-koruma-uyum-beyani',
    title: 'Ülke Bazlı Veri Koruma Uyum Beyanı',
    content: `
      <h3>Ülke Bazlı Veri Koruma Uyum Beyanı</h3>

<p>Bu beyan, hangel platformunun farklı ülke ve yargı alanlarındaki kullanıcılarına yönelik veri koruma yaklaşımını özetleyen bir <strong>şemsiye (umbrella) belgedir</strong>. hangel, Türkiye merkezli bir toplumsal etki platformudur ve hizmetlerine birden çok ülkeden erişilebilmektedir. Platformu işleten tüzel kişi <strong>hangel AŞ</strong>'dir. Bu beyan, her ülkenin kendi veri koruma mevzuatının yerini almaz; aksine, her yargı alanında <strong>o ülkeye özgü ayrıntılı belgenin esas olduğunu</strong> ve uygulamada <strong>en yüksek koruma standardının benimseneceğini</strong> ortaya koyar.</p>

<blockquote>
<p>hangel, dünya çapında her ülkenin veri koruma rejimine eksiksiz/toptan uyum iddiasında bulunmaz. Bu beyan temsilî bir çerçeve sunar; somut hak ve yükümlülükler, ilgili kullanıcının bulunduğu ülkeye özgü hangel veri koruma belgesinde düzenlenir.</p>
</blockquote>

<h4>1. Amaç ve Nitelik</h4>
<p>Bu belgenin amacı, hangel'in işlediği kişisel verilerin korunmasına ilişkin temel ilkelerin, kullanıcının bulunduğu ülkeden bağımsız olarak tutarlı biçimde uygulanmasını sağlamak ve hangi yargı alanında hangi kanunun ve hangi denetim otoritesinin referans alındığını şeffaf biçimde göstermektir. Belge, çatışma hâlinde <strong>kullanıcı lehine en koruyucu standardın</strong> uygulanacağını taahhüt eder.</p>

<h4>2. İşlenen Veriler ve Altyapı</h4>
<p>hangel; kimlik, iletişim, konum, <strong>özel nitelikli sağlık verisi olan kan grubu</strong>, cihaz/teknik veri, finansal veri (IBAN/ödeme) ve pazarlama izinlerini işler. Hizmetler Google Cloud / Firebase (Firestore, Authentication, Storage) ve Apple altyapısı üzerinde çalışır; bu durum, ülkeler arası veri aktarımı bakımından her yargı alanının ilgili aktarım rejiminin uygulanmasını gerektirir.</p>

<h4>3. Temsilî Yargı Alanı ve Mevzuat Tablosu</h4>
<p>Aşağıdaki tablo, hangel'in referans aldığı başlıca veri koruma rejimlerini, ilgili kanunu ve yetkili denetim otoritesini temsilî olarak listeler. Tablo kapsamlı değildir; ek yargı alanları için o ülkeye özgü belgeler esastır.</p>

<table class="w-full border-collapse border border-gray-200 my-4">
  <thead>
    <tr>
      <th class="border border-gray-200 p-2 text-left text-sm" scope="col">Ülke / Bölge</th>
      <th class="border border-gray-200 p-2 text-left text-sm" scope="col">İlgili Kanun</th>
      <th class="border border-gray-200 p-2 text-left text-sm" scope="col">Denetim Otoritesi</th>
    </tr>
  </thead>
  <tbody>
    <tr><td class="border border-gray-200 p-2 text-sm">Türkiye</td><td class="border border-gray-200 p-2 text-sm">6698 sayılı KVKK</td><td class="border border-gray-200 p-2 text-sm">Kişisel Verileri Koruma Kurumu (KVKK)</td></tr>
    <tr><td class="border border-gray-200 p-2 text-sm">Avrupa Birliği</td><td class="border border-gray-200 p-2 text-sm">GDPR — Regulation (EU) 2016/679</td><td class="border border-gray-200 p-2 text-sm">Üye devlet denetim makamları / EDPB</td></tr>
    <tr><td class="border border-gray-200 p-2 text-sm">Birleşik Krallık</td><td class="border border-gray-200 p-2 text-sm">UK GDPR + Data Protection Act 2018</td><td class="border border-gray-200 p-2 text-sm">Information Commissioner's Office (ICO)</td></tr>
    <tr><td class="border border-gray-200 p-2 text-sm">ABD — California</td><td class="border border-gray-200 p-2 text-sm">CCPA / CPRA (Cal. Civ. Code §1798.100 vd.)</td><td class="border border-gray-200 p-2 text-sm">California Privacy Protection Agency (CPPA)</td></tr>
    <tr><td class="border border-gray-200 p-2 text-sm">Brezilya</td><td class="border border-gray-200 p-2 text-sm">LGPD — Lei nº 13.709/2018</td><td class="border border-gray-200 p-2 text-sm">Autoridade Nacional de Proteção de Dados (ANPD)</td></tr>
    <tr><td class="border border-gray-200 p-2 text-sm">Kanada</td><td class="border border-gray-200 p-2 text-sm">PIPEDA</td><td class="border border-gray-200 p-2 text-sm">Office of the Privacy Commissioner of Canada (OPC)</td></tr>
    <tr><td class="border border-gray-200 p-2 text-sm">Avustralya</td><td class="border border-gray-200 p-2 text-sm">Privacy Act 1988 (Australian Privacy Principles)</td><td class="border border-gray-200 p-2 text-sm">Office of the Australian Information Commissioner (OAIC)</td></tr>
    <tr><td class="border border-gray-200 p-2 text-sm">Japonya</td><td class="border border-gray-200 p-2 text-sm">APPI (Act on the Protection of Personal Information)</td><td class="border border-gray-200 p-2 text-sm">Personal Information Protection Commission (PPC)</td></tr>
    <tr><td class="border border-gray-200 p-2 text-sm">Singapur</td><td class="border border-gray-200 p-2 text-sm">PDPA (Personal Data Protection Act 2012)</td><td class="border border-gray-200 p-2 text-sm">Personal Data Protection Commission (PDPC)</td></tr>
  </tbody>
</table>

<h4>4. En Yüksek Koruma Standardı İlkesi</h4>
<p>Aynı işleme faaliyetine birden fazla rejim uygulanabildiğinde, hangel ilgili kişi açısından <strong>en koruyucu sonucu doğuran</strong> standardı esas almayı taahhüt eder. Örneğin, açık rıza eşiği, saklama süresi sınırı, veri ihlali bildirim süresi veya hak kullanım süreleri arasında farklılık olduğunda kullanıcı lehine olan uygulanır. Bu ilke, hangel'in tüm yargı alanlarındaki kanunlara eşzamanlı tam uyum sağladığı anlamına gelmez; her ülkede o ülkeye özgü belge ve mevzuat bağlayıcıdır.</p>

<h4>5. Ülkeye Özgü Belgelerin Önceliği</h4>
<p>hangel; KVKK Aydınlatma Metni, GDPR Gizlilik Bildirimi, CCPA/CPRA Eyalet Politikası ve LGPD Veri Koruma Beyanı gibi yargı alanına özgü ayrı belgeler yayımlar. Bir kullanıcının bulunduğu ülke bakımından özel belge mevcutsa, somut hak, süre ve usul yönünden <strong>o özel belge bu şemsiye beyanın önüne geçer</strong>. Bu beyan yalnızca genel çerçeveyi ve ilkeleri ortaya koyar.</p>

<h4>6. Yurt Dışı Aktarım ve Ortak İlkeler</h4>
<p>hangel; veri minimizasyonu, amaçla bağlılık, şeffaflık, doğruluk, saklama sınırı, bütünlük ve gizlilik ile hesap verebilirlik ilkelerini tüm yargı alanlarında ortak asgari taban olarak benimser. Sınır ötesi aktarımlarda, ilgili rejimin gerektirdiği güvencelerin (örneğin yeterlilik kararları, standart sözleşme hükümleri veya eşdeğer mekanizmalar) sağlanması hedeflenir. Aktarım mekanizmaları yargı alanına göre farklılaşır:</p>
<ul>
  <li><strong>AB/AAB:</strong> GDPR Art.44-49 — yeterlilik kararı, Standart Sözleşme Hükümleri (SCC) veya Bağlayıcı Kurumsal Kurallar (BCR) gibi uygun güvenceler.</li>
  <li><strong>Birleşik Krallık:</strong> UK GDPR — yeterlilik düzenlemeleri ve Uluslararası Veri Aktarım Anlaşması (IDTA) / Eklenti.</li>
  <li><strong>Türkiye:</strong> 6698 sayılı KVKK m.9 (2024 değişikliği) ve KVKK Yurt Dışı Aktarım Rehberi çerçevesinde yeterlilik, uygun güvenceler veya istisnai hâller.</li>
  <li><strong>Brezilya:</strong> LGPD Art.33-36 — yeterli koruma düzeyi veya uygun güvenceler.</li>
</ul>
<p>hangel'in temel altyapı sağlayıcıları (Google Cloud / Firebase, Apple), bu güvence mekanizmalarını destekleyen sözleşmesel taahhütler sunmaktadır.</p>

<h4>7. Hesap Verebilirlik ve Yönetişim</h4>
<p>hangel, hesap verebilirlik ilkesi gereği veri işleme faaliyetlerini belgelemeyi, gerekli yargı alanlarında kayıt/sicil yükümlülüklerini (örneğin Türkiye'de VERBİS, AB'de işleme faaliyetleri kaydı) yerine getirmeyi ve risk değerlendirmesi gerektiren işlemlerde etki değerlendirmesi yapmayı hedefler. Bu, hangel'in tek bir yargı alanındaki tüm formaliteleri her ülke için tamamladığı anlamına gelmez; yükümlülükler ilgili ülke bazında değerlendirilir ve yerine getirilir.</p>

<h4>8. İlgili Kişi Hakları ve İletişim</h4>
<p>Kullanıcılar, bulundukları ülkeye göre erişim, düzeltme, silme, itiraz, taşınabilirlik ve işlemeyi kısıtlama gibi haklara sahip olabilir. Türkiye'deki veriler için <a href="mailto:kvkk@hangel.org" rel="noopener" target="_blank">kvkk@hangel.org</a>, uluslararası talepler için <a href="mailto:privacy@hangel.org" rel="noopener" target="_blank">privacy@hangel.org</a> ve <a href="mailto:dpo@hangel.org" rel="noopener" target="_blank">dpo@hangel.org</a> adresleri üzerinden başvuru yapılabilir. Her başvuru, kullanıcının bulunduğu ülkenin usul ve süre kuralları çerçevesinde değerlendirilir.</p>

<h4>9. Ortak Asgari Veri Sahibi Hakları</h4>
<p>Yargı alanları arasında usul ve kapsam farkları bulunsa da, hangel aşağıdaki temel hakları tüm kullanıcılar için ortak asgari taban olarak tanımayı hedefler. Somut kapsam, kullanıcının bulunduğu ülkenin kanununa göre belirlenir.</p>
<table class="w-full border-collapse border border-gray-200 my-4">
  <thead>
    <tr>
      <th class="border border-gray-200 p-2 text-left text-sm" scope="col">Hak</th>
      <th class="border border-gray-200 p-2 text-left text-sm" scope="col">Temsilî Dayanak</th>
    </tr>
  </thead>
  <tbody>
    <tr><td class="border border-gray-200 p-2 text-sm">Bilgilenme / erişim</td><td class="border border-gray-200 p-2 text-sm">KVKK m.11; GDPR Art.15; LGPD Art.18; CCPA §1798.110</td></tr>
    <tr><td class="border border-gray-200 p-2 text-sm">Düzeltme</td><td class="border border-gray-200 p-2 text-sm">KVKK m.11; GDPR Art.16; LGPD Art.18; CCPA §1798.106</td></tr>
    <tr><td class="border border-gray-200 p-2 text-sm">Silme</td><td class="border border-gray-200 p-2 text-sm">KVKK m.7/m.11; GDPR Art.17; LGPD Art.18; CCPA §1798.105</td></tr>
    <tr><td class="border border-gray-200 p-2 text-sm">İşlemeye itiraz / kısıtlama</td><td class="border border-gray-200 p-2 text-sm">KVKK m.11; GDPR Art.18/21; LGPD Art.18</td></tr>
    <tr><td class="border border-gray-200 p-2 text-sm">Taşınabilirlik</td><td class="border border-gray-200 p-2 text-sm">GDPR Art.20; LGPD Art.18, V</td></tr>
    <tr><td class="border border-gray-200 p-2 text-sm">Satış/paylaşımdan vazgeçme</td><td class="border border-gray-200 p-2 text-sm">CCPA/CPRA §1798.120</td></tr>
  </tbody>
</table>

<h4>10. Özel Nitelikli / Hassas Veri Yaklaşımı</h4>
<p>hangel'in işlediği <strong>kan grubu</strong> verisi, tüm yargı alanlarında özel/hassas veri statüsündedir (KVKK m.6 — sağlık; GDPR Art.9; LGPD Art.11 — dado sensível; CCPA/CPRA sensitive PI). hangel, bu veriyi yargı alanından bağımsız olarak yalnızca kan eşleştirme hizmetinin sunulması amacıyla ve en yüksek koruma standardıyla işlemeyi taahhüt eder; pazarlama veya profilleme amacıyla kullanmaz.</p>

<h4>11. Şikâyet Mercileri</h4>
<p>Kullanıcılar, hangel'e başvurunun yanı sıra, bulundukları ülkenin yukarıdaki tabloda belirtilen yetkili denetim otoritesine de şikâyette bulunma hakkına sahiptir. hangel, denetim otoriteleriyle iyi niyetle iş birliği yapmayı taahhüt eder.</p>

<h4>12. Değişiklik ve Yürürlük</h4>
<p>Bu şemsiye beyan, yeni yargı alanlarının eklenmesi, mevzuat değişiklikleri veya hizmet kapsamındaki gelişmeler doğrultusunda güncellenebilir. Güncel sürüm platformda yayımlandığı tarihte yürürlüğe girer. Bu beyan ile ülkeye özgü bir hangel belgesi arasında çelişki bulunması hâlinde, o ülke bakımından özel belge esas alınır.</p>

<p class="text-xs text-muted-foreground"><em>Bu metin bilgilendirme amaçlıdır ve bağlayıcı nihai hukuki görüş niteliği taşımaz; yürürlük öncesi yetkili hukuk danışmanlığı önerilir.</em></p>
    `
  },
  {
    slug: 'lgpd-veri-koruma-beyani',
    title: 'LGPD (Latin Amerika) Veri Koruma Beyanı',
    content: `
      <h3>LGPD (Latin Amerika) Veri Koruma Beyanı</h3>

<p>Bu beyan, hangel platformunu Brezilya'dan kullanan veri sahipleri (titulares) ile Latin Amerika bölgesindeki kullanıcılara yöneliktir ve <strong>Brezilya Genel Kişisel Verilerin Korunması Kanunu — Lei Geral de Proteção de Dados Pessoais (LGPD), Lei nº 13.709/2018</strong> çerçevesinde hangel'in yükümlülüklerini ve veri sahiplerinin haklarını açıklar. Platformu işleten tüzel kişi <strong>hangel AŞ</strong>'dir. Metinde kullanıcıya görünen yerlerde "hangel" küçük harfle yazılır. Brezilya'da yetkili denetim otoritesi <strong>Autoridade Nacional de Proteção de Dados (ANPD)</strong>'dir.</p>

<h4>1. Veri Sorumlusu (Controlador) Kimliği ve İletişim</h4>
<p>İşleme faaliyetlerinin sorumlusu (controlador) hangel AŞ'dir. LGPD Art.41 uyarınca atanan veri koruma görevlisi (encarregado / DPO) ile iletişim, <a href="mailto:dpo@hangel.org" rel="noopener" target="_blank">dpo@hangel.org</a> ve <a href="mailto:privacy@hangel.org" rel="noopener" target="_blank">privacy@hangel.org</a> adresleri üzerinden sağlanır. Encarregado'nun kimlik ve iletişim bilgileri, LGPD Art.41 §1 uyarınca açık ve nesnel biçimde, tercihen platform üzerinden kamuya duyurulur.</p>

<h4>2. İşlenen Kişisel Veri Kategorileri</h4>
<table class="w-full border-collapse border border-gray-200 my-4">
  <thead>
    <tr>
      <th class="border border-gray-200 p-2 text-left text-sm" scope="col">Kategori</th>
      <th class="border border-gray-200 p-2 text-left text-sm" scope="col">Örnek Veriler</th>
    </tr>
  </thead>
  <tbody>
    <tr><td class="border border-gray-200 p-2 text-sm">Kimlik</td><td class="border border-gray-200 p-2 text-sm">Ad, soyad, hesap kimliği</td></tr>
    <tr><td class="border border-gray-200 p-2 text-sm">İletişim</td><td class="border border-gray-200 p-2 text-sm">E-posta, telefon</td></tr>
    <tr><td class="border border-gray-200 p-2 text-sm">Konum</td><td class="border border-gray-200 p-2 text-sm">Kan eşleştirmesi için yaklaşık/kesin konum</td></tr>
    <tr><td class="border border-gray-200 p-2 text-sm"><strong>Hassas veri (dado sensível)</strong></td><td class="border border-gray-200 p-2 text-sm"><strong>Sağlık verisi olan kan grubu</strong></td></tr>
    <tr><td class="border border-gray-200 p-2 text-sm">Finansal</td><td class="border border-gray-200 p-2 text-sm">Ödeme aracı / havale bilgileri</td></tr>
    <tr><td class="border border-gray-200 p-2 text-sm">Teknik/cihaz</td><td class="border border-gray-200 p-2 text-sm">IP, cihaz kimliği, kullanım kayıtları</td></tr>
  </tbody>
</table>

<h4>3. İşleme Amaçları ve Hukuki Dayanaklar (Bases Legais — Art.7)</h4>
<p>LGPD Art.7, kişisel verilerin işlenebileceği hukuki dayanakları sayar. hangel'in başlıca işleme amaçları ve dayanakları şunlardır:</p>
<table class="w-full border-collapse border border-gray-200 my-4">
  <thead>
    <tr>
      <th class="border border-gray-200 p-2 text-left text-sm" scope="col">Amaç</th>
      <th class="border border-gray-200 p-2 text-left text-sm" scope="col">Hukuki Dayanak (LGPD)</th>
    </tr>
  </thead>
  <tbody>
    <tr><td class="border border-gray-200 p-2 text-sm">Hesap oluşturma ve hizmet sunumu</td><td class="border border-gray-200 p-2 text-sm">Art.7, I (consentimento) / Art.7, V (sözleşmenin ifası)</td></tr>
    <tr><td class="border border-gray-200 p-2 text-sm">Kan eşleştirme (sağlık verisi)</td><td class="border border-gray-200 p-2 text-sm">Art.11, I (consentimento específico e destacado) ve ilgili Art.11 II bentleri</td></tr>
    <tr><td class="border border-gray-200 p-2 text-sm">Yasal yükümlülüklerin yerine getirilmesi</td><td class="border border-gray-200 p-2 text-sm">Art.7, II (cumprimento de obrigação legal)</td></tr>
    <tr><td class="border border-gray-200 p-2 text-sm">Pazarlama iletişimi</td><td class="border border-gray-200 p-2 text-sm">Art.7, I (consentimento) / Art.7, IX (legítimo interesse, uygun olduğunda)</td></tr>
    <tr><td class="border border-gray-200 p-2 text-sm">Yaşam veya fiziksel bütünlüğün korunması</td><td class="border border-gray-200 p-2 text-sm">Art.7, VII / Art.11, II, "e" (proteção da vida)</td></tr>
  </tbody>
</table>

<h4>4. Hassas Veri (Dados Sensíveis — Art.11) ve Açık Rıza</h4>
<p>LGPD Art.11 uyarınca sağlık verileri dahil hassas veriler özel koruma altındadır. hangel'in işlediği <strong>kan grubu</strong>, sağlık verisi niteliğindeki hassas bir veridir. Bu veri kural olarak ancak <strong>veri sahibinin belirli ve ayrıştırılmış (específico e destacado) açık rızası</strong> ile (Art.11, I) veya Art.11, II'de sayılan istisnai hâllerde (örneğin yaşamın korunması, sağlık hizmetleri) işlenebilir. Veri sahibi, kan grubuna ilişkin açık rızasını her zaman geri çekme hakkına sahiptir; ancak rızanın geri çekilmesi, kan eşleştirme hizmetinin sunulamamasıyla sonuçlanabilir.</p>

<h4>5. Çocukların ve Ergenlerin Verileri (Art.14)</h4>
<p>LGPD Art.14 uyarınca çocukların ve ergenlerin kişisel verileri, daima onların üstün yararı (melhor interesse) gözetilerek işlenir. Çocuk verileri için kural olarak ebeveyn veya yasal velinin <strong>belirli ve ayrıştırılmış açık rızası</strong> aranır (Art.14 §1). hangel, çocuklardan gereğinden fazla veri toplamamayı ve yaş doğrulamasına yönelik makul tedbirler almayı hedefler.</p>

<h4>6. Otomatik Karar ve Profilleme (Art.20)</h4>
<p>LGPD Art.20 uyarınca veri sahibi, yalnızca otomatik işlemeye dayanan ve kişiliğini, mesleki, tüketici veya kredi profilini etkileyen kararların <strong>gözden geçirilmesini (revisão)</strong> talep etme hakkına sahiptir. hangel'in kan eşleştirme ve öneri algoritmaları otomatik işleme içerebilir; bu durumda hangel, kullanılan kriterler hakkında açık bilgi sunmayı ve veri sahibinin gözden geçirme talebini değerlendirmeyi taahhüt eder.</p>

<h4>7. Veri Sahibinin Hakları (Direitos do Titular — Art.18)</h4>
<p>LGPD Art.18 uyarınca veri sahibi, controlador'a karşı aşağıdaki hakları kullanabilir:</p>
<ul>
  <li>İşlemenin teyidi ve verilere erişim (Art.18, I-II)</li>
  <li>Eksik, yanlış veya güncel olmayan verilerin düzeltilmesi (Art.18, III)</li>
  <li>Gereksiz, aşırı veya hukuka aykırı işlenen verilerin anonimleştirilmesi, bloke edilmesi veya silinmesi (Art.18, IV)</li>
  <li>Verilerin taşınabilirliği (Art.18, V)</li>
  <li>Rızaya dayalı işlemede verilerin silinmesi (Art.18, VI)</li>
  <li>Veri paylaşılan kamu ve özel kuruluşlar hakkında bilgi (Art.18, VII)</li>
  <li>Rıza vermeme imkânı ve sonuçları hakkında bilgi (Art.18, VIII)</li>
  <li>Rızanın geri çekilmesi (Art.18, IX)</li>
</ul>

<h4>8. Uluslararası Veri Aktarımı (Transferência Internacional — Art.33-36)</h4>
<p>hangel hizmetleri Google Cloud / Firebase ve Apple altyapısı üzerinde çalıştığından, kişisel veriler Brezilya dışındaki ülkelerde işlenebilir. LGPD Art.33 uyarınca uluslararası aktarım, ancak yeterli koruma düzeyine sahip ülkelere, veri sahibinin belirli rızasıyla, standart sözleşme hükümleri/küresel kurumsal kurallar gibi güvencelerle veya Art.33'te sayılan diğer hâllerde gerçekleştirilebilir. Art.34-36, ANPD'nin yeterlilik değerlendirmesine ve güvence mekanizmalarına ilişkin kuralları düzenler.</p>

<h4>9. Güvenlik ve İhlal Bildirimi (Art.46-48)</h4>
<p>LGPD Art.46 uyarınca hangel, kişisel verileri yetkisiz erişime ve kazara/hukuka aykırı imha, kayıp, değişiklik veya ifşaya karşı koruyacak teknik ve idari güvenlik tedbirlerini almayı taahhüt eder. Art.48 uyarınca veri sahiplerine kayda değer risk veya zarar doğurabilecek bir güvenlik olayı (incidente de segurança) gerçekleştiğinde, hangel bunu makul süre içinde ANPD'ye ve etkilenen veri sahiplerine bildirir.</p>

<h4>10. Saklama Süreleri ve İmha</h4>
<p>hangel, kişisel verileri yalnızca işleme amacının gerektirdiği süre boyunca ve ilgili yasal yükümlülükler çerçevesinde saklar. Amaç ortadan kalktığında veya veri sahibi rızasını geri çektiğinde, veriler LGPD Art.15-16 çerçevesinde silinir veya anonimleştirilir; ancak yasal saklama, hakların kullanılması veya araştırma istisnaları kapsamında saklama gerektiren hâller saklıdır.</p>
<table class="w-full border-collapse border border-gray-200 my-4">
  <thead>
    <tr>
      <th class="border border-gray-200 p-2 text-left text-sm" scope="col">Veri Türü</th>
      <th class="border border-gray-200 p-2 text-left text-sm" scope="col">Saklama Yaklaşımı</th>
    </tr>
  </thead>
  <tbody>
    <tr><td class="border border-gray-200 p-2 text-sm">Hesap verileri</td><td class="border border-gray-200 p-2 text-sm">Hesap aktif olduğu sürece + kapanıştan sonra makul süre</td></tr>
    <tr><td class="border border-gray-200 p-2 text-sm">Kan grubu (hassas)</td><td class="border border-gray-200 p-2 text-sm">Rıza geçerli olduğu sürece; geri çekilince silme/anonimleştirme</td></tr>
    <tr><td class="border border-gray-200 p-2 text-sm">Finansal/işlem kayıtları</td><td class="border border-gray-200 p-2 text-sm">İlgili yasal saklama süreleri boyunca</td></tr>
  </tbody>
</table>

<h4>11. Veri İşleyenler ve Üçüncü Taraflar</h4>
<p>hangel, hizmet sunumunda işleyici (operador) sıfatıyla hareket eden teknik altyapı sağlayıcılarından (Google Cloud / Firebase, Apple) yararlanır. Bu işleyiciler, LGPD Art.39 uyarınca controlador'un talimatları doğrultusunda hareket eder ve güvenlik yükümlülüklerine tabidir. hangel, kişisel verileri ticari amaçla üçüncü taraflara satmaz.</p>

<h4>12. Başvuru ve Şikâyet</h4>
<p>Veri sahipleri haklarını <a href="mailto:dpo@hangel.org" rel="noopener" target="_blank">dpo@hangel.org</a> üzerinden kullanabilir. hangel, talepleri LGPD'de öngörülen makul süreler içinde yanıtlar (Art.18 §3-4). Veri sahibi, ayrıca yetkili denetim otoritesi <strong>ANPD</strong>'ye şikâyette bulunma hakkına sahiptir (Art.18 §1). hangel, başvuru sahiplerinden kimlik doğrulaması talep edebilir; bu, başkasına ait verilerin yetkisiz açıklanmasını önlemeye yöneliktir.</p>

<h4>13. İşleme İlkeleri (Art.6)</h4>
<p>hangel, kişisel veri işlemede LGPD Art.6'da sayılan ilkelere uymayı taahhüt eder: amaca uygunluk (finalidade), uygunluk (adequação), gereklilik (necessidade), serbest erişim (livre acesso), veri kalitesi (qualidade dos dados), şeffaflık (transparência), güvenlik (segurança), önleme (prevenção), ayrımcılık yapmama (não discriminação) ve hesap verebilirlik (responsabilização e prestação de contas). Bu ilkeler, hangel'in tüm Brezilya kullanıcılarına yönelik işleme faaliyetlerinin temelini oluşturur.</p>

<h4>14. ANPD Yaptırımları ve Uyum Taahhüdü</h4>
<p>LGPD'ye aykırılık hâlinde ANPD; uyarı, düzeltici tedbir, para cezası ve verilerin bloke edilmesi/silinmesi gibi idari yaptırımlar uygulayabilir (Art.52). hangel, bu yaptırım rejiminin farkında olarak, LGPD yükümlülüklerine uyumu sürekli iyileştirmeyi ve ANPD'nin rehber ve kararlarını takip etmeyi taahhüt eder. Bu beyan, hangel'in halihazırda tam uyumlu olduğu yönünde bir sertifikasyon iddiası değil; sürekli uyum taahhüdünün ifadesidir.</p>

<h4>15. Değişiklik ve Yürürlük</h4>
<p>Bu beyan, LGPD ve ANPD düzenlemelerindeki değişiklikler doğrultusunda güncellenebilir. Güncel sürüm platformda yayımlandığı tarihte yürürlüğe girer. Latin Amerika'daki diğer ülkelerden erişen veri sahipleri bakımından, o ülkeye özgü veri koruma mevzuatı (mevcutsa) ek olarak gözetilir.</p>

<p class="text-xs text-muted-foreground"><em>Bu metin bilgilendirme amaçlıdır ve bağlayıcı nihai hukuki görüş niteliği taşımaz; yürürlük öncesi yetkili hukuk danışmanlığı önerilir.</em></p>
    `
  },
  {
    slug: 'yapay-zeka-seffaflik-beyani',
    title: 'Yapay Zekâ ve Algoritmik Şeffaflık Beyanı',
    content: `
      <h3>Yapay Zekâ ve Algoritmik Şeffaflık Beyanı</h3>

<p>Bu beyan, hangel platformunda kullanılan yapay zekâ ve algoritmik sistemlere ilişkin şeffaflık ilkelerini, insan gözetimini ve kullanıcıların itiraz/insan inceleme haklarını açıklar. Platformu işleten tüzel kişi <strong>hangel AŞ</strong>'dir. Metinde kullanıcıya görünen yerlerde "hangel" küçük harfle yazılır. hangel, kan eşleştirme/öneri gibi algoritmik süreçlerde dürüstlük, açıklanabilirlik ve insan denetimi ilkelerini benimser.</p>

<h4>1. Amaç ve Kapsam</h4>
<p>Bu beyan; hangel'in <strong>kan eşleştirme ve öneri algoritmaları</strong> başta olmak üzere, kullanıcı deneyimini etkileyen otomatik karar destek sistemlerinin nasıl çalıştığını, hangi ilkelere tabi olduğunu ve kullanıcıların bu sistemler karşısındaki haklarını ortaya koymayı amaçlar. Beyan, hangi algoritmik süreçlerin insan gözetimi altında işlediğini ve hangi durumlarda kullanıcının insan incelemesi talep edebileceğini açıklar.</p>

<h4>2. Algoritmik Sistemlerin İşlevi</h4>
<p>hangel'de kullanılan başlıca algoritmik süreçler şunlardır:</p>
<ul>
  <li><strong>Kan eşleştirme:</strong> Acil kan talebi ile uygun kan grubuna ve konuma sahip potansiyel bağışçıların önceliklendirilmesi.</li>
  <li><strong>Öneri/sıralama:</strong> Gönüllülük ilanları, bağış kampanyaları ve STK profillerinin kullanıcıya uygunluğa göre sıralanması.</li>
  <li><strong>Güvenlik/kötüye kullanım tespiti:</strong> Sahte hesap, dolandırıcılık veya istismar girişimlerinin işaretlenmesi.</li>
</ul>
<p>Bu sistemler kullanıcıya kolaylık ve hız sağlamayı hedefler; kan eşleştirme süreci tıbbi bir teşhis veya garanti niteliği taşımaz ve sağlık kuruluşlarının değerlendirmesinin yerine geçmez.</p>

<h4>3. Uygulanacak Hukuki Çerçeve — Coğrafi Sınır</h4>
<p>Yapay zekâya ilişkin yatay düzenleme bakımından <strong>AB Yapay Zekâ Kanunu — Regulation (EU) 2024/1689 (AI Act)</strong> referans alınır. Ancak önemle belirtmek gerekir ki:</p>
<blockquote>
<p>AI Act yalnızca Avrupa Birliği'nde ve kapsamına giren sistemler bakımından doğrudan uygulanır. <strong>Türkiye'de yapay zekâya ilişkin özel/yatay bir kanun henüz YOKTUR.</strong> Türkiye'deki kullanıcılar bakımından otomatik işlemeye ilişkin temel hukuki çerçeve, 6698 sayılı KVKK'nın genel hükümleridir. hangel, AI Act'in şeffaflık ve insan gözetimi ilkelerini, yasal zorunluluk bulunmasa dahi gönüllü iyi uygulama olarak benimsemeyi hedefler.</p>
</blockquote>
<p>AB'deki kullanıcılar ve AB pazarına yönelik sistemler bakımından, kişisel verilere dayalı otomatik kararlar ayrıca <strong>GDPR Art.22</strong> kapsamında değerlendirilir. AI Act yükümlülükleri ile GDPR Art.22 güvenceleri, kapsama giren yüksek riskli sistemler için birlikte (kümülatif) uygulanır.</p>

<h4>4. Otomatik Karar ve GDPR Art.22</h4>
<p>GDPR Art.22 uyarınca veri sahibi, kendisi hakkında hukuki sonuç doğuran veya benzer biçimde önemli ölçüde etkileyen, yalnızca otomatik işlemeye (profilleme dahil) dayanan bir karara tabi tutulmama hakkına sahiptir. hangel, kullanıcıyı önemli ölçüde etkileyebilecek kararlarda <strong>anlamlı insan müdahalesi</strong> bulunmasını sağlamayı ve böylece kararın salt otomatik olmamasını temin etmeyi hedefler. Türkiye'deki kullanıcılar bakımından KVKK m.11/(g) çerçevesinde, münhasıran otomatik sistemlerle analiz edilmesi suretiyle aleyhe bir sonucun ortaya çıkmasına itiraz hakkı saklıdır.</p>

<h4>5. Şeffaflık İlkeleri</h4>
<p>hangel, algoritmik sistemlerin işleyişinde aşağıdaki şeffaflık ilkelerini benimsemeyi taahhüt eder:</p>
<ul>
  <li>Bir içeriğin, eşleşmenin veya sıralamanın algoritmik olarak üretildiğinin kullanıcıya bildirilmesi.</li>
  <li>Kullanılan başlıca kriterlerin (örneğin kan grubu uyumu, coğrafi yakınlık, aciliyet) anlaşılır biçimde açıklanması.</li>
  <li>Sistemin sınırlarının ve hata payının dürüstçe ifade edilmesi; algoritmanın tıbbi/profesyonel kararın yerine geçmediğinin belirtilmesi.</li>
  <li>Kullanıcının makul ölçüde anlamlı bir açıklama talep edebilmesi.</li>
</ul>

<h4>6. İnsan Gözetimi (Human Oversight)</h4>
<p>AI Act Art.14, yüksek riskli yapay zekâ sistemlerinin etkin insan gözetimine olanak verecek biçimde tasarlanmasını gerektirir. hangel, bu ilkeyi benimseyerek, kullanıcı üzerinde önemli etki doğurabilecek algoritmik çıktıların yetkili personel tarafından izlenebilmesini, gerektiğinde devre dışı bırakılabilmesini veya geçersiz kılınabilmesini hedefler. Otomasyon yanlılığına (automation bias) karşı farkındalık, gözetim süreçlerinin bir parçası olarak benimsenir.</p>

<h4>7. İtiraz ve İnsan İnceleme Hakkı</h4>
<p>Kullanıcılar, kendilerini etkileyen algoritmik bir çıktının (örneğin bir eşleşme sonucunun veya bir hesabın işaretlenmesinin) <strong>bir insan tarafından gözden geçirilmesini</strong> talep etme hakkına sahiptir. Bu talep üzerine hangel, kararı yetkili bir kişiye inceletmeyi, kullanıcının görüşünü değerlendirmeyi ve gerektiğinde kararı düzeltmeyi taahhüt eder. Talepler <a href="mailto:privacy@hangel.org" rel="noopener" target="_blank">privacy@hangel.org</a> ve Türkiye için <a href="mailto:kvkk@hangel.org" rel="noopener" target="_blank">kvkk@hangel.org</a> adreslerine iletilebilir.</p>

<h4>8. AI Act Risk Sınıflandırması ve hangel'in Konumu</h4>
<p>AI Act, yapay zekâ sistemlerini risk düzeyine göre kademelendirir: kabul edilemez riskli (yasak) uygulamalar, yüksek riskli sistemler, sınırlı riskli (şeffaflık yükümlülüğüne tabi) sistemler ve asgari riskli sistemler. hangel, kullandığı eşleştirme ve öneri sistemlerini bu çerçevede dürüstçe değerlendirmeyi ve kapsama girdikleri ölçüde ilgili şeffaflık ve gözetim yükümlülüklerini benimsemeyi taahhüt eder. Aşağıdaki tablo, hangel'in mevcut yaklaşımını ve hedeflerini özetler.</p>
<table class="w-full border-collapse border border-gray-200 my-4">
  <thead>
    <tr>
      <th class="border border-gray-200 p-2 text-left text-sm" scope="col">Alan</th>
      <th class="border border-gray-200 p-2 text-left text-sm" scope="col">Mevcut Yaklaşım</th>
      <th class="border border-gray-200 p-2 text-left text-sm" scope="col">Hedef</th>
    </tr>
  </thead>
  <tbody>
    <tr><td class="border border-gray-200 p-2 text-sm">Şeffaflık bildirimi</td><td class="border border-gray-200 p-2 text-sm">Algoritmik üretimin kullanıcıya bildirilmesi</td><td class="border border-gray-200 p-2 text-sm">Her etkileşimde tutarlı ve görünür bildirim</td></tr>
    <tr><td class="border border-gray-200 p-2 text-sm">İnsan gözetimi</td><td class="border border-gray-200 p-2 text-sm">Önemli kararlarda insan müdahalesi</td><td class="border border-gray-200 p-2 text-sm">Belgelenmiş gözetim prosedürleri</td></tr>
    <tr><td class="border border-gray-200 p-2 text-sm">Açıklanabilirlik</td><td class="border border-gray-200 p-2 text-sm">Başlıca kriterlerin açıklanması</td><td class="border border-gray-200 p-2 text-sm">Talep üzerine ayrıntılı, anlaşılır açıklama</td></tr>
    <tr><td class="border border-gray-200 p-2 text-sm">Önyargı denetimi</td><td class="border border-gray-200 p-2 text-sm">Veri kalitesine yönelik makul çaba</td><td class="border border-gray-200 p-2 text-sm">Düzenli önyargı/ayrımcılık gözden geçirmesi</td></tr>
  </tbody>
</table>

<h4>9. Veri, Doğruluk ve Önyargının Azaltılması</h4>
<p>hangel; algoritmik sistemleri besleyen verilerin doğru ve güncel tutulması, ayrımcı sonuçların önlenmesi ve sistemlerin düzenli olarak gözden geçirilmesi yönünde makul çaba göstermeyi hedefler. Kan eşleştirme gibi yaşamsal süreçlerde, sistemin amacı erişimi hızlandırmak olup hiçbir bağışçı veya alıcı bakımından garanti sağlamaz. Eşleştirme ve önerilerde kullanılan kişisel verilerin işlenmesi, ilgili kullanıcının bulunduğu ülkeye göre KVKK, GDPR veya diğer ilgili rejimlere tabidir ve hangel'in veri koruma belgeleriyle birlikte değerlendirilir.</p>

<h4>10. Çocuklar ve Hassas Gruplar</h4>
<p>hangel, algoritmik sistemlerin çocuklar ve hassas gruplar üzerindeki olası etkilerine özel dikkat göstermeyi taahhüt eder. Bu gruplara yönelik manipülatif veya istismara açık algoritmik uygulamalardan kaçınılır; çocuklara yönelik içerik sıralamasında onların üstün yararı gözetilir.</p>

<h4>11. Kayıt, Belgeleme ve İzlenebilirlik</h4>
<p>hangel, kullanıcı üzerinde önemli etki doğurabilecek algoritmik süreçlerin işleyişine, kullanılan başlıca kriterlere ve insan gözetimi noktalarına ilişkin makul belgeleme tutmayı hedefler. Bu belgeleme; bir kararın nasıl üretildiğinin sonradan anlaşılabilmesini, hata veya itiraz hâlinde incelenebilmesini ve sistemlerin düzenli gözden geçirilmesini destekler. AI Act kapsamına giren yüksek riskli sistemler için otomatik kayıt (logging) ve teknik dokümantasyon gereklilikleri, kapsama girildiği ölçüde benimsenir. Bu kayıtlar, yalnızca amacına uygun süreyle ve veri koruma ilkeleri çerçevesinde saklanır.</p>

<h4>12. Üçüncü Taraf Modelleri ve Sağlayıcılar</h4>
<p>hangel, bazı algoritmik bileşenler için üçüncü taraf hizmet veya modellerinden yararlanabilir. Bu durumda hangel, ilgili sağlayıcıların şeffaflık ve güvenlik standartlarına uygun davranmasını gözetmeyi ve kullanıcıların bu beyanda tanınan haklarının korunmasını sağlamayı hedefler. Üçüncü taraf bileşen kullanımı, hangel'in bu beyandaki sorumluluğunu ortadan kaldırmaz.</p>

<h4>13. Sorumluluk Sınırı</h4>
<p>Algoritmik çıktılar bilgilendirme ve kolaylaştırma amaçlıdır. Kan bağışı, nakil ve tedaviye ilişkin nihai kararlar yetkili sağlık kuruluşlarına aittir; hangel bu kararların yerini almaz ve tıbbi uygunluk garantisi vermez. Kullanıcı, bir eşleşme veya öneriye dayanarak hareket etmeden önce ilgili sağlık otoritesi veya yetkili kurumla teyit yapmakla sorumludur.</p>

<h4>14. Değişiklik ve Yürürlük</h4>
<p>Bu beyan, AI Act'in aşamalı yürürlüğü (kapsamına giren hükümlerin tam uygulanması), KVKK uygulamaları ve hizmet gelişmeleri doğrultusunda güncellenebilir. Güncel sürüm platformda yayımlandığı tarihte yürürlüğe girer.</p>

<p class="text-xs text-muted-foreground"><em>Bu metin bilgilendirme amaçlıdır ve bağlayıcı nihai hukuki görüş niteliği taşımaz; yürürlük öncesi yetkili hukuk danışmanlığı önerilir.</em></p>
    `
  },

  // --- C. Sosyal Etki, Bağış ve Finansal Şeffaflık ---
  {
    slug: 'sosyal-etki-politikasi',
    title: 'Sosyal Etki Politikası',
    content: `
      <h3>Sosyal Etki Politikası</h3>

<p>İşbu Sosyal Etki Politikası, hangel platformunu işleten <strong>hangel AŞ</strong> tarafından, platformun toplumsal değer üretme amacını, etki alanlarını ve bu etkinin yönetilmesine ilişkin ilkeleri ortaya koymak üzere hazırlanmıştır. hangel, Türkiye merkezli bir toplumsal etki platformu ve sosyal girişim olarak; acil kan talebi eşleştirmesi, bireysel ve kurumsal bağış, gönüllülük, sivil toplum kuruluşu profilleri ve etki raporlaması gibi hizmetler aracılığıyla ölçülebilir bir toplumsal fayda yaratmayı hedefler. Bu metnin esas dili Türkçedir; yararlanılan uluslararası çerçevelere yapılan atıflar İngilizce ifadeler içerebilir.</p>

<h4>1. Amaç ve Kapsam</h4>
<p>Bu Politikanın amacı, hangel'in faaliyetlerinin doğurduğu olumlu toplumsal etkiyi bilinçli, planlı ve hesap verebilir biçimde yönetmek için bir çerçeve oluşturmaktır. Politika; hangel'in tüm hizmet alanlarını, platform üzerinde faaliyet gösteren paydaşlarla (bağışçılar, gönüllüler, kuruluşlar, faydalanıcılar) kurulan ilişkileri ve bu ilişkilerden doğan etki zincirini kapsar. Politika, hangel'in iç karar süreçlerine yön veren bir taahhüt belgesidir; resmî bir akreditasyon, denetim veya sertifika belgesi niteliği taşımaz.</p>
<p>Bu belgede geçen başlıca kavramlar şu şekilde anlaşılır: <strong>toplumsal etki (social impact)</strong>, hangel'in faaliyetleri sonucunda paydaşların ve toplumun yaşamında meydana gelen, atfedilebilir ve mümkün olduğunca ölçülebilen olumlu değişimi; <strong>çıktı (output)</strong>, gerçekleştirilen faaliyetin doğrudan ürünlerini; <strong>sonuç (outcome)</strong>, bu çıktıların paydaşlarda yarattığı kısa ve orta vadeli değişimi; <strong>etki (impact)</strong> ise bu sonuçların net, atfedilebilir ve sürdürülebilir toplumsal karşılığını ifade eder. Politika, hangel'in faaliyet alanlarını birbirinden ayrı silolar olarak değil, ortak bir toplumsal değer üretim zincirinin halkaları olarak ele alır.</p>

<h4>2. Referans Çerçeve ve Hizalama</h4>
<p>hangel, sosyal etki yaklaşımını aşağıdaki uluslararası çerçevelerle hizalamayı hedefler. Bu çerçeveler hangel'in sahip olduğu bir belge veya unvan değil, etki yönetiminin referans aldığı iyi uygulama setleridir:</p>
<ul>
<li><strong>BM Sürdürülebilir Kalkınma Amaçları (SKA / SDG)</strong> — özellikle SKA 3 (Sağlıklı Bireyler), SKA 10 (Eşitsizliklerin Azaltılması), SKA 11 (Sürdürülebilir Şehirler ve Topluluklar) ve SKA 17 (Amaçlar için Ortaklıklar) ile hizalama hedeflenir;</li>
<li><strong>OECD</strong> sosyal ekonomi ve etki ölçümüne ilişkin ilkeleri ile sivil toplumun güçlendirilmesine dair OECD tavsiyeleri;</li>
<li><strong>BM Küresel İlkeler Sözleşmesi (UN Global Compact)</strong> insan hakları, çalışma ilkeleri ve yolsuzlukla mücadele başlıkları;</li>
<li><strong>BM İş ve İnsan Hakları Rehber İlkeleri (UNGP)</strong> kapsamında saygı gösterme sorumluluğu.</li>
</ul>

<h4>3. Toplumsal Değer Çerçevesi ve Etki Alanları</h4>
<p>hangel, ürettiği toplumsal değeri tanımlanmış etki alanları üzerinden ele alır. Aşağıdaki tablo, başlıca etki alanlarını, ilgili SKA hedeflerini ve hedeflenen toplumsal sonucu özetler:</p>

<table class="w-full border-collapse border border-gray-200 my-4">
<thead>
<tr>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Etki Alanı</th>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">İlgili SKA</th>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Hedeflenen Toplumsal Sonuç</th>
</tr>
</thead>
<tbody>
<tr>
<td class="border border-gray-200 p-2 text-sm">Acil kan erişimi</td>
<td class="border border-gray-200 p-2 text-sm">SKA 3</td>
<td class="border border-gray-200 p-2 text-sm">İhtiyaç sahibi ile gönüllü bağışçı arasındaki eşleşme süresinin kısalması, can kayıplarının azaltılmasına katkı</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Bağış ve kaynak aktarımı</td>
<td class="border border-gray-200 p-2 text-sm">SKA 1, SKA 10</td>
<td class="border border-gray-200 p-2 text-sm">Şeffaf ve izlenebilir kaynak akışıyla yoksulluk ve eşitsizliğin azaltılmasına destek</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Gönüllülük</td>
<td class="border border-gray-200 p-2 text-sm">SKA 11, SKA 17</td>
<td class="border border-gray-200 p-2 text-sm">Toplumsal dayanışmanın ve sivil katılımın güçlenmesi</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">STK kapasitesi ve şeffaflık</td>
<td class="border border-gray-200 p-2 text-sm">SKA 16, SKA 17</td>
<td class="border border-gray-200 p-2 text-sm">Hesap verebilir kurumların güçlenmesi ve kamu güveninin artması</td>
</tr>
</tbody>
</table>

<h4>4. Etki Yönetimi İlkeleri</h4>
<p>hangel, etki yönetiminde aşağıdaki ilkeleri esas alır:</p>
<ul>
<li><strong>Önceliklendirme:</strong> Faaliyetler, en yüksek toplumsal faydayı sağlayacak alanlara yönlendirilir.</li>
<li><strong>Faydalanıcı merkezlilik:</strong> Etki, faydalanıcıların gerçek ihtiyaçları ve geri bildirimleri üzerinden tanımlanır.</li>
<li><strong>Zarar verme (do no harm):</strong> Faaliyetlerin istenmeyen olumsuz etkileri öngörülür ve azaltılır; özellikle özel nitelikli sağlık verisi (kan grubu) işlenirken bireylerin mahremiyeti gözetilir.</li>
<li><strong>Şeffaflık ve hesap verebilirlik:</strong> Etki iddiaları doğrulanabilir verilere dayandırılır, abartılı beyandan kaçınılır.</li>
<li><strong>Kapsayıcılık:</strong> Hizmetlere erişimde dezavantajlı gruplar gözetilir.</li>
</ul>

<h4>5. Roller, Sorumluluklar ve Yönetişim</h4>
<p>Sosyal etki yönetiminin gözetimi hangel AŞ yönetimine aittir. hangel, etki hedeflerinin belirlenmesi, izlenmesi ve raporlanmasından sorumlu bir iç işlevi yürütmeyi taahhüt eder. Paydaşlar; bağışçı, gönüllü, kuruluş ve faydalanıcı olarak süreçlere dahil edilir ve geri bildirim kanalları aracılığıyla katkı sunabilir. Politikanın uygulanmasında, hangel'in etik ilkeleri ve fon kullanımı beyanları tamamlayıcı belgeler olarak dikkate alınır.</p>

<h4>6. Ölçüm, İzleme ve Raporlama</h4>
<p>hangel, etki ölçümünü ayrı bir metodoloji belgesi (Sosyal Etki Ölçüm ve Raporlama Metodolojisi) çerçevesinde yürütmeyi hedefler. Bu metodoloji; Theory of Change (Değişim Teorisi) ve Social Value International'ın SROI (Social Return on Investment) standardı ile uyumu gözetir. hangel, yıllık bir etki raporu yayımlamayı amaçlar; bu rapor, çıktı ve sonuç göstergelerini, kullanılan kaynakları ve hedeflere göre ilerlemeyi şeffaf biçimde sunmayı hedefler.</p>

<h4>7. Paydaş Katılımı ve Geri Bildirim</h4>
<p>hangel, toplumsal etkinin yalnızca platform tarafından tanımlanamayacağı; faydalanıcıların ve diğer paydaşların sesinin etki tanımının merkezinde olması gerektiği ilkesini benimser. Bu kapsamda hangel; faydalanıcı anketleri, gönüllü ve bağışçı geri bildirim kanalları ve kuruluşlarla istişare mekanizmaları aracılığıyla paydaş görüşünü düzenli olarak toplamayı hedefler. Toplanan geri bildirimler, hizmetlerin ve etki hedeflerinin iyileştirilmesinde dikkate alınır. hangel, olumsuz veya eleştirel geri bildirimleri de şeffaf biçimde değerlendirmeyi ve bunları gizlemekten kaçınmayı taahhüt eder.</p>

<h4>8. Olumsuz Etkilerin Yönetimi ve Hassas Gruplar</h4>
<p>Toplumsal fayda üretmeyi amaçlayan faaliyetlerin dahi istenmeyen olumsuz etkiler doğurabileceği gözetilir. hangel; özellikle acil kan eşleştirmesi gibi sağlık verisi içeren süreçlerde bireylerin mahremiyetini, damgalanma riskini ve veri güvenliğini öncelikli risk olarak ele alır. Çocuklar, dezavantajlı gruplar ve kırılgan faydalanıcılar bakımından ek koruma tedbirleri gözetilir. hangel, bir faaliyetin beklenen toplumsal faydasının olası zararını dengelemediği durumlarda o faaliyeti gözden geçirmeyi veya durdurmayı taahhüt eder.</p>

<h4>9. Veri Koruma ve Etik</h4>
<p>Etki ölçümünde işlenen kişisel veriler, 6698 sayılı Kişisel Verilerin Korunması Kanunu'na (KVKK) uygun olarak işlenir; mümkün olduğu ölçüde toplulaştırılmış ve anonimleştirilmiş veri kullanılır. Kan grubu gibi özel nitelikli sağlık verileri KVKK m.6 kapsamında özel koruma altındadır ve etki raporlamasında bireyi tanımlanabilir kılacak biçimde paylaşılmaz. hangel'in etik ilkeleri, fon kullanımı ve şeffaflık politikaları bu Politikayı tamamlayan belgelerdir.</p>

<h4>10. Diğer Politikalarla İlişki ve Uyum</h4>
<p>Bu Politika, hangel'in bütüncül yönetişim çerçevesinin bir parçasıdır ve diğer kurumsal belgelerle birlikte uygulanır. Sosyal Etki Ölçüm ve Raporlama Metodolojisi, etkinin nasıl ölçüleceğini; Etik Bağış ve Fon Kullanımı Beyanı, kaynakların etik biçimde toplanması ve kullanılmasını; Açık Sosyal Girişim Beyanı ise hangel'in misyon önceliğini ve kâr-kilidi taahhüdünü düzenler. Bu belgeler arasında çelişki bulunması hâlinde, ilgili konuya özgü ayrıntılı belge öncelikli kabul edilir; tüm belgeler ise bu Politikanın ortaya koyduğu toplumsal değer çerçevesiyle uyumlu yorumlanır. hangel, politikalar arası tutarlılığı korumayı ve mevzuattaki ya da uluslararası çerçevelerdeki gelişmeleri tüm belgelere yansıtmayı hedefler.</p>

<h4>11. İzleme, Gözden Geçirme ve Yürürlük</h4>
<p>Bu Politika, hangel tarafından düzenli olarak gözden geçirilmeyi ve gelişen iyi uygulamalara göre güncellenmeyi hedefler. Politika, hangel tarafından yayımlandığı tarihte yürürlüğe girer. Politikaya ilişkin görüş ve öneriler ile veri koruma sorularında <a href="mailto:kvkk@hangel.org">kvkk@hangel.org</a> adresine başvurulabilir.</p>

<p class="text-xs text-muted-foreground"><em>Bu metin bilgilendirme amaçlıdır ve bağlayıcı nihai hukuki görüş niteliği taşımaz; yürürlük öncesi yetkili hukuk danışmanlığı önerilir.</em></p>
    `
  },
  {
    slug: 'sosyal-etki-metodolojisi',
    title: 'Sosyal Etki Ölçüm ve Raporlama Metodolojisi (SROI & Theory of Change)',
    content: `
      <h3>Sosyal Etki Ölçüm ve Raporlama Metodolojisi (SROI & Theory of Change)</h3>

<p>İşbu Metodoloji belgesi, hangel platformunu işleten <strong>hangel AŞ</strong> tarafından, platformun ürettiği toplumsal etkiyi tutarlı, doğrulanabilir ve karşılaştırılabilir biçimde ölçmek ve raporlamak amacıyla hazırlanmıştır. Belge; Değişim Teorisi (Theory of Change), Sosyal Yatırım Getirisi (SROI — Social Return on Investment) ve etki gösterge taksonomisi (IRIS+) gibi uluslararası çerçeveleri esas alan bir ölçüm ve raporlama yöntemini ortaya koyar. Bu metnin esas dili Türkçedir; çerçevelere yapılan atıflar İngilizce ifadeler içerebilir.</p>

<h4>1. Amaç ve Kapsam</h4>
<p>Bu Metodolojinin amacı, hangel'in etki iddialarını kanıta dayalı bir temele oturtmak; etki ölçümünde şeffaflığı, tutarlılığı ve hesap verebilirliği sağlamaktır. Kapsam; hangel'in acil kan eşleştirmesi, bağış aktarımı, gönüllülük ve STK destek hizmetlerinin doğurduğu çıktı (output), sonuç (outcome) ve etkiyi (impact) içerir. Metodoloji, bir bağımsız denetim veya akreditasyon belgesi değil, hangel'in kendi etki yönetimi için benimsediği yöntemsel çerçevedir.</p>

<h4>2. Referans Standartlar ve Çerçeveler</h4>
<p>Metodoloji aşağıdaki uluslararası çerçevelere dayanır. Bu çerçeveler hangel'in sahip olduğu bir sertifika değil, ölçüm yönteminin referans aldığı standartlardır:</p>
<ul>
<li><strong>Theory of Change (Değişim Teorisi)</strong> — girdiler, faaliyetler, çıktılar, sonuçlar ve etki arasındaki nedensellik zincirinin haritalanması;</li>
<li><strong>Social Value International — SROI Standardı</strong> ve yedi temel ilkesi (paydaşların dahil edilmesi, değişimin anlaşılması, değerin maddileştirilmesi, yalnızca maddi olanın dahil edilmesi, aşırı iddiada bulunmama, şeffaflık, sonucun doğrulanması);</li>
<li><strong>IRIS+ (GIIN — Global Impact Investing Network)</strong> — standartlaştırılmış etki göstergeleri ve metrik taksonomisi;</li>
<li><strong>BM Sürdürülebilir Kalkınma Amaçları (SKA / SDG)</strong> ile gösterge düzeyinde hizalama.</li>
</ul>

<h4>3. Değişim Teorisi (Theory of Change)</h4>
<p>hangel, her etki alanı için bir Değişim Teorisi kurar. Bu teori, hangi girdilerin hangi faaliyetlere, bunların hangi çıktılara ve nihayetinde hangi toplumsal sonuca yol açtığını mantıksal bir zincirle açıklar. Örneğin acil kan eşleştirmesinde zincir; gönüllü bağışçı havuzu (girdi) → konuma dayalı eşleştirme bildirimi (faaliyet) → bağış randevusu (çıktı) → kana zamanında erişim (sonuç) → tedavi sürecinin desteklenmesi (etki) biçiminde kurgulanır. Her halkada varsayımlar ve riskler açıkça tanımlanır.</p>

<h4>4. Gösterge Seti</h4>
<p>hangel, etkiyi nicel ve nitel göstergelerle ölçmeyi hedefler. Aşağıdaki tablo, örnek gösterge setini ve veri kaynaklarını gösterir:</p>

<table class="w-full border-collapse border border-gray-200 my-4">
<thead>
<tr>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Gösterge Türü</th>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Örnek Gösterge</th>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Veri Kaynağı</th>
</tr>
</thead>
<tbody>
<tr>
<td class="border border-gray-200 p-2 text-sm">Çıktı (output)</td>
<td class="border border-gray-200 p-2 text-sm">Tamamlanan kan eşleştirmesi sayısı, aktarılan bağış tutarı, eşleşen gönüllü sayısı</td>
<td class="border border-gray-200 p-2 text-sm">Platform işlem kayıtları</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Sonuç (outcome)</td>
<td class="border border-gray-200 p-2 text-sm">Ortalama eşleşme süresi, tekrar bağış oranı, faydalanıcı memnuniyeti</td>
<td class="border border-gray-200 p-2 text-sm">Anketler, geri bildirim formları</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Etki (impact)</td>
<td class="border border-gray-200 p-2 text-sm">Net atfedilebilir toplumsal sonuç (deadweight ve atıf düzeltmeleriyle)</td>
<td class="border border-gray-200 p-2 text-sm">Karşılaştırmalı analiz, paydaş değerlendirmesi</td>
</tr>
</tbody>
</table>

<h4>5. SROI Hesaplama Yöntemi</h4>
<p>hangel, uygun olduğu alanlarda etkinin parasal değerini SROI yöntemiyle tahmin etmeyi hedefler. SROI; yaratılan sosyal değerin parasal karşılığının, kullanılan kaynağa (yatırıma) oranıdır. Hesaplamada şu düzeltmeler uygulanır: <strong>deadweight</strong> (hangel olmasaydı yine de gerçekleşecek değişim), <strong>attribution</strong> (etkinin başka aktörlere atfedilebilen kısmı), <strong>displacement</strong> (başka yere kayan etki) ve <strong>drop-off</strong> (etkinin zamanla azalması). hangel, SROI sonuçlarının tahmini niteliğini ve dayandığı varsayımları açıkça beyan etmeyi; sonuçları kesin bir mali getiri vaadi gibi sunmaktan kaçınmayı taahhüt eder.</p>

<h4>6. Veri Toplama, Doğrulama ve Kalite</h4>
<p>Veriler; platform işlem kayıtları, faydalanıcı ve paydaş anketleri ile kuruluş beyanlarından derlenir. hangel, verilerin tutarlılığını kontrol etmeyi ve mümkün olduğunda bağımsız doğrulamaya açmayı hedefler. Etki ölçümünde işlenen kişisel veriler 6698 sayılı KVKK'ya uygun işlenir; raporlamada toplulaştırılmış ve anonimleştirilmiş veri esas alınır. Özel nitelikli sağlık verileri (kan grubu) KVKK m.6 kapsamında korunur ve bireyi tanımlanabilir kılacak biçimde paylaşılmaz.</p>

<h4>7. Paydaş Katılımı ve Materyalite</h4>
<p>SROI standardının ilk ilkesi paydaşların sürece dahil edilmesidir. hangel, hangi değişimlerin ölçüleceğini ve nasıl değerleneceğini paydaşlarla istişare ederek belirlemeyi hedefler. <strong>Materyalite (önemlilik)</strong> ilkesi gereği, yalnızca paydaşlar için anlamlı ve karar açısından önemli olan sonuçlar ölçüm kapsamına alınır; önemsiz veya marjinal etkiler analizi karmaşıklaştırmamak için dışarıda bırakılabilir. Bu yaklaşım, etki tablosunun (impact map) hem eksiksiz hem de yönetilebilir olmasını sağlar. Paydaş grupları; doğrudan faydalanıcılar, gönüllüler, bağışçılar, platform üzerindeki kuruluşlar ve geniş anlamda toplum olarak sınıflandırılır.</p>

<h4>8. Vekil Değerler (Proxy) ve Sınırlılıklar</h4>
<p>Bazı toplumsal sonuçların doğrudan parasal karşılığı bulunmadığından, SROI hesaplamasında <strong>vekil finansal değerler (financial proxies)</strong> kullanılır. Örneğin gönüllülük yoluyla kazanılan beceri veya toplumsal aidiyet duygusu gibi soyut sonuçlar için temkinli ve kaynağı belirtilen vekil değerler tercih edilir. hangel, vekil değer seçiminde muhafazakâr (eksik tahmin yönünde) bir yaklaşım benimsemeyi ve tüm varsayımları açıkça raporlamayı taahhüt eder. Metodolojinin başlıca sınırlılıkları arasında veri eksikliği, öz-bildirime dayalı ölçümün yanlılığı ve uzun vadeli etkinin gözlemlenmesindeki güçlük yer alır; bu sınırlılıklar raporlarda şeffaf biçimde belirtilir.</p>

<h4>9. Yıllık Etki Raporu</h4>
<p>hangel, takvim yılı esasına göre bir yıllık etki raporu yayımlamayı hedefler. Rapor; Değişim Teorisi özetini, gösterge sonuçlarını, varsa SROI tahminlerini, kullanılan varsayımları, sınırlılıkları ve bir sonraki dönem hedeflerini içermeyi amaçlar. hangel, aşırı iddiadan kaçınma (SROI'nin "do not overclaim" ilkesi) gereğince, yalnızca doğrulanabilir sonuçları rapora dahil etmeyi taahhüt eder. Rapor, mümkün olduğunda önceki dönem sonuçlarıyla karşılaştırmalı olarak sunulur ve trend analizi içerir.</p>

<h4>10. Mevcut Durum ve Hedefler</h4>
<p>Etki ölçüm kapasitesi gelişen bir süreçtir. Aşağıdaki tablo mevcut durumu ve yol haritasını gösterir:</p>

<table class="w-full border-collapse border border-gray-200 my-4">
<thead>
<tr>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Alan</th>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Mevcut Durum</th>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Hedef</th>
</tr>
</thead>
<tbody>
<tr>
<td class="border border-gray-200 p-2 text-sm">Değişim Teorisi</td>
<td class="border border-gray-200 p-2 text-sm">Ana hizmet alanları için taslak zincirler oluşturulmuştur</td>
<td class="border border-gray-200 p-2 text-sm">Tüm etki alanları için paydaş doğrulamalı modeller geliştirmeyi hedefler</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">SROI hesaplama</td>
<td class="border border-gray-200 p-2 text-sm">Yöntem benimsenmiş, pilot uygulama aşamasındadır</td>
<td class="border border-gray-200 p-2 text-sm">Düzenli ve bağımsız doğrulamaya açık SROI raporlamasını amaçlar</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Bağımsız güvence</td>
<td class="border border-gray-200 p-2 text-sm">Henüz bağımsız etki güvencesi alınmamıştır</td>
<td class="border border-gray-200 p-2 text-sm">Bağımsız güvence sağlayıcılarıyla işbirliği kurmayı taahhüt eder</td>
</tr>
</tbody>
</table>

<h4>11. Yönetişim, Gözden Geçirme ve Sürekli İyileştirme</h4>
<p>Metodolojinin uygulanması ve güncellenmesi hangel AŞ yönetiminin gözetimindedir. hangel, metodolojiyi statik bir belge olarak değil, öğrenen ve gelişen bir çerçeve olarak ele alır. Her raporlama döneminin sonunda; gösterge setinin yeterliliği, veri kalitesi, varsayımların geçerliliği ve paydaş geri bildirimleri değerlendirilir ve bir sonraki dönemin metodolojisine yansıtılır. Uluslararası çerçevelerde (SROI standardı, IRIS+ taksonomisi) meydana gelen güncellemeler izlenir ve uygun olduğunda metodolojiye entegre edilir. hangel, metodolojide yaptığı önemli değişiklikleri ve bunların raporlanan sonuçlar üzerindeki etkisini şeffaf biçimde açıklamayı taahhüt eder; böylece dönemler arası karşılaştırılabilirlik korunmaya çalışılır.</p>

<h4>12. Yürürlük</h4>
<p>Bu Metodoloji, hangel tarafından yayımlandığı tarihte yürürlüğe girer ve periyodik olarak gözden geçirilir. Metodolojiye ilişkin görüş ve önerilerle veri koruma sorularında <a href="mailto:kvkk@hangel.org">kvkk@hangel.org</a> adresine başvurulabilir.</p>

<p class="text-xs text-muted-foreground"><em>Bu metin bilgilendirme amaçlıdır ve bağlayıcı nihai hukuki görüş niteliği taşımaz; yürürlük öncesi yetkili hukuk danışmanlığı önerilir.</em></p>
    `
  },
  {
    slug: 'acik-sosyal-girisim-beyani',
    title: 'Açık Sosyal Girişim Beyanı',
    content: `
      <h3>Açık Sosyal Girişim Beyanı</h3>

<p>İşbu Açık Sosyal Girişim Beyanı, hangel platformunu işleten <strong>hangel AŞ</strong> tarafından, hangel'in bir sosyal girişim olarak benimsediği misyon önceliği, kâr-kilidi (asset/profit-lock) yaklaşımı ve şeffaflık taahhütlerini kamuoyuyla açıkça paylaşmak amacıyla hazırlanmıştır. Bu Beyan, bir niyet ve taahhüt belgesidir; hangel'in sahip olduğu herhangi bir bağımsız sertifikayı temsil etmez. Beyandaki ileriye dönük ifadeler hedef ve taahhüt olarak okunmalıdır. Bu metnin esas dili Türkçedir; uluslararası çerçevelere atıflar İngilizce ifadeler içerebilir.</p>

<h4>1. Amaç ve İlkeler</h4>
<p>Bu Beyanın amacı, hangel'in ticari faaliyetini toplumsal bir misyonun hizmetine sunan bir sosyal girişim modelini benimsediğini açıkça ortaya koymaktır. hangel, kâr elde etmeyi misyonunu sürdürmenin bir aracı olarak görür; kârı bir amaç değil, toplumsal etkiyi büyütmenin kaynağı olarak konumlandırmayı taahhüt eder. Temel ilkeler şunlardır: misyon önceliği, şeffaflık, hesap verebilirlik, paydaş katılımı ve kaynakların misyona tahsisi.</p>

<h4>2. Kapsam ve Paydaşlar</h4>
<p>Beyan; hangel AŞ'nin tüm faaliyetlerini, gelir modelini ve kâr tahsis yaklaşımını kapsar. Paydaşlar arasında bağışçılar, gönüllüler, faydalanıcılar, platform üzerindeki kuruluşlar (dernek, vakıf, sosyal işletme), marka üyeleri, çalışanlar ve kamuoyu yer alır. hangel, bu paydaşlara karşı şeffaf ve hesap verebilir olmayı taahhüt eder.</p>

<h4>3. Referans Çerçeve (Sertifika DEĞİL, Uyum Hedefi)</h4>
<p>hangel, aşağıdaki uluslararası sosyal girişim çerçevelerinin <strong>kriterlerine uyumu bir hedef olarak</strong> benimser. Önemle belirtilir ki hangel, bu çerçevelerin hiçbirinden hâlihazırda bir sertifika, akreditasyon veya unvan <strong>almış değildir</strong>; aşağıdakiler yalnızca referans alınan ve uyum hedeflenen iyi uygulama setleridir:</p>
<ul>
<li><strong>EU Social Economy Action Plan (AB Sosyal Ekonomi Eylem Planı)</strong> — sosyal ekonominin tanımı ve sosyal girişimlere ilişkin ilkeler;</li>
<li><strong>B Corp (B Lab) sertifikasyon kriterleri</strong> — yönetişim, çalışanlar, topluluk, çevre ve müşteri boyutlarında performans (hangel henüz B Corp sertifikalı değildir; kriterlere uyumu hedefler);</li>
<li><strong>Social Enterprise Mark kriterleri</strong> — misyon önceliği, gelirin önemli bölümünün ticari faaliyetten gelmesi ve kâr/varlığın misyona kilitlenmesi (hangel bu işareti taşımamaktadır; ilkelerine uyumu amaçlar);</li>
<li><strong>Kâr-kilidi (asset/profit-lock) ilkesi</strong> — kâr ve varlıkların öncelikli olarak toplumsal misyona ayrılması yaklaşımı.</li>
</ul>

<h4>4. Kâr-Kilidi (Asset/Profit-Lock) Taahhüdü</h4>
<p>hangel, kâr-kilidi ilkesini bir taahhüt olarak benimser. Bu kapsamda hangel; elde edilen net kârın önemli bir bölümünün — <strong>hedef olarak en az %51'inin</strong> — toplumsal misyonun sürdürülmesine ve büyütülmesine tahsis edilmesini amaçlar. Bu oran, bağlayıcı bir mali tablo beyanı değil, hangel'in yönetsel taahhüdüdür ve şirket esas sözleşmesi ile iç politikalarla güçlendirilmesi hedeflenir. hangel, bu taahhüdün gerçekleşmesini yıllık olarak kamuoyuna raporlamayı amaçlar.</p>

<table class="w-full border-collapse border border-gray-200 my-4">
<thead>
<tr>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Konu</th>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Mevcut Durum</th>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Hedef</th>
</tr>
</thead>
<tbody>
<tr>
<td class="border border-gray-200 p-2 text-sm">B Corp / Social Enterprise Mark</td>
<td class="border border-gray-200 p-2 text-sm">Sertifika/işaret alınmamıştır</td>
<td class="border border-gray-200 p-2 text-sm">Kriterlere uyumu olgunlaştırıp başvuru için hazırlanmayı hedefler</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Kârın %51'i misyona</td>
<td class="border border-gray-200 p-2 text-sm">Yönetsel taahhüt olarak benimsenmiştir</td>
<td class="border border-gray-200 p-2 text-sm">Esas sözleşme ve iç politikayla bağlayıcı hâle getirmeyi amaçlar</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Bağımsız doğrulama</td>
<td class="border border-gray-200 p-2 text-sm">Bağımsız sosyal girişim denetimi yapılmamıştır</td>
<td class="border border-gray-200 p-2 text-sm">Bağımsız değerlendirme/doğrulama almayı taahhüt eder</td>
</tr>
</tbody>
</table>

<h4>5. Davranış Kuralları ve Yasaklar</h4>
<p>hangel; misyonla çelişen, kâr-kilidi taahhüdünü zedeleyen veya paydaş güvenini sarsan uygulamalardan kaçınmayı taahhüt eder. Bu kapsamda yanıltıcı etki iddiaları, sahip olunmayan sertifikaların varmış gibi sunulması ("greenwashing" / "impact-washing") ve misyon dışı kâr dağıtımı önceliği yasaktır. hangel, kamuya yönelik tüm tanıtımlarında "sertifikalı/akredite" gibi nitelendirmelerden, gerçek bir belgeye dayanmadıkça kaçınır.</p>

<h4>6. Yönetişim ve Sorumluluklar</h4>
<p>Bu Beyanın uygulanmasından hangel AŞ yönetimi sorumludur. hangel, misyon ve kâr-kilidi taahhütlerinin gözetimini yönetim düzeyinde ele almayı; etki, etik ve finansal şeffaflık politikalarını bu Beyanla bütünleşik biçimde yürütmeyi hedefler. hangel'in faaliyetleri, kâr amacı güden bir anonim şirket olarak Türk Ticaret Kanunu (6102 sayılı Kanun) hükümlerine tabidir; sosyal girişim taahhütleri bu yasal çerçeveyle uyumlu biçimde uygulanır.</p>

<h4>7. Paydaş Yönetişimi ve Hesap Verebilirlik</h4>
<p>hangel, sosyal girişim modelinin yalnızca hissedarlara değil, geniş bir paydaş kitlesine karşı hesap verebilirliği gerektirdiğini benimser. Bu kapsamda hangel; faydalanıcıların, gönüllülerin, bağışçıların ve çalışanların menfaatlerini karar süreçlerinde gözetmeyi ve paydaş geri bildirimini yönetişime dahil etmeyi hedefler. B Corp çerçevesinin "paydaş yönetişimi" boyutuna uyumu bir hedef olarak benimsenir; ancak yinelenir ki bu, sahip olunan bir sertifikayı değil, ulaşılmak istenen bir olgunluk düzeyini ifade eder. hangel, misyonundan sapmayı önlemek için iç gözetim mekanizmaları kurmayı amaçlar.</p>

<h4>8. Misyon Sürekliliği ve Kilit Garantileri</h4>
<p>hangel, sosyal misyonun şirketin ileride el değiştirmesi, sermaye yapısının değişmesi veya yönetim değişikliği gibi durumlardan zarar görmemesini önemli bir ilke olarak görür. Bu amaçla hangel; esas sözleşmeye misyon ve kâr-kilidi hükümleri eklemeyi, önemli kararlarda misyonu koruyucu mekanizmalar öngörmeyi ve "mission lock" benzeri güvenceleri zaman içinde güçlendirmeyi hedefler. Bu hedefler, mevcutta bağlayıcı bir tüzel yapı olarak tamamlanmış sayılmaz; yol haritası kapsamında ilerletilmesi taahhüt edilir.</p>

<h4>9. Şeffaflık ve İzleme</h4>
<p>hangel, bu Beyandaki taahhütlerin gerçekleşme durumunu yıllık etki ve şeffaflık raporlarında kamuoyuyla paylaşmayı hedefler. Taahhütlerden sapma olması hâlinde bunu açıkça beyan etmeyi ve düzeltici adımları duyurmayı taahhüt eder. hangel, "sosyal girişim" ve "misyon odaklı" gibi nitelendirmeleri yalnızca bu Beyandaki taahhütlerle tutarlı kaldığı sürece kullanmayı esas alır.</p>

<h4>10. Gelir Modeli ve Kaynakların Misyona Hizmeti</h4>
<p>hangel, sürdürülebilir bir gelir modeline sahip olmanın toplumsal misyonun devamlılığı için gerekli olduğunu kabul eder. Gelir kalemleri arasında marka üyelikleri, kurumsal işbirlikleri, affiliate bağış aktarımından elde edilen paylar ve platform hizmetlerine ilişkin gelirler yer alabilir. hangel, bu gelirlerin meşru, şeffaf ve misyonla çelişmeyen kaynaklardan elde edilmesini esas alır; toplumsal amaçla bağdaşmayan veya itibar riski taşıyan gelir kaynaklarından kaçınmayı taahhüt eder. Elde edilen gelirin önemli bir bölümünün toplumsal misyona tahsisine ilişkin kâr-kilidi taahhüdü (Madde 4), gelir modelinin temel çerçevesini oluşturur. hangel, gelir ve kaynak kullanımına ilişkin bilgileri finansal şeffaflık ve etki raporlamasıyla bütünleşik biçimde kamuoyuyla paylaşmayı hedefler.</p>

<h4>11. Ölçülen Değer ve Kamuya Açık Hesap Verme</h4>
<p>hangel, sosyal girişim iddiasının ancak ölçülebilir ve doğrulanabilir sonuçlarla anlam kazandığını benimser. Bu nedenle Açık Sosyal Girişim Beyanı, hangel'in Sosyal Etki Ölçüm ve Raporlama Metodolojisi ile birlikte okunur; misyona ilişkin taahhütlerin gerçekleşme düzeyi, Theory of Change ve SROI çerçeveleriyle uyumlu göstergeler üzerinden raporlanmaya çalışılır. hangel; toplumsal değer iddialarını pazarlama amaçlı abartmaktan kaçınır, yalnızca doğrulanabilir sonuçları kamuya sunar ve eleştirel geri bildirime açık kalır. Bu yaklaşım, "impact-washing" olarak adlandırılan, gerçeğe dayanmayan etki iddialarından kaçınma taahhüdünün doğal bir uzantısıdır.</p>

<h4>12. Yürürlük</h4>
<p>Bu Beyan, hangel tarafından yayımlandığı tarihte yürürlüğe girer ve gelişen iyi uygulamalara göre periyodik olarak gözden geçirilir. Beyana ilişkin görüş ve önerilerle veri koruma sorularında <a href="mailto:kvkk@hangel.org">kvkk@hangel.org</a> adresine başvurulabilir.</p>

<p class="text-xs text-muted-foreground"><em>Bu metin bilgilendirme amaçlıdır ve bağlayıcı nihai hukuki görüş niteliği taşımaz; yürürlük öncesi yetkili hukuk danışmanlığı önerilir.</em></p>
    `
  },
  {
    slug: 'bagis-ve-yardim-politikasi',
    title: 'Bağış ve Yardım Politikası',
    content: `
      <h3>Bağış ve Yardım Politikası</h3>

<p>İşbu Bağış ve Yardım Politikası, hangel platformunu işleten <strong>hangel AŞ</strong> tarafından, platform üzerinden gerçekleştirilen bireysel ve kurumsal bağış toplama, yardım aktarımı ve fon tahsisi süreçlerinin yürürlükteki Türk mevzuatına uygun, şeffaf ve hesap verebilir biçimde yürütülmesini sağlamak amacıyla hazırlanmıştır. Bu metnin esas dili Türkçedir; uluslararası iyi uygulamalara atıflar yabancı dilde ifadeler içerebilir.</p>

<h4>1. Amaç ve Kapsam</h4>
<p>Bu Politikanın amacı, hangel üzerinde yürütülen bağış ve yardım faaliyetlerinin yasal çerçevesini, bağışçıların bilgilendirilmesi esaslarını, toplanan kaynakların aktarım ve denetim süreçlerini ve iade ilkelerini belirlemektir. Politika; bireysel bağışçıları, kurumsal/marka bağışçılarını, affiliate (bağış aktarımı) kanalını ve platform üzerinde yardım kampanyası yürüten dernek, vakıf ve diğer kuruluşları kapsar. hangel, bağış sürecinde esas itibarıyla <strong>aracı/teknik altyapı sağlayıcı</strong> konumundadır; nihai yardım toplama izni ve sorumluluğu, ilgili mevzuat gereği kampanyayı yürüten kuruluşa aittir.</p>

<h4>2. Yasal Dayanak</h4>
<p>Bu Politika, başta aşağıdaki mevzuat olmak üzere yürürlükteki düzenlemelere dayanır:</p>
<ul>
<li><strong>2860 sayılı Yardım Toplama Kanunu</strong> — yardım toplama şekilleri (m.5), izin şartı ve izin muafiyeti (m.6), izin vermeye yetkili makamlar (m.7) ve izinsiz toplamaya ilişkin idari yaptırımlar (m.29);</li>
<li><strong>Yardım Toplama Esas ve Usulleri Hakkında Yönetmelik</strong> — başvuru, makbuz/kutu düzeni ve hesap verme usulleri;</li>
<li><strong>5253 sayılı Dernekler Kanunu</strong> ve <strong>5737 sayılı Vakıflar Kanunu</strong> — kuruluşların beyan ve denetim yükümlülükleri;</li>
<li><strong>4721 sayılı Türk Medeni Kanunu</strong> — bağış (bağışlama) ilişkisinin temel hukuki niteliği ve dernek/vakıf tüzel kişiliğine ilişkin hükümler;</li>
<li><strong>6698 sayılı KVKK</strong> — bağışçı kişisel verilerinin işlenmesi (m.4, m.5, m.10);</li>
<li><strong>5549 sayılı Suç Gelirlerinin Aklanmasının Önlenmesi Hakkında Kanun</strong> (MASAK) — kaynak doğrulama ve şüpheli işlem hassasiyeti (m.3, m.4).</li>
</ul>

<h4>3. Yardım Toplama İzni ve İzin Muafiyeti</h4>
<p>2860 sayılı Kanun m.6 uyarınca, kişiler ve kuruluşlar yetkili makamdan izin almadan yardım toplayamaz. Yardım toplama faaliyeti bir ilçe sınırları içinde ise kaymakamlıktan, birden fazla ilçeyi kapsıyorsa valilikten, birden fazla ili kapsıyorsa faaliyet sahibinin yerleşim yerindeki valilikten izin alınır (m.7). Kamu yararına çalışan dernek, kurum ve vakıflardan hangilerinin izin almadan yardım toplayabileceği Cumhurbaşkanı tarafından belirlenir ve ilan edilir; bu kapsamdaki kuruluşlar <strong>izin muafiyetinden</strong> yararlanır.</p>
<p>hangel, kampanya başlatan kuruluşlardan, yürütecekleri faaliyet için gerekli yardım toplama iznini veya izin muafiyeti dayanağını beyan etmelerini ister. İzin/muafiyet beyanı sunmayan veya sunduğu belge tutarsız olan kampanyalar yayımlanmaz ya da askıya alınır. İzinsiz yardım toplanması hâlinde m.29 kapsamındaki idari para cezalarından doğan sorumluluk, münhasıran faaliyeti yürüten kuruluşa aittir.</p>

<table class="w-full border-collapse border border-gray-200 my-4">
<thead>
<tr>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Faaliyetin Coğrafi Kapsamı</th>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">İzin Vermeye Yetkili Makam</th>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Dayanak</th>
</tr>
</thead>
<tbody>
<tr>
<td class="border border-gray-200 p-2 text-sm">Tek ilçe sınırı içinde</td>
<td class="border border-gray-200 p-2 text-sm">İlgili kaymakamlık</td>
<td class="border border-gray-200 p-2 text-sm">2860 m.7</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Bir ilde birden fazla ilçe</td>
<td class="border border-gray-200 p-2 text-sm">İl valiliği</td>
<td class="border border-gray-200 p-2 text-sm">2860 m.7</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Birden fazla il</td>
<td class="border border-gray-200 p-2 text-sm">Faaliyet sahibinin yerleşim yeri valiliği</td>
<td class="border border-gray-200 p-2 text-sm">2860 m.7</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Kamu yararına dernek/vakıf (ilanlı)</td>
<td class="border border-gray-200 p-2 text-sm">İzin muafiyeti (izinsiz toplayabilir)</td>
<td class="border border-gray-200 p-2 text-sm">2860 m.6</td>
</tr>
</tbody>
</table>

<h4>4. Bağış Toplama ve Aktarım Süreci</h4>
<p>2860 sayılı Kanun m.5, yardımın makbuzla, belirli yerlere kutu koyarak, bankalarda hesap açtırarak ve bilgileri otomatik ya da elektronik olarak işleme tabi tutmuş sistemler kullanmak suretiyle toplanabileceğini düzenler. hangel, esas olarak bu son yöntem kapsamında <strong>elektronik bağış altyapısı</strong> sunar. Bağış akışı şu adımlardan oluşur:</p>
<ul>
<li><strong>Kampanya doğrulaması:</strong> Kuruluşun tüzel kişiliği, izin/muafiyet dayanağı ve banka/IBAN bilgileri ön kontrolden geçirilir.</li>
<li><strong>Bağış alımı:</strong> Bağışçı, lisanslı ödeme hizmeti sağlayıcıları üzerinden ödeme yapar; hangel kart verilerini saklamaz.</li>
<li><strong>İzlenebilirlik:</strong> Her bağış benzersiz işlem kimliğiyle kayıt altına alınır; bağışçıya elektronik bağış makbuzu/onayı iletilir.</li>
<li><strong>Aktarım:</strong> Toplanan tutar, hizmet/işlem kesintileri ayrıştırılarak ilgili kuruluşun doğrulanmış hesabına aktarılır ve mutabakat kaydı tutulur.</li>
</ul>
<p>affiliate kanalında, üçüncü taraf platformlar üzerinden yönlendirilen bağışlarda da aynı izlenebilirlik ve doğrulama ilkeleri uygulanır.</p>

<h4>5. Fon Kullanımı ve Tahsis İlkeleri</h4>
<p>Toplanan yardımlar, yalnızca kampanyada ilan edilen amaca tahsis edilir. Amaç dışı kullanım yasaktır ve 2860 sayılı Kanun ile ilgili kuruluşun kendi mevzuatı kapsamında sorumluluk doğurur. hangel'in tahsil ettiği hizmet/işlem ücretleri, bağış sayfasında açık biçimde gösterilir; bağışçı, bağışının ne kadarının kuruluşa ulaştığını görebilir. Belirli bir amaç gerçekleşemezse veya kampanya hedefe ulaşamazsa, toplanan tutarın akıbeti kampanya koşullarında önceden duyurulur.</p>

<h4>6. Bağışçının Bilgilendirilmesi ve Hakları</h4>
<p>Bağışçı; kampanyanın amacı, kampanyayı yürüten kuruluşun kimliği, izin/muafiyet durumu, kesinti oranları ve fonun kullanım alanı hakkında bilgilendirilir. Bağışçının; bağış makbuzu/onayı alma, fonun kullanımı hakkında bilgi talep etme, kişisel verilerinin KVKK m.11 kapsamında kontrolü ve pazarlama izinlerini geri çekme hakları saklıdır. Ayrıntılı haklar, <em>Bağışçı Hakları Beyannamesi</em>nde düzenlenmiştir.</p>

<h4>7. AML/CFT ve Kaynak Doğrulama</h4>
<p>hangel, suç gelirlerinin aklanması ve terörizmin finansmanı risklerine karşı 5549 sayılı Kanun ve <strong>6415 sayılı Terörizmin Finansmanının Önlenmesi Hakkında Kanun</strong>'un ruhuna uygun tedbirleri benimser. Bu kapsamda, riskli görülen bağış ve aktarımlarda kimlik/kaynak doğrulaması yapılabilir (5549 m.3), şüpheli görülen işlemler yetkili mercilere bildirilebilir (5549 m.4) ve gerektiğinde işlem askıya alınabilir. Bu tedbirler, mevzuatın öngördüğü ifşa yasağı çerçevesinde yürütülür.</p>

<h4>8. Finansal Raporlama ve Denetim</h4>
<p>hangel, platform üzerinden gerçekleşen bağış akışlarının izlenebilirliğini sağlamayı ve dönemsel olarak toplulaştırılmış bağış/aktarım verilerini kamuoyuyla paylaşmayı taahhüt eder. Kampanyayı yürüten kuruluşların 5253 sayılı Dernekler Kanunu m.19 ve 5737 sayılı Vakıflar Kanunu kapsamındaki beyanname/denetim yükümlülükleri kendilerine aittir. hangel, bağımsız dış denetim ve genişletilmiş şeffaflık raporlaması süreçlerini bir <strong>hedef ve taahhüt</strong> olarak yol haritasına almıştır; ayrıntılar ilgili denetim ve şeffaflık politikalarında yer alır.</p>

<h4>9. İade ve İtiraz</h4>
<p>Bağışlar kural olarak karşılıksız ve geri dönüşsüz nitelikte olup, tamamlanmış bir bağışın iadesi istisnaidir. Bununla birlikte; mükerrer/hatalı işlem, teknik hata, kampanyanın iptali veya açık bir yanıltma hâllerinde bağışçı, işlemden itibaren makul süre içinde iade talebinde bulunabilir. İade talepleri, ödeme sağlayıcısının kuralları ve ilgili kuruluşun onayı çerçevesinde değerlendirilir. İtiraz ve şikâyetler için bağışçı, hangel destek kanallarına başvurabilir; veri koruma konularında <a href="mailto:kvkk@hangel.org">kvkk@hangel.org</a> adresi kullanılır.</p>

<h4>10. Yürürlük</h4>
<p>Bu Politika, hangel tarafından yayımlandığı tarihte yürürlüğe girer ve mevzuat değişiklikleri ile uygulama ihtiyaçları doğrultusunda gözden geçirilir. Güncel sürüm, platform üzerinde erişilebilir tutulur ve esaslı değişiklikler kullanıcılara duyurulur.</p>

<p class="text-xs text-muted-foreground"><em>Bu metin bilgilendirme amaçlıdır ve bağlayıcı nihai hukuki görüş niteliği taşımaz; yürürlük öncesi yetkili hukuk danışmanlığı önerilir.</em></p>
    `
  },
  {
    slug: 'bagisci-haklari-beyannamesi',
    title: 'Bağışçı Hakları Beyannamesi',
    content: `
      <h3>Bağışçı Hakları Beyannamesi</h3>

<p>İşbu Bağışçı Hakları Beyannamesi, hangel platformunu işleten <strong>hangel AŞ</strong> tarafından, bağışçıların bilgilendirme, şeffaflık, gizlilik ve saygı temelinde korunan haklarını uluslararası kabul görmüş <em>Donor Bill of Rights</em> ilkeleriyle uyumlu biçimde ortaya koymak amacıyla hazırlanmıştır. Bu metnin esas dili Türkçedir; atıf yapılan uluslararası belge adı İngilizce ifadeler içerebilir.</p>

<h4>1. Amaç ve Kapsam</h4>
<p>Bu Beyanname, hangel üzerinden bağış yapan bireysel ve kurumsal bağışçıların temel haklarını tanımlar ve bu hakların korunmasına yönelik hangel'in taahhütlerini ortaya koyar. Beyanname, platform üzerinde yürütülen tüm bağış kampanyalarını ve affiliate (bağış aktarımı) kanalını kapsar. Kampanyayı yürüten kuruluşlar da bu ilkelere uymayı kabul etmiş sayılır.</p>

<h4>2. Referans Çerçeve</h4>
<p>Bu Beyanname, hayırseverlik alanında uluslararası standart hâline gelmiş <strong>Donor Bill of Rights</strong> ilkelerini esas alır. Söz konusu belge; <strong>Association of Fundraising Professionals (AFP)</strong>, <strong>Association for Healthcare Philanthropy (AHP)</strong>, <strong>Council for Advancement and Support of Education (CASE)</strong> ve <strong>Giving Institute</strong> tarafından geliştirilmiş ve 1993 yılında benimsenmiş bir iyi uygulama çerçevesidir. hangel, bu çerçeveyi bir <em>referans</em> olarak benimser; çerçeve hangel'e ait bir sertifika veya akreditasyon değildir. Beyanname ayrıca, Türk hukukunda bağışçı kişisel verilerini koruyan <strong>6698 sayılı KVKK</strong> ile bütünlük içinde uygulanır.</p>

<h4>3. Bilgilendirilme Hakkı</h4>
<p>Bağışçı; kuruluşun misyonu, bağışların hangi amaçla ve nasıl kullanılacağı ve kuruluşun bu kaynakları amacına uygun ve etkili biçimde kullanma kapasitesi hakkında bilgilendirilme hakkına sahiptir. hangel, her kampanyada amacı, hedef kitleyi ve fonun planlanan kullanımını açık biçimde gösterir. Bağışçı, bağış talebinde bulunanların gönüllü mü, kuruluş çalışanı mı yoksa sözleşmeli tahsildar mı olduğunu öğrenme hakkına sahiptir.</p>

<h4>4. Şeffaflık ve Hesap Verebilirlik Hakkı</h4>
<p>Bağışçı; kuruluşun yönetim organlarının kimliğini öğrenme ve bu organların görevlerini özenle yerine getirmesini bekleme hakkına sahiptir. Bağışçı ayrıca, kuruluşun en güncel finansal tablolarına erişme hakkına sahiptir. hangel, kampanya bazında toplanan ve aktarılan tutarların izlenebilirliğini sağlar; bağışçı, bağışının ne kadarının kuruluşa ulaştığını ve hangi kesintilerin uygulandığını görebilir.</p>

<table class="w-full border-collapse border border-gray-200 my-4">
<thead>
<tr>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Hak</th>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Kapsamı</th>
</tr>
</thead>
<tbody>
<tr>
<td class="border border-gray-200 p-2 text-sm">Bilgilendirilme</td>
<td class="border border-gray-200 p-2 text-sm">Misyon, fonun kullanımı ve kuruluş kapasitesi hakkında bilgi</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Şeffaflık</td>
<td class="border border-gray-200 p-2 text-sm">Yönetim organları ve güncel finansal tablolara erişim</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Amaca uygun kullanım</td>
<td class="border border-gray-200 p-2 text-sm">Bağışın ilan edilen amaç için kullanılacağı güvencesi</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Tanınma ve gizlilik</td>
<td class="border border-gray-200 p-2 text-sm">Uygun teşekkür/tanınma ve verilerin gizli/saygılı işlenmesi</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Saygı</td>
<td class="border border-gray-200 p-2 text-sm">Profesyonel, baskısız ve nazik muamele</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Geri bildirim</td>
<td class="border border-gray-200 p-2 text-sm">Soru sorma ve doğru, dürüst, hızlı yanıt alma</td>
</tr>
</tbody>
</table>

<h4>5. Amaca Uygun Kullanım Hakkı</h4>
<p>Bağışçı, yaptığı bağışın ilan edilen amaç doğrultusunda kullanılacağına güvenme hakkına sahiptir. Belirli bir amaca tahsis edilen (koşullu) bağışlar yalnızca o amaç için kullanılabilir. Amaç gerçekleşemediğinde fonun nasıl yönlendirileceği, kampanya koşullarında önceden açıklanır. hangel, amaç dışı kullanım iddialarını ciddiyetle değerlendirir ve gerektiğinde aktarımı askıya alabilir. Bu hak, 2860 sayılı Yardım Toplama Kanunu'nun toplanan yardımların amaca uygun kullanılması ilkesiyle de örtüşür; amaç dışı kullanım, kampanyayı yürüten kuruluş bakımından idari ve hukuki sorumluluk doğurur. Bağışçı, dilerse bağışını genel amaçlı (kuruluşun takdirine bırakılan) ya da belirli bir projeye tahsisli olarak yapmayı seçebilir; bu tercih bağış anında açıkça gösterilir.</p>

<h4>6. Tanınma ve Teşekkür Hakkı</h4>
<p>Bağışçı; bağışına uygun, ölçülü ve saygılı bir biçimde tanınma ve teşekkür alma hakkına sahiptir. Bağışçı, isminin kamuya açık biçimde anılmasını ister veya istemeyebilir; bu tercihe saygı gösterilir. Tanınma uygulamaları, bağışçının onayına ve gizlilik tercihine bağlıdır; bağışçının açık tercihi olmadan ismi tanıtım malzemelerinde kullanılmaz. Bağışçı, kendisiyle ilgili paylaşılabilecek bilgilerin kapsamını her zaman güncelleyebilir.</p>

<h4>7. Gizlilik ve Veri Koruma Hakkı</h4>
<p>Bağışçı; kişisel verilerinin gizli tutulmasını, yalnızca beyan edilen amaçlarla işlenmesini ve hukuka uygun biçimde korunmasını bekleme hakkına sahiptir. hangel, bağışçı verilerini 6698 sayılı KVKK'ya uygun işler. Bağışçı, KVKK m.11 kapsamında verilerine erişme, düzeltme, silme ve işleme itiraz etme haklarına sahiptir. Bağışçı, isminin paylaşılabilecek tanıtım/posta listelerinden çıkarılmasını talep edebilir; ticari iletişim izinleri, <strong>6563 sayılı Elektronik Ticaretin Düzenlenmesi Hakkında Kanun</strong> ve İleti Yönetim Sistemi (İYS) kuralları çerçevesinde her zaman geri çekilebilir. Bağışçı, dilerse <strong>anonim bağış</strong> yapma seçeneğinden yararlanabilir.</p>

<h4>8. Saygı ve Profesyonel Muamele Hakkı</h4>
<p>Bağışçı; baskı, taciz veya yanıltma içermeyen, nazik ve profesyonel bir muamele görme hakkına sahiptir. Bağış kararı tamamen bağışçının özgür iradesine bırakılır; yanıltıcı veya duygusal istismara dayalı yöntemler kabul edilmez. Bağışçı bilgileri, kuruluşun açıkladığı amaçlar dışında üçüncü taraflarca kullanılamaz.</p>

<h4>9. Soru Sorma ve Geri Bildirim Hakkı</h4>
<p>Bağışçı, bağış yaparken soru sorma ve sorularına hızlı, dürüst ve açık yanıtlar alma hakkına sahiptir. hangel, bağışçı geri bildirimlerini ve şikâyetlerini değerlendirmek üzere erişilebilir kanallar sunar. Veri koruma konularında <a href="mailto:kvkk@hangel.org">kvkk@hangel.org</a>, uluslararası bağışçılar için <a href="mailto:privacy@hangel.org">privacy@hangel.org</a> adresine başvurulabilir. Bağışçı, talebinin makul süre içinde yanıtlanmasını bekleme hakkına sahiptir.</p>

<h4>10. İade ve İtiraz</h4>
<p>Bağışlar kural olarak karşılıksız ve geri dönüşsüzdür; ancak mükerrer/hatalı işlem, teknik hata veya kampanya iptali gibi hâllerde bağışçı iade talebinde bulunabilir. İade ve itiraz süreçleri, <em>Bağış ve Yardım Politikası</em> hükümleri çerçevesinde yürütülür. Bağışçı, hakkının ihlal edildiğini düşündüğü durumda, KVKK kapsamındaki şikâyetleri için Kişisel Verileri Koruma Kurulu'na başvurma hakkını saklı tutar.</p>

<h4>11. Yürürlük</h4>
<p>Bu Beyanname, hangel tarafından yayımlandığı tarihte yürürlüğe girer ve uluslararası iyi uygulamalar ile mevzuat gelişmeleri doğrultusunda gözden geçirilir. Güncel sürüm, platform üzerinde bağışçıların erişimine açık tutulur. hangel, Beyannamede yapacağı esaslı değişiklikleri bağışçılara duyurmayı taahhüt eder ve bağışçıların bu metinden doğan haklarını her zaman kullanabilmesini sağlar.</p>

<p class="text-xs text-muted-foreground"><em>Bu metin bilgilendirme amaçlıdır ve bağlayıcı nihai hukuki görüş niteliği taşımaz; yürürlük öncesi yetkili hukuk danışmanlığı önerilir.</em></p>
    `
  },
  {
    slug: 'bagis-gelirlerinin-denetlenmesi-politikasi',
    title: 'Bağış Gelirlerinin Denetlenmesi ve Şeffaflık Raporu Politikası',
    content: `
      <h3>Bağış Gelirlerinin Denetlenmesi ve Şeffaflık Raporu Politikası</h3>

<p>İşbu Politika, hangel platformunu işleten <strong>hangel AŞ</strong> tarafından, platform üzerinden toplanan bağış gelirlerinin iç kontrol, izleme ve denetim çerçevesini tanımlamak ve bağış akışlarına ilişkin şeffaflık raporlamasına yönelik taahhütleri ortaya koymak amacıyla hazırlanmıştır. Bu metin bir <strong>yol haritası belgesi</strong> niteliğindedir: henüz tamamlanmamış bağımsız dış denetim ve genişletilmiş raporlama süreçleri, gerçekleşmiş gibi değil, <em>hedef ve taahhüt</em> olarak ifade edilir. Bu metnin esas dili Türkçedir.</p>

<h4>1. Amaç ve Kapsam</h4>
<p>Bu Politikanın amacı; bağış gelirlerinin doğru kaydedilmesini, amacına uygun aktarılmasını, izlenebilirliğini ve kamuoyuna karşı hesap verebilirliğini sağlayacak kontrol ve denetim ilkelerini belirlemektir. Politika; bireysel ve kurumsal bağışları, affiliate kanalını ve hangel'in tahsil ettiği hizmet/işlem ücretlerini kapsar. hangel'in mevcut iç kontrol uygulamaları gerçekçi biçimde tanımlanır; bağımsız dış denetim ve yıllık şeffaflık raporu ise taahhüt edilen hedefler olarak çerçevelenir.</p>

<h4>2. Yasal ve Çerçevesel Dayanak</h4>
<ul>
<li><strong>2860 sayılı Yardım Toplama Kanunu</strong> — toplanan yardımların amaca uygun kullanımı ve hesap verme yükümlülüğü (m.5–m.7);</li>
<li><strong>Kamu Gözetimi, Muhasebe ve Denetim Standartları Kurumu (KGK) Bağımsız Denetim Yönetmeliği</strong> — bağımsız denetimin yürütülmesine ilişkin esaslar (referans olarak; hangel hâlihazırda bağımsız denetimden geçmiş değildir);</li>
<li><strong>6102 sayılı Türk Ticaret Kanunu</strong> — defter tutma, finansal raporlama ve denetim hükümleri;</li>
<li>Uluslararası çerçeveler: <strong>IFRS</strong> (International Financial Reporting Standards) ve <strong>ISA</strong> (International Standards on Auditing) ile <strong>ISAE 3000</strong> türü güvence standartları — referans iyi uygulama setleri olup hangel'in akredite olduğu standartlar değildir.</li>
</ul>
<p>hangel, bu çerçeveleri hedeflediği denetim ve raporlama olgunluğu için <em>referans</em> olarak benimser; bunlar hangel'e ait bir sertifika veya tamamlanmış denetim anlamına gelmez.</p>

<h4>3. Bağış Gelirlerinin Kaydı ve İzlenebilirliği</h4>
<p>Her bağış, benzersiz bir işlem kimliğiyle elektronik ortamda kayıt altına alınır. Bağış tutarı, uygulanan hizmet/işlem kesintileri ve kuruluşa aktarılan net tutar ayrı ayrı izlenir. Bağışçıya elektronik bağış onayı/makbuzu iletilir; aktarım aşamasında kuruluşla mutabakat kaydı tutulur. Bu izlenebilirlik zinciri, bağışın kaynaktan kullanım noktasına kadar takibini mümkün kılar.</p>
<p>İzlenebilirlik mimarisi üç katmanda kurgulanır: <strong>tahsilat katmanı</strong> (ödeme sağlayıcı işlem kayıtları), <strong>platform katmanı</strong> (kampanya-bağış-bağışçı ilişkilendirmesi) ve <strong>aktarım katmanı</strong> (kuruluşa yapılan ödeme ve mutabakat). Bu katmanlar arasındaki tutar bütünlüğü dönemsel kontrollerle doğrulanır. Toplulaştırılmış bağış verileri, kişisel verilerin korunması ilkeleri gözetilerek raporlanır; bireysel bağışçı bilgileri yalnızca yetkili personel ve mevzuatın gerektirdiği hâllerde erişilebilir kılınır.</p>

<h4>4. Mevcut İç Kontrol Önlemleri</h4>
<p>hangel, bağış akışlarında aşağıdaki iç kontrolleri uygular. Bu önlemler gerçekçi biçimde, hâlihazırda uygulanan kontroller olarak tanımlanmıştır:</p>
<ul>
<li><strong>Görevler ayrılığı:</strong> Bağış tahsilatı, mutabakat ve aktarım onayı süreçleri ayrıştırılmıştır.</li>
<li><strong>Ödeme sağlayıcı entegrasyonu:</strong> Tahsilat, lisanslı ödeme hizmeti sağlayıcıları üzerinden yürütülür; kart verileri hangel tarafından saklanmaz.</li>
<li><strong>Mutabakat:</strong> Toplanan ve aktarılan tutarlar dönemsel olarak mutabık kılınır.</li>
<li><strong>Erişim kontrolü ve loglama:</strong> Finansal kayıtlara erişim yetkilendirilir ve işlem kayıtları tutulur.</li>
<li><strong>AML/CFT taraması:</strong> Riskli işlemlerde 5549 sayılı Kanun ve 6415 sayılı Kanun kapsamında kaynak/kimlik doğrulaması yapılabilir.</li>
</ul>

<h4>5. Bağımsız Denetim ve Şeffaflık Raporu (Taahhüt)</h4>
<p>hangel, bağışçı güvenini en yüksek düzeye çıkarmak için aşağıdaki adımları <strong>taahhüt eder ve hedefler</strong>; bu adımlar henüz tamamlanmamıştır:</p>
<ul>
<li>Bağış gelir/giderlerine ilişkin <strong>yıllık şeffaflık raporu</strong> yayımlamayı amaçlar;</li>
<li>Uygun olgunluğa ulaştığında, bağımsız bir denetim kuruluşundan <strong>bağımsız dış denetim / güvence raporu</strong> almayı hedefler;</li>
<li>Raporlamasını kademeli olarak IFRS/ISA referanslarıyla uyumlu hâle getirmeyi taahhüt eder.</li>
</ul>
<p>hangel, bu metinde bağımsız denetimin yapılmış olduğunu beyan etmez; söz konusu süreçler tamamlandığında kamuoyu ayrıca ve açıkça bilgilendirilecektir.</p>

<h4>6. Mevcut Durum vs. Hedef</h4>
<p>Aşağıdaki tablo, bağış denetimi ve şeffaflık alanında mevcut durumu ve hedefleri gösterir:</p>

<table class="w-full border-collapse border border-gray-200 my-4">
<thead>
<tr>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Alan</th>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Mevcut Durum</th>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Hedef</th>
</tr>
</thead>
<tbody>
<tr>
<td class="border border-gray-200 p-2 text-sm">İç kontrol</td>
<td class="border border-gray-200 p-2 text-sm">Görevler ayrılığı, mutabakat ve loglama uygulanıyor</td>
<td class="border border-gray-200 p-2 text-sm">Kontrol setini belgelendirip olgunlaştırmayı amaçlar</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Bağımsız dış denetim</td>
<td class="border border-gray-200 p-2 text-sm">Henüz yapılmadı</td>
<td class="border border-gray-200 p-2 text-sm">Uygun olgunlukta bağımsız denetim almayı taahhüt eder</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Yıllık şeffaflık raporu</td>
<td class="border border-gray-200 p-2 text-sm">Toplulaştırılmış veriler kısmen paylaşılıyor</td>
<td class="border border-gray-200 p-2 text-sm">Kapsamlı yıllık rapor yayımlamayı hedefler</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">IFRS/ISA uyumu</td>
<td class="border border-gray-200 p-2 text-sm">Kavramsal referans alınıyor</td>
<td class="border border-gray-200 p-2 text-sm">Raporlamayı kademeli uyumlu hâle getirmeyi amaçlar</td>
</tr>
</tbody>
</table>

<h4>7. AML/CFT ve Kaynak Doğrulama</h4>
<p>Bağış gelirlerinin denetlenmesinde, kaynağın hukuka uygunluğu önemli bir kontrol boyutudur. hangel, 5549 sayılı Suç Gelirlerinin Aklanmasının Önlenmesi Hakkında Kanun ve 6415 sayılı Terörizmin Finansmanının Önlenmesi Hakkında Kanun'un ruhuna uygun olarak, risk temelli bir yaklaşım benimser. Riskli görülen bağış ve aktarımlarda kimlik/kaynak doğrulaması yapılabilir (5549 m.3); şüpheli görülen işlemler, mevzuatın öngördüğü ifşa yasağına uyularak yetkili mercilere bildirilebilir (5549 m.4) ve gerektiğinde askıya alınabilir. Bu kontroller, bağış denetiminin ayrılmaz bir parçası olarak ele alınır.</p>

<h4>8. Şeffaflık ve Kamuoyu Bilgilendirmesi</h4>
<p>hangel, bağış akışlarına ilişkin toplulaştırılmış verileri ve bu Politikadaki hedeflerin ilerleme durumunu kamuoyuyla paylaşmayı amaçlar. Tanıtım ve iletişimde "denetlenmiştir / sertifikalıdır" gibi gerçeği yansıtmayan ifadelerden kaçınılır; tamamlanmamış süreçler taahhüt olarak ifade edilir. hangel, hedeflerine ulaştıkça (örneğin bağımsız denetim tamamlandığında) bunu ayrıca ve açıkça duyurmayı, ilerleme kaydetmediği alanlarda ise durumu olduğu gibi raporlamayı taahhüt eder.</p>

<h4>9. İade, İtiraz ve Başvuru</h4>
<p>Bağışla ilgili itiraz ve iade talepleri, <em>Bağış ve Yardım Politikası</em> çerçevesinde değerlendirilir. Bu Politikaya ve raporlamaya ilişkin görüş, soru ve şikâyetler hangel destek kanallarına; veri koruma konuları <a href="mailto:kvkk@hangel.org">kvkk@hangel.org</a> adresine iletilebilir.</p>

<h4>10. Yürürlük</h4>
<p>Bu Politika, hangel tarafından yayımlandığı tarihte yürürlüğe girer; hedeflere ulaşıldıkça ve mevzuat geliştikçe güncellenir. Güncel sürüm platform üzerinde erişilebilir tutulur. Bu metindeki taahhütler, hangel'in kamuoyuna açık niyet beyanı niteliğinde olup, gerçekleştirilme durumları dönemsel olarak gözden geçirilir.</p>

<p class="text-xs text-muted-foreground"><em>Bu metin bilgilendirme amaçlıdır ve bağlayıcı nihai hukuki görüş niteliği taşımaz; yürürlük öncesi yetkili hukuk danışmanlığı önerilir.</em></p>
    `
  },
  {
    slug: 'finansal-seffaflik-ve-hesap-verebilirlik-politikasi',
    title: 'Finansal Şeffaflık ve Hesap Verebilirlik Politikası',
    content: `
      <h3>Finansal Şeffaflık ve Hesap Verebilirlik Politikası</h3>

<p>İşbu Politika, hangel platformunu işleten <strong>hangel AŞ</strong> tarafından, gelir ve gider kaynaklarının şeffaflığını, finansal kayıt düzenini ve paydaşlara karşı hesap verebilirlik ilkelerini düzenlemek amacıyla hazırlanmıştır. Bu metnin esas dili Türkçedir; uluslararası kurumsal yönetim çerçevelerine atıflar yabancı dilde ifadeler içerebilir.</p>

<h4>1. Amaç ve Kapsam</h4>
<p>Bu Politikanın amacı; hangel'in mali işlemlerinde doğruluk, izlenebilirlik, şeffaflık ve hesap verebilirlik standartlarını tanımlamaktır. Politika; platform gelirlerini (hizmet/işlem ücretleri, kurumsal işbirlikleri, bağış aktarım kanalı), giderleri ve bunların paydaşlara raporlanmasını kapsar. Hedef paydaşlar; bağışçılar, platform üzerindeki kuruluşlar, marka üyeleri, gönüllüler, çalışanlar ve düzenleyici merciler ile kamuoyudur.</p>

<h4>2. Yasal ve Çerçevesel Dayanak</h4>
<ul>
<li><strong>6102 sayılı Türk Ticaret Kanunu (TTK)</strong> — ticari defterlerin tutulması, finansal tabloların hazırlanması, muhasebe standartlarına uygunluk ve denetim hükümleri;</li>
<li><strong>213 sayılı Vergi Usul Kanunu (VUK)</strong> — defter, belge, kayıt düzeni, fatura ve belge saklama yükümlülükleri;</li>
<li><strong>6698 sayılı KVKK</strong> — finansal verilerin işlenmesinde veri koruma ilkeleri (m.4, m.5);</li>
<li>Uluslararası çerçeveler: <strong>OECD Principles of Corporate Governance</strong> (şeffaflık ve kamuyu aydınlatma ilkeleri) ve <strong>IFRS</strong> (International Financial Reporting Standards) — referans iyi uygulama setleri olarak benimsenir.</li>
</ul>

<h4>3. Mali Kayıt Düzeni ve İlkeleri</h4>
<p>hangel, mali işlemlerini 6102 sayılı TTK ve 213 sayılı VUK'a uygun olarak, eksiksiz, doğru ve zamanında kaydeder. Temel ilkeler şunlardır:</p>
<ul>
<li><strong>Belgeye dayalılık:</strong> Her gelir ve gider, geçerli bir belgeye (fatura, dekont, sözleşme) dayanır.</li>
<li><strong>Tam ve doğru kayıt:</strong> Kayıtlar, işlemin gerçek mahiyetini yansıtacak şekilde tutulur.</li>
<li><strong>Süreklilik ve tutarlılık:</strong> Muhasebe politikaları dönemler arası tutarlı uygulanır.</li>
<li><strong>İzlenebilirlik:</strong> Bağış aktarımları ile platform gelirleri ayrı izlenir ve mutabık kılınır.</li>
</ul>

<h4>4. Gelir ve Gider Kaynaklarının Şeffaflığı</h4>
<p>hangel, gelir ve gider kalemlerini paydaşların anlayabileceği biçimde sınıflandırır ve toplulaştırılmış olarak şeffaf hâle getirmeyi esas alır. Aşağıdaki tablo, başlıca kaynak kategorilerini gösterir:</p>

<table class="w-full border-collapse border border-gray-200 my-4">
<thead>
<tr>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Kategori</th>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Açıklama</th>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Tür</th>
</tr>
</thead>
<tbody>
<tr>
<td class="border border-gray-200 p-2 text-sm">Hizmet/işlem ücretleri</td>
<td class="border border-gray-200 p-2 text-sm">Platform altyapı ve aracılık hizmetinden alınan ücretler</td>
<td class="border border-gray-200 p-2 text-sm">Gelir</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Kurumsal işbirlikleri</td>
<td class="border border-gray-200 p-2 text-sm">Marka üyelikleri ve kurumsal destek</td>
<td class="border border-gray-200 p-2 text-sm">Gelir</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Bağış aktarımı</td>
<td class="border border-gray-200 p-2 text-sm">Kuruluşlara aktarılmak üzere toplanan tutarlar (geçici emanet niteliğinde)</td>
<td class="border border-gray-200 p-2 text-sm">Aktarım</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Personel ve operasyon</td>
<td class="border border-gray-200 p-2 text-sm">Ücretler, altyapı (Google Cloud/Firebase, Apple), idari giderler</td>
<td class="border border-gray-200 p-2 text-sm">Gider</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Ödeme/işlem maliyetleri</td>
<td class="border border-gray-200 p-2 text-sm">Ödeme sağlayıcı komisyonları ve banka masrafları</td>
<td class="border border-gray-200 p-2 text-sm">Gider</td>
</tr>
</tbody>
</table>

<p>Bağış aktarımı kalemi, hangel'in öz geliri olmayıp kuruluşlara aktarılmak üzere geçici olarak tahsil edilen tutarları ifade eder; bu ayrım kayıtlarda açıkça gösterilir.</p>

<h4>5. Paydaşlara Raporlama</h4>
<p>hangel, paydaşlarına karşı hesap verebilirliğini güçlendirmek için dönemsel finansal bilgilendirme yapmayı esas alır. Bağışçılar, bağışlarının izlenebilirliğine; kuruluşlar, kendilerine yapılan aktarımların mutabakatına; düzenleyici merciler, mevzuatın öngördüğü beyan ve raporlara erişebilir. OECD kurumsal yönetim ilkeleri doğrultusunda, esaslı mali bilgilerin zamanında ve doğru biçimde paylaşılması hedeflenir.</p>
<p>Raporlama, paydaş grubunun bilgi ihtiyacına göre katmanlandırılır: bireysel bağışçılara işlem ve aktarım düzeyinde bilgi; platformdaki kuruluşlara mutabakat ve aktarım dökümü; kamuoyuna toplulaştırılmış gelir/gider özetleri sunulur. Mali bilgilerin sunumunda anlaşılırlık esas alınır; teknik kalemler paydaşların kavrayabileceği biçimde açıklanır. Yanıltıcı, eksik veya seçmeci bilgilendirmeden kaçınılır.</p>

<h4>6. İç Kontrol ve Görevler Ayrılığı</h4>
<p>Mali süreçlerde hata ve usulsüzlük riskini azaltmak için görevler ayrılığı uygulanır; harcama, onay ve kayıt süreçleri ayrıştırılır. Finansal sistemlere erişim yetkilendirilir, işlemler loglanır ve dönemsel mutabakatlar yapılır. Bu kontroller, suç gelirlerinin aklanmasının önlenmesine ilişkin 5549 sayılı Kanun kapsamındaki hassasiyetlerle bütünlük içinde uygulanır. Belirli bir tutarın üzerindeki harcamalar çift onaya tabi tutulur; banka hesap hareketleri ile muhasebe kayıtları düzenli olarak karşılaştırılır. Tespit edilen tutarsızlıklar kayıt altına alınarak giderilir ve tekrarını önleyici tedbirler değerlendirilir.</p>

<h4>7. Vergisel ve Yasal Uyum</h4>
<p>hangel, 213 sayılı Vergi Usul Kanunu ve ilgili vergi mevzuatı kapsamındaki beyan, fatura düzeni ve belge saklama yükümlülüklerine uyar. Belgeler, mevzuatın öngördüğü asgari sürelerle saklanır. Bağış aktarımlarının vergisel niteliği (örneğin bağışçılar açısından bağış indirimine ilişkin hususlar) ilgili mevzuat çerçevesinde değerlendirilir; bu konularda bağışçılar kendi mali müşavirlerine başvurmaya yönlendirilir. hangel, kendi öz gelirleri ile emanet/aktarım niteliğindeki tutarları muhasebe ve vergi açısından ayrı ele alır.</p>

<h4>8. Denetim</h4>
<p>hangel, 6102 sayılı TTK'nın öngördüğü denetim yükümlülüklerine tabi olduğu ölçüde bunlara uyar. hangel, finansal raporlama olgunluğunu artırarak ileride bağımsız dış denetim ve genişletilmiş şeffaflık raporlamasına geçmeyi hedefler; bu hedeflere ilişkin ayrıntılar <em>Bağış Gelirlerinin Denetlenmesi ve Şeffaflık Raporu Politikası</em>nda yer alır. Bu metinde tamamlanmamış bir denetim, yapılmış gibi beyan edilmez.</p>

<h4>9. Şeffaflık ve Kamuoyu Bilgilendirmesi</h4>
<p>hangel, gelir/gider yapısına ilişkin toplulaştırılmış bilgileri kamuoyuyla paylaşmayı ve yanıltıcı mali beyanlardan kaçınmayı taahhüt eder. Mali bilgilerin sunumunda doğruluk, anlaşılırlık ve karşılaştırılabilirlik gözetilir.</p>

<h4>10. Başvuru ve İletişim</h4>
<p>Bu Politikaya ilişkin sorular, finansal şeffaflık talepleri ve şikâyetler hangel destek kanallarına iletilebilir. Finansal verilerin işlenmesine ilişkin veri koruma talepleri için <a href="mailto:kvkk@hangel.org">kvkk@hangel.org</a> adresi kullanılır.</p>

<h4>11. Yürürlük</h4>
<p>Bu Politika, hangel tarafından yayımlandığı tarihte yürürlüğe girer ve mevzuat ile uygulama gelişmeleri doğrultusunda gözden geçirilir. Güncel sürüm platform üzerinde erişilebilir tutulur. Esaslı değişiklikler, ilgili paydaşlara duyurulur.</p>

<p class="text-xs text-muted-foreground"><em>Bu metin bilgilendirme amaçlıdır ve bağlayıcı nihai hukuki görüş niteliği taşımaz; yürürlük öncesi yetkili hukuk danışmanlığı önerilir.</em></p>
    `
  },
  {
    slug: 'kar-dagitim-politikasi',
    title: 'Kâr Dağıtım Politikası',
    content: `
      <h3>Kâr Dağıtım Politikası</h3>

<p>İşbu Kâr Dağıtım Politikası, hangel platformunu işleten <strong>hangel AŞ</strong> tarafından, şirketin kâr dağıtımına ilişkin yaklaşımını ve toplumsal etki odaklı taahhüdünü ortaya koymak amacıyla hazırlanmıştır. Bu metin bir <strong>yol haritası belgesi</strong> niteliğindedir: "kârın misyona yönlendirilmesi" yaklaşımı, şirketin esas sözleşmesine ve yetkili organ kararlarına bağlı bir <em>taahhüt/hedef</em> olarak ifade edilir; kesinleşmiş bir hukuki statü olarak iddia edilmez. Bu metnin esas dili Türkçedir.</p>

<h4>1. Amaç ve Kapsam</h4>
<p>Bu Politikanın amacı; hangel AŞ'nin dönem kârının dağıtımına ilişkin ilkeleri, karar mekanizmasını ve toplumsal etki misyonuna yönelik niyetini şeffaf biçimde açıklamaktır. Politika; ortaklar (hissedarlar), yönetim organı ve paydaşlar açısından kâr dağıtımı sürecini kapsar. Politika, şirketin esas sözleşmesi ile birlikte yorumlanır; esas sözleşme ile bu metin arasında çelişki hâlinde esas sözleşme ve emredici kanun hükümleri esas alınır.</p>

<h4>2. Yasal Dayanak</h4>
<ul>
<li><strong>6102 sayılı Türk Ticaret Kanunu (TTK)</strong> — anonim şirketlerde kâr ve yedek akçeler, dağıtılabilir kârın belirlenmesi ve kâr payı dağıtımına ilişkin hükümler (yedek akçeler m.519 vd.; kâr payı ve kazanç payları m.507–m.509);</li>
<li><strong>TTK m.408/d</strong> — yıllık kâr üzerinde tasarruf, kâr payları ile kazanç paylarının belirlenmesi ve yedek akçenin kullanılmasına ilişkin kararların genel kurulun <em>devredilemez</em> yetkisinde olması;</li>
<li>Şirketin <strong>esas sözleşmesi</strong> ve <strong>genel kurul kararları</strong> — kâr dağıtımına ilişkin nihai ve bağlayıcı dayanak.</li>
</ul>
<p>Kâr dağıtımına ilişkin nihai yetki, TTK ve esas sözleşme çerçevesinde şirketin <strong>genel kuruluna</strong> aittir; bu Politika, anılan organın yetkisini sınırlamaz, yalnızca şirketin benimsediği yaklaşımı açıklar.</p>

<h4>3. Toplumsal Etki Odaklı Yaklaşım (Taahhüt)</h4>
<p>hangel, bir toplumsal etki platformu olarak, oluşan değerin azami ölçüde misyonuna (acil kan eşleştirme, bağış, gönüllülük ve toplumsal fayda) yönlendirilmesini benimser. Bu çerçevede şirket; dönem kârının önemli bir bölümünün dağıtılmayıp şirket bünyesinde tutularak misyon faaliyetlerine ve platformun geliştirilmesine yönlendirilmesini <strong>hedefler ve taahhüt eder</strong>. Bu yaklaşımın kalıcı ve bağlayıcı hâle gelmesi, esas sözleşmeye konulacak ilgili hükümlere ve genel kurulun bu yöndeki kararlarına bağlıdır. Bu metin, "hissedarlara hiç kâr payı dağıtılmadığı" yönünde tamamlanmış ve kanıtlanmış bir statü beyan etmez; söz konusu ilke bir <em>taahhüt</em> olarak çerçevelenir.</p>

<h4>4. Kâr Dağıtımına İlişkin İlkeler</h4>
<p>hangel'in kâr dağıtımına yaklaşımı, kâr odaklı bir paylaşımdan ziyade misyon odaklı bir değer üretimi anlayışına dayanır. Bu çerçevede benimsenen ilkeler şunlardır:</p>
<ul>
<li><strong>Kanuni yedek akçeler:</strong> TTK gereği ayrılması zorunlu yedek akçeler önceliklidir (m.519 vd.).</li>
<li><strong>Misyona tahsis önceliği:</strong> Dağıtılabilir kârın, esas sözleşme ve genel kurul kararı çerçevesinde misyon ve sürdürülebilirlik amaçlarına yönlendirilmesi hedeflenir.</li>
<li><strong>Şeffaflık:</strong> Kâr dağıtımına ilişkin kararlar ve gerekçeleri paydaşlarla şeffaf biçimde paylaşılmaya çalışılır.</li>
<li><strong>Sürdürülebilirlik:</strong> Dağıtım kararları, platformun mali sürekliliğini ve uzun vadeli toplumsal etki kapasitesini koruyacak biçimde alınır.</li>
<li><strong>Hukuka uygunluk:</strong> Hiçbir ilke, emredici TTK hükümlerinin ve esas sözleşmenin önüne geçecek biçimde yorumlanamaz.</li>
</ul>
<p>Bu ilkeler, şirketin oluşturduğu değerin mümkün olduğunca topluma geri dönmesini amaçlar; ancak bu yöndeki her uygulama, ilgili hesap dönemi için genel kurulun kararına ve esas sözleşmedeki düzenlemeye tabidir. Dolayısıyla bu metin, geçmiş veya gelecek dönemler için kesin bir dağıtım/dağıtmama taahhüdü değil, şirketin benimsediği <em>yönelimi</em> ifade eder.</p>

<h4>5. Karar Süreci</h4>
<p>Dönem kârı, finansal tabloların kesinleşmesinin ardından belirlenir. Yönetim organı, dağıtılabilir kâr ve yedek akçe durumunu değerlendirerek genel kurula öneri sunar. Kâr dağıtımına veya dağıtmamaya ilişkin nihai karar, TTK ve esas sözleşme çerçevesinde genel kurul tarafından alınır. Karar, mevzuatın öngördüğü şekil ve sürelerde uygulanır.</p>
<p>Karar süreci şu aşamalardan oluşur: (i) hesap döneminin kapanması ve finansal tabloların hazırlanması; (ii) kanuni yedek akçelerin ayrılması ve dağıtılabilir kârın hesaplanması (TTK m.519 vd.); (iii) yönetim organının dağıtım önerisini hazırlaması; (iv) genel kurulun öneriyi görüşüp karara bağlaması (TTK m.408/d ve m.509 çerçevesinde); (v) kararın uygulanması ve paydaş bilgilendirmesi. Her aşamada, şirketin misyon odaklı yaklaşımı ile mali sürdürülebilirliği birlikte gözetilir.</p>

<h4>6. Mevcut Durum vs. Hedef</h4>
<p>Aşağıdaki tablo, kâr dağıtımı yaklaşımına ilişkin mevcut durumu ve hedefleri gösterir:</p>

<table class="w-full border-collapse border border-gray-200 my-4">
<thead>
<tr>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Alan</th>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Mevcut Durum</th>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Hedef</th>
</tr>
</thead>
<tbody>
<tr>
<td class="border border-gray-200 p-2 text-sm">Esas sözleşme hükmü</td>
<td class="border border-gray-200 p-2 text-sm">Misyona tahsis ilkesi bağlayıcı hükümle teyit edilmiş bir kanıt olarak sunulmamaktadır</td>
<td class="border border-gray-200 p-2 text-sm">İlkeyi esas sözleşmeye açık hükümle yansıtmayı hedefler</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Kâr payı dağıtımı</td>
<td class="border border-gray-200 p-2 text-sm">Dağıtım kararı genel kurulun yetkisindedir</td>
<td class="border border-gray-200 p-2 text-sm">Kârı ağırlıklı olarak misyona yönlendirmeyi taahhüt eder</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Kamuya açıklama</td>
<td class="border border-gray-200 p-2 text-sm">Yaklaşım bu Politikada açıklanmıştır</td>
<td class="border border-gray-200 p-2 text-sm">Dağıtım kararlarını dönemsel olarak şeffaf raporlamayı amaçlar</td>
</tr>
</tbody>
</table>

<h4>7. Şeffaflık ve Paydaş Bilgilendirmesi</h4>
<p>hangel, kâr dağıtımı yaklaşımına ve bu Politikadaki taahhütlerin ilerlemesine ilişkin paydaşlarını bilgilendirmeyi amaçlar. İletişimde, henüz esas sözleşme/genel kurul kararıyla kesinleşmemiş hususların taahhüt olduğu açıkça belirtilir; yanıltıcı kesin statü ifadelerinden kaçınılır. Şirket, "sosyal girişim", "kâr amacı gütmeyen yaklaşım" gibi nitelemeleri kullanırken, bunların hukuki dayanağını ve kapsamını doğru biçimde açıklamaya özen gösterir. Misyona yönlendirilen kaynakların kullanımına ilişkin bilgilendirme, <em>Finansal Şeffaflık ve Hesap Verebilirlik Politikası</em> çerçevesinde sağlanır.</p>

<h4>8. İlişkili Politikalar</h4>
<p>Bu Politika; <em>Finansal Şeffaflık ve Hesap Verebilirlik Politikası</em> ve <em>Bağış Gelirlerinin Denetlenmesi ve Şeffaflık Raporu Politikası</em> ile birlikte uygulanır. Kâr dağıtımına ilişkin sorular hangel'in kurumsal iletişim kanallarına iletilebilir; veri koruma konuları için <a href="mailto:kvkk@hangel.org">kvkk@hangel.org</a> adresi kullanılır.</p>

<h4>9. Yürürlük</h4>
<p>Bu Politika, hangel tarafından yayımlandığı tarihte yürürlüğe girer ve esas sözleşme değişiklikleri ile genel kurul kararları doğrultusunda güncellenir. Emredici kanun hükümleri ve esas sözleşme her hâlükârda önceliklidir.</p>

<p class="text-xs text-muted-foreground"><em>Bu metin bilgilendirme amaçlıdır ve bağlayıcı nihai hukuki görüş niteliği taşımaz; yürürlük öncesi yetkili hukuk danışmanlığı önerilir.</em></p>
    `
  },
  {
    slug: 'ucret-politikasi',
    title: 'Ücret Politikası',
    content: `
      <h3>Ücret Politikası</h3>

<p>İşbu Ücret Politikası, hangel platformunu işleten <strong>hangel AŞ</strong> tarafından, çalışanlarına yönelik adil, şeffaf ve ayrımcılık içermeyen bir ücretlendirme sistemini düzenlemek amacıyla hazırlanmıştır. Bu metnin esas dili Türkçedir; uluslararası çerçevelere atıflar yabancı dilde ifadeler içerebilir.</p>

<h4>1. Amaç ve Kapsam</h4>
<p>Bu Politikanın amacı; hangel AŞ bünyesinde uygulanan ücret baremini, ücretin belirlenme ilkelerini, eşit işe eşit ücret yaklaşımını ve ücret şeffaflığına ilişkin esasları tanımlamaktır. Politika; tam zamanlı, yarı zamanlı ve belirli süreli iş sözleşmesiyle çalışan tüm personeli kapsar. Stajyer ve hizmet alımı ilişkileri, ilgili mevzuat ve sözleşme hükümleri saklı kalmak kaydıyla bu Politikanın adalet ve şeffaflık ilkelerinden ilham alır.</p>

<h4>2. Yasal Dayanak</h4>
<ul>
<li><strong>4857 sayılı İş Kanunu</strong> — ücret, ücretin ödenmesi, eşit davranma ilkesi (m.5), ücret kesintileri ve fazla çalışma hükümleri (m.32, m.41 vd.);</li>
<li><strong>Türkiye Cumhuriyeti Anayasası m.55</strong> — "Ücrette adalet sağlanması"; ücretin emeğin karşılığı olduğu ve devletin çalışanların yaptıkları işe uygun adil bir ücret elde etmeleri için gerekli tedbirleri aldığı ilkesi;</li>
<li><strong>Anayasa m.10</strong> — kanun önünde eşitlik;</li>
<li>Asgari ücret mevzuatı — <strong>Asgari Ücret Yönetmeliği</strong> ve Asgari Ücret Tespit Komisyonu kararları;</li>
<li><strong>6701 sayılı Türkiye İnsan Hakları ve Eşitlik Kurumu Kanunu</strong> — istihdamda ayrımcılık yasağı;</li>
<li>Uluslararası referans: <strong>ILO</strong> (Uluslararası Çalışma Örgütü) "eşit değerde iş için eşit ücret" ilkesi.</li>
</ul>

<h4>3. Ücretlendirme İlkeleri</h4>
<p>hangel'in ücret sistemi aşağıdaki temel ilkelere dayanır:</p>
<ul>
<li><strong>Adalet:</strong> Ücret, yapılan işin niteliği, sorumluluk düzeyi ve gerektirdiği yetkinliklerle orantılıdır (Anayasa m.55).</li>
<li><strong>Eşitlik ve ayrımcılık yasağı:</strong> Cinsiyet, yaş, etnik köken, din, engellilik veya benzeri temellerde ücret ayrımcılığı yapılmaz (İş K. m.5, Anayasa m.10, 6701 sayılı Kanun).</li>
<li><strong>Eşit işe eşit ücret:</strong> Eşit veya eşit değerde iş yapan çalışanlara eşit ücret uygulanır.</li>
<li><strong>Şeffaflık:</strong> Ücret yapısı, bareme dayalı ve açıklanabilir kriterlere oturtulur.</li>
<li><strong>Yasal asgari güvence:</strong> Hiçbir çalışanın ücreti, yürürlükteki brüt asgari ücretin altında olamaz.</li>
</ul>

<h4>4. Ücret Baremi ve Bileşenleri</h4>
<p>Ücretler, görev kademesi ve sorumluluk düzeyine göre belirlenen bir <strong>barem</strong> çerçevesinde tespit edilir. Aşağıdaki tablo, ücret bileşenlerinin yapısını göstermektedir (tutarlar örnek olmayıp yapıyı tanımlar):</p>

<table class="w-full border-collapse border border-gray-200 my-4">
<thead>
<tr>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Bileşen</th>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Açıklama</th>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Belirleyici Kriter</th>
</tr>
</thead>
<tbody>
<tr>
<td class="border border-gray-200 p-2 text-sm">Temel ücret</td>
<td class="border border-gray-200 p-2 text-sm">Görev kademesine bağlı taban ücret</td>
<td class="border border-gray-200 p-2 text-sm">Pozisyon, sorumluluk, yetkinlik</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Kıdem/deneyim</td>
<td class="border border-gray-200 p-2 text-sm">İş deneyimi ve hizmet süresine bağlı artış</td>
<td class="border border-gray-200 p-2 text-sm">Deneyim yılı, performans</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Yasal ödemeler</td>
<td class="border border-gray-200 p-2 text-sm">Fazla çalışma, hafta tatili, genel tatil ücretleri</td>
<td class="border border-gray-200 p-2 text-sm">İş K. m.41 vd.</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Yan haklar</td>
<td class="border border-gray-200 p-2 text-sm">Yemek, yol vb. (uygulandığı ölçüde)</td>
<td class="border border-gray-200 p-2 text-sm">Şirket uygulaması</td>
</tr>
</tbody>
</table>

<h4>5. Ücretin Belirlenmesi ve Gözden Geçirilmesi</h4>
<p>Ücretler işe alımda barem ve pozisyon kriterlerine göre belirlenir. Ücretler, enflasyon, asgari ücret değişiklikleri, performans ve şirketin mali durumu dikkate alınarak dönemsel olarak gözden geçirilir. Asgari ücret artışları, yürürlükteki mevzuata uygun biçimde derhal yansıtılır. Ücret artışlarında objektif ve önceden bilinen kriterler esas alınır; keyfî farklılaştırmadan kaçınılır.</p>
<p>Ücret belirleme ve gözden geçirme sürecinde, aynı kademedeki çalışanlar arasındaki ücret farklarının yalnızca objektif kriterlerle (deneyim, performans, ek sorumluluk) açıklanabilir olması esas alınır. hangel, ücret yapısında zaman içinde oluşabilecek dengesizlikleri tespit etmek için dönemsel iç değerlendirmeler yapmayı amaçlar ve tespit edilen haksız farkları gidermeyi hedefler. Performans değerlendirmeleri, önceden bildirilen, ölçülebilir ve ayrımcılık içermeyen kriterlere dayanır.</p>

<h4>6. Eşit İşe Eşit Ücret ve Ayrımcılık Yasağı</h4>
<p>hangel, 4857 sayılı İş Kanunu m.5 ve Anayasa m.10 doğrultusunda, aynı veya eşit değerde işi yapan çalışanlar arasında cinsiyet başta olmak üzere hiçbir temelde ücret ayrımcılığı yapmaz. Ücret farklılıkları yalnızca; pozisyon, sorumluluk, deneyim, performans gibi objektif ve iş ile ilgili kriterlere dayanabilir. Ayrımcılık iddiaları, 6701 sayılı Kanun çerçevesinde ciddiyetle incelenir.</p>

<h4>7. Ücretin Ödenmesi ve Gizlilik</h4>
<p>Ücretler, 4857 sayılı İş Kanunu m.32 uyarınca Türk Lirası olarak ve banka aracılığıyla, en geç ayda bir kez düzenli olarak ödenir. Çalışanlara ücret bordrosu sağlanır. Çalışanların ücret bilgileri, kişisel veri niteliğinde olup 6698 sayılı KVKK'ya uygun biçimde gizli tutulur ve yalnızca yetkili personel tarafından, ilgili amaçla işlenir.</p>

<h4>8. Şeffaflık</h4>
<p>hangel, ücret baremi ve ücret belirleme kriterlerinin yapısını çalışanlarına açıklanabilir biçimde sunmayı esas alır. Bu şeffaflık, bireysel ücretlerin gizliliğini ihlal etmeyecek şekilde, barem ve kriter düzeyinde sağlanır. Ücret sistemine ilişkin çalışan soruları ve itirazları için kurumsal İK kanalları kullanılır. Şeffaflık ilkesi; çalışanların hangi kriterlere göre hangi kademede yer aldığını ve ücretlerinin nasıl belirlendiğini anlamalarını mümkün kılar. Bu yaklaşım, ücret adaletine ilişkin güveni güçlendirmeyi ve ayrımcılık algısının önüne geçmeyi amaçlar.</p>

<h4>9. Sosyal Haklar ve Yasal Güvenceler</h4>
<p>Çalışanların yıllık ücretli izin, fazla çalışma ücreti, hafta tatili ve genel tatil ücretleri ile diğer yasal hakları, 4857 sayılı İş Kanunu hükümlerine uygun olarak sağlanır. Sosyal güvenlik primleri, 5510 sayılı Sosyal Sigortalar ve Genel Sağlık Sigortası Kanunu uyarınca gerçek ücret üzerinden eksiksiz yatırılır. hangel, ücret dışındaki yan hakların da ayrımcılık içermeyecek biçimde uygulanmasını esas alır.</p>

<h4>10. İtiraz ve Başvuru</h4>
<p>Çalışan; ücretine, ücret hesabına veya ücret ayrımcılığına ilişkin itirazlarını İK birimine iletebilir. İtirazlar objektif kriterlerle değerlendirilir ve makul sürede yanıtlanır. Çalışan, yasal haklarını (iş mahkemeleri, ilgili kurumlara başvuru) her zaman saklı tutar. Ücret verilerinin işlenmesine ilişkin veri koruma talepleri için <a href="mailto:kvkk@hangel.org">kvkk@hangel.org</a> adresi kullanılır.</p>

<h4>11. Yürürlük</h4>
<p>Bu Politika, hangel tarafından yayımlandığı tarihte yürürlüğe girer ve mevzuat değişiklikleri ile uygulama ihtiyaçları doğrultusunda gözden geçirilir. Emredici iş hukuku hükümleri her hâlükârda önceliklidir. Esaslı değişiklikler çalışanlara duyurulur.</p>

<p class="text-xs text-muted-foreground"><em>Bu metin bilgilendirme amaçlıdır ve bağlayıcı nihai hukuki görüş niteliği taşımaz; yürürlük öncesi yetkili hukuk danışmanlığı önerilir.</em></p>
    `
  },
  {
    slug: 'abd-irs-bagis-beyani',
    title: 'ABD IRS Uyumlu Bağış Beyanı',
    content: `
      <h3>ABD IRS Uyumlu Bağış Beyanı</h3>

<p>İşbu ABD IRS Uyumlu Bağış Beyanı, hangel platformunu işleten <strong>hangel AŞ</strong> tarafından, Amerika Birleşik Devletleri (ABD) vergi mükellefi bağışçıların hangel üzerinden yapacakları bağışların ABD federal vergi mevzuatı karşısındaki durumunu açık ve doğru biçimde ortaya koymak amacıyla hazırlanmıştır. Bu Beyanın temel amacı, herhangi bir yanlış beklentiyi önlemektir. Bu metnin esas dili Türkçedir; ABD mevzuatına atıflar İngilizce ifadeler içerebilir. Bu Beyan vergi danışmanlığı niteliği taşımaz.</p>

<h4>1. Önemli Uyarı: hangel Bir ABD 501(c)(3) Kuruluşu DEĞİLDİR</h4>
<p>Açıkça beyan edilir ki <strong>hangel AŞ, ABD İç Gelir Kanunu (Internal Revenue Code — IRC) §501(c)(3) kapsamında vergiden muaf bir ABD kuruluşu DEĞİLDİR.</strong> hangel, Türkiye'de kurulu bir anonim şirkettir. Bu nedenle, ABD vergi mükelleflerinin doğrudan hangel'e yaptıkları bağışlar, kural olarak ABD federal gelir vergisi beyanında <strong>indirilebilir bağış (deductible charitable contribution) niteliği taşımaz.</strong> hangel, hiçbir bağışçıya otomatik bir ABD vergi indirimi vaat etmez ve böyle bir izlenim yaratmaktan kaçınır.</p>

<h4>2. Yasal Dayanak (ABD Federal Mevzuatı)</h4>
<p>Bu Beyan aşağıdaki ABD federal düzenlemelerine dayanır:</p>
<ul>
<li><strong>IRC §501(c)(3)</strong> — vergiden muaf hayır kuruluşlarının (charitable organizations) tanımı ve şartları;</li>
<li><strong>IRC §170</strong> — hayır amaçlı bağışların gelir vergisinden indirilmesi; bu indirim kural olarak yalnızca ABD'de kurulu uygun kuruluşlara yapılan bağışlar için geçerlidir;</li>
<li><strong>IRS Publication 526 (Charitable Contributions)</strong> — indirilebilir bağışların kapsamı, kayıt tutma ve sınırlamalar. Publication 526'ya göre, yabancı (ABD dışında kurulu) kuruluşlara yapılan bağışlar genel olarak indirilemez; sınırlı istisnalar yalnızca ABD'nin Kanada, Meksika ve İsrail ile yaptığı vergi anlaşmaları kapsamında ve kendi şartlarıyla söz konusu olabilir.</li>
</ul>

<h4>3. ABD Vergi İndiriminin Koşullu Olarak Mümkün Olabileceği Hâller</h4>
<p>ABD vergi mükellefi bir bağışçının hangel'in desteklediği amaçlara yaptığı bir bağıştan ABD vergi indirimi elde edebilmesi, ancak aşağıdaki gibi <strong>uygun bir yapı aracılığıyla ve ilgili kuruluşun kendi belgelendirmesiyle</strong> mümkün olabilir:</p>

<table class="w-full border-collapse border border-gray-200 my-4">
<thead>
<tr>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Olası Yapı</th>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Açıklama</th>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">İndirim Koşulu</th>
</tr>
</thead>
<tbody>
<tr>
<td class="border border-gray-200 p-2 text-sm">ABD 501(c)(3) mali sponsor (fiscal sponsor)</td>
<td class="border border-gray-200 p-2 text-sm">ABD'de kurulu, muafiyetli bir kamu yararına kuruluşun bağışı kabul edip amaca yönlendirmesi</td>
<td class="border border-gray-200 p-2 text-sm">Bağışın hukuken o ABD kuruluşuna yapılmış sayılması ve makbuzun o kuruluşça düzenlenmesi</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">"Friends of" / bağlı ABD kuruluşu</td>
<td class="border border-gray-200 p-2 text-sm">ABD'de kurulmuş, bağımsız karar yetkisine sahip muafiyetli bir destek kuruluşu</td>
<td class="border border-gray-200 p-2 text-sm">Kuruluşun kendi takdiriyle fonları yönlendirmesi ve indirim belgesini düzenlemesi</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Bağışçı yönlendirmeli fon (donor-advised fund)</td>
<td class="border border-gray-200 p-2 text-sm">ABD'de yerleşik bir DAF aracılığıyla uygun kuruluşlara dağıtım</td>
<td class="border border-gray-200 p-2 text-sm">DAF sağlayıcısının uygunluk ve belgelendirme kurallarına tabi</td>
</tr>
</tbody>
</table>

<p>Bu yapıların hiçbirinde indirim hakkı hangel tarafından sağlanmaz veya garanti edilmez; indirim, yalnızca ilgili ABD muafiyetli kuruluşun düzenleyeceği geçerli bir bağış makbuzu ve o kuruluşun IRS nezdindeki statüsüyle doğar.</p>

<h4>4. Yabancı Kuruluşlara Bağışta Genel Kural</h4>
<p>IRS Publication 526 ve ilgili IRC hükümleri uyarınca, ABD federal gelir vergisi açısından indirilebilir bağış kural olarak yalnızca ABD'de kurulu uygun kuruluşlara (qualified domestic organizations) yapılan bağışlarla sınırlıdır. ABD dışında kurulu kuruluşlara doğrudan yapılan bağışlar, dar kapsamlı vergi anlaşması istisnaları (ABD–Kanada, ABD–Meksika ve ABD–İsrail anlaşmaları ve bunların kendi koşulları) dışında, genel olarak indirilemez. hangel Türkiye'de kurulu olduğundan bu genel kural hangel'e doğrudan yapılan bağışlar için geçerlidir. Ayrıca, bir bağışın ABD'deki muafiyetli bir kuruluş üzerinden geçirilmesi tek başına yeterli olmayıp; o kuruluşun fonlar üzerinde gerçek takdir ve kontrol yetkisine sahip olması (conduit/pass-through olmaması) gerekir.</p>

<h4>5. Bağışçı Hakları ve Bilgilendirme</h4>
<p>hangel, ABD'li bağışçıları, bağış yapmadan önce ilgili yapının ABD vergi statüsü hakkında bilgilendirmeyi taahhüt eder. Bağışçı, bağışının indirilebilir olup olmadığını kendi vergi danışmanına danışarak teyit etmelidir. hangel, indirim belgesi (makbuz) düzenleme yetkisine ABD mevzuatı uyarınca sahip olmadığı durumlarda bunu açıkça belirtir. hangel, "vergiden düşülebilir", "tax-deductible" gibi ifadeleri yalnızca gerçek ve geçerli bir ABD muafiyet yapısının varlığında ve o yapının belgelendirmesi çerçevesinde kullanır; aksi hâlde bu tür ifadelerden kaçınır.</p>

<h4>6. Fon Kullanımı ve Şeffaflık</h4>
<p>ABD kaynaklı bağışlar dahil tüm bağışlar, hangel'in fon kullanımı ve etik bağış ilkelerine uygun olarak amaca tahsis edilir ve izlenebilir biçimde raporlanır. hangel, kaynak doğrulama ve aklama önleme yükümlülüklerini, AML/CFT uyum beyanında belirtilen ilkeler ve ilgili mevzuat çerçevesinde yerine getirir.</p>

<h4>7. AML/CFT ve Sınır Ötesi Aktarım</h4>
<p>Sınır ötesi bağışlarda hangel, kaynak doğrulama ve yaptırım taraması ilkelerini gözetir. Türkiye tarafında 5549 sayılı Suç Gelirlerinin Aklanmasının Önlenmesi Hakkında Kanun (MASAK) ve 6415 sayılı Terörizmin Finansmanının Önlenmesi Hakkında Kanun ile FATF tavsiyeleri esas alınır.</p>

<h4>8. Mevcut Durum ve Hedefler</h4>
<table class="w-full border-collapse border border-gray-200 my-4">
<thead>
<tr>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Alan</th>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Mevcut Durum</th>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Hedef</th>
</tr>
</thead>
<tbody>
<tr>
<td class="border border-gray-200 p-2 text-sm">ABD muafiyet statüsü</td>
<td class="border border-gray-200 p-2 text-sm">hangel bir ABD 501(c)(3) kuruluşu değildir</td>
<td class="border border-gray-200 p-2 text-sm">ABD'li bağışçılar için uygun bir mali sponsor / partner yapı değerlendirmeyi hedefler</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">İndirim belgesi</td>
<td class="border border-gray-200 p-2 text-sm">hangel ABD indirim makbuzu düzenleyemez</td>
<td class="border border-gray-200 p-2 text-sm">Uygun ABD partner aracılığıyla belgelendirme süreci kurmayı amaçlar</td>
</tr>
</tbody>
</table>

<h4>9. Kayıt Tutma ve Bağışçı Sorumluluğu</h4>
<p>ABD vergi mükellefi bir bağışçının, indirilebilir nitelikteki bir bağış için indirim talep edebilmesi, IRS Publication 526'da belirtilen kayıt tutma kurallarına uymasına bağlıdır. Bu kapsamda; nakdî bağışlarda banka kaydı veya kuruluşun yazılı beyanı, belirli tutarın üzerindeki bağışlarda kuruluşça düzenlenen çağdaş yazılı teyit (contemporaneous written acknowledgment) ve ayrı IRS form yükümlülükleri söz konusu olabilir. Bu belgelerin sağlanması, indirim hakkı doğuran ABD muafiyetli kuruluşun sorumluluğundadır; hangel, böyle bir yapı bulunmadığında bu belgeleri düzenleyemez. Bağışçı, indirim talebinin nihai uygunluğunu ve gerekli belgeleri kendi vergi danışmanı ile teyit etmekle yükümlüdür. Bu Beyan, hangel'in herhangi bir vergi sonucunu garanti ettiği anlamına gelmez.</p>

<h4>10. Yanıltıcı İfadelerden Kaçınma ve Bağışçı Güveni</h4>
<p>hangel, ABD'li bağışçıların güvenini korumayı önceler ve bu nedenle vergi avantajına ilişkin yanıltıcı ya da koşulsuz ifadelerden özenle kaçınır. Platform iletişimlerinde, ABD vergi indiriminin yalnızca uygun bir ABD muafiyetli yapı aracılığıyla ve o yapının belgelendirmesiyle mümkün olabileceği açıkça belirtilir; hangel'in kendisinin böyle bir indirim sağlamadığı vurgulanır. hangel, bağışçıların bilinçli karar vermesini sağlamak amacıyla, varsa kullanılan mali sponsor veya partner yapının kimliğini ve statüsünü şeffaf biçimde paylaşmayı hedefler. Bu yaklaşım, hem ABD federal mevzuatına saygıyı hem de hangel'in genel etik bağış ilkelerini yansıtır.</p>

<h4>11. Yürürlük</h4>
<p>Bu Beyan, hangel tarafından yayımlandığı tarihte yürürlüğe girer ve ABD mevzuatındaki gelişmelere göre güncellenir. Beyana ilişkin sorular ile veri koruma konuları için <a href="mailto:privacy@hangel.org">privacy@hangel.org</a> adresine başvurulabilir. Bu Beyan, bireysel vergi danışmanlığının yerine geçmez.</p>

<p class="text-xs text-muted-foreground"><em>Bu metin bilgilendirme amaçlıdır ve bağlayıcı nihai hukuki görüş niteliği taşımaz; yürürlük öncesi yetkili hukuk danışmanlığı önerilir.</em></p>
    `
  },
  {
    slug: 'cevresel-sorumluluk-politikasi',
    title: 'Çevresel Sorumluluk ve Sürdürülebilirlik Politikası',
    content: `
      <h3>Çevresel Sorumluluk ve Sürdürülebilirlik Politikası</h3>

<p>İşbu Çevresel Sorumluluk ve Sürdürülebilirlik Politikası, hangel platformunu işleten <strong>hangel AŞ</strong> tarafından, faaliyetlerinin çevresel ayak izini ölçmek, azaltmak ve iklim krizine karşı sorumlu bir aktör olarak hareket etmek amacıyla hazırlanmıştır. hangel; acil kan talebi/eşleştirme, bağış, gönüllülük ve toplumsal etki hizmetleri sunan, dijital öncelikli bir sosyal girişimdir. Bu nedenle çevresel etkisinin önemli bir bölümü, fiziksel ofis kullanımı ile bulut tabanlı dijital altyapıdan (Google Cloud / Firebase, Apple) kaynaklanan dolaylı enerji tüketiminden oluşmaktadır. Bu metnin esas dili Türkçedir; uluslararası çerçevelere yapılan atıflar İngilizce ifadeler içerebilir.</p>

<p><strong>Önemli not:</strong> Bu politikada yer alan <strong>karbon nötrlük</strong> ve emisyon azaltımına ilişkin ifadeler, ulaşılmış bir statü değil, hangel'in <strong>taahhüt ettiği hedefler ve yol haritası</strong>dır. hangel bu belgede sahip olmadığı bir çevresel sertifikayı veya doğrulanmış emisyon dengelemesini var gibi göstermez.</p>

<h4>1. Amaç</h4>
<p>Bu Politikanın amacı; hangel'in çevresel etkilerini şeffaf biçimde tanımlamak, ölçülebilir azaltım hedefleri koymak, sürdürülebilirlik ilkelerini kurumsal karar süreçlerine entegre etmek ve paydaşlarına (kullanıcılar, gönüllüler, bağışçılar, iş ortakları ve kamuoyu) karşı çevresel hesap verebilirliği sağlamaktır. Politika, iklim eylemini hangel'in toplumsal etki misyonunun ayrılmaz bir parçası olarak konumlandırır.</p>

<h4>2. Kapsam</h4>
<p>Bu Politika; hangel AŞ'nin tüm fiziksel ofis faaliyetlerini, dijital altyapı ve bulut hizmeti kullanımını, satın alma ve tedarik kararlarını, çalışan ve gönüllü uygulamalarını ve iş ortaklarıyla ilişkilerini kapsar. Politika, hangel'in doğrudan kontrolündeki faaliyetler (ofis enerjisi, ekipman, atık) ile dolaylı etki alanlarını (bulut altyapı enerji tüketimi, tedarik zinciri, çalışan ulaşımı) birlikte ele alır.</p>

<h4>3. Uyulan ve Hedeflenen Çerçeveler</h4>
<p>hangel'in çevresel yaklaşımı aşağıdaki uluslararası çerçeve ve standartlardan ilham alır ve bunlarla hizalanmayı hedefler:</p>
<ul>
<li><strong>Paris İklim Anlaşması (2015)</strong> — Anlaşmanın 2. maddesinde belirlenen, küresel sıcaklık artışını sanayi öncesi döneme kıyasla 2°C'nin "belirgin biçimde altında" tutma ve 1,5°C ile sınırlama hedefiyle uyumlu hareket etme taahhüdü;</li>
<li><strong>BM Sürdürülebilir Kalkınma Amacı 13 (SKA 13 — İklim Eylemi)</strong> ve bağlantılı olarak SKA 12 (Sorumlu Üretim ve Tüketim) ile hizalama;</li>
<li><strong>GHG Protocol (Greenhouse Gas Protocol — Corporate Accounting and Reporting Standard)</strong> — emisyonların Kapsam 1 (doğrudan), Kapsam 2 (satın alınan enerji) ve Kapsam 3 (diğer dolaylı, dijital altyapı dâhil) sınıflandırmasıyla ölçülmesi metodolojisi;</li>
<li><strong>ISO 14001:2015</strong> (Çevre Yönetim Sistemleri) — yalnızca <em>referans</em> çerçeve olarak benimsenmiştir; hangel bu standartta <strong>sertifikalı değildir</strong> ve sertifikasyonu bir yol haritası hedefi olarak değerlendirmektedir.</li>
</ul>
<p>Bu çerçeveler hangel'in bir akreditasyonu veya tescilli emisyon dengelemesi olduğu anlamına gelmez; metodolojik referans ve hedef setini oluşturur.</p>

<h4>4. Mevcut Önlemler ve Hedefler</h4>
<p>hangel, dijital öncelikli yapısının çevresel avantajlarını korurken ölçülebilir azaltım hedeflerine doğru ilerlemeyi taahhüt eder. Aşağıdaki tablo mevcut durumu ve hedefleri ayrı ayrı gösterir:</p>

<table class="w-full border-collapse border border-gray-200 my-4">
<thead>
<tr>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Alan</th>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Mevcut Durum</th>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Hedef</th>
</tr>
</thead>
<tbody>
<tr>
<td class="border border-gray-200 p-2 text-sm">Karbon ayak izi ölçümü</td>
<td class="border border-gray-200 p-2 text-sm">Henüz tam kapsamlı doğrulanmış emisyon envanteri bulunmamaktadır; ofis enerjisine ilişkin temel veriler izlenmektedir</td>
<td class="border border-gray-200 p-2 text-sm">GHG Protocol Kapsam 1-2-3 metodolojisiyle yıllık emisyon envanteri çıkarmayı hedefler</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Dijital altyapı</td>
<td class="border border-gray-200 p-2 text-sm">Google Cloud / Firebase ve Apple altyapısı kullanılmakta; bu sağlayıcıların yenilenebilir enerji taahhütlerinden faydalanılmaktadır</td>
<td class="border border-gray-200 p-2 text-sm">Düşük karbonlu bölge seçimi, kaynak optimizasyonu ve gereksiz veri/işlem yükünün azaltılmasını taahhüt eder</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Ofis ayak izi</td>
<td class="border border-gray-200 p-2 text-sm">Kâğıtsız/dijital iş akışları benimsenmiş, uzaktan/hibrit çalışma ile ulaşım emisyonu sınırlanmıştır</td>
<td class="border border-gray-200 p-2 text-sm">Enerji verimli ekipman, geri dönüşüm ve atık azaltımını yaygınlaştırmayı amaçlar</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Karbon nötrlük</td>
<td class="border border-gray-200 p-2 text-sm">Henüz ulaşılmamıştır; doğrulanmış bir dengeleme programı bulunmamaktadır</td>
<td class="border border-gray-200 p-2 text-sm">Önce azalt-sonra dengele ilkesiyle, kademeli bir takvimde karbon nötrlüğü <strong>hedef</strong> olarak benimser</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Tedarik ve satın alma</td>
<td class="border border-gray-200 p-2 text-sm">Sürdürülebilirlik kriterleri henüz resmî bir politikaya bağlanmamıştır</td>
<td class="border border-gray-200 p-2 text-sm">Tedarikçi seçiminde çevresel kriterleri ölçüt hâline getirmeyi taahhüt eder</td>
</tr>
</tbody>
</table>

<h4>5. Dijital Sürdürülebilirlik ve Tedarik İlkeleri</h4>
<p>Dijital öncelikli bir platform olarak hangel'in çevresel etkisinin önemli kısmı, veri işleme ve depolamaya bağlı enerji tüketiminden (GHG Protocol Kapsam 3) kaynaklanır. hangel bu alanda şu ilkeleri benimser: gereksiz veri saklamanın azaltılması ve KVKK m.7 uyarınca saklama süresi dolan verilerin imhası yoluyla depolama yükünün düşürülmesi; verimli sorgu ve işlem tasarımıyla hesaplama kaynağı israfının önlenmesi; yenilenebilir enerji taahhüdü güçlü bulut bölgelerinin tercih edilmesi; ve gereksiz bildirim/iletişim trafiğinin sınırlanması. Satın alma ve tedarik kararlarında hangel; ürün ve hizmetlerin yaşam döngüsü etkisini, tedarikçinin çevresel taahhütlerini ve ekipmanın enerji verimliliği ile onarılabilirlik/geri dönüştürülebilirlik özelliklerini değerlendirmeyi hedefler. hangel ayrıca, çalışan ve gönüllülerinde çevresel farkındalığı artırmayı ve düşük etkili dijital alışkanlıkları teşvik etmeyi amaçlar.</p>

<h4>6. Geri Bildirim ve Şikâyet Kanalı</h4>
<p>Paydaşlar; hangel'in çevresel uygulamalarına ilişkin görüş, öneri, eleştiri ve şikâyetlerini <a href="mailto:privacy@hangel.org">privacy@hangel.org</a> üzerinden iletebilir. Çevresel etkiye ilişkin gelen her bildirim değerlendirilir ve mümkün olduğunda iyileştirme süreçlerine dâhil edilir. hangel, "yeşil aklama" (greenwashing) niteliğindeki abartılı veya doğrulanamayan beyanlardan kaçınmayı ilke edinir.</p>

<h4>7. İzleme ve Raporlama</h4>
<p>hangel; çevresel hedeflerine ilişkin ilerlemeyi periyodik olarak gözden geçirmeyi ve gerçekleştirebildiği ölçüde kamuoyuna şeffaf biçimde raporlamayı hedefler. Raporlamada GHG Protocol sınıflandırması ve SKA 13 göstergeleri referans alınacaktır. Henüz ulaşılmamış hedefler "hedef/devam eden" olarak açıkça işaretlenir; tamamlanmış adımlar ile devam eden taahhütler birbirinden ayrı sunulur. hangel, bağımsız doğrulamaya tabi olmayan verilerin "doğrulanmış" gibi sunulmayacağını taahhüt eder.</p>

<h4>8. Yürürlük</h4>
<p>Bu Politika, hangel tarafından yayımlandığı tarihte yürürlüğe girer ve en az yılda bir kez veya ilgili mevzuat/standartlardaki güncellemelere göre gözden geçirilir. Politikanın uygulanmasında işlenen kişisel veriler 6698 sayılı KVKK'ya uygun olarak işlenir ve sorular için <a href="mailto:kvkk@hangel.org">kvkk@hangel.org</a> adresine başvurulabilir.</p>

<p class="text-xs text-muted-foreground"><em>Bu metin bilgilendirme amaçlıdır ve bağlayıcı nihai hukuki görüş niteliği taşımaz; yürürlük öncesi yetkili hukuk danışmanlığı önerilir.</em></p>
    `
  },
  {
    slug: 'aml-cft-uyum-beyani',
    title: 'AML / CFT Uyum Beyanı',
    content: `
      <h3>AML / CFT Uyum Beyanı</h3>

<p>İşbu AML / CFT Uyum Beyanı, hangel platformunu işleten <strong>hangel AŞ</strong> tarafından, suç gelirlerinin aklanmasının (Anti-Money Laundering — AML) ve terörizmin finansmanının (Countering the Financing of Terrorism — CFT) önlenmesine ilişkin benimsenen ilke, politika ve kontrolleri ortaya koymak amacıyla hazırlanmıştır. hangel; bağış toplama, kurumsal bağış aktarımı ve affiliate bağış yönlendirmesi gibi fon hareketlerini içeren faaliyetlerinde aklama ve finansman risklerini önlemeyi temel bir sorumluluk olarak benimser. Bu metnin esas dili Türkçedir; uluslararası standartlara atıflar İngilizce ifadeler içerebilir.</p>

<h4>1. Amaç ve Kapsam</h4>
<p>Bu Beyanın amacı, hangel'in fon hareketlerini içeren tüm faaliyetlerinde suç gelirlerinin aklanması ve terörizmin finansmanı risklerini tespit etmek, önlemek ve yetkili mercilere bildirmektir. Kapsam; bireysel ve kurumsal bağışçıları, platform üzerinde bağış toplayan kuruluşları, ödeme/aktarım süreçlerini ve sınır ötesi bağışları içerir.</p>

<h4>2. Yasal Dayanak</h4>
<p>Beyan aşağıdaki ulusal mevzuat ve uluslararası standartlara dayanır:</p>
<ul>
<li><strong>5549 sayılı Suç Gelirlerinin Aklanmasının Önlenmesi Hakkında Kanun</strong> ve ikincil mevzuatı (Mali Suçları Araştırma Kurulu — MASAK düzenlemeleri); özellikle müşterinin tanınması (m.3), şüpheli işlem bildirimi yükümlülüğü ve bildirim gizliliği;</li>
<li><strong>6415 sayılı Terörizmin Finansmanının Önlenmesi Hakkında Kanun</strong> — terörizmin finansmanı suçu ve malvarlığının dondurulması tedbirleri (16/02/2013 tarihli ve 28561 sayılı Resmî Gazete);</li>
<li><strong>Suç Gelirlerinin Aklanmasının ve Terörizmin Finansmanının Önlenmesine Dair Tedbirler Hakkında Yönetmelik</strong> ve MASAK Genel Tebliğleri kapsamındaki kimlik tespiti ve izleme yükümlülükleri;</li>
<li><strong>FATF (Financial Action Task Force) Recommendations</strong> — uluslararası AML/CFT standartları, risk temelli yaklaşım ve kâr amacı gütmeyen kuruluşlara ilişkin Tavsiye 8.</li>
</ul>

<h4>3. Risk Temelli Yaklaşım</h4>
<p>hangel, FATF'in risk temelli yaklaşımını benimser. Bağışçı türü, işlem tutarı, fon kaynağının coğrafyası, sınır ötesi nitelik ve faydalanıcı kuruluşun profili gibi unsurlara göre risk düzeyi belirlenir. Yüksek riskli işlemler için sıkılaştırılmış kontroller (enhanced due diligence) uygulanır; düşük riskli işlemler için orantılı tedbirler benimsenir.</p>

<h4>4. Müşteri Tanı (KYC) ve Kimlik Tespiti</h4>
<p>hangel, mevzuatın gerektirdiği hâllerde bağışçı ve kuruluşların kimliğini tespit etmeyi ve doğrulamayı esas alır. Aşağıdaki tablo temel KYC unsurlarını özetler:</p>

<table class="w-full border-collapse border border-gray-200 my-4">
<thead>
<tr>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Taraf</th>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Tespit Edilen Bilgi</th>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Doğrulama Yöntemi</th>
</tr>
</thead>
<tbody>
<tr>
<td class="border border-gray-200 p-2 text-sm">Bireysel bağışçı</td>
<td class="border border-gray-200 p-2 text-sm">Ad-soyad, iletişim, ödeme aracı bilgisi</td>
<td class="border border-gray-200 p-2 text-sm">Hesap doğrulama, ödeme sağlayıcı kontrolü</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Kurumsal bağışçı</td>
<td class="border border-gray-200 p-2 text-sm">Unvan, vergi no, yetkili temsilci, gerçek faydalanıcı</td>
<td class="border border-gray-200 p-2 text-sm">Ticaret sicili/resmî kayıt teyidi</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Fon toplayan kuruluş</td>
<td class="border border-gray-200 p-2 text-sm">Tüzel kişilik, yetki belgeleri, yardım toplama izni</td>
<td class="border border-gray-200 p-2 text-sm">Dernek/vakıf sicili ve izin kontrolü</td>
</tr>
</tbody>
</table>

<h4>5. Kaynak Doğrulama ve Yaptırım Taraması</h4>
<p>hangel, fon kaynağının (source of funds) meşruiyetini değerlendirmeyi ve şüpheli kaynaklı bağışları reddetmeyi esas alır. Taraflar; ulusal ve uluslararası yaptırım/donmuş malvarlığı listeleri (6415 sayılı Kanun kapsamındaki listeler ve uluslararası yaptırım listeleri) karşısında taranır. Listelerde yer alan kişi veya kuruluşlarla ilişkili işlemler işleme alınmaz ve mevzuatın gerektirdiği bildirimler yapılır.</p>

<h4>6. Şüpheli İşlem Bildirimi (MASAK)</h4>
<p>hangel, aklama veya terörizmin finansmanı şüphesi doğuran işlemleri 5549 sayılı Kanun çerçevesinde değerlendirmeyi ve şüphenin oluştuğu tarihten itibaren mevzuatta öngörülen süre içinde (en geç 10 iş günü) MASAK'a Şüpheli İşlem Bildiriminde (ŞİB) bulunmayı taahhüt eder. Mevzuat gereği, şüpheli işlem bildiriminde bulunulduğu; denetim elemanları ve yargı mercileri dışında, işleme taraf olanlar dahil hiç kimseye açıklanmaz (bildirim gizliliği / tipping-off yasağı).</p>

<h4>7. Kâr Amacı Gütmeyen Kuruluş (NPO) Riski — FATF Tavsiye 8</h4>
<p>FATF Tavsiye 8, kâr amacı gütmeyen kuruluşların terörizmin finansmanı amacıyla kötüye kullanılabileceği riskine özel bir önem atfeder. hangel, platform üzerinde bağış toplayan dernek, vakıf ve sosyal işletmelerin bu risk bakımından orantılı biçimde değerlendirilmesini benimser. Bu kapsamda kuruluşun amacı, faaliyet coğrafyası, fon kaynak ve kullanım yapısı gözetilir. hangel, sivil toplumun meşru faaliyetlerini engellemeyen, risk temelli ve orantılı bir yaklaşımı esas alır; tüm kuruluşları peşinen yüksek riskli sayan toptancı bir yaklaşımdan kaçınır.</p>

<h4>8. İzleme, Kayıt ve Saklama</h4>
<p>hangel, işlemleri sürekli izlemeyi; olağandışı, parçalanmış (structuring) veya tutarsız işlem örüntülerini tespit etmeyi esas alır. Kimlik tespitine ve işlemlere ilişkin belge ve kayıtlar, mevzuatın öngördüğü süre boyunca (5549 sayılı Kanun ve ikincil mevzuatı kapsamındaki asgari saklama süresi) güvenli biçimde muhafaza edilir. Bu kapsamda işlenen kişisel veriler 6698 sayılı KVKK'ya uygun olarak işlenir ve korunur; KYC ve izleme amacıyla işlenen veriler, yalnızca yükümlülüklerin yerine getirilmesi için gerekli ölçüde tutulur.</p>

<h4>9. Yönetişim, Uyum Sorumlusu ve Eğitim</h4>
<p>hangel, AML/CFT yükümlülüklerinin gözetimini yönetim düzeyinde ele almayı ve mevzuatın gerektirdiği ölçüde bir uyum görevlisi/işlevi belirlemeyi hedefler. İlgili personelin aklama ve finansman riskleri konusunda bilgilendirilmesi ve eğitilmesi amaçlanır. Politikanın etkinliği periyodik olarak gözden geçirilir.</p>

<h4>10. İhlal, İşbirliği ve Yaptırım</h4>
<p>hangel, yetkili mercilerle (MASAK, adli ve idari makamlar) işbirliği yapmayı taahhüt eder. Bu Beyana veya mevzuata aykırı davranan kullanıcı veya kuruluşların hesapları askıya alınabilir veya sonlandırılabilir; gerekli hâllerde yasal bildirim ve şikâyet yolları işletilir.</p>

<h4>11. Sınır Ötesi Bağışlar ve Üçüncü Taraf Riskleri</h4>
<p>hangel, sınır ötesi bağış ve fon hareketlerinde ek risklerin doğabileceğini kabul eder. Bu kapsamda; fonun çıkış ve varış ülkesinin risk düzeyi, ödeme/aracılık zincirindeki üçüncü tarafların güvenilirliği ve faydalanıcı kuruluşun bulunduğu coğrafyanın yaptırım durumu değerlendirilir. hangel, ödeme hizmeti sağlayıcıları ve aktarım ortaklarının da kendi AML/CFT yükümlülüklerine tabi olduğunu gözetir ve mümkün olduğunca mevzuata uyumlu, denetlenen aracılarla çalışmayı esas alır. Yüksek riskli veya yaptırım altındaki ülkelerle bağlantılı işlemlerde sıkılaştırılmış inceleme uygulanır; gerektiğinde işlem reddedilir veya mevzuat uyarınca ertelenir ve bildirilir.</p>

<h4>12. Bağışçı Gizliliği ile Yükümlülükler Arasındaki Denge</h4>
<p>hangel, AML/CFT yükümlülüklerini yerine getirirken bağışçı ve kuruluşların kişisel verilerinin korunması arasında bir denge gözetir. Kimlik tespiti ve izleme amacıyla toplanan veriler 6698 sayılı KVKK ilkelerine uygun olarak, amaçla sınırlı ve ölçülü biçimde işlenir; bu verilere erişim yetkilendirilmiş personelle sınırlandırılır. Mevzuatın gerektirdiği şüpheli işlem bildirimi ve bilgi paylaşımı yükümlülükleri, KVKK kapsamında hukuki yükümlülüğün yerine getirilmesi dayanağına tabidir ve bağışçının açık rızasına bağlı değildir. hangel, bu kapsamdaki bilgilendirmeyi aydınlatma yükümlülükleri çerçevesinde yapar; ancak şüpheli işlem bildiriminin gizliliği mevzuat gereği korunur ve işleme taraf olanlara açıklanmaz.</p>

<h4>13. Yürürlük</h4>
<p>Bu Beyan, hangel tarafından yayımlandığı tarihte yürürlüğe girer ve mevzuat ile FATF standartlarındaki gelişmelere göre güncellenir. Beyana ilişkin sorular ile veri koruma konuları için <a href="mailto:kvkk@hangel.org">kvkk@hangel.org</a> adresine başvurulabilir.</p>

<p class="text-xs text-muted-foreground"><em>Bu metin bilgilendirme amaçlıdır ve bağlayıcı nihai hukuki görüş niteliği taşımaz; yürürlük öncesi yetkili hukuk danışmanlığı önerilir.</em></p>
    `
  },
  {
    slug: 'etik-bagis-ve-fon-kullanimi-beyani',
    title: 'Etik Bağış ve Fon Kullanımı Beyanı',
    content: `
      <h3>Etik Bağış ve Fon Kullanımı Beyanı</h3>

<p>İşbu Etik Bağış ve Fon Kullanımı Beyanı, hangel platformunu işleten <strong>hangel AŞ</strong> tarafından, bağışların etik ilkelere uygun biçimde toplanması, kabulü, amaca uygun kullanımı ve raporlanması ile çıkar çatışmalarının önlenmesine ilişkin esasları ortaya koymak amacıyla hazırlanmıştır. hangel, bağışçı güvenini en temel varlığı olarak görür ve fonların yalnızca beyan edilen toplumsal amaçlar için kullanılmasını taahhüt eder. Bu metnin esas dili Türkçedir; uluslararası çerçevelere atıflar İngilizce ifadeler içerebilir.</p>

<h4>1. Amaç ve Kapsam</h4>
<p>Bu Beyanın amacı, hangel üzerinden gerçekleştirilen tüm bağış faaliyetlerinde etik standartları güvence altına almaktır. Kapsam; bireysel ve kurumsal bağışları, affiliate bağış aktarımını, platform üzerinde bağış toplayan kuruluşları ve toplanan fonların kullanımını içerir. Beyan, hangel'in tüm paydaşlarıyla ilişkilerinde bağlayıcı etik bir çerçeve oluşturur.</p>

<h4>2. Yasal ve Çerçevesel Dayanak</h4>
<p>Beyan aşağıdaki ulusal mevzuat ve uluslararası etik çerçevelere dayanır:</p>
<ul>
<li><strong>2860 sayılı Yardım Toplama Kanunu</strong> ve Yönetmeliği — yardım toplama izni, toplanan yardımların amaca uygun kullanımı ve denetimi (m.6, m.7 ve devamı);</li>
<li><strong>5253 sayılı Dernekler Kanunu</strong> ve <strong>5737 sayılı Vakıflar Kanunu</strong> — fon toplayan kuruluşların beyan ve hesap verebilirlik yükümlülükleri;</li>
<li><strong>ICNL (International Center for Not-for-Profit Law)</strong> tarafından desteklenen uluslararası sivil toplum etik ilkeleri — bağış şeffaflığı, hesap verebilirlik ve kötüye kullanımın önlenmesi;</li>
<li><strong>Donor Bill of Rights (AFP)</strong> — bağışçı hakları ve etik bağış toplama ilkeleri (referans çerçeve olarak).</li>
</ul>

<h4>3. Etik Bağış Kabul İlkeleri ve Kaynak Reddi</h4>
<p>hangel, her bağışı kabul etmek zorunda değildir ve etik dışı kaynaklı bağışları reddetme hakkını saklı tutar. Aşağıdaki tablo, kabul ve ret ilkelerini özetler:</p>

<table class="w-full border-collapse border border-gray-200 my-4">
<thead>
<tr>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">İlke</th>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Açıklama</th>
</tr>
</thead>
<tbody>
<tr>
<td class="border border-gray-200 p-2 text-sm">Kaynak meşruiyeti</td>
<td class="border border-gray-200 p-2 text-sm">Suç gelirleri, yasa dışı veya kaynağı doğrulanamayan fonlar reddedilir</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Misyon uyumu</td>
<td class="border border-gray-200 p-2 text-sm">hangel'in toplumsal misyonuyla çelişen koşullu bağışlar reddedilebilir</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">İtibar riski</td>
<td class="border border-gray-200 p-2 text-sm">Platformun veya faydalanıcıların itibarını zedeleyebilecek bağışlar değerlendirmeye alınır</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Uygunsuz koşul</td>
<td class="border border-gray-200 p-2 text-sm">Bağışçının haksız avantaj veya yönlendirme talep ettiği bağışlar reddedilir</td>
</tr>
</tbody>
</table>

<h4>4. Bağışçı Hakları</h4>
<p>hangel, bağışçılara şu hakları tanır: bağışın amacı ve kullanımı hakkında doğru ve zamanında bilgi alma; bağışın amaca uygun kullanıldığına dair şeffaf raporlamaya erişim; kişisel verilerinin 6698 sayılı KVKK'ya uygun işlenmesi; pazarlama iletişimlerine 6563 sayılı Elektronik Ticaretin Düzenlenmesi Hakkında Kanun ve İleti Yönetim Sistemi (İYS) çerçevesinde onay verme ve geri çekme; ve şikâyet/itiraz mekanizmasına erişim. Bağışçı, kimliğinin gizli tutulmasını talep edebilir.</p>

<h4>5. Fon Kullanımı ve Amaca Uygunluk (Tahsis İlkeleri)</h4>
<p>hangel, toplanan fonların yalnızca beyan edilen amaç için kullanılmasını esas alır. Belirli bir kampanya için toplanan fonlar, açıkça aksi belirtilmedikçe başka amaca aktarılmaz. Amaca ulaşılması, fazla fon oluşması veya amacın gerçekleşememesi hâllerinde izlenecek yol önceden duyurulur. Platform işletim maliyetlerine ayrılan pay (varsa) şeffaf biçimde açıklanır. Fon hareketleri izlenebilir tutulur ve belgeyle desteklenir.</p>

<h4>6. Çıkar Çatışmasının Önlenmesi</h4>
<p>hangel, bağış ve fon kullanımı süreçlerinde çıkar çatışmalarını önlemeyi taahhüt eder. Karar alıcıların kişisel menfaatleri ile hangel'in veya faydalanıcıların menfaatleri çatıştığında, ilgili kişi karardan çekilir ve durum kayda geçirilir. Bu ilke, 6102 sayılı Türk Ticaret Kanunu m.393 (menfaat çatışması) ile uyumludur. hangel'in yönetişim ve etik politikaları bu Beyanı tamamlar.</p>

<h4>7. AML/CFT ve Kaynak Doğrulama</h4>
<p>Etik bağış ilkeleri, suç gelirlerinin aklanması ve terörizmin finansmanının önlenmesi yükümlülükleriyle bütünleşik biçimde uygulanır. Bu kapsamda 5549 sayılı Kanun (MASAK), 6415 sayılı Kanun ve FATF tavsiyeleri ile hangel'in AML/CFT Uyum Beyanı esas alınır.</p>

<h4>8. Baskısız Bağış ve Dürüst İletişim</h4>
<p>hangel, bağış toplamada baskı, yanıltma veya duygusal sömürüye dayalı yöntemlerden kaçınmayı taahhüt eder. Kampanya anlatıları gerçeğe uygun olmalı; ihtiyaç, aciliyet ve hedef tutar abartılmamalıdır. Faydalanıcıların görsel ve hikâyeleri, onların onuruna saygı gösteren, rızaya dayalı ve mahremiyeti koruyan biçimde kullanılır; özellikle çocukların ve kırılgan grupların görünürlüğünde ek hassasiyet gözetilir. hangel, "yüzde yüz yerine ulaşır" gibi mutlak ifadelerden, gerçek operasyonel maliyet yapısını gizlememek adına kaçınır ve platform/işletim payını şeffaf biçimde açıklar.</p>

<h4>9. Faydalanıcıların Korunması ve Onuru</h4>
<p>hangel, bağış sürecinin merkezine yalnızca bağışçıyı değil, faydalanıcıyı da yerleştirir. Faydalanıcılara ilişkin kişisel ve özellikle sağlık verileri (örneğin kan grubu) 6698 sayılı KVKK m.6 kapsamında özel nitelikli veri olarak korunur ve yalnızca amaca uygun, asgari ölçüde işlenir. Faydalanıcıların damgalanmasına veya mağduriyetinin ticarileştirilmesine yol açabilecek uygulamalardan kaçınılır. Faydalanıcılar, kendileriyle ilgili paylaşımlar konusunda bilgilendirilir ve mümkün olduğunda rızaları alınır.</p>

<h4>10. Finansal Şeffaflık ve Raporlama</h4>
<p>hangel, bağış akışını ve fon kullanımını şeffaf biçimde raporlamayı hedefler. Bağışçılar, bağışlarının izlenebilir biçimde kullanıldığına dair bilgiye erişebilir. hangel, dönemsel bağış ve etki raporları yayımlamayı amaçlar; yardım toplayan kuruluşların 2860 sayılı Kanun kapsamındaki amaca uygun kullanım ve denetim yükümlülüklerine uymalarını bekler. hangel'in şeffaflık, sosyal etki ve AML/CFT politikaları bu Beyanı tamamlayan belgelerdir.</p>

<h4>11. İade, İtiraz ve Şikâyet</h4>
<p>Hatalı, mükerrer veya yanlış yönlendirilmiş bağışlarda hangel, mevzuat ve ödeme sağlayıcı kuralları çerçevesinde iade sürecini işletir. Bağışçılar, bağışla ilgili itiraz ve şikâyetlerini hangel'e iletebilir; başvurular makul süre içinde değerlendirilir ve sonuçlandırılır. Tüketici niteliğindeki bağışçılar için 6502 sayılı Tüketicinin Korunması Hakkında Kanun kapsamındaki haklar saklıdır.</p>

<h4>12. İzleme, Eğitim ve Hesap Verebilirlik</h4>
<p>hangel, bu Beyandaki etik ilkelerin yalnızca yazılı bir taahhüt olarak kalmaması; günlük operasyonlara ve karar süreçlerine yansıması için içsel mekanizmalar kurmayı hedefler. Bu kapsamda; bağış ve fon kullanımı süreçlerinde görev alan personelin etik ilkeler, kaynak doğrulama ve çıkar çatışması konularında bilgilendirilmesi amaçlanır. hangel, etik ihlali iddialarını değerlendirmek üzere bir başvuru ve inceleme süreci işletmeyi; doğrulanan ihlallerde orantılı yaptırımlar uygulamayı taahhüt eder. Beyanın etkinliği periyodik olarak gözden geçirilir ve gerektiğinde güncellenir; hangel, etik performansına ilişkin bilgileri şeffaflık raporlamasıyla bütünleşik biçimde kamuoyuyla paylaşmayı hedefler.</p>

<h4>13. Kurumsal Bağış, Sponsorluk ve Bağımsızlık</h4>
<p>hangel, kurumsal bağış ve sponsorluk ilişkilerinde bağımsızlığını ve karar özgürlüğünü korumayı esas alır. Bir kurumsal bağışçının veya sponsorun, hangel'in editöryal, operasyonel veya toplumsal misyona ilişkin kararlarını uygunsuz biçimde etkilemesine izin verilmez. Sponsorlu içerik veya işbirlikleri, kullanıcıların yanılmasını önleyecek biçimde açıkça etiketlenir. hangel, marka üyelikleri ve kurumsal işbirliklerinden elde edilen kaynakların da etik kaynak ilkelerine tabi olduğunu; toplumsal misyonla bağdaşmayan veya kamuoyunun güvenini zedeleyebilecek işbirliklerinden kaçınmayı taahhüt eder. Bu ilke, çıkar çatışmasının önlenmesine ilişkin Madde 6 ile bütünleşik biçimde uygulanır.</p>

<h4>14. Yürürlük</h4>
<p>Bu Beyan, hangel tarafından yayımlandığı tarihte yürürlüğe girer ve periyodik olarak gözden geçirilir. Beyana ilişkin görüş, itiraz ve önerilerle veri koruma konuları için <a href="mailto:kvkk@hangel.org">kvkk@hangel.org</a> adresine başvurulabilir.</p>

<p class="text-xs text-muted-foreground"><em>Bu metin bilgilendirme amaçlıdır ve bağlayıcı nihai hukuki görüş niteliği taşımaz; yürürlük öncesi yetkili hukuk danışmanlığı önerilir.</em></p>
    `
  },
  {
    slug: 'acik-veri-ve-etki-verisi-paylasim-politikasi',
    title: 'Açık Veri ve Etki Verisi Paylaşım Politikası',
    content: `
      <h3>Açık Veri ve Etki Verisi Paylaşım Politikası</h3>

<p>Bu politika, hangel'in toplumsal etki faaliyetlerine ilişkin verileri akademik dünya, kamu ve kamuoyuyla şeffaf biçimde paylaşırken uyacağı ilkeleri belirler. Platformu işleten tüzel kişi <strong>hangel AŞ</strong>'dir. Metinde kullanıcıya görünen yerlerde "hangel" küçük harfle yazılır. Bu politikanın temel ilkesi açıktır: hangel yalnızca <strong>anonimleştirilmiş veya agrege etki verisini</strong> paylaşır; bireysel kullanıcıların kişisel verilerini açık veri olarak yayımlamaz.</p>

<h4>1. Amaç</h4>
<p>hangel, bir toplumsal etki platformu olarak; acil kan talebi/eşleştirme, bağış, gönüllülük ve STK iş birliklerine ilişkin toplumsal etkiyi şeffaf biçimde gösterebilmek amacıyla bir <strong>açık veri ve etki verisi paylaşım</strong> çerçevesi benimser. Amaç; hesap verebilirliği güçlendirmek, akademik araştırmayı ve kamu yararını desteklemek ve toplumsal etkiyi ölçülebilir kılmaktır. Bu, kişisel verilerin korunmasından asla taviz verilmeden gerçekleştirilir.</p>

<h4>2. Kapsam — Neyi Paylaşırız, Neyi Paylaşmayız</h4>
<table class="w-full border-collapse border border-gray-200 my-4">
  <thead>
    <tr>
      <th class="border border-gray-200 p-2 text-left text-sm" scope="col">Paylaşılabilir (Anonim/Agrege)</th>
      <th class="border border-gray-200 p-2 text-left text-sm" scope="col">Asla Paylaşılmaz (Kişisel)</th>
    </tr>
  </thead>
  <tbody>
    <tr><td class="border border-gray-200 p-2 text-sm">Bölge bazında toplam kan talebi/eşleşme sayıları</td><td class="border border-gray-200 p-2 text-sm">Ad, soyad, iletişim bilgileri</td></tr>
    <tr><td class="border border-gray-200 p-2 text-sm">Dönemsel toplam bağış tutarları ve dağılımı</td><td class="border border-gray-200 p-2 text-sm">Bireysel kan grubu (sağlık verisi)</td></tr>
    <tr><td class="border border-gray-200 p-2 text-sm">Gönüllü katılım oranları (agrege)</td><td class="border border-gray-200 p-2 text-sm">Kesin konum, IBAN/ödeme bilgileri</td></tr>
    <tr><td class="border border-gray-200 p-2 text-sm">Kampanya başarı göstergeleri (toplulaştırılmış)</td><td class="border border-gray-200 p-2 text-sm">Tekil kullanıcıya geri bağlanabilen kayıtlar</td></tr>
  </tbody>
</table>

<h4>3. Yalnızca Anonimleştirilmiş ve Agrege Veri</h4>
<p>hangel'in açık olarak paylaştığı tüm veriler, paylaşımdan önce <strong>anonimleştirme veya toplulaştırma (agregasyon)</strong> işlemine tabi tutulur. Anonimleştirme; verinin, geri döndürülemez biçimde ve makul hiçbir yöntemle belirli veya belirlenebilir bir gerçek kişiyle ilişkilendirilemeyecek hâle getirilmesidir. hangel, küçük gruplarda yeniden kimliklendirme (re-identification) riskini azaltmak için eşik/k-anonimlik gibi tekniklere ve hücre baskılamasına başvurmayı hedefler.</p>

<h4>4. Anonim Verinin Hukuki Konumu</h4>
<p>Usulüne uygun anonimleştirilmiş veri, kişisel veri olmaktan çıkar ve veri koruma mevzuatının kapsamı dışında kalır:</p>
<ul>
  <li><strong>Türkiye:</strong> 6698 sayılı KVKK m.7 ve Kişisel Verilerin Silinmesi, Yok Edilmesi veya Anonim Hale Getirilmesi Hakkında Yönetmelik uyarınca anonim hâle getirilen veri kişisel veri sayılmaz.</li>
  <li><strong>Avrupa Birliği:</strong> GDPR Resitalleri (özellikle Recital 26) uyarınca, belirli veya belirlenebilir bir gerçek kişiyle ilişkilendirilemeyecek biçimde anonimleştirilen veri, veri koruma ilkelerinin kapsamı dışındadır.</li>
</ul>
<p>hangel, anonimleştirmenin gerçekliğini düzenli olarak gözden geçirmeyi ve yetersiz kaldığı durumlarda paylaşımı durdurmayı taahhüt eder.</p>

<h4>5. Erişim — Akademik ve Kamu Kullanımı</h4>
<p>hangel; anonim/agrege etki verisini, kamu yararına araştırma yapan akademik kurumlar, sivil toplum kuruluşları, kamu otoriteleri ve genel kamuoyuyla paylaşmayı hedefler. Erişim, mümkün olduğunca açık ve eşit koşullarda sağlanır; hassas veya yeniden kimliklendirme riski taşıyan ayrıntı düzeyleri için ek koruyucu koşullar uygulanabilir.</p>

<h4>6. Açık Veri İlkeleri</h4>
<p>hangel, açık veri paylaşımında <strong>Open Definition (Açık Tanım)</strong> ilkelerini referans alır: verinin serbestçe erişilebilir, kullanılabilir, yeniden kullanılabilir ve yeniden dağıtılabilir olması. Veriler, makinece okunabilir ve yaygın formatlarda; mümkün olduğunda açıklayıcı üst veri (metadata) ile birlikte sunulmayı hedefler.</p>

<h4>7. Lisanslama</h4>
<p>Paylaşılan açık veri setlerinin, yeniden kullanımı kolaylaştıran açık bir lisansla (örneğin <strong>Creative Commons Atıf — CC BY</strong>) sunulması önerilir ve hedeflenir. Bu lisans, kullanıcıların veriyi kaynak göstermek koşuluyla serbestçe kullanmasına olanak tanır. Her veri setinin lisans koşulları, setle birlikte açıkça belirtilir.</p>

<h4>8. Yeniden Kimliklendirme Yasağı</h4>
<p>hangel, açık veri setlerini kullananlardan, veriyi tek başına veya başka kaynaklarla birleştirerek <strong>bireyleri yeniden kimliklendirmeye çalışmamalarını</strong> beklemeyi ve bunu lisans/kullanım koşullarında öngörmeyi hedefler. hangel, yeniden kimliklendirme riski tespit ettiğinde ilgili veri setini geri çekme veya ayrıntı düzeyini düşürme hakkını saklı tutar.</p>

<h4>9. Anonimleştirme Süreci ve Teknikleri</h4>
<p>hangel'in anonimleştirme yaklaşımı, veri setinin niteliğine göre uyarlanan çok aşamalı bir süreçtir. Bu süreç, paylaşımdan önce verinin kişiyi belirlenebilir kılan tüm unsurlardan arındırılmasını amaçlar:</p>
<ul>
  <li><strong>Doğrudan tanımlayıcıların kaldırılması:</strong> Ad, iletişim bilgisi, hesap kimliği ve benzeri doğrudan tanımlayıcılar veri setinden çıkarılır.</li>
  <li><strong>Dolaylı tanımlayıcıların genelleştirilmesi:</strong> Yaş, konum gibi dolaylı tanımlayıcılar aralıklara/bölgelere dönüştürülerek genelleştirilir (örneğin kesin yaş yerine yaş aralığı, mahalle yerine il/bölge).</li>
  <li><strong>Eşik (k-anonimlik) uygulaması:</strong> Belirli bir hücredeki kayıt sayısı asgari bir eşiğin altına düştüğünde, o hücre baskılanır veya daha geniş bir kategoriyle birleştirilir; böylece küçük gruplarda kişilerin ayırt edilmesi engellenir.</li>
  <li><strong>Toplulaştırma:</strong> Çıktılar mümkün olan en yüksek toplulaştırma düzeyinde (toplam, ortalama, oran) sunulur; satır düzeyinde mikro veri yayımlanmaz.</li>
</ul>
<p>Anonimleştirmenin yeterliliği, yeniden kimliklendirme riski açısından düzenli olarak gözden geçirilir.</p>

<h4>10. Veri Kalitesi ve Yöntem Şeffaflığı</h4>
<p>hangel; paylaşılan etki verisinin kapsamı, sınırları, hesaplama yöntemi ve referans dönemi hakkında açıklayıcı notlar sunmayı hedefler. Etki ölçümünde, mümkün olduğunda tanınmış çerçevelerden (örneğin Social Value International tarafından geliştirilen SROI / sosyal getiri yaklaşımları) yararlanılır; ancak bu, herhangi bir bağımsız doğrulama veya sertifikasyon iddiası anlamına gelmez. Yöntemsel sınırlar ve varsayımlar, veri setiyle birlikte dürüstçe belirtilir.</p>

<h4>11. Yönetişim ve Karar Süreci</h4>
<p>Hangi veri setlerinin açık olarak paylaşılacağına, hangi ayrıntı düzeyinde yayımlanacağına ve hangi koşulların uygulanacağına ilişkin kararlar, kişisel verilerin korunması ilkeleri gözetilerek alınır. Yeniden kimliklendirme riski taşıdığı değerlendirilen hiçbir set yayımlanmaz. Şüphe hâlinde, paylaşmama yönünde karar verilmesi esastır (ihtiyatlılık ilkesi).</p>

<h4>12. Paylaşım Türleri ve Erişim Düzeyleri</h4>
<p>hangel, açık veri ve etki verisini farklı erişim düzeylerinde sunmayı öngörür. Aşağıdaki tablo, temsilî erişim modelini gösterir; her düzeyin koşulları veri setinin hassasiyetine göre belirlenir.</p>
<table class="w-full border-collapse border border-gray-200 my-4">
  <thead>
    <tr>
      <th class="border border-gray-200 p-2 text-left text-sm" scope="col">Düzey</th>
      <th class="border border-gray-200 p-2 text-left text-sm" scope="col">İçerik</th>
      <th class="border border-gray-200 p-2 text-left text-sm" scope="col">Erişim</th>
    </tr>
  </thead>
  <tbody>
    <tr><td class="border border-gray-200 p-2 text-sm">Kamuya açık etki raporu</td><td class="border border-gray-200 p-2 text-sm">Yüksek düzeyde toplulaştırılmış göstergeler</td><td class="border border-gray-200 p-2 text-sm">Herkese açık, koşulsuz</td></tr>
    <tr><td class="border border-gray-200 p-2 text-sm">Açık veri seti</td><td class="border border-gray-200 p-2 text-sm">Anonim/agrege, makinece okunabilir veri</td><td class="border border-gray-200 p-2 text-sm">Açık lisans (ör. CC BY) ile herkese açık</td></tr>
    <tr><td class="border border-gray-200 p-2 text-sm">Araştırma erişimi</td><td class="border border-gray-200 p-2 text-sm">Daha ayrıntılı (yine anonim) veri</td><td class="border border-gray-200 p-2 text-sm">Akademik/kamu kurumuna ek koşullarla</td></tr>
  </tbody>
</table>
<p>Hiçbir erişim düzeyinde kişisel veri paylaşılmaz; tüm düzeyler anonimleştirme/agregasyon süzgecinden geçer.</p>

<h4>13. Sürdürülebilir Kalkınma ve Kamu Yararı Bağlamı</h4>
<p>hangel, açık etki verisini, toplumsal fayda ve kamu yararı amacının ölçülebilir biçimde gösterilmesine hizmet eden bir şeffaflık aracı olarak görür. Veriler; sağlık erişimi, dayanışma ve gönüllülük gibi alanlarda toplumsal katkının izlenmesine olanak tanıyacak şekilde, ilgili kamu yararı çerçeveleriyle uyumlu sunulmayı hedefler. Bu, hangi göstergenin hangi toplumsal amaca katkı sağladığının açıkça belirtilmesini içerir.</p>

<h4>14. Sorumluluk ve Sınırlar</h4>
<p>Açık veri setleri "olduğu gibi" sunulur. hangel, verinin üçüncü taraflarca yapılacak yorum ve türev kullanımlarından sorumlu değildir. Veri setleri bilgilendirme ve araştırma amaçlıdır; tıbbi, finansal veya hukuki karar için tek başına dayanak oluşturmaz. hangel'in kan/sağlık aracılık hizmeti bakımından verdiği genel sorumluluk reddi bu politika için de geçerlidir.</p>

<h4>15. Geri Bildirim Kanalı</h4>
<p>Açık veri ve etki verisi paylaşımına ilişkin sorular, düzeltme talepleri veya olası bir yeniden kimliklendirme riski bildirimleri <a href="mailto:privacy@hangel.org" rel="noopener" target="_blank">privacy@hangel.org</a> adresine iletilebilir. Türkiye'deki veri koruma talepleri için <a href="mailto:kvkk@hangel.org" rel="noopener" target="_blank">kvkk@hangel.org</a> kullanılabilir. hangel, bildirilen bir yeniden kimliklendirme riskini öncelikli olarak değerlendirir.</p>

<h4>16. Değişiklik ve Yürürlük</h4>
<p>Bu politika, anonimleştirme tekniklerindeki gelişmeler, mevzuat değişiklikleri ve paylaşım uygulamalarındaki güncellemeler doğrultusunda revize edilebilir. Güncel sürüm platformda yayımlandığı tarihte yürürlüğe girer.</p>

<p class="text-xs text-muted-foreground"><em>Bu metin bilgilendirme amaçlıdır ve bağlayıcı nihai hukuki görüş niteliği taşımaz; yürürlük öncesi yetkili hukuk danışmanlığı önerilir.</em></p>
    `
  },

  // --- D. Kurumsal Yönetişim, Etik ve İç Denetim ---
  {
    slug: 'etik-ilkeler',
    title: 'Etik İlkeler',
    content: `
      <h3>Etik İlkeler</h3>

<p>İşbu Etik İlkeler, hangel toplumsal etki platformunu işleten <strong>hangel AŞ</strong> bünyesinde görev yapan tüm yöneticiler, çalışanlar, gönüllüler, danışmanlar ve platform üzerinde faaliyet gösteren paydaşların uymakla yükümlü olduğu temel davranış standartlarını belirler. hangel; acil kan talebi eşleştirmesi, bağış aktarımı, gönüllülük ilanları ve sivil toplum kuruluşlarının dijital görünürlüğü gibi yüksek güven gerektiren hizmetler sunduğundan, etik dürüstlük platformun varlık sebebinin ayrılmaz bir parçasıdır. Bir bağışçının verdiği desteğin amacına ulaşacağına, acil kan ihtiyacı olan bir kişinin doğru ve güvenli biçimde eşleştirileceğine ve paylaşılan kişisel verinin korunacağına duyulan güven, hangel'in en değerli sermayesidir. Bu güveni korumak, tek tek kuralların ötesinde, kurum kültürüne yerleşmiş bir dürüstlük anlayışını gerektirir. Bu metnin esas dili Türkçedir; atıf yapılan uluslararası çerçevelere ilişkin ifadeler İngilizce terimler içerebilir.</p>

<h4>1. Amaç ve İlkeler</h4>
<p>Bu metnin amacı, hangel ekosisteminde insan onuruna saygı, dürüstlük, hesap verebilirlik, eşitlik ve toplum yararını gözeten bir kültür oluşturmaktır. Temel ilkeler şunlardır:</p>
<ul>
<li><strong>Dürüstlük ve şeffaflık:</strong> Tüm beyan, rapor ve iletişimde doğruluk esastır; yanıltıcı, abartılı veya eksik bilgi verilmez.</li>
<li><strong>İnsan onuruna saygı:</strong> Her birey, herhangi bir ayrım gözetilmeksizin eşit saygıyla muamele görür.</li>
<li><strong>Toplum yararı önceliği:</strong> Kararlar, kısa vadeli kazanç yerine faydalanıcıların ve toplumun yararı gözetilerek alınır.</li>
<li><strong>Hesap verebilirlik:</strong> Her görev sahibi, eylem ve kararlarının sonuçlarından sorumludur.</li>
<li><strong>Gizlilik ve veri sorumluluğu:</strong> Özellikle özel nitelikli sağlık verisi (kan grubu) başta olmak üzere kişisel veriler azami özenle korunur.</li>
<li><strong>Çıkar çatışmasından kaçınma:</strong> Kişisel menfaat ile kurumsal/kamusal menfaat çatıştığında, çatışma beyan edilir ve şeffaf biçimde yönetilir.</li>
</ul>
<p>Bu ilkeler birbirini tamamlar ve hiçbiri tek başına diğerinin yerini almaz. Bir kararın hukuken mümkün olması, onu etik açıdan da kabul edilebilir kılmaz; hangel paydaşlarından beklentisi, hem hukuka hem de bu ilkelere aynı anda uygun davranmalarıdır. Tereddüt yaşanan durumlarda, kararın kamuoyu önünde savunulabilir olup olmadığı bir pusula olarak kullanılır.</p>

<h4>2. Kapsam ve Paydaşlar</h4>
<p>Bu ilkeler; hangel AŞ yöneticilerini, tam/yarı zamanlı çalışanları, stajyerleri, gönüllüleri, tedarikçileri ve platform üzerinde profil oluşturan dernek, vakıf, sosyal işletme, marka ve öğrenci kulüplerini kapsar. Paydaşlar; bağışçılar, faydalanıcılar (kan/bağış talep edenler), kamu kurumları ve genel kamuoyudur. Platformda hizmet veren her aktör, bu ilkeleri kabul etmiş sayılır. hangel, iş ilişkisi kurduğu tedarikçi ve hizmet sağlayıcılardan da bu ilkelerle bağdaşır bir davranış standardı bekler ve sözleşmesel ilişkilerinde bu beklentiyi yansıtmayı hedefler. İlkeler, fiziki ve dijital tüm ortamlarda; platform içi etkileşimlerde olduğu kadar sosyal medya, etkinlik ve temsil faaliyetlerinde de geçerlidir.</p>

<h4>3. Referans Çerçeve</h4>
<p>hangel'in etik anlayışı aşağıdaki uluslararası çerçevelerden ilham alır ve bunlarla uyumu gözetir. Bu çerçeveler hangel için bir <em>sertifika</em> veya <em>akreditasyon</em> oluşturmaz; benimsenen ilkesel referanslardır:</p>
<ul>
<li><strong>UN Global Compact</strong> — insan hakları, çalışma standartları, çevre ve yolsuzlukla mücadeleye ilişkin on ilke;</li>
<li><strong>Birleşmiş Milletler İnsan Hakları Evrensel Beyannamesi (1948)</strong> — özellikle m.1 (onur ve haklarda eşitlik), m.2 (ayrımcılık yasağı) ve m.7 (kanun önünde eşitlik);</li>
<li><strong>Anayasa m.10</strong> — kanun önünde eşitlik ilkesi (ulusal hukuk çerçevesi).</li>
</ul>
<p>Bu çerçeveler, hangel'in etik yaklaşımının uluslararası kabul görmüş değerlerle uyumlu olduğunu göstermek için referans alınır. hangel'in bu belgeleri benimsemesi, herhangi bir resmî üyelik, akreditasyon veya dış denetim sonucunu ifade etmez; söz konusu çerçevelerin temsil ettiği ilkelere gönüllü bağlılık anlamına gelir.</p>

<h4>4. Davranış Kuralları ve Yasaklar</h4>
<p>Tüm hangel paydaşları aşağıdaki kurallara uymakla yükümlüdür:</p>
<table class="w-full border-collapse border border-gray-200 my-4">
<thead>
<tr>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Alan</th>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Beklenen Davranış</th>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Yasaklanan Davranış</th>
</tr>
</thead>
<tbody>
<tr>
<td class="border border-gray-200 p-2 text-sm">Dürüstlük</td>
<td class="border border-gray-200 p-2 text-sm">Doğru ve eksiksiz beyan</td>
<td class="border border-gray-200 p-2 text-sm">Yanıltıcı bilgi, sahte belge, manipülasyon</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Ayrımcılık karşıtlığı</td>
<td class="border border-gray-200 p-2 text-sm">Eşit ve adil muamele</td>
<td class="border border-gray-200 p-2 text-sm">Dil, din, ırk, cinsiyet, engellilik, sağlık durumu temelli ayrımcılık</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Yolsuzluk</td>
<td class="border border-gray-200 p-2 text-sm">Şeffaf süreçler</td>
<td class="border border-gray-200 p-2 text-sm">Rüşvet, kayırma, haksız menfaat</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Çıkar çatışması</td>
<td class="border border-gray-200 p-2 text-sm">Beyan ve çekilme</td>
<td class="border border-gray-200 p-2 text-sm">Gizlenen kişisel menfaat, kendi kendine işlem</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Veri gizliliği</td>
<td class="border border-gray-200 p-2 text-sm">Verinin amaca uygun kullanımı</td>
<td class="border border-gray-200 p-2 text-sm">Yetkisiz erişim, sağlık verisinin kötüye kullanımı</td>
</tr>
</tbody>
</table>
<p>Çıkar çatışması durumlarına ilişkin ayrıntılı kurallar, hangel <em>Çıkar Çatışması Politikası</em>'nda; ihlal bildirimi süreçleri ise <em>Whistleblower (İhbarcı) Politikası</em>'nda düzenlenir. Yukarıdaki tablo asgari standartları gösterir; kapsamadığı durumlarda paydaşlardan, ilkelerin ruhuna uygun ve iyi niyetli davranmaları beklenir. Hediye ve ağırlama söz konusu olduğunda, kararı veya değerlendirmeyi etkileyebilecek nitelikteki menfaatlerden kaçınılır; sembolik nezaket jestleri ise şeffaflık içinde değerlendirilir. Kamuya açık beyanlarda hangel'in sahip olmadığı sertifika, statü veya başarıların varmış gibi gösterilmesi, dürüstlük ilkesinin ağır bir ihlali sayılır.</p>

<h4>5. Roller, Sorumluluklar ve Yönetişim Yapısı</h4>
<p>Etik ilkelerin uygulanmasından nihai olarak hangel AŞ yönetim kurulu sorumludur. Günlük uygulama, ilgili birim yöneticileri tarafından gözetilir. Her paydaş; ihlalleri fark etmek, kaçınmak ve bildirmekle yükümlüdür. Yöneticiler, kendi ekiplerinde örnek davranış sergilemek ve etik kültürü teşvik etmekle görevlidir; ekip üyelerine ilkeleri açıklamak, sorulara yanıt vermek ve etik açıdan zorlayıcı durumlarda yön göstermek yöneticilik sorumluluğunun bir parçasıdır. hangel, etik ilkelerin yorumlanmasında tereddüt yaşayan paydaşların başvurabileceği bir danışma kanalı oluşturmayı hedefler. Bu kanal aracılığıyla, henüz ihlal niteliği kazanmamış riskli durumlar erkenden ele alınabilir ve önleyici rehberlik sağlanabilir. Etik ilkelerin günlük kararlara nasıl yansıtılacağına dair iç eğitim ve farkındalık çalışmaları yürütmek de hangel'in hedefleri arasındadır.</p>

<h4>6. İhbar / İhlal Bildirimi ve Yaptırım</h4>
<p>Bu ilkelere aykırı davranışlar, gizliliği korunan kanallar üzerinden bildirilebilir. İyi niyetle bildirim yapan kişiye misilleme yapılması kesinlikle yasaktır. Bildirimler tarafsız biçimde değerlendirilir; ihlalin niteliğine göre uyarı, görevden alma, sözleşme feshi ve gerektiğinde yasal yollara başvuru dahil yaptırımlar uygulanabilir. Kişisel verilerin korunmasına ilişkin ihlaller 6698 sayılı KVKK çerçevesinde ayrıca değerlendirilir.</p>

<h4>7. İzleme ve Gözden Geçirme</h4>
<p>hangel, etik ilkelerin etkinliğini periyodik olarak gözden geçirmeyi ve gelişen mevzuat, paydaş geri bildirimi ve uluslararası iyi uygulamalar ışığında güncellemeyi taahhüt eder. İlkelere ilişkin görüşler <a href="mailto:dpo@hangel.org">dpo@hangel.org</a> adresine iletilebilir; veri koruma yönündeki başvurular için <a href="mailto:kvkk@hangel.org">kvkk@hangel.org</a> kullanılır.</p>

<h4>8. Yürürlük</h4>
<p>Bu Etik İlkeler, hangel tarafından yayımlandığı tarihte yürürlüğe girer ve daha sonra yapılacak güncellemelerle birlikte platformda erişilebilir kılınır. Yürürlükteki metin, önceki tüm etik beyanların yerini alır.</p>

<p class="text-xs text-muted-foreground"><em>Bu metin bilgilendirme amaçlıdır ve bağlayıcı nihai hukuki görüş niteliği taşımaz; yürürlük öncesi yetkili hukuk danışmanlığı önerilir.</em></p>
    `
  },
  {
    slug: 'cikar-catismasi-politikasi',
    title: 'Çıkar Çatışması Politikası',
    content: `
      <h3>Çıkar Çatışması Politikası</h3>

<p>İşbu Çıkar Çatışması Politikası, hangel platformunu işleten <strong>hangel AŞ</strong> bünyesindeki yönetim kurulu üyeleri, yöneticiler, çalışanlar, gönüllüler ve karar süreçlerine katılan tüm kişilerin, kişisel menfaatleri ile hangel'in ve platform paydaşlarının menfaatlerinin çatıştığı durumlarda nasıl davranacağını düzenler. Toplumsal etki, bağış aktarımı ve kamu güveni üzerine kurulu bir platform olarak hangel, çıkar çatışmalarının şeffaf biçimde yönetilmesini kurumsal bütünlüğün ön koşulu sayar. Bu metnin esas dili Türkçedir; uluslararası çerçeve atıfları İngilizce terimler içerebilir.</p>

<h4>1. Amaç ve İlkeler</h4>
<p>Bu politikanın amacı; karar alma süreçlerinin tarafsızlığını korumak, haksız menfaat sağlanmasını önlemek ve paydaş güvenini sürdürmektir. Temel ilkeler: çatışmanın <strong>beyanı</strong>, çatışmalı konularda <strong>müzakere ve oylamadan çekilme</strong>, ve sürecin <strong>kayıt altına alınması</strong>dır. Çıkar çatışmasının varlığı tek başına etik ihlal sayılmaz; gizlenmesi veya kötüye kullanılması ihlaldir. Çıkar çatışması; <em>fiili</em> (halihazırda mevcut), <em>potansiyel</em> (ileride doğabilecek) veya <em>algısal</em> (üçüncü kişilerce çatışma izlenimi uyandıran) biçimlerde ortaya çıkabilir. hangel, bu üç türü de beyan ve şeffaflık yükümlülüğü kapsamında değerlendirir; zira bir kararın tarafsızlığına ilişkin güven, yalnızca gerçek çatışmaların değil, çatışma algısının da uygun biçimde yönetilmesiyle korunur.</p>

<h4>2. Kapsam ve Paydaşlar</h4>
<p>Politika; hangel AŞ yönetim kurulu üyelerini, üst düzey yöneticileri, çalışanları, gönüllüleri, danışmanları ve tedarikçi seçimi, bağış tahsisi, kuruluş onayı gibi kararlara katılan herkesi kapsar. Çıkar çatışması; finansal menfaat, akrabalık/yakınlık ilişkileri, rakip veya tedarikçi kuruluşlarla bağlantı, hediye/ağırlama ve platformdaki bir kuruluşla kişisel ilişki gibi biçimlerde ortaya çıkabilir. Örneğin; bir yöneticinin yakınının yöneticisi olduğu bir derneğin platformda öne çıkarılmasına karar verilmesi, bir çalışanın hissedarı olduğu bir tedarikçiden hizmet alınması veya bağış tahsisinde kişisel bir ilişkinin gözetilmesi, bu politika kapsamında ele alınması gereken durumlardır. Platformun bağış aktarımı ve kuruluş değerlendirmesi gibi kamu güvenine dayanan işlevleri, çıkar çatışması yönetimini özellikle kritik kılar.</p>

<h4>3. Referans Çerçeve</h4>
<p>Bu politika aşağıdaki ulusal mevzuat ve uluslararası ilkelerden beslenir:</p>
<ul>
<li><strong>6102 sayılı Türk Ticaret Kanunu m.393</strong> — yönetim kurulu üyesinin; kendisinin veya alt/üst soyundan birinin, eşinin ya da üçüncü dereceye kadar (bu derece dâhil) kan ve kayın hısımlarının kişisel ve şirket dışı menfaatinin şirket menfaatiyle çatıştığı konulara ilişkin müzakerelere <strong>katılamayacağı</strong>; tereddütlü hâllerde kararın yönetim kurulunca verileceği (ilgili üye bu oylamaya da katılamaz) ve menfaat çatışması bilinmese dahi üyenin durumu <strong>açıklama yükümlülüğü</strong> ile yasağa aykırılık hâlindeki tazmin sorumluluğu; katılmama sebebinin ve ilgili işlemlerin <strong>yönetim kurulu kararına yazılması</strong>;</li>
<li><strong>OECD Corporate Governance ilkeleri (G20/OECD Principles of Corporate Governance)</strong> — yönetim kurulunun çıkar çatışmalarını yönetme, ilişkili taraf işlemlerini şeffaflaştırma ve nesnel karar alma sorumluluğu (referans olarak; sertifika değil).</li>
</ul>

<h4>4. Davranış Kuralları ve Yasaklar — Beyan, Çekilme, Kayıt</h4>
<p>İlgili kişiler aşağıdaki kademeli yükümlülüklere uyar:</p>
<table class="w-full border-collapse border border-gray-200 my-4">
<thead>
<tr>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Aşama</th>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Yükümlülük</th>
</tr>
</thead>
<tbody>
<tr>
<td class="border border-gray-200 p-2 text-sm">Beyan</td>
<td class="border border-gray-200 p-2 text-sm">Fiili veya potansiyel çatışma fark edilir edilmez derhal yazılı olarak ilgili organa bildirilir; çatışma bilinmese dahi açıklama yapılır.</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Çekilme</td>
<td class="border border-gray-200 p-2 text-sm">İlgili kişi, çatışmalı konunun müzakeresine ve oylamasına katılmaz; toplantıdan ayrılır.</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Kayıt</td>
<td class="border border-gray-200 p-2 text-sm">Beyan, çekilme ve gerekçesi yönetim kurulu/karar kayıtlarına işlenir ve saklanır.</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">İzleme</td>
<td class="border border-gray-200 p-2 text-sm">Kararın menfaat çatışmasından etkilenmediği bağımsız biçimde teyit edilir.</td>
</tr>
</tbody>
</table>
<p><strong>Yasaklar:</strong> Çatışmayı gizlemek; çatışmalı oylamaya katılmak; konumu kullanarak kendine veya yakınına haksız menfaat sağlamak; usulsüz hediye/ağırlama kabul etmek; gizli bilgiyi kişisel çıkar için kullanmak yasaktır.</p>

<h4>5. Roller, Sorumluluklar ve Yönetişim Yapısı</h4>
<p>Politikanın uygulanmasından hangel AŞ yönetim kurulu sorumludur. Beyanlar, yönetim kurulu sekretaryası veya görevlendirilen uyum sorumlusu tarafından kayda alınır ve gizli tutulur. Üst düzey yöneticilerin çatışmaları yönetim kuruluna, çalışan ve gönüllülerin çatışmaları bağlı bulundukları yöneticiye bildirilir. hangel, düzenli aralıklarla çıkar çatışması beyan formu toplamayı ve göreve başlama ile önemli karar süreçleri öncesinde beyan istemeyi hedefler. Beyan edilen çatışmalara ilişkin alınan önlemler (çekilme, bağımsız değerlendirme, kararın yeniden gözden geçirilmesi) belgelendirilir. Beyanların gizliliği esas olmakla birlikte, kararın meşruiyetini korumak amacıyla ilgili çatışmanın yönetim organına şeffaf biçimde aktarılması gerekir; bu iki gereklilik arasındaki denge, yalnızca karara etkisi olan bilgilerin paylaşılması yoluyla sağlanır.</p>

<h4>6. İhbar / İhlal Bildirimi ve Yaptırım</h4>
<p>Gizlenmiş veya kötüye kullanılmış çıkar çatışmaları, hangel <em>Whistleblower (İhbarcı) Politikası</em>'nda tanımlanan gizli kanallar üzerinden bildirilebilir. İhlal tespit edilirse; kararın iptali/gözden geçirilmesi, uyarı, görevden alma, sözleşme feshi ve TTK m.393 kapsamında doğan zararlar için tazmin talebi dahil yaptırımlar uygulanabilir. İyi niyetli bildirimde bulunana misilleme yasaktır.</p>

<h4>7. İzleme ve Gözden Geçirme</h4>
<p>hangel, bu politikayı en az yılda bir kez ve mevzuat değişikliklerinde gözden geçirmeyi taahhüt eder. Gözden geçirme sırasında, gelen beyanların ve yaşanan vakaların (kişisel veri korunarak) eğilimleri değerlendirilir ve politika gerektiğinde güçlendirilir. Politika kapsamındaki kişisel veriler 6698 sayılı KVKK'ya uygun olarak işlenir; başvurular için <a href="mailto:kvkk@hangel.org">kvkk@hangel.org</a>, etik ve uyum konuları için <a href="mailto:dpo@hangel.org">dpo@hangel.org</a> kullanılabilir.</p>

<h4>8. Yürürlük</h4>
<p>Bu Çıkar Çatışması Politikası, yayımlandığı tarihte yürürlüğe girer ve hangel'in iç yönetişim belgelerinin ayrılmaz parçasıdır.</p>

<p class="text-xs text-muted-foreground"><em>Bu metin bilgilendirme amaçlıdır ve bağlayıcı nihai hukuki görüş niteliği taşımaz; yürürlük öncesi yetkili hukuk danışmanlığı önerilir.</em></p>
    `
  },
  {
    slug: 'whistleblower-politikasi',
    title: 'Whistleblower (İhbarcı) Politikası',
    content: `
      <h3>Whistleblower (İhbarcı) Politikası</h3>

<p>İşbu Whistleblower (İhbarcı) Politikası, hangel platformunu işleten <strong>hangel AŞ</strong> bünyesinde ve platform ekosisteminde gerçekleşen hukuka aykırılıkların, etik ihlallerin, yolsuzluğun, veri ihlallerinin ve kötüye kullanımların güvenli ve gizli biçimde bildirilmesini sağlamak; bildirimde bulunan kişileri misillemeye karşı korumak amacıyla hazırlanmıştır. hangel, kan eşleştirme, bağış aktarımı ve sivil toplum hizmetleri gibi yüksek güven gerektiren alanlarda faaliyet gösterdiğinden, ihbar mekanizmalarını kurumsal dürüstlüğün koruyucu bir unsuru olarak görür. Bu metnin esas dili Türkçedir; uluslararası çerçeve atıfları İngilizce terimler içerebilir.</p>

<h4>1. Amaç ve İlkeler</h4>
<p>Bu politikanın amacı; ihlalleri erken aşamada tespit etmek, düzeltici önlem almak ve iyi niyetli ihbarcıyı korumaktır. Temel ilkeler: <strong>güvenli ve gizli bildirim kanalı</strong>, <strong>misilleme yasağı</strong>, <strong>adil ve tarafsız soruşturma</strong> ve <strong>iyi niyet karinesi</strong>dir. İyi niyetle yapılan bildirim, sonradan asılsız çıksa dahi bildirimde bulunana zarar veremez. İhbar mekanizması, suçlamaların cezalandırılmasını değil, sorunların açığa çıkmasını ve giderilmesini amaçlayan koruyucu bir araçtır; çalışan ve gönüllülerin sorunları yönetimle güvenle paylaşabilmesi, sağlıklı bir kurum kültürünün temel göstergesidir. hangel, sessiz kalmanın değil, dürüstçe konuşmanın takdir gördüğü bir ortam oluşturmayı hedefler.</p>

<h4>2. Kapsam ve Paydaşlar</h4>
<p>Politika; hangel AŞ çalışanlarını, yöneticilerini, gönüllülerini, stajyerlerini, tedarikçilerini, eski çalışanlarını ve platform üzerindeki kuruluş temsilcileri ile bağışçıları kapsar. Henüz iş ilişkisi başlamamış adaylar ile ilişkisi sona ermiş kişilerin, edindikleri bilgilere dayanan iyi niyetli bildirimleri de bu politikanın koruması altındadır. Bildirilebilecek konular arasında; yolsuzluk ve rüşvet, mali usulsüzlük, bağış kaynaklarının kötüye kullanımı, kişisel veri ihlalleri (özellikle sağlık verisi), ayrımcılık, taciz, iş sağlığı ve güvenliği ihlalleri, çıkar çatışmasının gizlenmesi ve yürürlükteki mevzuata aykırılıklar yer alır. Şüphenin makul bir temele dayanması yeterlidir; bildirimde bulunan kişinin iddiasını kesin biçimde ispatlaması beklenmez, soruşturma görevi hangel'e aittir.</p>

<h4>3. Referans Çerçeve</h4>
<p>Bu politika aşağıdaki uluslararası çerçevelerden ilham alır (referans olarak; hangel için bir sertifika oluşturmaz):</p>
<ul>
<li><strong>Directive (EU) 2019/1937</strong> — Birlik hukukunu ihlal eden fiilleri bildiren kişilerin korunmasına ilişkin AB Direktifi; iç ve dış bildirim kanalları kurulması, gizliliğin korunması, misillemeye karşı koruma ve misilleme iddialarında <em>ispat yükünün yer değiştirmesi</em> ilkelerini ortaya koyar;</li>
<li><strong>UN Global Compact</strong> — özellikle yolsuzlukla mücadele ilkesi (10. ilke) ve hesap verebilir kurumsal davranış beklentisi.</li>
</ul>
<p>hangel, Türkiye'de mukim bir tüzel kişi olarak yürürlükteki ulusal mevzuata tabidir; AB Direktifi'ni doğrudan uygulanabilir bir yükümlülük olarak değil, benimsenen <em>iyi uygulama referansı</em> olarak esas alır.</p>

<h4>4. Davranış Kuralları ve Yasaklar — Bildirim Kanalı</h4>
<p>Bildirimler aşağıdaki güvenli kanallar üzerinden yapılabilir; bildirimde bulunan kişi kimliğini açıklayabilir veya isimsiz kalmayı tercih edebilir:</p>
<table class="w-full border-collapse border border-gray-200 my-4">
<thead>
<tr>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Kanal</th>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Açıklama</th>
</tr>
</thead>
<tbody>
<tr>
<td class="border border-gray-200 p-2 text-sm">Gizli e-posta</td>
<td class="border border-gray-200 p-2 text-sm">Yalnızca yetkili uyum sorumlusunun erişebildiği gizli bir adres üzerinden bildirim.</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Çevrimiçi form</td>
<td class="border border-gray-200 p-2 text-sm">İsimsiz bildirime imkân tanıyan, şifrelenmiş web formu.</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Yazılı başvuru</td>
<td class="border border-gray-200 p-2 text-sm">Kapalı zarf usulüyle uyum sorumlusuna iletilen fiziki bildirim.</td>
</tr>
</tbody>
</table>
<p><strong>Yasaklar:</strong> Bildirimde bulunan kişinin kimliğini yetkisiz ifşa etmek; ona karşı işten çıkarma, görev değişikliği, baskı, dışlama veya itibar zedeleme gibi <strong>misilleme</strong> uygulamak; kasıtlı olarak asılsız ve kötü niyetli ihbarda bulunmak yasaktır. Misilleme iddiası hâlinde, aksini ispat yükü işveren/ilgili tarafa aittir.</p>

<h4>5. Roller, Sorumluluklar ve Soruşturma Süreci</h4>
<p>Bildirimler, bağımsız hareket eden bir uyum sorumlusu/komite tarafından alınır. Süreç şu adımları izler: (i) bildirimin alındığına dair makul süre içinde geri bildirim; (ii) ön değerlendirme; (iii) gizlilik içinde tarafsız soruşturma; (iv) gerekiyorsa düzeltici/yaptırımsal önlem; (v) bildirimde bulunana, gizlilik ilkeleri çerçevesinde sonuç hakkında bilgilendirme. Bildirimin konusuyla menfaat ilişkisi bulunan kişiler soruşturma sürecinin dışında tutulur; böylece değerlendirmenin tarafsızlığı korunur. Soruşturmada masumiyet karinesi ve adil dinlenme hakkı korunur; hakkında bildirim yapılan kişiye, soruşturmanın bütünlüğünü tehlikeye atmayacak biçimde, savunma imkânı tanınır. İhbarcının kimliği, soruşturmanın yürütülmesi için zorunlu olmadıkça hiçbir aşamada paylaşılmaz. Süreçte işlenen kişisel veriler 6698 sayılı KVKK'ya uygun işlenir ve yalnızca soruşturma amacıyla, sınırlı yetkili kişilerce erişilebilir biçimde tutulur.</p>

<h4>6. İhbar / İhlal Bildirimi ve Yaptırım</h4>
<p>Doğrulanan ihlaller için; uyarı, görevden alma, sözleşme feshi, mali sorumluluk ve gerektiğinde adli/idari makamlara bildirim dahil yaptırımlar uygulanır. Misilleme uygulayan kişiler de ayrıca yaptırıma tabidir. Kötü niyetli ve bilerek asılsız bildirim yapan kişiler bu politikanın koruması dışında kalır.</p>

<h4>7. İzleme ve Gözden Geçirme</h4>
<p>hangel, ihbar kanallarının erişilebilirliğini ve etkinliğini düzenli olarak gözden geçirmeyi, istatistikleri (kimlik bilgisi içermeyecek biçimde) şeffaflık raporlarında paylaşmayı hedefler. Veri koruma başvuruları için <a href="mailto:kvkk@hangel.org">kvkk@hangel.org</a>, uyum konuları için <a href="mailto:dpo@hangel.org">dpo@hangel.org</a> kullanılabilir.</p>

<h4>8. Yürürlük</h4>
<p>Bu Whistleblower (İhbarcı) Politikası, yayımlandığı tarihte yürürlüğe girer ve hangel <em>Etik İlkeler</em> ile <em>Çıkar Çatışması Politikası</em> ile birlikte uygulanır.</p>

<p class="text-xs text-muted-foreground"><em>Bu metin bilgilendirme amaçlıdır ve bağlayıcı nihai hukuki görüş niteliği taşımaz; yürürlük öncesi yetkili hukuk danışmanlığı önerilir.</em></p>
    `
  },
  {
    slug: 'yonetim-ve-kurumsal-yonetisim-ilkeleri',
    title: 'Yönetim ve Kurumsal Yönetişim İlkeleri',
    content: `
      <h3>Yönetim ve Kurumsal Yönetişim İlkeleri</h3>

<p>İşbu Yönetim ve Kurumsal Yönetişim İlkeleri, hangel platformunu işleten <strong>hangel AŞ</strong>'nin yönetim yapısını, karar alma mekanizmalarını ve paydaşlarına karşı hesap verebilirlik taahhütlerini düzenler. Toplumsal etki odaklı bir platform olarak hangel; bağışçı, faydalanıcı, gönüllü ve sivil toplum paydaşlarının güvenini, ancak şeffaf, hesap verebilir ve adil bir yönetişimle sürdürebileceğinin bilincindedir. Bu metnin esas dili Türkçedir; uluslararası çerçeve atıfları İngilizce terimler içerebilir.</p>

<h4>1. Amaç ve İlkeler</h4>
<p>Bu metnin amacı, hangel'in yönetiminde uygulanan temel kurumsal yönetişim ilkelerini ortaya koymaktır. Dört temel ilke esas alınır:</p>
<ul>
<li><strong>Hesap verebilirlik:</strong> Yönetim organları, kararlarından ve performanslarından paydaşlara karşı sorumludur.</li>
<li><strong>Şeffaflık:</strong> Faaliyetler, finansal durum ve etki sonuçları zamanında, doğru ve anlaşılır biçimde açıklanır.</li>
<li><strong>Adil yönetim (eşitlik):</strong> Tüm paydaşlar ve hak sahipleri adil ve eşit muamele görür.</li>
<li><strong>Sorumluluk:</strong> Yönetim, mevzuata ve etik ilkelere uygun davranmakla yükümlüdür.</li>
</ul>
<p>Bu dört ilke, hangel'in toplumsal etki misyonu ile ticari sürdürülebilirliğini dengede tutmasını sağlayan çerçeveyi oluşturur. Hesap verebilirlik ve şeffaflık, bağışçıların ve faydalanıcıların platforma duyduğu güvenin temelini; adil yönetim ve sorumluluk ise paydaşlar arasındaki ilişkilerin meşruiyetini güvence altına alır. İlkeler, yalnızca yasal asgari yükümlülüklerin yerine getirilmesini değil, iyi yönetişimin kurumsal bir değer olarak benimsenmesini hedefler.</p>

<h4>2. Kapsam ve Paydaşlar</h4>
<p>İlkeler; hangel AŞ genel kurulu, yönetim kurulu, üst yönetimi, çalışanları ve gönüllülerini bağlar. Paydaşlar; bağışçılar, faydalanıcılar, platformdaki dernek/vakıf/sosyal işletmeler, marka üyeleri, öğrenci kulüpleri, kamu kurumları ve genel kamuoyudur. Paydaş haklarının korunması yönetişimin merkezindedir. hangel, klasik bir ticari ortaklıktan farklı olarak, hissedar menfaatinin yanında geniş bir toplumsal paydaş kitlesinin menfaatini de gözeten bir yönetişim anlayışını benimser. Bu nedenle kararlar alınırken, kısa vadeli ticari kazanç ile uzun vadeli toplumsal güven arasındaki denge özellikle gözetilir.</p>

<h4>3. Referans Çerçeve</h4>
<p>hangel'in yönetişim anlayışı aşağıdaki ulusal mevzuat ve uluslararası ilkelerden beslenir:</p>
<ul>
<li><strong>6102 sayılı Türk Ticaret Kanunu (TTK)</strong> — anonim şirketin organ yapısı, yönetim kurulunun görev ve sorumlulukları, özen ve bağlılık yükümlülüğü; menfaat çatışmasında müzakereye katılma yasağı (m.393);</li>
<li><strong>G20/OECD Principles of Corporate Governance (2023 güncel metni)</strong> — pay/menfaat sahiplerinin hakları, eşit muamele, paydaş rolü, kamuyu aydınlatma ve şeffaflık, yönetim kurulu sorumlulukları (referans olarak; sertifika değil);</li>
<li><strong>SPK Kurumsal Yönetim İlkeleri</strong> — Sermaye Piyasası Kurulu tarafından yayımlanan ilkeler; hangel halka açık bir ortaklık olmamakla birlikte bu ilkeleri <em>gönüllü referans</em> olarak benimser.</li>
</ul>

<h4>4. Davranış Kuralları ve Yönetişim Yapısı</h4>
<p>hangel'in yönetişim mimarisi ve sorumluluk dağılımı aşağıdaki gibidir:</p>
<table class="w-full border-collapse border border-gray-200 my-4">
<thead>
<tr>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Organ / Rol</th>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Başlıca Sorumluluk</th>
</tr>
</thead>
<tbody>
<tr>
<td class="border border-gray-200 p-2 text-sm">Genel Kurul</td>
<td class="border border-gray-200 p-2 text-sm">TTK kapsamında devredilemez yetkiler; yönetim kurulunu seçme ve ibra.</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Yönetim Kurulu</td>
<td class="border border-gray-200 p-2 text-sm">Stratejik yönlendirme, gözetim, risk ve uyum, menfaat çatışmasının yönetimi (m.393).</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Üst Yönetim</td>
<td class="border border-gray-200 p-2 text-sm">Günlük operasyonların yürütülmesi, politikaların uygulanması.</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Uyum / Etik İşlevi</td>
<td class="border border-gray-200 p-2 text-sm">Etik ilkeler, ihbar kanalı ve veri koruma uyumunun gözetimi.</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Veri Koruma Sorumlusu</td>
<td class="border border-gray-200 p-2 text-sm">KVKK/GDPR uyumu, ilgili kişi başvurularının yönetimi.</td>
</tr>
</tbody>
</table>
<p>Yönetim kurulu üyeleri, TTK'nın öngördüğü özen ve bağlılık yükümlülüğü çerçevesinde, şirket menfaatini gözeterek ve menfaat çatışmalarından kaçınarak hareket eder. Yönetim kurulu; stratejik hedeflerin belirlenmesi, üst yönetimin atanması ve gözetimi, risk yönetimi ve iç kontrol sistemlerinin etkinliğinin sağlanması ile mali raporlamanın doğruluğunun gözetiminden sorumludur. hangel, karar süreçlerinde belge düzenini ve izlenebilirliği esas alır; alınan kararlar gerekçeleriyle birlikte kayıt altına alınır. Yetki devirlerinde, devredilen yetkinin sınırları ve hesap verme yükümlülüğü açıkça tanımlanır.</p>

<h4>5. Roller, Sorumluluklar ve Paydaş Hakları</h4>
<p>hangel, paydaş haklarını korumayı taahhüt eder: bağışçıların doğru bilgilendirilme hakkı, faydalanıcıların adil ve ayrımcılıktan uzak hizmet alma hakkı, çalışan ve gönüllülerin güvenli çalışma ortamı hakkı, ve veri sahiplerinin 6698 sayılı KVKK kapsamındaki hakları. Kararlar alınırken paydaş menfaatleri dengeli biçimde gözetilir. Şeffaflık ilkesinin bir gereği olarak hangel, faaliyet sonuçlarını ve etki verilerini düzenli biçimde kamuoyuyla paylaşmayı hedefler; ancak bu paylaşımda kişisel verilerin korunması ve ticari sır dengesi gözetilir. Paydaşların görüş ve şikâyetlerini iletebileceği erişilebilir kanallar oluşturmak, iyi yönetişimin ayrılmaz bir parçası olarak benimsenir.</p>

<h4>6. İhbar / İhlal Bildirimi ve Yaptırım</h4>
<p>Yönetişim ilkelerine aykırılıklar, hangel <em>Whistleblower (İhbarcı) Politikası</em>'nda tanımlanan gizli kanallar üzerinden bildirilebilir. İhlaller; iç soruşturma, görevden alma, sözleşme feshi ve TTK kapsamında doğan sorumluluk için yasal yollar dahil yaptırımlara tabidir. İyi niyetli bildirimde bulunana misilleme yasaktır.</p>

<h4>7. İzleme ve Gözden Geçirme</h4>
<p>hangel, yönetişim ilkelerinin etkinliğini düzenli olarak değerlendirmeyi ve OECD ile SPK ilkelerindeki güncellemeler ışığında gözden geçirmeyi taahhüt eder. Yönetişime ilişkin görüşler <a href="mailto:dpo@hangel.org">dpo@hangel.org</a> adresine, veri koruma başvuruları <a href="mailto:kvkk@hangel.org">kvkk@hangel.org</a> adresine iletilebilir.</p>

<h4>8. Yürürlük</h4>
<p>Bu Yönetim ve Kurumsal Yönetişim İlkeleri, yayımlandığı tarihte yürürlüğe girer ve hangel'in iç yönetişim ile etik belgeleriyle bütünlük içinde uygulanır.</p>

<p class="text-xs text-muted-foreground"><em>Bu metin bilgilendirme amaçlıdır ve bağlayıcı nihai hukuki görüş niteliği taşımaz; yürürlük öncesi yetkili hukuk danışmanlığı önerilir.</em></p>
    `
  },
  {
    slug: 'kamu-yarari-ve-sosyal-fayda-beyani',
    title: 'Kamu Yararı ve Sosyal Fayda Statüsü Beyanı',
    content: `
      <h3>Kamu Yararı ve Sosyal Fayda Statüsü Beyanı</h3>

<p>İşbu Kamu Yararı ve Sosyal Fayda Statüsü Beyanı, hangel platformunu işleten <strong>hangel AŞ</strong>'nin faaliyetlerinin toplum yararına yöneldiğini ve sosyal fayda üretmeyi misyon edindiğini açıklamak amacıyla hazırlanmıştır. Bu beyan, hangel'in resmî bir statü iddiasında bulunma belgesi değildir; faaliyetlerin amaçsal yönelimini ve gelecekteki hedeflerini ortaya koyan bir taahhüt metnidir. Bu metnin esas dili Türkçedir; yararlanılan kavramsal çerçevelere atıflar yabancı terimler içerebilir.</p>

<blockquote>
<p><strong>Önemli açıklama:</strong> hangel, bu metinde herhangi bir resmî <em>"kamu yararına çalışan dernek"</em> veya benzeri resmî kamu yararı statüsüne sahip olduğunu <strong>iddia etmemektedir</strong>. Türk hukukunda kamu yararına çalışan dernek statüsü, 5253 sayılı Dernekler Kanunu uyarınca yalnızca <strong>Cumhurbaşkanı kararıyla</strong> verilen ayrı ve resmî bir statüdür. hangel bu statüye sahip değildir; bu metinde yalnızca faaliyetlerinin <strong>kamu yararına yönelik</strong> olduğu, misyon ve amaç düzeyinde ifade edilmektedir.</p>
</blockquote>

<h4>1. Amaç ve İlkeler</h4>
<p>Bu beyanın amacı, hangel'in varlık sebebinin ticari kazanç odaklı olmanın ötesinde toplumsal fayda üretmek olduğunu ortaya koymaktır. hangel; acil kan ihtiyacının hızlı eşleştirilmesi, şeffaf bağış aktarımı, gönüllülüğün yaygınlaştırılması ve sivil toplumun dijital kapasitesinin güçlendirilmesi yoluyla kamu yararına yönelik değer üretmeyi amaçlar. Bu amaç, hangel'in tüm karar ve önceliklerinde gözetilen bir ilkedir. Platform, bir araya getirdiği bağışçı, gönüllü, sivil toplum kuruluşu ve faydalanıcı kitlesi aracılığıyla, kamusal nitelikteki ihtiyaçların karşılanmasına dijital bir altyapı sunmayı hedefler. Bu yönelim, hangel'in ticari bir tüzel kişilik olarak faaliyet göstermesiyle çelişmez; aksine, sürdürülebilir bir iş modelinin toplumsal misyonun hizmetine sunulmasını ifade eder.</p>

<h4>2. Kapsam ve Paydaşlar</h4>
<p>Beyan; hangel AŞ'nin tüm faaliyetlerini ve platform üzerindeki dernek, vakıf, sosyal işletme, gönüllü, bağışçı ve faydalanıcı paydaşlarını kapsar. hangel, bu paydaşlarla birlikte oluşturduğu ekosistemin toplumsal etkisini en üst düzeye çıkarmayı hedefler.</p>

<h4>3. Referans Çerçeve</h4>
<p>Bu beyan, aşağıdaki ulusal mevzuat ve kavramsal çerçevelere referansla hazırlanmıştır:</p>
<ul>
<li><strong>5253 sayılı Dernekler Kanunu</strong> — kamu yararına çalışan dernek statüsünün Cumhurbaşkanı kararıyla verildiği resmî statü çerçevesi (hangel bu statüye sahip değildir; yalnızca çerçevenin tanımına atıf yapılmaktadır);</li>
<li><strong>4721 sayılı Türk Medeni Kanunu (TMK)</strong> — dernek ve vakıfların hukuki rejimi ile kamu yararına faaliyet kavramının genel hukuki çerçevesi;</li>
<li><strong>Birleşmiş Milletler Sürdürülebilir Kalkınma Amaçları (SKA/SDG)</strong> — özellikle sağlık, eşitsizliklerin azaltılması ve hedefler için ortaklıklar başlıkları (kavramsal referans olarak).</li>
</ul>

<h4>4. Davranış Kuralları ve Sosyal Fayda Taahhütleri</h4>
<p>hangel, sosyal fayda yönelimini aşağıdaki taahhütlerle somutlaştırmayı hedefler: faaliyetlerden elde edilen gelirin önceliklendirilmiş biçimde platformun toplumsal misyonuna yeniden yatırılması; bağış aktarımında şeffaflık; ayrımcılık yapılmaksızın hizmet sunumu; ve etki sonuçlarının kamuoyu ile paylaşılması. Bu taahhütler, resmî bir statünün doğurduğu yasal yükümlülükler olarak değil, hangel'in gönüllü misyon taahhütleri olarak ifade edilmektedir. hangel, kamuoyuna yönelik iletişiminde de bu çerçeveye sadık kalmayı; sahip olmadığı resmî statü, vergi muafiyeti veya kamu yararı tanınmasını ima edecek ifadelerden kaçınmayı taahhüt eder. Bağış toplama faaliyetlerinde, 2860 sayılı Yardım Toplama Kanunu kapsamındaki izin ve yükümlülüklerin ilgili kuruluşlara ait olduğu; hangel'in aracı/altyapı sağlayıcı rolünün bu sorumlulukları üstlenmediği esastır.</p>

<h4>5. Mevcut Durum ve Hedefler</h4>
<p>hangel'in kamu yararı ve sosyal fayda yönelimine ilişkin mevcut durumu ile yol haritası aşağıdaki tabloda gösterilmiştir. Bu tablo, hiçbir resmî statünün halihazırda elde edildiği anlamına gelmez; hedefleri ve taahhütleri yansıtır:</p>
<table class="w-full border-collapse border border-gray-200 my-4">
<thead>
<tr>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Alan</th>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Mevcut Durum</th>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Hedef</th>
</tr>
</thead>
<tbody>
<tr>
<td class="border border-gray-200 p-2 text-sm">Resmî kamu yararı statüsü</td>
<td class="border border-gray-200 p-2 text-sm">hangel, resmî "kamu yararına dernek" statüsüne sahip değildir; ticari tüzel kişilik (hangel AŞ) olarak faaliyet gösterir.</td>
<td class="border border-gray-200 p-2 text-sm">Faaliyetlerin kamu yararına yönelik niteliğini güçlendirmeyi ve uygun yapılarla sosyal fayda modellerini değerlendirmeyi hedefler.</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Etki raporlaması</td>
<td class="border border-gray-200 p-2 text-sm">Temel etki göstergeleri toplanmaktadır.</td>
<td class="border border-gray-200 p-2 text-sm">Düzenli, doğrulanabilir etki raporları yayımlamayı taahhüt eder.</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Sosyal fayda yönetişimi</td>
<td class="border border-gray-200 p-2 text-sm">Misyon, iç politikalarla ifade edilmektedir.</td>
<td class="border border-gray-200 p-2 text-sm">Bağımsız bir danışma/gözetim mekanizması kurmayı amaçlar.</td>
</tr>
</tbody>
</table>

<h4>6. İhbar / İhlal Bildirimi ve Şeffaflık</h4>
<p>hangel'in sosyal fayda taahhütlerine veya bu beyandaki ifadelere aykırı uygulamalar, <em>Whistleblower (İhbarcı) Politikası</em> kapsamındaki kanallar üzerinden bildirilebilir. hangel, bu beyandaki ifadelerin gerçeğe uygunluğunu korumayı ve yanıltıcı statü iddialarından kaçınmayı taahhüt eder.</p>

<h4>7. İzleme ve Gözden Geçirme</h4>
<p>hangel, bu beyanı düzenli olarak gözden geçirmeyi ve faaliyetlerinin toplumsal etkisini ölçen göstergeleri kamuoyuyla paylaşmayı hedefler. Beyana ilişkin görüşler <a href="mailto:dpo@hangel.org">dpo@hangel.org</a> adresine iletilebilir.</p>

<h4>8. Yürürlük</h4>
<p>Bu Kamu Yararı ve Sosyal Fayda Statüsü Beyanı, yayımlandığı tarihte yürürlüğe girer ve hangel'in yönetişim ile etik belgeleriyle birlikte yorumlanır. Beyan, herhangi bir resmî statünün varlığını teyit eden bir belge olarak yorumlanamaz.</p>

<p class="text-xs text-muted-foreground"><em>Bu metin bilgilendirme amaçlıdır ve bağlayıcı nihai hukuki görüş niteliği taşımaz; yürürlük öncesi yetkili hukuk danışmanlığı önerilir.</em></p>
    `
  },
  {
    slug: 'insan-haklari-politikasi',
    title: 'İnsan Hakları Politikası',
    content: `
      <h3>İnsan Hakları Politikası</h3>

<p>İşbu İnsan Hakları Politikası, hangel platformunu işleten <strong>hangel AŞ</strong>'nin, faaliyetlerinin her aşamasında insan haklarına saygı gösterme ve bu hakları koruma taahhüdünü ortaya koyar. Acil kan eşleştirmesi, bağış aktarımı, gönüllülük ve sivil toplum hizmetleri sunan bir platform olarak hangel, çalışmalarının doğrudan insan onuru ve temel haklarla iç içe olduğunun bilincindedir. Bu metnin esas dili Türkçedir; uluslararası çerçeve atıfları İngilizce terimler içerebilir.</p>

<h4>1. Amaç ve İlkeler</h4>
<p>Bu politikanın amacı, hangel'in tüm faaliyet ve ilişkilerinde insan haklarına saygıyı kurumsal bir ilke olarak yerleştirmektir. hangel'in hizmet verdiği alan, doğası gereği insan haklarıyla doğrudan temas eder: acil kan ihtiyacı yaşam hakkıyla, bağış süreçleri mülkiyet ve onurla, sağlık verisinin işlenmesi ise özel hayatın gizliliğiyle bağlantılıdır. Bu nedenle insan haklarına saygı, hangel için soyut bir taahhüt değil, günlük operasyonların ayrılmaz bir parçasıdır. Temel ilkeler:</p>
<ul>
<li><strong>İnsan onuruna saygı:</strong> Her birey, doğuştan sahip olduğu onur ve haklar temelinde değerlendirilir.</li>
<li><strong>Sıfır tolerans:</strong> Ayrımcılık, sömürü, zorla çalıştırma ve çocuk işçiliğine kesinlikle müsamaha gösterilmez.</li>
<li><strong>Durum tespiti (due diligence):</strong> İnsan hakları riskleri proaktif olarak belirlenir, önlenir ve giderilir.</li>
<li><strong>Erişim ve telafi:</strong> Olumsuz etkilenenler için etkili şikâyet ve telafi mekanizmaları sağlanması hedeflenir.</li>
</ul>

<h4>2. Kapsam ve Paydaşlar</h4>
<p>Politika; hangel AŞ çalışanlarını, yöneticilerini, gönüllülerini, tedarikçilerini ve platform üzerinde faaliyet gösteren tüm kuruluşları kapsar. Paydaşlar; faydalanıcılar (kan/bağış talep edenler), bağışçılar, gönüllüler, çalışanlar, tedarik zinciri aktörleri ve içinde faaliyet gösterilen toplumlardır. Politika, hangel'in iş ilişkileri yoluyla bağlantılı olduğu insan hakları etkilerini de gözetir. UNGP çerçevesinin öngördüğü üzere, hangel yalnızca kendi faaliyetlerinin doğrudan yol açtığı etkilerden değil, iş ilişkileri aracılığıyla katkıda bulunduğu veya bağlantılı olduğu olumsuz etkilerden de sorumluluk duyar. Bu kapsamda, özellikle kırılgan durumdaki bireylerin (acil sağlık ihtiyacı içindeki kişiler, çocuklar, dezavantajlı gruplar) korunmasına özel önem verilir.</p>

<h4>3. Referans Çerçeve</h4>
<p>hangel'in insan hakları anlayışı aşağıdaki uluslararası belgelere dayanır (referans olarak benimsenir; sertifika oluşturmaz):</p>
<ul>
<li><strong>Birleşmiş Milletler İnsan Hakları Evrensel Beyannamesi (1948)</strong> — başta m.1 (onur ve haklarda eşitlik), m.2 (ayrımcılık yasağı), m.4 (kölelik ve kulluk yasağı) ve m.23 (çalışma hakkı);</li>
<li><strong>UN Guiding Principles on Business and Human Rights (UNGP — Ruggie İlkeleri)</strong> — "koru, saygı göster, telafi et" çerçevesi; işletmelerin insan haklarına saygı sorumluluğu ve insan hakları durum tespiti (human rights due diligence);</li>
<li><strong>ILO Temel Sözleşmeleri</strong> — örgütlenme ve toplu pazarlık özgürlüğü (No. 87 ve 98), zorla çalıştırmanın yasaklanması (No. 29 ve 105), çocuk işçiliğinin önlenmesi (No. 138 ve 182) ve ayrımcılığın yasaklanması (No. 100 ve 111).</li>
</ul>
<p>hangel, ayrıca ulusal düzeyde Anayasa'nın temel hak ve özgürlükler düzenlemeleri ile 4857 sayılı İş Kanunu'nun ilgili hükümlerine uygun hareket eder.</p>

<h4>4. Davranış Kuralları ve Yasaklar</h4>
<p>hangel ve paydaşları aşağıdaki yasaklara mutlak biçimde uyar:</p>
<table class="w-full border-collapse border border-gray-200 my-4">
<thead>
<tr>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Alan</th>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Taahhüt / Yasak</th>
</tr>
</thead>
<tbody>
<tr>
<td class="border border-gray-200 p-2 text-sm">Ayrımcılık</td>
<td class="border border-gray-200 p-2 text-sm">Dil, din, ırk, etnik köken, cinsiyet, engellilik, sağlık durumu (kan grubu dahil) veya yaş temelli ayrımcılık yasaktır.</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Zorla çalıştırma</td>
<td class="border border-gray-200 p-2 text-sm">Her türlü zorla veya zorunlu çalıştırma ve insan ticareti yasaktır.</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Çocuk işçiliği</td>
<td class="border border-gray-200 p-2 text-sm">Çocuk işçiliğine sıfır tolerans; çocukların korunmasına özel önem.</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Sömürü ve taciz</td>
<td class="border border-gray-200 p-2 text-sm">Faydalanıcıların kırılgan durumunun sömürülmesi, taciz ve kötü muamele yasaktır.</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Mahremiyet</td>
<td class="border border-gray-200 p-2 text-sm">Özel hayatın gizliliği ve sağlık verisinin korunması esastır (6698 sayılı KVKK ile bağlantılı).</td>
</tr>
</tbody>
</table>

<h4>5. Roller, Sorumluluklar ve İnsan Hakları Durum Tespiti</h4>
<p>Politikanın uygulanmasından hangel AŞ yönetimi sorumludur. hangel, UNGP doğrultusunda insan hakları durum tespiti (due diligence) yaklaşımını benimsemeyi hedefler: olumsuz etkilerin belirlenmesi, önlenmesi/azaltılması, alınan önlemlerin izlenmesi ve sonuçların raporlanması. Faaliyetlerde, özellikle kırılgan grupları etkileyen alanlarda risk değerlendirmesi yapılması amaçlanır. Durum tespiti süreci tek seferlik değil, süreklilik gösteren bir döngü olarak tasarlanır; yeni hizmetler, ortaklıklar veya coğrafyalar devreye girdiğinde insan hakları etkileri yeniden değerlendirilir. hangel, tedarikçi ve iş ortaklarından da bu politikayla bağdaşır standartlara uymalarını bekler ve bu beklentiyi sözleşmesel ilişkilerine yansıtmayı hedefler. Olumsuz bir etkiye neden olunması veya katkıda bulunulması hâlinde, etkilenen kişilere yönelik telafi mekanizmalarının sağlanması amaçlanır.</p>

<h4>6. İhbar / İhlal Bildirimi ve Yaptırım</h4>
<p>İnsan hakları ihlalleri, hangel <em>Whistleblower (İhbarcı) Politikası</em>'nda tanımlanan gizli ve güvenli kanallar üzerinden bildirilebilir. İyi niyetli bildirimde bulunana misilleme yasaktır. İhlaller; düzeltici önlem, sözleşme feshi, iş ilişkisinin sonlandırılması ve gerektiğinde yetkili makamlara bildirim dahil yaptırımlara tabidir.</p>

<h4>7. İzleme ve Gözden Geçirme</h4>
<p>hangel, bu politikanın etkinliğini düzenli olarak gözden geçirmeyi, insan hakları etkilerini izlemeyi ve şeffaflık raporlarında paylaşmayı taahhüt eder. Politikaya ilişkin görüşler <a href="mailto:dpo@hangel.org">dpo@hangel.org</a> adresine, veri koruma başvuruları <a href="mailto:kvkk@hangel.org">kvkk@hangel.org</a> adresine iletilebilir.</p>

<h4>8. Yürürlük</h4>
<p>Bu İnsan Hakları Politikası, yayımlandığı tarihte yürürlüğe girer ve hangel <em>Etik İlkeler</em> ile <em>DEI Politikası</em> ile birlikte bütünlük içinde uygulanır.</p>

<p class="text-xs text-muted-foreground"><em>Bu metin bilgilendirme amaçlıdır ve bağlayıcı nihai hukuki görüş niteliği taşımaz; yürürlük öncesi yetkili hukuk danışmanlığı önerilir.</em></p>
    `
  },
  {
    slug: 'dei-politikasi',
    title: 'DEI Politikası',
    content: `
      <h3>DEI Politikası</h3>

<p>İşbu DEI Politikası (Çeşitlilik, Hakkaniyet ve Kapsayıcılık — Diversity, Equity, Inclusion), hangel platformunu işleten <strong>hangel AŞ</strong>'nin; işe alım, terfi, çalışma ortamı ve topluluk yönetimi süreçlerinde çeşitliliği gözetme, hakkaniyeti sağlama ve kapsayıcı bir kültür oluşturma taahhüdünü düzenler. Toplumsal etki odaklı bir platform olarak hangel, ürettiği değerin ancak farklı kimlik, deneyim ve perspektiflerin eşit biçimde temsil edildiği bir yapıyla sürdürülebileceğine inanır. Bu metnin esas dili Türkçedir; uluslararası çerçeve atıfları İngilizce terimler içerebilir.</p>

<h4>1. Amaç ve İlkeler</h4>
<p>Bu politikanın amacı, hangel'in tüm süreçlerinde ayrımcılığı önlemek ve kapsayıcı bir ortam oluşturmaktır. Üç temel kavram esas alınır:</p>
<ul>
<li><strong>Çeşitlilik (Diversity):</strong> Farklı cinsiyet, yaş, etnik köken, inanç, engellilik durumu ve sosyoekonomik geçmişe sahip bireylerin temsili.</li>
<li><strong>Hakkaniyet (Equity):</strong> Herkese aynı muamele değil, ihtiyaçlara duyarlı, adil fırsat ve kaynak dağılımı.</li>
<li><strong>Kapsayıcılık (Inclusion):</strong> Her bireyin kendini ait hissettiği, görüşünün değerli sayıldığı bir ortam.</li>
</ul>
<p>hangel, çeşitliliğin yalnızca etik bir gereklilik değil, aynı zamanda daha iyi kararlar almayı ve daha geniş bir topluma hizmet edebilmeyi sağlayan bir değer olduğuna inanır. Farklı geçmişlerden gelen bireylerin bir araya gelmesi, platformun hizmet ettiği toplumun çeşitliliğini de daha iyi yansıtmasını sağlar. Hakkaniyet ilkesi, sistemden kaynaklanan dezavantajların farkında olmayı ve fırsat eşitliğini gerçek anlamda sağlamak için gerektiğinde ek destek sunmayı içerir.</p>

<h4>2. Kapsam ve Paydaşlar</h4>
<p>Politika; hangel AŞ'nin işe alım, performans değerlendirme, terfi, ücretlendirme ve çalışma ortamı süreçlerini; gönüllü kabul ve görevlendirmelerini; ve platform üzerindeki topluluk/içerik yönetimini kapsar. Paydaşlar; çalışanlar, adaylar, gönüllüler, faydalanıcılar, bağışçılar ve platform topluluğunun tüm üyeleridir. DEI ilkeleri yalnızca kurum içi insan kaynakları süreçleriyle sınırlı değildir; platformun sunduğu hizmetlere erişimde de eşitliği ve kapsayıcılığı kapsar. Örneğin acil kan eşleştirmesi ve bağış hizmetleri, korunan hiçbir özelliğe dayalı ayrım gözetilmeksizin tüm faydalanıcılara açıktır.</p>

<h4>3. Referans Çerçeve</h4>
<p>hangel'in DEI yaklaşımı aşağıdaki ulusal mevzuat ve uluslararası çerçevelere dayanır:</p>
<ul>
<li><strong>Anayasa m.10</strong> — kanun önünde eşitlik ilkesi; herkesin dil, ırk, renk, cinsiyet, siyasi düşünce, felsefi inanç, din, mezhep ve benzeri sebeplerle ayrım gözetilmeksizin eşit olması;</li>
<li><strong>6701 sayılı Türkiye İnsan Hakları ve Eşitlik Kurumu Kanunu</strong> — eşit muamele hakkı, ayrımcılık yasağı ve gerçek/özel hukuk tüzel kişilerinin yetki alanlarında ayrımcılığı tespit edip ortadan kaldırma yükümlülüğü; Türkiye İnsan Hakları ve Eşitlik Kurumu'na (TİHEK) başvuru imkânı;</li>
<li><strong>Birleşmiş Milletler Sürdürülebilir Kalkınma Amaçları (SKA/SDG)</strong> — özellikle <strong>SKA 5</strong> (toplumsal cinsiyet eşitliği) ve <strong>SKA 10</strong> (eşitsizliklerin azaltılması) (kavramsal referans olarak; sertifika değil).</li>
</ul>
<p>Bu çerçeveler, hangel'in DEI yaklaşımının yerleşik ulusal hukuk ve uluslararası kabul görmüş hedeflerle uyumlu olmasını sağlar. hangel'in bu çerçeveleri benimsemesi, resmî bir akreditasyon, üyelik veya dış denetim sonucunu ifade etmez; söz konusu ilkelere gönüllü bağlılık anlamına gelir. Doğrudan ayrımcılık kadar, görünüşte tarafsız bir kuralın belirli grupları orantısız biçimde dezavantajlı duruma düşürdüğü dolaylı ayrımcılık da bu politikanın kapsamındadır; hangel, süreçlerini bu açıdan da gözden geçirmeyi hedefler.</p>

<h4>4. Davranış Kuralları ve Uygulama Alanları</h4>
<p>hangel, DEI ilkelerini aşağıdaki süreçlerde somutlaştırmayı taahhüt eder:</p>
<table class="w-full border-collapse border border-gray-200 my-4">
<thead>
<tr>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Süreç</th>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">DEI Uygulaması</th>
</tr>
</thead>
<tbody>
<tr>
<td class="border border-gray-200 p-2 text-sm">İşe alım</td>
<td class="border border-gray-200 p-2 text-sm">Liyakat esaslı, önyargısız ilan ve değerlendirme; ayrımcı kriterlerden kaçınma.</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Terfi ve gelişim</td>
<td class="border border-gray-200 p-2 text-sm">Nesnel kriterlere dayalı, fırsat eşitliğini gözeten kariyer ilerlemesi.</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Ücretlendirme</td>
<td class="border border-gray-200 p-2 text-sm">Eşit işe eşit ücret ilkesinin gözetilmesi.</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Erişilebilirlik</td>
<td class="border border-gray-200 p-2 text-sm">Engelli bireyler için makul uyumlaştırma ve erişilebilir platform hedefi.</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Topluluk yönetimi</td>
<td class="border border-gray-200 p-2 text-sm">Nefret söylemi ve ayrımcı içerikle mücadele; kapsayıcı dil kullanımı.</td>
</tr>
</tbody>
</table>
<p><strong>Yasaklar:</strong> Korunan özellikler temelinde doğrudan/dolaylı ayrımcılık, taciz, mobbing ve dışlama yasaktır.</p>

<h4>5. Roller, Sorumluluklar ve Yönetişim Yapısı</h4>
<p>Politikanın uygulanmasından hangel AŞ yönetimi ve insan kaynakları işlevi sorumludur. Yöneticiler, ekiplerinde kapsayıcı bir kültür oluşturmak ve ayrımcılık vakalarına müdahale etmekle görevlidir. hangel, DEI hedeflerine ilişkin göstergeleri izlemeyi ve düzenli olarak değerlendirmeyi hedefler. 6701 sayılı Kanun'un öngördüğü üzere, gerçek ve özel hukuk tüzel kişileri yetki alanlarında ayrımcılığı tespit etmek, ortadan kaldırmak ve eşitliği sağlamak için gerekli önlemleri almakla yükümlüdür; hangel bu yükümlülüğü içselleştirir. Çeşitliliğe ilişkin verilerin toplanması ve değerlendirilmesi, ilgili kişilerin açık rızasına ve kişisel verilerin korunmasına ilişkin ilkelere uygun biçimde, gönüllülük esasıyla yürütülür.</p>

<h4>6. İhbar / İhlal Bildirimi ve Yaptırım</h4>
<p>Ayrımcılık ve DEI ihlalleri, hangel <em>Whistleblower (İhbarcı) Politikası</em>'nda tanımlanan gizli kanallar üzerinden bildirilebilir; ayrıca ilgili kişiler 6701 sayılı Kanun kapsamında TİHEK'e başvurabilir. İyi niyetli bildirimde bulunana misilleme yasaktır. İhlaller; uyarı, eğitim, görev değişikliği, sözleşme feshi ve yasal yollar dahil yaptırımlara tabidir.</p>

<h4>7. İzleme ve Gözden Geçirme</h4>
<p>hangel, DEI politikasının etkinliğini düzenli olarak değerlendirmeyi, çeşitlilik göstergelerini (kişisel veri korunarak) izlemeyi ve ilerlemeyi şeffaflık raporlarında paylaşmayı taahhüt eder. Politikaya ilişkin görüşler <a href="mailto:dpo@hangel.org">dpo@hangel.org</a> adresine, veri koruma başvuruları <a href="mailto:kvkk@hangel.org">kvkk@hangel.org</a> adresine iletilebilir.</p>

<h4>8. Yürürlük</h4>
<p>Bu DEI Politikası, yayımlandığı tarihte yürürlüğe girer ve hangel <em>İnsan Hakları Politikası</em> ile <em>Etik İlkeler</em> ile birlikte bütünlük içinde uygulanır.</p>

<p class="text-xs text-muted-foreground"><em>Bu metin bilgilendirme amaçlıdır ve bağlayıcı nihai hukuki görüş niteliği taşımaz; yürürlük öncesi yetkili hukuk danışmanlığı önerilir.</em></p>
    `
  },
  {
    slug: 'risk-yonetimi-ve-kriz-mudahale-politikasi',
    title: 'Risk Yönetimi ve Kriz Müdahale Politikası',
    content: `
      <h3>Risk Yönetimi ve Kriz Müdahale Politikası</h3>

<p>İşbu Risk Yönetimi ve Kriz Müdahale Politikası, hangel platformunu işleten <strong>hangel AŞ</strong> tarafından, faaliyetlerine ilişkin risklerin sistematik biçimde tanımlanması, değerlendirilmesi, izlenmesi ve azaltılması ile olağanüstü durumlarda paydaş güvenliğini önceleyen bir kriz müdahale çerçevesi oluşturmak amacıyla hazırlanmıştır. hangel; acil kan talebi/eşleştirme, bağış, gönüllülük ve toplumsal etki hizmetleri sunduğundan, hizmet sürekliliği ve paydaş güvenliği doğrudan toplumsal sonuç doğuran kritik unsurlardır. Bu metnin esas dili Türkçedir; uluslararası çerçevelere atıflar İngilizce ifadeler içerebilir.</p>

<h4>1. Amaç ve İlkeler</h4>
<p>Bu Politikanın amacı; hangel'in karşılaşabileceği finansal, itibari, hukuki, operasyonel ve teknolojik riskleri öngörülebilir kılmak, bunlara karşı önleyici ve müdahale edici tedbirleri tanımlamak ve kriz durumlarında hızlı, koordineli ve sorumlu bir yanıt verebilmektir. Temel ilkeler şunlardır: <strong>(i) paydaş güvenliğinin önceliği</strong> — özellikle kan/sağlık verisi ve acil ihtiyaç süreçlerinde insan güvenliği her zaman önceliklidir; (ii) orantılılık — alınan tedbir, riskin olasılık ve etkisiyle orantılıdır; (iii) şeffaflık ve hesap verebilirlik; (iv) süreklilik — kritik hizmetlerin kesintiye uğramaması esastır.</p>

<h4>2. Kapsam ve Paydaşlar</h4>
<p>Bu Politika; hangel AŞ'nin tüm yönetim organlarını, çalışanlarını, gönüllülerini ve platform üzerinden hizmet sunan ya da hizmetten yararlanan kullanıcı, kuruluş, bağışçı ve iş ortaklarını kapsar. İlgili paydaşlar; kan talebinde bulunan ve bağışçı eşleştirilen kullanıcılar, bağışçılar, STK/dernek/vakıflar, marka ve kurumsal ortaklar, altyapı sağlayıcıları (Google Cloud / Firebase, Apple) ve düzenleyici makamlardır.</p>

<h4>3. Referans Çerçeveler</h4>
<p>hangel'in risk yönetimi yaklaşımı aşağıdaki uluslararası çerçevelerden ilham alır. Bu çerçeveler <strong>referans</strong> olarak benimsenmiş olup hangel'in bu standartlarda <strong>sertifikalı ya da akredite olduğu anlamına gelmez</strong>:</p>
<ul>
<li><strong>ISO 31000 (Risk Management — Guidelines)</strong> — risk yönetiminin ilke, çerçeve ve süreç boyutlarını tanımlayan uluslararası kılavuz; risk tanımlama, analiz, değerlendirme ve işleme döngüsünün temelini oluşturur;</li>
<li><strong>COSO ERM Framework (Enterprise Risk Management — Integrating with Strategy and Performance, 2017)</strong> — kurumsal risk yönetimini strateji ve performansla bütünleştiren, beş bileşenli (Yönetişim ve Kültür; Strateji ve Amaç Belirleme; Performans; Gözden Geçirme ve Revizyon; Bilgi, İletişim ve Raporlama) yönetişim odaklı çerçeve;</li>
<li><strong>ISO 22301 (Business Continuity Management Systems)</strong> — iş sürekliliği ve felaket kurtarma planlaması için referans çerçeve; kritik hizmetlerin kesinti hâlinde sürdürülmesine ilişkin disiplin sağlar.</li>
</ul>
<p>Veri güvenliği ve kişisel veri ihlallerine ilişkin riskler ayrıca 6698 sayılı KVKK (m.12) ve ilgili veri ihlali bildirim prosedürü çerçevesinde ele alınır.</p>

<h4>4. Risk Kategorileri ve Müdahale İlkeleri</h4>
<p>hangel, risklerini aşağıdaki temel kategorilerde tanımlar ve her kategoride önleyici/müdahale edici tedbirler belirler:</p>

<table class="w-full border-collapse border border-gray-200 my-4">
<thead>
<tr>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Risk Kategorisi</th>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Örnek Riskler</th>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Müdahale İlkesi</th>
</tr>
</thead>
<tbody>
<tr>
<td class="border border-gray-200 p-2 text-sm">Finansal</td>
<td class="border border-gray-200 p-2 text-sm">Fon akışında kesinti, bağış aktarım hatası, likidite, kötüye kullanım</td>
<td class="border border-gray-200 p-2 text-sm">Mutabakat kontrolleri, AML/CFT izlemesi (5549 sayılı Kanun), fon ayrıştırma</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">İtibari</td>
<td class="border border-gray-200 p-2 text-sm">Yanlış bilgi, güven kaybı, olumsuz kamuoyu, kötüye kullanım iddiaları</td>
<td class="border border-gray-200 p-2 text-sm">Şeffaf iletişim, hızlı doğrulama, kriz iletişim protokolü</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Teknolojik</td>
<td class="border border-gray-200 p-2 text-sm">Hizmet kesintisi, veri ihlali, siber saldırı, altyapı arızası</td>
<td class="border border-gray-200 p-2 text-sm">Yedekleme, erişim kontrolü, ISO 22301 esinli süreklilik planı, KVKK m.12/5 ihlal bildirimi</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Operasyonel/Hukuki</td>
<td class="border border-gray-200 p-2 text-sm">Mevzuata uyumsuzluk, süreç hatası, üçüncü taraf bağımlılığı</td>
<td class="border border-gray-200 p-2 text-sm">Uyum gözden geçirmesi, tedarikçi denetimi, prosedür dokümantasyonu</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Paydaş güvenliği</td>
<td class="border border-gray-200 p-2 text-sm">Kan/sağlık eşleştirmesinde yanlış bilgi, acil durumda gecikme</td>
<td class="border border-gray-200 p-2 text-sm"><strong>En yüksek öncelik</strong>; insan güvenliği odaklı doğrulama ve hızlı eskalasyon</td>
</tr>
</tbody>
</table>

<p>Riskler; olasılık ve etki boyutlarıyla değerlendirilir ve <em>kaçınma, azaltma, transfer (örn. sigorta) veya kabul</em> stratejilerinden biriyle işlenir. hangel, kan/sağlık aracılık süreçlerinde tıbbi karar veya teşhis sağlamadığını, yalnızca eşleştirme/bilgilendirme aracılığı yaptığını ve nihai tıbbi sorumluluğun yetkili sağlık kuruluşlarına ait olduğunu beyan eder.</p>

<h4>5. Kriz Müdahale Süreci ve Yönetişim</h4>
<p>Bir kriz tespit edildiğinde hangel aşağıdaki adımları izler: (1) <strong>Tespit ve sınıflandırma</strong> — olayın türü, şiddeti ve etkilenen paydaşlar belirlenir; (2) <strong>Eskalasyon</strong> — kriz seviyesine göre yetkili karar mercilerine bildirim yapılır; (3) <strong>Sınırlama ve müdahale</strong> — zararın yayılması önlenir, kritik hizmetler korunur; (4) <strong>İletişim</strong> — etkilenen paydaşlara ve gerektiğinde düzenleyici makamlara (örn. veri ihlalinde KVKK'ya KVKK Kararı 2019/10 uyarınca 72 saat içinde) zamanında ve doğru bilgilendirme yapılır; (5) <strong>Toparlanma</strong> — normal operasyona dönüş ve süreklilik planının devreye alınması; (6) <strong>Kök neden analizi</strong> — olayın ardından inceleme ve iyileştirme. Kriz yönetimi sorumluluğu hangel AŞ yönetim organına aittir; veri koruma boyutunda DPO/veri sorumlusu koordinasyonu sağlanır.</p>

<h4>6. İzleme ve Gözden Geçirme</h4>
<p>hangel, bir risk envanteri oluşturmayı ve bunu düzenli olarak güncellemeyi, ayrıca kriz senaryolarını gözden geçirmeyi hedefler. hangel, olay ve ramak-kala kayıtlarının tutulmasını ve periyodik olarak değerlendirilmesini, bunlardan çıkarılan derslerin politikaya yansıtılmasını taahhüt eder. Risk göstergeleri ve müdahale etkinliğinin periyodik olarak değerlendirilmesi de bu çerçevede hedeflenir. Bu çerçevede ISO 31000 sürecinin "izleme ve gözden geçirme" aşaması referans alınır; ancak bu, hangel'in bir denetim/sertifikasyon statüsüne sahip olduğu anlamına gelmez. hangel, risk iştahını (kabul edilebilir risk düzeyini) faaliyetlerinin toplumsal etkisi ve paydaş güvenliği önceliğiyle uyumlu olacak biçimde belirlemeyi; özellikle insan güvenliğini etkileyebilecek risklerde düşük tolerans uygulamayı taahhüt eder. Önemli mevzuat, teknoloji veya iş modeli değişikliklerinde risk envanteri olağanüstü gözden geçirmeye tabi tutulur ve gerektiğinde bu Politika güncellenir.</p>

<h4>7. Yürürlük</h4>
<p>Bu Politika, hangel tarafından yayımlandığı tarihte yürürlüğe girer ve en az yılda bir kez veya önemli bir kriz/olay sonrası gözden geçirilir. Politikanın uygulanmasında işlenen kişisel veriler 6698 sayılı KVKK'ya uygun olarak işlenir; sorular için veri konularında <a href="mailto:kvkk@hangel.org">kvkk@hangel.org</a>, uluslararası konularda <a href="mailto:privacy@hangel.org">privacy@hangel.org</a> adresine başvurulabilir.</p>

<p class="text-xs text-muted-foreground"><em>Bu metin bilgilendirme amaçlıdır ve bağlayıcı nihai hukuki görüş niteliği taşımaz; yürürlük öncesi yetkili hukuk danışmanlığı önerilir.</em></p>
    `
  },

  // --- E. Erişilebilirlik, Bilgilendirme ve Diğer Politikalar ---
  {
    slug: 'erisilebilirlik-politikasi',
    title: 'Erişilebilirlik Politikası',
    content: `
      <h3>Erişilebilirlik Politikası</h3>

<p>İşbu Erişilebilirlik Politikası, hangel platformunu işleten <strong>hangel AŞ</strong> tarafından, dijital hizmetlerinin engelli kullanıcılar dâhil herkes tarafından algılanabilir, kullanılabilir, anlaşılabilir ve sağlam (robust) biçimde erişilebilir olmasını sağlama taahhüdünü ortaya koymak amacıyla hazırlanmıştır. hangel; acil kan talebi/eşleştirme, bağış, gönüllülük ve toplumsal etki hizmetleri sunan ve toplumun her kesimine ulaşmayı hedefleyen bir platform olarak erişilebilirliği temel bir hak ve sosyal sorumluluk olarak görür. Bu metnin esas dili Türkçedir; uluslararası standartlara atıflar İngilizce ifadeler içerebilir.</p>

<p><strong>Önemli not:</strong> Bu Politikadaki <strong>WCAG 2.2 AA uyumu</strong> bir <strong>hedef</strong> olarak ifade edilmektedir. hangel henüz tam (bütünsel) WCAG 2.2 AA veya EN 301 549 uyumunu sağladığını iddia etmez; mevcut önlemlerini ve devam eden iyileştirme yol haritasını şeffaf biçimde paylaşır.</p>

<h4>1. Amaç</h4>
<p>Bu Politikanın amacı; hangel'in web ve mobil hizmetlerinde erişilebilirlik ilkelerini benimsemek, engelli kullanıcıların hizmetlere bağımsız ve eşit biçimde erişebilmesini sağlamaya yönelik mevcut önlemleri tanımlamak ve uluslararası erişilebilirlik standartlarına tam uyumu hedefleyen bir yol haritası ortaya koymaktır. Erişilebilirlik, hangel için yasal bir gereklilik olduğu kadar etik bir taahhüttür.</p>

<h4>2. Kapsam</h4>
<p>Bu Politika; hangel'in web sitesi, mobil uygulamaları, kullanıcı arayüzleri, formları, bildirimleri ve kullanıcıya sunulan dijital içeriklerinin tamamını kapsar. Politika; görme, işitme, motor (hareket) ve bilişsel engelli kullanıcılar ile yardımcı teknolojileri (ekran okuyucu, klavye navigasyonu, ekran büyütücü vb.) kullanan herkesi hedef kitle olarak kapsar.</p>

<h4>3. Uyulan ve Hedeflenen Standartlar</h4>
<p>hangel'in erişilebilirlik yaklaşımı aşağıdaki ulusal mevzuat ve uluslararası standartlara dayanır:</p>
<ul>
<li><strong>WCAG 2.2 AA (Web Content Accessibility Guidelines 2.2, AA seviyesi — W3C)</strong> — algılanabilirlik, kullanılabilirlik, anlaşılabilirlik ve sağlamlık ilkeleri; hangel'in <strong>hedeflediği</strong> uyum seviyesidir;</li>
<li><strong>EN 301 549</strong> — Avrupa dijital erişilebilirlik harmonize standardı; güncel sürümü (v3.2.1) hâlihazırda WCAG 2.1 AA'yı referans alır ve gelecek sürümünde (beklenen v4.1.1) WCAG 2.2'yi içermesi öngörülür; hangel bu standartla hizalanmayı hedefler;</li>
<li><strong>European Accessibility Act — Direktif (EU) 2019/882</strong> — AB üye devletlerce iç hukuka aktarılan ve uygulaması <strong>28 Haziran 2025</strong> itibarıyla başlayan, e-ticaret ve dijital tüketici hizmetlerinde erişilebilirlik gerektiren çerçeve; hangel AB pazarına yönelik hizmetlerinde bu çerçeveyi gözetmeyi taahhüt eder;</li>
<li><strong>5378 sayılı Engelliler Hakkında Kanun</strong> — özellikle m.2 (tanımlar ve ayrımcılık yasağı) ve m.3 (erişilebilirlik); bilgi ve iletişim teknolojilerinin engellilerin erişimine uygun hâle getirilmesi yükümlülüğü; ayrıca web sitesi ve mobil uygulama erişilebilirliğine ilişkin <strong>2025/10 sayılı Cumhurbaşkanlığı Genelgesi (21 Haziran 2025)</strong> ile Anayasa m.10 (eşitlik ilkesi).</li>
</ul>

<h4>4. Mevcut Önlemler ve Hedefler</h4>
<p>hangel, erişilebilirlik yolculuğunda kademeli ve şeffaf bir yaklaşım benimser. Aşağıdaki tablo mevcut durumu ve hedefleri ayrı ayrı gösterir:</p>

<table class="w-full border-collapse border border-gray-200 my-4">
<thead>
<tr>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Alan</th>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Mevcut Durum</th>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Hedef</th>
</tr>
</thead>
<tbody>
<tr>
<td class="border border-gray-200 p-2 text-sm">Renk kontrastı ve okunabilirlik</td>
<td class="border border-gray-200 p-2 text-sm">Temel kontrast ve yazı tipi okunabilirliği gözetilmektedir</td>
<td class="border border-gray-200 p-2 text-sm">WCAG 2.2 AA kontrast oranlarına (1.4.3/1.4.11) tam uyumu hedefler</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Klavye navigasyonu</td>
<td class="border border-gray-200 p-2 text-sm">Temel akışlar klavye ile kullanılabilir; tüm bileşenler henüz tam test edilmemiştir</td>
<td class="border border-gray-200 p-2 text-sm">Tüm etkileşimli öğelerde tam klavye erişimi ve görünür odak göstergesini hedefler</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Ekran okuyucu uyumu</td>
<td class="border border-gray-200 p-2 text-sm">Anlamsal (semantic) HTML ve temel ARIA etiketleri kısmen uygulanmıştır</td>
<td class="border border-gray-200 p-2 text-sm">Tüm sayfalarda eksiksiz ARIA, alternatif metin ve etiketlemeyi taahhüt eder</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Form ve hata bildirimi</td>
<td class="border border-gray-200 p-2 text-sm">Formlarda temel etiketleme mevcuttur</td>
<td class="border border-gray-200 p-2 text-sm">Erişilebilir hata tanımlama ve yönlendirme (3.3.x) uyumunu hedefler</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Bağımsız erişilebilirlik denetimi</td>
<td class="border border-gray-200 p-2 text-sm">Henüz bağımsız üçüncü taraf denetimi/sertifikası bulunmamaktadır</td>
<td class="border border-gray-200 p-2 text-sm">Düzenli otomatik + manuel test ve bağımsız denetim sürecini taahhüt eder</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Erişilebilirlik beyanı</td>
<td class="border border-gray-200 p-2 text-sm">Bu Politika ilk erişilebilirlik beyanını oluşturmaktadır</td>
<td class="border border-gray-200 p-2 text-sm">EN 301 549 esinli ayrıntılı erişilebilirlik beyanı yayımlamayı hedefler</td>
</tr>
</tbody>
</table>

<h4>5. Yardımcı Teknolojiler ve Tasarım İlkeleri</h4>
<p>hangel, arayüz ve içerik tasarımında WCAG 2.2'nin dört temel ilkesini (POUR — Perceivable, Operable, Understandable, Robust) rehber edinir. Bu kapsamda; ekran okuyucularla uyumlu anlamsal yapı, yeterli renk kontrastı, yalnızca renge bağlı olmayan anlam aktarımı, klavye ile tam gezilebilirlik, görünür odak göstergesi, anlamlı bağlantı metinleri, görseller için alternatif (alt) metin ve formlarda açık etiketleme hedeflenir. Tasarım sürecinde, kullanıcı deneyimi standardı olarak ISO 9241-210 (insan odaklı tasarım) ilkeleri referans alınır; ancak bu, hangel'in ilgili standartta sertifikalı olduğu anlamına gelmez. hangel, üçüncü taraf yardımcı teknolojilerle (ekran okuyucu, ekran büyütücü, ses komutu, alternatif giriş cihazları) uyumu sürekli iyileştirmeyi taahhüt eder; ayrıca otomatik içerikten (ör. yapay zeka destekli alt metin önerileri) yararlanırken bunların doğruluğunun insan gözetimiyle denetlenmesini esas alır.</p>

<h4>6. Geri Bildirim ve Şikâyet Kanalı</h4>
<p>Erişilebilirlik engeliyle karşılaşan kullanıcılar; karşılaştıkları sorunu, kullandıkları yardımcı teknolojiyi ve ilgili sayfayı belirterek <a href="mailto:privacy@hangel.org">privacy@hangel.org</a> adresine bildirimde bulunabilir. hangel, erişilebilirlik bildirimlerine makul süre içinde yanıt vermeyi ve mümkün olduğunda alternatif erişim yolu sunmayı taahhüt eder. Engelli kullanıcılar, ayrımcılık iddialarında 5378 sayılı Kanun ve 6701 sayılı Türkiye İnsan Hakları ve Eşitlik Kurumu Kanunu kapsamındaki haklarını da kullanabilir.</p>

<h4>7. İzleme ve Raporlama</h4>
<p>hangel; erişilebilirlik hedeflerine yönelik ilerlemeyi periyodik olarak gözden geçirmeyi, otomatik ve manuel test sonuçlarını değerlendirmeyi ve önemli iyileştirmeleri kullanıcılarla şeffaf biçimde paylaşmayı hedefler. Henüz sağlanmamış uyum noktaları açıkça "hedef/devam eden" olarak işaretlenir; tam WCAG 2.2 AA uyumu sağlanmış gibi sunulmaz.</p>

<h4>8. Yürürlük</h4>
<p>Bu Politika, hangel tarafından yayımlandığı tarihte yürürlüğe girer ve standartlardaki güncellemeler ile yol haritası ilerlemesine göre periyodik olarak gözden geçirilir. Politikanın uygulanmasında işlenen kişisel veriler 6698 sayılı KVKK'ya uygun olarak işlenir; sorular için <a href="mailto:kvkk@hangel.org">kvkk@hangel.org</a> adresine başvurulabilir.</p>

<p class="text-xs text-muted-foreground"><em>Bu metin bilgilendirme amaçlıdır ve bağlayıcı nihai hukuki görüş niteliği taşımaz; yürürlük öncesi yetkili hukuk danışmanlığı önerilir.</em></p>
    `
  },
  {
    slug: 'bilgilendirme-politikasi',
    title: 'Bilgilendirme Politikası',
    content: `
      <h3>Bilgilendirme Politikası</h3>

<p>İşbu Bilgilendirme Politikası, hangel platformunu işleten <strong>hangel AŞ</strong> tarafından, paydaşlarına yönelik bilgilendirme faaliyetlerinin doğru, zamanında, tutarlı, eşit ve şeffaf biçimde yürütülmesini sağlamak amacıyla hazırlanmıştır. hangel; acil kan talebi/eşleştirme, bağış, gönüllülük ve toplumsal etki hizmetleri sunan bir sosyal girişim olarak, kamuoyu güveninin sağlıklı bilgi akışına bağlı olduğunun bilincindedir. Bu metnin esas dili Türkçedir; uluslararası çerçevelere atıflar İngilizce ifadeler içerebilir.</p>

<h4>1. Amaç</h4>
<p>Bu Politikanın amacı; hangel'in faaliyetlerine, hizmetlerine, etki sonuçlarına, finansal şeffaflığına ve olağanüstü durumlarına ilişkin bilginin doğru ve zamanında paydaşlara ulaştırılmasına dair ilke ve usulleri belirlemektir. Politika; yanıltıcı, eksik veya seçici bilgilendirmeyi önlemeyi, resmî duyuru kanallarını netleştirmeyi ve kriz anlarında güvenilir iletişimi güvence altına almayı hedefler.</p>

<h4>2. Kapsam</h4>
<p>Bu Politika; hangel AŞ'nin web sitesi, mobil uygulamaları, resmî sosyal medya hesapları, e-posta bültenleri, basın açıklamaları ve etki/şeffaflık raporları aracılığıyla yaptığı tüm kamuya açık bilgilendirmeleri kapsar. Paydaşlar; kullanıcılar, gönüllüler, bağışçılar, STK/dernek/vakıflar, marka ve kurumsal ortaklar, çalışanlar, basın ve kamuoyudur.</p>

<h4>3. İlkeler ve Referans Çerçeveler</h4>
<p>hangel'in bilgilendirme ilkeleri aşağıdaki çerçevelerden ilham alır. Bunlar referans niteliğinde olup hangel'i halka açık sermaye piyasası yükümlülüklerine tabi kılmaz:</p>
<ul>
<li><strong>OECD Kurumsal Yönetim İlkeleri</strong> kapsamındaki kamuyu aydınlatma (disclosure) ve şeffaflık ilkeleri — doğruluk, zamanındalık, eşit erişim ve karşılaştırılabilirlik;</li>
<li><strong>SPK (Sermaye Piyasası Kurulu) kamuyu aydınlatma ilkeleri</strong> — yalnızca <em>referans</em> olarak; hangel halka açık bir şirket olmadığından SPK'nın özel durum açıklama yükümlülüklerine tabi değildir, ancak şeffaflık standardının iyi uygulama örneği olarak benimser;</li>
<li>İlgili olduğu ölçüde <strong>6563 sayılı Elektronik Ticaretin Düzenlenmesi Hakkında Kanun</strong> kapsamındaki bilgilendirme yükümlülükleri ile <strong>2860 sayılı Yardım Toplama Kanunu</strong> ve <strong>6698 sayılı KVKK m.10</strong> (aydınlatma yükümlülüğü) gereği yapılan zorunlu bilgilendirmeler.</li>
</ul>

<h4>4. Bilgilendirme İlkeleri ve Kanallar</h4>
<p>hangel bilgilendirmelerinde aşağıdaki temel ilkeleri esas alır: <strong>doğruluk</strong> (yalnızca doğrulanmış bilgi paylaşılır), <strong>zamanındalık</strong> (gecikmeksizin ve gerektiğinde anlık), <strong>eşit erişim</strong> (paydaşlar arasında ayrım gözetmeksizin), <strong>tutarlılık</strong> ve <strong>anlaşılırlık</strong> (sade, erişilebilir dil). Resmî bilgilendirme kanalları ve kullanım alanları aşağıdaki tabloda gösterilmiştir:</p>

<table class="w-full border-collapse border border-gray-200 my-4">
<thead>
<tr>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Kanal</th>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Kullanım Alanı</th>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Niteliği</th>
</tr>
</thead>
<tbody>
<tr>
<td class="border border-gray-200 p-2 text-sm">Web sitesi / uygulama</td>
<td class="border border-gray-200 p-2 text-sm">Politikalar, duyurular, etki/şeffaflık raporları</td>
<td class="border border-gray-200 p-2 text-sm">Birincil resmî kaynak</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Uygulama içi/e-posta bildirimi</td>
<td class="border border-gray-200 p-2 text-sm">Hizmet değişiklikleri, hesap, acil kan talebi bilgilendirmeleri</td>
<td class="border border-gray-200 p-2 text-sm">Doğrudan ve kişiye özel</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Resmî sosyal medya</td>
<td class="border border-gray-200 p-2 text-sm">Kampanya, farkındalık, genel duyuru</td>
<td class="border border-gray-200 p-2 text-sm">Destekleyici; resmî kaynağa atıf yapar</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Basın açıklaması</td>
<td class="border border-gray-200 p-2 text-sm">Önemli gelişme, kriz açıklaması</td>
<td class="border border-gray-200 p-2 text-sm">Yetkili sözcü onaylı</td>
</tr>
</tbody>
</table>

<p>Bilgilendirme yetkisi yalnızca hangel AŞ tarafından görevlendirilen yetkili sözcü/birimlere aittir; yetkisiz beyanlar hangel'i bağlamaz. Resmî olmayan kaynaklardan yayılan ve hangel'e atfedilen beyanlar, yalnızca yukarıdaki resmî kanallarda teyit edilebildiği ölçüde geçerli kabul edilir.</p>

<h4>5. Periyodik ve Olağan Bilgilendirme</h4>
<p>hangel, paydaşlarını yalnızca olağanüstü durumlarda değil, düzenli ve öngörülebilir bir ritimde de bilgilendirmeyi esas alır. Bu kapsamda; faaliyet ve etki sonuçlarına ilişkin <strong>etki/şeffaflık raporları</strong>, hizmet ve politika değişikliklerine ilişkin <strong>güncelleme duyuruları</strong> ve bağış süreçlerine ilişkin <strong>fon kullanım bilgilendirmeleri</strong> yapılır. Politika ve sözleşme metinlerinde yapılan esaslı değişiklikler, yürürlüğe girmeden makul süre önce duyurulur; kullanıcıların inceleme ve gerektiğinde itiraz/çıkış hakkını kullanabilmesi sağlanır. Bağış toplama faaliyetlerinde 2860 sayılı Yardım Toplama Kanunu kapsamındaki şeffaflık beklentileri ile fonun amaca uygun kullanımına ilişkin bilgilendirmeler gözetilir. Kişisel veri işlemeye ilişkin bilgilendirmeler ise 6698 sayılı KVKK m.10 uyarınca aydınlatma yükümlülüğü çerçevesinde, ayrı aydınlatma metinleri ile yürütülür ve bu Politika onların yerine geçmez.</p>

<h4>6. Doğrulama ve Yanlış Bilgi ile Mücadele</h4>
<p>hangel, paylaşacağı bilgiyi yayımlamadan önce iç doğrulama sürecinden geçirmeyi taahhüt eder. Özellikle acil kan talebi/eşleştirme gibi insan güvenliğini ilgilendiren bilgilendirmelerde, yanlış veya doğrulanmamış bilgi ciddi sonuçlar doğurabileceğinden, doğruluk en yüksek önceliktir. hangel; platform üzerinde veya hangel adına yayılan yanıltıcı/asılsız içeriği tespit ettiğinde bunu düzeltmek, gerektiğinde kaldırmak ve kamuoyunu uyarmak için makul çabayı gösterir. Üçüncü kişilerin hangel'i taklit eden (impersonation) iletişimlerine karşı kullanıcılar uyarılır ve yalnızca resmî kanalların esas alınması önerilir.</p>

<h4>7. Kriz İletişimi</h4>
<p>Olağanüstü durumlarda (örneğin hizmet kesintisi, veri ihlali, kötüye kullanım iddiası veya yanlış bilginin yayılması) hangel; doğrulanmış bilgiyi gecikmeksizin paylaşmayı, spekülasyondan kaçınmayı, etkilenen paydaşları öncelikli bilgilendirmeyi ve gerektiğinde yetkili makamlara bildirimde bulunmayı esas alır. Kişisel veri ihlallerinde 6698 sayılı KVKK m.12/5 ve KVKK Kararı 2019/10 uyarınca ilgili kişilere ve Kurula bildirim, Risk Yönetimi ve Kriz Müdahale Politikası ile koordineli yürütülür. Kriz iletişiminde mesaj birliği sağlanır ve çelişkili açıklamalardan kaçınılır.</p>

<h4>8. Düzeltme ve Geri Bildirim</h4>
<p>hangel, yayımladığı bir bilgide hata tespit ederse bunu gecikmeksizin düzeltir ve düzeltmeyi şeffaf biçimde duyurur. Paydaşlar; bilgilendirmelerin doğruluğuna ilişkin soru, itiraz ve geri bildirimlerini <a href="mailto:privacy@hangel.org">privacy@hangel.org</a> üzerinden iletebilir. Veri koruma kapsamındaki başvurular için <a href="mailto:kvkk@hangel.org">kvkk@hangel.org</a> kullanılır. Yanıltıcı veya doğrulanmamış bilginin yayılmasını önlemek hangel'in temel sorumluluğudur.</p>

<h4>9. Yürürlük</h4>
<p>Bu Politika, hangel tarafından yayımlandığı tarihte yürürlüğe girer ve periyodik olarak gözden geçirilir. Güncellemeler resmî kanallardan duyurulur. Politikanın uygulanmasında işlenen kişisel veriler 6698 sayılı KVKK'ya uygun olarak işlenir.</p>

<p class="text-xs text-muted-foreground"><em>Bu metin bilgilendirme amaçlıdır ve bağlayıcı nihai hukuki görüş niteliği taşımaz; yürürlük öncesi yetkili hukuk danışmanlığı önerilir.</em></p>
    `
  },
  {
    slug: 'cok-dilli-sozlesmeler-politikasi',
    title: 'Çok Dilli Sözleşmeler ve Küresel Erişim Politikası',
    content: `
      <h3>Çok Dilli Sözleşmeler ve Küresel Erişim Politikası</h3>

<p>İşbu Çok Dilli Sözleşmeler ve Küresel Erişim Politikası, hangel platformunu işleten <strong>hangel AŞ</strong> tarafından, sözleşme, politika ve bilgilendirme metinlerinin birden çok dilde sunulmasına ilişkin ilkeleri ve çeviriler arasında uyuşmazlık hâlinde geçerli olacak <strong>esas dili</strong> netleştirmek amacıyla hazırlanmıştır. hangel; acil kan talebi/eşleştirme, bağış, gönüllülük ve toplumsal etki hizmetleriyle küresel bir kullanıcı kitlesine ulaşmayı hedeflediğinden, çok dilli erişim hem kapsayıcılık hem hukuki açıklık gerektirir. Bu metnin esas dili Türkçedir.</p>

<h4>1. Amaç</h4>
<p>Bu Politikanın amacı; hangel'in hukuki ve bilgilendirici metinlerinin farklı dillerdeki sürümlerine ilişkin statüyü belirlemek, çeviriler arasında çelişki doğması hâlinde hangi metnin esas alınacağını açıkça ortaya koymak ve kullanıcıların kendi dillerinde bilgiye erişimini desteklerken hukuki belirliliği korumaktır.</p>

<h4>2. Kapsam</h4>
<p>Bu Politika; hangel'in kullanıcı sözleşmesi, kuruluş/üyelik sözleşmeleri, gizlilik ve veri koruma politikaları, aydınlatma metinleri, açık rıza metinleri ve diğer tüm kullanıcıya yönelik hukuki/bilgilendirici metinlerinin çok dilli sürümlerini kapsar. Politika; çevirilerin hazırlanması, yayımlanması ve aralarındaki ilişkinin yorumlanması süreçlerine uygulanır.</p>

<h4>3. Esas Dil İlkesi (Prevailing Language)</h4>
<p>hangel'in hukuki metinlerinin <strong>esas (asıl) dili Türkçedir</strong>. Diğer dillerdeki sürümler, kullanıcıların kolaylığı ve erişilebilirliği için sağlanan <strong>bilgilendirme amaçlı çevirilerdir</strong>. Buna göre:</p>
<ul>
<li>Türkçe metin ile herhangi bir çeviri arasında <strong>anlam, yorum veya kapsam farkı ya da uyuşmazlık</strong> doğması hâlinde, <strong>her zaman Türkçe metin esas alınır ve geçerli olur</strong> (prevailing-language ilkesi).</li>
<li>Çeviriler, Türkçe metnin yerini almaz; yardımcı niteliktedir ve hukuki bağlayıcılık bakımından Türkçe metne tabidir.</li>
<li>Bu yaklaşım, <strong>6098 sayılı Türk Borçlar Kanunu</strong> kapsamında sözleşmenin yorumu ve tarafların gerçek ve ortak iradesinin esas alınması ilkeleriyle (özellikle m.19 — sözleşmenin yorumu) ve m.27 (genel işlem koşulları) çerçevesindeki açıklık/şeffaflık beklentisiyle uyumludur.</li>
</ul>
<p>Esas dile ilişkin bu kayıt (prevailing clause), hangel'in tüm çok dilli hukuki metinlerinde geçerli kabul edilir; aksi açıkça belirtilmedikçe diğer metinlere de uygulanır. Tüketici lehine emredici koruyucu hükümler saklıdır: ilgili kullanıcının bulunduğu ülkenin emredici tüketici koruma kuralları, esas dil kaydından bağımsız olarak uygulanmaya devam eder.</p>

<h4>4. Desteklenen Diller ve Çeviri Süreci</h4>
<p>hangel, kullanıcı kitlesinin ihtiyaçlarına göre çeşitli dillerde içerik sunmayı hedefler. Aşağıdaki tablo, dil sürümlerinin statüsünü gösterir:</p>

<table class="w-full border-collapse border border-gray-200 my-4">
<thead>
<tr>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Dil</th>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Statü</th>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Hukuki Niteliği</th>
</tr>
</thead>
<tbody>
<tr>
<td class="border border-gray-200 p-2 text-sm">Türkçe</td>
<td class="border border-gray-200 p-2 text-sm">Esas (asıl) metin</td>
<td class="border border-gray-200 p-2 text-sm"><strong>Bağlayıcı; uyuşmazlıkta geçerli</strong></td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">İngilizce</td>
<td class="border border-gray-200 p-2 text-sm">Çeviri</td>
<td class="border border-gray-200 p-2 text-sm">Bilgilendirme amaçlı; Türkçeye tabi</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Diğer diller (ör. Arapça, Almanca vb.)</td>
<td class="border border-gray-200 p-2 text-sm">Çeviri (sunulduğu ölçüde)</td>
<td class="border border-gray-200 p-2 text-sm">Bilgilendirme amaçlı; Türkçeye tabi</td>
</tr>
</tbody>
</table>

<p>Çeviriler, doğruluğu gözetilerek hazırlanır; ancak diller arası anlam kaymaları tümüyle önlenemeyebileceğinden, kullanıcıların tereddüt hâlinde Türkçe metni esas alması önerilir. Çeviri hatası tespit edildiğinde hangel bunu makul süre içinde düzeltir.</p>

<p>Bir dilin geçici olarak sunulmaması, henüz çevrilmemiş olması veya bir çevirinin Türkçe metnin gerisinde kalması, ilgili hukuki metnin o dildeki kullanıcılar bakımından geçerliliğini etkilemez; bu durumlarda esas Türkçe metin tüm kullanıcılar için yürürlükte kabul edilir. hangel, makineyle (otomatik) üretilen çevirilerin yalnızca yardımcı/geçici nitelikte olduğunu ve hukuki yorumda esas alınamayacağını; resmî çeviri olarak yayımlanan metinlerin ise insan gözetiminden geçirildiğini taahhüt eder. Kullanıcılar, hizmeti kullanırken esas Türkçe metni okuma ve anlama imkânına sahip olduklarını ve bu metnin bağlayıcılığını kabul ettiklerini beyan etmiş sayılır.</p>

<h4>5. Uygulanacak Hukuk, Yetki ve Sınır Ötesi Erişim</h4>
<p>hangel'in hukuki metinlerinden doğan uyuşmazlıklarda, aksi emredici bir kuralla öngörülmedikçe, esas Türkçe metin ve Türk hukuku uygulanır; metinde ayrıca belirtilen yetkili mahkeme ve hukuk seçimi kayıtları saklıdır. Çok dilli sunum, hizmetin küresel erişilebilirliğini artırmayı amaçlar; ancak bir dilin sunulması, hangel'in o ülkede aktif olarak hizmet sunma veya o ülke hukukuna tam tabi olma taahhüdü anlamına gelmez. Tüketicinin mutat meskeninin bulunduğu ülkenin lehine olan emredici koruyucu hükümler ile yerel veri koruma mevzuatı (örn. GDPR (EU) 2016/679, ilgili olduğunda) her hâlükârda uygulanmaya devam eder. Sınır ötesi sözleşmelerde, taraflar arasında dil kaynaklı bir yorum farkı doğduğunda, tarafların gerçek ve ortak iradesi 6098 sayılı Türk Borçlar Kanunu m.19 çerçevesinde araştırılır ve bu araştırmada esas Türkçe metin belirleyici kabul edilir.</p>

<h4>6. Geri Bildirim ve Şikâyet Kanalı</h4>
<p>Kullanıcılar; bir çeviride hata, belirsizlik veya Türkçe metinle çelişki tespit ettiklerinde bunu <a href="mailto:privacy@hangel.org">privacy@hangel.org</a> adresine bildirebilir. Veri koruma kapsamındaki başvurular için <a href="mailto:kvkk@hangel.org">kvkk@hangel.org</a> kullanılır. hangel, bildirilen çeviri sorunlarını değerlendirerek metinleri günceller; düzeltilen çeviri sürümünün tarihi ve sürüm bilgisi takip edilir.</p>

<h4>7. İzleme ve Raporlama</h4>
<p>hangel; çok dilli metinlerin güncelliğini ve tutarlılığını periyodik olarak gözden geçirmeyi, Türkçe esas metinde yapılan değişikliklerin çevirilere zamanında yansıtılmasını ve sürüm farklılıklarının takip edilmesini taahhüt eder. Esas Türkçe metin güncellendiğinde, çeviriler güncellenene kadar Türkçe metin geçerli kalmaya devam eder. Önemli sözleşme değişikliklerinde, kullanıcılar değişiklikten esas Türkçe metin üzerinden bilgilendirilir ve onay/itiraz hakları bu metin esas alınarak değerlendirilir.</p>

<h4>8. Yürürlük</h4>
<p>Bu Politika, hangel tarafından yayımlandığı tarihte yürürlüğe girer ve periyodik olarak gözden geçirilir. Politikanın esas ve bağlayıcı sürümü Türkçedir. Uygulanmasında işlenen kişisel veriler 6698 sayılı KVKK'ya uygun olarak işlenir.</p>

<p class="text-xs text-muted-foreground"><em>Bu metin bilgilendirme amaçlıdır ve bağlayıcı nihai hukuki görüş niteliği taşımaz; yürürlük öncesi yetkili hukuk danışmanlığı önerilir.</em></p>
    `
  },
  {
    slug: 'yerel-bagis-mevzuatlarina-uyum-beyani',
    title: 'Yerel Bağış Mevzuatlarina Uyum Beyanı',
    content: `
      <h3>Yerel Bağış Mevzuatlarina Uyum Beyanı</h3>

<p>İşbu Yerel Bağış Mevzuatlarına Uyum Beyanı, hangel platformunu işleten <strong>hangel AŞ</strong> tarafından, bağış toplama ve aktarım faaliyetlerinin farklı ülke ve bölgelerdeki yerel mevzuata uyumuna ilişkin yaklaşımını ve taahhüdünü ortaya koymak amacıyla hazırlanmıştır. hangel; bireysel ve kurumsal bağış, affiliate bağış aktarımı ve STK/dernek/vakıf profilleri aracılığıyla sınır ötesi bir bağış ekosistemi sunmayı hedeflediğinden, her yargı çevresinin kendine özgü bağış (charitable solicitation / fundraising) kurallarına tabi olabileceğinin bilincindedir. Bu metnin esas dili Türkçedir; yabancı mevzuat adları İngilizce ifadeler içerebilir.</p>

<p><strong>Önemli not — kapsam çerçevesi (umbrella):</strong> Bu Beyan, dünya genelindeki tüm bağış düzenlemelerini kapsamaz ve hangel'in <strong>"tüm dünyada hâlihazırda tam uyumlu olduğu"</strong> iddiasını içermez. Beyan, hangel'in faaliyet gösterdiği veya göstermeyi planladığı her ülke/bölgede <strong>gerekli yerel izinleri almayı, kayıt ve raporlama yükümlülüklerine uymayı taahhüt ettiğini</strong> ortaya koyan bir çerçeve metindir. Aşağıdaki tablo <strong>temsilî</strong> niteliktedir.</p>

<h4>1. Amaç</h4>
<p>Bu Beyanın amacı; hangel'in bağış faaliyetlerinde yerel mevzuata saygı ilkesini benimsediğini, ilgili her yargı çevresinde gerekli izin/kayıt süreçlerini tamamlamayı taahhüt ettiğini ve uyum konusunda şeffaf ve hesap verebilir bir yaklaşım izlediğini ortaya koymaktır.</p>

<h4>2. Kapsam</h4>
<p>Bu Beyan; hangel üzerinden gerçekleştirilen tüm bağış toplama, bağış çağrısı (solicitation), fon aktarımı ve bağış kampanyası faaliyetlerini ve bu faaliyetlerin yöneldiği ülke/bölgeleri kapsar. Platform üzerinden bağış toplayan kuruluşların kendi yerel yükümlülükleri saklıdır; bu yükümlülükler birincil olarak ilgili kuruluşa aittir.</p>

<h4>3. Uyulan ve Hedeflenen Mevzuat (Temsilî)</h4>
<p>hangel'in uyum çerçevesi aşağıdaki temsilî mevzuat setine dayanır. Liste tüketici (kapsayıcı) değildir; hangel ilgili her yargı çevresinin güncel gerekliliklerini esas alır:</p>

<table class="w-full border-collapse border border-gray-200 my-4">
<thead>
<tr>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Ülke / Bölge</th>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Düzenleyici / Mevzuat</th>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Temel Gereklilik</th>
</tr>
</thead>
<tbody>
<tr>
<td class="border border-gray-200 p-2 text-sm">Türkiye</td>
<td class="border border-gray-200 p-2 text-sm">2860 sayılı Yardım Toplama Kanunu + Yardım Toplama Esas ve Usulleri Hakkında Yönetmelik; mülki amir (vali/kaymakam)</td>
<td class="border border-gray-200 p-2 text-sm">Yardım toplamadan önce m.6 uyarınca izin; izin makamı m.7'ye göre faaliyet alanına bağlıdır</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">ABD (eyalet bazlı)</td>
<td class="border border-gray-200 p-2 text-sm">Eyalet charitable solicitation kanunları (örn. NY, CA); ilgili eyalet makamı (Attorney General/Charities Bureau)</td>
<td class="border border-gray-200 p-2 text-sm">Bağış çağrısından önce eyalet düzeyinde kayıt ve dönemsel mali raporlama; IRC §501(c)(3)/§170 bağlamında vergi statüsü</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Birleşik Krallık</td>
<td class="border border-gray-200 p-2 text-sm">Charities Act 2011; Charity Commission; Fundraising Regulator + Code of Fundraising Practice</td>
<td class="border border-gray-200 p-2 text-sm">Hayır kurumu kaydı, Fundraising Regulator'a kayıt ve solicitation statement yükümlülükleri</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">AB üye devletleri</td>
<td class="border border-gray-200 p-2 text-sm">Her üye devletin kendi bağış/dernek mevzuatı ve ulusal düzenleyicisi (tek tip AB rejimi yoktur)</td>
<td class="border border-gray-200 p-2 text-sm">Ülkeye özgü kayıt, izin ve şeffaflık kuralları; GDPR (EU) 2016/679 kapsamında bağışçı verisinin korunması</td>
</tr>
</tbody>
</table>

<p>Bağış aracılığı sırasında işlenen kişisel ve finansal veriler 6698 sayılı KVKK ve ilgili yabancı veri koruma mevzuatına (GDPR vb.) uygun işlenir; kaynak doğrulama ve AML/CFT kontrolleri 5549 sayılı Kanun ve FATF tavsiyeleri çerçevesinde gözetilir.</p>

<h4>4. Mevcut Durum ve Hedefler</h4>
<p>hangel, uyum yolculuğunda kademeli ve şeffaf bir yaklaşım benimser. Aşağıdaki tablo mevcut durumu ve hedefleri ayrı ayrı gösterir:</p>

<table class="w-full border-collapse border border-gray-200 my-4">
<thead>
<tr>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Alan</th>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Mevcut Durum</th>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Hedef</th>
</tr>
</thead>
<tbody>
<tr>
<td class="border border-gray-200 p-2 text-sm">Türkiye izinleri</td>
<td class="border border-gray-200 p-2 text-sm">2860 sayılı Kanun kapsamındaki gereklilikler birincil faaliyet çerçevesinde gözetilmektedir</td>
<td class="border border-gray-200 p-2 text-sm">Tüm kampanya türleri için izin süreçlerini tam dokümante etmeyi taahhüt eder</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Sınır ötesi kayıtlar</td>
<td class="border border-gray-200 p-2 text-sm">Her ülke için ayrı yerel kayıt henüz tamamlanmamıştır</td>
<td class="border border-gray-200 p-2 text-sm">Faaliyet gösterilecek her yargı çevresinde gerekli izin/kaydı <strong>almayı taahhüt eder</strong></td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Coğrafi yönlendirme</td>
<td class="border border-gray-200 p-2 text-sm">Bağış çağrıları için ülke bazlı kısıtlama altyapısı geliştirilmektedir</td>
<td class="border border-gray-200 p-2 text-sm">İzin alınmamış ülkelerde aktif çağrıyı sınırlamayı/engellemeyi hedefler</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Yerel hukuki danışmanlık</td>
<td class="border border-gray-200 p-2 text-sm">Genişleme öncesi yerel danışmanlık vaka bazında alınmaktadır</td>
<td class="border border-gray-200 p-2 text-sm">Öncelikli pazarlarda kalıcı yerel hukuki danışmanlık kurmayı amaçlar</td>
</tr>
</tbody>
</table>

<h4>5. Geri Bildirim ve Şikâyet Kanalı</h4>
<p>Bağışçılar, kuruluşlar ve düzenleyici makamlar; bir bağış faaliyetinin yerel mevzuata uyumuna ilişkin soru, itiraz veya şikâyetlerini <a href="mailto:privacy@hangel.org">privacy@hangel.org</a> adresine, veri koruma kapsamında ise <a href="mailto:kvkk@hangel.org">kvkk@hangel.org</a> adresine iletebilir. hangel, uyumsuzluk bildirimlerini öncelikli olarak değerlendirir ve gerektiğinde ilgili faaliyeti askıya alır.</p>

<h4>6. İzleme ve Raporlama</h4>
<p>hangel; faaliyet gösterdiği yargı çevrelerindeki bağış mevzuatını periyodik olarak izlemeyi, izin ve kayıt durumunu güncel tutmayı ve uyum ilerlemesini şeffaf biçimde raporlamayı taahhüt eder. Henüz tamamlanmamış izin/kayıt süreçleri "hedef/devam eden" olarak açıkça işaretlenir; hiçbir ülke için sahip olunmayan bir izin var gibi gösterilmez. hangel, bir yargı çevresinde gerekli izin alınmadan o bölgeye yönelik aktif bağış çağrısı yapılmasını önlemeyi ve uyum durumunun değişmesi hâlinde ilgili kampanyaları gözden geçirmeyi taahhüt eder. Platform üzerinden bağış toplayan kuruluşlar da, kendi yerel izin ve raporlama yükümlülüklerine uymaktan birinci derecede sorumludur; hangel bu uyumu kolaylaştırıcı bir aracı konumundadır ve ilgili kuruluşların yerini almaz.</p>

<h4>7. Yürürlük</h4>
<p>Bu Beyan, hangel tarafından yayımlandığı tarihte yürürlüğe girer ve ilgili mevzuattaki değişiklikler ile coğrafi genişlemeye göre periyodik olarak gözden geçirilir. Uygulanmasında işlenen kişisel veriler 6698 sayılı KVKK ve ilgili yabancı veri koruma mevzuatına uygun olarak işlenir.</p>

<p class="text-xs text-muted-foreground"><em>Bu metin bilgilendirme amaçlıdır ve bağlayıcı nihai hukuki görüş niteliği taşımaz; yürürlük öncesi yetkili hukuk danışmanlığı önerilir.</em></p>
    `
  },

  // --- F. Gelişim Yol Haritası ve Standartlar ---
  {
    slug: 'gelisim-yol-haritasi-ve-standartlar',
    title: 'Gelişim Yol Haritası ve Henüz Sağlanmamış Standartlar Beyanı',
    content: `
      <h3>Gelişim Yol Haritası ve Henüz Sağlanmamış Standartlar Beyanı</h3>

<p>Bu beyan, hangel platformunun benimsediği şeffaflık ilkesinin somut bir ifadesidir: hangel, hangi standartlara <strong>henüz tam olarak uymadığını</strong>, hangi sertifika ve denetimlere <strong>henüz sahip olmadığını</strong> açıkça ve dürüstçe ortaya koyar. Platformu işleten tüzel kişi <strong>hangel AŞ</strong>'dir. Kullanıcıya görünen tüm düz metinde "hangel" küçük harfle yazılır. Bu belge, hangel'in diğer tüm uyum ve standart beyanları için <em>referans/model belge</em> niteliğindedir.</p>

<p><strong>Temel ilke:</strong> hangel sahip olmadığı bir sertifikayı, geçmediği bir denetimi veya yapılmamış bir testi "yapılmış gibi" sunmaz. Henüz sağlanmamış her unsur, aşağıda <em>hedef, taahhüt ve yol haritası</em> olarak çerçevelenmiştir.</p>

<h4>1. Amaç</h4>
<p>Bu beyanın amacı; kullanıcıların, bağışçıların, STK'ların ve düzenleyici makamların hangel'in olgunluk düzeyini gerçekçi biçimde değerlendirebilmesini sağlamaktır. hangel, bir sosyal girişim olarak ölçeğiyle orantılı bir gelişim izler ve bu yolculukta nerede olduğunu saklamaz.</p>

<h4>2. Kapsam</h4>
<p>Bu beyan; bilgi güvenliği, dijital platform kalitesi ve erişilebilirlik, bağış/finansal denetim, yönetişim ve iş sürekliliği olmak üzere beş ana blokta hangel'in mevcut durumunu ve hedeflerini kapsar. Her blok, hangel'in ilgili ayrıntılı belgeleriyle birlikte değerlendirilir.</p>

<h4>3. Referans Çerçeve — Sertifikasyon Durumu</h4>
<p>hangel, aşağıdaki standart ve çerçeveleri <strong>referans</strong> olarak benimser; ancak bunların hiçbiri için sertifikalı, akredite veya bağımsız denetimden geçmiş değildir:</p>
<ul>
  <li>Bilgi güvenliği: <strong>ISO/IEC 27001:2022</strong>, <strong>ISO/IEC 27002:2022</strong>, <strong>NIST</strong> çerçeveleri.</li>
  <li>Dijital platform kalitesi ve erişilebilirlik: <strong>ISO/IEC 25010:2023</strong>, <strong>EN 301 549</strong>, <strong>WCAG 2.2 AA</strong>.</li>
  <li>Bağış/finans: <strong>IFRS</strong>, <strong>US GAAP</strong>, <strong>ISA</strong>, KGK Bağımsız Denetim mevzuatı, <strong>FATF</strong> tavsiyeleri.</li>
  <li>Yönetişim: <strong>OECD Kurumsal Yönetim İlkeleri</strong>, <strong>COSO ERM</strong>, <strong>UN Global Compact</strong>, <strong>UNGP</strong>.</li>
  <li>İş sürekliliği: <strong>ISO 22301:2019</strong>, <strong>ISO 31000</strong>, <strong>NIST SP 800-34</strong>.</li>
</ul>

<h4>4. Henüz Sağlanmamış Standartlar — Blok Bazlı Beyan</h4>
<p>Aşağıdaki tablo, her ana blokta hangel'in mevcut gerçek durumunu ve henüz sağlanmamış olup hedeflenen unsurları dürüstçe karşılaştırır.</p>
<table class="w-full border-collapse border border-gray-200 my-4">
  <thead>
    <tr>
      <th class="border border-gray-200 p-2 text-left text-sm" scope="col">Ana Blok</th>
      <th class="border border-gray-200 p-2 text-left text-sm" scope="col">Mevcut Durum</th>
      <th class="border border-gray-200 p-2 text-left text-sm" scope="col">Eksik / Hedef</th>
    </tr>
  </thead>
  <tbody>
    <tr><td class="border border-gray-200 p-2 text-sm"><strong>Bilgi Güvenliği</strong></td><td class="border border-gray-200 p-2 text-sm">TLS şifreleme, erişim kontrolü, bulut güvenlik kuralları; sertifika YOK</td><td class="border border-gray-200 p-2 text-sm">ISO/IEC 27001:2022 belgelendirmesi, belgelenmiş BGYS, periyodik sızma testi</td></tr>
    <tr><td class="border border-gray-200 p-2 text-sm"><strong>Dijital Platform</strong></td><td class="border border-gray-200 p-2 text-sm">Temel kullanılabilirlik ve erişilebilirlik çabaları; resmî uygunluk YOK</td><td class="border border-gray-200 p-2 text-sm">ISO/IEC 25010:2023 kalite hedefleri, EN 301 549 / WCAG 2.2 AA uyumu ve bağımsız erişilebilirlik denetimi</td></tr>
    <tr><td class="border border-gray-200 p-2 text-sm"><strong>Bağış / Finans</strong></td><td class="border border-gray-200 p-2 text-sm">İç kayıt ve temel şeffaflık; bağımsız mali denetim YAPILMADI</td><td class="border border-gray-200 p-2 text-sm">IFRS/GAAP uyumlu raporlama ve KGK/ISA çerçevesinde bağımsız mali denetim</td></tr>
    <tr><td class="border border-gray-200 p-2 text-sm"><strong>Yönetişim</strong></td><td class="border border-gray-200 p-2 text-sm">Temel etik ilkeler ve karar süreçleri; bağımsız gözetim kurulu YOK</td><td class="border border-gray-200 p-2 text-sm">Belgelenmiş yönetişim yapısı, çıkar çatışması ve ihbar mekanizmaları, OECD/COSO uyumu</td></tr>
    <tr><td class="border border-gray-200 p-2 text-sm"><strong>İş Sürekliliği</strong></td><td class="border border-gray-200 p-2 text-sm">Bulut yedekleme ve dayanıklılık; resmî BCMS YOK</td><td class="border border-gray-200 p-2 text-sm">ISO 22301:2019 uyumlu iş etki analizi, kurtarma hedefleri (RTO/RPO) ve test edilmiş planlar</td></tr>
  </tbody>
</table>

<h4>5. Blok Detayları ve Mevcut Gerçekliğin Açıklaması</h4>
<p>Tablodaki her bloğun ardındaki gerçek durum aşağıda dürüstçe açıklanmıştır:</p>
<ul>
  <li><strong>Bilgi Güvenliği:</strong> hangel, aktarımda TLS şifreleme, kimlik doğrulama, en az yetki ilkesi ve bulut güvenlik kurallarını uygulamaya yönelik makul çaba gösterir. Ancak belgelenmiş bir BGYS, Uygulanabilirlik Bildirimi (SoA), periyodik bağımsız sızma testi veya ISO/IEC 27001 sertifikası <strong>henüz yoktur</strong>. Ayrıntı: bilgi güvenliği politikası ve ISO 27001 uyum beyanı.</li>
  <li><strong>Dijital Platform:</strong> Anlaşılır arayüz ve temel erişilebilirliğe yönelik çaba mevcuttur; ancak WCAG 2.2 AA tam uyumu, EN 301 549 uygunluk değerlendirmesi ve bağımsız erişilebilirlik denetimi <strong>henüz yapılmamıştır</strong>. ISO/IEC 25010:2023 kalite ölçütleri gayri resmî düzeydedir.</li>
  <li><strong>Bağış / Finans:</strong> İç kayıt tutma ve temel şeffaflık raporlaması vardır; ancak <strong>hiçbir bağımsız mali denetim yapılmamış</strong> ve IFRS/GAAP'a göre denetlenmiş finansal tablo yayımlanmamıştır.</li>
  <li><strong>Yönetişim:</strong> Temel etik ilkeler ve karar mekanizmaları bulunur; ancak bağımsız bir gözetim kurulu, belgelenmiş çıkar çatışması yönetimi ve formel ihbar (whistleblower) mekanizması henüz tam olarak kurumsallaşmamıştır.</li>
  <li><strong>İş Sürekliliği:</strong> Bulut yedekleme ve dayanıklılığa dayanılır; ancak iş etki analizi (BIA), tanımlı RTO/RPO ve test edilmiş kurtarma planları içeren resmî bir BCMS <strong>henüz yoktur</strong>.</li>
</ul>

<h4>6. Önceliklendirme Yaklaşımı</h4>
<p>hangel, sınırlı kaynaklarını en yüksek etki ve riskin bulunduğu alanlara yönlendirir. Bu kapsamda; özel nitelikli sağlık verisinin (kan grubu) güvenliği, acil kan eşleştirme hizmetinin sürekliliği ve bağış akışlarının şeffaflığı, yol haritasında en üst sırada yer alır. Daha düşük riskli iyileştirmeler, bu önceliklerin ardından sıralanır.</p>

<h4>7. Gelişim İlkeleri</h4>
<p>hangel, gelişim yol haritasını şu ilkeler etrafında yürütmeyi taahhüt eder:</p>
<ul>
  <li><strong>Önceliklendirme:</strong> Yaşamsal etki taşıyan (kan eşleştirme) ve hassas veri içeren süreçlere öncelik verilmesi.</li>
  <li><strong>Orantılılık:</strong> Kontrollerin hangel'in ölçeği ve risk düzeyiyle orantılı olarak geliştirilmesi.</li>
  <li><strong>Doğrulanabilirlik:</strong> Bir hedef gerçekleştiğinde, ilgili beyanın "hedef"ten "mevcut"a yalnızca somut kanıtla taşınması.</li>
  <li><strong>Şeffaflık:</strong> Eksiklerin gizlenmemesi; bu beyanın güncel tutulması.</li>
</ul>

<h4>8. Taahhüt ve Şeffaflık</h4>
<p>hangel, bu beyanda listelenen hedeflere ulaşmak için iyi niyetli ve makul çaba göstermeyi taahhüt eder. Hiçbir standart, fiilen sağlanmadan ve mümkün olduğunda bağımsız biçimde doğrulanmadan "sağlanmış" olarak sunulmayacaktır. Bu belge, hangel'in dürüstlük taahhüdünün kalıcı bir kaydıdır ve diğer tüm uyum beyanları bu ilkeyle birlikte okunmalıdır. Sorular <a href="mailto:dpo@hangel.org" rel="noopener" target="_blank">dpo@hangel.org</a> ve TR için <a href="mailto:kvkk@hangel.org" rel="noopener" target="_blank">kvkk@hangel.org</a> adreslerine iletilebilir.</p>

<h4>9. Değişiklik ve Yürürlük</h4>
<p>Bu beyan; yol haritasındaki ilerlemeler, mevzuat ve standart güncellemeleri doğrultusunda gözden geçirilir. Güncel sürüm, platformda yayımlandığı tarihte yürürlüğe girer.</p>

<p class="text-xs text-muted-foreground"><em>Bu metin bilgilendirme amaçlıdır ve bağlayıcı nihai hukuki görüş niteliği taşımaz; yürürlük öncesi yetkili hukuk danışmanlığı önerilir.</em></p>
    `
  },

  // --- G. ISO / Uluslararası Sertifikasyonlar ---
  {
    slug: 'iso-27001-uyum-beyani',
    title: 'ISO 27001 Uyum Beyanı (Bilgi Güvenliği)',
    content: `
      <h3>ISO 27001 Uyum Beyanı (Bilgi Güvenliği)</h3>

<p>Bu beyan, hangel platformunun <strong>ISO/IEC 27001:2022</strong> Bilgi Güvenliği Yönetim Sistemi (BGYS) standardına ilişkin konumunu dürüstçe açıklar. Platformu işleten tüzel kişi <strong>hangel AŞ</strong>'dir. Kullanıcıya görünen tüm düz metinde "hangel" küçük harfle yazılır.</p>

<blockquote><p><strong>Açık beyan:</strong> hangel, ISO/IEC 27001:2022 standardına <strong>uyum sağlamayı hedefler</strong>; ancak <em>henüz bu standarda göre sertifikalı veya akredite DEĞİLDİR</em> ve bağımsız bir belgelendirme denetiminden geçmemiştir. Aşağıda yer alan ifadeler, bir uygunluk belgesi değil; mevcut durumun ve gelişim hedeflerinin şeffaf bir özetidir.</p></blockquote>

<h4>1. Amaç</h4>
<p>Bu beyanın amacı; hangel'in bilgi güvenliği yönetimi konusundaki yaklaşımını, ISO/IEC 27001:2022 çerçevesini referans alarak ortaya koymak ve hangi unsurların mevcut, hangilerinin hedef olduğunu açıkça ayırt etmektir. hangel, gizlilik, bütünlük ve erişilebilirlik ilkelerini bir BGYS olgunluğuna taşımayı amaçlar.</p>

<h4>2. Kapsam</h4>
<p>Beyan; hangel'in mobil/web uygulamaları, bulut altyapısı (Google Cloud / Firebase — Firestore, Authentication, Storage; Apple), kaynak kodu, idari sistemleri, personeli, gönüllüleri ve yetkili üçüncü taraflarını kapsar. İşlenen varlıklar arasında özel nitelikli sağlık verisi (kan grubu) ve finansal veriler (IBAN/ödeme) gibi yüksek hassasiyetli kategoriler bulunur.</p>

<h4>3. Referans Standart — "Henüz Sertifikalı/Akredite Değiliz"</h4>
<p>ISO/IEC 27001:2022, bir BGYS'nin kurulması, uygulanması, sürdürülmesi ve sürekli iyileştirilmesi için gereklilikleri belirler; planla-uygula-kontrol et-önlem al (PDCA) yaklaşımını esas alır ve Annex A kontrol setini (dört tema: organizasyonel, kişiler, fiziksel ve teknolojik kontroller) içerir. hangel:</p>
<ul>
  <li>ISO/IEC 27001:2022 <strong>sertifikasına sahip değildir</strong>.</li>
  <li>Bağımsız bir belgelendirme kuruluşu denetiminden <strong>geçmemiştir</strong>.</li>
  <li>Tam kapsamlı, belgelenmiş bir BGYS'yi henüz <strong>tesis etmemiştir</strong>.</li>
</ul>
<p>Bu nedenle metnin tamamında "hedefler, taahhüt eder, amaçlar, yol haritasında yer alır" ifadeleri kullanılmıştır; "sertifikalıdır / denetlenmiştir / düzenli olarak yapılmaktadır" ifadeleri <strong>bilinçli olarak kullanılmamıştır</strong>.</p>

<h4>4. Mevcut / Uygulanan Kontroller</h4>
<p>hangel, ISO/IEC 27002:2022 kontrol temalarıyla örtüşen aşağıdaki gerçekçi önlemleri uygulamaya yönelik çaba gösterir:</p>
<ul>
  <li><strong>Teknolojik:</strong> Aktarımda TLS/HTTPS şifreleme; bulut varsayılan depolama şifrelemesi; Firestore/Storage güvenlik kuralları.</li>
  <li><strong>Erişim:</strong> Firebase Authentication ile kimlik doğrulama; en az yetki ilkesi; idari erişimin sınırlandırılması.</li>
  <li><strong>Organizasyonel:</strong> Temel bilgi güvenliği ilkeleri ve bu beyanı içeren politika dokümantasyonu.</li>
  <li><strong>Dayanıklılık:</strong> Bulut sağlayıcının yedekleme olanaklarından yararlanma.</li>
</ul>

<h4>5. Gelişim Yol Haritası ve Hedefler</h4>
<p>Aşağıdaki tablo, ISO/IEC 27001:2022'nin temel unsurları bakımından hangel'in mevcut durumunu ve hedefini karşılaştırır.</p>
<table class="w-full border-collapse border border-gray-200 my-4">
  <thead>
    <tr>
      <th class="border border-gray-200 p-2 text-left text-sm" scope="col">Alan</th>
      <th class="border border-gray-200 p-2 text-left text-sm" scope="col">Mevcut Durum</th>
      <th class="border border-gray-200 p-2 text-left text-sm" scope="col">Hedef</th>
    </tr>
  </thead>
  <tbody>
    <tr><td class="border border-gray-200 p-2 text-sm">Sertifikasyon</td><td class="border border-gray-200 p-2 text-sm">Yok</td><td class="border border-gray-200 p-2 text-sm">Akredite kuruluşça ISO/IEC 27001:2022 belgelendirmesi</td></tr>
    <tr><td class="border border-gray-200 p-2 text-sm">BGYS kapsamı</td><td class="border border-gray-200 p-2 text-sm">Resmî olarak tanımlanmadı</td><td class="border border-gray-200 p-2 text-sm">Belgelenmiş kapsam ve bağlam analizi (Madde 4)</td></tr>
    <tr><td class="border border-gray-200 p-2 text-sm">Liderlik ve politika</td><td class="border border-gray-200 p-2 text-sm">Temel politika mevcut</td><td class="border border-gray-200 p-2 text-sm">Üst yönetim taahhüdü ve roller (Madde 5)</td></tr>
    <tr><td class="border border-gray-200 p-2 text-sm">Risk değerlendirme/işleme</td><td class="border border-gray-200 p-2 text-sm">Gayri resmî</td><td class="border border-gray-200 p-2 text-sm">Belgelenmiş risk metodolojisi (Madde 6) ve SoA</td></tr>
    <tr><td class="border border-gray-200 p-2 text-sm">Annex A kontrolleri</td><td class="border border-gray-200 p-2 text-sm">Seçili teknik kontroller</td><td class="border border-gray-200 p-2 text-sm">Tüm uygulanabilir kontrollerin gözden geçirilmesi</td></tr>
    <tr><td class="border border-gray-200 p-2 text-sm">İç denetim ve YGG</td><td class="border border-gray-200 p-2 text-sm">Yok</td><td class="border border-gray-200 p-2 text-sm">Periyodik iç denetim ve yönetimin gözden geçirmesi (Madde 9)</td></tr>
    <tr><td class="border border-gray-200 p-2 text-sm">Sürekli iyileştirme</td><td class="border border-gray-200 p-2 text-sm">Geçici</td><td class="border border-gray-200 p-2 text-sm">Düzeltici faaliyet ve iyileştirme döngüsü (Madde 10)</td></tr>
  </tbody>
</table>

<h4>6. ISO/IEC 27002:2022 Kontrol Temaları — hangel'in Konumu</h4>
<p>ISO/IEC 27002:2022, kontrolleri dört tema altında düzenler. hangel'in her temadaki mevcut yaklaşımı ve hedefleri aşağıda dürüstçe özetlenmiştir:</p>
<ul>
  <li><strong>Organizasyonel kontroller:</strong> Mevcut — temel bilgi güvenliği politikası ve erişim ilkeleri. Hedef — belgelenmiş roller, tedarikçi güvenliği yönetimi ve risk değerlendirme süreci.</li>
  <li><strong>Kişilere ilişkin kontroller:</strong> Mevcut — gayri resmî farkındalık ve gizlilik yükümlülüğü. Hedef — kayıtlı eğitim, işe alım/ayrılma güvenlik süreçleri ve disiplin çerçevesi.</li>
  <li><strong>Fiziksel kontroller:</strong> Mevcut — büyük ölçüde yönetilen bulut altyapısına (Google Cloud / Firebase) devredilen fiziksel güvenlik. Hedef — kendi idari ortamları için fiziksel erişim ilkelerinin belgelenmesi.</li>
  <li><strong>Teknolojik kontroller:</strong> Mevcut — TLS şifreleme, kimlik doğrulama, güvenlik kuralları, yedekleme. Hedef — çok faktörlü kimlik doğrulama, merkezî günlükleme/izleme, açık yönetimi ve periyodik test.</li>
</ul>
<p>Bu özet, hangi temada nerede olunduğunu gösterir; hiçbir tema bakımından tam uyum veya sertifikasyon iddiası taşımaz.</p>

<h4>7. PDCA Döngüsü ve BGYS Maddeleri</h4>
<p>ISO/IEC 27001:2022, BGYS'yi Madde 4 (kuruluşun bağlamı), Madde 5 (liderlik), Madde 6 (planlama), Madde 7 (destek), Madde 8 (operasyon), Madde 9 (performans değerlendirme) ve Madde 10 (iyileştirme) yapısında ele alır. hangel, bu maddelerin gerektirdiği belgelenmiş süreçleri kademeli olarak tesis etmeyi hedefler; bugün itibarıyla bu süreçler tam ve resmî biçimde kurulmuş <strong>değildir</strong>.</p>

<h4>8. Hukuki Bağlantı</h4>
<p>Bu beyan, bağlayıcı yükümlülükler bakımından <strong>KVKK m.12</strong> (veri güvenliği tedbirleri) ve <strong>GDPR Art.32</strong> (işleme güvenliği) ile birlikte değerlendirilir. ISO/IEC 27001'e gönüllü uyum, bu yasal yükümlülüklerin yerini almaz; onları destekleyen bir iyi uygulama çerçevesidir.</p>

<h4>9. Taahhüt ve Şeffaflık</h4>
<p>hangel, BGYS olgunluğunu artırmak için makul ve iyi niyetli çaba göstermeyi taahhüt eder. Bir belgelendirme elde edildiğinde bu beyan güncellenecek ve durumu doğrulanabilir kanıtla yansıtacaktır; o zamana kadar hiçbir sertifikasyon iddiasında bulunulmaz. Bilgi güvenliği soruları <a href="mailto:dpo@hangel.org" rel="noopener" target="_blank">dpo@hangel.org</a> ve TR için <a href="mailto:kvkk@hangel.org" rel="noopener" target="_blank">kvkk@hangel.org</a> adreslerine iletilebilir.</p>

<h4>10. Değişiklik ve Yürürlük</h4>
<p>Bu beyan; standart güncellemeleri ve yol haritasındaki ilerlemeler doğrultusunda gözden geçirilir. Güncel sürüm, platformda yayımlandığı tarihte yürürlüğe girer.</p>

<p class="text-xs text-muted-foreground"><em>Bu metin bilgilendirme amaçlıdır ve bağlayıcı nihai hukuki görüş niteliği taşımaz; yürürlük öncesi yetkili hukuk danışmanlığı önerilir.</em></p>
    `
  },
  {
    slug: 'iso-22301-uyum-beyani',
    title: 'ISO 22301 Uyum Beyanı (İş Sürekliliği)',
    content: `
      <h3>ISO 22301 Uyum Beyanı (İş Sürekliliği)</h3>

<p>Bu beyan, hangel platformunun <strong>ISO 22301:2019</strong> İş Sürekliliği Yönetim Sistemi (BCMS) standardına ilişkin konumunu dürüstçe açıklar. Platformu işleten tüzel kişi <strong>hangel AŞ</strong>'dir. Kullanıcıya görünen tüm düz metinde "hangel" küçük harfle yazılır. hangel, acil kan eşleştirme gibi yaşamsal bir hizmet sunduğundan, hizmet sürekliliği özel önem taşır.</p>

<blockquote><p><strong>Açık beyan:</strong> hangel, ISO 22301:2019 standardına <strong>uyum sağlamayı hedefler</strong>; ancak <em>henüz bu standarda göre sertifikalı veya akredite DEĞİLDİR</em> ve resmî, belgelenmiş bir BCMS tesis etmemiştir. Aşağıdaki ifadeler bir uygunluk belgesi değil; mevcut durumun ve gelişim hedeflerinin şeffaf bir özetidir.</p></blockquote>

<h4>1. Amaç</h4>
<p>Bu beyanın amacı; hangel'in olası kesinti, felaket ve hizmet aksaması durumlarında iş sürekliliğine ilişkin yaklaşımını, ISO 22301:2019 çerçevesini referans alarak dürüstçe ortaya koymaktır. hangel, kritik hizmetlerin (özellikle acil kan talebi/eşleştirme) kesinti hâlinde mümkün olan en kısa sürede ayağa kaldırılabilmesini hedefler.</p>

<h4>2. Kapsam</h4>
<p>Beyan; hangel'in mobil/web uygulamaları, bulut altyapısı (Google Cloud / Firebase; Apple), verileri, personeli ve kritik tedarikçilerini kapsar. Kritik süreçler arasında acil kan eşleştirme, kullanıcı kimlik doğrulama ve bağış aktarımı yer alır.</p>

<h4>3. Referans Standart — "Henüz Sertifikalı/Akredite Değiliz"</h4>
<p>ISO 22301:2019; bir BCMS'nin planlanması, kurulması, uygulanması, izlenmesi ve sürekli iyileştirilmesi için gereklilikleri belirler ve planla-uygula-kontrol et-önlem al (PDCA) yaklaşımıyla bağlam, liderlik, planlama, destek, operasyon, performans değerlendirme ve iyileştirme (Madde 4-10) bileşenlerini kapsar. hangel:</p>
<ul>
  <li>ISO 22301:2019 <strong>sertifikasına sahip değildir</strong>.</li>
  <li>Bağımsız bir belgelendirme denetiminden <strong>geçmemiştir</strong>.</li>
  <li>İş etki analizi (BIA) ve risk değerlendirmesini içeren tam bir BCMS'yi henüz <strong>belgelememiştir</strong>.</li>
</ul>
<p>Metin boyunca "hedefler / taahhüt eder / amaçlar / yol haritasında" ifadeleri kullanılmış; "sertifikalıdır / düzenli olarak test edilmektedir" ifadelerinden <strong>bilinçle kaçınılmıştır</strong>.</p>

<h4>4. Mevcut / Uygulanan Kontroller</h4>
<p>hangel, hizmet dayanıklılığı için aşağıdaki gerçekçi önlemlere dayanır:</p>
<ul>
  <li><strong>Yönetilen bulut altyapısı:</strong> Google Cloud / Firebase'in yüksek erişilebilirlik ve coğrafi dağıtım olanaklarından yararlanma.</li>
  <li><strong>Yedekleme:</strong> Bulut sağlayıcının veri yedekleme ve dayanıklılık mekanizmaları.</li>
  <li><strong>Sağlayıcı SLA'ları:</strong> Altyapı sağlayıcılarının hizmet seviyesi ve süreklilik taahhütlerine dayanma.</li>
  <li><strong>Temel olay yaklaşımı:</strong> Kesinti hâlinde temel müdahale ve kullanıcı bilgilendirme yaklaşımı.</li>
</ul>

<h4>5. Gelişim Yol Haritası ve Hedefler</h4>
<p>Aşağıdaki tablo, ISO 22301:2019'un temel unsurları bakımından hangel'in mevcut durumunu ve hedefini karşılaştırır.</p>
<table class="w-full border-collapse border border-gray-200 my-4">
  <thead>
    <tr>
      <th class="border border-gray-200 p-2 text-left text-sm" scope="col">Alan</th>
      <th class="border border-gray-200 p-2 text-left text-sm" scope="col">Mevcut Durum</th>
      <th class="border border-gray-200 p-2 text-left text-sm" scope="col">Hedef</th>
    </tr>
  </thead>
  <tbody>
    <tr><td class="border border-gray-200 p-2 text-sm">Sertifikasyon</td><td class="border border-gray-200 p-2 text-sm">Yok</td><td class="border border-gray-200 p-2 text-sm">ISO 22301:2019 belgelendirmesi (ölçek elverdiğinde)</td></tr>
    <tr><td class="border border-gray-200 p-2 text-sm">İş etki analizi (BIA)</td><td class="border border-gray-200 p-2 text-sm">Resmî BIA yok</td><td class="border border-gray-200 p-2 text-sm">Kritik süreçler için belgelenmiş BIA</td></tr>
    <tr><td class="border border-gray-200 p-2 text-sm">Kurtarma hedefleri (RTO/RPO)</td><td class="border border-gray-200 p-2 text-sm">Tanımlanmadı</td><td class="border border-gray-200 p-2 text-sm">Kan eşleştirme gibi kritik süreçler için RTO/RPO belirlenmesi</td></tr>
    <tr><td class="border border-gray-200 p-2 text-sm">İş sürekliliği planı</td><td class="border border-gray-200 p-2 text-sm">Temel, gayri resmî yaklaşım</td><td class="border border-gray-200 p-2 text-sm">Belgelenmiş iş sürekliliği ve felaket kurtarma planı</td></tr>
    <tr><td class="border border-gray-200 p-2 text-sm">Tatbikat/test</td><td class="border border-gray-200 p-2 text-sm">Henüz yapılmadı</td><td class="border border-gray-200 p-2 text-sm">Planların periyodik tatbikatı ve gözden geçirilmesi</td></tr>
    <tr><td class="border border-gray-200 p-2 text-sm">Tedarikçi sürekliliği</td><td class="border border-gray-200 p-2 text-sm">Sağlayıcı SLA'larına dayanma</td><td class="border border-gray-200 p-2 text-sm">Kritik tedarikçi süreklilik değerlendirmesi ve yedeklilik</td></tr>
  </tbody>
</table>

<h4>6. BCMS Yapısı ve hangel'in Konumu</h4>
<p>ISO 22301:2019, bir BCMS'yi Madde 4 (kuruluşun bağlamı), Madde 5 (liderlik), Madde 6 (planlama), Madde 7 (destek), Madde 8 (operasyon — iş etki analizi, risk değerlendirmesi, süreklilik stratejileri ve planları), Madde 9 (performans değerlendirme) ve Madde 10 (iyileştirme) maddeleri etrafında düzenler. hangel, bu maddelerin gerektirdiği belgelenmiş süreçleri henüz resmî olarak tesis etmemiştir; ancak kademeli olarak kurmayı hedefler. Özellikle Madde 8 kapsamındaki iş etki analizi, hangel için en öncelikli adımdır.</p>

<h4>7. Kritik Hizmet: Acil Kan Eşleştirme</h4>
<p>hangel'in en yüksek süreklilik önceliği, acil kan talebi/eşleştirme hizmetidir. Bu hizmetin kesintisi doğrudan yaşamsal sonuçlar doğurabileceğinden, hangel bu süreç için en düşük kurtarma süresi (RTO) ve en düşük veri kaybı (RPO) hedeflerini belirlemeyi amaçlar. Bugün itibarıyla bu hedefler resmî olarak <strong>tanımlanmamış</strong> olmakla birlikte, bulut altyapısının yüksek erişilebilirlik olanakları bu yönde temel bir dayanak sağlar. hangel, bu kritik akış için yedeklilik ve alternatif erişim yollarını güçlendirmeyi taahhüt eder.</p>

<h4>8. Olası Kesinti Senaryoları ve Müdahale Yaklaşımı</h4>
<p>hangel, iş sürekliliğini etkileyebilecek başlıca senaryoları dürüstçe değerlendirir ve her biri için makul bir müdahale yaklaşımı benimsemeyi hedefler:</p>
<ul>
  <li><strong>Bulut altyapısı kesintisi:</strong> Sağlayıcının yüksek erişilebilirlik ve coğrafi yedeklilik olanaklarına dayanma; bölgesel arıza hâlinde alternatif erişim yollarının güçlendirilmesi hedefi.</li>
  <li><strong>Veri kaybı/bozulması:</strong> Bulut yedeklerinden geri yükleme; tanımlı RPO hedefiyle veri kaybının sınırlandırılması (hedef).</li>
  <li><strong>Siber güvenlik olayı:</strong> Bilgi güvenliği politikası ve olay müdahale yaklaşımıyla birlikte ele alınması; KVKK m.12/5 uyarınca ihlal bildirimi.</li>
  <li><strong>Tedarikçi/ödeme kuruluşu kesintisi:</strong> Bağış akışlarının etkilenmesi hâlinde kullanıcı bilgilendirmesi ve alternatif kanal değerlendirmesi.</li>
  <li><strong>Personel erişilebilirliği:</strong> Kritik görevlerde bilgi ve yetki yedekliliğinin sağlanması hedefi.</li>
</ul>
<p>Bu senaryolar için bugün resmî, test edilmiş planlar <strong>bulunmamakla birlikte</strong>, hangel temel bir hazırlık düzeyini sürdürür ve bunu yol haritasında belgelenmiş planlara dönüştürmeyi taahhüt eder.</p>

<h4>9. Hukuki ve Operasyonel Bağlam</h4>
<p>İş sürekliliği, veri erişilebilirliği boyutuyla <strong>KVKK m.12</strong> ve <strong>GDPR Art.32</strong> kapsamındaki "erişilebilirlik" ilkesiyle; risk yönetimi boyutuyla <strong>ISO 31000</strong> ve <strong>NIST SP 800-34</strong> rehberleriyle bağlantılıdır. hangel, bu çerçeveleri yasal zorunluluk düzeyine bakılmaksızın gönüllü iyi uygulama olarak benimsemeyi hedefler. Veri güvenliği boyutuyla bilgi güvenliği politikası ile birlikte değerlendirilir.</p>

<h4>9. Taahhüt ve Şeffaflık</h4>
<p>hangel, iş sürekliliği olgunluğunu artırmak için makul ve iyi niyetli çaba göstermeyi taahhüt eder; özellikle yaşamsal kan eşleştirme hizmetinin sürekliliğini önceliklendirir. Bir BCMS tesis edildikçe ve bağımsız biçimde doğrulandıkça bu beyan güncellenecektir; o zamana kadar hiçbir sertifikasyon iddiasında bulunulmaz. Sorular <a href="mailto:dpo@hangel.org" rel="noopener" target="_blank">dpo@hangel.org</a> adresine iletilebilir.</p>

<h4>10. Değişiklik ve Yürürlük</h4>
<p>Bu beyan; standart güncellemeleri ve yol haritasındaki ilerlemeler doğrultusunda gözden geçirilir. Güncel sürüm, platformda yayımlandığı tarihte yürürlüğe girer.</p>

<p class="text-xs text-muted-foreground"><em>Bu metin bilgilendirme amaçlıdır ve bağlayıcı nihai hukuki görüş niteliği taşımaz; yürürlük öncesi yetkili hukuk danışmanlığı önerilir.</em></p>
    `
  },
  {
    slug: 'iso-25010-en-301-549-uyum-beyani',
    title: 'ISO / IEC 25010 / EN 301 549 Uyum Beyanı (Dijital Platform Standartları)',
    content: `
      <h3>ISO / IEC 25010 / EN 301 549 Uyum Beyanı (Dijital Platform Standartları)</h3>

<p>Bu beyan, hangel platformunun dijital ürün kalitesi ve erişilebilirlik standartlarına — <strong>ISO/IEC 25010:2023</strong>, <strong>EN 301 549</strong> ve <strong>WCAG 2.2 AA</strong> — ilişkin konumunu dürüstçe açıklar. Platformu işleten tüzel kişi <strong>hangel AŞ</strong>'dir. Kullanıcıya görünen tüm düz metinde "hangel" küçük harfle yazılır. hangel, herkesin erişebileceği kapsayıcı bir platform olmayı hedefler.</p>

<blockquote><p><strong>Açık beyan:</strong> hangel, bu standartlara <strong>uyum sağlamayı hedefler</strong>; ancak <em>henüz bu standartlara göre sertifikalı, denetlenmiş veya bağımsız biçimde doğrulanmış DEĞİLDİR</em>. Aşağıdaki ifadeler bir uygunluk belgesi değil; mevcut durumun ve gelişim hedeflerinin şeffaf bir özetidir.</p></blockquote>

<h4>1. Amaç</h4>
<p>Bu beyanın amacı; hangel'in dijital platformunun kalite ve erişilebilirlik yaklaşımını uluslararası ve AB standartlarını referans alarak ortaya koymak ve mevcut önlemler ile hedefleri açıkça ayırt etmektir.</p>

<h4>2. Kapsam</h4>
<p>Beyan; hangel'in mobil ve web uygulamalarının kullanıcı arayüzünü, etkileşim tasarımını, performansını ve engelli kullanıcılar dâhil tüm kullanıcılar için erişilebilirliğini kapsar.</p>

<h4>3. Referans Standart — "Henüz Sertifikalı/Denetlenmiş Değiliz"</h4>
<p>hangel aşağıdaki standartları <strong>referans</strong> alır:</p>
<ul>
  <li><strong>ISO/IEC 25010:2023</strong> — Sistem ve yazılım ürün kalite modeli. 2023 revizyonu dokuz kalite özelliği tanımlar: işlevsel uygunluk, performans verimliliği, uyumluluk, <em>etkileşim yeteneği (interaction capability — eski "kullanılabilirlik")</em>, güvenilirlik, güvenlik, sürdürülebilirlik, <em>esneklik (flexibility — eski "taşınabilirlik")</em> ve <em>güvenli işletim (safety)</em>.</li>
  <li><strong>EN 301 549</strong> — Avrupa BİT erişilebilirlik standardı; WCAG'ı esas alarak BİT ürün ve hizmetleri için erişilebilirlik gerekliliklerini belirler. <strong>Avrupa Erişilebilirlik Yasası — Directive (EU) 2019/882</strong> ile ilişkilidir.</li>
  <li><strong>WCAG 2.2 AA</strong> — Web İçeriği Erişilebilirlik Kılavuzu; algılanabilir, işletilebilir, anlaşılabilir ve sağlam (POUR) ilkelerine dayanır.</li>
</ul>
<p>hangel bu standartların hiçbiri için sertifikalı, akredite veya bağımsız erişilebilirlik denetiminden geçmiş <strong>değildir</strong>. Türkiye bakımından erişilebilirlik, ayrıca <strong>5378 sayılı Engelliler Hakkında Kanun</strong> çerçevesinde değerlendirilir.</p>

<h4>4. Mevcut / Uygulanan Önlemler</h4>
<p>hangel, aşağıdaki gerçekçi önlemlere yönelik çaba gösterir:</p>
<ul>
  <li>Anlaşılır arayüz, okunabilir tipografi ve makul renk kontrastına yönelik temel çaba.</li>
  <li>Mobil platformların yerleşik erişilebilirlik özellikleriyle (ekran okuyucu, dinamik yazı boyutu) temel uyum hedefi.</li>
  <li>Acil kan talebi gibi kritik akışların sade ve hızlı tasarlanması.</li>
  <li>Geri bildirim üzerine erişilebilirlik sorunlarını giderme yaklaşımı.</li>
</ul>

<h4>5. Gelişim Yol Haritası ve Hedefler</h4>
<p>Aşağıdaki tablo, dijital platform kalitesi ve erişilebilirlik bakımından hangel'in mevcut durumunu ve hedefini karşılaştırır.</p>
<table class="w-full border-collapse border border-gray-200 my-4">
  <thead>
    <tr>
      <th class="border border-gray-200 p-2 text-left text-sm" scope="col">Alan</th>
      <th class="border border-gray-200 p-2 text-left text-sm" scope="col">Mevcut Durum</th>
      <th class="border border-gray-200 p-2 text-left text-sm" scope="col">Hedef</th>
    </tr>
  </thead>
  <tbody>
    <tr><td class="border border-gray-200 p-2 text-sm">WCAG 2.2 AA uyumu</td><td class="border border-gray-200 p-2 text-sm">Kısmi, doğrulanmamış</td><td class="border border-gray-200 p-2 text-sm">Tam WCAG 2.2 AA uyumu ve bağımsız erişilebilirlik denetimi</td></tr>
    <tr><td class="border border-gray-200 p-2 text-sm">EN 301 549</td><td class="border border-gray-200 p-2 text-sm">Resmî değerlendirme yok</td><td class="border border-gray-200 p-2 text-sm">EN 301 549 kapsamında uygunluk değerlendirmesi</td></tr>
    <tr><td class="border border-gray-200 p-2 text-sm">Ekran okuyucu desteği</td><td class="border border-gray-200 p-2 text-sm">Temel</td><td class="border border-gray-200 p-2 text-sm">Tüm kritik akışlarda tam ekran okuyucu uyumu</td></tr>
    <tr><td class="border border-gray-200 p-2 text-sm">Klavye erişimi</td><td class="border border-gray-200 p-2 text-sm">Kısmi</td><td class="border border-gray-200 p-2 text-sm">Tam klavye ile gezinme desteği</td></tr>
    <tr><td class="border border-gray-200 p-2 text-sm">Kalite modeli (ISO 25010)</td><td class="border border-gray-200 p-2 text-sm">Gayri resmî</td><td class="border border-gray-200 p-2 text-sm">ISO/IEC 25010:2023 özelliklerine göre ölçülebilir kalite hedefleri</td></tr>
    <tr><td class="border border-gray-200 p-2 text-sm">Erişilebilirlik beyanı</td><td class="border border-gray-200 p-2 text-sm">Bu belge</td><td class="border border-gray-200 p-2 text-sm">Düzenli güncellenen, test sonuçlarına dayalı erişilebilirlik beyanı</td></tr>
  </tbody>
</table>

<h4>6. ISO/IEC 25010:2023 Kalite Özellikleri ve hangel'in Yaklaşımı</h4>
<p>2023 revizyonunun dokuz kalite özelliği bakımından hangel'in mevcut yaklaşımı dürüstçe şöyle özetlenebilir:</p>
<ul>
  <li><strong>İşlevsel uygunluk:</strong> Kan eşleştirme, bağış ve gönüllülük akışlarının amaçlanan işlevleri karşılaması hedeflenir.</li>
  <li><strong>Performans verimliliği:</strong> Acil akışların hızlı yanıt vermesi için makul çaba; resmî performans ölçümleri henüz sistematik değildir.</li>
  <li><strong>Uyumluluk:</strong> Yaygın cihaz ve işletim sistemleriyle uyum hedeflenir.</li>
  <li><strong>Etkileşim yeteneği:</strong> Anlaşılır, kapsayıcı ve erişilebilir arayüz hedeflenir; tam doğrulama henüz yapılmamıştır.</li>
  <li><strong>Güvenilirlik:</strong> Hizmetin kararlı çalışması hedeflenir; resmî dayanıklılık ölçütleri belirlenmemiştir.</li>
  <li><strong>Güvenlik:</strong> Bilgi güvenliği politikası ile birlikte değerlendirilir.</li>
  <li><strong>Sürdürülebilirlik (bakım):</strong> Kodun bakımı ve geliştirilebilirliği için makul mühendislik uygulamaları benimsenir.</li>
  <li><strong>Esneklik:</strong> Yeni özellik ve ölçeklere uyarlanabilirlik hedeflenir.</li>
  <li><strong>Güvenli işletim (safety):</strong> Yaşamsal kan eşleştirme akışında hatalı çıktıların zarar doğurmaması için temkinli tasarım hedeflenir.</li>
</ul>
<p>Bu özellikler bakımından hangel, ölçülebilir hedefler tanımlamayı amaçlar; bugün itibarıyla resmî, belgelenmiş bir kalite ölçüm sistemi <strong>bulunmamaktadır</strong>.</p>

<h4>7. Erişilebilirliğin Hukuki Bağlamı</h4>
<p>Erişilebilirlik, yalnızca teknik bir hedef değil, aynı zamanda bir hak meselesidir. Türkiye'de <strong>5378 sayılı Engelliler Hakkında Kanun</strong> ve <strong>Anayasa m.10</strong> (eşitlik ilkesi) çerçevesinde; AB'de ise <strong>Avrupa Erişilebilirlik Yasası — Directive (EU) 2019/882</strong> ve EN 301 549 çerçevesinde erişilebilirlik gözetilir. hangel, yasal zorunluluk düzeyine bakılmaksızın, engelli kullanıcıların hizmetlere eşit erişimini bir etik öncelik olarak benimser. Ancak bu öncelik, henüz resmî bir uygunluk değerlendirmesiyle <strong>doğrulanmamıştır</strong>.</p>

<h4>8. Geri Bildirim ve Şikâyet Kanalı</h4>
<p>Erişilebilirlik engeliyle karşılaşan kullanıcılar, durumu hangel'e bildirebilir; hangel makul sürede çözüm üretmeyi hedefler. Geri bildirimler <a href="mailto:privacy@hangel.org" rel="noopener" target="_blank">privacy@hangel.org</a> ve TR için <a href="mailto:kvkk@hangel.org" rel="noopener" target="_blank">kvkk@hangel.org</a> adreslerine iletilebilir.</p>

<h4>9. Taahhüt ve Şeffaflık</h4>
<p>hangel, dijital platform kalitesini ve erişilebilirliğini sürekli iyileştirmeyi taahhüt eder; mevcut durum ile hedef arasındaki farkı dürüstçe açıklar. Bağımsız değerlendirme ve test sonuçları elde edildikçe bu beyan güncellenecek; o zamana kadar hiçbir uygunluk/sertifikasyon iddiasında bulunulmayacaktır.</p>

<h4>10. Değişiklik ve Yürürlük</h4>
<p>Bu beyan; standart güncellemeleri ve yol haritasındaki ilerlemeler doğrultusunda gözden geçirilir. Güncel sürüm, platformda yayımlandığı tarihte yürürlüğe girer.</p>

<p class="text-xs text-muted-foreground"><em>Bu metin bilgilendirme amaçlıdır ve bağlayıcı nihai hukuki görüş niteliği taşımaz; yürürlük öncesi yetkili hukuk danışmanlığı önerilir.</em></p>
    `
  },

  // --- H. Dış Denetim / Mali ve Finansal Sertifikasyon ---
  {
    slug: 'bagimsiz-mali-denetim-ve-ifrs-gaap-beyani',
    title: 'Bağımsız Mali Denetim ve IFRS / GAAP Beyanı',
    content: `
      <h3>Bağımsız Mali Denetim ve IFRS / GAAP Beyanı</h3>

<p>Bu beyan, hangel platformunun mali raporlama ve bağımsız denetim standartlarına — <strong>IFRS</strong>, <strong>US GAAP</strong>, <strong>ISA</strong> ve Türkiye'de <strong>KGK Bağımsız Denetim mevzuatı</strong> — ilişkin konumunu dürüstçe açıklar. Platformu işleten tüzel kişi <strong>hangel AŞ</strong>'dir. Kullanıcıya görünen tüm düz metinde "hangel" küçük harfle yazılır. hangel, bağış ve fon akışlarında şeffaflığı temel bir sorumluluk olarak benimser.</p>

<blockquote><p><strong>Açık ve önemli beyan:</strong> hangel hakkında <em>henüz herhangi bir bağımsız mali denetim YAPILMAMIŞ ve bağımsız denetim raporu YAYIMLANMAMIŞTIR</em>. hangel'in IFRS, US GAAP veya ISA standartlarına göre denetlenmiş finansal tabloları <strong>bulunmamaktadır</strong>. Aşağıdaki ifadeler bir denetim sonucu değil; mevcut durumun ve gelecekteki taahhütlerin şeffaf bir özetidir.</p></blockquote>

<h4>1. Amaç ve Kapsam</h4>
<p>Bu beyanın amacı; hangel'in mali raporlama ve denetim konusundaki mevcut durumunu ve gelecekteki taahhütlerini, hiçbir yanıltıcı izlenim vermeden ortaya koymaktır. Kapsam; hangel'in bağış toplama, fon aktarımı ve operasyonel mali süreçlerine ilişkin kayıt, raporlama ve denetim boyutudur.</p>

<h4>2. Yasal Dayanak ve Referans Çerçeve</h4>
<p>hangel, mali şeffaflıkta aşağıdaki çerçeveleri referans alır:</p>
<ul>
  <li><strong>IFRS (Uluslararası Finansal Raporlama Standartları)</strong> ve <strong>US GAAP</strong> — finansal raporlama çerçeveleri.</li>
  <li><strong>ISA (Uluslararası Denetim Standartları)</strong> — bağımsız denetimin yürütülmesine ilişkin standartlar.</li>
  <li><strong>KGK (Kamu Gözetimi, Muhasebe ve Denetim Standartları Kurumu) Bağımsız Denetim Yönetmeliği</strong> — Türkiye'de bağımsız denetimin hukuki çerçevesi.</li>
  <li><strong>6102 sayılı Türk Ticaret Kanunu</strong> — anonim şirketlerin defter, kayıt ve denetim yükümlülükleri (bağımsız denetime tabi olma eşikleri dâhil).</li>
  <li><strong>2860 sayılı Yardım Toplama Kanunu</strong> — yardım toplama faaliyetlerinde hesap verebilirlik (ilgili olduğu ölçüde).</li>
</ul>

<h4>3. Bağımsız Denetim Yükümlülüğü — Mevcut Durum</h4>
<p>Türkiye'de bağımsız denetime tabi olma, Cumhurbaşkanı kararıyla belirlenen aktif büyüklük, hasılat ve çalışan sayısı eşiklerine bağlıdır. hangel:</p>
<ul>
  <li>Bugün itibarıyla bir bağımsız mali denetim <strong>yaptırmamıştır</strong>.</li>
  <li>IFRS/US GAAP'a göre denetlenmiş finansal tablolar <strong>yayımlamamıştır</strong>.</li>
  <li>Denetlenmiş finansal verilere dayalı herhangi bir beyanı <strong>bulunmamaktadır</strong>.</li>
</ul>
<p>Bu nedenle metin boyunca "taahhüt eder / hedefler / yol haritasında" ifadeleri kullanılmış; "denetlenmiştir / düzenli olarak denetlenir / bağımsız denetimden geçmiştir" ifadelerinden <strong>bilinçle kaçınılmıştır</strong>.</p>

<h4>4. Mevcut / Uygulanan Mali Kontroller</h4>
<p>hangel, ölçeğiyle orantılı, gerçekçi aşağıdaki kontrollere dayanır:</p>
<ul>
  <li>Bağış ve fon akışlarına ilişkin iç kayıt tutma.</li>
  <li>Ödeme/aktarım işlemlerinin lisanslı ödeme kuruluşları üzerinden yürütülmesi.</li>
  <li>Temel şeffaflık raporlaması ve kamuoyu bilgilendirmesi yaklaşımı.</li>
  <li>MASAK mevzuatı (5549 sayılı Kanun) kapsamındaki temel yükümlülüklere uyum hedefi.</li>
</ul>

<h4>5. Gelişim Yol Haritası ve Hedefler</h4>
<p>Aşağıdaki tablo, mali denetim ve raporlama bakımından hangel'in mevcut durumunu ve hedefini karşılaştırır.</p>
<table class="w-full border-collapse border border-gray-200 my-4">
  <thead>
    <tr>
      <th class="border border-gray-200 p-2 text-left text-sm" scope="col">Alan</th>
      <th class="border border-gray-200 p-2 text-left text-sm" scope="col">Mevcut Durum</th>
      <th class="border border-gray-200 p-2 text-left text-sm" scope="col">Hedef</th>
    </tr>
  </thead>
  <tbody>
    <tr><td class="border border-gray-200 p-2 text-sm">Bağımsız mali denetim</td><td class="border border-gray-200 p-2 text-sm">Yapılmadı; rapor yok</td><td class="border border-gray-200 p-2 text-sm">Ölçek/yükümlülük gerektirdiğinde KGK/ISA çerçevesinde bağımsız denetim</td></tr>
    <tr><td class="border border-gray-200 p-2 text-sm">Finansal raporlama çerçevesi</td><td class="border border-gray-200 p-2 text-sm">Temel iç kayıt</td><td class="border border-gray-200 p-2 text-sm">IFRS/US GAAP uyumlu finansal tablolar</td></tr>
    <tr><td class="border border-gray-200 p-2 text-sm">Bağış şeffaflık raporu</td><td class="border border-gray-200 p-2 text-sm">Temel bilgilendirme</td><td class="border border-gray-200 p-2 text-sm">Periyodik, ayrıntılı ve doğrulanabilir şeffaflık raporu</td></tr>
    <tr><td class="border border-gray-200 p-2 text-sm">İç kontrol sistemi</td><td class="border border-gray-200 p-2 text-sm">Temel kontroller</td><td class="border border-gray-200 p-2 text-sm">Belgelenmiş iç kontrol ve görevler ayrılığı</td></tr>
    <tr><td class="border border-gray-200 p-2 text-sm">AML/CFT uyumu</td><td class="border border-gray-200 p-2 text-sm">Temel MASAK uyum hedefi</td><td class="border border-gray-200 p-2 text-sm">FATF tavsiyeleriyle uyumlu kaynak doğrulama ve izleme</td></tr>
    <tr><td class="border border-gray-200 p-2 text-sm">Bağımsız denetçi atanması</td><td class="border border-gray-200 p-2 text-sm">Atanmadı</td><td class="border border-gray-200 p-2 text-sm">Yükümlülük doğduğunda KGK yetkili bağımsız denetçi ile çalışma</td></tr>
  </tbody>
</table>

<h4>6. AML / CFT ve Kaynak Doğrulama</h4>
<p>hangel, bağış kaynaklarının hukuka uygunluğunu gözetmeyi ve <strong>5549 sayılı Suç Gelirlerinin Aklanmasının Önlenmesi Hakkında Kanun (MASAK)</strong> ile <strong>6415 sayılı Terörizmin Finansmanının Önlenmesi Hakkında Kanun</strong> kapsamındaki yükümlülüklere uyumu hedefler. Şüpheli işlemlere ilişkin değerlendirme ve bildirim yaklaşımı, FATF tavsiyeleri ışığında geliştirilmeyi amaçlar.</p>

<h4>7. Bağışçı Hakları ve Hesap Verebilirlik</h4>
<p>hangel, bağışçıların fonlarının nasıl kullanıldığını anlama hakkını gözetir. <strong>Donor Bill of Rights (AFP)</strong> gibi uluslararası iyi uygulama ilkelerini referans alarak; bağışçıların hangi amaç için bağış yaptıkları konusunda doğru bilgilendirilmesini, fonların beyan edilen amaca tahsis edilmesini ve makul ölçüde geri bildirim alabilmelerini hedefler. Bağışçılar, bağışlarının akışına ilişkin sorularını hangel'e iletebilir. hangel, bu ilkeleri henüz bağımsız biçimde denetlenmemiş olsa da, gönüllü bir hesap verebilirlik taahhüdü olarak benimser.</p>

<h4>8. Anonim Şirket Denetim Eşikleri Bağlamı</h4>
<p>Türk hukukunda anonim şirketler bakımından bağımsız denetim yükümlülüğü, ilgili Cumhurbaşkanı kararıyla belirlenen ölçü eşiklerinin (aktif toplamı, yıllık net satış hasılatı ve çalışan sayısı) aşılmasına bağlıdır. hangel, bu eşikleri aştığında veya başka bir hukuki gereklilik doğduğunda <strong>6102 sayılı Türk Ticaret Kanunu</strong> ve KGK mevzuatı çerçevesinde bağımsız denetime tabi olmayı ve bu yükümlülüğü zamanında yerine getirmeyi taahhüt eder. Bugün itibarıyla böyle bir denetim gerçekleştirilmiş <strong>değildir</strong>.</p>

<h4>9. Şeffaflık ve Kamuoyu Bilgilendirmesi</h4>
<p>hangel, bağışçıların ve kamuoyunun fon akışlarını anlayabilmesi için şeffaflık raporlamasını sürdürmeyi ve geliştirmeyi taahhüt eder. Bağımsız denetim gerçekleştiğinde, sonuçlar uygun biçimde paylaşılacaktır. Mali şeffaflık soruları <a href="mailto:privacy@hangel.org" rel="noopener" target="_blank">privacy@hangel.org</a> üzerinden iletilebilir.</p>

<h4>10. Taahhüt ve Şeffaflık</h4>
<p>hangel, ölçeği büyüdükçe ve hukuki yükümlülük doğdukça bağımsız mali denetimi gerçekleştirmeyi ve IFRS/GAAP uyumlu raporlamaya geçmeyi taahhüt eder. Denetlenmemiş bir durumu denetlenmiş gibi sunmaktan kesinlikle kaçınır; bu beyan, ancak gerçek ve yayımlanmış bir denetim sonucuyla güncellenecektir.</p>

<h4>11. Değişiklik ve Yürürlük</h4>
<p>Bu beyan; mevzuat, ölçek değişiklikleri ve yol haritasındaki ilerlemeler doğrultusunda gözden geçirilir. Güncel sürüm, platformda yayımlandığı tarihte yürürlüğe girer.</p>

<p class="text-xs text-muted-foreground"><em>Bu metin bilgilendirme amaçlıdır ve bağlayıcı nihai hukuki görüş niteliği taşımaz; yürürlük öncesi yetkili hukuk danışmanlığı önerilir.</em></p>
    `
  },

  // --- I. Sistematik Test ve Uygulama ---
  {
    slug: 'sizma-ve-guvenlik-testleri-beyani',
    title: 'Sızma Testleri ve Güvenlik Testleri Beyanı',
    content: `
      <h3>Sızma Testleri ve Güvenlik Testleri Beyanı</h3>

<p>İşbu Sızma Testleri ve Güvenlik Testleri Beyanı, hangel platformunu işleten <strong>hangel AŞ</strong> tarafından, platformun güvenlik test yaklaşımını, başvurulan referans standartları ve bu alandaki gelişim yol haritasını şeffaf biçimde ortaya koymak amacıyla hazırlanmıştır. Bu metnin esas dili Türkçedir; başvurulan uluslararası çerçevelere atıflar İngilizce ifadeler içerebilir. Önemli bir dürüstlük notu olarak: hangel, bu beyanın yayımı itibarıyla <strong>bağımsız ve tam kapsamlı bir sızma testini henüz tamamlamamıştır</strong> ve herhangi bir güvenlik testi sertifikasına sahip değildir. Aşağıda yer alan hususlar, mevcut gerçekçi uygulamalar ile bu alandaki <strong>taahhüt ve hedeflerimizi</strong> birbirinden ayırarak açıklanır.</p>

<h4>1. Amaç</h4>
<p>Bu beyanın amacı; hangel'in sunduğu acil kan talebi/eşleştirme, bağış aktarımı, gönüllülük ilanları ve kuruluş profilleri gibi hizmetleri destekleyen sistemlerin güvenliğine ilişkin test ve değerlendirme yaklaşımını dürüstçe açıklamaktır. Beyan, kullanıcıların ve paydaşların hangel'in güvenlik olgunluğunu doğru biçimde değerlendirebilmesi için, neyin hâlihazırda uygulandığı ile neyin planlandığını açıkça ayırt eder. Beyan, herhangi bir güvenlik garantisi veya akreditasyon iddiası içermez.</p>

<h4>2. Kapsam</h4>
<p>Beyan; hangel mobil ve web uygulamaları, uygulama programlama arayüzleri (API), kimlik doğrulama ve yetkilendirme katmanları ile verilerin işlendiği bulut altyapısını (Google Cloud / Firebase — Firestore, Authentication, Storage) kapsayacak biçimde tasarlanan güvenlik test faaliyetlerini ele alır. Özellikle <strong>özel nitelikli sağlık verisi (kan grubu)</strong> ve finansal veriler (IBAN/ödeme) içeren akışlar, test kapsamı belirlenirken en yüksek öncelik olarak değerlendirilmesi hedeflenen alanlardır.</p>

<h4>3. Referans Standartlar — Sertifika ve Akreditasyon Durumu</h4>
<p>hangel, güvenlik test yaklaşımında aşağıdaki uluslararası standartları ve metodolojileri <strong>referans çerçeve</strong> olarak benimser. Bu standartların referans alınması, hangel'in bunlarda sertifikalı, akredite veya bağımsızca denetlenmiş olduğu anlamına gelmez:</p>
<ul>
  <li><strong>OWASP Top 10</strong> — web uygulamalarındaki en kritik güvenlik risklerinin (örn. enjeksiyon, bozuk erişim kontrolü, kimlik doğrulama zafiyetleri) ele alınmasına yönelik öncelikli risk listesi;</li>
  <li><strong>OWASP ASVS (Application Security Verification Standard)</strong> — uygulama güvenliği doğrulaması için katmanlı (Level 1–3) gereksinim seti;</li>
  <li><strong>PTES (Penetration Testing Execution Standard)</strong> — sızma testi süreçlerinin (ön etkileşim, istihbarat toplama, tehdit modelleme, zafiyet analizi, sömürü, son işlemler ve raporlama) yapılandırılmasına ilişkin metodoloji;</li>
  <li><strong>NIST SP 800-115</strong> — "Technical Guide to Information Security Testing and Assessment"; teknik güvenlik testi ve değerlendirmesinin planlama, bilgi toplama, zafiyet analizi, sömürü ve test sonrası faaliyetler aşamalarına ilişkin rehber.</li>
</ul>
<blockquote>
<p><strong>Açık beyan:</strong> hangel, bu beyanın yayımı itibarıyla bağımsız bir üçüncü taraf tarafından yürütülen tam kapsamlı bir sızma testini tamamlamamış olup, OWASP ASVS veya benzeri bir çerçeveye dayalı resmî bir doğrulama belgesine sahip değildir. Yukarıdaki standartlar yalnızca benimsenen referans çerçevelerdir.</p>
</blockquote>

<h4>4. Mevcut/Uygulanan Kontroller</h4>
<p>Aşağıdaki kontroller, hangel'in mevcut güvenlik yaklaşımının gerçekçi unsurları olarak benimsenmiştir; bunlar bir sızma testi raporunun yerine geçmez:</p>
<ul>
  <li>Aktarımda ve dinlenmede şifreleme (TLS ve bulut sağlayıcı düzeyinde şifreleme) ilkesi;</li>
  <li>Kimlik doğrulama ve rol/erişim temelli yetkilendirme; en az yetki ilkesinin gözetilmesi;</li>
  <li>Bulut sağlayıcısının (Google Cloud / Firebase) sağladığı altyapı güvenlik kontrollerinden ve güvenlik kurallarından (security rules) yararlanılması;</li>
  <li>Bağımlılık ve kütüphane güncellemelerinin takibi yönünde makul çaba;</li>
  <li>Erişim kayıtlarının ve anormal etkinliklerin izlenmesine yönelik temel önlemler.</li>
</ul>

<h4>5. Gelişim Yol Haritası ve Hedefler</h4>
<p>hangel, güvenlik test olgunluğunu artırmak için aşağıdaki yol haritasını <strong>taahhüt eder ve hedefler</strong>. Aşağıdaki "Mevcut Durum vs. Hedef" tablosu, bu alandaki gerçek konumu ile ulaşılmak istenen noktayı şeffaf biçimde karşılaştırır.</p>
<table class="w-full border-collapse border border-gray-200 my-4">
  <thead>
    <tr>
      <th class="border border-gray-200 p-2 text-left text-sm" scope="col">Alan</th>
      <th class="border border-gray-200 p-2 text-left text-sm" scope="col">Mevcut Durum</th>
      <th class="border border-gray-200 p-2 text-left text-sm" scope="col">Hedef</th>
    </tr>
  </thead>
  <tbody>
    <tr><td class="border border-gray-200 p-2 text-sm">Bağımsız sızma testi</td><td class="border border-gray-200 p-2 text-sm">Henüz bağımsız tam kapsamlı test yaptırılmadı</td><td class="border border-gray-200 p-2 text-sm">Bağımsız bir güvenlik firmasına PTES/NIST SP 800-115 esaslı sızma testi yaptırmayı taahhüt eder</td></tr>
    <tr><td class="border border-gray-200 p-2 text-sm">ASVS doğrulaması</td><td class="border border-gray-200 p-2 text-sm">Resmî ASVS doğrulaması bulunmuyor</td><td class="border border-gray-200 p-2 text-sm">OWASP ASVS Level 1 uyumunu hedefler, kademeli olarak Level 2'yi amaçlar</td></tr>
    <tr><td class="border border-gray-200 p-2 text-sm">Zafiyet taraması</td><td class="border border-gray-200 p-2 text-sm">Temel/ad hoc tarama yaklaşımı</td><td class="border border-gray-200 p-2 text-sm">Sürekli ve otomatik zafiyet taramasının kurulmasını planlar</td></tr>
    <tr><td class="border border-gray-200 p-2 text-sm">Zafiyet bildirimi</td><td class="border border-gray-200 p-2 text-sm">Resmî program yok</td><td class="border border-gray-200 p-2 text-sm">Sorumlu açıklama / zafiyet bildirim kanalı oluşturmayı hedefler</td></tr>
    <tr><td class="border border-gray-200 p-2 text-sm">Düzeltme döngüsü</td><td class="border border-gray-200 p-2 text-sm">Bulgular vaka bazlı ele alınıyor</td><td class="border border-gray-200 p-2 text-sm">Önem derecesine göre belgelenmiş düzeltme süreleri (SLA) tanımlamayı amaçlar</td></tr>
  </tbody>
</table>

<h4>6. Hedeflenen Test Türleri</h4>
<p>hangel, güvenlik test programını olgunlaştırırken aşağıdaki test türlerini kademeli olarak kapsama almayı hedefler. Bu türlerin hiçbiri bu beyanın yayımı itibarıyla tam kapsamlı ve bağımsız biçimde tamamlanmış değildir:</p>
<ul>
  <li><strong>Kara kutu (black-box) testi:</strong> sistem hakkında önceden bilgi verilmeden, dış saldırgan bakış açısıyla yürütülmesi hedeflenen test;</li>
  <li><strong>Gri kutu (gray-box) testi:</strong> sınırlı erişim ve bilgiyle, kimliği doğrulanmış kullanıcı senaryolarını da kapsayacak biçimde yürütülmesi planlanan test;</li>
  <li><strong>API güvenlik testi:</strong> uygulama programlama arayüzlerinde yetkilendirme, oran sınırlama ve veri sızıntısı zafiyetlerinin değerlendirilmesi;</li>
  <li><strong>Yapılandırma ve bulut güvenliği gözden geçirmesi:</strong> Firebase güvenlik kurallarının ve bulut erişim politikalarının incelenmesi.</li>
</ul>
<p>hangel, bağımsız sızma testi tamamlandıktan sonra, önemli sürüm değişikliklerinde ve makul periyotlarla testin tekrarlanmasını taahhüt eder; bu, halihazırda işleyen bir tekrar döngüsünün varlığını ifade etmez, hedeflenen bir uygulamadır.</p>

<h4>7. Bulguların Sınıflandırılması ve Düzeltme</h4>
<p>hangel, ileride elde edilecek test bulgularını önem derecesine (kritik, yüksek, orta, düşük) göre sınıflandırmayı ve her sınıf için belgelenmiş düzeltme hedef süreleri tanımlamayı amaçlar. Kritik ve yüksek önem dereceli bulguların öncelikle ele alınması, özellikle özel nitelikli sağlık verisi ve finansal verileri etkileyen zafiyetlerin ivedilikle giderilmesi hedeflenir. Düzeltme sonrası, bulgunun giderildiğinin doğrulanması (retest) süreci planlanır.</p>

<h4>8. Sorumlu Açıklama ve Bildirim</h4>
<p>hangel, güvenlik araştırmacılarının ve kullanıcıların tespit ettiği olası güvenlik zafiyetlerini iyi niyetle bildirebileceği bir kanal oluşturmayı hedefler. Bu beyanın yayımı itibarıyla, olası güvenlik bulguları <a href="mailto:privacy@hangel.org" rel="noopener" target="_blank">privacy@hangel.org</a> ve Türkiye'deki veri konuları bakımından <a href="mailto:kvkk@hangel.org" rel="noopener" target="_blank">kvkk@hangel.org</a> adreslerine iletilebilir. hangel, iyi niyetli bildirimleri değerlendirmeyi ve makul sürede yanıt vermeyi taahhüt eder.</p>

<h4>9. Veri Koruma ile İlişki</h4>
<p>Güvenlik testleri, kişisel verilerin korunmasına ilişkin teknik ve idari tedbirlerin bir parçasıdır. Türkiye bakımından <strong>6698 sayılı KVKK m.12</strong> (veri güvenliğine ilişkin yükümlülükler) ve AB bakımından <strong>GDPR Art.32</strong> (işlemenin güvenliği), risk düzeyine uygun güvenlik tedbirlerinin alınmasını ve düzenli olarak gözden geçirilmesini öngörür. hangel, güvenlik test yol haritasını bu yükümlülükleri destekleyecek biçimde geliştirmeyi taahhüt eder; ancak bu beyan, söz konusu yükümlülüklerin hâlihazırda eksiksiz karşılandığı yönünde bir iddia içermez.</p>

<h4>10. Şeffaflık Taahhüdü</h4>
<p>hangel, güvenlik test olgunluğundaki gelişmeleri kullanıcılarına dürüstçe aktarmayı; tamamlanmamış testleri tamamlanmış gibi sunmamayı ve sahip olmadığı sertifikaları iddia etmemeyi ilke olarak benimser. Bağımsız bir sızma testi tamamlandığında veya bir doğrulama elde edildiğinde, bu beyan buna göre güncellenecektir.</p>

<h4>11. Değişiklik ve Yürürlük</h4>
<p>Bu beyan, güvenlik test faaliyetlerinin ilerlemesi, mevzuat değişiklikleri ve hizmet gelişmeleri doğrultusunda güncellenebilir. Güncel sürüm, platformda yayımlandığı tarihte yürürlüğe girer.</p>

<p class="text-xs text-muted-foreground"><em>Bu metin bilgilendirme amaçlıdır ve bağlayıcı nihai hukuki görüş niteliği taşımaz; yürürlük öncesi yetkili hukuk danışmanlığı önerilir.</em></p>
    `
  },
  {
    slug: 'ux-ve-kullanici-deneyimi-testleri-beyani',
    title: 'UX ve Kullanıcı Deneyimi Testleri Beyanı',
    content: `
      <h3>UX ve Kullanıcı Deneyimi Testleri Beyanı</h3>

<p>İşbu UX ve Kullanıcı Deneyimi Testleri Beyanı, hangel platformunu işleten <strong>hangel AŞ</strong> tarafından, platformun kullanılabilirlik ve kullanıcı deneyimi test yaklaşımını, başvurulan referans standartları ve bu alandaki gelişim yol haritasını şeffaf biçimde ortaya koymak amacıyla hazırlanmıştır. Bu metnin esas dili Türkçedir; başvurulan uluslararası çerçevelere atıflar İngilizce ifadeler içerebilir. Dürüstlük gereği açıkça belirtilir ki: hangel, bu beyanın yayımı itibarıyla <strong>sistematik ve düzenli kullanılabilirlik testlerini henüz kurumsallaştırmamıştır</strong> ve herhangi bir kullanıcı deneyimi sertifikasına sahip değildir. Aşağıda mevcut gerçekçi uygulamalar ile <strong>taahhüt ve hedefler</strong> birbirinden ayrılarak açıklanır.</p>

<h4>1. Amaç</h4>
<p>Bu beyanın amacı; hangel'in acil kan talebi/eşleştirme, bağış, gönüllülük ve kuruluş profilleri gibi yaşamsal ve toplumsal öneme sahip hizmetlerinin, kullanıcılar için anlaşılır, erişilebilir ve verimli olmasını sağlamaya yönelik test yaklaşımını dürüstçe açıklamaktır. Acil bir kan talebinde dakikaların önem taşıdığı bir bağlamda, kullanıcı deneyiminin sade ve hatasız olması, hangel için yalnızca konfor değil, aynı zamanda toplumsal etki ve güvenlik meselesidir.</p>

<h4>2. Kapsam</h4>
<p>Beyan; hangel mobil ve web uygulamalarının kayıt/oturum açma, kan talebi oluşturma ve yanıtlama, bağış akışı, gönüllülük başvurusu ve kuruluş profili yönetimi gibi temel kullanıcı yolculuklarını kapsayacak biçimde tasarlanan kullanılabilirlik ve kullanıcı deneyimi test faaliyetlerini ele alır. Erişilebilirlik bileşeni, ayrıca yürütülen erişilebilirlik politikası ile birlikte değerlendirilir.</p>

<h4>3. Referans Standartlar — Sertifika Durumu</h4>
<p>hangel, kullanıcı deneyimi yaklaşımında aşağıdaki çerçeveleri <strong>referans</strong> olarak benimser. Bu referanslar, hangel'in bu alanda sertifikalı veya bağımsızca denetlenmiş olduğu anlamına gelmez:</p>
<ul>
  <li><strong>ISO 9241-210:2019</strong> — "Ergonomics of human-system interaction — Part 210: Human-centred design for interactive systems"; insan odaklı tasarım ilkeleri (kullanıcıların açık biçimde anlaşılması, kullanıcıların tasarım sürecine katılımı, kullanıcı merkezli değerlendirme ve yinelemeli/iteratif tasarım) çerçevesi;</li>
  <li><strong>Nielsen Norman Group sezgisel değerlendirme (heuristic evaluation)</strong> — Jakob Nielsen'in 10 kullanılabilirlik ilkesine dayalı uzman değerlendirme yöntemi (örn. sistem durumunun görünürlüğü, kullanıcı denetimi ve özgürlüğü, hata önleme, tutarlılık ve standartlar).</li>
</ul>
<blockquote>
<p><strong>Açık beyan:</strong> hangel, bu beyanın yayımı itibarıyla bağımsız bir uzman tarafından yürütülen sistematik bir sezgisel değerlendirmeyi veya engelli gruplarla yapılan yapılandırılmış kullanıcı testlerini henüz tamamlamamıştır. Yukarıdaki standartlar yalnızca benimsenen referans çerçevelerdir.</p>
</blockquote>

<h4>4. Mevcut/Uygulanan Yaklaşımlar</h4>
<p>Aşağıdaki yaklaşımlar, hangel'in mevcut kullanıcı deneyimi pratiğinin gerçekçi unsurları olarak benimsenmiştir:</p>
<ul>
  <li>Temel kullanıcı yolculuklarının sade ve adım sayısı azaltılmış biçimde tasarlanması yönünde çaba;</li>
  <li>Kullanıcı geri bildirimlerinin (destek talepleri, mağaza yorumları, doğrudan iletişim) gözden geçirilmesi;</li>
  <li>Tasarımda tutarlılık ve anlaşılır dil kullanımına özen;</li>
  <li>Acil kan talebi gibi kritik akışlarda hata önleyici onay ve bilgilendirme adımları.</li>
</ul>

<h4>5. Gelişim Yol Haritası ve Hedefler</h4>
<p>hangel, kullanılabilirlik test olgunluğunu artırmak için aşağıdaki yol haritasını <strong>taahhüt eder ve hedefler</strong>. Aşağıdaki "Mevcut Durum vs. Hedef" tablosu, gerçek konum ile ulaşılmak istenen noktayı şeffaf biçimde karşılaştırır.</p>
<table class="w-full border-collapse border border-gray-200 my-4">
  <thead>
    <tr>
      <th class="border border-gray-200 p-2 text-left text-sm" scope="col">Alan</th>
      <th class="border border-gray-200 p-2 text-left text-sm" scope="col">Mevcut Durum</th>
      <th class="border border-gray-200 p-2 text-left text-sm" scope="col">Hedef</th>
    </tr>
  </thead>
  <tbody>
    <tr><td class="border border-gray-200 p-2 text-sm">Sezgisel değerlendirme</td><td class="border border-gray-200 p-2 text-sm">Sistematik uzman değerlendirmesi yapılmadı</td><td class="border border-gray-200 p-2 text-sm">Nielsen 10 ilkesine dayalı düzenli sezgisel değerlendirmeyi taahhüt eder</td></tr>
    <tr><td class="border border-gray-200 p-2 text-sm">Kullanıcı testi</td><td class="border border-gray-200 p-2 text-sm">Yapılandırılmış test henüz kurumsallaşmadı</td><td class="border border-gray-200 p-2 text-sm">Gerçek kullanıcılarla görev tabanlı kullanılabilirlik testleri yürütmeyi hedefler</td></tr>
    <tr><td class="border border-gray-200 p-2 text-sm">Engelli gruplarla test</td><td class="border border-gray-200 p-2 text-sm">Henüz yürütülmedi</td><td class="border border-gray-200 p-2 text-sm">Görme, işitme ve motor engelli kullanıcılarla test yapmayı taahhüt eder</td></tr>
    <tr><td class="border border-gray-200 p-2 text-sm">İnsan odaklı süreç</td><td class="border border-gray-200 p-2 text-sm">Tasarımda makul özen</td><td class="border border-gray-200 p-2 text-sm">ISO 9241-210 esaslı yinelemeli, kullanıcı katılımlı süreci benimsemeyi amaçlar</td></tr>
    <tr><td class="border border-gray-200 p-2 text-sm">Metrik takibi</td><td class="border border-gray-200 p-2 text-sm">Geri bildirim temelli</td><td class="border border-gray-200 p-2 text-sm">Görev tamamlama oranı, hata oranı ve memnuniyet ölçümlerini izlemeyi planlar</td></tr>
  </tbody>
</table>

<h4>6. Hedeflenen Test Yöntemleri</h4>
<p>hangel, kullanılabilirlik test programını olgunlaştırırken aşağıdaki yöntemleri kademeli olarak benimsemeyi hedefler. Bu yöntemlerin hiçbiri bu beyanın yayımı itibarıyla düzenli ve sistematik biçimde yürütülmemektedir:</p>
<ul>
  <li><strong>Sezgisel değerlendirme (heuristic evaluation):</strong> uzmanların Nielsen ilkeleri ışığında arayüzü değerlendirmesi;</li>
  <li><strong>Görev tabanlı kullanıcı testi:</strong> gerçek kullanıcıların belirli görevleri (örn. kan talebi oluşturma, bağış yapma) tamamlarken gözlemlenmesi;</li>
  <li><strong>Moderasyonlu ve moderasyonsuz testler:</strong> hem rehberli oturumlar hem de uzaktan, kendi başına yürütülen testler;</li>
  <li><strong>A/B testi ve geri bildirim anketleri:</strong> tasarım seçeneklerinin karşılaştırılması ve memnuniyetin ölçülmesi;</li>
  <li><strong>Erişilebilirlik odaklı testler:</strong> ekran okuyucu, klavye gezinimi ve renk kontrastı senaryolarının değerlendirilmesi.</li>
</ul>

<h4>7. Hedeflenen Başarı Ölçütleri</h4>
<p>hangel, kullanıcı deneyimi olgunluğunu nesnel biçimde izleyebilmek için ileride aşağıdaki ölçütleri tanımlamayı ve takip etmeyi amaçlar: görev tamamlama oranı, göreve harcanan süre, hata oranı, terk (drop-off) noktaları ve kullanıcı memnuniyeti puanı. Özellikle acil kan talebi akışında, görevin ilk denemede ve düşük hata payıyla tamamlanması öncelikli hedef olarak benimsenir. Bu ölçütler henüz sistematik olarak izlenmemekte olup, kurulması planlanan bir uygulamadır.</p>

<h4>8. Erişilebilirlik ile İlişki</h4>
<p>Kullanıcı deneyimi testleri, erişilebilirlikten ayrı düşünülemez. hangel, kullanılabilirlik test programını <strong>WCAG 2.2 AA</strong> ve <strong>EN 301 549</strong> hedefleriyle ve ilgili erişilebilirlik politikasıyla bütünleşik biçimde geliştirmeyi taahhüt eder. Özellikle engelli kullanıcılarla yürütülecek testlerin, yalnızca teknik uyumu değil, gerçek kullanım deneyimini de ölçmesi hedeflenir.</p>

<h4>9. Geri Bildirim Kanalı</h4>
<p>Kullanıcılar, kullanıcı deneyimine ilişkin görüş, sorun ve önerilerini hangel'e iletebilir. hangel, bu geri bildirimleri kullanılabilirlik iyileştirme sürecinin değerli bir girdisi olarak değerlendirmeyi taahhüt eder. Geri bildirimler platform içi destek kanalları ve <a href="mailto:privacy@hangel.org" rel="noopener" target="_blank">privacy@hangel.org</a> üzerinden iletilebilir.</p>

<h4>10. Şeffaflık Taahhüdü</h4>
<p>hangel, kullanıcı deneyimi test olgunluğundaki gelişmeleri dürüstçe paylaşmayı; henüz yürütülmemiş testleri yapılmış gibi sunmamayı ve sahip olmadığı bir kullanıcı deneyimi statüsünü iddia etmemeyi ilke olarak benimser. Düzenli bir test programı kurumsallaştığında, bu beyan buna göre güncellenecektir.</p>

<h4>11. Değişiklik ve Yürürlük</h4>
<p>Bu beyan, kullanılabilirlik test faaliyetlerinin ilerlemesi ve hizmet gelişmeleri doğrultusunda güncellenebilir. Güncel sürüm, platformda yayımlandığı tarihte yürürlüğe girer.</p>

<p class="text-xs text-muted-foreground"><em>Bu metin bilgilendirme amaçlıdır ve bağlayıcı nihai hukuki görüş niteliği taşımaz; yürürlük öncesi yetkili hukuk danışmanlığı önerilir.</em></p>
    `
  },
  {
    slug: 'felaket-kurtarma-ve-yedekleme-testleri-beyani',
    title: 'Felaket Kurtarma ve Yedekleme Testleri Beyanı',
    content: `
      <h3>Felaket Kurtarma ve Yedekleme Testleri Beyanı</h3>

<p>İşbu Felaket Kurtarma ve Yedekleme Testleri Beyanı, hangel platformunu işleten <strong>hangel AŞ</strong> tarafından, platformun veri yedekleme ve felaket kurtarma yaklaşımını, başvurulan referans standartları ve bu alandaki gelişim yol haritasını şeffaf biçimde ortaya koymak amacıyla hazırlanmıştır. Bu metnin esas dili Türkçedir; başvurulan uluslararası çerçevelere atıflar İngilizce ifadeler içerebilir. Dürüstlük gereği açıkça belirtilir ki: hangel'de yedekleme mekanizmaları mevcut olmakla birlikte, hangel <strong>düzenli ve belgelenmiş felaket kurtarma tatbikatlarını henüz kurumsallaştırmamıştır</strong> ve ISO 22301 gibi bir iş sürekliliği yönetimi sertifikasına sahip değildir. Aşağıda mevcut gerçekçi uygulamalar ile <strong>taahhüt ve hedefler</strong> birbirinden ayrılarak açıklanır.</p>

<h4>1. Amaç</h4>
<p>Bu beyanın amacı; hangel'in acil kan talebi/eşleştirme, bağış ve gönüllülük gibi yaşamsal hizmetlerini destekleyen verilerin bir kesinti, veri kaybı veya felaket senaryosunda korunması ve hizmetin yeniden ayağa kaldırılmasına yönelik yaklaşımını dürüstçe açıklamaktır. Acil kan ihtiyacının söz konusu olduğu bir platformda hizmet sürekliliği, doğrudan toplumsal etki ile ilişkilidir.</p>

<h4>2. Kapsam</h4>
<p>Beyan; hangel'in kullanıcı verilerini, kuruluş kayıtlarını, bağış ve etki verilerini barındıran bulut altyapısının (Google Cloud / Firebase — Firestore, Authentication, Storage) yedeklenmesi, geri yükleme yeteneği ve felaket kurtarma planlamasını kapsar. Özel nitelikli sağlık verisi (kan grubu) ve finansal veriler içeren akışlar, kurtarma önceliklendirmesinde en yüksek öncelik olarak değerlendirilmesi hedeflenen alanlardır.</p>

<h4>3. Referans Standartlar — Sertifika Durumu</h4>
<p>hangel, felaket kurtarma ve yedekleme yaklaşımında aşağıdaki çerçeveleri <strong>referans</strong> olarak benimser. Bu referanslar, hangel'in bunlarda sertifikalı veya bağımsızca denetlenmiş olduğu anlamına gelmez:</p>
<ul>
  <li><strong>ISO 22301:2019</strong> — "Security and resilience — Business continuity management systems — Requirements"; iş sürekliliği yönetim sistemi gereksinimleri ve kurtarma planlaması çerçevesi;</li>
  <li><strong>NIST SP 800-34 Rev. 1</strong> — "Contingency Planning Guide for Federal Information Systems"; iş etki analizi (BIA), kurtarma stratejisi, plan testi ve bakım dahil acil durum planlaması yaşam döngüsü rehberi;</li>
  <li><strong>3-2-1 yedekleme kuralı</strong> — verinin en az üç kopyasının, iki farklı ortamda ve en az bir kopyasının saha dışında (off-site) tutulmasını öngören yaygın iyi uygulama ilkesi.</li>
</ul>
<blockquote>
<p><strong>Açık beyan:</strong> hangel, bu beyanın yayımı itibarıyla ISO 22301 kapsamında belgelendirilmiş bir iş sürekliliği yönetim sistemine sahip değildir ve düzenli, bağımsızca doğrulanmış felaket kurtarma tatbikatlarını henüz tamamlamamıştır. Yukarıdaki standartlar yalnızca benimsenen referans çerçevelerdir.</p>
</blockquote>

<h4>4. Mevcut/Uygulanan Kontroller</h4>
<p>Aşağıdaki kontroller, hangel'in mevcut yaklaşımının gerçekçi unsurları olarak benimsenmiştir:</p>
<ul>
  <li>Bulut sağlayıcısının (Google Cloud / Firebase) sağladığı altyapı düzeyindeki dayanıklılık ve yedeklilik özelliklerinden yararlanılması;</li>
  <li>Kritik veri kümeleri için yedekleme alınması yönünde uygulama;</li>
  <li>Erişim ve değişiklik kayıtlarının izlenmesine yönelik temel önlemler;</li>
  <li>Verinin şifreli biçimde saklanması ilkesi.</li>
</ul>
<p>Bu kontroller mevcut olmakla birlikte, tek başına belgelenmiş ve test edilmiş bir felaket kurtarma kabiliyeti anlamına gelmez.</p>

<h4>5. Gelişim Yol Haritası ve Hedefler</h4>
<p>hangel, felaket kurtarma ve yedekleme olgunluğunu artırmak için aşağıdaki yol haritasını <strong>taahhüt eder ve hedefler</strong>. Aşağıdaki "Mevcut Durum vs. Hedef" tablosu, gerçek konum ile ulaşılmak istenen noktayı şeffaf biçimde karşılaştırır.</p>
<table class="w-full border-collapse border border-gray-200 my-4">
  <thead>
    <tr>
      <th class="border border-gray-200 p-2 text-left text-sm" scope="col">Alan</th>
      <th class="border border-gray-200 p-2 text-left text-sm" scope="col">Mevcut Durum</th>
      <th class="border border-gray-200 p-2 text-left text-sm" scope="col">Hedef</th>
    </tr>
  </thead>
  <tbody>
    <tr><td class="border border-gray-200 p-2 text-sm">Yedekleme</td><td class="border border-gray-200 p-2 text-sm">Kritik veriler için yedekleme alınıyor</td><td class="border border-gray-200 p-2 text-sm">3-2-1 kuralına tam uyumu ve düzenli yedek bütünlüğü doğrulamasını hedefler</td></tr>
    <tr><td class="border border-gray-200 p-2 text-sm">Geri yükleme testi</td><td class="border border-gray-200 p-2 text-sm">Sistematik geri yükleme testi yapılmadı</td><td class="border border-gray-200 p-2 text-sm">Yedekten geri yüklemenin düzenli olarak test edilmesini taahhüt eder</td></tr>
    <tr><td class="border border-gray-200 p-2 text-sm">Felaket kurtarma tatbikatı</td><td class="border border-gray-200 p-2 text-sm">Henüz tatbikat yürütülmedi</td><td class="border border-gray-200 p-2 text-sm">Belgelenmiş, düzenli felaket kurtarma tatbikatlarını taahhüt eder</td></tr>
    <tr><td class="border border-gray-200 p-2 text-sm">RTO / RPO hedefleri</td><td class="border border-gray-200 p-2 text-sm">Resmî olarak tanımlanmadı</td><td class="border border-gray-200 p-2 text-sm">Hizmet bazında Kurtarma Süresi (RTO) ve Kurtarma Noktası (RPO) hedefleri tanımlamayı amaçlar</td></tr>
    <tr><td class="border border-gray-200 p-2 text-sm">İş etki analizi (BIA)</td><td class="border border-gray-200 p-2 text-sm">Yapılandırılmış BIA yapılmadı</td><td class="border border-gray-200 p-2 text-sm">NIST SP 800-34 esaslı iş etki analizini gerçekleştirmeyi planlar</td></tr>
  </tbody>
</table>

<h4>6. Hedeflenen Tatbikat Türleri</h4>
<p>hangel, felaket kurtarma kabiliyetini doğrulamak için aşağıdaki tatbikat türlerini kademeli olarak benimsemeyi hedefler. Bu tatbikatların hiçbiri bu beyanın yayımı itibarıyla düzenli ve belgelenmiş biçimde yürütülmemektedir:</p>
<ul>
  <li><strong>Masa başı (tabletop) tatbikatı:</strong> ekibin bir felaket senaryosunu adım adım gözden geçirdiği teorik tatbikat;</li>
  <li><strong>Geri yükleme tatbikatı:</strong> yedeklerden verinin gerçekten geri yüklenebildiğinin ve bütünlüğünün doğrulanması;</li>
  <li><strong>Yük devretme (failover) tatbikatı:</strong> birincil sistemin devre dışı kaldığı senaryoda hizmetin alternatif kaynaklardan ayağa kaldırılmasının denenmesi;</li>
  <li><strong>Tam felaket simülasyonu:</strong> bütünleşik bir kesinti senaryosunun uçtan uca canlandırılması.</li>
</ul>
<p>hangel, bu tatbikatları belgelenmiş bir takvim çerçevesinde düzenli olarak yürütmeyi taahhüt eder; bu, halihazırda işleyen bir tatbikat döngüsünün varlığını ifade etmez, hedeflenen bir uygulamadır.</p>

<h4>7. Olay Müdahale ve İletişim</h4>
<p>hangel, bir kesinti veya veri kaybı olayında izlenecek müdahale adımlarını, sorumlulukları ve paydaşlara yönelik iletişim akışını tanımlayan bir olay müdahale planı oluşturmayı hedefler. Bir veri ihlali aynı zamanda kişisel veri güvenliğini etkiliyorsa, hangel'in veri ihlali bildirim prosedürü ve ilgili mevzuat (KVKK m.12/5 ve Kurul'un 2019/10 sayılı kararı kapsamındaki bildirim, GDPR Art.33-34) devreye girer. Bu plan, felaket kurtarma yol haritasının bir parçası olarak planlanmaktadır.</p>

<h4>8. Kurtarma Önceliklendirmesi</h4>
<p>hangel, bir felaket senaryosunda öncelikli olarak yaşamsal nitelikteki <strong>acil kan talebi/eşleştirme</strong> hizmetinin ve özel nitelikli sağlık verisi ile finansal verilerin bütünlüğünün korunmasını hedefler. Kurtarma önceliklendirmesinin, ileride yürütülecek iş etki analizine dayalı olarak resmîleştirilmesi planlanmaktadır.</p>

<h4>9. Veri Koruma ile İlişki</h4>
<p>Yedekleme ve felaket kurtarma, veri güvenliği tedbirlerinin ayrılmaz bir parçasıdır. Türkiye bakımından <strong>6698 sayılı KVKK m.12</strong> ve AB bakımından <strong>GDPR Art.32</strong>, verinin erişilebilirliğini ve dayanıklılığını da kapsayan uygun güvenlik tedbirlerini öngörür. hangel, felaket kurtarma yol haritasını bu yükümlülükleri destekleyecek biçimde geliştirmeyi taahhüt eder; ancak bu beyan, söz konusu yükümlülüklerin hâlihazırda eksiksiz karşılandığı yönünde bir iddia içermez. Yedeklerin saklandığı altyapı, hangel'in yurt dışı aktarım ve hosting beyanı ile birlikte değerlendirilir.</p>

<h4>10. Şeffaflık Taahhüdü</h4>
<p>hangel, felaket kurtarma olgunluğundaki gelişmeleri dürüstçe paylaşmayı; yürütülmemiş tatbikatları yapılmış gibi sunmamayı ve sahip olmadığı bir iş sürekliliği sertifikasını iddia etmemeyi ilke olarak benimser. Düzenli tatbikatlar kurumsallaştığında, bu beyan buna göre güncellenecektir.</p>

<h4>11. Değişiklik ve Yürürlük</h4>
<p>Bu beyan, felaket kurtarma ve yedekleme faaliyetlerinin ilerlemesi, mevzuat değişiklikleri ve hizmet gelişmeleri doğrultusunda güncellenebilir. Güncel sürüm, platformda yayımlandığı tarihte yürürlüğe girer.</p>

<p class="text-xs text-muted-foreground"><em>Bu metin bilgilendirme amaçlıdır ve bağlayıcı nihai hukuki görüş niteliği taşımaz; yürürlük öncesi yetkili hukuk danışmanlığı önerilir.</em></p>
    `
  },

  // --- J. Kurumsal Uyum / Risk Komitesi ---
  {
    slug: 'ucuncu-taraf-gozetim-ve-etik-performans-beyani',
    title: 'Üçüncü Taraf Gözetim ve Etik Performans Beyanı',
    content: `
      <h3>Üçüncü Taraf Gözetim ve Etik Performans Beyanı</h3>

<p>İşbu Üçüncü Taraf Gözetim ve Etik Performans Beyanı, hangel platformunu işleten <strong>hangel AŞ</strong> tarafından, hangel'in bağımsız üçüncü taraf gözetimine ve etik performans değerlendirmesine ilişkin yaklaşımını, başvurulan referans çerçeveleri ve bu alandaki gelişim yol haritasını şeffaf biçimde ortaya koymak amacıyla hazırlanmıştır. Bu metnin esas dili Türkçedir; başvurulan uluslararası çerçevelere atıflar İngilizce ifadeler içerebilir. Dürüstlük gereği açıkça belirtilir ki: hangel, bu beyanın yayımı itibarıyla <strong>bağımsız bir üçüncü taraf güvence (independent assurance) denetiminden geçmemiştir</strong> ve B-Corp gibi herhangi bir akreditasyon veya sertifikaya sahip değildir. Aşağıda mevcut gerçekçi yaklaşımlar ile <strong>taahhüt ve hedefler</strong> birbirinden ayrılarak açıklanır.</p>

<h4>1. Amaç ve İlkeler</h4>
<p>Bu beyanın amacı; hangel'in toplumsal etki iddialarının, etik uygulamalarının ve performansının yalnızca öz beyanla sınırlı kalmayıp, zaman içinde bağımsız bir gözle doğrulanmasına yönelik niyetini ve yol haritasını dürüstçe ortaya koymaktır. hangel; hesap verebilirlik, dürüstlük, şeffaflık ve paydaş güveni ilkelerini benimser ve etki iddialarını abartmaktan kaçınmayı taahhüt eder.</p>

<h4>2. Kapsam ve Paydaşlar</h4>
<p>Beyan; hangel'in bağışçılar, gönüllüler, kan talep eden ve bağışlayan kullanıcılar, platformdaki STK/dernek/vakıf kuruluşları, marka üyeleri, öğrenci kulüpleri ve kamuoyu nezdindeki etik performansını ve bu performansın üçüncü taraflarca gözetimini kapsar. Üçüncü taraf gözetimi; bağımsız güvence sağlayıcıları, denetçiler, etik çerçeve kuruluşları ve kamuoyu denetimini içerebilir.</p>

<h4>3. Referans Çerçeve — Sertifika ve Akreditasyon Durumu</h4>
<p>hangel, etik performans ve üçüncü taraf gözetim yaklaşımında aşağıdaki çerçeveleri <strong>referans</strong> olarak benimser. Bu referansların benimsenmesi, hangel'in bu çerçevelerde üye, sertifikalı veya akredite olduğu anlamına gelmez:</p>
<ul>
  <li><strong>UN Global Compact</strong> (Birleşmiş Milletler Küresel İlkeler Sözleşmesi) — insan hakları, çalışma standartları, çevre ve yolsuzlukla mücadele alanlarındaki on ilke; hangel bu ilkeleri rehber olarak benimser ancak bu beyanın yayımı itibarıyla resmî imzacı/katılımcı statüsüne ilişkin bir iddiada bulunmaz;</li>
  <li><strong>B-Corp</strong> (B Lab tarafından verilen sertifikasyon) — sosyal ve çevresel performans, hesap verebilirlik ve şeffaflık değerlendirmesi; hangel B-Corp sertifikalı <strong>değildir</strong>, bu çerçeveyi yalnızca bir hedef ufku olarak referans alır;</li>
  <li><strong>Bağımsız güvence (independent assurance)</strong> ilkeleri — ISAE 3000 türü güvence çerçeveleri (referans olarak; hangel bu standartlarda akredite bir denetçi tarafından henüz denetlenmemiştir);</li>
  <li><strong>BM Sürdürülebilir Kalkınma Amaçları (SDG)</strong> ile hizalama ve <strong>Social Value International (SROI)</strong> ilkeleri.</li>
</ul>
<blockquote>
<p><strong>Açık beyan:</strong> hangel, bu beyanın yayımı itibarıyla herhangi bir bağımsız üçüncü taraf güvence denetiminden geçmemiş, B-Corp veya benzeri bir akreditasyona sahip olmamıştır. Yukarıdaki çerçeveler yalnızca benimsenen referans setleridir.</p>
</blockquote>

<h4>4. Davranış Kuralları ve Etik Taahhütler</h4>
<p>hangel; etki verilerini ve toplumsal sonuç iddialarını dürüstçe sunmayı, doğrulanamayan iddialardan kaçınmayı, çıkar çatışmalarını yönetmeyi ve bağış kaynaklarının amaca uygun kullanımını gözetmeyi taahhüt eder. Yanıltıcı pazarlama, etki yıkama (impact-washing) ve şeffaflık karşıtı uygulamalar yasaktır. Bu taahhütler, hangel'in etik ilkeler, çıkar çatışması ve şeffaflık politikalarıyla bütünlük içinde değerlendirilir.</p>

<h4>5. Roller, Sorumluluklar ve Yönetişim</h4>
<p>hangel, üçüncü taraf gözetimi ve etik performansın izlenmesine ilişkin sorumlulukların kurum içinde tanımlanmasını ve ileride bağımsız bir güvence sürecine açık biçimde yapılandırılmasını hedefler. Etik performansa ilişkin gözetim, hangel'in planlanan kurumsal risk ve uyum yönetişim yapısıyla birlikte ele alınması amaçlanan bir alandır.</p>

<h4>6. Gelişim Yol Haritası ve Hedefler</h4>
<p>hangel, üçüncü taraf gözetim ve etik performans olgunluğunu artırmak için aşağıdaki yol haritasını <strong>taahhüt eder ve hedefler</strong>. Aşağıdaki "Mevcut Durum vs. Hedef" tablosu, gerçek konum ile ulaşılmak istenen noktayı şeffaf biçimde karşılaştırır.</p>
<table class="w-full border-collapse border border-gray-200 my-4">
  <thead>
    <tr>
      <th class="border border-gray-200 p-2 text-left text-sm" scope="col">Alan</th>
      <th class="border border-gray-200 p-2 text-left text-sm" scope="col">Mevcut Durum</th>
      <th class="border border-gray-200 p-2 text-left text-sm" scope="col">Hedef</th>
    </tr>
  </thead>
  <tbody>
    <tr><td class="border border-gray-200 p-2 text-sm">Bağımsız güvence</td><td class="border border-gray-200 p-2 text-sm">Bağımsız denetimden geçilmedi</td><td class="border border-gray-200 p-2 text-sm">Bağımsız üçüncü taraf güvence (ISAE 3000 türü) denetimini taahhüt eder</td></tr>
    <tr><td class="border border-gray-200 p-2 text-sm">B-Corp / akreditasyon</td><td class="border border-gray-200 p-2 text-sm">Sertifikasız</td><td class="border border-gray-200 p-2 text-sm">B-Corp değerlendirmesini uzun vadeli hedef olarak inceler</td></tr>
    <tr><td class="border border-gray-200 p-2 text-sm">Etki doğrulaması</td><td class="border border-gray-200 p-2 text-sm">Öz beyan temelli</td><td class="border border-gray-200 p-2 text-sm">Etki verilerinin bağımsızca doğrulanmasını hedefler</td></tr>
    <tr><td class="border border-gray-200 p-2 text-sm">UN Global Compact</td><td class="border border-gray-200 p-2 text-sm">İlkeler referans alınıyor</td><td class="border border-gray-200 p-2 text-sm">Resmî katılımcılık ve ilerleme bildirimi (CoP) seçeneğini değerlendirmeyi planlar</td></tr>
    <tr><td class="border border-gray-200 p-2 text-sm">Paydaş geri bildirimi</td><td class="border border-gray-200 p-2 text-sm">Doğrudan iletişim kanalları</td><td class="border border-gray-200 p-2 text-sm">Yapılandırılmış paydaş geri bildirim ve şikâyet mekanizması kurmayı amaçlar</td></tr>
  </tbody>
</table>

<h4>7. Hedeflenen Güvence Kapsamı</h4>
<p>hangel, ileride yürütülmesini taahhüt ettiği bağımsız güvence sürecinin aşağıdaki alanları kapsamasını hedefler. Bu güvence süreçlerinin hiçbiri bu beyanın yayımı itibarıyla tamamlanmış değildir:</p>
<ul>
  <li><strong>Etki verisinin doğrulanması:</strong> bağış, kan eşleştirme ve gönüllülük sonuçlarına ilişkin yayımlanan verilerin kaynağa dayanarak teyidi;</li>
  <li><strong>Fon izlenebilirliği:</strong> toplanan bağışların beyan edilen amaca uygun aktarıldığının bağımsızca incelenmesi;</li>
  <li><strong>Etik ve insan hakları uyumu:</strong> UN Global Compact ilkeleri ve UNGP (BM İş ve İnsan Hakları Rehber İlkeleri) çerçevesinde değerlendirme;</li>
  <li><strong>Yönetişim ve şeffaflık uygulamaları:</strong> beyan edilen yönetişim ve şeffaflık taahhütlerinin fiili uygulamayla tutarlılığı.</li>
</ul>
<p>hangel, bu güvence kapsamını bağımsız bir sağlayıcının görüş vermesine olanak verecek biçimde belgelemeyi amaçlar; ancak böyle bir görüş henüz alınmamıştır.</p>

<h4>8. Etki İddialarında Dürüstlük</h4>
<p>hangel, toplumsal etki iletişiminde gerçeğe uygunluk ilkesini benimser. Yayımlanan sayısal göstergeler, ölçüm yöntemi ve sınırlılıklarıyla birlikte sunulmaya çalışılır; tek bir başarı öyküsünün genele teşmil edilmesi veya doğrulanamayan iddialarda bulunulması ilke olarak reddedilir. hangel, bağımsız doğrulama tamamlanana kadar etki verilerinin <strong>öz beyan</strong> niteliğinde olduğunu açıkça belirtmeyi taahhüt eder. Bu yaklaşım, hangel'in açık veri ve etki verisi paylaşım politikası ile şeffaflık esasları belgeleriyle bütünlük içinde yorumlanır.</p>

<h4>9. İhbar / İhlal Bildirimi</h4>
<p>hangel, etik ihlallerin ve performans uyumsuzluklarının iyi niyetle bildirilebileceği kanalların korunmasını taahhüt eder. Bildirimler <a href="mailto:privacy@hangel.org" rel="noopener" target="_blank">privacy@hangel.org</a> ve hangel'in whistleblower (ihbar) mekanizması üzerinden iletilebilir. İyi niyetli bildirimde bulunanlara karşı misilleme yasaktır.</p>

<h4>10. İzleme, Gözden Geçirme ve Şeffaflık</h4>
<p>hangel, etik performansını ve üçüncü taraf gözetim olgunluğunu düzenli olarak gözden geçirmeyi ve gelişmeleri dürüstçe kamuoyuyla paylaşmayı hedefler. Henüz elde edilmemiş bir güvence veya akreditasyon, elde edilmiş gibi sunulmaz. Bağımsız bir güvence süreci tamamlandığında, bu beyan buna göre güncellenecektir.</p>

<h4>11. Değişiklik ve Yürürlük</h4>
<p>Bu beyan, etik performans ve üçüncü taraf gözetim faaliyetlerinin ilerlemesi doğrultusunda güncellenebilir. Güncel sürüm, platformda yayımlandığı tarihte yürürlüğe girer.</p>

<p class="text-xs text-muted-foreground"><em>Bu metin bilgilendirme amaçlıdır ve bağlayıcı nihai hukuki görüş niteliği taşımaz; yürürlük öncesi yetkili hukuk danışmanlığı önerilir.</em></p>
    `
  },
  {
    slug: 'kurumsal-risk-ve-uyum-komitesi-beyani',
    title: 'Kurumsal Risk ve Uyum Komitesi Beyanı',
    content: `
      <h3>Kurumsal Risk ve Uyum Komitesi Beyanı</h3>

<p>İşbu Kurumsal Risk ve Uyum Komitesi Beyanı, hangel platformunu işleten <strong>hangel AŞ</strong> tarafından, kurumsal risk yönetimi ve uyum gözetimine ilişkin <strong>planlanan yönetişim yapısını</strong>, başvurulan referans çerçeveleri ve bu alandaki gelişim yol haritasını şeffaf biçimde ortaya koymak amacıyla hazırlanmıştır. Bu metnin esas dili Türkçedir; başvurulan uluslararası çerçevelere atıflar İngilizce ifadeler içerebilir. Dürüstlük gereği açıkça belirtilir ki: hangel'de bu beyanın yayımı itibarıyla <strong>resmî olarak kurulmuş, faal ve veto yetkisine sahip bağımsız bir risk ve uyum komitesi henüz bulunmamaktadır</strong>. Aşağıda yer alan hususlar, hedeflenen yönetişim yapısını ve bu yapıya geçiş yol haritasını tanımlar; mevcut bir komitenin faaliyetlerinin betimlenmesi değildir.</p>

<h4>1. Amaç ve İlkeler</h4>
<p>Bu beyanın amacı; hangel'in büyüdükçe risk yönetimi ve mevzuata uyum gözetimini kurumsal bir yönetişim yapısı altında nasıl ele almayı hedeflediğini dürüstçe açıklamaktır. hangel; sorumlu yönetişim, hesap verebilirlik, görevler ayrılığı ve şeffaflık ilkelerini benimser. Acil kan talebi (özel nitelikli sağlık verisi), bağış (finansal akış) ve geniş paydaş ekosistemi nedeniyle, etkin risk ve uyum gözetimi hangel için yüksek öncelikli bir kurumsal hedeftir.</p>

<h4>2. Kapsam ve Paydaşlar</h4>
<p>Beyan; hangel'in veri koruma (KVKK/GDPR), finansal uyum (MASAK/AML-CFT), tüketici ve elektronik ticaret mevzuatı, bağış ve yardım toplama mevzuatı ile etik ve insan hakları alanlarındaki risk ve uyum gözetimini kapsar. Paydaşlar; kullanıcılar, bağışçılar, gönüllüler, platformdaki kuruluşlar, çalışanlar ve düzenleyici merciler ile kamuoyudur.</p>

<h4>3. Referans Çerçeve — Mevcut Durum</h4>
<p>hangel, planlanan risk ve uyum yönetişim yapısını aşağıdaki çerçeveleri <strong>referans</strong> alarak tasarlamayı hedefler. Bu referansların benimsenmesi, hangel'in bu çerçevelerde sertifikalı veya bağımsızca denetlenmiş olduğu anlamına gelmez:</p>
<ul>
  <li><strong>OECD Principles of Corporate Governance</strong> (G20/OECD Kurumsal Yönetim İlkeleri) — yönetim kurulu sorumlulukları, gözetim, hesap verebilirlik ve paydaş hakları ilkeleri;</li>
  <li><strong>COSO ERM</strong> (Enterprise Risk Management — Integrating with Strategy and Performance) — kurumsal risklerin tanımlanması, değerlendirilmesi, yönetilmesi ve izlenmesine ilişkin bütünleşik çerçeve;</li>
  <li><strong>6102 sayılı Türk Ticaret Kanunu</strong> — anonim şirketlerde yönetim kurulu ve komite yapılanmasına ilişkin hükümler (örn. m.366 yönetim kurulunun komitelere ilişkin düzenleme yetkisi, m.378 riskin erken saptanması ve yönetimi komitesi, m.393 menfaat çatışması ve müzakereye katılma yasağı);</li>
  <li><strong>ISO 31000</strong> — risk yönetimi ilke ve rehberi (referans olarak).</li>
</ul>
<blockquote>
<p><strong>Açık beyan:</strong> 6102 sayılı TTK m.378 uyarınca riskin erken saptanması ve yönetimi komitesi kurma zorunluluğu esas olarak payları borsada işlem gören şirketler bakımından öngörülmüştür; yönetim kurulu, denetçinin gerekli görüp bildirmesi hâlinde bu komiteyi kurmakla yükümlüdür. hangel, böyle bir komiteyi yasal zorunluluk doğmadan dahi <strong>gönüllü iyi yönetişim hedefi</strong> olarak kurmayı amaçlar. Bu beyanın yayımı itibarıyla faal, bağımsız ve veto yetkili bir risk ve uyum komitesi bulunmamaktadır.</p>
</blockquote>

<h4>4. Davranış Kuralları ve Görevler Ayrılığı</h4>
<p>hangel, planlanan yönetişim yapısında karar alma ile gözetim işlevlerinin makul ölçüde birbirinden ayrılmasını ve menfaat çatışmalarının TTK m.393 çerçevesinde yönetilmesini hedefler. Uyum ihlallerine ve risk eşiklerinin aşılmasına ilişkin önlemlerin tanımlanması amaçlanır.</p>

<h4>5. Hedeflenen Yönetişim Yapısı ve Roller</h4>
<p>hangel, aşağıdaki rolleri içeren bir yönetişim yapısını <strong>hedefler</strong> (bu roller hâlihazırda tam olarak teşekkül etmiş değildir):</p>
<ul>
  <li><strong>Risk ve Uyum Komitesi (planlanan):</strong> kurumsal riskleri ve mevzuata uyumu gözetmek; yönetim kuruluna raporlamak;</li>
  <li><strong>Veri Koruma sorumlusu / irtibat noktası:</strong> KVKK ve GDPR uyumunu izlemek (DPO tanımı belgesiyle birlikte);</li>
  <li><strong>Finansal uyum sorumlusu (planlanan):</strong> MASAK/AML-CFT yükümlülüklerini izlemek.</li>
</ul>

<h4>6. Gelişim Yol Haritası ve Hedefler</h4>
<p>hangel, risk ve uyum yönetişim olgunluğunu artırmak için aşağıdaki yol haritasını <strong>taahhüt eder ve hedefler</strong>. Aşağıdaki "Mevcut Durum vs. Hedef" tablosu, gerçek konum ile ulaşılmak istenen noktayı şeffaf biçimde karşılaştırır.</p>
<table class="w-full border-collapse border border-gray-200 my-4">
  <thead>
    <tr>
      <th class="border border-gray-200 p-2 text-left text-sm" scope="col">Alan</th>
      <th class="border border-gray-200 p-2 text-left text-sm" scope="col">Mevcut Durum</th>
      <th class="border border-gray-200 p-2 text-left text-sm" scope="col">Hedef</th>
    </tr>
  </thead>
  <tbody>
    <tr><td class="border border-gray-200 p-2 text-sm">Risk ve uyum komitesi</td><td class="border border-gray-200 p-2 text-sm">Faal, bağımsız komite yok</td><td class="border border-gray-200 p-2 text-sm">Tanımlı yetki ve raporlama hattına sahip bir komite kurmayı taahhüt eder</td></tr>
    <tr><td class="border border-gray-200 p-2 text-sm">Risk envanteri</td><td class="border border-gray-200 p-2 text-sm">Yapılandırılmış envanter yok</td><td class="border border-gray-200 p-2 text-sm">COSO ERM / ISO 31000 esaslı kurumsal risk envanteri oluşturmayı hedefler</td></tr>
    <tr><td class="border border-gray-200 p-2 text-sm">Uyum izleme</td><td class="border border-gray-200 p-2 text-sm">Vaka bazlı izleme</td><td class="border border-gray-200 p-2 text-sm">Mevzuat bazında belgelenmiş uyum izleme süreci kurmayı amaçlar</td></tr>
    <tr><td class="border border-gray-200 p-2 text-sm">Komite veto/eskalasyon yetkisi</td><td class="border border-gray-200 p-2 text-sm">Tanımlı değil</td><td class="border border-gray-200 p-2 text-sm">Yüksek riskli kararlarda eskalasyon ve durdurma yetkisi tanımlamayı planlar</td></tr>
    <tr><td class="border border-gray-200 p-2 text-sm">Düzenli toplantı/raporlama</td><td class="border border-gray-200 p-2 text-sm">Resmî takvim yok</td><td class="border border-gray-200 p-2 text-sm">Periyodik komite toplantısı ve yönetim kuruluna raporlamayı hedefler</td></tr>
  </tbody>
</table>

<h4>7. Hedeflenen Komite Çalışma Esasları</h4>
<p>hangel, planlanan risk ve uyum komitesinin aşağıdaki çalışma esaslarına göre yapılandırılmasını hedefler. Bu esaslar, henüz yürürlükte olan bir komite tüzüğünün betimlenmesi değil, hedeflenen bir tasarımdır:</p>
<ul>
  <li><strong>Yetki ve görev tanımı:</strong> komitenin görev alanını, karar yetkisini ve yönetim kuruluna raporlama hattını belirleyen yazılı bir çalışma esasının (tüzük) hazırlanması;</li>
  <li><strong>Bağımsızlık:</strong> gözetim işlevinin operasyonel karar alma süreçlerinden makul ölçüde ayrılması;</li>
  <li><strong>Toplantı düzeni:</strong> periyodik toplantılar ve olağanüstü hâllerde toplanma usulü;</li>
  <li><strong>Belgeleme:</strong> kararların, risk değerlendirmelerinin ve eskalasyonların tutanakla kayıt altına alınması.</li>
</ul>

<h4>8. Hedeflenen Risk Kategorileri</h4>
<p>hangel, planlanan risk envanterinin asgari olarak aşağıdaki kategorileri kapsamasını amaçlar: <strong>veri koruma ve mahremiyet riski</strong> (özel nitelikli sağlık verisi dahil), <strong>finansal ve kara para aklama/terörün finansmanı riski</strong> (MASAK/5549 ve 6415 kapsamında), <strong>hukuki ve mevzuata uyum riski</strong> (tüketici, e-ticaret, dernek/vakıf ve yardım toplama mevzuatı), <strong>operasyonel ve teknolojik risk</strong> (hizmet sürekliliği ve güvenlik), <strong>itibar ve etik riski</strong> ile <strong>üçüncü taraf/tedarikçi riski</strong>. Her kategori için olasılık ve etki değerlendirmesi yapılması ve azaltıcı önlemlerin tanımlanması hedeflenir. Bu envanter henüz oluşturulmamış olup, kurulması planlanan bir yapıdır.</p>

<h4>9. İhbar / İhlal Bildirimi ve Yaptırım</h4>
<p>hangel, risk ve uyum ihlallerinin iyi niyetle bildirilebileceği kanalların korunmasını taahhüt eder; bildirimler hangel'in whistleblower mekanizması ve <a href="mailto:privacy@hangel.org" rel="noopener" target="_blank">privacy@hangel.org</a> üzerinden iletilebilir. İyi niyetli ihbarda bulunanlara misilleme yasaktır. Belirlenecek yaptırımların, planlanan yönetişim yapısı kurulduğunda resmîleştirilmesi amaçlanır.</p>

<h4>10. İzleme, Gözden Geçirme ve Şeffaflık</h4>
<p>hangel, yönetişim yapısının olgunlaşmasını düzenli olarak gözden geçirmeyi ve gelişmeleri dürüstçe paylaşmayı hedefler. Henüz kurulmamış bir komite kurulmuş gibi sunulmaz; mevcut olmayan bir veto yetkisi mevcutmuş gibi iddia edilmez. Komite resmî olarak faaliyete geçtiğinde, bu beyan buna göre güncellenecektir.</p>

<h4>11. Değişiklik ve Yürürlük</h4>
<p>Bu beyan, kurumsal yönetişim yapısının gelişimi, mevzuat değişiklikleri ve şirket büyümesi doğrultusunda güncellenebilir. Güncel sürüm, platformda yayımlandığı tarihte yürürlüğe girer.</p>

<p class="text-xs text-muted-foreground"><em>Bu metin bilgilendirme amaçlıdır ve bağlayıcı nihai hukuki görüş niteliği taşımaz; yürürlük öncesi yetkili hukuk danışmanlığı önerilir.</em></p>
    `
  },

  // --- K. Kuruluş Tipine Özel Üyelik Sözleşmeleri ---
  {
    slug: 'stk-uyelik',
    title: 'STK Üyelik Sözleşmesi',
    content: `
      <h3>STK Üyelik Sözleşmesi</h3>

<p>İşbu STK Üyelik Sözleşmesi (kısaca "Sözleşme"), Türkiye'de yerleşik bir toplumsal etki platformu ve sosyal girişim olan hangel platformunu işleten <strong>hangel AŞ</strong> ile, platforma sivil toplum kuruluşu sıfatıyla üye olan dernek ve vakıflar arasındaki üyelik ilişkisinin hukuki çerçevesini belirler. Sözleşme, dernek ve vakıfların hangel üzerinde kurumsal profil oluşturması, bağış toplama, gönüllülük ilanı yayımlama, acil kan talebi/eşleştirme süreçlerine katılma ve etki/şeffaflık raporlaması yapmasına ilişkin tarafların hak ve yükümlülüklerini düzenler. Bu metnin esas dili Türkçedir.</p>

<h4>1. Taraflar ve Tanımlar</h4>
<p>Bu Sözleşme; bir tarafta İstanbul ticaret siciline kayıtlı <strong>hangel AŞ</strong> ("Platform" veya "hangel") ile diğer tarafta, 4721 sayılı Türk Medeni Kanunu ve 5253 sayılı Dernekler Kanunu kapsamında kurulmuş <em>dernekler</em> ya da 4721 sayılı Türk Medeni Kanunu ile 5737 sayılı Vakıflar Kanunu kapsamında kurulmuş <em>vakıflar</em> ("STK" veya "Üye") arasında akdedilmiştir.</p>
<ul>
<li><strong>STK:</strong> Yetkili mercie usulüne uygun tescil edilmiş, tüzel kişiliği bulunan dernek veya vakıf.</li>
<li><strong>Yetkili Temsilci:</strong> STK'yı bağlamaya yönetim kurulu kararı veya tüzük/vakıf senedi ile yetkilendirilmiş gerçek kişi.</li>
<li><strong>Kurumsal Profil:</strong> STK'nın hangel üzerinde oluşturduğu, tanıtım ve faaliyet bilgilerini içeren sayfa.</li>
<li><strong>Bağış Kampanyası:</strong> 2860 sayılı Yardım Toplama Kanunu kapsamında yürütülen veya bu Kanunun istisnaları çerçevesinde gerçekleştirilen fon toplama faaliyeti.</li>
<li><strong>Şeffaflık Raporu:</strong> STK'nın faaliyet, fon kullanımı ve etki verilerini kamuoyuna açıklamak üzere hazırladığı periyodik bilgilendirme.</li>
</ul>

<h4>2. Sözleşmenin Konusu ve Kapsamı</h4>
<p>Sözleşmenin konusu, STK'nın hangel platformu üzerinde kurumsal varlık oluşturarak Platformun sunduğu hizmetlerden yararlanmasının koşullarının belirlenmesidir. Kapsam; kurumsal profil yönetimi, bağış kampanyalarının yayımlanması ve fon aktarımı, gönüllü ilanlarının paylaşımı, acil kan talebi eşleştirmesine kurumsal katılım ile şeffaflık ve etki raporlamasını içerir. STK, bu Sözleşmeyi onaylamakla, kendi tüzüğü/vakıf senedi, ilgili genel kurul/yönetim kurulu kararları ve yürürlükteki mevzuata uygun hareket etmeyi taahhüt eder.</p>

<h4>3. Üyelik Koşulları</h4>
<p>Üyeliğin geçerli biçimde tesisi için STK'nın aşağıdaki koşulları sağlaması gerekir:</p>
<ul>
<li>5253 sayılı Dernekler Kanunu uyarınca kütüğe kayıtlı bir dernek veya 5737 sayılı Vakıflar Kanunu uyarınca Vakıflar Genel Müdürlüğü nezdinde kayıtlı bir vakıf olması ve tüzel kişiliğinin devam etmesi;</li>
<li>Tüzük veya vakıf senedindeki amaç ve faaliyet alanının platform üzerindeki faaliyetlerle uyumlu olması;</li>
<li>Yetkili Temsilci aracılığıyla, yetki belgesi (yönetim kurulu kararı, imza sirküleri vb.) ile başvurması;</li>
<li>Bağış toplayacaksa, 2860 sayılı Yardım Toplama Kanunu m.6 uyarınca gerekli izinleri almış olması veya aynı Kanun kapsamında izinden muaf statüde bulunması;</li>
<li>Vergi kimlik numarası, kütük/sicil bilgileri ve kurum hesabına ait IBAN bilgisinin doğru ve güncel olması.</li>
</ul>
<p>hangel, başvuru sırasında beyan edilen bilgi ve belgeleri doğrulama hakkını saklı tutar; gerçeğe aykırı beyan, üyeliğin reddi veya feshi sebebidir.</p>

<h4>4. Tarafların Hak ve Yükümlülükleri</h4>
<p><strong>STK'nın yükümlülükleri:</strong></p>
<ul>
<li>Tüm faaliyetlerini kendi tüzüğü/vakıf senedi, 5253 ve 5737 sayılı Kanunlar ile 2860 sayılı Yardım Toplama Kanununa uygun yürütmek;</li>
<li>Profil ve kampanya bilgilerini doğru, güncel ve yanıltıcı olmayacak biçimde tutmak;</li>
<li>Topladığı fonları beyan ettiği amaca tahsis etmek ve kötüye kullanmamak;</li>
<li>Platform üzerinden eriştiği gönüllü ve bağışçı verilerini 6698 sayılı KVKK'ya uygun işlemek;</li>
<li>Talep edilen şeffaflık raporlama yükümlülüklerini yerine getirmek.</li>
</ul>
<p><strong>hangel'in yükümlülükleri:</strong></p>
<ul>
<li>Platform altyapısını makul özen ve süreklilikle sunmak;</li>
<li>Bağış aktarımlarını izlenebilir ve mutabakata elverişli biçimde yürütmek;</li>
<li>STK'nın kişisel verilerini ve kurumsal bilgilerini mevzuata uygun korumak;</li>
<li>Şeffaflık endeksi ve raporlama araçlarını STK'nın kullanımına sunmak.</li>
</ul>

<h4>5. Bağış Aktarımı ve Ücretlendirme</h4>
<p>Platform üzerinden toplanan bağışlar, STK'nın doğrulanmış kurum hesabına aktarılır. Ödeme/aktarım sürecinde üçüncü taraf ödeme kuruluşlarının kesintileri ve hangel'in önceden açıkça bildirdiği hizmet/altyapı bedeli haricinde STK'ya ek bir yük getirilmez. Bağış aktarımlarına ilişkin aylık mutabakat raporu STK ile paylaşılır. hangel, bağışların STK adına emanet niteliği taşıdığını kabul eder ve bu fonları kendi malvarlığından ayrı izler.</p>

<table class="w-full border-collapse border border-gray-200 my-4">
<thead>
<tr>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Süreç</th>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Yasal Dayanak</th>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Sorumlu</th>
</tr>
</thead>
<tbody>
<tr>
<td class="border border-gray-200 p-2 text-sm">Yardım toplama izni</td>
<td class="border border-gray-200 p-2 text-sm">2860 sayılı Kanun m.6, m.7</td>
<td class="border border-gray-200 p-2 text-sm">STK</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Fon aktarımı ve mutabakat</td>
<td class="border border-gray-200 p-2 text-sm">6098 sayılı TBK (vekâlet/emanet ilkeleri)</td>
<td class="border border-gray-200 p-2 text-sm">hangel + STK</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Şeffaflık raporlaması</td>
<td class="border border-gray-200 p-2 text-sm">5253 m.19 / 5737 ilgili hükümleri</td>
<td class="border border-gray-200 p-2 text-sm">STK</td>
</tr>
</tbody>
</table>

<h4>6. Şeffaflık ve Raporlama Yükümlülüğü</h4>
<p>STK, kamuoyu güvenini korumak amacıyla periyodik şeffaflık raporu sunmayı kabul eder. Bu kapsamda; toplanan fon tutarı, fonun tahsis edildiği amaç, gerçekleştirilen faaliyetler ve mümkün olduğunda etki göstergeleri açıklanır. Dernekler için 5253 sayılı Kanun m.19 uyarınca beyanname verme yükümlülüğü, vakıflar için 5737 sayılı Kanun kapsamındaki beyanname ve denetim yükümlülükleri saklıdır. hangel, sunulan verileri Şeffaflık Endeksi Esasları çerçevesinde değerlendirmeye alabilir. STK, gerçeğe aykırı raporlamanın üyeliğin feshi sebebi olduğunu kabul eder.</p>

<h4>7. Fikri Mülkiyet Hakları</h4>
<p>STK'nın logo, marka ve içerikleri kendisine ait kalır; STK, bu içerikleri platformda kullanma ve sergileme yönünde hangel'e sınırlı, münhasır olmayan bir lisans verir. hangel platform yazılımı, tasarımı ve veri tabanı üzerindeki hakları kendisinde saklı tutar. Hiçbir taraf, diğerinin fikri mülkiyetini izinsiz kullanamaz.</p>

<h4>8. Sorumluluğun Sınırlandırılması ve Sorumsuzluk</h4>
<p>hangel, STK ile bağışçı/gönüllü arasındaki ilişkide aracı konumundadır ve STK'nın yürüttüğü faaliyetlerin hukuka uygunluğundan veya fon kullanımından doğrudan sorumlu değildir. <strong>Acil kan talebi ve eşleştirme</strong> süreçlerinde hangel yalnızca teknik aracılık sağlar; kan bağışı, tıbbi uygunluk ve nakil süreçleri yetkili sağlık kuruluşlarının sorumluluğundadır. hangel hiçbir surette tıbbi tavsiye vermez, tıbbi sonuçları garanti etmez ve bu süreçlerden doğan zararlardan sorumlu tutulamaz. hangel'in sorumluluğu, yürürlükteki emredici hükümler saklı kalmak kaydıyla, ağır kusur ve kasıt halleriyle sınırlıdır.</p>

<h4>9. Kişisel Verilerin Korunması</h4>
<p>Taraflar, platform üzerinde işlenen kişisel verileri 6698 sayılı Kişisel Verilerin Korunması Kanunu'na (KVKK) uygun olarak işlemeyi taahhüt eder. Özellikle kan grubu gibi <em>özel nitelikli sağlık verileri</em> KVKK m.6 uyarınca yalnızca açık rıza veya kanunun öngördüğü diğer şartlar çerçevesinde işlenir. STK, eriştiği gönüllü/bağışçı verilerini yalnızca amaçla sınırlı kullanır, KVKK m.5 ve m.4'teki ilkelere uyar ve veri sorumlusu sıfatıyla aydınlatma (m.10) ve ilgili kişi haklarına (m.11) ilişkin yükümlülüklerini yerine getirir. Yurt dışı aktarımlar KVKK m.9 çerçevesinde yürütülür. Veri talepleri için <a href="mailto:kvkk@hangel.org">kvkk@hangel.org</a> adresine başvurulabilir.</p>

<h4>10. Mücbir Sebep</h4>
<p>Doğal afet, salgın, savaş, siber saldırı, mevzuat değişikliği, kamu otoritesi kararları ve tarafların makul kontrolü dışındaki benzeri olaylar mücbir sebep sayılır. Mücbir sebep süresince yükümlülüklerin ifası askıya alınır; sebep makul süreyi aşarsa taraflar Sözleşmeyi feshedebilir.</p>

<h4>11. Fesih ve Askıya Alma</h4>
<p>Taraflardan her biri, gerekçe göstererek ve <strong>30 gün önceden</strong> yazılı bildirimde bulunmak suretiyle Sözleşmeyi feshedebilir. STK'nın tüzel kişiliğini yitirmesi, yardım toplama izninin iptali, gerçeğe aykırı beyan, fon kötüye kullanımı veya mevzuata aykırı faaliyet hallerinde hangel üyeliği derhal askıya alabilir ve haklı sebeple feshedebilir. Fesih halinde, toplanmış ancak aktarılmamış bağışlar STK'nın doğrulanmış hesabına veya mevzuatın gerektirdiği mercie aktarılır.</p>

<h4>12. Uygulanacak Hukuk ve Yetkili Mahkeme</h4>
<p>Bu Sözleşme Türkiye Cumhuriyeti hukukuna tabidir. Sözleşmeden doğacak uyuşmazlıklarda İstanbul (Çağlayan) Mahkemeleri ve İcra Daireleri yetkilidir. Taraflar, dava yoluna başvurmadan önce iyi niyetle uzlaşma görüşmeleri yürütmeyi kabul eder.</p>

<h4>13. Tebligat, Değişiklik ve Yürürlük</h4>
<p>Tarafların bildirdiği e-posta adresleri ve platform içi bildirimler geçerli tebligat adresi sayılır. hangel, mevzuat değişikliği ve hizmet gelişimi gerektirdiğinde Sözleşmeyi güncelleyebilir; esaslı değişiklikler en az 30 gün önceden bildirilir ve STK'nın itiraz/fesih hakkı saklıdır. Bu Sözleşme, STK'nın elektronik onayı ile yürürlüğe girer.</p>

<p class="text-xs text-muted-foreground"><em>Bu metin bilgilendirme amaçlıdır ve bağlayıcı nihai hukuki görüş niteliği taşımaz; yürürlük öncesi yetkili hukuk danışmanlığı önerilir.</em></p>
    `
  },
  {
    slug: 'seffaflik',
    title: 'Şeffaflık Endeksi Esasları',
    content: `
      <h3>Şeffaflık Endeksi Esasları</h3>

<p>İşbu Şeffaflık Endeksi Esasları, hangel platformunu işleten <strong>hangel AŞ</strong> tarafından, platform üzerinde faaliyet gösteren dernek, vakıf, sosyal işletme ve diğer kuruluşların şeffaflık ve hesap verebilirlik düzeyini nesnel, ölçülebilir ve karşılaştırılabilir biçimde değerlendirmek amacıyla hazırlanmıştır. Endeks; bağışçı güvenini güçlendirmeyi, kötüye kullanımı caydırmayı ve toplumsal etki ekosisteminde sağlıklı bir rekabet ortamı oluşturmayı hedefler. Bu metnin esas dili Türkçedir; yararlanılan uluslararası çerçevelere atıflar İngilizce ifadeler içerebilir.</p>

<h4>1. Amaç ve Kapsam</h4>
<p>Şeffaflık Endeksi'nin amacı, kuruluşların finansal raporlama, yönetişim, fon izlenebilirliği, etki ölçümü ve denetim alanlarındaki performansını standart bir metodoloji ile değerlendirmektir. Kapsam, hangel üzerinde bağış toplayan veya kurumsal profil oluşturan tüm kuruluşları içerir. Endeks; bir <em>akreditasyon</em> veya <em>resmî denetim</em> mekanizması değil, kamuya açık beyan ve doğrulanabilir verilere dayanan bir <strong>şeffaflık değerlendirme aracı</strong>dır. hangel, endeksin bağımsız bir denetim raporu yerine geçmediğini açıkça beyan eder.</p>

<h4>2. Yasal ve Çerçevesel Dayanak</h4>
<p>Endeks aşağıdaki ulusal mevzuat ve uluslararası şeffaflık çerçevelerinden ilham alır ve bunlarla uyumu gözetir:</p>
<ul>
<li><strong>2860 sayılı Yardım Toplama Kanunu</strong> — yardım toplama izni (m.6, m.7) ve toplanan yardımların amaca uygun kullanımı/denetimi ilkeleri;</li>
<li><strong>5253 sayılı Dernekler Kanunu</strong> m.19 (beyanname) ve <strong>5737 sayılı Vakıflar Kanunu</strong> kapsamındaki beyan/denetim yükümlülükleri;</li>
<li><strong>Bağımsız güvence ve denetim ilkeleri</strong> — ISA (International Standards on Auditing) ve ISAE 3000 türü güvence çerçeveleri (referans olarak; hangel bu standartlarda akredite bir denetçi değildir);</li>
<li><strong>IATI</strong> (International Aid Transparency Initiative) yayım standardı — fon akışı ve faaliyet verilerinin yapılandırılmış paylaşımı;</li>
<li><strong>IRIS+</strong> (Impact Reporting and Investment Standards) — etki göstergeleri ve etki ölçümü taksonomisi;</li>
<li><strong>Social Value International (SROI)</strong> ilkeleri ve BM Sürdürülebilir Kalkınma Amaçları (SDG) ile hizalama.</li>
</ul>
<p>Bu çerçeveler hangel'in bir sertifikası olmayıp, endeks metodolojisinin referans aldığı uluslararası iyi uygulama setleridir.</p>

<h4>3. Endeks Bileşenleri ve Skorlama</h4>
<p>Endeks, beş ana bileşen üzerinden 100 puan üzerinden hesaplanır. Her bileşen, doğrulanabilir kanıt belgelerine dayanan alt göstergelere ayrılır.</p>

<table class="w-full border-collapse border border-gray-200 my-4">
<thead>
<tr>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Bileşen</th>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Ölçülen Unsurlar</th>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Ağırlık</th>
</tr>
</thead>
<tbody>
<tr>
<td class="border border-gray-200 p-2 text-sm">Finansal Raporlama</td>
<td class="border border-gray-200 p-2 text-sm">Gelir-gider tablosu, fon kaynak/kullanım açıklaması, beyanname güncelliği</td>
<td class="border border-gray-200 p-2 text-sm">%25</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Yönetişim</td>
<td class="border border-gray-200 p-2 text-sm">Yönetim yapısı, karar mekanizmaları, çıkar çatışması politikası, organ bilgileri</td>
<td class="border border-gray-200 p-2 text-sm">%20</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">İzlenebilirlik</td>
<td class="border border-gray-200 p-2 text-sm">Bağışın kaynaktan kullanım noktasına kadar takibi, mutabakat ve fatura/belge düzeni</td>
<td class="border border-gray-200 p-2 text-sm">%25</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Etki Ölçümü</td>
<td class="border border-gray-200 p-2 text-sm">Çıktı/sonuç göstergeleri, IRIS+ ile uyum, faydalanıcı geri bildirimi</td>
<td class="border border-gray-200 p-2 text-sm">%20</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Denetim</td>
<td class="border border-gray-200 p-2 text-sm">Bağımsız/iç denetim varlığı, denetim bulgularına yanıt, üçüncü taraf güvence</td>
<td class="border border-gray-200 p-2 text-sm">%10</td>
</tr>
</tbody>
</table>

<p>Toplam skora göre kuruluşlar kademelere ayrılır: <strong>A (85–100)</strong>, <strong>B (70–84)</strong>, <strong>C (55–69)</strong>, <strong>D (40–54)</strong> ve <strong>E (40 altı)</strong>. Skor, kuruluşun kurumsal profilinde, dayandığı kanıt belgelerine erişimle birlikte gösterilir.</p>

<h4>4. Veri Toplama ve Doğrulama Yöntemi</h4>
<p>Endeks verileri; kuruluşun beyanları, platform içi işlem kayıtları, kamuya açık resmî kayıtlar (dernek/vakıf sicilleri) ve gönüllü olarak sunulan denetim raporlarından derlenir. hangel, sunulan belgelerin tutarlılığını kontrol eder; ancak resmî bir denetim makamı sıfatıyla hareket etmez. Doğrulanamayan veya kanıtlanamayan beyanlar skorlamada dikkate alınmaz. Kuruluş, beyanlarının doğruluğundan kendisi sorumludur.</p>

<h4>5. Kanıt Belgeleri ve Sorumluluk Dağılımı</h4>
<p>Her skorlama bileşeni, kuruluşun sunduğu kanıt belgelerine dayanır. Finansal raporlama için gelir-gider tabloları ve beyannameler; yönetişim için organ/karar belgeleri ve çıkar çatışması politikası; izlenebilirlik için fatura, dekont ve mutabakat kayıtları; etki ölçümü için faaliyet raporları ve gösterge verileri; denetim için bağımsız veya iç denetim raporları esas alınır. Kuruluş, bu belgelerin doğruluğundan ve güncelliğinden tek başına sorumludur. hangel, belgelerin biçimsel tutarlılığını kontrol eder; ancak belgelerin maddi doğruluğunu garanti eden bir denetçi sıfatıyla hareket etmez. Yardım toplama faaliyetlerinde 2860 sayılı Yardım Toplama Kanunu m.6 ve m.7 kapsamındaki izin/denetim yükümlülükleri her hâlükârda kuruluşa aittir.</p>

<h4>6. İtiraz ve Düzeltme Süreci</h4>
<p>Skorunu uygun bulmayan kuruluş, skorun yayımından itibaren <strong>15 gün</strong> içinde gerekçeli itirazını ve destekleyici belgelerini hangel'e iletebilir. İtiraz, en geç <strong>30 gün</strong> içinde değerlendirilir ve sonucu yazılı olarak bildirilir. İtiraz haklı bulunursa skor güncellenir; sonuçtan memnun kalmayan kuruluş ek kanıtla yeniden başvurabilir. Süreç boyunca itiraz edilen skor, "itiraz incelemede" notuyla gösterilir.</p>

<h4>7. Şeffaflık ve Kamuoyu Bilgilendirmesi</h4>
<p>Endeks metodolojisi, bileşen ağırlıkları ve skorlama kuralları kamuya açık olarak yayımlanır. hangel, metodolojide yaptığı değişiklikleri en az 30 gün önceden duyurur. Skorlar, bağışçıların bilinçli karar verebilmesi için kuruluş profillerinde şeffaf biçimde sunulur. hangel, endeksin tanıtım amaçlı kullanımında yanıltıcı ifadelerden kaçınılmasını ve "akredite/sertifikalı" gibi nitelendirmelerden kaçınılmasını esas alır.</p>

<h4>8. Mevcut Durum ve Hedefler</h4>
<p>Şeffaflık Endeksi sürekli gelişen bir araçtır. Aşağıdaki tablo mevcut durumu ve yol haritasını gösterir:</p>

<table class="w-full border-collapse border border-gray-200 my-4">
<thead>
<tr>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Alan</th>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Mevcut Durum</th>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Hedef</th>
</tr>
</thead>
<tbody>
<tr>
<td class="border border-gray-200 p-2 text-sm">Bağımsız güvence</td>
<td class="border border-gray-200 p-2 text-sm">Kuruluşların gönüllü beyan ve belgelerine dayanır</td>
<td class="border border-gray-200 p-2 text-sm">Bağımsız güvence sağlayıcılarıyla işbirliği kurmayı hedefler</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">IATI/IRIS+ entegrasyonu</td>
<td class="border border-gray-200 p-2 text-sm">Göstergelerle kavramsal hizalama yapılmıştır</td>
<td class="border border-gray-200 p-2 text-sm">Yapılandırılmış veri yayımına geçmeyi amaçlar</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Otomatik doğrulama</td>
<td class="border border-gray-200 p-2 text-sm">Tutarlılık kontrolleri kısmen otomatiktir</td>
<td class="border border-gray-200 p-2 text-sm">Resmî kayıtlarla otomatik mutabakatı geliştirmeyi taahhüt eder</td>
</tr>
</tbody>
</table>

<h4>9. Yürürlük</h4>
<p>Bu Esaslar, hangel tarafından yayımlandığı tarihte yürürlüğe girer ve periyodik olarak gözden geçirilir. Esaslara ilişkin görüş ve önerilerle ilgili olarak veri koruma yönlerinde <a href="mailto:kvkk@hangel.org">kvkk@hangel.org</a> adresine başvurulabilir. Endeks değerlendirmelerinde işlenen kişisel veriler 6698 sayılı KVKK'ya uygun olarak işlenir.</p>

<p class="text-xs text-muted-foreground"><em>Bu metin bilgilendirme amaçlıdır ve bağlayıcı nihai hukuki görüş niteliği taşımaz; yürürlük öncesi yetkili hukuk danışmanlığı önerilir.</em></p>
    `
  },
  {
    slug: 'marka-uyelik',
    title: 'Marka Üyelik Sözleşmesi',
    content: `
      <h3>Marka Üyelik Sözleşmesi</h3>

<p>İşbu Marka Üyelik Sözleşmesi ("Sözleşme"), Türkiye'de yerleşik toplumsal etki platformu hangel'i işleten <strong>hangel AŞ</strong> ile, platforma ticari marka, işletme veya sosyal işletme sıfatıyla üye olan tüzel veya gerçek kişi tacirler ("Marka Üye") arasındaki ilişkinin hukuki çerçevesini belirler. Sözleşme; Marka Üye'nin platformda ürün vitrini oluşturması, bağış kategorileri tanımlaması, affiliate (bağış aktarımlı satış ortaklığı) modeline katılması ve satışlardan elde edilen gelirin bir kısmını bağışa yönlendirmesine ilişkin tarafların hak ve yükümlülüklerini düzenler. Bu metnin esas dili Türkçedir.</p>

<h4>1. Taraflar ve Tanımlar</h4>
<p>Sözleşme; <strong>hangel AŞ</strong> ("Platform" veya "hangel") ile 6102 sayılı Türk Ticaret Kanunu m.12 anlamında tacir sıfatını haiz veya sosyal işletme olarak faaliyet gösteren <strong>Marka Üye</strong> arasında akdedilmiştir.</p>
<ul>
<li><strong>Marka Üye:</strong> Ticaret siciline kayıtlı, ürün veya hizmet sunan işletme ya da sosyal girişim.</li>
<li><strong>Ürün Vitrini:</strong> Marka Üye'nin platformda sergilediği ürün/hizmet listesi.</li>
<li><strong>Bağış Kategorisi:</strong> Satış gelirinin belirli bir oranının yönlendirileceği toplumsal amaç başlığı.</li>
<li><strong>Affiliate Modeli:</strong> Marka Üye ürünlerinin platform veya iş ortakları aracılığıyla tanıtılması ve satıştan doğan bağış payının aktarılması düzeni.</li>
<li><strong>Bağış Oranı:</strong> Satış bedelinin, Marka Üye'nin taahhüt ettiği ve bağışa aktarılacak yüzdesi.</li>
</ul>

<h4>2. Sözleşmenin Konusu ve Kapsamı</h4>
<p>Sözleşmenin konusu, Marka Üye'nin hangel platformu üzerinde ticari/sosyal işletme varlığı oluşturarak ürün vitrini sergilemesi, bağış kategorileri tanımlaması ve affiliate modeline dahil olmasının koşullarının belirlenmesidir. Marka Üye, ticari faaliyetlerini 6102 sayılı TTK, tüketicilerle ilişkilerini 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve elektronik ticaret faaliyetlerini 6563 sayılı Elektronik Ticaretin Düzenlenmesi Hakkında Kanun hükümlerine uygun yürütmeyi taahhüt eder.</p>

<h4>3. Üyelik Koşulları</h4>
<p>Marka Üyeliği için aşağıdaki koşulların sağlanması gerekir:</p>
<ul>
<li>6102 sayılı TTK uyarınca ticaret siciline kayıtlı olmak veya usulüne uygun bir işletme statüsüne sahip olmak;</li>
<li>Ticaret sicil numarası, vergi kimlik numarası ve kurum hesabına ait IBAN bilgilerini doğru ve güncel beyan etmek;</li>
<li>6563 sayılı Kanun m.3 uyarınca hizmet sağlayıcı olarak tanıtıcı bilgileri (unvan, MERSİS no, iletişim) eksiksiz sunmak;</li>
<li>Sunulan ürün/hizmetlerin yürürlükteki mevzuata, kamu düzenine ve ahlaka aykırı olmaması;</li>
<li>Bağış oranı taahhüdünün açık, ölçülebilir ve gerçekçi olması.</li>
</ul>
<p>hangel, ticaret sicil, vergi ve IBAN bilgilerinin doğruluğunu denetleme hakkını saklı tutar; gerçeğe aykırı beyan üyeliğin reddi/feshi sebebidir.</p>

<h4>4. Tarafların Hak ve Yükümlülükleri</h4>
<p><strong>Marka Üye'nin yükümlülükleri:</strong></p>
<ul>
<li>Ürün ve fiyat bilgilerini 6502 sayılı TKHK ve Mesafeli Sözleşmeler Yönetmeliği'ne uygun, doğru ve yanıltıcı olmayacak biçimde sunmak;</li>
<li>6563 sayılı Kanun m.6 uyarınca ticari elektronik iletileri yalnızca alıcının önceden onayı ile ve İYS (İleti Yönetim Sistemi) kayıtlı olarak göndermek;</li>
<li>Taahhüt ettiği bağış oranını eksiksiz aktarmak ve aylık mutabakata uymak;</li>
<li>Tüketici haklarına, ayıplı mal/hizmet ve cayma hükümlerine riayet etmek;</li>
<li>Fikri mülkiyet, vergi ve faturalandırma yükümlülüklerini yerine getirmek.</li>
</ul>
<p><strong>hangel'in yükümlülükleri:</strong></p>
<ul>
<li>Ürün vitrini ve affiliate altyapısını sürekliliğe özen göstererek sunmak;</li>
<li>Bağış aktarımlarını izlenebilir ve mutabık tutmak;</li>
<li>Marka Üye verilerini KVKK'ya uygun korumak.</li>
</ul>

<h4>5. Ücretlendirme, Komisyon ve Bağış Aktarımı</h4>
<p>Platform üzerinden gerçekleşen satışlarda, Marka Üye'nin taahhüt ettiği bağış oranı ilgili bağış kategorisine aktarılır. hangel, hizmet/altyapı bedeli olarak önceden açıkça bildirdiği bir komisyon uygulayabilir; bu komisyon, bağışa aktarılan tutarı azaltacak biçimde gizlenemez ve şeffaf biçimde gösterilir. Aktarım akışı şu şekildedir:</p>

<table class="w-full border-collapse border border-gray-200 my-4">
<thead>
<tr>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Aşama</th>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">İşlem</th>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Sorumlu</th>
</tr>
</thead>
<tbody>
<tr>
<td class="border border-gray-200 p-2 text-sm">1. Satış</td>
<td class="border border-gray-200 p-2 text-sm">Tüketici ürünü satın alır, bedel tahsil edilir</td>
<td class="border border-gray-200 p-2 text-sm">Marka Üye / ödeme kuruluşu</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">2. Bağış payı ayrımı</td>
<td class="border border-gray-200 p-2 text-sm">Taahhüt edilen oran hesaplanır ve ayrılır</td>
<td class="border border-gray-200 p-2 text-sm">hangel + Marka Üye</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">3. Aktarım</td>
<td class="border border-gray-200 p-2 text-sm">Bağış payı ilgili amaç/kuruma aktarılır</td>
<td class="border border-gray-200 p-2 text-sm">hangel</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">4. Mutabakat</td>
<td class="border border-gray-200 p-2 text-sm">Aylık mutabakat raporu paylaşılır</td>
<td class="border border-gray-200 p-2 text-sm">hangel</td>
</tr>
</tbody>
</table>

<h4>6. Fikri Mülkiyet Hakları</h4>
<p>Marka Üye'nin marka, logo ve ürün içerikleri kendisine aittir; Marka Üye, bu içerikleri platformda sergileme yönünde hangel'e sınırlı, münhasır olmayan, devredilemez bir lisans verir. hangel'in platform yazılımı ve tasarımı üzerindeki hakları saklıdır. Marka Üye, üçüncü kişilerin fikri mülkiyet haklarını ihlal eden içerik yüklememeyi taahhüt eder; aksi halde doğacak tüm sorumluluk Marka Üye'ye aittir.</p>

<h4>7. Sorumluluğun Sınırlandırılması ve Sorumsuzluk</h4>
<p>hangel, Marka Üye ile tüketici arasındaki satış ilişkisinde 6563 sayılı Kanun anlamında <em>aracı hizmet sağlayıcı</em> konumundadır; ürün/hizmetin ayıbından, teslimattan veya ticari taahhütlerin ifasından doğrudan sorumlu değildir. Platformdaki <strong>acil kan talebi ve eşleştirme</strong> gibi sağlık aracılığı işlevlerinde hangel yalnızca teknik aracılık sağlar, tıbbi tavsiye vermez ve tıbbi sonuçlardan sorumlu tutulamaz. hangel'in sorumluluğu, emredici hükümler saklı kalmak kaydıyla ağır kusur ve kasıt halleriyle sınırlıdır.</p>

<h4>8. Kişisel Verilerin Korunması</h4>
<p>Taraflar, platformda işlenen kişisel verileri 6698 sayılı KVKK'ya uygun işler. Marka Üye, eriştiği müşteri/bağışçı verilerini KVKK m.4 ilkeleri ve m.5 işleme şartları çerçevesinde, amaçla sınırlı kullanır; aydınlatma yükümlülüğünü (m.10) yerine getirir ve ilgili kişi haklarına (m.11) uyar. Pazarlama amaçlı işlemeler ve ticari iletiler bakımından KVKK m.5 ile 6563 sayılı Kanun m.6'daki açık rıza/onay şartlarına birlikte uyulur. Yurt dışı aktarımlar KVKK m.9 çerçevesinde gerçekleştirilir. Başvurular için <a href="mailto:kvkk@hangel.org">kvkk@hangel.org</a>.</p>

<h4>9. Mücbir Sebep</h4>
<p>Doğal afet, salgın, savaş, siber saldırı, ödeme altyapısı kesintileri, mevzuat değişikliği ve tarafların makul kontrolü dışındaki olaylar mücbir sebep sayılır ve süresince yükümlülüklerin ifası askıya alınır.</p>

<h4>10. Fesih ve Askıya Alma</h4>
<p>Taraflardan her biri 30 gün önceden yazılı bildirimle Sözleşmeyi feshedebilir. Gerçeğe aykırı ticaret sicil/vergi/IBAN beyanı, bağış oranı taahhüdünün ihlali, tüketici mevzuatına aykırı uygulamalar veya mevzuata aykırı ürün satışı hallerinde hangel üyeliği derhal askıya alabilir ve haklı sebeple feshedebilir. Fesih anında ayrılmış ancak aktarılmamış bağış payları ilgili amaca aktarılır.</p>

<h4>11. Uygulanacak Hukuk ve Yetkili Mahkeme</h4>
<p>Bu Sözleşme Türkiye Cumhuriyeti hukukuna tabidir. Uyuşmazlıklarda İstanbul (Çağlayan) Mahkemeleri ve İcra Daireleri yetkilidir. Tüketici uyuşmazlıklarında 6502 sayılı Kanun'un yetki ve tüketici hakem heyeti hükümleri saklıdır.</p>

<h4>12. Tebligat, Değişiklik ve Yürürlük</h4>
<p>Bildirilen e-posta adresleri ve platform içi bildirimler geçerli tebligat sayılır. hangel, mevzuat ve hizmet gelişimine bağlı olarak Sözleşmeyi güncelleyebilir; esaslı değişiklikler en az 30 gün önceden bildirilir. Sözleşme, Marka Üye'nin elektronik onayı ile yürürlüğe girer.</p>

<p class="text-xs text-muted-foreground"><em>Bu metin bilgilendirme amaçlıdır ve bağlayıcı nihai hukuki görüş niteliği taşımaz; yürürlük öncesi yetkili hukuk danışmanlığı önerilir.</em></p>
    `
  },
  {
    slug: 'affiliate-politikasi',
    title: 'Bağış ve Affiliate Politikası',
    content: `
      <h3>Bağış ve Affiliate Politikası</h3>

<p>İşbu Bağış ve Affiliate Politikası ("Politika"), hangel platformunu işleten <strong>hangel AŞ</strong> tarafından, platform üzerinde yürütülen affiliate (bağış aktarımlı satış ortaklığı) faaliyetlerinin, izleme (tracking) teknolojilerinin ve bağış oranı taahhütlerinin esaslarını belirlemek amacıyla hazırlanmıştır. Politika, hem Türkiye mevzuatına hem de Avrupa Birliği veri koruma ve elektronik gizlilik kurallarına uyumu gözetir. Bu metnin esas dili Türkçedir; uluslararası mevzuata atıflar yabancı ifadeler içerebilir.</p>

<h4>1. Amaç ve Kapsam</h4>
<p>Politikanın amacı; affiliate ortakları, marka üyeleri ve bağışçılar arasındaki ilişkide kullanılan affiliate kimliği (ID), izleme bağlantıları (tracking link), izleme pikselleri ve çerezlerin hukuka uygun kullanımını, bağış oranı taahhütlerinin yerine getirilmesini ve aylık mutabakat ile denetim süreçlerini düzenlemektir. Kapsam, hangel üzerinden gerçekleşen tüm affiliate yönlendirmelerini ve bunlara bağlı bağış aktarımlarını içerir.</p>

<h4>2. Yasal Dayanak</h4>
<ul>
<li><strong>6563 sayılı Elektronik Ticaretin Düzenlenmesi Hakkında Kanun</strong> — aracı hizmet sağlayıcı yükümlülükleri, m.3 (bilgi verme) ve m.6 (ticari elektronik ileti onayı);</li>
<li><strong>6698 sayılı KVKK m.5</strong> — kişisel verilerin işlenme şartları, özellikle açık rıza ve meşru menfaat dengesi;</li>
<li><strong>GDPR (EU) 2016/679 Art.6</strong> — işlemenin hukuka uygunluğu (özellikle Art.6(1)(a) rıza ve Art.6(1)(f) meşru menfaat);</li>
<li><strong>ePrivacy Directive 2002/58/EC Art.5(3)</strong> — kullanıcı cihazına çerez/piksel yerleştirilmesi veya bilgiye erişim için önceden bilgilendirilmiş rıza şartı.</li>
</ul>

<h4>3. Affiliate Kimliği ve İzleme Bağlantıları</h4>
<p>Her affiliate ortağına benzersiz bir affiliate kimliği (ID) atanır. Bu kimlik, ortağın yönlendirdiği ziyaretçi ve gerçekleşen işlemleri ilişkilendirmek için izleme bağlantılarına gömülür. İzleme bağlantıları yalnızca bağış payının doğru ortağa atfedilmesi ve mutabakatın sağlanması amacıyla kullanılır. Affiliate ortakları, yönlendirme yaparken yanıltıcı, spam niteliğinde veya mevzuata aykırı yöntemler kullanamaz; aksi halde affiliate kimliği askıya alınır.</p>

<h4>4. İzleme Pikseli, Çerezler ve Rıza Yönetimi</h4>
<p>Affiliate yönlendirmelerinin doğrulanması için izleme pikselleri ve çerezler kullanılabilir. Bu teknolojiler, kullanıcının cihazında bilgi saklandığı veya bilgiye erişildiği için:</p>
<ul>
<li><strong>AB/AEA kullanıcıları</strong> bakımından, ePrivacy Directive 2002/58/EC Art.5(3) ve GDPR Art.6(1)(a) uyarınca, kesinlikle gerekli olmayan (zorunlu olmayan) çerez/piksel yerleştirilmeden <em>önce</em> kullanıcının açık, özgür ve bilgilendirilmiş <strong>rızası</strong> alınır; rıza geri çekilebilir;</li>
<li><strong>Türkiye'deki kullanıcılar</strong> bakımından, 6698 sayılı KVKK m.5 çerçevesinde; pazarlama/izleme amaçlı çerezlerde açık rıza esas alınır, yalnızca hizmetin işleyişi için zorunlu çerezler rıza gerektirmeyebilir;</li>
<li>Kullanıcıya, çerez tercih merkezi üzerinden kategori bazında onay verme, reddetme ve sonradan değiştirme imkânı tanınır.</li>
</ul>
<p>İzleme amaçlı çerez ve piksellerle ilgili ayrıntılar ayrı bir Çerez Politikası'nda da açıklanır ve bu Politika ile birlikte uygulanır.</p>

<table class="w-full border-collapse border border-gray-200 my-4">
<thead>
<tr>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Teknoloji</th>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Amaç</th>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Hukuki Dayanak</th>
</tr>
</thead>
<tbody>
<tr>
<td class="border border-gray-200 p-2 text-sm">Affiliate çerezi (atıf)</td>
<td class="border border-gray-200 p-2 text-sm">Yönlendirmenin doğru ortağa atfı</td>
<td class="border border-gray-200 p-2 text-sm">Rıza — KVKK m.5 / GDPR Art.6(1)(a) / ePrivacy Art.5(3)</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">İzleme pikseli (dönüşüm)</td>
<td class="border border-gray-200 p-2 text-sm">Satış/bağış dönüşümünün ölçümü</td>
<td class="border border-gray-200 p-2 text-sm">Rıza — KVKK m.5 / GDPR Art.6(1)(a) / ePrivacy Art.5(3)</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Zorunlu oturum çerezi</td>
<td class="border border-gray-200 p-2 text-sm">Hizmetin teknik işleyişi</td>
<td class="border border-gray-200 p-2 text-sm">Meşru menfaat / hizmetin sunumu — GDPR Art.6(1)(f)</td>
</tr>
</tbody>
</table>

<h4>5. Bağış Oranı Taahhüdü</h4>
<p>Affiliate ortakları ve marka üyeleri, her ürün/kategori için bağışa aktarılacak oranı açık ve gerçekçi biçimde taahhüt eder. Taahhüt edilen oran, kullanıcılara yanıltıcı olmayacak şekilde gösterilir. Bağış payı, satışın tamamlanması ve cayma/iade sürelerinin geçmesinin ardından kesinleşir. hangel, bağış oranlarının taahhüde uygunluğunu izler.</p>

<h4>6. Aylık Mutabakat ve Aktarım</h4>
<p>Affiliate yönlendirmelerinden doğan bağış payları aylık dönemler hâlinde mutabık tutulur. Her dönem sonunda; yönlendirme sayısı, gerçekleşen işlemler, hesaplanan bağış payı ve aktarılan tutarı gösteren mutabakat raporu ilgili taraflarla paylaşılır. İtiraz halinde, raporun paylaşımından itibaren 15 gün içinde gerekçeli başvuru yapılabilir.</p>

<h4>7. Denetim ve İade</h4>
<p>hangel, affiliate işlemlerinin gerçekliğini denetleme hakkını saklı tutar. Sahte yönlendirme, hileli işlem veya bağış payını manipüle eden uygulama tespit edilirse, ilgili tutarlar geri alınır ve affiliate kimliği askıya alınabilir. Tüketicinin cayma hakkını kullanması veya işlemin iade edilmesi halinde, ilgili bağış payı düzeltilir. İade ve düzeltmeler bir sonraki mutabakat döneminde dengelenir.</p>

<h4>8. Yurt Dışı Aktarım ve Altyapı</h4>
<p>Affiliate izleme ve mutabakat verileri, hangel'in kullandığı bulut altyapısı (Google Cloud / Firebase) ve ilgili hizmet sağlayıcılar üzerinde işlenebilir. Türkiye'deki kullanıcılar bakımından yurt dışına yapılan aktarımlar 6698 sayılı KVKK m.9 ve Kişisel Verilerin Yurt Dışına Aktarılmasına ilişkin güncel düzenlemeler (2024 değişikliği) çerçevesinde; gerekli güvenceler veya standart sözleşme/uygun korumalar sağlanarak gerçekleştirilir. AB/AEA kullanıcıları bakımından, üçüncü ülkelere aktarımlarda GDPR Art.44–49 hükümleri (özellikle Art.46 uygun güvenceler ve standart sözleşme maddeleri) uygulanır. İzleme/atıf verisi, amacın gerektirdiği süreyle sınırlı saklanır ve sürenin sonunda silinir veya anonim hâle getirilir.</p>

<h4>9. Yanıltıcı Tanıtım Yasağı ve Şeffaflık</h4>
<p>Affiliate ortakları ve marka üyeleri; yönlendirme ve tanıtımlarında 6563 sayılı Kanun m.3'teki bilgilendirme yükümlülüğüne uyar, tanıtımın <em>ticari/affiliate niteliğini</em> açıkça belirtir ve gizli reklam yapamaz. Bağışa aktarılacak oran, kesintiler ve komisyon yapısı tüketiciye yanıltıcı olmayacak biçimde gösterilir. Aldatıcı, abartılı ya da doğrulanamayan etki iddiaları (örneğin gerçekleşmemiş bağış tutarının gerçekleşmiş gibi sunulması) yasaktır. hangel, bu kurallara aykırı tanıtımları kaldırma ve ilgili affiliate kimliğini askıya alma hakkını saklı tutar.</p>

<h4>10. Veri Sahibi Hakları ve Başvuru</h4>
<p>Türkiye'deki kullanıcılar KVKK m.11 kapsamındaki haklarını (bilgi talebi, düzeltme, silme, işlemeye itiraz vb.) <a href="mailto:kvkk@hangel.org">kvkk@hangel.org</a> üzerinden; AB/uluslararası kullanıcılar GDPR Art.12–22 kapsamındaki haklarını (erişim, düzeltme, silme/unutulma, işlemeye itiraz, taşınabilirlik) <a href="mailto:privacy@hangel.org">privacy@hangel.org</a> veya <a href="mailto:dpo@hangel.org">dpo@hangel.org</a> üzerinden kullanabilir. Veri sahipleri, rızalarını dilediği zaman ve verdikleri kadar kolay biçimde geri çekebilir; geri çekme, geri çekme anına kadarki işlemenin hukuka uygunluğunu etkilemez. İlgili kişi, GDPR Art.77 ve KVKK kapsamında yetkili denetim makamına da şikâyette bulunabilir.</p>

<h4>11. Değişiklik ve Yürürlük</h4>
<p>hangel, mevzuat değişikliği ve hizmet gelişimi gerektirdiğinde bu Politikayı güncelleyebilir; esaslı değişiklikler önceden duyurulur. Politika, yayımlandığı tarihte yürürlüğe girer ve affiliate ortaklarının/marka üyelerinin platformu kullanmaya devam etmesiyle kabul edilmiş sayılır.</p>

<p class="text-xs text-muted-foreground"><em>Bu metin bilgilendirme amaçlıdır ve bağlayıcı nihai hukuki görüş niteliği taşımaz; yürürlük öncesi yetkili hukuk danışmanlığı önerilir.</em></p>
    `
  },
  {
    slug: 'ogrenci-kulup',
    title: 'Öğrenci Kulüp Sözleşmesi',
    content: `
      <h3>Öğrenci Kulüp Sözleşmesi</h3>

<p>İşbu Öğrenci Kulüp Sözleşmesi ("Sözleşme"), Türkiye'de yerleşik toplumsal etki platformu hangel'i işleten <strong>hangel AŞ</strong> ile, bir üniversite ya da lise bünyesinde faaliyet gösteren öğrenci kulübü/topluluğu ("Kulüp") arasındaki ilişkinin hukuki çerçevesini belirler. Sözleşme; Kulübün hangel üzerinde profil oluşturması, gönüllülük ve bağış/yardım kampanyası yürütmesi ve etkinlik duyurusu yapmasına ilişkin tarafların hak ve yükümlülüklerini, bağlı kurum onayı ile sorumluluk sınırlarını düzenler. Bu metnin esas dili Türkçedir.</p>

<h4>1. Taraflar ve Tanımlar</h4>
<p>Sözleşme; <strong>hangel AŞ</strong> ("Platform" veya "hangel") ile bağlı bulunduğu eğitim kurumunun ilgili yönerge/mevzuatı çerçevesinde kurulmuş <strong>Kulüp</strong> arasında akdedilmiştir.</p>
<ul>
<li><strong>Kulüp:</strong> Bir üniversite öğrenci topluluğu/kulübü (YÖK ve ilgili üniversite öğrenci toplulukları yönergeleri kapsamında) veya bir lise öğrenci kulübü (MEB öğrenci kulüpleri mevzuatı kapsamında).</li>
<li><strong>Bağlı Kurum:</strong> Kulübün faaliyet gösterdiği üniversite/okul ve onay merciı (örneğin Sağlık Kültür ve Spor Daire Başkanlığı, öğrenci kulüpleri koordinasyon kurulu, okul müdürlüğü).</li>
<li><strong>Danışman:</strong> Kulüp faaliyetlerinden bağlı kurum adına sorumlu öğretim elemanı veya öğretmen.</li>
<li><strong>Kulüp Temsilcisi:</strong> Kulüp adına işlem yapmaya yetkili öğrenci (başkan/yönetim kurulu üyesi).</li>
</ul>

<h4>2. Sözleşmenin Konusu ve Kapsamı</h4>
<p>Sözleşmenin konusu, Kulübün hangel platformu üzerinde varlık oluşturarak gönüllülük, sosyal sorumluluk ve yardım kampanyası faaliyetlerini yürütmesinin koşullarının belirlenmesidir. Kulüp, tüm faaliyetlerini bağlı kurumunun ilgili yönerge/mevzuatına ve yürürlükteki ulusal mevzuata uygun yürütmeyi taahhüt eder. Kulübün tüzel kişiliği bulunmadığından, platform üzerindeki faaliyetler bağlı kurumun onayına ve gözetimine tabidir.</p>

<h4>3. Üyelik ve Onay Koşulları</h4>
<p>Kulüp üyeliğinin geçerli biçimde tesisi için:</p>
<ul>
<li>Kulübün, bağlı kurumun ilgili yönergesi (üniversiteler için YÖK çerçevesindeki öğrenci toplulukları yönergesi; liseler için MEB öğrenci kulüpleri yönetmeliği) uyarınca usulüne uygun kurulmuş olması;</li>
<li>Platform üzerindeki faaliyetler için <strong>bağlı kurumun ve danışmanın yazılı onayının</strong> alınmış olması;</li>
<li>Kulüp Temsilcisinin yetkisini gösteren belge ile başvurması;</li>
<li>Yürütülecek herhangi bir yardım toplama faaliyeti için 2860 sayılı Yardım Toplama Kanunu uyarınca gerekli izinlerin (m.6, m.7 — vali/kaymakam izni) bağlı kurum aracılığıyla veya muafiyet kapsamında sağlanmış olması.</li>
</ul>

<h4>4. Tarafların Hak ve Yükümlülükleri</h4>
<p><strong>Kulübün yükümlülükleri:</strong></p>
<ul>
<li>Tüm faaliyetlerini bağlı kurumun yönerge/mevzuatına ve danışman gözetimine uygun yürütmek;</li>
<li>Yardım toplama faaliyetlerinde 2860 sayılı Kanun'a kesinlikle uymak, izinsiz yardım toplamamak;</li>
<li>Etkinliklerde gerekli izin ve sigortaları bağlı kurum aracılığıyla temin etmek;</li>
<li>Platformda doğru, güncel ve yanıltıcı olmayan bilgi paylaşmak;</li>
<li>Üye ve gönüllü verilerini 6698 sayılı KVKK'ya uygun işlemek.</li>
</ul>
<p><strong>hangel'in yükümlülükleri:</strong></p>
<ul>
<li>Platform altyapısını özen ve süreklilikle sunmak;</li>
<li>Toplanan bağışları, izinli ve doğrulanmış hesaba/bağlı kurum hesabına izlenebilir biçimde aktarmak;</li>
<li>Kulüp ve üye verilerini mevzuata uygun korumak.</li>
</ul>

<h4>5. Etkinlik İzinleri ve Sigorta</h4>
<p>Kulübün düzenleyeceği etkinlikler, bağlı kurumun izin ve gözetim süreçlerine tabidir. Etkinlik öncesinde gerekli mekân tahsisi, güvenlik ve sigorta tedbirleri Kulüp tarafından bağlı kurum aracılığıyla sağlanır. hangel, etkinliklerin fiziksel organizasyonundan, güvenliğinden veya katılımcıların uğrayabileceği zararlardan sorumlu değildir; bu sorumluluk Kulüp ve bağlı kuruma aittir.</p>

<h4>6. Bağış/Yardım Aktarımı</h4>
<p>Platform üzerinden toplanan yardımlar, yalnızca 2860 sayılı Kanun kapsamında izinli veya muaf faaliyetler için, bağlı kurumun veya yetkilendirilmiş hesabın doğrulanmasının ardından aktarılır. Aktarımlar izlenebilir tutulur ve dönemsel mutabakat sağlanır. Kulüp, topladığı yardımı beyan ettiği amaca tahsis etmeyi ve kötüye kullanmamayı taahhüt eder.</p>

<table class="w-full border-collapse border border-gray-200 my-4">
<thead>
<tr>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Konu</th>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Sorumlu</th>
<th class="border border-gray-200 p-2 text-left text-sm" scope="col">Dayanak</th>
</tr>
</thead>
<tbody>
<tr>
<td class="border border-gray-200 p-2 text-sm">Kulüp kuruluşu/onayı</td>
<td class="border border-gray-200 p-2 text-sm">Bağlı kurum + danışman</td>
<td class="border border-gray-200 p-2 text-sm">YÖK / MEB öğrenci kulüpleri mevzuatı</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Yardım toplama izni</td>
<td class="border border-gray-200 p-2 text-sm">Kulüp + bağlı kurum</td>
<td class="border border-gray-200 p-2 text-sm">2860 sayılı Kanun m.6, m.7</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Etkinlik izni/sigorta</td>
<td class="border border-gray-200 p-2 text-sm">Kulüp + bağlı kurum</td>
<td class="border border-gray-200 p-2 text-sm">Bağlı kurum yönergesi</td>
</tr>
<tr>
<td class="border border-gray-200 p-2 text-sm">Fon aktarımı/mutabakat</td>
<td class="border border-gray-200 p-2 text-sm">hangel</td>
<td class="border border-gray-200 p-2 text-sm">Emanet/izlenebilirlik ilkeleri</td>
</tr>
</tbody>
</table>

<h4>7. Fikri Mülkiyet Hakları</h4>
<p>Kulübün ve bağlı kurumun logo, ad ve içerikleri kendilerine aittir; Kulüp, bunları platformda sergileme yönünde hangel'e sınırlı ve münhasır olmayan bir lisans verir. hangel platform yazılımı üzerindeki haklarını saklı tutar. Bağlı kurumun ad/amblem kullanımına ilişkin kuralları saklıdır.</p>

<h4>8. Sorumluluğun Sınırlandırılması ve Sorumsuzluk</h4>
<p>hangel, Kulüp faaliyetlerinde teknik aracı konumundadır; etkinliklerin yürütülmesi, fon kullanımı veya katılımcı güvenliğinden doğrudan sorumlu değildir. Platformdaki <strong>acil kan talebi ve eşleştirme</strong> işlevlerinde hangel yalnızca teknik aracılık sağlar; tıbbi tavsiye vermez, tıbbi uygunluk ve nakil süreçleri yetkili sağlık kuruluşlarının sorumluluğundadır ve bu süreçlerden doğan zararlardan hangel sorumlu tutulamaz. hangel'in sorumluluğu, emredici hükümler saklı kalmak kaydıyla ağır kusur ve kasıt halleriyle sınırlıdır. Reşit olmayan (18 yaş altı) lise öğrencilerinin katılımında veli/vasi rızası ve bağlı kurum gözetimi esastır.</p>

<h4>9. Kişisel Verilerin Korunması</h4>
<p>Taraflar, platformda işlenen kişisel verileri 6698 sayılı KVKK'ya uygun işler. Reşit olmayan öğrencilerin verileri özel bir hassasiyetle, veli/vasi rızası gözetilerek ve KVKK m.4 ilkeleri çerçevesinde işlenir. Kan grubu gibi özel nitelikli sağlık verileri KVKK m.6 uyarınca yalnızca açık rıza veya kanunun öngördüğü şartlarla işlenir. Aydınlatma (m.10) ve ilgili kişi hakları (m.11) saklıdır. Başvurular için <a href="mailto:kvkk@hangel.org">kvkk@hangel.org</a>.</p>

<h4>10. Mücbir Sebep</h4>
<p>Doğal afet, salgın, eğitim kurumlarının kapanması, kamu otoritesi kararları ve tarafların makul kontrolü dışındaki olaylar mücbir sebep sayılır; süresince yükümlülüklerin ifası askıya alınır.</p>

<h4>11. Fesih ve Askıya Alma</h4>
<p>Taraflardan her biri 30 gün önceden yazılı bildirimle Sözleşmeyi feshedebilir. Bağlı kurum onayının kalkması, izinsiz yardım toplama, mevzuata aykırı etkinlik veya gerçeğe aykırı beyan hallerinde hangel üyeliği derhal askıya alabilir ve haklı sebeple feshedebilir. Fesih halinde toplanmış ancak aktarılmamış yardımlar, bağlı kurumun veya yetkili merciinin doğrulanmış hesabına aktarılır.</p>

<h4>12. Uygulanacak Hukuk, Yetkili Mahkeme ve Yürürlük</h4>
<p>Bu Sözleşme Türkiye Cumhuriyeti hukukuna tabidir; uyuşmazlıklarda İstanbul (Çağlayan) Mahkemeleri ve İcra Daireleri yetkilidir. Bildirilen e-posta adresleri ve platform içi bildirimler geçerli tebligat sayılır. hangel, mevzuat ve hizmet gelişimine bağlı olarak Sözleşmeyi güncelleyebilir; esaslı değişiklikler en az 30 gün önceden bildirilir. Sözleşme, Kulüp Temsilcisinin elektronik onayı ve bağlı kurum onayının teyidi ile yürürlüğe girer.</p>

<p class="text-xs text-muted-foreground"><em>Bu metin bilgilendirme amaçlıdır ve bağlayıcı nihai hukuki görüş niteliği taşımaz; yürürlük öncesi yetkili hukuk danışmanlığı önerilir.</em></p>
    `
  }
];
