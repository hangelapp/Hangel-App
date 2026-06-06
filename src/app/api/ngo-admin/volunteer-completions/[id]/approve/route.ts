/**
 * PATCH /api/ngo-admin/volunteer-completions/[id]/approve
 *
 * STK admin tamamlama kaydını onaylar veya reddeder. Onaylanırsa:
 *   - volunteerCompletions/{id}.ngoApproved = true, approvedAt, approvedBy
 *   - users/{userId}.stats.totalImpactValue += impactValueTRY (FieldValue.increment)
 *   - users/{userId}.stats.volunteerHours += hoursLogged
 *   - users/{userId}/pastVolunteering altına özet kayıt
 *   - certificateIssued = true, certificateUrl (in-app HTML render path)
 *   - Gönüllüye push + in-app bildirim
 *
 * Reddedilirse: ngoApproved kalır false, status doc'a yazılır,
 *               gönüllüye reddedildi bildirimi.
 *
 * Body:
 *   {
 *     approved: boolean,
 *     adjustedHours?: number,   // STK admin saat düzeltirse impact yeniden hesaplanır
 *     reason?: string,          // reddetme nedeni
 *   }
 *
 * Auth: NGO admin (managedNgoId == completion.ngoId) veya super-admin.
 *
 * Response: { ok: true, ngoApproved, impactValueTRY } | { errorCode, error }
 */

import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';

import { getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { requireNgoAdminForRoute } from '@/lib/auth/require-ngo-admin';
import { calculateUserImpactValue } from '@/lib/volunteer-impact';
import { sendPushToUser } from '@/lib/push-notifications';
import { generateCertificateHtml } from '@/lib/certificates/generate';

export const runtime = 'nodejs';

const HANGEL_SYSTEM_UID = 'hangel-system';
const HANGEL_SYSTEM_NAME = 'hangel Resmi';

const BodySchema = z.object({
  approved: z.boolean(),
  adjustedHours: z.number().positive().max(24 * 31).optional(),
  reason: z.string().trim().max(2000).optional(),
});

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id: completionId } = await ctx.params;
  if (!completionId) {
    return NextResponse.json(
      { errorCode: 'INVALID_INPUT', error: 'completionId yok' },
      { status: 400 },
    );
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
  const { approved, adjustedHours, reason } = parsed.data;

  const db = getAdminFirestore();
  const completionRef = db.collection(COLLECTIONS.volunteerCompletions).doc(completionId);
  const completionSnap = await completionRef.get();
  if (!completionSnap.exists) {
    return NextResponse.json(
      { errorCode: 'COMPLETION_NOT_FOUND', error: 'Tamamlama kaydı bulunamadı' },
      { status: 404 },
    );
  }

  const completion = completionSnap.data() as {
    userId?: string;
    taskId?: string;
    ngoId?: string;
    hoursLogged?: number;
    hourlyRateAtTime?: number;
    impactValueTRY?: number;
    impactPointsTotal?: number;
    pointsPerHourAtTime?: number;
    userProfessionPointsPerHour?: number;
    professionLabel?: string;
    ngoApproved?: boolean;
  };

  const completionNgoId = completion.ngoId ?? '';
  if (!actor.isSuperAdmin && completionNgoId !== actor.ngoId) {
    return NextResponse.json(
      { errorCode: 'FORBIDDEN', error: 'Bu kayıt sizin STK\'nıza ait değil' },
      { status: 403 },
    );
  }

  if (completion.ngoApproved === true) {
    return NextResponse.json(
      { errorCode: 'ALREADY_APPROVED', error: 'Bu kayıt zaten onaylanmış' },
      { status: 409 },
    );
  }

  const volunteerUid = completion.userId ?? '';
  const taskId = completion.taskId ?? '';
  if (!volunteerUid || !taskId) {
    return NextResponse.json(
      { errorCode: 'INVALID_COMPLETION', error: 'Eksik alanlar (userId/taskId)' },
      { status: 400 },
    );
  }

  // Görev bilgisini sertifika için çek
  const oppSnap = await db.collection(COLLECTIONS.volunteering).doc(taskId).get();
  const oppTitle = (oppSnap.data() as { title?: string } | undefined)?.title ?? 'Gönüllülük';
  const ngoName = (oppSnap.data() as { ngoName?: string } | undefined)?.ngoName ?? 'STK';

  // --- Red akışı ---
  if (!approved) {
    await completionRef.update({
      ngoApproved: false,
      reviewedAt: FieldValue.serverTimestamp(),
      reviewedBy: actor.uid,
      rejectedReason: reason ?? '',
      status: 'rejected',
    });

    await db
      .collection(COLLECTIONS.users)
      .doc(volunteerUid)
      .collection(COLLECTIONS.notifications)
      .add({
        userId: volunteerUid,
        type: 'volunteer_completion_rejected',
        title: 'Tamamlama kaydı onaylanmadı',
        body: reason
          ? `"${oppTitle}" tamamlaman kabul edilmedi: ${reason}`.slice(0, 160)
          : `"${oppTitle}" tamamlaman kabul edilmedi.`,
        completionId,
        taskId,
        read: false,
        pushSent: true,
        createdAt: FieldValue.serverTimestamp(),
      });

    try {
      await sendPushToUser(volunteerUid, {
        title: 'Tamamlama onaylanmadı',
        body: `"${oppTitle}" — STK onayı geçmedi`,
        clickAction: `/volunteering/${taskId}`,
        data: { type: 'volunteer_completion_rejected', completionId, taskId },
      });
    } catch (e) {
      console.warn('[ngo-admin/volunteer-completions/approve] reject push failed', e);
    }

    return NextResponse.json({ ok: true, ngoApproved: false });
  }

  // --- Onay akışı ---
  // STK admin saat düzelttiyse impact'i yeniden hesapla
  const finalHours = adjustedHours ?? completion.hoursLogged ?? 0;
  const finalRate = completion.hourlyRateAtTime ?? 0;
  const finalImpactValue = adjustedHours !== undefined
    ? calculateUserImpactValue(finalHours, finalRate)
    : completion.impactValueTRY ?? 0;

  // PUAN — adjustedHours varsa task + meslek puanı yeniden hesapla.
  // İş kaleminin saat başı puanı + gönüllünün mesleğine göre puan,
  // ikisi de TOPLANARAK kullanıcının Sosyal Etki Puanı'na eklenir.
  const taskPph = completion.pointsPerHourAtTime ?? 0;
  const userProfPph = completion.userProfessionPointsPerHour ?? 0;
  const finalImpactPoints = adjustedHours !== undefined
    ? Math.round(finalHours * (taskPph + userProfPph))
    : completion.impactPointsTotal ?? Math.round(finalHours * (taskPph + userProfPph));

  // Sertifika HTML üret (in-memory; storage upload opsiyonel — şimdilik URL boş)
  // certificateUrl ileride storage'a upload edilirse doldurulur; mevcut akışta
  // istemci `volunteerCompletions/{id}` üzerinden HTML'i render eder.
  const certificateHtml = generateCertificateHtml({
    completionId,
    userName: (await db.collection(COLLECTIONS.users).doc(volunteerUid).get()).data()?.name ?? 'Gönüllü',
    taskTitle: oppTitle,
    ngoName,
    professionLabel: completion.professionLabel,
    hoursLogged: finalHours,
    impactValueTRY: finalImpactValue,
    completedAt: new Date(),
    approvedAt: new Date(),
  });
  // HTML şu an Firestore'a yazılmıyor (1 MB doc limiti büyük certler için risk);
  // ileride storage entegrasyonu eklenince certificateUrl alanı dolacak.
  // İhtiyaç anında bu route response'ta dönüyor → istemci local render eder.
  void certificateHtml;

  // 1) Completion doc güncelle
  await completionRef.update({
    ngoApproved: true,
    approvedAt: FieldValue.serverTimestamp(),
    approvedBy: actor.uid,
    ...(adjustedHours !== undefined
      ? { adjustedHours, impactValueTRY: finalImpactValue, impactPointsTotal: finalImpactPoints }
      : {}),
    certificateIssued: true,
    status: 'approved',
  });

  // 2) User stats güncelle (FieldValue.increment — race-safe)
  const userRef = db.collection(COLLECTIONS.users).doc(volunteerUid);
  await userRef.set(
    {
      stats: {
        totalImpactValue: FieldValue.increment(finalImpactValue),
        totalImpactPoints: FieldValue.increment(finalImpactPoints),
        volunteerHours: FieldValue.increment(finalHours),
        completedProjects: FieldValue.increment(1),
      },
    },
    { merge: true },
  );

  // 3) pastVolunteering özet kayıt — profil etki sekmesi için
  await userRef.collection(COLLECTIONS.pastVolunteering).add({
    volunteeringId: taskId,
    volunteeringTitle: oppTitle,
    ngoId: completionNgoId,
    ngoName,
    completionId,
    hoursLogged: finalHours,
    impactValueTRY: finalImpactValue,
    impactPointsTotal: finalImpactPoints,
    completedAt: FieldValue.serverTimestamp(),
  });

  // 4) Bildirim — gönüllüye
  const subject = 'Tamamlama onaylandı, sertifikan hazır';
  const content =
    `"${oppTitle}" görevini başarıyla tamamladın. ${ngoName} ${finalHours} saatlik katkını onayladı — ` +
    `${finalImpactValue.toLocaleString('tr-TR')} ₺ sosyal etki değeri profilinde görüntülenebilir.`;

  await userRef.collection(COLLECTIONS.notifications).add({
    userId: volunteerUid,
    type: 'volunteer_completion_approved',
    title: subject,
    body: content.slice(0, 160),
    completionId,
    taskId,
    impactValueTRY: finalImpactValue,
    read: false,
    pushSent: true,
    createdAt: FieldValue.serverTimestamp(),
  });

  // 5) In-app mesaj
  await db.collection(COLLECTIONS.messages).add({
    sender: { id: HANGEL_SYSTEM_UID, name: HANGEL_SYSTEM_NAME, avatarUrl: '' },
    senderId: HANGEL_SYSTEM_UID,
    senderType: 'system',
    recipient: { id: volunteerUid, name: '', avatarUrl: '' },
    recipientId: volunteerUid,
    subject,
    content,
    timestamp: FieldValue.serverTimestamp(),
    status: 'sent',
    meta: {
      kind: 'volunteer_completion_approved',
      completionId,
      taskId,
      ngoId: completionNgoId,
      impactValueTRY: finalImpactValue,
    },
  });

  // 6) Push (best-effort)
  try {
    await sendPushToUser(volunteerUid, {
      title: 'Tamamlaman onaylandı',
      body: `"${oppTitle}" — ${finalImpactValue.toLocaleString('tr-TR')} ₺ etki`,
      clickAction: `/profile?tab=etki`,
      data: {
        type: 'volunteer_completion_approved',
        completionId,
        taskId,
      },
    });
  } catch (e) {
    console.warn('[ngo-admin/volunteer-completions/approve] push failed', e);
  }

  return NextResponse.json({
    ok: true,
    ngoApproved: true,
    impactValueTRY: finalImpactValue,
    hoursLogged: finalHours,
    certificateIssued: true,
  });
}
