# Chrome Extension — Narrow Scope Migration

Mevcut `manifest.json` `<all_urls>` izniyle Chrome Web Store'a gönderildi (ilk submission). Onay geldikten sonra **kullanıcı tabanına dokunmadan** izinleri sadeleştirmek için marka domain'lerine daraltılmış sürümü (`manifest-narrow.json`) yayınla.

## Hazırlık (script çıktısı)

`manifest-narrow.json` ve `brand-domains.json` `scripts/build-extension-brand-domains.mjs` tarafından üretilir. Yayın günü güncel domain listesi için scripti tekrar koş:

```bash
node scripts/build-extension-brand-domains.mjs
```

## Chrome Web Store review onayı geldikten sonra şu adımları izle

1. `cp store-listing/manifest-narrow.json manifest.json`
2. `cd chrome-extension && zip -r ~/Desktop/hangel-extension-v1.1.zip . -x '*.DS_Store' -x README.md -x 'store-listing/*'`
3. Web Store Developer Dashboard → hangel → "Yeni paket yükle" → review 1-3 gün.

## Notlar

- `manifest.json` içindeki `version` alanını da yükselt (örn. `1.0.0` → `1.1.0`); aynı sürüm tekrar yüklenemez.
- Narrow scope review genelde geniş scope'a göre daha hızlı çıkar; kullanıcıya update sessiz iner.
- Yeni marka eklenince `brand-domains.json` eskir; ayda bir scripti tekrar koşup paket güncelle.
