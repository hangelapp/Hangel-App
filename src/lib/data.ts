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
  "Afganistan", "Almanya", "Amerika Birleşik Devletleri", "Andorra", "Angola", "Antigua ve Barbuda", "Arjantin", "Arnavutluk", "Avustralya", "Avusturya", "Azerbaycan", "Bahamalar", "Bahreyn", "Bangladeş", "Barbados", "Batı Sahra", "Belçika", "Belize", "Benin", "Beyaz Rusya", "Bhutan", "Birleşik Arap Emirlikleri", "Birleşik Krallık", "Bolivya", "Bosna Hersek", "Botsvana", "Brezilya", "Brunei", "Bulgaristan", "Burkina Faso", "Burundi", "Cezayir", "Cibuti", "Çad", "Çek Cumhuriyeti", "Çin", "Danimarka", "Doğu Timor", "Dominik Cumhuriyeti", "Dominika", "Ekvador", "Ekvator Ginesi", "El Salvador", "Endonezya", "Eritre", "Ermenistan", "Estonya", "Esvatini", "Etiyopya", "Fas", "Fiji", "Fildişi Sahili", "Filipinler", "Filistin", "Finlandiya", "Fransa", "Gabon", "Gambiya", "Gana", "Gine", "Gine-Bissau", "Grenada", "Guyana", "Guatemala", "Güney Afrika", "Güney Kore", "Güney Sudan", "Gürcistan", "Haiti", "Hırvatistan", "Hindistan", "Hollanda", "Honduras", "Irak", "İran", "İrlanda", "İspanya", "İsrail", "İsveç", "İsviçre", "İtalya", "İzlanda", "Jamaika", "Japonya", "Kamboçya", "Kamerun", "Kanada", "Karadağ", "Katar", "Kazakistan", "Kenya", "Kıbrıs", "Kırgızistan", "Kiribati", "Kolombiya", "Komorlar", "Kongo", "Kongo Demokratik Cumhuriyeti", "Kosta Rika", "Kuveyt", "Kuzey Kore", "Kuzey Makedonya", "Küba", "Laos", "Letonya", "Liberya", "Libya", "Lihtenştayn", "Litvanya", "Lübnan", "Lüksemburg", "Macaristan", "Madagaskar", "Malavi", "Maldivler", "Malezya", "Mali", "Malta", "Marshall Adaları", "Meksika", "Mısır", "Mikronezya", "Moğolistan", "Moldova", "Monako", "Moritanya", "Morityus", "Mozambik", "Myanmar", "Namibya", "Nauru", "Nepal", "Nijer", "Nijerya", "Nikaragua", "Norveç", "Orta Afrika Cumhuriyeti", "Özbekistan", "Pakistan", "Palau", "Panama", "Papua Yeni Gine", "Paraguay", "Peru", "Polonya", "Portekiz", "Romanya", "Ruanda", "Rusya", "Saint Kitts ve Nevis", "Saint Lucia", "Saint Vincent ve Grenadinler", "Samoa", "San Marino", "Sao Tome ve Principe", "Senegal", "Seyşeller", "Sırbistan", "Sierra Leone", "Singapur", "Slovakya", "Slovenya", "Solomon Adaları", "Somali", "Sri Lanka", "Sudan", "Surinam", "Suriye", "Suudi Arabistan", "Şili", "Tacikistan", "Tanzanya", "Tayland", "Togo", "Tonga", "Trinidad ve Tobago", "Tunus", "Tuvalu", "Türkiye", "Türkmenistan", "Uganda", "Ukrayna", "Umman", "Uruguay", "Ürdün", "Vanuatu", "Vatikan", "Venezuela", "Vietnam", "Yemen", "Yeni Zelanda", "Yunanistan", "Zambiya", "Zimbabve"
];

