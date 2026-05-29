/**
 * Kurum evrak arşivi yazımı (NGO/kulüp admin → super-admin "Arşiv" sekmesi).
 *
 * POST   { docType, fileUrl, year?, entityType? }
 *          → oturum doğrula → documentArchive'e upsert (deterministik id: uid__slug(docType)).
 * DELETE { docType } → ilgili arşiv kaydını sil (yalnızca çağıranın kendi kaydı).
 *
 * Admin SDK ile yazılır: documentArchive client update/delete kuralı super-admin'e kapalı,
 * bu yüzden re-upload (upsert) ve kaldırma yalnızca burada çalışır. Kural değişimi gerekmez.
 * Hata formatı: { errorCode, message }.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { FieldValue } from 'firebase-admin/firestore';

export const runtime = 'nodejs';

async function verifyCaller(req: NextRequest): Promise<{ uid: string } | null> {
  const authHeader = req.headers.get('authorization') || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!idToken) return null;
  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken);
    return { uid: decoded.uid };
  } catch {
    return null;
  }
}

function slugifyDocType(s: string): string {
  return s.toLowerCase()
    .replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'evrak';
}

async function resolveEntityName(uid: string): Promise<string> {
  const fs = getAdminFirestore();
  for (const col of [COLLECTIONS.ngos, COLLECTIONS.brands, COLLECTIONS.studentClubs, COLLECTIONS.clubs]) {
    try {
      const snap = await fs.collection(col).doc(uid).get();
      const d = snap.data();
      if (d?.name) return String(d.name);
    } catch { /* yoksa sıradakine geç */ }
  }
  try {
    const u = await fs.collection(COLLECTIONS.users).doc(uid).get();
    const d = u.data();
    if (d?.displayName) return String(d.displayName);
    if (d?.name) return String(d.name);
  } catch { /* isim bulunamadı */ }
  return 'Bilinmeyen Kurum';
}

export async function POST(req: NextRequest) {
  const caller = await verifyCaller(req);
  if (!caller) return NextResponse.json({ errorCode: 'UNAUTHORIZED', message: 'Oturum doğrulanamadı.' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const docType = typeof body?.docType === 'string' ? body.docType.trim() : '';
  const fileUrl = typeof body?.fileUrl === 'string' ? body.fileUrl.trim() : '';
  const year = typeof body?.year === 'string' && body.year.trim() ? body.year.trim() : String(new Date().getFullYear());
  const entityType = ['ngo', 'club', 'brand'].includes(body?.entityType) ? body.entityType : 'ngo';

  if (!docType || !fileUrl) {
    return NextResponse.json({ errorCode: 'INVALID_BODY', message: 'Evrak türü ve dosya bağlantısı zorunlu.' }, { status: 400 });
  }
  if (!/^https?:\/\//i.test(fileUrl)) {
    return NextResponse.json({ errorCode: 'INVALID_URL', message: 'Geçersiz dosya bağlantısı.' }, { status: 400 });
  }

  try {
    const entityName = await resolveEntityName(caller.uid);
    const docId = `${caller.uid}__${slugifyDocType(docType)}`;
    await getAdminFirestore().collection(COLLECTIONS.documentArchive).doc(docId).set({
      entityId: caller.uid,
      entityName,
      entityType,
      docType,
      fileUrl,
      year,
      uploadedBy: caller.uid,
      uploadedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    return NextResponse.json({ ok: true, id: docId });
  } catch (err) {
    console.error('ngo/archive POST error', err);
    return NextResponse.json({ errorCode: 'INTERNAL_ERROR', message: 'Evrak arşive eklenemedi.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const caller = await verifyCaller(req);
  if (!caller) return NextResponse.json({ errorCode: 'UNAUTHORIZED', message: 'Oturum doğrulanamadı.' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const docType = typeof body?.docType === 'string' ? body.docType.trim() : '';
  if (!docType) return NextResponse.json({ errorCode: 'INVALID_BODY', message: 'Evrak türü zorunlu.' }, { status: 400 });

  try {
    const docId = `${caller.uid}__${slugifyDocType(docType)}`;
    const fs = getAdminFirestore();
    const docRef = fs.collection(COLLECTIONS.documentArchive).doc(docId);
    const snap = await docRef.get();
    // Yalnızca çağıranın kendi yüklediği kaydı sil.
    if (snap.exists && snap.data()?.uploadedBy === caller.uid) {
      await docRef.delete();
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('ngo/archive DELETE error', err);
    return NextResponse.json({ errorCode: 'INTERNAL_ERROR', message: 'Evrak arşivden silinemedi.' }, { status: 500 });
  }
}
