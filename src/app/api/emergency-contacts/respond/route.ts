/**
 * POST /api/emergency-contacts/respond
 *
 * Acil durum kişisi daveti alan kişi Kabul/Ret eder. Yalnız DAVET EDİLEN kişi
 * (bildirimin userId'si) yanıtlayabilir. Kabul → davet EDENin acil kişi kaydına
 * bu kişinin AD + hangel PUANI yazılır (KVKK: paylaşım yalnız açık rıza ile).
 *
 * Body: { requestId: string, accept: boolean }
 * Yanıt: { ok: true, status: 'accepted' | 'rejected' }
 * Hata:  { errorCode, message }
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { sendPushToUser } from '@/lib/push-notifications';
import { checkRateLimit } from '@/lib/rate-limit';
import { FieldValue } from 'firebase-admin/firestore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function resolveName(d: Record<string, unknown> | undefined): string {
    if (!d) return '';
    const personal = (d.personalInfo as { fullName?: string; firstName?: string; lastName?: string } | undefined) || {};
    const firstName = typeof d.firstName === 'string' ? d.firstName : (personal.firstName || '');
    const lastName = typeof d.lastName === 'string' ? d.lastName : (personal.lastName || '');
    return (
        (personal.fullName || '').trim() ||
        (typeof d.fullName === 'string' ? d.fullName : '').trim() ||
        (typeof d.name === 'string' ? d.name : '').trim() ||
        (typeof d.displayName === 'string' ? d.displayName : '').trim() ||
        `${firstName} ${lastName}`.trim()
    );
}

export async function POST(req: NextRequest) {
    // Rate-limit: birinin başkasının davet requestId'sini brute-force denemesini önle.
    const ip = (req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()) || req.headers.get('x-real-ip')?.trim() || 'unknown';
    const rl = await checkRateLimit({ bucket: 'emg-contact-respond-ip', key: ip, limit: 30, windowMs: 60_000 });
    if (!rl.allowed) {
        return NextResponse.json({ errorCode: 'RATE_LIMITED', message: 'Çok fazla deneme. Biraz sonra tekrar deneyin.' }, { status: 429 });
    }

    const authHeader = req.headers.get('authorization') || '';
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!idToken) {
        return NextResponse.json({ errorCode: 'UNAUTHENTICATED', message: 'Oturum açmanız gerekiyor.' }, { status: 401 });
    }
    let responderUid: string;
    try {
        responderUid = (await getAdminAuth().verifyIdToken(idToken)).uid;
    } catch {
        return NextResponse.json({ errorCode: 'UNAUTHENTICATED', message: 'Oturum doğrulanamadı.' }, { status: 401 });
    }

    let body: { requestId?: unknown; accept?: unknown };
    try { body = await req.json() as typeof body; }
    catch { return NextResponse.json({ errorCode: 'BAD_BODY', message: 'Geçersiz istek.' }, { status: 400 }); }

    const requestId = typeof body?.requestId === 'string' ? body.requestId : '';
    const accept = body?.accept === true;
    if (!requestId) {
        return NextResponse.json({ errorCode: 'INVALID_INPUT', message: 'requestId gerekli.' }, { status: 400 });
    }

    try {
        const db = getAdminFirestore();
        const notifRef = db.collection(COLLECTIONS.notifications).doc(requestId);
        const notifSnap = await notifRef.get();
        if (!notifSnap.exists) {
            return NextResponse.json({ errorCode: 'NOT_FOUND', message: 'Davet bulunamadı.' }, { status: 404 });
        }
        const notif = notifSnap.data() as { userId?: string; type?: string; data?: { inviterUid?: string }; responseStatus?: string };
        // Yalnız davet edilen kişi yanıtlayabilir.
        if (notif.userId !== responderUid || notif.type !== 'emergency-contact-invite') {
            return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Bu daveti yanıtlama yetkiniz yok.' }, { status: 403 });
        }
        // Zaten yanıtlanmışsa idempotent dön.
        if (notif.responseStatus === 'accepted' || notif.responseStatus === 'rejected') {
            return NextResponse.json({ ok: true, status: notif.responseStatus });
        }
        const inviterUid = notif.data?.inviterUid || '';
        if (!inviterUid) {
            return NextResponse.json({ errorCode: 'INVALID_STATE', message: 'Davet eden bilgisi eksik.' }, { status: 400 });
        }

        // Bildirimi yanıtlandı olarak işaretle.
        await notifRef.update({
            read: true,
            responseStatus: accept ? 'accepted' : 'rejected',
            respondedAt: FieldValue.serverTimestamp(),
        });

        if (!accept) {
            // Ret: davet edenin kaydını 'rejected' yap (varsa), ad/puan yazma.
            await patchInviterContact(db, inviterUid, responderUid, { status: 'rejected' });
            return NextResponse.json({ ok: true, status: 'rejected' });
        }

        // Kabul: yanıtlayanın adı + puanını al, davet edenin acil kişi kaydına yaz.
        const responderDoc = await db.collection(COLLECTIONS.users).doc(responderUid).get();
        const rd = responderDoc.data() as Record<string, unknown> | undefined;
        const name = resolveName(rd);
        const impactScore = typeof rd?.impactScore === 'number' ? rd.impactScore as number : 0;
        await patchInviterContact(db, inviterUid, responderUid, { status: 'accepted', name, impactScore });

        // Davet edene "kabul edildi" bildirimi (best-effort).
        try {
            await db.collection(COLLECTIONS.notifications).add({
                userId: inviterUid,
                type: 'emergency-contact-accepted',
                title: '🧡 Acil durum kişin onayladı',
                body: `${name || 'Davet ettiğin kişi'} acil durum kişisi davetini kabul etti.`,
                data: { link: '/settings/volunteer' },
                read: false,
                createdAt: FieldValue.serverTimestamp(),
                createdBy: 'emergency-contact-system',
            });
            await sendPushToUser(inviterUid, {
                title: '🧡 Acil durum kişin onayladı',
                body: `${name || 'Davet ettiğin kişi'} daveti kabul etti.`,
                clickAction: '/settings/volunteer',
            });
        } catch { /* best-effort */ }

        return NextResponse.json({ ok: true, status: 'accepted' });
    } catch (e) {
        console.error('[emergency-contacts/respond] internal error', e);
        return NextResponse.json({ errorCode: 'INTERNAL_ERROR', message: 'Beklenmeyen hata.' }, { status: 500 });
    }
}

