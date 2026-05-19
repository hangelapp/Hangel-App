/**
 * P2-1b: GET+POST /api/messaging/unsubscribe — token-based consent revocation.
 *
 * Mock pattern: replace firebase-admin so the userMarketingConsent query returns
 * a controllable doc; logAudit stubbed to no-op.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { queryGet, docUpdate, logAudit } = vi.hoisted(() => ({
  queryGet: vi.fn(),
  docUpdate: vi.fn().mockResolvedValue(undefined),
  logAudit: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/messaging/audit', () => ({ logAudit }));
vi.mock('@/lib/firebase-admin', () => ({
  getAdminFirestore: () => ({
    collection: () => ({
      where: () => ({ limit: () => ({ get: queryGet }) }),
    }),
  }),
}));
vi.mock('firebase-admin/firestore', () => ({
  FieldValue: {
    serverTimestamp: () => 'TS',
    arrayUnion: (v: unknown) => ({ _arrayUnion: v }),
  },
  Timestamp: { now: () => 'NOW' },
}));

function docOf(data: Record<string, unknown>) {
  return {
    id: 'u1',
    data: () => data,
    ref: { update: docUpdate },
  };
}

describe('/api/messaging/unsubscribe', () => {
  beforeEach(() => {
    vi.resetModules();
    queryGet.mockReset(); docUpdate.mockClear(); logAudit.mockClear();
  });

  async function load() { return import('@/app/api/messaging/unsubscribe/route'); }

  it('GET: returns 400 when token missing', async () => {
    const mod = await load();
    const res = await mod.GET(new Request('https://x/u'));
    expect(res.status).toBe(400);
  });

  it('GET: returns 404 when token not found', async () => {
    queryGet.mockResolvedValue({ empty: true, docs: [] });
    const mod = await load();
    const res = await mod.GET(new Request('https://x/u?token=xx'));
    expect(res.status).toBe(404);
  });

  it('GET: returns enabled flags when token found', async () => {
    queryGet.mockResolvedValue({ empty: false, docs: [docOf({ email: { enabled: true }, sms: { enabled: false } })] });
    const mod = await load();
    const res = await mod.GET(new Request('https://x/u?token=t'));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ userId: 'u1', email: { enabled: true }, sms: { enabled: false } });
  });

  it('POST: returns 400 when channel and all are both missing', async () => {
    const mod = await load();
    const res = await mod.POST(new Request('https://x/u', {
      method: 'POST', body: JSON.stringify({ token: 't' }),
    }));
    expect(res.status).toBe(400);
  });

  it('POST: returns ok + updates doc when token+channel valid', async () => {
    queryGet.mockResolvedValue({ empty: false, docs: [docOf({})] });
    const mod = await load();
    const res = await mod.POST(new Request('https://x/u', {
      method: 'POST', body: JSON.stringify({ token: 't', channel: 'email' }),
    }));
    expect(res.status).toBe(200);
    expect(docUpdate).toHaveBeenCalledOnce();
  });
});
