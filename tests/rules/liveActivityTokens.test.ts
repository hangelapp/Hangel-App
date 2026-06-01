/**
 * Security rule tests for `/liveActivityTokens/{tokenId}` (iOS Live Activity).
 *
 * Declared rules (see firestore.rules):
 *   match /liveActivityTokens/{tokenId} {
 *     allow read: if isSignedIn() && (request.auth.uid == resource.data.uid || isSuperAdmin());
 *     allow list: if isSuperAdmin();
 *     allow create: if isSignedIn() && request.resource.data.uid == request.auth.uid;
 *     allow update, delete: if isSignedIn() && resource.data.uid == request.auth.uid;
 *   }
 *
 * Test goals:
 *  - Caller can only create token docs bound to their own uid (spoof prevention)
 *  - Owner can read/update/delete their own token
 *  - Non-owner cannot read another user's token
 *  - Super-admin can read any & list all (admin observability)
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

describe.skipIf(!emulatorUp)('firestore.rules — /liveActivityTokens/{tokenId}', () => {
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
      await db.collection('liveActivityTokens').doc('tok-alice').set({
        uid: 'alice',
        apnsToken: 'apns-alice-xyz',
        createdAt: new Date(),
      });
      await db.collection('liveActivityTokens').doc('tok-bob').set({
        uid: 'bob',
        apnsToken: 'apns-bob-xyz',
        createdAt: new Date(),
      });
    });
  });

  // ----- CREATE -----

  it('signed-in user CAN create a token bound to their own uid', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'carol');
    await assertSucceeds(
      setDoc(doc(db, 'liveActivityTokens/tok-carol'), {
        uid: 'carol',
        apnsToken: 'apns-carol',
        createdAt: new Date(),
      }),
    );
  });

  it('signed-in user CANNOT create a token spoofing another uid', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'mallory');
    await assertFails(
      setDoc(doc(db, 'liveActivityTokens/tok-spoof'), {
        uid: 'alice', // not mallory
        apnsToken: 'apns-fake',
        createdAt: new Date(),
      }),
    );
  });

  it('anonymous CANNOT create a token', async () => {
    const env = await getTestEnv();
    const db = unauthedDb(env);
    await assertFails(
      setDoc(doc(db, 'liveActivityTokens/tok-anon'), {
        uid: 'anon',
        apnsToken: 'x',
        createdAt: new Date(),
      }),
    );
  });

  // ----- READ -----

  it('owner CAN read their own token', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'alice');
    await assertSucceeds(getDoc(doc(db, 'liveActivityTokens/tok-alice')));
  });

  it('non-owner CANNOT read another user token', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'alice');
    await assertFails(getDoc(doc(db, 'liveActivityTokens/tok-bob')));
  });

  it('super-admin CAN read any token', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'root', { role: 'super-admin' });
    await assertSucceeds(getDoc(doc(db, 'liveActivityTokens/tok-alice')));
  });

  it('anonymous CANNOT read tokens', async () => {
    const env = await getTestEnv();
    const db = unauthedDb(env);
    await assertFails(getDoc(doc(db, 'liveActivityTokens/tok-alice')));
  });

  // ----- LIST -----

  it('regular user CANNOT list all tokens', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'alice');
    await assertFails(getDocs(collection(db, 'liveActivityTokens')));
  });

  it('super-admin CAN list all tokens', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'root', { role: 'super-admin' });
    await assertSucceeds(getDocs(collection(db, 'liveActivityTokens')));
  });

  // ----- UPDATE -----

  it('owner CAN update their own token (e.g. refresh APNs token)', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'alice');
    await assertSucceeds(
      updateDoc(doc(db, 'liveActivityTokens/tok-alice'), { apnsToken: 'rotated' }),
    );
  });

  it('non-owner CANNOT update another user token', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'alice');
    await assertFails(
      updateDoc(doc(db, 'liveActivityTokens/tok-bob'), { apnsToken: 'hijack' }),
    );
  });

  // ----- DELETE -----

  it('owner CAN delete their own token', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'alice');
    await assertSucceeds(deleteDoc(doc(db, 'liveActivityTokens/tok-alice')));
  });

  it('non-owner CANNOT delete another user token', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'alice');
    await assertFails(deleteDoc(doc(db, 'liveActivityTokens/tok-bob')));
  });

  it('super-admin CAN delete any token (via global allPaths write rule)', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'root', { role: 'super-admin' });
    await assertSucceeds(deleteDoc(doc(db, 'liveActivityTokens/tok-bob')));
  });
});
