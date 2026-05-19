/**
 * Security rule tests for `/surveys/{surveyId}` and `/ratings/{ratingId}`.
 *
 * Wave 6E finding (PDF-81b): anketler/rating'ler ANONIM yazıma kapalı olmalı.
 * "bilinmeyen kullanıcı olmamalı — giriş yapabiliyorsa adı soyadı yer almalı."
 *
 * Declared rules (see firestore.rules):
 *   match /surveys/{surveyId} {
 *     allow list, read: if isSuperAdmin();
 *     allow create: if isSignedIn() && request.resource.data.userId == request.auth.uid;
 *     allow update, delete: if isSuperAdmin();
 *   }
 *   match /ratings/{ratingId} { ... aynı şablon ... }
 *
 * Bu test suite mevcut davranışı kilitler; bir gerileme rule'u gevşetmeye
 * çalışırsa burada görünür hata verecek.
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

describe.skipIf(!emulatorUp)('firestore.rules — /surveys + /ratings (anon write guard)', () => {
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

  // ----- /surveys -----

  it('anonymous CANNOT create a survey response', async () => {
    const env = await getTestEnv();
    const db = unauthedDb(env);
    await assertFails(
      setDoc(doc(db, 'surveys/s1'), {
        userId: 'someone',
        answer: 'foo',
        createdAt: new Date(),
      }),
    );
  });

  it('signed-in user CAN create their OWN survey response (userId == auth.uid)', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'u1');
    await assertSucceeds(
      setDoc(doc(db, 'surveys/s1'), {
        userId: 'u1',
        answer: 'foo',
        createdAt: new Date(),
      }),
    );
  });

  it('signed-in user CANNOT forge survey userId (impersonate another user)', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'u1');
    await assertFails(
      setDoc(doc(db, 'surveys/s2'), {
        userId: 'u2',
        answer: 'forged',
        createdAt: new Date(),
      }),
    );
  });

  it('signed-in user CANNOT create survey response without userId field', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'u1');
    await assertFails(
      setDoc(doc(db, 'surveys/s3'), {
        answer: 'no-user-id',
        createdAt: new Date(),
      }),
    );
  });

  // ----- /ratings -----

  it('anonymous CANNOT create a rating', async () => {
    const env = await getTestEnv();
    const db = unauthedDb(env);
    await assertFails(
      setDoc(doc(db, 'ratings/r1'), {
        userId: 'someone',
        stars: 5,
        createdAt: new Date(),
      }),
    );
  });

  it('signed-in user CAN create their OWN rating', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'u1');
    await assertSucceeds(
      setDoc(doc(db, 'ratings/r1'), {
        userId: 'u1',
        stars: 5,
        comment: 'great',
        createdAt: new Date(),
      }),
    );
  });

  it('signed-in user CANNOT forge rating userId', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'u1');
    await assertFails(
      setDoc(doc(db, 'ratings/r2'), {
        userId: 'u2',
        stars: 1,
        createdAt: new Date(),
      }),
    );
  });
});
