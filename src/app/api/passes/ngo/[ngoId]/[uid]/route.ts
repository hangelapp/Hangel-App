/**
 * Apple Wallet — STK Üyelik Kartı endpoint.
 *
 * GET /api/passes/ngo/{ngoId}/{uid}
 *
 * Bearer auth zorunlu. İstek sahibi yalnızca kendi `uid`'i için kart alabilir.
 * STK'nın var olduğu ve kullanıcının o STK ile bir ilişkisi olduğu (takip,
 * üyelik, bağış kaydı) doğrulanır.
 *
 * Cert eksikse 503 — production'da .p12 yüklendiğinde otomatik çalışır.
 */
import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { generateNgoCard } from '@/lib/passkit/ngo-card';

interface UserDoc {
  name?: string;
  fullName?: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  followingNgos?: string[];
  supportedNgos?: string[];
}

interface NgoDoc {
  name?: string;
  shortName?: string;
}

interface MembershipDoc {
  membershipType?: string;
  role?: string;
  joinedAt?: { toDate?: () => Date };
  createdAt?: { toDate?: () => Date };
}

function resolveFullName(u: UserDoc): string {
  if (u.fullName) return u.fullName;
  if (u.name) return u.name;
  if (u.displayName) return u.displayName;
  const combined = [u.firstName, u.lastName].filter(Boolean).join(' ').trim();
  if (combined) return combined;
  return u.username ?? 'hangel Üyesi';
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ ngoId: string; uid: string }> },
): Promise<NextResponse> {
  const { ngoId, uid: targetUid } = await ctx.params;
  if (!ngoId || !targetUid) {
    return NextResponse.json({ ok: false, errorCode: 'MISSING_PARAMS', message: 'STK veya kullanıcı kimliği eksik.' }, { status: 400 });
  }

  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ ok: false, errorCode: 'NO_AUTH', message: 'Giriş gerekli.' }, { status: 401 });
  }
  let authUid: string;
  try {
    const decoded = await getAdminAuth().verifyIdToken(authHeader.slice('Bearer '.length).trim());
    authUid = decoded.uid;
  } catch {
    return NextResponse.json({ ok: false, errorCode: 'INVALID_TOKEN', message: 'Geçersiz oturum.' }, { status: 401 });
  }
  if (authUid !== targetUid) {
    return NextResponse.json({ ok: false, errorCode: 'FORBIDDEN', message: 'Sadece kendi kartınızı oluşturabilirsiniz.' }, { status: 403 });
  }

  const db = getAdminFirestore();
  const [userSnap, ngoSnap, membershipSnap] = await Promise.all([
    db.collection(COLLECTIONS.users).doc(targetUid).get(),
    db.collection(COLLECTIONS.ngos).doc(ngoId).get(),
    db.collection(COLLECTIONS.ngos).doc(ngoId).collection('members').doc(targetUid).get().catch(() => null),
  ]);

  if (!userSnap.exists) {
    return NextResponse.json({ ok: false, errorCode: 'USER_NOT_FOUND', message: 'Kullanıcı bulunamadı.' }, { status: 404 });
  }
  if (!ngoSnap.exists) {
    return NextResponse.json({ ok: false, errorCode: 'NGO_NOT_FOUND', message: 'STK bulunamadı.' }, { status: 404 });
  }

  const u = userSnap.data() as UserDoc;
  const ngo = ngoSnap.data() as NgoDoc;

  // Üyelik / destekçilik doğrulaması: doğrudan members sub-collection varsa
  // o, yoksa user doc'undaki followingNgos/supportedNgos listesi.
  const memberDoc: MembershipDoc | null = membershipSnap?.exists
    ? (membershipSnap.data() as MembershipDoc)
    : null;
  const isFollowing = (u.followingNgos ?? []).includes(ngoId)
    || (u.supportedNgos ?? []).includes(ngoId);

  if (!memberDoc && !isFollowing) {
    return NextResponse.json({
      ok: false,
      errorCode: 'NOT_A_MEMBER',
      message: 'Bu STK ile bağlantınız bulunamadı. Önce takip edin veya üye olun.',
    }, { status: 403 });
  }

  const membershipType = memberDoc?.membershipType
    ?? memberDoc?.role
    ?? (isFollowing ? 'Destekçi' : 'Üye');
  const joinDate = memberDoc?.joinedAt?.toDate?.()
    ?? memberDoc?.createdAt?.toDate?.()
    ?? undefined;

  try {
    const buffer = await generateNgoCard({
      uid: targetUid,
      ngoId,
      fullName: resolveFullName(u),
      ngoName: ngo.shortName ?? ngo.name ?? 'STK',
      membershipType,
      joinDate,
      authenticationToken: randomBytes(16).toString('hex'),
    });

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'content-type': 'application/vnd.apple.pkpass',
        'content-disposition': `attachment; filename="hangel-ngo-${ngoId}.pkpass"`,
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
