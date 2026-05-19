/**
 * Webhook helpers — P1-2 (HMAC) + P1-3 (replay protection).
 *
 * Driver-agnostik küçük yardımcılar:
 *  - verifySvixSignature: Resend (Svix) v1 imza şeması (svix-id + svix-timestamp + svix-signature).
 *  - isIpAllowed: Netgsm gibi HMAC sunmayan sağlayıcılar için fallback IP whitelist.
 *  - rememberWebhookEvent: replay reddetmek için atomik Firestore yazımı (set + exists:false).
 *
 * Yazılan koleksiyon: `webhookReplayIds`. Doc'a `expiresAt = now + 90 gün` damgası eklenir;
 * Firestore TTL policy bu alanı izleyerek 90 gün sonra otomatik siler (bkz. tasks.md P1-3b).
 */

import crypto from 'crypto';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';

const FIVE_MINUTES_MS = 5 * 60 * 1000;

/** Timing-safe Buffer eşitliği — uzunluk uyuşmazsa false döner (length leak yok). */
export function timingSafeEqualBuffers(a: Buffer, b: Buffer): boolean {
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * Resend / Svix v1 HMAC SHA256 doğrulaması.
 *
 * Svix imza formatı:
 *   svix-signature: "v1,<base64sig> v1,<base64sig2> ..."
 *   imza payload = `${svix-id}.${svix-timestamp}.${rawBody}`
 *   secret env var (`whsec_...`) "whsec_" prefix taşıyabilir → base64 kısmı kullanılır.
 *
 * Birden fazla imza listelenebilir (rotation); biri eşleşirse OK.
 */
export function verifySvixSignature(params: {
  rawBody: string;
  svixId: string | null;
  svixTimestamp: string | null;
  svixSignatureHeader: string | null;
  secret: string;
}): boolean {
  const { rawBody, svixId, svixTimestamp, svixSignatureHeader, secret } = params;
  if (!svixId || !svixTimestamp || !svixSignatureHeader || !secret) return false;

  // "whsec_..." formatlı Svix sırlarında baz64 kısmı kullanılır.
  const secretBytes = secret.startsWith('whsec_')
    ? Buffer.from(secret.slice('whsec_'.length), 'base64')
    : Buffer.from(secret, 'utf8');

  const signedPayload = `${svixId}.${svixTimestamp}.${rawBody}`;
  const expected = crypto.createHmac('sha256', secretBytes).update(signedPayload).digest('base64');
  const expectedBuf = Buffer.from(expected, 'utf8');

  const candidates = svixSignatureHeader.split(' ').filter(Boolean);
  for (const candidate of candidates) {
    const [version, sig] = candidate.split(',');
    if (version !== 'v1' || !sig) continue;
    if (timingSafeEqualBuffers(Buffer.from(sig, 'utf8'), expectedBuf)) return true;
  }
  return false;
}

/**
 * Request'ten kaynak IP'yi çıkarır.
 * Next.js (Node runtime) `Request`'inde doğrudan IP yok; reverse proxy header'larına bakıyoruz.
 * Hosting platformları (Firebase App Hosting / Cloud Run / Vercel) `x-forwarded-for` set eder.
 */
export function extractClientIp(req: Request): string | null {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0]?.trim();
    if (first) return first;
  }
  return (
    req.headers.get('x-real-ip') ??
    req.headers.get('fastly-client-ip') ??
    req.headers.get('cf-connecting-ip') ??
    null
  );
}

/**
 * Comma-separated whitelist'i parse eder ve verilen IP'nin listede olup olmadığını döner.
 * Şimdilik CIDR yok — exact match. (Netgsm tipik olarak küçük bir IP havuzu yayınlar.)
 *
 * TODO(P1-2b): Netgsm gerçek HMAC sağlayınca bu fonksiyon kullanım dışı kalacak;
 * bkz. docs/audit/tasks.md.
 */
export function isIpAllowed(ip: string | null, whitelistRaw: string | undefined): boolean {
  if (!whitelistRaw) return false;
  const allowed = whitelistRaw.split(',').map((s) => s.trim()).filter(Boolean);
  if (allowed.length === 0) return false;
  if (!ip) return false;
  return allowed.includes(ip);
}

/**
 * Timestamp'i 5 dakikalık pencerede mi kontrol eder.
 * `value` saniye (Unix epoch) veya ISO string olabilir; her ikisi de kabul.
 */
export function isTimestampFresh(value: string | null, now: number = Date.now()): boolean {
  if (!value) return false;
  // Önce sayısal (Svix saniye epoch) dene
  const asNum = Number(value);
  let tsMs: number;
  if (!Number.isNaN(asNum) && asNum > 0) {
    tsMs = asNum * 1000;
  } else {
    const parsed = Date.parse(value);
    if (Number.isNaN(parsed)) return false;
    tsMs = parsed;
  }
  return Math.abs(now - tsMs) <= FIVE_MINUTES_MS;
}

/**
 * Replay koruması — `webhookReplayIds/{driver}__{eventId}` doc'unu atomik olarak yaratır.
 * Doc varsa `ALREADY_EXISTS` fırlatır → çağıran 409 döner.
 *
 * `set` + `create()` semantiği (`create()` doc varsa fail eder) yerine, bizim sürümümüz
 * doğrudan `create()` kullanır; bu Firestore'da atomik "create-or-fail" sağlar.
 */
export async function rememberWebhookEvent(driver: string, eventId: string): Promise<'ok' | 'replay'> {
  const db = getAdminFirestore();
  const safeId = `${driver}__${eventId}`.replace(/[/]/g, '_').slice(0, 1500);
  const ref = db.collection(COLLECTIONS.webhookReplayIds).doc(safeId);
  try {
    await ref.create({
      driver,
      eventId,
      createdAt: FieldValue.serverTimestamp(),
      expiresAt: Timestamp.fromMillis(Date.now() + 90 * 24 * 60 * 60 * 1000),
    });
    return 'ok';
  } catch (err) {
    const code = (err as { code?: number | string }).code;
    // Firestore Admin SDK: ALREADY_EXISTS = 6 (gRPC)
    if (code === 6 || code === 'already-exists') return 'replay';
    throw err;
  }
}
