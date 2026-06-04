/**
 * POST /api/auth/link-or-create-authorized
 *
 * Kurumsal kayıt formundaki YETKİLİ KİŞİ için:
 *   - Auth + Firestore'da kullanıcı varsa: existing uid döner (link)
 *   - Yoksa: Firebase Auth user oluşturur + users doc seed eder
 *     + password reset e-postası gönderir (kullanıcı kendi şifresini belirler)
 *
 * Idempotent: aynı email tekrar gelirse mevcut uid döner, "created=false".
 *
 * Body:
 *   { email, name, phone?, phoneCountryCode?, role?, entityType?, orgName? }
 *
 * Response:
 *   { userId, created: boolean }
 *
 * Hata: { errorCode, message }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { checkRateLimit } from '@/lib/rate-limit';
import { FieldValue } from 'firebase-admin/firestore';

export const runtime = 'nodejs';

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getClientIp(request: NextRequest): string {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0]?.trim();
    if (first) return first;
  }
  const xri = request.headers.get('x-real-ip');
  if (xri) return xri.trim();
  return 'unknown';
}

// Random temporary password (16 char alfanumerik). Kullanıcı password reset
// linkiyle hemen kendi şifresini belirler — bu sadece auth account create
// için zorunlu placeholder.
function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let out = '';
  const buf = new Uint8Array(16);
  crypto.getRandomValues(buf);
  for (let i = 0; i < 16; i++) out += chars[buf[i] % chars.length];
  return out;
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  try {
    const { allowed } = await checkRateLimit({
      bucket: 'link-or-create-authorized',
      key: ip,
      limit: 10,
      windowMs: 60_000,
    });
    if (!allowed) {
      return NextResponse.json(
        { errorCode: 'rate_limited', message: 'Çok fazla istek. Lütfen biraz bekleyin.' },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ errorCode: 'bad_body', message: 'Geçersiz istek.' }, { status: 400 });
    }
    const email = String(body.email || '').trim().toLowerCase();
    const name = String(body.name || '').trim();
    const phone = String(body.phone || '').trim();
    const phoneCountryCode = String(body.phoneCountryCode || '+90').trim();
    const role = String(body.role || '').trim();
    const entityType = String(body.entityType || '').trim();
    const orgName = String(body.orgName || '').trim();

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { errorCode: 'invalid_email', message: 'Geçersiz e-posta.' },
        { status: 400 }
      );
    }

    const auth = getAdminAuth();
    const db = getAdminFirestore();

    // 1) Auth'da var mı kontrol et
    let existingUid: string | null = null;
    try {
      const u = await auth.getUserByEmail(email);
      existingUid = u.uid;
    } catch (err: unknown) {
      // user-not-found bekleniyor; diğer hatalarda fail
      const code = (err as { code?: string })?.code;
      if (code !== 'auth/user-not-found') {
        console.warn('link-or-create-authorized: auth lookup error', code);
      }
    }

    if (existingUid) {
      // Var olan kullanıcı — Firestore'da users doc'unu seed/refresh et (idempotent merge)
      try {
        await db.collection(COLLECTIONS.users).doc(existingUid).set(
          {
            email,
            displayName: name || undefined,
            phoneNumber: phone ? `${phoneCountryCode}${phone.replace(/^0+/, '')}` : undefined,
            corporateAuthorizedFor: orgName || undefined,
            corporateRole: role || undefined,
            corporateEntityType: entityType || undefined,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      } catch (e) {
        console.warn('link-or-create-authorized: existing user firestore merge failed', e);
      }
      return NextResponse.json({ userId: existingUid, created: false });
    }

    // 2) Yoksa Firebase Auth user oluştur
    let newUser;
    try {
      newUser = await auth.createUser({
        email,
        emailVerified: false,
        password: generateTempPassword(),
        displayName: name || undefined,
        phoneNumber: phone ? `${phoneCountryCode}${phone.replace(/^0+/, '')}` : undefined,
        disabled: false,
      });
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      const msg = (err as { message?: string })?.message;
      // Email-already-exists race condition fallback
      if (code === 'auth/email-already-exists') {
        try {
          const u = await auth.getUserByEmail(email);
          return NextResponse.json({ userId: u.uid, created: false });
        } catch {
          // ignore — düş aşağıya
        }
      }
      // Phone-already-exists: telefonu olmadan retry et
      if (code === 'auth/phone-number-already-exists' && phone) {
        try {
          newUser = await auth.createUser({
            email,
            emailVerified: false,
            password: generateTempPassword(),
            displayName: name || undefined,
            disabled: false,
          });
        } catch (e2) {
          console.error('link-or-create-authorized: create without phone failed', e2);
          return NextResponse.json(
            { errorCode: 'create_failed', message: 'Kullanıcı oluşturulamadı.' },
            { status: 500 }
          );
        }
      } else {
        console.error('link-or-create-authorized: createUser failed', code, msg);
        return NextResponse.json(
          { errorCode: 'create_failed', message: 'Kullanıcı oluşturulamadı.' },
          { status: 500 }
        );
      }
    }

    const uid = newUser!.uid;

    // 3) Firestore users doc'unu seed et
    try {
      await db.collection(COLLECTIONS.users).doc(uid).set(
        {
          email,
          displayName: name || '',
          phoneNumber: phone ? `${phoneCountryCode}${phone.replace(/^0+/, '')}` : '',
          corporateAuthorizedFor: orgName || '',
          corporateRole: role || '',
          corporateEntityType: entityType || '',
          source: 'corporate-authorized',
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
          impactScore: 0,
        },
        { merge: true }
      );
    } catch (e) {
      console.warn('link-or-create-authorized: users doc seed failed', e);
    }

    // 4) Password reset e-postası — Firebase Auth Console-template'iyle gönder
    // generatePasswordResetLink + Firebase'in built-in email gönderimi.
    try {
      // sendPasswordResetEmail admin'de doğrudan yok; client SDK üzerinden veya
      // generatePasswordResetLink + ayrı transport ile. Şimdilik link üret +
      // notifications koleksiyonuna inbox mesajı ekle.
      const link = await auth.generatePasswordResetLink(email);
      try {
        await db.collection(COLLECTIONS.notifications).add({
          userId: uid,
          type: 'password_setup',
          title: 'Şifrenizi belirleyin',
          body: `${orgName ? orgName + ' kurumsal başvurusu için ' : ''}hangel hesabınız oluşturuldu. Şifrenizi belirlemek için bağlantıya tıklayın.`,
          actionUrl: link,
          read: false,
          createdAt: FieldValue.serverTimestamp(),
        });
      } catch (e) {
        console.warn('link-or-create-authorized: notification add failed', e);
      }
    } catch (e) {
      console.warn('link-or-create-authorized: reset link failed', e);
    }

    return NextResponse.json({ userId: uid, created: true });
  } catch (err) {
    console.error('link-or-create-authorized: unexpected', err);
    return NextResponse.json(
      { errorCode: 'internal_error', message: 'Beklenmeyen hata.' },
      { status: 500 }
    );
  }
}
