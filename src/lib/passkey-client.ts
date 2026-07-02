'use client';

/**
 * Passkey (Face ID / cihaz passkey'i) — istemci yardımcıları.
 *
 * @simplewebauthn/browser ile kayıt/giriş; sonuçta Firebase custom token alıp
 * signInWithCustomToken ile oturum açılır. Mevcut girişi BOZMAZ — ek bir yol.
 */
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import { getAuth, signInWithCustomToken } from 'firebase/auth';

/** Tarayıcı passkey (WebAuthn) destekliyor mu? */
export function isPasskeySupported(): boolean {
  return typeof window !== 'undefined' && typeof window.PublicKeyCredential !== 'undefined';
}

/** Cihaz platform authenticator'ı (Face ID/Touch ID/Windows Hello) var mı? */
export async function hasPlatformAuthenticator(): Promise<boolean> {
  try {
    if (!isPasskeySupported()) return false;
    return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

/** Girişli kullanıcı için bu cihaza passkey kaydet (Face ID ile onaylar). */
export async function registerPasskey(): Promise<void> {
  const idToken = await getAuth().currentUser?.getIdToken();
  if (!idToken) throw new Error('Passkey oluşturmak için önce giriş yap.');
  const optRes = await fetch('/api/auth/passkey/register/options', {
    method: 'POST',
    headers: { Authorization: `Bearer ${idToken}` },
  });
  if (!optRes.ok) throw new Error('Passkey seçenekleri alınamadı.');
  const { options, challengeId } = await optRes.json();
  const response = await startRegistration({ optionsJSON: options });
  const verRes = await fetch('/api/auth/passkey/register/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ response, challengeId }),
  });
  if (!verRes.ok) throw new Error('Passkey kaydedilemedi.');
}

/** Passkey ile giriş yap (Face ID) → Firebase oturumu açılır. */
export async function signInWithPasskey(): Promise<void> {
  const optRes = await fetch('/api/auth/passkey/authenticate/options', { method: 'POST' });
  if (!optRes.ok) throw new Error('Giriş seçenekleri alınamadı.');
  const { options, challengeId } = await optRes.json();
  const response = await startAuthentication({ optionsJSON: options });
  const verRes = await fetch('/api/auth/passkey/authenticate/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ response, challengeId }),
  });
  const data = await verRes.json().catch(() => ({}));
  if (!verRes.ok || !data.customToken) throw new Error(data.message || 'Passkey ile giriş başarısız.');
  await signInWithCustomToken(getAuth(), data.customToken);
}
