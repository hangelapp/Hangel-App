export interface NgoSiteBanner { id?: string; url: string; isPrimary?: boolean }

export interface NgoSiteDonations {
  hangel?: boolean;
  helpSteps?: boolean;
  sms?: boolean;
  smsShortCode?: string;
  smsKeyword?: string;
  smsTurkcell?: boolean;
  smsVodafone?: boolean;
  smsTurkTelekom?: boolean;
  bankTransfer?: boolean;
}

export interface NgoSiteAnalytics {
  gaMeasurementId?: string;
  metaPixelId?: string;
  hotjarSiteId?: string;
  yandexMetricaId?: string;
  customScript?: string;
}

export interface NgoSiteSettings {
  domain?: string;
  registrar?: string;
  primaryColor?: string;
  presidentName?: string;
  presidentMessage?: string;
  banners?: NgoSiteBanner[];
  donations?: NgoSiteDonations;
  analytics?: NgoSiteAnalytics;
  sections?: Record<string, boolean>;
  stats?: { volunteers?: number; donors?: number; foundedYear?: number; activeCampaigns?: number };
  published?: boolean;
  publishedAt?: { toDate?: () => Date } | string;
  dnsVerified?: boolean;
  dnsVerifiedAt?: { toDate?: () => Date } | string;
  updatedAt?: unknown;
}

export interface NgoDoc {
  id: string;
  name?: string;
  adminUserId?: string;
  primaryColor?: string;
  website?: string;
  presidentName?: string;
  presidentMessage?: string;
  foundedYear?: number;
  coverUrl?: string;
  stats?: { volunteers?: number; donors?: number; activeCampaigns?: number };
  siteSettings?: NgoSiteSettings;
}

export interface Banner { id: string; url: string; isPrimary: boolean }

export interface StatsState {
  volunteers: string;
  donors: string;
  foundedYear: string;
  activeCampaigns: string;
}

export const defaultSections = {
  domain: true,
  colors: true,
  banners: true,
  about: true,
  president: true,
  stats: true,
  donations: true,
  volunteering: true,
  events: true,
  ecommerce: false,
  news: true,
  sdg: true,
  transparency: true,
  contact: true,
  analytics: true,
};

export type SectionsState = typeof defaultSections;
export type SectionKey = keyof SectionsState;
