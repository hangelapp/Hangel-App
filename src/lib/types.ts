
import { LucideIcon } from "lucide-react";

export type NavItem = {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
};

export type SideNavItem = {
    href: string;
    icon: string;
    label: string;
};

export type Message = {
  id: string;
  sender: {
    id: string;
    name: string;
    type: 'user' | 'ngo' | 'club' | 'admin';
    avatarUrl?: string;
  };
  recipient: {
    id: string;
    name: string;
    type: 'user' | 'ngo' | 'club' | 'admin' | 'group';
  };
  subject: string;
  content: string;
  timestamp: string;
  status: 'sent' | 'read';
  isFlagged?: boolean;
};

export type Post = {
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
  /**
   * Legacy: early posts stored likes as an array of uids on the post doc.
   * Read-only fallback for count display; new writes go to the
   * `posts/{postId}/likes/{uid}` sub-collection (see firestore.rules).
   */
  likedBy?: string[];
};

export type Brand = {
  id: string;
  slug: string;
  name: string;
  shortName?: string;           // Kısa isim/kısaltma — arama bunu da tanır
  category: string;             // Birincil kategori (geriye uyumluluk için tutuldu)
  categories?: string[];        // Çoklu kategori: marka birden fazla kategoride satıyorsa hepsinde görünür
  type: 'brand' | 'cooperative' | 'social' | 'economic';
  ngoId?: string;
  logoUrl: string;
  logoHint?: string;
  coverPhotoUrl?: string;
  donationRate: number;
  donationRateDisplay?: string;
  /**
   * Target site domain (e.g. "trendyol.com") — extracted from HasOffers
   * preview_url. Used by Chrome Extension to match the user's current tab
   * against known affiliate brands. Optional for backwards compatibility.
   */
  targetDomain?: string;
  stats?: {
    supporters: number;
    totalDonation: number;
    monthlyFollowerGrowth: number;
    profileViews: number;
    profileShares: number;
  };
  about?: string;
  joinDate?: string;
  donationByCategory?: { category: string; rate: number }[];
  contact?: {
    email: string;
    website: string;
    social: {
      twitter?: string;
      instagram?: string;
      facebook?: string;
      linkedin?: string;
    };
  };
  posts?: Post[];
  link?: string;
  followers?: number;
  agency?: string;
  sustainabilityReports?: { title: string; url: string }[];
};

export type NGO = {
  id: string;
  name: string;
  shortName?: string;
  foundationYear?: number;
  category: string;
  type: 'Dernek' | 'Vakıf' | 'Spor Kulübü' | 'Özel İzinli';
  avatarUrl: string;
  coverPhotoUrl: string;
  stats: {
    followers: number;
    donors: number;
    volunteers: number;
    volunteerHours: number;
    projects: number;
    totalDonation: number;
    donationCount: number;
    avgDonation: number;
    highestSingleDonation: number;
    peopleReached: number;
  };
  transparencyScore: number;
  about: string;
  joinDate: string;
  supportedSDGs: string[];
  beneficiaryGroups: string[];
  memberOf: string[];
  federations?: string[];
  usagePurpose?: 'donation' | 'volunteer' | 'both';
  economicEnterpriseStatus?: 'var' | 'yok';
  affiliatedWith?: {
    name: string;
    logoUrl?: string;
  };
  contact: {
    email: string;
    phone: string;
    website: string;
    social: {
      twitter: string;
      instagram: string;
      facebook: string;
      linkedin: string;
    };
    address?: {
        fullAddress: string;
        city: string;
        district: string;
        country?: string;
    }
  };
  economicEnterpriseUrl?: string;
  // Devlet sicil (kütük) numarası. Onay anında başvurudaki `registryNo`'dan
  // yazılır ve hangel.org/<kütükNo> kısa linki (/k/<kütükNo>) bu STK'nın
  // profiline çözümlenir. Eski kayıtlarda tanımsız olabilir.
  kutukNo?: string;
  viewCount?: number;
  posts: Post[];
  opportunities: Volunteering[];
  campaigns?: Campaign[];
};

