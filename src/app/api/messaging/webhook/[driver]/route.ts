/**
 * Provider webhook landing.
 *
 * Çağrı yolu: POST /api/messaging/webhook/{driver}
 *
 * Auth (P1-2):
 *  - `resend`: Svix HMAC SHA256 (svix-id/svix-timestamp/svix-signature) — RESEND_WEBHOOK_SECRET ile.
 *  - `netgsm`: Netgsm webhook'unda HMAC yok; geçici olarak IP whitelist
 *    (NETGSM_WEBHOOK_ALLOWED_IPS). TODO(P1-2b): Netgsm gerçek imza sağladığında değiştir.
 *
 * Replay protection (P1-3):
 *  - timestamp 5 dakikalık pencere içinde olmalı (driver'da yoksa receive zamanı temel alınır).
 *  - eventId (svix-id veya jobid) `webhookReplayIds` koleksiyonunda atomik create-or-fail.
 *
 * Hata kodları:
 *  - 401 { errorCode: 'INVALID_SIGNATURE' } — imza/IP doğrulaması başarısız.
 *  - 401 { errorCode: 'STALE_TIMESTAMP' } — webhook 5 dk eski.
 *  - 409 { errorCode: 'REPLAY_DETECTED' } — eventId tekrar.
 */

import { NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getEmailProvider } from '@/lib/messaging/providers/email';
import type { DeliveryEventInput } from '@/lib/messaging/types';
import {
  verifySvixSignature,
  extractClientIp,
  isIpAllowed,
  isTimestampFresh,
  rememberWebhookEvent,
} from '@/lib/messaging/webhook-replay';
import { COLLECTIONS } from '@/firebase/collections';

export const runtime = 'nodejs';

async function applyEvent(event: DeliveryEventInput, driver: string): Promise<void> {
  const db = getAdminFirestore();

  // 1) job + recipient lookup via providerMessageId
  const jobSnap = await db
    .collection(COLLECTIONS.messageJobs)
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
  await db.collection(COLLECTIONS.deliveryEvents).add({
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
  const campRef = db.collection(COLLECTIONS.campaigns).doc(campaignId);

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

function invalidSignature(): NextResponse {
  return NextResponse.json({ errorCode: 'INVALID_SIGNATURE' }, { status: 401 });
}

function staleTimestamp(): NextResponse {
  return NextResponse.json({ errorCode: 'STALE_TIMESTAMP' }, { status: 401 });
}

function replayDetected(): NextResponse {
  return NextResponse.json({ errorCode: 'REPLAY_DETECTED' }, { status: 409 });
}

export async function POST(req: Request, { params }: { params: Promise<{ driver: string }> }) {
  const { driver } = await params;

  // Tüm driver'lar için raw body'yi bir kez oku — HMAC payload + JSON parse aynı string olmalı.
  const rawBody = await req.text();

  let eventId: string | null = null;

  if (driver === 'resend') {
    const secret = process.env.RESEND_WEBHOOK_SECRET;
    if (!secret) {
      console.error('[webhook] RESEND_WEBHOOK_SECRET env not configured');
      return invalidSignature();
    }
    const svixId = req.headers.get('svix-id');
    const svixTimestamp = req.headers.get('svix-timestamp');
    const svixSignatureHeader = req.headers.get('svix-signature');

    if (!verifySvixSignature({ rawBody, svixId, svixTimestamp, svixSignatureHeader, secret })) {
      return invalidSignature();
    }
    if (!isTimestampFresh(svixTimestamp)) return staleTimestamp();
    eventId = svixId;
  } else if (driver === 'netgsm') {
    // TODO(P1-2b): Netgsm gerçek HMAC sağlayınca burası RESEND benzeri imza kontrolüne çevrilecek.
    // Bugün için: IP whitelist + jobid bazlı replay reddi.
    const allowed = process.env.NETGSM_WEBHOOK_ALLOWED_IPS;
    if (!allowed) {
      console.error('[webhook] NETGSM_WEBHOOK_ALLOWED_IPS env not configured');
      return invalidSignature();
    }
    const ip = extractClientIp(req);
    if (!isIpAllowed(ip, allowed)) return invalidSignature();
    // Netgsm timestamp header'ı yok; receive-time freshness'i implicit (her istek "şimdi").
    // jobid'i body'den replay anahtarı olarak alacağız (aşağıda).
  } else {
    return NextResponse.json({ error: 'Bilinmeyen driver' }, { status: 400 });
  }

  try {
    let events: DeliveryEventInput[] = [];

    if (driver === 'resend') {
      const provider = getEmailProvider();
      if (provider.parseWebhook) {
        // parseWebhook req.json() çağırıyor — aynı rawBody ile yeni Request oluştur.
        const cloned = new Request(req.url, {
          method: 'POST',
          headers: req.headers,
          body: rawBody,
        });
        events = await provider.parseWebhook(cloned);
      }
    } else if (driver === 'netgsm') {
      const json = JSON.parse(rawBody || '{}') as { jobid?: string; status?: string };
      if (json.jobid) {
        eventId = String(json.jobid);
        const mapped: DeliveryEventInput['type'] =
          json.status === '1' || json.status === 'DELIVERED' ? 'delivered'
          : json.status === '2' || json.status === 'UNDELIVERED' ? 'failed'
          : 'sent';
        events = [{ providerMessageId: json.jobid, type: mapped, at: new Date(), raw: json }];
      }
    }

    // P1-3 — replay rejection (eventId varsa).
    if (eventId) {
      const replayResult = await rememberWebhookEvent(driver, eventId);
      if (replayResult === 'replay') return replayDetected();
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
