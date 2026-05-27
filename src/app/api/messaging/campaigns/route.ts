import { NextResponse } from 'next/server';
import { requireSuperAdmin, type SuperAdminContext } from '@/lib/messaging/server-auth';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { resolveRecipients } from '@/lib/messaging/resolver';
import { enqueueCampaign } from '@/lib/messaging/queue/enqueue';
import { segmentInfo } from '@/lib/messaging/sms-segments';
import { logAudit, actorFromRequest } from '@/lib/messaging/audit';
import { computeCampaignCost } from '@/lib/messaging/pricing';
import { reserve as walletReserve, InsufficientBalanceError } from '@/lib/messaging/wallet';
import { COLLECTIONS } from '@/firebase/collections';
import type { CampaignStats, CampaignStatus, RecipientSourceSpec, WhatsAppConversationCategory, WhatsAppTemplateComponent } from '@/lib/messaging/types';

export const runtime = 'nodejs';
export const maxDuration = 300;

interface CreateCampaignBody {
  name: string;
  channel: 'sms' | 'email' | 'whatsapp';
  useCase: 'transactional' | 'marketing' | 'emergency';
  templateId?: string;
  subject?: string;
  body: string;
  senderId: string;
  fromEmail?: string;
  fromName?: string;
  replyTo?: string;
  spec: RecipientSourceSpec;
  scheduledAt?: string | null;
  doubleConfirmCount?: number;
  ngoId?: string | null;
  whatsapp?: {
    templateName: string;
    templateLanguage: string;
    components?: WhatsAppTemplateComponent[];
    conversationCategory: WhatsAppConversationCategory;
    wabaPhoneNumberId: string;
  };
}

const BATCH_WRITE_SIZE = 450;

async function materializeRecipients(
  campaignId: string,
  recipients: Array<{ userId: string | null; channelAddress: string; vars: Record<string, string> }>
): Promise<number> {
  const db = getAdminFirestore();
  const recipientsRef = db.collection(COLLECTIONS.campaigns).doc(campaignId).collection(COLLECTIONS.recipients);
  let written = 0;
  for (let i = 0; i < recipients.length; i += BATCH_WRITE_SIZE) {
    const slice = recipients.slice(i, i + BATCH_WRITE_SIZE);
    const batch = db.batch();
    for (const r of slice) {
      const ref = recipientsRef.doc();
      batch.set(ref, {
        userId: r.userId,
        channelAddress: r.channelAddress,
        vars: r.vars,
        status: 'pending',
        attempts: 0,
        createdAt: FieldValue.serverTimestamp(),
      });
    }
    await batch.commit();
    written += slice.length;
  }
  return written;
}

