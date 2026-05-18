/**
 * P2-1: POST /api/messaging/csv/parse — super-admin auth + size + JSON validation.
 *
 * Mock pattern: stub `requireSuperAdmin` to switch between error / actor. parseCsv
 * is the real implementation (pure function, no I/O — deterministic).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { requireSuperAdmin } = vi.hoisted(() => ({
  requireSuperAdmin: vi.fn(),
}));

vi.mock('@/lib/messaging/server-auth', () => ({
  requireSuperAdmin,
}));

describe('POST /api/messaging/csv/parse', () => {
  beforeEach(() => {
    vi.resetModules();
    requireSuperAdmin.mockReset();
  });

  async function post(body: unknown) {
    const { NextResponse } = await import('next/server');
    void NextResponse; // ensure compatible loader
    const mod = await import('@/app/api/messaging/csv/parse/route');
    return mod.POST(new Request('https://x/csv', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }));
  }

  it('returns 403 when caller is not super-admin', async () => {
    const { NextResponse } = await import('next/server');
    requireSuperAdmin.mockResolvedValue({ error: NextResponse.json({ error: 'forbidden' }, { status: 403 }) });
    const res = await post({ content: 'a,b\n1,2' });
    expect(res.status).toBe(403);
  });

  it('returns 413 on oversized payload (>10MB)', async () => {
    requireSuperAdmin.mockResolvedValue({ actor: { uid: 'u1', email: null } });
    const big = 'a,b\n' + 'x'.repeat(10 * 1024 * 1024 + 10);
    const res = await post({ content: big });
    expect(res.status).toBe(413);
  });

  it('returns 200 with parsed columns + sample on valid CSV', async () => {
    requireSuperAdmin.mockResolvedValue({ actor: { uid: 'u1', email: null } });
    const res = await post({ content: 'name,age\nAli,30\nVeli,40' });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.columns).toEqual(['name', 'age']);
    expect(json.rowCount).toBe(2);
  });

  it('returns 400 on malformed JSON body', async () => {
    requireSuperAdmin.mockResolvedValue({ actor: { uid: 'u1', email: null } });
    const res = await post('{not json');
    expect(res.status).toBe(400);
  });
});
