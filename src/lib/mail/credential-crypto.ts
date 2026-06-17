/**
 * Alan-bazlı şifreleme — STK Workspace SMTP App Password gibi secret alanlar
 * Firestore'a ASLA plaintext yazılmaz. AES-256-GCM, anahtar `MAIL_CRED_ENC_KEY`
 * env'den okunur (32-byte; hex veya base64). Ağ I/O yok, yalnız node:crypto.
 *
 * Format: `base64(iv).base64(tag).base64(ciphertext)`.
 *
 * `isMailConfigured()` = anahtar mevcut ve >=32 byte mı (Ads `isAdsConfigured`
 * deseni). `decryptMailSecret` her hata durumunda `null` döner — secret loglanmaz.
 */
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGO = 'aes-256-gcm';
const IV_LEN = 12; // GCM standart nonce uzunluğu
const KEY_LEN = 32; // AES-256

/**
 * `MAIL_CRED_ENC_KEY`'i 32-byte buffer'a çözer. Önce base64, sonra hex denenir;
 * elde edilen anahtar tam 32 byte değilse `null`.
 */
function getMailKey(): Buffer | null {
  const raw = process.env.MAIL_CRED_ENC_KEY;
  if (!raw) return null;

  // base64 dene
  try {
    const b64 = Buffer.from(raw, 'base64');
    if (b64.length === KEY_LEN) return b64;
  } catch {
    // yoksay, hex dene
  }
  // hex dene
  try {
    const hex = Buffer.from(raw, 'hex');
    if (hex.length === KEY_LEN) return hex;
  } catch {
    // yoksay
  }
  return null;
}

/** True when MAIL_CRED_ENC_KEY mevcut ve geçerli 32-byte anahtar. */
export function isMailConfigured(): boolean {
  return getMailKey() !== null;
}

/**
 * `plain`'i AES-256-GCM ile şifreler. Anahtar yoksa/geçersizse `null`.
 * Dönen format: `base64(iv).base64(tag).base64(ciphertext)`.
 */
export function encryptMailSecret(plain: string): string | null {
  const key = getMailKey();
  if (!key) return null;
  try {
    const iv = randomBytes(IV_LEN);
    const cipher = createCipheriv(ALGO, key, iv);
    const ciphertext = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `${iv.toString('base64')}.${tag.toString('base64')}.${ciphertext.toString('base64')}`;
  } catch {
    return null;
  }
}

/**
 * `enc`'i çözer. Anahtar yok / format bozuk / auth tag uyuşmazsa `null`.
 * Hata mesajı sızdırılmaz.
 */
export function decryptMailSecret(enc: string): string | null {
  const key = getMailKey();
  if (!key) return null;
  try {
    const parts = enc.split('.');
    if (parts.length !== 3) return null;
    const iv = Buffer.from(parts[0], 'base64');
    const tag = Buffer.from(parts[1], 'base64');
    const ciphertext = Buffer.from(parts[2], 'base64');
    const decipher = createDecipheriv(ALGO, key, iv);
    decipher.setAuthTag(tag);
    const plain = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return plain.toString('utf8');
  } catch {
    return null;
  }
}
