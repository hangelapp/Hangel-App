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

export const user: User = {
    id: '1',
    name: 'İsmail Hilmi ADIGÜZEL',
    username: '@ismailhilmicom',
    avatarUrl: 'https://images.unsplash.com/photo-1521119989659-a83eee488004?q=80&w=1080',
    coverPhotoUrl: 'https://images.unsplash.com/photo-1693902939226-449195d2698b?q=80&w=1080',
    impactScore: 15750,
    personalInfo: {
        email: 'i.adiguzel@email.com',
        phone: '+90 538 400 90 90',
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
    { name: 'Ahbap Derneği İktisadi İşletmesi', type: 'economic', rate: 4, category: 'Mağazacılık', domain: 'ahbap.org' },
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
            content: `Yeni sezon ürünlerimizle tanışın! ✨ Her alışverişinizde doğaya ve topluma katkıda bulunmanın keyfini çıkarın. Bu sezonki gelirlerimizin bir kısmını ${['TEMA Vakfı', 'Ahbap Derneği', 'LÖSEV'][index % 3]}'na bağışlıyoruz.`,
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
        name: 'hangel Derneği',
        shortName: 'hangel',
        foundationYear: 2020,
        category: 'Sosyal İnovasyon',
        type: 'Dernek',
        avatarUrl: '',
        coverPhotoUrl: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=2070&auto=format&fit=crop',
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
    { id: '1', title: 'Afet Bölgesi Lojistik Destek', organization: 'Ahbap Derneği', ngoId: '2', location: { city: 'Hatay', district: 'Antakya', type: 'Saha' }, commitment: 'Dönemsel', volunteerCount: { needed: 50, applications: 120 }, dates: { applicationStart: '2025-05-01', applicationEnd: '2026-05-21', eventStart: '2025-06-01', eventEnd: '2025-06-30' }, hours: { start: '09:00', end: '18:00', total: 56 }, socialArea: 'Afet', points: 1500, ngoTransparencyScore: 95, taskType: 'Dönemsel', providesCertificate: true, earnedBadges: ['Afet Kahramanı'], hasPreTraining: true, description: 'Bölgedeki yardım kolilerinin tasnifi ve dağıtımında görev alacak gönüllüler arıyoruz.', amenities: { transport: true, food: true, accommodation: true } },
    { id: '2', title: 'Fidan Dikme Etkinliği', organization: 'TEMA Vakfı', ngoId: '1', location: { city: 'İstanbul', district: 'Beykoz', type: 'Saha' }, commitment: 'Tek Günlük', volunteerCount: { needed: 100, applications: 250 }, dates: { applicationStart: '2025-05-01', applicationEnd: '2026-05-21', eventStart: '2025-06-01', eventEnd: '2025-06-01' }, hours: { start: '10:00', end: '16:00', total: 6 }, socialArea: 'Çevre', points: 500, ngoTransparencyScore: 92, taskType: 'Tek Gün', providesCertificate: true, earnedBadges: ['Doğa Koruyucu'], hasPreTraining: false, description: 'Geleceğe nefes olmak için binlerce fidanı toprakla buluşturuyoruz.', amenities: { transport: false, food: true, accommodation: false } },
    { id: '3', title: 'Sosyal Medya İçerik Gönüllüsü', organization: 'LÖSEV', ngoId: '3', location: { city: 'Online', district: 'Online', type: 'Online' }, commitment: 'Sürekli', volunteerCount: { needed: 5, applications: 45 }, dates: { applicationStart: '2025-05-01', applicationEnd: '2026-05-21', eventStart: '2025-06-01', eventEnd: '2026-06-01' }, hours: { start: '09:00', end: '18:00', total: 240 }, socialArea: 'Sağlık', points: 2000, ngoTransparencyScore: 90, taskType: 'Sürekli', providesCertificate: true, earnedBadges: [], hasPreTraining: true, description: 'LÖSEV\'in sosyal medya hesapları için yaratıcı ve etkili içerikler üretecek gönüllüler arıyoruz.', amenities: { transport: false, food: false, accommodation: false }, skills: ['Sosyal Medya Yönetimi', 'Grafik Tasarım'] },
    { id: '4', title: 'Sokak Hayvanları İçin Kış Hazırlığı', organization: 'HAYTAP', ngoId: '4', location: { city: 'Bursa', district: 'Nilüfer', type: 'Saha' }, commitment: 'Haftalık', volunteerCount: { needed: 20, applications: 15 }, dates: { applicationStart: '2025-05-01', applicationEnd: '2026-05-21', eventStart: '2025-06-01', eventEnd: '2025-06-30' }, hours: { start: '10:00', end: '17:00', total: 28 }, socialArea: 'Hayvan Hakları', points: 800, ngoTransparencyScore: 88, taskType: 'Dönemsel', providesCertificate: true, earnedBadges: ['Hayvan Dostu'], hasPreTraining: false, description: 'Sokaktaki canlarımız için kulübe yapımı ve mama dağıtımı.', amenities: { transport: true, food: true, accommodation: false } },
    { id: '5', title: 'Üniversite Sosyal Etki Temsilcisi', organization: 'hangel Derneği', ngoId: '8', location: { city: 'Online', district: 'Türkiye Geneli', type: 'Online' }, commitment: 'Sürekli', volunteerCount: { needed: 25, applications: 0 }, dates: { applicationStart: '2025-05-01', applicationEnd: '2026-05-21', eventStart: '2025-06-01', eventEnd: '2026-06-01' }, hours: { start: '10:00', end: '18:00', total: 0 }, socialArea: 'Sosyal Girişimcilik', points: 5000, ngoTransparencyScore: 98, taskType: 'Sürekli', providesCertificate: true, earnedBadges: ['Liderlik Rozeti', 'Topluluk Yöneticisi'], hasPreTraining: true, description: 'Kampüsünüzde sosyal etki rüzgarı estirin! hangel\'in üniversite temsilcisi olarak etkinlikler düzenleyin, sosyal sorumluluk projeleri geliştirin ve kendi topluluğunuzun değişim lideri olun.', amenities: { transport: false, food: false, accommodation: false }, skills: ['Proje Yönetimi', 'Organizasyon', 'İletişim'], education: 'Üniversite' },
    { id: '6', title: 'Yaşlılara Kitap Okuma', organization: 'İHD', ngoId: '6', location: { city: 'Ankara', district: 'Çankaya', type: 'Saha' }, commitment: 'Haftalık', volunteerCount: { needed: 15, applications: 22 }, dates: { applicationStart: '2025-05-01', applicationEnd: '2026-05-21', eventStart: '2025-06-01', eventEnd: '2025-06-30' }, hours: { start: '14:00', end: '16:00', total: 24 }, socialArea: 'Yaşlılar', points: 750, ngoTransparencyScore: 85, taskType: 'Dönemsel', providesCertificate: true, earnedBadges: ['İyilik Elçisi'], hasPreTraining: true, description: 'Huzurevi ziyaretleri kapsamında yaşlılarımıza kitap okuyacak, onlarla sohbet edecek gönüllüler arıyoruz.', amenities: { transport: false, food: false, accommodation: false }, languages: ['Türkçe'] },
    { id: '7', title: 'Web Sitesi Yenileme (React)', organization: 'Türkiye Eğitim Gönüllüleri Vakfı', ngoId: '5', location: { city: 'Online', district: 'Online', type: 'Online' }, commitment: 'Proje Bazlı', volunteerCount: { needed: 2, applications: 18 }, dates: { applicationStart: '2025-05-01', applicationEnd: '2026-05-21', eventStart: '2025-06-01', eventEnd: '2025-06-15' }, hours: { start: '09:00', end: '18:00', total: 120 }, socialArea: 'Eğitim', points: 3500, ngoTransparencyScore: 94, taskType: 'Sürekli', providesCertificate: true, earnedBadges: ['Teknoloji Destekçisi'], hasPreTraining: false, description: 'TEGV\'in web sitesini modern standartlarda yenileyecek deneyimli React geliştiricileri arıyoruz.', amenities: { transport: false, food: false, accommodation: false }, skills: ['Web Geliştirme', 'React'] },
    { id: '8', title: 'Mülteci Çocuklara Türkçe Ders Desteği', organization: 'İnsan Hakları Derneği', ngoId: '6', location: { city: 'Gaziantep', district: 'Şahinbey', type: 'Saha' }, commitment: 'Dönemsel', volunteerCount: { needed: 30, applications: 10 }, dates: { applicationStart: '2025-05-01', applicationEnd: '2026-05-21', eventStart: '2025-06-01', eventEnd: '2025-06-30' }, hours: { start: '10:00', end: '13:00', total: 108 }, socialArea: 'Mülteciler', points: 2500, ngoTransparencyScore: 85, taskType: 'Dönemsel', providesCertificate: true, earnedBadges: ['Eğitim Gönüllüsü'], hasPreTraining: true, description: 'Suriyeli mülteci çocukların eğitim hayatına entegrasyonu için temel Türkçe dersleri verecek gönüllüler.', amenities: { transport: true, food: false, accommodation: false }, languages: ['Türkçe', 'Arapça'] },
    { id: '9', title: 'Kadın Kooperatifi Ürün Fotoğraflama', organization: 'Kadın Emeğini Değerlendirme Vakfı', ngoId: '7', location: { city: 'İzmir', district: 'Konak', type: 'Saha' }, commitment: 'Tek Günlük', volunteerCount: { needed: 3, applications: 8 }, dates: { applicationStart: '2025-05-01', applicationEnd: '2026-05-21', eventStart: '2025-06-01', eventEnd: '2025-06-01' }, hours: { start: '10:00', end: '17:00', total: 7 }, socialArea: 'Kadın Hakları', points: 600, ngoTransparencyScore: 91, taskType: 'Tek Gün', providesCertificate: false, earnedBadges: [], hasPreTraining: false, description: 'Kadınların el emeği ürünlerinin e-ticaret sitelerinde sergilenmesi için profesyonel ürün fotoğrafları çekecek gönüllüler arıyoruz.', amenities: { transport: false, food: true, accommodation: false }, skills: ['Fotoğrafçılık'] },
    { id: '10', title: 'İngilizce Çeviri Desteği', organization: 'TEMA Vakfı', ngoId: '1', location: { city: 'Online', district: 'Online', type: 'Online' }, commitment: 'Proje Bazlı', volunteerCount: { needed: 10, applications: 33 }, dates: { applicationStart: '2025-05-01', applicationEnd: '2026-05-21', eventStart: '2025-06-01', eventEnd: '2025-06-15' }, hours: { start: '09:00', end: '18:00', total: 40 }, socialArea: 'Çevre', points: 1200, ngoTransparencyScore: 92, taskType: 'Dönemsel', providesCertificate: false, earnedBadges: [], hasPreTraining: false, description: 'Çevre raporlarımızın ve web sitesi içeriklerimizin İngilizce\'ye çevrilmesi için ileri düzeyde dil bilen gönüllüler.', amenities: { transport: false, food: false, accommodation: false }, languages: ['İngilizce', 'Türkçe'] },
    { id: '11', title: 'LÖSEV İçin Kermes Organizasyonu', organization: 'LÖSEV', ngoId: '3', location: { city: 'İstanbul', district: 'Beşiktaş', type: 'Saha' }, commitment: 'Tek Günlük', volunteerCount: { needed: 20, applications: 50 }, dates: { applicationStart: '2025-05-01', applicationEnd: '2026-05-21', eventStart: '2025-06-01', eventEnd: '2025-06-01' }, hours: { start: '09:00', end: '19:00', total: 10 }, socialArea: 'Sağlık', points: 700, ngoTransparencyScore: 90, taskType: 'Tek Gün', providesCertificate: true, earnedBadges: [], hasPreTraining: false, description: 'Lösemili çocuklar yararına düzenlenecek kermeste stantlarda görev alacak, satış ve tanıtım yapacak enerjik gönüllüler.', amenities: { transport: false, food: true, accommodation: false }, skills: ['İletişim'] },
    { id: '12', title: 'Engelsiz Yaşam Festivali Destek Ekibi', organization: 'Türkiye Omurilik Felçlileri Derneği', ngoId: '8', location: { city: 'İstanbul', district: 'Bakırköy', type: 'Saha' }, commitment: 'Tek Günlük', volunteerCount: { needed: 40, applications: 65 }, dates: { applicationStart: '2025-05-01', applicationEnd: '2026-05-21', eventStart: '2025-06-01', eventEnd: '2025-06-01' }, hours: { start: '08:00', end: '20:00', total: 12 }, socialArea: 'Engelliler', points: 900, ngoTransparencyScore: 89, taskType: 'Tek Gün', providesCertificate: true, earnedBadges: ['Erişilebilirlik Elçisi'], hasPreTraining: true, description: 'Engelli bireylerin sosyal yaşama katılımını artırmayı hedefleyen festivalimizde alan yönetimi, yönlendirme ve etkinlik desteği sağlayacak gönüllüler.', amenities: { transport: true, food: true, accommodation: false }, skills: ['İletişim'], requirements: ['İlk Yardım Sertifikası'] },
    { id: '13', title: 'Hukuki Danışmanlık (Pro Bono)', organization: 'İnsan Hakları Derneği', ngoId: '6', location: { city: 'Online', district: 'Online', type: 'Online' }, commitment: 'Sürekli', volunteerCount: { needed: 4, applications: 12 }, dates: { applicationStart: '2025-05-01', applicationEnd: '2026-05-21', eventStart: '2025-06-01', eventEnd: '2026-06-01' }, hours: { start: '09:00', end: '18:00', total: 100 }, socialArea: 'İnsan Hakları', points: 4000, ngoTransparencyScore: 85, taskType: 'Sürekli', providesCertificate: false, earnedBadges: ['Adalet Savaşçısı'], hasPreTraining: false, description: 'Hak ihlaline uğramış kişilere ücretsiz hukuki danışmanlık verecek avukat gönüllüler arıyoruz.', amenities: { transport: false, food: false, accommodation: false }, skills: ['Hukuki Danışmanlık'] },
    { id: '14', title: 'Tarihi Eser Restorasyonu', organization: 'Kültür Sanat Vakfı', ngoId: '7', location: { city: 'Mardin', district: 'Merkez', type: 'Saha' }, commitment: 'Dönemsel', volunteerCount: { needed: 10, applications: 8 }, dates: { applicationStart: '2025-05-01', applicationEnd: '2026-05-21', eventStart: '2025-06-01', eventEnd: '2025-06-30' }, hours: { start: '09:00', end: '17:00', total: 160 }, socialArea: 'Kültür & Sanat', points: 2800, ngoTransparencyScore: 91, taskType: 'Dönemsel', providesCertificate: true, earnedBadges: [], hasPreTraining: true, description: 'Mardin\'deki tarihi bir yapının restorasyon çalışmalarında arkeolog ve mimarlara yardımcı olacak gönüllüler.', amenities: { transport: true, food: true, accommodation: true }, skills: ['El Becerileri'] },
    { id: '15', title: 'Mobil Uygulama Test Gönüllüsü', organization: 'hangel Derneği', ngoId: '8', location: { city: 'Online', district: 'Online', type: 'Online' }, commitment: 'Proje Bazlı', volunteerCount: { needed: 50, applications: 150 }, dates: { applicationStart: '2025-05-01', applicationEnd: '2026-05-21', eventStart: '2025-06-01', eventEnd: '2025-06-15' }, hours: { start: '09:00', end: '18:00', total: 10 }, socialArea: 'Teknoloji', points: 300, ngoTransparencyScore: 98, taskType: 'Dönemsel', providesCertificate: false, earnedBadges: [], hasPreTraining: false, description: 'hangel uygulamasının yeni versiyonunu ilk deneyenlerden olun, hataları raporlayarak daha iyi bir deneyim sunmamıza yardımcı olun.', amenities: { transport: false, food: false, accommodation: false } },
    { id: '16', title: 'Köy Okulu Boyama Şenliği', organization: 'TEGV', ngoId: '5', location: { city: 'Van', district: 'Erciş', type: 'Saha' }, commitment: 'Tek Günlük', volunteerCount: { needed: 30, applications: 45 }, dates: { applicationStart: '2025-05-01', applicationEnd: '2026-05-21', eventStart: '2025-06-01', eventEnd: '2025-06-01' }, hours: { start: '09:00', end: '18:00', total: 16 }, socialArea: 'Eğitim', points: 850, ngoTransparencyScore: 94, taskType: 'Dönemsel', providesCertificate: true, earnedBadges: [], hasPreTraining: false, description: 'Köy okulumuzun duvarlarını renklendirerek çocuklar için daha neşeli bir öğrenme ortamı yaratacağız.', amenities: { transport: true, food: true, accommodation: true } },
    { id: '17', title: 'İkinci El Giysi Ayırma ve Paketleme', organization: 'Ahbap Derneği', ngoId: '2', location: { city: 'İstanbul', district: 'Ataşehir', type: 'Saha' }, commitment: 'Haftalık', volunteerCount: { needed: 25, applications: 60 }, dates: { applicationStart: '2025-05-01', applicationEnd: '2026-05-21', eventStart: '2025-06-01', eventEnd: '2025-06-30' }, hours: { start: '10:00', end: '16:00', total: 72 }, socialArea: 'Yoksullukla Mücadele', points: 1100, ngoTransparencyScore: 95, taskType: 'Dönemsel', providesCertificate: false, earnedBadges: [], hasPreTraining: false, description: 'Bağışlanan ikinci el kıyafetlerin ayrıştırılması, temizlenmesi ve ihtiyaç sahiplerine ulaştırılmak üzere paketlenmesi.', amenities: { transport: false, food: true, accommodation: false } },
    { id: '18', title: 'Sahipsiz Hayvanlar İçin Mama Bağışı Kampanyası', organization: 'HAYTAP', ngoId: '4', location: { city: 'İzmir', district: 'Karşıyaka', type: 'Saha' }, commitment: 'Tek Günlük', volunteerCount: { needed: 50, applications: 80 }, dates: { applicationStart: '2025-05-01', applicationEnd: '2026-05-21', eventStart: '2025-06-01', eventEnd: '2025-06-01' }, hours: { start: '11:00', end: '19:00', total: 8 }, socialArea: 'Hayvan Hakları', points: 650, ngoTransparencyScore: 88, taskType: 'Tek Gün', providesCertificate: true, earnedBadges: ['Hayvan Dostu'], hasPreTraining: false, description: 'Belirlenen noktalarda stant kurarak mama bağışı toplanmasına ve farkındalık yaratılmasına destek olacak gönüllüler.', amenities: { transport: false, food: false, accommodation: false }, skills: ['İletişim'] },
    { id: '19', title: 'Lösemili Çocuklara Moral Ziyareti', organization: 'LÖSEV', ngoId: '3', location: { city: 'Ankara', district: 'Çankaya', type: 'Saha' }, commitment: 'Haftalık', volunteerCount: { needed: 10, applications: 25 }, dates: { applicationStart: '2025-05-01', applicationEnd: '2026-05-21', eventStart: '2025-06-01', eventEnd: '2025-06-30' }, hours: { start: '13:00', end: '15:00', total: 24 }, socialArea: 'Sağlık', points: 950, ngoTransparencyScore: 90, taskType: 'Dönemsel', providesCertificate: true, earnedBadges: [], hasPreTraining: true, description: 'LÖSEV\'in hastanesinde tedavi gören çocuklarla oyunlar oynayacak, onlara moral verecek pedagojik formasyon sahibi gönüllüler.', amenities: { transport: false, food: false, accommodation: false }, requirements: ['Pedagojik Formasyon'] },
    { id: '20', title: 'Plastiksiz Temmuz Farkındalık Kampanyası', organization: 'TEMA Vakfı', ngoId: '1', location: { city: 'Online', district: 'Online', type: 'Online' }, commitment: 'Proje Bazlı', volunteerCount: { needed: 15, applications: 40 }, dates: { applicationStart: '2025-05-01', applicationEnd: '2026-05-21', eventStart: '2025-06-01', eventEnd: '2025-06-15' }, hours: { start: '09:00', end: '18:00', total: 30 }, socialArea: 'Çevre', points: 1000, ngoTransparencyScore: 92, taskType: 'Dönemsel', providesCertificate: false, earnedBadges: [], hasPreTraining: false, description: 'Sosyal medyada tek kullanımlık plastiklerin zararları hakkında içerikler üretecek, kampanya yürütecek gönüllüler.', amenities: { transport: false, food: false, accommodation: false }, skills: ['Sosyal Medya Yönetimi', 'İçerik Üretimi'] },
    { id: '21', title: 'Adalete Erişim Projesi', organization: 'İnsan Hakları Derneği', ngoId: '6', location: { city: 'Diyarbakır', district: 'Sur', type: 'Saha' }, commitment: 'Dönemsel', volunteerCount: { needed: 5, applications: 3 }, dates: { applicationStart: '2025-05-01', applicationEnd: '2026-05-21', eventStart: '2025-06-01', eventEnd: '2025-06-30' }, hours: { start: '10:00', end: '16:00', total: 90 }, socialArea: 'İnsan Hakları', points: 2200, ngoTransparencyScore: 85, taskType: 'Dönemsel', providesCertificate: true, earnedBadges: ['Adalet Savaşçısı'], hasPreTraining: true, description: 'Dezavantajlı grupların hukuki süreçler hakkında bilgilendirilmesi ve adli yardım mekanizmalarına yönlendirilmesi.', amenities: { transport: true, food: true, accommodation: false }, skills: ['Hukuki Danışmanlık'] }
];

export const badges: Badge[] = [
    { id: '1', name: 'Çevre Koruyucusu', iconName: Leaf, level: 'Bronz', socialArea: 'Çevre', pointsRequired: 500, currentPoints: 800 },
    { id: '2', name: 'Çevre Koruyucusu', iconName: Leaf, level: 'Gümüş', socialArea: 'Çevre', pointsRequired: 1000, currentPoints: 800 },
    { id: '3', name: 'Çevre Koruyucusu', iconName: Leaf, level: 'Altın', socialArea: 'Çevre', pointsRequired: 2500, currentPoints: 800 },
    { id: '4', name: 'Çevre Koruyucusu', iconName: Leaf, level: 'Platin', socialArea: 'Çevre', pointsRequired: 5000, currentPoints: 800 },
    { id: '5', name: 'Çevre Koruyucusu', iconName: Leaf, level: 'Elmas', socialArea: 'Çevre', pointsRequired: 10000, currentPoints: 800 },
    { id: '6', name: 'Hayvan Dostu', iconName: Heart, level: 'Bronz', socialArea: 'Hayvan', pointsRequired: 500, currentPoints: 550 },
    { id: '7', name: 'Hayvan Dostu', iconName: Heart, level: 'Gümüş', socialArea: 'Hayvan', pointsRequired: 1000, currentPoints: 550 },
    { id: '8', name: 'Hayvan Dostu', iconName: Heart, level: 'Altın', socialArea: 'Hayvan', pointsRequired: 2500, currentPoints: 550 },
    { id: '9', name: 'Hayvan Dostu', iconName: Heart, level: 'Platin', socialArea: 'Hayvan', pointsRequired: 5000, currentPoints: 550 },
    { id: '10', name: 'Hayvan Dostu', iconName: Heart, level: 'Elmas', socialArea: 'Hayvan', pointsRequired: 10000, currentPoints: 550 },
    { id: '11', name: 'Çocuk Dostu', iconName: Baby, level: 'Bronz', socialArea: 'Çocuk', pointsRequired: 500, currentPoints: 260 },
    { id: '12', name: 'Çocuk Dostu', iconName: Baby, level: 'Gümüş', socialArea: 'Çocuk', pointsRequired: 1000, currentPoints: 260 },
    { id: '13', name: 'Çocuk Dostu', iconName: Baby, level: 'Altın', socialArea: 'Çocuk', pointsRequired: 2500, currentPoints: 260 },
    { id: '14', name: 'Çocuk Dostu', iconName: Baby, level: 'Platin', socialArea: 'Çocuk', pointsRequired: 5000, currentPoints: 260 },
    { id: '15', name: 'Çocuk Dostu', iconName: Baby, level: 'Elmas', socialArea: 'Çocuk', pointsRequired: 10000, currentPoints: 260 },
    { id: '16', name: 'Gıda Güvenliği', iconName: Utensils, level: 'Bronz', socialArea: 'Gıda', pointsRequired: 500, currentPoints: 50 },
    { id: '17', name: 'Gıda Güvenliği', iconName: Utensils, level: 'Gümüş', socialArea: 'Gıda', pointsRequired: 1000, currentPoints: 50 },
    { id: '18', name: 'Gıda Güvenliği', iconName: Utensils, level: 'Altın', socialArea: 'Gıda', pointsRequired: 2500, currentPoints: 50 },
    { id: '19', name: 'Gıda Güvenliği', iconName: Utensils, level: 'Platin', socialArea: 'Gıda', pointsRequired: 5000, currentPoints: 50 },
    { id: '20', name: 'Gıda Güvenliği', iconName: Utensils, level: 'Elmas', socialArea: 'Gıda', pointsRequired: 10000, currentPoints: 50 },
    { id: '21', name: 'Afet Gönüllüsü', iconName: Siren, level: 'Bronz', socialArea: 'Afet', pointsRequired: 500, currentPoints: 300 },
    { id: '22', name: 'Afet Gönüllüsü', iconName: Siren, level: 'Gümüş', socialArea: 'Afet', pointsRequired: 1000, currentPoints: 300 },
    { id: '23', name: 'Afet Gönüllüsü', iconName: Siren, level: 'Altın', socialArea: 'Afet', pointsRequired: 2500, currentPoints: 300 },
    { id: '24', name: 'Afet Gönüllüsü', iconName: Siren, level: 'Platin', socialArea: 'Afet', pointsRequired: 5000, currentPoints: 300 },
    { id: '25', name: 'Afet Gönüllüsü', iconName: Siren, level: 'Elmas', socialArea: 'Afet', pointsRequired: 10000, currentPoints: 300 },
    { id: '26', name: 'Eşitlik Savunucusu', iconName: Scale, level: 'Bronz', socialArea: 'Eşitlik', pointsRequired: 500, currentPoints: 0 },
    { id: '27', name: 'Eşitlik Savunucusu', iconName: Scale, level: 'Gümüş', socialArea: 'Eşitlik', pointsRequired: 1000, currentPoints: 0 },
    { id: '28', name: 'Eşitlik Savunucusu', iconName: Scale, level: 'Altın', socialArea: 'Eşitlik', pointsRequired: 2500, currentPoints: 0 },
    { id: '29', name: 'Eşitlik Savunucusu', iconName: Scale, level: 'Platin', socialArea: 'Eşitlik', pointsRequired: 5000, currentPoints: 0 },
    { id: '30', name: 'Eşitlik Savunucusu', iconName: Scale, level: 'Elmas', socialArea: 'Eşitlik', pointsRequired: 10000, currentPoints: 0 },
    { id: '31', name: 'İnovasyon Lideri', iconName: Lightbulb, level: 'Bronz', socialArea: 'İnovasyon', pointsRequired: 500, currentPoints: 120 },
    { id: '32', name: 'İnovasyon Lideri', iconName: Lightbulb, level: 'Gümüş', socialArea: 'İnovasyon', pointsRequired: 1000, currentPoints: 120 },
    { id: '33', name: 'İnovasyon Lideri', iconName: Lightbulb, level: 'Altın', socialArea: 'İnovasyon', pointsRequired: 2500, currentPoints: 120 },
    { id: '34', name: 'İnovasyon Lideri', iconName: Lightbulb, level: 'Platin', socialArea: 'İnovasyon', pointsRequired: 5000, currentPoints: 120 },
    { id: '35', name: 'İnovasyon Lideri', iconName: Lightbulb, level: 'Elmas', socialArea: 'İnovasyon', pointsRequired: 10000, currentPoints: 120 },
    { id: '36', name: 'İş Dünyası Destekçisi', iconName: Briefcase, level: 'Bronz', socialArea: 'İş Dünyası', pointsRequired: 500, currentPoints: 0 },
    { id: '37', name: 'İş Dünyası Destekçisi', iconName: Briefcase, level: 'Gümüş', socialArea: 'İş Dünyası', pointsRequired: 1000, currentPoints: 0 },
    { id: '38', name: 'İş Dünyası Destekçisi', iconName: Briefcase, level: 'Altın', socialArea: 'İş Dünyası', pointsRequired: 2500, currentPoints: 0 },
    { id: '39', name: 'İş Dünyası Destekçisi', iconName: Briefcase, level: 'Platin', socialArea: 'İş Dünyası', pointsRequired: 5000, currentPoints: 0 },
    { id: '40', name: 'İş Dünyası Destekçisi', iconName: Briefcase, level: 'Elmas', socialArea: 'İş Dünyası', pointsRequired: 10000, currentPoints: 0 },
    { id: '41', name: 'Bilim Destekçisi', iconName: FlaskConical, level: 'Bronz', socialArea: 'Bilim', pointsRequired: 500, currentPoints: 0 },
    { id: '42', name: 'Bilim Destekçisi', iconName: FlaskConical, level: 'Gümüş', socialArea: 'Bilim', pointsRequired: 1000, currentPoints: 0 },
    { id: '43', name: 'Bilim Destekçisi', iconName: FlaskConical, level: 'Altın', socialArea: 'Bilim', pointsRequired: 2500, currentPoints: 0 },
    { id: '44', name: 'Bilim Destekçisi', iconName: FlaskConical, level: 'Platin', socialArea: 'Bilim', pointsRequired: 5000, currentPoints: 0 },
    { id: '45', name: 'Bilim Destekçisi', iconName: FlaskConical, level: 'Elmas', socialArea: 'Bilim', pointsRequired: 10000, currentPoints: 0 },
    { id: '46', name: 'Engelsiz Yaşam', iconName: Accessibility, level: 'Bronz', socialArea: 'Engelli', pointsRequired: 500, currentPoints: 400 },
    { id: '47', name: 'Engelsiz Yaşam', iconName: Accessibility, level: 'Gümüş', socialArea: 'Engelli', pointsRequired: 1000, currentPoints: 400 },
    { id: '48', name: 'Engelsiz Yaşam', iconName: Accessibility, level: 'Altın', socialArea: 'Engelli', pointsRequired: 2500, currentPoints: 400 },
    { id: '49', name: 'Engelsiz Yaşam', iconName: Accessibility, level: 'Platin', socialArea: 'Engelli', pointsRequired: 5000, currentPoints: 400 },
    { id: '50', name: 'Engelsiz Yaşam', iconName: Accessibility, level: 'Elmas', socialArea: 'Engelli', pointsRequired: 10000, currentPoints: 400 },
    { id: '51', name: 'Yaşlı Dostu', iconName: PersonStanding, level: 'Bronz', socialArea: 'Yaşlılık', pointsRequired: 500, currentPoints: 0 },
    { id: '52', name: 'Yaşlı Dostu', iconName: PersonStanding, level: 'Gümüş', socialArea: 'Yaşlılık', pointsRequired: 1000, currentPoints: 0 },
    { id: '53', name: 'Yaşlı Dostu', iconName: PersonStanding, level: 'Altın', socialArea: 'Yaşlılık', pointsRequired: 2500, currentPoints: 0 },
    { id: '54', name: 'Yaşlı Dostu', iconName: PersonStanding, level: 'Platin', socialArea: 'Yaşlılık', pointsRequired: 5000, currentPoints: 0 },
    { id: '55', name: 'Yaşlı Dostu', iconName: PersonStanding, level: 'Elmas', socialArea: 'Yaşlılık', pointsRequired: 10000, currentPoints: 0 },
    { id: '56', name: 'Sanat Destekçisi', iconName: Palette, level: 'Bronz', socialArea: 'Sanat', pointsRequired: 500, currentPoints: 0 },
    { id: '57', name: 'Sanat Destekçisi', iconName: Palette, level: 'Gümüş', socialArea: 'Sanat', pointsRequired: 1000, currentPoints: 0 },
    { id: '58', name: 'Sanat Destekçisi', iconName: Palette, level: 'Altın', socialArea: 'Sanat', pointsRequired: 2500, currentPoints: 0 },
    { id: '59', name: 'Sanat Destekçisi', iconName: Palette, level: 'Platin', socialArea: 'Sanat', pointsRequired: 5000, currentPoints: 0 },
    { id: '60', name: 'Sanat Destekçisi', iconName: Palette, level: 'Elmas', socialArea: 'Sanat', pointsRequired: 10000, currentPoints: 0 },
    { id: '61', name: 'Tarım Gönüllüsü', iconName: Sprout, level: 'Bronz', socialArea: 'Tarım', pointsRequired: 500, currentPoints: 0 },
    { id: '62', name: 'Tarım Gönüllüsü', iconName: Sprout, level: 'Gümüş', socialArea: 'Tarım', pointsRequired: 1000, currentPoints: 0 },
    { id: '63', name: 'Tarım Gönüllüsü', iconName: Sprout, level: 'Altın', socialArea: 'Tarım', pointsRequired: 2500, currentPoints: 0 },
    { id: '64', name: 'Tarım Gönüllüsü', iconName: Sprout, level: 'Platin', socialArea: 'Tarım', pointsRequired: 5000, currentPoints: 0 },
    { id: '65', name: 'Tarım Gönüllüsü', iconName: Sprout, level: 'Elmas', socialArea: 'Tarım', pointsRequired: 10000, currentPoints: 0 },
    { id: '66', name: 'Eğitim Gönüllüsü', iconName: Award, level: 'Bronz', socialArea: 'Eğitim', pointsRequired: 500, currentPoints: 250 },
    { id: '67', name: 'Eğitim Gönüllüsü', iconName: Award, level: 'Gümüş', socialArea: 'Eğitim', pointsRequired: 1000, currentPoints: 250 },
    { id: '68', name: 'Eğitim Gönüllüsü', iconName: Award, level: 'Altın', socialArea: 'Eğitim', pointsRequired: 2500, currentPoints: 250 },
    { id: '69', name: 'Eğitim Gönüllüsü', iconName: Award, level: 'Platin', socialArea: 'Eğitim', pointsRequired: 5000, currentPoints: 250 },
    { id: '70', name: 'Eğitim Gönüllüsü', iconName: Award, level: 'Elmas', socialArea: 'Eğitim', pointsRequired: 10000, currentPoints: 250 },
    { id: '71', name: 'Sağlık Gönüllüsü', iconName: HeartPulse, level: 'Bronz', socialArea: 'Sağlık', pointsRequired: 500, currentPoints: 0 },
    { id: '72', name: 'Sağlık Gönüllüsü', iconName: HeartPulse, level: 'Gümüş', socialArea: 'Sağlık', pointsRequired: 1000, currentPoints: 0 },
    { id: '73', name: 'Sağlık Gönüllüsü', iconName: HeartPulse, level: 'Altın', socialArea: 'Sağlık', pointsRequired: 2500, currentPoints: 0 },
    { id: '74', name: 'Sağlık Gönüllüsü', iconName: HeartPulse, level: 'Platin', socialArea: 'Sağlık', pointsRequired: 5000, currentPoints: 0 },
    { id: '75', name: 'Sağlık Gönüllüsü', iconName: HeartPulse, level: 'Elmas', socialArea: 'Sağlık', pointsRequired: 10000, currentPoints: 0 },
    { id: '76', name: 'Hoşgörü Elçisi', iconName: Handshake, level: 'Bronz', socialArea: 'İnanç', pointsRequired: 500, currentPoints: 0 },
    { id: '77', name: 'Hoşgörü Elçisi', iconName: Handshake, level: 'Gümüş', socialArea: 'İnanç', pointsRequired: 1000, currentPoints: 0 },
    { id: '78', name: 'Hoşgörü Elçisi', iconName: Handshake, level: 'Altın', socialArea: 'İnanç', pointsRequired: 2500, currentPoints: 0 },
    { id: '79', name: 'Hoşgörü Elçisi', iconName: Handshake, level: 'Platin', socialArea: 'İnanç', pointsRequired: 5000, currentPoints: 0 },
    { id: '80', name: 'Hoşgörü Elçisi', iconName: Handshake, level: 'Elmas', socialArea: 'İnanç', pointsRequired: 10000, currentPoints: 0 },
];
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
    { name: 'Ahbap Derneği', type: 'STK', icon: 'heart', href: '/ngo-admin/dashboard', status: 'approved', logoUrl: 'https://logo.clearbit.com/ahbap.org' }
];

