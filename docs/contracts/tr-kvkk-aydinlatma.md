# hangel — KVKK Aydınlatma Metni

> ⚠️ **DRAFT — Hukuki inceleme gerekli, yayınlamadan önce avukat onayı alınmalıdır.**
> Bu metin 6698 sayılı Kanun, ilgili tebliğ ve KVKK 2024 yurt dışı aktarım rehberi esas alınarak hazırlanmış taslaktır; nihai yayın öncesi KVKK uzmanı hukukçu tarafından gözden geçirilmelidir.

**Yayın tarihi:** [TARIH]
**Versiyon:** 1.0
**Mevzuat dayanağı:** 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) madde 10, Aydınlatma Yükümlülüğünün Yerine Getirilmesinde Uyulacak Usul ve Esaslar Hakkında Tebliğ, Veri Sorumluları Sicili Hakkında Yönetmelik, Sağlık Bakanlığı Kişisel Sağlık Verileri Hakkında Yönetmelik.

---

## 1. Veri Sorumlusu

| Alan | Bilgi |
|---|---|
| Ünvan | hangel [resmi ünvan placeholder — ör. Hangel Teknoloji A.Ş. / Hangel Derneği] |
| Adres | [merkez adresi placeholder] |
| MERSİS / Vergi No | [placeholder] |
| KEP adresi | [kep adresi placeholder] |
| E-posta | kvkk@hangel.org |
| Telefon | [iletişim numarası placeholder] |
| VERBİS Sicil No | [VERBİS kayıt numarası placeholder] |
| Veri Sorumlusu Temsilcisi | [ad-soyad, iletişim placeholder] |

hangel; kan bağışı acil çağrı eşleştirme platformu, sivil toplum kuruluşu (STK) yönetim araçları ve bağış toplama hizmetleri sunan bir dijital platformdur. Bu kapsamda topladığı kişisel verileri KVKK ve ilgili ikincil mevzuata uygun şekilde işler.

---

## 2. İşlenen Kişisel Veri Kategorileri

| Kategori | Veri Tipleri | Kaynak |
|---|---|---|
| Kimlik | Ad, soyad, doğum tarihi, T.C. kimlik no (bağış makbuzu için), kullanıcı adı | Üyelik formu, profil |
| İletişim | E-posta, cep telefonu, adres | Üyelik, doğrulama |
| Görsel | Profil fotoğrafı, kimlik doğrulama fotoğrafı | Kullanıcı yüklemesi |
| Konum | GPS koordinatları, şehir, ilçe (acil çağrı eşleştirme için) | Cihaz konum servisi |
| **Özel nitelikli — Sağlık** | **Kan grubu, son bağış tarihi, bağış uygunluk durumu** | Kullanıcı beyanı |
| Finansal | Bağış tutarı, ödeme aracı son 4 hanesi, fatura/makbuz bilgisi | Ödeme sağlayıcı (Iyzico/Stripe) |
| İşlem | Çağrı detayları (açan/cevaplayan, zaman, eşleşme sonucu), uygulama içi etkileşim | Sistem logu |
| Cihaz / Teknik | IP, cihaz kimliği, push token (APNs/FCM), işletim sistemi versiyonu, çerez | Otomatik (uygulama/web) |
| Pazarlama | İletişim izinleri, bildirim tercihleri | Açık rıza ekranı |

---

## 3. Kişisel Verilerin İşlenme Amaçları

Verileriniz aşağıdaki amaçlarla işlenir:

- **Üyelik tesisi ve hesap yönetimi** (KVKK m. 5/2-c — sözleşmenin kurulması/ifası)
- **Kan bağışı acil çağrı eşleştirme** — uygun kan grubu ve coğrafi yakınlık eşleştirmesi (KVKK m. 6/3 — açık rıza, sağlık verisi için)
- **Bağış işlemlerinin gerçekleştirilmesi ve makbuz/fatura düzenlenmesi** (KVKK m. 5/2-a — kanunda öngörülmesi: 213 sayılı VUK, 5174 sayılı Kanun)
- **Hizmet sunumu, müşteri destek ve şikayet yönetimi** (KVKK m. 5/2-c, 5/2-f)
- **Yasal yükümlülüklerin yerine getirilmesi** — vergi, suç gelirleri (MASAK), KVKK saklama yükümlülükleri (KVKK m. 5/2-ç)
- **Bilgi güvenliği, dolandırıcılık önleme, suistimal tespiti** (KVKK m. 5/2-f — meşru menfaat)
- **Hizmet iyileştirme, anonimleştirilmiş istatistik üretimi** (KVKK m. 5/2-f)
- **Pazarlama / kampanya / bildirim gönderimi** (KVKK m. 5/1 — açık rıza)

