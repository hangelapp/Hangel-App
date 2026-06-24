/**
 * Affiliate ajansının KISA kodu — markanın hangi ağdan geldiğini rozet olarak
 * göstermek için. Bilinen bir ajansa eşleşmezse (hangel-yerli marka, başvuruyla
 * eklenen) "hangel" döner.
 *
 *   Affocean        → AFF
 *   GelirOrtakları  → GELİR
 *   ReklamAction    → ACT
 *   (diğer/yerli)   → hangel
 */
export function agencyShortCode(agency?: string | null): string {
  const a = (agency || '').toLocaleLowerCase('tr');
  if (a.includes('affocean')) return 'AFF';
  if (a.includes('gelir')) return 'GELİR';
  if (a.includes('reklam') || a.includes('action')) return 'ACT';
  return 'hangel';
}
