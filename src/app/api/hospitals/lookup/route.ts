/**
 * GET /api/hospitals/lookup?q=<name>
 *
 * Hastane adı prefix/contains arama. hospitals/{id} koleksiyonundan.
 * Public — auth gerekmez (emergency form için).
 * Rate limit: 30 req/IP/dakika.
 *
 * Sonuç: { ok, hits: [{ id, name, city, district, address, phone, website, ... }] }
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { checkRateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';

function getClientIp(req: NextRequest): string {
    const xff = req.headers.get('x-forwarded-for');
    if (xff) {
        const first = xff.split(',')[0]?.trim();
        if (first) return first;
    }
    return req.headers.get('x-real-ip')?.trim() || 'unknown';
}

export async function GET(req: NextRequest) {
    try {
        const ip = getClientIp(req);
        const limit = await checkRateLimit({ bucket: 'hospital-lookup', key: ip, limit: 30, windowMs: 60_000 });
        if (!limit.allowed) {
            return NextResponse.json({ ok: false, errorCode: 'RATE_LIMITED' }, { status: 429 });
        }

        const q = (req.nextUrl.searchParams.get('q') || '').trim().toLowerCase();
        if (q.length < 2) {
            return NextResponse.json({ ok: true, hits: [] });
        }

        const db = getAdminFirestore();
        // Firestore'da case-insensitive prefix search yok — basit yöntem:
        // ilk 200 hastane (sınırlı) çek + client filter.
        // Daha iyi: nameLower field + range query. Şu an basit MVP.
        const snap = await db.collection('hospitals').limit(2000).get();
        const hits = snap.docs
            .map(d => ({ id: d.id, ...(d.data() as Record<string, unknown>) }))
            .filter((h) => {
                const name = String((h as { name?: string }).name || '').toLowerCase();
                return name.includes(q);
            })
            .slice(0, 20);

        return NextResponse.json({ ok: true, hits });
    } catch (e) {
        console.error('[hospitals/lookup] error', e);
        return NextResponse.json({ ok: false, errorCode: 'INTERNAL_ERROR' }, { status: 500 });
    }
}
