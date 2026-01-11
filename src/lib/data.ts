import type { ImagePlaceholder } from './placeholder-images';
import { PlaceHolderImages } from './placeholder-images';

const getImage = (id: string): ImagePlaceholder | undefined => PlaceHolderImages.find(img => img.id === id);

export interface Post {
  id: string;
  author: {
    name: string;
    avatarUrl: string;
  };
  content: string;
  imageUrl?: string;
  imageHint?: string;
  timestamp: string;
  likes: number;
  comments: number;
  sponsored?: boolean;
}

export interface Brand {
  id: string;
  name: string;
  category: string;
  donationRate: number;
  logoUrl: string;
  logoHint?: string;
}

export interface Event {
  id: string;
  name: string;
  organizer: string;
  type: string;
  date: string;
  location: string;
  capacity: {
    current: number;
    max: number;
  };
  tags: string[];
  imageUrl: string;
  imageHint?: string;
}

export interface Volunteering {
    id: string;
    title: string;
    organization: string;
    location: string;
    skills: string[];
    commitment: string;
}

export interface Badge {
    id: string;
    name: string;
    icon: any; // Lucide icon component
    level: 'Demir' | 'Bakır' | 'Bronz' | 'Çelik' | 'Gümüş' | 'Altın' | 'Platin';
    category: 'Sosyal Alanlar' | 'Gönüllülük';
}

export interface Campaign {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  imageHint: string;
}


export const timelinePosts: Post[] = [
  {
    id: '1',
    author: { name: 'TEMA Vakfı', avatarUrl: getImage('brand-logo-1')?.imageUrl || '' },
    content: 'Bugün fidan dikme etkinliğimizde 200 yeni ağacı toprakla buluşturduk! Katılan tüm gönüllülerimize teşekkür ederiz. 🌳💚 #Doğaİçin',
    imageUrl: getImage('timeline-post-1')?.imageUrl,
    imageHint: getImage('timeline-post-1')?.imageHint,
    timestamp: '2 saat önce',
    likes: 154,
    comments: 12,
    sponsored: false,
  },
  {
    id: '2',
    author: { name: 'Ahbap Derneği', avatarUrl: getImage('brand-logo-2')?.imageUrl || '' },
    content: 'İhtiyaç sahibi aileler için hazırladığımız gıda kolilerini dağıtmaya başladık. Desteklerinizle daha fazla insana ulaşıyoruz. 🙏',
    imageUrl: getImage('timeline-post-2')?.imageUrl,
    imageHint: getImage('timeline-post-2')?.imageHint,
    timestamp: '5 saat önce',
    likes: 321,
    comments: 45,
    sponsored: true,
  },
];

export const marketBrands: Brand[] = [
    { id: '1', name: 'Doğa Dostu Giyim', category: 'Tekstil', donationRate: 15, logoUrl: getImage('brand-logo-1')?.imageUrl || '', logoHint: getImage('brand-logo-1')?.imageHint },
    { id: '2', name: 'Lezzet Köyü', category: 'Gıda', donationRate: 10, logoUrl: getImage('brand-logo-2')?.imageUrl || '', logoHint: getImage('brand-logo-2')?.imageHint },
    { id: '3', name: 'Gezgin Rotalar', category: 'Seyahat', donationRate: 8, logoUrl: getImage('brand-logo-3')?.imageUrl || '', logoHint: getImage('brand-logo-3')?.imageHint },
    { id: '4', name: 'Tekno Market', category: 'Teknoloji', donationRate: 5, logoUrl: getImage('brand-logo-4')?.imageUrl || '', logoHint: getImage('brand-logo-4')?.imageHint },
];

export const events: Event[] = [
    { id: '1', name: 'Sahil Temizliği Etkinliği', organizer: 'TEMA Vakfı', type: 'Farkındalık', date: '25 Temmuz - 14:00', location: 'İzmir, Alsancak', capacity: { current: 35, max: 100 }, tags: ['Çevre', 'Sertifika Var', 'Offline'], imageUrl: getImage('event-cover-1')?.imageUrl || '', imageHint: getImage('event-cover-1')?.imageHint },
    { id: '2', name: 'Gençler İçin Kodlama Atölyesi', organizer: 'Teknasyon', type: 'Eğitim', date: '30 Temmuz - 10:00', location: 'Online', capacity: { current: 88, max: 150 }, tags: ['Çocuk', 'Online'], imageUrl: getImage('event-cover-2')?.imageUrl || '', imageHint: getImage('event-cover-2')?.imageHint },
];

export const volunteeringOpportunities: Volunteering[] = [
    { id: '1', title: 'Fransızca Tercüman Gönüllüsü', organization: 'Sınır Tanımayan Doktorlar', location: 'Online', skills: ['Fransızca', 'Tercümanlık'], commitment: 'Haftada 5 saat' },
    { id: '2', title: 'Afet Bölgesi Yardım Dağıtımı', organization: 'Ahbap Derneği', location: 'Hatay, Antakya', skills: ['Fiziksel Güç', 'Organizasyon'], commitment: '1 hafta' },
    { id: '3', title: 'Çocuklara Etüt Desteği', organization: 'TEGV', location: 'İstanbul, Kadıköy', skills: ['Eğitmenlik', 'Sabır'], commitment: 'Haftada 2 gün' },
];

export const marketCampaigns: Campaign[] = [
  { id: '1', title: 'Okul Alışverişinde %15 Bağış!', description: 'Lezzet Köyü ile çocukları sevindir.', imageUrl: getImage('campaign-banner-1')?.imageUrl || '', imageHint: getImage('campaign-banner-1')?.imageHint || '' },
  { id: '2', title: 'Her Seyahat Bir Umut Olsun', description: 'Gezgin Rotalar ile doğayı koru.', imageUrl: getImage('campaign-banner-2')?.imageUrl || '', imageHint: getImage('campaign-banner-2')?.imageHint || '' },
];