export async function POST(req: Request) {
  const auth = await requireSuperAdmin(req);
  if (auth.error) return auth.error;
  const actor = (auth as { actor: SuperAdminContext }).actor;
  const { context } = actorFromRequest(req, actor.uid, actor.email);

  let payload: CreateCampaignBody;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON' }, { status: 400 });
  }

  if (!payload.name?.trim() || !payload.body?.trim() || !payload.senderId?.trim()) {
    return NextResponse.json({ error: 'name, body ve senderId gerekli' }, { status: 400 });
  }
  if (payload.channel === 'email' && !payload.subject?.trim()) {
    return NextResponse.json({ error: 'E-posta için subject gerekli' }, { status: 400 });
  }

  const db = getAdminFirestore();

  // 1) Recipients çöz
  const resolved = await resolveRecipients(payload.spec);
  if (resolved.recipients.length === 0) {
    return NextResponse.json({ error: 'Hiçbir geçerli alıcı çözümlenemedi', summary: resolved.summary }, { status: 400 });
  }

  // 2) Double-confirm: büyük gönderim için type-to-confirm kontrol
  const LARGE_THRESHOLD = 1000;
  if (
    resolved.recipients.length >= LARGE_THRESHOLD &&
    payload.doubleConfirmCount !== resolved.recipients.length
  ) {
    return NextResponse.json(
      {
        error: 'Büyük gönderim — doubleConfirmCount alanı recipients.afterConsent ile eşleşmeli',
        recipientsCount: resolved.recipients.length,
      },
      { status: 409 }
    );
  }

  // 3) Cost — yeni pricing modeli (tier + KDV + free quota)
  const costDetail = await computeCampaignCost({
    channel: payload.channel,
    recipientCount: resolved.recipients.length,
    body: payload.body,
    whatsappCategory: payload.whatsapp?.conversationCategory,
    ngoMonthlyVolume: 0,    // TODO: NGO bazlı volume — Faz 12 sonrası enrich
    ngoFreeQuotaUsed: 0,
  });
  const perRecipientWithVat = resolved.recipients.length > 0
    ? +(costDetail.total / resolved.recipients.length).toFixed(4)
    : 0;
  const cost = {
    ...costDetail,
    encoding: costDetail.encoding,
    smsSegments: payload.channel === 'sms' ? segmentInfo(payload.body).segments : undefined,
    estimatedCost: costDetail.total,
    perRecipientWithVat,
  };

  // 3.5) Wallet pre-flight: NGO scope'lu kampanyalarda atomik reserve
  if (payload.ngoId) {
    try {
      await walletReserve({
        ngoId: payload.ngoId,
        amount: costDetail.total,
        campaignId: 'pending', // updated below
        channel: payload.channel,
        freeUnitsUsed: costDetail.freeUnitsUsed,
        actorUid: actor.uid,
      });
    } catch (err) {
      if (err instanceof InsufficientBalanceError) {
        return NextResponse.json(
          {
            error: 'Yetersiz bakiye',
            balance: err.balance,
            required: err.required,
            costDetail,
          },
          { status: 402 }
        );
      }
      throw err;
    }
  }

  // 4) Campaign doc
  const isScheduled = !!payload.scheduledAt;
  const initialStatus: CampaignStatus = isScheduled ? 'scheduled' : 'draft';
  const initialStats: CampaignStats = { queued: 0, sent: 0, delivered: 0, failed: 0, bounced: 0 };

  const campRef = db.collection(COLLECTIONS.campaigns).doc();
  await campRef.set({
    name: payload.name.trim(),
    channel: payload.channel,
    useCase: payload.useCase,
    templateId: payload.templateId ?? null,
    subject: payload.subject ?? null,
    body: payload.body,
    senderId: payload.senderId,
    fromEmail: payload.fromEmail ?? null,
    fromName: payload.fromName ?? null,
    replyTo: payload.replyTo ?? null,
    ngoId: payload.ngoId ?? null,
    whatsapp: payload.whatsapp ?? null,
    recipients: {
      sourceSummary: resolved.summary,
      totalUnique: resolved.summary.afterDedupe,
      afterConsentFilter: resolved.summary.afterConsent,
    },
    schedule: {
      mode: isScheduled ? 'scheduled' : 'now',
      scheduledAt: isScheduled ? Timestamp.fromDate(new Date(payload.scheduledAt!)) : null,
      timezone: 'Europe/Istanbul',
    },
    status: initialStatus,
    cost,
    stats: initialStats,
    createdAt: FieldValue.serverTimestamp(),
    createdBy: actor.uid,
    createdByEmail: actor.email ?? null,
  });

  // 5) Recipients subcollection'a yaz
  await materializeRecipients(
    campRef.id,
    resolved.recipients.map((r) => ({ userId: r.userId, channelAddress: r.channelAddress, vars: r.vars }))
  );

  await logAudit(actor, 'campaign.created', {
    campaignId: campRef.id,
    channel: payload.channel,
    useCase: payload.useCase,
    recipientCount: resolved.recipients.length,
    scheduledAt: isScheduled ? new Date(payload.scheduledAt!) : null,
  }, context);

  // 6) Eğer şimdi gönder ise enqueue
  if (!isScheduled) {
    try {
      const result = await enqueueCampaign(campRef.id);
      await logAudit(actor, 'campaign.enqueued', {
        campaignId: campRef.id,
        recipientCount: result.queued,
      }, context);
      return NextResponse.json({
        campaignId: campRef.id,
        status: result.status,
        queued: result.queued,
        summary: resolved.summary,
        cost,
      });
    } catch (err) {
      // Why: lastError'a internal message log, ama istemciye generic.
      const message = err instanceof Error ? err.message : String(err);
      await campRef.update({ status: 'failed' as CampaignStatus, lastError: message });
      console.error('[api/messaging/campaigns]', message);
      return NextResponse.json({ errorCode: 'INTERNAL_ERROR', error: 'Campaign processing failed' }, { status: 500 });
    }
  }

  await logAudit(actor, 'campaign.scheduled', {
    campaignId: campRef.id,
    scheduledAt: new Date(payload.scheduledAt!),
    recipientCount: resolved.recipients.length,
  }, context);

  return NextResponse.json({
    campaignId: campRef.id,
    status: 'scheduled',
    summary: resolved.summary,
    cost,
  });
}
