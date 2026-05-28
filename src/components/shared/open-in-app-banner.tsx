'use client';

/**
 * "Open in App" banner — mobil web kullanıcıları için.
 *
 * Davranış:
 *   1. Capacitor app içindeyse → render etmez (zaten app'tesin)
 *   2. Desktop'ta → render etmez
 *   3. iOS Safari'de → Smart App Banner zaten meta tag ile çıkar (üstte),
 *      bu banner çıkmaz (duplicate UX engellenir)
 *   4. iOS Chrome/Firefox/in-app browser'da → bu banner çıkar
 *   5. Android'de → bu banner çıkar
 *   6. localStorage'da "dismissed" → bir daha çıkmaz
 *
 * Tıklayınca:
 *   - iOS: App Store (yüklüyse "Aç", değilse "İndir")
 *   - Android: Play Store
 *   - Universal Links/App Links app rebuild sonrası → direkt app açar
 *     (banner görünmez çünkü kullanıcı app'tedir zaten)
 */
import { useEffect, useState } from 'react';
import { X, Smartphone } from 'lucide-react';
import { isNativeApp } from '@/lib/capacitor';

const STORAGE_KEY = 'hangel-app-banner-dismissed';
const APP_STORE_URL = 'https://apps.apple.com/in/app/hangel-app/id6664058822';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.hangel.app';

export function OpenInAppBanner() {
    const [visible, setVisible] = useState(false);
    const [platform, setPlatform] = useState<'ios' | 'android' | null>(null);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (isNativeApp()) return;
        // Dismissed daha önce?
        try {
            if (localStorage.getItem(STORAGE_KEY) === '1') return;
        } catch { /* noop */ }

        const ua = navigator.userAgent.toLowerCase();
        const isIos = /iphone|ipad|ipod/.test(ua);
        const isAndroid = /android/.test(ua);
        const isSafari = isIos && /safari/.test(ua) && !/(crios|fxios|edgios)/.test(ua);

        // iOS Safari → Smart App Banner zaten gösteriliyor, custom banner gerekmez
        if (isSafari) return;

        if (isIos) { setPlatform('ios'); setVisible(true); }
        else if (isAndroid) { setPlatform('android'); setVisible(true); }
    }, []);

    const handleDismiss = () => {
        setVisible(false);
        try { localStorage.setItem(STORAGE_KEY, '1'); } catch { /* noop */ }
    };

    if (!visible || !platform) return null;

    const url = platform === 'ios' ? APP_STORE_URL : PLAY_STORE_URL;

    return (
        <div className="sticky top-0 z-40 bg-primary text-primary-foreground border-b shadow-sm">
            <div className="flex items-center gap-2 px-3 py-2 max-w-3xl mx-auto">
                <Smartphone className="h-4 w-4 shrink-0" />
                <div className="flex-1 min-w-0 text-xs sm:text-sm leading-tight">
                    <strong>Hangel mobil uygulaması</strong>
                    <span className="hidden sm:inline"> — daha hızlı, bildirimli, native deneyim</span>
                </div>
                <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 inline-flex items-center rounded-md bg-white text-primary text-xs font-bold px-3 py-1.5 hover:bg-white/90 transition-colors"
                >
                    Aç
                </a>
                <button
                    type="button"
                    onClick={handleDismiss}
                    className="shrink-0 p-1 hover:bg-white/10 rounded-md"
                    aria-label="Kapat"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
