/**
 * POST /api/users/check-uniqueness
 *
 * Body: { field: 'phone' | 'email', value: string, excludeUid?: string }
 *
 * Davranış:
 *   - Admin SDK ile users koleksiyonunda personalInfo.phone / personalInfo.email
 *     için duplicate var mı kontrol eder
 *   - excludeUid varsa o doc'u dışlar (kendi profilini güncellerken yararlı)
 *   - Sadece "available: boolean" döner (existence'ı sızdırmamak için detay yok)
 *
 * Auth: imzalı kullanıcı zorunlu. Rate limit: 30 req/IP/dakika.
 *
 * Why: Firestore client-side query'lerde users.read = isSignedIn açık olduğu için
 * kötü niyetli biri istediği telefon/email'in var olup olmadığını test edebilirdi
 * (PII enumeration). Server-side check + rate limit ile bu kapatıldı.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
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

export async function POST(req: NextRequest) {
    try {
        const ip = getClientIp(req);
        const ipLimit = await checkRateLimit({ bucket: 'user-uniq-check-ip', key: ip, limit: 30, windowMs: 60_000 });
        if (!ipLimit.allowed) {
            return NextResponse.json(
                { ok: false, errorCode: 'RATE_LIMITED', message: 'Çok fazla istek.' },
                { status: 429 }
            );
        }

        // Auth: ID token zorunlu
        const authHeader = req.headers.get('authorization') || '';
        const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
        if (!idToken) {
            return NextResponse.json({ ok: false, errorCode: 'UNAUTHENTICATED', message: 'Giriş gerekli.' }, { status: 401 });
        }
        let callerUid: string;
        try {
            const decoded = await getAdminAuth().verifyIdToken(idToken);
            callerUid = decoded.uid;
        } catch {
            return NextResponse.json({ ok: false, errorCode: 'UNAUTHENTICATED', message: 'Geçersiz token.' }, { status: 401 });
        }

        const body = await req.json().catch(() => null);
        const field = body?.field;
        const value = typeof body?.value === 'string' ? body.value.trim() : '';
        const excludeUid = typeof body?.excludeUid === 'string' ? body.excludeUid : callerUid;

        if (!['phone', 'email'].includes(field) || !value) {
            return NextResponse.json({ ok: false, errorCode: 'INVALID_INPUT', message: 'Geçersiz giriş.' }, { status: 400 });
        }

        const db = getAdminFirestore();
        const fieldPath = `personalInfo.${field}`;
        const normalizedValue = field === 'email' ? value.toLowerCase() : value.replace(/\D/g, '');

        const snap = await db.collection(COLLECTIONS.users)
            .where(fieldPath, '==', normalizedValue)
            .limit(2)
            .get();

        // available = excludeUid dışında matching doc yok
        const conflicting = snap.docs.find(d => d.id !== excludeUid);
        return NextResponse.json({ ok: true, available: !conflicting });
    } catch (e) {
        console.error('[user-uniq-check] internal error', e);
        return NextResponse.json({ ok: false, errorCode: 'INTERNAL_ERROR', message: 'Sunucu hatası.' }, { status: 500 });
    }
}
