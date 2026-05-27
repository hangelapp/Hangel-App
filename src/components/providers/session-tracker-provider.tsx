'use client';

/**
 * Auth user resolve olunca tek seferde session'ı Firestore'a yazar.
 * Cihaz/browser bilgisini saklar (users/{uid}/sessions/{sessionId}).
 *
 * SSR-safe: server'da no-op.
 */
import { useEffect, useRef } from 'react';
import { useUser } from '@/firebase';
import { trackSession } from '@/lib/session-tracker';

export function SessionTrackerProvider() {
    const { user, isUserLoading } = useUser();
    const trackedRef = useRef<string | null>(null);

    useEffect(() => {
        if (isUserLoading || !user?.uid) return;
        if (trackedRef.current === user.uid) return;
        trackedRef.current = user.uid;
        // Best-effort, void promise
        void trackSession(user.uid);
    }, [user?.uid, isUserLoading]);

    return null;
}
