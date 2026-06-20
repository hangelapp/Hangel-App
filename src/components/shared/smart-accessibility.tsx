'use client';

/**
 * SmartAccessibility — "Akıllı Erişilebilirlik"
 *
 * Ekran okuyucu (VoiceOver / TalkBack) kullanan bir kişiyi algılar ve
 * hangel'i onun için otomatik olarak en iyi hale getirmeyi teklif eder.
 *
 * Akış:
 * 1. ALGILAMA — @capacitor/screen-reader eklentisini DEFANSİF dynamic import
 *    ile yükler. Eklenti yoksa (web / native sync henüz yapılmamış) sessizce
 *    devre dışı kalır, ASLA hata fırlatmaz. Tarayıcıda ek olarak basit bir
 *    sezgisel kontrol (prefers-reduced-motion + VoiceOver/TalkBack ipuçları)
 *    çalışmaz; native algılama esastır.
 * 2. SORU — ekran okuyucu açık VE daha önce sorulmadıysa (localStorage flag)
 *    role="alertdialog" ile, ekran okuyucu tarafından net okunan bir teklif
 *    gösterir.
 * 3. UYGULAMA — "Evet" → kör-dostu preset'i mevcut ayar saklama mekanizmasına
 *    (hangel-a11y-v3 + A11Y_CHANGED_EVENT) yazar, anında uygulanır.
 *
 * Kullanıcı /settings/accessibility sayfasından bu otomatik algılamayı
 * tamamen kapatabilir (hangel:a11y-auto-detect = "off").
 */

import { useEffect, useRef, useState } from 'react';
import { A11Y_CHANGED_EVENT } from '@/components/shared/accessibility-applier';

const PROMPTED_KEY = 'hangel:a11y-prompted';
const AUTO_DETECT_KEY = 'hangel:a11y-auto-detect';
const SETTINGS_KEY = 'hangel-a11y-v3';

// Bu event ile ayarlar sayfası "ekran okuyucu açık mı" durumunu canlı okur,
// ve auto-detect toggle değişince provider yeniden değerlendirme yapar.
export const SMART_A11Y_STATE_EVENT = 'hangel-smart-a11y-state';

/** Otomatik algılama kullanıcı tarafından kapatılmış mı? */
export function isAutoDetectDisabled(): boolean {
    if (typeof localStorage === 'undefined') return false;
    return localStorage.getItem(AUTO_DETECT_KEY) === 'off';
}

/** Kör-dostu preset — mevcut ayarların üzerine en güvenli erişilebilir değerleri yazar. */
export function applyBlindFriendlyPreset() {
    if (typeof localStorage === 'undefined') return;
    let current: Record<string, unknown> = {};
    try {
        const saved = localStorage.getItem(SETTINGS_KEY);
        if (saved) current = JSON.parse(saved);
    } catch {
        // bozuk/erişilemez localStorage — boş başlangıçla devam
    }

    const preset = {
        ...current,
        highContrast: true,
        fontSize: 'huge', // en büyük seçenek
        reduceMotion: true,
        largeTouchTargets: true,
        fullKeyboard: true,
        focusStrength: 'high',
        linkUnderline: true,
        screenReaderMode: true,
    };

    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(preset));
        window.dispatchEvent(new Event(A11Y_CHANGED_EVENT));
    } catch {
        // private mode — sessiz geç
    }
}

