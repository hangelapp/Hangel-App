
import type { ImagePlaceholder } from './placeholder-images';
import { PlaceHolderImages } from './placeholder-images';
import type { Post, Brand, Event, Volunteering, Campaign, User, Badge, Certificate, StudentClub, SchoolRepresentative, Application, DonationTransaction, Notification, ManagedItem, NGO, AdBanner, HelpTopic, MarketCategory } from './types';
import { Award, Baby, Bot, Building, Calendar, CheckCircle, Dog, Download, Eye, Hand, Heart, HeartPulse, Home, Languages, Leaf, Linkedin, Mail, MapPin, Milestone, Pencil, Phone, QrCode, School, Share2, Shield, ShieldCheck, Sparkles, Star, Users, Utensils, PawPrint, Grape, Palette, Dumbbell, Siren, Briefcase, Handshake, Landmark, Plane, Cpu, Store, LayoutGrid, UserCircle, BookText, Settings2, HeartHandshake, Wallet, LucideIcon, DollarSign } from 'lucide-react';


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
        birthDate: '1992-08-25',
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
        languages: ['Türkçe (Ana Dil)', 'İngilizce (İleri)', 'Almanca (Orta)'],
        programs: ['VS Code', 'Figma', 'Docker'],
        licenses: ['B Sınıfı Ehliyet', 'A Sınıfı Ehliyet', 'İş Güvenliği Uzmanlığı'],
        documents: ['İlk Yardım Sertifikası', 'Scrum Master Sertifikası', 'Hijyen Belgesi'],
        travelInfo: { 
            domesticObstacle: false, 
            internationalObstacle: false,
            visas: ['Schengen', 'ABD (B1/B2)']
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

const marketBrands: Brand[] = [
    // Ayakkabı & Spor Giyim
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
        stats: {
            supporters: 15234,
            totalDonation: 45780,
            monthlyFollowerGrowth: 12,
            profileViews: 12400,
            profileShares: 1800,
        },
        donationByCategory: [
            { category: "Kadın Ayakkabı", rate: 8 },
            { category: "Erkek Ayakkabı", rate: 8 },
            { category: "Çocuk Ayakkabı", rate: 10 },
            { category: "Çanta & Aksesuar", rate: 12 },
            { category: "Terlik & Sandalet", rate: 7 },
        ],
        sustainabilityReports: [
            { title: "2023 Sürdürülebilirlik Raporu", url: "#" },
            { title: "2024 İlk Çeyrek Etki Raporu", url: "#" },
        ]
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
    
    // Giyim
    { id: '13', name: 'Beymen', category: 'Giyim', donationRate: 4, logoUrl: 'https://logo.clearbit.com/beymen.com', link: '#', followers: 5000000, type: 'brand' },
    { id: '14', name: 'Network', category: 'Giyim', donationRate: 6, logoUrl: 'https://logo.clearbit.com/network.com.tr', link: '#', followers: 800000, type: 'brand' },
    { id: '15', name: 'İpekyol', category: 'Giyim', donationRate: 7, logoUrl: 'https://logo.clearbit.com/ipekyol.com.tr', link: '#', followers: 1500000, type: 'brand' },
    
    // Elektronik
    { id: '16', name: 'MediaMarkt', category: 'Elektronik', donationRate: 2, logoUrl: 'https://logo.clearbit.com/mediamarkt.com.tr', link: '#', followers: 4000000, type: 'brand' },
    { id: '17', name: 'Vatan Bilgisayar', category: 'Elektronik', donationRate: 2, logoUrl: 'https://logo.clearbit.com/vatanbilgisayar.com', link: '#', followers: 3000000, type: 'brand' },
    
    // Ev & Yaşam
    { id: '18', name: 'Paşabahçe', category: 'Ev & Yaşam', donationRate: 8, logoUrl: 'https://logo.clearbit.com/pasabahcemagazalari.com', link: '#', followers: 2000000, type: 'brand' },
    { id: '19', name: 'Karaca', category: 'Ev & Yaşam', donationRate: 10, logoUrl: 'https://logo.clearbit.com/karaca.com', link: '#', followers: 6000000, type: 'brand' },

    // Kooperatifler
    { id: '20', name: 'Tire Süt Kooperatifi', category: 'Süpermarket', donationRate: 10, logoUrl: 'https://logo.clearbit.com/tiresut.com.tr', type: 'cooperative', followers: 5000 },
    { id: '21', name: 'İğne Oya Kooperatifi', category: 'Giyim', donationRate: 15, logoUrl: '', type: 'cooperative', followers: 2000 },

    // Sosyal İşletmeler
    { id: '22', name: 'Good4Trust', category: 'Pazaryeri', donationRate: 0, logoUrl: 'https://logo.clearbit.com/good4trust.org', type: 'social', followers: 10000 },
    { id: '23', name: 'Fazla Gıda', category: 'Teknoloji', donationRate: 0, logoUrl: 'https://logo.clearbit.com/fazlagida.com', type: 'social', followers: 8000 },

    // İktisadi İşletmeler
    { id: '24', name: 'LÖSEV - LSV Dükkan', category: 'Pazaryeri', donationRate: 100, logoUrl: 'https://logo.clearbit.com/lsvdukkan.com', type: 'economic', followers: 25000 },
    { id: '25', name: 'Tohum Otizm Vakfı İktisadi İşletmesi', category: 'Eğitim', donationRate: 100, logoUrl: 'https://logo.clearbit.com/tohumotizm.org.tr', type: 'economic', followers: 15000 },
];

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
            peopleReached: 5000000,
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
        opportunities: []
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
            peopleReached: 10000000,
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
        opportunities: []
    },
];

