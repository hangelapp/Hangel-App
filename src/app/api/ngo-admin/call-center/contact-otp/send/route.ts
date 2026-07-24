/**
 * POST /api/ngo-admin/call-center/contact-otp/send
 *
 * STK admin'i, çağrı merkezi (santral) iletişim sorumlusunu TELEFONUYLA
 * yetkilendirmek için o numaraya 6 haneli bir SMS doğrulama kodu gönderir.
 *
 * ÖNEMLİ: Bu OTP bir AUTH KULLANICISI OLUŞTURMAZ/DEĞİŞTİRMEZ. Yalnızca
 * iletişim sorumlusunun telefon sahipliğini doğrulamak içindir.
 *
 * Doc id çakışması: WhatsApp login OTP'si `otp_codes/{phoneHash}` kullanır.
 * Aynı telefon için çakışmamak adına burada doc id `hashPhone('santral:' + fullPhone)`
 * prefix'li hash ile ayrılır; channel alanı 'santral-contact'tır.
 *
 * Body: { phone: string, contactName?: string }
 * Yanıt: { ok: true, masked } | { errorCode, message }
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { checkRateLimit } from '@/lib/rate-limit';
import { canonicalPhone } from '@/lib/phone-normalize';
import { getSmsProvider } from '@/lib/messaging/providers/sms';
import { sendWhatsAppOtp } from '@/lib/whatsapp';
import crypto from 'crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const OTP_TTL_MS = 10 * 60 * 1000; // 10 dk
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5;

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

  const hdrKindRaw = req.headers.get('x-org-kind');
  const hdrKind = (hdrKindRaw === 'ngo' || hdrKindRaw === 'brand' || hdrKindRaw === 'club') ? hdrKindRaw : undefined;
  const hdrOrgId = req.headers.get('x-org-id') || undefined;

  try {
    const decoded = (await getAdminAuth().verifyIdToken(idToken)) as { uid: string; role?: string; email?: string };
    const snap = await getAdminFirestore().collection(COLLECTIONS.users).doc(decoded.uid).get();
    if (!snap.exists) return null;
    const d = snap.data() as {
      role?: string;
      managedNgoId?: string;
      managedBrandId?: string;
      managedClubId?: string;
    };
    if (d.role !== 'ngo-admin' && d.role !== 'super-admin') return null;

    const isSuperAdmin = d.role === 'super-admin';

    let resolvedOrgId: string | undefined;
    if (hdrOrgId && hdrKind) {
      // Aktif kurum header'dan geldi: caller'ın o kuruma üyeliğini doğrula (super-admin hariç).
      const isMember =
        (hdrKind === 'ngo' && d.managedNgoId === hdrOrgId) ||
        (hdrKind === 'brand' && d.managedBrandId === hdrOrgId) ||
        (hdrKind === 'club' && d.managedClubId === hdrOrgId);
      if (!isMember && !isSuperAdmin) return null;
      resolvedOrgId = hdrOrgId;
    } else {
      // Eski davranış: ilk dolu olan (ngo → brand → club).
      resolvedOrgId = d.managedNgoId || d.managedBrandId || d.managedClubId;
    }

    if (!resolvedOrgId) return null;
    return { uid: decoded.uid, ngoId: resolvedOrgId, role: d.role, email: decoded.email };
  } catch {
    return null;
  }
}

/** Santral kişi-OTP'sine özel, prefix'li hash — wa-login OTP doc id'siyle çakışmaz. */
function santralPhoneHash(fullPhone: string): string {
  return crypto.createHash('sha256').update('santral:' + fullPhone).digest('hex').slice(0, 32);
}

/** +90 5XX *** XX 12 benzeri maskeleme — orta haneleri gizler, son 2 hane açık. */
function maskPhone(fullPhone: string): string {
  // fullPhone: "+905384009090"
  const cc = fullPhone.slice(0, 3); // +90
  const rest = fullPhone.slice(3); // 5384009090
  if (rest.length < 4) return cc + ' ' + rest.replace(/\d/g, '*');
  const head = rest.slice(0, 1); // 5
  const tail = rest.slice(-2); // 90
  return `${cc} ${head}XX *** XX ${tail}`;
}

