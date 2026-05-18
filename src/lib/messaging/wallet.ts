/**
 * NGO mesajlaşma cüzdanı — atomik finansal operasyonlar.
 *
 * Akış:
 *  - reserve: kampanya create öncesi balance'ı düşür, reserved'a aktar (race-safe runTransaction)
 *  - debit: başarılı send sonrası reserved'tan düş (consume)
 *  - refund: terminal fail sonrası reserved'tan düş + balance'a iade
 *  - topup: ödeme callback veya manuel ekleme
 *  - cancel: kampanya iptal olunca kalan reserved → balance
 */

import { getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/firebase/collections';

export type TransactionType = 'topup' | 'reserve' | 'debit' | 'refund' | 'cancel_release' | 'admin_adjust';

export interface WalletDoc {
  ngoId: string;
  balance: number;       // TRY
  reserved: number;
  freeQuotaUsed: { sms: number; email: number; whatsapp: number };
  currency: 'TRY';
  lowBalanceThreshold: number;
  autoTopupEnabled: boolean;
  updatedAt?: unknown;
}

const DEFAULT_LOW_BALANCE_THRESHOLD = 100;

function walletRef(ngoId: string) {
  return getAdminFirestore().collection(COLLECTIONS.ngoMessagingWallets).doc(ngoId);
}

export async function getWallet(ngoId: string): Promise<WalletDoc> {
  const ref = walletRef(ngoId);
  const snap = await ref.get();
  if (snap.exists) return snap.data() as WalletDoc;
  return {
    ngoId,
    balance: 0,
    reserved: 0,
    freeQuotaUsed: { sms: 0, email: 0, whatsapp: 0 },
    currency: 'TRY',
    lowBalanceThreshold: DEFAULT_LOW_BALANCE_THRESHOLD,
    autoTopupEnabled: false,
  };
}

async function writeTransaction(
  ngoId: string,
  type: TransactionType,
  amount: number,
  balanceAfter: number,
  reservedAfter: number,
  extra: Record<string, unknown> = {}
): Promise<void> {
  const db = getAdminFirestore();
  await db.collection(COLLECTIONS.messagingTransactions).add({
    ngoId,
    type,
    amount,
    balanceAfter,
    reservedAfter,
    createdAt: FieldValue.serverTimestamp(),
    ...extra,
  });
}

export interface ReserveOptions {
  ngoId: string;
  amount: number;              // TRY toplam (KDV dahil)
  campaignId: string;
  channel?: 'sms' | 'email' | 'whatsapp';
  freeUnitsUsed?: number;
  actorUid?: string;
}

export class InsufficientBalanceError extends Error {
  constructor(public balance: number, public required: number) {
    super(`Yetersiz bakiye: ${balance} TRY, gereken ${required} TRY`);
    this.name = 'InsufficientBalanceError';
  }
}

export async function reserve(opts: ReserveOptions): Promise<{ balance: number; reserved: number }> {
  const db = getAdminFirestore();
  const ref = walletRef(opts.ngoId);

  const result = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const current = snap.exists
      ? (snap.data() as WalletDoc)
      : {
          ngoId: opts.ngoId,
          balance: 0,
          reserved: 0,
          freeQuotaUsed: { sms: 0, email: 0, whatsapp: 0 },
          currency: 'TRY' as const,
          lowBalanceThreshold: DEFAULT_LOW_BALANCE_THRESHOLD,
          autoTopupEnabled: false,
        };

    if (current.balance < opts.amount) {
      throw new InsufficientBalanceError(current.balance, opts.amount);
    }

    const newBalance = +(current.balance - opts.amount).toFixed(2);
    const newReserved = +(current.reserved + opts.amount).toFixed(2);
    const newFreeUsed = { ...current.freeQuotaUsed };
    if (opts.channel && opts.freeUnitsUsed) {
      newFreeUsed[opts.channel] = (newFreeUsed[opts.channel] ?? 0) + opts.freeUnitsUsed;
    }

    tx.set(
      ref,
      {
        ...current,
        balance: newBalance,
        reserved: newReserved,
        freeQuotaUsed: newFreeUsed,
        updatedAt: Timestamp.now(),
      },
      { merge: true }
    );

    return { balance: newBalance, reserved: newReserved };
  });

  await writeTransaction(opts.ngoId, 'reserve', opts.amount, result.balance, result.reserved, {
    campaignId: opts.campaignId,
    channel: opts.channel ?? null,
    createdBy: opts.actorUid ?? null,
  });

  return result;
}

