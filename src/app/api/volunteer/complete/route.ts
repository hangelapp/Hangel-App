/**
 * POST /api/volunteer/complete
 *
 * Kullanıcı bir gönüllü görevini tamamladıktan sonra saat + meslek girer.
 * Endpoint `volunteerCompletions/{id}` doc'unu pending (ngoApproved: false)
 * statüsünde oluşturur ve STK admin'e bildirim gönderir. Onay sonrası
 * etki değeri user.stats.totalImpactValue'ya eklenir (approve route).
 *
 * Body:
 *   {
 *     taskId: string,            // volunteering opp id (veya event id)
 *     hoursLogged: number,       // > 0
 *     professionId?: string,     // volunteerScoring doc id; verilmezse user profile profession ile eşle
 *     notes?: string,
 *   }
 *
 * Auth: signed-in user; sadece kendi başvurusu için tamamlama açabilir.
 * Validation: user task'a başvurmuş ve başvurusu 'Onaylandı' durumunda olmalı.
 *
 * Response: { ok: true, completionId, impactValueTRY } | { errorCode, error }
 *
 * Cevap formatı CLAUDE.md kuralına uyar: { errorCode, error } — raw exception
 * mesajları kullanıcıya sızdırılmaz.
 */

import { NextRequest, NextResponse } from 'next/server';
import { FieldValue, type Firestore } from 'firebase-admin/firestore';
import { z } from 'zod';

import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import {
  calculateUserImpactValue,
  findProfession,
  findProfessionByLabel,
  type ProfessionRate,
} from '@/lib/volunteer-impact';
import { sendPushToUser } from '@/lib/push-notifications';

export const runtime = 'nodejs';

const BodySchema = z.object({
  taskId: z.string().trim().min(1, 'taskId zorunlu'),
  hoursLogged: z.number().positive('hoursLogged > 0 olmalı').max(24 * 31, 'Tek seferde 31 günden fazla saat girilemez'),
  professionId: z.string().trim().min(1).optional(),
  notes: z.string().trim().max(2000).optional(),
});

async function verifyAuth(
  req: NextRequest,
): Promise<{ uid: string } | { error: NextResponse }> {
  const h = req.headers.get('authorization');
  if (!h?.startsWith('Bearer ')) {
    return { error: NextResponse.json({ errorCode: 'NO_AUTH', error: 'Token gerekli' }, { status: 401 }) };
  }
  try {
    const decoded = await getAdminAuth().verifyIdToken(h.slice('Bearer '.length).trim());
    return { uid: decoded.uid };
  } catch {
    return { error: NextResponse.json({ errorCode: 'INVALID_TOKEN', error: 'Geçersiz token' }, { status: 401 }) };
  }
}

/**
 * Kullanıcı için profession seçimi:
 *   1. Body'deki professionId varsa onu kullan
 *   2. Yoksa user.volunteerInfo.profession (label) ile katalogu eşle
 *   3. Hiçbiri tutmazsa null — caller "PROFESSION_REQUIRED" döner
 */
