
'use client';

import { Leaf, Heart, HeartHandshake, Star, Award, Calendar, MapPin, Landmark, Briefcase, DollarSign } from 'lucide-react';
import type { Post, Brand, Event, Volunteering, User, Badge, Certificate, StudentClub, SchoolRepresentative, Application, DonationTransaction, ManagedItem, NGO, AdBanner, MarketCategory, HelpTopic } from './types';

const slugify = (str: string) => {
  if (!str) return '';
  return str.toString()
    .toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
}

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

const brandsData = [
    { name: 'Trip.com', rate: 2, category: 'Seyahat', domain: 'trip.com' },
    { name: 'Pazarama', rate: 2, category: 'Pazar Yeri', domain: 'pazarama.com' },
    { name: 'Karaca', rate: 3, category: 'Ev & Yaşam', domain: 'karaca.com' },
    { name: 'Yalıspor', rate: 2, category: 'Giyim', domain: 'yalispor.com.tr' },
    { name: 'Mango', rate: 2, category: 'Giyim', domain: 'mango.com' },
    { name: 'Getir', rate: 2, category: 'Süpermarket', domain: 'getir.com' },
    { name: 'Tatilbudur', rate: 3, category: 'Seyahat', domain: 'tatilbudur.com' },
    { name: 'CarrefourSA', rate: 2, category: 'Süpermarket', domain: 'carrefoursa.com' },
    { name: 'Boyner', rate: 2, category: 'Giyim', domain: 'boyner.com.tr' },
    { name: 'Ucuzabilet', rate: 2, category: 'Seyahat', domain: 'ucuzabilet.com' },
    { name: 'CamperTR', rate: 4.67, category: 'Ayakkabı', domain: 'camper.com' },
    { name: 'H&M', rate: 6, category: 'Giyim', domain: 'hm.com' },
    { name: 'Bilet.com', rate: 2, category: 'Seyahat', domain: 'bilet.com' },
    { name: 'Tchibo', rate: 2, category: 'Gıda & İçecek', domain: 'tchibo.com.tr' },
    { name: 'Homend', rate: 2, category: 'Elektronik', domain: 'homend.com.tr' },
    { name: 'Skechers', rate: 2, category: 'Ayakkabı', domain: 'skechers.com.tr' },
    { name: 'MediaMarkt', rate: 2, category: 'Elektronik', domain: 'mediamarkt.com.tr' },
    { name: 'Mudo', rate: 1.8, category: 'Giyim', domain: 'mudo.com.tr' },
    { name: 'Bella Maison', rate: 2, category: 'Ev & Yaşam', domain: 'bellamaison.com' },
    { name: 'Ayakkabı Dünyası', rate: 4, category: 'Ayakkabı', domain: 'ayakkabidunyasi.com.tr' },
    { name: 'Decathlon', rate: 2, category: 'Giyim', domain: 'decathlon.com.tr' },
    { name: 'Carter’s', rate: 2, category: 'Anne & Bebek', domain: 'carters.com' },
    { name: 'MinyCenter', rate: 2, category: 'Anne & Bebek', domain: 'minycenter.com.tr' },
    { name: 'Huawei', rate: 2, category: 'Elektronik', domain: 'huawei.com' },
    { name: 'Vitaminler', rate: 5, category: 'Kozmetik & Bakım', domain: 'vitaminler.com' },
    { name: 'Amazon TR', rate: 13, category: 'Pazar Yeri', domain: 'amazon.com.tr' },
    { name: 'Emsan', rate: 2, category: 'Ev & Yaşam', domain: 'emsan.com.tr' },
    { name: 'Mavi', rate: 2, category: 'Giyim', domain: 'mavi.com' },
    { name: 'A101', rate: 2, category: 'Süpermarket', domain: 'a101.com.tr' },
    { name: 'Pierre Cardin', rate: 11, category: 'Giyim', domain: 'pierrecardin.com.tr' },
    { name: 'Cacharel', rate: 11, category: 'Giyim', domain: 'cacharel.com.tr' },
    { name: 'US Polo Assn.', rate: 11, category: 'Giyim', domain: 'tr.uspoloassn.com' },
    { name: 'n11', rate: 2, category: 'Pazar Yeri', domain: 'n11.com' },
    { name: 'Samsung', rate: 1.66, category: 'Elektronik', domain: 'samsung.com' },
    { name: 'Penti', rate: 2, category: 'Giyim', domain: 'penti.com' },
    { name: 'Teknosa', rate: 2, category: 'Elektronik', domain: 'teknosa.com' },
    { name: 'Altınbaş', rate: 2, category: 'Aksesuar & Takı', domain: 'altinbas.com' },
    { name: 'IKEA', rate: 2, category: 'Ev & Yaşam', domain: 'ikea.com.tr' },
    { name: 'Etstur', rate: 2, category: 'Seyahat', domain: 'etstur.com' },
    { name: 'Divarese', rate: 5, category: 'Ayakkabı', domain: 'divarese.com.tr' },
    { name: 'Flaw Wear', rate: 3, category: 'Giyim', domain: 'flawwear.com' },
    { name: 'Fresh Scarfs', rate: 5, category: 'Giyim', domain: 'freshscarfs.com' },
    { name: 'TARTI', rate: 10, category: 'Hobi & Hizmet', domain: 'tarti.com' },
    { name: 'Reeder', rate: 1.5, category: 'Elektronik', domain: 'reeder.com.tr' },
    { name: 'Enjoy eSIM', rate: 9, category: 'Hobi & Hizmet', domain: 'enjoyesim.com' },
    { name: 'Madame Coco', rate: 4, category: 'Ev & Yaşam', domain: 'madamecoco.com' },
    { name: 'LG', rate: 3, category: 'Elektronik', domain: 'lg.com' },
    { name: 'Arkopharma', rate: 15, category: 'Kozmetik & Bakım', domain: 'arkopharma.com.tr' },
    { name: 'Petzzshop', rate: 3, category: 'Hobi & Hizmet', domain: 'petzzshop.com' },
    { name: 'Manuka', rate: 5, category: 'Giyim', domain: 'manuka.com.tr' },
    { name: 'Kayra', rate: 5, category: 'Giyim', domain: 'kayra.com' },
    { name: 'Sosyopix', rate: 10, category: 'Hobi & Hizmet', domain: 'sosyopix.com' },
    { name: 'Airalo', rate: 8, category: 'Seyahat', domain: 'airalo.com' },
    { name: 'Xiaomi', rate: 2, category: 'Elektronik', domain: 'mi.com' },
    { name: 'FLO', rate: 7.5, category: 'Ayakkabı', domain: 'flo.com.tr' },
    { name: 'Forever21', rate: 2, category: 'Giyim', domain: 'forever21.com' },
    { name: 'Bialetti', rate: 7, category: 'Ev & Yaşam', domain: 'bialetti.com.tr' },
    { name: 'Tazecicek', rate: 4.5, category: 'Hobi & Hizmet', domain: 'tazecicek.com' },
    { name: 'Mizalle', rate: 5, category: 'Giyim', domain: 'mizalle.com' },
    { name: 'Teknevia', rate: 2, category: 'Seyahat', domain: 'teknevia.com' },
    { name: 'Lona Cosmetics', rate: 25, category: 'Kozmetik & Bakım', domain: 'lonacosmetics.com' },
    { name: 'EvdeEczane', rate: 3, category: 'Kozmetik & Bakım', domain: 'evdeeczane.com' },
    { name: 'Cosmed', rate: 5, category: 'Kozmetik & Bakım', domain: 'cosmed.com.tr' },
    { name: 'Tonguç Akademi', rate: 5.5, category: 'Hobi & Hizmet', domain: 'tongucakademi.com' },
    { name: 'Tonguç Mağaza', rate: 5.5, category: 'Hobi & Hizmet', domain: 'tongucmagaza.com' },
    { name: 'Kütahya Porselen', rate: 4, category: 'Ev & Yaşam', domain: 'kutahyaporselen.com' },
    { name: 'General Mobile', rate: 2, category: 'Elektronik', domain: 'generalmobile.com' },
    { name: 'Farfetch', rate: 7, category: 'Giyim', domain: 'farfetch.com' },
    { name: 'Konyalı Saat', rate: 2, category: 'Aksesuar & Takı', domain: 'konyalisaat.com.tr' },
    { name: 'Korkmaz', rate: 3, category: 'Ev & Yaşam', domain: 'korkmaz.com.tr' },
    { name: 'E-bebek', rate: 2.5, category: 'Anne & Bebek', domain: 'e-bebek.com' },
    { name: 'Slazenger', rate: 3, category: 'Giyim', domain: 'slazenger.com.tr' },
    { name: 'Tudors', rate: 6, category: 'Giyim', domain: 'tudors.com' },
    { name: 'Casper', rate: 2, category: 'Elektronik', domain: 'casper.com.tr' },
    { name: 'Toyzz Shop', rate: 7.2, category: 'Anne & Bebek', domain: 'toyzzshop.com' },
    { name: 'Taç', rate: 4, category: 'Ev & Yaşam', domain: 'tac.com.tr' },
    { name: 'PUMA', rate: 6, category: 'Giyim', domain: 'puma.com' },
    { name: 'Marks & Spencer', rate: 2, category: 'Giyim', domain: 'marksandspencer.com.tr' },
    { name: 'GAP', rate: 2, category: 'Giyim', domain: 'gap.com.tr' },
    { name: 'Beymen', rate: 3, category: 'Giyim', domain: 'beymen.com' },
    { name: 'Banggood', rate: 5.5, category: 'Pazar Yeri', domain: 'banggood.com' },
    { name: 'Koçtaş', rate: 2.2, category: 'Ev & Yaşam', domain: 'koctas.com.tr' },
    { name: 'Colins', rate: 9, category: 'Giyim', domain: 'colins.com.tr' },
    { name: 'D&R', rate: 2.5, category: 'Hobi & Hizmet', domain: 'dr.com.tr' },
    { name: 'Koton', rate: 4.5, category: 'Giyim', domain: 'koton.com' },
    { name: 'Linens', rate: 5, category: 'Ev & Yaşam', domain: 'linens.com.tr' },
    { name: 'Saat & Saat', rate: 1, category: 'Aksesuar & Takı', domain: 'saatvesaat.com.tr' },
    { name: 'Sportive', rate: 6.5, category: 'Giyim', domain: 'sportive.com.tr' },
    { name: 'Beko', rate: 3, category: 'Elektronik', domain: 'beko.com.tr' },
    { name: 'Benetton', rate: 6, category: 'Giyim', domain: 'benetton.com' },
    { name: 'Yargıcı', rate: 5.6, category: 'Giyim', domain: 'yargici.com' },
    { name: 'Gant', rate: 6, category: 'Giyim', domain: 'gant.com.tr' },
    { name: 'Nautica', rate: 7, category: 'Giyim', domain: 'nautica-tr.com' },
    { name: 'Lacoste', rate: 5, category: 'Giyim', domain: 'lacoste.com.tr' },
    { name: 'Arçelik', rate: 3, category: 'Elektronik', domain: 'arcelik.com.tr' },
    { name: 'Little Caesars', rate: 6, category: 'Gıda & İçecek', domain: 'littlecaesars.com.tr' }
];

