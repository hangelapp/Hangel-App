import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';
import crypto from 'crypto';

const OTP_COOLDOWN_MS = 60 * 1000; // 60 saniye
const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 dakika

function hashOtp(otp: string): string {
    return crypto.createHash('sha256').update(otp).digest('hex');
}

function isValidE164(phone: string): boolean {
    return /^\+[1-9]\d{6,14}$/.test(phone);
}

async function sendWhatsAppOtp(phone: string, otp: string): Promise<void> {
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const templateName = process.env.WHATSAPP_AUTH_TEMPLATE_NAME || 'hangel_tr';

    if (!phoneNumberId || !accessToken) {
        throw new Error('WhatsApp API yapılandırması eksik');
    }

    const res = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: phone.replace('+', ''),
            type: 'template',
            template: {
                name: templateName,
                language: { code: 'tr' },
                components: [
                    {
                        type: 'body',
                        parameters: [
                            { type: 'text', text: otp },
                        ],
                    },
                    {
                        type: 'button',
                        sub_type: 'url',
                        index: '0',
                        parameters: [{ type: 'text', text: otp }],
                    },
                ],
            },
        }),
    });

    if (!res.ok) {
        const errorBody = await res.text();
        console.error('WhatsApp API error:', errorBody);
        throw new Error('WhatsApp mesajı gönderilemedi');
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { phone, name, channel = 'whatsapp' } = body as {
            phone: string;
            name?: string;
            channel?: 'whatsapp' | 'sms';
        };

        if (!phone || !isValidE164(phone)) {
            return NextResponse.json({ error: 'Geçersiz telefon numarası' }, { status: 400 });
        }

        const db = getAdminFirestore();
        const otpCodesRef = db.collection('otp_codes');

        // Rate limit: aynı telefon için 60sn cooldown
        const now = Date.now();
        const recentQuery = await otpCodesRef
            .where('phone', '==', phone)
            .limit(5)
            .get();

        const recentUnused = recentQuery.docs
            .map(d => d.data())
            .filter(d => !d.used)
            .sort((a, b) => {
                const aTime = a.createdAt?.toMillis?.() ?? (a.createdAt instanceof Date ? a.createdAt.getTime() : 0);
                const bTime = b.createdAt?.toMillis?.() ?? (b.createdAt instanceof Date ? b.createdAt.getTime() : 0);
                return bTime - aTime;
            });

        if (recentUnused.length > 0) {
            const lastDoc = recentUnused[0];
            const lastCreatedAt = lastDoc.createdAt?.toMillis?.() ?? (lastDoc.createdAt instanceof Date ? lastDoc.createdAt.getTime() : 0);
            if ((now - lastCreatedAt) < OTP_COOLDOWN_MS) {
                const retryAfter = Math.ceil((OTP_COOLDOWN_MS - (now - lastCreatedAt)) / 1000);
                return NextResponse.json(
                    { error: 'Çok fazla istek. Lütfen bekleyin.', retryAfter },
                    { status: 429 }
                );
            }
        }

        // OTP üret ve hash'le
        const otp = crypto.randomInt(100000, 999999).toString();
        const otpHash = hashOtp(otp);

        // Firestore'a kaydet
        await otpCodesRef.add({
            phone,
            otpHash,
            attempts: 0,
            createdAt: new Date(now),
            expiresAt: new Date(now + OTP_EXPIRY_MS),
            used: false,
            channel,
        });

        // OTP gönder
        if (channel === 'whatsapp') {
            await sendWhatsAppOtp(phone, otp);
        } else {
            // SMS fallback - Firebase Admin SDK ile SMS gönderemez,
            // bu durumda client tarafında Firebase signInWithPhoneNumber kullanılacak
            // Şimdilik WhatsApp dışında bir kanal seçilirse hata dön
            return NextResponse.json(
                { error: 'SMS gönderimi henüz desteklenmiyor. WhatsApp kullanın.' },
                { status: 400 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('send-otp error:', error);
        return NextResponse.json(
            { error: error.message || 'Doğrulama kodu gönderilemedi' },
            { status: 500 }
        );
    }
}
