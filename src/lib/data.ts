

import type { ImagePlaceholder } from './placeholder-images';
import { PlaceHolderImages } from './placeholder-images';
import type { Post, Brand, Event, Volunteering, Campaign, User, Badge, Certificate, StudentClub, SchoolRepresentative, Application, DonationTransaction, Notification, ManagedItem, NGO, AdBanner, HelpTopic, MarketCategory } from './types';
import { Award, Baby, Bot, Building, Calendar, CheckCircle, Dog, Download, Eye, Hand, Heart, HeartPulse, Home, Languages, Leaf, Linkedin, Mail, MapPin, Milestone, Pencil, Phone, QrCode, School, Share2, Shield, ShieldCheck, Sparkles, Star, Users, Utensils, PawPrint, Grape, Palette, Dumbbell, Siren, Briefcase, Handshake, Landmark, Plane, Cpu, Store, LayoutGrid, UserCircle, BookText, Settings2, HeartHandshake, Wallet, LucideIcon, DollarSign, Smartphone } from 'lucide-react';


const getImage = (id: string): ImagePlaceholder | undefined => PlaceHolderImages.find(img => img.id === id);

export const user: User = {
    id: '1',
    name: 'İsmail Hilmi ADIGÜZEL',
    username: '@ismailhilmiadiguzel',
    avatarUrl: 'https://images.unsplash.com/photo-1521119989659-a83eee488004?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw4fHxwZXJzb24lMjBwb3J0cmFpdHxlbnwwfHx8fDE3NjgwMDU1OTV8MA&ixlib=rb-4.1.0&q=80&w=1080',
    coverPhotoUrl: 'https://images.unsplash.com/photo-1693902939226-449195d2698b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw3fHxhYnN0cmFjdCUyMG5hdHVyZXxlbnwwfHx8fDE3NjgwMzgwMDN8MA&ixlib=rb-4.1.0&q=80&w=1080',
    impactScore: 15750,
    personalInfo: {
        email: 'i.adiguzel@email.com',
        phone: '+90 554 700 7007',
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
  sponsored: i % 5 === 2,
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
      description: 'Otizm konusunda farkındalık yaratmak için sosyal medya hesaplarımıza içerik üretecek gönüllüler arıyoruz.',
      points: 1200,
      ngoTransparencyScore: 88,
      taskType: 'Sürekli'
    }
];

export const ngos: NGO[] = [
    {
        id: '1',
        name: 'TEMA Vakfı',
        category: 'Çevre',
        type: 'Vakıf',
        avatarUrl: 'https://logo.clearbit.com/tema.org.tr',
        coverPhotoUrl: 'https://picsum.photos/seed/tema-cover/1200/400',
        stats: {
            followers: 120000,
            donors: 50000,
            volunteers: 80000,
            volunteerHours: 250000,
            projects: 150,
            totalDonation: 1500000,
            donationCount: 65000,
            avgDonation: 23.07,
            highestSingleDonation: 500,
            peopleReached: 500000,
        },
        transparencyScore: 92,
        about: "Türkiye Çöl Olmasın! TEMA Vakfı, 1992 yılından bu yana erozyon ve çölleşme tehlikesine karşı mücadele etmekte, doğal varlıklarımızı korumak için çalışmaktadır. Ağaçlandırma projeleri, eğitim programları ve savunuculuk faaliyetleri ile daha yeşil bir Türkiye için umut oluyoruz.",
        joinDate: "2023-01-10",
        supportedSDGs: ['İklim Eylemi', 'Karasal Yaşam', 'Temiz Su ve Sanitasyon'],
        beneficiaryGroups: ['Tüm Canlılar', 'Gelecek Nesiller'],
        memberOf: ['Açık Açık', 'Tüsev'],
        contact: {
            email: 'iletisim@tema.org.tr', phone: '0212 292 69 69', website: 'https://www.tema.org.tr',
            social: { twitter: 'temavakfi', instagram: 'temavakfi', facebook: 'temavakfi', linkedin: 'tema-vakfi' }
        },
        posts: timelinePosts.filter(p => p.author.name === 'TEMA Vakfı'),
        opportunities: volunteeringOpportunities.filter(o => o.ngoId === '1')
    },
    {
        id: '2',
        name: 'Ahbap Derneği',
        category: 'Dayanışma',
        type: 'Dernek',
        avatarUrl: 'https://logo.clearbit.com/ahbap.org',
        coverPhotoUrl: 'https://picsum.photos/seed/ahbap-cover/1200/400',
        stats: {
            followers: 850000,
            donors: 250000,
            volunteers: 150000,
            volunteerHours: 500000,
            projects: 500,
            totalDonation: 12500000,
            donationCount: 300000,
            avgDonation: 41.67,
            highestSingleDonation: 1000,
            peopleReached: 2000000,
        },
        transparencyScore: 95,
        about: "Ahbap, ihtiyaç sahibi kişilere ayni ve nakdi olmak üzere her türlü yardımda bulunmak, toplumda yardımlaşma bilincinin güçlenmesini sağlamak, iyi insan ve iyi toplum inşasına hizmet etmek amacıyla kurulmuş bir işbirliği hareketidir.",
        joinDate: "2023-02-20",
        supportedSDGs: ['Yoksulluğa Son', 'Sağlıklı ve Kaliteli Yaşam', 'Nitelikli Eğitim', 'Eşitsizliklerin Azaltılması'],
        beneficiaryGroups: ['Afetzedeler', 'İhtiyaç Sahibi Aileler', 'Öğrenciler', 'Hastalar'],
        memberOf: ['Afet Platformu'],
        contact: {
            email: 'iletisim@ahbap.org', phone: '0216 550 50 50', website: 'https://ahbap.org',
            social: { twitter: 'ahbap', instagram: 'ahbap', facebook: 'ahbapdernegi', linkedin: 'ahbap-dernegi' }
        },
        economicEnterpriseUrl: '/market/1',
        posts: timelinePosts.filter(p => p.author.name === 'Ahbap Derneği'),
        opportunities: volunteeringOpportunities.filter(o => o.ngoId === '2')
    },
     {
        id: '3',
        name: 'Tohum Otizm Vakfı',
        category: 'Eğitim',
        type: 'Vakıf',
        avatarUrl: 'https://logo.clearbit.com/tohumotizm.org.tr',
        coverPhotoUrl: 'https://picsum.photos/seed/tohum-cover/1200/400',
        stats: {
            followers: 350000,
            donors: 80000,
            volunteers: 12000,
            volunteerHours: 90000,
            projects: 80,
            totalDonation: 950000,
            donationCount: 95000,
            avgDonation: 10.00,
            highestSingleDonation: 250,
            peopleReached: 100000,
        },
        transparencyScore: 88,
        about: "Tohum Otizm Vakfı, otizmli çocukların erken tanısının konulması, özel eğitimi ile topluma kazandırılmasına öncülük edilmesi ve bunun yurt çapında yaygınlaştırılması amacıyla, kâr amacı gütmeyen bir sivil toplum kuruluşu olarak 2003 yılında kurulmuştur.",
        joinDate: "2023-04-01",
        supportedSDGs: ['Nitelikli Eğitim', 'Eşitsizliklerin Azaltılması', 'Sağlıklı ve Kaliteli Yaşam'],
        beneficiaryGroups: ['Çocuklar', 'Engelliler', 'Aileler'],
        memberOf: ['Açık Açık'],
        contact: {
            email: 'info@tohumotizm.org.tr', phone: '0212 244 75 00', website: 'https://www.tohumotizm.org.tr',
            social: { twitter: 'tohumotizm', instagram: 'tohumotizm', facebook: 'tohumotizm', linkedin: 'tohum-otizm-vakfi' }
        },
        economicEnterpriseUrl: '/market/25',
        posts: [],
        opportunities: volunteeringOpportunities.filter(o => o.ngoId === '3')
    },
];

