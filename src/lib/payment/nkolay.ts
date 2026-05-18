/**
 * N-Kolay (Aktif Bank) ödeme adapter.
 *
 * NOT: Bu implementation N-Kolay'ın paymentLink API'sinin standart pattern'ine göre yazılmıştır.
 * Üretime almadan önce N-Kolay teknik dokümanına göre endpoint URL, alan isimleri ve
 * HMAC algoritması güncellenmeli.
 *
 * Env vars:
 *  - NKOLAY_API_URL         (default: https://paynkolay.nkolayislem.com.tr)
 *  - NKOLAY_SX              (merchant SX kodu)
 *  - NKOLAY_API_KEY         (auth)
 *  - NKOLAY_SECRET_KEY      (HMAC için)
 */

import crypto from 'crypto';
import type {
  PaymentCallbackResult,
  PaymentIntentInput,
  PaymentIntentResult,
  PaymentProvider,
} from './types';

interface NkolayConfig {
  apiUrl: string;
  sx: string;
  apiKey: string;
  secretKey: string;
}

interface NkolayLinkResponse {
  Success?: boolean;
  Url?: string;
  ReferenceCode?: string;
  Message?: string;
}

export class NkolayPaymentProvider implements PaymentProvider {
  readonly driver = 'nkolay';
  private config: NkolayConfig;

  constructor(config: NkolayConfig) {
    this.config = config;
  }

  async createPaymentIntent(input: PaymentIntentInput): Promise<PaymentIntentResult> {
    const orderId = `pay_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

    const body = {
      sx: this.config.sx,
      apiKey: this.config.apiKey,
      amount: input.amount.toFixed(2),
      currency: 'TRY',
      referenceCode: orderId,
      description: `${input.packageName} - NGO ${input.ngoId}`,
      successUrl: input.successUrl,
      failureUrl: input.failureUrl,
      callbackUrl: `${input.successUrl.replace(/\/[^/]+$/, '')}/callback`,
      installment: 1,
      use3D: true,
    };

    let res: Response;
    try {
      res = await fetch(`${this.config.apiUrl}/PaymentLink/Create`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch (err) {
      throw new Error(`N-Kolay network: ${err instanceof Error ? err.message : 'unknown'}`, { cause: err });
    }

    let json: NkolayLinkResponse;
    try {
      json = (await res.json()) as NkolayLinkResponse;
    } catch {
      throw new Error(`N-Kolay geçersiz yanıt HTTP ${res.status}`);
    }

    if (!res.ok || !json.Success || !json.Url) {
      throw new Error(`N-Kolay hatası: ${json.Message ?? `HTTP ${res.status}`}`);
    }

    return {
      orderId,
      providerOrderId: json.ReferenceCode ?? orderId,
      redirectUrl: json.Url,
    };
  }

  async verifyCallback(req: Request): Promise<PaymentCallbackResult> {
    // N-Kolay callback: form-encoded veya JSON; orderId + amount + signature taşır
    const contentType = req.headers.get('content-type') ?? '';
    let payload: Record<string, string>;
    if (contentType.includes('application/json')) {
      payload = (await req.json()) as Record<string, string>;
    } else {
      const text = await req.text();
      payload = Object.fromEntries(new URLSearchParams(text));
    }

    const orderId = payload.referenceCode ?? payload.orderId ?? '';
    const status = (payload.status ?? payload.Status ?? '').toLowerCase();
    const amount = Number(payload.amount ?? payload.Amount ?? 0);
    const providedSig = payload.signature ?? payload.Signature ?? '';

    // HMAC verify: secret + orderId + amount → expected
    const expectedSig = crypto
      .createHmac('sha256', this.config.secretKey)
      .update(`${orderId}|${amount}`)
      .digest('hex');

    let ok = true;
    if (providedSig) {
      try {
        ok = crypto.timingSafeEqual(Buffer.from(providedSig), Buffer.from(expectedSig));
      } catch {
        ok = false;
      }
    }

    return {
      orderId,
      status: ok && (status === 'success' || status === '1' || status === 'paid') ? 'success' : 'fail',
      paidAmount: amount,
      raw: payload,
    };
  }
}
