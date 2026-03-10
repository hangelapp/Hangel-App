
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
    Briefcase
} from 'lucide-react';
import type { User, NGO, Brand, Volunteering, Badge, Certificate, ManagedItem, AdBanner, HelpTopic, MarketCategory, StudentClub, Event, SchoolRepresentative, Application, DonationTransaction } from './types';

// --- Türkiye İl Listesi ---
export const allProvinces = [
  "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Aksaray", "Amasya", "Ankara", "Antalya", "Ardahan", "Artvin", "Aydın", "Balıkesir", "Bartın", "Batman", "Bayburt", "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa", "Çanakkale", "Çankırı", "Çorum", "Denizli", "Diyarbakır", "Düzce", "Edirne", "Elazığ", "Erzincan", "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkâri", "Hatay", "Iğdır", "Isparta", "İstanbul", "İzmir", "Kahramanmaraş", "Karabük", "Karaman", "Kars", "Kastamonu", "Kayseri", "Kırıkkale", "Kırklareli", "Kırşehir", "Kilis", "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Mardin", "Mersin", "Muğla", "Muş", "Nevşehir", "Niğde", "Ordu", "Osmaniye", "Rize", "Sakarya", "Samsun", "Siirt", "Sinop", "Sivas", "Şanlıurfa", "Şırnak", "Tekirdağ", "Tokat", "Trabzon", "Tunceli", "Uşak", "Van", "Yalova", "Yozgat", "Zonguldak"
];

// --- Türkiye İlçe Verileri ---
export const districtsData: { [key: string]: string[] } = {
  "Adana": ["Aladağ", "Ceyhan", "Çukurova", "Feke", "İmamoğlu", "Karaisalı", "Karataş", "Kozan", "Pozantı", "Saimbeyli", "Sarıçam", "Seyhan", "Tufanbeyli", "Yumurtalık", "Yüreğir"],
  "Ankara": ["Akyurt", "Altındağ", "Ayaş", "Balâ", "Beypazarı", "Çamlıdere", "Çankaya", "Çubuk", "Elmadağ", "Etimesgut", "Evren", "Gölbaşı", "Güdül", "Haymana", "Kahramankazan", "Kalecik", "Keçiören", "Kızılcahamam", "Mamak", "Nallıhan", "Polatlı", "Pursaklar", "Sincan", "Şereflikoçhisar", "Yenimahalle"],
  "Antalya": ["Akseki", "Aksu", "Alanya", "Demre", "Döşemealtı", "Elmalı", "Finike", "Gazipaşa", "Gündoğmuş", "İbradı", "Kaş", "Kemer", "Kepez", "Konyaaltı", "Korkuteli", "Kumluca", "Manavgat", "Muratpaşa", "Serik"],
  "Bursa": ["Büyükorhan", "Gemlik", "Gürsu", "Harmancık", "İnegöl", "İznik", "Karacabey", "Keles", "Kestel", "Mudanya", "Mustafakemalpaşa", "Nilüfer", "Orhaneli", "Orhangazi", "Osmangazi", "Yenişehir", "Yıldırım"],
  "İstanbul": ["Adalar", "Arnavutköy", "Ataşehir", "Avcılar", "Bağcılar", "Bahçelievler", "Bakırköy", "Başakşehir", "Bayrampaşa", "Beşiktaş", "Beykoz", "Beylikdüzü", "Beyoğlu", "Büyükçekmece", "Çatalca", "Çekmeköy", "Esenler", "Esenyurt", "Eyüpsultan", "Fatih", "Gaziosmanpaşa", "Güngören", "Kadıköy", "Kâğıthane", "Kartal", "Küçükçekmece", "Maltepe", "Pendik", "Sancaktepe", "Sarıyer", "Silivri", "Sultanbeyli", "Sultangazi", "Şile", "Şişli", "Tuzla", "Ümraniye", "Üsküdar", "Zeytinburnu"],
  "İzmir": ["Aliağa", "Balçova", "Bayındır", "Bayraklı", "Bergama", "Beydağ", "Bornova", "Buca", "Çeşme", "Çiğli", "Dikili", "Foça", "Gaziemir", "Güzelbahçe", "Karabağlar", "Karaburun", "Karşıyaka", "Kemalpaşa", "Kınık", "Kiraz", "Konak", "Menderes", "Menemen", "Narlıdere", "Ödemiş", "Seferihisar", "Selçuk", "Tire", "Torbalı", "Urla"]
};

