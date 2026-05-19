/**
 * PDF-71-impl: POST /api/library/chat — input validation, config read,
 * quota error path, and unhandled-error path.
 *
 * Mocks:
 *   - `server-only` is stubbed (vitest's node env can't resolve the Next.js
 *     marker package).
 *   - `@/ai/flows/library-ai-assistant` → flow fn is a spy.
 *   - `@/ai/flow-auth` → re-exports a local `AIQuotaExceededError` class so
 *     the test can throw a real instance without dragging in `server-only`.
 *   - `@/lib/firebase-admin` → `getAdminFirestore()` returns a chainable fake.
 *   - `@/lib/library` → minimal `librarySections` stub.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Stub Next.js server-only marker (not installed in vitest's node env).
vi.mock('server-only', () => ({}));

// Mirror of the real AIQuotaExceededError shape — must be referentially
// the same class the route imports for `instanceof` to match. We mock the
// `@/ai/flow-auth` module to export THIS class; the route then imports it
// from the same mocked module, so `instanceof` works.
class AIQuotaExceededError extends Error {
  readonly code = 'QUOTA_EXCEEDED' as const;
  constructor(kind: string) {
    super(`QUOTA_EXCEEDED:${kind}`);
    this.name = 'AIQuotaExceededError';
  }
}

vi.mock('@/ai/flow-auth', () => ({
  AIQuotaExceededError,
  verifyAIFlowUserId: vi.fn().mockResolvedValue(null),
}));

const { askLibraryAssistant, configGet } = vi.hoisted(() => ({
  askLibraryAssistant: vi.fn(),
  configGet: vi.fn(),
}));

vi.mock('@/ai/flows/library-ai-assistant', () => ({
  askLibraryAssistant,
}));

vi.mock('@/lib/firebase-admin', () => ({
  getAdminFirestore: () => ({
    collection: (_name: string) => ({
      doc: (_id: string) => ({ get: configGet }),
    }),
  }),
}));

vi.mock('@/lib/library', () => ({
  librarySections: [
    { slug: 'kitaplar', title: 'Kitaplar', description: 'Kitap önerileri.', icon: 'Library', items: [{ slug: 'k1', title: 'Kitap 1', content: '' }] },
    { slug: 'akademik', title: 'Akademik', description: 'Akademik kaynaklar.', icon: 'Book', items: [] },
  ],
}));

import { makeRequest } from './_setup';

describe('POST /api/library/chat', () => {
  beforeEach(() => {
    vi.resetModules();
    askLibraryAssistant.mockReset();
    configGet.mockReset();
    // Default: config doc does not exist → all sections used.
    configGet.mockResolvedValue({ exists: false, data: () => undefined });
  });
  afterEach(() => vi.useRealTimers());

  async function post(body: unknown, headers: Record<string, string> = {}) {
    const mod = await import('@/app/api/library/chat/route');
    const req = makeRequest('https://x/api/library/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify(body),
    });
    return mod.POST(req);
  }

  it('returns 400 for missing message', async () => {
    const res = await post({});
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ errorCode: 'INVALID_BODY' });
    expect(askLibraryAssistant).not.toHaveBeenCalled();
  });

  it('returns 400 for empty string message', async () => {
    const res = await post({ message: '   ' });
    expect(res.status).toBe(400);
    expect(askLibraryAssistant).not.toHaveBeenCalled();
  });

  it('returns 400 for non-string message', async () => {
    const res = await post({ message: 42 });
    expect(res.status).toBe(400);
    expect(askLibraryAssistant).not.toHaveBeenCalled();
  });

  it('calls flow with full libraryContext when config missing + no idToken', async () => {
    askLibraryAssistant.mockResolvedValueOnce({ answer: 'merhaba' });
    const res = await post({ message: 'Hangel nedir?' });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ reply: 'merhaba' });
    expect(askLibraryAssistant).toHaveBeenCalledTimes(1);
    const [input, idToken] = askLibraryAssistant.mock.calls[0];
    expect(input.userQuestion).toBe('Hangel nedir?');
    expect(input.libraryContext).toContain('Kitaplar');
    expect(input.libraryContext).toContain('Akademik');
    expect(idToken).toBeUndefined();
  });

  it('forwards idToken from Authorization header (Bearer)', async () => {
    askLibraryAssistant.mockResolvedValueOnce({ answer: 'ok' });
    const res = await post({ message: 'soru' }, { authorization: 'Bearer abc.def.ghi' });
    expect(res.status).toBe(200);
    expect(askLibraryAssistant.mock.calls[0][1]).toBe('abc.def.ghi');
  });

  it('filters libraryContext by knowledgeSourceSlugs from aiAssistantConfig/library', async () => {
    configGet.mockResolvedValueOnce({ exists: true, data: () => ({ knowledgeSourceSlugs: ['kitaplar'] }) });
    askLibraryAssistant.mockResolvedValueOnce({ answer: 'k' });
    await post({ message: 'soru' });
    const ctx = askLibraryAssistant.mock.calls[0][0].libraryContext as string;
    expect(ctx).toContain('Kitaplar');
    expect(ctx).not.toContain('Akademik');
  });

  it('falls back to all sections when config read throws', async () => {
    configGet.mockRejectedValueOnce(new Error('firestore down'));
    askLibraryAssistant.mockResolvedValueOnce({ answer: 'k' });
    const res = await post({ message: 'soru' });
    expect(res.status).toBe(200);
    const ctx = askLibraryAssistant.mock.calls[0][0].libraryContext as string;
    expect(ctx).toContain('Kitaplar');
    expect(ctx).toContain('Akademik');
  });

  it('returns 429 when flow throws AIQuotaExceededError', async () => {
    askLibraryAssistant.mockRejectedValueOnce(new AIQuotaExceededError('library-assistant'));
    const res = await post({ message: 'soru' });
    expect(res.status).toBe(429);
    expect(await res.json()).toMatchObject({ errorCode: 'QUOTA_EXCEEDED' });
  });

  it('returns 500 + generic message when flow throws unexpected error', async () => {
    askLibraryAssistant.mockRejectedValueOnce(new Error('upstream 503: model offline'));
    const res = await post({ message: 'soru' });
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toMatchObject({ errorCode: 'INTERNAL_ERROR' });
    // Raw upstream message must not leak.
    expect(JSON.stringify(body)).not.toContain('upstream 503');
  });
});