---

## 4. Veri Toplama Yöntemi ve Hukuki Sebep

Veriler; mobil uygulama (iOS/Android), Apple Watch eşlik uygulaması, App Clip, web sitesi, çağrı merkezi ve fiziksel etkinlik formları aracılığıyla elektronik ve fiziksel ortamda toplanır.

| Veri | Hukuki Sebep |
|---|---|
| Ad, e-posta, telefon, adres | Sözleşmenin ifası (m. 5/2-c) |
| Kan grubu, sağlık beyanı | **Açık rıza** (m. 6/3) |
| Ödeme/bağış kaydı | Kanuni yükümlülük (m. 5/2-a) — VUK |
| Konum (acil eşleştirme) | Açık rıza (m. 5/1) |
| Konum (genel hizmet) | Meşru menfaat (m. 5/2-f) |
| IP, log, güvenlik kayıtları | Meşru menfaat + 5651 sayılı Kanun |
| Pazarlama iletişimi | Açık rıza + 6563 sayılı Kanun (İYS) |

---

## 5. Kişisel Verilerin Aktarımı

### Yurt İçi Aktarım
- Ödeme sağlayıcı (Iyzico vb.) — bağış işleminin tamamlanması için
- Resmi merciler — yasal talep halinde
- SMS sağlayıcı (yurt içi) — doğrulama kodu

### Yurt Dışı Aktarım (KVKK m. 9)
hangel; bulut altyapısı, kimlik doğrulama, mesajlaşma ve analitik amacıyla aşağıdaki yurt dışı sağlayıcıları kullanır. Aktarımlar **KVKK 2024 yurt dışı aktarım rehberi** uyarınca **Standart Sözleşme Hükümleri (SSH/SSCC)** imzalanarak ve/veya KVKK Kurulu izni alınarak; özel nitelikli veriler için **ayrıca açık rıza** (m. 9/6) ile gerçekleştirilir.

| Sağlayıcı | Ülke | Amaç | Hukuki Mekanizma |
|---|---|---|---|
| Google Firebase / Google Cloud | ABD / AB | Veritabanı, kimlik doğrulama, hosting, fonksiyonlar, FCM push | SSCC + açık rıza (sağlık verisi) |
| Apple App Store Connect / APNs | ABD | Uygulama dağıtımı, iOS push bildirim | SSCC |
| Twilio | ABD | Uluslararası SMS/çağrı | SSCC |
| SendGrid | ABD | İşlemsel e-posta | SSCC |

İlgili sözleşme örnekleri talep üzerine kvkk@hangel.org adresinden temin edilebilir.

---

## 6. Veri Saklama Süreleri

| Veri | Saklama Süresi |
|---|---|
| Üyelik bilgileri | Hesap aktif olduğu sürece + silme talebinden sonra 6 ay (yasal itiraz penceresi) |
| Bağış / fatura kayıtları | VUK m. 253 uyarınca **10 yıl** |
| Çağrı / eşleştirme logları | 2 yıl (uyuşmazlık ve audit) |
| Konum verisi (gerçek zamanlı) | Çağrı kapandıktan sonra anonimleştirilir; 30 gün ham log |
| Sunucu / erişim logları | 5651 sayılı Kanun uyarınca **2 yıl** |
| Pazarlama izinleri | İzin geri alınana kadar + 3 yıl ispat |
| Sağlık verisi (kan grubu) | Hesap silindiğinde derhal silinir / anonimleştirilir |

