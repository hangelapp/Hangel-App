
'use client';

import type { ImagePlaceholder } from './placeholder-images';
import { PlaceHolderImages } from './placeholder-images';
import type { Post, Brand, Event, Volunteering, Campaign, User, Badge, Certificate, StudentClub, SchoolRepresentative, Application, DonationTransaction, Notification, ManagedItem, NGO, AdBanner, HelpTopic, MarketCategory } from './types';
import { 
    Award, Baby, Bot, Building, Calendar, CheckCircle, Dog, Download, Eye, Hand, Heart, 
    HeartPulse, Home, Languages, Leaf, Linkedin, Mail, MapPin, Milestone, Pencil, QrCode, 
    School, Share2, Shield, ShieldCheck, Sparkles, Star, Users, Utensils, PawPrint, Grape, 
    Palette, Dumbbell, Siren, Briefcase, Handshake, Landmark, Plane, Cpu, Store, LayoutGrid, 
    UserCircle, BookText, Settings2, HeartHandshake, Wallet, LucideIcon, DollarSign, Smartphone,
    ShoppingBag
} from 'lucide-react';


const getImage = (id: string): ImagePlaceholder | undefined => PlaceHolderImages.find(img => img.id === id);

export const user: User = {
    id: '1',
    name: 'İsmail Hilmi ADIGÜZEL',
    username: '@ismailhilmicom',
    avatarUrl: 'https://images.unsplash.com/photo-1521119989659-a83eee488004?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw4fHxwZXJzb24lMjBwb3J0cmFpdHxlbnwwfHx8fDE3NjgwMDU1OTV8MA&ixlib=rb-4.1.0&q=80&w=1080',
    coverPhotoUrl: 'https://images.unsplash.com/photo-1693902939226-449195d2698b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw3fHxhYnN0cmFjdCUyMG5hdHVyZXxlbnwwfHx8fDE3NjgwMzgwMDN8MA&ixlib=rb-4.1.0&q=80&w=1080',
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
        skills: ['Proje Yönetimi', 'Sosyal Medya Yönetimi', 'Grafik Tasarım'],
        dailySkills: ['Yemek Yapma', 'Temizlik', 'El Becerileri', 'Organizasyon', 'İletişim'],
        interests: ['Hayvan Hakları', 'Çevre', 'Eğitim'],
        education: [
            { level: 'Lisans', school: 'Boğaziçi Üniversitesi - Yönetim Bilişim Sistemleri' },
            { level: 'Lise', school: 'Kabataş Erkek Lisesi' }
        ],
        profession: 'Yazılım Geliştirici',
        sector: 'Teknoloji',
        position: 'Kıdemli Geliştirici',
        languages: ['Türkçe (Ana Dil)', 'İngilizce (İleri)', 'Almanca (Orta)'],
        programs: ['VS Code', 'Figma', 'Docker'],
        languages: ['Türkçe (Ana Dil)', 'İngilizce (İleri)', 'Almanca (Orta)'],
        programs: ['VS Code', 'Figma', 'Docker'],
        licenses: ['B Sınıfı Ehliyet', 'A Sınıfı Ehliyet', 'İş Güvenliği Uzmanlığı'],
        documents: ['İlk Yardım Sertifikası', 'Scrum Master Sertifikası', 'Hijyen Belgesi'],
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
            emergencyContacts: [
                {
                    name: "Ayşe Yılmaz",
                    phone: "+90 555 987 65 43"
                },
                {
                    name: "Ahmet Yılmaz",
                    phone: "+90 555 123 45 67"
                }
            ]
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
    progress: {
        'Çevre': 80,
        'Hayvan Hakları': 100,
        'Eğitim': 50,
        'Çocuk': 60,
        'Afet': 20,
        'Sağlık': 0,
        'Yoksulluk': 10,
        'Kadın': 0,
        'Engelli': 0,
        'Mülteci': 0,
        'Gençlik': 0,
        'İnsan Hakları': 0,
        'İstihdam': 0,
        'Girişimcilik': 0,
        'Mahalli İdareler': 0
    }
};

