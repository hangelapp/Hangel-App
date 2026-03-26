'use client';

import { useEffect } from 'react';

export function AccessibilityApplier() {
    useEffect(() => {
        const apply = () => {
            const saved = localStorage.getItem('hangel-a11y-v3');
            if (!saved) return;
            try {
                const s = JSON.parse(saved);
                const html = document.documentElement;

                // High contrast
                html.classList.toggle('a11y-high-contrast', !!s.highContrast);

                // Font size
                html.removeAttribute('data-a11y-font');
                if (s.fontSize && s.fontSize !== 'normal') {
                    html.setAttribute('data-a11y-font', s.fontSize);
                }

                // Line height
                html.removeAttribute('data-a11y-line-height');
                if (s.lineHeight && s.lineHeight !== 'normal') {
                    html.setAttribute('data-a11y-line-height', s.lineHeight);
                }

                // Word spacing
                html.removeAttribute('data-a11y-word-spacing');
                if (s.wordSpacing && s.wordSpacing !== 'normal') {
                    html.setAttribute('data-a11y-word-spacing', s.wordSpacing);
                }

                // Dyslexia font
                html.classList.toggle('a11y-dyslexia-font', !!s.dyslexiaFont);

                // Reduce motion
                html.classList.toggle('a11y-reduce-motion', !!s.reduceMotion);

                // Large touch targets
                html.classList.toggle('a11y-large-targets', !!s.largeTouchTargets);

                // Focus mode
                html.classList.toggle('a11y-focus-mode', !!s.focusMode);

                // Focus frame strength
                html.removeAttribute('data-a11y-focus');
                if (s.focusStrength && s.focusStrength !== 'thin') {
                    html.setAttribute('data-a11y-focus', s.focusStrength);
                }
            } catch (e) {
                // ignore
            }
        };

        apply();

        // Listen for storage changes (when settings are saved from another tab or from the settings page)
        const onStorage = (e: StorageEvent) => {
            if (e.key === 'hangel-a11y-v3') apply();
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    return null;
}
