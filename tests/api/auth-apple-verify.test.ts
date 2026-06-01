/**
 * POST /api/auth/apple/verify — covers:
 *  - Missing identityToken / nonce → 400
 *  - JWT validation fails (signature/aud/iss) → 401
 *  - Nonce mismatch → 401
 *  - Happy path: new user → createUser + Firestore upsert
 *  - Happy path: existing user → no createUser, customToken returned
 *
 * Strategy: stub `jsonwebtoken.verify` and `jwks-rsa` so we don't hit network.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  jwtVerify,
  jwtDecode,
  jwksGetSigningKey,
  getUser,
  createUser,
  createCustomToken,
  userDocSet,
} = vi.hoisted(() => ({
  jwtVerify: vi.fn(),
  jwtDecode: vi.fn(),
  jwksGetSigningKey: vi.fn((kid: string, cb: (err: unknown, key?: { getPublicKey: () => string }) => void) => {
    cb(null, { getPublicKey: () => 'fake-public-key' });
  }),
  getUser: vi.fn(),
  createUser: vi.fn(),
  createCustomToken: vi.fn(),
  userDocSet: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('jsonwebtoken', () => ({
  default: {
    verify: jwtVerify,
    decode: jwtDecode,
  },
  verify: jwtVerify,
  decode: jwtDecode,
}));

vi.mock('jwks-rsa', () => ({
  default: () => ({ getSigningKey: jwksGetSigningKey }),
}));

vi.mock('@/lib/firebase-admin', () => ({
  getAdminAuth: () => ({ getUser, createUser, createCustomToken }),
  getAdminFirestore: () => ({
    collection: () => ({
      doc: () => ({ set: userDocSet }),
    }),
  }),
}));

vi.mock('firebase-admin/firestore', () => ({
  FieldValue: { serverTimestamp: () => ({ __op: 'serverTimestamp' }) },
}));

import { makeNextRequest } from './_setup';

describe('POST /api/auth/apple/verify', () => {
  beforeEach(() => {
    vi.resetModules();
    jwtVerify.mockReset();
    jwtDecode.mockReset();
    getUser.mockReset();
    createUser.mockReset();
    createCustomToken.mockReset().mockResolvedValue('apple-custom-token');
    userDocSet.mockReset().mockResolvedValue(undefined);
  });

  async function post(body: unknown) {
    const mod = await import('@/app/api/auth/apple/verify/route');
    const req = await makeNextRequest('https://x/api/auth/apple/verify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    return mod.POST(req as never);
  }

  it('returns 400 when identityToken missing', async () => {
    const res = await post({ nonce: 'abc' });
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ errorCode: 'INVALID_INPUT' });
  });

  it('returns 400 when nonce missing', async () => {
    const res = await post({ identityToken: 'jwt.token.here' });
    expect(res.status).toBe(400);
  });

  it('returns 401 when jwt.verify throws (signature invalid)', async () => {
    jwtDecode.mockReturnValueOnce({ header: { kid: 'kid1' } });
    jwtVerify.mockImplementationOnce(() => {
      throw new Error('invalid signature');
    });
    const res = await post({ identityToken: 'jwt.token.here', nonce: 'raw-nonce' });
    expect(res.status).toBe(401);
    expect(await res.json()).toMatchObject({ errorCode: 'TOKEN_INVALID' });
  });

  it('returns 401 on nonce mismatch', async () => {
    jwtDecode.mockReturnValueOnce({ header: { kid: 'kid1' } });
    // payload nonce is some non-matching hash
    jwtVerify.mockReturnValueOnce({
      iss: 'https://appleid.apple.com',
      aud: 'com.hangel.ios.app',
      exp: Math.floor(Date.now() / 1000) + 600,
      iat: Math.floor(Date.now() / 1000),
      sub: 'apple-sub-abc',
      nonce: 'mismatch-hash',
    });
    const res = await post({ identityToken: 'jwt.token.here', nonce: 'real-raw-nonce' });
    expect(res.status).toBe(401);
  });

  it('creates new Firebase user when getUser fails (new user happy path)', async () => {
    const crypto = await import('crypto');
    const rawNonce = 'raw-nonce-test';
    const expectedHash = crypto.createHash('sha256').update(rawNonce).digest('hex');

    jwtDecode.mockReturnValueOnce({ header: { kid: 'kid1' } });
    jwtVerify.mockReturnValueOnce({
      iss: 'https://appleid.apple.com',
      aud: 'com.hangel.ios.app',
      exp: Math.floor(Date.now() / 1000) + 600,
      iat: Math.floor(Date.now() / 1000),
      sub: 'apple-sub-fresh-user-123',
      nonce: expectedHash,
      email: 'fresh@privaterelay.appleid.com',
      email_verified: true,
    });
    getUser.mockRejectedValueOnce(new Error('user not found'));
    createUser.mockResolvedValueOnce({});

    const res = await post({
      identityToken: 'jwt.token.here',
      nonce: rawNonce,
      fullName: { givenName: 'Fresh', familyName: 'User' },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ ok: true, isNewUser: true, customToken: 'apple-custom-token' });
    expect(createUser).toHaveBeenCalled();
    expect(userDocSet).toHaveBeenCalled();
  });

  it('returns existing user with customToken when getUser succeeds (returning user)', async () => {
    const crypto = await import('crypto');
    const rawNonce = 'returning-nonce';
    const expectedHash = crypto.createHash('sha256').update(rawNonce).digest('hex');

    jwtDecode.mockReturnValueOnce({ header: { kid: 'kid1' } });
    jwtVerify.mockReturnValueOnce({
      iss: 'https://appleid.apple.com',
      aud: 'com.hangel.ios.app',
      exp: Math.floor(Date.now() / 1000) + 600,
      iat: Math.floor(Date.now() / 1000),
      sub: 'apple-sub-existing-456',
      nonce: expectedHash,
    });
    getUser.mockResolvedValueOnce({ uid: 'apple_apple-sub-existing-456' });

    const res = await post({ identityToken: 'jwt.token.here', nonce: rawNonce });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ ok: true, isNewUser: false });
    expect(createUser).not.toHaveBeenCalled();
  });
});
