/**
 * FEAT-EVENT-RSVP — POST /api/events/[id]/rsvp tests.
 *
 * Covers:
 *  1) missing auth -> 401 unauthenticated
 *  2) valid going -> 200 + count incremented
 *  3) going when full -> 409 EVENT_FULL
 *  4) cancel -> 200 + count decremented
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

interface FakeRsvpStore {
  // Doc-id -> rsvp data (id = uid).
  rsvps: Map<string, { userId: string; status: 'going' | 'cancelled' }>;
  capacityMax: number; // 0 = unlimited
  eventExists: boolean;
}

const { verifyIdToken, store } = vi.hoisted(() => ({
  verifyIdToken: vi.fn(),
  store: { rsvps: new Map(), capacityMax: 0, eventExists: true } as FakeRsvpStore,
}));

// Build a fake transaction + Firestore that supports the route's usage:
//  - tx.get(ref|query|countQuery) and tx.set
function buildAdminFirestore() {
  const rsvpsCol = {
    where: (_field: string, _op: string, value: string) => ({
      count: () => ({ __countOf: value }),
    }),
    doc: (uid: string) => ({ __kind: 'rsvpDoc', id: uid, uid }),
  };

  const eventRef = {
    __kind: 'eventDoc',
    collection: (_name: string) => rsvpsCol,
  };

  const tx = {
    get: vi.fn(async (target: { __kind?: string; uid?: string; __countOf?: string }) => {
      if (target.__kind === 'eventDoc') {
        return {
          exists: store.eventExists,
          data: () => ({ capacity: { max: store.capacityMax, current: 0 } }),
        };
      }
      if (target.__kind === 'rsvpDoc' && target.uid) {
        const existing = store.rsvps.get(target.uid);
        return {
          exists: !!existing,
          data: () => existing,
          get: (_k: string) => undefined,
        };
      }
      if (target.__countOf) {
        // count() aggregate
        const going = Array.from(store.rsvps.values()).filter((r) => r.status === 'going').length;
        return { data: () => ({ count: going }) };
      }
      return { exists: false, data: () => undefined };
    }),
    set: vi.fn((ref: { __kind?: string; uid?: string }, data: { status: 'going' | 'cancelled' }) => {
      if (ref.__kind === 'rsvpDoc' && ref.uid) {
        store.rsvps.set(ref.uid, { userId: ref.uid, status: data.status });
      }
    }),
  };

  return {
    collection: (_name: string) => ({
      doc: (_id: string) => eventRef,
    }),
    runTransaction: async (fn: (t: typeof tx) => Promise<unknown>) => fn(tx),
  };
}

vi.mock('@/lib/firebase-admin', () => ({
  getAdminAuth: () => ({ verifyIdToken }),
  getAdminFirestore: () => buildAdminFirestore(),
}));

vi.mock('firebase-admin/firestore', () => ({
  FieldValue: { serverTimestamp: () => 'SERVER_TS' },
}));

describe('POST /api/events/[id]/rsvp', () => {
  beforeEach(() => {
    vi.resetModules();
    verifyIdToken.mockReset();
    store.rsvps.clear();
    store.capacityMax = 0;
    store.eventExists = true;
  });

  async function post(opts: {
    body: unknown;
    eventId?: string;
    auth?: string | null;
  }) {
    const mod = await import('@/app/api/events/[id]/rsvp/route');
    const headers: Record<string, string> = { 'content-type': 'application/json' };
    if (opts.auth) headers.authorization = opts.auth;
    const req = new Request(`https://x/api/events/${opts.eventId ?? 'evt1'}/rsvp`, {
      method: 'POST',
      headers,
      body: JSON.stringify(opts.body),
    });
    return mod.POST(req, { params: Promise.resolve({ id: opts.eventId ?? 'evt1' }) });
  }

  it('returns 401 when authorization header is missing', async () => {
    const res = await post({ body: { action: 'going' }, auth: null });
    expect(res.status).toBe(401);
    expect(await res.json()).toMatchObject({ errorCode: 'unauthenticated' });
    expect(verifyIdToken).not.toHaveBeenCalled();
  });

  it('returns 200 and increments count on valid going', async () => {
    verifyIdToken.mockResolvedValueOnce({ uid: 'user-a' });
    store.capacityMax = 10;
    const res = await post({ body: { action: 'going' }, auth: 'Bearer good' });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'going', count: 1 });
    expect(store.rsvps.get('user-a')?.status).toBe('going');
  });

  it('returns 409 EVENT_FULL when capacity reached and user is new', async () => {
    verifyIdToken.mockResolvedValueOnce({ uid: 'user-new' });
    store.capacityMax = 2;
    store.rsvps.set('u1', { userId: 'u1', status: 'going' });
    store.rsvps.set('u2', { userId: 'u2', status: 'going' });
    const res = await post({ body: { action: 'going' }, auth: 'Bearer good' });
    expect(res.status).toBe(409);
    expect(await res.json()).toMatchObject({ errorCode: 'EVENT_FULL' });
    expect(store.rsvps.has('user-new')).toBe(false);
  });

  it('returns 200 and decrements count on cancel of existing going rsvp', async () => {
    verifyIdToken.mockResolvedValueOnce({ uid: 'user-c' });
    store.capacityMax = 10;
    store.rsvps.set('user-c', { userId: 'user-c', status: 'going' });
    store.rsvps.set('other', { userId: 'other', status: 'going' });
    const res = await post({ body: { action: 'cancel' }, auth: 'Bearer good' });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'cancelled', count: 1 });
    expect(store.rsvps.get('user-c')?.status).toBe('cancelled');
  });
});
