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
  // Kanonik ürün kütüphanesi (feed ingest — src/lib/feed). Public read, super-admin write.
  products: 'products',
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
  // QR ile masaüstü girişi: masaüstü QR üretir, telefondaki app okutup onaylar,
  // masaüstü custom token ile giriş yapar. 5 dk TTL, tek kullanımlık (consumed).
  qrLogins: 'qr_logins',
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
  // Ay-sonu manuel hesap-kesim / ödeme (payout) kayıtları. Gerçek banka API'si
  // yok; ödeme manuel yapılır, bu koleksiyon makbuz + geçmiş + denetim izini
  // tutar. Bir doc = bir STK'ya tek seferde ödenen net hak ediş (dönem bazlı
  // veya tüm bekleyenler). SADECE Admin SDK yazar (api/super-admin/payout);
  // client okur (super-admin tümünü, STK kendi ngoId'sini). Alanlar: ngoId,
  // ngoName, period, amount(net), donationIds[], donationCount, status('paid'),
  // paidAt, paidBy(uid), reference?, notes?, createdAt.
  payouts: 'payouts',
  // Affiliate webhook audit trail (Admin SDK only; brand-signed POST → impact++).
  // Doc id = `{brandId}__{orderId}` for create-or-fail idempotency.
  affiliateConfirmations: 'affiliateConfirmations',

  // Reklam Yönetimi — STK Google Ad Grants plan/hesap kayıtları (Admin SDK only).
  // STK panelden "Bunu Kur" → adPlans; hangel ekibi süper-admin'den görür/yayınlar.
  adPlans: 'adPlans',
  // STK başına bağlı Google Ads hesabı (OAuth refresh token + customerId).
  // Doc id = ngoId. SADECE Admin SDK yazar/okur (client erişmez, refreshToken secret).
  adAccounts: 'adAccounts',
  // STK başına bağlı Workspace SMTP hesabı (fromEmail + şifreli App Password).
  // Doc id = ngoId. SADECE Admin SDK yazar/okur (client erişmez, smtpPasswordEnc secret).
  mailAccounts: 'mailAccounts',
  // hangel MCC ajans bağlantısı (TEK doc id 'mcc'): MCC sahibinin OAuth refresh token'ı.
  adAgency: 'adAgency',
  // STK başına bağlı Meta (Facebook/Instagram) reklam hesabı (long-lived
  // accessToken + adAccountId). Doc id = ngoId. SADECE Admin SDK yazar/okur
  // (client erişmez, accessToken secret).
  metaAccounts: 'metaAccounts',
  // STK başına bağlı TikTok (TikTok for Business) reklam hesabı (long-lived
  // accessToken + advertiserId). Doc id = ngoId. SADECE Admin SDK yazar/okur
  // (client erişmez, accessToken secret).
  tiktokAccounts: 'tiktokAccounts',

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
  // events/{eventId}/speakerRatings/{uid} — canlı modda konuşmacı puanları (sadece going).
  eventSpeakerRatings: 'speakerRatings',
  // events/{eventId}/eventEvaluations/{uid} — etkinlik sonrası puan+yorum (sadece going).
  eventEvaluations: 'eventEvaluations',
  // events/{eventId}/participantReviews/{uid} — yönetici "Tamamla" akışında katılımcıya
  // verdiği puan (1-5) + yorum. Etkinliği kapatınca teşekkür DM'ine işlenir.
  eventParticipantReviews: 'participantReviews',

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

  // Çift yönlü değerlendirme kayıtları (gönüllü ↔ STK). Bir faaliyet
  // tamamlanınca gönüllü STK'yı/faaliyeti, STK da gönüllüyü 10 soruda
  // puanlar. Doc id deterministik: `${kind}_${refId}_${volunteerId}` (bkz.
  // src/lib/evaluations.ts → evalDocId) → çift yön tek doc'ta birleşir.
  // SADECE Admin SDK yazar (api/evaluations/*); client okur. STK
  // değerlendirmesi bitince certificateUnlocked: true → sertifika görünür.
  evaluations: 'evaluations',

  // Süper-admin kişisel panel ayarları (Bildirim Ayarları kart vs.).
  // Doc id = adminUid. Yalnızca super-admin kendi doc'unu okur/yazar.
  // Path: superAdminSettings/{adminUid} — alanlar: notifications.{eventKey}.{channel}: boolean.
  superAdminSettings: 'superAdminSettings',

  // Onboarding funnel analytics — kayıt sonrası adım adım event toplama
  // (view/complete/skip). Süper-admin /super-admin/onboarding-funnel'da terk
  // (drop-off) analizini görür. Pre-auth adımlar için anonim create açıktır;
  // okuma yalnızca super-admin. Bkz. src/lib/onboarding-analytics.ts.
  onboardingEvents: 'onboardingEvents',

  // Sanal Santral — STK çağrı merkezi (KVKK: STK=Veri Sorumlusu, hangel=İşleyen).
  // STK'nın CSV/Excel ile yüklediği arama listesi (kampanya bazlı).
  // Doc: { ngoId, name, description, sourceFileName, totalContacts, importedAt, importedBy, status: 'active'|'archived' }
  santralContactLists: 'santralContactLists',
  // Çağrılacak kişiler. Multi-list — bir kişi birden fazla listede olabilir.
  // Doc: { ngoId, listIds: string[], name, phone (E.164), email?, customFields, attempts, lastAttemptAt?, lastDisposition?, scheduledCallbackId?, createdAt }
  santralContacts: 'santralContacts',
  // Sub-collection under callSessions/{id}/notes/{noteId}
  // Doc: { agentUid, agentName, text, timestamp }
  santralCallNotes: 'notes',
  // İleri tarihli arama planları. Cron her dakika "due olanları queue'ya at".
  // Doc: { ngoId, contactId, contactName, scheduledAt: Timestamp, reason?, createdBy, status: 'pending'|'done'|'cancelled', createdAt }
  santralScheduledCallbacks: 'santralScheduledCallbacks',

  // WhatsApp Business — multi-tenant her STK kendi WABA hesabı + numarası
  wabaPhoneNumbers: 'wabaPhoneNumbers',
  // STK'nın Meta'ya onayda olan/onaylı şablonları. Doc: ngoId, name, category,
  // language, bodyText, status (draft|pending|approved|rejected), wabaTemplateId
  wabaTemplates: 'wabaTemplates',
  // Bir kişi ile olan konuşma threadi. Doc id = `${ngoId}__${contactPhone}`
  // Sub: messages — direction, type, body, status, timestamp
  wabaConversations: 'wabaConversations',
  // Sub-collection adı (messages) sabiti
  wabaMessages: 'messages',

  // Outreach / Tanıtım kontak veritabanı. Sivil Toplum Müdürlükleri, kargo
  // şirketleri, mail hizmet sağlayıcıları, manuel eklenen STK/vakıf vd. için
  // outreach kayıtları. registryDernekler + registryVakiflar zaten resmi
  // kütükten geldiği için outreach hub'da ayrıca okunur ve burada tutulmaz.
  // Alanlar: name, type, city, district, phone, email, website, address,
  // tags, notes, lastContactedAt, status (active/contacted/converted/declined),
  // source (manual/csv/imported), addedBy (adminUid), createdAt, updatedAt.
  outreachContacts: 'outreachContacts',

  // Tanıtım Araçları (pazarlama materyalleri) — super-admin yönetir + onay akışı
  // (status: 'taslak' | 'yayinda'). Onaylanınca STK/marka/kulüp panellerinde
  // targetKinds'e göre görünür; isPublic+yayinda olanlar (publicListed) kimliksiz
  // /tanitim konferans sayfasında listelenir. Doc şeması: src/lib/marketing-kit.ts
  // MarketingAsset (title, description, category, fileUrl, storagePath, fileName,
  // targetKinds[], isPublic, publicListed, status, createdBy, createdAt).
  marketingAssets: 'marketingAssets',

  // Kurumsal başvuru yetkili kişisi telefonu kayıtlı bir kullanıcıya ait değilse,
  // o kişi telefonuyla kayıt olduğunda otomatik yetkili yapılır. Bekleyen talepler
  // burada tutulur. Yalnız Admin SDK erişir (client kuralı yok). Doc: { phoneE164,
  // entityId, entityKind: ngo|brand|club, role, entityName, status: pending|resolved,
  // createdAt, resolvedUserId?, resolvedAt? }.
  pendingOrgClaims: 'pendingOrgClaims',

  // Internal / dev only
  _devOutbox: '_devOutbox',
} as const;

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];
