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
        items: []
    },
    {
        slug: 'veri-kutuphanesi',
        title: "Veri Kütüphanesi",
        description: "Kamu, belediye ve STK'lar tarafından paylaşılan resmi veriler ve açık veri setleri.",
        icon: "Database",
        items: []
    },
    {
        slug: 'kitaplar',
        title: "Kitap Önerileri",
        description: "Sosyal gelişim ve toplumsal dönüşüm üzerine temel eserler.",
        icon: "Library",
        items: []
    },
    {
        slug: 'filmler',
        title: "Film & Belgesel Seansı",
        description: "Toplumsal farkındalığı artıran ve ilham veren sinema eserleri.",
        icon: "Film",
        items: []
    },
    {
        slug: 'akademik-makaleler',
        title: "Akademik Makaleler",
        description: "Üniversiteler ve araştırma kurumları tarafından hazırlanan akademik çalışmalar.",
        icon: "GraduationCap",
        items: []
    },
    {
        slug: 'hangel-sozlugu',
        title: "Hangel Sözlüğü",
        description: "Hangel platformunda kullanılan terimlerin ve kavramların açıklamaları.",
        icon: "BookMarked",
        items: []
    },
    {
        slug: 'sivil-toplum-sozlugu',
        title: "Sivil Toplum Sözlüğü",
        description: "Sivil toplum alanında sıkça kullanılan terimlerin açıklamaları.",
        icon: "BookOpen",
        items: []
    },
    {
        slug: 'hukuk',
        title: "Sivil Toplum Hukuku",
        description: "Mevzuat, yönetmelikler ve yasal haklar hakkında bilgilendirmeler.",
        icon: "Scale",
        items: []
    },
    {
        slug: 'akademik-raporlar',
        title: "Akademik Raporlar",
        description: "Üniversiteler ve araştırma kurumları tarafından hazırlanan sosyal etki raporları.",
        icon: "GraduationCap",
        items: []
    }
];
