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
import crypto from 'crypto';

export const runtime = 'nodejs';

const MAX_ATTEMPTS = 5;

function hashPhone(phone: string): string {
    return crypto.createHash('sha256').update(phone).digest('hex').slice(0, 32);
}

export async function POST(req: NextRequest) {
    try {
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
        let userRecord;
        try {
            userRecord = await adminAuth.getUserByPhoneNumber(fullPhone);
        } catch {
            // Yoksa yeni oluştur
            userRecord = await adminAuth.createUser({
                phoneNumber: fullPhone,
                displayName: name || undefined,
            });
        }
        const uid = userRecord.uid;

        // Firestore users/{uid} doc'unu yarat veya güncelle
        await db.collection(COLLECTIONS.users).doc(uid).set({
            id: uid,
            name: name || userRecord.displayName || '',
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

        // Custom token üret
        const customToken = await adminAuth.createCustomToken(uid);

        // OTP doc'unu sil (kullanıldı)
        await ref.delete();

        return NextResponse.json({ ok: true, customToken });
    } catch (e) {
        console.error('[whatsapp-otp/verify] internal error', e);
        return NextResponse.json({ ok: false, errorCode: 'INTERNAL_ERROR', message: 'Sunucu hatası.' }, { status: 500 });
    }
}
