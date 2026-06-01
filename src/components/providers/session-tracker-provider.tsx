'use client';

/**
 * Auth user resolve olunca tek seferde session'ı Firestore'a yazar.
 * Cihaz/browser bilgisini saklar (users/{uid}/sessions/{sessionId}).
 *
 * SSR-safe: server'da no-op.
 */
import { useEffect, useRef } from 'react';
import { useUser } from '@/firebase';
import { trackSession, logAdminActivity } from '@/lib/session-tracker';
import { setAnalyticsUserId } from '@/lib/analytics';

export function SessionTrackerProvider() {
    const { user, isUserLoading } = useUser();
    const trackedRef = useRef<string | null>(null);

    // Auth user değiştiğinde Analytics UID'yi de güncelle (logout → null).
    useEffect(() => {
        if (isUserLoading) return;
        setAnalyticsUserId(user?.uid ?? null);
    }, [user?.uid, isUserLoading]);

    useEffect(() => {
        if (isUserLoading || !user?.uid) return;
        const uid = user.uid;

        // Session kaydı (cihaz listesi) — uid başına bir kez
        if (trackedRef.current !== uid) {
            trackedRef.current = uid;
            void trackSession(uid);
        }

        // Yönetici çalışma çizelgesi: admin ise giriş(open) + ayrılış(close) logla.
        // Yazma hacmini sınırlamak için yalnızca admin claim'i olanlar loglanır.
        let isAdmin = false;
        let openLogged = false;
        let lastCloseAt = 0;
        const currentUser = user;

        currentUser.getIdTokenResult()
            .then(res => {
                const claims = res.claims as { role?: string; superAdminPermissions?: unknown };
                isAdmin = claims.role === 'super-admin' || !!claims.superAdminPermissions;
                if (isAdmin && !openLogged) {
                    openLogged = true;
                    void logAdminActivity(uid, 'open');
                }
            })
            .catch(() => { /* claim okunamadı → loglama yok */ });

        const logClose = () => {
            if (!isAdmin) return;
            const now = Date.now();
            if (now - lastCloseAt < 60_000) return; // 60sn debounce
            lastCloseAt = now;
            void logAdminActivity(uid, 'close');
        };
        const onVisibility = () => {
            if (typeof document !== 'undefined' && document.visibilityState === 'hidden') logClose();
        };

        document.addEventListener('visibilitychange', onVisibility);
        window.addEventListener('beforeunload', logClose);
        return () => {
            document.removeEventListener('visibilitychange', onVisibility);
            window.removeEventListener('beforeunload', logClose);
        };
    }, [user, user?.uid, isUserLoading]);

    return null;
}
