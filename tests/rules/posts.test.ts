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
