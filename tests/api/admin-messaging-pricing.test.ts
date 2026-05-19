/**
 * P2-1c: GET/PUT /api/admin/messaging/pricing — super-admin pricing CRUD.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { requireSuperAdmin, pricingGet, pricingSet, invalidatePricingCache, logAudit } = vi.hoisted(() => ({
  requireSuperAdmin: vi.fn(),
  pricingGet: vi.fn(),
  pricingSet: vi.fn().mockResolvedValue(undefined),
  invalidatePricingCache: vi.fn(),
  logAudit: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/messaging/server-auth', () => ({ requireSuperAdmin }));
vi.mock('@/lib/messaging/pricing', () => ({ invalidatePricingCache }));
vi.mock('@/lib/messaging/audit', () => ({ logAudit }));
vi.mock('@/lib/firebase-admin', () => ({
  getAdminFirestore: () => ({ collection: () => ({ doc: () => ({ get: pricingGet, set: pricingSet }) }) }),
}));
vi.mock('firebase-admin/firestore', () => ({ FieldValue: { serverTimestamp: () => 'TS' } }));

describe('/api/admin/messaging/pricing', () => {
  beforeEach(() => {
    vi.resetModules();
    requireSuperAdmin.mockReset(); pricingGet.mockReset(); pricingSet.mockClear();
    invalidatePricingCache.mockClear(); logAudit.mockClear();
  });
  const okAuth = { actor: { uid: 'u1', email: 'e@x', isSuperAdmin: true } };

  it('GET returns 403 when not super-admin', async () => {
    const { NextResponse } = await import('next/server');
    requireSuperAdmin.mockResolvedValue({ error: NextResponse.json({ error: 'forbidden' }, { status: 403 }) });
    const mod = await import('@/app/api/admin/messaging/pricing/route');
    const res = await mod.GET(new Request('https://x/p'));
    expect(res.status).toBe(403);
  });

  it('GET returns 200 with pricing doc when exists', async () => {
    requireSuperAdmin.mockResolvedValue(okAuth);
    pricingGet.mockResolvedValue({ exists: true, data: () => ({ smsRate: 0.1 }) });
    const mod = await import('@/app/api/admin/messaging/pricing/route');
    const res = await mod.GET(new Request('https://x/p'));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ smsRate: 0.1 });
  });

  it('PUT returns 400 on invalid JSON', async () => {
    requireSuperAdmin.mockResolvedValue(okAuth);
    const mod = await import('@/app/api/admin/messaging/pricing/route');
    const res = await mod.PUT(new Request('https://x/p', { method: 'PUT', body: '{not-json' }));
    expect(res.status).toBe(400);
  });

  it('PUT writes pricing + invalidates cache on happy path', async () => {
    requireSuperAdmin.mockResolvedValue(okAuth);
    const mod = await import('@/app/api/admin/messaging/pricing/route');
    const res = await mod.PUT(new Request('https://x/p', { method: 'PUT', body: JSON.stringify({ smsRate: 0.2 }) }));
    expect(res.status).toBe(200);
    expect(pricingSet).toHaveBeenCalledOnce();
    expect(invalidatePricingCache).toHaveBeenCalledOnce();
    expect(logAudit).toHaveBeenCalledOnce();
  });
});
