# hangel Chrome Extension — Alışverişin Bağışa Dönüşsün

Rakuten Cashback tarzı affiliate hatırlatıcı. Fark: kullanıcıya cashback değil — **komisyon kullanıcının seçtiği 2 STK'ya bağış olarak gider**.

## Akış (kullanıcı senaryosu)

1. Kullanıcı extension'ı Chrome'a kurar
2. Chrome'da hangel kayıtlı bir markaya (örn. Trendyol) girer
3. Sağ üstte **popart toast** belirir: *"Hatırlatayım galiba :) **Trendyol** hangel üzerinden bağış yapsın istermisin?"*
4. **"Yapsın"** → sayfa otomatik hangel affiliate link'ine yenilenir
5. Normal alışveriş yapılır
6. Marka komisyonu hangel'e ödenir → **kullanıcının seçtiği 2 STK'ya paylaştırılır**

## Mimari

```
hangel.org.tr/api/extension/brands   ← background.js her saatte bir çeker, chrome.storage.local'e cache'ler
hangel.org.tr/api/extension/click    ← "Yapsın" tıklanınca affiliate URL döner
```

| Dosya | Sorumluluk |
|---|---|
| `manifest.json` | Manifest V3 + permissions |
| `src/background.js` | Brand cache refresh + click handler |
| `src/content.js` | Tab URL match + popart toast inject |
| `src/content.css` | Toast styling (high-specificity, host page'den izole) |
| `src/popup.html` + `popup.js` + `popup.css` | Toolbar icon kartı |
| `icons/` | 16/48/128 PNG |

## Privacy / KVKK

- **Browsing history hangel'e GİTMEZ.** Brand match tamamen local — `chrome.storage.local`'deki cache + current tab hostname karşılaştırması.
- Sadece kullanıcı **"Yapsın"** tıkladığında o anki `brandId` server'a gider (`POST /api/extension/click`).
- Click body sadece `{ brandId }` — IP/user-agent dışında PII yok.
- Conversion attribution HasOffers tracking link'ine zaten gömülü; ekstra Firestore yazımı yok (KVKK + maliyet).
- "Bir daha sorma" → 30 gün dismiss `chrome.storage.local`'de saklanır (server'a gitmez).

## Local Test

1. Bu klasörü Chrome'a yükle:
   - `chrome://extensions/` → **Geliştirici modu** açık
   - **"Paketlenmemiş öğe yükle"** → `/Users/macbookair/new-app/chrome-extension`
2. Extension toolbar'da hangel iconu görünür. Tıkla → popup açılır.
3. Yeni sekme aç → `https://www.trendyol.com` (veya kayıtlı başka marka)
4. Sağ üstte popart toast belirir → **"Yapsın"** → affiliate URL'e redirect olur.

Brand cache `chrome.storage.local`'de saklanır. Manuel refresh için popup'tan **"Markaları güncelle"**.

## Chrome Web Store Submit

### 1. Developer Dashboard
- https://chrome.google.com/webstore/devconsole — Google hesabıyla giriş
- $5 tek seferlik developer fee öde (sadece ilk kayıtta)

### 2. Manifest hazırla
```bash
cd chrome-extension
zip -r hangel-extension.zip . -x "*.DS_Store" -x "README.md"
```

### 3. Listing içeriği
- **Name:** hangel — Alışverişin Bağışa Dönüşsün
- **Short description (132 char):** hangel kayıtlı markalarda otomatik hatırlatıcı: alışverişin komisyonu seçtiğin STK'lara bağış olarak gitsin.
- **Detailed description:** README'deki "Akış" bölümünü genişletilmiş Türkçe + İngilizce
- **Category:** Productivity veya Shopping
- **Language:** Türkçe (birincil), İngilizce (ikincil)

### 4. Screenshot'lar (5 adet, 1280×800 veya 640×400)
- Popart toast Trendyol sayfasında
- Extension popup login screen
- Bağış miktarı dashboard
- STK seçim ekranı
- Onboarding (3 adım)

### 5. Privacy Practices form
Belirtilen permissions için justification:
- `storage` — brand cache + dismissal preferences
- `activeTab` — current tab URL match (local only)
- `tabs` — affiliate redirect (chrome.tabs.update)
- `alarms` — 1 saatlik brand list refresh
- `notifications` — gelecek faz (şu an kullanılmıyor — kaldırılabilir)
- `host_permissions: hangel.org.tr/*` — API endpoint'leri

### 6. Submit → Review
- Standard Trust & Safety review: 1-3 iş günü
- Onay sonrası direkt yayında

## Marka veri kaynağı

`hangel.org.tr/api/extension/brands` → `fetchAllAgencyOffers()` (3 HasOffers network: reklamaction, affocean, gelirortaklari). Şu an **~150-200 marka** dönüyor (blocklist sonrası).

## Faz 2 (sonra)

- **Auth flow** — kullanıcı popup'tan "Giriş Yap" → hangel.org.tr OAuth callback → JWT chrome.storage.local'e yazılır. User-level click attribution + 2 STK seçim sync'i.
- **Auto-detect coupon** — sepet sayfasında otomatik kupon önerisi (Honey/Rakuten gibi)
- **Donation impact widget** — "bu alışveriş ~₺X bağış üretir" tahmini
- **Firefox + Edge Add-ons** portu (aynı Manifest V3 codebase)
- **Safari Web Extension** (macOS + iOS)

## İletişim

- Proje: https://hangel.org.tr
- Sorumlu: hangel Uluslararası Sosyal Fayda Derneği
- Mail: ismailhilmi@hangel.org
