
import type { ImagePlaceholder } from './placeholder-images';
import { PlaceHolderImages } from './placeholder-images';
import type { Post, Brand, Event, Volunteering, Campaign, User, Badge, Certificate, StudentClub, SchoolRepresentative, Application, DonationTransaction, Notification, ManagedItem, NGO } from './types';
import { Award, Baby, Bot, Building, Calendar, CheckCircle, Dog, Download, Eye, Hand, HandHeart, Heart, Home, Languages, Leaf, Linkedin, Mail, MapPin, Milestone, Pencil, Phone, QrCode, School, Share2, Shield, ShieldCheck, Sparkles, Star, Users, Utensils, Vision, Wallet, PawPrint, Grape, HeartPulse, Palette, Dumbbell, Siren, Briefcase, Handshake, Landmark, Plane, Cpu, Store, LayoutGrid } from 'lucide-react';


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
        phone: '+90 555 123 4567',
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
        licenses: ['B Sınıfı Ehliyet'],
        documents: ['İlk Yardım Sertifikası', 'Scrum Master Sertifikası'],
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
      avatarUrl: `https://picsum.photos/seed/author${i}/200`
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


export const marketBrands: Brand[] = [
    { id: '1', name: 'Doğa Dostu Giyim', category: 'Tekstil', donationRate: 15, logoUrl: getImage('brand-logo-1')?.imageUrl || '', logoHint: getImage('brand-logo-1')?.imageHint, link: '#', followers: 12000, type: 'brand' },
    { id: '2', name: 'Lezzet Köyü', category: 'Gıda', donationRate: 10, logoUrl: getImage('brand-logo-2')?.imageUrl || '', logoHint: getImage('brand-logo-2')?.imageHint, link: '#', followers: 8500, type: 'brand' },
    { id: '3', name: 'Gezgin Rotalar', category: 'Seyahat', donationRate: 8, logoUrl: getImage('brand-logo-3')?.imageUrl || '', logoHint: getImage('brand-logo-3')?.imageHint, link: '#', followers: 25000, type: 'brand' },
    { id: '4', name: 'Tekno Market', category: 'Teknoloji', donationRate: 5, logoUrl: getImage('brand-logo-4')?.imageUrl || '', logoHint: getImage('brand-logo-4')?.imageHint, link: '#', followers: 50000, type: 'brand' },
];

export const events: Event[] = Array.from({ length: 21 }, (_, i) => ({
  id: `${i + 1}`,
  name: i % 2 === 0 ? 'Sahil Temizliği Etkinliği' : 'Gençler İçin Kodlama Atölyesi',
  organizer: i % 2 === 0 ? 'TEMA Vakfı' : 'Teknasyon',
  type: i % 2 === 0 ? 'Farkındalık' : 'Eğitim',
  date: `2${i + 1} Temmuz - 14:00`,
  location: i % 2 === 0 ? 'İzmir, Alsancak' : 'Online',
  capacity: { current: 35 + i, max: 100 + i*2 },
  tags: i % 2 === 0 ? ['Çevre', 'Sertifika Var', 'Offline'] : ['Çocuk', 'Online'],
  imageUrl: i % 2 === 0 ? getImage('event-cover-1')?.imageUrl || '' : getImage('event-cover-2')?.imageUrl || '',
  imageHint: i % 2 === 0 ? getImage('event-cover-1')?.imageHint : getImage('event-cover-2')?.imageHint,
}));

