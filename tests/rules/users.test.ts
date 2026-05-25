/**
 * Security rule tests for `/users/{userId}`.
 *
 * Rules being asserted (see firestore.rules — SEC-2026-05-25 hardened):
 *   allow read:   if isSignedIn();
 *   allow create: if isSignedIn() && isOwner(userId) &&
 *                  (no privileged role or managed*Id fields);
 *   allow update: if isSuperAdmin() || (isOwner(userId) &&
 *                  no diff in role/managed*Id/superAdminPermissions);
 *   allow delete: if isSuperAdmin();
 *
 * SEC-2026-05-25 prevents privilege escalation: a regular user can no longer
 * self-assign `role: 'super-admin'`, `managedNgoId: '<orgId>'`, etc., which
 * would have hijacked NGO/brand/club update rules + ngoSenders + messaging.
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

  it('signed-in user can create their own /users doc (no privileged fields)', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'newuser');
    await assertSucceeds(
      setDoc(doc(db, 'users', 'newuser'), { name: 'New', role: 'user' }),
    );
  });

  it('signed-in user CANNOT create /users doc for someone else', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'mallory');
    await assertFails(
      setDoc(doc(db, 'users', 'victim'), { name: 'Victim' }),
    );
  });

  // SEC-2026-05-25: privilege escalation blockers on CREATE
  it('signed-in user CANNOT self-create with role=super-admin', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'mallory');
    await assertFails(
      setDoc(doc(db, 'users', 'mallory'), { name: 'Mallory', role: 'super-admin' }),
    );
  });

  it('signed-in user CANNOT self-create with managedNgoId set', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'mallory');
    await assertFails(
      setDoc(doc(db, 'users', 'mallory'), { name: 'Mallory', managedNgoId: 'victim-ngo' }),
    );
  });

  it('signed-in user CANNOT self-create with superAdminPermissions', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'mallory');
    await assertFails(
      setDoc(doc(db, 'users', 'mallory'), { name: 'Mallory', superAdminPermissions: ['*'] }),
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

  // SEC-2026-05-25: privilege escalation blockers on UPDATE
  it('owner CANNOT self-update to role=super-admin', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'alice');
    await assertFails(
      updateDoc(doc(db, 'users', 'alice'), { role: 'super-admin' }),
    );
  });

  it('owner CANNOT self-update managedNgoId (NGO hijack vector)', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'alice');
    await assertFails(
      updateDoc(doc(db, 'users', 'alice'), { managedNgoId: 'victim-ngo' }),
    );
  });

  it('owner CANNOT self-update managedBrandId', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'alice');
    await assertFails(
      updateDoc(doc(db, 'users', 'alice'), { managedBrandId: 'victim-brand' }),
    );
  });

  it('owner CANNOT self-update managedClubId', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'alice');
    await assertFails(
      updateDoc(doc(db, 'users', 'alice'), { managedClubId: 'victim-club' }),
    );
  });

  it('owner CANNOT self-update superAdminPermissions', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'alice');
    await assertFails(
      updateDoc(doc(db, 'users', 'alice'), { superAdminPermissions: ['*'] }),
    );
  });

  it('super-admin CAN update role/managedNgoId (legitimate flow)', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'root', { role: 'super-admin' });
    await assertSucceeds(
      updateDoc(doc(db, 'users', 'alice'), { role: 'ngo-admin', managedNgoId: 'foo-ngo' }),
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
