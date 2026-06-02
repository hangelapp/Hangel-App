/**
 * POST /api/volunteering/[id]/complete-volunteer
 *
 * Body: { userId: string, score: 1..5, comment: string }
 * Auth: NGO admin (volunteering.ngoId == actor.ngoId) veya super-admin.
 *
 * Yapılan işler:
 *   1. certificates/{auto-id} oluştur:
 *        { userId, volunteeringId, score, comment, ngoId, ngoName,
 *          volunteeringTitle, badgeUrl, completedAt, issuedBy }
 *   2. users/{uid}/certificates altına aynı id ile mirror (kullanıcı erişimi için)
 *   3. users/{uid}/pastVolunteering altına özet kayıt
 *   4. users/{uid}/notifications doc — "🏆 Sertifika hazır"
 *   5. messages — in-app mesaj
 *   6. FCM push (best-effort)
 *
 * Response: { ok: true, certificateId } | { errorCode, error }
 */

import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';

import { getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { sendPushToUser } from '@/lib/push-notifications';
import { requireNgoAdminForRoute } from '@/lib/auth/require-ngo-admin';

export const runtime = 'nodejs';

const HANGEL_SYSTEM_UID = 'hangel-system';
const HANGEL_SYSTEM_NAME = 'hangel Resmi';

const BodySchema = z.object({
  userId: z.string().min(1, 'userId zorunlu'),
  score: z.number().int().min(1).max(5),
  comment: z.string().trim().min(1, 'comment zorunlu').max(2000),
});

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id: volunteeringId } = await ctx.params;
  if (!volunteeringId) {
    return NextResponse.json({ errorCode: 'INVALID_INPUT', error: 'volunteeringId yok' }, { status: 400 });
  }

  const auth = await requireNgoAdminForRoute(req);
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
  const { userId, score, comment } = parsed.data;

  const db = getAdminFirestore();

  // Volunteering opp + sahiplik kontrolü
  const oppRef = db.collection(COLLECTIONS.volunteering).doc(volunteeringId);
  const oppSnap = await oppRef.get();
  if (!oppSnap.exists) {
    return NextResponse.json({ errorCode: 'VOLUNTEERING_NOT_FOUND', error: 'İlan bulunamadı' }, { status: 404 });
  }
  const oppData = oppSnap.data() as {
    ngoId?: string;
    ngoName?: string;
    title?: string;
    badgeUrl?: string;
    imageUrl?: string;
  };
  if (!actor.isSuperAdmin && oppData.ngoId !== actor.ngoId) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', error: 'Bu ilan sizin STK\'nıza ait değil' }, { status: 403 });
  }

  const ngoId = oppData.ngoId ?? actor.ngoId;
  const ngoName = oppData.ngoName ?? 'STK';
  const volunteeringTitle = oppData.title ?? 'Gönüllülük';
  const badgeUrl = oppData.badgeUrl ?? oppData.imageUrl ?? '';

  // Kullanıcı var mı?
  const userSnap = await db.collection(COLLECTIONS.users).doc(userId).get();
  if (!userSnap.exists) {
    return NextResponse.json({ errorCode: 'USER_NOT_FOUND', error: 'Kullanıcı bulunamadı' }, { status: 404 });
  }

  // 1) certificates root koleksiyon
  const certRef = db.collection(COLLECTIONS.certificates).doc();
  const certificateId = certRef.id;
  const certPayload = {
    id: certificateId,
    userId,
    volunteeringId,
    volunteeringTitle,
    score,
    comment,
    ngoId,
    ngoName,
    badgeUrl,
    completedAt: FieldValue.serverTimestamp(),
    issuedBy: actor.uid,
  };
  await certRef.set(certPayload);

  // 2) users/{uid}/certificates mirror — kullanıcı kendi sertifikalarını listeler
  await db
    .collection(COLLECTIONS.users)
    .doc(userId)
    .collection(COLLECTIONS.certificates)
    .doc(certificateId)
    .set(certPayload);

  // 3) pastVolunteering özet kaydı
  await db
    .collection(COLLECTIONS.users)
    .doc(userId)
    .collection(COLLECTIONS.pastVolunteering)
    .add({
      volunteeringId,
      volunteeringTitle,
      ngoId,
      ngoName,
      score,
      certificateId,
      completedAt: FieldValue.serverTimestamp(),
    });

  const subject = 'Sertifikan Hazır';
  const content =
    `"${volunteeringTitle}" gönüllülüğünü tamamladın. ${ngoName} sana ${score}/5 puan verdi ` +
    `ve sertifikan hazır. Profilinden görüntüleyebilirsin.\n\nSTK yorumu: ${comment}`;

  // 4) notifications
  await db
    .collection(COLLECTIONS.users)
    .doc(userId)
    .collection(COLLECTIONS.notifications)
    .add({
      userId,
      type: 'certificate_issued',
      title: subject,
      body: content.slice(0, 160),
      certificateId,
      volunteeringId,
      read: false,
      pushSent: true,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: actor.uid,
    });

  // 5) in-app message
  await db.collection(COLLECTIONS.messages).add({
    sender: { id: HANGEL_SYSTEM_UID, name: HANGEL_SYSTEM_NAME, avatarUrl: '' },
    senderId: HANGEL_SYSTEM_UID,
    senderType: 'system',
    recipient: { id: userId, name: '', avatarUrl: '' },
    recipientId: userId,
    subject: 'Sertifikan Hazır',
    content,
    timestamp: FieldValue.serverTimestamp(),
    status: 'sent',
    meta: {
      kind: 'certificate_issued',
      certificateId,
      volunteeringId,
      ngoId,
      score,
    },
  });

  // 6) Push (best-effort)
  try {
    await sendPushToUser(userId, {
      title: 'Sertifikan hazır',
      body: `"${volunteeringTitle}" — ${score}/5 puan`,
      imageUrl: badgeUrl || undefined,
      clickAction: `/profile/${userId}?tab=certificates`,
      data: {
        type: 'certificate_issued',
        certificateId,
        volunteeringId,
      },
    });
  } catch (e) {
    console.warn('[volunteering/complete-volunteer] push failed', e);
  }

  return NextResponse.json({ ok: true, certificateId });
}
