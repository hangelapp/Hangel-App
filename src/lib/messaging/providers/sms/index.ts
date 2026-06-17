import type { SmsProvider } from '../../types';
import { MockSmsProvider } from './mock';
import { NetgsmSmsProvider } from './netgsm';
import { PasifikSmsProvider } from './pasifik';

let cached: SmsProvider | null = null;

export function getSmsProvider(): SmsProvider {
  if (cached) return cached;
  const driver = (process.env.SMS_DRIVER ?? 'mock').toLowerCase();
  switch (driver) {
    case 'netgsm': {
      const username = process.env.NETGSM_USERNAME;
      const password = process.env.NETGSM_PASSWORD;
      const header = process.env.NETGSM_HEADER;
      if (!username || !password || !header) {
        console.warn('[messaging] Netgsm env eksik, mock kullanılıyor');
        cached = new MockSmsProvider();
        return cached;
      }
      cached = new NetgsmSmsProvider({
        username,
        password,
        header,
        iysFilter: process.env.NETGSM_IYS_FILTER,
        appKey: process.env.NETGSM_APP_KEY,
      });
      return cached;
    }
    case 'pasifik': {
      const username = process.env.PASIFIK_USERNAME;
      const password = process.env.PASIFIK_PASSWORD;
      const from = process.env.PASIFIK_FROM;
      if (!username || !password || !from) {
        console.warn('[messaging] Pasifik env eksik, mock kullanılıyor');
        cached = new MockSmsProvider();
        return cached;
      }
      cached = new PasifikSmsProvider({ username, password, from });
      return cached;
    }
    case 'iletimerkezi':
      console.warn('[messaging] SMS_DRIVER=iletimerkezi henüz implemente edilmedi, mock kullanılıyor');
      cached = new MockSmsProvider();
      return cached;
    case 'mock':
    default:
      cached = new MockSmsProvider();
      return cached;
  }
}

/** Test/sıfırlama için */
export function resetSmsProvider(): void {
  cached = null;
}
