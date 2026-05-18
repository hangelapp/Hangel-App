/**
 * P2-1: POST /api/messaging/webhook/[driver] — HMAC, replay, unknown driver.
 *
 * Mock pattern: replace `@/lib/messaging/webhook-replay` helpers + Firestore +
 * email provider so we control verify / freshness / replay outcomes directly.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  verifySvixSignature, isTimestampFresh, rememberWebhookEvent,
  isIpAllowed, extractClientIp, parseWebhook,
} = vi.hoisted(() => ({
  verifySvixSignature: vi.fn(),
  isTimestampFresh: vi.fn(),
  rememberWebhookEvent: vi.fn(),
  isIpAllowed: vi.fn(),
  extractClientIp: vi.fn(() => '1.1.1.1'),
  parseWebhook: vi.fn(),
}));

vi.mock('@/lib/messaging/webhook-replay', () => ({
  verifySvixSignature,
  isTimestampFresh,
  rememberWebhookEvent,
  isIpAllowed,
  extractClientIp,
}));

vi.mock('@/lib/firebase-admin', () => ({
  getAdminFirestore: () => ({
    collection: () => ({
      where: () => ({ limit: () => ({ get: async () => ({ empty: true, docs: [] }) }) }),
      add: vi.fn().mockResolvedValue({ id: 'x' }),
    }),
  }),
}));

vi.mock('firebase-admin/firestore', () => ({
  FieldValue: { serverTimestamp: () => 'TS', increment: (n: number) => `INC(${n})` },
  Timestamp: { fromDate: (d: Date) => ({ seconds: Math.floor(d.getTime() / 1000) }) },
}));

vi.mock('@/lib/messaging/providers/email', () => ({
  getEmailProvider: () => ({ parseWebhook }),
}));

describe('POST /api/messaging/webhook/[driver]', () => {
  beforeEach(() => {
    vi.resetModules();
    verifySvixSignature.mockReset();
    isTimestampFresh.mockReset();
    rememberWebhookEvent.mockReset();
    parseWebhook.mockReset();
    process.env.RESEND_WEBHOOK_SECRET = 'whsec_test';
  });

  async function post(driver: string, headers: Record<string, string>, body = '{}') {
    const mod = await import('@/app/api/messaging/webhook/[driver]/route');
    const req = new Request(`https://x/api/messaging/webhook/${driver}`, {
      method: 'POST', headers, body,
    });
    return mod.POST(req, { params: Promise.resolve({ driver }) });
  }

  it('resend: returns 401 INVALID_SIGNATURE when verify fails', async () => {
    verifySvixSignature.mockReturnValue(false);
    const res = await post('resend', { 'svix-id': 'a', 'svix-timestamp': '1', 'svix-signature': 'v1,x' });
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ errorCode: 'INVALID_SIGNATURE' });
  });

  it('resend: returns 401 STALE_TIMESTAMP when verify ok but stale', async () => {
    verifySvixSignature.mockReturnValue(true);
    isTimestampFresh.mockReturnValue(false);
    const res = await post('resend', { 'svix-id': 'a', 'svix-timestamp': '1', 'svix-signature': 'v1,x' });
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ errorCode: 'STALE_TIMESTAMP' });
  });

  it('resend: returns 409 REPLAY_DETECTED on duplicate eventId', async () => {
    verifySvixSignature.mockReturnValue(true);
    isTimestampFresh.mockReturnValue(true);
    rememberWebhookEvent.mockResolvedValue('replay');
    parseWebhook.mockResolvedValue([]);
    const res = await post('resend', { 'svix-id': 'dup', 'svix-timestamp': '1', 'svix-signature': 'v1,x' });
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ errorCode: 'REPLAY_DETECTED' });
  });

  it('resend: returns 200 when signature+timestamp valid and no replay', async () => {
    verifySvixSignature.mockReturnValue(true);
    isTimestampFresh.mockReturnValue(true);
    rememberWebhookEvent.mockResolvedValue('ok');
    parseWebhook.mockResolvedValue([]);
    const res = await post('resend', { 'svix-id': 'new', 'svix-timestamp': '1', 'svix-signature': 'v1,x' });
    expect(res.status).toBe(200);
  });

  it('unknown driver: returns 400', async () => {
    const res = await post('mystery', {});
    expect(res.status).toBe(400);
  });
});
