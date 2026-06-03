/**
 * Notification sound manifest — hangel push bildirim ses kataloğu.
 *
 * Mevcut durum (2026-06-03 itibarıyla):
 *   - iOS: 5 adet .caf bundle dosyası (`ios/App/App/hangel-*.caf`)
 *   - Android: ses dosyası YOK (`android/app/src/main/res/raw/` klasörü mevcut değil)
 *   - Web: ses dosyası YOK (`public/sounds/`, `public/notifications/` klasörü mevcut değil)
 *
 * Kod referansları:
 *   - `src/lib/push-notifications.ts` → `getSoundForNotificationType(type)` notification
 *     tipinden .caf adı türetir; APNs payload `sound` alanına yazılır.
 *   - `functions/src/*.ts` içinde direct `sound:` referansı YOK; backend push,
 *     `src/app/api/messaging/*` ve server actions üzerinden `sendPushToUser/Users`
 *     çağrılarına delege eder (sound alanı orada doldurulur).
 *
 * Bu manifest okuma amaçlıdır (UI ses seçimi, admin paneli, settings ekranı).
 * Yeni notification tipi eklendiğinde önce `push-notifications.ts:getSoundForNotificationType`
 * güncellenir, sonra burası senkronlanır.
 *
 * Duration değerleri yaklaşıktır — dosya boyutundan tahmin (~64 kbps AAC).
 * Lokal doğrulama: `afinfo ios/App/App/hangel-blood.caf | grep duration`
 */

export type NotificationSoundCategory =
    | 'emergency'
    | 'success'
    | 'message'
    | 'warning'
    | 'default';

export type NotificationSoundPaths = {
    ios?: string;
    android?: string;
    web?: string;
};

export type NotificationSound = {
    /** Stable id — kebab-case, hangel- prefix'siz */
    id: string;
    /** Görünür ad (TR) */
    name: string;
    /** Görünür ad (EN) */
    nameEn: string;
    /** Bundle dosya adı (iOS APNs `sound` alanına yazılan değer) */
    filename: string;
    /** Platform bazlı göreceli yollar (proje köküne göre) */
    paths: NotificationSoundPaths;
    /** Yaklaşık süre (saniye) — dosya boyutundan tahmin */
    duration?: number;
    /** Bildirim kategorisi (UI sıralama / filtreleme için) */
    category: NotificationSoundCategory;
    /** Açıklama (TR) */
    description?: string;
    /** Açıklama (EN) */
    description_en?: string;
    /** Bu sesi tetikleyen notification.data.type değerleri */
    triggerTypes: readonly string[];
};

/**
 * Special pseudo-id'ler — sound selector dropdown'larında kullanılır.
 * Catalog id'leriyle çakışmasın diye reserved çift-altçizgi prefix.
 */
export const SOUND_ID_SILENT = '__silent__';
export const SOUND_ID_DEFAULT = '__default__';

export const NOTIFICATION_SOUNDS: readonly NotificationSound[] = [
    {
        id: 'blood-emergency',
        name: 'Kan Acil Durumu',
        nameEn: 'Blood Emergency',
        filename: 'hangel-blood.caf',
        paths: {
            ios: 'ios/App/App/hangel-blood.caf',
            web: '/sounds/hangel-blood.m4a',
        },
        duration: 30,
        category: 'emergency',
        description: 'Kan bağışı çağrısı — Glass tonu, urgent.',
        description_en: 'Blood donation call-out — Glass tone, urgent.',
        triggerTypes: [
            'blood_emergency',
            'emergency-blood',
            'blood-emergency',
            'emergency_blood',
        ],
    },
    {
        id: 'disaster-alert',
        name: 'Afet Uyarısı',
        nameEn: 'Disaster Alert',
        filename: 'hangel-disaster.caf',
        paths: {
            ios: 'ios/App/App/hangel-disaster.caf',
            web: '/sounds/hangel-disaster.m4a',
        },
        duration: 28,
        category: 'emergency',
        description: 'Afet / geofence uyarısı — Sosumi karakterli alarm.',
        description_en: 'Disaster / geofence alert — Sosumi-style alarm.',
        triggerTypes: [
            'disaster_alert',
            'disaster-alert',
            'disaster',
            'emergency_disaster',
        ],
    },
    {
        id: 'volunteer-task',
        name: 'Gönüllülük Daveti',
        nameEn: 'Volunteer Task',
        filename: 'hangel-volunteer.caf',
        paths: {
            ios: 'ios/App/App/hangel-volunteer.caf',
            web: '/sounds/hangel-volunteer.m4a',
        },
        duration: 10,
        category: 'message',
        description: 'Gönüllülük daveti / başvuru sonucu — Tink, sakin.',
        description_en: 'Volunteer invitation / application result — Tink, calm.',
        triggerTypes: [
            'volunteer_task',
            'volunteer-task',
            'opportunity',
            'application_accepted',
            'application_rejected',
        ],
    },
    {
        id: 'event-reminder',
        name: 'Etkinlik Hatırlatıcı',
        nameEn: 'Event Reminder',
        filename: 'hangel-event.caf',
        paths: {
            ios: 'ios/App/App/hangel-event.caf',
            web: '/sounds/hangel-event.m4a',
        },
        duration: 29,
        category: 'default',
        description: 'Etkinlik hatırlatıcı / rozet kazanımı — Pop, nötr.',
        description_en: 'Event reminder / badge earned — Pop, neutral.',
        triggerTypes: [
            'event_reminder',
            'event-reminder',
            'event_created',
            'event',
            'badge_earned',
        ],
    },
    {
        id: 'alert-default',
        name: 'Genel Bildirim',
        nameEn: 'Generic Alert',
        filename: 'hangel-alert.caf',
        paths: {
            ios: 'ios/App/App/hangel-alert.caf',
            web: '/sounds/hangel-alert.m4a',
        },
        duration: 30,
        category: 'default',
        description:
            'Generic fallback — tanınmayan ya da tipsiz bildirimler için (Glass tonu).',
        description_en:
            'Generic fallback — used for unrecognised or type-less notifications (Glass).',
        triggerTypes: ['*'],
    },
];

/**
 * Filename → sound lookup map. `src/lib/push-notifications.ts` döndürdüğü
 * filename ile metadata almak için.
 */
export const NOTIFICATION_SOUNDS_BY_FILENAME: Readonly<
    Record<string, NotificationSound>
> = NOTIFICATION_SOUNDS.reduce<Record<string, NotificationSound>>((acc, sound) => {
    acc[sound.filename] = sound;
    return acc;
}, {});

/**
 * Trigger type → sound lookup. `push-notifications.ts:getSoundForNotificationType`
 * fonksiyonunun manifest tarafındaki ikizi; UI ses preview için kullanılır.
 */
export function findNotificationSoundByType(
    type: string | undefined | null,
): NotificationSound {
    const fallback =
        NOTIFICATION_SOUNDS.find((s) => s.id === 'alert-default') ??
        NOTIFICATION_SOUNDS[0];
    if (!type) return fallback;
    const lower = type.toLowerCase();
    const match = NOTIFICATION_SOUNDS.find((sound) =>
        sound.triggerTypes.includes(lower),
    );
    return match ?? fallback;
}
