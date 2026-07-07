/**
 * POST /api/volunteering/[id]/broadcast — STK gönüllü ilanı toplu mesaj
 *
 * İlan sahibi STK admini (veya super-admin) bir gönüllülük ilanının
 * başvuranlarına toplu bir mesaj gönderir. Mesaj `notifyUser` ile 3 kanala
 * fan-out edilir (in-app bildirim + Gelen Kutusu mesajı + FCM push).
 *
 * [id] = gönüllülük ilanı (opportunity) id'si = applications.entityId.
 *
 * Body (zod):
 *   { audience: 'applicants' | 'approved' | 'pending', subject, message }
 *     - applicants → TÜM başvuranlar (status'e bakmaz)
 *     - approved   → sadece status === 'Onaylandı'
 *     - pending    → sadece status === 'Beklemede'
 *
 * Yetki: super-admin VEYA ilan sahibi STK admini (opp.ngoId == actor.ngoId).
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
  audience: z.enum(['applicants', 'approved', 'pending']),
  subject: z.string().trim().min(1).max(200),
  message: z.string().trim().min(1).max(4000),
});

// audience → applications.status filtresi ('applicants' = filtre yok).
const STATUS_BY_AUDIENCE: Record<'approved' | 'pending', string> = {
  approved: 'Onaylandı',
  pending: 'Beklemede',
};

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id } = await ctx.params;
    if (!id) {
      return NextResponse.json({ errorCode: 'INVALID_INPUT', error: 'İlan kimliği gerekli' }, { status: 400 });
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
    const { audience, subject, message } = parsed.data;

    const db = getAdminFirestore();

    // İlan + sahiplik doğrulama
    const oppSnap = await db.collection(COLLECTIONS.volunteering).doc(id).get();
    if (!oppSnap.exists) {
      return NextResponse.json({ errorCode: 'NOT_FOUND', error: 'İlan bulunamadı' }, { status: 404 });
    }
    const oppData = oppSnap.data() as {
      ngoId?: string;
      ngoName?: string;
      ngoLogoUrl?: string;
    };
    if (!actor.isSuperAdmin && oppData.ngoId !== actor.ngoId) {
      return NextResponse.json(
        { errorCode: 'FORBIDDEN', error: 'Bu ilan sizin STK\'nıza ait değil' },
        { status: 403 },
      );
    }

    // Hedef başvurular — entityId == ilan; audience'a göre status filtresi.
    let query: FirebaseFirestore.Query = db
      .collection(COLLECTIONS.applications)
      .where('entityId', '==', id);
    if (audience !== 'applicants') {
      query = query.where('status', '==', STATUS_BY_AUDIENCE[audience]);
    }
    const appsSnap = await query.get();

    // Benzersiz, boş olmayan uid kümesi
    const uids = [
      ...new Set(
        appsSnap.docs
          .map((d) => (d.data() as { userId?: string }).userId)
          .filter((u): u is string => !!u),
      ),
    ];

    if (uids.length === 0) {
      return NextResponse.json({ ok: true, sent: 0 });
    }

    const sender = {
      id: oppData.ngoId ?? '',
      name: oppData.ngoName || 'STK',
      avatarUrl: oppData.ngoLogoUrl || '',
    };
    const link = `/volunteering/${id}`;

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
    console.error('[volunteering/broadcast] unexpected error', err);
    return NextResponse.json({ errorCode: 'INTERNAL', error: 'Mesaj gönderilemedi' }, { status: 500 });
  }
}