export const allEntityLists: Brand[] = [
    // Existing Brands with details
    { 
        id: '1', 
        name: 'Ayakkabı Dünyası', 
        category: 'Ayakkabı', 
        donationRate: 8, 
        logoUrl: 'https://logo.clearbit.com/ayakkabidunyasi.com.tr', 
        link: '#', 
        followers: 150000, 
        type: 'brand',
        about: "Ayakkabı Dünyası olarak, en trend ve kaliteli ayakkabıları sizlerle buluştururken, topluma karşı sorumluluklarımızı da unutmuyoruz. Yaptığımız her satışla, adımlarımızı daha iyi bir geleceğe atmayı hedefliyoruz.\n\nSürdürülebilirlik ve sosyal fayda ilkelerini benimseyerek, Hangel platformu aracılığıyla seçtiğiniz sivil toplum kuruluşlarına destek olmanızı sağlıyoruz. Birlikte daha güçlüyüz!",
        joinDate: "2023-03-15",
        stats: { supporters: 15234, totalDonation: 45780, monthlyFollowerGrowth: 12, profileViews: 12400, profileShares: 1800, },
        donationByCategory: [
            { category: "Kadın Ayakkabı", rate: 8 }, { category: "Erkek Ayakkabı", rate: 8 }, { category: "Çocuk Ayakkabı", rate: 10 },
            { category: "Çanta & Aksesuar", rate: 12 }, { category: "Terlik & Sandalet", rate: 7 },
        ],
        sustainabilityReports: [ { title: "2023 Sürdürülebilirlik Raporu", url: "#" }, { title: "2024 İlk Çeyrek Etki Raporu", url: "#" },]
    },
    { id: '2', name: 'Decathlon', category: 'Spor Giyim', donationRate: 5, logoUrl: 'https://logo.clearbit.com/decathlon.com.tr', link: '#', followers: 1200000, type: 'brand' },
    { id: '3', name: 'Sportstyle', category: 'Spor Giyim', donationRate: 10, logoUrl: 'https://logo.clearbit.com/sportstyle.com.tr', link: '#', followers: 50000, type: 'brand' },
    { id: '4', name: 'Sneakscloud', category: 'Ayakkabı', donationRate: 12, logoUrl: 'https://logo.clearbit.com/sneakscloud.com', link: '#', followers: 200000, type: 'brand' },
    { id: '5', name: 'Sportive', category: 'Spor Giyim', donationRate: 7, logoUrl: 'https://logo.clearbit.com/sportive.com.tr', link: '#', followers: 300000, type: 'brand' },
    { id: '6', name: 'FashFed', category: 'Giyim', donationRate: 10, logoUrl: 'https://logo.clearbit.com/fashfed.com', link: '#', followers: 150000, type: 'brand' },
    { id: '7', name: 'Skechers', category: 'Ayakkabı', donationRate: 6, logoUrl: 'https://logo.clearbit.com/skechers.com.tr', link: '#', followers: 2500000, type: 'brand' },
    { id: '8', name: 'MarkaStok', category: 'Giyim', donationRate: 15, logoUrl: 'https://logo.clearbit.com/markastok.com', link: '#', followers: 80000, type: 'brand' },
    { id: '9', name: 'Fashfed Mobile', category: 'Giyim', donationRate: 10, logoUrl: 'https://logo.clearbit.com/fashfed.com', link: '#', followers: 100000, type: 'brand' },
    { id: '10', name: 'Playsports', category: 'Spor Giyim', donationRate: 8, logoUrl: 'https://logo.clearbit.com/playsports.com.tr', link: '#', followers: 40000, type: 'brand' },
    { id: '11', name: 'Columbia', category: 'Outdoor', donationRate: 7, logoUrl: 'https://logo.clearbit.com/columbia.com', link: '#', followers: 1000000, type: 'brand' },
    { id: '12', name: 'Converse', category: 'Ayakkabı', donationRate: 5, logoUrl: 'https://logo.clearbit.com/converse.com', link: '#', followers: 3000000, type: 'brand' },
    { id: '13', name: 'Beymen', category: 'Giyim', donationRate: 4, logoUrl: 'https://logo.clearbit.com/beymen.com', link: '#', followers: 5000000, type: 'brand' },
    { id: '14', name: 'Network', category: 'Giyim', donationRate: 6, logoUrl: 'https://logo.clearbit.com/network.com.tr', link: '#', followers: 800000, type: 'brand' },
    { id: '15', name: 'İpekyol', category: 'Giyim', donationRate: 7, logoUrl: 'https://logo.clearbit.com/ipekyol.com.tr', link: '#', followers: 1500000, type: 'brand' },
    { id: '16', name: 'MediaMarkt', category: 'Elektronik', donationRate: 2, logoUrl: 'https://logo.clearbit.com/mediamarkt.com.tr', link: '#', followers: 4000000, type: 'brand' },
    { id: '17', name: 'Vatan Bilgisayar', category: 'Elektronik', donationRate: 2, logoUrl: 'https://logo.clearbit.com/vatanbilgisayar.com', link: '#', followers: 3000000, type: 'brand' },
    { id: '18', name: 'Paşabahçe', category: 'Ev & Yaşam', donationRate: 8, logoUrl: 'https://logo.clearbit.com/pasabahcemagazalari.com', link: '#', followers: 2000000, type: 'brand' },
    { id: '19', name: 'Karaca', category: 'Ev & Yaşam', donationRate: 10, logoUrl: 'https://logo.clearbit.com/karaca.com', link: '#', followers: 6000000, type: 'brand' },
    { id: '20', name: 'Tire Süt Kooperatifi', category: 'Süpermarket', donationRate: 10, logoUrl: 'https://logo.clearbit.com/tiresut.com.tr', type: 'cooperative', followers: 5000 },
    { id: '21', name: 'İğne Oya Kooperatifi', category: 'Giyim', donationRate: 15, logoUrl: '', type: 'cooperative', followers: 2000 },
    { id: '22', name: 'Good4Trust', category: 'Pazaryeri', donationRate: 0, logoUrl: 'https://logo.clearbit.com/good4trust.org', type: 'social', followers: 10000 },
    { id: '23', name: 'Fazla Gıda', category: 'Teknoloji', donationRate: 0, logoUrl: 'https://logo.clearbit.com/fazlagida.com', type: 'social', followers: 8000 },
    { id: '24', name: 'LÖSEV - LSV Dükkan', category: 'Pazaryeri', donationRate: 100, logoUrl: 'https://logo.clearbit.com/lsvdukkan.com', type: 'economic', followers: 25000 },
    { id: '25', name: 'Tohum Otizm Vakfı İktisadi İşletmesi', category: 'Eğitim', donationRate: 100, logoUrl: 'https://logo.clearbit.com/tohumotizm.org.tr', type: 'economic', followers: 15000 },
    
    // New Brands from the user list
    { id: '113', name: 'Hotiç', category: 'Ayakkabı', donationRate: 7, logoUrl: 'https://logo.clearbit.com/hotic.com.tr', followers: 500000, type: 'brand' },
    { id: '114', name: 'SuperStep', category: 'Ayakkabı', donationRate: 6, logoUrl: 'https://logo.clearbit.com/superstep.com.tr', followers: 1000000, type: 'brand' },
    { id: '115', name: 'Houseofsuperstep', category: 'Ayakkabı', donationRate: 6, logoUrl: 'https://logo.clearbit.com/superstep.com.tr', followers: 100000, type: 'brand' },
    { id: '116', name: 'PUMA', category: 'Spor Giyim', donationRate: 5, logoUrl: 'https://logo.clearbit.com/puma.com', followers: 5000000, type: 'brand' },
    { id: '117', name: 'Sporthink', category: 'Spor Giyim', donationRate: 9, logoUrl: 'https://logo.clearbit.com/sporthink.com.tr', followers: 60000, type: 'brand' },
    { id: '118', name: 'FLO', category: 'Ayakkabı', donationRate: 4, logoUrl: 'https://logo.clearbit.com/flo.com.tr', followers: 3000000, type: 'brand' },
    { id: '119', name: 'Intersport', category: 'Spor Giyim', donationRate: 5, logoUrl: 'https://logo.clearbit.com/intersport.com.tr', followers: 400000, type: 'brand' },
    { id: '120', name: 'The Moose Bay', category: 'Outdoor', donationRate: 10, logoUrl: 'https://logo.clearbit.com/themoosebay.com', followers: 30000, type: 'brand' },
    { id: '121', name: 'Sporpark', category: 'Spor Giyim', donationRate: 8, logoUrl: 'https://logo.clearbit.com/sporpark.com.tr', followers: 25000, type: 'brand' },
    { id: '122', name: 'Gratis', category: 'Kişisel Bakım', donationRate: 3, logoUrl: 'https://logo.clearbit.com/gratis.com', followers: 2000000, type: 'brand' },
    { id: '123', name: 'Lona Cosmetics', category: 'Kişisel Bakım', donationRate: 12, logoUrl: 'https://logo.clearbit.com/lonacosmetics.com', followers: 15000, type: 'brand' },
    { id: '124', name: 'Arkopharma', category: 'Sağlık', donationRate: 10, logoUrl: 'https://logo.clearbit.com/arkopharma.com.tr', followers: 10000, type: 'brand' },
    { id: '125', name: 'Flormar', category: 'Kişisel Bakım', donationRate: 8, logoUrl: 'https://logo.clearbit.com/flormar.com.tr', followers: 1500000, type: 'brand' },
    { id: '126', name: 'Cosmed', category: 'Kişisel Bakım', donationRate: 15, logoUrl: 'https://logo.clearbit.com/cosmed.com.tr', followers: 100000, type: 'brand' },
    { id: '127', name: 'Supplementler', category: 'Sağlık', donationRate: 10, logoUrl: 'https://logo.clearbit.com/supplementler.com', followers: 200000, type: 'brand' },
    { id: '128', name: 'Vitaminler', category: 'Sağlık', donationRate: 10, logoUrl: 'https://logo.clearbit.com/vitaminler.com', followers: 150000, type: 'brand' },
    { id: '129', name: 'CocoBody', category: 'Kişisel Bakım', donationRate: 12, logoUrl: '', followers: 5000, type: 'brand' },
    { id: '130', name: 'Recete', category: 'Sağlık', donationRate: 8, logoUrl: 'https://logo.clearbit.com/recete.com', followers: 20000, type: 'brand' },
    { id: '131', name: 'Kuaförümden.com', category: 'Kişisel Bakım', donationRate: 10, logoUrl: 'https://logo.clearbit.com/kuaforumden.com', followers: 30000, type: 'brand' },
    { id: '132', name: 'Tatilbudur', category: 'Tatil & Seyahat', donationRate: 3, logoUrl: 'https://logo.clearbit.com/tatilbudur.com', followers: 800000, type: 'brand' },
    { id: '133', name: 'Etstur', category: 'Tatil & Seyahat', donationRate: 2, logoUrl: 'https://logo.clearbit.com/etstur.com', followers: 1000000, type: 'brand' },
    { id: '134', name: 'Touristica', category: 'Tatil & Seyahat', donationRate: 4, logoUrl: 'https://logo.clearbit.com/touristica.com.tr', followers: 300000, type: 'brand' },
    { id: '135', name: 'SETUR', category: 'Tatil & Seyahat', donationRate: 3, logoUrl: 'https://logo.clearbit.com/setur.com.tr', followers: 500000, type: 'brand' },
    { id: '136', name: 'miniyol.com', category: 'Tatil & Seyahat', donationRate: 5, logoUrl: 'https://logo.clearbit.com/miniyol.com', followers: 50000, type: 'brand' },
    { id: '137', name: 'Ucuzabilet', category: 'Bilet', donationRate: 2, logoUrl: 'https://logo.clearbit.com/ucuzabilet.com', followers: 600000, type: 'brand' },
    { id: '138', name: 'Tatildekirala.com', category: 'Tatil & Seyahat', donationRate: 6, logoUrl: 'https://logo.clearbit.com/tatildekirala.com', followers: 40000, type: 'brand' },
    { id: '139', name: 'bilet.com', category: 'Bilet', donationRate: 3, logoUrl: 'https://logo.clearbit.com/bilet.com', followers: 400000, type: 'brand' },
    { id: '140', name: 'Samsonite', category: 'Aksesuar', donationRate: 5, logoUrl: 'https://logo.clearbit.com/samsonite.com.tr', followers: 300000, type: 'brand' },
    { id: '141', name: 'Suwen', category: 'Giyim', donationRate: 8, logoUrl: 'https://logo.clearbit.com/suwen.com.tr', followers: 400000, type: 'brand' },
    { id: '142', name: 'Aker', category: 'Giyim', donationRate: 7, logoUrl: 'https://logo.clearbit.com/aker.com.tr', followers: 600000, type: 'brand' },
    { id: '143', name: 'Mizalle', category: 'Giyim', donationRate: 10, logoUrl: 'https://logo.clearbit.com/mizalle.com', followers: 200000, type: 'brand' },
    { id: '144', name: 'Twist', category: 'Giyim', donationRate: 7, logoUrl: 'https://logo.clearbit.com/twist.com.tr', followers: 700000, type: 'brand' },
    { id: '145', name: 'Slazenger', category: 'Spor Giyim', donationRate: 9, logoUrl: 'https://logo.clearbit.com/slazenger.com.tr', followers: 300000, type: 'brand' },
    { id: '146', name: 'Koton', category: 'Giyim', donationRate: 5, logoUrl: 'https://logo.clearbit.com/koton.com', followers: 4000000, type: 'brand' },
    { id: '147', name: 'H&M', category: 'Giyim', donationRate: 3, logoUrl: 'https://logo.clearbit.com/hm.com', followers: 10000000, type: 'brand' },
    { id: '148', name: 'Machka', category: 'Giyim', donationRate: 6, logoUrl: 'https://logo.clearbit.com/machka.com.tr', followers: 400000, type: 'brand' },
    { id: '149', name: 'Fitmoda', category: 'Spor Giyim', donationRate: 10, logoUrl: 'https://logo.clearbit.com/fitmoda.com', followers: 100000, type: 'brand' },
    { id: '150', name: 'Boyner', category: 'Pazaryeri', donationRate: 4, logoUrl: 'https://logo.clearbit.com/boyner.com.tr', followers: 2500000, type: 'brand' },
    { id: '151', name: 'Dagi', category: 'Giyim', donationRate: 8, logoUrl: 'https://logo.clearbit.com/dagi.com.tr', followers: 300000, type: 'brand' },
    { id: '152', name: 'Addax.com.tr', category: 'Giyim', donationRate: 10, logoUrl: 'https://logo.clearbit.com/addax.com.tr', followers: 500000, type: 'brand' },
    { id: '153', name: 'Marks & Spencer', category: 'Giyim', donationRate: 5, logoUrl: 'https://logo.clearbit.com/marksandspencer.com.tr', followers: 800000, type: 'brand' },
    { id: '154', name: 'GAP', category: 'Giyim', donationRate: 5, logoUrl: 'https://logo.clearbit.com/gap.com.tr', followers: 1200000, type: 'brand' },
    { id: '155', name: 'Mango', category: 'Giyim', donationRate: 4, logoUrl: 'https://logo.clearbit.com/shop.mango.com', followers: 3000000, type: 'brand' },
    { id: '156', name: 'Divarese', category: 'Ayakkabı', donationRate: 6, logoUrl: 'https://logo.clearbit.com/divarese.com.tr', followers: 250000, type: 'brand' },
    { id: '157', name: 'LTB', category: 'Giyim', donationRate: 8, logoUrl: 'https://logo.clearbit.com/ltbjeans.com', followers: 800000, type: 'brand' },
    { id: '158', name: 'Benetton', category: 'Giyim', donationRate: 6, logoUrl: 'https://logo.clearbit.com/benetton.com', followers: 1000000, type: 'brand' },
    { id: '159', name: 'JeansLab', category: 'Giyim', donationRate: 12, logoUrl: 'https://logo.clearbit.com/jeanslab.com', followers: 50000, type: 'brand' },
    { id: '160', name: 'ElbiseBul', category: 'Giyim', donationRate: 10, logoUrl: '', followers: 20000, type: 'brand' },
    { id: '161', name: 'Colins', category: 'Giyim', donationRate: 7, logoUrl: 'https://logo.clearbit.com/colins.com.tr', followers: 1500000, type: 'brand' },
    { id: '162', name: 'Kip', category: 'Giyim', donationRate: 6, logoUrl: 'https://logo.clearbit.com/kip.com.tr', followers: 200000, type: 'brand' },
    { id: '163', name: 'Lidyana', category: 'Pazaryeri', donationRate: 10, logoUrl: 'https://logo.clearbit.com/lidyana.com', followers: 500000, type: 'brand' },
    { id: '164', name: 'DS Damat', category: 'Giyim', donationRate: 5, logoUrl: 'https://logo.clearbit.com/dsdamat.com', followers: 600000, type: 'brand' },
    { id: '165', name: 'Hemington', category: 'Giyim', donationRate: 7, logoUrl: 'https://logo.clearbit.com/hemington.com.tr', followers: 100000, type: 'brand' },
    { id: '166', name: 'Altınyıldız', category: 'Giyim', donationRate: 5, logoUrl: 'https://logo.clearbit.com/altinyildizclassics.com', followers: 1000000, type: 'brand' },
    { id: '167', name: 'Yargıcı', category: 'Giyim', donationRate: 6, logoUrl: 'https://logo.clearbit.com/yargici.com', followers: 500000, type: 'brand' },
    { id: '168', name: 'Nautica', category: 'Giyim', donationRate: 7, logoUrl: 'https://logo.clearbit.com/nautica-tr.com', followers: 300000, type: 'brand' },
    { id: '169', name: 'Wrangler', category: 'Giyim', donationRate: 8, logoUrl: 'https://logo.clearbit.com/wrangler.com.tr', followers: 200000, type: 'brand' },
    { id: '170', name: 'Gant', category: 'Giyim', donationRate: 6, logoUrl: 'https://logo.clearbit.com/gant.com.tr', followers: 400000, type: 'brand' },
    { id: '171', name: 'Pierre Cardin', category: 'Giyim', donationRate: 5, logoUrl: 'https://logo.clearbit.com/pierrecardin.com.tr', followers: 800000, type: 'brand' },
    { id: '172', name: 'Avva', category: 'Giyim', donationRate: 7, logoUrl: 'https://logo.clearbit.com/avva.com.tr', followers: 500000, type: 'brand' },
    { id: '173', name: 'Ramsey', category: 'Giyim', donationRate: 6, logoUrl: 'https://logo.clearbit.com/ramsey.com.tr', followers: 300000, type: 'brand' },
    { id: '174', name: 'Kayra', category: 'Giyim', donationRate: 8, logoUrl: 'https://logo.clearbit.com/kayra.com', followers: 400000, type: 'brand' },
    { id: '175', name: 'Black Spade', category: 'Giyim', donationRate: 9, logoUrl: 'https://logo.clearbit.com/blackspade.com.tr', followers: 100000, type: 'brand' },
    { id: '176', name: 'SPX', category: 'Spor Giyim', donationRate: 7, logoUrl: 'https://logo.clearbit.com/spx.com.tr', followers: 200000, type: 'brand' },
    { id: '177', name: 'Cacharel', category: 'Giyim', donationRate: 6, logoUrl: 'https://logo.clearbit.com/cacharel.com.tr', followers: 150000, type: 'brand' },
    { id: '178', name: 'Scooter', category: 'Ayakkabı', donationRate: 8, logoUrl: 'https://logo.clearbit.com/scooter.com.tr', followers: 100000, type: 'brand' },
    { id: '179', name: 'Tudors', category: 'Giyim', donationRate: 10, logoUrl: 'https://logo.clearbit.com/tudors.com', followers: 400000, type: 'brand' },
    { id: '180', name: 'Lacoste', category: 'Giyim', donationRate: 4, logoUrl: 'https://logo.clearbit.com/lacoste.com.tr', followers: 1500000, type: 'brand' },
    { id: '181', name: 'US Polo', category: 'Giyim', donationRate: 5, logoUrl: 'https://logo.clearbit.com/tr.uspoloassn.com', followers: 2000000, type: 'brand' },
    { id: '182', name: 'Carter’s', category: 'Bebek & Çocuk', donationRate: 7, logoUrl: 'https://logo.clearbit.com/cartersoshkosh.com.tr', followers: 300000, type: 'brand' },
    { id: '183', name: 'E-bebek', category: 'Bebek & Çocuk', donationRate: 4, logoUrl: 'https://logo.clearbit.com/e-bebek.com', followers: 1000000, type: 'brand' },
    { id: '184', name: 'Jacadi', category: 'Bebek & Çocuk', donationRate: 6, logoUrl: 'https://logo.clearbit.com/jacadi.com.tr', followers: 50000, type: 'brand' },
    { id: '185', name: 'Toyzz Shop', category: 'Bebek & Çocuk', donationRate: 5, logoUrl: 'https://logo.clearbit.com/toyzzshop.com', followers: 700000, type: 'brand' },
    { id: '186', name: 'Doğtaş', category: 'Ev & Yaşam', donationRate: 4, logoUrl: 'https://logo.clearbit.com/dogtas.com', followers: 800000, type: 'brand' },
    { id: '187', name: 'Kelebek Mobilya', category: 'Ev & Yaşam', donationRate: 4, logoUrl: 'https://logo.clearbit.com/kelebek.com.tr', followers: 600000, type: 'brand' },
    { id: '188', name: 'Koçtaş', category: 'Ev & Yaşam', donationRate: 3, logoUrl: 'https://logo.clearbit.com/koctas.com.tr', followers: 1500000, type: 'brand' },
    { id: '189', name: 'Bella Maison', category: 'Ev & Yaşam', donationRate: 8, logoUrl: 'https://logo.clearbit.com/bellamaison.com', followers: 400000, type: 'brand' },
    { id: '190', name: 'Mobeseavm', category: 'Ev & Yaşam', donationRate: 10, logoUrl: '', followers: 20000, type: 'brand' },
    { id: '191', name: 'Homend', category: 'Ev & Yaşam', donationRate: 9, logoUrl: 'https://logo.clearbit.com/homend.com.tr', followers: 150000, type: 'brand' },
    { id: '192', name: 'Yatsan', category: 'Ev & Yaşam', donationRate: 6, logoUrl: 'https://logo.clearbit.com/yatsan.com', followers: 300000, type: 'brand' },
    { id: '193', name: 'Arçelik', category: 'Elektronik', donationRate: 2, logoUrl: 'https://logo.clearbit.com/arcelik.com.tr', followers: 2000000, type: 'brand' },
    { id: '194', name: 'Mudo', category: 'Ev & Yaşam', donationRate: 5, logoUrl: 'https://logo.clearbit.com/mudo.com.tr', followers: 1000000, type: 'brand' },
    { id: '195', name: 'Hisar', category: 'Ev & Yaşam', donationRate: 8, logoUrl: 'https://logo.clearbit.com/hisar.com.tr', followers: 200000, type: 'brand' },
    { id: '196', name: 'Beko', category: 'Elektronik', donationRate: 2, logoUrl: 'https://logo.clearbit.com/beko.com.tr', followers: 1800000, type: 'brand' },
    { id: '197', name: 'Fakir', category: 'Elektronik', donationRate: 7, logoUrl: 'https://logo.clearbit.com/fakir.com.tr', followers: 400000, type: 'brand' },
    { id: '198', name: 'Korkmazstore.com.tr', category: 'Ev & Yaşam', donationRate: 8, logoUrl: 'https://logo.clearbit.com/korkmazstore.com.tr', followers: 300000, type: 'brand' },
    { id: '199', name: 'Taç', category: 'Ev & Yaşam', donationRate: 7, logoUrl: 'https://logo.clearbit.com/tac.com.tr', followers: 800000, type: 'brand' },
    { id: '200', name: 'Linens', category: 'Ev & Yaşam', donationRate: 6, logoUrl: 'https://logo.clearbit.com/linens.com.tr', followers: 500000, type: 'brand' },
    { id: '201', name: 'Kütahya Porselen', category: 'Ev & Yaşam', donationRate: 9, logoUrl: 'https://logo.clearbit.com/kutahyaporselen.com', followers: 400000, type: 'brand' },
    { id: '202', name: 'A101', category: 'Süpermarket', donationRate: 1, logoUrl: 'https://logo.clearbit.com/a101.com.tr', followers: 3000000, type: 'brand' },
    { id: '203', name: 'Getir', category: 'Süpermarket', donationRate: 2, logoUrl: 'https://logo.clearbit.com/getir.com', followers: 5000000, type: 'brand' },
    { id: '204', name: 'CarrefourSA', category: 'Süpermarket', donationRate: 1, logoUrl: 'https://logo.clearbit.com/carrefoursa.com', followers: 2000000, type: 'brand' },
    { id: '205', name: 'Letgo', category: 'Pazaryeri', donationRate: 0, logoUrl: 'https://logo.clearbit.com/letgo.com', followers: 1000000, type: 'brand' },
    { id: '206', name: 'Pazarama', category: 'Pazaryeri', donationRate: 3, logoUrl: 'https://logo.clearbit.com/pazarama.com', followers: 800000, type: 'brand' },
    { id: '207', name: 'n11', category: 'Pazaryeri', donationRate: 2, logoUrl: 'https://logo.clearbit.com/n11.com', followers: 6000000, type: 'brand' },
    { id: '208', name: 'Occasion', category: 'Giyim', donationRate: 8, logoUrl: '', followers: 150000, type: 'brand' },
    { id: '209', name: 'Samsung', category: 'Elektronik', donationRate: 2, logoUrl: 'https://logo.clearbit.com/samsung.com', followers: 8000000, type: 'brand' },
    { id: '210', name: 'Xiaomi', category: 'Elektronik', donationRate: 3, logoUrl: 'https://logo.clearbit.com/mi.com', followers: 4000000, type: 'brand' },
    { id: '211', name: 'General Mobile', category: 'Elektronik', donationRate: 5, logoUrl: 'https://logo.clearbit.com/generalmobile.com', followers: 500000, type: 'brand' },
    { id: '212', name: 'Casper', category: 'Elektronik', donationRate: 4, logoUrl: 'https://logo.clearbit.com/casper.com.tr', followers: 600000, type: 'brand' },
    { id: '213', name: 'Anker', category: 'Elektronik', donationRate: 8, logoUrl: 'https://logo.clearbit.com/anker-tr.com', followers: 300000, type: 'brand' },
    { id: '214', name: 'Doremusic', category: 'Enstrüman', donationRate: 7, logoUrl: 'https://logo.clearbit.com/do-re.com.tr', followers: 100000, type: 'brand' },
    { id: '215', name: 'Natro Hosting', category: 'Diğer', donationRate: 10, logoUrl: 'https://logo.clearbit.com/natro.com', followers: 80000, type: 'brand' },
    { id: '216', name: 'Teknosa', category: 'Elektronik', donationRate: 2, logoUrl: 'https://logo.clearbit.com/teknosa.com', followers: 3000000, type: 'brand' },
    { id: '217', name: 'Huawei', category: 'Elektronik', donationRate: 3, logoUrl: 'https://logo.clearbit.com/huawei.com', followers: 2000000, type: 'brand' },
    { id: '218', name: 'Tchibo', category: 'Yeme & İçme', donationRate: 6, logoUrl: 'https://logo.clearbit.com/tchibo.com.tr', followers: 700000, type: 'brand' },
    { id: '219', name: 'Bialetti Kahve', category: 'Yeme & İçme', donationRate: 10, logoUrl: 'https://logo.clearbit.com/bialetti.com.tr', followers: 50000, type: 'brand' },
    { id: '220', name: 'Little Caesars', category: 'Yeme & İçme', donationRate: 4, logoUrl: 'https://logo.clearbit.com/littlecaesars.com.tr', followers: 400000, type: 'brand' },
    { id: '221', name: 'Mamaplus', category: 'Evcil Hayvan', donationRate: 10, logoUrl: 'https://logo.clearbit.com/mamaplus.com', followers: 80000, type: 'brand' },
    { id: '222', name: 'Oleamea', category: 'Yeme & İçme', donationRate: 12, logoUrl: 'https://logo.clearbit.com/oleamea.com.tr', followers: 20000, type: 'brand' },
    { id: '223', name: 'Fellas', category: 'Yeme & İçme', donationRate: 9, logoUrl: 'https://logo.clearbit.com/fellasfoods.com.tr', followers: 100000, type: 'brand' },
    { id: '224', name: 'Altınbaş', category: 'Mücevher', donationRate: 5, logoUrl: 'https://logo.clearbit.com/altinbas.com', followers: 500000, type: 'brand' },
    { id: '225', name: 'Saat&Saat', category: 'Saat', donationRate: 4, logoUrl: 'https://logo.clearbit.com/saatvesaat.com.tr', followers: 600000, type: 'brand' },
    { id: '226', name: 'Lizay Pırlanta', category: 'Mücevher', donationRate: 6, logoUrl: 'https://logo.clearbit.com/lizaypirlanta.com', followers: 200000, type: 'brand' },
    { id: '227', name: 'Konyalı Saat', category: 'Saat', donationRate: 5, logoUrl: 'https://logo.clearbit.com/konyalisaat.com.tr', followers: 300000, type: 'brand' },
    { id: '228', name: 'Zwilling', category: 'Ev & Yaşam', donationRate: 7, logoUrl: 'https://logo.clearbit.com/zwilling.com', followers: 100000, type: 'brand' },
    { id: '229', name: 'Hizlisaat.com', category: 'Saat', donationRate: 6, logoUrl: 'https://logo.clearbit.com/hizlisaat.com', followers: 150000, type: 'brand' },
    { id: '230', name: 'Idefix', category: 'Kitap & Kırtasiye', donationRate: 8, logoUrl: 'https://logo.clearbit.com/idefix.com', followers: 500000, type: 'brand' },
    { id: '231', name: 'D&R', category: 'Kitap & Kırtasiye', donationRate: 5, logoUrl: 'https://logo.clearbit.com/dr.com.tr', followers: 1500000, type: 'brand' },
    { id: '232', name: 'Vidyodan', category: 'Diğer', donationRate: 15, logoUrl: 'https://logo.clearbit.com/vidyodan.com', followers: 20000, type: 'brand' },
    { id: '233', name: 'Sosyopix', category: 'Çiçek & Hediye', donationRate: 10, logoUrl: 'https://logo.clearbit.com/sosyopix.com', followers: 400000, type: 'brand' },
    { id: '234', name: 'Tazecicek', category: 'Çiçek & Hediye', donationRate: 12, logoUrl: 'https://logo.clearbit.com/tazecicek.com', followers: 300000, type: 'brand' },
    { id: '235', name: 'Bloom and Fresh', category: 'Çiçek & Hediye', donationRate: 11, logoUrl: 'https://logo.clearbit.com/bloomandfresh.com', followers: 80000, type: 'brand' },
    { id: '236', name: 'Pocket eSIM', category: 'Diğer', donationRate: 15, logoUrl: 'https://logo.clearbit.com/pocketesim.com', followers: 10000, type: 'brand' },
    { id: '237', name: 'Airalo e-SIM', category: 'Diğer', donationRate: 10, logoUrl: 'https://logo.clearbit.com/airalo.com', followers: 200000, type: 'brand' },
    { id: '238', name: 'Tonguç Akademi', category: 'Eğitim', donationRate: 8, logoUrl: 'https://logo.clearbit.com/tongucakademi.com', followers: 500000, type: 'brand' },
    { id: '239', name: 'Petzzshop', category: 'Evcil Hayvan', donationRate: 9, logoUrl: 'https://logo.clearbit.com/petzzshop.com', followers: 100000, type: 'brand' },
    { id: '240', name: 'havhav.com.tr', category: 'Evcil Hayvan', donationRate: 10, logoUrl: 'https://logo.clearbit.com/havhav.com.tr', followers: 40000, type: 'brand' },
    { id: '241', name: 'Teknevia', category: 'Tatil & Seyahat', donationRate: 7, logoUrl: 'https://logo.clearbit.com/teknevia.com', followers: 15000, type: 'brand' },
];

