/**
 * Single source of truth for Firestore collection (and known sub-collection)
 * names used in the Hangel codebase.
 *
 * Use `COLLECTIONS.foo` instead of literal `'foo'` strings when calling Firestore
 * (client modular SDK `collection(db, ...)` / `doc(db, ...)`, or admin SDK
 * `db.collection(...)`). This prevents typos and gives us a single place to
 * audit collection names against `firestore.rules`.
 *
 * Scope: This file is intentionally pure — no imports, no side effects. It
 * only exports the `COLLECTIONS` constant map and a `CollectionName` type
 * alias. Caller migration is tracked separately as task P2-7b.
 *
 * Entries are grouped by domain. Sub-collections appear after their parent
 * with a comment indicating the parent path (e.g. `recipients` lives under
 * `campaigns/{id}/recipients`).
 */

export const COLLECTIONS = {
  // Users / identity
  users: 'users',
  userInvitations: 'userInvitations',
  invites: 'invites',
  userMarketingConsent: 'userMarketingConsent',
  applications: 'applications',
  // Sub-collections under users/{uid}
  badges: 'badges',
  certificates: 'certificates',
  pastVolunteering: 'pastVolunteering',
  // FCM push tokens. Doc id = the token string itself; one doc per
  // browser/device. Path: users/{uid}/fcmTokens/{token}. See FEAT-FCM-PUSH-NOTIF.
  fcmTokens: 'fcmTokens',

  // Entities (NGO / Brand / Club)
  ngos: 'ngos',
  brands: 'brands',
  clubs: 'clubs',
  studentClubs: 'studentClubs',
  ngoTrustScores: 'ngoTrustScores',

  // Content / engagement
  posts: 'posts',
  // Sub-collection under posts/{postId}/likes — doc id = uid. See Wave 2A rules.
  postLikes: 'likes',
  events: 'events',
  // Sub-collection under events/{eventId}/rsvps — see FEAT-EVENT-RSVP.
  // Doc id = userId; { userId, status: 'going' | 'cancelled', createdAt }.
  eventRsvps: 'rsvps',
  volunteering: 'volunteering',
  library: 'library',
  notifications: 'notifications',
  broadcasts: 'broadcasts',
  messages: 'messages',
  surveys: 'surveys',
  ratings: 'ratings',
  supportTickets: 'supportTickets',
  sitePages: 'sitePages',
  siteSettings: 'siteSettings',
  contracts: 'contracts',
  aiAssistantConfig: 'aiAssistantConfig',
  mailQueue: 'mailQueue',

  // Transparency
  transparency: 'transparency',
  transparencyCriteria: 'transparencyCriteria',

  // Emergency / requests
  emergencyRequests: 'emergencyRequests',
  emergencyResponses: 'emergencyResponses',
  bloodRequests: 'bloodRequests',
  userRequests: 'userRequests',

  // Donations / funds / earnings
  donations: 'donations',
  funds: 'funds',
  fundApplications: 'fundApplications',
  monthlyEarnings: 'monthlyEarnings',
  // Affiliate webhook audit trail (Admin SDK only; brand-signed POST → impact++).
  // Doc id = `{brandId}__{orderId}` for create-or-fail idempotency.
  affiliateConfirmations: 'affiliateConfirmations',

  // Messaging — campaigns & templating
  campaigns: 'campaigns',
  // Sub-collection under campaigns/{id}/recipients
  recipients: 'recipients',
  messageTemplates: 'messageTemplates',
  messageJobs: 'messageJobs',
  deliveryEvents: 'deliveryEvents',
  recipientSegments: 'recipientSegments',
  ngoRecipientSegments: 'ngoRecipientSegments',
  whatsappTemplates: 'whatsappTemplates',
  csvUploads: 'csvUploads',

  // Messaging — billing / wallet
  messagingPackages: 'messagingPackages',
  messagingPricing: 'messagingPricing',
  messagingTransactions: 'messagingTransactions',
  messagingInvoices: 'messagingInvoices',
  messagingAuditLogs: 'messagingAuditLogs',
  messagingRateState: 'messagingRateState',
  ngoMessagingWallets: 'ngoMessagingWallets',
  ngoSenders: 'ngoSenders',
  // Sub-collection under ngoSenders/{ngoId}/senders
  senders: 'senders',
  paymentOrders: 'paymentOrders',

  // Messaging — webhooks
  webhookReplayIds: 'webhookReplayIds',

  // Infra — distributed rate limiter buckets (Admin SDK only; client rules deny)
  rateLimits: 'rateLimits',

  // QR card activation requests (öğrenci / ticari)
  qrCardActivations: 'qrCardActivations',

  // Government registry (kütük) reference data — imported via
  // scripts/import-registry.mjs. Public-read, Admin-SDK-only write.
  // Used by the corporate registration form to auto-fill org info.
  registryDernekler: 'registryDernekler',
  registryVakiflar: 'registryVakiflar',

  // Internal / dev only
  _devOutbox: '_devOutbox',
} as const;

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];
