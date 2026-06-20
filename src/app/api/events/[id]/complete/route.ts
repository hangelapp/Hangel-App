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
  const ev = eventSnap.data() as { name?: string; organizerId?: string; organizer?: string; createdBy?: string; startDate?: string };

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
  let newlyCertified = 0; let alreadyDone = 0;

  for (const targetUid of uids) {
    const certId = `evt-${eventId}-${targetUid}`;
    const certRef = db.collection(COLLECTIONS.certificates).doc(certId);
    if ((await certRef.get()).exists) { alreadyDone++; continue; } // idempotent

    // Doğrulama kodu (H… ) — /c/{kod} sayfasından kontrol edilir. Client PDF aynı
    // girdiden (date + certId) AYNI kodu üretir → DB eşleşmesi çalışır.
    const cert = {
      id: certId, userId: targetUid, eventId, eventName, title: eventName, role: 'participant',
      ngoId, ngoName, type: 'event', date: eventDate,
      code: buildCertCode({ date: eventDate, country: 'TR', kind: 'event', idSeed: certId }),
      completedAt: FieldValue.serverTimestamp(), issuedBy: uid,
    };
    await certRef.set(cert);
    await db.collection(COLLECTIONS.users).doc(targetUid).collection(COLLECTIONS.certificates).doc(certId).set(cert);
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

  await eventRef.update({ completedAt: FieldValue.serverTimestamp(), completedBy: uid, completed: true }).catch(() => undefined);

  return NextResponse.json({ ok: true, total: uids.size, newlyCertified, alreadyDone });
}