// --- Mahalle Verileri ---
export const neighborhoodsData: { [city: string]: { [district: string]: string[] } } = {
  "İstanbul": {
    "Kadıköy": ["Caferağa", "Osmanağa", "Rasimpaşa", "Moda", "Fenerbahçe", "Caddebostan", "Suadiye", "Göztepe", "Erenköy", "Bostancı"],
    "Beşiktaş": ["Bebek", "Etiler", "Levazım", "Ortaköy", "Vişnezade", "Abbasağa", "Akatlar", "Arnavutköy", "Balmumcu", "Gayrettepe"],
    "Üsküdar": ["Acıbadem", "Altunizade", "Beylerbeyi", "Çengelköy", "Kandilli", "Kuzguncuk", "Salacak", "Yavuztürk"]
  },
  "Ankara": {
    "Çankaya": ["Bahçelievler", "Kavaklıdere", "Kızılay", "Ayrancı", "Anıttepe", "Dikmen", "Ümitköy", "Yaşamkent"],
    "Yenimahalle": ["Batıkent", "Demetevler", "Şentepe", "Varlık", "İvedik"]
  }
};

// --- Global Veriler ---
export const globalCitiesData: { [country: string]: string[] } = {
  "Almanya": ["Bavyera", "Berlin", "Hamburg", "Münih", "Frankfurt"],
  "ABD": ["California", "New York", "Texas", "Florida", "Illinois"],
  "Azerbaycan": ["Bakı", "Gence", "Sumqayıt", "Lənkəran"],
  "İngiltere": ["Londra", "Manchester", "Birmingham", "Liverpool"]
};

export const globalDistrictsData: { [city: string]: string[] } = {
  "Berlin": ["Mitte", "Pankow", "Spandau"],
  "New York": ["Manhattan", "Brooklyn", "Queens"],
  "Bakı": ["Binəqədi", "Nəsimi", "Səbail"],
  "Londra": ["Westminster", "Camden", "Hackney"]
};

export const countryPhoneCodes = ["90", "1", "44", "49", "33", "994"];

// --- Genişletilmiş Listeler ---
export const allInterests = ['Hayvan Hakları', 'Çevre & İklim', 'Eğitim', 'Sağlık & Psikoloji', 'Afet Müdahale', 'Çocuk Gelişimi', 'Kadın Hakları', 'Kültür & Sanat', 'İnsan Hakları', 'Yoksullukla Mücadele', 'Gençlik Çalışmaları', 'Engelli Hakları', 'Mülteci Hakları', 'Teknoloji & İnovasyon'];

export const allSkills = ['Proje Yönetimi', 'Sosyal Medya Yönetimi', 'Grafik Tasarım', 'Web Geliştirme', 'Kaynak Geliştirme (Fundraising)', 'Hukuki Danışmanlık', 'Tercümanlık', 'Fotoğrafçılık', 'Video Kurgu', 'Stratejik Planlama', 'Gönüllü Yönetimi', 'Kurumsal İletişim', 'Etkinlik Organizasyonu', 'Finansal Analiz', 'Veri Analizi', 'Eğitimcilik', 'İlk Yardım', 'Psikososyal Destek'];

export const allDailySkills = ['Yemek Yapma', 'Temizlik', 'El Becerileri', 'Organizasyon', 'İletişim', 'Tamirat', 'Bahçe İşleri', 'Çocuk Bakımı', 'Sürücülük', 'Alışveriş Refakati', 'Hayvan Bakımı', 'Ofis Desteği'];

export const allLanguages = ['Türkçe', 'İngilizce', 'Almanca', 'Fransızca', 'Arapça', 'İspanyolca', 'Rusça', 'İtalyanca', 'Çince', 'Japonca', 'İşaret Dili', 'Kürtçe', 'Zazaca', 'Azerbaycan Türkçesi', 'Farsça'];

export const allPrograms = ['MS Office (Word, Excel, PowerPoint)', 'Google Workspace', 'Figma', 'Adobe Photoshop', 'Adobe Premiere', 'Adobe Illustrator', 'InDesign', 'VS Code', 'Docker', 'Google Analytics', 'WordPress', 'Canva', 'Trello/Asana/Jira', 'Zoom/Teams/Meet', 'Python', 'SQL', 'SAP', 'Salesforce'];

export const allLicenses = ['B Sınıfı Ehliyet', 'A Sınıfı Ehliyet', 'C Sınıfı Ehliyet', 'SRC Belgesi', 'İş Güvenliği Uzmanlığı (A/B/C)', 'Profesyonel Turist Rehberi Kokartı', 'Amatör Telsizcilik Belgesi', 'İHA Ticari Pilot Lisansı', 'Gemiadamı Cüzdanı'];

