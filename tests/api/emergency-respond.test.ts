/**
 * POST /api/emergency/respond — covers:
 *  - No bearer → 401
 *  - Invalid token → 401
 *  - Missing requestId → 400
 *  - Happy path: writes messages + notifications doc (Admin SDK)
 *  - Firestore write failure → 500
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  verifyIdToken,
  getAuthUser,
  messagesAdd,
  notificationsAdd,
  emergencyDoc,
} = vi.hoisted(() => ({
  verifyIdToken: vi.fn(),
  getAuthUser: vi.fn(),
  messagesAdd: vi.fn(),
  notificationsAdd: vi.fn(),
  emergencyDoc: { exists: true, data: () => ({}) } as { exists: boolean; data: () => unknown },
}));

vi.mock('@/lib/firebase-admin', () => ({
  getAdminAuth: () => ({
    verifyIdToken,
    getUser: getAuthUser,
  }),
  getAdminFirestore: () => ({
    collection: (name: string) => {
      if (name === 'emergencyRequests') {
        return {
          doc: () => ({
            get: vi.fn().mockResolvedValue(emergencyDoc),
          }),
        };
      }
      if (name === 'messages') {
        return { add: messagesAdd };
      }
      if (name === 'notifications') {
        return { add: notificationsAdd };
      }
      return { doc: () => ({}), add: vi.fn() };
    },
  }),
}));

vi.mock('firebase-admin/firestore', () => ({
  FieldValue: { serverTimestamp: () => ({ __op: 'serverTimestamp' }) },
}));

import { makeNextRequest } from './_setup';

describe('POST /api/emergency/respond', () => {
  beforeEach(() => {
    vi.resetModules();
    verifyIdToken.mockReset();
    getAuthUser.mockReset().mockResolvedValue({ displayName: 'Test User' });
    messagesAdd.mockReset().mockResolvedValue({});
    notificationsAdd.mockReset().mockResolvedValue({});
    emergencyDoc.exists = true;
    emergencyDoc.data = () => ({
      hospitalName: 'Acıbadem',
      hospitalCity: 'İstanbul',
      hospitalDistrict: 'Maslak',
      hospitalAddress: 'Maslak Cad. No:55',
      hospitalPhone: '+902129876543',
      bloodType: '0+',
      patientName: 'Hasta',
      contactName: 'Yakın',
      contactPhone: '+905551234567',
    });
  });

  async function post(body: unknown, headers: Record<string, string> = {}) {
    const mod = await import('@/app/api/emergency/respond/route');
    const req = await makeNextRequest('https://x/api/emergency/respond', {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify(body),
    });
    return mod.POST(req as never);
  }

  it('returns 401 when no Authorization header', async () => {
    const res = await post({ requestId: 'req-1' });
    expect(res.status).toBe(401);
    expect(await res.json()).toMatchObject({ errorCode: 'UNAUTHORIZED' });
  });

  it('returns 401 when token verification fails', async () => {
    verifyIdToken.mockRejectedValueOnce(new Error('invalid'));
    const res = await post({ requestId: 'req-1' }, { authorization: 'Bearer bad-token' });
    expect(res.status).toBe(401);
  });

  it('returns 400 when requestId is missing', async () => {
    verifyIdToken.mockResolvedValueOnce({ uid: 'u1', name: 'User One' });
    const res = await post({}, { authorization: 'Bearer good' });
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ errorCode: 'INVALID_BODY' });
  });

  it('writes both messages and notifications doc on happy path', async () => {
    verifyIdToken.mockResolvedValueOnce({ uid: 'u1', name: 'User One' });
    const res = await post({ requestId: 'req-1' }, { authorization: 'Bearer good' });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true });
    expect(messagesAdd).toHaveBeenCalledTimes(1);
    expect(notificationsAdd).toHaveBeenCalledTimes(1);

    const msgArg = messagesAdd.mock.calls[0][0];
    expect(msgArg).toMatchObject({
      senderId: 'hangel-system',
      recipientId: 'u1',
      relatedRequestId: 'req-1',
    });

    const notifArg = notificationsAdd.mock.calls[0][0];
    expect(notifArg).toMatchObject({
      userId: 'u1',
      type: 'emergency-blood-confirmation',
      read: false,
    });
  });

  it('returns 500 when Firestore write throws', async () => {
    verifyIdToken.mockResolvedValueOnce({ uid: 'u1', name: 'User One' });
    messagesAdd.mockRejectedValueOnce(new Error('firestore down'));
    const res = await post({ requestId: 'req-1' }, { authorization: 'Bearer good' });
    expect(res.status).toBe(500);
    expect(await res.json()).toMatchObject({ errorCode: 'INTERNAL_ERROR' });
  });

  it('still writes records using client-provided data when emergencyRequests doc missing', async () => {
    verifyIdToken.mockResolvedValueOnce({ uid: 'u1', name: 'User One' });
    emergencyDoc.exists = false;
    emergencyDoc.data = () => ({});
    const res = await post(
      {
        requestId: 'req-1',
        data: {
          hospitalName: 'Client Hospital',
          bloodType: 'A+',
        },
      },
      { authorization: 'Bearer good' },
    );
    expect(res.status).toBe(200);
    expect(messagesAdd).toHaveBeenCalled();
    expect(notificationsAdd).toHaveBeenCalled();
  });
});
