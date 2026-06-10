/**
 * Bağış dağıtım motoru — TEK KAYNAK hesap.
 *
 * Marka affiliate webhook'u onaylı alışveriş bildirince oluşan brüt bağıştan
 * (commission) vergi + hangel komisyonu düşülür, kalan net kullanıcının seçtiği
 * 2 derneğe %50/%50 paylaştırılır. Oranlar süper-admin'den ayarlanabilir
 * (siteSettings/donationRates); okunamazsa varsayılana düşülür.
 *
 * Saf TS (Firebase importu yok) — hem Admin SDK webhook'u hem client görünümleri
 * (bağışlarım, hak ediş, marka kazanç) aynı hesabı kullanır ki rakamlar tutsun.
 */

export interface DonationRates {
  /** Gelir vergisi oranı (brütten). Varsayılan 0.20 */
  incomeTaxRate: number;
  /** KDV oranı (brütten). Varsayılan 0.20 */
  vatRate: number;
  /** hangel komisyon oranı (vergi sonrası net üzerinden). Varsayılan 0.10 */
  hangelCommissionRate: number;
}

export const DEFAULT_DONATION_RATES: DonationRates = {
  incomeTaxRate: 0.20,
  vatRate: 0.20,
  hangelCommissionRate: 0.10,
};

export interface DonationSplit {
  gross: number;          // brüt bağış (marka komisyonu)
  incomeTax: number;      // gelir vergisi
  vat: number;            // KDV
  netAfterTax: number;    // vergi sonrası net
  ngoShareTotal: number;  // tüm derneklere gidecek toplam (komisyon sonrası)
  hangelShare: number;    // hangel komisyonu
  perNgo: number;         // dernek başına net (ngoShareTotal / ngoCount)
  ngoCount: number;
}

function r2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Ham ayar objesini güvenli DonationRates'e çevirir (eksik/aralık dışı → varsayılan). */
export function normalizeRates(raw?: Partial<DonationRates> | null): DonationRates {
  const pick = (v: unknown, def: number): number => {
    const n = typeof v === 'number' ? v : Number(v);
    if (!Number.isFinite(n) || n < 0 || n > 1) return def;
    return n;
  };
  return {
    incomeTaxRate: pick(raw?.incomeTaxRate, DEFAULT_DONATION_RATES.incomeTaxRate),
    vatRate: pick(raw?.vatRate, DEFAULT_DONATION_RATES.vatRate),
    hangelCommissionRate: pick(raw?.hangelCommissionRate, DEFAULT_DONATION_RATES.hangelCommissionRate),
  };
}

/**
 * Brüt bağışı vergi + komisyon düşüp ngoCount derneğe böler.
 * my-donations'daki mevcut formülle aynı: netAfterTax = G(1 - gv - kdv);
 * ngoShareTotal = netAfterTax / (1 + komisyon); hangelShare = ngoShareTotal * komisyon.
 */
export function computeDonationSplit(gross: number, rates: DonationRates, ngoCount: number): DonationSplit {
  const g = Number.isFinite(gross) && gross > 0 ? gross : 0;
  const incomeTax = g * rates.incomeTaxRate;
  const vat = g * rates.vatRate;
  const netAfterTax = Math.max(0, g - incomeTax - vat);
  const ngoShareTotal = netAfterTax / (1 + rates.hangelCommissionRate);
  const hangelShare = ngoShareTotal * rates.hangelCommissionRate;
  const perNgo = ngoCount > 0 ? ngoShareTotal / ngoCount : 0;
  return {
    gross: r2(g),
    incomeTax: r2(incomeTax),
    vat: r2(vat),
    netAfterTax: r2(netAfterTax),
    ngoShareTotal: r2(ngoShareTotal),
    hangelShare: r2(hangelShare),
    perNgo: r2(perNgo),
    ngoCount,
  };
}

/** YYYY-MM dönem anahtarı (verilen ISO tarih ya da Date). */
export function periodKey(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}
