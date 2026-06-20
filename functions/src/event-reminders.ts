/**
 * Etkinlik katılımcı hatırlatmaları — "going" RSVP'lere etkinlik öncesi push.
 *
 * Schedule: her 5 dakika. Her yaklaşan etkinlik için başlangıca kalan süreye göre
 * üç pencere (idempotent — her biri bir kez):
 *   • day    : ≤24 saat, >1 saat   → "yarın / yaklaşıyor"
 *   • hour   : ≤1 saat,  >10 dakika → "1 saat içinde"
 *   • tenMin : ≤10 dakika, >-5 dk   → "birazdan başlıyor"
 * Gönderim: events/{id}/rsvps (status=going) katılımcılarına `notifications` dokümanı
 * (onNotificationCreated tetikleyicisi push'a da döndürür). İdempotency: event
 * dokümanında `reminders.{key}` damgası.
 *
 * startDate "YYYY-MM-DD HH:mm" Europe/Istanbul (UTC+3, DST yok) — elle -3 ofset.
 * Region: europe-west1.
 */
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const REGION = 'europe-west1';
const TIMEZONE = 'Europe/Istanbul';
const HIDDEN_STATUSES = new Set(['Beklemede', 'Reddedildi', 'Pasif']);
const MAX_EVENTS_PER_RUN = 50;
const MAX_RSVPS_PER_EVENT = 500;
const HOUR = 3600_000;
const MIN = 60_000;

interface EventDoc {
  name?: string;
  slug?: string;
  startDate?: string;
  status?: string;
  completed?: boolean;
  reminders?: Record<string, unknown>;
}

type ReminderKey = 'day' | 'hour' | 'tenMin';

function parseIstanbul(v: unknown): Date | null {
  if (!v || typeof v !== 'string') return null;
  const m = v.trim().match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/);
  if (!m) { const d = new Date(v); return Number.isNaN(d.getTime()) ? null : d; }
  const [, y, mo, d, hh, mm] = m;
  return new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(hh || '0') - 3, Number(mm || '0')));
}

// Kalan süreye göre hangi hatırlatma penceresi (yoksa null).
function pickReminder(deltaMs: number): ReminderKey | null {
  if (deltaMs <= 24 * HOUR && deltaMs > HOUR) return 'day';
  if (deltaMs <= HOUR && deltaMs > 10 * MIN) return 'hour';
  if (deltaMs <= 10 * MIN && deltaMs > -5 * MIN) return 'tenMin';
  return null;
}

function reminderCopy(key: ReminderKey, eventName: string): { title: string; body: string } {
  switch (key) {
    case 'day': return { title: `📅 ${eventName} yaklaşıyor`, body: 'Etkinliğin 1 gün içinde — hazırlan! Katılamayacaksan kaydını güncelle.' };
    case 'hour': return { title: `⏰ ${eventName} 1 saat içinde`, body: 'Etkinlik birazdan başlıyor — yola çıkma vakti 🧡' };
    case 'tenMin': return { title: `🔔 ${eventName} başlıyor`, body: 'Etkinlik 10 dakika içinde başlıyor. Görüşmek üzere!' };
  }
}

export const eventAttendeeReminders = onSchedule(
  { schedule: 'every 5 minutes', timeZone: TIMEZONE, region: REGION },
  async () => {
    const db = getFirestore();
    const now = Date.now();

    const snap = await db.collection('events').orderBy('startDate', 'desc').limit(400).get().catch((e) => {
      logger.warn('[event-reminders] query failed, fallback', e);
      return null;
    });
    const docs = snap && !snap.empty ? snap.docs : (await db.collection('events').limit(500).get()).docs;

    let handled = 0;
    let totalNotified = 0;
    for (const ev of docs) {
      if (handled >= MAX_EVENTS_PER_RUN) break;
      const e = ev.data() as EventDoc;
      if (e.completed) continue;
      if (e.status && HIDDEN_STATUSES.has(e.status)) continue;
      const start = parseIstanbul(e.startDate);
      if (!start) continue;
      const delta = start.getTime() - now;
      const key = pickReminder(delta);
      if (!key) continue;
      if (e.reminders && e.reminders[key]) continue; // bu pencere zaten gönderildi

      handled++;
      const eventId = ev.id;
      const eventName = e.name || 'Etkinliğin';
      const link = `/events/${e.slug || eventId}`;
      const { title, body } = reminderCopy(key, eventName);

      // "going" RSVP'leri çek → her birine notifications dokümanı (batched).
      const rsvps = await ev.ref.collection('rsvps').where('status', '==', 'going').limit(MAX_RSVPS_PER_EVENT).get().catch(() => null);
      if (rsvps && !rsvps.empty) {
        let batch = db.batch();
        let n = 0;
        for (const r of rsvps.docs) {
          const ref = db.collection('notifications').doc();
          batch.set(ref, {
            userId: r.id,
            type: 'event-reminder',
            title,
            body,
            data: { eventId, link, reminder: key },
            read: false,
            createdAt: FieldValue.serverTimestamp(),
            createdBy: 'system-event-reminder',
          });
          n++;
          if (n % 450 === 0) { await batch.commit().catch(() => {}); batch = db.batch(); }
        }
        await batch.commit().catch((er) => logger.warn(`[event-reminders] batch failed event=${eventId}`, er));
        totalNotified += n;
      }

      await ev.ref.update({ [`reminders.${key}`]: FieldValue.serverTimestamp() }).catch(() => {});
    }

    logger.info(`[event-reminders] handled=${handled} notified=${totalNotified}`);
  },
);
