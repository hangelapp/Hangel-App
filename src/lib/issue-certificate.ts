/**
 * issueEventCertificate — bir etkinlik katılım sertifikasını (idempotent) verir.
 * Hem "Tamamla" akışı hem sınav-geçince aynı numaralandırmayı kullanabilsin diye
 * ortak helper. +20 impact puanı da (yalnız yeni sertifikada) eklenir.
 *
 * Numaralandırma: certActivityNo yıl bazında sıralı (etkinliğe bir kez), certPersonNo
 * kişi bazında artan (event doc üzerinde transaction ile atomik).
 */
import type { Firestore } from 'firebase-admin/firestore';
import { FieldValue } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { buildCertCode } from '@/lib/certificate-code';

const COMPLETION_POINTS = 20;

async function nextSeq(db: Firestore, name: string, start: number): Promise<number> {
  const ref = db.collection('counters').doc(name);
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const cur = snap.exists ? ((snap.data() as { next?: number }).next ?? start) : start;
    tx.set(ref, { next: cur + 1 }, { merge: true });
    return cur;
  });
}

export async function issueEventCertificate(
  db: Firestore,
  opts: { eventId: string; uid: string; issuedBy: string },
): Promise<{ issued: boolean; certId: string }> {
  const { eventId, uid, issuedBy } = opts;
  const certId = `evt-${eventId}-${uid}`;
  const certRef = db.collection(COLLECTIONS.certificates).doc(certId);
  const userCertRef = db.collection(COLLECTIONS.users).doc(uid).collection(COLLECTIONS.certificates).doc(certId);

  const existing = await certRef.get();
  if (existing.exists) {
    // İdempotent: alt koleksiyon kopyası eksikse onar (görünürlük), puan/tekrar YOK.
    if (!(await userCertRef.get()).exists) await userCertRef.set(existing.data() as Record<string, unknown>, { merge: true });
    return { issued: false, certId };
  }

  const eventRef = db.collection(COLLECTIONS.events).doc(eventId);
  const evSnap = await eventRef.get();
  if (!evSnap.exists) return { issued: false, certId };
  const ev = evSnap.data() as {
    name?: string; organizerId?: string; organizer?: string; startDate?: string; organizerLogoUrl?: string;
    certActivityNo?: number; certYear?: number;
  };

  const eventName = ev.name || 'Etkinlik';
  const ngoId = ev.organizerId || '';
  const ngoName = ev.organizer || 'hangel';
  const eventDate = ev.startDate || new Date().toISOString().slice(0, 10);
  const parsedYear = new Date(eventDate).getFullYear();
  const eventYear = Number.isFinite(parsedYear) ? parsedYear : new Date().getFullYear();

  // Faaliyet no — yoksa ata (Tamamla genelde atamıştır).
  let activityNo = ev.certActivityNo ?? 0;
  if (!(activityNo >= 1)) {
    activityNo = await nextSeq(db, `cert-act-event-${eventYear}`, 1);
    await eventRef.set({ certActivityNo: activityNo }, { merge: true }).catch(() => undefined);
  }

  // Kişi no — event doc üzerinde atomik artır.
  const personNo = await db.runTransaction(async (tx) => {
    const s = await tx.get(eventRef);
    const cur = (s.data() as { certPersonSeq?: number } | undefined)?.certPersonSeq ?? 0;
    const next = cur + 1;
    tx.set(eventRef, { certPersonSeq: next }, { merge: true });
    return next;
  });

  const cert = {
    id: certId, userId: uid, eventId, eventName, title: eventName, role: 'participant',
    ngoId, ngoName, type: 'event', date: eventDate, organizerLogoUrl: ev.organizerLogoUrl || '',
    code: buildCertCode({ kind: 'event', country: '90', year: eventYear, activityNo, personNo }),
    certCountry: '90', certYear: eventYear, certActivityNo: activityNo, certPersonNo: personNo,
    completedAt: FieldValue.serverTimestamp(), issuedBy,
  };
  await certRef.set(cert);
  await userCertRef.set(cert);
  await db.collection(COLLECTIONS.users).doc(uid).update({ impactScore: FieldValue.increment(COMPLETION_POINTS) }).catch(() => undefined);

  return { issued: true, certId };
}
