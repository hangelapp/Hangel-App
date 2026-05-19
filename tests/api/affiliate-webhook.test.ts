/**
 * FEAT-AFFILIATE-WEBHOOK: POST /api/affiliate/webhook/[brandId]
 *
 * Mocks `@/lib/firebase-admin` so we can drive the brand-doc lookup, the
 * `affiliateConfirmations.create()` idempotency anchor, and the user impact
 * runTransaction. No real Firestore involved.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import crypto from 'crypto';

const {
  brandGet,
  confCreate,
  userGet,
  txUpdate,
  runTransaction,
} = vi.hoisted(() => ({
  brandGet: vi.fn(),
  confCreate: vi.fn(),
  userGet: vi.fn(),
  txUpdate: vi.fn(),
  runTransaction: vi.fn(),
}));

vi.mock('@/lib/firebase-admin', () => ({
  getAdminFirestore: () => ({
    collection: (name: string) => ({
      doc: (_id: string) => {
        if (name === 'brands') {
          return { get: brandGet };
        }
        if (name === 'affiliateConfirmations') {
          return { create: confCreate };
        }
        if (name === 'users') {
          // user doc ref handed into the transaction
          return { __collection: 'users' };
        }
        return { get: vi.fn(), create: vi.fn(), update: vi.fn() };
      },
    }),
    runTransaction,
  }),
}));

vi.mock('firebase-admin/firestore', () => ({
  FieldValue: {
    serverTimestamp: () => 'TS',
    increment: (n: number) => ({ __increment: n }),
  },
  Timestamp: {
    fromMillis: (ms: number) => ({ __ts: ms }),
  },
}));

const BRAND_ID = 'brand-1';
const SECRET = 'unit-test-secret';

function sign(body: string, secret = SECRET): string {
  return crypto.createHmac('sha256', secret).update(body).digest('hex');
}

function makeRequest(body: string, headers: Record<string, string>): Request {
  return new Request(`https://x/api/affiliate/webhook/${BRAND_ID}`, {
    method: 'POST',
    headers,
    body,
  });
}

async function callPost(req: Request) {
  const mod = await import('@/app/api/affiliate/webhook/[brandId]/route');
  return mod.POST(req, { params: { brandId: BRAND_ID } });
}

describe('POST /api/affiliate/webhook/[brandId]', () => {
  beforeEach(() => {
    vi.resetModules();
    brandGet.mockReset();
    confCreate.mockReset();
    userGet.mockReset();
    txUpdate.mockReset();
    runTransaction.mockReset();
    delete process.env.AFFILIATE_WEBHOOK_SECRET;

    // Default: brand exists with its own affiliateSecret
    brandGet.mockResolvedValue({
      exists: true,
      data: () => ({ affiliateSecret: SECRET }),
    });
    // Default: idempotency create succeeds
    confCreate.mockResolvedValue(undefined);
    // Default: user found, transaction calls the callback with a tx that
    // proxies get → userGet and update → txUpdate
    runTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        get: async () => ({ exists: true, data: () => ({}) }),
        update: txUpdate,
      };
      return fn(tx);
    });
  });

  it('returns 401 when x-affiliate-signature header is missing', async () => {
    const body = JSON.stringify({
      orderId: 'o1',
      amount: 100,
      commission: 10,
      completedAt: Math.floor(Date.now() / 1000),
    });
    const res = await callPost(makeRequest(body, { 'content-type': 'application/json' }));
    expect(res.status).toBe(401);
    const json = (await res.json()) as { errorCode: string };
    expect(json.errorCode).toBe('INVALID_SIGNATURE');
    expect(confCreate).not.toHaveBeenCalled();
  });

  it('returns 401 when signature does not match (timing-safe compare)', async () => {
    const body = JSON.stringify({
      orderId: 'o2',
      amount: 100,
      commission: 10,
      completedAt: Math.floor(Date.now() / 1000),
    });
    // Use the right length but wrong content so the timing-safe compare runs
    const badSig = sign(body, 'WRONG-SECRET');
    const res = await callPost(
      makeRequest(body, {
        'content-type': 'application/json',
        'x-affiliate-signature': badSig,
      }),
    );
    expect(res.status).toBe(401);
    const json = (await res.json()) as { errorCode: string };
    expect(json.errorCode).toBe('INVALID_SIGNATURE');
    expect(confCreate).not.toHaveBeenCalled();
  });

  it('returns 409 DUPLICATE_ORDER when the orderId was already confirmed', async () => {
    const body = JSON.stringify({
      orderId: 'o3',
      userId: 'u3',
      amount: 200,
      commission: 20,
      completedAt: Math.floor(Date.now() / 1000),
    });
    // Firestore Admin SDK ALREADY_EXISTS code path
    confCreate.mockRejectedValueOnce(Object.assign(new Error('exists'), { code: 6 }));

    const res = await callPost(
      makeRequest(body, {
        'content-type': 'application/json',
        'x-affiliate-signature': sign(body),
      }),
    );
    expect(res.status).toBe(409);
    const json = (await res.json()) as { errorCode: string };
    expect(json.errorCode).toBe('DUPLICATE_ORDER');
    // No impact bump on duplicate
    expect(runTransaction).not.toHaveBeenCalled();
  });

  it('returns 200 + records confirmation + increments user impactScore on valid first-time webhook', async () => {
    const body = JSON.stringify({
      orderId: 'o4',
      userId: 'u4',
      amount: 250,
      commission: 25,
      completedAt: Math.floor(Date.now() / 1000),
    });

    const res = await callPost(
      makeRequest(body, {
        'content-type': 'application/json',
        'x-affiliate-signature': sign(body),
      }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ status: 'recorded' });

    // Audit row written with brand+order pair
    expect(confCreate).toHaveBeenCalledTimes(1);
    const writePayload = confCreate.mock.calls[0][0] as { brandId: string; orderId: string; commission: number };
    expect(writePayload.brandId).toBe(BRAND_ID);
    expect(writePayload.orderId).toBe('o4');
    expect(writePayload.commission).toBe(25);

    // impactScore++ inside the transaction
    expect(runTransaction).toHaveBeenCalledTimes(1);
    expect(txUpdate).toHaveBeenCalledTimes(1);
    const updateArgs = txUpdate.mock.calls[0][1] as { impactScore: { __increment: number } };
    expect(updateArgs.impactScore).toEqual({ __increment: 25 });
  });
});
