/**
 * Apple Wallet — Bağışçı Kartı endpoint.
 *
 * GET /api/passes/donor/{uid}
 *
 * Bearer auth zorunlu. Sadece istek sahibi kendi `uid`'ine ait kart talep
 * edebilir (cross-user erişim 403). Cevap: `application/vnd.apple.pkpass`
 * binary; iPhone Safari "Add to Wallet" dialog'u açar.
 *
 * Cert eksikse 503 + PASSKIT_NOT_CONFIGURED — .p12 production ortamında
 * yüklendiğinde otomatik çalışır (kod değişikliği gerekmez).
 */
import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { generateDonorCard } from '@/lib/passkit/donor-card';

interface UserDoc {
  name?: string;
  fullName?: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  stats?: { totalDonation?: number };
  totalDonation?: number;
  joinDate?: string | { toDate?: () => Date };
  createdAt?: { toDate?: () => Date };
}

function resolveFullName(u: UserDoc): string {
  if (u.fullName) return u.fullName;
  if (u.name) return u.name;
  if (u.displayName) return u.displayName;
  const combined = [u.firstName, u.lastName].filter(Boolean).join(' ').trim();
  if (combined) return combined;
  return u.username ?? 'hangel Bağışçısı';
}

function resolveDonorId(u: UserDoc, uid: string): string {
  return u.username ?? uid.slice(0, 8);
}

function resolveMemberSinceYear(u: UserDoc): number | undefined {
  const join = u.joinDate;
  if (typeof join === 'string' && join.length >= 4) {
    const year = Number.parseInt(join.slice(0, 4), 10);
    if (!Number.isNaN(year)) return year;
  }
  if (join && typeof join === 'object' && typeof join.toDate === 'function') {
    return join.toDate().getFullYear();
  }
  const created = u.createdAt?.toDate?.();
  if (created) return created.getFullYear();
  return undefined;
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ uid: string }> },
): Promise<NextResponse> {
  const { uid: targetUid } = await ctx.params;
  if (!targetUid) {
    return NextResponse.json({ ok: false, errorCode: 'NO_UID', message: 'Kullanıcı kimliği eksik.' }, { status: 400 });
  }

  // Token: Authorization header VEYA ?token= query. Query desteği şart çünkü iOS'ta
  // .pkpass'i sistem Safari'sinde açmak gerekiyor (WKWebView blob'dan Wallet açamaz)
  // ve harici tarayıcıya header gönderemeyiz → token URL'de taşınır (kısa ömürlü).
  const authHeader = req.headers.get('authorization');
  const queryToken = new URL(req.url).searchParams.get('token')?.trim();
  const idToken = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length).trim() : (queryToken || '');
  if (!idToken) {
    return NextResponse.json({ ok: false, errorCode: 'NO_AUTH', message: 'Giriş gerekli.' }, { status: 401 });
  }
  let authUid: string;
  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken);
    authUid = decoded.uid;
  } catch {
    return NextResponse.json({ ok: false, errorCode: 'INVALID_TOKEN', message: 'Geçersiz oturum.' }, { status: 401 });
  }
  if (authUid !== targetUid) {
    return NextResponse.json({ ok: false, errorCode: 'FORBIDDEN', message: 'Sadece kendi kartınızı oluşturabilirsiniz.' }, { status: 403 });
  }

  const db = getAdminFirestore();
  const userSnap = await db.collection(COLLECTIONS.users).doc(targetUid).get();
  if (!userSnap.exists) {
    return NextResponse.json({ ok: false, errorCode: 'USER_NOT_FOUND', message: 'Kullanıcı bulunamadı.' }, { status: 404 });
  }
  const u = userSnap.data() as UserDoc;
  const totalDonation = typeof u.stats?.totalDonation === 'number'
    ? u.stats.totalDonation
    : (typeof u.totalDonation === 'number' ? u.totalDonation : undefined);

  try {
    const buffer = await generateDonorCard({
      uid: targetUid,
      fullName: resolveFullName(u),
      donorId: resolveDonorId(u, targetUid),
      totalDonationsTry: totalDonation,
      memberSinceYear: resolveMemberSinceYear(u),
      authenticationToken: randomBytes(16).toString('hex'),
    });

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'content-type': 'application/vnd.apple.pkpass',
        'content-disposition': `attachment; filename="hangel-donor-${targetUid}.pkpass"`,
        'cache-control': 'no-store',
      },
    });
  } catch (e) {
    if (e instanceof Error && e.message === 'PASSKIT_CERTS_MISSING') {
      return NextResponse.json({
        ok: false,
        errorCode: 'PASSKIT_NOT_CONFIGURED',
        message: 'PassKit signing not configured.',
      }, { status: 503 });
    }
    return NextResponse.json({
      ok: false,
      errorCode: 'PKPASS_GENERATION_FAILED',
      message: 'Pass üretilemedi.',
    }, { status: 500 });
  }
}
