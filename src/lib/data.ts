'use client';

import { Leaf, Heart, HeartHandshake, Star, Award, Calendar, MapPin, Landmark, Briefcase, DollarSign, Users, Smile, Utensils, Siren, Scale, Lightbulb, FlaskConical, Accessibility, PersonStanding, Palette, Sprout, HeartPulse, Handshake, Baby, Globe, ShoppingBag, School } from 'lucide-react';
import type { Post, Brand, Event, Volunteering, User, Badge, Certificate, StudentClub, SchoolRepresentative, Application, DonationTransaction, ManagedItem, NGO, AdBanner, MarketCategory, HelpTopic } from './types';

export const allProvinces = ["Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Aksaray", "Amasya", "Ankara", "Antalya", "Ardahan", "Artvin", "Aydın", "Balıkesir", "Bartın", "Batman", "Bayburt", "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa", "Çanakkale", "Çankırı", "Çorum", "Denizli", "Diyarbakır", "Düzce", "Edirne", "Elazığ", "Erzincan", "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkari", "Hatay", "Iğdır", "Isparta", "İstanbul", "İzmir", "Kahramanmaraş", "Karabük", "Karaman", "Kars", "Kastamonu", "Kayseri", "Kırıkkale", "Kırklareli", "Kırşehir", "Kilis", "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Mardin", "Mersin", "Muğla", "Muş", "Nevşehir", "Niğde", "Ordu", "Osmaniye", "Rize", "Sakarya", "Samsun", "Siirt", "Sinop", "Sivas", "Şanlıurfa", "Şırnak", "Tekirdağ", "Tokat", "Trabzon", "Tunceli", "Uşak", "Van", "Yalova", "Yozgat", "Zonguldak"];

export const districtsData: { [key: string]: string[] } = {
  "İstanbul": ["Kadıköy", "Beşiktaş", "Üsküdar", "Beykoz", "Sarıyer", "Fatih", "Şişli", "Bakırköy"],
  "Ankara": ["Çankaya", "Etimesgut", "Yenimahalle", "Gölbaşı"],
  "İzmir": ["Konak", "Karşıyaka", "Bornova", "Buca"],
};