export type Event = {
  id: string;
  slug: string;
  name: string;
  organizer: string;
  type: string; // Kategori
  date: string; // for backward compatibility
  time?: string;
  startDate: string; // YYYY-MM-DD HH:mm
  endDate: string; // YYYY-MM-DD HH:mm
  location: {
    type: 'Online' | 'Fiziksel';
    address: string;
    city: string;
    district: string;
    coordinates?: { lat: number; lon: number }; // Mesafe ölçümü + hava durumu için (gönüllülük ile aynı şema)
  };
  language: string;
  participationCondition: 'Herkese Açık' | 'Üyelere Özel' | 'Öğrencilere Özel' | 'Davetlilere Özel';
  capacity: {
    current: number;
    max: number;
  };
  tags: string[];
  imageUrl: string;
  imageHint?: string;
  description: string;
  providesCertificate?: boolean;
  organizerId?: string;
  organizerLogoUrl?: string; // Etkinliği düzenleyen kulübün/STK'nın logosu (Live Activity + yaka kartı)
  contributors?: EventContributor[]; // Konuşmacı / sanatçı / moderatör listesi (isim + ünvan + rol)
  agenda?: EventAgendaItem[]; // Etkinlik akış programı (saat + başlık)
  // Canlı etkinlik modu — organizatör "Canlı yayını başlat" deyince true olur.
  live?: boolean;
  liveStartedAt?: unknown;
  liveEndedAt?: unknown;
  completed?: boolean; // "Etkinliği Tamamla" sonrası true → aktif/canlı listeden düşer.
};

/** Etkinlikte görevli kişi — konuşmacı, sanatçı, moderatör. hangel üyesiyse userId bağlanır. */
export type EventContributorRole =
  | 'speaker' | 'moderator' | 'panelist' | 'instructor' | 'host'
  | 'artist' | 'musician' | 'dj' | 'performer'
  | 'writer' | 'academic' | 'jury' | 'guest';
export type EventContributor = {
  name: string;
  title: string; // ünvan (örn. "Prof. Dr.", "Genel Müdür", "Müzisyen")
  role: EventContributorRole;
  userId?: string; // hangel üyesiyse Firebase uid — rol yaka kartı/Live Activity/sertifikaya yansır
};

/** Etkinlik akış programı öğesi. */
export type EventAgendaItem = {
  time: string; // "HH:mm"
  title: string;
};

export type Volunteering = {
    id: string;
    title: string;
    organization: string;
    ngoId: string;
    location: {
      city: string;
      district: string;
      type: 'Online' | 'Saha' | 'Hibrit';
      address?: string; // Açık adres (saha/fiziksel)
      coordinates?: { lat: number; lon: number }; // Yön tarifi + hava durumu için
    };
    participationCondition?: string; // Katılım koşulu (varsa)
    meetUrl?: string; // Online gönüllülük için Google Meet linki (onaylı gönüllü "Katıl" ile açar)
    urgent?: boolean; // ACİL gönüllülük (afet/acil) — kart/detayda kırmızı şerit + öne çıkar
    organizerLogoUrl?: string; // Organize eden STK logosu (Live Activity + yaka kartı)
    commitment: string;
    volunteerCount: {
      needed: number;
      applications: number;
    };
    dates: {
        applicationStart: string;
        applicationEnd: string;
        eventStart: string;
        eventEnd: string;
    };
    hours: {
      start: string;
      end: string;
      total: number;
    };
    socialArea: string;
    
    // Detailed Requirements
    skills?: string[];
    dailySkills?: string[];
    interests?: string[];
    education?: string;
    profession?: string;
    languages?: string[];
    programs?: string[];
    requirements?: string[]; // For documents and licenses
    travel?: {
        domestic?: boolean;
        international?: boolean;
        visas?: string[];
    };
    
    amenities: {
      transport: boolean;
      food: boolean;
      accommodation: boolean;
    };
    providesCertificate: boolean;
    earnedBadges: string[];
    hasPreTraining: boolean;
    description: string;
    points: number;
    ngoTransparencyScore: number;
    taskType: 'Tek Gün' | 'Dönemsel' | 'Sürekli';
    review?: {
        rating: number;
        comment: string;
    };
};

