/**
 * POST /api/ngo/claim — kuruluş "ön kayıt / taslak" sahiplenme (dernek/vakıf/kulüp).
 *
 * Yönetici tipini seçer:
 *  - dernek → kütük no → registryDernekler/{kutukNo}
 *  - vakıf  → isimle bulunan registryVakiflar/{vakifId}
 *  - kulup  → manuel (ad + il; resmi kütük verisi yok)
 * Sözleşme onayıyla bu endpoint çağrılır. Sunucu ngos/{id}'yi `status:'taslak'`
 * ile oluşturur (marketplace'te GİZLİ) + users/{uid}.managedNgoId yazar (Admin SDK).
 *
 * Body: { orgType, kutukNo?, vakifId?, manualName?, manualCity?, consentAccepted: true }
 * Dönüş: { ok, ngoId, name }
 */
import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue, type Firestore } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/firebase/collections';

export const runtime = 'nodejs';

function errJson(errorCode: string, message: string, status: number) {
  return NextResponse.json({ errorCode, message }, { status });
}

interface ClaimBody {
  orgType?: 'dernek' | 'vakif' | 'kulup';
  kutukNo?: string;
  vakifId?: string;
  manualName?: string;
  manualCity?: string;
  consentAccepted?: boolean;
}

// Kütük/registry kaydından → taslak ngo verisi üretir.
async function buildNgoData(
  db: Firestore, body: ClaimBody,
): Promise<{ data: Record<string, unknown>; dedupeKey: { field: string; value: string } } | { error: ReturnType<typeof errJson> }> {
  const base = { status: 'taslak', documentsComplete: false, claimedVia: 'kutuk', viewCount: 0 };

  if (body.orgType === 'dernek') {
    const kutukNo = (body.kutukNo || '').trim();
    if (!kutukNo) return { error: errJson('missing_kutuk', 'Kütük numarası gerekli', 400) };
    const snap = await db.collection(COLLECTIONS.registryDernekler).doc(kutukNo).get();
    if (!snap.exists) return { error: errJson('not_found', 'Bu kütük numarasıyla dernek bulunamadı. Numarayı kontrol et.', 404) };
    const r = snap.data() as { name?: string; faaliyetAlani?: string; detayliFaaliyetAlani?: string; il?: string; foundedYear?: number; adres?: string; webSite?: string };
    return {
      data: { ...base, type: 'Dernek', name: r.name || '', nameLower: (r.name || '').toLocaleLowerCase('tr'), kutukNo, category: r.faaliyetAlani || '', detailedCategory: r.detayliFaaliyetAlani || '', city: r.il || '', foundedYear: r.foundedYear ?? null, address: r.adres || '', website: r.webSite || '' },
      dedupeKey: { field: 'kutukNo', value: kutukNo },
    };
  }

  if (body.orgType === 'vakif') {
    const vakifId = (body.vakifId || '').trim();
    if (!vakifId) return { error: errJson('missing_vakif', 'Vakıf seçimi gerekli', 400) };
    const snap = await db.collection(COLLECTIONS.registryVakiflar).doc(vakifId).get();
    if (!snap.exists) return { error: errJson('not_found', 'Vakıf kaydı bulunamadı.', 404) };
    const r = snap.data() as { name?: string; il?: string; ilce?: string; adres?: string; telefon1?: string; ePosta?: string };
    return {
      data: { ...base, type: 'Vakıf', name: r.name || '', nameLower: (r.name || '').toLocaleLowerCase('tr'), vakifRegistryId: vakifId, city: r.il || '', district: r.ilce || '', address: r.adres || '', phone: r.telefon1 || '', email: r.ePosta || '', claimedVia: 'registry' },
      dedupeKey: { field: 'vakifRegistryId', value: vakifId },
    };
  }

  // kulup — manuel (resmi kütük yok; ekstra doğrulama gerekir)
  const name = (body.manualName || '').trim();
  const city = (body.manualCity || '').trim();
  if (!name) return { error: errJson('missing_name', 'Kulüp adı gerekli', 400) };
  return {
    data: { ...base, type: 'Spor Kulübü', name, nameLower: name.toLocaleLowerCase('tr'), city, claimedVia: 'manual', needsVerification: true },
    dedupeKey: { field: 'nameLower', value: name.toLocaleLowerCase('tr') },
  };
}

export async function POST(req: Request) {
  const token = (req.headers.get('authorization') ?? '').startsWith('Bearer ')
    ? (req.headers.get('authorization') ?? '').slice(7).trim() : '';
  if (!token) return errJson('unauthenticated', 'Giriş gerekli', 401);
  let uid: string;
  try { uid = (await getAdminAuth().verifyIdToken(token)).uid; }
  catch { return errJson('unauthenticated', 'Geçersiz oturum', 401); }

  let body: ClaimBody;
  try { body = await req.json(); } catch { return errJson('invalid_json', 'Geçersiz istek', 400); }
  if (body.consentAccepted !== true) return errJson('consent_required', 'Sözleşme/politikaları onaylamalısın', 400);
  if (!['dernek', 'vakif', 'kulup'].includes(body.orgType || '')) return errJson('invalid_type', 'Kuruluş tipi geçersiz', 400);

  const db = getAdminFirestore();
  const built = await buildNgoData(db, body);
  if ('error' in built) return built.error;

  // Zaten sahiplenilmiş mi?
  const dup = await db.collection(COLLECTIONS.ngos).where(built.dedupeKey.field, '==', built.dedupeKey.value).limit(1).get();
  if (!dup.empty) return errJson('already_claimed', 'Bu kuruluş hangel’de zaten kayıtlı. Yetki için destek ile iletişime geç.', 409);

  const ngoRef = db.collection(COLLECTIONS.ngos).doc();
  await ngoRef.set({ id: ngoRef.id, ...built.data, adminUserId: uid, consentAcceptedAt: FieldValue.serverTimestamp(), createdAt: FieldValue.serverTimestamp() });
  await db.collection(COLLECTIONS.users).doc(uid).update({ managedNgoId: ngoRef.id, role: 'ngo-admin' }).catch(() => undefined);

  return NextResponse.json({ ok: true, ngoId: ngoRef.id, name: built.data.name });
}
