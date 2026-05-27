/**
 * POST /api/notifications/test-self
 *
 * Auth'lu kullanıcının kendi cihazlarına test push gönderir. Settings sayfasından
 * "Test bildirimi gönder" butonu için. Rate limit: 5 req/uid/dakika.
 *
 * Why: FCM token kayıtlı mı, service worker doğru mu, push çalışıyor mu —
 * kullanıcı kendi setup'ını test edebilmeli.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase-admin';
import { sendPushToUser } from '@/lib/push-notifications';
import { checkRateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization') || '';
        const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
        if (!idToken) {
            return NextResponse.json({ ok: false, errorCode: 'UNAUTHENTICATED' }, { status: 401 });
        }
        let uid: string;
        try {
            const decoded = await getAdminAuth().verifyIdToken(idToken);
            uid = decoded.uid;
        } catch {
            return NextResponse.json({ ok: false, errorCode: 'UNAUTHENTICATED' }, { status: 401 });
        }

        const limit = await checkRateLimit({ bucket: 'notif-test-self', key: uid, limit: 5, windowMs: 60_000 });
        if (!limit.allowed) {
            return NextResponse.json({ ok: false, errorCode: 'RATE_LIMITED', message: 'Çok fazla test isteği. 1 dakika bekleyin.' }, { status: 429 });
        }

        const result = await sendPushToUser(uid, {
            title: '🔔 hangel test bildirimi',
            body: 'Push bildirimi cihazına başarıyla ulaştı.',
            clickAction: '/settings/notifications',
            data: { type: 'test', timestamp: String(Date.now()) },
        });

        // ok: true ile result'ın ok'unu override etme (result.ok zaten true ise),
        // failure varsa client görsün
        return NextResponse.json({
            ok: result.ok,
            successCount: result.successCount,
            failureCount: result.failureCount,
            removedTokens: result.removedTokens,
            errorMessages: result.errorMessages,
        });
    } catch (e) {
        console.error('[notifications/test-self] internal error', e);
        return NextResponse.json({ ok: false, errorCode: 'INTERNAL_ERROR' }, { status: 500 });
    }
}
