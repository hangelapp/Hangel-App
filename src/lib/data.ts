'use client';

import { Leaf, Heart, HeartHandshake, Star, Award, Calendar, MapPin, Landmark, Briefcase, DollarSign } from 'lucide-react';
import type { Post, Brand, Event, Volunteering, User, Badge, Certificate, StudentClub, SchoolRepresentative, Application, DonationTransaction, ManagedItem, NGO, AdBanner, MarketCategory } from './types';

export const user: User = {
    id: '1',
    name: 'İsmail Hilmi ADIGÜZEL',
    username: '@ismailhilmicom',
    avatarUrl: 'https://images.unsplash.com/photo-1521119989659-a83eee488004?q=80&w=1080',
    coverPhotoUrl: 'https://images.unsplash.com/photo-1693902939226-449195d2698b?q=80&w=1080',
    impactScore: 15750,
    personalInfo: {
        email: 'i.adiguzel@email.com',
        phone: '+90 554 700 70 07',
        birthDate: '1993-05-21',
        gender: 'Erkek',
        nationality: 'Türkiye Cumhuriyeti',
        bloodType: '0 Rh+',
        address: {
            country: 'Türkiye',
            city: 'İstanbul',
            district: 'Kadıköy',
            neighborhood: 'Caferağa',
            fullAddress: 'Caferağa Mah. Moda Cad. No: 123 D:4'
        },
        website: 'https://ismailhilmi.com',
        social: {
            linkedin: 'ismailhilmi',
            github: 'ismailhilmi',
            behance: 'ismailhilmi',
            instagram: 'ismailhilmi',
            twitter: 'ismailhilmi',
        }
    },
    volunteerInfo: {
        skills: ['Proje Yönetimi', 'Sosyal Medya Yönetimi', 'Grafik Tasarım', 'Bağışçı İlişkileri'],
        dailySkills: ['Yemek Yapma', 'Temizlik', 'El Becerileri', 'Organizasyon', 'İletişim'],
        interests: ['Hayvan Hakları', 'Çevre', 'Eğitim', 'Sosyal Girişimcilik'],
        education: [
            { level: 'Lisans', school: 'Boğaziçi Üniversitesi - Yönetim Bilişim Sistemleri' },
            { level: 'Lise', school: 'Kabataş Erkek Lisesi' }
        ],
        profession: 'Yazılım Geliştirici',
        sector: 'Teknoloji',
        languages: ['Türkçe', 'İngilizce', 'Almanca'],
        programs: ['VS Code', 'Figma', 'Docker', 'Google Analytics'],
        licenses: ['B Sınıfı Ehliyet'],
        documents: ['İlk Yardım Sertifikası', 'Hijyen Belgesi'],
        travelInfo: { 
            domesticObstacle: false, 
            internationalObstacle: false,
            visas: ['Schengen', 'ABD (B1/B2)']
        },
        emergency: {
            available: true,
            hasChronicIllness: false,
            usesRegularMedication: false,
            hasPhysicalLimitation: false,
            emergencyContacts: [{ name: "Ayşe Yılmaz", phone: "+90 555 987 65 43" }]
        }
    },
    stats: {
        totalDonation: 1250,
        donationCount: 42,
        highestSingleDonation: 150,
        supportedNgosCount: 7,
        mostSupportedNgo: 'TEMA Vakfı',
        avgDonation: 29.76,
        volunteerHours: 48,
        completedProjects: 5,
        volunteerRank: {
            country: 'İlk %5',
            city: 'İlk %2',
            school: 'İlk %1',
            interest: 'Hayvan Hakları alanında İlk %10',
        },
        mostActiveVolunteerArea: 'Hayvan Hakları',
        avgVolunteerDuration: '3 Hafta',
        totalImpactValue: 25000,
    },
    progress: { 'Çevre': 80, 'Hayvan Hakları': 100, 'Eğitim': 50 }
};

export const marketCategories: MarketCategory[] = [
    { mainCategory: 'Tümü', subCategories: [] },
    { mainCategory: 'Giyim', subCategories: [] },
    { mainCategory: 'Ayakkabı', subCategories: [] },
    { mainCategory: 'Elektronik', subCategories: [] },
    { mainCategory: 'Kozmetik & Bakım', subCategories: [] },
    { mainCategory: 'Tatil & Seyahat', subCategories: [] },
    { mainCategory: 'Anne & Bebek', subCategories: [] },
    { mainCategory: 'Ev & Yaşam', subCategories: [] },
    { mainCategory: 'Süpermarket', subCategories: [] },
    { mainCategory: 'Gıda & İçecek', subCategories: [] },
    { mainCategory: 'Aksesuar & Takı', subCategories: [] },
    { mainCategory: 'Hobi & Hizmet', subCategories: [] },
];

