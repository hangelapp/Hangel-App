/**
 * POST /api/ngo-admin/mail/campaign — STK Workspace toplu mail kampanyası.
 *
 * STK'nın kendi Google Workspace SMTP'sinden (mailAccounts/{ngoId}) gönderim yapan
 * kampanya oluşturur. Mevcut messaging campaigns akışının (resolveRecipients →
 * computeCampaignCost → walletReserve → campaign doc + recipients materialize →
 * logAudit → enqueueCampaign) AYNISI; farkı: channel 'email' zorlanır,
 * mailWorkspace:true + rateConfig perMinute:1 (STK başına 1/dk izolasyon) eklenir,
 * fromEmail/fromName mailAccounts'tan zorlanır.
 *
 * Yetki: requireNgoAdmin scope 'messaging'.
 * Gate: ngos/{ngoId}.featureFlags.bulkMailEnabled açık olmalı (kapalı → 403).
 * Bağlantı: mailAccounts/{ngoId} doc'u olmalı (yoksa → 409 NOT_CONNECTED).
 *
 * Hata: { errorCode, message }; raw error.message sızdırılmaz.
 */

import { NextResponse } from 'next/server';
import { requireNgoAdmin } from '@/lib/messaging/server-auth';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { resolveRecipients } from '@/lib/messaging/resolver';
import { enqueueCampaign } from '@/lib/messaging/queue/enqueue';
import { logAudit, actorFromRequest } from '@/lib/messaging/audit';
import { computeCampaignCost } from '@/lib/messaging/pricing';
import { reserve as walletReserve, InsufficientBalanceError } from '@/lib/messaging/wallet';
import { isMailConfigured } from '@/lib/mail/credential-crypto';
import { COLLECTIONS } from '@/firebase/collections';
import type {
  CampaignStats,
  CampaignStatus,
  RecipientSourceSpec,
} from '@/lib/messaging/types';

export const runtime = 'nodejs';
export const maxDuration = 300;

interface CreateBody {
  name: string;
  subject: string;
  body: string;
  spec: RecipientSourceSpec;
  scheduledAt?: string | null;
  doubleConfirmCount?: number;
}

interface MailAccountDoc {
  fromEmail?: string;
  fromName?: string;
  signature?: string;
}

/** İmzayı gövdenin altına ekle (HTML; satır sonları <br/>). */
function withSignature(body: string, signature?: string): string {
  const sig = typeof signature === 'string' ? signature.trim() : '';
  if (!sig) return body;
  return `${body}<br/><br/>—<br/>${sig.replace(/\n/g, '<br/>')}`;
}

interface NgoInfo { name?: string; contact?: { phone?: string; email?: string; website?: string } }
/** Kurum bilgilerinden otomatik mail imzası (özel imza yoksa). */
function defaultNgoSignature(ngo?: NgoInfo): string {
  const c = ngo?.contact ?? {};
  return [ngo?.name, c.phone && `Tel: ${c.phone}`, c.email && `E-posta: ${c.email}`, c.website]
    .filter(Boolean).join('\n');
}

const BATCH = 450;
const LARGE = 1000;

