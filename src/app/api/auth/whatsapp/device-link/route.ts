/**
 * POST /api/auth/whatsapp/device-link
 *
 * Body: { phone: string, phoneCountryCode?: string, name?: string, lang?: string }
 *
 * Davranış:
 * 1. Per-IP + per-phone rate limit (paylaşılan kova adı: wa-device-link-*)
 * 2. crypto.randomUUID() ile tek-kullanımlık token üret
 * 3. Firestore deviceLinks/{token}: { phone, phoneCountryCode, cleanPhone,
 *    name, expiresAt: now+10min, used: false, createdAt }
 * 4. UTILITY template `hangel_device_link` ile mesaj gönder
 * 5. 200 { ok: true } — token gövdede dönmez (yalnızca WhatsApp linkinde)
 *
 * NOT: Bu route mevcut `send-link` (welcome flow) akışını DEĞIŞTIRMEZ;
 * yan yana yaşar, farklı bir Firestore koleksiyonu ve farklı template kullanır.
 */
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { sendDeviceLinkWhatsApp } from '@/lib/whatsapp-link';
import { checkRateLimit } from '@/lib/rate-limit';
import { canonicalPhone } from '@/lib/phone-normalize';

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

export async function POST(req: NextRequest) {
    try {
        const ip = getClientIp(req);
        const ipLimit = await checkRateLimit({
            bucket: 'wa-device-link-send-ip',
            key: ip,
            limit: RATE_LIMIT_MAX_PER_IP,
            windowMs: RATE_LIMIT_WINDOW_MS,
        });
        if (!ipLimit.allowed) {
            return NextResponse.json(
                { ok: false, errorCode: 'RATE_LIMITED', message: 'Çok fazla istek, lütfen bekleyin.' },
                { status: 429 }
            );
        }

        const body: unknown = await req.json().catch(() => null);
        const b = (body && typeof body === 'object') ? body as Record<string, unknown> : {};
        const phone = typeof b.phone === 'string' ? b.phone : '';
        const phoneCountryCode = typeof b.phoneCountryCode === 'string' ? b.phoneCountryCode : '+90';
        const name = typeof b.name === 'string' ? b.name.trim() : '';
        const lang = typeof b.lang === 'string' ? b.lang : 'tr';

        const cleanPhone = canonicalPhone(phone, phoneCountryCode);
        if (!cleanPhone || cleanPhone.length < 7) {
            return NextResponse.json(
                { ok: false, errorCode: 'INVALID_INPUT', message: 'Geçerli telefon gerekli.' },
                { status: 400 }
            );
        }
        const fullPhone = `${phoneCountryCode}${cleanPhone}`;

        const phoneLimit = await checkRateLimit({
            bucket: 'wa-device-link-send-phone',
            key: fullPhone,
            limit: RATE_LIMIT_MAX_PER_PHONE,
            windowMs: RATE_LIMIT_WINDOW_MS,
        });
        if (!phoneLimit.allowed) {
            return NextResponse.json(
                { ok: false, errorCode: 'RATE_LIMITED', message: 'Bu numaraya çok fazla istek gönderildi.' },
                { status: 429 }
            );
        }

        const token = crypto.randomUUID();
        const expiresAt = Date.now() + LINK_TTL_MS;

        const db = getAdminFirestore();
        await db.collection(COLLECTIONS.deviceLinks).doc(token).set({
            phone: fullPhone,
            phoneCountryCode,
            cleanPhone,
            name: name || '',
            expiresAt,
            used: false,
            createdAt: FieldValue.serverTimestamp(),
        });

        const sendResult = await sendDeviceLinkWhatsApp(fullPhone, name || 'arkadaş', token, lang);
        if (!sendResult.ok) {
            // PII güvenli log
            const maskedPhone = fullPhone.slice(0, -4).replace(/\d/g, '*') + fullPhone.slice(-4);
            console.error('[device-link] send failed', { phone: maskedPhone, error: sendResult });
            await db.collection(COLLECTIONS.deviceLinks).doc(token).delete().catch(() => { /* best-effort */ });
            return NextResponse.json(
                {
                    ok: false,
                    errorCode: sendResult.errorCode || 'WA_SEND_FAILED',
                    message: 'WhatsApp ile bağlantı gönderilemedi.',
                },
                { status: 503 }
            );
        }

        return NextResponse.json({ ok: true, expiresInSeconds: LINK_TTL_MS / 1000 });
    } catch (e) {
        console.error('[device-link/send] internal error', e);
        return NextResponse.json(
            { ok: false, errorCode: 'INTERNAL_ERROR', message: 'Sunucu hatası.' },
            { status: 500 }
        );
    }
}
