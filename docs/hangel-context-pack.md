# hangel — Bağlam Paketi (AI Context Pack)

> Bu dosyayı Claude ve ChatGPT'ye **kalıcı bağlam** olarak ver (yöntemler en altta).
> Amaç: her sohbette hangel'i baştan anlatmamak. Burada **sır yok** (API anahtarı,
> şifre, token YAZILMAZ — onlar dış servise gönderilmemeli).
> Son güncelleme: 2026-06-11.

---

## 1) Tek cümle
hangel; **STK'lar, markalar, öğrenci kulüpleri ve kullanıcıları** tek çatıda buluşturan,
**bağış-destekli sosyal ticaret + gönüllülük + sosyal etki** platformudur. Slogan
mantığı: *"bir kere kaydol, her yerde fayda — her etkileşim bir iyiliğe gitsin."*

Marka adı her zaman **küçük harf**: "hangel" (teknik tanımlayıcılar — sınıf/target — büyük kalabilir).

## 2) Vizyon & iş modeli
- Kullanıcılar markalardan alışveriş yapar → hangel affiliate komisyonu kazanır → bir
  kısmı STK'lara **bağış** olur. ("bağış-destekli Cimri" + sosyal etki.)
- STK'lar: bağış toplar, gönüllü yönetir, şeffaflık/etki raporlar, kendi web sitesini alır.
- Markalar: hem **marka** hem **ürün** bazlı listelenir (ürün feed kütüphanesi).
- Öğrenci kulüpleri: etkinlik/üyelik/içerik.
- Acil durum: **kan bağışı** ve afet çağrıları (eşleştirme + bildirim + Live Activity).
- Gönüllülük: ilan → başvuru → onay → tamamlama → sertifika + etki puanı.

## 3) Çekirdek varlıklar & roller
- **User** (kullanıcı): profil, etki puanı (impactScore), rozet (badge), sertifika, bağış/gönüllülük geçmişi.
- **NGO / STK**: `ngos` koleksiyonu. Yöneticisi `ngo-admin`.
- **Brand / Marka**: `brands` koleksiyonu. Yöneticisi `brand-admin`. `listingMode: 'brand'|'product'|'both'`.
- **Club / Öğrenci Kulübü**: `clubs` koleksiyonu. Yöneticisi `club-admin`.
- **Roller**: `super-admin`, `ngo-admin`, `brand-admin`, `club-admin`, `user`.
  Süper-admin yetkileri `superAdminPermissions` ile granular olabilir.

## 4) Kullanıcıya dönük modüller (rotalar)
Market (affiliate alışveriş) ve **/market/products** (ürün listeleme) · **/products/[id]** ·
bağış (**/my-donations**) · gönüllülük (**/volunteering**, **/my-applications**) ·
acil/kan (**/emergency**, **/blood**) · mesajlar (**/messages**) · bildirimler (**/notifications**) ·
profil (**/profile**, **/u/[id]**) · rozetler (**/my-badges**) · liderlik (**/leaderboard**) ·
etkinlikler (**/events**) · kütüphane/içerik (**/library**, **/posts**, **/stories**, **/press**) ·
davet (**/invite**, **/invite-from-contacts**) · arama (**/search**) · STK/marka/kulüp vitrinleri
(**/ngos**, **/clubs**, **/brand**) · kampüs avantajları, imece, sosyal girişimcilik, passport, QR ödeme.
Onboarding akışları: **/onboarding**, **/ngo-onboarding**, **/login**, **/welcome**.

## 5) STK Yönetim Paneli (`/ngo-admin/*`)
dashboard · donations (bağış) · volunteer / volunteering / volunteer-completions / volunteer-portal ·
opportunities (ilanlar) · events · posts · messaging / messaging-packages / sms / mail / dm / inbox ·
crm · demographics · analytics-tools · reports · transparency · sustainability · impact-story ·
funds · accounting · payment-systems · brand-earnings · ecommerce · ads (reklam) · marketing ·
community-invite · university-volunteering · field-team · hr-integration · online-meeting ·
virtual-office / virtual-pbx · website (STK kendi sitesi) · manage-profile · users · settings · qr.

## 6) Süper Admin Paneli (`/super-admin/*`)
users · ngos · brands · clubs · applications (başvurular) · **feed** (Ürün Feed & Listeleme) ·
donations · volunteer · events · posts · emergency · hospitals (hastane DB) · messaging / messaging-quota ·
communications · inbox · support · feedback · surveys · ads / ngo-ads · analytics · ai-management ·
data-enrichment · outreach · public-relations · contracts (sözleşmeler/KVKK) · pages · web-content ·
association-content · library · transparency · funds · demographics · activity (giriş/çıkış) ·
set-superadmin · maintenance · setup · help · settings.

## 7) Backend işleri (Cloud Functions — `functions/src`)
blood-match (kan eşleştirme) · disaster-geofence (afet coğrafi) · email-digest · sms-reminder ·
twilio (SMS/çağrı) · live-activity (iOS Live Activity APNs) · volunteer-cron · onNotificationCreated (push).

## 8) Teknoloji yığını & mimari
- **Web:** Next.js 15 (App Router, SSR) + React + TypeScript + Tailwind + shadcn/ui (Radix).
  Hata formatı: API route'lar `{ errorCode, message }` döner; raw error sızdırılmaz.
- **Backend/altyapı:** Firebase — Auth, Firestore, **App Hosting** (web prod), Cloud Functions,
  Cloud Messaging (FCM push), Crashlytics. Admin SDK ile sunucu tarafı (rules bypass) işlemler.
