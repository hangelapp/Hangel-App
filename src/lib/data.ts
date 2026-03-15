import { 
    Leaf, 
    GraduationCap, 
    Heart, 
    Code, 
    Palette, 
    Globe, 
    ShieldCheck, 
    Handshake,
    Star,
    Laptop,
    Briefcase,
    Zap,
    Users,
    Building2,
    Store,
    Library as LibraryIcon,
    Dog,
    TreePine,
    BookOpen,
    Flame,
    Droplets,
    Anchor,
    Search,
    CircleHelp,
    BarChart,
    Building,
    Landmark,
    Target
} from 'lucide-react';
import type { User, NGO, Brand, Volunteering, Badge, Certificate, ManagedItem, AdBanner, HelpTopic, MarketCategory, StudentClub, Event, SchoolRepresentative, Application, DonationTransaction, Post } from './types';

// --- BM Kayıtlı Tüm Ülkeler Listesi (Filistin dahil) ---
export const allCountries = [
  "Türkiye", "Afganistan", "Almanya", "Amerika Birleşik Devletleri", "Andorra", "Angola", "Antigua ve Barbuda", "Arjantin", "Arnavutluk", "Avustralya", "Avusturya", "Azerbaycan", "Bahamalar", "Bahreyn", "Bangladeş", "Barbados", "Batı Sahra", "Belçika", "Belize", "Benin", "Beyaz Rusya", "Bhutan", "Birleşik Arap Emirlikleri", "Birleşik Krallık", "Bolivya", "Bosna Hersek", "Botsvana", "Brezilya", "Brunei", "Bulgaristan", "Burkina Faso", "Burundi", "Cezayir", "Cibuti", "Çad", "Çek Cumhuriyeti", "Çin", "Danimarka", "Doğu Timor", "Dominik Cumhuriyeti", "Dominika", "Ekvador", "Ekvator Ginesi", "El Salvador", "Endonezya", "Eritre", "Ermenistan", "Estonya", "Esvatini", "Etiyopya", "Fas", "Fiji", "Fildişi Sahili", "Filipinler", "Filistin", "Finlandiya", "Fransa", "Gabon", "Gambiya", "Gana", "Gine", "Gine-Bissau", "Grenada", "Guyana", "Guatemala", "Güney Afrika", "Güney Kore", "Güney Sudan", "Gürcistan", "Haiti", "Hırvatistan", "Hindistan", "Hollanda", "Honduras", "Irak", "İran", "İrlanda", "İspanya", "İsrail", "İsveç", "İsviçre", "İtalya", "İzlanda", "Jamaika", "Japonya", "Kamboçya", "Kamerun", "Kanada", "Karadağ", "Katar", "Kazakistan", "Kenya", "Kıbrıs", "Kırgızistan", "Kiribati", "Kolombiya", "Komorlar", "Kongo", "Kongo Demokratik Cumhuriyeti", "Kosta Rika", "Kuveyt", "Kuzey Kore", "Kuzey Makedonya", "Küba", "Laos", "Letonya", "Liberya", "Libya", "Lihtenştayn", "Litvanya", "Lübnan", "Lüksemburg", "Macaristan", "Madagaskar", "Malavi", "Maldivler", "Malezya", "Mali", "Malta", "Marshall Adaları", "Meksika", "Mısır", "Mikronezya", "Moğolistan", "Moldova", "Monako", "Moritanya", "Morityus", "Mozambik", "Myanmar", "Namibya", "Nauru", "Nepal", "Nijer", "Nijerya", "Nikaragua", "Norveç", "Orta Afrika Cumhuriyeti", "Özbekistan", "Pakistan", "Palau", "Panama", "Papua Yeni Gine", "Paraguay", "Peru", "Polonya", "Portekiz", "Romanya", "Ruanda", "Rusya", "Saint Kitts ve Nevis", "Saint Lucia", "Saint Vincent ve Grenadinler", "Samoa", "San Marino", "Sao Tome ve Principe", "Senegal", "Seyşeller", "Sırbistan", "Sierra Leone", "Singapur", "Slovakya", "Slovenya", "Solomon Adaları", "Somali", "Sri Lanka", "Sudan", "Surinam", "Suriye", "Suudi Arabistan", "Şili", "Tacikistan", "Tanzanya", "Tayland", "Togo", "Tonga", "Trinidad ve Tobago", "Tunus", "Tuvalu", "Türkmenistan", "Uganda", "Ukrayna", "Umman", "Uruguay", "Ürdün", "Vanuatu", "Vatikan", "Venezuela", "Vietnam", "Yemen", "Yeni Zelanda", "Yunanistan", "Zambiya", "Zimbabve"
];

