

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
};

export type Brand = {
  id: string;
  name: string;
  category: string;
  type: 'brand' | 'cooperative' | 'social' | 'economic';
  ngoId?: string;
  logoUrl: string;
  logoHint?: string;
  coverPhotoUrl?: string;
  donationRate: number;
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
  sustainabilityReports?: { title: string; url: string }[];
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
};

export type NGO = {
  id: string;
  name: string;
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
  };
  economicEnterpriseUrl?: string;
  posts: Post[];
  opportunities: Volunteering[];
};

export type Event = {
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
  description: string;
  providesCertificate?: boolean;
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
    };
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
};

export type User = {
    id: string;
    name: string;
    username: string;
    avatarUrl: string;
    coverPhotoUrl: string;
    impactScore: number;
    personalInfo: {
        email: string;
        phone: string;
        birthDate: string;
        gender: string;
        nationality: string;
        bloodType: string;
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
        education: { level: string; school: string; }[];
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
    }
};

export type Badge = {
  id: string;
  name: string;
  iconName: LucideIcon;
  level: 'Demir' | 'Bakır' | 'Bronz' | 'Çelik' | 'Gümüş' | 'Altın' | 'Platin' | 'Elmas';
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
};

export type StudentClub = {
    id: string;
    name: string;
    university: string;
    type: 'university' | 'high-school';
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
    };
    projects?: number;
    volunteerHours?: number;
    activeMemberRate?: number;
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

export type Application = {
    id: string;
    title: string;
    type: 'Gönüllülük' | 'Marka' | 'Kulüpler' | 'STK';
    org: string;
    date: string;
    location: string;
    status: 'Onaylandı' | 'Beklemede' | 'Reddedildi';
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