export const qrPaymentCardData = [
    { id: 'bireysel', type: 'Bireysel', number: '5549601000001234', owner: 'İsmail Hilmi ADIGÜZEL', expiry: '12/28', balance: '1.250,75 ₺', ngoId: '1', cvv: '123', bgColor: 'bg-gradient-to-tr from-gray-900 to-gray-700' },
    { id: 'ticari', type: 'Ticari', number: '5549601000005678', owner: 'hangel A.Ş.', expiry: '10/27', balance: '15.450,00 ₺', ngoId: '2', cvv: '456', bgColor: 'bg-gradient-to-tr from-blue-900 to-blue-600' },
    { id: 'ogrenci', type: 'Öğrenci', number: '5549601000009012', owner: 'İsmail Hilmi ADIGÜZEL', expiry: '08/29', balance: '250,00 ₺', ngoId: '3', cvv: '789', bgColor: 'bg-gradient-to-tr from-rose-900 to-rose-600' }
];

export const allUniversities = ["Abdullah Gül Üniversitesi", "Acıbadem Mehmet Ali Aydınlar Üniversitesi", "Adana Alparslan Türkeş Bilim ve Teknoloji Üniversitesi", "Adıyaman Üniversitesi", "Afyon Kocatepe Üniversitesi", "Afyonkarahisar Sağlık Bilimleri Üniversitesi", "Ağrı İbrahim Çeçen Üniversitesi", "Akdeniz Üniversitesi", "Aksaray Üniversitesi", "Alanya Alaaddin Keykubat Üniversitesi", "Alanya Üniversitesi", "Altınbaş Üniversitesi", "Amasya Üniversitesi", "Anadolu Üniversitesi", "Ankara Bilim Üniversitesi", "Ankara Hacı Bayram Veli Üniversitesi", "Ankara Medipol Üniversitesi", "Ankara Müzik ve Güzel Sanatlar Üniversitesi", "Ankara Sosyal Bilimler Üniversitesi", "Ankara Üniversitesi", "Ankara Yıldırım Beyazıt Üniversitesi", "Antalya Belek Üniversitesi", "Antalya Bilim Üniversitesi", "Ardahan Üniversitesi", "Artvin Çoruh Üniversitesi", "Ataşehir Adıgüzel Meslek Yüksekokulu", "Atatürk Üniversitesi", "Atılım Üniversitesi", "Avrasya Üniversitesi", "Aydın Adnan Menderes Üniversitesi", "Bahçeşehir Üniversitesi", "Balıkesir Üniversitesi", "Bandırma Onyedi Eylül Üniversitesi", "Bartın Üniversitesi", "Başkent Üniversitesi", "Batman Üniversitesi", "Bayburt Üniversitesi", "Beykoz Üniversitesi", "Bezm-i Âlem Vakıf Üniversitesi", "Bilecik Şeyh Edebali Üniversitesi", "Bingöl Üniversitesi", "Biruni Üniversitesi", "Bitlis Eren Üniversitesi", "Boğaziçi Üniversitesi", "Bolu Abant İzzet Baysal Üniversitesi", "Burdur Mehmet Akif Ersoy Üniversitesi", "Bursa Teknik Üniversitesi", "Bursa Uludağ Üniversitesi", "Çağ Üniversitesi", "Çanakkale Onsekiz Mart Üniversitesi", "Çankaya Üniversitesi", "Çankırı Karatekin Üniversitesi", "Çukurova Üniversitesi", "Demiroğlu Bilim Üniversitesi", "Dicle Üniversitesi", "Doğuş Üniversitesi", "Dokuz Eylül Üniversitesi", "Düzce Üniversitesi", "Ege Üniversitesi", "Erciyes Üniversitesi", "Erzincan Binali Yıldırım Üniversitesi", "Erzurum Teknik Üniversitesi", "Eskişehir Osmangazi Üniversitesi", "Eskişehir Teknik Üniversitesi", "Fatih Sultan Mehmet Vakıf Üniversitesi", "Fenerbahçe Üniversitesi", "Fırat Üniversitesi", "Galatasaray Üniversitesi", "Gazi Üniversitesi", "Gaziantep İslam Bilim ve Teknoloji Üniversitesi", "Gaziantep Üniversitesi", "Gebze Teknik Üniversitesi", "Giresun Üniversitesi", "Gümüşhane Üniversitesi", "Hacettepe Üniversitesi", "Hakkari Üniversitesi", "Haliç Üniversitesi", "Harran Üniversitesi", "Hasan Kalyoncu Üniversitesi", "Hatay Mustafa Kemal Üniversitesi", "Hitit Üniversitesi", "Iğdır Üniversitesi", "Isparta Uygulamalı Bilimler Üniversitesi", "Işık Üniversitesi", "İbn Haldun Üniversitesi", "İhsan Doğramacı Bilkent Üniversitesi", "İnönü Üniversitesi", "İskenderun Teknik Üniversitesi", "İstanbul 29 Mayıs Üniversitesi", "İstanbul Arel Üniversitesi", "İstanbul Atlas Üniversitesi", "İstanbul Aydın Üniversitesi", "İstanbul Beykent Üniversitesi", "İstanbul Bilgi Üniversitesi", "İstanbul Esenyurt Üniversitesi", "İstanbul Galata Üniversitesi", "İstanbul Gedik Üniversitesi", "İstanbul Gelişim Üniversitesi", "İstanbul Kent Üniversitesi", "İstanbul Kültür Üniversitesi", "İstanbul Medeniyet Üniversitesi", "İstanbul Medipol Üniversitesi", "İstanbul Nişantaşı Üniversitesi", "İstanbul Okan Üniversitesi", "İstanbul Rumeli Üniversitesi", "İstanbul Sabahattin Zaim Üniversitesi", "İstanbul Sağlık ve Sosyal Bilimler Meslek Yüksekokulu", "İstanbul Sağlık ve Teknoloji Üniversitesi", "İstanbul Şişli Meslek Yüksekokulu", "İstanbul Teknik Üniversitesi", "İstanbul Ticaret Üniversitesi", "İstanbul Topkapı Üniversitesi", "İstanbul Üniversitesi", "İstanbul Üniversitesi-Cerrahpaşa", "İstanbul Yeni Yüzyıl Üniversitesi", "İstinye Üniversitesi", "İzmir Bakırçay Üniversitesi", "İzmir Demokrasi Üniversitesi", "İzmir Ekonomi Üniversitesi", "İzmir Kâtip Çelebi Üniversitesi", "İzmir Kavram Meslek Yüksekokulu", "İzmir Tınaztepe Üniversitesi", "İzmir Yüksek Teknoloji Enstitüsü", "Kadir Has Üniversitesi", "Kafkas Üniversitesi", "Kahramanmaraş İstiklal Üniversitesi", "Kahramanmaraş Sütçü İmam Üniversitesi", "Kapadokya Üniversitesi", "Karabük Üniversitesi", "Karadeniz Teknik Üniversitesi", "Karamanoğlu Mehmetbey Üniversitesi", "Kastamonu Üniversitesi", "Kayseri Üniversitesi", "Kırıkkale Üniversitesi", "Kırklareli Üniversitesi", "Kırşehir Ahi Evran Üniversitesi", "Kilis 7 Aralık Üniversitesi", "Kocaeli Üniversitesi", "Konya Teknik Üniversitesi", "KTO Karatay Üniversitesi", "Malatya Turgut Özal Üniversitesi", "Manisa Celal Bayar Üniversitesi", "Mardin Artuklu Üniversitesi", "Marmara Üniversitesi", "Mersin Üniversitesi", "Muğla Sıtkı Koçman Üniversitesi", "Munzur Üniversitesi", "Muş Alparslan Üniversitesi", "Necmettin Erbakan Üniversitesi", "Nevşehir Hacı Bektaş Veli Üniversitesi", "Niğde Ömer Halisdemir Üniversitesi", "Ondokuz Mayıs Üniversitesi", "Ordu Üniversitesi", "Orta Doğu Teknik Üniversitesi", "Osmaniye Korkut Ata Üniversitesi", "Pamukkale Üniversitesi", "Recep Tayyip Erdoğan Üniversitesi", "Sakarya Üniversitesi", "Sakarya Uygulamalı Bilimler Üniversitesi", "Selçuk Üniversitesi", "Siirt Üniversitesi", "Sinop Üniversitesi", "Sivas Cumhuriyet Üniversitesi", "Süleyman Demirel Üniversitesi", "Şırnak Üniversitesi", "Tekirdağ Namık Kemal Üniversitesi", "Tokat Gaziosmanpaşa Üniversitesi", "Trabzon Üniversitesi", "Trakya Üniversitesi", "Türk-Alman Üniversitesi", "Türk Hava Kurumu Üniversitesi", "Uşak Üniversitesi", "Van Yüzüncü Yıl Üniversitesi", "Yalova Üniversitesi", "Yıldız Teknik Üniversitesi", "Yozgat Bozok Üniversitesi", "Zonguldak Bülent Ecevit Üniversitesi"];

