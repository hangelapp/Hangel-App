/**
 * Mock payment provider — dev/test. Hemen "paid" callback'i hazırlar.
 */

import type {
  PaymentCallbackResult,
  PaymentIntentInput,
  PaymentIntentResult,
  PaymentProvider,
} from './types';

export class MockPaymentProvider implements PaymentProvider {
  readonly driver = 'mock';

  async createPaymentIntent(input: PaymentIntentInput): Promise<PaymentIntentResult> {
    const orderId = `mock_pay_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    // Mock: dev için, ödeme sayfası yerine direkt callback'i tetikleyen URL döner
    const base = (process.env.NEXT_PUBLIC_APP_URL ?? 'http://127.0.0.1:9002').replace(/\/$/, '');
    const redirectUrl = `${base}/api/messaging/payment/nkolay/callback?mock=1&orderId=${orderId}&status=success&amount=${input.amount}`;
    return { orderId, providerOrderId: orderId, redirectUrl };
  }

  async verifyCallback(req: Request): Promise<PaymentCallbackResult> {
    const url = new URL(req.url);
    return {
      orderId: url.searchParams.get('orderId') ?? '',
      status: (url.searchParams.get('status') as 'success' | 'fail') ?? 'success',
      paidAmount: Number(url.searchParams.get('amount') ?? '0'),
      raw: { mock: true, query: Object.fromEntries(url.searchParams) },
    };
  }
}
