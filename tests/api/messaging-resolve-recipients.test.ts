/**
 * P2-1b: POST /api/messaging/resolve-recipients — super-admin gated; segment expansion.
 *
 * Mock pattern: stub requireSuperAdmin + resolveRecipients; route only forwards body.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { requireSuperAdmin, resolveRecipients } = vi.hoisted(() => ({
  requireSuperAdmin: vi.fn(),
  resolveRecipients: vi.fn(),
}));

vi.mock('@/lib/messaging/server-auth', () => ({ requireSuperAdmin }));
vi.mock('@/lib/messaging/resolver', () => ({ resolveRecipients }));

describe('POST /api/messaging/resolve-recipients', () => {
  beforeEach(() => {
    vi.resetModules();
    requireSuperAdmin.mockReset(); resolveRecipients.mockReset();
  });

  async function post(body: unknown) {
    const mod = await import('@/app/api/messaging/resolve-recipients/route');
    return mod.POST(new Request('https://x/r', { method: 'POST', body: JSON.stringify(body) }));
  }

  it('returns 401 when not authenticated', async () => {
    const { NextResponse } = await import('next/server');
    requireSuperAdmin.mockResolvedValue({ error: NextResponse.json({ error: 'Token gerekli' }, { status: 401 }) });
    const res = await post({ channel: 'sms', useCase: 'transactional' });
    expect(res.status).toBe(401);
    expect(resolveRecipients).not.toHaveBeenCalled();
  });

  it('returns 400 when channel/useCase missing', async () => {
    requireSuperAdmin.mockResolvedValue({ actor: { uid: 'u', email: 'e' } });
    const res = await post({});
    expect(res.status).toBe(400);
  });

  it('returns 200 with summary+sample on happy path', async () => {
    requireSuperAdmin.mockResolvedValue({ actor: { uid: 'u', email: 'e' } });
    resolveRecipients.mockResolvedValue({
      summary: { total: 3, segments: 1 },
      sample: [{ userId: 'r1' }],
      recipients: [{ userId: 'r1' }, { userId: 'r2' }, { userId: 'r3' }],
    });
    const res = await post({ channel: 'sms', useCase: 'transactional' });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ summary: { total: 3, segments: 1 }, sample: [{ userId: 'r1' }] });
  });

  it('returns 500 when resolver throws', async () => {
    requireSuperAdmin.mockResolvedValue({ actor: { uid: 'u', email: 'e' } });
    resolveRecipients.mockRejectedValue(new Error('boom'));
    const res = await post({ channel: 'sms', useCase: 'transactional' });
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ errorCode: 'INTERNAL_ERROR', error: 'Internal server error' });
  });
});
