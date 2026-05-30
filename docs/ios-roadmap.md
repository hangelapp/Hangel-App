# Hangel iOS Yol Haritası — Freelancer Brief

**Hedef kitle:** Bu belgenin alıcısı, Hangel iOS uygulamasının Apple ekosistem entegrasyonunu yapacak kıdemli iOS geliştirici(ler)dir. Belge "açıp uygulayabilecek" detayda yazılmıştır; yorum/karar bekleyen yerler `❓ KARAR` etiketiyle işaretlidir, bunlar Hangel ürün ekibiyle netleştirilmelidir.

**Son güncelleme:** 2026-05-30
**Hazırlayan:** Hangel ürün ekibi (Claude Code asistanı ile)
**App Store URL:** https://apps.apple.com/tr/app/hangel-app/id6664058822
**Apple Team ID:** `NKZNY8NU8S`
**Mevcut Bundle ID:** `com.hangel.ios.app`
**Backend:** Firebase App Hosting backend `studio` (proje `hangel-new-v18-87297865-9bcc3`)

---

## İçindekiler

0. [Yönetici özeti](#0-yönetici-özeti)
1. [Bağlam ve mimari kararı](#1-bağlam-ve-mimari-kararı)
2. [Mevcut durum envanteri](#2-mevcut-durum-envanteri)
3. [Apple Developer önkoşulları](#3-apple-developer-önkoşulları)
4. [Mac / build altyapısı](#4-mac--build-altyapısı)
5. [Faz 0 — Submission temeli (ZORUNLU)](#5-faz-0--submission-temeli-zorunlu)
6. [Faz 1 — Apple core](#6-faz-1--apple-core)
7. [Faz 2 — Erişim genişletme](#7-faz-2--erişim-genişletme)
8. [Faz 3 — Web tarafı](#8-faz-3--web-tarafı)
9. [Faz 4 — Cihaz genişletme](#9-faz-4--cihaz-genişletme)
10. [Genel teknik standartlar](#10-genel-teknik-standartlar)
11. [Done definition + teslim](#11-done-definition--teslim)
12. [Apple Review kontrol listesi](#12-apple-review-kontrol-listesi)
13. [Bilinen riskler](#13-bilinen-riskler)
14. [Backend Firestore schema değişiklikleri](#14-backend-firestore-schema-değişiklikleri)
15. [İletişim ve raporlama](#15-iletişim-ve-raporlama)

---

## 0. Yönetici özeti

Hangel (hangel.org.tr), Türkiye'nin sosyal etki marketplace'idir — STK, marka, öğrenci kulübü ve bireysel gönüllüleri buluşturur. Mevcut iOS uygulaması **Capacitor + WebView** hibrit yapıda çalışır, `https://hangel.org.tr` web sitesini sarmalar. App Store'da `id6664058822` ile yayındadır.

Bu yol haritası, Apple ekosistem özelliklerinin entegrasyonunu **5 faz** halinde tarif eder:

| Faz | İçerik | Tahmini süre (1 kıdemli iOS dev) | Apple Review etkisi |
|-----|--------|----------------------------------|---------------------|
| **0** | Submission temeli: Sign in with Apple, Privacy Manifest, Push (FCM), Geolocation, Universal Links, ATT, Crashlytics | 25-35 gün | 1 IPA submission |
| **1** | Apple core: Live Activities + Dynamic Island, Apple Wallet biletler, Home Screen Widgets, Akıllı Check-in | 35-45 gün | 1 IPA submission |
| **2** | Erişim genişletme: App Clip, NFC etiketleri, Siri Shortcuts, Spotlight | 25-35 gün | 1 IPA + App Clip submission |
| **3** | Web tarafı: Sosyal Etki Pasaportu, Gönüllü Kariyer Karnesi, Impact Replay, Mikro Gönüllülük | 30-40 gün | Apple Review yok (web) |
| **4** | Cihaz genişletme: Apple Watch app, iPad + Mac | 20-30 gün | 1 IPA + Watch submission |

**Toplam:** 135-185 gün ≈ 6-9 ay full-time tek dev. İki paralel dev (iOS native + web/backend) → 4-5 ay.

**Bütçe tahmini (Türkiye 2026):**
- Kıdemli iOS Native dev: $25-35K
- Fullstack Web/Firebase dev: $15-22K
- Toplam: ~**$40-55K** (~₺1.4M-₺2M)

---

## 1. Bağlam ve mimari kararı

### 1.1. Mevcut yapı

```
hangel.org.tr (Next.js 15.5 + React 19, Firebase App Hosting)
        ↑ HTTPS
        │
[iOS Capacitor App] ── server.url = hangel.org.tr ──┐
        │                                            │
        ├── WKWebView (Hangel web app)              │
        ├── @capacitor/app, browser, contacts,      │
        │   filesystem, keyboard, share, splash,    │
        │   status-bar (zaten yüklü)                 │
        └── (Native plugin'ler eksik)                │
                                                    ↓
                                          Firebase (Auth, Firestore,
                                          Storage, FCM, Functions)
```

### 1.2. Mimari karar: **Hibrit (Capacitor WebView + Native Extension Target'lar)**

Aşağıdaki Apple özellikleri WebView'dan çalıştırılamaz — **native Swift kod ZORUNLU**:

- Live Activities + Dynamic Island (ActivityKit)
- Home Screen Widgets (WidgetKit)
- App Clip (bağımsız target)
- Watch app (bağımsız target)
- Apple Wallet (PassKit native presenter)
- Siri Shortcuts (AppIntents)
- Spotlight (CoreSpotlight)
- NFC (CoreNFC)

**Mimari:**

1. **Mevcut Capacitor WebView container'ı koru** — hangel.org.tr'deki tüm sayfalar app içinde çalışmaya devam eder.
2. **Xcode projesine yeni Extension Target'lar ekle:**
   - Widget Extension (`HangelWidgets`)
   - Live Activity Extension (`HangelLiveActivities`)
   - App Clip Target (`HangelClip`) — bağımsız SwiftUI mini-app
   - Watch App Target (`HangelWatch`)
3. **Custom Capacitor Plugin'ler yaz** (Swift) — WebView'dan native API'ye köprü:
   - `HangelLiveActivityPlugin` (start/update/end activity)
   - `HangelWalletPlugin` (Wallet pass present)
   - `HangelSiriPlugin` (intent donation, getYearlyShortcuts)
   - `HangelSpotlightPlugin` (index/deindex items)
   - `HangelNfcPlugin` (read/write NDEF)
   - `HangelCheckinPlugin` (geofence, region monitoring, auto-checkout)
4. **App Group oluştur** (`group.com.hangel.app.shared`) — Widget + Live Activity + App Clip + Main App data sharing için.

### 1.3. Web kod NE KADAR değişir?

| Tip | Web değişikliği | Açıklama |
|-----|------------------|----------|
| Web-only feature (Faz 3) | Yeni Next.js sayfaları | Standart React/Tailwind |
| Native trigger gerektiren | Mevcut sayfaya 5-15 satır | `Capacitor.Plugins.Hangel...` çağrısı |
| Native UI | Web tarafı sıfır | Tamamen Swift |

---

## 2. Mevcut durum envanteri

### 2.1. Capacitor plugin'leri (`package.json`)

```json
{
  "@capacitor-community/contacts": "^7.1.0",
  "@capacitor/android": "^8.3.0",
  "@capacitor/app": "^8.1.0",
  "@capacitor/browser": "^8.0.3",
  "@capacitor/cli": "^8.3.0",
  "@capacitor/core": "^8.3.0",
  "@capacitor/filesystem": "^8.1.2",
  "@capacitor/ios": "^8.3.0",
  "@capacitor/keyboard": "^8.0.2",
  "@capacitor/share": "^8.0.1",
  "@capacitor/splash-screen": "^8.0.1",
  "@capacitor/status-bar": "^8.0.2"
}
```

**Bu brief kapsamında eklenecek paketler:**

```bash
npm install \
  @capacitor-firebase/messaging \
  @capacitor/geolocation \
  @capawesome-team/capacitor-nfc \
  @capacitor/local-notifications \
  @capacitor/haptics \
  @capacitor/badge \
  @capacitor/preferences \
  @capacitor/device \
  @capacitor/network
```

### 2.2. `capacitor.config.ts` (mevcut)

```ts
{
  appId: 'com.hangel.app',
  appName: 'Hangel',
  webDir: 'out',
  server: {
    url: 'https://hangel.org.tr',
    cleartext: false,
  },
  ios: {
    contentInset: 'never',
    preferredContentMode: 'mobile',
    scrollEnabled: true,
  },
  // ... (splash, keyboard, status-bar configs)
}
```

**⚠️ NOT:** `appId` (`com.hangel.app`) Android için, iOS için Xcode'daki `PRODUCT_BUNDLE_IDENTIFIER` = `com.hangel.ios.app`. Bu farklılık bilinçli, korunacak.

### 2.3. Info.plist (mevcut usage descriptions)

```xml
<key>NSContactsUsageDescription</key>
<string>Rehberinizdeki arkadaşlarınızın hangel'da olup olmadığını görmek ve onları davet etmek için kişilere erişim gerekmektedir.</string>

<key>NSLocationWhenInUseUsageDescription</key>
<string>Yakınınızdaki etkinlikleri, STK'ları ve gönüllü ihtiyaçlarını gösterebilmek için konum bilginize ihtiyaç var.</string>

<key>NSCameraUsageDescription</key>
<string>Profil fotoğrafı çekmek ve etkinlik / proje görselleri paylaşmak için kameraya erişim gerekiyor.</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>Profil fotoğrafı yüklemek ve etkinlik / proje görselleri paylaşmak için galerinize erişim gerekiyor.</string>

<key>NSPhotoLibraryAddUsageDescription</key>
<string>Sertifikalarınızı ve hangel görsellerini galerinize kaydetmek için izin gerekiyor.</string>

<key>NSUserNotificationUsageDescription</key>
<string>(Bu key yanlış — silinecek. Push için Info.plist key gerekmez, capability yeter.)</string>
```

### 2.4. Firebase entegrasyonu (mevcut)

- `users/{uid}/fcmTokens/{token}` koleksiyonu — web push token'ları zaten yazılıyor (`src/lib/fcm.ts`)
- `src/lib/push-notifications.ts` — server-side `sendPushToUser` zaten APNs + Android + Web multicast yapıyor
- `public/firebase-messaging-sw.js` — web service worker hazır
- `GoogleService-Info.plist` — iOS Firebase config dosyası `ios/App/App/Resources/GoogleService-Info.plist` mevcut ✅

### 2.5. Yapılması gereken Firebase Console ayarları

- **APNs Auth Key (.p8)** Firebase Console → Project Settings → Cloud Messaging → Apple app configuration'a yüklenecek (Faz 0)
- **Sign in with Apple** Firebase Authentication → Sign-in method → Apple provider'ını enable et (Faz 0)
- **Crashlytics** Firebase Console'da iOS app için aktif edilecek (Faz 0)

---

## 3. Apple Developer önkoşulları

### 3.1. Bundle ID'ler (oluşturulacaklar)

| Bundle ID | Amaç | Faz |
|-----------|------|-----|
| `com.hangel.ios.app` | Ana app (mevcut ✅) | — |
| `com.hangel.ios.app.Widgets` | Widget Extension | 1 |
| `com.hangel.ios.app.LiveActivity` | Live Activity Extension | 1 |
| `com.hangel.ios.app.Clip` | App Clip | 2 |
| `com.hangel.ios.app.watchkitapp` | Watch App | 4 |
| `pass.com.hangel.ios.app` | PassKit Pass Type ID | 1 |

### 3.2. Capability'ler (Xcode → Signing & Capabilities → "+")

Ana app target için aktif edilecekler:

| Capability | Faz | Konfigürasyon |
|------------|-----|---------------|
| Push Notifications | 0 | — |
| Sign in with Apple | 0 | — |
| Associated Domains | 0 | `applinks:hangel.org.tr`<br>`webcredentials:hangel.org.tr` (autofill için) |
| Background Modes | 0 | Remote notifications, Location updates, Background fetch |
| App Groups | 1 | `group.com.hangel.app.shared` |
| Wallet | 1 | Pass Type ID: `pass.com.hangel.ios.app` |
| Near Field Communication Tag Reading | 1 | NDEF + TAG formats |
| App Clips | 2 | — (otomatik App Clip target ile gelir) |
| Siri | 2 | — |
| HealthKit | — | (Gerek yok, atla) |
| iCloud | — | (Gerek yok, atla) |

### 3.3. APNs Auth Key oluşturma (Faz 0 başında)

1. https://developer.apple.com/account → Certificates, Identifiers & Profiles → **Keys**
2. "+" → **Apple Push Notifications service (APNs)** seç → Continue
3. Key Name: `Hangel APNs Auth Key`
4. Configure'a tıkla, **Environment: Sandbox & Production** seç
5. Save → Download .p8 dosyası (**bir kere indirilir, kaybedersen yenisini yapmak gerek**)
6. Key ID ve Team ID'yi not al (Team ID: `NKZNY8NU8S`)
7. **Firebase Console** → Project Settings → Cloud Messaging → iOS app configuration → APNs Authentication Key → "Upload" → .p8 dosyası + Key ID + Team ID

### 3.4. PassKit Pass Type ID oluşturma (Faz 1 başında)

1. https://developer.apple.com/account → Identifiers → "+" → **Pass Type IDs** seç
2. Description: `Hangel Volunteer Event Tickets`
3. Identifier: `pass.com.hangel.ios.app`
4. Register
5. Pass Type ID'ye tıkla → Create Certificate → CSR yükle → indir (`pass.cer`)
6. Keychain'e import et, **private key'le birlikte .p12 olarak export et** (parola koy)
7. Backend'e `pass.p12` + parolayı environment variable olarak ekle:
   - `PASSKIT_CERT_P12_BASE64` (base64-encoded)
   - `PASSKIT_CERT_PASSWORD`

### 3.5. Provisioning Profile'lar

Otomatik yönetim (Xcode → Signing & Capabilities → **Automatically manage signing** ✓) yeterli. Manuel yönetim gerekirse her bundle ID için ayrı profile.

---

## 4. Mac / build altyapısı

**Karar:** Hangel ürün ekibinin Mac'i (MacBook Air 2017, Intel, 8 GB, macOS Monterey 12.7.6) Sonoma'yı desteklemiyor → Xcode 15 native kurulamaz → App Store yeni IPA submission yapılamaz.

**Önerilen çözüm: Cloud Mac CI** (Codemagic)

### 4.1. Codemagic kurulumu (freelancer yapacak)

1. https://codemagic.io üyelik aç (GitHub OAuth ile)
2. Hangel repository'sini bağla
3. `codemagic.yaml` oluştur (bu brief'in repo'suna eklenecek):

```yaml
workflows:
  ios-workflow:
    name: iOS App Store
    instance_type: mac_mini_m2
    max_build_duration: 120
    environment:
      groups:
        - app_store_credentials
      vars:
        XCODE_WORKSPACE: "ios/App/App.xcworkspace"
        XCODE_SCHEME: "App"
        BUNDLE_ID: "com.hangel.ios.app"
        APP_STORE_APPLE_ID: "6664058822"
      node: 20.x
      cocoapods: default
      xcode: latest
    scripts:
      - name: Install dependencies
        script: |
          npm ci
      - name: Build web (Next.js export)
        script: |
          npm run build
      - name: Capacitor sync
        script: |
          npx cap sync ios
      - name: CocoaPods install
        script: |
          cd ios/App && pod install --repo-update
      - name: Set up signing
        script: |
          keychain initialize
          app-store-connect fetch-signing-files "$BUNDLE_ID" --type IOS_APP_STORE --create
          keychain add-certificates
          xcode-project use-profiles
      - name: Bump build number
        script: |
          cd ios/App
          agvtool new-version -all $(($BUILD_NUMBER + 100))
      - name: Build IPA
        script: |
          xcode-project build-ipa \
            --workspace "$XCODE_WORKSPACE" \
            --scheme "$XCODE_SCHEME"
    artifacts:
      - build/ios/ipa/*.ipa
      - /tmp/xcodebuild_logs/*.log
    publishing:
      app_store_connect:
        auth: integration
        submit_to_testflight: true
        beta_groups:
          - Internal Testers
```

4. App Store Connect API Key oluştur:
   - https://appstoreconnect.apple.com → Users and Access → Keys
   - "+" → Name: `Codemagic`, Access: `App Manager`
   - Download .p8 file + Key ID + Issuer ID
5. Codemagic dashboard → Teams → Integrations → App Store Connect → ekle (.p8 + Key ID + Issuer ID)

### 4.2. Maliyet

- Free tier: 500 build dakikası/ay (yaklaşık 20-25 build)
- Pro: $30/ay = sınırsız build dakikası (M2 Mac mini instance)
- Apple Developer Program ücreti: $99/yıl (zaten ödenmiş)

---

## 5. Faz 0 — Submission temeli (ZORUNLU)

**Hedef:** App Store'a tekrar IPA gönderilebilir hale getirmek. Aşağıdakiler olmadan yeni submission **reject** olur.

### 5.1. Sign in with Apple

**Apple Review Guideline 4.8:** Üçüncü taraf SSO (Google) sunan app, Sign in with Apple'ı da sunmak ZORUNDA.

**Apple Framework:** AuthenticationServices

**Capacitor plugin:** `@capacitor-community/apple-sign-in` veya `@capgo/capacitor-social-login`

#### iOS native adımlar

1. Xcode → ana target → Signing & Capabilities → "+" → **Sign in with Apple**
2. Bundle ID için Apple Developer Console → Identifiers → `com.hangel.ios.app` → Capabilities → Sign in with Apple ✓

#### Web/JS adımlar

1. `npm install @capacitor-community/apple-sign-in`
2. `src/lib/apple-signin.ts` oluştur:

```ts
'use client';
import { SignInWithApple, SignInWithAppleResponse } from '@capacitor-community/apple-sign-in';
import { OAuthProvider, signInWithCredential } from 'firebase/auth';
import { initializeFirebase } from '@/firebase';

export async function signInWithApple(): Promise<void> {
  const options = {
    clientId: 'com.hangel.ios.app',
    redirectURI: 'https://hangel.org.tr/auth/apple/callback',
    scopes: 'email name',
  };
  const result: SignInWithAppleResponse = await SignInWithApple.authorize(options);
  if (!result.response.identityToken) throw new Error('No identity token');

  const { auth } = initializeFirebase();
  const provider = new OAuthProvider('apple.com');
  const credential = provider.credential({
    idToken: result.response.identityToken,
    rawNonce: result.response.nonce,
  });
  await signInWithCredential(auth, credential);
}
```

3. `src/app/login/selection/page.tsx` — "Apple ile devam et" butonu ekle:

```tsx
import { signInWithApple } from '@/lib/apple-signin';
import { Capacitor } from '@capacitor/core';

{Capacitor.getPlatform() === 'ios' && (
  <Button onClick={signInWithApple} variant="outline" className="w-full">
    <AppleIcon /> Apple ile devam et
  </Button>
)}
```

#### Firebase Console adımlar

1. Authentication → Sign-in method → Apple → Enable
2. Services ID: `com.hangel.ios.app.signin` (Apple Developer Console'da Services ID oluştur)
3. OAuth code flow → Apple Team ID + Key ID + .p8 (sign in için ayrı key, APNs key değil)

#### Backend (Cloud Function veya Next.js API route)

Apple Sign In ile gelen kullanıcı için `users/{uid}` doc oluştur (mevcut user-creation flow'unu reuse et). Email private relay (`@privaterelay.appleid.com`) ile gelir → `personalInfo.email`'e olduğu gibi yaz, "Apple ile bağlandı" badge'i göster.

#### Test senaryoları

- Yeni Apple kullanıcısı → kayıt + profil oluşturma ✓
- Mevcut email ile Apple → 409 yerine `existing user' aç (mevcut phone/email duplikat akışı gibi)
- "Hide my email" seçili → private relay email'i kabul et
- Apple → Sign Out → Apple ile tekrar giriş → aynı `uid` ✓

#### Done definition

- [ ] iOS Hangel app'te login ekranında "Apple ile devam et" butonu görünür
- [ ] Apple Sign In flow tamamlanır, Firebase Auth'a düşer, `users/{uid}` doc oluşur
- [ ] Apple Review reject riski yok (Guideline 4.8 met)
- [ ] iOS-only (Android'de buton gizli)

---

### 5.2. Privacy Manifest (PrivacyInfo.xcprivacy)

**Apple zorunlu (2024 Mayıs'tan beri).** Yoksa yeni IPA submission reject.

**Konum:** `ios/App/App/PrivacyInfo.xcprivacy`

#### Adımlar

1. Xcode → File → New File → **Property List** → İsim: `PrivacyInfo`
2. Aşağıdaki içeriği yapıştır (Hangel'in mevcut SDK kullanımına göre):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>NSPrivacyTracking</key>
  <false/>
  <key>NSPrivacyTrackingDomains</key>
  <array/>
  <key>NSPrivacyCollectedDataTypes</key>
  <array>
    <dict>
      <key>NSPrivacyCollectedDataType</key>
      <string>NSPrivacyCollectedDataTypeEmailAddress</string>
      <key>NSPrivacyCollectedDataTypeLinked</key>
      <true/>
      <key>NSPrivacyCollectedDataTypeTracking</key>
      <false/>
      <key>NSPrivacyCollectedDataTypePurposes</key>
      <array>
        <string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string>
        <string>NSPrivacyCollectedDataTypePurposeAuthenticator</string>
      </array>
    </dict>
    <dict>
      <key>NSPrivacyCollectedDataType</key>
      <string>NSPrivacyCollectedDataTypePhoneNumber</string>
      <key>NSPrivacyCollectedDataTypeLinked</key>
      <true/>
      <key>NSPrivacyCollectedDataTypeTracking</key>
      <false/>
      <key>NSPrivacyCollectedDataTypePurposes</key>
      <array>
        <string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string>
        <string>NSPrivacyCollectedDataTypePurposeAuthenticator</string>
      </array>
    </dict>
    <dict>
      <key>NSPrivacyCollectedDataType</key>
      <string>NSPrivacyCollectedDataTypeName</string>
      <key>NSPrivacyCollectedDataTypeLinked</key>
      <true/>
      <key>NSPrivacyCollectedDataTypeTracking</key>
      <false/>
      <key>NSPrivacyCollectedDataTypePurposes</key>
      <array>
        <string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string>
      </array>
    </dict>
    <dict>
      <key>NSPrivacyCollectedDataType</key>
      <string>NSPrivacyCollectedDataTypePreciseLocation</string>
      <key>NSPrivacyCollectedDataTypeLinked</key>
      <true/>
      <key>NSPrivacyCollectedDataTypeTracking</key>
      <false/>
      <key>NSPrivacyCollectedDataTypePurposes</key>
      <array>
        <string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string>
      </array>
    </dict>
    <dict>
      <key>NSPrivacyCollectedDataType</key>
      <string>NSPrivacyCollectedDataTypeContacts</string>
      <key>NSPrivacyCollectedDataTypeLinked</key>
      <true/>
      <key>NSPrivacyCollectedDataTypeTracking</key>
      <false/>
      <key>NSPrivacyCollectedDataTypePurposes</key>
      <array>
        <string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string>
      </array>
    </dict>
    <dict>
      <key>NSPrivacyCollectedDataType</key>
      <string>NSPrivacyCollectedDataTypePhotosorVideos</string>
      <key>NSPrivacyCollectedDataTypeLinked</key>
      <true/>
      <key>NSPrivacyCollectedDataTypeTracking</key>
      <false/>
      <key>NSPrivacyCollectedDataTypePurposes</key>
      <array>
        <string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string>
      </array>
    </dict>
    <dict>
      <key>NSPrivacyCollectedDataType</key>
      <string>NSPrivacyCollectedDataTypeCrashData</string>
      <key>NSPrivacyCollectedDataTypeLinked</key>
      <false/>
      <key>NSPrivacyCollectedDataTypeTracking</key>
      <false/>
      <key>NSPrivacyCollectedDataTypePurposes</key>
      <array>
        <string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string>
      </array>
    </dict>
    <dict>
      <key>NSPrivacyCollectedDataType</key>
      <string>NSPrivacyCollectedDataTypePerformanceData</string>
      <key>NSPrivacyCollectedDataTypeLinked</key>
      <false/>
      <key>NSPrivacyCollectedDataTypeTracking</key>
      <false/>
      <key>NSPrivacyCollectedDataTypePurposes</key>
      <array>
        <string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string>
      </array>
    </dict>
  </array>
  <key>NSPrivacyAccessedAPITypes</key>
  <array>
    <dict>
      <key>NSPrivacyAccessedAPIType</key>
      <string>NSPrivacyAccessedAPICategoryUserDefaults</string>
      <key>NSPrivacyAccessedAPITypeReasons</key>
      <array>
        <string>CA92.1</string>
      </array>
    </dict>
    <dict>
      <key>NSPrivacyAccessedAPIType</key>
      <string>NSPrivacyAccessedAPICategoryFileTimestamp</string>
      <key>NSPrivacyAccessedAPITypeReasons</key>
      <array>
        <string>C617.1</string>
      </array>
    </dict>
    <dict>
      <key>NSPrivacyAccessedAPIType</key>
      <string>NSPrivacyAccessedAPICategorySystemBootTime</string>
      <key>NSPrivacyAccessedAPITypeReasons</key>
      <array>
        <string>35F9.1</string>
      </array>
    </dict>
    <dict>
      <key>NSPrivacyAccessedAPIType</key>
      <string>NSPrivacyAccessedAPICategoryDiskSpace</string>
      <key>NSPrivacyAccessedAPITypeReasons</key>
      <array>
        <string>E174.1</string>
      </array>
    </dict>
  </array>
</dict>
</plist>
```

3. **Üçüncü taraf SDK Privacy Manifest'leri otomatik gelir** (Capacitor 8+ ve Firebase SDK kendi `PrivacyInfo.xcprivacy`'lerini ship eder). Pod install sonrası `ios/App/Pods/*/PrivacyInfo.xcprivacy` dosyalarının varlığını kontrol et.

#### Done definition

- [ ] `PrivacyInfo.xcprivacy` ana target'a eklendi
- [ ] App Store Connect upload sırasında "missing privacy manifest" uyarısı yok
- [ ] App Privacy bölümü (App Store listing) Privacy Manifest ile tutarlı

---

### 5.3. Push Notifications (FCM bridge)

#### Önerilen plugin

`@capacitor-firebase/messaging` (Capawesome) — iOS + Android'de tek API ile FCM token verir, Firebase SDK kendi getirir.

#### Adımlar

1. **Plugin install:**
```bash
npm install @capacitor-firebase/messaging
npx cap sync ios
```

2. **Podfile'a Firebase Messaging zaten gelir** (plugin getiriyor).

3. **AppDelegate.swift** (yeni Capacitor 8 template'i zaten Firebase'i destekliyor, ama explicitly init et):

```swift
import UIKit
import Capacitor
import FirebaseCore
import FirebaseMessaging

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        FirebaseApp.configure()
        return true
    }

    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        Messaging.messaging().apnsToken = deviceToken
    }

    // ... (mevcut Capacitor URL handling kalsın)
}
```

4. **Capability:** Push Notifications + Background Modes (Remote notifications)

5. **Web/JS — `src/lib/native-push.ts` oluştur:**

```ts
'use client';
import { Capacitor } from '@capacitor/core';
import { FirebaseMessaging } from '@capacitor-firebase/messaging';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { COLLECTIONS } from '@/firebase/collections';

export async function registerNativePushToken(uid: string): Promise<string | null> {
  if (!Capacitor.isNativePlatform() || !uid) return null;

  const perm = await FirebaseMessaging.requestPermissions();
  if (perm.receive !== 'granted') return null;

  const { token } = await FirebaseMessaging.getToken();
  if (!token) return null;

  const { firestore } = initializeFirebase();
  await setDoc(
    doc(firestore, COLLECTIONS.users, uid, COLLECTIONS.fcmTokens, token),
    {
      createdAt: serverTimestamp(),
      platform: Capacitor.getPlatform(),
      type: 'native',
    },
    { merge: true },
  );

  // Token refresh listener
  FirebaseMessaging.addListener('tokenReceived', async (event) => {
    if (!event.token) return;
    await setDoc(
      doc(firestore, COLLECTIONS.users, uid, COLLECTIONS.fcmTokens, event.token),
      { createdAt: serverTimestamp(), platform: Capacitor.getPlatform(), type: 'native' },
      { merge: true },
    );
  });

  // Foreground notification (app açıkken push geldiğinde)
  FirebaseMessaging.addListener('notificationReceived', (event) => {
    // ❓ KARAR: Foreground'da banner göster mi yoksa in-app notification mı?
    // Önerim: in-app toast (Hangel UI bileşeni) + Bildirim Merkezi'ne ekle
    console.debug('[push] foreground:', event.notification);
  });

  // Notification tap (background'dan açılma)
  FirebaseMessaging.addListener('notificationActionPerformed', (event) => {
    const link = event.notification.data?.link;
    if (link) window.location.href = link as string;
  });

  return token;
}
```

6. **`src/app/layout.tsx` veya bir client provider'da auth'lu kullanıcı için çağır:**

```tsx
'use client';
import { useEffect } from 'react';
import { useUser } from '@/firebase';
import { registerForPushToken } from '@/lib/fcm';
import { registerNativePushToken } from '@/lib/native-push';
import { Capacitor } from '@capacitor/core';

export function PushTokenBootstrap() {
  const { user } = useUser();
  useEffect(() => {
    if (!user?.uid) return;
    if (Capacitor.isNativePlatform()) {
      registerNativePushToken(user.uid).catch(console.warn);
    } else {
      registerForPushToken(user.uid).catch(console.warn);
    }
  }, [user?.uid]);
  return null;
}
```

Ana layout'a `<PushTokenBootstrap />` ekle.

#### Done definition

- [ ] iOS app açıldığında izin pop-up'ı görünür
- [ ] Token Firestore `users/{uid}/fcmTokens/{token}` altına yazılır (`type: 'native'`)
- [ ] Test push (`sendPushToUser` çağrısı) hem foreground hem background iOS cihaza ulaşır
- [ ] Notification tap → `data.link` URL'sine yönlendirir

---

### 5.4. Geolocation

**Apple framework:** CoreLocation
**Capacitor plugin:** `@capacitor/geolocation`

#### Adımlar

1. `npm install @capacitor/geolocation && npx cap sync ios`
2. Info.plist'te `NSLocationWhenInUseUsageDescription` zaten mevcut ✅
3. **`src/lib/native-geolocation.ts`:**

```ts
'use client';
import { Capacitor } from '@capacitor/core';
import { Geolocation, Position } from '@capacitor/geolocation';

export async function getCurrentLocation(): Promise<Position | null> {
  if (Capacitor.isNativePlatform()) {
    const perm = await Geolocation.checkPermissions();
    if (perm.location !== 'granted') {
      const req = await Geolocation.requestPermissions({ permissions: ['location'] });
      if (req.location !== 'granted') return null;
    }
    return await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 10000 });
  }
  // Web fallback
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos as unknown as Position),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  });
}
```

4. Kullanım örnek: `src/app/ngos/page.tsx` veya "yakındaki etkinlikler" sayfasında.

#### Done definition

- [ ] iOS app'te konum bazlı sayfa açıldığında izin pop-up'ı görünür
- [ ] İzin verildiyse `Position` objesi döner
- [ ] İzin reddedildiyse fallback (manual lokasyon girişi) gösterilir

---

### 5.5. Universal Links + App Links

**Hedef:** `https://hangel.org.tr/...` linki/QR Safari yerine app'te açılsın.

#### iOS (Universal Links)

1. **Apple Developer Console:** Bundle ID `com.hangel.ios.app` → Associated Domains capability ✓
2. **Xcode:** Signing & Capabilities → "+" → Associated Domains → ekle:
   - `applinks:hangel.org.tr`
   - `webcredentials:hangel.org.tr`
3. **Apple App Site Association (AASA) dosyası:**
   - Konum: `public/.well-known/apple-app-site-association`
   - **Dosya uzantısı YOK, MIME type `application/json`**
   - İçerik:
   ```json
   {
     "applinks": {
       "details": [
         {
           "appIDs": ["NKZNY8NU8S.com.hangel.ios.app", "NKZNY8NU8S.com.hangel.ios.app.Clip"],
           "components": [
             { "/": "/checkin/*" },
             { "/": "/event/*" },
             { "/": "/ngo/*" },
             { "/": "/u/*" },
             { "/": "/library/*" },
             { "/": "/donate/*" },
             { "/": "/clip/*", "comment": "App Clip experience URLs" },
             { "/": "/*", "exclude": true, "comment": "Diğer her şey Safari'de açılsın" }
           ]
         }
       ]
     },
     "webcredentials": {
       "apps": ["NKZNY8NU8S.com.hangel.ios.app"]
     }
   }
   ```
4. **Next.js — `next.config.ts` veya middleware ile dosyayı doğru content-type ile servis et:**

```ts
// next.config.ts içine ekle
async headers() {
  return [
    {
      source: '/.well-known/apple-app-site-association',
      headers: [{ key: 'Content-Type', value: 'application/json' }],
    },
    {
      source: '/.well-known/assetlinks.json',
      headers: [{ key: 'Content-Type', value: 'application/json' }],
    },
  ];
},
```

5. **AppDelegate.swift — Capacitor zaten Universal Link'i handle eder** ama listener web'de kurulacak:

```ts
// src/lib/native-bridge.ts
'use client';
import { App, URLOpenListenerEvent } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

export function initDeepLinkListener(router: { push: (url: string) => void }) {
  if (!Capacitor.isNativePlatform()) return;
  App.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
    try {
      const url = new URL(event.url);
      // hangel.org.tr/checkin/abc → router.push('/checkin/abc')
      router.push(url.pathname + url.search + url.hash);
    } catch {}
  });
}
```

Ana layout'ta `useEffect` ile init et.

#### Android (App Links)

1. `public/.well-known/assetlinks.json`:
```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.hangel.app",
      "sha256_cert_fingerprints": [
        "❓ KARAR: Android signing key SHA-256 fingerprint — release keystore'dan al"
      ]
    }
  }
]
```

2. **`android/app/src/main/AndroidManifest.xml`:**
```xml
<activity ...>
  <intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="https" android:host="hangel.org.tr" />
  </intent-filter>
</activity>
```

#### Test senaryoları

- iPhone'da Mesajlar → `https://hangel.org.tr/event/abc` link → uzun bas → "Hangel App'te Aç" görünür
- Safari → `hangel.org.tr/ngo/xyz` → smart banner görünür, tıklayınca app açılır
- QR koddan `https://hangel.org.tr/checkin/abc` okutulduğunda direkt app açılır + `/checkin/abc` sayfasına gider
- AASA test: `https://app-site-association.cdn-apple.com/a/v1/hangel.org.tr` cache'lendi mi
- `branch.io/resources/aasa-validator/` ile doğrula

#### Done definition

- [ ] AASA + assetlinks.json hangel.org.tr'den `application/json` content-type ile servis ediliyor
- [ ] iPhone'da link tıklayınca app açılır
- [ ] QR'dan link okutulduğunda app açılır
- [ ] App içinde route doğru render olur (mevcut Hangel router'ı)

---

### 5.6. App Tracking Transparency (ATT)

**Apple framework:** AppTrackingTransparency
**Gerek:** Firebase Analytics IDFA kullanır → ATT zorunlu.

#### Adımlar

1. **Info.plist:**
```xml
<key>NSUserTrackingUsageDescription</key>
<string>Reklamları sizin için kişiselleştirmek ve hangel deneyimini iyileştirmek için izniniz gerekir. Reddederseniz hangel tüm özellikleriyle çalışmaya devam eder.</string>
```

2. **Custom Capacitor Plugin yaz** (`HangelAttPlugin.swift`):

```swift
import Foundation
import Capacitor
import AppTrackingTransparency
import AdSupport

@objc(HangelAttPlugin)
public class HangelAttPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "HangelAttPlugin"
    public let jsName = "HangelAtt"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "requestPermission", returnType: CAPPluginReturnPromise),
    ]

    @objc func requestPermission(_ call: CAPPluginCall) {
        if #available(iOS 14, *) {
            ATTrackingManager.requestTrackingAuthorization { status in
                call.resolve(["status": String(describing: status)])
            }
        } else {
            call.resolve(["status": "notAvailable"])
        }
    }
}
```

3. JS tarafında onboarding sırasında veya analytics opt-in akışında çağır.

#### Done definition

- [ ] İlk app açılışında ATT prompt görünür (app launch sonrası, oturum açma akışı ardından)
- [ ] Reddedildiyse Firebase Analytics IDFA'sız çalışmaya devam eder

---

### 5.7. Firebase Crashlytics

#### Adımlar

1. **Firebase Console** → Project → Crashlytics → iOS app için Enable
2. **Podfile:** Capacitor pod'lar sonrasına:
```ruby
pod 'Firebase/Crashlytics'
pod 'Firebase/Analytics'
```
3. **AppDelegate.swift** içine:
```swift
import FirebaseCrashlytics
// Firebase.configure() sonrasına otomatik aktive olur
```
4. **Build Phase ekle:** Xcode → ana target → Build Phases → "+" → New Run Script Phase:
```bash
"${PODS_ROOT}/FirebaseCrashlytics/run"
```
Input Files:
```
$(DWARF_DSYM_FOLDER_PATH)/$(DWARF_DSYM_FILE_NAME)/Contents/Resources/DWARF/$(TARGET_NAME)
$(SRCROOT)/$(BUILT_PRODUCTS_DIR)/$(INFOPLIST_PATH)
```

5. JS tarafından custom event log için:
```bash
npm install @capacitor-firebase/crashlytics
```

```ts
import { FirebaseCrashlytics } from '@capacitor-firebase/crashlytics';

// User identifier
await FirebaseCrashlytics.setUserId({ userId: user.uid });

// Custom log
await FirebaseCrashlytics.log({ message: 'User clicked donate button' });

// Non-fatal exception
await FirebaseCrashlytics.recordException({ message: 'Payment failed', stacktrace: [...] });
```

#### Done definition

- [ ] Test crash (örn. force unwrap nil) Firebase Console'da görünür
- [ ] dSYM'ler otomatik upload (Build Phase ile)
- [ ] User identifier crash report'unda görünür

---

## 6. Faz 1 — Apple core

### 6.1. Live Activities + Dynamic Island

**Apple framework:** ActivityKit (iOS 16.1+), WidgetKit (UI layout)
**iOS minimum:** 16.1 (Live Activities), 16.0 + iPhone 14 Pro+ (Dynamic Island)

#### Mimari

```
[Hangel Web] ── Capacitor Plugin ──→ [HangelLiveActivityPlugin (Swift)]
                                            ↓ ActivityKit
                                       [HangelLiveActivityExtension]
                                            ↑ APNs liveactivity push
[Firebase Functions] ──→ APNs HTTP/2 (apns-push-type: liveactivity)
```

**❓ KARAR:** Live Activity push, FCM tarafından desteklenmiyor → APNs'e doğrudan POST için Firebase Functions endpoint yazılacak. Yan etkisi: APNs Auth Key (.p8) Firebase Functions environment'ta da olmalı.

#### Faz 1 — Live Activity tipleri

1. **Acil kan ilanı** — kan grubu, şehir, mesafe, geri sayım
2. **Gönüllülük görev** — etkinlik adı, lokasyon, geri sayım, check-in butonu
3. **Etkinlik geri sayımı** — etkinliğe kalan süre
4. **Bağış kampanyası ilerleme** — yüzde dolu progress bar

#### iOS native — Live Activity Extension Target

1. Xcode → File → New → Target → **Widget Extension** → İsim: `HangelLiveActivities` → "Include Live Activity" ✓
2. **`HangelLiveActivityAttributes.swift`** (App Group içinde paylaşılan model):

```swift
import ActivityKit
import Foundation

public struct EmergencyBloodAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        public var distance: String       // "1.2 km uzakta"
        public var matchedDonors: Int
        public var minutesLeft: Int
        public var status: String         // "Bekleniyor" | "Yola Çıktı" | "Tamamlandı"
    }
    public var bloodType: String          // "A Rh+"
    public var city: String
    public var requestId: String
    public var hospitalName: String
}

public struct VolunteerTaskAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        public var minutesLeft: Int
        public var progressPercent: Double
        public var checkInOpen: Bool
    }
    public var taskTitle: String
    public var ngoName: String
    public var location: String
    public var taskId: String
}

public struct DonationCampaignAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        public var currentAmount: Double
        public var goalAmount: Double
        public var donorCount: Int
    }
    public var campaignTitle: String
    public var ngoName: String
    public var campaignId: String
}
```

3. **Widget UI** (`HangelLiveActivities/HangelLiveActivitiesBundle.swift`):

```swift
import WidgetKit
import SwiftUI
import ActivityKit

@main
struct HangelLiveActivitiesBundle: WidgetBundle {
    var body: some Widget {
        EmergencyBloodLiveActivity()
        VolunteerTaskLiveActivity()
        DonationCampaignLiveActivity()
    }
}

struct EmergencyBloodLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: EmergencyBloodAttributes.self) { context in
            // Lock Screen / Banner UI
            HStack {
                VStack(alignment: .leading) {
                    Text("🩸 \(context.attributes.bloodType)")
                        .font(.headline)
                    Text(context.attributes.hospitalName)
                        .font(.subheadline)
                    Text(context.state.distance)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                Spacer()
                Text("\(context.state.matchedDonors)/4")
                    .font(.title2.bold())
                    .foregroundStyle(.red)
            }
            .padding()
            .activityBackgroundTint(Color.red.opacity(0.1))
            .activitySystemActionForegroundColor(Color.red)
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    Text(context.attributes.bloodType)
                        .font(.title2.bold())
                        .foregroundStyle(.red)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Text("\(context.state.matchedDonors)/4")
                        .font(.title2.bold())
                }
                DynamicIslandExpandedRegion(.bottom) {
                    Text("\(context.attributes.hospitalName) — \(context.state.distance)")
                }
            } compactLeading: {
                Text("🩸")
            } compactTrailing: {
                Text(context.attributes.bloodType)
                    .foregroundStyle(.red)
            } minimal: {
                Text("🩸")
            }
        }
    }
}

// VolunteerTaskLiveActivity ve DonationCampaignLiveActivity benzer şekilde
```

4. **Custom Capacitor Plugin** — `HangelLiveActivityPlugin.swift`:

```swift
import Foundation
import Capacitor
import ActivityKit

@objc(HangelLiveActivityPlugin)
public class HangelLiveActivityPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "HangelLiveActivityPlugin"
    public let jsName = "HangelLiveActivity"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "startEmergencyBlood", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "startVolunteerTask", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "startDonationCampaign", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "endActivity", returnType: CAPPluginReturnPromise),
    ]

    @objc func startEmergencyBlood(_ call: CAPPluginCall) {
        guard #available(iOS 16.1, *) else {
            call.reject("Live Activities require iOS 16.1+")
            return
        }
        guard let bloodType = call.getString("bloodType"),
              let city = call.getString("city"),
              let requestId = call.getString("requestId"),
              let hospitalName = call.getString("hospitalName") else {
            call.reject("Missing required attributes")
            return
        }
        let attributes = EmergencyBloodAttributes(bloodType: bloodType, city: city, requestId: requestId, hospitalName: hospitalName)
        let initialState = EmergencyBloodAttributes.ContentState(
            distance: call.getString("distance") ?? "—",
            matchedDonors: call.getInt("matchedDonors") ?? 0,
            minutesLeft: call.getInt("minutesLeft") ?? 60,
            status: call.getString("status") ?? "Bekleniyor"
        )
        do {
            let activity = try Activity.request(
                attributes: attributes,
                content: .init(state: initialState, staleDate: Date().addingTimeInterval(60 * 60)),
                pushType: .token
            )
            // Push token'ı backend'e gönder
            Task {
                for await tokenData in activity.pushTokenUpdates {
                    let token = tokenData.map { String(format: "%02x", $0) }.joined()
                    call.resolve(["activityId": activity.id, "pushToken": token])
                    break
                }
            }
        } catch {
            call.reject("Failed to start Live Activity: \(error.localizedDescription)")
        }
    }

    // ... endActivity, startVolunteerTask, startDonationCampaign benzer
}
```

5. **Plugin'i kaydet** — `Plugins.swift` veya Capacitor 8'in plugin registration mekanizması.

#### Backend — Firebase Functions APNs push

```ts
// functions/src/sendLiveActivityUpdate.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as jwt from 'jsonwebtoken';
import fetch from 'node-fetch';

export const sendLiveActivityUpdate = functions.firestore
  .document('emergencyBlood/{id}/updates/{updateId}')
  .onCreate(async (snap, ctx) => {
    const update = snap.data();
    const requestId = ctx.params.id;
    const req = await admin.firestore().doc(`emergencyBlood/${requestId}`).get();
    const activityToken = req.data()?.liveActivityToken;
    if (!activityToken) return;

    const apnsJwt = jwt.sign({}, getApnsPrivateKey(), {
      algorithm: 'ES256',
      header: { alg: 'ES256', kid: process.env.APNS_KEY_ID },
      issuer: process.env.APNS_TEAM_ID,
      expiresIn: '1h',
    });

    const payload = {
      aps: {
        timestamp: Math.floor(Date.now() / 1000),
        event: 'update',
        'content-state': {
          distance: update.distance,
          matchedDonors: update.matchedDonors,
          minutesLeft: update.minutesLeft,
          status: update.status,
        },
        alert: { title: 'Acil Kan Güncelleme', body: update.status },
      },
    };

    await fetch(`https://api.push.apple.com/3/device/${activityToken}`, {
      method: 'POST',
      headers: {
        authorization: `bearer ${apnsJwt}`,
        'apns-topic': 'com.hangel.ios.app.push-type.liveactivity',
        'apns-push-type': 'liveactivity',
        'apns-priority': '10',
      },
      body: JSON.stringify(payload),
    });
  });
```

Environment variables:
- `APNS_KEY_ID` — APNs Auth Key ID
- `APNS_TEAM_ID` — `NKZNY8NU8S`
- `APNS_PRIVATE_KEY_BASE64` — .p8 dosyasının base64'ü

#### Web/JS — Live Activity trigger

```ts
// src/lib/live-activity.ts
'use client';
import { Capacitor, registerPlugin } from '@capacitor/core';

interface HangelLiveActivityPlugin {
  startEmergencyBlood(opts: {
    bloodType: string;
    city: string;
    requestId: string;
    hospitalName: string;
    distance?: string;
    matchedDonors?: number;
    minutesLeft?: number;
    status?: string;
  }): Promise<{ activityId: string; pushToken: string }>;
  // ... diğer methodlar
  endActivity(opts: { activityId: string }): Promise<void>;
}

const HangelLiveActivity = registerPlugin<HangelLiveActivityPlugin>('HangelLiveActivity');

export async function startEmergencyBloodActivity(req: {
  bloodType: string;
  city: string;
  requestId: string;
  hospitalName: string;
}): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { activityId, pushToken } = await HangelLiveActivity.startEmergencyBlood({
      ...req,
      distance: '—',
      matchedDonors: 0,
      minutesLeft: 60,
      status: 'Bekleniyor',
    });
    // Push token'ı backend'e bildir (Firestore'a yaz)
    await fetch('/api/live-activity/register-token', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ activityId, pushToken, requestId: req.requestId, type: 'emergency-blood' }),
    });
  } catch (e) {
    console.warn('[live-activity]', e);
  }
}
```

#### Done definition

- [ ] iOS 16.1+ cihazda acil kan ilanı açıldığında Live Activity başlar
- [ ] Lock Screen'de + Dynamic Island'da görünür
- [ ] Backend `emergencyBlood/{id}/updates/*` write'ında Live Activity güncellenir (push ile)
- [ ] İlan kapanınca/tamamlandığında activity end olur
- [ ] iPhone 14 Pro+ Dynamic Island compact/expanded/minimal states düzgün render olur

---

### 6.2. Apple Wallet Biletler (PassKit)

**Apple framework:** PassKit
**iOS minimum:** 6.0+ (PassKit eski)

#### Bilet tipleri

1. **Etkinlik bileti** (`eventTicket` pass type)
2. **Gönüllülük görev bileti** (`generic` pass type, "Volunteer Task" altyazı)

#### Backend — Pass üretimi

1. `npm install passkit-generator` (Next.js API route'larında kullanılacak)
2. **Pass.json şablonu** (`src/lib/passkit/eventPassTemplate.json`):

```json
{
  "formatVersion": 1,
  "passTypeIdentifier": "pass.com.hangel.ios.app",
  "teamIdentifier": "NKZNY8NU8S",
  "organizationName": "Hangel",
  "description": "Hangel Etkinlik Bileti",
  "logoText": "Hangel",
  "foregroundColor": "rgb(255, 255, 255)",
  "backgroundColor": "rgb(243, 71, 35)",
  "labelColor": "rgb(255, 255, 255)",
  "eventTicket": {
    "primaryFields": [
      { "key": "event", "label": "ETKİNLİK", "value": "" }
    ],
    "secondaryFields": [
      { "key": "loc", "label": "LOKASYON", "value": "" },
      { "key": "date", "label": "TARİH", "value": "", "dateStyle": "PKDateStyleMedium", "timeStyle": "PKDateStyleShort" }
    ],
    "auxiliaryFields": [
      { "key": "ngo", "label": "STK", "value": "" }
    ],
    "backFields": [
      { "key": "ticketId", "label": "Bilet No", "value": "" },
      { "key": "terms", "label": "Şartlar", "value": "Bilet sadece kayıtlı kullanıcı için geçerlidir. Etkinlik girişinde QR kod taratılacaktır." }
    ]
  },
  "barcodes": [
    {
      "format": "PKBarcodeFormatQR",
      "message": "",
      "messageEncoding": "iso-8859-1",
      "altText": ""
    }
  ],
  "locations": [],
  "relevantDate": "",
  "webServiceURL": "https://hangel.org.tr/api/passkit/",
  "authenticationToken": ""
}
```

3. **API route — `src/app/api/passkit/event/[id]/route.ts`:**

```ts
import { NextRequest, NextResponse } from 'next/server';
import { PKPass } from 'passkit-generator';
import { getAdminFirestore } from '@/lib/firebase-admin';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getAdminFirestore();
  const event = await db.collection('events').doc(id).get();
  if (!event.exists) return new NextResponse('Event not found', { status: 404 });
  const e = event.data()!;

  // ❓ KARAR: PassKit cert P12 + parolası env'den okunacak
  const wwdr = Buffer.from(process.env.APPLE_WWDR_CERT_BASE64!, 'base64');
  const signerCert = Buffer.from(process.env.PASSKIT_CERT_PEM_BASE64!, 'base64');
  const signerKey = Buffer.from(process.env.PASSKIT_KEY_PEM_BASE64!, 'base64');

  const pass = await PKPass.from(
    {
      model: './src/lib/passkit/event.pass', // pass.json + icon.png + logo.png + strip.png
      certificates: {
        wwdr,
        signerCert,
        signerKey,
        signerKeyPassphrase: process.env.PASSKIT_KEY_PASSPHRASE,
      },
    },
    {
      serialNumber: id,
      description: `Hangel — ${e.title}`,
      eventTicket: {
        primaryFields: [{ key: 'event', label: 'ETKİNLİK', value: e.title }],
        secondaryFields: [
          { key: 'loc', label: 'LOKASYON', value: e.location },
          { key: 'date', label: 'TARİH', value: e.startDate.toDate().toISOString(), dateStyle: 'PKDateStyleMedium', timeStyle: 'PKDateStyleShort' },
        ],
        auxiliaryFields: [{ key: 'ngo', label: 'STK', value: e.ngoName }],
        backFields: [{ key: 'ticketId', label: 'Bilet No', value: id }],
      },
      barcodes: [
        {
          format: 'PKBarcodeFormatQR',
          message: `https://hangel.org.tr/checkin/${id}`,
          messageEncoding: 'iso-8859-1',
          altText: id.slice(0, 8),
        },
      ],
      locations: e.coordinates ? [{ latitude: e.coordinates.lat, longitude: e.coordinates.lng }] : [],
      relevantDate: e.startDate.toDate().toISOString(),
    },
  );

  const buffer = pass.getAsBuffer();
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.apple.pkpass',
      'Content-Disposition': `attachment; filename="hangel-${id}.pkpass"`,
    },
  });
}
```

4. **Pass update web service** (Apple zorunlu) — `src/app/api/passkit/v1/...` altında:
   - `POST /v1/devices/{deviceLibraryIdentifier}/registrations/{passTypeIdentifier}/{serialNumber}` — register
   - `DELETE /v1/devices/.../{serialNumber}` — unregister
   - `GET /v1/devices/{deviceLibraryIdentifier}/registrations/{passTypeIdentifier}?passesUpdatedSince=...` — list updated passes
   - `GET /v1/passes/{passTypeIdentifier}/{serialNumber}` — get updated pass
   - `POST /v1/log` — log endpoint

Apple Documentation: https://developer.apple.com/documentation/walletpasses

5. **Push update tetiği:** Etkinlik saati/lokasyon değiştiğinde:
```ts
// Firebase Function veya Next.js API
async function notifyPassUpdate(passSerial: string) {
  const registrations = await db.collection(`passkitRegistrations`)
    .where('serialNumber', '==', passSerial).get();
  for (const reg of registrations.docs) {
    const { pushToken } = reg.data();
    await fetch(`https://api.push.apple.com/3/device/${pushToken}`, {
      method: 'POST',
      headers: {
        authorization: `bearer ${getApnsJwt()}`,
        'apns-topic': 'pass.com.hangel.ios.app',
      },
      body: JSON.stringify({}),
    });
  }
}
```

#### Web/JS — "Apple Wallet'a Ekle" butonu

```tsx
// src/app/event/[id]/page.tsx
{Capacitor.getPlatform() === 'ios' && (
  <a
    href={`/api/passkit/event/${eventId}`}
    download={`hangel-${eventId}.pkpass`}
    className="..."
  >
    <img src="/add-to-apple-wallet.svg" alt="Add to Apple Wallet" />
  </a>
)}
```

Tarayıcı `.pkpass` MIME type'ını tanır → Wallet'a ekleme dialog'u açar.

#### Done definition

- [ ] Event sayfasında "Apple Wallet'a Ekle" butonu görünür (iOS only)
- [ ] Buton tıklanınca .pkpass indirilir + Wallet'a ekleme dialog'u açılır
- [ ] Pass eklendikten sonra Wallet'ta Hangel logosu + etkinlik bilgileri + QR görünür
- [ ] Etkinlik saati değişirse pass otomatik güncellenir (push trigger)
- [ ] QR kod taratınca `https://hangel.org.tr/checkin/{id}` açılır (Universal Link → app içinde check-in)

---

### 6.3. Home Screen Widgets

**Apple framework:** WidgetKit
**iOS minimum:** 14+

#### 4 widget

1. **Bugünün acil ihtiyaçları** — son 24 saatte açılmış acil kan + yardım çağrıları (3 satır)
2. **Yakındaki etkinlikler** — kullanıcının konumuna göre 3 etkinlik (small + medium + large)
3. **Bu haftaki sosyal etki** — toplam gönüllülük saati + bağış + etkinlik (small)
4. **Yakındaki kan ihtiyaçları** — sadece kan ilanları (small + medium)

#### Mimari

```
[Hangel App (Capacitor)] ──→ App Group UserDefaults ──→ [Widget Extension]
        ↓                                                       ↑
   Firestore                                            WidgetCenter.reloadTimelines
        ↓
[Cloud Function: silent push] → background refresh
```

#### iOS native — Widget Extension Target

1. Xcode → File → New → Target → **Widget Extension** → İsim: `HangelWidgets` (Live Activity ile aynı target olabilir, ama temiz ayırım için ayrı önerilir)
2. **App Group capability** ana target + widget target'a ekle: `group.com.hangel.app.shared`
3. **`HangelWidgets/EmergencyNeedsWidget.swift`:**

```swift
import WidgetKit
import SwiftUI

struct EmergencyNeed: Codable, Identifiable {
    let id: String
    let type: String      // "blood" | "food" | "shelter"
    let title: String
    let location: String
    let createdAt: Date
}

struct EmergencyNeedsProvider: TimelineProvider {
    func placeholder(in context: Context) -> EmergencyNeedsEntry {
        .init(date: Date(), needs: [
            .init(id: "1", type: "blood", title: "A Rh+ aranıyor", location: "Ankara", createdAt: Date())
        ])
    }
    func getSnapshot(in context: Context, completion: @escaping (EmergencyNeedsEntry) -> ()) {
        completion(loadFromAppGroup())
    }
    func getTimeline(in context: Context, completion: @escaping (Timeline<EmergencyNeedsEntry>) -> ()) {
        let entry = loadFromAppGroup()
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 30, to: Date())!
        completion(Timeline(entries: [entry], policy: .after(nextUpdate)))
    }

    private func loadFromAppGroup() -> EmergencyNeedsEntry {
        let ud = UserDefaults(suiteName: "group.com.hangel.app.shared")
        guard let data = ud?.data(forKey: "widget.emergencyNeeds") else {
            return .init(date: Date(), needs: [])
        }
        let needs = (try? JSONDecoder().decode([EmergencyNeed].self, from: data)) ?? []
        return .init(date: Date(), needs: needs)
    }
}

struct EmergencyNeedsEntry: TimelineEntry {
    let date: Date
    let needs: [EmergencyNeed]
}

struct EmergencyNeedsWidgetView: View {
    let entry: EmergencyNeedsEntry
    @Environment(\.widgetFamily) var family

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("Bugünün Acil İhtiyaçları")
                .font(.caption.bold())
                .foregroundStyle(.secondary)
            ForEach(entry.needs.prefix(family == .systemLarge ? 5 : 3)) { need in
                HStack {
                    Text(icon(for: need.type))
                    VStack(alignment: .leading) {
                        Text(need.title).font(.footnote.bold())
                        Text(need.location).font(.caption2).foregroundStyle(.secondary)
                    }
                    Spacer()
                }
            }
            if entry.needs.isEmpty {
                Text("Şu an acil ihtiyaç yok ✓").font(.footnote).foregroundStyle(.secondary)
            }
        }
        .padding()
        .widgetURL(URL(string: "hangel://emergency"))
    }
    private func icon(for type: String) -> String {
        switch type {
        case "blood": return "🩸"
        case "food": return "🍞"
        case "shelter": return "🏠"
        default: return "❗"
        }
    }
}

struct EmergencyNeedsWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "EmergencyNeedsWidget", provider: EmergencyNeedsProvider()) { entry in
            EmergencyNeedsWidgetView(entry: entry)
        }
        .configurationDisplayName("Acil İhtiyaçlar")
        .description("Bugünün acil yardım çağrıları")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}
```

4. Aynı şekilde **`NearbyEventsWidget.swift`**, **`WeeklyImpactWidget.swift`**, **`NearbyBloodWidget.swift`**.

5. **`HangelWidgetsBundle.swift`:**

```swift
@main
struct HangelWidgetsBundle: WidgetBundle {
    var body: some Widget {
        EmergencyNeedsWidget()
        NearbyEventsWidget()
        WeeklyImpactWidget()
        NearbyBloodWidget()
    }
}
```

#### Custom Capacitor Plugin — App Group writer

```swift
@objc(HangelWidgetDataPlugin)
public class HangelWidgetDataPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "HangelWidgetDataPlugin"
    public let jsName = "HangelWidgetData"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "writeData", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "reloadAllTimelines", returnType: CAPPluginReturnPromise),
    ]

    @objc func writeData(_ call: CAPPluginCall) {
        guard let key = call.getString("key"),
              let data = call.getString("data") else {
            call.reject("Missing key/data")
            return
        }
        let ud = UserDefaults(suiteName: "group.com.hangel.app.shared")
        ud?.set(data.data(using: .utf8), forKey: key)
        call.resolve()
    }

    @objc func reloadAllTimelines(_ call: CAPPluginCall) {
        if #available(iOS 14.0, *) {
            WidgetCenter.shared.reloadAllTimelines()
        }
        call.resolve()
    }
}
```

#### Web/JS — Widget data sync

```ts
// src/lib/widget-sync.ts
import { Capacitor, registerPlugin } from '@capacitor/core';

interface WidgetDataPlugin {
  writeData(opts: { key: string; data: string }): Promise<void>;
  reloadAllTimelines(): Promise<void>;
}
const HangelWidgetData = registerPlugin<WidgetDataPlugin>('HangelWidgetData');

export async function syncWidgetData(uid: string) {
  if (!Capacitor.isNativePlatform()) return;

  // Acil ihtiyaçlar
  const needs = await fetchEmergencyNeeds(); // Firestore query
  await HangelWidgetData.writeData({
    key: 'widget.emergencyNeeds',
    data: JSON.stringify(needs),
  });

  // Yakındaki etkinlikler
  const events = await fetchNearbyEvents(uid);
  await HangelWidgetData.writeData({
    key: 'widget.nearbyEvents',
    data: JSON.stringify(events),
  });

  // Bu haftaki impact
  const impact = await fetchWeeklyImpact(uid);
  await HangelWidgetData.writeData({
    key: 'widget.weeklyImpact',
    data: JSON.stringify(impact),
  });

  // Reload
  await HangelWidgetData.reloadAllTimelines();
}
```

Bu fonksiyon app foreground'a geldiğinde + her 30 dk'da bir çağrılır.

#### Background refresh (silent push ile)

Cloud Function — acil bir kan ihtiyacı oluştuğunda silent push gönder, app uyandığında widget data refresh olur.

```ts
// Silent push payload
{ aps: { 'content-available': 1 }, data: { action: 'refresh-widget' } }
```

#### Done definition

- [ ] iOS Home Screen'de uzun bas → Widget ekle → Hangel görünür
- [ ] 4 widget tipi seçilebilir (small + medium + large where supported)
- [ ] Widget veri App Group üzerinden güncellenir
- [ ] Widget tap → deep link ile ilgili sayfa açılır

---

### 6.4. Akıllı Check-in (QR + NFC + konum + auto checkout)

#### Bileşenler

1. **QR check-in** — Mevcut Hangel app + web kamera ile QR okuma
2. **NFC check-in** — Etkinlik girişinde NFC etiketi okutarak (Faz 1 + 2 ortak)
3. **Konum doğrulamalı check-in** — Etkinlik konumuna 100m içinde olmadan check-in yapılamaz
4. **Otomatik check-out** — Geofence exit eventi ile otomatik

#### Backend — Firestore schema

```
events/{eventId}/checkins/{uid}
{
  uid: string,
  checkedInAt: Timestamp,
  checkedOutAt: Timestamp | null,
  method: 'qr' | 'nfc' | 'manual',
  location: { lat, lng, accuracy }
}
```

#### Custom Capacitor Plugin — `HangelCheckinPlugin`

```swift
import Foundation
import Capacitor
import CoreLocation

@objc(HangelCheckinPlugin)
public class HangelCheckinPlugin: CAPPlugin, CAPBridgedPlugin, CLLocationManagerDelegate {
    public let identifier = "HangelCheckinPlugin"
    public let jsName = "HangelCheckin"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "startMonitoring", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stopMonitoring", returnType: CAPPluginReturnPromise),
    ]

    let locationManager = CLLocationManager()

    public override func load() {
        super.load()
        locationManager.delegate = self
    }

    @objc func startMonitoring(_ call: CAPPluginCall) {
        guard let eventId = call.getString("eventId"),
              let lat = call.getDouble("latitude"),
              let lng = call.getDouble("longitude") else {
            call.reject("Missing parameters")
            return
        }
        let region = CLCircularRegion(
            center: CLLocationCoordinate2D(latitude: lat, longitude: lng),
            radius: 100,
            identifier: "hangel-event-\(eventId)"
        )
        region.notifyOnEntry = true
        region.notifyOnExit = true
        locationManager.startMonitoring(for: region)
        call.resolve()
    }

    @objc func stopMonitoring(_ call: CAPPluginCall) {
        guard let eventId = call.getString("eventId") else {
            call.reject("Missing eventId")
            return
        }
        for region in locationManager.monitoredRegions where region.identifier == "hangel-event-\(eventId)" {
            locationManager.stopMonitoring(for: region)
        }
        call.resolve()
    }

    public func locationManager(_ manager: CLLocationManager, didExitRegion region: CLRegion) {
        let eventId = region.identifier.replacingOccurrences(of: "hangel-event-", with: "")
        notifyListeners("regionExit", data: ["eventId": eventId])
    }
}
```

#### Web/JS — Check-in flow

```ts
// src/app/checkin/[id]/page.tsx
'use client';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { getCurrentLocation } from '@/lib/native-geolocation';

interface CheckinPlugin {
  startMonitoring(opts: { eventId: string; latitude: number; longitude: number }): Promise<void>;
  addListener(event: 'regionExit', cb: (data: { eventId: string }) => void): void;
}
const HangelCheckin = registerPlugin<CheckinPlugin>('HangelCheckin');

async function performCheckin(eventId: string, event: EventDoc) {
  const pos = await getCurrentLocation();
  if (!pos) { alert('Konum gerekli'); return; }

  const distance = haversine(pos, event.coordinates);
  if (distance > 100) { alert(`Etkinliğe ${Math.round(distance)}m uzaklıktasınız. 100m içinde olmalısınız.`); return; }

  await fetch(`/api/events/${eventId}/checkin`, {
    method: 'POST',
    body: JSON.stringify({ method: 'qr', location: pos }),
  });

  // Auto checkout için geofence kur
  if (Capacitor.isNativePlatform()) {
    await HangelCheckin.startMonitoring({
      eventId,
      latitude: event.coordinates.lat,
      longitude: event.coordinates.lng,
    });
    HangelCheckin.addListener('regionExit', async ({ eventId: exitedId }) => {
      await fetch(`/api/events/${exitedId}/checkout`, { method: 'POST' });
    });
  }
}
```

#### Apple Review notu

Background location entitlement kullanımı sebep olarak "Etkinlik bittiğinde gönüllü otomatik check-out yapılır" net açıklanmalı. Apple Review'ı geçmek için Info.plist'e ek key:

```xml
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>Etkinliğe katıldığınızda otomatik check-out yapabilmemiz için arka planda konum gerekir. Bu izin sadece kayıtlı olduğunuz etkinliğin konumu için kullanılır.</string>
```

#### Done definition

- [ ] QR okutunca konum kontrolü yapılır + Firestore'a check-in yazılır
- [ ] Etkinlik alanından çıkınca (geofence exit) otomatik check-out
- [ ] 100m dışından check-in engellenir
- [ ] NFC okutarak da check-in yapılabilir (Faz 2 NFC plugin'i ile entegre)

---

## 7. Faz 2 — Erişim genişletme

### 7.1. App Clip

**Apple framework:** App Clip Target + AuthenticationServices
**iOS minimum:** 14+ (Clip), 16+ (advanced App Clip experiences)

#### Mimari karar

**App Clip Capacitor + WebView ile YAPILMAMALIDIR.** Sebepler:
- App Clip 15 MB sınırı — Capacitor + Hangel web bundle bu sınıra sığmaz
- Apple Review "minimal native experience" istiyor

**App Clip bağımsız SwiftUI mini-app olarak yazılır.** Sadece şu flow'u içerir:
1. Splash + Hangel logo
2. Etkinlik/STK bilgisi (URL'den gelen `eventId` ile Firestore'dan çek)
3. "Sign in with Apple" butonu
4. Sign in başarılıysa "Kayıt ol" butonu → Firestore'a `volunteers/{uid}` veya `eventRegistrations/{eventId}/{uid}` yazımı
5. "Hangel'i indir" butonu → App Store

#### Xcode adımlar

1. File → New → Target → **App Clip**
2. Bundle ID: `com.hangel.ios.app.Clip`
3. Interface: SwiftUI
4. App Clip Group: ana app ile aynı App Group (`group.com.hangel.app.shared`)

#### App Clip Invocation URL'leri

App Store Connect → My Apps → Hangel → App Clips → Advanced App Clip Experiences → "+":

- URL Pattern: `https://hangel.org.tr/clip/event/*`
- URL Pattern: `https://hangel.org.tr/clip/ngo/*`
- Action: Show
- Default Image, Title, Subtitle, Action ayarla

#### SwiftUI App Clip code skeleton

```swift
// HangelClip/ContentView.swift
import SwiftUI
import FirebaseCore
import FirebaseFirestore
import AuthenticationServices

@main
struct HangelClipApp: App {
    init() { FirebaseApp.configure() }
    var body: some Scene {
        WindowGroup {
            ContentView()
                .onContinueUserActivity(NSUserActivityTypeBrowsingWeb, perform: handleUserActivity)
        }
    }

    func handleUserActivity(_ activity: NSUserActivity) {
        guard let url = activity.webpageURL else { return }
        // url: https://hangel.org.tr/clip/event/abc123
        let pathParts = url.pathComponents
        if pathParts.count >= 4 {
            ClipState.shared.eventId = pathParts[3]
        }
    }
}

@MainActor
class ClipState: ObservableObject {
    static let shared = ClipState()
    @Published var eventId: String?
    @Published var event: EventInfo?
}

struct ContentView: View {
    @StateObject var state = ClipState.shared
    @State var loading = false

    var body: some View {
        VStack(spacing: 24) {
            Image("HangelLogo").resizable().scaledToFit().frame(width: 80, height: 80)
            if let event = state.event {
                Text(event.title).font(.title2.bold())
                Text(event.ngoName).font(.subheadline)
                Text(event.location).font(.caption)

                SignInWithAppleButton(.continue, onRequest: { req in
                    req.requestedScopes = [.fullName, .email]
                }, onCompletion: handleSignIn)
                .frame(height: 50)
                .padding(.horizontal)

                Button("Hangel'i App Store'dan indir") {
                    // App Clip → Full App promotion
                }
            } else if loading {
                ProgressView()
            } else {
                Text("Etkinlik yükleniyor...").onAppear { Task { await loadEvent() } }
            }
        }
        .padding()
    }

    func loadEvent() async {
        guard let id = state.eventId else { return }
        loading = true
        let doc = try? await Firestore.firestore().collection("events").document(id).getDocument()
        if let data = doc?.data() {
            state.event = EventInfo(
                title: data["title"] as? String ?? "",
                ngoName: data["ngoName"] as? String ?? "",
                location: data["location"] as? String ?? ""
            )
        }
        loading = false
    }

    func handleSignIn(_ result: Result<ASAuthorization, Error>) {
        // Firebase Auth ile Sign in with Apple → kayıt yapım
    }
}

struct EventInfo {
    let title: String
    let ngoName: String
    let location: String
}
```

#### Done definition

- [ ] App Store Connect'e App Clip submit edildi
- [ ] QR `https://hangel.org.tr/clip/event/abc` → iPhone'da App Clip Card açılır
- [ ] Sign in with Apple → Firebase Auth'a düşer → `users/{uid}` + `eventRegistrations/{eventId}/{uid}` yazılır
- [ ] "Hangel'i indir" App Store'a yönlendirir

---

### 7.2. NFC Entegrasyonu

**Apple framework:** Core NFC
**Capacitor plugin:** `@capawesome-team/capacitor-nfc`
**iOS minimum:** 13+ (NDEF read), 14.5+ (write)

#### Kullanım senaryoları

1. **Etkinlik check-in NFC** — Etkinlik girişinde NFC etiketi okutarak
2. **Görev doğrulama** — Gönüllülük görev tamamlandığında NFC etiketiyle onay
3. **STK masası NFC** — Bağış/kayıt sayfasını açan etiket

#### Etiket içeriği

NDEF URL record: `https://hangel.org.tr/checkin/{eventId}` veya `/donate/{ngoId}` veya `/task/{taskId}`

Universal Link handler zaten kuruluysa (Faz 0.5) → NFC okutma → URL açılır → app açılır → ilgili sayfa render olur.

#### iOS native

1. **Apple Developer Console:** Identifiers → `com.hangel.ios.app` → Capabilities → **Near Field Communication Tag Reading** ✓
2. **Xcode:** Signing & Capabilities → "+" → Near Field Communication Tag Reading
3. **Info.plist:**
```xml
<key>NFCReaderUsageDescription</key>
<string>Etkinlik check-in ve görev doğrulama için NFC etiketlerini okutmamız gerekiyor.</string>
<key>com.apple.developer.nfc.readersession.formats</key>
<array>
  <string>NDEF</string>
  <string>TAG</string>
</array>
```

4. **Plugin install:**
```bash
npm install @capawesome-team/capacitor-nfc
npx cap sync ios
```

#### Web/JS

```ts
// src/lib/native-nfc.ts
import { Nfc, NfcUtils } from '@capawesome-team/capacitor-nfc';
import { Capacitor } from '@capacitor/core';

export async function startNfcScan(onUrl: (url: string) => void): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  await Nfc.startScanSession({ keepSessionOpen: false });
  Nfc.addListener('nfcTagScanned', (event) => {
    const url = event.nfcTag.message?.records.find(r => r.tnf === 1 /* NFC_WELL_KNOWN */ )?.payload;
    if (url) {
      const decoded = NfcUtils.convertBytesToString({ bytes: url });
      onUrl(decoded.text);
    }
  });
}
```

#### Backend — NFC etiket yazma akışı

STK admin paneline ("/ngo-admin/nfc-tags" yeni sayfa) eklenir:
- Liste: STK'nın oluşturduğu NFC etiketleri (tip: event-checkin | donate | task-verify)
- "+ Etiket Oluştur" → form → backend Firestore'a `nfcTags/{id}` yazar
- Etiket fiziksel olarak yazılır (ya manuel NFC writer app ile ya da admin'in cihazından `Nfc.write()` plugin metoduyla)

#### Done definition

- [ ] iPhone arkasını NFC etiketine yaklaştırınca app açılır
- [ ] Etkinlik check-in URL'i NFC ile çalışır
- [ ] Bağış sayfası NFC ile açılır
- [ ] STK admin paneli NFC etiketi oluşturma + yazma

---

### 7.3. Siri Shortcuts

**Apple framework:** AppIntents (iOS 16+)
**iOS minimum:** 16+

#### 4 Shortcut

1. "Yakındaki etkinlikleri göster" — `ShowNearbyEventsIntent`
2. "Yakındaki gönüllülük fırsatlarını göster" — `ShowVolunteerOpportunitiesIntent`
3. "Görevlerimi göster" — `ShowMyTasksIntent`
4. "Acil kan ihtiyaçlarını göster" — `ShowBloodRequestsIntent`

#### iOS native

1. Xcode → ana target → File → New File → **Swift File** → İsim: `HangelAppIntents.swift`

```swift
import AppIntents
import SwiftUI

struct ShowNearbyEventsIntent: AppIntent {
    static var title: LocalizedStringResource = "Yakındaki etkinlikleri göster"
    static var description = IntentDescription("Konumuna göre yakındaki gönüllülük etkinliklerini açar")
    static var openAppWhenRun: Bool = true

    @MainActor
    func perform() async throws -> some IntentResult {
        guard let url = URL(string: "hangel://events/nearby") else {
            return .result()
        }
        await UIApplication.shared.open(url)
        return .result()
    }
}

struct ShowVolunteerOpportunitiesIntent: AppIntent {
    static var title: LocalizedStringResource = "Yakındaki gönüllülük fırsatlarını göster"
    static var openAppWhenRun: Bool = true
    @MainActor
    func perform() async throws -> some IntentResult {
        await UIApplication.shared.open(URL(string: "hangel://volunteer/nearby")!)
        return .result()
    }
}

struct ShowMyTasksIntent: AppIntent {
    static var title: LocalizedStringResource = "Görevlerimi göster"
    static var openAppWhenRun: Bool = true
    @MainActor
    func perform() async throws -> some IntentResult {
        await UIApplication.shared.open(URL(string: "hangel://tasks")!)
        return .result()
    }
}

struct ShowBloodRequestsIntent: AppIntent {
    static var title: LocalizedStringResource = "Acil kan ihtiyaçlarını göster"
    static var openAppWhenRun: Bool = true
    @MainActor
    func perform() async throws -> some IntentResult {
        await UIApplication.shared.open(URL(string: "hangel://emergency/blood")!)
        return .result()
    }
}

struct HangelAppShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(intent: ShowNearbyEventsIntent(), phrases: [
            "Hangel'da yakındaki etkinlikleri göster",
            "Hangel'da etkinlik bul",
        ], shortTitle: "Yakındaki Etkinlikler", systemImageName: "calendar")
        AppShortcut(intent: ShowBloodRequestsIntent(), phrases: [
            "Hangel'da acil kan ihtiyaçlarını göster",
            "Acil kan ihtiyacı",
        ], shortTitle: "Acil Kan", systemImageName: "drop.fill")
        // ...
    }
}
```

2. **Custom URL scheme** — Info.plist:
```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLName</key>
    <string>com.hangel.ios.app</string>
    <key>CFBundleURLSchemes</key>
    <array><string>hangel</string></array>
  </dict>
</array>
```

3. **AppDelegate** custom scheme'i Capacitor'a yönlendirir (zaten yapıyor).

4. **Web** tarafında scheme handling — `src/lib/native-bridge.ts`'te `appUrlOpen` listener'ı zaten var (Universal Link için), bu `hangel://` scheme'lerini de yakalar.

#### Test senaryoları

- "Hey Siri, Hangel'da yakındaki etkinlikleri göster" → app açılır, etkinlikler sayfası render
- iOS Shortcuts uygulamasında Hangel altyatkı görünür (4 shortcut otomatik)
- Spotlight'ta "Hangel etkinlikleri" araması → shortcut görünür

#### Done definition

- [ ] 4 Siri Shortcut iOS Settings → Siri & Search → Hangel'da görünür
- [ ] Her shortcut çalıştırılınca app doğru sayfaya açılır
- [ ] iOS 16+ test edildi

---

### 7.4. Spotlight Entegrasyonu

**Apple framework:** CoreSpotlight
**iOS minimum:** 9+

#### İndekslenecekler

1. STK profilleri (~10K)
2. Etkinlikler (~5K aktif)
3. Bağış kampanyaları (~500 aktif)
4. Gönüllülük fırsatları (~2K aktif)

#### Custom Capacitor Plugin

```swift
import Foundation
import Capacitor
import CoreSpotlight
import MobileCoreServices

@objc(HangelSpotlightPlugin)
public class HangelSpotlightPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "HangelSpotlightPlugin"
    public let jsName = "HangelSpotlight"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "indexItems", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "deindexItems", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "deindexAll", returnType: CAPPluginReturnPromise),
    ]

    @objc func indexItems(_ call: CAPPluginCall) {
        guard let items = call.getArray("items") else {
            call.reject("Missing items")
            return
        }
        var spotlightItems: [CSSearchableItem] = []
        for item in items {
            guard let dict = item as? [String: Any],
                  let id = dict["id"] as? String,
                  let title = dict["title"] as? String,
                  let domain = dict["domain"] as? String else { continue }
            let attrs = CSSearchableItemAttributeSet(itemContentType: kUTTypeText as String)
            attrs.title = title
            attrs.contentDescription = dict["description"] as? String
            attrs.keywords = dict["keywords"] as? [String]
            if let thumbUrl = dict["thumbnailUrl"] as? String, let url = URL(string: thumbUrl) {
                attrs.thumbnailURL = url
            }
            let sItem = CSSearchableItem(uniqueIdentifier: id, domainIdentifier: domain, attributeSet: attrs)
            sItem.expirationDate = .distantFuture
            spotlightItems.append(sItem)
        }
        CSSearchableIndex.default().indexSearchableItems(spotlightItems) { err in
            if let e = err { call.reject(e.localizedDescription) } else { call.resolve() }
        }
    }

    @objc func deindexItems(_ call: CAPPluginCall) {
        guard let ids = call.getArray("ids") as? [String] else { call.reject("Missing ids"); return }
        CSSearchableIndex.default().deleteSearchableItems(withIdentifiers: ids) { err in
            if let e = err { call.reject(e.localizedDescription) } else { call.resolve() }
        }
    }

    @objc func deindexAll(_ call: CAPPluginCall) {
        CSSearchableIndex.default().deleteAllSearchableItems { err in
            if let e = err { call.reject(e.localizedDescription) } else { call.resolve() }
        }
    }
}
```

#### Web/JS — Periyodik sync

```ts
// src/lib/spotlight-sync.ts
import { Capacitor, registerPlugin } from '@capacitor/core';

interface SpotlightPlugin {
  indexItems(opts: { items: SpotlightItem[] }): Promise<void>;
  deindexAll(): Promise<void>;
}
interface SpotlightItem {
  id: string;
  title: string;
  description?: string;
  keywords?: string[];
  thumbnailUrl?: string;
  domain: 'ngo' | 'event' | 'campaign' | 'volunteer';
}

const HangelSpotlight = registerPlugin<SpotlightPlugin>('HangelSpotlight');

export async function syncSpotlight() {
  if (!Capacitor.isNativePlatform()) return;
  const items: SpotlightItem[] = [];
  // Fetch from Firestore (limit/paginate)
  const ngos = await fetchAllNgos();
  ngos.forEach(n => items.push({
    id: `ngo:${n.id}`, title: n.name, description: n.shortDescription,
    keywords: n.tags, thumbnailUrl: n.logoUrl, domain: 'ngo',
  }));
  // events, campaigns, volunteers benzer
  await HangelSpotlight.indexItems({ items });
}
```

#### AppDelegate / Capacitor — Search result tap handling

Spotlight tap → app açılır → `NSUserActivity` ile `uniqueIdentifier` gelir → ilgili sayfaya yönlendir.

```swift
// AppDelegate.swift
func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
    if userActivity.activityType == CSSearchableItemActionType,
       let id = userActivity.userInfo?[CSSearchableItemActivityIdentifier] as? String {
        // id format: "ngo:abc123" veya "event:xyz789"
        let parts = id.split(separator: ":")
        if parts.count == 2 {
            let path = "/\(parts[0])/\(parts[1])"
            NotificationCenter.default.post(name: .init("hangelOpenPath"), object: nil, userInfo: ["path": path])
            // WebView'da bu path'e git
        }
    }
    return true
}
```

#### Done definition

- [ ] iOS Spotlight (ana ekran sağa kaydır) → "Kızılay" arayınca Kızılay STK görünür
- [ ] Tap → Hangel app açılır → Kızılay STK sayfası render
- [ ] Index sayısı: tüm aktif STK + etkinlik + kampanya
- [ ] 24 saatte bir resync

---

## 8. Faz 3 — Web tarafı

Bu faz **iOS native kod gerektirmez**, tamamen Next.js + Firebase. Mevcut Hangel ekibinin de yapabileceği bir faz; bu brief'te freelancer da yapabilsin diye dahil edilmiştir.

### 8.1. Sosyal Etki Pasaportu

**Lokasyon:** `/passport` sayfası

#### Veri modeli

```
users/{uid}/passport (single doc, aggregated)
{
  totalVolunteerHours: number,
  totalEvents: number,
  totalCampaigns: number,
  totalDonationsTry: number,
  certificates: Certificate[],
  badges: Badge[],
  impactScore: number,
  lastUpdatedAt: Timestamp
}
```

Aggregation: Cloud Function her event/donation/check-in event'inde `passport` doc'unu günceller (atomic increment).

#### Önerilen UI

- Üst banner: kullanıcı adı + büyük "Sosyal Etki Puanı" rakamı + rozet sayısı
- Stat grid (4 kart): Saat / Etkinlik / Kampanya / Bağış
- Sertifikalar listesi (her sertifika PDF download butonlu)
- Rozetler grid (renkli icon'lar)
- "Pasaportumu paylaş" → social share (web share API + native share)
- **Apple Wallet pass eklemek:** Yıl sonu özeti olarak Wallet pass (Faz 1.2'deki PassKit kullanılır)

#### Done definition

- [ ] `/passport` sayfası kullanıcı için render olur
- [ ] Sertifikalar PDF olarak indirilebilir
- [ ] Wallet pass eklenebilir
- [ ] Paylaş butonu çalışır

---

### 8.2. Gönüllü Kariyer Karnesi

**Lokasyon:** `/career` sayfası

#### Veri modeli

```
users/{uid}/career (single doc)
{
  competencies: { [name: string]: 'beginner'|'intermediate'|'advanced'|'expert' },
  completedTasks: Task[],
  trainings: Training[],
  certificates: Certificate[],
  leadershipExperiences: Experience[],
  lastUpdatedAt: Timestamp
}
```

#### Önerilen UI

- LinkedIn benzeri profil görünüm
- Yetkinlikler: bar chart + endorsement (başka gönüllülerin onayı)
- Tamamlanan görevler timeline (en yeniden eskiye)
- Eğitimler listesi (Hangel kütüphanesinden alınanlar + dışarıdan)
- Sertifikalar (PDF download)
- Liderlik deneyimleri (proje yönetimi, koordinatörlük vs)
- "PDF'e Dönüştür" → API'den PDF oluştur (puppeteer veya pdfkit)
- LinkedIn'e ekleme entegrasyonu (LinkedIn API)

#### Done definition

- [ ] `/career` sayfası render olur
- [ ] PDF olarak indirilebilir
- [ ] LinkedIn'e paylaşılabilir (basic share)
- [ ] Yetkinlik endorse mekanizması

---

### 8.3. Impact Replay (Spotify Wrapped tarzı)

**Lokasyon:** `/replay/{year}` sayfası, yıl sonunda (Aralık 15) push ile duyurulur

#### Görsel akış

1. Splash: "2026 Hangel Senin Yılın"
2. Toplam gönüllülük saati (animated counter)
3. Toplam bağış (TL)
4. En çok katıldığın STK
5. En çok katıldığın etkinlik tipi
6. Yardım edilen kişi sayısı (yaklaşık)
7. Rozet kazanımları
8. Karşılaştırma: "Türkiye gönüllülerinin %X'inden daha aktifsin"
9. Paylaş ekranı (Instagram story uyumlu 9:16 image generate)

#### Teknik

- Mevcut Firebase verisi üzerinde aggregation (Cloud Function veya Firestore aggregate query)
- UI: Framer Motion ile animasyonlar
- Share: `html2canvas` + `@capacitor/share` ile native sheet

#### Done definition

- [ ] Yıl sonu Aralık 15'te tüm kullanıcılara push gönderilir
- [ ] `/replay/2026` sayfası kişiselleştirilmiş animasyonlu render olur
- [ ] Instagram story image (1080x1920) generate olur
- [ ] Native share sheet ile paylaşılır

---

### 8.4. Mikro Gönüllülük Sistemi

**Lokasyon:** `/micro` sayfası + push notifications

#### Görev tipleri

5-30 dakikalık görevler — örnek:
- "Mahallene en yakın çöp toplama noktasını fotoğrafla" (5 dk)
- "Bir engelliye yardım et, kanıt fotoğrafı çek" (15 dk)
- "Yaşlı bir komşuna alışveriş yap" (30 dk)
- "Sokaktaki köpeğe su bırak" (5 dk)

#### Veri modeli

```
microTasks/{id}
{
  title: string,
  description: string,
  estimatedMinutes: number,
  category: 'environment'|'elderly'|'animals'|'children'|'other',
  ngoId?: string,
  location?: { lat, lng, radiusKm },
  reward: { points: number, badgeId?: string },
  active: boolean,
  createdAt: Timestamp,
}

microTaskCompletions/{id}
{
  uid: string,
  taskId: string,
  proofPhotoUrl?: string,
  completedAt: Timestamp,
  verifiedAt?: Timestamp,
  verifiedBy?: string,
}
```

#### Konuma göre öneri

Cloud Function her saat çalışır:
- Aktif kullanıcılar (son 7 gün giriş)
- Konumlarına 5 km içinde aktif mikro görev varsa push gönder:
  - "📍 5 dk'lık görev: Yakınında bir engelliye yardım etme fırsatı var"
  - Link: `/micro/{taskId}`

#### Done definition

- [ ] `/micro` sayfası — açık görevler listesi
- [ ] Konum bazlı push (1/gün max per kullanıcı)
- [ ] Görev tamamlama: foto upload + verification
- [ ] Puan + rozet sistemi pasaport'a yansır

---

## 9. Faz 4 — Cihaz genişletme

### 9.1. Apple Watch app

**Apple framework:** WatchKit, WatchConnectivity
**watchOS minimum:** 10+

#### Mimari

**Bağımsız Watch app** (Companion mode değil) — Watch tek başına internet'e bağlanır.

#### Xcode adımlar

1. File → New → Target → **watchOS** → **App** → İsim: `HangelWatch`
2. "Include Notification Scene" ✓
3. "Include Complication" ✓
4. Bundle ID: `com.hangel.ios.app.watchkitapp`

#### Watch UI ekranları

1. **Ana ekran (`ContentView`):** 4 buton — Görevlerim / Acil Kan / Etkinlikler / Pasaport
2. **Görevlerim:** Bugünün görev listesi (Firestore'dan), tap → detay
3. **Acil Kan:** Yakındaki açık ilanlar (konum), tap → "Yardım Et" butonu
4. **Etkinlik Check-in:** Etkinlik listesi + check-in butonu (geofence varsa otomatik tetik)
5. **Bildirimler:** Push notification gelince Watch'ta gösterilir, action buttons (Yardım Et / Reddet)

#### Code skeleton

```swift
// HangelWatch/HangelWatchApp.swift
import SwiftUI
import FirebaseCore

@main
struct HangelWatchApp: App {
    init() { FirebaseApp.configure() }
    var body: some Scene {
        WindowGroup { ContentView() }
    }
}

struct ContentView: View {
    var body: some View {
        NavigationStack {
            List {
                NavigationLink("Görevlerim", destination: TasksView())
                NavigationLink("Acil Kan", destination: BloodRequestsView())
                NavigationLink("Etkinlikler", destination: EventsView())
                NavigationLink("Pasaport", destination: PassportView())
            }
            .navigationTitle("Hangel")
        }
    }
}

struct TasksView: View {
    @State var tasks: [Task] = []
    var body: some View {
        List(tasks) { task in
            VStack(alignment: .leading) {
                Text(task.title).font(.headline)
                Text(task.ngoName).font(.caption)
            }
        }
        .onAppear { Task { await loadTasks() } }
    }
    func loadTasks() async { /* Firestore query */ }
}
```

#### Watch Notification Scene

```swift
// HangelWatch/NotificationView.swift
import SwiftUI
import UserNotifications

struct NotificationView: View {
    @State var emergencyType: String = ""
    @State var location: String = ""
    var body: some View {
        VStack {
            Text("🩸 Acil Kan İhtiyacı").font(.headline)
            Text(emergencyType).font(.title3)
            Text(location).font(.caption)
            HStack {
                Button("Yardım Et") { /* deep link → iPhone */ }
                Button("Şu an uzakta") { /* dismiss */ }
            }
        }
    }
}
```

#### Done definition

- [ ] Apple Watch app yüklenir + ana ekranda Hangel görünür
- [ ] Görev listesi + Acil kan listesi Firestore'dan gelir
- [ ] Acil kan push notification Watch'ta görünür + action buttons çalışır
- [ ] Etkinlik check-in Watch'tan yapılabilir
- [ ] Complication (saat üzerinde): bugünün açık görev sayısı

---

### 9.2. iPad + Mac desteği

#### iPad

1. **Xcode:** ana target → General → Deployment Info → **iPhone + iPad** ✓
2. Capacitor `capacitor.config.ts` zaten universal device family destekliyor
3. Web tarafında responsive testing:
   - iPad portrait 1024×1366
   - iPad landscape 1366×1024
   - Sidebar layout for `/ngo-admin/*` (zaten muhtemelen responsive ama test edilmeli)
4. **iPad-spesifik UI**: Yönetim paneli iPad'de iki sütun (sidebar + content) ideal — mevcut layout'u test et

#### Mac

**Apple Silicon Mac:** Sıfır kod — App Store Connect'te ayar:

1. App Store Connect → Hangel → App Information → "Mac" sekmesi (Apple Silicon only)
2. ✓ "Make this iPad app available on Mac"
3. App Store Mac'te "iPhone & iPad Apps" sekmesinde görünür

**Mac Catalyst (opsiyonel, daha native look):**

1. Xcode → ana target → General → Supported Destinations → **Mac (Designed for iPad)** veya **Mac Catalyst**
2. Capacitor 8 Mac Catalyst destekler
3. Kod değişikliği: minimal (sidebar collapse, hover states)

**Native Mac app (önerilmiyor):**
- 30+ gün ekstra iş
- ROI düşük (Hangel kullanıcılarının %95'i mobile)

#### Done definition

- [ ] iPad'de portrait + landscape düzgün render
- [ ] iPad-optimized layout `/ngo-admin/*` için (2 sütun)
- [ ] Apple Silicon Mac'te "iPad app on Mac" olarak çalışır
- [ ] Mac Catalyst opsiyonel (zaman varsa)

---

## 10. Genel teknik standartlar

### 10.1. Kod stili

- **TypeScript strict mode** (`tsconfig.json`'da zaten aktif)
- **No `as any`** — alternatif: zod parse, `as const`, type narrowing
- **No `@ts-ignore`** — gerçek tip hatasını çöz
- **No `console.log`** üretim kodunda — `console.warn`/`console.error` allowed
- **No `dangerouslySetInnerHTML`** — sanitize zorunlu
- **Türkçe metinler** — `src/lib/translations.ts`'e ekle, hardcoded değil
- **Swift naming** — Apple Swift API Design Guidelines

### 10.2. Test

- **Web:** `npm run typecheck && npm run lint && npm run test`
- **iOS unit:** XCTest (her plugin için minimal test)
- **iOS UI:** XCUITest (Faz 1+ kritik akışlar için)
- **E2E:** Cypress veya Playwright (web), Maestro (mobile)
- **Firestore rules:** `npm run test:rules` (emulator)

### 10.3. Security

- **Firestore rules:** Her yeni koleksiyon için `firestore.rules`'a kural ekle, test yaz
- **Secrets:** `apphosting.yaml` env variables (Secret Manager), env'i kodda hard-code etme
- **APNs key:** Firebase Functions environment veya Secret Manager
- **PassKit cert:** Aynı şekilde
- **OAuth keys:** Apple Developer Services ID, Firebase config'te

### 10.4. Performance

- iOS bundle size: 200 MB altı (App Store limit), gerçekçi hedef <100 MB
- App Clip size: 15 MB altı (Apple limit)
- Cold start: <2s (TTI)
- Firestore query: max 30 dokuman per fetch
- Image: WebP veya AVIF (Next.js Image component)

### 10.5. Logging + Analytics

- **Firebase Analytics events:** Faz 0'da etkinleştir, anlamlı event'ler:
  - `sign_up`, `login`, `donate_complete`, `event_register`, `task_complete`, `share`
- **Crashlytics:** Tüm fatal + non-fatal exception logla
- **Performance:** Faz 0'da Firebase Performance Monitoring ekle

---

## 11. Done definition + teslim

### Her özellik için "Done" sayılması için:

1. ✅ Apple Developer Console + Firebase Console ayarları yapıldı
2. ✅ Web + iOS native kod yazıldı
3. ✅ Backend (Firestore + Cloud Functions + API routes) yazıldı
4. ✅ Unit test + integration test geçer
5. ✅ TestFlight'a yüklendi + internal test edildi (en az 3 cihaz: iPhone 14+, iPhone XR, iPad)
6. ✅ App Review checklist (bölüm 12) tamamlandı
7. ✅ Hangel ürün ekibi tarafından kabul edildi (sign-off)
8. ✅ Production'a deploy edildi

### Teslim formatı

- **Pull Request** ana Hangel repo'suna (her özellik bir PR)
- PR açıklamasında: ne yapıldı + nasıl test edilir + Apple Developer/Firebase Console adımları
- PR review: Hangel ekibi (ürün + tech lead)
- Merge sonrası: Codemagic otomatik build + TestFlight upload

### Final teslim paketi

1. Tüm PR'lar merge edildi
2. App Store Connect'te yeni IPA submit edildi + onaylandı
3. Apple Watch app submit edildi (Faz 4)
4. App Clip submit edildi (Faz 2)
5. Dokümantasyon: `docs/ios-implementation-notes.md` (freelancer'ın eklediği teknik notlar)
6. Apple Developer Console + Firebase Console ekran görüntüleri (audit için)

---

## 12. Apple Review kontrol listesi

Submission öncesi:

- [ ] Sign in with Apple aktif (Guideline 4.8)
- [ ] Privacy Manifest dosyası var (`PrivacyInfo.xcprivacy`)
- [ ] App Privacy bölümü App Store Connect'te dolu + Privacy Manifest ile tutarlı
- [ ] ATT prompt görünüyor (Firebase Analytics IDFA kullanıyor)
- [ ] Test account App Review için sağlandı (email + parola)
- [ ] Demo video (özellikle Live Activity, App Clip, Watch için Apple Review'a yardımcı)
- [ ] Push notification "for crash report" değil "for engagement" yazıyor
- [ ] Background location kullanımı sebep net açıklanıyor
- [ ] NFC kullanımı sebep net açıklanıyor
- [ ] App Clip Card image + title + description guideline'lara uygun
- [ ] In-App Purchase: nonprofit bağış için **IAP yok**, N-Kolay PSP üzerinden (Apple Review burayı sorabilir; Apple Guideline 3.2.1(vi) nonprofit'leri exempt eder)
- [ ] App icon 1024×1024 transparent değil, beyaz arkaplan
- [ ] Launch screen sade (Apple branding'i içermiyor)
- [ ] Beta uygulama placeholder text yok ("Lorem ipsum")
- [ ] Crashlytics test crash kayıtlı (sembolikleştirme çalışıyor)

---

## 13. Bilinen riskler

| # | Risk | Olasılık | Etki | Azaltma |
|---|------|----------|------|---------|
| R1 | Live Activity push (apns-push-type: liveactivity) Firebase Functions tarafından desteklenmiyor → custom APNs implementation gerek | Yüksek | Orta | Firebase Functions'tan APNs HTTP/2'ye doğrudan POST (kod örneği §6.1'de) |
| R2 | App Clip Capacitor + WebView ile Apple Review reject | Yüksek | Yüksek | App Clip bağımsız SwiftUI olarak yaz (§7.1 mimari karar) |
| R3 | Apple Sign In kayıt akışı mevcut phone/email duplicate prevention'ı bozabilir | Orta | Orta | Mevcut duplicate detection flow'unu Apple Sign In'a da uygula (mevcut `check-registration` endpoint'i reuse) |
| R4 | PassKit Pass update web service kompleks (Apple zorunlu endpoint'ler) | Orta | Orta | Apple'ın referans implementation'ını kullan, `passkit-generator` örnek server kod sağlıyor |
| R5 | NFC etiketleri fiziksel olarak yazılmalı — STK adminlerine eğitim gerek | Düşük | Düşük | Admin paneli içinde NFC yazma akışı + video tutorial |
| R6 | Background location entitlement Apple Review'ı sıkı denetler | Orta | Yüksek | Sebebi net açıkla + alternative (manual checkout) sun |
| R7 | Apple Watch app Firebase SDK boyutu Watch limit'i zorlayabilir | Düşük | Düşük | Watch'ta sadece minimal Firebase modülleri (Auth + Firestore) |
| R8 | Spotlight indeksleme 10K+ STK için periyodik resync maliyet/performans | Düşük | Düşük | Incremental sync (sadece değişenler) + max 5K item limit |
| R9 | Codemagic free tier ay sonu builds biterse | Yüksek | Düşük | $30/ay Pro plan |
| R10 | Sonoma upgrade bekleyen Mac issue (ürün ekibinin Mac'i) | Yüksek | Düşük | Codemagic ile freelancer kendi Mac'inden bağımsız çalışır |

---

## 14. Backend Firestore schema değişiklikleri

### Yeni koleksiyonlar

```
liveActivityTokens/{tokenId}
  uid: string
  activityId: string                   // ActivityKit Activity.id
  pushToken: string                    // APNs push token
  type: 'emergency-blood'|'volunteer-task'|'event-countdown'|'donation-campaign'
  referenceId: string                  // emergencyBloodId, taskId, eventId, campaignId
  startedAt: Timestamp
  expiresAt: Timestamp

passkitRegistrations/{regId}
  passTypeIdentifier: string           // 'pass.com.hangel.ios.app'
  serialNumber: string                 // event/task ID
  deviceLibraryIdentifier: string
  pushToken: string
  registeredAt: Timestamp

nfcTags/{tagId}
  id: string
  ownerNgoId: string
  type: 'event-checkin'|'donate'|'task-verify'
  referenceId: string                  // eventId, ngoId, taskId
  url: string                          // 'https://hangel.org.tr/checkin/...'
  createdAt: Timestamp
  writtenAt: Timestamp | null
  writtenBy: string | null             // admin uid

users/{uid}/passport (single doc)
  totalVolunteerHours: number
  totalEvents: number
  totalCampaigns: number
  totalDonationsTry: number
  certificates: Certificate[]
  badges: Badge[]
  impactScore: number
  lastUpdatedAt: Timestamp

users/{uid}/career (single doc)
  competencies: { [name: string]: 'beginner'|'intermediate'|'advanced'|'expert' }
  completedTasks: Task[]
  trainings: Training[]
  certificates: Certificate[]
  leadershipExperiences: Experience[]
  lastUpdatedAt: Timestamp

microTasks/{id}
  title: string
  description: string
  estimatedMinutes: number
  category: string
  ngoId?: string
  location?: { lat, lng, radiusKm }
  reward: { points: number, badgeId?: string }
  active: boolean
  createdAt: Timestamp

microTaskCompletions/{id}
  uid: string
  taskId: string
  proofPhotoUrl?: string
  completedAt: Timestamp
  verifiedAt?: Timestamp
  verifiedBy?: string

events/{eventId}/checkins/{uid}
  uid: string
  checkedInAt: Timestamp
  checkedOutAt: Timestamp | null
  method: 'qr'|'nfc'|'manual'
  location: { lat, lng, accuracy }
```

### Mevcut koleksiyonlara eklenecek alanlar

```
users/{uid}
  ... (mevcut alanlar)
  appleUserId?: string                 // Apple Sign In identifier
  appleEmail?: string                  // private relay olabilir

users/{uid}/fcmTokens/{token}
  ... (mevcut)
  type: 'web'|'native'                 // YENİ — discrimination için
  platform: 'web'|'ios'|'android'      // YENİ

emergencyBlood/{id}
  ... (mevcut)
  liveActivityToken?: string           // YENİ

events/{eventId}
  ... (mevcut)
  coordinates?: { lat: number, lng: number }   // YENİ (geofence için)
  walletPassPushToken?: string         // YENİ

notifications/{id}
  ... (mevcut)
  appleRichActions?: AppleRichAction[]  // YENİ (Rich Push için, opsiyonel)
```

### Firestore rules güncellemeleri

```
match /liveActivityTokens/{tokenId} {
  allow read: if request.auth != null && resource.data.uid == request.auth.uid;
  allow create: if request.auth != null && request.resource.data.uid == request.auth.uid;
  allow delete: if request.auth != null && resource.data.uid == request.auth.uid;
}

match /passkitRegistrations/{regId} {
  // Backend tarafından yönetilir
  allow read, write: if false;
}

match /nfcTags/{tagId} {
  allow read: if request.auth != null;
  allow create, update, delete: if request.auth != null
    && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'ngo-admin'
    && request.resource.data.ownerNgoId == get(/databases/$(database)/documents/users/$(request.auth.uid)).data.ngoId;
}

match /users/{uid}/passport {
  allow read: if request.auth != null && (request.auth.uid == uid || resource.data.public == true);
  allow write: if false; // Cloud Function only
}

// vs.
```

---

## 15. İletişim ve raporlama

### Haftalık demo

- Pazartesi 11:00 Türkiye saati (15 dk standup + 30 dk demo)
- Zoom/Meet
- Önceki hafta tamamlananlar + bu hafta planı + blockerlar

### Acil iletişim

- **Slack/Discord:** Hangel ekibi sağlar (kanal: `#freelancer-ios`)
- **Email:** ismailhilmi@hangel.org
- **WhatsApp:** Acil sorunlar için

### Git workflow

- **Branch naming:** `feature/ios-{faz}-{özellik-kısa-ad}` (örn. `feature/ios-1-live-activities`)
- **Commit message:** Conventional Commits (`feat:`, `fix:`, `chore:`)
- **PR template:** Hangel repo'sunda mevcut, doldur
- **Code review:** Hangel ekibi (1-2 reviewer)
- **Merge:** Squash + merge

### Deploy

- **Web (Next.js):** PR merge sonrası App Hosting otomatik build
- **iOS:** Codemagic merge sonrası otomatik TestFlight upload
- **Production submission:** Hangel ürün ekibi onayıyla App Store Connect → Submit for Review

### Faz teslim raporları

Her faz sonunda **freelancer aşağıdaki dokümanı sağlar:**

```markdown
# Faz N Teslim Raporu

## Tamamlananlar
- [ ] Özellik 1 — PR #X, merge edildi
- [ ] Özellik 2 — PR #Y, review bekliyor

## TestFlight
- Build numarası: 1.X.Y (NN)
- Test cihazları: iPhone 14 Pro (iOS 18), iPhone XR (iOS 17), iPad Air (iOS 17)

## Apple Developer Console değişiklikleri
- [ ] Capability A eklendi
- [ ] Sertifika B yenilendi

## Firebase Console değişiklikleri
- [ ] APNs key yüklendi
- [ ] Crashlytics aktif

## Bilinen sorunlar
- ... (eğer varsa)

## Sonraki faz için önkoşullar
- ... (Hangel ekibinden bekleyenler)
```

---

## Ek A: Önerilen geliştirme sırası (haftalık plan)

**Hafta 1-2:** Codemagic kurulum + Faz 0 başlat (Sign in with Apple + Privacy Manifest)
**Hafta 3-4:** Faz 0 devam (Push + Geolocation + Universal Links + ATT)
**Hafta 5:** Faz 0 bitir (Crashlytics) + Faz 1 başlat (Widgets)
**Hafta 6-7:** Widgets bitir + Live Activities başlat
**Hafta 8-9:** Live Activities + Wallet Biletler
**Hafta 10:** Akıllı Check-in
**Hafta 11-12:** Faz 1 buffer + bugfix + 1. IPA submission (Apple Review)
**Hafta 13:** App Clip başlat
**Hafta 14-15:** App Clip + NFC
**Hafta 16:** Siri Shortcuts + Spotlight
**Hafta 17:** Faz 2 buffer + 2. IPA submission
**Hafta 18-19:** Faz 3 başlat (Pasaport + Kariyer Karnesi)
**Hafta 20-21:** Faz 3 devam (Impact Replay + Mikro Gönüllülük)
**Hafta 22:** Faz 3 buffer (sadece web — submission yok)
**Hafta 23-25:** Faz 4 — Apple Watch app
**Hafta 26:** iPad + Mac optimization
**Hafta 27-28:** Faz 4 buffer + 3. IPA + Watch submission
**Hafta 29-30:** Total system testing + Apple Review döngüleri + bugfix

**Toplam: ~30 hafta = 7.5 ay** (tek dev full-time, Apple Review bekleme dahil)

---

## Ek B: Hangel ürün ekibi sorumlulukları

Freelancer'ın yapamayacağı / Hangel ekibinden bekleyenler:

1. **Apple Developer Console erişimi** — Team admin'in freelancer'ı Developer veya Marketing role ile invite etmesi
2. **Firebase Console erişimi** — Project owner'ın freelancer'ı Editor role ile invite etmesi (Auth, Firestore, Functions için)
3. **GitHub repo erişimi** — Write access
4. **App Store Connect erişimi** — App Manager role
5. **Codemagic ödemesi** — Pro plan ($30/ay) onayı
6. **Apple Sign In Services ID** — Hangel admin oluşturacak (Apple Developer Console'da)
7. **APNs Auth Key (.p8)** — Hangel admin indirip freelancer'a güvenli paylaşır (Bitwarden veya 1Password)
8. **PassKit Pass Type ID + sertifika** — Hangel admin oluşturup .p12 paylaşır
9. **Apple WWDR Cert** — Apple'ın root cert'i, public ama paylaşılması kolaylık
10. **Test account** — Apple Review için fake test kullanıcısı (Hangel ekibi sağlar)
11. **App Store Connect metadata** — Açıklama, screenshot, keywords (Hangel ürün ekibi yazar; freelancer screenshot generator kullanır)
12. **Privacy Policy + Terms URL** — Hangel ekibi günceller (Apple Sign In + ATT için ek metinler)
13. **N-Kolay PSP entegrasyonu** — Mevcut, freelancer dokunmaz

---

## Ek C: Kaçınılacak şeyler (do-not-touch)

Freelancer aşağıdaki alanlara **dokunmamalı**:

- `firestore.rules` — yeni rule eklenebilir ama mevcut rule değiştirilemez (Hangel ekibi review etmeli)
- `src/lib/payment/**` — N-Kolay entegrasyonu, payment flow Hangel'in core'u
- `src/app/api/admin/**` — super-admin route'ları
- `src/ai/flows/**` — Genkit AI flow'ları (Hangel ekibinin alanı)
- `src/firebase/config.ts` — Firebase proje config (değiştirme)
- `apphosting.yaml` — production env variables (sadece yeni ekleme, mevcut değiştirme yok)
- `.env*` — secrets (asla commit'leme)
- `src/lib/translations.ts` — sadece **yeni Türkçe metin ekle**, mevcut metinleri silme/değiştirme

---

**SON.** Bu belge freelancer için kapsayıcıdır. Soru/karar gereken yerler `❓ KARAR` etiketiyle işaretlenmiştir; Hangel ürün ekibi (ismailhilmi@hangel.org) ile haftalık demo'da netleştirilmelidir.
