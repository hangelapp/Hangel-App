/**
 * Meta Cloud API (WhatsApp) adapter.
 *
 * Endpoint: https://graph.facebook.com/v21.0/{PHONE_NUMBER_ID}/messages
 * Auth: Bearer {META_WA_ACCESS_TOKEN}
 *
 * Webhook events: messages, statuses (delivered/read/failed)
 * Verification: GET ile hub.challenge + hub.verify_token
 */

import type {
  CanonicalErrorCode,
  DeliveryEventInput,
  SendResult,
  WhatsAppProvider,
  WhatsAppSendInput,
  WhatsAppTemplateInfo,
} from '../../types';

const GRAPH = 'https://graph.facebook.com/v21.0';

interface MetaCloudConfig {
  accessToken: string;
  appSecret?: string;
}

interface MetaSendResponse {
  messaging_product?: string;
  messages?: Array<{ id: string }>;
  error?: { message?: string; type?: string; code?: number; error_subcode?: number };
}

interface MetaTemplateListResponse {
  data?: Array<{
    name: string;
    language: string;
    category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
    status: 'APPROVED' | 'PENDING' | 'REJECTED' | 'PAUSED' | 'DISABLED';
    components?: Array<{ type: string; text?: string }>;
  }>;
}

function mapMetaError(code: number | undefined): CanonicalErrorCode {
  if (code === undefined) return 'unknown';
  if (code === 131056) return 'invalid_address';
  if (code === 131026) return 'blocked';
  if (code === 131049) return 'rate_limited';
  if (code === 131047) return 'no_consent';
  if (code >= 500) return 'provider_5xx';
  return 'provider_4xx';
}

export class MetaCloudWhatsAppProvider implements WhatsAppProvider {
  readonly driver = 'meta-cloud';
  private config: MetaCloudConfig;

  constructor(config: MetaCloudConfig) {
    this.config = config;
  }

  async send(input: WhatsAppSendInput): Promise<SendResult> {
    const phoneNumberId = input.wabaPhoneNumberId;
    if (!phoneNumberId) {
      return { ok: false, errorCode: 'provider_4xx', errorMessage: 'wabaPhoneNumberId yok' };
    }

    const body = {
      messaging_product: 'whatsapp',
      to: input.to.replace(/^\+/, ''),
      type: 'template',
      template: {
        name: input.templateName,
        language: { code: input.templateLanguage },
        components: input.components ?? [],
      },
    };

    let res: Response;
    try {
      res = await fetch(`${GRAPH}/${phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${this.config.accessToken}`,
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

    let json: MetaSendResponse;
    try {
      json = (await res.json()) as MetaSendResponse;
    } catch {
      return {
        ok: false,
        errorCode: res.status >= 500 ? 'provider_5xx' : 'provider_4xx',
        errorMessage: `Meta geçersiz yanıt HTTP ${res.status}`,
      };
    }

    if (res.ok && json.messages?.[0]?.id) {
      return { ok: true, providerMessageId: json.messages[0].id, raw: json };
    }

    return {
      ok: false,
      errorCode: mapMetaError(json.error?.code),
      errorMessage: json.error?.message ?? `Meta HTTP ${res.status}`,
      raw: json,
    };
  }

  async syncTemplates(wabaId: string): Promise<WhatsAppTemplateInfo[]> {
    if (!wabaId) return [];
    const res = await fetch(`${GRAPH}/${wabaId}/message_templates?limit=200`, {
      headers: { authorization: `Bearer ${this.config.accessToken}` },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as MetaTemplateListResponse;
    return (json.data ?? []).map((t) => ({
      name: t.name,
      language: t.language,
      category: t.category,
      status: t.status,
      body: t.components?.find((c) => c.type === 'BODY')?.text,
      raw: t,
    }));
  }

  async parseWebhook(req: Request): Promise<DeliveryEventInput[]> {
    const json = (await req.json()) as {
      entry?: Array<{
        changes?: Array<{
          value?: {
            statuses?: Array<{
              id: string;
              status: 'sent' | 'delivered' | 'read' | 'failed';
              timestamp: string;
              errors?: Array<{ code: number; title: string }>;
            }>;
          };
        }>;
      }>;
    };

    const events: DeliveryEventInput[] = [];
    for (const entry of json.entry ?? []) {
      for (const change of entry.changes ?? []) {
        for (const status of change.value?.statuses ?? []) {
          const type: DeliveryEventInput['type'] =
            status.status === 'delivered' ? 'delivered'
            : status.status === 'read' ? 'opened'
            : status.status === 'failed' ? 'failed'
            : 'sent';
          events.push({
            providerMessageId: status.id,
            type,
            at: new Date(Number(status.timestamp) * 1000),
            errorCode: status.errors?.[0] ? mapMetaError(status.errors[0].code) : undefined,
            errorMessage: status.errors?.[0]?.title,
            raw: status,
          });
        }
      }
    }
    return events;
  }
}
