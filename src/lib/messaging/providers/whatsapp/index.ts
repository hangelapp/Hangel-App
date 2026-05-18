import type { WhatsAppProvider } from '../../types';
import { MockWhatsAppProvider } from './mock';
import { MetaCloudWhatsAppProvider } from './meta-cloud';

let cached: WhatsAppProvider | null = null;

export function getWhatsAppProvider(): WhatsAppProvider {
  if (cached) return cached;
  const driver = (process.env.WHATSAPP_DRIVER ?? 'mock').toLowerCase();
  switch (driver) {
    case 'meta-cloud':
    case 'meta': {
      const accessToken = process.env.META_WA_ACCESS_TOKEN;
      if (!accessToken) {
        console.warn('[messaging] META_WA_ACCESS_TOKEN eksik, mock kullanılıyor');
        cached = new MockWhatsAppProvider();
        return cached;
      }
      cached = new MetaCloudWhatsAppProvider({
        accessToken,
        appSecret: process.env.META_APP_SECRET,
      });
      return cached;
    }
    case 'mock':
    default:
      cached = new MockWhatsAppProvider();
      return cached;
  }
}

export function resetWhatsAppProvider(): void {
  cached = null;
}
