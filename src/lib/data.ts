
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

export const allProvinces = ["İstanbul", "Ankara", "İzmir", "Bursa", "Antalya", "Adana", "Konya", "Gaziantep", "Şanlıurfa", "Kocaeli"];

export const districtsData: { [key: string]: string[] } = {
  "İstanbul": ["Kadıköy", "Beşiktaş", "Şişli", "Fatih", "Üsküdar"],
  "Ankara": ["Çankaya", "Keçiören", "Yenimahalle", "Etimesgut", "Gölbaşı"],
  "İzmir": ["Konak", "Karşıyaka", "Bornova", "Çiğli", "Buca"],
  "Bursa": ["Nilüfer", "Osmangazi", "Yıldırım"],
  "Antalya": ["Muratpaşa", "Kepez", "Konyaaltı"],
  "Adana": ["Seyhan", "Çukurova", "Yüreğir"]
};

export const neighborhoodsData: { [city: string]: { [district: string]: string[] } } = {
  "İstanbul": {
    "Kadıköy": ["Caferağa", "Moda", "Osmanağa", "Rasimpaşa", "Feneryolu"],
    "Beşiktaş": ["Bebek", "Etiler", "Levazım", "Ortaköy"],
    "Üsküdar": ["Acıbadem", "Altunizade", "Kandilli", "Kuzguncuk"]
  },
  "Ankara": {
    "Çankaya": ["Ayrancı", "Bahçelievler", "Kavaklıdere", "Kızılay", "Yıldız"],
    "Yenimahalle": ["Batıkent", "Demetevler", "İvedik"]
  },
  "İzmir": {
    "Konak": ["Alsancak", "Güzelyalı", "Göztepe", "Kahramanlar"],
    "Karşıyaka": ["Bostanlı", "Mavişehir", "Nergiz", "Şemikler"]
  }
};

export const countryPhoneCodes = ["90", "1", "44", "49", "33", "98", "389", "234", "963", "962", "45", "62", "380"];

export const sportsFederations = ["Türkiye Basketbol Federasyonu", "Türkiye Futbol Federasyonu", "Türkiye Satranç Federasyonu", "Türkiye E-Spor Federasyonu", "Türkiye Dağcılık Federasyonu"];

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
        skills: ['Proje Yönetimi', 'Sosyal Medya Yönetimi', 'Yazılım Geliştirme', 'Topluluk Yönetimi'],
        dailySkills: ['Organizasyon', 'İletişim', 'Sunum'],
        interests: ['Çevre', 'Eğitim', 'Sosyal Girişimcilik', 'Teknoloji'],
        education: [{ level: 'Lisans', school: 'Boğaziçi Üniversitesi' }],
        profession: 'Yazılım Geliştirici',
        languages: ['Türkçe', 'İngilizce', 'Almanca'],
        programs: ['VS Code', 'Figma', 'Docker'],
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
    { id: 'brand-2', slug: 'kadin-emegi', name: 'S.S. Kadın Emeği Kooperatifi', donationRate: 5, logoUrl: 'https://picsum.photos/seed/koop/200/200', type: 'cooperative', category: 'El Sanatları', about: 'Kadın üreticilerin güçlenmesini destekleyen kooperatif.' },
    { id: 'brand-3', slug: 'tema-isletme', name: 'TEMA Vakfı İktisadi İşletmesi', donationRate: 4, logoUrl: 'https://logo.clearbit.com/tema.org.tr', type: 'economic', category: 'Mağazacılık', about: 'Vakıf projelerine fon sağlayan ticari işletme.' },
    { id: 'brand-26', slug: 'amazontr', name: 'Amazon TR', donationRate: 13, logoUrl: 'https://logo.clearbit.com/amazon.com.tr', type: 'brand', category: 'Pazar Yeri', about: 'Dünyanın en büyük e-ticaret platformu.' }
];