export type User = {
    id: string;
    name: string;
    username: string;
    avatarUrl: string;
    coverPhotoUrl: string;
    impactScore: number;
    role?: 'super-admin' | 'ngo-admin' | 'user';
    personalInfo: {
        email: string;
        phone: string;
        birthDate: string;
        gender: string;
        nationality: string;
        bloodType: string;
        // Apple Health'ten otomatik senkronlanabilen ölçüler (cm / kg, string).
        height?: string;
        weight?: string;
        address: {
            country: string;
            city: string;
            district: string;
            neighborhood: string;
            fullAddress: string;
        };
        website?: string | null;
        social?: {
            linkedin?: string | null;
            github?: string | null;
            behance?: string | null;
            instagram?: string | null;
            twitter?: string | null;
        }
    },
    volunteerInfo: {
        skills: string[];
        dailySkills: string[];
        interests: string[];
        education: {
            level: string;          // 'Lise' | 'Önlisans' | 'Lisans' | 'Yüksek Lisans' | 'Doktora'
            school: string;
            department?: string;    // Bölüm / Fakülte
            status?: string;        // 'Devam Ediyor' | 'Mezun' | 'Terk'
            grade?: string;         // Devam ediyorsa kaçıncı sınıf (1./2./3./4./Hazırlık)
            graduationYear?: string;
        }[];
        profession: string | null;
        sector?: string | null;
        position?: string | null;
        languages: string[];
        programs: string[];
        licenses: string[];
        documents: string[];
        travelInfo: { 
            domesticObstacle: boolean; 
            internationalObstacle: boolean;
            visas: string[];
        };
        emergency: {
            available: boolean;
            hasChronicIllness: boolean;
            usesRegularMedication: boolean;
            hasPhysicalLimitation: boolean;
            emergencyContacts: {
                name: string;
                phone: string;
            }[];
        }
    },
    stats: {
        totalDonation: number;
        donationCount: number;
        highestSingleDonation: number;
        supportedNgosCount: number;
        mostSupportedNgo: string;
        avgDonation: number;
        volunteerHours: number;
        completedProjects: number;
        volunteerRank: {
            country: string;
            city: string;
            school: string;
            interest: string;
        };
        mostActiveVolunteerArea: string;
        avgVolunteerDuration: string;
        totalImpactValue: number;
    },
    progress: {
        [key: string]: number;
    },
    supportedNgos: string[];
    volunteerNgos: string[];
    // Onboarding tamamlanma bayrağı — yalnızca yeni bireysel kullanıcılar için
    // gönüllülük adımının sonunda `true` yazılır. Eski kullanıcılarda alan
    // tanımsız (undefined) kalır; app-shell gate'i tanımsız + boş veri
    // kombinasyonunu "tamamlanmış" sayar (mevcut kullanıcılar kilitlenmez).
    onboardingComplete?: boolean;
};

export type BadgeLevel = 'Bakır' | 'Bronz' | 'Gümüş' | 'Altın' | 'Platin';

export type Badge = {
  id: string;
  name: string;
  iconName: LucideIcon;
  level: BadgeLevel;
  socialArea: string;
  pointsRequired: number;
  currentPoints: number;
};

export type Certificate = {
  id: string;
  title: string;
  organization: string;
  date: string;
  linkedinUrl: string;
};

export type Campaign = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  imageHint: string;
  sponsored?: boolean;
  goal: number;
  currentAmount: number;
  ngoId: string;
};

export type StudentClub = {
    id: string;
    name: string;
    shortName?: string;
    university: string;
    type: 'university' | 'high-school';
    category?: string;
    /** Çoklu kategori — başvuru formundan gelir. Profil "Çalışma Alanları" bölümünde rozet listesi. */
    categories?: string[];
    /** Etkinlik sıklığı: Haftalık / Aylık / Dönemsel / Düzensiz */
    eventFrequency?: string;
    /** Kısa kulüp tanıtımı (2-3 cümle) — başvuru formundan. */
    shortDescription?: string;
    avatarUrl: string;
    coverPhotoUrl: string;
    members: number;
    points: number;
    description: string;
    vision: string;
    joinDate: string;
    contact: {
      email: string;
      phone: string;
      website: string;
      instagram?: string;
      linkedin?: string;
      twitter?: string;
    };
    /** Akademik danışmanın adı — iletişim bilgileri KVKK private, sadece admin görür */
    advisorName?: string;
    projects?: number;
    volunteerHours?: number;
    activeMemberRate?: number;
    /** Super-admin onayladığında true olur → "Doğrulanmış Kulüp" rozeti */
    verified?: boolean;
    /** Hangel kampüs elçisi — başvuruda veya sonradan super-admin atar → "Kampüs Elçisi" rozeti */
    campusAmbassador?: boolean;
    /** Okulun en aktif 3 kulübünden biri (super-admin manuel set veya aktivite metriğinden) */
    activeClub?: boolean;
};

