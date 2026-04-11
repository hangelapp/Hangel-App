import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import crypto from 'crypto';

const MAX_ATTEMPTS = 5;

function hashOtp(otp: string): string {
    return crypto.createHash('sha256').update(otp).digest('hex');
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { phone, otp, name } = body as {
            phone: string;
            otp: string;
            name?: string;
        };

        if (!phone || !otp) {
            return NextResponse.json({ error: 'Telefon ve doğrulama kodu gerekli' }, { status: 400 });
        }

        const db = getAdminFirestore();
        const auth = getAdminAuth();
        const otpCodesRef = db.collection('otp_codes');

        // En son geçerli OTP dokümanını bul
        const now = Date.now();
        const queryResult = await otpCodesRef
            .where('phone', '==', phone)
            .limit(10)
            .get();

        if (queryResult.empty) {
            return NextResponse.json(
                { error: 'Doğrulama kodu geçersiz veya süresi dolmuş' },
                { status: 401 }
            );
        }

        // En son, kullanılmamış ve süresi dolmamış OTP'yi bul
        const validDocs = queryResult.docs
            .map(d => ({ ref: d.ref, data: d.data() }))
            .filter(d => {
                if (d.data.used) return false;
                const exp = d.data.expiresAt?.toMillis?.() ?? (d.data.expiresAt instanceof Date ? d.data.expiresAt.getTime() : 0);
                return exp > now;
            })
            .sort((a, b) => {
                const aTime = a.data.createdAt?.toMillis?.() ?? 0;
                const bTime = b.data.createdAt?.toMillis?.() ?? 0;
                return bTime - aTime;
            });

        if (validDocs.length === 0) {
            return NextResponse.json(
                { error: 'Doğrulama kodu geçersiz veya süresi dolmuş' },
                { status: 401 }
            );
        }

        const otpDoc = validDocs[0];
        const otpData = otpDoc.data;

        // Deneme limiti kontrolü
        if (otpData.attempts >= MAX_ATTEMPTS) {
            await otpDoc.ref.update({ used: true });
            return NextResponse.json(
                { error: 'Çok fazla yanlış deneme. Yeni kod isteyin.' },
                { status: 401 }
            );
        }

        // OTP hash karşılaştır
        const submittedHash = hashOtp(otp);
        if (submittedHash !== otpData.otpHash) {
            await otpDoc.ref.update({ attempts: otpData.attempts + 1 });
            return NextResponse.json(
                { error: 'Doğrulama kodu hatalı' },
                { status: 401 }
            );
        }

        // OTP doğru - kullan ve işaretle
        await otpDoc.ref.update({ used: true });

        // Firebase kullanıcısını bul veya oluştur
        let uid: string;
        let isNewUser = false;

        try {
            const existingUser = await auth.getUserByPhoneNumber(phone);
            uid = existingUser.uid;
        } catch (error: any) {
            if (error.code === 'auth/user-not-found') {
                const newUser = await auth.createUser({
                    phoneNumber: phone,
                    displayName: name || undefined,
                });
                uid = newUser.uid;
                isNewUser = true;
            } else {
                throw error;
            }
        }

        // Custom token oluştur
        const token = await auth.createCustomToken(uid);

        return NextResponse.json({ token, isNewUser, uid });
    } catch (error: any) {
        console.error('verify-otp error:', error);
        return NextResponse.json(
            { error: error.message || 'Doğrulama başarısız' },
            { status: 500 }
        );
    }
}