export const allDocuments = ['İlk Yardım Sertifikası (Onaylı)', 'Hijyen Belgesi', 'Scrum Master / Agile Sertifikası', 'Pedagojik Formasyon', 'Afet Bilinci Eğitimi Sertifikası', 'Gıda Güvenliği Belgesi', 'Yabancı Dil Yeterlilik Belgesi (YDS/TOEFL)', 'Sabıka Kaydı (Temiz)', 'Sağlık Raporu (Gönüllülüğe Engel Yok)'];

export const allVisas = ['Schengen (AB)', 'ABD (B1/B2)', 'Birleşik Krallık (İngiltere)', 'Kanada', 'Avustralya', 'Çin', 'Rusya', 'Hindistan', 'Yeşil Pasaport (Hizmet)', 'Gri Pasaport', 'Diplomatik Pasaport'];

export const allSectors = ['Teknoloji', 'Sağlık', 'Eğitim', 'Finans & Bankacılık', 'Sanat ve Kültür', 'Hukuk', 'Kamu Sektörü', 'Perakende & E-ticaret', 'Turizm & Otelcilik', 'Gıda & Tarım', 'İnşaat & Gayrimenkul', 'Lojistik & Nakliye', 'Enerji', 'STK / Sivil Toplum', 'Medya & Reklamcılık', 'Tekstil & Moda'];

export const allPositions = ['Yazılım Geliştirici', 'Sistem Analisti', 'Doktor', 'Hemşire', 'Öğretmen', 'Akademisyen', 'Avukat', 'Hukuk Müşaviri', 'Grafik Tasarımcı', 'Art Direktör', 'Proje Yöneticisi', 'Pazarlama Uzmanı', 'Satış Temsilcisi', 'İnsan Kaynakları Uzmanı', 'Muhasebeci / Mali Müşavir', 'Mühendis (İnşaat/Makine/Elektrik vb.)', 'Mimar', 'Öğrenci', 'Emekli', 'Serbest Çalışan (Freelancer)', 'İşsiz / İş Arayan', 'Ev Hanımı / Beyi', 'CEO / Üst Düzey Yönetici'];

export const allUniversities = [
    'Boğaziçi Üniversitesi', 'İstanbul Teknik Üniversitesi (İTÜ)', 'Orta Doğu Teknik Üniversitesi (ODTÜ)', 'Galatasaray Üniversitesi', 'Koç Üniversitesi', 'Sabancı Üniversitesi', 'Hacettepe Üniversitesi', 'Bilkent Üniversitesi', 'İstanbul Üniversitesi', 'Yıldız Teknik Üniversitesi', 'Ankara Üniversitesi', 'Ege Üniversitesi', 'Dokuz Eylül Üniversitesi', 'Marmara Üniversitesi', 'Anadolu Üniversitesi', 'Akdeniz Üniversitesi', 'Bursa Uludağ Üniversitesi', 'Çukurova Üniversitesi', 'Gazi Üniversitesi', 'Gebze Teknik Üniversitesi', 'İzmir Yüksek Teknoloji Enstitüsü', 'Bahçeşehir Üniversitesi', 'Özyeğin Üniversitesi', 'Yeditepe Üniversitesi', 'Kadir Has Üniversitesi', 'MEF Üniversitesi', 'Bilgi Üniversitesi'
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
    {
        id: '1',
        name: 'TEMA Vakfı',
        category: 'Çevre',
        type: 'Vakıf',
        avatarUrl: 'https://logo.clearbit.com/tema.org.tr',
        coverPhotoUrl: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?q=80&w=2041&auto=format&fit=crop',
        stats: { followers: 120000, donors: 50000, volunteers: 80000, volunteerHours: 250000, projects: 150, totalDonation: 1500000, donationCount: 65000, avgDonation: 23.07, highestSingleDonation: 500, peopleReached: 500000 },
        transparencyScore: 92,
        about: "Türkiye Çöl Olmasın! TEMA Vakfı, ağaçlandırma ve erozyonla mücadele ederek Türkiye'nin topraklarını korumaktadır.",
        joinDate: "2023-01-10",
        supportedSDGs: ['İklim Eylemi', 'Karasal Yaşam', 'Sudaki Yaşam'],
        beneficiaryGroups: ['Çevre', 'Gelecek Nesiller'],
        memberOf: ['Açık Açık', 'Tüsev'],
        contact: { email: 'info@tema.org.tr', phone: '0212 292 69 69', website: 'https://tema.org.tr', social: { twitter: 'temavakfi', instagram: 'temavakfi', facebook: 'temavakfi', linkedin: 'tema' } },
        posts: [],
        opportunities: []
    },
    {
        id: '2',
        name: 'Uluslararası Sosyal Fayda Derneği',
        shortName: 'SBG',
        category: 'Dayanışma',
        type: 'Dernek',
        avatarUrl: 'https://logo.clearbit.com/socialbusinessglobal.org',
        coverPhotoUrl: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?q=80&w=2070&auto=format&fit=crop',
        stats: { followers: 850000, donors: 250000, volunteers: 150000, volunteerHours: 500000, projects: 500, totalDonation: 12500000, donationCount: 300000, avgDonation: 41.67, highestSingleDonation: 1000, peopleReached: 2000000 },
        transparencyScore: 95,
        about: "Uluslararası Sosyal Fayda Derneği (SBG), toplumsal yardımlaşmaya dayalı bir işbirliği hareketidir.",
        joinDate: "2023-02-20",
        supportedSDGs: ['Yoksulluğa Son', 'Nitelikli Eğitim', 'Amaçlar için Ortaklıklar'],
        beneficiaryGroups: ['İhtiyaç Sahipleri', 'Afetzedeler', 'Öğrenciler'],
        memberOf: ['Afet Platformu', 'Açık Açık'],
        contact: { email: 'info@socialbusinessglobal.org', phone: '0216 550 50 50', website: 'https://socialbusinessglobal.org', social: { twitter: 'socialbusinessglobal', instagram: 'socialbusinessglobal', facebook: 'socialbusinessglobal', linkedin: 'socialbusinessglobal' } },
        posts: [],
        opportunities: []
    }
];

