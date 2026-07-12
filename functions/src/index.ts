/**
 * Hangel Cloud Functions.
 *
 * onNotificationCreated: notifications/{id} doc yazıldığında, o kullanıcının
 * kayıtlı FCM token'larına otomatik push gönderir. Böylece API route'larda
 * manuel sendPushToUser çağrısı gerekmez — herhangi bir yerden notifications
 * doc'u yazmak push'u tetikler.
 *
 * Deploy: cd functions && npm install && npm run build && firebase deploy --only functions
 */
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

initializeApp();

const db = getFirestore();

interface NotificationDoc {
    userId?: string;
    title?: string;
    body?: string;
    type?: string;
    data?: Record<string, string>;
    pushSent?: boolean;
}

export const onNotificationCreated = onDocumentCreated(
    {
        document: 'notifications/{notifId}',
        region: 'us-central1',
    },
    async (event) => {
        const snap = event.data;
        if (!snap) return;
        const notif = snap.data() as NotificationDoc;

        // Zaten push gönderilmişse (API route inline gönderdiyse) tekrar gönderme
        if (notif.pushSent) return;
        if (!notif.userId || !notif.title) return;

        // Kullanıcının FCM token'larını çek
        const tokensSnap = await db
            .collection('users')
            .doc(notif.userId)
            .collection('fcmTokens')
            .get();

        if (tokensSnap.empty) return;

        const tokens = tokensSnap.docs.map((d) => d.id).filter(Boolean);
        if (tokens.length === 0) return;

        const clickAction =
            (notif.data && (notif.data.link || notif.data.clickAction)) ||
            (notif.type === 'welcome' || notif.type === 'emergency-confirmation' ? '/messages' : '/notifications');

        // Multicast push
        const message = {
            tokens,
            notification: {
                title: notif.title,
                body: notif.body || '',
            },
            data: {
                ...(notif.data || {}),
                clickAction,
                notifId: event.params.notifId,
            },
            webpush: {
                fcmOptions: { link: clickAction },
                notification: {
                    icon: 'https://hangel.org/icon-192.png',
                    badge: 'https://hangel.org/badge-72.png',
                },
            },
        };

        try {
            const res = await getMessaging().sendEachForMulticast(message);

            // Geçersiz token'ları temizle
            const invalidTokens: string[] = [];
            res.responses.forEach((r, i) => {
                if (!r.success) {
                    const code = r.error?.code || '';
                    if (
                        code === 'messaging/invalid-registration-token' ||
                        code === 'messaging/registration-token-not-registered'
                    ) {
                        invalidTokens.push(tokens[i]);
                    }
                }
            });
            await Promise.all(
                invalidTokens.map((t) =>
                    db.collection('users').doc(notif.userId!).collection('fcmTokens').doc(t).delete().catch(() => {}),
                ),
            );

            // pushSent işaretle (idempotency)
            await snap.ref.update({
                pushSent: true,
                pushSentAt: FieldValue.serverTimestamp(),
                pushSuccessCount: res.successCount,
            }).catch(() => {});
        } catch (err) {
            console.error('[onNotificationCreated] push failed', err);
        }
    },
);

// Live Activity APNs push triggers (emergencyBloodCalls, volunteerTasks,
// events, donationCampaigns onUpdate). See ./live-activity.ts
export {
    onEmergencyBloodUpdate,
    onVolunteerTaskUpdate,
    onEventCountdownUpdate,
    onDonationCampaignUpdate,
} from './live-activity';

// Blood emergency match algorithm — emergencyBloodCalls/{id} onCreate
// fan-out: writes notification docs for the first 50 matching donors.
// See ./blood-match.ts
export { onEmergencyBloodCallCreated } from './blood-match';

// Daily 09:00 Europe/Istanbul reminder for volunteer tasks starting within
// the next 24 hours. See ./volunteer-cron.ts
export { dailyVolunteerTaskReminder } from './volunteer-cron';

// Weekly Monday 09:00 Europe/Istanbul user digest (donations + nearby events
// + active blood calls) via SendGrid. See ./email-digest.ts
export { weeklyEmailDigest } from './email-digest';

// Event SMS reminder ~1 hour before start via Twilio. Runs every 15 min.
// See ./sms-reminder.ts
export { eventOneHourSmsReminder } from './sms-reminder';

// Etkinlik başlangıç saatinde organizatöre "başlıyor, başlatmak ister misin?"
// bildirimi (push + uygulama-içi). Her 5 dk. See ./event-start-prompt.ts
export { eventStartOrganizerPrompt } from './event-start-prompt';

