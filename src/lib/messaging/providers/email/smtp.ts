/**
 * SMTP e-posta adapter (Google Workspace + generic SMTP).
 *
 * Bağlantı: STARTTLS (587) veya implicit SSL (465).
 * Auth: PLAIN. Google Workspace için **App Password** zorunlu (Google hesabında
 *       2FA aktif olmalı). https://myaccount.google.com/apppasswords
 * Webhook: SMTP'de teslim webhook'u yok — bounce/open/click izlenmez.
 *          Async bounce DSN'leri IMAP üzerinden okumak başka bir görevdir.
 */

import nodemailer, { type Transporter } from 'nodemailer';
import type {
  CanonicalErrorCode,
  EmailProvider,
  EmailSendInput,
  SendResult,
} from '../../types';

export interface SmtpConfig {
  host: string;
  port: number;
  secure?: boolean;
  user: string;
  password: string;
}

interface SmtpError {
  code?: string;
  responseCode?: number;
}

export class SmtpEmailProvider implements EmailProvider {
  readonly driver = 'smtp';
  private transporter: Transporter;

  constructor(config: SmtpConfig) {
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure ?? config.port === 465,
      auth: {
        user: config.user,
        pass: config.password,
      },
    });
  }

  async send(input: EmailSendInput): Promise<SendResult> {
    const headers: Record<string, string> = {};
    if (input.unsubscribeUrl) {
      headers['List-Unsubscribe'] = `<${input.unsubscribeUrl}>`;
      headers['List-Unsubscribe-Post'] = 'List-Unsubscribe=One-Click';
    }
    if (input.tags) {
      for (const [name, value] of Object.entries(input.tags)) {
        headers[`X-Tag-${name}`] = value;
      }
    }

    try {
      const info = await this.transporter.sendMail({
        from: `${input.fromName} <${input.fromEmail}>`,
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text,
        replyTo: input.replyTo,
        headers: Object.keys(headers).length > 0 ? headers : undefined,
      });

      return {
        ok: true,
        providerMessageId: info.messageId,
        raw: { response: info.response, envelope: info.envelope },
      };
    } catch (err) {
      const e = err as SmtpError;
      const message = err instanceof Error ? err.message : 'SMTP send failed';
      const responseCode = e.responseCode;
      const code = e.code;

      let errorCode: CanonicalErrorCode = 'unknown';
      if (code === 'ESOCKET' || code === 'ECONNECTION' || code === 'ETIMEDOUT') {
        errorCode = 'provider_5xx';
      } else if (responseCode && responseCode >= 500) {
        errorCode = 'provider_5xx';
      } else if (responseCode === 421 || responseCode === 451 || responseCode === 452) {
        errorCode = 'rate_limited';
      } else if (responseCode && responseCode >= 400 && responseCode < 500) {
        errorCode = code === 'EENVELOPE' ? 'invalid_address' : 'provider_4xx';
      }

      return {
        ok: false,
        errorCode,
        errorMessage: message,
        raw: { code, responseCode },
      };
    }
  }
}