// --- Türkiye İl Listesi ---
export const allProvinces = [
  "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Aksaray", "Amasya", "Ankara", "Antalya", "Ardahan", "Artvin", "Aydın", "Balıkesir", "Bartın", "Batman", "Bayburt", "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa", "Çanakkale", "Çankırı", "Çorum", "Denizli", "Diyarbakır", "Düzce", "Edirne", "Elazığ", "Erzincan", "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkâri", "Hatay", "Iğdır", "Isparta", "İstanbul", "İzmir", "Kahramanmaraş", "Karabük", "Karaman", "Kars", "Kastamonu", "Kayseri", "Kırıkkale", "Kırklareli", "Kırşehir", "Kilis", "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Mardin", "Mersin", "Muğla", "Muş", "Nevşehir", "Niğde", "Ordu", "Osmaniye", "Rize", "Sakarya", "Samsun", "Siirt", "Sinop", "Sivas", "Şanlıurfa", "Şırnak", "Tekirdağ", "Tokat", "Trabzon", "Tunceli", "Uşak", "Van", "Yalova", "Yozgat", "Zonguldak"
];

// --- Türkiye İlçe Verileri ---
export const districtsData: { [key: string]: string[] } = {
  "Adana": ["Aladağ", "Ceyhan", "Çukurova", "Feke", "İmamoğlu", "Karaisalı", "Karataş", "Kozan", "Pozantı", "Saimbeyli", "Sarıçam", "Seyhan", "Tufanbeyli", "Yumurtalık", "Yüreğir"],
  "Ankara": ["Akyurt", "Altındağ", "Ayaş", "Balâ", "Beypazarı", "Çamlıdere", "Çankaya", "Çubuk", "Elmadağ", "Etimesgut", "Evren", "Gölbaşı", "Güdül", "Haymana", "Kahramankazan", "Kalecik", "Keçiören", "Kızılcahamam", "Mamak", "Nallıhan", "Polatlı", "Pursaklar", "Sincan", "Şereflikoçhisar", "Yenimahalle"],
  "Antalya": ["Akseki", "Aksu", "Alanya", "Demre", "Döşemealtı", "Elmalı", "Finike", "Gazipaşa", "Gündoğmuş", "İbradı", "Kaş", "Kemer", "Kepez", "Konyaaltı", "Korkuteli", "Kumluca", "Manavgat", "Muratpaşa", "Serik"],
  "İstanbul": ["Adalar", "Arnavutköy", "Ataşehir", "Avcılar", "Bağcılar", "Bahçelievler", "Bakırköy", "Başakşehir", "Bayrampaşa", "Beşiktaş", "Beykoz", "Beylikdüzü", "Beyoğlu", "Büyükçekmece", "Çatalca", "Çekmeköy", "Esenler", "Esenyurt", "Eyüpsultan", "Fatih", "Gaziosmanpaşa", "Güngören", "Kadıköy", "Kâğıthane", "Kartal", "Küçükçekmece", "Maltepe", "Pendik", "Sancaktepe", "Sarıyer", "Silivri", "Sultanbeyli", "Sultangazi", "Şile", "Şişli", "Tuzla", "Ümraniye", "Üsküdar", "Zeytinburnu"],
  "İzmir": ["Aliağa", "Balçova", "Bayındır", "Bayraklı", "Bergama", "Beydağ", "Bornova", "Buca", "Çeşme", "Çiğli", "Dikili", "Foça", "Gaziemir", "Güzelbahçe", "Karabağlar", "Karaburun", "Karşıyaka", "Kemalpaşa", "Kınık", "Kiraz", "Konak", "Menderes", "Menemen", "Narlıdere", "Ödemiş", "Seferihisar", "Selçuk", "Tire", "Torbalı", "Urla"],
};

// --- Mahalle Verileri ---
export const neighborhoodsData: { [city: string]: { [district: string]: string[] } } = {
  "İstanbul": {
    "Kadıköy": ["Caferağa", "Osmanağa", "Rasimpaşa", "Moda", "Fenerbahçe", "Caddebostan", "Suadiye", "Göztepe", "Erenköy", "Bostancı"],
    "Beşiktaş": ["Bebek", "Etiler", "Levazım", "Ortaköy", "Vişnezade"],
    "Üsküdar": ["Acıbadem", "Altunizade", "Beylerbeyi", "Çengelköy", "Kuzguncuk"]
  }
};