// Katılımcı hatırlatmaları — "going" RSVP'lere 1 gün / 1 saat / 10 dk kala push.
// Her 5 dk, idempotent (event.reminders.{day|hour|tenMin}). See ./event-reminders.ts
export { eventAttendeeReminders } from './event-reminders';

// Gönüllülük katılımcı hatırlatmaları — onaylı başvuranlara (applications,
// status=='Onaylandı') 1 gün / 1 saat / 10 dk kala push. Her 5 dk, idempotent
// (volunteering.reminders.{day|hour|tenMin}). See ./volunteer-reminders.ts
export { volunteerAttendeeReminders } from './volunteer-reminders';

// Kan bağışı takip — "geleceğim" diyen bağışçılara 1/2/3 saat sonra nazik
// "kan verdin mi?" hatırlatması; "verdim" deyip ilan sahibi 48 saat onaylamazsa
// güven esaslı otomatik onay (rozet+sertifika+puan). See ./blood-donor-reminders.ts
export { bloodDonorReminders } from './blood-donor-reminders';

// Daily 11:00 Europe/Istanbul nudge for users who registered ~24h / ~72h ago
// but never completed onboarding. Writes notifications doc (push via
// onNotificationCreated) and stamps the user doc for idempotency.
// See ./onboarding-nudge.ts
export { onboardingNudgeCron } from './onboarding-nudge';

// Disaster alert geofence trigger — disasterAlerts/{id} onCreate.
// Tarama: users.lastKnownLocation ↔ alert.coordinates 50km radius (Haversine).
// Eşleşenler için notifications doc yaz; onNotificationCreated push gönderir.
// See ./disaster-geofence.ts
export { onDisasterAlertCreated } from './disaster-geofence';

// Sanal santral callback runner — every 1 minute.
// santralScheduledCallbacks.status='pending' AND scheduledAt<=now → 'due'
// + contact.priority=true → çağrı sırasında üst sıraya çıkar.
// See ./santral-callback-runner.ts
export { santralCallbackRunner } from './santral-callback-runner';

// Messaging worker tick — every 1 minute. Mail/SMS kuyruğunu işler (App Hosting
// worker endpoint'lerini x-messaging-key ile tetikler). Bu olmadan kuyruktaki
// toplu mailler GÖNDERİLMEZ. See ./messaging-worker.ts
export { messagingWorkerTick } from './messaging-worker';

// Affiliate onay senkron robotu — her gün 06:00 Europe/Istanbul. 3 affiliate
// ağını tarar, onaylı (cpa_percentage + approved/açık) markaları listeler,
// reddedilen/bekleyen/lead-tipi offer'ları çıkarır, yeni markaları yakalar,
// elle eklenmiş Firestore brand kayıtlarını eşitler ve super-admin'lere rapor
// bildirimi düşer. See ./affiliate-approval-sync.ts
export { affiliateApprovalSync } from './affiliate-approval-sync';

// Satıcı sayısı stamp robotu — her gün 04:00 Europe/Istanbul. Tüm ürünleri
// (gtin→mpn anahtarıyla) gruplar ve çok satıcılı gruplardaki ürünlere
// sellerCount + sellerBestRate alanlarını batch ile yazar. Sunucuda çalışır,
// yerel Firestore kotasını yakmaz. See ./seller-count-cron.ts
export { stampSellerCountsDaily } from './seller-count-cron';

// Fiyat düşüş uyarısı robotu — her gün 09:00 Europe/Istanbul. Tüm favorileri
// (collectionGroup('favorites')) tarar, her favinin snapshot etkin fiyatını
// ürünün güncel etkin fiyatıyla karşılaştırır ve anlamlı düşüşte (>= max(5₺,%3))
// kullanıcıya notifications doc yazar (push'u onNotificationCreated gönderir) +
// fav snapshot'ını güncelleyerek tekrar-uyarıyı önler. See ./price-drop-alerts.ts
export { priceDropAlerts } from './price-drop-alerts';

// Referans / davet ödülü — güvenli (client veremez, admin SDK verir).
//  referralWelcomeReward: users/{uid} onCreate — invitedBy 'user:<uid>' ise
//    DAVET EDİLENE +25 impactScore (self-referral engeli, referralWelcomeAwarded
//    bayrağı ile tek sefer). Davet edene BURADA puan verilmez.
//  referralCompletionReward: volunteerCompletions/{id} onWrite — ngoApproved
//    false→true geçişinde, tamamlayanın invitedBy davet edeni varsa ve daha önce
//    ödüllendirilmediyse (referrerAwarded) DAVET EDENE +50 impactScore.
// See ./referral-reward.ts
export { referralWelcomeReward, referralCompletionReward } from './referral-reward';
