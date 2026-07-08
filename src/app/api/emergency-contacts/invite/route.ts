/**
 * POST /api/emergency-contacts/invite
 *
 * Kullanıcı, acil durum kişisi olarak eklemek istediği bir TELEFON girer.
 * Bu telefon bir hangel üyesine aitse, O ÜYEYE bir "acil kişi daveti" bildirimi
 * gönderilir (Kabul et / Reddet aksiyonlu). KVKK: davet edilen kişinin adı/puanı
 * SADECE o kişi kabul edince davet edene açılır — bu endpoint yalnızca "üye mi"
 * bilgisini ve davet gönderildi durumunu döner, ad/puan SIZDIRMAZ.
 *
 * Body: { phone: string }
 * Yanıt: { found: boolean, invited: boolean, requestId?: string }
 *        found=false → telefon hangel üyesi değil (davet gönderilmez; UI kullanıcıya
 *        "bu kişi hangel üyesi değil, adını elle gir" der).
 * Hata:  { errorCode, message }
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { canonicalPhone, phoneMatchCandidates, toE164 } from '@/lib/phone-normalize';
import { sendPushToUser } from '@/lib/push-notifications';
import { checkRateLimit } from '@/lib/rate-limit';
import { FieldValue } from 'firebase-admin/firestore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getClientIp(req: NextRequest): string {
    const xff = req.headers.get('x-forwarded-for');
    if (xff) { const f = xff.split(',')[0]?.trim(); if (f) return f; }
    return req.headers.get('x-real-ip')?.trim() || 'unknown';
}

/** users doc'undan görünen adı çöz (lookup-by-phone ile aynı sıra). */
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
    // Rate limit: kötüye kullanımı (rehber tarama) engelle — kullanıcı başına dar.
    const ip = getClientIp(req);
    const ipLimit = await checkRateLimit({ bucket: 'emg-contact-invite-ip', key: ip, limit: 20, windowMs: 60_000 });
    if (!ipLimit.allowed) {
        return NextResponse.json({ errorCode: 'RATE_LIMITED', message: 'Çok fazla deneme. Biraz sonra tekrar deneyin.' }, { status: 429 });
    }

    // Auth: davet eden giriş yapmış olmalı.
    const authHeader = req.headers.get('authorization') || '';
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!idToken) {
        return NextResponse.json({ errorCode: 'UNAUTHENTICATED', message: 'Oturum açmanız gerekiyor.' }, { status: 401 });
    }
    let inviter: { uid: string; name?: string };
    try {
        const decoded = await getAdminAuth().verifyIdToken(idToken);
        inviter = { uid: decoded.uid };
    } catch {
        return NextResponse.json({ errorCode: 'UNAUTHENTICATED', message: 'Oturum doğrulanamadı.' }, { status: 401 });
    }

    let body: { phone?: unknown };
    try { body = (await req.json()) as { phone?: unknown }; }
    catch { return NextResponse.json({ errorCode: 'BAD_BODY', message: 'Geçersiz istek.' }, { status: 400 }); }

    const rawPhone = typeof body?.phone === 'string' ? body.phone : '';
    const canonical = canonicalPhone(rawPhone, '+90');
    if (!canonical || canonical.length < 7) {
        return NextResponse.json({ errorCode: 'INVALID_PHONE', message: 'Geçerli bir telefon girin.' }, { status: 400 });
    }

    try {
        const auth = getAdminAuth();
        const db = getAdminFirestore();

        // Hedef kullanıcıyı bul (Auth phone → Firestore fallback).
        let targetUid = '';
        const e164 = toE164(rawPhone, '+90');
        if (e164) {
            try { targetUid = (await auth.getUserByPhoneNumber(e164)).uid; } catch { /* Firestore'a düş */ }
        }
        if (!targetUid) {
            const candidates = phoneMatchCandidates(rawPhone, '+90');
            if (candidates.length > 0) {
                const [byPhone, byPersonal] = await Promise.all([
                    db.collection(COLLECTIONS.users).where('phone', 'in', candidates).limit(1).get().catch(() => null),
                    db.collection(COLLECTIONS.users).where('personalInfo.phone', 'in', candidates).limit(1).get().catch(() => null),
                ]);
                const doc = (byPhone && !byPhone.empty ? byPhone.docs[0] : null) || (byPersonal && !byPersonal.empty ? byPersonal.docs[0] : null);
                if (doc) targetUid = doc.id;
            }
        }

        // Üye değil → davet gönderme; UI adı elle girmeye düşer.
        if (!targetUid) {
            return NextResponse.json({ found: false, invited: false });
        }
        // Kendini davet etme.
        if (targetUid === inviter.uid) {
            return NextResponse.json({ errorCode: 'SELF_INVITE', message: 'Kendinizi acil durum kişisi olarak ekleyemezsiniz.' }, { status: 400 });
        }

        // Davet edenin adını al (bildirimde "X seni ekledi" demek için).
        try {
            const inviterDoc = await db.collection(COLLECTIONS.users).doc(inviter.uid).get();
            inviter.name = resolveName(inviterDoc.data() as Record<string, unknown> | undefined) || 'Bir hangel üyesi';
        } catch { inviter.name = 'Bir hangel üyesi'; }

        // Kabul/ret bildirimi yaz (aksiyonlu). requestId = notification doc id.
        const notifRef = db.collection(COLLECTIONS.notifications).doc();
        await notifRef.set({
            userId: targetUid,
            type: 'emergency-contact-invite',
            title: '🧡 Acil durum kişisi daveti',
            body: `${inviter.name} seni acil durum kişisi olarak eklemek istiyor. Kabul edersen adın ve hangel puanın onunla paylaşılır.`,
            data: {
                requestId: notifRef.id,
                inviterUid: inviter.uid,
                inviterName: inviter.name,
                action: 'emergency-contact-invite',
            },
            read: false,
            createdAt: FieldValue.serverTimestamp(),
            createdBy: 'emergency-contact-system',
        });

        // Push (best-effort; FCM ücretsiz).
        try {
            await sendPushToUser(targetUid, {
                title: '🧡 Acil durum kişisi daveti',
                body: `${inviter.name} seni acil durum kişisi olarak eklemek istiyor.`,
                clickAction: '/notifications',
                data: { requestId: notifRef.id, action: 'emergency-contact-invite' },
            });
        } catch { /* push başarısız olsa da bildirim Firestore'da duruyor */ }

        // uid UI'a döner → davet edenin kaydına yazılır; respond endpoint'i bu
        // uid ile doğru kaydı bulup ad+puan yazar. (uid PII değil, opak kimlik.)
        return NextResponse.json({ found: true, invited: true, requestId: notifRef.id, uid: targetUid });
    } catch (e) {
        console.error('[emergency-contacts/invite] internal error', e);
        return NextResponse.json({ errorCode: 'INTERNAL_ERROR', message: 'Beklenmeyen hata.' }, { status: 500 });
    }
}
