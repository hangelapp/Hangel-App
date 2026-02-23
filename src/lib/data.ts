
'use client';

import { Leaf, Heart, HeartHandshake, Star, Award, Calendar, MapPin, Landmark, Briefcase, DollarSign, Users, Smile, Utensils, Siren, Scale, Lightbulb, FlaskConical, Accessibility, PersonStanding, Palette, Sprout, HeartPulse, Handshake, Baby } from 'lucide-react';
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

// Persisting only the required demo user
export const user: User = {
    id: '1',
    name: 'İsmail Hilmi ADIGÜZEL',
    username: '@ismailhilmicom',
    avatarUrl: 'https://images.unsplash.com/photo-1521119989659-a83eee488004?q=80&w=1080',
    coverPhotoUrl: 'https://images.unsplash.com/photo-1693902939226-449195d2698b?q=80&w=1080',
    impactScore: 15750,
    personalInfo: {
        email: 'i.adiguzel@email.com',
        phone: '5077007007',
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
    { name: 'Trip.com', rate: 2, category: 'Seyahat', domain: 'trip.com', type: 'brand' },
    { name: 'Pazarama', rate: 2, category: 'Pazar Yeri', domain: 'pazarama.com', type: 'brand' },
    { name: 'Karaca', rate: 3, category: 'Ev & Yaşam', domain: 'karaca.com', type: 'brand' },
    { name: 'Yalıspor', rate: 2, category: 'Giyim', domain: 'yalispor.com.tr', type: 'brand' },
    { name: 'Mango', rate: 2, category: 'Giyim', domain: 'mango.com', type: 'brand' },
    { name: 'Getir', rate: 2, category: 'Süpermarket', domain: 'getir.com', type: 'brand' },
    { name: 'Tatilbudur', rate: 3, category: 'Seyahat', domain: 'tatilbudur.com', type: 'brand' },
    { name: 'CarrefourSA', rate: 2, category: 'Süpermarket', domain: 'carrefoursa.com', type: 'brand' },
    { name: 'Boyner', rate: 2, category: 'Giyim', domain: 'boyner.com.tr', type: 'brand' },
    { name: 'Ucuzabilet', rate: 2, category: 'Seyahat', domain: 'ucuzabilet.com', type: 'brand' },
    { name: 'CamperTR', rate: 4.67, category: 'Ayakkabı', domain: 'camper.com', type: 'brand' },
    { name: 'H&M', rate: 6, category: 'Giyim', domain: 'hm.com', type: 'brand' },
    { name: 'Bilet.com', rate: 2, category: 'Seyahat', domain: 'bilet.com', type: 'brand' },
    { name: 'Tchibo', rate: 2, category: 'Gıda & İçecek', domain: 'tchibo.com.tr', type: 'brand' },
    { name: 'Homend', rate: 2, category: 'Elektronik', domain: 'homend.com.tr', type: 'brand' },
    { name: 'Skechers', rate: 2, category: 'Ayakkabı', domain: 'skechers.com.tr', type: 'brand' },
    { name: 'MediaMarkt', rate: 2, category: 'Elektronik', domain: 'mediamarkt.com.tr', type: 'brand' },
    { name: 'Mudo', rate: 1.8, category: 'Giyim', domain: 'mudo.com.tr', type: 'brand' },
    { name: 'Bella Maison', rate: 2, category: 'Ev & Yaşam', domain: 'bellamaison.com', type: 'brand' },
    { name: 'Ayakkabı Dünyası', rate: 4, category: 'Ayakkabı', domain: 'ayakkabidunyasi.com.tr', type: 'brand' },
    { name: 'Decathlon', rate: 2, category: 'Giyim', domain: 'decathlon.com.tr', type: 'brand' },
    { name: 'Carter’s', rate: 2, category: 'Anne & Bebek', domain: 'carters.com', type: 'brand' },
    { name: 'MinyCenter', rate: 2, category: 'Anne & Bebek', domain: 'minycenter.com.tr', type: 'brand' },
    { name: 'Huawei', rate: 2, category: 'Elektronik', domain: 'huawei.com', type: 'brand' },
    { name: 'Vitaminler', rate: 5, category: 'Kozmetik & Bakım', domain: 'vitaminler.com', type: 'brand' },
    { name: 'Amazon TR', rate: 13, category: 'Pazar Yeri', domain: 'amazon.com.tr', type: 'brand' },
    { name: 'Emsan', rate: 2, category: 'Ev & Yaşam', domain: 'emsan.com.tr', type: 'brand' },
    { name: 'Mavi', rate: 2, category: 'Giyim', domain: 'mavi.com', type: 'brand' },
    { name: 'A101', rate: 2, category: 'Süpermarket', domain: 'a101.com.tr', type: 'brand' },
    { name: 'Pierre Cardin', rate: 11, category: 'Giyim', domain: 'pierrecardin.com.tr', type: 'brand' },
    { name: 'Cacharel', rate: 11, category: 'Giyim', domain: 'cacharel.com.tr', type: 'brand' },
    { name: 'US Polo Assn.', rate: 11, category: 'Giyim', domain: 'tr.uspoloassn.com', type: 'brand' },
    { name: 'n11', rate: 2, category: 'Pazar Yeri', domain: 'n11.com', type: 'brand' },
    { name: 'Samsung', rate: 1.66, category: 'Elektronik', domain: 'samsung.com', type: 'brand' },
    { name: 'Penti', rate: 2, category: 'Giyim', domain: 'penti.com', type: 'brand' },
    { name: 'Teknosa', rate: 2, category: 'Elektronik', domain: 'teknosa.com', type: 'brand' },
    { name: 'Altınbaş', rate: 2, category: 'Aksesuar & Takı', domain: 'altinbas.com', type: 'brand' },
    { name: 'IKEA', rate: 2, category: 'Ev & Yaşam', domain: 'ikea.com.tr', type: 'brand' },
    { name: 'Etstur', rate: 2, category: 'Seyahat', domain: 'etstur.com', type: 'brand' },
    { name: 'Divarese', rate: 5, category: 'Ayakkabı', domain: 'divarese.com.tr', type: 'brand' },
    { name: 'Flaw Wear', rate: 3, category: 'Giyim', domain: 'flawwear.com', type: 'brand' },
    { name: 'Fresh Scarfs', rate: 5, category: 'Giyim', domain: 'freshscarfs.com', type: 'brand' },
    { name: 'TARTI', rate: 10, category: 'Hobi & Hizmet', domain: 'tarti.com', type: 'brand' },
    { name: 'Reeder', rate: 1.5, category: 'Elektronik', domain: 'reeder.com.tr', type: 'brand' },
    { name: 'Enjoy eSIM', rate: 9, category: 'Hobi & Hizmet', domain: 'enjoyesim.com', type: 'brand' },
    { name: 'Madame Coco', rate: 4, category: 'Ev & Yaşam', domain: 'madamecoco.com', type: 'brand' },
    { name: 'LG', rate: 3, category: 'Elektronik', domain: 'lg.com', type: 'brand' },
    { name: 'Arkopharma', rate: 15, category: 'Kozmetik & Bakım', domain: 'arkopharma.com.tr', type: 'brand' },
    { name: 'Petzzshop', rate: 3, category: 'Hobi & Hizmet', domain: 'petzzshop.com', type: 'brand' },
    { name: 'Manuka', rate: 5, category: 'Giyim', domain: 'manuka.com.tr', type: 'brand' },
    { name: 'Kayra', rate: 5, category: 'Giyim', domain: 'kayra.com', type: 'brand' },
    { name: 'Sosyopix', rate: 10, category: 'Hobi & Hizmet', domain: 'sosyopix.com', type: 'brand' },
    { name: 'Airalo', rate: 8, category: 'Seyahat', domain: 'airalo.com', type: 'brand' },
    { name: 'Xiaomi', rate: 2, category: 'Elektronik', domain: 'mi.com', type: 'brand' },
    { name: 'FLO', rate: 7.5, category: 'Ayakkabı', domain: 'flo.com.tr', type: 'brand' },
    { name: 'Forever21', rate: 2, category: 'Giyim', domain: 'forever21.com', type: 'brand' },
    { name: 'Bialetti', rate: 7, category: 'Ev & Yaşam', domain: 'bialetti.com.tr', type: 'brand' },
    { name: 'Tazecicek', rate: 4.5, category: 'Hobi & Hizmet', domain: 'tazecicek.com', type: 'brand' },
    { name: 'Mizalle', rate: 5, category: 'Giyim', domain: 'mizalle.com', type: 'brand' },
    { name: 'Teknevia', rate: 2, category: 'Seyahat', domain: 'teknevia.com', type: 'brand' },
    { name: 'Lona Cosmetics', rate: 25, category: 'Kozmetik & Bakım', domain: 'lonacosmetics.com', type: 'brand' },
    { name: 'EvdeEczane', rate: 3, category: 'Kozmetik & Bakım', domain: 'evdeeczane.com', type: 'brand' },
    { name: 'Cosmed', rate: 5, category: 'Kozmetik & Bakım', domain: 'cosmed.com.tr', type: 'brand' },
    { name: 'Tonguç Akademi', rate: 5.5, category: 'Hobi & Hizmet', domain: 'tongucakademi.com', type: 'brand' },
    { name: 'Tonguç Mağaza', rate: 5.5, category: 'Hobi & Hizmet', domain: 'tongucmagaza.com', type: 'brand' },
    { name: 'Kütahya Porselen', rate: 4, category: 'Ev & Yaşam', domain: 'kutahyaporselen.com', type: 'brand' },
    { name: 'General Mobile', rate: 2, category: 'Elektronik', domain: 'generalmobile.com', type: 'brand' },
    { name: 'Farfetch', rate: 7, category: 'Giyim', domain: 'farfetch.com', type: 'brand' },
    { name: 'Konyalı Saat', rate: 2, category: 'Aksesuar & Takı', domain: 'konyalisaat.com.tr', type: 'brand' },
    { name: 'Korkmaz', rate: 3, category: 'Ev & Yaşam', domain: 'korkmaz.com.tr', type: 'brand' },
    { name: 'E-bebek', rate: 2.5, category: 'Anne & Bebek', domain: 'e-bebek.com', type: 'brand' },
    { name: 'Slazenger', rate: 3, category: 'Giyim', domain: 'slazenger.com.tr', type: 'brand' },
    { name: 'Tudors', rate: 6, category: 'Giyim', domain: 'tudors.com', type: 'brand' },
    { name: 'Casper', rate: 2, category: 'Elektronik', domain: 'casper.com.tr', type: 'brand' },
    { name: 'Toyzz Shop', rate: 7.2, category: 'Anne & Bebek', domain: 'toyzzshop.com', type: 'brand' },
    { name: 'Taç', rate: 4, category: 'Ev & Yaşam', domain: 'tac.com.tr', type: 'brand' },
    { name: 'PUMA', rate: 6, category: 'Giyim', domain: 'puma.com', type: 'brand' },
    { name: 'Marks & Spencer', rate: 2, category: 'Giyim', domain: 'marksandspencer.com.tr', type: 'brand' },
    { name: 'GAP', rate: 2, category: 'Giyim', domain: 'gap.com.tr', type: 'brand' },
    { name: 'Beymen', rate: 3, category: 'Giyim', domain: 'beymen.com', type: 'brand' },
    { name: 'Banggood', rate: 5.5, category: 'Pazar Yeri', domain: 'banggood.com', type: 'brand' },
    { name: 'Koçtaş', rate: 2.2, category: 'Ev & Yaşam', domain: 'koctas.com.tr', type: 'brand' },
    { name: 'Colins', rate: 9, category: 'Giyim', domain: 'colins.com.tr', type: 'brand' },
    { name: 'D&R', rate: 2.5, category: 'Hobi & Hizmet', domain: 'dr.com.tr', type: 'brand' },
    { name: 'Koton', rate: 4.5, category: 'Giyim', domain: 'koton.com', type: 'brand' },
    { name: 'Linens', rate: 5, category: 'Ev & Yaşam', domain: 'linens.com.tr', type: 'brand' },
    { name: 'Saat & Saat', rate: 1, category: 'Aksesuar & Takı', domain: 'saatvesaat.com.tr', type: 'brand' },
    { name: 'Sportive', rate: 6.5, category: 'Giyim', domain: 'sportive.com.tr', type: 'brand' },
    { name: 'Beko', rate: 3, category: 'Elektronik', domain: 'beko.com.tr', type: 'brand' },
    { name: 'Benetton', rate: 6, category: 'Giyim', domain: 'benetton.com', type: 'brand' },
    { name: 'Yargıcı', rate: 5.6, category: 'Giyim', domain: 'yargici.com', type: 'brand' },
    { name: 'Gant', rate: 6, category: 'Giyim', domain: 'gant.com.tr', type: 'brand' },
    { name: 'Nautica', rate: 7, category: 'Giyim', domain: 'nautica-tr.com', type: 'brand' },
    { name: 'Lacoste', rate: 5, category: 'Giyim', domain: 'lacoste.com.tr', type: 'brand' },
    { name: 'Arçelik', rate: 3, category: 'Elektronik', domain: 'arcelik.com.tr', type: 'brand' },
    { name: 'Little Caesars', rate: 6, category: 'Gıda & İçecek', domain: 'littlecaesars.com.tr', type: 'brand' },

    // Kooperatifler
    { name: 'S.S. Kadın Emeği Kooperatifi', type: 'cooperative', rate: 4, category: 'El Sanatları', domain: 'kadinkoop.org' },
    { name: 'S.S. Trakya Bağcılık Kooperatifi', type: 'cooperative', rate: 3.5, category: 'Gıda & İçecek', domain: 'trakyabag.coop' },
    { name: 'S.S. Anadolu Arı Kadınlar Kooperatifi', type: 'cooperative', rate: 5, category: 'Gıda & İçecek', domain: 'arikadinlar.org' },
    { name: 'S.S. Ege Zeytincilik Kooperatifi', type: 'cooperative', rate: 4.2, category: 'Gıda & İçecek', domain: 'egezeytin.coop' },
    { name: 'S.S. Toprak Ana Tarım Kooperatifi', type: 'cooperative', rate: 3, category: 'Tarım', domain: 'toprakana.org' },
    { name: 'S.S. Kars Kaşarı Üreticileri Kooperatifi', type: 'cooperative', rate: 4.5, category: 'Gıda & İçecek', domain: 'karskasari.coop' },
    { name: 'S.S. El Sanatları ve Tasarım Kooperatifi', type: 'cooperative', rate: 5.5, category: 'El Sanatları', domain: 'elsanatlari.coop' },
    { name: 'S.S. Geri Dönüşüm Emekçileri Kooperatifi', type: 'cooperative', rate: 2.5, category: 'Çevre', domain: 'geridonusum.coop' },
    { name: 'S.S. Organik Sebze Üreticileri Kooperatifi', type: 'cooperative', rate: 3.8, category: 'Tarım', domain: 'organiksebze.coop' },
    { name: 'S.S. Güneş Enerjisi Kooperatifi', type: 'cooperative', rate: 2, category: 'Enerji', domain: 'gunesenerjisi.coop' },
    { name: 'S.S. Köy Turizmi Geliştirme Kooperatifi', type: 'cooperative', rate: 4, category: 'Seyahat', domain: 'koyturizmi.coop' },
    { name: 'S.S. Dayanışma Tüketim Kooperatifi', type: 'cooperative', rate: 1.5, category: 'Pazar Yeri', domain: 'dayanismatuketim.coop' },
    { name: 'S.S. Tohum Takas Kooperatifi', type: 'cooperative', rate: 3, category: 'Tarım', domain: 'tohumtakas.org' },
    { name: 'S.S. Patili Dostlar Bakım Kooperatifi', type: 'cooperative', rate: 5, category: 'Hobi & Hizmet', domain: 'patilidostlar.coop' },
    { name: 'S.S. İpek Dokuma Kadın Kooperatifi', type: 'cooperative', rate: 6, category: 'Giyim', domain: 'ipekdokuma.coop' },
    { name: 'S.S. Adil Ticaret Kahve Kooperatifi', type: 'cooperative', rate: 4.5, category: 'Gıda & İçecek', domain: 'adilticaretkahve.coop' },
    { name: 'S.S. Yöresel Peynir Üreticileri Kooperatifi', type: 'cooperative', rate: 4.8, category: 'Gıda & İçecek', domain: 'yoreselpeynir.coop' },
    { name: 'S.S. Çocuk Gelişim ve Eğitim Kooperatifi', type: 'cooperative', rate: 3.5, category: 'Eğitim', domain: 'cocukgelisim.coop' },
    { name: 'S.S. Temiz Su Erişim Kooperatifi', type: 'cooperative', rate: 2.8, category: 'Çevre', domain: 'temizsu.coop' },
    { name: 'S.S. Engelsiz Yaşam Destek Kooperatifi', type: 'cooperative', rate: 4, category: 'Sosyal Hizmet', domain: 'engelsizyasam.coop' },
    { name: 'S.S. Kültürel Miras Koruma Kooperatifi', type: 'cooperative', rate: 3.2, category: 'Kültür & Sanat', domain: 'kulturelmiras.coop' },

    // İktisadi İşletmeler
    { name: 'TEMA Vakfı İktisadi İşletmesi', type: 'economic', rate: 5, category: 'Mağazacılık', domain: 'temavakfi.org' },
    { name: 'LÖSEV İktisadi İşletmesi (LSV Dükkan)', type: 'economic', rate: 6, category: 'Mağazacılık', domain: 'lsvdukkan.com' },
    { name: 'Uluslararası Sosyal Fayda Derneği İktisadi İşletmesi', type: 'economic', rate: 4, category: 'Mağazacılık', domain: 'socialbusinessglobal.org' },
    { name: 'HAYTAP İktisadi İşletmesi', type: 'economic', rate: 4.5, category: 'Mağazacılık', domain: 'haytap.org' },
    { name: 'TEGV İktisadi İşletmesi (Eğitim Parkları)', type: 'economic', rate: 3, category: 'Eğitim', domain: 'tegv.org' },
    { name: 'İHD İktisadi İşletmesi (Yayıncılık)', type: 'economic', rate: 2.5, category: 'Hobi & Hizmet', domain: 'ihd.org.tr' },
    { name: 'KEDV İktisadi İşletmesi (Nahıl Dükkan)', type: 'economic', rate: 5.5, category: 'El Sanatları', domain: 'nahil.com.tr' },
    { name: 'Mor Çatı İktisadi İşletmesi', type: 'economic', rate: 3, category: 'Sosyal Hizmet', domain: 'morcati.org.tr' },
    { name: 'Tohum Otizm Vakfı İktisadi İşletmesi', type: 'economic', rate: 4, category: 'Eğitim', domain: 'tohumotizm.org.tr' },
    { name: 'Darüşşafaka Cemiyeti İktisadi İşletmesi', type: 'economic', rate: 3.5, category: 'Mağazacılık', domain: 'darussafaka.org' },
    { name: 'Türk Kızılayı İktisadi İşletmesi', type: 'economic', rate: 2, category: 'Sağlık', domain: 'kizilay.org.tr' },
    { name: 'Yeşilay İktisadi İşletmesi', type: 'economic', rate: 2.5, category: 'Hobi & Hizmet', domain: 'yesilay.org.tr' },
    { name: 'ÇYDD İktisadi İşletmesi', type: 'economic', rate: 3, category: 'Mağazacılık', domain: 'cydd.org.tr' },
    { name: 'Koruncuk Vakfı İktisadi İşletmesi', type: 'economic', rate: 4, category: 'Mağazacılık', domain: 'koruncuk.org' },
    { name: 'AÇEV İktisadi İşletmesi', type: 'economic', rate: 3, category: 'Eğitim', domain: 'acev.org' },
    { name: 'Toplum Gönüllüleri Vakfı (TOG) İktisadi İşletmesi', type: 'economic', rate: 4, category: 'Mağazacılık', domain: 'tog.org.tr' },
    { name: 'Türkiye Spastik Çocuklar Vakfı İktisadi İşletmesi', type: 'economic', rate: 3, category: 'Sağlık', domain: 'tscv.org.tr' },
    { name: 'WWF Türkiye İktisadi İşletmesi', type: 'economic', rate: 5, category: 'Mağazacılık', domain: 'wwf.org.tr' },
    { name: 'UNICEF Türkiye Milli Komitesi İktisadi İşletmesi', type: 'economic', rate: 2, category: 'Mağazacılık', domain: 'unicefturk.org' },
    { name: 'Türk Eğitim Vakfı (TEV) İktisadi İşletmesi', type: 'economic', rate: 3, category: 'Mağazacılık', domain: 'tev.org.tr' },
    { name: 'Türkiye Omurilik Felçlileri Derneği İktisadi İşletmesi', type: 'economic', rate: 3, category: 'Sağlık', domain: 'tofd.org.tr' },

    // Sosyal Şirketler
    { name: 'Fazla Gıda', type: 'social', rate: 3, category: 'Teknoloji', domain: 'fazlagida.com' },
    { name: 'Otsimo', type: 'social', rate: 4, category: 'Eğitim', domain: 'otsimo.com' },
    { name: 'B-Good', type: 'social', rate: 5, category: 'Giyim', domain: 'b-good.com' },
    { name: 'E-Bursum', type: 'social', rate: 2.5, category: 'Teknoloji', domain: 'e-bursum.com' },
    { name: 'Askıda Ne Var', type: 'social', rate: 3.5, category: 'Sosyal Hizmet', domain: 'askidanevar.com' },
    { name: 'Anlatan Eller', type: 'social', rate: 4, category: 'Eğitim', domain: 'anlataneller.org' },
    { name: 'İhtiyaç Haritası', type: 'social', rate: 3, category: 'Teknoloji', domain: 'ihtiyacharitası.org' },
    { name: 'Good4Trust', type: 'social', rate: 2, category: 'Pazar Yeri', domain: 'good4trust.org' },
    { name: 'Twin Science', type: 'social', rate: 4.5, category: 'Eğitim', domain: 'twinscience.com' },
    { name: 'Evreka', type: 'social', rate: 3, category: 'Teknoloji', domain: 'evreka.co' },
    { name: 'WeWalk', type: 'social', rate: 5, category: 'Teknoloji', domain: 'wewalk.io' },
    { name: 'BlindLook', type: 'social', rate: 4, category: 'Teknoloji', domain: 'blindlook.com' },
    { name: 'Biolive', type: 'social', rate: 3.5, category: 'Çevre', domain: 'biolive.com.tr' },
    { name: 'Ecording', type: 'social', rate: 4, category: 'Teknoloji', domain: 'ecording.org' },
    { name: 'Robotel Türkiye', type: 'social', rate: 3, category: 'Sosyal Hizmet', domain: 'robotel.org' },
    { name: 'KODA (Köy Okulları Değişim Ağı)', type: 'social', rate: 4, category: 'Eğitim', domain: 'kodegisim.org' },
    { name: 'Düşler Akademisi', type: 'social', rate: 3.5, category: 'Kültür & Sanat', domain: 'duslerakademisi.org' },
    { name: 'Givin', type: 'social', rate: 3, category: 'Pazar Yeri', domain: 'givin.co' },
    { name: 'SOGLA (Sosyal Girişimci Genç Liderler Akademisi)', type: 'social', rate: 2.5, category: 'Eğitim', domain: 'sogla.org' },
    { name: 'Toyi', type: 'social', rate: 4, category: 'Anne & Bebek', domain: 'toyi.io' },
    { name: 'Puduhepa ve Kız Kardeşleri', type: 'social', rate: 5, category: 'Kültür & Sanat', domain: 'puduhepa.com' },
];

export const allEntityLists: Brand[] = brandsData.map((brand, index) => {
    const slug = slugify(brand.name);
    const brandId = `brand-${index + 1}`;
    
    // Create mock data based on user request
    const mockAbout = `"${brand.name}" olarak, sürdürülebilir ve etik üretim prensiplerini benimsiyoruz. Her alışverişinizde, belirlediğimiz sosyal etki alanlarına katkıda bulunarak toplumsal bir fayda yaratmanıza olanak tanıyoruz. Kaliteyi ve toplumsal sorumluluğu bir araya getiriyoruz.`;
    const mockJoinDate = `202${3 - (index % 4)}-0${(index % 9) + 1}-${(index % 28) + 1}`;
    const mockDonationByCategory = [
        { category: 'Giyim', rate: brand.rate },
        { category: 'Aksesuar', rate: brand.rate * 0.8 },
        { category: 'Ev & Yaşam', rate: brand.rate * 0.9 },
        { category: 'Elektronik', rate: brand.rate * 0.5 },
    ].slice(0, 4);

    const mockStats = {
        supporters: 15000 + (index * 1234),
        totalDonation: 250000 + (index * 5432),
        monthlyFollowerGrowth: 5 + (index % 10),
        profileViews: 50000 + (index * 4321),
        profileShares: 2000 + (index * 123),
    };
    
    const mockSustainabilityReports = [
        { title: '2024 Sürdürülebilirlik Raporu', url: '#' },
        { title: '2023 Sürdürülebilirlik Raporu', url: '#' },
        { title: '2024 KSS Raporu', url: '#' },
        { title: '2023 KSS Raporu', url: '#' },
    ];

    const mockPosts: Post[] = [
        {
            id: `post-brand-${brandId}`,
            author: {
                name: brand.name,
                avatarUrl: `https://logo.clearbit.com/${brand.domain}`,
            },
            content: `Yeni sezon ürünlerimizle tanışın! ✨ Her alışverişinizde doğaya ve topluma katkıda bulunmanın keyfini çıkarın. Bu sezonki gelirlerimizin bir kısmını ${['TEMA Vakfı', 'Uluslararası Sosyal Fayda Derneği', 'LÖSEV'][index % 3]}'na bağışlıyoruz.`,
            imageUrl: `https://picsum.photos/seed/${slug}/800/450`,
            imageHint: 'product lifestyle shot',
            timestamp: `${(index % 5) + 1} gün önce`,
            likes: 150 + (index * 23),
            comments: 10 + (index * 5),
            sponsored: index % 4 === 0,
        },
    ];

    return {
        id: brandId,
        slug: slug,
        name: brand.name,
        donationRate: brand.rate,
        logoUrl: `https://logo.clearbit.com/${brand.domain}`,
        type: (brand as any).type || 'brand',
        category: brand.category,
        agency: 'GelirOrtaklari', // default
        about: mockAbout,
        joinDate: mockJoinDate,
        donationByCategory: mockDonationByCategory,
        stats: mockStats,
        sustainabilityReports: mockSustainabilityReports,
        posts: mockPosts,
        followers: 15000 + (index * 1234),
    };
});

export const marketCategories: MarketCategory[] = [{ mainCategory: 'Tümü', subCategories: [] }, ...[...new Set(allEntityLists.map(b => b.category))].map(c => ({ mainCategory: c, subCategories: [] }))];


export const timelinePosts: Post[] = [
    { id: '1', author: { name: 'TEMA Vakfı', avatarUrl: 'https://logo.clearbit.com/tema.org.tr' }, content: 'Bugün Balıkesir fidan dikme etkinliğimizde 200 yeni ağacı toprakla buluşturduk! 🌳 Gelecek nesillere daha yeşil bir dünya bırakmak için var gücümüzle çalışıyoruz. #Doğaİçin #TEMA', timestamp: '2 saat önce', likes: 1240, comments: 45, imageUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=2013&auto=format&fit=crop', imageHint: 'planting trees' },
    { id: '2', author: { name: 'Uluslararası Sosyal Fayda Derneği', avatarUrl: 'https://logo.clearbit.com/socialbusinessglobal.org' }, content: 'Hatay ve Adıyaman bölgelerindeki ihtiyaç sahibi aileler için hazırladığımız 5000 adet gıda kolisini gönüllü ekibimizle birlikte dağıtmaya başladık. 🙏 Dayanışma yaşatır! #SBG #Dayanışma', timestamp: '5 saat önce', likes: 3500, comments: 120, imageUrl: 'https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?q=80&w=2070&auto=format&fit=crop', imageHint: 'food donation' }
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
        name: 'Uluslararası Sosyal Fayda Derneği',
        shortName: 'SBG',
        foundationYear: 2017,
        category: 'Dayanışma',
        type: 'Dernek',
        avatarUrl: 'https://logo.clearbit.com/socialbusinessglobal.org',
        coverPhotoUrl: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?q=80&w=2070&auto=format&fit=crop',
        stats: { followers: 850000, donors: 250000, volunteers: 150000, volunteerHours: 500000, projects: 500, totalDonation: 12500000, donationCount: 300000, avgDonation: 41.67, highestSingleDonation: 1000, peopleReached: 2000000 },
        transparencyScore: 95,
        about: "Uluslararası Sosyal Fayda Derneği, toplumsal yardımlaşmaya, dayanışmaya, sevgiye ve paylaşmaya dayalı bir işbirliği hareketidir.",
        joinDate: "2023-02-20",
        supportedSDGs: ['Yoksulluğa Son', 'Açlığa Son', 'Nitelikli Eğitim'],
        beneficiaryGroups: ['İhtiyaç Sahipleri', 'Afetzedeler', 'Öğrenciler'],
        memberOf: ['Afet Platformu'],
        contact: { email: 'info@socialbusinessglobal.org', phone: '0216 550 50 50', website: 'https://socialbusinessglobal.org', social: { twitter: 'socialbusinessglobal', instagram: 'socialbusinessglobal', facebook: 'socialbusinessglobal', linkedin: 'socialbusinessglobal' } },
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
        name: 'hangel Derneği',
        shortName: 'hangel',
        foundationYear: 2020,
        category: 'Sosyal İnovasyon',
        type: 'Dernek',
        avatarUrl: '',
        coverPhotoUrl: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?q=80&w=2070&auto=format&fit=crop',
        stats: { followers: 15000, donors: 5000, volunteers: 2000, volunteerHours: 10000, projects: 15, totalDonation: 250000, donationCount: 1000, avgDonation: 250, highestSingleDonation: 5000, peopleReached: 50000 },
        transparencyScore: 98,
        about: "hangel Derneği, sosyal fayda odaklı teknoloji ve inovasyon projeleri geliştirerek, bireylerin ve kurumların sosyal etki potansiyelini en üst düzeye çıkarmayı hedefler. Sürdürülebilir ve ölçülebilir çözümlerle toplumsal sorunlara kalıcı çözümler üretmek için çalışır.",
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
    { id: '1', title: 'Afet Bölgesi Lojistik Destek', organization: 'Uluslararası Sosyal Fayda Derneği', ngoId: '2', location: { city: 'Hatay', district: 'Antakya', type: 'Saha' }, commitment: 'Dönemsel', volunteerCount: { needed: 50, applications: 120 }, dates: { applicationStart: '2025-05-01', applicationEnd: '2026-05-21', eventStart: '2025-06-01', eventEnd: '2025-06-30' }, hours: { start: '09:00', end: '18:00', total: 56 }, socialArea: 'Afet', points: 1500, ngoTransparencyScore: 95, taskType: 'Dönemsel', providesCertificate: true, earnedBadges: ['Afet Kahramanı'], hasPreTraining: true, description: 'Bölgedeki yardım kolilerinin tasnifi ve dağıtımında görev alacak gönüllüler arıyoruz.', amenities: { transport: true, food: true, accommodation: true } },
    { id: '2', title: 'Fidan Dikme Etkinliği', organization: 'TEMA Vakfı', ngoId: '1', location: { city: 'İstanbul', district: 'Beykoz', type: 'Saha' }, commitment: 'Tek Günlük', volunteerCount: { needed: 100, applications: 250 }, dates: { applicationStart: '2025-05-01', applicationEnd: '2026-05-21', eventStart: '2025-06-01', eventEnd: '2025-06-01' }, hours: { start: '10:00', end: '16:00', total: 6 }, socialArea: 'Çevre', points: 500, ngoTransparencyScore: 92, taskType: 'Tek Gün', providesCertificate: true, earnedBadges: ['Doğa Koruyucu'], hasPreTraining: false, description: 'Geleceğe nefes olmak için binlerce fidanı toprakla buluşturuyoruz.', amenities: { transport: false, food: true, accommodation: false } },
    { id: '3', title: 'Sosyal Medya İçerik Gönüllüsü', organization: 'LÖSEV', ngoId: '3', location: { city: 'Online', district: 'Online', type: 'Online' }, commitment: 'Sürekli', volunteerCount: { needed: 5, applications: 45 }, dates: { applicationStart: '2025-05-01', applicationEnd: '2026-05-21', eventStart: '2025-06-01', eventEnd: '2026-06-01' }, hours: { start: '09:00', end: '18:00', total: 240 }, socialArea: 'Sağlık', points: 2000, ngoTransparencyScore: 90, taskType: 'Sürekli', providesCertificate: true, earnedBadges: [], hasPreTraining: true, description: 'LÖSEV\'in sosyal medya hesapları için yaratıcı ve etkili içerikler üretecek gönüllüler arıyoruz.', amenities: { transport: false, food: false, accommodation: false }, skills: ['Sosyal Medya Yönetimi', 'Grafik Tasarım'] },
    { id: '4', title: 'Sokak Hayvanları İçin Kış Hazırlığı', organization: 'HAYTAP', ngoId: '4', location: { city: 'Bursa', district: 'Nilüfer', type: 'Saha' }, commitment: 'Haftalık', volunteerCount: { needed: 20, applications: 15 }, dates: { applicationStart: '2025-05-01', applicationEnd: '2026-05-21', eventStart: '2025-06-01', eventEnd: '2025-06-30' }, hours: { start: '10:00', end: '17:00', total: 28 }, socialArea: 'Hayvan Hakları', points: 800, ngoTransparencyScore: 88, taskType: 'Dönemsel', providesCertificate: true, earnedBadges: ['Hayvan Dostu'], hasPreTraining: false, description: 'Sokaktaki canlarımız için kulübe yapımı ve mama dağıtımı.', amenities: { transport: true, food: true, accommodation: false } },
    { id: '5', title: 'Üniversite Sosyal Etki Temsilcisi', organization: 'hangel Derneği', ngoId: '8', location: { city: 'Online', district: 'Türkiye Geneli', type: 'Online' }, commitment: 'Sürekli', volunteerCount: { needed: 25, applications: 0 }, dates: { applicationStart: '2025-05-01', applicationEnd: '2026-05-21', eventStart: '2025-06-01', eventEnd: '2026-06-01' }, hours: { start: '10:00', end: '18:00', total: 0 }, socialArea: 'Sosyal Girişimcilik', points: 5000, ngoTransparencyScore: 98, taskType: 'Sürekli', providesCertificate: true, earnedBadges: ['Liderlik Rozeti', 'Topluluk Yöneticisi'], hasPreTraining: true, description: 'Kampüsünüzde sosyal etki rüzgarı estirin! hangel\'in üniversite temsilcisi olarak etkinlikler düzenleyin, sosyal sorumluluk projeleri geliştirin ve kendi topluluğunuzun değişim lideri olun.', amenities: { transport: false, food: false, accommodation: false }, skills: ['Proje Yönetimi', 'Organizasyon', 'İletişim'], education: 'Üniversite' },
];

export const badges: Badge[] = [
    { id: '1', name: 'Çevre Koruyucusu', iconName: Leaf, level: 'Bronz', socialArea: 'Çevre', pointsRequired: 500, currentPoints: 800 },
    { id: '2', name: 'Çevre Koruyucusu', iconName: Leaf, level: 'Gümüş', socialArea: 'Çevre', pointsRequired: 1000, currentPoints: 800 },
    { id: '3', name: 'Çevre Koruyucusu', iconName: Leaf, level: 'Altın', socialArea: 'Çevre', pointsRequired: 2500, currentPoints: 800 },
    { id: '4', name: 'Çevre Koruyucusu', iconName: Leaf, level: 'Platin', socialArea: 'Çevre', pointsRequired: 5000, currentPoints: 800 },
    { id: '5', name: 'Çevre Koruyucusu', iconName: Leaf, level: 'Elmas', socialArea: 'Çevre', pointsRequired: 10000, currentPoints: 800 },
];
export const certificates: Certificate[] = [
    { id: 'cert1', title: 'Gönüllülük Liderliği Sertifikası', organization: 'hangel Akademi', date: '2024-05-20', linkedinUrl: '#' },
];

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
            }
        ]
    }
];

