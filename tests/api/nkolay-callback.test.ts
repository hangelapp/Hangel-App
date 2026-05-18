/**
 * P2-1: /api/messaging/payment/nkolay/callback — verify, amount, idempotency.
 *
 * Mock pattern: replace `@/lib/payment.getPaymentProvider` to return a stub with
 * a controllable `verifyCallback`. Replace `@/lib/messaging/wallet.topup`,
 * `@/lib/invoice/stub.createInvoiceStub`, pricing, audit, firestore.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  verifyCallback, topup, createInvoiceStub, logAudit, orderGet, orderUpdate,
} = vi.hoisted(() => ({
  verifyCallback: vi.fn(),
  topup: vi.fn().mockResolvedValue(undefined),
  createInvoiceStub: vi.fn().mockResolvedValue('inv_1'),
  logAudit: vi.fn().mockResolvedValue(undefined),
  orderGet: vi.fn(),
  orderUpdate: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/payment', () => ({
  getPaymentProvider: () => ({ verifyCallback }),
}));
vi.mock('@/lib/messaging/wallet', () => ({ topup }));
vi.mock('@/lib/invoice/stub', () => ({ createInvoiceStub }));
vi.mock('@/lib/messaging/pricing', () => ({ getPricing: async () => ({ kdvRate: 0.2 }) }));
vi.mock('@/lib/messaging/audit', () => ({ logAudit, actorFromRequest: () => ({ context: {} }) }));
vi.mock('@/lib/firebase-admin', () => ({
  getAdminFirestore: () => ({
    collection: () => ({ doc: () => ({ get: orderGet, update: orderUpdate }) }),
  }),
}));
vi.mock('firebase-admin/firestore', () => ({
  FieldValue: { serverTimestamp: () => 'TS' },
}));

describe('POST /api/messaging/payment/nkolay/callback', () => {
  beforeEach(() => {
    vi.resetModules();
    verifyCallback.mockReset(); topup.mockClear();
    orderGet.mockReset(); orderUpdate.mockClear();
  });

  async function post() {
    const mod = await import('@/app/api/messaging/payment/nkolay/callback/route');
    return mod.POST(new Request('https://x/cb', { method: 'POST' }));
  }

  it('returns 400 when verify returns no orderId (invalid signature path)', async () => {
    verifyCallback.mockResolvedValue({ orderId: null, status: 'failed', raw: {} });
    const res = await post();
    expect(res.status).toBe(400);
  });

  it('returns 400 on amount mismatch', async () => {
    verifyCallback.mockResolvedValue({ orderId: 'o1', status: 'success', paidAmount: 50, raw: {} });
    orderGet.mockResolvedValue({ exists: true, data: () => ({ ngoId: 'n1', amount: 100, packageId: 'p', status: 'pending' }) });
    const res = await post();
    expect(res.status).toBe(400);
    expect(topup).not.toHaveBeenCalled();
  });

  it('returns 200 idempotently when order already paid (no double credit)', async () => {
    verifyCallback.mockResolvedValue({ orderId: 'o2', status: 'success', paidAmount: 100, raw: {} });
    orderGet.mockResolvedValue({ exists: true, data: () => ({ ngoId: 'n1', amount: 100, packageId: 'p', status: 'paid' }) });
    const res = await post();
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ alreadyProcessed: true });
    expect(topup).not.toHaveBeenCalled();
  });

  it('returns 200 + credits wallet on successful first-time payment', async () => {
    verifyCallback.mockResolvedValue({ orderId: 'o3', status: 'success', paidAmount: 120, raw: {} });
    orderGet.mockResolvedValue({ exists: true, data: () => ({ ngoId: 'n2', amount: 120, packageId: 'pkg', status: 'pending' }) });
    const res = await post();
    expect(res.status).toBe(200);
    expect(topup).toHaveBeenCalledWith(expect.objectContaining({ ngoId: 'n2', amount: 120 }));
  });
});
