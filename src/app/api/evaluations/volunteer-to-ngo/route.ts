/**
 * POST /api/evaluations/volunteer-to-ngo
 *
 * Gönüllü, tamamladığı faaliyet için STK'yı + faaliyeti 10 soruda
 * (1-5 Likert) değerlendirir. Yalnızca `volunteer_to_ngo` yönünü yazar.
 *
 * Auth: Bearer ID token → volunteerId = uid (gönüllü kendi adına yazar).
 *
 * Body:
 *   {
 *     kind: 'volunteer' | 'event',
 *     refId: string,                    // volunteerCompletion id / event id
 *     ngoId: string,
 *     answers: Record<string, number>,  // 10 soru, her biri 1-5
 *     comment?: string
 *   }
 *
 * Davranış: evaluations/{evalDocId(kind, refId, uid)} doc'unu merge'ler:
 *   - volunteerToNgo = { answers, score (avg), comment, completedAt }
 *   - meta: volunteerId, ngoId, kind, refId, createdAt (ilk yazımda)
 *
 * Response: { ok: true, evalId, score } | { errorCode, message }
 *
 * Not: Yalnızca Admin SDK yazar (firestore.rules → evaluations write: false).
 */

import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';

import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { checkRateLimit } from '@/lib/rate-limit';
import {
  avgScore,
  evalDocId,
  VOLUNTEER_TO_NGO_QUESTIONS,
} from '@/lib/evaluations';

export const runtime = 'nodejs';

const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_MS = 60_000;

const VALID_QUESTION_IDS = VOLUNTEER_TO_NGO_QUESTIONS.map((q) => q.id);

const BodySchema = z.object({
  kind: z.enum(['volunteer', 'event']),
  refId: z.string().trim().min(1).max(128),
  ngoId: z.string().trim().min(1).max(128),
  answers: z
    .record(z.string(), z.number().int().min(1).max(5))
    .refine(
      (a) => VALID_QUESTION_IDS.every((id) => typeof a[id] === 'number'),
      { message: 'Tüm sorular cevaplanmalı.' },
    ),
  comment: z.string().trim().max(2000).optional(),
});

function getClientIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for');
  const first = xff?.split(',')[0]?.trim();
  if (first) return first;
  const xri = req.headers.get('x-real-ip');
  if (xri) return xri.trim();
  return 'unknown';
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ errorCode: 'NO_AUTH', message: 'Authorization gerekli.' }, { status: 401 });
  }
  const idToken = authHeader.slice('Bearer '.length).trim();

  let volunteerId: string;
  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken);
    volunteerId = decoded.uid;
  } catch {
    return NextResponse.json({ errorCode: 'INVALID_TOKEN', message: 'Geçersiz oturum.' }, { status: 401 });
  }

  const { allowed, resetAt } = await checkRateLimit({
    bucket: 'eval-volunteer-to-ngo',
    key: volunteerId,
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

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch (e) {
    const message = e instanceof z.ZodError ? e.issues[0]?.message ?? 'Geçersiz veri.' : 'Body okunamadı.';
    return NextResponse.json({ errorCode: 'INVALID_BODY', message }, { status: 400 });
  }

  const { kind, refId, ngoId, answers, comment } = body;
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
        // gönüllü yönü
        volunteerToNgo: {
          answers,
          score,
          comment: comment ?? '',
          completedAt: FieldValue.serverTimestamp(),
        },
      },
      { merge: true },
    );
  } catch (e) {
    console.error('[evaluations/volunteer-to-ngo] write failed', e);
    return NextResponse.json(
      { errorCode: 'WRITE_FAILED', message: 'Değerlendirme kaydedilemedi.' },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, evalId, score });
}