export const volunteeringOpportunities: Volunteering[] = [
    { id: '1', title: 'Afet Bölgesi Lojistik Destek', organization: 'Uluslararası Sosyal Fayda Derneği', ngoId: '2', location: { city: 'Hatay', district: 'Antakya', type: 'Saha' }, commitment: 'Dönemsel', volunteerCount: { needed: 50, applications: 120 }, dates: { applicationStart: '2025-05-01', applicationEnd: '2026-05-21', eventStart: '2025-06-01', eventEnd: '2025-06-30' }, hours: { start: '09:00', end: '18:00', total: 56 }, socialArea: 'Afet', points: 1500, ngoTransparencyScore: 95, taskType: 'Dönemsel', providesCertificate: true, earnedBadges: ['Afet Kahramanı'], hasPreTraining: true, description: 'Bölgedeki yardım kolilerinin tasnifi ve dağıtımında görev alacak gönüllüler arıyoruz.', amenities: { transport: true, food: true, accommodation: true } },
    { id: '2', title: 'Fidan Dikme Etkinliği', organization: 'TEMA Vakfı', ngoId: '1', location: { city: 'İstanbul', district: 'Beykoz', type: 'Saha' }, commitment: 'Tek Günlük', volunteerCount: { needed: 100, applications: 250 }, dates: { applicationStart: '2025-05-01', applicationEnd: '2026-05-21', eventStart: '2025-06-01', eventEnd: '2025-06-01' }, hours: { start: '10:00', end: '16:00', total: 6 }, socialArea: 'Çevre', points: 500, ngoTransparencyScore: 92, taskType: 'Tek Gün', providesCertificate: true, earnedBadges: ['Doğa Koruyucu'], hasPreTraining: false, description: 'Geleceğe nefes olmak için binlerce fidanı toprakla buluşturuyoruz.', amenities: { transport: false, food: true, accommodation: false } },
    { id: '3', title: 'Çocuklara Kodlama Eğitimi', organization: 'TEGV', ngoId: '5', location: { city: 'Ankara', district: 'Çankaya', type: 'Hibrit' }, commitment: 'Haftalık', volunteerCount: { needed: 10, applications: 30 }, dates: { applicationStart: '2025-06-01', applicationEnd: '2025-06-30', eventStart: '2025-07-01', eventEnd: '2025-08-30' }, hours: { start: '14:00', end: '17:00', total: 24 }, socialArea: 'Eğitim', points: 1200, ngoTransparencyScore: 94, taskType: 'Dönemsel', providesCertificate: true, earnedBadges: ['Eğitim Elçisi'], hasPreTraining: true, description: 'İlköğretim öğrencilerine temel kodlama ve mantıksal düşünme becerileri kazandırıyoruz.', amenities: { transport: true, food: true, accommodation: false } },
    ...Array.from({ length: 18 }, (_, i) => ({
        id: `v${i + 4}`,
        title: `Gönüllülük İlanı ${i + 4}`,
        organization: i % 2 === 0 ? 'TEMA Vakfı' : 'Uluslararası Sosyal Fayda Derneği',
        ngoId: i % 2 === 0 ? '1' : '2',
        location: { city: 'İstanbul', district: 'Kadıköy', type: 'Saha' as const },
        commitment: 'Esnek',
        volunteerCount: { needed: 20, applications: 5 },
        dates: { applicationStart: '2025-01-01', applicationEnd: '2025-12-31', eventStart: '2025-01-01', eventEnd: '2025-12-31' },
        hours: { start: '09:00', end: '17:00', total: 8 },
        socialArea: i % 3 === 0 ? 'Çevre' : 'Eğitim',
        points: 500,
        ngoTransparencyScore: 90,
        taskType: 'Dönemsel' as const,
        providesCertificate: true,
        earnedBadges: [],
        hasPreTraining: false,
        description: 'Bu bir otomatik oluşturulmuş örnek gönüllülük ilanıdır.',
        amenities: { transport: false, food: true, accommodation: false }
    }))
];

export const badges: Badge[] = [
    { id: '1', name: 'Çevre Koruyucusu', iconName: Leaf, level: 'Bronz', socialArea: 'Çevre', pointsRequired: 500, currentPoints: 800 },
    { id: '2', name: 'Çevre Koruyucusu', iconName: Leaf, level: 'Gümüş', socialArea: 'Çevre', pointsRequired: 1000, currentPoints: 800 },
    { id: '3', name: 'Eğitim Destekçisi', iconName: GraduationCap, level: 'Bronz', socialArea: 'Eğitim', pointsRequired: 500, currentPoints: 350 },
    { id: '4', name: 'Hayvan Dostu', iconName: Heart, level: 'Bronz', socialArea: 'Hayvan Hakları', pointsRequired: 500, currentPoints: 500 },
    { id: '5', name: 'Hayvan Dostu', iconName: Heart, level: 'Gümüş', socialArea: 'Hayvan Hakları', pointsRequired: 1000, currentPoints: 500 },
    { id: '6', name: 'Teknoloji Elçisi', iconName: Code, level: 'Bronz', socialArea: 'Teknoloji', pointsRequired: 500, currentPoints: 120 },
    { id: '7', name: 'Kültür & Sanat Elçisi', iconName: Palette, level: 'Bronz', socialArea: 'Sanat', pointsRequired: 500, currentPoints: 0 },
];

export const certificates: Certificate[] = [
    { id: 'cert1', title: 'Gönüllülük Liderliği Sertifikası', organization: 'hangel Akademi', date: '2024-05-20', linkedinUrl: '#' },
];

