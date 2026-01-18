

import type { ImagePlaceholder } from './placeholder-images';
import { PlaceHolderImages } from './placeholder-images';
import type { Post, Brand, Event, Volunteering, Campaign, User, Badge, Certificate, StudentClub, SchoolRepresentative, Application, DonationTransaction, Notification, ManagedItem, NGO, AdBanner, HelpTopic } from './types';
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
    // Ayakkabı & Spor Giyim
    { id: '1', name: 'Ayakkabı Dünyası', category: 'Ayakkabı', donationRate: 8, logoUrl: 'https://picsum.photos/seed/ayakkabi-dunyasi/200', link: '#', followers: 150000, type: 'brand' },
    { id: '2', name: 'Decathlon', category: 'Spor Giyim', donationRate: 5, logoUrl: 'https://picsum.photos/seed/decathlon/200', link: '#', followers: 1200000, type: 'brand' },
    { id: '3', name: 'Sportstyle', category: 'Spor Giyim', donationRate: 10, logoUrl: 'https://picsum.photos/seed/sportstyle/200', link: '#', followers: 50000, type: 'brand' },
    { id: '4', name: 'Sneakscloud', category: 'Ayakkabı', donationRate: 12, logoUrl: 'https://picsum.photos/seed/sneakscloud/200', link: '#', followers: 200000, type: 'brand' },
    { id: '5', name: 'Sportive', category: 'Spor Giyim', donationRate: 7, logoUrl: 'https://picsum.photos/seed/sportive/200', link: '#', followers: 300000, type: 'brand' },
    { id: '6', name: 'FashFed', category: 'Giyim', donationRate: 10, logoUrl: 'https://picsum.photos/seed/fashfed/200', link: '#', followers: 150000, type: 'brand' },
    { id: '7', name: 'Skechers', category: 'Ayakkabı', donationRate: 6, logoUrl: 'https://picsum.photos/seed/skechers/200', link: '#', followers: 2500000, type: 'brand' },
    { id: '8', name: 'MarkaStok', category: 'Giyim', donationRate: 15, logoUrl: 'https://picsum.photos/seed/markastok/200', link: '#', followers: 80000, type: 'brand' },
    { id: '9', name: 'Fashfed Mobile', category: 'Giyim', donationRate: 10, logoUrl: 'https://picsum.photos/seed/fashfed-mobile/200', link: '#', followers: 100000, type: 'brand' },
    { id: '10', name: 'Playsports', category: 'Spor Giyim', donationRate: 8, logoUrl: 'https://picsum.photos/seed/playsports/200', link: '#', followers: 40000, type: 'brand' },
    { id: '11', name: 'Columbİa', category: 'Outdoor', donationRate: 7, logoUrl: 'https://picsum.photos/seed/columbia/200', link: '#', followers: 1000000, type: 'brand' },
    { id: '12', name: 'Converse', category: 'Ayakkabı', donationRate: 5, logoUrl: 'https://picsum.photos/seed/converse/200', link: '#', followers: 5000000, type: 'brand' },
    { id: '13', name: 'Hotiç', category: 'Ayakkabı', donationRate: 9, logoUrl: 'https://picsum.photos/seed/hotic/200', link: '#', followers: 800000, type: 'brand' },
    { id: '14', name: 'SuperStep', category: 'Ayakkabı', donationRate: 10, logoUrl: 'https://picsum.photos/seed/superstep/200', link: '#', followers: 1500000, type: 'brand' },
    { id: '15', name: 'Houseofsuperstep', category: 'Ayakkabı', donationRate: 10, logoUrl: 'https://picsum.photos/seed/houseofsuperstep/200', link: '#', followers: 200000, type: 'brand' },
    { id: '16', name: 'PUMA', category: 'Spor Giyim', donationRate: 6, logoUrl: 'https://picsum.photos/seed/puma/200', link: '#', followers: 10000000, type: 'brand' },
    { id: '17', name: 'Sporthink', category: 'Spor Giyim', donationRate: 11, logoUrl: 'https://picsum.photos/seed/sporthink/200', link: '#', followers: 70000, type: 'brand' },
    { id: '18', name: 'FLO', category: 'Ayakkabı', donationRate: 4, logoUrl: 'https://picsum.photos/seed/flo/200', link: '#', followers: 3000000, type: 'brand' },
    { id: '19', name: 'Intersport', category: 'Spor Giyim', donationRate: 5, logoUrl: 'https://picsum.photos/seed/intersport/200', link: '#', followers: 2000000, type: 'brand' },
    { id: '20', name: 'The Moose Bay', category: 'Outdoor', donationRate: 12, logoUrl: 'https://picsum.photos/seed/themoosebay/200', link: '#', followers: 90000, type: 'brand' },
    { id: '21', name: 'Sporpark', category: 'Spor Giyim', donationRate: 10, logoUrl: 'https://picsum.photos/seed/sporpark/200', link: '#', followers: 60000, type: 'brand' },
    
    // Kozmetik & Kişisel Bakım
    { id: '22', name: 'Gratis', category: 'Kozmetik', donationRate: 5, logoUrl: 'https://picsum.photos/seed/gratis/200', link: '#', followers: 4000000, type: 'brand' },
    { id: '23', name: 'Lona Cosmetics', category: 'Kozmetik', donationRate: 15, logoUrl: 'https://picsum.photos/seed/lona/200', link: '#', followers: 50000, type: 'brand' },
    { id: '24', name: 'Arkopharma', category: 'Sağlık', donationRate: 10, logoUrl: 'https://picsum.photos/seed/arkopharma/200', link: '#', followers: 30000, type: 'brand' },
    { id: '25', name: 'Flormar', category: 'Kozmetik', donationRate: 8, logoUrl: 'https://picsum.photos/seed/flormar/200', link: '#', followers: 2000000, type: 'brand' },
    { id: '26', name: 'Cosmed', category: 'Kişisel Bakım', donationRate: 12, logoUrl: 'https://picsum.photos/seed/cosmed/200', link: '#', followers: 150000, type: 'brand' },
    { id: '27', name: 'Supplementler', category: 'Sağlık', donationRate: 10, logoUrl: 'https://picsum.photos/seed/supplementler/200', link: '#', followers: 500000, type: 'brand' },
    { id: '28', name: 'Vitaminler', category: 'Sağlık', donationRate: 10, logoUrl: 'https://picsum.photos/seed/vitaminler/200', link: '#', followers: 300000, type: 'brand' },
    { id: '29', name: 'CocoBody', category: 'Kişisel Bakım', donationRate: 18, logoUrl: 'https://picsum.photos/seed/cocobody/200', link: '#', followers: 40000, type: 'brand' },
    { id: '30', name: 'Recete', category: 'Sağlık', donationRate: 9, logoUrl: 'https://picsum.photos/seed/recete/200', link: '#', followers: 20000, type: 'brand' },
    { id: '31', name: 'Kuaförümden.com', category: 'Kişisel Bakım', donationRate: 11, logoUrl: 'https://picsum.photos/seed/kuaforumden/200', link: '#', followers: 60000, type: 'brand' },

    // Tatil & Seyahat
    { id: '32', name: 'Tatilbudur', category: 'Seyahat', donationRate: 3, logoUrl: 'https://picsum.photos/seed/tatilbudur/200', link: '#', followers: 1000000, type: 'brand' },
    { id: '33', name: 'Etstur', category: 'Seyahat', donationRate: 2, logoUrl: 'https://picsum.photos/seed/etstur/200', link: '#', followers: 2000000, type: 'brand' },
    { id: '34', name: 'Touristica', category: 'Seyahat', donationRate: 3, logoUrl: 'https://picsum.photos/seed/touristica/200', link: '#', followers: 500000, type: 'brand' },
    { id: '35', name: 'SETUR', category: 'Seyahat', donationRate: 2, logoUrl: 'https://picsum.photos/seed/setur/200', link: '#', followers: 1500000, type: 'brand' },
    { id: '36', name: 'miniyol.com', category: 'Araç Kiralama', donationRate: 5, logoUrl: 'https://picsum.photos/seed/miniyol/200', link: '#', followers: 100000, type: 'brand' },
    { id: '37', name: 'Ucuzabilet', category: 'Bilet', donationRate: 1, logoUrl: 'https://picsum.photos/seed/ucuzabilet/200', link: '#', followers: 1200000, type: 'brand' },
    { id: '38', name: 'Tatildekirala.com', category: 'Konaklama', donationRate: 4, logoUrl: 'https://picsum.photos/seed/tatildekirala/200', link: '#', followers: 80000, type: 'brand' },
    { id: '39', name: 'bilet.com', category: 'Bilet', donationRate: 1, logoUrl: 'https://picsum.photos/seed/biletcom/200', link: '#', followers: 900000, type: 'brand' },
    { id: '40', name: 'Samsonite', category: 'Aksesuar', donationRate: 6, logoUrl: 'https://picsum.photos/seed/samsonite/200', link: '#', followers: 700000, type: 'brand' },

    // Giyim & Aksesuar
    { id: '41', name: 'Beymen', category: 'Lüks Giyim', donationRate: 4, logoUrl: 'https://picsum.photos/seed/beymen/200', link: '#', followers: 2500000, type: 'brand' },
    { id: '42', name: 'Suwen', category: 'İç Giyim', donationRate: 10, logoUrl: 'https://picsum.photos/seed/suwen/200', link: '#', followers: 400000, type: 'brand' },
    { id: '43', name: 'Aker', category: 'Tesettür Giyim', donationRate: 8, logoUrl: 'https://picsum.photos/seed/aker/200', link: '#', followers: 1000000, type: 'brand' },
    { id: '44', name: 'Mizalle', category: 'Tesettür Giyim', donationRate: 12, logoUrl: 'https://picsum.photos/seed/mizalle/200', link: '#', followers: 300000, type: 'brand' },
    { id: '45', name: 'İpekyol', category: 'Kadın Giyim', donationRate: 7, logoUrl: 'https://picsum.photos/seed/ipekyol/200', link: '#', followers: 1800000, type: 'brand' },
    { id: '46', name: 'Twist', category: 'Kadın Giyim', donationRate: 7, logoUrl: 'https://picsum.photos/seed/twist/200', link: '#', followers: 1200000, type: 'brand' },
    { id: '47', name: 'Slazenger', category: 'Spor Giyim', donationRate: 10, logoUrl: 'https://picsum.photos/seed/slazenger/200', link: '#', followers: 600000, type: 'brand' },
    { id: '48', name: 'Koton', category: 'Giyim', donationRate: 5, logoUrl: 'https://picsum.photos/seed/koton/200', link: '#', followers: 5000000, type: 'brand' },
    { id: '49', name: 'H&M', category: 'Giyim', donationRate: 4, logoUrl: 'https://picsum.photos/seed/hm/200', link: '#', followers: 15000000, type: 'brand' },
    { id: '50', name: 'Machka', category: 'Kadın Giyim', donationRate: 7, logoUrl: 'https://picsum.photos/seed/machka/200', link: '#', followers: 500000, type: 'brand' },
    { id: '51', name: 'Fitmoda', category: 'Spor Giyim', donationRate: 13, logoUrl: 'https://picsum.photos/seed/fitmoda/200', link: '#', followers: 250000, type: 'brand' },
    { id: '52', name: 'Boyner', category: 'Çok Kategorili', donationRate: 3, logoUrl: 'https://picsum.photos/seed/boyner/200', link: '#', followers: 3000000, type: 'brand' },
    { id: '53', name: 'Dagi', category: 'İç Giyim', donationRate: 9, logoUrl: 'https://picsum.photos/seed/dagi/200', link: '#', followers: 350000, type: 'brand' },
    { id: '54', name: 'Addax.com.tr', category: 'Kadın Giyim', donationRate: 11, logoUrl: 'https://picsum.photos/seed/addax/200', link: '#', followers: 1000000, type: 'brand' },
    { id: '55', name: 'Marks & Spencer', category: 'Giyim', donationRate: 6, logoUrl: 'https://picsum.photos/seed/marksandspencer/200', link: '#', followers: 1300000, type: 'brand' },
    { id: '56', name: 'GAP', category: 'Giyim', donationRate: 7, logoUrl: 'https://picsum.photos/seed/gap/200', link: '#', followers: 2000000, type: 'brand' },
    { id: '57', name: 'Mango', category: 'Giyim', donationRate: 5, logoUrl: 'https://picsum.photos/seed/mango/200', link: '#', followers: 8000000, type: 'brand' },
    { id: '58', name: 'Divarese', category: 'Ayakkabı', donationRate: 8, logoUrl: 'https://picsum.photos/seed/divarese/200', link: '#', followers: 400000, type: 'brand' },
    { id: '59', name: 'LTB', category: 'Giyim', donationRate: 9, logoUrl: 'https://picsum.photos/seed/ltb/200', link: '#', followers: 1500000, type: 'brand' },
    { id: '60', name: 'Benetton', category: 'Giyim', donationRate: 7, logoUrl: 'https://picsum.photos/seed/benetton/200', link: '#', followers: 900000, type: 'brand' },
    { id: '61', name: 'JeansLab', category: 'Giyim', donationRate: 14, logoUrl: 'https://picsum.photos/seed/jeanslab/200', link: '#', followers: 120000, type: 'brand' },
    { id: '62', name: 'ElbiseBul', category: 'Kadın Giyim', donationRate: 16, logoUrl: 'https://picsum.photos/seed/elbisebul/200', link: '#', followers: 80000, type: 'brand' },
    { id: '63', name: 'Colins', category: 'Giyim', donationRate: 6, logoUrl: 'https://picsum.photos/seed/colins/200', link: '#', followers: 2200000, type: 'brand' },
    { id: '64', name: 'NetWork', category: 'Giyim', donationRate: 7, logoUrl: 'https://picsum.photos/seed/network/200', link: '#', followers: 1100000, type: 'brand' },
    { id: '65', name: 'Kip', category: 'Erkek Giyim', donationRate: 8, logoUrl: 'https://picsum.photos/seed/kip/200', link: '#', followers: 300000, type: 'brand' },
    { id: '66', name: 'Livi.com', category: 'Giyim', donationRate: 10, logoUrl: 'https://picsum.photos/seed/livi/200', link: '#', followers: 200000, type: 'brand' },
    { id: '67', name: 'DS Damat', category: 'Erkek Giyim', donationRate: 7, logoUrl: 'https://picsum.photos/seed/dsdamat/200', link: '#', followers: 900000, type: 'brand' },
    { id: '68', name: 'Hemington', category: 'Erkek Giyim', donationRate: 8, logoUrl: 'https://picsum.photos/seed/hemington/200', link: '#', followers: 200000, type: 'brand' },
    { id: '69', name: 'Altınyıldız', category: 'Erkek Giyim', donationRate: 6, logoUrl: 'https://picsum.photos/seed/altinyildiz/200', link: '#', followers: 1300000, type: 'brand' },
    { id: '70', name: 'Yargıcı', category: 'Kadın Giyim', donationRate: 8, logoUrl: 'https://picsum.photos/seed/yargici/200', link: '#', followers: 700000, type: 'brand' },
    { id: '71', name: 'Nautica', category: 'Giyim', donationRate: 9, logoUrl: 'https://picsum.photos/seed/nautica/200', link: '#', followers: 600000, type: 'brand' },
    { id: '72', name: 'Wrangler', category: 'Giyim', donationRate: 8, logoUrl: 'https://picsum.photos/seed/wrangler/200', link: '#', followers: 500000, type: 'brand' },
    { id: '73', name: 'Gant', category: 'Giyim', donationRate: 7, logoUrl: 'https://picsum.photos/seed/gant/200', link: '#', followers: 800000, type: 'brand' },
    { id: '74', name: 'Pierre Cardin', category: 'Giyim', donationRate: 8, logoUrl: 'https://picsum.photos/seed/pierrecardin/200', link: '#', followers: 1200000, type: 'brand' },
    { id: '75', name: 'Avva', category: 'Erkek Giyim', donationRate: 9, logoUrl: 'https://picsum.photos/seed/avva/200', link: '#', followers: 900000, type: 'brand' },
    { id: '76', name: 'Ramsey', category: 'Erkek Giyim', donationRate: 8, logoUrl: 'https://picsum.photos/seed/ramsey/200', link: '#', followers: 400000, type: 'brand' },
    { id: '77', name: 'Kayra', category: 'Tesettür Giyim', donationRate: 9, logoUrl: 'https://picsum.photos/seed/kayra/200', link: '#', followers: 600000, type: 'brand' },
    { id: '78', name: 'Black Spade', category: 'İç Giyim', donationRate: 11, logoUrl: 'https://picsum.photos/seed/blackspade/200', link: '#', followers: 150000, type: 'brand' },
    { id: '79', name: 'SPX', category: 'Outdoor', donationRate: 8, logoUrl: 'https://picsum.photos/seed/spx/200', link: '#', followers: 400000, type: 'brand' },
    { id: '80', name: 'Cacharel', category: 'Erkek Giyim', donationRate: 8, logoUrl: 'https://picsum.photos/seed/cacharel/200', link: '#', followers: 300000, type: 'brand' },
    { id: '81', name: 'Scooter', category: 'Ayakkabı', donationRate: 10, logoUrl: 'https://picsum.photos/seed/scooter/200', link: '#', followers: 250000, type: 'brand' },
    { id: '82', name: 'Tudors', category: 'Erkek Giyim', donationRate: 9, logoUrl: 'https://picsum.photos/seed/tudors/200', link: '#', followers: 500000, type: 'brand' },
    { id: '83', name: 'Lacoste', category: 'Giyim', donationRate: 6, logoUrl: 'https://picsum.photos/seed/lacoste/200', link: '#', followers: 3000000, type: 'brand' },
    { id: '84', name: 'US Polo', category: 'Giyim', donationRate: 7, logoUrl: 'https://picsum.photos/seed/uspolo/200', link: '#', followers: 2000000, type: 'brand' },
    
    // Bebek & Çocuk
    { id: '85', name: 'Carter’s', category: 'Bebek Giyim', donationRate: 8, logoUrl: 'https://picsum.photos/seed/carters/200', link: '#', followers: 500000, type: 'brand' },
    { id: '86', name: 'E-bebek', category: 'Bebek Ürünleri', donationRate: 4, logoUrl: 'https://picsum.photos/seed/ebebek/200', link: '#', followers: 3000000, type: 'brand' },
    { id: '87', name: 'Jacadi', category: 'Çocuk Giyim', donationRate: 7, logoUrl: 'https://picsum.photos/seed/jacadi/200', link: '#', followers: 200000, type: 'brand' },
    { id: '88', name: 'Miniyol', category: 'Araç Kiralama', donationRate: 5, logoUrl: 'https://picsum.photos/seed/miniyol-bebek/200', link: '#', followers: 100000, type: 'brand' },
    { id: '89', name: 'Toyzz Shop', category: 'Oyuncak', donationRate: 6, logoUrl: 'https://picsum.photos/seed/toyzzshop/200', link: '#', followers: 1000000, type: 'brand' },

    // Ev & Yaşam
    { id: '90', name: 'Doğtaş Home', category: 'Mobilya', donationRate: 5, logoUrl: 'https://picsum.photos/seed/dogtas/200', link: '#', followers: 900000, type: 'brand' },
    { id: '91', name: 'Kelebek Mobilya', category: 'Mobilya', donationRate: 5, logoUrl: 'https://picsum.photos/seed/kelebek/200', link: '#', followers: 800000, type: 'brand' },
    { id: '92', name: 'Koçtaş', category: 'Yapı Market', donationRate: 3, logoUrl: 'https://picsum.photos/seed/koctas/200', link: '#', followers: 2500000, type: 'brand' },
    { id: '93', name: 'Karaca', category: 'Mutfak', donationRate: 7, logoUrl: 'https://picsum.photos/seed/karaca/200', link: '#', followers: 4000000, type: 'brand' },
    { id: '94', name: 'Bella Maison', category: 'Ev Tekstili', donationRate: 10, logoUrl: 'https://picsum.photos/seed/bellamaison/200', link: '#', followers: 600000, type: 'brand' },
    { id: '95', name: 'Mobeseavm', category: 'Mobilya', donationRate: 8, logoUrl: 'https://picsum.photos/seed/mobeseavm/200', link: '#', followers: 100000, type: 'brand' },
    { id: '96', name: 'Homend', category: 'Küçük Ev Aletleri', donationRate: 9, logoUrl: 'https://picsum.photos/seed/homend/200', link: '#', followers: 300000, type: 'brand' },
    { id: '97', name: 'Yatsan', category: 'Yatak', donationRate: 6, logoUrl: 'https://picsum.photos/seed/yatsan/200', link: '#', followers: 500000, type: 'brand' },
    { id: '98', name: 'Arçelik', category: 'Beyaz Eşya', donationRate: 2, logoUrl: 'https://picsum.photos/seed/arcelik/200', link: '#', followers: 3000000, type: 'brand' },
    { id: '99', name: 'Mudo', category: 'Ev & Giyim', donationRate: 7, logoUrl: 'https://picsum.photos/seed/mudo/200', link: '#', followers: 1500000, type: 'brand' },
    { id: '100', name: 'Hisar', category: 'Mutfak', donationRate: 9, logoUrl: 'https://picsum.photos/seed/hisar/200', link: '#', followers: 400000, type: 'brand' },
    { id: '101', name: 'Beko', category: 'Beyaz Eşya', donationRate: 2, logoUrl: 'https://picsum.photos/seed/beko/200', link: '#', followers: 2800000, type: 'brand' },
    { id: '102', name: 'Fakir', category: 'Küçük Ev Aletleri', donationRate: 8, logoUrl: 'https://picsum.photos/seed/fakir/200', link: '#', followers: 700000, type: 'brand' },
    { id: '103', name: 'Korkmazstore.com.tr', category: 'Mutfak', donationRate: 10, logoUrl: 'https://picsum.photos/seed/korkmaz/200', link: '#', followers: 1000000, type: 'brand' },
    { id: '104', name: 'Taç', category: 'Ev Tekstili', donationRate: 9, logoUrl: 'https://picsum.photos/seed/tac/200', link: '#', followers: 1200000, type: 'brand' },
    { id: '105', name: 'Linens', category: 'Ev Tekstili', donationRate: 8, logoUrl: 'https://picsum.photos/seed/linens/200', link: '#', followers: 800000, type: 'brand' },
    { id: '106', name: 'Kütahya Porselen', category: 'Mutfak', donationRate: 9, logoUrl: 'https://picsum.photos/seed/kutahya/200', link: '#', followers: 600000, type: 'brand' },

    // Pazaryeri & Market
    { id: '107', name: 'A101', category: 'Market', donationRate: 1, logoUrl: 'https://picsum.photos/seed/a101/200', link: '#', followers: 5000000, type: 'brand' },
    { id: '108', name: 'Getir', category: 'Hızlı Market', donationRate: 1, logoUrl: 'https://picsum.photos/seed/getir/200', link: '#', followers: 8000000, type: 'brand' },
    { id: '109', name: 'CarrefourSA', category: 'Market', donationRate: 1, logoUrl: 'https://picsum.photos/seed/carrefoursa/200', link: '#', followers: 4000000, type: 'brand' },
    { id: '110', name: 'Letgo', category: 'Pazaryeri', donationRate: 2, logoUrl: 'https://picsum.photos/seed/letgo/200', link: '#', followers: 10000000, type: 'brand' },
    { id: '111', name: 'Pazarama', category: 'Pazaryeri', donationRate: 2, logoUrl: 'https://picsum.photos/seed/pazarama/200', link: '#', followers: 1000000, type: 'brand' },
    { id: '112', name: 'n11', category: 'Pazaryeri', donationRate: 1.5, logoUrl: 'https://picsum.photos/seed/n11/200', link: '#', followers: 12000000, type: 'brand' },
    { id: '113', name: 'Occasion', category: 'Giyim Pazaryeri', donationRate: 10, logoUrl: 'https://picsum.photos/seed/occasion/200', link: '#', followers: 300000, type: 'brand' },

    // Elektronik
    { id: '114', name: 'Samsung', category: 'Elektronik', donationRate: 1.5, logoUrl: 'https://picsum.photos/seed/samsung/200', link: '#', followers: 20000000, type: 'brand' },
    { id: '115', name: 'Xiaomi', category: 'Elektronik', donationRate: 2, logoUrl: 'https://picsum.photos/seed/xiaomi/200', link: '#', followers: 15000000, type: 'brand' },
    { id: '116', name: 'General Mobile', category: 'Elektronik', donationRate: 4, logoUrl: 'https://picsum.photos/seed/generalmobile/200', link: '#', followers: 500000, type: 'brand' },
    { id: '117', name: 'Casper', category: 'Elektronik', donationRate: 3, logoUrl: 'https://picsum.photos/seed/casper/200', link: '#', followers: 800000, type: 'brand' },
    { id: '118', name: 'MediaMarkt', category: 'Elektronik', donationRate: 1, logoUrl: 'https://picsum.photos/seed/mediamarkt/200', link: '#', followers: 4000000, type: 'brand' },
    { id: '119', name: 'Anker', category: 'Aksesuar', donationRate: 8, logoUrl: 'https://picsum.photos/seed/anker/200', link: '#', followers: 1000000, type: 'brand' },
    { id: '120', name: 'Doremusic', category: 'Müzik Aletleri', donationRate: 7, logoUrl: 'https://picsum.photos/seed/doremusic/200', link: '#', followers: 200000, type: 'brand' },
    { id: '121', name: 'Natro Hosting', category: 'Teknoloji', donationRate: 15, logoUrl: 'https://picsum.photos/seed/natro/200', link: '#', followers: 150000, type: 'brand' },
    { id: '122', name: 'Teknosa', category: 'Elektronik', donationRate: 1, logoUrl: 'https://picsum.photos/seed/teknosa/200', link: '#', followers: 3500000, type: 'brand' },
    { id: '123', name: 'Huawei', category: 'Elektronik', donationRate: 2, logoUrl: 'https://picsum.photos/seed/huawei/200', link: '#', followers: 10000000, type: 'brand' },

    // Yeme & İçme & Gurme
    { id: '124', name: 'Tchibo', category: 'Kahve & Giyim', donationRate: 8, logoUrl: 'https://picsum.photos/seed/tchibo/200', link: '#', followers: 1000000, type: 'brand' },
    { id: '125', name: 'Bialetti Kahve', category: 'Kahve', donationRate: 10, logoUrl: 'https://picsum.photos/seed/bialetti/200', link: '#', followers: 150000, type: 'brand' },
    { id: '126', name: 'Little Caesars', category: 'Restoran', donationRate: 4, logoUrl: 'https://picsum.photos/seed/littlecaesars/200', link: '#', followers: 800000, type: 'brand' },
    { id: '127', name: 'Mamaplus', category: 'Evcil Hayvan', donationRate: 12, logoUrl: 'https://picsum.photos/seed/mamaplus/200', link: '#', followers: 200000, type: 'brand' },
    { id: '128', name: 'Oleamea', category: 'Gurme', donationRate: 15, logoUrl: 'https://picsum.photos/seed/oleamea/200', link: '#', followers: 50000, type: 'brand' },
    { id: '129', name: 'Fellas', category: 'Sağlıklı Gıda', donationRate: 13, logoUrl: 'https://picsum.photos/seed/fellas/200', link: '#', followers: 300000, type: 'brand' },

    // Mücevher & Saat
    { id: '130', name: 'Altınbaş', category: 'Mücevher', donationRate: 5, logoUrl: 'https://picsum.photos/seed/altinbas/200', link: '#', followers: 900000, type: 'brand' },
    { id: '131', name: 'Saat&Saat', category: 'Saat', donationRate: 6, logoUrl: 'https://picsum.photos/seed/saatsaat/200', link: '#', followers: 1100000, type: 'brand' },
    { id: '132', name: 'Lizay Pırlanta', category: 'Mücevher', donationRate: 8, logoUrl: 'https://picsum.photos/seed/lizay/200', link: '#', followers: 400000, type: 'brand' },
    { id: '133', name: 'Konyalı Saat', category: 'Saat', donationRate: 7, logoUrl: 'https://picsum.photos/seed/konyalisaat/200', link: '#', followers: 500000, type: 'brand' },
    { id: '134', name: 'Zwilling', category: 'Mutfak', donationRate: 9, logoUrl: 'https://picsum.photos/seed/zwilling/200', link: '#', followers: 200000, type: 'brand' },
    { id: '135', name: 'Hizlisaat.com', category: 'Saat', donationRate: 10, logoUrl: 'https://picsum.photos/seed/hizlisaat/200', link: '#', followers: 150000, type: 'brand' },

    // Hobi & Hediye & Diğer
    { id: '136', name: 'Idefix', category: 'Kitap', donationRate: 5, logoUrl: 'https://picsum.photos/seed/idefix/200', link: '#', followers: 700000, type: 'brand' },
    { id: '137', name: 'D&R', category: 'Kitap & Hobi', donationRate: 4, logoUrl: 'https://picsum.photos/seed/dr/200', link: '#', followers: 2000000, type: 'brand' },
    { id: '138', name: 'Vidyodan', category: 'Eğitim', donationRate: 20, logoUrl: 'https://picsum.photos/seed/vidyodan/200', link: '#', followers: 30000, type: 'brand' },
    { id: '139', name: 'Sosyopix', category: 'Hediye', donationRate: 12, logoUrl: 'https://picsum.photos/seed/sosyopix/200', link: '#', followers: 800000, type: 'brand' },
    { id: '140', name: 'Tazecicek', category: 'Hediye', donationRate: 10, logoUrl: 'https://picsum.photos/seed/tazecicek/200', link: '#', followers: 600000, type: 'brand' },
    { id: '141', name: 'Bloom and Fresh', category: 'Hediye', donationRate: 15, logoUrl: 'https://picsum.photos/seed/bloomandfresh/200', link: '#', followers: 200000, type: 'brand' },
    { id: '142', name: 'Pocket eSIM', category: 'Teknoloji', donationRate: 10, logoUrl: 'https://picsum.photos/seed/pocketesim/200', link: '#', followers: 50000, type: 'brand' },
    { id: '143', name: 'Airalo e-SIM', category: 'Teknoloji', donationRate: 8, logoUrl: 'https://picsum.photos/seed/airalo/200', link: '#', followers: 400000, type: 'brand' },
    { id: '144', name: 'Tonguç Akademi', category: 'Eğitim', donationRate: 9, logoUrl: 'https://picsum.photos/seed/tonguc/200', link: '#', followers: 1500000, type: 'brand' },
    { id: '145', name: 'Petzzshop', category: 'Evcil Hayvan', donationRate: 10, logoUrl: 'https://picsum.photos/seed/petzzshop/200', link: '#', followers: 300000, type: 'brand' },
    { id: '146', name: 'havhav.com.tr', category: 'Evcil Hayvan', donationRate: 12, logoUrl: 'https://picsum.photos/seed/havhav/200', link: '#', followers: 100000, type: 'brand' },
    { id: '147', name: 'Teknevia', category: 'Seyahat', donationRate: 6, logoUrl: 'https://picsum.photos/seed/teknevia/200', link: '#', followers: 40000, type: 'brand' },
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
  description: i % 2 === 0 ? 'İzmir\'in incisi Alsancak sahilinde bir araya gelerek kıyılarımızı temizliyoruz. Bu farkındalık hareketine katılarak hem doğaya katkıda bulunabilir hem de yeni insanlarla tanışabilirsiniz. Eldiven ve çöp torbaları tarafımızca sağlanacaktır.' : 'Geleceğin yazılımcılarını yetiştirmek için düzenlediğimiz bu atölyede, gençlere kodlamanın temellerini öğretiyoruz. Temel algoritma mantığı ve Python diline giriş yapacağız. Katılım için herhangi bir ön bilgi gerekmemektedir.',
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
    commitment: ['Haftada 5 saat', '1 hafta', 'Haftada 2 gün'][i%3],
    volunteerCount: { needed: 20, applications: 12 + i },
    dates: {
        applicationStart: `2024-07-${(i % 10) + 1}`,
        applicationEnd: `2024-08-${(i % 20) + 1}`,
        eventStart: '2024-08-05',
        eventEnd: '2024-08-12',
    },
    hours: { start: '09:00', end: '17:00', total: 40 },
    socialArea: ['Sağlık', 'Afet', 'Eğitim'][i%3],
    skills: [['Tercümanlık'], ['Fiziksel Güç', 'Organizasyon'], ['Eğitmenlik', 'Sabır']][i%3],
    languages: [['Fransızca'], [], ['İngilizce (Orta)']][i%3],
    requirements: [['Adli Sicil Kaydı'], ['B Sınıfı Ehliyet'], ['Sabıka Kaydı', 'Referans']][i%3],
    education: [undefined, undefined, 'Üniversite'][i%3],
    travel: {
        domestic: [false, true, false][i%3],
        international: [false, false, false][i%3],
        visas: [ [], [], [] ][i%3],
    },
    amenities: { transport: i % 2 === 0, food: true, accommodation: i % 3 === 0 },
    providesCertificate: i % 2 === 0,
    earnedBadges: [['language-master'], ['disaster-hero'], ['education-supporter']][i%3],
    hasPreTraining: i % 3 === 1,
    description: 'Bu görevde, belirlenen alanda ilgili yetkinliklerinizi kullanarak topluma fayda sağlayacaksınız. Proje kapsamında yapılacaklar, görev tanımı ve beklenen katkılar hakkında detaylı bilgi, başvurusu onaylanan gönüllülerle paylaşılacaktır.',
    points: 150 + i * 10,
    ngoTransparencyScore: 85 + i % 10,
    taskType: ['Tek Gün', 'Dönemsel', 'Sürekli'][i%3] as 'Tek Gün' | 'Dönemsel' | 'Sürekli'
}));