export const volunteeringOpportunities: Volunteering[] = Array.from({ length: 21 }, (_, i) => ({
    id: `${i+1}`,
    title: ['Fransızca Tercüman Gönüllüsü', 'Afet Bölgesi Yardım Dağıtımı', 'Çocuklara Etüt Desteği'][i%3],
    organization: ['Sınır Tanımayan Doktorlar', 'Ahbap Derneği', 'TEGV'][i%3],
    ngoId: `${i%3 + 1}`,
    location: {
      city: ['Online', 'Hatay', 'İstanbul'][i%3],
      district: ['Online', 'Antakya', 'Kadıköy'][i%3],
      type: ['Online', 'Saha', 'Hibrit'][i%3] as 'Online' | 'Saha' | 'Hibrit',
    },
    skills: [['Fransızca', 'Tercümanlık'], ['Fiziksel Güç', 'Organizasyon'], ['Eğitmenlik', 'Sabır']][i%3],
    commitment: ['Haftada 5 saat', '1 hafta', 'Haftada 2 gün'][i%3],
    volunteerCount: { needed: 20, applications: 12 + i },
    dates: {
        applicationStart: '2024-07-01',
        applicationEnd: '2024-07-30',
        eventStart: '2024-08-05',
        eventEnd: '2024-08-12',
    },
    hours: { start: '09:00', end: '17:00', total: 40 },
    socialArea: ['Sağlık', 'Afet', 'Eğitim'][i%3],
    requirements: [['Adli Sicil Kaydı'], [], ['Sabıka Kaydı', 'Referans']][i%3],
    amenities: { transport: i % 2 === 0, food: true, accommodation: i % 3 === 0 },
    providesCertificate: i % 2 === 0,
    earnedBadges: [['language-master'], ['disaster-hero'], ['education-supporter']][i%3],
    hasPreTraining: i % 3 === 1,
    description: 'Bu görevde, belirlenen alanda ilgili yetkinliklerinizi kullanarak topluma fayda sağlayacaksınız.',
    points: 150 + i * 10,
    ngoTransparencyScore: 85 + i % 10,
    taskType: ['Dönemsel', 'Tek Gün', 'Sürekli'][i%3] as 'Tek Gün' | 'Dönemsel' | 'Sürekli'
}));


export const marketCampaigns: Campaign[] = [
  { id: '1', title: 'Okul Alışverişinde %15 Bağış!', description: 'Lezzet Köyü ile çocukları sevindir.', imageUrl: 'https://picsum.photos/seed/okul-kampanya/1200/400', imageHint: 'student school supplies' },
  { id: '2', title: 'Her Seyahat Bir Umut Olsun', description: 'Gezgin Rotalar ile doğayı koru.', imageUrl: getImage('campaign-banner-2')?.imageUrl || '', imageHint: getImage('campaign-banner-2')?.imageHint || '' },
  { id: '3', title: 'Teknoloji Alışverişiyle Eğitime Destek', description: 'Tekno Market\'ten yapacağın harcamalarla TEGV\'e destek ol.', imageUrl: 'https://picsum.photos/seed/tech-kampanya/1200/400', imageHint: 'laptop code' },
];


export const applications: Application[] = Array.from({ length: 21 }, (_, i) => {
    const types: Application['type'][] = ['Gönüllülük', 'Marka', 'Kulüpler', 'STK'];
    const statuses: Application['status'][] = ['Onaylandı', 'Beklemede', 'Reddedildi'];
    const orgs = ['TEMA Vakfı', 'Doğa Dostu Giyim', 'İTÜ Girişimcilik Kulübü', 'Ahbap Derneği'];
    const titles = ['Ağaç Dikme Etkinliği', 'Marka Ortaklık Başvurusu', 'Kulüp Üyeliği', 'STK Kayıt Başvurusu'];

    const type = types[i % types.length];
    return {
        id: `${i+1}`,
        title: titles[i % titles.length],
        type: type,
        org: orgs[i % orgs.length],
        date: `2024-06-${(i % 30) + 1}`,
        location: 'İstanbul',
        status: statuses[i % statuses.length],
    };
});

export const donationTransactions: DonationTransaction[] = Array.from({ length: 21 }, (_, i) => {
    const isIncome = i % 4 === 0;
    const ngos = [['TEMA Vakfı'], ['Ahbap Derneği'], ['LÖSEV'], ['TEMA Vakfı', 'LÖSEV']];
    return {
        id: `${i + 1}`,
        type: isIncome ? 'income' : 'expense',
        brand: isIncome ? 'Bakiye Yükleme' : ['Doğa Dostu Giyim', 'Lezzet Köyü', 'Tekno Market'][i % 3],
        purchaseAmount: isIncome ? `+${(i+1)*20}.00` : `-${(i+1)*15}.50`,
        donationAmount: isIncome ? '0.00' : `${((i+1)*1.5).toFixed(2)}`,
        ngo: isIncome ? [] : ngos[i % ngos.length],
        date: `2024-07-${(i % 30) + 1}`,
        time: `${i % 24}:${(i*3 % 60).toString().padStart(2, '0')}`,
    };
});

