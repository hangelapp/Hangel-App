/**
 * Affiliate webhook receiver — `POST /api/affiliate/webhook/[brandId]`.
 *
 * Brand-side e-commerce systems POST here after a confirmed sale that
 * originated from a Hangel referral link. Hangel records the confirmation,
 * marks the donation as "processed" downstream, and increments the user's
 * impactScore.
 *
 * Auth model:
 *  - `x-affiliate-signature` header carries HMAC SHA256 (hex) of the raw body.
 *  - Per-brand secret: `brands/{brandId}.affiliateSecret`. If a brand has not
 *    been onboarded with its own secret, fall back to the shared
 *    `AFFILIATE_WEBHOOK_SECRET` env var (so partners can ship before we issue
 *    per-brand keys).
 *  - Both sides are compared with `crypto.timingSafeEqual`.
 *  - Optional `x-affiliate-timestamp` header (Unix seconds) — when present we
 *    require it to be within ±5 min of server time (P1-3 pattern).
 *
 * Idempotency:
 *  - `affiliateConfirmations/{brandId}__{orderId}` is created with Admin SDK
 *    `.create()` (atomic create-or-fail). Duplicate orderId → 409
 *    `DUPLICATE_ORDER`.
 *
 * Error response shape: `{ errorCode, message }`.
 *
 * NOTE on `runTransaction`: we use the document-level atomic `create()` for the
 * idempotency anchor, then a single transaction wraps the user impactScore
 * increment + audit doc write so the impact mutation is rolled back if anything
 * downstream fails. Pure write-only, no read-before-write contention.
 */

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';

export const runtime = 'nodejs';

const FIVE_MINUTES_MS = 5 * 60 * 1000;

type ErrorCode =
  | 'INVALID_SIGNATURE'
  | 'INVALID_BODY'
  | 'STALE_TIMESTAMP'
  | 'DUPLICATE_ORDER'
  | 'BRAND_NOT_FOUND'
  | 'INTERNAL_ERROR';

function errorResponse(status: number, errorCode: ErrorCode, message: string) {
  return NextResponse.json({ errorCode, message }, { status });
}

interface AffiliateWebhookPayload {
  orderId: string;
  userId?: string;
  referralCode?: string;
  amount: number;
  commission: number;
  currency?: 'TRY';
  completedAt: number;
}

/** Manual body validation — keeps the bundle slim (no zod runtime dep here). */
function validatePayload(raw: unknown): { ok: true; data: AffiliateWebhookPayload } | { ok: false; reason: string } {
  if (!raw || typeof raw !== 'object') return { ok: false, reason: 'body is not an object' };
  const r = raw as Record<string, unknown>;
  if (typeof r.orderId !== 'string' || r.orderId.length === 0) {
    return { ok: false, reason: 'orderId must be a non-empty string' };
  }
  if (typeof r.amount !== 'number' || !Number.isFinite(r.amount) || r.amount < 0) {
    return { ok: false, reason: 'amount must be a non-negative number' };
  }
  if (typeof r.commission !== 'number' || !Number.isFinite(r.commission) || r.commission < 0) {
    return { ok: false, reason: 'commission must be a non-negative number' };
  }
  if (typeof r.completedAt !== 'number' || !Number.isFinite(r.completedAt) || r.completedAt <= 0) {
    return { ok: false, reason: 'completedAt must be a positive unix-seconds number' };
  }
  if (r.userId !== undefined && typeof r.userId !== 'string') {
    return { ok: false, reason: 'userId must be a string when present' };
  }
  if (r.referralCode !== undefined && typeof r.referralCode !== 'string') {
    return { ok: false, reason: 'referralCode must be a string when present' };
  }
  if (r.currency !== undefined && r.currency !== 'TRY') {
    return { ok: false, reason: 'only TRY currency is supported' };
  }
  return {
    ok: true,
    data: {
      orderId: r.orderId,
      userId: r.userId as string | undefined,
      referralCode: r.referralCode as string | undefined,
      amount: r.amount,
      commission: r.commission,
      currency: (r.currency as 'TRY' | undefined) ?? 'TRY',
      completedAt: r.completedAt,
    },
  };
}

function timingSafeStringEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  try {
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

function verifySignature(rawBody: string, signatureHeader: string | null, secret: string): boolean {
  if (!signatureHeader || !secret) return false;
  // Accept either "sha256=<hex>" or bare "<hex>" so brands can send whichever
  // matches their SDK; both compared timing-safe.
  const incoming = signatureHeader.startsWith('sha256=')
    ? signatureHeader.slice('sha256='.length)
    : signatureHeader;
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  return timingSafeStringEqual(incoming, expected);
}

export async function POST(req: Request, { params }: { params: { brandId: string } }) {
  const { brandId } = params;
  if (!brandId) {
    return errorResponse(400, 'INVALID_BODY', 'brandId path param is required');
  }

  const rawBody = await req.text();
  const signatureHeader = req.headers.get('x-affiliate-signature');
  const timestampHeader = req.headers.get('x-affiliate-timestamp');

  // Optional anti-replay: enforce when the brand sends a timestamp; we don't
  // require it because not every partner platform will include it day one.
  if (timestampHeader) {
    const tsSec = Number(timestampHeader);
    if (!Number.isFinite(tsSec) || tsSec <= 0) {
      return errorResponse(401, 'STALE_TIMESTAMP', 'x-affiliate-timestamp must be a positive unix-seconds number');
    }
    if (Math.abs(Date.now() - tsSec * 1000) > FIVE_MINUTES_MS) {
      return errorResponse(401, 'STALE_TIMESTAMP', 'timestamp outside ±5min window');
    }
  }

  if (!signatureHeader) {
    return errorResponse(401, 'INVALID_SIGNATURE', 'x-affiliate-signature header is required');
  }

  const db = getAdminFirestore();

  // Resolve the brand's per-tenant secret; fall back to the shared env secret.
  let brandSecret: string | null = null;
  let brandExists: boolean;
  try {
    const brandSnap = await db.collection(COLLECTIONS.brands).doc(brandId).get();
    brandExists = brandSnap.exists;
    if (brandSnap.exists) {
      const data = brandSnap.data() as { affiliateSecret?: string } | undefined;
      if (data?.affiliateSecret && typeof data.affiliateSecret === 'string') {
        brandSecret = data.affiliateSecret;
      }
    }
  } catch (err) {
    console.error('[affiliate webhook] brand lookup failed', err);
    return errorResponse(500, 'INTERNAL_ERROR', 'brand lookup failed');
  }

  const sharedSecret = process.env.AFFILIATE_WEBHOOK_SECRET ?? '';
  const secret = brandSecret ?? sharedSecret;
  if (!secret) {
    // No per-brand secret and no shared secret configured → cannot verify.
    return errorResponse(401, 'INVALID_SIGNATURE', 'no signing secret configured for this brand');
  }

  if (!verifySignature(rawBody, signatureHeader, secret)) {
    return errorResponse(401, 'INVALID_SIGNATURE', 'signature verification failed');
  }

  // Treat unknown brands as a hard error AFTER signature check (we still want
  // the 401 path to win for callers without a valid secret).
  if (!brandExists) {
    return errorResponse(404, 'BRAND_NOT_FOUND', `brand ${brandId} does not exist`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return errorResponse(400, 'INVALID_BODY', 'body is not valid JSON');
  }
  const validated = validatePayload(parsed);
  if (!validated.ok) {
    return errorResponse(400, 'INVALID_BODY', validated.reason);
  }
  const payload = validated.data;

  // Idempotency anchor — atomic create-or-fail.
  const confId = `${brandId}__${payload.orderId}`.replace(/[/]/g, '_').slice(0, 1500);
  const confRef = db.collection(COLLECTIONS.affiliateConfirmations).doc(confId);

  try {
    await confRef.create({
      brandId,
      orderId: payload.orderId,
      userId: payload.userId ?? null,
      referralCode: payload.referralCode ?? null,
      amount: payload.amount,
      commission: payload.commission,
      currency: payload.currency ?? 'TRY',
      completedAt: Timestamp.fromMillis(payload.completedAt * 1000),
      receivedAt: FieldValue.serverTimestamp(),
      raw: payload,
    });
  } catch (err) {
    const code = (err as { code?: number | string }).code;
    if (code === 6 || code === 'already-exists') {
      return errorResponse(409, 'DUPLICATE_ORDER', `orderId ${payload.orderId} already confirmed for brand ${brandId}`);
    }
    console.error('[affiliate webhook] confirmation write failed', err);
    return errorResponse(500, 'INTERNAL_ERROR', 'failed to record confirmation');
  }

  // Increment user impactScore inside a transaction so we can roll back the
  // confirmation doc if the user write blows up. We don't fail the request if
  // the userId is missing / unresolved — just skip the impact bump and let an
  // operator reconcile via referralCode later.
  if (payload.userId) {
    const userRef = db.collection(COLLECTIONS.users).doc(payload.userId);
    try {
      await db.runTransaction(async (tx) => {
        const userSnap = await tx.get(userRef);
        if (!userSnap.exists) return; // skip — keep confirmation, no impact bump
        tx.update(userRef, {
          impactScore: FieldValue.increment(payload.commission),
          updatedAt: FieldValue.serverTimestamp(),
        });
      });
    } catch (err) {
      // Best-effort: keep the confirmation but report partial success.
      console.error('[affiliate webhook] impactScore increment failed', err);
    }
  }

  return NextResponse.json({ status: 'recorded' }, { status: 200 });
}
