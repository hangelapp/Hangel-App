/**
 * P2-1b: GET+POST /api/messaging/whatsapp/webhook — Meta verify + HMAC SHA256.
 *
 * Mock pattern: stub whatsapp provider's parseWebhook + firestore so we control
 * event ingestion; HMAC is computed inline against process.env.META_APP_SECRET.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import crypto from 'crypto';

const { parseWebhook } = vi.hoisted(() => ({ parseWebhook: vi.fn() }));

vi.mock('@/lib/messaging/providers/whatsapp', () => ({
  getWhatsAppProvider: () => ({ parseWebhook }),
}));
vi.mock('@/lib/firebase-admin', () => ({
  getAdminFirestore: () => ({
    collection: () => ({
      where: () => ({ limit: () => ({ get: async () => ({ empty: true, docs: [] }) }) }),
      add: vi.fn().mockResolvedValue({ id: 'ev1' }),
      doc: () => ({ update: vi.fn().mockResolvedValue(undefined) }),
    }),
    doc: () => ({ update: vi.fn().mockResolvedValue(undefined) }),
  }),
}));
vi.mock('firebase-admin/firestore', () => ({
  FieldValue: { serverTimestamp: () => 'TS', increment: (n: number) => `INC(${n})` },
  Timestamp: { fromDate: (d: Date) => ({ seconds: Math.floor(d.getTime() / 1000) }) },
}));

describe('/api/messaging/whatsapp/webhook', () => {
  beforeEach(() => {
    vi.resetModules();
    parseWebhook.mockReset();
    process.env.META_APP_SECRET = 'sek';
    process.env.META_WA_VERIFY_TOKEN = 'vtok';
  });

  function sign(body: string) {
    return 'sha256=' + crypto.createHmac('sha256', 'sek').update(body).digest('hex');
  }
  async function load() {
    return import('@/app/api/messaging/whatsapp/webhook/route');
  }

  it('GET: returns challenge when verify_token matches', async () => {
    const mod = await load();
    const res = await mod.GET(new Request('https://x/wh?hub.mode=subscribe&hub.verify_token=vtok&hub.challenge=abc'));
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('abc');
  });

  it('GET: returns 403 when verify_token mismatches', async () => {
    const mod = await load();
    const res = await mod.GET(new Request('https://x/wh?hub.mode=subscribe&hub.verify_token=bad&hub.challenge=abc'));
    expect(res.status).toBe(403);
  });

  it('POST: returns 401 when X-Hub-Signature-256 missing/invalid', async () => {
    const mod = await load();
    const res = await mod.POST(new Request('https://x/wh', { method: 'POST', body: '{}' }));
    expect(res.status).toBe(401);
    expect(parseWebhook).not.toHaveBeenCalled();
  });

  it('POST: returns 200 + processed:0 when signature valid and provider returns []', async () => {
    parseWebhook.mockResolvedValue([]);
    const body = '{"hello":"world"}';
    const mod = await load();
    const res = await mod.POST(new Request('https://x/wh', {
      method: 'POST', headers: { 'x-hub-signature-256': sign(body) }, body,
    }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, processed: 0 });
  });
});