export const allProvinces = [
  "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Aksaray", "Amasya", "Ankara", "Antalya", "Ardahan", "Artvin", "Aydın", "Balıkesir", "Bartın", "Batman", "Bayburt", "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa", "Çanakkale", "Çankırı", "Çorum", "Denizli", "Diyarbakır", "Düzce", "Edirne", "Elazığ", "Erzincan", "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkâri", "Hatay", "Iğdır", "Isparta", "İstanbul", "İzmir", "Kahramanmaraş", "Karabük", "Karaman", "Kars", "Kastamonu", "Kayseri", "Kırıkkale", "Kırklareli", "Kırşehir", "Kilis", "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Mardin", "Mersin", "Muğla", "Muş", "Nevşehir", "Niğde", "Ordu", "Osmaniye", "Rize", "Sakarya", "Samsun", "Siirt", "Sinop", "Sivas", "Şanlıurfa", "Şırnak", "Tekirdağ", "Tokat", "Trabzon", "Tunceli", "Uşak", "Van", "Yalova", "Yozgat", "Zonguldak"
];

export const districtsData: { [key: string]: string[] } = {
  "Adana": ["Aladağ", "Ceyhan", "Çukurova", "Feke", "İmamoğlu", "Karaisalı", "Karataş", "Kozan", "Pozantı", "Saimbeyli", "Sarıçam", "Seyhan", "Tufanbeyli", "Yumurtalık", "Yüreğir"],
  "Ankara": ["Akyurt", "Altındağ", "Ayaş", "Balâ", "Beypazarı", "Çamlıdere", "Çankaya", "Çubuk", "Elmadağ", "Etimesgut", "Evren", "Gölbaşı", "Güdül", "Haymana", "Kahramankazan", "Kalecik", "Keçiören", "Kızılcahamam", "Mamak", "Nallıhan", "Polatlı", "Pursaklar", "Sincan", "Şereflikoçhisar", "Yenimahalle"],
  "Antalya": ["Akseki", "Aksu", "Alanya", "Demre", "Döşemealtı", "Elmalı", "Finike", "Gazipaşa", "Gündoğmuş", "İbradı", "Kaş", "Kemer", "Kepez", "Konyaaltı", "Korkuteli", "Kumluca", "Manavgat", "Muratpaşa", "Serik"],
  "İstanbul": ["Adalar", "Arnavutköy", "Ataşehir", "Avcılar", "Bağcılar", "Bahçelievler", "Bakırköy", "Başakşehir", "Bayrampaşa", "Beşiktaş", "Beykoz", "Beylikdüzü", "Beyoğlu", "Büyükçekmece", "Çatalca", "Çekmeköy", "Esenler", "Esenyurt", "Eyüpsultan", "Fatih", "Gaziosmanpaşa", "Güngören", "Kadıköy", "Kâğıthane", "Kartal", "Küçükçekmece", "Maltepe", "Pendik", "Sancaktepe", "Sarıyer", "Silivri", "Sultanbeyli", "Sultangazi", "Şile", "Şişli", "Tuzla", "Ümraniye", "Üsküdar", "Zeytinburnu"],
  "İzmir": ["Aliağa", "Balçova", "Bayındır", "Bayraklı", "Bergama", "Beydağ", "Bornova", "Buca", "Çeşme", "Çiğli", "Dikili", "Foça", "Gaziemir", "Güzelbahçe", "Karabağlar", "Karaburun", "Karşıyaka", "Kemalpaşa", "Kınık", "Kiraz", "Konak", "Menderes", "Menemen", "Narlıdere", "Ödemiş", "Seferihisar", "Selçuk", "Tire", "Torbalı", "Urla"],
};

export const neighborhoodsData: { [city: string]: { [district: string]: string[] } } = {
  "İstanbul": {
    "Kadıköy": ["Caferağa", "Osmanağa", "Rasimpaşa", "Moda", "Fenerbahçe", "Caddebostan", "Suadiye", "Göztepe", "Erenköy", "Bostancı"],
    "Beşiktaş": ["Bebek", "Etiler", "Levazım", "Ortaköy", "Vişnezade"],
    "Üsküdar": ["Acıbadem", "Altunizade", "Beylerbeyi", "Çengelköy", "Kuzguncuk"]
  }
};

