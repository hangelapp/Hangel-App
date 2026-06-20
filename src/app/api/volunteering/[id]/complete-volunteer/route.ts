/**
 * POST /api/volunteering/[id]/complete-volunteer
 *
 * KANONİK gönüllülük tamamlama rotası — "B yolu" (yönetici girer).
 *
 * STK admin / super-admin bir gönüllünün tamamladığı işi girer:
 *   - kaç SAAT çalışıldı
 *   - hangi İŞ KALEMİ yapıldı (volunteerScoring katalog doc id)
 *
 * Sistem OTOMATİK olarak puan + mali değer (₺) hesaplar ve tamamlama kaydını
 * ANINDA onaylanmış (ngoApproved: true) olarak oluşturur. Ayrı bir gönüllü
 * "saat gir" adımı YOK — tüm hesap burada yapılır:
 *
 *   impactValueTRY  = hours × manHourCost            (iş kalemi adam-saat)
 *   impactPoints    = hours × (taskPph + userProfPph)(iş kalemi + meslek bonusu)
 *
 * Yapılan işler (tek seferde):
 *   1. volunteerCompletions/{id}  → ngoApproved:true, approvedAt/By, snapshot rate
 *   2. users/{uid}.stats          → totalImpactValue/Points/volunteerHours += (increment)
 *   3. users/{uid}/pastVolunteering → özet + socialArea (rozet motoru için)
 *   4. rozet motoru (areaPoints yeniden hesap, yeni tier → rozet + bildirim)
 *   5. gönüllüye teşekkür bildirimi + "değerlendir misiniz?" CTA → /volunteering/{id}
 *
 * Body:
 *   {
 *     userId: string,            // tamamlamayı işlenecek gönüllü
 *     taskTypeId: string,        // volunteerScoring doc id (iş kalemi)
 *     hours: number,             // > 0
 *     notes?: string,            // STK admin notu
 *   }
 *
 * Auth: NGO admin (volunteering.ngoId == actor.ngoId) veya super-admin.
 *
 * Response: { ok, completionId, impactValueTRY, impactPoints, hoursLogged }
 *           | { errorCode, error }
 */

import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';

import { getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { requireNgoAdminForRoute } from '@/lib/auth/require-ngo-admin';
import { findProfession, calculateUserImpactValue } from '@/lib/volunteer-impact';
import { resolvePointsPerHour, resolveHourlyRate } from '@/lib/volunteer/professions';
import { notifyUser } from '@/lib/notify-user';
import { awardBadgesForUser, resolveBadgeArea } from '@/lib/award-badges';

export const runtime = 'nodejs';

const BodySchema = z.object({
  userId: z.string().trim().min(1, 'userId zorunlu'),
  taskTypeId: z.string().trim().min(1, 'taskTypeId zorunlu'),
  hours: z.number().positive('hours > 0 olmalı').max(24 * 31, 'Tek seferde 31 günden fazla saat girilemez'),
  notes: z.string().trim().max(2000).optional(),
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
  const { userId, taskTypeId, hours, notes } = parsed.data;

  const db = getAdminFirestore();

  // 1) Volunteering opp + sahiplik kontrolü
  const oppRef = db.collection(COLLECTIONS.volunteering).doc(volunteeringId);
  const oppSnap = await oppRef.get();
  if (!oppSnap.exists) {
    return NextResponse.json({ errorCode: 'VOLUNTEERING_NOT_FOUND', error: 'İlan bulunamadı' }, { status: 404 });
  }
  const oppData = oppSnap.data() as {
    ngoId?: string;
    ngoName?: string;
    organization?: string;
    title?: string;
    socialArea?: string;
  };
  if (!actor.isSuperAdmin && oppData.ngoId !== actor.ngoId) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', error: 'Bu ilan sizin STK\'nıza ait değil' }, { status: 403 });
  }

  const ngoId = oppData.ngoId ?? actor.ngoId ?? '';
  const ngoName = oppData.ngoName ?? oppData.organization ?? 'STK';
  const oppTitle = oppData.title ?? 'Gönüllülük';
  const badgeArea = resolveBadgeArea(oppData.socialArea);

  // 2) Kullanıcı var mı?
  const userRef = db.collection(COLLECTIONS.users).doc(userId);
  const userSnap = await userRef.get();
  if (!userSnap.exists) {
    return NextResponse.json({ errorCode: 'USER_NOT_FOUND', error: 'Kullanıcı bulunamadı' }, { status: 404 });
  }

  // 3) Aynı user+task için zaten bir tamamlama varsa engelle (idempotency)
  const dupQuery = await db
    .collection(COLLECTIONS.volunteerCompletions)
    .where('userId', '==', userId)
    .where('taskId', '==', volunteeringId)
    .limit(1)
    .get();
  if (!dupQuery.empty) {
    return NextResponse.json(
      { errorCode: 'COMPLETION_EXISTS', error: 'Bu gönüllü için bu görevde zaten bir tamamlama kaydı var' },
      { status: 409 },
    );
  }

  // 4) İş kalemi (taskType) — volunteerScoring katalogundan çöz
  const profession = await findProfession(db, taskTypeId);
  if (!profession) {
    return NextResponse.json(
      { errorCode: 'TASK_TYPE_REQUIRED', error: 'Geçerli bir iş kalemi seçin' },
      { status: 400 },
    );
  }

  // 4a) İş kalemi kaynaklı puan + ₺
  const taskPointsPerHour = profession.pointsPerHour ?? 0;
  const taskImpactValueTRY = calculateUserImpactValue(hours, profession.hourlyRate);
  const taskImpactPoints = Math.round(hours * taskPointsPerHour);

  // 4b) Gönüllünün KENDİ MESLEĞİNE göre ek puan (override doc'tan)
  let userProfessionId: string | null = null;
  let userProfessionPointsPerHour = 0;
  let userProfessionHourlyRate = 0;
  let userProfessionImpactPoints = 0;
  let userProfessionImpactValueTRY = 0;
  try {
    const u = userSnap.data() as { volunteerInfo?: { professionId?: string } } | undefined;
    userProfessionId = u?.volunteerInfo?.professionId ?? null;
    if (userProfessionId) {
      const ovSnap = await db.collection(COLLECTIONS.volunteerScoring).doc('professions').get();
      const ov = ovSnap.exists
        ? (ovSnap.data() as { rates?: Record<string, number>; points?: Record<string, number> })
        : {};
      userProfessionHourlyRate = resolveHourlyRate(userProfessionId, ov.rates);
      userProfessionPointsPerHour = resolvePointsPerHour(userProfessionId, ov.points);
      userProfessionImpactPoints = Math.round(hours * userProfessionPointsPerHour);
      userProfessionImpactValueTRY = Math.round(hours * userProfessionHourlyRate);
    }
  } catch {
    // Sessizce devam — task-only hesap kalır.
  }

  // 4c) Toplam etki: mali değer = iş kalemi adam-saat; puan = iş kalemi + meslek.
  const impactValueTRY = taskImpactValueTRY;
  const impactPointsTotal = taskImpactPoints + userProfessionImpactPoints;

  // 5) Completion doc yaz — ANINDA onaylanmış.
  const completionRef = db.collection(COLLECTIONS.volunteerCompletions).doc();
  const completionId = completionRef.id;
  await completionRef.set({
    id: completionId,
    userId,
    taskId: volunteeringId,
    ngoId,
    completedAt: FieldValue.serverTimestamp(),
    hoursLogged: hours,
    // İş kalemi snapshot (taskType)
    professionId: profession.id,
    professionLabel: profession.label,
    hourlyRateAtTime: profession.hourlyRate,
    pointsPerHourAtTime: taskPointsPerHour,
    taskImpactPoints,
    taskImpactValueTRY,
    // Gönüllü mesleği snapshot
    userProfessionId,
    userProfessionPointsPerHour,
    userProfessionHourlyRate,
    userProfessionImpactPoints,
    userProfessionImpactValueTRY,
    // Toplam
    impactValueTRY,
    impactPointsTotal,
    // Yönetici girdiği için anında onaylı
    ngoApproved: true,
    approvedAt: FieldValue.serverTimestamp(),
    approvedBy: actor.uid,
    enteredBy: actor.uid,
    certificateIssued: true,
    status: 'approved',
    ...(notes ? { notes } : {}),
    createdAt: FieldValue.serverTimestamp(),
  });

  // 6) User stats güncelle (increment — race-safe)
  await userRef.set(
    {
      stats: {
        totalImpactValue: FieldValue.increment(impactValueTRY),
        totalImpactPoints: FieldValue.increment(impactPointsTotal),
        volunteerHours: FieldValue.increment(hours),
        completedProjects: FieldValue.increment(1),
      },
    },
    { merge: true },
  );

  // 7) pastVolunteering özet — profil etki sekmesi + rozet alan-puanı.
  await userRef.collection(COLLECTIONS.pastVolunteering).add({
    volunteeringId,
    volunteeringTitle: oppTitle,
    ngoId,
    ngoName,
    completionId,
    taskTypeId: profession.id,
    taskTypeName: profession.label,
    manHourCost: profession.hourlyRate,
    ...(badgeArea ? { socialArea: badgeArea } : {}),
    points: impactPointsTotal,
    hoursLogged: hours,
    impactValueTRY,
    impactPointsTotal,
    completedAt: FieldValue.serverTimestamp(),
  });

  // 8) Rozet motoru — yeni tier aşıldıysa rozet yaz + bildir (best-effort).
  let newBadges: unknown[] = [];
  try {
    const award = await awardBadgesForUser(db, userId, { notify: true });
    newBadges = award.newBadges;
  } catch (e) {
    console.warn('[volunteering/complete-volunteer] badge award failed', e);
  }

  // 9) Gönüllüye teşekkür + "değerlendir misiniz?" CTA → /volunteering/{id}
  //    (orada Değerlendir butonu var).
  const subject = 'Tamamlaman onaylandı, sertifikan hazır 🧡';
  const content =
    `"${oppTitle}" görevini başarıyla tamamladın. ${ngoName} ${hours} saatlik katkını onayladı. ` +
    `${impactPointsTotal.toLocaleString('tr-TR')} puan ve ${impactValueTRY.toLocaleString('tr-TR')} ₺ sosyal etki değeri kazandın. ` +
    `Deneyimini birkaç saniyede değerlendirir misin? Görüşün ${ngoName} için çok değerli.`;

  await notifyUser({
    userId,
    type: 'volunteer_completion_approved',
    title: subject,
    body: content,
    link: `/volunteering/${volunteeringId}`,
    data: {
      completionId,
      taskId: volunteeringId,
      ngoId,
      impactValueTRY,
      impactPoints: impactPointsTotal,
      cta: 'evaluate',
    },
    storeAsMessage: true,
    messageSubject: subject,
    messageContent: content,
    messageMeta: {
      kind: 'volunteer_completion_approved',
      completionId,
      taskId: volunteeringId,
      ngoId,
      impactValueTRY,
      cta: 'evaluate',
    },
  });

  return NextResponse.json({
    ok: true,
    completionId,
    impactValueTRY,
    impactPoints: impactPointsTotal,
    hoursLogged: hours,
    professionLabel: profession.label,
    certificateIssued: true,
    newBadges,
  });
}