Süre sonunda veriler **silinir, yok edilir veya anonim hale getirilir** (Kişisel Verilerin Silinmesi, Yok Edilmesi veya Anonim Hale Getirilmesi Hakkında Yönetmelik).

---

## 7. İlgili Kişinin Hakları (KVKK m. 11)

İlgili kişi olarak KVKK uyarınca şu haklara sahipsiniz:

a) Kişisel verinizin işlenip işlenmediğini öğrenme,
b) İşlenmişse buna ilişkin bilgi talep etme,
c) İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme,
ç) Yurt içi/yurt dışı aktarıldığı üçüncü kişileri bilme,
d) Eksik/yanlış işlenmişse düzeltilmesini isteme,
e) Silinmesini/yok edilmesini isteme,
f) Düzeltme/silme işlemlerinin aktarılan üçüncü kişilere bildirilmesini isteme,
g) Otomatik sistemlerle yapılan analize itiraz etme,
ğ) Kanuna aykırı işleme nedeniyle zararın giderilmesini talep etme.

### Başvuru Kanalları
- **E-posta (KEP veya elektronik imzalı):** kvkk@hangel.org
- **Posta:** [merkez adresi placeholder] — "KVKK Başvuru" notuyla
- **Uygulama içi:** Ayarlar → Gizlilik → Veri Talebi formu
- **VERBİS / Kurul başvurusu:** https://verbis.kvkk.gov.tr

Başvurular **Veri Sorumlusuna Başvuru Usul ve Esasları Hakkında Tebliğ** uyarınca **30 gün** içinde yanıtlanır.

---

## 8. Özel Nitelikli Veriler — Sağlık (Kan Grubu) Açık Rıza

Kan grubu ve bağış uygunluk bilgisi **KVKK m. 6** kapsamında özel nitelikli sağlık verisidir. Bu veri yalnızca:
- Acil kan ihtiyacı eşleştirmesi,
- Uygunluk takibi (son bağış tarihi),
- Kullanıcı talebi halinde STK / sağlık kuruluşu paylaşımı

amaçlarıyla işlenir. Uygulamaya kaydolurken ve kan grubu girerken **ayrı açık rıza ekranı** ile onayınız alınır. Açık rızanızı dilediğiniz zaman Profil → Gizlilik → Sağlık Verisi Rızası menüsünden geri alabilirsiniz. Rıza geri alındığında ilgili veri silinir ve eşleştirme havuzundan çıkarılırsınız.

Sağlık Bakanlığı **Kişisel Sağlık Verileri Hakkında Yönetmelik** ek korumalar uygulanır.

---

## 9. Çocukların Verileri

hangel hizmetleri **16 yaş ve üzeri** kullanıcılar içindir. 16 yaş altı bireylerin hesap açması için **veli/vasi açık onayı** zorunludur; doğrulanmayan hesaplar silinir. Çocuğa ait verinin işlendiğinin tespiti halinde veli, kvkk@hangel.org adresinden silme talep edebilir.

---

## 10. Otomatik Karar Verme ve Profilleme

hangel **kan eşleştirme algoritması** otomatik bir karar mekanizması olarak şunları değerlendirir: kan grubu uyumu (ABO/Rh), coğrafi mesafe, son bağış üzerinden geçen süre, kullanıcı uygunluk beyanı. Algoritma yalnızca **bildirim önceliği** belirler; hukuki sonuç doğuran (örn. üyelik reddi, finansal etki) otomatik karar üretmez. Sonuca itiraz hakkınız (m. 11/g) saklıdır; manuel inceleme talebi kvkk@hangel.org üzerinden yapılabilir.

---

## 11. Değişiklikler

Bu Aydınlatma Metni mevzuat veya hizmet değişikliklerine bağlı olarak güncellenebilir. Önemli değişikliklerde uygulama içi bildirim ve e-posta ile bilgilendirilirsiniz. Güncel sürüm her zaman https://hangel.org/kvkk adresinde yayınlanır.

---

*Bu metin 6698 sayılı Kanun m. 10 ve Aydınlatma Tebliği uyarınca hazırlanmıştır. Hukuki nihai onay için yetkili KVKK uzmanı avukata danışılması gerekir.*
