/**
 * Web Vitals raporlama — Next.js'in next/web-vitals modülünden gelir.
 * Production'da kritik regresyonları /api/analytics/web-vitals'a gönderir.
 * Local/dev: sadece console.
 *
 * Why: bundle size + performans regresyonu tespiti. Yalnızca eşik üstü
 * metrikleri (LCP > 2500ms, CLS > 0.1, INP > 200ms) sunucuya gönderiyoruz
 * — tüm trafiği toplamayız (storage cost düşük tutuluyor).
 */
import type { NextWebVitalsMetric } from 'next/app';

const THRESHOLDS: Record<string, number> = {
    CLS: 0.1,
    LCP: 2500,
    INP: 200,
    FCP: 1800,
    TTFB: 800,
};

function shouldReport(metric: NextWebVitalsMetric): boolean {
    const t = THRESHOLDS[metric.name];
    return typeof t === 'number' && metric.value > t;
}

export function reportVital(metric: NextWebVitalsMetric) {
    if (typeof window === 'undefined') return;

    if (process.env.NODE_ENV !== 'production') {
        if (shouldReport(metric)) {
            console.warn(`[web-vitals] ${metric.name}: ${metric.value.toFixed?.(1) || metric.value} (over threshold)`);
        }
        return;
    }

    if (!shouldReport(metric)) return;

    const payload = {
        name: metric.name,
        value: Math.round(metric.value * 100) / 100,
        id: metric.id,
        url: window.location.pathname,
        userAgent: navigator.userAgent.slice(0, 200),
    };

    try {
        const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        if (navigator.sendBeacon) {
            navigator.sendBeacon('/api/analytics/web-vitals', blob);
        } else {
            fetch('/api/analytics/web-vitals', {
                method: 'POST',
                body: blob,
                keepalive: true,
            }).catch(() => { /* swallow */ });
        }
    } catch { /* noop */ }
}
