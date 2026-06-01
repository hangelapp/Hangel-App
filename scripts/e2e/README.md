# hangel iOS Maestro E2E Tests

Bu dizindeki YAML'lar Maestro ile iOS Simulator üzerinde otomatik smoke
test yapar.

## Kurulum

```bash
brew install openjdk@17
curl -fsSL "https://get.maestro.mobile.dev" | bash

# Shell config (~/.zshrc):
export JAVA_HOME="/usr/local/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"
export PATH="$HOME/.maestro/bin:$PATH"
```

## Önkoşul

1. iOS Simulator açık: `open -a Simulator`
2. hangel app yüklü (TestFlight'tan veya `npx cap run ios`)
3. Internet bağlantısı

## Çalıştırma

### Tek senaryo:
```bash
maestro test scripts/e2e/welcome-flow.yaml
```

### Tüm suite (sırayla):
```bash
maestro test scripts/e2e/
```

### Cloud (CI/CD için):
```bash
maestro cloud --upload-name hangel-ios scripts/e2e/
```

## Senaryolar

| Dosya | Açıklama | Süre |
|---|---|---|
| `welcome-flow.yaml` | Yeni kullanıcı onboarding + 9 intent + izin promptları | ~30 sn |
| `login-otp.yaml` | WhatsApp OTP ile giriş | ~20 sn |
| `market-browse.yaml` | Market sayfası → marka detay | ~15 sn |
| `blood-response.yaml` | Kan ihtiyacı bildirimine "Yardım Edebilirim" yanıtı | ~10 sn |
| `settings-emergency.yaml` | Settings → Emergency tab — kan grubu + toggles | ~15 sn |

Toplam: ~90 sn (paralel çalışırsa 30 sn)
