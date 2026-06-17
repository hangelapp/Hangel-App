/**
 * WhatsApp Business (WABA) multi-tenant veri modeli.
 *
 * - Her STK kendi WABA hesabı + 1..N numara bağlar.
 * - Şablonlar Meta onayına gönderilir; onay sonrası `wabaTemplateId` dolar.
 * - Konuşma threadi deterministik id: `${ngoId}__${contactPhone}` (E.164).
 * - Mesajlar konuşmanın `messages` sub-collection'ında durur.
 *
 * Güvenlik: `accessTokenRef` Firestore'da PLAINTEXT yazılmaz — Secret Manager
 * resource path saklanır (örn. `projects/.../secrets/waba-{ngoId}/versions/latest`).
 * POC için tek pilot token apphosting.yaml env'inden gelir.
 */

import type { Timestamp } from 'firebase-admin/firestore';

export type WabaDisplayNameStatus = 'pending' | 'approved' | 'rejected';
export type WabaPhoneNumberStatus = 'active' | 'paused' | 'suspended';

export interface WabaPhoneNumber {
  id: string;
  ngoId: string;
  /** E.164, örn. +905551112233 */
  phoneNumber: string;
  /** Meta'nın atadığı phone_number_id (send URL'de kullanılır) */
  wabaPhoneNumberId: string;
  /** Meta WhatsApp Business Account ID */
  wabaAccountId: string;
  /** "Hangel Yardım" gibi görünür isim — Meta onayına tabidir */
  displayName: string;
  displayNameStatus: WabaDisplayNameStatus;
  /**
   * Secret Manager resource path. POC'de boş bırakılıp env fallback kullanılır;
   * multi-tenant moda geçince zorunlu olacak.
   */
  accessTokenRef: string;
  verifiedAt: Timestamp;
  /** Meta kalite reytingi: GREEN | YELLOW | RED */
  qualityRating?: string;
  status: WabaPhoneNumberStatus;
  /** Meta aylık mesajlaşma tier'ı: TIER_50 | TIER_250 | TIER_1K | TIER_10K | TIER_100K | TIER_UNLIMITED */
  monthlyTier?: string;
  createdAt: Timestamp;
}

export type WabaTemplateCategory = 'utility' | 'marketing' | 'authentication';
export type WabaTemplateStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'paused';

export type WabaButtonType = 'quick_reply' | 'url' | 'phone_number';

export interface WabaTemplateButton {
  type: WabaButtonType;
  text: string;
  /** type='url' için */
  url?: string;
  /** type='phone_number' için, E.164 */
  phoneNumber?: string;
  /** type='quick_reply' için opsiyonel payload */
  payload?: string;
}

export interface WabaTemplate {
  id: string;
  ngoId: string;
  wabaPhoneNumberId: string;
  /** Meta slug — küçük harf + alt çizgi, örn. "rezervasyon_onay" */
  name: string;
  category: WabaTemplateCategory;
  /** ISO 639-1, örn. 'tr', 'en' */
  language: string;
  bodyText: string;
  headerText?: string;
  footerText?: string;
  buttons: WabaTemplateButton[];
  /** Değişken adları sıralı, örn. ['name', 'date']. Body'deki {{1}} {{2}} ile eşleşir. */
  variables: string[];
  /** Meta onayladıktan sonra atadığı template id */
  wabaTemplateId?: string;
  status: WabaTemplateStatus;
  rejectionReason?: string;
  createdAt: Timestamp;
}

export type WabaMessageDirection = 'inbound' | 'outbound';

export interface WabaConversation {
  /** `${ngoId}__${contactPhone}` */
  id: string;
  ngoId: string;
  /** E.164 */
  contactPhone: string;
  contactName?: string;
  /** santralContacts doc id (varsa) */
  contactId?: string;
  lastMessageAt: Timestamp;
  lastMessageBody: string;
  lastMessageDirection: WabaMessageDirection;
  unreadCount: number;
  /** Meta 24 saatlik conversation window — bu zamandan sonra sadece şablon gönderilebilir */
  conversationWindowExpiresAt: Timestamp;
  createdAt: Timestamp;
}

export type WabaMessageType =
  | 'text'
  | 'template'
  | 'image'
  | 'document'
  | 'button-reply'
  | 'list-reply'
  | 'location';

export type WabaMessageStatus = 'sent' | 'delivered' | 'read' | 'failed';

export interface WabaMessage {
  id: string;
  direction: WabaMessageDirection;
  type: WabaMessageType;
  body?: string;
  /** type='template' için Meta template adı */
  templateName?: string;
  mediaUrl?: string;
  /** Meta'nın atadığı wamid */
  wabaMessageId: string;
  status: WabaMessageStatus;
  failureReason?: string;
  /** Outbound için gönderen kullanıcı uid */
  sentBy?: string;
  timestamp: Timestamp;
}
