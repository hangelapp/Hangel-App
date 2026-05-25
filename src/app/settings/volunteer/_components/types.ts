// Shared types for the volunteer settings page and its section components.

export type VolunteerUserDoc = {
  volunteerInfo?: {
    profession?: string;
    professionOther?: string;
    skills?: string[];
    dailySkills?: string[];
    interests?: string[];
    languages?: string[];
    languageLevels?: Record<string, string>;
    signLanguages?: string[];
    certificates?: string[];
    driverLicenses?: string[];
    programs?: string[];
    travelInfo?: { visas?: string[] };
    muhtarInfo?: { isMuhtar?: boolean; il?: string; ilce?: string; mahalle?: string };
    emergency?: {
      emergencyContacts?: { name: string; phone: string }[];
      available?: boolean;
      hasChronicIllness?: boolean;
      usesRegularMedication?: boolean;
    };
    availabilityDays?: string[];
    availabilityTimes?: string[];
    /** Per-time-of-day saat aralığı; örn. { Gündüz: { from: '09:00', to: '17:00' }, Akşam: { from: '19:00', to: '22:00' } } */
    availabilityTimeRanges?: Record<string, { from?: string; to?: string }>;
    workModes?: string[];
    motivations?: string[];
    consents?: Partial<{
      contract: boolean;
      rights: boolean;
      ethics: boolean;
      socialImpact: boolean;
      privacy: boolean;
    }>;
    schedule?: {
      startDate?: string;
      endDate?: string;
      notifications?: boolean;
    };
    location?: {
      country?: string;
      province?: string;
      district?: string;
      neighborhood?: string;
    };
  };
  personalInfo?: {
    birthDate?: string;
    nationality?: string;
    bloodType?: string;
    bloodNotifications?: boolean;
    gender?: string;
    address?: {
      country?: string;
      province?: string;
      district?: string;
      neighborhood?: string;
      street?: string;
      doorNo?: string;
    } & Record<string, unknown>;
  } & Record<string, unknown>;
};

export type NeighborhoodsMap = Record<string, Record<string, string[]>>;

export type EmergencyContact = { name: string; phone: string };

export type ConsentsState = {
  contract: boolean;
  rights: boolean;
  ethics: boolean;
  socialImpact: boolean;
  privacy: boolean;
};

export interface CategorizedOption {
  category: string;
  items: string[];
}
