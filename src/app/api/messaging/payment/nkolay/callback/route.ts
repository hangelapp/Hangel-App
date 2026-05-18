/**
 * N-Kolay payment callback.
 *
 * Provider POST eder; signature verify + amount cross-check + idempotency check.
 * Başarılıysa paymentOrders.status='paid' → wallet.topup() → invoice stub create.
 */

import { NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { getPaymentProvider } from '@/lib/payment';
import { topup } from '@/lib/messaging/wallet';
import { createInvoiceStub } from '@/lib/invoice/stub';
import { getPricing } from '@/lib/messaging/pricing';
import { logAudit } from '@/lib/messaging/audit';

export const runtime = 'nodejs';

async function handle(req: Request) {
  const provider = getPaymentProvider();
  const verified = await provider.verifyCallback(req);
  if (!verified.orderId) {
    return NextResponse.json({ error: 'orderId yok' }, { status: 400 });
  }

  const db = getAdminFirestore();
  const orderRef = db.collection('paymentOrders').doc(verified.orderId);
  const orderSnap = await orderRef.get();
  if (!orderSnap.exists) {
    return NextResponse.json({ error: 'Order bulunamadı' }, { status: 404 });
  }

  const order = orderSnap.data() as {
    ngoId: string;
    amount: number;
    packageId: string;
    packageName?: string;
    status: string;
  };

  // Idempotency: zaten paid ise tekrar process etme
  if (order.status === 'paid') {
    return NextResponse.json({ ok: true, alreadyProcessed: true });
  }

  if (verified.status !== 'success') {
    await orderRef.update({
      status: 'failed',
      failedAt: FieldValue.serverTimestamp(),
      callbackRaw: verified.raw,
    });
    return NextResponse.json({ ok: false, status: 'failed' });
  }

  // Cross-check: callback amount paymentOrder amount ile eşleşmeli
  if (verified.paidAmount !== undefined && Math.abs(verified.paidAmount - order.amount) > 0.01) {
    console.error('[nkolay] amount mismatch', { expected: order.amount, paid: verified.paidAmount });
    await orderRef.update({
      status: 'failed',
      lastError: 'amount_mismatch',
      callbackRaw: verified.raw,
    });
    return NextResponse.json({ error: 'Tutar uyuşmazlığı' }, { status: 400 });
  }

  // Wallet'a yükle
  await topup({
    ngoId: order.ngoId,
    amount: order.amount,
    paymentOrderId: verified.orderId,
    notes: `${order.packageName ?? order.packageId} satın alımı`,
  });

  // Invoice (stub)
  const pricing = await getPricing();
  const vatRate = pricing.kdvRate;
  const netAmount = +(order.amount / (1 + vatRate)).toFixed(2);
  const vatAmount = +(order.amount - netAmount).toFixed(2);
  const invoiceId = await createInvoiceStub({
    ngoId: order.ngoId,
    paymentOrderId: verified.orderId,
    amount: order.amount,
    vatAmount,
    netAmount,
    currency: 'TRY',
    lines: [
      {
        description: order.packageName ?? order.packageId,
        quantity: 1,
        unitPrice: netAmount,
        vatRate,
        total: order.amount,
      },
    ],
  });

  await orderRef.update({
    status: 'paid',
    paidAt: FieldValue.serverTimestamp(),
    invoiceId,
    callbackRaw: verified.raw,
  });

  await logAudit(
    { uid: 'system', email: null },
    'consent.imported',
    { notes: `payment success ${order.amount} TRY → ${order.ngoId}` }
  );

  return NextResponse.json({ ok: true, orderId: verified.orderId, invoiceId });
}

export async function GET(req: Request) {
  // Mock provider success URL'i GET kullanır
  return handle(req);
}

export async function POST(req: Request) {
  return handle(req);
}
