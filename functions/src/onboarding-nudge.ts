/**
 * Onboarding nudge cron.
 *
 * Schedule: every day at 11:00 Europe/Istanbul.
 * Behaviour:
 *   - Scan `users` who registered ~24h ago and ~72h ago (each in a tolerance
 *     window) but have NOT completed onboarding.
 *   - "Not completed" signal: onboardingComplete !== true OR
 *     (supportedNgos/volunteerNgos empty AND volunteerInfo empty AND
 *     preferences.intents empty).
 *   - For each matching user, write a top-level `notifications` doc (badge /
 *     notification center) — the existing onNotificationCreated handler then
 *     delivers the FCM push. So no manual push call is needed here.
 *   - Idempotency: stamp onboardingNudge24SentAt / onboardingNudge72SentAt on
 *     the user doc; skip users already stamped for that stage.
 *
 * Region: europe-west1.
 *
 * `createdAt` may be stored as a Firestore Timestamp or as an ISO/locale
 * string; we parse both. Users without a usable createdAt are skipped.
 */
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';

const REGION = 'europe-west1';
const TIMEZONE = 'Europe/Istanbul';

// Stage definitions: target age (hours) since registration and tolerance.
// 11:00 daily run + ±13h tolerance covers the whole calendar day a user
// crosses the 24h / 72h mark, so no one is missed between two runs.
const HOUR = 60 * 60 * 1000;
const TOLERANCE_HOURS = 13;
const STAGES = [
  { id: 24 as const, ageHours: 24, field: 'onboardingNudge24SentAt' as const },
  { id: 72 as const, ageHours: 72, field: 'onboardingNudge72SentAt' as const },
];

// Upper bound of users handled per run (chunked into bulkWriter batches).
const MAX_USERS = 500;

interface FirestoreTimestampLike {
  toDate: () => Date;
}

interface UserDoc {
  createdAt?: string | FirestoreTimestampLike | Timestamp;
  onboardingComplete?: boolean;
  supportedNgos?: unknown[];
  volunteerNgos?: unknown[];
  volunteerInfo?: Record<string, unknown> | null;
  preferences?: { intents?: unknown[] } | null;
  onboardingNudge24SentAt?: unknown;
  onboardingNudge72SentAt?: unknown;
}

function parseCreatedAt(value: UserDoc['createdAt']): Date | null {
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

function isEmptyArray(value: unknown[] | undefined): boolean {
  return !Array.isArray(value) || value.length === 0;
}

function isEmptyObject(value: Record<string, unknown> | null | undefined): boolean {
  return !value || typeof value !== 'object' || Object.keys(value).length === 0;
}

/**
 * True when the user has not yet completed onboarding.
 */
function isOnboardingIncomplete(user: UserDoc): boolean {
  if (user.onboardingComplete === true) return false;
  const noNgos = isEmptyArray(user.supportedNgos) && isEmptyArray(user.volunteerNgos);
  const noVolunteerInfo = isEmptyObject(user.volunteerInfo);
  const noIntents = isEmptyArray(user.preferences?.intents);
  return noNgos && noVolunteerInfo && noIntents;
}

function nudgeCopy(stageId: 24 | 72): { title: string; body: string } {
  if (stageId === 24) {
    return {
      title: 'Profilini tamamla 🧡',
      body: "hangel'de sana uygun gönüllülük fırsatları seni bekliyor. Profilini tamamla, ilgi alanına göre önerelim.",
    };
  }
  return {
    title: 'Seni hâlâ bekliyoruz 🧡',
    body: "Profilini tamamlamana birkaç adım kaldı. İlgi alanlarını seç, sana en uygun STK ve gönüllülük fırsatlarını gösterelim.",
  };
}

export const onboardingNudgeCron = onSchedule(
  {
    schedule: 'every day 11:00',
    timeZone: TIMEZONE,
    region: REGION,
  },
  async () => {
    const db = getFirestore();
    const now = Date.now();

    // We cannot range-query on createdAt reliably (it may be a string or a
    // Timestamp), and we also need both age windows in one pass. So we fetch
    // recently-created users and filter in memory. Cap at MAX_USERS to bound
    // cost; ordering by createdAt desc keeps the freshest cohort.
    let snap;
    try {
      snap = await db
        .collection('users')
        .orderBy('createdAt', 'desc')
        .limit(MAX_USERS)
        .get();
    } catch (err) {
      // Some user docs may lack createdAt; orderBy excludes them, which is the
      // desired behaviour. A hard failure here means the field/index is off.
      logger.error('[onboardingNudge] users query failed', err);
      return;
    }

    if (snap.empty) {
      logger.info('[onboardingNudge] no candidate users');
      return;
    }

    let notificationsWritten = 0;
    let usersStamped = 0;
    const writer = db.bulkWriter();

    for (const userDoc of snap.docs) {
      try {
        const user = userDoc.data() as UserDoc;
        const createdAt = parseCreatedAt(user.createdAt);
        if (!createdAt) continue;

        const ageMs = now - createdAt.getTime();
        if (ageMs < 0) continue;

        // Pick the first stage whose window the user currently falls in and
        // that hasn't been sent yet.
        const stage = STAGES.find((s) => {
          const centre = s.ageHours * HOUR;
          const inWindow = Math.abs(ageMs - centre) <= TOLERANCE_HOURS * HOUR;
          if (!inWindow) return false;
          return !user[s.field];
        });
        if (!stage) continue;

        if (!isOnboardingIncomplete(user)) continue;

        const { title, body } = nudgeCopy(stage.id);
        const notifRef = db.collection('notifications').doc();
        writer.set(notifRef, {
          userId: userDoc.id,
          title,
          body,
          type: 'onboarding-nudge',
          data: {
            type: 'onboarding-nudge',
            stage: String(stage.id),
            link: '/onboarding',
          },
          read: false,
          pushSent: false,
          createdAt: FieldValue.serverTimestamp(),
          createdBy: 'onboarding-nudge',
        });
        notificationsWritten++;

        // Idempotency stamp on the user doc.
        writer.update(userDoc.ref, {
          [stage.field]: FieldValue.serverTimestamp(),
        });
        usersStamped++;
      } catch (err) {
        // Best-effort: one bad user must not abort the whole run.
        logger.warn(`[onboardingNudge] skipped user ${userDoc.id}`, err);
      }
    }

    await writer.close();
    logger.info(
      `[onboardingNudge] nudges sent: ${notificationsWritten} (stamped ${usersStamped} users)`,
    );
  },
);
