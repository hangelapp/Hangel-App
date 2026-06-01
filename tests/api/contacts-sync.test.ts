/**
 * POST /api/contacts/sync — covers:
 *  - No bearer → 401
 *  - Invalid bearer → 401
 *  - Bad body (hashes not array) → 400
 *  - Filters out malformed hashes (not 64-hex), batches in groups of 10
 *  - Happy path: returns matches with name/avatarUrl
 *  - Empty hashes returns empty matches
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  verifyIdToken,
  whereFn,
} = vi.hoisted(() => ({
  verifyIdToken: vi.fn(),
  // We track each `where('field', 'in', slice)` call so individual tests can pick what to return.
  whereFn: vi.fn(),
}));

vi.mock('@/lib/firebase-admin', () => ({
  getAdminAuth: () => ({ verifyIdToken }),
  getAdminFirestore: () => ({
    collection: () => ({
      where: (...args: unknown[]) => {
        const result = whereFn(...args);
        return {
          select: () => ({
            get: vi.fn().mockResolvedValue(result || { docs: [] }),
          }),
        };
      },
    }),
  }),
}));

import { makeNextRequest } from './_setup';

const HASH_VALID = 'a'.repeat(64);
const HASH_VALID_2 = 'b'.repeat(64);
const HASH_INVALID_SHORT = 'cafebabe';

describe('POST /api/contacts/sync', () => {
  beforeEach(() => {
    vi.resetModules();
    verifyIdToken.mockReset();
    whereFn.mockReset();
  });

  async function post(body: unknown, headers: Record<string, string> = {}) {
    const mod = await import('@/app/api/contacts/sync/route');
    const req = await makeNextRequest('https://x/api/contacts/sync', {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify(body),
    });
    return mod.POST(req as never);
  }

  it('returns 401 when Authorization header missing', async () => {
    const res = await post({ hashes: [HASH_VALID] });
    expect(res.status).toBe(401);
    expect(await res.json()).toMatchObject({ errorCode: 'NO_AUTH' });
  });

  it('returns 401 when bearer token verification fails', async () => {
    verifyIdToken.mockRejectedValueOnce(new Error('invalid'));
    const res = await post({ hashes: [HASH_VALID] }, { authorization: 'Bearer bad' });
    expect(res.status).toBe(401);
    expect(await res.json()).toMatchObject({ errorCode: 'INVALID_TOKEN' });
  });

  it('returns 400 when hashes is not an array', async () => {
    verifyIdToken.mockResolvedValueOnce({ uid: 'u1' });
    const res = await post({ hashes: 'not-array' }, { authorization: 'Bearer ok' });
    expect(res.status).toBe(400);
  });

  it('returns ok:true with empty matches when no valid hashes provided', async () => {
    verifyIdToken.mockResolvedValueOnce({ uid: 'u1' });
    const res = await post({ hashes: [HASH_INVALID_SHORT, 123, null] }, { authorization: 'Bearer ok' });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ ok: true, matches: [] });
  });

  it('returns matches with name/avatar/userId on happy path', async () => {
    verifyIdToken.mockResolvedValueOnce({ uid: 'u1' });
    whereFn.mockReturnValueOnce({
      docs: [
        {
          id: 'match-uid-1',
          data: () => ({
            name: 'Bob',
            avatarUrl: 'https://x/y.png',
            personalInfo: { phoneHash: HASH_VALID },
          }),
        },
      ],
    });
    const res = await post({ hashes: [HASH_VALID] }, { authorization: 'Bearer ok' });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.matches).toHaveLength(1);
    expect(body.matches[0]).toMatchObject({
      hash: HASH_VALID,
      userId: 'match-uid-1',
      name: 'Bob',
    });
  });

  it('batches >10 hashes correctly (Firestore in-query limit 10)', async () => {
    verifyIdToken.mockResolvedValueOnce({ uid: 'u1' });
    whereFn.mockReturnValue({ docs: [] });
    const hashes = Array.from({ length: 12 }, (_, i) => i.toString(16).padStart(64, '0'));
    const res = await post({ hashes }, { authorization: 'Bearer ok' });
    expect(res.status).toBe(200);
    // 12 hashes → 2 batches (10 + 2)
    expect(whereFn).toHaveBeenCalledTimes(2);
  });

  it('skips docs without phoneHash field', async () => {
    verifyIdToken.mockResolvedValueOnce({ uid: 'u1' });
    whereFn.mockReturnValueOnce({
      docs: [
        { id: 'doc-noPhone', data: () => ({ name: 'NoPhone' }) },
        { id: 'doc-yesPhone', data: () => ({ name: 'YesPhone', personalInfo: { phoneHash: HASH_VALID_2 } }) },
      ],
    });
    const res = await post({ hashes: [HASH_VALID, HASH_VALID_2] }, { authorization: 'Bearer ok' });
    const body = await res.json();
    expect(body.matches).toHaveLength(1);
    expect(body.matches[0].userId).toBe('doc-yesPhone');
  });
});
