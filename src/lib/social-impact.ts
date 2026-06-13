/**
 * Sosyal Etki Mali Değeri — gönüllülüğün adam-saat üzerinden TL karşılığı.
 *
 * Etki Puanı (points) sembolik bir skordur; Sosyal Etki Mali Değeri ise gönüllü
 * emeğinin EKONOMİK karşılığını gösterir: toplam saat × saatlik gönüllü emek değeri.
 *
 * Saatlik oran meslek bazında super-admin `volunteerScoring` kataloğunda yönetilebilir
 * (bkz lib/volunteer-impact.ts). Katalog oranı yoksa burada DEFAULT kullanılır.
 * Saf TS — client + server import edebilir.
 */

/** Varsayılan saatlik gönüllü emek değeri (₺/saat). Katalog oranı varsa o ezer. */
export const DEFAULT_VOLUNTEER_HOURLY_TRY = 150;

/** Toplam saat × saatlik oran → ₺ sosyal etki mali değeri. */
export function socialImpactValueTRY(hoursTotal: number, hourlyRate?: number): number {
  const h = Number.isFinite(hoursTotal) && hoursTotal > 0 ? hoursTotal : 0;
  const rate = hourlyRate && hourlyRate > 0 ? hourlyRate : DEFAULT_VOLUNTEER_HOURLY_TRY;
  return Math.round(h * rate);
}

/** ₺ biçimlendirme (1.500 ₺). */
export function formatTRY(value: number): string {
  try {
    return `${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(value)} ₺`;
  } catch {
    return `${Math.round(value)} ₺`;
  }
}

/** Info ikonu açıklaması — nasıl hesaplandığı. */
export function socialImpactExplanation(hourlyRate?: number): string {
  const rate = hourlyRate && hourlyRate > 0 ? hourlyRate : DEFAULT_VOLUNTEER_HOURLY_TRY;
  return (
    `Sosyal Etki Mali Değeri, gönüllü emeğinin ekonomik karşılığını gösterir:\n\n`
    + `Toplam gönüllü saati × saatlik gönüllü emek değeri (${rate} ₺/saat).\n\n`
    + `Saatlik değer, ilgili mesleğe göre super-admin tarafından belirlenir; tanımlı değilse `
    + `varsayılan ${DEFAULT_VOLUNTEER_HOURLY_TRY} ₺/saat kullanılır. Bu tutar gönüllülüğün topluma `
    + `kattığı tahmini ekonomik değeri yansıtır; nakdi bir ödeme değildir.`
  );
}