export const provincialDirectorates = [ "Adana İl Millî Eğitim Müdürlüğü", "Adıyaman İl Millî Eğitim Müdürlüğü", "Afyon İl Millî Eğitim Müdürlüğü", "Ağrı İl Millî Eğitim Müdürlüğü", "Amasya İl Millî Eğitim Müdürlüğü", "Ankara İl Millî Eğitim Müdürlüğü", "Antalya İl Millî Eğitim Müdürlüğü", "Artvin İl Millî Eğitim Müdürlüğü", "Aydın İl Millî Eğitim Müdürlüğü", "Balıkesir İl Millî Eğitim Müdürlüğü", "Bilecik İl Millî Eğitim Müdürlüğü", "Bingöl İl Millî Eğitim Müdürlüğü", "Bitlis İl Millî Eğitim Müdürlüğü", "Bolu İl Millî Eğitim Müdürlüğü", "Burdur İl Millî Eğitim Müdürlüğü", "Bursa İl Millî Eğitim Müdürlüğü", "Çanakkale İl Millî Eğitim Müdürlüğü", "Çankırı İl Millî Eğitim Müdürlüğü", "Çorum İl Millî Eğitim Müdürlüğü", "Denizli İl Millî Eğitim Müdürlüğü", "Diyarbakır İl Millî Eğitim Müdürlüğü", "Edirne İl Millî Eğitim Müdürlüğü", "Elazığ İl Millî Eğitim Müdürlüğü", "Erzincan İl Millî Eğitim Müdürlüğü", "Erzurum İl Millî Eğitim Müdürlüğü", "Eskişehir İl Millî Eğitim Müdürlüğü", "Gaziantep İl Millî Eğitim Müdürlüğü", "Giresun İl Millî Eğitim Müdürlüğü", "Gümüşhane İl Millî Eğitim Müdürlüğü", "Hakkari İl Millî Eğitim Müdürlüğü", "Hatay İl Millî Eğitim Müdürlüğü", "Isparta İl Millî Eğitim Müdürlüğü", "Mersin İl Millî Eğitim Müdürlüğü", "İstanbul İl Millî Eğitim Müdürlüğü", "İzmir İl Millî Eğitim Müdürlüğü", "Kars İl Millî Eğitim Müdürlüğü", "Kastamonu İl Millî Eğitim Müdürlüğü", "Kayseri İl Millî Eğitim Müdürlüğü", "Kırklareli İl Millî Eğitim Müdürlüğü", "Kırşehir İl Millî Eğitim Müdürlüğü", "Kocaeli İl Millî Eğitim Müdürlüğü", "Konya İl Millî Eğitim Müdürlüğü", "Kütahya İl Millî Eğitim Müdürlüğü", "Malatya İl Millî Eğitim Müdürlüğü", "Manisa İl Millî Eğitim Müdürlüğü", "Kahramanmaraş İl Millî Eğitim Müdürlüğü", "Mardin İl Millî Eğitim Müdürlüğü", "Muğla İl Millî Eğitim Müdürlüğü", "Muş İl Millî Eğitim Müdürlüğü", "Nevşehir İl Millî Eğitim Müdürlüğü", "Niğde İl Millî Eğitim Müdürlüğü", "Ordu İl Millî Eğitim Müdürlüğü", "Rize İl Millî Eğitim Müdürlüğü", "Sakarya İl Millî Eğitim Müdürlüğü", "Samsun İl Millî Eğitim Müdürlüğü", "Siirt İl Millî Eğitim Müdürlüğü", "Sinop İl Millî Eğitim Müdürlüğü", "Sivas İl Millî Eğitim Müdürlüğü", "Tekirdağ İl Millî Eğitim Müdürlüğü", "Tokat İl Millî Eğitim Müdürlüğü", "Trabzon İl Millî Eğitim Müdürlüğü", "Tunceli İl Millî Eğitim Müdürlüğü", "Şanlıurfa İl Millî Eğitim Müdürlüğü", "Uşak İl Millî Eğitim Müdürlüğü", "Van İl Millî Eğitim Müdürlüğü", "Yozgat İl Millî Eğitim Müdürlüğü", "Zonguldak İl Millî Eğitim Müdürlüğü", "Aksaray İl Millî Eğitim Müdürlüğü", "Bayburt İl Millî Eğitim Müdürlüğü", "Karaman İl Millî Eğitim Müdürlüğü", "Kırıkkale İl Millî Eğitim Müdürlüğü", "Batman İl Millî Eğitim Müdürlüğü", "Şırnak İl Millî Eğitim Müdürlüğü", "Bartın İl Millî Eğitim Müdürlüğü", "Ardahan İl Millî Eğitim Müdürlüğü", "Iğdır İl Millî Eğitim Müdürlüğü", "Yalova İl Millî Eğitim Müdürlüğü", "Karabük İl Millî Eğitim Müdürlüğü", "Kilis İl Millî Eğitim Müdürlüğü", "Osmaniye İl Millî Eğitim Müdürlüğü", "Düzce İl Millî Eğitim Müdürlüğü" ];

