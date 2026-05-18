/**
 * Netgsm REST v2 SMS adapter.
 *
 * Endpoint: https://api.netgsm.com.tr/sms/rest/v2/send
 * Auth: Basic (NETGSM_USERNAME:NETGSM_PASSWORD)
 *
 * Notlar:
 *  - msgheader: Netgsm tarafından onaylanmış alphanumeric başlık (env)
 *  - encoding: Türkçe karakter varsa 'TR' (UCS-2 yerine), aksi GSM-7 default
 *  - iysfilter: pazarlama mesajları için Netgsm-İYS entegrasyonunu kullan
 */

import type { CanonicalErrorCode, SendResult, SmsProvider, SmsSendInput } from '../../types';
import { detectEncoding } from '../../sms-segments';

const ENDPOINT = 'https://api.netgsm.com.tr/sms/rest/v2/send';

interface NetgsmConfig {
  username: string;
  password: string;
  header: string;
  iysFilter?: string;
  appKey?: string;
}

interface NetgsmResponse {
  code?: string;
  description?: string;
  jobid?: string;
  jobID?: string;
  messageId?: string;
}

// https://www.netgsm.com.tr/dokuman/#api-sms-rest-v2
const ERROR_MAP: Record<string, CanonicalErrorCode> = {
  '00': 'unknown', // Success — not used
  '20': 'provider_4xx', // Message field error
  '30': 'provider_4xx', // Auth error
  '40': 'invalid_address', // Recipient field error
  '50': 'provider_4xx', // IYS filter rejection
  '51': 'no_consent', // IYS consent missing
  '70': 'provider_4xx', // General error
  '80': 'rate_limited',
  '85': 'rate_limited',
};

export class NetgsmSmsProvider implements SmsProvider {
  readonly driver = 'netgsm';
  private config: NetgsmConfig;

  constructor(config: NetgsmConfig) {
    this.config = config;
  }

  async send(input: SmsSendInput): Promise<SendResult> {
    const encoding = detectEncoding(input.body) === 'UCS2' ? 'TR' : '';

    const payload: Record<string, unknown> = {
      msgheader: this.config.header,
      encoding: encoding || undefined,
      messages: [{ msg: input.body, no: input.to.replace(/^\+/, '') }],
    };

    if (input.useCase === 'marketing' && this.config.iysFilter) {
      payload.iysfilter = this.config.iysFilter;
    }
    if (this.config.appKey) {
      payload.appkey = this.config.appKey;
    }

    const auth = Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64');

    let res: Response;
    try {
      res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Basic ${auth}`,
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

    let json: NetgsmResponse;
    try {
      json = (await res.json()) as NetgsmResponse;
    } catch {
      return {
        ok: false,
        errorCode: res.status >= 500 ? 'provider_5xx' : 'provider_4xx',
        errorMessage: `Netgsm geçersiz yanıt: HTTP ${res.status}`,
      };
    }

    const code = json.code ?? '';
    if (code === '00') {
      return {
        ok: true,
        providerMessageId: json.jobid ?? json.jobID ?? json.messageId ?? undefined,
        raw: json,
      };
    }

    return {
      ok: false,
      errorCode: ERROR_MAP[code] ?? (res.status >= 500 ? 'provider_5xx' : 'provider_4xx'),
      errorMessage: `Netgsm code=${code} ${json.description ?? ''}`.trim(),
      raw: json,
    };
  }
}
