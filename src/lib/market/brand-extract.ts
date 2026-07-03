/**
 * Ürün MARKASI (Marka) çıkarımı — hangel market'te "Marka" ile "Mağaza" ayrımı.
 *
 * Veri gerçeği: affiliate feed'lerinde her ürünün `brandName`'i aslında MAĞAZA
 * (satıcı) adıdır (Media Markt, Arçelik, Sportive...). Ürünün gerçek MARKASI
 * (Nike, Apple, Ülker) çoğu zaman yalnızca başlıkta gömülüdür. Bu modül, ürünün
 * gerçek markasını çıkarır:
 *   1) Mağaza adı bilinen bir markaysa (tek-marka mağaza: Arçelik, Nautica,
 *      Koçtaş...) → marka = mağaza adı.
 *   2) Çok-markalı mağaza (Occasion, Media Markt...) → başlıktan sözlük eşleşmesi
 *      (yalnız CURATED küresel markalar; STORE_ONLY markalar başlıkta aranmaz).
 *   3) Eşleşme yoksa → null.
 *
 * Kusurludur. Sözlük genişledikçe kapsama artar.
 */

// Başlıkta DA aranabilecek küresel/net markalar (Occasion gibi çok-markalı
// mağazalarda ürün başlığından çıkarılır).
const CURATED_BRANDS: string[] = [
  'Nike','Adidas','Puma','Reebok','New Balance','Under Armour','Converse','Vans','Skechers','Asics',
  'The North Face','Columbia','Salomon','Merrell','Timberland','Jack Wolfskin','Helly Hansen','Lacoste',
  'Tommy Hilfiger','Calvin Klein',"Levi's",'Wrangler','Colins','LC Waikiki','DeFacto','Koton',
  'Mango','Zara','Bershka','Benetton','Gant','Nautica','Hummel','Kappa','Diadora','Lotto','Slazenger',
  'Kinetix','Lumberjack','Beymen','Vakko','DS Damat','İpekyol','Twist','Machka','Ramsey','Süvari',
  'Divarese','Hotiç','Yargıcı','Suwen','Penti','Desa','Samsonite','Kipling','Michael Kors',
  'Apple','iPhone','iPad','MacBook','AirPods','Samsung','Xiaomi','Huawei','Oppo','Realme','Sony','Philips',
  'Panasonic','Bosch','Siemens','Arçelik','Beko','Vestel','Grundig','Profilo','Casper',
  'MSI','Asus','Acer','Lenovo','Dell','Toshiba','Canon','Nikon','JBL','Bose','Sennheiser','Logitech','TP-Link',
  'Anker','Baseus','GoPro','DJI','OnePlus','Motorola','Nokia','TCL','Hisense','Ugreen','Ttec',
  'Karaca','Emsan','Schafer','English Home','Madame Coco','Bella Maison','Linens','Yataş','Yatsan','Özdilek',
  'Zwilling','Tefal','Fakir','Fantom','Dyson','Braun','Rowenta','Kütahya Porselen',
  'Chicco','Selpak','Duru','Nivea','Loreal',"L'Oréal",'Garnier','Maybelline','Flormar','Golden Rose',
  'Arko','Bioblas','Elidor','Pantene','Rexona','Gillette','Colgate','Sensodyne','La Roche-Posay','Vichy',
  'Bioderma','Eucerin','Avene','CeraVe','Sebamed','Mustela','Arkopharma','Solgar','Voonka','Nutraxin',
  'Molfix','Sleepy','Pampers','Huggies','Aptamil','Bebelac','Milupa','Hipp','Lego','Barbie',
  'Hot Wheels','Fisher-Price','Playmobil','Nerf','Ülker','Eti','Torku','Nestle','Nescafe','Coca-Cola',
  'Pepsi','Doritos','Tadelle','Milka','Nutella','Kinder','Haribo','Lipton','Çaykur','Sütaş','Pınar',
  'Knorr','Barilla','Casio','Fossil','Swatch','Ray-Ban','Oakley','GAP','H&M','Marks & Spencer',
];

