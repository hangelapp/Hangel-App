/**
 * Kan bağışçısı takip hatırlatmaları + onaylanmayan bağışın otomatik onayı.
 *
 * Schedule: her 30 dakika. İki iş:
 *
 * 1) HATIRLATMA — status=='coming' bağışçıya, "geleceğim" (comingAt) anından
 *    sonra 1h / 2h / 3h geçtikçe "kan verebildin mi?" push+in-app:
 *      • ≥1h & !reminder1Sent → reminder1 ("Bugün kan bağışı yapabildin mi? 🧡 …")
 *      • ≥2h & !reminder2Sent → reminder2 (aynı çağrı, ikinci dürtü)
 *      • ≥3h & !reminder3Sent → reminder3 (son + en yumuşak ton)
 *    reminder3'ten sonra durur. Her push "Verdim ✅" aksiyonuyla donor-confirm
 *    akışına derin link verir.
 *
 * 2) OTOMATİK ONAY (non-match) — status=='donor_reported' bağışçı, reportedAt'ten
 *    48 saat sonra ilan sahibi hâlâ onaylamadıysa: status:'came', autoConfirmed:true
 *    ve TAM ödül zinciri (sertifika + rozet + puan + DM). Böylece bağışçı asla
 *    ödülsüz kalmaz. İlan sahibine "otomatik onaylandı" bilgisi gider.
 *
 * Ödül yazımı api/emergency/[id]/donor-status route'undaki src/lib/blood-award.ts
 * ile BİREBİR aynı doc'ları üretir (cert id, pastVolunteering doc id aynı) →
 * functions paketi src/lib'i import EDEMEYECEĞİ için mantık burada tekrar edilir
 * ama çıktı byte-uyumludur; certIssued bayrağı ile idempotenttir.
 *
 * Donor pool taraması: yeni collectionGroup index'i gerektirmemek için (mevcut
 * volunteer-reminders.ts deseni) son 'blood' taleplerini gezip donors
 * alt-koleksiyonunu bellekte süzeriz. Region: europe-west1.
 *
 * Deploy: cd functions && npm run build && firebase deploy --only functions
 */
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import type { Firestore } from 'firebase-admin/firestore';

const REGION = 'europe-west1';
const TIMEZONE = 'Europe/Istanbul';
const HOUR = 3600_000;
const MAX_REQUESTS_PER_RUN = 200;
const AUTO_CONFIRM_AFTER_MS = 48 * HOUR;
const BLOOD_IMPACT_POINTS = 50;

// ── Sertifika kodu (src/lib/certificate-code.ts buildCertCode ile birebir aynı) ──
// Tiresiz yapısal kod: H + ülke(90) + tür(3=kan) + yıl(2) + faaliyetNo + kişiNo(3) + Luhn.
// /api/certificate/verify DB string eşlemesi yaptığı için kod BU formatta olmalı.
function pad3(n: number): string {
  return String(Math.floor(n)).padStart(3, '0');
}
function luhnCheckDigit(numStr: string): number {
  let sum = 0;
  let dbl = true;
  for (let i = numStr.length - 1; i >= 0; i--) {
    let d = numStr.charCodeAt(i) - 48;
    if (d < 0 || d > 9) continue;
    if (dbl) { d *= 2; if (d > 9) d -= 9; }
    sum += d;
    dbl = !dbl;
  }
  return (10 - (sum % 10)) % 10;
}
function buildBloodCertCode(year: number, activityNo: number, personNo: number): string {
  const cc = '90';
  const ty = '3'; // kan
  const yy = String(((year % 100) + 100) % 100).padStart(2, '0');
  const act = activityNo >= 1 ? String(Math.floor(activityNo)) : '0';
  const pn = personNo >= 1 ? pad3(personNo) : pad3(0);
  const payload = `${cc}${ty}${yy}${act}${pn}`;
  return `H${payload}${luhnCheckDigit(payload)}`;
}

// Atomik sıralı sayaç (counters/{name}.next) — donor-status route ile aynı.
async function nextSeq(db: Firestore, name: string, start: number): Promise<number> {
  const ref = db.collection('counters').doc(name);
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const cur = snap.exists ? ((snap.data() as { next?: number }).next ?? start) : start;
    tx.set(ref, { next: cur + 1 }, { merge: true });
    return cur;
  });
}

interface RequestDoc {
  type?: string;
  requestedBy?: string;
  hospitalName?: string;
  bloodActivityNo?: number;
  bloodPersonSeq?: number;
}