export const events: Event[] = [
    {
      id: '1',
      name: 'Girişimcilik Zirvesi \'24',
      organizer: 'İTÜ Girişimcilik Kulübü',
      type: 'Zirve',
      date: '25 Ekim 2024 Cuma',
      time: '09:00 - 18:00',
      location: 'İTÜ Maslak Kampüsü, İstanbul',
      capacity: { current: 350, max: 500 },
      tags: ['Girişimcilik', 'Teknoloji', 'Networking'],
      imageUrl: 'https://picsum.photos/seed/event1/800/400',
      imageHint: 'business conference',
      description: 'Türkiye\'nin önde gelen girişimcileri, yatırımcıları ve öğrencileri bu zirvede buluşuyor! İlham veren konuşmalar, paneller ve networking fırsatları için yerinizi ayırtın.',
      providesCertificate: true
    },
     {
      id: '2',
      name: 'Sahil Temizliği Etkinliği',
      organizer: 'TEMA Vakfı',
      type: 'Gönüllülük',
      date: '15 Kasım 2024 Cumartesi',
      time: '10:00 - 14:00',
      location: 'Caddebostan Sahili, İstanbul',
      capacity: { current: 85, max: 150 },
      tags: ['Çevre', 'Gönüllülük', 'Sürdürülebilirlik'],
      imageUrl: 'https://picsum.photos/seed/event2/800/400',
      imageHint: 'beach cleanup volunteering',
      description: 'Daha temiz bir çevre için el ele veriyoruz. "Temiz Deniz, Sağlıklı Gelecek" projemiz kapsamında bu hafta sonu Caddebostan sahilini temizliyoruz. Eldiven ve çöp poşetleri bizden, enerjiniz sizden!',
      providesCertificate: false
    },
];

