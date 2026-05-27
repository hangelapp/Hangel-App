/**
 * Mock SMS provider — dev/test için.
 * Console'a log atar ve _devOutbox koleksiyonuna yazar.
 * Ücretli servis vurmadan tam akış denenebilir.
 */

import { getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import type { SendResult, SmsProvider, SmsSendInput } from '../../types';

export class MockSmsProvider implements SmsProvider {
  readonly driver = 'mock';

  async send(input: SmsSendInput): Promise<SendResult> {
    // Why: prod'da yanlışlıkla mock driver set edilirse phone numarası ve mesaj
    // içeriği console + _devOutbox'a yazılır (PII sızıntısı). Hard fail.
    if (process.env.NODE_ENV === 'production' && process.env.SMS_DRIVER === 'mock') {
      throw new Error('MockSmsProvider cannot run in production');
    }
    const providerMessageId = `mock_sms_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    console.log('[MockSmsProvider] sending', {
      to: input.to.slice(0, -4).replace(/\d/g, '*') + input.to.slice(-4),
      senderId: input.senderId,
      useCase: input.useCase,
      bodyPreview: input.body.slice(0, 60),
    });

    try {
      const db = getAdminFirestore();
      await db.collection(COLLECTIONS._devOutbox).add({
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
