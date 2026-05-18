/**
 * AI guard rails for Genkit flow inputs.
 *
 * Two primitives:
 *  - `sanitizeUserInput(s, max)` — strip control characters (keep newline/tab),
 *    clamp length. Defends against prompt-injection-by-control-chars and
 *    runaway-cost via oversized user blobs.
 *  - `checkAndConsumeAIQuota(userId, kind)` — per-user, per-kind, per-day cap
 *    against runaway Gemini spend. Doc-bucketed at
 *    `aiQuotas/{userId}/buckets/daily-{yyyy-mm-dd}__{kind}` (Admin SDK,
 *    transactional increment).
 *
 * Quota is currently a SKELETON — none of the flow wrappers receive a userId
 * yet (callers don't plumb it through). Each flow file leaves a
 * `TODO(P1-8c)` comment for when the caller wires it.
 *
 * Cap is hardcoded for now; env override is follow-up `P1-8b`.
 */

import 'server-only';
import { getAdminFirestore } from '@/lib/firebase-admin';

// Default per-user / per-kind / per-day call cap.
// TODO(P1-8b): make env-tunable (`AI_QUOTA_DAILY_CAP_<KIND>` or single
// `AI_QUOTA_DAILY_CAP`).
const DEFAULT_DAILY_CAP = 30;

/**
 * Maximum number of characters accepted from any single user-supplied prompt
 * input field. Mirrors the default `maxLen` argument used by most callers of
 * `sanitizeUserInput`. Exported as a shared constant so flow files can refer
 * to a single source of truth (P2-9).
 */
export const MAX_PROMPT_INPUT_CHARS = 4000;

/**
 * Hard cap on `maxOutputTokens` passed to Genkit `definePrompt`/`generate`
 * calls. Defense-in-depth against runaway Gemini cost. Applied per-flow via
 * the `config` field on `ai.definePrompt(...)`.
 */
export const MAX_OUTPUT_TOKENS = 1024;

/**
 * Last-resort post-processing clamp applied to model output strings before
 * they cross the flow boundary. The Genkit `maxOutputTokens` cap should
 * already constrain the response, but token-vs-char ratios are non-uniform
 * (especially with HTML/markdown), so we additionally slice the resulting
 * string to a bounded character length. Non-strings collapse to `''`.
 */
export function clampOutputText(text: unknown, maxChars = 8000): string {
  if (typeof text !== 'string') return '';
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars);
}

/**
 * Sanitize a user-supplied string before interpolating into an LLM prompt.
 *
 * - Coerces non-strings to `''` (defensive — Zod should already guarantee
 *   string, but flows accept `unknown` at the wrapper boundary in practice).
 * - Strips ASCII control chars 0x00-0x1F and 0x7F EXCEPT `\n` (0x0A) and
 *   `\t` (0x09). This blocks zero-width / backspace / ANSI-escape style
 *   prompt-injection vectors that some models honor.
 * - Clamps to `maxLen` (default 4000) to bound token cost.
 *
 * Does NOT attempt semantic prompt-injection scrubbing (e.g. "ignore previous
 * instructions") — that is the prompt template's job (system prompt + few-shot
 * pinning).
 */
export function sanitizeUserInput(input: unknown, maxLen = 4000): string {
  if (typeof input !== 'string') return '';
  // eslint-disable-next-line no-control-regex
  const stripped = input.replace(/[\x00-\x08\x0B-\x1F\x7F]/g, '');
  return stripped.slice(0, maxLen);
}

function dailyBucketKey(kind: string, now: Date = new Date()): string {
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(now.getUTCDate()).padStart(2, '0');
  return `daily-${yyyy}-${mm}-${dd}__${kind}`;
}

export interface AIQuotaResult {
  allowed: boolean;
  remaining: number;
}

/**
 * Atomically check + increment the caller's daily AI quota for a given flow
 * `kind`. Returns `{ allowed: false, remaining: 0 }` once the cap is hit so
 * the caller can bail before invoking Gemini.
 *
 * Storage layout:
 *   aiQuotas/{userId}/buckets/{bucketKey}
 *     bucketKey = `daily-YYYY-MM-DD__{kind}`
 *     fields: { count: number, cap: number, updatedAt: Timestamp }
 *
 * Fail-open semantics: if the Admin SDK is unavailable (no service account in
 * the runtime — e.g. local dev without `.firebase-service-account.json`) the
 * call is allowed. We log a warning so the operator sees it. This keeps the
 * dev loop unblocked but means production MUST have the service account
 * wired up for the cap to bite. Acceptable risk for the current skeleton.
 */
export async function checkAndConsumeAIQuota(
  userId: string,
  kind: string,
  cap: number = DEFAULT_DAILY_CAP,
): Promise<AIQuotaResult> {
  if (!userId || typeof userId !== 'string') {
    return { allowed: true, remaining: cap };
  }
  const safeKind = sanitizeUserInput(kind, 64).replace(/[^a-zA-Z0-9_-]/g, '') || 'unknown';
  let db: ReturnType<typeof getAdminFirestore>;
  try {
    db = getAdminFirestore();
  } catch (err) {
    console.warn('[ai/guards] Admin SDK unavailable; allowing AI call without quota enforcement.', err);
    return { allowed: true, remaining: cap };
  }

  const bucketRef = db
    .collection('aiQuotas')
    .doc(userId)
    .collection('buckets')
    .doc(dailyBucketKey(safeKind));

  try {
    return await db.runTransaction(async (tx) => {
      const snap = await tx.get(bucketRef);
      const current = (snap.exists ? (snap.data()?.count as number | undefined) : 0) ?? 0;
      if (current >= cap) {
        return { allowed: false, remaining: 0 };
      }
      const next = current + 1;
      tx.set(
        bucketRef,
        {
          count: next,
          cap,
          kind: safeKind,
          updatedAt: new Date(),
        },
        { merge: true },
      );
      return { allowed: true, remaining: Math.max(0, cap - next) };
    });
  } catch (err) {
    console.warn('[ai/guards] Quota transaction failed; allowing AI call.', err);
    return { allowed: true, remaining: cap };
  }
}