- **Mobil:** **Capacitor** — iOS + Android. App, **uzaktan `https://hangel.org`'yi yükleyen**
  bir WebView wrapper'ı (server.url). Bu yüzden **web deploy = mobil app'e anında yansır**
  (JS/route değişiklikleri app rebuild gerektirmez; sadece native config/plugin değişiklikleri rebuild ister).
  Native eklentiler: messaging, crashlytics, contacts, geolocation, keyboard, splash, statusbar, share, NFC.
- **iOS ekstra:** Apple Watch, App Clip, Live Activity (Dynamic Island), Universal Links, SIWA.
- **Ödeme:** N-Kolay (POS). **E-posta:** Resend. **AI:** Genkit (@genkit-ai).
- **CI/CD:** GitHub (`hangelapp/new-app`) → main push → App Hosting otomatik build (web).
  Mobil: **Codemagic** (manuel tetik) → iOS TestFlight / Android Play (AAB).

## 9) Platformlar & yayın
- **Web:** https://hangel.org (App Hosting). Ayrıca STK'lara `*.hangel.org` alt alan (Cloudflare for SaaS).
- **iOS:** App Store (Team `NKZNY8NU8S`), bundle `com.hangel.ios.app`. TestFlight.
- **Android:** Google Play, paket `com.hangel.app`. Üretimde.
- **Chrome Extension:** wrapper + Web Store listing (planlı).

## 10) Önemli entegrasyonlar
- **Affiliate ağları:** GelirOrtakları (Publicis GO — **ürün feed API'si var**: `feed.gelirortaklari.com`),
  Affocean, ReklamAction (HasOffers/Tune — sadece offer/marka, ürün feed yok).
- **Ürün feed platformu (PIM, kendi kütüphanemiz):** `src/lib/feed/` — kanonik ürün şeması +
  giriş adaptörleri (gelirortaklari, generic Google Merchant XML → ikas/ideasoft/tsoft) +
  export (Google Merchant/Cimri/Akakçe). Ingest: `/api/feed/ingest`. Koleksiyon: `products`.
- **Reklam:** Google Ads / Meta Ads / TikTok Ads (Faz 1 kod hazır, credential/onay bekliyor).
- **SMS/Mail kota sistemi** (havuz + N-Kolay POS).

## 11) Altyapı & hesaplar (sır YOK — sadece referans)
- Firebase projesi: `hangel-new-v18-87297865-9bcc3`.
- GitHub: `github.com/hangelapp/new-app` (branch: main).
- Domain: hangel.org (mobil app buradan yüklenir).
- > Not: Bazı hesaplar farklı maillerde (ör. Play şu an `ihadiguzel@gmail.com`); hepsini
  `ismailhilmi@hangel.org` altında toplama hedefi var.

## 12) Kod & çalışma standartları (özet)
- Cerrahi edit; gereksiz refactor/abstraction yok. Yeni `as any` / `@ts-ignore` / `console.log` (prod) yok.
- Türkçe metin korunur; kullanıcıya görünen her yerde "hangel" küçük harf. 🙏 emoji **asla** (yerine 🧡).
- Gate'ler: `npm run typecheck` (hızlı), `npm run build` (prod — dynamic route handler/tip değişiminde zorunlu),
  `firestore.rules` değişiminde dikkat. Deploy: web otomatik (main push), mobil Codemagic.
- Repo'da Claude Code için ayrıca **`CLAUDE.md`** (ajan orkestrasyon playbook'u) var.

## 13) Güncel durum & yol haritası (2026-06)
- ✅ Web/iOS/Android canlı. Ürün feed platformu Faz 1-5 omurgası canlı (Market ürün UI, generic
  adaptör, export, arama soyutlaması). GelirOrtakları Go Feed çalışıyor.
- 🟡 Devam: ikas/ideasoft/tsoft ortaklıkları (marka self-onboarding feed URL), gerçek arama index
  (Algolia/Typesense), scheduled feed senkronu (Cloud Function), reklam credential onayları,
  Critical Alerts (Apple), Chrome Web Store, hesap konsolidasyonu.

## 14) Bu dosyayı AI'lara nasıl kalıcı yüklerim
- **Claude (claude.ai):** Bir **Project** oluştur → "Project knowledge"a bu dosyayı yükle → o projedeki
  tüm sohbetler bunu görür. Ek olarak hesap "Custom Instructions"a kısa bir özet koyabilirsin.
- **Claude Code (terminal/IDE):** Zaten repo kökündeki **`CLAUDE.md`** otomatik yükleniyor; bu paketi
  oraya link/özet olarak ekleyebilirsin.
- **ChatGPT:** Bir **Project** aç → proje dosyalarına bu .md'yi ekle + proje "Instructions"a özet yaz.
  Alternatif: bir **Custom GPT** ("hangel Asistanı") oluştur → bu dosyayı "Knowledge" olarak yükle.
  Hesap genelinde: **Settings → Personalization → Custom Instructions**'a kısa özet.
- **Güncel tut:** Büyük değişikliklerde bu dosyayı güncelle ve araçlara yeniden yükle (knowledge dosyaları statiktir).

## 15) Güvenlik notu
Bu dosyada **bilinçli olarak sır yok**. API anahtarı, panel şifresi, OAuth token, servis hesabı
JSON'u vb. **asla** AI sohbetine/knowledge'ına koyma — dış servise gider, geri alınamaz. Sır gerekiyorsa
"bir X API anahtarı var" diye **tarif et**, değerini paylaşma.