export const notifications: Notification[] = Array.from({ length: 21 }, (_, i) => {
    const types: Notification['type'][] = ['donation', 'application', 'badge', 'announcement'];
    const type = types[i % types.length];
    let title = '';
    let description = '';

    switch(type) {
        case 'donation':
            title = 'Bağışınız Ulaştı';
            description = `"Lezzet Köyü" alışverişinizden elde edilen ${(i*1.25).toFixed(2)} TL bağış Ahbap Derneği'ne ulaştı.`;
            break;
        case 'application':
            title = 'Başvurunuz Onaylandı!';
            description = '"Ağaç Kardeşliği" projesi için yaptığınız gönüllülük başvurusu TEMA Vakfı tarafından onaylandı.';
            break;
        case 'badge':
            title = 'Yeni Rozet Kazandın!';
            description = '"Doğa Koruyucusu" rozetini kazandınız. Tebrikler!';
            break;
        case 'announcement':
            title = 'Yeni Gönüllülük Fırsatı';
            description = 'TEGV, "Yaz Okulu" projesi için acil gönüllüler arıyor. Hemen başvur!';
            break;
    }

    return {
        id: `${i + 1}`,
        type: type,
        title: title,
        description: description,
        timestamp: `${i + 1} saat önce`,
        isRead: i % 5 === 0,
    };
});


export const managedItems: ManagedItem[] = [
  { name: 'Ahbap Derneği', type: 'STK', icon: Building, href: '/ngo-admin/dashboard', status: 'approved' },
  { name: 'Doğa Dostu Giyim', type: 'Marka', icon: Store, href: '/market/1', status: 'approved' },
  { name: 'İTÜ Girişimcilik Kulübü', type: 'Öğrenci Kulübü', icon: School, href: '/admin/clubs/profile/1', status: 'approved' },
  { name: 'Yeni Marka Başvurusu', type: 'Marka', icon: Store, href: '/admin/applications/brand/1', status: 'pending' },
  { name: 'Yeni STK Başvurusu', type: 'STK', icon: Building, href: '/admin/applications/ngo/1', status: 'pending' },
];

export const studentClubs: StudentClub[] = [
  { id: '1', name: 'İTÜ Girişimcilik Kulübü', university: 'İstanbul Teknik Üniversitesi', type: 'university', avatarUrl: 'https://picsum.photos/seed/itu/200', coverPhotoUrl: 'https://picsum.photos/seed/itu-cover/800/200', members: 120, points: 4500, description: 'İTÜ\'deki girişimcilik ekosistemini geliştirmeyi hedefler.', vision: 'Türkiye\'nin en iyi üniversite girişimcilik kulübü olmak.', joinDate: '2023-01-15', contact: { email: 'girisim@itu.edu.tr', phone: '123', website: 'itu.edu.tr' }, projects: 15, volunteerHours: 250, activeMemberRate: 80 },
  { id: '2', name: 'Boğaziçi Üniversitesi Müzik Kulübü', university: 'Boğaziçi Üniversitesi', type: 'university', avatarUrl: 'https://picsum.photos/seed/boun/200', coverPhotoUrl: 'https://picsum.photos/seed/boun-cover/800/200', members: 250, points: 7800, description: 'Müziğin her türüyle ilgilenen öğrencileri bir araya getirir.', vision: 'Üniversite içinde ve dışında konserler ve etkinlikler düzenlemek.', joinDate: '2022-11-20', contact: { email: 'music@boun.edu.tr', phone: '123', website: 'boun.edu.tr' }, projects: 30, volunteerHours: 400, activeMemberRate: 90 },
  { id: '3', name: 'Galatasaray Lisesi Sanat Kulübü', university: 'Galatasaray Lisesi', type: 'high-school', avatarUrl: 'https://picsum.photos/seed/gsl/200', coverPhotoUrl: 'https://picsum.photos/seed/gsl-cover/800/200', members: 80, points: 3200, description: 'Resim, heykel ve fotoğrafçılık gibi alanlarda atölyeler düzenler.', vision: 'Öğrencilerin sanatsal yeteneklerini keşfetmelerini sağlamak.', joinDate: '2023-05-10', contact: { email: 'sanat@gsl.edu.tr', phone: '123', website: 'gsl.edu.tr' }, projects: 10, volunteerHours: 150, activeMemberRate: 70 },
];