export const allEntityLists: Brand[] = brandsData.map((brand, index) => ({
    id: `brand-${index + 1}`,
    slug: slugify(brand.name),
    name: brand.name,
    donationRate: brand.rate,
    logoUrl: `https://logo.clearbit.com/${brand.domain}`,
    type: 'brand',
    category: brand.category,
    agency: 'GelirOrtaklari' // default
}));

const categories = [...new Set(allEntityLists.map(b => b.category))];
export const marketCategories: MarketCategory[] = [{ mainCategory: 'Tümü', subCategories: [] }, ...categories.map(c => ({ mainCategory: c, subCategories: [] }))];


export const timelinePosts: Post[] = [
    { id: '1', author: { name: 'TEMA Vakfı', avatarUrl: 'https://logo.clearbit.com/tema.org.tr' }, content: 'Bugün Balıkesir fidan dikme etkinliğimizde 200 yeni ağacı toprakla buluşturduk! 🌳 Gelecek nesillere daha yeşil bir dünya bırakmak için var gücümüzle çalışıyoruz. #Doğaİçin #TEMA', timestamp: '2 saat önce', likes: 1240, comments: 45, imageUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=2013&auto=format&fit=crop', imageHint: 'planting trees' },
    { id: '2', author: { name: 'Ahbap Derneği', avatarUrl: 'https://logo.clearbit.com/ahbap.org' }, content: 'Hatay ve Adıyaman bölgelerindeki ihtiyaç sahibi aileler için hazırladığımız 5000 adet gıda kolisini gönüllü ekibimizle birlikte dağıtmaya başladık. 🙏 Dayanışma yaşatır! #Ahbap #Dayanışma', timestamp: '5 saat önce', likes: 3500, comments: 120, imageUrl: 'https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?q=80&w=2070&auto=format&fit=crop', imageHint: 'food donation' }
];

export const adBanners: AdBanner[] = [
    { id: '1', title: 'Okul Alışverişiyle Destek Ol!', description: 'Kırtasiye ihtiyaçlarınızla TEGV\'e bağış yapın.', imageUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da096a0b?q=80&w=2022&auto=format&fit=crop', link: '/market?category=Kırtasiye' },
    { id: '2', title: 'Yaz Tatili Fırsatları', description: 'Tatil rezervasyonlarınızla sokak hayvanlarına umut olun.', imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723a9ce6890?q=80&w=2070&auto=format&fit=crop', link: '/market?category=Seyahat' },
    { id: '3', title: 'Teknolojide İyilik Var', description: 'Elektronik alışverişlerinizle LÖSEV\'e destek olun.', imageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=2070&auto=format&fit=crop', link: '/market?category=Elektronik' },
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
    },
    {
        id: '5',
        name: 'Türkiye Eğitim Gönüllüleri Vakfı',
        shortName: 'TEGV',
        foundationYear: 1995,
        category: 'Eğitim',
        type: 'Vakıf',
        avatarUrl: 'https://logo.clearbit.com/tegv.org',
        coverPhotoUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop',
        stats: { followers: 250000, donors: 80000, volunteers: 60000, volunteerHours: 400000, projects: 300, totalDonation: 5000000, donationCount: 150000, avgDonation: 33.33, highestSingleDonation: 700, peopleReached: 800000 },
        transparencyScore: 94,
        about: "TEGV, ilköğretim çağındaki çocuklarımıza okul dışı, çok yönlü bir eğitim desteği vererek, onları geleceğe donanımlı bireyler olarak hazırlamayı amaçlar.",
        joinDate: "2023-05-10",
        supportedSDGs: ['Nitelikli Eğitim', 'Eşitsizliklerin Azaltılması'],
        beneficiaryGroups: ['Çocuklar', 'Öğrenciler', 'Gençler'],
        memberOf: ['Açık Açık'],
        contact: { email: 'info@tegv.org', phone: '0216 290 70 00', website: 'https://tegv.org', social: { twitter: 'tegv', instagram: 'tegv', facebook: 'tegv', linkedin: 'tegv' } },
        posts: [],
        opportunities: []
    },
    {
        id: '6',
        name: 'İnsan Hakları Derneği',
        shortName: 'İHD',
        foundationYear: 1986,
        category: 'İnsan Hakları',
        type: 'Dernek',
        avatarUrl: 'https://logo.clearbit.com/ihd.org.tr',
        coverPhotoUrl: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=2070&auto=format&fit=crop',
        stats: { followers: 80000, donors: 15000, volunteers: 5000, volunteerHours: 50000, projects: 40, totalDonation: 500000, donationCount: 20000, avgDonation: 25, highestSingleDonation: 400, peopleReached: 100000 },
        transparencyScore: 85,
        about: "İnsan Hakları Derneği, Türkiye'de insan haklarının korunması, geliştirilmesi ve ihlallerin önlenmesi için mücadele eden bağımsız bir sivil toplum kuruluşudur.",
        joinDate: "2023-06-20",
        supportedSDGs: ['Barış, Adalet ve Güçlü Kurumlar', 'Eşitsizliklerin Azaltılması'],
        beneficiaryGroups: ['Hak mücadelesi verenler'],
        memberOf: [],
        contact: { email: 'info@ihd.org.tr', phone: '0312 417 71 80', website: 'https://ihd.org.tr', social: { twitter: 'ihdgenelmerkez', instagram: 'ihdgenelmerkez', facebook: 'ihdgenelmerkez', linkedin: 'insan-haklari-dernegi' } },
        posts: [],
        opportunities: []
    },
     {
        id: '7',
        name: 'Kadın Emeğini Değerlendirme Vakfı',
        shortName: 'KEDV',
        foundationYear: 1986,
        category: 'Kadın Hakları',
        type: 'Vakıf',
        avatarUrl: 'https://logo.clearbit.com/kedv.org.tr',
        coverPhotoUrl: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=2070&auto=format&fit=crop',
        stats: { followers: 95000, donors: 25000, volunteers: 8000, volunteerHours: 60000, projects: 70, totalDonation: 1200000, donationCount: 30000, avgDonation: 40, highestSingleDonation: 550, peopleReached: 150000 },
        transparencyScore: 91,
        about: "KEDV, dar gelirli kadınların ekonomik ve sosyal olarak güçlenmelerini desteklemek amacıyla kurulmuştur. Kadınların kurduğu kooperatifler aracılığıyla sürdürülebilir bir yaşam kurmalarına destek oluyoruz.",
        joinDate: "2023-07-01",
        supportedSDGs: ['Toplumsal Cinsiyet Eşitliği', 'İnsana Yakışır İş ve Ekonomik Büyüme', 'Yoksulluğa Son'],
        beneficiaryGroups: ['Kadınlar', 'Girişimciler'],
        memberOf: [],
        contact: { email: 'kedv@kedv.org.tr', phone: '0212 244 17 64', website: 'https://www.kedv.org.tr', social: { twitter: 'kedv', instagram: 'kedv', facebook: 'kedv', linkedin: 'kedv' } },
        posts: [],
        opportunities: []
    },
    {
        id: '8',
        name: 'Hangel Derneği',
        shortName: 'Hangel',
        foundationYear: 2020,
        category: 'Sosyal İnovasyon',
        type: 'Dernek',
        avatarUrl: '',
        coverPhotoUrl: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=2070&auto=format&fit=crop',
        stats: { followers: 15000, donors: 5000, volunteers: 2000, volunteerHours: 10000, projects: 15, totalDonation: 250000, donationCount: 1000, avgDonation: 250, highestSingleDonation: 5000, peopleReached: 50000 },
        transparencyScore: 98,
        about: "Hangel Derneği, sosyal fayda odaklı teknoloji ve inovasyon projeleri geliştirerek, bireylerin ve kurumların sosyal etki potansiyelini en üst düzeye çıkarmayı hedefler. Sürdürülebilir ve ölçülebilir çözümlerle toplumsal sorunlara kalıcı çözümler üretmek için çalışır.",
        joinDate: "2023-01-01",
        supportedSDGs: ['Amaçlar için Ortaklıklar', 'Sanayi, Yenilikçilik ve Altyapı', 'Nitelikli Eğitim'],
        beneficiaryGroups: ['Girişimciler', 'Gençler', 'Sivil Toplum', 'Öğrenciler'],
        memberOf: ['Açık Açık', 'Afet Platformu'],
        contact: { email: 'dernek@hangel.org', phone: '0850 123 45 67', website: 'https://hangelassociation.org', social: { twitter: 'hangel', instagram: 'hangel', facebook: 'hangel', linkedin: 'hangel' } },
        posts: [],
        opportunities: []
    }
];

export const volunteeringOpportunities: Volunteering[] = [
    { id: '1', title: 'Afet Bölgesi Lojistik Destek', organization: 'Ahbap Derneği', ngoId: '2', location: { city: 'Hatay', district: 'Antakya', type: 'Saha' }, commitment: 'Dönemsel', volunteerCount: { needed: 50, applications: 120 }, dates: { applicationStart: '2024-07-01', applicationEnd: '2024-07-25', eventStart: '2024-08-01', eventEnd: '2024-08-08' }, hours: { start: '09:00', end: '18:00', total: 56 }, socialArea: 'Afet', points: 1500, ngoTransparencyScore: 95, taskType: 'Dönemsel', providesCertificate: true, earnedBadges: ['Afet Kahramanı'], hasPreTraining: true, description: 'Bölgedeki yardım kolilerinin tasnifi ve dağıtımında görev alacak gönüllüler arıyoruz.', amenities: { transport: true, food: true, accommodation: true } },
    { id: '2', title: 'Fidan Dikme Etkinliği', organization: 'TEMA Vakfı', ngoId: '1', location: { city: 'İstanbul', district: 'Beykoz', type: 'Saha' }, commitment: 'Tek Günlük', volunteerCount: { needed: 100, applications: 250 }, dates: { applicationStart: '2024-08-01', applicationEnd: '2024-08-20', eventStart: '2024-09-01', eventEnd: '2024-09-01' }, hours: { start: '10:00', end: '16:00', total: 6 }, socialArea: 'Çevre', points: 500, ngoTransparencyScore: 92, taskType: 'Tek Gün', providesCertificate: true, earnedBadges: ['Doğa Koruyucu'], hasPreTraining: false, description: 'Geleceğe nefes olmak için binlerce fidanı toprakla buluşturuyoruz.', amenities: { transport: false, food: true, accommodation: false } },
    { id: '3', title: 'Sosyal Medya İçerik Gönüllüsü', organization: 'LÖSEV', ngoId: '3', location: { city: 'Online', district: 'Online', type: 'Online' }, commitment: 'Sürekli', volunteerCount: { needed: 5, applications: 45 }, dates: { applicationStart: '2024-07-15', applicationEnd: '2024-08-15', eventStart: '2024-08-20', eventEnd: '2025-08-20' }, hours: { start: '09:00', end: '18:00', total: 240 }, socialArea: 'Sağlık', points: 2000, ngoTransparencyScore: 90, taskType: 'Sürekli', providesCertificate: true, earnedBadges: [], hasPreTraining: true, description: 'LÖSEV\'in sosyal medya hesapları için yaratıcı ve etkili içerikler üretecek gönüllüler arıyoruz.', amenities: { transport: false, food: false, accommodation: false }, skills: ['Sosyal Medya Yönetimi', 'Grafik Tasarım'] },
    { id: '4', title: 'Barınak Ziyareti ve Bakım', organization: 'HAYTAP', ngoId: '4', location: { city: 'Ankara', district: 'Çankaya', type: 'Saha' }, commitment: 'Dönemsel', volunteerCount: { needed: 20, applications: 60 }, dates: { applicationStart: '2024-08-05', applicationEnd: '2024-08-25', eventStart: '2024-09-01', eventEnd: '2024-11-01' }, hours: { start: '13:00', end: '17:00', total: 48 }, socialArea: 'Hayvan Hakları', points: 800, ngoTransparencyScore: 88, taskType: 'Dönemsel', providesCertificate: false, earnedBadges: ['Hayvan Dostu'], hasPreTraining: false, description: 'Barınaktaki dostlarımızın bakımlarına yardımcı olacak, onlarla sevgi dolu zaman geçirecek hayvanseverler arıyoruz.', amenities: { transport: false, food: false, accommodation: false } },
    {
        id: '5',
        title: 'Proje Yönetimi Desteği',
        organization: 'Ahbap Derneği',
        ngoId: '2',
        location: { city: 'Online', district: 'Online', type: 'Online' },
        commitment: 'Sürekli',
        volunteerCount: { needed: 2, applications: 15 },
        dates: { applicationStart: '2024-08-01', applicationEnd: '2024-08-30', eventStart: '2024-09-05', eventEnd: '2025-09-05' },
        hours: { start: '10:00', end: '17:00', total: 200 },
        socialArea: 'Dayanışma',
        points: 2500,
        ngoTransparencyScore: 95,
        taskType: 'Sürekli',
        providesCertificate: true,
        earnedBadges: ['Proje Lideri'],
        hasPreTraining: false,
        description: 'Ahbap Derneği\'nin yeni sosyal sorumluluk projelerinin planlanması, yürütülmesi ve raporlanması süreçlerinde destek olacak deneyimli proje yönetimi gönüllüleri arıyoruz.',
        amenities: { transport: false, food: false, accommodation: false },
        skills: ['Proje Yönetimi']
    },
    {
        id: '6',
        title: 'Web Sitesi Yenileme Projesi',
        organization: 'TEGV',
        ngoId: '5',
        location: { city: 'Online', district: 'Online', type: 'Online' },
        commitment: 'Dönemsel',
        volunteerCount: { needed: 3, applications: 25 },
        dates: { applicationStart: '2024-08-10', applicationEnd: '2024-09-10', eventStart: '2024-09-15', eventEnd: '2024-12-15' },
        hours: { start: '19:00', end: '22:00', total: 120 },
        socialArea: 'Eğitim',
        points: 3000,
        ngoTransparencyScore: 94,
        taskType: 'Dönemsel',
        providesCertificate: true,
        earnedBadges: ['Teknoloji Destekçisi'],
        hasPreTraining: false,
        description: 'TEGV\'in web sitesini modern standartlara uygun olarak yenileyecek, kullanıcı dostu bir arayüz tasarlayacak ön-yüz (frontend) geliştiricileri ve UI/UX tasarımcıları arıyoruz.',
        amenities: { transport: false, food: false, accommodation: false },
        skills: ['Web Geliştirme', 'Figma']
    },
    {
        id: '7',
        title: 'Hukuki Danışmanlık Desteği',
        organization: 'İnsan Hakları Derneği',
        ngoId: '6',
        location: { city: 'Online', district: 'Online', type: 'Online' },
        commitment: 'Sürekli',
        volunteerCount: { needed: 4, applications: 18 },
        dates: { applicationStart: '2024-08-01', applicationEnd: '2024-08-31', eventStart: '2024-09-01', eventEnd: '2025-09-01' },
        hours: { start: '10:00', end: '17:00', total: 150 },
        socialArea: 'İnsan Hakları',
        points: 3500,
        ngoTransparencyScore: 85,
        taskType: 'Sürekli',
        providesCertificate: false,
        earnedBadges: ['Adalet Savunucusu'],
        hasPreTraining: false,
        description: 'İnsan hakları ihlalleri konusunda derneğimize başvuran kişilere yönelik hukuki danışmanlık süreçlerinde destek olacak, ilgili davaları takip edecek gönüllü avukatlar arıyoruz.',
        amenities: { transport: false, food: false, accommodation: false },
        skills: ['Hukuki Danışmanlık']
    },
    {
        id: '8',
        title: 'Yaz Kampı Liderliği',
        organization: 'TEGV',
        ngoId: '5',
        location: { city: 'İzmir', district: 'Çeşme', type: 'Saha' },
        commitment: 'Dönemsel',
        volunteerCount: { needed: 10, applications: 80 },
        dates: { applicationStart: '2024-05-01', applicationEnd: '2024-06-01', eventStart: '2024-07-01', eventEnd: '2024-07-15' },
        hours: { start: '09:00', end: '17:00', total: 80 },
        socialArea: 'Çocuk',
        points: 1800,
        ngoTransparencyScore: 94,
        taskType: 'Dönemsel',
        providesCertificate: true,
        earnedBadges: ['Eğitim Gönüllüsü'],
        hasPreTraining: true,
        description: 'Dezavantajlı bölgelerden gelen çocuklar için düzenlediğimiz yaz kampında, çocuklarla oyunlar oynayacak, atölyeler düzenleyecek ve onlara rol model olacak enerjik kamp liderleri arıyoruz.',
        amenities: { transport: true, food: true, accommodation: true },
        skills: ['Çocuk Bakımı', 'Organizasyon', 'İletişim']
    },
    {
        id: '9',
        title: 'Uluslararası Konferans Tercümanı',
        organization: 'Ahbap Derneği',
        ngoId: '2',
        location: { city: 'İstanbul', district: 'Beşiktaş', type: 'Saha' },
        commitment: 'Tek Günlük',
        volunteerCount: { needed: 5, applications: 30 },
        dates: { applicationStart: '2024-09-01', applicationEnd: '2024-09-20', eventStart: '2024-10-05', eventEnd: '2024-10-05' },
        hours: { start: '09:00', end: '18:00', total: 9 },
        socialArea: 'Sosyal Girişimcilik',
        points: 750,
        ngoTransparencyScore: 95,
        taskType: 'Tek Gün',
        providesCertificate: false,
        earnedBadges: [],
        hasPreTraining: false,
        description: 'Sosyal girişimcilik üzerine düzenleyeceğimiz uluslararası konferansta, İngilizce-Türkçe ve Türkçe-İngilizce ardıl çeviri yapacak deneyimli tercüman gönüllüler arıyoruz.',
        amenities: { transport: false, food: true, accommodation: false },
        skills: ['Tercümanlık'],
        languages: ['İngilizce', 'Türkçe']
    },
    {
        id: '10',
        title: 'Aşevi Yemek Dağıtımı',
        organization: 'Ahbap Derneği',
        ngoId: '2',
        location: { city: 'Ankara', district: 'Çankaya', type: 'Saha' },
        commitment: 'Sürekli',
        volunteerCount: { needed: 8, applications: 40 },
        dates: { applicationStart: '2024-08-01', applicationEnd: '2024-08-31', eventStart: '2024-09-01', eventEnd: '2025-09-01' },
        hours: { start: '11:00', end: '14:00', total: 156 },
        socialArea: 'Yoksullukla Mücadele',
        points: 1200,
        ngoTransparencyScore: 95,
        taskType: 'Sürekli',
        providesCertificate: false,
        earnedBadges: ['Dayanışma Elçisi'],
        hasPreTraining: true,
        description: 'Ankara\'daki aşevimizde, ihtiyaç sahiplerine günlük sıcak yemek dağıtımında yardımcı olacak, haftada en az bir gün destek verebilecek gönüllüler arıyoruz.',
        amenities: { transport: false, food: false, accommodation: false },
        skills: ['Yemek Yapma', 'İletişim'],
        requirements: ['Hijyen Belgesi']
    },
    {
        id: '11',
        title: 'Etkinlik Fotoğrafçısı',
        organization: 'LÖSEV',
        ngoId: '3',
        location: { city: 'İstanbul', district: 'Kadıköy', type: 'Saha' },
        commitment: 'Tek Günlük',
        volunteerCount: { needed: 1, applications: 12 },
        dates: { applicationStart: '2024-09-10', applicationEnd: '2024-09-25', eventStart: '2024-10-12', eventEnd: '2024-10-12' },
        hours: { start: '13:00', end: '18:00', total: 5 },
        socialArea: 'Sağlık',
        points: 400,
        ngoTransparencyScore: 90,
        taskType: 'Tek Gün',
        providesCertificate: false,
        earnedBadges: [],
        hasPreTraining: false,
        description: 'Lösemili çocuklar yararına düzenleyeceğimiz moral etkinliğinde, en güzel anları ölümsüzleştirecek profesyonel veya amatör fotoğrafçı gönüllü arıyoruz.',
        amenities: { transport: false, food: true, accommodation: false },
        skills: ['Fotoğrafçılık']
    },
    {
        id: '12',
        title: 'Tanıtım Videosu Kurgu',
        organization: 'HAYTAP',
        ngoId: '4',
        location: { city: 'Online', district: 'Online', type: 'Online' },
        commitment: 'Dönemsel',
        volunteerCount: { needed: 2, applications: 15 },
        dates: { applicationStart: '2024-08-15', applicationEnd: '2024-09-15', eventStart: '2024-09-20', eventEnd: '2024-10-20' },
        hours: { start: '10:00', end: '18:00', total: 80 },
        socialArea: 'Hayvan Hakları',
        points: 2200,
        ngoTransparencyScore: 88,
        taskType: 'Dönemsel',
        providesCertificate: true,
        earnedBadges: ['Medya Destekçisi'],
        hasPreTraining: false,
        description: 'Barınaklarımızdaki dostlarımızın hikayelerini anlatan, sahiplendirmeyi teşvik edecek kısa ve etkileyici tanıtım videoları kurgulayacak gönüllüler arıyoruz.',
        amenities: { transport: false, food: false, accommodation: false },
        skills: ['Video Kurgu'],
        programs: ['Adobe Premiere']
    },
    {
        id: '13',
        title: 'Kaynak Geliştirme Uzmanı',
        organization: 'TEMA Vakfı',
        ngoId: '1',
        location: { city: 'Online', district: 'Online', type: 'Online' },
        commitment: 'Sürekli',
        volunteerCount: { needed: 1, applications: 10 },
        dates: { applicationStart: '2024-09-01', applicationEnd: '2024-09-30', eventStart: '2024-10-01', eventEnd: '2025-10-01' },
        hours: { start: '10:00', end: '18:00', total: 250 },
        socialArea: 'Çevre',
        points: 4000,
        ngoTransparencyScore: 92,
        taskType: 'Sürekli',
        providesCertificate: true,
        earnedBadges: ['Strateji Uzmanı'],
        hasPreTraining: false,
        description: 'TEMA Vakfı\'nın projeleri için ulusal ve uluslararası fonları araştıracak, proje başvuruları hazırlayacak ve kurumsal işbirlikleri geliştirecek deneyimli bir kaynak geliştirme uzmanı arıyoruz.',
        amenities: { transport: false, food: false, accommodation: false },
        skills: ['Kaynak Geliştirme', 'Proje Yönetimi']
    },
    {
        id: '14',
        title: 'Yaşlılara Kitap Okuma Etkinliği',
        organization: 'Ahbap Derneği',
        ngoId: '2',
        location: { city: 'Bursa', district: 'Nilüfer', type: 'Saha' },
        commitment: 'Sürekli',
        volunteerCount: { needed: 10, applications: 55 },
        dates: { applicationStart: '2024-08-20', applicationEnd: '2024-09-20', eventStart: '2024-10-01', eventEnd: '2025-10-01' },
        hours: { start: '14:00', end: '16:00', total: 104 },
        socialArea: 'Yaşlılar',
        points: 900,
        ngoTransparencyScore: 95,
        taskType: 'Sürekli',
        providesCertificate: false,
        earnedBadges: [],
        hasPreTraining: true,
        description: 'Huzurevinde kalan değerli büyüklerimize haftada bir gün kitap okuyacak, onlarla sohbet edecek ve keyifli vakit geçirecek gönüllüler arıyoruz.',
        amenities: { transport: false, food: false, accommodation: false },
        skills: ['İletişim']
    },
    {
        id: '15',
        title: 'Engelli Bireyler için Spor Asistanı',
        organization: 'Türkiye Omurilik Felçlileri Derneği',
        ngoId: '1',
        location: { city: 'Antalya', district: 'Muratpaşa', type: 'Saha' },
        commitment: 'Dönemsel',
        volunteerCount: { needed: 5, applications: 25 },
        dates: { applicationStart: '2024-09-01', applicationEnd: '2024-09-30', eventStart: '2024-10-10', eventEnd: '2025-01-10' },
        hours: { start: '18:00', end: '20:00', total: 72 },
        socialArea: 'Engelliler',
        points: 1500,
        ngoTransparencyScore: 89,
        taskType: 'Dönemsel',
        providesCertificate: true,
        earnedBadges: ['Spor Destekçisi'],
        hasPreTraining: true,
        description: 'Tekerlekli sandalye basketbol takımımızın antrenmanlarında sporculara yardımcı olacak, malzeme taşıma ve saha düzenlemesi gibi konularda destek olacak gönüllüler arıyoruz.',
        amenities: { transport: false, food: false, accommodation: false },
        requirements: ['İlk Yardım Sertifikası']
    },
    {
        id: '16',
        title: 'Mülteci Çocuklara Türkçe Dersleri',
        organization: 'İnsan Hakları Derneği',
        ngoId: '6',
        location: { city: 'Gaziantep', district: 'Şahinbey', type: 'Saha' },
        commitment: 'Sürekli',
        volunteerCount: { needed: 8, applications: 40 },
        dates: { applicationStart: '2024-08-15', applicationEnd: '2024-09-15', eventStart: '2024-09-20', eventEnd: '2025-06-20' },
        hours: { start: '16:00', end: '18:00', total: 144 },
        socialArea: 'Mülteciler',
        points: 2500,
        ngoTransparencyScore: 85,
        taskType: 'Sürekli',
        providesCertificate: true,
        earnedBadges: ['Eğitim Gönüllüsü'],
        hasPreTraining: true,
        description: 'Okul sonrası etüt merkezimizde, mülteci çocukların Türkçe öğrenmelerine ve derslerine yardımcı olacak gönüllü öğretmenler arıyoruz.',
        amenities: { transport: false, food: false, accommodation: false },
        requirements: ['Pedagojik Formasyon'],
        languages: ['Türkçe', 'Arapça']
    },
    {
        id: '17',
        title: 'Kadın Kooperatifi E-Ticaret Desteği',
        organization: 'Kadın Emeğini Değerlendirme Vakfı',
        ngoId: '7',
        location: { city: 'Online', district: 'Online', type: 'Online' },
        commitment: 'Sürekli',
        volunteerCount: { needed: 3, applications: 22 },
        dates: { applicationStart: '2024-08-01', applicationEnd: '2024-08-31', eventStart: '2024-09-01', eventEnd: '2025-09-01' },
        hours: { start: '10:00', end: '18:00', total: 100 },
        socialArea: 'Kadın Hakları',
        points: 2800,
        ngoTransparencyScore: 91,
        taskType: 'Sürekli',
        providesCertificate: true,
        earnedBadges: ['Girişimci Destekçisi'],
        hasPreTraining: false,
        description: 'Kadın kooperatiflerinin ürettiği el emeği ürünlerin online pazar yerlerinde (Hepsiburada, Trendyol) satılması, ürün fotoğraflarının çekilmesi ve sosyal medya pazarlaması konusunda destek olacak gönüllüler arıyoruz.',
        amenities: { transport: false, food: false, accommodation: false },
        skills: ['Sosyal Medya Yönetimi', 'Fotoğrafçılık']
    },
    {
        id: '18',
        title: 'Tarihi Eser Restorasyon Yardımcısı',
        organization: 'Kültür Sanat Vakfı',
        ngoId: '1',
        location: { city: 'Mardin', district: 'Artuklu', type: 'Saha' },
        commitment: 'Dönemsel',
        volunteerCount: { needed: 6, applications: 35 },
        dates: { applicationStart: '2024-09-01', applicationEnd: '2024-09-30', eventStart: '2024-10-15', eventEnd: '2024-11-15' },
        hours: { start: '09:00', end: '17:00', total: 160 },
        socialArea: 'Kültür & Sanat',
        points: 1800,
        ngoTransparencyScore: 89,
        taskType: 'Dönemsel',
        providesCertificate: true,
        earnedBadges: ['Kültür Mirası Koruyucusu'],
        hasPreTraining: true,
        description: 'Mardin\'deki tarihi bir taş konağın restorasyon çalışmalarında, uzman ekibimize temizlik, basit onarım ve malzeme taşıma gibi konularda yardımcı olacak el becerisi yüksek gönüllüler arıyoruz.',
        amenities: { transport: true, food: true, accommodation: true },
        skills: ['El Becerileri', 'Tamirat']
    },
    {
        id: '19',
        title: 'Afet Çadırı Kurulum Ekibi (Acil)',
        organization: 'Ahbap Derneği',
        ngoId: '2',
        location: { city: 'Afet Bölgesi', district: 'Belirlenecek', type: 'Saha' },
        commitment: 'Tek Günlük',
        volunteerCount: { needed: 100, applications: 500 },
        dates: { applicationStart: '2024-08-01', applicationEnd: '2024-12-31', eventStart: '2024-08-01', eventEnd: '2024-12-31' },
        hours: { start: '08:00', end: '20:00', total: 12 },
        socialArea: 'Afet',
        points: 1000,
        ngoTransparencyScore: 95,
        taskType: 'Tek Gün',
        providesCertificate: false,
        earnedBadges: ['Afet Kahramanı'],
        hasPreTraining: true,
        description: 'Olası bir afet durumunda, belirlenen toplanma alanlarına hızla intikal ederek çadır ve geçici barınma alanlarının kurulumunda görev alacak, fiziksel olarak güçlü ve ekip çalışmasına yatkın acil durum gönüllüleri arıyoruz.',
        amenities: { transport: true, food: true, accommodation: true },
        skills: ['El Becerileri', 'Organizasyon']
    },
    {
        id: '20',
        title: 'Uluslararası Rapor Çevirisi (Almanca)',
        organization: 'İnsan Hakları Derneği',
        ngoId: '6',
        location: { city: 'Online', district: 'Online', type: 'Online' },
        commitment: 'Dönemsel',
        volunteerCount: { needed: 2, applications: 10 },
        dates: { applicationStart: '2024-09-15', applicationEnd: '2024-10-15', eventStart: '2024-10-20', eventEnd: '2024-11-20' },
        hours: { start: '10:00', end: '18:00', total: 40 },
        socialArea: 'İnsan Hakları',
        points: 1500,
        ngoTransparencyScore: 85,
        taskType: 'Dönemsel',
        providesCertificate: true,
        earnedBadges: [],
        hasPreTraining: false,
        description: 'Derneğimizin hazırladığı yıllık insan hakları ihlalleri raporunun Almanca\'ya çevrilmesi ve Alman medyasında yer alması için redaksiyon sürecinde destek olacak ana dili seviyesinde Almanca bilen gönüllüler arıyoruz.',
        amenities: { transport: false, food: false, accommodation: false },
        languages: ['Almanca', 'Türkçe']
    },
    {
        id: '21',
        title: 'Mobil Uygulama Test Gönüllüsü',
        organization: 'Ahbap Derneği',
        ngoId: '2',
        location: { city: 'Online', district: 'Online', type: 'Online' },
        commitment: 'Dönemsel',
        volunteerCount: { needed: 50, applications: 150 },
        dates: { applicationStart: '2024-08-10', applicationEnd: '2024-08-25', eventStart: '2024-09-01', eventEnd: '2024-09-15' },
        hours: { start: '10:00', end: '18:00', total: 20 },
        socialArea: 'Teknoloji',
        points: 500,
        ngoTransparencyScore: 95,
        taskType: 'Dönemsel',
        providesCertificate: false,
        earnedBadges: ['Teknoloji Destekçisi'],
        hasPreTraining: false,
        description: 'Geliştirmekte olduğumuz yeni afet koordinasyon mobil uygulamamızın beta sürümünü test edecek, olası hataları raporlayacak ve kullanıcı deneyimi hakkında geri bildirimlerde bulunacak teknoloji meraklısı gönüllüler arıyoruz.',
        amenities: { transport: false, food: false, accommodation: false },
        skills: ['İletişim'],
        programs: ['Google Workspace']
    },
    {
        id: '22',
        title: 'Üniversite Sosyal Etki Temsilcisi',
        organization: 'Hangel Derneği',
        ngoId: '8',
        location: { city: 'Online', district: 'Türkiye Geneli', type: 'Online' },
        commitment: 'Sürekli',
        volunteerCount: { needed: 25, applications: 0 },
        dates: { applicationStart: '2024-08-01', applicationEnd: '2025-08-01', eventStart: '2024-09-01', eventEnd: '2025-09-01' },
        hours: { start: '10:00', end: '18:00', total: 0 },
        socialArea: 'Sosyal Girişimcilik',
        points: 5000,
        ngoTransparencyScore: 98,
        taskType: 'Sürekli',
        providesCertificate: true,
        earnedBadges: ['Liderlik Rozeti', 'Topluluk Yöneticisi'],
        hasPreTraining: true,
        description: 'Kampüsünüzde sosyal etki rüzgarı estirin! Hangel\'in üniversite temsilcisi olarak etkinlikler düzenleyin, sosyal sorumluluk projeleri geliştirin ve kendi topluluğunuzun değişim lideri olun. Bu rol, size liderlik, proje yönetimi ve ağ kurma becerileri kazandıracak.',
        amenities: { transport: false, food: false, accommodation: false },
        skills: ['Proje Yönetimi', 'Organizasyon', 'İletişim', 'Sunum Becerileri'],
        education: 'Üniversite'
    }
];

export const events: Event[] = [];
export const studentClubs: StudentClub[] = [];
export const schoolRepresentatives: SchoolRepresentative[] = [];
export const applications: Application[] = [];
export const donationTransactions: DonationTransaction[] = [];
export const badges: Badge[] = [];
export const certificates: Certificate[] = [];

export const helpTopics: HelpTopic[] = [
    {
        icon: 'User',
        title: "Bireysel Kullanıcılar",
        slug: "bireysel-kullanicilar",
        description: "Profil, bağış, gönüllülük ve puan sistemi hakkında her şey.",
        subtopics: [
            {
                title: "hangel Etki Puanı nasıl hesaplanır?",
                content: "hangel Etki Puanı, platformdaki olumlu katkılarınızı ölçen bir sistemdir. Puanları şu şekillerde kazanırsınız: <ul><li>Anlaşmalı markalardan yaptığın her alışverişle.</li><li>Gönüllülük faaliyetlerini tamamlayarak.</li><li>Platforma yeni arkadaşlarını davet ederek.</li><li>Rozetler kazanarak ve seviye atlayarak.</li></ul>"
            },
            {
                title: "Bir bağışın STK'ya ulaşma süreci nedir?",
                content: "Alışverişiniz sonrası marka tarafından onaylanan bağış tutarı, yasal kesintiler ve Hangel hizmet bedeli düşüldükten sonra takip eden ayın sonunda seçtiğiniz STK'nın hesabına aktarılır. Tüm süreci 'Bağışlarım' sayfasından şeffaf bir şekilde takip edebilirsiniz."
            },
            {
                title: "Gönüllülük başvurum neden reddedildi?",
                content: "Başvurunuzun reddedilme nedenleri arasında; ilanın kontenjanının dolması, aranan yetkinliklere tam olarak uymamanız veya STK'nın kendi iç değerlendirme kriterleri bulunabilir. Reddedilme nedeni genellikle STK tarafından size bir mesaj ile bildirilir."
            },
            {
                title: "QR Kod ile nasıl ödeme yaparım?",
                content: "Cüzdanım sayfasındaki 'QR Tara' özelliğini kullanarak üye işyerlerindeki QR kodları okutabilirsiniz. Ayrıca 'QR Kodum' bölümündeki kişisel kodunuzu göstererek de ödeme alabilirsiniz."
            }
        ]
    },
    {
        icon: 'Building',
        title: "STK Yöneticileri",
        slug: "stk-yoneticileri",
        description: "Yönetim paneli, gönüllü yönetimi ve kaynak geliştirme araçları.",
        subtopics: [
            {
                title: "Şeffaflık Puanımı nasıl artırabilirim?",
                content: "Şeffaflık puanınızı artırmak için yönetim panelinizdeki 'Şeffaflık Endeksi' sayfasındaki tüm kriterleri (faaliyet raporu, tüzük, denetim raporu, finansal tablolar vb.) eksiksiz olarak yüklemeniz gerekmektedir. Yüklediğiniz her doğrulanmış belge, puanınızı olumlu etkileyecektir."
            },
            {
                title: "Gönüllülük ilanı nasıl oluşturulur?",
                content: "Yönetim panelinizdeki 'Gönüllülük Yönetimi' sekmesine gidin ve 'Yeni İlan Oluştur' butonuna tıklayın. Açılan formda ilanın başlığını, açıklamasını, aranan yetkinlikleri, konum, zamanlama ve diğer detayları eksiksiz doldurarak ilanınızı yayına alabilirsiniz."
            },
            {
                title: "Hakediş ödemeleri ne zaman yapılır?",
                content: "Marka alışverişlerinden doğan ve kesinleşen bağışlar, ilgili ayı takip eden ayın son iş gününde kayıtlı banka hesabınıza aktarılır. Tüm detayları 'Bağış Takibi' sayfanızdan inceleyebilirsiniz."
            },
            {
                title: "Web sitemi nasıl yönetirim?",
                content: "Yönetim panelindeki 'Web Sitesi Yönetimi' bölümünden, sitenizde görünecek modülleri (Hakkımızda, İstatistikler, Haberler vb.) aktif/pasif hale getirebilir, kurumsal renginizi seçebilir ve banner görsellerinizi yönetebilirsiniz."
            }
        ]
    },
    {
        icon: 'Store',
        title: "Marka Yöneticileri",
        slug: "marka-yoneticileri",
        description: "İşbirliği süreci, komisyon oranları ve raporlama.",
        subtopics: [
            {
                title: "Bağış oranlarını nasıl belirleyebilirim?",
                content: "Marka başvurusu sırasında veya marka yönetim panelinizden farklı ürün kategorileri için farklı bağış oranları tanımlayabilirsiniz. Belirlediğiniz oranlar, kullanıcı alışveriş yaptığında otomatik olarak uygulanır."
            },
            {
                title: "Hangi verileri takip edebilirim?",
                content: "Marka panelinizden, Hangel üzerinden gelen trafik sayısını, gerçekleşen alışveriş adedini, oluşturulan toplam bağış tutarını ve desteklenen STK'ların dağılımını takip edebilirsiniz. Bu veriler pazarlama stratejinizi optimize etmenize yardımcı olur."
            },
            {
                title: "Mutabakat süreci nasıl işliyor?",
                content: "Her ayın sonunda, Hangel sistemi üzerinden gerçekleşen ve iade edilmeyen tüm başarılı işlemler raporlanır. Raporlanan tutar üzerinden anlaşılan bağış oranı hesaplanır ve faturalandırma işlemi yapılır. Ödemeniz sonrası bağışlar STK'lara aktarılır."
            }
        ]
    },
    {
        icon: 'School',
        title: "Kulüp Yöneticileri",
        slug: "kulup-yoneticileri",
        description: "Kulüp yönetimi, etkinlik oluşturma ve üye takibi.",
        subtopics: [
            {
                title: "Kulübüme nasıl üye alabilirim?",
                content: "Kulüp profil sayfanızda bulunan 'Kulübe Katıl' butonu aracılığıyla öğrenciler başvuruda bulunabilir. Gelen başvuruları yönetim panelinizden onaylayabilir veya reddedebilirsiniz."
            },
            {
                title: "Etkinlik nasıl oluşturulur?",
                content: "Yönetim panelinizdeki 'Etkinlikler' sekmesinden yeni bir etkinlik oluşturabilir, tarih, konum ve içerik gibi detayları girerek platformda yayınlayabilirsiniz."
            },
            {
                title: "Etki Puanı kulüpler için ne anlama geliyor?",
                content: "Kulübünüzün düzenlediği etkinliklere katılım, tamamlanan sosyal sorumluluk projeleri ve platforma kazandırdığınız yeni üyeler kulübünüze Etki Puanı kazandırır. Bu puanlar, 'Öğrenci Kulüpleri Liderlik Tablosu'nda sıralamanızı belirler."
            }
        ]
    }
];

export const ngoHelpTopics = helpTopics;

export const ngoFaqArticles = [
    { title: 'Şeffaflık Puanım neden düşük?', content: '...' },
    { title: 'Gönüllü başvurularını nasıl filtreleyebilirim?', content: '...' },
    { title: 'Aylık hakedişim neden beklediğimden az geldi?', content: '...' },
    { title: 'Web sitemde hangi bölümleri özelleştirebilirim?', content: '...' },
];

export const pastVolunteering = [];
export const managedItems: ManagedItem[] = [
    { name: 'Ahbap Derneği', type: 'STK', icon: 'heart', href: '/ngo-admin/dashboard', status: 'approved', logoUrl: 'https://logo.clearbit.com/ahbap.org' }
];

export const qrPaymentCardData = [
    { id: 'bireysel', type: 'Bireysel', bgColor: 'bg-primary', number: '5549601000001234', owner: 'İsmail Hilmi ADIGÜZEL', expiry: '12/28', balance: '1.250,75 ₺', ngoId: '1', cvv: '123' }
];
