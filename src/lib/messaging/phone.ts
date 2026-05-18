/**
 * Telefon numarası normalizasyonu.
 * Mevcut src/app/super-admin/ngos/page.tsx içindeki normalizePhone'u genişletir;
 * TR mobil için E.164 (+90) çıktısı verir, kıyaslama için ham digit dönüşü sağlar.
 */

export const normalizePhone = (raw: string | null | undefined): string =>
  (raw ?? '').replace(/[^0-9]/g, '');

const TR_COUNTRY_CODE = '90';
const TR_MOBILE_LENGTH = 10;

export function toE164TR(raw: string | null | undefined): string | null {
  const digits = normalizePhone(raw);
  if (!digits) return null;

  if (digits.length === TR_MOBILE_LENGTH && digits.startsWith('5')) {
    return `+${TR_COUNTRY_CODE}${digits}`;
  }

  if (digits.length === TR_MOBILE_LENGTH + 1 && digits.startsWith('05')) {
    return `+${TR_COUNTRY_CODE}${digits.slice(1)}`;
  }

  if (
    digits.length === TR_MOBILE_LENGTH + TR_COUNTRY_CODE.length &&
    digits.startsWith(TR_COUNTRY_CODE)
  ) {
    const mobile = digits.slice(TR_COUNTRY_CODE.length);
    if (mobile.startsWith('5')) return `+${digits}`;
  }

  return null;
}

export function isValidTRMobile(raw: string | null | undefined): boolean {
  return toE164TR(raw) !== null;
}

export function matchesPhone(candidate: string, query: string): boolean {
  const a = normalizePhone(candidate);
  const b = normalizePhone(query);
  if (!a || !b || b.length < 3) return false;
  return a.endsWith(b) || b.endsWith(a);
}
