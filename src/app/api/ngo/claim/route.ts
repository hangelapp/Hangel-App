/**
 * POST /api/ngo/claim — STK "ön kayıt / taslak" sahiplenme.
 *
 * STK yöneticisi kütük no girer → registryDernekler/{kutukNo}'dan bilgiler gelir →
 * sözleşmeleri kabul edince bu endpoint çağrılır. Sunucu:
 *   1. Kütük kaydını okur (yoksa 404).
 *   2. Bu kütük zaten sahiplenilmişse 409 döner.
 *   3. ngos/{id}'yi `status: 'taslak'` ile oluşturur (evraksız → marketplace'te GİZLİ).
 *   4. users/{uid}.managedNgoId = yeni STK (privileged alan; Admin SDK ile).
 *
 * Taslak STK: sadece sahibi görür/yönetir; diğer kullanıcılar göremez. Sahibine
 * her girişte "evrakını tamamla" ikazı çıkar (client tarafı).
 *
 * Body: { kutukNo: string, consentAccepted: true }
 * Dönüş: { ok, ngoId, name }
 */
import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/firebase/collections';

export const runtime = 'nodejs';

function errJson(errorCode: string, message: string, status: number) {
  return NextResponse.json({ errorCode, message }, { status });
}

export async function POST(req: Request) {
  const token = (req.headers.get('authorization') ?? '').startsWith('Bearer ')
    ? (req.headers.get('authorization') ?? '').slice(7).trim() : '';
  if (!token) return errJson('unauthenticated', 'Giriş gerekli', 401);
  let uid: string;
  try { uid = (await getAdminAuth().verifyIdToken(token)).uid; }
  catch { return errJson('unauthenticated', 'Geçersiz oturum', 401); }

  let body: { kutukNo?: string; consentAccepted?: boolean };
  try { body = await req.json(); } catch { return errJson('invalid_json', 'Geçersiz istek', 400); }
  const kutukNo = (body.kutukNo || '').trim();
  if (!kutukNo) return errJson('missing_kutuk', 'Kütük numarası gerekli', 400);
  if (body.consentAccepted !== true) return errJson('consent_required', 'Sözleşme/politikaları onaylamalısın', 400);

  const db = getAdminFirestore();

  // 1) Kütük kaydı
  const regSnap = await db.collection(COLLECTIONS.registryDernekler).doc(kutukNo).get();
  if (!regSnap.exists) return errJson('kutuk_not_found', 'Bu kütük numarasıyla kayıt bulunamadı. Numarayı kontrol et.', 404);
  const reg = regSnap.data() as {
    name?: string; faaliyetAlani?: string; detayliFaaliyetAlani?: string;
    il?: string; foundedYear?: number; adres?: string; webSite?: string; type?: string;
  };

  // 2) Zaten sahiplenilmiş mi?
  const claimed = await db.collection(COLLECTIONS.ngos).where('kutukNo', '==', kutukNo).limit(1).get();
  if (!claimed.empty) {
    return errJson('already_claimed', 'Bu STK zaten hangel’de kayıtlı. Yetki için destek ile iletişime geç.', 409);
  }

  // 3) Taslak STK oluştur
  const ngoRef = db.collection(COLLECTIONS.ngos).doc();
  const ngo = {
    id: ngoRef.id,
    name: reg.name || 'İsimsiz STK',
    nameLower: (reg.name || '').toLocaleLowerCase('tr'),
    kutukNo,
    category: reg.faaliyetAlani || '',
    detailedCategory: reg.detayliFaaliyetAlani || '',
    city: reg.il || '',
    foundedYear: reg.foundedYear ?? null,
    address: reg.adres || '',
    website: reg.webSite || '',
    type: 'Dernek',
    status: 'taslak',          // evraksız → marketplace'te gizli
    documentsComplete: false,
    adminUserId: uid,
    claimedVia: 'kutuk',
    consentAcceptedAt: FieldValue.serverTimestamp(),
    createdAt: FieldValue.serverTimestamp(),
    viewCount: 0,
  };
  await ngoRef.set(ngo);

  // 4) Kullanıcıya bağla (privileged alan — Admin SDK)
  await db.collection(COLLECTIONS.users).doc(uid).update({
    managedNgoId: ngoRef.id,
    role: 'ngo-admin',
  }).catch(() => undefined);

  return NextResponse.json({ ok: true, ngoId: ngoRef.id, name: ngo.name });
}