export const badges: Badge[] = [
    { id: '1', name: 'Çevre Koruyucusu', iconName: Leaf, level: 'Bronz', socialArea: 'Çevre', pointsRequired: 500, currentPoints: user.progress['Çevre'] * 10 },
    { id: '2', name: 'Çevre Koruyucusu', iconName: Leaf, level: 'Gümüş', socialArea: 'Çevre', pointsRequired: 1000, currentPoints: user.progress['Çevre'] * 10 },
    { id: '3', name: 'Çevre Koruyucusu', iconName: Leaf, level: 'Altın', socialArea: 'Çevre', pointsRequired: 2000, currentPoints: user.progress['Çevre'] * 10 },
    { id: '4', name: 'Çevre Koruyucusu', iconName: Leaf, level: 'Elmas', socialArea: 'Çevre', pointsRequired: 5000, currentPoints: user.progress['Çevre'] * 10 },
    
    { id: '5', name: 'Hayvan Dostu', iconName: PawPrint, level: 'Bronz', socialArea: 'Hayvan Hakları', pointsRequired: 500, currentPoints: user.progress['Hayvan Hakları'] * 10 },
    { id: '6', name: 'Hayvan Dostu', iconName: PawPrint, level: 'Gümüş', socialArea: 'Hayvan Hakları', pointsRequired: 1000, currentPoints: user.progress['Hayvan Hakları'] * 10 },
    { id: '7', name: 'Hayvan Dostu', iconName: PawPrint, level: 'Altın', socialArea: 'Hayvan Hakları', pointsRequired: 2000, currentPoints: user.progress['Hayvan Hakları'] * 10 },
    { id: '8', name: 'Hayvan Dostu', iconName: PawPrint, level: 'Elmas', socialArea: 'Hayvan Hakları', pointsRequired: 5000, currentPoints: user.progress['Hayvan Hakları'] * 10 },

    { id: '9', name: 'Eğitim Destekçisi', iconName: BookText, level: 'Bronz', socialArea: 'Eğitim', pointsRequired: 500, currentPoints: user.progress['Eğitim'] * 10 },
    { id: '10', name: 'Eğitim Destekçisi', iconName: BookText, level: 'Gümüş', socialArea: 'Eğitim', pointsRequired: 1000, currentPoints: user.progress['Eğitim'] * 10 },
    { id: '11', name: 'Eğitim Destekçisi', iconName: BookText, level: 'Altın', socialArea: 'Eğitim', pointsRequired: 2000, currentPoints: user.progress['Eğitim'] * 10 },
    { id: '12', name: 'Eğitim Destekçisi', iconName: BookText, level: 'Elmas', socialArea: 'Eğitim', pointsRequired: 5000, currentPoints: user.progress['Eğitim'] * 10 },

    { id: '13', name: 'Afet Kahramanı', iconName: Siren, level: 'Bronz', socialArea: 'Afet', pointsRequired: 500, currentPoints: user.progress['Afet'] * 10 },
    { id: '14', name: 'Afet Kahramanı', iconName: Siren, level: 'Gümüş', socialArea: 'Afet', pointsRequired: 1000, currentPoints: user.progress['Afet'] * 10 },
    { id: '15', name: 'Afet Kahramanı', iconName: Siren, level: 'Altın', socialArea: 'Afet', pointsRequired: 2000, currentPoints: user.progress['Afet'] * 10 },
    { id: '16', name: 'Afet Kahramanı', iconName: Siren, level: 'Elmas', socialArea: 'Afet', pointsRequired: 5000, currentPoints: user.progress['Afet'] * 10 },

];

