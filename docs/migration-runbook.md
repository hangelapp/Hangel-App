# hangel — Yeni GCP/Nonprofit Projesine Göç Runbook'u

**Tarih:** 2026-06-30
**Eski proje:** `hangel-new-v18-87297865-9bcc3` (proje no `1082171206975`) — probation'da
**Yeni proje:** ihadiguzel@gmail.com (Google for Nonprofits), nonprofit Cloud kredisi bağlı
**Repo:** `/Users/apple/new-app` (⚠️ iç içe kopya `new-app/new-app/` var — netleştir)

**Toplam süre:** 3-4 çalışma günü (el emeği ~14-18 saat; gerisi bekleme: import, index BUILDING, DNS TTL, console review).

**Placeholder:** `<YENI_PROJECT_ID>`, `<YENI_PROJECT_NUMBER>`, `<YENI_WEB_API_KEY>`, `<YENI_WEB_APP_ID>`, `<YENI_DOMAIN>` (cutover'a kadar App Hosting default URL).

---

## 🔴 EN KRİTİK 4 KIRILMA NOKTASI
1. `config.ts` + `firebase-messaging-sw.js` — **apiKey+appId+projectNumber BİRLİKTE** yeni projeden alınmazsa app eski projeye konuşur / auth kırılır.
2. Auth **password hash parametreleri** eksikse tüm email/password kullanıcıları kilitlenir.
3. **MAIL_CRED_ENC_KEY** değişirse per-STK SMTP cred'leri geri dönülemez okunamaz olur (AYNI değeri taşı).
4. App Hosting secret **grantaccess** eksikse TÜM deploy sessizce build-fail eder.

---

## BÖLÜM 1 — Ön Koşullar + Yeni Proje (1-2 saat)
- 1.1 [user] console.cloud.google.com → **ihadiguzel** → yeni proje `hangel-prod` → `<YENI_PROJECT_ID>` (ID kalıcı!)
- 1.2 [user] 🔴 Billing → nonprofit kredili account'u bağla (App Hosting+Functions+Firestore Blaze ister)
- 1.3 [user] Firebase'e ekle (existing GCP project) → Blaze
- 1.4 [user] Web app + iOS app (`GoogleService-Info.plist`) + Android app (`google-services.json`) kaydet, config değerlerini al
- 1.5 [user] API'leri enable: Firestore, Identity Toolkit, Storage, Functions, Secret Manager, Cloud Build, App Hosting, FCM, People API, Logging
- 1.6 [ben] 🔴 Yeni SA anahtarı (repodaki .firebase-service-account.json ESKİ projeye ait) → yeni projeden indir
- 1.7 [ben] `firebase login` (ihadiguzel) + `firebase use --add`
- ⚠️ gcloud BOZUK (Python 3.9) → import için Console kullan ya da gcloud onar

## BÖLÜM 2 — Firestore Göçü (2-4 saat + 1-3 saat bekleme)
- 2.1 [ben] Eski projeden managed export (`scripts/export-firestore-managed.mjs`) → ⚠️ billing açık olmalı (probation'da çalışmaz!)
- 2.2 [user] Export'u yeni bucket'a kopyala; 🔴 Firestore lokasyonu eski=yeni (aynı multi-region)
- 2.3 [user/ben] Import (Console → Firestore → Import/Export)
- 2.4 [ben] `.firebaserc:3` → `<YENI_PROJECT_ID>`
- 2.5 [ben] `firebase deploy --only firestore:rules` (firestore.rules 1219 satır; super-admin email proje-bağımsız)
- 2.6 [ben] indexes deploy (22 composite) → 🔴 BUILDING bitene kadar bekle

## BÖLÜM 3 — Auth Göçü (1-2 saat)
- 3.1 [ben] 🔴 `firebase auth:export` + ESKİ Console'dan **password hash parametreleri** (SCRYPT, key, salt, rounds, mem)
- 3.2 [ben] `firebase auth:import` (hash parametreleriyle)
- 3.3 [ben] Phone provider aç (`.enable-phone-auth.mjs` — 🔴 içindeki eski keyFile path'i düzelt)
- 3.4 [user] Email/Password provider enable
- 3.5 [user] Apple = custom-token akışı (`api/auth/apple/verify`) → bundle+team sabit, değişiklik yok
- 3.6 [user] 🔴 Authorized domains: `hangel.org.tr`, `*.hangel.org.tr`, yeni App Hosting domain

## BÖLÜM 4 — Storage Göçü (1-3 saat)
- 4.1 [user] Yeni bucket oluştur (lokasyon uyumlu)
- 4.2 [ben] 🔴 `gsutil -m rsync -r` (Firestore export Storage'ı KAPSAMAZ): users/, transparency/, ngos/, brands/, studentClubs/, clubs/, posts/, impact-stories/, marketing-assets/
- 4.3 [ben] `firebase deploy --only storage` (Firestore import'tan SONRA — cross-service lookup)
- 4.4 [ben] Bucket adı ref: config.ts:5, firebase-admin.ts:10, firebase-messaging-sw.js:27, export script:22

## BÖLÜM 5 — Functions Redeploy (1-2 saat)
- 5.1 [ben] 🔴 Bölge tutarlılığı: us-central1 (onNotificationCreated + 4 Live Activity trigger); europe-west1/Istanbul (emergency, disaster, tüm cron'lar)
- 5.2 [ben] Secret'lar: 5 APNS (Live Activity), SendGrid, Twilio
- 5.3 [ben] build + deploy → bekleyen 2 cron (eventAttendeeReminders, affiliateApprovalSync) otomatik gelir (deploy borcu kapanır)
- 5.4 [ben] 🔴 `messaging-worker.ts:22` APP_URL + MESSAGING_WORKER_KEY yeni domain/key ile eşleşmeli (yoksa toplu mail/SMS sessizce gitmez)

## BÖLÜM 6 — Secret/Env (2-3 saat, en hata-açık)
- 🔴 Her secret'tan sonra **grantaccess** (yoksa sessiz build-fail)
- 6.1 [ben] 8 Secret Manager ref: GEMINI_API_KEY, OAUTH_STATE_SECRET, MAIL_CRED_ENC_KEY (🔴 AYNI değer!), WHATSAPP_*, GOOGLE_CONTACTS_*, MESSAGING_WORKER_KEY
- 6.2 [ben] Plaintext→Secret Manager + ROTATE: RESEND_*, META_APP_SECRET, GOOGLE_ADS_*, SANTRAL_GATEWAY_SECRET, PASSKIT dörtlüsü
- 6.3 [ben] .env.example ek secret'lar (yeni üret): ADMIN_IMPORT_KEY, webhook secret'ları, NETGSM, PASIFIK, NKOLAY, WABA, vb.
- 6.4 [ben] NEXT_PUBLIC_FIREBASE_VAPID_KEY (yeni) + 🔴 NEXT_PUBLIC_APP_URL ekle (şu an tanımsız, fallback hangel.org)
- 6.5 [ben] 🔴 İKİ apphosting.yaml var (kök + new-app/new-app) IDENTICAL → hangisi canlı netleştir

## BÖLÜM 7 — OAuth Redirect + 3rd-party (1-2 saat + review)
- 🔴 Avantaj: redirect'ler kodda HARDCODE DEĞİL (`publicOrigin()` runtime türetir) → kod değişmez; sadece provider console'da yeni domain callback ekle
- 7.1 [user] Google Ads — yeni OAuth client + redirect `.../api/ngo-admin/ads/google/callback` (client değişirse apphosting:160-165)
- 7.2 [user] Meta (App 940901562258751) — Valid OAuth redirect + App Domain yeni domain
- 7.3 [user] TikTok — henüz cred yok (gated), review sonrası
- 7.4 [user] Google Contacts — People API redirect
- 7.5 Apple — domain bağımsız, değişiklik yok

## BÖLÜM 8 — Webhook + Hardcode URL (1.5-2 saat)
- 8.1 [ben] 🔴 A grubu (yanlışsa deploy eski projeye konuşur): config.ts:2-7 (6 alan), firebase-messaging-sw.js:25-29 (elle!), firebase-admin.ts:10, ai-context.ts
- 8.2 [ben] Domain hardcode (yeni domaine): middleware.ts:18 ROOT_DOMAIN, capacitor.config.ts:14, messaging-worker.ts:22, functions index/email-digest, chrome-extension/*, JSON-LD/canonical (app/page, ngos/[id], passport), PassKit QR, brand QR
  - ⚠️ Domain hangel.org.tr AYNI kalırsa bu blok DEĞİŞMEZ, sadece DNS hedefi
- 8.3 [ben] Mobil: GoogleService-Info.plist + google-services.json değiştir
- 8.4 [ben] ~40 script proje ID → öneri: `scripts/lib/project.mjs` tek kaynak
- 8.6 [user] 🔴 3rd-party panel webhook'ları: Resend, Netgsm, Meta WhatsApp (verify token hangel-waba-verify-2026), Affiliate postback, N-Kolay callback, Santral webhook
- 8.7 [ben] .claude/settings.local.json deploy allowlist + docs/audit runbook'ları

## BÖLÜM 9 — Domain/DNS Cutover (30 dk + 1-24 saat propagasyon)
- 9.1 [user] Yeni App Hosting backend + GitHub bağla (push→otomatik rollout)
- 9.2 [ben+user] Tüm değişiklik commit+push → default domain'de canlı → 🔴 önce default domain'de TAM TEST (DNS'e dokunmadan)
- 9.3 [user] Custom domains: hangel.org.tr + *.hangel.org.tr (wildcard)
- 9.4 [user] 🔴 CUTOVER: Cloudflare A/AAAA → yeni IP; TTL önce 300s; 🔴 MX'e DOKUNMA (mail çalışıyor); sertifika "Active" bekle
- 9.5 [user] Deep-link (AASA/assetlinks) domain uyumu

## BÖLÜM 10 — Test Checklist (cutover ÖNCESİ, default domain'de)
Auth (phone+email+apple) · Firestore (82 collection veri) · 22 index Enabled · Storage (foto/logo) · Functions (push+cron) · FCM · Secret/build (grantaccess) · OAuth (redirect_uri_mismatch yok) · Webhook · Messaging worker (toplu mail) · PassKit (Wallet) · Mobil (yeni plist)

## BÖLÜM 11 — Rollback
- 11.1 🔴 DNS rollback (en hızlı): Cloudflare A/AAAA eski IP'ye (TTL 300s → <5dk); eski backend KAPATILMADIKÇA ayakta
- 11.2 Kod: .firebaserc + config.ts ayrı commit → git revert
- 11.3 🔴 Veri: cutover sonrası yeni kayıtlar eskide YOK → düşük-trafik saatte, kısa dondurma; eski projeyi 7-14 gün AÇIK tut
- 11.4 Secret: eski projede eski değer çalışır; panel redirect'leri geri al

## BÖLÜM 12 — Eski Projeyi Kapat (7-14 gün BEKLEME sonrası)
- 12.1 [user] 🔴 7-14 gün açık tut
- 12.2 [ben] Eski proje loglarında trafik var mı (kaçan referans?)
- 12.3 [ben] Son full export + Storage rsync → arşiv
- 12.4 [user] Yabancı IAM Owner temizle (incident)
- 12.5 [user] Eski OAuth client/secret revoke
- 12.6 [user] Shut down project (30 gün geri-alma penceresi)

## Göç GEREKMEYEN (teyit)
firebase.json (proje ID yok) · capacitor appId (bundle) · .env.example NEXT_PUBLIC_FIREBASE_* (boş) · Apple Team NKZNY8NU8S + bundle com.hangel.ios.app

## Kilit dosyalar
.firebaserc · src/firebase/config.ts · public/firebase-messaging-sw.js · apphosting.yaml · scripts/export-firestore-managed.mjs · .enable-phone-auth.mjs · functions/src/messaging-worker.ts