export async function debit(opts: {
  ngoId: string;
  amount: number;
  campaignId: string;
  jobId: string;
  channel: 'sms' | 'email' | 'whatsapp';
}): Promise<void> {
  const db = getAdminFirestore();
  const ref = walletRef(opts.ngoId);

  const result = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return null;
    const current = snap.data() as WalletDoc;
    const newReserved = Math.max(0, +(current.reserved - opts.amount).toFixed(2));
    tx.update(ref, { reserved: newReserved, updatedAt: Timestamp.now() });
    return { balance: current.balance, reserved: newReserved };
  });

  if (!result) return;

  await writeTransaction(opts.ngoId, 'debit', opts.amount, result.balance, result.reserved, {
    campaignId: opts.campaignId,
    jobId: opts.jobId,
    channel: opts.channel,
  });
}

export async function refund(opts: {
  ngoId: string;
  amount: number;
  campaignId: string;
  jobId: string;
  channel: 'sms' | 'email' | 'whatsapp';
  reason?: string;
}): Promise<void> {
  const db = getAdminFirestore();
  const ref = walletRef(opts.ngoId);

  const result = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return null;
    const current = snap.data() as WalletDoc;
    const newReserved = Math.max(0, +(current.reserved - opts.amount).toFixed(2));
    const newBalance = +(current.balance + opts.amount).toFixed(2);
    tx.update(ref, { balance: newBalance, reserved: newReserved, updatedAt: Timestamp.now() });
    return { balance: newBalance, reserved: newReserved };
  });

  if (!result) return;

  await writeTransaction(opts.ngoId, 'refund', opts.amount, result.balance, result.reserved, {
    campaignId: opts.campaignId,
    jobId: opts.jobId,
    channel: opts.channel,
    notes: opts.reason ?? null,
  });
}

export async function topup(opts: {
  ngoId: string;
  amount: number;
  paymentOrderId?: string;
  actorUid?: string;
  notes?: string;
}): Promise<{ balance: number; reserved: number }> {
  const db = getAdminFirestore();
  const ref = walletRef(opts.ngoId);

  const result = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const current = snap.exists
      ? (snap.data() as WalletDoc)
      : {
          ngoId: opts.ngoId,
          balance: 0,
          reserved: 0,
          freeQuotaUsed: { sms: 0, email: 0, whatsapp: 0 },
          currency: 'TRY' as const,
          lowBalanceThreshold: DEFAULT_LOW_BALANCE_THRESHOLD,
          autoTopupEnabled: false,
        };
    const newBalance = +(current.balance + opts.amount).toFixed(2);
    tx.set(
      ref,
      { ...current, balance: newBalance, updatedAt: Timestamp.now() },
      { merge: true }
    );
    return { balance: newBalance, reserved: current.reserved };
  });

  await writeTransaction(opts.ngoId, 'topup', opts.amount, result.balance, result.reserved, {
    paymentOrderId: opts.paymentOrderId ?? null,
    createdBy: opts.actorUid ?? null,
    notes: opts.notes ?? null,
  });

  return result;
}

export async function releaseReserved(opts: {
  ngoId: string;
  amount: number;
  campaignId: string;
  reason: string;
}): Promise<void> {
  const db = getAdminFirestore();
  const ref = walletRef(opts.ngoId);

  const result = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return null;
    const current = snap.data() as WalletDoc;
    const release = Math.min(opts.amount, current.reserved);
    const newReserved = Math.max(0, +(current.reserved - release).toFixed(2));
    const newBalance = +(current.balance + release).toFixed(2);
    tx.update(ref, { balance: newBalance, reserved: newReserved, updatedAt: Timestamp.now() });
    return { balance: newBalance, reserved: newReserved, released: release };
  });

  if (!result) return;

  await writeTransaction(opts.ngoId, 'cancel_release', result.released, result.balance, result.reserved, {
    campaignId: opts.campaignId,
    notes: opts.reason,
  });
}

export async function adminAdjust(opts: {
  ngoId: string;
  delta: number;   // pozitif veya negatif
  actorUid: string;
  notes?: string;
}): Promise<{ balance: number; reserved: number }> {
  const db = getAdminFirestore();
  const ref = walletRef(opts.ngoId);

  const result = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const current = snap.exists
      ? (snap.data() as WalletDoc)
      : {
          ngoId: opts.ngoId,
          balance: 0,
          reserved: 0,
          freeQuotaUsed: { sms: 0, email: 0, whatsapp: 0 },
          currency: 'TRY' as const,
          lowBalanceThreshold: DEFAULT_LOW_BALANCE_THRESHOLD,
          autoTopupEnabled: false,
        };
    const newBalance = +(current.balance + opts.delta).toFixed(2);
    if (newBalance < 0) {
      throw new Error(`Bakiye negatif olamaz: ${newBalance}`);
    }
    tx.set(
      ref,
      { ...current, balance: newBalance, updatedAt: Timestamp.now() },
      { merge: true }
    );
    return { balance: newBalance, reserved: current.reserved };
  });

  await writeTransaction(opts.ngoId, 'admin_adjust', opts.delta, result.balance, result.reserved, {
    createdBy: opts.actorUid,
    notes: opts.notes ?? null,
  });

  return result;
}