export const certificates: Certificate[] = [
    { id: '1', title: 'Afet Bölgesi Yardım Dağıtımı Gönüllülük Sertifikası', organization: 'Ahbap Derneği', date: '2023-08-15', linkedinUrl: '#' },
    { id: '2', title: 'Proje Yönetimi Eğitimi Katılım Sertifikası', organization: 'Boğaziçi Üniversitesi', date: '2022-06-20', linkedinUrl: '#' },
];

export const applications: Application[] = [
  { id: '1', title: 'Afet Bölgesi Yardım Dağıtımı', type: 'Gönüllülük', org: 'Ahbap Derneği', date: '2024-07-15', location: 'Hatay, Antakya', status: 'Onaylandı' },
  { id: '2', title: 'Sosyal Medya İçerik Gönüllüsü', type: 'Gönüllülük', org: 'Tohum Otizm Vakfı', date: '2024-07-20', location: 'Online', status: 'Beklemede' },
  { id: '3', title: 'İTÜ Girişimcilik Kulübü Üyeliği', type: 'Kulüpler', org: 'İTÜ Girişimcilik Kulübü', date: '2024-06-01', location: 'İstanbul', status: 'Onaylandı' },
  { id: '4', title: 'Arama Kurtarma Gönüllüsü', type: 'Gönüllülük', org: 'AKUT', date: '2024-05-10', location: 'İstanbul', status: 'Reddedildi' },
];