export async function POST(req: Request) {
  const auth = await requireNgoAdmin(req, { scope: 'messaging' });
  if (auth.error) return auth.error;
  const actor = auth.actor;
  const { context } = actorFromRequest(req, actor.uid, actor.email);

  // Şifreleme anahtarı yoksa kimlik çözülemez — özellik kullanılamaz.
  if (!isMailConfigured()) {
    return NextResponse.json(
      { errorCode: 'MAIL_NOT_CONFIGURED', message: 'Workspace mail özelliği şu anda kullanılamıyor.' },
      { status: 503 }
    );
  }

  let body: CreateBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ errorCode: 'INVALID_JSON', message: 'Geçersiz JSON' }, { status: 400 });
  }

  if (!body.name?.trim() || !body.subject?.trim() || !body.body?.trim() || !body.spec) {
    return NextResponse.json(
      { errorCode: 'INVALID_INPUT', message: 'name, subject, body ve spec gerekli' },
      { status: 400 }
    );
  }

  const db = getAdminFirestore();

  // Süper-admin gate: ngos/{ngoId}.featureFlags.bulkMailEnabled açık mı?
  const ngoSnap = await db.collection(COLLECTIONS.ngos).doc(actor.ngoId).get();
  const ngoData = ngoSnap.exists
    ? (ngoSnap.data() as { featureFlags?: { bulkMailEnabled?: boolean }; name?: string; contact?: { phone?: string; email?: string; website?: string } } | undefined)
    : undefined;
  if (ngoData?.featureFlags?.bulkMailEnabled !== true) {
    return NextResponse.json(
      { errorCode: 'MAIL_FEATURE_DISABLED', message: 'Bu özellik kurumunuz için henüz açılmadı.' },
      { status: 403 }
    );
  }

  // Bağlantı: mailAccounts/{ngoId} doc'u olmalı.
  const accountSnap = await db.collection(COLLECTIONS.mailAccounts).doc(actor.ngoId).get();
  if (!accountSnap.exists) {
    return NextResponse.json(
      { errorCode: 'NOT_CONNECTED', message: 'Workspace mail hesabı bağlı değil.' },
      { status: 409 }
    );
  }
  const account = (accountSnap.data() as MailAccountDoc | undefined) ?? {};
  const fromEmail = typeof account.fromEmail === 'string' ? account.fromEmail : '';
  const fromName = typeof account.fromName === 'string' ? account.fromName : '';
  if (!fromEmail) {
    return NextResponse.json(
      { errorCode: 'NOT_CONNECTED', message: 'Workspace mail hesabı bağlı değil.' },
      { status: 409 }
    );
  }

  // GÜVENLİK: scopedNgoId her zaman actor.ngoId
  body.spec.scopedNgoId = actor.ngoId;

  const resolved = await resolveRecipients(body.spec);
  if (resolved.recipients.length === 0) {
    return NextResponse.json(
      { errorCode: 'NO_RECIPIENTS', message: 'Hiçbir geçerli alıcı çözümlenemedi' },
      { status: 400 }
    );
  }

  if (resolved.recipients.length >= LARGE && body.doubleConfirmCount !== resolved.recipients.length) {
    return NextResponse.json(
      {
        errorCode: 'CONFIRM_REQUIRED',
        message: 'Büyük gönderim — doubleConfirmCount eşleşmeli',
        recipientsCount: resolved.recipients.length,
      },
      { status: 409 }
    );
  }

  // Cost — Workspace mail e-posta kanalı.
  const costDetail = await computeCampaignCost({
    channel: 'email',
    recipientCount: resolved.recipients.length,
    body: body.body,
  });
  const perRecipientWithVat = resolved.recipients.length > 0
    ? +(costDetail.total / resolved.recipients.length).toFixed(4)
    : 0;
  const cost = {
    ...costDetail,
    estimatedCost: costDetail.total,
    perRecipientWithVat,
  };

  // Wallet reserve (NGO admin için zorunlu)
  try {
    await walletReserve({
      ngoId: actor.ngoId,
      amount: costDetail.total,
      campaignId: 'pending',
      channel: 'email',
      freeUnitsUsed: costDetail.freeUnitsUsed,
      actorUid: actor.uid,
    });
  } catch (err) {
    if (err instanceof InsufficientBalanceError) {
      return NextResponse.json(
        { errorCode: 'INSUFFICIENT_BALANCE', message: 'Yetersiz bakiye', balance: err.balance, required: err.required, costDetail },
        { status: 402 }
      );
    }
    throw err;
  }

  const isScheduled = !!body.scheduledAt;
  const initialStatus: CampaignStatus = isScheduled ? 'scheduled' : 'draft';
  const initialStats: CampaignStats = { queued: 0, sent: 0, delivered: 0, failed: 0, bounced: 0 };

  const campRef = db.collection(COLLECTIONS.campaigns).doc();
  await campRef.set({
    name: body.name.trim(),
    channel: 'email',
    useCase: 'marketing',
    ngoId: actor.ngoId,
    templateId: null,
    subject: body.subject.trim(),
    body: withSignature(body.body, account.signature?.trim() || defaultNgoSignature(ngoData)),
    senderId: fromEmail,
    fromEmail,
    fromName: fromName || null,
    whatsapp: null,
    // Workspace toplu mail: STK kendi SMTP'sinden gönderir, STK başına 1/dk izolasyon.
    mailWorkspace: true,
    rateConfig: { perSecond: 1, perMinute: 1 },
    recipients: {
      sourceSummary: resolved.summary,
      totalUnique: resolved.summary.afterDedupe,
      afterConsentFilter: resolved.summary.afterConsent,
    },
    schedule: {
      mode: isScheduled ? 'scheduled' : 'now',
      scheduledAt: isScheduled ? Timestamp.fromDate(new Date(body.scheduledAt!)) : null,
      timezone: 'Europe/Istanbul',
    },
    status: initialStatus,
    cost,
    stats: initialStats,
    createdAt: FieldValue.serverTimestamp(),
    createdBy: actor.uid,
    createdByEmail: actor.email ?? null,
  });

  // Recipients materialize
  const recipientsRef = campRef.collection(COLLECTIONS.recipients);
  for (let i = 0; i < resolved.recipients.length; i += BATCH) {
    const slice = resolved.recipients.slice(i, i + BATCH);
    const wb = db.batch();
    for (const r of slice) {
      wb.set(recipientsRef.doc(), {
        userId: r.userId,
        channelAddress: r.channelAddress,
        vars: r.vars,
        status: 'pending',
        attempts: 0,
        createdAt: FieldValue.serverTimestamp(),
      });
    }
    await wb.commit();
  }

  await logAudit(
    { uid: actor.uid, email: actor.email },
    'campaign.created',
    {
      campaignId: campRef.id,
      channel: 'email',
      useCase: 'marketing',
      recipientCount: resolved.recipients.length,
      scheduledAt: isScheduled ? new Date(body.scheduledAt!) : null,
    },
    context
  );

  if (!isScheduled) {
    try {
      const result = await enqueueCampaign(campRef.id);
      return NextResponse.json({
        campaignId: campRef.id,
        status: result.status,
        queued: result.queued,
        summary: resolved.summary,
        cost,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await campRef.update({ status: 'failed' as CampaignStatus, lastError: message });
      return NextResponse.json({ errorCode: 'INTERNAL_ERROR', message: 'Internal server error' }, { status: 500 });
    }
  }

  return NextResponse.json({
    campaignId: campRef.id,
    status: 'scheduled',
    summary: resolved.summary,
    cost,
  });
}
