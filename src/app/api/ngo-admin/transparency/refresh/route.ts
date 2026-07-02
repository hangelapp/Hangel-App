/**
 * POST /api/ngo-admin/transparency/refresh
 *
 * STK yöneticisi kendi profilini güncelleyince şeffaflık skorunu tazeler.
 * Profil (web/e-posta/telefon/adres/üyelik) ilgili kriterleri otomatik karşılar;
 * skor belge + profil birleşiminden YÜZDE olarak yeniden hesaplanıp yayınlanır.
 *
 * Yetki: çağıran, ilgili NGO'nun adminUserId'si olmalı (kendi STK'sı). Skor zaten
 * profildeki bilgilerin deterministik türeviyse de, yalnız sahibi tetikleyebilir.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { recomputeNgoTransparency } from '@/lib/transparency-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!idToken) return NextResponse.json({ errorCode: 'UNAUTHENTICATED', message: 'Oturum gerekli.' }, { status: 401 });

  let uid: string;
  try {
    uid = (await getAdminAuth().verifyIdToken(idToken)).uid;
  } catch {
    return NextResponse.json({ errorCode: 'UNAUTHENTICATED', message: 'Geçersiz oturum.' }, { status: 401 });
  }

  const db = getAdminFirestore();
  try {
    // İsteğe bağlı ngoId; yoksa adminUserId==uid ile bul.
    let ngoId = '';
    try { ngoId = String(((await req.json().catch(() => ({}))) as { ngoId?: string })?.ngoId || ''); } catch { /* body yok */ }
    if (ngoId) {
      const snap = await db.collection(COLLECTIONS.ngos).doc(ngoId).get();
      if (!snap.exists || (snap.data() as { adminUserId?: string }).adminUserId !== uid) {
        return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Bu STK sizin değil.' }, { status: 403 });
      }
    } else {
      const q = await db.collection(COLLECTIONS.ngos).where('adminUserId', '==', uid).limit(1).get();
      if (q.empty) return NextResponse.json({ ok: true, score: null, note: 'STK bulunamadı' });
      ngoId = q.docs[0].id;
    }
    const score = await recomputeNgoTransparency(db, ngoId);
    return NextResponse.json({ ok: true, ngoId, score });
  } catch (err) {
    console.error('[transparency/refresh] failed', err);
    return NextResponse.json({ errorCode: 'INTERNAL_ERROR', message: 'Tazelenemedi.' }, { status: 500 });
  }
}
