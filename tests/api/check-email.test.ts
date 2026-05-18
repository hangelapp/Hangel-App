/**
 * P2-1: POST /api/auth/check-email — covers invalid-email, rate-limit, exists/missing.
 *
 * Mock pattern: `@/lib/firebase-admin` so `getAdminAuth().getUserByEmail` is a vi.fn().
 * The route's in-memory rate-limit map is module-scoped → resetModules + per-test IPs.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { getUserByEmail } = vi.hoisted(() => ({ getUserByEmail: vi.fn() }));

vi.mock('@/lib/firebase-admin', () => ({
  getAdminAuth: () => ({ getUserByEmail }),
}));

import { makeNextRequest } from './_setup';

describe('POST /api/auth/check-email', () => {
  beforeEach(() => {
    vi.resetModules();
    getUserByEmail.mockReset();
  });
  afterEach(() => vi.useRealTimers());

  async function post(body: unknown, ip = '1.2.3.4') {
    const mod = await import('@/app/api/auth/check-email/route');
    const req = await makeNextRequest('https://x/api/auth/check-email', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
      body: JSON.stringify(body),
    });
    return mod.POST(req as never);
  }

  it('returns 400 for invalid email', async () => {
    const res = await post({ email: 'nope' }, '1.2.3.1');
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ errorCode: 'invalid_email' });
  });

  it('returns 200 + exists:true when getUserByEmail succeeds', async () => {
    getUserByEmail.mockResolvedValueOnce({ displayName: 'Alice' });
    const res = await post({ email: 'a@b.co' }, '1.2.3.2');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ exists: true, name: 'Alice' });
  });

  it('returns 200 + exists:false when user-not-found', async () => {
    getUserByEmail.mockRejectedValueOnce({ code: 'auth/user-not-found' });
    const res = await post({ email: 'missing@b.co' }, '1.2.3.3');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ exists: false, name: '' });
  });

  it('returns 429 after exceeding rate limit (>5 in window)', async () => {
    getUserByEmail.mockResolvedValue({ displayName: '' });
    for (let i = 0; i < 5; i++) await post({ email: `a${i}@b.co` }, '9.9.9.9');
    const res = await post({ email: 'a5@b.co' }, '9.9.9.9');
    expect(res.status).toBe(429);
    expect(await res.json()).toMatchObject({ errorCode: 'rate_limited' });
  });
});