const clubNames = [ "İTÜ Girişimcilik Kulübü", "Boğaziçi Üniversitesi Müzik Kulübü", "Galatasaray Lisesi Sanat Kulübü", "ODTÜ Robot Topluluğu", "Koç Üniversitesi Münazara Kulübü", "Bilkent Üniversitesi Yapay Zeka Topluluğu", "Hacettepe Tıp Öğrencileri Birliği", "Ege Üniversitesi Tiyatro Topluluğu", "Dokuz Eylül Hukuk Kulübü", "Sabancı Üniversitesi Finans Kulübü", "Robert Kolej Model Birleşmiş Milletler (MUN)", "Ankara Fen Lisesi Bilim ve Teknoloji Kulübü", "Yıldız Teknik Üniversitesi Fotoğrafçılık Kulübü (YTU FOK)", "Marmara Üniversitesi İletişim Kulübü", "Çankaya Üniversitesi Yazılım Kulübü", "Kabataş Erkek Lisesi Satranç Kulübü", "İstanbul Erkek Lisesi Almanca Tiyatro Topluluğu (IELEV)", "Akdeniz Üniversitesi Sualtı Topluluğu", "Anadolu Üniversitesi Sinema Kulübü", "Uludağ Üniversitesi Dağcılık Kulübü", "Gazi Üniversitesi Halk Dansları Topluluğu" ];
const clubCategories = ["Teknoloji", "Girişimcilik", "Sanat", "Müzik", "Sosyal Sorumluluk", "Spor", "Edebiyat", "Münazara", "Bilim"];

