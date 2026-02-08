
export interface LibraryItem {
  slug: string;
  title: string;
  content: string;
}

export interface LibrarySection {
  slug: string;
  title: string;
  description: string;
  icon: string;
  items: LibraryItem[];
}

export const librarySections: LibrarySection[] = [
    {
        slug: 'veri-kutuphanesi',
        title: "Veri Kütüphanesi",
        description: "Kamu, belediye ve STK'lar tarafından paylaşılan resmi veriler ve açık veri setleri.",
        icon: "Database",
        items: [
            {
                slug: 'icisleri-bakanligi-dernek-verileri-2023',
                title: "T.C. İçişleri Bakanlığı - Derneklerin Sosyal Etki Verileri (2023)",
                content: `<h4>Veri Seti Özeti</h4><p>Bu veri seti, Türkiye genelinde faaliyet gösteren derneklerin 2023 yılı içerisindeki sosyal etki kapasitelerini, üye sayılarını ve gerçekleştirdikleri yardım faaliyetlerinin sektörel dağılımını içermektedir.</p><h4>Temel İstatistikler</h4><ul><li>Aktif Dernek Sayısı: <strong>122.450</strong></li><li>Toplam Gönüllü Sayısı: <strong>2.1M</strong></li><li>En Çok Faaliyet Gösterilen Alan: <strong>Sosyal Dayanışma (%34)</strong></li></ul><p>Bu veriler, yeni projelerin hangi bölgelerde ve alanlarda yoğunlaşması gerektiğini belirlemek için stratejik bir kaynaktır.</p>`
            },
            {
                slug: 'ibb-sosyal-yardim-istatistikleri',
                title: "İstanbul Büyükşehir Belediyesi - Sosyal Yardım İstatistikleri",
                content: `<h4>Açıklama</h4><p>İstanbul genelinde mahalle bazlı sosyal yardım talepleri ve karşılanma oranlarını gösteren anonimleştirilmiş veri setidir.</p><h4>Kullanım Alanı</h4><p>Sosyal sorunların yoğunlaştığı bölgeleri tespit ederek, yerel odaklı sosyal girişimler ve gönüllülük projeleri tasarlamak için kullanılabilir.</p>`
            },
            {
                slug: 'tuik-toplumsal-yasam-arastirmasi',
                title: "TÜİK - Toplumsal Yaşamda Zaman Kullanım Araştırması",
                content: `<h4>Araştırma Kapsamı</h4><p>Bireylerin gün içerisindeki faaliyetlere (iş, eğitim, gönüllülük, boş zaman) ayırdıkları süreyi demografik kırılımlarla sunan resmi istatistiktir.</p><h4>Sosyal Proje Notu</h4><p>Gönüllülük faaliyetlerine ayrılan sürenin düşüklüğü, bu alandaki farkındalık projelerinin önemini vurgulamaktadır.</p>`
            },
            {
                slug: 'afad-afet-gonulluleri-haritasi',
                title: "AFAD - Afet Gönüllüleri Yerleşim ve Yetkinlik Haritası",
                content: `<h4>Veri Özeti</h4><p>Afet durumlarında müdahale kapasitesini ölçmek amacıyla hazırlanan, gönüllülerin yetkinlik bazlı (ilk yardım, lojistik, arama kurtarma) dağılım verisidir.</p><h4>Proje Geliştirme</h4><p>Eksik yetkinlik alanlarında düzenlenecek eğitim programları için temel teşkil eder.</p>`
            },
            {
                slug: 'stk-kapasite-analizi-2024',
                title: "STK Kapasite ve İhtiyaç Analizi Raporu (Hangel Data)",
                content: `<h4>Rapor Hakkında</h4><p>Hangel platformu üzerindeki STK'ların dijitalleşme oranları, kaynak geliştirme ihtiyaçları ve insan kaynağı açıklarını içeren güncel analiz raporudur.</p><h4>Bulgular</h4><ul><li>Dijital Dönüşüm İhtiyacı: <strong>%68</strong></li><li>Sürdürülebilir Fon Erişimi Sorunu: <strong>%72</strong></li></ul>`
            }
        ]
    },
    {
        slug: 'sosyal-etki-raporlari',
        title: "Sosyal Etki Raporları",
        description: "Hangel'in ve paydaşlarının sağladığı etkiyi inceleyin.",
        icon: "FileText",
        items: Array.from({ length: 10 }, (_, i) => ({
            slug: `etki-raporu-202${3 - (i % 3)}-${['cevre', 'egitim', 'genel'][i%3]}-${i + 1}`,
            title: `202${3 - (i % 3)} Yılı ${['Çevre', 'Eğitim', 'Genel'][i%3]} Etki Raporu #${i + 1}`,
            content: `<h4>Özet</h4><p>Bu rapor, 202${3 - (i % 3)} yılı içerisinde ${['çevre koruma', 'eğitimde fırsat eşitliği', 'genel toplumsal kalkınma'][i%3]} alanında yürütülen projelerin, yapılan bağışların ve gönüllülük faaliyetlerinin sağladığı sosyal etkiyi kapsamlı bir şekilde analiz etmektedir.</p><h4>Temel Bulgular</h4><ul><li>Toplam <strong>${(i+1)*12345}₺</strong> bağış toplandı.</li><li><strong>${(i+1)*50} saat</strong> gönüllülük faieli gerçekleştirildi.</li><li><strong>${(i+1)*100} kişiye</strong> doğrudan ulaşıldı.</li></ul>`
        }))
    },
    {
        slug: 'sivil-toplum-sozlugu',
        title: "Sivil Toplum Sözlüğü",
        description: "Sivil toplum alanında sıkça kullanılan terimlerin açıklamaları.",
        icon: "BookOpen",
        items: [
          { slug: 'stk', title: 'Sivil Toplum Kuruluşu (STK)', content: '<p>Kâr amacı gütmeyen, gönüllülük esasına dayalı, toplumsal sorunlara çözüm üretmek amacıyla kurulan tüzel kişiliklerdir. Dernekler ve vakıflar en yaygın STK türleridir.</p>' },
          { slug: 'gonulluluk', title: 'Gönüllülük', content: '<p>Bireyin kendi özgür iradesiyle, maddi bir karşılık beklemeden, toplumsal fayda sağlamak amacıyla zamanını ve yetkinliklerini bir amaç uğruna seferber etmesidir.</p>' },
          { slug: 'surdurulebilirlik', title: 'Sürdürülebilirlik', content: '<p>Mevcut ihtiyaçların, gelecek nesillerin kendi ihtiyaçlarını karşılama yeteneğinden ödün vermeden karşılanmasıdır. Sosyal, çevresel ve ekonomik boyutları bulunur.</p>' },
          { slug: 'seffaflik', title: 'Şeffaflık', content: '<p>Kuruluşların faaliyetleri, kararları ve finansal yapıları hakkındaki bilgileri paydaşları ve kamuoyu ile açık, anlaşılır ve erişilebilir bir şekilde paylaşmasıdır.</p>' },
          { slug: 'hesap-verebilirlik', title: 'Hesap Verebilirlik', content: '<p>Bir kuruluşun aldığı kararların ve yürüttüğü faaliyetlerin sonuçlarını üstlenme ve paydaşlarına açıklama yükümlülüğüdür.</p>' },
          { slug: 'kaynak-gelistirme', title: 'Kaynak Geliştirme (Fundraising)', content: '<p>Bir kuruluşun misyonunu gerçekleştirmek için ihtiyaç duyduğu finansal ve ayni kaynakları bireylerden, kurumlardan veya fonlardan toplama sürecidir.</p>' },
          { slug: 'savunuculuk', title: 'Savunuculuk (Advocacy)', content: '<p>Belirli bir toplumsal sorunla ilgili farkındalık yaratmak, politika yapıcıları etkilemek ve yapısal değişiklikler sağlamak için yürütülen sistematik faaliyetlerdir.</p>' },
          { slug: 'paydas', title: 'Paydaş (Stakeholder)', content: '<p>Bir kuruluşun faaliyetlerinden etkilenen veya bu faaliyetleri etkileyen tüm kişi, grup ve kurumlardır (Gönüllüler, bağışçılar, faydalanıcılar vb.).</p>' },
          { slug: 'sosyal-girisimcilik', title: 'Sosyal Girişimcilik', content: '<p>Toplumsal bir sorunu çözmek için ticari yöntemler kullanan, elde ettiği kârı öncelikli olarak sosyal misyonuna yatıran iş modelidir.</p>' },
          { slug: 'iktisadi-isletme', title: 'İktisadi İşletme', content: '<p>Dernek veya vakıfların amaçlarını gerçekleştirmek için ihtiyaç duydukları geliri sağlamak amacıyla kurdukları ticari işletmelerdir.</p>' },
          { slug: 'sroi', title: 'SROI (Sosyal Getiri Analizi)', content: '<p>Yatırılan her bir birim kaynağın karşılığında yaratılan sosyal ve çevresel değerin parasal bir ifadeyle ölçülmesini sağlayan metodolojidir.</p>' },
          { slug: 'sosyal-fayda', title: 'Sosyal Fayda', content: '<p>Toplumun genel refahını, yaşam kalitesini veya adaleti artıran her türlü olumlu sonuç ve etkidir.</p>' },
          { slug: 'mikro-gonulluluk', title: 'Mikro Gönüllülük', content: '<p>Uzun süreli bağlılık gerektirmeyen, genellikle dijital ortamda gerçekleştirilen, kısa süreli ve küçük çaplı gönüllülük görevleridir.</p>' },
          { slug: 'dijital-aktivizm', title: 'Dijital Aktivizm', content: '<p>Toplumsal veya siyasal bir değişim yaratmak amacıyla internet ve sosyal medya araçlarının kullanılmasıdır.</p>' }
        ]
    },
    {
        slug: 'hangel-sozluk',
        title: "hangel Sözlük",
        description: "Platforma özgü terimlerin ve kavramların açıklamaları.",
        icon: 'BookOpen',
        items: [
            { slug: 'etki-puani', title: 'hangel Etki Puanı', content: '<p>Kullanıcıların gönüllülük, bağış ve davet gibi olumlu eylemleri sonucunda kazandıkları, sosyal etki seviyelerini gösteren oyunlaştırılmış puan sistemidir.</p>' },
            { slug: 'seffaflik-endeksi', title: 'hangel Şeffaflık Endeksi', content: '<p>STK\'ların yasal belgelerini ve raporlarını paylaşma düzeyine göre hesaplanan, bağışçılar için güven göstergesi olan 100 üzerinden bir puandır.</p>' },
            { slug: 'katki-payi', title: 'hangel Katkı Payı', content: '<p>Bağışların STK\'lara aktarılması sürecindeki teknik ve operasyonel maliyetleri karşılamak için net bağış tutarı üzerinden alınan %10\'luk hizmet bedelidir.</p>' },
            { slug: 'hangel-imece', title: 'hangel İmece', content: '<p>Platformun yetenek bazlı gönüllülük modülüdür. Gönüllülerle STK\'ları yetkinlikler üzerinden buluşturur.</p>' },
            { slug: 'hangel-bagis', title: 'hangel Bağış', content: '<p>Günlük alışverişleri ek masrafsız bağışa dönüştüren sistemin genel adıdır.</p>' },
            { slug: 'hangel-kampus', title: 'hangel Kampüs', content: '<p>Üniversite kulüplerini ve öğrencilerini sosyal etki ekosistemine dahil eden özel programdır.</p>' },
            { slug: 'uye-isyeri', title: 'hangel Üye İşyeri', content: '<p>Mağazasında hangel QR ödeme sistemini kullanarak satışlarını sosyal faydaya dönüştüren ticari işletmelerdir.</p>' },
            { slug: 'etki-hikayem', title: 'Etki Hikayem', content: '<p>Yapay zeka desteğiyle, kullanıcının aylık sosyal katkılarını ilham verici bir anlatıya dönüştüren paylaşım özelliğidir.</p>' },
            { slug: 'hangel-rozet', title: 'hangel Rozeti', content: '<p>Belirli etki hedeflerine ulaşan kullanıcılara verilen dijital başarı sembolleridir.</p>' },
            { slug: 'dolayli-bagis', title: 'Dolaylı Bağış', content: '<p>Kullanıcının cebinden ek bir ücret çıkmadan, yaptığı alışverişin bir kısmının marka tarafından STK\'ya aktarılmasıdır.</p>' },
            { slug: 'sosyal-etki-seviyesi', title: 'Sosyal Etki Seviyesi', content: '<p>Kullanıcının toplam etki puanına göre belirlenen; Demir, Bakır, Bronz gibi metallerle ifade edilen statüsüdür.</p>' }
        ]
    }
];