export const globalCitiesData: { [country: string]: string[] } = {
  "Almanya": ["Berlin", "Münih", "Frankfurt", "Hamburg", "Köln"],
  "ABD": ["New York", "California", "Texas", "Florida", "Illinois"],
  "Azerbaycan": ["Bakı", "Gence", "Sumqayıt"],
  "İngiltere": ["Londra", "Manchester", "Birmingham"]
};

export const globalDistrictsData: { [city: string]: string[] } = {
  "Berlin": ["Mitte", "Pankow", "Spandau"],
  "New York": ["Manhattan", "Brooklyn", "Queens"],
  "Bakı": ["Binəqədi", "Nəsimi", "Səbail"],
  "Londra": ["Westminster", "Camden"]
};

export const countryPhoneCodes = ["90", "1", "44", "49", "33", "994"];

export const allInterests = ['Hayvan Hakları', 'Çevre', 'Eğitim', 'Sağlık', 'Afet', 'Çocuk', 'Kadın Hakları', 'Kültür & Sanat', 'İnsan Hakları', 'Yoksullukla Mücadele'];
export const allSkills = ['Proje Yönetimi', 'Sosyal Medya Yönetimi', 'Grafik Tasarım', 'Web Geliştirme', 'Kaynak Geliştirme', 'Hukuki Danışmanlık', 'Tercümanlık', 'Fotoğrafçılık', 'Video Kurgu'];
export const allDailySkills = ['Yemek Yapma', 'Temizlik', 'El Becerileri', 'Organizasyon', 'İletişim'];
export const allLanguages = ['Türkçe', 'İngilizce', 'Almanca', 'Fransızca', 'Arapça', 'İspanyolca', 'Rusça', 'İşaret Dili'];
export const allPrograms = ['MS Office', 'Google Workspace', 'Figma', 'Adobe Photoshop', 'Adobe Premiere', 'VS Code', 'Docker', 'Google Analytics'];
export const allLicenses = ['B Sınıfı Ehliyet', 'A Sınıfı Ehliyet', 'D Sınıfı Ehliyet'];
export const allDocuments = ['İlk Yardım Sertifikası', 'Hijyen Belgesi', 'Scrum Master Sertifikası', 'Pedagojik Formasyon', 'Afet Bilinci Eğitimi Sertifikası', 'SRC Belgesi'];
export const allVisas = ['Schengen', 'ABD (B1/B2)', 'İngiltere', 'Kanada'];
export const allSectors = ['Teknoloji', 'Eğitim', 'Sağlık', 'Finans', 'Üretim', 'Hizmet', 'Sivil Toplum', 'Diğer'];
export const allPositions = ['Yazılım Geliştirici', 'Proje Müdürü', 'Tasarımcı', 'Pazarlama Uzmanı', 'Satış Temsilcisi', 'İnsan Kaynakları', 'Öğrenci', 'Stajyer', 'Emekli', 'Diğer'];

export const allUniversities = [
  "Boğaziçi Üniversitesi",
  "İstanbul Teknik Üniversitesi",
  "Orta Doğu Teknik Üniversitesi",
  "Yıldız Teknik Üniversitesi",
  "Marmara Üniversitesi",
  "Koç Üniversitesi",
  "Sabancı Üniversitesi",
  "Hacettepe Üniversitesi",
  "Bilkent Üniversitesi",
  "Ankara Üniversitesi",
  "Ege Üniversitesi",
  "Dokuz Eylül Üniversitesi",
  "Galatasaray Üniversitesi",
  "İstanbul Üniversitesi",
  "Akdeniz Üniversitesi",
  "Gazi Üniversitesi",
  "Çukurova Üniversitesi",
  "Anadolu Üniversitesi",
  "Selçuk Üniversitesi",
  "Erciyes Üniversitesi"
];

