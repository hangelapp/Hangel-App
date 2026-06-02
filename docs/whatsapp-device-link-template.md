# WhatsApp UTILITY Template — `hangel_device_link`

Bu doküman Meta Business Suite (BSP) üzerinden submit edilecek yeni cihaz bağlama template'inin spec'idir. Kod tarafı (`src/lib/whatsapp-link.ts` → `sendDeviceLinkWhatsApp`, `/api/auth/whatsapp/device-link/*`, `/link/[token]`) hazır — sadece template submit + BSP onayı bekliyor.

## Neden Authentication değil UTILITY

- Authentication kategorisi URL button kabul etmiyor (yalnızca COPY_CODE button).
- "Login link" framing'i Meta auto-classifier'ı Authentication kategorisine çekiyor.
- Bu yüzden çerçeveyi **"yeni cihaz bağlama"** olarak değiştirdik — utility intent (hesap yönetimi), URL button izinli.

## Template Spec

| Alan | Değer |
|---|---|
| Name | `hangel_device_link` |
| Category | UTILITY |
| Languages | `tr` (ilk submit), `en` (sonra eklenir) |
| Header | yok |
| Footer | yok (auto-classifier'a daha az "auth" ipucu) |
| Body variables | `{{1}}` = name |
| Buttons | 1 adet CTA URL → `https://hangel.org/link/{{1}}` (dynamic, parametre = token) |

> NOT: Body'de `{{1}}` (ad), button URL'inde tekrar `{{1}}` (token) kullanılıyor; Meta her component için ayrı index'liyor — çakışmaz.

## Body — TR

```
Merhaba {{1}}, hangel hesabına yeni cihaz bağlama talebin alındı. Bağlantıyı tamamlamak için aşağıdaki butona dokun. Bu istek 10 dakika içinde geçerlidir.
```

## Body — EN (sonraki submit için draft)

```
Hi {{1}}, we received a request to link a new device to your hangel account. Tap the button below to complete the link. This request is valid for 10 minutes.
```

## Button (her iki dil için aynı)

- Type: CTA → Visit website
- Button text (TR): `Cihazı bağla`
- Button text (EN): `Link device`
- URL type: Dynamic
- URL base: `https://hangel.org/link/`
- URL variable example: `c3f7a1d8-2b4e-4c9a-9f31-7e0a8d5b6c12` (UUID örnek)

## BSP Submit Talimatı (4 adım)

1. Meta Business Suite → WhatsApp Manager → Message Templates → "Create template".
2. Category: **Utility**. Name: `hangel_device_link`. Language: **Turkish (tr)**.
3. Body alanına yukarıdaki TR string'i yapıştır. Footer'ı boş bırak. Add button → "Visit website" → Dynamic, URL = `https://hangel.org/link/` + örnek UUID.
4. Submit. Onay tipik 1-24 saat. EN versiyonu onay sonrası "Add language" ile aynı template'e eklenir.

## Smoke Test (template approve olduktan sonra)

```bash
curl -X POST https://hangel.org/api/auth/whatsapp/device-link \
  -H 'Content-Type: application/json' \
  -d '{"phone":"5551234567","phoneCountryCode":"+90","name":"Test","lang":"tr"}'
```

Mesaj telefonda gelmeli, butona dokununca `/link/{token}` açılmalı, Auth state'i `/market`'e redirect olmalı.
