# Android Deploy Setup — Codemagic + Google Play

## Bir defa kurulum (~15 dk)

### 1. Codemagic env vars ekle
Codemagic dashboard → hangel app → Environment variables → Group: `android_credentials`

| Variable | Nasıl alınır | Secret? |
|----------|--------------|---------|
| `CM_KEYSTORE` | `base64 -i /Users/macbookair/new-app/android/app/hangel-release.keystore \| pbcopy` → yapıştır | ✓ |
| `CM_KEYSTORE_PASSWORD` | Keystore üretirken belirlediğin store password | ✓ |
| `CM_KEY_ALIAS` | `keytool -list -keystore <keystore> -storepass <pw>` çıktısındaki alias | ✗ |
| `CM_KEY_PASSWORD` | Key alias için ayrı password (genelde store ile aynı) | ✓ |
| `GCLOUD_SERVICE_ACCOUNT_CREDENTIALS` | Play Console → Setup → API access → Service account JSON | ✓ |

### 2. Play Console Service Account (otomatik upload için)
1. https://play.google.com/console → Setup → API access
2. "Create new service account" → Google Cloud Console açılır
3. Service account oluştur → "Add key" → JSON download
4. Play Console'da bu service account'a "Release manager" yetkisi ver
5. JSON içeriğini `GCLOUD_SERVICE_ACCOUNT_CREDENTIALS` env var'a yapıştır

### 3. Build tetikleme
- Codemagic dashboard → `android-play` workflow → "Start new build"
- Veya `main` branch'e tag push: `git tag android-v2.0.3 && git push --tags`

### 4. Track seçimi (env var `GOOGLE_PLAY_TRACK`)
- `internal` — internal test (anında, 100 kullanıcı limit) **default**
- `alpha` — closed alpha
- `beta` — open beta
- `production` — canlı yayın (Play Store)

İlk denemede `internal` ile dene, sorun yoksa `production`'a geç.

## Keystore password'unu kaybettiysem?
1. https://play.google.com/console → App → Setup → App integrity → App signing
2. Eğer "Play App Signing" aktifse: "Request upload key reset" bileti aç
3. Yeni keystore üret, SHA-1'ini Google'a ver, 24-48 saat onay bekle
4. Yeni keystore ile CM_KEYSTORE + password env vars'ı güncelle
