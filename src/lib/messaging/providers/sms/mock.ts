/**
 * Mock SMS provider — dev/test için.
 * Console'a log atar ve _devOutbox koleksiyonuna yazar.
 * Ücretli servis vurmadan tam akış denenebilir.
 */

import { getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { SendResult, SmsProvider, SmsSendInput } from '../../types';

export class MockSmsProvider implements SmsProvider {
  readonly driver = 'mock';

  async send(input: SmsSendInput): Promise<SendResult> {
    const providerMessageId = `mock_sms_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    console.log('[MockSmsProvider] sending', {
      to: input.to,
      senderId: input.senderId,
      useCase: input.useCase,
      bodyPreview: input.body.slice(0, 60),
    });

    try {
      const db = getAdminFirestore();
      await db.collection('_devOutbox').add({
        channel: 'sms',
        driver: this.driver,
        providerMessageId,
        to: input.to,
        senderId: input.senderId,
        useCase: input.useCase,
        body: input.body,
        createdAt: FieldValue.serverTimestamp(),
      });
    } catch (err) {
      console.warn('[MockSmsProvider] _devOutbox write failed', err);
    }

    return { ok: true, providerMessageId };
  }
}
