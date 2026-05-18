# Hangel — Birleştirilmiş Audit Bulguları
**Tarih:** 2026-05-18 | **Yöntem:** 6 paralel uzman ajan + ana orchestrator doğrulaması | **Kapsam:** read-only

## 1. Proje özeti
Hangel — Türkiye merkezli sivil etki platformu. Personalar: STK, dernek, kulüp, marka, gönüllü, bağışçı, süper-admin. Ana akışlar: timeline, market (alışveriş + affiliate bağışı), gönüllülük (imece), etkinlikler, acil durum, library (AI destekli), QR ile bağış/ödeme, profil + impact story + rozet, admin panelleri.

## 2. Tech stack
- Next.js 15.5.9 (App Router) + React 19.2.1 + TypeScript strict
- Tailwind 3, Radix UI, lucide-react
- Firebase (Auth, Firestore, Storage, App Hosting) + Firebase Admin SDK 13
- Genkit 1.20 + Gemini 1.5 Flash (5 flow)
- Mesajlaşma: Resend, Netgsm, Meta WhatsApp Cloud API
- Ödeme: N-Kolay (yarı entegre, "prod öncesi doğrula" notu)
- Mobil: Capacitor 8 (iOS + Android), `webDir: 'out'`, prod fallback `hangel.org.tr`
- Test: Vitest 4 + Firebase emulator (yalnızca rules için)
- Build/Deploy: Firebase App Hosting (`us-central1`, `maxInstances: 1`), manuel rules deploy

## 3. Modüller ve dizinler
- `/src/app` (~70 rota): public marketing, dashboard, admin (admin / ngo-admin / super-admin), auth, payment/qr-payment, market, events, volunteering, messages, notifications, profile, settings, onboarding
- `/src/components`: ui, layout, shared, providers, events
- `/src/lib`: contracts (1059 satır), messaging alt sistemi, payment, invoice (stub), neighborhoods (1134 satır), translations, capacitor wrapper
- `/src/firebase`: client provider + use-doc/use-collection + non-blocking auth/updates
- `/src/ai/flows`: impact-story, marketplace-assistant, marketplace-product-description, library-assistant, project-writer
- `/src/app/api`: 27 route

## 4. KRİTİK bulgular (P0)

### P0-1 — Firebase service account git geçmişinde
`.firebase-service-account.json` bugün `.gitignore`'da ve `git ls-files` görmüyor; **ama `git log --all`** 2 commit'te dosyayı listeliyor (`1f040fc`, `9bc31a6`). Diskteki kopyada gerçek RSA private key var. Anahtar **ifşa olmuş kabul edilmeli**.

### P0-2 — Hardcoded super-admin e-postası
`firestore.rules:12` ve `src/lib/messaging/server-auth.ts:11`'de `ismailhilmi@hangel.org` literal olarak gömülü. Bu hesap kompromize olursa tüm Firestore admin olur.

### P0-3 — `/api/proxy` açık SSRF/open-proxy
Auth yok, host whitelist yok, header'ları forward ediyor. Internal Firebase/N-Kolay endpoint'lerine veya cloud metadata'ya erişim için kullanılabilir.

### P0-4 — `/api/admin/import-data` client SDK kullanıyor
Admin SDK yerine Firebase client SDK ile yazıyor → Firestore rules üzerinden geçiyor. Rules zayıflarsa kimliksiz kullanıcı yazabilir. Header secret'ı zayıf, rate limit yok.

### P0-5 — Süper-admin layout'ta client-side rol kontrolü yok
`/super-admin/*` URL'lerini ziyaret eden herhangi bir kullanıcı UI iskeletini ve endpoint isimlerini görür. API'ler reddeder ama enumeration sağlar.

### P0-6 — CI vitest çalıştırmıyor
Rules testleri yazılmış (`/tests/rules`, 4 dosya) ama `.github/workflows/ci.yml` `npm run test` çağırmıyor. 27 API route'un 0 testi var.

## 5. P1 — Ana akış / gizlilik etkileri
1. `/api/auth/check-email` rate-limit yok → e-posta enumeration
2. Resend/Netgsm webhook'larında HMAC veya timestamp doğrulaması zayıf/yok
3. Webhook replay protection yok
4. `storage.rules` — `transparency/{userId}/*` herkese açık okuma (KVKK PII riski)
5. Hiçbir rotada `error.tsx` yok — fatal hata tüm sayfayı çökertir
6. `dangerouslySetInnerHTML` CMS içeriklerinde sanitize edilmeden (`logo-usage`, `library/[slug]`)
7. 15+ yerde `target="_blank"` + `rel="noopener noreferrer"` eksik
8. AI flow'larında prompt injection yüzeyi (user input direkt prompt'a interpolasyon)
9. AI flow'larında per-user quota yok → maliyet patlaması
10. Dashboard empty state'leri eksik (my-applications, my-donations, my-badges, messages, notifications)
11. `profile/page.tsx`: badge/sertifika/geçmiş gönüllülük dizileri hardcoded boş, Firestore'dan çekilmiyor

