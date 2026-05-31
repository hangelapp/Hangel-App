/**
 * GET /api/auth/whatsapp/verify-link?t=TOKEN
 *
 * Davranış:
 * 1. login_links/{token} oku
 * 2. expiresAt geçti / used=true ise 410
 * 3. Firebase user'ı oluştur veya getir (phone ile)
 * 4. users/{uid} doc'unu set (name + phone)
 * 5. Custom token üret
 * 6. used=true işaretle, doc'u sil
 * 7. JSON { ok, customToken } dön — client signInWithCustomToken
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { FieldValue } from 'firebase-admin/firestore';
import { checkRateLimit } from '@/lib/rate-limit';
import { phoneMatchCandidates, canonicalPhone } from '@/lib/phone-normalize';

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
        const ipLimit = await checkRateLimit({ bucket: 'wa-link-verify-ip', key: ip, limit: 20, windowMs: 60_000 });
        if (!ipLimit.allowed) {
            return NextResponse.json(
                { ok: false, errorCode: 'RATE_LIMITED', message: 'Çok fazla istek, lütfen bekleyin.' },
                { status: 429 }
            );
        }
        const token = req.nextUrl.searchParams.get('t');
        if (!token || token.length < 30) {
            return NextResponse.json({ ok: false, errorCode: 'INVALID_TOKEN', message: 'Geçersiz bağlantı.' }, { status: 400 });
        }

        const db = getAdminFirestore();
        const ref = db.collection(COLLECTIONS.loginLinks).doc(token);
        const snap = await ref.get();
        if (!snap.exists) {
            return NextResponse.json({ ok: false, errorCode: 'NO_LINK', message: 'Bağlantı bulunamadı veya kullanıldı.' }, { status: 404 });
        }
        const data = snap.data() as {
            phone?: string;
            phoneCountryCode?: string;
            cleanPhone?: string;
            name?: string;
            expiresAt?: number;
            used?: boolean;
        };
        if (data.used) {
            return NextResponse.json({ ok: false, errorCode: 'LINK_USED', message: 'Bu bağlantı zaten kullanıldı.' }, { status: 410 });
        }
        if (typeof data.expiresAt === 'number' && Date.now() > data.expiresAt) {
            await ref.delete().catch(() => {});
            return NextResponse.json({ ok: false, errorCode: 'LINK_EXPIRED', message: 'Bağlantı süresi doldu, yeni bir tane iste.' }, { status: 410 });
        }
        if (!data.phone) {
            return NextResponse.json({ ok: false, errorCode: 'CORRUPT_LINK', message: 'Bağlantı bozuk.' }, { status: 400 });
        }

        const adminAuth = getAdminAuth();
        // Normalize: ülke kodu strip et (kullanıcı "+90..." yazmışsa double-90 olmasın)
        const cleanForCheck = canonicalPhone(data.cleanPhone || data.phone || '', data.phoneCountryCode);
        let uid: string;
        let isNewUser = false;
        try {
            const existing = await adminAuth.getUserByPhoneNumber(data.phone);
            uid = existing.uid;
        } catch {
            // Firebase Auth'ta yok ama Firestore'da personalInfo.phone'da mevcut
            // bir hesapta var mı? Varsa MÜKERRER hesap açma — link telefon
            // sahipliğini kanıtladı, o mevcut hesaba giriş yap.
            if (cleanForCheck) {
                const dupSnap = await db.collection(COLLECTIONS.users)
                    .where('personalInfo.phone', 'in', phoneMatchCandidates(data.cleanPhone || data.phone, data.phoneCountryCode))
                    .limit(1)
                    .get();
                if (!dupSnap.empty) {
                    const existingUid = dupSnap.docs[0].id;
                    try { await adminAuth.updateUser(existingUid, { phoneNumber: data.phone }); } catch { /* link best-effort */ }
                    const token = await adminAuth.createCustomToken(existingUid);
                    await ref.update({ used: true, usedAt: FieldValue.serverTimestamp() });
                    return NextResponse.json({ ok: true, customToken: token, isNewUser: false });
                }
            }
            const created = await adminAuth.createUser({
                phoneNumber: data.phone,
                displayName: data.name || undefined,
            });
            uid = created.uid;
            isNewUser = true;
        }

        // Firestore users/{uid}: yalnızca doc yoksa tam profil yaz — mevcut
        // kullanıcının stats/avatar/createdAt alanlarını SIFIRLAMA.
        const userDocRef = db.collection(COLLECTIONS.users).doc(uid);
        const existingDoc = await userDocRef.get();
        // Orphan Auth + farklı Firestore uid edge case'i: başka uid'de aynı
        // telefonla bir doc var mı kontrol et.
        if (!existingDoc.exists && cleanForCheck) {
            const dupSnap = await db.collection(COLLECTIONS.users)
                .where('personalInfo.phone', 'in', phoneMatchCandidates(data.cleanPhone || data.phone || '', data.phoneCountryCode))
                .limit(1)
                .get();
            if (!dupSnap.empty && dupSnap.docs[0].id !== uid) {
                const existingUid = dupSnap.docs[0].id;
                try { await adminAuth.updateUser(existingUid, { phoneNumber: data.phone }); } catch { /* link best-effort */ }
                const customToken = await adminAuth.createCustomToken(existingUid);
                await ref.update({ used: true, usedAt: FieldValue.serverTimestamp() });
                return NextResponse.json({ ok: true, customToken, isNewUser: false });
            }
        }
        if (!existingDoc.exists) {
            await userDocRef.set({
                id: uid,
                name: data.name || '',
                avatarUrl: '',
                personalInfo: {
                    phone: cleanForCheck,
                    phoneCountryCode: data.phoneCountryCode || '+90',
                },
                stats: { totalDonation: 0, volunteerHours: 0, impactScore: 0 },
                signupMethod: 'whatsapp-link',
                createdAt: FieldValue.serverTimestamp(),
                joinDate: new Date().toISOString().split('T')[0],
            }, { merge: true });
            isNewUser = true;
        } else {
            await userDocRef.set({
                personalInfo: {
                    phone: data.cleanPhone || '',
                    phoneCountryCode: data.phoneCountryCode || '+90',
                },
            }, { merge: true });
        }

        const customToken = await adminAuth.createCustomToken(uid);

        // Mark used + cleanup
        await ref.update({ used: true, usedAt: FieldValue.serverTimestamp() });

        // Yeni kullanıcıya welcome zinciri (best-effort)
        if (isNewUser) {
            if (data.phone) {
                try {
                    const { sendWelcomeMessage } = await import('@/lib/whatsapp-welcome');
                    await sendWelcomeMessage(data.phone, data.name || 'arkadaş', data.phoneCountryCode === '+90' ? 'tr' : 'en');
                } catch (e) {
                    console.warn('[verify-link] whatsapp welcome failed', e);
                }
            }
            try {
                const { sendPushToUser } = await import('@/lib/push-notifications');
                const welcomeText = 'Merhaba hangel\'e hoş geldin. Sosyal sorunlar ile mücadele edenleri yalnız bırakmamak adına hangel\'a katıldığın için minnettarız. Bundan böyle kollektif bilinçle birlikte mücadele edeceğiz. #wearehangel';
                const subject = 'hangel\'e hoş geldin';
                await db.collection(COLLECTIONS.messages).add({
                    sender: { id: 'hangel-system', name: 'Hangel Resmi', avatarUrl: '' },
                    senderId: 'hangel-system',
                    senderType: 'system',
                    recipient: { id: uid, name: data.name || '', avatarUrl: '' },
                    recipientId: uid,
                    subject,
                    content: welcomeText,
                    timestamp: FieldValue.serverTimestamp(),
                    status: 'sent',
                    isWelcome: true,
                });
                await db.collection(COLLECTIONS.notifications).add({
                    userId: uid,
                    type: 'welcome',
                    title: subject,
                    body: welcomeText.slice(0, 120),
                    read: false,
                    pushSent: true, // inline push aşağıda — Cloud Function tekrar göndermesin
                    createdAt: FieldValue.serverTimestamp(),
                    createdBy: 'hangel-system',
                });
                await sendPushToUser(uid, { title: subject, body: welcomeText.slice(0, 100), clickAction: '/messages', data: { type: 'welcome' } });
            } catch (e) {
                console.warn('[verify-link] welcome inbox/notif failed', e);
            }
        }

        return NextResponse.json({ ok: true, customToken, isNewUser });
    } catch (e) {
        console.error('[whatsapp-link/verify] internal error', e);
        return NextResponse.json({ ok: false, errorCode: 'INTERNAL_ERROR', message: 'Sunucu hatası.' }, { status: 500 });
    }
}
