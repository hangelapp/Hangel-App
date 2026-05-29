/**
 * POST /api/auth/check-registration
 *
 * Body: { email?: string, phone?: string, phoneCountryCode?: string }
 *
 * Kayıt ekranında MÜKERRER kayıt önlemek için: girilen e-posta veya telefon
 * zaten bir hesapta var mı? Hem Firebase Auth (getUserByEmail / ByPhoneNumber)
 * hem de Firestore (personalInfo.email / personalInfo.phone) kontrol edilir.
 *
 * Dönüş: { ok: true, emailExists: boolean, phoneExists: boolean }
 *
 * Auth gerekmez (kayıt öncesi çağrılır) ama IP başına rate-limit + sabit gecikme
 * ile PII enumeration maliyeti yükseltilir. Var/yok dışında detay sızdırılmaz.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { checkRateLimit } from '@/lib/rate-limit';
import { phoneMatchCandidates, toE164 } from '@/lib/phone-normalize';

export const runtime = 'nodejs';

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;
const CONSTANT_DELAY_MS = 250;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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
    const ip = getClientIp(req);
    const startedAt = Date.now();
    const settle = async <T>(payload: T, status = 200) => {
        const elapsed = Date.now() - startedAt;
        if (elapsed < CONSTANT_DELAY_MS) await sleep(CONSTANT_DELAY_MS - elapsed);
        return NextResponse.json(payload, { status });
    };

    try {
        const { allowed } = await checkRateLimit({
            bucket: 'check-registration',
            key: ip,
            limit: RATE_LIMIT_MAX,
            windowMs: RATE_LIMIT_WINDOW_MS,
        });
        if (!allowed) {
            return NextResponse.json(
                { ok: false, errorCode: 'RATE_LIMITED', message: 'Çok fazla istek. Lütfen biraz bekleyin.' },
                { status: 429 }
            );
        }

        const body = await req.json().catch(() => null);
        const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
        const rawPhone = typeof body?.phone === 'string' ? body.phone : '';
        const phoneCountryCode = typeof body?.phoneCountryCode === 'string' ? body.phoneCountryCode : '+90';
        const phoneCandidates = phoneMatchCandidates(rawPhone, phoneCountryCode);
        const fullPhone = toE164(rawPhone, phoneCountryCode);

        const adminAuth = getAdminAuth();
        const db = getAdminFirestore();

        let emailExists = false;
        let phoneExists = false;

        if (email && isValidEmail(email) && !email.endsWith('@hangel.app')) {
            try {
                await adminAuth.getUserByEmail(email);
                emailExists = true;
            } catch { /* auth/user-not-found — Firestore'a bak */ }
            if (!emailExists) {
                const snap = await db.collection(COLLECTIONS.users)
                    .where('personalInfo.email', '==', email)
                    .limit(1)
                    .get();
                emailExists = !snap.empty;
            }
        }

        if (phoneCandidates.length > 0) {
            if (fullPhone) {
                try {
                    await adminAuth.getUserByPhoneNumber(fullPhone);
                    phoneExists = true;
                } catch { /* auth'ta yok — Firestore'a bak */ }
            }
            if (!phoneExists) {
                // Olası tüm yazımları (kanonik / baştaki 0 / ülke kodlu) tek sorguda ara.
                const snap = await db.collection(COLLECTIONS.users)
                    .where('personalInfo.phone', 'in', phoneCandidates)
                    .limit(1)
                    .get();
                phoneExists = !snap.empty;
            }
        }

        return settle({ ok: true, emailExists, phoneExists });
    } catch (e) {
        console.error('[check-registration] internal error', e);
        // Fail-open: kontrol hatasında kayıt akışını kilitleme (client de fail-open).
        return settle({ ok: false, errorCode: 'INTERNAL_ERROR', emailExists: false, phoneExists: false }, 200);
    }
}
