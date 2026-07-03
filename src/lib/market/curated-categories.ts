// Kürasyonlu market kategorileri — ürünün category yolu + başlığından anahtar
// kelimeyle eşlenir. Öncelik: ÖNCE ürün tipi (Ayakkabı/Elektronik/Kozmetik…),
// SONRA cinsiyet (Kadın/Erkek), en son geniş (Ev & Yaşam). İlk eşleşen kazanır.
// Market ana sayfasında "Mağazalar" altında, ÜRÜN SAYISINA göre sıralı satırlar.

export const CURATED_CATEGORIES: { name: string; kw: string[] }[] = [
  { name: 'Ayakkabı', kw: ['ayakkabı', 'ayakkabi', 'sneaker', 'spor ayakkab', 'bot', 'çizme', 'sandalet', 'terlik', 'topuklu', 'babet', 'loafer'] },
  { name: 'Elektronik', kw: ['elektronik', 'telefon', 'cep telefon', 'laptop', 'bilgisayar', 'tablet', 'televizyon', ' tv', 'kulaklık', 'kulaklik', 'akıllı saat', 'monitör', 'klavye', 'yazıcı', 'kamera', 'oyun konsol', 'powerbank', 'şarj'] },
  { name: 'Beyaz Eşya', kw: ['buzdolab', 'çamaşır makine', 'bulaşık makine', 'kurutma makine', 'ankastre', 'fırın', 'ocak', 'davlumbaz', 'klima'] },
  { name: 'Kozmetik', kw: ['kozmetik', 'parfüm', 'parfum', 'makyaj', 'ruj', 'fondöten', 'maskara', 'oje', 'cilt bakım', 'şampuan', 'sampuan', 'krem', 'deodorant', 'saç bakım'] },
  { name: 'Ev Tekstili', kw: ['ev tekstil', 'nevresim', 'havlu', 'perde', 'yorgan', 'yastık', 'çarşaf', 'battaniye', 'pike', 'kırlent', 'halı', 'kilim'] },
  { name: 'Zücaciye', kw: ['zücaciye', 'zucaciye', 'porselen', 'tabak', 'bardak', 'kupa', 'fincan', 'çatal', 'kaşık', 'bıçak seti', 'tencere', 'tava', 'servis'] },
  { name: 'Mobilya & Dekorasyon', kw: ['mobilya', 'dekorasyon', 'koltuk', 'sehpa', 'lambader', 'gardırop', 'yatak', 'masa', 'sandalye', 'raf', 'aydınlatma', 'avize'] },
  { name: 'Anne & Bebek', kw: ['bebek', 'bebe ', 'çocuk', 'oyuncak', 'bebek arabası', 'mama', 'biberon', 'bez'] },
  { name: 'Spor & Outdoor', kw: ['spor', 'fitness', 'outdoor', 'kamp', 'bisiklet', 'dumbell', 'yoga', 'forma', 'mayo'] },
  { name: 'Kitap & Kırtasiye', kw: ['kitap', 'roman', 'dergi', 'defter', 'kırtasiye', 'kalem', 'boya seti'] },
  { name: 'Gıda & İçecek', kw: ['gıda', 'çikolata', 'kahve', ' çay', 'atıştırmalık', 'bakliyat', 'zeytin', 'bal ', 'kuruyemiş', 'içecek'] },
  { name: 'Aksesuar', kw: ['aksesuar', 'çanta', 'cüzdan', 'kemer', 'şapka', ' saat', 'gözlük', 'takı', 'kolye', 'yüzük', 'bileklik', 'küpe', 'atkı', 'eldiven'] },
  { name: 'İnşaat & Yapı Market', kw: ['inşaat', 'hırdavat', 'yapı market', ' boya', 'matkap', 'vida', 'el aleti', 'bahçe', 'nalbur'] },
  { name: 'Otomotiv', kw: ['oto ', 'otomotiv', 'araç', 'lastik', 'motor yağ', 'aksesuar araç'] },
  { name: 'Kadın Giyim', kw: ['kadın', 'kadin', ' women', 'elbise', 'etek', 'bluz', 'tayt', 'sütyen', 'tunik', 'kadın giyim'] },
  { name: 'Erkek Giyim', kw: ['erkek', ' men', 'gömlek', 'kravat', 'boxer', 'erkek giyim'] },
  { name: 'Ev & Yaşam', kw: ['ev ', 'yaşam', 'mutfak', 'banyo', 'temizlik', 'düzenleyici'] },
];

export function curatedCategoryOf(category?: string | null, title?: string): string | null {
  const hay = ` ${(category || '').toLocaleLowerCase('tr')} ${(title || '').toLocaleLowerCase('tr')} `;
  for (const c of CURATED_CATEGORIES) {
    if (c.kw.some((k) => hay.includes(k))) return c.name;
  }
  return null;
}
