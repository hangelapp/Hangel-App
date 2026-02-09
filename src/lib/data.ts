'use client';

import { 
    Award, Building, Calendar, CheckCircle, Dog, DollarSign, Download, Eye, Hand, Heart, 
    HeartPulse, Home, Languages, Leaf, Linkedin, Mail, MapPin, Milestone, Pencil, QrCode, 
    School, Share2, Shield, ShieldCheck, Sparkles, Star, Users, Utensils, PawPrint, Grape, 
    Palette, Dumbbell, Siren, Briefcase, Handshake, Landmark, Plane, Cpu, Store, LayoutGrid, 
    UserCircle, BookText, Settings2, HeartHandshake, Wallet, ShoppingBag, ShoppingCart, 
    Newspaper, Megaphone, Smartphone, StarHalf
} from 'lucide-react';
import type { Post, Brand, Event, Volunteering, Campaign, User, Badge, Certificate, StudentClub, SchoolRepresentative, Application, DonationTransaction, Notification, ManagedItem, NGO, AdBanner, HelpTopic, MarketCategory } from './types';

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

export const timelinePosts: Post[] = [
    { id: '1', author: { name: 'TEMA Vakfı', avatarUrl: 'https://logo.clearbit.com/tema.org.tr' }, content: 'Bugün Balıkesir fidan dikme etkinliğimizde 200 yeni ağacı toprakla buluşturduk! 🌳 Gelecek nesillere daha yeşil bir dünya bırakmak için var gücümüzle çalışıyoruz. #Doğaİçin #TEMA', timestamp: '2 saat önce', likes: 1240, comments: 45, imageUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=2013&auto=format&fit=crop', imageHint: 'planting trees' },
    { id: '2', author: { name: 'Ahbap Derneği', avatarUrl: 'https://logo.clearbit.com/ahbap.org' }, content: 'Hatay ve Adıyaman bölgelerindeki ihtiyaç sahibi aileler için hazırladığımız 5000 adet gıda kolisini gönüllü ekibimizle birlikte dağıtmaya başladık. 🙏 Dayanışma yaşatır! #Ahbap #Dayanışma', timestamp: '5 saat önce', likes: 3500, comments: 120, imageUrl: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?q=80&w=2070&auto=format&fit=crop', imageHint: 'food donation' },
    { id: '3', author: { name: 'Patagonia', avatarUrl: 'https://logo.clearbit.com/patagonia.com' }, content: 'Her alışverişin %10\'u okyanuslarımızı temizlemek ve deniz ekosistemini korumak için ayrılıyor. 🌊 Bilinçli tüketin, geleceği koruyun. #SustainableFashion #OceanGuardians', timestamp: '1 gün önce', likes: 850, comments: 12, imageUrl: 'https://images.unsplash.com/photo-1437622368342-7a3d73a34c8f?q=80&w=1920&auto=format&fit=crop', imageHint: 'sea turtle', sponsored: true },
    { id: '4', author: { name: 'LÖSEV', avatarUrl: 'https://logo.clearbit.com/losev.org.tr' }, content: 'Kanserle mücadele eden minik kahramanlarımızın eğitim hayatlarına destek olmak için yeni bir burs fonu açtık. Her tuğla bir umut! 💖 #LÖSEV #UmudunRengi', timestamp: '2 gün önce', likes: 2100, comments: 88, imageUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=2070&auto=format&fit=crop', imageHint: 'happy school children' },
    { id: '5', author: { name: 'Nike', avatarUrl: 'https://logo.clearbit.com/nike.com' }, content: 'Sporun birleştirici gücüne inanıyoruz. Dezavantajlı bölgelerdeki okullara spor ekipmanları ulaştırarak gençlerin hayallerine ortak oluyoruz. 🏀 #JustDoIt #SocialImpact', timestamp: '3 gün önce', likes: 12500, comments: 340, imageUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=2090&auto=format&fit=crop', imageHint: 'basketball court kids', sponsored: true }
];

export const allEntityLists: Brand[] = [
    // GİYİM
    { id: 'b1', name: 'Nike', category: 'Giyim', donationRate: 5, logoUrl: 'https://logo.clearbit.com/nike.com', type: 'brand', followers: 12000000, about: "Sporun geleceğini şekillendiriyoruz." },
    { id: 'b2', name: 'Adidas', category: 'Giyim', donationRate: 6, logoUrl: 'https://logo.clearbit.com/adidas.com', type: 'brand', followers: 10000000 },
    { id: 'b3', name: 'Patagonia', category: 'Giyim', donationRate: 10, logoUrl: 'https://logo.clearbit.com/patagonia.com', type: 'brand', followers: 5000000, about: "İşimizi evimizi kurtarmak için yapıyoruz." },
    { id: 'b4', name: 'Mavi', category: 'Giyim', donationRate: 7, logoUrl: 'https://logo.clearbit.com/mavi.com', type: 'brand', followers: 2000000 },
    { id: 'b5', name: 'Boyner', category: 'Giyim', donationRate: 4, logoUrl: 'https://logo.clearbit.com/boyner.com.tr', type: 'brand', followers: 3500000 },
    
    // AYAKKABI
    { id: 'b8', name: 'New Balance', category: 'Ayakkabı', donationRate: 5, logoUrl: 'https://logo.clearbit.com/newbalance.com', type: 'brand', followers: 4500000 },
    { id: 'b9', name: 'Converse', category: 'Ayakkabı', donationRate: 8, logoUrl: 'https://logo.clearbit.com/converse.com', type: 'brand', followers: 3000000 },
    { id: 'b10', name: 'Skechers', category: 'Ayakkabı', donationRate: 6, logoUrl: 'https://logo.clearbit.com/skechers.com.tr', type: 'brand', followers: 2500000 },
    
    // ELEKTRONIK
    { id: 'b12', name: 'Apple', category: 'Elektronik', donationRate: 2, logoUrl: 'https://logo.clearbit.com/apple.com', type: 'brand', followers: 50000000 },
    { id: 'b13', name: 'Samsung', category: 'Elektronik', donationRate: 3, logoUrl: 'https://logo.clearbit.com/samsung.com', type: 'brand', followers: 40000000 },
    { id: 'b14', name: 'Teknosa', category: 'Elektronik', donationRate: 4, logoUrl: 'https://logo.clearbit.com/teknosa.com', type: 'brand', followers: 2000000 },
    { id: 'b15', name: 'Trendyol', category: 'Pazaryeri', donationRate: 3, logoUrl: 'https://logo.clearbit.com/trendyol.com', type: 'brand', followers: 25000000 },
    { id: 'b16', name: 'Hepsiburada', category: 'Pazaryeri', donationRate: 3, logoUrl: 'https://logo.clearbit.com/hepsiburada.com', type: 'brand', followers: 15000000 },
    
    // KOOPERATİF & SOSYAL
    { id: 'b17', name: 'Tire Süt Kooperatifi', category: 'Gıda', donationRate: 12, logoUrl: 'https://logo.clearbit.com/tiresutkooperatifi.com.tr', type: 'cooperative', followers: 50000 },
    { id: 'b18', name: 'Kadın Emeği', category: 'El Sanatları', donationRate: 15, logoUrl: 'https://logo.clearbit.com/kedv.org.tr', type: 'social', followers: 120000 },
];

export const marketCategories: MarketCategory[] = [
    { mainCategory: 'Öne çıkanlar', subCategories: [] },
    { mainCategory: 'Tümü', subCategories: [] },
    { mainCategory: 'Pazaryeri', subCategories: [] },
    { mainCategory: 'Giyim', subCategories: [] },
    { mainCategory: 'Ayakkabı', subCategories: [] },
    { mainCategory: 'Kişisel Bakım', subCategories: [] },
    { mainCategory: 'Elektronik', subCategories: [] },
    { mainCategory: 'Ev & Yaşam', subCategories: [] },
    { mainCategory: 'Gıda', subCategories: [] },
];

export const categoryMapping = {
    'Giyim': ['Giyim', 'Moda'],
    'Ayakkabı': ['Ayakkabı', 'Shoe'],
    'Elektronik': ['Elektronik', 'Technology'],
    'Ev & Yaşam': ['Ev', 'Yaşam', 'Home'],
    'Süpermarket': ['Süpermarket', 'Market', 'Gıda'],
    'Kişisel Bakım': ['Kozmetik', 'Bakım'],
    'Pazaryeri': ['Pazaryeri', 'Marketplace']
};

export const adBanners: AdBanner[] = [
    { id: '1', title: 'Okul Alışverişiyle Destek Ol!', description: 'Kırtasiye ihtiyaçlarınızla TEGV\'e bağış yapın.', imageUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da096a0b?q=80&w=2022&auto=format&fit=crop', link: '/market' },
    { id: '2', title: 'Tatile Çıkarken İyilik Yapın', description: 'Rezervasyonlarınızla TEMA\'yı destekleyin.', imageUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=2073&auto=format&fit=crop', link: '/market' }
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
        about: "Ahbap, toplumsal yardımlaşmaya, dayanışmaya, sevgiye ve paylaşmaya dayalı bir işbirliği hareketidir. İhtiyaç sahiplerine doğrudan ulaşarak hayatlarına dokunuyoruz.",
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
        coverPhotoUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=2070&auto=format&fit=crop',
        stats: { followers: 450000, donors: 180000, volunteers: 60000, volunteerHours: 120000, projects: 80, totalDonation: 8500000, donationCount: 150000, avgDonation: 56.67, highestSingleDonation: 2500, peopleReached: 100000 },
        transparencyScore: 90,
        about: "Lösemili çocukları yaşatıyoruz. Onların tedavi, eğitim ve sosyal ihtiyaçlarını karşılayarak hayata tutunmalarını sağlıyoruz.",
        joinDate: "2023-03-15",
        supportedSDGs: ['Sağlıklı ve Kaliteli Yaşam', 'Nitelikli Eğitim'],
        beneficiaryGroups: ['Çocuklar', 'Hastalar', 'Aileler'],
        memberOf: ['Açık Açık'],
        contact: { email: 'losev@losev.org.tr', phone: '0312 447 06 60', website: 'https://losev.org.tr', social: { twitter: 'losev1998', instagram: 'losev1998', facebook: 'losev', linkedin: 'losev' } },
        posts: [],
        opportunities: []
    }
];

export const events: Event[] = [
  {
    id: '1',
    name: 'Girişimcilik Zirvesi \'24',
    organizer: 'İTÜ Girişimcilik Kulübü',
    type: 'Zirve',
    date: '25 Ekim 2024',
    time: '10:00 - 18:00',
    location: 'İTÜ Ayazağa Yerleşkesi',
    capacity: { current: 150, max: 200 },
    tags: ['Girişimcilik', 'Zirve', 'Network'],
    imageUrl: 'https://images.unsplash.com/photo-1540575861501-7ad0582371f3?q=80&w=2070&auto=format&fit=crop',
    imageHint: 'conference auditorium',
    description: 'Türkiye\'nin önde gelen girişimcilerini bir araya getiren en büyük öğrenci zirvesi.',
    providesCertificate: true
  },
  {
    id: '2',
    name: 'SivilFest Karşıyaka',
    organizer: 'Karşıyaka Belediyesi',
    type: 'Festival',
    date: '1-7 Aralık 2024',
    time: '09:00 - 20:00',
    location: 'Karşıyaka Sahil',
    capacity: { current: 500, max: 1000 },
    tags: ['Sivil Toplum', 'Festival', 'Dayanışma'],
    imageUrl: 'https://images.unsplash.com/photo-1523050335392-9bc56751d11a?q=80&w=2070&auto=format&fit=crop',
    imageHint: 'festival crowd',
    description: 'Sivil toplum kuruluşlarının projelerini sergilediği dev festival.',
    providesCertificate: true
  }
];

export const studentClubs: StudentClub[] = [
    { id: '1', name: 'İTÜ Girişimcilik Kulübü', university: 'İTÜ', type: 'university', avatarUrl: 'https://logo.clearbit.com/itu.edu.tr', coverPhotoUrl: '', members: 1500, points: 12500, description: 'Girişimcilik ekosistemini kampüse taşıyoruz.', vision: 'Lider girişimciler yetiştirmek.', joinDate: '2023-05-20', contact: { email: 'gk@itu.edu.tr', phone: '', website: '' } },
    { id: '2', name: 'Boğaziçi Müzik Kulübü', university: 'Boğaziçi Üni.', type: 'university', avatarUrl: 'https://logo.clearbit.com/boun.edu.tr', coverPhotoUrl: '', members: 800, points: 8500, description: 'Sanatla toplumu birleştiriyoruz.', vision: 'Evrensel müzik kültürü.', joinDate: '2023-06-10', contact: { email: 'bumk@boun.edu.tr', phone: '', website: '' } }
];

export const schoolRepresentatives: SchoolRepresentative[] = [
    { id: '1', name: 'Can Demir', school: 'İTÜ', type: 'university', role: 'Kampüs Elçisi', avatarUrl: 'https://i.pravatar.cc/150?u=can', linkedinUrl: '#' }
];

export const volunteeringOpportunities: Volunteering[] = [
    { id: '1', title: 'Afet Bölgesi Lojistik Destek', organization: 'Ahbap Derneği', ngoId: '2', location: { city: 'Hatay', district: 'Antakya', type: 'Saha' }, commitment: 'Dönemsel', volunteerCount: { needed: 50, applications: 120 }, dates: { applicationStart: '2024-07-01', applicationEnd: '2024-07-25', eventStart: '2024-08-01', eventEnd: '2024-08-08' }, hours: { start: '09:00', end: '18:00', total: 56 }, socialArea: 'Afet', points: 1500, ngoTransparencyScore: 95, taskType: 'Dönemsel', providesCertificate: true, earnedBadges: ['Afet Kahramanı'], hasPreTraining: true, description: 'Bölgedeki yardım kolilerinin tasnifi ve dağıtımında görev alacak gönüllüler arıyoruz.', amenities: { transport: true, food: true, accommodation: true } },
    { id: '2', title: 'Çocuklara Kodlama Eğitimi', organization: 'TEGV', ngoId: '3', location: { city: 'Online', district: '', type: 'Online' }, commitment: 'Sürekli', volunteerCount: { needed: 20, applications: 45 }, dates: { applicationStart: '2024-07-10', applicationEnd: '2024-08-10', eventStart: '2024-09-01', eventEnd: '2024-12-30' }, hours: { start: '18:00', end: '20:00', total: 40 }, socialArea: 'Eğitim', points: 800, ngoTransparencyScore: 90, taskType: 'Sürekli', providesCertificate: true, earnedBadges: ['Eğitim Gönüllüsü'], hasPreTraining: true, description: 'İlkokul seviyesindeki çocuklara Scratch üzerinden temel kodlama mantığını öğretecek eğitmenler.', amenities: { transport: false, food: false, accommodation: false } }
];

export const applications: Application[] = [
    { id: '1', title: 'Afet Bölgesi Yardım Dağıtımı', type: 'Gönüllülük', org: 'Ahbap', date: '2024-07-21', location: 'Hatay', status: 'Onaylandı', entityId: '1' }
];

export const donationTransactions: DonationTransaction[] = [
    { id: '1', type: 'expense', brand: 'Patagonia', purchaseAmount: '250.00', donationAmount: '25.00', ngo: ['TEMA'], date: '2024-07-21', time: '14:32' },
    { id: '2', type: 'income', brand: 'Bakiye Yükleme', purchaseAmount: '500.00', donationAmount: '0.00', ngo: [], date: '2024-07-20', time: '10:00' }
];

export const badges: Badge[] = [
    { id: '1', name: 'Çevre Koruyucusu', iconName: Leaf, level: 'Bronz', socialArea: 'Çevre', pointsRequired: 500, currentPoints: 800 },
    { id: '2', name: 'Hayvan Dostu', iconName: Dog, level: 'Gümüş', socialArea: 'Hayvan Hakları', pointsRequired: 1000, currentPoints: 1200 }
];

export const certificates: Certificate[] = [
    { id: '1', title: 'Afet Gönüllülüğü Başarı Belgesi', organization: 'Ahbap', date: '15.07.2024', linkedinUrl: '#' },
    { id: '2', title: 'Dijital Mentorluk Sertifikası', organization: 'Hangel A.Ş.', date: '01.06.2024', linkedinUrl: '#' }
];

export const helpTopics: HelpTopic[] = [
    { icon: 'Info', title: 'Genel Bilgiler', slug: 'genel', description: 'Platformun işleyişi hakkında temel bilgiler.', subtopics: [{ title: 'hangel Nedir?', link: '#', content: 'Hangel, alışverişi iyiliğe dönüştüren bir sosyal girişimdir.' }] },
    { icon: 'DollarSign', title: 'Bağış ve Ödemeler', slug: 'bagis', description: 'Bağış süreçleri ve cüzdan kullanımı.', subtopics: [{ title: 'Nasıl bağış yaparım?', link: '#', content: 'Anlaşmalı markalardan alışveriş yaparak bağış yapabilirsiniz.' }] }
];

export const ngoHelpTopics = helpTopics;
export const ngoFaqArticles = [{ title: 'Bağışlar ne zaman aktarılır?', link: '#' }];
export const pastVolunteering = [];
export const managedItems: ManagedItem[] = [
    { name: 'Ahbap Derneği', type: 'STK', icon: 'heart', href: '/ngo-admin/dashboard', status: 'approved', logoUrl: 'https://logo.clearbit.com/ahbap.org' }
];

export const qrPaymentCardData = [
    { id: 'bireysel', type: 'Bireysel', bgColor: 'bg-primary', number: '5549601000001234', owner: 'İsmail Hilmi ADIGÜZEL', expiry: '12/28', balance: '1.250,75 ₺', ngoId: '1', cvv: '123' }
];
