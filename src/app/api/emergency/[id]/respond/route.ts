/**
 * POST /api/emergency/[id]/respond — Bağışçı "geleceğim".
 *
 * Bir kan talebine (emergencyRequests, type:'blood') giriş yapmış kullanıcı
 * "Bağışa geleceğim" der → ilan sahibinin gördüğü BAĞIŞÇI LİSTESİ'ne (donors
 * alt-koleksiyonu) düşer. İlan sahibi yalnızca isim + telefonun SON 4 hanesini
 * görür; tam telefon/e-posta ASLA tutulmaz.
 *
 * İdempotent: bağışçı zaten 'came'/'noshow' işaretlenmişse status EZİLMEZ
 * (yalnızca kayıt yoksa 'coming' yazılır).
 *
 * Auth: Bearer idToken. Dönüş: { ok: true }. Hata: { errorCode, message }.
 */
import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/firebase/collections';

export const runtime = 'nodejs';

function errJson(errorCode: string, message: string, status: number) {
  return NextResponse.json({ errorCode, message }, { status });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) return errJson('invalid_request_id', 'Talep kimliği gerekli', 400);

  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) return errJson('unauthenticated', 'Token gerekli', 401);

  let donorUid: string;
  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    donorUid = decoded.uid;
  } catch {
    return errJson('unauthenticated', 'Geçersiz token', 401);
  }

  const db = getAdminFirestore();
  const reqRef = db.collection(COLLECTIONS.emergencyRequests).doc(id);
  const reqSnap = await reqRef.get();
  if (!reqSnap.exists) return errJson('request_not_found', 'Kan talebi bulunamadı', 404);
  const request = reqSnap.data() as { type?: string };
  if (request.type !== 'blood') return errJson('not_blood_request', 'Bu talep bir kan talebi değil', 400);

  // Bağışçının adı + telefonu (son 4 hane). İsim: users.name → Auth displayName.
  const donorSnap = await db.collection(COLLECTIONS.users).doc(donorUid).get();
  const donorData = (donorSnap.data() ?? {}) as { name?: string; personalInfo?: { phone?: string } };
  let name = (donorData.name ?? '').trim();
  if (!name) {
    try {
      const rec = await getAdminAuth().getUser(donorUid);
      name = (rec.displayName ?? '').trim();
    } catch { /* fallback below */ }
  }
  if (!name) name = 'Bağışçı';
  const phoneDigits = (donorData.personalInfo?.phone ?? '').replace(/\D/g, '');
  const phoneLast4 = phoneDigits.slice(-4);

  // İdempotent: zaten geldi/gelmedi işaretliyse status'u EZME.
  const donorRef = reqRef.collection(COLLECTIONS.emergencyDonors).doc(donorUid);
  const existing = await donorRef.get();
  const existingStatus = existing.exists ? (existing.data() as { status?: string }).status : undefined;
  if (existingStatus === 'came' || existingStatus === 'noshow') {
    return NextResponse.json({ ok: true });
  }

  await donorRef.set(
    {
      uid: donorUid,
      name,
      phoneLast4,
      status: 'coming',
      respondedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  return NextResponse.json({ ok: true });
}
