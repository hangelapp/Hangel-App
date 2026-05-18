import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase-admin';

function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// P1-1: Naive in-memory per-IP rate limiter.
// NOT: Tek-instance process bellek bazlı. App Hosting çok-instance'a ölçeklenirse
// Redis / Firestore tabanlı limiter'a göç edilmeli (bkz. follow-up P1-1b).
// Single-instance Cloud Run / dev için yeterli; instance restart'ta sıfırlanır.
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 dk
const RATE_LIMIT_MAX = 5; // dakikada 5 istek
const ipBuckets: Map<string, { count: number; resetAt: number }> = new Map();

function getClientIp(request: NextRequest): string {
    const xff = request.headers.get('x-forwarded-for');
    if (xff) {
        // İlk IP gerçek client'tır; CDN/proxy zinciri sonra gelir.
        const first = xff.split(',')[0]?.trim();
        if (first) return first;
    }
    const xri = request.headers.get('x-real-ip');
    if (xri) return xri.trim();
    return 'unknown';
}

function rateLimit(ip: string): { allowed: boolean; retryAfterMs: number } {
    const now = Date.now();
    const bucket = ipBuckets.get(ip);
    if (!bucket || bucket.resetAt <= now) {
        ipBuckets.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
        return { allowed: true, retryAfterMs: 0 };
    }
    bucket.count += 1;
    if (bucket.count > RATE_LIMIT_MAX) {
        return { allowed: false, retryAfterMs: Math.max(0, bucket.resetAt - now) };
    }
    return { allowed: true, retryAfterMs: 0 };
}

// Sabit gecikme — timing-attack ile var/yok ayırt edilmesini zorlaştırır.
const CONSTANT_DELAY_MS = 250;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function POST(request: NextRequest) {
    const ip = getClientIp(request);
    const startedAt = Date.now();

    try {
        const { allowed, retryAfterMs } = rateLimit(ip);
        if (!allowed) {
            console.warn('check-email rate-limited', { ip, retryAfterMs });
            return NextResponse.json(
                { errorCode: 'rate_limited', message: 'Çok fazla istek. Lütfen biraz bekleyin.' },
                { status: 429, headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) } }
            );
        }

        const body = await request.json().catch(() => ({}));
        const rawEmail = (body?.email as string | undefined) || '';
        const email = rawEmail.trim().toLowerCase();

        if (!email || !isValidEmail(email)) {
            // Yine de sabit gecikmeyi uygula — bad payload ile timing ayrımı yapılmasın.
            const elapsed = Date.now() - startedAt;
            if (elapsed < CONSTANT_DELAY_MS) await sleep(CONSTANT_DELAY_MS - elapsed);
            return NextResponse.json(
                { errorCode: 'invalid_email', message: 'Geçersiz e-posta adresi' },
                { status: 400 }
            );
        }

        // Eski telefon-pseudo-email (+90...@hangel.app) ile login'e izin vermiyoruz.
        if (email.endsWith('@hangel.app')) {
            const elapsed = Date.now() - startedAt;
            if (elapsed < CONSTANT_DELAY_MS) await sleep(CONSTANT_DELAY_MS - elapsed);
            return NextResponse.json({ exists: false, unsupported: true });
        }

        const auth = getAdminAuth();

        // NOT: P1-1 — Frontend (`/login/selection`) bu `exists` flag'ine göre
        // login vs register adımına dallanıyor. Mevcut UX'i bozmamak için
        // var/yok sinyalini koruyoruz; ancak hem rate-limit hem sabit gecikme
        // ile enumeration cost'unu yükseltiyoruz. Tam normalizasyon (response
        // homojenleştirme + frontend redesign) P1-1b altında.
        let exists = false;
        let name = '';
        try {
            const user = await auth.getUserByEmail(email);
            exists = true;
            name = user.displayName || '';
        } catch (error: unknown) {
            const code = typeof error === 'object' && error !== null && 'code' in error
                ? (error as { code?: string }).code
                : undefined;
            if (code !== 'auth/user-not-found') {
                throw error;
            }
        }

        // Sabit gecikme — auth.getUserByEmail latency'si var/yok'a göre değişebilir.
        const elapsed = Date.now() - startedAt;
        if (elapsed < CONSTANT_DELAY_MS) await sleep(CONSTANT_DELAY_MS - elapsed);

        return NextResponse.json({ exists, name });
    } catch (error: unknown) {
        console.error('check-email error', { ip, error });
        const elapsed = Date.now() - startedAt;
        if (elapsed < CONSTANT_DELAY_MS) await sleep(CONSTANT_DELAY_MS - elapsed);
        return NextResponse.json(
            { errorCode: 'internal_error', message: 'Kontrol başarısız' },
            { status: 500 }
        );
    }
}