export const timelinePosts: Post[] = Array.from({ length: 21 }, (_, i) => ({
  id: `${i + 1}`,
  author: { 
      name: i % 3 === 0 ? 'TEMA Vakfı' : (i % 3 === 1 ? 'Ahbap Derneği' : 'Doğa Dostu Giyim'),
      avatarUrl: i % 3 === 0 ? 'https://logo.clearbit.com/tema.org.tr' : (i % 3 === 1 ? 'https://logo.clearbit.com/ahbap.org' : 'https://logo.clearbit.com/patagonia.com'),
  },
  content: [
      'Bugün fidan dikme etkinliğimizde 200 yeni ağacı toprakla buluşturduk! Katılan tüm gönüllülerimize teşekkür ederiz. 🌳💚 #Doğaİçin',
      'İhtiyaç sahibi aileler için hazırladığımız gıda kolilerini dağıtmaya başladık. Desteklerinizle daha fazla insana ulaşıyoruz. 🙏',
      'Yeni sezon ürünlerimizde her alışverişin %10\'u LÖSEV\'e bağışlanıyor. Hem şık olun hem de bir çocuğun gülümsemesine ortak olun!',
      '"Temiz Deniz, Sağlıklı Gelecek" projemiz kapsamında bu hafta sonu İzmir sahilini temizledik. Katkı sağlayan herkese minnettarız!',
      'Acil kan ihtiyacı çağrımızla ilgili gösterdiğiniz yoğun ilgi için teşekkür ederiz. Unutmayın, bir ünite kan, üç can kurtarır!',
      'Sokak hayvanları için başlattığımız "Bir Kap Mama" kampanyası devam ediyor. Desteğinizle daha fazla cana dokunabiliriz. 🐾',
      'Yeni vegan ve sürdürülebilir ayakkabı koleksiyonumuz şimdi satışta! Doğaya saygılı adımlar atın.',
      'Çocuklar için kodlama atölyemizin ilkini başarıyla tamamladık. Geleceğin mühendisleri burada yetişiyor!',
      'Bu ayki gıda bankası dağıtımlarımızda 500 aileye daha ulaştık. İyilik paylaştıkça çoğalır.',
      'Eski kıyafetlerinizi geri dönüştürüyoruz! Getirdiğiniz her 5 parça için %15 indirim kuponu hediye.',
      'Afet bölgesindeki çalışmalarımız aralıksız devam ediyor. Gönüllülerimiz ve bağışçılarımızla birlikte yaraları sarıyoruz.',
      'Okul destek projemizle 200 öğrencinin kırtasiye ihtiyaçlarını karşıladık. Eğitime destek, geleceğe destektir.',
      'Organik pamuktan üretilen yeni tişört serimizle hem rahat edin hem de gezegenimize iyi bakın.',
      'Barınak ziyaretimizde sevimli dostlarımızla harika bir gün geçirdik. Onların da sevgiye ihtiyacı var.',
      'Topluluk merkezimizde ücretsiz sağlık taraması gerçekleştirdik. Erken teşhis hayat kurtarır.',
      'Geri dönüştürülmüş plastiklerden ürettiğimiz çantalarla plajları temiz tutmaya yardımcı olun.',
      '"Bir Kitap da Sen Getir" kampanyamızla köy okullarına kütüphane kuruyoruz. Bilgi paylaştıkça büyür.',
      'Depremzede aileler için konteyner ev kurulumlarımız tamamlandı. Sıcak bir yuva için el ele verdik.',
      'Adil ticaret ilkeleriyle üretilen kahvelerimizle güne başlarken, çiftçileri de desteklemiş olursunuz.',
      'Kadın emeğini destekleyen kooperatif ürünleri şimdi mağazamızda! El emeği, göz nuru ürünleri keşfedin.',
      'Yaşlı bakım evinde düzenlediğimiz müzik dinletisiyle büyüklerimizin yüzünü güldürdük. Onları unutmayalım.'
  ][i % 21],
  imageUrl: `https://picsum.photos/seed/post${i}/600/400`,
  imageHint: 'social media post',
  timestamp: `${i + 1} saat önce`,
  likes: Math.floor(Math.random() * 500) + 50,
  comments: Math.floor(Math.random() * 50) + 5,
  sponsored: i === 0,
}));