export const allEntityLists: Brand[] = [
    { id: 'brand-1', slug: 'tripcom', name: 'Trip.com', donationRate: 2, logoUrl: 'https://logo.clearbit.com/trip.com', type: 'brand', category: 'Seyahat', about: 'Global seyahat platformu.' },
    { id: 'brand-2', slug: 'pazarama', name: 'Pazarama', donationRate: 2, logoUrl: 'https://logo.clearbit.com/pazarama.com', type: 'brand', category: 'Pazar Yeri', about: 'Türkiye\'nin güvenilir pazar yeri.' },
    { id: 'brand-3', slug: 'karaca', name: 'Karaca', donationRate: 3, logoUrl: 'https://logo.clearbit.com/karaca.com', type: 'brand', category: 'Ev & Yaşam', about: 'Mutfak ve ev tekstili ürünleri.' },
    { id: 'brand-22', slug: 'decathlon', name: 'Decathlon', donationRate: 2, logoUrl: 'https://logo.clearbit.com/decathlon.com.tr', type: 'brand', category: 'Giyim', about: 'Spor ekipmanları ve kıyafetleri.' },
    { id: 'brand-26', slug: 'amazontr', name: 'Amazon TR', donationRate: 13, logoUrl: 'https://logo.clearbit.com/amazon.com.tr', type: 'brand', category: 'Pazar Yeri', about: 'Dünyanın en büyük e-ticaret platformu.' }
];

export const marketCategories: MarketCategory[] = [
    { 
        mainCategory: 'Tümü', 
        subCategories: [] 
    },
    { 
        mainCategory: 'Pazar Yeri', 
        subCategories: [{ name: 'Genel', imageUrl: '' }] 
    },
    { 
        mainCategory: 'Giyim', 
        subCategories: [{ name: 'Spor', imageUrl: '' }, { name: 'Moda', imageUrl: '' }] 
    },
    { 
        mainCategory: 'Seyahat', 
        subCategories: [{ name: 'Bilet', imageUrl: '' }, { name: 'Konaklama', imageUrl: '' }] 
    },
    { 
        mainCategory: 'Ev & Yaşam', 
        subCategories: [{ name: 'Mutfak', imageUrl: '' }, { name: 'Dekorasyon', imageUrl: '' }] 
    }
];