/**
 * Davet edenin volunteerInfo.emergency.emergencyContacts dizisinde, telefonu bu
 * responder'a ait kaydı bul ve güncelle. Eşleşme uid ile yapılır (davet
 * gönderilirken kayda uid yazılmış olmalı; yoksa hiçbir şey yapma).
 */
async function patchInviterContact(
    db: FirebaseFirestore.Firestore,
    inviterUid: string,
    responderUid: string,
    patch: { status: 'accepted' | 'rejected'; name?: string; impactScore?: number },
): Promise<void> {
    const ref = db.collection(COLLECTIONS.users).doc(inviterUid);
    await db.runTransaction(async (tx) => {
        const snap = await tx.get(ref);
        if (!snap.exists) return;
        const data = snap.data() as Record<string, unknown>;
        const vi = (data.volunteerInfo as Record<string, unknown>) || {};
        const emg = (vi.emergency as Record<string, unknown>) || {};
        const contacts = Array.isArray(emg.emergencyContacts) ? [...(emg.emergencyContacts as Record<string, unknown>[])] : [];
        let changed = false;
        for (let i = 0; i < contacts.length; i++) {
            if (contacts[i]?.uid === responderUid && contacts[i]?.status === 'pending') {
                contacts[i] = {
                    ...contacts[i],
                    status: patch.status,
                    ...(patch.name !== undefined ? { name: patch.name } : {}),
                    ...(patch.impactScore !== undefined ? { impactScore: patch.impactScore } : {}),
                };
                changed = true;
            }
        }
        if (!changed) return;
        tx.update(ref, { 'volunteerInfo.emergency.emergencyContacts': contacts });
    });
}
