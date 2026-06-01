/**
 * Volunteer task daily reminder cron.
 *
 * Schedule: every day at 09:00 Europe/Istanbul.
 * Behaviour:
 *   - Find volunteerTasks where status == 'active' AND startDate is within the
 *     next 24 hours (between now and now + 24h).
 *   - For each task, fan-out a reminder notification doc to every registered
 *     volunteer (volunteerTasks/{id}/volunteers/{uid} OR top-level
 *     `volunteerIds` array on the task — both shapes supported because both
 *     are used elsewhere in the codebase).
 *   - The existing onNotificationCreated handler delivers the FCM push.
 *
 * Region: europe-west1.
 *
 * `startDate` may be stored as a Firestore Timestamp or as an ISO/locale string
 * (the Volunteering type uses string). We parse both.
 */
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';

const REGION = 'europe-west1';
const TIMEZONE = 'Europe/Istanbul';
const WINDOW_HOURS = 24;

interface FirestoreTimestampLike {
  toDate: () => Date;
}

interface VolunteerTaskDoc {
  title?: string;
  organizer?: string;
  startDate?: string | FirestoreTimestampLike | Timestamp;
  status?: string;
  volunteerIds?: string[];
  location?: { city?: string; district?: string; address?: string };
}

function parseStart(value: VolunteerTaskDoc['startDate']): Date | null {
  if (!value) return null;
  if (typeof value === 'string') {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    try {
      return value.toDate();
    } catch {
      return null;
    }
  }
  return null;
}

function formatHourLabel(date: Date): string {
  // Europe/Istanbul HH:mm — Cloud Run runs in UTC, but Intl handles TZ for us.
  return new Intl.DateTimeFormat('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TIMEZONE,
  }).format(date);
}

export const dailyVolunteerTaskReminder = onSchedule(
  {
    schedule: 'every day 09:00',
    timeZone: TIMEZONE,
    region: REGION,
  },
  async () => {
    const db = getFirestore();
    const now = Date.now();
    const windowEnd = now + WINDOW_HOURS * 60 * 60 * 1000;

    // We cannot do a `where('startDate', '<=', windowEnd)` query reliably
    // because startDate may be stored as either a string or a Timestamp. So
    // we fetch all active tasks then filter in memory. For a typical NGO
    // org this is a small set (<a few hundred active tasks at any time).
    const snap = await db
      .collection('volunteerTasks')
      .where('status', '==', 'active')
      .get();

    if (snap.empty) {
      logger.info('[volunteer-cron] no active tasks');
      return;
    }

    let tasksProcessed = 0;
    let notificationsWritten = 0;
    const writer = db.bulkWriter();

    for (const taskDoc of snap.docs) {
      const task = taskDoc.data() as VolunteerTaskDoc;
      const start = parseStart(task.startDate);
      if (!start) continue;
      const startMs = start.getTime();
      if (startMs < now || startMs > windowEnd) continue;

      // Collect volunteer UIDs: top-level array OR /volunteers subcollection.
      const uids = new Set<string>(Array.isArray(task.volunteerIds) ? task.volunteerIds : []);

      const subSnap = await taskDoc.ref.collection('volunteers').get().catch(() => null);
      if (subSnap) {
        for (const v of subSnap.docs) {
          // doc id is volunteer uid, or fallback to data.userId
          const data = v.data() as { userId?: string; status?: string };
          if (data.status && data.status !== 'going' && data.status !== 'confirmed') continue;
          uids.add(data.userId ?? v.id);
        }
      }

      if (uids.size === 0) continue;
      tasksProcessed++;

      const hourLabel = formatHourLabel(start);
      const title = task.title || 'Gönüllülük görevi';
      const locText = task.location?.address || task.location?.district || task.location?.city || '';
      const bodyParts: string[] = [
        `${title} yarın ${hourLabel}'de başlıyor`,
      ];
      if (locText) bodyParts.push(locText);

      for (const uid of uids) {
        if (!uid) continue;
        const notifRef = db.collection('notifications').doc();
        writer.set(notifRef, {
          userId: uid,
          title: 'Gönüllülük hatırlatıcısı',
          body: bodyParts.join(' · '),
          type: 'volunteer-task-reminder',
          data: {
            type: 'volunteer-task-reminder',
            taskId: taskDoc.id,
            link: `/volunteering/${taskDoc.id}`,
          },
          read: false,
          pushSent: false,
          createdAt: FieldValue.serverTimestamp(),
          createdBy: 'volunteer-cron',
        });
        notificationsWritten++;
      }
    }

    await writer.close();
    logger.info(
      `[volunteer-cron] reminders sent: ${notificationsWritten} for ${tasksProcessed} tasks`,
    );
  },
);