export function SmartAccessibility() {
    const [open, setOpen] = useState(false);
    const titleId = useRef('smart-a11y-title');
    const descId = useRef('smart-a11y-desc');
    // Listener temizliği için saklanır.
    const removeListenerRef = useRef<null | (() => void)>(null);

    useEffect(() => {
        let active = true;

        const broadcast = (enabled: boolean) => {
            try {
                window.dispatchEvent(
                    new CustomEvent(SMART_A11Y_STATE_EVENT, { detail: { screenReaderOn: enabled } })
                );
            } catch {
                /* ignore */
            }
        };

        const maybePrompt = (enabled: boolean) => {
            if (!active) return;
            broadcast(enabled);
            if (!enabled) return;
            if (isAutoDetectDisabled()) return;
            let alreadyPrompted = false;
            try {
                alreadyPrompted = localStorage.getItem(PROMPTED_KEY) === '1';
            } catch {
                // localStorage erişilemez — varsayılan (false) ile devam
            }
            if (alreadyPrompted) return;
            setOpen(true);
        };

        (async () => {
            try {
                // DEFANSİF dynamic import — eklenti yoksa burada throw eder,
                // catch ile sessizce devre dışı kalırız (web / native sync öncesi).
                const mod = await import('@capacitor/screen-reader');
                const ScreenReader = mod.ScreenReader;
                if (!ScreenReader || typeof ScreenReader.isEnabled !== 'function') return;

                const { value } = await ScreenReader.isEnabled();
                maybePrompt(!!value);

                // Çalışırken VoiceOver/TalkBack açılıp kapanırsa yakala.
                try {
                    const handle = await ScreenReader.addListener('stateChange', (state) => {
                        maybePrompt(!!state?.value);
                    });
                    removeListenerRef.current = () => {
                        try {
                            handle.remove();
                        } catch {
                            /* ignore */
                        }
                    };
                } catch {
                    // stateChange desteklenmiyorsa sorun değil, ilk okuma yeterli.
                }
            } catch {
                // Eklenti yok / web / native sync yapılmamış → sessizce devre dışı.
            }
        })();

        return () => {
            active = false;
            if (removeListenerRef.current) removeListenerRef.current();
        };
    }, []);

    const markPrompted = () => {
        try {
            localStorage.setItem(PROMPTED_KEY, '1');
        } catch {
            /* ignore */
        }
    };

    const handleAccept = () => {
        applyBlindFriendlyPreset();
        markPrompted();
        setOpen(false);
    };

    const handleDismiss = () => {
        markPrompted();
        setOpen(false);
    };

    if (!open) return null;

    // Native, erişilebilir alertdialog — Radix yerine elle yazıldı ki ekran
    // okuyucu role/label'ları kesin okusun ve hiçbir dış bağımlılığa takılmasın.
    return (
        <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={titleId.current}
            aria-describedby={descId.current}
            className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
        >
            <div className="w-full max-w-md rounded-[2rem] border-2 border-primary/20 bg-background p-6 shadow-2xl animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
                <div className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0 rounded-2xl bg-primary/10 p-2.5 text-2xl" aria-hidden="true">
                        🧡
                    </div>
                    <div className="space-y-2">
                        <h2 id={titleId.current} className="text-xl font-black leading-tight tracking-tight">
                            Akıllı Erişilebilirlik
                        </h2>
                        <p id={descId.current} className="text-sm leading-relaxed text-muted-foreground">
                            Ekran okuyucu kullandığını fark ettim. hangel&apos;i senin için en iyi hale
                            getireyim mi? Yüksek kontrast, daha büyük yazı, hareket azaltma ve daha geniş
                            dokunma alanlarını tek seferde açarım. Bu ayarları istediğin an Erişilebilirlik
                            sayfasından değiştirebilirsin.
                        </p>
                    </div>
                </div>

                <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse">
                    <button
                        type="button"
                        onClick={handleAccept}
                        className="inline-flex h-12 flex-1 items-center justify-center rounded-xl bg-primary px-5 text-base font-bold text-white shadow-lg shadow-primary/20 transition-transform active:scale-[0.98]"
                    >
                        Evet, ayarla
                    </button>
                    <button
                        type="button"
                        onClick={handleDismiss}
                        className="inline-flex h-12 flex-1 items-center justify-center rounded-xl border border-border bg-background px-5 text-base font-bold text-foreground transition-colors hover:bg-accent"
                    >
                        Şimdi değil
                    </button>
                </div>
            </div>
        </div>
    );
}
