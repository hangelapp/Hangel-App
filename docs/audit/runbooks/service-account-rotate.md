# Runbook — Firebase Service Account Rotation

**Bu runbook yalnızca kullanıcı tarafından çalıştırılır.** Claude ajanları Firebase Console'a giremez.

## Durum
- `.firebase-service-account.json` dosyası bugün repo'da takip edilmiyor (`.gitignore`).
- **Ama git geçmişinde mevcut** — `git log --all -- .firebase-service-account.json` 2 commit listeliyor (`1f040fc`, `9bc31a6`).
- Diskteki kopya gerçek bir RSA private key içeriyor.
- Sonuç: anahtar **ifşa olmuş kabul edilmeli**, derhal rotate edilmeli.

## Etki
- Bu anahtar geçerli olduğu sürece, anahtarı eline geçiren herhangi biri tüm Firestore/Storage/Auth verisi üzerinde admin erişimine sahiptir (rules bypass).
- Rotate sonrası eski anahtar reddedilir; ona bağlı production servisleri yeni anahtarla deploy edilmeden çalışmaz.

## Önkoşullar
- Firebase Console'a `Owner` yetkili Google hesabıyla erişim
- Production secrets store erişimi (Firebase App Hosting Secret Manager / GitHub Actions secrets / lokal `.env`)

## Adımlar

### 1) Yeni service account anahtarı oluştur

```
# Tarayıcı:
https://console.firebase.google.com/project/hangel-new-v18-87297865-9bcc3/settings/serviceaccounts/adminsdk

→ "Generate new private key"
→ JSON dosyasını indir (örn. ~/Downloads/hangel-sa-new.json)
```

### 2) Yeni anahtarı secrets store'a ekle

Firebase App Hosting kullanıyorsan:
```
firebase apphosting:secrets:set FIREBASE_SERVICE_ACCOUNT --data-file ~/Downloads/hangel-sa-new.json
```

GitHub Actions için secret olarak yüklüyorsan:
```
# GitHub web UI → Settings → Secrets and variables → Actions
# Secret adı: FIREBASE_SERVICE_ACCOUNT
# Değer: dosyanın tüm içeriği (JSON)
```

Lokal geliştirme için (sadece bu makinada):
```
mv ~/Downloads/hangel-sa-new.json /Users/ake/Documents/hangelapp/.firebase-service-account.json
# .gitignore zaten kapsıyor; commit'lenmeyecek.
```

### 3) Production'da yeni anahtarın çalıştığını doğrula

```
# App Hosting backend rollout tetikle (manuel):
firebase deploy --only apphosting

# Veya bir test endpoint'i çağırıp Firebase Admin SDK'nın başlatıldığını doğrula
curl https://hangel.org.tr/api/healthz   # eğer healthz endpoint'in varsa
```

### 4) Eski anahtarı revoke et

```
# Tarayıcı:
https://console.cloud.google.com/iam-admin/serviceaccounts?project=hangel-new-v18-87297865-9bcc3

→ "firebase-adminsdk-..." service account'unu seç
→ "Keys" sekmesi
→ Eski key'i (private_key_id: e1312f88da4770e44ac15f3814399b48539de0e8) sil
```

### 5) Audit log doğrulaması

```
# Cloud Logging'de eski key'in kullanılıp kullanılmadığını gözlemle:
https://console.cloud.google.com/logs/query
→ Filter: protoPayload.authenticationInfo.principalEmail contains "firebase-adminsdk"
→ Son 30 gün
→ Anormal IP, anormal sorgu var mı?
```

### 6) İkinci aşamayı tetikle

Anahtar rotate edildikten ve eski key revoke edildikten sonra, [git-history-purge.md](./git-history-purge.md) runbook'u ile geçmiş temizlenir.

## Geri alma (rollback)

Yeni anahtar deploy sonrası prod patlarsa:
1. Firebase Console'da eski anahtarı **geçici** olarak yeniden enable etmek mümkün değildir; rotate işlemi tek yönlüdür.
2. Acil durumda Console'dan **üçüncü bir anahtar** oluştur ve secrets store'a yeniden yükleyip rollout yap.

## Tamamlandığında

Orchestrator'a bildir. `docs/audit/tasks.md` içindeki `P0-1` görevini `✅ Done` yap. `decisions.md`'e timestamp + key revoke kanıtı ekle.
