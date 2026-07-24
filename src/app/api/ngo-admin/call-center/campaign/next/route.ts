/**
 * GET /api/ngo-admin/call-center/campaign/next?listId=...&exclude=id1,id2
 *
 * Kampanya (peş peşe) arama modu. Bir listedeki "aranacak sıradaki kişiyi"
 * döndürür. Öncelik: hiç aranmamış > cevapsız/meşgul > en az denenmiş.
 * Zaten olumlu sonuçlananlar (answered / wrong-number) atlanır.
 * exclude: bu oturumda dokunulmuş id'ler (tekrar getirmemek için).
 *
 * Yanıt: { contact: {id,name,phone} | null, remaining: number }
 * KVKK: yalnız caller'ın kendi tenant'ı.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Bu sonuçlar "tamamlandı" sayılır; kampanyada tekrar aranmaz.
const DONE_DISPOSITIONS = new Set(['answered', 'wrong-number']);
// Öncelik sırası: küçük değer önce aranır.
function priority(disp: string | null, attempts: number): number {
  if (!disp) return 0;                              // hiç aranmamış → en önce
  if (disp === 'no-answer' || disp === 'busy') return 1 + attempts; // tekrar denenir
  if (disp === 'callback-requested') return 1 + attempts;
  return 100 + attempts;                            // diğerleri en sona
}

interface Ctx { uid: string; ngoId: string; }

async function authorize(req: NextRequest): Promise<Ctx | null> {
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

export async function GET(req: NextRequest) {
  const ctx = await authorize(req);
  if (!ctx) return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Yetki gerekli.' }, { status: 403 });

  const url = new URL(req.url);
  const listId = (url.searchParams.get('listId') || '').trim();
  if (!listId) return NextResponse.json({ errorCode: 'BAD_INPUT', message: 'listId gerekli.' }, { status: 400 });
  const exclude = new Set((url.searchParams.get('exclude') || '').split(',').map((s) => s.trim()).filter(Boolean));

  const db = getAdminFirestore();
  const snap = await db.collection(COLLECTIONS.santralContacts)
    .where('ngoId', '==', ctx.ngoId)
    .where('listIds', 'array-contains', listId)
    .get()
    .catch(() => null);

  if (!snap) return NextResponse.json({ contact: null, remaining: 0 });

  const candidates = snap.docs
    .map((d) => {
      const data = d.data() as Record<string, unknown>;
      const disp = typeof data.lastDisposition === 'string' ? data.lastDisposition : null;
      const attempts = typeof data.attempts === 'number' ? data.attempts : 0;
      return {
        id: d.id,
        name: typeof data.name === 'string' ? data.name : '',
        phone: typeof data.phone === 'string' ? data.phone : '',
        disp, attempts,
      };
    })
    .filter((c) => c.phone && !exclude.has(c.id) && !(c.disp && DONE_DISPOSITIONS.has(c.disp)));

  candidates.sort((a, b) => priority(a.disp, a.attempts) - priority(b.disp, b.attempts));

  const next = candidates[0] || null;
  return NextResponse.json({
    contact: next ? { id: next.id, name: next.name, phone: next.phone } : null,
    remaining: candidates.length,
  });
}