// Yalnız MAĞAZA ADI olarak eşleşen markalar/satıcılar (başlıkta ARANMAZ — yanlış
// pozitif riski: kısa/ortak kelimeler). Çoğu tek-marka mağaza ya da satıcı.
const STORE_ONLY_BRANDS: string[] = [
  'Koçtaş','Mudo','Preo','Hemington','Mobeseavm','D&R','Network','Sportive','JeansLab','Jacadi',
  'Mizalle','Kayra','Altınyıldız','Saat ve Saat','Fresh Scarfs','MarkaStok','İdefix','Doremusic',
  'Vitaminler','Avansas','Supplementler','FLO','Toyzz Shop','Lee','Flaw Wear','Vitamin Box',
  'Özdilekteyim','A101','SETUR','Hızlısaat','Sosyopix','Boyner','Hama','Occasion','Cellularline',
  'Cellular Line','Regal','Altus','Note','Preo','Mavi','Wenice','Panço','Nautica','LTB','Süvari',
];

export const BRAND_DICTIONARY: string[] = [...CURATED_BRANDS, ...STORE_ONLY_BRANDS];

export function normKey(s: string): string {
  return (s || '')
    .replace(/İ/g, 'i').replace(/I/g, 'i') // Türkçe I/İ → noktalı i (HUAWEI=Huawei olsun)
    .toLowerCase()
    .replace(/[^a-z0-9çğıöşü&.\s'+-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Başlıkta eşleştirilmesi RİSKLİ (renk/ortak kelime) + STORE_ONLY markalar →
// yalnız mağaza adı olarak kullanılır, başlıkta aranmaz.
const AMBIGUOUS = new Set(
  [
    'Note','Clear','Signal','Solo','Pastel','Blend','Sana','Tat','İpek','Polo','Guess','Honor','Lee',
    'Regal','Monster','Prima','Dove','Taç',
    ...STORE_ONLY_BRANDS,
  ].map(normKey),
);

const DICT = Array.from(new Set(BRAND_DICTIONARY))
  .map((b) => ({ raw: b, n: normKey(b) }))
  .filter((d) => d.n.length >= 2)
  .sort((a, b) => b.n.length - a.n.length);

const STORE_BRAND = new Map(DICT.map((d) => [d.n, d.raw]));

/**
 * Ürünün gerçek markasını çıkar. storeName = ürünün `brandName` (mağaza) alanı.
 * Döner: kanonik marka adı veya null.
 */
// Yaygın kelimeyle çakışan marka (Apple=elma) YANLIŞ eşleşmesi: başlıkta meyve/gıda
// bağlamı var + MARKA (tech) bağlamı yoksa o "apple" markayı değil meyveyi anlatır.
// (Green Apple göz kalemi, Apple Cider şampuan, Apple Peel krem → Apple markası DEĞİL.)
const APPLE_FRUIT = /(apple cider|apple peel|green apple|yeşil elma|elma sirke|elma çay|apple vinegar|apple juice|apple seed|apfel|elma aromalı)/i;
const APPLE_TECH = /(iphone|ipad|macbook|imac|airpod|apple watch|apple tv|magsafe|lightning|mac mini|mac studio|\bios\b|apple pencil|apple usb|apple türkiye)/i;
export function isFalseBrandMatch(brandRaw: string, title: string): boolean {
  if (normKey(brandRaw) === 'apple') {
    const t = (title || '').toLocaleLowerCase('tr');
    return APPLE_FRUIT.test(t) && !APPLE_TECH.test(t);
  }
  return false;
}

export function extractProductBrand(title: string, storeName: string): string | null {
  const sn = normKey(storeName);
  // 1) mağaza adı bilinen markaysa → marka = mağaza
  if (STORE_BRAND.has(sn)) return STORE_BRAND.get(sn)!;
  // 2) çok-markalı mağaza → başlıktan (yalnız curated; STORE_ONLY/riskli hariç)
  const t = ' ' + normKey(title) + ' ';
  for (const d of DICT) {
    if (AMBIGUOUS.has(d.n)) continue;
    if (t.includes(' ' + d.n + ' ')) {
      if (isFalseBrandMatch(d.raw, title)) continue; // apple=meyve → marka sayma
      return d.raw;
    }
  }
  return null;
}
