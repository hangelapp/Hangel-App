/**
 * Campaign'i kuyruğa al: recipients subcollection'ından job'ları materialize et.
 *
 * Akış:
 *  1. campaign doc'unu oku ve status'ü 'enqueuing'e çevir
 *  2. recipients subcollection'ından batched chunk'lar halinde job yarat
 *  3. campaign.stats.queued artır, status'ü 'sending'e çevir
 *
 * Recipients subcollection bu fonksiyon çağrılmadan ÖNCE doldurulmuş olmalı
 * (resolver Faz 4'te yazılacak; Faz 2/3'te manuel/test yoluyla yazılır).
 */

import { getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import type {
  CampaignStats,
  CampaignStatus,
  Channel,
  JobStatus,
  UseCase,
  WhatsAppConversationCategory,
  WhatsAppTemplateComponent,
} from '../types';

const BATCH_SIZE = 450;

export interface EnqueueResult {
  campaignId: string;
  queued: number;
  skipped: number;
  status: CampaignStatus;
}

interface RecipientDoc {
  userId: string | null;
  channelAddress: string;
  vars: Record<string, string>;
  consentSnapshot?: { marketing: boolean; queriedFromIys: boolean; iysQueriedAt?: Timestamp };
  status?: 'pending' | 'queued' | 'sent' | 'delivered' | 'failed' | 'bounced' | 'unsubscribed';
}

interface CampaignDoc {
  channel: Channel;
  useCase: UseCase;
  subject?: string | null;
  body: string;
  senderId: string;
  fromEmail?: string | null;
  fromName?: string | null;
  replyTo?: string | null;
  driver?: string;
  status: CampaignStatus;
  stats?: Partial<CampaignStats>;
  ngoId?: string | null;
  cost?: {
    total?: number;
    perRecipientWithVat?: number;
  };
  whatsapp?: {
    templateName: string;
    templateLanguage: string;
    components?: WhatsAppTemplateComponent[];
    conversationCategory: WhatsAppConversationCategory;
    wabaPhoneNumberId: string;
  };
}

export async function enqueueCampaign(campaignId: string): Promise<EnqueueResult> {
  const db = getAdminFirestore();
  const campRef = db.collection('campaigns').doc(campaignId);
  const campSnap = await campRef.get();
  if (!campSnap.exists) throw new Error(`Campaign not found: ${campaignId}`);

  const camp = campSnap.data() as CampaignDoc;
  if (camp.status !== 'draft' && camp.status !== 'scheduled' && camp.status !== 'enqueuing') {
    throw new Error(`Campaign ${campaignId} status '${camp.status}' kuyruğa alınamaz`);
  }

  await campRef.update({
    status: 'enqueuing' as CampaignStatus,
    startedAt: FieldValue.serverTimestamp(),
  });

  const recipientsRef = campRef.collection('recipients');
  const defaultDriverFor = (channel: Channel): string => {
    if (channel === 'sms') return process.env.SMS_DRIVER ?? 'mock';
    if (channel === 'email') return process.env.EMAIL_DRIVER ?? 'mock';
    return process.env.WHATSAPP_DRIVER ?? 'mock';
  };
  const driver = camp.driver ?? defaultDriverFor(camp.channel);

  let queued = 0;
  let skipped = 0;
  let pageToken: FirebaseFirestore.QueryDocumentSnapshot | undefined;
  const now = Timestamp.now();

  while (true) {
    // Firestore "undefined" yasak — ilk geçişte tüm doc'ları çek, sonra status'e göre filtrele
    let q = recipientsRef.orderBy('__name__').limit(BATCH_SIZE);
    if (pageToken) q = q.startAfter(pageToken);

    const snap = await q.get();
    if (snap.empty) break;

    const batch = db.batch();
    for (const doc of snap.docs) {
      const r = doc.data() as RecipientDoc;
      if (r.status && r.status !== 'pending') {
        skipped += 1;
        continue;
      }

      const jobRef = db.collection('messageJobs').doc();
      let payload: Record<string, unknown>;
      if (camp.channel === 'sms') {
        payload = { body: camp.body, senderId: camp.senderId, vars: r.vars };
      } else if (camp.channel === 'email') {
        payload = {
          subject: camp.subject ?? '',
          body: camp.body,
          senderId: camp.senderId,
          fromEmail: camp.fromEmail ?? null,
          fromName: camp.fromName ?? null,
          replyTo: camp.replyTo ?? null,
          vars: r.vars,
        };
      } else {
        // whatsapp
        if (!camp.whatsapp) throw new Error(`Campaign ${campaignId} channel=whatsapp ama whatsapp config yok`);
        payload = {
          body: camp.body,
          senderId: camp.senderId,
          vars: r.vars,
          templateName: camp.whatsapp.templateName,
          templateLanguage: camp.whatsapp.templateLanguage,
          components: camp.whatsapp.components ?? null,
          conversationCategory: camp.whatsapp.conversationCategory,
          wabaPhoneNumberId: camp.whatsapp.wabaPhoneNumberId,
        };
      }

      batch.set(jobRef, {
        campaignId,
        recipientPath: doc.ref.path,
        userId: r.userId ?? null,
        ngoId: camp.ngoId ?? null,
        channel: camp.channel,
        driver,
        to: r.channelAddress,
        payload,
        useCase: camp.useCase,
        status: 'pending' as JobStatus,
        attempts: 0,
        maxAttempts: 5,
        nextAttemptAt: now,
        walletCostPerRecipient: camp.cost?.perRecipientWithVat ?? 0,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      batch.update(doc.ref, { status: 'queued', queuedAt: FieldValue.serverTimestamp() });
      queued += 1;
    }
    await batch.commit();

    pageToken = snap.docs[snap.docs.length - 1];
    if (snap.docs.length < BATCH_SIZE) break;
  }

  await campRef.update({
    status: 'sending' as CampaignStatus,
    'stats.queued': FieldValue.increment(queued),
    'recipients.totalQueued': queued,
  });

  return { campaignId, queued, skipped, status: 'sending' };
}
