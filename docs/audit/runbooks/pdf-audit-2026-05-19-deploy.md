# PDF Audit Deploy Checklist — 2026-05-19

Bu runbook, `hangel.org.tr HATA.pdf` kullanıcı bildirimlerini ele alan 7-wave audit sonrası **production deploy adımlarını** sıralar. Tüm kod değişiklikleri `main` branch'inde commit-edilmemiş halde — kullanıcı önce review eder, sonra deploy eder.

## Önkoşul

```bash
cd /Users/ake/Documents/hangelapp
git status --short
# Beklenen: 14+ değişiklik (5 modified + 9 untracked + diğer wave commit'leri)

npm run typecheck && npm run lint && npm run test
# Hepsi PASS olmalı (baseline: 127 test pass / 116 skip / 0 fail)
```

## Adım 1 — Kod review + commit

```bash
git diff --stat | tail -50
git diff src/firebase/firestore/error-mapping.ts  # yeni helper
git diff firestore.rules                         # 4 yeni rule bloğu (fundApplications + impact-stories + likes + events super + aiAssistantConfig)
git diff storage.rules                           # impact-stories block
git diff firestore.indexes.json                  # 2 composite index
git diff src/lib/api-clients.ts                  # parseRate + default_payout fix
git diff src/app/timeline/page.tsx               # like swap to subcollection
git diff src/app/api/affiliate/webhook/         # webhook donations atomic write
```

Toplu commit önerisi (kullanıcı tek tek inceleyip:):
```bash
git add -A
git commit -m "feat: PDF audit 2026-05-19 — 90+ user-reported issues across 7 waves

- Brand/Market: %0/%100 transparency fix, demo data cleanup, super-admin parity
- Auth: login → /market redirect, emergency anon tanıtım page
- Timeline: like subcollection migration, share URL anchor fix
- Donations: webhook atomic write, market 'alışverişe başla' notification fix
- Entity buttons: brand follow, donor 30-day lock, club school check
- Super-admin: users delete/disable via Admin SDK, full edit, authorize revoke
- Library AI: API routes + sticky FAB + ProjectWriter + Sosyal Etki filter
- CMS: hangelassociation/press + conferences new routes
- Registration: 5 new contract entries + 12 consent slug fixes
- Rules: fundApplications, impact-stories storage, posts likes subcoll, events super-admin, aiAssistantConfig, ngos/brands/clubs managedXId fallback
- Misc: NGOs demo cleanup, brand-admin + club-admin posts pages, /posts/[id] permalink, useCollection error code preservation

Detay: docs/audit/tasks.md PDF-1..PDF-90 + docs/audit/decisions.md 2026-05-19"
```

## Adım 2 — Firestore + Storage Rules deploy

**Risk: Yüksek (production rules)** — Önce review, sonra deploy.

```bash
# Doğrulama (dry-run yok, sadece syntax)
firebase deploy --only firestore:rules,storage --project hangel-new-v18-87297865-9bcc3
```

Bekleyen: anında effective. Rollback için: `git revert <commit>` + tekrar deploy.

### Etki