export const marketCampaigns: Campaign[] = [
  { id: '1', title: 'Okul Alışverişinde %15 Bağış!', description: 'Lezzet Köyü ile çocukları sevindir.', imageUrl: 'https://picsum.photos/seed/okul-kampanya/1200/400', imageHint: 'student school supplies', sponsored: true },
  { id: '2', title: 'Her Seyahat Bir Umut Olsun', description: 'Gezgin Rotalar ile doğayı koru.', imageUrl: getImage('campaign-banner-2')?.imageUrl || '', imageHint: getImage('campaign-banner-2')?.imageHint || '', sponsored: true },
  { id: '3', title: 'Teknoloji Alışverişiyle Eğitime Destek', description: 'Tekno Market\'ten yapacağın harcamalarla TEGV\'e destek ol.', imageUrl: 'https://picsum.photos/seed/tech-kampanya/1200/400', imageHint: 'laptop code', sponsored: false },
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
  { name: 'Ahbap Derneği', type: 'STK', icon: 'building', href: '/ngo-admin/dashboard', status: 'approved' },
  { name: 'Doğa Dostu Giyim', type: 'Marka', icon: 'store', href: '/market/1', status: 'approved' },
  { name: 'İTÜ Girişimcilik Kulübü', type: 'Öğrenci Kulübü', icon: 'school', href: '/admin/clubs/profile/1', status: 'approved' },
  { name: 'Yeni Marka Başvurusu', type: 'Marka', icon: 'store', href: '/admin/applications/brand/1', status: 'pending' },
  { name: 'Yeni STK Başvurusu', type: 'STK', icon: 'building', href: '/admin/applications/ngo/1', status: 'pending' },
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

export const badgeData: Omit<Badge, 'id' | 'level' | 'pointsRequired' | 'currentPoints' | 'iconName'>[] = [
  { name: 'Hayvan Dostu', socialArea: 'Hayvan Hakları' },
  { name: 'Çocuk Gelişimi', socialArea: 'Çocuk' },
  { name: 'Doğa Koruyucusu', socialArea: 'Çevre' },
  { name: 'Kadın Destekçisi', socialArea: 'Kadın' },
  { name: 'Engel Tanımaz', socialArea: 'Engelli' },
  { name: 'Yaşlı Dostu', socialArea: 'Yaşlı' },
  { name: 'Gençlik Lideri', socialArea: 'Gençlik' },
  { name: 'Sağlık Elçisi', socialArea: 'Sağlık' },
  { name: 'Yoksulluk Savaşçısı', socialArea: 'Yoksulluk' },
  { name: 'Mülteci Destekçisi', socialArea: 'Mülteci' },
  { name: 'Gıda Kurtarıcısı', socialArea: 'Gıda' },
  { name: 'Sanat Destekçisi', socialArea: 'Sanat' },
  { name: 'Spor Gönüllüsü', socialArea: 'Spor' },
  { name: 'Afet Kahramanı', socialArea: 'Afet' },
  { name: 'Mesleki Katkı', socialArea: 'Mesleki' },
  { name: 'İş Dünyası Lideri', socialArea: 'İş Dünyası' },
  { name: 'Sivil Toplum Lideri', socialArea: 'Sivil Toplum' },
  { name: 'Memleket Gönüllüsü', socialArea: 'Memleket' },
  { name: 'Teknoloji Gurusu', socialArea: 'Teknoloji' },
];


const iconMap: { [key: string]: LucideIcon } = {
    'Hayvan Hakları': PawPrint,
    'Çocuk': Baby,
    'Çevre': Leaf,
    'Kadın': Users,
    'Engelli': ShieldCheck,
    'Yaşlı': Users,
    'Gençlik': Star,
    'Sağlık': HeartPulse,
    'Yoksulluk': HeartHandshake,
    'Mülteci': Handshake,
    'Gıda': Grape,
    'Sanat': Palette,
    'Spor': Dumbbell,
    'Afet': Siren,
    'Mesleki': Briefcase,
    'İş Dünyası': Landmark,
    'Sivil Toplum': Handshake,
    'Memleket': Landmark,
    'Teknoloji': Cpu,
};


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
            iconName: iconMap[baseBadge.socialArea] || Star,
            pointsRequired: pointsRequired,
            currentPoints: userProgress,
        });
    });
});


