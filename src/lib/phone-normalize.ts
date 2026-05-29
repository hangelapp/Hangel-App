/**
 * Telefon normalizasyonu — mükerrer kayıt tespiti için tek kaynak.
 *
 * Sorun: telefon farklı biçimlerde saklanabiliyor (ör. "05384009090",
 * "5384009090", "905384009090", "+90 538 400 90 90"). Mükerrer kontrolü tek
 * biçimle ararsa diğer biçimi bulamaz → aynı kişiye 2. profil açılır.
 *
 * Çözüm:
 *  - `canonicalPhone`: ülke kodu + baştaki sıfırlar atılmış "ulusal" numara
 *    (ör. hepsi → "5384009090"). YAZARKEN bunu kullan.
 *  - `phoneMatchCandidates`: Firestore `in` sorgusu için olası tüm yazımlar
 *    (eski/karışık veriyi de yakalamak için). ARARKEN bunu kullan.
 */

/** Sadece rakamlar; ülke kodu ve baştaki sıfırlar atılmış ulusal numara. */
export function canonicalPhone(rawPhone: string | undefined | null, countryCode?: string | null): string {
  let d = (rawPhone ?? '').replace(/\D/g, '');
  const cc = (countryCode ?? '').replace(/\D/g, '');
  d = d.replace(/^0+/, ''); // baştaki sıfır(lar)
  // Numara ülke koduyla başlıyorsa ve geriye yeterli hane kalıyorsa ülke kodunu at.
  // (TR cep numaraları "5" ile başlar; "90..." → "90" atılır. Kısa numarada atma.)
  if (cc && d.startsWith(cc) && d.length > cc.length + 6) {
    d = d.slice(cc.length);
  }
  return d;
}

/** E.164 (ör. "+905384009090") — Firebase Auth getUserByPhoneNumber için. */
export function toE164(rawPhone: string | undefined | null, countryCode?: string | null): string {
  const canon = canonicalPhone(rawPhone, countryCode);
  const cc = (countryCode ?? '').replace(/\D/g, '') || '90';
  return canon ? `+${cc}${canon}` : '';
}

/**
 * Firestore `personalInfo.phone` alanında aranacak olası yazımlar (≤10, `in` için).
 * Hem kanonik hem de eski/karışık kayıtları (baştaki 0 / ülke kodlu) yakalar.
 */
export function phoneMatchCandidates(rawPhone: string | undefined | null, countryCode?: string | null): string[] {
  const canon = canonicalPhone(rawPhone, countryCode);
  const cc = (countryCode ?? '').replace(/\D/g, '');
  const rawDigits = (rawPhone ?? '').replace(/\D/g, '');
  const set = new Set<string>();
  if (canon) {
    set.add(canon);                 // 5384009090
    set.add('0' + canon);           // 05384009090
    if (cc) {
      set.add(cc + canon);          // 905384009090
      set.add('0' + cc + canon);    // 0905384009090 (nadir)
    }
  }
  if (rawDigits) {
    set.add(rawDigits);             // girildiği hâli (rakamlar)
    set.add(rawDigits.replace(/^0+/, '')); // baştaki 0 atılmış hâli
  }
  return Array.from(set).filter(Boolean).slice(0, 10);
}