export const schoolRepresentatives: SchoolRepresentative[] = [
  { id: '1', name: 'Ali Vural', school: 'Boğaziçi Üniversitesi', type: 'university', role: 'Kulüp Başkanı', avatarUrl: 'https://picsum.photos/seed/rep1/200', linkedinUrl: '#' },
  { id: '2', name: 'Zeynep Kaya', school: 'Boğaziçi Üniversitesi', type: 'university', role: 'Başkan Yardımcısı', avatarUrl: 'https://picsum.photos/seed/rep2/200', linkedinUrl: '#' },
  { id: '3', name: 'Mehmet Öztürk', school: 'Boğaziçi Üniversitesi', type: 'university', role: 'Genel Sekreter', avatarUrl: 'https://picsum.photos/seed/rep3/200', linkedinUrl: '#' },
  { id: '4', name: 'Selin Arslan', school: 'Boğaziçi Üniversitesi', type: 'university', role: 'Sayman', avatarUrl: 'https://picsum.photos/seed/rep4/200', linkedinUrl: '#' },
  { id: '5', name: 'Can Demir', school: 'Boğaziçi Üniversitesi', type: 'university', role: 'Proje Koordinatörü', avatarUrl: 'https://picsum.photos/seed/rep5/200', linkedinUrl: '#' },
  { id: '6', name: 'Fatma Şahin', school: 'Galatasaray Lisesi', type: 'high-school', role: 'Okul Temsilcisi', avatarUrl: 'https://picsum.photos/seed/rep6/200', linkedinUrl: '#' },
  { id: '7', name: 'Emre Çelik', school: 'ODTÜ', type: 'university', role: 'Okul Temsilcisi', avatarUrl: 'https://picsum.photos/seed/rep7/200', linkedinUrl: '#', faculty: 'Mühendislik Fakültesi' },
  { id: '8', name: 'Deniz Aksoy', school: 'ODTÜ', type: 'university', role: 'Fakülte Temsilcisi', avatarUrl: 'https://picsum.photos/seed/rep8/200', linkedinUrl: '#', faculty: 'İİBF' },
  { id: '9', name: 'Ebru Yıldız', school: 'ODTÜ', type: 'university', role: 'Fakülte Temsilcisi', avatarUrl: 'https://picsum.photos/seed/rep9/200', linkedinUrl: '#', faculty: 'Fen-Edebiyat Fakültesi' }
];

export const pastVolunteering = Array.from({ length: 21 }, (_, i) => ({
    id: i + 1,
    title: `Proje ${i + 1}: Toplum Merkezi Yenileme`,
    organization: `STK ${i % 5 + 1}`,
    date: `2023-${(i % 12) + 1}-15`,
    certificateUrl: '#',
}));


export const certificates: Certificate[] = Array.from({ length: 3 }, (_, i) => ({
    id: `${i + 1}`,
    title: `Gönüllülük Katılım Sertifikası #${i + 1}`,
    organization: [`TEMA Vakfı`, 'Ahbap Derneği', 'TEGV'][i],
    date: `2023-11-${(i % 28) + 1}`,
    linkedinUrl: `https://linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=Gönüllülük+Katılım+Sertifikası&organizationId=12345&issueYear=2023&issueMonth=11&certId=${i+1}&certUrl=https://hangel.org/cert/${i+1}`
}));


export const badgeLevels: Badge['level'][] = ['Demir', 'Bakır', 'Bronz', 'Çelik', 'Gümüş', 'Altın', 'Platin', 'Elmas'];

