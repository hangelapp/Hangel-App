/**
 * PDF-71-impl: POST /api/library/project — input validation, config read,
 * quota error path, and unhandled-error path.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

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

const { writeProjectProposal, configGet } = vi.hoisted(() => ({
  writeProjectProposal: vi.fn(),
  configGet: vi.fn(),
}));

vi.mock('@/ai/flows/project-writer-flow', () => ({
  writeProjectProposal,
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
    { slug: 'kitaplar', title: 'Kitaplar', description: 'Kitap önerileri.', icon: 'Library', items: [] },
    { slug: 'akademik', title: 'Akademik', description: 'Akademik kaynaklar.', icon: 'Book', items: [] },
  ],
}));

import { makeNextRequest } from './_setup';

describe('POST /api/library/project', () => {
  beforeEach(() => {
    vi.resetModules();
    writeProjectProposal.mockReset();
    configGet.mockReset();
    configGet.mockResolvedValue({ exists: false, data: () => undefined });
  });
  afterEach(() => vi.useRealTimers());

  async function post(body: unknown, headers: Record<string, string> = {}) {
    const mod = await import('@/app/api/library/project/route');
    const req = await makeNextRequest('https://x/api/library/project', {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify(body),
    });
    return mod.POST(req);
  }

  it('returns 400 when institution missing', async () => {
    const res = await post({ sections: { summary: 'x' } });
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ errorCode: 'INVALID_BODY' });
    expect(writeProjectProposal).not.toHaveBeenCalled();
  });

  it('returns 400 when all section fields empty', async () => {
    const res = await post({ institution: 'AB Fonu', sections: { summary: '   ', goals: '' } });
    expect(res.status).toBe(400);
    expect(writeProjectProposal).not.toHaveBeenCalled();
  });

  it('returns 400 when sections is not an object', async () => {
    const res = await post({ institution: 'AB Fonu', sections: 'nope' });
    expect(res.status).toBe(400);
    expect(writeProjectProposal).not.toHaveBeenCalled();
  });

  it('calls flow with trimmed section strings + full context', async () => {
    writeProjectProposal.mockResolvedValueOnce({ fullProposal: '# Proje\n...' });
    const res = await post({
      institution: '  AB Fonu  ',
      sections: { summary: '  bir özet  ', goals: 'amaçlar', audience: '', budget: '  ', activities: 'eğitim' },
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ fullProposal: '# Proje\n...' });
    const [input, idToken] = writeProjectProposal.mock.calls[0];
    expect(input.institution).toBe('AB Fonu');
    expect(input.sections.summary).toBe('bir özet');
    expect(input.sections.goals).toBe('amaçlar');
    expect(input.sections.audience).toBeUndefined();
    expect(input.sections.budget).toBeUndefined();
    expect(input.sections.activities).toBe('eğitim');
    expect(input.libraryContext).toContain('Kitaplar');
    expect(idToken).toBeUndefined();
  });

  it('forwards idToken from Authorization header (Bearer)', async () => {
    writeProjectProposal.mockResolvedValueOnce({ fullProposal: 'ok' });
    await post(
      { institution: 'AB', sections: { summary: 'x' } },
      { authorization: 'bearer abc.def.ghi' },
    );
    expect(writeProjectProposal.mock.calls[0][1]).toBe('abc.def.ghi');
  });

  it('filters libraryContext by aiAssistantConfig/project.knowledgeSourceSlugs', async () => {
    configGet.mockResolvedValueOnce({ exists: true, data: () => ({ knowledgeSourceSlugs: ['akademik'] }) });
    writeProjectProposal.mockResolvedValueOnce({ fullProposal: 'p' });
    await post({ institution: 'AB', sections: { summary: 'x' } });
    const ctx = writeProjectProposal.mock.calls[0][0].libraryContext as string;
    expect(ctx).toContain('Akademik');
    expect(ctx).not.toContain('Kitaplar');
  });

  it('returns 429 when flow throws AIQuotaExceededError', async () => {
    writeProjectProposal.mockRejectedValueOnce(new AIQuotaExceededError('project-writer'));
    const res = await post({ institution: 'AB', sections: { summary: 'x' } });
    expect(res.status).toBe(429);
    expect(await res.json()).toMatchObject({ errorCode: 'QUOTA_EXCEEDED' });
  });

  it('returns 500 with generic message on unexpected error (no upstream leak)', async () => {
    writeProjectProposal.mockRejectedValueOnce(new Error('gemini api-key invalid SECRET12345'));
    const res = await post({ institution: 'AB', sections: { summary: 'x' } });
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toMatchObject({ errorCode: 'INTERNAL_ERROR' });
    expect(JSON.stringify(body)).not.toContain('SECRET12345');
  });
});
