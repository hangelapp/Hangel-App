/**
 * Stub WhatsApp Cloud adapter — local dev için.
 *
 * Hiçbir gerçek API çağrısı yapmaz. WABA_STUB=true ile aktif olur.
 * Aynı public yüzeye sahip (factory üzerinden geçişli kullanım).
 */

import type {
    CreateTemplateOpts,
    ListedTemplate,
    MetaCloudConfig,
    PhoneNumberInfo,
    RequestVerificationOpts,
    SendInteractiveOpts,
    SendTemplateOpts,
    SendTextOpts,
    VerifyCodeOpts,
} from './meta-cloud';

function fakeMessageId(): string {
    const rand = Math.random().toString(36).slice(2, 10);
    return `wamid.stub_${Date.now()}_${rand}`;
}

function isDev(): boolean {
    return process.env.NODE_ENV !== 'production';
}

function log(scope: string, payload: unknown): void {
    if (!isDev()) return;
    // eslint-disable-next-line no-console
    console.log(`[waba-stub] ${scope}`, payload);
}

export class StubWhatsAppCloud {
    private readonly config: MetaCloudConfig;

    constructor(config: MetaCloudConfig) {
        this.config = config;
    }

    async sendTemplate(opts: SendTemplateOpts): Promise<{ wabaMessageId: string; contactWaId: string }> {
        log('sendTemplate', { phoneNumberId: this.config.phoneNumberId, ...opts });
        return {
            wabaMessageId: fakeMessageId(),
            contactWaId: opts.to.replace(/\D/g, '').replace(/^0+/, ''),
        };
    }

    async sendText(opts: SendTextOpts): Promise<{ wabaMessageId: string }> {
        log('sendText', { phoneNumberId: this.config.phoneNumberId, ...opts });
        return { wabaMessageId: fakeMessageId() };
    }

    async sendInteractive(opts: SendInteractiveOpts): Promise<{ wabaMessageId: string }> {
        log('sendInteractive', { phoneNumberId: this.config.phoneNumberId, ...opts });
        return { wabaMessageId: fakeMessageId() };
    }

    async createTemplate(opts: CreateTemplateOpts): Promise<{ id: string; status: string }> {
        log('createTemplate', opts);
        return {
            id: `tpl_stub_${Date.now()}`,
            status: 'PENDING',
        };
    }

    async listTemplates(wabaId: string): Promise<ListedTemplate[]> {
        log('listTemplates', { wabaId });
        return [];
    }

    async getPhoneNumberInfo(phoneNumberId: string): Promise<PhoneNumberInfo> {
        log('getPhoneNumberInfo', { phoneNumberId });
        return {
            display_phone_number: '+90 555 000 00 00',
            verified_name: 'Stub STK',
            quality_rating: 'GREEN',
            code_verification_status: 'VERIFIED',
        };
    }

    async requestVerificationCode(opts: RequestVerificationOpts): Promise<{ success: boolean }> {
        log('requestVerificationCode', opts);
        return { success: true };
    }

    async verifyCode(opts: VerifyCodeOpts): Promise<{ success: boolean }> {
        log('verifyCode', opts);
        return { success: true };
    }
}