export const neighborhoodsData: { [province: string]: { [district: string]: string[] } } = {
  "İstanbul": {
    "Kadıköy": ["Caferağa", "Moda", "Osmanağa", "Rasimpaşa"],
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
    { id: '4', title: 'Sokak Hayvanları Besleme', organization: 'HAYTAP', ngoId: '4', location: { city: 'İzmir', district: 'Karşıyaka', type: 'Saha' }, commitment: 'Haftalık', volunteerCount: { needed: 25, applications: 15 }, dates: { applicationStart: '2025-05-01', applicationEnd: '2025-12-31', eventStart: '2025-06-01', eventEnd: '2025-12-31' }, hours: { start: '09:00', end: '12:00', total: 100 }, socialArea: 'Hayvan Hakları', points: 800, ngoTransparencyScore: 88, taskType: 'Sürekli', providesCertificate: false, earnedBadges: ['Patili Dost'], hasPreTraining: false, description: 'Düzenli olarak belirlenen noktalarda sahipsiz hayvanların beslenmesi ve takibi.', amenities: { transport: false, food: false, accommodation: false } },
    { id: '5', title: 'Üniversite Sosyal Etki Temsilcisi', organization: 'hangel Derneği', ngoId: '8', location: { city: 'Online', district: 'Türkiye Geneli', type: 'Online' }, commitment: 'Sürekli', volunteerCount: { needed: 25, applications: 0 }, dates: { applicationStart: '2025-05-01', applicationEnd: '2026-05-21', eventStart: '2025-06-01', eventEnd: '2026-06-01' }, hours: { start: '10:00', end: '18:00', total: 0 }, socialArea: 'Sosyal Girişimcilik', points: 5000, ngoTransparencyScore: 98, taskType: 'Sürekli', providesCertificate: true, earnedBadges: ['Liderlik Rozeti'], hasPreTraining: true, description: 'Kampüsünüzde sosyal etki rüzgarı estirin! hangel\'in üniversite temsilcisi olun.', amenities: { transport: false, food: false, accommodation: false } },
    { id: '6', title: 'Müze Rehberliği Gönüllüsü', organization: 'Kültür Sanat Vakfı', ngoId: '9', location: { city: 'İstanbul', district: 'Beyoğlu', type: 'Saha' }, commitment: 'Haftasonu', volunteerCount: { needed: 20, applications: 40 }, dates: { applicationStart: '2025-06-01', applicationEnd: '2025-07-01', eventStart: '2025-07-01', eventEnd: '2025-09-30' }, hours: { start: '10:00', end: '18:00', total: 48 }, socialArea: 'Kültür & Sanat', points: 1000, ngoTransparencyScore: 85, taskType: 'Dönemsel', providesCertificate: true, earnedBadges: ['Sanat Elçisi'], hasPreTraining: true, description: 'Ziyaretçilere sergiler hakkında bilgi verecek gönüllüler.', amenities: { transport: true, food: true, accommodation: false } },
    { id: '7', title: 'İşaret Dili Çevirmenliği', organization: 'Anlatan Eller', ngoId: '10', location: { city: 'Online', type: 'Online', district: 'Online' }, commitment: 'Esnek', volunteerCount: { needed: 5, applications: 8 }, dates: { applicationStart: '2025-01-01', applicationEnd: '2025-12-31', eventStart: '2025-01-01', eventEnd: '2025-12-31' }, hours: { start: '09:00', end: '21:00', total: 0 }, socialArea: 'Erişilebilirlik', points: 3000, ngoTransparencyScore: 96, taskType: 'Sürekli', providesCertificate: true, earnedBadges: ['Erişilebilirlik Kahramanı'], hasPreTraining: false, description: 'Eğitim videolarımızın işaret diline çevrilmesi.', amenities: { transport: false, food: false, accommodation: false } },
    { id: '8', title: 'Sahil Temizliği Operasyonu', organization: 'Deniz Temiz Derneği', ngoId: '11', location: { city: 'Antalya', district: 'Kaş', type: 'Saha' }, commitment: 'Tek Günlük', volunteerCount: { needed: 200, applications: 150 }, dates: { applicationStart: '2025-08-01', applicationEnd: '2025-08-15', eventStart: '2025-08-20', eventEnd: '2025-08-20' }, hours: { start: '08:00', end: '14:00', total: 6 }, socialArea: 'Çevre', points: 600, ngoTransparencyScore: 89, taskType: 'Tek Gün', providesCertificate: false, earnedBadges: ['Deniz Dostu'], hasPreTraining: false, description: 'Akdeniz sahillerini temizliyoruz.', amenities: { transport: true, food: true, accommodation: false } },
    { id: '9', title: 'Yaşlılara Dijital Okuryazarlık', organization: 'Nesiller Arası Dayanışma', ngoId: '12', location: { city: 'Bursa', district: 'Nilüfer', type: 'Saha' }, commitment: 'Haftalık', volunteerCount: { needed: 12, applications: 5 }, dates: { applicationStart: '2025-09-01', applicationEnd: '2025-09-30', eventStart: '2025-10-01', eventEnd: '2025-12-31' }, hours: { start: '10:00', end: '12:00', total: 24 }, socialArea: 'Sosyal Dayanışma', points: 1500, ngoTransparencyScore: 82, taskType: 'Dönemsel', providesCertificate: true, earnedBadges: ['Bilgi Köprüsü'], hasPreTraining: true, description: '65 yaş üstü bireylere akıllı telefon eğitimi.', amenities: { transport: true, food: true, accommodation: false } },
    { id: '10', title: 'Köy Okulu Kütüphanesi', organization: 'Kitap Vakfı', ngoId: '13', location: { city: 'Erzurum', district: 'Yakutiye', type: 'Saha' }, commitment: 'Tek Günlük', volunteerCount: { needed: 30, applications: 10 }, dates: { applicationStart: '2025-05-01', applicationEnd: '2025-05-30', eventStart: '2025-06-05', eventEnd: '2025-06-05' }, hours: { start: '09:00', end: '17:00', total: 8 }, socialArea: 'Eğitim', points: 400, ngoTransparencyScore: 80, taskType: 'Tek Gün', providesCertificate: false, earnedBadges: [], hasPreTraining: false, description: 'Kitap tasnifi ve kütüphane düzenleme.', amenities: { transport: true, food: true, accommodation: false } },
    { id: '11', title: 'Kan Bağışı Kampanyası', organization: 'Kızılay', ngoId: '14', location: { city: 'Ankara', district: 'Kızılay', type: 'Saha' }, commitment: 'Dönemsel', volunteerCount: { needed: 40, applications: 100 }, dates: { applicationStart: '2025-01-01', applicationEnd: '2025-01-31', eventStart: '2025-02-01', eventEnd: '2025-02-28' }, hours: { start: '10:00', end: '19:00', total: 40 }, socialArea: 'Sağlık', points: 1000, ngoTransparencyScore: 90, taskType: 'Dönemsel', providesCertificate: true, earnedBadges: ['Hayat Kurtaran'], hasPreTraining: true, description: 'Kan bağışı noktalarında bilgilendirme.', amenities: { transport: false, food: true, accommodation: false } },
    { id: '12', title: 'Sosyal Girişim Mentoru', organization: 'Ashoka Türkiye', ngoId: '15', location: { city: 'Online', district: 'Online', type: 'Online' }, commitment: 'Aylık', volunteerCount: { needed: 10, applications: 25 }, dates: { applicationStart: '2025-03-01', applicationEnd: '2025-03-31', eventStart: '2025-04-01', eventEnd: '2025-12-31' }, hours: { start: '09:00', end: '18:00', total: 18 }, socialArea: 'Sosyal Girişimcilik', points: 4000, ngoTransparencyScore: 97, taskType: 'Sürekli', providesCertificate: true, earnedBadges: ['Değişim Öncüsü'], hasPreTraining: false, description: 'Genç girişimcilere rehberlik.', amenities: { transport: false, food: false, accommodation: false } },
    { id: '13', title: 'Yazılım Geliştirme Gönüllüsü', organization: 'Açık Kaynak Sosyal Fayda', ngoId: '16', location: { city: 'Online', district: 'Online', type: 'Online' }, commitment: 'Sürekli', volunteerCount: { needed: 8, applications: 12 }, dates: { applicationStart: '2025-01-01', applicationEnd: '2025-12-31', eventStart: '2025-01-01', eventEnd: '2025-12-31' }, hours: { start: '09:00', end: '21:00', total: 0 }, socialArea: 'Teknoloji', points: 3500, ngoTransparencyScore: 93, taskType: 'Sürekli', providesCertificate: true, earnedBadges: ['Kod Dostu'], hasPreTraining: false, description: 'Sosyal fayda uygulamaları geliştirme.', amenities: { transport: false, food: false, accommodation: false } },
    { id: '14', title: 'Engelsiz Şehir Haritalama', organization: 'BlindLook', ngoId: '17', location: { city: 'İstanbul', district: 'Kadıköy', type: 'Saha' }, commitment: 'Haftasonu', volunteerCount: { needed: 50, applications: 20 }, dates: { applicationStart: '2025-04-01', applicationEnd: '2025-04-30', eventStart: '2025-05-01', eventEnd: '2025-06-30' }, hours: { start: '11:00', end: '16:00', total: 16 }, socialArea: 'Erişilebilirlik', points: 1800, ngoTransparencyScore: 95, taskType: 'Dönemsel', providesCertificate: true, earnedBadges: ['Gözcü'], hasPreTraining: true, description: 'Mekan denetimi ve haritalama.', amenities: { transport: true, food: false, accommodation: false } },
    { id: '15', title: 'Afet Farkındalık Eğitmeni', organization: 'AKUT', ngoId: '18', location: { city: 'İzmir', district: 'Bornova', type: 'Hibrit' }, commitment: 'Haftalık', volunteerCount: { needed: 30, applications: 15 }, dates: { applicationStart: '2025-02-01', applicationEnd: '2025-02-28', eventStart: '2025-03-01', eventEnd: '2025-12-31' }, hours: { start: '18:00', end: '20:00', total: 40 }, socialArea: 'Afet', points: 2200, ngoTransparencyScore: 98, taskType: 'Sürekli', providesCertificate: true, earnedBadges: ['Eğitmen'], hasPreTraining: true, description: 'Afet bilinci eğitimleri.', amenities: { transport: true, food: false, accommodation: false } },
    { id: '16', title: 'Geri Dönüşüm Atölyesi', organization: 'Gelecek Geri Dönüşüm', ngoId: '19', location: { city: 'İstanbul', district: 'Şişli', type: 'Saha' }, commitment: 'Tek Günlük', volunteerCount: { needed: 15, applications: 35 }, dates: { applicationStart: '2025-10-01', applicationEnd: '2025-10-15', eventStart: '2025-10-20', eventEnd: '2025-10-20' }, hours: { start: '13:00', end: '18:00', total: 5 }, socialArea: 'Çevre', points: 750, ngoTransparencyScore: 84, taskType: 'Tek Gün', providesCertificate: false, earnedBadges: ['Dönüşümcü'], hasPreTraining: false, description: 'Atık kumaşlardan tasarım.', amenities: { transport: false, food: true, accommodation: false } },
    { id: '17', title: 'Mülteci Çocuklara Oyun', organization: 'Sınır Tanımayan İyilik', ngoId: '20', location: { city: 'Gaziantep', district: 'Şahinbey', type: 'Saha' }, commitment: 'Haftalık', volunteerCount: { needed: 10, applications: 18 }, dates: { applicationStart: '2025-03-01', applicationEnd: '2025-03-31', eventStart: '2025-04-01', eventEnd: '2025-06-30' }, hours: { start: '15:00', end: '18:00', total: 36 }, socialArea: 'Çocuk Hakları', points: 2800, ngoTransparencyScore: 87, taskType: 'Dönemsel', providesCertificate: true, earnedBadges: ['Oyun Arkadaşı'], hasPreTraining: true, description: 'Çocuklarla oyun terapisi desteği.', amenities: { transport: true, food: true, accommodation: false } },
    { id: '18', title: 'Şehir Bahçeciliği', organization: 'Yeşil Şehirler', ngoId: '21', location: { city: 'Ankara', district: 'Yenimahalle', type: 'Saha' }, commitment: 'Haftalık', volunteerCount: { needed: 25, applications: 40 }, dates: { applicationStart: '2025-04-01', applicationEnd: '2025-04-30', eventStart: '2025-05-01', eventEnd: '2025-09-30' }, hours: { start: '08:00', end: '11:00', total: 60 }, socialArea: 'Tarım', points: 1100, ngoTransparencyScore: 83, taskType: 'Dönemsel', providesCertificate: false, earnedBadges: ['Toprak Dostu'], hasPreTraining: false, description: 'Mahalle bostanlarında üretim.', amenities: { transport: false, food: false, accommodation: false } },
    { id: '19', title: 'Sokak Sanatçıları Desteği', organization: 'Sanat Her Yerde', ngoId: '22', location: { city: 'İstanbul', district: 'Kadıköy', type: 'Saha' }, commitment: 'Esnek', volunteerCount: { needed: 15, applications: 25 }, dates: { applicationStart: '2025-01-01', applicationEnd: '2025-12-31', eventStart: '2025-01-01', eventEnd: '2025-12-31' }, hours: { start: '10:00', end: '22:00', total: 0 }, socialArea: 'Kültür & Sanat', points: 900, ngoTransparencyScore: 81, taskType: 'Sürekli', providesCertificate: false, earnedBadges: ['Sahne Arkası'], hasPreTraining: false, description: 'Sokak sanatçılarına organizasyon desteği.', amenities: { transport: false, food: true, accommodation: false } },
    { id: '20', title: 'İklim Veri Analizi', organization: 'Green Data', ngoId: '23', location: { city: 'Online', type: 'Online', district: 'Online' }, commitment: 'Proje Bazlı', volunteerCount: { needed: 3, applications: 15 }, dates: { applicationStart: '2025-06-01', applicationEnd: '2025-06-30', eventStart: '2025-07-01', eventEnd: '2025-08-30' }, hours: { start: '09:00', end: '18:00', total: 40 }, socialArea: 'Çevre', points: 3200, ngoTransparencyScore: 92, taskType: 'Dönemsel', providesCertificate: true, earnedBadges: ['Veri Bilimci'], hasPreTraining: false, description: 'İklim verilerinin görselleştirilmesi.', amenities: { transport: false, food: false, accommodation: false } },
    { id: '21', title: 'Otizmli Gençlerle Spor', organization: 'Tohum Otizm', ngoId: '24', location: { city: 'İstanbul', district: 'Beykoz', type: 'Saha' }, commitment: 'Haftalık', volunteerCount: { needed: 10, applications: 5 }, dates: { applicationStart: '2025-09-01', applicationEnd: '2025-09-30', eventStart: '2025-10-01', eventEnd: '2025-12-31' }, hours: { start: '10:00', end: '13:00', total: 24 }, socialArea: 'Sağlık', points: 2600, ngoTransparencyScore: 94, taskType: 'Dönemsel', providesCertificate: true, earnedBadges: ['Spor Arkadaşı'], hasPreTraining: true, description: 'Sosyal uyum süreçleri desteği.', amenities: { transport: true, food: true, accommodation: false } },
];

export const badges: Badge[] = [
    { id: '1', name: 'Çevre Koruyucusu', iconName: Leaf, level: 'Bronz', socialArea: 'Çevre', pointsRequired: 500, currentPoints: 800 },
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

export const allUniversities = ["Boğaziçi Üniversitesi", "İTÜ", "ODTÜ", "Hacettepe Üniversitesi", "Ege Üniversitesi", "Dokuz Eylül Üniversitesi"];
export const provincialDirectorates = ["İstanbul İl MEM", "Ankara İl MEM", "İzmir İl MEM"];
export const studentClubs: StudentClub[] = [
    { id: '1', name: 'İTÜ Girişimcilik Kulübü', university: 'İstanbul Teknik Üniversitesi', type: 'university', category: 'Girişimcilik', avatarUrl: 'https://logo.clearbit.com/itu.edu.tr', coverPhotoUrl: 'https://picsum.photos/seed/clubcover1/800/200', members: 150, points: 4500, description: 'Girişimcilik ekosistemini kampüse taşımak.', vision: 'Kampüsün lideri olmak.', joinDate: '2023-01-01', contact: { email: 'iletisim@itugirisim.org', phone: '+90 555 123 45 67', website: 'itugirisim.org' } }
];

export const helpTopics: HelpTopic[] = [
    { icon: 'User', title: "Bireysel Kullanıcılar", slug: "bireysel-kullanicilar", description: "Profil ve bağış işlemleri.", subtopics: [{ title: "Puanlar", link: "#", content: "Puanlar nasıl kazanılır ve harcanır?" }] }
];
export const ngoHelpTopics = helpTopics;
export const ngoFaqArticles = [{ title: 'Hata Bildirimi', content: 'Sistem hatalarını nasıl bildiririm?' }];
export const pastVolunteering = [];
export const events: Event[] = [];
export const schoolRepresentatives: SchoolRepresentative[] = [];
export const applications: Application[] = [];
export const donationTransactions: DonationTransaction[] = [];
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