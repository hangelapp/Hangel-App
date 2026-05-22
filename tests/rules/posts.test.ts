/**
 * Security rule tests for `/posts/{postId}/likes/{uid}` subcollection.
 *
 * PDF-7-likes-rule — replaces the old `posts.likedBy[]` array pattern (which
 * required the post author to own the write, blocking non-author likes).
 *
 * Declared rules (see firestore.rules):
 *   match /posts/{postId}/likes/{uid} {
 *     allow read, list: if true;
 *     allow create, delete: if isSignedIn() && request.auth.uid == uid;
 *     allow update: if false;
 *   }
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

describe.skipIf(!emulatorUp)('firestore.rules — /posts/{postId}/likes/{uid}', () => {
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
      // Seed a post (authored by 'author-1') with one existing like from 'u1'
      await db.collection('posts').doc('p1').set({
        authorId: 'author-1',
        content: 'hello',
        createdAt: new Date(),
      });
      await db.collection('posts').doc('p1').collection('likes').doc('u1').set({
        likedAt: new Date(),
      });
    });
  });

  it('anonymous CAN read a like doc (public like counts)', async () => {
    const env = await getTestEnv();
    const db = unauthedDb(env);
    await assertSucceeds(getDoc(doc(db, 'posts/p1/likes/u1')));
  });

  it('anonymous CAN list likes (public like counts)', async () => {
    const env = await getTestEnv();
    const db = unauthedDb(env);
    await assertSucceeds(getDocs(collection(db, 'posts/p1/likes')));
  });

  it('signed-in u2 CAN create their OWN like (likes doc id == auth uid)', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'u2');
    await assertSucceeds(
      setDoc(doc(db, 'posts/p1/likes/u2'), { likedAt: new Date() }),
    );
  });

  it('signed-in u1 CANNOT create a like impersonating u2', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'u1');
    await assertFails(
      setDoc(doc(db, 'posts/p1/likes/u2'), { likedAt: new Date() }),
    );
  });

  it('anonymous CANNOT create a like', async () => {
    const env = await getTestEnv();
    const db = unauthedDb(env);
    await assertFails(
      setDoc(doc(db, 'posts/p1/likes/anon'), { likedAt: new Date() }),
    );
  });

  it('signed-in u1 CAN delete their OWN like (unlike)', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'u1');
    await assertSucceeds(deleteDoc(doc(db, 'posts/p1/likes/u1')));
  });

  it('signed-in u2 CANNOT delete u1\'s like', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'u2');
    await assertFails(deleteDoc(doc(db, 'posts/p1/likes/u1')));
  });

  it('signed-in u1 CANNOT update their like doc (update is forbidden)', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'u1');
    await assertFails(
      updateDoc(doc(db, 'posts/p1/likes/u1'), { likedAt: new Date() }),
    );
  });

  it('super-admin CAN delete any like (global write rule)', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'root', { role: 'super-admin' });
    await assertSucceeds(deleteDoc(doc(db, 'posts/p1/likes/u1')));
  });
});

/**
 * Wave 6-7: posts authored AS an org. authorId == ORG id (ngo/brand/club doc id),
 * NOT the publishing user's uid; managerUserId == auth.uid. The managing user is
 * resolved via the org doc's adminUserId == uid OR the user doc's managed*Id == authorId.
 *
 * Declared rules (see firestore.rules `match /posts/{postId}`):
 *   function managesOrg(orgId) { ... adminUserId==uid OR managed*Id==orgId ... }
 *   allow create: if isSuperAdmin() || (isSignedIn() && (authorId==uid || managesOrg(authorId)));
 *   allow update, delete: if isSuperAdmin() || (isSignedIn() && (authorId==uid || managesOrg(authorId)));
 */