export const user: User = {
    id: '1',
    name: 'İsmail Hilmi ADIGÜZEL',
    username: '@ismailhilmicom',
    avatarUrl: 'https://images.unsplash.com/photo-1521119989659-a83eee488004?q=80&w=1080',
    coverPhotoUrl: 'https://images.unsplash.com/photo-1693902939226-449195d2698b?q=80&w=1080',
    impactScore: 15750,
    personalInfo: {
        email: 'ihadiguzel@gmail.com',
        phone: '5547007007',
        birthDate: '1993-05-21',
        gender: 'Erkek',
        nationality: 'Türkiye Cumhuriyeti',
        bloodType: '0 Rh+',
        address: { country: 'Türkiye', city: 'İstanbul', district: 'Kadıköy', neighborhood: 'Caferağa', fullAddress: 'Caferağa Mah. Moda Cad. No: 123 D:4' },
        website: 'https://ismailhilmi.com',
        social: { linkedin: 'ismailhilmi', github: 'ismailhilmi', instagram: 'ismailhilmi', twitter: 'ismailhilmi' }
    },
    volunteerInfo: {
        skills: ['Proje Yönetimi', 'Sosyal Medya Yönetimi', 'Yazılım Geliştirme'],
        dailySkills: ['Organizasyon', 'İletişim'],
        interests: ['Çevre', 'Eğitim', 'Sosyal Girişimcilik'],
        education: [{ level: 'Lisans', school: 'Boğaziçi Üniversitesi' }],
        profession: 'Yazılım Geliştirici',
        languages: ['Türkçe', 'İngilizce'],
        programs: ['VS Code', 'Figma'],
        licenses: ['B Sınıfı Ehliyet'],
        documents: ['İlk Yardım Sertifikası'],
        travelInfo: { domesticObstacle: false, internationalObstacle: false, visas: ['Schengen'] },
        emergency: { available: true, hasChronicIllness: false, usesRegularMedication: false, hasPhysicalLimitation: false, emergencyContacts: [{ name: "Ayşe Yılmaz", phone: "+90 555 987 65 43" }] }
    },
    stats: {
        totalDonation: 1250, donationCount: 42, highestSingleDonation: 150, supportedNgosCount: 7, mostSupportedNgo: 'TEMA Vakfı', avgDonation: 29.76, volunteerHours: 48, completedProjects: 5, volunteerRank: { country: 'İlk %5', city: 'İlk %2', school: 'İlk %1', interest: 'İlk %10' }, mostActiveVolunteerArea: 'Hayvan Hakları', avgVolunteerDuration: '3 Hafta', totalImpactValue: 25000
    },
    progress: { 'Çevre': 80 }
};

export const ngos: NGO[] = [
    { id: 'ngo-1', name: 'Ahbap Derneği', category: 'Dayanışma', type: 'Dernek', avatarUrl: 'https://logo.clearbit.com/ahbap.org', coverPhotoUrl: 'https://picsum.photos/seed/ahbap/1200/400', stats: { followers: 500000, donors: 200000, volunteers: 100000, volunteerHours: 1000000, projects: 1200, totalDonation: 50000000, donationCount: 1000000, avgDonation: 50, highestSingleDonation: 5000, peopleReached: 2000000 }, transparencyScore: 98, about: "Yardımlaşma ve dayanışma hareketi.", joinDate: "2023-01-01", supportedSDGs: ['1. Yoksulluğa Son'], beneficiaryGroups: ['İhtiyaç Sahipleri'], memberOf: ['Afet Platformu'], contact: { email: 'iletisim@ahbap.org', phone: '0850 123 45 67', website: 'https://ahbap.org', social: { twitter: 'ahbap', instagram: 'ahbap', facebook: 'ahbap', linkedin: 'ahbap' }, address: { fullAddress: 'Caferağa Mah. Moda Cad. No: 123 D:4', city: 'İstanbul', district: 'Kadıköy' } }, posts: [], opportunities: [] },
    { id: 'ngo-2', name: 'ÇYDD', category: 'Eğitim', type: 'Dernek', avatarUrl: 'https://logo.clearbit.com/cydd.org.tr', coverPhotoUrl: 'https://picsum.photos/seed/cydd/1200/400', stats: { followers: 150000, donors: 80000, volunteers: 40000, volunteerHours: 200000, projects: 500, totalDonation: 15000000, donationCount: 200000, avgDonation: 75, highestSingleDonation: 10000, peopleReached: 500000 }, transparencyScore: 95, about: "Çağdaş yaşamı destekleme derneği.", joinDate: "2023-01-01", supportedSDGs: ['4. Nitelikli Eğitim'], beneficiaryGroups: ['Öğrenciler'], memberOf: [], contact: { email: 'iletisim@cydd.org.tr', phone: '0212 123 45 67', website: 'https://cydd.org.tr', social: { twitter: 'cydd', instagram: 'cydd', facebook: 'cydd', linkedin: 'cydd' }, address: { fullAddress: 'Şişli', city: 'İstanbul', district: 'Şişli' } }, posts: [], opportunities: [] }
];

