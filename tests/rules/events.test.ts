/**
 * Security rule tests for `/events/{eventId}` (PDF-19a-events-rules).
 *
 * Wave 4B finding: super-admin approve/reject/delete handlers in
 * `/super-admin/events/page.tsx` issue `updateDoc({ status, approvedBy })`
 * and `deleteDoc()` against `events/{id}`. The specific
 * `match /events/{eventId}` block was missing a super-admin branch, so the
 * `/{allPaths=**} { write: isSuperAdmin() }` catch-all was being overridden
 * by the more-specific match (Firestore specificity precedence) and writes
 * were denied.
 *
 * Declared rules (see firestore.rules):
 *   match /events/{eventId} {
 *     allow read, list: if true;
 *     allow create: if isSignedIn() &&
 *       request.resource.data.status == 'Beklemede' &&
 *       (request.resource.data.organizerId == request.auth.uid ||
 *        users/{uid}.managedClubId == organizerId);
 *     allow update: if isSuperAdmin() || (
 *       isSignedIn() && resource.data.organizerId == request.auth.uid &&
 *       !diff(resource).affectedKeys().hasAny(['status'])
 *     );
 *     allow delete: if isSuperAdmin() || (
 *       isSignedIn() && resource.data.organizerId == request.auth.uid
 *     );
 *   }
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

describe.skipIf(!emulatorUp)('firestore.rules — /events/{eventId}', () => {
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
      // Seed an event owned by 'organizer-1' in 'Beklemede' (pending) state.
      await db.collection('events').doc('e1').set({
        organizerId: 'organizer-1',
        title: 'Test event',
        status: 'Beklemede',
        createdAt: new Date(),
      });
    });
  });

  // ----- READ -----

  it('anonymous CAN read an event (public listings)', async () => {
    const env = await getTestEnv();
    const db = unauthedDb(env);
    await assertSucceeds(getDoc(doc(db, 'events/e1')));
  });

  // ----- CREATE -----

  it('anonymous CANNOT create an event', async () => {
    const env = await getTestEnv();
    const db = unauthedDb(env);
    await assertFails(
      setDoc(doc(db, 'events/e2'), {
        organizerId: 'anyone',
        title: 'x',
        status: 'Beklemede',
        createdAt: new Date(),
      }),
    );
  });

  it('signed-in user CANNOT create an event with another user as organizerId (forgery)', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'u-attacker');
    await assertFails(
      setDoc(doc(db, 'events/e3'), {
        organizerId: 'organizer-1', // forging someone else's id
        title: 'forged',
        status: 'Beklemede',
        createdAt: new Date(),
      }),
    );
  });

  // ----- UPDATE -----

  it('organizer CAN update non-status fields of their own event', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'organizer-1');
    await assertSucceeds(
      updateDoc(doc(db, 'events/e1'), { title: 'renamed' }),
    );
  });

  it('organizer CANNOT update the status of their own event (super-admin only)', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'organizer-1');
    await assertFails(
      updateDoc(doc(db, 'events/e1'), { status: 'Onaylandı' }),
    );
  });

  it('signed-in non-organizer CANNOT update an event', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'u-other');
    await assertFails(
      updateDoc(doc(db, 'events/e1'), { title: 'hijack' }),
    );
  });

  it('super-admin CAN update the status of any event (approval flow)', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'root', { role: 'super-admin' });
    await assertSucceeds(
      updateDoc(doc(db, 'events/e1'), {
        status: 'Onaylandı',
        approvedBy: 'root',
      }),
    );
  });

  // ----- DELETE -----

  it('organizer CAN delete their own event', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'organizer-1');
    await assertSucceeds(deleteDoc(doc(db, 'events/e1')));
  });

  it('signed-in non-organizer CANNOT delete someone else\'s event', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'u-other');
    await assertFails(deleteDoc(doc(db, 'events/e1')));
  });

  it('super-admin CAN delete any event', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'root', { role: 'super-admin' });
    await assertSucceeds(deleteDoc(doc(db, 'events/e1')));
  });
});