export const volunteeringOpportunities: Volunteering[] = [
    {
      id: '1',
      title: 'Afet Bölgesi Yardım Dağıtımı',
      organization: 'Ahbap Derneği',
      ngoId: '2',
      location: { city: 'Hatay', district: 'Antakya', type: 'Saha' },
      commitment: 'Dönemsel (1 Hafta)',
      volunteerCount: { needed: 50, applications: 120 },
      dates: { applicationStart: "2024-07-01", applicationEnd: "2024-07-25", eventStart: "2024-08-01", eventEnd: "2024-08-08" },
      hours: { start: '09:00', end: '18:00', total: 56 },
      socialArea: 'Afet',
      skills: ['İlk Yardım', 'İletişim'],
      dailySkills: ['Organizasyon'],
      requirements: ['B Sınıfı Ehliyet'],
      travel: { domestic: true },
      amenities: { transport: true, food: true, accommodation: true },
      providesCertificate: true,
      earnedBadges: ['Afet Gönüllüsü'],
      hasPreTraining: true,
      description: 'Deprem bölgesindeki ihtiyaç sahibi ailelere erzak ve hijyen kiti dağıtımı için gönüllüler arıyoruz.',
      points: 500,
      ngoTransparencyScore: 95,
      taskType: 'Dönemsel'
    },
    {
      id: '2',
      title: 'Ağaç Kardeşliği Projesi - Fidan Dikimi',
      organization: 'TEMA Vakfı',
      ngoId: '1',
      location: { city: 'İstanbul', district: 'Çekmeköy', type: 'Saha' },
      commitment: 'Tek Günlük (6 Saat)',
      volunteerCount: { needed: 200, applications: 450 },
      dates: { applicationStart: "2024-10-01", applicationEnd: "2024-11-10", eventStart: "2024-11-16", eventEnd: "2024-11-16" },
      hours: { start: '10:00', end: '16:00', total: 6 },
      socialArea: 'Çevre',
      skills: [],
      dailySkills: [],
      requirements: [],
      amenities: { transport: false, food: true, accommodation: false },
      providesCertificate: false,
      earnedBadges: ['Doğa Savaşçısı'],
      hasPreTraining: false,
      description: 'Geleceğe nefes olmak için düzenlediğimiz geleneksel fidan dikimi etkinliğimize davetlisiniz.',
      points: 150,
      ngoTransparencyScore: 92,
      taskType: 'Tek Gün'
    },
     {
      id: '3',
      title: 'Sosyal Medya İçerik Gönüllüsü',
      organization: 'Tohum Otizm Vakfı',
      ngoId: '3',
      location: { city: 'Türkiye', district: '', type: 'Online' },
      commitment: 'Sürekli (Haftada 5 Saat)',
      volunteerCount: { needed: 2, applications: 15 },
      dates: { applicationStart: "2024-07-15", applicationEnd: "2024-08-15", eventStart: "2024-08-20", eventEnd: "2025-08-20" },
      hours: { start: 'Esnek', end: 'Esnek', total: 260 },
      socialArea: 'Engelli',
      skills: ['Grafik Tasarım', 'Sosyal Medya Yönetimi'],
      programs: ['Figma'],
      amenities: { transport: false, food: false, accommodation: false },
      providesCertificate: true,
      earnedBadges: ['İletişim Uzmanı'],
      hasPreTraining: false,
      description: 'Otizm konusunda farkındalık oluşturmak için sosyal medya hesaplarımıza içerik üretecek gönüllüler arıyoruz.',
      points: 1200,
      ngoTransparencyScore: 88,
      taskType: 'Sürekli'
    },
    {
      id: '4',
      title: 'Hastane Ziyareti ve Oyun Arkadaşlığı',
      organization: 'LÖSEV',
      ngoId: '4',
      location: { city: 'Ankara', district: 'Çankaya', type: 'Saha' },
      commitment: 'Dönemsel (Haftada 2 Gün)',
      volunteerCount: { needed: 10, applications: 45 },
      dates: { applicationStart: "2024-08-01", applicationEnd: "2024-08-20", eventStart: "2024-09-01", eventEnd: "2024-12-31" },
      hours: { start: '14:00', end: '17:00', total: 128 },
      socialArea: 'Sağlık',
      skills: ['Çocuk Gelişimi', 'İletişim'],
      dailySkills: ['Çocuk Bakımı'],
      requirements: ['Adli Sicil Kaydı'],
      amenities: { transport: false, food: true, accommodation: false },
      providesCertificate: true,
      earnedBadges: ['Gülümseme Elçisi'],
      hasPreTraining: true,
      description: 'Lösemili çocuklarımıza moral vermek ve onlarla eğitici oyunlar oynamak için gönüllü ablalar ve ağabeyler arıyoruz.',
      points: 600,
      ngoTransparencyScore: 94,
      taskType: 'Dönemsel'
    },
    {
      id: '5',
      title: 'İlköğretim Öğrencileri için Fen Bilgisi Eğitmeni',
      organization: 'TEGV',
      ngoId: '5',
      location: { city: 'İstanbul', district: 'Bakırköy', type: 'Saha' },
      commitment: 'Dönemsel (Haftada 1 Gün)',
      volunteerCount: { needed: 5, applications: 22 },
      dates: { applicationStart: "2024-08-15", applicationEnd: "2024-09-15", eventStart: "2024-10-01", eventEnd: "2025-01-31" },
      hours: { start: '10:00', end: '12:00', total: 32 },
      socialArea: 'Eğitim',
      skills: ['Eğitmenlik'],
      education: 'Lisans',
      amenities: { transport: true, food: false, accommodation: false },
      providesCertificate: true,
      earnedBadges: ['Eğitim Gönüllüsü'],
      hasPreTraining: true,
      description: 'TEGV öğrenim birimimizde ilköğretim çağındaki çocuklara fen bilimlerini sevdirecek gönüllü eğitmenler arıyoruz.',
      points: 400,
      ngoTransparencyScore: 93,
      taskType: 'Dönemsel'
    }
];

