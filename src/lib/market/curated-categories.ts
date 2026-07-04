// Kürasyonlu market kategorileri.
//
// İKİ ayrı sıra:
//  - CURATED_CATEGORIES: EŞLEŞME önceliği (ürün tipi ÖNCE, cinsiyet SONRA) →
//    "kadın ayakkabı" Ayakkabı'ya düşer, Kadın Giyim'e değil. İlk eşleşen kazanır.
//  - CURATED_ORDER: GÖSTERİM sırası (kullanıcının istediği sabit sıra).

export const CURATED_CATEGORIES: { name: string; kw: string[] }[] = [
  { name: 'Ayakkabı', kw: ['ayakkabı', 'ayakkabi', 'sneaker', 'spor ayakkab', 'bot ', 'çizme', 'sandalet', 'terlik', 'topuklu', 'babet', 'loafer'] },
  { name: 'Elektronik', kw: ['elektronik', 'telefon', 'laptop', 'bilgisayar', 'tablet', 'televizyon', ' tv ', 'kulaklık', 'kulaklik', 'akıllı saat', 'monitör', 'klavye', 'yazıcı', 'kamera', 'konsol', 'powerbank', 'şarj', 'hoparlör'] },
  { name: 'Beyaz Eşya', kw: ['buzdolab', 'çamaşır makine', 'bulaşık makine', 'kurutma makine', 'ankastre', 'fırın', 'ocak', 'davlumbaz', 'klima', 'derin dondurucu'] },
  { name: 'Kozmetik', kw: ['kozmetik', 'parfüm', 'parfum', 'makyaj', 'ruj', 'fondöten', 'maskara', 'oje', 'cilt bakım', 'şampuan', 'sampuan', ' krem', 'deodorant', 'saç bakım'] },
  { name: 'Ev Tekstili', kw: ['ev tekstil', 'nevresim', 'havlu', 'perde', 'yorgan', 'yastık', 'çarşaf', 'battaniye', 'pike', 'kırlent', 'halı', 'kilim'] },
  { name: 'Zücaciye', kw: ['zücaciye', 'zucaciye', 'porselen', 'tabak', 'bardak', 'kupa ', 'fincan', 'çatal', 'kaşık', 'bıçak seti', 'tencere', 'tava', 'servis takım'] },
  { name: 'Mobilya & Dekorasyon', kw: ['mobilya', 'dekorasyon', 'koltuk', 'sehpa', 'lambader', 'gardırop', 'yatak ', 'yemek masa', 'sandalye', ' raf ', 'aydınlatma', 'avize', 'tablo'] },
  { name: 'Anne & Bebek', kw: ['bebek', 'bebe ', 'çocuk', 'oyuncak', 'mama ', 'biberon', 'bebek bez', 'emzik'] },
  { name: 'Spor', kw: ['spor', 'fitness', 'outdoor', 'kamp', 'bisiklet', 'dumbell', 'yoga', 'forma', 'mayo', 'antrenman'] },
  { name: 'Kitap & Kırtasiye', kw: ['kitap', 'roman', 'dergi', 'defter', 'kırtasiye', ' kalem', 'boya seti'] },
  { name: 'Gıda', kw: ['gıda', 'çikolata', 'kahve', ' çay ', 'atıştırmalık', 'bakliyat', 'zeytin', ' bal ', 'kuruyemiş', 'içecek', 'kahvaltılık'] },
  { name: 'Aksesuar', kw: ['aksesuar', 'çanta', 'cüzdan', 'kemer', 'şapka', ' saat', 'gözlük', 'takı', 'kolye', 'yüzük', 'bileklik', 'küpe', 'atkı', 'eldiven'] },
  { name: 'İnşaat', kw: ['inşaat', 'hırdavat', 'yapı market', ' boya', 'matkap', 'vida', 'el aleti', 'bahçe', 'nalbur', 'tesisat'] },
  // NOT: 'Otel' burada YOK — SADECE mağaza kapılı (TRAVEL_STORES). Başlık anahtar
  // kelimeleri (hotel/resort/tatil) giyim ürünlerini (Boyner "…Resort…", Puma
  // "…Hotel… Tişört") yanlış yakaladığı için başlıktan Otel ataması yapılmaz.
  { name: 'Kadın Giyim', kw: ['kadın', 'kadin', ' women', 'elbise', 'etek', 'bluz', 'tayt', 'tunik', 'kadın giyim'] },
  { name: 'Erkek Giyim', kw: ['erkek', ' men ', 'gömlek', 'kravat', 'erkek giyim', 'takım elbise'] },
];