## 6. P2 — UX/quality
- Test kapsamı: 0% uygulama kodu, 4 rules test dosyası (660 LoC)
- 51% dosya `'use client'` (219/429) — birçoğu marketing sayfası
- `images.unoptimized: true` — LCP penalty
- Lucide `import * as Icons` 11 dosyada — bundle bloat
- Lighthouse CI yok
- i18n kısmen kablolu: 7 dil tanımlı, 50+ sayfada string'ler hardcoded TR
- Form validasyonu: zod kullanımı zayıf, `disabled-during-submit` tutarsız
- Tıklanabilir `<div>`'ler `role="button"` + `tabIndex` olmadan
- Primary renk `#f34723` + beyaz → WCAG AA kontrast şüpheli
- ~160 icon-only buton `aria-label` eksiği (README'de not edilmiş)
- God-page'ler: `super-admin/brands` (1337), `super-admin/users` (1283), `login/selection` (1174), `ngo-admin/website` (1084), `settings/volunteer` (1061)

## 7. P3 — Teknik borç / hijyen
- 83+ yerde Firestore koleksiyon isimleri string literal — merkezi sabit yok
- 18 TODO/FIXME (library AI, affiliate webhook, NGO volume, e-Arşiv, vs.)
- 10 `@ts-ignore`/`as any` (çoğu Capacitor/Leaflet/AutoTranslate)
- `lib/api-clients.ts` (216 satır) — farklı domain'leri tek dosyada
- Repo kökünde orphan dosya: `[Provide the ABSOLUTE, FULL path to the file being modified]`
- `.worktrees/affiliate-direct` — 2 ay önce aktivite, durumu belirsiz
- Poppins fontu 6 weight yüklü, 3-4 yeterli
- `maxInstances: 1` — auto-scale yok
- 27 transitive npm güvenlik açığı (Genkit/OpenTelemetry zinciri)
- 11 env var `.env.example`'da eksik (META_WA_*, NKOLAY_*, WHATSAPP_DRIVER, PAYMENT_DRIVER)

## 8. Eksik özellikler (ürün vaadi vs kod)
1. Gerçek zamanlı bildirimler + FCM push (UI var, push delivery yok)
2. Akıllı gönüllü eşleştirme (imece çekirdek vaadi — landing var, algoritma yok)
3. N-Kolay ödeme + e-Arşiv fatura (kod var ama "prod öncesi doğrula"; fatura stub)
4. Çok adımlı NGO onboarding (tek sayfa form)
5. NGO için kampanya gönderim UI'ı (backend hazır, admin paneli stub)
6. Affiliate webhook doğrulama (markaların satış doğrulaması bağlanmamış)
7. Mesajlaşmada okundu/yazıyor/ek dosya
8. Etkinlik yönetimi (RSVP, kapasite)
9. Analytics tüketimi (form var, GA/GTM tag'leri çalışmıyor)
10. Acil durum/afet bildirim modülü (form var, backend bağlı değil)
11. QR kart aktivasyonu (form var, handler yok)
12. Sertifika oluşturma + impact certificates (yer tutucu)

## 9. Pozitif noktalar
- TypeScript strict + 0-error baseline CI'da enforced
- WhatsApp webhook'unda HMAC SHA256 timing-safe doğrulama
- N-Kolay callback'inde idempotency check + amount cross-check var
- Messaging alt sistemi (queue, worker, resolver, wallet, audit, consent, unsubscribe) modüler ve cost-tracked
- Firestore rules genel olarak owner/role tabanlı (hardcoded e-posta hariç)
- `non-blocking-login` / `non-blocking-updates` pattern auth state için reaktif
- 79 `loading.tsx` — loading state coverage iyi
- Capacitor temel plugin'leri (browser, contacts) çalışıyor

## 10. Dosya istatistikleri
- Toplam `.ts/.tsx`: 429
- 'use client' kullanan: 219 (51%)
- Test dosyaları: 4 (660 LoC, hepsi rules)
- 27 API route, 1 server action, 5 Genkit flow
- En büyük 5 dosya: `super-admin/brands` (1337), `super-admin/users` (1283), `login/selection` (1174), `neighborhoods-data` (1134), `contracts.ts` (1059)
