/**
 * Esnek arama eşleştirme — STK/kulüp/marka arama barları için.
 *
 * Üç şeyi birden çözer:
 *  1) Türkçe ↔ ASCII harf farkı: kullanıcı "u" yazınca "ü"yü de bulur
 *     (bazı klavyelerde Türkçe karakter yok). ç→c, ğ→g, ı/İ→i, ö→o, ş→s, ü→u, â→a...
 *  2) Alt-string: ismin/kısaltmanın/kütük no'nun bir parçasını yazınca bulur.
 *  3) 1 harf hata toleransı (fuzzy): tek karakterlik yazım hatasını (ekle/sil/değiştir)
 *     Levenshtein mesafesi ≤ 1 ile yakalar (yalnız exact alt-string bulunamazsa).
 *
 * Kullanım: searchMatch(stk.name, query) || searchMatch(stk.shortName, query) || ...
 * Her iki tarafı da içeride normalize eder; query'yi önceden lowercase'lemeye gerek yok.
 */

const TR_TO_ASCII: Record<string, string> = {
  ç: 'c', ğ: 'g', ı: 'i', İ: 'i', ö: 'o', ş: 's', ü: 'u',
  â: 'a', î: 'i', û: 'u', ô: 'o', ê: 'e', '̇': '', // combining dot (İ→i artığı)
};

export function normalizeSearch(s: string | null | undefined): string {
  if (!s) return '';
  return s
    .toLowerCase()
    .replace(/[çğıİöşüâîûôê]/gu, (m) => TR_TO_ASCII[m] ?? m)
    .replace(/\s+/g, ' ')
    .trim();
}

/** İki string arası Levenshtein mesafesi; max'ı aşınca erken çıkar (perf). */
function levenshtein(a: string, b: string, max: number): number {
  const al = a.length;
  const bl = b.length;
  if (Math.abs(al - bl) > max) return max + 1;
  let prev = Array.from({ length: bl + 1 }, (_, j) => j);
  let curr = new Array<number>(bl + 1);
  for (let i = 1; i <= al; i++) {
    curr[0] = i;
    let rowMin = curr[0];
    for (let j = 1; j <= bl; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
      if (curr[j] < rowMin) rowMin = curr[j];
    }
    if (rowMin > max) return max + 1; // bu satırın tamamı max'ı aştı → eşleşmez
    [prev, curr] = [curr, prev];
  }
  return prev[bl];
}

/**
 * text, query'yi içeriyor mu — Türkçe-normalize + 1 harf toleransıyla.
 * Boş query/text → false.
 */
export function searchMatch(text: string | null | undefined, query: string): boolean {
  const q = normalizeSearch(query);
  if (!q) return false;
  const t = normalizeSearch(text);
  if (!t) return false;
  if (t.includes(q)) return true; // exact (normalize sonrası) alt-string — en sık yol
  if (q.length < 3) return false; // çok kısa query'de fuzzy gürültü yapar
  // 1 harf hata: t üzerinde q uzunluğu ±1 pencerelerle gezip mesafe ≤ 1 ara.
  for (let len = q.length - 1; len <= q.length + 1; len++) {
    if (len < 1 || len > t.length) continue;
    for (let i = 0; i + len <= t.length; i++) {
      if (levenshtein(t.slice(i, i + len), q, 1) <= 1) return true;
    }
  }
  return false;
}
