# Runbook — Super-Admin Custom Claims Migration

**Bu runbook iki aşamalıdır:** (1) kod ve rules güncellemesi (security-lead tarafından, plan ile), (2) Firebase Auth'da claim atama (kullanıcı tarafından, bu runbook).

## Mevcut durum
- `firestore.rules:12`: `request.auth.token.email == 'ismailhilmi@hangel.org'` literal kontrol var.
- `src/lib/messaging/server-auth.ts:11`: aynı literal.
- Süper-admin tespiti iki yerde gömülü; kompromize olursa tek nokta arızası.

## Hedef
`request.auth.token.role == 'super-admin'` (custom claim) ile kontrol. Kod literal taşımıyor. Yeni super-admin atamak için Firebase Admin SDK ile claim setlenir.

## Aşama 1 — Kod tarafı (security-lead + surgical-coder)

`tasks.md` → `P0-4`. Bu çalışma şu dosyaları düzenler:
- `firestore.rules`: `function isSuperAdmin()` → `return isSignedIn() && request.auth.token.role == 'super-admin';`
- `src/lib/messaging/server-auth.ts`: hardcoded e-posta literal silinir; claim kontrolü eklenir.
- `tests/rules/super-admin.test.ts` (yeni): claim'siz okuma 403; claim'li okuma 200.

`hangel-security-lead` bu aşamayı dispatch eder. **Deploy etmez.** Sadece kod hazırlar ve `🟡 Awaiting user` ile döner.

## Aşama 2 — Mevcut süper-admin'lere claim atama (kullanıcı)

### Önkoşullar
- Production Firebase Admin SDK erişimi (yeni rotate edilmiş service account ile)
- Atanacak UID'lerin listesi (mevcut e-posta tabanlı super-admin'lerin Auth UID'leri)

### UID'leri bul

```bash
# Firebase Console → Authentication → Users
# Veya CLI:
firebase auth:export users.json --project hangel-new-v18-87297865-9bcc3
# users.json içinden ismailhilmi@hangel.org satırını bul, localId UID'sidir
```

### Geçici bir node script ile claim ata

`scripts/set-super-admin-claim.ts` (security-lead `P0-4` kapsamında oluşturur; bu runbook çalıştırmayı anlatır):

```bash
# scripts/set-super-admin-claim.ts beklenen UI:
#   npx tsx scripts/set-super-admin-claim.ts <uid>

# Çalıştır:
GOOGLE_APPLICATION_CREDENTIALS=/abs/path/to/new-sa.json npx tsx scripts/set-super-admin-claim.ts <UID_BURAYA>

# Beklenen çıktı:
# ✅ Custom claims set for <uid>: { role: 'super-admin' }
```

### Doğrulama

```bash
# Aynı kullanıcı browser'da çıkış-giriş yapmalı (claim refresh için).
# Sonra:
GOOGLE_APPLICATION_CREDENTIALS=/abs/path npx tsx -e '
import {getAuth} from "firebase-admin/auth";
import {initializeApp} from "firebase-admin/app";
initializeApp();
getAuth().getUser("<UID>").then(u => console.log(u.customClaims));
'
# Beklenen: { role: "super-admin" }
```

### Rules deploy (aşama 3'e geçiş)

Claim atandıktan ve kullanıcı yeniden login olduktan SONRA rules deploy. Aksi halde mevcut super-admin'ler kilitlenir.

```bash
# rules-deploy.md'yi takip et:
firebase deploy --only firestore:rules,storage --project hangel-new-v18-87297865-9bcc3
```

### Rollback

Eğer rules deploy sonrası süper-admin paneli açılmıyorsa:
1. **Hızlı**: Firebase Console → Firestore → Rules → "Önceki versiyon"u seç ve publish et.
2. **Kalıcı**: `git revert <commit>` + tekrar deploy.

## Tamamlandığında

`tasks.md` → `P0-4` ve `P0-4a` ikisi de `✅ Done`. `decisions.md`'e: deploy timestamp + atama yapılan UID listesi (e-posta yerine UID — PII koruma).
