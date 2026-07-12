/**
 * POST /api/events/[id]/update
 *
 * Etkinlik sahibinin (kulüp/STK admini) kendi etkinliğini DÜZENLEMESİ + tüm
 * katılımcı ve konuşmacılara "etkinlik güncellendi" bildirimi göndermesi.
 *
 * Neden server-side: events update firestore kuralı yalnız organizerId==uid'e
 * (kulüp adminin uid'i ≠ kulüp id) ya da super-admin'e izin verir; managedClubId
 * fallback'i yok. Admin SDK kuralları bypass eder + rsvps'i okuyup bildirim yazar.
 *
 * Yetki: super-admin VEYA event.createdBy==uid VEYA users/{uid}.managedClubId/
 * managedNgoId == event.organizerId. `status`/`organizerId` gibi alanlar değişmez.
 */
import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { notifyUser } from '@/lib/notify-user';

export const runtime = 'nodejs';

function errJson(errorCode: string, message: string, status: number) {
  return NextResponse.json({ errorCode, message }, { status });
}

// Düzenlenebilir alanların izinli listesi (status/organizerId/createdBy yazılmaz).
const EDITABLE_KEYS = [
  'name', 'date', 'startDate', 'endDate', 'time', 'type', 'tags', 'language',
  'capacity', 'participationCondition', 'providesCertificate', 'location',
  'description', 'imageUrl', 'contributors', 'agenda', 'organizerLogoUrl',
  'corporateParticipants', 'points',
] as const;

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: eventId } = await params;
  if (!eventId) return errJson('invalid_event_id', 'Etkinlik kimliği gerekli', 400);

  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) return errJson('unauthenticated', 'Token gerekli', 401);

  let uid: string;
  let role: unknown;
  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    uid = decoded.uid;
    role = (decoded as { role?: unknown }).role;
  } catch {
    return errJson('unauthenticated', 'Geçersiz token', 401);
  }
  const isSuperAdmin = role === 'super-admin';

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return errJson('invalid_body', 'Geçersiz istek gövdesi', 400);
  }

  const db = getAdminFirestore();
  const eventRef = db.collection(COLLECTIONS.events).doc(eventId);
  const eventSnap = await eventRef.get();
  if (!eventSnap.exists) return errJson('event_not_found', 'Etkinlik bulunamadı', 404);
  const ev = eventSnap.data() as {
    name?: string; slug?: string; organizerId?: string; createdBy?: string;
    contributors?: Array<{ userId?: string }>;
  };

  // Yetki kontrolü (attendees route ile aynı mantık)
  let authorized = isSuperAdmin || ev.createdBy === uid;
  if (!authorized && ev.organizerId) {
    const userSnap = await db.collection(COLLECTIONS.users).doc(uid).get();
    const ud = userSnap.data() as { managedClubId?: string; managedNgoId?: string } | undefined;
    if (ud && (ud.managedClubId === ev.organizerId || ud.managedNgoId === ev.organizerId)) {
      authorized = true;
    }
  }
  if (!authorized) return errJson('forbidden', 'Bu etkinliği düzenleme yetkin yok', 403);

  // Sadece izinli alanları al (undefined olanları atla).
  const patch: Record<string, unknown> = {};
  for (const key of EDITABLE_KEYS) {
    if (key in body && body[key] !== undefined) patch[key] = body[key];
  }
  // capacity: mevcut katılımcı sayısını (current) EZME — yalnız max'i güncelle (dot-path).
  if (patch.capacity && typeof patch.capacity === 'object') {
    const cap = patch.capacity as { max?: number };
    delete patch.capacity;
    if (typeof cap.max === 'number') patch['capacity.max'] = cap.max;
  }
  if (Object.keys(patch).length === 0) {
    return errJson('empty_update', 'Güncellenecek alan yok', 400);
  }
  patch.updatedAt = Date.now();
  patch.updatedBy = uid;

  try {
    await eventRef.update(patch);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error('[api/events/update] update failed', message);
    return errJson('update_failed', message, 500);
  }

  // ---- Bildirim: tüm "going" katılımcılar + konuşmacılar (userId'si olanlar) ----
  const eventName = (patch.name as string) || ev.name || 'Etkinlik';
  const eventSlug = ev.slug || eventId;
  const recipients = new Set<string>();
  try {
    const rsvpsSnap = await eventRef.collection(COLLECTIONS.eventRsvps).where('status', '==', 'going').get();
    for (const d of rsvpsSnap.docs) recipients.add(d.id);
  } catch (e) {
    console.warn('[api/events/update] rsvp read failed', e);
  }
  // Konuşmacı/sanatçı listesi (güncel patch varsa onu, yoksa mevcut event'i baz al)
  const contributors = (patch.contributors as Array<{ userId?: string }> | undefined) ?? ev.contributors ?? [];
  for (const c of contributors) {
    if (c?.userId) recipients.add(c.userId);
  }
  recipients.delete(uid); // düzenleyenin kendisine bildirim gitmesin

  let notified = 0;
  await Promise.all(
    Array.from(recipients).map(async (rid) => {
      try {
        await notifyUser({
          userId: rid,
          type: 'event_updated',
          title: 'Etkinlik güncellendi',
          body: `${eventName} etkinliğinde güncelleme yapıldı. Detaylar için etkinlik sayfasına göz at.`,
          link: `/events/${eventSlug}`,
          data: { eventId, eventName },
        });
        notified += 1;
      } catch (e) {
        console.warn('[api/events/update] notify failed for', rid, e);
      }
    }),
  );

  return NextResponse.json({ ok: true, notified });
}
