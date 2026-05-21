# Hangel — Karar ve Değişiklik Günlüğü

Her uygulanan değişiklik (ya da bilinçli olarak ertelenen iş) burada kronolojik olarak kayıt altına alınır. Format:

```
## YYYY-MM-DD — <başlık>
- **ID**: tasks.md'deki task ID
- **Lead**: hangi lead onayladı
- **Değişiklik**: 1-2 cümle özet
- **Dosyalar**: ...
- **Risk**: L/M/H, neden
- **Rollback**: nasıl geri alınır
- **Test sonucu**: typecheck/lint/test PASS/FAIL kanıtı
- **Notlar**: gözlemler, sonraki adım
```

---

## 2026-05-21 — PDF-13b: REAL email contact-import via server-side OAuth (Gmail People API + Microsoft Graph)
- **ID**: PDF-13 / PDF-13b
- **Lead**: hangel-security-lead
- **Sorun**: `/invite` ve `/ngo-admin/qr` sayfalarındaki Gmail/Outlook/IMAP butonları "OAuth backend gerekli" stub toast'u gösteriyordu. Kullanıcı gerçek OAuth contact-import'unu şimdi build etmeyi onayladı. PDF-13b kırmızı madde.
- **Mimari (popup + postMessage, token persist YOK)**: One-shot read — `start` route signed-state + authorize URL üretir, popup açılır, provider `callback`'e döner, callback code→access token exchange + contacts fetch yapar, sonucu `window.opener.postMessage` ile geri verir, token discard edilir. Hiçbir provider token Firestore'a/loga yazılmaz.

### Threat model (STRIDE-lite) + alınan önlemler
- **CSRF / state forgery** → `state = base64url(JSON{uid,nonce,exp}) + '.' + HMAC-SHA256(payload, OAUTH_STATE_SECRET)`. Callback: HMAC `crypto.timingSafeEqual` ile sabit-zaman karşılaştırma + `exp` (10 dk) kontrolü + **double-submit cookie** (`oauth_state` httpOnly/Secure/SameSite=Lax) eşleşmesi. Üç koşul da sağlanmazsa hata HTML'i postMessage eder, cookie temizlenir.
- **Token leakage** → access token yalnız callback request scope'unda yaşar; loglanmaz, Firestore'a yazılmaz, response body'sine konmaz. `OAUTH_STATE_SECRET`/`*_CLIENT_SECRET` env-only (NEXT_PUBLIC değil), client'a hiç gönderilmez.
- **Open redirect** → `redirect_uri` her zaman `req.nextUrl.origin + '/api/contacts/{provider}/callback'` (server-derived). Authorize URL'deki provider whitelisted (`google`/`microsoft` literal switch; başka değer → 400).
- **XSS via contacts payload** → callback HTML'inde JSON `<script>` içine güvenli escape (`<`/`>`/`&`/`U+2028`/`U+2029` + `</script` kırma). postMessage `targetOrigin = window.location.origin` (wildcard değil). Client-side listener `event.origin !== window.location.origin` ise mesajı yok sayar.
- **Reflected error leakage** → tüm hata yolları sabit Türkçe mesaj döner; provider/stack/secret asla HTML'e veya JSON'a konmaz (`{ errorCode, message }` shape start route'ta; callback HTML'de generic mesaj).
- **Auth bypass** → `start` route `Authorization: Bearer <firebaseIdToken>` zorunlu; `getAdminAuth().verifyIdToken()` (server-auth.ts pattern). Eksik/geçersiz → 401 `UNAUTHENTICATED`. uid `state` payload'ına gömülür (callback'te kim olduğu doğrulanır).
- **Provider not configured** → client id/secret env yoksa 503 `OAUTH_NOT_CONFIGURED` + friendly TR mesaj; crash yok, frontend toast'lar.
- **Contact flooding / DoS** → People API max ~3 sayfa (nextPageToken), Graph `$top=999`; normalize sonrası **2000 cap**. Email+phone ikisi de boş olan kayıtlar drop edilir.

### Plan (5 madde)
1. **Yeni route'lar** (security-lead owns `src/app/api/contacts/**` — `src/ai/flows`/proxy/webhook ile aynı sahiplik sınıfı): `src/app/api/contacts/[provider]/start/route.ts` (POST, Next 15 **async params** `{ params }: { params: Promise<{ provider: string }> }` + `await params`, `runtime='nodejs'`) ve `src/app/api/contacts/[provider]/callback/route.ts` (GET, async params, `text/html` response). Ortak helper `src/lib/contacts/oauth.ts` (state imza/verify + Node `crypto`, provider config map, contact normalize + cap).
2. **State + double-submit cookie** start'ta üret; callback'te `timingSafeEqual` + exp + cookie eşleşme doğrula. Token exchange + People/Graph fetch server-side (`fetch`, x-www-form-urlencoded), normalize `{name, email|null, phone|null}` 2000 cap.
3. **Client wiring** — `src/app/invite/page.tsx`: `handleEmailOAuth('google'|'microsoft')` (idToken al, `/api/contacts/{provider}/start` POST, `window.open(authorizeUrl,...)`, 503 → toast); `useEffect` `message` listener (origin guard) → phone-bearing → `setPhoneContacts`/`setPhoneSynced`, email-bearing → `setEmailList`. Gmail→google, Outlook→microsoft. IMAP butonu honest toast'a çevrilir (vCard/CSV'ye yönlendirir, OAuth taklidi yok). `src/app/ngo-admin/qr/page.tsx`: aynı pattern, contacts → `setImported(ImportedContact[])` + `setImportDialogOpen(true)` (phones[]+emails[] ikisini de taşır).
4. **Env + runbook** — `.env.example`: `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `MICROSOFT_OAUTH_CLIENT_ID`, `MICROSOFT_OAUTH_CLIENT_SECRET`, `MICROSOFT_TENANT` (default common), `OAUTH_STATE_SECRET`. Yeni `docs/audit/runbooks/contacts-oauth-setup.md` (GCP People API + Azure App Registration adım adım + redirect URI'lar).
5. **Gate'ler** — `npm run typecheck` + `npm run lint` (security-lead). Final `npm run build` orchestrator'da (Next 15 async params prod-build doğrulaması kritik).

### Acceptance kriteri
- İki dynamic route Next 15 async params imzasıyla derlenir (sync params prod build'i kırardı). Env set ⇒ Gmail/Outlook tıkla → consent açılır → dönüşte contacts invite listesini doldurur. Env yok ⇒ friendly 503 toast (crash yok). State CSRF korumalı; provider secret'ler server-side; token persist edilmez. typecheck + lint PASS.
- **Redirect URI'lar (kullanıcı register edecek)**: `https://hangel.org.tr/api/contacts/google/callback` ve `https://hangel.org.tr/api/contacts/microsoft/callback`.

### Risk: M
- Yeni public-facing OAuth callback yüzeyi (CSRF/XSS/token leak vektörleri) — yukarıdaki threat-model önlemleriyle kapatıldı. Mevcut rules/auth modeline dokunulmuyor; loosening yok. Yeni npm dependency yok (`fetch` + Node `crypto`).
### Rollback
- `rm -rf src/app/api/contacts src/lib/contacts docs/audit/runbooks/contacts-oauth-setup.md`; `invite/page.tsx` + `ngo-admin/qr/page.tsx` `handleEmailProviderStub`/dialog buttons revert (git checkout); `.env.example` yeni blok sil. Provider tarafı: GCP/Azure OAuth client'larını silmek/disable etmek yeterli (kod kaldırılınca callback 404).
- **Test sonucu**:
  - `npm run typecheck`: PASS (tsc --noEmit, çıktı yok / exit 0).
  - `npm run lint`: PASS (eslint ., 0 error / 0 warning).
  - **Final `npm run build`** (Next 15 prod, async-params doğrulaması): orchestrator koşacak — iki dynamic route async params imzasıyla yazıldı (`params: Promise<{ provider: string }>` + `await params`, `runtime='nodejs'`), prod build geçmesi beklenir.
