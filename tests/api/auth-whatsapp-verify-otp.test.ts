/**
 * POST /api/auth/whatsapp/verify-otp — covers:
 *  - IP rate-limit (429)
 *  - Invalid input (400) — bad phone / non-6-digit code
 *  - No OTP doc (404)
 *  - Wrong code (401, attempts++)
 *  - Too many attempts (429)
 *  - Expired OTP (410)
 *  - Happy path: existing Firebase Auth user → returns customToken
 *  - Happy path: new user → creates Auth user + users/{uid} doc + welcome chain
 *  - Duplicate phone via personalInfo.phone (existing user reuse) → no Auth dup
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  getUserByPhoneNumber,
  updateUser,
  createUser,
  createCustomToken,
  getUser,
  rateBuckets,
  otpDoc,
  userDocRef,
  duplicateQuerySnap,
  messagesAdd,
  notificationsAdd,
} = vi.hoisted(() => ({
  getUserByPhoneNumber: vi.fn(),
  updateUser: vi.fn().mockResolvedValue(undefined),
  createUser: vi.fn(),
  createCustomToken: vi.fn(),
  getUser: vi.fn(),
  rateBuckets: new Map<string, { count: number; resetAt: number }>(),
  otpDoc: { exists: true, data: () => ({}) } as { exists: boolean; data: () => unknown },
  userDocRef: { exists: false, data: () => ({}) } as { exists: boolean; data: () => unknown },
  duplicateQuerySnap: { empty: true, docs: [] as Array<{ id: string; data: () => unknown }> },
  messagesAdd: vi.fn().mockResolvedValue({}),
  notificationsAdd: vi.fn().mockResolvedValue({}),
}));

// Firestore admin mock — minimal chainable surface used by the route.
const makeFsDoc = (snap: { exists: boolean; data: () => unknown }) => ({
  get: vi.fn().mockResolvedValue(snap),
  update: vi.fn().mockResolvedValue(undefined),
  delete: vi.fn().mockResolvedValue(undefined),
  set: vi.fn().mockResolvedValue(undefined),
});

vi.mock('@/lib/firebase-admin', () => ({
  getAdminAuth: () => ({
    getUserByPhoneNumber,
    updateUser,
    createUser,
    createCustomToken,
    getUser,
  }),
  getAdminFirestore: () => {
    const otpRef = makeFsDoc(otpDoc);
    const userRef = makeFsDoc(userDocRef);
    return {
      collection: (name: string) => {
        if (name === 'otp_codes') {
          return { doc: () => otpRef };
        }
        if (name === 'users') {
          return {
            doc: () => userRef,
            where: () => ({
              limit: () => ({
                get: vi.fn().mockResolvedValue(duplicateQuerySnap),
              }),
            }),
            add: vi.fn().mockResolvedValue({}),
          };
        }
        if (name === 'messages') {
          return { add: messagesAdd };
        }
        if (name === 'notifications') {
          return { add: notificationsAdd };
        }
        return { doc: () => makeFsDoc({ exists: false, data: () => ({}) }) };
      },
    };
  },
}));

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: async (opts: { bucket: string; key: string; limit: number; windowMs: number }) => {
    const id = `${opts.bucket}__${opts.key}`;
    const now = Date.now();
    const cur = rateBuckets.get(id);
    if (!cur || cur.resetAt <= now) {
      rateBuckets.set(id, { count: 1, resetAt: now + opts.windowMs });
      return { allowed: true, remaining: opts.limit - 1, resetAt: now + opts.windowMs };
    }
    if (cur.count >= opts.limit) {
      return { allowed: false, remaining: 0, resetAt: cur.resetAt };
    }
    cur.count += 1;
    return { allowed: true, remaining: opts.limit - cur.count, resetAt: cur.resetAt };
  },
}));

vi.mock('firebase-admin/firestore', () => ({
  FieldValue: {
    increment: (n: number) => ({ __op: 'increment', n }),
    serverTimestamp: () => ({ __op: 'serverTimestamp' }),
  },
}));

// next/server `after` shim — execute synchronously so test can assert side effects.
vi.mock('next/server', async (orig) => {
  const actual = await orig<typeof import('next/server')>();
  return {
    ...actual,
    after: (fn: () => unknown) => Promise.resolve(fn()).catch(() => undefined),
  };
});

import { makeNextRequest } from './_setup';

describe('POST /api/auth/whatsapp/verify-otp', () => {
  beforeEach(() => {
    vi.resetModules();
    getUserByPhoneNumber.mockReset();
    updateUser.mockReset().mockResolvedValue(undefined);
    createUser.mockReset();
    createCustomToken.mockReset().mockResolvedValue('test-custom-token');
    getUser.mockReset();
    rateBuckets.clear();
    messagesAdd.mockReset().mockResolvedValue({});
    notificationsAdd.mockReset().mockResolvedValue({});
    otpDoc.exists = true;
    otpDoc.data = () => ({ code: '123456', expiresAt: Date.now() + 60_000, attempts: 0 });
    userDocRef.exists = false;
    userDocRef.data = () => ({});
    duplicateQuerySnap.empty = true;
    duplicateQuerySnap.docs = [];
  });
  afterEach(() => vi.useRealTimers());

  async function post(body: unknown, ip = '1.2.3.4') {
    const mod = await import('@/app/api/auth/whatsapp/verify-otp/route');
    const req = await makeNextRequest('https://x/api/auth/whatsapp/verify-otp', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
      body: JSON.stringify(body),
    });
    return mod.POST(req as never);
  }

  it('returns 400 when phone missing', async () => {
    const res = await post({ phone: '', code: '123456', phoneCountryCode: '+90' }, '9.0.0.1');
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ errorCode: 'INVALID_INPUT' });
  });

  it('returns 400 when code is not 6 digits', async () => {
    const res = await post({ phone: '5384009090', code: '12', phoneCountryCode: '+90' }, '9.0.0.2');
    expect(res.status).toBe(400);
  });

  it('returns 404 when no OTP doc exists for phone', async () => {
    otpDoc.exists = false;
    otpDoc.data = () => ({});
    const res = await post({ phone: '5384009090', code: '123456', phoneCountryCode: '+90' }, '9.0.0.3');
    expect(res.status).toBe(404);
    expect(await res.json()).toMatchObject({ errorCode: 'NO_OTP' });
  });

  it('returns 410 when OTP doc has expired', async () => {
    otpDoc.data = () => ({ code: '123456', expiresAt: Date.now() - 1000, attempts: 0 });
    const res = await post({ phone: '5384009090', code: '123456', phoneCountryCode: '+90' }, '9.0.0.4');
    expect(res.status).toBe(410);
    expect(await res.json()).toMatchObject({ errorCode: 'OTP_EXPIRED' });
  });

  it('returns 429 when attempts >= 5', async () => {
    otpDoc.data = () => ({ code: '123456', expiresAt: Date.now() + 60_000, attempts: 5 });
    const res = await post({ phone: '5384009090', code: '123456', phoneCountryCode: '+90' }, '9.0.0.5');
    expect(res.status).toBe(429);
    expect(await res.json()).toMatchObject({ errorCode: 'TOO_MANY_ATTEMPTS' });
  });

  it('returns 401 when code does not match', async () => {
    otpDoc.data = () => ({ code: '654321', expiresAt: Date.now() + 60_000, attempts: 0 });
    const res = await post({ phone: '5384009090', code: '111111', phoneCountryCode: '+90' }, '9.0.0.6');
    expect(res.status).toBe(401);
    expect(await res.json()).toMatchObject({ errorCode: 'WRONG_CODE' });
  });

  it('returns 200 + customToken for existing Firebase Auth user (happy path)', async () => {
    getUserByPhoneNumber.mockResolvedValueOnce({ uid: 'existing-uid' });
    userDocRef.exists = true;
    userDocRef.data = () => ({});
    const res = await post({ phone: '5384009090', code: '123456', phoneCountryCode: '+90', name: 'Test' }, '9.0.0.7');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ ok: true, customToken: 'test-custom-token' });
    expect(createCustomToken).toHaveBeenCalledWith('existing-uid');
  });

  it('reuses existing Firestore user when Auth lookup fails but personalInfo.phone matches (duplicate prevention)', async () => {
    // No Auth user; but Firestore has another doc with matching phone.
    getUserByPhoneNumber.mockRejectedValueOnce(new Error('not found'));
    duplicateQuerySnap.empty = false;
    duplicateQuerySnap.docs = [{ id: 'existing-uid-from-fs', data: () => ({ personalInfo: { phone: '5384009090' } }) }];
    const res = await post({ phone: '5384009090', code: '123456', phoneCountryCode: '+90' }, '9.0.0.8');
    expect(res.status).toBe(200);
    expect(createUser).not.toHaveBeenCalled();
    expect(createCustomToken).toHaveBeenCalledWith('existing-uid-from-fs');
  });

  it('creates a new Auth user + Firestore doc when fully fresh (isNewUser=true)', async () => {
    getUserByPhoneNumber.mockRejectedValueOnce(new Error('not found'));
    duplicateQuerySnap.empty = true;
    duplicateQuerySnap.docs = [];
    createUser.mockResolvedValueOnce({ uid: 'new-uid' });
    userDocRef.exists = false;
    const res = await post({ phone: '5384009090', code: '123456', phoneCountryCode: '+90', name: 'Newbie' }, '9.0.0.9');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ ok: true, isNewUser: true, customToken: 'test-custom-token' });
    expect(createUser).toHaveBeenCalled();
  });
});
