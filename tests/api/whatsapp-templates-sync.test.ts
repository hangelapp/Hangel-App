/**
 * P2-1b: POST /api/admin/messaging/whatsapp/templates/sync — super-admin gated provider sync.
 *
 * Mock pattern: requireSuperAdmin + getWhatsAppProvider.syncTemplates + firestore upserts + audit.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { requireSuperAdmin, syncTemplates, docSet, logAudit } = vi.hoisted(() => ({
  requireSuperAdmin: vi.fn(),
  syncTemplates: vi.fn(),
  docSet: vi.fn().mockResolvedValue(undefined),
  logAudit: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/messaging/server-auth', () => ({ requireSuperAdmin }));
vi.mock('@/lib/messaging/providers/whatsapp', () => ({
  getWhatsAppProvider: () => ({ syncTemplates }),
}));
vi.mock('@/lib/messaging/audit', () => ({ logAudit }));
vi.mock('@/lib/firebase-admin', () => ({
  getAdminFirestore: () => ({
    collection: () => ({ doc: () => ({ set: docSet }) }),
  }),
}));
vi.mock('firebase-admin/firestore', () => ({ FieldValue: { serverTimestamp: () => 'TS' } }));

describe('POST /api/admin/messaging/whatsapp/templates/sync', () => {
  beforeEach(() => {
    vi.resetModules();
    requireSuperAdmin.mockReset(); syncTemplates.mockReset();
    docSet.mockClear(); logAudit.mockClear();
    process.env.META_WA_BUSINESS_ACCOUNT_ID = 'waba_42';
  });

  async function post() {
    const mod = await import('@/app/api/admin/messaging/whatsapp/templates/sync/route');
    return mod.POST(new Request('https://x/sync', { method: 'POST' }));
  }

  it('returns 401 when not super-admin', async () => {
    const { NextResponse } = await import('next/server');
    requireSuperAdmin.mockResolvedValue({ error: NextResponse.json({ error: 'Token gerekli' }, { status: 401 }) });
    const res = await post();
    expect(res.status).toBe(401);
    expect(syncTemplates).not.toHaveBeenCalled();
  });

  it('returns 500 when META_WA_BUSINESS_ACCOUNT_ID env missing', async () => {
    delete process.env.META_WA_BUSINESS_ACCOUNT_ID;
    requireSuperAdmin.mockResolvedValue({ actor: { uid: 'u', email: 'e' } });
    const res = await post();
    expect(res.status).toBe(500);
  });

  it('returns 200 + upserted count on happy path', async () => {
    requireSuperAdmin.mockResolvedValue({ actor: { uid: 'u', email: 'e' } });
    syncTemplates.mockResolvedValue([
      { name: 't1', language: 'tr', category: 'MARKETING', status: 'APPROVED', body: 'B', raw: {} },
      { name: 't2', language: 'tr', category: 'UTILITY', status: 'APPROVED', body: 'B2', raw: {} },
    ]);
    const res = await post();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ upserted: 2, total: 2 });
    expect(docSet).toHaveBeenCalledTimes(2);
  });

  it('returns 500 when provider.syncTemplates throws', async () => {
    requireSuperAdmin.mockResolvedValue({ actor: { uid: 'u', email: 'e' } });
    syncTemplates.mockRejectedValue(new Error('meta down'));
    const res = await post();
    expect(res.status).toBe(500);
  });
});
