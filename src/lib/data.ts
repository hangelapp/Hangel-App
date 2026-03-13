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
    BarChart
} from 'lucide-react';
import type { User, NGO, Brand, Volunteering, Badge, Certificate, ManagedItem, AdBanner, HelpTopic, MarketCategory, StudentClub, Event, SchoolRepresentative, Application, DonationTransaction, Post } from './types';

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

// --- STK Listesi (20 Adet: 5 Dernek, 5 Vakıf, 5 Spor, 5 Özel İzinli) ---
export const ngos: NGO[] = [
    // 5 Dernek
    { id: 'ngo-1', name: 'Ahbap Derneği', category: 'Dayanışma', type: 'Dernek', avatarUrl: 'https://logo.clearbit.com/ahbap.org', coverPhotoUrl: 'https://picsum.photos/seed/ahbap/1200/400', stats: { followers: 500000, donors: 200000, volunteers: 100000, volunteerHours: 1000000, projects: 1200, totalDonation: 50000000, donationCount: 1000000, avgDonation: 50, highestSingleDonation: 5000, peopleReached: 2000000 }, transparencyScore: 98, about: "Yardımlaşma ve dayanışma hareketi.", joinDate: "2023-01-01", supportedSDGs: ['1. Yoksulluğa Son'], beneficiaryGroups: ['İhtiyaç Sahipleri'], memberOf: ['Afet Platformu'], contact: { email: 'iletisim@ahbap.org', phone: '0850 123 45 67', website: 'https://ahbap.org', social: { twitter: 'ahbap', instagram: 'ahbap', facebook: 'ahbap', linkedin: 'ahbap' } }, posts: [], opportunities: [] },
    { id: 'ngo-2', name: 'ÇYDD', category: 'Eğitim', type: 'Dernek', avatarUrl: 'https://logo.clearbit.com/cydd.org.tr', coverPhotoUrl: 'https://picsum.photos/seed/cydd/1200/400', stats: { followers: 150000, donors: 80000, volunteers: 40000, volunteerHours: 200000, projects: 500, totalDonation: 15000000, donationCount: 200000, avgDonation: 75, highestSingleDonation: 10000, peopleReached: 500000 }, transparencyScore: 95, about: "Çağdaş yaşamı destekleme derneği.", joinDate: "2023-01-01", supportedSDGs: ['4. Nitelikli Eğitim'], beneficiaryGroups: ['Öğrenciler'], memberOf: [], contact: { email: 'iletisim@cydd.org.tr', phone: '0212 123 45 67', website: 'https://cydd.org.tr', social: { twitter: 'cydd', instagram: 'cydd', facebook: 'cydd', linkedin: 'cydd' } }, posts: [], opportunities: [] },
    { id: 'ngo-3', name: 'AKUT', category: 'Arama Kurtarma', type: 'Dernek', avatarUrl: 'https://logo.clearbit.com/akut.org.tr', coverPhotoUrl: 'https://picsum.photos/seed/akut/1200/400', stats: { followers: 200000, donors: 50000, volunteers: 5000, volunteerHours: 150000, projects: 1000, totalDonation: 10000000, donationCount: 150000, avgDonation: 65, highestSingleDonation: 2500, peopleReached: 100000 }, transparencyScore: 92, about: "Arama kurtarma derneği.", joinDate: "2023-01-01", supportedSDGs: ['11. Sürdürülebilir Şehirler'], beneficiaryGroups: ['Afetzedeler'], memberOf: [], contact: { email: 'info@akut.org.tr', phone: '0212 212 12 12', website: 'https://akut.org.tr', social: { twitter: 'akut', instagram: 'akut', facebook: 'akut', linkedin: 'akut' } }, posts: [], opportunities: [] },
    { id: 'ngo-4', name: 'TOG', category: 'Gençlik', type: 'Dernek', avatarUrl: 'https://logo.clearbit.com/tog.org.tr', coverPhotoUrl: 'https://picsum.photos/seed/tog/1200/400', stats: { followers: 100000, donors: 30000, volunteers: 25000, volunteerHours: 180000, projects: 450, totalDonation: 8000000, donationCount: 100000, avgDonation: 80, highestSingleDonation: 5000, peopleReached: 300000 }, transparencyScore: 94, about: "Toplum gönüllüleri vakfı.", joinDate: "2023-01-01", supportedSDGs: ['4. Nitelikli Eğitim'], beneficiaryGroups: ['Gençler'], memberOf: [], contact: { email: 'info@tog.org.tr', phone: '0216 123 45 67', website: 'https://tog.org.tr', social: { twitter: 'tog', instagram: 'tog', facebook: 'tog', linkedin: 'tog' } }, posts: [], opportunities: [] },
    { id: 'ngo-5', name: 'İhtiyaç Haritası', category: 'Dayanışma', type: 'Dernek', avatarUrl: 'https://logo.clearbit.com/ihtiyacharitasi.org', coverPhotoUrl: 'https://picsum.photos/seed/ih/1200/400', stats: { followers: 120000, donors: 45000, volunteers: 15000, volunteerHours: 120000, projects: 800, totalDonation: 5000000, donationCount: 80000, avgDonation: 60, highestSingleDonation: 3000, peopleReached: 400000 }, transparencyScore: 96, about: "İhtiyaç sahipleri ile destekçileri buluşturan platform.", joinDate: "2023-01-01", supportedSDGs: ['10. Eşitsizliklerin Azaltılması'], beneficiaryGroups: ['İhtiyaç Sahipleri'], memberOf: [], contact: { email: 'iletisim@ihtiyacharitasi.org', phone: '0212 345 67 89', website: 'https://ihtiyacharitasi.org', social: { twitter: 'ih', instagram: 'ih', facebook: 'ih', linkedin: 'ih' } }, posts: [], opportunities: [] },
    // 5 Vakıf
    { id: 'ngo-6', name: 'TEMA Vakfı', category: 'Çevre', type: 'Vakıf', avatarUrl: 'https://logo.clearbit.com/tema.org.tr', coverPhotoUrl: 'https://picsum.photos/seed/tema/1200/400', stats: { followers: 400000, donors: 150000, volunteers: 80000, volunteerHours: 500000, projects: 1200, totalDonation: 25000000, donationCount: 500000, avgDonation: 50, highestSingleDonation: 5000, peopleReached: 1000000 }, transparencyScore: 92, about: "Türkiye Erozyonla Mücadele Vakfı.", joinDate: "2023-01-01", supportedSDGs: ['15. Karasal Yaşam'], beneficiaryGroups: ['Doğa'], memberOf: [], contact: { email: 'info@tema.org.tr', phone: '0212 292 69 69', website: 'https://tema.org.tr', social: { twitter: 'tema', instagram: 'tema', facebook: 'tema', linkedin: 'tema' } }, posts: [], opportunities: [] },
    { id: 'ngo-7', name: 'LÖSEV', category: 'Sağlık', type: 'Vakıf', avatarUrl: 'https://logo.clearbit.com/losev.org.tr', coverPhotoUrl: 'https://picsum.photos/seed/losev/1200/400', stats: { followers: 600000, donors: 300000, volunteers: 120000, volunteerHours: 800000, projects: 1500, totalDonation: 60000000, donationCount: 1200000, avgDonation: 50, highestSingleDonation: 10000, peopleReached: 2500000 }, transparencyScore: 90, about: "Lösemili Çocuklar Vakfı.", joinDate: "2023-01-01", supportedSDGs: ['3. Sağlık ve Kaliteli Yaşam'], beneficiaryGroups: ['Lösemili Çocuklar'], memberOf: [], contact: { email: 'losev@losev.org.tr', phone: '0312 447 06 60', website: 'https://losev.org.tr', social: { twitter: 'losev', instagram: 'losev', facebook: 'losev', linkedin: 'losev' } }, posts: [], opportunities: [] },
    { id: 'ngo-8', name: 'TEGV', category: 'Eğitim', type: 'Vakıf', avatarUrl: 'https://logo.clearbit.com/tegv.org', coverPhotoUrl: 'https://picsum.photos/seed/tegv/1200/400', stats: { followers: 180000, donors: 90000, volunteers: 15000, volunteerHours: 300000, projects: 600, totalDonation: 18000000, donationCount: 250000, avgDonation: 72, highestSingleDonation: 8000, peopleReached: 800000 }, transparencyScore: 93, about: "Türkiye Eğitim Gönüllüleri Vakfı.", joinDate: "2023-01-01", supportedSDGs: ['4. Nitelikli Eğitim'], beneficiaryGroups: ['Çocuklar'], memberOf: [], contact: { email: 'tegv@tegv.org', phone: '0216 290 70 00', website: 'https://tegv.org', social: { twitter: 'tegv', instagram: 'tegv', facebook: 'tegv', linkedin: 'tegv' } }, posts: [], opportunities: [] },
    { id: 'ngo-9', name: 'Darüşşafaka Cemiyeti', category: 'Eğitim', type: 'Vakıf', avatarUrl: 'https://logo.clearbit.com/darussafaka.org', coverPhotoUrl: 'https://picsum.photos/seed/da/1200/400', stats: { followers: 120000, donors: 60000, volunteers: 5000, volunteerHours: 100000, projects: 300, totalDonation: 12000000, donationCount: 150000, avgDonation: 80, highestSingleDonation: 15000, peopleReached: 200000 }, transparencyScore: 97, about: "Eğitimde fırsat eşitliği.", joinDate: "2023-01-01", supportedSDGs: ['4. Nitelikli Eğitim'], beneficiaryGroups: ['Yetim Öğrenciler'], memberOf: [], contact: { email: 'darussafaka@darussafaka.org', phone: '0212 276 50 20', website: 'https://darussafaka.org', social: { twitter: 'da', instagram: 'da', facebook: 'da', linkedin: 'da' } }, posts: [], opportunities: [] },
    { id: 'ngo-10', name: 'Türk Eğitim Vakfı', category: 'Eğitim', type: 'Vakıf', avatarUrl: 'https://logo.clearbit.com/tev.org.tr', coverPhotoUrl: 'https://picsum.photos/seed/tev/1200/400', stats: { followers: 140000, donors: 100000, volunteers: 10000, volunteerHours: 120000, projects: 400, totalDonation: 20000000, donationCount: 300000, avgDonation: 66, highestSingleDonation: 20000, peopleReached: 1000000 }, transparencyScore: 95, about: "Gençlere burs desteği.", joinDate: "2023-01-01", supportedSDGs: ['4. Nitelikli Eğitim'], beneficiaryGroups: ['Üniversiteliler'], memberOf: [], contact: { email: 'tev@tev.org.tr', phone: '0212 318 68 00', website: 'https://tev.org.tr', social: { twitter: 'tev', instagram: 'tev', facebook: 'tev', linkedin: 'tev' } }, posts: [], opportunities: [] },
    // 5 Spor Kulübü
    { id: 'ngo-11', name: 'Beşiktaş JK', category: 'Spor', type: 'Spor Kulübü', avatarUrl: 'https://logo.clearbit.com/bjk.com.tr', coverPhotoUrl: 'https://picsum.photos/seed/bjk/1200/400', stats: { followers: 5000000, donors: 100000, volunteers: 20000, volunteerHours: 50000, projects: 100, totalDonation: 5000000, donationCount: 50000, avgDonation: 100, highestSingleDonation: 50000, peopleReached: 10000000 }, transparencyScore: 85, about: "BJK sosyal sorumluluk projeleri.", joinDate: "2023-01-01", supportedSDGs: ['3. Sağlık ve Kaliteli Yaşam'], beneficiaryGroups: ['Genç Sporcular'], memberOf: [], contact: { email: 'iletisim@bjk.com.tr', phone: '0212 310 10 00', website: 'https://bjk.com.tr', social: { twitter: 'bjk', instagram: 'bjk', facebook: 'bjk', linkedin: 'bjk' } }, posts: [], opportunities: [] },
    { id: 'ngo-12', name: 'Galatasaray SK', category: 'Spor', type: 'Spor Kulübü', avatarUrl: 'https://logo.clearbit.com/galatasaray.org', coverPhotoUrl: 'https://picsum.photos/seed/gs/1200/400', stats: { followers: 6000000, donors: 120000, volunteers: 25000, volunteerHours: 60000, projects: 120, totalDonation: 6000000, donationCount: 60000, avgDonation: 100, highestSingleDonation: 60000, peopleReached: 12000000 }, transparencyScore: 84, about: "GS sosyal projeler.", joinDate: "2023-01-01", supportedSDGs: ['3. Sağlık ve Kaliteli Yaşam'], beneficiaryGroups: ['Gençler'], memberOf: [], contact: { email: 'iletisim@galatasaray.org', phone: '0212 305 19 05', website: 'https://galatasaray.org', social: { twitter: 'gs', instagram: 'gs', facebook: 'gs', linkedin: 'gs' } }, posts: [], opportunities: [] },
    { id: 'ngo-13', name: 'Fenerbahçe SK', category: 'Spor', type: 'Spor Kulübü', avatarUrl: 'https://logo.clearbit.com/fenerbahce.org', coverPhotoUrl: 'https://picsum.photos/seed/fb/1200/400', stats: { followers: 5500000, donors: 110000, volunteers: 22000, volunteerHours: 55000, projects: 110, totalDonation: 5500000, donationCount: 55000, avgDonation: 100, highestSingleDonation: 55000, peopleReached: 11000000 }, transparencyScore: 86, about: "FB toplumsal fayda çalışmaları.", joinDate: "2023-01-01", supportedSDGs: ['3. Sağlık ve Kaliteli Yaşam'], beneficiaryGroups: ['Çocuklar'], memberOf: [], contact: { email: 'iletisim@fenerbahce.org', phone: '0216 542 19 07', website: 'https://fenerbahce.org', social: { twitter: 'fb', instagram: 'fb', facebook: 'fb', linkedin: 'fb' } }, posts: [], opportunities: [] },
    { id: 'ngo-14', name: 'Anadolu Efes SK', category: 'Spor', type: 'Spor Kulübü', avatarUrl: 'https://logo.clearbit.com/anadoluefessk.org', coverPhotoUrl: 'https://picsum.photos/seed/efes/1200/400', stats: { followers: 500000, donors: 20000, volunteers: 5000, volunteerHours: 20000, projects: 50, totalDonation: 2000000, donationCount: 20000, avgDonation: 100, highestSingleDonation: 10000, peopleReached: 1000000 }, transparencyScore: 88, about: "Basketbolun ötesinde sosyal etki.", joinDate: "2023-01-01", supportedSDGs: ['3. Sağlık ve Kaliteli Yaşam'], beneficiaryGroups: ['Gençler'], memberOf: [], contact: { email: 'iletisim@anadoluefessk.org', phone: '0212 123 45 67', website: 'https://anadoluefessk.org', social: { twitter: 'efes', instagram: 'efes', facebook: 'efes', linkedin: 'efes' } }, posts: [], opportunities: [] },
    { id: 'ngo-15', name: 'Vakıfbank SK', category: 'Spor', type: 'Spor Kulübü', avatarUrl: 'https://logo.clearbit.com/vakifbanksporkulubu.com', coverPhotoUrl: 'https://picsum.photos/seed/vb/1200/400', stats: { followers: 400000, donors: 15000, volunteers: 4000, volunteerHours: 15000, projects: 40, totalDonation: 1500000, donationCount: 15000, avgDonation: 100, highestSingleDonation: 8000, peopleReached: 800000 }, transparencyScore: 89, about: "Voleybol ve sosyal sorumluluk.", joinDate: "2023-01-01", supportedSDGs: ['5. Toplumsal Cinsiyet Eşitliği'], beneficiaryGroups: ['Kadın Sporcular'], memberOf: [], contact: { email: 'iletisim@vakifbanksporkulubu.com', phone: '0212 123 45 67', website: 'https://vakifbanksporkulubu.com', social: { twitter: 'vb', instagram: 'vb', facebook: 'vb', linkedin: 'vb' } }, posts: [], opportunities: [] },
    // 5 Özel İzinli
    { id: 'ngo-16', name: 'Türk Kızılayı', category: 'İnsani Yardım', type: 'Özel İzinli', avatarUrl: 'https://logo.clearbit.com/kizilay.org.tr', coverPhotoUrl: 'https://picsum.photos/seed/kizilay/1200/400', stats: { followers: 1000000, donors: 1000000, volunteers: 500000, volunteerHours: 5000000, projects: 10000, totalDonation: 500000000, donationCount: 10000000, avgDonation: 50, highestSingleDonation: 1000000, peopleReached: 50000000 }, transparencyScore: 85, about: "Köklü insani yardım kuruluşu.", joinDate: "2023-01-01", supportedSDGs: ['2. Açlığa Son'], beneficiaryGroups: ['Herkes'], memberOf: [], contact: { email: 'info@kizilay.org.tr', phone: '168', website: 'https://kizilay.org.tr', social: { twitter: 'kizilay', instagram: 'kizilay', facebook: 'kizilay', linkedin: 'kizilay' } }, posts: [], opportunities: [] },
    { id: 'ngo-17', name: 'Yeşilay', category: 'Sağlık', type: 'Özel İzinli', avatarUrl: 'https://logo.clearbit.com/yesilay.org.tr', coverPhotoUrl: 'https://picsum.photos/seed/yesilay/1200/400', stats: { followers: 300000, donors: 100000, volunteers: 50000, volunteerHours: 400000, projects: 800, totalDonation: 15000000, donationCount: 200000, avgDonation: 75, highestSingleDonation: 50000, peopleReached: 5000000 }, transparencyScore: 88, about: "Bağımlılıkla mücadele vakfı.", joinDate: "2023-01-01", supportedSDGs: ['3. Sağlık ve Kaliteli Yaşam'], beneficiaryGroups: ['Bağımlı Bireyler'], memberOf: [], contact: { email: 'info@yesilay.org.tr', phone: '0212 527 16 83', website: 'https://yesilay.org.tr', social: { twitter: 'yesilay', instagram: 'yesilay', facebook: 'yesilay', linkedin: 'yesilay' } }, posts: [], opportunities: [] },
    { id: 'ngo-18', name: 'Türk Hava Kurumu', category: 'Havacılık', type: 'Özel İzinli', avatarUrl: 'https://logo.clearbit.com/thk.org.tr', coverPhotoUrl: 'https://picsum.photos/seed/thk/1200/400', stats: { followers: 150000, donors: 50000, volunteers: 10000, volunteerHours: 80000, projects: 200, totalDonation: 5000000, donationCount: 100000, avgDonation: 50, highestSingleDonation: 10000, peopleReached: 1000000 }, transparencyScore: 82, about: "Havacılığı sevdiren kurum.", joinDate: "2023-01-01", supportedSDGs: ['9. Sanayi ve İnovasyon'], beneficiaryGroups: ['Gençler'], memberOf: [], contact: { email: 'thk@thk.org.tr', phone: '0312 310 48 40', website: 'https://thk.org.tr', social: { twitter: 'thk', instagram: 'thk', facebook: 'thk', linkedin: 'thk' } }, posts: [], opportunities: [] },
    { id: 'ngo-19', name: 'Mehmetçik Vakfı', category: 'Dayanışma', type: 'Özel İzinli', avatarUrl: 'https://logo.clearbit.com/mehmetcik.org.tr', coverPhotoUrl: 'https://picsum.photos/seed/mv/1200/400', stats: { followers: 250000, donors: 500000, volunteers: 5000, volunteerHours: 20000, projects: 150, totalDonation: 100000000, donationCount: 1000000, avgDonation: 100, highestSingleDonation: 100000, peopleReached: 500000 }, transparencyScore: 91, about: "TSK Mehmetçik Vakfı.", joinDate: "2023-01-01", supportedSDGs: ['16. Barış ve Adalet'], beneficiaryGroups: ['Şehit ve Gazi Yakınları'], memberOf: [], contact: { email: 'info@mehmetcik.org.tr', phone: '0312 284 19 70', website: 'https://mehmetcik.org.tr', social: { twitter: 'mv', instagram: 'mv', facebook: 'mv', linkedin: 'mv' } }, posts: [], opportunities: [] },
    { id: 'ngo-20', name: 'Türk Eğitim Derneği', category: 'Eğitim', type: 'Özel İzinli', avatarUrl: 'https://logo.clearbit.com/ted.org.tr', coverPhotoUrl: 'https://picsum.photos/seed/ted/1200/400', stats: { followers: 180000, donors: 120000, volunteers: 15000, volunteerHours: 150000, projects: 400, totalDonation: 25000000, donationCount: 200000, avgDonation: 125, highestSingleDonation: 50000, peopleReached: 1000000 }, transparencyScore: 94, about: "Öncü eğitim kurumu.", joinDate: "2023-01-01", supportedSDGs: ['4. Nitelikli Eğitim'], beneficiaryGroups: ['Öğrenciler'], memberOf: [], contact: { email: 'ted@ted.org.tr', phone: '0312 418 06 14', website: 'https://ted.org.tr', social: { twitter: 'ted', instagram: 'ted', facebook: 'ted', linkedin: 'ted' } }, posts: [], opportunities: [] }
];

