/**
 * Security rule tests for `/fundApplications/{appId}` (PDF-17 backing).
 *
 * Declared rules (see firestore.rules):
 *   - read: applicant OR managedNgo admin (via users/{uid}.managedNgoId match
 *     applicantNgoId) OR super-admin
 *   - list: super-admin OR signed-in (limit <= 100)
 *   - create: signed-in AND applicantId == auth.uid AND status == 'Beklemede'
 *     AND keys hasAll [applicantId, fundId, status, createdAt]
 *   - update: super-admin OR (applicant on own draft/Beklemede, no status change)
 *   - delete: super-admin only
 */
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  collection,
} from 'firebase/firestore';
import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';

import {
  adminSeed,
  authedAs,
  cleanupTestEnv,
  getTestEnv,
  isEmulatorRunning,
} from './setup';

const emulatorUp = await isEmulatorRunning();

describe.skipIf(!emulatorUp)('firestore.rules — /fundApplications/{appId}', () => {
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
      // Applicant alice manages 'ngo-a'
      await db.collection('users').doc('alice').set({ managedNgoId: 'ngo-a' });
      // Bob does not manage any NGO
      await db.collection('users').doc('bob').set({});
      // Carol manages 'ngo-b'
      await db.collection('users').doc('carol').set({ managedNgoId: 'ngo-b' });
      // Existing application by alice for ngo-a
      await db.collection('fundApplications').doc('app1').set({
        applicantId: 'alice',
        applicantNgoId: 'ngo-a',
        fundId: 'fund-1',
        fundName: 'Test Fund',
        status: 'Beklemede',
        createdAt: new Date(),
        message: '',
      });
    });
  });

  it('applicant CAN read their own application', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'alice');
    await assertSucceeds(getDoc(doc(db, 'fundApplications', 'app1')));
  });

  it('NGO admin of applicantNgoId CAN read application', async () => {
    // alice already manages ngo-a; let's seed another doc owned by a different uid
    // but still under ngo-a so alice still qualifies via managedNgoId fallback.
    const env = await getTestEnv();
    await adminSeed(env, async (ctx) => {
      await ctx.firestore().collection('fundApplications').doc('app2').set({
        applicantId: 'someoneElse',
        applicantNgoId: 'ngo-a',
        fundId: 'fund-2',
        status: 'Beklemede',
        createdAt: new Date(),
      });
    });
    const db = authedAs(env, 'alice');
    await assertSucceeds(getDoc(doc(db, 'fundApplications', 'app2')));
  });

  it('unrelated signed-in user CANNOT read application', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'bob');
    await assertFails(getDoc(doc(db, 'fundApplications', 'app1')));
  });

  it('NGO admin of a different NGO CANNOT read', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'carol');
    await assertFails(getDoc(doc(db, 'fundApplications', 'app1')));
  });

  it('super-admin CAN read any application', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'root', { role: 'super-admin' });
    await assertSucceeds(getDoc(doc(db, 'fundApplications', 'app1')));
  });

  it('applicant CAN create their own application with status=Beklemede', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'alice');
    await assertSucceeds(
      addDoc(collection(db, 'fundApplications'), {
        applicantId: 'alice',
        applicantNgoId: 'ngo-a',
        fundId: 'fund-3',
        status: 'Beklemede',
        createdAt: new Date(),
        message: '',
      }),
    );
  });

  it('user CANNOT create application impersonating another applicantId', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'bob');
    await assertFails(
      addDoc(collection(db, 'fundApplications'), {
        applicantId: 'alice', // forging
        fundId: 'fund-x',
        status: 'Beklemede',
        createdAt: new Date(),
      }),
    );
  });

  it('user CANNOT create application with a pre-approved status', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'alice');
    await assertFails(
      addDoc(collection(db, 'fundApplications'), {
        applicantId: 'alice',
        fundId: 'fund-4',
        status: 'Onaylandi', // forbidden initial state
        createdAt: new Date(),
      }),
    );
  });

  it('applicant CANNOT change own status field', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'alice');
    await assertFails(
      updateDoc(doc(db, 'fundApplications', 'app1'), { status: 'Onaylandi' }),
    );
  });

  it('applicant CAN edit message on own pending app', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'alice');
    await assertSucceeds(
      updateDoc(doc(db, 'fundApplications', 'app1'), { message: 'updated note' }),
    );
  });

  it('super-admin CAN update status', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'root', { role: 'super-admin' });
    await assertSucceeds(
      updateDoc(doc(db, 'fundApplications', 'app1'), { status: 'Onaylandi' }),
    );
  });

  it('non-super-admin CANNOT delete application', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'alice');
    await assertFails(deleteDoc(doc(db, 'fundApplications', 'app1')));
  });

  it('super-admin CAN delete application', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'root', { role: 'super-admin' });
    await assertSucceeds(deleteDoc(doc(db, 'fundApplications', 'app1')));
  });
});
