# Sertifika partner logoları

Gelir Modeli konferansı sertifikalarında (organizatör = Social Business Global,
`organizerLogoUrl`'den gelir) organizatör logosunun yanında gösterilen **partner
kurum logoları**. `src/lib/event-certificate.ts` → `GELIR_MODELI_PARTNER_LOGOS`
bu yolları bekler:

- `icisleri-stigm.png` — T.C. İçişleri Bakanlığı **Sivil Toplumla İlişkiler Genel Müdürlüğü** logosu
- `icisleri-muhur.png` — T.C. İçişleri Bakanlığı mührü/amblemi

## Nasıl eklenir
Bu iki PNG dosyasını (şeffaf arka plan tercih edilir) tam bu adlarla bu klasöre
(`public/partners/`) koyun. Sertifika on-demand üretildiği için, dosyalar konunca
**tüm gelir-modeli sertifikaları (geçmiş dahil) yeni indirmede** bu logoları gösterir.

Dosya yoksa sertifika bozulmaz — logo sessizce atlanır (fetch 404 → null).
