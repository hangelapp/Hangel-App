/**
 * POST /api/analytics/web-vitals
 *
 * Body: { name, value, id, url, userAgent } (eşik üstü Web Vitals)
 *
 * Davranış: Firestore analytics/webVitals/{auto} doc yazar.
 * Auth gerekmiyor (anonim trafik dahil) ama IP rate limit var (60/IP/dk).
 *
 * Why: Performans regresyonlarını yakalamak için. Süper admin dashboardunda
 * analiz edilir (sonraki iş).
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { checkRateLimit } from '@/lib/rate-limit';
import { FieldValue } from 'firebase-admin/firestore';

export const runtime = 'nodejs';

function getClientIp(req: NextRequest): string {
    const xff = req.headers.get('x-forwarded-for');
    if (xff) {
        const first = xff.split(',')[0]?.trim();
        if (first) return first;
    }
    return req.headers.get('x-real-ip')?.trim() || 'unknown';
}

export async function POST(req: NextRequest) {
    try {
        const ip = getClientIp(req);
        const limit = await checkRateLimit({ bucket: 'webvitals-ip', key: ip, limit: 60, windowMs: 60_000 });
        if (!limit.allowed) {
            return new NextResponse(null, { status: 204 });
        }

        const body = await req.json().catch(() => null);
        if (!body || typeof body.name !== 'string' || typeof body.value !== 'number') {
            return new NextResponse(null, { status: 204 });
        }

        const db = getAdminFirestore();
        await db.collection('analytics').doc('webVitals').collection('events').add({
            name: body.name,
            value: body.value,
            metricId: body.id || null,
            url: typeof body.url === 'string' ? body.url.slice(0, 200) : null,
            userAgent: typeof body.userAgent === 'string' ? body.userAgent.slice(0, 200) : null,
            ip: ip.slice(0, 64),
            createdAt: FieldValue.serverTimestamp(),
        });

        return new NextResponse(null, { status: 204 });
    } catch (e) {
        console.error('[web-vitals] internal error', e);
        return new NextResponse(null, { status: 204 });
    }
}
