'use client';

import { useReportWebVitals } from 'next/web-vitals';
import { reportVital } from '@/lib/web-vitals';

/**
 * WebVitalsTracker — Next.js useReportWebVitals hook'unu çağırır ve metriği
 * sadece eşik üstüyse server'a yollar. Render etmez (null).
 */
export function WebVitalsTracker() {
    useReportWebVitals(reportVital);
    return null;
}
