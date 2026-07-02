/**
 * WebAuthn / Passkey — sunucu yardımcıları (Apple Face ID / cihaz passkey'i).
 *
 * @simplewebauthn/server ile RP (Relying Party) yapılandırması + kısa ömürlü,
 * tek kullanımlık challenge deposu (Firestore). Passkey doğrulandığında çağıran
 * route Firebase custom token üretir (mevcut WhatsApp/QR/Apple akışıyla aynı).
 *
 * Depolar (SADECE Admin SDK yazar/okur — client erişmez):
 *   - passkeyChallenges/{id}: { challenge, uid?, createdAt }  (5 dk TTL, tek kullanım)
 *   - passkeys/{credentialId}: { uid, publicKey(b64url), counter, transports, createdAt }
 */
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import { getAdminFirestore } from '@/lib/firebase-admin';

// Passkey'in bağlı olduğu alan (rpID = domain, protokolsüz/pathsiz). Origin allow-list
// doğrulama için. Prod'da hangel.org; env ile override edilebilir (staging vb.).
export const RP_ID = process.env.PASSKEY_RP_ID || 'hangel.org';
export const RP_NAME = 'hangel';
export const EXPECTED_ORIGINS = (process.env.PASSKEY_ORIGINS || 'https://hangel.org,https://www.hangel.org')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const CHALLENGE_TTL_MS = 5 * 60 * 1000;

/** Challenge'ı Firestore'a yaz, id döndür (client verify'de geri gönderir). */
export async function saveChallenge(challenge: string, uid?: string): Promise<string> {
  const ref = getAdminFirestore().collection('passkeyChallenges').doc();
  await ref.set({ challenge, uid: uid ?? null, createdAt: Date.now() });
  return ref.id;
}

/** Challenge'ı oku + SİL (tek kullanımlık) + TTL kontrolü. Geçersizse null. */
export async function takeChallenge(id: string): Promise<{ challenge: string; uid: string | null } | null> {
  if (!id) return null;
  const ref = getAdminFirestore().collection('passkeyChallenges').doc(id);
  const snap = await ref.get();
  if (!snap.exists) return null;
  const d = snap.data() as { challenge?: string; uid?: string | null; createdAt?: number } | undefined;
  await ref.delete().catch(() => undefined); // tek kullanımlık — hemen geçersiz kıl
  if (!d?.challenge || Date.now() - (d.createdAt ?? 0) > CHALLENGE_TTL_MS) return null;
  return { challenge: d.challenge, uid: d.uid ?? null };
}

export {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
};
