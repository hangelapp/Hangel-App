/**
 * P2-1b: POST /api/messaging/enqueue — messaging key + campaignId validation.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { enqueueCampaign } = vi.hoisted(() => ({ enqueueCampaign: vi.fn() }));

vi.mock('@/lib/messaging/queue/enqueue', () => ({ enqueueCampaign }));

describe('POST /api/messaging/enqueue', () => {
  beforeEach(() => {
    vi.resetModules();
    enqueueCampaign.mockReset();
    process.env.MESSAGING_WORKER_KEY = 'k1';
  });

  async function post(body: unknown, headers: Record<string, string> = { 'x-messaging-key': 'k1' }) {
    const mod = await import('@/app/api/messaging/enqueue/route');
    return mod.POST(new Request('https://x/q', {
      method: 'POST', headers, body: typeof body === 'string' ? body : JSON.stringify(body),
    }));
  }

  it('returns 401 when x-messaging-key header mismatches', async () => {
    const res = await post({ campaignId: 'c1' }, { 'x-messaging-key': 'bad' });
    expect(res.status).toBe(401);
    expect(enqueueCampaign).not.toHaveBeenCalled();
  });

  it('returns 400 on invalid JSON body', async () => {
    const res = await post('not-json{');
    expect(res.status).toBe(400);
  });

  it('returns 400 when campaignId missing', async () => {
    const res = await post({});
    expect(res.status).toBe(400);
    expect(enqueueCampaign).not.toHaveBeenCalled();
  });

  it('returns 200 with enqueue result when campaignId valid', async () => {
    enqueueCampaign.mockResolvedValue({ status: 'queued', queued: 42 });
    const res = await post({ campaignId: 'c1' });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'queued', queued: 42 });
    expect(enqueueCampaign).toHaveBeenCalledWith('c1');
  });

  it('returns 500 when enqueueCampaign throws', async () => {
    enqueueCampaign.mockRejectedValue(new Error('db error'));
    const res = await post({ campaignId: 'c1' });
    expect(res.status).toBe(500);
  });
});
