/**
 * Meta WhatsApp Cloud API adapter.
 *
 * Pure HTTP wrapper around Graph API v21.0. No Firestore writes — storage is
 * the caller's responsibility. Multi-tenant: bir instance, bir STK'nın
 * access_token + phoneNumberId çiftine bağlıdır.
 */

const BASE_URL = 'https://graph.facebook.com/v21.0';

export interface MetaCloudConfig {
    accessToken: string;
    phoneNumberId: string;
    wabaId?: string;
}

export type MetaCloudErrorCategory =
    | 'rate_limit'
    | 'invalid_token'
    | 'template_not_approved'
    | 'invalid_phone'
    | 'message_undeliverable'
    | 'permission_denied'
    | 'not_found'
    | 'network'
    | 'unknown';

export class MetaCloudError extends Error {
    readonly category: MetaCloudErrorCategory;
    readonly status: number;
    readonly metaCode?: number;
    readonly metaSubcode?: number;
    readonly details?: string;

    constructor(opts: {
        message: string;
        category: MetaCloudErrorCategory;
        status: number;
        metaCode?: number;
        metaSubcode?: number;
        details?: string;
    }) {
        super(opts.message);
        this.name = 'MetaCloudError';
        this.category = opts.category;
        this.status = opts.status;
        this.metaCode = opts.metaCode;
        this.metaSubcode = opts.metaSubcode;
        this.details = opts.details;
    }
}

interface MetaErrorPayload {
    error?: {
        message?: string;
        type?: string;
        code?: number;
        error_subcode?: number;
        error_data?: { details?: string };
        fbtrace_id?: string;
    };
}

function categorize(status: number, code?: number, subcode?: number): MetaCloudErrorCategory {
    if (status === 401 || code === 190) return 'invalid_token';
    if (status === 403 || code === 200 || code === 10) return 'permission_denied';
    if (status === 404) return 'not_found';
    if (status === 429 || code === 4 || code === 80007 || code === 130429) return 'rate_limit';
    if (code === 132000 || code === 132001 || code === 132005 || code === 132007 || code === 132012 || code === 132015 || code === 132016) {
        return 'template_not_approved';
    }
    if (code === 131026 || code === 131047 || code === 131051) return 'message_undeliverable';
    if (code === 131009 || code === 131008) return 'invalid_phone';
    return 'unknown';
}

function isDev(): boolean {
    return process.env.NODE_ENV !== 'production';
}

async function request<T>(
    accessToken: string,
    path: string,
    init: { method: 'GET' | 'POST' | 'DELETE'; body?: unknown },
): Promise<T> {
    const url = `${BASE_URL}${path}`;
    let res: Response;
    try {
        res = await fetch(url, {
            method: init.method,
            headers: {
                'Authorization': `Bearer ${accessToken.trim()}`,
                'Content-Type': 'application/json',
            },
            body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
        });
    } catch (e) {
        const msg = e instanceof Error ? e.message : 'network error';
        throw new MetaCloudError({
            message: `Meta API erişilemedi: ${msg}`,
            category: 'network',
            status: 0,
        });
    }

    const raw: unknown = await res.json().catch(() => null);

    if (!res.ok) {
        const err = (raw as MetaErrorPayload | null)?.error;
        const code = err?.code;
        const subcode = err?.error_subcode;
        const category = categorize(res.status, code, subcode);
        const message = err?.message || err?.error_data?.details || `Meta API hata HTTP ${res.status}`;
        if (isDev()) {
            // eslint-disable-next-line no-console
            console.error('[meta-cloud]', res.status, category, message, raw);
        }
        throw new MetaCloudError({
            message,
            category,
            status: res.status,
            metaCode: code,
            metaSubcode: subcode,
            details: err?.error_data?.details,
        });
    }

    return raw as T;
}

function normalizeTo(to: string): string {
    return to.replace(/\D/g, '').replace(/^0+/, '');
}

