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
                    icon: 'https://hangel.org.tr/icon-192.png',
                    badge: 'https://hangel.org.tr/badge-72.png',
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