export const badgeData: Omit<Badge, 'id' | 'level' | 'pointsRequired' | 'currentPoints'>[] = [
  { name: 'Hayvan Dostu', socialArea: 'Hayvan Hakları', iconName: PawPrint },
  { name: 'Çocuk Gelişimi', socialArea: 'Çocuk', iconName: Baby },
  { name: 'Doğa Koruyucusu', socialArea: 'Çevre', iconName: Leaf },
  { name: 'Kadın Destekçisi', socialArea: 'Kadın', iconName: Users },
  { name: 'Engel Tanımaz', socialArea: 'Engelli', iconName: ShieldCheck },
  { name: 'Yaşlı Dostu', socialArea: 'Yaşlı', iconName: Users },
  { name: 'Gençlik Lideri', socialArea: 'Gençlik', iconName: Star },
  { name: 'Sağlık Elçisi', socialArea: 'Sağlık', iconName: HeartPulse },
  { name: 'Yoksulluk Savaşçısı', socialArea: 'Yoksulluk', iconName: HandHeart },
  { name: 'Mülteci Destekçisi', socialArea: 'Mülteci', iconName: Handshake },
  { name: 'Gıda Kurtarıcısı', socialArea: 'Gıda', iconName: Grape },
  { name: 'Sanat Destekçisi', socialArea: 'Sanat', iconName: Palette },
  { name: 'Spor Gönüllüsü', socialArea: 'Spor', iconName: Dumbbell },
  { name: 'Afet Kahramanı', socialArea: 'Afet', iconName: Siren },
  { name: 'Mesleki Katkı', socialArea: 'Mesleki', iconName: Briefcase },
  { name: 'İş Dünyası Lideri', socialArea: 'İş Dünyası', iconName: Landmark },
  { name: 'Sivil Toplum Lideri', socialArea: 'Sivil Toplum', iconName: Handshake },
  { name: 'Memleket Gönüllüsü', socialArea: 'Memleket', iconName: Landmark },
  { name: 'Teknoloji Gurusu', socialArea: 'Teknoloji', iconName: Cpu },
];


export let badges: Badge[] = [];
let badgeIdCounter = 1;

badgeData.forEach(baseBadge => {
    const userProgress = user.progress[baseBadge.socialArea] || 0;
    
    badgeLevels.forEach((level, levelIndex) => {
        const pointsRequired = (levelIndex + 1) * 100;
        
        badges.push({
            id: (badgeIdCounter++).toString(),
            ...baseBadge,
            level: level,
            pointsRequired: pointsRequired,
            currentPoints: userProgress,
        });
    });
});


export const adBanners = [
    {
      id: '1',
      title: 'Yaz Kampanyası',
      description: 'Seçili ürünlerde %50\'ye varan indirimleri kaçırma!',
      imageUrl: 'https://picsum.photos/seed/ad1/1200/400',
      link: '/market/1'
    },
    {
      id: '2',
      title: 'Okula Dönüş Fırsatları',
      description: 'Kırtasiye ve teknoloji ürünlerinde büyük indirimler.',
      imageUrl: 'https://picsum.photos/seed/ad2/1200/400',
      link: '#'
    },
    {
      id: '3',
      title: 'Yeni Sezonu Keşfet',
      description: 'Sonbahar koleksiyonumuzla tarzını yenile.',
      imageUrl: 'https://picsum.photos/seed/ad3/1200/400',
      link: '#'
    }
];

export const cooperatives: Brand[] = [
    { id: 'coop-1', name: 'Albatros Bilişim Kooperatifi', category: 'Yazılım', donationRate: 0, logoUrl: 'https://picsum.photos/seed/albatros/200', link: '#', followers: 120, type: 'cooperative' },
    { id: 'coop-2', name: 'Genç İşi Kooperatif', category: 'Danışmanlık', donationRate: 0, logoUrl: 'https://picsum.photos/seed/gencisi/200', link: '#', followers: 500, type: 'cooperative' },
    { id: 'coop-3', name: 'Yerküre Yerel Çalışmalar Kooperatifi', category: 'Çevre', donationRate: 0, logoUrl: 'https://picsum.photos/seed/yerkure/200', link: '#', followers: 340, type: 'cooperative' },
    { id: 'coop-4', name: 'Tiyatro Kooperatifi', category: 'Sanat', donationRate: 0, logoUrl: 'https://picsum.photos/seed/tiyatro/200', link: '#', followers: 1100, type: 'cooperative' },
    { id: 'coop-5', name: 'İhtiyaç Haritası', category: 'Sosyal Yardım', donationRate: 0, logoUrl: 'https://picsum.photos/seed/ihtiyacharitasi/200', link: '#', followers: 23000, type: 'cooperative' },
    { id: 'coop-6', name: 'Kadıncık Ana Kooperatifi', category: 'Gıda', donationRate: 0, logoUrl: 'https://picsum.photos/seed/kadincik/200', link: '#', followers: 450, type: 'cooperative' },
    { id: 'coop-7', name: 'Zeytindalı Kadın Kooperatifi', category: 'Gıda', donationRate: 0, logoUrl: 'https://picsum.photos/seed/zeytindali/200', link: '#', followers: 600, type: 'cooperative' },
];

