'use client';

/**
 * Sign in with Apple — Capacitor native + Firebase Auth köprüsü.
 *
 * Apple App Store Review Guideline 4.8 gereği: bir uygulama 3. taraf SSO
 * (Google vb.) sunuyorsa Sign in with Apple'ı da sunmak ZORUNDA. Hangel'in
 * Google login eklemesi durumunda bu zorunluluk doğar; biz proaktif olarak
 * iOS'ta Apple Sign In sunuyoruz.
 *
 * Web fallback: Firebase Auth `signInWithPopup` ile Apple OAuthProvider
 * (Safari/Chrome'da çalışır, ek Apple Developer Services ID setup gerek).
 * Şimdilik native-only.
 *
 * Apple Developer Console + Firebase Console adımları için
 * `docs/ios-roadmap.md` §5.1 referans.
 */

import { SignInWithApple, type SignInWithAppleResponse } from '@capacitor-community/apple-sign-in';
import { Capacitor } from '@capacitor/core';
import { OAuthProvider, signInWithCredential } from 'firebase/auth';

import { initializeFirebase } from '@/firebase';

export interface AppleSignInResult {
  ok: boolean;
  isNewUser?: boolean;
  uid?: string;
  errorCode?: string;
  message?: string;
}

export async function signInWithAppleNative(): Promise<AppleSignInResult> {
  if (!Capacitor.isNativePlatform()) {
    return { ok: false, errorCode: 'NOT_NATIVE', message: 'Apple Sign In yalnızca iOS uygulamasında.' };
  }

  let response: SignInWithAppleResponse;
  try {
    response = await SignInWithApple.authorize({
      clientId: 'com.hangel.ios.app',
      // Capacitor native akışında redirectURI kullanılmaz ama Apple plugin
      // imzasında zorunlu — placeholder.
      redirectURI: 'https://hangel.org.tr/auth/apple/callback',
      scopes: 'email name',
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Apple oturumu iptal edildi.';
    return { ok: false, errorCode: 'APPLE_CANCELLED', message: msg };
  }

  const identityToken = response.response.identityToken;
  if (!identityToken) {
    return { ok: false, errorCode: 'NO_IDENTITY_TOKEN', message: 'Apple kimlik bilgisi alınamadı.' };
  }

  try {
    const { auth } = initializeFirebase();
    const provider = new OAuthProvider('apple.com');
    // NOT: Replay attack koruması için rawNonce production'da eklenmeli — Apple
    // authorize'a SHA256(rawNonce) verilir, Firebase credential'a rawNonce.
    // Şimdilik Firebase'in identity token doğrulamasına güveniyoruz.
    const credential = provider.credential({
      idToken: identityToken,
    });
    const cred = await signInWithCredential(auth, credential);
    return {
      ok: true,
      isNewUser: cred.user.metadata.creationTime === cred.user.metadata.lastSignInTime,
      uid: cred.user.uid,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Firebase Auth başarısız.';
    return { ok: false, errorCode: 'FIREBASE_AUTH_FAILED', message: msg };
  }
}
