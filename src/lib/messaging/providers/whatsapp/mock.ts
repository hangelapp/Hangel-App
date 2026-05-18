/**
 * Mock WhatsApp provider — dev/test için.
 */

import { getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import type {
  SendResult,
  WhatsAppProvider,
  WhatsAppSendInput,
  WhatsAppTemplateInfo,
} from '../../types';

export class MockWhatsAppProvider implements WhatsAppProvider {
  readonly driver = 'mock';

  async send(input: WhatsAppSendInput): Promise<SendResult> {
    const providerMessageId = `mock_wa_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    console.log('[MockWhatsAppProvider] sending', {
      to: input.to,
      template: input.templateName,
      language: input.templateLanguage,
      category: input.conversationCategory,
      useCase: input.useCase,
    });

    try {
      const db = getAdminFirestore();
      await db.collection(COLLECTIONS._devOutbox).add({
        channel: 'whatsapp',
        driver: this.driver,
        providerMessageId,
        to: input.to,
        templateName: input.templateName,
        templateLanguage: input.templateLanguage,
        components: input.components ?? null,
        conversationCategory: input.conversationCategory,
        useCase: input.useCase,
        wabaPhoneNumberId: input.wabaPhoneNumberId,
        createdAt: FieldValue.serverTimestamp(),
      });
    } catch (err) {
      console.warn('[MockWhatsAppProvider] _devOutbox write failed', err);
    }

    return { ok: true, providerMessageId };
  }

  async syncTemplates(_wabaId: string): Promise<WhatsAppTemplateInfo[]> {
    return [
      { name: 'hosgeldin_uyari', language: 'tr', category: 'UTILITY', status: 'APPROVED', body: 'Merhaba {{1}}, Hangel\'e hoş geldiniz.' },
      { name: 'bagis_tesekkur', language: 'tr', category: 'UTILITY', status: 'APPROVED', body: '{{1}} TL bağışınız için teşekkürler.' },
    ];
  }
}