export const ngos: NGO[] = [
    {
        id: '1',
        name: 'TEMA Vakfı',
        shortName: 'TEMA',
        foundationYear: 1992,
        category: 'Çevre',
        type: 'Vakıf',
        avatarUrl: 'https://logo.clearbit.com/tema.org.tr',
        coverPhotoUrl: 'https://picsum.photos/seed/tema-cover/1200/400',
        stats: { followers: 120000, donors: 50000, volunteers: 80000, volunteerHours: 250000, projects: 150, totalDonation: 1500000, donationCount: 65000, avgDonation: 23.07, highestSingleDonation: 500, peopleReached: 500000, },
        transparencyScore: 92,
        about: "Türkiye Çöl Olmasın! TEMA Vakfı, 1992 yılından bu yana erozyon ve çölleşme tehlikesine karşı mücadele etmekte, doğal varlıklarımızı korumak için çalışmaktadır. Ağaçlandırma projeleri, eğitim programları ve savunuculuk faaliyetleri ile daha yeşil bir Türkiye için umut oluyoruz.",
        joinDate: "2023-01-10",
        supportedSDGs: ['İklim Eylemi', 'Karasal Yaşam', 'Temiz Su ve Sanitasyon'],
        beneficiaryGroups: ['Tüm Canlılar', 'Gelecek Nesiller', 'Çevre'],
        memberOf: ['Açık Açık', 'Tüsev'],
        contact: { 
            email: 'iletisim@tema.org.tr', 
            phone: '0212 292 69 69', 
            website: 'https://www.tema.org.tr', 
            social: { twitter: 'temavakfi', instagram: 'temavakfi', facebook: 'temavakfi', linkedin: 'tema-vakfi' },
            address: {
                fullAddress: 'Cumhuriyet Cad. No:14 Büyükdere',
                city: 'İstanbul',
                district: 'Sarıyer',
            }
        },
        economicEnterpriseUrl: '/market/1',
        posts: timelinePosts.filter(p => p.author.name === 'TEMA Vakfı'),
        opportunities: volunteeringOpportunities.filter(o => o.ngoId === '1')
    },
    {
        id: '2',
        name: 'Ahbap Derneği',
        shortName: 'Ahbap',
        foundationYear: 2017,
        category: 'Dayanışma',
        type: 'Dernek',
        avatarUrl: 'https://logo.clearbit.com/ahbap.org',
        coverPhotoUrl: 'https://picsum.photos/seed/ahbap-cover/1200/400',
        stats: { followers: 850000, donors: 250000, volunteers: 150000, volunteerHours: 500000, projects: 500, totalDonation: 12500000, donationCount: 300000, avgDonation: 41.67, highestSingleDonation: 1000, peopleReached: 2000000, },
        transparencyScore: 95,
        about: "Ahbap, ihtiyaç sahibi kişilere ayni ve nakdi olmak üzere her türlü yardımda bulunmak, toplumda yardımlaşma bilincinin güçlenmesini sağlamak, iyi insan ve iyi toplum inşasına hizmet etmek amacıyla kurulmuş bir işbirliği hareketidir.",
        joinDate: "2023-02-20",
        supportedSDGs: ['1. Yoksulluğa Son', '3. Sağlıklı ve Kaliteli Yaşam', '4. Nitelikli Eğitim', '10. Eşitsizliklerin Azaltılması'],
        beneficiaryGroups: ['Afetzedeler', 'İhtiyaç Sahibi Aileler', 'Öğrenciler', 'Hastalar'],
        memberOf: ['Afet Platformu', 'HelpSteps'],
        affiliatedWith: {
          name: 'Anadolu Platformu',
          logoUrl: 'https://logo.clearbit.com/anadolu.edu.tr'
        },
        contact: { 
            email: 'iletisim@ahbap.org', 
            phone: '0216 550 50 50', 
            website: 'https://ahbap.org', 
            social: { twitter: 'ahbap', instagram: 'ahbap', facebook: 'ahbapdernegi', linkedin: 'ahbap-dernegi' },
            address: {
                fullAddress: 'Esentepe Mah. Ecza Sok. No:4',
                city: 'İstanbul',
                district: 'Şişli',
            }
        },
        economicEnterpriseUrl: '/market/1',
        posts: timelinePosts.filter(p => p.author.name === 'Ahbap Derneği'),
        opportunities: volunteeringOpportunities.filter(o => o.ngoId === '2'),
        campaigns: [
            { id: '1', title: 'Afet Bölgesi Konteyner Kent', description: 'Depremden etkilenen ailelerimiz için güvenli ve sıcak bir yuva kuruyoruz. Desteğinizle daha fazla aileyi yeni evlerine kavuşturalım.', imageUrl: 'https://picsum.photos/seed/konteyner/800/450', imageHint: "container homes", goal: 500000, currentAmount: 320000, ngoId: '2' },
            { id: '2', title: 'Geleceğe Işık Tut: Öğrenci Bursu', description: 'Maddi imkansızlıklar nedeniyle eğitimine devam etmekte zorlanan başarılı üniversite öğrencilerine burs desteği sağlıyoruz.', imageUrl: 'https://picsum.photos/seed/burs/800/450', imageHint: "student studying", goal: 200000, currentAmount: 85000, ngoId: '2' }
        ]
    }
];