export const timelinePosts: Post[] = [
    { id: '1', author: { name: 'TEMA Vakfı', avatarUrl: 'https://logo.clearbit.com/tema.org.tr' }, content: 'Bugün Balıkesir fidan dikme etkinliğimizde 200 yeni ağacı toprakla buluşturduk! 🌳 Gelecek nesillere daha yeşil bir dünya bırakmak için var gücümüzle çalışıyoruz. #Doğaİçin #TEMA', timestamp: '2 saat önce', likes: 1240, comments: 45, imageUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=2013&auto=format&fit=crop', imageHint: 'planting trees' },
    { id: '2', author: { name: 'Ahbap Derneği', avatarUrl: 'https://logo.clearbit.com/ahbap.org' }, content: 'Hatay ve Adıyaman bölgelerindeki ihtiyaç sahibi aileler için hazırladığımız 5000 adet gıda kolisini gönüllü ekibimizle birlikte dağıtmaya başladık. 🙏 Dayanışma yaşatır! #Ahbap #Dayanışma', timestamp: '5 saat önce', likes: 3500, comments: 120, imageUrl: 'https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?q=80&w=2070&auto=format&fit=crop', imageHint: 'food donation' }
];

export const adBanners: AdBanner[] = [
    { id: '1', title: 'Okul Alışverişiyle Destek Ol!', description: 'Kırtasiye ihtiyaçlarınızla TEGV\'e bağış yapın.', imageUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da096a0b?q=80&w=2022&auto=format&fit=crop', link: '/market' }
];

export const ngos: NGO[] = [
    {
        id: '1',
        name: 'TEMA Vakfı',
        foundationYear: 1992,
        category: 'Çevre',
        type: 'Vakıf',
        avatarUrl: 'https://logo.clearbit.com/tema.org.tr',
        coverPhotoUrl: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?q=80&w=2041&auto=format&fit=crop',
        stats: { followers: 120000, donors: 50000, volunteers: 80000, volunteerHours: 250000, projects: 150, totalDonation: 1500000, donationCount: 65000, avgDonation: 23.07, highestSingleDonation: 500, peopleReached: 500000 },
        transparencyScore: 92,
        about: "Türkiye Çöl Olmasın! TEMA Vakfı, ağaçlandırma ve erozyonla mücadele ederek Türkiye'nin topraklarını korumaktadır.",
        joinDate: "2023-01-10",
        supportedSDGs: ['İklim Eylemi', 'Sudaki Yaşam', 'Karasal Yaşam'],
        beneficiaryGroups: ['Çevre', 'Gelecek Nesiller'],
        memberOf: ['Açık Açık'],
        contact: { email: 'info@tema.org.tr', phone: '0212 292 69 69', website: 'https://tema.org.tr', social: { twitter: 'temavakfi', instagram: 'temavakfi', facebook: 'temavakfi', linkedin: 'tema' } },
        posts: [],
        opportunities: []
    },
    {
        id: '2',
        name: 'Ahbap Derneği',
        foundationYear: 2017,
        category: 'Dayanışma',
        type: 'Dernek',
        avatarUrl: 'https://logo.clearbit.com/ahbap.org',
        coverPhotoUrl: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?q=80&w=2070&auto=format&fit=crop',
        stats: { followers: 850000, donors: 250000, volunteers: 150000, volunteerHours: 500000, projects: 500, totalDonation: 12500000, donationCount: 300000, avgDonation: 41.67, highestSingleDonation: 1000, peopleReached: 2000000 },
        transparencyScore: 95,
        about: "Ahbap, toplumsal yardımlaşmaya, dayanışmaya, sevgiye ve paylaşmaya dayalı bir işbirliği hareketidir.",
        joinDate: "2023-02-20",
        supportedSDGs: ['Yoksulluğa Son', 'Açlığa Son', 'Nitelikli Eğitim'],
        beneficiaryGroups: ['İhtiyaç Sahipleri', 'Afetzedeler', 'Öğrenciler'],
        memberOf: ['Afet Platformu'],
        contact: { email: 'info@ahbap.org', phone: '0216 550 50 50', website: 'https://ahbap.org', social: { twitter: 'ahbap', instagram: 'ahbap', facebook: 'ahbap', linkedin: 'ahbap' } },
        posts: [],
        opportunities: []
    },
    {
        id: '3',
        name: 'LÖSEV',
        foundationYear: 1998,
        category: 'Sağlık',
        type: 'Vakıf',
        avatarUrl: 'https://logo.clearbit.com/losev.org.tr',
        coverPhotoUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=2070&auto=format&fit=crop',
        stats: { followers: 500000, donors: 180000, volunteers: 90000, volunteerHours: 300000, projects: 200, totalDonation: 8000000, donationCount: 250000, avgDonation: 32, highestSingleDonation: 800, peopleReached: 1000000 },
        transparencyScore: 90,
        about: 'Lösemili Çocuklar Sağlık ve Eğitim Vakfı, lösemili ve kan hastası çocukların, sağlık ve eğitim başta olmak üzere her türlü ihtiyaçlarının sağlanmasına yardımcı olmaktadır.',
        joinDate: "2023-03-15",
        supportedSDGs: ['Sağlıklı ve Kaliteli Yaşam', 'Nitelikli Eğitim'],
        beneficiaryGroups: ['Çocuklar', 'Hastalar'],
        memberOf: [],
        contact: { email: 'info@losev.org.tr', phone: '0312 447 06 60', website: 'https://www.losev.org.tr', social: { twitter: 'losev1998', instagram: 'losev1998', facebook: 'losev', linkedin: 'losev' } },
        posts: [],
        opportunities: []
    },
    {
        id: '4',
        name: 'HAYTAP',
        foundationYear: 2008,
        category: 'Hayvan Hakları',
        type: 'Dernek',
        avatarUrl: 'https://logo.clearbit.com/haytap.org',
        coverPhotoUrl: 'https://images.unsplash.com/photo-1548681528-6a5c45b66b42?q=80&w=1974&auto=format&fit=crop',
        stats: { followers: 300000, donors: 100000, volunteers: 50000, volunteerHours: 150000, projects: 100, totalDonation: 3000000, donationCount: 120000, avgDonation: 25, highestSingleDonation: 600, peopleReached: 400000 },
        transparencyScore: 88,
        about: 'Hayvan Hakları Federasyonu, Türkiye\'deki hayvan hakları ihlallerine karşı mücadele eden ve sahipsiz hayvanlar için çözümler üreten bir sivil toplum örgütüdür.',
        joinDate: "2023-04-01",
        supportedSDGs: ['Karasal Yaşam'],
        beneficiaryGroups: ['Hayvanlar'],
        memberOf: [],
        contact: { email: 'info@haytap.org', phone: '0212 212 HAY', website: 'https://www.haytap.org', social: { twitter: 'haytap', instagram: 'haytap', facebook: 'haytap', linkedin: 'haytap' } },
        posts: [],
        opportunities: []
    }
];

export const volunteeringOpportunities: Volunteering[] = [
    { id: '1', title: 'Afet Bölgesi Lojistik Destek', organization: 'Ahbap Derneği', ngoId: '2', location: { city: 'Hatay', district: 'Antakya', type: 'Saha' }, commitment: 'Dönemsel', volunteerCount: { needed: 50, applications: 120 }, dates: { applicationStart: '2024-07-01', applicationEnd: '2024-07-25', eventStart: '2024-08-01', eventEnd: '2024-08-08' }, hours: { start: '09:00', end: '18:00', total: 56 }, socialArea: 'Afet', points: 1500, ngoTransparencyScore: 95, taskType: 'Dönemsel', providesCertificate: true, earnedBadges: ['Afet Kahramanı'], hasPreTraining: true, description: 'Bölgedeki yardım kolilerinin tasnifi ve dağıtımında görev alacak gönüllüler arıyoruz.', amenities: { transport: true, food: true, accommodation: true } },
    { id: '2', title: 'Fidan Dikme Etkinliği', organization: 'TEMA Vakfı', ngoId: '1', location: { city: 'İstanbul', district: 'Beykoz', type: 'Saha' }, commitment: 'Tek Günlük', volunteerCount: { needed: 100, applications: 250 }, dates: { applicationStart: '2024-08-01', applicationEnd: '2024-08-20', eventStart: '2024-09-01', eventEnd: '2024-09-01' }, hours: { start: '10:00', end: '16:00', total: 6 }, socialArea: 'Çevre', points: 500, ngoTransparencyScore: 92, taskType: 'Tek Gün', providesCertificate: true, earnedBadges: ['Doğa Koruyucu'], hasPreTraining: false, description: 'Geleceğe nefes olmak için binlerce fidanı toprakla buluşturuyoruz.', amenities: { transport: false, food: true, accommodation: false } },
    { id: '3', title: 'Sosyal Medya İçerik Gönüllüsü', organization: 'LÖSEV', ngoId: '3', location: { city: 'Online', district: 'Online', type: 'Online' }, commitment: 'Sürekli', volunteerCount: { needed: 5, applications: 45 }, dates: { applicationStart: '2024-07-15', applicationEnd: '2024-08-15', eventStart: '2024-08-20', eventEnd: '2025-08-20' }, hours: { start: '09:00', end: '18:00', total: 240 }, socialArea: 'Sağlık', points: 2000, ngoTransparencyScore: 90, taskType: 'Sürekli', providesCertificate: true, earnedBadges: [], hasPreTraining: true, description: 'LÖSEV\'in sosyal medya hesapları için yaratıcı ve etkili içerikler üretecek gönüllüler arıyoruz.', amenities: { transport: false, food: false, accommodation: false }, skills: ['Sosyal Medya Yönetimi', 'Grafik Tasarım'] },
    { id: '4', title: 'Barınak Ziyareti ve Bakım', organization: 'HAYTAP', ngoId: '4', location: { city: 'Ankara', district: 'Çankaya', type: 'Saha' }, commitment: 'Dönemsel', volunteerCount: { needed: 20, applications: 60 }, dates: { applicationStart: '2024-08-05', applicationEnd: '2024-08-25', eventStart: '2024-09-01', eventEnd: '2024-11-01' }, hours: { start: '13:00', end: '17:00', total: 48 }, socialArea: 'Hayvan Hakları', points: 800, ngoTransparencyScore: 88, taskType: 'Dönemsel', providesCertificate: false, earnedBadges: ['Hayvan Dostu'], hasPreTraining: false, description: 'Barınaktaki dostlarımızın bakımlarına yardımcı olacak, onlarla sevgi dolu zaman geçirecek hayvanseverler arıyoruz.', amenities: { transport: false, food: false, accommodation: false } }
];

export const events: Event[] = [];
export const studentClubs: StudentClub[] = [];
export const schoolRepresentatives: SchoolRepresentative[] = [];
export const applications: Application[] = [];
export const donationTransactions: DonationTransaction[] = [];
export const badges: Badge[] = [];
export const certificates: Certificate[] = [];
export const helpTopics: any[] = [];
export const ngoHelpTopics = helpTopics;
export const ngoFaqArticles = [];
export const pastVolunteering = [];
export const managedItems: ManagedItem[] = [
    { name: 'Ahbap Derneği', type: 'STK', icon: 'heart', href: '/ngo-admin/dashboard', status: 'approved', logoUrl: 'https://logo.clearbit.com/ahbap.org' }
];

export const qrPaymentCardData = [
    { id: 'bireysel', type: 'Bireysel', bgColor: 'bg-primary', number: '5549601000001234', owner: 'İsmail Hilmi ADIGÜZEL', expiry: '12/28', balance: '1.250,75 ₺', ngoId: '1', cvv: '123' }
];

export const allEntityLists: Brand[] = [
    { id: 'go-1', name: 'Trip.com', donationRate: 2, logoUrl: 'https://logo.clearbit.com/trip.com', type: 'brand', category: 'Seyahat', agency: 'GelirOrtaklari' },
    { id: 'go-2', name: 'Pazarama', donationRate: 2, logoUrl: 'https://logo.clearbit.com/pazarama.com', type: 'brand', category: 'Pazar Yeri', agency: 'GelirOrtaklari' },
    { id: 'go-3', name: 'Karaca', donationRate: 3, logoUrl: 'https://logo.clearbit.com/karaca.com', type: 'brand', category: 'Ev & Yaşam', agency: 'GelirOrtaklari' },
    { id: 'go-4', name: 'Yalıspor', donationRate: 2, logoUrl: 'https://logo.clearbit.com/yalispor.com.tr', type: 'brand', category: 'Giyim', agency: 'GelirOrtaklari' },
    { id: 'go-5', name: 'Mango', donationRate: 2, logoUrl: 'https://logo.clearbit.com/mango.com', type: 'brand', category: 'Giyim', agency: 'GelirOrtaklari' },
    { id: 'go-6', name: 'Getir', donationRate: 2, logoUrl: 'https://logo.clearbit.com/getir.com', type: 'brand', category: 'Süpermarket', agency: 'GelirOrtaklari' },
    { id: 'go-7', name: 'Tatilbudur', donationRate: 3, logoUrl: 'https://logo.clearbit.com/tatilbudur.com', type: 'brand', category: 'Seyahat', agency: 'GelirOrtaklari' },
    { id: 'go-8', name: 'CarrefourSA', donationRate: 2, logoUrl: 'https://logo.clearbit.com/carrefoursa.com', type: 'brand', category: 'Süpermarket', agency: 'GelirOrtaklari' },
    { id: 'go-9', name: 'Boyner', donationRate: 2, logoUrl: 'https://logo.clearbit.com/boyner.com.tr', type: 'brand', category: 'Giyim', agency: 'GelirOrtaklari' },
    { id: 'go-10', name: 'Ucuzabilet', donationRate: 2, logoUrl: 'https://logo.clearbit.com/ucuzabilet.com', type: 'brand', category: 'Seyahat', agency: 'GelirOrtaklari' },
    { id: 'go-11', name: 'CamperTR', donationRate: 4.67, logoUrl: 'https://logo.clearbit.com/camper.com', type: 'brand', category: 'Ayakkabı', agency: 'GelirOrtaklari' },
    { id: 'go-12', name: 'H&M', donationRate: 6, logoUrl: 'https://logo.clearbit.com/hm.com', type: 'brand', category: 'Giyim', agency: 'GelirOrtaklari' },
    { id: 'go-13', name: 'Bilet.com', donationRate: 2, logoUrl: 'https://logo.clearbit.com/bilet.com', type: 'brand', category: 'Seyahat', agency: 'GelirOrtaklari' },
    { id: 'go-14', name: 'Tchibo', donationRate: 2, logoUrl: 'https://logo.clearbit.com/tchibo.com.tr', type: 'brand', category: 'Gıda & İçecek', agency: 'GelirOrtaklari' },
    { id: 'go-15', name: 'Homend', donationRate: 2, logoUrl: 'https://logo.clearbit.com/homend.com.tr', type: 'brand', category: 'Elektronik', agency: 'GelirOrtaklari' },
    { id: 'go-16', name: 'Skechers', donationRate: 2, logoUrl: 'https://logo.clearbit.com/skechers.com.tr', type: 'brand', category: 'Ayakkabı', agency: 'GelirOrtaklari' },
    { id: 'go-17', name: 'MediaMarkt', donationRate: 2, logoUrl: 'https://logo.clearbit.com/mediamarkt.com.tr', type: 'brand', category: 'Elektronik', agency: 'GelirOrtaklari' },
    { id: 'go-18', name: 'Mudo', donationRate: 1.8, logoUrl: 'https://logo.clearbit.com/mudo.com.tr', type: 'brand', category: 'Ev & Yaşam', agency: 'GelirOrtaklari' },
    { id: 'go-19', name: 'Bella Maison', donationRate: 2, logoUrl: 'https://logo.clearbit.com/bellamaison.com', type: 'brand', category: 'Ev & Yaşam', agency: 'GelirOrtaklari' },
    { id: 'go-20', name: 'Ayakkabı Dünyası', donationRate: 4, logoUrl: 'https://logo.clearbit.com/ayakkabidunyasi.com.tr', type: 'brand', category: 'Ayakkabı', agency: 'GelirOrtaklari' },
    { id: 'go-21', name: 'Decathlon', donationRate: 2, logoUrl: 'https://logo.clearbit.com/decathlon.com.tr', type: 'brand', category: 'Giyim', agency: 'GelirOrtaklari' },
    { id: 'go-22', name: 'Carter’s', donationRate: 2, logoUrl: 'https://logo.clearbit.com/carters.com', type: 'brand', category: 'Anne & Bebek', agency: 'GelirOrtaklari' },
    { id: 'go-23', name: 'MinyCenter', donationRate: 2, logoUrl: 'https://logo.clearbit.com/minycenter.org', type: 'brand', category: 'Anne & Bebek', agency: 'GelirOrtaklari' },
    { id: 'go-24', name: 'Huawei', donationRate: 2, logoUrl: 'https://logo.clearbit.com/huawei.com', type: 'brand', category: 'Elektronik', agency: 'GelirOrtaklari' },
    { id: 'go-25', name: 'Vitaminler', donationRate: 5, logoUrl: 'https://logo.clearbit.com/vitaminler.com', type: 'brand', category: 'Kozmetik & Bakım', agency: 'GelirOrtaklari' },
    { id: 'go-26', name: 'Amazon TR', donationRate: 13, logoUrl: 'https://logo.clearbit.com/amazon.com.tr', type: 'brand', category: 'Pazar Yeri', agency: 'GelirOrtaklari' },
    { id: 'go-27', name: 'Emsan', donationRate: 2, logoUrl: 'https://logo.clearbit.com/emsan.com.tr', type: 'brand', category: 'Ev & Yaşam', agency: 'GelirOrtaklari' },
    { id: 'go-28', name: 'Mavi', donationRate: 2, logoUrl: 'https://logo.clearbit.com/mavi.com', type: 'brand', category: 'Giyim', agency: 'GelirOrtaklari' },
    { id: 'go-29', name: 'A101', donationRate: 2, logoUrl: 'https://logo.clearbit.com/a101.com.tr', type: 'brand', category: 'Süpermarket', agency: 'GelirOrtaklari' },
    { id: 'go-30', name: 'Pierre Cardin', donationRate: 11, logoUrl: 'https://logo.clearbit.com/pierrecardin.com.tr', type: 'brand', category: 'Giyim', agency: 'GelirOrtaklari' },
    { id: 'go-31', name: 'Cacharel', donationRate: 11, logoUrl: 'https://logo.clearbit.com/cacharel.com.tr', type: 'brand', category: 'Giyim', agency: 'GelirOrtaklari' },
    { id: 'go-32', name: 'US Polo Assn.', donationRate: 11, logoUrl: 'https://logo.clearbit.com/uspoloassn.com', type: 'brand', category: 'Giyim', agency: 'GelirOrtaklari' },
    { id: 'go-33', name: 'n11', donationRate: 2, logoUrl: 'https://logo.clearbit.com/n11.com', type: 'brand', category: 'Pazar Yeri', agency: 'GelirOrtaklari' },
    { id: 'go-34', name: 'Samsung', donationRate: 1.66, logoUrl: 'https://logo.clearbit.com/samsung.com', type: 'brand', category: 'Elektronik', agency: 'GelirOrtaklari' },
    { id: 'go-35', name: 'Penti', donationRate: 2, logoUrl: 'https://logo.clearbit.com/penti.com', type: 'brand', category: 'Giyim', agency: 'GelirOrtaklari' },
    { id: 'go-36', name: 'Teknosa', donationRate: 2, logoUrl: 'https://logo.clearbit.com/teknosa.com', type: 'brand', category: 'Elektronik', agency: 'GelirOrtaklari' },
    { id: 'go-37', name: 'Altınbaş', donationRate: 2, logoUrl: 'https://logo.clearbit.com/altinbas.com', type: 'brand', category: 'Aksesuar & Takı', agency: 'GelirOrtaklari' },
    { id: 'go-38', name: 'IKEA', donationRate: 2, logoUrl: 'https://logo.clearbit.com/ikea.com.tr', type: 'brand', category: 'Ev & Yaşam', agency: 'GelirOrtaklari' },
    { id: 'go-39', name: 'Etstur', donationRate: 2, logoUrl: 'https://logo.clearbit.com/etstur.com', type: 'brand', category: 'Seyahat', agency: 'GelirOrtaklari' },
    { id: 'go-40', name: 'Divarese', donationRate: 5, logoUrl: 'https://logo.clearbit.com/divarese.com.tr', type: 'brand', category: 'Ayakkabı', agency: 'GelirOrtaklari' },
    { id: 'go-41', name: 'Flaw Wear', donationRate: 3, logoUrl: 'https://logo.clearbit.com/flawwear.com', type: 'brand', category: 'Giyim', agency: 'GelirOrtaklari' },
    { id: 'go-42', name: 'Fresh Scarfs', donationRate: 5, logoUrl: 'https://logo.clearbit.com/freshscarfs.com', type: 'brand', category: 'Aksesuar & Takı', agency: 'GelirOrtaklari' },
    { id: 'go-43', name: 'TARTI', donationRate: 10, logoUrl: 'https://logo.clearbit.com/tarti.com', type: 'brand', category: 'Hobi & Hizmet', agency: 'GelirOrtaklari' },
    { id: 'go-44', name: 'Reeder', donationRate: 1.5, logoUrl: 'https://logo.clearbit.com/reeder.com.tr', type: 'brand', category: 'Elektronik', agency: 'GelirOrtaklari' },
    { id: 'go-45', name: 'Enjoy eSIM', donationRate: 9, logoUrl: 'https://logo.clearbit.com/enjoyesim.com', type: 'brand', category: 'Hobi & Hizmet', agency: 'GelirOrtaklari' },
    { id: 'go-46', name: 'Madame Coco', donationRate: 4, logoUrl: 'https://logo.clearbit.com/madamecoco.com', type: 'brand', category: 'Ev & Yaşam', agency: 'GelirOrtaklari' },
    { id: 'go-47', name: 'LG', donationRate: 3, logoUrl: 'https://logo.clearbit.com/lg.com', type: 'brand', category: 'Elektronik', agency: 'GelirOrtaklari' },
    { id: 'go-48', name: 'Arkopharma', donationRate: 15, logoUrl: 'https://logo.clearbit.com/arkopharma.com', type: 'brand', category: 'Kozmetik & Bakım', agency: 'GelirOrtaklari' },
    { id: 'go-49', name: 'Petzzshop', donationRate: 3, logoUrl: 'https://logo.clearbit.com/petzzshop.com', type: 'brand', category: 'Hobi & Hizmet', agency: 'GelirOrtaklari' },
    { id: 'go-50', name: 'Manuka', donationRate: 5, logoUrl: 'https://logo.clearbit.com/manuka.com.tr', type: 'brand', category: 'Giyim', agency: 'GelirOrtaklari' },
    { id: 'go-51', name: 'Kayra', donationRate: 5, logoUrl: 'https://logo.clearbit.com/kayra.com', type: 'brand', category: 'Giyim', agency: 'GelirOrtaklari' },
    { id: 'go-52', name: 'Sosyopix', donationRate: 10, logoUrl: 'https://logo.clearbit.com/sosyopix.com', type: 'brand', category: 'Hobi & Hizmet', agency: 'GelirOrtaklari' },
    { id: 'go-53', name: 'Airalo', donationRate: 8, logoUrl: 'https://logo.clearbit.com/airalo.com', type: 'brand', category: 'Hobi & Hizmet', agency: 'GelirOrtaklari' },
    { id: 'go-54', name: 'Xiaomi', donationRate: 2, logoUrl: 'https://logo.clearbit.com/mi.com', type: 'brand', category: 'Elektronik', agency: 'GelirOrtaklari' },
    { id: 'go-55', name: 'FLO', donationRate: 7.5, logoUrl: 'https://logo.clearbit.com/flo.com.tr', type: 'brand', category: 'Ayakkabı', agency: 'GelirOrtaklari' },
    { id: 'go-56', name: 'Forever21', donationRate: 2, logoUrl: 'https://logo.clearbit.com/forever21.com', type: 'brand', category: 'Giyim', agency: 'GelirOrtaklari' },
    { id: 'go-57', name: 'Bialetti', donationRate: 7, logoUrl: 'https://logo.clearbit.com/bialetti.com', type: 'brand', category: 'Gıda & İçecek', agency: 'GelirOrtaklari' },
    { id: 'go-58', name: 'Tazecicek', donationRate: 4.5, logoUrl: 'https://logo.clearbit.com/tazecicek.com', type: 'brand', category: 'Hobi & Hizmet', agency: 'GelirOrtaklari' },
    { id: 'go-59', name: 'Mizalle', donationRate: 5, logoUrl: 'https://logo.clearbit.com/mizalle.com', type: 'brand', category: 'Giyim', agency: 'GelirOrtaklari' },
    { id: 'go-60', name: 'Teknevia', donationRate: 2, logoUrl: 'https://logo.clearbit.com/teknevia.com', type: 'brand', category: 'Seyahat', agency: 'GelirOrtaklari' },
    { id: 'go-61', name: 'Lona Cosmetics', donationRate: 25, logoUrl: 'https://logo.clearbit.com/lonacosmetics.com', type: 'brand', category: 'Kozmetik & Bakım', agency: 'GelirOrtaklari' },
    { id: 'go-62', name: 'EvdeEczane', donationRate: 3, logoUrl: 'https://logo.clearbit.com/evdeeczane.com', type: 'brand', category: 'Kozmetik & Bakım', agency: 'GelirOrtaklari' },
    { id: 'go-63', name: 'Cosmed', donationRate: 5, logoUrl: 'https://logo.clearbit.com/cosmed.com.tr', type: 'brand', category: 'Kozmetik & Bakım', agency: 'GelirOrtaklari' },
    { id: 'go-64', name: 'Tonguç Akademi', donationRate: 5.5, logoUrl: 'https://logo.clearbit.com/tongucakademi.com', type: 'brand', category: 'Hobi & Hizmet', agency: 'GelirOrtaklari' },
    { id: 'go-65', name: 'Tonguç Mağaza', donationRate: 5.5, logoUrl: 'https://logo.clearbit.com/tongucmagaza.com', type: 'brand', category: 'Hobi & Hizmet', agency: 'GelirOrtaklari' },
    { id: 'go-66', name: 'Kütahya Porselen', donationRate: 4, logoUrl: 'https://logo.clearbit.com/kutahyaporselen.com.tr', type: 'brand', category: 'Ev & Yaşam', agency: 'GelirOrtaklari' },
    { id: 'go-67', name: 'General Mobile', donationRate: 2, logoUrl: 'https://logo.clearbit.com/generalmobile.com', type: 'brand', category: 'Elektronik', agency: 'GelirOrtaklari' },
    { id: 'go-68', name: 'Farfetch', donationRate: 7, logoUrl: 'https://logo.clearbit.com/farfetch.com', type: 'brand', category: 'Giyim', agency: 'GelirOrtaklari' },
    { id: 'go-69', name: 'Konyalı Saat', donationRate: 2, logoUrl: 'https://logo.clearbit.com/konyalisaat.com.tr', type: 'brand', category: 'Aksesuar & Takı', agency: 'GelirOrtaklari' },
    { id: 'go-70', name: 'Korkmaz', donationRate: 3, logoUrl: 'https://logo.clearbit.com/korkmaz.com.tr', type: 'brand', category: 'Ev & Yaşam', agency: 'GelirOrtaklari' },
    { id: 'go-71', name: 'E-bebek', donationRate: 2.5, logoUrl: 'https://logo.clearbit.com/e-bebek.com', type: 'brand', category: 'Anne & Bebek', agency: 'GelirOrtaklari' },
    { id: 'go-72', name: 'Slazenger', donationRate: 3, logoUrl: 'https://logo.clearbit.com/slazenger.com.tr', type: 'brand', category: 'Giyim', agency: 'GelirOrtaklari' },
    { id: 'go-73', name: 'Tudors', donationRate: 6, logoUrl: 'https://logo.clearbit.com/tudors.com', type: 'brand', category: 'Giyim', agency: 'GelirOrtaklari' },
    { id: 'go-74', name: 'Casper', donationRate: 2, logoUrl: 'https://logo.clearbit.com/casper.com.tr', type: 'brand', category: 'Elektronik', agency: 'GelirOrtaklari' },
    { id: 'go-75', name: 'Toyzz Shop', donationRate: 7.2, logoUrl: 'https://logo.clearbit.com/toyzzshop.com', type: 'brand', category: 'Anne & Bebek', agency: 'GelirOrtaklari' },
    { id: 'go-76', name: 'Taç', donationRate: 4, logoUrl: 'https://logo.clearbit.com/tac.com.tr', type: 'brand', category: 'Ev & Yaşam', agency: 'GelirOrtaklari' },
    { id: 'go-77', name: 'PUMA', donationRate: 6, logoUrl: 'https://logo.clearbit.com/puma.com', type: 'brand', category: 'Giyim', agency: 'GelirOrtaklari' },
    { id: 'go-78', name: 'Marks & Spencer', donationRate: 2, logoUrl: 'https://logo.clearbit.com/marksandspencer.com.tr', type: 'brand', category: 'Giyim', agency: 'GelirOrtaklari' },
    { id: 'go-79', name: 'GAP', donationRate: 2, logoUrl: 'https://logo.clearbit.com/gap.com.tr', type: 'brand', category: 'Giyim', agency: 'GelirOrtaklari' },
    { id: 'go-80', name: 'Beymen', donationRate: 3, logoUrl: 'https://logo.clearbit.com/beymen.com', type: 'brand', category: 'Giyim', agency: 'GelirOrtaklari' },
    { id: 'go-81', name: 'Banggood', donationRate: 5.5, logoUrl: 'https://logo.clearbit.com/banggood.com', type: 'brand', category: 'Pazar Yeri', agency: 'GelirOrtaklari' },
    { id: 'go-82', name: 'Koçtaş', donationRate: 2.2, logoUrl: 'https://logo.clearbit.com/koctas.com.tr', type: 'brand', category: 'Ev & Yaşam', agency: 'GelirOrtaklari' },
    { id: 'go-83', name: 'Colins', donationRate: 9, logoUrl: 'https://logo.clearbit.com/colins.com.tr', type: 'brand', category: 'Giyim', agency: 'GelirOrtaklari' },
    { id: 'go-84', name: 'D&R', donationRate: 2.5, logoUrl: 'https://logo.clearbit.com/dr.com.tr', type: 'brand', category: 'Hobi & Hizmet', agency: 'GelirOrtaklari' },
    { id: 'go-85', name: 'Koton', donationRate: 4.5, logoUrl: 'https://logo.clearbit.com/koton.com', type: 'brand', category: 'Giyim', agency: 'GelirOrtaklari' },
    { id: 'go-86', name: 'Linens', donationRate: 5, logoUrl: 'https://logo.clearbit.com/linens.com.tr', type: 'brand', category: 'Ev & Yaşam', agency: 'GelirOrtaklari' },
    { id: 'go-87', name: 'Saat & Saat', donationRate: 1, logoUrl: 'https://logo.clearbit.com/saatvesaat.com.tr', type: 'brand', category: 'Aksesuar & Takı', agency: 'GelirOrtaklari' },
    { id: 'go-88', name: 'Sportive', donationRate: 6.5, logoUrl: 'https://logo.clearbit.com/sportive.com.tr', type: 'brand', category: 'Giyim', agency: 'GelirOrtaklari' },
    { id: 'go-89', name: 'Beko', donationRate: 3, logoUrl: 'https://logo.clearbit.com/beko.com.tr', type: 'brand', category: 'Elektronik', agency: 'GelirOrtaklari' },
    { id: 'go-90', name: 'Benetton', donationRate: 6, logoUrl: 'https://logo.clearbit.com/benetton.com', type: 'brand', category: 'Giyim', agency: 'GelirOrtaklari' },
    { id: 'go-91', name: 'Yargıcı', donationRate: 5.6, logoUrl: 'https://logo.clearbit.com/yargici.com', type: 'brand', category: 'Giyim', agency: 'GelirOrtaklari' },
    { id: 'go-92', name: 'Gant', donationRate: 6, logoUrl: 'https://logo.clearbit.com/gant.com.tr', type: 'brand', category: 'Giyim', agency: 'GelirOrtaklari' },
    { id: 'go-93', name: 'Nautica', donationRate: 7, logoUrl: 'https://logo.clearbit.com/nautica-tr.com', type: 'brand', category: 'Giyim', agency: 'GelirOrtaklari' },
    { id: 'go-94', name: 'Lacoste', donationRate: 5, logoUrl: 'https://logo.clearbit.com/lacoste.com.tr', type: 'brand', category: 'Giyim', agency: 'GelirOrtaklari' },
    { id: 'go-95', name: 'Arçelik', donationRate: 3, logoUrl: 'https://logo.clearbit.com/arcelik.com.tr', type: 'brand', category: 'Elektronik', agency: 'GelirOrtaklari' },
    { id: 'go-96', name: 'Little Caesars', donationRate: 6, logoUrl: 'https://logo.clearbit.com/littlecaesars.com.tr', type: 'brand', category: 'Gıda & İçecek', agency: 'GelirOrtaklari' },
];