interface DonorDoc {
  uid?: string;
  name?: string;
  status?: string;
  comingAt?: Timestamp;
  reportedAt?: Timestamp;
  reminder1Sent?: boolean;
  reminder2Sent?: boolean;
  reminder3Sent?: boolean;
  certIssued?: boolean;
  autoConfirmed?: boolean;
}

function toMillis(ts: Timestamp | undefined): number | null {
  if (!ts || typeof ts.toMillis !== 'function') return null;
  try { return ts.toMillis(); } catch { return null; }
}

/** In-app notifications doc yaz (onNotificationCreated FCM push'a döndürür). */
function writeNotification(
  db: Firestore,
  args: { userId: string; type: string; title: string; body: string; link: string; data?: Record<string, string> },
): Promise<FirebaseFirestore.WriteResult> {
  return db.collection('notifications').doc().set({
    userId: args.userId,
    type: args.type,
    title: args.title,
    body: args.body.slice(0, 200),
    link: args.link,
    data: { link: args.link, ...(args.data ?? {}) },
    read: false,
    pushSent: false, // onNotificationCreated FCM push'u göndersin
    createdAt: FieldValue.serverTimestamp(),
    createdBy: 'system-blood-reminder',
  });
}

/**
 * 48h+ onaylanmamış 'donor_reported' bağışçıya TAM ödülü yaz (donor-status ile
 * birebir aynı doc'lar). certIssued ile idempotent; çağrılmadan önce kontrol edilir.
 */
async function autoAwardDonor(
  db: Firestore,
  reqId: string,
  reqRef: FirebaseFirestore.DocumentReference,
  request: RequestDoc,
  donorUid: string,
): Promise<void> {
  const year = new Date().getFullYear();
  const today = new Date().toISOString().slice(0, 10);
  const ngoName = request.hospitalName || 'hangel Kan';

  let activityNo = request.bloodActivityNo ?? 0;
  if (!(activityNo >= 1)) {
    activityNo = await nextSeq(db, `cert-act-blood-${year}`, 1);
  }
  const personSeq = (request.bloodPersonSeq ?? 0) + 1;
  await reqRef.set({ bloodActivityNo: activityNo, bloodPersonSeq: personSeq }, { merge: true });

  const certId = `blood-${reqId}-${donorUid}`;
  const cert = {
    id: certId,
    userId: donorUid,
    type: 'blood',
    title: 'Kan Bağışı Sertifikası',
    role: 'donor',
    ngoName,
    date: today,
    code: buildBloodCertCode(year, activityNo, personSeq),
    certCountry: '90',
    certYear: year,
    certActivityNo: activityNo,
    certPersonNo: personSeq,
    completedAt: FieldValue.serverTimestamp(),
    issuedBy: 'system',
  };
  await db.collection('certificates').doc(certId).set(cert);
  await db.collection('users').doc(donorUid)
    .collection('certificates').doc(certId).set(cert);

  // pastVolunteering — kan rozeti puanı. (Rozet hesabı app-side awardBadgesForUser'a
  // bağlı; functions o saf fonksiyonu import edemez. pastVolunteering kaydı yazılır,
  // kullanıcı /my-badges'e girdiğinde veya bir sonraki app-side ödül çağrısında
  // areaPoints yeniden hesaplanıp rozet açılır — kayıt asla kaybolmaz.)
  await db.collection('users').doc(donorUid)
    .collection('pastVolunteering').doc(`blood-${reqId}`).set({
      socialArea: 'Kan Bağışı Gönüllüsü',
      points: 100,
      title: 'Kan Bağışı',
      ngoName,
      completedAt: FieldValue.serverTimestamp(),
    });

  await db.collection('users').doc(donorUid)
    .update({ impactScore: FieldValue.increment(BLOOD_IMPACT_POINTS) })
    .catch(() => undefined);

  // Teşekkür DM'i — bağışçıya (in-app + push).
  await writeNotification(db, {
    userId: donorUid,
    type: 'badge_earned',
    title: 'Kan bağışın için teşekkürler 🩸',
    body: 'Bir hayata dokundun. Kan bağışı sertifikan ve rozetin hazır — /my-badges',
    link: '/my-badges',
    data: { kind: 'blood-certificate', requestId: reqId, certificateId: certId },
  }).catch((e) => logger.warn(`[blood-donor-reminders] thanks notif failed donor=${donorUid}`, e));
}

