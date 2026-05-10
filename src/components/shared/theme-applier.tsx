'use client';

import { useEffect } from 'react';

export function ThemeApplier() {
    useEffect(() => {
        try {
            const theme = localStorage.getItem('hangel-theme');
            const html = document.documentElement;
            if (theme === 'dark') {
                html.classList.add('dark');
            } else if (theme === 'light') {
                html.classList.remove('dark');
            } else if (typeof window !== 'undefined' && window.matchMedia) {
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                html.classList.toggle('dark', prefersDark);
            }
        } catch (_) {}
    }, []);

    return null;
}
