/**
 * Server-side push notification sender — Firebase Cloud Messaging Admin SDK.
 *
 * sendPushToUser(uid, payload):
 *   1. users/{uid}/fcmTokens/* alt koleksiyonundan tüm aktif tokenları çek
 *   2. Multicast ile gönder (1 API call, 500 token'a kadar)
 *   3. Geçersiz tokenları (UNREGISTERED, INVALID_ARGUMENT) Firestore'dan sil
 *   4. Sonuç: { success: number, failure: number, removedTokens: string[] }
 *
 * sendPushToUsers(uids[], payload):
 *   Birden fazla kullanıcıya tek seferde gönderim.
 *
 * Web push çalışması için frontend tarafında:
 *   - NEXT_PUBLIC_FIREBASE_VAPID_KEY env'i set olmalı
 *   - /firebase-messaging-sw.js service worker register edilmeli
 *   - registerForPushToken(uid) çağrılmış olmalı (src/lib/fcm.ts)
 *
 * Mobile Capacitor push için:
 *   - @capacitor/push-notifications plugin install + sync gerekli (yeni APK)
 *   - Plugin native FCM token alır, aynı users/{uid}/fcmTokens'a yazar
 */
import { getAdminFirestore, getAdminMessaging } from './firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import type { MulticastMessage } from 'firebase-admin/messaging';

export interface PushPayload {
    title: string;
    body: string;
    icon?: string;
    imageUrl?: string;
    clickAction?: string; // URL açılacak (deep link veya web URL)
    data?: Record<string, string>; // Custom data
}

/**
 * APNs custom sound dosyası seçer (bildirim tipine göre).
 *
 * iOS uygulamasında bundle'a paketlenmiş .caf dosyaları (ios/App/App/):
 *   - hangel-blood.caf      → kan emergency (Glass tonu, urgent)
 *   - hangel-disaster.caf   → afet uyarısı (Sosumi, alarm)
 *   - hangel-volunteer.caf  → gönüllülük daveti (Tink, sakin)
 *   - hangel-event.caf      → etkinlik hatırlatıcı (Pop, nötr)
 *   - hangel-alert.caf      → generic fallback (Glass, eski bildirimler için)
 *
 * Tip belirleme önceliği:
 *   1. payload.data.type değeri
 *   2. payload.data.notifType değeri
 *   3. Tanınmadıysa generic fallback
 *
 * Not: iPhone "muted" konumdaysa ses çalmaz (Apple kuralı, override yok).
 * Notification yine görünür, banner/badge çalışır.
 *
 * Eski client'lar (CAF dosyası eski APK'da bulunmayan): iOS custom sound
 * yoksa system default tonuna düşer (silent fail değil, system Tri-tone).
 */
export function getSoundForNotificationType(type: string | undefined | null): string {
    if (!type) return 'hangel-alert.caf';
    const lower = type.toLowerCase();

    // Blood / kan emergency
    if (
        lower === 'blood_emergency' ||
        lower === 'emergency-blood' ||
        lower === 'blood-emergency' ||
        lower === 'emergency_blood'
    ) {
        return 'hangel-blood.caf';
    }
    // Disaster / afet
    if (
        lower === 'disaster_alert' ||
        lower === 'disaster-alert' ||
        lower === 'disaster' ||
        lower === 'emergency_disaster'
    ) {
        return 'hangel-disaster.caf';
    }
    // Volunteer / gönüllülük
    if (
        lower === 'volunteer_task' ||
        lower === 'volunteer-task' ||
        lower === 'opportunity' ||
        lower === 'application_accepted' ||
        lower === 'application_rejected'
    ) {
        return 'hangel-volunteer.caf';
    }
    // Event / etkinlik
    if (
        lower === 'event_reminder' ||
        lower === 'event-reminder' ||
        lower === 'event_created' ||
        lower === 'event' ||
        lower === 'badge_earned'
    ) {
        return 'hangel-event.caf';
    }
    // Welcome / message / diğer — generic
    return 'hangel-alert.caf';
}

export interface PushSendResult {
    ok: boolean;
    successCount: number;
    failureCount: number;
    removedTokens: string[];
    errorMessages?: string[];
}

async function getTokensForUid(uid: string): Promise<string[]> {
    const db = getAdminFirestore();
    const snap = await db
        .collection(COLLECTIONS.users)
        .doc(uid)
        .collection(COLLECTIONS.fcmTokens)
        .get();
    return snap.docs.map(d => d.id);
}

