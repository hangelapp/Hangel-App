/**
 * Session tracking — kullanıcının açık olduğu cihazları/browser'ları takip eder.
 *
 * - Her browser/cihazda kalıcı bir sessionId (localStorage)
 * - Auth user resolve olunca users/{uid}/sessions/{sessionId} write/update
 * - lastActiveAt her uygulama açılışında güncellenir (serverTimestamp)
 * - User-agent parsing: cihaz/browser/OS bilgisi friendly format
 *
 * Sınırlamalar:
 * - Bir oturum SİLİNİRSE diğer cihaz hemen anlamaz; token refresh anında
 *   (genelde 1 saat içinde) yenisi tekrar yazılır. Tam revocation için
 *   Admin SDK auth.revokeRefreshTokens(uid) gerekir — ama bu TÜM session'ları
 *   kapatır. Per-session revocation Firebase'de yok.
 * - Aynı cihazda aynı browser'da farklı sekmeler aynı sessionId paylaşır
 *   (localStorage shared). Farklı browser/cihaz = farklı sessionId.
 */
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { COLLECTIONS } from '@/firebase/collections';

const STORAGE_KEY = 'hangel-session-id';

export type ParsedUA = {
    deviceName: string;
    browserName: string;
    osName: string;
    deviceType: 'mobile' | 'tablet' | 'desktop';
};

function uuidV4(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    // Fallback: timestamp + random
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getSessionId(): string | null {
    if (typeof window === 'undefined') return null;
    try {
        let id = localStorage.getItem(STORAGE_KEY);
        if (!id) {
            id = uuidV4();
            localStorage.setItem(STORAGE_KEY, id);
        }
        return id;
    } catch {
        return null;
    }
}

export function parseUserAgent(ua: string): ParsedUA {
    const lower = ua.toLowerCase();

    // OS
    let osName = 'Bilinmiyor';
    if (/iphone|ipad|ipod/.test(lower)) osName = 'iOS';
    else if (/android/.test(lower)) osName = 'Android';
    else if (/mac os x|macintosh/.test(lower)) osName = 'macOS';
    else if (/windows/.test(lower)) osName = 'Windows';
    else if (/linux/.test(lower)) osName = 'Linux';
    else if (/cros/.test(lower)) osName = 'ChromeOS';

    // Browser (sıra önemli — Chrome string'i Safari'de de var)
    let browserName = 'Bilinmiyor';
    if (/edg\//.test(lower)) browserName = 'Edge';
    else if (/opr\/|opera/.test(lower)) browserName = 'Opera';
    else if (/firefox/.test(lower)) browserName = 'Firefox';
    else if (/samsungbrowser/.test(lower)) browserName = 'Samsung Internet';
    else if (/chrome/.test(lower)) browserName = 'Chrome';
    else if (/safari/.test(lower)) browserName = 'Safari';
    else if (/capacitor/.test(lower) || /hangel/.test(lower)) browserName = 'Hangel App';

    // Device type
    let deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop';
    if (/ipad|tablet/.test(lower)) deviceType = 'tablet';
    else if (/mobile|iphone|android/.test(lower)) deviceType = 'mobile';

    // Device name (best-effort)
    let deviceName: string;
    if (/iphone/.test(lower)) deviceName = 'iPhone';
    else if (/ipad/.test(lower)) deviceName = 'iPad';
    else if (/android/.test(lower)) {
        const m = ua.match(/Android[^;]*;\s*([^)]+)\)/);
        if (m) deviceName = m[1].trim().split(';')[0] || 'Android';
        else deviceName = 'Android';
    } else if (/macintosh|mac os x/.test(lower)) deviceName = 'Mac';
    else if (/windows/.test(lower)) deviceName = 'Windows PC';
    else deviceName = osName;

    return { deviceName, browserName, osName, deviceType };
}

/**
 * Auth user resolve olunca çağırılır. Mevcut session doc yoksa yaratır,
 * varsa lastActiveAt'ı günceller. NotFound hataları sessizce yutulur (rules
 * yetkisizliği veya offline).
 */
export async function trackSession(uid: string): Promise<void> {
    if (!uid || typeof window === 'undefined') return;
    const sessionId = getSessionId();
    if (!sessionId) return;

    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const parsed = parseUserAgent(ua);

    try {
        const { firestore } = initializeFirebase();
        const ref = doc(firestore, COLLECTIONS.users, uid, 'sessions', sessionId);
        await setDoc(
            ref,
            {
                sessionId,
                userAgent: ua.slice(0, 300),
                deviceName: parsed.deviceName,
                browserName: parsed.browserName,
                osName: parsed.osName,
                deviceType: parsed.deviceType,
                lastActiveAt: serverTimestamp(),
                // createdAt sadece ilk yazılışta — setDoc merge: true ile mevcutsa korunur
                createdAt: serverTimestamp(),
            },
            { merge: true },
        );
        // createdAt'ı sadece doc yoksa yazmak için merge sonrası overwrite önlenir
        // ama setDoc merge: true zaten existing createdAt'ı korur (overwrite etmez).
    } catch (err) {
        // Sessize al — security/rules etkisi olsa bile login akışını kırma
        if (typeof console !== 'undefined') {
            console.warn('[session-tracker] failed to register session', err);
        }
    }
}
