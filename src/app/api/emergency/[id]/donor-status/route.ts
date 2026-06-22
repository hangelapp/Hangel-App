/**
 * POST /api/emergency/[id]/donor-status — İlan sahibi bağışçıyı "geldi/gelmedi" işaretler.
 *
 * Body: { donorUid, status: 'came' | 'noshow' }.
 * Yetki: talebi açan (requestedBy === uid) VEYA super-admin.
 *
 * status 'came' OLDUĞUNDA (ve daha önce verilmediyse — donor.certIssued flag'i
 * çift vermeyi önler) bağışçıya:
 *   a. TİP-3 (kan) SERTİFİKASI yazılır (certificates + users/{uid}/certificates).
 *   b. pastVolunteering kaydı + awardBadgesForUser → KAN ROZETİ (puan).
 *   c. impactScore += 50.
 *   d. teşekkür DM'i (notifyUser, 3 kanal).
 *   e. donor.certIssued = true.
 *
 * Faaliyet/kişi sıra no'ları talep dokümanında saklanır (bloodActivityNo,
 * bloodPersonSeq) → bir talep için tek faaliyet no, kişiler sıralı.
 *
 * Auth: Bearer idToken. Dönüş: { ok: true }. Hata: { errorCode, message }.
 */
import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { awardBloodDonation, endDonorBloodLiveActivity } from '@/lib/blood-award';

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

  let uid: string; let role: unknown;
  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    uid = decoded.uid; role = (decoded as { role?: unknown }).role;
  } catch {
    return errJson('unauthenticated', 'Geçersiz token', 401);
  }
  const isSuperAdmin = role === 'super-admin';

  const body = await req.json().catch(() => null);
  const donorUid = typeof body?.donorUid === 'string' ? body.donorUid.trim() : '';
  const status = body?.status;
  if (!donorUid) return errJson('invalid_donor', 'Bağışçı kimliği gerekli', 400);
  if (status !== 'came' && status !== 'noshow') {
    return errJson('invalid_status', "status 'came' veya 'noshow' olmalı", 400);
  }

  const db = getAdminFirestore();
  const reqRef = db.collection(COLLECTIONS.emergencyRequests).doc(id);
  const reqSnap = await reqRef.get();
  if (!reqSnap.exists) return errJson('request_not_found', 'Kan talebi bulunamadı', 404);
  const request = reqSnap.data() as {
    requestedBy?: string;
    hospitalName?: string;
    bloodActivityNo?: number;
    bloodPersonSeq?: number;
  };

  if (!isSuperAdmin && request.requestedBy !== uid) {
    return errJson('forbidden', 'Bu ilanı işaretleme yetkin yok', 403);
  }

  const donorRef = reqRef.collection(COLLECTIONS.emergencyDonors).doc(donorUid);
  const donorSnap = await donorRef.get();
  if (!donorSnap.exists) return errJson('donor_not_found', 'Bağışçı listede bulunamadı', 404);
  const donor = donorSnap.data() as { status?: string; certIssued?: boolean };
  const alreadyCame = donor.status === 'came';
  const certIssued = donor.certIssued === true;

  // Status'u güncelle (her durumda). Önceki status 'coming' VEYA 'donor_reported'
  // (bağışçı kendisi bildirdi → ilan sahibi onaylıyor) olabilir; ikisi de buraya düşer.
  await donorRef.set(
    { status, statusAt: FieldValue.serverTimestamp() },
    { merge: true },
  );

  // 'came' OLDU ve daha önce sertifika verilmediyse → ödül zinciri.
  // (Önceki status 'coming' ya da 'donor_reported' farketmez; idempotency
  //  certIssued + alreadyCame ile sağlanır.)
  if (status === 'came' && !alreadyCame && !certIssued) {
    const ngoName = request.hospitalName || 'hangel Kan';
    await awardBloodDonation({
      db,
      requestId: id,
      donorUid,
      ngoName,
      issuedBy: uid,
      bloodActivityNo: request.bloodActivityNo,
      bloodPersonSeq: request.bloodPersonSeq,
    });

    // Çift vermeyi önle.
    await donorRef.set({ certIssued: true }, { merge: true });

    // Bağışçının kan Live Activity token'larını temizle (bayat update push'u önler).
    await endDonorBloodLiveActivity(db, donorUid, id);
  }

  return NextResponse.json({ ok: true });
}
