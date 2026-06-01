# hangel

Next.js 15 + Firebase + Capacitor uygulaması — STK, gönüllülük, kulüp ve marka platformu.

## Stack

- **Frontend:** Next.js 15.5 (App Router) · React 19 · TypeScript · Tailwind CSS · Radix UI
- **Backend:** Firebase (Auth, Firestore, Storage), Firebase Admin SDK
- **AI:** Google Genkit (Gemini)
- **Messaging:** Email (Resend), SMS (Netgsm) — queue + worker + unsubscribe
- **Mobile:** Capacitor (iOS, Android)

## Kurulum

```bash
# 1. Bağımlılıkları yükle
npm install

# 2. Env dosyasını oluştur
cp .env.example .env
# .env içini doldur (Firebase keys, Gemini API key, vb.)

# 3. Firebase Admin servis hesabı
# Firebase Console → Project Settings → Service Accounts → Generate new private key
# İndirilen JSON'u .firebase-service-account.json olarak proje köküne koy
# (gitignored — repo'ya gitmez)

# 4. Geliştirme sunucusunu başlat
npm run dev          # http://localhost:3000

# 5. Genkit AI flow'ları için (opsiyonel)
npm run genkit:dev
```

## Komutlar

| Komut | Açıklama |
|---|---|
| `npm run dev` | Dev server (127.0.0.1:3000) |
| `npm run build` | Production build |
| `npm run start` | Production server |
| `npm run typecheck` | TypeScript kontrolü |
| `npm run lint` | ESLint |
| `npm run lint:fix` | ESLint + autofix |
| `npm run clean` | Build artefaktlarını temizle |
| `npm run deploy:rules` | Firestore + Storage rules deploy |
| `npm run deploy:firestore-rules` | Sadece Firestore rules deploy |
| `npm run deploy:storage-rules` | Sadece Storage rules deploy |
| `npm run cap:sync` | Capacitor native projelere senkronize et |
| `npm run cap:open:ios` / `cap:open:android` | Xcode / Android Studio |
| `npm run cap:run:ios` / `cap:run:android` | Cihazda/simülatörde çalıştır |

## Deploy

Push to `main` → Firebase App Hosting otomatik build + deploy
(GitHub App entegrasyonu yapılandırılmış).

```bash
git push origin main
# Status: gh api repos/hangelapp/new-app/commits/<sha>/check-runs
```

Firestore/Storage rules manuel deploy (CLI yetkisi gerek):
```bash
firebase login
npm run deploy:rules
```

## Yapı

```
src/
├── app/                      # Next.js App Router
│   ├── (public)              # Marketing/landing
│   ├── admin/                # Admin paneli
│   ├── super-admin/          # Süper admin paneli
│   ├── ngo-admin/            # STK yönetici paneli
│   ├── settings/             # Kullanıcı ayarları
│   ├── api/                  # API rotaları
│   │   ├── auth/
│   │   ├── messaging/        # Email/SMS campaign API
│   │   └── proxy/
│   └── ...
├── components/
│   ├── ui/                   # shadcn/ui base components
│   ├── layout/               # Header, footer, nav
│   ├── shared/               # Cross-feature components
│   └── providers/            # Context providers
├── firebase/                 # Firebase client SDK setup + hooks
├── hooks/                    # Custom React hooks
├── lib/
│   ├── data.ts               # Statik veri (kategoriler, iller, vb.)
│   ├── types.ts              # Domain tipleri
│   ├── messaging/            # Email/SMS queue + providers + audit
│   └── ...
└── ai/                       # Genkit AI flow'ları
```

## Notlar

- **Güvenlik:** `.firebase-service-account.json` repo'ya gitmez. Local dev için gereklidir; production `firebase-admin` runtime servis hesabı (ADC) kullanır — bkz. `src/lib/firebase-admin.ts`. Sızdırılmış eski anahtar 2026-05-18 tarihinde **rotate + revoke** edildi; git history bu tarihte `git filter-repo` ile temizlendi.
- **Auth model:** Süper-admin yetkisi **Firebase custom claim** (`request.auth.token.role == 'super-admin'`) ile kontrol edilir. Yeni admin atamak için: `npx tsx scripts/set-super-admin-claim.ts <uid>` (`GOOGLE_APPLICATION_CREDENTIALS` env var set olmalı).
- **Mock providers:** `EMAIL_DRIVER=mock` / `SMS_DRIVER=mock` olduğunda gerçek mesaj gitmez, payload Firestore `_devOutbox` koleksiyonuna yazılır.
- **Messaging worker:** `MESSAGING_WORKER_KEY` env değişkeniyle korunan `/api/messaging/worker/run` rotası Cloud Scheduler tarafından tetiklenir.
- **iOS/Android:** `npm run cap:sync` build sonrası native projeyi günceller. iOS için `cd ios && pod install` ilk kurulumda.

## Mimari & Audit Workspace

`/CLAUDE.md` proje kökünde — Claude Code/AI ajan oturumları için orkestrasyon playbook'u. `.claude/agents/` altında 8 özelleşmiş ajan tanımı (5 lead + 3 worker).

`docs/audit/` — denetim ve görev takip alanı:
- `README.md` — workspace girişi
- `findings.md` — baseline audit bulguları
- `tasks.md` — P0–P4 canlı görev panosu
- `decisions.md` — her değişikliğin plan + rollback kaydı
- `listener-audit.md` — Firestore listener analizi
- `runbooks/` — kullanıcı eylemi gereken yüksek riskli komutlar (service-account-rotate, git-history-purge, super-admin-claims, rules-deploy)

## Bilinen Teknik Borç

- **A11y kalan:** `aria.back/filter/sort` shared namespace ile çoğu kapatıldı; spesifik feature label'ları için P-A11Y-AUDIT spawn'lı.
- **Yakında özellikleri:** 23 buton/sekme `toast({ description: '... yakında' })` ile yer tutuyor (Wallet kart ekleme, etkinlik filtreleme detayları, vs.).
- **npm vulnerabilities:** 27 transitive bağımlılık açığı (xlsx + OpenTelemetry/Genkit ağacında). `npm audit fix` safe minor/patch'leri uyguladı (34→27). Major bump'lar Next.js 16-canary'e zorlar — Genkit upstream güncellemesi bekleniyor. Dependabot weekly grouped PR'larla minor'ları izliyor.
- **e-Arşiv invoice integration:** Stub (`src/lib/invoice/stub.ts`). Nilvera/Logo/Mikro API kredisi gerekir — PRD'de "Phase X" olarak işaretli.
- **FCM iOS native push:** Web SDK scaffold mevcut (`src/lib/fcm.ts` + service worker), iOS için APNs cert + Capacitor plugin install gerekir (P-FCM-DELIVERY).
