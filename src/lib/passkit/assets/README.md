# PassKit Pass Assets

Apple Wallet (.pkpass) için gerekli görseller. Apple spec:

| Dosya | Boyut | Boyut@2x | Boyut@3x | Kullanım |
|---|---|---|---|---|
| `icon.png` | 29×29 | 58×58 (icon@2x.png) | 87×87 (icon@3x.png) | Notification + lock screen badge |
| `logo.png` | 160×50 | 320×100 | 480×150 | Pass üst kısmı logo |
| `strip.png` | 320×123 | 640×246 | 960×369 | Etkinlik bileti banner |
| `thumbnail.png` | 90×90 | 180×180 | 270×270 | Generic pass için |
| `background.png` | 180×220 | 360×440 | 540×660 | EventTicket arka plan |

## Eksik asset'ler

Şu an `src/lib/passkit/assets/` boş. PassKit endpoint'leri:
- `loadPassAssets()` çağırıyor, dosya yoksa sessiz default (Apple sade pass üretir).
- Production'da bu dosyalar Hangel branding ile doldurulmalı.

## Üretim adımları

1. Hangel logo'sundan icon (29/58/87 px versiyonları)
2. Pass header için banner logo (160/320/480 px)
3. Etkinlik bileti için strip (320/640/960 px)

Tasarım gereği:
- Background: beyaz veya saydam
- Icon: Hangel kırmızı (#E0140F)
- PNG-32 (alpha kanal destekli)

## Geçici placeholder

ImageMagick yoksa `sips` ile basit placeholder üretilebilir:

```bash
# Beyaz arka plan + Hangel kırmızı circle (placeholder)
# Gerçek tasarım gelene kadar)
```

ASCII art veya base64 PNG generate eden TypeScript script:
- `scripts/automation/generate-passkit-placeholders.ts`
