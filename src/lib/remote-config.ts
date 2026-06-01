'use client';

/**
 * Firebase Remote Config helper.
 *
 * - Initialize: provider mount sırasında bir kez (`initRemoteConfig`).
 * - Read: `getBoolFlag('feature_apple_signin_enabled')`, `getNumberFlag(...)`,
 *   `getStringFlag(...)`.
 * - Defaults: SDK yüklenmemiş veya fetch başarısız ise local DEFAULTS map'i döner.
 *
 * SSR-safe: server'da getRemoteConfig() çağrılmaz; getters local defaults döner.
 *
 * Flag isim convention: snake_case, `feature_*`, `welcome_*`, `*_enabled`,
 * `*_limit`. Yeni flag eklerken DEFAULTS map'e da default yaz.
 */

import type { FirebaseApp } from 'firebase/app';
import type { RemoteConfig } from 'firebase/remote-config';

export const REMOTE_CONFIG_DEFAULTS = {
    /** Apple Sign In butonu (login screens) */
    feature_apple_signin_enabled: true,
    /** Live Activity (iOS Dynamic Island) — beta sayılır */
    feature_live_activity_enabled: false,
    /** Welcome intent ekranında kullanıcının seçebileceği max niyet sayısı */
    welcome_intent_count_limit: 3,
    /** Bağış başlat butonu görünür mü (kill switch) */
    feature_donate_enabled: true,
    /** Gönüllülük başvuru kapısı (acil bakım için kapatılabilir) */
    feature_volunteer_apply_enabled: true,
    /** Çağrı paylaşım (kan ihtiyacı) — A/B test variant */
    feature_blood_share_variant: 'default', // 'default' | 'compact' | 'detailed'
    /** Onboarding step sayısı (3 vs 5) */
    welcome_onboarding_step_count: 3,
    /** Toast otomatik kapanma süresi (ms) */
    toast_auto_dismiss_ms: 4000,
    /** Yeni hangel kartı (passkit) butonunun ana sayfada görünürlüğü */
    feature_passkit_card_enabled: true,
    /** Maximum FCM token cache age (saat) */
    fcm_token_cache_hours: 168,
} as const;

export type RemoteConfigKey = keyof typeof REMOTE_CONFIG_DEFAULTS;

type ConfigDefaultsMap = Record<string, string | number | boolean>;

let rcInstance: RemoteConfig | null = null;
let initAttempted = false;
let fetchPromise: Promise<boolean> | null = null;

// getValue sync olduğu için ilk init sırasında cache'liyoruz.
type RCValue = {
    asBoolean: () => boolean;
    asString: () => string;
    asNumber: () => number;
    getSource: () => string;
};
type GetValueFn = (rc: RemoteConfig, key: string) => RCValue;
let getValueFnCached: GetValueFn | null = null;

/**
 * Init + initial fetch+activate. Provider mount'ta bir kez çağrılır.
 * Hata olursa null bırakır.
 */
export async function initRemoteConfig(app: FirebaseApp): Promise<RemoteConfig | null> {
    if (typeof window === 'undefined') return null;
    if (initAttempted) return rcInstance;
    initAttempted = true;
    try {
        const mod = await import('firebase/remote-config');
        const rc = mod.getRemoteConfig(app);
        // Default'lar (offline / first-fetch öncesi)
        rc.defaultConfig = REMOTE_CONFIG_DEFAULTS as unknown as ConfigDefaultsMap;
        // 1 saatte bir yenile (production); dev'de daha sık olabilir.
        rc.settings.minimumFetchIntervalMillis = 60 * 60 * 1000;
        rc.settings.fetchTimeoutMillis = 60_000;
        rcInstance = rc;
        getValueFnCached = mod.getValue as unknown as GetValueFn;

        // Fetch'i background'da başlat — caller bekleme yapmaz.
        fetchPromise = mod.fetchAndActivate(rc).catch((e) => {
            if (process.env.NODE_ENV !== 'production') {
                console.warn('[remote-config] fetchAndActivate failed:', e);
            }
            return false;
        });
        return rc;
    } catch (e) {
        if (process.env.NODE_ENV !== 'production') {
            console.warn('[remote-config] init failed:', e);
        }
        return null;
    }
}

/**
 * Caller ilk fetch'in tamamlanmasını beklemek isterse (örn. login flow'da
 * apple_signin gizleme/gösterme), bunu await edebilir. SDK yoksa false döner.
 */
export async function awaitRemoteConfig(): Promise<boolean> {
    if (!fetchPromise) return false;
    return fetchPromise;
}

function readValue(key: RemoteConfigKey): RCValue | null {
    const rc = rcInstance;
    if (!rc || !getValueFnCached) return null;
    try {
        return getValueFnCached(rc, key as string);
    } catch {
        return null;
    }
}

export function getBoolFlag(key: RemoteConfigKey): boolean {
    const def = REMOTE_CONFIG_DEFAULTS[key];
    const v = readValue(key);
    if (v) {
        try { return v.asBoolean(); } catch { /* fallback */ }
    }
    return typeof def === 'boolean' ? def : Boolean(def);
}

export function getStringFlag(key: RemoteConfigKey): string {
    const def = REMOTE_CONFIG_DEFAULTS[key];
    const v = readValue(key);
    if (v) {
        try { return v.asString(); } catch { /* fallback */ }
    }
    return typeof def === 'string' ? def : String(def);
}

export function getNumberFlag(key: RemoteConfigKey): number {
    const def = REMOTE_CONFIG_DEFAULTS[key];
    const v = readValue(key);
    if (v) {
        try { return v.asNumber(); } catch { /* fallback */ }
    }
    return typeof def === 'number' ? def : Number(def);
}

/**
 * Generic helper — tip default'a göre infer edilir.
 */
export function getValue<K extends RemoteConfigKey>(key: K): (typeof REMOTE_CONFIG_DEFAULTS)[K] {
    const def = REMOTE_CONFIG_DEFAULTS[key];
    if (typeof def === 'boolean') return getBoolFlag(key) as (typeof REMOTE_CONFIG_DEFAULTS)[K];
    if (typeof def === 'number') return getNumberFlag(key) as (typeof REMOTE_CONFIG_DEFAULTS)[K];
    return getStringFlag(key) as (typeof REMOTE_CONFIG_DEFAULTS)[K];
}
