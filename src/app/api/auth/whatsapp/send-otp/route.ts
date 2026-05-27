/**
 * POST /api/auth/whatsapp/send-otp
 *
 * Body: { phone: string, phoneCountryCode: string, name?: string, lang?: string }
 * - phone: ulusal format ("5XXXXXXXXX") veya tam E.164 ("+90555...")
 * - phoneCountryCode: "+90" gibi
 *
 * Davranış:
 * 1. Per-IP + per-phone rate limit (abuse koruma)
 * 2. 6 haneli kod üret
 * 3. Firestore otp_codes/{phoneHash} doc'una kaydet (TTL 10 dk, attempts=0)
 * 4. Meta WhatsApp Cloud API ile template mesaj gönder
 * 5. Başarılıysa { ok: true } dön
 *
 * Yanıt: { ok, errorCode?, message? }
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { sendWhatsAppOtp } from '@/lib/whatsapp';
import { checkRateLimit } from '@/lib/rate-limit';
import { FieldValue } from 'firebase-admin/firestore';
import crypto from 'crypto';

export const runtime = 'nodejs';

const OTP_TTL_MS = 10 * 60 * 1000; // 10 dk
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

function generateOtp(): string {
    // Crypto-secure 6-digit OTP
    return crypto.randomInt(100000, 1000000).toString();
}

function hashPhone(phone: string): string {
    return crypto.createHash('sha256').update(phone).digest('hex').slice(0, 32);
}

export async function POST(req: NextRequest) {
    try {
        const ip = getClientIp(req);
        const ipLimit = await checkRateLimit({
            bucket: 'wa-otp-send-ip',
            key: ip,
            limit: RATE_LIMIT_MAX_PER_IP,
            windowMs: RATE_LIMIT_WINDOW_MS,
        });
        if (!ipLimit.allowed) {
            return NextResponse.json(
                { ok: false, errorCode: 'RATE_LIMITED', message: 'Çok fazla istek, lütfen bekleyin.' },
                { status: 429, headers: { 'Retry-After': String(Math.ceil((ipLimit.resetAt - Date.now()) / 1000)) } },
            );
        }

        const body = await req.json().catch(() => null);
        const phone = typeof body?.phone === 'string' ? body.phone : '';
        const phoneCountryCode = typeof body?.phoneCountryCode === 'string' ? body.phoneCountryCode : '+90';
        const lang = typeof body?.lang === 'string' ? body.lang : undefined;
        const cleanPhone = phone.replace(/\D/g, '').replace(/^0+/, '');

        if (!cleanPhone || cleanPhone.length < 7) {
            return NextResponse.json({ ok: false, errorCode: 'INVALID_PHONE', message: 'Geçersiz telefon.' }, { status: 400 });
        }

        const fullPhone = `${phoneCountryCode}${cleanPhone}`;

        // Per-phone rate limit
        const phoneLimit = await checkRateLimit({
            bucket: 'wa-otp-send-phone',
            key: fullPhone,
            limit: RATE_LIMIT_MAX_PER_PHONE,
            windowMs: RATE_LIMIT_WINDOW_MS,
        });
        if (!phoneLimit.allowed) {
            return NextResponse.json(
                { ok: false, errorCode: 'RATE_LIMITED', message: 'Bu numaraya çok fazla kod gönderildi, lütfen bekleyin.' },
                { status: 429, headers: { 'Retry-After': String(Math.ceil((phoneLimit.resetAt - Date.now()) / 1000)) } },
            );
        }

        const otp = generateOtp();
        const phoneHash = hashPhone(fullPhone);
        const expiresAt = Date.now() + OTP_TTL_MS;

        // Firestore'a kaydet (overwrite önceki kod)
        const db = getAdminFirestore();
        await db.collection(COLLECTIONS.otpCodes).doc(phoneHash).set({
            phone: fullPhone,
            code: otp,
            channel: 'whatsapp',
            attempts: 0,
            expiresAt,
            createdAt: FieldValue.serverTimestamp(),
        });

        // WhatsApp ile gönder
        const sendResult = await sendWhatsAppOtp(fullPhone, otp, lang);
        if (!sendResult.ok) {
            // Konfigürasyon eksikse veya WhatsApp tarafında hata varsa sessizce log + 503 dön
            // PII: telefon son 4 hane dışı maskelenir.
            const maskedPhone = fullPhone.slice(0, -4).replace(/\d/g, '*') + fullPhone.slice(-4);
            console.error('[whatsapp-otp] send failed', { phone: maskedPhone, error: sendResult });
            return NextResponse.json(
                {
                    ok: false,
                    errorCode: sendResult.errorCode || 'WA_SEND_FAILED',
                    message: 'WhatsApp ile kod gönderilemedi. Lütfen SMS seçeneğini deneyin.',
                },
                { status: 503 },
            );
        }

        return NextResponse.json({ ok: true, expiresInSeconds: OTP_TTL_MS / 1000 });
    } catch (e) {
        console.error('[whatsapp-otp/send] internal error', e);
        return NextResponse.json({ ok: false, errorCode: 'INTERNAL_ERROR', message: 'Sunucu hatası.' }, { status: 500 });
    }
}