const universitiesAndHighSchools = [...allUniversities.slice(0, 15), "Galatasaray Lisesi", "Robert Kolej", "Ankara Fen Lisesi", "Kabataş Erkek Lisesi", "İstanbul Erkek Lisesi", "İzmir Atatürk Lisesi"];

export const studentClubs: StudentClub[] = clubNames.map((name, index) => {
    const school = universitiesAndHighSchools[index % universitiesAndHighSchools.length];
    const isHighSchool = school.includes('Lisesi');
    return {
        id: (index + 1).toString(),
        name: name,
        university: school,
        type: isHighSchool ? 'high-school' : 'university',
        category: clubCategories[index % clubCategories.length],
        avatarUrl: `https://logo.clearbit.com/${slugify(school)}.edu.tr`,
        coverPhotoUrl: `https://picsum.photos/seed/clubcover${index}/800/200`,
        members: Math.floor(Math.random() * (251 - 50) + 50),
        points: Math.floor(Math.random() * (8001 - 1000) + 1000),
        description: `${name}, ${school} bünyesinde öğrencilerin sosyal, kültürel ve mesleki gelişimlerine katkıda bulunmak amacıyla kurulmuş aktif bir öğrenci topluluğudur. Yıl boyunca düzenlediğimiz etkinliklerle üyelerimize yeni ufuklar açmayı hedefliyoruz.`,
        vision: `Vizyonumuz, ${school} öğrencileri arasında bir sinerji yaratarak, topluma faydalı, sorumluluk sahibi ve lider ruhlu bireyler yetiştirmektir.`,
        joinDate: `2023-0${(index % 9) + 1}-1${(index % 3)}`,
        contact: {
            email: `iletisim@${slugify(name)}.org`,
            phone: `+90 555 10${index} 20${index + 1}`,
            website: `www.${slugify(name)}.org`
        },
        projects: Math.floor(Math.random() * (13 - 5) + 5),
        volunteerHours: Math.floor(Math.random() * (801 - 200) + 200),
        activeMemberRate: Math.floor(Math.random() * (51 - 40) + 40),
    }
});

