/**
 * Decides how to surface a Firestore `onSnapshot` error to the UI.
 *
 * Background: `useCollection` / `useDoc` used to rewrap every onSnapshot error
 * as a `FirestorePermissionError` ("Missing or insufficient permissions: …"),
 * which masked `failed-precondition` (missing index), `unavailable` (network),
 * `unauthenticated` (auth lapse), etc. The audit task PDF-6-error-mask captures
 * the user-visible symptom (e.g. /notifications saw "permission" copy when the
 * real cause was a missing composite index).
 *
 * Rule:
 *  - `permission-denied` → rewrap as `FirestorePermissionError` so security-rule
 *    debug telemetry (which depends on this class shape, including
 *    rules-test runners) keeps working and the global error emitter fires.
 *  - everything else → preserve the raw `FirestoreError` (code + message intact)
 *    so the UI / error boundaries can show the real cause.
 *
 * Returning `{ shouldEmitPermissionError: true }` is the signal to call
 * `errorEmitter.emit('permission-error', mapped)` — emit only happens when the
 * mapped error is the contextual permission error.
 */

import type { FirestoreError } from 'firebase/firestore';
import { FirestorePermissionError } from '@/firebase/errors';

export type FirestoreOperation = 'get' | 'list' | 'create' | 'update' | 'delete' | 'write';

export interface MapFirestoreErrorInput {
  rawError: FirestoreError;
  operation: FirestoreOperation;
  path: string;
}

export interface MappedFirestoreError {
  error: FirestoreError | FirestorePermissionError;
  shouldEmitPermissionError: boolean;
}

export function mapFirestoreSnapshotError({
  rawError,
  operation,
  path,
}: MapFirestoreErrorInput): MappedFirestoreError {
  if (rawError && rawError.code === 'permission-denied') {
    const contextualError = new FirestorePermissionError({ operation, path });
    return { error: contextualError, shouldEmitPermissionError: true };
  }
  // Preserve raw FirestoreError so .code and .message survive for the UI.
  return { error: rawError, shouldEmitPermissionError: false };
}
