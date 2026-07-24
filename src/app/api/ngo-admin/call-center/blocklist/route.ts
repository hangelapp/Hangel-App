/**
 * GET / POST / DELETE /api/ngo-admin/call-center/blocklist
 *
 * STK'nın kara listesi (rahatsız etme). Bu numaralardan gelen çağrılar
 * resolve API'sinde 'hangup' ile karşılanır — panel hiç çalmaz.
 * ngoCallCenter/{ngoId}.blocklist: string[] (E.164 / digits).
 *
 * GET    → { numbers: string[] }
 * POST   { number } → ekle
 * DELETE ?number=... → çıkar
 * KVKK: yalnız caller'ın managedNgoId'si.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { normalizePhoneTr } from '@/lib/santral/normalize-phone';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NGO_CALL_CENTER = 'ngoCallCenter';

interface CallerContext { uid: string; ngoId: string; }

async function authorize(req: NextRequest): Promise<CallerContext | null> {
  const authHeader = req.headers.get('authorization') || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!idToken) return null;
  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken);
    const snap = await getAdminFirestore().collection(COLLECTIONS.users).doc(decoded.uid).get();
    if (!snap.exists) return null;
    const d = snap.data() as { role?: string; managedNgoId?: string; managedBrandId?: string; managedClubId?: string };
    if (d.role !== 'ngo-admin' && d.role !== 'super-admin') return null;
    const isSuperAdmin = d.role === 'super-admin';

    const hdrKindRaw = req.headers.get('x-org-kind');
    const hdrKind = (hdrKindRaw === 'ngo' || hdrKindRaw === 'brand' || hdrKindRaw === 'club') ? hdrKindRaw : undefined;
    const hdrOrgId = req.headers.get('x-org-id') || undefined;

    let ngoId: string | undefined;
    if (hdrOrgId && hdrKind) {
      const isMember =
        (hdrKind === 'ngo' && d.managedNgoId === hdrOrgId) ||
        (hdrKind === 'brand' && d.managedBrandId === hdrOrgId) ||
        (hdrKind === 'club' && d.managedClubId === hdrOrgId);
      if (!isMember && !isSuperAdmin) return null;
      ngoId = hdrOrgId;
    } else {
      ngoId = d.managedNgoId || d.managedBrandId || d.managedClubId;
    }
    if (!ngoId) return null;
    return { uid: decoded.uid, ngoId };
  } catch {
    return null;
  }
}

async function getNumbers(ngoId: string): Promise<string[]> {
  const snap = await getAdminFirestore().collection(NGO_CALL_CENTER).doc(ngoId).get();
  const d = snap.data() as { blocklist?: unknown } | undefined;
  return Array.isArray(d?.blocklist) ? (d!.blocklist as unknown[]).filter((x): x is string => typeof x === 'string') : [];
}

export async function GET(req: NextRequest) {
  const ctx = await authorize(req);
  if (!ctx) return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Yetki gerekli.' }, { status: 403 });
  return NextResponse.json({ numbers: await getNumbers(ctx.ngoId) });
}

export async function POST(req: NextRequest) {
  const ctx = await authorize(req);
  if (!ctx) return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Yetki gerekli.' }, { status: 403 });
  let body: { number?: unknown };
  try { body = await req.json(); } catch { body = {}; }
  const raw = typeof body.number === 'string' ? body.number : '';
  const num = normalizePhoneTr(raw) || raw.replace(/[^0-9+]/g, '');
  if (!num) return NextResponse.json({ errorCode: 'BAD_NUMBER', message: 'Geçerli bir numara girin.' }, { status: 400 });
  await getAdminFirestore().collection(NGO_CALL_CENTER).doc(ctx.ngoId).set(
    { blocklist: FieldValue.arrayUnion(num) }, { merge: true },
  );
  return NextResponse.json({ ok: true, numbers: await getNumbers(ctx.ngoId) });
}

export async function DELETE(req: NextRequest) {
  const ctx = await authorize(req);
  if (!ctx) return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Yetki gerekli.' }, { status: 403 });
  const num = new URL(req.url).searchParams.get('number') || '';
  if (!num) return NextResponse.json({ errorCode: 'BAD_NUMBER', message: 'Numara gerekli.' }, { status: 400 });
  await getAdminFirestore().collection(NGO_CALL_CENTER).doc(ctx.ngoId).set(
    { blocklist: FieldValue.arrayRemove(num) }, { merge: true },
  );
  return NextResponse.json({ ok: true, numbers: await getNumbers(ctx.ngoId) });
}
