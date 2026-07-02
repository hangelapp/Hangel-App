/**
 * Bağış tutarını "somut etki" karşılığına çevirir (≈ X öğün / fidan / defter…).
 * Rakamlar yaklaşıktır ve her zaman "≈" ile gösterilir — kesin taahhüt değil,
 * kullanıcının etkisini hissettiren illüstratif bir eşlemedir. Etki Kartı ve
 * paylaşım metinlerinde kullanılır.
 */
export type ImpactEquivalent = { count: number; unit: string; emoji: string };

// Yaklaşık birim maliyetler (₺). Öğün önce gelir (en anlaşılır); tutar büyüdükçe
// daha "yuvarlak" görünen birim seçilir.
const UNITS: { unit: string; emoji: string; cost: number }[] = [
  { unit: 'öğün', emoji: '🍽️', cost: 25 },
  { unit: 'defter', emoji: '📓', cost: 40 },
  { unit: 'fidan', emoji: '🌱', cost: 50 },
  { unit: 'kitap', emoji: '📚', cost: 120 },
];

/** Tutara en uygun tek karşılığı döndürür (adet 2–60 aralığını hedefler). */
export function impactEquivalent(amountTry: number): ImpactEquivalent {
  const a = Math.max(0, Number(amountTry) || 0);
  if (a <= 0) return { count: 0, unit: 'öğün', emoji: '🍽️' };
  for (const u of UNITS) {
    const c = Math.round(a / u.cost);
    if (c >= 2 && c <= 60) return { count: c, unit: u.unit, emoji: u.emoji };
  }
  const c = Math.max(1, Math.round(a / UNITS[0].cost));
  return { count: c, unit: UNITS[0].unit, emoji: UNITS[0].emoji };
}

/** "≈ 4 öğün" gibi kısa metin. */
export function impactLine(amountTry: number): string {
  const e = impactEquivalent(amountTry);
  return `≈ ${e.count} ${e.unit}`;
}
