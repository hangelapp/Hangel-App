/**
 * PDF-6-error-mask: regression coverage for the discriminator that decides
 * whether an onSnapshot error should be rewrapped as FirestorePermissionError
 * (the rich, security-rule-context error class) or surfaced raw so the UI sees
 * the real `code` (`failed-precondition`, `unavailable`, ...).
 *
 * vitest config (tests run with `environment: 'node'`) — no DOM needed; we
 * exercise the pure helper instead of mounting the React hook.
 */

import { describe, expect, it } from 'vitest';
import type { FirestoreError } from 'firebase/firestore';
import { mapFirestoreSnapshotError } from '@/firebase/firestore/error-mapping';
import { FirestorePermissionError } from '@/firebase/errors';

function makeFirestoreError(code: FirestoreError['code'], message: string): FirestoreError {
  // FirestoreError is structurally `Error & { code, name }`; the SDK uses this
  // shape internally. We construct a duck-typed instance to avoid relying on
  // private constructors.
  const err = new Error(message) as FirestoreError;
  (err as { code: FirestoreError['code'] }).code = code;
  (err as { name: string }).name = 'FirebaseError';
  return err;
}

describe('mapFirestoreSnapshotError', () => {
  it('rewraps permission-denied as FirestorePermissionError and signals emit', () => {
    const raw = makeFirestoreError('permission-denied', 'denied by rules');
    const mapped = mapFirestoreSnapshotError({
      rawError: raw,
      operation: 'list',
      path: 'notifications',
    });

    expect(mapped.error).toBeInstanceOf(FirestorePermissionError);
    expect(mapped.shouldEmitPermissionError).toBe(true);
    // The rewrapped error must carry the structured request payload (this is
    // what rules-test debug tooling consumes downstream).
    expect((mapped.error as FirestorePermissionError).request).toBeDefined();
  });

  it('preserves failed-precondition raw (missing composite index case)', () => {
    const raw = makeFirestoreError(
      'failed-precondition',
      'The query requires an index. You can create it here: …',
    );
    const mapped = mapFirestoreSnapshotError({
      rawError: raw,
      operation: 'list',
      path: 'notifications',
    });

    expect(mapped.error).toBe(raw);
    expect((mapped.error as FirestoreError).code).toBe('failed-precondition');
    expect(mapped.error.message).toContain('requires an index');
    expect(mapped.shouldEmitPermissionError).toBe(false);
  });

  it('preserves unavailable raw (network blip)', () => {
    const raw = makeFirestoreError('unavailable', 'backend unreachable');
    const mapped = mapFirestoreSnapshotError({
      rawError: raw,
      operation: 'get',
      path: 'ngos/abc',
    });

    expect(mapped.error).toBe(raw);
    expect((mapped.error as FirestoreError).code).toBe('unavailable');
    expect(mapped.shouldEmitPermissionError).toBe(false);
  });

  it('preserves unauthenticated raw (token expired / auth lapse)', () => {
    const raw = makeFirestoreError('unauthenticated', 'token expired');
    const mapped = mapFirestoreSnapshotError({
      rawError: raw,
      operation: 'list',
      path: 'messages',
    });

    expect(mapped.error).toBe(raw);
    expect((mapped.error as FirestoreError).code).toBe('unauthenticated');
    expect(mapped.shouldEmitPermissionError).toBe(false);
  });

  it('preserves cancelled / deadline-exceeded raw', () => {
    const cancelled = makeFirestoreError('cancelled', 'cancelled');
    const deadline = makeFirestoreError('deadline-exceeded', 'deadline');

    const mappedCancelled = mapFirestoreSnapshotError({
      rawError: cancelled,
      operation: 'list',
      path: 'events',
    });
    const mappedDeadline = mapFirestoreSnapshotError({
      rawError: deadline,
      operation: 'list',
      path: 'events',
    });

    expect(mappedCancelled.shouldEmitPermissionError).toBe(false);
    expect(mappedDeadline.shouldEmitPermissionError).toBe(false);
    expect((mappedCancelled.error as FirestoreError).code).toBe('cancelled');
    expect((mappedDeadline.error as FirestoreError).code).toBe('deadline-exceeded');
  });
});
