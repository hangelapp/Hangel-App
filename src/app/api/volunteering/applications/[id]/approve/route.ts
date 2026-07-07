/**
 * POST /api/volunteering/applications/[id]/approve
 *
 * Body: { ngoNote?: string }
 * Auth: NGO admin (managedNgoId == application.entityId.volunteering.ngoId)
 *       veya super-admin (targetNgoId opsiyonel).
 *
 * Yapılan işler (transaction-benzeri sıralı):
 *   1. applications/{id} status='Onaylandı', approvedAt=serverTimestamp,
 *      reviewedBy=actor.uid, (varsa) ngoNote
 *   2. users/{uid}/notifications altına bildirim doc (in-app badge)
 *   3. messages koleksiyonuna in-app mesaj (Gelen Kutusu)
 *   4. FCM push (best-effort, hata fırlatmaz)
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
    entityId?: string; // volunteering oppId
    type?: string;
    status?: string;
  };

  // Volunteering opp → ngoId/ngoName doğrulama
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

  // 1) applications status update
  await appRef.update({
    status: 'Onaylandı',
    approvedAt: FieldValue.serverTimestamp(),
    reviewedAt: FieldValue.serverTimestamp(),
    reviewedBy: actor.uid,
    ...(ngoNote ? { ngoNote } : {}),
  });

  // 1b) volunteerCount.approved bakımı — SERVER-SIDE (Admin SDK, rules'ı bypass eder).
  // Eskiden client-side updateDoc ile yazılıyordu; `volunteering` update kuralı
  // `ngoId == auth.uid` (STK doc id ≠ uid) olduğu için sessizce PERMISSION_DENIED
  // alıyordu → sayaç bozuktu. Onaylı başvuru sayısını burada yeniden hesaplayıp yazıyoruz.
  try {
    const approvedSnap = await db
      .collection(COLLECTIONS.applications)
      .where('entityId', '==', oppId)
      .where('status', '==', 'Onaylandı')
      .get();
    await db.collection(COLLECTIONS.volunteering).doc(oppId).update({
      'volunteerCount.approved': approvedSnap.size,
    });
  } catch (countErr) {
    console.warn('[volunteering/approve] volunteerCount.approved update failed', countErr);
  }

  if (!userId) {
    // Başvuruyu yine de onayladık; bildirim yok — log
    console.warn('[volunteering/approve] application has no userId', { applicationId });
    return NextResponse.json({ ok: true, applicationId });
  }

  const subject = 'Gönüllülük Başvurun Onaylandı';
  const content =
    `Merhaba, "${oppTitle}" ilanına yaptığın gönüllülük başvurusu ${ngoName} tarafından onaylandı. ` +
    `İlan sayfasından etkinliği takvimine ekleyebilirsin.` +
    (ngoNote ? `\n\nSTK notu: ${ngoNote}` : '');

  // İlan sayfasına yönlendiren link — orada "Takvime ekle" butonu var.
  const oppLink = `/volunteering/${oppId}`;

  // 2) users/{uid}/notifications alt koleksiyonu (CLAUDE.md: badge için)
  await db
    .collection(COLLECTIONS.users)
    .doc(userId)
    .collection(COLLECTIONS.notifications)
    .add({
      userId,
      type: 'application_accepted',
      title: subject,
      body: content.slice(0, 160),
      link: oppLink,
      applicationId,
      volunteeringId: oppId,
      read: false,
      pushSent: true,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: actor.uid,
    });

  // 3) messages — Gelen Kutusu in-app mesaj
  await db.collection(COLLECTIONS.messages).add({
    sender: { id: HANGEL_SYSTEM_UID, name: HANGEL_SYSTEM_NAME, avatarUrl: '' },
    senderId: HANGEL_SYSTEM_UID,
    senderType: 'system',
    recipient: { id: userId, name: appData.userName ?? '', avatarUrl: '' },
    recipientId: userId,
    subject: 'Başvuru Onayı',
    content,
    timestamp: FieldValue.serverTimestamp(),
    status: 'sent',
    meta: {
      kind: 'volunteering_application_approved',
      applicationId,
      volunteeringId: oppId,
      ngoId: oppData.ngoId,
      link: oppLink,
    },
  });

  // 4) Push (best-effort)
  try {
    await sendPushToUser(userId, {
      title: subject,
      body: `"${oppTitle}" başvurun onaylandı`,
      clickAction: oppLink,
      data: {
        type: 'application_accepted',
        applicationId,
        volunteeringId: oppId,
      },
    });
  } catch (e) {
    console.warn('[volunteering/approve] push failed', e);
  }

  return NextResponse.json({ ok: true, applicationId });
}
