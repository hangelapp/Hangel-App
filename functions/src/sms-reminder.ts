/**
 * SMS reminder for events — fires 1 hour before start.
 *
 * Schedule: every 15 minutes (Cloud Scheduler minimum granularity that
 * comfortably covers the 1h pre-event window even if a run is skipped).
 *
 * Logic:
 *   1. Find events whose startDate is between (now + 45min) and (now + 75min)
 *      AND that have not yet had the SMS reminder fired
 *      (smsReminderSentAt missing).
 *   2. For each event, list confirmed RSVPs (events/{id}/rsvps where
 *      status == 'going').
 *   3. For each RSVP, look up the user's phone (personalInfo.phone) and send
 *      an SMS via the Twilio helper.
 *   4. Mark the event with smsReminderSentAt to prevent double-send.
 *
 * Region: europe-west1.
 * Secrets: TWILIO_* (declared on the function).
 */
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_FROM_NUMBER,
  sendSms,
  maskPhone,
} from './twilio';

const REGION = 'europe-west1';
const TIMEZONE = 'Europe/Istanbul';

// Pre-event window we cover on each invocation. Cloud Scheduler runs every
// 15 min so a window of [now+45m, now+75m] yields one notification per RSVP.
const WINDOW_START_MS = 45 * 60 * 1000;
const WINDOW_END_MS = 75 * 60 * 1000;
const MAX_EVENTS_PER_RUN = 50;

interface EventDoc {
  name?: string;
  startDate?: string | { toDate: () => Date };
  location?: { address?: string; city?: string; district?: string };
  smsReminderSentAt?: unknown;
}

function parseDate(v: unknown): Date | null {
  if (!v) return null;
  if (typeof v === 'string') {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof v === 'object' && v && 'toDate' in (v as Record<string, unknown>)) {
    try {
      return (v as { toDate: () => Date }).toDate();
    } catch {
      return null;
    }
  }
  return null;
}

function formatHourLabel(date: Date): string {
  return new Intl.DateTimeFormat('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TIMEZONE,
  }).format(date);
}

interface UserPhone {
  phone?: string;
  personalInfo?: { phone?: string };
}

export const eventOneHourSmsReminder = onSchedule(
  {
    schedule: 'every 15 minutes',
    timeZone: TIMEZONE,
    region: REGION,
    secrets: [TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER],
  },
  async () => {
    const db = getFirestore();
    const now = Date.now();
    const windowStart = now + WINDOW_START_MS;
    const windowEnd = now + WINDOW_END_MS;

    // Events are stored with startDate as a string in the codebase; we cannot
    // server-side filter by date range without a Timestamp. Fetch a recent
    // batch and filter in memory.
    const eventsSnap = await db
      .collection('events')
      .orderBy('startDate', 'asc')
      .limit(200)
      .get()
      .catch((e) => {
        logger.warn('[sms-reminder] events query failed (orderBy startDate?), falling back to full scan', e);
        return null;
      });

    let docs: FirebaseFirestore.QueryDocumentSnapshot[] = [];
    if (eventsSnap && !eventsSnap.empty) {
      docs = eventsSnap.docs;
    } else {
      const fallback = await db.collection('events').limit(500).get();
      docs = fallback.docs;
    }

    let smsSent = 0;
    let smsFailed = 0;
    let eventsHandled = 0;

    for (const eventDoc of docs) {
      if (eventsHandled >= MAX_EVENTS_PER_RUN) break;
      const event = eventDoc.data() as EventDoc;
      if (event.smsReminderSentAt) continue;
      const start = parseDate(event.startDate);
      if (!start) continue;
      const startMs = start.getTime();
      if (startMs < windowStart || startMs > windowEnd) continue;

      eventsHandled++;
      const eventId = eventDoc.id;

      // Find confirmed RSVPs
      const rsvpsSnap = await eventDoc.ref
        .collection('rsvps')
        .where('status', '==', 'going')
        .get()
        .catch(() => null);
      if (!rsvpsSnap || rsvpsSnap.empty) {
        // Mark as processed even if zero RSVPs so we don't keep scanning.
        await eventDoc.ref.update({ smsReminderSentAt: FieldValue.serverTimestamp() }).catch(() => {});
        continue;
      }

      const hourLabel = formatHourLabel(start);
      const eventName = event.name || 'Etkinlik';
      const loc = event.location?.address || event.location?.district || event.location?.city || '';
      const smsBody = `Hangel: "${eventName}" 1 saat içinde ${hourLabel}'de başlıyor${loc ? ` (${loc})` : ''}. Görüşmek üzere!`;

      for (const rsvp of rsvpsSnap.docs) {
        const data = rsvp.data() as { userId?: string };
        const uid = data.userId ?? rsvp.id;
        if (!uid) continue;

        const userSnap = await db.collection('users').doc(uid).get().catch(() => null);
        if (!userSnap || !userSnap.exists) continue;
        const userData = userSnap.data() as UserPhone | undefined;
        const phone = userData?.personalInfo?.phone || userData?.phone;
        if (!phone) continue;

        const result = await sendSms(phone, smsBody);
        if (result.ok) {
          smsSent++;
        } else {
          smsFailed++;
          logger.warn(
            `[sms-reminder] failed event=${eventId} uid=${uid} phone=${maskPhone(phone)} code=${result.errorCode}`,
          );
        }
      }

      await eventDoc.ref.update({ smsReminderSentAt: FieldValue.serverTimestamp() }).catch((e) => {
        logger.warn(`[sms-reminder] could not mark event ${eventId}: ${e}`);
      });
    }

    logger.info(
      `[sms-reminder] events=${eventsHandled} sms_sent=${smsSent} sms_failed=${smsFailed}`,
    );
  },
);
