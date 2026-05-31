/**
 * POST /api/auth/whatsapp/send-link
 *
 * Body: { phone: string, phoneCountryCode: string, name: string, lang?: string }
 *
 * Davranış:
 * 1. Per-IP + per-phone rate limit
 * 2. Crypto-secure 32-byte token üret (base64url)
 * 3. Firestore login_links/{token} doc'una kaydet (10 dk TTL, used=false)
 * 4. Meta WhatsApp UTILITY template ile link mesajı gönder
 * 5. Kullanıcı linke tıklayınca /auth/wa?t=TOKEN açılır → custom token + signIn
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { sendWhatsAppLink } from '@/lib/whatsapp-link';
import { checkRateLimit } from '@/lib/rate-limit';
import { FieldValue } from 'firebase-admin/firestore';
import crypto from 'crypto';

export const runtime = 'nodejs';

const LINK_TTL_MS = 10 * 60 * 1000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_PER_IP = 5;
const RATE_LIMIT_MAX_PER_PHONE = 3;

function getClientIp(req: NextRequest): string {
    const xff = req.headers.get('x-forwarded-for');
    if (xff) {
        const first = xff.split(',')[0]?.trim();
        if (first) return first;
    }
    return req.headers.get('x-real-ip')?.trim() || 'unknown';
}

function generateToken(): string {
    return crypto.randomBytes(32).toString('base64url');
}

export async function POST(req: NextRequest) {
    try {
        const ip = getClientIp(req);
        const ipLimit = await checkRateLimit({ bucket: 'wa-link-send-ip', key: ip, limit: RATE_LIMIT_MAX_PER_IP, windowMs: RATE_LIMIT_WINDOW_MS });
        if (!ipLimit.allowed) {
            return NextResponse.json(
                { ok: false, errorCode: 'RATE_LIMITED', message: 'Çok fazla istek, lütfen bekleyin.' },
                { status: 429 }
            );
        }

        const body = await req.json().catch(() => null);
        const phone = typeof body?.phone === 'string' ? body.phone : '';
        const phoneCountryCode = typeof body?.phoneCountryCode === 'string' ? body.phoneCountryCode : '+90';
        const name = typeof body?.name === 'string' ? body.name.trim() : '';
        const lang = typeof body?.lang === 'string' ? body.lang : 'tr';
        // canonicalPhone: ülke kodu + baştaki 0'ı strip eder (consistent normalization)
        const { canonicalPhone } = await import('@/lib/phone-normalize');
        const cleanPhone = canonicalPhone(phone, phoneCountryCode);

        if (!name || !cleanPhone || cleanPhone.length < 7) {
            return NextResponse.json({ ok: false, errorCode: 'INVALID_INPUT', message: 'Ad ve geçerli telefon gerekli.' }, { status: 400 });
        }
        const fullPhone = `${phoneCountryCode}${cleanPhone}`;

        const phoneLimit = await checkRateLimit({ bucket: 'wa-link-send-phone', key: fullPhone, limit: RATE_LIMIT_MAX_PER_PHONE, windowMs: RATE_LIMIT_WINDOW_MS });
        if (!phoneLimit.allowed) {
            return NextResponse.json(
                { ok: false, errorCode: 'RATE_LIMITED', message: 'Bu numaraya çok fazla link gönderildi.' },
                { status: 429 }
            );
        }

        const token = generateToken();
        const expiresAt = Date.now() + LINK_TTL_MS;
        const db = getAdminFirestore();
        await db.collection(COLLECTIONS.loginLinks).doc(token).set({
            phone: fullPhone,
            phoneCountryCode,
            cleanPhone,
            name,
            expiresAt,
            used: false,
            createdAt: FieldValue.serverTimestamp(),
        });

        const sendResult = await sendWhatsAppLink(fullPhone, name, token, lang);
        if (!sendResult.ok) {
            // PII: telefon son 4 hane dışı maskelenir.
            const maskedPhone = fullPhone.slice(0, -4).replace(/\d/g, '*') + fullPhone.slice(-4);
            console.error('[whatsapp-link] send failed', { phone: maskedPhone, error: sendResult });
            // Kullanılmayan token'ı temizle
            await db.collection(COLLECTIONS.loginLinks).doc(token).delete().catch(() => {});
            return NextResponse.json(
                {
                    ok: false,
                    errorCode: sendResult.errorCode || 'WA_SEND_FAILED',
                    message: 'WhatsApp ile link gönderilemedi. Lütfen e-posta ile dene.',
                },
                { status: 503 }
            );
        }

        return NextResponse.json({ ok: true, expiresInSeconds: LINK_TTL_MS / 1000 });
    } catch (e) {
        console.error('[whatsapp-link/send] internal error', e);
        return NextResponse.json({ ok: false, errorCode: 'INTERNAL_ERROR', message: 'Sunucu hatası.' }, { status: 500 });
    }
}
