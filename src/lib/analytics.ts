'use client';

/**
 * Hangel Analytics — Firebase Analytics wrapper.
 *
 * - Init: provider mount sırasında bir kez (`initAnalytics`).
 * - Event log: `logHangelEvent(EVENTS.donate_complete, { ngoId, amount })`.
 * - User properties: `setUserId(...)`, `setUserProperties(...)`.
 *
 * Event isim convention: snake_case (Firebase zorlaması — `-` veya boşluk
 * geçersiz, 40 char max, ilk char harf olmalı, 25 paramaks).
 *
 * SSR-safe: server'da getAnalytics() çağrılmaz, no-op döner.
 *
 * Sebep: PII bilgisi (kullanıcı maili, telefon) **gönderilmez**. UID
 * GA setUserId ile geçer (Firebase docs onaylı). Para tutarları amount band
 * şeklinde (0-100, 100-500, 500+) gönderilir — exact value değil.
 */

import type { FirebaseApp } from 'firebase/app';
import type { Analytics } from 'firebase/analytics';

/**
 * Hangel event isim sözlüğü. Tek noktada toplandı — yeni event eklerken
 * burada const tanımla, tip sistemi geri kalanını yakalar.
 */
export const EVENTS = {
    // ===== auth =====
    login_apple: 'login_apple',
    login_whatsapp: 'login_whatsapp',
    login_phone: 'login_phone',
    login_email: 'login_email',
    signup_start: 'signup_start',
    signup_complete: 'signup_complete',
    logout: 'logout',

    // ===== donation =====
    donate_start: 'donate_start',
    donate_complete: 'donate_complete',
    donate_amount: 'donate_amount',
    donate_failed: 'donate_failed',
    donate_recurring_enable: 'donate_recurring_enable',

    // ===== volunteer =====
    volunteer_apply: 'volunteer_apply',
    volunteer_withdraw: 'volunteer_withdraw',
    volunteer_attend: 'volunteer_attend',
    volunteer_view_listing: 'volunteer_view_listing',

    // ===== blood =====
    blood_respond_yes: 'blood_respond_yes',
    blood_respond_no: 'blood_respond_no',
    blood_viewed: 'blood_viewed',
    blood_share: 'blood_share',

    // ===== event =====
    event_rsvp: 'event_rsvp',
    event_checkin: 'event_checkin',
    event_share: 'event_share',
    event_view: 'event_view',

    // ===== market =====
    view_brand: 'view_brand',
    view_ngo: 'view_ngo',
    follow_ngo: 'follow_ngo',
    unfollow_ngo: 'unfollow_ngo',

    // ===== settings =====
    change_language: 'change_language',
    change_intent: 'change_intent',
    change_theme: 'change_theme',
    update_personal_info: 'update_personal_info',

    // ===== notification =====
    open_notification: 'open_notification',
    mark_read: 'mark_read',
    enable_push: 'enable_push',
    disable_push: 'disable_push',

    // ===== misc =====
    share_app: 'share_app',
    rate_app: 'rate_app',
    open_invite: 'open_invite',
} as const;

export type HangelEventName = (typeof EVENTS)[keyof typeof EVENTS];

type EventParams = Record<string, string | number | boolean | undefined | null>;

let analyticsInstance: Analytics | null = null;
let initAttempted = false;
let logEventFn: ((analytics: Analytics, name: string, params?: EventParams) => void) | null = null;
let setUserIdFn: ((analytics: Analytics, id: string | null) => void) | null = null;
let setUserPropsFn: ((analytics: Analytics, props: Record<string, string>) => void) | null = null;

/**
 * Analytics SDK'sını başlatır. Provider mount sırasında bir kez.
 * isSupported() check ile SSR / no-window ortamlarda gracefully no-op.
 */
export async function initAnalytics(app: FirebaseApp): Promise<Analytics | null> {
    if (typeof window === 'undefined') return null;
    if (initAttempted) return analyticsInstance;
    initAttempted = true;
    try {
        const mod = await import('firebase/analytics');
        const supported = await mod.isSupported();
        if (!supported) return null;
        const analytics = mod.getAnalytics(app);
        analyticsInstance = analytics;
        logEventFn = mod.logEvent as unknown as typeof logEventFn;
        setUserIdFn = mod.setUserId as unknown as typeof setUserIdFn;
        setUserPropsFn = mod.setUserProperties as unknown as typeof setUserPropsFn;
        return analytics;
    } catch (e) {
        if (process.env.NODE_ENV !== 'production') {
            console.warn('[analytics] init failed:', e);
        }
        return null;
    }
}

/**
 * Para tutarını band'a çevirir (PII'siz analytics için).
 */
export function amountBand(amount: number): string {
    if (!Number.isFinite(amount) || amount <= 0) return 'none';
    if (amount < 100) return '0-100';
    if (amount < 500) return '100-500';
    if (amount < 1000) return '500-1000';
    if (amount < 5000) return '1000-5000';
    if (amount < 10000) return '5000-10000';
    return '10000+';
}

/**
 * Event log'la. SDK yoksa no-op.
 *
 * Otomatik olarak `app_version`, `platform` gibi context alanlarını eklemez —
 * Firebase Analytics SDK'sı bunları kendisi alır.
 *
 * @example
 *   logHangelEvent(EVENTS.donate_complete, { ngoId: 'abc', amount_band: '100-500' });
 */
export function logHangelEvent(name: HangelEventName, params?: EventParams): void {
    const analytics = analyticsInstance;
    if (!analytics || !logEventFn) {
        // Dev'de loglayalım ki trigger noktası kontrol edilebilsin.
        if (process.env.NODE_ENV !== 'production') {
            // eslint-disable-next-line no-console
            console.debug('[analytics:queued]', name, params);
        }
        return;
    }
    try {
        // null / undefined param'ları filtrele
        const clean: Record<string, string | number | boolean> = {};
        if (params) {
            for (const k of Object.keys(params)) {
                const v = params[k];
                if (v == null) continue;
                clean[k] = v;
            }
        }
        logEventFn(analytics, name, clean);
    } catch (e) {
        if (process.env.NODE_ENV !== 'production') {
            console.warn('[analytics] logEvent failed:', e);
        }
    }
}

/**
 * Authenticated user için UID'yi GA'ya geçir. PII değildir — Firebase docs onaylı.
 * Logout'ta `null` çağrılır.
 */
export function setAnalyticsUserId(uid: string | null): void {
    const analytics = analyticsInstance;
    if (!analytics || !setUserIdFn) return;
    try {
        setUserIdFn(analytics, uid);
    } catch { /* noop */ }
}

/**
 * User segment'leri (rol, dil tercihi, kayıtlı STK sayısı band'ı).
 * PII değil — sadece kategorik veri.
 */
export function setAnalyticsUserProperties(props: Record<string, string>): void {
    const analytics = analyticsInstance;
    if (!analytics || !setUserPropsFn) return;
    try {
        setUserPropsFn(analytics, props);
    } catch { /* noop */ }
}
