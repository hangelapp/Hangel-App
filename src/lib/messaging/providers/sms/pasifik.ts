/**
 * Pasifik Telekom SMS adapter.
 *
 * Endpoints:
 *  - POST /sms/submit/multi/  — toplu SMS gönder
 *  - GET  /sms/query/multi/id/?id={id} — durum sorgu
 *  - GET  /user/getsettings/ — hesap + bakiye
 *
 * Auth: Basic (Base64(username:password)) — Authorization: Basic xxx
 *
 * Notlar:
 *  - Sender ID (from): 3-11 char alphanumeric, Pasifik tarafından onaylı
 *  - alphabet: Türkçe karakter varsa 'TurkishSingleShift', yoksa default
 *  - 'to' formatı: + olmadan country code dahil (905XX...)
 *  - Webhook yok — status için /sms/query/multi/id polling kullan
 */

import type { CanonicalErrorCode, SendResult, SmsProvider, SmsSendInput } from '../../types';
import { detectEncoding } from '../../sms-segments';

const ENDPOINT_SUBMIT = 'https://oim.pasifiktelekom.com.tr/en/api/sms/submit/';
const ENDPOINT_SUBMIT_MULTI = 'https://oim.pasifiktelekom.com.tr/en/api/sms/submit/multi/';
const ENDPOINT_QUERY = 'https://oim.pasifiktelekom.com.tr/en/api/sms/query/multi/id/';
const ENDPOINT_SETTINGS = 'https://oim.pasifiktelekom.com.tr/en/api/user/getsettings/';

export const PASIFIK_DEFAULT_ALPHABET = 'TurkishSingleShift';

interface PasifikConfig {
  username: string;
  password: string;
  from: string;
  defaultAlphabet?: string;
}

interface PasifikSubmitResponse {
  id?: string | number;
  code?: string;
  description?: string;
}

interface PasifikQueryResponse {
  id?: string | number;
  status?: string;
  state?: string;
  delivered?: boolean;
  code?: string;
  description?: string;
}

interface PasifikSettingsResponse {
  credit?: number | string;
  balance?: number | string;
  username?: string;
  code?: string;
  description?: string;
}

const ERROR_MAP: Record<string, CanonicalErrorCode> = {
  '200': 'unknown', // Success — not used
  '400': 'provider_4xx',
  '401': 'provider_4xx', // Auth error
  '403': 'provider_4xx',
  '404': 'provider_4xx',
  '422': 'invalid_address',
  '429': 'rate_limited',
  '500': 'provider_5xx',
  '502': 'provider_5xx',
  '503': 'provider_5xx',
};

function mapErrorCode(code: string, httpStatus: number): CanonicalErrorCode {
  const mapped = ERROR_MAP[code];
  if (mapped) return mapped;
  const prefix = code.charAt(0);
  if (prefix === '4') return 'provider_4xx';
  if (prefix === '5') return 'provider_5xx';
  return httpStatus >= 500 ? 'provider_5xx' : 'provider_4xx';
}

export class PasifikSmsProvider implements SmsProvider {
  readonly driver = 'pasifik';
  private config: PasifikConfig;

  constructor(config: PasifikConfig) {
    this.config = config;
  }

  private get authHeader(): string {
    const auth = Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64');
    return `Basic ${auth}`;
  }

  async send(input: SmsSendInput): Promise<SendResult> {
    const to = input.to.replace(/^\+/, '');
    const alphabet =
      detectEncoding(input.body) === 'UCS2'
        ? PASIFIK_DEFAULT_ALPHABET
        : (this.config.defaultAlphabet ?? 'DefaultMclass0');

    const payload: Record<string, unknown> = {
      from: this.config.from,
      envelopes: [{ to, text: input.body }],
      alphabet,
    };

    let res: Response;
    try {
      res = await fetch(ENDPOINT_SUBMIT_MULTI, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: this.authHeader,
        },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      return {
        ok: false,
        errorCode: 'provider_5xx',
        errorMessage: err instanceof Error ? err.message : 'network error',
      };
    }

    let json: PasifikSubmitResponse;
    try {
      json = (await res.json()) as PasifikSubmitResponse;
    } catch {
      return {
        ok: false,
        errorCode: res.status >= 500 ? 'provider_5xx' : 'provider_4xx',
        errorMessage: `Pasifik geçersiz yanıt: HTTP ${res.status}`,
      };
    }

    const code = json.code ?? String(res.status);
    if (res.ok && (code === '200' || code === '')) {
      const providerMessageId = json.id !== undefined ? String(json.id) : undefined;
      return {
        ok: true,
        providerMessageId,
        raw: json,
      };
    }

    return {
      ok: false,
      errorCode: mapErrorCode(code, res.status),
      errorMessage: `Pasifik code=${code} ${json.description ?? ''}`.trim(),
      raw: json,
    };
  }

  async getBalance(): Promise<{ credits: number; raw?: unknown } | null> {
    let res: Response;
    try {
      res = await fetch(ENDPOINT_SETTINGS, {
        method: 'GET',
        headers: { authorization: this.authHeader },
      });
    } catch {
      return null;
    }

    if (!res.ok) return null;

    let json: PasifikSettingsResponse;
    try {
      json = (await res.json()) as PasifikSettingsResponse;
    } catch {
      return null;
    }

    const raw = json.credit ?? json.balance;
    const credits = typeof raw === 'number' ? raw : typeof raw === 'string' ? Number(raw) : NaN;
    if (!Number.isFinite(credits)) return null;

    return { credits, raw: json };
  }

  async queryStatus(providerMessageId: string): Promise<{
    delivered: boolean;
    failed: boolean;
    status: string;
    raw?: unknown;
  } | null> {
    let res: Response;
    try {
      const url = `${ENDPOINT_QUERY}?id=${encodeURIComponent(providerMessageId)}`;
      res = await fetch(url, {
        method: 'GET',
        headers: { authorization: this.authHeader },
      });
    } catch {
      return null;
    }

    if (!res.ok) return null;

    let json: PasifikQueryResponse;
    try {
      json = (await res.json()) as PasifikQueryResponse;
    } catch {
      return null;
    }

    const status = (json.status ?? json.state ?? '').toString().toLowerCase();
    const delivered = json.delivered === true || status === 'delivered' || status === 'delivrd';
    const failed =
      status === 'failed' ||
      status === 'undeliverable' ||
      status === 'undeliv' ||
      status === 'rejected' ||
      status === 'expired';

    return {
      delivered,
      failed,
      status: status || 'unknown',
      raw: json,
    };
  }
}

// Tek SMS endpoint kullanan ileri entegrasyonlar için export edilir.
export const PASIFIK_ENDPOINTS = {
  SUBMIT: ENDPOINT_SUBMIT,
  SUBMIT_MULTI: ENDPOINT_SUBMIT_MULTI,
  QUERY: ENDPOINT_QUERY,
  SETTINGS: ENDPOINT_SETTINGS,
} as const;
