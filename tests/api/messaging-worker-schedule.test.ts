/**
 * P2-1c: POST /api/messaging/worker/schedule — worker-key + promoteScheduledCampaigns.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { promoteScheduledCampaigns } = vi.hoisted(() => ({ promoteScheduledCampaigns: vi.fn() }));

vi.mock('@/lib/messaging/queue/schedule', () => ({ promoteScheduledCampaigns }));

describe('POST /api/messaging/worker/schedule', () => {
  beforeEach(() => {
    vi.resetModules();
    promoteScheduledCampaigns.mockReset();
    process.env.MESSAGING_WORKER_KEY = 'k1';
  });

  async function post(headers: Record<string, string> = { 'x-messaging-key': 'k1' }) {
    const mod = await import('@/app/api/messaging/worker/schedule/route');
    return mod.POST(new Request('https://x/s', { method: 'POST', headers }));
  }

  it('returns 401 when worker key mismatches', async () => {
    const res = await post({ 'x-messaging-key': 'bad' });
    expect(res.status).toBe(401);
    expect(promoteScheduledCampaigns).not.toHaveBeenCalled();
  });

  it('returns 200 with promotion result on happy path', async () => {
    promoteScheduledCampaigns.mockResolvedValue({ promoted: 3 });
    const res = await post();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ promoted: 3 });
  });

  it('returns 500 when promotion throws', async () => {
    promoteScheduledCampaigns.mockRejectedValue(new Error('schedule scan failed'));
    const res = await post();
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ errorCode: 'INTERNAL_ERROR', error: 'Internal server error' });
  });
});
