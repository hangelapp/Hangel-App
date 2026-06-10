/**
 * POST /api/super-admin/transparency/seed-from-docs
 *
 * Kurumsal kayıt onaylanınca, kayıt formunda yüklenen yasal belgeleri (tüzük/senet,
 * faaliyet belgesi) STK'nın şeffaflık endeksine "onaya gönderildi" (status:'pending')
 * olarak ekler. Böylece kayıt-anı belgeler de şeffaflık onay kuyruğuna düşer ve
 * onaylanınca puana dahil olur.
 *
 * transparency/{ownerUid} doc'u owner-only yazılabildiğinden Admin SDK kullanılır.
 *
 * Body: { ownerUid: string, ngoId?: string, documents: Array<{kind?:string; url?:string; name?:string}> }
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { DEFAULT_CRITERIA, type CriteriaItem } from '@/lib/transparency';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Kayıt formu belge "kind" → şeffaflık kriter id'si (DEFAULT_CRITERIA ile uyumlu).
const KIND_TO_CRITERION: Record<string, { id: string; name: string }> = {
  charter: { id: '2', name: 'Tüzük / Vakıf Senedi' },
  activityCertificate: { id: '1', name: 'Faaliyet Belgesi' },
};

async function isSuperAdmin(req: NextRequest): Promise<boolean> {
  const authHeader = req.headers.get('authorization') || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!idToken) return false;
  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken) as { uid: string; role?: string; superAdminPermissions?: unknown };
    if (decoded.role === 'super-admin' || !!decoded.superAdminPermissions) return true;
    const snap = await getAdminFirestore().collection(COLLECTIONS.users).doc(decoded.uid).get();
    const d = snap.data();
    return d?.role === 'super-admin' || (Array.isArray(d?.superAdminPermissions) && d.superAdminPermissions.length > 0);
  } catch { return false; }
}

export async function POST(req: NextRequest) {
  if (!(await isSuperAdmin(req))) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Super-admin yetkisi gerekli.' }, { status: 403 });
  }

  let body: { ownerUid?: string; ngoId?: string; documents?: Array<{ kind?: string; url?: string; name?: string }> };
  try { body = await req.json(); } catch { return NextResponse.json({ errorCode: 'BAD_JSON', message: 'Geçersiz JSON' }, { status: 400 }); }

  const { ownerUid, ngoId } = body;
  const documents = Array.isArray(body.documents) ? body.documents : [];
  if (!ownerUid || typeof ownerUid !== 'string') {
    return NextResponse.json({ errorCode: 'BAD_INPUT', message: 'ownerUid gerekli.' }, { status: 400 });
  }
  if (documents.length === 0) {
    return NextResponse.json({ ok: true, added: 0 });
  }

  const db = getAdminFirestore();
  const tRef = db.collection(COLLECTIONS.transparency).doc(ownerUid);

  try {
    const snap = await tRef.get();
    const existing: CriteriaItem[] = ((snap.data() as { criteria?: CriteriaItem[] } | undefined)?.criteria) || [];
    const byId = new Map(existing.map((c) => [String(c.id), c]));

    let added = 0;
    for (const docu of documents) {
      const map = KIND_TO_CRITERION[docu.kind || ''];
      if (!map || !docu.url) continue;
      const prev = byId.get(map.id);
      // STK zaten bu kritere belge girmişse dokunma (kayıt belgesi yalnız boşsa eklenir).
      if (prev?.isCompleted) continue;
      const def = DEFAULT_CRITERIA.find((d) => d.id === map.id);
      byId.set(map.id, {
        id: map.id,
        name: map.name,
        points: def?.points ?? 10,
        type: 'document',
        isCompleted: true,
        status: 'pending',
        fileUrl: docu.url,
        fileName: docu.name || map.name,
        updatedAt: new Date().toISOString(),
      });
      added++;
    }

    if (added > 0) {
      await tRef.set(
        { criteria: Array.from(byId.values()), ngoId: ngoId || ownerUid, updatedAt: new Date().toISOString() },
        { merge: true },
      );
    }
    return NextResponse.json({ ok: true, added });
  } catch (err) {
    console.error('[transparency/seed-from-docs] failed', err);
    return NextResponse.json({ errorCode: 'WRITE_FAILED', message: 'Belgeler şeffaflığa aktarılamadı.' }, { status: 500 });
  }
}
