/**
 * Ödeme provider abstraction tipleri.
 */

export interface PaymentIntentInput {
  ngoId: string;
  amount: number;          // TRY (KDV dahil)
  packageId: string;
  packageName: string;
  successUrl: string;
  failureUrl: string;
  metadata?: Record<string, string>;
}

export interface PaymentIntentResult {
  orderId: string;         // internal paymentOrders doc id
  providerOrderId?: string;
  redirectUrl: string;     // NGO bu URL'e yönlendirilir
}

export interface PaymentCallbackResult {
  orderId: string;
  status: 'success' | 'fail';
  paidAmount?: number;
  raw: unknown;
}

export interface PaymentProvider {
  readonly driver: string;
  createPaymentIntent(input: PaymentIntentInput): Promise<PaymentIntentResult>;
  verifyCallback(req: Request): Promise<PaymentCallbackResult>;
}