// Kullanıcının istediği SABİT gösterim sırası (Mağazalar altında yukarıdan aşağı).
// Otel üst sıralara (4.) alındı.
export const CURATED_ORDER: string[] = [
  'İnşaat', 'Kadın Giyim', 'Erkek Giyim', 'Otel', 'Ayakkabı', 'Elektronik', 'Gıda',
  'Beyaz Eşya', 'Kozmetik', 'Ev Tekstili', 'Zücaciye', 'Mobilya & Dekorasyon',
  'Anne & Bebek', 'Spor', 'Kitap & Kırtasiye', 'Aksesuar',
];

// Seyahat/konaklama mağazaları — ürünleri başlıkta "otel/tatil" geçmese de Otel'e düşer.
const TRAVEL_STORES = ['tatilbudur', 'tatil budur', 'jolly', 'ets tur', 'etstur', 'setur', 'odamax', 'otelz', 'tatilsepeti', 'touristica', 'coral travel', 'anextour', 'sabahtatil', 'tatil', 'hotels', 'booking'];

export function curatedCategoryOf(category?: string | null, title?: string, store?: string | null): string | null {
  // Seyahat mağazasından geldiyse (TatilBudur…) → başlık ne olursa olsun Otel.
  const s = (store || '').toLocaleLowerCase('tr');
  if (s && TRAVEL_STORES.some((t) => s.includes(t))) return 'Otel';
  const hay = ` ${(category || '').toLocaleLowerCase('tr')} ${(title || '').toLocaleLowerCase('tr')} `;
  for (const c of CURATED_CATEGORIES) {
    if (c.kw.some((k) => hay.includes(k))) return c.name;
  }
  return null;
}

// Kategori detay sayfası sorgusu için TEK KELİME token'lar (searchTokens
// array-contains-any; Firestore ≤30 değer). kw ifadelerinden ≥3 harfli sözcükler.
export function categoryQueryTokens(name: string): string[] {
  const set = new Set<string>();
  // Otel: seyahat mağaza adları ÖNCE (searchTokens brandName'i içerdiği için
  // TatilBudur ürünleri başlıkta "otel" geçmese de token sorgusuyla gelir).
  if (name === 'Otel') {
    for (const t of ['tatilbudur', 'jolly', 'etstur', 'setur', 'odamax', 'otelz', 'touristica', 'anextour', 'otel', 'hotel', 'tatil', 'konaklama', 'resort']) set.add(t);
  }
  const cat = CURATED_CATEGORIES.find((c) => c.name === name);
  if (cat) {
    for (const k of cat.kw) {
      for (const w of k.trim().split(/\s+/)) {
        const t = w.trim();
        if (t.length >= 3) set.add(t);
      }
    }
  }
  return Array.from(set).slice(0, 30);
}

// Ana sayfa şeritlerinde GÖSTERİLMEYECEK ürünler: iç giyim / +18 / yetişkin içerik.
// Detay/arama/kategori sayfasında görünür; yalnız vitrin 21'liklerinden çıkarılır.
const INTIMATE_ADULT = [
  'iç giyim', 'iç çamaş', 'ic camas', 'külot', 'sütyen', 'sutyen', ' boxer', 'jartiyer',
  'korse', 'gecelik', 'babydoll', 'tanga', 'string külot', 'içlik', 'fantezi iç',
  'erotik', 'fetiş', ' seks', 'seks oyunc', 'sex toy', 'vibrat', 'prezervatif', '+18', '18+',
];
export function isIntimateOrAdult(category?: string | null, title?: string): boolean {
  const hay = ` ${(category || '').toLocaleLowerCase('tr')} ${(title || '').toLocaleLowerCase('tr')} `;
  return INTIMATE_ADULT.some((k) => hay.includes(k));
}