- `posts/{id}/likes/{uid}` subcollection write (timeline like buton'u artık çalışır)
- `fundApplications` create izni (ngo-admin/funds "Hemen Başvur" çalışır)
- `impact-stories/{ngoId}/**` storage write (ngo-admin/impact-story foto upload çalışır)
- `ngos/brands/clubs` update için `managedXId` fallback (ngo-admin update permission-denied düzeltildi)
- `events` super-admin approve/reject (super-admin/events sayfası çalışır)
- `aiAssistantConfig` super-admin write + signed-in read (super-admin/ai-management persist eder)

## Adım 3 — Firestore Indexes deploy

```bash
firebase deploy --only firestore:indexes --project hangel-new-v18-87297865-9bcc3
```

Build süresi 1-10 dk. `Console > Firestore > Indexes`'te tüm satırlar **READY** olunca `/notifications` sayfası çalışır.

Diğer composite-index ihtiyaçları (Wave 2B'de tespit, defer): `donations(ngoId,date)`, `monthlyEarnings(ngoId,month)`, `campaigns(ngoId,createdAt)`, `messagingTransactions(ngoId,createdAt)`, `ngoRecipientSegments(ngoId,updatedAt)`, `emergencyRequests(status,createdAt)`, `bloodRequests(status,createdAt)`, `userRequests(type,createdAt)`. Bunlar Console'dan veya `firestore.indexes.json`'a eklenip redeploy ile yapılır (PDF-6b task).

## Adım 4 — Manuel data ops (Firestore Console)

### 4.1 — Demo brand cleanup

```
Console > Firestore > brands
Filter: donationRate == 0 || donationRate > 100 || slug == ""
Action: Delete (toplu)
```

Detaylı: `docs/audit/runbooks/brand-data-cleanup.md`

### 4.2 — Demo NGO cleanup

```
Console > Firestore > ngos
Filter: name CONTAINS 'Demo' OR name CONTAINS 'Test' OR (stats.donors == 0 AND stats.volunteers == 0 AND transparencyScore == 0)
Action: ya delete ya da `isDemo: true` set et
```

Frontend `/ngos` page'i artık `isDemo` flag'li ve zero-stat kayıtları gizliyor.

### 4.3 — Events status backfill

Mevcut event doc'larında `status` field yoksa public `/events` page'i artık göstermez (yeni filter `where status == 'Yayında'`). Backfill için:

```
Console > Firestore > events
Filter: status == undefined
Action: status = 'Yayında' set et (manuel) veya runbook script:
```
Detay: `docs/audit/runbooks/events-status-backfill.md`

### 4.4 — Logo backfill (markalar)

Eksik logo'lu brand'ler için manuel `logoUrl` ata veya Clearbit URL pattern kullan. Detay: `brand-data-cleanup.md` Adım 2-3.

## Adım 5 — App Hosting deploy

```bash
git push origin main
# Cloud Build otomatik tetiklenir
# Console > Cloud Build > builds takip et
```

Build başarısız olursa:
```bash
gcloud builds list --limit=3 --format=json | python3 -c "import sys,json; d=json.load(sys.stdin); [print(b['name'].split('/')[-1],'|',b['state'],'|',b.get('source',{}).get('codebase',{}).get('commit','')[:8]) for b in d]"
```

## Adım 6 — Smoke test (manuel)

Aşağıdaki yolları kullanıcı manuel test eder:

### A. Auth flow
- [ ] `/login/selection` → bireysel email kayıt → 4 consent checkbox tikli olmadan submit disabled → tüm consent → submit ENABLE
- [ ] Sözleşme link tıkla → 404 değil, gerçek contract sayfa açıldı
- [ ] Kayıt sonrası → `/market` yönlendirme
- [ ] Logout + login tekrar → yine `/market`

### B. Timeline + posts
- [ ] `/timeline` → bir post'a like tıkla → kalp doldu, count +1
- [ ] Like tekrar tıkla → kalp boşaldı, count -1
- [ ] Share button → native share veya clipboard copy toast
- [ ] Direkt `/posts/{postId}` URL'i çalışıyor mu (yeni permalink)

### C. Marka follow + STK donor
- [ ] `/market/{brandId}` → "Takip Et" → button "Takipte" oldu
- [ ] `/profile` → "Bağlantılarım" → "Takip Ettiğin Markalar" listede yeni marka görünüyor
- [ ] 2 STK seçili kullanıcı + 3. STK'ya "Bağışçısı ol" tıkla → "X gün sonra değiştirebilirsiniz" toast
- [ ] 30+ gün geçmişse → `/settings/ngo-selection` redirect

### D. Kulüp join
- [ ] Profilinde okul seçili olmayan kullanıcı → kulüp profilinden "Katıl" → "okul seçmelisin" toast + `/settings/volunteer` redirect
- [ ] Profilinde okul seçili + uyumlu kulüp → "Katıl" → "Üyesin" badge

### E. Bağış akışı
- [ ] Marka profilinden "Alışverişe Başla" → external link açıldı; **bağışlarım'da YENİ KAYIT YOK** (eski yanlış davranış kaldırıldı)
- [ ] Webhook test: `curl -X POST /api/affiliate/webhook/{brandId}` HMAC ile → `/my-donations` sayfasında yeni turuncu kayıt
- [ ] Super-admin: `/super-admin/donations` → BAĞIŞLAR tab → "Yatırıldı İşaretle" → kullanıcıda yeşil + notification

### F. Super-admin
- [ ] `/super-admin/users` → kullanıcı sil → kullanıcı tekrar giriş yapamamalı (Firebase Auth disabled/deleted)
- [ ] Düzenle → tüm field'lar editable (sector/position/skills/interests/languages/programs/licenses + adres)
- [ ] Yetkilendir → mevcut yetki listesi + Kaldır button + notification gönderildi mi
- [ ] `/super-admin/events` → Onay Bekleyen tab → bir event'i Onayla → public `/events` sayfasında görünür

### G. Library + AI
- [ ] `/library` sağ orta sticky 2 ikon görünür
- [ ] Chat icon → Sheet aç → "Hangel'in misyonu nedir?" sor → AI cevap (yoksa "AI servisi hazır değil" toast)
- [ ] Project icon → 3-step form doldur → AI proje önerisi
- [ ] "Sosyal Etki Envanteri" başlığında Filtrele + Sırala butonları çalışıyor
- [ ] Super-admin: `/super-admin/ai-management` → systemPrompt edit → kaydet → reload → kalıcı

### H. Emergency + acil
- [ ] Anon kullanıcı: header'da acil iconu → `/emergency/about` tanıtım açıldı; "Sen de katıl" → `/login/selection?action=register`
- [ ] Auth'lu kullanıcı: header acil iconu → `/emergency` (asıl sayfa)
- [ ] Super-admin: `/super-admin/emergency` → Kullanıcı Talepleri tab → bir talebi Onayla → il/ilçe/mahalle seç → Yayınla → o bölgedeki kullanıcılara `notifications` yazıldı mı
- [ ] Yanıtlar tab → grouped by requestId

### I. Listings
- [ ] `/ngos` → demo NGO'lar görünmüyor; zero-stat chip'leri görünmüyor
- [ ] `/clubs` → yeni 3 tab (Okulumda/Üniversite/Lise) çalışıyor
- [ ] `/clubs/profile/{clubId}` → real Firestore club doc okundu (404 yok)

### J. Misc
- [ ] `/leaderboard` → 100 kullanıcı listelendi
- [ ] `/messages` → "yeni mesaj" → compose dialog → gönder → inbox'ta görünür; sender avatar tıkla → `/profile/{uid}`
- [ ] `/invite` → rehber bağla → permission denied ise actionable toast (silent fail değil)
- [ ] `/profile` → "Bu Ayki 5 Hikayeni Oluştur" → AI 5 hikaye üretiyor
- [ ] `/timeline` post → /ngo-admin/posts ile create eden NGO/Brand/Club kendi adıyla görünür (Social Business Global değil)
- [ ] `/hangelassociation/press` ve `/hangelassociation/conferences` yeni rotalar açılıyor

## Adım 7 — Defer / follow-up listesi

Aşağıdaki maddeler kapsamda DEĞİL (sonraki wave'lerde alınacak):

| Defer ID | Görev | Tahmini iş |
|---|---|---|
| PDF-13b | Gmail/Outlook OAuth + IMAP proxy | 3-5 gün |
| PDF-50+ | Kütük lookup (Vakıf/Dernek auto-fill) | 2-3 gün |
| PDF-9a | Impact stories persist (Firestore sub-coll) | 0.5 gün |
| PDF-71-rl | Library API rate-limit | 0.5 gün |
| PDF-71-sysprompt | aiAssistantConfig.systemPrompt → flow integration | 1 gün |
| PDF-90 | /posts/[id] SSR + Open Graph meta tags | 0.5 gün |
| PDF-6b | 8 ek composite index (donations/campaigns/emergency/...) | 0.5 gün + Console |
| PDF-1b | NGOs demo backfill runbook + Admin SDK script | 0.5 gün |
| P-FCM-DELIVERY | Capacitor push + iOS APNs + payload handler | 2-3 gün |

## Acil rollback

Herhangi bir adımda problem çıkarsa:

```bash
# 1. Rules rollback
firebase rules:rollback --service firestore --project hangel-new-v18-87297865-9bcc3
firebase rules:rollback --service storage --project hangel-new-v18-87297865-9bcc3

# 2. Kod rollback
git revert HEAD
git push origin main

# 3. Indexes ROLLBACK YOK — CLI silmeyi desteklemez
# Console > Firestore > Indexes > manuel sil
```

## Onay

- [ ] Adım 1: Kod review + commit
- [ ] Adım 2: Firestore + Storage rules deploy
- [ ] Adım 3: Firestore indexes deploy + build READY beklendi
- [ ] Adım 4: Manuel data ops (brand cleanup + ngo cleanup + events backfill + logo backfill)
- [ ] Adım 5: App Hosting deploy + build READY
- [ ] Adım 6: Smoke test A-J (10 kategori)
- [ ] Adım 7: Defer task'lar `tasks.md`'de tracked

**Owner**: kullanıcı (alikemalergelen@gmail.com)
**Hazırlayan**: orchestrator (Claude Code) — 2026-05-19
**İlgili decisions**: `decisions.md` 2026-05-19 girdisi
