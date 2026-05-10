'use client';
import {
  Auth, // Import Auth type for type hinting
  User,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  ActionCodeSettings,
  // Assume getAuth and app are initialized elsewhere
} from 'firebase/auth';

/** Initiate anonymous sign-in (non-blocking). */
export function initiateAnonymousSignIn(authInstance: Auth): void {
  // CRITICAL: Call signInAnonymously directly. Do NOT use 'await signInAnonymously(...)'.
  signInAnonymously(authInstance);
  // Code continues immediately. Auth state change is handled by onAuthStateChanged listener.
}

/** Initiate email/password sign-up (non-blocking). */
export function initiateEmailSignUp(authInstance: Auth, email: string, password: string): void {
  // CRITICAL: Call createUserWithEmailAndPassword directly. Do NOT use 'await createUserWithEmailAndPassword(...)'.
  createUserWithEmailAndPassword(authInstance, email, password);
  // Code continues immediately. Auth state change is handled by onAuthStateChanged listener.
}

/** Initiate email/password sign-in (non-blocking). */
export function initiateEmailSignIn(authInstance: Auth, email: string, password: string): void {
  // CRITICAL: Call signInWithEmailAndPassword directly. Do NOT use 'await signInWithEmailAndPassword(...)'.
  signInWithEmailAndPassword(authInstance, email, password);
  // Code continues immediately. Auth state change is handled by onAuthStateChanged listener.
}

/** Build Firebase action code settings that redirect to our custom /auth/action page. */
export function getAuthActionSettings(): ActionCodeSettings | undefined {
  if (typeof window === 'undefined') return undefined;
  return {
    url: `${window.location.origin}/auth/action`,
    handleCodeInApp: true,
  };
}

/** Send an email-verification message to the given user (fire-and-forget). */
export function initiateEmailVerification(user: User): Promise<void> {
  return sendEmailVerification(user, getAuthActionSettings());
}

/** Send a password-reset email to the given address (fire-and-forget). */
export function initiatePasswordResetEmail(authInstance: Auth, email: string): Promise<void> {
  return sendPasswordResetEmail(authInstance, email, getAuthActionSettings());
}
