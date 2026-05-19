/**
 * P2-1c: GET/POST /api/admin/messaging/ngo-wallets — list + manual topup/adjust.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { requireSuperAdmin, walletsGet, topup, adminAdjust, logAudit } = vi.hoisted(() => ({
  requireSuperAdmin: vi.fn(),
  walletsGet: vi.fn(),
  topup: vi.fn(),
  adminAdjust: vi.fn(),
  logAudit: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/messaging/server-auth', () => ({ requireSuperAdmin }));
vi.mock('@/lib/messaging/wallet', () => ({ topup, adminAdjust }));
vi.mock('@/lib/messaging/audit', () => ({ logAudit, actorFromRequest: () => ({ context: {} }) }));
vi.mock('@/lib/firebase-admin', () => ({
  getAdminFirestore: () => ({ collection: () => ({ get: walletsGet }) }),
}));

describe('/api/admin/messaging/ngo-wallets', () => {
  beforeEach(() => {
    vi.resetModules();
    requireSuperAdmin.mockReset(); walletsGet.mockReset();
    topup.mockReset(); adminAdjust.mockReset(); logAudit.mockClear();
  });
  const okAuth = { actor: { uid: 'u1', email: 'e@x', isSuperAdmin: true } };

  it('GET returns 200 with wallet list', async () => {
    requireSuperAdmin.mockResolvedValue(okAuth);
    walletsGet.mockResolvedValue({ docs: [{ id: 'n1', data: () => ({ balance: 100 }) }] });
    const mod = await import('@/app/api/admin/messaging/ngo-wallets/route');
    const res = await mod.GET(new Request('https://x/w'));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ wallets: [{ id: 'n1', balance: 100 }] });
  });

  it('POST returns 400 when ngoId/action/amount missing', async () => {
    requireSuperAdmin.mockResolvedValue(okAuth);
    const mod = await import('@/app/api/admin/messaging/ngo-wallets/route');
    const res = await mod.POST(new Request('https://x/w', { method: 'POST', body: JSON.stringify({ ngoId: 'n1' }) }));
    expect(res.status).toBe(400);
  });

  it('POST topup calls topup() and returns result', async () => {
    requireSuperAdmin.mockResolvedValue(okAuth);
    topup.mockResolvedValue({ ok: true, balance: 200 });
    const mod = await import('@/app/api/admin/messaging/ngo-wallets/route');
    const res = await mod.POST(new Request('https://x/w', { method: 'POST', body: JSON.stringify({ ngoId: 'n1', action: 'topup', amount: 100 }) }));
    expect(res.status).toBe(200);
    expect(topup).toHaveBeenCalledOnce();
    expect(adminAdjust).not.toHaveBeenCalled();
  });

  it('POST adjust calls adminAdjust()', async () => {
    requireSuperAdmin.mockResolvedValue(okAuth);
    adminAdjust.mockResolvedValue({ ok: true, balance: 50 });
    const mod = await import('@/app/api/admin/messaging/ngo-wallets/route');
    const res = await mod.POST(new Request('https://x/w', { method: 'POST', body: JSON.stringify({ ngoId: 'n1', action: 'adjust', amount: -50 }) }));
    expect(res.status).toBe(200);
    expect(adminAdjust).toHaveBeenCalledOnce();
  });

  it('POST returns 500 when wallet service throws', async () => {
    requireSuperAdmin.mockResolvedValue(okAuth);
    topup.mockRejectedValue(new Error('insufficient'));
    const mod = await import('@/app/api/admin/messaging/ngo-wallets/route');
    const res = await mod.POST(new Request('https://x/w', { method: 'POST', body: JSON.stringify({ ngoId: 'n1', action: 'topup', amount: 100 }) }));
    expect(res.status).toBe(500);
  });
});
