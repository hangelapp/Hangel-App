/**
 * P2-1b: POST /api/ngo-admin/messaging/wallet/topup — payment intent creation.
 *
 * Mock pattern: auth + payment provider + firestore (paket fetch + paymentOrders.set).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { requireNgoAdmin, createPaymentIntent, pkgGet, orderSet, logAudit } = vi.hoisted(() => ({
  requireNgoAdmin: vi.fn(),
  createPaymentIntent: vi.fn(),
  pkgGet: vi.fn(),
  orderSet: vi.fn().mockResolvedValue(undefined),
  logAudit: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/messaging/server-auth', () => ({ requireNgoAdmin }));
vi.mock('@/lib/payment', () => ({
  getPaymentProvider: () => ({ driver: 'nkolay', createPaymentIntent }),
}));
vi.mock('@/lib/messaging/audit', () => ({
  logAudit, actorFromRequest: () => ({ context: {} }),
}));
vi.mock('@/lib/firebase-admin', () => ({
  getAdminFirestore: () => ({
    collection: (name: string) => name === 'messagingPackages'
      ? { doc: () => ({ get: pkgGet }) }
      : { doc: () => ({ set: orderSet }) },
  }),
}));
vi.mock('firebase-admin/firestore', () => ({ FieldValue: { serverTimestamp: () => 'TS' } }));

describe('POST /api/ngo-admin/messaging/wallet/topup', () => {
  beforeEach(() => {
    vi.resetModules();
    requireNgoAdmin.mockReset(); createPaymentIntent.mockReset();
    pkgGet.mockReset(); orderSet.mockClear();
  });
  const okAuth = { actor: { uid: 'u1', email: 'e@x', ngoId: 'n1', isSuperAdmin: false } };

  async function post(body: unknown) {
    const mod = await import('@/app/api/ngo-admin/messaging/wallet/topup/route');
    return mod.POST(new Request('https://x/t', { method: 'POST', body: JSON.stringify(body) }));
  }

  it('returns 401 when auth fails', async () => {
    const { NextResponse } = await import('next/server');
    requireNgoAdmin.mockResolvedValue({ error: NextResponse.json({ error: 'Token gerekli' }, { status: 401 }) });
    const res = await post({ packageId: 'p1', amount: 100 });
    expect(res.status).toBe(401);
  });

  it('returns 400 when packageId or amount invalid', async () => {
    requireNgoAdmin.mockResolvedValue(okAuth);
    const res = await post({ packageId: '', amount: 0 });
    expect(res.status).toBe(400);
  });

  it('returns 404 when paket bulunamadı', async () => {
    requireNgoAdmin.mockResolvedValue(okAuth);
    pkgGet.mockResolvedValue({ exists: false });
    const res = await post({ packageId: 'p1', amount: 100 });
    expect(res.status).toBe(404);
  });

  it('returns 400 when client amount mismatches package price', async () => {
    requireNgoAdmin.mockResolvedValue(okAuth);
    pkgGet.mockResolvedValue({ exists: true, data: () => ({ name: 'P', amount: 100, active: true }) });
    const res = await post({ packageId: 'p1', amount: 50 });
    expect(res.status).toBe(400);
    expect(createPaymentIntent).not.toHaveBeenCalled();
  });

  it('returns 200 with orderId+redirectUrl on happy path', async () => {
    requireNgoAdmin.mockResolvedValue(okAuth);
    pkgGet.mockResolvedValue({ exists: true, data: () => ({ name: 'P', amount: 100, active: true }) });
    createPaymentIntent.mockResolvedValue({ orderId: 'o9', redirectUrl: 'https://pay/x', providerOrderId: 'po9' });
    const res = await post({ packageId: 'p1', amount: 100 });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ orderId: 'o9', redirectUrl: 'https://pay/x' });
    expect(orderSet).toHaveBeenCalledOnce();
  });
});
