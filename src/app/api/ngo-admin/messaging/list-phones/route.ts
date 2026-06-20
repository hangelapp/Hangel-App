/**
 * GET /api/ngo-admin/messaging/list-phones?listId={id}
 *
 * Bir santralContactLists kaydındaki tüm telefon numaralarını döner — toplu SMS
 * gönderimi için. /api/ngo-admin/call-center/contacts pagination kapsamına
 * (50/page) yakalanmadan tek istekte toplar; toplam sınırı `MAX_PHONES`.
 *
 * Yanıt: { phones: string[] }  (E.164 +90... normalize edilmemiş, ham phone alanı)
 * Yetki: ngo-admin + ngoId scope.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_PHONES = 2000;

async function authorize(req: NextRequest): Promise<{ ngoId: string } | null> {
  const idToken = (req.headers.get('authorization') || '').replace(/^Bearer /, '');
  if (!idToken) return null;
  try {
    const decoded = (await getAdminAuth().verifyIdToken(idToken)) as { uid: string };
    const snap = await getAdminFirestore().collection(COLLECTIONS.users).doc(decoded.uid).get();
    const d = snap.data() as { role?: string; managedNgoId?: string } | undefined;
    if (!d?.managedNgoId) return null;
    if (d.role !== 'ngo-admin' && d.role !== 'super-admin') return null;
    return { ngoId: d.managedNgoId };
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const ctx = await authorize(req);
  if (!ctx) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'NGO admin yetkisi gerekli.' }, { status: 403 });
  }
  const listId = (new URL(req.url).searchParams.get('listId') || '').trim();
  if (!listId) {
    return NextResponse.json({ errorCode: 'BAD_INPUT', message: 'listId gerekli.' }, { status: 400 });
  }
  const db = getAdminFirestore();
  try {
    const snap = await db
      .collection(COLLECTIONS.santralContacts)
      .where('ngoId', '==', ctx.ngoId)
      .where('listIds', 'array-contains', listId)
      .limit(MAX_PHONES)
      .get();
    const phones = snap.docs
      .map((d) => {
        const data = d.data() as Record<string, unknown>;
        return typeof data.phone === 'string' ? data.phone : '';
      })
      .filter((p) => p.length > 0);
    return NextResponse.json({ phones: Array.from(new Set(phones)) });
  } catch (e) {
    return NextResponse.json(
      { errorCode: 'QUERY_FAILED', message: e instanceof Error ? e.message : 'Sorgu başarısız.' },
      { status: 500 },
    );
  }
}
