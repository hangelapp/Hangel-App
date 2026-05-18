import type { EmailProvider } from '../../types';
import { MockEmailProvider } from './mock';
import { ResendEmailProvider } from './resend';

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
    case 'smtp':
      console.warn('[messaging] EMAIL_DRIVER=smtp henüz implemente edilmedi, mock kullanılıyor');
      cached = new MockEmailProvider();
      return cached;
    case 'mock':
    default:
      cached = new MockEmailProvider();
      return cached;
  }
}

export function resetEmailProvider(): void {
  cached = null;
}