export const socialEnterprises: Brand[] = [
     { id: 'social-1', name: 'Efes Tarlası Yaşam Köyü', category: 'Tarım', donationRate: 0, logoUrl: 'https://picsum.photos/seed/efes/200', link: '#', followers: 800, type: 'social' },
     { id: 'social-2', name: 'Buldan Eğitim ve Dayanışma Vakfı', category: 'Eğitim', donationRate: 0, logoUrl: 'https://picsum.photos/seed/buldan/200', link: '#', followers: 1500, type: 'social' },
     { id: 'social-3', name: 'Askıda İyilik', category: 'Sosyal Yardım', donationRate: 0, logoUrl: 'https://picsum.photos/seed/askida/200', link: '#', followers: 750, type: 'social' },
];

export const economicEnterprises: Brand[] = [
    { id: 'eco-1', name: 'TEMA Vakfı İktisadi İşletmesi', category: 'Perakende', donationRate: 100, logoUrl: 'https://picsum.photos/seed/tema-eco/200', link: '#', followers: 18000, type: 'economic' },
    { id: 'eco-2', name: 'TEGV İktisadi İşletmesi', category: 'Eğitim Materyalleri', donationRate: 100, logoUrl: 'https://picsum.photos/seed/tegv-eco/200', link: '#', followers: 12000, type: 'economic' },
    { id: 'eco-3', name: 'LÖSEV İktisadi İşletmesi (LSV Dükkan)', category: 'Perakende', donationRate: 100, logoUrl: 'https://picsum.photos/seed/losev-eco/200', link: '#', followers: 25000, type: 'economic' },
    { id: 'eco-4', name: 'KEDV İktisadi İşletmesi', category: 'El Sanatları', donationRate: 100, logoUrl: 'https://picsum.photos/seed/kedv-eco/200', link: '#', followers: 9000, type: 'economic' },
];

export const allEntityLists = [...marketBrands, ...cooperatives, ...socialEnterprises, ...economicEnterprises];

