/**
 * blood-award — kan bağışı ödül zinciri (sertifika + rozet + puan + DM).
 *
 * Bir bağışçı "geldi" (status:'came') durumuna geçtiğinde tetiklenen kanonik
 * ödül akışı. Önceden api/emergency/[id]/donor-status route'una gömülüydü; artık
 * tek yerde tutulur ki:
 *   - İlan sahibi bağışçıyı elle onayladığında (donor-status route)
 *   - 48 saat onaylanmazsa otomatik onaylandığında (blood-donor-reminders cron —
 *     o cron functions paketinde olduğu için BU dosyayı import EDEMEZ, ama aynı
 *     Firestore yazımlarını birebir tekrar eder; cert id + pastVolunteering doc
 *     id aynı → certIssued ile idempotent)
 * aynı sonucu üretir.
 *
 * İdempotency: çağıran taraf donor.certIssued flag'ini kontrol eder; bu fonksiyon
 * yalnızca verilmesi gerektiğinde çağrılır ve sonunda certIssued:true yazar.
 *
 * Admin SDK gerektirir; yalnızca sunucudan çağrılır.
 */

import type { Firestore } from 'firebase-admin/firestore';
import { FieldValue } from 'firebase-admin/firestore';

import { COLLECTIONS } from '@/firebase/collections';
import { buildCertCode } from '@/lib/certificate-code';
import { awardBadgesForUser } from '@/lib/award-badges';
import { notifyUser } from '@/lib/notify-user';

/** Kan bağışı puanı — "geldi" işaretlenince verilir. */
export const BLOOD_IMPACT_POINTS = 50;

/** Atomik sıralı sayaç (counters/{name}.next) — faaliyet/kişi numaraları için. */
async function nextSeq(db: Firestore, name: string, start: number): Promise<number> {
  const ref = db.collection('counters').doc(name);
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const cur = snap.exists ? ((snap.data() as { next?: number }).next ?? start) : start;
    tx.set(ref, { next: cur + 1 }, { merge: true });
    return cur;
  });
}

export interface AwardBloodDonationArgs {
  db: Firestore;
  /** emergencyRequests/{id} doc id */
  requestId: string;
  /** Bağışçı uid (donors/{donorUid}) */
  donorUid: string;
  /** Sertifika/kayıt başlığında kullanılan kurum adı (request.hospitalName ?? fallback). */
  ngoName: string;
  /** Sertifikayı veren uid — ilan sahibi ya da otomatik onayda 'system'. */
  issuedBy: string;
  /** Mevcut faaliyet no (talepte saklı; yoksa 0/undefined). */
  bloodActivityNo?: number;
  /** Mevcut kişi sırası (talepte saklı; yoksa 0/undefined). */
  bloodPersonSeq?: number;
}

export interface AwardBloodDonationResult {
  certId: string;
  activityNo: number;
  personSeq: number;
}

/**
 * Kan bağışı ödül zincirini çalıştırır:
 *   a. TİP-3 (kan) sertifikası (certificates + users/{uid}/certificates)
 *   b. pastVolunteering kaydı + awardBadgesForUser → kan rozeti (puan)
 *   c. impactScore += 50
 *   d. teşekkür DM'i (notifyUser, 3 kanal)
 *   e. donor.certIssued = true (çağıran taraf donorRef ile birlikte yazar)
 *
 * Faaliyet/kişi no'larını talep dokümanına yazar (tek faaliyet no, sıralı kişi).
 * certIssued bayrağını BU fonksiyon donorRef'e yazmaz — çağıran taraf donorRef'i
 * bildiği için status + certIssued'ı birlikte set eder.
 */
export async function awardBloodDonation(args: AwardBloodDonationArgs): Promise<AwardBloodDonationResult> {
  const { db, requestId, donorUid, ngoName, issuedBy } = args;
  const year = new Date().getFullYear();
  const today = new Date().toISOString().slice(0, 10);

  // Faaliyet no — talebe bir kez atanır; kişi no sıralı artar (talepte saklanır).
  let activityNo = args.bloodActivityNo ?? 0;
  if (!(activityNo >= 1)) {
    activityNo = await nextSeq(db, `cert-act-blood-${year}`, 1);
  }
  const personSeq = (args.bloodPersonSeq ?? 0) + 1;
  await db.collection(COLLECTIONS.emergencyRequests).doc(requestId)
    .set({ bloodActivityNo: activityNo, bloodPersonSeq: personSeq }, { merge: true });

  // a. Sertifika (TİP-3 kan).
  const certId = `blood-${requestId}-${donorUid}`;
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
    issuedBy,
  };
  await db.collection(COLLECTIONS.certificates).doc(certId).set(cert);
  await db.collection(COLLECTIONS.users).doc(donorUid)
    .collection(COLLECTIONS.certificates).doc(certId).set(cert);

  // b. pastVolunteering kaydı → kan rozeti (puan).
  await db.collection(COLLECTIONS.users).doc(donorUid)
    .collection(COLLECTIONS.pastVolunteering).doc(`blood-${requestId}`).set({
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
  await notifyUser({
    userId: donorUid,
    type: 'badge_earned',
    title: 'Kan bağışın için teşekkürler 🩸',
    body: 'Bir hayata dokundun. Kan bağışı sertifikan ve rozetin hazır — /my-badges',
    link: '/my-badges',
    data: { kind: 'blood-certificate', requestId, certificateId: certId },
    storeAsMessage: true,
    messageSubject: 'Kan Bağışın İçin Teşekkürler 🩸',
    messageContent: `Bir hayata dokundun. ${ngoName} için yaptığın kan bağışı kaydedildi.\n\nKan bağışı sertifikan ve Kan Bağışı rozetin profiline yüklendi (+${BLOOD_IMPACT_POINTS} impact puanı). Rozetlerine ve sertifikana ulaşmak için "Rozetlerim" sayfasına dokun 🧡`,
  });

  return { certId, activityNo, personSeq };
}

/**
 * Bağışçının kan (emergency-blood) Live Activity token kayıtlarını temizler.
 *
 * NOT: Lock Screen'deki Live Activity'nin görsel olarak KAPANMASI ayrı bir
 * trigger'a (functions/live-activity.ts → onEmergencyBloodUpdate) bağlıdır;
 * o trigger emergencyBloodCalls/{id} status 'resolved'/'cancelled' olunca APNs
 * 'end' push'u atar. Burada yapılan: bu bağışçıya ait emergency-blood token
 * doc'larını silmek → ödülden sonra bağışçıya bayat update push'u GİTMEZ.
 * (Bağış akışı emergencyRequests üzerinde çalışır; emergencyBloodCalls doc'unu
 * bu route kapatmaz, dolayısıyla burada APNs 'end' push'u GÖNDERMEYİZ.)
 */
export async function endDonorBloodLiveActivity(
  db: Firestore,
  donorUid: string,
  requestId: string,
): Promise<void> {
  const snap = await db.collection(COLLECTIONS.liveActivityTokens)
    .where('uid', '==', donorUid)
    .where('type', '==', 'emergency-blood')
    .where('referenceId', '==', requestId)
    .get()
    .catch(() => null);
  if (!snap || snap.empty) return;
  const batch = db.batch();
  for (const d of snap.docs) batch.delete(d.ref);
  await batch.commit().catch(() => undefined);
}
