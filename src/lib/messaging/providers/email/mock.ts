/**
 * Mock e-posta provider — dev/test için.
 * Console'a log atar ve _devOutbox koleksiyonuna yazar.
 */

import { getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import type { EmailProvider, EmailSendInput, SendResult } from '../../types';

export class MockEmailProvider implements EmailProvider {
  readonly driver = 'mock';

  async send(input: EmailSendInput): Promise<SendResult> {
    const providerMessageId = `mock_email_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    console.log('[MockEmailProvider] sending', {
      to: input.to,
      from: `${input.fromName} <${input.fromEmail}>`,
      subject: input.subject,
      useCase: input.useCase,
      hasUnsubscribe: !!input.unsubscribeUrl,
    });

    try {
      const db = getAdminFirestore();
      await db.collection(COLLECTIONS._devOutbox).add({
        channel: 'email',
        driver: this.driver,
        providerMessageId,
        to: input.to,
        fromEmail: input.fromEmail,
        fromName: input.fromName,
        replyTo: input.replyTo ?? null,
        subject: input.subject,
        html: input.html,
        text: input.text ?? null,
        unsubscribeUrl: input.unsubscribeUrl ?? null,
        useCase: input.useCase,
        tags: input.tags ?? null,
        createdAt: FieldValue.serverTimestamp(),
      });
    } catch (err) {
      console.warn('[MockEmailProvider] _devOutbox write failed', err);
    }

    return { ok: true, providerMessageId };
  }
}
