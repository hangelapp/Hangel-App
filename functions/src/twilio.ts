/**
 * Twilio SMS helper for Hangel Cloud Functions.
 *
 * Sends transactional SMS via Twilio REST API (no SDK dependency to keep cold
 * start small). Used by sms-reminder.ts (event reminders) and any future
 * SMS-driven Cloud Function trigger.
 *
 * Env vars / Firebase Functions secrets:
 *   TWILIO_ACCOUNT_SID   — ACxxxxxxxxxxxxxxxx
 *   TWILIO_AUTH_TOKEN    — REST API auth token
 *   TWILIO_FROM_NUMBER   — E.164 sender (örn. "+15005550006") veya
 *                          alphanumeric sender ID (TR'de "Hangel" gibi —
 *                          Twilio'da önceden kayıtlı olmalı)
 *
 * Secret setup:
 *   firebase functions:secrets:set TWILIO_ACCOUNT_SID
 *   firebase functions:secrets:set TWILIO_AUTH_TOKEN
 *   firebase functions:secrets:set TWILIO_FROM_NUMBER
 *
 * Twilio TR pricing: ~$0.05/SMS as of 2026. WhatsApp template'i daha ucuz
 * ama burada generic SMS hatırlatıcısı olarak kullanılıyor (event reminder).
 */
import { defineSecret } from 'firebase-functions/params';
import { logger } from 'firebase-functions';
// twilio SDK is bundled but we instantiate lazily so importing this file
// inside Cloud Function init doesn't require the secret values yet.
import twilio from 'twilio';

export const TWILIO_ACCOUNT_SID = defineSecret('TWILIO_ACCOUNT_SID');
export const TWILIO_AUTH_TOKEN = defineSecret('TWILIO_AUTH_TOKEN');
export const TWILIO_FROM_NUMBER = defineSecret('TWILIO_FROM_NUMBER');

let cachedClient: ReturnType<typeof twilio> | null = null;
function getClient(): ReturnType<typeof twilio> {
  if (cachedClient) return cachedClient;
  const sid = TWILIO_ACCOUNT_SID.value()?.trim();
  const tok = TWILIO_AUTH_TOKEN.value()?.trim();
  cachedClient = twilio(sid, tok);
  return cachedClient;
}

export interface TwilioSendResult {
  ok: boolean;
  sid?: string;
  errorCode?: string;
  errorMessage?: string;
}

/**
 * Normalize a Turkish (or any) phone to E.164 with leading "+".
 * Twilio REST API requires "+90555..." (with plus).
 */
export function normalizePhoneE164(phone: string, defaultCountryCode = '+90'): string {
  if (!phone) return '';
  const cleaned = phone.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+')) return cleaned;
  // Leading 0 → strip and prepend country code
  const stripped = cleaned.replace(/^0+/, '');
  if (!stripped) return '';
  // Already has country code (e.g. 90555...) but no plus
  if (defaultCountryCode === '+90' && stripped.startsWith('90') && stripped.length >= 12) {
    return `+${stripped}`;
  }
  return `${defaultCountryCode}${stripped}`;
}

/**
 * Mask phone for logs — keep last 4 digits, mask the rest.
 * Compliance: PII'yi log'a düz yazma; KVKK / GDPR.
 */
export function maskPhone(phone: string): string {
  if (!phone || phone.length < 4) return '****';
  return phone.slice(0, -4).replace(/\d/g, '*') + phone.slice(-4);
}

/**
 * Send an SMS via Twilio REST API.
 *
 * Caller must declare TWILIO_* secrets on the Cloud Function (`secrets: [...]`)
 * otherwise `.value()` throws at cold-start.
 */
export async function sendSms(toPhone: string, body: string): Promise<TwilioSendResult> {
  const accountSid = TWILIO_ACCOUNT_SID.value()?.trim();
  const authToken = TWILIO_AUTH_TOKEN.value()?.trim();
  const fromNumber = TWILIO_FROM_NUMBER.value()?.trim();

  if (!accountSid || !authToken || !fromNumber) {
    return {
      ok: false,
      errorCode: 'TWILIO_CONFIG_MISSING',
      errorMessage: 'TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_FROM_NUMBER eksik.',
    };
  }

  const to = normalizePhoneE164(toPhone);
  if (!to || to.length < 8) {
    return { ok: false, errorCode: 'INVALID_PHONE', errorMessage: 'Geçersiz telefon numarası.' };
  }

  try {
    const client = getClient();
    const msg = await client.messages.create({
      to,
      from: fromNumber,
      body,
    });
    return { ok: true, sid: msg.sid };
  } catch (e) {
    const err = e as { code?: number | string; message?: string; status?: number };
    logger.warn(`[twilio] send failed to ${maskPhone(to)}: ${err?.code} ${err?.message}`);
    return {
      ok: false,
      errorCode: err?.code ? `TWILIO_${err.code}` : 'TWILIO_ERROR',
      errorMessage: err?.message ?? (e instanceof Error ? e.message : 'unknown'),
    };
  }
}
