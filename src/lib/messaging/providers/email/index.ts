import type { EmailProvider } from '../../types';
import { MockEmailProvider } from './mock';
import { ResendEmailProvider } from './resend';
import { SmtpEmailProvider } from './smtp';

let cached: EmailProvider | null = null;

export function getEmailProvider(): EmailProvider {
  if (cached) return cached;
  const driver = (process.env.EMAIL_DRIVER ?? 'mock').toLowerCase();
  switch (driver) {
    case 'resend': {
      const apiKey = process.env.RESEND_API_KEY;
      if (!apiKey) {
        console.warn('[messaging] RESEND_API_KEY eksik, mock kullanılıyor');
        cached = new MockEmailProvider();
        return cached;
      }
      cached = new ResendEmailProvider({ apiKey });
      return cached;
    }
    case 'smtp': {
      const host = process.env.SMTP_HOST;
      const portRaw = process.env.SMTP_PORT;
      const user = process.env.SMTP_USER;
      const password = process.env.SMTP_PASSWORD;
      if (!host || !portRaw || !user || !password) {
        console.warn(
          '[messaging] SMTP_HOST/PORT/USER/PASSWORD eksik, mock kullanılıyor'
        );
        cached = new MockEmailProvider();
        return cached;
      }
      const port = Number.parseInt(portRaw, 10);
      if (!Number.isFinite(port) || port < 1 || port > 65535) {
        console.warn(
          `[messaging] SMTP_PORT geçersiz (${portRaw}), mock kullanılıyor`
        );
        cached = new MockEmailProvider();
        return cached;
      }
      const secure = process.env.SMTP_SECURE === 'true' || port === 465;
      cached = new SmtpEmailProvider({ host, port, secure, user, password });
      return cached;
    }
    case 'mock':
    default:
      cached = new MockEmailProvider();
      return cached;
  }
}

export function resetEmailProvider(): void {
  cached = null;
}
