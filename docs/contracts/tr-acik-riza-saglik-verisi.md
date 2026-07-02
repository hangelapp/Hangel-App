> ⚠️ **DRAFT — HUKUKİ İNCELEME GEREKLİ**
> Bu metin hangel platformunun kan grubu ve sağlık verisi işlemesine ilişkin açık rıza taslağıdır. KVKK m.6 özel nitelikli veri kapsamında olduğundan, yayın öncesi mutlaka KVKK uzmanı/avukat onayı ve Sağlık Bakanlığı SBSGM ile veri paylaşım protokolü teyidi gereklidir.

# hangel Sağlık Verisi Açık Rıza Metni

**Veri Sorumlusu:** [Şirket Ünvanı] — VERBİS: [XXXXX]
**İletişim:** kvkk@hangel.org · DPO: dpo@hangel.org

---

## 1. İşlenecek Özel Nitelikli Kişisel Veriler

**6698 sayılı Kişisel Verilerin Korunması Kanunu'nun (KVKK) 6'ncı maddesi** uyarınca "kişinin sağlığına ilişkin veriler" **özel nitelikli kişisel veri** olarak tanımlanmıştır ve **kural olarak işlenmesi yasaktır**; ancak açık rızanızın bulunması hâlinde işlenebilir.

hangel'ın işleyeceği sağlık verileriniz:

- **Kan grubu** (A/B/AB/0 + Rh +/−)
- **Son kan/plazma bağış tarihi** (uygunluk hesabı için)
- **Bağış kısıtı bayrakları** *(opsiyonel — kullanıcı beyanı: kronik hastalık, ilaç kullanımı, gebelik vb.)*
- **Acil kan ihtiyacı çağrılarına yanıt geçmişi**

## 2. İşleme Amaçları

Sağlık verileriniz aşağıdaki **sınırlı amaçlar** için işlenecektir:

1. **Acil kan eşleştirme:** Yakın konumunuzda uyumlu kan grubu talebi oluştuğunda size bildirim gönderilmesi.
2. **Bağışçı uygunluk hesabı:** Son bağış tarihinize göre 90 günlük bekleme süresinin hesaplanması.
3. **Bağış geçmişi:** Bağışçı profilinizde gönüllü olarak yaptığınız bağışların görüntülenmesi.
4. **İstatistiksel raporlama:** Anonimleştirilmiş kan stok haritalarının üretilmesi (kişisel veri içermez).

## 3. İşlemenin Hukuki Sebebi

**KVKK m.6/2** uyarınca **açık rızanıza** dayalı olarak işlenecektir. Açık rıza dışında hiçbir hukuki sebebe (sözleşme, meşru menfaat vb.) dayanılmamaktadır — onay vermemeniz, kan bağışı özelliklerinin devre dışı kalmasına neden olur ancak diğer hangel hizmetlerini (gönüllülük, bağış vb.) kullanmanıza engel değildir.

## 4. Aktarım

| Alıcı | Amaç | Hukuki Sebep |
|---|---|---|
| **T.C. Sağlık Bakanlığı — Kan Hizmetleri Genel Müdürlüğü / SBSGM** *(entegrasyon aktifse)* | Resmî kan stok bildirimi, Kızılay koordinasyonu | KVKK m.6/3 (kanunda öngörülen — 2941 sayılı Kan ve Kan Ürünleri Kanunu) |
| **Türk Kızılay** *(protokol kapsamında)* | Acil çağrı yönlendirme | Açık rıza |
| **Google Firebase (İrlanda / ABD)** | Veri depolama (Firestore) — şifreli at-rest | Açık rıza + KVKK m.9 (DPF sertifikası) |

**Hassas veri yurt dışına şifrelenmiş olarak aktarılır; kan grubu alanı uygulama katmanında ek olarak hash'lenmez fakat Firestore Security Rules ile kullanıcı UID'sine bağlı erişim kontrolü uygulanır.**

## 5. Saklama Süresi

- Aktif kullanıcı: Hesap silinene kadar.
- Hesap silindiğinde: 30 gün içinde tüm sağlık verileri kalıcı olarak silinir (yedeklerde 90 gün rotasyonla).
- Yasal saklama yükümlülüğü olan kayıtlar (resmi kuruma bildirim yapılmış bağış kayıtları): mevzuatın öngördüğü süre boyunca arşivde tutulur.

## 6. Çocuk Verileri (16 Yaş Altı)

Türk Medeni Kanunu m.16 ve KVKK Kurul'un çocuk verilerine ilişkin rehberi uyarınca **18 yaşından küçük kullanıcılar kan bağışı yapamaz**. 16 yaş altı çocukların hangel'de hesap açabilmesi için **veli/vasi açık rızası** zorunludur; kan grubu alanı 18 yaş altı için varsayılan olarak devre dışıdır.

## 7. Haklarınız ve Rızanın Geri Alınması

KVKK m.11 kapsamında verilerinize erişme, düzeltme, silme ve işlemeye itiraz haklarınız bulunmaktadır. Verdiğiniz açık rızayı **istediğiniz an, gerekçe göstermeksizin** `/settings/privacy/health-data` sayfasındaki tek butonla veya `kvkk@hangel.org` adresine e-posta göndererek geri alabilirsiniz. Rıza geri alındığı anda kan grubu verisi silinir ve acil çağrı bildirimleri durur. **Geri alma geriye etkili değildir** — geçmişte gerçekleşmiş işlemler geçerliliğini korur.

---

**☐ Yukarıdaki metni okudum ve sağlık verilerimin belirtilen amaçlarla işlenmesine, T.C. Sağlık Bakanlığı / Türk Kızılay ve Google Firebase'e aktarılmasına açık rıza veriyorum.**
