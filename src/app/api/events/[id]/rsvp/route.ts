/**
 * FEAT-EVENT-RSVP — POST /api/events/[id]/rsvp
 *
 * Body: { action: 'going' | 'cancel' }
 * Auth: Firebase ID token (Bearer)
 *
 * Atomic via runTransaction:
 *   - read user's existing rsvp (events/{id}/rsvps/{uid})
 *   - read event doc to obtain capacity (event.capacity.max)
 *   - count current 'going' rsvps via aggregate count
 *   - if action='going' and at capacity (and not already going) -> 409 EVENT_FULL
 *   - else write/update rsvp & return { status, count }
 *
 * Capacity rule: event.capacity.max is the cap. `undefined`, `null` or `0`
 * means "unlimited" (no cap).
 *
 * NOTE (firestore.rules): writes to events/{eventId}/rsvps/{userId} are
 * server-side (Admin SDK) only via this endpoint. Client rule additions
 * (optional follow-up):
 *
 *   match /events/{eventId}/rsvps/{userId} {
 *     // Read own rsvp only; writes go through API for capacity guard.
 *     allow read: if request.auth != null && request.auth.uid == userId;
 *     allow write: if false;
 *   }
 */
import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { notifyUser } from '@/lib/notify-user';
import { getUserEventRole } from '@/lib/event-roles';
import type { EventContributor } from '@/lib/types';

export const runtime = 'nodejs';

interface RsvpBody {
  action?: 'going' | 'cancel';
}

function errJson(errorCode: string, message: string, status: number) {
  return NextResponse.json({ errorCode, message }, { status });
}


export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params;
  if (!eventId || typeof eventId !== 'string') {
    return errJson('invalid_event_id', 'Etkinlik kimliği gerekli', 400);
  }

  // --- Auth: verify Firebase ID token ---
  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) {
    return errJson('unauthenticated', 'Token gerekli', 401);
  }

  let uid: string;
  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    uid = decoded.uid;
  } catch {
    return errJson('unauthenticated', 'Geçersiz token', 401);
  }

  // --- Body ---
  let body: RsvpBody;
  try {
    body = (await req.json()) as RsvpBody;
  } catch {
    return errJson('invalid_json', 'Geçersiz JSON', 400);
  }
  const action = body.action;
  if (action !== 'going' && action !== 'cancel') {
    return errJson('invalid_action', "action 'going' veya 'cancel' olmalı", 400);
  }

  const db = getAdminFirestore();
  const eventRef = db.collection(COLLECTIONS.events).doc(eventId);
  const rsvpsCol = eventRef.collection(COLLECTIONS.eventRsvps);
  const rsvpRef = rsvpsCol.doc(uid);

  try {
    const result = await db.runTransaction(async (tx) => {
      const [eventSnap, rsvpSnap] = await Promise.all([
        tx.get(eventRef),
        tx.get(rsvpRef),
      ]);

      if (!eventSnap.exists) {
        throw new RsvpError('event_not_found', 'Etkinlik bulunamadı', 404);
      }
      const eventData = eventSnap.data() as
        | {
            capacity?: { max?: number; current?: number } | number;
            name?: string;
            slug?: string;
            location?: { city?: string };
            contributors?: EventContributor[];
          }
        | undefined;
      const eventName = eventData?.name || 'Etkinlik';
      const eventSlug = eventData?.slug || eventId;
      // Kullanıcının etkinlikteki rolü (contributors eşleşmesi; yoksa 'participant').
      const role = getUserEventRole(eventData?.contributors, uid);

      // capacity.max is the cap; 0/undefined/null means unlimited
      let cap: number | null = null;
      if (eventData?.capacity && typeof eventData.capacity === 'object') {
        cap = typeof eventData.capacity.max === 'number' && eventData.capacity.max > 0
          ? eventData.capacity.max
          : null;
      } else if (typeof eventData?.capacity === 'number' && eventData.capacity > 0) {
        cap = eventData.capacity;
      }

      const existingStatus = rsvpSnap.exists
        ? (rsvpSnap.data() as { status?: string } | undefined)?.status
        : null;
      const wasGoing = existingStatus === 'going';

      // Count current 'going' RSVPs (aggregate count, runs inside tx).
      const goingCountSnap = await tx.get(
        rsvpsCol.where('status', '==', 'going').count()
      );
      const goingCount = goingCountSnap.data().count ?? 0;

      if (action === 'going') {
        if (!wasGoing && cap !== null && goingCount >= cap) {
          throw new RsvpError('EVENT_FULL', 'Etkinlik kapasitesi dolmuş', 409);
        }
        tx.set(
          rsvpRef,
          {
            userId: uid,
            status: 'going',
            role,
            createdAt: rsvpSnap.exists
              ? rsvpSnap.get('createdAt') ?? FieldValue.serverTimestamp()
              : FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
        const newCount = wasGoing ? goingCount : goingCount + 1;
        return { status: 'going' as const, count: newCount, newlyGoing: !wasGoing, eventName, eventSlug, role };
      }

      // action === 'cancel'
      if (rsvpSnap.exists) {
        tx.set(
          rsvpRef,
          {
            userId: uid,
            status: 'cancelled',
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      }
      const newCount = wasGoing ? Math.max(0, goingCount - 1) : goingCount;
      return { status: 'cancelled' as const, count: newCount, newlyGoing: false, eventName, eventSlug, role };
    });

    // Yeni katılımda: katılımcıya yaka kartı DM'i + bildirim gönder (best-effort).
    if (result.status === 'going' && result.newlyGoing) {
      try {
        await notifyUser({
          userId: uid,
          type: 'badge_earned',
          title: 'Yaka kartınız hazır 🎫',
          body: `${result.eventName} etkinliğine kaydınız alındı. Dijital yaka kartınızı etkinlik sayfasından görüntüleyebilirsiniz.`,
          link: `/events/${result.eventSlug}`,
          data: { eventId, eventName: result.eventName, role: result.role },
          storeAsMessage: true,
          messageSubject: 'Yaka Kartınız Hazır 🎫',
          messageContent: `${result.eventName} etkinliğine katılımınız onaylandı. Etkinlik günü girişte kullanacağınız QR kodlu dijital yaka kartınız hazır — etkinlik sayfasındaki "Yaka Kartı" butonundan görüntüleyip indirebilirsiniz. Görüşmek üzere!`,
        });
      } catch (notifyErr) {
        console.warn('[api/events/rsvp] notify failed', notifyErr);
      }
      // NOT: Katılım puanı artık KAYITTA değil, "Etkinliği Tamamla" akışında
      // (organizatör onayından sonra) verilir → /api/events/[id]/complete.
    }

    return NextResponse.json({ status: result.status, count: result.count });
  } catch (err) {
    if (err instanceof RsvpError) {
      return errJson(err.errorCode, err.message, err.status);
    }
    const message = err instanceof Error ? err.message : String(err);
    console.error('[api/events/rsvp]', message);
    return errJson('internal', message, 500);
  }
}

class RsvpError extends Error {
  constructor(
    public errorCode: string,
    message: string,
    public status: number
  ) {
    super(message);
  }
}
