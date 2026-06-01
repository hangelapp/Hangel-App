'use client';

/**
 * Firebase Performance Monitoring entegrasyonu.
 *
 * - Auto traces: page load, network request (firebase SDK otomatik toplar)
 * - Custom traces: kritik flow'lar (donation submit, image upload, vb.)
 *
 * SSR-safe: server'da getPerformance() çağrılmaz, no-op döner.
 *
 * Sebep: web-vitals.ts sadece eşik üstü Core Web Vitals'ı topluyor.
 * Performance Monitoring buna ek olarak network latency, HTTP error rate
 * ve custom trace duration verilerini Firebase Console'a yollar.
 */
import type { FirebaseApp } from 'firebase/app';
import type {
    FirebasePerformance,
    PerformanceTrace,
} from 'firebase/performance';

let perfInstance: FirebasePerformance | null = null;
let initAttempted = false;

/**
 * Performance SDK'sını başlatır. Bir kez çağrılır (provider mount sırasında).
 * Hata olursa sessizce null bırakır — perf eksik olursa app çalışmaya devam etmeli.
 */
export async function initPerformance(app: FirebaseApp): Promise<FirebasePerformance | null> {
    if (typeof window === 'undefined') return null;
    if (initAttempted) return perfInstance;
    initAttempted = true;
    try {
        const { getPerformance } = await import('firebase/performance');
        perfInstance = getPerformance(app);
        return perfInstance;
    } catch (e) {
        // SDK yüklenemedi (eski browser, ad-blocker) → null bırak.
        if (process.env.NODE_ENV !== 'production') {
            console.warn('[perf] init failed:', e);
        }
        return null;
    }
}

export function getPerf(): FirebasePerformance | null {
    return perfInstance;
}

/**
 * Custom trace başlatır. Kullanım:
 *   const trace = await startTrace('donation_submit');
 *   trace?.putAttribute('amount_band', '0-100');
 *   ... iş ...
 *   trace?.stop();
 */
export async function startTrace(name: string): Promise<PerformanceTrace | null> {
    const perf = perfInstance;
    if (!perf) return null;
    try {
        const { trace } = await import('firebase/performance');
        const t = trace(perf, name);
        t.start();
        return t;
    } catch {
        return null;
    }
}

/**
 * Tek seferde wrap eden helper. async fn'i trace ile sarar.
 *   const result = await traced('image_upload', async () => { return await upload(...); });
 */
export async function traced<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const t = await startTrace(name);
    try {
        const result = await fn();
        return result;
    } finally {
        try { t?.stop(); } catch { /* noop */ }
    }
}