export const ngoHelpTopics = helpTopics;

export const ngoFaqArticles = [
    { title: 'Şeffaflık Puanım neden düşük?', content: '...' },
];

export const pastVolunteering = [];
export const managedItems: ManagedItem[] = [
    { name: 'Uluslararası Sosyal Fayda Derneği', type: 'STK', icon: 'heart', href: '/ngo-admin/dashboard', status: 'approved', logoUrl: 'https://logo.clearbit.com/socialbusinessglobal.org' },
];

export const qrPaymentCardData = [
    { id: 'bireysel', type: 'Bireysel', number: '5549601000001234', owner: 'İsmail Hilmi ADIGÜZEL', expiry: '12/28', balance: '1.250,75 ₺', ngoId: '1', cvv: '123', bgColor: 'bg-gradient-to-tr from-gray-900 to-gray-700' },
];

export const allUniversities = ["Boğaziçi Üniversitesi", "İstanbul Teknik Üniversitesi", "Orta Doğu Teknik Üniversitesi", "Hacettepe Üniversitesi"];
export const provincialDirectorates = ["İstanbul İl Millî Eğitim Müdürlüğü", "Ankara İl Millî Eğitim Müdürlüğü"];
export const studentClubs: StudentClub[] = [
    {
        id: '1',
        name: 'İTÜ Girişimcilik Kulübü',
        university: 'İstanbul Teknik Üniversitesi',
        type: 'university',
        category: 'Girişimcilik',
        avatarUrl: 'https://logo.clearbit.com/itu.edu.tr',
        coverPhotoUrl: 'https://picsum.photos/seed/clubcover1/800/200',
        members: 150,
        points: 4500,
        description: '...',
        vision: '...',
        joinDate: '2023-01-01',
        contact: { email: 'iletisim@itugirisim.org', phone: '+90 555 123 45 67', website: 'itugirisim.org' }
    }
];

export const events: Event[] = [];
export const schoolRepresentatives: SchoolRepresentative[] = [];
export const applications: Application[] = [];
export const donationTransactions: DonationTransaction[] = [];

    