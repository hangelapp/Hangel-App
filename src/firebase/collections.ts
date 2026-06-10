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
  // Kullanıcı bildirimleri (timeline post ... menüsü → Bildir). Super-admin moderation.
  postReports: 'postReports',
  // Genel kullanıcı geri bildirim formu (/feedback). Super-admin inceleme.
  userFeedback: 'userFeedback',
  // OTP kodları (WhatsApp / SMS doğrulama) — server-only (firestore.rules:19).
  otpCodes: 'otp_codes',
  // Magic link tokens (WhatsApp link auth) — server-only.
  loginLinks: 'login_links',
  // Device-link tokens (WhatsApp UTILITY "cihaz bağlama" flow). Single-use,
  // 10 dk TTL, server-only. Distinct from `loginLinks` so the new flow can
  // evolve (e.g. multi-device pairing) without touching the welcome chain.
  deviceLinks: 'device_links',
  events: 'events',
  // Etkinlik mekanları (salon/yerleşke) — kulüp/STK admin'leri ekler, super-admin
  // veya oluşturan düzenler/siler. Rezervasyon e-posta (mailto) ya da link olabilir.
  eventVenues: 'eventVenues',
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
  // Hukuk yönetim sistemi (super-admin/contracts)
  legislations: 'legislations',           // Mevzuatlar — kanun + risk + uyum
  contractApprovals: 'contractApprovals',  // Kullanıcı onay kayıtları (immutable log)
  contractPublishLog: 'contractPublishLog', // Sözleşme publish/edit audit log (append-only)
  documentArchive: 'documentArchive',      // Kurum evrak arşivi (tüzük, faaliyet belgesi)
  legalChat: 'legalChat',                  // Hukuk görevlileri chat
  complianceAnalyses: 'complianceAnalyses', // Sözleşme↔mevzuat AI uyum analizi (yalnızca admin-SDK erişir)
  contractCompliance: 'contractCompliance', // Sözleşme×ülke uyum matrisi (doc id: `{slug}-{jurisdiction}`)
  aiAssistantConfig: 'aiAssistantConfig',
  // PDF #3: per-institution "proje çağrı esasları" (project call criteria) that the
  // project-writer AI flow uses to tailor proposals to each org's talep ve esasları.
  // Doc id = institution slug. { institution, slug, requirements, format, deadline,
  // keywords, focusAreas, updatedAt }. Super-admin write; signed-in read.
  projectCallCriteria: 'projectCallCriteria',
  mailQueue: 'mailQueue',

  // Transparency
  transparency: 'transparency',
  transparencyCriteria: 'transparencyCriteria',

  // Emergency / requests
  emergencyRequests: 'emergencyRequests',
  emergencyResponses: 'emergencyResponses',
  bloodRequests: 'bloodRequests',
  userRequests: 'userRequests',

  // Hospitals — OSM + Sağlık Bakanlığı kaynaklı hastane kataloğu (~5013 doc).
  // Doc id prefix: `osm-` veya `sb-`. Read: super-admin (admin paneli) + Admin SDK
  // (api/hospitals/lookup public arama). Write: super-admin (UI'den manuel düzeltme).
  hospitals: 'hospitals',

  // Donations / funds / earnings
  donations: 'donations',
  funds: 'funds',
  fundApplications: 'fundApplications',
  monthlyEarnings: 'monthlyEarnings',
  // Affiliate webhook audit trail (Admin SDK only; brand-signed POST → impact++).
  // Doc id = `{brandId}__{orderId}` for create-or-fail idempotency.
  affiliateConfirmations: 'affiliateConfirmations',

  // Reklam Yönetimi — STK Google Ad Grants plan/hesap kayıtları (Admin SDK only).
  // STK panelden "Bunu Kur" → adPlans; hangel ekibi süper-admin'den görür/yayınlar.
  adPlans: 'adPlans',
  // STK başına bağlı Google Ads hesabı (OAuth refresh token + customerId).
  // Doc id = ngoId. SADECE Admin SDK yazar/okur (client erişmez, refreshToken secret).
  adAccounts: 'adAccounts',
  // STK başına bağlı Meta (Facebook/Instagram) reklam hesabı (long-lived
  // accessToken + adAccountId). Doc id = ngoId. SADECE Admin SDK yazar/okur
  // (client erişmez, accessToken secret).
  metaAccounts: 'metaAccounts',

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

  // iOS Apple Wallet (PassKit) — Faz 1
  // Pass'i Wallet'a ekleyen her cihaz için kayıt; Apple zorunlu update web
  // service'i bu doc'lardan push token'lara güncelleme gönderir.
  passkitRegistrations: 'passkitRegistrations',

  // iOS Live Activity (ActivityKit) — Faz 1
  // Acil kan / görev / etkinlik / kampanya Live Activity'leri için APNs
  // push token kaydı. Activity bittiğinde doc silinir.
  liveActivityTokens: 'liveActivityTokens',

  // iOS NFC tag definitions — Faz 1/2
  // STK admin tarafından oluşturulan etkinlik check-in / bağış / görev
  // doğrulama NFC etiketleri. Etiket fiziksel olarak yazıldıktan sonra
  // writtenAt + writtenBy alanları doldurulur.
  nfcTags: 'nfcTags',

  // Etkinlik check-in sub-collection — Faz 1
  // events/{eventId}/checkins/{uid} — gönüllünün etkinliğe katılım kaydı.
  // method: 'qr' | 'nfc' | 'manual', checkedOutAt: geofence exit ile dolar.
  eventCheckins: 'checkins',

  // Mikro Gönüllülük — Faz 3
  // 5-30 dk kısa görevler. STK admin oluşturur, kullanıcı konuma göre
  // listede görür + tamamlar (foto + opsiyonel verification).
  microTasks: 'microTasks',
  microTaskCompletions: 'microTaskCompletions',

  // Government registry (kütük) reference data — imported via
  // scripts/import-registry.mjs. Public-read, Admin-SDK-only write.
  // Used by the corporate registration form to auto-fill org info.
  registryDernekler: 'registryDernekler',
  registryVakiflar: 'registryVakiflar',

  // Volunteer scoring catalog — super-admin tarafından yönetilir.
  // Her doc bir "iş kalemi" (öğretmenlik, boyama, vb.) ve onun puan + adam-saat
  // maliyeti. NGO admin ilan açarken bu katalogdan seçer; puanı el ile giremez.
  volunteerScoring: 'volunteerScoring',

  // Gönüllü görev tamamlama kayıtları. Kullanıcı saat girer + meslek seçer,
  // STK admin onaylar; onaylanan kayıt user stats.totalImpactValue ve
  // pastVolunteering'e işlenir. hourlyRateAtTime snapshot olarak tutulur —
  // sonradan volunteerScoring güncellense bile etki değeri sabit kalır.
  volunteerCompletions: 'volunteerCompletions',

  // Süper-admin kişisel panel ayarları (Bildirim Ayarları kart vs.).
  // Doc id = adminUid. Yalnızca super-admin kendi doc'unu okur/yazar.
  // Path: superAdminSettings/{adminUid} — alanlar: notifications.{eventKey}.{channel}: boolean.
  superAdminSettings: 'superAdminSettings',

  // Outreach / Tanıtım kontak veritabanı. Sivil Toplum Müdürlükleri, kargo
  // şirketleri, mail hizmet sağlayıcıları, manuel eklenen STK/vakıf vd. için
  // outreach kayıtları. registryDernekler + registryVakiflar zaten resmi
  // kütükten geldiği için outreach hub'da ayrıca okunur ve burada tutulmaz.
  // Alanlar: name, type, city, district, phone, email, website, address,
  // tags, notes, lastContactedAt, status (active/contacted/converted/declined),
  // source (manual/csv/imported), addedBy (adminUid), createdAt, updatedAt.
  outreachContacts: 'outreachContacts',

  // Internal / dev only
  _devOutbox: '_devOutbox',
} as const;

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];
