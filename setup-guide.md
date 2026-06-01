# hangel Hub - Yerel Kurulum Kılavuzu

Bu projeyi kendi bilgisayarınızda (Mac, Windows veya Linux) çalıştırmak için aşağıdaki adımları takip edin.

## 1. Gereksinimler

Projenin çalışması için bilgisayarınızda **Node.js** kurulu olmalıdır.

### Node.js Kurulumu (Mac için)
1. [https://nodejs.org/](https://nodejs.org/) adresine gidin.
2. **LTS** (Önerilen) sürümünü indirin ve `.pkg` dosyasını çalıştırarak kurulumu tamamlayın.
3. Kurulumun başarılı olduğunu doğrulamak için Terminal'i açın ve şu komutları yazın:
   ```bash
   node -v
   npm -v
   ```
   (Sürüm numaralarını görüyorsanız hazırsınız demektir.)

## 2. Projeyi Çalıştırma

Terminal üzerinden proje klasörüne gidin ve şu komutları sırasıyla çalıştırın:

### Bağımlılıkları Yükleyin
Bu komut, projenin çalışması için gerekli olan tüm kütüphaneleri (React, Next.js, Tailwind vb.) internetten indirir.
```bash
npm install
```

### Geliştirme Sunucusunu Başlatın
Projenizi yerel sunucuda yayına alır.
```bash
npm run dev
```

## 3. Tarayıcıda Görüntüleme
Komut çalıştıktan sonra terminalde bir adres belirecektir (genellikle `http://localhost:3000`). Tarayıcınızı açıp bu adrese giderek uygulamayı test edebilirsiniz.

## Sorun Giderme
- **"npm command not found" hatası:** Node.js yüklü değildir veya terminalin yeniden başlatılması gerekir.
- **"permission denied" hatası:** Mac'te bazı durumlarda komutun başına `sudo` eklemeniz gerekebilir: `sudo npm install`.
- **Eksik Dosyalar:** İndirdiğiniz zip dosyasında `.env` dosyasının olduğundan emin olun (Genkit ve Firebase ayarları için gereklidir).
