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
        slug: 'akademik-makaleler',
        title: "Akademik Makaleler",
        description: "Üniversiteler ve araştırma kurumları tarafından hazırlanan akademik çalışmalar.",
        icon: "GraduationCap",
        items: [
            {
                slug: 'sivil-toplum-kurulularinda-seffaflik-ve-hesap-verebilirlik',
                title: "Sivil Toplum Kuruluşlarında Şeffaflık ve Hesap Verebilirlik",
                content: "Bu makale, sivil toplum kuruluşlarının mali ve idari şeffaflık pratiklerini inceleyerek hesap verebilirlik mekanizmalarının etkinliğini analiz etmektedir. Araştırma, bağışçı güvenini artırmada belge paylaşımı ve düzenli raporlamanın kritik rolünü ortaya koymaktadır. Türkiye'deki STK'lar üzerinde yürütülen saha çalışması, şeffaflık düzeyinin kurumsal sürdürülebilirlikle doğrudan ilişkili olduğunu göstermektedir."
            },
            {
                slug: 'turkiyede-gonulluluk-egilimler-ve-engeller',
                title: "Türkiye'de Gönüllülük: Eğilimler ve Engeller",
                content: "Bu çalışma, Türkiye'de gönüllü katılımı etkileyen sosyoekonomik ve kültürel faktörleri kapsamlı bir biçimde ele almaktadır. Araştırma, genç bireylerin dijital platformlar aracılığıyla gönüllülüğe ilgi duyduğunu ancak zaman kısıtı ve farkındalık eksikliğinin önündeki başlıca engeller olduğunu tespit etmektedir. Bulgular, STK'ların esnek gönüllülük modellerine yönelmesinin katılım oranlarını önemli ölçüde artırabileceğine işaret etmektedir."
            },
            {
                slug: 'sosyal-girisimcilik-ve-surdurulebilir-kalkinma',
                title: "Sosyal Girişimcilik ve Sürdürülebilir Kalkınma",
                content: "Bu makale, sosyal girişimcilik modellerinin sürdürülebilir kalkınma hedefleriyle nasıl örtüştüğünü ve toplumsal sorunlara piyasa tabanlı çözümler üretmedeki etkinliğini araştırmaktadır. Sosyal girişimlerin hem ekonomik hem de sosyal değer yaratma kapasitesi, geleneksel STK modellerine kıyasla karşılaştırmalı olarak değerlendirilmektedir. Çalışma, hibrit finansman yapılarının ve ölçeklenebilir sosyal etki modellerinin önemine dikkat çekmektedir."
            },
            {
                slug: 'dijital-bagis-platformlarinin-etkisi',
                title: "Dijital Bağış Platformlarının Etkisi",
                content: "Bu araştırma, dijital bağış platformlarının geleneksel bağış kanallarına kıyasla bağışçı kitlesini genişletme ve bağış hacmini artırma üzerindeki etkisini incelemektedir. Mobil ödeme sistemleri ve sosyal medya entegrasyonunun bağış davranışları üzerindeki dönüştürücü rolü verilerle desteklenerek analiz edilmektedir. Sonuçlar, dijital platformların özellikle genç ve kentli bağışçılar arasında katılımı anlamlı biçimde artırdığını göstermektedir."
            },
            {
                slug: 'stklarda-kurumsal-yonetim',
                title: "STK'larda Kurumsal Yönetim",
                content: "Bu çalışma, sivil toplum kuruluşlarında kurumsal yönetim ilkelerinin uygulanmasını ve yönetim kurulu etkinliğini mercek altına almaktadır. İyi yönetişim pratiklerinin STK'ların uzun vadeli sürdürülebilirliğine ve bağışçı güvenine katkısı, ulusal ve uluslararası örnekler üzerinden değerlendirilmektedir. Araştırma, Türkiye'deki STK'ların kurumsal yönetim standartlarını güçlendirmesine yönelik somut politika önerileri sunmaktadır."
            }
        ]
    },
    {
        slug: 'hangel-sozlugu',
        title: "Hangel Sözlüğü",
        description: "Hangel platformunda kullanılan terimlerin ve kavramların açıklamaları.",
        icon: "BookMarked",
        items: [
            {
                slug: 'bagis-orani',
                title: "Bağış Oranı",
                content: "Bağış oranı, Hangel üzerinden gerçekleştirilen her alışverişte satın alınan ürün veya hizmet bedelinin belirli bir yüzdesinin seçilen STK'ya aktarılmasını ifade eder. Bu oran, iş ortaklarıyla yapılan anlaşmaya göre değişiklik gösterebilir ve kullanıcı tarafından alışveriş öncesinde görüntülenebilir. Şeffaf bir yapıya sahip olan bağış oranı sistemi, kullanıcıların her alışverişin toplumsal katkısını önceden bilmesine olanak tanır."
            },
            {
                slug: 'seffaflik-puani',
                title: "Şeffaflık Puanı",
                content: "Şeffaflık puanı, bir STK'nın Hangel platformuna yüklediği belgelere, mali raporlara ve faaliyet bilgilerine göre hesaplanan sayısal bir değerlendirme göstergesidir. Yüksek şeffaflık puanı, kuruluşun hesap verebilirliğe verdiği önemi ve bağışçılara karşı açıklık ilkesini benimsediğini yansıtır. Kullanıcılar, destek verecekleri STK'yı seçerken şeffaflık puanını temel bir kriter olarak kullanabilirler."
            },
            {
                slug: 'gonulluluk-ilani',
                title: "Gönüllülük İlanı",
                content: "Gönüllülük ilanı, Hangel platformunda STK'ların belirli projeler veya etkinlikler için gönüllü aradıklarını duyurdukları yapılandırılmış bir duyuru formatıdır. İlan; konum, tarih, gerekli beceriler ve beklenen zaman taahhüdü gibi temel bilgileri içerir. Kullanıcılar ilgi alanlarına ve müsaitlik durumlarına göre ilanları filtreleyerek başvurabilirler."
            },
            {
                slug: 'etki-degeri',
                title: "Etki Değeri",
                content: "Etki değeri, bir kullanıcının Hangel üzerinden gerçekleştirdiği gönüllü faaliyetlerin ve alışverişe bağlı bağışların parasal karşılığını ve toplumsal katkısını özetleyen bütünleşik bir ölçüm değeridir. Bu metrik, kullanıcıların platformdaki birikimli etkisini somut ve anlaşılır bir şekilde görselleştirir. Etki değeri hesaplanırken gönüllülük saatlerinin sektör ortalamasına göre belirlenen ekonomik değeri ve aktarılan bağış miktarları birlikte dikkate alınır."
            },
            {
                slug: 'dijital-bagis',
                title: "Dijital Bağış",
                content: "Dijital bağış, Hangel ekosisteminde kullanıcıların alışveriş yaparak ya da doğrudan platform üzerinden STK'lara elektronik ortamda aktardığı mali katkıyı ifade eder. Geleneksel bağış yöntemlerinden farklı olarak ek bir işlem gerektirmez; bağış, alışveriş süreciyle eş zamanlı ve otomatik olarak gerçekleşir. Bu model, bağışı günlük tüketim alışkanlıklarıyla bütünleştirerek sürdürülebilir bir sosyal sorumluluk döngüsü oluşturur."
            },
            {
                slug: 'stk-profili',
                title: "STK Profili",
                content: "STK profili, Hangel platformunda bir sivil toplum kuruluşunun misyonunu, projelerini, şeffaflık belgelerini ve bağış bilgilerini bir arada sunan kapsamlı kurumsal sayfasıdır. Profil sayfası aracılığıyla kullanıcılar kuruluş hakkında detaylı bilgiye erişebilir, geçmiş projeleri inceleyebilir ve doğrudan destek olabilir. STK'lar profillerini düzenli olarak güncelleyerek bağışçı ve gönüllü topluluklarıyla şeffaf bir iletişim sürdürebilirler."
            },
            {
                slug: 'sosyal-sorumluluk-dongusu',
                title: "Sosyal Sorumluluk Döngüsü",
                content: "Sosyal sorumluluk döngüsü, Hangel'in temel iş modelini tanımlayan kavramdır: kullanıcı alışveriş yapar, alışverişin bir kısmı otomatik olarak seçilen STK'ya bağış olarak aktarılır ve bu katkı somut bir toplumsal fayda yaratır. Döngü, alışverişi anlam taşıyan bir eyleme dönüştürerek tüketim ile sosyal sorumluluk arasında organik bir köprü kurar. Her tekrarlayan alışverişle döngü güçlenir ve kullanıcının toplumsal etkisi kademeli olarak artar."
            },
            {
                slug: 'rozet',
                title: "Rozet",
                content: "Rozet, Hangel platformunda kullanıcıların bağış yapma, gönüllülük faaliyetlerine katılma veya belirli platformiçi hedeflere ulaşma gibi başarılarını belgeleyen dijital bir ödüllendirme aracıdır. Rozetler kullanıcı profilinde görünür şekilde sergilenerek topluluk içinde tanınırlık ve motivasyon sağlar. Farklı kategorilerde sunulan rozetler, kullanıcıları daha fazla sosyal etki yaratmaya teşvik eden bir oyunlaştırma unsuru olarak işlev görür."
            },
            {
                slug: 'liderlik-tablosu',
                title: "Liderlik Tablosu",
                content: "Liderlik tablosu, Hangel kullanıcılarını gerçekleştirdikleri bağış miktarı, gönüllülük saatleri ve genel etki değerine göre sıralayan dinamik bir performans göstergesidir. Tablo, kullanıcılar arasında sağlıklı bir rekabet ortamı ve topluluk duygusu oluşturarak sosyal etkinin artmasına katkıda bulunur. Kullanıcılar hem genel sıralamayı hem de seçtikleri STK bazındaki sıralamayı takip edebilirler."
            }
        ]
    },
    {
        slug: 'sivil-toplum-sozlugu',
        title: "Sivil Toplum Sözlüğü",
        description: "Sivil toplum alanında sıkça kullanılan terimlerin açıklamaları.",
        icon: "BookOpen",
        items: [
            {
                slug: 'stk-sivil-toplum-kurulusu',
                title: "STK (Sivil Toplum Kuruluşu)",
                content: "Sivil toplum kuruluşu, devlet ve özel sektörden bağımsız olarak toplumsal bir amaç doğrultusunda faaliyet gösteren, kâr amacı gütmeyen örgütleri tanımlamak için kullanılan genel bir kavramdır. STK'lar; dernekler, vakıflar, meslek kuruluşları ve platformlar gibi çeşitli örgütlenme biçimlerini kapsar. Bu kuruluşlar, demokratik katılımı güçlendiren, savunuculuk yapan ve toplumsal hizmet sunan temel aktörler olarak kabul edilir."
            },
            {
                slug: 'dernek',
                title: "Dernek",
                content: "Dernek, ortak bir amaç veya çıkar etrafında bir araya gelen en az yedi gerçek ya da tüzel kişinin Türk Medeni Kanunu çerçevesinde kurduğu, tüzel kişiliğe sahip sivil toplum örgütüdür. Dernekler, üye aidatları ve bağışlar aracılığıyla finansman sağlar; kararlar demokratik süreçlerle alınır. Spor kulüplerinden mesleki dayanışma topluluklarına, çevre örgütlerinden kültür derneklerine kadar geniş bir yelpazede faaliyet gösterirler."
            },
            {
                slug: 'vakif',
                title: "Vakıf",
                content: "Vakıf, gerçek veya tüzel kişilerin belirli bir toplumsal amaca kalıcı olarak tahsis ettiği mal varlığıyla oluşturulan, bağımsız tüzel kişiliğe sahip sivil toplum kuruluşudur. Derneklerden farklı olarak vakıfların üyesi bulunmaz; yönetim, vakfiyede belirlenen kurallar çerçevesinde mütevelli heyeti tarafından yürütülür. Eğitim, sağlık, kültür ve sosyal yardım alanlarında faaliyet gösteren vakıflar, Türkiye sivil toplumunun önemli bir bileşenini oluşturmaktadır."
            },
            {
                slug: 'bagis',
                title: "Bağış",
                content: "Bağış, bir bireyin ya da kurumun herhangi bir karşılık beklemeksizin para, mal veya hizmet şeklinde sivil toplum kuruluşlarına ya da ihtiyaç sahiplerine yaptığı gönüllü katkıdır. Bağışlar; proje finansmanında, acil yardım operasyonlarında ve kurumsal kapasitenin güçlendirilmesinde STK'ların temel gelir kaynaklarından birini oluşturur. Türkiye'de bağışlar yasal güvence altında olup belirli koşullar çerçevesinde vergi avantajı sağlayabilir."
            },
            {
                slug: 'hibe',
                title: "Hibe",
                content: "Hibe, devlet kurumları, uluslararası kuruluşlar veya özel vakıflar tarafından sivil toplum kuruluşlarına belirli bir proje ya da faaliyet için geri ödeme yükümlülüğü olmaksızın sağlanan finansman desteğidir. Hibeler genellikle rekabetçi bir başvuru süreci sonucunda verilir ve kullanımına ilişkin belirli koşullar ile raporlama gereklilikleri içerir. Avrupa Birliği fonları, kamu hibeleri ve kurumsal vakıf hibeleri, Türkiye'deki STK'lar için önemli finansman kaynakları arasında yer almaktadır."
            },
            {
                slug: 'savunuculuk',
                title: "Savunuculuk",
                content: "Savunuculuk, sivil toplum kuruluşlarının belirli bir toplumsal sorunun çözümüne yönelik politika değişikliği sağlamak amacıyla kamuoyu oluşturma, lobi faaliyetleri yürütme ve karar alıcıları etkileme çabalarının bütününü ifade eder. Etkili savunuculuk; araştırma, medya ilişkileri, koalisyon kurma ve doğrudan diyalog gibi birbirini tamamlayan yöntemleri bir arada kullanır. Demokratik sistemlerde savunuculuk, sivil toplumun politika süreçlerine katkı sunmasının en temel araçlarından biridir."
            },
            {
                slug: 'kapasite-gelistirme',
                title: "Kapasite Geliştirme",
                content: "Kapasite geliştirme, bir STK'nın misyonunu daha etkin biçimde yerine getirebilmesi için kurumsal, örgütsel ve bireysel düzeyde bilgi, beceri ve sistemlerin güçlendirilmesine yönelik planlı müdahalelerin tümünü kapsayan bir süreçtir. Bu süreç; stratejik planlama, finansal yönetim, insan kaynakları geliştirme, izleme-değerlendirme sistemleri ve kurumsal yönetişim gibi alanlardaki gelişimi içerir. Uluslararası fonlayıcılar ve yerel destekçiler, STK'ların uzun vadeli sürdürülebilirliğini artırmak amacıyla kapasite geliştirme programlarını öncelikli bir yatırım alanı olarak benimsemektedir."
            },
            {
                slug: 'sosyal-etki',
                title: "Sosyal Etki",
                content: "Sosyal etki, bir kuruluşun ya da programın toplum üzerinde yarattığı olumlu ve ölçülebilir değişimi ifade eden kapsamlı bir kavramdır. Sosyal etkinin değerlendirilmesinde; yararlanıcı sayısı, yaşam koşullarındaki iyileşme, politika değişiklikleri ve toplumsal tutum dönüşümleri gibi niceliksel ve niteliksel göstergeler bir arada kullanılır. STK'lar için sosyal etkinin belgelenmesi, hesap verebilirlik açısından kritik önem taşıdığı gibi fon ve destek kaynaklarına erişimde de belirleyici bir etken haline gelmektedir."
            },
            {
                slug: 'seffaflik',
                title: "Şeffaflık",
                content: "Sivil toplumda şeffaflık, kuruluşların mali durumlarını, yönetim yapılarını, proje sonuçlarını ve karar alma süreçlerini paydaşlarla ve kamuoyuyla açık bir şekilde paylaşma ilkesini ifade eder. Şeffaflık, bağışçı güveninin inşasında ve kurumsal meşruiyetin korunmasında temel bir ilke olarak kabul edilmektedir. Yıllık faaliyet raporları, denetlenmiş mali tablolar ve açık proje verileri, sivil toplumda şeffaflığın hayata geçirilmesinde yaygın olarak kullanılan araçlardır."
            },
            {
                slug: 'gonulluluk',
                title: "Gönüllülük",
                content: "Gönüllülük, bireylerin herhangi bir maddi karşılık almaksızın zamanlarını, emeklerini ve becerilerini toplumsal bir amaca hizmet etmek üzere özgür iradeleriyle sivil toplum kuruluşlarına ya da topluluklara sunmasıdır. Gönüllülük; toplumsal dayanışmayı pekiştirmenin yanı sıra, bireylere yeni beceriler kazandırma ve mesleki gelişim fırsatları sunma işlevi de görmektedir. Türkiye'de gönüllülük kültürünün geliştirilmesi, STK'ların sürdürülebilirliği ve toplumsal katılımın derinleşmesi açısından stratejik bir öncelik olarak öne çıkmaktadır."
            }
        ]
    }
];