const universityToCityMap: { [key: string]: string } = {
    "Abdullah Gül Üniversitesi": "Kayseri",
    "Acıbadem Mehmet Ali Aydınlar Üniversitesi": "İstanbul",
    "Adana Alparslan Türkeş Bilim ve Teknoloji Üniversitesi": "Adana",
    "Adıyaman Üniversitesi": "Adıyaman",
    "Afyon Kocatepe Üniversitesi": "Afyonkarahisar",
    "Afyonkarahisar Sağlık Bilimleri Üniversitesi": "Afyonkarahisar",
    "Ağrı İbrahim Çeçen Üniversitesi": "Ağrı",
    "Akdeniz Üniversitesi": "Antalya",
    "Aksaray Üniversitesi": "Aksaray",
    "Alanya Alaaddin Keykubat Üniversitesi": "Antalya",
    "Alanya Üniversitesi": "Antalya",
    "Altınbaş Üniversitesi": "İstanbul",
    "Amasya Üniversitesi": "Amasya",
    "Anadolu Üniversitesi": "Eskişehir",
    "Ankara Bilim Üniversitesi": "Ankara",
    "Ankara Hacı Bayram Veli Üniversitesi": "Ankara",
    "Ankara Medipol Üniversitesi": "Ankara",
    "Ankara Müzik ve Güzel Sanatlar Üniversitesi": "Ankara",
    "Ankara Sosyal Bilimler Üniversitesi": "Ankara",
    "Ankara Üniversitesi": "Ankara",
    "Ankara Yıldırım Beyazıt Üniversitesi": "Ankara",
    "Antalya Belek Üniversitesi": "Antalya",
    "Antalya Bilim Üniversitesi": "Antalya",
    "Ardahan Üniversitesi": "Ardahan",
    "Artvin Çoruh Üniversitesi": "Artvin",
    "Atatürk Üniversitesi": "Erzurum",
    "Atılım Üniversitesi": "Ankara",
    "Avrasya Üniversitesi": "Trabzon",
    "Aydın Adnan Menderes Üniversitesi": "Aydın",
    "Bahçeşehir Üniversitesi": "İstanbul",
    "Balıkesir Üniversitesi": "Balıkesir",
    "Bandırma Onyedi Eylül Üniversitesi": "Balıkesir",
    "Bartın Üniversitesi": "Bartın",
    "Başkent Üniversitesi": "Ankara",
    "Batman Üniversitesi": "Batman",
    "Bayburt Üniversitesi": "Bayburt",
    "Beykoz Üniversitesi": "İstanbul",
    "Bezm-i Âlem Vakıf Üniversitesi": "İstanbul",
    "Bilecik Şeyh Edebali Üniversitesi": "Bilecik",
    "Bingöl Üniversitesi": "Bingöl",
    "Biruni Üniversitesi": "İstanbul",
    "Bitlis Eren Üniversitesi": "Bitlis",
    "Boğaziçi Üniversitesi": "İstanbul",
    "Bolu Abant İzzet Baysal Üniversitesi": "Bolu",
    "Burdur Mehmet Akif Ersoy Üniversitesi": "Burdur",
    "Bursa Teknik Üniversitesi": "Bursa",
    "Bursa Uludağ Üniversitesi": "Bursa",
    "Çağ Üniversitesi": "Mersin",
    "Çanakkale Onsekiz Mart Üniversitesi": "Çanakkale",
    "Çankaya Üniversitesi": "Ankara",
    "Çankırı Karatekin Üniversitesi": "Çankırı",
    "Çukurova Üniversitesi": "Adana",
    "Demiroğlu Bilim Üniversitesi": "İstanbul",
    "Dicle Üniversitesi": "Diyarbakır",
    "Doğuş Üniversitesi": "İstanbul",
    "Dokuz Eylül Üniversitesi": "İzmir",
    "Düzce Üniversitesi": "Düzce",
    "Ege Üniversitesi": "İzmir",
    "Erciyes Üniversitesi": "Kayseri",
    "Erzincan Binali Yıldırım Üniversitesi": "Erzincan",
    "Erzurum Teknik Üniversitesi": "Erzurum",
    "Eskişehir Osmangazi Üniversitesi": "Eskişehir",
    "Eskişehir Teknik Üniversitesi": "Eskişehir",
    "Fatih Sultan Mehmet Vakıf Üniversitesi": "İstanbul",
    "Fenerbahçe Üniversitesi": "İstanbul",
    "Fırat Üniversitesi": "Elazığ",
    "Galatasaray Üniversitesi": "İstanbul",
    "Gazi Üniversitesi": "Ankara",
    "Gaziantep İslam Bilim ve Teknoloji Üniversitesi": "Gaziantep",
    "Gaziantep Üniversitesi": "Gaziantep",
    "Gebze Teknik Üniversitesi": "Kocaeli",
    "Giresun Üniversitesi": "Giresun",
    "Gümüşhane Üniversitesi": "Gümüşhane",
    "Hacettepe Üniversitesi": "Ankara",
    "Hakkari Üniversitesi": "Hakkari",
    "Haliç Üniversitesi": "İstanbul",
    "Harran Üniversitesi": "Şanlıurfa",
    "Hasan Kalyoncu Üniversitesi": "Gaziantep",
    "Hatay Mustafa Kemal Üniversitesi": "Hatay",
    "Hitit Üniversitesi": "Çorum",
    "Iğdır Üniversitesi": "Iğdır",
    "Isparta Uygulamalı Bilimler Üniversitesi": "Isparta",
    "Işık Üniversitesi": "İstanbul",
    "İbn Haldun Üniversitesi": "İstanbul",
    "İhsan Doğramacı Bilkent Üniversitesi": "Ankara",
    "İnönü Üniversitesi": "Malatya",
    "İskenderun Teknik Üniversitesi": "Hatay",
    "İstanbul 29 Mayıs Üniversitesi": "İstanbul",
    "İstanbul Arel Üniversitesi": "İstanbul",
    "İstanbul Atlas Üniversitesi": "İstanbul",
    "İstanbul Aydın Üniversitesi": "İstanbul",
    "İstanbul Beykent Üniversitesi": "İstanbul",
    "İstanbul Bilgi Üniversitesi": "İstanbul",
    "İstanbul Esenyurt Üniversitesi": "İstanbul",
    "İstanbul Galata Üniversitesi": "İstanbul",
    "İstanbul Gedik Üniversitesi": "İstanbul",
    "İstanbul Gelişim Üniversitesi": "İstanbul",
    "İstanbul Kent Üniversitesi": "İstanbul",
    "İstanbul Kültür Üniversitesi": "İstanbul",
    "İstanbul Medeniyet Üniversitesi": "İstanbul",
    "İstanbul Medipol Üniversitesi": "İstanbul",
    "İstanbul Nişantaşı Üniversitesi": "İstanbul",
    "İstanbul Okan Üniversitesi": "İstanbul",
    "İstanbul Rumeli Üniversitesi": "İstanbul",
    "İstanbul Sabahattin Zaim Üniversitesi": "İstanbul",
    "İstanbul Sağlık ve Teknoloji Üniversitesi": "İstanbul",
    "İstanbul Teknik Üniversitesi": "İstanbul",
    "İstanbul Ticaret Üniversitesi": "İstanbul",
    "İstanbul Topkapı Üniversitesi": "İstanbul",
    "İstanbul Üniversitesi": "İstanbul",
    "İstanbul Üniversitesi-Cerrahpaşa": "İstanbul",
    "İstanbul Yeni Yüzyıl Üniversitesi": "İstanbul",
    "İstinye Üniversitesi": "İstanbul",
    "İzmir Bakırçay Üniversitesi": "İzmir",
    "İzmir Demokrasi Üniversitesi": "İzmir",
    "İzmir Ekonomi Üniversitesi": "İzmir",
    "İzmir Kâtip Çelebi Üniversitesi": "İzmir",
    "İzmir Yüksek Teknoloji Enstitüsü": "İzmir",
    "Kadir Has Üniversitesi": "İstanbul",
    "Kafkas Üniversitesi": "Kars",
    "Kahramanmaraş İstiklal Üniversitesi": "Kahramanmaraş",
    "Kahramanmaraş Sütçü İmam Üniversitesi": "Kahramanmaraş",
    "Kapadokya Üniversitesi": "Nevşehir",
    "Karabük Üniversitesi": "Karabük",
    "Karadeniz Teknik Üniversitesi": "Trabzon",
    "Karamanoğlu Mehmetbey Üniversitesi": "Karaman",
    "Kastamonu Üniversitesi": "Kastamonu",
    "Kayseri Üniversitesi": "Kayseri",
    "Kırıkkale Üniversitesi": "Kırıkkale",
    "Kırklareli Üniversitesi": "Kırklareli",
    "Kırşehir Ahi Evran Üniversitesi": "Kırşehir",
    "Kilis 7 Aralık Üniversitesi": "Kilis",
    "Kocaeli Üniversitesi": "Kocaeli",
    "Konya Teknik Üniversitesi": "Konya",
    "KTO Karatay Üniversitesi": "Konya",
    "Malatya Turgut Özal Üniversitesi": "Malatya",
    "Manisa Celal Bayar Üniversitesi": "Manisa",
    "Mardin Artuklu Üniversitesi": "Mardin",
    "Marmara Üniversitesi": "İstanbul",
    "Mersin Üniversitesi": "Mersin",
    "Muğla Sıtkı Koçman Üniversitesi": "Muğla",
    "Munzur Üniversitesi": "Tunceli",
    "Muş Alparslan Üniversitesi": "Muş",
    "Necmettin Erbakan Üniversitesi": "Konya",
    "Nevşehir Hacı Bektaş Veli Üniversitesi": "Nevşehir",
    "Niğde Ömer Halisdemir Üniversitesi": "Niğde",
    "Ondokuz Mayıs Üniversitesi": "Samsun",
    "Ordu Üniversitesi": "Ordu",
    "Orta Doğu Teknik Üniversitesi": "Ankara",
    "Osmaniye Korkut Ata Üniversitesi": "Osmaniye",
    "Pamukkale Üniversitesi": "Denizli",
    "Recep Tayyip Erdoğan Üniversitesi": "Rize",
    "Sakarya Üniversitesi": "Sakarya",
    "Sakarya Uygulamalı Bilimler Üniversitesi": "Sakarya",
    "Selçuk Üniversitesi": "Konya",
    "Siirt Üniversitesi": "Siirt",
    "Sinop Üniversitesi": "Sinop",
    "Sivas Cumhuriyet Üniversitesi": "Sivas",
    "Süleyman Demirel Üniversitesi": "Isparta",
    "Şırnak Üniversitesi": "Şırnak",
    "Tekirdağ Namık Kemal Üniversitesi": "Tekirdağ",
    "Tokat Gaziosmanpaşa Üniversitesi": "Tokat",
    "Trabzon Üniversitesi": "Trabzon",
    "Trakya Üniversitesi": "Edirne",
    "Türk-Alman Üniversitesi": "İstanbul",
    "Türk Hava Kurumu Üniversitesi": "Ankara",
    "Uşak Üniversitesi": "Uşak",
    "Van Yüzüncü Yıl Üniversitesi": "Van",
    "Yalova Üniversitesi": "Yalova",
    "Yıldız Teknik Üniversitesi": "İstanbul",
    "Yozgat Bozok Üniversitesi": "Yozgat",
    "Zonguldak Bülent Ecevit Üniversitesi": "Zonguldak",
    "Polonya Uluslararası Bilim ve Teknoloji Üniversitesi": "Varşova", 
    "Yeditepe Üniversitesi": "İstanbul",
    "Hacı Bayram Veli Üniversitesi": "Ankara"
};