export const allEntityLists: Brand[] = [...marketBrands];

ngos.forEach(ngo => {
  ngo.opportunities = volunteeringOpportunities.filter(o => o.ngoId === ngo.id)
});

export const events: Event[] = [
    {
      id: '1',
      name: 'Girişimcilik Zirvesi \'24',
      organizer: 'İTÜ Girişimcilik Kulübü',
      type: 'Zirve',
      date: '25 Ekim 2024 Cuma',
      location: 'İTÜ Maslak Kampüsü, İstanbul',
      capacity: { current: 350, max: 500 },
      tags: ['Girişimcilik', 'Teknoloji', 'Networking'],
      imageUrl: 'https://picsum.photos/seed/event1/800/400',
      imageHint: 'business conference',
      description: 'Türkiye\'nin önde gelen girişimcileri, yatırımcıları ve öğrencileri bu zirvede buluşuyor! İlham veren konuşmalar, paneller ve networking fırsatları için yerinizi ayırtın.'
    },
     {
      id: '2',
      name: 'Sahil Temizliği Etkinliği',
      organizer: 'TEMA Vakfı',
      type: 'Gönüllülük',
      date: '15 Kasım 2024 Cumartesi',
      location: 'Caddebostan Sahili, İstanbul',
      capacity: { current: 85, max: 150 },
      tags: ['Çevre', 'Gönüllülük', 'Sürdürülebilirlik'],
      imageUrl: 'https://picsum.photos/seed/event2/800/400',
      imageHint: 'beach cleanup volunteering',
      description: 'Daha temiz bir çevre için el ele veriyoruz. "Temiz Deniz, Sağlıklı Gelecek" projemiz kapsamında bu hafta sonu Caddebostan sahilini temizliyoruz. Eldiven ve çöp poşetleri bizden, enerjiniz sizden!'
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
    { id: '1', type: 'expense', brand: 'Doğa Dostu Giyim', purchaseAmount: '250.00', donationAmount: '25.00', ngo: ['TEMA Vakfı'], date: '2024-07-21', time: '14:32' },
    { id: '2', type: 'expense', brand: 'Lezzet Köyü', purchaseAmount: '120.50', donationAmount: '12.05', ngo: ['Ahbap Derneği'], date: '2024-07-20', time: '18:10' },
    { id: '3', type: 'income', brand: 'Bakiye Yükleme', purchaseAmount: '500.00', donationAmount: '0.00', ngo: [], date: '2024-07-20', time: '10:00' },
    { id: '4', type: 'expense', brand: 'Tekno Market', purchaseAmount: '1500.00', donationAmount: '30.00', ngo: ['LÖSEV', 'TEGV'], date: '2024-07-19', time: '11:45' },
    { id: '5', type: 'expense', brand: 'Gezgin Rotalar', purchaseAmount: '800.00', donationAmount: '80.00', ngo: ['WWF Türkiye'], date: '2024-07-18', time: '20:05' },
];

export const managedItems: ManagedItem[] = [
    { name: 'Ahbap Derneği', type: 'STK', icon: 'heart-handshake', href: '/ngo-admin/dashboard', status: 'approved' },
    { name: 'Doğa Dostu Giyim', type: 'Marka', icon: 'store', href: '#', status: 'approved' },
    { name: 'İTÜ Girişimcilik Kulübü', type: 'Öğrenci Kulübü', icon: 'users', href: '/admin/clubs/profile/1', status: 'approved' },
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
    { mainCategory: 'Aksesuar', subCategories: [] },
    { mainCategory: 'Kozmetik', subCategories: [] },
    { mainCategory: 'Elektronik', subCategories: [] },
    { mainCategory: 'Süpermarket', subCategories: [] },
    { mainCategory: 'Ev & Yaşam', subCategories: [] },
    { mainCategory: 'Bebek & Çocuk', subCategories: [] },
    { mainCategory: 'Kitap & Kırtasiye', subCategories: [] },
    { mainCategory: 'Otomotiv', subCategories: [] },
    { mainCategory: 'Mücevher', subCategories: [] },
    { mainCategory: 'Saat', subCategories: [] },
    { mainCategory: 'Spor Giyim', subCategories: [] },
    { mainCategory: 'Outdoor', subCategories: [] },
    { mainCategory: 'Tatil & Seyahat', subCategories: [] },
];

export const categoryMapping = {
    'Giyim': ['Giyim'],
    'Ayakkabı': ['Ayakkabı'],
    'Aksesuar': ['Aksesuar', 'Mücevher', 'Saat'],
    'Kozmetik': ['Kozmetik'],
    'Elektronik': ['Elektronik'],
    'Süpermarket': ['Süpermarket'],
    'Ev & Yaşam': ['Ev & Yaşam'],
    'Bebek & Çocuk': ['Bebek & Çocuk'],
    'Kitap & Kırtasiye': ['Kitap & Kırtasiye'],
    'Otomotiv': ['Otomotiv'],
    'Pazaryeri': ['Pazaryeri'],
    'Spor Giyim': ['Spor Giyim'],
    'Outdoor': ['Outdoor'],
    'Tatil & Seyahat': ['Tatil & Seyahat'],
    'Mücevher': ['Mücevher'],
    'Saat': ['Saat'],
};
