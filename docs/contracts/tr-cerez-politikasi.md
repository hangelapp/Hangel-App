> ⚠️ **DRAFT — HUKUKİ İNCELEME GEREKLİ**
> Bu metin hangel platformu için taslak çerez politikasıdır. Yürürlüğe konulmadan önce KVKK uyum danışmanı / avukat onayı gereklidir. Tarihler, veri sorumlusu bilgileri ve üçüncü taraf listesi yayın öncesi güncellenmelidir.

# hangel Çerez Politikası

**Son güncelleme:** [GG.AA.YYYY]
**Veri Sorumlusu:** [Şirket Ünvanı] — VERBİS Kayıt No: [XXXXX]
**İletişim:** kvkk@hangel.org

---

## 1. Giriş

hangel ("Platform"), `hangel.org` web sitesi ile iOS/Android mobil uygulamaları üzerinden hizmet sunarken kullanıcı deneyimini iyileştirmek, hizmetlerin güvenliğini sağlamak ve yasal yükümlülüklerini yerine getirmek amacıyla çerezler ve benzeri izleme teknolojileri (yerel depolama, oturum depolama, SDK tanımlayıcıları) kullanmaktadır.

Bu politika; **6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK)**, **5651 sayılı Internet Ortamında Yapılan Yayınların Düzenlenmesi Kanunu**, **6563 sayılı Elektronik Ticaretin Düzenlenmesi Hakkında Kanun (ETK)** ile **Kişisel Verileri Koruma Kurulu'nun 20.06.2024 tarihli ve 2024/1158 sayılı çerez kullanımına ilişkin rehber kararı** uyarınca hazırlanmıştır.

## 2. Çerez Nedir?

Çerez; web sitesi veya uygulamanın, ziyaretçinin cihazına yerleştirdiği küçük metin dosyalarıdır. Çerezler, oturum açık kaldığı süre (oturum çerezleri) veya önceden belirlenmiş bir tarihe kadar (kalıcı çerezler) saklanabilir. Mobil uygulamada eşdeğeri olarak SDK tanımlayıcıları (IDFA/AAID), `UserDefaults`/`SharedPreferences` kayıtları ve Firebase Installation ID kullanılır.

## 3. Kullandığımız Çerez Türleri

### 3.1 Zorunlu Çerezler (Açık rıza gerektirmez — KVKK m.5/2-c, f)
| Çerez | Amaç | Saklama |
|---|---|---|
| `__session` | Firebase Auth oturum yönetimi | Oturum süresince |
| `csrf_token` | CSRF saldırı koruması | Oturum süresince |
| `cookie_consent` | Çerez tercih kaydı | 12 ay |
| `lang_pref` | Dil tercihi (`tr`/`en`/`ar`) | 12 ay |

### 3.2 Performans / Analitik Çerezleri (Açık rıza gerektirir)
| Hizmet | Sağlayıcı | Amaç | Saklama |
|---|---|---|---|
| **Firebase Analytics (GA4)** | Google Ireland Ltd. | Anonim kullanım istatistikleri, ekran görüntüleme, event tracking | 14 ay |
| **Firebase Crashlytics** | Google Ireland Ltd. | Çökme/hata raporları, stack trace | 90 gün |
| **Firebase Performance Monitoring** | Google Ireland Ltd. | Sayfa yükleme süresi, ağ gecikmesi | 90 gün |

### 3.3 Fonksiyonel Çerezler
| Çerez | Amaç | Saklama |
|---|---|---|
| `theme` | Açık/koyu tema tercihi | 12 ay |
| `last_ngo_view` | Son ziyaret edilen STK listesi (hızlı erişim) | 30 gün |
| Push token (FCM Installation ID) | Bildirim teslimatı | Uygulama silinene kadar |

### 3.4 Hedefleme / Pazarlama Çerezleri (Açık rıza gerektirir)
| Hizmet | Sağlayıcı | Amaç | Saklama |
|---|---|---|---|
| **Google Ads Conversion** | Google Ireland Ltd. | Bağış kampanyası dönüşüm ölçümü | 90 gün |
| **Meta Pixel** *(opsiyonel — aktif değilse kaldırılacak)* | Meta Platforms Ireland | Sosyal medya remarketing | 90 gün |

> **Not:** Hedefleme çerezleri yalnızca çerez bannerındaki "Pazarlama" kategorisini onayladığınızda yüklenir.

## 4. İşlenen Veri Kategorileri

Çerezler üzerinden işlenen veriler şunlardır: anonim cihaz tanımlayıcısı, IP adresi (5651 sayılı Kanun gereği 2 yıl loglanır), tarayıcı/işletim sistemi bilgisi, ziyaret edilen sayfalar, oturum süresi, dil tercihi, yaklaşık konum (ülke/şehir bazında).

**E-posta, ad-soyad, kan grubu gibi kişisel veriler çerezlere yazılmaz**; bu veriler Firebase Authentication ve Firestore üzerinden ayrı politikalarla işlenir (bkz. *KVKK Aydınlatma Metni*).

## 5. Yurt Dışı Aktarım

Firebase ve Google Analytics hizmetleri, **Google LLC (ABD)** ve **Google Ireland Ltd. (İrlanda — AB)** sunucularında işlenebilir. KVKK m.9 uyarınca aktarım, **açık rızanız** ve Google'ın **AB-ABD Veri Gizliliği Çerçevesi (Data Privacy Framework)** sertifikasyonu kapsamında gerçekleşmektedir.

## 6. Çerez Tercihlerini Yönetme

- **Çerez banner:** Siteye ilk girişinizde gösterilen banner üzerinden kategori bazlı (zorunlu hariç) kabul/red yapabilirsiniz.
- **Ayarlar sayfası:** Mevcut tercihlerinizi istediğiniz an `/settings/privacy/cookies` adresinden güncelleyebilirsiniz.
- **Tarayıcı temizleme:** Tarayıcınızın "Ayarlar > Gizlilik > Tarama verilerini temizle" menüsünden tüm çerezleri silebilirsiniz. (Chrome: `chrome://settings/cookies`, Safari: Tercihler > Gizlilik, Firefox: `about:preferences#privacy`.)
- **Mobil uygulama:** iOS `Ayarlar > hangel > Reklam İzleme`, Android `Ayarlar > Google > Reklamlar > Reklam Kimliğini Sıfırla` ile reklam tanımlayıcısını sıfırlayabilirsiniz.

## 7. Haklarınız

KVKK m.11 kapsamında; verilerinize erişme, düzeltme, silme, işlemeye itiraz etme ve veri taşınabilirliği haklarınız bulunmaktadır. Başvurularınızı `kvkk@hangel.org` adresine veya VERBİS'te kayıtlı tebligat adresimize iletebilirsiniz. Şikâyetler için KVK Kurumu: `kvkk.gov.tr`.

## 8. Güncellemeler

Bu politika mevzuat değişiklikleri veya kullanılan teknolojilerin güncellenmesi durumunda revize edilir. Önemli değişiklikler uygulama içi bildirim ile duyurulur.
