/**
 * P2-1c: POST /api/messaging/worker/trust-score — worker-key + recompute per NGO.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { recomputeTrustScore, walletsGet } = vi.hoisted(() => ({
  recomputeTrustScore: vi.fn(),
  walletsGet: vi.fn(),
}));

vi.mock('@/lib/messaging/trust-score', () => ({ recomputeTrustScore }));
vi.mock('@/lib/firebase-admin', () => ({
  getAdminFirestore: () => ({ collection: () => ({ get: walletsGet }) }),
}));

describe('POST /api/messaging/worker/trust-score', () => {
  beforeEach(() => {
    vi.resetModules();
    recomputeTrustScore.mockReset();
    walletsGet.mockReset();
    process.env.MESSAGING_WORKER_KEY = 'k1';
  });

  async function post(headers: Record<string, string> = { 'x-messaging-key': 'k1' }) {
    const mod = await import('@/app/api/messaging/worker/trust-score/route');
    return mod.POST(new Request('https://x/t', { method: 'POST', headers }));
  }

  it('returns 401 when worker key mismatches', async () => {
    const res = await post({ 'x-messaging-key': 'bad' });
    expect(res.status).toBe(401);
    expect(walletsGet).not.toHaveBeenCalled();
  });

  it('returns 200 with score for each NGO', async () => {
    walletsGet.mockResolvedValue({ docs: [{ id: 'n1' }, { id: 'n2' }] });
    recomputeTrustScore.mockImplementation(async (id: string) => ({ score: id === 'n1' ? 80 : 60 }));
    const res = await post();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.processed).toBe(2);
    expect(json.results).toEqual([{ ngoId: 'n1', score: 80 }, { ngoId: 'n2', score: 60 }]);
  });

  it('captures error per NGO and continues', async () => {
    walletsGet.mockResolvedValue({ docs: [{ id: 'n1' }, { id: 'n2' }] });
    recomputeTrustScore
      .mockResolvedValueOnce({ score: 50 })
      .mockRejectedValueOnce(new Error('boom'));
    const res = await post();
    const json = await res.json();
    expect(json.results[0]).toEqual({ ngoId: 'n1', score: 50 });
    expect(json.results[1]).toEqual({ ngoId: 'n2', error: 'boom' });
  });
});
