# Firestore Composite Index Deploy

**Owner**: devops-lead
**Scope**: `firestore.indexes.json`
**Production-impacting**: yes (query-failures during build window)
**Run frequency**: on every change to `firestore.indexes.json`

## Why

`useCollection` hook'umuz `failed-precondition` hatasını "Missing or insufficient permissions" olarak maskeliyor (frontend pasarse hatası). Bu yüzden composite index eksiklikleri sessiz boş liste olarak görünür. Her query değişikliğinde index dosyasını güncelleyip deploy etmek zorundayız.

## Prereqs

- `firebase` CLI v13+ yüklü
- Login: `firebase login`
- Proje varsayılan: `hangel-new-v18-87297865-9bcc3` (`.firebaserc` doğrular)

## Deploy

```bash
firebase deploy --only firestore:indexes --project=hangel-new-v18-87297865-9bcc3
```

Beklenen çıktı:
```
✔  firestore: deployed indexes in firestore.indexes.json successfully
```

## Build süresi ve doğrulama

Composite index'ler **NOT_BUILDING → CREATING → READY** state'lerinden geçer:
- Boş koleksiyon: 30 sn - 1 dk
- Mevcut doküman sayısına bağlı: 1-10 dk
- Çok büyük koleksiyon (>100k doc): 30 dk+ olabilir

İlerlemeyi izle:
```bash
firebase firestore:indexes --project=hangel-new-v18-87297865-9bcc3
```

Veya Console:
https://console.firebase.google.com/project/hangel-new-v18-87297865-9bcc3/firestore/indexes

Tüm satırlar **Enabled** (yeşil) olduğunda deploy bitmiştir.

## Console fallback (CLI başarısız olursa)

Index manuel yaratma URL'i Firestore hata mesajında belirir (`https://console.firebase.google.com/.../indexes?create_composite=...`). Browser'da aç, "Create index"e bas.

Mevcut index ihtiyaçları:

| Collection | Fields | Used by |
|---|---|---|
| notifications | userId ASC, createdAt DESC | `/notifications/page.tsx`, `super-admin/activity` (subset) |
| notifications | userId ASC, read ASC | `header.tsx` (unread badge) |

## Rollback

Firestore CLI **index silme** desteklemez (sadece create + update). Index'i kaldırmak için:

1. `firestore.indexes.json`'dan ilgili entry'yi sil.
2. Console'da manuel olarak: Firestore → Indexes → ilgili satır → "Delete index".
3. Sonraki deploy `firestore.indexes.json` ile diff almaya devam eder (silme propage etmez).

Index'in app davranışı **kırıcı değildir** (sadece o query'yi yavaşlatır → fallback olarak in-memory sort gerekir). Acil rollback gerekmez.

## Acceptance criteria

- [ ] `firebase deploy --only firestore:indexes` exit 0
- [ ] `firebase firestore:indexes` çıktısında tüm `notifications` index'leri **READY** state
- [ ] `/notifications` sayfası açıldığında DevTools console'da `failed-precondition` hatası YOK
- [ ] Header notification badge `unreadCount > 0` durumunda doğru sayıyı gösteriyor

## Bekleyen ek index ihtiyaçları (gelecek wave)

Bu runbook sadece **notifications** scope'unu kapsar. Aşağıdaki composite query'ler de prod'da `failed-precondition` riski taşıyor — ayrı task ID ile ele alınacak:

- `donations(ngoId ASC, date DESC)` → `ngo-admin/donations/page.tsx:99`
- `monthlyEarnings(ngoId ASC, month DESC)` → `ngo-admin/donations/page.tsx:111`
- `campaigns(ngoId ASC, createdAt DESC)` → `ngo-admin/messaging/{page,campaigns}`
- `messagingTransactions(ngoId ASC, createdAt DESC)` → `ngo-admin/messaging/wallet`
- `ngoRecipientSegments(ngoId ASC, updatedAt DESC)` → `ngo-admin/messaging/campaigns/new`
- `emergencyRequests(status ASC, createdAt DESC)` → `super-admin/emergency`
- `bloodRequests(status ASC, createdAt DESC)` → `super-admin/emergency`
- `userRequests(type ASC, createdAt DESC)` → `super-admin/emergency`
