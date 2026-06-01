'use client';

import { useEffect, useState } from 'react';
import { Bell, ChevronRight, X, UserCircle } from 'lucide-react';
import Link from 'next/link';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import type { User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { requestPushPermission, registerForPushToken } from '@/lib/fcm';

/**
 * TimelineBanner — kullanıcı profil tamamlama veya push notification açma için
 * dürüst bir nudge. /timeline en üstte tek seferde tek banner gösterir.
 *
 * Sıralama (önce göster):
 *  1. Push permission default ise → "Bildirimleri Aç"
 *  2. Profile.birthDate veya city eksikse → "Profilini Tamamla"
 *  3. Hiçbiri yoksa null (banner yok)
 *
 * Kullanıcı X ile kapatırsa sessionStorage'a yazılır → o sekmede tekrar gözükmez.
 */
export function TimelineBanner() {
    const { user: authUser } = useUser();
    const db = useFirestore();
    const { toast } = useToast();

    const userDocRef = useMemoFirebase(() => {
        if (!db || !authUser) return null;
        return doc(db, COLLECTIONS.users, authUser.uid);
    }, [db, authUser]);
    const { data: userData } = useDoc<User>(userDocRef);

    const [dismissed, setDismissed] = useState<string[]>([]);
    const [pushPermission, setPushPermission] = useState<NotificationPermission | 'unsupported' | 'loading'>('loading');
    const [pushBusy, setPushBusy] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            const stored = sessionStorage.getItem('hangel-timeline-banner-dismissed');
            if (stored) setDismissed(JSON.parse(stored));
        } catch { /* noop */ }
        if (typeof Notification === 'undefined') {
            setPushPermission('unsupported');
        } else {
            setPushPermission(Notification.permission);
        }
    }, []);

    const dismiss = (key: string) => {
        const next = [...dismissed, key];
        setDismissed(next);
        try { sessionStorage.setItem('hangel-timeline-banner-dismissed', JSON.stringify(next)); } catch { /* noop */ }
    };

    const handleEnablePush = async () => {
        if (!authUser) return;
        setPushBusy(true);
        try {
            const next = await requestPushPermission();
            setPushPermission(next);
            if (next === 'granted') {
                await registerForPushToken(authUser.uid);
                toast({ title: 'Bildirimler açıldı 🔔', description: 'Yeni mesaj ve etkinliklerden haberdar olacaksın.' });
            } else if (next === 'denied') {
                toast({ variant: 'destructive', title: 'İzin reddedildi', description: 'Tarayıcı ayarlarından sonra açabilirsin.' });
            }
        } catch (e) {
            console.error('[banner push] failed', e);
        } finally {
            setPushBusy(false);
        }
    };

    if (!authUser || !userData) return null;

    // Push permission banner
    if (
        pushPermission === 'default' &&
        !dismissed.includes('push')
    ) {
        return (
            <div className="bg-emerald-50 border-b border-emerald-200 p-3 flex items-center gap-3 dark:bg-emerald-900/20 dark:border-emerald-800">
                <div className="shrink-0 p-2 rounded-full bg-emerald-100 dark:bg-emerald-900/40">
                    <Bell className="h-4 w-4 text-emerald-700 dark:text-emerald-300" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-emerald-900 leading-tight dark:text-emerald-100">Bildirimleri aç</p>
                    <p className="text-xs text-emerald-800 leading-snug mt-0.5 dark:text-emerald-200/80">
                        Yeni mesaj, etkinlik ve gönüllülük eşleşmelerinden anında haberdar ol.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={handleEnablePush}
                    disabled={pushBusy}
                    className="shrink-0 px-3 py-1.5 rounded-full bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:opacity-60 dark:bg-emerald-500 dark:hover:bg-emerald-600"
                >
                    {pushBusy ? '...' : 'Aç'}
                </button>
                <button
                    type="button"
                    onClick={() => dismiss('push')}
                    className="shrink-0 p-1 rounded-full hover:bg-emerald-100 text-emerald-700 dark:hover:bg-emerald-900/40 dark:text-emerald-300"
                    aria-label="Kapat"
                >
                    <X className="h-3.5 w-3.5" />
                </button>
            </div>
        );
    }

    // Profile completion banner
    const pi = userData.personalInfo || ({} as User['personalInfo']);
    const profileIncomplete = !pi.birthDate || !pi.address?.city || !pi.phone;
    if (profileIncomplete && !dismissed.includes('profile')) {
        const fieldsMissing = [
            !pi.birthDate && 'doğum tarihi',
            !pi.address?.city && 'şehir',
            !pi.phone && 'telefon',
        ].filter(Boolean).length;
        return (
            <Link
                href="/settings/profile"
                className="bg-primary/5 border-b border-primary/20 p-3 flex items-center gap-3 hover:bg-primary/10 transition-colors"
            >
                <div className="shrink-0 p-2 rounded-full bg-primary/10">
                    <UserCircle className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold leading-tight">Profilini tamamla</p>
                    <p className="text-xs text-muted-foreground leading-snug mt-0.5">
                        {fieldsMissing} bilgin eksik. Tamamlayınca sana özel öneriler iyileşir.
                    </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); dismiss('profile'); }}
                    className="shrink-0 p-1 rounded-full hover:bg-muted text-muted-foreground"
                    aria-label="Kapat"
                >
                    <X className="h-3.5 w-3.5" />
                </button>
            </Link>
        );
    }

    return null;
}
