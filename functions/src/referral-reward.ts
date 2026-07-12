/**
 * Referans / Davet Ödülü (referralWelcomeReward + referralCompletionReward).
 *
 * Kayıt akışı (src/app/login/selection/_components/IndividualForm.tsx) yeni
 * kullanıcı doc'una `?ref=user:<uid>` linkinden gelen `invitedBy: 'user:<uid>'`
 * alanını yazıyor. Ödül puanı client'tan verilemez (kullanıcı başka kullanıcının
 * doc'unu yazamaz — güvenlik kuralı), bu yüzden admin SDK ile server-side veriyoruz.
 *
 * İki tetik:
 *
 *   1) referralWelcomeReward — onDocumentCreated('users/{uid}')
 *      Yeni kullanıcı doc'unda `invitedBy: 'user:<refUid>'` varsa DAVET EDİLENE
 *      hoş geldin +25 impactScore verir. Self-referral engellenir (refUid != uid).
 *      Tek sefer: `referralWelcomeAwarded: true` bayrağı ile tekrar verilmez.
 *      DAVET EDENE puan BURADA VERİLMEZ — davetli henüz bir eylem yapmadı;
 *      kötüye kullanım (sahte davet) önlenir. Davet edenin ödülü 2. tetikte.
 *
 *   2) referralCompletionReward — onDocumentWritten('volunteerCompletions/{id}')
 *      Bir gönüllülük tamamlaması `ngoApproved === true` olduğunda (yeni onay),
 *      tamamlamayı yapan kullanıcının `invitedBy` davet edeni varsa ve o davet
 *      için DAVET EDEN daha önce ödüllendirilmediyse (davetli doc'undaki
 *      `referrerAwarded` bayrağı) → DAVET EDENE +50 impactScore verir ve bayrağı
 *      işaretler. Böylece davet eden yalnızca davetli GERÇEK bir eylem (onaylı
 *      tamamlama) yaptığında ödüllenir; davet başına tek sefer (basit cap).
 *
 * impactScore konvansiyonu: ödül puanları top-level `impactScore` alanına
 * FieldValue.increment ile yazılır (clip/checkin + whatsapp welcome ile birebir
 * aynı). stats.impactScore ayrı bir sayaç; ödül akışı top-level alanı kullanır.
 *
 * Region: europe-west1 (blood-match / onboarding-nudge ile aynı).
 * Deploy: cd functions && npm run build && firebase deploy --only functions:referralWelcomeReward,functions:referralCompletionReward
 */
import { onDocumentCreated, onDocumentWritten } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const REGION = 'europe-west1';

// Ödül puanları.
const INVITEE_WELCOME_POINTS = 25; // davet edilene, kayıtta
const REFERRER_COMPLETION_POINTS = 50; // davet edene, davetlinin ilk onaylı tamamlamasında

/** `invitedBy` alanını `user:<uid>` formatından refUid'e çözer; değilse null. */
function parseReferrerUid(invitedBy: unknown): string | null {
  if (typeof invitedBy !== 'string') return null;
  const trimmed = invitedBy.trim();
  if (!trimmed.startsWith('user:')) return null; // sadece kullanıcı davetleri (ngo:/club:/brand: hariç)
  const uid = trimmed.slice('user:'.length).trim();
  return uid.length > 0 ? uid : null;
}

/**
 * Tetik 1 — Yeni kullanıcı kaydında davet EDİLENE hoş geldin +25.
 * Davet edene puan verilmez (davetli henüz eylem yapmadı; suistimal önlenir).
 */
