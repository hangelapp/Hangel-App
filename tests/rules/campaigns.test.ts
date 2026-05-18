/**
 * Security rule tests for messaging campaigns and related super-admin-only
 * collections.
 *
 * Declared rules (see firestore.rules):
 *   /campaigns/{campaignId}                 allow list, read: if isSuperAdmin();
 *   /campaigns/{cid}/recipients/{rid}        allow list, read: if isSuperAdmin();
 *   /messageTemplates/{tplId}                allow list, read: if isSuperAdmin();
 *   /recipientSegments/{segId}               allow list, read: if isSuperAdmin();
 *   /messagingProviders/{key}                allow list, read: if isSuperAdmin();
 *   /messageJobs/{id}                        allow read, write: if false; (server-only)
 *   /deliveryEvents/{id}                     allow read, write: if false;
 *   /messagingAuditLogs/{id}                 allow list, read: if isSuperAdmin();
 *                                            allow create/update/delete: if false;
 *
 * Writes to campaigns and templates are governed by the catch-all global rule:
 *   match /{allPaths=**} { allow write: if isSuperAdmin(); }
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

describe.skipIf(!emulatorUp)('firestore.rules — messaging campaigns', () => {
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
      await db
        .collection('users')
        .doc('root')
        .set({ role: 'super-admin' });
      await db
        .collection('campaigns')
        .doc('camp1')
        .set({ name: 'Welcome blast', status: 'draft' });
      await db
        .collection('campaigns')
        .doc('camp1')
        .collection('recipients')
        .doc('r1')
        .set({ phone: '+900000000000' });
      await db
        .collection('messageTemplates')
        .doc('tpl1')
        .set({ name: 'Greeting', body: 'Hello {{name}}' });
      await db
        .collection('recipientSegments')
        .doc('seg1')
        .set({ name: 'All Users' });
      await db
        .collection('messageJobs')
        .doc('job1')
        .set({ status: 'queued' });
      await db
        .collection('messagingAuditLogs')
        .doc('log1')
        .set({ event: 'send' });
    });
  });

  describe('/campaigns', () => {
    it('anonymous CANNOT read a campaign', async () => {
      const env = await getTestEnv();
      const db = unauthedDb(env);
      await assertFails(getDoc(doc(db, 'campaigns', 'camp1')));
    });

    it('regular signed-in user CANNOT read a campaign', async () => {
      const env = await getTestEnv();
      const db = authedAs(env, 'alice');
      await assertFails(getDoc(doc(db, 'campaigns', 'camp1')));
    });

    it('regular user CANNOT list campaigns', async () => {
      const env = await getTestEnv();
      const db = authedAs(env, 'alice');
      await assertFails(getDocs(collection(db, 'campaigns')));
    });

    it('super-admin CAN read a campaign', async () => {
      const env = await getTestEnv();
      const db = authedAs(env, 'root');
      await assertSucceeds(getDoc(doc(db, 'campaigns', 'camp1')));
    });

    it('super-admin CAN list campaigns', async () => {
      const env = await getTestEnv();
      const db = authedAs(env, 'root');
      await assertSucceeds(getDocs(collection(db, 'campaigns')));
    });

    it('super-admin CAN create a campaign (via global write rule)', async () => {
      const env = await getTestEnv();
      const db = authedAs(env, 'root');
      await assertSucceeds(
        setDoc(doc(db, 'campaigns', 'camp2'), {
          name: 'Newsletter',
          status: 'draft',
        }),
      );
    });

    it('regular user CANNOT create a campaign', async () => {
      const env = await getTestEnv();
      const db = authedAs(env, 'alice');
      await assertFails(
        setDoc(doc(db, 'campaigns', 'campX'), {
          name: 'rogue',
          status: 'draft',
        }),
      );
    });

    it('super-admin CAN update a campaign', async () => {
      const env = await getTestEnv();
      const db = authedAs(env, 'root');
      await assertSucceeds(
        updateDoc(doc(db, 'campaigns', 'camp1'), { status: 'sent' }),
      );
    });

    it('super-admin CAN delete a campaign', async () => {
      const env = await getTestEnv();
      const db = authedAs(env, 'root');
      await assertSucceeds(deleteDoc(doc(db, 'campaigns', 'camp1')));
    });

    it('regular user CANNOT read campaign recipients subcollection', async () => {
      const env = await getTestEnv();
      const db = authedAs(env, 'alice');
      await assertFails(
        getDoc(doc(db, 'campaigns', 'camp1', 'recipients', 'r1')),
      );
    });

    it('super-admin CAN read campaign recipients subcollection', async () => {
      const env = await getTestEnv();
      const db = authedAs(env, 'root');
      await assertSucceeds(
        getDoc(doc(db, 'campaigns', 'camp1', 'recipients', 'r1')),
      );
    });
  });

  describe('/messageTemplates and /recipientSegments', () => {
    it('regular user CANNOT read message templates', async () => {
      const env = await getTestEnv();
      const db = authedAs(env, 'alice');
      await assertFails(getDoc(doc(db, 'messageTemplates', 'tpl1')));
    });

    it('super-admin CAN read message templates', async () => {
      const env = await getTestEnv();
      const db = authedAs(env, 'root');
      await assertSucceeds(getDoc(doc(db, 'messageTemplates', 'tpl1')));
    });

    it('regular user CANNOT read recipient segments', async () => {
      const env = await getTestEnv();
      const db = authedAs(env, 'alice');
      await assertFails(getDoc(doc(db, 'recipientSegments', 'seg1')));
    });
  });

  describe('server-only collections', () => {
    it('super-admin CANNOT read /messageJobs (server-only)', async () => {
      const env = await getTestEnv();
      const db = authedAs(env, 'root');
      await assertFails(getDoc(doc(db, 'messageJobs', 'job1')));
    });

    it('super-admin CANNOT write /messageJobs (server-only)', async () => {
      const env = await getTestEnv();
      const db = authedAs(env, 'root');
      await assertFails(
        setDoc(doc(db, 'messageJobs', 'job2'), { status: 'queued' }),
      );
    });

    it('super-admin CAN read messagingAuditLogs but CANNOT write them', async () => {
      const env = await getTestEnv();
      const db = authedAs(env, 'root');
      await assertSucceeds(getDoc(doc(db, 'messagingAuditLogs', 'log1')));
      await assertFails(
        setDoc(doc(db, 'messagingAuditLogs', 'logNew'), { event: 'send' }),
      );
    });
  });
});
