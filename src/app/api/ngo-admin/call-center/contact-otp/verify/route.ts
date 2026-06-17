/**
 * POST /api/ngo-admin/call-center/contact-otp/verify
 *
 * STK admin'i, çağrı merkezi iletişim sorumlusuna gönderilen 6 haneli kodu
 * doğrular. Sadece telefon sahipliğini doğrular — AUTH KULLANICISI
 * OLUŞTURMAZ/DOKUNMAZ.
 *
 * Doc id: send route'u ile aynı prefix'li hash (`hashPhone('santral:' + fullPhone)`),
 * channel === 'santral-contact'.
 *
 * Body: { phone: string, code: string }
 * Yanıt: { ok: true, verified: true } | { errorCode, message }
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { canonicalPhone } from '@/lib/phone-normalize';
import crypto from 'crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_ATTEMPTS = 5;

interface CallerContext {
  uid: string;
  ngoId: string;
  role?: string;
  email?: string;
}

async function authorize(req: NextRequest): Promise<CallerContext | null> {
  const authHeader = req.headers.get('authorization') || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!idToken) return null;
  try {
    const decoded = (await getAdminAuth().verifyIdToken(idToken)) as { uid: string; role?: string; email?: string };
    const snap = await getAdminFirestore().collection(COLLECTIONS.users).doc(decoded.uid).get();
    if (!snap.exists) return null;
    const d = snap.data() as { role?: string; managedNgoId?: string };
    if (!d?.managedNgoId) return null;
    if (d.role !== 'ngo-admin' && d.role !== 'super-admin') return null;
    return { uid: decoded.uid, ngoId: d.managedNgoId, role: d.role, email: decoded.email };
  } catch {
    return null;
  }
}

/** Santral kişi-OTP'sine özel, prefix'li hash — wa-login OTP doc id'siyle çakışmaz. */
function santralPhoneHash(fullPhone: string): string {
  return crypto.createHash('sha256').update('santral:' + fullPhone).digest('hex').slice(0, 32);
}

export async function POST(req: NextRequest) {
  const ctx = await authorize(req);
  if (!ctx) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'NGO admin yetkisi gerekli.' }, { status: 403 });
  }

  let body: { phone?: unknown; code?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ errorCode: 'INVALID_INPUT', message: 'Geçersiz telefon.' }, { status: 400 });
  }

  const phone = typeof body?.phone === 'string' ? body.phone : '';
  const code = typeof body?.code === 'string' ? body.code.trim() : '';
  const clean = canonicalPhone(phone, '+90');
  if (!clean || clean.length < 7) {
    return NextResponse.json({ errorCode: 'INVALID_INPUT', message: 'Geçersiz telefon.' }, { status: 400 });
  }
  if (!/^\d{6}$/.test(code)) {
    return NextResponse.json({ errorCode: 'INVALID_INPUT', message: 'Geçersiz kod.' }, { status: 400 });
  }
  const fullPhone = `+90${clean}`;

  try {
    const db = getAdminFirestore();
    const ref = db.collection(COLLECTIONS.otpCodes).doc(santralPhoneHash(fullPhone));
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json(
        { errorCode: 'OTP_EXPIRED', message: 'Kod süresi doldu, tekrar gönderin.' },
        { status: 410 },
      );
    }
    const data = snap.data() as { code?: string; expiresAt?: number; attempts?: number; channel?: string };

    // Yanlış kanal (ör. wa-login doc'u) veya süresi geçmiş → geçersiz say.
    if (data.channel !== 'santral-contact' || (typeof data.expiresAt === 'number' && Date.now() > data.expiresAt)) {
      await ref.delete();
      return NextResponse.json(
        { errorCode: 'OTP_EXPIRED', message: 'Kod süresi doldu, tekrar gönderin.' },
        { status: 410 },
      );
    }

    const attempts = Number(data.attempts) || 0;
    if (attempts >= MAX_ATTEMPTS) {
      await ref.delete();
      return NextResponse.json(
        { errorCode: 'TOO_MANY_ATTEMPTS', message: 'Çok fazla hatalı deneme.' },
        { status: 429 },
      );
    }

    if (data.code !== code) {
      await ref.update({ attempts: FieldValue.increment(1) });
      return NextResponse.json({ errorCode: 'INVALID_CODE', message: 'Kod hatalı.' }, { status: 401 });
    }

    // Doğru — doc'u sil. AUTH KULLANICISI OLUŞTURMA/DOKUNMA.
    await ref.delete();
    return NextResponse.json({ ok: true, verified: true });
  } catch (e) {
    console.error('[santral-contact-otp/verify] internal error', e);
    return NextResponse.json({ errorCode: 'INTERNAL_ERROR', message: 'Sunucu hatası.' }, { status: 500 });
  }
}