export const allEntityLists: Brand[] = [
    // GİYİM
    { id: 'b1', name: 'Nike', category: 'Giyim', donationRate: 5, logoUrl: 'https://logo.clearbit.com/nike.com', type: 'brand', followers: 12000000 },
    { id: 'b2', name: 'Adidas', category: 'Giyim', donationRate: 6, logoUrl: 'https://logo.clearbit.com/adidas.com', type: 'brand', followers: 10000000 },
    { id: 'b3', name: 'Patagonia', category: 'Giyim', donationRate: 10, logoUrl: 'https://logo.clearbit.com/patagonia.com', type: 'brand', followers: 5000000 },
    { id: 'b4', name: 'H&M', category: 'Giyim', donationRate: 3, logoUrl: 'https://logo.clearbit.com/hm.com', type: 'brand', followers: 8000000 },
    { id: 'b5', name: 'Zara', category: 'Giyim', donationRate: 4, logoUrl: 'https://logo.clearbit.com/zara.com', type: 'brand', followers: 9500000 },
    { id: 'b6', name: 'Mavi', category: 'Giyim', donationRate: 7, logoUrl: 'https://logo.clearbit.com/mavi.com', type: 'brand', followers: 2000000 },
    { id: 'b7', name: 'LC Waikiki', category: 'Giyim', donationRate: 5, logoUrl: 'https://logo.clearbit.com/lcwaikiki.com', type: 'brand', followers: 3500000 },
    { id: 'b8', name: 'DeFacto', category: 'Giyim', donationRate: 6, logoUrl: 'https://logo.clearbit.com/defacto.com.tr', type: 'brand', followers: 1800000 },
    
    // AYAKKABI
    { id: 'b9', name: 'Ayakkabı Dünyası', category: 'Ayakkabı', donationRate: 8, logoUrl: 'https://logo.clearbit.com/ayakkabidunyasi.com.tr', type: 'brand', followers: 450000 },
    { id: 'b10', name: 'Flo', category: 'Ayakkabı', donationRate: 5, logoUrl: 'https://logo.clearbit.com/flo.com.tr', type: 'brand', followers: 1200000 },
    { id: 'b11', name: 'SuperStep', category: 'Ayakkabı', donationRate: 4, logoUrl: 'https://logo.clearbit.com/superstep.com.tr', type: 'brand', followers: 600000 },
    { id: 'b12', name: 'InStreet', category: 'Ayakkabı', donationRate: 6, logoUrl: 'https://logo.clearbit.com/instreet.com.tr', type: 'brand', followers: 350000 },
    { id: 'b13', name: 'Converse', category: 'Ayakkabı', donationRate: 7, logoUrl: 'https://logo.clearbit.com/converse.com', type: 'brand', followers: 2500000 },
    { id: 'b14', name: 'Vans', category: 'Ayakkabı', donationRate: 8, logoUrl: 'https://logo.clearbit.com/vans.com', type: 'brand', followers: 3000000 },
    
    // ELEKTRONİK
    { id: 'b15', name: 'Apple', category: 'Elektronik', donationRate: 2, logoUrl: 'https://logo.clearbit.com/apple.com', type: 'brand', followers: 50000000 },
    { id: 'b16', name: 'Samsung', category: 'Elektronik', donationRate: 3, logoUrl: 'https://logo.clearbit.com/samsung.com', type: 'brand', followers: 40000000 },
    { id: 'b17', name: 'MediaMarkt', category: 'Elektronik', donationRate: 2, logoUrl: 'https://logo.clearbit.com/mediamarkt.com.tr', type: 'brand', followers: 4000000 },
    { id: 'b18', name: 'Teknosa', category: 'Elektronik', donationRate: 3, logoUrl: 'https://logo.clearbit.com/teknosa.com', type: 'brand', followers: 2500000 },
    { id: 'b19', name: 'Arçelik', category: 'Elektronik', donationRate: 5, logoUrl: 'https://logo.clearbit.com/arcelik.com.tr', type: 'brand', followers: 1500000 },
    { id: 'b20', name: 'Vestel', category: 'Elektronik', donationRate: 6, logoUrl: 'https://logo.clearbit.com/vestel.com.tr', type: 'brand', followers: 1200000 },
    
    // EV & YAŞAM
    { id: 'b21', name: 'IKEA', category: 'Ev & Yaşam', donationRate: 4, logoUrl: 'https://logo.clearbit.com/ikea.com.tr', type: 'brand', followers: 6000000 },
    { id: 'b22', name: 'Madame Coco', category: 'Ev & Yaşam', donationRate: 10, logoUrl: 'https://logo.clearbit.com/madamecoco.com', type: 'brand', followers: 2800000 },
    { id: 'b23', name: 'English Home', category: 'Ev & Yaşam', donationRate: 8, logoUrl: 'https://logo.clearbit.com/englishhome.com', type: 'brand', followers: 3200000 },
    { id: 'b24', name: 'Karaca', category: 'Ev & Yaşam', donationRate: 7, logoUrl: 'https://logo.clearbit.com/karaca.com', type: 'brand', followers: 4500000 },
    { id: 'b25', name: 'Korkmaz', category: 'Ev & Yaşam', donationRate: 6, logoUrl: 'https://logo.clearbit.com/korkmaz.com.tr', type: 'brand', followers: 900000 },
    
    // SÜPERMARKET
    { id: 'b26', name: 'Migros', category: 'Süpermarket', donationRate: 3, logoUrl: 'https://logo.clearbit.com/migros.com.tr', type: 'brand', followers: 5000000 },
    { id: 'b27', name: 'CarrefourSA', category: 'Süpermarket', donationRate: 4, logoUrl: 'https://logo.clearbit.com/carrefoursa.com', type: 'brand', followers: 2500000 },
    { id: 'b28', name: 'Getir', category: 'Süpermarket', donationRate: 5, logoUrl: 'https://logo.clearbit.com/getir.com', type: 'brand', followers: 8000000 },
    { id: 'b29', name: 'Yemeksepeti Market', category: 'Süpermarket', donationRate: 4, logoUrl: 'https://logo.clearbit.com/yemeksepeti.com', type: 'brand', followers: 10000000 },
    
    // KİŞİSEL BAKIM
    { id: 'b30', name: 'Gratis', category: 'Kişisel Bakım', donationRate: 6, logoUrl: 'https://logo.clearbit.com/gratis.com', type: 'brand', followers: 7000000 },
    { id: 'b31', name: 'Watsons', category: 'Kişisel Bakım', donationRate: 5, logoUrl: 'https://logo.clearbit.com/watsons.com.tr', type: 'brand', followers: 5500000 },
    { id: 'b32', name: 'Rossmann', category: 'Kişisel Bakım', donationRate: 7, logoUrl: 'https://logo.clearbit.com/rossmann.com.tr', type: 'brand', followers: 1800000 },
    { id: 'b33', name: 'Sephora', category: 'Kişisel Bakım', donationRate: 4, logoUrl: 'https://logo.clearbit.com/sephora.com.tr', type: 'brand', followers: 4000000 },
    
    // PAZARYERİ
    { id: 'b34', name: 'Trendyol', category: 'Pazaryeri', donationRate: 2, logoUrl: 'https://logo.clearbit.com/trendyol.com', type: 'brand', followers: 25000000 },
    { id: 'b35', name: 'Hepsiburada', category: 'Pazaryeri', donationRate: 3, logoUrl: 'https://logo.clearbit.com/hepsiburada.com', type: 'brand', followers: 18000000 },
    { id: 'b36', name: 'n11', category: 'Pazaryeri', donationRate: 4, logoUrl: 'https://logo.clearbit.com/n11.com', type: 'brand', followers: 12000000 },
    { id: 'b37', name: 'Amazon TR', category: 'Pazaryeri', donationRate: 5, logoUrl: 'https://logo.clearbit.com/amazon.com.tr', type: 'brand', followers: 15000000 },
    
    // KOOPERATİF & SOSYAL İŞLETME
    { id: 'b38', name: 'Tire Süt Kooperatifi', category: 'Süpermarket', donationRate: 15, logoUrl: 'https://logo.clearbit.com/tiresutkooperatifi.com', type: 'cooperative', followers: 85000 },
    { id: 'b39', name: 'Kadın Emeğini Değerlendirme Vakfı', category: 'Ev & Yaşam', donationRate: 20, logoUrl: 'https://logo.clearbit.com/kedv.org.tr', type: 'social', followers: 120000 },
    { id: 'b40', name: 'Çöp(m)adam', category: 'Ev & Yaşam', donationRate: 25, logoUrl: 'https://picsum.photos/seed/copmadam/200/200', type: 'social', followers: 45000 },
    { id: 'b41', name: 'Tarihi Kemeraltı Esnafı', category: 'Pazaryeri', donationRate: 10, logoUrl: 'https://picsum.photos/seed/kemeralti/200/200', type: 'economic', followers: 25000 },
];