export const donationTransactions: DonationTransaction[] = [
    { id: '1', type: 'expense', brand: 'Doğa Dostu Giyim', purchaseAmount: '250.00', donationAmount: '25.00', ngo: ['TEMA Vakfı', 'Ahbap Derneği'], date: '2024-07-21', time: '14:32' },
    { id: '2', type: 'expense', brand: 'Lezzet Köyü', purchaseAmount: '120.50', donationAmount: '12.05', ngo: ['Ahbap Derneği', 'Tohum Otizm Vakfı'], date: '2024-07-20', time: '18:10' },
    { id: '3', type: 'income', brand: 'Bakiye Yükleme', purchaseAmount: '500.00', donationAmount: '0.00', ngo: [], date: '2024-07-20', time: '10:00' },
    { id: '4', type: 'expense', brand: 'Tekno Market', purchaseAmount: '1500.00', donationAmount: '30.00', ngo: ['LÖSEV', 'TEGV'], date: '2024-07-19', time: '11:45' },
    { id: '5', type: 'expense', brand: 'Gezgin Rotalar', purchaseAmount: '800.00', donationAmount: '80.00', ngo: ['WWF Türkiye', 'TEMA Vakfı'], date: '2024-07-18', time: '20:05' },
];

export const managedItems: ManagedItem[] = [
    { name: 'Ahbap Derneği', type: 'STK', icon: 'heart-handshake', href: '/ngo-admin/dashboard', status: 'approved' },
    { name: 'Doğa Dostu Giyim', type: 'Marka', icon: 'store', href: '#', status: 'approved' },
    { name: 'İTÜ Girişimcilik Kulübü', type: 'Öğrenci Kulübü', icon: '/admin/clubs/profile/1', status: 'approved' },
    { name: 'Yeni Marka Başvurusu', type: 'Marka', icon: 'file-text', href: '#', status: 'pending' },
];

