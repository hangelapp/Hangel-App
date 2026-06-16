/**
 * POST /api/ngo-admin/messaging/send
 *
 * STK admin'i toplu SMS veya mail gönderir. Kota (ngoMessagingWallets.smsUsed/
 * mailUsed) atomik olarak artırılır; kalan kotadan fazlası gönderilemez. Kota
 * düşürüldükten sonra gerçek sağlayıcı (Netgsm SMS / Resend|SMTP mail) çağrılır.
 * Sağlayıcı env yoksa adaptör mock'a düşer (gerçek mesaj gitmez) — güvenli. Gönderilemeyen
 * alıcılar kadar kota geri iade edilir. Gönderim audit'i messagingTransactions'a yazılır.
 *
 * Güvenlik: senkron gönderimde alıcı üst sınırı MAX_SYNC_RECIPIENTS. Daha fazlası için
 * kuyruk gerekir; bu durumda transaction'a recipientsTruncated alanı yazılır.
 *
 * Yetki: çağıran kullanıcı users/{uid}.managedNgoId == body.ngoId olmalı (veya super-admin).
 * Body: { ngoId, channel: 'sms'|'mail', recipients: string[], message: string, subject?: string }
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { normalizeQuota, quotaRemaining } from '@/lib/messaging-quota';
import { getSmsProvider } from '@/lib/messaging/providers/sms';
import { getEmailProvider } from '@/lib/messaging/providers/email';
import type { SendResult } from '@/lib/messaging/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Senkron tek istekte işlenebilecek azami alıcı sayısı. Fazlası kuyruk gerektirir. */
const MAX_SYNC_RECIPIENTS = 1000;

async function authorize(req: NextRequest, ngoId: string): Promise<boolean> {
  const authHeader = req.headers.get('authorization') || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!idToken) return false;
  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken) as { uid: string; role?: string; superAdminPermissions?: unknown };
    if (decoded.role === 'super-admin' || !!decoded.superAdminPermissions) return true;
    const snap = await getAdminFirestore().collection(COLLECTIONS.users).doc(decoded.uid).get();
    const d = snap.data() as { role?: string; managedNgoId?: string; managedBrandId?: string; managedClubId?: string } | undefined;
    if (d?.role === 'super-admin') return true;
    return d?.managedNgoId === ngoId || d?.managedBrandId === ngoId || d?.managedClubId === ngoId;
  } catch { return false; }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c));
}

function plainToHtml(s: string): string {
  return escapeHtml(s).replace(/\n/g, '<br>');
}

