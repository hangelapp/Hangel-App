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
    Target,
    Activity
} from 'lucide-react';
import type { User, NGO, Brand, Volunteering, Badge, Certificate, ManagedItem, AdBanner, HelpTopic, MarketCategory, StudentClub, Event, SchoolRepresentative, Application, DonationTransaction, Post } from './types';

export const countryPhoneCodes = [
  "93", "355", "213", "376", "244", "1", "54", "374", "61", "43", "994", "973", "880", "375", "32", "501", "229", "975", "591", "387", "267", "55", "673", "359", "226", "257", "855", "237", "1", "238", "236", "235", "56", "86", "57", "269", "242", "243", "682", "506", "385", "53", "357", "420", "45", "253", "1", "1", "593", "20", "503", "240", "291", "372", "251", "500", "298", "679", "358", "33", "594", "689", "241", "220", "995", "49", "233", "350", "30", "299", "1", "590", "1", "502", "224", "245", "592", "5", "504", "852", "36", "354", "91", "62", "98", "964", "353", "972", "39", "225", "1", "81", "962", "7", "254", "686", "850", "82", "965", "996", "856", "371", "961", "266", "231", "218", "423", "370", "352", "853", "389", "261", "265", "60", "960", "223", "356", "692", "596", "222", "230", "262", "52", "691", "373", "377", "976", "382", "1", "212", "258", "95", "264", "674", "977", "31", "599", "687", "64", "505", "227", "234", "683", "672", "670", "47", "968", "92", "680", "970", "507", "675", "595", "51", "63", "48", "351", "1", "974", "262", "40", "7", "250", "290", "1", "1", "1", "508", "1", "685", "378", "239", "966", "221", "381", "248", "232", "65", "421", "386", "677", "252", "27", "34", "94", "249", "597", "268", "46", "41", "963", "886", "992", "255", "66", "228", "690", "676", "1", "216", "90", "993", "1", "688", "256", "380", "971", "44", "1", "598", "998", "678", "379", "58", "84", "681", "967", "260", "263"
];

export const allCountries = ["Türkiye", "Almanya", "ABD", "Azerbaycan", "İngiltere", "Fransa"];
export const allProvinces = ["İstanbul", "Ankara", "İzmir", "Bursa", "Antalya"];
export const districtsData: Record<string, string[]> = {
    "İstanbul": ["Kadıköy", "Beşiktaş", "Üsküdar"],
    "Ankara": ["Çankaya", "Etimesgut"]
};
export const neighborhoodsData: Record<string, Record<string, string[]>> = {
    "İstanbul": { "Kadıköy": ["Caferağa", "Moda"] }
};

export const allInterests = ['Hayvan Hakları', 'Çevre', 'Eğitim', 'Sağlık', 'Afet', 'Çocuk'];
export const allSkills = ['Proje Yönetimi', 'Sosyal Medya Yönetimi', 'Yazılım Geliştirme'];
export const allDailySkills = ['Yemek Yapma', 'Organizasyon', 'İletişim'];
export const allLanguages = ['Türkçe', 'İngilizce', 'Almanca'];
export const allPrograms = ['MS Office', 'Google Workspace', 'Figma', 'VS Code'];
export const allLicenses = ['B Sınıfı Ehliyet'];
export const allDocuments = ['İlk Yardım Sertifikası', 'Hijyen Belgesi'];
export const allVisas = ['Schengen', 'ABD (B1/B2)'];
export const allSectors = ['Teknoloji', 'Eğitim', 'Sağlık'];
export const allPositions = ['Yazılım Geliştirici', 'Proje Müdürü', 'Tasarımcı'];
export const allBeneficiaries = ['Çocuklar', 'Öğrenciler', 'Hayvanlar', 'Çevre'];
export const allSdgs = ['1. Yoksulluğa Son', '4. Nitelikli Eğitim', '13. İklim Eylemi'];
export const allMemberships = ['Afet Platformu', 'Açık Açık'];
export const years = Array.from({ length: 100 }, (_, i) => (2024 - i).toString());

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

export const volunteeringOpportunities: Volunteering[] = [
    { id: '1', title: 'Afet Bölgesi Lojistik Destek', organization: 'Ahbap Derneği', ngoId: 'ngo-1', location: { city: 'Hatay', district: 'Antakya', type: 'Saha' }, commitment: 'Tek Günlük', volunteerCount: { needed: 50, applications: 12 }, dates: { applicationStart: '2024-01-01', applicationEnd: '2024-12-31', eventStart: '2024-08-01', eventEnd: '2024-08-01' }, hours: { start: '09:00', end: '17:00', total: 8 }, socialArea: 'Dayanışma', points: 500, ngoTransparencyScore: 98, taskType: 'Tek Gün', providesCertificate: true, earnedBadges: [], hasPreTraining: true, description: 'Lojistik merkezimizde paketleme desteği.', amenities: { transport: true, food: true, accommodation: false } }
];

export const studentClubs: StudentClub[] = [
    { id: 'club-1', name: 'İTÜ Girişimcilik Kulübü', university: 'İstanbul Teknik Üniversitesi', type: 'university', avatarUrl: 'https://picsum.photos/seed/itu/200/200', coverPhotoUrl: 'https://picsum.photos/seed/itucover/1200/400', members: 1500, points: 25000, description: 'Geleceğin girişimcilerini yetiştiriyoruz.', vision: 'Ekosistemi büyütmek.', joinDate: '2023-01-01', contact: { email: 'info@itugirisim.org', phone: '0212 123 45 67', website: 'https://itugirisim.org' } }
];

export const events: Event[] = [];

export const allEntityLists: Brand[] = [
    { id: 'brand-1', slug: 'tripcom', name: 'Trip.com', donationRate: 2, logoUrl: 'https://logo.clearbit.com/trip.com', type: 'brand', category: 'Seyahat', about: 'Global seyahat platformu.' }
];

export const marketCategories: MarketCategory[] = [
    { mainCategory: 'Tümü', subCategories: [] },
    { mainCategory: 'Seyahat', subCategories: [{ name: 'Bilet', imageUrl: '' }] }
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

export const adBanners: AdBanner[] = [
    { id: '1', title: 'Okul Alışverişiyle Destek Ol', description: 'Kırtasiye ihtiyaçlarını TEGV\'e bağışla.', imageUrl: 'https://picsum.photos/seed/ad1/800/400', link: '/market' }
];

export const timelinePosts: Post[] = [
    { id: '1', author: { name: 'Ahbap Derneği', avatarUrl: 'https://logo.clearbit.com/ahbap.org' }, content: 'Birlikte daha güçlüyüz!', timestamp: '2 saat önce', likes: 1250, comments: 45 }
];

export const sportsFederations = ["TFF", "TBF", "TVF"];
export const certificates = [];
export const pastVolunteering = [];
export const schoolRepresentatives = [];
export const ngoHelpTopics = helpTopics;
export const ngoFaqArticles = [];
export const allUniversities = ["Boğaziçi", "İTÜ", "ODTÜ", "Marmara"];
