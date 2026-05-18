/**
 * Shared helpers for API route unit tests.
 *
 * Strategy: each test file uses `vi.mock(...)` at the top, BEFORE importing
 * the route under test. These helpers return chainable Firestore-Admin-style
 * fake objects so individual tests can spy on `update`, `add`, `create`, etc.
 */
import { vi } from 'vitest';

export interface FakeDocRef {
  id: string;
  get: ReturnType<typeof vi.fn>;
  set: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
  collection: ReturnType<typeof vi.fn>;
}

export interface FakeQuery {
  where: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  get: ReturnType<typeof vi.fn>;
}

export function makeDocRef(overrides: Partial<FakeDocRef> = {}): FakeDocRef {
  const ref: FakeDocRef = {
    id: 'docid',
    get: vi.fn().mockResolvedValue({ exists: true, data: () => ({}) }),
    set: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockResolvedValue(undefined),
    create: vi.fn().mockResolvedValue(undefined),
    collection: vi.fn(() => ({ doc: vi.fn(() => makeDocRef()) })),
    ...overrides,
  };
  return ref;
}

export function makeQuery(empty = true, docs: unknown[] = []): FakeQuery {
  const q: FakeQuery = {
    where: vi.fn(() => q),
    limit: vi.fn(() => q),
    get: vi.fn().mockResolvedValue({ empty, docs }),
  };
  return q;
}

/** Build a minimal NextRequest-compatible Request (Node 18+ has global Request). */
export function makeRequest(
  url: string,
  init: { method?: string; headers?: Record<string, string>; body?: string } = {},
): Request {
  return new Request(url, {
    method: init.method ?? 'POST',
    headers: init.headers,
    body: init.body,
  });
}

/** Build a NextRequest using next/server. Some routes type-annotate as NextRequest. */
export async function makeNextRequest(
  url: string,
  init: { method?: string; headers?: Record<string, string>; body?: string } = {},
) {
  const { NextRequest } = await import('next/server');
  return new NextRequest(url, {
    method: init.method ?? 'POST',
    headers: init.headers,
    body: init.body,
  });
}