export async function POST(req: NextRequest) {
  const ctx = await authorize(req);
  if (!ctx) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'NGO admin yetkisi gerekli.' }, { status: 403 });
  }

  let body: { phone?: unknown; contactName?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ errorCode: 'INVALID_INPUT', message: 'Geçersiz telefon.' }, { status: 400 });
  }

  const phone = typeof body?.phone === 'string' ? body.phone : '';
  const clean = canonicalPhone(phone, '+90');
  if (!clean || clean.length < 7) {
    return NextResponse.json({ errorCode: 'INVALID_INPUT', message: 'Geçersiz telefon.' }, { status: 400 });
  }
  const fullPhone = `+90${clean}`;

  // Rate limit: hem STK başına hem telefon başına (abuse koruma).
  const ngoLimit = await checkRateLimit({
    bucket: 'santral-contact-otp-send',
    key: ctx.ngoId,
    limit: RATE_LIMIT_MAX,
    windowMs: RATE_LIMIT_WINDOW_MS,
  });
  const phoneLimit = await checkRateLimit({
    bucket: 'santral-contact-otp-send',
    key: fullPhone,
    limit: RATE_LIMIT_MAX,
    windowMs: RATE_LIMIT_WINDOW_MS,
  });
  if (!ngoLimit.allowed || !phoneLimit.allowed) {
    return NextResponse.json(
      { errorCode: 'RATE_LIMIT', message: 'Çok fazla deneme. Biraz sonra tekrar deneyin.' },
      { status: 429 },
    );
  }

  const otp = crypto.randomInt(100000, 1000000).toString();
  const docId = santralPhoneHash(fullPhone);

  try {
    const db = getAdminFirestore();
    await db.collection(COLLECTIONS.otpCodes).doc(docId).set({
      code: otp, // wa-otp ile aynı: plaintext saklanır
      channel: 'santral-contact',
      ngoId: ctx.ngoId,
      phone: fullPhone,
      attempts: 0,
      createdAt: FieldValue.serverTimestamp(),
      expiresAt: Date.now() + OTP_TTL_MS,
    });

    // Teslim kanalı: NETGSM varsa SMS; yoksa Meta WhatsApp (prod'da configli);
    // ikisi de yoksa test için kodu ekrana döndür.
    const provider = getSmsProvider();
    let channel: 'sms' | 'whatsapp' | 'screen' = 'sms';
    let devCode: string | undefined;

    if (provider.driver !== 'mock') {
      const sendResult = await provider.send({
        to: fullPhone,
        body: `hangel çağrı merkezi yetkilendirme kodunuz: ${otp}. Kod 10 dakika geçerlidir.`,
        senderId: process.env.NETGSM_HEADER || 'hangel',
        useCase: 'transactional',
      });
      if (!sendResult.ok) {
        const masked = fullPhone.slice(0, -4).replace(/\d/g, '*') + fullPhone.slice(-4);
        console.error('[santral-contact-otp/send] sms failed', { phone: masked, errorCode: sendResult.errorCode });
        return NextResponse.json(
          { errorCode: 'SMS_SEND_FAILED', message: 'Kod gönderilemedi. Lütfen tekrar deneyin.' },
          { status: 503 },
        );
      }
    } else {
      // SMS sağlayıcı mock → gerçek teslim için WhatsApp dene.
      const wa = await sendWhatsAppOtp(fullPhone, otp, 'tr');
      if (wa.ok) {
        channel = 'whatsapp';
      } else {
        // Ne SMS ne WhatsApp teslim edilebildi → test için kodu yanıtta göster.
        channel = 'screen';
        devCode = otp;
        console.warn('[santral-contact-otp/send] sms+whatsapp teslim edilemedi, kod ekranda', { errorCode: wa.errorCode });
      }
    }

    return NextResponse.json({ ok: true, channel, masked: maskPhone(fullPhone), ...(devCode ? { devCode } : {}) });
  } catch (e) {
    console.error('[santral-contact-otp/send] internal error', e);
    return NextResponse.json({ errorCode: 'INTERNAL_ERROR', message: 'Sunucu hatası.' }, { status: 500 });
  }
}
