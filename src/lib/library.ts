import { BookCopy, BookOpen, Building, Film, GraduationCap, HeartHandshake, FileText } from 'lucide-react';

export interface LibraryItem {
  slug: string;
  title: string;
  content: string;
}

export interface LibrarySection {
  slug: string;
  title: string;
  description: string;
  icon: React.ElementType;
  items: LibraryItem[];
}

export const librarySections: LibrarySection[] = [
    {
        slug: 'sosyal-etki-raporlari',
        title: "Sosyal Etki Raporları",
        description: "Hangel'in ve paydaşlarının yarattığı etkiyi inceleyin.",
        icon: FileText,
        items: Array.from({ length: 21 }, (_, i) => ({
            slug: `etki-raporu-202${3 - (i % 3)}-${['cevre', 'egitim', 'genel'][i%3]}-${i + 1}`,
            title: `202${3 - (i % 3)} Yılı ${['Çevre', 'Eğitim', 'Genel'][i%3]} Etki Raporu #${i + 1}`,
            content: `<h4>Özet</h4><p>Bu rapor, 202${3 - (i % 3)} yılı içerisinde ${['çevre koruma', 'eğitimde fırsat eşitliği', 'genel toplumsal kalkınma'][i%3]} alanında yürütülen projelerin, yapılan bağışların ve gönüllülük faaliyetlerinin yarattığı sosyal etkiyi kapsamlı bir şekilde analiz etmektedir.</p><h4>Temel Bulgular</h4><ul><li>Toplam <strong>${(i+1)*12345}₺</strong> bağış toplandı.</li><li><strong>${(i+1)*50} saat</strong> gönüllülük faaliyeti gerçekleştirildi.</li><li><strong>${(i+1)*100} kişiye</strong> doğrudan ulaşıldı.</li></ul><p>Raporun tamamı, metodoloji ve detaylı proje çıktıları hakkında bilgi içermektedir.</p>`
        }))
    },
    {
        slug: 'gonulluluk-rehberleri',
        title: "Gönüllülük Rehberleri",
        description: "Gönüllülük yolculuğunuzda size yardımcı olacak kaynaklar.",
        icon: HeartHandshake,
        items: Array.from({ length: 21 }, (_, i) => {
            const titles = ['Etkili Gönüllülük İçin 5 Adım', 'Gönüllülükte Motivasyonunu Koruma', 'Doğru STK\'yı Nasıl Seçersin?'];
            const contents = [
                '<h4>1. İlgi Alanlarını Belirle</h4><p>Hangi alanda (çevre, eğitim, hayvan hakları vb.) etki yaratmak istediğini düşün.</p><h4>2. Zamanını Planla</h4><p>Ne kadar süre ayırabileceğini gerçekçi bir şekilde değerlendir.</p><h4>3. Araştırma Yap</h4><p>İlgili alanda çalışan STK\'ları ve projelerini incele.</p><h4>4. Başvur ve İletişime Geç</h4><p>Kendini ve motivasyonunu iyi ifade eden bir başvuru yap.</p><h4>5. Geri Bildirimde Bulun</h4><p>Deneyimlerini hem STK ile hem de çevrenle paylaşarak daha fazla insana ilham ver.</p>',
                '<h4>1. Neden Başladığını Hatırla</h4><p>Gönüllülüğe başlarkenki ilk motivasyonunu ve hedeflerini kendine hatırlat.</p><h4>2. Küçük Başarıları Kutla</h4><p>Yarattığın etkinin her adımını fark et ve kendini takdir et.</p><h4>3. Toplulukla Bağlantıda Kal</h4><p>Diğer gönüllülerle deneyimlerini paylaşmak motivasyonunu artıracaktır.</p>',
                '<h4>1. Şeffaflığı Kontrol Et</h4><p>STK\'nın web sitesini, faaliyet ve raporlarını incele. Hangel üzerindeki şeffaflık puanı iyi bir göstergedir.</p><h4>2. Misyon ve Vizyonunu Anla</h4><p>Kuruluşun amacı ve değerleri senin kendi değerlerinle örtüşüyor mu?</p><h4>3. Gönüllü Yorumlarını Oku</h4><p>Daha önce o STK\'da gönüllülük yapmış kişilerin deneyimlerini araştır.</p>'
            ];
            return {
                slug: `gonulluluk-rehberi-${i + 1}`,
                title: `${titles[i % titles.length]} #${Math.floor(i / titles.length) + 1}`,
                content: contents[i % contents.length]
            }
        })
    },
    {
        slug: 'stklar-icin-kaynaklar',
        title: "STK'lar için Kaynaklar",
        description: "STK'ların kapasitelerini geliştirmelerine yönelik kılavuzlar.",
        icon: Building,
        items: Array.from({ length: 21 }, (_, i) => {
            const titles = ['Dijital Kaynak Geliştirme Yöntemleri', 'Etkili Gönüllü Yönetimi El Kitabı', 'Sosyal Medyada Görünürlüğü Artırma'];
            const contents = [
                '<h4>Online Bağış Kampanyaları</h4><p>Özel günler ve acil durumlar için hedef odaklı dijital kampanyalar oluşturun. Sosyal medya ve e-posta bültenlerini aktif kullanın.</p><h4>Kurumsal İşbirlikleri</h4><p>Hangel gibi platformlar aracılığıyla sosyal sorumlu markalarla ortak projeler geliştirin.</p>',
                '<h4>Net Görev Tanımları</h4><p>Gönüllüler için net ve anlaşılır görev tanımları oluşturun. Beklentileri en baştan doğru belirleyin.</p><h4>Oryantasyon ve Eğitim</h4><p>Gönüllülerinize kurum kültürü, hedefler ve görevleri hakkında kapsamlı bir başlangıç eğitimi sunun.</p><h4>Takdir ve Geri Bildirim</h4><p>Gönüllülerin çabalarını düzenli olarak takdir edin ve onlara yapıcı geri bildirimlerde bulunun.</p>',
                '<h4>Hedef Kitlenizi Tanıyın</h4><p>Hangi sosyal medya platformunun sizin hedef kitlenize daha uygun olduğunu belirleyin.</p><h4>Görsel İçeriğe Önem Verin</h4><p>Etkinliklerinizden yüksek kaliteli fotoğraflar ve videolar paylaşın. Etkinizin gücünü görsel olarak anlatın.</p><h4>Etkileşimi Artırın</h4><p>Takipçilerinizin yorumlarına ve mesajlarına yanıt verin, onlara sorular sorarak etkileşimi teşvik edin.</p>'
            ];
            return {
                slug: `stk-kaynak-${i + 1}`,
                title: `${titles[i % titles.length]} #${Math.floor(i / titles.length) + 1}`,
                content: contents[i % contents.length]
            }
        })
    },
    {
        slug: 'kitaplar',
        title: "Kitaplar",
        description: "Sosyal etki ve sivil toplum alanında ilham veren kitaplar.",
        icon: BookCopy,
        items: Array.from({ length: 21 }, (_, i) => {
            const titles = ["Sapiens: Hayvanlardan Tanrılara", "Etkili İnsanların 7 Alışkanlığı", "Dürtme: Sağlık, Zenginlik ve Mutlulukla İlgili Kararları Uygulamak"];
            const contents = [
                '<h5>Yuval Noah Harari</h5><p>İnsan türünün tarihini ve gelişimini, büyük resmi görerek anlatan, toplumların nasıl organize olduğu ve inanç sistemlerinin nasıl çalıştığı üzerine ufuk açıcı bir eser.</p>',
                '<h5>Stephen R. Covey</h5><p>Kişisel ve profesyonel etkinlik için temel prensipleri sunan bu klasik, sosyal etki yaratmak isteyen bireyler için proaktif olma ve sinerji yaratma gibi konularda değerli dersler içerir.</p>',
                '<h5>Richard H. Thaler & Cass R. Sunstein</h5><p>İnsanların daha iyi kararlar almalarını sağlamak için "dürtme" kavramını tanıtan bu kitap, sosyal programlar ve kampanyalar tasarlarken davranışsal ekonomiden nasıl yararlanılabileceğini gösteriyor.</p>'
            ];
            return {
                slug: `kitap-${i+1}`,
                title: `${titles[i % titles.length]}`,
                content: contents[i % contents.length]
            }
        })
    },
    {
        slug: 'filmler',
        title: "Filmler",
        description: "Toplumsal konulara değinen ve ilham veren kurmaca filmler.",
        icon: Film,
        items: Array.from({ length: 21 }, (_, i) => {
            const titles = ["Captain Fantastic (2016)", "The Boy Who Harnessed the Wind (2019)", "Erin Brockovich (2000)"];
            const contents = [
                '<h5>Viggo Mortensen</h5><p>Modern toplumdan izole bir şekilde 6 çocuğunu yetiştiren bir babanın hikayesi. Tüketim kültürü, eğitim sistemi ve modern yaşam üzerine bir eleştiri.</p>',
                '<h5>Chiwetel Ejiofor</h5><p>Kuraklıkla boğuşan köyünü kurtarmak için rüzgar türbini inşa eden Malavili bir gencin gerçek hikayesi. Azim, eğitim ve toplumsal değişim.</p>',
                '<h5>Julia Roberts</h5><p>Bir şirketin neden olduğu çevre kirliliğine karşı tek başına hukuk mücadelesi veren bir kadının gerçek hikayesi. Adalet, sivil aktivizm ve kararlılık.</p>'
            ];
            return {
                slug: `film-${i+1}`,
                title: `${titles[i % titles.length]}`,
                content: contents[i % contents.length]
            }
        })
    },
    {
        slug: 'belgeseller',
        title: "Belgeseller",
        description: "Gerçek hikayelerle dünyaya farklı bir gözle bakmanızı sağlayacak belgeseller.",
        icon: Film,
        items: Array.from({ length: 21 }, (_, i) => {
            const titles = ["Seaspiracy (2021)", "The Minimalists: Less Is Now (2021)", "I Am Not Your Negro (2016)"];
            const contents = [
                '<h5>Ali Tabrizi</h5><p>Ticari balıkçılığın okyanus ekosistemleri üzerindeki yıkıcı etkisini gözler önüne seren bir belgesel.</p>',
                '<h5>Matt D\'Avella</h5><p>Tüketim kültürüne karşı minimalist bir yaşam tarzını savunan Joshua Fields Millburn ve Ryan Nicodemus\'un hikayesi.</p>',
                '<h5>Raoul Peck</h5><p>Yazar James Baldwin\'in bitmemiş eseri üzerinden Amerika\'daki ırkçılığın tarihini ve bugününü anlatan güçlü bir belgesel.</p>'
            ];
            return {
                slug: `belgesel-${i+1}`,
                title: `${titles[i % titles.length]}`,
                content: contents[i % contents.length]
            }
        })
    },
    {
        slug: 'akademik-makaleler',
        title: "Akademik Makaleler",
        description: "Sivil toplum ve sosyal etki üzerine bilimsel çalışmalar.",
        icon: GraduationCap,
        items: Array.from({ length: 21 }, (_, i) => {
            const titles = ["Sosyal Girişimcilikte Etki Ölçümleme Modelleri", "Türkiye'de Gönüllülüğe Katılım Motivasyonları Üzerine Bir Araştırma", "Dijital Aktivizmin Sivil Toplum Üzerindeki Etkisi"];
            const contents = [
                '<h5>Özet</h5><p>Bu makale, sosyal girişimlerin yarattığı sosyal ve çevresel etkiyi ölçmek için kullanılan SROI (Yatırımın Sosyal Geri Dönüşü), B-Corp Etki Değerlemesi gibi farklı modelleri karşılaştırmalı olarak incelemektedir.</p>',
                '<h5>Özet</h5><p>Türkiye\'nin farklı demografik gruplarından bireylerin gönüllülük faaliyetlerine katılma veya katılmama nedenlerini araştıran bu çalışma, altruistik ve egoistik motivasyonların rolünü analiz etmektedir.</p>',
                '<h5>Özet</h5><p>Online platformlar ve sosyal medyanın, sivil toplum kuruluşlarının kaynak geliştirme, savunuculuk ve topluluk oluşturma kapasiteleri üzerindeki dönüştürücü etkileri vaka çalışmaları üzerinden incelenmektedir.</p>'
            ];
            return {
                slug: `makale-${i+1}`,
                title: `${titles[i % titles.length]}`,
                content: contents[i % contents.length]
            }
        })
    },
    {
        slug: 'sivil-toplum-sozlugu',
        title: "Sivil Toplum Sözlüğü",
        description: "Sivil toplum alanında sıkça kullanılan terimlerin açıklamaları.",
        icon: BookOpen,
        items: [
          { slug: 'stk', title: 'Sivil Toplum Kuruluşu (STK)', content: '<p>Devletten bağımsız olarak çalışan, kâr amacı gütmeyen ve toplumsal, çevresel veya kültürel hedefler doğrultusunda faaliyet gösteren dernek, vakıf gibi organizasyonlardır.</p>' },
          { slug: 'savunuculuk', title: 'Savunuculuk (Advocacy)', content: '<p>Belirli bir konuyu, politikayı veya ihmal edilmiş bir grubun haklarını kamuoyu ve karar vericiler nezdinde destekleme, koruma ve gündeme getirme faaliyetlerinin tümüdür.</p>' },
          { slug: 'kapasite-gelistirme', title: 'Kapasite Geliştirme', content: '<p>Bir STK\'nın misyonunu daha etkili bir şekilde yerine getirebilmesi için organizasyonel ve teknik becerilerini, bilgisini ve kaynaklarını güçlendirme sürecidir.</p>' },
          { slug: 'paydas', title: 'Paydaş (Stakeholder)', content: '<p>Bir projeden, politikadan veya kurumun faaliyetlerinden olumlu veya olumsuz yönde etkilenen veya bunları etkileyebilen tüm kişi, grup ve kurumlardır.</p>' },
          { slug: 'sosyal-etki', title: 'Sosyal Etki', content: '<p>Bir faaliyetin, projenin veya politikanın bir topluluk veya toplum üzerindeki net etkileridir. Bu etkiler, hedeflenmiş veya hedeflenmemiş, olumlu veya olumsuz olabilir.</p>' },
          { slug: 'surdurulebilirlik', title: 'Sürdürülebilirlik', content: '<p>Bir STK bağlamında, kuruluşun misyonunu uzun vadede finansal, sosyal ve çevresel olarak devam ettirebilme yeteneğidir.</p>' },
          { slug: 'gonulluluk', title: 'Gönüllülük', content: '<p>Bireyin, herhangi bir maddi karşılık beklemeden, toplumsal fayda sağlamak amacıyla kendi özgür iradesiyle bir STK\'nın faaliyetlerine zamanını, bilgisini veya emeğini ayırmasıdır.</p>' },
          { slug: 'bagis', title: 'Bağış', content: '<p>Bir kişi veya kurumun, bir STK\'nın faaliyetlerini desteklemek amacıyla karşılıksız olarak yaptığı ayni (mal/hizmet) veya nakdi (para) yardımdır.</p>' },
          { slug: 'yardim', title: 'Yardım', content: '<p>İhtiyaç sahibi kişi veya toplulukların temel gereksinimlerini (gıda, barınma, sağlık vb.) karşılamak amacıyla yapılan ayni veya nakdi destek faaliyetlerinin genel adıdır. Genellikle acil durumlara yanıt verir.</p>' },
          { slug: 'kaynak-gelistirme', title: 'Kaynak Geliştirme (Fundraising)', content: '<p>Bir STK\'nın faaliyetlerini sürdürebilmek için bireylerden, kurumlardan veya fon sağlayıcılardan finansal ve ayni destek bulma sürecidir.</p>' },
          { slug: 'seffaflik', title: 'Şeffaflık (Transparency)', content: '<p>Bir kuruluşun faaliyetleri, finansmanı ve karar alma süreçleri hakkında bilgiyi erişilebilir ve anlaşılır bir şekilde kamuoyu ile paylaşmasıdır.</p>' },
          { slug: 'hesap-verebilirlik', title: 'Hesap Verebilirlik (Accountability)', content: '<p>Bir kuruluşun, faaliyetleri ve kaynak kullanımı konusunda başta faydalanıcıları ve destekçileri olmak üzere tüm paydaşlarına karşı sorumlu olması ve bu sorumluluğu yerine getirdiğini göstermesidir.</p>' },
          { slug: 'sosyal-girisim', title: 'Sosyal Girişim', content: '<p>Temel amacı toplumsal veya çevresel bir soruna çözüm üretmek olan ve bu amacı gerçekleştirmek için ticari faaliyetler yürüterek kendi gelir modelini oluşturan organizasyondur.</p>' },
          { slug: 'sosyal-inovasyon', title: 'Sosyal İnovasyon', content: '<p>Toplumsal veya çevresel bir soruna, mevcut çözümlerden daha etkili, verimli ve sürdürülebilir yeni fikirler, stratejiler, ürünler veya organizasyon modelleri geliştirme sürecidir.</p>' },
          { slug: 'filantropi', title: 'Filantropi (Philanthropy)', content: '<p>Toplumsal sorunların çözümü için genellikle büyük ölçekli ve stratejik bağışlar yaparak kamu yararını artırma çabasıdır. Genellikle "insan sevgisi" olarak tanımlanır.</p>' },
          { slug: 'ayni-yardim', title: 'Ayni Yardım', content: '<p>Para yerine gıda, giysi, ekipman, hizmet gibi mal veya hizmet şeklinde yapılan bağış türüdür.</p>' },
          { slug: 'nakdi-yardim', title: 'Nakdi Yardım', content: '<p>Doğrudan para olarak yapılan bağış türüdür.</p>' },
          { slug: 'proje-dongusu-yonetimi', title: 'Proje Döngüsü Yönetimi (PCM)', content: '<p>Bir projenin fikir aşamasından başlayarak planlanması, uygulanması, izlenmesi, değerlendirilmesi ve sonlandırılması süreçlerinin tamamını kapsayan metodolojik bir yaklaşımdır.</p>' },
          { slug: 'mantiksal-cerceve', title: 'Mantıksal Çerçeve Yaklaşımı (LFA)', content: '<p>Projelerin hedeflerini, faaliyetlerini, beklenen sonuçlarını ve varsayımlarını sistematik bir matris içinde gösteren bir proje planlama ve izleme aracıdır.</p>' },
          { slug: 'faaliyet-raporu', title: 'Faaliyet Raporu', content: '<p>Bir STK\'nın belirli bir dönem (genellikle bir yıl) içinde gerçekleştirdiği faaliyetleri, ulaştığı sonuçları ve mali durumunu özetleyen belgedir.</p>' },
          { slug: 'tuzuk-vakif-senedi', title: 'Tüzük / Vakıf Senedi', content: '<p>Bir derneğin (tüzük) veya vakfın (vakıf senedi) amacını, faaliyet alanlarını, organlarını ve işleyiş kurallarını belirleyen temel yasal belgedir.</p>' },
          { slug: 'iktisadi-isletme', title: 'İktisadi İşletme', content: '<p>Bir dernek veya vakfın, misyonunu desteklemek amacıyla gelir elde etmek için kurduğu ve işlettiği ticari işletmedir.</p>' },
          { slug: 'sosyal-kooperatif', title: 'Sosyal Kooperatif', content: '<p>Ortaklarının ekonomik çıkarlarından ziyade, topluma hizmet etmeyi veya dezavantajlı grupların istihdamını sağlamayı öncelikli amaç edinen kooperatif modelidir.</p>' },
        ]
    },
    {
        slug: 'hangel-sozluk',
        title: "Hangel Sözlük",
        description: "Platforma özgü terimlerin ve kavramların açıklamaları.",
        icon: BookOpen,
        items: Array.from({ length: 21 }, (_, i) => {
            const titles = ["Sosyal Etki Puanı", "Şeffaflık Endeksi", "hangel Katkı Payı"];
            const contents = [
                '<p>Kullanıcıların platform üzerinde gerçekleştirdiği her türlü olumlu eylemin (gönüllülük, bağış, davet vb.) karşılığında kazandığı, sosyal etki seviyesini ve platforma olan katkısını gösteren bir puan sistemidir.</p>',
                '<p>STK\'ların mali tabloları, faaliyet raporları, yönetim kurulu gibi bilgileri kamuoyu ile paylaşma düzeyini ölçen ve Hangel tarafından belirlenen kriterlere dayanan bir puandır. Yüksek puan, STK\'nın daha şeffaf ve hesap verebilir olduğunu gösterir.</p>',
                '<p>Alışverişlerden doğan bağışların STK\'lara aktarılması sürecindeki operasyonel ve teknik maliyetleri karşılamak ve platformun sürdürülebilirliğini sağlamak amacıyla, STK\'ya aktarılan net bağış tutarı üzerinden alınan %10\'luk hizmet bedelidir.</p>'
            ];
             return {
                slug: `sozluk-${i + 1}`,
                title: `${titles[i % titles.length]}`,
                content: contents[i % contents.length]
            }
        })
    }
];
