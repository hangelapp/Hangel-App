/**
 * POST /api/notifications/trigger
 *
 * Body: { event: string, recipientUid: string, context?: Record<string, unknown> }
 *
 * Davranış:
 *   - Auth (signed-in)
 *   - Olay türüne göre push payload üretir + Firestore notifications doc yazar
 *   - Yalnızca caller'ın yetkili olduğu olaylar (NGO admin → kendi başvuranlarına,
 *     super-admin → tümü, user → sadece kendi kendine test). Olay başına validation.
 *
 * Desteklenen olaylar:
 *   - application.accepted: NGO admin → başvurana (recipientUid = applicant uid)
 *     context: { applicationId, ngoName, opportunityTitle }
 *   - application.rejected: NGO admin → başvurana
 *   - badge.earned: super-admin OR self → kullanıcıya
 *     context: { badgeName, badgeIcon }
 *   - event.created: NGO admin / super-admin → ilgili topluluğa (recipientUid = single user)
 *     context: { eventTitle, eventDate, eventId }
 *   - blood.emergency: super-admin → match eden kullanıcılara (her çağrı 1 user)
 *     context: { bloodType, city, requestId }
 *
 * Rate limit: 60 req/uid/dakika.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { sendPushToUser, type PushPayload } from '@/lib/push-notifications';
import { checkRateLimit } from '@/lib/rate-limit';
import { FieldValue } from 'firebase-admin/firestore';

export const runtime = 'nodejs';

interface TriggerContext {
    applicationId?: string;
    ngoName?: string;
    opportunityTitle?: string;
    badgeName?: string;
    badgeIcon?: string;
    eventTitle?: string;
    eventDate?: string;
    eventId?: string;
    bloodType?: string;
    city?: string;
    requestId?: string;
}

function buildPayloadAndPath(event: string, ctx: TriggerContext): { payload: PushPayload; notifData: Record<string, unknown> } | null {
    switch (event) {
        case 'application.accepted':
            return {
                payload: {
                    title: '🎉 Başvurun kabul edildi!',
                    body: `${ctx.ngoName || 'STK'}: "${ctx.opportunityTitle || 'Gönüllülük'}" başvurun kabul edildi.`,
                    clickAction: `/my-applications`,
                    data: { type: 'application_accepted', applicationId: ctx.applicationId || '' },
                },
                notifData: {
                    type: 'application_accepted',
                    title: 'Başvurun kabul edildi',
                    body: `${ctx.ngoName}: ${ctx.opportunityTitle}`,
                    applicationId: ctx.applicationId,
                },
            };
        case 'application.rejected':
            return {
                payload: {
                    title: 'Başvurun değerlendirildi',
                    body: `${ctx.ngoName || 'STK'}: "${ctx.opportunityTitle || 'Gönüllülük'}" başvurunla ilgili güncelleme var.`,
                    clickAction: `/my-applications`,
                    data: { type: 'application_rejected', applicationId: ctx.applicationId || '' },
                },
                notifData: {
                    type: 'application_rejected',
                    title: 'Başvurun değerlendirildi',
                    body: `${ctx.ngoName}: ${ctx.opportunityTitle}`,
                    applicationId: ctx.applicationId,
                },
            };
        case 'badge.earned':
            return {
                payload: {
                    title: `🏆 Yeni rozet: ${ctx.badgeName || 'Rozet'}`,
                    body: 'Profilinde görüntüle.',
                    clickAction: '/my-badges',
                    data: { type: 'badge_earned', badge: ctx.badgeName || '' },
                },
                notifData: {
                    type: 'badge_earned',
                    title: `Yeni rozet: ${ctx.badgeName}`,
                    body: 'Tebrikler!',
                    badge: ctx.badgeName,
                },
            };
        case 'event.created':
            return {
                payload: {
                    title: '📅 Yeni etkinlik',
                    body: `${ctx.eventTitle || 'Etkinlik'}${ctx.eventDate ? ` — ${ctx.eventDate}` : ''}`,
                    clickAction: ctx.eventId ? `/events/${ctx.eventId}` : '/events',
                    data: { type: 'event_created', eventId: ctx.eventId || '' },
                },
                notifData: {
                    type: 'event_created',
                    title: 'Yeni etkinlik',
                    body: ctx.eventTitle,
                    eventId: ctx.eventId,
                },
            };
        case 'blood.emergency':
            return {
                payload: {
                    title: `🩸 Acil kan ihtiyacı — ${ctx.bloodType || 'tüm gruplar'}`,
                    body: `${ctx.city || 'Yakınında'} acil kan bağışına ihtiyaç var.`,
                    // /emergency/{requestId} dinamik rotası YOK → 404 → iOS/Android WebView'de
                    // siyah ekran (notificationActionPerformed window.location.assign ile 404'e
                    // gidiyordu). requestId zaten data'da taşınıyor; var olan liste sayfasına yönlendir.
                    clickAction: '/emergency',
                    data: { type: 'blood_emergency', requestId: ctx.requestId || '', bloodType: ctx.bloodType || '' },
                },
                notifData: {
                    type: 'blood_emergency',
                    title: `Acil kan: ${ctx.bloodType}`,
                    body: `${ctx.city} — yakınında acil kan ihtiyacı`,
                    requestId: ctx.requestId,
                    bloodType: ctx.bloodType,
                },
            };
        default:
            return null;
    }
}

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization') || '';
        const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
        if (!idToken) {
            return NextResponse.json({ ok: false, errorCode: 'UNAUTHENTICATED' }, { status: 401 });
        }
        let caller: { uid: string; role?: string; managedNgoId?: string; managedBrandId?: string; managedClubId?: string };
        try {
            const decoded = await getAdminAuth().verifyIdToken(idToken);
            caller = decoded as typeof caller;
        } catch {
            return NextResponse.json({ ok: false, errorCode: 'UNAUTHENTICATED' }, { status: 401 });
        }

        const limit = await checkRateLimit({ bucket: 'notif-trigger', key: caller.uid, limit: 60, windowMs: 60_000 });
        if (!limit.allowed) {
            return NextResponse.json({ ok: false, errorCode: 'RATE_LIMITED' }, { status: 429 });
        }

        const body = await req.json().catch(() => null);
        const event = typeof body?.event === 'string' ? body.event : '';
        const recipientUid = typeof body?.recipientUid === 'string' ? body.recipientUid : '';
        const context = (body?.context && typeof body.context === 'object') ? body.context as TriggerContext : {};

        if (!event || !recipientUid) {
            return NextResponse.json({ ok: false, errorCode: 'INVALID_INPUT' }, { status: 400 });
        }

        // Authz: olay tipi başına farklı yetki kuralı
        const isSuperAdmin = caller.role === 'super-admin';
        const isNgoAdmin = !!caller.managedNgoId;
        const isSelf = recipientUid === caller.uid;

        const authorized =
            isSuperAdmin
            || (event === 'badge.earned' && isSelf)
            || ((event === 'application.accepted' || event === 'application.rejected') && isNgoAdmin)
            || (event === 'event.created' && (isNgoAdmin || caller.managedBrandId || caller.managedClubId))
            || (event === 'blood.emergency' && isSuperAdmin);

        if (!authorized) {
            return NextResponse.json({ ok: false, errorCode: 'FORBIDDEN' }, { status: 403 });
        }

        const built = buildPayloadAndPath(event, context);
        if (!built) {
            return NextResponse.json({ ok: false, errorCode: 'UNKNOWN_EVENT' }, { status: 400 });
        }

        // Firestore notifications doc + push paralel
        const db = getAdminFirestore();
        const [pushResult] = await Promise.all([
            sendPushToUser(recipientUid, built.payload),
            db.collection(COLLECTIONS.notifications).add({
                userId: recipientUid,
                ...built.notifData,
                read: false,
                pushSent: true, // inline push paralelde — Cloud Function tekrar göndermesin
                createdAt: FieldValue.serverTimestamp(),
                createdBy: caller.uid,
            }).catch(e => {
                // Notification doc fail etse bile push tetikleyici devam etsin
                console.warn('[notif/trigger] notification doc create failed', e);
                return null;
            }),
        ]);

        return NextResponse.json({ ok: true, push: pushResult });
    } catch (e) {
        console.error('[notifications/trigger] internal error', e);
        return NextResponse.json({ ok: false, errorCode: 'INTERNAL_ERROR' }, { status: 500 });
    }
}