export const events: Event[] = [
  {
    id: '1',
    name: 'Girişimcilik Zirvesi \'24',
    organizer: 'İTÜ Girişimcilik Kulübü',
    type: 'Konferans',
    date: '25 Ekim 2024',
    time: '10:00',
    location: 'Süleyman Demirel Kültür Merkezi, Maslak',
    capacity: { current: 450, max: 500 },
    tags: ['Girişimcilik', 'Teknoloji', 'Networking'],
    imageUrl: 'https://images.unsplash.com/photo-1540575861501-7ad0582371f3?q=80&w=2070&auto=format&fit=crop',
    imageHint: 'conference hall',
    description: 'Türkiye\'nin en kapsamlı öğrenci zirvelerinden biri olan İTÜ Girişimcilik Zirvesi, sektörün liderlerini öğrencilerle buluşturuyor.',
    providesCertificate: true
  },
  {
    id: '2',
    name: 'Dayanışma Konseri',
    organizer: 'Ahbap Derneği',
    type: 'Konser',
    date: '12 Ağustos 2024',
    time: '20:00',
    location: 'Harbiye Cemil Topuzlu Açık Hava Tiyatrosu',
    capacity: { current: 3200, max: 4500 },
    tags: ['Müzik', 'Dayanışma', 'Yardım'],
    imageUrl: 'https://images.unsplash.com/photo-1459749411177-042180ce673c?q=80&w=2070&auto=format&fit=crop',
    imageHint: 'concert crowd',
    description: 'Elde edilen gelirin tamamının afetzedelere aktarılacağı bu özel gecede, sevilen sanatçılar iyilik için sahne alıyor.',
    providesCertificate: false
  },
  {
    id: '3',
    name: 'İklim Krizi Çalıştayı',
    organizer: 'TEMA Vakfı',
    type: 'Çalıştay',
    date: '5 Eylül 2024',
    time: '09:00',
    location: 'Online (Zoom)',
    capacity: { current: 150, max: 300 },
    tags: ['Çevre', 'İklim', 'Eğitim'],
    imageUrl: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?q=80&w=2041&auto=format&fit=crop',
    imageHint: 'forest sunlight',
    description: 'İklim krizi ile mücadelede bireysel ve kurumsal adımların tartışılacağı interaktif bir çalıştay.',
    providesCertificate: true
  }
];

