'use client';

/**
 * Sign in with Apple — native iOS bridge.
 *
 * Capacitor 8.x'te @capacitor-community/apple-sign-in kırık olduğu için
 * kendi native plugin'imiz var: ios/App/App/HangelAppleSignInPlugin.swift
 *
 * Apple Store Guideline 4.8: Google/Facebook/Twitter SSO sunulduğu için
 * SIWA buton ZORUNLU. Reddedilirse Apple Review uygulamayı bloklar.
 */

import { Capacitor, registerPlugin } from '@capacitor/core';

interface HangelAppleSignInPlugin {
  signIn(options?: { nonce?: string }): Promise<{
    user: string;
    identityToken?: string;
    authorizationCode?: string;
    email?: string;
    fullName?: { givenName?: string; familyName?: string };
  }>;
  getCredentialState(options: { userId: string }): Promise<{
    state: 'authorized' | 'revoked' | 'notFound' | 'transferred' | 'unknown';
  }>;
}

const HangelAppleSignIn = registerPlugin<HangelAppleSignInPlugin>('HangelAppleSignIn');

export interface AppleSignInResult {
  ok: boolean;
  errorCode?: 'NOT_AVAILABLE' | 'APPLE_CANCELLED' | 'BACKEND_ERROR' | 'UNKNOWN';
  message?: string;
  isNewUser?: boolean;
  customToken?: string;
}

function generateNonce(length = 32): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let nonce = '';
  const random = new Uint8Array(length);
  crypto.getRandomValues(random);
  for (let i = 0; i < length; i++) {
    nonce += chars[random[i] % chars.length];
  }
  return nonce;
}

export async function signInWithAppleNative(): Promise<AppleSignInResult> {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'ios') {
    return {
      ok: false,
      errorCode: 'NOT_AVAILABLE',
      message: 'Apple Sign In yalnızca iOS app içinde çalışır.',
    };
  }

  const nonce = generateNonce();

  try {
    const credential = await HangelAppleSignIn.signIn({ nonce });

    if (!credential.identityToken) {
      return {
        ok: false,
        errorCode: 'UNKNOWN',
        message: 'Apple kimliği alınamadı.',
      };
    }

    const res = await fetch('/api/auth/apple/verify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        identityToken: credential.identityToken,
        nonce,
        email: credential.email,
        fullName: credential.fullName,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      return {
        ok: false,
        errorCode: 'BACKEND_ERROR',
        message: data?.message || 'Sunucu doğrulamada hata.',
      };
    }
    return {
      ok: true,
      isNewUser: data.isNewUser,
      customToken: data.customToken,
    };
  } catch (e) {
    const err = e as { code?: string; message?: string };
    if (err?.code === 'APPLE_CANCELLED') {
      return { ok: false, errorCode: 'APPLE_CANCELLED', message: 'İptal edildi.' };
    }
    return {
      ok: false,
      errorCode: 'UNKNOWN',
      message: err?.message || 'Bilinmeyen hata.',
    };
  }
}
