/**
 * Live Activity APNs push — Apple ActivityKit için HTTP/2 APNs gönderici.
 *
 * Hangel iOS app native ActivityKit ile Live Activity başlatıp push token'ı
 * `/api/live-activity/register-token` üzerinden Firestore'a kaydeder. Burada:
 *
 * 1. Firestore trigger: emergencyBloodCalls, volunteerTasks, events,
 *    donationCampaigns doc'larında onUpdate
 * 2. liveActivityTokens collection'undan referenceId match'e göre push
 *    token'ları çek
 * 3. Her push token'a APNs HTTP/2 POST (apns-push-type: liveactivity)
 *
 * Apple FCM Live Activity'yi desteklemiyor — APNs'e direkt erişim şart.
 *
 * Env vars (Firebase Functions secret):
 *   APNS_KEY_ID            — APNs Auth Key 10-char Key ID (Apple Developer
 *                            Console → Keys → APNs Auth Key)
 *   APNS_TEAM_ID           — Apple Developer Team ID (NKZNY8NU8S)
 *   APNS_BUNDLE_ID         — com.hangel.ios.app
 *   APNS_PRIVATE_KEY       — .p8 file content (BEGIN/END dahil)
 *   APNS_ENVIRONMENT       — 'production' | 'development' (default production)
 *
 * Setup:
 *   firebase functions:secrets:set APNS_KEY_ID
 *   firebase functions:secrets:set APNS_TEAM_ID
 *   firebase functions:secrets:set APNS_BUNDLE_ID
 *   firebase functions:secrets:set APNS_PRIVATE_KEY
 *   firebase functions:secrets:set APNS_ENVIRONMENT
 */
import { onDocumentUpdated, onDocumentWritten } from 'firebase-functions/v2/firestore';
import { defineSecret } from 'firebase-functions/params';
import { logger } from 'firebase-functions';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
// @ts-ignore - @parse/node-apn types not perfect
import apn from '@parse/node-apn';

const APNS_KEY_ID = defineSecret('APNS_KEY_ID');
const APNS_TEAM_ID = defineSecret('APNS_TEAM_ID');
const APNS_BUNDLE_ID = defineSecret('APNS_BUNDLE_ID');
const APNS_PRIVATE_KEY = defineSecret('APNS_PRIVATE_KEY');
const APNS_ENVIRONMENT = defineSecret('APNS_ENVIRONMENT');

let apnProvider: apn.Provider | null = null;

function getApnProvider(): apn.Provider {
  if (apnProvider) return apnProvider;
  apnProvider = new apn.Provider({
    token: {
      key: APNS_PRIVATE_KEY.value(),
      keyId: APNS_KEY_ID.value(),
      teamId: APNS_TEAM_ID.value(),
    },
    production: APNS_ENVIRONMENT.value() !== 'development',
  });
  return apnProvider;
}

interface LiveActivityTokenDoc {
  uid: string;
  activityId: string;
  pushToken: string;
  type: 'emergency-blood' | 'volunteer-task' | 'event-countdown' | 'donation-campaign';
  referenceId: string;
  expiresAt?: { toMillis(): number };
}

/**
 * Generic helper — sends Live Activity update to all matching tokens.
 *
 * @param activityType    Live Activity type filter
 * @param referenceId     reference doc ID (emergencyBloodId, taskId, etc.)
 * @param event           'update' | 'end' — APNs event field
 * @param contentState    new state matching iOS plugin's ContentState struct
 * @param staleDate       timestamp after which to mark activity stale (sec)
 * @param dismissalDate   timestamp after which to dismiss activity (sec, end only)
 */
async function sendLiveActivityPush(
  activityType: LiveActivityTokenDoc['type'],
  referenceId: string,
  event: 'update' | 'end',
  contentState: Record<string, unknown>,
  staleDate?: number,
  dismissalDate?: number,
): Promise<void> {
  const db = getFirestore();
  const now = Date.now();
  const snap = await db
    .collection('liveActivityTokens')
    .where('type', '==', activityType)
    .where('referenceId', '==', referenceId)
    .get();

  if (snap.empty) {
    logger.info(`[live-activity] No tokens for ${activityType}/${referenceId}`);
    return;
  }

  const provider = getApnProvider();
  const bundleId = APNS_BUNDLE_ID.value();
  const expired: string[] = [];

  for (const doc of snap.docs) {
    const data = doc.data() as LiveActivityTokenDoc;
    // skip expired
    if (data.expiresAt && data.expiresAt.toMillis() < now) {
      expired.push(doc.id);
      continue;
    }

    const notification = new apn.Notification();
    notification.topic = `${bundleId}.push-type.liveactivity`;
    notification.pushType = 'liveactivity';
    notification.priority = 10;
    notification.expiry = Math.floor(now / 1000) + 60 * 60; // 1 saat içinde teslim
    notification.payload = {
      aps: {
        timestamp: Math.floor(now / 1000),
        event,
        'content-state': contentState,
        ...(staleDate ? { 'stale-date': staleDate } : {}),
        ...(event === 'end' && dismissalDate ? { 'dismissal-date': dismissalDate } : {}),
      },
    };

    try {
      const result = await provider.send(notification, data.pushToken);
      if (result.failed.length > 0) {
        const reason = result.failed[0]?.response?.reason;
        logger.warn(`[live-activity] APNs failed for ${doc.id}: ${reason}`);
        // BadDeviceToken / Unregistered → token öldü, sil
        if (reason === 'BadDeviceToken' || reason === 'Unregistered') {
          expired.push(doc.id);
        }
      } else {
        logger.info(`[live-activity] Sent ${event} to ${doc.id}`);
      }
    } catch (e) {
      logger.error(`[live-activity] APNs error for ${doc.id}:`, e);
    }
  }

  // Cleanup expired tokens
  if (expired.length > 0) {
    const batch = db.batch();
    for (const id of expired) batch.delete(db.collection('liveActivityTokens').doc(id));
    await batch.commit();
    logger.info(`[live-activity] Cleaned ${expired.length} expired tokens`);
  }
}

