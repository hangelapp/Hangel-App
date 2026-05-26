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

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
    try {
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
        let userRecord;
        let isNewUser = false;
        try {
            userRecord = await adminAuth.getUserByPhoneNumber(data.phone);
        } catch {
            userRecord = await adminAuth.createUser({
                phoneNumber: data.phone,
                displayName: data.name || undefined,
            });
            isNewUser = true;
        }
        const uid = userRecord.uid;

        await db.collection(COLLECTIONS.users).doc(uid).set({
            id: uid,
            name: data.name || userRecord.displayName || '',
            avatarUrl: '',
            personalInfo: {
                phone: data.cleanPhone || '',
                phoneCountryCode: data.phoneCountryCode || '+90',
            },
            stats: { totalDonation: 0, volunteerHours: 0, impactScore: 0 },
            signupMethod: 'whatsapp-link',
            createdAt: FieldValue.serverTimestamp(),
            joinDate: new Date().toISOString().split('T')[0],
        }, { merge: true });

        const customToken = await adminAuth.createCustomToken(uid);

        // Mark used + cleanup
        await ref.update({ used: true, usedAt: FieldValue.serverTimestamp() });

        return NextResponse.json({ ok: true, customToken, isNewUser });
    } catch (e) {
        console.error('[whatsapp-link/verify] internal error', e);
        return NextResponse.json({ ok: false, errorCode: 'INTERNAL_ERROR', message: 'Sunucu hatası.' }, { status: 500 });
    }
}
