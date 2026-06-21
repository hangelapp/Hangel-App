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
import { notifyUser } from '@/lib/notify-user';
import { buildCertCode } from '@/lib/certificate-code';
import { awardBadgesForUser } from '@/lib/award-badges';

export const runtime = 'nodejs';

// Kan bağışı puanı — "geldi" işaretlenince verilir.
const BLOOD_IMPACT_POINTS = 50;

function errJson(errorCode: string, message: string, status: number) {
  return NextResponse.json({ errorCode, message }, { status });
}

// Atomik sıralı sayaç (counters/{name}.next) — faaliyet/kişi numaraları için.
// (api/events/[id]/complete/route.ts ile birebir aynı desen.)
async function nextSeq(db: FirebaseFirestore.Firestore, name: string, start: number): Promise<number> {
  const ref = db.collection('counters').doc(name);
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const cur = snap.exists ? ((snap.data() as { next?: number }).next ?? start) : start;
    tx.set(ref, { next: cur + 1 }, { merge: true });
    return cur;
  });
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

  // Status'u güncelle (her durumda).
  await donorRef.set(
    { status, statusAt: FieldValue.serverTimestamp() },
    { merge: true },
  );

  // 'came' OLDU ve daha önce sertifika verilmediyse → ödül zinciri.
  if (status === 'came' && !alreadyCame && !certIssued) {
    const year = new Date().getFullYear();
    const ngoName = request.hospitalName || 'hangel Kan';
    const today = new Date().toISOString().slice(0, 10);

    // Faaliyet no — talebe bir kez atanır; kişi no sıralı artar (talepte saklanır).
    let activityNo = request.bloodActivityNo ?? 0;
    if (!(activityNo >= 1)) {
      activityNo = await nextSeq(db, `cert-act-blood-${year}`, 1);
    }
    const personSeq = (request.bloodPersonSeq ?? 0) + 1;
    await reqRef.set({ bloodActivityNo: activityNo, bloodPersonSeq: personSeq }, { merge: true });

    // a. Sertifika (TİP-3 kan).
    const certId = `blood-${id}-${donorUid}`;
    const cert = {
      id: certId,
      userId: donorUid,
      type: 'blood',
      title: 'Kan Bağışı Sertifikası',
      role: 'donor',
      ngoName,
      date: today,
      code: buildCertCode({ kind: 'blood', country: '90', year, activityNo, personNo: personSeq }),
      certCountry: '90',
      certYear: year,
      certActivityNo: activityNo,
      certPersonNo: personSeq,
      completedAt: FieldValue.serverTimestamp(),
      issuedBy: uid,
    };
    await db.collection(COLLECTIONS.certificates).doc(certId).set(cert);
    await db.collection(COLLECTIONS.users).doc(donorUid)
      .collection(COLLECTIONS.certificates).doc(certId).set(cert);

    // b. pastVolunteering kaydı → kan rozeti (puan).
    await db.collection(COLLECTIONS.users).doc(donorUid)
      .collection(COLLECTIONS.pastVolunteering).doc(`blood-${id}`).set({
        socialArea: 'Kan Bağışı Gönüllüsü',
        points: 100,
        title: 'Kan Bağışı',
        ngoName,
        completedAt: FieldValue.serverTimestamp(),
      });
    await awardBadgesForUser(db, donorUid, { notify: true });

    // c. impactScore += 50.
    await db.collection(COLLECTIONS.users).doc(donorUid)
      .update({ impactScore: FieldValue.increment(BLOOD_IMPACT_POINTS) })
      .catch(() => undefined);

    // d. Teşekkür DM'i.
    try {
      await notifyUser({
        userId: donorUid,
        type: 'badge_earned',
        title: 'Kan bağışın için teşekkürler 🩸',
        body: 'Bir hayata dokundun. Kan bağışı sertifikan ve rozetin hazır — /my-badges',
        link: '/my-badges',
        data: { kind: 'blood-certificate', requestId: id, certificateId: certId },
        storeAsMessage: true,
        messageSubject: 'Kan Bağışın İçin Teşekkürler 🩸',
        messageContent: `Bir hayata dokundun. ${ngoName} için yaptığın kan bağışı kaydedildi.\n\nKan bağışı sertifikan ve Kan Bağışı rozetin profiline yüklendi (+${BLOOD_IMPACT_POINTS} impact puanı). Rozetlerine ve sertifikana ulaşmak için "Rozetlerim" sayfasına dokun 🧡`,
      });
    } catch (e) {
      console.warn('[emergency/donor-status] notify failed', donorUid, e);
    }

    // e. Çift vermeyi önle.
    await donorRef.set({ certIssued: true }, { merge: true });
  }

  return NextResponse.json({ ok: true });
}
