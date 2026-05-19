/**
 * P2-1c: POST /api/messaging/worker/reclaim — worker-key auth + reclaimExpiredLeases.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { reclaimExpiredLeases } = vi.hoisted(() => ({ reclaimExpiredLeases: vi.fn() }));

vi.mock('@/lib/messaging/queue/reclaim', () => ({ reclaimExpiredLeases }));

describe('POST /api/messaging/worker/reclaim', () => {
  beforeEach(() => {
    vi.resetModules();
    reclaimExpiredLeases.mockReset();
    process.env.MESSAGING_WORKER_KEY = 'k1';
  });

  async function post(headers: Record<string, string> = { 'x-messaging-key': 'k1' }) {
    const mod = await import('@/app/api/messaging/worker/reclaim/route');
    return mod.POST(new Request('https://x/r', { method: 'POST', headers }));
  }

  it('returns 401 when worker key mismatches', async () => {
    const res = await post({ 'x-messaging-key': 'bad' });
    expect(res.status).toBe(401);
    expect(reclaimExpiredLeases).not.toHaveBeenCalled();
  });

  it('returns 200 with reclaim result on happy path', async () => {
    reclaimExpiredLeases.mockResolvedValue({ reclaimed: 5 });
    const res = await post();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ reclaimed: 5 });
  });

  it('returns 500 when reclaimExpiredLeases throws', async () => {
    reclaimExpiredLeases.mockRejectedValue(new Error('lease scan failed'));
    const res = await post();
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'lease scan failed' });
  });
});
