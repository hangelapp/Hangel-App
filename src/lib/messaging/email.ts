/**
 * E-posta normalizasyonu ve validasyonu.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ROLE_ADDRESSES = new Set([
  'postmaster',
  'abuse',
  'noreply',
  'no-reply',
  'mailer-daemon',
]);

export function normalizeEmail(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed) return null;
  return trimmed;
}

export function isValidEmail(raw: string | null | undefined): boolean {
  const normalized = normalizeEmail(raw);
  if (!normalized) return false;
  return EMAIL_REGEX.test(normalized);
}

export function isRoleAddress(raw: string | null | undefined): boolean {
  const normalized = normalizeEmail(raw);
  if (!normalized) return false;
  const local = normalized.split('@')[0];
  return ROLE_ADDRESSES.has(local);
}
