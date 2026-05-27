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
    // Why: prod guard — yanlışlıkla mock driver set edilirse email PII'si log/outbox'a sızar.
    if (process.env.NODE_ENV === 'production' && process.env.EMAIL_DRIVER === 'mock') {
      throw new Error('MockEmailProvider cannot run in production');
    }
    const providerMessageId = `mock_email_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // PII mask: email local-part'ın ilk 2 hane + son 2 hane, gerisi *
    const maskEmail = (e: string) => {
      const at = e.indexOf('@');
      if (at < 4) return e.replace(/./g, '*');
      const local = e.slice(0, at);
      const masked = local.slice(0, 2) + '*'.repeat(Math.max(0, local.length - 4)) + local.slice(-2);
      return masked + e.slice(at);
    };
    console.log('[MockEmailProvider] sending', {
      to: maskEmail(input.to),
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