export const volunteeringOpportunities: Volunteering[] = [
    {
        id: '1',
        title: "Afet Bölgesi Lojistik Destek",
        organization: "Uluslararası Sosyal Fayda Derneği",
        ngoId: "2",
        location: { city: "Hatay", district: "Antakya", type: "Saha" },
        commitment: "Dönemsel",
        volunteerCount: { needed: 50, applications: 120 },
        dates: { applicationStart: "2025-05-01", applicationEnd: "2026-05-21", eventStart: "2025-06-01", eventEnd: "2025-06-30" },
        hours: { start: "09:00", end: "18:00", total: 56 },
        socialArea: "Afet",
        points: 1500,
        ngoTransparencyScore: 95,
        taskType: "Dönemsel",
        providesCertificate: true,
        earnedBadges: ["Afet Kahramanı"],
        hasPreTraining: true,
        description: "Bölgedeki yardım kolilerinin tasnifi ve dağıtımında görev alacak gönüllüler arıyoruz.",
        amenities: { transport: true, food: true, accommodation: true }
    }
];

export const badges: Badge[] = [
    { id: "1", name: "Çevre Koruyucusu", level: "Bronz", iconName: Leaf, socialArea: "Çevre", pointsRequired: 500, currentPoints: 800 },
    { id: "2", name: "Çevre Koruyucusu", level: "Gümüş", iconName: Leaf, socialArea: "Çevre", pointsRequired: 1000, currentPoints: 800 }
];

export const certificates: Certificate[] = [
    { id: "cert1", title: "Gönüllülük Liderliği Sertifikası", organization: "hangel Akademi", date: "2024-05-20", linkedinUrl: "https://linkedin.com/" }
];

export const managedItems: ManagedItem[] = [
    { name: "Ahbap Derneği", type: "STK", icon: "heart", status: "approved", href: "/ngo-admin/dashboard" }
];

export const qrPaymentCardData = [
    { id: '1', type: 'Standart', balance: '1,250.00 ₺', number: '**** **** **** 1234', owner: 'İsmail Hilmi ADIGÜZEL', bgColor: 'bg-gradient-to-br from-primary to-orange-600', status: 'Aktif' },
    { id: '2', type: 'Öğrenci', balance: '0.00 ₺', number: '**** **** **** 5678', owner: 'İsmail Hilmi ADIGÜZEL', bgColor: 'bg-gradient-to-br from-blue-600 to-indigo-700', status: 'Aktif Değil' }
];

export const studentClubs: StudentClub[] = [
    { id: '1', name: 'İTÜ Girişimcilik Kulübü', university: 'İstanbul Teknik Üniversitesi', type: 'university', avatarUrl: 'https://logo.clearbit.com/itu.edu.tr', coverPhotoUrl: 'https://picsum.photos/seed/itu/1200/400', members: 1200, points: 15750, description: 'Girişimcilik ekosistemine yön veren öğrenci topluluğu.', vision: 'Türkiye\'nin en etkili öğrenci kulübü olmak.', joinDate: '2023-01-01', contact: { email: 'iletisim@itugirisim.org', phone: '0212 123 45 67', website: 'https://itugirisim.org' } }
];

export const events: Event[] = [
    { id: '1', slug: 'zirve-2024', name: 'Girişimcilik Zirvesi', organizer: 'İTÜ Girişimcilik Kulübü', type: 'Zirve', date: '2024-12-01', startDate: '2024-12-01 09:00', endDate: '2024-12-01 18:00', location: { type: 'Fiziksel', address: 'İTÜ SDK', city: 'İstanbul', district: 'Sarıyer' }, language: 'Türkçe', participationCondition: 'Herkese Açık', capacity: { current: 450, max: 500 }, tags: ['Girişimcilik', 'Teknoloji'], imageUrl: 'https://picsum.photos/seed/event1/800/400', description: 'Yılın en büyük öğrenci zirvesi.', providesCertificate: true }
];

export const helpTopics: HelpTopic[] = [
    { icon: 'user', title: 'Bireysel Kullanıcılar', slug: 'bireysel-kullanicilar', description: 'Uygulama kullanımı ve puanlarla ilgili yardım.', subtopics: [{ title: 'Puanlar nasıl kazanılır?', link: '#', content: 'Alışveriş ve gönüllülükle puan kazanırsınız.' }] }
];

export const ngoHelpTopics = helpTopics;
export const ngoFaqArticles = [{ title: 'Nasıl kayıt olunur?', content: 'Kayıt formunu doldurarak başlayabilirsiniz.' }];
export const pastVolunteering = [];
export const schoolRepresentatives: SchoolRepresentative[] = [];
export const adBanners: AdBanner[] = [
    { id: '1', title: 'Okul Alışverişiyle Destek Ol', description: 'Kırtasiye ihtiyaçlarını TEGV\'e bağışla.', imageUrl: 'https://picsum.photos/seed/ad1/800/400', link: '/market' }
];
export const applications: Application[] = [];
export const donationTransactions: DonationTransaction[] = [];
