/**
 * STK mükerrer kayıt tespiti — saf (firebase'siz) yardımcı.
 *
 * Kural (kullanıcı isteği): bir STK eklenirken, mevcut bir kayıtla
 * {isim, kısa isim, kütük no, telefon, e-posta} alanlarından **herhangi ikisi**
 * eşleşiyorsa → bu aynı kuruluş kabul edilir, "zaten var" denir, yeni kayıt
 * AÇILMAZ. Ek olarak kütük no devlet sicilinde benzersiz olduğundan, **tek
 * başına kütük eşleşmesi** de kesin mükerrer sayılır.
 *
 * Karşılaştırma normalize edilir: Türkçe İ/ı + diakritikler sadeleştirilir,
 * küçük harfe inilir, noktalama atılır; telefon yalnız son 10 hane; e-posta
 * küçük harf. Böylece "YEŞİL TÜRKİYE" ≈ "Yeşil Türkiye", "0555 372 25 01"
 * ≈ "+90 555 372 2501" eşleşir.
 *
 * Saf fonksiyon: hem sunucu (Admin SDK ile çekilen liste) hem istemci
 * (useCollection listesi) aynı mantığı kullanır.
 */

export interface NgoDedupeCandidate {
  name?: string;
  shortName?: string;
  kutukNo?: string;
  phone?: string;
  email?: string;
}

export interface NgoDedupeRecord extends NgoDedupeCandidate {
  id: string;
  status?: string;
  mergedInto?: string;
  /** Bazı kayıtlarda iletişim iç içe tutulur. */
  contact?: { phone?: string; email?: string };
}

export interface NgoDedupeMatch {
  id: string;
  name: string;
  /** Türkçe etiketler: "isim", "kütük no" vb. — kullanıcıya göstermek için. */
  matchedFields: string[];
}

const normText = (s?: string): string =>
  (s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // diakritikler
    .replace(/[ıİ]/g, 'i')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const normKutuk = (s?: string): string => (s || '').replace(/\D/g, '');

// Son 10 hane: baştaki 0 ve 90 ülke kodu atılır.
const normPhone = (s?: string): string => {
  const d = (s || '').replace(/\D/g, '').replace(/^0+/, '');
  return (d.startsWith('90') ? d.slice(2) : d).slice(-10);
};

const normEmail = (s?: string): string => (s || '').trim().toLowerCase();

interface NormFields {
  name: string;
  shortName: string;
  kutuk: string;
  phone: string;
  email: string;
}

function normalizeRecord(r: NgoDedupeCandidate & { contact?: { phone?: string; email?: string } }): NormFields {
  return {
    name: normText(r.name),
    shortName: normText(r.shortName),
    kutuk: normKutuk(r.kutukNo),
    phone: normPhone(r.phone || r.contact?.phone),
    email: normEmail(r.email || r.contact?.email),
  };
}

/**
 * Aday STK'yı mevcut kayıtlarla karşılaştırır. İlk mükerrer eşleşmeyi döner;
 * yoksa null. Pasif/merged (arşiv) kayıtlar ve excludeId atlanır.
 */
export function findNgoDuplicate(
  candidate: NgoDedupeCandidate,
  records: NgoDedupeRecord[],
  excludeId?: string,
): NgoDedupeMatch | null {
  const c = normalizeRecord(candidate);
  // Aday hiçbir karşılaştırılabilir alan taşımıyorsa eşleşme aranmaz.
  if (!c.name && !c.shortName && !c.kutuk && !c.phone && !c.email) return null;

  for (const r of records) {
    if (excludeId && r.id === excludeId) continue;
    if (r.status === 'Pasif' || r.mergedInto) continue; // arşivlenmiş mükerrerler

    const e = normalizeRecord(r);
    const matched: string[] = [];
    if (c.name && e.name && c.name === e.name) matched.push('isim');
    if (c.shortName && e.shortName && c.shortName === e.shortName) matched.push('kısa isim');
    if (c.kutuk && e.kutuk && c.kutuk === e.kutuk) matched.push('kütük no');
    if (c.phone && e.phone && c.phone === e.phone) matched.push('telefon');
    if (c.email && e.email && c.email === e.email) matched.push('e-posta');

    // Kütük benzersiz → tek başına kesin; diğerlerinde en az 2 alan.
    const isDuplicate = matched.includes('kütük no') || matched.length >= 2;
    if (isDuplicate) return { id: r.id, name: r.name || '', matchedFields: matched };
  }
  return null;
}
