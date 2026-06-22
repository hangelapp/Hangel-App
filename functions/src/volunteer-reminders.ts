/**
 * Gönüllülük katılımcı hatırlatmaları — onaylı başvuranlara başlangıç öncesi push.
 *
 * Schedule: her 5 dakika. Her yaklaşan gönüllülük için başlangıca kalan süreye göre
 * üç pencere (idempotent — her biri bir kez):
 *   • day    : ≤24 saat, >1 saat   → "yarın / yaklaşıyor"
 *   • hour   : ≤1 saat,  >10 dakika → "1 saat içinde"
 *   • tenMin : ≤10 dakika, >-5 dk   → "birazdan başlıyor"
 *
 * Etkinliklerden FARK: gönüllülükte "going" RSVP yok. Onaylı başvuranlar
 * `applications` collection'ında (type=='Gönüllülük' veya entityId==volunteering.id,
 * status=='Onaylandı'). Bu başvuranların userId'lerine `notifications` dokümanı
 * (onNotificationCreated tetikleyicisi push'a da döndürür). İdempotency: volunteering
 * dokümanında `reminders.{key}` damgası.
 *
 * Başlangıç = v.dates.eventStart "YYYY-MM-DD HH:mm" Europe/Istanbul (UTC+3, DST yok)
 * — elle -3 ofset. Region: europe-west1.
 */
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const REGION = 'europe-west1';
const TIMEZONE = 'Europe/Istanbul';
const MAX_VOL_PER_RUN = 50;
const MAX_APPLICANTS_PER_VOL = 500;
const HOUR = 3600_000;
const MIN = 60_000;

interface VolunteeringDoc {
  title?: string;
  slug?: string;
  status?: string;
  completed?: boolean;
  dates?: { eventStart?: string; eventEnd?: string };
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

function reminderCopy(key: ReminderKey, title: string): { title: string; body: string } {
  switch (key) {
    case 'day': return { title: `📅 ${title} yaklaşıyor`, body: 'Gönüllülüğün 1 gün içinde — hazırlan! Katılamayacaksan ekibe haber ver.' };
    case 'hour': return { title: `⏰ ${title} 1 saat içinde`, body: 'Gönüllülük birazdan başlıyor — yola çıkma vakti 🧡' };
    case 'tenMin': return { title: `🔔 ${title} başlıyor`, body: 'Gönüllülük 10 dakika içinde başlıyor. Görüşmek üzere!' };
  }
}

export const volunteerAttendeeReminders = onSchedule(
  { schedule: 'every 5 minutes', timeZone: TIMEZONE, region: REGION },
  async () => {
    const db = getFirestore();
    const now = Date.now();

    const snap = await db.collection('volunteering').limit(500).get().catch((e) => {
      logger.warn('[volunteer-reminders] query failed', e);
      return null;
    });
    const docs = snap ? snap.docs : [];

    let handled = 0;
    let totalNotified = 0;
    for (const vd of docs) {
      if (handled >= MAX_VOL_PER_RUN) break;
      const v = vd.data() as VolunteeringDoc;
      if (v.completed) continue;
      const start = parseIstanbul(v.dates?.eventStart);
      if (!start) continue;
      const delta = start.getTime() - now;
      const key = pickReminder(delta);
      if (!key) continue;
      if (v.reminders && v.reminders[key]) continue; // bu pencere zaten gönderildi

      handled++;
      const volunteeringId = vd.id;
      const volTitle = v.title || 'Gönüllülüğün';
      const link = `/volunteering/${v.slug || volunteeringId}`;
      const { title, body } = reminderCopy(key, volTitle);

      // Onaylı başvuranları çek (type=='Gönüllülük' VEYA entityId==volunteering.id),
      // status=='Onaylandı'. Her başvuranın userId'sine notifications dokümanı (batched).
      const apps = await db.collection('applications')
        .where('entityId', '==', volunteeringId)
        .where('status', '==', 'Onaylandı')
        .limit(MAX_APPLICANTS_PER_VOL)
        .get()
        .catch(() => null);

      if (apps && !apps.empty) {
        const seen = new Set<string>();
        let batch = db.batch();
        let n = 0;
        for (const a of apps.docs) {
          const ad = a.data() as { userId?: string; type?: string };
          // entityId zaten gönüllülüğe işaret ediyor; type alanı varsa Gönüllülük olmalı.
          if (ad.type && ad.type !== 'Gönüllülük') continue;
          const userId = ad.userId;
          if (!userId || seen.has(userId)) continue;
          seen.add(userId);
          const ref = db.collection('notifications').doc();
          batch.set(ref, {
            userId,
            type: 'volunteer-reminder',
            title,
            body,
            data: { volunteeringId, link, reminder: key },
            read: false,
            createdAt: FieldValue.serverTimestamp(),
            createdBy: 'system-volunteer-reminder',
          });
          n++;
          if (n % 450 === 0) { await batch.commit().catch((er) => logger.error(`[volunteer-reminders] mid-batch commit failed vol=${volunteeringId} (up to 450 reminders dropped)`, er)); batch = db.batch(); }
        }
        await batch.commit().catch((er) => logger.warn(`[volunteer-reminders] batch failed vol=${volunteeringId}`, er));
        totalNotified += n;
      }

      await vd.ref.update({ [`reminders.${key}`]: FieldValue.serverTimestamp() }).catch(() => {});
    }

    logger.info(`[volunteer-reminders] handled=${handled} notified=${totalNotified}`);
  },
);