export const bloodDonorReminders = onSchedule(
  { schedule: 'every 30 minutes', timeZone: TIMEZONE, region: REGION },
  async () => {
    const db = getFirestore();
    const now = Date.now();

    // Son 'blood' talepleri (collectionGroup index gerektirmemek için talep bazlı tara).
    const reqSnap = await db.collection('emergencyRequests')
      .where('type', '==', 'blood')
      .limit(MAX_REQUESTS_PER_RUN)
      .get()
      .catch((e) => {
        logger.warn('[blood-donor-reminders] requests query failed', e);
        return null;
      });
    const reqDocs = reqSnap ? reqSnap.docs : [];

    let reminded = 0;
    let autoConfirmed = 0;
    let failures = 0;

    for (const rd of reqDocs) {
      const request = rd.data() as RequestDoc;
      const reqId = rd.id;
      const requesterUid = typeof request.requestedBy === 'string' ? request.requestedBy.trim() : '';

      const donorsSnap = await rd.ref.collection('donors').get().catch((e) => {
        logger.warn(`[blood-donor-reminders] donors read failed req=${reqId}`, e);
        return null;
      });
      if (!donorsSnap || donorsSnap.empty) continue;

      for (const dd of donorsSnap.docs) {
        const donor = dd.data() as DonorDoc;
        const donorUid = donor.uid || dd.id;
        const donorName = (donor.name ?? '').trim() || 'Bir bağışçı';

        // ── 1) HATIRLATMA — status 'coming' ──
        if (donor.status === 'coming') {
          const comingMs = toMillis(donor.comingAt);
          if (comingMs == null) continue; // comingAt yoksa damga bekle
          const elapsed = now - comingMs;
          const link = `/emergency?confirm=${encodeURIComponent(reqId)}&donor=${encodeURIComponent(donorUid)}`;

          let key: 'reminder1Sent' | 'reminder2Sent' | 'reminder3Sent' | null = null;
          let body = '';
          if (elapsed >= 3 * HOUR && !donor.reminder3Sent) {
            key = 'reminder3Sent';
            body = 'Acele yok, fırsat bulunca kan verebildiysen bize bildir 🧡 "Verdim ✅" dokunman yeterli.';
          } else if (elapsed >= 2 * HOUR && !donor.reminder2Sent) {
            key = 'reminder2Sent';
            body = 'Bugün kan bağışı yapabildin mi? 🧡 Tamamladıysan bize bildir.';
          } else if (elapsed >= HOUR && !donor.reminder1Sent) {
            key = 'reminder1Sent';
            body = 'Bugün kan bağışı yapabildin mi? 🧡 Tamamladıysan bize bildir.';
          }

          if (key) {
            try {
              await writeNotification(db, {
                userId: donorUid,
                type: 'blood-donor-reminder',
                title: 'Kan bağışını bildir 🩸',
                body,
                link,
                data: { kind: 'blood-donor-reminder', requestId: reqId, action: 'donor-confirm' },
              });
              await dd.ref.set({ [key]: true }, { merge: true });
              reminded++;
            } catch (e) {
              failures++;
              logger.error(`[blood-donor-reminders] reminder failed req=${reqId} donor=${donorUid} key=${key}`, e);
            }
          }
          continue;
        }

        // ── 2) OTOMATİK ONAY — status 'donor_reported', 48h+ onaylanmadı ──
        if (donor.status === 'donor_reported' && !donor.certIssued) {
          const reportedMs = toMillis(donor.reportedAt);
          if (reportedMs == null) continue;
          if (now - reportedMs < AUTO_CONFIRM_AFTER_MS) continue;

          try {
            await autoAwardDonor(db, reqId, rd.ref, request, donorUid);
            await dd.ref.set(
              { status: 'came', autoConfirmed: true, certIssued: true, statusAt: FieldValue.serverTimestamp() },
              { merge: true },
            );
            autoConfirmed++;

            // İlan sahibine bilgi.
            if (requesterUid) {
              await writeNotification(db, {
                userId: requesterUid,
                type: 'blood-auto-confirmed',
                title: 'Bağış otomatik onaylandı 🧡',
                body: `${donorName}'in bağışı otomatik onaylandı.`,
                link: `/emergency`,
                data: { kind: 'blood-auto-confirmed', requestId: reqId, donorUid },
              }).catch((e) => logger.warn(`[blood-donor-reminders] requester notif failed req=${reqId}`, e));
            }
          } catch (e) {
            failures++;
            logger.error(`[blood-donor-reminders] auto-confirm failed req=${reqId} donor=${donorUid}`, e);
          }
        }
      }
    }

    logger.info(`[blood-donor-reminders] reminded=${reminded} autoConfirmed=${autoConfirmed} failures=${failures} requests=${reqDocs.length}`);
  },
);
