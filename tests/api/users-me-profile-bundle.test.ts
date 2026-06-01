/**
 * GET /api/users/me/profile-bundle — covers:
 *  - No bearer → 401
 *  - Invalid bearer → 401
 *  - User doc missing → 404
 *  - Happy path: returns assembled bundle with user/badges/ngos/etc.
 *  - Empty supportedNgos/etc. returns empty arrays (fetchByIds skip)
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  verifyIdToken,
  userSnap,
  badgesSnap,
  certsSnap,
  pastVolSnap,
  appsSnap,
  ngosWhere,
  brandsWhere,
  clubsWhere,
} = vi.hoisted(() => ({
  verifyIdToken: vi.fn(),
  userSnap: { exists: true, data: () => ({}) } as { exists: boolean; data: () => unknown },
  badgesSnap: { docs: [] as Array<{ id: string; data: () => unknown }> },
  certsSnap: { docs: [] as Array<{ id: string; data: () => unknown }> },
  pastVolSnap: { docs: [] as Array<{ id: string; data: () => unknown }> },
  appsSnap: { docs: [] as Array<{ id: string; data: () => unknown }> },
  ngosWhere: vi.fn(),
  brandsWhere: vi.fn(),
  clubsWhere: vi.fn(),
}));

vi.mock('@/lib/firebase-admin', () => ({
  getAdminAuth: () => ({ verifyIdToken }),
  getAdminFirestore: () => ({
    collection: (name: string) => {
      if (name === 'users') {
        return {
          doc: () => ({
            get: vi.fn().mockResolvedValue(userSnap),
            collection: (subName: string) => ({
              get: vi.fn().mockResolvedValue(
                subName === 'badges' ? badgesSnap :
                subName === 'certificates' ? certsSnap :
                subName === 'pastVolunteering' ? pastVolSnap : { docs: [] }
              ),
            }),
          }),
        };
      }
      if (name === 'ngos') {
        return {
          where: () => ({ get: vi.fn().mockResolvedValue({ docs: ngosWhere() || [] }) }),
        };
      }
      if (name === 'brands') {
        return {
          where: () => ({ get: vi.fn().mockResolvedValue({ docs: brandsWhere() || [] }) }),
        };
      }
      if (name === 'clubs') {
        return {
          where: () => ({ get: vi.fn().mockResolvedValue({ docs: clubsWhere() || [] }) }),
        };
      }
      if (name === 'applications') {
        return {
          where: () => ({
            where: () => ({
              where: () => ({ get: vi.fn().mockResolvedValue(appsSnap) }),
            }),
          }),
        };
      }
      return { doc: () => ({ get: vi.fn().mockResolvedValue({ exists: false }) }) };
    },
  }),
}));

import { makeNextRequest } from './_setup';

describe('GET /api/users/me/profile-bundle', () => {
  beforeEach(() => {
    vi.resetModules();
    verifyIdToken.mockReset();
    userSnap.exists = true;
    userSnap.data = () => ({});
    badgesSnap.docs = [];
    certsSnap.docs = [];
    pastVolSnap.docs = [];
    appsSnap.docs = [];
    ngosWhere.mockReset().mockReturnValue([]);
    brandsWhere.mockReset().mockReturnValue([]);
    clubsWhere.mockReset().mockReturnValue([]);
  });

  async function get(headers: Record<string, string> = {}) {
    const mod = await import('@/app/api/users/me/profile-bundle/route');
    const req = await makeNextRequest('https://x/api/users/me/profile-bundle', {
      method: 'GET',
      headers,
    });
    return mod.GET(req as never);
  }

  it('returns 401 when Authorization header missing', async () => {
    const res = await get();
    expect(res.status).toBe(401);
    expect(await res.json()).toMatchObject({ errorCode: 'NO_AUTH' });
  });

  it('returns 401 when bearer token verification fails', async () => {
    verifyIdToken.mockRejectedValueOnce(new Error('invalid token'));
    const res = await get({ authorization: 'Bearer bad' });
    expect(res.status).toBe(401);
    expect(await res.json()).toMatchObject({ errorCode: 'INVALID_TOKEN' });
  });

  it('returns 404 when user doc does not exist', async () => {
    verifyIdToken.mockResolvedValueOnce({ uid: 'ghost' });
    userSnap.exists = false;
    userSnap.data = () => ({});
    const res = await get({ authorization: 'Bearer ok' });
    expect(res.status).toBe(404);
    expect(await res.json()).toMatchObject({ errorCode: 'USER_NOT_FOUND' });
  });

  it('returns 200 with bundle on happy path (no ref ids → empty arrays)', async () => {
    verifyIdToken.mockResolvedValueOnce({ uid: 'u1' });
    userSnap.exists = true;
    userSnap.data = () => ({ name: 'Alice', supportedNgos: [], volunteerNgos: [], followedBrands: [], joinedClubs: [] });
    badgesSnap.docs = [{ id: 'b1', data: () => ({ label: 'Pioneer' }) }];
    certsSnap.docs = [{ id: 'c1', data: () => ({ title: 'First Aid' }) }];
    const res = await get({ authorization: 'Bearer ok' });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.bundle.user).toMatchObject({ id: 'u1', name: 'Alice' });
    expect(body.bundle.badges).toHaveLength(1);
    expect(body.bundle.certificates).toHaveLength(1);
    expect(body.bundle.supportedNgos).toHaveLength(0);
    expect(body.bundle.followedBrands).toHaveLength(0);
  });

  it('returns bundle with supportedNgos when user has refs', async () => {
    verifyIdToken.mockResolvedValueOnce({ uid: 'u1' });
    userSnap.exists = true;
    userSnap.data = () => ({ name: 'Alice', supportedNgos: ['ngo-1'], followedBrands: [], joinedClubs: [], volunteerNgos: [] });
    ngosWhere.mockReturnValueOnce([
      { id: 'ngo-1', data: () => ({ name: 'STK Bir', logoUrl: 'logo.png' }) },
    ]);
    const res = await get({ authorization: 'Bearer ok' });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.bundle.supportedNgos).toHaveLength(1);
    expect(body.bundle.supportedNgos[0]).toMatchObject({ id: 'ngo-1', name: 'STK Bir' });
  });
});
