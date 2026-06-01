'use client';

/**
 * useRemoteConfig — Remote Config flag'lerini React component'lerinde okur.
 *
 * - İlk render: local DEFAULTS değeri döner (SSR'de bu garantili).
 * - Mount sonrası: ilk fetch tamamlanırsa remote değere geçer (re-render).
 * - SDK yüklenmemişse (eski browser, ad-blocker) sürekli DEFAULTS kalır.
 *
 * Kullanım:
 *   const showApple = useRemoteConfig('feature_apple_signin_enabled'); // boolean
 *   const limit = useRemoteConfig('welcome_intent_count_limit');       // number
 *   const variant = useRemoteConfig('feature_blood_share_variant');    // string
 *
 * Refresh için: awaitRemoteConfig() sonrasında state yeniden okunur.
 */
import { useEffect, useState } from 'react';
import {
    REMOTE_CONFIG_DEFAULTS,
    awaitRemoteConfig,
    getValue,
    type RemoteConfigKey,
} from '@/lib/remote-config';

export function useRemoteConfig<K extends RemoteConfigKey>(
    key: K
): (typeof REMOTE_CONFIG_DEFAULTS)[K] {
    const [value, setValue] = useState<(typeof REMOTE_CONFIG_DEFAULTS)[K]>(() => getValue(key));

    useEffect(() => {
        let cancelled = false;
        // Mount'ta hemen tekrar oku (initRemoteConfig provider'da paralel başlamış olabilir).
        try {
            const v = getValue(key);
            if (!cancelled) setValue(v);
        } catch { /* noop */ }

        // İlk fetch tamamlanınca tekrar oku
        void awaitRemoteConfig().then(() => {
            if (cancelled) return;
            try {
                const v = getValue(key);
                setValue(v);
            } catch { /* noop */ }
        });

        return () => {
            cancelled = true;
        };
    }, [key]);

    return value;
}

/**
 * Boolean flag için tip-safe wrapper. Hem kod okunabilirliği hem auto-completion.
 */
export function useBoolFlag(key: RemoteConfigKey & { __brand?: 'bool' } extends never ? RemoteConfigKey : RemoteConfigKey): boolean {
    return Boolean(useRemoteConfig(key));
}
