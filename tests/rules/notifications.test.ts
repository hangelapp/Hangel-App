/**
 * Security rule tests for `/notifications/{notifId}` (Wave 5A / PDF-30b).
 *
 * Super-admin (örn. yetkilendirme + emergency broadcast akışları) başka bir
 * userId için bildirim yazabilmelidir; normal kullanıcı sadece kendi
 * createdBy'sıyla 'invitation' veya 'donation' tipi bildirim yazabilir.
 *
 * Declared rules (see firestore.rules):
 *   match /notifications/{notifId} {
 *     allow list: if isSignedIn();
 *     allow read: if isSignedIn() && (
 *       resource == null || resource.data.userId == request.auth.uid || isSuperAdmin()
 *     );
 *     allow create: if isSuperAdmin() || (
 *       isSignedIn() && request.resource.data.createdBy == request.auth.uid &&
 *       request.resource.data.type in ['invitation', 'donation']
 *     );
 *     allow update: if isSignedIn() && resource.data.userId == request.auth.uid &&
 *       request.resource.data.diff(resource.data).affectedKeys().hasOnly(['read', 'readAt']);
 *     allow delete: if isSuperAdmin() || (isSignedIn() && resource.data.userId == request.auth.uid);
 *   }
 *
 * Süper-admin update path ayrıca global allPaths {{ allow write: if isSuperAdmin() }}
 * üzerinden geçer — rules additive.
 */
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import { doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
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

describe.skipIf(!emulatorUp)('firestore.rules — /notifications/{notifId}', () => {
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
      // mevcut bildirim: alıcısı u1, üreticisi root
      await db.collection('notifications').doc('n-existing').set({
        userId: 'u1',
        createdBy: 'root',
        type: 'invitation',
        title: 'Davet',
        body: 'NGO daveti',
        read: false,
        createdAt: new Date(),
      });
    });
  });

  // ----- CREATE -----

  it('super-admin CAN create notification for ANY userId', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'root', { role: 'super-admin' });
    await assertSucceeds(
      setDoc(doc(db, 'notifications/n1'), {
        userId: 'recipient-user',
        createdBy: 'root',
        type: 'authorization',
        title: 'Yetkilendirildiniz',
        body: 'NGO admin yetkisi verildi',
        read: false,
        createdAt: new Date(),
      }),
    );
  });

  it('super-admin CAN create emergency broadcast notification (arbitrary type) for any user', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'root', { role: 'super-admin' });
    await assertSucceeds(
      setDoc(doc(db, 'notifications/n-bcast'), {
        userId: 'subscriber-1',
        createdBy: 'root',
        type: 'emergency',
        title: 'Acil',
        body: 'Kan ihtiyacı',
        read: false,
        createdAt: new Date(),
      }),
    );
  });

  it('signed-in user CAN create their OWN invitation notification (createdBy == auth.uid)', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'ngo-admin');
    await assertSucceeds(
      setDoc(doc(db, 'notifications/n2'), {
        userId: 'invitee-1',
        createdBy: 'ngo-admin',
        type: 'invitation',
        title: 'Davet',
        body: 'STK daveti',
        read: false,
        createdAt: new Date(),
      }),
    );
  });

  it('signed-in user CAN create their OWN donation notification', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'donor');
    await assertSucceeds(
      setDoc(doc(db, 'notifications/n3'), {
        userId: 'donor',
        createdBy: 'donor',
        type: 'donation',
        title: 'Teşekkürler',
        body: 'Bağışınız alındı',
        read: false,
        createdAt: new Date(),
      }),
    );
  });

  it('signed-in user CANNOT create notification with someone else as createdBy', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'attacker');
    await assertFails(
      setDoc(doc(db, 'notifications/n4'), {
        userId: 'victim',
        createdBy: 'innocent-other',
        type: 'invitation',
        title: 'Fake',
        body: 'spoofed',
        read: false,
        createdAt: new Date(),
      }),
    );
  });

  it('signed-in user CANNOT create non-invitation/donation type (e.g. authorization)', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'random-user');
    await assertFails(
      setDoc(doc(db, 'notifications/n5'), {
        userId: 'random-user',
        createdBy: 'random-user',
        type: 'authorization',
        title: 'Self-promote',
        body: 'I am super-admin',
        read: false,
        createdAt: new Date(),
      }),
    );
  });

  it('anonymous CANNOT create any notification', async () => {
    const env = await getTestEnv();
    const db = unauthedDb(env);
    await assertFails(
      setDoc(doc(db, 'notifications/n6'), {
        userId: 'anyone',
        createdBy: 'anyone',
        type: 'invitation',
        title: 'anon',
        body: 'anon',
        read: false,
        createdAt: new Date(),
      }),
    );
  });

  // ----- UPDATE -----

  it('recipient CAN mark their own notification as read (only read/readAt keys)', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'u1');
    await assertSucceeds(
      updateDoc(doc(db, 'notifications/n-existing'), {
        read: true,
        readAt: new Date(),
      }),
    );
  });

  it('recipient CANNOT update non-read fields of their notification', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'u1');
    await assertFails(
      updateDoc(doc(db, 'notifications/n-existing'), {
        title: 'edited',
      }),
    );
  });

  it('other user CANNOT mark someone else notification as read', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'u2');
    await assertFails(
      updateDoc(doc(db, 'notifications/n-existing'), {
        read: true,
        readAt: new Date(),
      }),
    );
  });

  // ----- DELETE -----

  it('recipient CAN delete their own notification', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'u1');
    await assertSucceeds(deleteDoc(doc(db, 'notifications/n-existing')));
  });

  it('non-recipient CANNOT delete notification', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'u2');
    await assertFails(deleteDoc(doc(db, 'notifications/n-existing')));
  });

  it('super-admin CAN delete any notification', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'root', { role: 'super-admin' });
    await assertSucceeds(deleteDoc(doc(db, 'notifications/n-existing')));
  });
});
