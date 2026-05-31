'use client';

/**
 * Sign in with Apple — STUB (devre dışı).
 *
 * @capacitor-community/apple-sign-in plugin'i henüz Capacitor 8.x desteklemiyor
 * (en son versiyon 7.1.0, peerDependency capacitor-swift-pm 7.x). Plugin
 * package'dan kaldırıldı. Capacitor 8 uyumlu sürüm çıkınca veya alternatif
 * plugin bulununca buraya geri gelir.
 *
 * Apple Store guideline 4.8: 3. taraf SSO sunuluyorsa Apple Sign In ZORUNLU.
 * Şu an hangel sadece WhatsApp/SMS/Email sunduğu için zorunlu değil.
 */

export interface AppleSignInResult {
  ok: boolean;
  errorCode?: 'NOT_AVAILABLE' | 'APPLE_CANCELLED';
  message?: string;
  isNewUser?: boolean;
}

export async function signInWithAppleNative(): Promise<AppleSignInResult> {
  return {
    ok: false,
    errorCode: 'NOT_AVAILABLE',
    message: 'Apple Sign In şu an kullanılamıyor.',
  };
}
