/**
 * Shared auth helpers for Genkit `'use server'` flow wrappers (P1-8c).
 *
 * Why a separate file from `guards.ts`: `guards.ts` is the
 * already-deployed input-sanitization + quota-bucket primitive and is
 * frozen ("final" per P1-8). This module adds the *caller-side*
 * authentication layer — turning a client-supplied ID token into a
 * trusted uid that can be fed into `checkAndConsumeAIQuota`.
 *
 * Hard rule: NEVER accept a bare uid from a client. Only ID tokens are
 * acceptable identity material. `verifyAIFlowUserId` does the
 * `Admin SDK verifyIdToken` round-trip; on any failure (missing token,
 * invalid signature, expired, or Admin SDK unavailable in local dev) it
 * returns `null` and the caller falls back to no-quota-enforcement (same
 * fail-open posture as `checkAndConsumeAIQuota` itself).
 *
 * The mirror error type `AIQuotaExceededError` is the typed throw the
 * flow wrapper raises when the cap is hit. Clients should detect it via
 * `err.message.startsWith('QUOTA_EXCEEDED')` (server-action error
 * serialization preserves message, may not preserve class).
 */

import 'server-only';
import { getAdminAuth } from '@/lib/firebase-admin';

/**
 * Typed error thrown by flow wrappers when the per-user daily AI cap is
 * exhausted. The stable contract is `error.message` of the form
 * `QUOTA_EXCEEDED:<kind>` — server actions serialize Error subclasses to
 * plain Error over the wire so message-matching is the reliable check.
 */
export class AIQuotaExceededError extends Error {
  readonly code = 'QUOTA_EXCEEDED' as const;
  constructor(kind: string) {
    super(`QUOTA_EXCEEDED:${kind}`);
    this.name = 'AIQuotaExceededError';
  }
}

/**
 * Verify a Firebase ID token and return the uid. Returns `null` on
 * missing / invalid token (quota enforcement is then skipped — fail-open
 * to match `checkAndConsumeAIQuota` behaviour when the Admin SDK is
 * unavailable in local dev).
 */
export async function verifyAIFlowUserId(
  idToken: string | undefined | null,
): Promise<string | null> {
  if (!idToken || typeof idToken !== 'string') return null;
  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken);
    return decoded.uid || null;
  } catch (err) {
    console.warn('[ai/flow-auth] verifyIdToken failed; skipping quota enforcement.', err);
    return null;
  }
}
