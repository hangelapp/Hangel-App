/**
 * Security rule tests for `/messages/{messageId}` (FEAT-ENTITY-INBOX).
 *
 * Birebir mesajlar: kullanıcı ↔ kullanıcı / STK / marka / kulüp. recipientId bir
 * kullanıcı uid'i ya da bir entity doc id'si olabilir. Entity'ye gelen mesajları o
 * entity'yi yöneten admin (users/{uid}.managed{Ngo,Brand,Club}Id == recipientId)
 * okuyabilmeli — kullanıcı gizliliğini gevşetmeden.
 *
 * Declared rules (see firestore.rules):
 *   match /messages/{messageId} {
 *     function recipientIsMyManagedEntity() { ... managed{Ngo,Brand,Club}Id == recipientId ... }
 *     allow read: if isSignedIn() && (
 *       resource == null || recipientId == auth.uid || senderId == auth.uid ||
 *       isSuperAdmin() || recipientIsMyManagedEntity()
 *     );
 *     allow list: if isSignedIn();  // per-doc gizlilik `read` ile garanti
 *     allow create: if isSignedIn() && request.resource.data.senderId == request.auth.uid;
 *     allow update: if isSignedIn() && diff.hasOnly(['readBy']) && (recipient || super || entityAdmin);
 *     allow delete: if isSuperAdmin();
 *   }
 */
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
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

