import type { PaymentProvider } from './types';
import { MockPaymentProvider } from './mock';
import { NkolayPaymentProvider } from './nkolay';

let cached: PaymentProvider | null = null;

export function getPaymentProvider(): PaymentProvider {
  if (cached) return cached;
  const driver = (process.env.PAYMENT_DRIVER ?? 'mock').toLowerCase();
  switch (driver) {
    case 'nkolay': {
      const sx = process.env.NKOLAY_SX;
      const apiKey = process.env.NKOLAY_API_KEY;
      const secretKey = process.env.NKOLAY_SECRET_KEY;
      if (!sx || !apiKey || !secretKey) {
        console.warn('[payment] N-Kolay env eksik, mock kullanılıyor');
        cached = new MockPaymentProvider();
        return cached;
      }
      cached = new NkolayPaymentProvider({
        apiUrl: process.env.NKOLAY_API_URL ?? 'https://paynkolay.nkolayislem.com.tr',
        sx,
        apiKey,
        secretKey,
      });
      return cached;
    }
    case 'mock':
    default:
      cached = new MockPaymentProvider();
      return cached;
  }
}

export function resetPaymentProvider(): void {
  cached = null;
}

export * from './types';
