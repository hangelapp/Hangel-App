/**
 * Türkiye il plaka kodları + etkinlik "kolay kod" üretimi.
 *
 * Etkinlik kodu = il plaka kodu (2 hane) + ay (2 hane) + gün (2 hane).
 *   Örn. İzmir (35) · 16 Temmuz → "350716".
 * QR'a alternatif: katılımcı bu 6 haneli kodu /kod sayfasına girerek etkinliğe
 * ulaşır. Kod etkinlik dokümanında SAKLANMAZ — şehir + startDate'ten türetilir
 * (böylece geriye dönük tüm etkinlikler için de çalışır).
 */

// İl adı (tam, Türkçe) → plaka kodu. Normalize edilmiş anahtar (küçük harf, tr).
const PLATE_BY_PROVINCE: Record<string, number> = {
  'adana': 1, 'adıyaman': 2, 'afyonkarahisar': 3, 'ağrı': 4, 'amasya': 5,
  'ankara': 6, 'antalya': 7, 'artvin': 8, 'aydın': 9, 'balıkesir': 10,
  'bilecik': 11, 'bingöl': 12, 'bitlis': 13, 'bolu': 14, 'burdur': 15,
  'bursa': 16, 'çanakkale': 17, 'çankırı': 18, 'çorum': 19, 'denizli': 20,
  'diyarbakır': 21, 'edirne': 22, 'elazığ': 23, 'erzincan': 24, 'erzurum': 25,
  'eskişehir': 26, 'gaziantep': 27, 'giresun': 28, 'gümüşhane': 29, 'hakkari': 30,
  'hatay': 31, 'ısparta': 32, 'isparta': 32, 'mersin': 33, 'içel': 33, 'istanbul': 34,
  'i̇stanbul': 34, 'izmir': 35, 'i̇zmir': 35, 'kars': 36, 'kastamonu': 37, 'kayseri': 38,
  'kırklareli': 39, 'kırşehir': 40, 'kocaeli': 41, 'konya': 42, 'kütahya': 43,
  'malatya': 44, 'manisa': 45, 'kahramanmaraş': 46, 'mardin': 47, 'muğla': 48,
  'muş': 49, 'nevşehir': 50, 'niğde': 51, 'ordu': 52, 'rize': 53, 'sakarya': 54,
  'samsun': 55, 'siirt': 56, 'sinop': 57, 'sivas': 58, 'tekirdağ': 59, 'tokat': 60,
  'trabzon': 61, 'tunceli': 62, 'şanlıurfa': 63, 'uşak': 64, 'van': 65, 'yozgat': 66,
  'zonguldak': 67, 'aksaray': 68, 'bayburt': 69, 'karaman': 70, 'kırıkkale': 71,
  'batman': 72, 'şırnak': 73, 'bartın': 74, 'ardahan': 75, 'ığdır': 76, 'yalova': 77,
  'karabük': 78, 'kilis': 79, 'osmaniye': 80, 'düzce': 81,
};

function normalizeProvince(name: string): string {
  return (name || '').trim().toLocaleLowerCase('tr');
}

/** İl adından plaka kodunu döndürür (bulunamazsa null). */
export function plateCode(province: string | undefined | null): number | null {
  if (!province) return null;
  const key = normalizeProvince(province);
  if (key in PLATE_BY_PROVINCE) return PLATE_BY_PROVINCE[key];
  // "İzmir / Bergama" gibi birleşik girdilerde ilk parçayı da dene.
  const first = key.split(/[/,·-]/)[0]?.trim();
  if (first && first in PLATE_BY_PROVINCE) return PLATE_BY_PROVINCE[first];
  return null;
}

/**
 * Etkinlik kolay kodu: plaka(2) + ay(2) + gün(2) = 6 hane.
 * startDate "yyyy-MM-dd HH:mm" veya "yyyy-MM-dd" formatında beklenir.
 * Şehir plakası ya da tarih çözülemezse null (kod gösterilmez).
 */
export function eventJoinCode(
  city: string | undefined | null,
  startDate: string | undefined | null,
): string | null {
  const plate = plateCode(city);
  if (plate == null) return null;
  const m = (startDate || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  const month = m[2];
  const day = m[3];
  const pp = String(plate).padStart(2, '0');
  return `${pp}${month}${day}`;
}
