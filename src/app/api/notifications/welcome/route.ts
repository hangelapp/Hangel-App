/**
 * POST /api/notifications/welcome
 *
 * Body: { uid: string, isCorporate?: boolean, entityType?: 'BRAND'|'NGO'|'CLUB' }
 *
 * Yeni kayıt olan kullanıcıya:
 *   1. notifications doc (Gelen Kutusu badge için)
 *   2. messages doc (Gelen Kutusu sayfasında "Hangel Resmi"nden gelen mesaj)
 *   3. Push notification (cihazda kayıtlı FCM token varsa)
 *
 * Auth: ID token zorunlu, callerUid === body.uid (kullanıcı kendi kaydından
 * sonra çağırır). Sunucu Admin SDK ile mesaj yazar — system senderId
 * (HANGEL_SYSTEM_UID) için rules bypass edilir (Admin SDK rules'ı bypass eder).
 *
 * Rate limit: 5 req/uid/dakika (kayıt sonrası 1-2 kere çağrılır normalde).
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { sendPushToUser } from '@/lib/push-notifications';
import { checkRateLimit } from '@/lib/rate-limit';
import { FieldValue } from 'firebase-admin/firestore';

export const runtime = 'nodejs';

const HANGEL_SYSTEM_UID = 'hangel-system';
const HANGEL_SYSTEM_NAME = 'Hangel Resmi';
const HANGEL_SYSTEM_AVATAR = ''; // Logo URL eklenebilir (apphosting public dosyası)

const WELCOME_MESSAGE_TR =
    'Merhaba hangel\'e hoş geldin. Sosyal sorunlar ile mücadele edenleri yalnız bırakmamak adına hangel\'a katıldığın için minnettarız. Bundan böyle kollektif bilinçle birlikte mücadele edeceğiz. #wearehangel';

const WELCOME_MESSAGE_CORPORATE_TR =
    'Merhaba, hangel ailesine hoş geldiniz. Sosyal sorunlar ile mücadele edenleri yalnız bırakmamak adına hangel\'a katıldığınız için minnettarız. Bundan böyle kollektif bilinçle birlikte mücadele edeceğiz. #wearehangel';

export async function POST(req: NextRequest) {
    try {
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
        const uid = typeof body?.uid === 'string' ? body.uid : '';
        const isCorporate = Boolean(body?.isCorporate);

        if (!uid) {
            return NextResponse.json({ ok: false, errorCode: 'INVALID_INPUT' }, { status: 400 });
        }
        // Caller ya kendi UID'siyle ya da super-admin olarak çağırabilir
        if (uid !== callerUid) {
            try {
                const userSnap = await getAdminFirestore().collection(COLLECTIONS.users).doc(callerUid).get();
                if (userSnap.data()?.role !== 'super-admin') {
                    return NextResponse.json({ ok: false, errorCode: 'FORBIDDEN' }, { status: 403 });
                }
            } catch {
                return NextResponse.json({ ok: false, errorCode: 'FORBIDDEN' }, { status: 403 });
            }
        }

        const limit = await checkRateLimit({ bucket: 'welcome-msg', key: uid, limit: 5, windowMs: 60_000 });
        if (!limit.allowed) {
            return NextResponse.json({ ok: false, errorCode: 'RATE_LIMITED' }, { status: 429 });
        }

        const db = getAdminFirestore();
        const messageText = isCorporate ? WELCOME_MESSAGE_CORPORATE_TR : WELCOME_MESSAGE_TR;
        const subject = isCorporate ? 'hangel ailesine hoş geldiniz' : 'hangel\'e hoş geldin';

        // 1) Gelen Kutusu mesajı (messages collection)
        // Admin SDK rules bypass eder → senderId = HANGEL_SYSTEM_UID
        await db.collection(COLLECTIONS.messages).add({
            sender: { id: HANGEL_SYSTEM_UID, name: HANGEL_SYSTEM_NAME, avatarUrl: HANGEL_SYSTEM_AVATAR },
            senderId: HANGEL_SYSTEM_UID,
            senderType: 'system',
            recipient: { id: uid, name: '', avatarUrl: '' },
            recipientId: uid,
            subject,
            content: messageText,
            timestamp: FieldValue.serverTimestamp(),
            status: 'sent',
            isWelcome: true,
        });

        // 2) Notifications collection — badge için
        await db.collection(COLLECTIONS.notifications).add({
            userId: uid,
            type: 'welcome',
            title: subject,
            body: messageText.slice(0, 120),
            read: false,
            pushSent: true, // inline push aşağıda — Cloud Function tekrar göndermesin
            createdAt: FieldValue.serverTimestamp(),
            createdBy: HANGEL_SYSTEM_UID,
        });

        // 3) Push notification (best-effort)
        try {
            await sendPushToUser(uid, {
                title: subject,
                body: messageText.slice(0, 100),
                clickAction: '/messages',
                data: { type: 'welcome' },
            });
        } catch (e) {
            console.warn('[welcome] push failed', e);
        }

        return NextResponse.json({ ok: true });
    } catch (e) {
        console.error('[notifications/welcome] internal error', e);
        return NextResponse.json({ ok: false, errorCode: 'INTERNAL_ERROR' }, { status: 500 });
    }
}
