/**
 * TR telefon → E.164 (+90XXXXXXXXXX) normalize. Geçerliyse +90 ile başlayan
 * 13 karakterli string, değilse null döner.
 *
 * Santral kişi yükleme (lists/upload) ve katılımcı senkronu (participants/sync)
 * ORTAK kullanır — kişi eşleştirmesi (aynı telefon = aynı santralContacts doc)
 * bu normalize'a dayanır, tek kaynak olmalı.
 */
export function normalizePhoneTr(raw: string): string | null {
  if (!raw) return null;
  const digits = String(raw).replace(/[^0-9+]/g, '');
  if (!digits) return null;

  if (digits.startsWith('+90')) {
    const rest = digits.slice(3);
    if (rest.length === 10 && /^[1-9]/.test(rest)) return `+90${rest}`;
    return null;
  }
  if (digits.startsWith('+')) return null; // yabancı numara — bu görev TR

  const onlyDigits = digits.replace(/^0+/, (m) => (m.length > 1 ? '0' : m));
  if (onlyDigits.length === 11 && onlyDigits.startsWith('0')) {
    const rest = onlyDigits.slice(1);
    if (/^[1-9]/.test(rest)) return `+90${rest}`;
    return null;
  }
  if (onlyDigits.length === 10 && /^[1-9]/.test(onlyDigits)) {
    return `+90${onlyDigits}`;
  }
  if (onlyDigits.length === 12 && onlyDigits.startsWith('90')) {
    const rest = onlyDigits.slice(2);
    if (/^[1-9]/.test(rest)) return `+90${rest}`;
    return null;
  }
  return null;
}
