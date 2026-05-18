# Runbook — Git History Purge for Leaked Service Account

**Bu runbook yalnızca kullanıcı tarafından çalıştırılır.** Destructive bir işlemdir; force-push gerektirir.

## Önkoşul

[service-account-rotate.md](./service-account-rotate.md) tamamlanmış olmalı. Eski anahtar **revoke edilmiş** olmalı. Aksi halde history purge tek başına yeterli değildir — kopyası alınmış anahtar geçerli kalır.

## Etki

- Git geçmişi yeniden yazılır.
- Bütün geliştiricilerin lokal clone'ları geçersiz olur; yeniden clone gerekir.
- Open PR'lar ve forklar bozulur (Hangel monorepo solo geliştiricilerse risk düşük).
- Repository hash'leri değişir.

## Hangi commit'lerden temizliyoruz

`git log --all --oneline -- .firebase-service-account.json`:
- `1f040fc hatalar düzeltildi, 100k ngos silindi`
- `9bc31a6 chore: cleanup TypeScript and ESLint issues across codebase`

## Adımlar

### 1) Yedek al

```
cd /Users/ake/Documents
cp -r hangelapp hangelapp.backup-$(date +%Y%m%d-%H%M%S)
```

### 2) `git filter-repo` kur (varsa atla)

```
brew install git-filter-repo
# veya
pip3 install git-filter-repo
```

### 3) Çalışma alanını temizle ve filter-repo çalıştır

```
cd /Users/ake/Documents/hangelapp

# Diskteki gerçek anahtarı geçici olarak repo dışına taşı (rotate edildikten sonra hâlâ lokal kopyaya ihtiyaç yok)
mv .firebase-service-account.json ~/Desktop/hangel-old-sa-DELETE-ME.json

# Anahtar dosyasını geçmişten tamamen kaldır
git filter-repo --invert-paths --path .firebase-service-account.json

# Aynı pattern'i taşıyan başka dosyalar varsa onları da ekle:
# git filter-repo --invert-paths --path-glob '*-service-account.json'
```

### 4) Doğrula

```
git log --all --oneline -- .firebase-service-account.json
# Boş çıktı bekleniyor.

git log --all --oneline -- '*-service-account.json'
# Boş çıktı bekleniyor.
```

### 5) Remote'a force push (geri alınamaz!)

```
git remote -v   # origin doğru mu?
git push --force-with-lease --all
git push --force-with-lease --tags
```

### 6) Eski anahtar dosyasını güvenli sil

```
shred -u ~/Desktop/hangel-old-sa-DELETE-ME.json 2>/dev/null || rm -P ~/Desktop/hangel-old-sa-DELETE-ME.json
```

### 7) Cloud destekli aramada da temizliği doğrula

GitHub'da repository → Settings → Search → eski private_key_id (`e1312f88da4770e44ac15f3814399b48539de0e8`) için arama yap. Sonuç gelmemeli.

GitHub support'a ek olarak cache invalidation talebi gönderebilirsin (gizli olmayan public repo'larda):
https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository

## Geri alma

Yedeği var:
```
cd /Users/ake/Documents
rm -rf hangelapp
mv hangelapp.backup-<timestamp> hangelapp
```

## Tamamlandığında

`docs/audit/tasks.md` içinde `P0-1b` görevini `✅ Done` yap. `decisions.md`'e: commit'leri purge ettiğin liste + GitHub cache invalidation kanıtı.
