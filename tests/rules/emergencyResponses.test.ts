/**
 * Security rule tests for `/emergencyResponses/{respId}`.
 *
 * Declared rules (see firestore.rules):
 *   match /emergencyResponses/{respId} {
 *     allow list: if isSuperAdmin() || (isSignedIn() && resource.data.userId == request.auth.uid);
 *     allow read: if isSignedIn() && (
 *       resource == null ||
 *       resource.data.userId == request.auth.uid ||
 *       isSuperAdmin()
 *     );
 *     allow create: if isSignedIn() &&
 *       request.resource.data.userId == request.auth.uid &&
 *       request.resource.data.status in ['positive', 'negative'];
 *     allow update, delete: if isSuperAdmin() || (
 *       isSignedIn() && resource.data.userId == request.auth.uid
 *     );
 *   }
 *
 * Test goals:
 *  - create requires own userId + valid status enum
 *  - owner can read/update/delete their own response
 *  - non-owner cannot read or modify someone else's response
 *  - super-admin has full access
 */
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';

import {
  adminSeed,
  authedAs,
  cleanupTestEnv,
  getTestEnv,
  isEmulatorRunning,
  unauthedDb,
} from './setup';

const emulatorUp = await isEmulatorRunning();

describe.skipIf(!emulatorUp)('firestore.rules — /emergencyResponses/{respId}', () => {
  beforeAll(async () => {
    await getTestEnv();
  });

  afterAll(async () => {
    await cleanupTestEnv();
  });

  beforeEach(async () => {
    const env = await getTestEnv();
    await env.clearFirestore();
    await adminSeed(env, async (ctx) => {
      const db = ctx.firestore();
      await db.collection('emergencyResponses').doc('resp-alice').set({
        userId: 'alice',
        requestId: 'req-1',
        status: 'positive',
        createdAt: new Date(),
      });
      await db.collection('emergencyResponses').doc('resp-bob').set({
        userId: 'bob',
        requestId: 'req-1',
        status: 'negative',
        createdAt: new Date(),
      });
    });
  });

  // ----- CREATE -----

  it('signed-in user CAN create response with their own userId and positive status', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'carol');
    await assertSucceeds(
      setDoc(doc(db, 'emergencyResponses/r-new'), {
        userId: 'carol',
        requestId: 'req-2',
        status: 'positive',
        createdAt: new Date(),
      }),
    );
  });

  it('signed-in user CAN create response with negative status', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'carol');
    await assertSucceeds(
      setDoc(doc(db, 'emergencyResponses/r-neg'), {
        userId: 'carol',
        requestId: 'req-2',
        status: 'negative',
        createdAt: new Date(),
      }),
    );
  });

  it('signed-in user CANNOT create response impersonating another user', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'carol');
    await assertFails(
      setDoc(doc(db, 'emergencyResponses/r-spoof'), {
        userId: 'alice',
        requestId: 'req-2',
        status: 'positive',
        createdAt: new Date(),
      }),
    );
  });

  it('signed-in user CANNOT create response with invalid status', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'carol');
    await assertFails(
      setDoc(doc(db, 'emergencyResponses/r-bad'), {
        userId: 'carol',
        requestId: 'req-2',
        status: 'maybe', // not in ['positive','negative']
        createdAt: new Date(),
      }),
    );
  });

  it('anonymous CANNOT create response', async () => {
    const env = await getTestEnv();
    const db = unauthedDb(env);
    await assertFails(
      setDoc(doc(db, 'emergencyResponses/r-anon'), {
        userId: 'anon',
        requestId: 'req-2',
        status: 'positive',
        createdAt: new Date(),
      }),
    );
  });

  // ----- READ -----

  it('owner CAN read their own response', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'alice');
    await assertSucceeds(getDoc(doc(db, 'emergencyResponses/resp-alice')));
  });

  it('non-owner CANNOT read someone else response', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'alice');
    await assertFails(getDoc(doc(db, 'emergencyResponses/resp-bob')));
  });

  it('super-admin CAN read any response', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'root', { role: 'super-admin' });
    await assertSucceeds(getDoc(doc(db, 'emergencyResponses/resp-alice')));
  });

  it('anonymous CANNOT read responses', async () => {
    const env = await getTestEnv();
    const db = unauthedDb(env);
    await assertFails(getDoc(doc(db, 'emergencyResponses/resp-alice')));
  });

  // ----- UPDATE -----

  it('owner CAN update their own response', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'alice');
    await assertSucceeds(
      updateDoc(doc(db, 'emergencyResponses/resp-alice'), { status: 'negative' }),
    );
  });

  it('non-owner CANNOT update someone else response', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'alice');
    await assertFails(
      updateDoc(doc(db, 'emergencyResponses/resp-bob'), { status: 'positive' }),
    );
  });

  it('super-admin CAN update any response', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'root', { role: 'super-admin' });
    await assertSucceeds(
      updateDoc(doc(db, 'emergencyResponses/resp-bob'), { status: 'positive' }),
    );
  });

  // ----- DELETE -----

  it('owner CAN delete their own response', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'alice');
    await assertSucceeds(deleteDoc(doc(db, 'emergencyResponses/resp-alice')));
  });

  it('non-owner CANNOT delete someone else response', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'alice');
    await assertFails(deleteDoc(doc(db, 'emergencyResponses/resp-bob')));
  });

  it('super-admin CAN delete any response', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'root', { role: 'super-admin' });
    await assertSucceeds(deleteDoc(doc(db, 'emergencyResponses/resp-bob')));
  });
});
