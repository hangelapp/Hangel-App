/**
 * Security rule tests for the migrated `isSuperAdmin()` helper which now
 * checks ONLY the `request.auth.token.role == 'super-admin'` custom claim
 * (P0-4: migration from hardcoded email literal).
 *
 * Target collection: /siteSettings/{docId}
 *   allow read, list: if true;
 *   allow create, update, delete: if isSuperAdmin();
 *
 * Three cases:
 *   1. unauthenticated user                          → write FAILS
 *   2. signed-in user without `role: 'super-admin'`  → write FAILS
 *   3. signed-in user WITH `role: 'super-admin'`     → write SUCCEEDS
 *
 * Requires the Firestore emulator. If unreachable, this suite is skipped via
 * `describe.skipIf(!emulatorUp)`.
 */
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import { doc, setDoc } from 'firebase/firestore';
import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';

import {
  authedAs,
  cleanupTestEnv,
  getTestEnv,
  isEmulatorRunning,
  unauthedDb,
} from './setup';

const emulatorUp = await isEmulatorRunning();

describe.skipIf(!emulatorUp)('firestore.rules — super-admin custom claim', () => {
  beforeAll(async () => {
    await getTestEnv();
  });

  afterAll(async () => {
    await cleanupTestEnv();
  });

  beforeEach(async () => {
    const env = await getTestEnv();
    await env.clearFirestore();
  });

  it('unauthenticated user CANNOT write to /siteSettings (super-admin-only)', async () => {
    const env = await getTestEnv();
    const db = unauthedDb(env);
    await assertFails(
      setDoc(doc(db, 'siteSettings', 'homepage'), { title: 'Hangel' }),
    );
  });

  it('signed-in user WITHOUT role claim CANNOT write to /siteSettings', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'alice'); // no claims
    await assertFails(
      setDoc(doc(db, 'siteSettings', 'homepage'), { title: 'Hangel' }),
    );
  });

  it('signed-in user WITH role: "super-admin" claim CAN write to /siteSettings', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'root', { role: 'super-admin' });
    await assertSucceeds(
      setDoc(doc(db, 'siteSettings', 'homepage'), { title: 'Hangel' }),
    );
  });
});
