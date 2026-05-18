/**
 * P2-1: POST /api/admin/import-data — admin key + rate limit + JSON validation.
 *
 * Mock pattern: `@/lib/firebase-admin` returns a fake Firestore where `collection().add()`
 * is a spyable vi.fn. `firebase-admin/firestore` mocked for FieldValue.serverTimestamp.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { addMock } = vi.hoisted(() => ({
  addMock: vi.fn().mockResolvedValue({ id: 'newdoc' }),
}));

vi.mock('@/lib/firebase-admin', () => ({
  getAdminFirestore: () => ({ collection: () => ({ add: addMock }) }),
}));

vi.mock('firebase-admin/firestore', () => ({
  FieldValue: { serverTimestamp: () => 'TS' },
}));

import { makeNextRequest } from './_setup';

describe('POST /api/admin/import-data', () => {
  beforeEach(() => {
    vi.resetModules();
    addMock.mockClear();
    process.env.ADMIN_IMPORT_KEY = 'secret123';
  });

  async function post(opts: { key?: string; body?: string; ip?: string }) {
    const mod = await import('@/app/api/admin/import-data/route');
    const headers: Record<string, string> = {
      'content-type': 'application/json',
      'x-forwarded-for': opts.ip ?? '7.7.7.1',
    };
    if (opts.key !== undefined) headers['x-admin-key'] = opts.key;
    const req = await makeNextRequest('https://x/api/admin/import-data', {
      method: 'POST',
      headers,
      body: opts.body ?? '{}',
    });
    return mod.POST(req as never);
  }

  it('returns 401 when x-admin-key missing', async () => {
    const res = await post({ ip: '7.7.7.2' });
    expect(res.status).toBe(401);
    expect(await res.json()).toMatchObject({ errorCode: 'unauthorized' });
  });

  it('returns 401 when x-admin-key wrong', async () => {
    const res = await post({ key: 'wrong', ip: '7.7.7.3' });
    expect(res.status).toBe(401);
  });

  it('returns 400 on invalid JSON', async () => {
    const res = await post({ key: 'secret123', body: 'not-json{', ip: '7.7.7.4' });
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ errorCode: 'invalid_json' });
  });

  it('returns 200 on valid payload + writes records', async () => {
    const body = JSON.stringify({ dataType: 'ngo', records: [{ name: 'A' }, { name: 'B' }] });
    const res = await post({ key: 'secret123', body, ip: '7.7.7.5' });
    expect(res.status).toBe(200);
    expect(addMock).toHaveBeenCalledTimes(2);
  });

  it('returns 429 after exceeding rate limit (>10 in window)', async () => {
    for (let i = 0; i < 10; i++) await post({ key: 'secret123', body: '{}', ip: '7.7.7.99' });
    const res = await post({ key: 'secret123', body: '{}', ip: '7.7.7.99' });
    expect(res.status).toBe(429);
  });
});
