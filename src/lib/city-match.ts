/**
 * cityMatches — il filtresi ESNEK eşleşme (kütük verisi ile dropdown uyuşmazlığı).
 *
 * Sorun: kütükte il "Afyon", dropdown "Afyonkarahisar" gönderiyor; ya da veri
 * "İstanbul (Avrupa)", dropdown "İstanbul". Tam eşleşme (===) 0 sonuç veriyordu.
 *
 * Kural: normalize (diakritik + büyük/küçük duyarsız) edip, biri diğerinin
 * BAŞINDA geçiyorsa (ilk kelime bazında) eşleşir. "Afyon"↔"Afyonkarahisar" ✓,
 * "İstanbul"↔"İstanbul (Avrupa)" ✓, "Adana"↔"Ankara" ✗.
 *
 * Her outreach/mail/stats endpoint'i BU helper'ı kullanır (tek kaynak).
 */

/** Türkçe diakritik + büyük/küçük duyarsız normalize. */
export function normCity(s: string | undefined | null): string {
  return (s ?? '')
    .toLocaleLowerCase('tr')
    .replace(/İ/g, 'i').replace(/I/g, 'ı')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * dropdownCity (filtre değeri) ile dataCity (kayıttaki il) eşleşiyor mu?
 * Boş filtre → her zaman true (filtre yok).
 */
export function cityMatches(dropdownCity: string | undefined | null, dataCity: string | undefined | null): boolean {
  const c = normCity(dropdownCity);
  if (!c) return true; // filtre yok
  const rc = normCity(dataCity);
  if (!rc) return false;
  // İlk kelime bazlı çift-yön prefix — parantezli/uzun varyantları da yakalar.
  const cFirst = c.split(' ')[0];
  const rcFirst = rc.split(' ')[0];
  return (
    rc === c ||
    rcFirst === cFirst ||
    rcFirst.startsWith(cFirst) ||
    cFirst.startsWith(rcFirst) && rcFirst.length >= 3
  );
}

/**
 * Firestore indexli PREFIX where için: dropdown il'inin ilk kelimesinin ilk ~5
 * harfi (case KORUNUR — veri orijinal büyük harfle). "Afyonkarahisar"→"Afyon".
 * il >= prefix AND il <= prefix+ aralığı bu ortak kökü yakalar.
 */
export function cityPrefixFor(dropdownCity: string | undefined | null): string | null {
  const raw = (dropdownCity ?? '').trim();
  if (!raw) return null;
  return raw.split(/\s+/)[0].slice(0, 5);
}
