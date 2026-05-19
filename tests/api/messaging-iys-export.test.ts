/**
 * P2-1c: GET /api/messaging/iys/export — super-admin consent CSV export.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { requireSuperAdmin, consentSnap, userDocGet, logAudit } = vi.hoisted(() => ({
  requireSuperAdmin: vi.fn(),
  consentSnap: vi.fn(),
  userDocGet: vi.fn(),
  logAudit: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/messaging/server-auth', () => ({ requireSuperAdmin }));
vi.mock('@/lib/messaging/audit', () => ({ logAudit }));
vi.mock('@/lib/firebase-admin', () => ({
  getAdminFirestore: () => ({
    collection: (name: string) => name === 'userMarketingConsent'
      ? { get: consentSnap }
      : { doc: () => ({ get: userDocGet }) },
  }),
}));

describe('GET /api/messaging/iys/export', () => {
  beforeEach(() => {
    vi.resetModules();
    requireSuperAdmin.mockReset(); consentSnap.mockReset();
    userDocGet.mockReset(); logAudit.mockClear();
  });
  const okAuth = { actor: { uid: 'u1', email: 'e@x', isSuperAdmin: true } };

  it('returns 403 when not super-admin', async () => {
    const { NextResponse } = await import('next/server');
    requireSuperAdmin.mockResolvedValue({ error: NextResponse.json({ error: 'forbidden' }, { status: 403 }) });
    const mod = await import('@/app/api/messaging/iys/export/route');
    const res = await mod.GET(new Request('https://x/iys'));
    expect(res.status).toBe(403);
  });

  it('returns CSV with ONAY/RED rows for email + sms entries', async () => {
    requireSuperAdmin.mockResolvedValue(okAuth);
    consentSnap.mockResolvedValue({
      docs: [{
        id: 'u1',
        data: () => ({
          email: { enabled: true, updatedAt: { toDate: () => new Date('2025-01-01T00:00:00Z') } },
          sms: { enabled: false, updatedAt: { toDate: () => new Date('2025-01-02T00:00:00Z') } },
          channelAddresses: { email: 'a@x.com', phone: '+905551112233' },
        }),
      }],
    });
    userDocGet.mockResolvedValue({ exists: false });
    const mod = await import('@/app/api/messaging/iys/export/route');
    const res = await mod.GET(new Request('https://x/iys'));
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/csv');
    const body = await res.text();
    expect(body).toContain('a@x.com,BIREYSEL,EPOSTA,HS_WEB,ONAY');
    expect(body).toContain('+905551112233,BIREYSEL,MESAJ,HS_WEB,RED');
    expect(logAudit).toHaveBeenCalledOnce();
  });

  it('returns header-only CSV when no consent docs', async () => {
    requireSuperAdmin.mockResolvedValue(okAuth);
    consentSnap.mockResolvedValue({ docs: [] });
    const mod = await import('@/app/api/messaging/iys/export/route');
    const res = await mod.GET(new Request('https://x/iys'));
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toBe('Recipient,RecipientType,Type,Source,Status,ConsentDate');
  });
});