export const ngos: NGO[] = [
  { 
    id: '1', 
    name: 'TEMA Vakfı', 
    category: 'Çevre', 
    type: 'Vakıf' as const,
    avatarUrl: 'https://picsum.photos/seed/tema/200',
    coverPhotoUrl: 'https://picsum.photos/seed/tema-cover/800/200',
    stats: { followers: 12500, donors: 8500, volunteers: 8500, volunteerHours: 15000, projects: 45, peopleReached: 500000 },
    transparencyScore: 95,
    about: "Türkiye Çöl Olmasın! TEMA Vakfı, 1992 yılından bu yana erozyon ve çölleşme tehlikesine karşı mücadele etmekte, doğal varlıkların korunması ve sürdürülebilir yaşam için çalışmaktadır. Milyonlarca fidanı toprakla buluşturmuş, sayısız eğitim projesiyle çevre bilincini artırmıştır.\n\nAmacımız, toprağa ve doğal varlıklara sahip çıkmanın bir ülke meselesi olduğunu tüm topluma benimsetmek ve bu uğurda somut adımlar atmaktır. Gelecek nesillere yaşanabilir bir dünya bırakmak için var gücümüzle çalışıyoruz.",
    joinDate: '2022-01-15',
    supportedSDGs: ['İklim Eylemi', 'Karasal Yaşam'],
    beneficiaryGroups: ['Tüm Canlılar', 'Gelecek Nesiller'],
    memberOf: ['UNCCD', 'Türk Tabipleri Birliği'],
    contact: { email: 'bilgi@tema.org.tr', phone: '+90 212 291 90 90', website: 'https://www.tema.org.tr', social: { twitter: 'temavakfi', instagram: 'temavakfi', facebook: 'temavakfi', linkedin: 'tema-vakfi' }},
    economicEnterpriseUrl: '/market/eco-1',
    posts: timelinePosts.filter(p => p.author.name === 'TEMA Vakfı'),
    opportunities: volunteeringOpportunities.filter(o => o.organization === 'TEMA Vakfı')
  },
  { 
    id: '2', 
    name: 'Ahbap Derneği', 
    category: 'İnsani Yardım', 
    type: 'Dernek' as const,
    avatarUrl: 'https://picsum.photos/seed/ahbap/200',
    coverPhotoUrl: 'https://picsum.photos/seed/ahbap-cover/800/200',
    stats: { followers: 50000, donors: 35000, volunteers: 25000, volunteerHours: 80000, projects: 120, peopleReached: 2000000 },
    transparencyScore: 92,
    about: "Ahbap, ihtiyaç sahibi kişilere ayni ve nakdi olmak üzere her türlü yardımda bulunmak, toplumda yardımlaşma bilincinin güçlenmesini sağlamak, iyi insan ve iyi toplum inşasına hizmet etmek amacıyla kurulmuş bir işbirliği hareketidir.\n\nAfetlerden etkilenen bölgelere anında müdahale etmekten, öğrencilere burs sağlamaya, medikal cihaz ve ilaç desteğinden kan ve kök hücre kampanyalarına kadar geniş bir yelpazede faaliyet gösteriyoruz. Sevginin ve gerçeğin peşindeyiz.",
    joinDate: '2022-03-01',
    supportedSDGs: ['Yoksulluğa Son', 'Sağlıklı ve Kaliteli Yaşam', 'Nitelikli Eğitim'],
    beneficiaryGroups: ['Afetzedeler', 'İhtiyaç Sahibi Aileler', 'Öğrenciler', 'Hastalar'],
    memberOf: [],
    contact: { email: 'iletisim@ahbap.org', phone: '+90 216 414 89 89', website: 'https://ahbap.org', social: { twitter: 'ahbap', instagram: 'ahbap', facebook: 'ahbapdernegi', linkedin: 'ahbap-dernegi' }},
    posts: timelinePosts.filter(p => p.author.name === 'Ahbap Derneği'),
    opportunities: volunteeringOpportunities.filter(o => o.organization === 'Ahbap Derneği')
  },
  { 
    id: '3', 
    name: 'LÖSEV', 
    category: 'Sağlık', 
    type: 'Vakıf' as const,
    avatarUrl: 'https://picsum.photos/seed/losev/200',
    coverPhotoUrl: 'https://picsum.photos/seed/losev-cover/800/200',
    stats: { followers: 35000, donors: 28000, volunteers: 15000, volunteerHours: 45000, projects: 75, peopleReached: 100000 },
    transparencyScore: 88,
    about: "Lösemili Çocuklar Sağlık ve Eğitim Vakfı, 1998 yılında kurulmuş olup, lösemi ve kan hastası çocukların, sağlık ve eğitim başta olmak üzere her türlü ihtiyaçlarının sağlanmasına yardımcı olmaktadır. Tedavilerinin yanı sıra sosyal ve psikolojik desteklerle hayata sıkı sıkı sarılmalarını sağlamak için çalışmaktadır.\n\LÖSEV, Türkiye genelinde LÖSANTE Hastanesi, Lösemili Çocuklar Köyü ve okulları gibi kalıcı eserler yaratarak, kanserle mücadelede öncü bir rol üstlenmiştir. Amacımız, tüm lösemili çocukların eşit ve ücretsiz sağlık hizmeti almasını sağlamaktır.",
    joinDate: '2022-05-20',
    supportedSDGs: ['Sağlıklı ve Kaliteli Yaşam', 'Yoksulluğa Son'],
    beneficiaryGroups: ['Lösemili Çocuklar', 'Kanser Hastaları', 'Aileleri'],
    memberOf: ['Uluslararası Kanser Kontrol Örgütü (UICC)'],
    contact: { email: 'vakif@losev.org.tr', phone: '+90 312 447 06 60', website: 'https://www.losev.org.tr', social: { twitter: 'losev1998', instagram: 'losev1998', facebook: 'losev', linkedin: 'losev' }},
    economicEnterpriseUrl: '/market/eco-3',
    posts: [],
    opportunities: []
  },
];

  
