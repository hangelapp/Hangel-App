/**
 * P2-1: POST /api/ngo-admin/messaging/campaigns — auth + wallet pre-flight.
 *
 * Mock pattern: stub requireNgoAdmin, resolveRecipients, pricing, walletReserve.
 * Firestore unused on early-exit paths; full happy path is heavy and tracked under P2-1b.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

class InsufficientBalanceError extends Error {
  balance: number; required: number;
  constructor(balance: number, required: number) {
    super('insufficient'); this.balance = balance; this.required = required;
  }
}

const {
  requireNgoAdmin, resolveRecipients, computeCampaignCost, walletReserve,
} = vi.hoisted(() => ({
  requireNgoAdmin: vi.fn(),
  resolveRecipients: vi.fn(),
  computeCampaignCost: vi.fn(),
  walletReserve: vi.fn(),
}));

vi.mock('@/lib/messaging/server-auth', () => ({ requireNgoAdmin }));
vi.mock('@/lib/messaging/resolver', () => ({ resolveRecipients }));
vi.mock('@/lib/messaging/pricing', () => ({ computeCampaignCost }));
vi.mock('@/lib/messaging/wallet', () => ({
  reserve: walletReserve,
  InsufficientBalanceError,
}));
vi.mock('@/lib/messaging/sms-segments', () => ({ segmentInfo: () => ({ segments: 1 }) }));
vi.mock('@/lib/messaging/audit', () => ({
  logAudit: vi.fn(), actorFromRequest: () => ({ context: {} }),
}));
vi.mock('@/lib/messaging/queue/enqueue', () => ({
  enqueueCampaign: vi.fn().mockResolvedValue({ status: 'queued', queued: 1 }),
}));
vi.mock('@/lib/firebase-admin', () => ({
  getAdminFirestore: () => ({
    collection: () => ({
      doc: () => ({
        id: 'camp1', set: vi.fn().mockResolvedValue(undefined),
        update: vi.fn().mockResolvedValue(undefined),
        collection: () => ({ doc: () => ({}) }),
      }),
    }),
    batch: () => ({ set: vi.fn(), commit: vi.fn().mockResolvedValue(undefined) }),
  }),
}));
vi.mock('firebase-admin/firestore', () => ({
  FieldValue: { serverTimestamp: () => 'TS' },
  Timestamp: { fromDate: (d: Date) => ({ seconds: Math.floor(d.getTime() / 1000) }) },
}));

const validBody = {
  name: 'C1', channel: 'sms' as const, useCase: 'transactional' as const,
  body: 'hi', senderId: 's1', spec: {},
};

describe('POST /api/ngo-admin/messaging/campaigns', () => {
  beforeEach(() => {
    vi.resetModules();
    requireNgoAdmin.mockReset(); resolveRecipients.mockReset();
    computeCampaignCost.mockReset(); walletReserve.mockReset();
  });

  async function post(body: unknown = validBody) {
    const mod = await import('@/app/api/ngo-admin/messaging/campaigns/route');
    return mod.POST(new Request('https://x/c', { method: 'POST', body: JSON.stringify(body) }));
  }

  it('returns 401 when no auth token', async () => {
    const { NextResponse } = await import('next/server');
    requireNgoAdmin.mockResolvedValue({ error: NextResponse.json({ error: 'Token gerekli' }, { status: 401 }) });
    const res = await post();
    expect(res.status).toBe(401);
  });

  it('returns 403 when caller is not an NGO admin', async () => {
    const { NextResponse } = await import('next/server');
    requireNgoAdmin.mockResolvedValue({ error: NextResponse.json({ error: 'forbidden' }, { status: 403 }) });
    const res = await post();
    expect(res.status).toBe(403);
  });

  it('returns 402 when wallet balance insufficient', async () => {
    requireNgoAdmin.mockResolvedValue({ actor: { uid: 'u', email: 'e', ngoId: 'n1', isSuperAdmin: false } });
    resolveRecipients.mockResolvedValue({ recipients: [{ userId: 'r1', channelAddress: '+90', vars: {} }], summary: {} });
    computeCampaignCost.mockResolvedValue({ total: 100, freeUnitsUsed: 0 });
    walletReserve.mockRejectedValue(new InsufficientBalanceError(10, 100));
    const res = await post();
    expect(res.status).toBe(402);
    expect(await res.json()).toMatchObject({ error: 'Yetersiz bakiye', balance: 10, required: 100 });
  });

  it.skip('happy path: returns 200 with campaignId + cost reserve [P2-1b emulator]', async () => {
    // TODO(P2-1b): Firestore mock zincirini (campRef.collection('recipients').doc()) tam
    // sahnelemek 30 satırı aşıyor; emülatörlü integration test'e taşı.
  });
});
