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
import {
    NOTIFICATION_SOUNDS_BY_FILENAME,
    NOTIFICATION_SOUNDS,
    SOUND_ID_SILENT,
    SOUND_ID_DEFAULT,
} from './notification-sounds';
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
    // Super-admin event types (super-admin/settings).
    // Maps the 8 admin event keys to the closest existing tone — keeps APNs
    // payload graceful even if super-admin has not overridden the sound.
    if (lower === 'payment_received') {
        return 'hangel-volunteer.caf';
    }
    if (lower === 'payment_failed' || lower === 'system_error') {
        return 'hangel-disaster.caf';
    }
    if (lower === 'emergency_request_created') {
        return 'hangel-blood.caf';
    }
    if (
        lower === 'new_ngo_application' ||
        lower === 'new_brand_application' ||
        lower === 'new_user_signup' ||
        lower === 'weekly_summary'
    ) {
        return 'hangel-alert.caf';
    }
    // Welcome / message / diğer — generic
    return 'hangel-alert.caf';
}

/**
 * Super-admin custom sound preference resolver.
 *
 * Returns the APNs `sound` field value that should be put on the payload:
 *   - `string` (e.g. `'hangel-blood.caf'`) → play that custom CAF
 *   - `null` → silent push (caller MUST omit the `sound` field entirely)
 *
 * Lookup precedence (super-admin only):
 *   1. `superAdminSettings/{uid}.notifications.{eventType}.sound` ===
 *      `'__silent__'`  → null
 *   2. ...                                            === `'__default__'`
 *      → fall back to `getSoundForNotificationType(eventType)`
 *   3. catalog id (e.g. `'blood-emergency'`)          → resolve to `.filename`
 *   4. unknown id / unset / missing doc               → default sound
 *
 * For non super-admin users the default tone is returned untouched. This
 * preserves the pre-existing behaviour for every other call-site.
 */
export async function resolveSoundForUser(
    userUid: string,
    eventType: string,
    isSuperAdmin: boolean,
): Promise<string | null> {
    if (!isSuperAdmin) {
        return getSoundForNotificationType(eventType);
    }
    try {
        const db = getAdminFirestore();
        const snap = await db
            .collection(COLLECTIONS.superAdminSettings)
            .doc(userUid)
            .get();
        if (!snap.exists) {
            return getSoundForNotificationType(eventType);
        }
        const data = snap.data() as
            | {
                  notifications?: Record<
                      string,
                      { sound?: string | null } | undefined
                  >;
              }
            | undefined;
        const pref = data?.notifications?.[eventType]?.sound;

        if (pref === null || pref === SOUND_ID_SILENT) {
            return null;
        }
        if (typeof pref !== 'string' || pref.length === 0 || pref === SOUND_ID_DEFAULT) {
            return getSoundForNotificationType(eventType);
        }

        // pref is either a catalog id (e.g. 'blood-emergency') or already a
        // filename (e.g. 'hangel-blood.caf'). Resolve in that order.
        const byId = NOTIFICATION_SOUNDS.find((s) => s.id === pref);
        if (byId) return byId.filename;
        if (NOTIFICATION_SOUNDS_BY_FILENAME[pref]) return pref;

        // Unrecognised id → safe fallback to default.
        return getSoundForNotificationType(eventType);
    } catch (e) {
        console.warn('[push] resolveSoundForUser failed, using default', e);
        return getSoundForNotificationType(eventType);
    }
}

/**
 * Server-side super-admin check (claim-stamped UIDs cannot be read here —
 * only the auth token carries the claim — so we fall back to the Firestore
 * `users/{uid}.role` doc which the Cloud Function keeps in sync).
 *
 * Returns false on any error (e.g. doc missing) so non super-admin path
 * stays the default — this preserves backward compatibility.
 */
async function isSuperAdminUid(uid: string): Promise<boolean> {
    try {
        const db = getAdminFirestore();
        const snap = await db.collection(COLLECTIONS.users).doc(uid).get();
        if (!snap.exists) return false;
        const data = snap.data() as { role?: string; isSuperAdmin?: boolean } | undefined;
        return data?.role === 'super-admin' || data?.isSuperAdmin === true;
    } catch {
        return false;
    }
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

    // Super-admin sound override resolution. For non super-admins this is a
    // single role-doc read + the existing default-tone lookup, mirroring the
    // pre-existing behaviour. For super-admins the per-event sound preference
    // (or '__silent__') in `superAdminSettings/{uid}` wins.
    const eventType = payload.data?.type ?? '';
    const isAdmin = await isSuperAdminUid(uid);
    const resolvedSound = await resolveSoundForUser(uid, eventType, isAdmin);

    // APS dictionary — `sound` is omitted entirely when null (silent push).
    const aps: Record<string, unknown> = {
        badge: 1,
        'mutable-content': 1,
    };
    if (resolvedSound !== null) {
        // Custom Hangel sound (hangel-alert/blood/disaster/volunteer.caf).
        // Yeni build'lerde .caf bundled. Eski build'lerde iOS default
        // tone'a graceful fallback yapar (silent fail değil — line 53-54).
        aps.sound = resolvedSound;
    }

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
                aps,
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
