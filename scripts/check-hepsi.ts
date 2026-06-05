import { fetchAllAgencyOffers } from '../src/lib/api-clients';
async function main() {
  const all = await fetchAllAgencyOffers();
  const names = all.map(b => b.name.toLowerCase());
  console.log('TOPLAM:', all.length, 'marka\n');
  console.log('═══ TÜM MARKALAR (alfabetik) ═══');
  all.map(b => b.name).sort((a, b) => a.localeCompare(b, 'tr'))
    .forEach(n => console.log('  ' + n));

  console.log('\n═══ TÜRKİYE\'DE OLAN AMA BİZDE OLMAYAN BÜYÜK MARKALAR ═══');
  const candidates = [
    // Marketplace
    'Hepsiburada', 'Trendyol', 'GittiGidiyor', 'Çiçeksepeti', 'Sahibinden',
    'Migros Sanal Market', 'CarrefourSA Online', 'Migros Hemen', 'A101 Kapında',
    // Yemek
    'Yemeksepeti', 'Getir', 'Wolt', 'Trendyol Yemek', 'Migros Yemek', 'Banabi',
    // Tatil
    'THY', 'Pegasus', 'AnadoluJet', 'Booking.com', 'Trivago', 'Setur',
    'Tatil Sepeti', 'Tatil Budur', 'Otelz', 'Enuygun', 'Şehir Fırsatı',
    'Jolly', 'Coral', 'ETS', 'Türk Hava Yolları', 'Hotels.com',
    // Bankacılık / Finans
    'Garanti BBVA', 'Akbank', 'İş Bankası', 'Yapı Kredi', 'Ziraat',
    'Halkbank', 'VakıfBank', 'Papara', 'Param', 'BiBit', 'Ininal', 'Tosla',
    'Enpara', 'QNB Finansbank', 'DenizBank', 'TEB',
    // Telekom
    'Turkcell', 'Vodafone', 'Türk Telekom', 'BiP', 'Lifecell',
    // Eğitim / Kurs
    'Udemy', 'BTK Akademi', 'Coursera', 'Cambly', 'EnglishCentral',
    'Kahoot', 'Duolingo',
    // Decathlon / spor
    'Decathlon', 'Adidas', 'Nike', 'Under Armour',
    // Tech / Yazılım
    'Apple', 'Samsung', 'Lenovo', 'Asus', 'HP', 'Dell', 'Logitech',
    'Microsoft', 'Spotify', 'Netflix', 'BluTV', 'Exxen', 'TabiiOyna',
    // Sigorta / Otomotiv
    'Doğuş Oto', 'Renault', 'Volkswagen', 'Allianz', 'Anadolu Sigorta',
    'AvivaSA', 'Tamamlayıcı Sağlık',
    // Diğer
    'Sephora', 'Watsons', 'Gratis', 'Rossmann', 'Migros Jet', 'Rossmann TR',
    'Letgo', 'Kariyer.net', 'YeniBiris', 'Yenibiris.com',
  ];
  const missing = candidates.filter(c => !names.some(n => {
    const cl = c.toLowerCase();
    return n === cl || n.includes(cl) || cl.includes(n);
  }));
  const present = candidates.filter(c => names.some(n => {
    const cl = c.toLowerCase();
    return n === cl || n.includes(cl) || cl.includes(n);
  }));
  console.log('\nBİZDE VAR (' + present.length + '):');
  present.forEach(n => console.log('  ✅ ' + n));
  console.log('\nBİZDE YOK / EKLENEBİLECEK (' + missing.length + '):');
  missing.forEach(n => console.log('  ❌ ' + n));
}
main();
