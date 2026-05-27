/**
 * NGO admin: kampanya oluştur (scoped, wallet pre-flight).
 * Süper admin API'sinin (`/api/messaging/campaigns`) yerine geçer; kullanıcı kendi NGO'sunun
 * audience'ına gönderim yapar, wallet'tan kontör düşülür.
 */

import { NextResponse } from 'next/server';
import { requireNgoAdmin } from '@/lib/messaging/server-auth';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { resolveRecipients } from '@/lib/messaging/resolver';
import { enqueueCampaign } from '@/lib/messaging/queue/enqueue';
import { segmentInfo } from '@/lib/messaging/sms-segments';
import { logAudit, actorFromRequest } from '@/lib/messaging/audit';
import { computeCampaignCost } from '@/lib/messaging/pricing';
import { reserve as walletReserve, InsufficientBalanceError } from '@/lib/messaging/wallet';
import { COLLECTIONS } from '@/firebase/collections';
import type {
  CampaignStats,
  CampaignStatus,
  RecipientSourceSpec,
  WhatsAppConversationCategory,
  WhatsAppTemplateComponent,
} from '@/lib/messaging/types';

export const runtime = 'nodejs';
export const maxDuration = 300;

interface CreateBody {
  name: string;
  channel: 'sms' | 'email' | 'whatsapp';
  useCase: 'transactional' | 'marketing' | 'emergency';
  templateId?: string;
  subject?: string;
  body: string;
  senderId: string;
  fromEmail?: string;
  fromName?: string;
  spec: RecipientSourceSpec;
  scheduledAt?: string | null;
  doubleConfirmCount?: number;
  whatsapp?: {
    templateName: string;
    templateLanguage: string;
    components?: WhatsAppTemplateComponent[];
    conversationCategory: WhatsAppConversationCategory;
    wabaPhoneNumberId: string;
  };
}

const BATCH = 450;

export async function POST(req: Request) {
  const auth = await requireNgoAdmin(req);
  if (auth.error) return auth.error;
  const actor = auth.actor;
  const { context } = actorFromRequest(req, actor.uid, actor.email);

  let body: CreateBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON' }, { status: 400 });
  }

  if (!body.name?.trim() || !body.body?.trim() || !body.senderId?.trim()) {
    return NextResponse.json({ error: 'name, body ve senderId gerekli' }, { status: 400 });
  }
  if (body.channel === 'email' && !body.subject?.trim()) {
    return NextResponse.json({ error: 'E-posta için subject gerekli' }, { status: 400 });
  }

  // GÜVENLİK: scopedNgoId her zaman actor.ngoId
  body.spec.scopedNgoId = actor.ngoId;

  const resolved = await resolveRecipients(body.spec);
  if (resolved.recipients.length === 0) {
    return NextResponse.json(
      { error: 'Hiçbir geçerli alıcı çözümlenemedi', summary: resolved.summary },
      { status: 400 }
    );
  }

  const LARGE = 1000;
  if (resolved.recipients.length >= LARGE && body.doubleConfirmCount !== resolved.recipients.length) {
    return NextResponse.json(
      {
        error: 'Büyük gönderim — doubleConfirmCount eşleşmeli',
        recipientsCount: resolved.recipients.length,
      },
      { status: 409 }
    );
  }

  // Cost
  const costDetail = await computeCampaignCost({
    channel: body.channel,
    recipientCount: resolved.recipients.length,
    body: body.body,
    whatsappCategory: body.whatsapp?.conversationCategory,
  });
  const perRecipientWithVat = resolved.recipients.length > 0
    ? +(costDetail.total / resolved.recipients.length).toFixed(4)
    : 0;
  const cost = {
    ...costDetail,
    smsSegments: body.channel === 'sms' ? segmentInfo(body.body).segments : undefined,
    estimatedCost: costDetail.total,
    perRecipientWithVat,
  };

  // Wallet reserve (NGO admin için zorunlu)
  try {
    await walletReserve({
      ngoId: actor.ngoId,
      amount: costDetail.total,
      campaignId: 'pending',
      channel: body.channel,
      freeUnitsUsed: costDetail.freeUnitsUsed,
      actorUid: actor.uid,
    });
  } catch (err) {
    if (err instanceof InsufficientBalanceError) {
      return NextResponse.json(
        { error: 'Yetersiz bakiye', balance: err.balance, required: err.required, costDetail },
        { status: 402 }
      );
    }
    throw err;
  }

  const db = getAdminFirestore();
  const isScheduled = !!body.scheduledAt;
  const initialStatus: CampaignStatus = isScheduled ? 'scheduled' : 'draft';
  const initialStats: CampaignStats = { queued: 0, sent: 0, delivered: 0, failed: 0, bounced: 0 };

  const campRef = db.collection(COLLECTIONS.campaigns).doc();
  await campRef.set({
    name: body.name.trim(),
    channel: body.channel,
    useCase: body.useCase,
    ngoId: actor.ngoId,
    templateId: body.templateId ?? null,
    subject: body.subject ?? null,
    body: body.body,
    senderId: body.senderId,
    fromEmail: body.fromEmail ?? null,
    fromName: body.fromName ?? null,
    whatsapp: body.whatsapp ?? null,
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
      channel: body.channel,
      useCase: body.useCase,
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
      return NextResponse.json({ errorCode: 'INTERNAL_ERROR', error: 'Internal server error' }, { status: 500 });
    }
  }

  return NextResponse.json({
    campaignId: campRef.id,
    status: 'scheduled',
    summary: resolved.summary,
    cost,
  });
}
