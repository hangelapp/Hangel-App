/**
 * P1-1b — Firestore-backed distributed rate limiter.
 *
 * Replaces per-instance in-memory `Map<ip, ...>` buckets that don't survive
 * cold starts and don't sync across App Hosting instances (`maxInstances: 3`).
 *
 * Storage: `rateLimits/{bucket}__{key}` holds `{ count, windowStart, lastSeen }`.
 * Sliding window: when `now - windowStart > windowMs`, the bucket resets to
 * `count=1, windowStart=now`. Otherwise the count is incremented atomically
 * inside a Firestore transaction; if `count > limit` the call is rejected.
 *
 * Fail-open contract: if Admin SDK init or the Firestore transaction throws
 * (cold start, network blip, missing creds in test env), we return
 * `{ allowed: true, ... }` so production routes degrade open rather than
 * blocking legitimate traffic. This is intentional — the limiter is a
 * defense-in-depth layer, not the only auth/abuse control.
 *
 * Trade-off: each rate-limit check adds ~50ms of Firestore latency vs the
 * old in-memory `Map.get`. Acceptable for low-RPS public endpoints
 * (check-email ~5/min/IP; admin import ~10/min/IP).
 */
import { FieldValue, type Firestore } from 'firebase-admin/firestore';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';

export interface RateLimitResult {
  /** `false` ⇒ caller should reject (429). `true` ⇒ proceed. */
  allowed: boolean;
  /** Approximate remaining quota in the current window. Best-effort. */
  remaining: number;
  /** Epoch ms when the current window ends (and `count` resets). */
  resetAt: number;
}

export interface CheckRateLimitOptions {
  /** Logical bucket name — e.g. `'check-email'`, `'admin-import-data'`. */
  bucket: string;
  /** Per-bucket key — usually the client IP. */
  key: string;
  /** Maximum requests allowed inside one window. */
  limit: number;
  /** Sliding window length in milliseconds. */
  windowMs: number;
}

/**
 * Sanitize the doc-id component. Firestore doc ids can't contain `/`, and we
 * also fold whitespace and control chars to keep ids predictable.
 */
function sanitizeIdPart(part: string): string {
  return part.replace(/[^A-Za-z0-9._:-]/g, '_').slice(0, 100) || 'unknown';
}

function getDocId(bucket: string, key: string): string {
  return `${sanitizeIdPart(bucket)}__${sanitizeIdPart(key)}`;
}

/**
 * Atomic rate-limit check + increment.
 *
 * Fails open on any internal error (admin SDK init failure, transaction
 * abort, etc.) so the API stays available during cold-start anomalies.
 */
export async function checkRateLimit(
  opts: CheckRateLimitOptions
): Promise<RateLimitResult> {
  const { bucket, key, limit, windowMs } = opts;
  const now = Date.now();
  const docId = getDocId(bucket, key);

  let db: Firestore;
  try {
    db = getAdminFirestore();
  } catch (err) {
    // Cold-start / missing-ADC fallback — degrade open.
    console.warn('[rate-limit] admin-init-failed; failing open', {
      bucket,
      key,
      err: err instanceof Error ? err.message : String(err),
    });
    return { allowed: true, remaining: Math.max(0, limit - 1), resetAt: now + windowMs };
  }

  const ref = db.collection(COLLECTIONS.rateLimits).doc(docId);

  try {
    const result = await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const data = snap.exists ? (snap.data() as { count?: number; windowStart?: number }) : null;

      // No bucket yet, or window has elapsed → start a fresh window.
      if (!data || typeof data.windowStart !== 'number' || now - data.windowStart > windowMs) {
        const fresh = {
          count: 1,
          windowStart: now,
          lastSeen: FieldValue.serverTimestamp(),
        };
        tx.set(ref, fresh);
        return {
          allowed: true,
          remaining: Math.max(0, limit - 1),
          resetAt: now + windowMs,
        } satisfies RateLimitResult;
      }

      const currentCount = typeof data.count === 'number' ? data.count : 0;
      const nextCount = currentCount + 1;
      const resetAt = data.windowStart + windowMs;

      // Limit exceeded — don't increment further (avoids unbounded growth);
      // just bump lastSeen for observability.
      if (currentCount >= limit) {
        tx.update(ref, { lastSeen: FieldValue.serverTimestamp() });
        return { allowed: false, remaining: 0, resetAt } satisfies RateLimitResult;
      }

      tx.update(ref, {
        count: nextCount,
        lastSeen: FieldValue.serverTimestamp(),
      });
      return {
        allowed: true,
        remaining: Math.max(0, limit - nextCount),
        resetAt,
      } satisfies RateLimitResult;
    });
    return result;
  } catch (err) {
    // Firestore transient — fail open with a synthetic window. The next call
    // will retry the underlying store; meanwhile legitimate traffic flows.
    console.warn('[rate-limit] tx-failed; failing open', {
      bucket,
      key,
      err: err instanceof Error ? err.message : String(err),
    });
    return { allowed: true, remaining: Math.max(0, limit - 1), resetAt: now + windowMs };
  }
}
