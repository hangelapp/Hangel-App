// "En Çok Tutarla Bağış Yapanlar" — mutlak bağış TUTARINI ₺ cinsinden hesaplar.
// Farklı para birimli ürünler (SEK/EUR/USD…) ₺'ye çevrilip GERÇEK değer üzerinden
// sıralanır (yüzde dilimine göre değil).

import type { CanonicalProduct } from '@/lib/feed/types';

// Yaklaşık kur (→ ₺). SIRALAMA için yeterli; canlı kur değil. Katalog çoğunlukla TRY.
// Güncellemek gerekirse tek yer burası.
const CURRENCY_TO_TRY: Record<string, number> = {
  TRY: 1, TL: 1,
  USD: 42, EUR: 46, GBP: 54, CHF: 48,
  SEK: 4, NOK: 4, DKK: 6.2,
  AED: 11.4, SAR: 11.2, RUB: 0.5, JPY: 0.28, CNY: 5.8,
};

export function currencyToTRY(currency?: string | null): number {
  const c = (currency || 'TRY').toUpperCase().trim();
  return CURRENCY_TO_TRY[c] ?? 1;
}

export function effectivePrice(p: CanonicalProduct): number {
  return typeof p.salePrice === 'number' && p.salePrice > 0 ? p.salePrice : p.price;
}

/** Mutlak bağış tutarı ₺ = oran(%) × geçerli fiyat × kur(→₺). */
export function donationAmountTRY(p: CanonicalProduct, ratePct: number): number {
  return (ratePct / 100) * effectivePrice(p) * currencyToTRY(p.currency);
}
