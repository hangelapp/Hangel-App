/**
 * POST /api/events/[id]/complete — "Etkinliği Tamamla"
 *
 * Organizatör/super-admin etkinliği tamamladığında çağrılır. Tüm katılımcılara
 * (RSVP "going" + check-in yapanlar birleşik):
 *   1. Katılım SERTİFİKASI yazılır (idempotent: evt-{eventId}-{uid}).
 *   2. notifyUser ile teşekkür: bildirim + hangel DM + push — /my-badges deep-link'li.
 * Etkinlik `completedAt` ile işaretlenir. Tekrar çağrılırsa zaten sertifikalı olanlar
 * atlanır (çift göndermez) → "gitmeyenlere gönder" mantığı bununla işler.
 *
 * WhatsApp: onaylı şablon gelince bu akışa eklenecek (şimdilik DM+bildirim).
 * Dönüş: { total, newlyCertified, alreadyDone }
 */
import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { notifyUser } from '@/lib/notify-user';
import { buildCertCode } from '@/lib/certificate-code';

export const runtime = 'nodejs';

// Katılım puanı — "Tamamla" (organizatör onayı) anında verilir, kayıtta değil.
const COMPLETION_POINTS = 20;

function errJson(errorCode: string, message: string, status: number) {
  return NextResponse.json({ errorCode, message }, { status });
}