describe.skipIf(!emulatorUp)('firestore.rules — /messages/{messageId}', () => {
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
      // Entity docs (recipientIsEntity create-check resolves these by doc id).
      await db.collection('ngos').doc('ngo-1').set({ name: 'STK Bir' });
      await db.collection('brands').doc('brand-1').set({ name: 'Marka Bir' });
      await db.collection('clubs').doc('club-1').set({ name: 'Kulüp Bir' });

      // Entity admin user docs (managed*Id fallback pattern + role)
      await db.collection('users').doc('ngo-admin').set({ managedNgoId: 'ngo-1', role: 'ngo-admin' });
      await db.collection('users').doc('brand-admin').set({ managedBrandId: 'brand-1', role: 'ngo-admin' });
      await db.collection('users').doc('club-admin').set({ managedClubId: 'club-1', role: 'ngo-admin' });
      // A Hangel yöneticisi (admin-role user) — valid DM recipient
      await db.collection('users').doc('hangel-admin').set({ role: 'admin' });
      // Plain users (role 'user' or absent) — NOT valid DM recipients
      await db.collection('users').doc('u1').set({ role: 'user' });
      await db.collection('users').doc('u2').set({ role: 'user' });
      await db.collection('users').doc('u3').set({ role: 'user' });
      await db.collection('users').doc('stranger').set({});

      // User → user message (sender u1, recipient u2)
      await db.collection('messages').doc('m-user').set({
        sender: { id: 'u1', name: 'User One', avatarUrl: null },
        senderId: 'u1',
        recipient: { id: 'u2', name: 'User Two', avatarUrl: null },
        recipientId: 'u2',
        subject: 'Selam', content: 'Merhaba', status: 'sent',
        timestamp: new Date(),
      });

      // User → entity message (recipient = ngo-1, brand-1, club-1)
      const entityMsg = (id: string, recipientId: string) =>
        db.collection('messages').doc(id).set({
          sender: { id: 'u1', name: 'User One', avatarUrl: null },
          senderId: 'u1',
          recipient: { id: recipientId, name: recipientId, avatarUrl: null },
          recipientId,
          subject: 'Kuruma soru', content: 'Bilgi rica ederim', status: 'sent',
          timestamp: new Date(),
        });
      await entityMsg('m-ngo', 'ngo-1');
      await entityMsg('m-brand', 'brand-1');
      await entityMsg('m-club', 'club-1');
    });
  });

  // ----- READ -----

  it('recipient (user) CAN read message addressed to them', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'u2');
    await assertSucceeds(getDoc(doc(db, 'messages/m-user')));
  });

  it('sender CAN read message they sent', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'u1');
    await assertSucceeds(getDoc(doc(db, 'messages/m-user')));
  });

  it('NGO admin CAN read message addressed to their managed NGO', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'ngo-admin');
    await assertSucceeds(getDoc(doc(db, 'messages/m-ngo')));
  });

  it('brand admin CAN read message addressed to their managed brand', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'brand-admin');
    await assertSucceeds(getDoc(doc(db, 'messages/m-brand')));
  });

  it('club admin CAN read message addressed to their managed club', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'club-admin');
    await assertSucceeds(getDoc(doc(db, 'messages/m-club')));
  });

  it('super-admin CAN read any message', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'root', { role: 'super-admin' });
    await assertSucceeds(getDoc(doc(db, 'messages/m-user')));
  });

  it('stranger CANNOT read a user-to-user message', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'stranger');
    await assertFails(getDoc(doc(db, 'messages/m-user')));
  });

  it('NGO admin CANNOT read a message addressed to a DIFFERENT entity', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'ngo-admin');
    await assertFails(getDoc(doc(db, 'messages/m-brand')));
  });

  it('anonymous CANNOT read any message', async () => {
    const env = await getTestEnv();
    const db = unauthedDb(env);
    await assertFails(getDoc(doc(db, 'messages/m-user')));
  });

  // ----- CREATE -----

  it('normal user CAN create a message to an ENTITY (ngo) — senderId == uid', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'u3');
    await assertSucceeds(
      setDoc(doc(db, 'messages/m-to-ngo'), {
        sender: { id: 'u3', name: 'User Three', avatarUrl: null },
        senderId: 'u3',
        recipient: { id: 'ngo-1', name: 'STK Bir', avatarUrl: null },
        recipientId: 'ngo-1',
        subject: 'Soru', content: 'Bilgi', status: 'sent',
        timestamp: new Date(),
      }),
    );
  });

  it('normal user CAN create a message to an ADMIN-role user (Hangel yöneticisi)', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'u3');
    await assertSucceeds(
      setDoc(doc(db, 'messages/m-to-admin'), {
        sender: { id: 'u3', name: 'User Three', avatarUrl: null },
        senderId: 'u3',
        recipient: { id: 'hangel-admin', name: 'Hangel', avatarUrl: null },
        recipientId: 'hangel-admin',
        subject: 'Destek', content: 'Yardım', status: 'sent',
        timestamp: new Date(),
      }),
    );
  });

  it('normal user CANNOT DM another NORMAL user (user→user DM disabled)', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'u3');
    await assertFails(
      setDoc(doc(db, 'messages/m-dm'), {
        sender: { id: 'u3', name: 'User Three', avatarUrl: null },
        senderId: 'u3',
        recipient: { id: 'u2', name: 'User Two', avatarUrl: null },
        recipientId: 'u2',
        subject: 'DM', content: 'merhaba', status: 'sent',
        timestamp: new Date(),
      }),
    );
  });

  it('normal user CANNOT message a non-existent recipient (not entity, not admin)', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'u3');
    await assertFails(
      setDoc(doc(db, 'messages/m-nowhere'), {
        sender: { id: 'u3', name: 'User Three', avatarUrl: null },
        senderId: 'u3',
        recipient: { id: 'ghost', name: 'Ghost', avatarUrl: null },
        recipientId: 'ghost',
        subject: 'x', content: 'x', status: 'sent',
        timestamp: new Date(),
      }),
    );
  });

  it('entity admin CAN reply to a normal user (existing thread preserved; senderIsEntityAdmin)', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'ngo-admin');
    await assertSucceeds(
      setDoc(doc(db, 'messages/m-reply'), {
        // Görsel gönderen entity; rule-güvenliği için senderId = admin uid
        sender: { id: 'ngo-1', name: 'STK Adı', avatarUrl: null },
        senderId: 'ngo-admin',
        recipient: { id: 'u1', name: 'User One', avatarUrl: null },
        recipientId: 'u1',
        subject: 'Re: Kuruma soru', content: 'Yanıt', status: 'sent',
        timestamp: new Date(),
      }),
    );
  });

  it('user CANNOT create a message spoofing someone else as senderId', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'attacker');
    await assertFails(
      setDoc(doc(db, 'messages/m-spoof'), {
        sender: { id: 'victim', name: 'Victim', avatarUrl: null },
        senderId: 'victim',
        recipient: { id: 'u2', name: 'User Two', avatarUrl: null },
        recipientId: 'u2',
        subject: 'Spoof', content: 'fake', status: 'sent',
        timestamp: new Date(),
      }),
    );
  });

  it('anonymous CANNOT create a message', async () => {
    const env = await getTestEnv();
    const db = unauthedDb(env);
    await assertFails(
      setDoc(doc(db, 'messages/m-anon'), {
        sender: { id: 'x', name: 'x', avatarUrl: null },
        senderId: 'x',
        recipient: { id: 'u2', name: 'y', avatarUrl: null },
        recipientId: 'u2',
        subject: 'anon', content: 'anon', status: 'sent',
        timestamp: new Date(),
      }),
    );
  });

  // ----- UPDATE (readBy only) -----

  it('recipient CAN mark a message read (readBy only)', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'u2');
    await assertSucceeds(
      updateDoc(doc(db, 'messages/m-user'), { readBy: { u2: new Date() } }),
    );
  });

  it('entity admin CAN mark an entity message read (readBy only)', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'ngo-admin');
    await assertSucceeds(
      updateDoc(doc(db, 'messages/m-ngo'), { readBy: { 'ngo-admin': new Date() } }),
    );
  });

  it('recipient CANNOT edit content via update (only readBy allowed)', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'u2');
    await assertFails(
      updateDoc(doc(db, 'messages/m-user'), { content: 'tampered' }),
    );
  });

  it('stranger CANNOT mark someone else message as read', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'stranger');
    await assertFails(
      updateDoc(doc(db, 'messages/m-user'), { readBy: { stranger: new Date() } }),
    );
  });

  // ----- DELETE -----

  it('recipient CANNOT delete a message; only super-admin can', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'u2');
    await assertFails(deleteDoc(doc(db, 'messages/m-user')));
  });

  it('super-admin CAN delete any message', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'root', { role: 'super-admin' });
    await assertSucceeds(deleteDoc(doc(db, 'messages/m-user')));
  });
});
