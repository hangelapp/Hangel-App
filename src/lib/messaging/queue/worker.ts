/**
 * Worker tick: pending job'ları lease et, provider'a gönder, sonucu yaz.
 *
 * Concurrency güvenliği:
 *  - Pending → leased atomik transaction ile yapılır (her job için bir tx)
 *  - Lease 60s; expired olanları reclaim sweep pending'e döndürür
 *
 * Faz 8'de schedule promoter ve reclaim sweep eklenecek.
 */

import { getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import type { CanonicalErrorCode, JobStatus, SendResult, WhatsAppConversationCategory, WhatsAppTemplateComponent } from '../types';
import { getSmsProvider } from '../providers/sms';
import { getEmailProvider } from '../providers/email';
import { getEmailProviderForNgo } from '../providers/email/ngo-provider';
import { getWhatsAppProvider } from '../providers/whatsapp';
import { takeToken, getEffectiveRate } from './rateLimiter';
import { isTerminal, MAX_ATTEMPTS, nextAttemptAt } from './retry';
import { render } from '../template';
import { appendEmailUnsubscribeFooter, appendGenericOptOutFooter, buildUnsubscribeUrl, ensureUnsubscribeToken } from '../unsubscribe';
import { htmlToPlainText } from '../html-to-text';
import { debit, refund } from '../wallet';

const DEFAULT_LEASE_MS = 60_000;
const DEFAULT_BATCH = 50;

interface JobDoc {
  campaignId: string;
  recipientPath: string;
  userId?: string | null;
  ngoId?: string | null;
  channel: 'sms' | 'email' | 'whatsapp';
  driver: string;
  to: string;
  payload: {
    subject?: string;
    body: string;
    senderId: string;
    fromEmail?: string | null;
    fromName?: string | null;
    replyTo?: string | null;
    vars?: Record<string, string>;
    // WhatsApp-specific
    templateName?: string;
    templateLanguage?: string;
    components?: WhatsAppTemplateComponent[];
    conversationCategory?: WhatsAppConversationCategory;
    wabaPhoneNumberId?: string;
  };
  useCase: 'transactional' | 'marketing' | 'emergency';
  status: JobStatus;
  attempts: number;
  maxAttempts: number;
  nextAttemptAt: Timestamp;
  leasedUntil?: Timestamp;
  walletCostPerRecipient?: number; // KDV dahil birim maliyet (TRY)
  // STK Workspace Toplu Mail: bu job STK'nın kendi Workspace SMTP'sinden gider
  mailWorkspace?: boolean;
  // Kampanya bazlı rate override (ör. Workspace mail için perMinute=1)
  rateConfig?: { perSecond: number; perMinute: number };
}

export interface WorkerTickResult {
  scanned: number;
  dispatched: number;
  successes: number;
  failures: number;
  retried: number;
  dead: number;
}

const DEFAULT_RATE = { perSecond: 5, perMinute: 60 };

function rateConfigForDriver(driver: string) {
  const perSec = Number(process.env[`RATE_${driver.toUpperCase()}_PER_SEC`] ?? DEFAULT_RATE.perSecond);
  const perMin = Number(process.env[`RATE_${driver.toUpperCase()}_PER_MIN`] ?? DEFAULT_RATE.perMinute);
  return { perSecond: perSec, perMinute: perMin };
}

export async function workerTick(opts: { batch?: number; workerId?: string; campaignId?: string } = {}): Promise<WorkerTickResult> {
  const db = getAdminFirestore();
  const batchSize = opts.batch ?? DEFAULT_BATCH;
  const workerId = opts.workerId ?? `w_${Math.random().toString(36).slice(2, 10)}`;
  const now = Timestamp.now();

  // Index-bağımsız: TEK eşitlik (status) sorgusu + nextAttemptAt'i client-side süz/sırala.
  // (status+nextAttemptAt composite index'i deploy edilmese de worker çalışır; eski hâli
  // eksik index yüzünden FAILED_PRECONDITION atıp TÜM kuyruğu 'pending'de bırakıyordu.)
  const nowMs = now.toMillis();
  const naMs = (d: FirebaseFirestore.QueryDocumentSnapshot): number => {
    const na = (d.data() as { nextAttemptAt?: Timestamp }).nextAttemptAt;
    return na instanceof Timestamp ? na.toMillis() : 0;
  };
  // campaignId verilirse tick o kampanyaya KISITLI çalışır (panelden kampanya-bazlı
  // drip). İki eşitlik filtresi index birleştirmeyle çalışır — composite index gerekmez.
  let pendingQuery: FirebaseFirestore.Query = db
    .collection(COLLECTIONS.messageJobs)
    .where('status', '==', 'pending');
  if (opts.campaignId) pendingQuery = pendingQuery.where('campaignId', '==', opts.campaignId);
  const pendingSnap = await pendingQuery
    .limit(Math.max(batchSize * 4, 200))
    .get();
  const candidateDocs = pendingSnap.docs
    .filter((d) => naMs(d) <= nowMs)
    .sort((a, b) => naMs(a) - naMs(b))
    .slice(0, batchSize);

  const result: WorkerTickResult = {
    scanned: candidateDocs.length,
    dispatched: 0,
    successes: 0,
    failures: 0,
    retried: 0,
    dead: 0,
  };

  for (const candidate of candidateDocs) {
    const leased = await db.runTransaction(async (tx) => {
      const fresh = await tx.get(candidate.ref);
      if (!fresh.exists) return null;
      const job = fresh.data() as JobDoc;
      if (job.status !== 'pending') return null;
      tx.update(candidate.ref, {
        status: 'leased' as JobStatus,
        workerId,
        leasedUntil: Timestamp.fromMillis(Date.now() + DEFAULT_LEASE_MS),
        updatedAt: FieldValue.serverTimestamp(),
      });
      return { ref: candidate.ref, job };
    });

    if (!leased) continue;

    result.dispatched += 1;
    const { ref: jobRef, job } = leased;

    const baseCfg = rateConfigForDriver(job.driver);
    const cfg = job.rateConfig
      ? await getEffectiveRate(job.rateConfig, job.ngoId)
      : await getEffectiveRate(baseCfg, job.ngoId);
    // Workspace mail job'larında bucket anahtarı ngo-scoped olur → bir STK'nın
    // 1/dk limiti başka STK'yı etkilemez (per-STK izolasyon).
    const bucketKey = job.mailWorkspace && job.ngoId ? `email_ws:${job.ngoId}` : job.driver;
    const tokenOk = await takeToken(bucketKey, cfg, 4000);
    if (!tokenOk) {
      // Rate limit doluysa pending'e geri al, biraz ileri ittir
      await jobRef.update({
        status: 'pending' as JobStatus,
        leasedUntil: FieldValue.delete(),
        workerId: FieldValue.delete(),
        nextAttemptAt: Timestamp.fromMillis(Date.now() + 30_000),
        updatedAt: FieldValue.serverTimestamp(),
      });
      result.retried += 1;
      continue;
    }

    let sendResult: SendResult;
    try {
      sendResult = await dispatch(job);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      sendResult = { ok: false, errorCode: 'unknown', errorMessage: message };
    }

    await persistResult(jobRef, job, sendResult, result);
  }

  return result;
}

async function dispatch(job: JobDoc): Promise<SendResult> {
  const vars = job.payload.vars ?? {};
  const isMarketing = job.useCase === 'marketing';

  if (job.channel === 'whatsapp') {
    if (!job.payload.templateName || !job.payload.templateLanguage || !job.payload.wabaPhoneNumberId) {
      return { ok: false, errorCode: 'provider_4xx', errorMessage: 'WA payload eksik (template/language/wabaPhoneNumberId)' };
    }
    return getWhatsAppProvider().send({
      to: job.to,
      templateName: job.payload.templateName,
      templateLanguage: job.payload.templateLanguage,
      components: job.payload.components,
      conversationCategory: job.payload.conversationCategory ?? (isMarketing ? 'marketing' : 'utility'),
      useCase: job.useCase,
      wabaPhoneNumberId: job.payload.wabaPhoneNumberId,
    });
  }

  if (job.channel === 'sms') {
    let body = render(job.payload.body, vars);
    if (isMarketing && !/IPTAL/i.test(body)) {
      body = `${body}\n\nÇıkmak için: IPTAL ${(process.env.SMS_OPTOUT_KEYWORD ?? '4444')} yaz`;
    }
    return getSmsProvider().send({
      to: job.to,
      body,
      senderId: job.payload.senderId,
      useCase: job.useCase,
    });
  }

  let html = render(job.payload.body, vars);
  let unsubscribeUrl: string | undefined;
  if (isMarketing) {
    const token = await ensureUnsubscribeToken(job.userId ?? null);
    if (token) {
      unsubscribeUrl = buildUnsubscribeUrl(token, 'email');
      html = appendEmailUnsubscribeFooter(html, unsubscribeUrl);
    } else {
      // userId yok (yüklenen liste / outreach datası): token üretilemez →
      // gönderene yanıt-bazlı "Listeden çıkmak istiyorum" footer'ı ekle.
      html = appendGenericOptOutFooter(html, job.payload.fromEmail ?? undefined);
    }
  }

  const subject = render(job.payload.subject ?? '', vars);
  // Düz metin (text/plain) versiyonu — multipart/alternative. HTML-only mailler
  // Gmail'de "Tanıtımlar/Güncellemeler"e düşer; düz metin eşlik edince "Birincil"e
  // düşme ve teslim/erişilebilirlik olasılığı artar.
  const text = htmlToPlainText(html);

  if (job.mailWorkspace === true) {
    // STK Workspace Toplu Mail: per-STK SMTP; fromEmail/fromName mailAccounts'tan zorlanır.
    const ngoProv = job.ngoId ? await getEmailProviderForNgo(job.ngoId) : null;
    if (!ngoProv) {
      return { ok: false, errorCode: 'provider_4xx', errorMessage: 'workspace_not_connected' };
    }
    return ngoProv.provider.send({
      to: job.to,
      subject,
      html,
      text,
      fromEmail: ngoProv.fromEmail,
      fromName: ngoProv.fromName,
      replyTo: job.payload.replyTo ?? undefined,
      unsubscribeUrl,
      useCase: job.useCase,
    });
  }

  return getEmailProvider().send({
    to: job.to,
    subject,
    html,
    text,
    fromEmail: job.payload.fromEmail ?? process.env.DEFAULT_FROM_EMAIL ?? 'noreply@hangel.org',
    fromName: job.payload.fromName ?? process.env.DEFAULT_FROM_NAME ?? 'hangel',
    replyTo: job.payload.replyTo ?? undefined,
    unsubscribeUrl,
    useCase: job.useCase,
  });
}

async function persistResult(
  jobRef: FirebaseFirestore.DocumentReference,
  job: JobDoc,
  res: SendResult,
  tally: WorkerTickResult
): Promise<void> {
  const db = getAdminFirestore();
  const campRef = db.collection(COLLECTIONS.campaigns).doc(job.campaignId);
  const recipientRef = db.doc(job.recipientPath);

  if (res.ok) {
    const batch = db.batch();
    batch.update(jobRef, {
      status: 'sent' as JobStatus,
      providerMessageId: res.providerMessageId ?? null,
      leasedUntil: FieldValue.delete(),
      sentAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    batch.update(recipientRef, {
      status: 'sent',
      providerMessageId: res.providerMessageId ?? null,
      sentAt: FieldValue.serverTimestamp(),
    });
    batch.update(campRef, {
      'stats.sent': FieldValue.increment(1),
    });
    batch.set(
      db.collection(COLLECTIONS.deliveryEvents).doc(),
      {
        campaignId: job.campaignId,
        recipientPath: job.recipientPath,
        channel: job.channel,
        driver: job.driver,
        type: 'sent',
        providerMessageId: res.providerMessageId ?? null,
        receivedAt: FieldValue.serverTimestamp(),
      },
      { merge: false }
    );
    await batch.commit();

    // Wallet debit: NGO kampanyalarında her başarılı send'de reserved'tan birim düşülür
    if (job.ngoId && job.walletCostPerRecipient && job.walletCostPerRecipient > 0) {
      try {
        await debit({
          ngoId: job.ngoId,
          amount: job.walletCostPerRecipient,
          campaignId: job.campaignId,
          jobId: jobRef.id,
          channel: job.channel,
        });
      } catch (err) {
        console.error('[worker] wallet debit failed', err);
      }
    }

    tally.successes += 1;
    return;
  }

  const attempts = job.attempts + 1;
  const errorCode: CanonicalErrorCode = res.errorCode ?? 'unknown';
  const retryAt = isTerminal(errorCode) || attempts >= MAX_ATTEMPTS ? null : nextAttemptAt(attempts, errorCode);

  const batch = db.batch();
  if (retryAt) {
    batch.update(jobRef, {
      status: 'pending' as JobStatus,
      attempts,
      lastError: res.errorMessage ?? null,
      lastErrorCode: errorCode,
      leasedUntil: FieldValue.delete(),
      workerId: FieldValue.delete(),
      nextAttemptAt: Timestamp.fromDate(retryAt),
      updatedAt: FieldValue.serverTimestamp(),
    });
    tally.retried += 1;
  } else {
    batch.update(jobRef, {
      status: 'dead' as JobStatus,
      attempts,
      lastError: res.errorMessage ?? null,
      lastErrorCode: errorCode,
      leasedUntil: FieldValue.delete(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    batch.update(recipientRef, {
      status: 'failed',
      lastError: res.errorMessage ?? null,
      lastErrorCode: errorCode,
    });
    batch.update(campRef, {
      'stats.failed': FieldValue.increment(1),
    });
    batch.set(
      db.collection(COLLECTIONS.deliveryEvents).doc(),
      {
        campaignId: job.campaignId,
        recipientPath: job.recipientPath,
        channel: job.channel,
        driver: job.driver,
        type: 'failed',
        errorCode,
        errorMessage: res.errorMessage ?? null,
        receivedAt: FieldValue.serverTimestamp(),
      },
      { merge: false }
    );
    tally.dead += 1;
    tally.failures += 1;
  }
  await batch.commit();

  // Wallet refund: terminal fail durumunda NGO'nun reserved'tan ayrılan birim iade edilir
  if (!res.ok && job.ngoId && job.walletCostPerRecipient && job.walletCostPerRecipient > 0) {
    const finalAttempts = job.attempts + 1;
    const isTerminalNow = isTerminal(errorCode) || finalAttempts >= MAX_ATTEMPTS;
    if (isTerminalNow) {
      try {
        await refund({
          ngoId: job.ngoId,
          amount: job.walletCostPerRecipient,
          campaignId: job.campaignId,
          jobId: jobRef.id,
          channel: job.channel,
          reason: errorCode,
        });
      } catch (err) {
        console.error('[worker] wallet refund failed', err);
      }
    }
  }
}