// Atomik sıralı sayaç (counters/{name}.next) — faaliyet/kişi numaraları için.
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
  const { id: eventId } = await params;
  if (!eventId) return errJson('invalid_event_id', 'Etkinlik kimliği gerekli', 400);

  const token = (req.headers.get('authorization') ?? '').startsWith('Bearer ')
    ? (req.headers.get('authorization') ?? '').slice(7).trim() : '';
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
  const eventRef = db.collection(COLLECTIONS.events).doc(eventId);
  const eventSnap = await eventRef.get();
  if (!eventSnap.exists) return errJson('event_not_found', 'Etkinlik bulunamadı', 404);
  const ev = eventSnap.data() as { name?: string; organizerId?: string; organizer?: string; createdBy?: string; startDate?: string; location?: { city?: string }; organizerLogoUrl?: string };

  // Yetki — organizatör veya super-admin
  let authorized = isSuperAdmin || ev.createdBy === uid;
  if (!authorized && ev.organizerId) {
    const ud = (await db.collection(COLLECTIONS.users).doc(uid).get()).data() as { managedClubId?: string; managedNgoId?: string } | undefined;
    if (ud && (ud.managedClubId === ev.organizerId || ud.managedNgoId === ev.organizerId)) authorized = true;
  }
  if (!authorized) return errJson('forbidden', 'Bu etkinliği tamamlama yetkin yok', 403);

  // Katılımcılar — RSVP going + checkins (kimliği olanlar) + yönetici değerlendirmeleri
  const [rsvpsSnap, checkinsSnap, reviewsSnap] = await Promise.all([
    eventRef.collection(COLLECTIONS.eventRsvps).where('status', '==', 'going').get(),
    eventRef.collection(COLLECTIONS.eventCheckins).get(),
    eventRef.collection(COLLECTIONS.eventParticipantReviews).get(),
  ]);
  const uids = new Set<string>(rsvpsSnap.docs.map((d) => d.id));
  for (const d of checkinsSnap.docs) {
    const u = (d.data() as { uid?: string | null }).uid;
    if (u) uids.add(u);
  }
  // Yöneticinin "Tamamla" akışında verdiği puan/yorum → teşekkür DM'ine işlenir.
  const reviewByUid: Record<string, { rating?: number; comment?: string }> = {};
  for (const d of reviewsSnap.docs) {
    const data = d.data() as { rating?: number; comment?: string };
    reviewByUid[d.id] = { rating: data.rating, comment: data.comment };
  }

  const eventName = ev.name || 'Etkinlik';
  const ngoId = ev.organizerId || '';
  const ngoName = ev.organizer || 'hangel';
  const eventDate = ev.startDate || new Date().toISOString().slice(0, 10);
  const eventLogo = ev.organizerLogoUrl || '';
  const parsedYear = new Date(eventDate).getFullYear();
  const eventYear = Number.isFinite(parsedYear) ? parsedYear : new Date().getFullYear();
  const certCountry = '90'; // TR (ileride etkinlik ülkesinden)

  // Faaliyet no — yıl bazında sıralı; etkinliğe bir kez atanır (ilk tamamlamada).
  let activityNo = (ev as { certActivityNo?: number }).certActivityNo ?? 0;
  if (!(activityNo >= 1)) activityNo = await nextSeq(db, `cert-act-event-${eventYear}`, 1);
  let personSeq = (ev as { certPersonSeq?: number }).certPersonSeq ?? 0;

  let newlyCertified = 0; let alreadyDone = 0;

  for (const targetUid of uids) {
    const certId = `evt-${eventId}-${targetUid}`;
    const certRef = db.collection(COLLECTIONS.certificates).doc(certId);
    const userCertRef = db.collection(COLLECTIONS.users).doc(targetUid).collection(COLLECTIONS.certificates).doc(certId);
    const existingSnap = await certRef.get();
    if (existingSnap.exists) {
      // İdempotent: sertifika zaten var. ANCAK profil/my-badges YALNIZ kullanıcının
      // alt koleksiyonundan (users/{uid}/certificates) okur. Eğer eski bir sürümde
      // yalnız top-level yazıldıysa alt koleksiyon kopyası eksik olabilir → kullanıcı
      // sertifikasını göremez. Burada eksikse tamamla (kendini iyileştirme); yeniden
      // bildirim/puan YOK, yalnız görünürlüğü onarır.
      const userCertSnap = await userCertRef.get();
      if (!userCertSnap.exists) {
        await userCertRef.set(existingSnap.data() as Record<string, unknown>, { merge: true });
      }
      alreadyDone++;
      continue;
    }

    // Sıralı kişi no + tiresiz Luhn'lı kod (H + ülke + tür + yıl + faaliyet + kişi + sağlama).
    // Yapısal alanlar ayrıca saklanır → /c doğrulamada DB'den gösterilir.
    personSeq += 1;
    const cert = {
      id: certId, userId: targetUid, eventId, eventName, title: eventName, role: 'participant',
      ngoId, ngoName, type: 'event', date: eventDate, organizerLogoUrl: eventLogo,
      code: buildCertCode({ kind: 'event', country: certCountry, year: eventYear, activityNo, personNo: personSeq }),
      certCountry, certYear: eventYear, certActivityNo: activityNo, certPersonNo: personSeq,
      completedAt: FieldValue.serverTimestamp(), issuedBy: uid,
    };
    await certRef.set(cert);
    await userCertRef.set(cert);
    // Katılım puanı (tamamlama anında).
    await db.collection(COLLECTIONS.users).doc(targetUid).update({ impactScore: FieldValue.increment(COMPLETION_POINTS) }).catch(() => undefined);

    const thanks = `${ngoName} yönetim ekibi olarak ${eventName} etkinliğimize katılımınız için teşekkür ederiz 🧡`;
    // Yönetici değerlendirmesi (puan/yorum) varsa teşekkür mesajına ekle.
    const rev = reviewByUid[targetUid];
    let reviewLine = '';
    if (rev) {
      const stars = typeof rev.rating === 'number' && rev.rating >= 1 && rev.rating <= 5
        ? '⭐'.repeat(rev.rating) + ` (${rev.rating}/5)`
        : '';
      const comment = (rev.comment || '').trim();
      if (stars || comment) {
        reviewLine = `\n\nEkip değerlendirmesi: ${stars}${stars && comment ? ' — ' : ''}${comment ? `“${comment}”` : ''}`;
      }
    }
    try {
      await notifyUser({
        userId: targetUid,
        type: 'badge_earned',
        title: 'Sertifikan hazır 🎓 — etkinliği değerlendir ⭐',
        body: `${thanks} Sertifikan profiline yüklendi. Etkinliği değerlendirmek ve sertifikana ulaşmak için dokun 👉`,
        link: `/events/${eventId}`,
        data: { eventId, kind: 'event-certificate', certificateId: certId },
        storeAsMessage: true,
        messageSubject: 'Sertifikan Hazır 🎓 — Etkinliği Değerlendir ⭐',
        messageContent: `${thanks}${reviewLine}\n\nKatılım sertifikanız hazır (+${COMPLETION_POINTS} impact puanı). Etkinlik sayfasından sertifikanı görüntüleyip indirebilir, "⭐ Değerlendir" butonuyla etkinliği puanlayabilirsin 🧡`,
      });
    } catch (e) {
      console.warn('[events/complete] notify failed', targetUid, e);
    }
    newlyCertified++;
  }

  await eventRef.update({ completedAt: FieldValue.serverTimestamp(), completedBy: uid, completed: true, certActivityNo: activityNo, certPersonSeq: personSeq }).catch(() => undefined);

  return NextResponse.json({ ok: true, total: uids.size, newlyCertified, alreadyDone });
}
