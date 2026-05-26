/**
 * WhatsApp Cloud API client (Meta Graph API).
 *
 * Env vars (App Hosting secrets):
 *   WHATSAPP_ACCESS_TOKEN  — Meta Business permanent access token (System User)
 *   WHATSAPP_PHONE_NUMBER_ID — WABA phone number ID (15 digits)
 *   WHATSAPP_OTP_TEMPLATE_NAME — Approved template name (e.g. "otp_hangel")
 *   WHATSAPP_OTP_TEMPLATE_LANG — Template default lang (e.g. "tr")
 *
 * Template structure (Meta'da approved olmalı):
 *   Body: "{{1}} — hangel doğrulama kodun. 10 dk geçerli."
 *   (1 variable: OTP code)
 */

const GRAPH_API_VERSION = 'v18.0';

export interface WhatsAppSendResult {
    ok: boolean;
    messageId?: string;
    errorCode?: string;
    errorMessage?: string;
}

/**
 * E.164 formatına normalize (+ yok, sadece rakam).
 * WhatsApp Cloud API "+90555..." değil "90555..." bekler.
 */
export function normalizePhoneForWhatsApp(phone: string): string {
    return phone.replace(/\D/g, '').replace(/^0+/, '');
}

/**
 * OTP kodunu Meta WhatsApp template ile gönder.
 * Template Meta Business Manager'da önceden onaylanmış olmalı.
 */
export async function sendWhatsAppOtp(
    phoneE164: string,
    otpCode: string,
    lang?: string,
): Promise<WhatsAppSendResult> {
    const token = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const templateName = process.env.WHATSAPP_OTP_TEMPLATE_NAME || 'otp_hangel';
    const templateLang = lang || process.env.WHATSAPP_OTP_TEMPLATE_LANG || 'tr';

    if (!token || !phoneNumberId) {
        return { ok: false, errorCode: 'WA_CONFIG_MISSING', errorMessage: 'WhatsApp env değişkenleri eksik (WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID).' };
    }

    const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/messages`;
    const body = {
        messaging_product: 'whatsapp',
        to: normalizePhoneForWhatsApp(phoneE164),
        type: 'template',
        template: {
            name: templateName,
            language: { code: templateLang },
            components: [
                {
                    type: 'body',
                    parameters: [{ type: 'text', text: otpCode }],
                },
                // OTP-specific: button component for "copy code" (Meta authentication category)
                {
                    type: 'button',
                    sub_type: 'url',
                    index: '0',
                    parameters: [{ type: 'text', text: otpCode }],
                },
            ],
        },
    };

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
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
