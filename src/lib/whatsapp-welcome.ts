/**
 * Kayıt sonrası "merhaba" Utility template gönderici.
 *
 * Template: hangel_welcome_message
 * Body: "Merhaba {{1}}, hangel hesabın hazır. Soruların için bu numaraya istediğin
 *        zaman yazabilirsin."
 *
 * Not: Yalnızca YENİ kullanıcılara çağrılır (isNewUser=true). Hata durumu
 * sessizce log'lanır — kayıt akışını bloklamaz (best-effort).
 *
 * Template Meta tarafından APPROVED olmadıysa Meta WA_132012 veya benzeri kod
 * döner, biz onu swallow ederiz.
 */
import crypto from 'crypto';

const GRAPH_API_VERSION = 'v18.0';
const TEMPLATE_NAME = 'hangel_welcome_message';

function computeProof(token: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(token).digest('hex');
}

function normalizePhone(phone: string): string {
    return phone.replace(/\D/g, '').replace(/^0+/, '');
}

export async function sendWelcomeMessage(
    phoneE164: string,
    name: string,
    lang: string = 'tr',
): Promise<{ ok: boolean; messageId?: string; errorCode?: string; errorMessage?: string }> {
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN?.trim();
    const appSecret = process.env.WHATSAPP_APP_SECRET?.trim();
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
    if (!accessToken || !phoneNumberId) {
        return { ok: false, errorCode: 'WA_CONFIG_MISSING' };
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
            language: { code: lang === 'en' ? 'en' : 'tr' },
            components: [
                {
                    type: 'body',
                    parameters: [{ type: 'text', text: name.slice(0, 60) || 'arkadaş' }],
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
            const err = (data as { error?: { code?: number; message?: string } } | null)?.error;
            return {
                ok: false,
                errorCode: err?.code ? `WA_${err.code}` : 'WA_HTTP_ERROR',
                errorMessage: err?.message,
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
