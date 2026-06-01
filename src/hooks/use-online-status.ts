'use client';

/**
 * useOnlineStatus — basit network status hook'u.
 *
 * - `navigator.onLine` üzerinden boolean döner
 * - `online` / `offline` window event'lerini dinler
 * - SSR'de daima `true` döner (server bir bağlantı sahibi sayılır)
 *
 * Capacitor native app'lerde de çalışır — Capacitor WebView Cordova-style
 * online/offline event'lerini emit eder.
 */
import { useEffect, useState } from 'react';

export function useOnlineStatus(): boolean {
    const [isOnline, setIsOnline] = useState<boolean>(() => {
        if (typeof navigator === 'undefined') return true;
        return typeof navigator.onLine === 'boolean' ? navigator.onLine : true;
    });

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        // Initial sync — mount sırasında durum değişmiş olabilir
        setIsOnline(typeof navigator.onLine === 'boolean' ? navigator.onLine : true);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return isOnline;
}
