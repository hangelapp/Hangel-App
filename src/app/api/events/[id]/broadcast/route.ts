/**
 * POST /api/events/[id]/broadcast — STK etkinlik toplu mesaj
 *
 * Etkinlik organizatörü (veya super-admin) etkinliğe katılan herkese toplu bir
 * mesaj gönderir. Mesaj `notifyUser` ile 3 kanala fan-out edilir (in-app
 * bildirim + Gelen Kutusu mesajı + FCM push).
 *
 * Etkinlikte tek hedef grup vardır: katılımcılar. Katılımcı uid'leri
 *   - events/{id}/rsvps  (status == 'going', doc id = userId)
 *   - applications       (entityId == id, etkinlik başvurusu varsa)
 * kaynaklarının birleşimi (Set) olarak toplanır.
 *
 * Yetki: super-admin VEYA etkinlik organizatörü
 *   (event.organizerId == actor.ngoId veya event.ngoId == actor.ngoId).
 *
 * Body (zod): { subject, message } — audience YOK.
 *
 * Dönüş: { ok: true, sent: <benzersiz uid sayısı> } | { errorCode, error }
 * Hedef 0 kişi ise yine { ok: true, sent: 0 } (hata değil).
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { notifyUser } from '@/lib/notify-user';
import { requireNgoAdminForRoute } from '@/lib/auth/require-ngo-admin';

export const runtime = 'nodejs';

const BodySchema = z.object({
  subject: z.string().trim().min(1).max(200),
  message: z.string().trim().min(1).max(4000),
});

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id } = await ctx.params;
    if (!id) {
      return NextResponse.json({ errorCode: 'INVALID_INPUT', error: 'Etkinlik kimliği gerekli' }, { status: 400 });
    }

    const auth = await requireNgoAdminForRoute(req, { allowSuperAdmin: true });
    if (auth.error) return auth.error;
    const actor = auth.actor;

    const raw = await req.json().catch(() => ({}));
    const parsed = BodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { errorCode: 'INVALID_BODY', error: parsed.error.issues[0]?.message ?? 'Body geçersiz' },
        { status: 400 },
      );
    }
    const { subject, message } = parsed.data;

    const db = getAdminFirestore();

    // Etkinlik + sahiplik doğrulama. Sahiplik alanı organizerId; bazı kayıtlarda
    // ngoId de bulunabilir → herhangi biri actor.ngoId'ye eşitse geç.
    const eventRef = db.collection(COLLECTIONS.events).doc(id);
    const eventSnap = await eventRef.get();
    if (!eventSnap.exists) {
      return NextResponse.json({ errorCode: 'NOT_FOUND', error: 'Etkinlik bulunamadı' }, { status: 404 });
    }
    const evData = eventSnap.data() as {
      organizerId?: string;
      ngoId?: string;
      organizer?: string;
      ngoName?: string;
      organizerLogoUrl?: string;
    };
    const ownsEvent = evData.organizerId === actor.ngoId || evData.ngoId === actor.ngoId;
    if (!actor.isSuperAdmin && !ownsEvent) {
      return NextResponse.json(
        { errorCode: 'FORBIDDEN', error: 'Bu etkinlik sizin STK\'nıza ait değil' },
        { status: 403 },
      );
    }

    // Katılımcı uid'leri — rsvps (going) ∪ applications (entityId == id).
    const [rsvpsSnap, appsSnap] = await Promise.all([
      eventRef.collection(COLLECTIONS.eventRsvps).where('status', '==', 'going').get(),
      db.collection(COLLECTIONS.applications).where('entityId', '==', id).get(),
    ]);

    const uidSet = new Set<string>();
    for (const d of rsvpsSnap.docs) {
      // rsvp doc id = userId (bkz. attendees + complete route).
      if (d.id) uidSet.add(d.id);
    }
    for (const d of appsSnap.docs) {
      const u = (d.data() as { userId?: string }).userId;
      if (u) uidSet.add(u);
    }
    const uids = [...uidSet];

    if (uids.length === 0) {
      return NextResponse.json({ ok: true, sent: 0 });
    }

    const sender = {
      id: evData.organizerId ?? evData.ngoId ?? '',
      name: evData.organizer || evData.ngoName || 'STK',
      avatarUrl: evData.organizerLogoUrl || '',
    };
    const link = `/events/${id}`;

    // 400'lük partiler halinde fan-out (notifyUser zaten throw etmiyor).
    for (let i = 0; i < uids.length; i += 400) {
      await Promise.allSettled(
        uids.slice(i, i + 400).map((userId) =>
          notifyUser({
            userId,
            type: 'ngo_message',
            title: subject,
            body: message.slice(0, 160),
            link,
            storeAsMessage: true,
            messageSubject: subject,
            messageContent: message,
            sender,
          }),
        ),
      );
    }

    return NextResponse.json({ ok: true, sent: uids.length });
  } catch (err) {
    console.error('[events/broadcast] unexpected error', err);
    return NextResponse.json({ errorCode: 'INTERNAL', error: 'Mesaj gönderilemedi' }, { status: 500 });
  }
}
