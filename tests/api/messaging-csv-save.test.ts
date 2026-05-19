/**
 * P2-1c: POST /api/messaging/csv/save — super-admin CSV save with dedup + normalize.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { requireSuperAdmin, docSet } = vi.hoisted(() => ({
  requireSuperAdmin: vi.fn(),
  docSet: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/messaging/server-auth', () => ({ requireSuperAdmin }));
vi.mock('@/lib/firebase-admin', () => ({
  getAdminFirestore: () => ({ collection: () => ({ doc: () => ({ id: 'csv1', set: docSet }) }) }),
}));
vi.mock('firebase-admin/firestore', () => ({ FieldValue: { serverTimestamp: () => 'TS' } }));

describe('POST /api/messaging/csv/save', () => {
  beforeEach(() => {
    vi.resetModules();
    requireSuperAdmin.mockReset(); docSet.mockClear();
  });
  const okAuth = { actor: { uid: 'u1', email: 'e@x', isSuperAdmin: true } };

  async function post(body: unknown) {
    const mod = await import('@/app/api/messaging/csv/save/route');
    return mod.POST(new Request('https://x/c', { method: 'POST', body: JSON.stringify(body) }));
  }

  it('returns 403 when not super-admin', async () => {
    const { NextResponse } = await import('next/server');
    requireSuperAdmin.mockResolvedValue({ error: NextResponse.json({ error: 'forbidden' }, { status: 403 }) });
    const res = await post({ name: 'X', content: 'a,b\n1,2', channel: 'sms', addressColumn: 'a' });
    expect(res.status).toBe(403);
  });

  it('returns 400 when required fields missing', async () => {
    requireSuperAdmin.mockResolvedValue(okAuth);
    const res = await post({ name: '', content: '', channel: 'sms', addressColumn: '' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when addressColumn not in CSV', async () => {
    requireSuperAdmin.mockResolvedValue(okAuth);
    const res = await post({ name: 'X', content: 'a,b\n1,2', channel: 'sms', addressColumn: 'missing' });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'addressColumn CSV içinde yok' });
  });

  it('returns 200 with rowCount for valid email CSV (dedup applied)', async () => {
    requireSuperAdmin.mockResolvedValue(okAuth);
    const content = 'mail,name\nfoo@example.com,Ali\nFOO@example.com,Veli\nbar@example.com,Eli';
    const res = await post({ name: 'L', content, channel: 'email', addressColumn: 'mail', varsMapping: { ad: 'name' } });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.rowCount).toBe(2);
    expect(docSet).toHaveBeenCalledOnce();
  });

  it('returns 400 when all rows invalid', async () => {
    requireSuperAdmin.mockResolvedValue(okAuth);
    const res = await post({ name: 'L', content: 'mail\nnotanemail\n!!!', channel: 'email', addressColumn: 'mail' });
    expect(res.status).toBe(400);
    expect(docSet).not.toHaveBeenCalled();
  });
});
