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

export const allEntityLists: Brand[] = [
    { id: 'b1', name: 'Trip.com', category: 'Tatil & Seyahat', type: 'brand', logoUrl: 'https://logo.clearbit.com/trip.com', donationRate: 2 },
    { id: 'b2', name: 'Pazarama', category: 'Hobi & Hizmet', type: 'brand', logoUrl: 'https://logo.clearbit.com/pazarama.com', donationRate: 2 },
    { id: 'b3', name: 'Karaca', category: 'Ev & Yaşam', type: 'brand', logoUrl: 'https://logo.clearbit.com/karaca.com', donationRate: 3 },
    { id: 'b4', name: 'Yalıspor', category: 'Ayakkabı', type: 'brand', logoUrl: 'https://logo.clearbit.com/yalispor.com.tr', donationRate: 2 },
    { id: 'b5', name: 'Mango', category: 'Giyim', type: 'brand', logoUrl: 'https://logo.clearbit.com/mango.com', donationRate: 2 },
    { id: 'b6', name: 'Getir', category: 'Süpermarket', type: 'brand', logoUrl: 'https://logo.clearbit.com/getir.com', donationRate: 2 },
    { id: 'b7', name: 'Tatilbudur', category: 'Tatil & Seyahat', type: 'brand', logoUrl: 'https://logo.clearbit.com/tatilbudur.com', donationRate: 3 },
    { id: 'b8', name: 'CarrefourSA', category: 'Süpermarket', type: 'brand', logoUrl: 'https://logo.clearbit.com/carrefoursa.com', donationRate: 2 },
    { id: 'b9', name: 'Boyner', category: 'Giyim', type: 'brand', logoUrl: 'https://logo.clearbit.com/boyner.com.tr', donationRate: 2 },
    { id: 'b10', name: 'Ucuzabilet', category: 'Tatil & Seyahat', type: 'brand', logoUrl: 'https://logo.clearbit.com/ucuzabilet.com', donationRate: 2 },
    { id: 'b11', name: 'CamperTR', category: 'Ayakkabı', type: 'brand', logoUrl: 'https://logo.clearbit.com/camper.com', donationRate: 4.67 },
    { id: 'b12', name: 'H&M', category: 'Giyim', type: 'brand', logoUrl: 'https://logo.clearbit.com/hm.com', donationRate: 6 },
    { id: 'b13', name: 'Bilet.com', category: 'Hobi & Hizmet', type: 'brand', logoUrl: 'https://logo.clearbit.com/bilet.com', donationRate: 2 },
    { id: 'b14', name: 'Tchibo', category: 'Gıda & İçecek', type: 'brand', logoUrl: 'https://logo.clearbit.com/tchibo.com.tr', donationRate: 2 },
    { id: 'b15', name: 'Homend', category: 'Elektronik', type: 'brand', logoUrl: 'https://logo.clearbit.com/homend.com.tr', donationRate: 2 },
    { id: 'b16', name: 'Skechers', category: 'Ayakkabı', type: 'brand', logoUrl: 'https://logo.clearbit.com/skechers.com.tr', donationRate: 2 },
    { id: 'b17', name: 'MediaMarkt', category: 'Elektronik', type: 'brand', logoUrl: 'https://logo.clearbit.com/mediamarkt.com.tr', donationRate: 2 },
    { id: 'b18', name: 'Mudo', category: 'Giyim', type: 'brand', logoUrl: 'https://logo.clearbit.com/mudo.com.tr', donationRate: 1.8 },
    { id: 'b19', name: 'Bella Maison', category: 'Ev & Yaşam', type: 'brand', logoUrl: 'https://logo.clearbit.com/bellamaison.com', donationRate: 2 },
    { id: 'b20', name: 'Ayakkabı Dünyası', category: 'Ayakkabı', type: 'brand', logoUrl: 'https://logo.clearbit.com/ayakkabidunyasi.com.tr', donationRate: 4 },
    { id: 'b21', name: 'Decathlon', category: 'Hobi & Hizmet', type: 'brand', logoUrl: 'https://logo.clearbit.com/decathlon.com.tr', donationRate: 2 },
    { id: 'b22', name: 'Carter’s', category: 'Anne & Bebek', type: 'brand', logoUrl: 'https://logo.clearbit.com/carters.com', donationRate: 2 },
    { id: 'b23', name: 'MinyCenter', category: 'Anne & Bebek', type: 'brand', logoUrl: 'https://logo.clearbit.com/minycenter.com.tr', donationRate: 2 },
    { id: 'b24', name: 'Huawei', category: 'Elektronik', type: 'brand', logoUrl: 'https://logo.clearbit.com/huawei.com', donationRate: 2 },
    { id: 'b25', name: 'Vitaminler', category: 'Kozmetik & Bakım', type: 'brand', logoUrl: 'https://logo.clearbit.com/vitaminler.com', donationRate: 5 },
    { id: 'b26', name: 'Amazon TR', category: 'Elektronik', type: 'brand', logoUrl: 'https://logo.clearbit.com/amazon.com.tr', donationRate: 13 },
    { id: 'b27', name: 'Emsan', category: 'Ev & Yaşam', type: 'brand', logoUrl: 'https://logo.clearbit.com/emsan.com.tr', donationRate: 2 },
    { id: 'b28', name: 'Mavi', category: 'Giyim', type: 'brand', logoUrl: 'https://logo.clearbit.com/mavi.com', donationRate: 2 },
    { id: 'b29', name: 'A101', category: 'Süpermarket', type: 'brand', logoUrl: 'https://logo.clearbit.com/a101.com.tr', donationRate: 2 },
    { id: 'b30', name: 'Pierre Cardin', category: 'Giyim', type: 'brand', logoUrl: 'https://logo.clearbit.com/pierrecardin.com.tr', donationRate: 11 },
    { id: 'b31', name: 'Cacharel', category: 'Giyim', type: 'brand', logoUrl: 'https://logo.clearbit.com/cacharel.com.tr', donationRate: 11 },
    { id: 'b32', name: 'US Polo Assn.', category: 'Giyim', type: 'brand', logoUrl: 'https://logo.clearbit.com/uspoloassn.com.tr', donationRate: 11 },
    { id: 'b33', name: 'n11', category: 'Hobi & Hizmet', type: 'brand', logoUrl: 'https://logo.clearbit.com/n11.com', donationRate: 2 },
    { id: 'b34', name: 'Samsung', category: 'Elektronik', type: 'brand', logoUrl: 'https://logo.clearbit.com/samsung.com', donationRate: 1.66 },
    { id: 'b35', name: 'Penti', category: 'Giyim', type: 'brand', logoUrl: 'https://logo.clearbit.com/penti.com', donationRate: 2 },
    { id: 'b36', name: 'Teknosa', category: 'Elektronik', type: 'brand', logoUrl: 'https://logo.clearbit.com/teknosa.com', donationRate: 2 },
    { id: 'b37', name: 'Altınbaş', category: 'Aksesuar & Takı', type: 'brand', logoUrl: 'https://logo.clearbit.com/altinbas.com', donationRate: 2 },
    { id: 'b38', name: 'IKEA', category: 'Ev & Yaşam', type: 'brand', logoUrl: 'https://logo.clearbit.com/ikea.com.tr', donationRate: 2 },
    { id: 'b39', name: 'Etstur', category: 'Tatil & Seyahat', type: 'brand', logoUrl: 'https://logo.clearbit.com/etstur.com', donationRate: 2 },
    { id: 'b40', name: 'Divarese', category: 'Ayakkabı', type: 'brand', logoUrl: 'https://logo.clearbit.com/divarese.com.tr', donationRate: 5 },
    { id: 'b41', name: 'Flaw Wear', category: 'Giyim', type: 'brand', logoUrl: 'https://logo.clearbit.com/flawwear.com', donationRate: 3 },
    { id: 'b42', name: 'Fresh Scarfs', category: 'Giyim', type: 'brand', logoUrl: 'https://logo.clearbit.com/freshscarfs.com', donationRate: 5 },
    { id: 'b43', name: 'TARTI', category: 'Hobi & Hizmet', type: 'brand', logoUrl: 'https://logo.clearbit.com/tarti.com', donationRate: 10 },
    { id: 'b44', name: 'Reeder', category: 'Elektronik', type: 'brand', logoUrl: 'https://logo.clearbit.com/reeder.com.tr', donationRate: 1.5 },
    { id: 'b45', name: 'Enjoy eSIM', category: 'Hobi & Hizmet', type: 'brand', logoUrl: 'https://logo.clearbit.com/enjoyesim.com', donationRate: 9 },
    { id: 'b46', name: 'Madame Coco', category: 'Ev & Yaşam', type: 'brand', logoUrl: 'https://logo.clearbit.com/madamecoco.com', donationRate: 4 },
    { id: 'b47', name: 'LG', category: 'Elektronik', type: 'brand', logoUrl: 'https://logo.clearbit.com/lg.com', donationRate: 3 },
    { id: 'b48', name: 'Arkopharma', category: 'Kozmetik & Bakım', type: 'brand', logoUrl: 'https://logo.clearbit.com/arkopharma.com', donationRate: 15 },
    { id: 'b49', name: 'Petzzshop', category: 'Hobi & Hizmet', type: 'brand', logoUrl: 'https://logo.clearbit.com/petzzshop.com', donationRate: 3 },
    { id: 'b50', name: 'Manuka', category: 'Giyim', type: 'brand', logoUrl: 'https://logo.clearbit.com/manuka.com.tr', donationRate: 5 },
    { id: 'b51', name: 'Kayra', category: 'Giyim', type: 'brand', logoUrl: 'https://logo.clearbit.com/kayra.com', donationRate: 5 },
    { id: 'b52', name: 'Sosyopix', category: 'Hobi & Hizmet', type: 'brand', logoUrl: 'https://logo.clearbit.com/sosyopix.com', donationRate: 10 },
    { id: 'b53', name: 'Airalo', category: 'Tatil & Seyahat', type: 'brand', logoUrl: 'https://logo.clearbit.com/airalo.com', donationRate: 8 },
    { id: 'b54', name: 'Xiaomi', category: 'Elektronik', type: 'brand', logoUrl: 'https://logo.clearbit.com/mi.com', donationRate: 2 },
    { id: 'b55', name: 'FLO', category: 'Ayakkabı', type: 'brand', logoUrl: 'https://logo.clearbit.com/flo.com.tr', donationRate: 7.5 },
    { id: 'b56', name: 'Forever21', category: 'Giyim', type: 'brand', logoUrl: 'https://logo.clearbit.com/forever21.com', donationRate: 2 },
    { id: 'b57', name: 'Bialetti', category: 'Ev & Yaşam', type: 'brand', logoUrl: 'https://logo.clearbit.com/bialetti.com', donationRate: 7 },
    { id: 'b58', name: 'Tazecicek', category: 'Hobi & Hizmet', type: 'brand', logoUrl: 'https://logo.clearbit.com/tazecicek.com', donationRate: 4.5 },
    { id: 'b59', name: 'Mizalle', category: 'Giyim', type: 'brand', logoUrl: 'https://logo.clearbit.com/mizalle.com', donationRate: 5 },
    { id: 'b60', name: 'Teknevia', category: 'Tatil & Seyahat', type: 'brand', logoUrl: 'https://logo.clearbit.com/teknevia.com', donationRate: 2 },
    { id: 'b61', name: 'Lona Cosmetics', category: 'Kozmetik & Bakım', type: 'brand', logoUrl: 'https://logo.clearbit.com/lonacosmetics.com', donationRate: 25 },
    { id: 'b62', name: 'EvdeEczane', category: 'Kozmetik & Bakım', type: 'brand', logoUrl: 'https://logo.clearbit.com/evdeeczane.com', donationRate: 3 },
    { id: 'b63', name: 'Cosmed', category: 'Kozmetik & Bakım', type: 'brand', logoUrl: 'https://logo.clearbit.com/cosmed.com.tr', donationRate: 5 },
    { id: 'b64', name: 'Tonguç Akademi', category: 'Hobi & Hizmet', type: 'brand', logoUrl: 'https://logo.clearbit.com/tongucakademi.com', donationRate: 5.5 },
    { id: 'b65', name: 'Tonguç Mağaza', category: 'Hobi & Hizmet', type: 'brand', logoUrl: 'https://logo.clearbit.com/tongucmagaza.com', donationRate: 5.5 },
    { id: 'b66', name: 'Kütahya Porselen', category: 'Ev & Yaşam', type: 'brand', logoUrl: 'https://logo.clearbit.com/kutahyaporselen.com', donationRate: 4 },
    { id: 'b67', name: 'General Mobile', category: 'Elektronik', type: 'brand', logoUrl: 'https://logo.clearbit.com/generalmobile.com', donationRate: 2 },
    { id: 'b68', name: 'Farfetch', category: 'Giyim', type: 'brand', logoUrl: 'https://logo.clearbit.com/farfetch.com', donationRate: 7 },
    { id: 'b69', name: 'Konyalı Saat', category: 'Aksesuar & Takı', type: 'brand', logoUrl: 'https://logo.clearbit.com/konyalisaat.com.tr', donationRate: 2 },
    { id: 'b70', name: 'Korkmaz', category: 'Ev & Yaşam', type: 'brand', logoUrl: 'https://logo.clearbit.com/korkmazstore.com.tr', donationRate: 3 },
    { id: 'b71', name: 'E-bebek', category: 'Anne & Bebek', type: 'brand', logoUrl: 'https://logo.clearbit.com/e-bebek.com', donationRate: 2.5 },
    { id: 'b72', name: 'Slazenger', category: 'Giyim', type: 'brand', logoUrl: 'https://logo.clearbit.com/slazenger.com.tr', donationRate: 3 },
    { id: 'b73', name: 'Tudors', category: 'Giyim', type: 'brand', logoUrl: 'https://logo.clearbit.com/tudors.com', donationRate: 6 },
    { id: 'b74', name: 'Casper', category: 'Elektronik', type: 'brand', logoUrl: 'https://logo.clearbit.com/casper.com.tr', donationRate: 2 },
    { id: 'b75', name: 'Toyzz Shop', category: 'Hobi & Hizmet', type: 'brand', logoUrl: 'https://logo.clearbit.com/toyzzshop.com', donationRate: 7.2 },
    { id: 'b76', name: 'Taç', category: 'Ev & Yaşam', type: 'brand', logoUrl: 'https://logo.clearbit.com/tac.com.tr', donationRate: 4 },
    { id: 'b77', name: 'PUMA', category: 'Ayakkabı', type: 'brand', logoUrl: 'https://logo.clearbit.com/puma.com', donationRate: 6 },
    { id: 'b78', name: 'Marks & Spencer', category: 'Giyim', type: 'brand', logoUrl: 'https://logo.clearbit.com/marksandspencer.com.tr', donationRate: 2 },
    { id: 'b79', name: 'GAP', category: 'Giyim', type: 'brand', logoUrl: 'https://logo.clearbit.com/gap.com.tr', donationRate: 2 },
    { id: 'b80', name: 'Beymen', category: 'Giyim', type: 'brand', logoUrl: 'https://logo.clearbit.com/beymen.com', donationRate: 3 },
    { id: 'b81', name: 'Banggood', category: 'Elektronik', type: 'brand', logoUrl: 'https://logo.clearbit.com/banggood.com', donationRate: 5.5 },
    { id: 'b82', name: 'Koçtaş', category: 'Ev & Yaşam', type: 'brand', logoUrl: 'https://logo.clearbit.com/koctas.com.tr', donationRate: 2.2 },
    { id: 'b83', name: 'Colins', category: 'Giyim', type: 'brand', logoUrl: 'https://logo.clearbit.com/colins.com.tr', donationRate: 9 },
    { id: 'b84', name: 'D&R', category: 'Hobi & Hizmet', type: 'brand', logoUrl: 'https://logo.clearbit.com/dr.com.tr', donationRate: 2.5 },
    { id: 'b85', name: 'Koton', category: 'Giyim', type: 'brand', logoUrl: 'https://logo.clearbit.com/koton.com', donationRate: 4.5 },
    { id: 'b86', name: 'Linens', category: 'Ev & Yaşam', type: 'brand', logoUrl: 'https://logo.clearbit.com/linens.com.tr', donationRate: 5 },
    { id: 'b87', name: 'Saat & Saat', category: 'Aksesuar & Takı', type: 'brand', logoUrl: 'https://logo.clearbit.com/saatsaat.com.tr', donationRate: 1 },
    { id: 'b88', name: 'Sportive', category: 'Giyim', type: 'brand', logoUrl: 'https://logo.clearbit.com/sportive.com.tr', donationRate: 6.5 },
    { id: 'b89', name: 'Beko', category: 'Elektronik', type: 'brand', logoUrl: 'https://logo.clearbit.com/beko.com.tr', donationRate: 3 },
    { id: 'b90', name: 'Benetton', category: 'Giyim', type: 'brand', logoUrl: 'https://logo.clearbit.com/benetton.com.tr', donationRate: 6 },
    { id: 'b91', name: 'Yargıcı', category: 'Giyim', type: 'brand', logoUrl: 'https://logo.clearbit.com/yargici.com', donationRate: 5.6 },
    { id: 'b92', name: 'Gant', category: 'Giyim', type: 'brand', logoUrl: 'https://logo.clearbit.com/gant.com.tr', donationRate: 6 },
    { id: 'b93', name: 'Nautica', category: 'Giyim', type: 'brand', logoUrl: 'https://logo.clearbit.com/nautica.com.tr', donationRate: 7 },
    { id: 'b94', name: 'Lacoste', category: 'Giyim', type: 'brand', logoUrl: 'https://logo.clearbit.com/lacoste.com.tr', donationRate: 5 },
    { id: 'b95', name: 'Arçelik', category: 'Elektronik', type: 'brand', logoUrl: 'https://logo.clearbit.com/arcelik.com.tr', donationRate: 3 },
    { id: 'b96', name: 'Little Caesars', category: 'Gıda & İçecek', type: 'brand', logoUrl: 'https://logo.clearbit.com/littlecaesars.com.tr', donationRate: 6 },
];

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
    }
];

export const volunteeringOpportunities: Volunteering[] = [
    { id: '1', title: 'Afet Bölgesi Lojistik Destek', organization: 'Ahbap Derneği', ngoId: '2', location: { city: 'Hatay', district: 'Antakya', type: 'Saha' }, commitment: 'Dönemsel', volunteerCount: { needed: 50, applications: 120 }, dates: { applicationStart: '2024-07-01', applicationEnd: '2024-07-25', eventStart: '2024-08-01', eventEnd: '2024-08-08' }, hours: { start: '09:00', end: '18:00', total: 56 }, socialArea: 'Afet', points: 1500, ngoTransparencyScore: 95, taskType: 'Dönemsel', providesCertificate: true, earnedBadges: ['Afet Kahramanı'], hasPreTraining: true, description: 'Bölgedeki yardım kolilerinin tasnifi ve dağıtımında görev alacak gönüllüler arıyoruz.', amenities: { transport: true, food: true, accommodation: true } }
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