async function resolveProfession(
  db: Firestore,
  uid: string,
  professionIdFromBody: string | undefined,
): Promise<ProfessionRate | null> {
  if (professionIdFromBody) {
    const p = await findProfession(db, professionIdFromBody);
    if (p) return p;
  }
  const userSnap = await db.collection(COLLECTIONS.users).doc(uid).get();
  if (!userSnap.exists) return null;
  const u = userSnap.data() as { volunteerInfo?: { profession?: string | null } };
  const label = u.volunteerInfo?.profession ?? '';
  if (!label) return null;
  return findProfessionByLabel(db, label);
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const auth = await verifyAuth(req);
  if ('error' in auth) return auth.error;
  const uid = auth.uid;

  const raw = await req.json().catch(() => ({}));
  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { errorCode: 'INVALID_BODY', error: parsed.error.issues[0]?.message ?? 'Body geçersiz' },
      { status: 400 },
    );
  }
  const { taskId, hoursLogged, professionId, notes } = parsed.data;

  const db = getAdminFirestore();

  // 1) Volunteering opp (task) doğrula → ngoId çek
  const oppSnap = await db.collection(COLLECTIONS.volunteering).doc(taskId).get();
  if (!oppSnap.exists) {
    return NextResponse.json(
      { errorCode: 'TASK_NOT_FOUND', error: 'Görev bulunamadı' },
      { status: 404 },
    );
  }
  const opp = oppSnap.data() as { ngoId?: string; ngoName?: string; title?: string };
  const ngoId = opp.ngoId ?? '';
  if (!ngoId) {
    return NextResponse.json(
      { errorCode: 'INVALID_TASK', error: 'Görevde ngoId yok' },
      { status: 400 },
    );
  }

  // 2) User başvurmuş ve onaylanmış mı? (applications collection, entityId == taskId)
  const appQuery = await db
    .collection(COLLECTIONS.applications)
    .where('userId', '==', uid)
    .where('entityId', '==', taskId)
    .limit(1)
    .get();
  if (appQuery.empty) {
    return NextResponse.json(
      { errorCode: 'NOT_APPLIED', error: 'Bu göreve başvurun bulunamadı' },
      { status: 403 },
    );
  }
  const appDoc = appQuery.docs[0];
  if (!appDoc) {
    return NextResponse.json(
      { errorCode: 'NOT_APPLIED', error: 'Bu göreve başvurun bulunamadı' },
      { status: 403 },
    );
  }
  const application = appDoc.data() as { status?: string };
  if (application.status !== 'Onaylandı') {
    return NextResponse.json(
      { errorCode: 'APPLICATION_NOT_APPROVED', error: 'Başvurun henüz onaylanmamış' },
      { status: 403 },
    );
  }

  // 3) Aynı user+task için zaten bekleyen/onaylı completion varsa engelle (idempotency)
  const dupQuery = await db
    .collection(COLLECTIONS.volunteerCompletions)
    .where('userId', '==', uid)
    .where('taskId', '==', taskId)
    .limit(1)
    .get();
  if (!dupQuery.empty) {
    return NextResponse.json(
      { errorCode: 'COMPLETION_EXISTS', error: 'Bu görev için zaten bir tamamlama kaydın var' },
      { status: 409 },
    );
  }

  // 4) Profession + rate çöz
  const profession = await resolveProfession(db, uid, professionId);
  if (!profession) {
    return NextResponse.json(
      {
        errorCode: 'PROFESSION_REQUIRED',
        error: 'Meslek seçimi gerekli — profil > meslek alanını doldur veya professionId gönder',
      },
      { status: 400 },
    );
  }

  // 5) Etki değeri (snapshot) — C3 utility
  const impactValueTRY = calculateUserImpactValue(hoursLogged, profession.hourlyRate);

  // 6) Completion doc yaz (pending)
  const completionRef = db.collection(COLLECTIONS.volunteerCompletions).doc();
  const startedAtFromApp = (appDoc.data() as { approvedAt?: FirebaseFirestore.Timestamp }).approvedAt;
  await completionRef.set({
    id: completionRef.id,
    userId: uid,
    taskId,
    ngoId,
    startedAt: startedAtFromApp ?? FieldValue.serverTimestamp(),
    completedAt: FieldValue.serverTimestamp(),
    hoursLogged,
    professionId: profession.id,
    professionLabel: profession.label,
    hourlyRateAtTime: profession.hourlyRate,
    impactValueTRY,
    ngoApproved: false,
    certificateIssued: false,
    ...(notes ? { notes } : {}),
    createdAt: FieldValue.serverTimestamp(),
  });

  // 7) STK admin'e bildirim — managedNgoId == ngoId olan kullanıcılar
  const adminQuery = await db
    .collection(COLLECTIONS.users)
    .where('managedNgoId', '==', ngoId)
    .where('role', '==', 'ngo-admin')
    .limit(10)
    .get();

  const taskTitle = opp.title ?? 'Gönüllülük görevi';
  const notifTitle = 'Tamamlama incelemesi bekliyor';
  const notifBody = `"${taskTitle}" görevini bir gönüllü tamamladı. Onayını bekliyor.`;

  await Promise.all(
    adminQuery.docs.map(async (adminDoc) => {
      const adminUid = adminDoc.id;
      await db
        .collection(COLLECTIONS.users)
        .doc(adminUid)
        .collection(COLLECTIONS.notifications)
        .add({
          userId: adminUid,
          type: 'volunteer_completion_pending_review',
          title: notifTitle,
          body: notifBody.slice(0, 160),
          completionId: completionRef.id,
          taskId,
          ngoId,
          volunteerUid: uid,
          read: false,
          pushSent: true,
          createdAt: FieldValue.serverTimestamp(),
        });
      try {
        await sendPushToUser(adminUid, {
          title: notifTitle,
          body: notifBody,
          clickAction: `/ngo-admin/volunteer-completions/${completionRef.id}`,
          data: {
            type: 'volunteer_completion_pending_review',
            completionId: completionRef.id,
            taskId,
          },
        });
      } catch (e) {
        console.warn('[volunteer/complete] admin push failed', adminUid, e);
      }
    }),
  );

  return NextResponse.json({
    ok: true,
    completionId: completionRef.id,
    impactValueTRY,
    professionLabel: profession.label,
  });
}
