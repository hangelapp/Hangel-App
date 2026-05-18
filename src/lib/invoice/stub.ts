/**
 * e-Arşiv invoice stub. Şimdilik sadece Firestore'a invoice kaydı yazar;
 * gerçek e-Arşiv entegrasyonu (Nilvera/Logo/Mikro) sonraki fazda eklenir.
 */

import { getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  total: number;
}

export interface CreateInvoiceInput {
  ngoId: string;
  paymentOrderId: string;
  amount: number;       // brüt
  vatAmount: number;
  netAmount: number;
  currency: 'TRY';
  lines: InvoiceLineItem[];
  notes?: string;
}

export async function createInvoiceStub(input: CreateInvoiceInput): Promise<string> {
  const db = getAdminFirestore();
  const ref = db.collection('messagingInvoices').doc();
  await ref.set({
    ngoId: input.ngoId,
    paymentOrderId: input.paymentOrderId,
    amount: input.amount,
    vatAmount: input.vatAmount,
    netAmount: input.netAmount,
    currency: input.currency,
    lines: input.lines,
    notes: input.notes ?? null,
    invoiceNumber: null,
    eArchiveStatus: 'pending',
    pdfUrl: null,
    createdAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}