export const referralWelcomeReward = onDocumentCreated(
  {
    document: 'users/{uid}',
    region: REGION,
  },
  async (event) => {
    const snap = event.data;
    if (!snap) return;
    const uid = event.params.uid;
    const data = snap.data() as { invitedBy?: unknown; referralWelcomeAwarded?: boolean };

    // Idempotency: zaten verildiyse çık (retry / merge yazımı).
    if (data.referralWelcomeAwarded === true) return;

    const refUid = parseReferrerUid(data.invitedBy);
    if (!refUid) return; // davet yok ya da user: formatında değil

    // Self-referral engeli — kendi linkiyle kayıt puana dönüşmesin.
    if (refUid === uid) {
      logger.info('[referral-welcome] self-referral atlandı', { uid });
      return;
    }

    try {
      await snap.ref.update({
        impactScore: FieldValue.increment(INVITEE_WELCOME_POINTS),
        referralWelcomeAwarded: true,
        referralWelcomeAwardedAt: FieldValue.serverTimestamp(),
      });
      logger.info('[referral-welcome] davetliye hoş geldin puanı verildi', {
        uid,
        refUid,
        points: INVITEE_WELCOME_POINTS,
      });
    } catch (err) {
      logger.error('[referral-welcome] güncelleme hatası', { uid, err });
    }
  },
);

/**
 * Tetik 2 — Davetlinin İLK onaylı gönüllülük tamamlamasında davet EDENE +50.
 * `ngoApproved` false→true (ya da yeni oluşturulan doc'ta true) geçişinde çalışır;
 * davet başına tek sefer (davetli doc'undaki `referrerAwarded` bayrağı).
 */
export const referralCompletionReward = onDocumentWritten(
  {
    document: 'volunteerCompletions/{id}',
    region: REGION,
  },
  async (event) => {
    const after = event.data?.after?.data() as
      | { userId?: string; ngoApproved?: boolean }
      | undefined;
    if (!after) return; // silme olayı — ilgilenmiyoruz

    // Yalnızca onaylı tamamlamalar ödül üretir.
    if (after.ngoApproved !== true) return;

    // Geçiş kontrolü: önceden de ngoApproved==true ise bu bir "yeni onay" değil;
    // (approvedBy/notlar vb. güncellemesi) tekrar ödül vermeyelim. Yeni oluşturulan
    // doc'ta before yoktur → true kabul edilir (ilk onaylı yazım).
    const before = event.data?.before?.data() as { ngoApproved?: boolean } | undefined;
    if (before && before.ngoApproved === true) return;

    const completerUid = after.userId;
    if (!completerUid || typeof completerUid !== 'string') return;

    const db = getFirestore();
    const userRef = db.collection('users').doc(completerUid);
    const userSnap = await userRef.get();
    if (!userSnap.exists) return;

    const user = userSnap.data() as { invitedBy?: unknown; referrerAwarded?: boolean };

    // Davet başına tek sefer (cap).
    if (user.referrerAwarded === true) return;

    const refUid = parseReferrerUid(user.invitedBy);
    if (!refUid) return; // davet eden yok
    if (refUid === completerUid) return; // self-referral engeli

    const referrerRef = db.collection('users').doc(refUid);

    // Transaction: davet eden var mı doğrula + iki yazımı atomik yap
    // (bayrak + davet edene puan). Davet eden doc yoksa (silinmiş) puanı verme
    // ama bayrağı işaretle ki tekrar tekrar denenmesin.
    try {
      await db.runTransaction(async (tx) => {
        const freshUser = await tx.get(userRef);
        if ((freshUser.data() as { referrerAwarded?: boolean } | undefined)?.referrerAwarded === true) {
          return; // yarış: başka bir tetik önce ödüllendirdi
        }
        const referrerSnap = await tx.get(referrerRef);

        // Davetli doc'una bayrağı her hâlükârda işaretle (idempotency).
        tx.update(userRef, {
          referrerAwarded: true,
          referrerAwardedAt: FieldValue.serverTimestamp(),
          referrerAwardedRefUid: refUid,
        });

        if (referrerSnap.exists) {
          tx.update(referrerRef, {
            impactScore: FieldValue.increment(REFERRER_COMPLETION_POINTS),
            referralInviteRewardCount: FieldValue.increment(1),
          });
        }
      });
      logger.info('[referral-completion] davet edene ödül verildi', {
        completerUid,
        refUid,
        points: REFERRER_COMPLETION_POINTS,
      });
    } catch (err) {
      logger.error('[referral-completion] transaction hatası', { completerUid, refUid, err });
    }
  },
);