describe.skipIf(!emulatorUp)('firestore.rules — /posts org-authored CRUD (wave 6-7)', () => {
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
      // Orgs: ngo-1 owned via adminUserId; brand-1 owned via user.managedBrandId fallback.
      await db.collection('ngos').doc('ngo-1').set({ name: 'STK Bir', adminUserId: 'ngo-admin' });
      await db.collection('brands').doc('brand-1').set({ name: 'Marka Bir' }); // no adminUserId → fallback path
      await db.collection('clubs').doc('club-1').set({ name: 'Kulüp Bir', adminUserId: 'club-admin' });

      // brand-admin owns brand-1 via managedBrandId (org doc has no adminUserId)
      await db.collection('users').doc('brand-admin').set({ managedBrandId: 'brand-1' });
      await db.collection('users').doc('ngo-admin').set({});
      await db.collection('users').doc('stranger').set({});

      // Existing org-authored post (authored AS ngo-1)
      await db.collection('posts').doc('org-post').set({
        authorId: 'ngo-1',
        authorType: 'ngo',
        managerUserId: 'ngo-admin',
        author: { name: 'STK Bir', avatarUrl: '', entityId: 'ngo-1', entityKind: 'ngo' },
        content: 'kurum gönderisi',
        createdAt: new Date(),
      });
      // Existing individual post (authorId == uid, backwards-compat)
      await db.collection('posts').doc('indiv-post').set({
        authorId: 'u-indiv',
        content: 'bireysel gönderi',
        createdAt: new Date(),
      });
    });
  });

  // ----- CREATE -----

  it('org admin (adminUserId match) CAN create a post authored as their org', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'ngo-admin');
    await assertSucceeds(
      setDoc(doc(db, 'posts/new-ngo-post'), {
        authorId: 'ngo-1',
        authorType: 'ngo',
        managerUserId: 'ngo-admin',
        author: { name: 'STK Bir', entityId: 'ngo-1', entityKind: 'ngo' },
        content: 'yeni',
        createdAt: new Date(),
      }),
    );
  });

  it('org admin (managed*Id fallback) CAN create a post authored as their brand', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'brand-admin');
    await assertSucceeds(
      setDoc(doc(db, 'posts/new-brand-post'), {
        authorId: 'brand-1',
        authorType: 'brand',
        managerUserId: 'brand-admin',
        author: { name: 'Marka Bir', entityId: 'brand-1', entityKind: 'brand' },
        content: 'marka',
        createdAt: new Date(),
      }),
    );
  });

  it('a DIFFERENT user CANNOT create a post authored as an org they do not manage', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'stranger');
    await assertFails(
      setDoc(doc(db, 'posts/forged-post'), {
        authorId: 'ngo-1', // forging org ownership
        authorType: 'ngo',
        managerUserId: 'stranger',
        content: 'sahte',
        createdAt: new Date(),
      }),
    );
  });

  it('individual CAN still create a post where authorId == their uid (backwards-compat)', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'u-indiv');
    await assertSucceeds(
      setDoc(doc(db, 'posts/new-indiv-post'), {
        authorId: 'u-indiv',
        content: 'bireysel yeni',
        createdAt: new Date(),
      }),
    );
  });

  it('super-admin CAN create a post for any org', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'root', { role: 'super-admin' });
    await assertSucceeds(
      setDoc(doc(db, 'posts/admin-post'), {
        authorId: 'club-1',
        authorType: 'club',
        content: 'admin',
        createdAt: new Date(),
      }),
    );
  });

  // ----- UPDATE -----

  it('org admin CAN update their own org post', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'ngo-admin');
    await assertSucceeds(
      updateDoc(doc(db, 'posts/org-post'), { content: 'düzenlendi' }),
    );
  });

  it('a DIFFERENT user CANNOT update an org post they do not manage', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'stranger');
    await assertFails(
      updateDoc(doc(db, 'posts/org-post'), { content: 'hijack' }),
    );
  });

  it('super-admin CAN update any org post', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'root', { role: 'super-admin' });
    await assertSucceeds(
      updateDoc(doc(db, 'posts/org-post'), { content: 'moderasyon' }),
    );
  });

  // ----- DELETE -----

  it('org admin CAN delete their own org post', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'club-admin');
    await adminSeed(env, async (ctx) => {
      await ctx.firestore().collection('posts').doc('club-post').set({
        authorId: 'club-1', authorType: 'club', content: 'kulüp', createdAt: new Date(),
      });
    });
    await assertSucceeds(deleteDoc(doc(db, 'posts/club-post')));
  });

  it('a DIFFERENT user CANNOT delete an org post they do not manage', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'stranger');
    await assertFails(deleteDoc(doc(db, 'posts/org-post')));
  });

  it('super-admin CAN delete any org post', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'root', { role: 'super-admin' });
    await assertSucceeds(deleteDoc(doc(db, 'posts/org-post')));
  });
});
