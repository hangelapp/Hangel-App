/**
 * Security rule tests for `/donations/{donationId}`.
 *
 * Declared rules (see firestore.rules):
 *   allow list:   if isSuperAdmin() || isSignedIn();
 *   allow read:   if isSignedIn() && (
 *     resource == null ||
 *     resource.data.userId == request.auth.uid ||
 *     isSuperAdmin()
 *   );
 *   allow create: if isSignedIn() && request.resource.data.userId == request.auth.uid;
 *   allow update: if isSuperAdmin();
 *   allow delete: if isSuperAdmin();
 */
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
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

describe.skipIf(!emulatorUp)('firestore.rules — /donations/{donationId}', () => {
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
      // alice's donation
      await db
        .collection('donations')
        .doc('don-alice-1')
        .set({
          userId: 'alice',
          amount: 100,
          ngoId: 'ngo1',
          status: 'completed',
        });
      // bob's donation
      await db
        .collection('donations')
        .doc('don-bob-1')
        .set({
          userId: 'bob',
          amount: 50,
          ngoId: 'ngo1',
          status: 'completed',
        });
      // super-admin role doc
      await db
        .collection('users')
        .doc('root')
        .set({ role: 'super-admin' });
    });
  });

  it('user CAN read their OWN donation', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'alice');
    await assertSucceeds(getDoc(doc(db, 'donations', 'don-alice-1')));
  });

  it('user CANNOT read another user\'s donation', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'alice');
    await assertFails(getDoc(doc(db, 'donations', 'don-bob-1')));
  });

  it('anonymous CANNOT read donations', async () => {
    const env = await getTestEnv();
    const db = unauthedDb(env);
    await assertFails(getDoc(doc(db, 'donations', 'don-alice-1')));
  });

  it('anonymous CANNOT list donations', async () => {
    const env = await getTestEnv();
    const db = unauthedDb(env);
    await assertFails(getDocs(collection(db, 'donations')));
  });

  it('authed user CAN list donations (rule allows any signed-in list)', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'alice');
    await assertSucceeds(getDocs(collection(db, 'donations')));
  });

  it('super-admin CAN read any donation', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'root');
    await assertSucceeds(getDoc(doc(db, 'donations', 'don-bob-1')));
  });

  it('signed-in user CAN create a donation with their own userId', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'alice');
    await assertSucceeds(
      setDoc(doc(db, 'donations', 'don-alice-2'), {
        userId: 'alice',
        amount: 25,
        ngoId: 'ngo1',
      }),
    );
  });

  it('signed-in user CANNOT create a donation impersonating another user', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'alice');
    await assertFails(
      setDoc(doc(db, 'donations', 'don-spoof'), {
        userId: 'bob',
        amount: 25,
        ngoId: 'ngo1',
      }),
    );
  });

  it('anonymous CANNOT create donations', async () => {
    const env = await getTestEnv();
    const db = unauthedDb(env);
    await assertFails(
      setDoc(doc(db, 'donations', 'don-anon'), {
        userId: 'anonuser',
        amount: 10,
      }),
    );
  });

  it('regular user CANNOT update their own donation (admin-only)', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'alice');
    await assertFails(
      updateDoc(doc(db, 'donations', 'don-alice-1'), { status: 'refunded' }),
    );
  });

  it('super-admin CAN update donation status', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'root');
    await assertSucceeds(
      updateDoc(doc(db, 'donations', 'don-alice-1'), { status: 'refunded' }),
    );
  });

  it('regular user CANNOT delete donations', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'alice');
    await assertFails(deleteDoc(doc(db, 'donations', 'don-alice-1')));
  });

  it('super-admin CAN delete donations', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'root');
    await assertSucceeds(deleteDoc(doc(db, 'donations', 'don-alice-1')));
  });
});
