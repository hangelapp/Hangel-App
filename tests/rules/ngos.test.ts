/**
 * Security rule tests for `/ngos/{ngoId}`.
 *
 * Declared rules (see firestore.rules):
 *   allow read, list: if true;
 *   allow update: if request.resource.data.diff(resource.data).affectedKeys().hasOnly(['viewCount']);
 *
 * In addition, the catch-all `/{allPaths=**} { allow write: if isSuperAdmin(); }`
 * lets a super-admin do any other writes.
 *
 * Notes:
 *   - The repo does not define a separate "ngo-admin" role for `/ngos` writes;
 *     general updates other than `viewCount` are gated to super-admin only.
 *     The tests below verify the actual rules behavior rather than inventing
 *     non-existent rules.
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

describe.skipIf(!emulatorUp)('firestore.rules — /ngos/{ngoId}', () => {
  beforeAll(async () => {
    await getTestEnv();
  });

  afterAll(async () => {
    await cleanupTestEnv();
  });

  beforeEach(async () => {
    const env = await getTestEnv();
    await env.clearFirestore();
    // Super-admin actor "root" is authenticated via the `role: 'super-admin'`
    // custom claim — no user doc fixture required (P0-4).
    await adminSeed(env, async (ctx) => {
      const db = ctx.firestore();
      await db
        .collection('ngos')
        .doc('ngo1')
        .set({ name: 'NGO One', viewCount: 0, ownerUid: 'ngoadmin' });
    });
  });

  it('anyone (unauth) CAN read a single NGO doc', async () => {
    const env = await getTestEnv();
    const db = unauthedDb(env);
    await assertSucceeds(getDoc(doc(db, 'ngos', 'ngo1')));
  });

  it('anyone (unauth) CAN list NGOs (public marketplace)', async () => {
    const env = await getTestEnv();
    const db = unauthedDb(env);
    await assertSucceeds(getDocs(collection(db, 'ngos')));
  });

  it('anyone CAN increment viewCount only', async () => {
    const env = await getTestEnv();
    const db = unauthedDb(env);
    await assertSucceeds(
      updateDoc(doc(db, 'ngos', 'ngo1'), { viewCount: 1 }),
    );
  });

  it('anonymous user CANNOT update non-viewCount fields', async () => {
    const env = await getTestEnv();
    const db = unauthedDb(env);
    await assertFails(
      updateDoc(doc(db, 'ngos', 'ngo1'), { name: 'Hijacked' }),
    );
  });

  it('signed-in non-admin user CANNOT update non-viewCount fields', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'alice');
    await assertFails(
      updateDoc(doc(db, 'ngos', 'ngo1'), { name: 'Hijacked' }),
    );
  });

  it('signed-in non-admin user CANNOT create a new NGO', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'alice');
    await assertFails(
      setDoc(doc(db, 'ngos', 'ngoNew'), { name: 'Stealth NGO', viewCount: 0 }),
    );
  });

  it('signed-in non-admin user CANNOT delete an NGO', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'alice');
    await assertFails(deleteDoc(doc(db, 'ngos', 'ngo1')));
  });

  it('super-admin CAN create new NGOs (via global write rule)', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'root', { role: 'super-admin' });
    await assertSucceeds(
      setDoc(doc(db, 'ngos', 'ngoNew'), { name: 'Admin NGO', viewCount: 0 }),
    );
  });

  it('super-admin CAN delete NGOs', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'root', { role: 'super-admin' });
    await assertSucceeds(deleteDoc(doc(db, 'ngos', 'ngo1')));
  });
});
