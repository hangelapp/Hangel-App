/**
 * WhatsApp Cloud API client (Meta Graph API).
 *
 * Env vars (App Hosting secrets):
 *   WHATSAPP_ACCESS_TOKEN  — Meta Business permanent access token
 *   WHATSAPP_APP_SECRET    — Meta App secret (server-side appsecret_proof için)
 *   WHATSAPP_PHONE_NUMBER_ID — WABA phone number ID (15 digits)
 *   WHATSAPP_OTP_TEMPLATE_NAME — Approved template name (e.g. "otp_hangel")
 *   WHATSAPP_OTP_TEMPLATE_LANG — Template default lang (e.g. "tr")
 */

import crypto from 'crypto';

const GRAPH_API_VERSION = 'v18.0';

/** HMAC-SHA256(access_token, app_secret) — Meta'nın server-side proof'u. */
function computeAppsecretProof(token: string, appSecret: string): string {
    return crypto.createHmac('sha256', appSecret).update(token).digest('hex');
}

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
 * Tek bir dil seçeneğiyle WhatsApp OTP gönderim denemesi.
 * Multi-language fallback için iç helper.
 */
async function sendWhatsAppOtpOnce(
    phoneE164: string,
    otpCode: string,
    templateName: string,
    templateLang: string,
    token: string,
    phoneNumberId: string,
    appSecret?: string,
): Promise<WhatsAppSendResult> {
    const proof = appSecret ? computeAppsecretProof(token, appSecret) : null;
    const proofQuery = proof ? `?appsecret_proof=${proof}` : '';
    const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/messages${proofQuery}`;
    const body = {
        messaging_product: 'whatsapp',
        to: normalizePhoneForWhatsApp(phoneE164),
        type: 'template',
        template: {
            name: templateName,
            language: { code: templateLang },
            components: [
                { type: 'body', parameters: [{ type: 'text', text: otpCode }] },
                { type: 'button', sub_type: 'url', index: '0', parameters: [{ type: 'text', text: otpCode }] },
            ],
        },
    };

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
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
        return { ok: false, errorCode: 'WA_NETWORK_ERROR', errorMessage: e instanceof Error ? e.message : 'Network error' };
    }
}

/**
 * Hangi Meta API error kodları "template bu dilde onaylı değil" demek?
 * 132001: Template name does not exist in the translation.
 * 132000: Number of parameters does not match.
 * 132005: Translated text too long.
 * Bu kodlarda farklı dile fallback uygun. Diğer hatalarda (auth, rate-limit,
 * geçersiz numara) fallback faydasız — direkt dön.
 */
function isTemplateLanguageError(errorCode?: string): boolean {
    return errorCode === 'WA_132001' || errorCode === 'WA_132005';
}

/**
 * OTP kodunu Meta WhatsApp template ile gönder. Multi-language fallback:
 * Kullanıcının seçtiği dil onaylı değilse, sırasıyla 'en_US' → 'en' → 'tr'
 * dener. Numara herhangi bir ülkeden olabilir (Meta dil-bazlı template
 * onayı koyduğu için +1, +44, +49 numaralar bu fallback ile çalışır).
 *
 * Template Meta Business Manager'da onaylı olmalı — Türkçe (tr) zorunlu,
 * en/en_US opsiyonel ama tavsiye edilir (uluslararası kapsama için).
 */
export async function sendWhatsAppOtp(
    phoneE164: string,
    otpCode: string,
    lang?: string,
): Promise<WhatsAppSendResult> {
    // Trim — Secret Manager values can carry trailing newlines from copy-paste
    // and break appsecret_proof / Authorization header.
    const token = process.env.WHATSAPP_ACCESS_TOKEN?.trim();
    const appSecret = process.env.WHATSAPP_APP_SECRET?.trim();
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
    const templateName = process.env.WHATSAPP_OTP_TEMPLATE_NAME || 'otp_hangel';
    const defaultLang = process.env.WHATSAPP_OTP_TEMPLATE_LANG || 'tr';

    if (!token || !phoneNumberId) {
        return { ok: false, errorCode: 'WA_CONFIG_MISSING', errorMessage: 'WhatsApp env değişkenleri eksik (WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID).' };
    }

    // Fallback chain — kullanıcı seçtiği dil → en_US → en → tr (dedup).
    const requested = lang?.trim();
    const candidates: string[] = [];
    for (const c of [requested, 'en_US', 'en', defaultLang, 'tr']) {
        if (c && !candidates.includes(c)) candidates.push(c);
    }

    let lastResult: WhatsAppSendResult | null = null;
    for (const tryLang of candidates) {
        const result = await sendWhatsAppOtpOnce(phoneE164, otpCode, templateName, tryLang, token, phoneNumberId, appSecret);
        if (result.ok) return result;
        lastResult = result;
        // Yalnızca "template bu dilde yok" hatasında bir sonraki dili dene.
        if (!isTemplateLanguageError(result.errorCode)) break;
    }
    return lastResult ?? { ok: false, errorCode: 'WA_UNKNOWN_ERROR', errorMessage: 'Bilinmeyen hata' };
}
