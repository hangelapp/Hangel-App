/**
 * POST /api/evaluations/ngo-to-volunteer
 *
 * STK admini, faaliyeti tamamlayan gönüllüyü 10 soruda (1-5 Likert) +
 * serbest yorumla değerlendirir. Yalnızca `ngo_to_volunteer` yönünü yazar.
 *
 * Bu yön tamamlanınca gönüllünün sertifikası "kilidi açılır"
 * (certificateUnlocked: true) ve gönüllüye "sertifikan hazır" bildirimi gider.
 *
 * Auth: Bearer ID token → çağıran STK admini (managedNgoId == body.ngoId)
 *       veya super-admin. requireNgoAdminForRoute ile doğrulanır.
 *
 * Body:
 *   {
 *     kind: 'volunteer' | 'event',
 *     refId: string,
 *     ngoId: string,                    // değerlendirme yapan STK
 *     volunteerId: string,              // değerlendirilen gönüllü
 *     answers: Record<string, number>,  // 10 soru, her biri 1-5
 *     comment?: string
 *   }
 *
 * Davranış: evaluations/{evalDocId(kind, refId, volunteerId)} merge:
 *   - ngoToVolunteer = { answers, score (avg), comment, completedAt }
 *   - certificateUnlocked = true
 *   - meta: volunteerId, ngoId, kind, refId, createdAt (ilk yazımda)
 *   + notifyUser → type 'certificate_ready'
 *
 * Response: { ok: true, evalId, score } | { errorCode, message }
 *
 * Not: Yalnızca Admin SDK yazar (firestore.rules → evaluations write: false).
 */

import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';

import { getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { requireNgoAdminForRoute } from '@/lib/auth/require-ngo-admin';
import { checkRateLimit } from '@/lib/rate-limit';
import { notifyUser } from '@/lib/notify-user';
import {
  avgScore,
  evalDocId,
  NGO_TO_VOLUNTEER_QUESTIONS,
} from '@/lib/evaluations';

export const runtime = 'nodejs';

const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW_MS = 60_000;

const VALID_QUESTION_IDS = NGO_TO_VOLUNTEER_QUESTIONS.map((q) => q.id);

const BodySchema = z.object({
  kind: z.enum(['volunteer', 'event']),
  refId: z.string().trim().min(1).max(128),
  ngoId: z.string().trim().min(1).max(128),
  volunteerId: z.string().trim().min(1).max(128),
  answers: z
    .record(z.string(), z.number().int().min(1).max(5))
    .refine(
      (a) => VALID_QUESTION_IDS.every((id) => typeof a[id] === 'number'),
      { message: 'Tüm sorular cevaplanmalı.' },
    ),
  comment: z.string().trim().max(2000).optional(),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Body'i auth'tan önce parse et — super-admin için targetNgoId gerekiyor.
  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch (e) {
    const message = e instanceof z.ZodError ? e.issues[0]?.message ?? 'Geçersiz veri.' : 'Body okunamadı.';
    return NextResponse.json({ errorCode: 'INVALID_BODY', message }, { status: 400 });
  }

  const { kind, refId, ngoId, volunteerId, answers, comment } = body;

  // Auth: STK admini (managedNgoId == ngoId) veya super-admin (targetNgoId).
  const auth = await requireNgoAdminForRoute(req, {
    allowSuperAdmin: true,
    targetNgoId: ngoId,
  });
  if (auth.error) return auth.error;
  const actor = auth.actor;

  // STK admini yalnızca kendi STK'sı adına değerlendirme yazabilir.
  if (!actor.isSuperAdmin && actor.ngoId !== ngoId) {
    return NextResponse.json(
      { errorCode: 'FORBIDDEN', message: 'Bu STK adına değerlendirme yapamazsınız.' },
      { status: 403 },
    );
  }

  const { allowed, resetAt } = await checkRateLimit({
    bucket: 'eval-ngo-to-volunteer',
    key: actor.uid,
    limit: RATE_LIMIT_MAX,
    windowMs: RATE_LIMIT_WINDOW_MS,
  });
  if (!allowed) {
    const retryAfterMs = Math.max(0, resetAt - Date.now());
    return NextResponse.json(
      { errorCode: 'RATE_LIMITED', message: 'Çok fazla istek. Lütfen biraz bekleyin.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) } },
    );
  }

  const score = avgScore(answers);
  const evalId = evalDocId(kind, refId, volunteerId);

  const db = getAdminFirestore();
  try {
    await db.collection(COLLECTIONS.evaluations).doc(evalId).set(
      {
        // meta (ilk yazımda set; merge ile var olan korunur)
        volunteerId,
        ngoId,
        kind,
        refId,
        createdAt: FieldValue.serverTimestamp(),
        // STK yönü
        ngoToVolunteer: {
          answers,
          score,
          comment: comment ?? '',
          completedAt: FieldValue.serverTimestamp(),
        },
        // STK değerlendirmesi tamamlandı → sertifika kilidi açıldı
        certificateUnlocked: true,
      },
      { merge: true },
    );
  } catch (e) {
    console.error('[evaluations/ngo-to-volunteer] write failed', e);
    return NextResponse.json(
      { errorCode: 'WRITE_FAILED', message: 'Değerlendirme kaydedilemedi.' },
      { status: 500 },
    );
  }

  // Sertifika kilidi açıldı bildirimi (best-effort — notifyUser asla throw etmez).
  await notifyUser({
    userId: volunteerId,
    type: 'certificate_ready',
    title: 'Sertifikan hazır 🧡',
    body: 'Değerlendirmen tamamlandı, sertifikan hazır 🧡',
    link: '/profile?tab=etki',
    data: { evalId, kind, refId, ngoId },
  });

  return NextResponse.json({ ok: true, evalId, score });
}