export const volunteeringOpportunities: Volunteering[] = Array.from({ length: 21 }, (_, i) => ({
    id: `opp-${i + 1}`,
    title: ["Afet Bölgesi Lojistik Destek", "Sokak Hayvanları Besleme", "Öğrencilere Matematik Kursu", "Huzurevi Müzik Dinletisi", "Deniz Kıyısı Temizliği", "Tercüme Desteği", "Ağaç Dikme Şenliği", "Afet Bilinci Eğitmenliği", "Dijital Kütüphane Kataloglama", "Gıda Kolisi Paketleme", "Kampüs Elçisi Programı", "Grafik Tasarım Desteği", "Hukuki Danışmanlık", "Yazılım Mentörlüğü", "İşaret Dili Atölyesi", "Sesli Kitap Okuma", "Kan Bağışı Organizasyonu", "İlk Yardım Yardımcılığı", "Müze Rehberliği", "Sürdürülebilirlik Analizi", "Veri Giriş Desteği"][i % 21],
    organization: ngos[i % ngos.length].name,
    ngoId: ngos[i % ngos.length].id,
    location: { city: ["İstanbul", "Ankara", "İzmir", "Hatay", "Online"][i % 5], district: "Genel", type: (i % 3 === 0 ? 'Online' : i % 3 === 1 ? 'Saha' : 'Hibrit') as any },
    commitment: ["Tek Günlük", "Dönemsel", "Sürekli"][i % 3],
    volunteerCount: { needed: 10 + i, applications: 2 + i },
    dates: { applicationStart: "2024-01-01", applicationEnd: "2025-12-31", eventStart: "2025-01-01", eventEnd: "2025-12-31" },
    hours: { start: "09:00", end: "17:00", total: 8 },
    socialArea: ngos[i % ngos.length].category,
    points: 100 + (i * 50),
    ngoTransparencyScore: ngos[i % ngos.length].transparencyScore,
    taskType: ["Tek Gün", "Dönemsel", "Sürekli"][i % 3] as any,
    providesCertificate: i % 2 === 0,
    earnedBadges: ["Rozet"],
    hasPreTraining: i % 4 === 0,
    description: "Topluma fayda sağlayacak bu projede yer alarak etki oluşturun.",
    amenities: { transport: i % 2 === 0, food: true, accommodation: i % 10 === 0 }
}));

export const studentClubs: StudentClub[] = Array.from({ length: 10 }, (_, i) => ({
    id: `club-${i + 1}`,
    name: i < 5 ? `${['İTÜ', 'Boğaziçi', 'ODTÜ', 'Marmara', 'YTÜ'][i]} Girişimcilik Kulübü` : `${['Kabataş', 'IEL', 'GSL', 'CAL', 'KAL'][i-5]} Sosyal Yardımlaşma`,
    university: i < 5 ? ['İstanbul Teknik Üniversitesi', 'Boğaziçi Üniversitesi', 'Orta Doğu Teknik Üniversitesi', 'Marmara Üniversitesi', 'Yıldız Teknik Üniversitesi'][i] : ['Kabataş Erkek Lisesi', 'İstanbul Erkek Lisesi', 'Galatasaray Lisesi', 'Cağaloğlu Anadolu Lisesi', 'Kadıköy Anadolu Lisesi'][i-5],
    type: i < 5 ? 'university' : 'high-school',
    avatarUrl: `https://picsum.photos/seed/club${i}/200/200`,
    coverPhotoUrl: `https://picsum.photos/seed/clubcover${i}/1200/400`,
    members: 150 + (i * 100),
    points: 5000 + (i * 2000),
    description: 'Etki odaklı bir student topluluğu.',
    vision: 'Değişimin kampüsteki adı olmak.',
    joinDate: '2023-01-01',
    contact: { email: `iletisim@club${i}.edu.tr`, phone: '0212 123 45 67', website: `https://club${i}.edu.tr` }
}));

