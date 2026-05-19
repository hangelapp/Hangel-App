/**
 * P2-1c: GET/POST /api/admin/messaging/ngo-senders — list + approve/reject.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { requireSuperAdmin, cgGet, senderUpdate, logAudit } = vi.hoisted(() => ({
  requireSuperAdmin: vi.fn(),
  cgGet: vi.fn(),
  senderUpdate: vi.fn().mockResolvedValue(undefined),
  logAudit: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/messaging/server-auth', () => ({ requireSuperAdmin }));
vi.mock('@/lib/messaging/audit', () => ({ logAudit }));
vi.mock('@/lib/firebase-admin', () => ({
  getAdminFirestore: () => ({
    collectionGroup: () => ({ get: cgGet }),
    collection: () => ({ doc: () => ({ collection: () => ({ doc: () => ({ update: senderUpdate }) }) }) }),
  }),
}));
vi.mock('firebase-admin/firestore', () => ({ FieldValue: { serverTimestamp: () => 'TS' } }));

describe('/api/admin/messaging/ngo-senders', () => {
  beforeEach(() => {
    vi.resetModules();
    requireSuperAdmin.mockReset(); cgGet.mockReset();
    senderUpdate.mockClear(); logAudit.mockClear();
  });
  const okAuth = { actor: { uid: 'u1', email: 'e@x', isSuperAdmin: true } };

  it('GET returns flattened senders with ngoId', async () => {
    requireSuperAdmin.mockResolvedValue(okAuth);
    cgGet.mockResolvedValue({
      docs: [{ id: 's1', data: () => ({ label: 'X' }), ref: { parent: { parent: { id: 'n1' } } } }],
    });
    const mod = await import('@/app/api/admin/messaging/ngo-senders/route');
    const res = await mod.GET(new Request('https://x/s'));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ senders: [{ id: 's1', ngoId: 'n1', label: 'X' }] });
  });

  it('POST returns 400 when required fields missing', async () => {
    requireSuperAdmin.mockResolvedValue(okAuth);
    const mod = await import('@/app/api/admin/messaging/ngo-senders/route');
    const res = await mod.POST(new Request('https://x/s', { method: 'POST', body: JSON.stringify({ ngoId: 'n1' }) }));
    expect(res.status).toBe(400);
    expect(senderUpdate).not.toHaveBeenCalled();
  });

  it('POST approve updates sender status', async () => {
    requireSuperAdmin.mockResolvedValue(okAuth);
    const mod = await import('@/app/api/admin/messaging/ngo-senders/route');
    const res = await mod.POST(new Request('https://x/s', { method: 'POST', body: JSON.stringify({ ngoId: 'n1', senderId: 's1', action: 'approve' }) }));
    expect(res.status).toBe(200);
    expect(senderUpdate).toHaveBeenCalledWith(expect.objectContaining({ status: 'approved' }));
  });

  it('POST reject updates with rejected status', async () => {
    requireSuperAdmin.mockResolvedValue(okAuth);
    const mod = await import('@/app/api/admin/messaging/ngo-senders/route');
    const res = await mod.POST(new Request('https://x/s', { method: 'POST', body: JSON.stringify({ ngoId: 'n1', senderId: 's1', action: 'reject', notes: 'spam' }) }));
    expect(res.status).toBe(200);
    expect(senderUpdate).toHaveBeenCalledWith(expect.objectContaining({ status: 'rejected', notes: 'spam' }));
  });
});
