/**
 * POST /api/notifications/send
 *
 * Body: { uid?: string, uids?: string[], title: string, body: string,
 *         icon?: string, imageUrl?: string, clickAction?: string,
 *         data?: Record<string,string> }
 *
 * Auth: super-admin custom claim zorunlu. Diğer endpoint'lerden çağrılacaksa
 * (örn. internal worker) ayrı service-account token / shared secret kullanılır.
 *
 * Rate limit: 60 req/IP/dakika (admin tarafı genelde batch gönderir).
 *
 * Why: Bu endpoint sayesinde herhangi bir admin/Cloud Function/cron iş notification
 * tetikleyebilir. Native FCM admin SDK kullanır → bedava (FCM ücretsiz).
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase-admin';
import { sendPushToUser, sendPushToUsers, type PushPayload } from '@/lib/push-notifications';
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
        const ipLimit = await checkRateLimit({ bucket: 'notif-send-ip', key: ip, limit: 60, windowMs: 60_000 });
        if (!ipLimit.allowed) {
            return NextResponse.json({ ok: false, errorCode: 'RATE_LIMITED' }, { status: 429 });
        }

        // Auth: super-admin custom claim zorunlu
        const authHeader = req.headers.get('authorization') || '';
        const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
        if (!idToken) {
            return NextResponse.json({ ok: false, errorCode: 'UNAUTHENTICATED' }, { status: 401 });
        }
        let decodedToken: { uid: string; role?: string; superAdminPermissions?: unknown };
        try {
            decodedToken = await getAdminAuth().verifyIdToken(idToken) as typeof decodedToken;
        } catch {
            return NextResponse.json({ ok: false, errorCode: 'UNAUTHENTICATED' }, { status: 401 });
        }
        const isSuperAdmin = decodedToken.role === 'super-admin' || !!decodedToken.superAdminPermissions;
        if (!isSuperAdmin) {
            return NextResponse.json({ ok: false, errorCode: 'FORBIDDEN' }, { status: 403 });
        }

        const body = await req.json().catch(() => null);
        const uid = typeof body?.uid === 'string' ? body.uid : '';
        const uids = Array.isArray(body?.uids) ? body.uids.filter((u: unknown) => typeof u === 'string') : [];
        const title = typeof body?.title === 'string' ? body.title.trim() : '';
        const text = typeof body?.body === 'string' ? body.body.trim() : '';

        if (!title || !text) {
            return NextResponse.json({ ok: false, errorCode: 'INVALID_INPUT', message: 'title ve body zorunlu' }, { status: 400 });
        }
        if (!uid && uids.length === 0) {
            return NextResponse.json({ ok: false, errorCode: 'INVALID_INPUT', message: 'uid veya uids gerekli' }, { status: 400 });
        }

        const payload: PushPayload = {
            title,
            body: text,
            icon: typeof body?.icon === 'string' ? body.icon : undefined,
            imageUrl: typeof body?.imageUrl === 'string' ? body.imageUrl : undefined,
            clickAction: typeof body?.clickAction === 'string' ? body.clickAction : undefined,
            data: typeof body?.data === 'object' && body?.data ? body.data as Record<string, string> : undefined,
        };

        if (uid) {
            const result = await sendPushToUser(uid, payload);
            return NextResponse.json({ ok: true, single: result });
        }
        const multiResult = await sendPushToUsers(uids, payload);
        const aggSuccess = Object.values(multiResult.perUser).reduce((a, r) => a + r.successCount, 0);
        const aggFailure = Object.values(multiResult.perUser).reduce((a, r) => a + r.failureCount, 0);
        return NextResponse.json({
            ok: true,
            totalUsers: uids.length,
            successCount: aggSuccess,
            failureCount: aggFailure,
            perUser: multiResult.perUser,
        });
    } catch (e) {
        console.error('[notifications/send] internal error', e);
        return NextResponse.json({ ok: false, errorCode: 'INTERNAL_ERROR' }, { status: 500 });
    }
}
