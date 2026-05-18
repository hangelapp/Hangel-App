/**
 * Toplu SMS & E-Posta sistemi için canonical tipler.
 * UI ve provider adapter'ları bu kontrat üzerinden konuşur.
 */

export type Channel = 'sms' | 'email' | 'whatsapp';
export type UseCase = 'transactional' | 'marketing' | 'emergency';
export type WhatsAppConversationCategory = 'marketing' | 'utility' | 'authentication' | 'service';

export type CanonicalErrorCode =
  | 'invalid_address'
  | 'rate_limited'
  | 'blocked'
  | 'no_consent'
  | 'provider_4xx'
  | 'provider_5xx'
  | 'unknown';

export interface SendResult {
  ok: boolean;
  providerMessageId?: string;
  errorCode?: CanonicalErrorCode;
  errorMessage?: string;
  raw?: unknown;
}

export interface DeliveryEventInput {
  providerMessageId: string;
  type: 'queued' | 'sent' | 'delivered' | 'failed' | 'bounced' | 'opened' | 'clicked' | 'unsubscribed' | 'complained';
  at: Date;
  errorCode?: CanonicalErrorCode;
  errorMessage?: string;
  raw?: unknown;
}

export interface SmsSendInput {
  to: string;
  body: string;
  senderId: string;
  useCase: UseCase;
  iysConsentVerifiedAt?: Date;
}

export interface SmsProvider {
  readonly driver: string;
  send(input: SmsSendInput): Promise<SendResult>;
  parseWebhook?(req: Request): Promise<DeliveryEventInput[]>;
}

export interface EmailSendInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
  fromEmail: string;
  fromName: string;
  replyTo?: string;
  unsubscribeUrl?: string;
  useCase: UseCase;
  tags?: Record<string, string>;
}

export interface EmailProvider {
  readonly driver: string;
  send(input: EmailSendInput): Promise<SendResult>;
  parseWebhook?(req: Request): Promise<DeliveryEventInput[]>;
}

export interface WhatsAppTemplateComponent {
  type: 'header' | 'body' | 'button';
  parameters?: Array<{ type: 'text' | 'currency' | 'date_time'; text?: string }>;
  sub_type?: 'quick_reply' | 'url';
  index?: number;
}

export interface WhatsAppSendInput {
  to: string; // E.164 (no leading +)
  templateName: string;
  templateLanguage: string; // 'tr', 'en_US'
  components?: WhatsAppTemplateComponent[];
  conversationCategory: WhatsAppConversationCategory;
  useCase: UseCase;
  wabaPhoneNumberId: string;
}

export interface WhatsAppTemplateInfo {
  name: string;
  language: string;
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
  status: 'APPROVED' | 'PENDING' | 'REJECTED' | 'PAUSED' | 'DISABLED';
  body?: string;
  raw?: unknown;
}

export interface WhatsAppProvider {
  readonly driver: string;
  send(input: WhatsAppSendInput): Promise<SendResult>;
  parseWebhook?(req: Request): Promise<DeliveryEventInput[]>;
  syncTemplates?(wabaId: string): Promise<WhatsAppTemplateInfo[]>;
}

export interface ResolvedRecipient {
  userId: string | null;
  channelAddress: string;
  vars: Record<string, string>;
  consent: { marketing: boolean; source: string; iysQueried: boolean };
}

export interface SegmentFilters {
  roles?: Array<'user' | 'ngo-admin' | 'super-admin'>;
  cities?: string[];
  districts?: string[];
  supportedNgoIds?: string[];
  volunteerNgoIds?: string[];
  interests?: string[];
  professions?: string[];
  skills?: string[];
  bloodTypes?: string[];
  donationTier?: { minTotal?: number; maxTotal?: number };
  ageRange?: { min?: number; max?: number };
}

export interface RecipientSourceSpec {
  channel: Channel;
  useCase: UseCase;
  filters?: SegmentFilters;
  segmentIds?: string[];
  manualUserIds?: string[];
  csvUploadId?: string;
  /** NGO admin gönderiminde server tarafında zorla doldurulur — client'tan tampered değer kabul edilmez */
  scopedNgoId?: string;
}

export interface CampaignCost {
  smsSegments?: number;
  estimatedCost?: number;
  currency: 'TRY';
  encoding?: 'GSM7' | 'UCS2';
}

export interface CampaignStats {
  queued: number;
  sent: number;
  delivered: number;
  failed: number;
  bounced: number;
  opened?: number;
  clicked?: number;
  unsubscribed?: number;
}

export type CampaignStatus =
  | 'draft'
  | 'scheduled'
  | 'enqueuing'
  | 'sending'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type JobStatus = 'pending' | 'leased' | 'sent' | 'failed' | 'dead';