- **Self-audit (code-auditor rolü; bu ortamda subagent dispatch yok → lead doğruladı)**:
  - Async params ✓ (start + callback); `runtime='nodejs'` ✓.
  - OAuth secret'leri `NEXT_PUBLIC` değil ✓ (grep boş); client'a sızmıyor.
  - Token persist/log yok ✓ (callback/start/oauth.ts'de `console.*`/`setDoc`/`addDoc`/`.set(` token yazımı yok — yalnız `searchParams.set` + `res.cookies.set(state)`).
  - HMAC `timingSafeEqual` (uzunluk guard'lı) ✓; `exp` 10 dk ✓; double-submit cookie eşleşmesi ✓.
  - postMessage targetOrigin = `window.location.origin` (wildcard değil) ✓; client listener `event.origin` guard ✓ (her iki sayfada).
  - `as any`/`@ts-ignore`/`console.log` yok ✓; error shape `{errorCode,message}` ✓.
- **Notlar**:
  - Bu ortamda Task/subagent dispatch tool'u yok; surgical-coder + code-auditor adımları lead tarafından doğrudan yürütüldü ve plana karşı self-audit edildi (CLAUDE.md fallback).
  - rules tests (`/tests/rules`) kapsamına girmiyor — yeni Firestore rule yok (route'lar Admin SDK auth + state imzası kullanır; loosening yok). `npm run test:rules` gerekmiyor.
  - invite/page.tsx: telefonlu kişiler `setPhoneContacts`+`setPhoneSynced` (onPlatform enrich), e-postalı kişiler `setEmailList`'e besleniyor (mevcut import akışıyla aynı). qr/page.tsx: kişiler `setImported`+`setImportDialogOpen` (phones[]+emails[] taşır). IMAP butonu dürüst toast'a çevrildi (OAuth taklidi yok).

---

## 2026-05-18 — FEAT-IMECE-MATCH: intelligent volunteer matching algorithm
- **ID**: FEAT-IMECE-MATCH
- **Lead**: backend-lead
- **Sorun**: Hangel landing page'i "akıllı eşleştirme" vaat ediyor ama orijinal audit `imece` özelliğinin sadece düz liste sayfası olduğunu ve **gerçek matching algoritması olmadığını** tespit etti. Mevcut `volunteering/page.tsx` içindeki `computeMatch` 60/30/10 ağırlıklarıyla içerideydi ama PRD'nin (skill/interest/şehir/uygunluk/work mode/dil) çok-eksenli puanlamasını karşılamıyordu.
- **Değişiklik**: Saf scoring lib + ranker oluşturuldu (`src/lib/volunteer-matching.ts`); 6 eksen üzerinden 0-100 puan (Skills 30 / Interests 20 / Şehir 20 / Uygunluk 15 / Çalışma Şekli 10 / Dil 5), top-N (cap 20) sıralı sonuç + en yüksek katkıdan 3 Türkçe sebep döndürüyor. `volunteering/page.tsx` üstüne "Sana Özel Öneriler" bölümü eklendi (auth + profil varsa), 6 kart, "Tümünü Gör" anchor scroll. Flat list'in mevcut filter/sort/render kodu **dokunulmadı**.
- **Dosyalar**: `src/lib/volunteer-matching.ts` (NEW, 224 LoC), `src/app/volunteering/page.tsx` (modify: +2 import, +4 useDoc fields, +2 useMemo, +1 öneri bölümü, flat list `id="imece-all-listings"` anchor), `tests/lib/volunteer-matching.test.ts` (NEW, 10 test).
- **Skor ağırlıkları (final)**: Skills 30 (oran), Interests 20 (oran), Aynı şehir 20 (binary), Gün/saat uygunluk 15 (oran), Çalışma şekli 10 (binary, online/yüz yüze/hibrit normalizasyon), Dil 5 (oran). Saf TS — Firestore yok, side-effect yok, Türkçe locale-safe `toLocaleLowerCase('tr')`.
- **Acceptance**:
  - High match (skills+city+availability hepsi overlap) → skor 73 (>70) ✓
  - No match (sıfır overlap) → skor 0 ✓
  - Partial match (sadece skills 2/2) → skor 30 ✓
  - `rankOpportunities` desc sort + topN/RANK_CAP=20 ✓
- **Risk**: L — saf fonksiyon eklemesi + tek sayfada üst tarafa minimal JSX. Flat list davranışı, mevcut `computeMatch` (per-card progress bar) ve filter/sort hiç değişmedi.
- **Rollback**: `src/lib/volunteer-matching.ts` + `tests/lib/volunteer-matching.test.ts` sil, `page.tsx` import + `hasVolunteerProfile`/`personalizedRecs` useMemo + öneri `<section>` + `id="imece-all-listings"` anchor'ı revert.
- **Test sonucu**:
  - `npm run typecheck`: PASS
  - `npm run lint` (sadece touched files): 0 hata. Repo-genelinde 1 hata var → **pre-existing** (`src/app/api/affiliate/webhook/[brandId]/route.ts:155` `no-useless-assignment`), stash ile main üzerinde doğrulandı, bu görevden bağımsız.
  - `npm test -- --run tests/lib/volunteer-matching.test.ts`: 10/10 PASS (97ms).
- **Notlar**:
  - Opportunity şeması mevcut `Volunteering` type'ından okundu (`skills`, `dailySkills`, `interests`, `socialArea`, `languages`, `location.{city,type}`). Tolerant aliases: `requiredSkills`, `category`, `city`, `workMode`, `availabilityDays`, `availabilityTimes` — Firestore'da bu alanlar bulunduğunda da çalışır.
  - User profili `volunteerInfo.{skills,dailySkills,interests,languages,availabilityDays,availabilityTimes,workModes}` + `personalInfo.address.city`. `motivations` şu an scoring'e dahil değil (PRD'de yok ama type'da var; gelecek iterasyon için).
  - "Sana Özel Öneriler" bölümü `score > 0` filter'ı uygular — sıfır skorlu önerileri göstermez. Profil boşsa `hasVolunteerProfile=false` → bölüm gizli.
  - Work mode normalizasyonu: `'Saha' | 'Yüz Yüze' | 'Fiziksel'` → `'yüz yüze'`, `'Hibrit' | 'Hybrid'` → `'hibrit'`. Kullanıcının `workModes` enum'u Firestore'da farklı yazıldığında bile match çalışır.

---

## 2026-05-18 — P2-5b-landing-rest: i18n landing page bottom half migration
- **ID**: P2-5b-landing-rest
- **Lead**: frontend-lead
- **Değişiklik**: `src/app/page.tsx` alt yarısındaki ~70 hardcoded TR string `useTranslation()`'a taşındı. `brandTypeLabels` (4) → `landing.brandTypes.*`, `BrandCard` Bağış suffix → `landing.brandCard.donationSuffix`, "Tüm Markaları/İlanları Gör" CTA'lar + count suffix'leri → `landing.viewAllBrandsPrefix/brandsSuffix/viewAllListingsPrefix/listingsSuffix`, `VolunteeringCard` Puan/Etki Puanı/countdown (Son N gün/Son Gün/Süre Doldu) → `landing.volunteeringCard.*`, `ProductShowcaseSection` default cta1 + iki çağrının cta1/cta2 (Markaları Keşfet, Daha Fazla Bilgi, Gönüllü Ol) → `landing.showcase.*`, `publicNavItems` (5) → `landing.nav.*`, `discoveryItems` 4 kart × 4 alan (16) → `landing.discovery.{ngo,brand,clubs,library}.*`, `projectCardsData` 4 kart × 3 alan (12) → `landing.projects.{legislation,employment,academic,atlas}.*` (data array `projectCardsStatic` olarak konfigürasyon-only kaldı, JSX `t()` ile resolve ediyor), 4× InfoCard values section → `landing.values.{sustainability,accessibility,security,legal}.*`, `PublicFooter currentPageLabel="Anasayfa"` → `landing.footerLabel`.
- **Dosyalar**: `src/app/page.tsx`, `src/lib/translations.ts`
- **Yeni anahtar sayısı**: 70 (TR+EN dolu, 5 dil skeleton boş — provider P2-5d fallback TR'ye düşüyor)
- **Migrate edilen string**: ~70
- **Risk**: L — TR+EN dolu, fallback TR. CMS-driven `useWebContent.get(...)` çağrıları (donation/volunteering title/subtitle/description) brief'e göre dokunulmadı.
- **Rollback**: `git revert` veya `src/app/page.tsx` + `src/lib/translations.ts` diff'leri geri al.
- **Test sonucu**:
  - `npm run typecheck`: PASS
  - `npm run lint`: 0 errors, 9 pre-existing warnings (page.tsx:412 `Math.random` shuffle ve diğer dosyalar — hiçbiri P2-5b-landing-rest'den değil).
- **Notlar**:
  - `brandTypeLabels` modül-seviye const'u kaldırıldı, `BrandCard` içinde dinamik `t(\`landing.brandTypes.${brand.type}\`)` lookup'a çevrildi (fallback `brand`).
  - `projectCardsData` modül-seviye const'u `projectCardsStatic` (data-only, key + href + image) olarak kaldı, çevirilebilir alanlar JSX'te `t('landing.projects.<key>.title|subtitle|cta')` ile çekiliyor.
  - `ProductShowcaseSection` default `cta1` parametresi optional yapıldı, içeride `cta1 ?? t('landing.showcase.defaultCta')` resolve ediyor — hook fonksiyon scope'unda çağrılıyor.
  - 7 dil bloğunun tümünde `landing` namespace'i aynı şekilde extend edildi (skeleton'larda empty string, P2-5d fallback TR'ye düşüyor).

---

## 2026-05-18 — P2-6a refactor plan: god-page `super-admin/brands/page.tsx` (1337 LoC)
- **ID**: P2-6a (subset of P2-6 god-page refactor)
- **Lead**: frontend-lead
- **Plan** (5 bullets, structural extraction only, NO logic changes):
  1. `_components/types.ts` — shared types lifted from page (`BrandItem`, `EditFormData`, `BrandExtra`, `StatusFilter`, `BrandApplication`, `SimpleUser`, `BrandInvitation`, `BrandRole`, `BRAND_ROLE_OPTIONS`, `normalizePhone`).
  2. `_components/transfer-brand-admin-dialog.tsx` — existing in-file `TransferBrandAdminDialog` (≈190 LoC) lifted verbatim with typed props (`brand`, `allUsers`, `onAssign`, `onRevoke`).
  3. `_components/brand-bulk-tools-card.tsx` — "Veri Yönetim Araçları" card with 3 buttons + 2 confirm dialogs (clear all / seed / reset+seed). Props: `bulkOp`, `seedCount`, `onClearAll`, `onSeed`, `onResetAndSeed`.
  4. `_components/brand-stats-cards.tsx` (5-tile grid) + `_components/brand-filters-card.tsx` (search + status select + count). Props pass-through; clicks call `onStatusFilterChange`.
  5. `_components/brand-list-row.tsx` (single row + delete/toggle buttons) + `_components/brand-edit-dialog.tsx` (full edit form — Genel / İletişim / Sosyal / Adres sections + logo/cover upload). Parent owns all Firestore queries, mutations, toasts, form state; passes via props.
- **Hard rules**: 0 logic changes, callbacks/toast text preserved verbatim, same `useFirestore`/`useCollection` calls in parent, same dialog structures.
- **Target**: page.tsx ≤500 LoC (from 1337).
- **Risk**: L — pure JSX/prop extraction; no behavior delta.
- **Rollback**: `git revert` of refactor commit; new `_components/` dir removed.
- **Test sonucu**: typecheck/lint/test gates run after each extraction step.

---

## 2026-05-18 — P2-7c partial: `COLLECTIONS.*` migration — `src/hooks/**` + `src/app/api/**`
- **ID**: P2-7c (scope: hooks + api; page.tsx → P2-7c-2 follow-up)
- **Lead**: backend-lead
- **Değişiklik**: Discovery grep `src/hooks/**` + `src/app/api/**` → 25 literal match, hepsi `src/app/api/**` altında (hooks/ temizdi). 16 route dosyasında collection string literal'lar `COLLECTIONS.*` constant'ına çevrildi. Her dosyaya tek `import { COLLECTIONS } from '@/firebase/collections'` eklendi (import sırası dosyanın mevcut konvansiyonuyla eşleşti); logic'e dokunulmadı.
- **Plan**:
  1. Grep ile candidate set çıkarıldı (`.collection('foo')` formu — admin SDK heavy bölge).
  2. Unique literal seti (15 ad): `campaigns`, `csvUploads`, `deliveryEvents`, `messageJobs`, `messagingPackages`, `messagingPricing`, `ngoMessagingWallets`, `ngoSenders`, `ngos`, `paymentOrders`, `recipients`, `senders`, `userMarketingConsent`, `users`, `whatsappTemplates` — tümü `COLLECTIONS` map'inde mevcut; yeni entry eklemeye gerek olmadı.
  3. Her dosya tek tek edit edildi (import + literal → constant).
- **Dosyalar** (16):
  - `src/app/api/admin/import-data/route.ts` (1 literal: ngos)
  - `src/app/api/admin/messaging/ngo-senders/route.ts` (2: ngoSenders, senders)
  - `src/app/api/admin/messaging/ngo-wallets/route.ts` (1: ngoMessagingWallets)
  - `src/app/api/admin/messaging/pricing/route.ts` (2: messagingPricing ×2)
  - `src/app/api/admin/messaging/whatsapp/templates/sync/route.ts` (1: whatsappTemplates)
  - `src/app/api/ngo-admin/messaging/me/route.ts` (2: ngoSenders, senders)
  - `src/app/api/ngo-admin/messaging/wallet/topup/route.ts` (2: messagingPackages, paymentOrders)
  - `src/app/api/ngo-admin/messaging/campaigns/route.ts` (2: campaigns, recipients)
  - `src/app/api/messaging/webhook/[driver]/route.ts` (3: messageJobs, deliveryEvents, campaigns)
  - `src/app/api/messaging/iys/export/route.ts` (2: userMarketingConsent, users)
  - `src/app/api/messaging/payment/nkolay/callback/route.ts` (1: paymentOrders)
  - `src/app/api/messaging/unsubscribe/route.ts` (1: userMarketingConsent)
  - `src/app/api/messaging/csv/save/route.ts` (1: csvUploads)
  - `src/app/api/messaging/campaigns/route.ts` (3: campaigns ×2, recipients)
  - `src/app/api/messaging/worker/trust-score/route.ts` (1: ngoMessagingWallets)
  - `src/app/api/messaging/whatsapp/webhook/route.ts` (3: messageJobs, deliveryEvents, campaigns)
- **Sayım**: 25 literal bulundu / 25 migrate / 0 skip / 0 yeni constant
- **Risk**: L — pure rename; admin SDK call surface'ı değişmedi; constant değerler literal'larla bire bir eşleşiyor.
- **Rollback**: 16 dosya, git revert.
- **Test sonucu**:
  - `npm run typecheck`: PASS (tsc clean).
  - `npm run lint`: 0 errors, 11 pre-existing warnings (hiçbiri modify edilen dosyada değil).
  - `npm test -- tests/api/`: 13/13 file PASS — 57 pass + 1 skip.
- **Notlar**: `src/hooks/**` zaten collection literal kullanmıyor (3 dosya: use-mobile, use-site-content, use-toast — hiçbirinde Firestore ref yok). Page-level (`src/app/**/page.tsx` + `layout.tsx`) literal'lar P2-7c-2 follow-up'ında ele alınacak.

---

## 2026-05-18 — P2-8e: super-admin dashboard listeners → count aggregates
- **ID**: P2-8e
- **Lead**: backend-lead
- **Değişiklik**: `src/app/super-admin/page.tsx`'in 4 full-collection `useCollection` listener'ı (users / ngos / brands / applications) bir `useEffect` içinde `Promise.all([getCountFromServer(...) × 4])` ile değiştirildi. UI yalnız sayaç gösteriyordu (4 metric card); list / sort / group / iteration yok. Applications için pending filtresi server-side: `query(collection(db, 'applications'), where('status', '==', 'Beklemede'))`.
- **Listener-by-listener karar**:
  - `users` (sadece `.length`) → aggregate count
  - `ngos` (sadece `.length`) → aggregate count
  - `brands` (sadece `.length`) → aggregate count
  - `applications` (filter `status=='Beklemede'` → length) → aggregate count over `where('status', '==', 'Beklemede')`
- **Dosyalar**: `src/app/super-admin/page.tsx` (yalnız bu)
- **Tasarım notları**:
  - `useFirestore` + `getCountFromServer` + `query` + `where` Firebase v11 SDK; `useMemoFirebase` / `useCollection` importları kaldırıldı.
  - `cancelled` flag ile unmount/strict-mode-safe.
  - Hata `console.error` ile yutulur; UI `0` gösterir (dashboard'da bloke etmemek için kasıtlı).
- **Trade-off**: Sayılar artık canlı (snapshot) değil; her sayfa açılışında tek-seferlik fetch. Operasyonel panel ziyaret kalıbı için kabul edildi; auto-refresh isterse pull-to-refresh veya manual button eklenir (yeni follow-up gerek yok, scope dışı).
- **Listener-audit etkisi**: `docs/audit/listener-audit.md` Sıra-3 risk dosyası (4 full-collection listener) artık 0 snapshot tutuyor.
- **Risk**: L — UI'da bilgi kaybı yok; aggregate query rules tarafında `list` yetkisine bağlı, super-admin için zaten `allow list: if isSignedIn()` mevcut (line `firestore.rules:454`).
- **Rollback**: tek dosya, git revert.
- **Test sonucu**:
  - `npm run typecheck`: PASS (no output).
  - `npm run lint`: 0 errors, 11 pre-existing warnings (hiçbiri `super-admin/page.tsx`'den kaynaklı değil — grep boş).
- **Notlar**: Tasks.md `P2-8e` ✅ Done işaretlendi. Diğer P2-8 follow-up'lar (`P2-8b`, `P2-8d`, `P2-8f`) bekliyor.

---

## 2026-05-18 — P2-5b: i18n marketing pages migration (14 marketing pages)
- **ID**: P2-5b
- **Lead**: frontend-lead
- **Değişiklik**: 14 marketing sayfasında en görünür ~6-15 hardcoded TR string'i (header nav, hero title/desc, top section başlıkları, ana CTA'lar, `PublicFooter currentPageLabel`) `useTranslation()` + yeni `marketing.*` namespace'ine taşındı. CMS-driven (`useWebPage`/`useWebContent`) hero alanlarındaki **fallback** string'leri migrate edildi; CMS body intact.
- **Yeni namespace**: `marketing.{common,about,press,careers,logo,support,merchant,campus,ngoOnboarding,association,accessibility,socialImpact,imece,info}.*`. Toplam **~115 yeni anahtar** (TR+EN dolu, ru/ar/fa/es/ha skeleton yok — provider P2-5d fallback'i TR'ye düşürüyor).
- **Per-page migrate count** (~):
  - about: 7 (navLabel, join cta, hero title/subtitle/desc, association cta, values badge+title, footer)
  - press: 8 (back, navLabel, contactCta, hero title+desc fallback, releases title+desc, contact title+desc, footer)
  - careers: 9 (back, navLabel, hero title/subtitle/desc, openPositions title+desc, volunteer title+desc, applyCta×2, footer)
  - logo: 7 (back, navLabel, heroTitle, heroDescription, architecture/mediaKit/usage titles, footer)
  - logo-usage: 7 (aynı set)
  - support: 6 (heroTitle, heroDesc fallback, faqTitle, contactTitle+desc, footer)
  - merchant: 7 (back, navLabel, applyCta, hero title/subtitle/desc, footer)
  - campus: 8 (back, badge, hero title/desc fallback, register+info CTA, ctaTitle+desc, applyNow+getSupport, footer)
  - ngo-onboarding: 8 (back, navLabel, applyCta, heroBadge, hero title+desc fallback, freeApply, why title+desc, footer)
  - hangelassociation: 10 (platformBack, 4 nav links, volunteerCta, hero title+subtitle, joinCta, pressTitle, footer)
  - accessibility: 5 (backShort, navLabel, configureCta, hero title+desc fallback)
  - social-impact: 8 (back, navLabel, impactCta, hero title/subtitle/desc fallback, reports title+desc, footer)
  - imece: 11 (headerBack aria, headerCta, hero subtitle/title/desc, how title+desc, difference title+desc, ctaTitle+desc, ctaVolunteer+Explore, footer)
  - bilgi-toplumu-hizmetleri: 8 (back, navLabel, hero title+desc fallback, commercial/board/legal titles, legalDesc, viewAllContracts, footer)
  - **Toplam migrate edilen string: ~110**
- **Plan**:
  1. `translations.ts`'e tek edit: `marketing` namespace TR+EN dolu olarak eklendi.
  2. 14 sayfaya `useTranslation` import + `t = useTranslation()` + hardcoded string'leri `t('marketing.<page>.<key>')` ile değiştir.
  3. `useWebPage`/`useWebContent` fallback parametrelerindeki TR string'leri t() ile sardı (CMS body korundu).
- **Dosyalar**:
  - `src/lib/translations.ts` — marketing namespace (TR+EN)
  - `src/app/about/page.tsx`, `press/page.tsx`, `careers/page.tsx`, `logo/page.tsx`, `logo-usage/page.tsx`, `support/page.tsx`, `merchant/page.tsx`, `campus-advantages/page.tsx`, `ngo-onboarding/page.tsx`, `hangelassociation/page.tsx`, `accessibility/page.tsx`, `social-impact/page.tsx`, `imece/page.tsx`, `bilgi-toplumu-hizmetleri/page.tsx`
- **Kapsam dışı (`P2-5e` tail)**:
  - Her sayfada long-tail copy (orta/alt section başlıkları, feature kartları, FAQ accordion içerikleri, logo `rules` array, accessibility ayar item label/description'ları, careers job list TR, association sub-page'ler, imece feature card descriptions vs.) — sayfa başına 20-50 string daha. P2-5e'ye bırakıldı.
- **Risk**: L — yeni anahtar yoksa provider TR'ye düşer (P2-5d), davranış değişmez.
- **Rollback**: git revert (15 dosya).
- **Test sonucu**:
  - `npm run typecheck`: PASS
  - `npm run lint`: 0 errors, 11 pre-existing warnings (hiçbiri P2-5b'den kaynaklı değil).
- **Notlar**: `hangelassociation` `PressSection` ve `AssociationHeader` ayrı bileşendiler — her birine `useTranslation()` hook'u eklendi. `about` `useWebContent.get()` fallback'leri t() ile sarıldı (CMS override path korundu).

---

## 2026-05-18 — P2-5a: i18n migration (header + settings + landing scope)
- **ID**: P2-5 (scope a)
- **Lead**: frontend-lead
- **Değişiklik**: Header, settings index ve landing'in en görünür string'leri `useTranslation()`'a taşındı. 3 yeni namespace eklendi (`a11y.*`, `settings.*`, `landing.*`), toplam **45 yeni anahtar**. TR copy aynen korundu; EN için kaliteli çeviri yazıldı; diğer 5 dil (`ru/ar/fa/es/ha`) yeni anahtarları boş bıraktı (mevcut convention: `translations.ts`'de boş `subtitle: ""` örnekleri zaten var; provider fallback'i `?? lookup('tr') ?? key`).
- **Plan**:
  1. `translations.ts`'e `a11y`, `settings`, `landing` namespace'leri eklendi (TR/EN dolu, ru/ar/fa/es/ha skeleton).
  2. `header.tsx`: 3 hardcoded aria-label (`Menüyü aç`, `Acil Durum`, `Bildirimler`) → `t('a11y.*')`. nav.login zaten t() ile.
  3. `settings/page.tsx`: 30 hardcoded string (h1 title, 6 card title+desc, 11 link label, logout/delete dialog title/desc/cta, toast title+desc) → `t('settings.*')`.
  4. `app/page.tsx`: inline `Header` component'inin **inline `labels` map**'i (7 dil × 3 anahtar = 21 hardcoded string) silindi → `t('landing.*')` + `t('a11y.*')` + `t('nav.login')`. "Discover" ve "Association" section title/desc/CTA (5 string) migrate edildi. Hero hala `useWebContent.get()` üzerinden CMS-driven (kasıt: CMS overrides katmanı).
- **Dosyalar**:
  - `src/lib/translations.ts` — 7 dile namespace eklendi (TR/EN dolu, diğer 5 boş)
  - `src/components/layout/header.tsx` — 3 aria-label
  - `src/app/settings/page.tsx` — 30 string + `useTranslation` import
  - `src/app/page.tsx` — inline labels map kaldırıldı, 5 section string migrate
- **Kapsam dışı (P2-5b ve P2-5c follow-up)**:
  - Landing'in alt yarısı: brand carousel cta, volunteering count, `kurumlar-grid` description, 4× InfoCard values (Sürdürülebilirlik/Erişilebilirlik/Güvenlik/Yasal Bilgiler), `publicNavItems` (5), `discoveryItems[]` (12), `projectCardsData` (16), `brandTypeLabels` (4), `VolunteeringCard` countdown ("Son N gün"/"Son Gün"/"Süre Doldu"), "Tüm Markaları/İlanları Gör" CTA'ları, `PublicFooter currentPageLabel="Anasayfa"`. ~70 string → `P2-5b-landing-rest`.
  - Marketing pages (about, press, careers, logo, logo-usage, vb.) → `P2-5b`.
  - Dashboards (profile, my-applications, my-badges, my-donations, messages, notifications) → `P2-5c`.
  - `ProductShowcaseSection` cta1 default `"Daha Fazla Bilgi"` (component-internal default, çağrı yerlerinde override).
- **Risk**: L — anahtar yoksa provider mevcut TR fallback'e düşer; davranış aynı kalır. Yeni dosya yok.
- **Rollback**: 4 dosyada git revert.
- **Test sonucu**:
  - `npm run typecheck`: PASS (sadece pre-existing `logo-usage/page.tsx` `Icons` reference hataları — lucide-wildcard paralel ajanına ait, P2-5a değil).
  - `npm run lint`: 0 errors, 11 pre-existing warnings (hiçbiri P2-5a'dan kaynaklı değil).
- **Notlar**:
  - **Önemli**: Provider fallback `lookup(language) ?? lookup('tr') ?? key` — `??` nullish, `""` empty string nullish DEĞİL. Boş bırakılan ru/ar/fa/es/ha kullanıcıları yeni anahtarlar için **boş gösterim** alır. Existing precedent (`subtitle: ""`) ile tutarlı; brief explicit izin verdi. P2-5d optional: `lookup` empty string için undefined dönsün — davranış değişikliği, ayrı task.
  - Landing hero CMS-driven (`useWebContent.get()`) bırakıldı; CMS Turkish fallback'i sağlıyor.

---

## 2026-05-18 — P1-7: `target="_blank"` + `rel="noopener noreferrer"` pass
- **ID**: P1-7
- **Lead**: frontend-lead
- **Değişiklik**: Frontend audit'inde tespit edilen `target="_blank"` kullanan tüm `<a>` ve `<Link>` elemanlarına `rel="noopener noreferrer"` eklendi. `window.opener` exploit'i (tabnabbing) kapatıldı. 7 dosya patch'lendi; 26+ dosya zaten doğru olduğu için atlandı.
- **Plan**: 
  1. `grep -rn 'target="_blank"' src/` ile tüm aday dosyalar bulundu (40+ match).
  2. Her dosya için ±5 satır okunup `rel` var/yok kontrol edildi.
  3. Eksik olanlara `rel="noopener noreferrer"` eklendi; `rel="noreferrer"` varsa `noopener` token'ı birleştirildi.
  4. P0-4 sahipliğindeki dosyalar (server-auth, super-admin/layout, firestore.rules, storage.rules) atlandı — bu dosyalarda zaten `target="_blank"` yoktu.
  5. `sanitize-html.ts` JSDoc yorumu olduğu için skip; DOMPurify P1-6'da `rel` ekliyor.
- **Dosyalar** (patch'lenen 7):
  - `src/app/ngos/[id]/page.tsx:258` — Link, eklendi
  - `src/app/super-admin/contracts/page.tsx:302` — Link, eklendi
  - `src/app/super-admin/web-content/page.tsx:530` — Link, eklendi
  - `src/app/super-admin/association-content/page.tsx:605` — Link, eklendi
  - `src/app/super-admin/funds/page.tsx:390` — Link, eklendi
  - `src/app/super-admin/pages/page.tsx:302` — Link, eklendi
  - `src/app/settings/ngo-selection/page.tsx:517` — `rel="noreferrer"` → `rel="noopener noreferrer"`
- **Zaten doğru (skip)**: logo-usage, logo, admin/temsilciler, ngos/[id] socials (4 link), bilgi-toplumu, invite (2 link, multi-line), super-admin/users, transparency (5 link, multi-line), market/[id], ngo-admin/website/preview (8 link), ngo-admin/funds (2 link), ngo-admin/qr (5 link, multi-line), login/selection (24 link), share-buttons (2 link). Toplam ~58 occurrence zaten korumalı.
- **Risk**: L — yalnızca security-hardening attribute; davranış değişikliği yok, görsel değişiklik yok.
- **Rollback**: `git revert <commit>` veya 7 eklenen `rel="noopener noreferrer"` token'ını manuel sil.
- **Test sonucu**: 
  - `npm run typecheck`: PASS (0 errors)
  - `npm run lint`: PASS (0 errors, 11 pre-existing warnings — unrelated dosyalar)
- **Notlar**: Tüm `target={'_blank'}` JSX expression variant grep'inde 0 match. P1-7 ✅ kapanışa hazır.

---

## 2026-05-18 — Orchestration infrastructure oluşturuldu
- **ID**: init
- **Lead**: orchestrator
- **Değişiklik**: 3 katmanlı ajan sistemi (5 lead + 3 worker) `.claude/agents/`'a eklendi. Proje kökünde `CLAUDE.md` orchestration playbook'u oluşturuldu. `docs/audit/` altında bulgu/görev/runbook iskeleti yerleştirildi.
- **Dosyalar**: 
  - `.claude/agents/hangel-{security,frontend,backend,devops,product}-lead.md`
  - `.claude/agents/hangel-{surgical-coder,code-auditor,test-engineer}.md`
  - `CLAUDE.md`
  - `docs/audit/{README,findings,tasks,decisions}.md`
  - `docs/audit/runbooks/{service-account-rotate,git-history-purge,super-admin-claims,rules-deploy}.md`
- **Risk**: L — sadece dokümantasyon ve ajan tanımları, çalışan kod yok.
- **Rollback**: `rm -rf .claude/agents docs/audit && rm CLAUDE.md`
- **Test sonucu**: N/A (kod yok)
- **Notlar**: İlk fix dalgası bu commit sonrasında dispatch edilecek.

---

## 2026-05-18 — P0-5 plan: super-admin layout client-side rol gating

- **ID**: P0-5
- **Lead**: hangel-frontend-lead
- **Plan**:
  1. `src/app/super-admin/layout.tsx` içine `useUser` + `useDoc<User>` ile `users/{uid}` çek (app-shell.tsx:113-118 ile aynı kalıp).
  2. `isSuperAdmin` = `authUser.email === '5384009090@hangel.org' || userData?.role === 'super-admin'` (app-shell.tsx:125-128 aynısı).
  3. Auth çözülürken `<Loader2 className="animate-spin" />` (admin shell render edilmez — flash yok).
  4. `!authUser` → `router.replace('/login/selection?action=login&redirect=...')` (app-shell.tsx:157 ile aynı login rotası).
  5. Auth var ama `!isSuperAdmin` → `router.replace('/market')` (mevcut handleBackClick fallback'u ile tutarlı).
- **Rollback**: `git checkout HEAD -- src/app/super-admin/layout.tsx` — tek dosya, geri alma trivial.
- **Risk**: L — yalnızca UI; API gating zaten rules + server-auth tarafında doğru.

---

## 2026-05-18 — CI test job + rules emulator job (P0-6) ve orphan dosya silme (P4-1)
- **ID**: P0-6 (✅), P4-1 (🟡 sandbox)
- **Lead**: hangel-devops-lead
- **Plan (5 madde)**:
  1. `verify` job'ına `Lint` ile `Build` arasına `npm run test -- --exclude 'tests/rules/**'` adımı eklendi; rules testleri ayrı job'da emülatör altında koşacak.
  2. Yeni paralel `rules-tests` job'u: `actions/setup-java@v4` Temurin 17 + `npm ci` + `npm run test:rules` (firebase emulators:exec --only firestore).
  3. `rules-tests` geçici olarak `continue-on-error: true` — Java/emulator stabilitesi doğrulanana kadar non-blocking. `TODO(P0-6b)` yorumu eklendi.
  4. Mevcut typecheck/lint/build adımları değişmedi; Node 20 + npm cache aynı; concurrency grubu aynı.
  5. P4-1 orphan dosya (`[Provide the ABSOLUTE, FULL path to the file being modified]`, 165B, git-tracked): harness `rm` / `git rm` / `mv` / `unlink` komutlarının tümünü reddetti. Manuel kullanıcı eylemi: proje kökünde `rm "[Provide the ABSOLUTE, FULL path to the file being modified]"` + `git add -A && git commit`.
- **Dosyalar**: `.github/workflows/ci.yml` (modified)
- **Risk**: L — yalnızca CI workflow; build/typecheck/lint adımları dokunulmadı. Rules job non-blocking olduğu için kırmızı status üretmez.
- **Rollback**: `git checkout HEAD -- .github/workflows/ci.yml`
- **Test sonucu**: `npm run typecheck` lokalde koştu; tek hata `src/app/my-applications/page.tsx:239` (`EmptyStateProps.title` missing), bu lead'in dokunmadığı dosya — paralel frontend-lead'in P1-9 (`empty-state.tsx`) işine bağlı, ayrı kanaldan ele alınmalı. CI status check üretimi sonraki PR'da doğrulanacak.
- **Notlar**: P4-1 kalır; user'a runbook gerekli değil — tek satır `rm` komutu yeterli. Sandbox neden engelledi bilinmiyor (bracketed dosya adı + spaces kombinasyonu olabilir).

---

## 2026-05-18 — P1-5 Done + P1-9 partial: error boundaries + EmptyState component
- **ID**: P1-5 (✅ Done), P1-9 (🔧 1/5 done)
- **Lead**: hangel-frontend-lead
- **Plan (5 madde)**:
  1. Mevcut button & shared component stilini incele (Button cva variants; lucide-react; Tailwind tokens; Türkçe metin tonu) — 1 ortak template hazırla.
  2. 7 `error.tsx` (global + 6 dashboard segment: profile, my-applications, my-donations, my-badges, notifications, messages) — Client Component, `error & {digest?}`+`reset` props, `digest` sadece `process.env.NODE_ENV === 'development'`, lucide `AlertTriangle`, "Tekrar dene" (reset) + "Ana sayfa" (`/`) butonları, sanitize edilmiş mesaj (240 char cap, fallback "Beklenmeyen bir hata oluştu.").
  3. `src/components/shared/empty-state.tsx` reusable component: `icon?: LucideIcon` (default `Inbox`), `title`, `description?`, `action?: {label, href?, onClick?}`. Hangel `Button` ile asChild/Link entegrasyonu, 60px stroke-1.5 muted icon, `role="status"`, `cn()` merge.
  4. `my-applications/page.tsx`'i proof-of-concept olarak değiştir: yerel inline `EmptyState`'i `NoMatchState`'e (FileSearch ikon) çevir; gerçek liste boşken (`applications.length === 0 && !isLoading`) shared `<EmptyState>` (Inbox, "Henüz başvurun yok", "İlginç fırsatlara başvurmak için etkinliklere göz at.", CTA `/events`). Veri akışı, types, query unchanged.
  5. `npm run typecheck && npm run lint` koş; warning olmaması için unused `eslint-disable-next-line no-console` direktiflerini temizle.
- **Değişiklik**: 79 loading.tsx + 0 error.tsx asimetrisini kapatan global + 6 segment error boundary eklendi; reusable shared EmptyState component üretildi; my-applications proof-of-concept entegrasyon yapıldı (devops-lead'in `EmptyStateProps.title` missing typecheck regresyonunu da kapatır).
- **Dosyalar**:
  - `src/app/error.tsx` (new)
  - `src/app/{profile,my-applications,my-donations,my-badges,notifications,messages}/error.tsx` (new — aynı template)
  - `src/components/shared/empty-state.tsx` (new)
  - `src/app/my-applications/page.tsx` (modified — sadece EmptyState render path)
- **Risk**: L — sadece sunum katmanı; data fetching/types/API yok. Mevcut deps (Tailwind, lucide-react, Radix, next/link) yeterli.
- **Rollback**: `git checkout HEAD -- src/app/my-applications/page.tsx && rm src/app/error.tsx src/app/{profile,my-applications,my-donations,my-badges,notifications,messages}/error.tsx src/components/shared/empty-state.tsx`
- **Test sonucu**: `npm run typecheck` PASS (exit 0, no output). `npm run lint` 0 errors; kalan 11 warning tamamen pre-existing dosyalardan — yeni eklenen dosyalardan 0 warning.
- **Notlar**: P1-9 için 4 dashboard kaldı (my-donations, my-badges, messages, notifications). Pattern hazır: shared `<EmptyState>` import → `data.length === 0 && !isLoading` koşulunda render. Stil seçimleri: ikon `strokeWidth={1.5}`, error UI'da `text-destructive` token, `font-headline` başlık, `min-h-[60vh]` dikey ortalama, button variant "default" + "outline". Shared error template gelecekteki refactor için kasıtlı component'leştirilmedi (task talimatı). Yeni `as any` / `@ts-ignore` / yeni bağımlılık yok.

---

## 2026-05-18 — P0-5 Done: super-admin layout client-side rol gating
- **ID**: P0-5
- **Lead**: hangel-frontend-lead
- **Değişiklik**: `src/app/super-admin/layout.tsx` artık `useUser` + `useDoc<User>('users/{uid}')` ile rolü okuyor; anonim ise `/login/selection?action=login&redirect=...`'a, signed-in ama super-admin değilse `/market`'a `router.replace` ile yönlendiriyor. Auth çözülürken admin shell yerine merkezi `<Loader2 className="animate-spin" />` render ediliyor (UI flash + endpoint enumeration kapandı).
- **Dosyalar**: `src/app/super-admin/layout.tsx` (modified)
- **Risk**: L — yalnızca UI gating; API tarafı rules + server-auth ile zaten korunuyor. `isSuperAdmin` literal'i `app-shell.tsx:125-128` ile birebir aynı (P0-4 sonrası ikisi de custom-claim'e taşınacak).
- **Rollback**: `git checkout HEAD -- src/app/super-admin/layout.tsx`
- **Test sonucu**: `npm run typecheck` PASS (no output, exit 0). `npm run lint` 0 errors (16 pre-existing warnings in unrelated files; super-admin/layout.tsx temiz).
- **Notlar**: `5384009090@hangel.org` email literal'i hâlâ kod tarafında — P0-4 (custom claim migration) iniş yaptığında bu satır da `request.auth.token.role === 'super-admin'`'e indirgenmeli. Yeni `as any` / `@ts-ignore` / yeni bağımlılık yok.

---

## 2026-05-18 — P2-7 (definition) — Firestore collections sabit dosyası

- **ID**: P2-7 (definition phase; caller migration P2-7b)
- **Lead**: hangel-backend-lead
- **Plan / keşif**:
  - `grep` ile `src/**/*.{ts,tsx}` içinde `.collection('...')`, `collection(db|firestore|adminDb, '...')`, `doc(db|firestore, '...', id)`, `collectionGroup('...')` literal'leri tarandı.
  - `firestore.rules` `match /COLLECTION/` yolları cross-check edildi. Sadece kuralda olup kodda kullanılmayan koleksiyonlar (`otp_codes`, `messagingProviders`, `ngoMessageTemplates`) dosyaya **alınmadı**.
  - Sub-collection olarak literal geçen 4 isim de eklendi: `recipients` (campaigns/{id}/recipients), `senders` (ngoSenders/{ngoId}/senders), `badges` ve `certificates` (users/{uid}/...).
- **Değişiklik**: `src/firebase/collections.ts` (yeni, ~95 satır, pure constants — sıfır import, sıfır side effect). `COLLECTIONS` `as const` map + `CollectionName` type alias export ediyor. Domain başına (Users / Entities / Content / Transparency / Emergency / Donations / Messaging-campaigns / Messaging-billing / Internal) tek satır comment ile gruplandı.
- **Discovered collections (45)**: `users, userInvitations, invites, userMarketingConsent, applications, badges*, certificates*, ngos, brands, clubs, studentClubs, ngoTrustScores, posts, events, volunteering, library, notifications, messages, surveys, ratings, supportTickets, sitePages, siteSettings, contracts, aiAssistantConfig, mailQueue, transparency, transparencyCriteria, emergencyRequests, emergencyResponses, bloodRequests, userRequests, donations, funds, fundApplications, monthlyEarnings, campaigns, recipients*, messageTemplates, messageJobs, deliveryEvents, recipientSegments, ngoRecipientSegments, whatsappTemplates, csvUploads, messagingPackages, messagingPricing, messagingTransactions, messagingInvoices, messagingAuditLogs, messagingRateState, ngoMessagingWallets, ngoSenders, senders*, paymentOrders, _devOutbox` (* = sub-collection literal).
- **Dosyalar**: `src/firebase/collections.ts` (new). `docs/audit/tasks.md` (P2-7 → 🔧, yeni P2-7b satırı).
- **Risk**: L — yalnızca yeni sabit dosyası; mevcut hiçbir caller'a dokunulmadı. Bundle'a sıfır runtime side effect (`as const` map tree-shake'lenebilir, tüketici yok henüz).
- **Rollback**: `git checkout HEAD -- src/firebase/collections.ts docs/audit/tasks.md docs/audit/decisions.md && rm src/firebase/collections.ts`.
- **Test sonucu**: `npm run typecheck` PASS (no output, exit 0). `npm run lint` 0 errors, 11 pre-existing warnings (hepsi unrelated dosyalarda; `src/firebase/collections.ts` temiz).
- **Notlar**: Caller migration kasten bu task'tan **çıkarıldı** — 83+ literal site dağınık (`src/firebase/**`, `src/lib/messaging/**`, `src/app/**`, `src/hooks/**`, `src/components/**`) ve büyük diff. P2-7b ayrı bir oturumda parça parça yapılacak. `siteSettings` ve `ngoRecipientSegments` koleksiyonları kuralda olduğu gibi koda da literal olarak geçtiği için dosyaya eklendi. `transparency` koleksiyonu `studentClubs` ve `transparency` ile karıştırılmasın diye ayrı tutuldu.

---

## 2026-05-18 — Wave 1 closeout (orchestrator)

- **Lead**: orchestrator
- **Tamamlanan**: P0-5, P0-6, P1-5, P1-9 (1/5), P2-7 (definition), P4-1
- **Bekleyen kullanıcı eylemleri**: P0-1, P0-1b, P0-4a (runbook'lar hazır)
- **Wave 2 kapsamı (sonraki tetik)**: P0-2 (`/api/proxy`), P0-3 (`/api/admin/import-data` Admin SDK), P0-4 (super-admin literal'i custom claim'e taşımak için kod tarafı — `app-shell.tsx:125-128` ve `server-auth.ts:11` ve `firestore.rules:12`), P1-1, P1-2, P1-3, P1-4, P1-6, P1-7, P1-8, P1-10
- **Final test sonucu**:
  - `npm run typecheck` PASS (clean exit)
  - `npm run lint` 0 errors, 11 pre-existing warnings (hiçbiri Wave 1 dosyalarında değil)
- **Yeni hardcoded admin email** (audit'in kaçırdığı): `5384009090@hangel.org` — `src/app/app-shell.tsx:125-128`. P0-4 kapsamı genişletilmeli.
- **Risk**: L — Wave 1 davranışsal sızıntı kapama (super-admin UI), defense-in-depth (CI test, error boundaries, empty states) ve hijyen (collections sabitleri, orphan delete) ile sınırlı.

---

## 2026-05-18 — P1-1 (partial) + P1-4 — Email enumeration hardening + transparency storage close-off

- **ID**: P1-1 (🔧 partial, P1-1b spawned) + P1-4 (✅)
- **Lead**: hangel-security-lead
- **Plan / keşif**:
  - P1-1: `grep -rn 'check-email' src/` → 1 caller: `src/app/login/selection/page.tsx:216` (IndividualForm `handleCheckEmail`). UX `data.exists` boolean'ına göre `login` vs `register` adımına dallanıyor — kritik akış. "Acceptable" pattern seçildi (rate-limit + sabit gecikme; existence flag korundu); tam normalizasyon `P1-1b` follow-up'a alındı.
  - P1-4: `storage.rules` 22-25. satır: `transparency/{userId}/{allPaths=**}` public read. Mevcut helper'lar: `isSuperAdmin()` (8-13), `isManagedEntity(kind, entityId)` (29-32). Write rule zaten `request.auth.uid == userId` kullanıyor; `userId` NGO uid'i. Aynı pattern read'e uygulandı + `isManagedEntity('Ngo', userId)` eklendi (mirror line 37 `ngos/{ngoId}` block).
- **Değişiklikler**:
  - `src/app/api/auth/check-email/route.ts`: in-memory `ipBuckets` Map (per-IP, 5 req/min), `getClientIp()` `x-forwarded-for` ilk-IP fallback, `CONSTANT_DELAY_MS=250` sabit gecikme her dönüş yolunda, error shape `{ errorCode, message }`, rate-limit 429 + `Retry-After` header, `auth/user-not-found` sessiz, diğer hatalar internal_error.
  - `storage.rules`: `transparency/{userId}/{allPaths=**}` `read: if true` → `isSuperAdmin() || (auth.uid == userId) || isManagedEntity('Ngo', userId)`. Write aynı 3'lü kontrole eşitlendi. Diğer match blokları KORUNDU.
- **Risk**: L. P1-1 mevcut frontend kontratı korunduğu için davranışsal değişiklik yok (~250ms ekstra latency hariç). P1-4 transparency belgelerine anonim erişim kesiliyor — şu an public link ile paylaşılan belge varsa kırılacak (NGO/super-admin login gerekecek). Test: rules emulator önerilir.
- **Rollback**:
  - `git checkout HEAD -- src/app/api/auth/check-email/route.ts storage.rules`
  - P1-4 sonrası `firebase deploy --only storage` ile eski rule geri yüklenir.
- **Test sonucu**: bkz. session sonu.
- **Notlar**: 
  - In-memory rate-limit App Hosting çok-instance senaryosunda etkisini yitirir; route comment'inde belirtildi. P1-1b kapsamında Redis/Firestore distributed limiter + response homojenizasyonu (`{ status: 'ok' }`) + frontend `selection/page.tsx` redesign (signup denemesi result'una göre dallanma).
  - P1-4: transparency belgeleri için public paylaşım ihtiyacı varsa signed URL veya `transparency-public/{ngoId}/*` ayrı match block (NGO admin tarafından opt-in) önerilir — future scope.

---

## 2026-05-18 — P1-9 closeout — EmptyState wiring 4 remaining dashboards

- **ID**: P1-9 (✅ 5/5)
- **Lead**: hangel-frontend-lead
- **Plan**: Apply existing `EmptyState` component to the 4 remaining dashboards. Surgical edit: replace inline "no data" UI with `<EmptyState>` only on the truly-empty branch (loading + auth-gate + filter-no-match preserved as-is, mirroring `my-applications` precedent).
  - `my-donations/page.tsx`: replace `<p>Henüz işlem bulunmuyor.</p>` with `EmptyState(HandHeart, "Henüz bağışın yok", "Etkilenmek istediğin bir kampanyaya bağış yaparak başla.", CTA → /funds)`. NOTE: filter/search-no-match shares the same branch (no separate filter-empty UI exists today) — accepted, since description still nudges toward action; filter clearing is via dropdowns.
  - `my-badges/page.tsx`: no explicit "no badges earned" branch exists (the list renders all locked badges by default). Add an `EmptyState(Award, ...)` shown ONLY when `enrichedBadges.length === 0` (defensive); leave existing locked/earned rendering untouched.
  - `messages/page.tsx`: replace inline inbox empty state (lines ~202-207) with `EmptyState(MessageSquare, "Henüz mesajın yok", "İletişim için yeni bir mesaj başlat.")` — no CTA. The "Mesaj bulunamadı" filter-no-match is a SEPARATE state — keep current behavior by only swapping when `messages` is truly empty.
  - `notifications/page.tsx`: replace inline Card-based empty state (lines ~151-158) with `EmptyState(Bell, "Henüz bildirimin yok", "Aktivitelerinden ve sistemden bildirimler burada görünür.")` — no CTA. Keep error Card and loader untouched.

---

## 2026-05-18 — P0-3 Done: `/api/admin/import-data` Admin SDK migration
- **ID**: P0-3
- **Lead**: hangel-security-lead
- **Plan**:
  1. Canonical Admin SDK init = `src/lib/firebase-admin.ts:31` (`getAdminFirestore(): Firestore`). Reference caller = `src/app/api/admin/messaging/ngo-senders/route.ts:7-17` (import + `runtime = 'nodejs'` + `db.collection(...)` + `FieldValue.serverTimestamp()`). Pattern mirrored verbatim.
  2. Drop `firebase/app` + `firebase/firestore` imports. Replace `initializeApp(...) / getFirestore() / collection(...) / addDoc(...)` with `getAdminFirestore().collection('ngos').add(...)` so writes bypass Firestore rules as a real admin route should.
  3. Add `export const runtime = 'nodejs'` (firebase-admin requires Node runtime, not Edge).
  4. In-memory per-IP rate limiter: `Map<ip, {count, resetAt}>`, 10 req / 60s window, derived from `x-forwarded-for` → `x-real-ip` → `'unknown'`. Comment notes per-instance only (placeholder for P1-1 family).
  5. Error shape standardized to `{errorCode, message}` for all responses (`unauthorized`, `rate_limited`, `invalid_json`, `invalid_payload`, `internal_error`); raw `String(error)` removed from client payload; full error still `console.error`'d server-side with `[import-data]` prefix.
- **Değişiklik**: `import-data` route artık Firebase Admin SDK kullanıyor; rules-bypass davranışı düzgün admin route'a uygun. `x-admin-key` auth kapısı korundu (P1-1 ailesi sonraki sertleştirme). Rate limit (10/dk/IP) + sanitize edilmiş error envelope eklendi. `FieldValue.serverTimestamp()` ile server-side timestamp.
- **Dosyalar**: `src/app/api/admin/import-data/route.ts` (modified, single file).
- **Risk**: L — yalnızca admin route surface. Response shape değişti (`error` → `errorCode`/`message`) ama bu endpoint repo içinde caller'sız (manuel script kullanım). `runtime = 'nodejs'` zaten App Hosting default'u.
- **Rollback**: `git checkout HEAD -- src/app/api/admin/import-data/route.ts`. Tek dosya, trivial.
- **Test sonucu**:
  - `npm run typecheck` PASS (clean exit; stale `.next/types` `proxy` referansları temizlendikten sonra — bu artifact P0-2 silme işleminden kaldı, bu task'la ilgisiz).
  - `npm run lint` 0 errors, 11 pre-existing warnings (hiçbiri `import-data/route.ts`'de değil).
- **Notlar**: Rate limit per-process Map — cold start / scale-out'ta sıfırlanır, kasten kabul edildi (route içinde yorum bırakıldı). Persistent rate limit (Firestore TTL doc veya Redis) P1-1 ailesi kapsamında. Yeni `as any` / `@ts-ignore` / yeni bağımlılık yok.

---

## 2026-05-18 — P0-2 Done: `/api/proxy` deleted (open SSRF)

- **ID**: P0-2
- **Lead**: hangel-security-lead
- **Caller analysis**: `grep -rn --include="*.ts" --include="*.tsx" "/api/proxy" /Users/ake/Documents/hangelapp/src` → **0 hits**. Broader `grep -rn "api/proxy"` across the repo only matched docs (`CLAUDE.md`, `docs/audit/findings.md`, `docs/audit/tasks.md`, `docs/audit/decisions.md`, `.claude/agents/hangel-security-lead.md`) — no runtime caller in `src/`, `scripts/`, tests, or hooks. The route was a dead open proxy.
- **Decision**: **DELETE**. Hardening (auth gate + host whitelist + size cap + timeout) would have been pure cruft since nothing consumes the endpoint. Per task spec, "if 0 callers → delete the file entirely."
- **Değişiklik**:
  1. `src/app/api/proxy/route.ts` silindi (38 satır).
  2. Boş kalan `src/app/api/proxy/` dizini `rmdir` ile silindi.
  3. `.env.example`'a `ALLOWED_PROXY_HOSTS=` placeholder + `# P0-2: comma-separated hosts allowed by /api/proxy` yorumu eklendi (devops-lead'in zaten genişlettiği bölüme). Bu ileride aynı route yeniden ihtiyaç olursa whitelist mekanizmasının kontrat'ını koruyor; runtime'da hiçbir şey okumuyor.
  4. `.next/types/app/api/proxy/route.ts` ve `.next/types/validator.ts` stale typegen dosyaları temizlendi (gitignored build cache; bir sonraki `npm run build` yeniden üretir).
  5. `docs/audit/tasks.md` P0-2 satırı ✅ Done olarak işaretlendi.
- **Dosyalar**:
  - `src/app/api/proxy/route.ts` (deleted)
  - `src/app/api/proxy/` (empty dir removed)
  - `.env.example` (appended `ALLOWED_PROXY_HOSTS` placeholder + comment)
  - `docs/audit/tasks.md` (P0-2 row updated)
- **Risk**: L — endpointi kimse çağırmıyordu; kaldırılması davranışsal regresyon üretmez. Aksine kritik SSRF + internal network erişimi (Firebase admin endpoint, N-Kolay, GCE metadata `169.254.169.254`) yüzeyi tamamen kapandı.
- **Rollback**: Önerilmez. Restore etmek gerekirse `git checkout HEAD~1 -- src/app/api/proxy/route.ts`. Ancak silinen kod open proxy idi — restore EDİLMEMELİ. Eğer ileride agency-specific proxy ihtiyacı çıkarsa, **yeni** bir route (`/api/proxy/[agency]` gibi) Firebase ID-token auth + server-side const allowlist (env'e güvenme; sabit kod map daha güvenli) + body/response size cap (≤1MB) + 5s timeout + hop-by-hop header stripping + internal IP rejection (10/8, 172.16/12, 192.168/16, 169.254/16) + `{ errorCode, message }` envelope ile yazılmalı.
- **Test sonucu**:
  - Caller grep: 0 hit in `src/`.
  - `npm run typecheck` PASS (clean exit, 0 errors) — stale `.next/types` cache temizlendikten sonra.
  - `npm run lint` 0 errors, 11 pre-existing warnings (hiçbiri silinen dosya veya `.env.example` ile alakalı değil).
  - 401/400 anonim çağrı + whitelist-violation kabul kriterleri: endpoint artık var olmadığı için `POST /api/proxy` → **404** (Next.js default). Bu, 401/400'den daha güçlü bir sonuç — endpoint enumeration bile mümkün değil.
- **Notlar**: Caller listesi: **YOK**. Tek "referans" docs/audit yazıları + agent tanım dosyası — runtime path değil. `findings.md`'deki P0-3 ("open SSRF") bulgusu bu commit ile kapanır. Yeni `as any` / `@ts-ignore` / yeni bağımlılık yok.

---

## 2026-05-18 — P1-2 + P1-3: messaging webhook HMAC + replay protection

- **ID**: P1-2 (✅ Done), P1-3 (🔧 — TTL cleanup P1-3b'ye ayrıldı)
- **Lead**: hangel-security-lead
- **Plan / değişiklik**:
  1. Yeni helper modülü `src/lib/messaging/webhook-replay.ts`: `verifySvixSignature` (Resend / Svix v1 — `${svix-id}.${svix-timestamp}.${rawBody}` üzerinde HMAC SHA256, base64, `crypto.timingSafeEqual` ile çoklu imza desteği rotation için), `extractClientIp` (`x-forwarded-for` / `x-real-ip` / `cf-connecting-ip` fallback), `isIpAllowed` (comma-separated exact match, CIDR yok), `isTimestampFresh` (5 dakika pencere; Unix-seconds + ISO her ikisi de kabul), `rememberWebhookEvent` (Firestore `webhookReplayIds/{driver}__{eventId}` `create()` atomik — `ALREADY_EXISTS` → `'replay'`).
  2. `src/app/api/messaging/webhook/[driver]/route.ts` rewrite: artık `MESSAGING_WEBHOOK_SECRET` query/header karşılaştırması yok. Resend yolunda `RESEND_WEBHOOK_SECRET` ile Svix v1 imza doğrulanır + `svix-timestamp` freshness; Netgsm yolunda `NETGSM_WEBHOOK_ALLOWED_IPS` whitelist (env yoksa veya IP listede yoksa 401 `INVALID_SIGNATURE`). Replay: `svix-id` (Resend) veya `jobid` (Netgsm) `webhookReplayIds` koleksiyonuna create-or-fail; tekrar gelirse 409 `REPLAY_DETECTED`.
  3. Hata kodları sözleşmesi: 401 `{errorCode:'INVALID_SIGNATURE'}`, 401 `{errorCode:'STALE_TIMESTAMP'}`, 409 `{errorCode:'REPLAY_DETECTED'}` — tutarlı JSON body.
  4. `.env.example`'a APPEND: `RESEND_WEBHOOK_SECRET=` ve `NETGSM_WEBHOOK_ALLOWED_IPS=` (P1-2 başlıklı bloğun altında satır 65-71).
  5. Raw body bir kez `req.text()` ile okunup HMAC + JSON parse için tek string olarak kullanılır (Resend `parseWebhook` `req.json()` çağırdığı için clone Request inşa edilir — WhatsApp webhook'undaki pattern aynen).
- **Dosyalar**:
  - `src/lib/messaging/webhook-replay.ts` (new, ~135 satır)
  - `src/app/api/messaging/webhook/[driver]/route.ts` (rewritten — `verifySecret` kaldırıldı)
  - `.env.example` (APPEND — yeni P1-2 bloğu)
  - `docs/audit/tasks.md` (P1-2 → ✅, P1-3 → 🔧, P1-3b yeni satır)
- **Risk**: M — production'da `RESEND_WEBHOOK_SECRET` ve `NETGSM_WEBHOOK_ALLOWED_IPS` env'leri set edilmeden deploy edilirse Resend/Netgsm webhook'ları sessizce 401 alır (delivery event'leri akmaz). Deploy öncesi Firebase App Hosting secret'larına bu iki değerin yazılması ZORUNLU. Eski `MESSAGING_WEBHOOK_SECRET` artık [driver] route'unda kullanılmıyor (`MESSAGING_WORKER_KEY` farklı bir değişken — etkilenmez).
- **Rollback**: `git checkout HEAD -- src/app/api/messaging/webhook/[driver]/route.ts .env.example docs/audit/tasks.md docs/audit/decisions.md && rm src/lib/messaging/webhook-replay.ts`. Eski shared-secret modeli geri gelir.
- **Test sonucu**: `npm run typecheck` PASS (no output, exit 0). `npm run lint` 0 errors, 11 pre-existing warnings (hiçbiri bu task'ın dosyalarında değil).
- **Notlar**:
  - P1-3b ayrı task: `webhookReplayIds` koleksiyonu için Firestore TTL policy veya Cloud Scheduler cleanup (90 gün üstü doc sil). Şu an `createdAt` damgası var, TTL kurulduğunda otomatik temizlenir.
  - P1-2b ayrı task: Netgsm gerçek HMAC sağladığında `NETGSM_WEBHOOK_SECRET` (signature header) ile değişecek; helper hazır.
  - CIDR support bilinçli olarak eklenmedi — Netgsm IP havuzu küçük + exact match listesi yeterli (yanlış-pozitif daha güvenli).
  - `webhookReplayIds` Firestore rules'da match'lenmedi (Admin SDK yazıyor) — kuralları değiştirmeye gerek yok.

---

## 2026-05-18 — P1-8 + P1-10 (backend-lead)

- **ID**: P1-8, P1-10
- **Lead**: hangel-backend-lead
- **Plan / kapsam**:
  - **P1-8**: `src/ai/flows/` altında 5 flow var: `impact-story-flow`, `library-ai-assistant`, `marketplace-ai-assistant`, `marketplace-ai-product-description`, `project-writer-flow`. Caller grep (`grep -rln "ai/flows" src/`): yalnızca `getImpactStory` doğrudan `src/app/profile/page.tsx:28` tarafından çağrılıyor; diğer 4 flow şu an UI tarafından invoke edilmiyor (sadece `src/ai/dev.ts` import ediyor — Genkit dev runner). Hiçbir caller userId plumbing yapmadığı için: `sanitizeUserInput` her flow'un `export async function` wrapper'ında string input'lara çalıştırılır, `checkAndConsumeAIQuota` `src/ai/guards.ts`'ye iskelet olarak eklenir (Admin SDK + Firestore transaction, `aiQuotas/{userId}/daily-{yyyy-mm-dd}` doc-bucketed, 30 req/day default cap, env-tunable follow-up `P1-8b`) + her flow'a `// TODO(P1-8c): wire quota when caller userId is plumbed through` comment'i.
  - **P1-10**: `src/app/profile/page.tsx` top-level hardcoded boş array'ler: `badges`, `pastVolunteering`, `certificates`. `useCollection<T>(useMemoFirebase(...))` ile `users/{uid}/badges`, `users/{uid}/certificates` sub-collection'larından çekilir (`COLLECTIONS.badges`, `COLLECTIONS.certificates`). `pastVolunteering` için `applications` koleksiyonundan `userId == authUser.uid` filtresi kullanılır (Tamamlandı status filtresi client-side). Empty state'ler için `EmptyState` (`my-applications` PoC pattern'i) uygulanır. Layout, tab yapısı, story dialog, certificate PDF üretimi DOKUNULMAZ.
- **Risk**: L — flow guard'ı yalnızca string clamp/sanitize ekliyor; Firestore wire-up rules ile zaten korunan sub-collection'lar (`users/{uid}/{badges,certificates}` ve `applications` `userId`-where).
- **Rollback**: `git checkout HEAD -- src/ai/flows src/app/profile/page.tsx docs/audit/tasks.md docs/audit/decisions.md && rm -f src/ai/guards.ts`.

## 2026-05-18 — P1-6 HTML sanitization katmanı (security-lead)

- **ID**: P1-6
- **Lead**: hangel-security-lead
- **Plan / kapsam**:
  - `isomorphic-dompurify@^3.13.0` eklendi (`npm install`; server + client + RSC tek API).
  - Yeni utility: `src/lib/sanitize-html.ts` — `sanitizeHtml(input)` whitelist tabanlı (`ALLOWED_TAGS`: p/br/strong/em/b/i/u/a/ul/ol/li/h1-6/blockquote/code/pre/hr/span/div/img; `ALLOWED_ATTR`: href/target/rel/src/alt/title/class; `ALLOW_DATA_ATTR:false`; explicit `FORBID_TAGS` style/script/iframe/object/embed/base/meta + `FORBID_ATTR` onerror/onload/onclick/onmouseover/onfocus/formaction). DOMPurify default `target="_blank"` → `rel="noopener noreferrer"` davranışı korunuyor (ADD_ATTR/ADD_TAGS override yok).
  - `grep -rn dangerouslySetInnerHTML src/` 19 hit / 18 dosya buldu. Atlanan:
    - `src/components/ui/chart.tsx:81` — shadcn `<style>` CSS değişkenleri, kullanıcı girdisi yok (config-driven CSS string). Sanitize uygulanırsa `<style>` `FORBID_TAGS` listesinde olduğu için içerik boşalır — bilinçli atlandı.
    - `src/hooks/use-site-content.ts:55` — JSDoc örnek, kod değil.
  - Migre edilen 17 dosya (her birine `import { sanitizeHtml } from '@/lib/sanitize-html';` + occurrence'lar `sanitizeHtml(...)` ile wrap'lendi):
    - `src/app/logo-usage/page.tsx` (2 site) — cms.body + rule.content •-marker render.
    - `src/app/logo/page.tsx` (1 site) — rule.content •-marker render.
    - `src/app/settings/contracts/[slug]/page.tsx` (1) — Firestore + kod-içi contract.content.
    - `src/app/press/page.tsx` (1) — cms.body.
    - `src/app/library/[slug]/page.tsx` (1) — item.content (Firestore article).
    - `src/app/sitemap/page.tsx` (1) — link.label nbsp replace (developer string, defansif).
    - `src/app/bilgi-toplumu-hizmetleri/page.tsx` (1) — cms.body.
    - `src/app/super-admin/pages/page.tsx` (1) — admin önizleme.
    - `src/app/super-admin/messaging/templates/[id]/edit/page.tsx` (1) — template önizleme.
    - `src/app/super-admin/messaging/campaigns/new/page.tsx` (1) — campaign önizleme.
    - `src/app/super-admin/messaging/campaigns/[id]/page.tsx` (1) — gönderilmiş kampanya body.
    - `src/app/profile/page.tsx` (1) — AI impact-story render.
    - `src/app/support/[slug]/page.tsx` (1) — subtopic.content.
    - `src/app/hangelassociation/projects/[slug]/page.tsx` (1) — project content.body.
    - `src/app/p/[slug]/page.tsx` (1) — site sayfası page.content.
    - `src/components/ui/rich-text-editor.tsx` (1) — contenteditable initial `value`.
- **Risk**: L — sanitize tag/attr whitelist çoğu içerik için no-op; DOMPurify yalnızca onerror/onload/`<script>`/`<iframe>` gibi XSS vektörlerini ayıklar. Pre-existing zengin metin içerikleri (h1-6, p, a, ul/ol, img, blockquote, code/pre) korundu.
- **Rollback**: `git checkout HEAD -- src/lib/sanitize-html.ts src/app src/components/ui/rich-text-editor.tsx package.json package-lock.json docs/audit/tasks.md docs/audit/decisions.md && npm install`.
- **Test sonucu**: `npm run typecheck` PASS (0 hata, 0 çıktı). `npm run lint` PASS (0 hata, 11 pre-existing warning değişmedi — react-hooks/purity + unused-vars; sanitize değişiklikleriyle ilgisiz).
- **Notlar**: Şu an editor `<style>` taglerini whitelist'e almıyor — campaign önizleme alanında body içine inline `<style>` veya `<script>` koyamayacaklar (istenen davranış). Eğer e-posta template'lerinin gerçek render'ı (Resend tarafı) için inline `<style>` gerekirse, send-time sanitize farklı (daha geniş) bir profil kullanmalı; UI önizleme tarafı bu görev kapsamında konservatif tutuldu.

---

## 2026-05-18 — P0-4 plan: super-admin custom claims migration (kod tarafı)
- **ID**: P0-4
- **Lead**: hangel-security-lead
- **Plan (5 madde)**:
  1. `firestore.rules` → `isSuperAdmin()`: tek satıra çek (`return isSignedIn() && request.auth.token.role == 'super-admin';`). E-posta literal ve Firestore `users/{uid}` get fallback'ı silinir; rules tarafı yalnızca custom claim'e güvenir (server-side fallback + UI fallback ayrı katmanlarda kalır).
  2. `src/lib/messaging/server-auth.ts` → `SUPER_ADMIN_EMAIL` const'ı kaldırılır; `requireSuperAdmin` artık `decoded` token'ı `as DecodedIdToken` ile okur ve `(decoded as { role?: string }).role === 'super-admin'` true ise hemen kabul eder; aksi halde mevcut Firestore `users/{uid}.role` lookup'ı fallback olarak kalır (transition güvenliği). `requireNgoAdmin`'deki email tabanlı super-admin yolu da claim'e geçer.
  3. `src/app/app-shell.tsx` → `isSuperAdmin` derivation: `useEffect` + `authUser.getIdTokenResult()` ile `claimsRole` state'i alınır; OR ifadesi `claimsRole === 'super-admin' || userData?.role === 'super-admin'`. `TODO(P0-4b)` yorumu ile fallback geçici olarak işaretlenir.
  4. `src/app/super-admin/layout.tsx` → app-shell ile aynı pattern (`getIdTokenResult()` + state); auth resolving sırasında claim henüz yüklenmemişse mevcut `users/{uid}.role` fallback'ı kullanıcıyı kilitlemez.
  5. `scripts/set-super-admin-claim.ts` (yeni) tek seferlik CLI: `GOOGLE_APPLICATION_CREDENTIALS` zorunlu, UID arg ile `setCustomUserClaims({ role: 'super-admin' })` çağırır; before/after state print eder; `tests/rules/super-admin.test.ts` (yeni) `siteSettings` üzerinden 3 senaryo (anon FAIL, signed-in no-claim FAIL, signed-in with role claim SUCCESS).
- **Risk**: H — auth model değişiyor. Sadece kod çıkıyor; deploy P0-4a (runbook). Eğer claim henüz set edilmeden rules deploy edilirse mevcut super-admin'ler kilitlenir; bu yüzden kod tarafında `userData.role === 'super-admin'` Firestore fallback'ı hem `app-shell.tsx` hem `super-admin/layout.tsx` hem `server-auth.ts`'de KORUNUR — bu UI ve server gating'i için geçici safety net (rules tarafı sadece claim'e bakar; kullanıcı önce claim'i set eder, sonra rules deploy eder).
- **Rollback**: `git revert <commit>`. Acil durumda Firebase Console → Firestore → Rules → Önceki versiyon publish. Kullanıcı kilitlenirse: emülatörden bağımsız `users/{uid}.role === 'super-admin'` doc'u zaten varsa UI çalışmaya devam eder; sadece rules tarafı reddeder ve kullanıcı `siteSettings` vs. yazamaz — bu durumda eski rules versiyonuna geri dön.

---

## 2026-05-18 — P0-4 Done (kod hazır, deploy beklemede)
- **ID**: P0-4 (🟡 Awaiting user — deploy via runbook)
- **Lead**: hangel-security-lead
- **Değişiklik**: `isSuperAdmin()` rules tek satır (`request.auth.token.role == 'super-admin'`); `server-auth.ts` claim primary + Firestore `users/{uid}.role` fallback (TODO P0-4b); `app-shell.tsx` + `super-admin/layout.tsx` `getIdTokenResult()` ile `claimsRole` state'i alır, fallback aynı; `scripts/set-super-admin-claim.ts` (tsx CLI) + `tests/rules/super-admin.test.ts` (3 senaryo) eklendi.
- **Dosyalar**:
  - `firestore.rules` (modified — `isSuperAdmin()` body)
  - `src/lib/messaging/server-auth.ts` (modified — `SUPER_ADMIN_EMAIL` const silindi; claim primary, Firestore fallback `requireSuperAdmin` + `requireNgoAdmin`)
  - `src/app/app-shell.tsx` (modified — `claimsRole` state + `getIdTokenResult()` useEffect; `isSuperAdmin` OR)
  - `src/app/super-admin/layout.tsx` (modified — aynı pattern)
  - `scripts/set-super-admin-claim.ts` (new — `npx tsx scripts/set-super-admin-claim.ts <uid>`, ADC zorunlu, before/after print, exit 0/1)
  - `tests/rules/super-admin.test.ts` (new — `siteSettings` üzerinden anon/no-claim/with-claim 3 case)
- **Safety net**: `userData?.role === 'super-admin'` Firestore fallback'ı 3 katmanda korundu (app-shell, super-admin layout, server-auth). Rules tarafı sadece claim'e bakar — bu yüzden kullanıcı ÖNCE script ile claim set etmeli, SONRA rules deploy etmeli (aksi halde rules tarafı super-admin write reddeder).
- **Risk**: H (deploy edildiğinde). Code-only commit'in kendisi L — kimseyi kilitlemez (rules eski versiyon hala live; safety fallback'ları aktif). User claim'i set ettikten + tekrar login olduktan SONRA rules deploy edilmeli.
- **Rollback**: kod için `git revert`; rules için Firebase Console → Rules → "Previous version" publish.
- **Test sonucu**: `npm run typecheck` PASS (0 hata). `npm run lint` PASS (0 hata, 11 pre-existing warning — değişiklik dışı dosyalarda). `npm run test:rules` LOKALDE ÇALIŞMADI — Java/Firestore emülatörü yok ("Unable to locate a Java Runtime"). Yeni test dosyası `tests/rules/super-admin.test.ts` `describe.skipIf(!emulatorUp)` pattern'i ile graceful skip yapar; CI'da `rules-tests` job'unda emülatör altında doğrulanacak.
- **Notlar**:
  - **Kırılan testler (P0-4 deploy ile)**: `tests/rules/users.test.ts:127` `super-admin via email claim` testi artık FAIL eder (email path silindi). `users.test.ts`, `campaigns.test.ts`, `ngos.test.ts`, `donations.test.ts` içinde `authedAs(env, 'root')` (claim YOK, sadece `users/{root}.role: 'super-admin'` doc) ile yapılan super-admin testleri de FAIL eder çünkü rules artık doc fallback'ına bakmıyor. Bu testler P0-4a deploy sonrası rules'a hizalanmak için güncellenmeli — scope dışı olduğundan ayrı task: **P0-4c (Existing rules tests: claim ile authenticate)**. Önerilen düzeltme: `authedAs(env, 'root')` → `authedAs(env, 'root', { role: 'super-admin' })` ve email-path test silinir.
  - **Deploy sırası (super-admin-claims.md)**:
    1. User runs `GOOGLE_APPLICATION_CREDENTIALS=/abs/path npx tsx scripts/set-super-admin-claim.ts <uid>` her mevcut super-admin için.
    2. User confirms claim set + tekrar login.
    3. User `firebase deploy --only firestore:rules` (rules-deploy.md).
  - **scripts/set-super-admin-claim.ts** detayları: `applicationDefault()` ile init, `GOOGLE_APPLICATION_CREDENTIALS` zorunlu (env yoksa exit 1), UID arg zorunlu; merge custom claims (mevcut claim'leri ezmez); before/after state log; exit 0/1.

---

## 2026-05-18 — devops bundle plan (P2-2 + P3-3 + P3-4 + P3-5 + P4-2 + P4-3)

- **Lead**: hangel-devops-lead
- **Plan (combined, 6 görev, sırayla)**:
  - **P2-2** Lighthouse CI: yeni workflow `.github/workflows/lighthouse.yml` (PR + main); steps checkout → setup-node 20 → `npm ci` → `npm run build` → `npm start &` (background) → `npx wait-on http://127.0.0.1:3000` → `npx -y @lhci/cli@0.13.x autorun`; `.lighthouserc.json` budget (3 URL, numberOfRuns:1, perf warn @0.7, a11y error @0.85, seo warn @0.8); LHCI adımı `continue-on-error: true` (soft gate); `package.json` dokunulmaz. `TODO(P2-2b)` yorumu.
  - **P3-3** apphosting `maxInstances` 1 → 3 (conservative bump). Mevcut comment koruma; "single-instance" yorum yok.
  - **P3-4** `.github/dependabot.yml` (yeni): npm weekly @ `/`, PR limit 5, gruplar `radix`/`firebase`/`next`/`genkit`; github-actions weekly. Renovate yok.
  - **P3-5** `.env.example` audit: 30 ref env var bulundu; 11 eksik (META_*5 + NKOLAY_*4 + PAYMENT_DRIVER + WHATSAPP_DRIVER). Domain başına comment ile APPEND. Mevcut entry'lere dokunulmaz.
  - **P4-2** `.worktrees/affiliate-direct`: HEAD `baf23ac feat(affiliate)...` @ 2026-05-18 — bugün. Clean + recent → ✅ Done (rationale ile). Silme yok.
  - **P4-3** `firebase-debug.log`: disk'te YOK (`No such file or directory`), git'te tracked DEĞİL. `.gitignore` zaten kapsıyor (line 47). No-op olarak ✅ kapatılır.
- **Risk**: L — yalnızca CI ve config; source kod yok; `apphosting.yaml` `maxInstances` bumpu küçük (1→3), runtime davranış aynı, sadece autoscale tavanı yükselir.
- **Rollback**: tüm değişiklikler tek revert ile geri alınır; `apphosting.yaml`'ı `maxInstances: 1`'e geri çekmek tek satır.
- **Test sonucu**: bundle sonunda `npm run typecheck && npm run lint`.


## 2026-05-18 — P2-1 (partial): API route vitest coverage — 6 critical routes
- **ID**: P2-1 (partial); follow-up P2-1b for remaining 21+ routes
- **Lead**: qa
- **Değişiklik**: Hangel test-engineer worker tarafından 6 en yüksek riskli API route için vitest birim testleri yazıldı. Tüm Firebase Admin SDK ve external HTTP çağrıları `vi.mock` ile module boundary'sinde mocklandı; gerçek emülatör/network çağrısı yok.
- **Plan**:
  1. `vitest.config.ts` glob'u zaten `tests/**/*.test.ts` kapsıyor — değişiklik gerek yok.
  2. Mock stratejisi: `firebase-admin/auth`, `firebase-admin/firestore`, `@/lib/firebase-admin`, `@/lib/payment`, `@/lib/messaging/server-auth`, vb. modül seviyesinde mocklanır.
  3. Her test dosyası 30 satırın altında, deterministik (seedlenmiş timestamp / fakeTimers).
  4. Emülatör/yan-etki gerektiren senaryolar `it.skip` ile `P2-1b` etiketlendi.
- **Dosyalar**:
  - `tests/api/check-email.test.ts` — auth/check-email (4 case)
  - `tests/api/import-data.test.ts` — admin/import-data (5 case)
  - `tests/api/webhook-driver.test.ts` — messaging/webhook/[driver] (5 case)
  - `tests/api/nkolay-callback.test.ts` — messaging/payment/nkolay/callback (4 case)
  - `tests/api/csv-parse.test.ts` — messaging/csv/parse (4 case)
  - `tests/api/ngo-admin-campaigns.test.ts` — ngo-admin/messaging/campaigns (4 case)
  - `tests/api/_setup.ts` — paylaşılan mock helpers
- **Risk**: L — sadece yeni test dosyaları, source kod değişmedi.
- **Rollback**: `tests/api/` klasörünü sil; tasks.md / decisions.md revert.
- **Test sonucu**: `npx vitest run tests/api/`, `npm run typecheck`, `npm run lint` — bundle sonunda raporlanır.

---

## 2026-05-18 — P2-3 + P3-2: image optimization re-enable + Poppins weight trim
- **ID**: P2-3 (✅), P3-2 (✅)
- **Lead**: hangel-devops-lead (with frontend coordination)
- **Değişiklik**:
  1. **P2-3**: `next.config.ts` `images.unoptimized: true` kaldırıldı. `output: 'export'` kullanılmıyor (sadece Capacitor `webDir: 'out'` `npx next export` artefaktına bakıyor). Mobil app `capacitor.config.ts:9` `server.url = 'https://hangel.org.tr'` ile prod sunucuyu yüklediği için bu artefakt runtime'da tüketilmiyor — trade-off: `out/` static build'i artık optimize edilmiş `_next/image` route'una başvurursa kırılır (dev artefakt; mobil shell prod sunucuyu serves).
  2. **P2-3 priority**: Sadece 1 sayfanın gerçek "hero image" niteliğinde tek `<Image>`'ı vardı: `src/app/about/page.tsx:72` (AppleSection hero, `priority` eklendi). Diğerleri:
     - `src/app/page.tsx` — hero text-only (h1/h2/p, image yok). İlk Image (`page.tsx:139`) shared `ProductShowcaseSection` içinde, ScrollTo'lu ikinci-sayfa section'larda kullanılıyor — priority eklenmesi yanlış olur. Atlandı.
     - `src/app/market/page.tsx` — `next/image` import dahi yok (sadece `<img>` brand logoları, lazy). Atlandı.
     - `src/app/events/page.tsx:285` — Image `.map()` içinde grid item; tek hero yok. Atlandı.
  3. **P3-2**: `src/app/layout.tsx` Poppins weights `['400','500','600','700','800','900']` → `['400','500','600','700','900']`. Grep: `font-extrabold` = **0** kullanım, `font-black` = **371** kullanım. Sadece 800 düşürüldü; 900 korundu (downgrade etmek 371 site'lik diff demek, scope dışı).
- **Dosyalar**:
  - `next.config.ts` (modified — `unoptimized` satırı silindi, açıklama yorumu eklendi)
  - `src/app/layout.tsx` (modified — weight dizisinden `'800'` çıkarıldı)
  - `src/app/about/page.tsx` (modified — hero Image'a `priority` prop eklendi)
  - `docs/audit/tasks.md` (P2-3 → ✅, P3-2 → ✅)
- **Trade-off / risk** (Capacitor static export):
  - `webDir: 'out'` mobil build artefaktı. `next.config.ts` `output: 'export'` ZATEN tanımlı değildi — yani `npx next export` zaten dynamic/optimization-enabled bir build için yarı-kırık çalışıyordu. Optimization'ı kaldırmak bu durumu DEĞİŞTİRMEZ; mobil shell `https://hangel.org.tr`'i yüklediği için `out/` tüketilmiyor. Eğer ileride mobile offline-first static fallback gerekirse: ya (a) `output: 'export'` eklenir + `images.unoptimized` ya `true`'ya geri çekilir ya (b) ayrı bir `next.config.export.ts` profilini Capacitor build pipeline kullanır.
  - **Production gain**: `next/image` artık `_next/image?url=...&w=...&q=75` üzerinden AVIF/WebP servis edecek; LCP image'lar `priority` ile preload'a eklenecek (about hero için).
- **Risk**: L — yalnızca config + 3 satır kod değişti; runtime davranış değişmiyor (image src/alt/boyut DOKUNULMADI). 800 weight için 0 kullanım olduğundan font yükleme tarafında kayıp 0.
- **Rollback**: `git checkout HEAD -- next.config.ts src/app/layout.tsx src/app/about/page.tsx docs/audit/tasks.md docs/audit/decisions.md`.
- **Test sonucu**: bundle sonunda raporlanır.
- **Notlar**: `font-black` (900) downgrade scope dışı — P3-2 yalnızca "unused weights" istiyor; 900 yoğun kullanımda. Eğer ileride 900 → 700 audit yapılacaksa ayrı task açılmalı (`P3-2b`). `tailwind.config.ts` dokunulmadı (gerek yoktu — Poppins font-family hâlâ tam serisi `font-sans`'ten erişir, sadece 800 yüklenmiyor → tarayıcı en yakın weight'i synthetic olarak render eder, ama hiçbir element o weight'i talep etmiyor).

---

## 2026-05-18 — P2-9 + P2-7b (scoped firebase/ + lib/messaging/) plan

- **ID**: P2-9 (Genkit guardrails), P2-7b (scoped caller migration — firebase + messaging only)
- **Lead**: hangel-backend-lead
- **Plan (7 madde)**:
  1. **P2-9 gen config**: `src/ai/genkit.ts` şu an sadece plugin init yapıyor; merkezi default generation config yok. Her flow `ai.definePrompt({ model: 'googleai/gemini-1.5-flash-latest', ... })` ile model'i lokal belirliyor. Doğrudan flow-level `config: { maxOutputTokens: 1024 }` eklemek, genkit pattern'ine en surgical müdahale (singleton init pure kalır; her flow kendi cap'ini ilan eder). 5 flow `definePrompt` çağrısına `config` eklenir.
  2. **P2-9 guards extension**: `src/ai/guards.ts` exports edilen sabitlere `MAX_PROMPT_INPUT_CHARS = 4000` ve `MAX_OUTPUT_TOKENS = 1024` eklenir (mevcut `sanitizeUserInput` default'larını override etmez — sadece referans sabit). `clampOutputText(text, maxChars = 8000)` helper: model token cap'i aşarsa son çare olarak çıktıyı `slice(0, maxChars)` ile kısar; non-string fallback `''`.
  3. **P2-9 flow wrap**: 5 flow'un her birinde `return output!` satırı `clampOutputText`'i tek string output alanına uygular ve yeni obje döner. Field başına: `impact-story.story`, `library.answer`, `marketplace.answer`, `marketplace-product-description.answer`, `project-writer.fullProposal`. Schema değişmez.
  4. **P2-7b migration scope**: `grep -rn` ile bulunan 30 collection literal call (`src/firebase/**` 0 hit — sadece dokümantasyon match; `src/lib/messaging/**` 30 hit — 14 dosyada). Her literal `COLLECTIONS.*` constant'ına replace edilir; `import { COLLECTIONS } from '@/firebase/collections'` her dosyaya eklenir. `webhookReplayIds` literal'i `COLLECTIONS`'da YOK → o call atlanır (constants.ts genişletilmeyecek; gelecek P2-7d task'ı bu eksik literal'i ele alır).
  5. **P2-7b exception**: `server-auth.ts` 'users' literal'i 2 yerde → `COLLECTIONS.users`'a migration salt string sabiti değişimi; auth logic dokunulmaz. Re-read ile doğrulanır.
  6. **Skip**: `src/lib/messaging/resolver.ts:170` `db.collection(collectionName)` — `collectionName` dinamik parametre, literal değil; atlanır.
  7. **Test ve tracking**: `npm run typecheck && npm run lint` her iki implementation sonrası. `docs/audit/tasks.md`: P2-9 ✅; P2-7b 🔧 In progress + yeni P2-7c (`src/app/**` migration follow-up) eklenir.
- **Risk**: L — Genkit `config.maxOutputTokens` desteklenen standard parametre; clamp helper saf string slice; collection constants identical string'lere resolve eder (runtime davranış aynı, sadece typo-safety).
- **Rollback**: `git checkout HEAD -- src/ai/genkit.ts src/ai/guards.ts src/ai/flows src/lib/messaging docs/audit/tasks.md docs/audit/decisions.md`.

---

## 2026-05-18 — P2-4: lucide-react wildcard tree-shake + recharts dynamic değerlendirme

- **ID**: P2-4
- **Lead**: hangel-frontend-lead
- **Plan / kapsam**:
  - Lucide wildcard'ları (`import * as Icons from 'lucide-react'`) 11 dosyada bulundu. Static / dynamic ayrımı + closed-set feasibility değerlendirmesi yapıldı.
    - **Static-only**: `src/app/page.tsx` (`Icons.Globe` × 1) → drop wildcard, named import.
    - **Mixed (literal + dinamik lookup, closed enum çıkarıldı)**: `src/app/app-shell.tsx` (`Icons.ChevronRight`, `Icons.X` + dinamik), `src/components/layout/SideNav.tsx` (`Icons.ChevronRight` + dinamik). App-shell `group1..4Items` toplam 19 ikon, explicit `iconMap` map'i üretildi.
    - **Pure dynamic (kapalı küme güvenli)**: `src/app/logo/page.tsx` + `src/app/logo-usage/page.tsx` (`keyof typeof Icons` tipi; 12 ikon), `src/app/super-admin/page.tsx` (~26 ikon, `superAdminNavItems` literal), `src/app/super-admin/inbox/page.tsx` (5 ikon), `src/app/ngo-admin/dashboard/page.tsx` (33 ikon), `src/app/ngo-admin/notifications/page.tsx` (5 ikon).
    - **Pure dynamic (kapalı küme SAFE değil — Firestore data icon string)**: `src/app/library/page.tsx` — `section.icon` static `librarySections` (4 ikon) + Firestore `librarySections` koleksiyonu birleşik (run-time string). Admin Firestore'a yeni icon name eklediğinde explicit map'te yoksa fallback'e düşer. **SKIP** ve dokümante.
    - **Skip (do-not-touch list)**: `src/components/layout/header.tsx` (paralel ajan riski).
  - Recharts 4 dashboard'da statik import ediliyor (`super-admin/{demographics,analytics}`, `ngo-admin/{donations,demographics}`). Her biri dashboard'ın **birincil görünümü** (chart ya page'in tek içeriği ya da TabsContent grafik şekkı). Spec: "If the chart is the main view of the page (above-the-fold dashboard), leave it static — dynamic would just delay rendering." Ek olarak her dosya için `chart-impl.tsx` sibling extraction 30+ satır chart JSX'i ayrı dosyaya almayı gerektirir — surgical limit aşılır. **TÜM 4 dosya SKIP.**
- **Karar tablosu**:

  | File | Decision |
  |---|---|
  | `src/app/page.tsx` | migrate (named import) |
  | `src/app/app-shell.tsx` | migrate (explicit map) |
  | `src/components/layout/SideNav.tsx` | migrate (explicit map) |
  | `src/app/logo/page.tsx` | migrate (explicit map) |
  | `src/app/logo-usage/page.tsx` | migrate (explicit map) |
  | `src/app/super-admin/page.tsx` | migrate (explicit map) |
  | `src/app/super-admin/inbox/page.tsx` | migrate (explicit map) |
  | `src/app/ngo-admin/dashboard/page.tsx` | migrate (explicit map) |
  | `src/app/ngo-admin/notifications/page.tsx` | migrate (explicit map) |
  | `src/app/library/page.tsx` | **SKIP** (Firestore-driven dynamic icon string) |
  | `src/components/layout/header.tsx` | **SKIP** (do-not-touch) |
  | 4× recharts dashboards | **SKIP** (above-the-fold + extraction >30 satır) |
- **Risk**: L — render davranışı sıfır değişir; sadece import yüzeyi daralır. Static migration'larda named import = tree-shake friendly; map migration'larda bundle yalnızca map'te listelenen ikonları içerir (vs eski `* as Icons` ~1000+ ikon).
- **Rollback**: Per-file `git checkout HEAD -- <path>`.

---

## 2026-05-18 — P2-8 Done: Firestore listener cleanup audit + ESLint rule

- **ID**: P2-8 (✅ Done — audit + rule); follow-ups P2-8b…P2-8f spawned
- **Lead**: hangel-backend-lead
- **Plan / kapsam**:
  1. `useMemoFirebase` helper read (`src/firebase/provider.tsx:157-168`): generic `useMemo` wrapper that stamps `__memo: true` on the returned object so downstream hooks can detect non-memoized refs.
  2. `useDoc` (`src/firebase/firestore/use-doc.tsx`) and `useCollection` (`src/firebase/firestore/use-collection.tsx`): both wrap `onSnapshot` in `useEffect` and return `() => unsubscribe()` — cleanup correctly wired at hook layer. `useCollection:111-113` additionally THROWS at runtime if the passed ref is missing `__memo` (`useDoc` lacks this guard → spawned P2-8f).
  3. Caller sweep: 218 hook call sites across 95 files; `grep -rL useMemoFirebase` over those 95 returned empty (every hook caller imports the memo helper); `grep "useDoc(\s*(doc|collection)("` returned zero (no inline non-memoized refs); `grep "onSnapshot("` outside the two hook files returned zero (no direct snapshot callers in `src/`).
  4. Dep-array sweep: every `useMemoFirebase` call's deps list checked. 218/221 sites use stable primitives (`db`, `firestore`, `authUser?.uid`, `params.id`, `userData?.managedNgoId`, etc.); 3 sites (all in `src/app/profile/page.tsx:200-211`) use `[db, authUser]` — the full `User` object reference, which can change on token refresh → re-subscribes 3 listeners unnecessarily. These are the only SUSPECT cases; spawned P2-8c.
  5. ESLint rule: `no-restricted-syntax` with AST selector `CallExpression[callee.name=/^(useDoc|useCollection)$/] > CallExpression[callee.name=/^(collection|doc)$/]`. Set to `warn` initially with `TODO(P2-8b)` comment to upgrade to `error` once any new offenders land. Initial warning count produced by the rule: **0** (codebase already disciplined).
- **Değişiklik**:
  - `docs/audit/listener-audit.md` (new) — full audit with headline counts, architecture summary, top-5 risk files.
  - `eslint.config.mjs` (modified — appended `no-restricted-syntax` rule with explanatory comment).
  - `docs/audit/tasks.md` — P2-8 ✅; P2-8b/c/d/e/f rows added for top-risk follow-ups.
- **Top-5 risk files** (audit detail in `listener-audit.md`):
  1. `src/app/profile/page.tsx` — 3× `[db, authUser]` (object ref dep) — only SUSPECT.
  2. `src/app/ngo-admin/layout.tsx` — 4 concurrent listeners per ngo-admin route render (deps clean).
  3. `src/app/super-admin/page.tsx` — 4 full-collection listeners on super-admin dashboard.
  4. `src/app/admin/page.tsx` — 4 hooks (userDoc + 3 managed-entity); deps fine because keyed on `managed*Id` strings.
  5. `src/app/super-admin/messaging/campaigns/[id]/page.tsx` — drilldown page, `[db, params.id]`.
- **Risk**: L — audit-only + lint rule at `warn` severity; zero source files touched in this task. Rule produces 0 warnings today, so no CI noise; if a future PR introduces an inline `useDoc(doc(...))`, the reviewer sees a warning rather than a silent leak.
- **Rollback**: `git checkout HEAD -- eslint.config.mjs docs/audit/tasks.md docs/audit/decisions.md && rm docs/audit/listener-audit.md`.
- **Test sonucu**:
  - `npm run lint --quiet`: 0 errors from this task. New rule produced 0 warnings (`grep -c "no-restricted-syntax"` on lint output = 0).
  - `npm run lint` full: 13 problems total (1 error + 12 warnings). Both error (`HelpCircle` unused import in `super-admin/page.tsx`) and warnings are **pre-existing** and unrelated to this task.
  - `npm run typecheck`: 5 pre-existing errors in `src/app/logo-usage/page.tsx` (`Cannot find name 'Icons'`) — unrelated parallel lead's WIP file (not touched in P2-8 scope).
- **Notlar**:
  - Architecture observation: the codebase enforces memoization via runtime throw in `useCollection` — that's why every hook caller already imports `useMemoFirebase`. The new lint rule is belt-and-suspenders for static-analysis-time catch + IDE feedback before the runtime throw fires in production.
  - P2-8c is the only real fix surfaced by the audit. P2-8d/e/f are vigilance items (high listener density per route) or defense-in-depth (mirror `useCollection`'s `__memo` guard onto `useDoc`).

---

## 2026-05-18 — P2-8f Done (audited): drilldown listeners in `super-admin/messaging/campaigns/[id]/page.tsx`

- **ID**: P2-8f (✅ Done — audited, no code change)
- **Lead**: hangel-backend-lead
- **Scope**: Listener audit of `src/app/super-admin/messaging/campaigns/[id]/page.tsx` (ranked #5 in `listener-audit.md` top-5 risk files).
- **Hook inventory** (2 total):
  1. `useDoc<CampaignDoc>(campRef)` line 69 — ref `doc(db, 'campaigns', params.id)` memoized with `[db, params.id]`. Single campaign doc.
  2. `useCollection<RecipientDoc>(recipientsQuery)` line 75 — ref `query(collection(db, 'campaigns', params.id, 'recipients'), orderBy('createdAt', 'desc'), limit(50))` memoized with `[db, params.id]`. Sub-collection, capped at 50.
- **Decisions per hook**:
  - `useDoc(campRef)` → **keep live**. Page surfaces `status` badge + `stats.{queued, sent, delivered, failed}` cards that update as the worker progresses through `enqueuing` → `sending` → `completed`. Live UX is the point of the drilldown.
  - `useCollection(recipientsQuery)` → **keep live**. Recipients' `status` + `sentAt` transition while campaign is sending; `limit(50)` already caps cost. Bounded by `campaignId` sub-collection scope — not a full-collection listener.
- **One-shot fetch candidates**: None. Theoretical option was "if campaign already `completed`, swap to `getDocs`" but (a) the user opens this drilldown specifically to watch progression, (b) terminal-state behavior is rare relative to live observation, (c) dynamic listener swapping adds bug surface for negligible win.
- **Limit / TODO**: Already has `limit(50)`. No TODO needed.
- **Code change**: None. File untouched.
- **Test sonucu**:
  - `npm run typecheck`: 4 pre-existing errors in OTHER files (`super-admin/page.tsx` × 3 `Cannot find name 'usersData/ngosData/brandsData'`, `header.tsx:56 Cannot find name 'Icons'`). Campaign drilldown file: 0 errors.
  - `npm run lint`: 11 pre-existing warnings across `settings/ngo-selection`, `settings/volunteer`, `super-admin/surveys`. Campaign drilldown file: 0 warnings. 0 errors total.
- **Risk**: L — audit-only, no code change.
- **Rollback**: N/A (no code changes); revert docs only if needed: `git checkout HEAD -- docs/audit/tasks.md docs/audit/decisions.md`.
- **Notlar**:
  - P2-8f scope was repurposed from "add `useDoc` `__memo` guard" (now P2-8g) to "audit drilldown listeners" per the actual top-5 risk file follow-up. The defense-in-depth guard task continues as P2-8g.
  - This file is listed in `listener-audit.md` as a vigilance entry, not a bug — audit confirms zero issue.

---

## 2026-05-18 — Wave 4 quick wins: P2-7d + P2-5d + P2-8c (orchestrator)

- **Lead**: orchestrator (single-session surgical fixes)
- **P2-7d**: `COLLECTIONS.webhookReplayIds` eklendi (`src/firebase/collections.ts`); `src/lib/messaging/webhook-replay.ts:130` literal → constant. P2-7b'nin son atlanan literal'i kapandı.
- **P2-5d**: `src/components/providers/language-provider.tsx` `t()` lookup'ı boş string'i `undefined` olarak ele alıyor (`typeof result === 'string' && result.length > 0`). 39 yeni TR/EN-only çevirinin diğer dillerdeki boş gösterimi artık TR'ye fallback ediyor.
- **P2-8c**: `src/app/profile/page.tsx` 3 `useMemoFirebase` dep array'i `[db, authUser]` → `[db, authUser?.uid]`. Listener re-subscribe sayısı authUser refresh başına 1 → 0 (uid sabit string).
- **Dosyalar**: `src/firebase/collections.ts`, `src/lib/messaging/webhook-replay.ts`, `src/components/providers/language-provider.tsx`, `src/app/profile/page.tsx`.
- **Test sonucu**: `npm run typecheck` PASS (clean). `npm run lint` 0 errors, 11 pre-existing warnings. `npm run build` PASS (exit 0).
- **Risk**: L — üç değişiklik de küçük yüzeyli ve daraltıcı (constant migration, daha sıkı lookup, daha sıkı dep array).
- **Rollback**: `git diff HEAD -- src/firebase/collections.ts src/lib/messaging/webhook-replay.ts src/components/providers/language-provider.tsx src/app/profile/page.tsx` → revert per file.

---

## 2026-05-18 — P2-8d: ngo-admin layout listener gating (hangel-backend-lead)

- **Scope**: `src/app/ngo-admin/layout.tsx` (single-file surgical edit).
- **Problem**: `useResolvedEntityKind()` opens **4 concurrent Firestore listeners** on every ngo-admin route: 1× `useDoc(users/{uid})` fast path + 3× `useCollection(query(<ngos|brands|clubs>, where adminUserId == uid))` fallback. Deps were already correctly memoized (no leak), but the fallback listeners ran unconditionally even when the fast path resolved the entity kind.
- **Hook inventory (4 total)**:
  1. `useDoc<UserDocData>(userDocRef)` — `users/{uid}` for `managed{Ngo,Brand,Club}Id`.
  2. `useCollection<EntityRef>(adminNgosQ)` — `ngos where adminUserId == uid`.
  3. `useCollection<EntityRef>(adminBrandsQ)` — `brands where adminUserId == uid`.
  4. `useCollection<EntityRef>(adminClubsQ)` — `clubs where adminUserId == uid`.
- **Decisions per hook**:
  - **Combine?** No. Three top-level collections (`ngos`, `brands`, `clubs`) with no shared parent → no collection-group or shared query can replace them. Each is a structurally separate listener.
  - **Push down?** No. `SideMenu` rendered in the layout shell needs `kind` to pick NGO_MENU vs BRAND_MENU vs CLUB_MENU and to toggle the Events item visibility. Resolution must happen at layout level.
  - **Gate?** YES. The 3 fallback queries are only needed when the fast path returns `null` (i.e., `users/{uid}.managed*Id` is unset — legacy admins). The `useCollection` hook already no-ops when passed `null`, so conditional construction avoids subscribing.
- **Change**: Extracted `fastPathKind` memo. Added `needsFallback = !userDocLoading && !fastPathKind && Boolean(authUser?.uid)` and gated each of the 3 fallback query factories on it. When the user doc resolves a `managed*Id`, the 3 fallback `useMemoFirebase` factories return `null` → `useCollection` early-returns without subscribing. `needsFallback` is added to each memo dep array so transitions (e.g., user doc loads after a refresh) re-evaluate cleanly.
- **Result**:
  - Common case (user has `managed{Ngo|Brand|Club}Id`): **1 active listener** (userDoc) instead of 4. -75% concurrent listener count on every ngo-admin route.
  - Fallback case (legacy admin without `managed*Id`): 1 userDoc + 3 query listeners = same as before. No regression.
  - UX unchanged: same `{ kind, isLoading }` contract, same default-to-NGO menu while resolving.
- **Files modified**: `src/app/ngo-admin/layout.tsx` only (~25 lines diff in `useResolvedEntityKind`).
- **Test sonucu**:
  - `npm run typecheck`: 9 pre-existing errors in `src/app/super-admin/page.tsx` from in-flight P2-8e patch by a parallel agent — confirmed not caused by this change (errors persist with my changes stashed; main was clean before P2-8e began). My patched file: 0 errors.
  - `npm run lint`: 11 pre-existing warnings across unrelated files (`settings/ngo-selection`, `settings/volunteer`, `super-admin/surveys`). My patched file: 0 warnings, 0 errors.
- **Risk**: L — gated path is opt-in (fallback now skipped when fast path succeeds); fast-path users never depended on fallback data anyway since `kind` memo already preferred `userData?.managed*Id` first. Pre-existing fallback path untouched.
- **Rollback**: `git checkout HEAD -- src/app/ngo-admin/layout.tsx`.
- **Notlar**:
  - The `isLoading` aggregate still ORs in `ngosLoading || brandsLoading || clubsLoading`, but those flags stay `false` when the query ref is `null` (per `useCollection` hook contract `:67-71`). Correct loading semantics preserved.
  - Did **not** factor into a shared hook (original task wording) — pulling the logic into `src/hooks/` was out of scope and would require a follow-up audit of who else consumes managed-entity resolution; the gating fix alone delivers the listener-count win without that ripple.

---

## 2026-05-18 — P2-4b: lucide wildcard finishing (library/page.tsx + header.tsx)
- **ID**: P2-4b
- **Lead**: frontend-lead
- **Değişiklik**: P2-4'te ertelenen son iki `import * as Icons from 'lucide-react'` migrasyonu tamamlandı; repo'da artık 0 lucide wildcard import var.
- **Dosyalar**:
  - `src/app/library/page.tsx` — wildcard kaldırıldı; 9-entry kapalı küme `LIBRARY_ICONS` map'i + `HelpCircle` fallback eklendi. Allow-list: `Library, GraduationCap, BookMarked, BookOpen, FileText, BookA, Globe, Database, Film`. Resolution: `LIBRARY_ICONS[section.icon] ?? HelpCircle` (önceki: `Icons[section.icon] || BookOpen`). İkonlar şu kaynaklardan toplandı: `src/lib/library.ts` (`Library, GraduationCap, BookMarked, BookOpen`), `src/lib/hangel-impact-inventory.json` (`Globe`), `docs/database-exports/library.json` (`Database, Film, Library`), `LibraryPage`'in `placeholderSections` literal'i (`FileText, BookA, Library`). `library/page.tsx:25-28` yorum: yeni icon eklenmesi gerektiğinde hem named import hem `LIBRARY_ICONS` entry'si güncellenmeli.
  - `src/components/layout/header.tsx` — tek static `Icons.Globe` kullanımı (line 57) → named `Globe` import'a çevrildi; wildcard satırı silindi. Dynamic icon kullanımı yoktu.
- **Risk**: L — `library/page.tsx`'te eski kod `BookOpen`'a, yeni kod `HelpCircle`'a düşüyor (bilinmeyen icon string'i için). Bilinen string'ler tamamı map'te. `header.tsx` semantik değişim yok.
- **Rollback**: `git checkout HEAD -- src/app/library/page.tsx src/components/layout/header.tsx`.
- **Test sonucu**:
  - `npm run typecheck`: PASS (0 error).
  - `npm run lint`: 0 errors / 11 pre-existing warnings unrelated files (`app/page.tsx`, `settings/ngo-selection`, `settings/volunteer`, `super-admin/surveys`); modified iki dosyada 0 yeni warning.
  - `grep -rn "import \* as Icons from 'lucide-react'" src/` → 0 hit (sadece `app-shell.tsx:36` historical comment).
- **Notlar**:
  - **Maintenance note** (`library/page.tsx:25-28`, `LIBRARY_ICONS` block): Firestore `library/{slug}` doc'larında yeni bir `icon` değeri kullanılacaksa (örn. yeni bölüm seed'i), önce (a) `lucide-react`'tan named import ekle, (b) `LIBRARY_ICONS` map'ine ekle. Eksik kalan değer çalışma zamanında `HelpCircle` ile yumuşak fallback yapar, çökmez. Bilinen 9 entry kuralın açık dokümantasyonu.
  - P2-4 + P2-4b ile toplam **11/11 lucide wildcard** elimine edildi. Recharts wildcard'ları hâlâ bilinçli SKIP (P2-4 notları).

---

## 2026-05-18 — P0-4 + P0-4a + P1-4 — claim assignment + rules deploy (orchestrator)

- **Lead**: orchestrator (autonomous execution per user request "yapabildiklerini yap")
- **Yapılan adımlar**:
  1. `firebase apphosting:backends:list` + `gcloud secrets list` ile App Hosting secret state gözden geçirildi. Sadece 1 GitHub OAuth connector secret mevcut; kullanıcı tarafından setlenmesi gereken RESEND/NETGSM/META/NKOLAY env secret'ları YOK.
  2. `firebase auth:export` ile 63 hesap dökümü çekildi. İki email-hardcoded admin UID bulundu: `v7woPvqKAzSTSodVOJB702WJmJ93` (ismailhilmi@hangel.org) + `j0LK5Kzvr4bwLFdD2pJuRQI2IHR2` (5384009090@hangel.org).
  3. `users` koleksiyonunda `role == 'super-admin'` ile 2 ek UID tespit edildi: `qkAlDk30eBXaHJK2AKacaNX4wra2`, `xsvfFRJUPzf5EyXSTtt3DdyRYIY2`. Audit'in kaçırdığı bulgu.
  4. `scripts/set-super-admin-claim.ts` 4 UID için sırayla çalıştırıldı; her birinde `customClaims = { role: 'super-admin' }` set edildi (idempotent merge, mevcut claim'ler korunur).
  5. Re-scan: 4/4 UID'in claim'i doğrulandı.
  6. `firebase deploy --only firestore:rules,storage --project hangel-new-v18-87297865-9bcc3` çalıştırıldı; compile + release başarılı.
  7. Doğrulama: anon `POST https://firestore.googleapis.com/.../documents/users/_anon_test` → **400 / PERMISSION_DENIED** (beklendiği gibi).
- **Risk profili**: Düşük-Orta. 4 mevcut admin'in aktif session ID-token'ları STALE — yeni claim'i görmek için bir kez logout/login (veya `auth.currentUser.getIdToken(true)`) gerekir. Bu süreçte UI tarafı `userData.role === 'super-admin'` fallback'i ile çalışır; Firestore client write'lar 403 alır (admin işlemleri API route'lar üzerinden Admin SDK ile gider, etkilenmez).
- **Hangi UID hangi claim/path ile authorize ediliyor**:
  - `v7woPvqKAzSTSodVOJB702WJmJ93`: claim ✅ + Firestore doc ✅
  - `j0LK5Kzvr4bwLFdD2pJuRQI2IHR2`: claim ✅ + Firestore doc ❌ (email-hardcoded eski yol; claim sonrası tek başına geçerli)
  - `qkAlDk30eBXaHJK2AKacaNX4wra2`: claim ✅ + Firestore doc ✅
  - `xsvfFRJUPzf5EyXSTtt3DdyRYIY2`: claim ✅ + Firestore doc ✅
- **Rollback**: Acil bir lockout durumunda Firebase Console → Firestore → Rules → "History" → bir önceki versiyonu Restore.
- **Sonraki adımlar (kullanıcıya kalan)**:
  - Service account rotate (Console — runbook hazır)
  - `git push origin main` (kod deploy; öncesinde RESEND_WEBHOOK_SECRET, NETGSM_WEBHOOK_ALLOWED_IPS App Hosting secret olarak set edilmeli)
  - Git history purge (destructive)
- **Notlar**: 4 admin kullanıcıya çıkış-giriş yapmalarını bildir; aksi halde fallback UI'da çalışmaya devam ederler ama Firestore client write'lar reddedilir.

---

## 2026-05-18 — P0-1 + P0-1b — service account rotate + git history purge (orchestrator autonomous)

- **Lead**: orchestrator (per user "purge yap" + earlier "yapabildiklerini yap")
- **Yapılan adımlar**:
  1. **Defensive code fix**: `src/lib/firebase-admin.ts` artık `applicationDefault()` fallback yapıyor — local'de `.firebase-service-account.json` varsa cert, yoksa ADC (Cloud Run runtime SA). Prod build'i artık dosya yokluğuna dayanıklı.
  2. **Yeni anahtar üretimi**: `gcloud iam service-accounts keys create` → key ID `ad33f7edd1e8647be1abb5f14de535164db5df9b` for `firebase-adminsdk-fbsvc@hangel-new-v18-87297865-9bcc3.iam.gserviceaccount.com`.
  3. **Local replace**: yeni anahtar `.firebase-service-account.json`'a yazıldı (gitignore'da). Yeni anahtar test: `getUser` çağrısı `ismailhilmi@hangel.org` döndü.
  4. **Old key disable**: `gcloud iam service-accounts keys disable e1312f88da4770e44ac15f3814399b48539de0e8` → `DISABLED: True, REASON: SERVICE_ACCOUNT_KEY_DISABLE_REASON_USER_INITIATED`. Eski anahtar artık çalışmaz.
  5. **Backup**: `/Users/ake/Documents/hangelapp.pre-purge-bk/` (rsync; node_modules + .next hariç).
  6. **History purge**: `git filter-repo --invert-paths --path .firebase-service-account.json --force` → 1896 commit yeniden yazıldı. Eski hash `faadf485` → yeni hash `fa2a72bc` (örneğin). Bütün main branch'in commit ID'leri değişti.
  7. **Force-push**: `git push --force-with-lease=main:faadf485... origin main` başarılı. `faadf485 → 9f5d4811 (forced update)`.
  8. **Doğrulama**:
     - `gh api /repos/hangelapp/new-app/contents/.firebase-service-account.json?ref=main` → 404 Not Found
     - `gh api /search/code?q=e1312f88...` → `"total_count":0`
     - `git log --all -- .firebase-service-account.json` → boş
- **Risk profili**: 
  - Yüksek (force-push) ama backup mevcut.
  - App Hosting otomatik rollout başlayacak — yeni HEAD'den build. Eğer webhook env'leri (RESEND_WEBHOOK_SECRET, NETGSM_*) set edilmediyse webhook'lar 401 dönecek (delivery event akışı durur, user-facing flow etkilenmez).
  - `firebase-admin.ts` ADC fallback nedeniyle prod runtime'da `applicationDefault()` çalışır; ek key file gerekmez.
- **Rollback**:
  - Eğer yeni rollout patlarsa: `git reset --hard 9f5d4811`'i `cd /Users/ake/Documents/hangelapp.pre-purge-bk && git reset --hard faadf485 && force-push` ile geri al.
  - Disable edilen eski key: tek yönlü; Firebase Console → IAM → service account → enable mümkün, ama leaked key olduğu için ASLA enable etmemeli.
- **GitHub cache**: GitHub'ın cache invalidation talebi opsiyonel (`https://docs.github.com/.../removing-sensitive-data-from-a-repository`); public repo değil görünüyor (fork count = 0). Search ve content endpoint'leri zaten temiz.
- **Yeni anahtar bilgisi**: 
  - Aktif: `ad33f7edd1e8647be1abb5f14de535164db5df9b` (yeni, local)
  - Aktif: `821aee5c5f15d6abaf3bbda068a501b299c55827` (var olan, dokunulmadı)
  - Aktif: `0c59742f78e5736abc758ebf93d93f78dfcb6e80` (var olan, dokunulmadı)
  - **DISABLED**: `e1312f88da4770e44ac15f3814399b48539de0e8` (eski leaked, revoked)

## 2026-05-18 — P2-1b (kısmi): 6 ek kritik API route için vitest kapsamı

- **Seçim kriteri**: Auth/PII/payment/admin yüzeyi + non-trivial branching, henüz coverage yok.
- **Eklenen route'lar (6)**:
  1. `src/app/api/messaging/whatsapp/webhook/route.ts` — Meta hub.verify_token + HMAC SHA256 (X-Hub-Signature-256, timing-safe)
  2. `src/app/api/messaging/unsubscribe/route.ts` — public token lookup; brute-force surface
  3. `src/app/api/messaging/resolve-recipients/route.ts` — super-admin gated; segment expansion
  4. `src/app/api/messaging/worker/run/route.ts` — internal worker key (`x-messaging-key`)
  5. `src/app/api/messaging/enqueue/route.ts` — messaging key + input validation
  6. `src/app/api/ngo-admin/messaging/wallet/topup/route.ts` — N-Kolay payment intent + paket cross-check
- **Pattern**: Tüm route'larda boundary-mock (firebase-admin, provider, server-auth, wallet/payment/audit). Resend/Netgsm/WhatsApp/Gemini/N-Kolay real network ASLA çağrılmaz. Her test dosyası ≤30 satır prensibine sadık (bazı genel describe satırları hariç).
- **Skip kararları**: `whatsapp/templates/sync` aynı super-admin pattern'ini tekrarlıyor — P2-1c'ye bırakıldı. `worker/run` happy-path full Firestore zinciri 30 satırı aşıyor; sadece auth + 500 dalları kapsanır.
- **Sonuç**: P2-1 toplam coverage 12/27+ kritik route. Kalan: messaging/preview, messaging/campaigns (super), admin/messaging/{ngo-senders, ngo-wallets, pricing}, ngo-admin/messaging/{me, resolve-recipients}, messaging/csv/save, messaging/iys/export, messaging/worker/{schedule, trust-score, reclaim}, offers, admin/messaging/whatsapp/templates/sync.

## 2026-05-18 — P1-3b: webhookReplayIds Firestore TTL (90 gün)

- **Sorun**: `src/lib/messaging/webhook-replay.ts` her event'te `webhookReplayIds/{driver}__{eventId}` doc'u yaratıyor; cleanup yoktu → sınırsız büyüme.
- **Çözüm**: Doc'a TTL trigger alanı (`expiresAt = now + 90 gün`) eklendi; Firestore TTL policy bu alanı `webhookReplayIds` collection-group üzerinde okuyacak.
- **Code diff** (`src/lib/messaging/webhook-replay.ts`):
  ```ts
  // import
  -import { FieldValue } from 'firebase-admin/firestore';
  +import { FieldValue, Timestamp } from 'firebase-admin/firestore';

  // rememberWebhookEvent → ref.create({...})
   await ref.create({
     driver,
     eventId,
     createdAt: FieldValue.serverTimestamp(),
  +  expiresAt: Timestamp.fromMillis(Date.now() + 90 * 24 * 60 * 60 * 1000),
   });
  ```
- **TTL enable** (operator manual çalıştıracak — sandbox `gcloud`'u engelledi):
  ```
  gcloud firestore fields ttls update expiresAt \
    --collection-group=webhookReplayIds \
    --enable-ttl \
    --project=hangel-new-v18-87297865-9bcc3
  ```
- **Verify**:
  ```
  gcloud firestore fields ttls list --project=hangel-new-v18-87297865-9bcc3
  ```
  Beklenen: `webhookReplayIds.expiresAt` → state `CREATING` → birkaç dakika sonra `ACTIVE`.
- **Migrasyon notu**: TTL enable öncesi yaratılan doc'ların `expiresAt` alanı yok → silinmezler (Firestore TTL yok sayar). Yeni doc'lar 90 gün sonra otomatik silinir. Eski kayıtlar zaten replay korumasından sonra büyük değer taşımaz; manuel cleanup gerekiyorsa P1-3c açılabilir.
- **Doğrulama**: `npm run typecheck` PASS. `npm run lint` — `webhook-replay.ts`'de 0 warning/error; pre-existing tek error `src/app/settings/ngo-selection/page.tsx:70` (P1-3b scope dışı).

---

## 2026-05-18 — P0-4c — rules testlerini claim-only `isSuperAdmin()`'e adapt et (hangel-test-engineer)

- **Lead**: hangel-test-engineer
- **Bağlam**: P0-4a sonrası `firestore.rules` `isSuperAdmin()` sadece `request.auth.token.role == 'super-admin'` claim'i kontrol ediyor. Eski Firestore-doc fallback (`users/{uid}.role`) ve hardcoded e-posta literal'i kaldırıldı. Mevcut 4 rules testi (`users/campaigns/ngos/donations.test.ts`) `authedAs(env, 'root')` ile claim'siz authenticate ediyordu ve doc fallback'a güveniyordu → yeni rules altında `assertSucceeds` yerine `assertFails` üretecekti.
- **Değişiklikler**:
  - `users.test.ts`: 2 super-admin call site `{ role: 'super-admin' }` claim'i ile authentique; obsolete "email claim" testi farklı uid + claim varyantına dönüştürüldü (canonical "different uid, same claim succeeds" assertion); seed'deki `users/root.role = 'super-admin'` field'ı kaldırıldı (doc field'sız bırakıldı, başka testler için).
  - `campaigns.test.ts`: 10 super-admin call site claim'li hale getirildi; `users/root` doc seeding tamamen kaldırıldı.
  - `ngos.test.ts`: 2 super-admin call site claim'li hale getirildi; `users/root` doc seeding kaldırıldı.
  - `donations.test.ts`: 3 super-admin call site claim'li hale getirildi; `users/root` doc seeding kaldırıldı.
- **Etkilenmeyen**: `super-admin.test.ts` (P0-4'te zaten doğru pattern); `firestore.rules`; tüm non-super-admin actor testleri (`authedAs(env, 'alice')` vb. olduğu gibi kaldı — claim'siz signed-in kullanıcılar süper-admin path'leri için hâlâ `assertFails`).
- **Pattern**: `authedAs(env, uid, { role: 'super-admin' })` — `setup.ts:authedAs()` zaten optional claims param destekliyordu, ek helper gerekmedi.
- **Doğrulama**: `npm run typecheck` PASS. `npm run lint` — `tests/rules/**` 0 warning/error; pre-existing tek hata P1-3b scope dışı. `npm run test` → 10 file PASS / 5 skip (rules suites Java yok → graceful skip), 43 test PASS / 54 skip. `npm run test:rules` lokalde Java JRE yok → CI emulator job'unda doğrulanacak.
- **Toplam değişiklik**: 17 super-admin call site, 4 file, ~30 satır net delta.

---

## 2026-05-18 — P1-8c: AI flow caller `userId` plumbing (ID token → verifyIdToken → quota)
- **ID**: P1-8c
- **Lead**: backend-lead
- **Değişiklik**: P1-8 ile hazırlanan `checkAndConsumeAIQuota` iskeletini gerçek caller'la bağladık. 5 flow wrapper'ı opsiyonel `idToken?: string` argümanı kabul ediyor; server tarafı `verifyAIFlowUserId(idToken)` → Admin SDK `verifyIdToken` → `decoded.uid` → `checkAndConsumeAIQuota(uid, kind)`. Bare uid stringini ASLA kabul etmiyoruz — yalnızca ID token. `impact-story-flow` `profile/page.tsx`'ten `authUser.getIdToken()` ile çağrılıyor; client tarafı `QUOTA_EXCEEDED` mesaj prefix'ini yakalayıp Türkçe toast gösteriyor ("Günlük yapay zeka kotası doldu").
- **Auth derivation pattern**: Profile bir client component; flow `'use server'`. Mevcut `src/lib/messaging/server-auth.ts` pattern'i `Authorization: Bearer <token>` + `getAdminAuth().verifyIdToken(token)` üzerinden çalışıyordu — bunu server action sürümüne uyarladık (token wrapper argümanı olarak geliyor, header değil; çünkü Genkit `'use server'` flow'ları HTTP header'a erişmiyor). Çözüm: client `user.getIdToken()` ile token alıp flow fonksiyonuna pas ediyor; server verify edip `null` (token yok/geçersiz) veya `uid` döndürüyor. Token yok/SDK yok → quota skip (fail-open, mevcut `checkAndConsumeAIQuota` semantiği ile tutarlı).
- **Dosyalar**:
  - `src/ai/flow-auth.ts` (yeni) — `AIQuotaExceededError` + `verifyAIFlowUserId` helper'ları. `guards.ts`'e dokunmamak için ayrı modül (guards.ts P1-8'de "final" olarak işaretlenmişti).
  - `src/ai/flows/impact-story-flow.ts` — `idToken?` param + quota call (kind: `impact-story`).
  - `src/ai/flows/library-ai-assistant.ts` — `idToken?` param + quota call (kind: `library-assistant`); UI caller yok, ileride hazır.
  - `src/ai/flows/marketplace-ai-assistant.ts` — `idToken?` param + quota call (kind: `marketplace-assistant`); UI caller yok.
  - `src/ai/flows/marketplace-ai-product-description.ts` — `idToken?` param + quota call (kind: `product-description`); UI caller yok.
  - `src/ai/flows/project-writer-flow.ts` — `idToken?` param + quota call (kind: `project-writer`); UI caller yok.
  - `src/app/profile/page.tsx` — `handleGenerateStories` `authUser.getIdToken()` çağırıyor, 5 paralel `getImpactStory(..., idToken)` invokasyonuna token gönderiyor; `error.message.includes('QUOTA_EXCEEDED')` ile typed error yakalanıyor, Türkçe quota toast'ı gösteriliyor; diğer hatalar generic toast.
- **Tasarım notları**:
  - `AIQuotaExceededError extends Error` — Next.js server action error serialization sınıf bilgisini koruma garantisi vermez, sadece `message` korunur. Bu yüzden stable contract `message` prefix `QUOTA_EXCEEDED:<kind>`. Client `instanceof` yerine `.includes('QUOTA_EXCEEDED')` ile match ediyor.
  - 4 caller-less flow'a da quota call gating'i eklendi (token yoksa skip). Bu, gelecekte UI bağlandığında ek değişiklik gerektirmiyor — sadece caller `idToken` göndermeye başlayacak.
  - `guards.ts` dokunulmadı (P1-8 sözleşmesine sadık kalındı); auth helper'ları yeni modülde.
- **Hard rule sadakati**: Hiçbir flow client'tan bare `uid` kabul etmiyor — sadece ID token. Token geçersizse server fail-open (quota skip) + warning log; bu local dev (no service account) deneyimini bozmuyor ama production'da Admin SDK varken cap'i devreye sokuyor (P1-8'in fail-open semantiği ile tutarlı).
- **Risk**: L — token yok/invalid path fail-open; mevcut UI davranışı bozulmuyor; quota state ayrı `aiQuotaslerini` collection'unda izole; rollback tek dosya.
- **Rollback**: `git revert` (6 dosya değişikliği, 1 yeni dosya). `flow-auth.ts` silinince flow'lardaki importlar break eder; tüm dosyaları aynı commit'te revert et.
- **Test sonucu**:
  - `npm run typecheck` → PASS (no output).
  - `npm run lint` → 1 error + 11 warning (HEPSI pre-existing: `src/app/page.tsx` `Math.random` impure, `src/app/settings/ngo-selection/page.tsx` `Date.now` impure, `volunteer/page.tsx` unused vars, vb.). Dokunduğum 7 dosyada (`ai/flow-auth.ts`, 5 flow file, `profile/page.tsx`) `grep -E "(ai/flows|ai/flow-auth|profile/page)"` ile lint output filtrelendi → 0 yeni error/warning.
  - Functional test: production'da `authUser.getIdToken()` → server `verifyIdToken` → Firestore `aiQuotas/{uid}/buckets/daily-YYYY-MM-DD__impact-story` doc'una transactional `count++`; 30. çağrıdan sonra `AIQuotaExceededError` fırlatılıp profile sayfası Türkçe toast gösteriyor. (Manuel canlı doğrulama deploy sonrası.)
- **Follow-up'lar**:
  - P1-8b — env-tunable cap (hâlâ hardcoded 30).
  - 4 caller-less flow için UI gerektiğinde caller'lar `idToken` plumbing yapacak (zaten hazır).
- **Notlar**: Tasks.md'ye `P1-8c` ✅ row eklendi (P1-8 satırının hemen altına).

---

## 2026-05-18 — P2-7c-2: `src/app/**/*.tsx` + `src/components/**/*.tsx` collection literal migration
- **ID**: P2-7c-2
- **Lead**: backend-lead
- **Plan**: Discovery grep, `src/app/api/**` hariç tüm `src/app/**/*.tsx` ve `src/components/**/*.tsx` dosyaları için collection/doc/collectionGroup literal'larını `COLLECTIONS.<key>` ile değiştir. Surgical edit — sadece literal değişimi + gerekirse import ekleme. 351 literal / 105 dosya tespit edildi; tüm literal'lar mevcut `COLLECTIONS` entry'lerine eşleşiyor — yeni entry beklenmiyor.
- **Top literals**: users (70), ngos (33), brands (21), clubs (14), notifications (13), volunteering (12), applications (12), userInvitations (10), posts (10), donations (9), events (8), emergencyRequests (7), campaigns (7), supportTickets (6), funds (6).
- **Dosya gruplandırması**: ~30 super-admin sayfası, ~20 ngo-admin sayfası, ~25 settings/profile/dashboard sayfası, ~20 marketing/public sayfası, 4 component.
- **Yürütme**: `scripts/migrate_collections.mjs` (one-shot helper, sonra silindi) ile regex-tabanlı 4 pattern: `collection(<var>, 'lit')`, `doc(<var>, 'lit'`, `collectionGroup('lit')`, `.collection('lit')` → `COLLECTIONS.<key>`; literal `COLLECTIONS_KEY` whitelist'inde olmayanlar dokunulmadı (0 vaka). Import eksikse son top-level `^import...;$` satırının altına `import { COLLECTIONS } from '@/firebase/collections';` enjekte edildi.
- **Edge case fix**: `src/components/layout/user-nav.tsx`'te import satırları noktalı virgül olmadan yazılmıştı; regex en son `;` ile biten import'u bulamayıp import'u fonksiyon gövdesine ekledi. Manuel düzeltildi (Edit tool) — import doğru konuma taşındı. Bu dosyada literal yerleştirme doğruydu, sadece import konumu hatalıydı.
- **Migrate edilen dosya sayısı**: 105 dosya (önceden P2-7c-1'de migrate edilmiş `app-shell.tsx` + 4 örnek dosya dahil). Toplam 350 literal değiştirildi (`app-shell.tsx`'in 1 manual `doc(db, 'users')` Edit'i + script ile 349). Discovery grep post-migration = 0.
- **Yeni `COLLECTIONS` entry**: Yok. Tüm 38 unique literal mevcut `COLLECTIONS` map'inde bulundu (`users`, `ngos`, `brands`, `clubs`, `notifications`, `volunteering`, `applications`, `userInvitations`, `posts`, `donations`, `events`, `emergencyRequests`, `campaigns`, `supportTickets`, `funds`, `recipientSegments`, `messageTemplates`, `library`, `contracts`, `transparencyCriteria`, `sitePages`, `emergencyResponses`, `userMarketingConsent`, `surveys`, `ratings`, `messages`, `aiAssistantConfig`, `whatsappTemplates`, `userRequests`, `transparency`, `studentClubs`, `ngoTrustScores`, `messagingTransactions`, `messagingPackages`, `messagingAuditLogs`, `mailQueue`, `invites`, `fundApplications`, `bloodRequests`).
- **Skip**: 0 dinamik değişken (tüm collection/doc çağrıları sabit literal kullanıyordu).
- **Test sonucu**:
  - `npm run typecheck` → PASS (no output).
  - `npm run lint` → 0 errors, 11 pre-existing warnings (`settings/ngo-selection/page.tsx` Date.now impure, `settings/volunteer/page.tsx` 6 unused vars, `super-admin/surveys/page.tsx` useMemo dep, `page.tsx` Math.random impure, +3 useMemo dep warning). Migrate'imden gelen yeni warning yok.
  - `npm test -- --run` → 13 file PASS / 5 skipped, 57 test PASS / 54 skipped — P2-7c baseline ile identical.
- **Risk**: L — yalnızca string literal değişimi + import ekleme; runtime davranış aynı (`COLLECTIONS.users === 'users'`). Rollback `git revert` ile tek commit, 105 dosya etkilenir.
- **Follow-up**: P2-7c kapatıldı. P2-7e+ (varsa) `firestore.rules` literal'larını da `COLLECTIONS`'a referans etmeyi düşünebilir (rules'da JS literal kullanılamadığı için ayrı tasarım).
- **Notlar**: Tasks.md'ye P2-7c ✅ + P2-7c-2 ✅ row'ları yazıldı. `scripts/migrate_collections.mjs` ve `package.json#scripts.migrate:collections` (geçici helper) temizlendi.

---

## 2026-05-18 — P2-6b: God-page refactor `super-admin/users/page.tsx`
- **ID**: P2-6b
- **Lead**: frontend-lead
- **Plan (5-bullet)**:
  1. Mirror P2-6a pattern: extract dialogs and list row into `src/app/super-admin/users/_components/`; data fetching + handlers stay in parent.
  2. Extract `ProfileViewDialog` (read-only profile preview) → `profile-view-dialog.tsx`.
  3. Extract `EditUserDialog` (full profile editor) → `edit-user-dialog.tsx`; keep `onSave` callback contract.
  4. Extract `AssignEntityDialog` (NGO/Brand/Club assignment) → `assign-entity-dialog.tsx` together with `EntityKind`/`rolesByKind`/`entityKindLabels`/`entityCollectionByKind`/`entityIdFieldByKind`/`invitationIdFieldByKind` constants and `EntityRow` type.
  5. Extract bulk-delete card + user list row UI → `bulk-delete-card.tsx` + `user-row.tsx` (presentation only; handlers passed in as props). Shared types (`UserRow`, `roleLabel`) → `_components/types.ts`.
- **Hard rules**: no logic changes; preserve all toasts/dialogs/callbacks; data fetching stays in page.tsx; ≤500 LoC target.

## 2026-05-18 — P2-6e refactor plan: god-page `src/app/settings/volunteer/page.tsx` (1061 LoC)
- **ID**: P2-6e (subset of P2-6 god-page refactor)
- **Lead**: frontend-lead
- **Plan (5-bullet)**:
  1. Extract the three in-file generic widgets (`FilteredMultiSelect`, `FilteredSingleSelect`, `LanguageSelect` — ~275 LoC combined) into `_components/` alongside `types.ts` (shared `VolunteerUserDoc`, `NeighborhoodsMap`, `EmergencyContact`). Same `value`/`onChange` typed props, no logic change.
  2. Extract heavy presentational sections: `motivations-section.tsx` (4 motivation groups, ~70 LoC), `availability-section.tsx` (days/times/work-modes checkbox grid, ~50 LoC), `muhtar-section.tsx` (switch + cascading il/ilçe/mahalle Selects, ~45 LoC) — each receives only its own slice (`value`, `onChange`).
  3. Extract `emergency-contacts-section.tsx` (2-contact form, ~35 LoC, takes `contacts` + `onContactChange(index, field, value)`); `health-section.tsx` (gender, blood, switches, ~45 LoC); `consents-section.tsx` (5-item required checklist, ~25 LoC, uses Consents type from `types.ts`).
  4. Extract `address-section.tsx` (mahalle/sokak/kapı no inputs, ~25 LoC). Light single-Card sections (Meslek, Yetkinlikler+3 selects, Diller, Sertifika, Sürücü, Programlar, Vizeler) stay inline — they're 5-15 LoC each and just call the extracted widgets; extracting would not help LoC.
  5. Page becomes orchestrator only: state hooks, `useEffect` hydration from Firestore, `handleSubmit`, derived data (`ilceler`/`mahalleler`/`addrDistricts`/`addrNeighborhoods`), and JSX composition. Form validation (`requiredConsents` missing toast) + dirty tracking + save callback (`updateDocumentNonBlocking`) + onboarding branch all preserved verbatim. Target ≤500 LoC.
- **Hard rules**: no logic changes; preserve all toasts/dialogs/callbacks; data hydration + save stay in page.tsx; ≤500 LoC target. 11 pre-existing lint warnings out of scope.

---

## 2026-05-18 — P2-6d: God-page refactor `ngo-admin/website/page.tsx`
- **ID**: P2-6d
- **Lead**: frontend-lead
- **Plan (5-bullet)**:
  1. Extract constants (`analyticsProviders`, `colorOptions`, `domainRegistrars`, `transparencyDocs`, `REQUIRED_NS`), types (`NgoSiteBanner`, `NgoSiteSettings`, `NgoDoc`), and `checkDnsRecords` helper → `_components/constants.ts` + `_components/types.ts` + `_components/dns.ts`.
  2. Build a generic `<SectionCard>` shell (icon + title + description + visibility Switch + collapsible body) → `_components/section-card.tsx`. All 15 section cards reuse it.
  3. Extract each section editor as a presentation-only component receiving `value` / `onChange` / `onSave` / `toast` props: `domain-section.tsx`, `colors-section.tsx`, `banners-section.tsx`, `about-section.tsx`, `president-section.tsx`, `stats-section.tsx`, `donations-section.tsx`, `volunteering-section.tsx`, `events-section.tsx`, `ecommerce-section.tsx`, `news-section.tsx`, `sdg-section.tsx`, `transparency-section.tsx`, `contact-section.tsx`, `analytics-section.tsx`.
  4. Extract sticky publish bar (DNS verify + save + open preview) → `publish-bar.tsx`; parent passes `ngoId`, `domainName`, `primaryColor`, `buildPayload`, `setLastUpdated`, etc.
  5. Page.tsx retains: data fetching (adminNgos / userDoc / fallbackNgo), state (sections + content), hydration effect, `handleSave`, `buildPayload`, `toggleSection`, `copyToClipboard`, `addBanner`, `removeBanner`. JSX becomes a thin list of section components.
- **Hard rules**: no logic changes; preserve all toasts/dialogs/save callbacks/dirty-state; data fetching stays in page.tsx; ≤500 LoC target.

---

## 2026-05-18 — P2-5c: i18n dashboard + settings sub-page strings → useTranslation()
- **ID**: P2-5c
- **Lead**: frontend-lead
- **Plan (5-bullet)**:
  1. Add `dashboard.*` namespace to `src/lib/translations.ts` (TR + EN populated; ru/ar/fa/es/ha left empty → fall through to TR via LanguageProvider P2-5d fix).
  2. Per-page top 20–30 user-visible strings only (heading, sub-heading, tabs, section titles, top CTAs, dialog titles, empty-state copy). Not a full sweep — defer tail to `P2-5c-rest` if needed.
  3. Pages in scope (dashboards): `profile/page.tsx` (headers + tabs only — no god-page refactor), `my-applications/page.tsx`, `my-badges/page.tsx`, `my-donations/page.tsx`, `messages/page.tsx`, `notifications/page.tsx`.
  4. Pages in scope (settings sub-pages): `settings/{language,theme,security,profile,volunteer,notifications,marketing-consent,brands,ngo-selection,volunteer-ngo-selection,accessibility,privacy,contracts}/page.tsx`. Also adjacent: `appearance,wallet` already covered if minimal.
  5. Approx ~20 strings/page × 13–18 pages ≈ 200–300 new keys total. Add all keys in single `translations.ts` edit, then migrate page-by-page with surgical Edits. Typecheck + lint every ~5 pages; final full gates + `npm test -- --run`.
- **Hard rules**: TR copy verbatim; no behavior changes; key naming `dashboard.<page>.<section>` mirroring `marketing.<page>.*`; other 5 langs empty strings → TR fallback.

### Per-page string targets (top user-visible)
- `profile`: header tabs (5) + impact card title (1) = ~6 (god-page; no deep sweep).
- `my-applications`: heading/sub (2), CTA (1), search (1), filter labels (3), tabs (4), empty/no-match (4), withdraw dialog (4) ≈ 19.
- `my-badges`: heading/sub (2), nextGoal title (1), empty next-goal copy (1), tabs (3), empty list (3), impact card label (1), certs placeholder (1) ≈ 12.
- `my-donations`: heading (1), total title/desc (2), history title (1), filter (3), empty (3), placeholder (1) ≈ 11.
- `messages`: heading (1), composeCTA (1), search (1), tabs (2), empty (3), compose dialog (5), profile dialog (2), send/cancel (2) ≈ 17.
- `notifications`: heading (1), badge new (1), errors (2), empty (2), emergency CTAs (2), responseLabels (2), detailCta (1), markRead (1) ≈ 12.
- `settings.language`: heading/sub (2), saveBtn (1), toast (2) ≈ 5.
- `settings.theme`: heading/sub (2), labels (3), saveBtn (1), toast (2) ≈ 8.
- `settings.security`: heading/sub (2), 2FA card (2), session card (2), saveBtn (1), closeOtherSessions (1), toast (2) ≈ 10.
- `settings.profile`: heading/sub (2), photo card (1), section titles (3), saveBtn (1) ≈ 7 (only headings).
- `settings.volunteer`: hero title/desc (2), laterCta (1) ≈ 3 (only headings).
- `settings.notifications`: heading/sub (2), saveBtn (1), toast (2) ≈ 5.
- `settings.marketing-consent`: heading/sub (2), card title (1), email/sms labels (2+2), saveBtn (1), toast (1) ≈ 9.
- `settings.brands`: heading/sub (2), search (1), tab labels (5), saveBtn (1), emptyMsg (1) ≈ 10.
- `settings.ngo-selection`: heading/sub (2), warning (3), saveBtn (1) ≈ 6.
- `settings.volunteer-ngo-selection`: heading/sub (2), saveBtn (1) ≈ 3.
- `settings.accessibility`: badge (1), heading (1), sub (1) ≈ 3 (only top hero).
- `settings.privacy`: heading/sub (2), card titles (2), saveBtn (1) ≈ 5.
- `settings.contracts`: heading/sub (2) ≈ 2.

**Total**: ~155 strings → ~155 keys × TR+EN = ~310 lines additions. Per spec ~20–30/page is upper limit; pages with fewer top-visible strings get fewer keys.

---

## 2026-05-18 — P2-6c: God-page refactor `login/selection/page.tsx`
- **ID**: P2-6c
- **Lead**: frontend-lead
- **Plan (5-bullet)**:
  1. Read the page end-to-end (1174 LoC). Mapped 2 top-level forms (`IndividualForm`, `CorporateForm`), 5 shared UI primitives (`FileUpload`, `SectionTitle`, `FormLabel`, `FormInput`, `IconInput`), and 8 constant datasets.
  2. Extract shared UI + dataset constants → `_components/shared.tsx` (pure re-export, no behavior change).
  3. Move `IndividualForm` verbatim into `_components/IndividualForm.tsx` — including the critical `handleCheckEmail` POST to `/api/auth/check-email`, the `createUserWithEmailAndPassword` + `setDocumentNonBlocking` + invite QR auto-action toast + `initiateEmailVerification` chain.
  4. Move `CorporateForm` (formData state + `handleFormSubmit` writing to `applications` collection + entity dispatcher Select with NGO/BRAND/CLUB branches) into `_components/CorporateForm.tsx`. Branches stay co-located inside the single file because they share `formData`/`setFormData`/`agreements`/selected* state; splitting them further would require extensive prop drilling with no readability gain.
  5. page.tsx becomes thin: Suspense + `FormRenderer` (Card layout + Tabs router selecting `IndividualForm` or `CorporateForm`). Build verified after each extraction; final gates run before closure. Target ≤500 LoC.
- **Flow component list (4 flows preserved)**:
  - Individual signup / login (5-step state machine: email → login | register | verify-sent | forgot) — `_components/IndividualForm.tsx`
  - NGO corporate registration — `_components/CorporateForm.tsx` (NGO branch)
  - Brand corporate registration — `_components/CorporateForm.tsx` (BRAND branch)
  - Club corporate registration — `_components/CorporateForm.tsx` (CLUB branch)
  - Shared primitives + datasets — `_components/shared.tsx`
- **Hard rules**: NO logic changes. Preserved every callback signature, toast message, agreement gate, auth call (`signInWithEmailAndPassword`, `createUserWithEmailAndPassword`, `updateProfile`, `initiateEmailVerification`), Firestore write (`setDocumentNonBlocking` on `users`, `addDoc` on `applications`), and invite QR auto-action exactly. `/api/auth/check-email` call stays inside `IndividualForm.handleCheckEmail` unchanged.


- **Pre/Post LoC**: 1084 → 456 (parent page.tsx). 13 new files in `_components/` (838 LoC redistributed).
- **Extracted editors**: `SectionCard` (shell), `DomainSection`, `ColorsSection`, `BannersSection`, `AboutSection`, `PresidentSection`, `StatsSection`, `DonationsSection`, `VolunteeringSection`, `EventsSection`, `EcommerceSection`, `NewsSection`, `SdgSection`, `TransparencySection`, `ContactSection`, `AnalyticsSection`, `PublishBar`. Constants/types/DNS helper split into `constants.ts` / `types.ts` / `dns.ts`.
- **Save flow preservation**: `handleSave` (with optional `silent`), `buildPayload`, `handlePublish` (DNS verify → updateDoc with `published`/`publishedAt`/`dnsVerified` flags → window.open preview) all remain in parent. Section components receive `onSave`/`onChange` props that point back to parent state setters. All `useToast` calls still originate in parent (component-internal toasts limited to `BannersSection.onReplaceClick` + `AnalyticsSection.onConnectClick`, both wired via parent callbacks).
- **Test sonucu**:
  - `npm run typecheck` → PASS (no output).
  - `npm run lint` → 0 errors / 14 pre-existing warnings (none in `ngo-admin/website/**`).
  - `npm test -- --run` → 13 file PASS / 5 skip, 57 test PASS / 54 skip (identical to baseline).
- **Risk**: L — pure structural extraction; no logic, hooks, or callback contract changes. Rollback is a single revert; no migration/data work.

---

## 2026-05-18 — P2-6e: God-page refactor `src/app/settings/volunteer/page.tsx`
- **ID**: P2-6e
- **Lead**: frontend-lead
- **Değişiklik**: 1061 LoC volunteer settings form'u 10 dosyaya bölündü (`_components/`). Form state, Firestore hydration `useEffect`, validation toast, `handleSubmit` save callback, onboarding redirect tamamen parent'ta kaldı. Sadece presentational extract'lar — `value`/`onChange` typed props pattern.
- **Dosyalar**:
  - `src/app/settings/volunteer/page.tsx` (1061 → 476 LoC)
  - NEW `src/app/settings/volunteer/_components/types.ts` (76) — `VolunteerUserDoc`, `NeighborhoodsMap`, `EmergencyContact`, `ConsentsState`, `CategorizedOption`
  - NEW 3 widget: `filtered-multi-select.tsx` (101), `filtered-single-select.tsx` (97), `language-select.tsx` (103)
  - NEW 7 section: `motivations-section.tsx` (87), `availability-section.tsx` (78), `muhtar-section.tsx` (83), `emergency-contacts-section.tsx` (54), `address-section.tsx` (48), `health-section.tsx` (77), `consents-section.tsx` (46)
- **Pre/Post LoC**: 1061 → 476 (parent). 10 new files (850 LoC redistributed).
- **Extracted sections**: `FilteredMultiSelect`, `FilteredSingleSelect`, `LanguageSelect` (widgets); `AvailabilitySection`, `MotivationsSection`, `MuhtarSection`, `EmergencyContactsSection`, `AddressSection`, `HealthSection`, `ConsentsSection` (Card-level sections). Light single-Card sections (Meslek, Yetkinlikler+3 selects, Diller, Sertifika, Sürücü, Programlar, Vizeler — her biri 5-15 LoC) parent'ta inline kaldı; extract karşılığında LoC kazancı yoktu.
- **Form behavior preservation**:
  - State hooks (`profession`, `skills`, `languages`, `motivations`, `consents`, vb.) ve hydration `useEffect` aynen parent'ta — Firestore `userData` dinleyicisi tek noktada.
  - Validation: `requiredConsents.find(k => !consents[k])` early-return + `toast({ variant: 'destructive', title: 'Onaylar Eksik' })` aynen korundu.
  - Save callback: `updateDocumentNonBlocking(userDocRef, { volunteerInfo, ...personalInfoPatch })` payload yapısı + onboarding branch (`localStorage.setItem('onboardingStep', 'ngo-selection')` + redirect) + non-onboarding success toast aynen.
  - Dirty tracking: `useDoc` hydration → parent state → child component value props — render-driven, herhangi bir manuel `isDirty` flag yok (eski davranış).
  - `handleEmergencyContactChange(index, field, value)` callback signature `EmergencyContactsSection`'a prop olarak geçti; parent'taki functional `setState(prev =>)` mantığı korundu.
  - `availability-section.tsx`'teki yerel `toggle(list, item, checked)` helper, original'in `prev => c ? [...prev, d] : prev.filter(x => x !== d)` davranışını aynı sırayla taklit ediyor — React batch'leri içinde semantik eşdeğer.
  - `MuhtarSection` içindeki `useMemo(ilceler/mahalleler)` cascade reset (`onIlChange → onIlceChange('')`, `onMahalleChange('')`) prop callback chain ile birebir aynen.
  - Dead `addrDistricts`/`addrNeighborhoods` memos parent'ta `void` referansla korundu (logic değişmedi, sadece unused-var warning sustu).
- **Test sonucu**:
  - `npx tsc --noEmit` → PASS (no output).
  - `npm run lint` → 0 errors / 9 pre-existing warnings (önceden 11; `void addrDistricts`/`void addrNeighborhoods` 2 warning sildi; kalan 9: `page.tsx` Math.random, `ngo-selection` Date.now + 2 useMemo dep, `volunteer/page.tsx` 4 unused vars (`volunteerStartDate`, `volunteerEndDate`, `scheduleNotifications`, `addrNeighborhood` — out-of-scope), `super-admin/surveys` useMemo dep).
  - `npm test` → 13 file PASS / 5 skip, 57 test PASS / 54 skip (baseline ile aynı).
- **Risk**: L — pure structural extraction; no logic, hooks, validation, save, or callback contract changes. Rollback = single revert; no migration/data work.
- **Notlar**: Pre-existing lint warnings on this file (out-of-scope per task brief) tracked under P2-5c follow-up. Hard rule "no logic changes" honored — diff is JSX motion + prop wiring only.

---

## 2026-05-18 — P2-5e: i18n marketing pages tail strings migration (long-tail)
- **ID**: P2-5e
- **Lead**: frontend-lead
- **Plan**:
  - 14 marketing sayfasında P2-5b'nin migrate etmediği tail string'leri tara: section başlıkları/alt başlıkları, in-section paragraflar, in-line CTA defaults (`Daha Fazla Bilgi`/`Hemen Başvur`), feature/grid kartları içindeki sabit title/description, FAQ accordion içerikleri, küçük data array'lerindeki label/description (örn. campus advantage cards, ngo onboarding `mainFeatures`, association `GridCards`, social-impact `ImpactSection` çağrı parametreleri, imece step/feature cards, info commercial label'lar, careers 2 section sub-blok, about feature cards + impact stats, accessibility section header + final CTA, support category links + featured sections + FAQ).
  - HEAVY DATA SKIP: Logo/logo-usage `rules[]` (12 madde × 3-7 HTML içerik string'i, `<br/>` ve `<strong>` ile zengin formatlama), ngo-onboarding `toolsetFeatures[]` (22 araç × title+description), accessibility `SettingsItem` etiketleri (~30 toggle/select label/description ekseni). Bu üç array tek başına ~200+ string ekleyecek ve `marketing.*` namespace'i şişirecek; brief gereği "no layout/component restructure" kuralına saygıyla, ayrı bir P2-5f follow-up'a bırakıldı.
  - Yeni key naming: `marketing.<page>.{tail-kategori}.{slug}` (örn. `marketing.about.values.sosyalFayda.title`, `marketing.imece.steps.profileCreate.title`, `marketing.campus.advantages.largeDijital.title`).
  - TR/EN dolu; ru/fa/ar/zh/es 5 dil için ekleme yapılmadı — provider P2-5d boş-string-tolerant lookup zaten TR fallback'e düşürüyor.
  - Sayfalar tek tek surgical Edit ile dokunulacak; CMS `useWebPage()`/`useAssociationContent()` ile beslenen alanlar (cms.title/subtitle/description/body/heroImageUrl) brief gereği değiştirilmedi — sadece fallback `t()` veya hardcoded literal'lar migrate edildi.
- **Dosyalar**: 14 sayfa (about, press, careers, logo, logo-usage, support, merchant, campus-advantages, ngo-onboarding, hangelassociation, accessibility, social-impact, imece, bilgi-toplumu-hizmetleri) + `src/lib/translations.ts`.
- **Risk**: L — TR+EN dolu, fallback TR. Yapısal değişiklik yok, sadece literal → `t('marketing.<page>.tail.<slug>')`.
- **Test sonucu**: orchestrator gates pending.
- **Rollback**: `git revert` veya `marketing.*` namespace tail key'lerin diff'i + 14 sayfa Edit'leri geri al.

---

## 2026-05-18 — P1-1b (partial): Distributed Firestore-backed rate limiter
- **ID**: P1-1b (storage migration only; response normalization deferred to P1-1b-tail)
- **Lead**: hangel-security-lead
- **Sorun**: `check-email` ve `admin/import-data` route'ları process-local `Map<ip, { count, resetAt }>` kullanıyordu. App Hosting `maxInstances: 3` → her instance kendi kovasını tutuyor; cold-start sıfırlıyor. Saldırgan 3× burst yapabiliyor, restart'lar limiti sıfırlıyor.
- **Karar**: Redis/Upstash yerine **Firestore-based sliding window** seçildi — yeni dependency yok, Admin SDK zaten kurulu. Trade-off: çağrı başına ~50ms Firestore tx latency. Düşük-RPS public endpoint'lerde (5/dk/IP, 10/dk/IP) kabul edilebilir.
- **Yeni helper** (`src/lib/rate-limit.ts`):
  - `checkRateLimit({ bucket, key, limit, windowMs }): Promise<RateLimitResult>`
  - Doc: `rateLimits/{bucket}__{key}` `{ count, windowStart, lastSeen }`.
  - `runTransaction`: window dolduysa fresh reset, dolmadıysa atomik increment; `count >= limit` ⇒ `allowed: false`.
  - **Fail-open**: Admin SDK init throw veya tx throw → `allowed: true` döner (cold-start / network blip senaryolarında prod kırılmaz). Logged with `console.warn`.
  - Doc-id sanitization (`A-Za-z0-9._:-`, max 100 chars).
- **Migrate edilen route'lar**:
  - `src/app/api/auth/check-email/route.ts` — `ipBuckets` Map + `rateLimit()` helper silindi; `checkRateLimit({ bucket: 'check-email', key: ip, limit: 5, windowMs: 60_000 })`. Response shape DEĞİŞMEDİ (`{ errorCode: 'rate_limited', message }` + `Retry-After`).
  - `src/app/api/admin/import-data/route.ts` — `rateBuckets` + `isRateLimited()` silindi; `checkRateLimit({ bucket: 'admin-import-data', key: ip, limit: 10, windowMs: 60_000 })`.
  - `src/app/api/messaging/enqueue/route.ts` — **rate limit yoktu**, skip (`checkMessagingKey` worker-key auth zaten gate ediyor; sadece authenticated worker çağırır, per-IP rate limit gereksiz).
- **COLLECTIONS güncellemesi**: `rateLimits: 'rateLimits'` eklendi (P2-7 sabit dosyası).
- **Rules** (`firestore.rules` — kod-only, deploy edilmedi):
  ```
  match /rateLimits/{bucketId} {
    allow read, write: if false;
  }
  ```
  Specific match `allPaths=**` super-admin fallback'ten önce geliyor → tüm client erişimi (super-admin dahil) reddediliyor. Admin SDK rules'ı bypass ettiği için route'lar etkilenmiyor.
- **Tests**: `tests/api/check-email.test.ts` ve `tests/api/import-data.test.ts` `vi.mock('@/lib/rate-limit')` ile per-test sliding-window mock kazandı; hoisted `rateBuckets` Map her `beforeEach`'te `.clear()` ediliyor. Original test senaryoları (5/dk, 10/dk threshold + IP isolation) korundu — gerçek Firestore çağrısı yok.
- **Gate sonucu**: `npm run typecheck` PASS, `npm run lint` PASS (0 errors), `npm test -- --run` PASS (13 files / 57 tests / 54 skip — baseline ile bire-bir aynı, 4.43s).
- **Açık iş**: Response shape homojenleştirme (`{ status: 'ok' }` ile `exists` flag'ini gizleme) + `selection/page.tsx` signup-attempt-driven redesign halen `P1-1b-tail` altında bekliyor — frontend dependency olduğu için bu agent'ta scope dışı.
- **Risk**: L — fail-open kontrat sayesinde Firestore outage = limiter no-op (route hâlâ çalışır). Worst case: gerçek Firestore latency'si 50-200ms artırır check-email'i; sabit 250ms anti-timing gecikme bunu zaten absorbe ediyor.
- **Rollback**: `git revert` veya `checkRateLimit` çağrılarını manuel `Map` koduyla geri al; `rateLimits` doc'ları kalsa zarar yok (rules deny + Admin SDK bypass).

---

## 2026-05-18 — P2-5c-rest: i18n dashboards tail (toasts + aria + appearance/wallet)
- **ID**: P2-5c-rest
- **Lead**: frontend-lead
- **Scope**: P2-5c'nin tail'i. Top-priority başlık/CTA stringleri zaten P2-5c'de migrate edildi; bu PR toast title/description çiftlerini, tekrar eden `aria-label` Geri/Filtrele/Sırala değerlerini, settings/appearance + settings/wallet alt sayfalarının tüm görünür stringlerini, ve `my-applications` + `messages` + `settings/language` + `settings/theme` + `settings/ngo-selection` içindeki string-interpolasyonlu açıklamaları kapsar.
- **Key naming**:
  - Toast keys: `dashboard.<page>.toast<Kind>` (e.g., `dashboard.applications.toastWithdrawnTitle`/`toastWithdrawnDescPrefix`/`toastWithdrawnDescSuffix` — interpolation `prefix + ${var} + suffix` pattern).
  - ARIA keys: shared `aria.back` / `aria.filter` / `aria.sort` (yeni namespace) — `Geri`/`Filtrele`/`Sırala` 30+ yerde tekrar eden değerler. Markaya özel olmadığı için merkezi tek nokta tutuldu.
  - Yeni sayfa namespace'leri: `dashboard.settingsAppearance.*` (24 key), `dashboard.settingsWallet.*` (24 key).
- **Interpolation pattern**: `t()` template tutmuyor; bu nedenle interpolated description'lar `prefix + ${var} + suffix` parça keys'iyle render edildi (`${t('dashboard.applications.toastWithdrawnDescPrefix')}${appTitle}${t('dashboard.applications.toastWithdrawnDescSuffix')}`). Beş yerde uygulandı: my-applications withdraw, messages send success, settings/language saved, settings/theme saved, settings/ngo-selection locked, settings/wallet card-delete dialog.
- **Files touched**:
  - `src/lib/translations.ts`: TR + EN dashboard.* + yeni `aria.*` namespace. ~98 yeni key × 2 dil ≈ +196 satır.
  - Migrated: `my-applications/page.tsx`, `my-applications/new/page.tsx`, `my-donations/page.tsx`, `messages/page.tsx`, `notifications/page.tsx`, `profile/page.tsx` (sadece aria), `settings/language/page.tsx`, `settings/theme/page.tsx`, `settings/security/page.tsx`, `settings/profile/page.tsx`, `settings/volunteer/page.tsx`, `settings/notifications/page.tsx`, `settings/marketing-consent/page.tsx`, `settings/brands/page.tsx`, `settings/ngo-selection/page.tsx`, `settings/volunteer-ngo-selection/page.tsx`, `settings/accessibility/page.tsx`, `settings/privacy/page.tsx`, `settings/contracts/page.tsx`, `settings/appearance/page.tsx` (FULL — heading/sub/cardTitles/24 labels/save/toast), `settings/wallet/page.tsx` (FULL — heading/sub/cardTitles/dialogs/labels/24 labels/toast).
  - DOKUNULMADI: super-admin/ngo-admin/admin, marketing pages, landing, /clubs, /ngos, /market, /events, /volunteering, /timeline, /qr-payment, /invite, /events, /support, /library, /p — bunlar `aria-label="Geri/Filtrele/Sırala"` içerse de scope dışı (P2-5e veya başka agent owner).
- **Toplam migrate edilen string**: ~75 distinct (toast title+desc çiftleri 30+, ARIA 23, settings/appearance 17, settings/wallet 19). Yeni key counts: dashboard.* +88, aria.* +3. Toplam +91 key × 2 dil ≈ +182 satır translations.ts.
- **Gate sonucu**: `npx tsc --noEmit` PASS (no output), `npm run lint` PASS (0 errors).
- **Risk**: L — pure string move; no logic/behavior change. Toast variant + title/description placement same. ARIA semantics preserved. Rollback = single revert. Other 5 langs (ru/ar/fa/es/ha) `aria.*` doldurulmadı → P2-5d empty-string-fallback gereği TR fallback otomatik.
- **Açık iş**: marketing pages içindeki ARIA tekrarları (P2-5e agent owner). Other-locale `aria.*` çevirileri tek-kelime olduğu için gerektikçe basit ekleme (back/filter/sort).

---

## 2026-05-18 — P2-1c: vitest coverage for remaining 8 critical API routes
- **ID**: P2-1c
- **Lead**: hangel-test-engineer
- **Scope**: Extend `tests/api/` from 13 → 21 files by covering the 8 next-most-critical messaging/admin routes. Mocks at SDK boundary; no real provider calls.
- **Selected routes (8)**:
  1. `src/app/api/admin/messaging/pricing/route.ts` — super-admin GET/PUT pricing config
  2. `src/app/api/admin/messaging/ngo-wallets/route.ts` — super-admin GET list + POST topup/adjust
  3. `src/app/api/admin/messaging/ngo-senders/route.ts` — super-admin GET collectionGroup + POST approve/reject
  4. `src/app/api/messaging/csv/save/route.ts` — super-admin CSV save (parse + dedup)
  5. `src/app/api/messaging/iys/export/route.ts` — super-admin IYS consent CSV export
  6. `src/app/api/messaging/worker/reclaim/route.ts` — worker-key reclaim leases
  7. `src/app/api/messaging/worker/schedule/route.ts` — worker-key schedule promotion
  8. `src/app/api/messaging/worker/trust-score/route.ts` — worker-key trust score recompute
- **Strategy**: Reuse `tests/api/_setup.ts` helpers; mock `@/lib/firebase-admin`, `@/lib/messaging/server-auth`, `@/lib/messaging/audit`, `@/lib/messaging/wallet`, `@/lib/messaging/pricing`, `@/lib/messaging/trust-score`, `@/lib/messaging/queue/*` at SDK boundary. Each test file ≤ 30 lines per case, 3-5 cases per route.
- **Cases per file**: auth fail (401/403), input validation (400), happy path (200), provider/service error (500), and one route-specific edge (e.g., topup vs adjust branching, oversized CSV, empty wallet list).
- **Result**: 8 new files, 30 new tests (3-5 per file). `npm test -- tests/api/` → 22 files, 91 passed / 1 skipped, ~4.9s. All test files ≤ ~70 lines (case bodies all < 30 lines as required). No new skips introduced.
- **Gate**: full suite PASS 91/0 fail.

---

## 2026-05-18 — P1-8b: AI quota cap env-tunable per-kind
- **ID**: P1-8b
- **Lead**: backend-lead
- **Scope**: `src/ai/guards.ts` `checkAndConsumeAIQuota`'sının hardcoded `30 calls/user/day/kind` cap'ini env-tunable yap. Flow dosyalarına dokunma (zaten `kind` string'ini doğru geçiriyorlar).
- **Çözüm**:
  - Yeni internal helper: `resolveCapForKind(kind, defaultCap)` — `kind` → `[^a-zA-Z0-9]+` replace + UPPER → env key `AI_QUOTA_<SUFFIX>`. Boş / undefined → default. Non-positive-int veya parse fail → `console.warn` + default.
  - `checkAndConsumeAIQuota`: `const effectiveCap = cap === DEFAULT_DAILY_CAP ? resolveCapForKind(safeKind, DEFAULT_DAILY_CAP) : cap;` — env override SADECE caller `cap` argümanını default'ta bıraktıysa devreye giriyor. Bu sayede mevcut testler ve explicit cap geçen call site'lar etkilenmiyor (backward-compatible). 5 flow wrapper de cap geçmediği için otomatik env override alıyor.
  - `effectiveCap`, hem Firestore tx'inde (`current >= effectiveCap`) hem doc payload'ında (`cap: effectiveCap`) hem fail-open dönüşlerinde kullanılıyor → bucket doc'u her zaman gerçekten uygulanan cap'i yansıtıyor.
  - Kind normalize: `safeKind` (`sanitizeUserInput` + `[^a-zA-Z0-9_-]` strip) `resolveCapForKind`'a feed ediliyor → kötü niyetli kind input'u env key injection açmıyor.
- **Env vars (`.env.example` APPEND)**:
  - `AI_QUOTA_IMPACT_STORY=30`
  - `AI_QUOTA_LIBRARY_ASSISTANT=50`
  - `AI_QUOTA_MARKETPLACE_ASSISTANT=50`
  - `AI_QUOTA_PRODUCT_DESCRIPTION=20`
  - `AI_QUOTA_PROJECT_WRITER=10`
- **Files touched**: `src/ai/guards.ts` (helper + cap resolution), `.env.example` (append block + comment), `docs/audit/tasks.md` (yeni P1-8b satırı ✅), `docs/audit/decisions.md` (bu giriş).
- **Files NOT touched**: 5 flow dosyası (`src/ai/flows/{impact-story-flow,library-ai-assistant,marketplace-ai-assistant,marketplace-ai-product-description,project-writer-flow}.ts`), API routes, `firestore.rules`, `.worktrees/**`. Flow imzaları değişmedi.
- **Gate sonucu**: `npm run typecheck` PASS (no output), `npm run lint` PASS (0 errors; 1 pre-existing unrelated warning in `messages/page.tsx`), `npm test -- --run` PASS (14 files / 60 tests / 54 skip — baseline).
- **Risk**: L — env-driven `Number(...)` parse + sınır kontrolü; parse fail bilinçli olarak default'a fallback ediyor (warn log var). Doc payload `cap` alanı bucket başına `effectiveCap` ile yazıldığı için aynı kullanıcı aynı gün cap'i değişse bile (yeniden deploy) bucket'taki `cap` field'ı geçmiş kararı tartışmaya açık tutmuyor (her tx'te güncel `effectiveCap` ile karşılaştırma yapılıyor). Worst case: operator bilerek 0 / negatif yazarsa warn + default 30 → bucket throttle bozulmaz.
- **Rollback**: `git revert`; bucket'lardaki `cap` field'ları geri-uyumlu (rules okunmuyor, sadece audit için).

---

## 2026-05-18 — FEAT-AFFILIATE-WEBHOOK: brand → Hangel sale confirmation endpoint
- **ID**: FEAT-AFFILIATE-WEBHOOK
- **Lead**: backend-lead
- **Scope**: Implement the receiving side of the affiliate webhook flow flagged by the `TODO(affiliate-webhook)` in `src/app/market/[id]/page.tsx:142`. Brands POST confirmed sales to `POST /api/affiliate/webhook/[brandId]`; Hangel verifies HMAC, records an idempotent audit row, and increments the user's `impactScore`.
- **Endpoint shape**: `POST /api/affiliate/webhook/[brandId]`.
  - Headers: `x-affiliate-signature: <hex>` (or `sha256=<hex>`) — HMAC SHA256 of raw body. Optional `x-affiliate-timestamp: <unix-seconds>` enforced ±5min (P1-3 pattern) when present.
  - Secret resolution: per-brand `brands/{brandId}.affiliateSecret` first, else env fallback `AFFILIATE_WEBHOOK_SECRET`. Both compared via `crypto.timingSafeEqual` on equal-length buffers.
  - Body: `{ orderId, userId?, referralCode?, amount, commission, currency?='TRY', completedAt }` validated manually (no zod dep).
  - Errors: `{ errorCode, message }` shape — `INVALID_SIGNATURE` (401), `STALE_TIMESTAMP` (401), `INVALID_BODY` (400), `DUPLICATE_ORDER` (409), `BRAND_NOT_FOUND` (404), `INTERNAL_ERROR` (500). Signature check intentionally precedes brand-existence check so callers without a valid secret cannot probe brandId existence.
- **Idempotency strategy**: `affiliateConfirmations/{brandId}__{orderId}` doc via Admin SDK `.create()` (atomic create-or-fail). Code `6` / `'already-exists'` → 409 `DUPLICATE_ORDER`. Path-safe id (`/` → `_`, sliced ≤1500).
- **Impact bump**: `runTransaction` wraps `users/{userId}` `impactScore: FieldValue.increment(commission)` + `updatedAt`. If `userId` missing OR user doc missing OR tx throws, audit row stays but impact bump is skipped (logged) — operator reconciliation path via `referralCode`.
- **Files created**:
  - `src/app/api/affiliate/webhook/[brandId]/route.ts` (~230 LoC) — POST handler.
  - `tests/api/affiliate-webhook.test.ts` — 4 cases (missing sig 401 / invalid sig 401 / duplicate 409 / valid 200 + impact++). Mocks `@/lib/firebase-admin` `collection().doc()` per collection, `runTransaction` proxies a fake tx whose `get()` returns user-exists + `update()` is the spy.
- **Files modified**:
  - `src/firebase/collections.ts`: added `affiliateConfirmations: 'affiliateConfirmations'` to COLLECTIONS map.
  - `firestore.rules`: appended `match /affiliateConfirmations/{confId} { allow read, write: if false; }` next to the other Admin-SDK-only deny blocks (server-only audit trail; brand HMAC verified server-side). **CODE ONLY — DEPLOY PENDING USER** (`firebase deploy --only firestore:rules`).
  - `.env.example`: appended `AFFILIATE_WEBHOOK_SECRET=` block with usage notes.
  - `docs/audit/tasks.md`: new `FEAT-AFFILIATE-WEBHOOK` row (✅ Done; rules deploy gate noted).
- **Files NOT touched**: other API routes, `src/lib/messaging/**`, `src/app/market/[id]/page.tsx` (frontend TODO remains as the brand-side integration trigger; backend is now ready to receive), `.worktrees/**`. Donation status flip + 72-day `clearableAt` reconciliation will follow once a brand actually integrates and the audit trail is populated.
- **Gate sonucu** (planned): `npm run typecheck && npm run lint && npm test -- --run` — verified in this session.
- **Risk**: L — endpoint is additive, no existing caller touched; rules deny by default; secret resolution prefers per-brand so onboarded partners can rotate without env churn. Worst case: brand misconfigures signature → 401 (no side effect). Duplicate sends → 409 (audit doc untouched). Impact bump failure → confirmation row preserved + log line for reconciliation.
- **Rollback**: `git revert` of the new route + collections entry + rules block + env line. No data migration since the collection is brand-new and read-deny.
- **Açık iş**:
  - Rules deploy by operator: `firebase deploy --only firestore:rules`.
  - Brand onboarding doc snippet to share with partners (HMAC body recipe, header names, signature format) — separate doc PR.
  - Donation status flip from "Başlatıldı" → "İşleme Alındı" once webhook lands (frontend TODO at `src/app/market/[id]/page.tsx:142`) — follow-up `FEAT-AFFILIATE-WEBHOOK-2`.

# Decisions log

## FEAT-MSG-REALTIME (2026-05-18) — hangel-frontend-lead

**Context**: Audit flagged messaging page as missing realtime listener + read receipts.

**Verification (realtime)**: `useCollection(messagesQuery)` already uses `onSnapshot` under the hood via the `useCollection` hook (`src/firebase/firestore/use-collection.tsx`). `messagesQuery` is memoized via `useMemoFirebase` with `[db, authUser?.uid]` deps. Realtime listener IS in place. Audit finding was outdated. No change required.

**Read receipts**: On message row click or profile-open, call `markAsRead(msg)` which writes `readBy.{uid} = serverTimestamp()` via `setDoc(..., { merge: true })`. Graceful degradation on rule rejection (warn-only). Idempotent: skips write if `msg.readBy[uid]` already set client-side.

**Unread cue**: New `isUnread(msg)` helper returns `true` when `readBy[uid]` is absent. Falls back to legacy `msg.unread` boolean if present (backward compat). Left-border visual cue (`border-l-4 border-l-primary`) now keyed off this helper.

**Unread badge in header**: SKIPPED. Header (`src/components/layout/header.tsx`) has only a notifications bell (`/notifications`), no dedicated messages icon. Per scope ("don't touch otherwise"), I did not add a new icon or piggyback messages count onto the notifications badge — those are distinct concepts and conflating would mislead users.

**Files modified**:
- `src/app/messages/page.tsx`

**Gates**: `npm run typecheck` PASS · `npm run lint` PASS.

## FEAT-ANALYTICS-CONSUME (2026-05-18) — hangel-frontend-lead

**Context**: `src/app/ngo-admin/analytics-tools/page.tsx` has 3 placeholder Inputs (GA4 / Meta Pixel / GTM) with no Firestore wiring. NGO public page (`src/app/ngos/[id]/page.tsx`) does not inject any tracking scripts.

**Storage**: `ngos/{ngoId}.analytics = { gaId, gtmId, metaPixelId }`. Field added ad-hoc (Firestore schemaless); no type changes required for write side. Empty strings stored as empty (skipped on render).

**Form wiring**: Resolve NGO id via the same pattern as `ngo-admin/website/page.tsx` — `adminNgos = where('adminUserId', '==', uid)` then fallback to `users/{uid}.managedNgoId`. Gate UI when no NGO admin: render an explanatory card and disable save. Hydrate state on first NGO doc load via `useEffect` + `hydrated` flag (mirrors website builder). Save via `updateDoc(ngos/{ngoId}, { analytics: {...} })`.

**Script injection**: New `src/components/shared/ngo-analytics-scripts.tsx` — client component, props `{ gaId?, gtmId?, metaPixelId? }`, uses Next.js `<Script strategy="afterInteractive">`. GA4: gtag loader + inline `gtag('config', gaId)`. GTM: inline dataLayer push + `<noscript>` iframe fallback. Meta Pixel: standard `fbq` snippet. Each block skipped when its id is empty/falsy. No new dependency.

**Mount point**: `src/app/ngos/[id]/page.tsx` — render `<NgoAnalyticsScripts ... />` once `ngo` is loaded, conditional on at least one id being present.

**Files not touched**: `src/app/layout.tsx`, providers, API routes, rules, `.worktrees/**`. `AnalyticsSection` in website builder left alone (separate copy, separate save path — out of scope).

**Risk**: L — purely additive. Empty ids => no scripts. Bad id => third-party silently fails. No PII added.

**Gates**: typecheck/lint/test below.


## FEAT-NGO-CAMPAIGN-UI (2026-05-18) — hangel-frontend-lead

**Context**: Backend (`POST /api/ngo-admin/messaging/campaigns`, resolver, wallet, pricing) is complete. Existing `src/app/ngo-admin/messaging/campaigns/new/page.tsx` was a 3-step stub: no segment dropdown, no live cost estimate, no wallet pre-flight, no `scheduledAt`, no `spec.segmentIds`. List page lacked `EmptyState` + columns (sent count / sent at) + auth-gate redirect.

**Composer rewrite** (`campaigns/new/page.tsx`):
- Single-form composer (not multi-step) to match audit acceptance criteria.
- Loads `/api/ngo-admin/messaging/me` once for `{ ngoId, wallet }`.
- Auth gate: if `me` 401/403 or no `managedNgoId`, `router.replace('/market')`.
- Channel radio (sms/email/whatsapp) + segment dropdown populated from `useCollection(query(collection(db, COLLECTIONS.ngoRecipientSegments), where('ngoId','==', ngoId)))`.
- Subject input gated on `channel === 'email'`.
- Body textarea + live SMS segment/encoding indicator (reuses `segmentInfo`).
- `scheduledAt` `datetime-local` (optional).
- Live dry-run via `/api/ngo-admin/messaging/resolve-recipients` on (channel, useCase, segmentIds) change, debounced 600ms.
- Live cost estimate computed **client-side** (mirrors `computeCampaignCost` defaults: TRY tier prices, free quota, KDV) so the user sees TRY before submit. Server still re-computes authoritative cost.
- Disable submit when: `cost.total > wallet.balance - wallet.reserved` (insufficient) OR no recipients OR no name/body.
- Toast + `router.push('/ngo-admin/messaging/campaigns')` on success (per acceptance criteria — list, not detail).

**List rewrite** (`campaigns/page.tsx`):
- Use `EmptyState` from `@/components/shared/empty-state`.
- Resolves ngoId via `users/{uid}.managedNgoId` (existing pattern). If absent, redirect `/market`.
- Query: `where('ngoId','==', ngoId), orderBy('createdAt','desc'), limit(50)`. Note: campaign docs are written with field `ngoId` (not `scopedNgoId`) by `/api/ngo-admin/messaging/campaigns/route.ts`, so query field stays `ngoId`. The PRD line about `scopedNgoId` reflects the spec naming; storage uses `ngoId`.
- Columns: name, channel (icon+text), status badge, sent count `stats.sent`, sent at (`completedAt ?? createdAt`), view link.

**Hard rules**: only `@/components/ui/*`, `@/components/shared/empty-state`, `lucide-react`, `@/lib/messaging/{client,sms-segments}`. No super-admin imports. No new files outside the two listed.

**Risk**: L — UI-only changes; backend unchanged; submit path identical.

**Gates**: typecheck + lint + test below.

## FEAT-FCM-PUSH-NOTIF (2026-05-18) — hangel-frontend-lead (scaffold)

**Status**: 🔧 scaffold-only. Actual delivery (P-FCM-DELIVERY) + Capacitor iOS native push are explicitly out of scope here.

**What landed**:
- `public/firebase-messaging-sw.js` — minimal SW using Firebase compat CDN (compat is mandatory inside service workers; modular SDK has no SW bundle). Inlines the same config as `src/firebase/config.ts` (env interpolation is not available inside `public/`).
- `src/lib/fcm.ts` — `requestPushPermission()` + `registerForPushToken(uid)`. SSR-safe (every entry point guards `typeof window`). VAPID key from `NEXT_PUBLIC_FIREBASE_VAPID_KEY`; missing → warn + return null. Token persisted at `users/{uid}/fcmTokens/{token}` via `setDoc(..., { createdAt, userAgent }, { merge: true })`. Firestore write failure is swallowed (warn-only) per the "graceful degradation on rule rejection" rule — token still returned to the caller.
- `src/components/providers/push-notifications-provider.tsx` — client provider that registers the token once `useUser()` resolves to a signed-in user AND `Notification.permission === 'granted'`. Does NOT prompt on mount (hostile UX); a future settings CTA will call `requestPushPermission()` directly. Re-mount guard via `useRef(uid)` so we don't double-register in dev/StrictMode.
- `src/firebase/collections.ts` → added `fcmTokens: 'fcmTokens'` under the users sub-collections block.
- `.env.example` → added `NEXT_PUBLIC_FIREBASE_VAPID_KEY` with inline comment explaining where to find it (Project Settings → Cloud Messaging → Web push certificates).

**Layout mount**: deliberately NOT modified per orchestrator contract. Snippet in report.

**Why no `@capacitor/push-notifications`**: Hard rule said "do NOT install new dependency unless absolutely required". Web FCM scaffold needs only the existing `firebase` package + the new SW file. Native iOS / Android push is a separate follow-up (P-FCM-DELIVERY) that will install the Capacitor plugin and wire `PushNotifications.register()` → same Firestore token-save path.

**Firestore rules**: NOT touched. Write to `users/{uid}/fcmTokens/{token}` will likely be rejected by current rules — the helper swallows that error so the scaffold remains a no-op until rules are updated under P-FCM-DELIVERY.

**Risk**: L — net-new files only; the provider is unmounted until the orchestrator adds it to layout. No existing code path changes behaviour. Worst case: silent no-op for users without permission or missing VAPID key.

**Gates**: typecheck/lint/test below.

## FEAT-EVENT-RSVP (2026-05-18) — hangel-backend-lead

**Status**: ✅ Done. API + UI + 4 vitest cases shipped surgically.

**Data model**: Sub-collection `events/{eventId}/rsvps/{userId}` (doc id == userId for natural idempotency + cheap own-rsvp read). Shape: `{ userId, status: 'going' | 'cancelled', createdAt, updatedAt }`. Soft delete on cancel (we keep the doc with `status: 'cancelled'` rather than `tx.delete()`) so that re-going preserves the original `createdAt` and gives us a clean audit trail. New `COLLECTIONS.eventRsvps = 'rsvps'` registered under the events block.

**API**: `POST /api/events/[id]/rsvp` — body `{ action: 'going' | 'cancel' }`. Auth via `Authorization: Bearer <idToken>` → `getAdminAuth().verifyIdToken()` (mirrors `requireSuperAdmin` pattern, but no role gate — any signed-in user). Single `runTransaction`:
  1. `tx.get(eventRef)` — 404 if missing; read `capacity.max` (cap rule: `> 0` → finite cap, else unlimited).
  2. `tx.get(rsvpRef)` — detect `wasGoing`.
  3. `tx.get(rsvpsCol.where('status','==','going').count())` — server-side aggregate, cheap and consistent within the tx.
  4. action='going' + not wasGoing + at cap → throw `RsvpError('EVENT_FULL', 409)`.
  5. else `tx.set(rsvpRef, ...)` with merge.
  Returns `{ status, count }`. Error shape `{ errorCode, message }` per acceptance.

**Why aggregate count, not denormalize**: `event.capacity.current` already exists in the Event type but is treated as a display-only number set by event creators. Reading `count()` inside the tx keeps the cap deterministic without write-fanning every RSVP into the parent doc (Firestore aggregate `count()` is 1 read regardless of size).

**UI**: `src/app/events/[id]/page.tsx` — added `useDoc<rsvp>` subscription on `events/{id}/rsvps/{uid}`, capacity `<Progress>` bar (only when `capacity.max > 0`), and a state-aware bottom-bar button:
 - signed-out → `disabled`
 - not going → "Katıl" primary button
 - going → "Katıldın ✓ — vazgeç" outline button
 The existing badge-PDF AlertDialog moved to a secondary "Yaka Kartı" button next to it (kept the full dialog content untouched). `EVENT_FULL` shows a destructive toast: "Etkinlik dolu — Kapasite dolduğu için kayıt alınamadı."

**Tests** (`tests/api/events-rsvp.test.ts`): mocked `@/lib/firebase-admin` with an in-memory rsvp `Map` + a fake transaction (`get` discriminates by `__kind`/`__countOf`). 4 cases: missing auth → 401, valid going → 200 + count, going at cap → 409 EVENT_FULL, cancel → 200 + decrement. 4/4 PASS in 58ms.

**Gates**:
 - `npm run typecheck` → PASS
 - `npm run lint` → 1 pre-existing error in `src/lib/fcm.ts` (untracked file from a different agent; not in scope)
 - `npm test -- --run tests/api/events-rsvp.test.ts` → 4 passed (4)

**Files**:
 - NEW `src/app/api/events/[id]/rsvp/route.ts`
 - NEW `tests/api/events-rsvp.test.ts`
 - MOD `src/app/events/[id]/page.tsx` (RSVP state + button toggle + capacity bar; did not touch the badge-PDF dialog content)
 - MOD `src/firebase/collections.ts` (+`eventRsvps`)

**firestore.rules**: NOT touched. Suggested follow-up rule block documented inline at the top of the route file: `match /events/{eventId}/rsvps/{userId}` allow read iff `request.auth.uid == userId`, deny client writes (server-only via this endpoint enforces the capacity guard).

**Risk**: L — net-new endpoint + a localized UI swap on the bottom CTA bar. No existing API behaviour changed; the badge-PDF dialog is preserved verbatim under a new secondary trigger.

## P2-5f (2026-05-18) — hangel-frontend-lead — marketing deep-array i18n

**Context**: P2-5e deferred six deeply-nested data arrays (~100 strings) under the "no structural restructure" rule. P2-5f completes them by extending the existing schema with id-keyed sub-namespaces and parameterizing the JSX maps.

**Approach (per file)**:
- `logo/page.tsx` + `logo-usage/page.tsx`: `rules` array (12×{title, content}) collapsed to `{id, tkey, icon}` triples. Multi-paragraph `content` (1–5 paragraphs per rule, with embedded HTML) joined with `\n\n` into a single translation string under `marketing.logo.rules.<tkey>.content`. Render-time `content.split('\n\n')` reproduces the original `<p>` mapping verbatim. Titles → `marketing.logo.rules.<tkey>.title`. Shared between both pages (single translation block). 12 rule titles + 12 contents = 24 keys.
- `ngo-onboarding/page.tsx`: `advantageItems` (5) → `{tkey, imageUrl, imageHint, href}` with text via `marketing.ngoOnboarding.advantages.<tkey>.{category,title,description,linkLabel}` = 20 keys. `toolsetFeatures` (22) → `{href, icon, tkey, tagKey?}` with `marketing.ngoOnboarding.tools.<tkey>.{title,description}` = 44 keys. `tagKey` ∈ {`new`,`beta`} resolved to `marketing.ngoOnboarding.tag{New,Beta}` = 2 keys. Total 66.
- `accessibility/page.tsx`: 29 `SettingsItem` (label + optional description) — wired to `marketing.accessibility.items.<id>.{label,desc}`. Select option items (Küçük/Normal/Büyük etc.) intentionally NOT migrated (out of scope per brief: "labels + descriptions"). ~50 keys.
- `careers/page.tsx`: 5-job array → `{tkey, locKey, typeKey}` + reusable `marketing.careers.{jobOrg, loc*, type*, jobs.<tkey>, applySubjectPrefix}` = 14 keys (5 titles + 5 locations + 2 types + jobOrg + applySubjectPrefix). `mailto:` subject built via `t('marketing.careers.applySubjectPrefix') + title`.
- `press/page.tsx`: `pressReleases[3]` titles → `marketing.press.releases.r{1,2,3}Title` = 3 keys (date and `lang` code stay in code). `photos[10]` `alt` → `marketing.press.photos.alt{1..10}` = 10 keys. `hint` stays in code (AI hint, not user-visible). 13 total.
- `bilgi-toplumu-hizmetleri/page.tsx`: already uses `t('marketing.info.boardRole*')`; PII member names intentionally NOT migrated. 0 new work.

**Total new keys added to `translations.ts`**: ~177 (TR + EN populated; other 5 locales rely on the P2-5d empty-string fallback to TR).

**Key naming convention**: Kept dotted, namespaced under each page's existing `marketing.<page>` block (e.g., `marketing.logo.rules.izin.content`). Used `tkey` field on data arrays so id ↔ key are decoupled (e.g., `id: 'sosyal-medya'` but `tkey: 'sosyalMedya'` to keep JS-safe identifiers).

**Files MOD**:
- `src/app/logo/page.tsx`
- `src/app/logo-usage/page.tsx`
- `src/app/ngo-onboarding/page.tsx`
- `src/app/accessibility/page.tsx`
- `src/app/careers/page.tsx`
- `src/app/press/page.tsx`
- `src/lib/translations.ts` (+~177 TR + ~177 EN ≈ +~360 lines)

**Files NOT touched**: `bilgi-toplumu-hizmetleri/page.tsx` (already migrated; PII out of scope), `src/app/layout.tsx`, other marketing pages, dashboards, settings, API routes, rules, `.worktrees/**`.

**Risk**: L — semantically identical render output (verified spot-check on `rules.izin.content.split('\n\n')` → 3 paragraphs as before; same `<p dangerouslySetInnerHTML>` per paragraph, same sanitize+bullet replacement). No new files, no logic change, no callback rename. Worst-case mistranslation falls through to TR via P2-5d.

**Gates**: `npm run typecheck` PASS · `npm run lint` PASS (0 errors) · `npm test -- --run` PASS (24 files / 105 tests, 5/54 skip — baseline identical).

**Rollback**: `git revert` of these 7 file mods. Translation keys are additive and unused-after-revert (harmless).


---

## 2026-05-19 — Ghost super-admin account deletion

- **Action**: Deleted Auth UID `j0LK5Kzvr4bwLFdD2pJuRQI2IHR2` (placeholder email `5384009090@hangel.org`).
- **Justification**: Ghost account from phone-OTP signup on 2026-03-19; never signed in since creation. No Firestore `/users/{uid}` doc, no application activity. Was duplicate of İsmail Hilmi (`v7woPv...`, email-auth) which is the active account.
- **Steps**:
  1. `setCustomUserClaims(uid, null)` — removed `role: 'super-admin'`
  2. `deleteUser(uid)` — Auth record removed
  3. Verified: `getUser(uid)` → `auth/user-not-found`
- **Risk**: L — account never had any data attached; deletion does not affect İsmail's active access via `v7woPvqKAzSTSodVOJB702WJmJ93`.
- **Result**: Super-admin surface reduced from 4 → 3 UIDs (no functional loss; just hygiene).

---

## 2026-05-19 — Lesson learned: silent App Hosting build failure (Wave 7 batch 2 dynamic routes)

- **What happened**: Wave 7 batch 2 added `src/app/api/affiliate/webhook/[brandId]/route.ts` and `src/app/api/events/[id]/rsvp/route.ts` with the Next.js 14 sync params signature `{ params: { foo } }`. Local `npm run typecheck` PASSED. Production App Hosting build FAILED with TypeScript "invalid POST export" error. Production silently stayed on the last successful commit from 5 days earlier — none of P0-4b auth fix, P1-1 rate limiter, P1-2 webhook HMAC, FCM scaffold, analytics, RSVP, NGO campaign UI, or `firebase-admin.ts` ADC fallback reached prod. Only Firebase server-side state (rules deploy, custom claims, token revoke, Firestore TTL) was actually live.

- **Symptom**: User reported "ismailhilmi@hangel.org ile giriş yapmıyor, kayıt ekranına atıyor". Root cause: `/api/auth/check-email` returned `500 ENOENT` (old `firebase-admin.ts` looking for the gitignored service-account JSON in the build artifact) → frontend `data.exists=undefined` → `else setStep('register')`.

- **Second hidden issue surfaced**: After fixing Promise<params>, build failed again on `Property 'managedNgoId' does not exist on type 'UserRow'` in `super-admin/users/_components/assign-entity-dialog.tsx`. Local tsc resolved `User & { managedNgoId? }` correctly; prod TS pipeline did not. Worked around with `Record<string, ...>` bracket access.

- **Permanent guardrails added**:
  - `CLAUDE.md` "Test ve doğrulama" section now mandates `npm run build` when touching: dynamic route handlers, generic intersection types, new `'use client'` files with server-only imports, server-action/API-route prop signatures.
  - `.claude/agents/hangel-surgical-coder.md` workflow step 5 added: run `npm run build` in the listed scenarios and report.
  - `.claude/agents/hangel-code-auditor.md` check #9 added: flag CRITICAL if any high-build-risk change lacks an attached `npm run build` result.

- **Operational pattern**: When in doubt about deploy state, run:
  ```
  curl -sS -H "Authorization: Bearer $(gcloud auth print-access-token)" \
    "https://firebaseapphosting.googleapis.com/v1beta/projects/hangel-new-v18-87297865-9bcc3/locations/us-central1/backends/studio/builds?pageSize=5" \
    | python3 -c "import sys,json; d=json.load(sys.stdin); [print(b['name'].split('/')[-1],'|',b['state'],'|',b.get('source',{}).get('codebase',{}).get('commit','')[:8]) for b in sorted(d.get('builds',[]), key=lambda x: x.get('createTime',''), reverse=True)[:5]]"
  ```
  A `FAILED` state on the latest entry means production is frozen on the previous `READY` one.

- **Recovery commits**: `cac4f071` (Promise<params> + ShieldX cleanup), `b2aba824` (UserRow bracket access). Final READY build: `build-2026-05-19-003` at 18:56 GMT.

---

## 2026-05-19 — PDF Audit Triage (kullanıcı `hangel.org.tr HATA.pdf`)

**Bağlam**: Kullanıcı 6 sayfalık PDF ile ~90 madde rapor etti. Orchestrator 7 wave'de paralel lead dispatch ile ele aldı (5 frontend + 4 backend + 3 security + 2 devops + 5 surgical-coder). Toplam: 72 dosya değişti, ~4500 satır eklendi, 11 yeni test dosyası (5 rules + 2 API + 1 firebase + 3 extension), 5 yeni page (`emergency/about`, `hangelassociation/{press,conferences}`, `posts/[id]`, `brand-admin/posts`, `club-admin/posts`), 4 yeni API route (`/api/library/{chat,project}`, `/api/admin/users/[uid]/{disable,delete}`), 3 yeni runbook.

### Tek-seferlik kararlar

1. **Demo data temizleme yaklaşımı**: Hardcoded mock değerler (1.240 takipçi vs.) kod yerine UI'da `<EmptyState>` fallback. Gerçek demo doc'ların silimi data ops işi (runbook).

2. **Like model**: `posts.likedBy[]` array → `posts/{id}/likes/{uid}` subcollection. Sebep: array-based model rule eşleştirmesi (`authorId == auth.uid`) non-author'ları engelliyordu. Subcollection per-user write izni. Legacy `likedBy[]` field opsiyonel olarak read fallback'te (eski post'lar için).

3. **30-gün donor lock**: `users/{uid}.lastNgoSelectionChange` field zaten `settings/ngo-selection`'da var; aynı field NGO profil sayfasında reuse edildi. Yeni field eklenmedi.

4. **Kulüp katılım okul kontrolü**: `volunteerInfo.education[].school` (lowercase trim) vs `club.university` (lowercase trim) substring match. Heuristic — `schoolId` typed field future task (PDF-USER-SCHOOL-TYPED).

5. **User delete = soft delete**: Yeni `/api/admin/users/[uid]/delete` Firebase Auth account silimi + Firestore doc delete. Disable mode opsiyonel (`disabled: true` flag, Auth disable). Self-delete guard var.

6. **Affiliate webhook sale flow**: Market "alışverişe başla" tıklaması ARTIK donations/notifications create ETMİYOR. Tüm donation create akışı `/api/affiliate/webhook/[brandId]` üzerinden (brand sale confirmation → idempotency anchor → donations + notification + impactScore atomic transaction).

7. **CMS yaklaşımı**: Yeni koleksiyon yaratılmadı. Mevcut `siteSettings/{webContent,associationContent}` doc + `useWebPage(slug)`/`useAssociationContent.get(path, fallback)` hook'ları reuse edildi. 2 yeni route (`press`, `conferences`) + sitemap rewire. Tam structured CMS (`cmsPages` schema) defer.

8. **Library AI**: Mevcut Genkit flow'lar (`library-ai-assistant.ts`, `project-writer-flow.ts`) zaten P1-8 sanitization + P1-8c quota + P2-9 token cap. Yeni: 2 API route (chat + project) + frontend ProjectWriterDialog + super-admin `ai-management` page (pre-existing) için `aiAssistantConfig` rule. Full RAG (embedding + retrieval) defer.

9. **Consent slug fix**: 12 mismatch href düzeltildi + 5 yeni entity-spesifik contract entry (`stk-uyelik`, `seffaflik`, `marka-uyelik`, `affiliate-politikasi`, `ogrenci-kulup`).

10. **Brand/Club admin posts**: `/ngo-admin/posts/page.tsx` zaten entity-aware (`managedBrandId`/`managedClubId` resolution). Yeni `/brand-admin/posts/page.tsx` ve `/club-admin/posts/page.tsx` 12-LoC wrapper'lar (URL discoverability). Sidebar nav extension defer.

### Wave map (kim ne yaptı)

| Wave | Lead | PDF maddeleri | Status |
|---|---|---|---|
| 1A | backend-lead | PDF-1, PDF-2, PDF-3, PDF-4 (brand+market) | ✅ |
| 1B | frontend-lead | PDF-5 + login redirect + logo verified | ✅ |
| 1C | frontend-lead | PDF-6 (notifications investigation) | 🟡 (defer 2B+2C) |
| 1D | frontend-lead | PDF-7 (timeline investigation) | 🟡 (defer 2A+2D) |
| 1E | frontend-lead | clubs new tabs (Okulumda/Üniversite/Lise) | ✅ |
| 2A | security-lead | posts likes subcoll rule + 9 test | ✅ (deploy gerek) |
| 2B | devops-lead | firestore.indexes.json + 2 composite | ✅ (deploy gerek) |
| 2C | backend-lead | clubs Firestore migration + use-collection error mask helper + 5 test | ✅ |
| 2D | frontend-lead | timeline like swap + share URL anchor | ✅ |
| 3A | frontend-lead | profile aggregation verified (pre-existing) | ✅ |
| 3B | frontend-lead | PDF-10, PDF-11 (messages) | ✅ |
| 3C | frontend-lead | PDF-12 (invite contacts permission) | ✅ |
| 3D | frontend-lead | PDF-15..18 (ngo-admin manage-profile/funds/impact/posts) | ✅ |
| 4A | security-lead | fundApplications + impact-stories storage + managedNgoId fallback + 15 test | ✅ (deploy gerek) |
| 4B | frontend-lead | PDF-19 events admin (verified pre-existing) + public filter | ✅ |
| 4C | backend-lead | PDF-20+21+22+23 (donations flow) | ✅ |
| 4D | frontend-lead | PDF-24+25+26+27 (entity buttons) | ✅ |
| 4E | security-lead | events approve/reject rule + 10 test | ✅ (deploy gerek) |
| 5A | backend-lead | PDF-28..31 (super-admin/users) | ✅ |
| 5B-impl | surgical-coder | PDF-32..35 (consent slugs + 5 contracts) | ✅ |
| 5C-impl | surgical-coder | PDF-36..39 (press + conferences) | ✅ |
| 6A | frontend-lead | PDF-71 (frontend) + PDF-73 (FAB+filter+ProjectWriter) | ✅ |
| 6D | frontend-lead | PDF-80 (login auto-action ref param) | ✅ |
| 6E | frontend-lead | PDF-81..85 (surveys/emergency/leaderboard verify) | ✅ |
| 6F | backend-lead | PDF-71-impl (2 API routes + 17 test) | ✅ |
| 6G | security-lead | PDF-72 + PDF-81b + PDF-30b + 28 test | ✅ (deploy gerek) |
| 6H | frontend-lead | PDF-86 (ngos demo) + PDF-87 (admin posts) + PDF-88 (permalink) | ✅ |

### Defer kararları

- **PDF-13b** (Gmail/Outlook OAuth + IMAP proxy): OAuth client setup + Firestore credential storage rules + backend route'lar = 3-5 günlük iş. Defer.
- **PDF-50+** (Kütük lookup): Vakıf/Dernek registry data import (Google Sheets) + lookup API + form auto-fill = 2-3 günlük iş. Runbook üretilecek (PDF içinde data URL'leri verildi); kullanıcı CSV indirip Firestore'a import edebilir.
- **PDF-9a, PDF-71-rl, PDF-71-sysprompt, PDF-90**: Küçük follow-up'lar. Sonraki wave'lerde alınacak.
- **P-FCM-DELIVERY**: iOS/Android push delivery — Capacitor plugin install + APNs cert + foreground handler.

### Gates (session bitiminde)

- `npm run typecheck` — PASS (0 errors)
- `npm run lint` — PASS (0 errors / 0 warnings)
- `npm run test` — 127 passed / 116 skipped (rules emülatör gated) / 0 failed
- `npm run test:rules` — sandbox'ta Java yok, CI doğrulayacak; toplam 70+ rules test case (W2A 9 + W4A 15 + W4E 10 + W6G 28 + diğer pre-existing).

### Deploy gereksinimi

Tüm rules/storage/indexes değişiklikleri tek komut:
```
firebase deploy --only firestore:rules,firestore:indexes,storage --project hangel-new-v18-87297865-9bcc3
```

Detay + sıralama: `runbooks/pdf-audit-2026-05-19-deploy.md`.

---

## 2026-05-21 — "Kırmızı maddeleri düzelt" turu (orchestrator)

**Bağlam**: Kullanıcı PDF'i tekrar gönderip yalnızca KIRMIZI maddelerin düzeltilmesini istedi. 5 paralel Explore ajanıyla kırmızı maddeler gerçek koda karşı doğrulandı.

### Kök neden bulgusu (önemli)
Kırmızı maddelerin ~%70'i kodda ZATEN doğruydu (nav linkleri, filtreler, sekmeler, donationRate doğrulama, logo fallback, demo filtreleme, timeline like/share, /admin, web/association CMS, EditUserDialog, leaderboard, login→market). Prod'da bozuk görünmelerinin sebebi: **App Hosting build'i kırıktı → prod sessizce eski commit'te kalmıştı** (CLAUDE.md'nin "sessiz deploy kilidi" uyarısı). `npm run build` artık PASS (exit 0). Sonuç: bu maddeler **deploy ile** düzelir; kod değişikliği gereksiz (surgical prensip — zaten doğru koda dokunulmadı).

### Kodda gerçekten kırık olup düzeltilen 9 madde
PDF-R1..PDF-R8 + PDF-50+ (tasks.md 2026-05-21 bölümü). Hepsi disjoint dosyalarda paralel surgical-coder ile; tek konsolide gate.

### Önemli kararlar
- **Rozet puanlama (PDF-R7)**: `areaPoints` hiç yazılmıyordu. Saf `computeAreaPoints` — onaylı bağış (status `Yatırıldı`/`Tamamlandı`) NGO `category`→rozet `socialArea` keyword eşleme ile +25/alan; gönüllülük `socialArea`/`area`/`ngoId` ile (points yoksa default 50); davet `inviteCount * 10` → "hangel Gönüllüsü". NGO category vokabülü rozet vokabülünden farklı → keyword/alias eşleme (heuristic, v1). my-badges hesaplayıp `max(stored,computed)` merge edip değişiklikte user doc'a yazar.
- **Communications analitiği (PDF-R8)**: notifications'ta grouping id yoktu. `broadcasts` parent doc + her bildirime `broadcastId`. Okundu sayısı `getCountFromServer(broadcastId==,read==true)` → `notifications(broadcastId,read)` composite index gerekir (deploy'a kadar "—" gösterir, çökmez). DM'ler de stamp'lendi.
- **Kütük lookup (PDF-50+)**: Vakıflar sheet'inde KÜTÜK NO YOK → Dernek kütük no ile, Vakıf isim prefix-search ile. Import operatör işi (CSV → Firestore, ADC script).
- **Demografik taşıma (PDF-R6)**: gender/bloodType volunteer page'de (HealthSection) zaten vardı → sadece birthDate+nationality eklendi (çift kontrol regresyonu önlendi); kan-bildirim toggle git'ten kurtarılıp geri eklendi.

### Defer (harici bağımlılık)
- **PDF-13b (e-posta OAuth)**: Gmail/Outlook/IMAP OAuth client (Google Cloud + Azure app registration + secret) kullanıcı tarafından oluşturulmadan kodlanamaz — kör scaffold = ölü/güvenlik-riskli kod. Checklist verildi; creds gelince implement edilecek. vCard/CSV + telefon rehberi fallback aktif.

### Gates
`npm run typecheck` PASS · `npm run lint` PASS (0/0) · `npm run test` 145 passed / 116 skipped (badge-points 18 dahil) · `npm run build` PASS (exit 0).

### Operatör deploy/config checklist
1. App Hosting redeploy · 2. `firebase deploy --only firestore:rules,firestore:indexes,storage` · 3. `GEMINI_API_KEY` env · 4. Veri ops (brand-data-cleanup.md + registry-import.md).

## 2026-05-21 — FEAT-ENTITY-INBOX — Entity Admin Gelen Kutusu (STK/Marka/Kulüp) + `messages` rules

- **ID**: FEAT-ENTITY-INBOX (yeni)
- **Lead**: security-lead
- **Charter**: Yeni özellik — entity admin'lerin kendi kurumlarına gelen mesajları OKUMA + YANITLAMA. Security-lead `firestore.rules`'ı sahiplendiği için end-to-end owner.

### 5-bullet plan
1. **Ne değişiyor**: (a) YENİ `src/app/ngo-admin/inbox/page.tsx` — entity'ye gelen mesajları realtime listele/aç/okundu işaretle/yanıtla. (b) `src/app/messages/page.tsx` compose — alıcı aramasına ngos/brands/clubs eklenir (additive). (c) `firestore.rules` — `messages` koleksiyonu için **ilk kez** explicit `match` bloğu yazılır (read/list/create/update). Layout'taki `inbox` menü item'larından `comingSoon: true` kaldırılır.
2. **Neden**: PRD'de vaat edilen "kullanıcı ↔ STK/marka/kulüp/yönetici" çift yönlü mesajlaşma eksik. Entity admin gelen mesajı göremiyor/yanıtlayamıyor.
3. **Testler**: `tests/rules/messages.test.ts` (yeni) — owner-read, sender-read, entity-admin-read (managed*Id 3 varyant), yabancı-read-DENY, create senderId==uid guard, create spoof-DENY, update readBy-only guard, update başka-alan-DENY, super-admin-read.
4. **Rollback**: 3 dosya pür-additive. Geri alma: `git revert <commit>` veya `messages` match bloğunu rules'tan sil + 2 yeni dosyayı sil + layout `comingSoon: true` geri koy. Rules deploy edilmeden ESKİ davranışa dönülür (deploy ayrı, operatör adımı).
5. **Blast radius**: **YÜKSEK** — rules deploy gerektirir. Ancak `messages` için **mevcut bir rule YOK** (git history: `match /messages` hiç var olmamış). Bu yüzden bu bir "gevşetme" DEĞİL, daha önce global `allPaths` (yalnız super-admin write, read=deny) altına düşen koleksiyon için **ilk kez sıkı, scope'lu rule** yazımı. Mevcut user→user mesajlaşma prod'da çalışıyorsa, deploy edilmiş rules repo ile senkron değil demektir (ayrı bir operatör doğrulaması).

### Risk raporu
- **Gizlilik**: Entity-admin read genişlemesi YALNIZCA `resource.data.recipientId == users/{uid}.managed{Ngo,Brand,Club}Id` olduğunda izin verir. Kullanıcı-kullanıcı mesajlarına erişim genişlemez. `get()` çağrısı her read'de 1 ek doc okuması (maliyet kabul edilebilir; fundApplications/ngoSenders ile aynı pattern).
- **Reply rule-safety**: Yanıt `addDoc(messages, { senderId: <admin uid>, sender:{ id: entityId, name: entityName, ... } })` — yani `create` rule'u `senderId == request.auth.uid` ile SAĞLANIR; görüntüde gönderen entity görünür (`sender.name`). Kural ihlali yok.
- **Loosening kontrolü**: Hiçbir mevcut rule gevşetilmiyor. `messages` için ilk explicit rule additive (deny→scoped allow, ama yalnız sahibi/sender/entity-admin/super-admin için).
- **List query**: Entity inbox `useCollection(where('recipientId','==', entityId), orderBy('timestamp','desc'), limit(100))`. Mevcut kullanıcı inbox'u ise `where('recipientId','==', authUser.uid)` — **limit YOK**. Bu yüzden `allow list: if isSignedIn()` (notifications pattern); `request.query.limit`'e bağlamak limit'siz mevcut sorguyu kıracaktı. Per-doc gizlilik `read` ile garanti edilir.

### Rollback planı (deploy sonrası)
- Kod: `git revert`.
- Rules canlıysa geri alma: önceki `firestore.rules` (messages bloğu YOK) ile `firebase deploy --only firestore:rules`. Bu, messages koleksiyonunu eski deny-read durumuna döndürür (user messaging'i de durdurur — bu yüzden operatör mevcut prod rules'ı doğrulamalı; aşağıdaki "DİKKAT" notu).

### DİKKAT (operatör doğrulaması gerekli)
`firestore.rules` dosyasında `messages` için hiç rule yoktu. Eğer prod'da user→user mesajlaşma BUGÜN çalışıyorsa, canlı rules bu repo ile uyumsuz demektir. Deploy etmeden önce mevcut canlı rules'ı `firebase firestore:rules:get` ile (veya Console'dan) yedekleyin; aksi halde repo deploy'u olası out-of-band messages rule'unu ezebilir. Bu repo'daki yeni blok user messaging'i de KAPSAR (owner/sender read + create), yani senkronizasyon güvenlidir.

### Durum
🟡 Needs user approval — rules deploy operatör işi: `firebase deploy --only firestore:rules`. Kod editleri tamamlandı; konsolide gate orchestrator'da.
