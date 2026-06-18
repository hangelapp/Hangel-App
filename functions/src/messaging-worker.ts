/**
 * Messaging worker tick — mail/SMS kuyruğunu işleyen zamanlanmış cron.
 *
 * Schedule: every 1 minute (Europe/Istanbul).
 * İş: App Hosting'deki worker endpoint'lerini tetikler:
 *     1) /worker/schedule → zamanlanmış kampanyaları 'sending'e al
 *     2) /worker/run      → kuyruktaki mesaj batch'ini gönder (throttle: 1/dk vb.)
 *
 * Neden cron + HTTP: workerTick + mail provider'ları Next app'te (src/lib/messaging);
 * functions paketi onları import edemez, bu yüzden endpoint'i x-messaging-key ile çağırır.
 * Anahtar Secret Manager'da (MESSAGING_WORKER_KEY); aynı secret App Hosting'de de tanımlı
 * olmalı ki endpoint doğrulasın.
 *
 * Region: europe-west1.
 */
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions';
import { defineSecret } from 'firebase-functions/params';

const REGION = 'europe-west1';
const TIMEZONE = 'Europe/Istanbul';
const APP_URL = 'https://hangel.org.tr';
const MESSAGING_WORKER_KEY = defineSecret('MESSAGING_WORKER_KEY');

export const messagingWorkerTick = onSchedule(
  {
    schedule: 'every 1 minutes',
    timeZone: TIMEZONE,
    region: REGION,
    secrets: [MESSAGING_WORKER_KEY],
  },
  async () => {
    const key = MESSAGING_WORKER_KEY.value();
    if (!key) {
      logger.warn('messagingWorkerTick: MESSAGING_WORKER_KEY tanımsız, atlanıyor');
      return;
    }
    // Önce zamanlanmışları aktive et, sonra kuyruğu işle.
    for (const path of ['/api/messaging/worker/schedule', '/api/messaging/worker/run']) {
      try {
        const res = await fetch(`${APP_URL}${path}`, {
          method: 'POST',
          headers: { 'x-messaging-key': key, 'content-type': 'application/json' },
          body: JSON.stringify({ batch: 50 }),
        });
        logger.info('messagingWorkerTick', { path, status: res.status });
      } catch (err) {
        logger.error('messagingWorkerTick: istek başarısız', { path, err: (err as Error).message });
      }
    }
  },
);
