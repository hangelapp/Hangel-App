/**
 * WhatsApp Magic Link client — UTILITY template ile dynamic URL gönderir.
 *
 * Template: hangel_welcome_link
 * Body: "Hoş geldin {{1}}! ..." (name)
 * URL button: https://hangel.org.tr/auth/wa?t={{1}} (token)
 *
 * Env vars: WHATSAPP_ACCESS_TOKEN, WHATSAPP_APP_SECRET, WHATSAPP_PHONE_NUMBER_ID
 */
import crypto from 'crypto';

const GRAPH_API_VERSION = 'v18.0';
const TEMPLATE_NAME = 'hangel_welcome_link';

export interface SendLinkResult {
    ok: boolean;
    messageId?: string;
    errorCode?: string;
    errorMessage?: string;
}

function computeProof(token: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(token).digest('hex');
}

export function normalizePhone(phone: string): string {
    return phone.replace(/\D/g, '').replace(/^0+/, '');
}

export async function sendWhatsAppLink(
    phoneE164: string,
    name: string,
    token: string,
    lang: string = 'tr',
): Promise<SendLinkResult> {
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const appSecret = process.env.WHATSAPP_APP_SECRET;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    if (!accessToken || !phoneNumberId) {
        return { ok: false, errorCode: 'WA_CONFIG_MISSING', errorMessage: 'WhatsApp env missing.' };
    }
    const proof = appSecret ? computeProof(accessToken, appSecret) : null;
    const proofQuery = proof ? `?appsecret_proof=${proof}` : '';
    const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/messages${proofQuery}`;
    const body = {
        messaging_product: 'whatsapp',
        to: normalizePhone(phoneE164),
        type: 'template',
        template: {
            name: TEMPLATE_NAME,
            language: { code: lang },
            components: [
                {
                    type: 'body',
                    parameters: [{ type: 'text', text: name.slice(0, 60) }],
                },
                {
                    type: 'button',
                    sub_type: 'url',
                    index: '0',
                    parameters: [{ type: 'text', text: token }],
                },
            ],
        },
    };

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        const data: unknown = await res.json().catch(() => null);
        if (!res.ok) {
            const err = (data as { error?: { code?: number; message?: string; error_data?: { details?: string } } } | null)?.error;
            return {
                ok: false,
                errorCode: err?.code ? `WA_${err.code}` : 'WA_HTTP_ERROR',
                errorMessage: err?.message || err?.error_data?.details || `HTTP ${res.status}`,
            };
        }
        const messageId = (data as { messages?: Array<{ id?: string }> } | null)?.messages?.[0]?.id;
        return { ok: true, messageId };
    } catch (e) {
        return {
            ok: false,
            errorCode: 'WA_NETWORK_ERROR',
            errorMessage: e instanceof Error ? e.message : 'Network error',
        };
    }
}
