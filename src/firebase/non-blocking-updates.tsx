'use client';
    
import {
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  CollectionReference,
  DocumentReference,
  DocumentData,
  SetOptions,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import {FirestorePermissionError} from '@/firebase/errors';

/**
 * Initiates a setDoc operation for a document reference.
 * Does NOT await the write operation internally.
 */
export function setDocumentNonBlocking(docRef: DocumentReference, data: DocumentData, options: SetOptions) {
  setDoc(docRef, data, options).catch(_error => {
    errorEmitter.emit(
      'permission-error',
      new FirestorePermissionError({
        path: docRef.path,
        operation: 'write', // or 'create'/'update' based on options
        requestResourceData: data,
      })
    )
  })
  // Execution continues immediately
}


/**
 * Initiates an addDoc operation for a collection reference.
 * Does NOT await the write operation internally.
 * Returns the Promise for the new doc ref, but typically not awaited by caller.
 */
export function addDocumentNonBlocking(colRef: CollectionReference, data: DocumentData) {
  const promise = addDoc(colRef, data)
    .catch(_error => {
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: colRef.path,
          operation: 'create',
          requestResourceData: data,
        })
      )
    });
  return promise;
}


/**
 * Initiates an updateDoc operation for a document reference.
 * Does NOT await internally — caller may fire-and-forget (no `await`) OR
 * `await` the returned promise to know if it succeeded.
 *
 * Return shape: `{ ok: true } | { ok: false, error }`. Errors are still
 * emitted via errorEmitter for the global listener, but ALSO surfaced in
 * the resolved value so awaiting callers can branch on it without
 * dealing with thrown promises (which would crash fire-and-forget paths).
 */
export function updateDocumentNonBlocking(
  docRef: DocumentReference,
  data: DocumentData
): Promise<{ ok: true } | { ok: false; error: Error }> {
  return updateDoc(docRef, data)
    .then(() => ({ ok: true as const }))
    .catch((error: Error) => {
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: docRef.path,
          operation: 'update',
          requestResourceData: data,
        })
      );
      return { ok: false as const, error };
    });
}


/**
 * Initiates a deleteDoc operation for a document reference.
 * Does NOT await the write operation internally.
 */
export function deleteDocumentNonBlocking(docRef: DocumentReference) {
  deleteDoc(docRef)
    .catch(_error => {
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: docRef.path,
          operation: 'delete',
        })
      )
    });
}