export const adBanners: AdBanner[] = [
    { id: '1', title: 'Okul Alışverişiyle Destek Ol!', description: 'Kırtasiye ve okul ihtiyaçlarınızla TEGV\'e bağış yapın.', imageUrl: 'https://images.unsplash.com/photo-1766961557637-f40431f5839b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', link: '/market' },
    { id: '2', title: 'Tatile Çıkarken İyilik Yapın', description: 'Otel ve uçak rezervasyonlarınızla TEMA\'yı destekleyin.', imageUrl: 'https://images.unsplash.com/photo-1503220317375-aa068c833b36?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', link: '/market' },
];

export const managedItems: ManagedItem[] = [
    { name: 'Ahbap Derneği', type: 'STK', icon: 'heart-handshake', logoUrl: 'https://logo.clearbit.com/ahbap.org', href: '/ngo-admin/dashboard', status: 'approved' },
    { name: 'Doğa Dostu Giyim', type: 'Marka', icon: 'store', logoUrl: 'https://logo.clearbit.com/patagonia.com', href: '#', status: 'approved' },
    { name: 'İTÜ Girişimcilik Kulübü', type: 'Öğrenci Kulübü', icon: 'users', logoUrl: 'https://logo.clearbit.com/itu.edu.tr', href: '/admin/clubs/profile/1', status: 'approved' },
];

export const studentClubs: StudentClub[] = [
  { id: '1', name: 'İTÜ Girişimcilik Kulübü', university: 'İstanbul Teknik Üniversitesi', type: 'university', avatarUrl: 'https://logo.clearbit.com/itu.edu.tr', coverPhotoUrl: 'https://picsum.photos/seed/itu/1200/400', members: 1500, points: 12500, description: 'Türkiye\'nin en eski ve en büyük girişimcilik kulüplerinden biri.', vision: 'Girişimcilik ekosistemine yön veren lider bir gençlik hareketi olmak.', joinDate: '2023-05-20', contact: {email: 'gk@itu.edu.tr', phone: 'N/A', website: 'itugk.com'}, projects: 25, volunteerHours: 3200, activeMemberRate: 85 },
];

export const schoolRepresentatives: SchoolRepresentative[] = [
  { id: '1', name: 'Can Demir', school: 'İstanbul Teknik Üniversitesi', type: 'university', role: 'Kampüs Başkanı', avatarUrl: 'https://i.pravatar.cc/150?u=can', linkedinUrl: '#' },
  { id: '2', name: 'Ayşe Yılmaz', school: 'Boğaziçi Üniversitesi', type: 'university', role: 'Kampüs Başkanı', avatarUrl: 'https://i.pravatar.cc/150?u=ayse2', linkedinUrl: '#' },
  { id: '3', name: 'Mehmet Öztürk', school: 'Orta Doğu Teknik Üniversitesi', type: 'university', role: 'Kampüs Başkanı', avatarUrl: 'https://i.pravatar.cc/150?u=mehmet2', linkedinUrl: '#' },
  { id: '4', name: 'Zeynep Kaya', school: 'Galatasaray Üniversitesi', type: 'university', role: 'Kampüs Başkanı', avatarUrl: 'https://i.pravatar.cc/150?u=zeynep2', linkedinUrl: '#' },
  { id: '5', name: 'Ali Arslan', school: 'İstanbul Teknik Üniversitesi', type: 'university', role: 'Fakülte Temsilcisi', avatarUrl: 'https://i.pravatar.cc/150?u=ali2', linkedinUrl: '#' },
];

