import type { LibrarySection } from './library';

/**
 * STK'ların indirip kullanabileceği pratik şablonlar. Kütüphane içinde normal bir
 * bölüm gibi görünür (aranabilir, detay sayfasında açılır) ve detay sayfasında
 * "Word olarak indir" ile .doc olarak indirilebilir (bkz. library/[slug]/page).
 *
 * İçerik HTML'dir; köşeli parantezli [ALANLAR] kullanıcı tarafından doldurulur.
 */
export const TEMPLATES_SECTION_SLUG = 'sablonlar-araclar';

export const templatesSection: LibrarySection = {
  slug: TEMPLATES_SECTION_SLUG,
  title: 'Şablonlar & Araçlar',
  description: 'STK ve gönüllüler için hazır, indirilebilir şablonlar (Word olarak indirilebilir).',
  icon: 'FileText',
  items: [
    {
      slug: 'sablon-proje-butcesi',
      title: 'Proje Bütçe Şablonu',
      content: `
<p>Bir proje başvurusu veya hibe için kullanılabilecek temel bütçe tablosu. [ALANLARI] kendi projenize göre doldurun.</p>
<h3>Proje Bilgileri</h3>
<ul>
  <li><strong>Proje Adı:</strong> [PROJE ADI]</li>
  <li><strong>Kurum:</strong> [KURUM ADI]</li>
  <li><strong>Süre:</strong> [BAŞLANGIÇ] – [BİTİŞ]</li>
  <li><strong>Toplam Bütçe:</strong> [TOPLAM] ₺</li>
</ul>
<h3>Bütçe Kalemleri</h3>
<table border="1" cellpadding="6" cellspacing="0">
  <thead><tr><th>Kalem</th><th>Açıklama</th><th>Birim</th><th>Adet</th><th>Birim Fiyat (₺)</th><th>Toplam (₺)</th></tr></thead>
  <tbody>
    <tr><td>Personel</td><td>[Görev]</td><td>Ay</td><td>[ ]</td><td>[ ]</td><td>[ ]</td></tr>
    <tr><td>Malzeme/Ekipman</td><td>[Açıklama]</td><td>Adet</td><td>[ ]</td><td>[ ]</td><td>[ ]</td></tr>
    <tr><td>Ulaşım</td><td>[Açıklama]</td><td>Sefer</td><td>[ ]</td><td>[ ]</td><td>[ ]</td></tr>
    <tr><td>Eğitim/Etkinlik</td><td>[Açıklama]</td><td>Etkinlik</td><td>[ ]</td><td>[ ]</td><td>[ ]</td></tr>
    <tr><td>Tanıtım/İletişim</td><td>[Açıklama]</td><td>Adet</td><td>[ ]</td><td>[ ]</td><td>[ ]</td></tr>
    <tr><td>İdari Giderler (%)</td><td>Genel yönetim payı</td><td>%</td><td>[ ]</td><td>—</td><td>[ ]</td></tr>
    <tr><td><strong>GENEL TOPLAM</strong></td><td></td><td></td><td></td><td></td><td><strong>[ ]</strong></td></tr>
  </tbody>
</table>
<p><em>İpucu: Hibe veren kurumun istediği bütçe formatı varsa kalem adlarını ona göre uyarlayın.</em></p>`,
    },
    {
      slug: 'sablon-gonullu-sozlesmesi',
      title: 'Gönüllü Sözleşmesi',
      content: `
<p>STK ile gönüllü arasında karşılıklı beklentileri tanımlayan örnek sözleşme. Hukuki bağlayıcılık için kurumunuzun avukatına danışın.</p>
<h3>Gönüllü Katılım Sözleşmesi</h3>
<p>Bu sözleşme <strong>[KURUM ADI]</strong> ("Kurum") ile <strong>[GÖNÜLLÜ ADI SOYADI]</strong> ("Gönüllü") arasında [TARİH] tarihinde düzenlenmiştir.</p>
<h4>1. Gönüllülük Konusu</h4>
<p>Gönüllü, Kurum'un <strong>[FAALİYET/PROJE]</strong> kapsamında <strong>[ROL/GÖREV]</strong> olarak katkı sağlayacaktır.</p>
<h4>2. Süre ve Zaman</h4>
<p>Gönüllülük [BAŞLANGIÇ] – [BİTİŞ] tarihleri arasında, haftada yaklaşık [SAAT] saat olacak şekilde planlanmıştır.</p>
<h4>3. Tarafların Sorumlulukları</h4>
<ul>
  <li>Gönüllü: Görevini özenle yerine getirir, Kurum kurallarına ve gizliliğe uyar.</li>
  <li>Kurum: Gerekli yönlendirme, eğitim ve güvenli çalışma ortamını sağlar.</li>
</ul>
<h4>4. Gizlilik ve KVKK</h4>
<p>Gönüllü, faaliyet sırasında öğrendiği kişisel verileri ve kurum bilgilerini gizli tutar; KVKK'ya uygun davranır.</p>
<h4>5. Masraflar / Sigorta</h4>
<p>[Varsa ulaşım/yemek desteği ve gönüllü sigortası bilgisi yazılır.]</p>
<h4>6. Fesih</h4>
<p>Taraflar [ ] gün önceden bildirerek gönüllülüğü sonlandırabilir.</p>
<table border="0" cellpadding="6"><tr><td>Gönüllü: ____________________<br/>İmza / Tarih</td><td>Kurum Yetkilisi: ____________________<br/>İmza / Tarih</td></tr></table>`,
    },
    {
      slug: 'sablon-faaliyet-raporu',
      title: 'Faaliyet Raporu Şablonu',
      content: `
<p>Bir etkinlik veya dönem sonrası paydaşlara/bağışçılara sunulabilecek faaliyet raporu iskeleti.</p>
<h3>[KURUM ADI] — Faaliyet Raporu</h3>
<p><strong>Dönem:</strong> [BAŞLANGIÇ] – [BİTİŞ] · <strong>Hazırlayan:</strong> [AD SOYAD]</p>
<h4>1. Özet</h4>
<p>[Dönemin/etkinliğin 3-4 cümlelik özeti.]</p>
<h4>2. Amaç ve Hedefler</h4>
<ul><li>[Hedef 1]</li><li>[Hedef 2]</li></ul>
<h4>3. Yapılan Faaliyetler</h4>
<table border="1" cellpadding="6" cellspacing="0">
  <thead><tr><th>Tarih</th><th>Faaliyet</th><th>Yer</th><th>Katılımcı Sayısı</th></tr></thead>
  <tbody><tr><td>[ ]</td><td>[ ]</td><td>[ ]</td><td>[ ]</td></tr><tr><td>[ ]</td><td>[ ]</td><td>[ ]</td><td>[ ]</td></tr></tbody>
</table>
<h4>4. Ulaşılan Sonuçlar (Etki)</h4>
<ul><li>Faydalanıcı sayısı: [ ]</li><li>Gönüllü saati: [ ]</li><li>[Diğer ölçülebilir çıktı]</li></ul>
<h4>5. Bütçe Kullanımı</h4>
<p>Planlanan: [ ] ₺ · Gerçekleşen: [ ] ₺</p>
<h4>6. Öğrenilenler ve Sonraki Adımlar</h4>
<p>[İyi giden / geliştirilecek noktalar ve plan.]</p>`,
    },
    {
      slug: 'sablon-dilekce-ornegi',
      title: 'Dilekçe / Resmi Başvuru Örneği',
      content: `
<p>Kamu kurumuna (kaymakamlık, belediye, il müdürlüğü vb.) yapılacak resmi başvuru/dilekçe örneği.</p>
<p style="text-align:right">[TARİH]</p>
<p><strong>[MAKAM ADI]</strong><br/>[Örn: ... Kaymakamlığına / ... Belediye Başkanlığına]</p>
<p><strong>Konu:</strong> [Başvurunun konusu — örn: Etkinlik izni talebi]</p>
<p>Derneğimiz/Vakfımız <strong>[KURUM ADI]</strong> olarak, [AÇIKLAMA: ne talep ediyorsunuz, neden, ne zaman, nerede]. </p>
<p>Gereğini bilgilerinize arz ederim.</p>
<p style="margin-top:24px">Saygılarımla,<br/><strong>[AD SOYAD]</strong><br/>[Unvan — örn: Yönetim Kurulu Başkanı]<br/>[KURUM ADI]</p>
<p><strong>Ekler:</strong> [Varsa belge listesi]<br/><strong>İletişim:</strong> [Telefon / E-posta / Adres]</p>`,
    },
    {
      slug: 'sablon-bagis-makbuzu',
      title: 'Bağış Makbuzu Şablonu',
      content: `
<p>Bağışçıya verilebilecek basit bağış makbuzu. (Resmi makbuz için mevzuata ve mali müşavirinize danışın.)</p>
<h3>[KURUM ADI] — Bağış Makbuzu</h3>
<p><strong>Makbuz No:</strong> [ ] · <strong>Tarih:</strong> [ ]</p>
<table border="1" cellpadding="6" cellspacing="0">
  <tr><td>Bağışçı Adı/Unvanı</td><td>[ ]</td></tr>
  <tr><td>Bağış Türü</td><td>[Nakit / Ayni]</td></tr>
  <tr><td>Tutar / Açıklama</td><td>[ ] ₺ / [ayni ise açıklama]</td></tr>
  <tr><td>Bağışın Amacı</td><td>[Genel / Belirli proje]</td></tr>
</table>
<p style="margin-top:16px">Bu makbuz [KURUM ADI] adına düzenlenmiştir.</p>
<p>Yetkili: ____________________ İmza/Kaşe</p>`,
    },
    {
      slug: 'sablon-yk-toplanti-tutanagi',
      title: 'Yönetim Kurulu Toplantı Tutanağı',
      content: `
<p>Dernek/vakıf yönetim kurulu toplantısı için tutanak iskeleti.</p>
<h3>[KURUM ADI] — Yönetim Kurulu Toplantı Tutanağı</h3>
<p><strong>Toplantı No:</strong> [ ] · <strong>Tarih/Saat:</strong> [ ] · <strong>Yer:</strong> [ ]</p>
<p><strong>Katılanlar:</strong> [Ad Soyad — Unvan, ...]</p>
<p><strong>Katılmayanlar:</strong> [ ]</p>
<h4>Gündem</h4>
<ol><li>[Gündem maddesi 1]</li><li>[Gündem maddesi 2]</li></ol>
<h4>Görüşmeler ve Kararlar</h4>
<ul>
  <li><strong>Karar [No]:</strong> [Karar metni] — Oy: [Kabul/Ret/Çekimser sayısı]</li>
  <li><strong>Karar [No]:</strong> [Karar metni]</li>
</ul>
<p style="margin-top:16px">Toplantı [SAAT]'te sonlandırılmıştır. İş bu tutanak imza altına alınmıştır.</p>
<p>[Üye imzaları]</p>`,
    },
  ],
};