export async function POST(req: NextRequest) {
  let body: { ngoId?: string; channel?: string; recipients?: unknown; message?: string; subject?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ errorCode: 'BAD_JSON', message: 'Geçersiz JSON' }, { status: 400 }); }

  const ngoId = typeof body.ngoId === 'string' ? body.ngoId : '';
  const channel = body.channel === 'sms' ? 'sms' : body.channel === 'mail' ? 'mail' : '';
  const allRecipients = Array.isArray(body.recipients) ? body.recipients.filter((x): x is string => typeof x === 'string' && x.trim().length > 0).map((x) => x.trim()) : [];
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  const subject = typeof body.subject === 'string' ? body.subject.trim().slice(0, 200) : '';

  if (!ngoId || !channel || allRecipients.length === 0 || !message) {
    return NextResponse.json({ errorCode: 'BAD_INPUT', message: 'ngoId, channel, recipients ve message gerekli.' }, { status: 400 });
  }
  if (!(await authorize(req, ngoId))) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Bu kurum için yetkiniz yok.' }, { status: 403 });
  }

  // Güvenlik: senkron gönderimde üst sınır — fazlası işlenmez, kuyruk gerekir.
  const recipientsTruncated = allRecipients.length > MAX_SYNC_RECIPIENTS;
  const recipients = recipientsTruncated ? allRecipients.slice(0, MAX_SYNC_RECIPIENTS) : allRecipients;
  const count = recipients.length;

  const db = getAdminFirestore();
  const walletRef = db.collection(COLLECTIONS.ngoMessagingWallets).doc(ngoId);

  // Kotayı atomik düş — yetersizse reddet (yalnız işlenecek alıcı kadar).
  const result = await db.runTransaction(async (tx) => {
    const snap = await tx.get(walletRef);
    const q = normalizeQuota(snap.data() as never);
    const rem = quotaRemaining(q);
    const remaining = channel === 'sms' ? rem.sms : rem.mail;
    if (count > remaining) {
      return { error: `Yetersiz kota. Kalan ${channel === 'sms' ? 'SMS' : 'mail'}: ${remaining}, gerekli: ${count}.` };
    }
    tx.set(walletRef, {
      ngoId,
      [channel === 'sms' ? 'smsUsed' : 'mailUsed']: FieldValue.increment(count),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    return { ok: true, remainingAfter: remaining - count };
  });

  if ('error' in result) {
    return NextResponse.json({ errorCode: 'INSUFFICIENT_QUOTA', message: result.error }, { status: 409 });
  }

  // Gerçek gönderim — kanal bazlı sağlayıcı. Env yoksa adaptör mock'a düşer (gerçek mesaj gitmez).
  let sentCount = 0;
  let failedCount = 0;
  let driver = 'mock';
  const providerMessageIds: string[] = [];
  // Kısa per-recipient özet: maskelenmiş hedef + sonuç. Raw provider hatası saklanmaz.
  const recipientSummary: Array<{ to: string; ok: boolean; errorCode?: string }> = [];

  const maskTarget = (to: string): string => {
    if (to.includes('@')) {
      const at = to.indexOf('@');
      if (at < 2) return '*'.repeat(at) + to.slice(at);
      return to.slice(0, 2) + '*'.repeat(Math.max(0, at - 2)) + to.slice(at);
    }
    return to.length > 4 ? to.slice(0, -4).replace(/./g, '*') + to.slice(-4) : '*'.repeat(to.length);
  };

  const applyResult = (to: string, r: SendResult): void => {
    if (r.ok) {
      sentCount++;
      if (r.providerMessageId) providerMessageIds.push(r.providerMessageId);
      recipientSummary.push({ to: maskTarget(to), ok: true });
    } else {
      failedCount++;
      recipientSummary.push({ to: maskTarget(to), ok: false, errorCode: r.errorCode ?? 'unknown' });
    }
  };

  try {
    if (channel === 'sms') {
      const provider = getSmsProvider();
      driver = provider.driver;
      const senderId = (process.env.NETGSM_HEADER || 'HANGEL').slice(0, 11);
      for (const to of recipients) {
        try {
          const r = await provider.send({ to, body: message, senderId, useCase: 'marketing' });
          applyResult(to, r);
        } catch (err) {
          failedCount++;
          recipientSummary.push({ to: maskTarget(to), ok: false, errorCode: 'unknown' });
          console.error('[messaging/send] sms send threw', err instanceof Error ? err.message : 'unknown');
        }
      }
    } else {
      const provider = getEmailProvider();
      driver = provider.driver;
      const fromEmail = process.env.RESEND_FROM_EMAIL || process.env.DEFAULT_FROM_EMAIL || 'merhaba@hangel.org';
      const fromName = process.env.RESEND_FROM_NAME || process.env.DEFAULT_FROM_NAME || 'hangel';
      const subj = subject || 'hangel';
      const html = plainToHtml(message);
      for (const to of recipients) {
        try {
          const r = await provider.send({ to, subject: subj, html, text: message, fromEmail, fromName, replyTo: fromEmail, useCase: 'marketing' });
          applyResult(to, r);
        } catch (err) {
          failedCount++;
          recipientSummary.push({ to: maskTarget(to), ok: false, errorCode: 'unknown' });
          console.error('[messaging/send] email send threw', err instanceof Error ? err.message : 'unknown');
        }
      }
    }
  } catch (err) {
    // Sağlayıcı seçimi sırasında beklenmeyen hata (örn. mock prod guard). Kalan alıcılar gönderilemedi.
    console.error('[messaging/send] dispatch failed', err instanceof Error ? err.message : 'unknown');
  }

  // Gönderilemeyenler kadar kotayı iade et (yalnız gerçekten başarısız olanlar).
  const refundCount = count - sentCount;
  if (refundCount > 0) {
    try {
      await db.runTransaction(async (tx) => {
        const snap = await tx.get(walletRef);
        if (!snap.exists) return;
        tx.set(walletRef, {
          [channel === 'sms' ? 'smsUsed' : 'mailUsed']: FieldValue.increment(-refundCount),
          updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true });
      });
    } catch (err) {
      console.error('[messaging/send] quota refund failed', err instanceof Error ? err.message : 'unknown');
    }
  }

  const dispatchStatus = sentCount === 0 ? 'failed' : failedCount === 0 ? 'sent' : 'partial';

  // Audit kaydı.
  try {
    await db.collection(COLLECTIONS.messagingTransactions).add({
      ngoId, type: 'unit-send', channel, count,
      subject: channel === 'mail' ? (subject || null) : null,
      dispatchStatus,
      provider: driver,
      sentCount,
      failedCount,
      refundedCount: refundCount,
      providerMessageIds: providerMessageIds.slice(0, 200),
      recipientSummary: recipientSummary.slice(0, 200),
      recipientsTruncated,
      requestedRecipients: allRecipients.length,
      createdAt: FieldValue.serverTimestamp(),
    });
  } catch { /* audit best-effort */ }

  const remainingAfter = (result as { remainingAfter: number }).remainingAfter + refundCount;

  return NextResponse.json({
    ok: dispatchStatus !== 'failed',
    dispatchStatus,
    sentCount,
    failedCount,
    remaining: remainingAfter,
    provider: driver,
    recipientsTruncated,
  });
}