export const managedItems: ManagedItem[] = [
    { name: 'Uluslararası Sosyal Fayda Derneği', type: 'Dernek', icon: 'heart', href: '/ngo-admin/dashboard?id=2&type=STK', status: 'approved', logoUrl: 'https://logo.clearbit.com/socialbusinessglobal.org' },
    { name: 'TEMA Vakfı', type: 'Vakıf', icon: 'leaf', href: '/ngo-admin/dashboard?id=1&type=STK', status: 'approved', logoUrl: 'https://logo.clearbit.com/tema.org.tr' },
    { name: 'İTÜ Girişimcilik Kulübü', type: 'Öğrenci Kulübü', icon: 'school', href: '/ngo-admin/dashboard?id=1&type=Öğrenci Kulübü', status: 'approved', logoUrl: 'https://logo.clearbit.com/itu.edu.tr' },
    { name: 'Trip.com', type: 'Marka', icon: 'shopping-bag', href: '/ngo-admin/dashboard?id=brand-1&type=Marka', status: 'approved', logoUrl: 'https://logo.clearbit.com/trip.com' },
    { name: 'Kadın Emeği Kooperatifi', type: 'Marka', icon: 'store', href: '/ngo-admin/dashboard?id=brand-2&type=Marka', status: 'approved', logoUrl: 'https://picsum.photos/seed/koop/200/200' },
];

export const qrPaymentCardData = [
    { id: 'bireysel', type: 'Bireysel', number: '5549601000001234', owner: 'İsmail Hilmi ADIGÜZEL', expiry: '12/28', balance: '1.250,75 ₺', ngoId: '1', cvv: '123', bgColor: 'bg-gradient-to-tr from-gray-900 to-gray-700' },
];

export const studentClubs: StudentClub[] = [
    { id: '1', name: 'İTÜ Girişimcilik Kulübü', university: 'İstanbul Teknik Üniversitesi', type: 'university', category: 'Girişimcilik', avatarUrl: 'https://logo.clearbit.com/itu.edu.tr', coverPhotoUrl: 'https://picsum.photos/seed/clubcover1/800/200', members: 150, points: 4500, description: 'Girişimcilik ekosistemini kampüse taşımak.', vision: 'Kampüsün lideri olmak.', joinDate: '2023-01-01', contact: { email: 'iletisim@itugirisim.org', phone: '+90 555 123 45 67', website: 'itugirisim.org' } }
];

export const events: Event[] = [
    { id: 'e1', slug: 'girisimcilik-zirvesi', name: 'Girişimcilik Zirvesi 2024', organizer: 'İTÜ Girişimcilik Kulübü', type: 'Konferans', startDate: '2024-11-15 09:00', endDate: '2024-11-15 18:00', location: { type: 'Fiziksel', address: 'İTÜ Süleyman Demirel Kültür Merkezi', city: 'İstanbul', district: 'Sarıyer' }, language: 'Türkçe', participationCondition: 'Herkese Açık', capacity: { current: 450, max: 500 }, tags: ['Girişimcilik', 'Networking'], imageUrl: 'https://picsum.photos/seed/event1/800/400', description: 'Yılın en büyük girişimcilik etkinliği.', providesCertificate: true },
    ...Array.from({ length: 20 }, (_, i) => ({
        id: `e${i + 2}`,
        slug: `etkinlik-${i + 2}`,
        name: `Kulüp Etkinliği ${i + 2}`,
        organizer: i % 2 === 0 ? 'İTÜ Girişimcilik' : 'Boğaziçi İşletme',
        type: i % 3 === 0 ? 'Seminer' : 'Webinar',
        startDate: '2024-12-10 10:00',
        endDate: '2024-12-10 12:00',
        location: { type: 'Online' as const, address: 'Google Meet', city: 'İstanbul', district: 'Kadıköy' },
        language: 'Türkçe',
        participationCondition: 'Herkese Açık' as const,
        capacity: { current: 50, max: 100 },
        tags: ['Eğitim', 'Sosyal'],
        imageUrl: `https://picsum.photos/seed/event${i+2}/800/400`,
        description: 'Bu bir örnek kulüp etkinliği açıklamasıdır.',
        providesCertificate: true
    }))
];

export const helpTopics: HelpTopic[] = [
    { icon: 'User', title: "Bireysel Kullanıcılar", slug: "bireysel-kullanicilar", description: "Profil ve bağış işlemleri.", subtopics: [{ title: "Puanlar", link: "#", content: "Puanlar nasıl kazanılır ve harcanır?" }] }
];
export const ngoHelpTopics = helpTopics;
export const ngoFaqArticles = [{ title: 'Hata Bildirimi', content: 'Sistem hatalarını nasıl bildiririm?' }];
export const pastVolunteering = [];
export const schoolRepresentatives: SchoolRepresentative[] = [];
export const adBanners: AdBanner[] = [
    { id: '1', title: 'Okul Alışverişiyle Destek Ol!', description: 'TEGV bağışları için tıkla.', imageUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da096a0b?q=80&w=2022&auto=format&fit=crop', link: '/market' }
];
export const marketCategories: MarketCategory[] = [
    { mainCategory: 'Tümü', subCategories: [] },
    { mainCategory: 'Moda', subCategories: [] },
    { mainCategory: 'Teknoloji', subCategories: [] },
    { mainCategory: 'Gıda', subCategories: [] },
    { mainCategory: 'Seyahat', subCategories: [] }
];
export const applications: Application[] = [];
export const donationTransactions: DonationTransaction[] = [];