export type SchoolRepresentative = {
    id: string;
    name: string;
    school: string;
    type: 'university' | 'high-school';
    role: string;
    avatarUrl: string;
    linkedinUrl: string;
    faculty?: string;
}

/**
 * Gönüllü görev tamamlama kaydı.
 *
 * Akış:
 *   1. Kullanıcı tamamladığı görev için saat girer + meslek seçer (profile fallback)
 *   2. Server `volunteerScoring` koleksiyonundan profession'a karşılık gelen
 *      `manHourCost` (TL/saat) değerini snapshot olarak `hourlyRateAtTime`'a yazar.
 *      hourlyRate sonradan güncellense de bu kayıttaki etki değeri değişmez.
 *   3. STK admin onaylar → user.stats.totalImpactValue += impactValueTRY
 *   4. Sertifika üretilir (HTML).
 *
 * Timestamp alanları Firestore'da `Timestamp` olarak saklanır; clientte
 * SDK tarafından `Timestamp` objesine deserialize edilir. Type tarafında
 * basit `unknown` yerine string|number yapmıyoruz çünkü mevcut Application
 * tipi de timestamp alanlarını `string` ile temsil ediyor (ekrana basılırken
 * `.toDate()` çağrısı çağrı yerinde yapılır). Bu yüzden timestamp alanlarını
 * Firestore round-trip'inin döndürdüğü ham objeye (Firestore Timestamp) bırakıp
 * any-cast'ten kaçınıyoruz: `{ seconds: number; nanoseconds: number }` shape.
 */
export type VolunteerCompletion = {
  id: string;
  userId: string;
  taskId: string;            // listing (volunteering opp) veya event id
  ngoId: string;
  startedAt: { seconds: number; nanoseconds: number };
  completedAt: { seconds: number; nanoseconds: number };
  hoursLogged: number;       // user girer
  professionId?: string;     // volunteerScoring doc id; user profile'dan default
  professionLabel?: string;  // snapshot — sonradan rename edilse de kayıt korunur
  hourlyRateAtTime: number;  // snapshot (TL/saat, manHourCost)
  impactValueTRY: number;    // hoursLogged × hourlyRateAtTime
  ngoApproved: boolean;      // STK admin onayı
  approvedAt?: { seconds: number; nanoseconds: number };
  approvedBy?: string;       // STK admin uid
  adjustedHours?: number;    // STK admin saat düzeltme yaparsa orijinal hours korunur
  notes?: string;            // kullanıcı notu
  certificateIssued: boolean;
  certificateUrl?: string;
};

export type Application = {
    id: string;
    userId?: string;
    userName?: string;
    title: string;
    type: 'Gönüllülük' | 'Marka' | 'Kulüpler' | 'STK';
    org: string;
    date: string;
    location: string;
    status: 'Onaylandı' | 'Beklemede' | 'Reddedildi';
    entityId?: string;
    rejectionReason?: string;
}

export type DonationTransaction = {
    id: string;
    type: 'income' | 'expense';
    brand: string;
    purchaseAmount: string;
    donationAmount: string;
    ngo: string[];
    date: string;
    time: string;
};

export type Notification = {
  id: string;
  type: 'donation' | 'application' | 'badge' | 'announcement';
  title: string;
  description: string;
  timestamp: string;
  isRead: boolean;
};

export type ManagedItem = {
    name: string;
    type: 'STK' | 'Marka' | 'Öğrenci Kulübü';
    icon: string;
    logoUrl?: string;
    href: string;
    status: 'approved' | 'pending';
};

export type AdBanner = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  link: string;
};

export type HelpTopic = {
  icon: string;
  title: string;
  slug: string;
  description: string;
  subtopics: { title: string; link: string; content: string; }[];
};

export type MarketCategory = {
  mainCategory: string;
  subCategories: {
    name: string;
    imageUrl: string;
    isHot?: boolean;
  }[];
};
