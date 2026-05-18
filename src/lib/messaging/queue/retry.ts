import type { CanonicalErrorCode } from '../types';

export const TERMINAL_ERROR_CODES = new Set<CanonicalErrorCode>([
  'invalid_address',
  'blocked',
  'no_consent',
]);

const BACKOFF_MINUTES = [1, 5, 30, 120, 720] as const;

export const MAX_ATTEMPTS = BACKOFF_MINUTES.length;

export function isTerminal(errorCode: CanonicalErrorCode | undefined): boolean {
  return errorCode !== undefined && TERMINAL_ERROR_CODES.has(errorCode);
}

/**
 * Sonraki deneme zamanını döndürür. Terminal hatada veya max'a ulaşıldıysa null.
 * attemptsSoFar = şu ana kadar yapılan deneme sayısı (bu denemeyi de sayıyor).
 */
export function nextAttemptAt(
  attemptsSoFar: number,
  errorCode: CanonicalErrorCode | undefined
): Date | null {
  if (isTerminal(errorCode)) return null;
  const minutes = BACKOFF_MINUTES[attemptsSoFar - 1] ?? null;
  if (minutes === null) return null;
  return new Date(Date.now() + minutes * 60_000);
}
