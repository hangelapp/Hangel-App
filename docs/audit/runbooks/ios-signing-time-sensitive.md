# iOS Signing — Time Sensitive Notifications Workaround

**Last updated:** 2026-06-01
**Status:** Method A (Xcode automatic signing) deployed to codemagic.yaml.
Method B (manual .mobileprovision upload) is the fallback if Method A fails.

## Problem

`com.apple.developer.usernotifications.time-sensitive` entitlement is **not in
Apple's App Store Connect API managed capability list**. The endpoint
`POST /v1/bundleIdCapabilities` returns 400 / "INVALID_VALUE" when you try to
add `USERNOTIFICATIONS_TIMESENSITIVE` (this constant exists in Apple docs but
the actual API enforcement is missing).

Codemagic's `app-store-connect fetch-signing-files` uses this same App Store
Connect API endpoint to provision profiles. So any profile it creates **lacks
the time-sensitive entitlement**. When `xcodebuild` then tries to sign the
app — which has `com.apple.developer.usernotifications.time-sensitive = true`
in `App.entitlements` — it fails:

```
error: Provisioning profile "iOS Team Provisioning Profile: com.hangel.ios.app"
doesn't include the com.apple.developer.usernotifications.time-sensitive
entitlement.
```

## Method A — Xcode Automatic Signing (DEPLOYED)

**How it works:** Xcode's own provisioning logic uses the internal
`developer.apple.com/services2/v1/bundleIdRequest` endpoint (NOT the public
App Store Connect API). This internal endpoint **does support** the
time-sensitive entitlement and auto-adds it to profiles based on the
app's `.entitlements` file.

**Implementation:**
1. `ios/App/App.xcodeproj/project.pbxproj` has `CODE_SIGN_STYLE = Automatic`
   and `DEVELOPMENT_TEAM = NKZNY8NU8S` for App target (already done).
2. `codemagic.yaml`:
   - Revokes old certs + profiles via App Store Connect API
   - Creates fresh distribution certificate (cert only, no profile)
   - Writes `AuthKey_<KEY_ID>.p8` to `~/.appstoreconnect/private_keys/`
   - Runs `xcodebuild archive -allowProvisioningUpdates
     -authenticationKeyPath ... -authenticationKeyID ...
     -authenticationKeyIssuerID ...` which makes Xcode generate the
     profile via services2 endpoint at build time.

**Key insight:** `-allowProvisioningUpdates` + `-authenticationKey*` flags
make Xcode behave exactly like Xcode.app's automatic signing UI — it generates
a profile containing ALL entitlements from `App.entitlements`, including
ones not in the App Store Connect API's capability list.

**No user action required if it works.** Just push to main; Codemagic builds.

## Method B — Manual .mobileprovision Upload (FALLBACK)

Use only if Method A fails persistently.

### Step 1 — Lokal cihazda profile oluştur

```bash
# Mac terminal'de Xcode kurulu olmalı
open /Users/$(whoami)/new-app/ios/App/App.xcodeproj
```

Xcode'da:
1. **App target** seç → **Signing & Capabilities** sekmesi.
2. **Automatic manage signing** kutusu işaretli, Team = `NKZNY8NU8S`.
3. **+ Capability** → "Time Sensitive Notifications" eklendiğinden emin ol.
4. Build target: **Any iOS Device (arm64)**.
5. **Product → Archive** çalıştır → Xcode bir archive oluşturur.
6. **Window → Organizer** → seçili archive → **Distribute App → App Store
   Connect → Upload** akışını başlat. **Distribution method: App Store
   Connect**, **Re-sign: Manually manage signing** seç.
7. Apple Server'dan dönen profile preview ekranında profile'ı kontrol et:
   `com.apple.developer.usernotifications.time-sensitive` ✓ olmalı.
8. **Export** → "Save for App Store Connect" → bir klasöre kaydet
   (örn. `~/Desktop/hangelExport`).
9. Klasör içinde `hangel.ipa` + `App.mobileprovision` olacak.

### Step 2 — Profile'ı Codemagic'e yükle

1. https://codemagic.io → Project → Settings → **Code signing identities** sekmesi.
2. **iOS provisioning profiles** → **Upload profile** → `App.mobileprovision`'ı yükle.
3. Distribution certificate (`.p12`) yoksa onu da yükle:
   - Xcode → Preferences → Accounts → Apple ID → Manage Certificates →
     iOS Distribution → Export Certificate → şifre belirle → `.p12` indir.
   - Codemagic → Settings → Code signing → **Upload p12** → şifreyle yükle.

### Step 3 — codemagic.yaml'ı manuel profile'a çevir

```yaml
- name: Set up code signing (manual profile)
  script: |
    keychain initialize
    app-store-connect fetch-signing-files "$BUNDLE_ID" \
      --type IOS_APP_STORE \
      --strict-match-identifier
    keychain add-certificates
    xcode-project use-profiles
```

veya doğrudan dosya yüklerken:

```yaml
- name: Set up code signing (manual profile - uploaded)
  script: |
    keychain initialize
    # Codemagic upload UI'dan gelen profile'lar /Users/builder/Library/
    # MobileDevice/Provisioning Profiles/ altında otomatik mount edilir.
    # Sadece cert'i keychain'e ekle.
    keychain add-certificates
    xcode-project use-profiles --warn-only
```

### Step 4 — Profile expiration takip

`.mobileprovision` dosyaları **1 yıl** sonra expire olur. Apple yıllık
yenileme sürecinde:
- 11. aydan itibaren Codemagic build'ler "profile expires soon" warning verir
- 12. ay sonunda build fail eder

Method A (automatic) bu sorunu otomatik çözer, bu yüzden A önceliklidir.

## Why time-sensitive needs the Xcode endpoint

Apple, time-sensitive notifications özelliğini "user-impacting" gördüğü için
yalnız Xcode'un içinden ve Apple Developer Console'da manuel "+ Capability"
butonuyla eklenmesini istiyor. App Store Connect API (third-party tool zaten)
**hiç eklemiyor** — bu Apple'ın bilinçli kararı, bug değil.

Geleceğin için (referans):
- https://developer.apple.com/documentation/usernotifications/uncriticalalertinterruptionlevel
- Apple WWDC 2023 — "Manage signing certificates and provisioning profiles
  programmatically" (session 10071)

## Troubleshooting

**A. xcodebuild "no matching profile" hatası:**
- Apple Developer Console'da `com.apple.developer.usernotifications.time-sensitive`
  kapasitesinin Bundle ID için aktif olduğunu kontrol et:
  https://developer.apple.com/account/resources/identifiers/list →
  `com.hangel.ios.app` → "Time Sensitive Notifications" işaretli mi?
- İşaretli değilse: manuel olarak Apple Console'dan "Edit App ID" → ✓ →
  Save. Bu işlem Apple Console'dan zorunludur (API'den eklenemiyor).

**B. -allowProvisioningUpdates flag çalışmıyor:**
- Xcode 13+ gerekli. Codemagic `instance_type: mac_mini_m2 + xcode: latest`
  zaten bunu sağlıyor.
- Hala fail ediyorsa Codemagic CI Mac'ında interactive olarak Apple ID
  kayıt gerekebilir — destek talebi aç.

**C. "Code signing identities" Codemagic UI'dan görünmüyor:**
- Settings → Integrations → App Store Connect → token eklendiğinden emin ol.
- Token expire olmuş olabilir (1 yıl). Yeni token oluştur ve değiştir.