// --- Global Adres Verileri ---
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

// --- STK Listesi ---
export const ngos: NGO[] = [
    { id: 'ngo-1', name: 'Ahbap Derneği', category: 'Dayanışma', type: 'Dernek', avatarUrl: 'https://logo.clearbit.com/ahbap.org', coverPhotoUrl: 'https://picsum.photos/seed/ahbap/1200/400', stats: { followers: 500000, donors: 200000, volunteers: 100000, volunteerHours: 1000000, projects: 1200, totalDonation: 50000000, donationCount: 1000000, avgDonation: 50, highestSingleDonation: 5000, peopleReached: 2000000 }, transparencyScore: 98, about: "Yardımlaşma ve dayanışma hareketi.", joinDate: "2023-01-01", supportedSDGs: ['1. Yoksulluğa Son'], beneficiaryGroups: ['İhtiyaç Sahipleri'], memberOf: ['Afet Platformu'], contact: { email: 'iletisim@ahbap.org', phone: '0850 123 45 67', website: 'https://ahbap.org', social: { twitter: 'ahbap', instagram: 'ahbap', facebook: 'ahbap', linkedin: 'ahbap' } }, posts: [], opportunities: [] },
    { id: 'ngo-2', name: 'ÇYDD', category: 'Eğitim', type: 'Dernek', avatarUrl: 'https://logo.clearbit.com/cydd.org.tr', coverPhotoUrl: 'https://picsum.photos/seed/cydd/1200/400', stats: { followers: 150000, donors: 80000, volunteers: 40000, volunteerHours: 200000, projects: 500, totalDonation: 15000000, donationCount: 200000, avgDonation: 75, highestSingleDonation: 10000, peopleReached: 500000 }, transparencyScore: 95, about: "Çağdaş yaşamı destekleme derneği.", joinDate: "2023-01-01", supportedSDGs: ['4. Nitelikli Eğitim'], beneficiaryGroups: ['Öğrenciler'], memberOf: [], contact: { email: 'iletisim@cydd.org.tr', phone: '0212 123 45 67', website: 'https://cydd.org.tr', social: { twitter: 'cydd', instagram: 'cydd', facebook: 'cydd', linkedin: 'cydd' } }, posts: [], opportunities: [] },
    { id: 'ngo-3', name: 'AKUT', category: 'Arama Kurtarma', type: 'Dernek', avatarUrl: 'https://logo.clearbit.com/akut.org.tr', coverPhotoUrl: 'https://picsum.photos/seed/akut/1200/400', stats: { followers: 200000, donors: 50000, volunteers: 5000, volunteerHours: 150000, projects: 1000, totalDonation: 10000000, donationCount: 150000, avgDonation: 65, highestSingleDonation: 2500, peopleReached: 100000 }, transparencyScore: 92, about: "Arama kurtarma derneği.", joinDate: "2023-01-01", supportedSDGs: ['11. Sürdürülebilir Şehirler'], beneficiaryGroups: ['Afetzedeler'], memberOf: [], contact: { email: 'info@akut.org.tr', phone: '0212 212 12 12', website: 'https://akut.org.tr', social: { twitter: 'akut', instagram: 'akut', facebook: 'akut', linkedin: 'akut' } }, posts: [], opportunities: [] },
    { id: 'ngo-4', name: 'TOG', category: 'Gençlik', type: 'Dernek', avatarUrl: 'https://logo.clearbit.com/tog.org.tr', coverPhotoUrl: 'https://picsum.photos/seed/tog/1200/400', stats: { followers: 100000, donors: 30000, volunteers: 25000, volunteerHours: 180000, projects: 450, totalDonation: 8000000, donationCount: 100000, avgDonation: 80, highestSingleDonation: 5000, peopleReached: 300000 }, transparencyScore: 94, about: "Toplum gönüllüleri vakfı.", joinDate: "2023-01-01", supportedSDGs: ['4. Nitelikli Eğitim'], beneficiaryGroups: ['Gençler'], memberOf: [], contact: { email: 'info@tog.org.tr', phone: '0216 123 45 67', website: 'https://tog.org.tr', social: { twitter: 'tog', instagram: 'tog', facebook: 'tog', linkedin: 'tog' } }, posts: [], opportunities: [] },
    { id: 'ngo-5', name: 'İhtiyaç Haritası', category: 'Dayanışma', type: 'Dernek', avatarUrl: 'https://logo.clearbit.com/ihtiyacharitasi.org', coverPhotoUrl: 'https://picsum.photos/seed/ih/1200/400', stats: { followers: 120000, donors: 45000, volunteers: 15000, volunteerHours: 120000, projects: 800, totalDonation: 5000000, donationCount: 80000, avgDonation: 60, highestSingleDonation: 3000, peopleReached: 400000 }, transparencyScore: 96, about: "İhtiyaç sahipleri ile destekçileri buluşturan platform.", joinDate: "2023-01-01", supportedSDGs: ['10. Eşitsizliklerin Azaltılması'], beneficiaryGroups: ['İhtiyaç Sahipleri'], memberOf: [], contact: { email: 'iletisim@ihtiyacharitasi.org', phone: '0212 345 67 89', website: 'https://ihtiyacharitasi.org', social: { twitter: 'ih', instagram: 'ih', facebook: 'ih', linkedin: 'ih' } }, posts: [], opportunities: [] },
    { id: 'ngo-6', name: 'TEMA Vakfı', category: 'Çevre', type: 'Vakıf', avatarUrl: 'https://logo.clearbit.com/tema.org.tr', coverPhotoUrl: 'https://picsum.photos/seed/tema/1200/400', stats: { followers: 400000, donors: 150000, volunteers: 80000, volunteerHours: 500000, projects: 1200, totalDonation: 25000000, donationCount: 500000, avgDonation: 50, highestSingleDonation: 5000, peopleReached: 1000000 }, transparencyScore: 92, about: "Türkiye Erozyonla Mücadele Vakfı.", joinDate: "2023-01-01", supportedSDGs: ['15. Karasal Yaşam'], beneficiaryGroups: ['Doğa'], memberOf: [], contact: { email: 'info@tema.org.tr', phone: '0212 292 69 69', website: 'https://tema.org.tr', social: { twitter: 'tema', instagram: 'tema', facebook: 'tema', linkedin: 'tema' } }, posts: [], opportunities: [] },
    { id: 'ngo-7', name: 'LÖSEV', category: 'Sağlık', type: 'Vakıf', avatarUrl: 'https://logo.clearbit.com/losev.org.tr', coverPhotoUrl: 'https://picsum.photos/seed/losev/1200/400', stats: { followers: 600000, donors: 300000, volunteers: 120000, volunteerHours: 800000, projects: 1500, totalDonation: 60000000, donationCount: 1200000, avgDonation: 50, highestSingleDonation: 10000, peopleReached: 2500000 }, transparencyScore: 90, about: "Lösemili Çocuklar Vakfı.", joinDate: "2023-01-01", supportedSDGs: ['3. Sağlık ve Kaliteli Yaşam'], beneficiaryGroups: ['Lösemili Çocuklar'], memberOf: [], contact: { email: 'losev@losev.org.tr', phone: '0312 447 06 60', website: 'https://losev.org.tr', social: { twitter: 'losev', instagram: 'losev', facebook: 'losev', linkedin: 'losev' } }, posts: [], opportunities: [] },
    { id: 'ngo-8', name: 'TEGV', category: 'Eğitim', type: 'Vakıf', avatarUrl: 'https://logo.clearbit.com/tegv.org', coverPhotoUrl: 'https://picsum.photos/seed/tegv/1200/400', stats: { followers: 180000, donors: 90000, volunteers: 15000, volunteerHours: 300000, projects: 600, totalDonation: 18000000, donationCount: 250000, avgDonation: 72, highestSingleDonation: 8000, peopleReached: 800000 }, transparencyScore: 93, about: "Türkiye Eğitim Gönüllüleri Vakfı.", joinDate: "2023-01-01", supportedSDGs: ['4. Nitelikli Eğitim'], beneficiaryGroups: ['Çocuklar'], memberOf: [], contact: { email: 'tegv@tegv.org', phone: '0216 290 70 00', website: 'https://tegv.org', social: { twitter: 'tegv', instagram: 'tegv', facebook: 'tegv', linkedin: 'tegv' } }, posts: [], opportunities: [] },
    { id: 'ngo-9', name: 'Darüşşafaka Cemiyeti', category: 'Eğitim', type: 'Vakıf', avatarUrl: 'https://logo.clearbit.com/darussafaka.org', coverPhotoUrl: 'https://picsum.photos/seed/da/1200/400', stats: { followers: 120000, donors: 60000, volunteers: 5000, volunteerHours: 100000, projects: 300, totalDonation: 12000000, donationCount: 150000, avgDonation: 80, highestSingleDonation: 15000, peopleReached: 200000 }, transparencyScore: 97, about: "Eğitimde fırsat eşitliği.", joinDate: "2023-01-01", supportedSDGs: ['4. Nitelikli Eğitim'], beneficiaryGroups: ['Yetim Öğrenciler'], memberOf: [], contact: { email: 'darussafaka@darussafaka.org', phone: '0212 276 50 20', website: 'https://darussafaka.org', social: { twitter: 'da', instagram: 'da', facebook: 'da', linkedin: 'da' } }, posts: [], opportunities: [] },
    { id: 'ngo-10', name: 'Türk Eğitim Vakfı', category: 'Eğitim', type: 'Vakıf', avatarUrl: 'https://logo.clearbit.com/tev.org.tr', coverPhotoUrl: 'https://picsum.photos/seed/tev/1200/400', stats: { followers: 140000, donors: 100000, volunteers: 10000, volunteerHours: 120000, projects: 400, totalDonation: 20000000, donationCount: 300000, avgDonation: 66, highestSingleDonation: 20000, peopleReached: 1000000 }, transparencyScore: 95, about: "Gençlere burs desteği.", joinDate: "2023-01-01", supportedSDGs: ['4. Nitelikli Eğitim'], beneficiaryGroups: ['Üniversiteliler'], memberOf: [], contact: { email: 'tev@tev.org.tr', phone: '0212 318 68 00', website: 'https://tev.org.tr', social: { twitter: 'tev', instagram: 'tev', facebook: 'tev', linkedin: 'tev' } }, posts: [], opportunities: [] },
    { id: 'ngo-11', name: 'Beşiktaş JK', category: 'Spor', type: 'Spor Kulübü', avatarUrl: 'https://logo.clearbit.com/bjk.com.tr', coverPhotoUrl: 'https://picsum.photos/seed/bjk/1200/400', stats: { followers: 5000000, donors: 100000, volunteers: 20000, volunteerHours: 50000, projects: 100, totalDonation: 5000000, donationCount: 50000, avgDonation: 100, highestSingleDonation: 50000, peopleReached: 10000000 }, transparencyScore: 85, about: "BJK sosyal sorumluluk projeleri.", joinDate: "2023-01-01", supportedSDGs: ['3. Sağlık ve Kaliteli Yaşam'], beneficiaryGroups: ['Genç Sporcular'], memberOf: [], contact: { email: 'iletisim@bjk.com.tr', phone: '0212 310 10 00', website: 'https://bjk.com.tr', social: { twitter: 'bjk', instagram: 'bjk', facebook: 'bjk', linkedin: 'bjk' } }, posts: [], opportunities: [] },
    { id: 'ngo-12', name: 'Galatasaray SK', category: 'Spor', type: 'Spor Kulübü', avatarUrl: 'https://logo.clearbit.com/galatasaray.org', coverPhotoUrl: 'https://picsum.photos/seed/gs/1200/400', stats: { followers: 6000000, donors: 120000, volunteers: 25000, volunteerHours: 60000, projects: 120, totalDonation: 6000000, donationCount: 60000, avgDonation: 100, highestSingleDonation: 60000, peopleReached: 12000000 }, transparencyScore: 84, about: "GS sosyal projeler.", joinDate: "2023-01-01", supportedSDGs: ['3. Sağlık ve Kaliteli Yaşam'], beneficiaryGroups: ['Gençler'], memberOf: [], contact: { email: 'iletisim@galatasaray.org', phone: '0212 305 19 05', website: 'https://galatasaray.org', social: { twitter: 'gs', instagram: 'gs', facebook: 'gs', linkedin: 'gs' } }, posts: [], opportunities: [] },
    { id: 'ngo-13', name: 'Fenerbahçe SK', category: 'Spor', type: 'Spor Kulübü', avatarUrl: 'https://logo.clearbit.com/fenerbahce.org', coverPhotoUrl: 'https://picsum.photos/seed/fb/1200/400', stats: { followers: 5500000, donors: 110000, volunteers: 22000, volunteerHours: 55000, projects: 110, totalDonation: 5500000, donationCount: 55000, avgDonation: 100, highestSingleDonation: 55000, peopleReached: 11000000 }, transparencyScore: 86, about: "FB toplumsal fayda çalışmaları.", joinDate: "2023-01-01", supportedSDGs: ['3. Sağlık ve Kaliteli Yaşam'], beneficiaryGroups: ['Çocuklar'], memberOf: [], contact: { email: 'iletisim@fenerbahce.org', phone: '0216 542 19 07', website: 'https://fenerbahce.org', social: { twitter: 'fb', instagram: 'fb', facebook: 'fb', linkedin: 'fb' } }, posts: [], opportunities: [] },
    { id: 'ngo-14', name: 'Anadolu Efes SK', category: 'Spor', type: 'Spor Kulübü', avatarUrl: 'https://logo.clearbit.com/anadoluefessk.org', coverPhotoUrl: 'https://picsum.photos/seed/efes/1200/400', stats: { followers: 500000, donors: 20000, volunteers: 5000, volunteerHours: 20000, projects: 50, totalDonation: 2000000, donationCount: 20000, avgDonation: 100, highestSingleDonation: 10000, peopleReached: 1000000 }, transparencyScore: 88, about: "Basketbolun ötesinde sosyal etki.", joinDate: "2023-01-01", supportedSDGs: ['3. Sağlık ve Kaliteli Yaşam'], beneficiaryGroups: ['Gençler'], memberOf: [], contact: { email: 'iletisim@anadoluefessk.org', phone: '0212 123 45 67', website: 'https://anadoluefessk.org', social: { twitter: 'efes', instagram: 'efes', facebook: 'efes', linkedin: 'efes' } }, posts: [], opportunities: [] },
    { id: 'ngo-15', name: 'Vakıfbank SK', category: 'Spor', type: 'Spor Kulübü', avatarUrl: 'https://logo.clearbit.com/vakifbanksporkulubu.com', coverPhotoUrl: 'https://picsum.photos/seed/vb/1200/400', stats: { followers: 400000, donors: 15000, volunteers: 4000, volunteerHours: 15000, projects: 40, totalDonation: 1500000, donationCount: 15000, avgDonation: 100, highestSingleDonation: 8000, peopleReached: 800000 }, transparencyScore: 89, about: "Voleybol ve sosyal sorumluluk.", joinDate: "2023-01-01", supportedSDGs: ['5. Toplumsal Cinsiyet Eşitliği'], beneficiaryGroups: ['Kadın Sporcular'], memberOf: [], contact: { email: 'iletisim@vakifbanksporkulubu.com', phone: '0212 123 45 67', website: 'https://vakifbanksporkulubu.com', social: { twitter: 'vb', instagram: 'vb', facebook: 'vb', linkedin: 'vb' } }, posts: [], opportunities: [] },
    { id: 'ngo-16', name: 'Türk Kızılayı', category: 'İnsani Yardım', type: 'Özel İzinli', avatarUrl: 'https://logo.clearbit.com/kizilay.org.tr', coverPhotoUrl: 'https://picsum.photos/seed/kizilay/1200/400', stats: { followers: 1000000, donors: 1000000, volunteers: 500000, volunteerHours: 5000000, projects: 10000, totalDonation: 500000000, donationCount: 10000000, avgDonation: 50, highestSingleDonation: 1000000, peopleReached: 50000000 }, transparencyScore: 85, about: "Köklü insani yardım kuruluşu.", joinDate: "2023-01-01", supportedSDGs: ['2. Açlığa Son'], beneficiaryGroups: ['Herkes'], memberOf: [], contact: { email: 'info@kizilay.org.tr', phone: '168', website: 'https://kizilay.org.tr', social: { twitter: 'kizilay', instagram: 'kizilay', facebook: 'kizilay', linkedin: 'kizilay' } }, posts: [], opportunities: [] },
    { id: 'ngo-17', name: 'Yeşilay', category: 'Sağlık', type: 'Özel İzinli', avatarUrl: 'https://logo.clearbit.com/yesilay.org.tr', coverPhotoUrl: 'https://picsum.photos/seed/yesilay/1200/400', stats: { followers: 300000, donors: 100000, volunteers: 50000, volunteerHours: 400000, projects: 800, totalDonation: 15000000, donationCount: 200000, avgDonation: 75, highestSingleDonation: 50000, peopleReached: 5000000 }, transparencyScore: 88, about: "Bağımlılıkla mücadele vakfı.", joinDate: "2023-01-01", supportedSDGs: ['3. Sağlık ve Kaliteli Yaşam'], beneficiaryGroups: ['Bağımlı Bireyler'], memberOf: [], contact: { email: 'info@yesilay.org.tr', phone: '0212 527 16 83', website: 'https://yesilay.org.tr', social: { twitter: 'yesilay', instagram: 'yesilay', facebook: 'yesilay', linkedin: 'yesilay' } }, posts: [], opportunities: [] },
    { id: 'ngo-18', name: 'Türk Hava Kurumu', category: 'Havacılık', type: 'Özel İzinli', avatarUrl: 'https://logo.clearbit.com/thk.org.tr', coverPhotoUrl: 'https://picsum.photos/seed/thk/1200/400', stats: { followers: 150000, donors: 50000, volunteers: 10000, volunteerHours: 80000, projects: 200, totalDonation: 5000000, donationCount: 100000, avgDonation: 50, highestSingleDonation: 10000, peopleReached: 1000000 }, transparencyScore: 82, about: "Havacılığı sevdiren kurum.", joinDate: "2023-01-01", supportedSDGs: ['9. Sanayi ve İnovasyon'], beneficiaryGroups: ['Gençler'], memberOf: [], contact: { email: 'thk@thk.org.tr', phone: '0312 310 48 40', website: 'https://thk.org.tr', social: { twitter: 'thk', instagram: 'thk', facebook: 'thk', linkedin: 'thk' } }, posts: [], opportunities: [] },
    { id: 'ngo-19', name: 'Mehmetçik Vakfı', category: 'Dayanışma', type: 'Özel İzinli', avatarUrl: 'https://logo.clearbit.com/mehmetcik.org.tr', coverPhotoUrl: 'https://picsum.photos/seed/mv/1200/400', stats: { followers: 250000, donors: 500000, volunteers: 5000, volunteerHours: 20000, projects: 150, totalDonation: 100000000, donationCount: 1000000, avgDonation: 100, highestSingleDonation: 100000, peopleReached: 500000 }, transparencyScore: 91, about: "TSK Mehmetçik Vakfı.", joinDate: "2023-01-01", supportedSDGs: ['16. Barış ve Adalet'], beneficiaryGroups: ['Şehit ve Gazi Yakınları'], memberOf: [], contact: { email: 'info@mehmetcik.org.tr', phone: '0312 284 19 70', website: 'https://mehmetcik.org.tr', social: { twitter: 'mv', instagram: 'mv', facebook: 'mv', linkedin: 'mv' } }, posts: [], opportunities: [] },
    { id: 'ngo-20', name: 'Türk Eğitim Derneği', category: 'Eğitim', type: 'Özel İzinli', avatarUrl: 'https://logo.clearbit.com/ted.org.tr', coverPhotoUrl: 'https://picsum.photos/seed/ted/1200/400', stats: { followers: 180000, donors: 120000, volunteers: 15000, volunteerHours: 150000, projects: 400, totalDonation: 25000000, donationCount: 200000, avgDonation: 125, highestSingleDonation: 50000, peopleReached: 1000000 }, transparencyScore: 94, about: "Öncü eğitim kurumu.", joinDate: "2023-01-01", supportedSDGs: ['4. Nitelikli Eğitim'], beneficiaryGroups: ['Öğrenciler'], memberOf: [], contact: { email: 'ted@ted.org.tr', phone: '0312 418 06 14', website: 'https://ted.org.tr', social: { twitter: 'ted', instagram: 'ted', facebook: 'ted', linkedin: 'ted' } }, posts: [], opportunities: [] }
];