async function cleanupInvalidTokens(uid: string, tokens: string[]): Promise<void> {
    if (tokens.length === 0) return;
    const db = getAdminFirestore();
    const batch = db.batch();
    for (const token of tokens) {
        const ref = db
            .collection(COLLECTIONS.users)
            .doc(uid)
            .collection(COLLECTIONS.fcmTokens)
            .doc(token);
        batch.delete(ref);
    }
    await batch.commit();
}

export async function sendPushToUser(uid: string, payload: PushPayload): Promise<PushSendResult> {
    if (!uid) {
        return { ok: false, successCount: 0, failureCount: 0, removedTokens: [], errorMessages: ['No uid'] };
    }
    const tokens = await getTokensForUid(uid);
    if (tokens.length === 0) {
        return { ok: true, successCount: 0, failureCount: 0, removedTokens: [] };
    }

    const messaging = getAdminMessaging();
    const message: MulticastMessage = {
        tokens,
        notification: {
            title: payload.title,
            body: payload.body,
            imageUrl: payload.imageUrl,
        },
        data: payload.data || {},
        webpush: {
            fcmOptions: {
                link: payload.clickAction || '/',
            },
            notification: {
                icon: payload.icon || '/icon-192.png',
            },
        },
        android: {
            priority: 'high',
            notification: {
                clickAction: payload.clickAction,
            },
        },
        apns: {
            headers: {
                'apns-priority': '10',
            },
            payload: {
                aps: {
                    badge: 1,
                    // GEÇİCİ: 'default' iOS Tri-tone. Mevcut TestFlight build'lerinde
                    // hangel-*.caf dosyaları yok (sonradan eklendi) — custom sound
                    // referansı sessiz fail eder. Tüm kullanıcılar yeni build
                    // yüklediğinde getSoundForNotificationType() geri çevrilir.
                    // sound: getSoundForNotificationType(payload.data?.type),
                    sound: 'default',
                    'mutable-content': 1,
                },
            },
            fcmOptions: {
                imageUrl: payload.imageUrl,
            },
        },
    };

    try {
        const res = await messaging.sendEachForMulticast(message);
        const removedTokens: string[] = [];
        const errorMessages: string[] = [];
        res.responses.forEach((r, i) => {
            if (!r.success && r.error) {
                const code = r.error.code;
                // Tokenı sil: artık geçersiz
                if (
                    code === 'messaging/registration-token-not-registered' ||
                    code === 'messaging/invalid-registration-token' ||
                    code === 'messaging/invalid-argument'
                ) {
                    removedTokens.push(tokens[i]);
                }
                errorMessages.push(`${tokens[i].slice(0, 8)}…: ${code}`);
            }
        });
        if (removedTokens.length > 0) {
            await cleanupInvalidTokens(uid, removedTokens).catch(e => {
                console.warn('[push] cleanup failed', e);
            });
        }
        return {
            ok: true,
            successCount: res.successCount,
            failureCount: res.failureCount,
            removedTokens,
            errorMessages: errorMessages.length > 0 ? errorMessages : undefined,
        };
    } catch (e) {
        console.error('[push] sendEachForMulticast failed', e);
        return {
            ok: false,
            successCount: 0,
            failureCount: tokens.length,
            removedTokens: [],
            errorMessages: [e instanceof Error ? e.message : 'Unknown error'],
        };
    }
}

export async function sendPushToUsers(
    uids: string[],
    payload: PushPayload,
): Promise<{ ok: boolean; perUser: Record<string, PushSendResult> }> {
    const perUser: Record<string, PushSendResult> = {};
    // Paralel ama orantılı: 10'lu chunk
    const CHUNK = 10;
    for (let i = 0; i < uids.length; i += CHUNK) {
        const chunk = uids.slice(i, i + CHUNK);
        const results = await Promise.allSettled(chunk.map(uid => sendPushToUser(uid, payload)));
        chunk.forEach((uid, idx) => {
            const r = results[idx];
            perUser[uid] = r.status === 'fulfilled'
                ? r.value
                : { ok: false, successCount: 0, failureCount: 0, removedTokens: [], errorMessages: [String(r.reason)] };
        });
    }
    return { ok: true, perUser };
}