export type TemplateComponentParameter =
    | { type: 'text'; text: string }
    | { type: 'image'; image: { link: string } }
    | { type: 'document'; document: { link: string; filename?: string } }
    | { type: 'video'; video: { link: string } }
    | { type: 'currency'; currency: { fallback_value: string; code: string; amount_1000: number } }
    | { type: 'date_time'; date_time: { fallback_value: string } }
    | { type: 'payload'; payload: string };

export interface TemplateComponent {
    type: 'header' | 'body' | 'button' | 'footer';
    sub_type?: 'url' | 'quick_reply' | 'copy_code';
    index?: string | number;
    parameters?: TemplateComponentParameter[];
}

export interface SendTemplateOpts {
    to: string;
    templateName: string;
    languageCode: string;
    components?: TemplateComponent[];
}

export interface SendTextOpts {
    to: string;
    body: string;
    previewUrl?: boolean;
}

export interface SendInteractiveOpts {
    to: string;
    body: string;
    buttons: Array<{ id: string; title: string }>;
    headerText?: string;
    footerText?: string;
}

export interface CreateTemplateOpts {
    wabaId: string;
    name: string;
    category: 'UTILITY' | 'MARKETING' | 'AUTHENTICATION';
    languageCode: string;
    components: Array<Record<string, unknown>>;
    allowCategoryChange?: boolean;
}

export interface ListedTemplate {
    id: string;
    name: string;
    status: string;
    category: string;
    language: string;
}

export interface PhoneNumberInfo {
    display_phone_number: string;
    verified_name: string;
    quality_rating: string;
    code_verification_status: string;
}

export interface RequestVerificationOpts {
    phoneNumberId: string;
    codeMethod: 'SMS' | 'VOICE';
    language: string;
}

export interface VerifyCodeOpts {
    phoneNumberId: string;
    code: string;
}

interface MetaSendResponse {
    messaging_product?: string;
    contacts?: Array<{ input?: string; wa_id?: string }>;
    messages?: Array<{ id?: string }>;
}

interface MetaTemplateCreateResponse {
    id?: string;
    status?: string;
    category?: string;
}

interface MetaTemplateListResponse {
    data?: Array<{
        id?: string;
        name?: string;
        status?: string;
        category?: string;
        language?: string;
    }>;
}

export class MetaWhatsAppCloud {
    private readonly config: MetaCloudConfig;

    constructor(config: MetaCloudConfig) {
        if (!config.accessToken) {
            throw new MetaCloudError({
                message: 'accessToken zorunlu',
                category: 'invalid_token',
                status: 0,
            });
        }
        if (!config.phoneNumberId) {
            throw new MetaCloudError({
                message: 'phoneNumberId zorunlu',
                category: 'not_found',
                status: 0,
            });
        }
        this.config = config;
    }

