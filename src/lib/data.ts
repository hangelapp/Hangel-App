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
    { id: 'ay-11', name: 'Converse', category: 'Ayakkabı', donationRate: 10, logoUrl: 'https://logo.clearbit.com/converse.com.tr', type: 'brand' },
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
    { id: 'kz-10', name: 'Kuaförümden.com', category: 'Kozmetik & Bakım', donationRate: 7, logoUrl: 'https://logo.clearbit.com/kuaforumden.com', type: 'brand' },

    // --- TATIL & SEYAHAT ---
    { id: 'tt-1', name: 'Tatilbudur', category: 'Tatil & Seyahat', donationRate: 3, logoUrl: 'https://logo.clearbit.com/tatilbudur.com', type: 'brand' },
    { id: 'tt-2', name: 'Etstur', category: 'Tatil & Seyahat', donationRate: 2, logoUrl: 'https://logo.clearbit.com/etstur.com', type: 'brand' },
    { id: 'tt-3', name: 'Touristica', category: 'Tatil & Seyahat', donationRate: 4, logoUrl: 'https://logo.clearbit.com/touristica.com.tr', type: 'brand' },
    { id: 'tt-4', name: 'SETUR', category: 'Tatil & Seyahat', donationRate: 3, logoUrl: 'https://logo.clearbit.com/setur.com.tr', type: 'brand' },
    { id: 'tt-5', name: 'miniyol.com', category: 'Tatil & Seyahat', donationRate: 10, logoUrl: 'https://logo.clearbit.com/miniyol.com', type: 'brand' },
    { id: 'tt-6', name: 'Ucuzabilet', category: 'Tatil & Seyahat', donationRate: 2, logoUrl: 'https://logo.clearbit.com/ucuzabilet.com', type: 'brand' },
    { id: 'tt-7', name: 'Tatildekirala.com', category: 'Tatil & Seyahat', donationRate: 5, logoUrl: 'https://logo.clearbit.com/tatildekirala.com', type: 'brand' },
    { id: 'tt-8', name: 'bilet.com', category: 'Tatil & Seyahat', donationRate: 4, logoUrl: 'https://logo.clearbit.com/bilet.com', type: 'brand' },
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
    { id: 'gy-14', name: 'Addax.com.tr', category: 'Giyim', donationRate: 8, logoUrl: 'https://logo.clearbit.com/addax.com.tr', type: 'brand' },
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
    { id: 'ev-7', name: 'Beko', category: 'Ev & Yaşam', donationRate: 4, logoUrl: 'https://logo.clearbit.com/arcelik.com.tr', type: 'brand' },
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
    { id: '1', author: { name: 'TEMA Vakıfı', avatarUrl: 'https://logo.clearbit.com/tema.org.tr' }, content: 'Bugün Balıkesir fidan dikme etkinliğimizde 200 yeni ağacı toprakla buluşturduk! 🌳 Gelecek nesillere daha yeşil bir dünya bırakmak için var gücümüzle çalışıyoruz. #Doğaİçin #TEMA', timestamp: '2 saat önce', likes: 1240, comments: 45, imageUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=2013&auto=format&fit=crop', imageHint: 'planting trees' },
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
export const helpTopics: HelpTopic[] = [];
export const ngoHelpTopics = helpTopics;
export const ngoFaqArticles = [];
export const pastVolunteering = [];
export const managedItems: ManagedItem[] = [
    { name: 'Ahbap Derneği', type: 'STK', icon: 'heart', href: '/ngo-admin/dashboard', status: 'approved', logoUrl: 'https://logo.clearbit.com/ahbap.org' }
];

export const qrPaymentCardData = [
    { id: 'bireysel', type: 'Bireysel', bgColor: 'bg-primary', number: '5549601000001234', owner: 'İsmail Hilmi ADIGÜZEL', expiry: '12/28', balance: '1.250,75 ₺', ngoId: '1', cvv: '123' }
];
