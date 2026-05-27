/**
 * Meta WhatsApp Cloud API webhook.
 *
 * GET: verification (hub.challenge döndürür)
 * POST: event'ler (statuses, messages, phone_number_quality_update)
 *
 * Auth:
 *  - GET: hub.verify_token == process.env.META_WA_VERIFY_TOKEN
 *  - POST: X-Hub-Signature-256 HMAC SHA256 verify (META_APP_SECRET ile)
 */

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getWhatsAppProvider } from '@/lib/messaging/providers/whatsapp';
import type { DeliveryEventInput } from '@/lib/messaging/types';
import { COLLECTIONS } from '@/firebase/collections';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  const expected = process.env.META_WA_VERIFY_TOKEN;
  if (mode === 'subscribe' && token && token === expected && challenge) {
    return new NextResponse(challenge, { status: 200, headers: { 'content-type': 'text/plain' } });
  }
  return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}

function verifySignature(rawBody: string, signatureHeader: string | null): boolean {
  const secret = process.env.META_APP_SECRET;
  if (!secret) return false;
  if (!signatureHeader) return false;
  const expected = `sha256=${crypto.createHmac('sha256', secret).update(rawBody).digest('hex')}`;
  try {
    return crypto.timingSafeEqual(Buffer.from(signatureHeader), Buffer.from(expected));
  } catch {
    return false;
  }
}

async function applyEvent(event: DeliveryEventInput): Promise<void> {
  const db = getAdminFirestore();

  const jobSnap = await db
    .collection(COLLECTIONS.messageJobs)
    .where('providerMessageId', '==', event.providerMessageId)
    .limit(1)
    .get();

  let campaignId: string | null = null;
  let recipientPath: string | null = null;

  if (!jobSnap.empty) {
    const job = jobSnap.docs[0].data() as { campaignId?: string; recipientPath?: string };
    campaignId = job.campaignId ?? null;
    recipientPath = job.recipientPath ?? null;
  }

  await db.collection(COLLECTIONS.deliveryEvents).add({
    campaignId,
    recipientPath,
    channel: 'whatsapp',
    driver: 'meta-cloud',
    type: event.type,
    providerMessageId: event.providerMessageId,
    errorCode: event.errorCode ?? null,
    errorMessage: event.errorMessage ?? null,
    raw: event.raw ?? null,
    receivedAt: FieldValue.serverTimestamp(),
    eventAt: Timestamp.fromDate(event.at),
  });

  if (!campaignId || !recipientPath) return;

  const statusMap: Record<string, string> = {
    delivered: 'delivered',
    failed: 'failed',
    opened: 'opened',
  };
  const statMap: Record<string, string> = {
    delivered: 'stats.delivered',
    failed: 'stats.failed',
    opened: 'stats.opened',
  };

  const updates: Record<string, unknown> = {};
  if (statMap[event.type]) updates[statMap[event.type]] = FieldValue.increment(1);

  await Promise.all([
    Object.keys(updates).length > 0
      ? db.collection(COLLECTIONS.campaigns).doc(campaignId).update(updates)
      : Promise.resolve(),
    statusMap[event.type]
      ? db.doc(recipientPath).update({
          status: statusMap[event.type],
          [`${event.type}At`]: FieldValue.serverTimestamp(),
        })
      : Promise.resolve(),
  ]);
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signatureHeader = req.headers.get('x-hub-signature-256');
  if (!verifySignature(rawBody, signatureHeader)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  try {
    const provider = getWhatsAppProvider();
    let events: DeliveryEventInput[] = [];
    if (provider.parseWebhook) {
      // parseWebhook req'in body'sini bekler — yeni Request inşa edelim aynı body ile
      const cloned = new Request(req.url, {
        method: 'POST',
        headers: req.headers,
        body: rawBody,
      });
      events = await provider.parseWebhook(cloned);
    }

    for (const event of events) {
      try {
        await applyEvent(event);
      } catch (err) {
        console.error('[wa webhook] applyEvent failed', err);
      }
    }

    return NextResponse.json({ ok: true, processed: events.length });
  } catch (err) {
    // Why: WhatsApp webhook public-facing — internal stack trace ifşa edilmemeli.
    const message = err instanceof Error ? err.message : String(err);
    console.error('[wa webhook]', message);
    return NextResponse.json({ errorCode: 'INTERNAL_ERROR', error: 'Webhook processing failed' }, { status: 500 });
  }
}
