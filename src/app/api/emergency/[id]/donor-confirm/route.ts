/**
 * POST /api/emergency/[id]/donor-confirm — Bağışçı KENDİSİ "kan verdim" der.
 *
 * Akış: bağışçı (donors/{uid}) hastaneye gidip bağış yaptıktan sonra
 * uygulamadan / hatırlatma push'undan "Verdim ✅" der. Bu route:
 *   - status zaten 'came' → idempotent: Live Activity'yi kapat, {ok, status:'came'}
 *   - status 'coming' VEYA 'donor_reported' → status:'donor_reported',
 *     reportedAt damgası + İLAN SAHİBİNE (request.requestedBy) "onaylar mısın?"
 *     bildirimi. İlan sahibi onaylayınca (donor-status route, status:'came')
 *     ödül zinciri çalışır. 48 saat onaylanmazsa cron otomatik onaylar.
 *
 * Bağışçı kendisi ödülü tetikleyemez (sahte bildirimi önlemek için) — yalnızca
 * "bildirdim" durumuna geçer; ödül ilan sahibi onayı VEYA 48h auto-confirm ile gelir.
 *
 * Auth: Bearer idToken (donorUid = token sahibi). Dönüş: { ok, status }.
 * Hata: { errorCode, message } — raw error ASLA sızdırılmaz.
 */
import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { notifyUser } from '@/lib/notify-user';
import { endDonorBloodLiveActivity } from '@/lib/blood-award';

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
  const request = reqSnap.data() as { requestedBy?: string };

  const donorRef = reqRef.collection(COLLECTIONS.emergencyDonors).doc(donorUid);
  const donorSnap = await donorRef.get();
  if (!donorSnap.exists) return errJson('donor_not_found', 'Önce "bağışa geleceğim" demelisin', 404);
  const donor = donorSnap.data() as { status?: string; name?: string };

  // Idempotent: zaten 'came' (ilan sahibi/cron onayladı) → Live Activity'yi kapat, dön.
  if (donor.status === 'came') {
    await endDonorBloodLiveActivity(db, donorUid, id).catch(() => undefined);
    return NextResponse.json({ ok: true, status: 'came' });
  }

  // 'noshow' işaretlenmişse bağışçı tekrar "verdim" diyebilmeli (yanlış işaret düzeltme).
  // 'coming' | 'donor_reported' | 'noshow' → 'donor_reported'.
  try {
    await donorRef.set(
      { status: 'donor_reported', reportedAt: FieldValue.serverTimestamp() },
      { merge: true },
    );
  } catch {
    return errJson('write_failed', 'Durum güncellenemedi, tekrar dene', 500);
  }

  // İlan sahibine onay bildirimi (in-app + push). Bağışçı zaten daha önce
  // bildirmişse (status 'donor_reported') ilan sahibi yine hatırlatılır — zararsız.
  const requesterUid = typeof request.requestedBy === 'string' ? request.requestedBy.trim() : '';
  const donorName = (donor.name ?? '').trim() || 'Bir bağışçı';
  if (requesterUid) {
    try {
      await notifyUser({
        userId: requesterUid,
        type: 'blood-confirm-prompt',
        title: 'Bir kahraman kan verdiğini bildirdi 🧡',
        body: `${donorName} bağış yaptığını söyledi. Geldiğini onaylar mısın?`,
        link: `/emergency?confirm=${encodeURIComponent(id)}&donor=${encodeURIComponent(donorUid)}`,
        data: {
          kind: 'blood-confirm-prompt',
          requestId: id,
          donorUid,
          donorName,
        },
        storeAsMessage: true,
        messageSubject: 'Kan bağışı onayı bekleniyor 🧡',
        messageContent: `${donorName} senin kan talebine bağış yaptığını bildirdi. Geldiğini onaylarsan kahramanımıza sertifikası, rozeti ve teşekkürü hemen ulaşır. İlan ekranından "geldi" olarak işaretleyebilirsin 🧡`,
      });
    } catch {
      // Bildirim yazılamasa da bağışçının durumu kaydedildi — sessiz geç.
    }
  }

  return NextResponse.json({ ok: true, status: 'donor_reported' });
}
