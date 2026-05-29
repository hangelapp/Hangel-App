/**
 * POST /api/auth/whatsapp/verify-otp
 *
 * Body: { phone: string, phoneCountryCode: string, code: string, name?: string }
 *
 * Davranış:
 * 1. otp_codes/{phoneHash} doc'unu oku
 * 2. expiresAt geçtiyse 410
 * 3. attempts >= 5 ise 429
 * 4. code eşleşmiyorsa attempts++ + 401
 * 5. eşleşirse:
 *    - Firebase Auth user'ı oluştur veya getir (phone field ile)
 *    - users/{uid} doc'unu set (name + phone)
 *    - Custom token üret → client signInWithCustomToken ile login
 *    - otp_codes doc'unu sil
 * 6. { ok: true, customToken } dön
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { FieldValue } from 'firebase-admin/firestore';
import { checkRateLimit } from '@/lib/rate-limit';
import crypto from 'crypto';

export const runtime = 'nodejs';

const MAX_ATTEMPTS = 5;

function hashPhone(phone: string): string {
    return crypto.createHash('sha256').update(phone).digest('hex').slice(0, 32);
}

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
        const ipLimit = await checkRateLimit({ bucket: 'wa-otp-verify-ip', key: ip, limit: 20, windowMs: 60_000 });
        if (!ipLimit.allowed) {
            return NextResponse.json(
                { ok: false, errorCode: 'RATE_LIMITED', message: 'Çok fazla istek, lütfen bekleyin.' },
                { status: 429 }
            );
        }
        const body = await req.json().catch(() => null);
        const phone = typeof body?.phone === 'string' ? body.phone : '';
        const phoneCountryCode = typeof body?.phoneCountryCode === 'string' ? body.phoneCountryCode : '+90';
        const code = typeof body?.code === 'string' ? body.code.trim() : '';
        const name = typeof body?.name === 'string' ? body.name.trim() : '';
        const cleanPhone = phone.replace(/\D/g, '').replace(/^0+/, '');
        const fullPhone = `${phoneCountryCode}${cleanPhone}`;

        if (!cleanPhone || !/^\d{6}$/.test(code)) {
            return NextResponse.json({ ok: false, errorCode: 'INVALID_INPUT', message: 'Geçersiz telefon veya kod.' }, { status: 400 });
        }

        const db = getAdminFirestore();
        const phoneHash = hashPhone(fullPhone);
        const ref = db.collection(COLLECTIONS.otpCodes).doc(phoneHash);
        const snap = await ref.get();
        if (!snap.exists) {
            return NextResponse.json({ ok: false, errorCode: 'NO_OTP', message: 'Bu numara için aktif kod yok. Yeni kod isteyin.' }, { status: 404 });
        }
        const data = snap.data() as { code?: string; expiresAt?: number; attempts?: number };
        if (typeof data.expiresAt === 'number' && Date.now() > data.expiresAt) {
            await ref.delete();
            return NextResponse.json({ ok: false, errorCode: 'OTP_EXPIRED', message: 'Kodun süresi doldu. Yeni kod isteyin.' }, { status: 410 });
        }
        const attempts = Number(data.attempts) || 0;
        if (attempts >= MAX_ATTEMPTS) {
            await ref.delete();
            return NextResponse.json({ ok: false, errorCode: 'TOO_MANY_ATTEMPTS', message: 'Çok fazla yanlış deneme. Yeni kod isteyin.' }, { status: 429 });
        }
        if (data.code !== code) {
            await ref.update({ attempts: FieldValue.increment(1) });
            return NextResponse.json({ ok: false, errorCode: 'WRONG_CODE', message: 'Kod yanlış.', remainingAttempts: MAX_ATTEMPTS - attempts - 1 }, { status: 401 });
        }

        // Doğru — kullanıcıyı oluştur/getir
        const adminAuth = getAdminAuth();
        let uid: string;
        let isNewUser = false;
        try {
            const existing = await adminAuth.getUserByPhoneNumber(fullPhone);
            uid = existing.uid;
        } catch {
            // Firebase Auth'ta bu telefonla kullanıcı yok. Ama Firestore'da
            // personalInfo.phone'da bu numara mevcut bir hesapta var mı? (E-posta
            // ile kayıt olup profiline telefon eklemiş kullanıcı.) Varsa MÜKERRER
            // hesap açma — OTP telefon sahipliğini kanıtladı, o mevcut hesaba giriş yap.
            const dupSnap = await db.collection(COLLECTIONS.users)
                .where('personalInfo.phone', '==', cleanPhone)
                .limit(1)
                .get();
            if (!dupSnap.empty) {
                const existingUid = dupSnap.docs[0].id;
                // Sonraki girişlerde getUserByPhoneNumber doğrudan bulsun diye
                // telefonu mevcut hesaba bağla (best-effort).
                try { await adminAuth.updateUser(existingUid, { phoneNumber: fullPhone }); } catch { /* link best-effort */ }
                const token = await adminAuth.createCustomToken(existingUid);
                await ref.delete();
                return NextResponse.json({ ok: true, customToken: token, isNewUser: false });
            }
            // Yoksa yeni oluştur
            const created = await adminAuth.createUser({
                phoneNumber: fullPhone,
                displayName: name || undefined,
            });
            uid = created.uid;
            isNewUser = true;
        }

        // Firestore users/{uid}: yalnızca doc yoksa tam profil yaz — mevcut
        // kullanıcının stats/avatar/createdAt alanlarını re-login'de SIFIRLAMA.
        const userDocRef = db.collection(COLLECTIONS.users).doc(uid);
        const existingDoc = await userDocRef.get();
        if (!existingDoc.exists) {
            await userDocRef.set({
                id: uid,
                name: name || '',
                avatarUrl: '',
                personalInfo: {
                    phone: cleanPhone,
                    phoneCountryCode,
                },
                stats: { totalDonation: 0, volunteerHours: 0, impactScore: 0 },
                signupMethod: 'whatsapp',
                createdAt: FieldValue.serverTimestamp(),
                joinDate: new Date().toISOString().split('T')[0],
            }, { merge: true });
            isNewUser = true;
        } else {
            await userDocRef.set({
                personalInfo: { phone: cleanPhone, phoneCountryCode },
            }, { merge: true });
        }

        // Custom token üret
        const customToken = await adminAuth.createCustomToken(uid);

        // OTP doc'unu sil (kullanıldı)
        await ref.delete();

        // Yeni kullanıcıya welcome zinciri (best-effort, fail bloklamaz)
        if (isNewUser) {
            // 1) WhatsApp utility mesajı (template approval gerek)
            try {
                const { sendWelcomeMessage } = await import('@/lib/whatsapp-welcome');
                await sendWelcomeMessage(fullPhone, name || 'arkadaş', phoneCountryCode === '+90' ? 'tr' : 'en');
            } catch (e) {
                console.warn('[verify-otp] whatsapp welcome failed', e);
            }
            // 2) Inbox mesajı + notifications + push (admin SDK ile direkt)
            try {
                const { getAdminFirestore } = await import('@/lib/firebase-admin');
                const { sendPushToUser } = await import('@/lib/push-notifications');
                const { FieldValue } = await import('firebase-admin/firestore');
                const adminDb = getAdminFirestore();
                const welcomeText = 'Merhaba hangel\'e hoş geldin. Sosyal sorunlar ile mücadele edenleri yalnız bırakmamak adına hangel\'a katıldığın için minnettarız. Bundan böyle kollektif bilinçle birlikte mücadele edeceğiz. #wearehangel';
                const subject = 'hangel\'e hoş geldin';
                await adminDb.collection(COLLECTIONS.messages).add({
                    sender: { id: 'hangel-system', name: 'Hangel Resmi', avatarUrl: '' },
                    senderId: 'hangel-system',
                    senderType: 'system',
                    recipient: { id: uid, name: name || '', avatarUrl: '' },
                    recipientId: uid,
                    subject,
                    content: welcomeText,
                    timestamp: FieldValue.serverTimestamp(),
                    status: 'sent',
                    isWelcome: true,
                });
                await adminDb.collection(COLLECTIONS.notifications).add({
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
                console.warn('[verify-otp] welcome inbox/notif failed', e);
            }
        }

        return NextResponse.json({ ok: true, customToken, isNewUser });
    } catch (e) {
        console.error('[whatsapp-otp/verify] internal error', e);
        return NextResponse.json({ ok: false, errorCode: 'INTERNAL_ERROR', message: 'Sunucu hatası.' }, { status: 500 });
    }
}