export const events: Event[] = Array.from({ length: 5 }, (_, i) => ({
    id: `event-${i + 1}`,
    slug: `etkinlik-${i + 1}`,
    name: ['Girişimcilik Zirvesi', 'Dayanışma Konseri', 'Robotik Günleri', 'Kan Bağışı Kampanyası', 'İklim Krizi Çalıştayı'][i],
    organizer: i < 3 ? studentClubs[i].name : ngos[i % ngos.length].name,
    type: ['Zirve', 'Konser', 'Yarışma', 'Kampanya', 'Çalıştay'][i],
    date: '2024-12-01',
    startDate: '2024-12-01 09:00',
    endDate: '2024-12-01 18:00',
    location: { type: 'Fiziksel', address: 'Ana Kampüs', city: 'İstanbul', district: 'Sarıyer' },
    language: 'Türkçe',
    participationCondition: 'Herkese Açık',
    capacity: { current: 100, max: 500 },
    tags: ['Etki', 'Gençlik'],
    imageUrl: `https://picsum.photos/seed/evposter${i}/600/850`,
    description: 'Toplumsal farkındalık için düzenlenen özel bir etkinlik.',
    providesCertificate: i % 2 === 0
}));

export const certificates: Certificate[] = Array.from({ length: 5 }, (_, i) => ({
    id: `cert-${i + 1}`,
    title: ['Gönüllülük Liderliği', 'Sosyal Etki Uzmanı', 'Afet Müdahale Eğitimi', 'Proje Yönetimi Başarı Belgesi', 'Dijital Okuryazarlık'][i],
    organization: i < 3 ? 'hangel Akademi' : 'Social Business Global',
    date: '2024-05-20',
    linkedinUrl: 'https://linkedin.com/'
}));

export const allEntityLists: Brand[] = [
    { id: 'brand-1', slug: 'tripcom', name: 'Trip.com', donationRate: 2, logoUrl: 'https://logo.clearbit.com/trip.com', type: 'brand', category: 'Seyahat', about: 'Global seyahat platformu.' },
    { id: 'brand-2', slug: 'pazarama', name: 'Pazarama', donationRate: 2, logoUrl: 'https://logo.clearbit.com/pazarama.com', type: 'brand', category: 'Pazar Yeri', about: 'Türkiye\'nin güvenilir pazar yeri.' },
    { id: 'brand-3', slug: 'karaca', name: 'Karaca', donationRate: 3, logoUrl: 'https://logo.clearbit.com/karaca.com', type: 'brand', category: 'Ev & Yaşam', about: 'Mutfak ve ev tekstili ürünleri.' }
];

export const marketCategories: MarketCategory[] = [
    { mainCategory: 'Tümü', subCategories: [] },
    { mainCategory: 'Pazar Yeri', subCategories: [{ name: 'Genel', imageUrl: '' }] },
    { mainCategory: 'Giyim', subCategories: [{ name: 'Spor', imageUrl: '' }] },
    { mainCategory: 'Seyahat', subCategories: [{ name: 'Bilet', imageUrl: '' }] },
    { mainCategory: 'Ev & Yaşam', subCategories: [{ name: 'Mutfak', imageUrl: '' }] }
];

export const badges: Badge[] = [
    { id: "1", name: "Çevre Koruyucusu", level: "Bronz", iconName: Leaf, socialArea: "Çevre", pointsRequired: 500, currentPoints: 800 }
];

export const managedItems: ManagedItem[] = [
    { name: "Ahbap Derneği", type: "STK", icon: "heart", status: "approved", href: "/ngo-admin/dashboard" }
];

export const qrPaymentCardData = [
    { id: '1', type: 'Standart', balance: '1,250.00 ₺', number: '**** **** **** 1234', owner: 'İsmail Hilmi ADIGÜZEL', bgColor: 'bg-gradient-to-br from-primary to-orange-600', status: 'Aktif' }
];

export const helpTopics: HelpTopic[] = [
    { icon: 'user', title: 'Bireysel Kullanıcılar', slug: 'bireysel-kullanicilar', description: 'Uygulama kullanımı.', subtopics: [] }
];

export const ngoHelpTopics = helpTopics;
export const ngoFaqArticles = [];
export const pastVolunteering = [];
export const schoolRepresentatives: SchoolRepresentative[] = [];
export const adBanners: AdBanner[] = [
    { id: '1', title: 'Okul Alışverişiyle Destek Ol', description: 'Kırtasiye ihtiyaçlarını TEGV\'e bağışla.', imageUrl: 'https://picsum.photos/seed/ad1/800/400', link: '/market' }
];
export const timelinePosts: Post[] = [
    { id: '1', author: { name: 'Ahbap Derneği', avatarUrl: 'https://logo.clearbit.com/ahbap.org' }, content: 'Birlikte daha güçlüyüz!', timestamp: '2 saat önce', likes: 1250, comments: 45 }
];
export const provincialDirectorates = ["İstanbul", "Ankara"];
export const sportsFederations = ["TFF", "TBF", "TVF", "THF", "THK"];