export const adBanners: AdBanner[] = [
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
    { id: 'eco-1', name: 'TEMA Vakfı İktisadi İşletmesi', category: 'Perakende', ngoId: '1', donationRate: 100, logoUrl: 'https://picsum.photos/seed/tema-eco/200', link: '#', followers: 18000, type: 'economic' },
    { id: 'eco-2', name: 'TEGV İktisadi İşletmesi', category: 'Eğitim Materyalleri', ngoId: '4', donationRate: 100, logoUrl: 'https://picsum.photos/seed/tegv-eco/200', link: '#', followers: 12000, type: 'economic' },
    { id: 'eco-3', name: 'LÖSEV İktisadi İşletmesi (LSV Dükkan)', category: 'Perakende', ngoId: '3', donationRate: 100, logoUrl: 'https://picsum.photos/seed/losev-eco/200', link: '#', followers: 25000, type: 'economic' },
    { id: 'eco-4', name: 'KEDV İktisadi İşletmesi', category: 'El Sanatları', ngoId: '5', donationRate: 100, logoUrl: 'https://picsum.photos/seed/kedv-eco/200', link: '#', followers: 9000, type: 'economic' },
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

export const helpTopics: HelpTopic[] = [
  {
    icon: 'user-circle',
    title: 'Hesap Yönetimi',
    slug: 'hesap-yonetimi',
    description: "Hesap ayarlarınızı, profil bilgilerinizi ve bildirim tercihlerinizi nasıl yöneteceğinizi öğrenin.",
    subtopics: [
        { title: 'E-posta adresimi nasıl değiştiririm?', link: '#', content: "Ayarlar > Profilim sekmesinden e-posta adresinizi kolayca güncelleyebilirsiniz." },
        { title: 'Şifremi nasıl sıfırlarim?', link: '#', content: "Giriş ekranındaki 'Şifremi Unuttum' bağlantısını kullanarak şifre sıfırlama talimatlarını e-postanıza alabilirsiniz." },
        { title: 'Profil fotoğrafımı nasıl güncellerim?', link: '#', content: "Profil sayfanızdaki düzenle butonu ile profil fotoğrafınızı ve diğer kişisel bilgilerinizi güncelleyebilirsiniz." },
        { title: 'Hesabımı nasıl silebilirim?', link: '#', content: "Ayarlar > Güvenlik sekmesindeki 'Hesabı Sil' seçeneği ile hesabınızı kalıcı olarak silebilirsiniz. Bu işlemin geri alınamayacağını unutmayın." },
    ]
  },
  {
    icon: 'heart-handshake',
    title: 'Gönüllülük',
    slug: 'gonulluluk',
    description: "Gönüllülük süreçleri, başvurular, puanlar ve sertifikalar hakkında merak ettikleriniz.",
    subtopics: [
        { title: 'Gönüllülük ilanlarına nasıl başvurulur?', link: '#', content: "Gönüllülük sayfasından ilgilendiğiniz ilanın detaylarına giderek 'Başvur' butonuna tıklamanız yeterlidir." },
        { title: 'Başvurumun durumunu nereden takip edebilirim?', link: '#', content: "Yan menüdeki 'Başvurularım' sayfasından tüm başvurularınızın güncel durumunu takip edebilirsiniz." },
        { title: 'Kazandığım sosyal etki puanları ne işe yarar?', link: '#', content: "Sosyal etki puanları, platformdaki aktifliğinizi ve topluma katkınızı gösterir. Bu puanlarla rozetler kazanabilir ve sıralamalarda yükselebilirsiniz." },
        { title: 'Gönüllülük sertifikamı nasıl alabilirim?', link: '#', content: "Tamamladığınız gönüllülük faaliyetleri için kazandığınız sertifikaları 'Rozetlerim' sayfasındaki 'Sertifikalar' sekmesinde bulabilirsiniz." },
    ]
  },
  {
    icon: 'wallet',
    title: 'Bağış ve Cüzdan',
    slug: 'bagis-ve-cuzdan',
    description: "Alışverişle bağış, cüzdan işlemleri ve ödeme yöntemleri ile ilgili tüm sorularınızın cevapları.",
    subtopics: [
        { title: 'hangel cüzdanıma nasıl para yüklerim?', link: '#', content: "QR Ödeme sayfasındaki 'Bakiye Yükle' seçeneği ile kredi/banka kartınızdan güvenli bir şekilde bakiye yükleyebilirsiniz." },
        { title: 'Alışveriş yaparken bağış süreci nasıl işliyor?', link: '#', content: "Anlaşmalı markalardan cüzdanınızla yaptığınız ödemelerde, belirtilen orandaki bağış tutarı otomatik olarak düşülerek seçtiğiniz STK'ya aktarılır." },
        { title: 'Bağışlarımın hangi STK\'lara gittiğini nasıl görürüm?', link: '#', content: "'Bağışlarım' sayfasından tüm işlem detaylarını ve bağışlarınızın hangi STK'lara ulaştığını şeffaf bir şekilde görebilirsiniz." },
        { title: 'Ödeme yaparken bir sorun yaşadım, ne yapmalıyım?', link: '#', content: "Ödeme sorunları için lütfen 'Destek Merkezi' üzerinden bizimle iletişime geçin. Ekibimiz en kısa sürede size yardımcı olacaktır." },
    ]
  },
  {
    icon: 'settings-2',
    title: 'Uygulama ve Ayarlar',
    slug: 'uygulama-ve-ayarlar',
    description: "Uygulama teması, dil seçenekleri ve diğer kişiselleştirme ayarları hakkında bilgi alın.",
    subtopics: [
        { title: 'Bildirim ayarlarımı nasıl yönetebilirim?', link: '#', content: "Ayarlar sayfasındaki 'Bildirimler' sekmesinden hangi durumlarda anlık veya e-posta bildirimi almak istediğinizi detaylı olarak seçebilirsiniz." },
        { title: 'Uygulama dilini nasıl değiştiririm?', link: '#', content: "Ayarlar sayfasındaki 'Uygulama' sekmesinden dil tercihlerinizi (Türkçe/İngilizce) yönetebilirsiniz." },
        { title: 'Karanlık mod nasıl açılır?', link: '#', content: "Ayarlar sayfasındaki 'Uygulama' sekmesinden Açık, Koyu veya Sistem varsayılanı tema seçeneklerinden birini tercih edebilirsiniz." },
    ]
  },
  {
    icon: 'shield',
    title: 'Güvenlik ve Gizlilik',
    slug: 'guvenlik-ve-gizlilik',
    description: "Hesap güvenliğiniz, kişisel verilerinizin korunması ve gizlilik politikalarımız hakkında detaylar.",
    subtopics: [
        { title: 'Şifremi unuttum, ne yapmalıyım?', link: '#', content: "Giriş ekranındaki 'Şifremi Unuttum' bağlantısını kullanarak şifre sıfırlama talimatlarını e-postanıza alabilirsiniz." },
        { title: 'Hesabımın başkasının eline geçtiğini düşünüyorum.', link: '#', content: "Derhal şifrenizi değiştirmenizi ve Ayarlar > Güvenlik > Oturum Geçmişi'nden tanımadığınız cihazları sonlandırmanızı öneririz. Sorun devam ederse destek ekibimizle iletişime geçin." },
        { title: 'Kişisel verilerim güvende mi?', link: '#', content: "Evet, kişisel verileriniz KVKK ve GDPR standartlarına uygun olarak şifrelenmiş sunucularda güvenli bir şekilde saklanmaktadır. Detaylı bilgi için Gizlilik Politikamızı inceleyebilirsiniz." },
    ]
  },
  {
    icon: 'book-text',
    title: 'Topluluk Kuralları',
    slug: 'topluluk-kurallari',
    description: "Platformumuzda pozitif ve saygılı bir ortam sağlamak için uymanız gereken kurallar.",
    subtopics: [
        { title: 'Hangi tür içerikler yasaktır?', link: '#', content: "Nefret söylemi, taciz, şiddet içeren, yasa dışı ve yanıltıcı içeriklerin paylaşılması kesinlikle yasaktır. Topluluk kurallarımızın tamamına yasal belgelerimizden ulaşabilirsiniz." },
        { title: 'Bir kullanıcıyı nasıl şikayet edebilirim?', link: '#', content: "Rahatsız edici bir içerik veya kullanıcı profili ile karşılaştığınızda, ilgili gönderinin veya profilin yanındaki '...' menüsünden 'Şikayet Et' seçeneğini kullanabilirsiniz." },
    ]
  }
];

export const ngoHelpTopics: HelpTopic[] = [
  {
    icon: 'building',
    title: 'Profil ve Şeffaflık Yönetimi',
    slug: 'profil-yonetimi',
    description: "Kuruluş profilinizi nasıl yöneteceğinizi, bilgilerinizi nasıl güncelleyeceğinizi ve şeffaflık puanınızı nasıl artıracağınızı öğrenin.",
    subtopics: [
        { title: 'Şeffaflık puanımı nasıl artırabilirim?', link: '#', content: "Şeffaflık Endeksi sayfasındaki tüm kriterleri (yasal belgeler, iletişim bilgileri, raporlar vb.) tamamlayarak puanınızı en üst seviyeye çıkarabilirsiniz." },
        { title: 'Kuruluş bilgilerimi (adres, iletişim vb.) nasıl güncellerim?', link: '#', content: "Yönetim panelindeki 'Profili Yönet' sayfasından tüm temel bilgilerinizi ve sosyal medya hesaplarınızı kolayca güncelleyebilirsiniz." },
        { title: 'Gönderi (post) nasıl oluştururum?', link: '#', content: "'Gönderiler' sayfasından metin ve görsel içeren yeni duyurular veya güncellemeler oluşturarak toplulukla etkileşim kurabilirsiniz." },
    ]
  },
  {
    icon: 'dollar-sign',
    title: 'Bağış ve Finansal Süreçler',
    slug: 'bagis-finans',
    description: "Bağış takibi, hak ediş raporları ve finansal süreçler hakkında merak ettikleriniz.",
    subtopics: [
        { title: 'Hak ediş raporlarıma nereden ulaşabilirim?', link: '#', content: "Yönetim panelindeki 'Raporlar' sayfasından tüm geçmiş ve güncel finansal raporlarınızı indirebilirsiniz." },
        { title: 'Bağışlar hesabımıza ne zaman ve nasıl aktarılır?', link: '#', content: "Kesinleşen hak edişler, takip eden ayın 15'ine kadar kayıtlı IBAN numaranıza otomatik olarak aktarılır." },
        { title: 'İşlem geçmişini nasıl detaylı inceleyebilirim?', link: '#', content: "'Bağış Takibi' sayfasından tüm bağış işlemlerini, marka ve tutar detaylarıyla birlikte görebilirsiniz." },
    ]
  },
  {
    icon: 'heart-handshake',
    title: 'Gönüllülük Yönetimi',
    slug: 'gonulluluk-yonetimi',
    description: "Gönüllülük ilanları oluşturma, başvuruları yönetme ve gönüllülerle iletişim kurma süreçleri.",
    subtopics: [
        { title: 'Yeni bir gönüllülük ilanı nasıl oluşturulur?', link: '#', content: "'Gönüllülük' sayfasındaki 'Yeni İlan Oluştur' butonu ile yeni bir ilan yayınlayabilirsiniz." },
        { title: 'Gönüllü başvurularını nasıl onaylar veya reddederim?', link: '#', content: "'Gönüllülük' sayfasındaki 'Başvurular' sekmesinden gelen başvuruları inceleyebilir, detaylarını görüntüleyebilir ve onay/ret işlemi yapabilirsiniz." },
        { title: 'Gönüllülerin demografik verilerine nasıl erişirim?', link: '#', content: "'Demografi' sayfasından gönüllü ve bağışçılarınızın yaş, şehir, ilgi alanı gibi anonimleştirilmiş istatistiklerine ulaşabilirsiniz." },
    ]
  },
  {
    icon: 'school',
    title: 'Öğrenci Kulüpleri',
    slug: 'ogrenci-kulupleri',
    description: "Öğrenci kulüpleri için özel yönetim araçları ve ipuçları.",
    subtopics: [
        { title: 'Kulüp profilimizi nasıl güncelleyebiliriz?', link: '#', content: "Yönetim Paneli > Öğrenci Kulüpleri sayfasından kulüp profilinize giderek bilgilerinizi düzenleyebilirsiniz. Bu özellik yakında aktif olacaktır." },
        { title: 'Kulüp etkinliği nasıl oluşturulur?', link: '#', content: "Kulüp etkinliklerinizi 'Kulüp Etkinlikleri' sayfasından oluşturabilir ve tüm Hangel kullanıcılarına duyurabilirsiniz. Bu özellik yakında aktif olacaktır." },
    ]
  }
];

export const ngoFaqArticles = [
    { title: 'Şeffaflık puanı neden önemlidir ve nasıl hesaplanır?', link: '#' },
    { title: 'Bir bağışın STK payı nasıl belirleniyor?', link: '#' },
    { title: 'Gönüllülük ilanım neden onaylanmadı?', link: '#' },
    { title: 'Yönetim paneline yeni kullanıcı nasıl eklenir?', link: '#' }
];
    
