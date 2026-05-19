/**
 * Security rule tests for `/aiAssistantConfig/{kind}` (Wave 6A / PDF-72).
 *
 * Declared rules (see firestore.rules):
 *   match /aiAssistantConfig/{kind} {
 *     allow read: if isSignedIn();
 *     allow list: if isSuperAdmin();
 *     allow write: if isSuperAdmin();
 *   }
 *
 * Used by /super-admin/ai-management/page.tsx — super-admin yazar, runtime
 * (AI flow'ları) okur. Secret yok ama auth-gated tutuyoruz.
 *
 * Requires the Firestore emulator. If unreachable, this suite is skipped.
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

describe.skipIf(!emulatorUp)('firestore.rules — /aiAssistantConfig/{kind}', () => {
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
      await db.collection('aiAssistantConfig').doc('chat').set({
        model: 'gemini-1.5-pro',
        persona: 'helpful',
        updatedAt: new Date(),
      });
    });
  });

  it('anonymous user CANNOT read aiAssistantConfig (auth-gated)', async () => {
    const env = await getTestEnv();
    const db = unauthedDb(env);
    await assertFails(getDoc(doc(db, 'aiAssistantConfig/chat')));
  });

  it('signed-in user CAN read aiAssistantConfig (runtime AI flow access)', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'u1');
    await assertSucceeds(getDoc(doc(db, 'aiAssistantConfig/chat')));
  });

  it('signed-in user without role claim CANNOT write aiAssistantConfig', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'u1');
    await assertFails(
      setDoc(doc(db, 'aiAssistantConfig/chat'), {
        model: 'evil',
        persona: 'hostile',
      }),
    );
  });

  it('signed-in user without role claim CANNOT update aiAssistantConfig', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'u1');
    await assertFails(updateDoc(doc(db, 'aiAssistantConfig/chat'), { persona: 'evil' }));
  });

  it('signed-in user without role claim CANNOT delete aiAssistantConfig', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'u1');
    await assertFails(deleteDoc(doc(db, 'aiAssistantConfig/chat')));
  });

  it('super-admin CAN create aiAssistantConfig', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'root', { role: 'super-admin' });
    await assertSucceeds(
      setDoc(doc(db, 'aiAssistantConfig/new-kind'), {
        model: 'gemini-1.5-flash',
        persona: 'concise',
        updatedAt: new Date(),
      }),
    );
  });

  it('super-admin CAN update aiAssistantConfig', async () => {
    const env = await getTestEnv();
    const db = authedAs(env, 'root', { role: 'super-admin' });
    await assertSucceeds(
      updateDoc(doc(db, 'aiAssistantConfig/chat'), { persona: 'updated' }),
    );
  });

  it('anonymous user CANNOT write aiAssistantConfig', async () => {
    const env = await getTestEnv();
    const db = unauthedDb(env);
    await assertFails(
      setDoc(doc(db, 'aiAssistantConfig/chat'), { persona: 'evil' }),
    );
  });
});
