/**
 * Resend e-posta adapter.
 *
 * Endpoint: POST https://api.resend.com/emails
 * Auth: Bearer ${RESEND_API_KEY}
 * Webhook: https://resend.com/docs/dashboard/webhooks/events
 */

import type {
  CanonicalErrorCode,
  DeliveryEventInput,
  EmailProvider,
  EmailSendInput,
  SendResult,
} from '../../types';

const ENDPOINT = 'https://api.resend.com/emails';

interface ResendConfig {
  apiKey: string;
}

interface ResendResponse {
  id?: string;
  message?: string;
  name?: string;
  statusCode?: number;
}

const RESEND_EVENT_MAP: Record<string, DeliveryEventInput['type'] | null> = {
  'email.sent': 'sent',
  'email.delivered': 'delivered',
  'email.bounced': 'bounced',
  'email.complained': 'complained',
  'email.opened': 'opened',
  'email.clicked': 'clicked',
  'email.delivery_delayed': null,
  'email.failed': 'failed',
};

export class ResendEmailProvider implements EmailProvider {
  readonly driver = 'resend';
  private config: ResendConfig;

  constructor(config: ResendConfig) {
    this.config = config;
  }

  async send(input: EmailSendInput): Promise<SendResult> {
    const headers: Record<string, string> = {};
    if (input.unsubscribeUrl) {
      headers['List-Unsubscribe'] = `<${input.unsubscribeUrl}>`;
      headers['List-Unsubscribe-Post'] = 'List-Unsubscribe=One-Click';
    }

    const body = {
      from: `${input.fromName} <${input.fromEmail}>`,
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
      reply_to: input.replyTo,
      headers: Object.keys(headers).length > 0 ? headers : undefined,
      tags: input.tags
        ? Object.entries(input.tags).map(([name, value]) => ({ name, value }))
        : undefined,
    };

    let res: Response;
    try {
      res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(body),
      });
    } catch (err) {
      return {
        ok: false,
        errorCode: 'provider_5xx',
        errorMessage: err instanceof Error ? err.message : 'network error',
      };
    }

    let json: ResendResponse;
    try {
      json = (await res.json()) as ResendResponse;
    } catch {
      return {
        ok: false,
        errorCode: res.status >= 500 ? 'provider_5xx' : 'provider_4xx',
        errorMessage: `Resend geçersiz yanıt: HTTP ${res.status}`,
      };
    }

    if (res.ok && json.id) {
      return { ok: true, providerMessageId: json.id, raw: json };
    }

    const errorCode: CanonicalErrorCode = res.status === 429
      ? 'rate_limited'
      : res.status >= 500
      ? 'provider_5xx'
      : json.name === 'validation_error'
      ? 'invalid_address'
      : 'provider_4xx';

    return {
      ok: false,
      errorCode,
      errorMessage: json.message ?? `Resend ${res.status}`,
      raw: json,
    };
  }

  async parseWebhook(req: Request): Promise<DeliveryEventInput[]> {
    const json = (await req.json()) as {
      type?: string;
      data?: { email_id?: string; created_at?: string; click?: { link?: string } };
    };
    const eventType = json.type ?? '';
    const mapped = RESEND_EVENT_MAP[eventType];
    if (!mapped) return [];
    const providerMessageId = json.data?.email_id;
    if (!providerMessageId) return [];

    return [
      {
        providerMessageId,
        type: mapped,
        at: json.data?.created_at ? new Date(json.data.created_at) : new Date(),
        link: json.data?.click?.link, // email.clicked → tıklanan URL
        raw: json,
      },
    ];
  }
}
