/**
 * POST /api/volunteering/applications/[id]/reject
 *
 * Body: { ngoNote?: string }
 * Auth: NGO admin (volunteering.ngoId == actor.ngoId) veya super-admin.
 *
 * Yapılan işler:
 *   1. applications/{id} status='Reddedildi', rejectedAt=serverTimestamp,
 *      reviewedBy=actor.uid, (varsa) ngoNote
 *   2. users/{uid}/notifications doc (badge)
 *   3. messages — in-app mesaj ("Başvuru Sonucu")
 *   4. FCM push (best-effort)
 *
 * Response: { ok: true, applicationId } | { errorCode, error }
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
  ngoNote: z.string().trim().max(2000).optional(),
});

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id: applicationId } = await ctx.params;
  if (!applicationId) {
    return NextResponse.json({ errorCode: 'INVALID_INPUT', error: 'applicationId yok' }, { status: 400 });
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
  const { ngoNote } = parsed.data;

  const db = getAdminFirestore();
  const appRef = db.collection(COLLECTIONS.applications).doc(applicationId);
  const appSnap = await appRef.get();
  if (!appSnap.exists) {
    return NextResponse.json({ errorCode: 'NOT_FOUND', error: 'Başvuru bulunamadı' }, { status: 404 });
  }
  const appData = appSnap.data() as {
    userId?: string;
    userName?: string;
    title?: string;
    entityId?: string;
  };

  const oppId = appData.entityId ?? '';
  if (!oppId) {
    return NextResponse.json({ errorCode: 'INVALID_APPLICATION', error: 'entityId yok' }, { status: 400 });
  }
  const oppSnap = await db.collection(COLLECTIONS.volunteering).doc(oppId).get();
  if (!oppSnap.exists) {
    return NextResponse.json({ errorCode: 'VOLUNTEERING_NOT_FOUND', error: 'İlan bulunamadı' }, { status: 404 });
  }
  const oppData = oppSnap.data() as { ngoId?: string; ngoName?: string; title?: string };
  if (!actor.isSuperAdmin && oppData.ngoId !== actor.ngoId) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', error: 'Bu ilan sizin STK\'nıza ait değil' }, { status: 403 });
  }

  const userId = appData.userId ?? '';
  const oppTitle = oppData.title ?? appData.title ?? 'Gönüllülük';
  const ngoName = oppData.ngoName ?? 'STK';

  await appRef.update({
    status: 'Reddedildi',
    rejectedAt: FieldValue.serverTimestamp(),
    reviewedAt: FieldValue.serverTimestamp(),
    reviewedBy: actor.uid,
    ...(ngoNote ? { ngoNote } : {}),
  });

  if (!userId) {
    console.warn('[volunteering/reject] application has no userId', { applicationId });
    return NextResponse.json({ ok: true, applicationId });
  }

  const subject = 'Gönüllülük Başvuru Sonucu';
  const content =
    `Merhaba, "${oppTitle}" ilanına yaptığın gönüllülük başvurusu ${ngoName} tarafından bu sefer uygun görülmedi. ` +
    `Başka ilanlar için başvurmaya devam edebilirsin.` +
    (ngoNote ? `\n\nSTK notu: ${ngoNote}` : '');

  await db
    .collection(COLLECTIONS.users)
    .doc(userId)
    .collection(COLLECTIONS.notifications)
    .add({
      userId,
      type: 'application_rejected',
      title: subject,
      body: content.slice(0, 160),
      applicationId,
      volunteeringId: oppId,
      read: false,
      pushSent: true,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: actor.uid,
    });

  await db.collection(COLLECTIONS.messages).add({
    sender: { id: HANGEL_SYSTEM_UID, name: HANGEL_SYSTEM_NAME, avatarUrl: '' },
    senderId: HANGEL_SYSTEM_UID,
    senderType: 'system',
    recipient: { id: userId, name: appData.userName ?? '', avatarUrl: '' },
    recipientId: userId,
    subject: 'Başvuru Sonucu',
    content,
    timestamp: FieldValue.serverTimestamp(),
    status: 'sent',
    meta: {
      kind: 'volunteering_application_rejected',
      applicationId,
      volunteeringId: oppId,
      ngoId: oppData.ngoId,
    },
  });

  try {
    await sendPushToUser(userId, {
      title: subject,
      body: `"${oppTitle}" başvurun bu sefer uygun görülmedi`,
      clickAction: `/volunteering/${oppId}`,
      data: {
        type: 'application_rejected',
        applicationId,
        volunteeringId: oppId,
      },
    });
  } catch (e) {
    console.warn('[volunteering/reject] push failed', e);
  }

  return NextResponse.json({ ok: true, applicationId });
}
