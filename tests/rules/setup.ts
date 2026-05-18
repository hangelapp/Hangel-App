/**
 * Shared setup helpers for Firestore security rules tests.
 *
 * These tests require the Firestore emulator to be running. The recommended
 * way to run them is via `firebase emulators:exec --only firestore "vitest run rules"`
 * or by starting the emulator separately and running `npm run test`.
 *
 * If the emulator is unreachable, `isEmulatorRunning()` returns false and the
 * test suites use `describe.skipIf` to gracefully skip — they will NOT block CI
 * `npm run test` runs where no emulator is available.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  initializeTestEnvironment,
  type RulesTestEnvironment,
  type RulesTestContext,
} from '@firebase/rules-unit-testing';
import type { Firestore } from 'firebase/firestore';

export const PROJECT_ID = 'hangel-rules-test';
export const FIRESTORE_HOST = process.env.FIRESTORE_EMULATOR_HOST_HOST ?? '127.0.0.1';
export const FIRESTORE_PORT = Number(
  process.env.FIRESTORE_EMULATOR_PORT ??
    (process.env.FIRESTORE_EMULATOR_HOST?.split(':')[1] ?? '8080'),
);

/**
 * Quick TCP probe to see if the Firestore emulator is up. We use a plain
 * `fetch` against the emulator's HTTP root which responds with "Ok" when
 * reachable. Returns false on any error (timeout, ECONNREFUSED, etc.).
 */
export async function isEmulatorRunning(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1500);
    const res = await fetch(`http://${FIRESTORE_HOST}:${FIRESTORE_PORT}/`, {
      signal: controller.signal,
    });
    clearTimeout(timer);
    return res.ok || res.status === 200 || res.status === 404;
  } catch {
    return false;
  }
}

let cachedEnv: RulesTestEnvironment | null = null;

export async function getTestEnv(): Promise<RulesTestEnvironment> {
  if (cachedEnv) return cachedEnv;
  const rulesPath = resolve(process.cwd(), 'firestore.rules');
  const rules = readFileSync(rulesPath, 'utf8');
  cachedEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules,
      host: FIRESTORE_HOST,
      port: FIRESTORE_PORT,
    },
  });
  return cachedEnv;
}

export async function cleanupTestEnv(): Promise<void> {
  if (cachedEnv) {
    await cachedEnv.cleanup();
    cachedEnv = null;
  }
}

/**
 * Unauthenticated Firestore client — request.auth == null.
 */
export function unauthedDb(env: RulesTestEnvironment): Firestore {
  return env.unauthenticatedContext().firestore() as unknown as Firestore;
}

/**
 * Authenticated Firestore client with optional custom claims (e.g. role).
 *
 * Custom claims become available as `request.auth.token.<key>`. The token's
 * `email` field is also exposed which is how `isSuperAdmin()` checks the
 * hard-coded super-admin email.
 */
export function authedAs(
  env: RulesTestEnvironment,
  uid: string,
  claims: Record<string, unknown> = {},
): Firestore {
  const ctx: RulesTestContext = env.authenticatedContext(uid, claims);
  return ctx.firestore() as unknown as Firestore;
}

/**
 * Returns an admin (bypass-rules) Firestore client for seeding fixture data.
 * Use only inside `env.withSecurityRulesDisabled(...)` callbacks via this helper.
 */
export async function adminSeed(
  env: RulesTestEnvironment,
  fn: (ctx: RulesTestContext) => Promise<void>,
): Promise<void> {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await fn(ctx);
  });
}