// --- Gönüllülük İlanları (21 Adet) ---
export const volunteeringOpportunities: Volunteering[] = Array.from({ length: 21 }, (_, i) => ({
    id: `opp-${i + 1}`,
    title: [
        "Deprem Bölgesi Lojistik Destek", "Sokak Hayvanları Besleme Günü", "Öğrencilere Matematik Kursu", 
        "Huzurevi Müzik Dinletisi", "Deniz Kıyısı Temizliği", "Tercüme Desteği (İngilizce)", "Ağaç Dikme Şenliği", 
        "Afet Bilinci Eğitmenliği", "Dijital Kütüphane Kataloglama", "Gıda Kolisi Paketleme",
        "Kampüs Elçisi Programı", "Grafik Tasarım Desteği", "Hukuki Danışmanlık (Pro-bono)", "Yazılım Mentörlüğü",
        "İşaret Dili Atölyesi", "Sesli Kitap Okuma", "Kan Bağışı Organizasyonu",
        "İlk Yardım Yardımcılığı", "Müze Rehberliği", "Sürdürülebilirlik Analizi", "Veri Giriş Desteği"
    ][i % 21],
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

// --- Öğrenci Kulüpleri (10 Adet: 5 Üniversite, 5 Lise) ---
export const studentClubs: StudentClub[] = [
    // 5 University
    { id: 'club-1', name: 'İTÜ Girişimcilik Kulübü', university: 'İstanbul Teknik Üniversitesi', type: 'university', avatarUrl: 'https://logo.clearbit.com/itu.edu.tr', coverPhotoUrl: 'https://picsum.photos/seed/club1/1200/400', members: 1500, points: 25000, description: 'Girişimcilik topluluğu.', vision: 'En iyi girişimci kulübü olmak.', joinDate: '2023-01-01', contact: { email: 'iletisim@itugirisim.org', phone: '0212 123 45 67', website: 'https://itugirisim.org' } },
    { id: 'club-2', name: 'Boğaziçi Sosyal Hizmet', university: 'Boğaziçi Üniversitesi', type: 'university', avatarUrl: 'https://logo.clearbit.com/boun.edu.tr', coverPhotoUrl: 'https://picsum.photos/seed/club2/1200/400', members: 800, points: 18000, description: 'Sosyal sorumluluk projeleri.', vision: 'Değişimin kampüsteki adı.', joinDate: '2023-01-01', contact: { email: 'social@boun.edu.tr', phone: '0212 345 67 89', website: 'https://social.boun.edu.tr' } },
    { id: 'club-3', name: 'ODTÜ Hayvan Dostları', university: 'Orta Doğu Teknik Üniversitesi', type: 'university', avatarUrl: 'https://logo.clearbit.com/metu.edu.tr', coverPhotoUrl: 'https://picsum.photos/seed/club3/1200/400', members: 600, points: 12000, description: 'Hayvan koruma topluluğu.', vision: 'Patili dostlarımızın sesi.', joinDate: '2023-01-01', contact: { email: 'hayvanlar@metu.edu.tr', phone: '0312 123 45 67', website: 'https://hayvanlar.metu.edu.tr' } },
    { id: 'club-4', name: 'Marmara Kızılay Kulübü', university: 'Marmara Üniversitesi', type: 'university', avatarUrl: 'https://logo.clearbit.com/marmara.edu.tr', coverPhotoUrl: 'https://picsum.photos/seed/club4/1200/400', members: 1200, points: 22000, description: 'Kızılay gönüllü gençlik.', vision: 'Yardımlaşma bilincini yaymak.', joinDate: '2023-01-01', contact: { email: 'kizilay@marmara.edu.tr', phone: '0216 123 45 67', website: 'https://kizilay.marmara.edu.tr' } },
    { id: 'club-5', name: 'Yıldız Teknik Çevre Kulübü', university: 'Yıldız Teknik Üniversitesi', type: 'university', avatarUrl: 'https://logo.clearbit.com/yildiz.edu.tr', coverPhotoUrl: 'https://picsum.photos/seed/club5/1200/400', members: 950, points: 19500, description: 'Sürdürülebilirlik topluluğu.', vision: 'Yeşil bir kampüs.', joinDate: '2023-01-01', contact: { email: 'cevre@yildiz.edu.tr', phone: '0212 123 45 67', website: 'https://cevre.yildiz.edu.tr' } },
    // 5 High School
    { id: 'club-6', name: 'Kabataş Sosyal Yardımlaşma', university: 'Kabataş Erkek Lisesi', type: 'high-school', avatarUrl: 'https://picsum.photos/seed/kabatas/200/200', coverPhotoUrl: 'https://picsum.photos/seed/h1/1200/400', members: 300, points: 5000, description: 'Lise yardım topluluğu.', vision: 'Genç yaşta iyilik.', joinDate: '2023-01-01', contact: { email: 'social@kabatas.k12.tr', phone: '0212 123 45 67', website: 'https://kabatas.k12.tr' } },
    { id: 'club-7', name: 'İstanbul Erkek Robotik', university: 'İstanbul Erkek Lisesi', type: 'high-school', avatarUrl: 'https://picsum.photos/seed/iel/200/200', coverPhotoUrl: 'https://picsum.photos/seed/h2/1200/400', members: 150, points: 8000, description: 'Robotik ve teknoloji.', vision: 'Geleceğin mühendisleri.', joinDate: '2023-01-01', contact: { email: 'robotics@iel.k12.tr', phone: '0212 123 45 67', website: 'https://iel.k12.tr' } },
    { id: 'club-8', name: 'Galatasaray Lisesi Kültür', university: 'Galatasaray Lisesi', type: 'high-school', avatarUrl: 'https://picsum.photos/seed/gsl/200/200', coverPhotoUrl: 'https://picsum.photos/seed/h3/1200/400', members: 400, points: 6500, description: 'Kültür ve sanat.', vision: 'Estetik ve derinlik.', joinDate: '2023-01-01', contact: { email: 'kultur@gsl.k12.tr', phone: '0212 123 45 67', website: 'https://gsl.k12.tr' } },
    { id: 'club-9', name: 'Cağaloğlu Müzik Kulübü', university: 'Cağaloğlu Anadolu Lisesi', type: 'high-school', avatarUrl: 'https://picsum.photos/seed/cal/200/200', coverPhotoUrl: 'https://picsum.photos/seed/h4/1200/400', members: 200, points: 4500, description: 'Müzik ve koro.', vision: 'Notalarla dayanışma.', joinDate: '2023-01-01', contact: { email: 'music@cal.k12.tr', phone: '0212 123 45 67', website: 'https://cal.k12.tr' } },
    { id: 'club-10', name: 'Kadıköy Anadolu Doğa', university: 'Kadıköy Anadolu Lisesi', type: 'high-school', avatarUrl: 'https://picsum.photos/seed/kal/200/200', coverPhotoUrl: 'https://picsum.photos/seed/h5/1200/400', members: 350, points: 7200, description: 'Doğa ve çevre bilinci.', vision: 'Yaşanabilir dünya.', joinDate: '2023-01-01', contact: { email: 'nature@kal.k12.tr', phone: '0216 123 45 67', website: 'https://kal.k12.tr' } }
];

// --- Etkinlikler (5 Adet) ---
export const events: Event[] = [
    { id: 'event-1', slug: 'zirve-2024', name: 'Girişimcilik Zirvesi', organizer: 'İTÜ Girişimcilik Kulübü', type: 'Zirve', date: '2024-12-01', startDate: '2024-12-01 09:00', endDate: '2024-12-01 18:00', location: { type: 'Fiziksel', address: 'İTÜ SDK', city: 'İstanbul', district: 'Sarıyer' }, language: 'Türkçe', participationCondition: 'Herkese Açık', capacity: { current: 450, max: 500 }, tags: ['Girişimcilik', 'Teknoloji'], imageUrl: 'https://picsum.photos/seed/ev1/600/850', description: 'Yılın en büyük öğrenci zirvesi.', providesCertificate: true },
    { id: 'event-2', slug: 'konser-2024', name: 'Dayanışma Konseri', organizer: 'Boğaziçi Sosyal Hizmet', type: 'Konser', date: '2024-11-15', startDate: '2024-11-15 20:00', endDate: '2024-11-15 23:00', location: { type: 'Fiziksel', address: 'Albert Long Hall', city: 'İstanbul', district: 'Beşiktaş' }, language: 'Türkçe', participationCondition: 'Biletli', capacity: { current: 300, max: 350 }, tags: ['Müzik', 'Yardım'], imageUrl: 'https://picsum.photos/seed/ev2/600/850', description: 'Geliri burs fonuna aktarılacaktır.', providesCertificate: false },
    { id: 'event-3', slug: 'robotik-2024', name: 'Robotik Günleri', organizer: 'ODTÜ Hayvan Dostları', type: 'Yarışma', date: '2024-10-10', startDate: '2024-10-10 10:00', endDate: '2024-10-12 17:00', location: { type: 'Fiziksel', address: 'ODTÜ KKM', city: 'Ankara', district: 'Çankaya' }, language: 'Türkçe/İngilizce', participationCondition: 'Öğrencilere Özel', capacity: { current: 200, max: 300 }, tags: ['Teknoloji', 'Robotik'], imageUrl: 'https://picsum.photos/seed/ev3/600/850', description: 'Teknoloji ve inovasyon buluşması.', providesCertificate: true },
    { id: 'event-4', slug: 'kan-bagisi', name: 'Kan Bağışı Kampanyası', organizer: 'Marmara Kızılay Kulübü', type: 'Kampanya', date: '2024-09-20', startDate: '2024-09-20 09:00', endDate: '2024-09-20 17:00', location: { type: 'Fiziksel', address: 'Göztepe Kampüsü', city: 'İstanbul', district: 'Kadıköy' }, language: 'Türkçe', participationCondition: 'Herkese Açık', capacity: { current: 100, max: 1000 }, tags: ['Sağlık', 'Bağış'], imageUrl: 'https://picsum.photos/seed/ev4/600/850', description: 'Hayat kurtarmak senin elinde.', providesCertificate: false },
    { id: 'event-5', slug: 'iklim-calistayi', name: 'İklim Krizi Çalıştayı', organizer: 'Yıldız Teknik Çevre Kulübü', type: 'Çalıştay', date: '2024-08-25', startDate: '2024-08-25 13:00', endDate: '2024-08-25 17:00', location: { type: 'Online', address: 'Zoom', city: 'Online', district: 'Online' }, language: 'Türkçe', participationCondition: 'Kayıtlı Katılım', capacity: { current: 85, max: 100 }, tags: ['Çevre', 'Sürdürülebilirlik'], imageUrl: 'https://picsum.photos/seed/ev5/600/850', description: 'Geleceği birlikte tasarlıyoruz.', providesCertificate: true }
];

// --- Sertifikalar (5 Adet) ---
export const certificates: Certificate[] = [
    { id: "cert-1", title: "Gönüllülük Liderliği Sertifikası", organization: "hangel Akademi", date: "2024-05-20", linkedinUrl: "https://linkedin.com/" },
    { id: "cert-2", title: "Sosyal Etki Uzmanı", organization: "Social Business Global", date: "2024-06-15", linkedinUrl: "https://linkedin.com/" },
    { id: "cert-3", title: "Afet Müdahale Temel Eğitimi", organization: "AKUT", date: "2024-07-10", linkedinUrl: "https://linkedin.com/" },
    { id: "cert-4", title: "Proje Yönetimi Başarı Belgesi", organization: "İTÜ Girişimcilik", date: "2024-04-12", linkedinUrl: "https://linkedin.com/" },
    { id: "cert-5", title: "Dijital Okuryazarlık Sertifikası", organization: "TEGV", date: "2024-03-05", linkedinUrl: "https://linkedin.com/" }
];

export const allEntityLists: Brand[] = [
    { 
        id: 'brand-1', 
        slug: 'tripcom', 
        name: 'Trip.com', 
        donationRate: 2, 
        logoUrl: 'https://logo.clearbit.com/trip.com', 
        type: 'brand', 
        category: 'Seyahat', 
        about: 'Global seyahat platformu.',
        donationByCategory: [
            { category: 'Otel Rezervasyonu', rate: 2.5 },
            { category: 'Uçak Bileti', rate: 1.0 },
            { category: 'Tren Bileti', rate: 1.5 },
            { category: 'Araç Kiralama', rate: 2.0 }
        ]
    },
    { 
        id: 'brand-2', 
        slug: 'pazarama', 
        name: 'Pazarama', 
        donationRate: 2, 
        logoUrl: 'https://logo.clearbit.com/pazarama.com', 
        type: 'brand', 
        category: 'Pazar Yeri', 
        about: 'Türkiye\'nin güvenilir pazar yeri.',
        donationByCategory: [
            { category: 'Elektronik', rate: 1.5 },
            { category: 'Giyim', rate: 3.0 },
            { category: 'Kozmetik', rate: 2.5 },
            { category: 'Ev & Yaşam', rate: 2.0 }
        ]
    },
    { 
        id: 'brand-3', 
        slug: 'karaca', 
        name: 'Karaca', 
        donationRate: 3, 
        logoUrl: 'https://logo.clearbit.com/karaca.com', 
        type: 'brand', 
        category: 'Ev & Yaşam', 
        about: 'Mutfak ve ev tekstili ürünleri.',
        donationByCategory: [
            { category: 'Sofra & Mutfak', rate: 4.0 },
            { category: 'Küçük Ev Aletleri', rate: 2.0 },
            { category: 'Ev Tekstili', rate: 3.5 }
        ]
    }
];

export const marketCategories: MarketCategory[] = [
    { mainCategory: 'Tümü', subCategories: [] },
    { mainCategory: 'Pazar Yeri', subCategories: [{ name: 'Genel', imageUrl: '' }] },
    { mainCategory: 'Giyim', subCategories: [{ name: 'Spor', imageUrl: '' }, { name: 'Moda', imageUrl: '' }] },
    { mainCategory: 'Seyahat', subCategories: [{ name: 'Bilet', imageUrl: '' }, { name: 'Konaklama', imageUrl: '' }] },
    { mainCategory: 'Ev & Yaşam', subCategories: [{ name: 'Mutfak', imageUrl: '' }, { name: 'Dekorasyon', imageUrl: '' }] }
];

export const badges: Badge[] = [
    { id: "1", name: "Çevre Koruyucusu", level: "Bronz", iconName: Leaf, socialArea: "Çevre", pointsRequired: 500, currentPoints: 800 },
    { id: "2", name: "Çevre Koruyucusu", level: "Gümüş", iconName: Leaf, socialArea: "Çevre", pointsRequired: 1000, currentPoints: 800 }
];

export const managedItems: ManagedItem[] = [
    { name: "Ahbap Derneği", type: "STK", icon: "heart", status: "approved", href: "/ngo-admin/dashboard" }
];

export const qrPaymentCardData = [
    { id: '1', type: 'Standart', balance: '1,250.00 ₺', number: '**** **** **** 1234', owner: 'İsmail Hilmi ADIGÜZEL', bgColor: 'bg-gradient-to-br from-primary to-orange-600', status: 'Aktif' },
    { id: '2', type: 'Öğrenci', balance: '0.00 ₺', number: '**** **** **** 5678', owner: 'İsmail Hilmi ADIGÜZEL', bgColor: 'bg-gradient-to-br from-blue-600 to-indigo-700', status: 'Aktif Değil' }
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
export const timelinePosts: Post[] = [
    { id: '1', author: { name: 'Ahbap Derneği', avatarUrl: 'https://logo.clearbit.com/ahbap.org' }, content: 'Bugün deprem bölgesindeki 500 aileye gıda yardımı ulaştırdık. Birlikte daha güçlüyüz!', timestamp: '2 saat önce', likes: 1250, comments: 45, sponsored: false },
    { id: '2', author: { name: 'TEMA Vakfı', avatarUrl: 'https://logo.clearbit.com/tema.org.tr' }, content: 'Geleceğe nefes olmaya devam ediyoruz. Bu yıl 1 milyon fidan hedefimize çok yaklaştık.', timestamp: '5 saat önce', likes: 850, comments: 20, sponsored: true }
];
export const provincialDirectorates = ["İstanbul İl Müdürlüğü", "Ankara İl Müdürlüğü"];
export const sportsFederations = ["Türkiye Futbol Federasyonu", "Türkiye Basketbol Federasyonu", "Türkiye Voleybol Federasyonu"];