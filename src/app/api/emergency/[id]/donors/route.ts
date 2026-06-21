/**
 * GET /api/emergency/[id]/donors — İlan sahibinin bağışçı listesi.
 *
 * Yetki: yalnızca talebi açan (requestedBy === uid) VEYA super-admin görebilir.
 * Gizlilik: her bağışçı için sadece { uid, name, phoneLast4, status, certIssued }
 * döner. uid yalnız "geldi/gelmedi" işaretlemesi için; tam telefon/e-posta ASLA.
 *
 * Auth: Bearer idToken. Dönüş: { ok: true, donors: [...] }. Hata: { errorCode, message }.
 */
import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';

export const runtime = 'nodejs';

function errJson(errorCode: string, message: string, status: number) {
  return NextResponse.json({ errorCode, message }, { status });
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) return errJson('invalid_request_id', 'Talep kimliği gerekli', 400);

  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) return errJson('unauthenticated', 'Token gerekli', 401);

  let uid: string; let role: unknown;
  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    uid = decoded.uid; role = (decoded as { role?: unknown }).role;
  } catch {
    return errJson('unauthenticated', 'Geçersiz token', 401);
  }
  const isSuperAdmin = role === 'super-admin';

  const db = getAdminFirestore();
  const reqRef = db.collection(COLLECTIONS.emergencyRequests).doc(id);
  const reqSnap = await reqRef.get();
  if (!reqSnap.exists) return errJson('request_not_found', 'Kan talebi bulunamadı', 404);
  const request = reqSnap.data() as { requestedBy?: string };

  if (!isSuperAdmin && request.requestedBy !== uid) {
    return errJson('forbidden', 'Bu ilanın bağışçılarını görme yetkin yok', 403);
  }

  const donorsSnap = await reqRef.collection(COLLECTIONS.emergencyDonors).get();
  const donors = donorsSnap.docs.map((d) => {
    const data = d.data() as { name?: string; phoneLast4?: string; status?: string; certIssued?: boolean };
    return {
      uid: d.id,
      name: data.name ?? 'Bağışçı',
      phoneLast4: data.phoneLast4 ?? '',
      status: data.status ?? 'coming',
      certIssued: data.certIssued === true,
    };
  });

  return NextResponse.json({ ok: true, donors });
}
