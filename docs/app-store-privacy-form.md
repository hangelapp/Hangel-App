# App Store Connect — App Privacy Form Submission Guide

**App:** hangel iOS (Bundle ID `org.hangel.app`, App ID `6664058822`)
**Tarih:** 2026-06-02
**Submitted via:** App Store Connect Web UI (manual)

## Neden API ile değil UI ile?

App Store Connect API (`api.appstoreconnect.apple.com/v1/*`) **App Privacy form için yazma endpoint'i sağlamıyor**. `appPrivacyDetails`, `dataTypes`, `purposes` gibi resource'lar API surface'ında yok (Apple 2026-06 itibarıyla bu alanı UI-only tutuyor). Tek yapılabilen: `usesNonExemptEncryption` (export compliance) — o da zaten `set-export-compliance.ts` ile otomatize.

Bu sebeple aşağıdaki 16 data type ASC Web UI'dan manuel girilecek. Bu doc tıklama sırası.

---

## Adım 0 — ASC'ye giriş

1. https://appstoreconnect.apple.com → My Apps → **hangel**
2. Sol menü → **App Privacy**
3. **Get Started** (ilk kez) veya **Edit** (mevcut)
4. "Do you or your third-party partners collect data from this app?" → **Yes**

---

## Adım 1 — Tracking sorusu

> "Does this app collect data in a way that's used to track the user?"

**Cevap: No** — `NSPrivacyTracking=false`, ATT prompt kaldırılacak (aşağıdaki Risk bölümüne bak).

---

## Adım 2 — 16 Data Type ekle

Her data type için ASC sırası:
**Set Up Data Type → kategori aç → checkbox → Save → Configure → Linked Yes/No → Tracking No → Purposes seç → Save**

| # | Apple Kategorisi | Data Type | Linked | Tracking | Purposes |
|---|---|---|---|---|---|
| 1 | Contact Info | **Email Address** | Yes | No | App Functionality, Authentication |
| 2 | Contact Info | **Name** | Yes | No | App Functionality |
| 3 | Contact Info | **Phone Number** | Yes | No | App Functionality, Authentication |
| 4 | Contact Info | **Physical Address** | Yes | No | App Functionality |
| 5 | Location | **Precise Location** | Yes | No | App Functionality |
| 6 | Health & Fitness | **Health** | Yes | No | App Functionality |
| 7 | Health & Fitness | **Fitness** | Yes | No | App Functionality |
| 8 | Contacts | **Contacts** | Yes | No | App Functionality |
| 9 | User Content | **Photos or Videos** | Yes | No | App Functionality |
| 10 | User Content | **Other User Content** | Yes | No | App Functionality |
| 11 | Identifiers | **User ID** | Yes | No | App Functionality, Analytics |
| 12 | Identifiers | **Device ID** | Yes | No | App Functionality, Analytics |
| 13 | Usage Data | **Product Interaction** | Yes | No | Analytics, Product Personalization |
| 14 | Diagnostics | **Crash Data** | **No** | No | App Functionality |
| 15 | Diagnostics | **Performance Data** | **No** | No | App Functionality |
| 16 | Purchases | **Purchase History** | Yes | No | App Functionality |

**Not — Health & Fitness (#6, #7):** Info.plist'te `NSHealthShareUsageDescription` ve `NSHealthUpdateUsageDescription` var → ASC bunları zorunlu işaretletecek. Mutlaka ekle.

---

## Adım 3 — Publish

Sayfanın sağ üstü → **Publish** → modal'da onay.

> Bu form binary'den bağımsız çalışır; submit ettiğin an canlıya çıkar. Build pending review'da olsa bile değişir.

---

## Risk — ATT prompt'unu Info.plist'ten kaldır

Şu anda `Info.plist` içinde **`NSUserTrackingUsageDescription`** var **ama**:
- `NSPrivacyTracking` = `false` (xcprivacy)
- App Privacy form'da Tracking = "No"

Bu **Apple reject sebebi**: "ATT prompt göstermek isteyen ama tracking yapmadığını beyan eden uygulama" guideline 5.1.2(i)'ye takılır.

**Aksiyon:** `ios/App/App/Info.plist` içinden `NSUserTrackingUsageDescription` key + string değerini sil. Eğer ileride tracking eklenirse geri koyulur. Şu an taşımanın anlamı yok.

---

## Submit Sonrası Doğrulama

```
ASC → App Privacy → "Last Updated: 2026-06-02 by <kullanıcı>"
```

Apple review sırasında bu form'la xcprivacy + Info.plist tutarlılığı otomatik kontrol ediliyor; mismatch → metadata reject.
