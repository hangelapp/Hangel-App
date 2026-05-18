/**
 * Provider webhook landing.
 *
 * Çağrı yolu: POST /api/messaging/webhook/{driver}
 *
 * Şimdilik basit shared-secret doğrulaması:
 *  - URL ?key=... query parametresi veya x-webhook-secret header'ı
 *  - process.env.MESSAGING_WEBHOOK_SECRET ile eşleşmeli
 *
 * Production: Resend için Svix HMAC, Netgsm için IP whitelist + sırrı header eklenmeli.
 */

import { NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getEmailProvider } from '@/lib/messaging/providers/email';
import type { DeliveryEventInput } from '@/lib/messaging/types';

export const runtime = 'nodejs';

function verifySecret(req: Request): boolean {
  const expected = process.env.MESSAGING_WEBHOOK_SECRET;
  if (!expected) return false;
  const url = new URL(req.url);
  const queryKey = url.searchParams.get('key');
  const headerKey = req.headers.get('x-webhook-secret');
  return queryKey === expected || headerKey === expected;
}

async function applyEvent(event: DeliveryEventInput, driver: string): Promise<void> {
  const db = getAdminFirestore();

  // 1) job + recipient lookup via providerMessageId
  const jobSnap = await db
    .collection('messageJobs')
    .where('providerMessageId', '==', event.providerMessageId)
    .limit(1)
    .get();

  let campaignId: string | null = null;
  let recipientPath: string | null = null;
  let channel: 'sms' | 'email' = 'email';

  if (!jobSnap.empty) {
    const job = jobSnap.docs[0].data() as {
      campaignId?: string;
      recipientPath?: string;
      channel?: 'sms' | 'email';
    };
    campaignId = job.campaignId ?? null;
    recipientPath = job.recipientPath ?? null;
    channel = job.channel ?? 'email';
  }

  // 2) deliveryEvents'e yaz (lookup fail olsa da raw'ı sakla)
  await db.collection('deliveryEvents').add({
    campaignId,
    recipientPath,
    channel,
    driver,
    type: event.type,
    providerMessageId: event.providerMessageId,
    errorCode: event.errorCode ?? null,
    errorMessage: event.errorMessage ?? null,
    raw: event.raw ?? null,
    receivedAt: FieldValue.serverTimestamp(),
    eventAt: Timestamp.fromDate(event.at),
  });

  if (!campaignId || !recipientPath) return;

  // 3) recipient.status + campaign.stats update
  const recipientRef = db.doc(recipientPath);
  const campRef = db.collection('campaigns').doc(campaignId);

  const updates: Record<string, unknown> = {};
  const statMap: Record<string, string> = {
    delivered: 'stats.delivered',
    failed: 'stats.failed',
    bounced: 'stats.bounced',
    opened: 'stats.opened',
    clicked: 'stats.clicked',
    unsubscribed: 'stats.unsubscribed',
    complained: 'stats.failed',
  };

  const statusMap: Record<string, string> = {
    delivered: 'delivered',
    failed: 'failed',
    bounced: 'bounced',
    unsubscribed: 'unsubscribed',
  };

  const statKey = statMap[event.type];
  if (statKey) updates[statKey] = FieldValue.increment(1);

  await Promise.all([
    Object.keys(updates).length > 0 ? campRef.update(updates) : Promise.resolve(),
    statusMap[event.type]
      ? recipientRef.update({
          status: statusMap[event.type],
          [`${event.type}At`]: FieldValue.serverTimestamp(),
        })
      : Promise.resolve(),
  ]);
}

export async function POST(req: Request, { params }: { params: Promise<{ driver: string }> }) {
  if (!verifySecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { driver } = await params;

  try {
    let events: DeliveryEventInput[] = [];

    if (driver === 'resend') {
      const provider = getEmailProvider();
      if (provider.parseWebhook) {
        events = await provider.parseWebhook(req);
      }
    } else if (driver === 'netgsm') {
      // Netgsm SMS delivery webhook'u — şimdilik raw event olarak kaydet
      const json = (await req.json()) as { jobid?: string; status?: string };
      if (json.jobid) {
        const mapped: DeliveryEventInput['type'] =
          json.status === '1' || json.status === 'DELIVERED' ? 'delivered'
          : json.status === '2' || json.status === 'UNDELIVERED' ? 'failed'
          : 'sent';
        events = [{ providerMessageId: json.jobid, type: mapped, at: new Date(), raw: json }];
      }
    } else {
      return NextResponse.json({ error: 'Bilinmeyen driver' }, { status: 400 });
    }

    for (const event of events) {
      try {
        await applyEvent(event, driver);
      } catch (err) {
        console.error('[webhook] applyEvent failed', err);
      }
    }

    return NextResponse.json({ ok: true, processed: events.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[webhook]', driver, message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
