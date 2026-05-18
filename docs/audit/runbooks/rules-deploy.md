# Runbook — Firestore + Storage Rules Production Deploy

**Bu runbook yalnızca kullanıcı tarafından çalıştırılır.** Claude ajanları `firebase deploy` çağırmaz.

## Önkoşullar

- Değiştirilen `firestore.rules` / `storage.rules` `main`'e merge edilmiş
- `npm run test:rules` lokal olarak veya CI'da PASS
- Yedek planın olduğundan emin ol: Firebase Console'da bir önceki rules versiyonu görünür

## Dry-run (tavsiye edilen)

Production'a basmadan önce emülatörde tekrar simüle et:

```bash
cd /Users/ake/Documents/hangelapp
firebase emulators:exec --only firestore "npm run test"
# veya sadece test:rules eğer scriptin varsa:
firebase emulators:exec --only firestore "npm run test:rules"
```

Yeşilse devam.

## Deploy

### Sadece Firestore rules

```bash
firebase deploy --only firestore:rules --project hangel-new-v18-87297865-9bcc3
```

### Sadece Storage rules

```bash
firebase deploy --only storage --project hangel-new-v18-87297865-9bcc3
```

### Her ikisi birlikte (önerilir — atomic değil ama ardışık tek transaction)

```bash
firebase deploy --only firestore:rules,storage --project hangel-new-v18-87297865-9bcc3
```

## Doğrulama (rules etkin olduktan sonra ≤30s)

```bash
# Anonim kullanıcı reddedilmeli:
curl -i "https://firestore.googleapis.com/v1/projects/hangel-new-v18-87297865-9bcc3/databases/(default)/documents/users/_test" \
  -H "Content-Type: application/json" \
  -d '{"fields":{"x":{"stringValue":"y"}}}'
# Beklenen: 401 Unauthorized

# Authenticated bir test kullanıcısı kendi belgesini okuyabilmeli (manuel test)
```

## Rollback

### Hızlı (Console üzerinden)

1. https://console.firebase.google.com/project/hangel-new-v18-87297865-9bcc3/firestore/rules
2. Sağ üstte "History" → bir önceki versiyon → "Restore"
3. Storage için: https://console.firebase.google.com/project/hangel-new-v18-87297865-9bcc3/storage/rules → aynı adımlar

### Repo üzerinden

```bash
git log --oneline -- firestore.rules storage.rules
git revert <son-rules-commit>
firebase deploy --only firestore:rules,storage --project hangel-new-v18-87297865-9bcc3
```

## Sık karşılaşılan sorunlar

- **`PERMISSION_DENIED: Missing or insufficient permissions`** — Yeni rules eski client'lerle uyumsuz. Login sonrası ID token refresh gerekir; kullanıcı çıkış-giriş yapmalı.
- **`Error: Rules deploy failed`** — Rules dosyasında sentaks hatası. `firebase deploy --only firestore:rules --debug` ile detay al.
- **Custom claim refresh gecikmesi** — Yeni custom claim eklendiyse client'in token'ı 1 saate kadar eski olabilir. `auth.currentUser.getIdToken(true)` ile zorla refresh.

## Tamamlandığında

`tasks.md`'de ilgili `P0-4a` veya rules-touching task'ı `✅ Done`. `decisions.md`'e: deploy timestamp + Firebase Console history version number.
