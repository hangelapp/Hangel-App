/**
 * POST /api/contracts/approve
 *
 * Body: { contractSlug, contractTitle, version, scrollCompleted, readSeconds, method }
 *
 * Kullanıcının bir sözleşme/politikayı onayladığını KVKK ispatı için kayıt altına alır.
 * Sunucu IP + cihaz + dil + ülke bilgilerini header'lardan toplar (client spoof edemez).
 * Değiştirilemez log: contractApprovals doc'u + SHA-256 hash.
 *
 * Auth: ID token zorunlu. Rate limit: 30/uid/dakika.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { checkRateLimit } from '@/lib/rate-limit';
import { FieldValue } from 'firebase-admin/firestore';
import crypto from 'crypto';

export const runtime = 'nodejs';

function getClientIp(req: NextRequest): string {
    const xff = req.headers.get('x-forwarded-for');
    if (xff) { const first = xff.split(',')[0]?.trim(); if (first) return first; }
    return req.headers.get('x-real-ip')?.trim() || 'unknown';
}

function parseUA(ua: string): { browser: string; os: string; device: string } {
    const l = ua.toLowerCase();
    let os = 'Bilinmiyor';
    if (/iphone|ipad|ipod/.test(l)) os = 'iOS';
    else if (/android/.test(l)) os = 'Android';
    else if (/mac os x|macintosh/.test(l)) os = 'macOS';
    else if (/windows/.test(l)) os = 'Windows';
    else if (/linux/.test(l)) os = 'Linux';
    let browser = 'Bilinmiyor';
    if (/edg\//.test(l)) browser = 'Edge';
    else if (/opr\/|opera/.test(l)) browser = 'Opera';
    else if (/firefox/.test(l)) browser = 'Firefox';
    else if (/samsungbrowser/.test(l)) browser = 'Samsung Internet';
    else if (/chrome/.test(l)) browser = 'Chrome';
    else if (/safari/.test(l)) browser = 'Safari';
    else if (/capacitor|hangel/.test(l)) browser = 'Hangel App';
    const device = /iphone|android.*mobile|mobile/.test(l) ? 'mobile' : /ipad|tablet/.test(l) ? 'tablet' : 'desktop';
    return { browser, os, device };
}

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization') || '';
        const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
        if (!idToken) return NextResponse.json({ ok: false, errorCode: 'UNAUTHENTICATED' }, { status: 401 });

        let decoded;
        try { decoded = await getAdminAuth().verifyIdToken(idToken); }
        catch { return NextResponse.json({ ok: false, errorCode: 'UNAUTHENTICATED' }, { status: 401 }); }
        const uid = decoded.uid;

        const limit = await checkRateLimit({ bucket: 'contract-approve', key: uid, limit: 30, windowMs: 60_000 });
        if (!limit.allowed) return NextResponse.json({ ok: false, errorCode: 'RATE_LIMITED' }, { status: 429 });

        const body = await req.json().catch(() => null);
        const contractSlug = typeof body?.contractSlug === 'string' ? body.contractSlug : '';
        const contractTitle = typeof body?.contractTitle === 'string' ? body.contractTitle : '';
        const version = typeof body?.version === 'string' ? body.version : '1.0';
        const scrollCompleted = Boolean(body?.scrollCompleted);
        const readSeconds = Number(body?.readSeconds) || 0;
        const method = typeof body?.method === 'string' ? body.method : 'button'; // button / popup / checkbox
        const decision = body?.decision === 'rejected' ? 'rejected' : 'approved'; // popup'ta X = rejected
        if (!contractSlug) return NextResponse.json({ ok: false, errorCode: 'INVALID_INPUT' }, { status: 400 });

        const ip = getClientIp(req);
        const ua = req.headers.get('user-agent') || '';
        const { browser, os, device } = parseUA(ua);
        const acceptLang = req.headers.get('accept-language') || '';
        const lang = acceptLang.split(',')[0]?.trim() || 'tr';
        const country = req.headers.get('x-vercel-ip-country') || req.headers.get('x-appengine-country') || null;

        // İsim
        const db = getAdminFirestore();
        let userName = decoded.name || '';
        let userType = 'user';
        try {
            const userSnap = await db.collection(COLLECTIONS.users).doc(uid).get();
            const ud = userSnap.data();
            if (ud) {
                userName = ud.name || userName;
                userType = ud.role || (ud.managedNgoId ? 'ngo-admin' : ud.managedBrandId ? 'brand-admin' : ud.managedClubId ? 'club-admin' : 'user');
            }
        } catch { /* noop */ }

        // İmmutable hash: uid + slug + version + timestamp
        const ts = Date.now();
        const hashInput = `${uid}|${contractSlug}|${version}|${ts}`;
        const hash = crypto.createHash('sha256').update(hashInput).digest('hex');
        const snapshotId = `${contractSlug}_v${version}_${ts.toString(36)}`;

        await db.collection(COLLECTIONS.contractApprovals).add({
            userId: uid,
            userName,
            userType,
            contractSlug,
            contractTitle,
            version,
            approvedAt: FieldValue.serverTimestamp(),
            ip,
            device,
            os,
            browser,
            lang,
            country,
            method,
            decision,
            scrollCompleted,
            readSeconds,
            hash,
            snapshotId,
        });

        return NextResponse.json({ ok: true, hash, snapshotId, decision });
    } catch (e) {
        console.error('[contracts/approve] internal error', e);
        return NextResponse.json({ ok: false, errorCode: 'INTERNAL_ERROR' }, { status: 500 });
    }
}
