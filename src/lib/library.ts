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
        slug: 'rehberler',
        title: "Rehberler & Eğitimler",
        description: "Gönüllüler ve STK yöneticileri için pratik uygulama rehberleri.",
        icon: "BookOpen",
        items: [
            {
                slug: 'gonulluluk-101',
                title: "Gönüllülük 101: Nereden Başlamalı?",
                content: `<h4>Gönüllülüğün Temelleri</h4><p>Gönüllü olmak sadece zaman ayırmak değildir; bir amacı sahiplenmektir. İlk adımda yetkinliklerinizi belirleyin.</p><ul><li>Yetkinlik Analizi</li><li>STK Seçimi</li><li>Etik Kurallar</li></ul>`
            },
            {
                slug: 'stk-dijitallesme-rehberi',
                title: "STK'lar İçin Dijital Dönüşüm Yol Haritası",
                content: `<h4>Dijital Gelecek</h4><p>Kuruluşunuzun etkisini artırmak için teknolojiyi nasıl kullanabileceğinizi öğrenin. CRM sistemleri, bağış otomasyonu ve sosyal medya stratejileri.</p>`
            },
            {
                slug: 'kaynak-gelistirme-yontemleri',
                title: "Sürdürülebilir Kaynak Geliştirme Stratejileri",
                content: `<h4>Bağışın Ötesi</h4><p>Geleneksel bağış toplama yöntemlerinin yanı sıra iktisadi işletme modelleri ve kurumsal işbirlikleri hakkında ipuçları.</p>`
            }
        ]
    },
    {
        slug: 'veri-kutuphanesi',
        title: "Veri Kütüphanesi",
        description: "Kamu, belediye ve STK'lar tarafından paylaşılan resmi veriler ve açık veri setleri.",
        icon: "Database",
        items: [
            {
                slug: 'icisleri-bakanligi-dernek-verileri-2023',
                title: "T.C. İçişleri Bakanlığı - Derneklerin Sosyal Etki Verileri (2023)",
                content: `<h4>Veri Seti Özeti</h4><p>Bu veri seti, Türkiye genelinde faaliyet gösteren derneklerin 2023 yılı içerisindeki sosyal etki kapasitelerini ve gönüllü sayılarını içerir.</p>`
            },
            {
                slug: 'ibb-sosyal-yardim-istatistikleri',
                title: "İstanbul Büyükşehir Belediyesi - Sosyal Yardım İstatistikleri",
                content: `<h4>Açıklama</h4><p>İstanbul genelinde mahalle bazlı sosyal yardım talepleri ve karşılanma oranlarını gösteren anonimleştirilmiş veri setidir.</p>`
            },
            {
                slug: 'tuik-gonulluluk-istatistikleri',
                title: "TÜİK - Türkiye Gönüllülük Araştırması Sonuçları",
                content: "<h4>İstatistiksel Analiz</h4><p>Türkiye'deki gönüllülük oranlarının yaş, cinsiyet ve bölge bazlı dağılımını içeren resmi istatistik raporu.</p>"
            }
        ]
    },
    {
        slug: 'kitaplar',
        title: "Kitap Önerileri",
        description: "Sosyal gelişim ve toplumsal dönüşüm üzerine temel eserler.",
        icon: "Library",
        items: [
            {
                slug: 'sosyal-girisimcilik-rehberi',
                title: "Sosyal Girişimcilik: Dünyayı Değiştiren İş Modelleri",
                content: `<h4>Kitap Hakkında</h4><p>Geleneksel hayırseverlikten sürdürülebilir sosyal girişimciliğe geçişi anlatan temel bir başvuru kaynağıdır.</p>`
            },
            {
                slug: 'iyilik-ekonomisi',
                title: "İyilik Ekonomisi: Yeni Bir Kapitalizm Mümkün Mü?",
                content: "<p>Kâr maksimizasyonu yerine sosyal fayda odaklı bir ekonomik sistemin temellerini anlatan ufuk açıcı bir eser.</p>"
            }
        ]
    },
    {
        slug: 'filmler',
        title: "Film & Belgesel Seansı",
        description: "Toplumsal farkındalığı artıran ve ilham veren sinema eserleri.",
        icon: "Film",
        items: [
            {
                slug: 'umudunu-kaybetme',
                title: "Umudunu Kaybetme (The Pursuit of Happyness)",
                content: `<h4>Film Analizi</h4><p>Azim ve toplumsal dayanışma üzerine çarpıcı bir hikaye.</p>`
            },
            {
                slug: 'sosyal-ikilem',
                title: "Sosyal İkilem (The Social Dilemma)",
                content: "<p>Dijital dünyanın toplumsal davranışlar üzerindeki etkisini ve etik sorunları ele alan etkileyici bir belgesel.</p>"
            }
        ]
    },
    {
        slug: 'sivil-toplum-sozlugu',
        title: "Sivil Toplum Sözlüğü",
        description: "Sivil toplum alanında sıkça kullanılan terimlerin açıklamaları.",
        icon: "BookOpen",
        items: [
          { slug: 'stk', title: 'Sivil Toplum Kuruluşu (STK)', content: '<p>Kâr amacı gütmeyen, gönüllülük esasına dayalı tüzel kişiliklerdir.</p>' },
          { slug: 'gonulluluk', title: 'Gönüllülük', content: '<p>Bireyin kendi özgür iradesiyle maddi karşılık beklemeden zamanını ayırmasıdır.</p>' },
          { slug: 'sosyal-girisim', title: 'Sosyal Girişim', content: '<p>Ticari faaliyetlerini toplumsal bir sorunu çözmek için kullanan iş modelidir.</p>' },
          { slug: 'sroi', title: 'SROI (Sosyal Yatırım Getirisi)', content: '<p>Yatırılan her bir birim kaynağın ne kadar sosyal değer yarattığını ölçen metodolojidir.</p>' }
        ]
    },
    {
        slug: 'hukuk',
        title: "Sivil Toplum Hukuku",
        description: "Mevzuat, yönetmelikler ve yasal haklar hakkında bilgilendirmeler.",
        icon: "Scale",
        items: [
            {
                slug: 'kvkk-stk-uyumu',
                title: "STK'lar İçin KVKK Uyum Rehberi",
                content: `<h4>Veri Güvenliği</h4><p>Bağışçı ve gönüllü verilerinin saklanmasında dikkat edilmesi gereken hukuki sorumluluklar.</p>`
            },
            {
                slug: 'yardim-toplama-kanunu-ozeti',
                title: "2860 Sayılı Yardım Toplama Kanunu Özeti",
                content: "<p>Bağış toplama süreçlerinde yasal izinler ve dikkat edilmesi gereken temel maddeler.</p>"
            }
        ]
    },
    {
        slug: 'akademik-raporlar',
        title: "Akademik Raporlar",
        description: "Üniversiteler ve araştırma kurumları tarafından hazırlanan sosyal etki raporları.",
        icon: "GraduationCap",
        items: [
            {
                slug: 'turkiye-sosyal-girisimcilik-durum-analizi',
                title: "Türkiye Sosyal Girişimcilik Durum Analizi (2024)",
                content: "<h4>Rapor Özeti</h4><p>Türkiye'deki sosyal girişimlerin ekosistem içindeki yerini, karşılaştıkları engelleri ve büyüme potansiyellerini inceleyen kapsamlı çalışma.</p>"
            },
            {
                slug: 'genclik-ve-sivil-katilim-raporu',
                title: "Gençlik ve Sivil Katılım Araştırması (2023)",
                content: "<p>Z kuşağının sivil toplum kuruluşlarına bakış açısını ve katılım motivasyonlarını analiz eden akademik rapor.</p>"
            }
        ]
    }
];
