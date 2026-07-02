/**
 * Marka adı normalizasyonu — "Tüm Markalar" listesinde aynı markanın farklı
 * yazımlarını tek satırda birleştirmek için.
 *
 * - normBrandKey: dedup ANAHTARI. Türkçe İ/ı normalize edilir, aksan sökülür,
 *   harf/rakam dışı (boşluk, nokta, & vb.) atılır, küçük harfe çevrilir.
 *   Örn. "JBL"/"Jbl" → "jbl", "HUAWEI"/"Huawei" → "huawei",
 *   "Cellular Line"/"Cellularline" → "cellularline".
 * - betterBrandDisplay: aynı anahtara düşen varyantlardan GÖSTERİLECEK adı seçer;
 *   karışık harfli (ör. "Huawei") olanı, hepsi büyük/küçük olana yeğler.
 */

export function normBrandKey(name: string): string {
  return (name || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // aksanları sök
    .replace(/[ıİ]/g, 'i')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '') // harf/rakam dışını at
    .trim();
}

/** Gösterime daha uygun adı seç (kararlı: eşitlikte ilk gelen korunur). */
export function betterBrandDisplay(a: string, b: string): string {
  if (!a) return b;
  if (!b) return a;
  const score = (s: string) => {
    const hasLower = /[a-zçğıöşü]/.test(s);
    const hasUpper = /[A-ZÇĞİÖŞÜ]/.test(s);
    if (hasLower && hasUpper) return 2; // "Huawei" — en iyi
    if (hasLower) return 1; //             "huawei"
    return 0; //                           "HUAWEI"
  };
  return score(b) > score(a) ? b : a;
}