export const events: Event[] = studentClubs.map((club, index) => {
    const eventTypes = ["Zirve", "Atölye", "Konferans", "Sosyal Etkinlik", "Yarışma", "Teknik Gezi", "Sergi", "Konser", "Söyleşi", "Turnuva"];
    const eventTags = ["Girişimcilik", "Teknoloji", "Sanat", "Müzik", "Kariyer", "Yapay Zeka", "Sosyal Sorumluluk", "Finans", "Münazara", "Robotik", "Tıp"];
    const eventType = eventTypes[index % eventTypes.length];
    const capacity = 50 + (index * 7 % 101); // Deterministic capacity
    const startHour = 9 + (index % 10);
    const endHour = startHour + 1 + (index % 4);
    const day = (index % 28) + 1;
    const eventDate = `2024-11-${day < 10 ? '0' : ''}${day}`;
    const eventName = `${club.name} ${eventType}si`;
    const eventId = `evt${index + 1}`;
    
    const locations = ["Çevrimiçi", "Kampüs Konferans Salonu", "Kültür Merkezi", "Belediye Salonu", "Partner Ofisi"];
    const participationConditions: ('Herkese Açık' | 'Üyelere Özel' | 'Öğrencilere Özel' | 'Davetlilere Özel')[] = ['Herkese Açık', 'Üyelere Özel', 'Öğrencilere Özel'];
    const languages = ["Türkçe", "İngilizce"];

    return {
        id: eventId,
        slug: `${slugify(eventName)}-${eventId}`,
        name: eventName,
        organizer: club.name,
        type: eventType,
        date: eventDate, 
        time: `${startHour}:00`,
        startDate: `${eventDate} ${startHour.toString().padStart(2, '0')}:00`,
        endDate: `${eventDate} ${endHour.toString().padStart(2, '0')}:00`,
        location: {
            type: index % 4 === 0 ? 'Online' : 'Fiziksel',
            address: locations[index % locations.length],
            city: universityToCityMap[club.university] || (club.university.split(' ')[0] || "İstanbul"),
            district: 'Kampüs'
        },
        language: languages[index % languages.length],
        participationCondition: participationConditions[index % participationConditions.length],
        capacity: {
            current: Math.floor(capacity * (0.2 + ((index * 3) % 7) / 10)), // Deterministic current capacity
            max: capacity
        },
        tags: [eventTags[index % eventTags.length], club.university],
        imageUrl: `https://picsum.photos/seed/event${index}/800/450`,
        imageHint: `${eventType.toLowerCase()} event`,
        description: `${club.name} tarafından düzenlenen bu etkinlikte, alanında uzman isimlerle bir araya gelerek ${eventTags[index % eventTags.length]} alanındaki son gelişmeleri ve kariyer fırsatlarını konuşacağız. Tüm öğrenciler davetlidir.`,
        providesCertificate: index % 2 === 0,
    };
});

export const schoolRepresentatives: SchoolRepresentative[] = studentClubs.map((club, index) => ({
    id: `rep${index + 1}`,
    name: `Temsilci ${index + 1}`,
    school: club.university,
    type: club.type,
    role: `Kulüp Başkanı`,
    avatarUrl: `https://i.pravatar.cc/150?u=rep${index+1}`,
    linkedinUrl: '#',
    faculty: `Mühendislik Fakültesi`,
}));


export const applications: Application[] = [];
export const donationTransactions: DonationTransaction[] = [];


    

    

    
