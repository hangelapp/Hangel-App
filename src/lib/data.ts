'use client';

import { 
    Leaf, Heart, HeartHandshake, ShoppingBag, Store, Globe, Users, 
    Star, Award, Calendar, MapPin, Landmark, Briefcase, DollarSign
} from 'lucide-react';
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

export const timelinePosts: Post[] = [
    { id: '1', author: { name: 'TEMA Vakfı', avatarUrl: 'https://logo.clearbit.com/tema.org.tr' }, content: 'Bugün Balıkesir fidan dikme etkinliğimizde 200 yeni ağacı toprakla buluşturduk! 🌳 Gelecek nesillere daha yeşil bir dünya bırakmak için var gücümüzle çalışıyoruz. #Doğaİçin #TEMA', timestamp: '2 saat önce', likes: 1240, comments: 45, imageUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=2013&auto=format&fit=crop', imageHint: 'planting trees' },
    { id: '2', author: { name: 'Ahbap Derneği', avatarUrl: 'https://logo.clearbit.com/ahbap.org' }, content: 'Hatay ve Adıyaman bölgelerindeki ihtiyaç sahibi aileler için hazırladığımız 5000 adet gıda kolisini gönüllü ekibimizle birlikte dağıtmaya başladık. 🙏 Dayanışma yaşatır! #Ahbap #Dayanışma', timestamp: '5 saat önce', likes: 3500, comments: 120, imageUrl: 'https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?q=80&w=2070&auto=format&fit=crop', imageHint: 'food donation' },
    { id: '3', author: { name: 'Patagonia', avatarUrl: 'https://logo.clearbit.com/patagonia.com' }, content: 'Her alışverişin %10\'u okyanuslarımızı temizlemek ve deniz ekosistemini korumak için ayrılıyor. 🌊 Bilinçli tüketin, geleceği koruyun. #SustainableFashion #OceanGuardians', timestamp: '1 gün önce', likes: 850, comments: 12, imageUrl: 'https://images.unsplash.com/photo-1437622368342-7a3d73a34c8f?q=80&w=1920&auto=format&fit=crop', imageHint: 'sea turtle', sponsored: true },
    { id: '4', author: { name: 'LÖSEV', avatarUrl: 'https://logo.clearbit.com/losev.org.tr' }, content: 'Kanserle mücadele eden minik kahramanlarımızın eğitim hayatlarına destek olmak için yeni bir burs fonu açtık. Her tuğla bir umut! 💖 #LÖSEV #UmudunRengi', timestamp: '2 gün önce', likes: 2100, comments: 88, imageUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=2070&auto=format&fit=crop', imageHint: 'happy school children' }
];

export const allEntityLists: Brand[] = [
    // --- AYAKKABI ---
    { id: 'ay-1', name: 'Ayakkabı Dünyası', category: 'Ayakkabı', donationRate: 5, logoUrl: 'https://logo.clearbit.com/ayakkabidunyasi.com.tr', type: 'brand' },
    { id: 'ay-2', name: 'Decathlon', category: 'Ayakkabı', donationRate: 4, logoUrl: 'https://logo.clearbit.com/decathlon.com.tr', type: 'brand' },
    { id: 'ay-3', name: 'Sportstyle', category: 'Ayakkabı', donationRate: 6, logoUrl: 'https://logo.clearbit.com/sportstyle.com.tr', type: 'brand' },
    { id: 'ay-4', name: 'Sneakscloud', category: 'Ayakkabı', donationRate: 7, logoUrl: 'https://logo.clearbit.com/sneakscloud.com', type: 'brand' },
    { id: 'ay-5', name: 'Sportive', category: 'Ayakkabı', donationRate: 5, logoUrl: 'https://logo.clearbit.com/sportive.com.tr', type: 'brand' },
    { id: 'ay-6', name: 'FashFed', category: 'Ayakkabı', donationRate: 8, logoUrl: 'https://logo.clearbit.com/fashfed.com', type: 'brand' },
    { id: 'ay-7', name: 'Skechers', category: 'Ayakkabı', donationRate: 6, logoUrl: 'https://logo.clearbit.com/skechers.com.tr', type: 'brand' },
    { id: 'ay-8', name: 'MarkaStok', category: 'Ayakkabı', donationRate: 5, logoUrl: 'https://logo.clearbit.com/markastok.com', type: 'brand' },
    { id: 'ay-9', name: 'Playsports', category: 'Ayakkabı', donationRate: 6, logoUrl: 'https://logo.clearbit.com/playsports.com.tr', type: 'brand' },
    { id: 'ay-10', name: 'Columbia', category: 'Ayakkabı', donationRate: 8, logoUrl: 'https://logo.clearbit.com/columbia.com.tr', type: 'brand' },
    { id: 'ay-11', name: 'Converse', category: 'Ayakkabı', donationRate: 10, logoUrl: 'https://logo.clearbit.com/converse.com', type: 'brand' },
    { id: 'ay-12', name: 'Hotiç', category: 'Ayakkabı', donationRate: 5, logoUrl: 'https://logo.clearbit.com/hotic.com.tr', type: 'brand' },
    { id: 'ay-13', name: 'SuperStep', category: 'Ayakkabı', donationRate: 5, logoUrl: 'https://logo.clearbit.com/superstep.com.tr', type: 'brand' },
    { id: 'ay-14', name: 'PUMA', category: 'Ayakkabı', donationRate: 6, logoUrl: 'https://logo.clearbit.com/puma.com', type: 'brand' },
    { id: 'ay-15', name: 'Sporthink', category: 'Ayakkabı', donationRate: 7, logoUrl: 'https://logo.clearbit.com/sporthink.com.tr', type: 'brand' },
    { id: 'ay-16', name: 'FLO', category: 'Ayakkabı', donationRate: 3, logoUrl: 'https://logo.clearbit.com/flo.com.tr', type: 'brand' },
    { id: 'ay-17', name: 'Intersport', category: 'Ayakkabı', donationRate: 5, logoUrl: 'https://logo.clearbit.com/intersport.com.tr', type: 'brand' },
    { id: 'ay-18', name: 'The Moose Bay', category: 'Ayakkabı', donationRate: 8, logoUrl: 'https://logo.clearbit.com/themoosebay.com', type: 'brand' },
    { id: 'ay-19', name: 'Sporpark', category: 'Ayakkabı', donationRate: 6, logoUrl: 'https://logo.clearbit.com/sporpark.com.tr', type: 'brand' },

    // --- KOZMETIK & BAKIM ---
    { id: 'kz-1', name: 'Gratis', category: 'Kozmetik & Bakım', donationRate: 4, logoUrl: 'https://logo.clearbit.com/gratis.com', type: 'brand' },
    { id: 'kz-2', name: 'Lona Cosmetics', category: 'Kozmetik & Bakım', donationRate: 12, logoUrl: 'https://logo.clearbit.com/lonacosmetics.com', type: 'brand' },
    { id: 'kz-3', name: 'Arkopharma', category: 'Kozmetik & Bakım', donationRate: 8, logoUrl: 'https://logo.clearbit.com/arkopharma.com', type: 'brand' },
    { id: 'kz-4', name: 'Flormar', category: 'Kozmetik & Bakım', donationRate: 8, logoUrl: 'https://logo.clearbit.com/flormar.com.tr', type: 'brand' },
    { id: 'kz-5', name: 'Cosmed', category: 'Kozmetik & Bakım', donationRate: 10, logoUrl: 'https://logo.clearbit.com/cosmed.com.tr', type: 'brand' },
    { id: 'kz-6', name: 'Supplementler', category: 'Kozmetik & Bakım', donationRate: 5, logoUrl: 'https://logo.clearbit.com/supplementler.com', type: 'brand' },
    { id: 'kz-7', name: 'Vitaminler', category: 'Kozmetik & Bakım', donationRate: 5, logoUrl: 'https://logo.clearbit.com/vitaminler.com', type: 'brand' },
    { id: 'kz-8', name: 'CocoBody', category: 'Kozmetik & Bakım', donationRate: 15, logoUrl: 'https://logo.clearbit.com/cocobody.com', type: 'brand' },
    { id: 'kz-9', name: 'Recete', category: 'Kozmetik & Bakım', donationRate: 6, logoUrl: 'https://logo.clearbit.com/recete.com', type: 'brand' },

    // --- TATIL & SEYAHAT ---
    { id: 'tt-1', name: 'Tatilbudur', category: 'Tatil & Seyahat', donationRate: 3, logoUrl: 'https://logo.clearbit.com/tatilbudur.com', type: 'brand' },
    { id: 'tt-2', name: 'Etstur', category: 'Tatil & Seyahat', donationRate: 2, logoUrl: 'https://logo.clearbit.com/etstur.com', type: 'brand' },
    { id: 'tt-3', name: 'Touristica', category: 'Tatil & Seyahat', donationRate: 4, logoUrl: 'https://logo.clearbit.com/touristica.com.tr', type: 'brand' },
    { id: 'tt-4', name: 'SETUR', category: 'Tatil & Seyahat', donationRate: 3, logoUrl: 'https://logo.clearbit.com/setur.com.tr', type: 'brand' },
    { id: 'tt-5', name: 'Miniyol', category: 'Tatil & Seyahat', donationRate: 10, logoUrl: 'https://logo.clearbit.com/miniyol.com', type: 'brand' },
    { id: 'tt-6', name: 'Ucuzabilet', category: 'Tatil & Seyahat', donationRate: 2, logoUrl: 'https://logo.clearbit.com/ucuzabilet.com', type: 'brand' },
    { id: 'tt-7', name: 'Tatildekirala', category: 'Tatil & Seyahat', donationRate: 5, logoUrl: 'https://logo.clearbit.com/tatildekirala.com', type: 'brand' },
    { id: 'tt-8', name: 'Bilet.com', category: 'Tatil & Seyahat', donationRate: 4, logoUrl: 'https://logo.clearbit.com/bilet.com', type: 'brand' },
    { id: 'tt-9', name: 'Samsonite', category: 'Tatil & Seyahat', donationRate: 6, logoUrl: 'https://logo.clearbit.com/samsonite.com.tr', type: 'brand' },

    // --- GIYIM ---
    { id: 'gy-1', name: 'Beymen', category: 'Giyim', donationRate: 5, logoUrl: 'https://logo.clearbit.com/beymen.com', type: 'brand' },
    { id: 'gy-2', name: 'Suwen', category: 'Giyim', donationRate: 7, logoUrl: 'https://logo.clearbit.com/suwen.com.tr', type: 'brand' },
    { id: 'gy-3', name: 'Aker', category: 'Giyim', donationRate: 6, logoUrl: 'https://logo.clearbit.com/aker.com.tr', type: 'brand' },
    { id: 'gy-4', name: 'Mizalle', category: 'Giyim', donationRate: 8, logoUrl: 'https://logo.clearbit.com/mizalle.com', type: 'brand' },
    { id: 'gy-5', name: 'İpekyol', category: 'Giyim', donationRate: 6, logoUrl: 'https://logo.clearbit.com/ipekyol.com.tr', type: 'brand' },
    { id: 'gy-6', name: 'Twist', category: 'Giyim', donationRate: 6, logoUrl: 'https://logo.clearbit.com/twist.com.tr', type: 'brand' },
    { id: 'gy-7', name: 'Slazenger', category: 'Giyim', donationRate: 5, logoUrl: 'https://logo.clearbit.com/slazenger.com.tr', type: 'brand' },
    { id: 'gy-8', name: 'Koton', category: 'Giyim', donationRate: 5, logoUrl: 'https://logo.clearbit.com/koton.com', type: 'brand' },
    { id: 'gy-9', name: 'H&M', category: 'Giyim', donationRate: 4, logoUrl: 'https://logo.clearbit.com/hm.com', type: 'brand' },
    { id: 'gy-10', name: 'Machka', category: 'Giyim', donationRate: 6, logoUrl: 'https://logo.clearbit.com/machka.com.tr', type: 'brand' },
    { id: 'gy-11', name: 'Fitmoda', category: 'Giyim', donationRate: 7, logoUrl: 'https://logo.clearbit.com/fitmoda.com', type: 'brand' },
    { id: 'gy-12', name: 'Boyner', category: 'Giyim', donationRate: 5, logoUrl: 'https://logo.clearbit.com/boyner.com.tr', type: 'brand' },
    { id: 'gy-13', name: 'Dagi', category: 'Giyim', donationRate: 6, logoUrl: 'https://logo.clearbit.com/dagi.com.tr', type: 'brand' },
    { id: 'gy-14', name: 'Addax', category: 'Giyim', donationRate: 8, logoUrl: 'https://logo.clearbit.com/addax.com.tr', type: 'brand' },
    { id: 'gy-15', name: 'Marks & Spencer', category: 'Giyim', donationRate: 5, logoUrl: 'https://logo.clearbit.com/marksandspencer.com.tr', type: 'brand' },
    { id: 'gy-16', name: 'GAP', category: 'Giyim', donationRate: 6, logoUrl: 'https://logo.clearbit.com/gap.com.tr', type: 'brand' },
    { id: 'gy-17', name: 'Mango', category: 'Giyim', donationRate: 6, logoUrl: 'https://logo.clearbit.com/mango.com', type: 'brand' },
    { id: 'gy-18', name: 'Divarese', category: 'Giyim', donationRate: 5, logoUrl: 'https://logo.clearbit.com/divarese.com.tr', type: 'brand' },
    { id: 'gy-19', name: 'LTB', category: 'Giyim', donationRate: 5, logoUrl: 'https://logo.clearbit.com/ltbjeans.com', type: 'brand' },
    { id: 'gy-20', name: 'Benetton', category: 'Giyim', donationRate: 6, logoUrl: 'https://logo.clearbit.com/benetton.com', type: 'brand' },
    { id: 'gy-21', name: 'Colins', category: 'Giyim', donationRate: 4, logoUrl: 'https://logo.clearbit.com/colins.com.tr', type: 'brand' },
    { id: 'gy-22', name: 'NetWork', category: 'Giyim', donationRate: 5, logoUrl: 'https://logo.clearbit.com/network.com.tr', type: 'brand' },
    { id: 'gy-23', name: 'DS Damat', category: 'Giyim', donationRate: 7, logoUrl: 'https://logo.clearbit.com/dsdamat.com', type: 'brand' },
    { id: 'gy-24', name: 'Altınyıldız', category: 'Giyim', donationRate: 7, logoUrl: 'https://logo.clearbit.com/altinyildizclassics.com', type: 'brand' },
    { id: 'gy-25', name: 'Yargıcı', category: 'Giyim', donationRate: 6, logoUrl: 'https://logo.clearbit.com/yargici.com', type: 'brand' },
    { id: 'gy-26', name: 'Lacoste', category: 'Giyim', donationRate: 5, logoUrl: 'https://logo.clearbit.com/lacoste.com.tr', type: 'brand' },
    { id: 'gy-27', name: 'US Polo', category: 'Giyim', donationRate: 5, logoUrl: 'https://logo.clearbit.com/uspoloassn.com.tr', type: 'brand' },

    // --- ANNE & BEBEK ---
    { id: 'bc-1', name: 'Carter’s', category: 'Anne & Bebek', donationRate: 6, logoUrl: 'https://logo.clearbit.com/carters.com', type: 'brand' },
    { id: 'bc-2', name: 'E-bebek', category: 'Anne & Bebek', donationRate: 4, logoUrl: 'https://logo.clearbit.com/ebebek.com', type: 'brand' },
    { id: 'bc-3', name: 'Jacadi', category: 'Anne & Bebek', donationRate: 8, logoUrl: 'https://logo.clearbit.com/jacadi.com.tr', type: 'brand' },
    { id: 'bc-4', name: 'Toyzz Shop', category: 'Anne & Bebek', donationRate: 5, logoUrl: 'https://logo.clearbit.com/toyzzshop.com', type: 'brand' },

    // --- EV & YASAM ---
    { id: 'ev-1', name: 'Doğtaş Home', category: 'Ev & Yaşam', donationRate: 3, logoUrl: 'https://logo.clearbit.com/dogtas.com', type: 'brand' },
    { id: 'ev-2', name: 'Kelebek Mobilya', category: 'Ev & Yaşam', donationRate: 3, logoUrl: 'https://logo.clearbit.com/kelebek.com', type: 'brand' },
    { id: 'ev-3', name: 'Koçtaş', category: 'Ev & Yaşam', donationRate: 3, logoUrl: 'https://logo.clearbit.com/koctas.com.tr', type: 'brand' },
    { id: 'ev-4', name: 'Karaca', category: 'Ev & Yaşam', donationRate: 5, logoUrl: 'https://logo.clearbit.com/karaca.com', type: 'brand' },
    { id: 'ev-5', name: 'Arçelik', category: 'Ev & Yaşam', donationRate: 4, logoUrl: 'https://logo.clearbit.com/arcelik.com.tr', type: 'brand' },
    { id: 'ev-6', name: 'Mudo', category: 'Ev & Yaşam', donationRate: 5, logoUrl: 'https://logo.clearbit.com/mudo.com.tr', type: 'brand' },
    { id: 'ev-7', name: 'Beko', category: 'Ev & Yaşam', donationRate: 4, logoUrl: 'https://logo.clearbit.com/beko.com.tr', type: 'brand' },
    { id: 'ev-8', name: 'Fakir', category: 'Ev & Yaşam', donationRate: 5, logoUrl: 'https://logo.clearbit.com/fakir.com.tr', type: 'brand' },
    { id: 'ev-9', name: 'Taç', category: 'Ev & Yaşam', donationRate: 6, logoUrl: 'https://logo.clearbit.com/tac.com.tr', type: 'brand' },
    { id: 'ev-10', name: 'Kütahya Porselen', category: 'Ev & Yaşam', donationRate: 7, logoUrl: 'https://logo.clearbit.com/kutahyaporselen.com.tr', type: 'brand' },

    // --- SÜPERMARKET ---
    { id: 'sm-1', name: 'A101', category: 'Süpermarket', donationRate: 2, logoUrl: 'https://logo.clearbit.com/a101.com.tr', type: 'brand' },
    { id: 'sm-2', name: 'Getir', category: 'Süpermarket', donationRate: 3, logoUrl: 'https://logo.clearbit.com/getir.com', type: 'brand' },
    { id: 'sm-3', name: 'CarrefourSA', category: 'Süpermarket', donationRate: 2, logoUrl: 'https://logo.clearbit.com/carrefoursa.com', type: 'brand' },
    { id: 'sm-4', name: 'Pazarama', category: 'Süpermarket', donationRate: 4, logoUrl: 'https://logo.clearbit.com/pazarama.com', type: 'brand' },
    { id: 'sm-5', name: 'n11', category: 'Süpermarket', donationRate: 3, logoUrl: 'https://logo.clearbit.com/n11.com', type: 'brand' },

    // --- ELEKTRONIK ---
    { id: 'el-1', name: 'Samsung', category: 'Elektronik', donationRate: 3, logoUrl: 'https://logo.clearbit.com/samsung.com', type: 'brand' },
    { id: 'el-2', name: 'Xiaomi', category: 'Elektronik', donationRate: 4, logoUrl: 'https://logo.clearbit.com/mi.com', type: 'brand' },
    { id: 'el-3', name: 'MediaMarkt', category: 'Elektronik', donationRate: 2, logoUrl: 'https://logo.clearbit.com/mediamarkt.com.tr', type: 'brand' },
    { id: 'el-4', name: 'Teknosa', category: 'Elektronik', donationRate: 3, logoUrl: 'https://logo.clearbit.com/teknosa.com', type: 'brand' },
    { id: 'el-5', name: 'Huawei', category: 'Elektronik', donationRate: 4, logoUrl: 'https://logo.clearbit.com/huawei.com', type: 'brand' },

    // --- GIDA & ICECEK ---
    { id: 'gd-1', name: 'Tchibo', category: 'Gıda & İçecek', donationRate: 6, logoUrl: 'https://logo.clearbit.com/tchibo.com.tr', type: 'brand' },
    { id: 'gd-2', name: 'Little Caesars', category: 'Gıda & İçecek', donationRate: 8, logoUrl: 'https://logo.clearbit.com/littlecaesars.com.tr', type: 'brand' },
    { id: 'gd-3', name: 'Fellas', category: 'Gıda & İçecek', donationRate: 12, logoUrl: 'https://logo.clearbit.com/fellasfoods.com.tr', type: 'brand' },

    // --- AKSESUAR & TAKI ---
    { id: 'ak-1', name: 'Altınbaş', category: 'Aksesuar & Takı', donationRate: 5, logoUrl: 'https://logo.clearbit.com/altinbas.com', type: 'brand' },
    { id: 'ak-2', name: 'Saat&Saat', category: 'Aksesuar & Takı', donationRate: 6, logoUrl: 'https://logo.clearbit.com/saatvesaat.com.tr', type: 'brand' },
    { id: 'ak-3', name: 'Lizay Pırlanta', category: 'Aksesuar & Takı', donationRate: 8, logoUrl: 'https://logo.clearbit.com/lizaypirlanta.com', type: 'brand' },

    // --- HOBI & HIZMET ---
    { id: 'hb-1', name: 'Idefix', category: 'Hobi & Hizmet', donationRate: 5, logoUrl: 'https://logo.clearbit.com/idefix.com', type: 'brand' },
    { id: 'hb-2', name: 'D&R', category: 'Hobi & Hizmet', donationRate: 4, logoUrl: 'https://logo.clearbit.com/dr.com.tr', type: 'brand' },
    { id: 'hb-3', name: 'Sosyopix', category: 'Hobi & Hizmet', donationRate: 10, logoUrl: 'https://logo.clearbit.com/sosyopix.com', type: 'brand' },
    { id: 'hb-4', name: 'Petzzshop', category: 'Hobi & Hizmet', donationRate: 7, logoUrl: 'https://logo.clearbit.com/petzzshop.com', type: 'brand' },
];

export const marketCategories: MarketCategory[] = [
    { mainCategory: 'Öne çıkanlar', subCategories: [] },
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

export const categoryMapping = {
    'Giyim': ['Giyim', 'Moda'],
    'Ayakkabı': ['Ayakkabı', 'Shoe'],
    'Elektronik': ['Elektronik', 'Technology'],
    'Ev & Yaşam': ['Ev', 'Yaşam', 'Home'],
    'Süpermarket': ['Süpermarket', 'Market'],
    'Kozmetik & Bakım': ['Kozmetik', 'Bakım', 'Bakımı'],
    'Tatil & Seyahat': ['Tatil', 'Seyahat', 'Bilet'],
    'Anne & Bebek': ['Anne', 'Bebek', 'Çocuk'],
    'Gıda & İçecek': ['Gıda', 'İçecek', 'Kahve'],
    'Aksesuar & Takı': ['Aksesuar', 'Takı', 'Saat', 'Pırlanta'],
    'Hobi & Hizmet': ['Hobi', 'Hizmet', 'Kitap', 'Pet', 'Hizmetleri']
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
    { id: '1', title: 'Afet Bölgesi Lojistik Destek', organization: 'Ahbap Derneği', ngoId: '2', location: { city: 'Hatay', district: 'Antakya', type: 'Saha' }, commitment: 'Dönemsel', volunteerCount: { needed: 50, applications: 120 }, dates: { applicationStart: '2024-07-01', applicationEnd: '2024-07-25', eventStart: '2024-08-01', eventEnd: '2024-08-08' }, hours: { start: '09:00', end: '18:00', total: 56 }, socialArea: 'Afet', points: 1500, ngoTransparencyScore: 95, taskType: 'Dönemsel', providesCertificate: true, earnedBadges: ['Afet Kahramanı'], hasPreTraining: true, description: 'Bölgedeki yardım kolilerinin tasnifi ve dağıtımında görev alacak gönüllüler arıyoruz.', amenities: { transport: true, food: true, accommodation: true } }
];

export const applications: Application[] = [
    { id: '1', title: 'Afet Bölgesi Yardım Dağıtımı', type: 'Gönüllülük', org: 'Ahbap', date: '2024-07-21', location: 'Hatay', status: 'Onaylandı', entityId: '1' }
];

export const donationTransactions: DonationTransaction[] = [
    { id: '1', type: 'expense', brand: 'Patagonia', purchaseAmount: '250.00', donationAmount: '25.00', ngo: ['TEMA'], date: '2024-07-21', time: '14:32' }
];

export const badges: Badge[] = [
    { id: '1', name: 'Çevre Koruyucusu', iconName: Leaf, level: 'Bronz', socialArea: 'Çevre', pointsRequired: 500, currentPoints: 800 }
];

export const certificates: Certificate[] = [
    { id: '1', title: 'Afet Gönüllülüğü Başarı Belgesi', organization: 'Ahbap', date: '15.07.2024', linkedinUrl: '#' }
];

export const helpTopics: HelpTopic[] = [
    { icon: 'Info', title: 'Genel Bilgiler', slug: 'genel', description: 'Platformun işleyişi hakkında temel bilgiler.', subtopics: [{ title: 'hangel Nedir?', link: '#', content: 'Hangel, alışverişi iyiliğe dönüştüren bir sosyal girişimdir.' }] }
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