export const studentClubs: StudentClub[] = [
  { id: '1', name: 'İTÜ Girişimcilik Kulübü', university: 'İstanbul Teknik Üniversitesi', type: 'university', avatarUrl: 'https://logo.clearbit.com/itu.edu.tr', coverPhotoUrl: 'https://picsum.photos/seed/itu/1200/400', members: 1500, points: 12500, description: 'Türkiye\'nin en eski ve en büyük girişimcilik kulüplerinden biri.', vision: 'Girişimcilik ekosistemine yön veren lider bir gençlik hareketi olmak.', joinDate: '2023-05-20', contact: {email: 'gk@itu.edu.tr', phone: 'N/A', website: 'itugk.com'} },
  { id: '2', name: 'Boğaziçi Üniversitesi Müzik Kulübü', university: 'Boğaziçi Üniversitesi', type: 'university', avatarUrl: 'https://logo.clearbit.com/boun.edu.tr', coverPhotoUrl: 'https://picsum.photos/seed/boun/1200/400', members: 800, points: 7800, description: 'Müziğin her türünü yaşayan ve yaşatan bir topluluk.', vision: 'Müzikle insanları birleştirmek.', joinDate: '2023-09-10', contact: {email: 'bumk@boun.edu.tr', phone: 'N/A', website: 'bumk.org'} },
  { id: '3', name: 'Galatasaray Lisesi Sanat Kulübü', university: 'Galatasaray Lisesi', type: 'high-school', avatarUrl: 'https://logo.clearbit.com/gsl.gsu.edu.tr', coverPhotoUrl: 'https://picsum.photos/seed/gsl/1200/400', members: 120, points: 3400, description: 'Sanatın çeşitli dallarında üretim yapan lise kulübü.', vision: 'Genç sanatçılara ilham vermek.', joinDate: '2024-01-15', contact: {email: 'gsl-sanat@gsl.gsu.edu.tr', phone: 'N/A', website: '#'} },
];

export const schoolRepresentatives: SchoolRepresentative[] = Array.from({ length: 10 }, (_, i) => ({
    id: `${i + 1}`,
    name: ['Ali Vefa', 'Zeynep Çam', 'Mehmet Yılmaz', 'Ayşe Demir', 'Fatma Kaya', 'Can Öztürk', 'Elif Şahin', 'Barış Arslan', 'Deniz Aksoy', 'Ece Aydın'][i],
    school: i < 5 ? 'Boğaziçi Üniversitesi' : 'İstanbul Teknik Üniversitesi',
    type: 'university',
    role: i === 0 ? 'hangel Club Başkanı' : 'hangel Club Temsilcisi',
    avatarUrl: `https://i.pravatar.cc/150?u=rep${i}`,
    linkedinUrl: '#',
}));

export const pastVolunteering: Omit<Volunteering, 'volunteerCount' | 'points' | 'ngoTransparencyScore' >[] = [
    {
      id: 'past-1',
      title: 'Barınak Hayvanları Besleme Günü',
      organization: 'HAYTAP',
      ngoId: '4',
      location: { city: 'İstanbul', district: 'Ataşehir', type: 'Saha' },
      commitment: 'Tek Günlük (4 Saat)',
      dates: { applicationStart: "2024-05-01", applicationEnd: "2024-05-10", eventStart: "2024-05-12", eventEnd: "2024-05-12" },
      hours: { start: '13:00', end: '17:00', total: 4 },
      socialArea: 'Hayvan Hakları',
      amenities: { transport: false, food: false, accommodation: false },
      providesCertificate: false,
      earnedBadges: ['Hayvan Dostu'],
      hasPreTraining: false,
      description: 'Ataşehir Hayvan Barınağı\'ndaki dostlarımızı ziyaret edip beslenmelerine yardımcı olduk.',
      taskType: 'Tek Gün'
    }
];

