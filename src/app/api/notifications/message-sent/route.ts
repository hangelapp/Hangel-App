/**
 * POST /api/notifications/message-sent
 *
 * Body: { messageId: string }
 *
 * Davranış:
 *  1. Auth (signed-in user)
 *  2. messages/{messageId} doc'unu oku
 *  3. senderId === request.auth.uid kontrolü (spoof engeli)
 *  4. recipientId'ye push notification gönder
 *  5. notification doc client tarafından zaten yazıldı; bu endpoint sadece push'u tetikler
 *
 * Why: Generic /api/notifications/send super-admin only. Mesaj akışında her
 * kullanıcının kendi gönderdiği mesaj için karşı tarafa push tetikleyebilmesi
 * gerek. Bu endpoint sender doğrulamasıyla bu yetkiyi sağlar.
 *
 * Rate limit: 30 req/IP/dakika.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { FieldValue } from 'firebase-admin/firestore';
import { sendPushToUser } from '@/lib/push-notifications';
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
        const ipLimit = await checkRateLimit({ bucket: 'msg-push-ip', key: ip, limit: 30, windowMs: 60_000 });
        if (!ipLimit.allowed) {
            return NextResponse.json({ ok: false, errorCode: 'RATE_LIMITED' }, { status: 429 });
        }

        const authHeader = req.headers.get('authorization') || '';
        const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
        if (!idToken) {
            return NextResponse.json({ ok: false, errorCode: 'UNAUTHENTICATED' }, { status: 401 });
        }
        let callerUid: string;
        try {
            const decoded = await getAdminAuth().verifyIdToken(idToken);
            callerUid = decoded.uid;
        } catch {
            return NextResponse.json({ ok: false, errorCode: 'UNAUTHENTICATED' }, { status: 401 });
        }

        const body = await req.json().catch(() => null);
        const messageId = typeof body?.messageId === 'string' ? body.messageId : '';
        if (!messageId) {
            return NextResponse.json({ ok: false, errorCode: 'INVALID_INPUT' }, { status: 400 });
        }

        const db = getAdminFirestore();
        const msgSnap = await db.collection(COLLECTIONS.messages).doc(messageId).get();
        if (!msgSnap.exists) {
            return NextResponse.json({ ok: false, errorCode: 'MESSAGE_NOT_FOUND' }, { status: 404 });
        }
        const msg = msgSnap.data() as {
            senderId?: string;
            recipientId?: string;
            sender?: { name?: string; avatarUrl?: string };
            subject?: string;
            content?: string;
        };

        if (msg.senderId !== callerUid) {
            return NextResponse.json({ ok: false, errorCode: 'NOT_SENDER' }, { status: 403 });
        }
        if (!msg.recipientId) {
            return NextResponse.json({ ok: false, errorCode: 'NO_RECIPIENT' }, { status: 400 });
        }

        // Recipient bir entity (NGO/brand/club) olabilir; o zaman entity admin'ine yönlendir
        let targetUid = msg.recipientId;
        const possibleEntities = [
            { col: COLLECTIONS.ngos, field: 'adminUserId', managedField: 'managedNgoId' as const },
            { col: COLLECTIONS.brands, field: 'adminUserId', managedField: 'managedBrandId' as const },
            { col: COLLECTIONS.clubs, field: 'adminUserId', managedField: 'managedClubId' as const },
        ];
        for (const ent of possibleEntities) {
            const entSnap = await db.collection(ent.col).doc(msg.recipientId).get();
            if (entSnap.exists) {
                const data = entSnap.data() as Record<string, unknown>;
                if (typeof data[ent.field] === 'string' && (data[ent.field] as string)) {
                    targetUid = data[ent.field] as string;
                    break;
                }
                // Fallback: managedNgoId/managedBrandId/managedClubId üzerinden bul
                const usersSnap = await db.collection(COLLECTIONS.users)
                    .where(ent.managedField, '==', msg.recipientId)
                    .limit(1)
                    .get();
                if (!usersSnap.empty) {
                    targetUid = usersSnap.docs[0].id;
                    break;
                }
            }
        }

        const senderName = msg.sender?.name || 'Bir kullanıcı';
        const preview = (msg.content || '').slice(0, 100);

        // Gelen mesaj → notifications koleksiyonuna düşsün (bildirim sayfasında görünür,
        // tıklayınca /messages'a yönlendirir). pushSent: true → Cloud Function tekrar
        // push göndermesin (inline push aşağıda).
        await db.collection(COLLECTIONS.notifications).add({
            userId: targetUid,
            type: 'message',
            title: `💬 ${senderName}`,
            body: msg.subject ? `${msg.subject}: ${preview}` : preview,
            data: { messageId, senderId: callerUid, link: '/messages' },
            read: false,
            pushSent: true,
            createdAt: FieldValue.serverTimestamp(),
            createdBy: callerUid,
        }).catch((e) => { console.warn('[message-sent] notif doc failed', e); });

        const pushResult = await sendPushToUser(targetUid, {
            title: `💬 ${senderName}`,
            body: msg.subject ? `${msg.subject}: ${preview}` : preview,
            icon: msg.sender?.avatarUrl,
            clickAction: '/messages',
            data: {
                type: 'message',
                messageId,
                senderId: callerUid,
            },
        });

        return NextResponse.json({ ok: true, push: pushResult });
    } catch (e) {
        console.error('[notifications/message-sent] internal error', e);
        return NextResponse.json({ ok: false, errorCode: 'INTERNAL_ERROR' }, { status: 500 });
    }
}