    async sendTemplate(opts: SendTemplateOpts): Promise<{ wabaMessageId: string; contactWaId: string }> {
        const body = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: normalizeTo(opts.to),
            type: 'template',
            template: {
                name: opts.templateName,
                language: { code: opts.languageCode },
                ...(opts.components && opts.components.length > 0 ? { components: opts.components } : {}),
            },
        };
        const res = await request<MetaSendResponse>(
            this.config.accessToken,
            `/${this.config.phoneNumberId}/messages`,
            { method: 'POST', body },
        );
        const wabaMessageId = res.messages?.[0]?.id;
        const contactWaId = res.contacts?.[0]?.wa_id || normalizeTo(opts.to);
        if (!wabaMessageId) {
            throw new MetaCloudError({
                message: 'Meta yanıtında message id yok',
                category: 'unknown',
                status: 200,
            });
        }
        return { wabaMessageId, contactWaId };
    }

    async sendText(opts: SendTextOpts): Promise<{ wabaMessageId: string }> {
        const body = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: normalizeTo(opts.to),
            type: 'text',
            text: {
                body: opts.body,
                preview_url: Boolean(opts.previewUrl),
            },
        };
        const res = await request<MetaSendResponse>(
            this.config.accessToken,
            `/${this.config.phoneNumberId}/messages`,
            { method: 'POST', body },
        );
        const wabaMessageId = res.messages?.[0]?.id;
        if (!wabaMessageId) {
            throw new MetaCloudError({
                message: 'Meta yanıtında message id yok',
                category: 'unknown',
                status: 200,
            });
        }
        return { wabaMessageId };
    }

    async sendInteractive(opts: SendInteractiveOpts): Promise<{ wabaMessageId: string }> {
        if (opts.buttons.length === 0 || opts.buttons.length > 3) {
            throw new MetaCloudError({
                message: 'Buton sayısı 1-3 arası olmalı',
                category: 'unknown',
                status: 0,
            });
        }
        const interactive: Record<string, unknown> = {
            type: 'button',
            body: { text: opts.body },
            action: {
                buttons: opts.buttons.map((b) => ({
                    type: 'reply',
                    reply: { id: b.id, title: b.title },
                })),
            },
        };
        if (opts.headerText) {
            interactive.header = { type: 'text', text: opts.headerText };
        }
        if (opts.footerText) {
            interactive.footer = { text: opts.footerText };
        }
        const body = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: normalizeTo(opts.to),
            type: 'interactive',
            interactive,
        };
        const res = await request<MetaSendResponse>(
            this.config.accessToken,
            `/${this.config.phoneNumberId}/messages`,
            { method: 'POST', body },
        );
        const wabaMessageId = res.messages?.[0]?.id;
        if (!wabaMessageId) {
            throw new MetaCloudError({
                message: 'Meta yanıtında message id yok',
                category: 'unknown',
                status: 200,
            });
        }
        return { wabaMessageId };
    }

    async createTemplate(opts: CreateTemplateOpts): Promise<{ id: string; status: string }> {
        const body: Record<string, unknown> = {
            name: opts.name,
            category: opts.category,
            language: opts.languageCode,
            components: opts.components,
        };
        if (opts.allowCategoryChange) {
            body.allow_category_change = true;
        }
        const res = await request<MetaTemplateCreateResponse>(
            this.config.accessToken,
            `/${opts.wabaId}/message_templates`,
            { method: 'POST', body },
        );
        if (!res.id) {
            throw new MetaCloudError({
                message: 'Meta template create yanıtında id yok',
                category: 'unknown',
                status: 200,
            });
        }
        return { id: res.id, status: res.status || 'PENDING' };
    }

    async listTemplates(wabaId: string): Promise<ListedTemplate[]> {
        const res = await request<MetaTemplateListResponse>(
            this.config.accessToken,
            `/${wabaId}/message_templates?fields=id,name,status,category,language&limit=200`,
            { method: 'GET' },
        );
        return (res.data || []).map((t) => ({
            id: t.id || '',
            name: t.name || '',
            status: t.status || 'UNKNOWN',
            category: t.category || 'UNKNOWN',
            language: t.language || '',
        }));
    }

    async getPhoneNumberInfo(phoneNumberId: string): Promise<PhoneNumberInfo> {
        const res = await request<Partial<PhoneNumberInfo>>(
            this.config.accessToken,
            `/${phoneNumberId}?fields=display_phone_number,verified_name,quality_rating,code_verification_status`,
            { method: 'GET' },
        );
        return {
            display_phone_number: res.display_phone_number || '',
            verified_name: res.verified_name || '',
            quality_rating: res.quality_rating || 'UNKNOWN',
            code_verification_status: res.code_verification_status || 'UNKNOWN',
        };
    }

    async requestVerificationCode(opts: RequestVerificationOpts): Promise<{ success: boolean }> {
        const body = {
            code_method: opts.codeMethod,
            language: opts.language,
        };
        const res = await request<{ success?: boolean }>(
            this.config.accessToken,
            `/${opts.phoneNumberId}/request_code`,
            { method: 'POST', body },
        );
        return { success: Boolean(res.success) };
    }

    async verifyCode(opts: VerifyCodeOpts): Promise<{ success: boolean }> {
        const body = { code: opts.code };
        const res = await request<{ success?: boolean }>(
            this.config.accessToken,
            `/${opts.phoneNumberId}/verify_code`,
            { method: 'POST', body },
        );
        return { success: Boolean(res.success) };
    }
}