export const adBanners: AdBanner[] = [
    { id: '1', title: 'Okul Alışverişiyle Destek Ol!', description: 'Kırtasiye ve okul ihtiyaçlarınızla TEGV\'e bağış yapın.', imageUrl: 'https://images.unsplash.com/photo-1766961557637-f40431f5839b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw5fHxzdHVkZW50JTIwc2Nob29sJTIwc3VwcGxpZXN8ZW58MHx8fHwxNzY4MzAwMjgxfDA&ixlib=rb-4.1.0&q=80&w=1080', link: '/market' },
    { id: '2', title: 'Tatile Çıkarken İyilik Yapın', description: 'Otel ve uçak rezervasyonlarınızla TEMA\'yı destekleyin.', imageUrl: 'https://images.unsplash.com/photo-1503220317375-aa068c833b36?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHx0cmF2ZWx8ZW58MHx8fHwxNzY4MTYyNDU1fDA&ixlib=rb-4.1.0&q=80&w=1080', link: '/market' },
    { id: '3', title: 'Modayı İyilikle Buluştur', description: 'Anlaşmalı giyim markalarından yapacağınız alışverişlerle LÖSEV\'e umut olun.', imageUrl: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxmYXNoaW9ufGVufDB8fHx8MTc2ODI3NDExN3ww&ixlib=rb-4.1.0&q=80&w=1080', link: '/market' },
];

export const helpTopics: HelpTopic[] = [
    {
        icon: 'user', title: 'Hesap ve Profil', slug: 'account', description: 'Profil bilgileri, şifre ve hesap ayarları hakkında yardım alın.',
        subtopics: [
            { title: 'Şifremi nasıl değiştiririm?', link: '#', content: '...' },
            { title: 'Profil bilgilerimi nasıl güncellerim?', link: '#', content: '...' },
        ]
    },
    {
        icon: 'heart-handshake', title: 'Gönüllülük', slug: 'volunteering', description: 'Gönüllülük süreçleri, başvurular ve puanlar hakkında her şey.',
        subtopics: [
            { title: 'Gönüllülük ilanına nasıl başvurulur?', link: '#', content: '...' },
            { title: 'Sosyal Etki Puanı nedir?', link: '#', content: '...' },
        ]
    },
    {
        icon: 'dollar-sign', title: 'Bağış ve Ödemeler', slug: 'donations', description: 'Bağış yapma, işlem geçmişi ve ödeme yöntemleri.',
        subtopics: [
            { title: 'Alışverişle bağış nasıl çalışır?', link: '#', content: '...' },
            { title: 'Bağışlarımın STK\'ya ulaştığını nasıl anlarım?', link: '#', content: '...' },
        ]
    },
    {
        icon: 'shield-check', title: 'Güvenlik ve Gizlilik', slug: 'security', description: 'Hesap güvenliği, veri gizliliği ve şikayet prosedürleri.',
        subtopics: [
            { title: 'İki faktörlü kimlik doğrulama nasıl etkinleştirilir?', link: '#', content: '...' },
            { title: 'Hesap bilgilerimin silinmesini nasıl talep edebilirim?', link: '#', content: '...' },
        ]
    },
    {
        icon: 'award', title: 'Rozetler ve Puanlar', slug: 'badges', description: 'Sosyal Etki Puanı kazanma ve rozetlerin anlamları.',
        subtopics: [
            { title: 'Sosyal Etki Puanı nasıl hesaplanır?', link: '#', content: '...' },
            { title: 'Rozet seviyeleri nelerdir?', link: '#', content: '...' },
        ]
    },
    {
        icon: 'smartphone', title: 'Teknik Sorunlar', slug: 'technical', description: 'Uygulama hataları, yavaşlama ve diğer teknik konular.',
        subtopics: [
            { title: 'Uygulama açılmıyor, ne yapmalıyım?', link: '#', content: '...' },
            { title: 'Bir hata mesajı alıyorum, ne anlama geliyor?', link: '#', content: '...' },
        ]
    },
];

export const ngoHelpTopics: HelpTopic[] = [
    {
        icon: 'building', title: 'Profil ve Yönetim', slug: 'ngo-profile', description: 'STK profilinizi yönetme, kullanıcı ekleme ve ayarlar.',
        subtopics: [
            { title: 'STK profil bilgilerini nasıl güncellerim?', link: '#', content: '...' },
            { title: 'Panele yeni yönetici nasıl eklenir?', link: '#', content: '...' },
        ]
    },
    {
        icon: 'heart-handshake', title: 'Gönüllülük Yönetimi', slug: 'ngo-volunteering', description: 'Gönüllülük ilanı oluşturma ve başvuruları yönetme.',
        subtopics: [
            { title: 'Yeni bir gönüllülük ilanı nasıl oluşturulur?', link: '#', content: '...' },
            { title: 'Gönüllü başvurularını nasıl değerlendiririm?', link: '#', content: '...' },
        ]
    },
    {
        icon: 'dollar-sign', title: 'Finansal Raporlar', slug: 'ngo-financials', description: 'Bağış takibi, hak edişler ve finansal raporlar.',
        subtopics: [
            { title: 'Aylık hak ediş raporumu nasıl görüntülerim?', link: '#', content: '...' },
            { title: 'Bağış işlem detaylarına nasıl ulaşırım?', link: '#', content: '...' },
        ]
    },
    {
        icon: 'shield-check', title: 'Şeffaflık Endeksi', slug: 'ngo-transparency', description: 'Şeffaflık puanınızı artırmak için gerekenler.',
        subtopics: [
            { title: 'Şeffaflık puanı nasıl hesaplanır?', link: '#', content: '...' },
            { title: 'Gerekli belgeleri nasıl yüklerim?', link: '#', content: '...' },
        ]
    },
];

export const ngoFaqArticles = [
    { title: 'STK\'mız için nasıl daha fazla bağışçıya ulaşabiliriz?' },
    { title: 'Gönüllü katılımını artırmak için ipuçları nelerdir?' },
    { title: 'Şeffaflık puanımız neden düştü?' },
    { title: 'Kurumsal işbirliği için markalarla nasıl iletişime geçebilirim?' },
    { title: 'Ödeme ve hak ediş süreçleri nasıl işliyor?' },
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
    { mainCategory: 'Bebek & Çocuk', subCategories: [] },
    { mainCategory: 'Kitap & Kırtasiye', subCategories: [] },
    { mainCategory: 'Tatil & Seyahat', subCategories: [] },
    { mainCategory: 'Otomotiv', subCategories: [] },
    { mainCategory: 'Yeme & İçme', subCategories: [] },
    { mainCategory: 'Sağlık', subCategories: [] },
    { mainCategory: 'Mücevher', subCategories: [] },
    { mainCategory: 'Saat', subCategories: [] },
    { mainCategory: 'Aksesuar', subCategories: [] },
    { mainCategory: 'Spor Giyim', subCategories: [] },
    { mainCategory: 'Outdoor', subCategories: [] },
    { mainCategory: 'Evcil Hayvan', subCategories: [] },
    { mainCategory: 'Eğitim', subCategories: [] },
    { mainCategory: 'Enstrüman', subCategories: [] },
    { mainCategory: 'Çiçek & Hediye', subCategories: [] },
    { mainCategory: 'Fatura', subCategories: [] },
    { mainCategory: 'Sigorta', subCategories: [] },
    { mainCategory: 'Bilet', subCategories: [] },
    { mainCategory: 'Diğer', subCategories: [] },
];

export const categoryMapping = {
    'Pazaryeri': ['Pazaryeri'],
    'Giyim': ['Giyim'],
    'Ayakkabı': ['Ayakkabı'],
    'Kişisel Bakım': ['Kişisel Bakım'],
    'Elektronik': ['Elektronik'],
    'Ev & Yaşam': ['Ev & Yaşam'],
    'Süpermarket': ['Süpermarket'],
    'Bebek & Çocuk': ['Bebek & Çocuk'],
    'Kitap & Kırtasiye': ['Kitap & Kırtasiye'],
    'Tatil & Seyahat': ['Tatil & Seyahat'],
    'Otomotiv': ['Otomotiv'],
    'Yeme & İçme': ['Yeme & İçme'],
    'Sağlık': ['Sağlık'],
    'Mücevher': ['Mücevher'],
    'Saat': ['Saat'],
    'Aksesuar': ['Aksesuar'],
    'Spor Giyim': ['Spor Giyim'],
    'Outdoor': ['Outdoor'],
    'Evcil Hayvan': ['Evcil Hayvan'],
    'Eğitim': ['Eğitim'],
    'Enstrüman': ['Enstrüman'],
    'Çiçek & Hediye': ['Çiçek & Hediye'],
    'Fatura': ['Fatura'],
    'Sigorta': ['Sigorta'],
    'Bilet': ['Bilet'],
    'Diğer': ['Diğer', 'Teknoloji'],
};

  
