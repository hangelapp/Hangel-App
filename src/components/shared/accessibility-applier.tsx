'use client';

import { useEffect } from 'react';

// Aynı tab'da save → instant apply için custom event adı
export const A11Y_CHANGED_EVENT = 'hangel-a11y-changed';

export function applyA11ySettings() {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem('hangel-a11y-v3');
    if (!saved) return;
    try {
        const s = JSON.parse(saved);
        const html = document.documentElement;

        // Görsel: High contrast
        html.classList.toggle('a11y-high-contrast', !!s.highContrast);

        // Yazı tipi boyutu (small/normal/large/huge)
        html.removeAttribute('data-a11y-font');
        if (s.fontSize && s.fontSize !== 'normal') {
            html.setAttribute('data-a11y-font', s.fontSize);
        }

        // Satır aralığı (normal/1.5/2.0)
        html.removeAttribute('data-a11y-line-height');
        if (s.lineHeight && s.lineHeight !== 'normal') {
            html.setAttribute('data-a11y-line-height', s.lineHeight);
        }

        // Kelime aralığı (normal/wide/extra)
        html.removeAttribute('data-a11y-word-spacing');
        if (s.wordSpacing && s.wordSpacing !== 'normal') {
            html.setAttribute('data-a11y-word-spacing', s.wordSpacing);
        }

        // Paragraf aralığı
        html.removeAttribute('data-a11y-paragraph-spacing');
        if (s.paragraphSpacing && s.paragraphSpacing !== 'normal') {
            html.setAttribute('data-a11y-paragraph-spacing', s.paragraphSpacing);
        }

        // Renk filtresi (yok/protanopi/deuteranopi/tritanopi/akromatopsi)
        html.removeAttribute('data-a11y-color-filter');
        if (s.colorFilter && s.colorFilter !== 'yok') {
            html.setAttribute('data-a11y-color-filter', s.colorFilter);
        }

        // Metin hizalama (left/center/justify)
        html.removeAttribute('data-a11y-text-align');
        if (s.textAlignment && s.textAlignment !== 'left') {
            html.setAttribute('data-a11y-text-align', s.textAlignment);
        }

        // Disleksi fontu
        html.classList.toggle('a11y-dyslexia-font', !!s.dyslexiaFont);

        // Etkileşim/Motor
        html.classList.toggle('a11y-reduce-motion', !!s.reduceMotion);
        html.classList.toggle('a11y-large-targets', !!s.largeTouchTargets);
        html.classList.toggle('a11y-full-keyboard', !!s.fullKeyboard);

        // Odak çerçevesi (thin/thick/high)
        html.removeAttribute('data-a11y-focus');
        if (s.focusStrength && s.focusStrength !== 'thin') {
            html.setAttribute('data-a11y-focus', s.focusStrength);
        }

        // Bilişsel: Sade mod (odak)
        html.classList.toggle('a11y-focus-mode', !!s.focusMode);

        // Otomatik sesleri kapat
        html.classList.toggle('a11y-mute-auto', !!s.muteAutoAudio);
    } catch {
        // ignore
    }
}

export function AccessibilityApplier() {
    useEffect(() => {
        applyA11ySettings();

        // storage event sadece diğer tab'lardan tetiklenir
        const onStorage = (e: StorageEvent) => {
            if (e.key === 'hangel-a11y-v3') applyA11ySettings();
        };
        // Aynı tab'da save sonrası anında apply için custom event
        const onChanged = () => applyA11ySettings();

        window.addEventListener('storage', onStorage);
        window.addEventListener(A11Y_CHANGED_EVENT, onChanged);
        return () => {
            window.removeEventListener('storage', onStorage);
            window.removeEventListener(A11Y_CHANGED_EVENT, onChanged);
        };
    }, []);

    return null;
}
