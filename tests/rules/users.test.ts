/**
 * Security rule tests for `/users/{userId}`.
 *
 * Rules being asserted (see firestore.rules):
 *   allow read:   if isSignedIn();
 *   allow create: if isSignedIn();
 *   allow update: if isSignedIn() && (isOwner(userId) || isSuperAdmin());
 *   allow delete: if isSuperAdmin();
 *
 * Notes:
 *   - After P0-4, `isSuperAdmin()` checks ONLY the `request.auth.token.role ==
 *     'super-admin'` custom claim. The hard-coded email literal and the
 *     Firestore-doc fallback have both been removed. Super-admin actors are
 *     authenticated via `authedAs(env, uid, { role: 'super-admin' })`.
 */
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import { doc, getDoc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
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

describe.skipIf(!emulatorUp)('firestore.rules — /users/{uid}', () => {
  beforeAll(async () => {
    await getTestEnv();
  });

  afterAll(async () => {
    await cleanupTestEnv();
  });

  beforeEach(async () => {
    const env = await getTestEnv();
    await env.clearFirestore();
    // Seed: a regular user "alice". The super-admin actor "root" is
    // authenticated solely via the `role: 'super-admin'` custom claim — no
    // user doc fixture required.
    await adminSeed(env, async (ctx) => {
      const db = ctx.firestore();
      await db
        .collection('users')
        .doc('alice')
        .set({ name: 'Alice', role: 'user' });
      await db
        .collection('users')
        .doc('root')
        .set({ name: 'Root' });
    });
  });

  it('signed-in user can read their own /users doc', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'alice');
    await assertSucceeds(getDoc(doc(db, 'users', 'alice')));
  });

  it('signed-in user can read other /users docs (rules permit any signed-in read)', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'alice');
    await assertSucceeds(getDoc(doc(db, 'users', 'root')));
  });

  it('anonymous user CANNOT read /users docs', async () => {
    const env = await getTestEnv();
    const db = unauthedDb(env);
    await assertFails(getDoc(doc(db, 'users', 'alice')));
  });

  it('anonymous user CANNOT write to /users docs', async () => {
    const env = await getTestEnv();
    const db = unauthedDb(env);
    await assertFails(
      setDoc(doc(db, 'users', 'mallory'), { name: 'Mallory' }),
    );
  });

  it('signed-in user can create their own /users doc', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'newuser');
    await assertSucceeds(
      setDoc(doc(db, 'users', 'newuser'), { name: 'New', role: 'user' }),
    );
  });

  it('owner can update their own /users doc', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'alice');
    await assertSucceeds(
      updateDoc(doc(db, 'users', 'alice'), { name: 'Alice Updated' }),
    );
  });

  it('non-owner CANNOT update another /users doc', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'alice');
    await assertFails(
      updateDoc(doc(db, 'users', 'root'), { name: 'Pwned' }),
    );
  });

  it('super-admin (role claim) CAN update any /users doc', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'root', { role: 'super-admin' });
    await assertSucceeds(
      updateDoc(doc(db, 'users', 'alice'), { name: 'Alice (admin edit)' }),
    );
  });

  it('regular signed-in user CANNOT delete a /users doc', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'alice');
    await assertFails(deleteDoc(doc(db, 'users', 'alice')));
  });

  it('super-admin CAN delete /users docs', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'root', { role: 'super-admin' });
    await assertSucceeds(deleteDoc(doc(db, 'users', 'alice')));
  });

  it('another super-admin (different uid, same claim) CAN update /users docs', async () => {
    // Any uid bearing the `role: 'super-admin'` custom claim is authorized —
    // no per-uid allowlist anymore.
    const env = await getTestEnv();
    const db = authedAs(env, 'otheradmin', { role: 'super-admin' });
    await assertSucceeds(
      updateDoc(doc(db, 'users', 'alice'), { name: 'edited-by-other-admin' }),
    );
  });
});
