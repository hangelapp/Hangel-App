# hangel Hub - Dinamik Veri Noktaları ve Dashboard Analizi

Bu döküman, uygulamada statik (mock) veriden kurtarılıp Firebase veritabanına (Firestore) bağlanması gereken temel dinamik noktaları listeler.

## 1. Kullanıcı Profili ve Gamification
Dashboard ve Veritabanı bağlantısı gereken alanlar:
- **Kişisel Bilgiler:** Ad soyad, iletişim, adres, kan grubu.
- **Gönüllülük Kimliği:** Yetkinlikler, ilgi alanları, eğitim ve kariyer geçmişi.
- **Etki Karnesi:** Toplam sosyal etki puanı, bağış tutarı, gönüllülük saati.
- **Rozetler ve Sertifikalar:** Kazanılan/bekleyen rozetler ve resmi sertifikalar.
- **Cüzdan:** hangel kart bakiyesi ve işlem geçmişi.

## 2. Zaman Tüneli (Feed)
- **Gönderiler:** STK ve Markaların paylaştığı içerikler, görseller ve videolar.
- **Etkileşim:** Beğeni sayıları, yorumlar ve paylaşım istatistikleri.
- **Sponsorlu İçerikler:** Markaların reklam amaçlı öne çıkardığı gönderiler.

## 3. Market (Markalar ve Bağış)
- **Marka Katalogu:** Aktif markalar, kategorileri ve anlık bağış oranları.
- **Kampanyalar:** STK'lara özel açılan alışveriş görevleri ve hedefleri.
- **Bağış Takibi:** Hangi alışverişten hangi STK'ya ne kadar bağış gittiğinin anlık takibi.

## 4. Gönüllülük (İmece)
- **İlanlar:** Aktif gönüllülük fırsatları, lokasyon verileri ve gereken yetkinlikler.
- **Başvuru Yönetimi:** Kullanıcının başvuruları (Beklemede, Onaylandı, Reddedildi).
- **Kota Takibi:** Aranan gönüllü sayısı ve mevcut başvuru sayısı.

## 5. Sivil Toplum Kuruluşları (STK)
- **STK Profilleri:** Hakkında yazıları, desteklediği SKA (SDG) hedefleri.
- **Şeffaflık Endeksi:** Yüklenen resmi belgelerin durumu ve hesaplanan güven puanı.
- **Takipçi Sistemi:** STK'yı takip eden kullanıcı sayısı.

## 6. Acil Durum Merkezi
- **Canlı Çağrılar:** Kan ihtiyacı veya afet durumlarında açılan anlık bildirimler.
- **Raporlama:** Kullanıcılardan gelen afet ihbarlarının konumsal verisi.

## 7. Yönetim Panelleri (Dashboard)
### NGO Admin Paneli
- **Gönüllü Yönetimi:** Başvuruları onaylama/reddetme arayüzü.
- **İstatistik:** Bağış hacmi ve gönüllü demografisi grafikleri (Recharts entegrasyonu).
- **İçerik:** Kendi profilini, haberlerini ve etkinliklerini yönetme alanı.

### Super Admin Paneli
- **Kuruluş Onayları:** Yeni STK, marka ve kulüp başvurularını denetleme.
- **Sistem Ayarları:** Puanlama katsayılarını ve global platform parametrelerini değiştirme.
- **Denetim:** Şikayet edilen gönderilerin veya kullanıcıların yönetimi.

## 8. Kütüphane ve Eğitim
- **İçerik Yönetimi:** Akademik makaleler, rehberler ve sözlük terimlerinin dinamik olarak eklenmesi.
- **Asistan:** Yapay zeka asistanının (Genkit) kütüphane verileri üzerinden yanıt vermesi.
