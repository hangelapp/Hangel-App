/**
 * P2-1b: POST /api/messaging/worker/run — internal worker key auth.
 *
 * Mock pattern: server-auth checkMessagingKey + workerTick stub.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { workerTick } = vi.hoisted(() => ({ workerTick: vi.fn() }));

vi.mock('@/lib/messaging/queue/worker', () => ({ workerTick }));

describe('POST /api/messaging/worker/run', () => {
  beforeEach(() => {
    vi.resetModules();
    workerTick.mockReset();
    process.env.MESSAGING_WORKER_KEY = 'secretkey';
  });

  async function post(headers: Record<string, string>, url = 'https://x/run') {
    const mod = await import('@/app/api/messaging/worker/run/route');
    return mod.POST(new Request(url, { method: 'POST', headers }));
  }

  it('returns 500 when MESSAGING_WORKER_KEY env not set', async () => {
    delete process.env.MESSAGING_WORKER_KEY;
    const res = await post({});
    expect(res.status).toBe(500);
    expect(workerTick).not.toHaveBeenCalled();
  });

  it('returns 401 when x-messaging-key header mismatches', async () => {
    const res = await post({ 'x-messaging-key': 'wrong' });
    expect(res.status).toBe(401);
    expect(workerTick).not.toHaveBeenCalled();
  });

  it('passes default batch=50 to workerTick when no query param', async () => {
    workerTick.mockResolvedValue({ processed: 0 });
    const res = await post({ 'x-messaging-key': 'secretkey' });
    expect(res.status).toBe(200);
    expect(workerTick).toHaveBeenCalledWith({ batch: 50 });
  });

  it('uses ?batch=N when valid positive integer', async () => {
    workerTick.mockResolvedValue({ processed: 7 });
    await post({ 'x-messaging-key': 'secretkey' }, 'https://x/run?batch=7');
    expect(workerTick).toHaveBeenCalledWith({ batch: 7 });
  });

  it('returns 500 when workerTick throws', async () => {
    workerTick.mockRejectedValue(new Error('queue down'));
    const res = await post({ 'x-messaging-key': 'secretkey' });
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'queue down' });
  });
});