// ── Firestore Triggers ──────────────────────────────────────────────────────

/**
 * emergencyBloodCalls/{id} update edildiğinde Live Activity'leri günceller.
 * Match count, distance, status değişikliklerinde anında bildirim.
 */
export const onEmergencyBloodUpdate = onDocumentUpdated(
  {
    document: 'emergencyBloodCalls/{id}',
    secrets: [APNS_KEY_ID, APNS_TEAM_ID, APNS_BUNDLE_ID, APNS_PRIVATE_KEY, APNS_ENVIRONMENT],
  },
  async (event) => {
    const after = event.data?.after?.data();
    if (!after) return;
    const referenceId = event.params.id;
    const isResolved = after.status === 'resolved' || after.status === 'cancelled';

    await sendLiveActivityPush(
      'emergency-blood',
      referenceId,
      isResolved ? 'end' : 'update',
      {
        distance: after.distance ?? '—',
        matchedDonors: after.matchedDonors ?? 0,
        minutesLeft: after.minutesLeft ?? 60,
        status: after.status ?? 'Bekleniyor',
      },
      Math.floor(Date.now() / 1000) + 4 * 60 * 60,
      isResolved ? Math.floor(Date.now() / 1000) + 60 : undefined,
    );
  },
);

/**
 * volunteerTasks/{id} update.
 */
export const onVolunteerTaskUpdate = onDocumentUpdated(
  {
    document: 'volunteerTasks/{id}',
    secrets: [APNS_KEY_ID, APNS_TEAM_ID, APNS_BUNDLE_ID, APNS_PRIVATE_KEY, APNS_ENVIRONMENT],
  },
  async (event) => {
    const after = event.data?.after?.data();
    if (!after) return;
    const referenceId = event.params.id;
    const isCompleted = after.status === 'completed' || after.status === 'cancelled';

    await sendLiveActivityPush(
      'volunteer-task',
      referenceId,
      isCompleted ? 'end' : 'update',
      {
        minutesLeft: after.minutesLeft ?? 120,
        progressPercent: after.progressPercent ?? 0,
        checkInOpen: after.checkInOpen ?? false,
      },
      Math.floor(Date.now() / 1000) + 8 * 60 * 60,
      isCompleted ? Math.floor(Date.now() / 1000) + 60 : undefined,
    );
  },
);

/**
 * events/{id} update — countdown güncellemesi.
 */
export const onEventCountdownUpdate = onDocumentUpdated(
  {
    document: 'events/{id}',
    secrets: [APNS_KEY_ID, APNS_TEAM_ID, APNS_BUNDLE_ID, APNS_PRIVATE_KEY, APNS_ENVIRONMENT],
  },
  async (event) => {
    const after = event.data?.after?.data();
    if (!after) return;
    const referenceId = event.params.id;
    // "Etkinliği Kapat/Tamamla" → completed:true. Bittiğinde kilit ekranındaki
    // Canlı Etkinlik kendiliğinden kalksın (dismissal-date ile 'end' push).
    const isFinished = after.status === 'finished' || after.status === 'cancelled' || after.completed === true;

    await sendLiveActivityPush(
      'event-countdown',
      referenceId,
      isFinished ? 'end' : 'update',
      {
        minutesLeft: after.minutesLeft ?? 60,
        statusLabel: after.statusLabel ?? 'Yakında',
      },
      Math.floor(Date.now() / 1000) + 24 * 60 * 60,
      isFinished ? Math.floor(Date.now() / 1000) + 60 : undefined,
    );
  },
);

/**
 * donationCampaigns/{id} update — toplam toplanan miktarı, hedef yüzdesi.
 */
export const onDonationCampaignUpdate = onDocumentUpdated(
  {
    document: 'donationCampaigns/{id}',
    secrets: [APNS_KEY_ID, APNS_TEAM_ID, APNS_BUNDLE_ID, APNS_PRIVATE_KEY, APNS_ENVIRONMENT],
  },
  async (event) => {
    const after = event.data?.after?.data();
    if (!after) return;
    const referenceId = event.params.id;
    const isEnded = after.status === 'ended' || after.status === 'cancelled';

    await sendLiveActivityPush(
      'donation-campaign',
      referenceId,
      isEnded ? 'end' : 'update',
      {
        totalAmount: after.totalAmount ?? 0,
        targetAmount: after.targetAmount ?? 0,
        donorCount: after.donorCount ?? 0,
        status: after.status ?? 'active',
      },
      Math.floor(Date.now() / 1000) + 72 * 60 * 60,
      isEnded ? Math.floor(Date.now() / 1000) + 60 : undefined,
    );
  },
);
