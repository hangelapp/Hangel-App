/**
 * POST /api/ngo-admin/messaging/send-now
 *
 * STK admin'i toplu SMS gönderir — TRY-cüzdan bazlı senkron gönderim.
 *
 * Akış:
 *  1. authorize() — ngo-admin token + managedNgoId
 *  2. body validate — recipients[], body, useCase (transactional|marketing)
 *  3. computeCampaignCost — segment × birim × KDV (lib/messaging/pricing)
 *  4. wallet.balance >= total kontrolü (ngoMessagingWallets/{ngoId})
 *  5. messageJobs/{auto-id} yaz (özet/audit)
 *  6. getSmsProvider().send() — batch (rate-limit korumalı, ardışık)
 *  7. wallet'tan başarılı SMS başına maliyet düş; başarısızlar refund edilir
 *  8. yanıt: { jobId, sent, failed, balanceAfter }
 *
 * Pasifik adapter env'dan gelir; SMS_DRIVER=pasifik tüm STK'lar için ortak.
 * Hata format: { errorCode, message }.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { getSmsProvider } from '@/lib/messaging/providers/sms';
import { computeCampaignCost } from '@/lib/messaging/pricing';
import { toE164TR } from '@/lib/messaging/phone';
import type { UseCase } from '@/lib/messaging/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_RECIPIENTS = 1000;

interface Caller {
  uid: string;
  ngoId: string;
  role: 'ngo-admin' | 'super-admin';
}

async function authorize(req: NextRequest): Promise<Caller | null> {
  const idToken = (req.headers.get('authorization') || '').replace(/^Bearer /, '');
  if (!idToken) return null;
  try {
    const decoded = (await getAdminAuth().verifyIdToken(idToken)) as { uid: string; role?: string };
    const userSnap = await getAdminFirestore().collection(COLLECTIONS.users).doc(decoded.uid).get();
    const d = userSnap.data() as { role?: string; managedNgoId?: string } | undefined;
    if (!d?.managedNgoId) return null;
    if (d.role !== 'ngo-admin' && d.role !== 'super-admin') return null;
    return { uid: decoded.uid, ngoId: d.managedNgoId, role: d.role };
  } catch {
    return null;
  }
}

function maskPhone(to: string): string {
  return to.length > 4 ? to.slice(0, -4).replace(/./g, '*') + to.slice(-4) : '*'.repeat(to.length);
}

interface ReqBody {
  recipients?: unknown;
  body?: unknown;
  useCase?: unknown;
}

export async function POST(req: NextRequest) {
  const ctx = await authorize(req);
  if (!ctx) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'NGO admin yetkisi gerekli.' }, { status: 403 });
  }

  let body: ReqBody;
  try {
    body = (await req.json()) as ReqBody;
  } catch {
    return NextResponse.json({ errorCode: 'BAD_JSON', message: 'Geçersiz JSON gövdesi.' }, { status: 400 });
  }

  const messageBody = typeof body.body === 'string' ? body.body.trim() : '';
  const useCase: UseCase = body.useCase === 'transactional' ? 'transactional' : 'marketing';
  const rawRecipients = Array.isArray(body.recipients) ? body.recipients : [];

  if (!messageBody) {
    return NextResponse.json({ errorCode: 'BAD_INPUT', message: 'Mesaj metni boş olamaz.' }, { status: 400 });
  }
  if (rawRecipients.length === 0) {
    return NextResponse.json({ errorCode: 'BAD_INPUT', message: 'En az bir alıcı girin.' }, { status: 400 });
  }

  // Normalize + dedupe + validate (TR mobil; geçersizler sessizce atılır)
  const normalizedSet = new Set<string>();
  const invalidCount = { count: 0 };
  for (const item of rawRecipients) {
    if (typeof item !== 'string') {
      invalidCount.count += 1;
      continue;
    }
    const e164 = toE164TR(item);
    if (!e164) {
      invalidCount.count += 1;
      continue;
    }
    normalizedSet.add(e164.replace(/^\+/, ''));
  }
  const recipients = Array.from(normalizedSet);

  if (recipients.length === 0) {
    return NextResponse.json(
      { errorCode: 'NO_VALID_RECIPIENTS', message: 'Geçerli TR mobil numarası bulunamadı.' },
      { status: 400 },
    );
  }
  if (recipients.length > MAX_RECIPIENTS) {
    return NextResponse.json(
      {
        errorCode: 'TOO_MANY_RECIPIENTS',
        message: `Tek seferde en fazla ${MAX_RECIPIENTS} alıcı gönderebilirsiniz.`,
      },
      { status: 400 },
    );
  }

  const db = getAdminFirestore();
  const walletRef = db.collection(COLLECTIONS.ngoMessagingWallets).doc(ctx.ngoId);

  // Maliyet hesabı (KDV dahil)
  const cost = await computeCampaignCost({
    channel: 'sms',
    recipientCount: recipients.length,
    body: messageBody,
  });

  // Atomik bakiye kontrolü + reserve (balance → reserved). Yetersizse 409.
  const reserveResult = await db.runTransaction(async (tx) => {
    const snap = await tx.get(walletRef);
    const data = snap.data() as { balance?: number; reserved?: number } | undefined;
    const balance = typeof data?.balance === 'number' ? data.balance : 0;
    const reserved = typeof data?.reserved === 'number' ? data.reserved : 0;
    if (balance < cost.total) {
      return { ok: false as const, balance };
    }
    const newBalance = +(balance - cost.total).toFixed(2);
    const newReserved = +(reserved + cost.total).toFixed(2);
    tx.set(
      walletRef,
      {
        ngoId: ctx.ngoId,
        balance: newBalance,
        reserved: newReserved,
        updatedAt: Timestamp.now(),
      },
      { merge: true },
    );
    return { ok: true as const, balance: newBalance, reserved: newReserved };
  });

  if (!reserveResult.ok) {
    return NextResponse.json(
      {
        errorCode: 'INSUFFICIENT_FUNDS',
        message: `Bakiye yetersiz. Gereken: ${cost.total.toFixed(2)} TRY, mevcut: ${reserveResult.balance.toFixed(2)} TRY.`,
      },
      { status: 409 },
    );
  }

  // Job kaydı (özet) — sayfaların "Geçmiş Gönderim" sekmesi bunu çeker
  const jobRef = db.collection(COLLECTIONS.messageJobs).doc();
  await jobRef.set({
    ngoId: ctx.ngoId,
    channel: 'sms',
    useCase,
    driver: process.env.SMS_DRIVER ?? 'mock',
    status: 'sending',
    total: recipients.length,
    sent: 0,
    failed: 0,
    bodySnippet: messageBody.slice(0, 120),
    segments: cost.unitsPerRecipient,
    encoding: cost.encoding ?? null,
    estimatedTotalTry: cost.total,
    actualCostTry: 0,
    invalidSkipped: invalidCount.count,
    createdBy: ctx.uid,
    createdAt: FieldValue.serverTimestamp(),
  });

  // Gönderim — ardışık, her recipient için provider çağrısı
  const provider = getSmsProvider();
  const senderId = (process.env.PASIFIK_FROM || process.env.NETGSM_HEADER || 'HANGEL').slice(0, 11);

  let sent = 0;
  let failed = 0;
  const failures: Array<{ to: string; errorCode: string }> = [];

  for (const to of recipients) {
    try {
      const result = await provider.send({ to, body: messageBody, senderId, useCase });
      if (result.ok) {
        sent += 1;
      } else {
        failed += 1;
        failures.push({ to: maskPhone(to), errorCode: result.errorCode ?? 'unknown' });
      }
    } catch {
      failed += 1;
      failures.push({ to: maskPhone(to), errorCode: 'unknown' });
    }
  }

  // Bakiye finalize: başarılı oranında debit, başarısız oranında refund.
  const perRecipientCost = +(cost.total / recipients.length).toFixed(4);
  const actualCost = +(perRecipientCost * sent).toFixed(2);
  const refundAmount = +(cost.total - actualCost).toFixed(2);

  const finalBalance = await db.runTransaction(async (tx) => {
    const snap = await tx.get(walletRef);
    const data = snap.data() as { balance?: number; reserved?: number } | undefined;
    const balance = typeof data?.balance === 'number' ? data.balance : 0;
    const reserved = typeof data?.reserved === 'number' ? data.reserved : 0;
    const newReserved = Math.max(0, +(reserved - cost.total).toFixed(2));
    const newBalance = +(balance + refundAmount).toFixed(2);
    tx.update(walletRef, {
      balance: newBalance,
      reserved: newReserved,
      updatedAt: Timestamp.now(),
    });
    return newBalance;
  });

  // Audit
  await db.collection(COLLECTIONS.messagingTransactions).add({
    ngoId: ctx.ngoId,
    type: 'send-now',
    channel: 'sms',
    jobId: jobRef.id,
    count: recipients.length,
    sent,
    failed,
    actualCostTry: actualCost,
    refundedTry: refundAmount,
    driver: provider.driver,
    createdBy: ctx.uid,
    createdAt: FieldValue.serverTimestamp(),
  });

  // Job güncelle
  await jobRef.update({
    status: failed === recipients.length ? 'failed' : failed > 0 ? 'partial' : 'sent',
    sent,
    failed,
    actualCostTry: actualCost,
    failureSummary: failures.slice(0, 50),
    completedAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({
    jobId: jobRef.id,
    sent,
    failed,
    balanceAfter: finalBalance,
    invalidSkipped: invalidCount.count,
    actualCostTry: actualCost,
  });
}