export const applications: Application[] = [
    { id: '1', title: 'Afet Bölgesi Yardım Dağıtımı', type: 'Gönüllülük', org: 'Ahbap Derneği', date: '2024-07-21', location: 'Hatay', status: 'Onaylandı', entityId: '1' },
    { id: '2', title: 'İTÜ Girişimcilik Kulübü Üyeliği', type: 'Kulüpler', org: 'İTÜ', date: '2024-07-20', location: 'İstanbul', status: 'Beklemede', entityId: '1' },
];

export const donationTransactions: DonationTransaction[] = [
    { id: '1', type: 'expense', brand: 'Doğa Dostu Giyim', purchaseAmount: '250.00', donationAmount: '25.00', ngo: ['TEMA Vakfı'], date: '2024-07-21', time: '14:32' },
    { id: '2', type: 'expense', brand: 'Lezzet Köyü', purchaseAmount: '120.50', donationAmount: '12.05', ngo: ['Ahbap Derneği'], date: '2024-07-20', time: '18:10' },
    { id: '3', type: 'income', brand: 'Bakiye Yükleme', purchaseAmount: '500.00', donationAmount: '0.00', ngo: [], date: '2024-07-20', time: '10:00' },
];

export const badges: Badge[] = [
  { id: '1', name: 'Çevre Koruyucusu', iconName: Leaf, level: 'Bronz', socialArea: 'Çevre', pointsRequired: 500, currentPoints: 800 },
  { id: '2', name: 'Hayvan Dostu', iconName: Dog, level: 'Bronz', socialArea: 'Hayvan Hakları', pointsRequired: 500, currentPoints: 650 },
  { id: '3', name: 'Eğitim Gönüllüsü', iconName: School, level: 'Bakır', socialArea: 'Eğitim', pointsRequired: 250, currentPoints: 300 },
  { id: '4', name: 'Afet Kahramanı', iconName: Siren, level: 'Demir', socialArea: 'Afet', pointsRequired: 100, currentPoints: 150 },
];

export const certificates: Certificate[] = [
  { id: '1', title: 'Afet Gönüllülüğü Başarı Belgesi', organization: 'Ahbap Derneği', date: '15 Temmuz 2024', linkedinUrl: '#' },
  { id: '2', title: 'Ağaç Dikme Gönüllülük Sertifikası', organization: 'TEMA Vakfı', date: '20 Haziran 2024', linkedinUrl: '#' },
];

export const helpTopics: HelpTopic[] = [
  {
    icon: 'Info',
    title: 'Genel Bilgiler',
    slug: 'genel-bilgiler',
    description: 'Hangel nedir ve nasıl çalışır?',
    subtopics: [
      { title: 'Hangel Nedir?', link: '#', content: '<p>Hangel, toplumsal fayda için teknoloji üreten bir sosyal girişimdir.</p>' }
    ]
  }
];

export const ngoHelpTopics: HelpTopic[] = [
  {
    icon: 'Building',
    title: 'STK Yönetimi',
    slug: 'stk-yonetimi',
    description: 'Profilinizi ve bağışlarınızı yönetin.',
    subtopics: [
      { title: 'Profil Güncelleme', link: '#', content: '<p>Profilinizi yönetici panelinden güncelleyebilirsiniz.</p>' }
    ]
  }
];

export const ngoFaqArticles = [
  { title: 'Nasıl bağış alırım?', link: '#' },
  { title: 'Gönüllüleri nasıl yönetirim?', link: '#' }
];

export const pastVolunteering = [
  { id: '1', title: 'Afet Bölgesi Lojistik', organization: 'Ahbap', dates: { eventEnd: '2024-07-01' }, description: 'Lojistik destek sağlandı.', review: { rating: 5, comment: 'Mükemmel katkı!' } }
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
    { mainCategory: 'Süpermarket', subCategories: [] },
];

export const qrPaymentCardData = [
  {
    id: 'bireysel',
    type: 'Bireysel',
    bgColor: 'bg-gradient-to-br from-[#f34723] via-[#ff5a3c] to-[#d63a1a]',
    number: '5549601000001234',
    owner: 'İsmail Hilmi ADIGÜZEL',
    expiry: '12/28',
    balance: '1.250,75 ₺',
    ngoId: '1',
    cvv: '123'
  }
];

export const categoryMapping = {
    'Giyim': ['Giyim', 'Spor Giyim', 'Outdoor'],
    'Ayakkabı': ['Ayakkabı'],
    'Elektronik': ['Elektronik'],
    'Ev & Yaşam': ['Ev & Yaşam'],
    'Süpermarket': ['Süpermarket'],
    'Kişisel Bakım': ['Kişisel Bakım'],
    'Pazaryeri': ['Pazaryeri']
};