// --- Gönüllülük İlanları ---
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

// --- Öğrenci Kulüpleri ---
export const studentClubs: StudentClub[] = Array.from({ length: 10 }, (_, i) => ({
    id: `club-${i + 1}`,
    name: i < 5 ? `${['İTÜ', 'Boğaziçi', 'ODTÜ', 'Marmara', 'YTÜ'][i]} Girişimcilik Kulübü` : `${['Kabataş', 'IEL', 'GSL', 'CAL', 'KAL'][i-5]} Sosyal Yardımlaşma`,
    university: i < 5 ? ['İstanbul Teknik Üniversitesi', 'Boğaziçi Üniversitesi', 'Orta Doğu Teknik Üniversitesi', 'Marmara Üniversitesi', 'Yıldız Teknik Üniversitesi'][i] : ['Kabataş Erkek Lisesi', 'İstanbul Erkek Lisesi', 'Galatasaray Lisesi', 'Cağaloğlu Anadolu Lisesi', 'Kadıköy Anadolu Lisesi'][i-5],
    type: i < 5 ? 'university' : 'high-school',
    avatarUrl: `https://picsum.photos/seed/club${i}/200/200`,
    coverPhotoUrl: `https://picsum.photos/seed/clubcover${i}/1200/400`,
    members: 150 + (i * 100),
    points: 5000 + (i * 2000),
    description: 'Etki odaklı bir öğrenci topluluğu.',
    vision: 'Değişimin kampüsteki adı olmak.',
    joinDate: '2023-01-01',
    contact: { email: `iletisim@club${i}.edu.tr`, phone: '0212 123 45 67', website: `https://club${i}.edu.tr` }
}));

// --- Etkinlikler ---
export const events: Event[] = Array.from({ length: 5 }, (_, i) => ({
    id: `event-${i + 1}`,
    slug: `etkinlik-${i + 1}`,
    name: ['Girişimcilik Zirvesi', 'Dayanışma Konseri', 'Robotik Günleri', 'Kan Bağışı Kampanyası', 'İklim Krizi Çalıştayı'][i],
    organizer: i < 3 ? studentClubs[i].name : ngos[i].name,
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

// --- Sertifikalar ---
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
export const sportsFederations = ["TFF", "TBF"];
