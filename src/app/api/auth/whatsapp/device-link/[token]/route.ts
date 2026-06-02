/**
 * GET /api/auth/whatsapp/device-link/[token]
 *
 * Davranış:
 * 1. deviceLinks/{token} oku
 * 2. used=true → 410, expiresAt geçti → 410 (doc silinir)
 * 3. Firebase user'ı oluştur veya getir (phone ile, Firestore mükerrer hesap
 *    kontrolü dahil — verify-link ile aynı strateji)
 * 4. Custom auth token üret, doc'u used=true işaretle
 * 5. JSON { ok: true, customToken, isNewUser }
 *
 * Tek kullanımlık. Mükerrer hesap kanonik phone match'i `verify-link`
 * route'undan kopyalanmıştır (privilege-escalation hardening).
 *
 * NOT: Bu route mevcut `verify-link` (welcome chain) akışını DEĞİŞTİRMEZ.
 * Yeni cihaz bağlama akışı welcome zinciri başlatmaz — kullanıcı zaten
 * üye varsayılır.
 */
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
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

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    try {
        const ip = getClientIp(req);
        const ipLimit = await checkRateLimit({
            bucket: 'wa-device-link-verify-ip',
            key: ip,
            limit: 20,
            windowMs: 60_000,
        });
        if (!ipLimit.allowed) {
            return NextResponse.json(
                { ok: false, errorCode: 'RATE_LIMITED', message: 'Çok fazla istek, lütfen bekleyin.' },
                { status: 429 }
            );
        }

        const { token } = await params;
        if (!token || token.length < 16) {
            return NextResponse.json(
                { ok: false, errorCode: 'INVALID_TOKEN', message: 'Geçersiz bağlantı.' },
                { status: 400 }
            );
        }

        const db = getAdminFirestore();
        const ref = db.collection(COLLECTIONS.deviceLinks).doc(token);
        const snap = await ref.get();
        if (!snap.exists) {
            return NextResponse.json(
                { ok: false, errorCode: 'NO_LINK', message: 'Bağlantı bulunamadı veya kullanıldı.' },
                { status: 404 }
            );
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
            return NextResponse.json(
                { ok: false, errorCode: 'LINK_USED', message: 'Bu bağlantı zaten kullanıldı.' },
                { status: 410 }
            );
        }
        if (typeof data.expiresAt === 'number' && Date.now() > data.expiresAt) {
            await ref.delete().catch(() => { /* best-effort */ });
            return NextResponse.json(
                { ok: false, errorCode: 'LINK_EXPIRED', message: 'Bağlantı süresi doldu, yeni bir tane iste.' },
                { status: 410 }
            );
        }
        if (!data.phone) {
            return NextResponse.json(
                { ok: false, errorCode: 'CORRUPT_LINK', message: 'Bağlantı bozuk.' },
                { status: 400 }
            );
        }

        const adminAuth = getAdminAuth();
        const cleanForCheck = canonicalPhone(data.cleanPhone || data.phone || '', data.phoneCountryCode);
        let uid: string;
        let isNewUser = false;
        try {
            const existing = await adminAuth.getUserByPhoneNumber(data.phone);
            uid = existing.uid;
        } catch {
            // Auth'ta yok ama Firestore'da personalInfo.phone ile mevcut bir
            // hesap var mı? Varsa MÜKERRER hesap açma — link telefon
            // sahipliğini kanıtladı, o mevcut hesaba giriş yap.
            if (cleanForCheck) {
                const dupSnap = await db.collection(COLLECTIONS.users)
                    .where('personalInfo.phone', 'in', phoneMatchCandidates(data.cleanPhone || data.phone, data.phoneCountryCode))
                    .limit(1)
                    .get();
                if (!dupSnap.empty) {
                    const existingUid = dupSnap.docs[0].id;
                    try {
                        await adminAuth.updateUser(existingUid, { phoneNumber: data.phone });
                    } catch { /* link best-effort */ }
                    const customToken = await adminAuth.createCustomToken(existingUid);
                    await ref.update({ used: true, usedAt: FieldValue.serverTimestamp() });
                    return NextResponse.json({ ok: true, customToken, isNewUser: false });
                }
            }
            const created = await adminAuth.createUser({
                phoneNumber: data.phone,
                displayName: data.name || undefined,
            });
            uid = created.uid;
            isNewUser = true;
        }

        // users/{uid}: doc yoksa minimum profil yaz; mevcut ise stats/avatar'a
        // dokunma. Device-link akışı welcome zinciri tetiklemez — kullanıcı
        // zaten üye varsayılır (yeni cihaz pairing senaryosu).
        const userDocRef = db.collection(COLLECTIONS.users).doc(uid);
        const existingDoc = await userDocRef.get();
        const phoneForHash = cleanForCheck || data.cleanPhone || '';
        const phoneHash = phoneForHash
            ? crypto.createHash('sha256').update(phoneForHash).digest('hex')
            : null;

        if (!existingDoc.exists) {
            await userDocRef.set({
                id: uid,
                name: data.name || '',
                avatarUrl: '',
                personalInfo: {
                    phone: cleanForCheck,
                    phoneCountryCode: data.phoneCountryCode || '+90',
                    ...(phoneHash ? { phoneHash } : {}),
                },
                stats: { totalDonation: 0, volunteerHours: 0, impactScore: 0 },
                signupMethod: 'whatsapp-device-link',
                createdAt: FieldValue.serverTimestamp(),
                joinDate: new Date().toISOString().split('T')[0],
            }, { merge: true });
            isNewUser = true;
        } else if (phoneHash) {
            await userDocRef.set({
                personalInfo: {
                    phone: cleanForCheck,
                    phoneCountryCode: data.phoneCountryCode || '+90',
                    phoneHash,
                },
            }, { merge: true });
        }

        const customToken = await adminAuth.createCustomToken(uid);

        // Tek kullanımlık işaretle
        await ref.update({ used: true, usedAt: FieldValue.serverTimestamp() });

        return NextResponse.json({ ok: true, customToken, isNewUser });
    } catch (e) {
        console.error('[device-link/verify] internal error', e);
        return NextResponse.json(
            { ok: false, errorCode: 'INTERNAL_ERROR', message: 'Sunucu hatası.' },
            { status: 500 }
        );
    }
}
